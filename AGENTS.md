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
   - Work in Phase 1 (Foundation) is complete. Phase 2 (Identity & RBAC) requires approval before implementation.

3. **Database Rules:**
   - PostgreSQL is the mandatory primary development and production database.
   - Do NOT introduce SQLite fallbacks without explicit user approval.
   - Schema modifications must be performed via Alembic migrations (`apps/api/alembic/versions`).
   - Geographic structures must remain dynamic (`areas` table), not hardcoded to fixed counts or names.

4. **Security & Data Privacy (RA 10173):**
   - Never log passwords, tokens, or PII.
   - Image attachments must be stored in authenticated non-public storage.
   - Strip EXIF GPS telemetry upon ingestion.
   - AI features must be decision-support only, receiving pre-computed numerical aggregates without PII.

---

## 2. Directory Layout

```text
SABTRACK/
├── apps/
│   ├── api/                           # FastAPI Backend (Python 3.13)
│   │   ├── app/                       # Application modules, core, and routers
│   │   ├── alembic/                   # PostgreSQL schema migrations
│   │   ├── tests/                     # Pytest suite
│   │   ├── requirements.txt
│   │   └── .env.example
│   └── web/                           # Next.js 16 / React 19 Frontend
│       ├── src/                       # App Router, components, lib, types
│       ├── tests/                     # Vitest component test suite
│       ├── package.json
│       └── .env.example
├── docs/                              # Architecture, Decision Log, Setup Guide
├── scripts/                           # Windows development and test runners
├── docker-compose.yml                 # Future containerized deployment
└── README.md
```

---

## 3. Standard Local Execution Commands (Windows)

- **Run Unified Dev Servers:** `.\scripts\dev.bat`
- **Run Backend API:** `.\scripts\run-api.bat`
- **Run Frontend Web:** `.\scripts\run-web.bat`
- **Run All Tests:** `.\scripts\run-tests.bat`
- **Backend Tests:** `cd apps/api && .\.venv\Scripts\python.exe -m pytest tests -v`
- **Frontend Tests:** `cd apps/web && cmd.exe /c npm test`
- **Frontend Build Check:** `cd apps/web && cmd.exe /c npm run build`
