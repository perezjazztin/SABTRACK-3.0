from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    ROLE_PERMISSIONS,
    generate_csrf_token,
    generate_session_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.core.logging import logger
from app.core.deps import (
    get_client_ip,
    get_current_session,
    get_current_user,
    verify_csrf,
)
from app.modules.identity.models import Session as SessionModel, User, SecurityAuditLog
from app.modules.identity.schemas import (
    LoginRequest,
    MessageResponse,
    SessionUserResponse,
    UserRead,
)

router = APIRouter()

# In-memory login attempt throttling tracker
# Key: (ip, email), Value: (attempt_count, last_attempt_time)
_login_attempts: Dict[Tuple[str, str], Tuple[int, datetime]] = {}


def _check_rate_limit(ip: str, email: str) -> None:
    """Enforces login throttling to defend against brute-force attacks."""
    key = (ip, email.lower().strip())
    now = datetime.now(timezone.utc)
    if key in _login_attempts:
        count, last_time = _login_attempts[key]
        lockout_duration = timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
        if count >= settings.LOGIN_MAX_ATTEMPTS:
            if now - last_time < lockout_duration:
                remaining_secs = int((lockout_duration - (now - last_time)).total_seconds())
                logger.warning("Throttled login attempt for %s from IP %s", email, ip)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many failed login attempts. Please wait {remaining_secs} seconds before retrying.",
                )
            else:
                # Reset counter after lockout window passes
                _login_attempts[key] = (0, now)


def _record_login_failure(ip: str, email: str) -> None:
    key = (ip, email.lower().strip())
    now = datetime.now(timezone.utc)
    count, _ = _login_attempts.get(key, (0, now))
    _login_attempts[key] = (count + 1, now)


def _reset_login_attempts(ip: str, email: str) -> None:
    key = (ip, email.lower().strip())
    if key in _login_attempts:
        del _login_attempts[key]


@router.post(
    "/auth/login",
    response_model=SessionUserResponse,
    summary="User authentication and session establishment",
)
def login(
    credentials: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> SessionUserResponse:
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")[:255]
    clean_email = credentials.email.lower().strip()

    # Rate limiting check
    _check_rate_limit(client_ip, clean_email)

    stmt = select(User).where(User.email == clean_email)
    user = db.scalar(stmt)

    # Generic authentication failure message prevents account enumeration
    if not user or not verify_password(credentials.password, user.hashed_password):
        _record_login_failure(client_ip, clean_email)
        
        audit_entry = SecurityAuditLog(
            actor_id=user.id if user else None,
            event_type="LOGIN_FAILED",
            ip_address=client_ip,
            details=f"Failed login attempt for email {clean_email}",
        )
        db.add(audit_entry)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive. Contact barangay administration.",
        )

    # Reset failed attempts upon successful authentication
    _reset_login_attempts(client_ip, clean_email)

    # Generate session tokens
    raw_session_token = generate_session_token()
    session_hash = hash_token(raw_session_token)
    csrf_token = generate_csrf_token()
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.SESSION_EXPIRE_SECONDS)

    # Persist session to database
    new_session = SessionModel(
        session_id_hash=session_hash,
        user_id=user.id,
        csrf_token=csrf_token,
        ip_address=client_ip,
        user_agent=user_agent,
        expires_at=expires_at,
    )
    db.add(new_session)

    # Log successful login
    audit_entry = SecurityAuditLog(
        actor_id=user.id,
        event_type="LOGIN_SUCCESS",
        ip_address=client_ip,
        details=f"User {user.email} logged in successfully",
    )
    db.add(audit_entry)
    db.commit()

    # Set secure HttpOnly session cookie
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=raw_session_token,
        max_age=settings.SESSION_EXPIRE_SECONDS,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/",
    )

    # Set accessible CSRF cookie for client-side X-CSRF-Token header inclusion
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=csrf_token,
        max_age=settings.SESSION_EXPIRE_SECONDS,
        httponly=False,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/",
    )

    permissions = [p.value for p in ROLE_PERMISSIONS.get(user.role, set())]

    return SessionUserResponse(
        user=UserRead.model_validate(user),
        permissions=permissions,
        csrf_token=csrf_token,
    )


@router.post(
    "/auth/logout",
    response_model=MessageResponse,
    summary="Terminate active session",
)
def logout(
    request: Request,
    response: Response,
    session: SessionModel = Depends(get_current_session),
    _csrf: None = Depends(verify_csrf),
    db: Session = Depends(get_db),
) -> MessageResponse:
    client_ip = get_client_ip(request)

    # Log logout event
    audit_entry = SecurityAuditLog(
        actor_id=session.user_id,
        event_type="LOGOUT",
        ip_address=client_ip,
        details=f"User {session.user.email} logged out",
    )
    db.add(audit_entry)

    # Delete session record from database
    db.delete(session)
    db.commit()

    # Clear authentication cookies
    response.delete_cookie(key=settings.SESSION_COOKIE_NAME, path="/")
    response.delete_cookie(key=settings.CSRF_COOKIE_NAME, path="/")

    return MessageResponse(message="Successfully logged out.")


@router.get(
    "/auth/me",
    response_model=SessionUserResponse,
    summary="Inspect current authenticated session status",
)
def get_current_user_profile(
    session: SessionModel = Depends(get_current_session),
) -> SessionUserResponse:
    user = session.user
    permissions = [p.value for p in ROLE_PERMISSIONS.get(user.role, set())]

    return SessionUserResponse(
        user=UserRead.model_validate(user),
        permissions=permissions,
        csrf_token=session.csrf_token,
    )
