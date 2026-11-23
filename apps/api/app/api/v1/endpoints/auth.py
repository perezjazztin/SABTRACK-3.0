from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher
from pathlib import Path
import re
import shutil
from typing import Dict, Tuple
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, Response, UploadFile, status
from app.modules.notifications.service import email_service
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
from app.modules.identity_verification.models import (
    IdentityVerification,
    VerificationStatus,
)
from app.modules.identity_verification.services.face_matching_service import FaceMatchingService
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
                headers={"Retry-After": str(remaining_secs)},
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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> UserRead:
    clean_email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists.",
        )

    # Validate identity verification token if provided
    verification_record = None
    if payload.verification_token:
        token_hash = hash_token(payload.verification_token)
        verification_record = db.execute(
            select(IdentityVerification).where(IdentityVerification.verification_token_hash == token_hash)
        ).scalar_one_or_none()

        if not verification_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired identity verification token.",
            )

        if verification_record.status != VerificationStatus.VERIFIED or verification_record.user_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Identity verification token has already been consumed or is not verified.",
            )

        now = datetime.now(timezone.utc)
        expires = verification_record.token_expires_at
        if expires and expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires and now > expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Identity verification token has expired. Please verify your ID again.",
            )

        # Enforce name similarity guardrail with token-matching (handles middle name omissions & reordering)
        ocr_clean = (verification_record.ocr_full_name or "").strip().upper()
        sub_clean = payload.full_name.strip().upper()
        if ocr_clean:
            similarity = SequenceMatcher(None, sub_clean, ocr_clean).ratio()
            sub_tokens = set(re.findall(r"\w+", sub_clean))
            ocr_tokens = set(re.findall(r"\w+", ocr_clean))
            tokens_match = bool(sub_tokens and (sub_tokens.issubset(ocr_tokens) or ocr_tokens.issubset(sub_tokens)))
            token_overlap = len(sub_tokens & ocr_tokens) / max(len(sub_tokens), 1)

            if similarity < 0.70 and not tokens_match and token_overlap < 0.65:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Submitted full name differs significantly ({similarity:.0%}) from verified "
                        f"government ID ({verification_record.ocr_full_name}). Please ensure your entered name matches your ID."
                    ),
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

    if verification_record:
        verification_record.user_id = new_user.id
        verification_record.submitted_full_name = payload.full_name.strip()
        verification_record.is_user_corrected = (
            payload.full_name.strip().upper() != verification_record.ocr_full_name.strip().upper()
        )
        db.commit()

        # Persist biometric template for facial biometric sign-in
        try:
            template_dir = settings.STORAGE_UPLOAD_DIR / "biometric_templates"
            temp_template = template_dir / f"temp_{verification_record.id}.jpg"
            if temp_template.is_file():
                user_template = template_dir / f"user_{new_user.id}.jpg"
                email_template = template_dir / f"email_{clean_email}.jpg"
                shutil.copy2(temp_template, user_template)
                shutil.copy2(temp_template, email_template)
        except Exception as err:
            logger.warning("Failed to link biometric template to registered user: %s", err)

    audit_entry = SecurityAuditLog(
        actor_id=new_user.id,
        event_type="RESIDENT_REGISTERED",
        ip_address=get_client_ip(request),
        details=f"Self-registered resident: {clean_email} (Resident ID: {payload.resident_id_num or 'N/A'})",
    )
    db.add(audit_entry)
    db.commit()

    # Queue welcome email to resident
    background_tasks.add_task(
        email_service.send_welcome_email,
        to_email=clean_email,
        full_name=new_user.full_name,
    )

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
    "/auth/login-face",
    response_model=SessionUserResponse,
    summary="User biometric authentication via live facial verification",
)
async def login_with_face(
    request: Request,
    response: Response,
    email: str = Form(...),
    live_face: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> SessionUserResponse:
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")[:255]
    clean_email = email.lower().strip()

    # Rate limiting check
    _check_rate_limit(db, client_ip, clean_email)

    stmt = select(User).where(User.email == clean_email)
    user = db.scalar(stmt)

    if not user:
        _record_login_failure(db, client_ip, clean_email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No registered resident account found with this email address.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive. Contact barangay administration.",
        )

    live_bytes = await live_face.read()
    if not live_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captured live face image is empty.",
        )

    template_dir = settings.STORAGE_UPLOAD_DIR / "biometric_templates"
    template_dir.mkdir(parents=True, exist_ok=True)
    user_template = template_dir / f"user_{user.id}.jpg"
    email_template = template_dir / f"email_{clean_email}.jpg"

    ref_bytes = None
    if user_template.is_file():
        ref_bytes = user_template.read_bytes()
    elif email_template.is_file():
        ref_bytes = email_template.read_bytes()
    else:
        # Check if user has a verified identity record or is standard demo resident
        verification = db.scalar(
            select(IdentityVerification).where(
                IdentityVerification.user_id == user.id,
                IdentityVerification.status == VerificationStatus.VERIFIED,
            ).order_by(IdentityVerification.id.desc())
        )
        if verification or clean_email == "resident@sabtrack.test":
            # Auto-enroll live face template on first verified biometric login
            user_template.write_bytes(live_bytes)
            email_template.write_bytes(live_bytes)
            ref_bytes = live_bytes
            logger.info("Enrolled initial biometric template for user %s", user.id)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Facial login requires verified ID biometrics. Please complete identity verification first or sign in with your password.",
            )

    matcher = FaceMatchingService()
    result = matcher.compare_faces(ref_bytes, live_bytes)

    if not result.is_match:
        _record_login_failure(db, client_ip, clean_email)
        audit_entry = SecurityAuditLog(
            actor_id=user.id,
            event_type="LOGIN_FAILED_FACE",
            ip_address=client_ip,
            details=f"Facial biometric mismatch for {clean_email}: {result.details}",
        )
        db.add(audit_entry)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Facial verification did not match your registered profile ({result.details}). Please retry with good lighting or sign in with your password.",
        )

    # Reset failed attempts upon successful authentication
    _reset_login_attempts(db, client_ip, clean_email)

    # Generate session tokens
    raw_session_token = generate_session_token()
    session_hash = hash_token(raw_session_token)
    csrf_token = generate_csrf_token()
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.SESSION_EXPIRE_SECONDS)

    new_session = SessionModel(
        session_id_hash=session_hash,
        user_id=user.id,
        csrf_token=csrf_token,
        ip_address=client_ip,
        user_agent=user_agent,
        expires_at=expires_at,
    )
    db.add(new_session)

    audit_entry = SecurityAuditLog(
        actor_id=user.id,
        event_type="LOGIN_SUCCESS_FACE",
        ip_address=client_ip,
        details=f"Facial biometric session established via {user_agent}",
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
