"""Daily usage tracking via Redis counters with automatic expiry."""

from datetime import date

from app.redis import redis_client

LIMITS = {
    "free": {
        "messages": 50,
        "persona_create": 5,
        "ai_generate": 10,
        "image_gen": 3,
        "tts": 20,
        "voice_clone": 0,
    },
    "premium": {
        "messages": -1,
        "persona_create": -1,
        "ai_generate": -1,
        "image_gen": 50,
        "tts": -1,
        "voice_clone": 1,
    },
}

DAY_SECONDS = 86400


def _key(user_id: str, action: str) -> str:
    today = date.today().isoformat()
    return f"usage:{user_id}:{action}:{today}"


async def check_and_increment(user_id: str, tier: str, action: str) -> dict:
    """Check if user can perform action, increment counter if allowed.

    Returns dict with 'allowed', 'used', 'limit', 'remaining'.
    Raises nothing — caller decides how to handle denial.
    """
    limit = LIMITS.get(tier, LIMITS["free"]).get(action, 0)
    if limit == -1:
        return {"allowed": True, "used": 0, "limit": -1, "remaining": -1}

    key = _key(user_id, action)
    current = await redis_client.get(key)
    used = int(current) if current else 0

    if used >= limit:
        return {"allowed": False, "used": used, "limit": limit, "remaining": 0}

    pipe = redis_client.pipeline()
    pipe.incr(key)
    pipe.expire(key, DAY_SECONDS)
    await pipe.execute()

    return {"allowed": True, "used": used + 1, "limit": limit, "remaining": limit - used - 1}


async def get_usage(user_id: str, tier: str) -> dict:
    """Get current usage for all tracked actions."""
    result = {}
    for action, limit in LIMITS.get(tier, LIMITS["free"]).items():
        if limit == -1:
            result[action] = {"used": 0, "limit": -1, "remaining": -1}
            continue
        key = _key(user_id, action)
        current = await redis_client.get(key)
        used = int(current) if current else 0
        result[action] = {"used": used, "limit": limit, "remaining": max(0, limit - used)}
    return result
