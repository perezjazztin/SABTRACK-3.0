@echo off
REM ==============================================================
REM SABTRACK 3.0 — Unified Local Development Runner
REM Launches both backend and frontend servers in separate windows
REM ==============================================================

echo [SABTRACK 3.0] Launching development environment...

start "SABTRACK Backend (FastAPI)" cmd /k "%~dp0run-api.bat"
start "SABTRACK Frontend (Next.js)" cmd /k "%~dp0run-web.bat"

echo.
echo ==============================================================
echo Development services launched:
echo   - Backend:  http://127.0.0.1:8000 (Docs: /api/v1/docs)
echo   - Frontend: http://localhost:3000
echo ==============================================================
