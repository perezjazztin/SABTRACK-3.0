from starlette.testclient import TestClient
from app.modules.gamification.service import AWARENESS_RESOURCES

HEARTBEAT_URL = "/api/v1/gamification/awareness/heartbeat"
STATUS_URL = "/api/v1/gamification/awareness/status"
TEST_PASSWORD = "TestSecretPassword123!"


def _login(client: TestClient, email: str = "resident@sabtrack.test"):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    return response.json()["csrf_token"]


def test_heartbeat_awards_point_and_updates_ledger(client):
    auth = _login(client)
    res_id = "video-segregation-3rs"

    response = client.post(
        HEARTBEAT_URL,
        json={"resource_id": res_id},
        headers={"x-csrf-token": auth},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "AWARDED"
    assert data["points_awarded"] == 1
    assert data["points_earned"] >= 1
    assert data["max_points"] == 5
    assert data["total_points"] is not None


def test_awareness_status_reports_resource_points(client):
    auth = _login(client)

    status_response = client.get(STATUS_URL)
    assert status_response.status_code == 200
    data = status_response.json()
    assert "resource_points" in data
    assert data["max_points_per_resource"] == 5
    assert data["interval_seconds"] == 45


def test_heartbeat_rejects_unknown_resource(client):
    auth = _login(client)

    response = client.post(
        HEARTBEAT_URL,
        json={"resource_id": "non-existent-resource-id"},
        headers={"x-csrf-token": auth},
    )
    assert response.status_code == 400


def test_heartbeat_requires_resident_role(client):
    staff_auth = _login(client, "staff@sabtrack.test")

    response = client.post(
        HEARTBEAT_URL,
        json={"resource_id": "video-segregation-3rs"},
        headers={"x-csrf-token": staff_auth},
    )
    assert response.status_code == 403


def test_heartbeat_caps_at_5_points(client):
    auth = _login(client)
    res_id = "article-diy-waste-reduction"

    # Send heartbeats until capped at 5 points
    last_response = None
    for _ in range(6):
        resp = client.post(
            HEARTBEAT_URL,
            json={"resource_id": res_id},
            headers={"x-csrf-token": auth},
        )
        assert resp.status_code == 200
        last_response = resp.json()

    assert last_response["status"] == "RESOURCE_CAP_REACHED"
    assert last_response["points_awarded"] == 0
    assert last_response["points_earned"] == 5
    assert last_response["max_points"] == 5
