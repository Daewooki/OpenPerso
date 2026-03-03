"""Voice-related API endpoints: TTS generation, voice cloning."""

import uuid

from fastapi import APIRouter, Depends, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.exceptions import BadRequestError, ForbiddenError, UsageLimitError
from app.database import get_db
from app.models.user import User
from app.services.usage import check_and_increment

router = APIRouter(prefix="/voice", tags=["voice"])


class TTSRequest(BaseModel):
    text: str
    voice: str | None = None


@router.post("/tts")
async def text_to_speech(
    body: TTSRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate speech for a single text input."""
    usage = await check_and_increment(str(current_user.id), current_user.tier, "tts")
    if not usage["allowed"]:
        raise UsageLimitError(
            detail=f"오늘의 음성 생성 횟수({usage['limit']}회)를 모두 사용했습니다."
        )

    from app.services.tts import generate_speech_openai

    try:
        url = await generate_speech_openai(body.text, voice=body.voice)
        return {"audio_url": url, "usage": usage}
    except Exception as e:
        raise BadRequestError(detail=str(e))


@router.post("/clone")
async def clone_voice(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a voice sample for cloning via ElevenLabs IVC.
    Premium only, limited to 1 custom voice per user.
    """
    if current_user.tier != "premium":
        raise ForbiddenError("Voice cloning은 Premium 전용 기능입니다.")

    usage = await check_and_increment(str(current_user.id), current_user.tier, "voice_clone")
    if not usage["allowed"]:
        raise UsageLimitError(
            detail="이미 커스텀 보이스를 생성했습니다. (1개 제한)"
        )

    from app.config import settings

    if not settings.elevenlabs_api_key:
        raise BadRequestError(detail="Voice cloning 서비스가 설정되지 않았습니다.")

    content = await audio.read()
    if len(content) > 10 * 1024 * 1024:
        raise BadRequestError(detail="오디오 파일은 10MB 이하여야 합니다.")

    import httpx

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "https://api.elevenlabs.io/v1/voices/add",
            headers={"xi-api-key": settings.elevenlabs_api_key},
            data={
                "name": f"user-{current_user.id}-custom",
                "description": f"Custom voice clone for user {current_user.email}",
            },
            files={"files": (audio.filename or "sample.wav", content, audio.content_type or "audio/wav")},
        )

        if response.status_code != 200:
            raise BadRequestError(detail="음성 클론 생성에 실패했습니다. 다시 시도해주세요.")

        data = response.json()
        voice_id = data.get("voice_id")

    return {
        "voice_id": voice_id,
        "message": "커스텀 보이스가 생성되었습니다!",
    }


class VoiceListItem(BaseModel):
    id: str
    name: str


OPENAI_VOICE_OPTIONS = [
    {"id": "alloy", "name": "Alloy (중성)"},
    {"id": "ash", "name": "Ash (남성)"},
    {"id": "ballad", "name": "Ballad (남성)"},
    {"id": "coral", "name": "Coral (여성)"},
    {"id": "echo", "name": "Echo (남성)"},
    {"id": "fable", "name": "Fable (남성)"},
    {"id": "nova", "name": "Nova (여성)"},
    {"id": "onyx", "name": "Onyx (남성)"},
    {"id": "sage", "name": "Sage (여성)"},
    {"id": "shimmer", "name": "Shimmer (여성)"},
]


@router.get("/voices")
async def list_voices(
    current_user: User = Depends(get_current_user),
):
    """List available TTS voices."""
    return {"voices": OPENAI_VOICE_OPTIONS}
