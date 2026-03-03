import uuid
from datetime import datetime

from pydantic import BaseModel


class PersonaCreate(BaseModel):
    name: str
    tagline: str | None = None
    description: str | None = None
    avatar_url: str | None = None
    system_prompt: str
    greeting_message: str
    personality: dict | None = None
    voice_config: dict | None = None
    conversation_starters: list[str] | None = None
    visibility: str = "private"
    category: str
    tags: list[str] | None = None


class PersonaUpdate(BaseModel):
    name: str | None = None
    tagline: str | None = None
    description: str | None = None
    avatar_url: str | None = None
    system_prompt: str | None = None
    greeting_message: str | None = None
    personality: dict | None = None
    voice_config: dict | None = None
    conversation_starters: list[str] | None = None
    visibility: str | None = None
    category: str | None = None
    tags: list[str] | None = None


class PersonaResponse(BaseModel):
    id: uuid.UUID
    creator_id: uuid.UUID
    name: str
    tagline: str | None
    description: str | None
    avatar_url: str | None
    system_prompt: str
    greeting_message: str
    personality: dict | None
    voice_config: dict | None = None
    conversation_starters: list[str] | None = None
    visibility: str
    category: str
    tags: list[str] | None
    chat_count: int
    like_count: int
    created_at: datetime
    updated_at: datetime
    creator_name: str | None = None
    is_liked: bool = False

    model_config = {"from_attributes": True}


class PersonaListResponse(BaseModel):
    id: uuid.UUID
    creator_id: uuid.UUID
    name: str
    tagline: str | None
    avatar_url: str | None
    category: str
    chat_count: int
    like_count: int
    creator_name: str | None = None
    is_liked: bool = False

    model_config = {"from_attributes": True}


class PersonaGenerateRequest(BaseModel):
    name: str
    category: str
    description: str | None = None


class PersonaReportCreate(BaseModel):
    reason: str
    detail: str | None = None


class PersonaReportResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    persona_id: uuid.UUID
    reason: str
    detail: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
