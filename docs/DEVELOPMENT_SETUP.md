# SABTRACK 3.0 — Local Development Setup & Windows Runbook

This guide provides instructions for setting up and running the SABTRACK 3.0 development environment on Windows.

---

## 1. System Requirements & Verified Environment

The following baseline tools are verified on the developer workstation:
- **Operating System:** Windows 10/11
- **Python:** `3.13.x` (64-bit)
- **Node.js:** `v22.x` (LTS)
- **Git:** `2.51.x`
- **Database:** PostgreSQL 16 (Required primary database)

---

## 2. PostgreSQL Windows Installation & Configuration

Because PostgreSQL is our primary database from Phase 1 onward and is not yet installed on this machine, follow these instructions:

### Step 2.1: Install PostgreSQL 16 on Windows

#### Option A (Automated via Windows Package Manager - Recommended):
Open PowerShell (as Administrator) and run:
```powershell
winget install PostgreSQL.PostgreSQL.16
```

#### Option B (Official Graphical Installer):
1. Download the PostgreSQL 16 installer from [EnterpriseDB Official PostgreSQL Downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
2. Run the installer with default settings.
3. During setup, set the password for the default `postgres` user (e.g. `postgres` or note your custom password).
4. Keep the default port `5432`.

### Step 2.2: Verify PostgreSQL Windows Service
Verify that the PostgreSQL service is active:
```powershell
Get-Service *postgres*
```
If stopped, start it:
```powershell
Start-Service postgresql-x64-16
```

### Step 2.3: Create the Dedicated Development Database
Open PowerShell or Command Prompt and create the development database:
```cmd
createdb -U postgres sabtrack_dev
```
*(Or in `psql -U postgres`: `CREATE DATABASE sabtrack_dev;`)*

### Step 2.4: Configure Environment Variables
In `apps/api/.env`, ensure your connection string matches your password:
```env
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/sabtrack_dev
```

### Step 2.5: Apply Alembic Migrations
Run all migrations to set up the full schema (areas + identity):
```cmd
cd apps\api
.\.venv\Scripts\python.exe -m alembic upgrade head
```
This applies:
- `0001_initial_areas.py` — Configurable barangay areas table
- `0002_identity_and_sessions.py` — Users, sessions, security audit logs

### Step 2.6: Seed Development Demo Accounts
After migrations, create the 4 demo role accounts:
```cmd
.\scripts\seed-users.bat
```
See **Section 7** for demo account details and security warnings.

---

## 3. PowerShell npm Execution Policy Handling

On Windows, PowerShell may block `npm.ps1` with the error:
`File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.`

### Safe Non-Invasive Solution
**Do not change machine-wide execution policies.** Our project provides:
1. Pre-configured batch runners in the `scripts/` folder (`run-web.bat`, `run-tests.bat`, `dev.bat`) which invoke `cmd.exe /c npm ...` seamlessly.
2. Direct CLI invocation from PowerShell:
   ```powershell
   cmd.exe /c npm run dev
   cmd.exe /c npm test
   ```

---

## 4. Running the Development Services

### Unified Start (Recommended)
Double-click or run from terminal:
```cmd
.\scripts\dev.bat
```
This opens two terminal windows:
- **Backend API:** `http://127.0.0.1:8000` (Docs: `http://127.0.0.1:8000/api/v1/docs`)
- **Frontend Web:** `http://localhost:3000`

### Individual Manual Runners
#### To run the FastAPI backend:
```cmd
.\scripts\run-api.bat
```
*(or manually: `cd apps\api && .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload`)*

#### To run the Next.js frontend:
```cmd
.\scripts\run-web.bat
```
*(or manually: `cd apps\web && cmd.exe /c npm run dev`)*

---

## 5. Running Automated Tests

Run the unified test runner:
```cmd
.\scripts\run-tests.bat
```

Or test each service independently:
- **Backend (Pytest):**
  ```cmd
  cd apps\api
  .\.venv\Scripts\python.exe -m pytest tests -v
  ```
- **Frontend (Vitest):**
  ```cmd
  cd apps\web
  cmd.exe /c npm test
  ```
- **Frontend Build Verification:**
  ```cmd
  cd apps\web
  cmd.exe /c npm run build
  ```

### Phase 2 Test Coverage

| Test Suite | File | Tests | Status |
|---|---|---|---|
| Backend Health | `tests/test_health.py` | 3 | ✅ Passing |
| Backend Auth & RBAC | `tests/test_auth_rbac.py` | 11 | ✅ Passing |
| Frontend Components | `tests/HealthDashboard.test.tsx` | 2 | ✅ Passing |
| **Total** | | **16** | **✅ All Pass** |

---

## 6. Phase 2 Login & Authentication Testing

Once both services are running and the database is seeded:

1. Open `http://localhost:3000`
2. Click **Sign In** or navigate to `http://localhost:3000/login`
3. Use the **Evaluation Demo Accounts** panel to pre-fill credentials for any role
4. After login, you are redirected to the **Resident Portal** (if `RESIDENT`) or can navigate to `/admin` (if `BARANGAY_STAFF` or `BARANGAY_ADMIN`)

**Manual RBAC verification via API docs:**  
Navigate to `http://127.0.0.1:8000/api/v1/docs` and test:
- `POST /api/v1/auth/login` — authenticates and sets cookies
- `GET /api/v1/auth/me` — returns session profile
- `GET /api/v1/resident/my-reports` — requires `RESIDENT` role
- `GET /api/v1/admin/reports-queue` — requires `BARANGAY_STAFF` or higher
- `GET /api/v1/system/diagnostics` — requires `SYSTEM_MAINTAINER` only

---

## 7. Demo Seed Accounts (Development Only)

Run `.\scripts\seed-users.bat` to create the following accounts. **These are development-only. Never use these credentials in production.**

| Email | Role | Password |
|---|---|---|
| `resident.demo@sabtrack.local` | `RESIDENT` | `SabtrackDevPass2026!` |
| `staff.demo@sabtrack.local` | `BARANGAY_STAFF` | `SabtrackDevPass2026!` |
| `admin.demo@sabtrack.local` | `BARANGAY_ADMIN` | `SabtrackDevPass2026!` |
| `maintainer.demo@sabtrack.local` | `SYSTEM_MAINTAINER` | `SabtrackDevPass2026!` |

> **Security Warning:** The seed script uses `is_demo_data=True` to flag synthetic records. Re-running the seeder is idempotent — existing demo accounts are skipped. These credentials are committed in documentation as they are fictional development fixtures. Production credentials must never appear in version-controlled files.

---

## 8. Environment Variables Reference

### `apps/api/.env` (Backend)

```env
# Database
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/sabtrack_dev

# Application
SECRET_KEY=your_strong_random_secret_key_here
ENVIRONMENT=development
LOG_LEVEL=INFO

# CORS
CORS_ORIGINS=http://localhost:3000

# Session Cookies
SESSION_COOKIE_NAME=sabtrack_session
SESSION_COOKIE_SECURE=False       # Set to True in production (HTTPS only)
SESSION_COOKIE_SAMESITE=lax
SESSION_EXPIRE_SECONDS=604800     # 7 days

# CSRF
CSRF_COOKIE_NAME=sabtrack_csrf

# Rate Limiting
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_MINUTES=15
```

### `apps/web/.env.local` (Frontend)

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 9. Docker Support (Future / Grading Deployment)

When Docker Desktop is installed, you can launch the containerized stack:
```cmd
docker-compose up --build
```
This builds and starts the Next.js web client, FastAPI API, and a containerized PostgreSQL 16 database with persistent storage volumes.
