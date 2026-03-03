from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_optional
from app.database import get_db
from app.models.user import User
from app.services.persona import (
    explore_personas,
    get_featured_personas,
    get_new_personas,
    get_trending_personas,
    search_personas,
)

router = APIRouter(prefix="/explore", tags=["explore"])


@router.get("")
async def explore(
    category: str | None = Query(None),
    sort_by: str = Query("popular", pattern="^(popular|likes|recent)$"),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    viewer_id = current_user.id if current_user else None
    return await explore_personas(
        db, category=category, sort_by=sort_by,
        offset=offset, limit=limit, viewer_id=viewer_id,
    )


@router.get("/featured")
async def featured(
    limit: int = Query(6, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    viewer_id = current_user.id if current_user else None
    return await get_featured_personas(db, limit=limit, viewer_id=viewer_id)


@router.get("/trending")
async def trending(
    limit: int = Query(6, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    viewer_id = current_user.id if current_user else None
    return await get_trending_personas(db, limit=limit, viewer_id=viewer_id)


@router.get("/new")
async def new_personas(
    limit: int = Query(6, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    viewer_id = current_user.id if current_user else None
    return await get_new_personas(db, limit=limit, viewer_id=viewer_id)


@router.get("/search")
async def search(
    q: str = Query(..., min_length=1),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    viewer_id = current_user.id if current_user else None
    return await search_personas(
        db, q, offset=offset, limit=limit, viewer_id=viewer_id,
    )
