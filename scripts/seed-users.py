"""Development-only script to seed fictional test accounts and demo areas.

CRITICAL SECURITY AND RESEARCH INTEGRITY NOTICE:
- These accounts are strictly for local academic development and evaluation.
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
        for acc in DEMO_ACCOUNTS:
            existing_user = db.scalar(select(User).where(User.email == acc["email"]))
            if not existing_user:
                user = User(
                    email=acc["email"],
                    hashed_password=hashed_pw,
                    full_name=acc["full_name"],
                    role=acc["role"],
                    is_active=True,
                )
                db.add(user)
                print(f"  + Created demo user: {acc['email']} ({acc['role'].value})")
            else:
                print(f"  . User already exists: {acc['email']}")

        db.commit()
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
