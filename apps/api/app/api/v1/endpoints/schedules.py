from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission, verify_csrf
from app.core.security import Permission
from app.core.websocket import ws_manager
from app.modules.identity.models import User
from app.modules.areas.models import Area
from app.modules.schedules.schemas import (
    ScheduleCreate,
    ScheduleRead,
    ScheduleListResponse,
    AdvisoryCreate,
    AdvisoryRead,
    AdvisoryListResponse,
)
from app.modules.schedules.service import (
    create_schedule,
    get_schedules,
    deactivate_schedule,
    create_advisory,
    get_advisories,
)

router = APIRouter()


@router.get(
    "",
    response_model=ScheduleListResponse,
    summary="List active collection schedules",
)
def list_schedules_endpoint(
    area_id: Optional[int] = Query(None, description="Filter by operational area/purok ID"),
    day_of_week: Optional[int] = Query(None, ge=0, le=6, description="Filter by day (0=Monday..6=Sunday)"),
    db: Session = Depends(get_db),
):
    """Retrieve all recurring collection schedules, filterable by area or day."""
    items = get_schedules(db, area_id=area_id, day_of_week=day_of_week, active_only=True)
    return ScheduleListResponse(items=items, total=len(items))


@router.post(
    "",
    response_model=ScheduleRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create collection schedule (Admin only)",
    dependencies=[Depends(verify_csrf)],
)
def create_schedule_endpoint(
    payload: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SCHEDULES_MANAGE)),
):
    """Create a new collection timetable slot for an area. Requires `schedules:manage` permission."""
    try:
        schedule = create_schedule(db, payload)
        ws_manager.broadcast_sync({"type": "SCHEDULE_CREATED", "entity": "schedules"})
        return schedule
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/{schedule_id}",
    status_code=status.HTTP_200_OK,
    summary="Deactivate collection schedule (Admin only)",
    dependencies=[Depends(verify_csrf)],
)
def delete_schedule_endpoint(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SCHEDULES_MANAGE)),
):
    """Deactivate an existing collection timetable entry. Requires `schedules:manage` permission."""
    success = deactivate_schedule(db, schedule_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule with ID {schedule_id} not found.",
        )
    ws_manager.broadcast_sync({"type": "SCHEDULE_DEACTIVATED", "entity": "schedules", "id": schedule_id})
    return {"message": "Schedule deactivated successfully", "id": schedule_id}


@router.get(
    "/advisories",
    response_model=AdvisoryListResponse,
    summary="List active collection delay/suspension advisories",
)
def list_advisories_endpoint(
    area_id: Optional[int] = Query(None, description="Filter by area ID"),
    db: Session = Depends(get_db),
):
    """Retrieve active route modification or delay advisories."""
    items = get_advisories(db, area_id=area_id, active_only=True)
    return AdvisoryListResponse(items=items, total=len(items))


@router.post(
    "/advisories",
    response_model=AdvisoryRead,
    status_code=status.HTTP_201_CREATED,
    summary="Broadcast schedule advisory (Admin only)",
    dependencies=[Depends(verify_csrf)],
)
def create_advisory_endpoint(
    payload: AdvisoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.SCHEDULES_MANAGE)),
):
    """Publish a collection delay, route modification, or advisory notice."""
    try:
        advisory = create_advisory(db, payload, current_user.id)
        ws_manager.broadcast_sync({"type": "ADVISORY_BROADCAST", "entity": "schedules", "id": advisory.id})
        return advisory
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/areas", summary="List operational areas for scheduling")
def list_schedule_areas_endpoint(db: Session = Depends(get_db)):
    """Retrieve all active barangay areas/puroks."""
    areas = db.scalars(select(Area).where(Area.is_active == True).order_by(Area.name)).all()
    return [{"id": a.id, "code": a.code, "name": a.name, "description": a.description} for a in areas]
