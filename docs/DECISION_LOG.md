# SABTRACK 3.0 — Decision Log

**Project:** IT 313 — System Analysis and Design, Batangas State University - The NEU  
**Client:** Barangay Sabang, Lipa City, Batangas  
**Proponents:** Jazztin H. Perez, Faith A. Valencia, May Sigrid M. Dimaano  
**Date:** October 15, 2026  
**Status:** Living Architectural and Requirements Decision Register  

---

## 1. Confirmed Decisions (Officially Approved by Proponents & Faculty)

| ID | Category | Decision | Rationale / Source |
|---|---|---|---|
| **CONF-01** | **Academic Scope** | Core deliverables consist of a web-based Progressive Web App (PWA) with a **Resident Portal** and **Administrative Dashboard**. | Approved IT 313 Topic Form. |
| **CONF-02** | **Core Modules** | The system must support digital garbage collection scheduling/announcements, waste violation/uncollected waste reporting with photos and geotags, and verified community participation (SAB-Points). | Approved IT 313 Topic Form. |
| **CONF-03** | **Analytics** | The project must include a formalized, multi-step **Business Analytics Procedure** that aggregates operational records into indicators and recurring-pattern insights. | Explicit directive from Course Instructor. |
| **CONF-04** | **AI Governance** | AI integration is strictly **optional and decision-support only**; it will never autonomously verify reports, penalize residents, or assign points. | Academic guardrails & Instructor guidance. |
| **CONF-05** | **Official Title** | The official academic topic title remains: *"SABTRACK: A Digital Governance Platform for Garbage Collection Scheduling, Community Violation Reporting, and Gamified Waste Management Engagement in Barangay Sabang"*. Any permanent title change requires formal written instructor reapproval. | Course Topic Approval Policy. |
| **CONF-06** | **Target Area** | The system exclusively covers **Barangay Sabang, Lipa City**. Multi-barangay administration is not supported. | Approved Project Scope. |
| **CONF-07** | **Database Strategy** | **PostgreSQL as Primary Database from Day 1.** SQLite is NOT used as an automatic fallback without explicit approval. Exception: `sqlite:///:memory:` in Pytest only for hermetic test isolation. | Proponent Authorization (October 15, 2026). |
| **CONF-08** | **Project Workspace** | Permanent repository location established at `C:\Users\jazzt\Projects\SABTRACK`. | Proponent Authorization (October 15, 2026). |
| **CONF-09** | **Geographic Schema** | No hardcoded purok count or names (e.g. not assuming exactly 7 puroks). Geographic divisions are stored in a configurable `areas` table; test data is explicitly tagged with `is_demo_data=True`. | Proponent Authorization (October 15, 2026). |
| **CONF-10** | **Execution Policy** | Local Windows PowerShell script execution policy handled via non-invasive batch scripts and `cmd.exe /c npm ...` without modifying machine-wide settings. | Proponent Authorization (October 15, 2026). |
| **CONF-11** | **Authentication Architecture** | Server-managed opaque session tokens with HttpOnly cookies, Argon2id password hashing, double-submit CSRF protection. No localStorage/sessionStorage tokens. | Proponent Authorization, Phase 2 (October 15, 2026). |
| **CONF-12** | **RBAC Design** | Centralized RBAC via `ROLE_PERMISSIONS` dict in `security.py`. Four roles: `RESIDENT`, `BARANGAY_STAFF`, `BARANGAY_ADMIN`, `SYSTEM_MAINTAINER`. `SYSTEM_MAINTAINER` has least-privilege — no resident data or admin barangay functions. | Proponent Authorization, Phase 2 (October 15, 2026). |
| **CONF-13** | **Public Registration** | Unrestricted public self-registration is NOT permitted in Phase 2. Account creation requires a controlled seeding or future admin-approved onboarding process. | Proponent Authorization, Phase 2 (October 15, 2026). |
| **CONF-14** | **Session Cookie Security** | `SESSION_COOKIE_SECURE=False` for local HTTP dev only. Must be `True` in any HTTPS deployment. `SameSite=Lax` chosen for compatibility with redirect-based flows. | Architectural Decision, Phase 2 (October 15, 2026). |

---

## 2. Phase Implementation Status

### Phase 1 — Foundation (COMPLETE — commit `b5831f4`)

| Component | Status | Details |
|---|---|---|
| **FastAPI Backend** | **COMPLETE** | Modular monolith with `/api/v1/health`, structured logging, centralized error handlers, CORS, and Pydantic v2 settings. |
| **PostgreSQL Integration** | **CONFIGURED** | SQLAlchemy 2.0 with modern `psycopg 3.x` driver; Alembic migration `0001_initial_areas` created. Local Windows installation runbook documented. |
| **Next.js Frontend** | **COMPLETE** | Next.js 16 (App Router), TypeScript, Tailwind CSS with civic palette (Forest `#0F5132`, Emerald `#198754`, Slate `#1E293B`), responsive layout, and centralized API client. |
| **Diagnostics Dashboard** | **COMPLETE** | Real-time live probe testing Next.js ↔ FastAPI ↔ PostgreSQL connectivity with actionable diagnostic guides. |
| **Automated Testing** | **COMPLETE** | Pytest (3/3 passing) for backend; Vitest (2/2 passing) for frontend components; Next.js production build verified. |
| **Docker Configuration** | **PREPARED** | `docker-compose.yml` and Dockerfiles generated for future deployment. |

### Phase 2 — Identity, RBAC, Sessions, Portal Navigation (COMPLETE — commit `098632c`)

| Component | Status | Details |
|---|---|---|
| **Identity Module** | **COMPLETE** | `User`, `Session`, `SecurityAuditLog` SQLAlchemy models; Alembic migration `0002_identity_and_sessions`. |
| **Password Hashing** | **COMPLETE** | Argon2id via `argon2-cffi 25.1`. No bcrypt, no MD5, no plaintext. |
| **Session Management** | **COMPLETE** | Opaque 32-byte token; stored as SHA-256 hash in DB; transmitted only via HttpOnly cookie. 7-day expiry. |
| **CSRF Protection** | **COMPLETE** | Double-submit cookie pattern; `X-CSRF-Token` header verified on POST/PUT/PATCH/DELETE. |
| **Auth Endpoints** | **COMPLETE** | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` with audit logging and rate limiting. |
| **Rate Limiting** | **COMPLETE** | 5 failed attempts / 15-minute lockout per IP. In-memory; acceptable for academic scope. |
| **RBAC Dependency System** | **COMPLETE** | `require_permission()` and `require_role()` FastAPI dependency factories. |
| **Protected Demo Endpoints** | **COMPLETE** | 5 endpoints for RBAC verification: resident, staff, admin, and maintainer access levels. |
| **Frontend AuthProvider** | **COMPLETE** | React context with `useAuth()` hook; session hydration on load; `hasPermission()`, `hasRole()`. |
| **ProtectedRoute Component** | **COMPLETE** | Auth guard with distinct 401 (unauthenticated), 403 role, and 403 permission states. |
| **Login Page** | **COMPLETE** | Form with dev role-switcher presets for RBAC demonstration. |
| **Resident Portal Shell** | **COMPLETE** | 6 navigation pages; all placeholders except `/resident/profile` (live user data). |
| **Admin Portal Shell** | **COMPLETE** | 7 navigation pages with role-aware lock indicators; all placeholders. |
| **Dev Seeding Script** | **COMPLETE** | `scripts/seed-users.py` + `seed-users.bat`; 4 demo accounts tagged `is_demo_data=True`. |
| **Test Coverage** | **COMPLETE** | 14/14 Pytest (11 auth/RBAC + 3 health) + 2/2 Vitest; `npm run build` clean. |

### Phase 3 — Core Waste Operations (PENDING APPROVAL)

Proposed scope (subject to proponent authorization):
- Resident waste violation / uncollected garbage report submission with photo attachment
- Barangay staff report review, status transitions, and audit trail
- Garbage collection schedule management and change advisory publishing
- Announcement system for residents
- User management for authorized admins
- File upload handling with EXIF stripping

---

## 3. Pending Field Validation (Before Committing Phase 3 Domain Schemas)

| ID | Area | Open Question | Current Working Assumption | Owner |
|---|---|---|---|---|
| **VAL-01** | **Scheduling** | Who officially establishes and updates collection schedules? Is it Lipa City CENRO, a private contractor, or the Barangay Council? | Barangay Kagawad on Environment publishes the advisory schedule. | Proponents / Field Team |
| **VAL-02** | **Collection Unit** | What is the geographic unit for collection? (Purok 1–N, named streets, or arterial routes?) | Configurable `areas` table seeded with demo zones. | Field Team |
| **VAL-03** | **Actual Pickups** | Does Barangay Sabang monitor or verify actual truck collection completion, or only schedule publishing? | Only schedule publishing and delay notices are active; actual collection event tracking is unverified. | Field Team |
| **VAL-04** | **Report Verification** | Who processes submitted reports at Barangay Hall? (Barangay Secretary, Environmental Officer, or Tanod?) | Generic "Barangay Reviewer" role until titles are validated. | Field Team |
| **VAL-05** | **Anonymity & Privacy** | Are anonymous violation reports permitted? What is the official evidence retention and privacy disclosure under RA 10173? | Submissions require an authenticated resident account; complainant identity is shielded from public view. | Proponents |
| **VAL-06** | **SAB-Points Rules** | Does an official barangay incentive or redemption program exist, or is SAB-Points purely an academic demonstration? | Points ledger is tracked academically; real-world prize fulfillment is explicitly out of scope. | Proponents |
| **VAL-07** | **Analytics Utility** | Which specific indicators would Barangay Officials actually look at during regular sessions? | Weekly report volume, uncollected waste hotspots, and median resolution times. | Proponents / Field Team |
| **VAL-08** | **Resident Onboarding** | How are resident accounts created and verified? (Self-registration, barangay-issued credentials, or national ID linkage?) | Not yet determined; unrestricted self-registration is deferred per Phase 2 authorization. | Proponents / Client |
| **VAL-09** | **Account Deletion** | What is the RA 10173 compliant procedure for resident account deletion and data erasure? | Not yet determined; must be resolved before public deployment. | Proponents / Legal |

---

## 4. Known Technical Limitations (Phase 2)

| ID | Limitation | Impact | Resolution Path |
|---|---|---|---|
| **LIM-01** | In-memory login rate limiter resets on server restart | Rate limit bypass possible if server is restarted during lockout | Replace with Redis or DB-backed limiter before production |
| **LIM-02** | `SESSION_COOKIE_SECURE=False` in development | Session cookie transmitted over HTTP (safe for localhost only) | Must set `True` in production `.env` behind HTTPS |
| **LIM-03** | No account deactivation for expired demo accounts | Demo seeding must be re-run idempotently | Add `is_active` toggle UI in Phase 3 user management |
| **LIM-04** | No multi-device session management UI | Users cannot see or revoke other active sessions | Future enhancement |

---

## 5. Explicitly Out of Scope (Non-Goals)

| ID | Item | Why Excluded |
|---|---|---|
| **OOS-01** | **Physical Truck GPS Tracking** | Requires specialized in-vehicle IoT hardware, continuous telemetry, and hauler cooperation beyond student scope. |
| **OOS-02** | **Physical Waste Operations** | Software cannot manage physical garbage trucks, landfills, or sorting equipment. |
| **OOS-03** | **Financial Transactions & Prize Procurement** | System does not handle cash, e-wallets, inventory purchasing, or logistics fulfillment for rewards. |
| **OOS-04** | **Autonomous AI Actions** | AI will not penalize residents, auto-resolve cases, or independently issue points. |
| **OOS-05** | **Multi-Barangay / City-Wide Scope** | Confined strictly to Barangay Sabang to maintain feasibility and high local fidelity. |
| **OOS-06** | **Custom Deep Learning / Model Training** | Unnecessary resource sink; pretrained or API-based adapters with aggregate data fulfill academic objectives safely. |
| **OOS-07** | **Public Self-Registration (Phase 2)** | Deferred pending resolution of resident identity verification requirements with the barangay. |
