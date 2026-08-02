# Mondial — June 10 Owner Demo Smoke Test

Run **top to bottom, in order**, ~30 min before the demo. Stop and apply the
fallback the moment a step fails — do not skip ahead.

**Placeholders:** `APP` = frontend URL (e.g. `https://your-demo-domain.com`),
`API` = `https://<APP_DOMAIN>` (backend). Accounts use password `DemoP@ss1`:
`demo.creator` · `demo.investor` · `demo.entrepreneur` · `demo.provider` (all `@mondial.local`).
Seeded companies: **Rousseau Technologies SAS** (full data room + draft term sheet),
**Veris Health**, **Helio Solar**.

> Global fallback if a whole role is broken: present from a pre-recorded screen
> capture for that role and continue the rest of the live demo.

---

## 1. Health checks
- **Page/cmd:** `curl -fsS API/health/ready` and open `API/health/ready` in browser.
- **Expected:** HTTP 200, `Healthy`. Mongo + Redis + OpenRouter all reporting healthy.
- **Failure symptoms:** 503 / `Unhealthy`; Traefik 502/504; site won't load.
- **Fallback:** `docker compose logs api | grep -i error`. Mongo unhealthy → check Atlas IP allowlist. Redis unhealthy → check `Redis__Configuration` host/password. Restart: `docker compose up -d --scale api=1`. Do not proceed until `ready` is green.

## 2. Creator login
- **Page:** `APP/login` → enter `demo.creator@mondial.local`.
- **Expected:** redirect to `APP/dashboard/creator`; sidebar + topbar render; no flash to `/login`.
- **Failure symptoms:** 401, "session_expired" bounce, blank dashboard, CORS error in console.
- **Fallback:** CORS console error → add the frontend origin to `Cors__AllowedOrigins__0`, restart api. 401 → confirm seeding ran (`docker compose logs api | grep -i seed`). Last resort: pre-recorded creator clip.

## 3. Creator AI Studio
- **Page:** `APP/dashboard/creator/ai`.
- **Expected:** credit balance shows ~100; run **Idea Clarifier** → job completes and returns content within ~10–30s; balance drops by 1 (Business Plan −5, Forecast −5).
- **Failure symptoms:** spinner never resolves; "insufficient credits"; 500; job stuck "queued".
- **Fallback:** stuck "queued" → Hangfire worker issue, check `API/hangfire` (admin). Empty/500 → OpenRouter key invalid or `openai/gpt-oss-20b:free` unavailable. **Use the pre-recorded AI run** and narrate; the rest of the demo is unaffected.

## 4. Entrepreneur login
- **Page:** `APP/login` → `demo.entrepreneur@mondial.local`.
- **Expected:** redirect to `APP/dashboard/entrepreneur`; onboarding pre-completed (no KYC wizard).
- **Failure symptoms:** lands on onboarding/phase-1 wizard; 401; blank.
- **Fallback:** same as step 2. If onboarding wizard appears, seeding's onboarding backfill didn't run — note it and proceed; seeded company data still loads.

## 5. Company workspace
- **Page:** `APP/dashboard/entrepreneur` then the company phases (`.../phase-2`, `.../phase-4` cap table).
- **Expected:** seeded company (Rousseau / Veris / Helio) visible with funding, valuation, TrustScore, "Investor-Ready" badge; cap table (Founder / Co-Founder / ESOP) renders.
- **Failure symptoms:** empty company list; missing valuation/equity; charts fail to render.
- **Fallback:** empty list → seeding didn't complete; check `ASPNETCORE_ENVIRONMENT=Demo` + `SeedDemoData=true`. If only charts break, narrate from the data table.

## 6. Investor login
- **Page:** `APP/login` → `demo.investor@mondial.local`.
- **Expected:** redirect to `APP/dashboard/investor`; dashboard shows seeded matches/activity.
- **Failure symptoms:** 401; blank; no matches.
- **Fallback:** same as step 2.

## 7. Discovery flow
- **Page:** `APP/dashboard/investor/discovery` → open a company → `APP/dashboard/investor/discovery/[companyId]`.
- **Expected:** company cards list (Rousseau, Veris, Helio…); detail page shows profile, metrics, match rationale.
- **Failure symptoms:** empty grid; "no companies"; detail 404.
- **Fallback:** empty → seeding issue (step 5 fallback). Detail 404 → use a different seeded company (Rousseau is the most complete).

## 8. NDA flow
- **Page:** `APP/dashboard/investor/discovery/[companyId]/dataroom` (Rousseau).
- **Expected:** Rousseau is **already NDA-accepted** (seeded) → data room opens; one real PDF (Pitch Deck v3) plus metadata-only docs. For a company without seeded NDA, an NDA gate prompts before access.
- **Failure symptoms:** NDA gate blocks an already-accepted company; data room empty; PDF won't open.
- **Fallback:** if the seeded NDA didn't take, accept the NDA live (still demonstrates the gate). PDF fail → show the document list and access-log instead.

## 9. Deal flow
- **Page:** `APP/dashboard/investor/discovery/[companyId]/term-sheet` (Rousseau) and `APP/dashboard/investor/deals` / `APP/dashboard/investor/pipeline`.
- **Expected:** Rousseau draft term sheet: pre-money €2.4M, post-money €2.85M, commitment €450K; due-diligence checklist (4 items, mixed statuses); deal appears in pipeline.
- **Failure symptoms:** no term sheet; wrong figures; pipeline empty.
- **Fallback:** missing → seeding's deal-execution step failed; demo the term-sheet UI on a fresh draft, or narrate from this runbook's figures.

## 10. Messaging
- **Page:** `APP/dashboard/investor/messages` (also `/dashboard/creator/messages`, `/dashboard/entrepreneur/messages`).
- **Expected:** 3 seeded threads (Creator↔Investor, Entrepreneur↔Investor, Entrepreneur↔Provider), last message unread. Send a message → recipient (second browser/tab) sees it **live** without refresh.
- **Failure symptoms:** threads missing; message sends but doesn't appear live; console SignalR/WebSocket errors.
- **Fallback:** no live delivery → SignalR/WS issue. Verify WS upgrade on `API/hubs/chat` (step E of pre-flight); confirm token present. If WS is blocked at the proxy, messaging still persists on refresh — narrate "delivered, refresh to view" and continue.

## 11. Notifications
- **Page:** topbar bell (any dashboard).
- **Expected:** bell shows unread count; triggering an event (new message from another account) increments it **live**; opening clears it.
- **Failure symptoms:** count stuck at 0; no live increment.
- **Fallback:** same root cause as step 10 (`/hubs/notifications`). Refresh shows the count if polling works. Non-blocking — note and move on.

## 12. Admin verification queue
- **Page:** login `APP/login` as admin → `APP/dashboard/admin/serviceproviders`.
- **Expected:** service-provider verification queue lists pending provider(s); approve/reject actions render.
- **Failure symptoms:** empty queue; 403 (not admin); actions missing.
- **Fallback:** empty → ensure demo provider seeded (step 13). 403 → confirm the admin account's role. Narrate the queue UI if no pending items.

## 13. Service Provider verification
- **Page:** login `APP/login` as `demo.provider@mondial.local` → `APP/dashboard/serviceprovider` and `APP/dashboard/serviceprovider/profile`.
- **Expected:** provider profile + verification status renders; ties back to the admin queue (step 12) — approve in admin, status updates here.
- **Failure symptoms:** blank profile; verification status missing; 401.
- **Fallback:** same as step 2. If the admin→provider status round-trip fails, demo each side independently.

---

## Pre-demo go/no-go
- [ ] Steps 1–13 all green on the demo URL.
- [ ] `mongodump` snapshot taken **after** a clean run (rollback point).
- [ ] Two browsers/profiles ready for the live messaging+notification demo.
- [ ] Pre-recorded clips staged for: AI Studio run, and one full investor (discovery→NDA→deal) flow.
- [ ] Known-good `APP_IMAGE` tag noted; one-line CORS override + `docker compose up -d` rehearsed.
