# Mondial Eco — Full Product Acceptance Test (PAT)

**Role:** Senior QA Lead / Product Auditor
**Date:** 2026-06-08
**Method:** Live black-box audit through the browser (Claude in Chrome) against the running app. Backend/route inventory cross-referenced against source for gap analysis only. No code, commits, or fixes were made.
**Environment:** Next.js 16 frontend `http://localhost:3000` + .NET backend `http://localhost:5093` (`/health/ready`=200), MongoDB `MondialEcoInvestorDemo`, SignalR realtime, Redis disabled in dev.
**Accounts:** Seeded demo users (password `DemoP@ss1`, email-confirmed): `demo.creator`, `demo.investor`, `demo.entrepreneur`, `demo.provider` @mondial.local. **No admin account exists** (not seeded, not signup-able).

---

## Executive summary

The platform is far more built-out on the **backend** than the **frontend** exposes. Creator, Investor, and Service-Provider journeys are largely functional with rich seeded data (deal discovery, NDA gating, deal pipeline, messaging). Three areas block a clean demo: **(1) the Entrepreneur dashboard hard-crashes** (missing React provider), taking the whole entrepreneur section down; **(2) the AI system is fully wired but produces no output** because OpenRouter returns `402 Payment Required`; **(3) new-user onboarding is broken** (`validate-onboarding-token` → 401 on a valid token). Realtime (SignalR) is down across the app (polling fallback keeps messaging working). Several individual controls are unwired (forgot-password, investor "Send offer", notification mark-read=500).

**Overall verdict: CONDITIONAL GO** — demo is viable on the Creator + Investor happy paths using seeded logins, provided you avoid the Entrepreneur dashboard, avoid the signup→onboarding flow, and don't rely on live AI output.

---

## SECTION A — Public Sitemap

| Route | Purpose | Reachable? | Working? |
|---|---|---|---|
| `/` | Marketing homepage ("The first Social Credit Creation") | Yes | Yes |
| `/login` | Sign in | Yes | Yes |
| `/signup` | Account creation form | Yes | Yes (account created) |
| `/signup/role` | Role picker (Entrepreneur/Investor/Creator/Service Provider) | Yes | Yes |
| `/signup/onboarding` | Post-signup onboarding wizard | Yes (redirect target) | **No** — 401 "Registration Link Expired", loops to signup |
| `/forgot-password` | Request reset link | Yes | **No** — submit fires no request, no feedback (backend OK) |
| `/reset-password` | Set new password (needs emailed token) | Yes | Not testable (no inbox) |
| `/change-password` | Change password | Yes (auth) | Not individually tested; backend present |
| `/confirm-email` | Email confirmation | Yes | Not testable (no inbox) |
| Homepage nav: Concept / Features / Pricing / FAQ | Marketing anchors | Yes | Yes (render) |

Homepage CTAs: **Request Demo**, **Join Free** (→ signup), **Sign In**, **Get Started**.

---

## SECTION B — Authentication Audit

| Feature | Pass/Fail | Notes |
|---|---|---|
| Login (UI + API) | **Pass** | `/api/auth/login` 200; JWT + user stored in `localStorage`. |
| Logout | **Pass** | Clears `token`/`user`, redirects to `/login`. |
| Protected routes | **Pass** | Logged-out `/dashboard/*` → redirect to `/login`. |
| Role-based access control | **Pass** | Non-admin hitting `/dashboard/admin` → redirected; `/api/admin/*` → **403**. |
| Session persistence | **Pass (caveat)** | Reload stays authed. **Caveat:** hard refresh / direct-URL on dashboard *sub-routes* bounces to the role overview (auth guard races hydration). |
| Signup (account creation) | **Pass** | `/signup`→role→form; account created; can immediately log in. Email confirmation NOT required to log in. |
| **Onboarding** | **Fail (BUG)** | After register, redirect to `/signup/onboarding?token=…`. `POST /api/auth/validate-onboarding-token` → **401 "Invalid token claims"**. Token is **not expired** (≈14 min remaining) and contains sub/email/role/token_type=onboarding. Role claim is emitted under the long schema URI → claim-parse mismatch in `AuthController` (~L478). Frontend mislabels it "Registration Link Expired" and loops to `/signup`. New users can bypass by logging in, but remain at onboarding **phase 0** (which gates `transition-role`). |
| **Forgot-password (UI)** | **Fail** | Typing a valid email + "Send Reset Link" fires **no** backend request and shows **no** feedback. Backend `POST /api/auth/forgot-password` works (200 "reset link sent"). → UI not wired. |
| Password reset / change | Backend present | `reset-password`, `change-password` endpoints exist; UI not end-to-end testable without emailed token. |
| OTP / email confirm | Not testable | `confirm-email` + onboarding email-OTP + Twilio enabled; no inbox available. Not required for login. |
| Refresh token | Endpoint present | `/api/auth/refresh-token` exists; JWT `ExpiryHours=8`. Not exercised. |
| **Security note** | — | JWT stored in `localStorage` (XSS-exposed) rather than an httpOnly cookie. |

---

## SECTION C — Role Route Matrix (summary)

| Role | Overview | Working? | Notes |
|---|---|---|---|
| Creator | `/dashboard/creator` | **Yes** | Full sidebar, stats wired, all sub-pages render. |
| Investor | `/dashboard/investor` | **Yes** | Rich discovery/pipeline/deals. (One intermittent UI-login token-persist miss.) |
| Entrepreneur | `/dashboard/entrepreneur` | **No — crash** | `useEntrepreneurProgress must be used within EntrepreneurProgressProvider`. Section trapped. |
| Service Provider | `/dashboard/serviceprovider` | **Partial** | Overview blank; Provider Profile fully functional. |
| Admin | `/dashboard/admin` | **Blocked** | No admin account; RBAC correctly denies non-admins. |

Per-route detail is in Section M.

---

## SECTION D — Creator Audit

Sidebar: Overview, My Ideas, AI Studio, Investors, Messages, Profile, Billing History, Settings. **All render and work.**

| Area | Result | Detail |
|---|---|---|
| Dashboard | **Works** | Stats wired to `/api/creator/dashboard/stats` (real values). After creating ideas, count → 02 and Funding Overview populated. |
| "Top Investors" widget | **Mock** | Hardcoded names (Sarah Ahmed/Rahim Khan…, typo "Cripto data momitoring"); not in the API response. |
| My Ideas | **Works** | Status tabs Overview/Approved/Pending/Pause/Rejected, proper empty state. |
| Idea creation (`/create-project`) | **Works (E2E verified)** | 9-step wizard, Quill editors, per-step validation, **auto-saves drafts**. `POST /creator/new-idea` 200 → `GET /creator/ideas` returns it → dashboard stats update. (Note: `BusinessIdeaController` `[HttpPost] Create` is commented out; creation routes via `CreatorController`.) |
| Idea editing | Mechanism present | Same `/creator/new-idea/{id}` endpoint. |
| AI Studio | UI works / output blocked | See Section K. |
| Investors | **Works** | Empty state "No investor activity yet". |
| Messages | **Works** | Seeded conversation; status "Offline" (SignalR). See Section I. |
| Profile / Settings | **Works** | Edit profile (completion meter), Account/Creator preferences forms. |
| Billing History | **Works** | Empty "No billing history found". |
| `phase-1` / `phase-3` | Workflow-gated | Direct nav bounces to overview; `phase-3` needs `ideaId` context (reachable only as an idea progresses). |

---

## SECTION E — Entrepreneur Audit

**Status: BROKEN — highest-severity role.**

| Area | Result | Detail |
|---|---|---|
| Dashboard `/dashboard/entrepreneur` | **Hard crash** | Renders "Dashboard Error" boundary. Console: `Error: useEntrepreneurProgress must be used within EntrepreneurProgressProvider` in `<EntrepreneurOverview>`. Missing context provider; crashes on every load. |
| Dashboard data API | Missing | `GET /api/entrepreneur/dashboard/stats` → **404**. `GET /api/companies` → 405. Onboarding phase = 1. |
| Navigation | **Trapped** | Sub-routes (`phase-1`, `deals`) deep-link bounce to the crashed overview; `messages` loads "Loading…" then also bounces. From the crashed overview, sidebar clicks do not navigate → entire section unusable via UI. |
| Company creation / phases / data room / cap table / team / AI review / deals (owner side) | Backend exists, UI unreachable | `CompanyController` is huge (phases, data room, cap table, valuation, vesting, share issuance, deals, investor matching, AI review — 60+ endpoints). Proven live: the Investor sees fully-populated seeded companies. But the Entrepreneur UI to drive any of it is crashed/inaccessible. |

This is the single biggest backend-vs-frontend gap in the product.

---

## SECTION F — Investor Audit

Sidebar: Investments, Discovery, Pipeline, Deals, Messages. **Richest, most complete role.**

| Area | Result | Detail |
|---|---|---|
| Investments (overview) | **Works** | Portfolio stats (Total Invested/Portfolio Value/Investments/ROI). All $0 — portfolio empty despite seeded matches. |
| Discovery | **Works (rich)** | "5 deals matched to your thesis" with match scores (Atomica 94%, Veris Health 91%, NovaPay 88%, Helio Solar 82%, +1). Filter chips, Message + View details. Matching engine wired to real data. |
| Company detail `[companyId]` | **Works (rich)** | Funding ask/pre/post/equity, match-score breakdown (Sector/Stage/Geography/Team), Company snapshot, Trust score. Tabs Cap Table/Team/Documents **NDA-locked**. |
| **NDA flow** | **Works (E2E)** | "Sign NDA & Get Access" → agreement modal (full text, key terms) → Confirm & Sign (acknowledge checkbox, EU NDA regulation) → "You now have access"; tabs unlock; badge flips Required→Signed and persists. |
| Data room | Works (empty for this co.) | Unlock mechanism works; Atomica had 0 published docs (seeded docs likely on another company). |
| **Make Offer** | **Fail (UI)** | Full term-sheet builder with working field validation, but clicking "Send offer" with valid data fires **no** request — no-op. Investor-initiated offers don't submit. Also: backend `CreateDeal` requires **company ownership**, so an investor cannot hit it — investor offer path looks architecturally incomplete. |
| Pipeline | **Works (rich)** | 5-stage deal kanban (New Matches → In Review → NDA Signed → Data Room → Negotiation). Reflects live state (my NDA action moved Atomica to "NDA Signed"). Seeded Rousseau deal in Negotiation with offer/equity/pre-money. "Portfolio MOIC" honestly labeled "demo placeholder". |
| Deals | **Works** | Negotiation view with a seeded deal (€450K · 15.8%). |

---

## SECTION G — Service Provider Audit

Sidebar: Provider Profile only.

| Area | Result | Detail |
|---|---|---|
| Dashboard `/dashboard/serviceprovider` | **Blank** | Empty content area, no widgets. Placeholder/unbuilt overview. |
| Provider Profile | **Works (complete)** | Verification status, Trust Score, Completion %, Current Phase, Skills/Portfolio counts, 8-item completion checklist. Sections: Professional Info (headline/bio), Skills, 12 Service Categories, Industries, Languages, 6 Pricing Models, Portfolio, Verification. |
| Profile save | **Works** | `PUT /api/service-provider/profile` 200 (skills + category persisted). |
| Verification submission | **Works (gated)** | `POST /api/service-provider/submit-verification` → **409** when profile incomplete (correctly enforces the 8-item completeness gate). Status display works. |

---

## SECTION H — Admin Audit

**Status: BLOCKED (no access) — documented per instruction.**

- No admin account is seeded; the signup role picker offers only Entrepreneur/Investor/Creator/Service Provider. Admin is not creatable through the public UI.
- RBAC verified working: non-admin `/dashboard/admin` → redirected away; `/api/admin/users` → **403**.
- Routes that exist (unaudited): `/dashboard/admin`, `/dashboard/admin/phase-1`, `/dashboard/admin/serviceproviders`. Backend: `AdminController`, `ServiceProviderAdminController` (provider verification queue), `VarificationController`.
- **To unblock:** provide a seeded admin login or elevate a test account's role to `Admin` in MongoDB.

---

## SECTION I — Messaging Audit

| Feature | Result | Detail |
|---|---|---|
| Conversation list | **Works** | Seeded conversations with unread badge. |
| Open conversation | **Works** | Full seeded thread (realistic founder↔investor exchange). |
| Send message | **Works** | Typed + Enter → message persisted and rendered with timestamp; list updates to "now". |
| Receive / unread counts | **Works** | Unread "1" shown, cleared on open. |
| **Realtime updates** | **Broken** | SignalR "Offline". `…/hubs/notifications/negotiate` POST returns 200 but the connection is "stopped during negotiation". App falls back to **polling** (`GET /api/chat/conversations`), so messages still flow but not instant/push. |
| Notification generation | **Works** | Sending/events increment the bell. |

---

## SECTION J — Deal Flow Audit

| Stage | Result | Detail |
|---|---|---|
| Investor discovery | **Works** | Matched companies with scores (Section F). |
| NDA | **Works (E2E)** | Two-step sign → data-room unlock, state persists. |
| Deal creation (owner) | Backend only | `POST companies/{id}/deals` requires company ownership; entrepreneur UI is crashed, so not exercisable via UI. |
| **Offer submission (investor)** | **Broken (UI)** | "Send offer" is a no-op; no request fired. |
| Negotiation / viewing | **Works** | Pipeline kanban + Deals page show seeded deals across stages (Rousseau in Negotiation with term economics). |
| Status updates / term-sheet / checklist / close / due-diligence / sign | Backend present | Rich endpoints exist (`deals/{id}/term-sheet`, `/checklist`, `/status`, `/close`, `/due-diligence`, `/term-sheet/sign`); investor-side viewing works, owner-side UI unreachable. |

---

## SECTION K — AI Audit

**Status: Fully wired end-to-end, but produces NO output — blocked at the LLM provider.**

| Capability | Result | Detail |
|---|---|---|
| AI credits | **Works** | `/api/ai/usage` returns balance 100 (seeded). |
| Launch (Idea Clarifier) | **Works** | `POST /api/ai/idea-clarifier` 200 → creates `sessionId` + `jobId` (async job queue). |
| Process / complete | **Fail (external)** | Job → `status: Failed`, `error: "OpenRouter request failed with status 402 (Payment Required)"`. OpenRouter account unfunded. |
| Business Plan / Forecast | **Blocked** | Same OpenRouter dependency → same 402 block. |
| Results render | **No** | No output produced. |
| Side bug | — | Job goes `Failed` but the clarifier **session stays `Pending`** (failure not propagated → a UI tied to session status would spin forever). |

**Classification: BLOCKED** by external LLM billing (not an app code defect). Fund the OpenRouter key (`402` → paid) to unblock; fix the session-status propagation separately.

---

## SECTION L — Notification Audit

| Feature | Result | Detail |
|---|---|---|
| Bell count | **Works** | "3 new", accurate. |
| Dropdown render | **Works** | Listed 3 "AI job failed — IdeaClarifier failed" with relative timestamps. |
| Generation (cross-event) | **Works** | The 3 notifications were auto-generated by my 3 failed AI jobs. |
| **Read state** | **Broken** | Clicking a notification did not decrement unread. `POST /api/notification/read/{id}` → **500**. Notifications cannot be marked read. |
| Realtime delivery | **Broken** | Shares the SignalR outage; polling fallback. |

---

## SECTION M — Complete Route Inventory

Legend: ✅ works · ⚠️ partial/empty · ❌ broken · 🔒 blocked/gated · 🔁 workflow-only (direct nav bounces).

| Route | Role | Reachable | Working | Linked in UI | How to reach |
|---|---|---|---|---|---|
| `/` | Public | ✅ | ✅ | n/a | Direct |
| `/login` | Public | ✅ | ✅ | Header | Direct |
| `/signup` → `/signup/role` | Public | ✅ | ✅ | Header | Direct |
| `/signup/onboarding` | Public | ✅ | ❌ | redirect | After register (401 loop) |
| `/forgot-password` | Public | ✅ | ❌ | Login link | Direct |
| `/reset-password` | Public | ✅ | ? | email | Emailed token |
| `/change-password` | Auth | ✅ | ? | — | Direct |
| `/confirm-email` | Public | ✅ | ? | email | Emailed link |
| `/create-project` | Creator | ✅ | ✅ | "Create idea" | Direct/CTA |
| `/dashboard/creator` | Creator | ✅ | ✅ | Sidebar | Login |
| `/dashboard/creator/myideas` | Creator | ✅ | ✅ | Sidebar | In-app |
| `/dashboard/creator/ai` | Creator | ✅ | ⚠️ (UI ok, AI blocked) | Sidebar | In-app |
| `/dashboard/creator/investors` | Creator | ✅ | ✅ | Sidebar | In-app |
| `/dashboard/creator/messages` | Creator | ✅ | ✅ | Sidebar | In-app |
| `/dashboard/creator/profile` (+`/[id]`) | Creator | ✅ | ✅ | Sidebar | In-app |
| `/dashboard/creator/billinghistory` | Creator | ✅ | ✅ | Sidebar | In-app |
| `/dashboard/creator/settings` | Creator | ✅ | ✅ | Sidebar | In-app |
| `/dashboard/creator/phase-1`,`/phase-3` | Creator | 🔁 | n/a | — | Idea workflow (needs `ideaId`) |
| `/dashboard/investor` | Investor | ✅ | ✅ | Sidebar | Login |
| `/dashboard/investor/discovery` | Investor | ✅ | ✅ | Sidebar | In-app |
| `/dashboard/investor/discovery/[companyId]` | Investor | ✅ | ✅ | "View details" | In-app |
| `…/[companyId]/dataroom` | Investor | 🔒→✅ | ✅ | tab | After NDA |
| `…/[companyId]/term-sheet` | Investor | ✅ | ⚠️ (offer UI no-op) | "Make Offer" | In-app |
| `/dashboard/investor/pipeline` | Investor | ✅ | ✅ | Sidebar | In-app |
| `/dashboard/investor/deals` | Investor | ✅ | ✅ | Sidebar | In-app |
| `/dashboard/investor/messages` | Investor | ✅ | ✅ | Sidebar | In-app |
| `/dashboard/investor/phase-1`,`/phase-5` | Investor | 🔁 | n/a | — | Workflow |
| `/dashboard/entrepreneur` | Entrepreneur | ✅ | ❌ crash | Sidebar | Login |
| `/dashboard/entrepreneur/(phases)/phase-1…10` (+ steps) | Entrepreneur | 🔁→❌ | ❌ | — | Bounce to crashed overview |
| `/dashboard/entrepreneur/deals` | Entrepreneur | ❌ | ❌ | Sidebar | Bounces to crash |
| `/dashboard/entrepreneur/messages` | Entrepreneur | ⚠️ | ❌ | Sidebar | Loads then bounces |
| `/dashboard/serviceprovider` | Service Provider | ✅ | ⚠️ blank | Sidebar | Login |
| `/dashboard/serviceprovider/profile` | Service Provider | ✅ | ✅ | Sidebar | In-app |
| `/dashboard/serviceprovider/phase-1` | Service Provider | 🔁 | n/a | — | Onboarding workflow |
| `/dashboard/admin` (+`/phase-1`,`/serviceproviders`) | Admin | 🔒 | ? | — | Needs admin (403/redirect) |

---

## SECTION N — Gap Analysis

**1. Backend exists, UI missing/unreachable**
- Entire **Entrepreneur company-management** suite (phases, data room, cap table, valuation, vesting, share issuance, KPIs, financials, investor matching/outreach, AI review, owner-side deals) — 60+ `CompanyController` endpoints, no working UI (overview crash blocks the section).
- `TransactionController`, `BackgroundJobController`, AI `feedback`/`insights`/`jobs` — no obvious UI surface.

**2. UI exists, backend missing/mismatched**
- Investor **"Send offer"** form → no working submit path (UI fires nothing; `CreateDeal` is owner-gated).
- `/api/entrepreneur/dashboard/stats` → 404 while the entrepreneur dashboard expects data.

**3. Dead / non-functional controls**
- Forgot-password "Send Reset Link" (no request).
- Notification mark-read (`500`).
- Onboarding token validation (`401` on valid token).

**4. Mock / placeholder data**
- Creator "Top Investors" widget (hardcoded, with typos).
- Investor "Portfolio MOIC" (self-labeled "demo placeholder").
- Service-Provider dashboard overview (blank).

**5. Incomplete flows**
- Signup → onboarding (loops).
- Investor offer → deal creation (no submit).
- AI Clarifier/Plan/Forecast (enqueue OK, completion blocked by 402; session status not updated on failure).

**6. Routes in code but unreachable via nav**
- All `(phases)` entrepreneur steps; creator/investor `phase-*`; admin routes — reachable only via workflow state or a role the demo can't obtain.

**7. Infrastructure**
- SignalR realtime down app-wide ("stopped during negotiation"); polling fallback masks it for messaging. Likely related to Redis disabled in dev / hub auth.
- Deep-link/refresh on any dashboard sub-route bounces to the role overview (and for Entrepreneur that overview is the crash).

---

## SECTION O — Demo Readiness Score

| Area | Score /100 | Rationale |
|---|---|---|
| Authentication | 70 | Login/logout/RBAC solid; onboarding + forgot-password broken. |
| Creator | 88 | Full journey works incl. idea creation E2E; only AI output + one mock widget weak. |
| Entrepreneur | 15 | Dashboard hard-crash traps the whole section. |
| Investor | 85 | Discovery/NDA/pipeline/deals excellent; "Send offer" no-op. |
| Service Provider | 75 | Profile + verification complete; overview blank. |
| Admin | 0 (N/A) | No access to audit; RBAC correct. |
| Messaging | 75 | Send/receive/unread work; realtime down (polling). |
| Deals | 60 | Viewing/pipeline/NDA strong; offer submission + owner side broken. |
| AI | 30 | Fully built but 0 output (OpenRouter 402). |
| Notifications | 60 | Generation + count work; mark-read 500; no realtime. |

### Launch blockers (P0)
1. **Entrepreneur dashboard crash** — `EntrepreneurProgressProvider` missing around `<EntrepreneurOverview>`. Whole role unusable.
2. **AI produces no output** — OpenRouter `402 Payment Required`. Fund the key (or stub responses for demo).
3. **Signup → onboarding 401 loop** — `validate-onboarding-token` rejects valid tokens (role-claim parsing).

### High priority (P1)
4. SignalR realtime offline app-wide (messaging/notifications fall back to polling).
5. Investor "Send offer" no-op (+ `CreateDeal` owner-gating means no investor offer path).
6. Notification mark-read returns 500.
7. Forgot-password UI unwired.
8. Deep-link/refresh on dashboard sub-routes bounces to overview.

### Medium priority (P2)
9. Service-Provider dashboard overview blank.
10. `/api/entrepreneur/dashboard/stats` 404 / entrepreneur stats not wired.
11. AI clarifier session stays "Pending" after job "Failed".
12. JWT in localStorage (move to httpOnly cookie).

### Nice to have (P3)
13. Replace Creator "Top Investors" mock + typo ("Cripto data momitoring").
14. Relabel/replace "Portfolio MOIC — demo placeholder".
15. Empty-state polish where seeded data is absent (e.g., investor portfolio).

### Final verdict: **CONDITIONAL GO**

Demo-ready on **Creator** and **Investor** happy paths using seeded logins (`demo.creator` / `demo.investor`, `DemoP@ss1`), showcasing idea creation, deal discovery, NDA gating, and the deal pipeline. **Before any broader demo or launch**, fix the three P0 blockers. Do **not** demo the Entrepreneur dashboard, the signup→onboarding flow, or live AI generation in their current state.
