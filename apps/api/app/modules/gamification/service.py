import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, func, desc
from sqlalchemy.exc import IntegrityError

from app.modules.gamification.models import (
    Initiative,
    ParticipationClaim,
    PointsLedger,
    ArticleReadAward,
    ArticleReadingSession,
    RewardItem,
    RedemptionRequest,
    ClaimActivityType,
    ClaimStatus,
    RedemptionStatus,
    TransactionType,
)
from app.modules.gamification.schemas import (
    InitiativeCreate,
    InitiativeRead,
    ClaimCreate,
    ClaimRead,
    ClaimReviewPayload,
    RedemptionReviewPayload,
    PointsLedgerRead,
    ResidentPointsSummary,
    RewardItemRead,
    RedemptionRequestRead,
    CivicTaskItem,
    LeaderboardEntry,
    ArticleReadingCompletion,
    ArticleReadingSessionRead,
    ArticleReadingStatus,
)
from app.modules.identity.models import User
from app.modules.areas.models import Area
from app.modules.reports.models import Report, ReportStatus
from app.core.security import UserRole


DEFAULT_REWARDS = [
    {
        "name": "₱100 Mobile Load",
        "description": "In-app academic demonstration only. This voucher is recorded for academic demonstration and does not issue mobile credit or physical goods.",
        "points_required": 500,
        "category": "DIGITAL",
        "stock_quantity": 50,
        "image_url": "/images/rewards/load_100.jpg",
        "is_active": True,
        "is_demo_data": True,
    },
    {
        "name": "5kg Rice",
        "description": "In-app academic demonstration only. This voucher is recorded for academic demonstration and does not issue mobile credit or physical goods.",
        "points_required": 1000,
        "category": "GOODS",
        "stock_quantity": 30,
        "image_url": "/images/rewards/rice_5kg.jpg",
        "is_active": True,
        "is_demo_data": True,
    },
    {
        "name": "10kg Rice",
        "description": "In-app academic demonstration only. This voucher is recorded for academic demonstration and does not issue mobile credit or physical goods.",
        "points_required": 2000,
        "category": "GOODS",
        "stock_quantity": 20,
        "image_url": "/images/rewards/rice_10kg.jpg",
        "is_active": True,
        "is_demo_data": True,
    },
    {
        "name": "₱500 Worth of Groceries",
        "description": "In-app academic demonstration only. This voucher is recorded for academic demonstration and does not issue mobile credit or physical goods.",
        "points_required": 2500,
        "category": "VOUCHER",
        "stock_quantity": 15,
        "image_url": "/images/rewards/grocery_500.jpg",
        "is_active": True,
        "is_demo_data": True,
    },
]

ELIGIBLE_ARTICLE_IDS = (
    "article-sdgs-sabtrack",
    "article-ra-9003",
    "article-home-composting",
)
ARTICLE_READING_DAILY_LIMIT = 3
ARTICLE_READING_POINTS = 5
ARTICLE_READING_MINIMUM_SECONDS = 20
PHILIPPINE_TIMEZONE = ZoneInfo("Asia/Manila")


def _article_reading_day_bounds(now: datetime) -> tuple[datetime, datetime]:
    local_now = now.astimezone(PHILIPPINE_TIMEZONE)
    local_start = datetime.combine(
        local_now.date(),
        datetime.min.time(),
        tzinfo=PHILIPPINE_TIMEZONE,
    )
    local_end = local_start + timedelta(days=1)
    return (
        local_start.astimezone(timezone.utc),
        local_end.astimezone(timezone.utc),
    )


def _count_article_awards_today(db: Session, resident_id: int, now: datetime) -> int:
    start, end = _article_reading_day_bounds(now)
    return int(
        db.scalar(
            select(func.count(PointsLedger.id)).where(
                PointsLedger.resident_id == resident_id,
                PointsLedger.transaction_type == TransactionType.ARTICLE_READ_AWARD,
                PointsLedger.created_at >= start,
                PointsLedger.created_at < end,
            )
        )
        or 0
    )


def get_article_reading_status(db: Session, resident_id: int) -> ArticleReadingStatus:
    now = datetime.now(timezone.utc)
    completed_article_ids = db.scalars(
        select(ArticleReadAward.article_id).where(
            ArticleReadAward.resident_id == resident_id
        )
    ).all()
    return ArticleReadingStatus(
        completed_article_ids=sorted(completed_article_ids),
        awards_today=_count_article_awards_today(db, resident_id, now),
        daily_limit=ARTICLE_READING_DAILY_LIMIT,
        points_per_article=ARTICLE_READING_POINTS,
        minimum_read_seconds=ARTICLE_READING_MINIMUM_SECONDS,
    )


def open_article_reading_session(
    db: Session,
    resident_id: int,
    article_id: str,
) -> ArticleReadingSessionRead:
    if article_id not in ELIGIBLE_ARTICLE_IDS:
        raise ValueError("This article is not eligible for a reading reward.")

    resident = db.scalar(select(User).where(User.id == resident_id).with_for_update())
    if not resident:
        raise ValueError("Resident is not available.")

    awarded = db.scalar(
        select(ArticleReadAward.id).where(
            ArticleReadAward.resident_id == resident_id,
            ArticleReadAward.article_id == article_id,
        )
    )
    if awarded is not None:
        return ArticleReadingSessionRead(
            article_id=article_id,
            session_id=None,
            opened_at=None,
            already_read=True,
        )

    now = datetime.now(timezone.utc)
    reading_session = db.scalar(
        select(ArticleReadingSession)
        .where(
            ArticleReadingSession.resident_id == resident_id,
            ArticleReadingSession.article_id == article_id,
        )
        .with_for_update()
    )
    session_id = uuid4()
    if reading_session is None:
        reading_session = ArticleReadingSession(
            id=session_id,
            resident_id=resident_id,
            article_id=article_id,
            opened_at=now,
            consumed=False,
        )
        db.add(reading_session)
    else:
        reading_session.id = session_id
        reading_session.opened_at = now
        reading_session.consumed = False

    db.commit()
    return ArticleReadingSessionRead(
        article_id=article_id,
        session_id=session_id,
        opened_at=now,
        already_read=False,
    )


def complete_article_reading(
    db: Session,
    resident_id: int,
    session_id: UUID,
) -> ArticleReadingCompletion:
    resident = db.scalar(select(User).where(User.id == resident_id).with_for_update())
    if not resident:
        raise ValueError("Invalid or unavailable article reading session.")

    reading_session = db.scalar(
        select(ArticleReadingSession)
        .where(
            ArticleReadingSession.id == session_id,
            ArticleReadingSession.resident_id == resident_id,
        )
        .with_for_update()
    )
    if reading_session is None or reading_session.article_id not in ELIGIBLE_ARTICLE_IDS:
        raise ValueError("Invalid or unavailable article reading session.")

    now = datetime.now(timezone.utc)
    existing_award = db.scalar(
        select(ArticleReadAward).where(
            ArticleReadAward.resident_id == resident_id,
            ArticleReadAward.article_id == reading_session.article_id,
        )
    )
    if existing_award is not None:
        if not reading_session.consumed:
            reading_session.consumed = True
            db.commit()
        return ArticleReadingCompletion(
            article_id=reading_session.article_id,
            status="ALREADY_READ",
            points_awarded=0,
            awards_today=_count_article_awards_today(db, resident_id, now),
        )
    if reading_session.consumed:
        raise ValueError("Invalid or unavailable article reading session.")

    opened_at = reading_session.opened_at
    if opened_at.tzinfo is None:
        opened_at = opened_at.replace(tzinfo=timezone.utc)
    if (now - opened_at).total_seconds() < ARTICLE_READING_MINIMUM_SECONDS:
        raise ValueError("Read the article for at least 20 seconds before completing.")

    awards_today = _count_article_awards_today(db, resident_id, now)
    if awards_today >= ARTICLE_READING_DAILY_LIMIT:
        reading_session.consumed = True
        db.commit()
        return ArticleReadingCompletion(
            article_id=reading_session.article_id,
            status="DAILY_LIMIT_REACHED",
            points_awarded=0,
            awards_today=awards_today,
        )

    ledger_entry = PointsLedger(
        resident_id=resident_id,
        points=ARTICLE_READING_POINTS,
        transaction_type=TransactionType.ARTICLE_READ_AWARD,
        description=f"Awareness Hub article read: {reading_session.article_id}",
        task_key="awareness_article_reading",
        task_source_id=reading_session.article_id,
        created_at=now,
    )
    db.add(ledger_entry)
    reading_session.consumed = True
    try:
        db.flush()
        db.add(
            ArticleReadAward(
                resident_id=resident_id,
                article_id=reading_session.article_id,
                ledger_entry_id=ledger_entry.id,
                awarded_at=now,
            )
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        existing_award = db.scalar(
            select(ArticleReadAward).where(
                ArticleReadAward.resident_id == resident_id,
                ArticleReadAward.article_id == reading_session.article_id,
            )
        )
        if existing_award is None:
            raise
        return ArticleReadingCompletion(
            article_id=reading_session.article_id,
            status="ALREADY_READ",
            points_awarded=0,
            awards_today=_count_article_awards_today(db, resident_id, now),
        )

    return ArticleReadingCompletion(
        article_id=reading_session.article_id,
        status="AWARDED",
        points_awarded=ARTICLE_READING_POINTS,
        awards_today=_count_article_awards_today(db, resident_id, now),
    )


def ensure_default_rewards(db: Session) -> None:
    """Seeds default rewards catalog if table is empty (e.g. in-memory test isolation)."""
    count = db.scalar(select(func.count(RewardItem.id))) or 0
    if count == 0:
        for item in DEFAULT_REWARDS:
            db.add(RewardItem(**item))
        db.commit()
    else:
        updated = False
        for item in DEFAULT_REWARDS:
            existing = db.scalar(select(RewardItem).where(RewardItem.name == item["name"]))
            if existing and not existing.image_url and item.get("image_url"):
                existing.image_url = item["image_url"]
                updated = True
        if updated:
            db.commit()


def get_initiatives(db: Session, active_only: bool = True) -> List[InitiativeRead]:
    stmt = select(Initiative).order_by(desc(Initiative.created_at))
    if active_only:
        stmt = stmt.where(Initiative.is_active == True)
    results = db.scalars(stmt).all()
    return [InitiativeRead.model_validate(i) for i in results]


def create_initiative(db: Session, payload: InitiativeCreate) -> InitiativeRead:
    initiative = Initiative(
        title=payload.title,
        description=payload.description,
        points_reward=payload.points_reward,
        event_date=payload.event_date,
        location=payload.location,
        is_active=True,
        is_demo_data=True,
    )
    db.add(initiative)
    db.commit()
    db.refresh(initiative)
    return InitiativeRead.model_validate(initiative)


def submit_claim(db: Session, resident_id: int, payload: ClaimCreate) -> ClaimRead:
    initiative_title = None
    points = payload.points_requested
    if payload.initiative_id:
        init = db.scalar(select(Initiative).where(Initiative.id == payload.initiative_id))
        if init:
            initiative_title = init.title
            points = init.points_reward

    claim = ParticipationClaim(
        resident_id=resident_id,
        initiative_id=payload.initiative_id,
        activity_title=payload.activity_title,
        description=payload.description,
        evidence_url=payload.evidence_url,
        activity_type=payload.activity_type,
        points_requested=points,
        status=ClaimStatus.PENDING,
        is_demo_data=True,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    resident = db.scalar(select(User).where(User.id == resident_id))

    return ClaimRead(
        id=claim.id,
        resident_id=claim.resident_id,
        resident_name=resident.full_name if resident else "Resident",
        initiative_id=claim.initiative_id,
        initiative_title=initiative_title,
        activity_title=claim.activity_title,
        description=claim.description,
        evidence_url=claim.evidence_url,
        activity_type=claim.activity_type,
        points_requested=claim.points_requested,
        status=claim.status,
        created_at=claim.created_at,
    )


def get_claims(
    db: Session,
    resident_id: Optional[int] = None,
    status: Optional[ClaimStatus] = None,
) -> List[ClaimRead]:
    stmt = (
        select(ParticipationClaim)
        .options(
            joinedload(ParticipationClaim.resident),
            joinedload(ParticipationClaim.initiative),
            joinedload(ParticipationClaim.reviewer),
        )
        .order_by(desc(ParticipationClaim.created_at))
    )

    filters = []
    if resident_id is not None:
        filters.append(ParticipationClaim.resident_id == resident_id)
    if status is not None:
        filters.append(ParticipationClaim.status == status)

    if filters:
        stmt = stmt.where(and_(*filters))

    results = db.scalars(stmt).all()
    items = []
    for c in results:
        items.append(
            ClaimRead(
                id=c.id,
                resident_id=c.resident_id,
                resident_name=c.resident.full_name if c.resident else "Resident",
                initiative_id=c.initiative_id,
                initiative_title=c.initiative.title if c.initiative else None,
                activity_title=c.activity_title,
                description=c.description,
                evidence_url=c.evidence_url,
                activity_type=c.activity_type,
                points_requested=c.points_requested,
                status=c.status,
                reviewed_by_name=c.reviewer.full_name if c.reviewer else None,
                review_notes=c.review_notes,
                reviewed_at=c.reviewed_at,
                created_at=c.created_at,
            )
        )
    return items


def _has_task_award(db: Session, resident_id: int, task_key: str) -> bool:
    return db.scalar(
        select(PointsLedger.id)
        .where(
            PointsLedger.resident_id == resident_id,
            PointsLedger.task_key == task_key,
        )
        .limit(1)
    ) is not None


def review_claim(
    db: Session,
    claim_id: int,
    reviewer_id: int,
    payload: ClaimReviewPayload,
) -> ClaimRead:
    claim = db.scalar(
        select(ParticipationClaim)
        .options(
            joinedload(ParticipationClaim.resident),
            joinedload(ParticipationClaim.initiative),
        )
        .where(ParticipationClaim.id == claim_id)
        .with_for_update(of=ParticipationClaim)
    )
    if not claim:
        raise ValueError(f"Claim with id {claim_id} not found.")

    if claim.status != ClaimStatus.PENDING:
        raise ValueError(f"Claim has already been reviewed ({claim.status.value}).")

    if claim.activity_type == ClaimActivityType.SEGREGATION and payload.points_awarded is not None:
        raise ValueError("Segregation claims have a fixed 25-point award; custom points are not allowed.")

    if payload.status == ClaimStatus.APPROVED:
        db.scalar(select(User).where(User.id == claim.resident_id).with_for_update())

    reviewer = db.scalar(select(User).where(User.id == reviewer_id))
    now = datetime.now(timezone.utc)

    claim.status = payload.status
    claim.reviewed_by_id = reviewer_id
    claim.review_notes = payload.review_notes
    claim.reviewed_at = now

    if payload.status == ClaimStatus.APPROVED:
        is_segregation = claim.activity_type == ClaimActivityType.SEGREGATION
        if is_segregation:
            award_points = 25
        elif payload.points_awarded is not None:
            award_points = payload.points_awarded
        else:
            award_points = claim.points_requested
        ledger_entry = PointsLedger(
            resident_id=claim.resident_id,
            points=award_points,
            transaction_type=TransactionType.CLAIM_AWARD,
            claim_id=claim.id,
            description=f"Verified participation: {claim.activity_title}",
            task_key="proper_segregation" if is_segregation else None,
            task_source_id=str(claim.id) if is_segregation else None,
            created_at=now,
        )
        db.add(ledger_entry)
        if is_segregation:
            db.flush()
            segregation_awards = db.scalar(
                select(func.count(PointsLedger.id)).where(
                    PointsLedger.resident_id == claim.resident_id,
                    PointsLedger.task_key == "proper_segregation",
                )
            ) or 0
            if segregation_awards >= 10 and not _has_task_award(
                db,
                claim.resident_id,
                "waste_warrior",
            ):
                db.add(
                    PointsLedger(
                        resident_id=claim.resident_id,
                        points=100,
                        transaction_type=TransactionType.CIVIC_BONUS,
                        description="Waste Warrior milestone: 10 verified segregation claims",
                        task_key="waste_warrior",
                        task_source_id=str(claim.resident_id),
                        created_at=now,
                    )
                )

    db.commit()
    db.refresh(claim)

    return ClaimRead(
        id=claim.id,
        resident_id=claim.resident_id,
        resident_name=claim.resident.full_name if claim.resident else "Resident",
        initiative_id=claim.initiative_id,
        initiative_title=claim.initiative.title if claim.initiative else None,
        activity_title=claim.activity_title,
        description=claim.description,
        evidence_url=claim.evidence_url,
        activity_type=claim.activity_type,
        points_requested=claim.points_requested,
        status=claim.status,
        reviewed_by_name=reviewer.full_name if reviewer else "Staff Reviewer",
        review_notes=claim.review_notes,
        reviewed_at=claim.reviewed_at,
        created_at=claim.created_at,
    )


def award_verified_report(db: Session, report: Report) -> None:
    if not report.civic_task_eligible or report.status != ReportStatus.RESOLVED:
        return

    db.scalar(select(User).where(User.id == report.resident_id).with_for_update())
    now = datetime.now(timezone.utc)

    if not _has_task_award(db, report.resident_id, "first_report"):
        db.add(
            PointsLedger(
                resident_id=report.resident_id,
                points=50,
                transaction_type=TransactionType.CIVIC_BONUS,
                description="Verified first community report",
                task_key="first_report",
                task_source_id=str(report.id),
                created_at=now,
            )
        )

    has_complete_evidence = (
        bool(report.photo_url and report.photo_url.strip())
        and report.latitude is not None
        and report.longitude is not None
        and bool(report.location_text and report.location_text.strip())
    )
    if (
        has_complete_evidence
        and not _has_task_award(
            db,
            report.resident_id,
            "reporting_violations_with_evidence",
        )
    ):
        db.add(
            PointsLedger(
                resident_id=report.resident_id,
                points=100,
                transaction_type=TransactionType.CIVIC_BONUS,
                description="Verified report with geotagged photo evidence",
                task_key="reporting_violations_with_evidence",
                task_source_id=str(report.id),
                created_at=now,
            )
        )


def get_resident_points_summary(db: Session, resident_id: int) -> ResidentPointsSummary:
    total = db.scalar(
        select(func.coalesce(func.sum(PointsLedger.points), 0)).where(
            PointsLedger.resident_id == resident_id
        )
    ) or 0

    verified_count = db.scalar(
        select(func.count(ParticipationClaim.id)).where(
            and_(
                ParticipationClaim.resident_id == resident_id,
                ParticipationClaim.status == ClaimStatus.APPROVED,
            )
        )
    ) or 0

    if total >= 200:
        tier = "Gold Barangay Champion"
    elif total >= 50:
        tier = "Silver Eco-Warrior"
    else:
        tier = "Bronze Eco-Citizen"

    ledger_records = db.scalars(
        select(PointsLedger)
        .where(PointsLedger.resident_id == resident_id)
        .order_by(desc(PointsLedger.created_at))
        .limit(20)
    ).all()
    ledger_history = [PointsLedgerRead.model_validate(rec) for rec in ledger_records]

    claims = get_claims(db, resident_id=resident_id)

    return ResidentPointsSummary(
        total_points=int(total),
        tier=tier,
        verified_activities_count=int(verified_count),
        ledger_history=ledger_history,
        recent_claims=claims[:10],
    )


# ---------------------------------------------------------------------------
# Rewards Catalog & Redemption Services
# ---------------------------------------------------------------------------

def get_reward_items(db: Session, active_only: bool = True) -> List[RewardItemRead]:
    ensure_default_rewards(db)
    stmt = select(RewardItem).order_by(RewardItem.points_required)
    if active_only:
        stmt = stmt.where(RewardItem.is_active == True)
    results = db.scalars(stmt).all()
    return [RewardItemRead.model_validate(r) for r in results]


def redeem_reward(db: Session, resident_id: int, reward_id: int) -> RedemptionRequestRead:
    ensure_default_rewards(db)
    resident = db.scalar(
        select(User).where(User.id == resident_id).with_for_update()
    )
    if not resident:
        raise ValueError(f"Resident {resident_id} is not available for redemption.")

    reward = db.scalar(
        select(RewardItem).where(RewardItem.id == reward_id).with_for_update()
    )
    if not reward or not reward.is_active or reward.stock_quantity <= 0:
        raise ValueError(f"Reward item {reward_id} is not available for redemption.")

    current_balance = db.scalar(
        select(func.coalesce(func.sum(PointsLedger.points), 0)).where(
            PointsLedger.resident_id == resident_id
        )
    ) or 0
    if current_balance < reward.points_required:
        raise ValueError(
            f"Insufficient SAB-Points balance. You need {reward.points_required} points but have {current_balance} points."
        )

    alphabet = string.ascii_uppercase + string.digits
    for attempt in range(5):
        claim_code = "".join(secrets.choice(alphabet) for _ in range(8))
        existing_code = db.scalar(
            select(RedemptionRequest.id).where(
                RedemptionRequest.claim_code == claim_code
            )
        )
        if existing_code is not None:
            continue

        now = datetime.now(timezone.utc)
        redemption = RedemptionRequest(
            resident_id=resident_id,
            reward_id=reward.id,
            points_spent=reward.points_required,
            claim_code=claim_code,
            status=RedemptionStatus.PENDING,
            is_demo_data=True,
            created_at=now,
        )
        db.add(redemption)
        db.add(
            PointsLedger(
                resident_id=resident_id,
                points=-reward.points_required,
                transaction_type=TransactionType.REWARD_REDEMPTION,
                description=f"Redeemed: {reward.name} (Voucher: {claim_code})",
                created_at=now,
            )
        )
        reward.stock_quantity -= 1

        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            if _is_claim_code_conflict(exc) and attempt < 4:
                resident = db.scalar(
                    select(User).where(User.id == resident_id).with_for_update()
                )
                reward = db.scalar(
                    select(RewardItem).where(RewardItem.id == reward_id).with_for_update()
                )
                if not reward or not reward.is_active or reward.stock_quantity <= 0:
                    raise ValueError(
                        f"Reward item {reward_id} is not available for redemption."
                    )
                current_balance = db.scalar(
                    select(func.coalesce(func.sum(PointsLedger.points), 0)).where(
                        PointsLedger.resident_id == resident_id
                    )
                ) or 0
                if current_balance < reward.points_required:
                    raise ValueError(
                        f"Insufficient SAB-Points balance. You need {reward.points_required} points but have {current_balance} points."
                    )
                continue
            raise

        db.refresh(redemption)
        return _redemption_read(redemption, resident, reward)

    raise ValueError("Unable to create a unique redemption voucher code.")


def _is_claim_code_conflict(exc: IntegrityError) -> bool:
    constraint_name = getattr(getattr(exc.orig, "diag", None), "constraint_name", None)
    if constraint_name == "ix_redemption_requests_claim_code":
        return True
    message = str(exc.orig).lower()
    return "claim_code" in message and (
        "unique" in message or "duplicate" in message
    )


def _redemption_read(
    redemption: RedemptionRequest, resident: User, reward: RewardItem
) -> RedemptionRequestRead:
    return RedemptionRequestRead(
        id=redemption.id,
        resident_id=redemption.resident_id,
        resident_name=resident.full_name,
        reward_id=reward.id,
        reward_name=reward.name,
        points_spent=redemption.points_spent,
        claim_code=redemption.claim_code,
        status=redemption.status,
        review_notes=redemption.review_notes,
        fulfilled_at=redemption.fulfilled_at,
        created_at=redemption.created_at,
    )


def review_redemption(
    db: Session,
    redemption_id: int,
    reviewer_id: int,
    payload: RedemptionReviewPayload,
) -> RedemptionRequestRead:
    redemption = db.scalar(
        select(RedemptionRequest)
        .where(RedemptionRequest.id == redemption_id)
        .with_for_update()
    )
    if not redemption:
        raise ValueError(f"Redemption request {redemption_id} was not found.")

    resident = db.scalar(
        select(User).where(User.id == redemption.resident_id).with_for_update()
    )
    reward = db.scalar(
        select(RewardItem)
        .where(RewardItem.id == redemption.reward_id)
        .with_for_update()
    )
    if not resident or not reward:
        raise ValueError(f"Redemption request {redemption_id} is unavailable.")

    allowed_transitions = {
        (RedemptionStatus.PENDING, RedemptionStatus.APPROVED),
        (RedemptionStatus.PENDING, RedemptionStatus.CANCELLED),
        (RedemptionStatus.APPROVED, RedemptionStatus.FULFILLED),
    }
    transition = (redemption.status, payload.status)
    if transition not in allowed_transitions:
        raise ValueError(
            f"Cannot transition redemption from {redemption.status.value} to {payload.status.value}."
        )

    now = datetime.now(timezone.utc)
    redemption.status = payload.status
    redemption.reviewed_by_id = reviewer_id
    redemption.review_notes = payload.review_notes
    if payload.status == RedemptionStatus.FULFILLED:
        redemption.fulfilled_at = now
    elif payload.status == RedemptionStatus.CANCELLED:
        db.add(
            PointsLedger(
                resident_id=redemption.resident_id,
                points=redemption.points_spent,
                transaction_type=TransactionType.REWARD_REFUND,
                description=f"Refunded cancelled redemption: {reward.name} (Voucher: {redemption.claim_code})",
                created_at=now,
            )
        )
        reward.stock_quantity += 1

    db.commit()
    db.refresh(redemption)
    return _redemption_read(redemption, resident, reward)


def get_my_redemptions(db: Session, resident_id: int) -> List[RedemptionRequestRead]:
    stmt = (
        select(RedemptionRequest)
        .options(
            joinedload(RedemptionRequest.resident),
            joinedload(RedemptionRequest.reward),
        )
        .where(RedemptionRequest.resident_id == resident_id)
        .order_by(desc(RedemptionRequest.created_at))
    )
    results = db.scalars(stmt).all()
    items = []
    for r in results:
        items.append(
            RedemptionRequestRead(
                id=r.id,
                resident_id=r.resident_id,
                resident_name=r.resident.full_name if r.resident else "Resident",
                reward_id=r.reward_id,
                reward_name=r.reward.name if r.reward else "Reward",
                points_spent=r.points_spent,
                claim_code=r.claim_code,
                status=r.status,
                review_notes=r.review_notes,
                fulfilled_at=r.fulfilled_at,
                created_at=r.created_at,
            )
        )
    return items


# ---------------------------------------------------------------------------
# Civic Tasks & Leaderboard Services
# ---------------------------------------------------------------------------

def _mask_name_for_privacy(full_name: str) -> str:
    """Formats resident name according to RA 10173 privacy (e.g. Maria S. or Juan D.)."""
    cleaned = full_name.replace("(fictional)", "").replace("(synthetic)", "").strip()
    parts = cleaned.split()
    if not parts:
        return "Civic Resident"
    if len(parts) == 1:
        return parts[0]
    first = parts[0]
    last_initial = parts[-1][0].upper()
    return f"{first} {last_initial}."


def get_leaderboard(db: Session, current_user_id: int, limit: int = 20) -> List[LeaderboardEntry]:
    # Query all residents (area_id is a column, not a relationship — no joinedload needed)
    residents = db.scalars(
        select(User)
        .where(User.role == UserRole.RESIDENT, User.is_active == True)
    ).all()

    # Aggregate ledger balances per resident
    points_map = dict(
        db.execute(
            select(
                PointsLedger.resident_id,
                func.coalesce(func.sum(PointsLedger.points), 0),
            ).group_by(PointsLedger.resident_id)
        ).all()
    )

    # Aggregate verified claims
    claims_map = dict(
        db.execute(
            select(
                ParticipationClaim.resident_id,
                func.count(ParticipationClaim.id),
            )
            .where(ParticipationClaim.status == ClaimStatus.APPROVED)
            .group_by(ParticipationClaim.resident_id)
        ).all()
    )

    # Fetch areas for area name lookup
    areas = {a.id: a.name for a in db.scalars(select(Area)).all()}

    entries = []
    for res in residents:
        pts = int(points_map.get(res.id, 0))
        verified_count = int(claims_map.get(res.id, 0))

        if pts >= 200:
            tier = "Gold Barangay Champion"
        elif pts >= 50:
            tier = "Silver Eco-Warrior"
        else:
            tier = "Bronze Eco-Citizen"

        is_current = (res.id == current_user_id)
        display_name = f"{res.full_name} (You)" if is_current else _mask_name_for_privacy(res.full_name)
        purok = areas.get(res.area_id, "Barangay Sabang Proper")

        entries.append({
            "resident_id": res.id,
            "display_name": display_name,
            "purok_name": purok,
            "total_points": pts,
            "tier": tier,
            "verified_activities_count": verified_count,
            "is_current_user": is_current,
        })

    entries.sort(
        key=lambda x: (
            -x["total_points"],
            -x["verified_activities_count"],
            x["resident_id"],
        )
    )

    # Assign 1-based ranks
    ranked = []
    for idx, e in enumerate(entries[:limit], start=1):
        ranked.append(LeaderboardEntry(rank=idx, **e))

    # If current user is not in top limit, make sure they know their relative standing
    current_entry = next((e for e in ranked if e.is_current_user), None)
    if not current_entry:
        for idx, e in enumerate(entries, start=1):
            if e["is_current_user"]:
                ranked.append(LeaderboardEntry(rank=idx, **e))
                break

    return ranked


def get_civic_tasks(db: Session, resident_id: int) -> List[CivicTaskItem]:
    task_awards = dict(
        db.execute(
            select(PointsLedger.task_key, func.count(PointsLedger.id))
            .where(
                PointsLedger.resident_id == resident_id,
                PointsLedger.task_key.in_(
                    (
                        "first_report",
                        "proper_segregation",
                        "waste_warrior",
                        "reporting_violations_with_evidence",
                    )
                ),
            )
            .group_by(PointsLedger.task_key)
        ).all()
    )
    first_report_awarded = int(task_awards.get("first_report", 0))
    segregation_awards = int(task_awards.get("proper_segregation", 0))
    waste_warrior_awarded = int(task_awards.get("waste_warrior", 0))
    evidence_awarded = int(task_awards.get("reporting_violations_with_evidence", 0))

    tasks = [
        CivicTaskItem(
            id="first_report",
            title="First Report",
            description="Submit your first community waste or illegal dumping report to the Barangay.",
            points_reward=50,
            category="REPORTING",
            status="COMPLETED" if first_report_awarded else "AVAILABLE",
            progress_current=min(1, first_report_awarded),
            progress_target=1,
            is_repeatable=False,
            action_type="SUBMIT_REPORT",
            image_url="/images/tasks/first_report.jpg",
        ),
        CivicTaskItem(
            id="proper_segregation",
            title="Proper Segregation",
            description="Biodegradable and non-biodegradable waste separated correctly according to RA 9003.",
            points_reward=25,
            category="SEGREGATION",
            status="COMPLETED" if segregation_awards else "AVAILABLE",
            progress_current=min(1, segregation_awards),
            progress_target=1,
            is_repeatable=True,
            action_type="CLAIM_SEGREGATION",
            image_url="/images/tasks/proper_segregation.jpg",
        ),
        CivicTaskItem(
            id="no_violation_record",
            title="No Violation Record",
            description="Zero recorded environmental violation citations or active non-compliance notices.",
            points_reward=25,
            category="COMPLIANCE",
            status="UNAVAILABLE",
            progress_current=0,
            progress_target=1,
            is_repeatable=False,
            action_type="AUTO_AWARD",
            image_url="/images/tasks/no_violation_record.jpg",
        ),
        CivicTaskItem(
            id="waste_warrior",
            title="Waste Warrior",
            description="Submit 10 newly verified waste segregation claims.",
            points_reward=100,
            category="MILESTONE",
            status=(
                "COMPLETED"
                if segregation_awards >= 10
                else "IN_PROGRESS"
                if segregation_awards
                else "AVAILABLE"
            ),
            progress_current=min(10, segregation_awards),
            progress_target=10,
            is_repeatable=False,
            action_type="MILESTONE",
            image_url="/images/tasks/waste_warrior.jpg",
        ),
        CivicTaskItem(
            id="reporting_violations_with_evidence",
            title="Reporting Violations with Evidence",
            description="Submit valid reports with geotagged photo proof and detailed location description.",
            points_reward=100,
            category="REPORTING",
            status="COMPLETED" if evidence_awarded else "AVAILABLE",
            progress_current=min(1, evidence_awarded),
            progress_target=1,
            is_repeatable=False,
            action_type="SUBMIT_REPORT",
            image_url="/images/tasks/reporting_violations_with_evidence.jpg",
        ),
    ]

    return tasks
