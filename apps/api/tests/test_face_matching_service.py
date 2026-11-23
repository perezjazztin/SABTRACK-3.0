import pytest
from app.modules.identity_verification.services.face_matching_service import FaceMatchingService

def test_face_matching_detects_similarity_and_rejects_dissimilar():
    service = FaceMatchingService()
    face_a_bytes, face_a_variant_bytes, face_b_bytes = service.generate_test_face_fixtures()
    
    match_result = service.compare_faces(face_a_bytes, face_a_variant_bytes)
    assert match_result.is_match is True
    assert match_result.match_score >= 0.60
    
    mismatch_result = service.compare_faces(face_a_bytes, face_b_bytes)
    assert mismatch_result.is_match is False
    assert mismatch_result.match_score < 0.60

def test_face_matching_handles_image_without_faces():
    service = FaceMatchingService()
    blank_bytes = service.generate_blank_fixture()
    face_bytes, _, _ = service.generate_test_face_fixtures()
    
    result = service.compare_faces(face_bytes, blank_bytes)
    assert result.is_match is False
    assert (
        "no face detected" in result.details.lower()
        or "face detection failed" in result.details.lower()
        or "blank" in result.details.lower()
        or "lacks any discernible human face" in result.details.lower()
    )
