from fastapi import APIRouter, Depends
from app.core.deps import require_permission
from app.core.security import Permission
from app.modules.identity.models import User

router = APIRouter()


@router.get(
    "/resident/my-reports",
    summary="Protected resident reports endpoint",
)
def get_resident_reports(
    user: User = Depends(require_permission(Permission.REPORTS_READ_SELF)),
):
    """Accessible by users holding reports:read:self permission (RESIDENT)."""
    return {
        "message": f"Authorized resident access for {user.email}",
        "feature": "My Reports (Phase 3 Placeholder)",
        "scope": "self_only",
    }


@router.get(
    "/admin/reports-queue",
    summary="Protected admin/staff report review queue",
)
def get_admin_reports_queue(
    user: User = Depends(require_permission(Permission.REPORTS_REVIEW)),
):
    """Accessible by staff and admins holding reports:review permission."""
    return {
        "message": f"Authorized review queue access for {user.email}",
        "feature": "Report Management Queue (Phase 3 Placeholder)",
        "role": user.role.value,
    }


@router.get(
    "/admin/schedules-manage",
    summary="Protected schedule administration endpoint",
)
def manage_schedules(
    user: User = Depends(require_permission(Permission.SCHEDULES_MANAGE)),
):
    """Accessible strictly by admins holding schedules:manage permission."""
    return {
        "message": f"Authorized schedule administration for {user.email}",
        "feature": "Collection Schedule Management (Phase 3 Placeholder)",
        "role": user.role.value,
    }


@router.get(
    "/admin/users-manage",
    summary="Protected user administration endpoint",
)
def manage_users(
    user: User = Depends(require_permission(Permission.USERS_MANAGE)),
):
    """Accessible strictly by admins holding users:manage permission."""
    return {
        "message": f"Authorized user management for {user.email}",
        "feature": "User and Access Management",
        "role": user.role.value,
    }
