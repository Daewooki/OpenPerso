import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import select

from app.api.v1.router import api_router
from app.api.v1.sitemap import router as sitemap_router
from app.config import settings
from app.core.security import hash_password
from app.database import async_session
from app.models.user import User

logger = logging.getLogger(__name__)

async def seed_admin():
    """서버 시작 시 admin 계정이 없으면 자동 생성"""
    if not settings.admin_email or not settings.admin_password:
        logger.info("Admin credentials not configured, skipping seed")
        return

    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == settings.admin_email))
        if result.scalar_one_or_none():
            logger.info("Admin account already exists")
            return

        admin = User(
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
            name=settings.admin_name,
            provider="local",
            tier="premium",
            is_admin=True,
        )
        session.add(admin)
        await session.commit()
        logger.info("Admin account created: %s", settings.admin_email)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await seed_admin()
    yield


limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(
    title="AI Persona Platform",
    description="누구나 AI 페르소나를 만들고, 대화하고, 공유하는 플랫폼",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.backend_host == "0.0.0.0" else None,
    redoc_url=None,
)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."},
    )

cors_origins = settings.cors_origins.split(",") if settings.cors_origins != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(sitemap_router)


@app.middleware("http")
async def security_and_log(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = (time.time() - start) * 1000

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    if request.url.path != "/health":
        logger.info(
            "%s %s -> %d (%.0fms)",
            request.method,
            request.url.path,
            response.status_code,
            elapsed,
        )

    return response


@app.get("/health")
async def health():
    return {"status": "ok"}
