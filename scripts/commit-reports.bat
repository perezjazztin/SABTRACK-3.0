@echo off
cd /d "%~dp0\.."
git add .
git commit -m "feat(reports): implement end-to-end community waste reporting with immutable status history"
