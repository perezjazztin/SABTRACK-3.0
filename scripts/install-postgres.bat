@echo off
REM ==============================================================
REM SABTRACK 3.0 — Automated PostgreSQL 16 Windows Installer
REM Launches the pre-downloaded EnterpriseDB installer with elevation
REM ==============================================================

set INSTALLER="C:\Users\jazzt\AppData\Local\Temp\WinGet\PostgreSQL.PostgreSQL.16.16.15-5\postgresql-16.15-5-windows-x64.exe"

if not exist %INSTALLER% (
    echo [ERROR] Pre-downloaded installer not found.
    echo Running winget download...
    winget download PostgreSQL.PostgreSQL.16 --accept-source-agreements --accept-package-agreements
)

echo [SABTRACK] Launching PostgreSQL 16 unattended installer...
echo [SABTRACK] A Windows UAC prompt will appear. Please click 'Yes' to authorize.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%INSTALLER%' -ArgumentList '--mode unattended --unattendedmodeui minimal --superpassword postgres --serverport 5432' -Verb RunAs -Wait"

echo.
echo [SABTRACK] Checking if PostgreSQL service is running...
powershell -NoProfile -Command "Get-Service *postgres*"

echo.
echo [SABTRACK] Creating sabtrack_dev database...
set PGPASSWORD=postgres
if exist "C:\Program Files\PostgreSQL\16\bin\createdb.exe" (
    "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres -h localhost -p 5432 sabtrack_dev
    echo [SABTRACK] Database 'sabtrack_dev' ready.
) else (
    echo [NOTE] Please verify PostgreSQL installation path.
)

echo.
echo [SABTRACK] Applying Alembic migrations...
cd /d "%~dp0\..\apps\api"
.\.venv\Scripts\python.exe -m alembic upgrade head

echo.
echo [SABTRACK] Seeding demo accounts...
cd /d "%~dp0"
call seed-users.bat

echo.
echo ==============================================================
echo [SUCCESS] PostgreSQL 16 and SABTRACK database are fully ready!
echo Refresh http://localhost:3000 to see live PostgreSQL status.
echo ==============================================================
pause
