from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.persona import PersonaListResponse
from app.schemas.user import UserUpdate
from app.services.persona import get_user_personas
from app.services.usage import get_usage

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/personas", response_model=list[PersonaListResponse])
async def my_personas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_user_personas(db, current_user.id)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    await db.flush()
    return current_user


@router.delete("/me")
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """회원 탈퇴 - CASCADE로 모든 관련 데이터 자동 삭제"""
    await db.delete(current_user)
    await db.commit()
    return {"ok": True}


@router.get("/me/usage")
async def my_usage(current_user: User = Depends(get_current_user)):
    usage = await get_usage(str(current_user.id), current_user.tier)
    return {"tier": current_user.tier, "usage": usage}
