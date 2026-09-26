# Removes the Scheduled Tasks "PsychJobsScraper" and "PsychJobsServer" and stops the server process (the one listening on the port from config.json).
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Port = 3008
try { $Port = (Get-Content (Join-Path $Root 'config.json') -Raw | ConvertFrom-Json).port } catch { }
foreach ($TaskName in 'PsychJobsScraper', 'PsychJobsServer') {
  if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Task '$TaskName' removed."
  } else {
    Write-Host "Task '$TaskName' does not exist."
  }
}
# By port, not by command line: the other scrapers have the same command line (src\server.ts) and must not be touched.
Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force; Write-Host "Server process $_ (port $Port) stopped." }
Write-Host 'Data (data/db.json - favorites, statuses) was left untouched.'
