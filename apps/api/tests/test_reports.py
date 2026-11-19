from datetime import datetime, timezone

from sqlalchemy import select
from starlette.testclient import TestClient

from app.core.config import settings
from app.modules.gamification.models import PointsLedger
from app.modules.identity.models import User
from app.modules.reports.models import Report, ReportCategory, ReportStatus


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
    assert data["photo_url"] == payload["photo_url"]
    assert len(data["status_history"]) == 1
    assert data["status_history"][0]["new_status"] == "SUBMITTED"


def test_resident_cannot_submit_report_without_photo(client: TestClient):
    csrf_token, session_cookie = _login(client, "resident@sabtrack.test")

    payload = {
        "category": "UNCOLLECTED_GARBAGE",
        "title": "Uncollected Biodegradable Bags on Corner",
        "description": "Garbage has not been picked up since Monday morning. Three bags on the sidewalk.",
        "location_text": "Sitio Sampaguita, corner of Main Street",
    }

    res = client.post(
        "/api/v1/reports",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 422


def test_resident_cannot_submit_report_with_empty_photo(client: TestClient):
    csrf_token, session_cookie = _login(client, "resident@sabtrack.test")

    payload = {
        "category": "UNCOLLECTED_GARBAGE",
        "title": "Uncollected Biodegradable Bags on Corner",
        "description": "Garbage has not been picked up since Monday morning. Three bags on the sidewalk.",
        "location_text": "Sitio Sampaguita, corner of Main Street",
        "photo_url": "   ",
    }

    res = client.post(
        "/api/v1/reports",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 422


def test_resident_can_view_my_reports(client: TestClient):
    csrf_token, session_cookie = _login(client, "resident@sabtrack.test")

    # Create a report with required photo
    client.post(
        "/api/v1/reports",
        json={
            "category": "ILLEGAL_DUMPING",
            "title": "Illegal waste dump near creek",
            "description": "Plastic bottles and construction scraps dumped near creek bridge.",
            "location_text": "Creek Bridge, Sitio Ilaya",
            "photo_url": "/api/v1/uploads/demo-creek.jpg",
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
            "photo_url": "/api/v1/uploads/demo-bin.jpg",
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
            "photo_url": "/api/v1/uploads/demo-hazardous.jpg",
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


def test_first_report_award_waits_for_staff_resolution(
    client: TestClient, db_session
):
    resident_csrf, resident_cookie = _login(client, "resident@sabtrack.test")
    staff_csrf, staff_cookie = _login(client, "staff@sabtrack.test")
    create_response = client.post(
        "/api/v1/reports",
        json={
            "category": "UNCOLLECTED_GARBAGE",
            "title": "Uncollected neighborhood garbage",
            "description": "Household waste has remained uncollected since yesterday.",
            "location_text": "Purok 2 near the community hall",
            "photo_url": "/api/v1/uploads/first-report.jpg",
        },
        headers={"x-csrf-token": resident_csrf},
        cookies={settings.SESSION_COOKIE_NAME: resident_cookie},
    )
    assert create_response.status_code == 201
    report_id = create_response.json()["id"]
    resident_id = create_response.json()["resident_id"]

    before_review = client.get(
        "/api/v1/gamification/tasks",
        cookies={settings.SESSION_COOKIE_NAME: resident_cookie},
    )
    assert next(t for t in before_review.json() if t["id"] == "first_report")["status"] == "AVAILABLE"

    under_review = client.patch(
        f"/api/v1/reports/{report_id}/status",
        json={"status": "UNDER_REVIEW"},
        headers={"x-csrf-token": staff_csrf},
        cookies={settings.SESSION_COOKIE_NAME: staff_cookie},
    )
    assert under_review.status_code == 200
    assert db_session.scalars(
        select(PointsLedger).where(PointsLedger.resident_id == resident_id)
    ).all() == []

    resolved = client.patch(
        f"/api/v1/reports/{report_id}/status",
        json={"status": "RESOLVED"},
        headers={"x-csrf-token": staff_csrf},
        cookies={settings.SESSION_COOKIE_NAME: staff_cookie},
    )
    assert resolved.status_code == 200
    awards = db_session.scalars(
        select(PointsLedger).where(PointsLedger.resident_id == resident_id)
    ).all()
    first_report_awards = [
        award for award in awards
        if getattr(award, "task_key", None) == "first_report"
    ]
    assert len(first_report_awards) == 1
    assert first_report_awards[0].points == 50
    assert getattr(first_report_awards[0], "task_source_id", None) == str(report_id)

    repeated_resolution = client.patch(
        f"/api/v1/reports/{report_id}/status",
        json={"status": "RESOLVED"},
        headers={"x-csrf-token": staff_csrf},
        cookies={settings.SESSION_COOKIE_NAME: staff_cookie},
    )
    assert repeated_resolution.status_code == 200
    assert len(
        [
            award
            for award in db_session.scalars(
                select(PointsLedger).where(PointsLedger.resident_id == resident_id)
            ).all()
            if getattr(award, "task_key", None) == "first_report"
        ]
    ) == 1


def test_prelaunch_report_cannot_earn_task_awards_after_resolution(
    client: TestClient, db_session
):
    resident = db_session.scalar(
        select(User).where(User.email == "resident@sabtrack.test")
    )
    assert resident is not None
    legacy_report = Report(
        resident_id=resident.id,
        category=ReportCategory.ILLEGAL_DUMPING,
        title="Legacy report with complete evidence",
        description="A pre-launch report with all required evidence fields.",
        location_text="Purok 2 beside the basketball court",
        latitude=13.9412,
        longitude=121.1625,
        photo_url="/api/v1/uploads/legacy-report.jpg",
        status=ReportStatus.SUBMITTED,
        is_demo_data=True,
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )
    db_session.add(legacy_report)
    db_session.commit()

    staff_csrf, staff_cookie = _login(client, "staff@sabtrack.test")
    resolved = client.patch(
        f"/api/v1/reports/{legacy_report.id}/status",
        json={"status": "RESOLVED"},
        headers={"x-csrf-token": staff_csrf},
        cookies={settings.SESSION_COOKIE_NAME: staff_cookie},
    )

    assert resolved.status_code == 200
    awards = db_session.scalars(
        select(PointsLedger).where(PointsLedger.resident_id == resident.id)
    ).all()
    assert awards == []


def test_evidence_report_award_requires_photo_coordinates_and_location(
    client: TestClient, db_session
):
    resident = db_session.scalar(
        select(User).where(User.email == "resident@sabtrack.test")
    )
    assert resident is not None
    invalid_evidence = [
        {
            "photo_url": None,
            "latitude": 13.9412,
            "longitude": 121.1625,
            "location_text": "Purok 2 beside the basketball court",
        },
        {
            "photo_url": "/api/v1/uploads/no-latitude.jpg",
            "latitude": None,
            "longitude": 121.1625,
            "location_text": "Purok 2 beside the basketball court",
        },
        {
            "photo_url": "/api/v1/uploads/no-longitude.jpg",
            "latitude": 13.9412,
            "longitude": None,
            "location_text": "Purok 2 beside the basketball court",
        },
        {
            "photo_url": "/api/v1/uploads/no-location.jpg",
            "latitude": 13.9412,
            "longitude": 121.1625,
            "location_text": "   ",
        },
    ]
    reports = [
        Report(
            resident_id=resident.id,
            category=ReportCategory.ILLEGAL_DUMPING,
            title=f"Evidence report {index}",
            description="Waste was reported at this location for verification.",
            status=ReportStatus.SUBMITTED,
            is_demo_data=True,
            civic_task_eligible=True,
            **fields,
        )
        for index, fields in enumerate(invalid_evidence)
    ]
    valid_report = Report(
        resident_id=resident.id,
        category=ReportCategory.ILLEGAL_DUMPING,
        title="Complete geotagged evidence report",
        description="Waste was reported with complete geotagged evidence.",
        location_text="Purok 2 beside the basketball court",
        latitude=13.9412,
        longitude=121.1625,
        photo_url="/api/v1/uploads/complete-evidence.jpg",
        status=ReportStatus.SUBMITTED,
        is_demo_data=True,
        civic_task_eligible=True,
    )
    reports.append(valid_report)
    db_session.add_all(reports)
    db_session.commit()

    staff_csrf, staff_cookie = _login(client, "staff@sabtrack.test")
    for report in reports:
        response = client.patch(
            f"/api/v1/reports/{report.id}/status",
            json={"status": "RESOLVED"},
            headers={"x-csrf-token": staff_csrf},
            cookies={settings.SESSION_COOKIE_NAME: staff_cookie},
        )
        assert response.status_code == 200
        evidence_awards = [
            award
            for award in db_session.scalars(
                select(PointsLedger).where(PointsLedger.resident_id == resident.id)
            ).all()
            if getattr(award, "task_key", None) == "reporting_violations_with_evidence"
        ]
        if report is not valid_report:
            assert evidence_awards == []
        else:
            assert [(award.points, getattr(award, "task_source_id", None)) for award in evidence_awards] == [
                (100, str(valid_report.id))
            ]


def test_no_violation_task_is_unavailable_without_citation_records(client: TestClient):
    _, resident_cookie = _login(client, "resident@sabtrack.test")

    response = client.get(
        "/api/v1/gamification/tasks",
        cookies={settings.SESSION_COOKIE_NAME: resident_cookie},
    )

    assert response.status_code == 200
    task = next(item for item in response.json() if item["id"] == "no_violation_record")
    assert task["status"] == "UNAVAILABLE"
    assert task["points_reward"] == 25
    assert task["progress_current"] == 0
    assert task["progress_target"] == 1
