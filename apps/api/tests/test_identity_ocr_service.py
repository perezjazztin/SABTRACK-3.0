import pytest
from app.modules.identity_verification.services.ocr_service import IdOcrService
from app.modules.identity_verification.models import SupportedIdType

def test_ocr_service_strips_exif_and_parses_sample_id():
    service = IdOcrService()
    synthetic_id_bytes = service.generate_synthetic_id_image(
        full_name="JUAN DELA CRUZ",
        dob="1995-08-15",
        id_number="1234-5678-9012-3456",
        address="PUROK 2, BARANGAY SABANG, LIPA CITY",
        id_type=SupportedIdType.PHILIPPINE_NATIONAL_ID,
    )
    result = service.extract_id_data(synthetic_id_bytes, SupportedIdType.PHILIPPINE_NATIONAL_ID)
    
    assert result.is_readable is True
    assert "JUAN DELA CRUZ" in result.full_name
    assert result.dob == "1995-08-15"
    assert result.id_number_masked.endswith("3456")
    assert len(result.id_number_hash) == 64

def test_ocr_service_rejects_unreadable_blank_image():
    service = IdOcrService()
    blank_image_bytes = service.generate_blank_image()
    result = service.extract_id_data(blank_image_bytes, SupportedIdType.PHILIPPINE_NATIONAL_ID)
    
    assert result.is_readable is False
