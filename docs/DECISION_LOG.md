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
| **CONF-07** | **Database Strategy** | **PostgreSQL as Primary Database from Day 1.** SQLite is NOT used as an automatic fallback without explicit approval. | Proponent Authorization (October 15, 2026). |
| **CONF-08** | **Project Workspace** | Permanent repository location established at `C:\Users\jazzt\Projects\SABTRACK`. | Proponent Authorization (October 15, 2026). |
| **CONF-09** | **Geographic Schema** | No hardcoded purok count or names (e.g. not assuming exactly 7 puroks). Geographic divisions are stored in a configurable `areas` table; test data is explicitly tagged with `is_demo_data=True`. | Proponent Authorization (October 15, 2026). |
| **CONF-10** | **Execution Policy** | Local Windows PowerShell script execution policy handled via non-invasive batch scripts and `cmd.exe /c npm ...` without modifying machine-wide settings. | Proponent Authorization (October 15, 2026). |

---

## 2. Phase 1 Implementation Status

| Component | Status | Details |
|---|---|---|
| **FastAPI Backend** | **COMPLETE** | Modular monolith with `/api/v1/health`, structured logging, centralized error handlers, CORS, and Pydantic v2 settings. |
| **PostgreSQL Integration** | **CONFIGURED** | SQLAlchemy 2.0 with modern `psycopg 3.x` driver; Alembic migration `0001_initial_areas` created. Local Windows installation runbook documented. |
| **Next.js Frontend** | **COMPLETE** | Next.js 16 (App Router), TypeScript, Tailwind CSS with civic palette (Forest `#0F5132`, Emerald `#198754`, Slate `#1E293B`), responsive layout, and centralized API client. |
| **Diagnostics Dashboard** | **COMPLETE** | Real-time live probe testing Next.js ↔ FastAPI ↔ PostgreSQL connectivity with actionable diagnostic guides. |
| **Automated Testing** | **COMPLETE** | Pytest (3/3 passing) for backend; Vitest (2/2 passing) for frontend components; Next.js production build verified. |
| **Docker Configuration** | **PREPARED** | `docker-compose.yml` and Dockerfiles generated for future deployment. |

---

## 3. Pending Field Validation (Before Committing Phase 2 & 3 Domain Schemas)

| ID | Area | Open Question | Current Working Assumption | Owner |
|---|---|---|---|---|
| **VAL-01** | **Scheduling** | Who officially establishes and updates collection schedules? Is it Lipa City CENRO, a private contractor, or the Barangay Council? | Barangay Kagawad on Environment publishes the advisory schedule. | Proponents / Field Team |
| **VAL-02** | **Collection Unit** | What is the geographic unit for collection? (Purok 1–N, named streets, or arterial routes?) | Configurable `areas` table seeded with demo zones. | Field Team |
| **VAL-03** | **Actual Pickups** | Does Barangay Sabang monitor or verify actual truck collection completion, or only schedule publishing? | Only schedule publishing and delay notices are active; actual collection event tracking is unverified. | Field Team |
| **VAL-04** | **Report Verification** | Who processes submitted reports at Barangay Hall? (Barangay Secretary, Environmental Officer, or Tanod?) | Generic "Barangay Reviewer" role until titles are validated. | Field Team |
| **VAL-05** | **Anonymity & Privacy** | Are anonymous violation reports permitted? What is the official evidence retention and privacy disclosure under RA 10173? | Submissions require an authenticated resident account; complainant identity is shielded from public view. | Proponents |
| **VAL-06** | **SAB-Points Rules** | Does an official barangay incentive or redemption program exist, or is SAB-Points purely an academic demonstration? | Points ledger is tracked academically; real-world prize fulfillment is explicitly out of scope. | Proponents |
| **VAL-07** | **Analytics Utility** | Which specific indicators would Barangay Officials actually look at during regular sessions? | Weekly report volume, uncollected waste hotspots, and median resolution times. | Proponents / Field Team |

---

## 4. Explicitly Out of Scope (Non-Goals)

| ID | Item | Why Excluded |
|---|---|---|
| **OOS-01** | **Physical Truck GPS Tracking** | Requires specialized in-vehicle IoT hardware, continuous telemetry, and hauler cooperation beyond student scope. |
| **OOS-02** | **Physical Waste Operations** | Software cannot manage physical garbage trucks, landfills, or sorting equipment. |
| **OOS-03** | **Financial Transactions & Prize Procurement** | System does not handle cash, e-wallets, inventory purchasing, or logistics fulfillment for rewards. |
| **OOS-04** | **Autonomous AI Actions** | AI will not penalize residents, auto-resolve cases, or independently issue points. |
| **OOS-05** | **Multi-Barangay / City-Wide Scope** | Confined strictly to Barangay Sabang to maintain feasibility and high local fidelity. |
| **OOS-06** | **Custom Deep Learning / Model Training** | Unnecessary resource sink; pretrained or API-based adapters with aggregate data fulfill academic objectives safely. |
