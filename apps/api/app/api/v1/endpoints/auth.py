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
from app.modules.identity.models import (
    Session as SessionModel,
    User,
    SecurityAuditLog,
    LoginThrottling,
)
from app.core.security import UserRole
from app.modules.identity.schemas import (
    LoginRequest,
    MessageResponse,
    SessionUserResponse,
    UserRead,
    UserCreate,
)

router = APIRouter()


def _check_rate_limit(db: Session, ip: str, email: str) -> None:
    """Enforces login throttling to defend against brute-force attacks via persistent database records."""
    key_email = email.lower().strip()
    now = datetime.now(timezone.utc)
    stmt = select(LoginThrottling).where(
        LoginThrottling.ip_address == ip,
        LoginThrottling.email == key_email,
    )
    record = db.scalar(stmt)
    if record and record.locked_until:
        locked_until = record.locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if now < locked_until:
            remaining_secs = max(1, int((locked_until - now).total_seconds()))
            logger.warning("Throttled login attempt for %s from IP %s", email, ip)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Please wait {remaining_secs} seconds before retrying.",
            )
        else:
            # Lockout window passed, reset attempts
            record.attempt_count = 0
            record.locked_until = None
            db.commit()


def _record_login_failure(db: Session, ip: str, email: str) -> None:
    """Increments failed attempt count and sets lockout if threshold reached."""
    key_email = email.lower().strip()
    now = datetime.now(timezone.utc)
    stmt = select(LoginThrottling).where(
        LoginThrottling.ip_address == ip,
        LoginThrottling.email == key_email,
    )
    record = db.scalar(stmt)
    if not record:
        record = LoginThrottling(
            ip_address=ip,
            email=key_email,
            attempt_count=1,
            last_attempt_at=now,
        )
        db.add(record)
    else:
        record.attempt_count += 1
        record.last_attempt_at = now
        if record.attempt_count >= settings.LOGIN_MAX_ATTEMPTS:
            record.locked_until = now + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
    db.commit()


def _reset_login_attempts(db: Session, ip: str, email: str) -> None:
    """Cleans up throttle records upon successful authentication."""
    key_email = email.lower().strip()
    stmt = select(LoginThrottling).where(
        LoginThrottling.ip_address == ip,
        LoginThrottling.email == key_email,
    )
    record = db.scalar(stmt)
    if record:
        db.delete(record)
        db.commit()


@router.post(
    "/auth/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new resident user account",
)
def register(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> UserRead:
    clean_email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists.",
        )

    new_user = User(
        email=clean_email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=UserRole.RESIDENT,
        area_id=payload.area_id,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    audit_entry = SecurityAuditLog(
        actor_id=new_user.id,
        event_type="RESIDENT_REGISTERED",
        ip_address=get_client_ip(request),
        details=f"Self-registered resident: {clean_email} (Resident ID: {payload.resident_id_num or 'N/A'})",
    )
    db.add(audit_entry)
    db.commit()

    return new_user


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
    _check_rate_limit(db, client_ip, clean_email)

    stmt = select(User).where(User.email == clean_email)
    user = db.scalar(stmt)

    # Generic authentication failure message prevents account enumeration
    if not user or not verify_password(credentials.password, user.hashed_password):
        _record_login_failure(db, client_ip, clean_email)
        
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
    _reset_login_attempts(db, client_ip, clean_email)

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
        details=f"Session established via {user_agent}",
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

    permissions = ROLE_PERMISSIONS.get(user.role.value, [])

    return SessionUserResponse(
        user=UserRead.model_validate(user),
        permissions=permissions,
        csrf_token=csrf_token,
    )


@router.post(
    "/auth/logout",
    response_model=MessageResponse,
    summary="Terminates active session and clears auth cookies",
)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    session: SessionModel = Depends(get_current_session),
    _csrf: None = Depends(verify_csrf),
) -> MessageResponse:
    # Log logout event
    audit_entry = SecurityAuditLog(
        actor_id=session.user_id,
        event_type="LOGOUT",
        ip_address=get_client_ip(request),
        details="User initiated logout",
    )
    db.add(audit_entry)

    # Delete session record from database
    db.delete(session)
    db.commit()

    # Clear both cookies
    response.delete_cookie(key=settings.SESSION_COOKIE_NAME, path="/")
    response.delete_cookie(key=settings.CSRF_COOKIE_NAME, path="/")

    return MessageResponse(message="Successfully logged out.")


@router.get(
    "/auth/me",
    response_model=SessionUserResponse,
    summary="Retrieve current authenticated user context",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    session: SessionModel = Depends(get_current_session),
) -> SessionUserResponse:
    permissions = ROLE_PERMISSIONS.get(current_user.role.value, [])
    return SessionUserResponse(
        user=UserRead.model_validate(current_user),
        permissions=permissions,
        csrf_token=session.csrf_token,
    )
