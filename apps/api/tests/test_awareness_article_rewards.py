from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select, text
from starlette.testclient import TestClient

from app.core.security import UserRole, hash_password
from app.modules.gamification.models import PointsLedger
from app.modules.identity.models import User


ARTICLE_READING_BASE = "/api/v1/gamification/article-reading"
ARTICLE_IDS = (
    "article-sdgs-sabtrack",
    "article-ra-9003",
    "article-home-composting",
)
TEST_PASSWORD = "TestSecretPassword123!"


def _login(client: TestClient, email: str):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    return response.json()["csrf_token"]


def _post(client: TestClient, path: str, payload: dict, auth):
    return client.post(
        path,
        json=payload,
        headers={"x-csrf-token": auth},
    )


def _open(client: TestClient, auth, article_id: str):
    return _post(
        client,
        f"{ARTICLE_READING_BASE}/open",
        {"article_id": article_id},
        auth,
    )


def _complete(client: TestClient, auth, session_id: str):
    return _post(
        client,
        f"{ARTICLE_READING_BASE}/complete",
        {"session_id": session_id},
        auth,
    )


def _age_session(db_session, resident_id: int, article_id: str):
    db_session.execute(
        text(
            "UPDATE article_reading_sessions "
            "SET opened_at = :opened_at "
            "WHERE resident_id = :resident_id AND article_id = :article_id"
        ),
        {
            "opened_at": datetime.now(timezone.utc) - timedelta(seconds=21),
            "resident_id": resident_id,
            "article_id": article_id,
        },
    )
    db_session.commit()


def _resident_id(db_session):
    return db_session.scalar(
        select(User.id).where(User.email == "resident@sabtrack.test")
    )


def _award_ledger_entries(db_session, resident_id: int):
    entries = db_session.scalars(
        select(PointsLedger).where(PointsLedger.resident_id == resident_id)
    ).all()
    return [
        entry
        for entry in entries
        if entry.transaction_type.value == "ARTICLE_READ_AWARD"
    ]


def test_resident_can_open_eligible_article_and_read_status_reports_progress(client):
    auth = _login(client, "resident@sabtrack.test")

    status_response = client.get(
        f"{ARTICLE_READING_BASE}/status",
    )
    assert status_response.status_code == 200
    assert status_response.json() == {
        "completed_article_ids": [],
        "awards_today": 0,
        "daily_limit": 3,
        "points_per_article": 5,
        "minimum_read_seconds": 20,
    }

    response = _open(client, auth, ARTICLE_IDS[0])

    assert response.status_code == 200
    data = response.json()
    assert data["article_id"] == ARTICLE_IDS[0]
    assert UUID(data["session_id"])
    assert data["opened_at"] is not None
    assert data["already_read"] is False


def test_reading_routes_require_resident_role_and_csrf(client):
    resident_auth = _login(client, "resident@sabtrack.test")
    missing_csrf = client.post(
        f"{ARTICLE_READING_BASE}/open",
        json={"article_id": ARTICLE_IDS[0]},
    )
    assert missing_csrf.status_code == 403

    staff_auth = _login(client, "staff@sabtrack.test")
    staff_status = client.get(
        f"{ARTICLE_READING_BASE}/status",
    )
    staff_open = _open(client, staff_auth, ARTICLE_IDS[0])
    staff_complete = _complete(client, staff_auth, "00000000-0000-0000-0000-000000000001")
    assert staff_status.status_code == 403
    assert staff_open.status_code == 403
    assert staff_complete.status_code == 403


def test_completion_rejects_unknown_article_and_wrong_owner_session(client, db_session):
    resident_auth = _login(client, "resident@sabtrack.test")
    unknown_article = _open(client, resident_auth, "article-not-eligible")
    assert unknown_article.status_code == 400

    session_response = _open(client, resident_auth, ARTICLE_IDS[0])
    assert session_response.status_code == 200

    other_resident = User(
        email="other.resident@sabtrack.test",
        hashed_password=hash_password(TEST_PASSWORD),
        full_name="Other Test Resident",
        role=UserRole.RESIDENT,
        is_active=True,
    )
    db_session.add(other_resident)
    db_session.commit()

    other_auth = _login(client, "other.resident@sabtrack.test")
    response = _complete(client, other_auth, session_response.json()["session_id"])
    assert response.status_code == 400


def test_completion_rejects_before_server_minimum_time(client, db_session):
    auth = _login(client, "resident@sabtrack.test")
    opened = _open(client, auth, ARTICLE_IDS[0])
    assert opened.status_code == 200
    resident_id = _resident_id(db_session)
    db_session.execute(
        text(
            "UPDATE article_reading_sessions SET opened_at = :opened_at "
            "WHERE resident_id = :resident_id AND article_id = :article_id"
        ),
        {
            "opened_at": datetime.now(timezone.utc) - timedelta(seconds=19),
            "resident_id": resident_id,
            "article_id": ARTICLE_IDS[0],
        },
    )
    db_session.commit()

    response = _complete(client, auth, opened.json()["session_id"])

    assert response.status_code == 400
    assert _award_ledger_entries(db_session, resident_id) == []


def test_completion_awards_five_points_and_records_ledger_entry(client, db_session):
    auth = _login(client, "resident@sabtrack.test")
    opened = _open(client, auth, ARTICLE_IDS[0])
    assert opened.status_code == 200
    resident_id = _resident_id(db_session)
    _age_session(db_session, resident_id, ARTICLE_IDS[0])

    response = _complete(client, auth, opened.json()["session_id"])

    assert response.status_code == 200
    assert response.json() == {
        "article_id": ARTICLE_IDS[0],
        "status": "AWARDED",
        "points_awarded": 5,
        "awards_today": 1,
    }
    ledger_entries = _award_ledger_entries(db_session, resident_id)
    assert len(ledger_entries) == 1
    assert ledger_entries[0].points == 5
    assert sum(entry.points for entry in ledger_entries) == 5
    award = db_session.execute(
        text(
            "SELECT ledger_entry_id FROM article_read_awards "
            "WHERE resident_id = :resident_id AND article_id = :article_id"
        ),
        {"resident_id": resident_id, "article_id": ARTICLE_IDS[0]},
    ).one()
    assert award.ledger_entry_id == ledger_entries[0].id


def test_each_eligible_article_can_earn_five_points(client, db_session):
    auth = _login(client, "resident@sabtrack.test")
    resident_id = _resident_id(db_session)

    for expected_awards_today, article_id in enumerate(ARTICLE_IDS, start=1):
        opened = _open(client, auth, article_id)
        assert opened.status_code == 200
        _age_session(db_session, resident_id, article_id)

        response = _complete(client, auth, opened.json()["session_id"])

        assert response.status_code == 200
        assert response.json() == {
            "article_id": article_id,
            "status": "AWARDED",
            "points_awarded": 5,
            "awards_today": expected_awards_today,
        }

    ledger_entries = _award_ledger_entries(db_session, resident_id)
    assert len(ledger_entries) == len(ARTICLE_IDS)
    assert sum(entry.points for entry in ledger_entries) == 5 * len(ARTICLE_IDS)


def test_repeat_completion_never_awards_twice(client, db_session):
    auth = _login(client, "resident@sabtrack.test")
    opened = _open(client, auth, ARTICLE_IDS[0])
    assert opened.status_code == 200
    resident_id = _resident_id(db_session)
    _age_session(db_session, resident_id, ARTICLE_IDS[0])
    session_id = opened.json()["session_id"]

    first = _complete(client, auth, session_id)
    second = _complete(client, auth, session_id)
    reopened = _open(client, auth, ARTICLE_IDS[0])

    assert first.status_code == 200
    assert first.json()["status"] == "AWARDED"
    assert second.status_code == 200
    assert second.json()["status"] == "ALREADY_READ"
    assert second.json()["points_awarded"] == 0
    assert reopened.json() == {
        "article_id": ARTICLE_IDS[0],
        "session_id": None,
        "opened_at": None,
        "already_read": True,
    }
    assert len(_award_ledger_entries(db_session, resident_id)) == 1
    assert db_session.execute(
        text(
            "SELECT COUNT(*) FROM article_read_awards "
            "WHERE resident_id = :resident_id AND article_id = :article_id"
        ),
        {"resident_id": resident_id, "article_id": ARTICLE_IDS[0]},
    ).scalar_one() == 1


def test_daily_limit_consumes_session_and_allows_later_day_reread(
    client, db_session, monkeypatch
):
    from app.modules.gamification import service as gamification_service

    class FrozenDateTime(datetime):
        current = datetime(2026, 11, 1, 10, 0, tzinfo=timezone.utc)

        @classmethod
        def now(cls, tz=None):
            return cls.current.astimezone(tz) if tz else cls.current.replace(tzinfo=None)

    monkeypatch.setattr(gamification_service, "datetime", FrozenDateTime)
    monkeypatch.setattr(
        gamification_service,
        "ELIGIBLE_ARTICLE_IDS",
        (*ARTICLE_IDS, "article-test-four"),
        raising=False,
    )
    auth = _login(client, "resident@sabtrack.test")

    for article_id in ARTICLE_IDS:
        opened = _open(client, auth, article_id)
        assert opened.status_code == 200
        FrozenDateTime.current += timedelta(seconds=21)
        completed = _complete(client, auth, opened.json()["session_id"])
        assert completed.status_code == 200
        assert completed.json()["status"] == "AWARDED"

    limited_session = _open(client, auth, "article-test-four").json()["session_id"]
    FrozenDateTime.current += timedelta(seconds=21)
    limited = _complete(client, auth, limited_session)
    assert limited.status_code == 200
    assert limited.json()["status"] == "DAILY_LIMIT_REACHED"
    assert limited.json()["points_awarded"] == 0
    assert limited.json()["awards_today"] == 3
    assert _complete(client, auth, limited_session).status_code == 400

    FrozenDateTime.current += timedelta(days=1)
    later_session = _open(client, auth, "article-test-four").json()["session_id"]
    FrozenDateTime.current += timedelta(seconds=21)
    later = _complete(client, auth, later_session)

    assert later.status_code == 200
    assert later.json()["status"] == "AWARDED"
    assert later.json()["awards_today"] == 1
    assert len(_award_ledger_entries(db_session, 1)) == 4


def test_daily_limit_uses_asia_manila_midnight(client, monkeypatch):
    from app.modules.gamification import service as gamification_service

    class FrozenDateTime(datetime):
        current = datetime(2026, 11, 1, 15, 58, tzinfo=timezone.utc)

        @classmethod
        def now(cls, tz=None):
            return cls.current.astimezone(tz) if tz else cls.current.replace(tzinfo=None)

    monkeypatch.setattr(gamification_service, "datetime", FrozenDateTime)
    auth = _login(client, "resident@sabtrack.test")

    for article_id in ARTICLE_IDS:
        opened = _open(client, auth, article_id)
        assert opened.status_code == 200
        FrozenDateTime.current += timedelta(seconds=21)
        completed = _complete(client, auth, opened.json()["session_id"])
        assert completed.status_code == 200
        assert completed.json()["awards_today"] in (1, 2, 3)

    FrozenDateTime.current = datetime(2026, 11, 1, 16, 0, 1, tzinfo=timezone.utc)
    status_response = client.get(
        f"{ARTICLE_READING_BASE}/status",
    )

    assert status_response.status_code == 200
    assert status_response.json()["awards_today"] == 0


def test_reopening_article_replaces_prior_session(client, db_session, monkeypatch):
    from app.modules.gamification import service as gamification_service

    class FrozenDateTime(datetime):
        current = datetime(2026, 11, 1, 10, 0, tzinfo=timezone.utc)

        @classmethod
        def now(cls, tz=None):
            return cls.current.astimezone(tz) if tz else cls.current.replace(tzinfo=None)

    monkeypatch.setattr(gamification_service, "datetime", FrozenDateTime)
    auth = _login(client, "resident@sabtrack.test")

    first = _open(client, auth, ARTICLE_IDS[0])
    assert first.status_code == 200
    resident_id = _resident_id(db_session)
    db_session.execute(
        text(
            "UPDATE article_reading_sessions SET consumed = :consumed "
            "WHERE resident_id = :resident_id AND article_id = :article_id"
        ),
        {
            "consumed": True,
            "resident_id": resident_id,
            "article_id": ARTICLE_IDS[0],
        },
    )
    db_session.commit()
    FrozenDateTime.current += timedelta(seconds=30)
    second = _open(client, auth, ARTICLE_IDS[0])

    assert first.status_code == second.status_code == 200
    assert first.json()["session_id"] != second.json()["session_id"]
    assert first.json()["opened_at"] != second.json()["opened_at"]
    assert db_session.execute(
        text(
            "SELECT COUNT(*) FROM article_reading_sessions "
            "WHERE resident_id = :resident_id AND article_id = :article_id"
        ),
        {"resident_id": resident_id, "article_id": ARTICLE_IDS[0]},
    ).scalar_one() == 1
    assert not db_session.execute(
        text(
            "SELECT consumed FROM article_reading_sessions "
            "WHERE resident_id = :resident_id AND article_id = :article_id"
        ),
        {"resident_id": resident_id, "article_id": ARTICLE_IDS[0]},
    ).scalar_one()
