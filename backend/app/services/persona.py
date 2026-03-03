import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.persona import Persona, PersonaLike
from app.models.user import User
from app.schemas.persona import PersonaCreate, PersonaUpdate


def _enrich_personas(personas: list[Persona], user_id: uuid.UUID | None = None) -> list[dict]:
    """Attach creator_name and is_liked to persona data for API response."""
    result = []
    for p in personas:
        data = {
            "id": p.id,
            "creator_id": p.creator_id,
            "name": p.name,
            "tagline": p.tagline,
            "avatar_url": p.avatar_url,
            "category": p.category,
            "chat_count": p.chat_count,
            "like_count": p.like_count,
            "creator_name": p.creator.name if p.creator else None,
            "is_liked": any(like.user_id == user_id for like in (p.likes or [])) if user_id else False,
        }
        result.append(data)
    return result


async def create_persona(db: AsyncSession, user_id: uuid.UUID, data: PersonaCreate) -> Persona:
    persona = Persona(
        creator_id=user_id,
        **data.model_dump(),
    )
    db.add(persona)
    await db.flush()
    return persona


async def get_persona(
    db: AsyncSession,
    persona_id: uuid.UUID,
    viewer_id: uuid.UUID | None = None,
    check_visibility: bool = False,
) -> Persona:
    result = await db.execute(select(Persona).where(Persona.id == persona_id))
    persona = result.scalar_one_or_none()
    if not persona:
        raise NotFoundError("Persona not found")

    if check_visibility and persona.visibility == "private":
        if viewer_id is None or persona.creator_id != viewer_id:
            raise ForbiddenError("This persona is private")

    return persona


async def update_persona(
    db: AsyncSession, persona_id: uuid.UUID, user_id: uuid.UUID, data: PersonaUpdate
) -> Persona:
    persona = await get_persona(db, persona_id)
    if persona.creator_id != user_id:
        raise ForbiddenError("You can only edit your own personas")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(persona, key, value)

    await db.flush()
    await db.refresh(persona)
    return persona


async def delete_persona(db: AsyncSession, persona_id: uuid.UUID, user_id: uuid.UUID) -> None:
    persona = await get_persona(db, persona_id)
    if persona.creator_id != user_id:
        raise ForbiddenError("You can only delete your own personas")
    await db.delete(persona)


async def toggle_like(db: AsyncSession, persona_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Toggle like on a persona. Returns True if liked, False if unliked."""
    result = await db.execute(
        select(PersonaLike).where(PersonaLike.user_id == user_id, PersonaLike.persona_id == persona_id)
    )
    existing = result.scalar_one_or_none()

    persona = await get_persona(db, persona_id)

    if existing:
        await db.delete(existing)
        persona.like_count = max(0, persona.like_count - 1)
        return False
    else:
        like = PersonaLike(user_id=user_id, persona_id=persona_id)
        db.add(like)
        persona.like_count += 1
        return True


async def explore_personas(
    db: AsyncSession,
    category: str | None = None,
    sort_by: str = "popular",
    offset: int = 0,
    limit: int = 20,
    viewer_id: uuid.UUID | None = None,
) -> list[dict]:
    query = (
        select(Persona)
        .options(selectinload(Persona.creator), selectinload(Persona.likes))
        .where(Persona.visibility == "public")
    )

    if category:
        query = query.where(Persona.category == category)

    if sort_by == "popular":
        query = query.order_by(Persona.chat_count.desc())
    elif sort_by == "likes":
        query = query.order_by(Persona.like_count.desc())
    else:
        query = query.order_by(Persona.created_at.desc())

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    personas = list(result.scalars().all())
    return _enrich_personas(personas, viewer_id)


async def search_personas(
    db: AsyncSession, query_text: str, offset: int = 0, limit: int = 20, viewer_id: uuid.UUID | None = None
) -> list[dict]:
    query = (
        select(Persona)
        .options(selectinload(Persona.creator), selectinload(Persona.likes))
        .where(
            Persona.visibility == "public",
            func.lower(Persona.name).contains(query_text.lower())
            | func.lower(Persona.tagline).contains(query_text.lower()),
        )
        .order_by(Persona.chat_count.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    personas = list(result.scalars().all())
    return _enrich_personas(personas, viewer_id)


async def get_featured_personas(db: AsyncSession, limit: int = 6, viewer_id: uuid.UUID | None = None) -> list[dict]:
    query = (
        select(Persona)
        .options(selectinload(Persona.creator), selectinload(Persona.likes))
        .where(Persona.visibility == "public", Persona.is_featured.is_(True))
        .order_by(Persona.featured_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    personas = list(result.scalars().all())
    return _enrich_personas(personas, viewer_id)


async def get_trending_personas(db: AsyncSession, limit: int = 6, viewer_id: uuid.UUID | None = None) -> list[dict]:
    query = (
        select(Persona)
        .options(selectinload(Persona.creator), selectinload(Persona.likes))
        .where(Persona.visibility == "public")
        .order_by((Persona.chat_count + Persona.like_count * 2).desc())
        .limit(limit)
    )
    result = await db.execute(query)
    personas = list(result.scalars().all())
    return _enrich_personas(personas, viewer_id)


async def get_new_personas(
    db: AsyncSession, limit: int = 6, viewer_id: uuid.UUID | None = None,
) -> list[dict]:
    query = (
        select(Persona)
        .options(selectinload(Persona.creator), selectinload(Persona.likes))
        .where(Persona.visibility == "public")
        .order_by(Persona.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    return _enrich_personas(list(result.scalars().all()), viewer_id)


async def get_user_personas(db: AsyncSession, user_id: uuid.UUID) -> list[Persona]:
    result = await db.execute(
        select(Persona).where(Persona.creator_id == user_id).order_by(Persona.created_at.desc())
    )
    return list(result.scalars().all())
