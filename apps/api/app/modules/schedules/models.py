from datetime import datetime, timezone
from enum import Enum
from typing import Optional
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


class DayOfWeek(str, Enum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"
    SUNDAY = "SUNDAY"


class WasteType(str, Enum):
    BIODEGRADABLE = "BIODEGRADABLE"
    NON_BIODEGRADABLE = "NON_BIODEGRADABLE"
    RECYCLABLE = "RECYCLABLE"
    SPECIAL_HAZARDOUS = "SPECIAL_HAZARDOUS"


class Schedule(Base):
    """Weekly garbage collection schedule tied to a configurable area/purok."""
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    area_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("areas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    day_of_week: Mapped[DayOfWeek] = mapped_column(
        SQLEnum(DayOfWeek, native_enum=False, length=20),
        nullable=False,
        index=True,
    )
    waste_type: Mapped[WasteType] = mapped_column(
        SQLEnum(WasteType, native_enum=False, length=30),
        nullable=False,
        index=True,
    )
    start_time: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "06:00 AM"
    end_time: Mapped[str] = mapped_column(String(20), nullable=False)    # e.g. "09:00 AM"
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

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

    area = relationship("Area")


class AdvisoryType(str, Enum):
    DELAY = "DELAY"
    ROUTE_CHANGE = "ROUTE_CHANGE"
    SPECIAL_COLLECTION = "SPECIAL_COLLECTION"
    HOLIDAY_SUSPENSION = "HOLIDAY_SUSPENSION"


class ScheduleAdvisory(Base):
    """Barangay collection delay, truck breakdown, or route modification notice."""
    __tablename__ = "schedule_advisories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    area_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("areas.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )  # NULL implies barangay-wide advisory
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    advisory_type: Mapped[AdvisoryType] = mapped_column(
        SQLEnum(AdvisoryType, native_enum=False, length=30),
        default=AdvisoryType.DELAY,
        nullable=False,
    )
    effective_date: Mapped[str] = mapped_column(String(30), nullable=False)  # e.g. "2026-10-25"
    created_by_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    area = relationship("Area")
    creator = relationship("User")
