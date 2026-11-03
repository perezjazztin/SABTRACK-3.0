import pytest
from sqlalchemy import select
from starlette.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.areas.models import Area
from app.modules.gamification.models import (
    ClaimStatus,
    ParticipationClaim,
    PointsLedger,
    RedemptionRequest,
    RewardItem,
    TransactionType,
)
from app.modules.identity.models import User


def _login(client: TestClient, email: str, password: str = "TestSecretPassword123!"):
    """Helper to authenticate and retrieve session and CSRF tokens."""
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    data = res.json()
    csrf_token = data["csrf_token"]
    session_cookie = res.cookies.get(settings.SESSION_COOKIE_NAME)
    return csrf_token, session_cookie


def _find_reward(client: TestClient, name: str = "5kg Rice") -> dict:
    response = client.get("/api/v1/gamification/rewards")
    assert response.status_code == 200
    return next(item for item in response.json() if item["name"] == name)


def _seed_points(db_session: Session, email: str, points: int = 1500) -> int:
    resident = db_session.scalar(select(User).where(User.email == email))
    assert resident is not None
    db_session.add(
        PointsLedger(
            resident_id=resident.id,
            points=points,
            transaction_type=TransactionType.CIVIC_BONUS,
            description="Synthetic test points",
        )
    )
    db_session.commit()
    return resident.id


def _request_redemption(
    client: TestClient, auth: tuple[str, str], reward_id: int
):
    csrf_token, session_cookie = auth
    return client.post(
        "/api/v1/gamification/redeem",
        json={"reward_id": reward_id},
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )


def _review_redemption(
    client: TestClient,
    redemption_id: int,
    status: str,
    auth: tuple[str, str] | None = None,
    review_notes: str | None = None,
):
    staff_auth = auth or _login(client, "staff@sabtrack.test")
    csrf_token, session_cookie = staff_auth
    return client.patch(
        f"/api/v1/gamification/redemptions/{redemption_id}/review",
        json={"status": status, "review_notes": review_notes},
        headers={"x-csrf-token": csrf_token},
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )


def test_rewards_catalog_lists_default_items(client: TestClient):
    res = client.get("/api/v1/gamification/rewards")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 4
    names = [i["name"] for i in items]
    assert "₱100 Mobile Load" in names
    assert "5kg Rice" in names
    assert "10kg Rice" in names
    assert "₱500 Worth of Groceries" in names


def test_civic_tasks_endpoint_returns_expected_missions(client: TestClient):
    csrf_token, session_cookie = _login(client, "resident@sabtrack.test")
    res = client.get(
        "/api/v1/gamification/tasks",
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res.status_code == 200
    tasks = res.json()
    task_ids = [t["id"] for t in tasks]
    assert "first_report" in task_ids
    assert "proper_segregation" in task_ids
    assert "no_violation_record" in task_ids
    assert "waste_warrior" in task_ids
    assert "reporting_violations_with_evidence" in task_ids


def test_leaderboard_endpoint_ranks_residents_and_masks_pii(client: TestClient):
    csrf_token, session_cookie = _login(client, "resident@sabtrack.test")
    res = client.get(
        "/api/v1/gamification/leaderboard",
        cookies={settings.SESSION_COOKIE_NAME: session_cookie},
    )
    assert res.status_code == 200
    board = res.json()
    assert len(board) >= 1
    # The current resident must be flagged
    current = next((b for b in board if b["is_current_user"]), None)
    assert current is not None
    assert "(You)" in current["display_name"]
    # Ensure emails are NOT exposed on the leaderboard (RA 10173 privacy)
    for entry in board:
        assert "@" not in entry["display_name"]
        assert "rank" in entry
        assert "purok_name" in entry
        assert "total_points" in entry


def test_redemption_rejects_insufficient_balance_without_writes(
    client: TestClient, db_session: Session
):
    auth = _login(client, "resident@sabtrack.test")
    rice_reward = _find_reward(client)
    original_stock = rice_reward["stock_quantity"]

    res = _request_redemption(client, auth, rice_reward["id"])
    assert res.status_code == 400
    assert "Insufficient SAB-Points balance" in res.json()["error"]["message"]
    assert db_session.scalar(select(RedemptionRequest.id)) is None
    assert db_session.scalar(select(PointsLedger.id)) is None
    assert db_session.get(RewardItem, rice_reward["id"]).stock_quantity == original_stock


def test_redemption_deducts_ledger_and_returns_eight_character_code(
    client: TestClient, db_session: Session
):
    auth = _login(client, "resident@sabtrack.test")
    resident_id = _seed_points(db_session, "resident@sabtrack.test")
    rice_reward = _find_reward(client)
    original_stock = rice_reward["stock_quantity"]

    points_res = client.get(
        "/api/v1/gamification/my-points",
        cookies={settings.SESSION_COOKIE_NAME: auth[1]},
    )
    initial_balance = points_res.json()["total_points"]
    assert initial_balance >= 1500

    res = _request_redemption(client, auth, rice_reward["id"])
    assert res.status_code == 201
    redemption = res.json()
    assert redemption["points_spent"] == 1000
    assert len(redemption["claim_code"]) == 8
    assert redemption["claim_code"].isascii()
    assert redemption["claim_code"].isalnum()
    assert redemption["claim_code"] == redemption["claim_code"].upper()
    assert redemption["status"] == "PENDING"

    points_after = client.get(
        "/api/v1/gamification/my-points",
        cookies={settings.SESSION_COOKIE_NAME: auth[1]},
    )
    assert points_after.json()["total_points"] == initial_balance - 1000
    deduction = db_session.scalar(
        select(PointsLedger).where(
            PointsLedger.resident_id == resident_id,
            PointsLedger.transaction_type == "REWARD_REDEMPTION",
        )
    )
    assert deduction is not None
    assert deduction.points == -1000
    assert db_session.get(RewardItem, rice_reward["id"]).stock_quantity == original_stock - 1

    redemptions_res = client.get(
        "/api/v1/gamification/my-redemptions",
        cookies={settings.SESSION_COOKIE_NAME: auth[1]},
    )
    assert redemptions_res.status_code == 200
    my_vouchers = redemptions_res.json()
    assert len(my_vouchers) >= 1
    assert any(v["claim_code"] == redemption["claim_code"] for v in my_vouchers)


def test_redemption_rejects_zero_stock_without_writes(
    client: TestClient, db_session: Session
):
    auth = _login(client, "resident@sabtrack.test")
    resident_id = _seed_points(db_session, "resident@sabtrack.test")
    reward = _find_reward(client)
    reward_row = db_session.get(RewardItem, reward["id"])
    reward_row.stock_quantity = 0
    db_session.commit()

    response = _request_redemption(client, auth, reward["id"])

    assert response.status_code == 400
    assert "not available" in response.json()["error"]["message"].lower()
    assert db_session.scalar(select(RedemptionRequest.id)) is None
    assert db_session.scalar(
        select(PointsLedger.id).where(PointsLedger.resident_id == resident_id)
    ) is not None
    assert len(
        db_session.scalars(
            select(PointsLedger).where(PointsLedger.resident_id == resident_id)
        ).all()
    ) == 1
    assert reward_row.stock_quantity == 0


def test_staff_can_approve_then_fulfill_redemption(
    client: TestClient, db_session: Session
):
    _seed_points(db_session, "resident@sabtrack.test")
    resident_auth = _login(client, "resident@sabtrack.test")
    reward = _find_reward(client)
    created = _request_redemption(client, resident_auth, reward["id"])
    assert created.status_code == 201
    redemption_id = created.json()["id"]
    staff_auth = _login(client, "staff@sabtrack.test")

    approval = _review_redemption(
        client,
        redemption_id,
        "APPROVED",
        auth=staff_auth,
        review_notes="Approved as an academic demonstration.",
    )
    assert approval.status_code == 200
    assert approval.json()["status"] == "APPROVED"
    assert approval.json()["review_notes"] == "Approved as an academic demonstration."
    reviewer = db_session.scalar(select(User).where(User.email == "staff@sabtrack.test"))
    assert db_session.get(RedemptionRequest, redemption_id).reviewed_by_id == reviewer.id
    fulfillment = _review_redemption(
        client,
        redemption_id,
        "FULFILLED",
        auth=staff_auth,
        review_notes="Demo record completed.",
    )

    assert fulfillment.status_code == 200
    assert fulfillment.json()["status"] == "FULFILLED"
    assert fulfillment.json()["review_notes"] == "Demo record completed."
    assert fulfillment.json()["fulfilled_at"] is not None


def test_resident_cannot_review_redemption(
    client: TestClient, db_session: Session
):
    _seed_points(db_session, "resident@sabtrack.test")
    resident_auth = _login(client, "resident@sabtrack.test")
    reward = _find_reward(client)
    created = _request_redemption(client, resident_auth, reward["id"])
    assert created.status_code == 201

    response = _review_redemption(
        client, created.json()["id"], "APPROVED", auth=resident_auth
    )

    assert response.status_code == 403
    assert db_session.get(RedemptionRequest, created.json()["id"]).status.value == "PENDING"


def test_cancelling_pending_redemption_refunds_points_and_stock_once(
    client: TestClient, db_session: Session
):
    resident_id = _seed_points(db_session, "resident@sabtrack.test")
    resident_auth = _login(client, "resident@sabtrack.test")
    reward = _find_reward(client)
    created = _request_redemption(client, resident_auth, reward["id"])
    assert created.status_code == 201
    reward_row = db_session.get(RewardItem, reward["id"])
    assert reward_row.stock_quantity == reward["stock_quantity"] - 1
    staff_auth = _login(client, "staff@sabtrack.test")

    cancellation = _review_redemption(
        client, created.json()["id"], "CANCELLED", auth=staff_auth
    )
    assert cancellation.status_code == 200
    assert cancellation.json()["status"] == "CANCELLED"
    assert reward_row.stock_quantity == reward["stock_quantity"]
    refunds = db_session.scalars(
        select(PointsLedger).where(
            PointsLedger.resident_id == resident_id,
            PointsLedger.transaction_type == "REWARD_REFUND",
        )
    ).all()
    assert len(refunds) == 1
    assert refunds[0].points == 1000

    duplicate = _review_redemption(
        client, created.json()["id"], "CANCELLED", auth=staff_auth
    )
    assert duplicate.status_code == 400
    assert len(
        db_session.scalars(
            select(PointsLedger).where(
                PointsLedger.resident_id == resident_id,
                PointsLedger.transaction_type == "REWARD_REFUND",
            )
        ).all()
    ) == 1
    assert reward_row.stock_quantity == reward["stock_quantity"]


def test_redemption_review_rejects_invalid_status_transition(
    client: TestClient, db_session: Session
):
    _seed_points(db_session, "resident@sabtrack.test")
    resident_auth = _login(client, "resident@sabtrack.test")
    reward = _find_reward(client)
    created = _request_redemption(client, resident_auth, reward["id"])
    assert created.status_code == 201
    staff_auth = _login(client, "staff@sabtrack.test")

    pending_to_fulfilled = _review_redemption(
        client, created.json()["id"], "FULFILLED", auth=staff_auth
    )
    assert pending_to_fulfilled.status_code == 400
    approval = _review_redemption(
        client, created.json()["id"], "APPROVED", auth=staff_auth
    )
    assert approval.status_code == 200
    approved_to_cancelled = _review_redemption(
        client, created.json()["id"], "CANCELLED", auth=staff_auth
    )

    assert approved_to_cancelled.status_code == 400
    assert db_session.get(
        RedemptionRequest, created.json()["id"]
    ).status.value == "APPROVED"
    assert db_session.scalar(
        select(PointsLedger.id).where(
            PointsLedger.transaction_type == "REWARD_REFUND"
        )
    ) is None


def test_my_redemptions_only_returns_current_resident_requests(
    client: TestClient, db_session: Session
):
    _seed_points(db_session, "resident@sabtrack.test")
    resident_auth = _login(client, "resident@sabtrack.test")
    staff = db_session.scalar(select(User).where(User.email == "staff@sabtrack.test"))
    assert staff is not None
    reward = _find_reward(client)
    own_redemption = _request_redemption(client, resident_auth, reward["id"])
    assert own_redemption.status_code == 201
    other_redemption = RedemptionRequest(
        resident_id=staff.id,
        reward_id=reward["id"],
        points_spent=1000,
        claim_code="OTHER123",
    )
    db_session.add(other_redemption)
    db_session.commit()

    response = client.get(
        "/api/v1/gamification/my-redemptions",
        cookies={settings.SESSION_COOKIE_NAME: resident_auth[1]},
    )

    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [own_redemption.json()["id"]]
    assert all(item["resident_id"] != staff.id for item in response.json())
    assert db_session.get(RedemptionRequest, other_redemption.id) is not None


def test_reward_descriptions_disclose_in_app_demonstration_only(client: TestClient):
    response = client.get("/api/v1/gamification/rewards")

    assert response.status_code == 200
    assert response.json()
    for reward in response.json():
        description = reward["description"].lower()
        assert "in-app academic demonstration only" in description
        assert "does not issue mobile credit or physical goods" in description


def _submit_claim(
    client: TestClient,
    activity_type: str,
    points_requested: int = 75,
    auth: tuple[str, str] | None = None,
):
    resident_csrf, resident_cookie = auth or _login(client, "resident@sabtrack.test")
    response = client.post(
        "/api/v1/gamification/claims",
        json={
            "activity_type": activity_type,
            "activity_title": "Verified civic activity",
            "description": "Detailed proof of a civic activity for staff review.",
            "points_requested": points_requested,
        },
        headers={"x-csrf-token": resident_csrf},
        cookies={settings.SESSION_COOKIE_NAME: resident_cookie},
    )
    return response, resident_cookie


def _approve_claim(
    client: TestClient,
    claim_id: int,
    points_awarded: int | None = None,
    auth: tuple[str, str] | None = None,
):
    staff_csrf, staff_cookie = auth or _login(client, "staff@sabtrack.test")
    payload = {"status": "APPROVED"}
    if points_awarded is not None:
        payload["points_awarded"] = points_awarded
    return client.patch(
        f"/api/v1/gamification/claims/{claim_id}/review",
        json=payload,
        headers={"x-csrf-token": staff_csrf},
        cookies={settings.SESSION_COOKIE_NAME: staff_cookie},
    )


def test_approved_segregation_claim_awards_exactly_25_points(
    client: TestClient, db_session: Session
):
    claim_response, resident_cookie = _submit_claim(
        client,
        "SEGREGATION",
        points_requested=75,
    )
    assert claim_response.status_code == 201
    claim_id = claim_response.json()["id"]

    approval = _approve_claim(client, claim_id)

    assert approval.status_code == 200
    assert approval.json().get("activity_type") == "SEGREGATION"
    resident_id = claim_response.json()["resident_id"]
    awards = db_session.scalars(
        select(PointsLedger).where(PointsLedger.resident_id == resident_id)
    ).all()
    assert [(entry.points, getattr(entry, "task_key", None)) for entry in awards] == [
        (25, "proper_segregation")
    ]
    assert getattr(awards[0], "task_source_id", None) == str(claim_id)
    summary = client.get(
        "/api/v1/gamification/my-points",
        cookies={settings.SESSION_COOKIE_NAME: resident_cookie},
    ).json()
    award_summary = next(
        item for item in summary["ledger_history"] if item["points"] == 25
    )
    assert award_summary.get("task_key") == "proper_segregation"
    assert award_summary.get("task_source_id") == str(claim_id)


def test_segregation_claim_rejects_custom_point_override(client: TestClient):
    claim_response, _ = _submit_claim(client, "SEGREGATION")
    assert claim_response.status_code == 201

    approval = _approve_claim(
        client,
        claim_response.json()["id"],
        points_awarded=60,
    )

    assert approval.status_code == 400
    assert "fixed" in approval.json()["error"]["message"].lower()


def test_waste_warrior_awards_100_points_on_tenth_new_segregation_claim_only(
    client: TestClient, db_session: Session
):
    resident_user = db_session.scalar(
        select(User).where(User.email == "resident@sabtrack.test")
    )
    assert resident_user is not None
    resident_id = resident_user.id

    db_session.add_all(
        [
            ParticipationClaim(
                resident_id=resident_id,
                activity_title=f"Pre-launch activity {index}",
                description="Previously approved claim, not a new task award.",
                points_requested=25,
                status=ClaimStatus.APPROVED,
                is_demo_data=True,
            )
            for index in range(9)
        ]
    )
    db_session.commit()

    resident_auth = _login(client, "resident@sabtrack.test")
    tasks_response = client.get(
        "/api/v1/gamification/tasks",
        cookies={settings.SESSION_COOKIE_NAME: resident_auth[1]},
    )
    warrior = next(task for task in tasks_response.json() if task["id"] == "waste_warrior")
    assert warrior["status"] == "AVAILABLE"
    assert warrior["progress_current"] == 0

    staff_auth = _login(client, "staff@sabtrack.test")
    for index in range(11):
        claim_response, _ = _submit_claim(
            client,
            "SEGREGATION",
            points_requested=75,
            auth=resident_auth,
        )
        assert claim_response.status_code == 201
        review = _approve_claim(
            client,
            claim_response.json()["id"],
            auth=staff_auth,
        )
        assert review.status_code == 200
        if index == 0:
            tasks_response = client.get(
                "/api/v1/gamification/tasks",
                cookies={settings.SESSION_COOKIE_NAME: resident_auth[1]},
            )
            warrior = next(
                task for task in tasks_response.json() if task["id"] == "waste_warrior"
            )
            assert warrior["status"] == "IN_PROGRESS"
            assert warrior["progress_current"] == 1

    entries = db_session.scalars(
        select(PointsLedger).where(PointsLedger.resident_id == resident_id)
    ).all()
    assert sum(entry.points for entry in entries) == 375
    assert sum(
        1 for entry in entries if getattr(entry, "task_key", None) == "waste_warrior"
    ) == 1
    task_awards = [
        entry
        for entry in entries
        if getattr(entry, "task_key", None) == "proper_segregation"
    ]
    assert len(task_awards) == 11
    assert {getattr(entry, "task_source_id", None) for entry in task_awards} == {
        str(claim.id)
        for claim in db_session.scalars(
            select(ParticipationClaim).where(
                ParticipationClaim.resident_id == resident_id,
                ParticipationClaim.status == ClaimStatus.APPROVED,
            )
        ).all()
        if claim.activity_title == "Verified civic activity"
    }

    tasks_response = client.get(
        "/api/v1/gamification/tasks",
        cookies={settings.SESSION_COOKIE_NAME: resident_auth[1]},
    )
    warrior = next(task for task in tasks_response.json() if task["id"] == "waste_warrior")
    assert warrior["status"] == "COMPLETED"
    assert warrior["progress_current"] == 10


def test_leaderboard_orders_points_masks_names_and_includes_true_current_rank(
    client: TestClient, db_session: Session
):
    _, resident_cookie = _login(client, "resident@sabtrack.test")
    current_resident = db_session.scalar(
        select(User).where(User.email == "resident@sabtrack.test")
    )
    assert current_resident is not None
    area = Area(code="LEADERBOARD-TEST", name="Sabang Purok Test")
    db_session.add(area)
    db_session.flush()
    current_resident.area_id = area.id

    tied_residents = [
        User(
            email=f"leader{index}@sabtrack.test",
            hashed_password="synthetic-test-hash",
            full_name=f"Civic Person {index} Family",
            area_id=area.id,
            is_active=True,
        )
        for index in range(21)
    ]
    db_session.add_all(tied_residents)
    db_session.flush()
    tied_ids = [resident.id for resident in tied_residents]
    db_session.add(
        PointsLedger(
            resident_id=current_resident.id,
            points=-5,
            transaction_type=TransactionType.CIVIC_BONUS,
            description="Ledger adjustment for rank verification",
        )
    )
    db_session.commit()

    response = client.get(
        "/api/v1/gamification/leaderboard",
        cookies={settings.SESSION_COOKIE_NAME: resident_cookie},
    )

    assert response.status_code == 200
    board = response.json()
    assert [entry["resident_id"] for entry in board[:20]] == tied_ids[:20]
    current_entry = next(entry for entry in board if entry["is_current_user"])
    assert current_entry["rank"] == 22
    assert current_entry["display_name"] == "Test Resident (You)"
    assert current_entry["purok_name"] == "Sabang Purok Test"
    assert all(entry["purok_name"] == "Sabang Purok Test" for entry in board)
    for entry in board:
        assert "@" not in entry["display_name"]
        if not entry["is_current_user"]:
            assert "Civic Person" not in entry["display_name"]
            assert entry["display_name"].endswith("F.")


def test_rewards_and_tasks_include_image_url(client: TestClient, db_session: Session):
    # Test rewards endpoint returns image_url for each reward
    rewards_res = client.get("/api/v1/gamification/rewards")
    assert rewards_res.status_code == 200
    rewards = rewards_res.json()
    assert len(rewards) >= 4
    for item in rewards:
        assert "image_url" in item
        assert item["image_url"] is not None
        assert item["image_url"].startswith("/images/rewards/")

    # Test tasks endpoint returns image_url for each civic task
    resident = db_session.scalar(select(User).where(User.email == "resident@sabtrack.test"))
    _, resident_cookie = _login(client, resident.email)
    tasks_res = client.get(
        "/api/v1/gamification/tasks",
        cookies={settings.SESSION_COOKIE_NAME: resident_cookie},
    )
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert len(tasks) >= 5
    for task in tasks:
        assert "image_url" in task
        assert task["image_url"] is not None
        assert task["image_url"].startswith("/images/tasks/")

