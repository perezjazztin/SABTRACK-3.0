"""Development-only script to seed fictional test accounts, demo areas, and sample reports.

CRITICAL SECURITY AND RESEARCH INTEGRITY NOTICE:
- These accounts and reports are strictly for local academic development and evaluation.
- They MUST NEVER be deployed to any staging or production environment.
- No real resident or barangay official identities are used.
"""

import os
import sys
from datetime import datetime, timezone
from sqlalchemy import select

# Add apps/api to path so app modules import properly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password, UserRole
from app.modules.areas.models import Area
from app.modules.identity.models import User
from app.modules.reports.models import Report, ReportStatusHistory, ReportCategory, ReportStatus
from app.modules.schedules.models import Schedule, ScheduleAdvisory, DayOfWeek, WasteType, AdvisoryType
from app.modules.announcements.models import Announcement, AnnouncementCategory
from app.modules.gamification.models import (
    Initiative,
    ParticipationClaim,
    PointsLedger,
    ClaimStatus,
    TransactionType,
)

# Development password configurable via environment variable
DEV_PASSWORD = os.getenv("DEV_SEED_PASSWORD", "SabtrackDevPass2026!")

DEMO_ACCOUNTS = [
    {
        "email": "resident.demo@sabtrack.local",
        "full_name": "Demo Resident (Fictional)",
        "role": UserRole.RESIDENT,
    },
    {
        "email": "staff.demo@sabtrack.local",
        "full_name": "Demo Staff Reviewer (Fictional)",
        "role": UserRole.BARANGAY_STAFF,
    },
    {
        "email": "admin.demo@sabtrack.local",
        "full_name": "Demo Barangay Admin (Fictional)",
        "role": UserRole.BARANGAY_ADMIN,
    },
]

DEMO_AREAS = [
    {"code": "DEMO_ZONE_NORTH", "name": "Demo Zone A - North Sector", "description": "Synthetic demonstration area for testing."},
    {"code": "DEMO_ZONE_CENTRAL", "name": "Demo Zone B - Central Sector", "description": "Synthetic demonstration area for testing."},
    {"code": "DEMO_ZONE_SOUTH", "name": "Demo Zone C - South Sector", "description": "Synthetic demonstration area for testing."},
]


def seed_database() -> None:
    print("[SABTRACK] Starting development database seeding...")
    db = SessionLocal()

    try:
        # 1. Seed demo areas
        for area_data in DEMO_AREAS:
            existing = db.scalar(select(Area).where(Area.code == area_data["code"]))
            if not existing:
                area = Area(
                    code=area_data["code"],
                    name=area_data["name"],
                    description=area_data["description"],
                    is_active=True,
                    is_demo_data=True,
                )
                db.add(area)
                print(f"  + Created demo area: {area_data['name']}")
        db.commit()

        # 2. Seed demo users
        hashed_pw = hash_password(DEV_PASSWORD)
        users_map = {}
        for acc in DEMO_ACCOUNTS:
            user = db.scalar(select(User).where(User.email == acc["email"]))
            if not user:
                user = User(
                    email=acc["email"],
                    hashed_password=hashed_pw,
                    full_name=acc["full_name"],
                    role=acc["role"],
                    is_active=True,
                )
                db.add(user)
                db.flush()
                print(f"  + Created demo user: {acc['email']} ({acc['role'].value})")
            else:
                print(f"  . User already exists: {acc['email']}")
            users_map[acc["role"]] = user

        db.commit()

        # 3. Seed demo reports for resident
        resident_user = users_map.get(UserRole.RESIDENT)
        staff_user = users_map.get(UserRole.BARANGAY_STAFF)
        sample_area = db.scalar(select(Area).where(Area.code == "DEMO_ZONE_NORTH"))

        if resident_user:
            existing_report = db.scalar(select(Report).where(Report.resident_id == resident_user.id))
            if not existing_report:
                demo_reports = [
                    {
                        "category": ReportCategory.UNCOLLECTED_GARBAGE,
                        "title": "Uncollected Biodegradable Waste on Corner Street",
                        "description": "Garbage bags left on the sidewalk since yesterday's scheduled pickup. Several stray dogs are tearing the bags open.",
                        "location_text": "Corner of Sitio Sampaguita and Main Road, near public water pump",
                        "status": ReportStatus.SUBMITTED,
                    },
                    {
                        "category": ReportCategory.ILLEGAL_DUMPING,
                        "title": "Illegal Construction Debris Dumping in Vacant Lot",
                        "description": "Concrete blocks, old tiles, and paint cans dumped near the vacant lot behind the daycare center.",
                        "location_text": "Vacant lot along Sitio Ilaya, behind Daycare Center",
                        "status": ReportStatus.UNDER_REVIEW,
                    },
                    {
                        "category": ReportCategory.OVERFLOWING_BIN,
                        "title": "Community Segregation Bin Completely Filled",
                        "description": "Public segregation receptacles for recyclables are overflowing. Need urgent collection dispatch.",
                        "location_text": "Barangay Sabang Plaza, near Basketball Court entrance",
                        "status": ReportStatus.RESOLVED,
                    },
                ]

                for r_data in demo_reports:
                    rep = Report(
                        resident_id=resident_user.id,
                        category=r_data["category"],
                        title=r_data["title"],
                        description=r_data["description"],
                        location_text=r_data["location_text"],
                        area_id=sample_area.id if sample_area else None,
                        status=r_data["status"],
                        is_demo_data=True,
                    )
                    db.add(rep)
                    db.flush()

                    # Initial submission history
                    h1 = ReportStatusHistory(
                        report_id=rep.id,
                        previous_status=None,
                        new_status=ReportStatus.SUBMITTED.value,
                        changed_by_user_id=resident_user.id,
                        remarks="Initial report submitted by resident.",
                    )
                    db.add(h1)

                    # If under review or resolved, add history progression
                    if r_data["status"] in [ReportStatus.UNDER_REVIEW, ReportStatus.RESOLVED] and staff_user:
                        h2 = ReportStatusHistory(
                            report_id=rep.id,
                            previous_status=ReportStatus.SUBMITTED.value,
                            new_status=ReportStatus.UNDER_REVIEW.value,
                            changed_by_user_id=staff_user.id,
                            remarks="Barangay staff assigned and reviewing complaint details.",
                        )
                        db.add(h2)

                    if r_data["status"] == ReportStatus.RESOLVED and staff_user:
                        h3 = ReportStatusHistory(
                            report_id=rep.id,
                            previous_status=ReportStatus.UNDER_REVIEW.value,
                            new_status=ReportStatus.RESOLVED.value,
                            changed_by_user_id=staff_user.id,
                            remarks="Dispatch team collected overflow waste. Resolved with photo verification.",
                        )
                        db.add(h3)

                db.commit()
                print("  + Seeded 3 demonstration waste reports with immutable history.")

        existing_schedules = db.scalars(select(Schedule)).all()
        all_areas = db.scalars(select(Area)).all()
        if not existing_schedules and all_areas:
            zone_a = all_areas[0]
            zone_b = all_areas[1] if len(all_areas) > 1 else all_areas[0]

            demo_schedules = [
                Schedule(
                    area_id=zone_a.id,
                    day_of_week=DayOfWeek.MONDAY,
                    waste_type=WasteType.BIODEGRADABLE,
                    start_time="06:00 AM",
                    end_time="09:00 AM",
                    notes="Kitchen scraps, garden waste, food leftovers in biodegradable green sacks.",
                    is_active=True,
                    is_demo_data=True,
                ),
                Schedule(
                    area_id=zone_a.id,
                    day_of_week=DayOfWeek.WEDNESDAY,
                    waste_type=WasteType.NON_BIODEGRADABLE,
                    start_time="06:00 AM",
                    end_time="09:00 AM",
                    notes="Residual waste, sanitized plastics, single-use containers in black sacks.",
                    is_active=True,
                    is_demo_data=True,
                ),
                Schedule(
                    area_id=zone_a.id,
                    day_of_week=DayOfWeek.SATURDAY,
                    waste_type=WasteType.RECYCLABLE,
                    start_time="08:00 AM",
                    end_time="11:00 AM",
                    notes="Cardboard, clean glass bottles, metal cans, and dry clean packaging.",
                    is_active=True,
                    is_demo_data=True,
                ),
                Schedule(
                    area_id=zone_b.id,
                    day_of_week=DayOfWeek.TUESDAY,
                    waste_type=WasteType.BIODEGRADABLE,
                    start_time="07:00 AM",
                    end_time="10:00 AM",
                    notes="Biodegradable waste pickup for Central Sector.",
                    is_active=True,
                    is_demo_data=True,
                ),
                Schedule(
                    area_id=zone_b.id,
                    day_of_week=DayOfWeek.THURSDAY,
                    waste_type=WasteType.NON_BIODEGRADABLE,
                    start_time="07:00 AM",
                    end_time="10:00 AM",
                    notes="Non-biodegradable residual pickup for Central Sector.",
                    is_active=True,
                    is_demo_data=True,
                ),
            ]
            db.add_all(demo_schedules)

            admin_user = db.scalar(select(User).where(User.email == "admin.demo@sabtrack.local"))
            if admin_user:
                advisory = ScheduleAdvisory(
                    area_id=zone_a.id,
                    title="Collection Delay Notice: Truck 2 Maintenance",
                    message="Garbage collection for Zone A scheduled for Monday morning will be delayed. Truck will arrive starting at 10:30 AM due to scheduled maintenance.",
                    advisory_type=AdvisoryType.DELAY,
                    effective_date="October 26, 2026",
                    created_by_id=admin_user.id,
                    is_active=True,
                    is_demo_data=True,
                )
                db.add(advisory)

            db.commit()
            print("  + Seeded 5 demonstration collection schedules and 1 advisory.")

        # Seed announcements if none exist
        existing_announcements = db.scalars(select(Announcement)).all()
        if not existing_announcements:
            admin_user = db.scalar(select(User).where(User.email == "admin.demo@sabtrack.local"))
            staff_user = db.scalar(select(User).where(User.email == "staff.demo@sabtrack.local"))
            author = admin_user or staff_user

            if author:
                demo_announcements = [
                    Announcement(
                        title="Barangay Sabang Community Riverbank Clean-Up Drive",
                        content="Join your fellow residents this coming Saturday morning from 6:30 AM to 10:00 AM for our quarterly ecological river clean-up. Garbage bags, heavy-duty gloves, and refreshments will be provided at the Barangay Hall. Earn civic participation recognition!",
                        category=AnnouncementCategory.CLEANUP_DRIVE,
                        is_pinned=True,
                        is_active=True,
                        is_demo_data=True,
                        author_id=author.id,
                    ),
                    Announcement(
                        title="Strict Implementation of RA 9003 Waste Segregation at Source",
                        content="Pursuant to Republic Act No. 9003 (Ecological Solid Waste Management Act) and local barangay ordinance, all households are mandated to segregate biodegradable and non-biodegradable waste. Mixed waste bags will not be collected by truck crews.",
                        category=AnnouncementCategory.POLICY_UPDATE,
                        is_pinned=False,
                        is_active=True,
                        is_demo_data=True,
                        author_id=author.id,
                    ),
                    Announcement(
                        title="All Saints' Day Weekend Waste Collection Timetable Shift",
                        content="Please be advised that regular Sunday collection will be moved to Monday due to the upcoming national holiday weekend. Collection will resume normal hours on Tuesday morning.",
                        category=AnnouncementCategory.HOLIDAY_SCHEDULE,
                        is_pinned=False,
                        is_active=True,
                        is_demo_data=True,
                        author_id=author.id,
                    ),
                ]
                db.add_all(demo_announcements)
                db.commit()
                print("  + Seeded 3 demonstration announcements.")

        # Seed gamification initiatives and points ledger
        existing_inits = db.scalars(select(Initiative)).all()
        if not existing_inits:
            init1 = Initiative(
                title="Barangay Sabang Riverbank Clean-Up Drive",
                description="Community clean-up along the Sabang creek and river pathways. Refreshments and certificates provided.",
                points_reward=50,
                event_date="November 7, 2026",
                location="Barangay Sabang Plaza",
                is_active=True,
                is_demo_data=True,
            )
            init2 = Initiative(
                title="Purok Recyclable Plastic Bottle Collection Campaign",
                description="Drop off segregated and cleaned plastic bottles at the barangay materials recovery station.",
                points_reward=35,
                event_date="Every Saturday Morning",
                location="Barangay Materials Recovery Facility (MRF)",
                is_active=True,
                is_demo_data=True,
            )
            db.add_all([init1, init2])
            db.flush()

            # Seed demo claims and points for demo resident
            resident_user = db.scalar(select(User).where(User.email == "resident.demo@sabtrack.local"))
            staff_user = db.scalar(select(User).where(User.email == "staff.demo@sabtrack.local"))

            if resident_user and staff_user:
                # 1. Approved claim with ledger points
                claim_approved = ParticipationClaim(
                    resident_id=resident_user.id,
                    initiative_id=init1.id,
                    activity_title="Riverbank Volunteer Attendance",
                    description="Attended and assisted in collecting 3 sacks of plastic bottles and floating waste.",
                    points_requested=50,
                    status=ClaimStatus.APPROVED,
                    reviewed_by_id=staff_user.id,
                    review_notes="Attendance confirmed during roll-call by Kagawad in charge of Environment.",
                    reviewed_at=datetime.now(timezone.utc),
                    is_demo_data=True,
                )
                db.add(claim_approved)
                db.flush()

                # Add double-entry ledger record
                ledger1 = PointsLedger(
                    resident_id=resident_user.id,
                    points=50,
                    transaction_type=TransactionType.CLAIM_AWARD,
                    claim_id=claim_approved.id,
                    description="Verified participation: Riverbank Volunteer Attendance",
                    created_at=datetime.now(timezone.utc),
                )
                db.add(ledger1)

                # 2. Bonus points for early waste segregation compliance
                ledger2 = PointsLedger(
                    resident_id=resident_user.id,
                    points=25,
                    transaction_type=TransactionType.CIVIC_BONUS,
                    description="Civic recognition: Perfect Purok waste segregation compliance",
                    created_at=datetime.now(timezone.utc),
                )
                db.add(ledger2)

                # 3. Pending claim awaiting staff review
                claim_pending = ParticipationClaim(
                    resident_id=resident_user.id,
                    initiative_id=init2.id,
                    activity_title="Segregated 8kg PET Bottles",
                    description="Turned over clean plastic containers to Purok MRF drop box on Saturday.",
                    points_requested=35,
                    status=ClaimStatus.PENDING,
                    is_demo_data=True,
                )
                db.add(claim_pending)

            db.commit()
            print("  + Seeded 2 initiatives, 2 participation claims, and 75 SAB-Points in ledger.")

        print("\n[SUCCESS] Seeding complete!")
        print(f"Default development password: '{DEV_PASSWORD}'")
        print("Accounts available for testing:")
        for acc in DEMO_ACCOUNTS:
            print(f"  - {acc['role'].value:18} | Email: {acc['email']}")

    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] Seeding failed: {exc}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
