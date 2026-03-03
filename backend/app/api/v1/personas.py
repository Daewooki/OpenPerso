import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_current_user_optional
from app.core.exceptions import BadRequestError, UsageLimitError
from app.database import get_db
from app.models.user import User
from app.models.persona import PersonaReport
from app.schemas.persona import (
    PersonaCreate,
    PersonaGenerateRequest,
    PersonaListResponse,
    PersonaReportCreate,
    PersonaReportResponse,
    PersonaResponse,
    PersonaUpdate,
)
from app.services.persona import (
    create_persona,
    delete_persona,
    get_persona,
    toggle_like,
    update_persona,
)
from app.services.image_gen import generate_avatar_images
from app.services.persona_gen import generate_persona
from app.services.usage import check_and_increment

router = APIRouter(prefix="/personas", tags=["personas"])


@router.post("", response_model=PersonaResponse)
async def create(
    body: PersonaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    usage = await check_and_increment(str(current_user.id), current_user.tier, "persona_create")
    if not usage["allowed"]:
        raise UsageLimitError(
            detail=f"오늘의 페르소나 생성 횟수({usage['limit']}회)를 모두 사용했습니다."
        )
    persona = await create_persona(db, current_user.id, body)
    return persona


@router.get("/{persona_id}", response_model=PersonaResponse)
async def get_detail(
    persona_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    viewer_id = current_user.id if current_user else None
    return await get_persona(db, persona_id, viewer_id=viewer_id, check_visibility=True)


@router.put("/{persona_id}", response_model=PersonaResponse)
async def update(
    persona_id: uuid.UUID,
    body: PersonaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await update_persona(db, persona_id, current_user.id, body)


@router.delete("/{persona_id}")
async def delete(
    persona_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_persona(db, persona_id, current_user.id)
    return {"ok": True}


@router.post("/{persona_id}/like")
async def like(
    persona_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_liked = await toggle_like(db, persona_id, current_user.id)
    return {"is_liked": is_liked}


@router.post("/generate")
async def ai_generate(
    body: PersonaGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    usage = await check_and_increment(str(current_user.id), current_user.tier, "ai_generate")
    if not usage["allowed"]:
        raise UsageLimitError(
            detail=f"오늘의 AI 생성 횟수({usage['limit']}회)를 모두 사용했습니다."
        )
    try:
        result = await generate_persona(body.name, body.category, body.description)
        return result
    except ValueError as e:
        raise BadRequestError(detail=str(e))


@router.post("/generate-avatar")
async def generate_avatar(
    body: PersonaGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate avatar image candidates for a persona."""
    usage = await check_and_increment(str(current_user.id), current_user.tier, "image_gen")
    if not usage["allowed"]:
        raise UsageLimitError(
            detail=f"오늘의 이미지 생성 횟수({usage['limit']}회)를 모두 사용했습니다."
        )
    try:
        urls = await generate_avatar_images(
            name=body.name,
            category=body.category,
            description=body.description,
            count=3,
        )
        return {"images": urls, "usage": usage}
    except ValueError as e:
        raise BadRequestError(detail=str(e))


@router.post("/{persona_id}/report", response_model=PersonaReportResponse)
async def report_persona(
    persona_id: uuid.UUID,
    body: PersonaReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await get_persona(db, persona_id)
    report = PersonaReport(
        user_id=current_user.id,
        persona_id=persona_id,
        reason=body.reason,
        detail=body.detail,
    )
    db.add(report)
    await db.flush()
    return report
