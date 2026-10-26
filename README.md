# SABTRACK 3.0

> **A Web-Based Solid Waste Management, Community Reporting, and Analytics System for Barangay Sabang, Lipa City, Batangas**

[![Academic Project](https://img.shields.io/badge/Course-IT_313_System_Analysis_%26_Design-blue.svg)](https://batstate-u.edu.ph/)
[![SDG 11](https://img.shields.io/badge/SDG-11_Sustainable_Cities_%26_Communities-forestgreen.svg)](https://sdgs.un.org/goals/goal11)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.143-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_16-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-336791.svg)](https://www.postgresql.org/)
[![Phase 5 Complete](https://img.shields.io/badge/Phase_5-Complete_%26_Verified_%E2%9C%85-brightgreen.svg)](#phase-status)
[![Tests Passing](https://img.shields.io/badge/Tests-150%2F150_Passed-brightgreen.svg)](#6-running-automated-tests)

---

## 1. Project Background

**SABTRACK** is an academic digital governance initiative developed under **IT 313 (System Analysis and Design)** at **Batangas State University – The National Engineering University, Lipa Campus**. Developed in cooperation with **Barangay Sabang, Lipa City, Batangas**, the platform addresses critical community solid waste management needs:
- Transparent publication of garbage collection schedules, Purok route filters, and direct resident email advisories.
- Verified, photo-based reporting of community waste violations and uncollected garbage with automated EXIF GPS scrubbing.
- Recording verified community participation and waste reduction drives through the **SAB-Points** civic engagement ledger.
- A multi-step **Business Analytics Procedure** for authorized barangay officials to monitor waste patterns, hotspot frequencies, and resolution turnaround times.
- **EcoGabay AI Chatbot:** An intelligent, bilingual (Tagalog/English) waste segregation and upcycling guide equipped with offline knowledge retrieval.
- Modern, people-friendly **minimal green neumorphic design** optimized for desktop, tablet, and mobile browsers.

---

## 2. Approved Academic Topic Form Details

- **Official Approved Topic Title:**  
  *SABTRACK: A Digital Governance Platform for Garbage Collection Scheduling, Community Violation Reporting, and Gamified Waste Management Engagement in Barangay Sabang*
- **Client Agency:** Barangay Sabang (Barangay Council / Local Government Unit), Lipa City, Batangas
- **Proponents:**
  - Jazztin H. Perez
  - Faith A. Valencia
  - May Sigrid M. Dimaano
- **Primary SDG Alignment:** **SDG 11 (Sustainable Cities and Communities)** — Target 11.6

---

## 3. Technology Stack & Architecture

SABTRACK is engineered as a **Modular Monolith** with a decoupled frontend:

```mermaid
flowchart LR
    Resident[Resident / Admin Portal] -->|Next.js 16 App Router / Port 3000| Web[Frontend Web App]
    Web -->|JSON REST API /api/v1 HttpOnly Cookie + CSRF| API[FastAPI Backend / Port 8000]
    Web <-->|WebSockets /ws/sync| API
    API --> DB[(PostgreSQL 16)]
    API --> Store[(Private Object Storage)]
    API --> AI[(EcoGabay Gemini AI / Local Knowledge)]
```

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, minimal green neumorphic design tokens (`#0F5132`, `#198754`, `#f4f8f5`).
- **Backend:** Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, psycopg 3.x, WebSocket connection manager.
- **Database:** PostgreSQL 16 (Primary development and production database).
- **Security:** Argon2id password hashing, server-managed HttpOnly session cookies (SHA-256 tokens), double-submit CSRF tokens, strict 4-role RBAC boundaries.
- **Data Privacy (RA 10173):** Server-side EXIF GPS camera metadata scrubbing on all uploaded violation photos.
- **Testing:** Pytest (Backend API & RBAC tests), Vitest (React component tests).

---

## 4. Phase Status

| Phase | Description | Status | Commit |
|---|---|---|---|
| **Phase 1** | Foundation — FastAPI, PostgreSQL, Next.js, Health Check, Design Tokens | ✅ Complete | `b5831f4` |
| **Phase 2** | Identity, RBAC, Sessions, CSRF, Portal Navigation Shells | ✅ Complete | `098632c` |
| **Phase 3** | Core Waste Operations — Reports, Schedules, Announcements, File Storage, Email Alerts | ✅ Complete | `e523418` |
| **Phase 4** | Gamification & Analytics — SAB-Points Ledger, Participation Claims, Analytics Engine | ✅ Complete | `ec06468` |
| **Phase 5** | Hardening & UI/UX Polish — Minimal Green Redesign, EcoGabay AI Chatbot, 100% Tests, Build Verification | ✅ Complete | `c4e97a8` |

---

## 5. Local Quick Start (Windows)

### Prerequisites
- Python 3.13+ installed
- Node.js v22+ installed
- Git installed
- PostgreSQL 16 (See [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) for Windows installation instructions)

### Setup Steps
```cmd
REM 1. Clone and enter the project
git clone https://github.com/perezjazztin/SABTRACK-3.0.git
cd SABTRACK-3.0

REM 2. Apply database migrations
cd apps\api
.\.venv\Scripts\python.exe -m alembic upgrade head
cd ..\..

REM 3. Seed demo accounts (development only)
.\scripts\seed-users.bat

REM 4. Launch both services
.\scripts\dev.bat
```

### Service URLs
- **Frontend:** http://localhost:3000
- **Backend API:** http://127.0.0.1:8000
- **API Docs (Swagger):** http://127.0.0.1:8000/api/v1/docs
- **Health Check:** http://127.0.0.1:8000/api/v1/health

### Demo Login
Navigate to `http://localhost:3000/login` to sign in as any of the designated roles:

| Role | Email |
|---|---|
| Resident | `resident.demo@sabtrack.local` |
| Barangay Staff | `staff.demo@sabtrack.local` |
| Barangay Admin | `admin.demo@sabtrack.local` |

*(Password: `SabtrackDevPass2026!` — development demo only)*

---

## 6. Running Automated Tests

Run the full automated test suite:
```cmd
.\scripts\run-tests.bat
```

**Current Verified Test Results (Phase 3):**
- ✅ **Backend Pytest:** **71 / 71 passed (100%)** (Auth, RBAC, Schedules, Reports, Storage, Chatbot, Analytics, WebSockets)
- ✅ **Frontend Vitest:** **79 / 79 passed across 20 test files (100%)**
- ✅ **Next.js Production Build:** **Clean (18 routes prerendered, 0 TypeScript errors)**

---

## 7. Project Documentation & Governance

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture, session lifecycle, RBAC matrix, ER diagrams, and analytics procedure.
- [docs/DECISION_LOG.md](docs/DECISION_LOG.md) — Living log of confirmed, proposed, and pending decisions.
- [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) — Step-by-step Windows setup, PostgreSQL configuration, seeding, and demo login runbook.
- [AGENTS.md](AGENTS.md) — Mandatory guidelines and guardrails for AI coding assistants.

---

## 8. Research Ethics & Data Privacy

The project complies with the **Philippine Data Privacy Act of 2012 (RA 10173)**:
- Complainant personal data is minimized and shielded from public access.
- Image uploads are stored in an authenticated non-public directory with EXIF telemetry stripped upon ingestion.
- Demonstration data in development is synthetic (`is_demo_data=True`).
- Session tokens are stored as SHA-256 hashes only; never persisted in plaintext.
- Official field operational rules and zoning boundaries are subject to ongoing barangay validation.
