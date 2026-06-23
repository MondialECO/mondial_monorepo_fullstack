<# Phase 8 verification — run ESLint, tee to lint.log, append exit code. #>
$root = $PSScriptRoot
Set-Location $root
$log = Join-Path $root 'lint.log'
if (Test-Path $log) { Remove-Item $log -Force }
Write-Host "Running npm run lint ..."
npm run lint 2>&1 | Tee-Object -FilePath $log
"EXITCODE=$LASTEXITCODE" | Tee-Object -FilePath $log -Append
Write-Host "Done. Exit=$LASTEXITCODE"
