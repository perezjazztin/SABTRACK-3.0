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


class ClaimStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class TransactionType(str, Enum):
    CLAIM_AWARD = "CLAIM_AWARD"
    CIVIC_BONUS = "CIVIC_BONUS"
    REWARD_REDEMPTION = "REWARD_REDEMPTION"


class Initiative(Base):
    """Community clean-up activity or environmental campaign eligible for points."""
    __tablename__ = "initiatives"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    points_reward: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    event_date: Mapped[str] = mapped_column(String(50), nullable=False)
    location: Mapped[str] = mapped_column(String(150), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class ParticipationClaim(Base):
    """Resident submission claiming attendance or verified waste segregation for points."""
    __tablename__ = "participation_claims"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    resident_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    initiative_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("initiatives.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    activity_title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    points_requested: Mapped[int] = mapped_column(Integer, default=25, nullable=False)
    status: Mapped[ClaimStatus] = mapped_column(
        SQLEnum(ClaimStatus, native_enum=False, length=20),
        default=ClaimStatus.PENDING,
        nullable=False,
        index=True,
    )
    reviewed_by_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    resident = relationship("User", foreign_keys=[resident_id])
    initiative = relationship("Initiative")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])


class PointsLedger(Base):
    """Immutable double-entry transaction record for SAB-Points balance calculation."""
    __tablename__ = "points_ledger"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    resident_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    transaction_type: Mapped[TransactionType] = mapped_column(
        SQLEnum(TransactionType, native_enum=False, length=30),
        nullable=False,
        index=True,
    )
    claim_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("participation_claims.id", ondelete="SET NULL"),
        nullable=True,
    )
    description: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    resident = relationship("User")
    claim = relationship("ParticipationClaim")
