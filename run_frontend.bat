@echo off
REM Wrapper so the frontend dev server can be launched with a double-click.
REM Kills :3000, then starts `npm run dev`, teeing output to frontend_dev.log.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_frontend.ps1"
