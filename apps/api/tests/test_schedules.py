import pytest
from starlette.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.areas.models import Area


def _login(client: TestClient, email: str, password: str = "TestSecretPassword123!"):
    """Helper to authenticate and retrieve session and CSRF tokens."""
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    data = res.json()
    csrf_token = data["csrf_token"]
    session_cookie = res.cookies.get(settings.SESSION_COOKIE_NAME)
    return csrf_token, session_cookie


@pytest.fixture
def test_area(db_session: Session) -> Area:
    area = Area(code="ZONE-A", name="Purok Ilang-Ilang", is_active=True, is_demo_data=True)
    db_session.add(area)
    db_session.commit()
    db_session.refresh(area)
    return area


def test_admin_can_create_schedule(client: TestClient, test_area: Area):
    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    payload = {
        "area_id": test_area.id,
        "day_of_week": "MONDAY",
        "waste_type": "BIODEGRADABLE",
        "start_time": "06:00 AM",
        "end_time": "09:00 AM",
        "notes": "Place green bins curbside before 6 AM",
    }

    res = client.post(
        "/api/v1/schedules",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 201
    data = res.json()
    assert data["area_id"] == test_area.id
    assert data["day_of_week"] == "MONDAY"
    assert data["waste_type"] == "BIODEGRADABLE"
    assert data["start_time"] == "06:00 AM"


def test_resident_cannot_create_schedule(client: TestClient, test_area: Area):
    csrf_token, session_cookie = _login(client, "resident@sabtrack.test")

    payload = {
        "area_id": test_area.id,
        "day_of_week": "TUESDAY",
        "waste_type": "NON_BIODEGRADABLE",
        "start_time": "07:00 AM",
        "end_time": "10:00 AM",
    }

    res = client.post(
        "/api/v1/schedules",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    # 403 Forbidden because resident lacks schedules:manage permission
    assert res.status_code == 403


def test_anyone_can_read_and_filter_schedules(client: TestClient, test_area: Area):
    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    # Create 2 schedules
    client.post(
        "/api/v1/schedules",
        json={
            "area_id": test_area.id,
            "day_of_week": "WEDNESDAY",
            "waste_type": "RECYCLABLE",
            "start_time": "08:00 AM",
            "end_time": "11:00 AM",
        },
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    # Read without filter
    res = client.get("/api/v1/schedules")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1

    # Filter by area_id
    res_filtered = client.get(f"/api/v1/schedules?area_id={test_area.id}")
    assert res_filtered.status_code == 200
    assert len(res_filtered.json()["items"]) >= 1


def test_admin_can_deactivate_schedule(client: TestClient, test_area: Area):
    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    # Create schedule
    create_res = client.post(
        "/api/v1/schedules",
        json={
            "area_id": test_area.id,
            "day_of_week": "FRIDAY",
            "waste_type": "BIODEGRADABLE",
            "start_time": "06:00 AM",
            "end_time": "09:00 AM",
        },
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    schedule_id = create_res.json()["id"]

    # Deactivate
    del_res = client.delete(
        f"/api/v1/schedules/{schedule_id}",
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert del_res.status_code == 200

    # Verify not in active list
    list_res = client.get(f"/api/v1/schedules?area_id={test_area.id}")
    active_ids = [s["id"] for s in list_res.json()["items"]]
    assert schedule_id not in active_ids


def test_admin_can_broadcast_advisory(client: TestClient, test_area: Area):
    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    payload = {
        "area_id": test_area.id,
        "title": "Truck 3 Hydraulic Maintenance Delay",
        "message": "Collection scheduled for Oct 25 morning will proceed starting 1:00 PM due to truck maintenance.",
        "advisory_type": "DELAY",
        "effective_date": "2026-10-25",
    }

    res = client.post(
        "/api/v1/schedules/advisories",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == payload["title"]
    assert data["advisory_type"] == "DELAY"

    # Read advisories
    adv_res = client.get("/api/v1/schedules/advisories")
    assert adv_res.status_code == 200
    assert adv_res.json()["total"] >= 1


def test_user_can_subscribe_schedule_email_notification(client: TestClient, test_area: Area):
    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    # Create a schedule
    create_res = client.post(
        "/api/v1/schedules",
        json={
            "area_id": test_area.id,
            "day_of_week": "THURSDAY",
            "waste_type": "RECYCLABLE",
            "start_time": "08:00 AM",
            "end_time": "11:00 AM",
            "notes": "Bring dry recyclables to collection gate",
        },
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    schedule_id = create_res.json()["id"]

    # Subscribe with explicit email
    sub_res = client.post(
        f"/api/v1/schedules/{schedule_id}/notify",
        json={"email": "sabang.resident@example.com"},
    )
    assert sub_res.status_code == 200
    data = sub_res.json()
    assert data["schedule_id"] == schedule_id
    assert data["recipient_email"] == "sabang.resident@example.com"
    assert "Reminder notification registered" in data["message"]
    assert data["day_of_week"] == "THURSDAY"
    assert data["waste_type"] == "RECYCLABLE"


def test_authenticated_resident_can_subscribe_using_session_email(client: TestClient, test_area: Area):
    admin_csrf, admin_session = _login(client, "admin@sabtrack.test")

    create_res = client.post(
        "/api/v1/schedules",
        json={
            "area_id": test_area.id,
            "day_of_week": "SATURDAY",
            "waste_type": "SPECIAL_HAZARDOUS",
            "start_time": "09:00 AM",
            "end_time": "12:00 PM",
        },
        headers={"x-csrf-token": admin_csrf},
        cookies={settings.SESSION_COOKIE_NAME: admin_session},
    )
    schedule_id = create_res.json()["id"]

    # Login as resident
    _, resident_session = _login(client, "resident@sabtrack.test")

    # Post with empty email, expecting fallback to session user email
    sub_res = client.post(
        f"/api/v1/schedules/{schedule_id}/notify",
        json={},
        cookies={settings.SESSION_COOKIE_NAME: resident_session},
    )
    assert sub_res.status_code == 200
    assert sub_res.json()["recipient_email"] == "resident@sabtrack.test"


def test_subscribe_missing_or_invalid_email_and_nonexistent_schedule(client: TestClient):
    # 1. Missing email without session -> 400
    bad_res = client.post("/api/v1/schedules/9999/notify", json={})
    assert bad_res.status_code == 400

    # 2. Invalid format -> 400
    bad_email_res = client.post("/api/v1/schedules/9999/notify", json={"email": "not-an-email"})
    assert bad_email_res.status_code == 400

    # 3. Valid email but schedule doesn't exist -> 404
    not_found_res = client.post("/api/v1/schedules/9999/notify", json={"email": "resident@example.com"})
    assert not_found_res.status_code == 404
