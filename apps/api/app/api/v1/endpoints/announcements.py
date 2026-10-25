from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import Permission
from app.core.deps import get_current_user, require_permission, verify_csrf
from app.modules.identity.models import User
from app.modules.announcements.models import AnnouncementCategory
from app.modules.announcements.schemas import (
    AnnouncementCreate,
    AnnouncementRead,
    AnnouncementListResponse,
)
from app.modules.announcements.service import (
    get_announcements,
    create_announcement,
    deactivate_announcement,
)

router = APIRouter()


@router.get("", response_model=AnnouncementListResponse, summary="List announcements")
def list_announcements_endpoint(
    category: Optional[AnnouncementCategory] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    """Retrieve active barangay announcements and official advisories."""
    items = get_announcements(db, category=category, active_only=True)
    return AnnouncementListResponse(items=items, total=len(items))


@router.post(
    "",
    response_model=AnnouncementRead,
    status_code=status.HTTP_201_CREATED,
    summary="Publish announcement (Staff / Admin)",
    dependencies=[Depends(verify_csrf)],
)
def create_announcement_endpoint(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ANNOUNCEMENTS_MANAGE)),
):
    """Publish a new barangay announcement. Requires `announcements:manage` permission."""
    return create_announcement(db, payload, current_user.id)


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
    return {"message": "Announcement deactivated successfully", "id": announcement_id}
