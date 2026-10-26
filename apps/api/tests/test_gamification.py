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


def test_staff_can_create_initiative(client: TestClient):
    csrf_token, session_cookie = _login(client, "staff@sabtrack.test")

    payload = {
        "title": "Community Park Tree Planting and Clean-up",
        "description": "Plant native seedlings and clean litter around the public plaza.",
        "points_reward": 50,
        "event_date": "November 2, 2026",
        "location": "Barangay Sabang Plaza",
    }

    res = client.post(
        "/api/v1/gamification/initiatives",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 201
    data = res.json()
    assert data["title"] == payload["title"]
    assert data["points_reward"] == 50


def test_resident_can_submit_participation_claim(client: TestClient):
    csrf_token, session_cookie = _login(client, "resident@sabtrack.test")

    payload = {
        "activity_title": "Household Segregated Plastics Drop-off",
        "description": "Turned over 5kg clean PET bottles to MRF station.",
        "evidence_url": "https://example.com/proof.jpg",
        "points_requested": 30,
    }

    res = client.post(
        "/api/v1/gamification/claims",
        json=payload,
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )

    assert res.status_code == 201
    data = res.json()
    assert data["activity_title"] == payload["activity_title"]
    assert data["status"] == "PENDING"
    assert data["points_requested"] == 30


def test_staff_can_approve_claim_and_award_points(client: TestClient):
    # Resident submits claim
    res_csrf, res_cookie = _login(client, "resident@sabtrack.test")
    claim_res = client.post(
        "/api/v1/gamification/claims",
        json={
            "activity_title": "Clean Riverbank Volunteer",
            "description": "Picked up plastic debris along creek bank.",
            "points_requested": 40,
        },
        headers={"x-csrf-token": res_csrf},
        cookies={settings.SESSION_COOKIE_NAME: res_cookie},
    )
    claim_id = claim_res.json()["id"]

    # Staff reviews and approves
    staff_csrf, staff_cookie = _login(client, "staff@sabtrack.test")
    review_res = client.patch(
        f"/api/v1/gamification/claims/{claim_id}/review",
        json={
            "status": "APPROVED",
            "review_notes": "Verified attendance with barangay coordinator.",
            "points_awarded": 40,
        },
        headers={"x-csrf-token": staff_csrf},
        cookies={settings.SESSION_COOKIE_NAME: staff_cookie},
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "APPROVED"

    # Resident checks points summary
    summary_res = client.get(
        "/api/v1/gamification/my-points",
        cookies={settings.SESSION_COOKIE_NAME: res_cookie},
    )
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_points"] >= 40
    assert len(summary["ledger_history"]) >= 1
    assert summary["verified_activities_count"] >= 1


def test_staff_can_reject_claim_without_points(client: TestClient):
    # Resident submits claim
    res_csrf, res_cookie = _login(client, "resident@sabtrack.test")
    claim_res = client.post(
        "/api/v1/gamification/claims",
        json={
            "activity_title": "Dubious Clean-up Claim",
            "description": "No actual work done, testing rejection.",
            "points_requested": 50,
        },
        headers={"x-csrf-token": res_csrf},
        cookies={settings.SESSION_COOKIE_NAME: res_cookie},
    )
    claim_id = claim_res.json()["id"]

    # Staff rejects
    staff_csrf, staff_cookie = _login(client, "staff@sabtrack.test")
    review_res = client.patch(
        f"/api/v1/gamification/claims/{claim_id}/review",
        json={
            "status": "REJECTED",
            "review_notes": "Unable to verify activity evidence.",
        },
        headers={"x-csrf-token": staff_csrf},
        cookies={settings.SESSION_COOKIE_NAME: staff_cookie},
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "REJECTED"


def test_resident_cannot_review_claims(client: TestClient):
    res_csrf, res_cookie = _login(client, "resident@sabtrack.test")
    res = client.patch(
        "/api/v1/gamification/claims/1/review",
        json={"status": "APPROVED"},
        headers={"x-csrf-token": res_csrf},
        cookies={settings.SESSION_COOKIE_NAME: res_cookie},
    )
    # Lacks participation:review permission
    assert res.status_code == 403
