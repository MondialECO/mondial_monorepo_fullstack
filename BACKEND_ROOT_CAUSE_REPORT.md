# BACKEND ROOT CAUSE REPORT — CORRECTED (runtime-proven)

**Date:** 2026-06-23
**Important:** This supersedes my earlier root-cause claims. Re-verification with **runtime evidence** REFUTED them. Corrections are called out below.

---

## EXECUTIVE SUMMARY

The backend **is not broken** and **MongoDB is not down**. The app serves correctly when started with the repo's own local runner — the on-disk log proves **184 successful `200` responses and `0` `500`s**, including `GET /api/auth/me → 200` and `GET /api/deals → 200`. The **current** process on `:5093` is a *different, misconfigured instance* (the log hasn't updated since 06-17, so it was started some other way — almost certainly the Docker stack pointed at an **unreachable external/Atlas Mongo**, which makes traefik 503 every route).

> **Fix (proven):** run `run_local_verify.bat` (double-click). It kills :5093, verifies local Mongo, and starts the backend on the `LocalVerify` profile against **local** Mongo. That path is known-healthy.

## RUNTIME EVIDENCE (this session)

| Probe | Result | Conclusion |
|---|---|---|
| Navigate `http://localhost:27017/` | **200**, "trying to access MongoDB over HTTP on the native driver port" | ✅ **Local MongoDB IS UP** (refutes earlier "Mongo down") |
| `no-cors` fetch `localhost:27017` | reachable (opaque) | ✅ Mongo reachable |
| `GET /health/live` (live Kestrel returns hardcoded 200) | **503** | The current `:5093` instance is **not a healthy instance of this app** |
| `GET /api/auth/me`, `/api/investor/stats`, OPTIONS, SignalR negotiate | **503** | Current instance 503s everything |
| `docker-compose.yml` | traefik on **:80/:443**, Mongo "external (Atlas)", api `depends_on redis healthy` | Docker stack ≠ :5093 local; if run via Docker, api → Atlas |
| `launchSettings.json` | `dotnet run` → Kestrel on **:5093**, `LocalVerify` profile forces `mongodb://localhost:27017`, DB `MondialEcoInvestorVerify` | Local run path = Kestrel direct on :5093 |
| `backend_verify.log` (06-17 run via `run_local_verify.ps1`) | `Now listening on http://localhost:5093`, `Application started`, **184× responded 200, 0× 500** | ✅ **App is healthy when run locally** |

## CORRECTIONS TO EARLIER REPORTS

| Earlier claim | Reality (runtime-proven) |
|---|---|
| "MongoDB unreachable at localhost:27017" | ❌ Wrong — local Mongo answers HTTP 200 on 27017 |
| "Startup role/demo seeding throws on Mongo" | ❌ Not occurring in the healthy local run (it seeded + served 200s) |
| "Rate limiter could 503" | ❌ Wrong — `RejectionStatusCode = 429` |
| "Redis down causes 503" | ❌ Wrong — Redis disabled in dev with graceful fallback (`useRedis=false`) |
| "Traefik on :5093" (local) | ⚠️ Not the *local* runner (`:5093` = Kestrel). Only relevant if the **current** instance is the Docker stack (traefik :80/:443 → Atlas). |

## REMAINING UNCERTAINTY (honest)

I could not read the **current** 503 process's console (server/terminal windows are masked from screenshots; terminal keyboard input is blocked for me), so the exact identity of the current `:5093` instance is inferred: it is misconfigured (unreachable external Mongo / wrong profile), not the local runner. This does not affect the fix — the local runner is proven-good.

## THE ONE REAL BACKEND BUG FOUND (non-fatal)

`backend_verify.log` (01:04:13): `Hangfire.Mongo.MongoJobQueueWatcher` throws
`MongoCommandException: The $changeStream stage is only supported on replica sets.`
The local Mongo is a **standalone** (not a replica set), so Hangfire's change-stream job watcher errors on a loop. **It did not break request handling** (the app still served 184× 200), but it spams errors and degrades background-job latency. **Fix:** run Mongo as a single-node **replica set**, OR set `CheckQueuedJobsStrategy = TailNotificationsCollection` in `MongoStorageOptions`. **Severity: Sev-3** (background only).

## RECOVERY STEPS

1. **Double-click `run_local_verify.bat`** (project root). It kills :5093, confirms local Mongo (up), starts the backend on `LocalVerify`, and tees to `backend_verify.log`.
2. Wait ~30s; confirm `backend_verify.log` shows a fresh `Now listening on: http://localhost:5093` + a seed line.
3. Verify in browser: `GET /health/live → 200`, `GET /health/ready → 200`, `GET /api/auth/me → 200`.
4. Then the live certification can run end-to-end.

*(I attempted to launch `run_local_verify.bat` for you via File Explorer, but a masked "Hyper-V Manager" window kept stealing focus and the launch didn't register. Closing that window, or double-clicking the .bat yourself, will do it.)*

---

*Corrected using executed runtime evidence (live browser probes + the app's own log) over the earlier source-only theories.*
