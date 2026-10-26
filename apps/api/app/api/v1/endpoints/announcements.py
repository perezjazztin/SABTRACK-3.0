from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission, verify_csrf
from app.core.security import Permission
from app.core.websocket import ws_manager
from app.modules.identity.models import User
from app.modules.announcements.schemas import (
    AnnouncementCreate,
    AnnouncementRead,
    AnnouncementListResponse,
    AnnouncementCategory,
)
from app.modules.announcements.service import (
    create_announcement,
    get_announcements,
    deactivate_announcement,
)

router = APIRouter()


@router.get(
    "",
    response_model=AnnouncementListResponse,
    summary="List active official barangay announcements",
)
def list_announcements_endpoint(
    category: Optional[AnnouncementCategory] = Query(None, description="Filter by category"),
    active_only: bool = Query(True, description="Filter only active announcements"),
    db: Session = Depends(get_db),
):
    """Retrieve official announcements feed for public and resident viewing."""
    items = get_announcements(db, category=category, active_only=active_only)
    return AnnouncementListResponse(items=items, total=len(items))


@router.post(
    "",
    response_model=AnnouncementRead,
    status_code=status.HTTP_201_CREATED,
    summary="Publish official announcement (Staff / Admin)",
    dependencies=[Depends(verify_csrf)],
)
def create_announcement_endpoint(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ANNOUNCEMENTS_MANAGE)),
):
    """Publish a new barangay announcement. Requires `announcements:manage` permission."""
    announcement = create_announcement(db, payload, current_user.id)
    ws_manager.broadcast_sync({
        "type": "ANNOUNCEMENT_PUBLISHED",
        "entity": "announcements",
        "id": announcement.id,
    })
    return announcement


@router.delete(
    "/{announcement_id}",
    status_code=status.HTTP_200_OK,
    summary="Deactivate announcement (Staff / Admin)",
    dependencies=[Depends(verify_csrf)],
)
def delete_announcement_endpoint(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ANNOUNCEMENTS_MANAGE)),
):
    """Deactivate an existing announcement. Requires `announcements:manage` permission."""
    success = deactivate_announcement(db, announcement_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Announcement with ID {announcement_id} not found.",
        )
    ws_manager.broadcast_sync({
        "type": "ANNOUNCEMENT_DEACTIVATED",
        "entity": "announcements",
        "id": announcement_id,
    })
    return {"message": "Announcement deactivated successfully", "id": announcement_id}
