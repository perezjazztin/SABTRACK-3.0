import pytest
from datetime import datetime, timezone, timedelta
from app.modules.identity_verification.models import IdentityVerification, VerificationStatus, SupportedIdType
from app.core.security import hash_token

def test_registration_with_valid_verification_token_succeeds(client, db_session):
    raw_token = "valid_test_token_1234567890abcdef1234567890"
    verification = IdentityVerification(
        id_type=SupportedIdType.PHILIPPINE_NATIONAL_ID,
        id_number_hash="hash_unique_123",
        id_number_masked="****-****-1234",
        ocr_full_name="JUAN DELA CRUZ",
        submitted_full_name="JUAN DELA CRUZ",
        status=VerificationStatus.VERIFIED,
        verification_token_hash=hash_token(raw_token),
        token_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        is_demo_data=True,
    )
    db_session.add(verification)
    db_session.commit()

    payload = {
        "email": "verified.juan@sabtrack.test",
        "password": "ValidResidentPass2026!",
        "full_name": "JUAN DELA CRUZ",
        "area_id": 1,
        "resident_id_num": "SAB-2026-0001",
        "verification_token": raw_token,
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    
    db_session.refresh(verification)
    assert verification.user_id is not None
    assert verification.is_user_corrected is False

def test_registration_with_divergent_name_rejected(client, db_session):
    raw_token = "valid_test_token_divergent_9876543210abcdef"
    verification = IdentityVerification(
        id_type=SupportedIdType.PHILIPPINE_NATIONAL_ID,
        id_number_hash="hash_unique_divergent_456",
        id_number_masked="****-****-5678",
        ocr_full_name="JUAN DELA CRUZ",
        submitted_full_name="JUAN DELA CRUZ",
        status=VerificationStatus.VERIFIED,
        verification_token_hash=hash_token(raw_token),
        token_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        is_demo_data=True,
    )
    db_session.add(verification)
    db_session.commit()

    payload = {
        "email": "impostor@sabtrack.test",
        "password": "ValidResidentPass2026!",
        "full_name": "MARIA CLARA SANTOS",
        "area_id": 1,
        "verification_token": raw_token,
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 400
    err_msg = res.json().get("error", {}).get("message") or res.json().get("detail", "")
    assert "differs significantly" in err_msg.lower()

def test_registration_with_minor_typo_correction_succeeds(client, db_session):
    raw_token = "valid_test_token_typo_1122334455aabbcc"
    verification = IdentityVerification(
        id_type=SupportedIdType.PHILIPPINE_NATIONAL_ID,
        id_number_hash="hash_unique_typo_789",
        id_number_masked="****-****-9012",
        ocr_full_name="JUAN DELA CRU2",  # OCR typo
        submitted_full_name="JUAN DELA CRU2",
        status=VerificationStatus.VERIFIED,
        verification_token_hash=hash_token(raw_token),
        token_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        is_demo_data=True,
    )
    db_session.add(verification)
    db_session.commit()

    payload = {
        "email": "typo.juan@sabtrack.test",
        "password": "ValidResidentPass2026!",
        "full_name": "JUAN DELA CRUZ",  # corrected '2' to 'Z'
        "area_id": 1,
        "verification_token": raw_token,
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201

    db_session.refresh(verification)
    assert verification.user_id is not None
    assert verification.is_user_corrected is True
    assert verification.submitted_full_name == "JUAN DELA CRUZ"
