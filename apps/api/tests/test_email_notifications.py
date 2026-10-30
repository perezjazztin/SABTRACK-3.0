import os
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest

from app.core.config import settings
from app.modules.notifications.service import email_service
from app.modules.identity.models import UserRole
from app.modules.areas.models import Area
from app.modules.reports.models import ReportCategory, ReportStatus
from tests.conftest import TEST_PASSWORD, TestingSessionLocal


@pytest.fixture
def test_area() -> Area:
    db = TestingSessionLocal()
    area = Area(code="ZONE-TEST", name="Purok 1 Test Area", is_active=True, is_demo_data=True)
    db.add(area)
    db.commit()
    db.refresh(area)
    return area


def test_dev_simulator_creates_offline_preview_file(tmp_path, monkeypatch):
    """Verifies that in dev/offline mode, email_service creates an HTML preview file without network calls."""
    monkeypatch.setattr(settings, "SMTP_ENABLED", False)
    monkeypatch.setattr(settings, "STORAGE_EMAIL_DIR", tmp_path)

    recipient = "offline.resident@sabtrack.test"
    subject = "Barangay Sabang Advisory"
    html_content = "<h2>Clean Up Drive Notice</h2><p>Please segregate your waste.</p>"

    success = email_service.send_email(
        to_email=recipient,
        subject=subject,
        html_body=html_content,
    )

    assert success is True
    # Verify file was written in the storage directory
    created_files = list(tmp_path.glob("*.html"))
    assert len(created_files) == 1
    content = created_files[0].read_text(encoding="utf-8")
    assert recipient in content
    assert subject in content
    assert "Clean Up Drive Notice" in content


def test_render_base_email_template():
    """Verifies official template elements: Barangay Sabang, RA 10173, BatStateU NEU."""
    rendered = email_service.render_base_email(
        title="Test Notice",
        preheader="Preheader preview",
        body_html="<p>Test Body</p>",
    )

    assert "SABTRACK 3.0" in rendered
    assert "Barangay Sabang Solid Waste Governance" in rendered
    assert "RA 10173" in rendered
    assert "Batangas State University" in rendered
    assert "<p>Test Body</p>" in rendered


def test_live_smtp_dispatch_with_mock(monkeypatch):
    """Verifies SMTP dispatch correctly configures and logs in via TLS when enabled."""
    monkeypatch.setattr(settings, "SMTP_ENABLED", True)
    monkeypatch.setattr(settings, "SMTP_USER", "test.sabtrack@gmail.com")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "mock-app-password-16")
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.gmail.com")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    monkeypatch.setattr(settings, "SMTP_USE_TLS", True)

    with patch("smtplib.SMTP") as mock_smtp_class:
        mock_server = MagicMock()
        mock_smtp_class.return_value.__enter__.return_value = mock_server

        success = email_service.send_schedule_reminder(
            to_email="resident@sabtrack.test",
            resident_name="Juan dela Cruz",
            day_of_week="Monday",
            waste_type="Biodegradable",
            collection_time="08:00 AM - 10:00 AM",
            area_name="Purok 1",
        )

        assert success is True
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("test.sabtrack@gmail.com", "mock-app-password-16")
        mock_server.send_message.assert_called_once()


def test_schedule_notification_endpoint_triggers_email(client, test_area, tmp_path, monkeypatch):
    """Verifies POST /api/v1/schedules/{id}/notify triggers background email creation."""
    monkeypatch.setattr(settings, "SMTP_ENABLED", False)
    monkeypatch.setattr(settings, "STORAGE_EMAIL_DIR", tmp_path)

    # 1. Admin logs in and creates a schedule
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sabtrack.test", "password": TEST_PASSWORD},
    )
    assert login_res.status_code == 200

    csrf = client.cookies.get(settings.CSRF_COOKIE_NAME)
    res_sched = client.post(
        "/api/v1/schedules",
        json={
            "area_id": test_area.id,
            "day_of_week": "MONDAY",
            "waste_type": "BIODEGRADABLE",
            "start_time": "08:00 AM",
            "end_time": "10:00 AM",
            "notes": "Curbside collection",
        },
        headers={"X-CSRF-Token": csrf},
    )
    assert res_sched.status_code == 201
    sched_id = res_sched.json()["id"]

    # 2. Resident subscribes to notification
    target_email = "subscriber.resident@sabtrack.test"
    res_notif = client.post(
        f"/api/v1/schedules/{sched_id}/notify",
        json={"email": target_email},
    )
    assert res_notif.status_code == 200
    assert res_notif.json()["recipient_email"] == target_email

    # 3. Verify preview email was created in storage
    files = list(tmp_path.glob("*.html"))
    assert len(files) >= 1
    file_content = files[-1].read_text(encoding="utf-8")
    assert target_email in file_content
    assert "MONDAY" in file_content
    assert "BIODEGRADABLE" in file_content


def test_report_status_update_triggers_email(client, tmp_path, monkeypatch):
    """Verifies staff PATCH /api/v1/reports/{id}/status notifies reporting resident via email."""
    monkeypatch.setattr(settings, "SMTP_ENABLED", False)
    monkeypatch.setattr(settings, "STORAGE_EMAIL_DIR", tmp_path)

    # 1. Resident logs in and submits report
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "resident@sabtrack.test", "password": TEST_PASSWORD},
    )
    assert login_res.status_code == 200

    csrf_res = client.cookies.get(settings.CSRF_COOKIE_NAME)
    res_rep = client.post(
        "/api/v1/reports",
        json={
            "category": ReportCategory.UNCOLLECTED_GARBAGE.value,
            "title": "Uncollected trash along Main St",
            "description": "Bags piled near streetlamp",
            "location_text": "Purok 2 entrance",
            "photo_url": "/api/v1/uploads/photo123.jpg",
        },
        headers={"X-CSRF-Token": csrf_res},
    )
    assert res_rep.status_code == 201
    rep_id = res_rep.json()["id"]

    # 2. Staff logs in and changes status to IN_PROGRESS
    login_staff = client.post(
        "/api/v1/auth/login",
        json={"email": "staff@sabtrack.test", "password": TEST_PASSWORD},
    )
    assert login_staff.status_code == 200

    csrf_staff = client.cookies.get(settings.CSRF_COOKIE_NAME)
    res_update = client.patch(
        f"/api/v1/reports/{rep_id}/status",
        json={
            "status": ReportStatus.IN_PROGRESS.value,
            "remarks": "Sanitation truck dispatched to Purok 2 entrance.",
        },
        headers={"X-CSRF-Token": csrf_staff},
    )
    assert res_update.status_code == 200

    # 3. Verify preview email was generated for resident
    files = list(tmp_path.glob("*.html"))
    assert len(files) >= 1
    file_content = files[-1].read_text(encoding="utf-8")
    assert "resident@sabtrack.test" in file_content
    assert "IN_PROGRESS" in file_content
    assert "Sanitation truck dispatched" in file_content


def test_resident_registration_triggers_welcome_email(client, tmp_path, monkeypatch):
    """Verifies self-registration sends welcome email to newly created resident."""
    monkeypatch.setattr(settings, "SMTP_ENABLED", False)
    monkeypatch.setattr(settings, "STORAGE_EMAIL_DIR", tmp_path)

    new_email = f"newcitizen.{os.urandom(3).hex()}@sabtrack.test"
    res_reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": new_email,
            "password": "StrongPassword2026!",
            "full_name": "Maria Santos",
            "resident_id_num": "SAB-2026-9999",
        },
    )
    assert res_reg.status_code == 201

    files = list(tmp_path.glob("*.html"))
    assert len(files) >= 1
    file_content = files[-1].read_text(encoding="utf-8")
    assert new_email in file_content
    assert "Welcome to SABTRACK 3.0" in file_content
    assert "Maria Santos" in file_content


def test_admin_diagnostic_test_email_endpoint(client, tmp_path, monkeypatch):
    """Verifies POST /api/v1/notifications/test-email works for staff/admin."""
    monkeypatch.setattr(settings, "SMTP_ENABLED", False)
    monkeypatch.setattr(settings, "STORAGE_EMAIL_DIR", tmp_path)

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "staff@sabtrack.test", "password": TEST_PASSWORD},
    )
    assert login_res.status_code == 200

    res_test = client.post(
        "/api/v1/notifications/test-email",
        json={"recipient_email": "test.diagnostic@sabtrack.test"},
    )
    assert res_test.status_code == 200
    data = res_test.json()
    assert data["success"] is True
    assert data["mode"] == "dev_simulator"
    assert data["recipient"] == "test.diagnostic@sabtrack.test"

    files = list(tmp_path.glob("*.html"))
    assert len(files) >= 1
    assert "test.diagnostic@sabtrack.test" in files[-1].read_text(encoding="utf-8")
