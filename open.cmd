@echo off
rem Double-click = start the server (if it is not running) and open http://localhost:3008.
rem After a reboot this is NOT needed: the "PsychJobsServer" task starts at logon and "PsychJobsScraper" keeps
rem checking the sites every 15 min. This is only a fallback if the UI does not open.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p=3008; try { $p=(Get-Content '%~dp0config.json' -Raw | ConvertFrom-Json).port } catch {};" ^
  "$up = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue;" ^
  "if ($up) { Write-Host ('Server already running: http://localhost:' + $p) }" ^
  "elseif (Get-ScheduledTask -TaskName PsychJobsServer -ErrorAction SilentlyContinue) { Start-ScheduledTask -TaskName PsychJobsServer; Write-Host 'Server started via the scheduled task.' }" ^
  "else { Start-Process wscript.exe -ArgumentList ('//B \"' + '%~dp0run-server-hidden.vbs' + '\"'); Write-Host 'Server started (task does not exist - run setup.cmd to install it permanently).' }" ^
  "Start-Sleep 2; Start-Process ('http://localhost:' + $p)"
