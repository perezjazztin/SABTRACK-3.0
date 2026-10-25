import pytest
from starlette.testclient import TestClient

from app.core.config import settings
from app.modules.identity.models import User
from tests.conftest import TestingSessionLocal


def _login(client: TestClient, email: str, password: str = "TestSecretPassword123!"):
    """Helper to authenticate and retrieve session and CSRF tokens."""
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    data = res.json()
    csrf_token = data["csrf_token"]
    session_cookie = res.cookies.get(settings.SESSION_COOKIE_NAME)
    return csrf_token, session_cookie


def test_admin_can_list_users_with_filters(client: TestClient):
    """Verifies that an administrator can list system users and apply role/search filters."""
    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    # List all
    res = client.get(
        "/api/v1/users",
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 4
    assert any(u["email"] == "resident@sabtrack.test" for u in data["items"])

    # Filter by role
    res_staff = client.get(
        "/api/v1/users?role=BARANGAY_STAFF",
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res_staff.status_code == 200
    staff_data = res_staff.json()
    assert all(u["role"] == "BARANGAY_STAFF" for u in staff_data["items"])

    # Search by keyword
    res_search = client.get(
        "/api/v1/users?search=Resident",
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert any("Resident" in u["full_name"] for u in search_data["items"])


def test_admin_can_provision_new_staff(client: TestClient):
    """Verifies provisioning a new barangay staff account."""
    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    payload = {
        "email": "officer.batangas@sabtrack.local",
        "password": "SecurePassword2026!",
        "full_name": "Kagawad Juan Dela Cruz",
        "role": "BARANGAY_STAFF",
    }

    res = client.post(
        "/api/v1/users",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res.status_code == 201
    created = res.json()
    assert created["email"] == payload["email"]
    assert created["full_name"] == payload["full_name"]
    assert created["role"] == "BARANGAY_STAFF"
    assert created["is_active"] is True


def test_admin_cannot_provision_duplicate_email(client: TestClient):
    """Rejects account creation when email already exists (409 Conflict)."""
    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    payload = {
        "email": "resident@sabtrack.test",
        "password": "SecurePassword2026!",
        "full_name": "Duplicate Person",
        "role": "RESIDENT",
    }

    res = client.post(
        "/api/v1/users",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res.status_code == 409


def test_admin_can_deactivate_and_reactivate_user(client: TestClient):
    """Verifies toggling is_active status to manage personnel access."""
    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    # Find resident user ID
    res = client.get(
        "/api/v1/users?search=resident@sabtrack.test",
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    resident_id = res.json()["items"][0]["id"]

    # Deactivate
    patch_res = client.patch(
        f"/api/v1/users/{resident_id}/status",
        json={"is_active": False},
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["is_active"] is False

    # Reactivate
    reactivate_res = client.patch(
        f"/api/v1/users/{resident_id}/status",
        json={"is_active": True},
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert reactivate_res.status_code == 200
    assert reactivate_res.json()["is_active"] is True


def test_admin_cannot_deactivate_own_account(client: TestClient):
    """Safeguard: Prevents an admin from accidentally locking themselves out."""
    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    # Get admin's own ID
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    admin_id = me_res.json()["user"]["id"]

    res = client.patch(
        f"/api/v1/users/{admin_id}/status",
        json={"is_active": False},
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res.status_code == 400


def test_staff_can_view_users_directory(client: TestClient):
    """Verifies that barangay staff with USERS_READ can view user directory in view-only mode."""
    csrf_token, session_cookie = _login(client, "staff@sabtrack.test")

    res = client.get(
        "/api/v1/users",
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert "items" in data


def test_staff_denied_user_mutations(client: TestClient):
    """Enforces that staff cannot provision accounts, toggle active status, or change roles (users:manage required)."""
    csrf_token, session_cookie = _login(client, "staff@sabtrack.test")

    # Denied: Create user
    res_create = client.post(
        "/api/v1/users",
        json={
            "email": "unauthorized.staff@sabtrack.local",
            "password": "Password123!",
            "full_name": "Unauthorized User",
            "role": "RESIDENT",
        },
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res_create.status_code == 403

    # Denied: Update status
    res_status = client.patch(
        "/api/v1/users/1/status",
        json={"is_active": False},
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res_status.status_code == 403

    # Denied: Update role
    res_role = client.patch(
        "/api/v1/users/1/role",
        json={"role": "BARANGAY_ADMIN"},
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res_role.status_code == 403


def test_resident_and_maintainer_denied_user_management(client: TestClient):
    """Enforces least-privilege: RESIDENT and SYSTEM_MAINTAINER cannot read or manage users."""
    for role_email in ["resident@sabtrack.test", "maintainer@sabtrack.test"]:
        csrf_token, session_cookie = _login(client, role_email)

        res = client.get(
            "/api/v1/users",
            headers={"x-csrf-token": csrf_token},
            cookies={settings.SESSION_COOKIE_NAME: session_cookie},
        )
        assert res.status_code == 403

    client.cookies.clear()
    anon_res = client.get("/api/v1/users")
    assert anon_res.status_code == 401
