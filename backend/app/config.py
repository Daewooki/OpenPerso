from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "persona"
    postgres_password: str = "persona_dev_password"
    postgres_db: str = "persona_platform"

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379

    # Backend
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_public_url: str = ""
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # Admin
    admin_email: str = ""
    admin_password: str = ""
    admin_name: str = "Admin"

    # CORS
    cors_origins: str = "*"

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # LLM (main)
    llm_api_url: str = "https://api.openai.com/v1"
    llm_api_key: str = ""
    llm_model: str = "gpt-4o"

    # LLM (sub: summary, memory extraction, persona generation)
    llm_sub_api_url: str = "https://api.openai.com/v1"
    llm_sub_api_key: str = ""
    llm_sub_model: str = "gpt-4o-mini"

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "persona-platform"
    minio_public_url: str = ""

    # Image Generation
    image_gen_model: str = "gpt-image-1"
    image_gen_quality: str = "medium"
    image_gen_size: str = "1024x1024"

    # TTS (OpenAI)
    tts_model: str = "tts-1"
    tts_voice_default: str = "nova"

    # ElevenLabs (Voice Cloning - Premium)
    elevenlabs_api_key: str = ""
    elevenlabs_model_id: str = "eleven_multilingual_v2"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def sync_database_url(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}/0"

    model_config = {"env_file": ("../.env", ".env"), "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
