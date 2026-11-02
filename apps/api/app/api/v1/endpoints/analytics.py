from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import Permission, UserRole
from app.core.deps import require_permission, require_role
from app.modules.identity.models import User
from app.modules.analytics.schemas import AnalyticsOverviewResponse, NarrativeSummaryResponse
from app.modules.analytics.service import AnalyticsService

router = APIRouter()


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    summary="Get aggregated business analytics overview",
)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ANALYTICS_READ)),
):
    """Retrieve aggregated operational indicators, complaint distributions, geographic hotspots,
    and decision support recommendations.
    
    Protected by least-privilege RBAC: requires `analytics:read` (Barangay Staff / Admin).
    Strictly zero PII is emitted, complying with RA 10173 and IT 313 academic mandate.
    """
    return AnalyticsService.get_overview_analytics(db)


@router.post(
    "/narrative-summary",
    response_model=NarrativeSummaryResponse,
    summary="Generate AI-assisted executive narrative summary for admins",
)
def generate_narrative_summary_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.BARANGAY_ADMIN)),
):
    """Generates draft narrative executive briefing from aggregated and validated analytics results.
    Exclusively available for Barangay Admins. Emits zero resident PII."""
    return AnalyticsService.generate_narrative_summary(db)
