import hashlib
import secrets
from enum import Enum
from typing import Set
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Argon2id password hasher configured with memory cost (64MB) and time cost for secure hashing.
_ph = PasswordHasher(
    time_cost=2,
    memory_cost=65536,  # 64 MiB
    parallelism=1,
    hash_len=32,
    salt_len=16,
)


# Defines standard application roles for role-based access control (RBAC).
class UserRole(str, Enum):
    """User roles for SABTRACK Role-Based Access Control."""
    RESIDENT = "RESIDENT"
    BARANGAY_STAFF = "BARANGAY_STAFF"
    BARANGAY_ADMIN = "BARANGAY_ADMIN"


# Defines atomic permissions representing distinct system capabilities.
class Permission(str, Enum):
    """Atomic permissions defining granular access capabilities."""
    PROFILE_READ_SELF = "profile:read:self"
    PROFILE_UPDATE_SELF = "profile:update:self"
    REPORTS_CREATE = "reports:create"
    REPORTS_READ_SELF = "reports:read:self"
    REPORTS_REVIEW = "reports:review"
    SCHEDULES_MANAGE = "schedules:manage"
    ANNOUNCEMENTS_MANAGE = "announcements:manage"
    PARTICIPATION_REVIEW = "participation:review"
    ANALYTICS_READ = "analytics:read"
    USERS_MANAGE = "users:manage"
    USERS_READ = "users:read"


# Centralized least-privilege role-to-permission mapping dictionary.
ROLE_PERMISSIONS: dict[UserRole, Set[Permission]] = {
    UserRole.RESIDENT: {
        Permission.PROFILE_READ_SELF,
        Permission.PROFILE_UPDATE_SELF,
        Permission.REPORTS_CREATE,
        Permission.REPORTS_READ_SELF,
    },
    UserRole.BARANGAY_STAFF: {
        Permission.PROFILE_READ_SELF,
        Permission.PROFILE_UPDATE_SELF,
        Permission.REPORTS_CREATE,
        Permission.REPORTS_READ_SELF,
        Permission.REPORTS_REVIEW,
        Permission.PARTICIPATION_REVIEW,
        Permission.ANNOUNCEMENTS_MANAGE,
        Permission.ANALYTICS_READ,
        Permission.USERS_READ,
    },
    UserRole.BARANGAY_ADMIN: {
        Permission.PROFILE_READ_SELF,
        Permission.PROFILE_UPDATE_SELF,
        Permission.REPORTS_CREATE,
        Permission.REPORTS_READ_SELF,
        Permission.REPORTS_REVIEW,
        Permission.SCHEDULES_MANAGE,
        Permission.ANNOUNCEMENTS_MANAGE,
        Permission.PARTICIPATION_REVIEW,
        Permission.ANALYTICS_READ,
        Permission.USERS_MANAGE,
        Permission.USERS_READ,
    },
}


# Checks if a given role is granted the requested permission by inspecting the permission set.
def has_permission(role: UserRole, permission: Permission) -> bool:
    """Verifies whether a given role holds the specified permission."""
    return permission in ROLE_PERMISSIONS.get(role, set())


# Produces a secure Argon2id cryptographic hash string from a plaintext password.
def hash_password(password: str) -> str:
    """Hashes a plaintext password using Argon2id."""
    return _ph.hash(password)


# Validates a candidate password against an existing Argon2id hash, resisting timing attacks.
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against an Argon2id hash."""
    try:
        return _ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False


# Generates an opaque, cryptographically random URL-safe string for user session tokens.
def generate_session_token() -> str:
    """Generates an opaque, cryptographically secure 256-bit URL-safe token."""
    return secrets.token_urlsafe(32)


# Calculates a deterministic SHA-256 hex digest to store tokens securely without storing raw credentials.
def hash_token(token: str) -> str:
    """Computes a SHA-256 hash of a session token for secure database storage at rest."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# Generates an anti-CSRF token paired with the user's active session.
def generate_csrf_token() -> str:
    """Generates a cryptographically secure CSRF token."""
    return secrets.token_urlsafe(32)
