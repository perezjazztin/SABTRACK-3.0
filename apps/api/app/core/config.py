from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    PROJECT_NAME: str = "SABTRACK API"
    VERSION: str = "3.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", description="Runtime environment")

    # PostgreSQL Database URL using modern psycopg 3.x driver
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/sabtrack_dev",
        description="PostgreSQL connection string"
    )

    # CORS Allowed Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    LOG_LEVEL: str = "INFO"

    # Session Authentication & Cookie Settings
    SESSION_COOKIE_NAME: str = "sabtrack_session"
    CSRF_COOKIE_NAME: str = "sabtrack_csrf"
    SESSION_EXPIRE_SECONDS: int = 60 * 60 * 24 * 7  # 7 days
    SESSION_COOKIE_SECURE: bool = Field(
        default=False,
        description="Set to True in HTTPS production environments"
    )
    SESSION_COOKIE_SAMESITE: str = "lax"

    # Rate Limiting for Authentication
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
