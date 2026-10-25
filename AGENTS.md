# AGENTS.md — Guardrails and Instructions for AI Coding Assistants

**Project:** SABTRACK 3.0 (IT 313 — System Analysis and Design, Batangas State University – The NEU)  
**Client:** Barangay Sabang (Barangay Council / LGU), Lipa City, Batangas, Philippines  
**Proponents:** Jazztin H. Perez, Faith A. Valencia, May Sigrid M. Dimaano  

---

## 1. Core Operating Principles for AI Agents

1. **Academic and Research Integrity:**
   - Never invent client interviews, approvals, resident names, or real barangay operational workflows.
   - Any demonstration data must be explicitly labeled as synthetic (`is_demo_data=True`).
   - Retain the official academic title in documentation: *"SABTRACK: A Digital Governance Platform for Garbage Collection Scheduling, Community Violation Reporting, and Gamified Waste Management Engagement in Barangay Sabang"*.

2. **Phase-Gated Development:**
   - Build incrementally. Never implement multiple phases at once.
   - Obtain user approval before generating domain code for new phases.
   - **Phase 1 (Foundation) — COMPLETE** (commit `b5831f4`)
   - **Phase 2 (Identity, RBAC, Sessions, Portal Navigation) — COMPLETE** (commit `098632c`)
   - **Phase 3 (Core Waste Operations) — COMPLETE** (commits `8c47b7c`, `d6ec9eb`, `b38e62c`, `864b60f`)
   - **Phase 4 (Gamification, Business Analytics, Dashboards) — COMPLETE** (commits `8477453`, `864b60f`)
   - **Phase 5 (Production Hardening & Deployment) — PENDING**

3. **Database Rules:**
   - PostgreSQL is the mandatory primary development and production database.
   - Do NOT introduce SQLite fallbacks without explicit user approval.
   - Exception: `sqlite:///:memory:` with `StaticPool` is used exclusively in Pytest (`conftest.py`) for hermetic test isolation. This is not a production fallback.
   - Schema modifications must be performed via Alembic migrations (`apps/api/alembic/versions`).
   - Geographic structures must remain dynamic (`areas` table), not hardcoded to fixed counts or names.

4. **Security & Data Privacy (RA 10173):**
   - Never log passwords, tokens, or PII.
   - Image attachments must be stored in authenticated non-public storage.
   - Strip EXIF GPS telemetry upon ingestion.
   - AI features must be decision-support only, receiving pre-computed numerical aggregates without PII.
   - Session tokens are stored hashed (SHA-256) in the database. The raw token is only transmitted via HttpOnly cookie.
   - CSRF protection is enforced via double-submit cookie pattern on all state-mutating requests.

5. **RBAC and Authentication:**
   - The canonical RBAC source of truth is `apps/api/app/core/security.py` (`ROLE_PERMISSIONS` dict).
   - All permission enforcement is backend-enforced. Frontend visibility checks (hiding nav links) are UX only, not security.
   - Roles: `RESIDENT`, `BARANGAY_STAFF`, `BARANGAY_ADMIN`, `SYSTEM_MAINTAINER`.
   - `SYSTEM_MAINTAINER` must never be granted access to confidential resident reports or unrestricted admin functions.

---

## 2. Directory Layout

```text
SABTRACK/
├── apps/
│   ├── api/                           # FastAPI Backend (Python 3.13)
│   │   ├── app/
│   │   │   ├── api/v1/endpoints/      # auth.py, health.py, reports.py, schedules.py, announcements.py, gamification.py, analytics.py, users.py
│   │   │   ├── core/                  # config.py, deps.py, errors.py, security.py
│   │   │   └── modules/
│   │   │       ├── areas/             # Phase 1: Configurable geographic areas
│   │   │       ├── identity/          # Phase 2: User, Session, SecurityAuditLog models
│   │   │       ├── reports/           # Phase 3: Community waste reports & status history
│   │   │       ├── schedules/         # Phase 3: Collection schedules & advisories
│   │   │       ├── announcements/     # Phase 3: Official barangay announcements
│   │   │       ├── gamification/      # Phase 4: SAB-Points ledger & participation claims
│   │   │       └── analytics/         # Phase 4: 6-step analytics procedure & hotspots
│   │   ├── alembic/versions/          # 0001 (areas) to 0006 (gamification & points)
│   │   ├── tests/                     # 43 passing Pytest integration tests across all modules
│   │   ├── requirements.txt
│   │   └── .env.example
│   └── web/                           # Next.js 16 / React 19 Frontend
│       ├── src/
│       │   ├── app/                   # App Router: /, /login, /resident/*, /admin/*
│       │   ├── components/            # Header, Footer, ProtectedRoute, ModulePlaceholder, StatusCard
│       │   ├── lib/                   # api-client.ts, auth-context.tsx, utils.ts
│       │   └── types/                 # auth.ts
│       ├── tests/                     # Vitest component test suite
│       ├── package.json
│       └── .env.example
├── docs/                              # Architecture, Decision Log, Setup Guide
├── scripts/                           # Windows development and test runners
│   ├── dev.bat                        # Launch both services
│   ├── run-api.bat / run-web.bat      # Individual service runners
│   ├── run-tests.bat                  # Unified test suite
│   └── seed-users.bat / seed-users.py # Dev-only demo account seeder
├── docker-compose.yml                 # Future containerized deployment
└── README.md
```

---

## 3. Standard Local Execution Commands (Windows)

- **Run Unified Dev Servers:** `.\scripts\dev.bat`
- **Run Backend API:** `.\scripts\run-api.bat`
- **Run Frontend Web:** `.\scripts\run-web.bat`
- **Run All Tests:** `.\scripts\run-tests.bat`
- **Seed Demo Accounts (Dev Only):** `.\scripts\seed-users.bat`
- **Backend Tests:** `cd apps/api && .\.venv\Scripts\python.exe -m pytest tests -v`
- **Frontend Tests:** `cd apps/web && cmd.exe /c npm test`
- **Frontend Build Check:** `cd apps/web && cmd.exe /c npm run build`

---

## 4. Seed Accounts (Development Only)

Run `.\scripts\seed-users.bat` after applying migrations (`alembic upgrade head`) to create 4 demo accounts. These credentials are development-only and must NEVER be used in production:

| Email | Role | Password |
|---|---|---|
| `resident.demo@sabtrack.local` | `RESIDENT` | `SabtrackDevPass2026!` |
| `staff.demo@sabtrack.local` | `BARANGAY_STAFF` | `SabtrackDevPass2026!` |
| `admin.demo@sabtrack.local` | `BARANGAY_ADMIN` | `SabtrackDevPass2026!` |
| `maintainer.demo@sabtrack.local` | `SYSTEM_MAINTAINER` | `SabtrackDevPass2026!` |

Seed data is tagged `is_demo_data=True`. Never ship or expose these credentials in production configuration.
