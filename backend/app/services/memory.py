import re
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.memory import UserGlobalMemory, UserPersonaMemory

FACT_PATTERNS = [
    (r"(?:내\s*이름은?|저는?|나는?)\s*(.{1,20})(?:이야|야|입니다|이에요|에요|임)", "name"),
    (r"(?:나|저)\s*(\d{1,3})\s*살", "age"),
    (r"(?:직업은?|일은?)\s*(.{1,30})(?:이야|야|입니다|이에요|에요|임|해)", "job"),
    (r"(.{1,20})(?:을|를)\s*(?:좋아해|좋아합니다|좋아함|사랑해)", "preference"),
    (r"(.{1,20})(?:을|를)\s*(?:싫어해|싫어합니다|싫어함|별로야)", "dislike"),
]


async def extract_realtime_facts(
    db: AsyncSession, user_id: uuid.UUID, content: str
) -> list[dict]:
    """Extract explicit facts from user message using pattern matching.
    Returns list of extracted facts for transparency."""
    extracted = []

    for pattern, category in FACT_PATTERNS:
        match = re.search(pattern, content)
        if not match:
            continue

        fact_value = match.group(1).strip()
        fact_text = f"{category}: {fact_value}"

        existing = await db.execute(
            select(UserGlobalMemory).where(
                UserGlobalMemory.user_id == user_id,
                UserGlobalMemory.category == category,
            )
        )
        existing_memory = existing.scalar_one_or_none()

        if existing_memory:
            existing_memory.fact = fact_text
        else:
            memory = UserGlobalMemory(user_id=user_id, fact=fact_text, category=category)
            db.add(memory)

        extracted.append({"category": category, "value": fact_value})

    return extracted


async def get_global_memories(db: AsyncSession, user_id: uuid.UUID) -> list[UserGlobalMemory]:
    result = await db.execute(
        select(UserGlobalMemory)
        .where(UserGlobalMemory.user_id == user_id)
        .order_by(UserGlobalMemory.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_persona_memories(
    db: AsyncSession, user_id: uuid.UUID, persona_id: uuid.UUID
) -> list[UserPersonaMemory]:
    result = await db.execute(
        select(UserPersonaMemory)
        .where(UserPersonaMemory.user_id == user_id, UserPersonaMemory.persona_id == persona_id)
        .order_by(UserPersonaMemory.updated_at.desc())
    )
    return list(result.scalars().all())


async def delete_global_memory(db: AsyncSession, memory_id: uuid.UUID, user_id: uuid.UUID) -> None:
    result = await db.execute(
        select(UserGlobalMemory).where(UserGlobalMemory.id == memory_id, UserGlobalMemory.user_id == user_id)
    )
    memory = result.scalar_one_or_none()
    if memory:
        await db.delete(memory)


async def delete_persona_memory(
    db: AsyncSession, memory_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(UserPersonaMemory).where(UserPersonaMemory.id == memory_id, UserPersonaMemory.user_id == user_id)
    )
    memory = result.scalar_one_or_none()
    if memory:
        await db.delete(memory)
