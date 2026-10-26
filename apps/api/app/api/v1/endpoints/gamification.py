from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission, verify_csrf
from app.core.security import Permission
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
)
from app.modules.gamification.service import (
    create_initiative,
    get_initiatives,
    submit_claim,
    get_claims,
    review_claim,
    get_resident_points_summary,
)

router = APIRouter()


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
