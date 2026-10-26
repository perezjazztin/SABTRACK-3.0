from app.core.websocket import ws_manager
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.security import Permission, has_permission
from app.core.deps import get_current_user, require_permission, verify_csrf
from app.modules.identity.models import User
from app.modules.reports.models import Report, ReportStatusHistory, ReportCategory, ReportStatus
from app.modules.reports.schemas import (
    ReportCreate,
    ReportRead,
    ReportStatusUpdate,
    ReportListResponse,
    StatusHistoryRead,
)

router = APIRouter()


def _to_report_read(report: Report) -> ReportRead:
    """Helper to convert Report model to ReportRead schema."""
    history_items = [
        StatusHistoryRead(
            id=h.id,
            previous_status=h.previous_status,
            new_status=h.new_status,
            changed_by_name=h.changed_by.full_name if h.changed_by else "System",
            changed_by_role=h.changed_by.role.value if h.changed_by else "SYSTEM",
            remarks=h.remarks,
            created_at=h.created_at,
        )
        for h in (report.status_history or [])
    ]

    return ReportRead(
        id=report.id,
        resident_id=report.resident_id,
        resident_name=report.resident.full_name if report.resident else "Unknown Resident",
        category=report.category,
        title=report.title,
        description=report.description,
        location_text=report.location_text,
        area_id=report.area_id,
        area_name=report.area.name if report.area else None,
        latitude=report.latitude,
        longitude=report.longitude,
        photo_url=report.photo_url,
        status=report.status,
        admin_notes=report.admin_notes,
        is_demo_data=getattr(report, "is_demo_data", False),
        created_at=report.created_at,
        updated_at=report.updated_at,
        status_history=history_items,
    )


@router.post(
    "",
    response_model=ReportRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a community waste report",
    dependencies=[Depends(verify_csrf)],
)
def create_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REPORTS_CREATE)),
) -> ReportRead:
    """Submits a new waste violation or uncollected garbage report.
    
    Creates the report and logs the initial immutable status history entry.
    """
    new_report = Report(
        resident_id=current_user.id,
        category=payload.category,
        title=payload.title,
        description=payload.description,
        location_text=payload.location_text,
        area_id=payload.area_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        photo_url=payload.photo_url,
        status=ReportStatus.SUBMITTED,
        is_demo_data=True if "demo" in current_user.email else False,
    )
    db.add(new_report)
    db.flush()

    # Create initial immutable status history record
    initial_history = ReportStatusHistory(
        report_id=new_report.id,
        previous_status=None,
        new_status=ReportStatus.SUBMITTED.value,
        changed_by_user_id=current_user.id,
        remarks="Report initially submitted by resident.",
    )
    db.add(initial_history)
    db.commit()
    db.refresh(new_report)

    ws_manager.broadcast_sync({
        "type": "REPORT_CREATED",
        "entity": "reports",
        "id": new_report.id,
        "category": new_report.category.value,
        "title": new_report.title,
    })

    return _to_report_read(new_report)


@router.get(
    "/my",
    response_model=ReportListResponse,
    summary="List current resident's submitted reports",
)
def list_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REPORTS_READ_SELF)),
) -> ReportListResponse:
    """Returns all reports submitted by the authenticated resident, newest first."""
    stmt = (
        select(Report)
        .where(Report.resident_id == current_user.id)
        .order_by(desc(Report.created_at))
    )
    reports = db.execute(stmt).scalars().all()
    items = [_to_report_read(r) for r in reports]

    return ReportListResponse(items=items, total=len(items))


@router.get(
    "",
    response_model=ReportListResponse,
    summary="Review all community reports (Staff / Admin)",
)
def list_all_reports(
    category: Optional[ReportCategory] = Query(None, description="Filter by category"),
    report_status: Optional[ReportStatus] = Query(None, alias="status", description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REPORTS_REVIEW)),
) -> ReportListResponse:
    """Returns all community reports for staff review, with optional category/status filters."""
    stmt = select(Report).order_by(desc(Report.created_at))

    if category:
        stmt = stmt.where(Report.category == category)
    if report_status:
        stmt = stmt.where(Report.status == report_status)

    reports = db.execute(stmt).scalars().all()
    items = [_to_report_read(r) for r in reports]

    return ReportListResponse(items=items, total=len(items))


@router.get(
    "/{report_id}",
    response_model=ReportRead,
    summary="Get single report details and status timeline",
)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportRead:
    """Retrieves full details and complete status history of a report."""
    stmt = select(Report).where(Report.id == report_id)
    report = db.execute(stmt).scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    # Check authorization: resident must own it, or user must have reports:review
    is_owner = report.resident_id == current_user.id
    can_review = has_permission(current_user.role, Permission.REPORTS_REVIEW)

    if not (is_owner or can_review):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this report",
        )

    return _to_report_read(report)


@router.patch(
    "/{report_id}/status",
    response_model=ReportRead,
    summary="Update report status (Staff / Admin)",
    dependencies=[Depends(verify_csrf)],
)
def update_report_status(
    report_id: int,
    payload: ReportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REPORTS_REVIEW)),
) -> ReportRead:
    """Updates report status and appends an immutable record to report_status_history."""
    stmt = select(Report).where(Report.id == report_id)
    report = db.execute(stmt).scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    previous_status = report.status.value
    report.status = payload.status

    if payload.admin_notes is not None:
        report.admin_notes = payload.admin_notes

    # Add immutable history record
    history_entry = ReportStatusHistory(
        report_id=report.id,
        previous_status=previous_status,
        new_status=payload.status.value,
        changed_by_user_id=current_user.id,
        remarks=payload.remarks or f"Status changed to {payload.status.value}",
    )
    db.add(history_entry)
    db.commit()
    db.refresh(report)

    ws_manager.broadcast_sync({
        "type": "REPORT_STATUS_CHANGED",
        "entity": "reports",
        "id": report.id,
        "new_status": report.status.value,
        "resident_id": report.resident_id,
    })

    return _to_report_read(report)
