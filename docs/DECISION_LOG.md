# SABTRACK 3.0 — Decision Log & Authorizations

**Project:** SABTRACK 3.0  
**Course:** IT 313 — System Analysis and Design  
**Client:** Barangay Sabang, Lipa City, Batangas  
**Proponents:** Jazztin H. Perez, Faith A. Valencia, May Sigrid M. Dimaano  
**Status:** Phase 5 Hardening & Deployment Complete — All 5 Phases Verified (66/66 Automated Tests Passing)  

---

## 1. Confirmed Decisions (Phase-Gated Approvals)

| ID | Topic | Decision | Authorization / Date |
|---|---|---|---|
| **CONF-01** | **Academic Topic Alignment** | Formal academic title confirmed: *"SABTRACK: A Digital Governance Platform for Garbage Collection Scheduling, Community Violation Reporting, and Gamified Waste Management Engagement in Barangay Sabang"*. Primary SDG: SDG 11 (Target 11.6). | Approved Academic Topic Form, First Semester AY 2026–2027. |
| **CONF-02** | **Primary Database Engine** | PostgreSQL is the primary database for development and production. No SQLite fallback in production. Hermetic in-memory SQLite (`StaticPool`) is used exclusively for unit/integration testing. | Proponent Authorization (October 15, 2026). |
| **CONF-03** | **Architecture Model** | Modular Monolith selected over Microservices. Organized into internal Python modules (`app/modules/*`) sharing a single database. | Proponent Authorization (October 15, 2026). |
| **CONF-04** | **Backend Framework** | FastAPI with Pydantic v2 and SQLAlchemy 2.0. Psycopg 3.x driver for native PostgreSQL performance. | Proponent Authorization (October 15, 2026). |
| **CONF-05** | **Frontend Framework** | Next.js 16 (App Router) with TypeScript, Tailwind CSS, and shadcn/ui design tokens. Decoupled PWA consuming FastAPI REST endpoints. | Proponent Authorization (October 15, 2026). |
| **CONF-06** | **Civic Visual Identity** | Civic Color Palette: Forest Green (`#0F5132`), Fresh Emerald (`#198754`), Slate (`#1E293B`), Light Background (`#F8FAFC`). High-contrast, clean municipal aesthetic. | Proponent Authorization (October 15, 2026). |
| **CONF-07** | **Dynamic Geographies** | Geographic divisions (puroks, zones, collection routes) must remain dynamic and database-driven (`areas` table), not hardcoded in code or schema. | Proponent Authorization (October 15, 2026). |
| **CONF-08** | **Synthetic Data Discipline** | All demonstration, mock, or seeded records must be explicitly tagged (`is_demo_data=True`). Real resident names or real citizen reports must never be fabricated. | Proponent Authorization (October 15, 2026). |
| **CONF-09** | **Phase-Gated Development** | Implementation proceeds strictly phase-by-phase. No phase code generated without prior user authorization. Phase 1 through Phase 5 complete. | Proponent Authorization (October 15, 2026). |
| **CONF-10** | **Session Architecture** | Server-side sessions stored in PostgreSQL `sessions` table. Raw 32-byte token transmitted via HttpOnly cookie; stored as SHA-256 hash. 7-day expiration. | Proponent Authorization, Phase 2 (October 15, 2026). |
| **CONF-11** | **Password Hashing** | Argon2id via `argon2-cffi 25.1`. No bcrypt, MD5, SHA-1, or plaintext password storage. | Proponent Authorization, Phase 2 (October 15, 2026). |
| **CONF-12** | **RBAC Design** | Centralized RBAC via `ROLE_PERMISSIONS` dict in `security.py`. Four roles: `RESIDENT`, `BARANGAY_STAFF`, `BARANGAY_ADMIN`, `SYSTEM_MAINTAINER`. `SYSTEM_MAINTAINER` has least-privilege — no resident data or admin barangay functions. | Proponent Authorization, Phase 2 (October 15, 2026). |
| **CONF-13** | **Public Registration** | Unrestricted public self-registration is NOT permitted in Phase 2. Account creation requires a controlled seeding or future admin-approved onboarding process. | Proponent Authorization, Phase 2 (October 15, 2026). |
| **CONF-14** | **Session Cookie Security** | `SESSION_COOKIE_SECURE=False` for local HTTP dev only. Must be `True` in any HTTPS deployment. `SameSite=Lax` chosen for compatibility with redirect-based flows. | Architectural Decision, Phase 2 (October 15, 2026). |
| **CONF-15** | **Immutable Status History** | Report status changes are never overwritten in-place without generating a corresponding `report_status_history` record capturing timestamps, previous/new status, and reviewer ID. | Proponent Authorization, Phase 3 (October 24, 2026). |
| **CONF-16** | **Schedule & Advisory Engine** | Recurring weekly collection schedules link dynamically to `areas` table; emergency advisories support delay/cancellation notices with effective date filtering. | Proponent Authorization, Phase 3 (October 24, 2026). |
| **CONF-17** | **Official Communications** | Announcements system restricted to staff/admin authors with categories (`GENERAL`, `URGENT`, `EVENT`), pinned flags, and public active filters. | Proponent Authorization, Phase 3 (October 25, 2026). |
| **CONF-18** | **Points Ledger Discipline** | Points are tracked exclusively via an append-only `points_ledger` table (`EARNED`, `REVERSED`, `REDEEMED`). Resident claims require staff verification before points are credited. | Proponent Authorization, Phase 4 (October 25, 2026). |
| **CONF-19** | **Mandated Analytics Procedure** | Enforces 6-step analytics procedure (Collect, Sanitize, Aggregate, Pattern Detection, Visual Indicators, Decision Support). Data is stripped of PII before aggregation per RA 10173. | Course Instructor Directive & Proponent Authorization (October 25, 2026). |
| **CONF-20** | **Admin User Governance** | Admin console provides staff provisioning and user activation toggles; backend enforces safeguards preventing admins from deactivating their own accounts. | Proponent Authorization, Phase 3 (October 25, 2026). |
| **CONF-21** | **Server-Side EXIF Scrubbing** | Evidence photos uploaded by citizens are processed with Pillow to permanently strip all EXIF GPS telemetry, timestamps, and camera metadata prior to disk storage under RA 10173. | Proponent Authorization, Phase 5 (October 25, 2026). |
| **CONF-22** | **Persistent Login Throttling** | Throttling failed authentication attempts is recorded in PostgreSQL `login_throttling` table (5 failed attempts locks account/IP for 15 minutes) persisting across restarts. | Proponent Authorization, Phase 5 (October 25, 2026). |
| **CONF-23** | **Zero-Dependency Team Distribution** | Local disk storage and PostgreSQL chosen over external Redis/S3 so group members (Faith, Jazztin, May Sigrid) can clone from GitHub and run immediately with zero cloud bills or secret leaks. | Proponent Authorization, Phase 5 (October 25, 2026). |

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

### Phase 3 — Core Waste Operations (COMPLETE — commits `8c47b7c`, `d6ec9eb`, `b38e62c`, `864b60f`)

| Component | Status | Details |
|---|---|---|
| **Waste Reporting Module** | **COMPLETE** | Citizen report submission with photo URL, geolocation, category classification; Alembic migration `0003_community_waste_reports`. |
| **Immutable Status History** | **COMPLETE** | `report_status_history` table records status transitions (`SUBMITTED` -> `UNDER_REVIEW` -> `IN_PROGRESS` -> `RESOLVED` / `REJECTED`) with reviewer identity and remarks. |
| **Collection Schedules** | **COMPLETE** | Weekly recurring timetable per purok/area; Alembic migration `0004_collection_schedules`. |
| **Schedule Advisories** | **COMPLETE** | Delay, suspension, and special pickup emergency broadcast notices with effective date filters. |
| **Barangay Announcements** | **COMPLETE** | Official communication feed for general news, events, and urgent advisories; Alembic migration `0005_announcements`. |
| **User Governance** | **COMPLETE** | Admin user directory, staff account provisioning, and deactivation toggles with self-lockout prevention. |
| **Portal Frontends** | **COMPLETE** | Full interactive Next.js pages for reports, schedules, announcements, and user administration. |

### Phase 4 — Gamification, Business Analytics & Dashboards (COMPLETE — commits `8477453`, `864b60f`)

| Component | Status | Details |
|---|---|---|
| **Gamification Module** | **COMPLETE** | Clean-up and segregation initiatives, resident claim submission, staff review queue; Alembic migration `0006_gamification_and_points`. |
| **Points Ledger Discipline** | **COMPLETE** | Double-entry append-only `points_ledger` recording `EARNED`, `REVERSED`, and `REDEEMED` transactions. |
| **6-Step Analytics Engine** | **COMPLETE** | Backend `AnalyticsService` executing: 1. Collect -> 2. Sanitize (RA 10173) -> 3. Aggregate -> 4. Pattern Detection -> 5. Visual Indicators -> 6. Decision Support. |
| **Area Hotspot Grading** | **COMPLETE** | Algorithmic classification of waste hotspots into `NORMAL`, `ELEVATED`, and `CRITICAL` severity tiers. |
| **Executive Dashboards** | **COMPLETE** | Live resident portal overview and comprehensive admin command center with KPI status cards, charts, and alert feeds. |
| **Automated Testing Suite** | **COMPLETE** | 43/43 Pytest integration tests and 9/9 Vitest component tests passing; production build verified across 18 routes. |

### Phase 5 — Production Hardening, Multipart Storage & Deployment Readiness (COMPLETE — commits `3b49b61`, `4b64f87`, `96a768e`, `ca22277`)

| Component | Status | Details |
|---|---|---|
| **Protected Storage Module** | **COMPLETE** | `app/modules/storage` service; Pillow re-encoding strips all EXIF GPS telemetry and camera metadata; UUID filename sanitization; traversal prevention. |
| **Secure Upload API** | **COMPLETE** | `POST /api/v1/uploads` accepting JPEG/PNG/WebP up to 5MB with CSRF validation; `GET /api/v1/uploads/{filename}` authenticated streaming endpoint. |
| **Persistent Rate Limiting** | **COMPLETE** | Alembic migration `0007_login_throttling`; 5-attempt threshold with 15-minute lockout persisted to PostgreSQL across service restarts. |
| **Frontend Image Upload UX** | **COMPLETE** | Next.js `<ImageUpload />` component with camera capture, drag-and-drop, client-side size check (5MB), and authenticated preview in Resident Reports and Points claims. |
| **Docker Compose Orchestration** | **COMPLETE** | Multi-container compose configuration with `api_uploads` volume persistence, automatic database migration startup, and API healthchecks. |
| **Full Automated Verification** | **COMPLETE** | 52/52 Pytest backend tests and 14/14 Vitest frontend tests passing (66/66 total automated tests); clean Next.js 16 build across 18 routes. |

---

## 3. Field Validation Register (Operational & Policy Refinements)

| ID | Area | Open Question | Current Working Assumption | Owner |
|---|---|---|---|---|
| **VAL-01** | **Scheduling** | Who officially establishes and updates collection schedules? Is it Lipa City CENRO, a private contractor, or the Barangay Council? | Barangay Kagawad on Environment publishes the advisory schedule. | Proponents / Field Team |
| **VAL-02** | **Collection Unit** | What is the geographic unit for collection? (Purok 1–N, named streets, or arterial routes?) | Configurable `areas` table seeded with demo zones. | Field Team |
| **VAL-03** | **Actual Pickups** | Does Barangay Sabang monitor or verify actual truck collection completion, or only schedule publishing? | Only schedule publishing and delay notices are active; actual collection event tracking is unverified. | Field Team |
| **VAL-04** | **Report Verification** | Who processes submitted reports at Barangay Hall? (Barangay Secretary, Environmental Officer, or Tanod?) | Generic "Barangay Reviewer" role until titles are validated. | Field Team |
| **VAL-05** | **Anonymity & Privacy** | Are anonymous violation reports permitted? What is the official evidence retention and privacy disclosure under RA 10173? | Submissions require an authenticated resident account; complainant identity is shielded; EXIF telemetry is stripped upon upload. | Proponents |
| **VAL-06** | **SAB-Points Rules** | Does an official barangay incentive or redemption program exist, or is SAB-Points purely an academic demonstration? | Points ledger is tracked academically; real-world prize fulfillment is explicitly out of scope. | Proponents |
| **VAL-07** | **Analytics Utility** | Which specific indicators would Barangay Officials actually look at during regular sessions? | Weekly report volume, uncollected waste hotspots, and median resolution times. | Proponents / Field Team |
| **VAL-08** | **Resident Onboarding** | How are resident accounts created and verified? (Self-registration, barangay-issued credentials, or national ID linkage?) | Not yet determined; unrestricted self-registration is deferred per Phase 2 authorization. | Proponents / Client |
| **VAL-09** | **Account Deletion** | What is the RA 10173 compliant procedure for resident account deletion and data erasure? | Not yet determined; must be resolved before public deployment. | Proponents / Legal |
