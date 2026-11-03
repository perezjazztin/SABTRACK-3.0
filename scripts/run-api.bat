@echo off
REM ==============================================================
REM SABTRACK 3.0 — FastAPI Backend Local Runner
REM ==============================================================

cd /d "%~dp0\..\apps\api"

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found at apps\api\.venv.
    echo Please create it using: python -m venv .venv
    pause
    exit /b 1
)

REM Ensure local PostgreSQL instance is running on port 5433 if configured
if exist "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" (
    if exist "%USERPROFILE%\sabtrack_pgdata" (
        "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "%USERPROFILE%\sabtrack_pgdata" status >nul 2>&1
        if errorlevel 1 (
            echo [SABTRACK] Starting dedicated PostgreSQL database on port 5433...
            "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "%USERPROFILE%\sabtrack_pgdata" -l "%USERPROFILE%\sabtrack_pgdata\logfile" start
        )
    )
)

echo [SABTRACK] Starting FastAPI backend on http://127.0.0.1:8000 ...
echo [SABTRACK] Interactive OpenAPI documentation: http://127.0.0.1:8000/api/v1/docs
echo [SABTRACK] Health endpoint: http://127.0.0.1:8000/api/v1/health

.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
