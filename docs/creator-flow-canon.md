# Mondial.eco — Creator Flow Canonical Documentation

Source of truth for development. When code and this doc disagree, this doc wins — unless a change is agreed and written back here first.

**Last reconciled with code: 2026-07-24.** See the Changelog (§11) for what changed. If a claim here contradicts the code, treat it as drift to reconcile — not a spec to build back toward — and confirm before acting.

## 0. How to use this doc

This is the canonical spec for the Creator journey (P1–P6). It is read by Claude AI in VS Code as ground truth. Two standing instructions for any implementer working from it:

1. Do not invent phases, steps, or features not written here.
2. When a request contradicts this doc, flag the contradiction and confirm before proceeding — do not silently comply.

Every feature carries a STATUS tag reflecting the current build:

- **LIVE** — built and canon-correct
- **STUB** — built but fake/placeholder (works, but not the real thing)
- **MISSING** — promised, not built
- **REMOVE** — present in code but canon says it must go
- **FORBIDDEN** — must never be built (violates a core rule)

---

## 1. Stack & cross-cutting engineering rules

**Frontend:** Next.js 16 / React 19 / TypeScript.  
**Backend:** ASP.NET Core 8 (runtime pinned to 8.x — do not run on 10).  
**Data:** MongoDB Atlas.  
**Jobs:** Hangfire.  
**AI provider:** Single-provider **OpenRouter**. Every AI task (probe, clarifier, business plan, forecast, IdeaGenerator) routes to `openai/gpt-oss-20b:free` (`backend/appsettings.json` → `ModelRouting`). This is a **deliberate consolidation** — the earlier Anthropic-Claude / meta-llama split was removed; there is **no `AnthropicClient` in the codebase**. Do not "restore" Anthropic or a per-task model split to match older notes. Free-tier limits apply (~50 requests/day, ~20/min), so flows minimize and gate AI calls; a missing `OpenRouter:ApiKey` fails fast at startup (`StartupConfigValidation`).

These rules apply to every phase. Violating them is a canon breach regardless of feature correctness.

### 1.1 Backend-authoritative status
Journey/phase status is derived server-side from artifact presence (the `ComputePhaseStatus` engine). There is no persisted status field to hand-write. The frontend must never write status locally without a backend round-trip. **(Current offender: the frontend `advancePhase` — must become a backend round-trip.)**

### 1.2 ApiResponse envelope
Every endpoint returns the shared `ApiResponse` wrapper with a `traceId`. No bare `Ok(obj)` or ad-hoc `{success,message}` shapes. **(Current offender: the legacy `api/creator` controller — must be brought into the envelope.)**

### 1.3 No browser storage as source of truth
The backend is the single source of truth. A read-through paint-fast cache is permitted only if: backend always wins on load, the cache never diverges from the backend contract, and no secrets are ever stored. **(Current state: the optimistic localStorage cache reads as authoritative and diverges — must be demoted to read-through, ordering aligned to backend.)**

### 1.4 Output versioning is newest-last
Backend appends newest-last, stamps the real phase number, reads the last element. The frontend must match this exactly. **(Current offender: frontend prepends newest-first and `reconcile()` never surfaces backend snapshots — must be aligned.)**

### 1.5 JWT on every protected endpoint
Class-level authorization on all creator/journey controllers; admin actions role-gated.

### 1.6 Multi-idea architecture (LIVE — 2026-07-24 migration)

A user can hold **multiple ideas**, each with its own full P2–P6 journey. Everything below is deliberate, shipped, and applies to every phase. Building against the old one-journey model is a canon breach.

**1.6.1 Data model — the journey is a thin pointer.**
`CreatorJourney` now persists ONLY user-level fields: `UserId`, `ActiveIdeaId`, `LeveledUpIdeaId`, `CompanyId`, the Phase-6 Level-Up markers (`LevelUpTriggered/At`, `EntrepreneurProfileId`), and the legacy `BusinessIdeaId`. All phase data — `Project`, `Phase2Data`–`Phase5Data`, `SmartMatchmaking`, `OutputSnapshots` — lives per-idea on the **`CreatorIdeas`** collection (`backend/Models/DatabaseModels/CreatorIdea.cs`; non-unique `{UserId}` index — many per user). The journey's old inline phase blocks are **frozen and unread**: left in place pending a later cleanup, they MUST NOT be read or written. Reads go through `GetOrCreateComposedAsync` (journey shape, idea content — `OverlayIdea` in `CreatorJourneyService`); writes go through targeted `$set`/`$push` on the idea (`WriteIdeaAsync`). One dormant exception exists: the legacy buyout→sell_license coercion inside `GetOrCreateAsync` still does a full-document journey write; it fires only for a pre-P1.10 alias and is flagged for removal with the frozen blocks.

**1.6.2 The anchor.**
An idea's identity is its `CreatorIdea._id`, minted at **Phase-2 finalize** — both paths (clarifier `ApplyClarifierMappingAsync` and discovery `ApplyDiscoveryMappingAsync`) converge on ONE idea via the ActiveIdeaId-guarded mint, and stamp the anchoring clarifier's `BusinessIdeaId` with it. Business-plan sessions inherit the anchor from their clarifier; forecasts from their plan (`BusinessPlanController`/`ForecastController` Start). **Regeneration reuses the same session and therefore the same anchor — an idea never splits.** Idea-generation sessions are **deliberately unstamped** (they run pre-idea; one run yields many concepts) — do not "fix" that.

**1.6.3 The `?ideaId=` contract.**
Every idea-scoped endpoint accepts an optional `ideaId` query param. **Explicit id → owned-or-404** (`ResolveIdeaAsync` — NEVER a silent fallback to the caller's own active idea; a fallback would make foreign/stale ids "work" with wrong data). **Absent → the active idea** (mint-if-none). Deliberate exceptions: `finalize-clarifier` and `finalize-discovery` converge on the ACTIVE idea by design (mint/converge semantics — they ignore explicit ids; the frontend guards a cross-idea confirm client-side), and `name-suggestions` touches no idea data.

**1.6.4 Per-idea phase status.**
The derivation engine (`ComputePhaseStatus`) runs against ONE idea's blocks plus the journey's user-level markers. **Phase 6 completes only for the leveled-up idea** (`LeveledUpIdeaId == idea.Id`, set in `OverlayIdea`) — sibling ideas never inherit Level-Up completion. **Level Up stays once-per-user** (entrepreneur side is 1:1): creating further ideas afterwards is allowed; a Level-Up attempt on a different idea returns **409** (`CreatorPhase6Controller` guard on `journey.LeveledUpIdeaId`).

**1.6.5 Idea lifecycle.**
`GET /api/creator/ideas` (card DTOs; `phaseReached` is a coarse display hint — never gate on it), `POST /api/creator/ideas` (mint blank + set active), `PATCH /api/creator/ideas/active` (owned-check switch) — `CreatorIdeasController`, wrapping `CreatorIdeaService`. `ActiveIdeaId` is the server-side pointer; switching = set-active + full re-hydrate, after which every page shows the target idea (pages render "the current idea"). **Frontend rule:** create/switch navigation is gated on **verified hydration** — `hydrate()` returns a `HydrateResult` and the my-ideas handlers only proceed when the hydrated `activeIdeaId` matches the expected id. Never navigate on an unverified refetch (a swallowed hydration failure once left pages on the previous idea).

**1.6.6 Write-scoping rule (applies to ALL future write paths).**
A write must be scoped to the idea it was **initiated** for — never the idea active at completion time. A switch (same tab or another) mid-flight would otherwise contaminate a different idea. Existing implementations of this rule: the debounced project PATCH captures its target at queue time and sends `?ideaId=` explicitly (`useCreatorProgressState`); the Discovery chain carries `&idea=` through its URLs (discovery → ai-processing → idea-cards → idea-confirm) and blocks a cross-idea finalize; stale cross-idea responses are dropped by the `applyResponse` guard. Any new deferred/async write must follow the same capture-at-initiation discipline.

**1.6.7 Migrations (idempotent, startup-invoked).**
Two backfills run on every boot (`Program.cs`, non-fatal): the **idea backfill** mirrors each journey into one `CreatorIdea` + stamps linked sessions — guarded on `ActiveIdeaId` being empty; the **snapshots backfill** copies `OutputSnapshots` wholesale onto the active idea — guarded on the idea's snapshots being empty. **Re-running them re-copies nothing** (the guards fire); do not expect a boot to refresh idea content from the journey. Fresh install → both no-op.

**1.6.8 REMOVED — must not return: the journey mirror.**
During the cutover, every idea write also mirrored to the journey (dual-write) as a rollback net. It was removed (commit `d27abd9`) because **mirroring is undefined once a user has two ideas** — one journey cannot mirror both, and the interleaved copy poisons any rollback. **FORBIDDEN:** do not reintroduce journey phase-block writes, "for safety" or otherwise. The journey's frozen blocks are historical residue, not a fallback store.

---

## 2. Flow overview (P1 → P6)

- **P1** — KYC + role select
- **P2** — Smart Gate: **both entry cards ship (LIVE)**. Path B (already-have-idea → clarifier) and Path A (Discovery → concept cards → confirm) are both reachable. Discovery skips the clarifier by seeding a Completed clarifier session at finalize, so it satisfies the Phase-3 prerequisite. Plus project branding + hire-SP-designer.
- **P3** — AI Masterplan: Business Plan + Financial Forecast + Legal Checklist + Formation Generator (4 modules) → readiness score → completion gate (gates on plan + forecast + formation; legal is guidance, §5.3).
- **P4** — Pricing + GTM / landing page.
- **P5** — Cross-Roads: Path A Marketplace (sell/license) OR Path B The Big Leap (→ 30-day decision timer → Level Up). No formation wizard. Company doc verification deferred to Entrepreneur P2.
- **P6** — Level Up: badge + confetti + atomic Creator→Entrepreneur switch + Smart Matchmaking unlocks (first point matchmaking is available at all).

Gating is strict: no skipping steps; user can always go back one step; completed steps are editable; leaving mid-step auto-saves to the backend.

---

## 3. Phase 1 — KYC + role select

**Purpose:** verify identity and lock in the Creator role before any dashboard access.

**Steps:** email OTP, phone OTP, identity document upload, face verification, role selection.

The Phase-1 completion gate promotes onboarding to Phase 1 only when all four core items (identity, face, phone, email) read verified on the Onboarding model. Promotion is derived — no manual phase writes.

### Status:

- **Email OTP, Phone OTP** — **LIVE** (HMAC-hashed, expiring, rate-limited).
- **Role selection persistence** — **LIVE** (set at signup, read via onboarding status + JWT role claim).
- **Identity + Face verification** — was STUB (only dev-only endpoints wrote the flags). Fixed via the KYC bridge: admin approval of uploaded docs now sets the onboarding identity/face flags and re-runs promotion, so a concierge-approved user clears the gate in production. Reject is symmetric (clears the flags + re-evaluates). SUMSUB is intentionally not wired for alpha.
- **The role UI cosmetic hardcode** ("Role selected (Creator)" without reading actual role) — minor, should read the real role.

**Alpha rule:** KYC clearance is by admin (concierge) approval. This is the legitimate path until SUMSUB is integrated post-alpha.

---

## 4. Phase 2 — Smart Gate (idea entry)

Entry decision: "Do you already have an idea?"

- **YES** → Clarifier (Path B).
- **NO** → Discovery (Path A). Both paths are LIVE and converge on a `clarifierSessionId` (Path A seeds one — see below).

### Path B — Clarifier (LIVE)

A 6-question AI-guided chat (problem, target customer, differentiation, unfair advantage, GTM approach, 12-month milestone). A live clarity score updates as the user answers. Produces `clarifierSessionId`, which the Phase-3 business plan requires (C-3 start returns 409 without a completed clarifier). Then: name project, brand project.

**Branding (LIVE wiring, STUB AI):** upload logo, skip, AI-generate logo, or hire an M50 designer (match → book → workroom). The AI logo generation and AI name suggestions are deterministic stubs today — functional placeholders, marked to swap to the real AI provider later.

**AI failure handling (LIVE, applies to clarifier + Phase-3 plan/forecast):** a **failed** AI session is **not linked** onto the project (no poisoning the project with a Failed session). `finalize-clarifier` distinguishes an **AI-request failure** (401/402/429/timeout → "service temporarily unavailable, try again") from a **parse failure**. HTTP timeouts are classified **permanent** so Hangfire does not auto-retry and burn free-tier quota (`StopRetryOnPermanentAiFailure`). The Phase-3 business-plan and forecast pages render an **honest failure state with a fresh-regenerate path — never a blank body**.

### Path A — Discovery (LIVE)

The chain: sectors + problem + strengths → IdeaGenerator Hangfire job → concept cards → pick → **confirm → summary** → name → brand. Both former defects are fixed:

1. **Session convergence (LIVE):** Discovery deliberately **skips the clarifier**. On confirm, `POST /journey/phase2/finalize-discovery` (`CreatorPhase2Controller.FinalizeDiscovery`) **seeds a Completed clarifier session** directly from the chosen concept, satisfying the Phase-3 session chain — a Discovery user can start the business plan. It does NOT set a server-side `selectedEntryPath` (Path B is the only value stored); the backend discriminates a Discovery user by persisted working-state (2C-2).
2. **Mid-flow resume (LIVE):** the backend derives Discovery steps (`DerivePhase2Step`, 2C-2) and the frontend resolver maps them (2C-3).

The former "Discovery removed / hidden for alpha" code comments were **corrected** — they described a state that no longer exists.

**IdeaGenerator provider:** OpenRouter `openai/gpt-oss-20b:free`, same single provider as every other task (the old gpt-4o-mini fallback / meta-llama requirement is obsolete — see §1).

---

## 5. Phase 3 — AI Masterplan

The strongest, most canon-correct phase. Four modules assembled into the Masterplan, then a readiness score, then a completion gate.

**Session chain (enforced):** `clarifierSessionId` → `businessPlanSessionId` (C-3) → `forecastSessionId` (C-4). C-4 start returns 422 if the business plan is missing/incomplete.

### 5.1 Module — Financial Forecast (C-4, LIVE)

A **36-month** P&L (revenue, costs, cash flow, break-even). **Only the first 12 months are AI-generated; months 13–36 are derived deterministically** in the backend (`ForecastHandler.ExtendToThirtySixMonths`) by projecting from the user's own inputs — revenue compounds at `monthlyGrowthPct`, fixed cost holds at `opex`, variable cost tracks the AI's month-12 margin, cash flow accumulates, and break-even is recomputed across all 36. Rationale: the free model can't reliably emit 36 months of consistent JSON inside the timeout, so we keep the AI call small and extend deterministically. **Projection disclosure is REQUIRED** — the results view and the PDF both label months 13–36 as *projected, not model output* (`aiMonthCount` marks the boundary). Bound to live output — no mock arrays. Non-blocking warnings for unhealthy inputs (tight unit economics, >30% MoM growth, small TAM, high churn).

**Dedicated inputs page (LIVE).** The flow is **business plan → forecast-inputs → forecast (results)**. The old "3.1 Financial Modeling Inputs" screen (which discarded its values) was **REMOVED**; `/phase-3` now redirects to the business plan. `forecast-inputs/page.tsx` collects the 5 inputs (arpu, opex, monthlyGrowthPct, tam, monthlyChurnPct), **pre-fills from the last generation** (exposed via the session API), and its "Generate" persists them on the new `ForecastSession.Inputs` and starts the job. The forecast page is **results-only** and redirects to the inputs page when no session exists. The stored inputs drive both the AI prompt and the 13–36 derivation and survive regenerate.

**Timeout/poll envelope:** the OpenRouter HTTP timeout is **120s** (`OpenRouter:TimeoutSeconds`), and the shared frontend poll ceiling is **96 attempts / 4 min** (§5.5) so it outlasts the backend worst case.

### 5.2 Module — Business Plan (C-3, LIVE)

9 sections. This is the canonical taxonomy — an older design doc's "5 editable / 4 auto-derived" split is SUPERSEDED, do not use it.

| # | Section | Source | Badge |
|---|---------|--------|-------|
| 1 | Executive Summary | C-3 | — |
| 2 | Problem & Solution | Clarifier | — |
| 3 | Target Market | Clarifier | `auto_built_phase2` |
| 4 | Business Model | C-3 | — |
| 5 | Competitive Landscape | C-3 | `ai_researched` |
| 6 | Go-to-Market | C-3 | `auto_built_43` |
| 7 | Financial Projections | live C-4 forecast | `auto_filled_3` |
| 8 | Team Needs | live formation.youNeed | — |
| 9 | Funding Requirements | (see P5 note) | `used_in_phase5` |

Sections 7/8/9 read live cross-module data, not hardcoded values. Each section has **Edit** (inline, persists) and **Rewrite** (AI regenerate). Rewrite: 100/day/user Redis limit, 429 with `retryAfterSeconds` on hit, version bump + append-only history.

**KNOWN CAVEAT:** Rewrite regenerates the whole plan (C-3 has no single-section job yet); Edit persists as a display-level override (full edit→C-3 splice not wired).

**§9 DEPENDENCY NOTE:** §9 currently reads `pathB.seedFunding.totalAsk` from the stale P5 wizard. When the wizard is removed (see P5), §9 must be decoupled — re-source or drop it.

### 5.3 Module — Legal Checklist (LIVE)

12-item deterministic, sector-specific, mandatory vs optional (item `Category`), "Find Specialist" opens a workroom. **Guidance, not a gate (changed 2026-07-24):** legal items never block Phase-3 completion. The checklist is pure self-attestation (checkbox cycling — no upload, no evidence, no verification), so gating on it produced friction, not assurance. Phase 3 completes on **plan + forecast + formation** only; the former shared `MandatoryItemsDone` predicate was deleted along with both of its readers (derivation engine + masterplan endpoint — changed together, no drift). Still true: checklist presence marks Phase 3 "in progress"; `SelectFormationType` auto-completes the company-type item; `CompletedCount` feeds Legal Readiness (0–15, §5.7), the formation skill-gap suggestion, IP valuation, and investor matching. The compliance page's **Continue is always enabled**; outstanding mandatory items are shown as "recommended before launch", never as a blocker.

### 5.4 Module — Formation Generator (LIVE)

Legal structure recommendation (SAS/SAS-U/SARL), team strengths (from clarifier), skill gaps (with Find Specialist). Non-binding at this stage.

### 5.5 Poll policy (R12)

One shared timed-session policy (`creator-ai.ts`) — **96 attempts OR 4 minutes** wall-clock, 2500ms interval. Raised from the original 60/3-min so the poll comfortably outlasts the 120s backend HTTP timeout plus Hangfire pickup (a job must never finish *after* the poll gives up). Timeout state is distinct from failed; retry re-attaches to the same session.

**Consolidation DONE:** the clarifier and ai-processing pages now import the shared constants — the old hardcoded 100-attempt caps were removed (one policy, no copies).

### 5.6 Mock cleanup (R15)

The standalone mock ai-masterplan page (hardcoded financials, fake score "84") was URL-reachable — DELETED. No page may render mock financial data.

### 5.7 Completion gate

Requires the three gated modules — business plan, forecast, formation; returns 422 with the missing module name otherwise (the legal checklist is guidance and never 422s, §5.3). Crucially, "present" means **success-gated, not presence-of-an-id**: business plan and forecast count only when their AI session is `Status == "Completed"` AND `CurrentVersion > 0` (a failed/pending job routes the user back to that step, not past it); formation requires its object. Legal Readiness still scores from checklist completion and can be low or 0 if items are left outstanding — deliberate and honest. All Phase status is **backend-derived** (`ComputePhaseStatus`, pure-read — never a manual write, never mutates data), so re-locking a module leaves downstream data intact. Computes the readiness score with weights 20/20/25/15/20 (Concept Clarity / Market Evidence / Financial Model / Legal Readiness / Team Credibility) → labels **Not Ready / Developing / Strong / Investor-Ready**. Stored and surfaced on the dashboard. This is a Creator-stage score — distinct from the Entrepreneur P7 InvestorReadyScore; do not conflate.

### 5.8 PDF export (LIVE)

A combined **Business Plan + Forecast** document (`PlanForecastPrintView`), reachable from the business-plan and forecast pages. Implementation is an **in-page print view** (browser print → "Save as PDF") — no library, no backend, no infra. The forecast section renders **year-grouped 36-month tables** (Year 1/2/3 blocks, subtotals) with the projection caption from §5.1. Uses the app's **real** design tokens/fonts — **Inter (body/headings) + the app mono for figures**. Note: this project does **not** use Syne / DM Sans / JetBrains Mono; do not spec fonts that aren't installed.

---

## 6. Phase 4 — Offer & setup (pricing + GTM)

**Step 4.1 — Pricing (LIVE):** model selection (subscription / one-time / freemium / usage-based) + 3–5 editable tiers, validated and persisted.

**Step 4.2 — Resource Calculator (MISSING):** team requirements (role/cost/duration), SaaS stack with costs, total launch budget, time-to-launch, budget breakdown %. Not built — backlog.

**Step 4.3 — GTM Roadmap (partly MISSING):** GTM setup inputs are captured (LIVE), but the AI-generated 12-week timeline / weekly tasks / channel-mix visualization is not built. The landing-page generator is a "coming soon" placeholder — no generated artifact.

**Cross-module note:** the `auto_built_43` badge on business-plan §6 lights on GTM-setup completion, not on pricing data injection. "Pricing feeds GTM" is not literally true — the GTM section still renders the P3 plan text unchanged. Real pricing→GTM data injection is a backlog item, not a claim to make in the doc.

---

## 7. Phase 5 — Cross-Roads

The critical decision phase. Two roads. The old four-screen company-formation wizard is REMOVED from canon — see the forbidden block below.

### Path A — Marketplace (Sell / License)

- **AI IP valuation** — **LIVE** (5-factor scoring, 10/day rate limit).
- **NDA gate** — **LIVE**.
- **License-type selector** (exclusive / non-exclusive / term) — **MISSING**.
- **Listing pricing model** (asking price / royalty) — **MISSING**. Today only a boolean "open to purchase/license" + audience toggles exist.

### Path B — The Big Leap (Build)

**Canonical behavior:** choosing Build starts a 30-day backend-authoritative decision timer that leads directly to Level Up (P6). No formation wizard, no cap table, no seed-funding capture in P5.

**STATUS:** the timer is **MISSING** (no field, endpoint, or countdown). Path-B → P6 is currently gated on the old wizard's `seedFunding` — that gate must move to the timer.

**OPEN PRODUCT DECISION:** day-30 expiry behavior is undefined (auto-advance / lapse / nudge). Must be decided before the timer ships.

Company document verification does NOT happen in P5 — it is deferred to Entrepreneur Phase 2. (Formation status in P5 stays "drafted" only — this is correct today.)

### REMOVE / FORBIDDEN in P5

- **REMOVE** the stale four-screen wizard, fully live front-to-back: entity-type selector (SAS/SAS-U/SARL), shareholder/cap-table editor (founder/ESOP %), Seed Funding card, the company-formation and seed-funding endpoints, and the CreatorPathB model. For alpha it is hidden so no user can reach it; full deletion follows once business-plan §9 is decoupled.
- **FORBIDDEN:** showing matched buyers/investors or any match count in Phase 5. Matchmaking does not exist before P6.
- Any "72h path lock" — not canon, not built, do not add.

---

## 8. Phase 6 — Level Up

The platform's most important transition. Two things happen: the Creator becomes an Entrepreneur, and matchmaking unlocks for the first time.

### 8.1 Level Up (LIVE core, partial polish)

- **Atomic Creator→Entrepreneur switch** — **LIVE**. Server-side atomic Mongo transaction: role add + company creation + EntrepreneurProfile + journey flag; idempotent.
- **LEVEL UP badge** — **LIVE** (text/emoji).
- **Confetti** — **MISSING**. Add a confetti celebration on Level Up.

### 8.2 Smart Matchmaking unlock (gated, with a leak to fix)

The rule: matchmaking is unavailable across P1–P5 and unlocks only at P6. The match service correctly hard-gates on `phase == 6`.

**LEAK (fix in progress):** callers were lying to the gate. The P5 seed-funding endpoint, the smart-matches read (client-supplied `phaseContext`), and the investors read all passed or defaulted phase 6, leaking a real match count pre-Level-Up. Fix: derive the caller's real phase server-side (ComputePhaseStatus) and pass that; remove the client `phaseContext` param entirely. Below P6 → empty + zero count on every route.

---

## 9. Open questions (must be resolved, tracked here)

1. Day-30 timer expiry behavior (P5 Path B) — auto-advance, lapse, or nudge?
2. Discovery's future (P2) — revive post-alpha as a real second path? If yes, it must feed the clarifier.
3. localStorage architecture — the optimistic cache demoted to read-through is the agreed direction; confirm no divergence remains.
4. Business-plan §9 re-sourcing — once the P5 wizard is deleted, where does Funding Requirements come from?
5. Five Entrepreneur-side questions (downstream of the P5 canon change): where company type selection, cap table setup, funding ask capture, and legal partner booking now live, plus the 30-day expiry behavior. These sit at the Creator→Entrepreneur boundary and depend on decisions 1 and 4.

---

## 10. Alpha vs full-build summary

**Alpha ship-blockers** (being fixed): KYC bridge, matchmaking leak closed, mock masterplan deleted.

**Alpha fast-follow:** hide stale P5 wizard, fix output-version ordering. *(Discovery is now LIVE — no longer disabled; poll-policy consolidation and the IdeaGenerator model route are DONE — see §11.)*

**Post-alpha backlog:** 30-day timer, SUMSUB, confetti, landing-page + GTM roadmap generation, Resource Calculator, Path-A license/pricing, ApiResponse cleanup, advancePhase round-trip.

---

## 11. Changelog

**2026-07-24 — legal checklist demoted to guidance (Phase-3 gate removed).**
- **Rule:** Phase 3 completes on **plan + forecast + formation**; mandatory legal items no longer block the derivation engine or the masterplan endpoint (both readers changed together; the shared `MandatoryItemsDone` predicate deleted as dead code). Rationale: pure self-attestation — the gate produced checkbox-cycling friction, not assurance. §2, §5.3, §5.7.
- **Unchanged:** checklist presence still marks "in progress"; `CompletedCount` still feeds Legal Readiness ×15, formation skill gaps, IP valuation, and investor matching; `SelectFormationType` still auto-completes company-type. §5.3.
- **UI:** compliance Continue always enabled; outstanding items framed "recommended before launch" (warning tone, non-blocking). §5.3.

**2026-07-24 — multi-idea architecture documented (§1.6, new).**
- **Data model:** `CreatorJourney` reduced to a thin user-level pointer (`ActiveIdeaId`, `LeveledUpIdeaId`, `CompanyId`, Level-Up markers); all phase data moved per-idea to the new `CreatorIdeas` collection. Journey's frozen phase blocks must not be read or written. §1.6.1.
- **Anchor:** `CreatorIdea._id` minted at Phase-2 finalize (both paths converge on one idea); sessions carry it via `BusinessIdeaId`; regeneration reuses the same anchor; idea-generation sessions deliberately unstamped. §1.6.2.
- **`?ideaId=` contract:** optional on every idea-scoped endpoint — explicit → owned-or-404, absent → active; finalize endpoints converge on active by design. §1.6.3.
- **Per-idea status + Level Up:** derivation per idea; Phase 6 completes only for `LeveledUpIdeaId == idea.Id`; Level Up once-per-user (second idea → 409); further idea creation allowed. §1.6.4.
- **Lifecycle + frontend gating:** list/create/switch endpoints; create/switch navigation gated on verified `HydrateResult`. §1.6.5.
- **Write-scoping rule:** all writes scoped to the idea they were initiated for (debounce capture-at-queue, Discovery `&idea=` URL chain, cross-idea response guard). §1.6.6.
- **Migrations:** both backfills idempotent + startup-invoked; guards documented so nobody expects a re-copy. §1.6.7.
- **REMOVED/FORBIDDEN:** the cutover-era journey mirror (dual-write) — undefined with two ideas; must never return. §1.6.8.

**2026-07-23 — reconciled with code (Phase 2/3).**
- **AI provider:** consolidated to single-provider OpenRouter `openai/gpt-oss-20b:free` for all tasks; removed the Anthropic-Claude / meta-llama split (no `AnthropicClient` exists). §1, §4, §5.
- **Discovery (P2):** now LIVE — both entry cards ship; Discovery seeds a Completed clarifier session at `finalize-discovery` (skips the clarifier, satisfies the P3 chain); mid-flow resume derived server-side (2C-2) + resolver-mapped (2C-3); stale "Discovery removed" comments corrected. §2, §4.
- **AI failure handling:** failed sessions not linked; request-failure vs parse-failure distinguished; HTTP timeouts classified permanent (no Hangfire auto-retry); honest failure UI, never blank. §4.
- **Phase-3 3.1 screen removed:** the "Financial Modeling Inputs" form (discarded values) deleted; `/phase-3` redirects to business plan. §5.1.
- **Forecast:** new **dedicated inputs page** (plan → forecast-inputs → results, inputs persisted + pre-filled); **36-month horizon = 12 AI + 24 deterministically derived** from the user's growth rate, with a required projection disclosure; 120s HTTP timeout. §5.1.
- **PDF export (new):** combined plan+forecast print view, year-grouped 36-month tables. §5.8.
- **Legal checklist gate:** the "all mandatory Done" intent is now **implemented** (shared predicate in derivation + endpoint, uniform, no grandfathering; compliance page gates Continue). §5.3.
- **Phase-3 completion:** documented as **success-gated** (Status Completed + version), not session-id presence. §5.7.
- **Poll policy:** 60/3-min → **96 attempts / 4 min**; clarifier + ai-processing consolidated onto the shared constants. §5.5.

---

*End of Creator canon. Update this doc first, then do not write the code — never the reverse.*
