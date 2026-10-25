from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import Permission, UserRole, hash_password
from app.core.deps import require_permission, verify_csrf
from app.modules.identity.models import User, Session as UserSession
from app.modules.identity.schemas import (
    UserRead,
    UserCreate,
    UserStatusUpdate,
    UserRoleUpdate,
    UserListResponse,
)

router = APIRouter()


@router.get("", response_model=UserListResponse, summary="List system users (Admin)")
def list_users(
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_MANAGE)),
):
    """List system users and personnel with filtering and search. Requires `users:manage`."""
    query = db.query(User)

    if role is not None:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
            )
        )

    users = query.order_by(User.id.asc()).all()
    return UserListResponse(items=users, total=len(users))


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Provision user or staff account (Admin)",
    dependencies=[Depends(verify_csrf)],
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_MANAGE)),
):
    """Provision a new user account with specified role. Requires `users:manage`."""
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists.",
        )

    new_user = User(
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role,
        area_id=payload.area_id,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch(
    "/{user_id}/status",
    response_model=UserRead,
    summary="Activate or deactivate user account (Admin)",
    dependencies=[Depends(verify_csrf)],
)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_MANAGE)),
):
    """Toggle user active status. Deactivating revokes all active sessions. Requires `users:manage`."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if not payload.is_active and user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own administrative account.",
        )

    user.is_active = payload.is_active

    # Invalidate active sessions immediately upon deactivation
    if not payload.is_active:
        db.query(UserSession).filter(UserSession.user_id == user.id).delete()

    db.commit()
    db.refresh(user)
    return user


@router.patch(
    "/{user_id}/role",
    response_model=UserRead,
    summary="Update user role (Admin)",
    dependencies=[Depends(verify_csrf)],
)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_MANAGE)),
):
    """Assign a new role to an account. Requires `users:manage`."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.id == current_user.id and payload.role != UserRole.BARANGAY_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revoke your own administrative role.",
        )

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user
