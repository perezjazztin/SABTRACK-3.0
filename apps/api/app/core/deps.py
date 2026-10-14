from datetime import datetime, timezone
from typing import Callable
from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    Permission,
    UserRole,
    has_permission,
    hash_token,
)
from app.core.logging import logger
from app.modules.identity.models import Session as SessionModel, User as UserModel, SecurityAuditLog


def get_client_ip(request: Request) -> str:
    """Extracts client IP address safely."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_current_session(
    request: Request,
    db: Session = Depends(get_db),
) -> SessionModel:
    """Validates the session cookie and retrieves the active session record."""
    raw_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )

    token_hash = hash_token(raw_token)
    stmt = select(SessionModel).where(SessionModel.session_id_hash == token_hash)
    session = db.scalar(stmt)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or terminated session.",
        )

    # Check for session expiration safely across PostgreSQL and SQLite
    now = datetime.now(timezone.utc)
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        db.delete(session)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
        )

    return session


def get_current_user(
    session: SessionModel = Depends(get_current_session),
) -> UserModel:
    """Returns the authenticated active user associated with the valid session."""
    user = session.user
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or disabled.",
        )
    return user


def verify_csrf(
    request: Request,
    session: SessionModel = Depends(get_current_session),
) -> None:
    """Enforces CSRF token validation for all state-changing HTTP methods."""
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        submitted_csrf = request.headers.get("x-csrf-token")
        if not submitted_csrf or submitted_csrf != session.csrf_token:
            logger.warning(
                "CSRF validation failure on %s from IP %s",
                request.url.path,
                get_client_ip(request),
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF validation failed: Invalid or missing X-CSRF-Token header.",
            )


def require_permission(permission: Permission) -> Callable:
    """Dependency factory enforcing atomic capability permissions."""
    def _permission_checker(user: UserModel = Depends(get_current_user)) -> UserModel:
        if not has_permission(user.role, permission):
            logger.warning(
                "Access denied: User %s (role %s) requested permission %s",
                user.email,
                user.role.value,
                permission.value,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Insufficient permissions ({permission.value}).",
            )
        return user

    return _permission_checker


def require_role(role: UserRole) -> Callable:
    """Dependency factory enforcing specific role membership."""
    def _role_checker(user: UserModel = Depends(get_current_user)) -> UserModel:
        if user.role != role:
            logger.warning(
                "Access denied: User %s (role %s) does not match required role %s",
                user.email,
                user.role.value,
                role.value,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Required role is {role.value}.",
            )
        return user

    return _role_checker
