import pytest
from starlette.testclient import TestClient

from app.core.config import settings


def _login(client: TestClient, email: str, password: str = "TestSecretPassword123!"):
    """Helper to authenticate and retrieve session and CSRF tokens."""
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    data = res.json()
    csrf_token = data["csrf_token"]
    session_cookie = res.cookies.get(settings.SESSION_COOKIE_NAME)
    return csrf_token, session_cookie


def test_staff_can_publish_announcement(client: TestClient):
    csrf_token, session_cookie = _login(client, "staff@sabtrack.test")

    payload = {
        "title": "Barangay Sabang Clean-Up Drive this Saturday",
        "content": "All residents are encouraged to participate in our quarterly riverbank clean-up activity.",
        "category": "CLEANUP_DRIVE",
        "is_pinned": True,
    }

    res = client.post(
        "/api/v1/announcements",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 201
    data = res.json()
    assert data["title"] == payload["title"]
    assert data["category"] == "CLEANUP_DRIVE"
    assert data["is_pinned"] is True
    assert data["author_name"] == "Test Staff Reviewer"


def test_admin_can_publish_announcement(client: TestClient):
    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    payload = {
        "title": "Strict Implementation of RA 9003 Segregation at Source",
        "content": "Unsegregated waste will not be collected pursuant to Municipal Ordinance 2024-08.",
        "category": "POLICY_UPDATE",
        "is_pinned": False,
    }

    res = client.post(
        "/api/v1/announcements",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 201
    data = res.json()
    assert data["category"] == "POLICY_UPDATE"


def test_resident_cannot_publish_announcement(client: TestClient):
    csrf_token, session_cookie = _login(client, "resident@sabtrack.test")

    payload = {
        "title": "Unauthorized resident broadcast test",
        "content": "This should be rejected by RBAC permission enforcement.",
        "category": "GENERAL",
    }

    res = client.post(
        "/api/v1/announcements",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 403


def test_anyone_can_read_and_filter_announcements(client: TestClient):
    csrf_token, session_cookie = _login(client, "staff@sabtrack.test")

    # Seed an emergency announcement
    client.post(
        "/api/v1/announcements",
        json={
            "title": "Typhoon Advisory: Scheduled Pickup Paused",
            "content": "Waste collection temporarily paused during Tropical Storm Signal 2.",
            "category": "EMERGENCY",
            "is_pinned": True,
        },
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    # Read all
    res = client.get("/api/v1/announcements")
    assert res.status_code == 200
    assert res.json()["total"] >= 1

    # Filter by category
    res_cat = client.get("/api/v1/announcements?category=EMERGENCY")
    assert res_cat.status_code == 200
    assert len(res_cat.json()["items"]) >= 1


def test_staff_can_deactivate_announcement(client: TestClient):
    csrf_token, session_cookie = _login(client, "staff@sabtrack.test")

    # Create
    create_res = client.post(
        "/api/v1/announcements",
        json={
            "title": "Expired Notice for Deactivation",
            "content": "This announcement has passed and will be removed from display.",
            "category": "GENERAL",
        },
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    announcement_id = create_res.json()["id"]

    # Deactivate
    del_res = client.delete(
        f"/api/v1/announcements/{announcement_id}",
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert del_res.status_code == 200

    # Verify not in active list
    list_res = client.get("/api/v1/announcements")
    active_ids = [a["id"] for a in list_res.json()["items"]]
    assert announcement_id not in active_ids
