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
    chatbot,
    notifications,
    identity_verification,
)

# Ensure all models are registered with SQLAlchemy's mapper registry
# before any endpoint attempts to resolve string-based relationships.
import app.modules.areas.models  # noqa: F401  (registers Area)
import app.modules.identity.models  # noqa: F401  (registers User, Session, SecurityAuditLog)
import app.modules.identity_verification.models  # noqa: F401  (registers IdentityVerification)
import app.modules.reports.models  # noqa: F401  (registers Report, ReportStatusHistory)
import app.modules.schedules.models  # noqa: F401  (registers Schedule, ScheduleAdvisory)
import app.modules.announcements.models  # noqa: F401  (registers Announcement)
import app.modules.gamification.models  # noqa: F401  (registers Initiative, ParticipationClaim, PointsLedger)

# Aggregates and mounts all modular endpoint routers into a unified API v1 router.
api_router = APIRouter()

# Health check and service status routes (unauthenticated)
api_router.include_router(health.router, tags=["Health"])

# Authentication routes for registration, login, logout, and session state
api_router.include_router(auth.router, tags=["Authentication"])

# Permission-enforced demonstration routes
api_router.include_router(protected_demo.router, tags=["Protected Navigation"])

# Citizen waste reporting routes (CRUD and status reviews)
api_router.include_router(reports.router, prefix="/reports", tags=["Community Waste Reports"])

# Collection schedules and real-time advisory routes
api_router.include_router(schedules.router, prefix="/schedules", tags=["Garbage Collection Schedules"])

# Official barangay advisories and bulletin announcements
api_router.include_router(announcements.router, prefix="/announcements", tags=["Official Announcements"])

# Civic task awards, gamification ledger, and voucher redemption routes
api_router.include_router(gamification.router, prefix="/gamification", tags=["SAB-Points Gamification"])

# Business intelligence analytics and 7-day predictive forecasting
api_router.include_router(analytics.router, prefix="/analytics", tags=["Formal Business Analytics"])

# Administrative user provisioning and account status management
api_router.include_router(users.router, prefix="/users", tags=["User & Personnel Management"])

# Protected evidence photo uploads and secure file streaming
api_router.include_router(uploads.router, tags=["Protected Evidence Uploads"])

# WebSocket bidirectional connection endpoint for real-time synchronization
api_router.include_router(realtime.router, tags=["Real-Time Synchronization"])

# EcoBot AI assistant endpoint for RA 9003 guidance and upcycling tutorials
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["EcoBot Civic AI"])

# Email notifications and diagnostic testing
api_router.include_router(notifications.router, prefix="/notifications", tags=["Email Notifications & Diagnostics"])

# Government ID OCR extraction and facial biometric verification routes
api_router.include_router(identity_verification.router, tags=["Integrated Identity Verification"])
