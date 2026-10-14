@echo off
REM ==============================================================
REM SABTRACK 3.0 — Automated Test Suite Runner (Pytest & Vitest)
REM ==============================================================

echo ==============================================================
echo [1/2] Running Backend Tests (Pytest)...
echo ==============================================================
cd /d "%~dp0\..\apps\api"
.\.venv\Scripts\python.exe -m pytest tests -v
if %errorlevel% neq 0 (
    echo [ERROR] Backend tests failed!
    exit /b %errorlevel%
)

echo.
echo ==============================================================
echo [2/2] Running Frontend Tests (Vitest)...
echo ==============================================================
cd /d "%~dp0\..\apps\web"
cmd.exe /c npm test
if %errorlevel% neq 0 (
    echo [ERROR] Frontend tests failed!
    exit /b %errorlevel%
)

echo.
echo [SUCCESS] All backend and frontend test suites passed!
