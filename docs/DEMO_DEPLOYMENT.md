# Mondial — VPS Demo Deployment Runbook

Owner-demo deployment. Feature-frozen. Covers the deployment blockers only.

> Supersedes `docs/DEPLOYMENT.md` for the demo. That older file describes a
> Vercel + AWS EC2 + Nginx setup that does **not** match this repo's actual
> infra (`backend/docker-compose.yml` = Traefik + dockerized backend + Redis).
> Treat this file as the source of truth for the VPS demo; reconcile or delete
> the old one separately.

---

## 1. Demo seeding strategy (decision required)

Demo data (users, conversations, AI credits, companies, deal rooms) only seeds when
**both** are true (`backend/Extensions/SeedingExtensions.cs`):

```csharp
if (!env.IsDevelopment()) return;
if (!config.GetValue<bool>("SeedDemoData")) return;
```

On a normal production VPS (`ASPNETCORE_ENVIRONMENT=Production`) **nothing seeds → empty demo.**

### Option A — `ASPNETCORE_ENVIRONMENT=Development` + `SeedDemoData=true`
- ✅ Zero code change.
- ❌ Developer exception pages leak stack traces publicly.
- ❌ **Redis backplane silently disabled** — the in-memory fallback (`Program.cs` ~123-129)
  only triggers in Development. SignalR breaks across replicas; forces single-replica.
- ❌ Other dev-only relaxations active. Weak posture for an owner-facing URL.

### Option B — dedicated `Demo` environment (RECOMMENDED)
Keep production hardening; open the seed gate to a `Demo` environment behind the same
`SeedDemoData` flag. One-line change to the gate:

```csharp
if (!env.IsDevelopment() && !env.IsEnvironment("Demo")) return;
```

Then deploy with `ASPNETCORE_ENVIRONMENT=Demo` + `SeedDemoData=true`.
- ✅ No dev exception pages; Redis backplane stays active; production-grade.
- ✅ Two-gate safety: a stray `Demo` env still won't seed without the flag.
- ❌ Requires the one-line gate change above (not yet applied — awaiting go-ahead).

> **Status:** gate change NOT applied. Confirm Option B and it will be implemented.
> If you choose A, set the two env vars and run single-replica.

---

## 2. Required environment variables

### Backend (`__` is the section separator). App fail-fasts without these:
| Var | Notes |
|-----|-------|
| `ASPNETCORE_ENVIRONMENT` | `Demo` (Option B) or `Development` (Option A) |
| `MongoDbSettings__ConnectionString` | Atlas/self-hosted URI w/ creds |
| `MongoDbSettings__DatabaseName` | e.g. `MondialDemo` |
| `JwtSettings__Key` | **fresh** 256-bit random (≥32 bytes). Do NOT reuse the dev key |
| `JwtSettings__Issuer` / `JwtSettings__Audience` | e.g. demo domain |
| `OpenRouter__ApiKey` | **boot-blocking.** Account must have `gpt-4o` credit |
| `EmailSettings__SmtpServer` / `__Email` / `__Password` | SMTP creds |
| `SeedDemoData` | `true` for the demo |

### Backend (env-specific):
| Var | Notes |
|-----|-------|
| `Cors__AllowedOrigins__0` | exact demo frontend origin (scheme+host) |
| `Redis__Configuration` | required if `api` scaled >1 |
| `Redis__Enabled` | `true` for Demo env multi-replica |
| `ForwardedHeaders__KnownProxies__0` / `KnownNetworks__0` | the VPS proxy |
| `OpenRouter__EnableHealthCheckPing` | `true` to validate the key in `/health/ready` |

### docker-compose `.env`:
`ACME_EMAIL`, `APP_IMAGE`, `APP_DOMAIN`, `REDIS_PASSWORD`

### Frontend — set at **BUILD** time (inlined by `next build`, no runtime fix):
| Var | Notes |
|-----|-------|
| `NEXT_PUBLIC_API_BASE_URL` | e.g. `https://api.<demo-domain>/api`. **Build now fails loudly if unset in prod** |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | optional |

---

## 3. VPS deployment checklist

1. [ ] Provision VPS, install Docker + Compose. DNS: `APP_DOMAIN` + API subdomain → VPS.
2. [ ] Create `backend/.env` (`ACME_EMAIL`, `APP_IMAGE`, `APP_DOMAIN`, `REDIS_PASSWORD`).
3. [ ] Set all backend secrets (§2). Generate fresh `JwtSettings__Key`.
4. [ ] **Confirm seeding strategy (§1).** Set `ASPNETCORE_ENVIRONMENT` + `SeedDemoData`.
5. [ ] Stand up Mongo + Redis; confirm reachable from the api container.
6. [ ] Start backend. Watch logs for fail-fast (missing OpenRouter key / weak JWT).
7. [ ] Wait for `/health/ready` = Healthy. Confirm first-boot index creation + seed logs.
8. [ ] **Build frontend with `NEXT_PUBLIC_API_BASE_URL` set** → `next start` (or container).
9. [ ] Set `Cors__AllowedOrigins__0` to the live frontend origin; restart backend if changed.
10. [ ] Verify Traefik HTTPS **and WebSocket upgrade on `/hubs/*`** (no buffering proxy in front).
11. [ ] Run smoke tests (§4).

---

## 4. Smoke-test checklist

- [ ] `/health/ready` = Healthy (Mongo + Redis + OpenRouter).
- [ ] Hangfire dashboard (`/hangfire`, Admin) shows the `ai` queue processing.
- [ ] Login `demo.creator@mondial.local` / `DemoP@ss1` → creator dashboard (seed + JWT + CORS).
- [ ] AI Studio → run Clarifier → job completes (OpenRouter + gpt-4o + Hangfire + credit debit).
- [ ] Messaging: open a seeded conversation, send → recipient sees it live (SignalR + WS + backplane).
- [ ] Notification bell increments live.
- [ ] Investor login → seeded matches / deal room / NDA-gated data room render.
- [ ] Service provider login → verification queue renders.
- [ ] Open a creator profile with avatar → image loads (image-allowlist fix).
- [ ] Idle past JWT expiry, act → silent refresh, no forced logout.
- [ ] Hard refresh mid-session → stays logged in (localStorage hydration).

---

## 5. Demo-day checklist

- [ ] Tag a known-good `APP_IMAGE` (by `BUILD_SHA`). Rollback = repoint + `compose up -d`.
- [ ] `mongodump` snapshot taken **after** seeding succeeds.
- [ ] Pre-built, verified frontend image staged (env mistakes need a rebuild, not a restart).
- [ ] One-line CORS override ready: `Cors__AllowedOrigins__0=<origin>` + restart.
- [ ] OpenRouter balance checked; screen-recording of an AI run staged as fallback.
- [ ] Demo accounts confirmed logged-in on the presenter machine beforehand.
- [ ] All four demo logins (`creator`/`investor`/`entrepreneur`/`provider@mondial.local` / `DemoP@ss1`) verified.

---

## 6. Rollback plan

- **Bad image:** repoint `APP_IMAGE` to prior `BUILD_SHA`, `docker compose up -d`.
- **Bad data:** drop DB + restart (re-seeds) or `mongorestore` the snapshot.
- **Redis flaky:** flush/restart Redis (clients auto-reconnect, jittered backoff). Last resort
  single-replica: `Redis__Enabled=false`.
- **AI outage:** only AI Studio is affected; rest of demo stays up. Use the recording.
- **Frontend env baked wrong:** no runtime fix — swap to the pre-built staged image.
