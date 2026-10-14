from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.core.security import UserRole


class LoginRequest(BaseModel):
    """Credentials submitted for authentication."""
    email: str = Field(..., max_length=255, description="Registered account email")
    password: str = Field(..., min_length=6, max_length=128, description="Account password")


class UserRead(BaseModel):
    """Public user identity representation."""
    id: int
    email: str
    full_name: str
    role: UserRole
    area_id: int | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionUserResponse(BaseModel):
    """Session status and current user permissions."""
    user: UserRead
    permissions: list[str]
    csrf_token: str


class MessageResponse(BaseModel):
    """Standard message response envelope."""
    message: str
