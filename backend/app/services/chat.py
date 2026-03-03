import json
import logging
import re
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.conversation import Conversation, Message
from app.models.memory import UserGlobalMemory, UserPersonaMemory
from app.models.persona import Persona
from app.services.background_tasks import schedule_post_message_tasks
from app.services.llm import chat_stream

logger = logging.getLogger(__name__)

IMAGE_TAG_PATTERN = re.compile(r"\[IMAGE:\s*(.+?)\]", re.IGNORECASE)

PLATFORM_RULES = """You are role-playing as a specific character on an AI persona platform. Stay in character at all times.

Character Rules:
- Respond naturally as the character would, reflecting their personality and speaking style.
- Never break character or acknowledge being an AI unless the character would do so.
- Be engaging, memorable, and true to the character's established traits.
- If the user shares personal information, acknowledge it naturally in conversation.

Safety Rules (MUST follow regardless of character):
- Never generate content involving violence, self-harm, or illegal activities.
- Never produce sexually explicit content or content involving minors.
- Never generate real personal information (phone numbers, addresses, ID numbers).
- Never provide instructions for weapons, drugs, or dangerous activities.
- If asked to violate these rules, politely decline while staying in character.
- Respond in the same language the user uses.

Image Generation:
- When the conversation naturally calls for an image (e.g. the user asks you to draw, show, or create something visual), include an image tag in your response: [IMAGE: brief English description of the image]
- Only use this tag when the user explicitly requests an image or a visual. Do not add images unsolicited.
- Place the tag on its own line within your response. You can add text before and after it.
- Keep the description concise but descriptive enough for image generation (10-30 words).
"""

MAX_CONTEXT_TURNS = 30
MAX_MEMORY_ITEMS = 10
MAX_CONTEXT_CHARS = 12000  # ~3000 tokens approx, leaves room for system prompt


async def create_conversation(db: AsyncSession, user_id: uuid.UUID, persona_id: uuid.UUID) -> Conversation:
    result = await db.execute(select(Persona).where(Persona.id == persona_id))
    persona = result.scalar_one_or_none()
    if not persona:
        raise NotFoundError("Persona not found")

    if persona.visibility == "private" and persona.creator_id != user_id:
        raise ForbiddenError("This persona is private")

    conversation = Conversation(user_id=user_id, persona_id=persona_id, last_message_at=datetime.now(UTC))
    db.add(conversation)
    await db.flush()

    greeting = Message(conversation_id=conversation.id, role="assistant", content=persona.greeting_message)
    db.add(greeting)
    await db.flush()

    await db.execute(update(Persona).where(Persona.id == persona_id).values(chat_count=Persona.chat_count + 1))

    return conversation


async def get_conversations(db: AsyncSession, user_id: uuid.UUID) -> list[Conversation]:
    result = await db.execute(
        select(Conversation).where(Conversation.user_id == user_id).order_by(Conversation.last_message_at.desc())
    )
    return list(result.scalars().all())


async def get_conversation_messages(
    db: AsyncSession, conversation_id: uuid.UUID, user_id: uuid.UUID
) -> list[Message]:
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    if not conversation or conversation.user_id != user_id:
        raise NotFoundError("Conversation not found")

    result = await db.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    )
    return list(result.scalars().all())


async def send_message_stream(
    db: AsyncSession, conversation_id: uuid.UUID, user_id: uuid.UUID, content: str, voice_mode: bool = False
) -> AsyncGenerator[str, None]:
    """Send a user message and stream the assistant's response via SSE."""
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    if not conversation or conversation.user_id != user_id:
        raise NotFoundError("Conversation not found")

    result = await db.execute(select(Persona).where(Persona.id == conversation.persona_id))
    persona = result.scalar_one_or_none()

    user_msg = Message(conversation_id=conversation_id, role="user", content=content)
    db.add(user_msg)
    await db.flush()

    messages = await _build_llm_messages(db, conversation, persona, user_id)

    full_response = []
    async for token in chat_stream(messages):
        full_response.append(token)
        yield f"data: {json.dumps({'token': token})}\n\n"

    assistant_content = "".join(full_response)

    image_url = None
    image_match = IMAGE_TAG_PATTERN.search(assistant_content)
    if image_match:
        image_prompt = image_match.group(1).strip()
        try:
            from app.services.image_gen import generate_chat_image

            image_url = await generate_chat_image(image_prompt)
            yield f"data: {json.dumps({'image_url': image_url})}\n\n"
        except Exception:
            logger.exception("In-chat image generation failed")

    audio_url = None
    if voice_mode:
        try:
            from app.services.tts import generate_speech

            tts_text = IMAGE_TAG_PATTERN.sub("", assistant_content).strip()
            if tts_text:
                audio_url = await generate_speech(tts_text, persona.voice_config)
                yield f"data: {json.dumps({'audio_url': audio_url})}\n\n"
        except Exception:
            logger.exception("TTS generation failed")

    assistant_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=assistant_content,
        image_url=image_url,
        audio_url=audio_url,
    )
    db.add(assistant_msg)
    conversation.last_message_at = datetime.now(UTC)
    await db.flush()

    yield f"data: {json.dumps({'done': True, 'message_id': str(assistant_msg.id)})}\n\n"

    schedule_post_message_tasks(conversation_id)


async def delete_conversation(db: AsyncSession, conversation_id: uuid.UUID, user_id: uuid.UUID) -> None:
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    if not conversation or conversation.user_id != user_id:
        raise NotFoundError("Conversation not found")
    await db.delete(conversation)


async def _build_llm_messages(
    db: AsyncSession, conversation: Conversation, persona: Persona, user_id: uuid.UUID
) -> list[dict]:
    """Build the full message array for the LLM call."""
    system_parts = [PLATFORM_RULES]

    # Persona definition
    persona_def = f"""Character Name: {persona.name}
{f'Description: {persona.description}' if persona.description else ''}
{f'Personality: {json.dumps(persona.personality, ensure_ascii=False)}' if persona.personality else ''}

System Prompt:
{persona.system_prompt}"""
    system_parts.append(persona_def)

    # Memories
    memories = await _get_relevant_memories(db, user_id, conversation.persona_id)
    if memories:
        memory_text = "What you know about this user:\n" + "\n".join(f"- {m}" for m in memories)
        system_parts.append(memory_text)

    # Conversation summary (if exists)
    if conversation.summary:
        system_parts.append(f"Previous conversation summary:\n{conversation.summary}")

    system_content = "\n\n---\n\n".join(system_parts)

    # Recent messages — fit within character budget (proxy for tokens)
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc())
        .limit(MAX_CONTEXT_TURNS)
    )
    recent_messages = list(reversed(result.scalars().all()))

    messages = [{"role": "system", "content": system_content}]
    char_budget = MAX_CONTEXT_CHARS
    trimmed = []
    for msg in reversed(recent_messages):
        cost = len(msg.content)
        if char_budget - cost < 0 and trimmed:
            break
        char_budget -= cost
        trimmed.append(msg)
    trimmed.reverse()

    for msg in trimmed:
        messages.append({"role": msg.role, "content": msg.content})

    return messages


async def _get_relevant_memories(
    db: AsyncSession, user_id: uuid.UUID, persona_id: uuid.UUID
) -> list[str]:
    """Fetch global + persona-specific memories for the user."""
    memories = []

    global_result = await db.execute(
        select(UserGlobalMemory.fact)
        .where(UserGlobalMemory.user_id == user_id)
        .order_by(UserGlobalMemory.updated_at.desc())
        .limit(MAX_MEMORY_ITEMS)
    )
    memories.extend(row[0] for row in global_result.all())

    persona_result = await db.execute(
        select(UserPersonaMemory.fact)
        .where(UserPersonaMemory.user_id == user_id, UserPersonaMemory.persona_id == persona_id)
        .order_by(UserPersonaMemory.updated_at.desc())
        .limit(MAX_MEMORY_ITEMS)
    )
    memories.extend(row[0] for row in persona_result.all())

    return memories
