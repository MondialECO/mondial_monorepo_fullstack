<#
  Investor Verification — deterministic local environment runner.

  Forces the backend onto LOCAL Mongo (mongodb://localhost:27017) and an
  ISOLATED database (MondialEcoInvestorVerify) via the LocalVerify launch
  profile, whose environment variables override the Atlas user-secret.

  Prerequisite: a local MongoDB must be running on localhost:27017.
    (Check: Get-Service MongoDB  -> Status Running ; or run mongod yourself.)

  Run from the project root:
    powershell -ExecutionPolicy Bypass -File .\run_local_verify.ps1

  It tees all startup output to .\backend_verify.log so the seed result is
  captured. Leave the window open (the server keeps running). The log should
  show "Seeded ... NDA acceptance(s) + data-room grant(s)" — NOT "already
  populated".
#>
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$log  = Join-Path $root 'backend_verify.log'

Write-Host "=== Pre-flight: is local Mongo up on :27017? ===" -ForegroundColor Cyan
$mongoUp = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($mongoUp) { Write-Host "  localhost:27017 is reachable." -ForegroundColor Green }
else {
  Write-Host "  WARNING: nothing is listening on localhost:27017." -ForegroundColor Yellow
  Write-Host "  Start MongoDB first (e.g. 'net start MongoDB' or run mongod), then re-run this script." -ForegroundColor Yellow
}

Write-Host "=== Stopping any backend already on :5093 ===" -ForegroundColor Cyan
try {
  $pids = (Get-NetTCPConnection -LocalPort 5093 -State Listen -ErrorAction SilentlyContinue).OwningProcess | Sort-Object -Unique
  foreach ($processId in $pids) { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue; Write-Host "  Stopped PID $processId" }
} catch {}

Write-Host "=== Launching backend with LocalVerify profile (local Mongo, DB=MondialEcoInvestorVerify) ===" -ForegroundColor Cyan
Write-Host "  Logging to $log  (leave this window open; Ctrl+C to stop the server)" -ForegroundColor Cyan
Set-Location (Join-Path $root 'backend')
dotnet run --launch-profile LocalVerify 2>&1 | Tee-Object -FilePath $log
