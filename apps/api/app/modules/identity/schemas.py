from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
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


class UserCreate(BaseModel):
    """Payload to provision a new user account."""
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=150)
    role: UserRole = Field(default=UserRole.RESIDENT)
    area_id: int | None = Field(default=None)


class UserStatusUpdate(BaseModel):
    """Payload to activate or deactivate a user account."""
    is_active: bool


class UserRoleUpdate(BaseModel):
    """Payload to modify a user's role."""
    role: UserRole


class UserListResponse(BaseModel):
    """Paginated or filtered list of user accounts."""
    items: list[UserRead]
    total: int
