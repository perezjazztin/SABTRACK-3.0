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
Run the initial migration to create the configurable areas table:
```cmd
cd apps\api
.\.venv\Scripts\python.exe -m alembic upgrade head
```

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

---

## 6. Docker Support (Future / Grading Deployment)

When Docker Desktop is installed, you can launch the containerized stack:
```cmd
docker-compose up --build
```
This builds and starts the Next.js web client, FastAPI API, and a containerized PostgreSQL 16 database with persistent storage volumes.
