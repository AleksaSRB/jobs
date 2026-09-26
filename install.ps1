# Windows installation (run via setup.cmd – double-click):
#   1. checks Node.js >= 22.6 (if missing and winget exists -> installs Node.js LTS)
#   2. registers two hidden Scheduled Tasks:
#        PsychJobsScraper - every 15 min: src/scrape.ts (the first pass takes listings from the last `lookbackDays` days)
#        PsychJobsServer  - at logon (and now): src/server.ts on http://localhost:3008
#   3. runs the first pass right away (visible in this window) and opens the UI in the browser
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$IntervalMin = 15
$Port = 3008
try { $cfg = Get-Content (Join-Path $Root 'config.json') -Raw | ConvertFrom-Json; if ($cfg.port) { $Port = $cfg.port }; if ($cfg.intervalMin) { $IntervalMin = $cfg.intervalMin } } catch { }

function Refresh-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
}

function Node-Ok {
  $node = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $node) { return $false }
  $v = (& node.exe --version) -replace '^v', ''
  $parts = $v.Split('.')
  $major = [int]$parts[0]; $minor = [int]$parts[1]
  return ($major -gt 22) -or ($major -eq 22 -and $minor -ge 6)
}

Write-Host '== Psych & Health-Tech Jobs scraper: installation ==' -ForegroundColor Cyan
if (-not (Node-Ok)) {
  Write-Host 'Node.js >= 22.6 was not found.' -ForegroundColor Yellow
  if (Get-Command winget.exe -ErrorAction SilentlyContinue) {
    Write-Host 'Installing Node.js LTS via winget (this can take a few minutes)...'
    & winget.exe install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
    Refresh-Path
  }
  if (-not (Node-Ok)) {
    throw 'Node.js >= 22.6 is still not available. Install it manually from https://nodejs.org (LTS), close this window and run setup.cmd again.'
  }
}
Write-Host ("Node.js {0} OK" -f (& node.exe --version))
if (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) { Write-Host 'Warning: curl.exe is not in PATH (only used as a fallback for Cloudflare-protected sites).' -ForegroundColor Yellow }

New-Item -ItemType Directory -Force (Join-Path $Root 'data') | Out-Null
$Principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

# --- scraper (every 15 min) ---
$Action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('//B "{0}"' -f (Join-Path $Root 'run-hidden.vbs')) -WorkingDirectory $Root
# No -RepetitionDuration = repeats forever (Windows 11 rejects [TimeSpan]::MaxValue)
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes($IntervalMin) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMin)
$Settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 25) -MultipleInstances IgnoreNew `
  -StartWhenAvailable -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName 'PsychJobsScraper' -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Force | Out-Null
Write-Host "Task 'PsychJobsScraper' registered: every $IntervalMin min"

# --- server (at logon + now) ---
$Action2 = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('//B "{0}"' -f (Join-Path $Root 'run-server-hidden.vbs')) -WorkingDirectory $Root
$Trigger2 = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$Settings2 = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew `
  -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName 'PsychJobsServer' -Action $Action2 -Trigger $Trigger2 -Settings $Settings2 -Principal $Principal -Force | Out-Null
Start-ScheduledTask -TaskName 'PsychJobsServer'
Write-Host "Task 'PsychJobsServer' registered (at logon) and started: http://localhost:$Port"

# --- first pass now (visible) ---
Write-Host ''
Write-Host 'First pass: fetching listings from the last 7 days from every source (10-20 min, 20+ sources)...' -ForegroundColor Cyan
& node.exe --experimental-strip-types --disable-warning=ExperimentalWarning (Join-Path $Root 'src\scrape.ts') --force
Write-Host ''
Write-Host "Done. Opening http://localhost:$Port" -ForegroundColor Green
Start-Process "http://localhost:$Port"
Write-Host 'To remove: uninstall.cmd (or .\uninstall.ps1)'
