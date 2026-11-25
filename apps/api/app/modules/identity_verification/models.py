from datetime import datetime, timezone, date
import enum
from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    Date,
    Text,
    Float,
    Integer,
    ForeignKey,
    Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.modules.identity.models import User


# Official government-issued ID card types accepted for citizen identity verification.
class SupportedIdType(str, enum.Enum):
    PHILIPPINE_NATIONAL_ID = "PHILIPPINE_NATIONAL_ID"
    DRIVERS_LICENSE = "DRIVERS_LICENSE"
    PASSPORT = "PASSPORT"
    UMID = "UMID"


# Verification workflow status lifecycle states.
class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    FLAGGED = "FLAGGED"


# Database table recording OCR results, facial biometric match scores, and verification tokens.
class IdentityVerification(Base):
    """Audit and validation record for resident government ID and facial biometric verification."""
    __tablename__ = "identity_verifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    id_type: Mapped[SupportedIdType] = mapped_column(
        SAEnum(SupportedIdType, native_enum=False, length=50),
        nullable=False,
    )
    # Stored as SHA-256 hash to prevent storing raw citizen ID numbers while preventing duplicate registrations.
    id_number_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )
    id_number_masked: Mapped[str] = mapped_column(String(50), nullable=False)
    ocr_full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    submitted_full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    is_user_corrected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    dob_extracted: Mapped[date | None] = mapped_column(Date, nullable=True)
    address_extracted: Mapped[str | None] = mapped_column(Text, nullable=True)
    match_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus, native_enum=False, length=50),
        default=VerificationStatus.PENDING,
        nullable=False,
        index=True,
    )
    
    # Single-use registration token hash ensuring only verified scans can complete signup.
    verification_token_hash: Mapped[str | None] = mapped_column(
        String(64),
        index=True,
        nullable=True,
    )
    token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
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

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
