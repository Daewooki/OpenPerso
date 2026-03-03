import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.exceptions import UsageLimitError
from app.database import get_db
from app.models.persona import Persona
from app.models.user import User
from app.schemas.chat import ConversationCreate, ConversationResponse, MessageCreate, MessageResponse
from app.services.chat import (
    create_conversation,
    delete_conversation,
    get_conversation_messages,
    get_conversations,
    send_message_stream,
)
from app.services.memory import extract_realtime_facts
from app.services.usage import check_and_increment

router = APIRouter(prefix="/chat", tags=["chat"])


async def _enrich_conversations(db: AsyncSession, conversations):
    """Add persona_name and persona_avatar_url to conversation responses."""
    results = []
    for conv in conversations:
        persona_result = await db.execute(select(Persona).where(Persona.id == conv.persona_id))
        persona = persona_result.scalar_one_or_none()
        data = ConversationResponse.model_validate(conv)
        if persona:
            data.persona_name = persona.name
            data.persona_avatar_url = persona.avatar_url
            data.persona_category = persona.category
            data.conversation_starters = persona.conversation_starters
        results.append(data)
    return results


@router.post("/conversations", response_model=ConversationResponse)
async def create(
    body: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = await create_conversation(db, current_user.id, body.persona_id)
    enriched = await _enrich_conversations(db, [conversation])
    return enriched[0]


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversations = await get_conversations(db, current_user.id)
    return await _enrich_conversations(db, conversations)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_conversation_messages(db, conversation_id, current_user.id)


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: uuid.UUID,
    body: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    usage = await check_and_increment(str(current_user.id), current_user.tier, "messages")
    if not usage["allowed"]:
        raise UsageLimitError(
            detail=f"오늘의 무료 대화 횟수({usage['limit']}회)를 모두 사용했습니다. 내일 다시 이용해주세요."
        )

    if body.voice_mode:
        tts_usage = await check_and_increment(str(current_user.id), current_user.tier, "tts")
        if not tts_usage["allowed"]:
            raise UsageLimitError(
                detail=f"오늘의 음성 생성 횟수({tts_usage['limit']}회)를 모두 사용했습니다."
            )

    await extract_realtime_facts(db, current_user.id, body.content)

    return StreamingResponse(
        send_message_stream(db, conversation_id, current_user.id, body.content, voice_mode=body.voice_mode),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.delete("/conversations/{conversation_id}")
async def delete(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_conversation(db, conversation_id, current_user.id)
    return {"ok": True}
