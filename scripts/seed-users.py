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
    {
        "email": "maintainer.demo@sabtrack.local",
        "full_name": "Demo System Maintainer (Fictional)",
        "role": UserRole.SYSTEM_MAINTAINER,
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
