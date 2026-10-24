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


def test_resident_can_submit_waste_report(client: TestClient):
    csrf_token, session_cookie = _login(client, "resident@sabtrack.test")

    payload = {
        "category": "UNCOLLECTED_GARBAGE",
        "title": "Uncollected Biodegradable Bags on Corner",
        "description": "Garbage has not been picked up since Monday morning. Three bags on the sidewalk.",
        "location_text": "Sitio Sampaguita, corner of Main Street",
        "latitude": 13.9412,
        "longitude": 121.1625,
        "photo_url": "https://example.com/demo-photo.jpg",
    }

    res = client.post(
        "/api/v1/reports",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 201
    data = res.json()
    assert data["title"] == payload["title"]
    assert data["category"] == "UNCOLLECTED_GARBAGE"
    assert data["status"] == "SUBMITTED"
    assert data["location_text"] == payload["location_text"]
    assert len(data["status_history"]) == 1
    assert data["status_history"][0]["new_status"] == "SUBMITTED"


def test_resident_can_view_my_reports(client: TestClient):
    csrf_token, session_cookie = _login(client, "resident@sabtrack.test")

    # Create a report
    client.post(
        "/api/v1/reports",
        json={
            "category": "ILLEGAL_DUMPING",
            "title": "Illegal waste dump near creek",
            "description": "Plastic bottles and construction scraps dumped near creek bridge.",
            "location_text": "Creek Bridge, Sitio Ilaya",
        },
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    # Fetch resident reports
    res = client.get(
        "/api/v1/reports/my",
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert any(r["title"] == "Illegal waste dump near creek" for r in data["items"])


def test_resident_cannot_access_staff_review_queue(client: TestClient):
    _, session_cookie = _login(client, "resident@sabtrack.test")

    res = client.get(
        "/api/v1/reports",
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 403


def test_resident_cannot_update_report_status(client: TestClient):
    csrf_token, res_cookie = _login(client, "resident@sabtrack.test")

    create_res = client.post(
        "/api/v1/reports",
        json={
            "category": "OVERFLOWING_BIN",
            "title": "Overflowing Public Segregation Bin",
            "description": "Public bin near basketball court is overflowing with plastic bottles.",
            "location_text": "Public Basketball Court",
        },
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: res_cookie},
    )
    report_id = create_res.json()["id"]

    # Resident tries to update status to RESOLVED
    update_res = client.patch(
        f"/api/v1/reports/{report_id}/status",
        json={"status": "RESOLVED", "remarks": "Trying to resolve my own report"},
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: res_cookie},
    )

    assert update_res.status_code == 403


def test_staff_can_review_and_transition_report_status_with_immutable_history(client: TestClient):
    # 1. Resident creates report
    res_csrf, res_cookie = _login(client, "resident@sabtrack.test")
    create_res = client.post(
        "/api/v1/reports",
        json={
            "category": "HAZARDOUS_WASTE",
            "title": "Broken glass and chemical containers on roadside",
            "description": "Hazardous broken fluorescent tubes and discarded container bottles.",
            "location_text": "Purok 4 access road",
        },
        headers={"x-csrf-token": res_csrf},
        cookies={settings.SESSION_COOKIE_NAME: res_cookie},
    )
    assert create_res.status_code == 201
    report_id = create_res.json()["id"]

    # 2. Staff logs in and reviews reports
    staff_csrf, staff_cookie = _login(client, "staff@sabtrack.test")
    list_res = client.get(
        "/api/v1/reports",
        cookies={settings.SESSION_COOKIE_NAME: staff_cookie},
    )
    assert list_res.status_code == 200
    assert any(r["id"] == report_id for r in list_res.json()["items"])

    # 3. Staff updates status to UNDER_REVIEW
    review_res = client.patch(
        f"/api/v1/reports/{report_id}/status",
        json={
            "status": "UNDER_REVIEW",
            "remarks": "Assigned Tanod team for site inspection.",
            "admin_notes": "Inspection scheduled for 2:00 PM.",
        },
        headers={"x-csrf-token": staff_csrf},
        cookies={settings.SESSION_COOKIE_NAME: staff_cookie},
    )
    assert review_res.status_code == 200
    data = review_res.json()
    assert data["status"] == "UNDER_REVIEW"
    assert data["admin_notes"] == "Inspection scheduled for 2:00 PM."

    # 4. Staff updates status to RESOLVED
    resolve_res = client.patch(
        f"/api/v1/reports/{report_id}/status",
        json={
            "status": "RESOLVED",
            "remarks": "Hazardous materials safely retrieved and stored for toxic waste hauler.",
        },
        headers={"x-csrf-token": staff_csrf},
        cookies={settings.SESSION_COOKIE_NAME: staff_cookie},
    )
    assert resolve_res.status_code == 200
    resolved_data = resolve_res.json()
    assert resolved_data["status"] == "RESOLVED"

    # 5. Verify immutable history has 3 records
    history = resolved_data["status_history"]
    assert len(history) == 3
    assert history[0]["new_status"] == "RESOLVED"
    assert history[0]["previous_status"] == "UNDER_REVIEW"
    assert history[1]["new_status"] == "UNDER_REVIEW"
    assert history[1]["previous_status"] == "SUBMITTED"
    assert history[2]["new_status"] == "SUBMITTED"
    assert history[2]["previous_status"] is None

    # 6. Resident views the report and sees the updated status
    resident_view = client.get(
        f"/api/v1/reports/{report_id}",
        cookies={settings.SESSION_COOKIE_NAME: res_cookie},
    )
    assert resident_view.status_code == 200
    res_data = resident_view.json()
    assert res_data["status"] == "RESOLVED"
    assert len(res_data["status_history"]) == 3
