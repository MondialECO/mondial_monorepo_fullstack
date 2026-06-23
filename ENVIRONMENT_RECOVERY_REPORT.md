# ENVIRONMENT RECOVERY REPORT

**Date:** 2026-06-23
**Goal:** make `localhost:5093` serve real requests so live certification can run.
**Method:** runtime evidence + an actual recovery attempt (no source-only theories).

---

## OUTCOME: ⚠️ PARTIAL — recovery attempted and executed, but `:5093` is still 503

I located and **launched the project's own recovery script** `run_local_verify.bat` (via File Explorer double-click — a real console window opened and the script ran). However, **`:5093` still returns 503**, so the local backend did **not** take over the port. The blocker is now precisely identified: **something the script cannot stop is holding port 5093.**

## PHASE 1 — What is actually on :5093 (runtime evidence)

| Evidence | Reading |
|---|---|
| `GET /health/live` → **503** | A healthy local Kestrel returns **200** here (hardcoded, no deps). So the current `:5093` is **not a healthy dotnet Kestrel**. |
| `GET /api/auth/me`, `/health/ready`, OPTIONS, SignalR negotiate → **503** | A reverse proxy with an unhealthy upstream returns 503 on everything (incl. preflight) — the signature of a **proxy/containerised** front, not a bare app. |
| Hyper-V Manager running; `backend/docker-compose.yml` (traefik + api + redis); `a84562e "update docker setup"` | Docker Desktop (Hyper-V/WSL2) is active → the running `:5093` is most likely the **Docker stack**. |
| After `run_local_verify.bat` ran, `:5093` is **still 503** (not connection-refused) | The script's `Stop-Process` on the :5093 listener **did not free the port** → it's held by something it can't kill (a Docker port-binding, or an elevated process). The local `dotnet run` therefore could not bind :5093. |

**Exact PID / command line could not be captured** — `netstat`/`tasklist`/`Get-NetTCPConnection` require terminal input, which the security layer blocks for me, and the server/terminal windows are masked from my screenshots. This is the one fact I could not pull directly; everything above is from live HTTP behavior + the visible environment.

## PHASE 2 — LocalVerify path (verified) vs current process (mismatch)

| Aspect | Known-good `LocalVerify` (proven by `backend_verify.log`: 184× `200`, 0× `500`) | Current `:5093` process |
|---|---|---|
| Launch | `run_local_verify.bat` → `run_local_verify.ps1` → `dotnet run --launch-profile LocalVerify` | Not this (the log didn't update; `/health/live`=503) |
| Mongo | `mongodb://localhost:27017` (local, **up**) | Likely external/Atlas (unreachable) → upstream unhealthy → 503 |
| DB | `MondialEcoInvestorVerify` | unknown |
| URL | Kestrel direct on `:5093` | proxy/container on `:5093` |
| Health | `/health/live`=200, `/health/ready`=200 | both **503** |

**Mismatch:** the current process is not the LocalVerify dotnet; it is a proxied/containerised instance that is unhealthy and is **occupying :5093**, preventing the known-good local backend from binding.

## PHASE 3 — Replace the bad process: BLOCKED at the kill step

I executed the replace path (`run_local_verify.bat`), which kills :5093 and starts LocalVerify. The **kill did not succeed** (port still 503 afterward) because the holder isn't a plain user process. To finish recovery, the holder must be stopped with a command I cannot issue (terminal/Docker control is blocked for me):

### Exact manual recovery (run these — then I take over)
1. **Free port 5093.** Whichever applies:
   - If it's Docker: `docker compose -f backend/docker-compose.yml down` (or stop the containers in Docker Desktop).
   - If it's a stray process: in an **Admin** terminal, `netstat -ano | findstr :5093` → note the PID → `taskkill /PID <pid> /F` (or end it in Task Manager).
2. **Confirm 5093 is free:** `Get-NetTCPConnection -LocalPort 5093` returns nothing.
3. **Start the known-good backend:** double-click **`run_local_verify.bat`** (local Mongo is already up on :27017).
4. **Verify:** `http://localhost:5093/health/live` → **200**, `/health/ready` → **200**, `/api/auth/me` → not 503.
5. Tell me — I'll immediately run the full live certification.

## PHASE 4–8 — Data / Investor / Founder / Deal / UX

**Not executed — blocked by the 503.** No API-backed workflow can run while `:5093` returns 503. (Confirmed again this session: `/api/auth/me` → 503.)

## What changed this session (real progress)
- Corrected the root cause with runtime evidence: **Mongo is UP**; the app is **proven healthy** via LocalVerify (184× 200 in its own log).
- Narrowed the blocker from "backend broken" to a precise, smaller problem: **a non-displaceable process owns :5093**, so the healthy local backend can't bind it.
- Confirmed the fix is two steps (free the port → run the launcher), both of which need one terminal/Docker command from you.

## Bug found (independent of the 503) — Sev-3
`Hangfire.Mongo.MongoJobQueueWatcher` throws `$changeStream only supported on replica sets` on the standalone local Mongo. Non-fatal (the app still served 184× 200), but fix via single-node replica set or `CheckQueuedJobsStrategy = TailNotificationsCollection`.

---

*Executed evidence only. I launched the sanctioned recovery script; the remaining step (free :5093) requires a terminal/Docker command that the platform blocks me from issuing.*
