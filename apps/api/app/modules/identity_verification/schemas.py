from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.modules.identity_verification.models import SupportedIdType, VerificationStatus


# Data parsed and extracted from government ID scan via OCR.
class ExtractedFields(BaseModel):
    full_name: str
    dob: Optional[str] = None
    age: Optional[int] = None
    address: Optional[str] = None
    id_number_masked: str
    id_type: SupportedIdType

    model_config = ConfigDict(from_attributes=True)


# Response schema returned after scanning an ID card image.
class ScanIdResponse(BaseModel):
    temp_verification_id: str
    extracted_data: ExtractedFields
    message: str


# Response schema returned after facial biometric liveness and matching comparison.
class VerifyFaceResponse(BaseModel):
    verification_token: str
    match_score: float
    status: str
    message: str
    details: Optional[str] = None
