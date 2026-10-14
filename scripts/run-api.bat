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

echo [SABTRACK] Starting FastAPI backend on http://127.0.0.1:8000 ...
echo [SABTRACK] Interactive OpenAPI documentation: http://127.0.0.1:8000/api/v1/docs
echo [SABTRACK] Health endpoint: http://127.0.0.1:8000/api/v1/health

.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
