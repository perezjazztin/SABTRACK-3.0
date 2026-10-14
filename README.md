# SABTRACK 3.0

> **A Web-Based Solid Waste Management, Community Reporting, and Analytics System for Barangay Sabang, Lipa City, Batangas**

[![Academic Project](https://img.shields.io/badge/Course-IT_313_System_Analysis_%26_Design-blue.svg)](https://batstate-u.edu.ph/)
[![SDG 11](https://img.shields.io/badge/SDG-11_Sustainable_Cities_%26_Communities-forestgreen.svg)](https://sdgs.un.org/goals/goal11)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.143-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_16-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-336791.svg)](https://www.postgresql.org/)

---

## 1. Project Background

**SABTRACK** is an academic digital governance initiative developed under **IT 313 (System Analysis and Design)** at **Batangas State University – The National Engineering University, Lipa Campus**. Developed in cooperation with **Barangay Sabang, Lipa City, Batangas**, the platform addresses critical community solid waste management needs:
- Transparent publication of garbage collection schedules and change advisories.
- Verified, photo-based reporting of community waste violations and uncollected garbage.
- Recording verified community participation through the **SAB-Points** civic engagement ledger.
- A multi-step **Business Analytics Procedure** for authorized officials to monitor waste patterns and resolution turnaround times.
- Bounded, privacy-preserving AI decision support for administrative summary briefings.

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
    Resident[Resident / Admin Portal] -->|Next.js 16 App Router / Port 3000| Web[Frontend PWA]
    Web -->|JSON REST API /api/v1 (HttpOnly)| API[FastAPI Backend / Port 8000]
    API --> DB[(PostgreSQL 16)]
    API --> Store[(Private Object Storage)]
```

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui tokens.
- **Backend:** Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, psycopg 3.x.
- **Database:** PostgreSQL 16 (Primary development and production database).
- **Testing:** Pytest (Backend API tests), Vitest (React component tests).

---

## 4. Local Quick Start (Windows)

### Prerequisites
- Python 3.13+ installed
- Node.js v22+ installed
- Git installed
- PostgreSQL 16 (See [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) for Windows installation instructions)

### Launching Development Environment
Launch both the backend and frontend simultaneously with:
```cmd
.\scripts\dev.bat
```

Or run services individually:
- **FastAPI Backend:** `.\scripts\run-api.bat` $\rightarrow$ http://127.0.0.1:8000
  - Interactive API Docs: http://127.0.0.1:8000/api/v1/docs
  - Health Check: http://127.0.0.1:8000/api/v1/health
- **Next.js Frontend:** `.\scripts\run-web.bat` $\rightarrow$ http://localhost:3000

---

## 5. Running Automated Tests

Run the full automated test suite:
```cmd
.\scripts\run-tests.bat
```

- **Backend tests:** `cd apps/api && .\.venv\Scripts\python.exe -m pytest tests -v`
- **Frontend tests:** `cd apps/web && cmd.exe /c npm test`
- **Frontend build:** `cd apps/web && cmd.exe /c npm run build`

---

## 6. Project Documentation & Governance

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture, module boundaries, data rules, and analytics procedure.
- [docs/DECISION_LOG.md](docs/DECISION_LOG.md) — Living log of confirmed, proposed, and pending decisions.
- [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) — Step-by-step Windows setup and PostgreSQL configuration runbook.
- [AGENTS.md](AGENTS.md) — Mandatory guidelines and guardrails for AI coding assistants.

---

## 7. Research Ethics & Data Privacy

The project complies with the **Philippine Data Privacy Act of 2012 (RA 10173)**:
- Complainant personal data is minimized and shielded from public access.
- Image uploads are stored in an authenticated non-public directory with EXIF telemetry stripped.
- Demonstration data in development is synthetic (`is_demo_data=True`).
- Official field operational rules and zoning boundaries are subject to ongoing barangay validation.
