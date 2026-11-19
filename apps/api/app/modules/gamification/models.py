from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy import (
    String,
    Text,
    DateTime,
    Boolean,
    Integer,
    ForeignKey,
    Enum as SQLEnum,
    UniqueConstraint,
    Uuid,
    false,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ClaimStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ClaimActivityType(str, Enum):
    SEGREGATION = "SEGREGATION"
    COMMUNITY_CLEANUP = "COMMUNITY_CLEANUP"
    OTHER = "OTHER"


class RedemptionStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"


class TransactionType(str, Enum):
    CLAIM_AWARD = "CLAIM_AWARD"
    CIVIC_BONUS = "CIVIC_BONUS"
    REWARD_REDEMPTION = "REWARD_REDEMPTION"
    REWARD_REFUND = "REWARD_REFUND"
    ARTICLE_READ_AWARD = "ARTICLE_READ_AWARD"


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
    activity_type: Mapped[ClaimActivityType] = mapped_column(
        SQLEnum(ClaimActivityType, native_enum=False, length=30),
        default=ClaimActivityType.OTHER,
        server_default=ClaimActivityType.OTHER.value,
        nullable=False,
    )
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
    __table_args__ = (
        UniqueConstraint(
            "resident_id",
            "task_key",
            "task_source_id",
            name="uq_points_ledger_resident_task_source",
        ),
    )

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
    task_key: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    task_source_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    resident = relationship("User")
    claim = relationship("ParticipationClaim")


class ArticleReadingSession(Base):
    """Current server-tracked reading session for a resident and article."""
    __tablename__ = "article_reading_sessions"
    __table_args__ = (
        UniqueConstraint(
            "resident_id",
            "article_id",
            name="uq_article_reading_session_resident_article",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    resident_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    article_id: Mapped[str] = mapped_column(String(100), nullable=False)
    opened_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    consumed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=false(),
        nullable=False,
    )

    resident = relationship("User")


class ArticleReadAward(Base):
    """Unique per-resident article award linked to its immutable ledger entry."""
    __tablename__ = "article_read_awards"
    __table_args__ = (
        UniqueConstraint(
            "resident_id",
            "article_id",
            name="uq_article_read_award_resident_article",
        ),
        UniqueConstraint(
            "ledger_entry_id",
            name="uq_article_read_awards_ledger_entry_id",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    resident_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    article_id: Mapped[str] = mapped_column(String(100), nullable=False)
    ledger_entry_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("points_ledger.id", ondelete="CASCADE"),
        nullable=False,
    )
    awarded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    resident = relationship("User")
    ledger_entry = relationship("PointsLedger")


class RewardItem(Base):
    """In-app academic demonstration voucher catalog item."""
    __tablename__ = "reward_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    points_required: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), default="GOODS", nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class RedemptionRequest(Base):
    """Resident request for an in-app academic demonstration voucher."""
    __tablename__ = "redemption_requests"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    resident_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reward_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("reward_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    points_spent: Mapped[int] = mapped_column(Integer, nullable=False)
    claim_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    status: Mapped[RedemptionStatus] = mapped_column(
        SQLEnum(RedemptionStatus, native_enum=False, length=20),
        default=RedemptionStatus.PENDING,
        nullable=False,
        index=True,
    )
    reviewed_by_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fulfilled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    resident = relationship("User", foreign_keys=[resident_id])
    reward = relationship("RewardItem")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])
