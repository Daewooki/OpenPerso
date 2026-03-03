import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class ConversationCreate(BaseModel):
    persona_id: uuid.UUID


class ConversationResponse(BaseModel):
    id: uuid.UUID
    persona_id: uuid.UUID
    title: str | None
    summary: str | None
    last_message_at: datetime | None
    created_at: datetime
    persona_name: str | None = None
    persona_avatar_url: str | None = None
    persona_category: str | None = None
    conversation_starters: list[str] | None = None

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str
    voice_mode: bool = False

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("메시지를 입력해주세요.")
        if len(v) > 4000:
            raise ValueError("메시지는 4000자 이하여야 합니다.")
        return v


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    image_url: str | None = None
    audio_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
