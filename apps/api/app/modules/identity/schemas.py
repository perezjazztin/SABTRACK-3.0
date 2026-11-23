from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.core.security import UserRole


# Schema for handling login credentials submitted via POST /auth/login.
class LoginRequest(BaseModel):
    """Credentials submitted for authentication."""
    email: str = Field(..., max_length=255, description="Registered account email")
    password: str = Field(..., min_length=6, max_length=128, description="Account password")


# Serialized user identity schema returning public profile information safely without password hash.
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


# Response returned upon successful authentication containing user profile, active permissions, and CSRF token.
class SessionUserResponse(BaseModel):
    """Session status and current user permissions."""
    user: UserRead
    permissions: list[str]
    csrf_token: str


# Generic JSON response envelope for operation feedback.
class MessageResponse(BaseModel):
    """Standard message response envelope."""
    message: str


# Schema for creating/registering a new resident or staff user.
class UserCreate(BaseModel):
    """Payload to provision a new user account."""
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=150)
    role: UserRole = Field(default=UserRole.RESIDENT)
    area_id: int | None = Field(default=None)
    resident_id_num: str | None = Field(default=None, max_length=50)
    verification_token: str | None = Field(default=None, description="Signed single-use identity verification token")


# Schema for toggling active account status.
class UserStatusUpdate(BaseModel):
    """Payload to activate or deactivate a user account."""
    is_active: bool


# Schema for changing user role in administrative dashboard.
class UserRoleUpdate(BaseModel):
    """Payload to modify a user's role."""
    role: UserRole


# Response schema for paginated or listed user directory results.
class UserListResponse(BaseModel):
    """Paginated or filtered list of user accounts."""
    items: list[UserRead]
    total: int
