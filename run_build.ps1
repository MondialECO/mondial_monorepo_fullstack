<# Phase 8 verification — production build.
   Stops the dev server on :3000 first to avoid .next file contention,
   then runs `npm run build`, teeing to build.log with the exit code. #>
$root = $PSScriptRoot
Set-Location $root
$log = Join-Path $root 'build.log'
if (Test-Path $log) { Remove-Item $log -Force }

Write-Host "Stopping any dev server on :3000 ..."
try {
  $pids = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue).OwningProcess | Sort-Object -Unique
  foreach ($processId in $pids) { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue; Write-Host "  Stopped PID $processId" }
} catch {}

Write-Host "Running npm run build ..."
npm run build 2>&1 | Tee-Object -FilePath $log
"EXITCODE=$LASTEXITCODE" | Tee-Object -FilePath $log -Append
Write-Host "Done. Exit=$LASTEXITCODE"
