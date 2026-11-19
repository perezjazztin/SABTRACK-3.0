@echo off
REM ==============================================================
REM SABTRACK 3.0 — Database Migration and Seeding Runner
REM ==============================================================

cd /d "%~dp0\..\apps\api"

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found at apps\api\.venv.
    pause
    exit /b 1
)

echo [SABTRACK] Running Alembic migrations to upgrade schema to head...
.\.venv\Scripts\python.exe -m alembic upgrade head
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Alembic migrations failed.
    echo Please verify that PostgreSQL is running and DATABASE_URL in apps\api\.env is correct.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [SABTRACK] Seeding demo user accounts...
cd /d "%~dp0\.."
.\apps\api\.venv\Scripts\python.exe scripts\seed-users.py

echo.
echo ==============================================================
echo [SUCCESS] Database initialized, migrated, and seeded!
echo ==============================================================
pause
