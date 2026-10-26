from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import (
    String,
    Text,
    DateTime,
    Boolean,
    Integer,
    ForeignKey,
    Enum as SQLEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AnnouncementCategory(str, Enum):
    GENERAL = "GENERAL"
    CLEANUP_DRIVE = "CLEANUP_DRIVE"
    HOLIDAY_SCHEDULE = "HOLIDAY_SCHEDULE"
    EMERGENCY = "EMERGENCY"
    POLICY_UPDATE = "POLICY_UPDATE"


class Announcement(Base):
    """Official ecological, scheduling, and community announcements published by Barangay Sabang."""
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[AnnouncementCategory] = mapped_column(
        SQLEnum(AnnouncementCategory, native_enum=False, length=30),
        default=AnnouncementCategory.GENERAL,
        nullable=False,
        index=True,
    )
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    author_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    author = relationship("User")
