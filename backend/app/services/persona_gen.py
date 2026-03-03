"""AI-powered persona generation using the sub LLM model."""

import json
import logging

from app.services.llm import chat_complete

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a creative AI persona designer. Given a name, category, and optional description, generate a complete persona profile.

Respond in valid JSON with these exact fields:
{
  "name": "string (use the given name)",
  "tagline": "string (max 60 chars, catchy one-liner in Korean)",
  "description": "string (2-3 sentences in Korean, the character's background/story)",
  "system_prompt": "string (detailed roleplay instructions in Korean, 3-5 sentences: who they are, how they speak, their personality, key knowledge areas)",
  "greeting_message": "string (first message in character, in Korean, warm and inviting, 1-2 sentences)",
  "personality": {
    "warmth": number 1-10,
    "humor": number 1-10,
    "formality": number 1-10,
    "creativity": number 1-10,
    "assertiveness": number 1-10
  },
  "tags": ["string array", "3-5 relevant tags in Korean"],
  "conversation_starters": ["exactly 3 short conversation starter questions in Korean, specific to this character's expertise/personality"]
}

Rules:
- The system_prompt should give the AI clear instructions on how to act as this character
- Personality traits should feel natural and consistent with the character
- Keep greeting messages natural and in-character
- conversation_starters should be specific to THIS character (e.g. for Einstein: "상대성 이론을 쉽게 설명해줘", NOT generic ones like "안녕하세요")
- All text should be in Korean
- ONLY output valid JSON, no other text"""


async def generate_persona(name: str, category: str, description: str | None = None) -> dict:
    user_msg = f"Name: {name}\nCategory: {category}"
    if description:
        user_msg += f"\nAdditional description: {description}"

    result = await chat_complete(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        use_sub=True,
        temperature=0.9,
    )

    cleaned = result.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.error("Failed to parse persona JSON: %s", cleaned[:200])
        raise ValueError("AI가 올바른 형식으로 응답하지 못했습니다. 다시 시도해주세요.")

    required = ["name", "tagline", "description", "system_prompt", "greeting_message"]
    for field in required:
        if field not in data:
            raise ValueError(f"생성된 페르소나에 '{field}' 필드가 누락되었습니다.")

    return data
