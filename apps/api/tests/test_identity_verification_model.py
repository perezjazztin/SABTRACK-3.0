import pytest
from datetime import datetime, timezone, timedelta
from app.modules.identity_verification.models import (
    IdentityVerification,
    VerificationStatus,
    SupportedIdType,
)

def test_create_identity_verification_record(db_session):
    record = IdentityVerification(
        id_type=SupportedIdType.PHILIPPINE_NATIONAL_ID,
        id_number_hash="sample_sha256_hash_123",
        id_number_masked="****-****-9876",
        ocr_full_name="JUAN DELA CRUZ",
        submitted_full_name="JUAN DELA CRUZ",
        status=VerificationStatus.PENDING,
        verification_token_hash="sample_token_hash",
        token_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        is_demo_data=True,
    )
    db_session.add(record)
    db_session.commit()
    db_session.refresh(record)

    assert record.id is not None
    assert record.status == VerificationStatus.PENDING
    assert record.id_type == SupportedIdType.PHILIPPINE_NATIONAL_ID
    assert record.is_user_corrected is False
