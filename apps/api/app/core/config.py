import os
from pathlib import Path
from typing import List, Optional
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_API_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = os.getenv("ENV_FILE", str(_API_DIR / ".env"))


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

    # Storage settings
    STORAGE_UPLOAD_DIR: Path = Field(
        default=_API_DIR / "storage" / "uploads",
        description="Protected local directory for uploaded files"
    )
    MAX_UPLOAD_SIZE_BYTES: int = Field(
        default=5 * 1024 * 1024,  # 5 MB
        description="Maximum allowed image upload size in bytes"
    )

    # EcoBot & AI Settings (Google Gemini 1.5 Flash Search Grounding)
    GEMINI_API_KEY: Optional[str] = Field(
        default=None,
        description="Google AI Studio Gemini API key for free web-grounded EcoBot search"
    )
    GEMINI_API_KEYS: Optional[str] = Field(
        default=None,
        description="Comma-separated list of Gemini API keys for zero-cost quota rotation"
    )

    @model_validator(mode="after")
    def adjust_secure_cookie(self) -> "Settings":
        if self.ENVIRONMENT.lower() == "production" and not self.SESSION_COOKIE_SECURE:
            self.SESSION_COOKIE_SECURE = True
        return self

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
