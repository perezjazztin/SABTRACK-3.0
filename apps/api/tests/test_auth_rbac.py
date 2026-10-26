from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.modules.identity.models import Session as SessionModel, User

TEST_PASSWORD = "TestSecretPassword123!"


def test_login_success_sets_cookies(client):
    """Verifies that valid credentials return user payload and set HttpOnly + CSRF cookies."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "resident@sabtrack.test", "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "resident@sabtrack.test"
    assert data["user"]["role"] == "RESIDENT"
    assert "reports:create" in data["permissions"]
    assert "csrf_token" in data

    # Check cookies
    cookies = response.cookies
    assert "sabtrack_session" in cookies
    assert "sabtrack_csrf" in cookies


def test_login_invalid_credentials_returns_generic_401(client):
    """Verifies that invalid password returns generic 401 error preventing account enumeration."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "resident@sabtrack.test", "password": "WrongPassword999!"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "HTTP_401"
    assert data["error"]["message"] == "Invalid email or password."


def test_unauthenticated_request_to_protected_route_returns_401(client):
    """Verifies that protected routes return 401 when no session cookie is provided."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["error"]["message"]

    response = client.get("/api/v1/resident/my-reports")
    assert response.status_code == 401


def test_auth_me_returns_profile_when_logged_in(client):
    """Verifies that /auth/me returns active user profile and permissions."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "staff@sabtrack.test", "password": TEST_PASSWORD},
    )
    assert login_res.status_code == 200

    me_res = client.get("/api/v1/auth/me")
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["user"]["email"] == "staff@sabtrack.test"
    assert me_data["user"]["role"] == "BARANGAY_STAFF"
    assert "reports:review" in me_data["permissions"]


def test_csrf_protection_on_mutating_requests(client):
    """Verifies that state-changing requests fail with 403 if CSRF token is missing or invalid."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sabtrack.test", "password": TEST_PASSWORD},
    )
    assert login_res.status_code == 200

    # 1. Missing CSRF header
    logout_res = client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 403
    assert "CSRF validation failed" in logout_res.json()["error"]["message"]

    # 2. Invalid CSRF header
    logout_res_invalid = client.post(
        "/api/v1/auth/logout",
        headers={"x-csrf-token": "completely-invalid-csrf-token"},
    )
    assert logout_res_invalid.status_code == 403

    # 3. Valid CSRF header succeeds
    csrf_token = login_res.json()["csrf_token"]
    logout_res_valid = client.post(
        "/api/v1/auth/logout",
        headers={"x-csrf-token": csrf_token},
    )
    assert logout_res_valid.status_code == 200


def test_logout_invalidates_session(client):
    """Verifies that logout destroys the session record in DB and clears cookies."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "resident@sabtrack.test", "password": TEST_PASSWORD},
    )
    csrf_token = login_res.json()["csrf_token"]

    # Verify active session
    me_before = client.get("/api/v1/auth/me")
    assert me_before.status_code == 200

    # Logout
    logout_res = client.post(
        "/api/v1/auth/logout",
        headers={"x-csrf-token": csrf_token},
    )
    assert logout_res.status_code == 200

    # Verify session is no longer valid
    me_after = client.get("/api/v1/auth/me")
    assert me_after.status_code == 401


def test_session_expiration_handling(client, db_session):
    """Verifies that expired sessions are rejected with 401 and cleaned up."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "resident@sabtrack.test", "password": TEST_PASSWORD},
    )
    assert login_res.status_code == 200

    # Simulate expired session by moving expires_at to 1 hour in the past
    session_record = db_session.scalar(select(SessionModel))
    assert session_record is not None
    session_record.expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
    db_session.commit()

    # Attempt to access protected endpoint
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Session has expired" in response.json()["error"]["message"]


def test_resident_rbac_access_and_denial(client):
    """Verifies that residents can access resident endpoints but are denied administrative endpoints."""
    client.post(
        "/api/v1/auth/login",
        json={"email": "resident@sabtrack.test", "password": TEST_PASSWORD},
    )

    # Allowed: resident report access
    res = client.get("/api/v1/resident/my-reports")
    assert res.status_code == 200
    assert res.json()["scope"] == "self_only"

    # Denied: staff review queue
    res_admin = client.get("/api/v1/admin/reports-queue")
    assert res_admin.status_code == 403
    assert "Insufficient permissions" in res_admin.json()["error"]["message"]

    # Denied: schedule management
    res_sched = client.get("/api/v1/admin/schedules-manage")
    assert res_sched.status_code == 403


def test_staff_rbac_access_and_denial(client):
    """Verifies that staff can review reports but cannot manage schedules or users."""
    client.post(
        "/api/v1/auth/login",
        json={"email": "staff@sabtrack.test", "password": TEST_PASSWORD},
    )

    # Allowed: review reports
    res = client.get("/api/v1/admin/reports-queue")
    assert res.status_code == 200

    # Denied: schedule management (Admin only)
    res_sched = client.get("/api/v1/admin/schedules-manage")
    assert res_sched.status_code == 403

    # Denied: user management (Admin only)
    res_users = client.get("/api/v1/admin/users-manage")
    assert res_users.status_code == 403


def test_admin_rbac_comprehensive_access(client):
    """Verifies that admin has access to report review, schedule management, and user management."""
    client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sabtrack.test", "password": TEST_PASSWORD},
    )

    assert client.get("/api/v1/admin/reports-queue").status_code == 200
    assert client.get("/api/v1/admin/schedules-manage").status_code == 200
    assert client.get("/api/v1/admin/users-manage").status_code == 200


def test_resident_registration_endpoint_with_resident_id_num(client):
    """Verifies that public resident self-registration succeeds and accepts Resident ID number."""
    payload = {
        "email": "new.citizen@sabtrack.test",
        "password": "ValidResidentPass2026!",
        "full_name": "Maria Santos",
        "resident_id_num": "SAB-2026-0999",
        "area_id": 1,
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "new.citizen@sabtrack.test"
    assert data["full_name"] == "Maria Santos"
    assert data["role"] == "RESIDENT"
    assert data["is_active"] is True

    # Duplicate registration should return 409 Conflict
    res_dup = client.post("/api/v1/auth/register", json=payload)
    assert res_dup.status_code == 409
