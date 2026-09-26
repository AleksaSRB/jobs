@echo off
rem Double-click = install (checks Node.js, registers the two scheduled tasks, runs the first pass, opens the UI).
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
echo.
pause
