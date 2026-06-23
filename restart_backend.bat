@echo off
REM One-click clean restart of the Mondial dev monorepo (frontend + backend).
REM Kills whatever is LISTENING on :5093 (backend) and :3000 (frontend) so the
REM recompiled backend can bind, then relaunches `npm run dev-monorepo`.
setlocal EnableDelayedExpansion

echo ============================================================
echo  Mondial - clean restart
echo ============================================================

echo [1/3] Stopping backend (:5093) and frontend (:3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5093" ^| findstr "LISTENING"') do (
    echo     killing PID %%a on :5093
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo     killing PID %%a on :3000
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Waiting for ports to free...
timeout /t 5 /nobreak >nul

echo [3/3] Verifying ports are free...
netstat -ano | findstr ":5093" | findstr "LISTENING"
if %errorlevel%==0 (
    echo     WARNING: :5093 still has a listener. Close it manually, then re-run this file.
    pause
    exit /b 1
)

echo Starting dev-monorepo ^(this rebuilds the backend - first compile is slower^)...
cd /d "%~dp0"
call npm run dev-monorepo
