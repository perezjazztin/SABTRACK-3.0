@echo off
REM ==============================================================
REM SABTRACK 3.0 — Next.js Frontend Local Runner
REM Bypasses PowerShell script execution restrictions via cmd
REM ==============================================================

cd /d "%~dp0\..\apps\web"

echo [SABTRACK] Starting Next.js frontend on http://localhost:3000 ...
cmd.exe /c npm run dev
