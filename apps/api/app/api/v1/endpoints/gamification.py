from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission, require_role, verify_csrf
from app.core.security import Permission, UserRole
from app.core.websocket import ws_manager
from app.modules.identity.models import User
from app.modules.gamification.schemas import (
    InitiativeCreate,
    InitiativeRead,
    ClaimCreate,
    ClaimRead,
    ClaimReviewPayload,
    ResidentPointsSummary,
    ClaimStatus,
    RewardItemRead,
    RedemptionCreate,
    RedemptionReviewPayload,
    RedemptionRequestRead,
    CivicTaskItem,
    LeaderboardEntry,
    ArticleReadingOpenRequest,
    ArticleReadingSessionRead,
    ArticleReadingStatus,
    ArticleReadingCompleteRequest,
    ArticleReadingCompletion,
)
from app.modules.gamification.service import (
    create_initiative,
    get_initiatives,
    submit_claim,
    get_claims,
    review_claim,
    get_resident_points_summary,
    get_reward_items,
    redeem_reward,
    review_redemption,
    get_my_redemptions,
    get_leaderboard,
    get_civic_tasks,
    open_article_reading_session,
    get_article_reading_status,
    complete_article_reading,
)

router = APIRouter()


@router.post(
    "/article-reading/open",
    response_model=ArticleReadingSessionRead,
    summary="Open a server-tracked Awareness Hub article reading session",
    dependencies=[Depends(verify_csrf)],
)
def open_article_reading_endpoint(
    payload: ArticleReadingOpenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.RESIDENT)),
):
    try:
        return open_article_reading_session(db, current_user.id, payload.article_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get(
    "/article-reading/status",
    response_model=ArticleReadingStatus,
    summary="Get resident Awareness Hub article reading progress",
)
def article_reading_status_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.RESIDENT)),
):
    return get_article_reading_status(db, current_user.id)


@router.post(
    "/article-reading/complete",
    response_model=ArticleReadingCompletion,
    summary="Complete a server-tracked Awareness Hub article reading session",
    dependencies=[Depends(verify_csrf)],
)
def complete_article_reading_endpoint(
    payload: ArticleReadingCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.RESIDENT)),
):
    try:
        return complete_article_reading(db, current_user.id, payload.session_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get(
    "/my-points",
    response_model=ResidentPointsSummary,
    summary="Get resident points balance, history and rank",
)
def get_my_points_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns total points, active tier, and complete immutable transaction history."""
    return get_resident_points_summary(db, current_user.id)


@router.get(
    "/leaderboard",
    response_model=List[LeaderboardEntry],
    summary="Get community civic action leaderboard",
)
def get_leaderboard_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns top participating residents ranked by verified SAB-Points and purok."""
    return get_leaderboard(db, current_user.id)


@router.get(
    "/tasks",
    response_model=List[CivicTaskItem],
    summary="Get resident civic action tasks and missions",
)
def get_tasks_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns predefined civic tasks, requirements, point values, and completion progress."""
    return get_civic_tasks(db, current_user.id)


@router.get(
    "/rewards",
    response_model=List[RewardItemRead],
    summary="List in-app academic demonstration vouchers",
)
def get_rewards_endpoint(db: Session = Depends(get_db)):
    """Returns active vouchers recorded for academic demonstration only."""
    return get_reward_items(db, active_only=True)


@router.post(
    "/redeem",
    response_model=RedemptionRequestRead,
    status_code=status.HTTP_201_CREATED,
    summary="Record an in-app academic demonstration voucher",
    dependencies=[Depends(verify_csrf)],
)
def redeem_reward_endpoint(
    payload: RedemptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record an in-app academic demonstration voucher using accumulated points."""
    try:
        redemption = redeem_reward(db, current_user.id, payload.reward_id)
        ws_manager.broadcast_sync({
            "type": "REWARD_REDEEMED",
            "entity": "rewards",
            "id": redemption.id,
            "resident_id": current_user.id,
            "reward_name": redemption.reward_name,
        })
        return redemption
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/my-redemptions",
    response_model=List[RedemptionRequestRead],
    summary="List my academic demonstration vouchers",
)
def get_my_redemptions_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns only the current resident's in-app voucher history."""
    return get_my_redemptions(db, current_user.id)


@router.patch(
    "/redemptions/{redemption_id}/review",
    response_model=RedemptionRequestRead,
    summary="Review a reward redemption (Staff / Admin)",
    dependencies=[Depends(verify_csrf)],
)
def review_redemption_endpoint(
    redemption_id: int,
    payload: RedemptionReviewPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.PARTICIPATION_REVIEW)),
):
    """Approve, cancel, or fulfill a resident's in-app academic demonstration voucher."""
    try:
        redemption = review_redemption(db, redemption_id, current_user.id, payload)
        ws_manager.broadcast_sync({
            "type": "REDEMPTION_REVIEWED",
            "entity": "redemptions",
            "id": redemption.id,
            "status": redemption.status.value,
            "resident_id": redemption.resident_id,
        })
        return redemption
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/initiatives",
    response_model=List[InitiativeRead],
    summary="List active clean-up and recycling initiatives",
)
def list_initiatives_endpoint(db: Session = Depends(get_db)):
    """Retrieve all open community initiatives residents can participate in."""
    return get_initiatives(db, active_only=True)


@router.post(
    "/initiatives",
    response_model=InitiativeRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create civic initiative (Staff / Admin)",
    dependencies=[Depends(verify_csrf)],
)
def create_initiative_endpoint(
    payload: InitiativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.PARTICIPATION_REVIEW)),
):
    """Publish a new civic initiative with SAB-Points reward value."""
    initiative = create_initiative(db, payload)
    ws_manager.broadcast_sync({"type": "INITIATIVE_CREATED", "entity": "initiatives", "id": initiative.id})
    return initiative


@router.post(
    "/claims",
    response_model=ClaimRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit participation claim (Resident)",
    dependencies=[Depends(verify_csrf)],
)
def submit_claim_endpoint(
    payload: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit proof of participation in an initiative or verified waste segregation."""
    claim = submit_claim(db, current_user.id, payload)
    ws_manager.broadcast_sync({"type": "CLAIM_SUBMITTED", "entity": "claims", "id": claim.id})
    return claim


@router.get("/claims/my", response_model=List[ClaimRead], summary="List my participation claims")
def list_my_claims_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all participation claims submitted by current resident."""
    return get_claims(db, resident_id=current_user.id)


@router.get("/claims", response_model=List[ClaimRead], summary="List claims review queue (Staff / Admin)")
def list_all_claims_endpoint(
    status_filter: Optional[ClaimStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.PARTICIPATION_REVIEW)),
):
    """Retrieve claims queue for verification and point issuance."""
    return get_claims(db, status=status_filter)


@router.patch(
    "/claims/{claim_id}/review",
    response_model=ClaimRead,
    summary="Review and award points (Staff / Admin)",
    dependencies=[Depends(verify_csrf)],
)
def review_claim_endpoint(
    claim_id: int,
    payload: ClaimReviewPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.PARTICIPATION_REVIEW)),
):
    """Approve or reject a participation claim. Approved claims automatically post to points_ledger."""
    try:
        claim = review_claim(db, claim_id, current_user.id, payload)
        ws_manager.broadcast_sync({
            "type": "CLAIM_REVIEWED",
            "entity": "claims",
            "id": claim.id,
            "status": claim.status.value,
            "resident_id": claim.resident_id,
        })
        return claim
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
