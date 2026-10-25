from datetime import datetime, timezone
from starlette.testclient import TestClient
from sqlalchemy import select
from app.core.config import settings
from app.modules.identity.models import LoginThrottling


def test_persistent_rate_limit_locks_after_threshold(client: TestClient, db_session):
    """Verifies that 5 failed attempts trigger HTTP 429 and records in login_throttling table."""
    email = "test_target@sabtrack.test"
    bad_password = "WrongPassword999!"

    # 1 to 4 failed attempts -> 401
    for _ in range(4):
        res = client.post("/api/v1/auth/login", json={"email": email, "password": bad_password})
        assert res.status_code == 401

    # Check DB record exists and count is 4
    stmt = select(LoginThrottling).where(LoginThrottling.email == email)
    throttle_rec = db_session.scalar(stmt)
    assert throttle_rec is not None
    assert throttle_rec.attempt_count == 4
    assert throttle_rec.locked_until is None

    # 5th failed attempt -> 401, sets locked_until
    res_fifth = client.post("/api/v1/auth/login", json={"email": email, "password": bad_password})
    assert res_fifth.status_code == 401

    db_session.refresh(throttle_rec)
    assert throttle_rec.attempt_count == 5
    assert throttle_rec.locked_until is not None

    # 6th attempt is throttled with 429
    res_throttled = client.post("/api/v1/auth/login", json={"email": email, "password": bad_password})
    assert res_throttled.status_code == 429
    assert "Too many failed login attempts" in res_throttled.text


def test_successful_login_resets_throttling(client: TestClient, db_session):
    """Verifies that authenticating with correct credentials clears throttling records."""
    email = "resident@sabtrack.test"
    bad_password = "WrongPassword999!"
    correct_password = "TestSecretPassword123!"

    # Fail twice
    for _ in range(2):
        client.post("/api/v1/auth/login", json={"email": email, "password": bad_password})

    # Record exists with 2 attempts
    stmt = select(LoginThrottling).where(LoginThrottling.email == email)
    rec = db_session.scalar(stmt)
    assert rec is not None
    assert rec.attempt_count == 2

    # Success
    res = client.post("/api/v1/auth/login", json={"email": email, "password": correct_password})
    assert res.status_code == 200

    # Record should be cleaned/reset
    rec_after = db_session.scalar(stmt)
    assert rec_after is None
