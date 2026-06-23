@echo off
REM Wrapper so the verification run can be launched with a double-click.
REM Invokes the PowerShell runner which kills :5093, checks local Mongo,
REM and starts the backend on the LocalVerify profile (local isolated DB),
REM teeing output to backend_verify.log.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_local_verify.ps1"
