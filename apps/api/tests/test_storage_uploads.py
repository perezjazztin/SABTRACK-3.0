import io
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from starlette.testclient import TestClient

from app.core.config import settings


def _login(client: TestClient, email: str = "resident@sabtrack.test", password: str = "TestSecretPassword123!"):
    """Helper to authenticate and retrieve session and CSRF tokens."""
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    data = res.json()
    csrf_token = data["csrf_token"]
    session_cookie = res.cookies.get(settings.SESSION_COOKIE_NAME)
    return csrf_token, session_cookie


def _create_image_with_exif() -> bytes:
    """Creates an in-memory JPEG image with synthetic EXIF metadata."""
    img = Image.new("RGB", (100, 100), color="blue")
    exif = img.getexif()
    # 0x010E is ImageDescription, 0x010F is Make, 0x0110 is Model
    exif[0x010E] = "Sensitive GPS and Location Data"
    exif[0x010F] = "CameraBrand"
    exif[0x0110] = "CameraModel123"

    buf = io.BytesIO()
    img.save(buf, format="JPEG", exif=exif)
    return buf.getvalue()


def test_upload_image_success_and_strips_exif(client: TestClient):
    """Verifies image upload succeeds, assigns UUID filename, and strips all EXIF metadata."""
    csrf_token, session_cookie = _login(client)
    image_bytes = _create_image_with_exif()

    files = {"file": ("test_report_photo.jpg", image_bytes, "image/jpeg")}
    res = client.post(
        "/api/v1/uploads",
        files=files,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 201
    data = res.json()
    assert "file_url" in data
    assert "filename" in data
    filename = data["filename"]
    assert filename.endswith(".jpg")
    assert "/api/v1/uploads/" in data["file_url"]

    # Verify physical file existence and EXIF scrubbing
    saved_path = settings.STORAGE_UPLOAD_DIR / filename
    assert saved_path.exists()

    with Image.open(saved_path) as saved_img:
        saved_exif = saved_img.getexif()
        # Verify sensitive tags are completely absent
        assert 0x010E not in saved_exif
        assert 0x010F not in saved_exif
        assert 0x0110 not in saved_exif


def test_upload_unauthenticated_returns_401(client: TestClient):
    """Verifies that unauthenticated upload requests are denied."""
    client.cookies.clear()
    image_bytes = _create_image_with_exif()
    files = {"file": ("test.jpg", image_bytes, "image/jpeg")}
    res = client.post("/api/v1/uploads", files=files)
    assert res.status_code == 401


def test_upload_non_image_fails_with_400(client: TestClient):
    """Verifies that non-image payloads (even with image extension) are rejected."""
    csrf_token, session_cookie = _login(client)
    fake_bytes = b"This is not a real image header at all."

    files = {"file": ("malicious.jpg", fake_bytes, "image/jpeg")}
    res = client.post(
        "/api/v1/uploads",
        files=files,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 400
    data = res.json()
    error_msg = data.get("error", {}).get("message") or data.get("detail", "")
    assert "valid image" in error_msg.lower()


def test_download_image_authenticated(client: TestClient):
    """Verifies that logged-in users can securely stream/download stored images."""
    csrf_token, session_cookie = _login(client)
    image_bytes = _create_image_with_exif()

    # Upload first
    upload_res = client.post(
        "/api/v1/uploads",
        files={"file": ("evidence.jpg", image_bytes, "image/jpeg")},
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert upload_res.status_code == 201
    filename = upload_res.json()["filename"]

    # Fetch download
    download_res = client.get(
        f"/api/v1/uploads/{filename}",
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert download_res.status_code == 200
    assert download_res.headers["content-type"] in ["image/jpeg", "image/jpg"]
    assert len(download_res.content) > 0


def test_download_image_unauthenticated_returns_401(client: TestClient):
    """Verifies that unauthenticated downloads are prohibited under RA 10173."""
    csrf_token, session_cookie = _login(client)
    image_bytes = _create_image_with_exif()

    upload_res = client.post(
        "/api/v1/uploads",
        files={"file": ("evidence2.jpg", image_bytes, "image/jpeg")},
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert upload_res.status_code == 201
    filename = upload_res.json()["filename"]

    # Clear cookies to simulate unauthenticated visitor
    client.cookies.clear()
    download_res = client.get(f"/api/v1/uploads/{filename}")
    assert download_res.status_code == 401


def test_download_directory_traversal_returns_400(client: TestClient):
    """Verifies that directory traversal payloads are blocked."""
    _, session_cookie = _login(client)
    res = client.get(
        "/api/v1/uploads/..%2F..%2Fmain.py",
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res.status_code in (400, 404)


def test_download_nonexistent_returns_404(client: TestClient):
    """Verifies 404 for missing files."""
    _, session_cookie = _login(client)
    res = client.get(
        "/api/v1/uploads/00000000-0000-0000-0000-000000000000.jpg",
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res.status_code == 404
