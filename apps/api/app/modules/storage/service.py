import io
import re
import uuid
from pathlib import Path
from typing import Dict, Tuple
from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.logging import logger

# Allowed MIME types and extensions
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

# Strict filename pattern: only UUIDs or safe alphanumeric filenames with image extensions
SAFE_FILENAME_REGEX = re.compile(r"^[a-zA-Z0-9_\-]+\.(jpg|jpeg|png|webp)$", re.IGNORECASE)


class StorageService:
    """Handles secure file validation, EXIF metadata stripping, and storage."""

    @staticmethod
    async def sanitize_and_save_image(file: UploadFile) -> Dict[str, str]:
        """Validates, strips all EXIF metadata, and saves an uploaded image."""
        # 1. Content-Type check
        content_type = file.content_type or ""
        if content_type.lower() not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{content_type}'. Only JPEG, PNG, and WebP images are allowed.",
            )

        # 2. Read bytes and enforce size limit
        contents = await file.read()
        if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
            max_mb = settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {max_mb} MB.",
            )

        if len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        # 3. Verify and sanitize image with Pillow (strips EXIF tags per RA 10173)
        try:
            input_buffer = io.BytesIO(contents)
            with Image.open(input_buffer) as img:
                # Load image data into memory
                img.load()
                image_format = (img.format or "").upper()
                if image_format not in ("JPEG", "JPG", "PNG", "WEBP"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Provided file is not a valid JPEG, PNG, or WebP image.",
                    )

                # Determine target extension and output format
                ext = ".jpg"
                save_format = "JPEG"
                if image_format == "PNG":
                    ext = ".png"
                    save_format = "PNG"
                elif image_format == "WEBP":
                    ext = ".webp"
                    save_format = "WEBP"

                # Convert mode if necessary for JPEG
                clean_img = img
                if save_format == "JPEG" and img.mode in ("RGBA", "P"):
                    clean_img = img.convert("RGB")

                # Generate secure UUID filename
                unique_id = uuid.uuid4()
                filename = f"{unique_id}{ext}"
                target_path = settings.STORAGE_UPLOAD_DIR / filename

                # Ensure directory exists
                settings.STORAGE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

                # Save without EXIF metadata (strips GPS, timestamps, camera serials)
                # Setting exif=b"" ensures zero EXIF bytes are written
                if save_format in ("JPEG", "WEBP"):
                    clean_img.save(target_path, format=save_format, quality=85, exif=b"")
                else:
                    clean_img.save(target_path, format=save_format)

                logger.info("Successfully sanitized and stored image: %s", filename)

                return {
                    "file_url": f"{settings.API_V1_STR}/uploads/{filename}",
                    "filename": filename,
                }

        except (UnidentifiedImageError, OSError, ValueError) as err:
            logger.warning("Rejected invalid image upload: %s", err)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is corrupt or not a valid image.",
            )

    @staticmethod
    def resolve_upload_path(filename: str) -> Path:
        """Safely resolves file path and guards against path traversal."""
        if not filename or not SAFE_FILENAME_REGEX.match(filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid filename format or potential directory traversal attempt.",
            )

        storage_root = settings.STORAGE_UPLOAD_DIR.resolve()
        target_path = (storage_root / filename).resolve()

        # Check path containment
        try:
            target_path.relative_to(storage_root)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Directory traversal detected.",
            )

        if not target_path.exists() or not target_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Requested file does not exist.",
            )

        return target_path
