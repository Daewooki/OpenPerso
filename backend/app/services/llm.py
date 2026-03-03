import asyncio
import logging
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

main_client = AsyncOpenAI(api_key=settings.llm_api_key, base_url=settings.llm_api_url)
sub_client = AsyncOpenAI(api_key=settings.llm_sub_api_key, base_url=settings.llm_sub_api_url)

MAX_RETRIES = 3
RETRY_BACKOFF = [1.0, 2.0, 4.0]


async def chat_stream(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.8,
) -> AsyncGenerator[str, None]:
    """Stream chat completion tokens from the main LLM with retry."""
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = await main_client.chat.completions.create(
                model=model or settings.llm_model,
                messages=messages,
                temperature=temperature,
                stream=True,
                timeout=60.0,
            )
            async for chunk in response:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
            return
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                wait = RETRY_BACKOFF[attempt]
                logger.warning("LLM stream attempt %d failed, retrying in %.1fs: %s", attempt + 1, wait, e)
                await asyncio.sleep(wait)
            else:
                logger.error("LLM stream failed after %d attempts: %s", MAX_RETRIES, e)
    if last_error:
        yield "[오류] 응답 생성에 실패했습니다. 잠시 후 다시 시도해주세요."


async def chat_complete(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.7,
    use_sub: bool = False,
) -> str:
    """Non-streaming chat completion with retry. Use use_sub=True for cheaper model."""
    client = sub_client if use_sub else main_client
    default_model = settings.llm_sub_model if use_sub else settings.llm_model

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = await client.chat.completions.create(
                model=model or default_model,
                messages=messages,
                temperature=temperature,
                timeout=60.0,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                wait = RETRY_BACKOFF[attempt]
                logger.warning("LLM complete attempt %d failed, retrying in %.1fs: %s", attempt + 1, wait, e)
                await asyncio.sleep(wait)
            else:
                logger.error("LLM complete failed after %d attempts: %s", MAX_RETRIES, e)

    raise last_error or RuntimeError("LLM call failed")
