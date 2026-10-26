from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, func, desc

from app.modules.gamification.models import (
    Initiative,
    ParticipationClaim,
    PointsLedger,
    ClaimStatus,
    TransactionType,
)
from app.modules.gamification.schemas import (
    InitiativeCreate,
    InitiativeRead,
    ClaimCreate,
    ClaimRead,
    ClaimReviewPayload,
    PointsLedgerRead,
    ResidentPointsSummary,
)
from app.modules.identity.models import User


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
                points_requested=c.points_requested,
                status=c.status,
                reviewed_by_name=c.reviewer.full_name if c.reviewer else None,
                review_notes=c.review_notes,
                reviewed_at=c.reviewed_at,
                created_at=c.created_at,
            )
        )
    return items


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
    )
    if not claim:
        raise ValueError(f"Claim with id {claim_id} not found.")

    if claim.status != ClaimStatus.PENDING:
        raise ValueError(f"Claim has already been reviewed ({claim.status.value}).")

    reviewer = db.scalar(select(User).where(User.id == reviewer_id))
    now = datetime.now(timezone.utc)

    claim.status = payload.status
    claim.reviewed_by_id = reviewer_id
    claim.review_notes = payload.review_notes
    claim.reviewed_at = now

    if payload.status == ClaimStatus.APPROVED:
        award_points = payload.points_awarded if payload.points_awarded is not None else claim.points_requested
        ledger_entry = PointsLedger(
            resident_id=claim.resident_id,
            points=award_points,
            transaction_type=TransactionType.CLAIM_AWARD,
            claim_id=claim.id,
            description=f"Verified participation: {claim.activity_title}",
            created_at=now,
        )
        db.add(ledger_entry)

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
        points_requested=claim.points_requested,
        status=claim.status,
        reviewed_by_name=reviewer.full_name if reviewer else "Staff Reviewer",
        review_notes=claim.review_notes,
        reviewed_at=claim.reviewed_at,
        created_at=claim.created_at,
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
