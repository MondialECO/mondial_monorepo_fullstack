<#
  Investor Verification — frontend dev server runner.

  Kills anything already on :3000, then starts the Next.js dev server from the
  project root, teeing output to .\frontend_dev.log so compile errors are
  captured. Leave the window open (the server keeps running).

  Run from the project root:
    powershell -ExecutionPolicy Bypass -File .\run_frontend.ps1
#>
$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
$log  = Join-Path $root 'frontend_dev.log'

Write-Host "=== Stopping any process already on :3000 ===" -ForegroundColor Cyan
try {
  $pids = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue).OwningProcess | Sort-Object -Unique
  foreach ($processId in $pids) { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue; Write-Host "  Stopped PID $processId" }
} catch {}

Write-Host "=== Starting Next.js dev server (npm run dev) ===" -ForegroundColor Cyan
Write-Host "  Logging to $log  (leave this window open; Ctrl+C to stop)" -ForegroundColor Cyan
Set-Location $root
npm run dev 2>&1 | Tee-Object -FilePath $log
