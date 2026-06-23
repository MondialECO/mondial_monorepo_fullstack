<#
  Investor Runtime Environment Repair
  ------------------------------------
  Fixes the "stale binary on :5093 + un-dropped DB" deployment so the
  runtime-stabilization source fixes actually run.

  WHY THE LAST DEPLOY FAILED:
    The old backend process kept running and held a lock on WebApp.dll, so
    `dotnet build` could not overwrite it (the new binary was never produced),
    and because the DB was never dropped, the seeder skipped on startup.
    Correct order is: STOP every backend process FIRST, THEN build, THEN drop
    the DB, THEN start exactly one instance so the seeder runs on an empty DB.

  HOW TO RUN (from this folder):
    powershell -ExecutionPolicy Bypass -File .\repair_runtime.ps1
  (or right-click the file -> Run with PowerShell)

  It logs everything to .\runtime_repair_log.txt
#>

$ErrorActionPreference = 'Stop'
$root      = $PSScriptRoot
$backend   = Join-Path $root 'backend'
$csproj    = Join-Path $backend 'WebApp.csproj'
$dll       = Join-Path $backend 'bin\Debug\net8.0\WebApp.dll'
$port      = 5093
$log       = Join-Path $root 'runtime_repair_log.txt'
$srvlog    = Join-Path $root 'backend_runtime.log'
"" | Out-File $log
function Say($m){ $line = "[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $m; Write-Host $line; Add-Content $log $line }

Say "=== STEP 1-2: Identify process on :$port and any other backend processes ==="
try {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($conns) {
    foreach ($c in $conns) {
      $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
      Say ("  :$port held by PID {0} ({1}) path={2} start={3}" -f $p.Id, $p.ProcessName, $p.Path, $p.StartTime)
    }
  } else { Say "  Nothing currently listening on :$port" }
} catch { Say "  (could not query :$port: $($_.Exception.Message))" }

# All WebApp / dotnet-run-of-this-project processes (handles the 'multiple processes' case)
$webApps = Get-CimInstance Win32_Process -Filter "Name='dotnet.exe' OR Name='WebApp.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -match 'WebApp' -or $_.CommandLine -match [regex]::Escape($backend) }
if ($webApps) { foreach ($w in $webApps) { Say ("  backend process PID {0}: {1}" -f $w.ProcessId, $w.CommandLine) } }
else { Say "  No dotnet/WebApp backend processes matched by command line." }

Say "=== STEP 3: Stop every old backend process ==="
$toKill = @()
if ($conns) { $toKill += $conns.OwningProcess }
if ($webApps) { $toKill += $webApps.ProcessId }
$toKill = $toKill | Sort-Object -Unique
if ($toKill) {
  foreach ($pid in $toKill) {
    try { Stop-Process -Id $pid -Force -ErrorAction Stop; Say "  Stopped PID $pid" }
    catch { Say "  Could not stop PID $pid: $($_.Exception.Message)" }
  }
  Start-Sleep -Seconds 2
} else { Say "  Nothing to stop." }

# Confirm the DLL is no longer locked
$stillListening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($stillListening) { Say "  WARNING: something STILL listening on :$port — aborting before build."; throw "Port $port still in use." }
Say "  :$port is now free."

Say "=== STEP 4-6: Build from current source; verify success + new timestamp ==="
$before = (Test-Path $dll) ? (Get-Item $dll).LastWriteTime : $null
Say "  WebApp.dll LastWriteTime BEFORE: $before"
Push-Location $backend
& dotnet build $csproj -c Debug --nologo 2>&1 | Tee-Object -FilePath $log -Append | Out-Null
$buildExit = $LASTEXITCODE
Pop-Location
if ($buildExit -ne 0) { Say "  BUILD FAILED (exit $buildExit). See log above. ABORTING."; throw "Build failed." }
$after = (Get-Item $dll).LastWriteTime
Say "  BUILD SUCCEEDED. WebApp.dll LastWriteTime AFTER: $after"
if ($before -and $after -le $before) { Say "  WARNING: timestamp did not advance — binary may not have been rewritten." }

Say "=== STEP 7-8: Resolve the runtime MongoDB connection + database ==="
$envName = if ($env:ASPNETCORE_ENVIRONMENT) { $env:ASPNETCORE_ENVIRONMENT } else { 'Development' }
$env:ASPNETCORE_ENVIRONMENT = 'Development'   # force the seeding env
$cfgFile = Join-Path $backend 'appsettings.Development.json'
$cfg = Get-Content $cfgFile -Raw | ConvertFrom-Json
$connStr = $cfg.MongoDbSettings.ConnectionString
$dbName  = $cfg.MongoDbSettings.DatabaseName
if ($env:MongoDbSettings__ConnectionString) { $connStr = $env:MongoDbSettings__ConnectionString; Say "  (overridden by env var)" }
if ($env:MongoDbSettings__DatabaseName)     { $dbName  = $env:MongoDbSettings__DatabaseName }
Say "  Runtime env       : Development (seeding enabled)"
Say "  Connection string : $connStr"
Say "  Database          : $dbName"

Say "=== STEP 9: Drop the development database ==="
$mongosh = Get-Command mongosh -ErrorAction SilentlyContinue
if ($mongosh) {
  & mongosh $connStr --quiet --eval "db.getSiblingDB('$dbName').dropDatabase()" 2>&1 | Tee-Object -FilePath $log -Append | Out-Null
  Say "  Dropped '$dbName' via mongosh."
} else {
  $mongo = Get-Command mongo -ErrorAction SilentlyContinue
  if ($mongo) { & mongo $connStr --quiet --eval "db.getSiblingDB('$dbName').dropDatabase()" 2>&1 | Tee-Object -FilePath $log -Append | Out-Null; Say "  Dropped '$dbName' via legacy mongo." }
  else { Say "  ERROR: neither mongosh nor mongo found on PATH. Drop '$dbName' manually, then re-run from STEP 10."; throw "No mongo client." }
}

Say "=== STEP 10-11: Start ONE backend instance and capture seed logs ==="
if (Test-Path $srvlog) { Remove-Item $srvlog -Force }
$proc = Start-Process dotnet -ArgumentList "run --project `"$backend`" -c Debug --no-build" `
  -WorkingDirectory $root -PassThru -RedirectStandardOutput $srvlog -RedirectStandardError "$srvlog.err"
Say "  Launched backend PID $($proc.Id); waiting for :$port to come up..."
$up = $false
for ($i=0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 2
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { $up = $true; break }
  if ($proc.HasExited) { Say "  Backend exited early (code $($proc.ExitCode)). Check $srvlog"; break }
}
if ($up) { Say "  Backend is listening on :$port (PID $($proc.Id))." } else { Say "  Backend did NOT come up in time — inspect $srvlog" }

Start-Sleep -Seconds 3
Say "=== Seed-log check (looking for grant + deal seeding) ==="
if (Test-Path $srvlog) {
  $seedLines = Select-String -Path $srvlog -Pattern 'Seed','NDA acceptance','data-room grant','DealExecution','Demo seeding' -SimpleMatch -ErrorAction SilentlyContinue
  if ($seedLines) { $seedLines | ForEach-Object { Say ("  LOG: " + $_.Line.Trim()) } }
  else { Say "  No seed lines found yet (server may still be starting). Tail $srvlog manually." }
}

Say "=== DONE. Repair log: $log  | Server log: $srvlog ==="
Say "Next: confirm in browser/API that /api/deals contains companyName and NovaPay preMoneyValuation=6800000."
