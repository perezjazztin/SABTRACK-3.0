from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, or_

from app.modules.schedules.models import Schedule, ScheduleAdvisory, DayOfWeek
from app.modules.schedules.schemas import ScheduleCreate, ScheduleRead, AdvisoryCreate, AdvisoryRead
from app.modules.areas.models import Area
from app.modules.identity.models import User


def get_schedules(
    db: Session,
    area_id: Optional[int] = None,
    day_of_week: Optional[DayOfWeek] = None,
    active_only: bool = True,
) -> List[ScheduleRead]:
    stmt = (
        select(Schedule)
        .options(joinedload(Schedule.area))
        .order_by(Schedule.day_of_week, Schedule.start_time)
    )

    filters = []
    if active_only:
        filters.append(Schedule.is_active == True)
    if area_id is not None:
        filters.append(Schedule.area_id == area_id)
    if day_of_week is not None:
        filters.append(Schedule.day_of_week == day_of_week)

    if filters:
        stmt = stmt.where(and_(*filters))

    results = db.scalars(stmt).all()
    items = []
    for s in results:
        items.append(
            ScheduleRead(
                id=s.id,
                area_id=s.area_id,
                area_name=s.area.name if s.area else None,
                area_code=s.area.code if s.area else None,
                day_of_week=s.day_of_week,
                waste_type=s.waste_type,
                start_time=s.start_time,
                end_time=s.end_time,
                notes=s.notes,
                is_active=s.is_active,
                is_demo_data=s.is_demo_data,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
        )
    return items


def create_schedule(db: Session, payload: ScheduleCreate) -> ScheduleRead:
    # Verify area exists
    area = db.scalar(select(Area).where(Area.id == payload.area_id))
    if not area:
        raise ValueError(f"Area with id {payload.area_id} does not exist.")

    schedule = Schedule(
        area_id=payload.area_id,
        day_of_week=payload.day_of_week,
        waste_type=payload.waste_type,
        start_time=payload.start_time,
        end_time=payload.end_time,
        notes=payload.notes,
        is_active=True,
        is_demo_data=True,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return ScheduleRead(
        id=schedule.id,
        area_id=schedule.area_id,
        area_name=area.name,
        area_code=area.code,
        day_of_week=schedule.day_of_week,
        waste_type=schedule.waste_type,
        start_time=schedule.start_time,
        end_time=schedule.end_time,
        notes=schedule.notes,
        is_active=schedule.is_active,
        is_demo_data=schedule.is_demo_data,
        created_at=schedule.created_at,
        updated_at=schedule.updated_at,
    )


def deactivate_schedule(db: Session, schedule_id: int) -> bool:
    schedule = db.scalar(select(Schedule).where(Schedule.id == schedule_id))
    if not schedule:
        return False
    schedule.is_active = False
    db.commit()
    return True


def get_advisories(
    db: Session,
    area_id: Optional[int] = None,
    active_only: bool = True,
) -> List[AdvisoryRead]:
    stmt = (
        select(ScheduleAdvisory)
        .options(
            joinedload(ScheduleAdvisory.area),
            joinedload(ScheduleAdvisory.creator),
        )
        .order_by(ScheduleAdvisory.created_at.desc())
    )

    filters = []
    if active_only:
        filters.append(ScheduleAdvisory.is_active == True)
    if area_id is not None:
        # Include area-specific advisories + barangay-wide (area_id is None)
        filters.append(or_(ScheduleAdvisory.area_id == area_id, ScheduleAdvisory.area_id.is_(None)))

    if filters:
        stmt = stmt.where(and_(*filters))

    results = db.scalars(stmt).all()
    items = []
    for a in results:
        items.append(
            AdvisoryRead(
                id=a.id,
                area_id=a.area_id,
                area_name=a.area.name if a.area else "Barangay-wide",
                title=a.title,
                message=a.message,
                advisory_type=a.advisory_type,
                effective_date=a.effective_date,
                created_by_name=a.creator.full_name if a.creator else "Barangay Official",
                is_active=a.is_active,
                created_at=a.created_at,
            )
        )
    return items


def create_advisory(db: Session, payload: AdvisoryCreate, user_id: int) -> AdvisoryRead:
    area_name = "Barangay-wide"
    if payload.area_id:
        area = db.scalar(select(Area).where(Area.id == payload.area_id))
        if not area:
            raise ValueError(f"Area with id {payload.area_id} does not exist.")
        area_name = area.name

    user = db.scalar(select(User).where(User.id == user_id))
    creator_name = user.full_name if user else "Barangay Official"

    advisory = ScheduleAdvisory(
        area_id=payload.area_id,
        title=payload.title,
        message=payload.message,
        advisory_type=payload.advisory_type,
        effective_date=payload.effective_date,
        created_by_id=user_id,
        is_active=True,
        is_demo_data=True,
    )
    db.add(advisory)
    db.commit()
    db.refresh(advisory)

    return AdvisoryRead(
        id=advisory.id,
        area_id=advisory.area_id,
        area_name=area_name,
        title=advisory.title,
        message=advisory.message,
        advisory_type=advisory.advisory_type,
        effective_date=advisory.effective_date,
        created_by_name=creator_name,
        is_active=advisory.is_active,
        created_at=advisory.created_at,
    )
