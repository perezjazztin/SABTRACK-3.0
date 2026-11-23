import secrets
from datetime import datetime, timezone, timedelta, date
from typing import Dict, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.security import hash_token
from app.core.logging import logger
from app.modules.identity_verification.models import (
    IdentityVerification,
    SupportedIdType,
    VerificationStatus,
)
from app.modules.identity_verification.schemas import (
    ExtractedFields,
    ScanIdResponse,
    VerifyFaceResponse,
)
from app.modules.identity_verification.services.ocr_service import IdOcrService
from app.modules.identity_verification.services.face_matching_service import FaceMatchingService

router = APIRouter()

# Ephemeral storage for raw ID card bytes between Step 2 and Step 4
# Stored in-memory with file-backed survival across server process reloads
_TEMP_ID_IMAGES: Dict[str, bytes] = {}
TEMP_VERIFICATION_DIR = settings.STORAGE_UPLOAD_DIR / "temp_id_verifications"
try:
    TEMP_VERIFICATION_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass


def _calculate_age(dob_str: str | None) -> int | None:
    if not dob_str:
        return None
    try:
        born = datetime.strptime(dob_str, "%Y-%m-%d").date()
        today = date.today()
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
    except Exception:
        return None


# POST endpoint scanning government ID, stripping telemetry metadata, and extracting citizen name and DOB.
@router.post(
    "/identity-verification/scan-id",
    response_model=ScanIdResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan government ID and extract personal details (Step 1 & 2)",
)
async def scan_government_id(
    id_type: SupportedIdType = Form(...),
    file: UploadFile = File(...),
    back_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
) -> ScanIdResponse:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    back_content = None
    if back_file:
        back_content = await back_file.read()

    ocr_service = IdOcrService()
    extracted = ocr_service.extract_id_data(content, id_type, back_bytes=back_content)

    if not extracted.is_readable:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Uploaded ID is unreadable or blurry: {extracted.details} Please upload a clear photo with even lighting.",
        )

    # Check for existing record by this ID's unique hash
    existing_record = db.execute(
        select(IdentityVerification).where(
            IdentityVerification.id_number_hash == extracted.id_number_hash
        )
    ).scalar_one_or_none()

    if existing_record and existing_record.user_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This government ID number is already registered to an existing resident account.",
        )

    # Generate temporary session ID
    temp_verification_id = f"temp_{secrets.token_urlsafe(32)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    dob_val = None
    if extracted.dob:
        try:
            dob_val = datetime.strptime(extracted.dob, "%Y-%m-%d").date()
        except Exception:
            pass

    if existing_record:
        verification = existing_record
        verification.id_type = id_type
        verification.id_number_masked = extracted.id_number_masked
        verification.ocr_full_name = extracted.full_name
        verification.submitted_full_name = extracted.full_name
        verification.dob_extracted = dob_val
        verification.address_extracted = extracted.address
        verification.status = VerificationStatus.PENDING
        verification.verification_token_hash = hash_token(temp_verification_id)
        verification.token_expires_at = expires_at
        verification.match_score = None
    else:
        # Record pending verification entry
        verification = IdentityVerification(
            id_type=id_type,
            id_number_hash=extracted.id_number_hash,
            id_number_masked=extracted.id_number_masked,
            ocr_full_name=extracted.full_name,
            submitted_full_name=extracted.full_name,
            dob_extracted=dob_val,
            address_extracted=extracted.address,
            status=VerificationStatus.PENDING,
            verification_token_hash=hash_token(temp_verification_id),
            token_expires_at=expires_at,
            is_demo_data=True,
        )
        db.add(verification)
    db.commit()

    # Cache cleaned ID image ephemerally for face matching with disk persistence
    _TEMP_ID_IMAGES[temp_verification_id] = content
    try:
        temp_file = TEMP_VERIFICATION_DIR / f"{temp_verification_id}.bin"
        temp_file.write_bytes(content)
    except Exception as err:
        logger.warning("Could not persist temporary ID image: %s", err)

    if back_content:
        _TEMP_ID_IMAGES[f"{temp_verification_id}_back"] = back_content
        try:
            back_temp_file = TEMP_VERIFICATION_DIR / f"{temp_verification_id}_back.bin"
            back_temp_file.write_bytes(back_content)
        except Exception as err:
            logger.warning("Could not persist temporary back ID image: %s", err)

    age = _calculate_age(extracted.dob)

    return ScanIdResponse(
        temp_verification_id=temp_verification_id,
        extracted_data=ExtractedFields(
            full_name=extracted.full_name,
            dob=extracted.dob,
            age=age,
            address=extracted.address,
            id_number_masked=extracted.id_number_masked,
            id_type=id_type,
        ),
        message="Government ID scanned successfully. Please proceed to face registration.",
    )


# POST endpoint comparing live camera selfie portrait against the ID photo to issue a signed registration token.
@router.post(
    "/identity-verification/verify-face",
    response_model=VerifyFaceResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify captured live face against ID portrait (Step 3 & 4)",
)
async def verify_face_biometrics(
    temp_verification_id: str = Form(...),
    live_face: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> VerifyFaceResponse:
    live_bytes = await live_face.read()
    if not live_bytes:
        raise HTTPException(status_code=400, detail="Captured face image is empty.")

    # Retrieve pending or active verification record
    temp_hash = hash_token(temp_verification_id)
    verification = db.execute(
        select(IdentityVerification).where(
            IdentityVerification.verification_token_hash == temp_hash,
            IdentityVerification.status.in_([VerificationStatus.PENDING, VerificationStatus.REJECTED]),
        )
    ).scalar_one_or_none()

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification session expired or not found. Please rescan your government ID.",
        )

    now = datetime.now(timezone.utc)
    expires = verification.token_expires_at
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires and now > expires:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Verification session has timed out (15 minute limit). Please rescan your ID.",
        )

    # Retrieve cached ID image from memory or persistent temp directory
    id_bytes = _TEMP_ID_IMAGES.get(temp_verification_id)
    if not id_bytes:
        temp_file = TEMP_VERIFICATION_DIR / f"{temp_verification_id}.bin"
        if temp_file.is_file():
            try:
                id_bytes = temp_file.read_bytes()
                _TEMP_ID_IMAGES[temp_verification_id] = id_bytes
            except Exception as err:
                logger.warning("Failed to read cached ID file: %s", err)
                id_bytes = None

    if not id_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Original government ID image not found for this verification session. Please rescan your ID card.",
        )

    matcher = FaceMatchingService()
    result = matcher.compare_faces(id_bytes, live_bytes)

    if not result.is_match:
        verification.match_score = result.match_score
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{result.details} Please center your face inside the oval frame with clear lighting and retry.",
        )

    # Immediately purge temporary raw images upon successful verification (RA 10173 ephemeral compliance)
    _TEMP_ID_IMAGES.pop(temp_verification_id, None)
    _TEMP_ID_IMAGES.pop(f"{temp_verification_id}_back", None)
    try:
        (TEMP_VERIFICATION_DIR / f"{temp_verification_id}.bin").unlink(missing_ok=True)
        (TEMP_VERIFICATION_DIR / f"{temp_verification_id}_back.bin").unlink(missing_ok=True)
    except Exception:
        pass

    # Cache verified face template for biometric login capability
    try:
        template_dir = settings.STORAGE_UPLOAD_DIR / "biometric_templates"
        template_dir.mkdir(parents=True, exist_ok=True)
        (template_dir / f"temp_{verification.id}.jpg").write_bytes(live_bytes)
    except Exception as err:
        logger.warning("Failed to cache verified face biometric template: %s", err)

    # Generate final single-use verification token for registration
    raw_token = f"sab_ver_{secrets.token_urlsafe(32)}"
    verification.status = VerificationStatus.VERIFIED
    verification.match_score = result.match_score
    verification.verification_token_hash = hash_token(raw_token)
    verification.token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    return VerifyFaceResponse(
        verification_token=raw_token,
        match_score=result.match_score,
        status="VERIFIED",
        message="Face biometrics verified successfully against government ID.",
        details=result.details,
    )
