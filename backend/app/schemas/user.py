from pydantic import BaseModel


class UserUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
