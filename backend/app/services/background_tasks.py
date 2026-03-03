"""Background tasks for conversation title generation and summarization."""

import asyncio
import logging
import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.conversation import Conversation, Message
from app.services.llm import chat_complete

logger = logging.getLogger(__name__)

TITLE_GEN_PROMPT = """Based on the following conversation, generate a very short title (max 25 characters) in Korean.
Only output the title, nothing else. No quotes, no explanation.

Conversation:
{messages}"""

SUMMARY_PROMPT = """Summarize the following conversation in 3-5 sentences in Korean.
Focus on the key topics discussed and any important information shared.
Only output the summary, nothing else.

Conversation:
{messages}"""

TITLE_TRIGGER_COUNT = 3
SUMMARY_TRIGGER_COUNT = 20


def _format_messages(messages: list[Message], limit: int = 10) -> str:
    recent = messages[-limit:]
    return "\n".join(f"{m.role}: {m.content[:200]}" for m in recent)


async def maybe_generate_title(conversation_id: uuid.UUID) -> None:
    """Generate a title after the first few messages if none exists."""
    try:
        async with async_session() as db:
            result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
            conv = result.scalar_one_or_none()
            if not conv or conv.title:
                return

            msg_count = await db.execute(
                select(func.count()).select_from(Message).where(Message.conversation_id == conversation_id)
            )
            count = msg_count.scalar() or 0
            if count < TITLE_TRIGGER_COUNT:
                return

            result = await db.execute(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at)
                .limit(6)
            )
            messages = list(result.scalars().all())
            formatted = _format_messages(messages)

            title = await chat_complete(
                messages=[{"role": "user", "content": TITLE_GEN_PROMPT.format(messages=formatted)}],
                use_sub=True,
                temperature=0.3,
            )
            title = title.strip().strip('"').strip("'")[:200]

            if title:
                await db.execute(
                    update(Conversation).where(Conversation.id == conversation_id).values(title=title)
                )
                await db.commit()
                logger.info("Generated title for conversation %s: %s", conversation_id, title)
    except Exception:
        logger.exception("Failed to generate title for conversation %s", conversation_id)


async def maybe_summarize_conversation(conversation_id: uuid.UUID) -> None:
    """Summarize the conversation when message count exceeds the threshold."""
    try:
        async with async_session() as db:
            msg_count = await db.execute(
                select(func.count()).select_from(Message).where(Message.conversation_id == conversation_id)
            )
            count = msg_count.scalar() or 0
            if count < SUMMARY_TRIGGER_COUNT or count % SUMMARY_TRIGGER_COUNT != 0:
                return

            result = await db.execute(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at)
            )
            messages = list(result.scalars().all())
            formatted = _format_messages(messages, limit=30)

            summary = await chat_complete(
                messages=[{"role": "user", "content": SUMMARY_PROMPT.format(messages=formatted)}],
                use_sub=True,
                temperature=0.3,
            )
            summary = summary.strip()

            if summary:
                await db.execute(
                    update(Conversation).where(Conversation.id == conversation_id).values(summary=summary)
                )
                await db.commit()
                logger.info("Generated summary for conversation %s", conversation_id)
    except Exception:
        logger.exception("Failed to summarize conversation %s", conversation_id)


def schedule_post_message_tasks(conversation_id: uuid.UUID) -> None:
    """Fire-and-forget background tasks after a message is sent."""
    loop = asyncio.get_event_loop()
    loop.create_task(maybe_generate_title(conversation_id))
    loop.create_task(maybe_summarize_conversation(conversation_id))
