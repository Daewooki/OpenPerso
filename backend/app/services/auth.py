import uuid

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import BadRequestError, ConflictError
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import TokenResponse


async def register_user(db: AsyncSession, email: str, password: str, name: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise ConflictError("Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(password),
        name=name,
        provider="local",
    )
    db.add(user)
    await db.flush()
    return user


async def login_user(db: AsyncSession, email: str, password: str) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(password, user.password_hash):
        raise BadRequestError("Invalid email or password")

    return _create_tokens(user)


async def google_auth(db: AsyncSession, credential: str) -> TokenResponse:
    user_info = await _verify_google_token(credential)
    if not user_info:
        raise BadRequestError("Invalid Google credential")

    email = user_info["email"]
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            name=user_info.get("name", email.split("@")[0]),
            avatar_url=user_info.get("picture"),
            provider="google",
            provider_id=user_info.get("sub"),
        )
        db.add(user)
        await db.flush()

    return _create_tokens(user)


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise BadRequestError("Invalid or expired refresh token")

    user_id = payload.get("sub")
    if not user_id:
        raise BadRequestError("Invalid token payload")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise BadRequestError("User not found")

    return _create_tokens(user)


def _create_tokens(user: User) -> TokenResponse:
    token_data = {"sub": str(user.id)}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


async def _verify_google_token(credential: str) -> dict | None:
    """Verify Google ID token via Google's tokeninfo endpoint."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": credential},
        )
        if resp.status_code != 200:
            return None

        data = resp.json()
        if data.get("aud") != settings.google_client_id:
            return None

        return data
