# Mondial.eco — Creator Flow Canonical Documentation

Source of truth for development. When code and this doc disagree, this doc wins — unless a change is agreed and written back here first.

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
**AI providers:** Anthropic Claude for clarifier / business plan / forecast; meta-llama via OpenRouter for IdeaGenerator.

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

---

## 2. Flow overview (P1 → P6)

- **P1** — KYC + role select
- **P2** — Smart Gate: Path B (already-have-idea → clarifier) is the single alpha entry. Path A Discovery exists but is DISABLED for alpha. Plus project branding + hire-SP-designer.
- **P3** — AI Masterplan: Business Plan + Financial Forecast + Legal Checklist + Formation Generator (4 modules) → readiness score → completion gate.
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

- **YES** → Clarifier (Path B) — the single alpha path.
- **NO** → Discovery (Path A) — DISABLED for alpha.

### Path B — Clarifier (LIVE)

A 6-question AI-guided chat (problem, target customer, differentiation, unfair advantage, GTM approach, 12-month milestone). A live clarity score updates as the user answers. Produces `clarifierSessionId`, which the Phase-3 business plan requires (C-3 start returns 409 without a completed clarifier). Then: name project, brand project.

**Branding (LIVE wiring, STUB AI):** upload logo, skip, AI-generate logo, or hire an M50 designer (match → book → workroom). The AI logo generation and AI name suggestions are deterministic stubs today — functional placeholders, marked to swap to the real AI provider later.

### Path A — Discovery (DISABLED for alpha; do not delete)

The chain (sectors + problem + strengths → IdeaGenerator Hangfire job → concept cards → pick → confirm → name → brand) is fully built and reachable in code, but it has two defects that make it a trap:

1. It never produces a `clarifierSessionId` (it routes idea-confirm → idea-summary, bypassing the clarifier), so a Discovery-only user cannot start the Phase-3 business plan.
2. Its mid-flow resume is broken (resolver only maps later steps).

Therefore the "Explore & Discovery" card is hidden for alpha, making Path B the only entry.

**REMOVE** the false "Discovery removed" code comments — Discovery is live, the comments lie.

**IdeaGenerator provider:** transport is correctly OpenRouter, but the model key doesn't resolve in the router and silently falls back to gpt-4o-mini. Canon requires meta-llama. Fix the model route before Discovery is revived post-alpha.

**Post-alpha revival condition:** Discovery must feed the clarifier so both paths converge with a session ID.

---

## 5. Phase 3 — AI Masterplan

The strongest, most canon-correct phase. Four modules assembled into the Masterplan, then a readiness score, then a completion gate.

**Session chain (enforced):** `clarifierSessionId` → `businessPlanSessionId` (C-3) → `forecastSessionId` (C-4). C-4 start returns 422 if the business plan is missing/incomplete.

### 5.1 Module — Financial Forecast (C-4, LIVE)

36-month P&L simulation (revenue, COGS, OPEX, margins, breakeven) from user inputs. Bound to live output — no mock arrays in the real phase-3 pages. Non-blocking warning flags for unhealthy inputs (tight unit economics, >30% MoM growth, small TAM).

**KNOWN GAP:** the "Financial Modeling Inputs" (3.1) form currently discards its values; the forecast page re-collects inputs. The 3.1 form is decorative and must be wired to actually feed C-4, or removed.

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

12-item deterministic, sector-specific, mandatory vs optional, "Find Specialist" opens a workroom. All mandatory items must be Done to progress.

### 5.4 Module — Formation Generator (LIVE)

Legal structure recommendation (SAS/SAS-U/SARL), team strengths (from clarifier), skill gaps (with Find Specialist). Non-binding at this stage.

### 5.5 Poll policy (R12)

One shared timed-session policy — 60 attempts OR 3 minutes wall-clock; timeout state distinct from failed; retry re-attaches to the same session. Phase-3 pages honor this.

**REMOVE** duplicate copies: the clarifier and ai-processing pages hardcode 100-attempt caps. Consolidate to the shared 60/3-min policy (one policy, no copies).

### 5.6 Mock cleanup (R15)

The standalone mock ai-masterplan page (hardcoded financials, fake score "84") was URL-reachable — DELETED. No page may render mock financial data.

### 5.7 Completion gate

Verifies all 4 modules present, returns 422 with the missing module name otherwise. Computes the readiness score with weights 20/20/25/15/20 (Concept Clarity / Market Evidence / Financial Model / Legal Readiness / Team Credibility) → labels **Not Ready / Developing / Strong / Investor-Ready**. Stored and surfaced on the dashboard. This is a Creator-stage score — distinct from the Entrepreneur P7 InvestorReadyScore; do not conflate.

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

**Alpha fast-follow:** hide stale P5 wizard, disable Discovery, fix output-version ordering.

**Post-alpha backlog:** 30-day timer, SUMSUB, confetti, landing-page + GTM roadmap generation, Resource Calculator, Path-A license/pricing, IdeaGenerator model route, poll-policy consolidation, ApiResponse cleanup, advancePhase round-trip.

---

*End of Creator canon. Update this doc first, then do not write the code — never the reverse.*
