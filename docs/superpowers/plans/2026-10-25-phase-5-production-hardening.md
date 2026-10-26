# Phase 5: Production Hardening, Multipart Storage, and Deployment Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 5 production hardening for SABTRACK 3.0: server-side EXIF-stripped image uploads in authenticated storage (RA 10173), persistent database rate-limiting in PostgreSQL, environment-driven security configuration, frontend file upload UX, and containerized deployment readiness.

**Architecture:** A modular storage service using `Pillow` to sanitize and strip EXIF telemetry before storing images on disk under `apps/api/storage/uploads/`; authenticated streaming endpoints protected by session cookies; database-persisted authentication throttling via Alembic migration `0007_login_throttling`; accessible drag-and-drop/camera image picker in Next.js; and hardened production configuration.

**Tech Stack:** FastAPI 0.143, Python 3.13, Pillow, python-multipart, SQLAlchemy 2.0, Alembic, PostgreSQL 16, Next.js 16, React 19, Tailwind CSS.

**Spec:** [`docs/superpowers/specs/2026-10-25-phase-5-production-hardening-design.md`](file:///C:/Users/faith/OneDrive/Documents/SABTRACK_OFFICIAL/SABTRACK-3.0/docs/superpowers/specs/2026-10-25-phase-5-production-hardening-design.md)

## Global Constraints
- Target environment: Python 3.13 / FastAPI backend with Next.js 16 App Router frontend.
- Zero external cloud dependencies (no AWS, S3, MinIO, or Redis) — 100% self-contained PostgreSQL and local disk.
- Hermetic test isolation: all Pytest tests must pass in-memory with SQLite (`StaticPool`) without Docker or network dependencies.
- RA 10173 Data Privacy: zero EXIF GPS tags or camera hardware metadata retained on stored images.
- Unauthenticated access to citizen photos must be strictly rejected (`401 Unauthorized`).
- Directory traversal attacks must be safely rejected (`400 Bad Request`).

## Review Focus
1. An uploaded JPEG containing GPS EXIF coordinates must be stripped completely upon storage.
2. A non-image file (e.g. `.exe` disguised as `.jpg`) must be rejected with HTTP 400.
3. An unauthenticated request to `GET /api/v1/uploads/{filename}` must return HTTP 401.
4. Path traversal attempts (e.g. `GET /api/v1/uploads/../../etc/passwd`) must return HTTP 400.
5. Five consecutive failed logins must trigger an HTTP 429 response backed by the database table across server restarts.

---

### Task 1: Dependencies, Upload Directory Scaffolding & Configuration Hardening

**Files:**
- Modify: `apps/api/requirements.txt`
- Modify: `apps/api/app/core/config.py`
- Modify: `apps/api/app/main.py`
- Modify: `.gitignore`
- Create: `apps/api/storage/uploads/.gitkeep`

**Interfaces:**
- Consumes: `Settings` in `app/core/config.py`
- Produces: `settings.STORAGE_UPLOAD_DIR: Path`, `settings.SESSION_COOKIE_SECURE: bool` (dynamic)

- [ ] **Step 1: Update `apps/api/requirements.txt` to include `pillow` and `python-multipart`**
- [ ] **Step 2: Update `apps/api/app/core/config.py` to define `STORAGE_UPLOAD_DIR` and dynamic `SESSION_COOKIE_SECURE`**
- [ ] **Step 3: Update `apps/api/app/main.py` startup event to ensure `STORAGE_UPLOAD_DIR` directory exists**
- [ ] **Step 4: Update `.gitignore` and create `.gitkeep` in `apps/api/storage/uploads/`**
- [ ] **Step 5: Verify Python virtual environment has dependencies installed (`pip install -r requirements.txt`)**
- [ ] **Step 6: Commit Task 1 changes**

---

### Task 2: Storage Service & Secure File Upload Endpoints

**Files:**
- Create: `apps/api/app/modules/storage/__init__.py`
- Create: `apps/api/app/modules/storage/service.py`
- Create: `apps/api/app/api/v1/endpoints/uploads.py`
- Modify: `apps/api/app/api/v1/api.py`
- Create: `apps/api/tests/test_storage_uploads.py`

**Interfaces:**
- Consumes: `get_current_active_user` from `app.core.deps`, `settings` from `app.core.config`
- Produces: 
  - `POST /api/v1/uploads` -> `{ "file_url": str, "filename": str }`
  - `GET /api/v1/uploads/{filename}` -> `FileResponse`

- [ ] **Step 1: Write failing test in `apps/api/tests/test_storage_uploads.py` for upload, EXIF stripping, traversal defense, and auth requirement**
- [ ] **Step 2: Run test to verify it fails (`pytest tests/test_storage_uploads.py -v`)**
- [ ] **Step 3: Implement `StorageService` in `apps/api/app/modules/storage/service.py` with Pillow EXIF scrubbing and UUID filename assignment**
- [ ] **Step 4: Implement `uploads.py` router with `POST /uploads` and `GET /uploads/{filename}`**
- [ ] **Step 5: Register router in `apps/api/app/api/v1/api.py`**
- [ ] **Step 6: Run tests to verify all tests pass (`pytest tests/test_storage_uploads.py -v`)**
- [ ] **Step 7: Commit Task 2 changes**

---

### Task 3: Persistent Login Rate Limiting (`login_throttling`)

**Files:**
- Modify: `apps/api/app/modules/identity/models.py`
- Create: `apps/api/alembic/versions/0007_login_throttling.py`
- Modify: `apps/api/app/api/v1/endpoints/auth.py`
- Create: `apps/api/tests/test_persistent_rate_limit.py`

**Interfaces:**
- Consumes: `db: Session` dependency, `User` model
- Produces: `LoginThrottling` model, database-backed `_check_rate_limit` and `_record_login_failure`

- [ ] **Step 1: Add `LoginThrottling` model to `apps/api/app/modules/identity/models.py`**
- [ ] **Step 2: Generate Alembic migration `0007_login_throttling.py`**
- [ ] **Step 3: Write failing integration test in `apps/api/tests/test_persistent_rate_limit.py`**
- [ ] **Step 4: Run test to verify failure (`pytest tests/test_persistent_rate_limit.py -v`)**
- [ ] **Step 5: Update `apps/api/app/api/v1/endpoints/auth.py` to use `LoginThrottling` model instead of memory dict**
- [ ] **Step 6: Run tests to verify they pass (`pytest tests/test_persistent_rate_limit.py -v`)**
- [ ] **Step 7: Commit Task 3 changes**

---

### Task 4: Frontend Image Upload Component & Portal Integration

**Files:**
- Create: `apps/web/src/components/ImageUpload.tsx`
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `apps/web/src/app/resident/reports/page.tsx`
- Modify: `apps/web/src/app/resident/points/page.tsx`
- Modify: `apps/web/src/app/admin/reports/page.tsx`
- Create: `apps/web/tests/ImageUpload.test.tsx`

**Interfaces:**
- Consumes: `uploadEvidencePhoto(file: File): Promise<{ file_url: string; filename: string }>` in `api-client.ts`
- Produces: `<ImageUpload onUploaded={(url) => ...} />` component with camera capture, file drag-and-drop, and preview

- [ ] **Step 1: Add `uploadImage` helper to `apps/web/src/lib/api-client.ts`**
- [ ] **Step 2: Create `ImageUpload.tsx` component with drag-and-drop, client-size check, and preview thumbnail**
- [ ] **Step 3: Write Vitest component test in `apps/web/tests/ImageUpload.test.tsx`**
- [ ] **Step 4: Run Vitest tests (`npm test`)**
- [ ] **Step 5: Integrate `ImageUpload` in `/resident/reports` and `/resident/points`**
- [ ] **Step 6: Verify image rendering in admin report triage console (`/admin/reports`)**
- [ ] **Step 7: Commit Task 4 changes**

---

### Task 5: Docker Orchestration, Comprehensive Verification & Documentation

**Files:**
- Modify: `docker-compose.yml`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DECISION_LOG.md`
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Update `docker-compose.yml` to ensure storage volume persistence and startup migrations**
- [ ] **Step 2: Execute full backend test suite (`pytest tests -v`)**
- [ ] **Step 3: Execute full frontend test suite (`npm test`)**
- [ ] **Step 4: Execute production Next.js build (`npm run build`)**
- [ ] **Step 5: Update documentation (`ARCHITECTURE.md`, `DECISION_LOG.md`, `README.md`, `AGENTS.md`) marking Phase 5 complete**
- [ ] **Step 6: Final commit for Phase 5 completion**
