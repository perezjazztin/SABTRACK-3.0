# SABTRACK 3.0 — Architecture & System Design Document

**Course:** IT 313 — System Analysis and Design  
**Client / Community:** Barangay Sabang, Lipa City, Batangas  
**Proponents:** Jazztin H. Perez, Faith A. Valencia, May Sigrid M. Dimaano  
**Status:** Phase 1 Foundation Active  

---

## 1. System Overview

SABTRACK 3.0 is a web-based solid waste management and community engagement platform designed for Barangay Sabang, Lipa City. It consists of a decoupled frontend Progressive Web App (Next.js) and a modular monolith backend (FastAPI) backed by PostgreSQL.

```mermaid
flowchart TB
    User[Resident / Barangay Official] -->|HTTPS / Port 3000| Web[Next.js 15 PWA Frontend]
    Web -->|JSON REST API /api/v1 (HttpOnly Cookie)| API[FastAPI Modular Monolith / Port 8000]
    
    subgraph Core_Backend[FastAPI Application Modules]
        Auth[Identity & RBAC]
        Schedules[Collection Schedules & Alerts]
        Reports[Community Reporting Queue]
        Points[SAB-Points Immutable Ledger]
        Analytics[SQL Analytics Engine]
        Audit[Security & Audit Logs]
    end

    API --> Core_Backend
    Core_Backend --> DB[(PostgreSQL 16 Database)]
    Core_Backend --> Storage[(Authenticated File Storage)]
    Analytics -. Curated Numerical Aggregates .-> AI[Optional AI Insight Adapter]
```

---

## 2. Core Architectural Principles

1. **Modular Monolith over Microservices:**  
   Organized as cohesive internal Python packages (`app/modules/*`) sharing a single relational database. This preserves transactional integrity (ACID) and avoids distributed transaction failure modes for a three-person engineering team.

2. **Backend as the Authority:**  
   The FastAPI backend enforces all access control (RBAC), state transitions, validation, and point calculations. The frontend is strictly a presentation and interaction layer.

3. **Dynamic & Configurable Geographies:**  
   No hardcoded puroks or fixed geographic assumptions. The `areas` schema dynamically represents administrative divisions, collection routes, or puroks as validated by Barangay Sabang. Synthetic demonstration records are explicitly tagged (`is_demo_data=True`).

4. **Immutable State & Ledger Discipline:**  
   - Report status changes are never overwritten in-place; each transition is logged in `report_status_history`.
   - Points are tracked through an append-only `point_ledger` (`EARNED`, `REVERSED`, `REDEEMED`).

---

## 3. Technology Stack Reference

| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | `16.4.x` / React `19.3.x` | Component architecture, responsive PWA shell |
| **Frontend Styling** | Tailwind CSS + shadcn tokens | `3.4.x` | Accessible civic UI primitives |
| **Frontend Testing** | Vitest + Testing Library | `3.0.x` | Unit & component behavior verification |
| **Backend Framework** | FastAPI | `0.143.x` | Typed REST API with OpenAPI autogeneration |
| **Data Validation** | Pydantic v2 | `2.14.x` | Server-side request/response contracts |
| **ORM** | SQLAlchemy 2.0 | `2.1.x` | Typed relational mapping and queries |
| **Migrations** | Alembic | `1.20.x` | Version-controlled database migrations |
| **Database Driver** | Psycopg 3.x | `3.3.x` | Native high-performance PostgreSQL driver |
| **Database** | PostgreSQL | `16.x` | Primary relational store |
| **Backend Testing** | Pytest | `9.1.x` | API integration & unit testing |

---

## 4. Security & Privacy Baseline (RA 10173)

- **Authentication:** Server-managed `HttpOnly`, `SameSite=Lax` cookies with anti-CSRF token verification on state mutations.
- **Upload Isolation:** Evidence photos and attachments are stored in an authenticated directory, never exposed as public static files.
- **Metadata Sanitization:** Image EXIF metadata (GPS, device serials) is stripped upon upload.
- **Least Privilege RBAC:** Roles distinguish `RESIDENT`, `BARANGAY_STAFF`, `BARANGAY_ADMIN`, and `SYSTEM_MAINTAINER`.

---

## 5. Formal Business Analytics Procedure

The system implements the 6-step analytics procedure mandated by the course instructor:

$$\text{Operational Records} \xrightarrow{\text{1. Collect}} \text{Sanitization} \xrightarrow{\text{2. Clean}} \text{SQL Aggregation} \xrightarrow{\text{3. Aggregate}} \text{Pattern Detection} \xrightarrow{\text{4. Detect}} \text{Visual Indicators} \xrightarrow{\text{5. Visualize}} \text{Decision Support}$$

- **AI Safeguard:** The optional AI layer receives **only** pre-calculated numerical aggregates. No raw complaints, resident names, or photos are sent to external AI providers.
