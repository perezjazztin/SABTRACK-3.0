from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    protected_demo,
    reports,
    schedules,
    announcements,
    gamification,
    analytics,
    users,
    uploads,
    realtime,
)

# Ensure all models are registered with SQLAlchemy's mapper registry
# before any endpoint attempts to resolve string-based relationships.
import app.modules.areas.models  # noqa: F401  (registers Area)
import app.modules.identity.models  # noqa: F401  (registers User, Session, SecurityAuditLog)
import app.modules.reports.models  # noqa: F401  (registers Report, ReportStatusHistory)
import app.modules.schedules.models  # noqa: F401  (registers Schedule, ScheduleAdvisory)
import app.modules.announcements.models  # noqa: F401  (registers Announcement)
import app.modules.gamification.models  # noqa: F401  (registers Initiative, ParticipationClaim, PointsLedger)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(protected_demo.router, tags=["Protected Navigation"])
api_router.include_router(reports.router, prefix="/reports", tags=["Community Waste Reports"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["Garbage Collection Schedules"])
api_router.include_router(announcements.router, prefix="/announcements", tags=["Official Announcements"])
api_router.include_router(gamification.router, prefix="/gamification", tags=["SAB-Points Gamification"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Formal Business Analytics"])
api_router.include_router(users.router, prefix="/users", tags=["User & Personnel Management"])
api_router.include_router(uploads.router, tags=["Protected Evidence Uploads"])
api_router.include_router(realtime.router, tags=["Real-Time Synchronization"])
