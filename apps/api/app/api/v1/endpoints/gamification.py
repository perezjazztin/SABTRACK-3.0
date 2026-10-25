from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import Permission
from app.core.deps import get_current_user, require_permission, verify_csrf
from app.modules.identity.models import User
from app.modules.gamification.models import ClaimStatus
from app.modules.gamification.schemas import (
    InitiativeCreate,
    InitiativeRead,
    ClaimCreate,
    ClaimRead,
    ClaimReviewPayload,
    ResidentPointsSummary,
)
from app.modules.gamification.service import (
    get_initiatives,
    create_initiative,
    submit_claim,
    get_claims,
    review_claim,
    get_resident_points_summary,
)

router = APIRouter()


@router.get("/my-points", response_model=ResidentPointsSummary, summary="Get resident points & ledger")
def get_my_points_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve current resident's total points balance, tier, and transaction ledger."""
    return get_resident_points_summary(db, current_user.id)


@router.get("/initiatives", response_model=List[InitiativeRead], summary="List community initiatives")
def list_initiatives_endpoint(
    db: Session = Depends(get_db),
):
    """Retrieve active clean-up drives, seminars, and ecological campaigns."""
    return get_initiatives(db, active_only=True)


@router.post(
    "/initiatives",
    response_model=InitiativeRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create initiative (Staff / Admin)",
    dependencies=[Depends(verify_csrf)],
)
def create_initiative_endpoint(
    payload: InitiativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.PARTICIPATION_REVIEW)),
):
    """Create a new point-eligible community activity."""
    return create_initiative(db, payload)


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
    return submit_claim(db, current_user.id, payload)


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
        return review_claim(db, claim_id, current_user.id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
