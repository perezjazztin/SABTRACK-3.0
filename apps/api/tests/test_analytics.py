import pytest
from starlette.testclient import TestClient

from app.core.config import settings
from app.modules.areas.models import Area
from app.modules.reports.models import Report, ReportCategory, ReportStatus
from tests.conftest import TestingSessionLocal


def _login(client: TestClient, email: str, password: str = "TestSecretPassword123!"):
    """Helper to authenticate and retrieve session and CSRF tokens."""
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    data = res.json()
    csrf_token = data["csrf_token"]
    session_cookie = res.cookies.get(settings.SESSION_COOKIE_NAME)
    return csrf_token, session_cookie


def test_admin_can_access_analytics_overview(client: TestClient):
    """Verifies that an administrator with ANALYTICS_READ can access the analytics overview."""
    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    res = client.get(
        "/api/v1/analytics/overview",
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 200
    data = res.json()
    assert "total_reports" in data
    assert "open_reports" in data
    assert "resolved_reports" in data
    assert "resolution_rate_pct" in data
    assert "category_distribution" in data
    assert "status_distribution" in data
    assert "area_hotspots" in data
    assert "resolution_performance" in data
    assert "community_engagement" in data
    assert "decision_insights" in data
    assert data["procedure_step"] == "Step 6: Visual Indicators & Decision Support"


def test_staff_resident_and_maintainer_denied_analytics(client: TestClient):
    """Enforces least-privilege: STAFF, RESIDENT, and SYSTEM_MAINTAINER cannot read analytics."""
    for role_email in ["staff@sabtrack.test", "resident@sabtrack.test", "maintainer@sabtrack.test"]:
        csrf_token, session_cookie = _login(client, role_email)

        res = client.get(
            "/api/v1/analytics/overview",
            headers={"x-csrf-token": csrf_token},
            cookies={settings.SESSION_COOKIE_NAME: session_cookie},
        )
        assert res.status_code == 403
        data = res.json()
        assert "error" in data
        assert "message" in data["error"]
        assert "permission" in data["error"]["message"].lower()

    # Unauthenticated request
    client.cookies.clear()
    anon_res = client.get("/api/v1/analytics/overview")
    assert anon_res.status_code == 401


def test_analytics_metrics_calculation_and_hotspots(client: TestClient):
    """Validates 6-step analytics calculation: aggregations, hotspot severity grading, and insights."""
    # Seed operational data directly in test database
    db = TestingSessionLocal()
    area1 = Area(code="PRK-01", name="Purok 1 Centro", is_active=True, is_demo_data=False)
    area2 = Area(code="PRK-02", name="Purok 2 Riverside", is_active=True, is_demo_data=False)
    db.add_all([area1, area2])
    db.commit()
    db.refresh(area1)
    db.refresh(area2)
    area1_id = area1.id
    area2_id = area2.id

    # 3 reports in Area 1 (Uncollected garbage), 1 in Area 2 (Illegal dumping)
    r1 = Report(
        resident_id=1,
        area_id=area1_id,
        category=ReportCategory.UNCOLLECTED_GARBAGE,
        title="Overflowing bin",
        description="Garbage piling up",
        location_text="Corner Purok 1",
        status=ReportStatus.SUBMITTED,
    )
    r2 = Report(
        resident_id=1,
        area_id=area1_id,
        category=ReportCategory.UNCOLLECTED_GARBAGE,
        title="Uncollected bags",
        description="Trash left behind",
        location_text="Main Road Purok 1",
        status=ReportStatus.IN_PROGRESS,
    )
    r3 = Report(
        resident_id=1,
        area_id=area1_id,
        category=ReportCategory.UNCOLLECTED_GARBAGE,
        title="Old waste heap",
        description="Cleared yesterday",
        location_text="Purok 1 Alley",
        status=ReportStatus.RESOLVED,
    )
    r4 = Report(
        resident_id=1,
        area_id=area2_id,
        category=ReportCategory.ILLEGAL_DUMPING,
        title="Riverside debris",
        description="Dumping near river",
        location_text="Purok 2 Riverbank",
        status=ReportStatus.SUBMITTED,
    )
    db.add_all([r1, r2, r3, r4])
    db.commit()
    db.close()

    csrf_token, session_cookie = _login(client, "admin@sabtrack.test")

    res = client.get(
        "/api/v1/analytics/overview",
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 200
    data = res.json()
    assert data["total_reports"] == 4
    assert data["open_reports"] == 3  # 2 SUBMITTED + 1 IN_PROGRESS
    assert data["resolved_reports"] == 1
    assert data["resolution_rate_pct"] == 25.0

    # Area 1: 3 of 4 = 75% -> CRITICAL hotspot
    area1_hotspot = next((h for h in data["area_hotspots"] if h["area_id"] == area1_id), None)
    assert area1_hotspot is not None
    assert area1_hotspot["report_count"] == 3
    assert area1_hotspot["percentage"] == 75.0
    assert area1_hotspot["severity_level"] == "CRITICAL"

    # Category: UNCOLLECTED_GARBAGE is 75% -> Dominant category insight
    assert len(data["category_distribution"]) > 0
    top_cat = data["category_distribution"][0]
    assert top_cat["category"] == "UNCOLLECTED_GARBAGE"
    assert top_cat["percentage"] == 75.0

    # Decision support insights should reflect the hotspot and dominant category
    insights = data["decision_insights"]
    assert len(insights) >= 2
    assert any("Critical Waste Hotspot" in ins["title"] for ins in insights)
    assert any("Dominant Complaint Category" in ins["title"] for ins in insights)
