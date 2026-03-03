import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.services.memory import (
    delete_global_memory,
    delete_persona_memory,
    get_global_memories,
    get_persona_memories,
)

router = APIRouter(prefix="/memories", tags=["memories"])


@router.get("/global")
async def list_global(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memories = await get_global_memories(db, current_user.id)
    return [
        {"id": str(m.id), "fact": m.fact, "category": m.category, "updated_at": m.updated_at.isoformat()}
        for m in memories
    ]


@router.delete("/global/{memory_id}")
async def delete_global(
    memory_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_global_memory(db, memory_id, current_user.id)
    return {"ok": True}


@router.get("/personas/{persona_id}")
async def list_persona_memories(
    persona_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memories = await get_persona_memories(db, current_user.id, persona_id)
    return [
        {
            "id": str(m.id),
            "fact": m.fact,
            "memory_type": m.memory_type,
            "updated_at": m.updated_at.isoformat(),
        }
        for m in memories
    ]


@router.delete("/personas/{persona_id}/{memory_id}")
async def delete_persona_mem(
    persona_id: uuid.UUID,
    memory_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_persona_memory(db, memory_id, current_user.id)
    return {"ok": True}
