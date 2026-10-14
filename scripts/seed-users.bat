@echo off
REM ==============================================================
REM SABTRACK 3.0 — Development Seed Script Runner
REM ==============================================================

cd /d "%~dp0\.."

if not exist "apps\api\.venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found at apps\api\.venv.
    pause
    exit /b 1
)

echo [SABTRACK] Running development seeding...
.\apps\api\.venv\Scripts\python.exe scripts\seed-users.py
pause
