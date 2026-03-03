from fastapi import APIRouter

from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.explore import router as explore_router
from app.api.v1.memories import router as memories_router
from app.api.v1.personas import router as personas_router
from app.api.v1.users import router as users_router
from app.api.v1.files import router as files_router
from app.api.v1.guest import router as guest_router
from app.api.v1.voice import router as voice_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(personas_router)
api_router.include_router(explore_router)
api_router.include_router(chat_router)
api_router.include_router(users_router)
api_router.include_router(memories_router)
api_router.include_router(admin_router)
api_router.include_router(files_router)
api_router.include_router(voice_router)
api_router.include_router(guest_router)
