"""AI image generation service for persona avatars and in-chat images."""

import base64
import logging

from openai import AsyncOpenAI

from app.config import settings
from app.services.storage import upload_image

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.llm_api_key, base_url=settings.llm_api_url)
    return _client


AVATAR_PROMPT_TEMPLATE = """Create a character portrait for an AI persona named "{name}".
Category: {category}
{description_line}

Style: Semi-realistic digital art, anime-influenced, vibrant colors, clean lines.
The character should have a distinct, memorable appearance.
Show the character from chest up, facing slightly towards the viewer.
Background should be simple and complementary.
Do NOT include any text or watermarks."""


async def generate_avatar_images(
    name: str, category: str, description: str | None = None, count: int = 3
) -> list[str]:
    """Generate avatar images for a persona. Returns list of public URLs."""
    client = _get_client()
    description_line = f"Description: {description}" if description else ""
    prompt = AVATAR_PROMPT_TEMPLATE.format(
        name=name, category=category, description_line=description_line
    )

    urls = []
    for _ in range(count):
        try:
            response = await client.images.generate(
                model=settings.image_gen_model,
                prompt=prompt,
                n=1,
                size=settings.image_gen_size,
                quality=settings.image_gen_quality,
            )

            item = response.data[0]
            if item.b64_json:
                image_bytes = base64.b64decode(item.b64_json)
                url = upload_image(image_bytes, folder="avatars")
                urls.append(url)
            elif item.url:
                import httpx
                async with httpx.AsyncClient(timeout=30.0) as http:
                    img_resp = await http.get(item.url)
                    img_resp.raise_for_status()
                    url = upload_image(img_resp.content, folder="avatars")
                    urls.append(url)
        except Exception:
            logger.exception("Failed to generate avatar image")
            continue

    if not urls:
        raise ValueError("이미지 생성에 실패했습니다. 다시 시도해주세요.")

    return urls


async def generate_chat_image(prompt: str) -> str:
    """Generate an in-chat image from a text prompt. Returns public URL."""
    client = _get_client()

    safe_prompt = f"Illustration: {prompt}\n\nStyle: High quality digital art, vivid colors. No text or watermarks."

    try:
        response = await client.images.generate(
            model=settings.image_gen_model,
            prompt=safe_prompt,
            n=1,
            size=settings.image_gen_size,
            quality=settings.image_gen_quality,
        )

        item = response.data[0]
        if item.b64_json:
            image_bytes = base64.b64decode(item.b64_json)
            return upload_image(image_bytes, folder="chat_images")
        elif item.url:
            import httpx
            async with httpx.AsyncClient(timeout=30.0) as http:
                img_resp = await http.get(item.url)
                img_resp.raise_for_status()
                return upload_image(img_resp.content, folder="chat_images")
        raise ValueError("이미지 생성 응답이 비어있습니다.")
    except Exception:
        logger.exception("Failed to generate chat image")
        raise ValueError("이미지를 생성하지 못했습니다.")
