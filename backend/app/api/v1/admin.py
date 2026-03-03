"""Admin-only API endpoints for persona/report management and curation."""

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_admin_user
from app.database import get_db
from app.models.persona import Persona, PersonaReport
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/reports")
async def list_reports(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    query = select(PersonaReport).order_by(PersonaReport.created_at.desc())
    if status_filter:
        query = query.where(PersonaReport.status == status_filter)
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    reports = result.scalars().all()

    count_query = select(func.count()).select_from(PersonaReport)
    if status_filter:
        count_query = count_query.where(PersonaReport.status == status_filter)
    total = (await db.execute(count_query)).scalar() or 0

    return {"items": reports, "total": total}


@router.put("/reports/{report_id}")
async def update_report_status(
    report_id: uuid.UUID,
    new_status: str = Query(..., alias="status"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    await db.execute(
        update(PersonaReport).where(PersonaReport.id == report_id).values(status=new_status)
    )
    return {"ok": True}


@router.post("/personas/{persona_id}/feature")
async def toggle_feature(
    persona_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(Persona).where(Persona.id == persona_id))
    persona = result.scalar_one_or_none()
    if not persona:
        return {"error": "Persona not found"}

    new_featured = not persona.is_featured
    await db.execute(
        update(Persona)
        .where(Persona.id == persona_id)
        .values(is_featured=new_featured, featured_at=datetime.now(UTC) if new_featured else None)
    )
    return {"is_featured": new_featured}


@router.get("/stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    users_count = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    personas_count = (await db.execute(select(func.count()).select_from(Persona))).scalar() or 0
    pending_reports = (
        await db.execute(
            select(func.count()).select_from(PersonaReport).where(PersonaReport.status == "pending")
        )
    ).scalar() or 0

    return {
        "users": users_count,
        "personas": personas_count,
        "pending_reports": pending_reports,
    }
