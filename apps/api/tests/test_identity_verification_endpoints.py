import pytest
from app.modules.identity_verification.services.ocr_service import IdOcrService
from app.modules.identity_verification.models import SupportedIdType

def test_scan_id_and_verify_face_endpoints(client):
    ocr_service = IdOcrService()
    sample_id = ocr_service.generate_synthetic_id_image(
        full_name="JUAN DELA CRUZ",
        dob="1995-08-15",
        id_number="1234-5678-9012-3456",
        address="PUROK 2, SABANG",
        id_type=SupportedIdType.PHILIPPINE_NATIONAL_ID,
    )
    
    # 1. Scan ID
    scan_res = client.post(
        "/api/v1/identity-verification/scan-id",
        data={"id_type": "PHILIPPINE_NATIONAL_ID"},
        files={"file": ("test_id.png", sample_id, "image/png")},
    )
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    temp_id = scan_data["temp_verification_id"]
    assert scan_data["extracted_data"]["full_name"] == "JUAN DELA CRUZ"
    assert scan_data["extracted_data"]["dob"] == "1995-08-15"
    
    # 2. Verify Face with matching snapshot
    verify_res = client.post(
        "/api/v1/identity-verification/verify-face",
        data={"temp_verification_id": temp_id},
        files={"live_face": ("live.png", sample_id, "image/png")},
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert "verification_token" in verify_data
    assert len(verify_data["verification_token"]) >= 32
    assert verify_data["status"] == "VERIFIED"

def test_scan_id_rescan_unconsumed_succeeds_without_unique_violation(client):
    """Verifies that re-scanning the same unconsumed ID updates the session cleanly without DB unique violation."""
    ocr_service = IdOcrService()
    sample_id = ocr_service.generate_synthetic_id_image(
        full_name="MARIA SANTOS",
        dob="1998-04-20",
        id_number="9876-5432-1098-7654",
        address="PUROK 3, SABANG",
        id_type=SupportedIdType.PHILIPPINE_NATIONAL_ID,
    )
    
    # First scan
    res1 = client.post(
        "/api/v1/identity-verification/scan-id",
        data={"id_type": "PHILIPPINE_NATIONAL_ID"},
        files={"file": ("test_id.png", sample_id, "image/png")},
    )
    assert res1.status_code == 200

    # Second scan of same ID before registration
    res2 = client.post(
        "/api/v1/identity-verification/scan-id",
        data={"id_type": "PHILIPPINE_NATIONAL_ID"},
        files={"file": ("test_id.png", sample_id, "image/png")},
    )
    assert res2.status_code == 200
    assert res2.json()["extracted_data"]["full_name"] == "MARIA SANTOS"

def test_scan_id_rejects_unreadable_image(client):
    ocr_service = IdOcrService()
    blank_image = ocr_service.generate_blank_image()

    res = client.post(
        "/api/v1/identity-verification/scan-id",
        data={"id_type": "PHILIPPINE_NATIONAL_ID"},
        files={"file": ("blank.png", blank_image, "image/png")},
    )
    assert res.status_code == 422
    data = res.json()
    err_msg = data.get("error", {}).get("message") or data.get("detail", "")
    assert "unreadable" in err_msg.lower()


def test_normalize_name_and_multiline_id_parsing():
    """Tests name cleanup and multi-line Philippine ID name field joining."""
    ocr_service = IdOcrService()
    assert ocr_service.normalize_name("VALENCIA, FAITH ATIENZA") == "FAITH ATIENZA VALENCIA"
    assert ocr_service.normalize_name("NAME: JUAN DELA CRUZ") == "JUAN DELA CRUZ"
    assert ocr_service.normalize_name("PANGALAN: MARIA CLARA") == "MARIA CLARA"

    multiline_text = (
        "REPUBLIC OF THE PHILIPPINES\n"
        "Apelyido / Last Name\n"
        "VALENCIA\n"
        "Mga Pangalan / Given Names\n"
        "FAITH\n"
        "Gitnang Apelyido / Middle Name\n"
        "ATIENZA\n"
        "ID NO: 1234-5678-9012\n"
    )
    extracted = ocr_service._parse_fields_from_text(multiline_text, SupportedIdType.PHILIPPINE_NATIONAL_ID)
    assert extracted.full_name == "FAITH ATIENZA VALENCIA"
    assert "1234-5678-9012" in extracted.id_number
