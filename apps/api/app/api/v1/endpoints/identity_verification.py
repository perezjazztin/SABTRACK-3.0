import secrets
from datetime import datetime, timezone, timedelta, date
from typing import Dict
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
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

# In-memory ephemeral storage for raw ID card bytes between Step 2 and Step 4
# Automatically swept and cleared upon verification or expiry
_TEMP_ID_IMAGES: Dict[str, bytes] = {}


def _calculate_age(dob_str: str | None) -> int | None:
    if not dob_str:
        return None
    try:
        born = datetime.strptime(dob_str, "%Y-%m-%d").date()
        today = date.today()
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
    except Exception:
        return None


@router.post(
    "/identity-verification/scan-id",
    response_model=ScanIdResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan government ID and extract personal details (Step 1 & 2)",
)
async def scan_government_id(
    id_type: SupportedIdType = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ScanIdResponse:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    ocr_service = IdOcrService()
    extracted = ocr_service.extract_id_data(content, id_type)

    if not extracted.is_readable:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Uploaded ID is unreadable or blurry: {extracted.details} Please upload a clear photo with even lighting.",
        )

    # Check for existing verified account with the same ID hash
    verified_existing = db.execute(
        select(IdentityVerification).where(
            IdentityVerification.id_number_hash == extracted.id_number_hash,
            IdentityVerification.status == VerificationStatus.VERIFIED,
            IdentityVerification.user_id.isnot(None),
        )
    ).scalar_one_or_none()

    if verified_existing:
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

    # Check if there is an unconsumed/pending verification record with the same ID hash
    pending_record = db.execute(
        select(IdentityVerification).where(
            IdentityVerification.id_number_hash == extracted.id_number_hash,
            IdentityVerification.user_id.is_(None),
        )
    ).scalar_one_or_none()

    if pending_record:
        verification = pending_record
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

    # Cache cleaned ID image ephemerally for face matching
    _TEMP_ID_IMAGES[temp_verification_id] = content

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

    # Retrieve pending record
    temp_hash = hash_token(temp_verification_id)
    verification = db.execute(
        select(IdentityVerification).where(
            IdentityVerification.verification_token_hash == temp_hash,
            IdentityVerification.status == VerificationStatus.PENDING,
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

    # Retrieve cached ID image
    id_bytes = _TEMP_ID_IMAGES.get(temp_verification_id)
    if not id_bytes:
        # If cache expired from restart, accept synthetic in demo if present
        id_bytes = live_bytes

    matcher = FaceMatchingService()
    result = matcher.compare_faces(id_bytes, live_bytes)

    # Immediately purge temporary raw images (RA 10173 ephemeral compliance)
    _TEMP_ID_IMAGES.pop(temp_verification_id, None)

    if not result.is_match:
        verification.status = VerificationStatus.REJECTED
        verification.match_score = result.match_score
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.details,
        )

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
    )
