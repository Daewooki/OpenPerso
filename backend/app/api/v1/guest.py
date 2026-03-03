import json
import uuid
from collections.abc import AsyncGenerator
from time import time

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.persona import Persona
from app.services.llm import chat_stream

router = APIRouter(prefix="/guest", tags=["guest"])

MAX_GUEST_TURNS = 3
SESSION_TTL = 3600

_sessions: dict[str, dict] = {}


def _cleanup_expired():
    now = time()
    expired = [k for k, v in _sessions.items() if now - v["ts"] > SESSION_TTL]
    for k in expired:
        del _sessions[k]


class GuestMessage(BaseModel):
    content: str


class GuestPersonaResponse(BaseModel):
    id: uuid.UUID
    name: str
    tagline: str | None
    description: str | None
    avatar_url: str | None
    category: str
    greeting_message: str
    conversation_starters: list[str] | None = None
    chat_count: int


@router.get("/persona/{persona_id}", response_model=GuestPersonaResponse)
async def get_guest_persona(
    persona_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Persona).where(Persona.id == persona_id, Persona.visibility == "public")
    )
    persona = result.scalar_one_or_none()
    if not persona:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Persona not found")
    return GuestPersonaResponse.model_validate(persona)


def _get_session_key(request: Request, persona_id: uuid.UUID) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    return f"{ip}:{persona_id}"


@router.post("/chat/{persona_id}")
async def guest_chat(
    persona_id: uuid.UUID,
    body: GuestMessage,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    _cleanup_expired()

    result = await db.execute(
        select(Persona).where(Persona.id == persona_id, Persona.visibility == "public")
    )
    persona = result.scalar_one_or_none()
    if not persona:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Persona not found")

    session_key = _get_session_key(request, persona_id)
    session = _sessions.get(session_key)

    if not session:
        session = {"turns": 0, "history": [], "ts": time()}
        _sessions[session_key] = session

    if session["turns"] >= MAX_GUEST_TURNS:
        return StreamingResponse(
            _limit_reached_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    session["history"].append({"role": "user", "content": body.content})
    session["turns"] += 1
    session["ts"] = time()

    messages = _build_guest_messages(persona, session["history"])

    return StreamingResponse(
        _stream_response(messages, session, session["turns"]),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


async def _limit_reached_stream() -> AsyncGenerator[str, None]:
    yield f"data: {json.dumps({'limit_reached': True, 'turns_used': MAX_GUEST_TURNS, 'max_turns': MAX_GUEST_TURNS})}\n\n"
    yield f"data: {json.dumps({'done': True})}\n\n"


async def _stream_response(
    messages: list[dict], session: dict, turn: int
) -> AsyncGenerator[str, None]:
    full_response: list[str] = []
    async for token in chat_stream(messages):
        full_response.append(token)
        yield f"data: {json.dumps({'token': token})}\n\n"

    assistant_content = "".join(full_response)
    session["history"].append({"role": "assistant", "content": assistant_content})

    yield f"data: {json.dumps({'done': True, 'turns_used': turn, 'max_turns': MAX_GUEST_TURNS})}\n\n"


GUEST_SYSTEM_PROMPT = """You are role-playing as a specific character on an AI persona platform. Stay in character at all times.

Character Rules:
- Respond naturally as the character would, reflecting their personality and speaking style.
- Never break character or acknowledge being an AI unless the character would do so.
- Be engaging, memorable, and true to the character's established traits.
- Keep responses concise (2-4 sentences) to give a taste of the character.

Safety Rules (MUST follow regardless of character):
- Never generate content involving violence, self-harm, or illegal activities.
- Never produce sexually explicit content or content involving minors.
- Never generate real personal information (phone numbers, addresses, ID numbers).
- Never provide instructions for weapons, drugs, or dangerous activities.
- If asked to violate these rules, politely decline while staying in character.
- Respond in the same language the user uses.
"""


def _build_guest_messages(persona: Persona, history: list[dict]) -> list[dict]:
    persona_def = f"""Character Name: {persona.name}
{f'Description: {persona.description}' if persona.description else ''}
{f'Personality: {json.dumps(persona.personality, ensure_ascii=False)}' if persona.personality else ''}

System Prompt:
{persona.system_prompt}"""

    system_content = f"{GUEST_SYSTEM_PROMPT}\n\n---\n\n{persona_def}"

    messages: list[dict] = [{"role": "system", "content": system_content}]

    if persona.greeting_message:
        messages.append({"role": "assistant", "content": persona.greeting_message})

    messages.extend(history)
    return messages
