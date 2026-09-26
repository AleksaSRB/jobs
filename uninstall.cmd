@echo off
rem Double-click = removes the scheduled tasks and stops the server (data stays).
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"
echo.
pause
