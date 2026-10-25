from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.core.deps import get_current_user, verify_csrf
from app.modules.identity.models import User as UserModel
from app.modules.storage.service import StorageService

router = APIRouter()


class UploadResponse(BaseModel):
    """Schema for successful file upload response."""
    file_url: str = Field(..., description="API relative path to download/render the uploaded image")
    filename: str = Field(..., description="Internal sanitized UUID filename")


@router.post(
    "/uploads",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and sanitize an evidence image",
    dependencies=[Depends(verify_csrf)],
)
async def upload_image(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user),
):
    """Uploads an evidence photo (JPEG, PNG, WebP up to 5MB).

    Automatically strips all EXIF metadata (GPS telemetry, timestamps, camera hardware serials)
    to ensure compliance with RA 10173 (Data Privacy Act of 2012).
    """
    result = await StorageService.sanitize_and_save_image(file)
    return UploadResponse(**result)


@router.get(
    "/uploads/{filename}",
    summary="Download or stream an authenticated evidence photo",
)
def get_uploaded_image(
    filename: str,
    current_user: UserModel = Depends(get_current_user),
):
    """Securely streams a stored photo to authenticated users.

    Guards against path traversal and blocks unauthenticated public access.
    """
    file_path = StorageService.resolve_upload_path(filename)
    
    media_type = "image/jpeg"
    ext = file_path.suffix.lower()
    if ext == ".png":
        media_type = "image/png"
    elif ext == ".webp":
        media_type = "image/webp"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename,
    )
