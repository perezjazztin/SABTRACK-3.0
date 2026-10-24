from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, protected_demo, reports

# Ensure all models are registered with SQLAlchemy's mapper registry
# before any endpoint attempts to resolve string-based relationships.
import app.modules.areas.models  # noqa: F401  (registers Area)
import app.modules.identity.models  # noqa: F401  (registers User, Session, SecurityAuditLog)
import app.modules.reports.models  # noqa: F401  (registers Report, ReportStatusHistory)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(protected_demo.router, tags=["Protected Navigation"])
api_router.include_router(reports.router, prefix="/reports", tags=["Community Waste Reports"])
