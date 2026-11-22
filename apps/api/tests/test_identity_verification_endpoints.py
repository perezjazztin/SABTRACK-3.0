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
