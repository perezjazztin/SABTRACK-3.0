from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import Permission
from app.core.deps import get_current_user, require_permission, verify_csrf
from app.modules.identity.models import User
from app.modules.areas.models import Area
from app.modules.schedules.models import DayOfWeek, WasteType, AdvisoryType
from app.modules.schedules.schemas import (
    ScheduleCreate,
    ScheduleRead,
    ScheduleListResponse,
    AdvisoryCreate,
    AdvisoryRead,
    AdvisoryListResponse,
)
from app.modules.schedules.service import (
    get_schedules,
    create_schedule,
    deactivate_schedule,
    get_advisories,
    create_advisory,
)

router = APIRouter()


@router.get("", response_model=ScheduleListResponse, summary="List collection schedules")
def list_schedules_endpoint(
    area_id: Optional[int] = Query(None, description="Filter by area/purok ID"),
    day_of_week: Optional[DayOfWeek] = Query(None, description="Filter by day of week"),
    db: Session = Depends(get_db),
):
    """Retrieve active weekly garbage collection schedules organized by area and day."""
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
        return create_schedule(db, payload)
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
    return {"message": "Schedule deactivated successfully", "id": schedule_id}


@router.get("/advisories", response_model=AdvisoryListResponse, summary="List active collection advisories")
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
        return create_advisory(db, payload, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/areas", summary="List operational areas for scheduling")
def list_schedule_areas_endpoint(db: Session = Depends(get_db)):
    """Retrieve all active barangay areas/puroks."""
    areas = db.scalars(select(Area).where(Area.is_active == True).order_by(Area.name)).all()
    return [{"id": a.id, "code": a.code, "name": a.name, "description": a.description} for a in areas]
