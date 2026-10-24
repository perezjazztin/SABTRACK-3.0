from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List
from sqlalchemy import (
    String,
    Text,
    DateTime,
    Boolean,
    Float,
    Integer,
    ForeignKey,
    Enum as SQLEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ReportCategory(str, Enum):
    UNCOLLECTED_GARBAGE = "UNCOLLECTED_GARBAGE"
    ILLEGAL_DUMPING = "ILLEGAL_DUMPING"
    IMPROPER_SEGREGATION = "IMPROPER_SEGREGATION"
    HAZARDOUS_WASTE = "HAZARDOUS_WASTE"
    OVERFLOWING_BIN = "OVERFLOWING_BIN"
    OTHER = "OTHER"


class ReportStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class Report(Base):
    """Community Waste Violation and Uncollected Waste Report."""
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    resident_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[ReportCategory] = mapped_column(
        SQLEnum(ReportCategory, native_enum=False, length=50),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    location_text: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    area_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("areas.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    latitude: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )
    longitude: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )
    photo_url: Mapped[Optional[str]] = mapped_column(
        String(512),
        nullable=True,
    )
    status: Mapped[ReportStatus] = mapped_column(
        SQLEnum(ReportStatus, native_enum=False, length=50),
        default=ReportStatus.SUBMITTED,
        nullable=False,
        index=True,
    )
    admin_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    is_demo_data: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
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

    # Relationships
    resident = relationship("User", foreign_keys=[resident_id], lazy="joined")
    area = relationship("Area", foreign_keys=[area_id], lazy="joined")
    status_history: Mapped[List["ReportStatusHistory"]] = relationship(
        "ReportStatusHistory",
        back_populates="report",
        cascade="all, delete-orphan",
        order_by="ReportStatusHistory.created_at.desc()",
        lazy="selectin",
    )


class ReportStatusHistory(Base):
    """Immutable audit trail of status transitions for community reports."""
    __tablename__ = "report_status_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    previous_status: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    new_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    changed_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    remarks: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    report = relationship("Report", back_populates="status_history")
    changed_by = relationship("User", foreign_keys=[changed_by_user_id], lazy="joined")
