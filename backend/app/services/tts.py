"""Text-to-Speech service using OpenAI TTS and ElevenLabs for voice cloning."""

import logging

from openai import AsyncOpenAI

from app.config import settings
from app.services.storage import upload_audio

logger = logging.getLogger(__name__)

_openai_client: AsyncOpenAI | None = None


def _get_openai_client() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(api_key=settings.llm_api_key, base_url=settings.llm_api_url)
    return _openai_client


OPENAI_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"]


async def generate_speech_openai(text: str, voice: str | None = None) -> str:
    """Generate speech via OpenAI TTS. Returns public URL of uploaded audio."""
    client = _get_openai_client()
    voice = voice or settings.tts_voice_default
    if voice not in OPENAI_VOICES:
        voice = settings.tts_voice_default

    response = await client.audio.speech.create(
        model=settings.tts_model,
        voice=voice,
        input=text,
        response_format="mp3",
    )

    audio_bytes = response.content
    return upload_audio(audio_bytes, folder="tts")


async def generate_speech_elevenlabs(text: str, voice_id: str) -> str:
    """Generate speech via ElevenLabs (for cloned voices). Returns public URL."""
    if not settings.elevenlabs_api_key:
        raise ValueError("ElevenLabs API key not configured")

    import httpx

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": settings.elevenlabs_api_key,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "model_id": settings.elevenlabs_model_id,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                },
            },
        )

        if response.status_code != 200:
            logger.error("ElevenLabs TTS failed: %s", response.text)
            raise ValueError("음성 생성에 실패했습니다.")

        return upload_audio(response.content, folder="tts_clone")


async def generate_speech(text: str, voice_config: dict | None = None) -> str:
    """Generate speech based on voice config. Routes to OpenAI or ElevenLabs."""
    if not voice_config:
        return await generate_speech_openai(text)

    if voice_config.get("is_cloned") and voice_config.get("elevenlabs_voice_id"):
        return await generate_speech_elevenlabs(text, voice_config["elevenlabs_voice_id"])

    return await generate_speech_openai(text, voice=voice_config.get("tts_voice"))
