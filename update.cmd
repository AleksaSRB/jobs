@echo off
rem Double-click = pull the latest version from GitHub (git pull) and restart the server. Data (data/) is untouched.
cd /d "%~dp0"
where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed. Download the ZIP from https://github.com/AleksaSRB/jobs and copy the files over the existing ones ^(keep the data\ folder^).
  pause
  exit /b 1
)
git pull --ff-only
if errorlevel 1 (
  echo git pull failed - see the message above.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Stop-ScheduledTask -TaskName PsychJobsServer -ErrorAction SilentlyContinue; $p=3008; try { $p=(Get-Content '%~dp0config.json' -Raw | ConvertFrom-Json).port } catch {}; Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }; Start-Sleep 1; Start-ScheduledTask -TaskName PsychJobsServer; Write-Host ('Server restarted: http://localhost:' + $p)"
echo.
pause
