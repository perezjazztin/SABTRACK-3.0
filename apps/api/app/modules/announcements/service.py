from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, desc

from app.modules.announcements.models import Announcement, AnnouncementCategory
from app.modules.announcements.schemas import AnnouncementCreate, AnnouncementRead
from app.modules.identity.models import User


def get_announcements(
    db: Session,
    category: Optional[AnnouncementCategory] = None,
    active_only: bool = True,
) -> List[AnnouncementRead]:
    stmt = (
        select(Announcement)
        .options(joinedload(Announcement.author))
        .order_by(desc(Announcement.is_pinned), desc(Announcement.created_at))
    )

    filters = []
    if active_only:
        filters.append(Announcement.is_active == True)
    if category is not None:
        filters.append(Announcement.category == category)

    if filters:
        stmt = stmt.where(and_(*filters))

    results = db.scalars(stmt).all()
    items = []
    for a in results:
        items.append(
            AnnouncementRead(
                id=a.id,
                title=a.title,
                content=a.content,
                category=a.category,
                is_pinned=a.is_pinned,
                is_active=a.is_active,
                is_demo_data=a.is_demo_data,
                author_id=a.author_id,
                author_name=a.author.full_name if a.author else "Barangay Official",
                created_at=a.created_at,
                updated_at=a.updated_at,
            )
        )
    return items


def create_announcement(
    db: Session,
    payload: AnnouncementCreate,
    author_id: int,
) -> AnnouncementRead:
    user = db.scalar(select(User).where(User.id == author_id))
    author_name = user.full_name if user else "Barangay Official"

    announcement = Announcement(
        title=payload.title,
        content=payload.content,
        category=payload.category,
        is_pinned=payload.is_pinned,
        is_active=True,
        is_demo_data=True,
        author_id=author_id,
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    return AnnouncementRead(
        id=announcement.id,
        title=announcement.title,
        content=announcement.content,
        category=announcement.category,
        is_pinned=announcement.is_pinned,
        is_active=announcement.is_active,
        is_demo_data=announcement.is_demo_data,
        author_id=announcement.author_id,
        author_name=author_name,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at,
    )


def deactivate_announcement(db: Session, announcement_id: int) -> bool:
    announcement = db.scalar(select(Announcement).where(Announcement.id == announcement_id))
    if not announcement:
        return False
    announcement.is_active = False
    db.commit()
    return True
