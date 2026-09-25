# MONDIAL BUSINESS CREATION (MBC) — Creator Flow Canonical Documentation

Source of truth for development. When code and this doc disagree, this doc wins — unless a change is agreed and written back here first.

**Last reconciled with code: 2026-09-25 (Creator Phase 4.5 Aids, Grants & Public Support Delivery: Exact Figma 57221-11932 Alignment, Analytical Breakdown, Location Persistence, Audit Trace & Concurrency Delivery).** See the Changelog (§11) for what changed. If a claim here contradicts the code, treat it as drift to reconcile — not a spec to build back toward — and confirm before acting.

---

## RC1 Status & Certification

> [!IMPORTANT]
> **Status: Creator MVP RC1 — Frozen**  
> **Final Verification Verdict:** `PASS WITH MINOR DOCUMENTED LIMITATIONS`  
> **Certification Date:** 2026-09-19  
> **Scope:** Full-stack Creator MVP (Phases 1–6) across database, security, and UI tiers.
>
> - **Critical Blockers:** 0
> - **Unresolved HIGH Security Vulnerabilities:** 0
> - **Unresolved HIGH Data Integrity Defects:** 0
> - **Stage 10 Live Preservation Check:** `PASS`
> - **Stage 10 Live Idempotency Check:** `PASS`
> - **Four-Surface Freshness Consistency:** `PASS`
> - **Two-Real-User Cross-Tenant JWT Test:** `PASS` (7/7 IDOR attacks returned HTTP 403 Forbidden; 0 HTTP 200 data leaks)
> - **Directory Traversal Two-Tier Guard:** `PASS` (Router normalization [404] + Canonical-root guard [403])
> - **Backend Test Suite:** 2,137 discovered | 2,008 passed | 0 failed | 129 skipped (legacy marketplace/escrow) | 0 blocked
> - **Frontend Test Suite:** 122 / 122 files passed | 1,050 / 1,050 tests passed | 0 TypeScript errors | 183 / 183 Next.js routes compiled
> - **Responsive Viewport Audit:** 0px horizontal overflow across 375px, 768px, 1440px, and 1920px viewports (authenticated creator sessions).

---

## Creator MVP Core Freeze Policy

Following the successful RC1 live verification pass on 2026-09-19, the Creator MVP is in formal **Code & Feature Freeze**.

### Allowed Changes Post-RC1:
- Critical bug fixes (crashes, unhandled exceptions, data loss, severe performance regressions)
- Security fixes (authorization bypasses, tenant isolation leaks, injection vulnerabilities)
- Regulatory/legal rule updates (statutory revisions to FR-2026.1 or official authority references)
- Production UX defects (alignment breaks, styling regressions, typography token drift)
- Deployment and environment configuration fixes (connection strings, timeouts, container flags)

### NOT Allowed Without Deliberate Post-RC1 Planning:
- New Creator architecture or schema refactorings
- New Creator phases or out-of-scope stages
- New major features or capabilities
- Flow redesigns or navigation restructuring
- New funding or banking modules

---

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
**AI provider:** Single-provider **OpenRouter**. Every AI task (probe, clarifier, business plan, forecast, IdeaGenerator) routes to `google/gemini-3.8-flash` (`backend/appsettings.json` → `ModelRouting`). This is a **deliberate consolidation** — the earlier Anthropic-Claude / meta-llama split was removed; there is **no `AnthropicClient` in the codebase**. Do not "restore" Anthropic or a per-task model split to match older notes. Capabilities are metered and credit-gated via the user's credit balance; a missing `OpenRouter:ApiKey` fails fast at startup (`StartupConfigValidation`).

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

### 1.7 AI credit metering, token limits & starter grant
Capabilities are credit-metered against server-authoritative balance and capability costs (`GET /api/ai/credits`). Current standard starter grant is **200 credits** on onboarding or first AI call (`Ai:StarterCredits = 200`). Current costs: `IdeaClarifier`: **20**, `MarketStudy`: **20**, `BusinessModel`: **18**, `BusinessPlan`: **33**, `BusinessPlanSectionRewrite`: **5** (provisional), `Forecast`: **32** (provisional), `IdeaGenerator`: **0**, `Probe`: **0**, `DirectionGeneration`: **7**, `LogoParameterSelection`: **4**, `LogoConceptRegenerate`: **0** (free local SVG redraw, not an AI job), `ColorGeneration`: **2**, `TypographyGeneration`: **2**. Exhaustion triggers HTTP 402; failed generations auto-refund under Option A without deterministic fallback substitution.

Output token ceilings are dynamically configured via `Ai:OutputTokenLimits` in `appsettings.json` (`IdeaGenerator: 3500`, `IdeaClarifier: 3500`, `MarketStudy: 7500`, `BusinessModel: 8500`, `BusinessPlan: 7500`, `Forecast: 8000`, `Probe: 500`, `DirectionGeneration: 4500`, `LogoParameterSelection: 3000`, `ColorGeneration: 4500`, `TypographyGeneration: 2000`) with safe fallback constants in handlers.

### 1.8 Honest-Labelling & AI Glyph Canon
The sparkle glyph (`Sparkles`, `WandSparkles`) and any `"AI-powered"` or `"AI generated"` phrasing appear **strictly and exclusively** where a genuine generative model call executes through the AI provider (e.g. Idea Clarifier, Direction Board, Logo Concept generation, Colour/Typography generation, Market Study, Business Model, Business Plan, Financial Forecast).

Deterministic rule engines (corporate formation structures, partner skill matching), algorithmic string manipulation (concept name suggestions), and static pre-authored files (legal contract templates) must **never** carry the sparkle glyph or be represented as AI work.

### 1.9 Single Source of Truth & Zero Bypassing (Permanent Standing Check)
Across the codebase, frontend components, handlers, and export routines must **NEVER** construct parallel ad-hoc logic, hardcoded fallback constants, or manual string concatenations when a canonical backend API, configuration key, or shared resolver exists in the repository.

Three historical drift incidents establish this permanent architectural mandate:
1. **Credit Costs**: UI labels must never hardcode credit amounts (e.g. `"7 credits"`); costs are dynamic and must be fetched from `GET /api/ai/credits` (`Ai:CreditCosts`).
2. **Output Token Ceilings**: Handlers and prompt engines must never define hardcoded token limits; ceilings must be loaded dynamically from `Ai:OutputTokenLimits` in `appsettings.json`.
3. **Media & Asset URLs**: UI components and export packagers must never hand-assemble asset URLs (e.g. `/brand-assets/...` or ad-hoc origins); all brand and media URLs must strictly resolve via `resolveMediaUrl(uri, version)`.

**Standing Check**: When reviewing or implementing any feature, verify that existing canonical resolvers, configs, and APIs are consumed rather than bypassed.

---

## 2. Flow overview (P1 → P6)

### PHASE 1 — KYC + Role Selection
Email OTP, Phone OTP, Identity Document Upload, Role Selection (`Creator` / `Entrepreneur`).

### [GATE] HUMAINX QUICK START (`/dashboard/creator/humainx`)
Mandatory Creator-only 3-screen frontend journey gate positioned directly after universal onboarding and before Creator Dashboard access:
- **Scope & Isolation:** Strictly Creator-only (`normalizeUserRole(user?.role) === UserRole.CREATOR`). It is NOT authentication, backend authorization, a global role gate, a second profile entity, or a replacement for Phase 4 backend validation.
- **Screen 1: Your Situation** — Region, CurrentSituation, WeeklyAvailability in canonical `ProfessionalProfile.VentureContext`. Advancing requires validating, persisting, and marking `step1Confirmed`. Never redirects directly to Dashboard.
- **Screen 2: Your Skills** — Skills[] (minimum 1 skill required; every skill must have a valid level: `Beginner`, `Comfortable`, `Advanced`). No synthetic skill fallback is allowed. The former fake `"General Business / Comfortable"` completion bypass is completely removed. Visual footer link cannot bypass validation or create synthetic data. Step 2 continue persists and marks `step2Confirmed` before advancing to Step 3. Never redirects to Dashboard.
- **Screen 3: How You Build** — `PreviousEntrepreneurialExperience` and progress preference mapped to canonical `LearningPreference` and `DelegationPreference` (4 options: `"I'd rather learn it"`, `"I'd rather hand it off"`, `"A bit of both"`, `"Help me decide"`), round-trip distinguishable after reload.
- **Critical Dual-Gate Architecture:**
  - *Profile Data Completeness* and *Quick Start Journey Completion* are strictly separate concepts.
  - Creator Dashboard access requires: `isQuickStartComplete(profile) && isQuickStartJourneyComplete(userId)`.
  - Conceptually: `DashboardAllowed = ProfileDataComplete && JourneyCompleted`.
- **Frontend Journey State Model:**
  ```typescript
  interface HumainXJourneyState {
    step1Confirmed: boolean;
    step2Confirmed: boolean;
    step3Confirmed: boolean;
    completed: boolean;
  }
  ```
  Scoped per authenticated Creator user ID, persisted browser-locally in localStorage (`humainx_journey_state_${userId}`). It is UX state only and never duplicates business data.
- **CURRENT FRONTEND-ONLY UX PERSISTENCE LIMITATION:**
  Because journey state is browser-local: same account + same browser persists; different browser/device or cleared storage requires re-confirming wizard steps. `ProfessionalProfile` remains the durable account-level business data in MongoDB.
- **Autosave Rule:** 400ms debounced autosave persists profile data only. Autosave MUST NOT confirm Step 1, confirm Step 2, complete Step 3, complete Quick Start, or unlock the Creator Dashboard. Only explicit CTA button actions change journey confirmation state.
- **Only Final CTA Completes Quick Start:** Only the explicit `"Start my project"` CTA on Step 3 can mark `step3Confirmed` and `completed: true`. Sequence: flush pending autosave → persist latest data → save succeeds → reconcile profile → profile completeness passes → confirm steps → mark completed → navigate to Creator Dashboard.
- **Pre-Existing Data Rule:** Pre-existing `ProfessionalProfile` data prepopulates screens but CANNOT skip wizard steps.
- **Sequential Navigation Enforcement:**
  - `step1Confirmed === false` → maximum allowed screen is Step 1.
  - `step1Confirmed === true && step2Confirmed === false` → maximum allowed screen is Step 2.
  - `step1Confirmed === true && step2Confirmed === true && completed === false` → Step 3.
  - `completed === true && isQuickStartComplete(profile)` → Dashboard.
  Manual query parameter tampering cannot bypass step gating.

### PHASE 2 — Project Identity & Branding
```text
Clarifier (/phase-2/clarifier)
→ Idea Summary (/phase-2/idea-summary)
→ Project Name (/phase-2/concept-name)
→ Branding Gateway (/phase-2/branding)
   ├─ MBC Brand Studio (/phase-2/brand-studio)
   ├─ M50 Designer (Marketplace specialist booking)
   └─ Skip (skipBranding() directly to completion)
→ Brand Kit (/phase-2/brand-kit) / Completion (/phase-2/complete)
```

### PHASE 3 — Business Plan Intelligence (7-Step Masterplan)
```text
3.1 Market Intelligence (/phase-3/market-study)
→ 3.2 Business Model (/phase-3/business-model)
→ 3.3 Financial Forecast (/phase-3/forecast)
→ 3.4 Legal & Compliance (/phase-3/compliance)
→ 3.5 Company Formation & Team (/phase-3/formation)
→ 3.6 Executive Business Plan (/phase-3/business-plan — 12 canonical sections)
→ 3.7 Investor Readiness (/phase-3/complete — 5 canonical weighted dimensions)
```

### PHASE 4 — Construction & Launch Preparation (Canonical Engine — 4.1 → 4.7 LIVE)
```text
4.1 Construction Snapshot (/dashboard/creator/phase-4)
→ 4.2 Operational Roadmap (/dashboard/creator/phase-4/roadmap)
→ 4.3 Needs & Requirements (/dashboard/creator/phase-4/needs)
→ 4.4 Skills & Training (/dashboard/creator/phase-4/skills)
→ 4.5 Aids, Grants & Support (/dashboard/creator/phase-4/support)
→ 4.6 Pricing & Revenue Model (/dashboard/creator/phase-4/pricing)
→ 4.7 GTM & Launch Strategy (/dashboard/creator/phase-4/gtm)
→ 4.8 Launch Assets (Next approved stage — One-Page Professional Launch Website)
→ 4.9 Construction Readiness (Reserved for final certification)
```

### PHASE 5 — The Cross-Roads (30-Day Decision Window)
```text
Path A: Marketplace (Active offers: Full Buyout OR Co-Founder / Equity)
Path B: The Big Leap (Private venture spinout → Level Up; NOT a marketplace offer)
```

### PHASE 6 — Level Up (Continuation, Not Restart)
```text
Atomic Creator → Entrepreneur Level Up
→ Entrepreneur Workspace (/dashboard/entrepreneur)
```

Gating is strict: no skipping steps; user can always go back one step; completed steps are editable; leaving mid-step auto-saves to the backend.

---

## 3. Phase 1 — KYC + role select

> [!NOTE]
> **Historical / Superseded Architecture Note (September 2026 Baseline)**:
> The canonical Universal Onboarding Gate (Phase 0 $\to$ Phase 1) is documented in [09-universal-identity-and-onboarding.md](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/docs/system-architecture/09-universal-identity-and-onboarding.md). For the current production MVP, Universal Onboarding requires **Email OTP + Phone OTP**; Identity Document Verification is automated via Sumsub WebSDK and deferred (`FeatureFlags:RequireIdentityVerificationInUniversalOnboarding = false`); face/biometrics has been permanently removed.

**Purpose:** verify identity and lock in the Creator role before any dashboard access.

**Steps:** email OTP, phone OTP, identity document upload, role selection.

The Phase-1 completion gate promotes onboarding to Phase 1 based on verified core items (email, phone, identity document) on the Onboarding model. Promotion is derived — no manual phase writes.

### Status:

- **Email OTP, Phone OTP** — **LIVE** (HMAC-hashed, expiring, rate-limited).
- **Role selection persistence** — **LIVE** (set at signup, read via onboarding status + JWT role claim).
- **Identity verification** — was STUB (only dev-only endpoints wrote the flags). Fixed via the KYC bridge: admin approval of uploaded docs sets the onboarding identity flag and re-runs promotion, so a concierge-approved user clears the gate in production. Reject is symmetric (clears the flag + re-evaluates). Sumsub document-only verification is wired and gated via feature flags; face/biometrics has been permanently removed.
- **Role selection UI status** — **LIVE** (reads real role dynamically from onboarding status and profile data).

**Alpha rule:** KYC clearance is by admin (concierge) approval or Sumsub document mode.

---

## 4. Phase 2 — Project Identity (CLOSED & STABLE — 2026-09-18)

> [!IMPORTANT]
> **Phase 2 Closure Canon (Declared Closed & Stable: September 18, 2026)**
> Creator Phase 2 is frozen and declared production-stable. No new features, scope expansions, or visual redesigns are permitted. Maintenance is restricted strictly to critical bug fixes, ensuring the verified 7-step modal studio workflow, 0-credit free steps, and transparent credit metering remain immutable.

Phase 2 has been intentionally simplified to a single canonical, linear journey:

```text
/phase-2
→ /phase-2/clarifier
→ /phase-2/idea-summary
→ /phase-2/concept-name
→ /phase-2/branding
→ branding branch (M50 designer / logo-tool / skip)
→ /phase-2/complete
→ Phase 3
```

Entering `/dashboard/creator/phase-2` automatically sets `entryPath = "already_have_idea"` and `project.exists = true`, performing an immediate redirect to `/dashboard/creator/phase-2/clarifier`. There is no Smart Gate choice and no dual-path selection.

### Canonical Journey — Idea Clarifier (LIVE)

A 6-question conversational AI-guided clarifier (core problem, target user, existing alternatives, proposed solution, unfair advantage / founder edge, riskiest assumption & timing). Answers are appended to the journey chat transcript and can be resumed at any time. Produces a live `clarityScore` and `clarifierSessionId`, which finalizes canonical project fields into `CreatorJourneyProject` (and mirrors to `CreatorIdea`). The completed clarifier satisfies the Phase-3 prerequisite chain (Phase 3 C-3 start requires a clarified project).

Following the Clarifier:
1. **Idea Summary (`/phase-2/idea-summary`):** Displays the structured concept summary and clarity score. The "Revisit" button routes directly back to `/phase-2/clarifier`.
2. **Concept Name (`/phase-2/concept-name`):** Names the project based on clarified concept context.
3. **Branding Entry (`/phase-2/branding`):** Reconciled single-card presentation (`max-w-[680px]`, "Brand Visual Identity Studio", light/dark theme tokens, no icon tile per updated Figma revision) highlighting 6 concrete deliverables, body copy in DM Sans (`font-sans`), a single filled primary blue CTA ("Open Brand Studio") routing to `/dashboard/creator/phase-2/brand-studio`, and a quiet secondary "Skip for now" action that calls `creatorJourneyApi.skipBranding()` and navigates directly to `/complete`.
4. **Phase 2 Complete (`/phase-2/complete` — Figma Node `57007-12780`):** Redesigned canonical completion screen (720px centered container) reading live `BrandKit` from `brandKitApi.getBrandKit(ideaId)` and `CreatorIdea.Project`. Features:
   - **Header Cluster:** 56px circular checkmark badge, `"✓ Phase 2 complete"`, project name, and dynamic category/tagline subline.
   - **Card 1 (Brand Kit Showcase):** `"BRAND KIT READY"` badge pill, `"Open Brand Kit"` link (`/phase-2/brand-kit`), 200px Logo Hero Band rendering dynamic SVG/PNG mark and typography, plus a 3-column lower specimen grid (5-role Colours swatches, Typography pairing, and 4 Logo Form chips: Horizontal, Stacked, Dark, Light).
   - **Card 2 (Project Summary):** Mark avatar tile, project title, tagline, category badge pill, and 2×2 facts grid (Target Audience, Positioning, Core Problem, Personality badges).
   - **Card 3 (Next Phase Strip):** `"Next: Phase 3 — Business plan"` with `"4 TOOLS"` badge previewing Financial forecast, Business plan, Legal checklist, and Formation generator.
   - **Footer Navigation:** Primary `"Continue to Phase 3"` (`/dashboard/creator/phase-3`), with secondary `"Back to dashboard"` (`/dashboard/creator`) and `"Edit Brand Kit"` (`/dashboard/creator/phase-2/brand-studio`).

### Brand Visual Identity Studio & Hub (LIVE)

The Brand Visual Identity Studio provides a calm, generative studio workflow across 7 user-facing modal steps followed by a persistent Brand Kit Hub page. Persisted in the dedicated `BrandKits` collection (`BrandKit`) bound 1:1 to each `CreatorIdea` via `BusinessIdeaId` (unique index on `IdeaId`). Fully compiled and verified clean in full-solution #### 1. Studio Frontend Architecture
- **Studio Shell (`/dashboard/creator/phase-2/brand-studio`):**
  - **Persistent Overview / Control Center:** Brand Studio operates as a persistent View Mode workspace, not a sequential wizard page. The legacy persistent wizard-style topbar (`BrandStudioProgressBar`) has been completely removed.
  - **Removed Legacy Topbar UI:** Back, INSTALY, Visual Identity Studio, Strategy, Direction, Logo type, Logo, Colour, Typography, Studio Live, all step icons, progress connectors, active/locked state styling, connecting lines, and the `VIEW MODE` badge.
  - **Removed UI-Only State:** Obsolete topbar-only state/handlers were removed from `BrandStudioShell.tsx` (`inFlightStatus`, `stepSegments`, `currentProgressBarKey`, `handleSelectStep`, `handleBackNavigation`) and redundant `onBack` handler in `page.tsx`. Core modal orchestration state (`activeModal`, `isSequentialFlow`) is preserved.
  - **Streamlined Persistent Header:**
    - Title: `Brand Studio`
    - Subtitle: `Your Visual Identity — Review and manage your complete brand identity.`
  - **Control Center Principle:**
    - **Page = persistent overview/control center**
    - **Modals = creation and editing tools**
  - **Accumulated Section Cards:** The overview renders persistent cards for all brand aspects (`StrategyResultCard`, `DirectionResultCard`, `LogoResultCard`, `ColorsResultCard`, `TypographyResultCard`, and Final Brand Assets). Incomplete sections render `IncompleteSectionCard` with action buttons.
- **Canonical Brand Studio Entry & Modal Orchestration:**
  - **Brand-New Creator (No Meaningful Brand Data):**
    ```text
    Brand Studio loads
    → BrandKit resolves
    → no meaningful brand data (hasMeaningfulBrandData === false)
    → isSequentialFlow = true
    → StrategyReviewModal auto-opens
    → Visual Direction (DirectionBoardModal)
    → Logo Type (LogoTypeChooserModal)
    → Logo Creation (LogoCreationModal)
    → Logo Variations (VariationSetModal)
    → Color System (ColorSystemModal)
    → Typography (TypographySystemModal)
    → Brand Studio View Mode (activeModal = null)
    ```
  - **Existing / Partial Brand:**
    ```text
    Brand Studio loads
    → meaningful data exists (hasMeaningfulBrandData === true)
    → View Mode (activeModal = null)
    → no modal auto-opens
    ```
  - **Edit Existing Section:**
    ```text
    View Mode
    → Creator clicks "Edit" on a specific section
    → isSequentialFlow = false
    → corresponding modal opens only
    → Save
    → modal closes (handleStepTransition(null))
    → updated View Mode overview
    ```
- **First-Time Creator Entry & Transparent Auto-Provisioning:**
  - When a Creator clicks "Open Brand Studio" on `/phase-2/branding`, the router navigates to `/dashboard/creator/phase-2/brand-studio`.
  - `BrandStudioShell` mounts and invokes `brandKitApi.openStudio(ideaId)`.
  - On the backend, `POST /api/creator/journey/phase2/brand-kit/open-studio` checks for an existing `BrandKit`. If none exists (first-time creator), it transparently auto-provisions a fresh draft kit via the shared `GetOrCreateBrandKitAsync` helper (deriving initial `BrandStrategy` from `idea.Project` and seeding default 5-role Colour and 4-role Typography defaults), returning HTTP 200 with the newly created kit.
  - Studio immediately initializes and auto-opens Step 1 (`StrategyReviewModal`) without requiring manual setup button clicks or encountering 404 errors.
  - **Defense-in-Depth Null Guards:** `BrandStudioShell.tsx` `loadStudioSession()` applies optional chaining on every `currentKit` property access and includes fallback creation so missing states never cause runtime unhandled errors.
- **Step 1 Strategy Review & Per-Field Edit Tracking:**
  - `StrategyReviewModal.tsx` tracks 4 core `BrandProvenancedText` fields: `Concept`, `TargetAudience`, `Industry`, and `Positioning`.
  - On backend `PatchStrategy`, modifying any field's `.Value` sets `.EditedAt = DateTime.UtcNow` and `.Provenance = "user_refined"`.
  - In frontend UI, fields with non-null `editedAt` display a real relative timestamp `"EDITED {time} AGO"` (via `date-fns` `formatDistanceToNowStrict`), while unedited fields render `"From your idea"` with no timestamp.
  - `TonePosition` (Formal $\leftrightarrow$ Casual) and `FirstAppearance` (e.g. `website`, `app_icon`, `invoice`, `social`) are fully wired and consumed downstream in `LogoTypeChooserModal` (fit score reasoning), `DirectionGenerationService` & `TypographyGenerationService` (prompt tuning), and `BrandKitHubView` (summary facts).
- **Unified Modal Step Transition Architecture (`handleStepTransition`):**
  - Standardized transition function in `BrandStudioShell.tsx`:
    ```ts
    const handleStepTransition = useCallback(
      (nextModalKey: StudioModalKey | null, updatedKit?: BrandKit) => { ... }
    );
    ```
  - Whenever any modal completes a step, it passes the fresh `updatedKit` directly into `handleStepTransition(nextStepKey, updatedKit)`.
  - In sequential mode (`isSequentialFlow = true`), saves advance to the next modal step in the 7-stage sequence.
  - In standalone edit mode (`isSequentialFlow = false`), saves pass `null` to close the modal and return immediately to the View Mode overview.
- **7 User-Facing Modals (Canonical Step Scheme):**
  1. `StrategyReviewModal` (Stage 1: Brand Strategy)
  2. `DirectionBoardModal` (Stage 2: Visual Direction Board)
  3. `LogoTypeChooserModal` (Stage 3: Architectural Mark Form)
  4. `LogoCreationModal` (Stage 4: Logo Creation)
  5. `VariationSetModal` (Stage 5: Logo Variations Set)
  6. `ColorSystemModal` (Stage 6: Colour System)
  7. `TypographySystemModal` (Stage 7: Typography System)
- **Interface Typography:** Standardized on **Inter** and **DM Sans** for all UI body copy, headings, and labels across all Studio surfaces (Syne Bold was an earlier prototype mock and is NOT used). **JetBrains Mono** is used for all numerals, tokens, and telemetry badges.*DM Sans** for all UI body copy, headings, and labels across all Studio surfaces (Syne Bold was an earlier prototype mock and is NOT used). **JetBrains Mono** is used for all numerals, tokens, and telemetry badges.
- **Shared Components:**
  - `RegenerateCapBadge`: Reused across Direction, Logo Creation, Colour, and Typography to display remaining attempts (`N/3 LEFT` in neutral/muted, transitions to amber `0/3 LEFT` when cap is exhausted).

#### 1b. Billing & Lifecycle Canon: No Silent / Auto-Fire Debiting
- **Origin & Technical Context:** During early prototyping when Brand Studio generation was free and synthetic, modal components were written to automatically populate via `useEffect` mount hooks (`if (!candidates?.length) handleGenerate()`). When `DebitForJobAsync` was wired into backend services, step navigation silently debited credits ($7 + 4 + 2 + 2 = 15$ credits) upon simply viewing steps.
- **Permanent Architectural Rule:** No generation, regeneration, or debiting action may EVER fire automatically on component mount, step navigation, or modal open.
- **Mandatory 3-Part Disclosure & Trigger Requirement:**
  1. **Ungenerated Empty State:** Opening an ungenerated step must display an informative empty state explaining what will be generated and what it costs.
  2. **Upfront Cost Disclosure:** The cost must be clearly visible (e.g. `Cost: N AI credits`), sourced dynamically from `/api/ai/credits`.
  3. **Explicit User Trigger:** Generation begins ONLY when the user clicks an explicit action button (e.g. `Generate 4 Directions (7 credits)`).
- **Audit of Studio Free vs Billed Steps:**
  - **Free steps (0 credits, never debited):** Step 1 Strategy Review, Step 2 Adjust strip (palette variant / contrast / display weight tuning), Step 3 Logo Type selection, Step 4 Single Concept Redraw (deterministic local SVG math) & Variation Set derivation (deterministic SVG layout), Step 5 Color Mood switching & manual hex tuning, Step 6 Typography pairing presets & manual size/weight tuning.
  - **Billed steps (dynamic credit debit):** Step 2 Direction Generation (7 credits), Step 4 Logo Concept Batch (4 credits), Step 5 Color System Generation/Regeneration (2 credits), Step 6 Typography Generation/Regeneration (2 credits).

#### 2. Per-Modal Behavior & Interaction Rules
1. **Strategy Review Modal (`StrategyReviewModal` — Step 1: "Strategy"):**
   - Initial automatic derivation from `CreatorIdea.Project`:
     - `Project.Name` $\to$ `BusinessName`, `NameDisplayForm`
     - `Project.Concept` (fallback `Project.Solution`) $\to$ `Concept` (Provenance: `stated` if from project, `derived` if fallback)
     - `Project.TargetUser` $\to$ `TargetAudience` (`stated` / `derived`)
     - `Project.Category` (fallback `Project.Tags[0]`) $\to$ `Industry` (`stated` / `derived`)
     - `Project.MarketGap` (fallback `Project.Solution`) $\to$ `Positioning` (`stated` / `derived`)
     - `Project.Tags` + `Project.CreatorEdge` $\to$ `PersonalityTraits` (default fallback: `["Precise", "Resilient", "Autonomous"]`)
     - Category keywords $\to$ `AvoidList` heuristics (e.g. avoiding cliché padlocks/shields for cyber, leaves/wheat for agri).
   - Creators can freely edit personality traits and avoid items with zero credit cost.
2. **Direction Board Modal (`DirectionBoardModal` — Step 2: "Direction", Figma Node `57012:9066`):**
   - Canonical Title: `"Pick a visual direction"` (`font-heading font-semibold 26px`), Subtitle: `"This sets the visual language. Logos are drawn inside the direction you pick."` (`DM Sans 14px text-muted-foreground`).
   - Generates exactly 4 distinct visual directions via generative model call (`AiJobType.DirectionGeneration`, **7 credits**), enforcing a 3-regeneration cap (`RegenerateCount <= 3`, amber badge `[N]/3 LEFT`).
   - **Visual Direction Filter Strip ("SHOW ME"):** Filter chips (`All four`, `Calmer`, `Bolder`, `More technical`) allowing creators to re-sort directions instantaneously without consuming credits or regenerations.
   - **2x2 Direction Boards Grid (24px Gutters, Height-Matched):**
     - *Preview Band (200px tall):* Distinct abstract style specimen (`SPECIMEN · GRID 01`, `DIRECTION 02`, `SPECIMEN · ORGANIC 03`, `SYSTEM // SYS_04`) with large `Aa` specimen and archetype subline, plus a pinned 24px primary check badge on active selection.
     - *Four-Swatch Colour Strip (28px tall):* Edge-to-edge color palette representation.
     - *Body Area (20px padding):* Direction name, `ACTIVE SELECTION` pill, descriptive feel line, and `WHY THIS FITS` rationale.
     - *Footer Row:* Individual font pairing pills (`[ Display Family ]` `+` `[ Text Family ]`) and single-card selection/action button.
   - Free interactive **Adjust strip** (Palette variant, Contrast balance, Display weight) persisted directly via `PATCH /direction` without credit cost.
3. **Logo Type Chooser Modal (`LogoTypeChooserModal` — Step 3: "Logo Type", Figma Node `57004:10297`):**
   - **Canonical Title & Subtitle:** Title: `"What kind of logo?"` (`font-heading font-semibold 26px`), Subtitle: `"Pick the form first — then we'll draw six concepts in that form, inside {directionName}."` (`DM Sans 14px text-muted-foreground`).
   - **0 credit cost** and zero regenerate cap (pure structural archetype selection).
   - **Context Strip (56px tall, `bg-muted/40`):** Displays 3 key strategy properties (`YOUR NAME` $\to$ `{businessName} · {charLength} characters`, `FIRST APPEARS ON` $\to$ `{firstAppearance}`, `DIRECTION` $\to$ `{directionName}`) plus the guidance note `"These shape which types work best for you."`
   - **3x2 Grid of 6 Architectural Archetype Cards (24px Gutters, Height-Matched):**
     - 6 Canonical Options: `Wordmark`, `Symbol + Name`, `Monogram`, `Abstract mark`, `Icon`, `Minimal`.
     - *Specimen Band (150px tall):* Neutral generic greyscale archetype specimen.
     - *Top-Right Check Badge (24px):* Primary blue circular checkmark pinned to top-right corner on active selection.
     - *Body Area (20px padding):* Canonical title, subtitle description, and two guidance rows: `Good when:` (green check icon) and `Trade-off:` (dash `—`).
     - *Dynamic Fit Indicator:* Real-time fit badges (`Strong fit for you`, `Workable`, `Tight fit`) computed deterministically from `characterLength`, `wordCount`, `firstAppearance`, and `directionName` with zero mock data.
   - Hands off selected `LogoType` to Logo Creation to filter subsequent concept generation.
4. **Logo Creation & Variations Modals (Step 4: "Logo"):**
   - **4a. Logo Creation Modal (`LogoCreationModal`, Figma Node `57004:10578`):**
     - **Canonical Title & Subtitle:** Title: `"Choose your logo"` (`font-heading font-semibold 26px`), Subtitle: `"Six {logoTypeName} concepts, drawn inside {directionName}. Pick the one you'd defend to a customer."` (`DM Sans 14px text-muted-foreground`).
     - **Batch Regeneration in Header:** `"Redraw all six"` button + `[N]/3 LEFT` amber cap badge (4 credits, capped at 3 batch redraws).
     - **Dedicated View Bar (48px tall):**
       - "SHOW AS" filter chips: `Mark only`, `On an invoice`, `At 16px`.
       - Right action & counter: `Compare two` toggle + `6 CONCEPTS` badge.
     - **3x2 Concept Tiles Grid (24px Gutters, Height-Matched):**
       - *Mark Stage (200px tall):* High-res SVG mark / lockup from C# backend with dynamic business name and pinned 24px primary circular check badge on active selection.
       - *Card Footer (16px padding):* `CONCEPT 01` .. `CONCEPT 06` mono tag, live `descriptorLine` from backend, `SELECTED` primary badge, and single-concept redraw icon button (`Redraw just this one`, Free local SVG redraw, 3-cap).
     - **Compare Overlay (`CompareOverlay`):** Side-by-side comparison modal with Light/Dark canvas toggles and winning concept selection.
   - **4b. Approved Logo Variation Set Modal (`VariationSetModal`, Figma Node `57004:11174`):**
      - *(Canonical Specification in [brand-identity-studio-canon.md](brand-identity-studio-canon.md))*
      - **Header Cluster:** Title `"Your logo, in every form"`, Subtitle `"Seven variations built from Concept {N}. Same geometry throughout — only arrangement and colour change."`, Top action `"Download set"` button (DM Mono) + `"STEP 4 OF 6"` badge + Close button.
      - **Batch Summary Metadata Strip:** 4 inline metadata pairs separated by subtle hairline vertical dividers:
        - `SOURCE` $\to$ `Concept {N}`
        - `VARIATIONS` $\to$ `7`
        - `FORMATS` $\to$ `SVG + PNG`
        - `COST` $\to$ `Free, derived`
        - Right-aligned emerald outline pill badge: `✓ No credits used`
      - **7 Deterministic Logo Variation Tiles (3 Wide + 4 Compact Grid):**
        1. `PRIMARY` (`3:1` aspect ratio): Master full-color lockup with pinned green `PRIMARY` badge.
        2. `HORIZONTAL` (`4:1` aspect ratio): Compact lockup for navigation bars & email signatures. Hover download and redraw actions with `"Redraw just this variation"` tooltip.
        3. `STACKED` (`1:1` aspect ratio): Centered emblem lockup for square avatars, app tiles & packaging.
        4. `ICON-ONLY` (`1:1` aspect ratio): Standalone mark with 3 micro-scale fidelity proofs (`64px`, `32px`, `16px`).
        5. `BLACK` (`3:1` aspect ratio): Single-ink 100% solid black lockup for dark monochrome printing & laser engraving.
        6. `WHITE` (`3:1` aspect ratio): 100% pure white knockout on isolated dark ground (`#0A1128`).
        7. `TRANSPARENT` (`3:1` aspect ratio): 32-bit RGBA alpha channel preview with checkerboard background and `PNG · ALPHA` corner chip.
      - **Footer Actions:** Left-aligned `"Export ZIP"` (`.zip` archive containing all 7 SVGs + high-res PNGs), and Right-aligned Primary CTA `"Approve all seven"` (persists server-side `approvedAt` and advances journey).
5. **Colour System Modal (`ColorSystemModal` — Step 5: "Colour", Figma Node `57004:11484`):**
   - *(Canonical Specification in [brand-identity-studio-canon.md](brand-identity-studio-canon.md))*
   - **Canonical Header & Subtitle:** Title: `"Your colour system"`, Subtitle: `"Five roles pulled from your logo. Each one has a job — change any of them without touching the rest."`, `"Regenerate palette"` button with `[N]/3 LEFT` amber cap badge, `"STEP 5 OF 6"` badge.
   - **Palette Mood Filter Strip ("PALETTE MOOD"):** 4 instant tuning chips (`As generated`, `Calmer`, `Warmer`, `Higher contrast`) with zero credit cost (`"Switching mood is free — it doesn't use a regenerate."`).
   - **5 Canonical Role Rows (Section A):** Single card with divided rows for `Primary`, `Secondary`, `Accent`, `Background`, `Text` featuring 68×68 swatch well, HEX editor with copy action, RGB triplet, real-time WCAG 2.1 AA/AAA contrast ratio rating against background ground, individual slider adjust button, and lock toggle against regeneration.
   - **Live Application Preview ("How it looks together", Section B):** Segmented control with 3 interactive preview modes (`Website`, `Invoice`, `Deck`) rendered on dynamic background color.
   - **Server-Side Confirmation (`Colors.ConfirmedAt`):** Confirming the Colour System sends `confirmedAt: ISO timestamp` via `PATCH /colors`, and `CreatorBrandKitController.cs` records a genuine server-side UTC timestamp in `kit.Colors.ConfirmedAt`. Step 6 prerequisite sequencing in `CheckStepPrerequisite(6)` and `CheckPatchPrerequisite("typography")` strictly requires `kit.Colors.ConfirmedAt != null`.
6. **Typography System Modal (`TypographySystemModal` — Step 6: "Typography", Figma Node `57004:11793`):**
   - *(Canonical Specification in [brand-identity-studio-canon.md](brand-identity-studio-canon.md))*
   - **Canonical Header & Subtitle:** Title: `"Your typography"`, Subtitle: `"Two families, four roles. The display face carries personality; the text face carries everything people actually read."`, `"Suggest other pairings"` button with `[N]/3 LEFT` amber cap badge, `"STEP 6 OF 6"` badge.
   - **Pairing Choice Grid ("PICK A PAIRING"):** 3 curated pairing candidate cards (`Syne + DM Sans`, `Plus Jakarta Sans + Inter`, `Space Grotesk + Inter`) with live brand name display specimen, subline text specimen, and metadata badges (`Open licence`, `weights`, `file size`).
   - **Four Roles Specimen Editor ("FOUR ROLES"):** Single unified card with 4 divided rows:
     1. `Logo type` (ROW 1 - LOCKED STATE): Structurally bound to the approved logo concept (`"Locked to your wordmark."`), immutable.
     2. `Heading`: Display face specimen with font weight selector and size stepping.
     3. `Body`: Text face multi-line paragraph specimen with weight selector.
     4. `Button & label`: Text face interactive button and active status badge specimens.
   - **Server-Side Confirmation (`Typography.ConfirmedAt`) & Completion Trigger:** Confirming Step 6 sends `confirmedAt: ISO timestamp` via `PATCH /typography`, setting `kit.Typography.ConfirmedAt`. `AdvanceStep(6)` enforces `kit.Typography.ConfirmedAt != null` before advancing `CurrentStep = 6`, marking `Status = "complete"`, and synchronizing the 4-field pointer to `CreatorIdea.Project.Branding`.
   - **AdvanceStep Idempotency on Completed Kits:** `POST /advance` with `targetStep == kit.CurrentStep` on an already-"complete" kit is an idempotent 200 no-op.
   - **Downstream Completion Effects:** Setting `Status = "complete"` permanently unlocks non-linear section editing from the Hub.

#### 3. Brand Kit Hub Page (`/dashboard/creator/phase-2/brand-kit`, Figma Node `57004:12057`)
- **Centered 1080px Column:** Standalone reference hub displaying all confirmed brand assets on an `#EFEFF1` (light) / `#0c0d0e` (dark) canvas.
- **Identity Block:** 56px Avatar mark box, brand title, `v1` version badge, `"v1 · Stored in Mondial cloud"`, `"Updated {Date}"`, `"Open in Studio"` button, and primary `"Download all assets (.zip)"` JSZip client-side packager. 4-column metric strip: `STATUS: Ready to use`, `TIED TO: {brandName} (Project #{shortId})`, `STORAGE: SVG + PNG + CSS + JSON Tokens`, `VERSION: v{kit.version}.0.4`.
- **Section 1: Logo:** Header with `"Logo"` + `"6 LOCKUPS READY"` badge + `"Open in Studio"`, 240px interactive hero band, and 6-thumbnail lockup selector row (`HORIZONTAL`, `STACKED`, `ICON-ONLY`, `BLACK`, `WHITE`, `TRANSPARENT`).
- **Section 2: Colour:** Header with `"Colour"` + `"5 ROLES"` badge + `"Contrast checked"` shield check badge, and 5 equal swatch cards (`Primary`, `Secondary`, `Accent`, `Background`, `Text`) with 110px color fill, uppercase hex codes, RGB, WCAG contrast ratio badges (`AAA`/`AA`), usage notes, and one-click copy hex.
- **Section 3: Typography:** Header with `"Typography"` + `"4 ROLES · 2 FAMILIES"` badge + `"Open licence"` check badge, and 4 divided rows (`Logo type` [locked], `Heading`, `Body`, `Button & label` [`Start free` pill & `INVOICE NUMBER` label]).
- **Section 4: Strategy:** Header with `"Strategy"` + `"Open in Studio"`, and 2-column 6-fact grid (`BUSINESS NAME`, `CONCEPT`, `AUDIENCE`, `INDUSTRY` [badge pill], `POSITIONING`, `PERSONALITY` [trait badges]).
- **Section 5: Used by:** Header with `"Used by"` + `"2 OF 4 CONNECTED"` badge, and 4 integration tiles (`Business plan` [Applied], `Landing page` [Applied], `Pitch deck` [Not generated yet], `Invoices` [Not generated yet]).
- **Section 6: Coming Soon:** 2 roadmap cards (`Brand assets` and `Brand guidelines PDF` with `"Coming soon"` badges).
- **Footer Strip:** Info note: `"Edits apply the next time a generator runs. Already-generated documents keep the version they were made with."`
  4. *Brand Strategy Foundations:* 6 confirmed facts (Industry, Target Audience, Core Concept, Positioning, Personality Traits, Tone Position).
- **Version History & Rollback:**
  - Bounded to the 3 most recent snapshots (newest first).
  - Snapshot restoration requires explicit modal confirmation (`RestoreSnapshotModal`).
  - An automatic backup snapshot (`isAutomaticBackup: true`) is captured immediately before restoring an older version.
  - Concurrency guarded via `UpdatedAt` and `Version` checks.
- **Cascade Warning Modal (`CascadeWarningModal`):**
  - Displayed when the creator clicks "Edit in Studio" on an upstream section (Strategy, Direction, Logo) from the Hub.
  - Transparently itemizes all downstream artifacts that will be recalculated or invalidated if upstream choices change.
- **Downstream Generators Status:**
  - Honestly displays "Not connected yet" across all 4 generator integrations (Business Plan, Landing Page, Pitch Deck, Invoices & Receipts).
- **Download Brand Kit (.zip) Packaging Engine (`src/lib/brand-kit-export.ts`):**
  - **Single Shared Exporter (`exportBrandKitZip`):** Consumed by `BrandKitHubView`, `VariationSetModal`, and `AssetLibraryPage`.
  - Client-side ZIP generated via `JSZip` containing:
    1. `/logos/`: Vector lockups and icon variations (`primary.svg`, `horizontal.svg`, `stacked.svg`, `icon-only.svg`, `black.svg`, `white.svg`, `transparent.svg`). Fetches vector assets using canonical `resolveMediaUrl`.
    2. `/tokens/colors.json`: 5-role color tokens with hex, rgb, and WCAG contrast ratios.
    3. `/tokens/typography.json`: 4-role typography tokens with family, weight, size, line-height, and specimen text.
    4. `/tokens/brand-tokens.css`: Ready-to-use CSS Custom Properties (`:root { --brand-primary: ... }`).
    5. `/README.md`: Brand identity summary document.
  - **Concept Fallback Matrix:** When Step 3b variations have not yet been derived, automatically falls back to approved concept mark/lockup assets (`approvedConcept.lockupAssetUri`, `approvedConcept.markAssetUri`) so confirmed visual identities are exportable immediately.
  - **Fail-Loud Error Policy:** A failed asset fetch (404, network failure, invalid XML/SVG) MUST NEVER produce an empty `/logos/` folder or silent incomplete ZIP. The engine aborts immediately, throws an explicit error naming the failed assets, and renders a dismissible on-screen error banner in the UI.

- **Brand Kit Asset Delivery & Origin Resolution:**
  - **Single Shared Helper (`resolveMediaUrl`):** All components displaying or fetching brand assets (Concept Tiles, Variation Tiles, MicroScaleViewer, MultiScaleIconViewer, Invoice Mock, Compare Overlay, Color System Modal, Hub Logo Grid, Phase 2 Complete summary card, and Brand Kit ZIP exporter) consume `resolveMediaUrl(uri?: string | null, version?: number): string` from `src/lib/brand-kit-media.ts`.
  - **Dynamic URL Normalization:** Converts relative paths (`/brand-assets/logos/...`) served by ASP.NET backend to absolute origin (`http://localhost:5093/brand-assets/...` in local development via `NEXT_PUBLIC_API_ORIGIN` / `API_ORIGIN`), while passing data URIs and existing `http://`/`https://` absolute URLs through untouched.
  - **Next.js Reverse Proxy Rewrite (Defense-in-Depth):** `next.config.ts` includes an `async rewrites()` rule proxying `/brand-assets/:path*` directly to `http://localhost:5093/brand-assets/:path*`, ensuring direct HTTP asset fetches by browser or client-side libraries never 404 across port boundaries.
  - **Clean Standard Image Tags:** `BrandKitHubView.tsx`, `ColorSystemModal.tsx`, and `Phase2CompletePage.tsx` use standard `<img src={resolveMediaUrl(...)} />` elements instead of insecure or brittle `dangerouslySetInnerHTML` attempts on relative asset file paths.
- **Version History & Snapshot Policy:**
  - **Non-Destructive In-Wizard Candidate Exploration:** During initial Studio progression (Steps 1–6), candidate generation and per-tile regeneration (`RegenerateCount`) are non-destructive and tracked via element-level counters. No version snapshots are created during initial creation.
  - **Destructive Hub Re-Edits & Backups:** Bounded history snapshots (`BrandKitSnapshot`, up to 3 retained) are strictly captured when destructive changes occur to an already-approved/completed kit (e.g. changing an approved Visual Direction or Logo Concept from the Hub), or as automated pre-restore backups.

#### 4. Credit Metering, Per-Element Caps & Studio Reset
- **Config-Driven Pricing:** Configured under `Ai:CreditCosts` in `appsettings.json`:
  - Direction Generation (4 candidates): **7 credits** (`AiJobType.DirectionGeneration`)
  - Logo Batch Generation (6 concepts): **4 credits** (`AiJobType.LogoParameterSelection`)
  - Logo Single Concept Regeneration: **0 credits (Free)** (Local SVG parametric redraw, not an AI job)
  - Color Palette Regeneration: **2 credits** (`AiJobType.ColorGeneration`)
  - Typography System Regeneration: **2 credits** (`AiJobType.TypographyGeneration`)
  - Deterministic Initial Derivations & Derived Variations: **0 credits (Free)**
  - Total credits spent during full E2E walkthrough is exactly **11 credits** (7 for Direction + 4 for Logo concepts).
  - All generative operations are free-tier eligible per the platform's starter credits model (200 credits granted on onboarding/first AI call).
- **Per-Element Cap (Max 3):** Direction, Logo Concepts, Colors, and Typography each enforce `RegenerateCount <= 3`. Reaching the cap halts further generation with HTTP 400 and **0 credits debited**.
- **Compensating Refunds & Option A Failure Handling:** Debits occur before model execution. If an AI call fails, parse fails, or encounters an optimistic concurrency conflict:
  1. The error propagates cleanly (Option A); deterministic fallbacks are permanently deleted from billed paths.
  2. The controller returns an honest HTTP 500 error naming the failure.
  3. `RefundForJobAsync` is immediately dispatched, refunding the user's credits atomically.
  4. The section's `RegenerateCount` is not incremented.
- **Studio Reset & First-Time Provisioning (`POST open-studio`):**
  - Handles missing and existing kits consistently: if no `BrandKit` exists for an idea, `POST open-studio` auto-provisions a fresh draft kit using the shared `GetOrCreateBrandKitAsync` method (matching `CreateKit`), returning HTTP 200 rather than 404.
  - When invoked for an existing kit upon re-entering from the Hub, it resets all `RegenerateCount` counters (`Direction`, `Logo`, `Logo.Concepts[*]`, `Colors`, `Typography`) to 0. Normal section `PATCH` saves do not reset counters.

#### 5. Operational Notes & Verification
- **E2E Walkthrough Full-Flow Coverage:**
  - The live browser automation test (`scripts/live_brand_studio_e2e_walkthrough.mjs`) starts with a genuinely kit-less fresh idea, with zero out-of-band pre-provisioning.
  - It exercises the real first-time Creator path: navigating from `/phase-2/branding`, clicking "Open Brand Studio", backend auto-provisioning via `openStudio`, stepping through Strategy Review, live AI Direction generation, Logo Type selection, 6-concept Logo generation + regeneration, 7-variation derivation, Colour editing & confirmation, Typography confirmation, automatic transition to `/phase-2/brand-kit` Hub, full ZIP package downloading, summary navigation to `/phase-2/complete`, and Hub cascade warning triggering.
- **Pre-Fix Completed Kits (Historical Data Gap):**
  - An audit of historical `BrandKits` documents in MongoDB revealed 3 kits created prior to the confirmation fix (`6aa9b5e6b51421948f8b807d`, `6aa9b760b51421948f8b80a1`, `6aaa3335f4440c68adeb27a3`) that have `Status = "complete"` but `Colors.ConfirmedAt == null` and `Typography.ConfirmedAt == null`.
  - **Operational Policy:** These historical records were captured and reported without mutating historical database records. A separate operational decision will determine whether to run an idempotent backfill script or leave historical legacy kits as-is.


### Path A — Discovery (REMOVED FROM CURRENT PRODUCT)

> [!IMPORTANT]
> **REMOVED FROM CURRENT PRODUCT**: The Discovery branch (`/phase-2/discovery`, `/phase-2/ai-processing`, `/phase-2/idea-cards`, `/phase-2/idea-confirm`) has been removed from active frontend and backend routing. Phase 2 is exclusively linear via the Idea Clarifier.
>
> **Historical Database Compatibility**: Historical `CreatorIdea` records containing `DiscoveryInputs`, `GeneratedConcepts`, or `SelectedConceptId` remain intact in MongoDB for backward compatibility. Historical users with existing clarified project fields (concept, problem, solution, clarity score, name) resume directly at their current canonical step without repeating removed screens. Shared AI infrastructure remains in place, while `IdeaGeneratorController` and `IdeaGeneratorHandler` are dormant.

---

## 5. Phase 3 — Business Architecture & Masterplan (Canonical 7-Step Sequence — LIVE, CLOSED & STABLE)

> [!IMPORTANT]
> **Phase 3 Closure & Defect Repair Policy (2026-09-18):**
> Phase 3 was declared **CLOSED and STABLE**. Subsequent design-conformance fixes against approved Figma designs (such as the Step 3.1 Market Study visual rebuild to match true design specifications) are classified as **defect repair against spec** rather than feature scope additions or unbounded redesigns. The Phase 3 closure declaration remains in force: zero new steps, zero unapproved visual redesigns, and strict conformance to canonical contracts.
>
> **Out-of-Scope Items for Phase 3 Closure (Explicitly Tracked):**
> 1. *Provisional Section Rewrite Cost:* Single-section AI rewrite is configured and functioning at **5 credits** (`AiJobType.BusinessPlanSectionRewrite`); price remains provisional pending the platform-wide credit cost table review.
> 2. *Credit Checkout / Purchase Gateway:* Real-currency Stripe/credit card top-up gateway is a platform-wide commercial infrastructure milestone (Phase 4/5 cross-cutting) rather than a Phase 3 gate blocker.

Phase 3 establishes the comprehensive business, market, financial, and legal foundation for the venture across **seven sequential steps**:

```text
/phase-3
→ Step 3.1: /phase-3/market-study
→ Step 3.2: /phase-3/business-model
→ Step 3.3: /phase-3/forecast
→ Step 3.4: /phase-3/compliance
→ Step 3.5: /phase-3/formation
→ Step 3.6: /phase-3/business-plan
→ Step 3.7: /phase-3/complete
→ Phase 4
```

**Session & Prerequisite Chain (Enforced):**
`clarifierSessionId` (P2) $\to$ `marketStudySessionId` (3.1) $\to$ `businessModelSessionId` (3.2) $\to$ `forecastSessionId` (3.3) $\to$ `legalAssessment` / `legalChecklist` (3.4) $\to$ `formationGenerator` (3.5) $\to$ `businessPlanSessionId` (3.6) $\to$ `investorReadinessScore` (3.7).

**Core Completion & Data Governance Rules:**
1. **Completion Rule:** New journey completion MUST include Legal (`legalPresent`); the legacy bypass (`hasPlan && hasForecast && hasFormation`) applies strictly and exclusively to existing legacy records.
2. **Source of Truth:** Artifact state > numeric historical step number as the completion source of truth.
3. **TAM Source Provenance:** Step 3.3 Forecast TAM auto-seeds from Step 3.1 Market Study TAM (`marketSizing.tam.value`) while maintaining explicit source provenance; existing saved Forecast TAM is NEVER overwritten.
4. **Context Propagation:** `ideaId` propagation is strictly enforced on all intra-phase and phase-transition navigation using `withIdeaContext`.

### 5.1 Step 3.1 — Market Study & Competitive Intelligence (LIVE)
- **Route:** `/dashboard/creator/phase-3/market-study`
- **Backing Entity & Controller:** `MarketStudySession` stored in `MarketStudySessions` collection via `MarketStudyController` (`/api/ai/market-study`).
- **Inputs Consumed:** `ClarifierSessionId` (from Phase 2, required) and `BusinessIdeaId` (optional/context).
- **Backend Architecture & Benchmark Reuse:** `MarketStudyHandler` reuses `IMarketBenchmarkResolver` to query sector-specific benchmarks, tailwinds, and median multiples, injecting rich quantitative baselines into the generative prompt.
- **Output Schema (`MarketStudyOutput`, Schema Version 1):**
  1. `marketSizing`: `tam`, `sam`, `som` (each with `value`, `currency`, `label`, `derivation`, `sourceAttribution`, plus `percentageOfTam` / `percentageOfSam`), and `methodology` (freeform descriptive string explaining bottom-up calculation and triangulation arithmetic).
  2. `competitorLandscape`: `summary`, `directCompetitors` array (`name`, `segment`, `estimatedMarketShare`, `pricingModel`, `strengths`, `weaknesses`, `exploitableGap`, `sourceAttribution`), and `indirectCompetitors` array (`name`, `substituteApproach`, `threatLevel`: `low` | `medium` | `high`).
     - **Competitor Segment Field:** The `segment` field is included in prompt contracts, MongoDB entity models, JSON parsers, and TypeScript types. It is **optional** so omitting LLM completions never fail a paid generation; legacy studies generated prior to this field render an honest empty placeholder (`—`).
  3. `demandSignals`: Array of signals with `signal`, `evidence`, `sourceAttribution`, and `relevanceScore` (integer 1–10).
  4. `sizingRisks`: Array of sensitivity risks with `risk`, `impactOnSom` (`low` | `medium` | `high`), and `mitigation`.
  5. `marketGapValidation`: `primaryGap`, `validationRationale`, and `confidenceLevel` (`high` | `moderate` | `speculative`).
- **Figma Parity & 1:1 Design Conformance (Approved Nodes):**
  - **Sizing Funnel & Active Formula (Node `57078:11039`):** Truly proportional TAM, SAM, and SOM bars rendered without clamping floors, paired with the Active Sizing Formula container displaying step-reduction percentages and derivations.
  - **Competitive Landscape Matrix (Node `57078:11179`):** Direct competitors comparison grid featuring segments, market share, pricing models, verified strengths, exploitable gaps, and source attributions.
  - **Market Demand Signals & Sizing Risks (Node `57078:11286`):** Dual-card layout contrasting verified growth signals (+% YoY badges, evidence, attribution) with operational risks (impact severity chips, mitigations).
  - **Founder Gap Validation (Node `57078:11359`):** Hypothesis assessment banner with confidence pill badge, followed by a 2-column comparative layout contrasting the founder's stated gap against evidence synthesis and validation rationale.
- **UI Presentation & Permanent Architectural Decisions:**
  - **Truly Proportional Funnel Bars (Zero Clamping):** TAM, SAM, and SOM bars render at true mathematical widths (`width: 100%`, `width: SAM%`, `width: SOM%`) without artificial minimum-width floors.
  - **Permanent Decision 1 — No Minimum-Width Floor:** The funnel must NEVER enforce a `minWidth` floor (e.g. clamping small SOMs to 15%). Doing so visually distorts market realities, making a tiny obtainable market look deceptively large and dangerously misleading the founder.
  - **Adaptive Narrow-Tier Content Layout:** When a tier (such as SOM < 5% or narrow containers) is too narrow to hold its internal label, value, and step-reduction badge, content shifts outside the card via connecting reference rather than stacking into a crushed, unreadable column or clipping text.
  - **Audit-Trace Derivations:** The three derivation sentences (`tam.derivation`, `sam.derivation`, `som.derivation`) live strictly inside the bottom audit-trace container (`"How this was calculated"`), eliminating duplicate text from the top funnel cards.
  - **Permanent Decision 2 — Honest Derivation Sentences:** The sizing methodology box displays the three genuine derivation sentences rather than a fabricated arithmetic line, because no mathematical equation is stored in backend contracts and fabricating one would represent dishonest placeholder content.
  - **Dense Competitor Benchmarking Matrix:** Full-width multi-column comparison table featuring direct competitor names, segments, estimated market share, pricing models, verified strengths, exploitable gaps, and source attributions.
  - **Structured Signals & Risks Rows:** Two-column grid contrasting verified market demand signals (with 1–10 relevance score bars) against operational sizing risks (with threat impact chips and mitigation strategies).
  - **Closing Founder Gap Validation:** Market gap validation is positioned at the bottom of the workspace as the closing foundation, with sections cleanly renumbered.
- **Standalone PDF Export (`MarketStudyPrintView.tsx`):**
  - Instant browser-compiled printable document available via "Export PDF" button.
  - Aligned 1:1 with the Figma layout structure across all 4 major sections and executive headers.
  - **Brand Kit Logo Integration:** Automatically queries `brandKitApi.getBrandKit()` to fetch confirmed visual identity assets. Prioritizes the transparent variation (`logoVariations.transparent?.svgUri || logoVariations.transparent?.pngUri`) to render cleanly without background containers in the report header, with fallback to approved concept lockup. Also embeds the transparent mark in the report footer watermark alongside platform certification metadata.
- **Credit Cost:** **20 credits** (`AiJobType.MarketStudy`).

### 5.2 Step 3.2 — Business Model & Monetization Canvas (LIVE)
- **Route:** `/dashboard/creator/phase-3/business-model`
- **Backing Entity & Controller:** `BusinessModelSession` stored in `BusinessModelSessions` collection via `BusinessModelController` (`/api/ai/business-model`).
- **Inputs Consumed:** `MarketStudySessionId` (from Step 3.1, required) and `BusinessIdeaId` (optional/context).
- **Output Schema (`BusinessModelOutput`, Schema Version 1):**
  1. `canvas`: Canonical 9-block Osterwalder layout (`keyPartners` [string], `keyActivities` [string], `keyResources` [string], `valuePropositions` [{ `headline`, `details`, `marketStudyFootnote` }], `customerRelationships` [string], `channels` [string], `customerSegments` [{ `segment`, `marketStudyFootnote` }], `costStructure` [string], `revenueStreams` [{ `stream`, `marketStudyFootnote` }]).
  2. `revenueTiers`: Array of pricing packages with `tierName`, `pricing`, `targetSegment`, `features`, and `projectedContributionPct`.
  3. `unitEconomics`: `arpu` (`amount`, `currency`, `period`: `monthly` | `annual`, `isModelled`), `cac` (`amount`, `currency`, `isModelled`), `ltv` (`amount`, `currency`, `isModelled`), `ltvToCacRatio`, `paybackPeriodMonths`, and `commentary`.
  4. `assumptions`: Array of core model assumptions with `category`, `assumption`, and `evidenceLevel` (`evidenced` | `modelled` | `untested`).
- **Parser Normalisation & Logging:** `assumptions[].evidenceLevel` is normalized at the parser layer to canonical values (`evidenced`, `modelled`, `untested`), conservatively mapping genuine synonyms while routing ambiguous inputs (e.g. `observed`) to the safe fallback `untested` to prevent over-claiming validation. `arpu.period` is normalized to `monthly` | `annual` (fallback `monthly`). All coercions are logged as backend warnings via `ILogger.LogWarning`.
- **Credit Cost:** **18 credits** (`AiJobType.BusinessModel`).
- **UI Presentation:** Canonical Osterwalder grid matching Figma Node `57156:8456` with numbered index tags (`01`–`09`) and hairline dividers (5 upper columns: Key Partners, Key Activities over Key Resources, Value Propositions centered, Customer Relationships over Channels, Customer Segments; 2 lower columns: Cost Structure [55% width with 2-column breakdown] and Revenue Streams [45% width]). Followed by a dedicated Unit Economics strip (4 calibrated benchmark cards: CAC, LTV, LTV/CAC with 'Healthy' badge, Payback Period), a Step Complete checklist with 5 validation items, and a footer action row (Back navigation to Market Study & Build Financial Forecast, with Regenerate preserved in the persistent header actions). Responsive across 1440px–1920px with Inter headings (`font-heading`), DM Sans body copy (`font-sans`), JetBrains Mono numerals/metrics (`font-mono`), zero raw hex values or arbitrary bracket font sizes, and full dark theme token support. Out-of-contract strings reaching the frontend are styled with destructive visual tokens rather than silently absorbed.

### 5.3 Step 3.3 — Financial Forecast (C-4, LIVE & FROZEN)
- **Route:** Unified workspace at `/dashboard/creator/phase-3/forecast` (dual-mode: First-Time Full Assumptions View $\to$ Continuous 8-Section Financial Command Results Dashboard).
- **Backing Entity & Controller:** `ForecastSession` stored in `ForecastSessions` collection via `ForecastController` (`/api/ai/forecast`).
- **Inputs Consumed:** `BusinessIdeaId` (or `BusinessPlanSessionId` if available), plus financial assumptions (`ARPU`, `OPEX`, `Growth %`, `TAM`, `Churn %`, `StartingBudget`, `TaxRate`).
- **TAM Source Provenance:** TAM is a canonical read-only linked fact auto-seeded from Step 3.1 Market Study (`marketSizing.tam.value`) with visible provenance attribution and a 1-click reset option. Saved forecast TAM values are strictly preserved and never overwritten on resume.

#### 1. Canonical Flow Architecture
- **First-Time Generation (No Valid Completed Forecast):**
  ```text
  NO valid completed forecast
  → Full Adjust Forecast Assumptions page (/dashboard/creator/phase-3/forecast)
  → Founder reviews/edits archetype operational drivers & starting budget
  → PUT /api/ai/forecast/assumptions (persists inputs & locks edited fields)
  → POST /api/ai/forecast (starts 36-month deterministic projection generation)
  → Immediate backend-driven processing state screen
  → Results Dashboard rendered upon completion
  ```
- **Regeneration Flow (Valid Completed Forecast Exists):**
  ```text
  VALID completed forecast exists
  → Results page displayed directly
  → Founder clicks "Adjust Assumptions" button in Persistent Header
  → Adjust Assumptions modal opens (ForecastAssumptionsModal)
  → PUT /api/ai/forecast/assumptions (persists inputs & locks edited fields)
  → POST /api/ai/forecast/{sessionId}/regenerate (starts new version calculation)
  → Modal closes; previous valid forecast results remain visible while processing
  → Header & action bar show non-blocking regeneration indicator
  → Latest valid version seamlessly replaces displayed forecast on success
  ```

#### 2. Exact Processing UX & Failure Behavior
- **Shared Phase 3 Loading Canon:**
  - Step 3.3 strictly follows the visual and interaction loading language established by Step 3.1 (Market Intelligence) and Step 3.2 (Business Model). No independent or custom loading system exists for Step 3.3.
  - **Visual Presentation:** `Card` with `rounded-2xl border border-border bg-card p-10 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm animate-pulse`, `role="status"`, and `aria-live="polite"`.
  - **Spinner / Icon:** Centered circular badge `<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary"><RotateCw className="w-6 h-6 animate-spin" /></div>`.
  - **Progress Bar:** Continuous indeterminate bar `<div className="w-48 h-1.5 bg-muted rounded-full mx-auto overflow-hidden"><div className="h-full bg-primary rounded-full animate-indeterminate" /></div>`.
  - **State Authority:** Real processing state (`startForecast.isPending || regenerateForecast.isPending || isSubmittingAssumptions || isSessionProcessing`). No fake timers or synthetic progress percentages ("This may take up to two minutes" is explanatory UI copy only).
  - **Status Normalization:** `isSessionProcessing` case-insensitively recognizes all backend processing lifecycle states (`Pending`, `Processing`, `Generating`, `Running`, `Queued`). Terminal status check (`isTerminalStatus`) case-insensitively recognizes `Completed`, `Failed`, and `NeedsReview`.
  - **Zero-Gap Mutation-to-Polling Bridge:** `useRegenerateForecast.onMutate` optimistically updates the session cache query (`forecastKeys.detail(sessionId)`) to `status: "Processing"`. This guarantees that `isGenerating` stays continuously `true` between POST dispatch, HTTP response arrival, and the first polling update, preventing any loading card flicker or disappearance.
- **First-Time Generation Processing Screen:**
  - **Title:** `"Generating Your Financial Forecast…"`
  - **Body:** `"Building your 36-month projections from the assumptions you confirmed. This may take up to two minutes."`
  - **Failure Handling:** If generation fails (network error, timeout, HTTP 500), preserved saved assumptions are retained; displays honest retry card with `[Try Again]` and `[Adjust Assumptions]` actions.
- **Regeneration Processing State:**
  - **Title:** `"Regenerating Financial Forecast…"`
  - **Body:** `"Recalculating projections with your updated assumptions. This may take up to two minutes."`
  - **Non-Destructive Preservation:** The existing valid forecast output (`latestValidVersion`) remains fully visible and intact below the top processing card throughout regeneration. The header `Adjust Assumptions` button is disabled with an inline spinner (`RotateCw animate-spin`) to prevent duplicate requests.
  - **Terminal Completion:** On `Completed` status, the loading card unmounts and the new valid version replaces the previous forecast atomically without page reload.
  - **Failure Handling:** If regeneration fails (`Failed` or error), previous valid forecast remains completely intact and displayed; a non-destructive failure alert card renders with `[Adjust & Retry]` without wiping or corrupting the results.

#### 3. Single Canonical Assumptions Authority & Dead Code Cleanup
- **Single Canonical Form Schema:** `ForecastAssumptionsForm` is the single canonical assumptions form and validation schema across both the initial setup page and the in-results modal.
- **Removal of `StartingBudgetModal.tsx`:** The legacy separate `StartingBudgetModal.tsx` wrapper has been completely excised. Starting Budget is natively integrated into the canonical assumptions form across all views.
- **`FinancialForecastEngine` as Sole Authority:** `FinancialForecastEngine` is the sole deterministic 36-month calculation authority for all 4 business archetypes. Obsolete projection helpers (`ExtendToThirtySixMonths`, `RecomputeBreakEven`, and unused static helpers) have been completely removed from `ForecastHandler`.
- **Zero Client-Side Calculation Engine:** React components contain no competing forecast calculation engine or parallel math forks.
- **Zero Static Fallback Data:** Static fallback counts = 0; first-idea fallbacks = 0; all cards, tables, charts, and metrics are derived from live database records.
- **Budget Suggestion API:** `GET /api/ai/forecast/budget-suggestion` remains fully active and contracted to supply intelligent baseline recommendations.

#### 4. Archetype Driver Coverage & UI Invariant Rule
- **Core Invariant:** *Every active editable backend forecast driver must be exposed in the canonical Adjust Forecast Assumptions form. Inactive drivers for an archetype must be hidden or marked N/A, never rendered as misleading fake zeros.*
- **Archetype Driver Matrix:**
  - **SaaS:** Launch Subscribers, MoM Subscriber Growth (%), Monthly Churn (%), ARPU (€/mo), Variable Cost per Subscriber (€/mo), Fixed OPEX (€/mo), Corporate Tax Rate (%), Starting Budget (€).
  - **E-Commerce:** Launch Orders / Month, MoM Order Growth (%), Average Order Value / AOV (€), Cost of Goods Sold / COGS (%), Fulfillment & Packaging Cost per Order (€), Fixed OPEX (€/mo), Corporate Tax Rate (%), Starting Budget (€).
  - **Service / Agency:** Launch Clients / Projects, MoM Client Growth (%), Average Retainer or Project Value (€/mo), Delivery Cost per Client (€/mo), Fixed OPEX (€/mo), Corporate Tax Rate (%), Starting Budget (€).
  - **Marketplace:** Launch Monthly GMV / Transactions, MoM Volume Growth (%), Average Transaction Value (€), Take Rate / Commission (%), Payment Processing & Variable Cost (%), Fixed OPEX (€/mo), Corporate Tax Rate (%), Starting Budget (€).
  - **TAM (All Archetypes):** Canonical read-only linked fact derived from Step 3.1 Market Study.

#### 5. Safety Rules & Project-Context Isolation
- **Mandatory `ideaId` Contract:** All forecast endpoints (`GET /session`, `POST /start`, `POST /regenerate`, `GET /assumptions`, `PUT /assumptions`, `GET /budget-suggestion`) require a non-empty `ideaId`. Missing/whitespace returns HTTP 400; foreign/unowned returns HTTP 404.
- **Zero First-Idea Fallback:** Legacy silent fallbacks (`allIdeas.FirstOrDefault()?.Id`) are completely removed.
- **Zero Unscoped LocalStorage:** LocalStorage keys strictly bind to `mondial_forecast_budget_${ideaId}`. The generic `'active'` key fallback is eliminated.
- **Monotonic Upstream Version Guard:** `FinancialAssumptionsService` enforces `incoming < stored → reject stale`, `incoming == stored → idempotent no-op`, `incoming > stored → accept update`, independently for `MarketStudyVersion` and `BusinessModelVersion`.
- **Founder-Lock Protection:** Founder-edited or confirmed fields (`IsFounderLocked`) are permanently protected and survive upstream re-runs.
- **Latest Valid Completed Resolver:** `hasValidCompletedForecast` evaluates the presence of at least one valid completed `ForecastVersion` with non-empty output, preventing UI breakage during failed or in-flight regenerations.
- **Tax Default Semantics:** Corporate tax rate carries no universal hardcoded 25% assumption; `null != 0 != inactive/N-A`.

#### 6. Figma Parity & 1:1 Design Conformance (Approved Nodes 57157:9297 & 57157:9348)
- **Section 1: Header Bar & Persistent Actions:** Eyebrow `STEP 3.3 · FINANCIAL FORECAST`, Title `Your 3-year financial forecast`, Subtitle `36 months · Months 1–12 modelled, 13–36 projected · EUR`, persistent `Adjust Assumptions`, `Download report` (PDF preview overlay), and `Regenerate` button with live credit balance pill (`Uses 32 credits · balance [X]`).
- **Section 2: Conditional Out-of-Date Alert Strip:** Activates when live simulation operational drivers deviate from last saved run (*"Assumptions changed since last run — results may be out of date. Click Regenerate to update forecast projections."*).
- **Section 2.5: Executive Verdict Hero Card:** High-impact milestone headline highlighting Break-even Month and Loss Recovery Month, starting budget exhaustion month, and funding gap calculation with dynamic badge (`Funding gap` in warm amber or `Fully funded` in emerald).
- **Section 3: Three Summary Cards (Figma Node 57157:9348):**
  - `REVENUE`: Net growth badge (`+X% Y1→Y3`), ARR run-rate stat (`€X ARR (Y3)`), Y1/Y2/Y3 mini-breakdown pills, and custom 341x112 SVG area chart (`RevenueAreaSvg`) with solid line M1–12 modelled, dashed line M12–36 projected, M12 vertical divider with labels, on-curve break-even indicator dot and floating pill badge `M{breakEvenMonth} break-even`.
  - `COST VS REVENUE`: Revenue vs Total Cost dual curves (`CostVsRevenueCrossingSvg`), drop line at break-even month with outer/inner circle dot and floating badge `€{breakEvenRevenue} ({breakEvenSubs} subs)`, Inflection Point stat (`Month {x}`), and break-even subscriber callout.
  - `CASH POSITION`: Deficit duration badge (`Deficit: M{x}–M{y}` or `Fully funded`), lowest cash point stat (`−€{minCumulative}` or `Cash positive`), liquidity trajectory chart (`Cash36BarSvg`) with 36 individual vertical bars (5.7px width, 9.47px pitch, horizontal zero baseline, slate initial cash, warm amber deficit, vibrant amber lowest month, teal positive cash, and dotted vertical callouts for budget runs out and cash positive).
- **Section 4: Assumptions & Live Simulation Parameters Grid:** Responsive 8-card operational driver grid: Starting budget, Subscribers at launch, New subscribers % MoM, Monthly churn %, Price per subscriber (Linked from 3.2), Variable cost/sub, Fixed costs/mo, and Market size TAM (Linked from 3.1 with reset trigger). Real-time parameter tweaking dynamically recalculates all 36 months, break-even, and runway, with live warning banners for tight economics, high growth, and churn risks.
- **Section 5: Continuous 36-Month Consolidated Data Table:** Direct, continuous 10-column table across 36 months (`MONTH`, `SUBSCRIBERS`, `REVENUE`, `FIXED COST`, `VARIABLE COST`, `TOTAL COST`, `NET CASH FLOW`, `CUMULATIVE`, `CASH ON HAND`, `NOTES`) with distinct year grouping headers (`YEAR 1 · MODELLED`, `YEAR 2 · PROJECTED`, `YEAR 3 · PROJECTED`), subtotal rows (`Y1 SUBTOTAL`, `Y2 SUBTOTAL`, `Y3 SUBTOTAL`), and milestone highlight tags (`Budget runs out`, `Lowest cash point`, `Break-even`, `Cash positive again`, `All losses recovered`).
- **Section 6: Break-Even & Unit Economics Side-by-Side:** Left: Break-even analysis with 4 key metrics, narrative analysis, and exact contribution margin formula breakdown. Right: Unit economics with CAC, LTV, LTV/CAC (Healthy badge), Payback period, Gross margin %, and Month 1 Burn.
- **Section 7: Key Assumptions & Risk Assessment:** Left: 7 key model assumptions tagged with provenance badges (`YOUR INPUT`, `FROM 3.2`, `MODEL`). Right: 4-tier risk assessment matrix with severity badges (Funding risk, Growth shortfall, Subscriber retention, Delivery cost).
- **Section 8: Milestones Complete & Navigation Footer:** Step Complete checklist (6/6 milestones verified) and navigation footer: `Business Model` Back button (navigates to Step 3.2 `/dashboard/creator/phase-3/business-model`), and `Continue to Legal & Compliance` button (navigates to Step 3.4 `/dashboard/creator/phase-3/compliance`).
- **Credit Cost:** **32 credits** (`AiJobType.Forecast`).

#### 7. Verification Status (PASS & FROZEN)
- **Dedicated Loading Suite:** 8 / 8 passed (`ForecastLoadingExperienceAlignment.test.tsx`)
- **Selected Forecast Regression Suites:** 19 / 19 passed (`ForecastLoadingExperienceAlignment`, `ForecastProjectContextSafety`, `ForecastPrintView`, `ForecastViewAndPrintTolerance`)
- **Historical Extended Frontend Suite:** 39 / 39 passed (7 test suites)
- **Backend Test Suite:** 94 / 94 passed (108 total, 14 integration skipped)
- **TypeScript Compilation:** PASS (0 errors)
- **Backend Solution Build:** PASS (0 errors)
- **Frontend Production Build:** PASS (187 / 187 Next.js routes)
- **Real-Browser Regeneration:** PASS
- **Immediate Loading & Zero-Gap Bridge:** PASS
- **Loading Remains After POST:** PASS
- **Previous Forecast Preserved During Regeneration:** PASS
- **New Forecast Atomically Replaces Old:** PASS
- **Forecast Math Changed:** NO
- **Figma Results UI Changed:** NO
- **Duplicate Assumptions Schemas:** 0
- **Client-Side Forecast Engines:** 0
- **Static Financial Fallback Code:** 0
- **Legacy First-Idea Fallback:** 0
- **Historical Database Compatibility Removed:** NO
- **Final Status:** PASS / FROZEN / CLOSED

### 5.4 Step 3.4 — Legal & Compliance Intelligence (LIVE — 100% Figma Node 57156:9158 Aligned)
- **Status:** **FINAL PASS / FROZEN / CLOSED**
- **Route:** `/dashboard/creator/phase-3/compliance`
- **Figma Reference:** 100% verified and aligned against approved Figma Node `57156:9158` ("Legal & Compliance · Creator Phase 3.4").
- **Canonical Boundary & Purpose:**
  - **Purpose:** Determine WHAT statutory legal and compliance obligations apply to the Creator's project, why they apply, their current planning status, their official legal sources, and what preparation/action is required.
  - **Boundary:** Step 3.4 is **NOT** company formation execution. Step 3.5 remains strictly responsible for final legal structure selection, formation execution, incorporation workflows, and formation-specific administration.
- **Data Flow & Architecture:**
  - `Creator Project / Canvas / Market Study / Forecast`
  - $\to$ `BusinessProfileClassifier`
  - $\to$ `LegalBusinessProfile` (`BusinessSignal`, `SignalConfidenceLevels`)
  - $\to$ `FranceRules.json` (`FranceLegalRulesCatalog`)
  - $\to$ `LegalApplicabilityEngine`
  - $\to$ `CreatorIdea.Phase3Data.LegalAssessment` (Single Source of Truth)
  - $\to$ `LegalComplianceOverviewDto`
  - $\to$ Step 3.4 Accepted UI (`/dashboard/creator/phase-3/compliance`)
- **Business Signal Certainty Model:**
  - Reuses existing canonical certainty primitives: `BusinessSignal` (`Value`, `Confidence`, `Source`, `Rationale`) and `SignalConfidenceLevels` (`Confirmed`, `Derived`, `Unknown`).
  - **Canonical Semantics:** Absence of evidence strictly evaluates to `SignalConfidenceLevels.Unknown` (never false or true defaults without positive supporting evidence).
  - **Certainty Gate:** Legal applicability rules checking signals with `Unknown` confidence evaluate deterministically to `NeedsInformation` (or `NeedsProfessionalReview` for ambiguous sector triggers).
  - **Zero Frontend Inference:** Frontend performs 0 substantive business or legal inference, consuming typed profile signals directly from backend.
- **6 Canonical UI Sections (Full-Width Responsive Flow — FROZEN):**
  1. *Header & Short Introduction:* `Phase3SetupShell` header (`STEP 3.4 · LEGAL & COMPLIANCE`, `Legal & Compliance Intelligence`) followed by introduction *"Let’s make the legal side of your project easier to understand."*
  2. *Roadmap Summary Card:* *"Your legal roadmap is ready."* with clear guidance on what to prepare before registration, launch, and day-to-day operations.
  3. *Recommended Next Action Card:* Soft secondary background (`bg-secondary`), prominent `START HERE` badge, dynamic requirement title and justification, and `"Review this step →"` action button with deep scroll.
  4. *About Your Project Card:* Personalized project overview dynamically bound from typed `LegalBusinessProfileDto` signals, with `"Update your project details ↗"` deep link to Step 3.2.
  5. *Checklist Stage Section (`LegalFigmaStageSection.tsx`):*
     - 3 Segmented Stage Tabs: *"Before you register"*, *"Register & prepare to launch"*, *"Running your business"* with live task count badges.
     - Single card container with `divide-y` row separators.
     - Completed tasks feature `#157A55` (`bg-success-strong`) checkmark, title, subtitle, and inline `"Marked done by you"` badge (`bg-success-light text-success-strong`).
     - Expanded tasks feature a 56px indented accordion layout with uppercase section titles (`WHY THIS APPLIES TO YOU`, `WHEN TO DO IT`, `WHAT TO DO`), canonical Official Public Guidance card with deep links to authoritative French portals (`Service-Public.fr`, `INPI`, `CNIL`, `Legifrance`, `DGFiP`), and subtle check reminder.
     - Quiet statutory disclaimer: *"Checkmarks record your progress; they do not represent legal verification by MBC."*
  6. *Footer Reassurance & Continuation:* Reassurance text *"You can return to this roadmap as your project moves forward."*, `"Back"` button routing back to Step 3.3 Financial Forecast (`/dashboard/creator/phase-3/forecast`), and `"Save and continue"` button completing Step 3.4 and advancing to Step 3.5 Company Formation (`/dashboard/creator/phase-3/formation`).
- **Authoritative National Catalogue (France — 21 Active Rules):**
  - **Catalogue Version:** `FR-2026.2` (`backend/Resources/LegalRules/FranceRules.json`)
  - **Canonical Rules (21 Total):**
    - *Corporate Governance (6):*
      - `FR-CORP-001` (Share Capital Deposit & Escrow Certificate — evaluated as `NeedsInformation` at Step 3.4 pending Step 3.5 structure choice; dispensable for EI/Micro).
      - `FR-CORP-002` (Drafting & Formal Execution of Constitutional Bylaws / Statuts — evaluated as `NeedsInformation` pending Step 3.5).
      - `FR-CORP-003` (Statutory Legal Notice Publication in an Authorized Gazette / JAL — evaluated as `NeedsInformation` pending Step 3.5).
      - `FR-CORP-004` (Business Registration via INPI Guichet Unique — SIREN & Official Registry Extract; no universal Kbis promise).
      - `FR-CORP-005` (Beneficial Ownership Declaration / RBE — evaluated as `NeedsInformation` pending Step 3.5).
      - `FR-CORP-006` (Annual Financial Accounts Approval & Filing — ongoing corporate governance requirement).
    - *Intellectual Property (1):*
      - `FR-IP-001` (Trademark Clearance & Brand Protection with INPI — priority `recommended`, triggered across commercial activity signals).
    - *Data Privacy & Consumer Protection (7):*
      - `FR-PRIV-001` (Article 30 GDPR Data Processing Records — SME simplified record keeping).
      - `FR-PRIV-002` (GDPR Privacy Policy & Data Subject Disclosures).
      - `FR-PRIV-003` (Cookie & Online Tracker Consent Management).
      - `FR-WEB-001` (Mandatory Website Legal Notice / Mentions Légales).
      - `FR-CONS-001` (Standard B2C Terms of Sale / CGV).
      - `FR-CONS-002` (Mandatory 14-Day Consumer Right of Withdrawal).
      - `FR-CONS-003` (Consumer Dispute Mediation Designation).
    - *Payment, Commercial & Tax (3):*
      - `FR-PAY-001` (Merchant Payment-Provider Integration & PCI-DSS SAQ-A — merchant delegation model, not regulated PSP entity).
      - `FR-MKT-001` (Direct Electronic B2C Marketing & Commercial Communications Consent).
      - `FR-TAX-001` (Electronic Invoicing & E-Reporting Reform 2026/2027 — universal 1 Sept 2026 reception capability mandate + phased 1 Sept 2027 issuance/e-reporting for SMEs).
    - *Operations & Employment (4):*
      - `FR-INS-001` (Professional Liability Insurance Coverage / RC Pro — priority `recommended` commercial risk management).
      - `FR-SOC-001` (Founder Social Security Affiliation Planning / URSSAF / SSI).
      - `FR-SOC-002` (Mandatory Employee Pre-Hiring Declaration / DPAE — conditioned on positive `HasEmployees: true`).
      - `FR-REG-001` (Regulated Activities & Professional Qualifications Verification).
- **FR-TAX-001 Reform Scope & Limitation:**
  - Step 3.4 models the 1 September 2026 reception mandate as universal for all VAT-subject businesses. Phased issuance and e-reporting dates (1 September 2027 for SMEs/micro-enterprises) are explicitly detailed in statutory guidance.
  - Personalization is limited by available canonical signals (`LegalBusinessProfile` does not contain explicit `VatRegime` or `CompanySize` fields; unknown facts yield `NeedsInformation`).
- **Canonical Legal Planning Readiness Formula:**
  - **Single Authority:** `LegalApplicabilityEngine.ComputePlanningReadiness`
  - **Stage Weights:** Pre-registration = 40%, Launch = 40%, Ongoing = 20%.
  - **Item Weights:** Critical = 2.0, Recommended = 1.0.
  - **Progress Credit:** `completed` = 1.0, `in_progress` = 0.5, `ready_for_review` = 0.5, `not_started` = 0.0, `needs_information` = 0.0, `not_applicable` = excluded.
  - **Meaning:** Represents **Legal Planning Readiness** (not legal certification, legal approval, or guaranteed statutory compliance).
- **Step 3.7 Connection:**
  - `Legal dimension score = (PlanningReadinessPct / 100) * 15` (Max 15 points).
  - Source: `CreatorIdea.Phase3Data.LegalAssessment.PlanningReadinessPct` (0 legacy checklist dependencies).
- **Project Context & Multi-Project Isolation:**
  - All legal endpoints (`overview`, `evaluate`, `item status`, `evidence`, `section-12`) strictly require an explicit `ideaId`.
  - Missing `ideaId` on `GET /api/creator/legal-compliance/section-12` returns HTTP 400 Bad Request.
  - Zero fallbacks to first idea or ambient active idea.
- **Legal Source-Of-Truth Architecture & Compatibility:**
  - **Canonical SSoT:** `CreatorLegalAssessment` (`CreatorIdea.Phase3Data.LegalAssessment`).
  - **Legacy Checklist Compatibility:** `CreatorPhase3Data.LegalChecklist` is preserved strictly for historical BSON document deserialization (0 active readers, 0 new writers).
  - **Compatibility Command Adapters:** `UpdateLegalChecklistItemAsync`, `PATCH /api/creator/legal-checklist/item/{itemId}`, and `POST /api/creator/ai/legal-checklist/generate` act purely as compatibility adapters writing to canonical `LegalAssessment`.
- **Evidence Management & Auditability:**
  - Uses an **Evidence Activity Trail** (append-only activity history tracking upload, status changes, and notes).
- **Final Verification Certification:**
  - Backend Legal tests: 138/138 PASS (0 failed, 0 skipped).
  - Targeted Step 3.4/3.7 tests: 83/83 PASS.
  - Frontend Step 3.4/3.7 tests: 12/12 PASS.
  - TypeScript: 0 errors.
  - Backend build: 0 errors.
  - Frontend build: 187 routes compiled cleanly.
  - UI visual changes: 0.

### 5.5 Step 3.5 — Company Formation & Team (CREATOR PHASE 3.5 — FINAL PASS — FROZEN — CLOSED)
- **Route:** `/dashboard/creator/phase-3/formation`
- **Figma Reference:** 100% verified and aligned against approved Figma Node `57156:8767` ("Company Formation & Team · Creator Phase 3.5").
- **Status:** **FINAL PASS — FROZEN — CLOSED**. UI, Figma structure, tokens, layout, copy, semantics, and API contracts are frozen.
- **Purpose:** Turn the Creator's validated business/legal planning context into a company-formation and initial-team setup plan. Handles: starting configuration, legal structure recommendation, explicit legal structure selection, founder ownership planning, planned leadership role, starting-capital planning, capability/team-gap assessment, formation snapshot/version history, Step 3.4 legal-assessment reconciliation after explicit structure choice, and handoff to Step 3.6.
- **Step 3.4 ↔ Step 3.5 Boundary:**
  - *Step 3.4 (Legal & Compliance):* WHAT legal/compliance obligations apply. Canonical source: `CreatorIdea.Phase3Data.LegalAssessment`.
  - *Step 3.5 (Company Formation & Team):* HOW the company formation and founder/team setup are planned.
  - Step 3.5 consumes Step 3.4. It does **NOT** create a second `LegalApplicabilityEngine`.
- **Canonical Step 3.5 SSoT:**
  - Canonical source: `CreatorIdea.Phase3Data.FormationGenerator` (mirrored/composed into journey state where required by current architecture).
  - Snapshot history: `CreatorIdea.OutputSnapshots.FormationVersions`.
  - `FormationGenerator` = Step 3.5 single source of truth. Zero parallel formation or versioning stores.
- **Canonical Formation Writers:**
  1. `SetFormationAsync` (generation initialization)
  2. `SelectFormationTypeAsync` (explicit legal structure selection)
  3. `DeclareFormationSkillsAsync` (skills, cofounder draft, and setup configuration persistence)
  - All 3 write through existing formation architecture and append timestamped version snapshots to `CreatorIdea.OutputSnapshots.FormationVersions`. Zero second versioning systems.
- **Starting Mode Semantics:**
  - Canonical values: `solo` ("Just me"), `team` ("With co-founders"), `undecided` ("I’m not sure yet").
  - *Critical Semantic Rule:* `StartingMode` DOES NOT confirm legal structure. Founder mode selection must **NOT** silently set `SelectedType`.
- **RecommendedType vs SelectedType:**
  - `RecommendedType`: System/backend recommendation only (advisory).
  - `SelectedType`: Explicit founder-confirmed legal structure only.
  - Zero `RecommendedType` $\to$ `SelectedType` silent copy. Explicit selection occurs strictly through `SelectFormationTypeAsync`.
- **Canonical Legal-Form Codes:**
  - Persisted canonical codes: `SAS`, `SARL`, `SAS-U`.
  - Display formatting may show `SAS-U` $\to$ `SASU`, but persisted canonical value remains `SAS-U`. Zero alternative persisted aliases.
- **Setup Configuration Persistence:**
  - `CreatorFormationGenerator` canonically supports: `StartingMode`, `FounderEquity`, `PlannedRole`, `CapitalAmount`, `CapitalConfirmed`.
  - Persists through `DeclareFormationSkillsAsync` without schema pollution or parallel endpoints.
- **Partial Update & Non-Destructive Semantics:**
  - Optional setup fields use non-destructive partial updates. Omitted values **MUST NOT** overwrite existing canonical values.
  - Omitted `FounderEquity` $\to$ preserve existing persisted `FounderEquity`.
  - Omitted `PlannedRole` $\to$ preserve existing persisted `PlannedRole`.
  - Omitted `CapitalAmount` $\to$ preserve existing persisted `CapitalAmount`.
  - Omitted `CapitalConfirmed` $\to$ preserve existing persisted `CapitalConfirmed`.
  - Zero omitted properties become `0`, `false`, `null`, empty, or default.
- **Unconfirmed Default Protection:**
  - Missing `CapitalConfirmed` $\neq$ `true`. Missing/null legacy value $\to$ unconfirmed (`false` display state, omitted on continue unless explicitly confirmed).
  - Suggested capital: displayed from forecast planning context (e.g. OpEx baseline) as a reference suggestion, but is **NOT** automatically canonical founder-confirmed capital.
  - Missing `FounderEquity`: UI planning display fallback (`100%` solo, `70%` team) is **NOT** automatically persisted merely by page load or Continue.
  - Zero migration-by-page-load.
- **Team Mode Equity Default:**
  - Canonical presentation/default behavior: Team mode: `70%` founder / `30%` team.
  - Conflicting `75%` fallback eliminated across all layers.
  - Display suggestion $\neq$ confirmed canonical ownership until explicitly confirmed/persisted.
- **Capital Semantics:**
  - Starting capital in Step 3.5 is a *planning capital baseline*.
  - Financial Forecast OpEx may be used as planning/reference context. It **MUST NOT** be described as statutory share capital.
  - Founder-confirmed/edited value persists to `FormationGenerator.CapitalAmount`.
  - Confirmation status persists to `FormationGenerator.CapitalConfirmed`.
- **Validations (Authoritative Backend Enforced):**
  - `FounderEquity`: `0 <= FounderEquity <= 100` (400 Bad Request on out-of-range).
  - `StartingMode`: Must be one of `solo`, `team`, `undecided` (400 Bad Request on arbitrary values).
  - `PlannedRole`: Must be one of `President`, `CEO`, `Chief Executive Officer`, `Managing Director (Gérant)`, `Managing Director`. Planning data only.
  - `CapitalAmount`: Must be non-negative (`CapitalAmount >= 0`).
- **Project Isolation:**
  - All Step 3.5 APIs use explicit `ideaId` $\to$ `ResolveIdeaAsync` $\to$ ownership verification.
  - Zero `FirstOrDefault`, zero first-idea, zero cross-project mutation. Multi-project isolation: **PASS**.
- **Step 3.4 Reconciliation:**
  - Only explicit legal structure selection (`SelectFormationTypeAsync`) reconciles company-form-dependent Step 3.4 legal obligations (`FR-CORP-001`, `FR-CORP-002`, `FR-CORP-003`, `FR-CORP-005`).
  - `StartingMode` alone does **NOT** resolve legal-form `NeedsInformation`.
  - `SelectFormationTypeAsync` preserves founder evidence/notes, uses stable rule IDs, recomputes readiness via `LegalApplicabilityEngine`, and does not create duplicate `LegalAssessment` instances.
- **Step 3.6 Handoff:**
  - Continue flow: flush pending formation changes $\to$ persist canonical formation state $\to$ `completeStep(3,5)` $\to$ navigate to `/dashboard/creator/phase-3/business-plan?ideaId=<same ideaId>`. Zero hidden `SelectedType` mutation.
- **UI Freeze Record:**
  - Visual diff: 0. Copy changes: 0. Layout changes: 0. Responsive changes: 0. Figma structure changes: 0.
- **Final Verification Record:**
  - Broad Step 3.5 regression: Backend unit tests 422/422 PASS; Frontend suite 1209/1215 PASS (0 Step 3.5 failures); TypeScript PASS; Backend build PASS; Frontend production build PASS (187 routes).
  - Final semantic fix verification: Focused backend tests 8/8 PASS; Focused frontend tests 6/6 PASS; TypeScript PASS; UI visual diff 0.
  - Full integration suite: **NOT COMPLETED — INFRASTRUCTURE LIMITATION** (MongoDB Atlas free-tier 500/500 collection limit). Verified non-product issue.
- **Continuous Document Architecture (13 Canonical Sections):**
  1. *Section 1: Quiet Intro:* DM Sans header (*"Let’s work out how your company could be set up."*).
  2. *Section 2: Your Setup So Far:* French digital venture summary card and jurisdiction advisory context.
  3. *Section 3: How Are You Planning to Start?:* 3 interactive selectable starting modes (*Just me*, *With co-founders*, *I’m not sure yet*) with reactive state updates.
  4. *Section 4: A Structure to Consider:* Canonical recommendation card (*SASU*, *SAS*, or *SARL*) with "Worth considering" badge, "Why it may fit your plan" (3 checkmark signals), "Things to think about" (4 consideration lines), 4-cell Quick Facts strip (*OWNERS*, *MANAGEMENT*, *OWNERSHIP LATER*, *BEFORE REGISTRATION*), and an exploration selector for alternative structures.
  5. *Section 5: Ownership:* Visual percentage breakdown bar with inline slider/adjustment control (`100%` solo, `70%` team presentation default).
  6. *Section 6: Leadership:* Legal representative card (*Planned role: President / Gérant*) with custom title selector.
  7. *Section 7: Starting Capital Plan:* Large bold starting capital display (seeded from forecast OPEX baseline, e.g. *€5,000*) with *"Looks right"* confirmation and editable input toggle. Missing confirmation does not default to true.
  8. *Section 8: Who Do You Actually Need to Get Started?:* 3-tier capability grid:
     - *YOU CAN HANDLE* (green indicator, chips from `youHave`)
     - *YOU MAY NEED HELP WITH* (amber indicator, chips from `youNeed` / gaps)
     - *NOT NEEDED YET* (muted indicator, growth-stage roles)
  9. *Section 9: One Expanded Team Need:* High-priority launch gap deep-dive (*Backend development* · *Needed before launch*) highlighting an external specialist pathway with 3 actionable decision pills.
  10. *Section 10: Professional Support You May Use:* External advisory cards for non-permanent expertise (*Chartered accountant* & *Legal professional*).
  11. *Section 11: Day 1 vs Later:* 2-column comparative roadmap contrasting immediate Day 1 roster against later growth expansion.
  12. *Section 12: Final Setup Summary:* Dual executive dossiers (*COMPANY* specifications and *TEAM* headcount counts) paired with a quiet statutory legal advice disclaimer.
  13. *Section 13: Footer Navigation:* Ghost *"Legal Roadmap"* Back button (routes to Step 3.4 `/dashboard/creator/phase-3/compliance`) and primary blue *"Continue to Executive Business Plan"* button (routes to Step 3.6 `/dashboard/creator/phase-3/business-plan`).
- **Full-Width Layout & Zero Hardcoded Data Guarantee:**
  - *Full-Width Shell:* Rendered inside `Phase3SetupShell` configured with `fullWidth={true}` and `w-full min-w-0`, perfectly responsive from 1440px to 1920px without arbitrary max-width constraints.
  - *Dynamic Domain Data:* 100% free of static/hardcoded venture mocks. Project name, country, business description, currency symbol, why-it-fits reasoning bullets, leadership roles, starting capital basis, team skill tags, priority launch gap, and Day 1 roster are dynamically bound from `journey.project`, `formation.recommendationFactors`, `forecastBasis`, and `journey.state.phase3.marketStudy`.
- **Formation Engine MVP Product Limitation:**
  > **Known Product Limitation:** Current France MVP formation recommendations are limited to the legal structures supported by the current recommendation engine (SAS, SAS-U, SARL). The engine does not yet represent every possible French business structure (e.g., EURL, Micro-entreprise / Auto-entrepreneur, Entreprise Individuelle).

### 5.6 Step 3.6 — Executive Business Plan (C-3, LIVE & FIGMA-ALIGNED)
- **Route:** `/dashboard/creator/phase-3/business-plan`
- **Figma Reference:** 100% verified against approved Figma Node `57158:10712` (`Mondial-Dashboard-EDU`).
- **Backing Entity & Controller:** `BusinessPlanSession` stored in `BusinessPlanSessions` collection via `BusinessPlanController` (`/api/ai/business-plan`).
- **Inputs Consumed:** `ClarifierSessionId` + `BusinessIdeaId` + live Step 3.3 Financial Forecast Basis + Step 3.5 Formation Generator state.
- **Prerequisite Gate & Branching Rule:**
  - Server-side enforced in `BusinessPlanController.Start`.
  - Fresh Creators without an existing completed Business Plan session MUST complete Step 3.1 (Market Study) and Step 3.2 (Business Model) first (`!hasMarketStudy || !hasBusinessModel` returns HTTP 422 Unprocessable Entity).
  - Legacy Creators who already have a completed Business Plan session keep their position and continue without blocker.
- **Continuous Document Architecture (12 Canonical Chapters):** Rendered as a single continuous scrollable executive document (`BusinessPlanFigmaFlow.tsx`) with a sticky 12-chapter left sidebar navigator (260px) and reactive `Draft` / `Reviewed` badges:
  1. **Executive Summary:** Narrative paragraphs, collapsible *BUILT FROM ASSEMBLED INPUTS* chips (`Project Concept`, `Business Model`, `Financial Forecast`, `Company Setup`), *Mark reviewed*, *Edit text*, and *Rewrite with AI*.
  2. **Problem & Solution (AI Synthesized):** Dual cards (*THE PROBLEM* & *THE PROPOSED SOLUTION*) surfacing AI-synthesized deep problem statements and proposed solutions with `AI Synthesized` badges, full text editing modal, and *Rewrite with AI* (`onRewriteSection('problem-solution')`).
  3. **Market & Customers:** Bound dynamically to `bpOutput.marketAnalysis.targetSegments` and Phase 2 Clarifier pain points.
  4. **Business Model:** Executive summary and 4-cell metric grid (*REVENUE MODEL*, *PRICING*, *DELIVERY*, *MAIN COST AREAS*).
  5. **Competition & Positioning:** 3-column comparative matrix (*ALTERNATIVE*, *CURRENT APPROACH*, *PROPOSED FOCUS*).
  6. **Go-to-Market:** Strategy narrative and *FIRST ACQUISITION CHANNEL* card with dynamic *Active Channel* badge.
  7. **Financial Plan:** 3-Year metrics table (Revenue, Operating costs, Net) + dynamic vector SVG Bar Chart (*FORECAST PROJECTION (3 YEARS)*) calculated from real Step 3.3 monthly forecast cash flows with automated scale ceiling.
  8. **Company & Team:** Bound directly to Step 3.5 Formation Generator (Entity structure `SASU`, 100% Founder, Leadership, Founder Responsibilities, Support).
  9. **Funding Requirements:** Milestone-indexed seed ask deployment and valuation assumptions.
  10. **Operations & Milestones:** 4-stage execution roadmap (*Validate*, *Build*, *Pilot*, *Launch*).
  11. **Risks & Next Steps:** Categorized risk matrix (Regulatory, Adoption, Financial) + 3 prioritized immediate actions.
  12. **Legal & Compliance:** France-first compliance roadmap synced to Step 3.4 Greffe/CNIL statutory requirements.
- **Universal Inline Editing, AI Rewrites & Full Regeneration:**
  - All editable chapters support modal text edits (`PATCH /api/ai/business-plan/{sessionId}/section`) and AI rewriting (`POST /api/ai/business-plan/rewrite-section` via `useRewriteBusinessPlanSection` mutation hook).
  - **Section Rewrite Lifecycle & Race Resolution:** Resolves premature terminal settlement race by waiting for the rewrite mutation to enter its active processing lifecycle (`hasEnteredProcessing: true`) before evaluating terminal state. A rewrite succeeds when `currentVersion > baseVersion`, preserving previous valid content on genuine failure.
  - Full regeneration endpoint: `POST /api/ai/business-plan/{sessionId}/regenerate` wired to the top header toolbar button (*"Regenerate Business Plan"*), preserving exact button position, size, and styling.
  - **Generation & Regeneration Loading Canon:** Aligned with Step 3.1 & Step 3.2 canonical presentation (`RotateCw` spinner, indeterminate progress indicator, `role="status"`, `aria-live="polite"`).
  - **Zero-Blank Regeneration State:** Existing valid Business Plan remains completely visible while regeneration runs with the canonical loading card displayed above it; the new valid plan replaces the previous output only upon successful completion.
  - **Footer Navigation & Review Status Persistence:** Primary *"Continue to Investor Readiness"* navigation button completes Step 3.6 and navigates to Step 3.7 (`/dashboard/creator/phase-3/complete`) with the same `ideaId`.
  - **"Continue to Investor Readiness" Review Persistence Lifecycle:**
    - Lifecycle: Draft sections $\to$ Reviewed $\to$ persisted (`PUT /api/ai/business-plan/{sessionId}`) $\to$ `completeStep(3, 6)` $\to$ navigate to Investor Readiness using same `ideaId`.
    - **Rules:**
      - *Only Draft $\to$ Reviewed:* Remaining Draft sections transition to Reviewed automatically before navigation.
      - *Already Reviewed Preserved:* Sections already marked Reviewed maintain their status and timestamp without reset.
      - *Content Untouched:* Business Plan section text, manual edits, AI outputs, and ordering remain completely untouched.
      - *Awaited Persistence:* Persistence must complete successfully before step completion and navigation execute (failure prevents premature navigation and surfaces friendly error).
      - *Existing Architecture Reused:* Employs existing canonical Business Plan persistence (`_sectionMeta` via `creatorAiApi.editBusinessPlan` / `PUT /api/ai/business-plan/{sessionId}`).
      - *UI Unchanged:* Button label, position, layout, and visual styling remain 100% frozen.
- **Credit Costs & Job Types:**
  - Full Business Plan Synthesis / Regeneration: **25 credits** (`AiJobType.BusinessPlan`).
  - Single Section Rewrite: **5 credits** (`AiJobType.BusinessPlanSectionRewrite`).

### 5.7 Step 3.7 — Phase 3 Complete & Investor Readiness Audit (LIVE)
- **Route:** `/dashboard/creator/phase-3/complete`
- **Backing Controller:** `CreatorPhase3Controller` (`PATCH /api/creator/masterplan/complete`).
- **Objective Diagnostic Audit:** Renders an institutional readiness audit report with an overall score (0–100), readiness grade (`A` / `B` / `C` / `D`), and status tier (`Investor-Ready`, `Strong`, `Developing`, `Not Ready`).
- **Canonical Dimension Weighting (Total = 100):**
  1. *Concept Clarity & Differentiation:* **20 pts**
  2. *Market Evidence & Opportunity Sizing:* **20 pts**
  3. *Financial Projections & Unit Economics:* **25 pts**
  4. *Legal & Compliance Governance:* **15 pts**
  5. *Team Credibility & Founder Advantage:* **20 pts**
  - **Total:** **100 pts**
- **Per-Deduction Breakdown:** Returns structured `Deductions` array (`Dimension`, `Issue`, `PointsLost`, `RemediationTitle`, `RemediationRoute`) detailing specific weak areas with 1-click direct remediation routing.

### 5.10 Zero-Mock & Live-Data Verification Audit
Across the entire 7-step Phase 3 sequence, all rendered metrics, tables, cards, charts, and recommendations are 100% powered by live backend services and database persistence with **zero mock or static placeholder data**:
1. **Step 3.1 (Market Study):** Dynamic `MarketStudySession` from MongoDB `MarketStudySessions`, utilizing `MarketBenchmarkResolver` for sector tailwinds and valuation multiples. Sizing funnel (TAM/SAM/SOM), methodology audit trail, competitor matrix, demand signals, and founder gap validation are 100% dynamic with zero static fallback numbers.
2. **Step 3.2 (Business Model):** Dynamic `BusinessModelSession` from MongoDB `BusinessModelSessions`, structured 9-block Osterwalder canvas matching Figma Node `57156:8456`, live calibrated unit economics (CAC, LTV, LTV/CAC, Payback period computed from pricing and customer acquisition drivers), and step complete checklist. Zero static data.
3. **Step 3.3 (Financial Forecast):** Dynamic `ForecastSession` from MongoDB `ForecastSessions`, live 36-month P&L projection model matching Figma Nodes `57157:9297` & `57157:9348`. Complete elimination of static fallback data: starting budget dynamically seeded from database session, runway and funding gap copy computed live, Market Size TAM formatted dynamically from Step 3.1 inputs, break-even subscribers and revenue derived mathematically, unit economics derived from live operational parameters, and net cumulative cash flow unified across all 3 summary cards and 36 monthly rows.
4. **Step 3.4 (Legal & Compliance Intelligence):** Dynamic France statutory checklist from `CreatorPhase3Controller`, grouped into 4 regulatory domains with live evidence links.
5. **Step 3.5 (Company Formation & Team):** Dynamic formation session (`CreatorFormationGenerator`), discrete recommendation factors (`RecommendationFactors`), override tracking (`IsOverride`), and protected founder skills declarations.
6. **Step 3.6 (Executive Business Plan):** Dynamic `BusinessPlanSession` from MongoDB `BusinessPlanSessions`, continuous 12-section scroll with sticky index and section-level inline markdown editing.
7. **Step 3.7 (Phase 3 Complete & Investor Readiness):** Institutional diagnostic scoring rubric evaluated dynamically across the canonical 20/20/25/15/20 weights.

### 5.11 Creator Asset Library (`/dashboard/creator/asset-library`)
- **Route:** `/dashboard/creator/asset-library`
- **Purpose & Register:** An on-demand venture filing cabinet listing all core project artifacts across Phase 2, Phase 3, and Phase 4 compiled in browser on-demand.
- **The 8-Artifact Catalog (5 Downloadable, 3 In-App Viewable):**
  1. *Phase 2 Brand Identity Kit* (`.ZIP`, Downloadable): Exported via `exportBrandKitZip` with 7 SVG lockups and JSON/CSS tokens.
  2. *Step 3.1 Market Study* (`.PDF`, Downloadable): Rendered via `MarketStudyPrintView.tsx` with full sizing funnel and competitor matrix.
  3. *Step 3.2 Business Model Canvas & Unit Economics* (`.PDF`, Downloadable): Rendered via `BusinessModelPrintView.tsx` with canonical 9-block Osterwalder canvas and modelled-vs-validated unit economics.
  4. *Step 3.3 Financial Forecast* (`.PDF`, Downloadable): Rendered via `ForecastPrintView.tsx` with exact 3.3 design, vector summary charts, 36-month P&L tables, unit economics, zero business plan contamination, and brand logo.
  5. *Step 3.4 Legal & Compliance Roadmap* (`IN_APP`, Viewable): Direct deep link to `/phase-3/compliance`.
  6. *Step 3.5 Formation Memo* (`IN_APP`, Viewable): Direct deep link to `/phase-3/formation`.
  7. *Step 3.6 Executive Business Plan* (`.PDF`, Downloadable): Rendered via `PlanForecastPrintView.tsx` with continuous 12-section layout.
  8. *Step 3.7 Investor Readiness Summary* (`IN_APP`, Viewable): Direct deep link to `/phase-3/complete`.
- **Honest Copy & Clear Alerts**:
  - No tabs; all 8 artifacts are listed in a unified, phase-grouped filing cabinet.
  - Un-downloadable items state plainly that the document exists and can be viewed in the project.
  - Export or fetch failures trigger visible on-screen dismissible alert banners rather than silent incomplete downloads.

### 5.12 Document & PDF Export Infrastructure
- **Browser-Generated Print Documents:** Exports are compiled directly on-demand in the client browser, eliminating static file storage so exports always reflect the latest live project data:
  1. **Market Study Print View (`MarketStudyPrintView.tsx`):** Standalone clean printable document layout for Step 3.1 containing the full sizing funnel, methodology audit trail, competitor matrix, demand signals, and founder gap validation matching Figma Node `57078:11039` design structure. Dynamically fetches and embeds the brand's transparent logo (`logoVariations.transparent`) in the report header and watermark footer. Accessible via "Export PDF" from `/dashboard/creator/phase-3/market-study` and the Creator Asset Library.
  2. **Business Model Print View (`BusinessModelPrintView.tsx`):** Standalone clean printable document layout for Step 3.2 matching Figma Node `57156:8456` design structure. Contains the 9-block Osterwalder canvas (with page-break protection and numbered blocks), calibrated unit economics strip, step complete checklist, transparent brand logo, and professional print CSS page-break rules. Accessible via "Export PDF" from `/dashboard/creator/phase-3/business-model` and the Creator Asset Library.
  3. **Financial Forecast Print View (`ForecastPrintView.tsx`):** Standalone clean printable document layout for Step 3.3 (Financial Forecast) strictly containing 100% Step 3.3 data with zero business plan contamination. Features exact 1:1 vector charts (`RevenueAreaSvg`, `CostVsRevenueCrossingSvg`, `Cash36BarSvg`), continuous 36-month consolidated table with year subtotals, calibrated unit economics, break-even formula, operational assumptions, transparent brand logo, and print CSS page-break isolation. Accessible via "Download report" from `/dashboard/creator/phase-3/forecast` and "Export PDF" in the Creator Asset Library.
  4. **Executive Business Plan Print View (`PlanForecastPrintView.tsx`):** Standalone clean printable document layout for Step 3.6 (Executive Business Plan), redesigned to match the full 12-chapter executive business plan layout. Features an executive cover masthead with sector/country metadata, a 12-chapter Table of Contents, 3-Year P&L financial summary table, break-even KPI cards, Recharts projection trajectory, Chapter 08 Company & Team breakdown (SASU/SAS, equity, leadership role, skills/needs), Chapter 09 Funding Requirements (seed ask & 18-24m deployment), Chapter 10 Operations & Milestones roadmap, Chapter 11 Risks & Next Steps register, and Chapter 12 Legal & Compliance statutory framework. Completely bound to dynamic venture records with zero static fallback numbers. Accessible via "Export PDF" / "Download" from `/dashboard/creator/phase-3/business-plan`, `/dashboard/creator/phase-3/complete`, and the Creator Asset Library.
  5. **Brand Kit ZIP Exporter (`exportBrandKitZip`):** Client-side JSZip engine packaging 7 vector SVGs, 3 token manifests, and README.md.

### 5.13 Design References & Conformance Status
- **Phase 2 Brand Studio:** 100% verified against approved Figma node dumps (`figma_creator_identity_nodes.json`, Nodes `57004:...`, `57012:...`).
- **Step 3.1 Market Study:** 100% verified against approved Figma design reference (Figma Node `57078:11039` / `57156:8209`) with responsive 1440px–1920px verification, proportional funnel, competitor matrix, and synchronized PDF export.
- **Step 3.2 Business Model:** 100% verified against approved Figma design reference (Figma Node `57156:8456`) with responsive 1440px–1920px verification, 9-block Osterwalder canvas, calibrated unit economics strip, completion checklist, and synchronized PDF export.
- **Step 3.3 Financial Forecast:** 100% verified against approved Figma design references (Figma Node `57157:9297` & `57157:9348`) with responsive 1440px–1920px verification, continuous 8-section command dashboard, exact 1:1 vector SVG summary cards (`RevenueAreaSvg`, `CostVsRevenueCrossingSvg`, `Cash36BarSvg`), live 36-month consolidated data table, zero static fallback data, and synchronized PDF export.
- **Step 3.5 Company Formation & Team:** 100% verified against approved Figma design reference (Figma Node `57156:8767`) with continuous 13-section single-scroll executive layout, interactive starting plan selector (Just me / With co-founders / I’m not sure yet), dynamic entity recommendation card (SASU / SAS / SARL) with 4-cell Quick Facts strip, visual 100% ownership breakdown bar, leadership role card, starting capital plan with inline validation, 3-column team capability distribution (You Can Handle / You May Need Help With / Not Needed Yet), priority launch need deep-dive (Backend development / external specialist pathway), professional support cards (Accountant & Legal), Day 1 vs Later team roadmap, dual summary dossiers (Company & Team), and 100% globals.css token compliance.
- **Step 3.6 Executive Business Plan:** 100% verified against approved Figma design reference (Figma Node `57158:10712`) with continuous 12-chapter document layout, sticky 260px chapter navigator with interactive `Draft`/`Reviewed` status, AI-synthesized Chapter 02 Problem & Solution with inline edits and section rewrites, live 3-Year forecast table and vector SVG chart, zero-static data binding to Step 3.3 and Step 3.5, typography canon standardization (Inter headings, DM Sans body, JetBrains Mono strictly on numbers), and responsive 1440px–1920px verification.
- **Step 3.7 Phase 3 Complete & Investor Readiness Audit:** 100% verified against approved Figma design reference (Figma Node `57160:11404` — "Executive Business Plan · Creator Phase 3.7") with 3-tab executive workspace (*OVERVIEW*, *DOCUMENTS*, *READINESS*), institutionally weighted diagnostic scorecard (100 pts), 4-cell metric ribbon, structured deduction cards with direct remediation links, and dynamic venture asset download links.

---

## 6. Phase 4 — Construction & Launch Preparation (Canonical Engine — LIVE & FROZEN)

Phase 4 bridges strategic formulation and operational execution through seven canonical, interconnected engines. It shifts the venture from *"Understanding the Business"* (Phase 3) into *"Preparing to Build and Launch"*:

```text
CANONICAL PHASE 4 ARCHITECTURE (4.1 → 4.7 LIVE & FROZEN):

1. Phase 4.1: Construction Snapshot (/dashboard/creator/phase-4)
   WHAT is ready, partial, missing, or critical across the business foundation.

2. Phase 4.2: Operational Roadmap (/dashboard/creator/phase-4/roadmap)
   WHEN and IN WHAT ORDER work should happen across 6 operational horizons.

3. Phase 4.3: Needs Analysis & Requirements (/dashboard/creator/phase-4/needs)
   WHAT resources/services/tech/finance/legal/admin/infrastructure are needed.

4. Phase 4.4: Skills & Training Plan (/dashboard/creator/phase-4/skills)
   HOW capability gaps are resolved: LEARN / DELEGATE / VERIFY.

5. Phase 4.5: Aids, Grants & Public Support (/dashboard/creator/phase-4/support)
   WHICH public/institutional support schemes and grants may apply.

6. Phase 4.6: Pricing & Revenue Model (/dashboard/creator/phase-4/pricing)
   WHAT customer pricing and revenue mechanics produce positive contribution margin.

7. Phase 4.7: GTM & Launch Strategy (/dashboard/creator/phase-4/gtm)
   HOW early customers are systematically acquired, validated, and converted.

8. Phase 4.8: Launch Assets (NEXT APPROVED STAGE — One-Page Professional Launch Website)
   CREATE customer-facing launch materials (Website, messaging, collateral).

9. Phase 4.9: Construction Readiness (RESERVED)
   Final global readiness assessment prior to commercial activation (Phase 5).
```

### 6.0 Core Architectural Invariants

1. **State Ownership:** `CreatorJourney.Phase4Data` owns all project Phase 4 state in MongoDB.
2. **Upstream Referencing:** Phase 4 stages reference upstream data by IDs/versions rather than duplicating large upstream objects.
3. **Staleness Model:** Explicit provenance tracking (`Update Available`, `Changed Sources`, `Review Changes`, `Refresh`, `Keep Current`). Founder edits are **never silently overwritten**.
4. **Deterministic Policy vs AI:**
   - Deterministic logic owns statuses, math, floor prices, applicability, eligibility rules, and capacity limits.
   - AI is strictly advisory, explanatory, and presentational.
5. **No Premature Global Readiness %:** Global Construction Readiness is owned exclusively by Stage 4.9. Stages 4.1–4.7 track only their own completion status.
6. **Retirement of Legacy Phase 4:** The legacy `/dashboard/creator/offer-pricing` route, `CreatorPhase4Controller`, and legacy components (`Phase4Pricing`, `Phase4Resource`, `Phase4Gtm`, `Phase4Complete`) are completely retired.
7. **Phase 3 → Phase 4 Access Gate & HumainX Continuation (`Phase4ProfileGuard`):**
   - **Canonical Entry Sequence:**
     1. *Phase 3 Completion:* `state.journeyState.phase3.status === 'completed'` (incomplete $\to$ existing "Phase 3 Must Be Completed First" screen).
     2. *Quick Start / Core Profile Readiness:* `completeness.phase4Ready` (missing core fields $\to$ Phase 4 Personalization checklist card).
     3. *Full HumainX Profile Completion:* `completeness.profileCompletion >= 100`.
        - If `profileCompletion < 100`: seamlessly resumes in existing HumainX Full Profile Builder (`/dashboard/creator/profile`) preserving all previous answers, binding to the same `ideaId`, and setting `returnTo` back to Phase 4 (`/dashboard/creator/phase-4?ideaId=<ideaId>`).
        - If `profileCompletion >= 100`: unlocks and renders Phase 4 main flow (`ConstructionSnapshotView`).
   - **Canonical Authorities:**
     - Phase 3 Completion: `state.journeyState.phase3.status === 'completed'` via `useCreatorProgress()`.
     - Quick Start / Core Readiness: `completeness.phase4Ready` from `GET /api/profile/me/completeness`.
     - Full HumainX Completion: `completeness.profileCompletion >= 100` from `GET /api/profile/me/completeness`.
     - Profile Completeness Backend Authority: `ProfileCompletenessResolver` via `GET /api/profile/me/completeness`.
     - HumainX Profile SSoT: `ProfessionalProfileRecord` in MongoDB (`ProfessionalProfiles` collection).
   - **Canonical Phase 4 API Client:**
     - Phase 4 client (`src/lib/api-creator-phase4.ts`) strictly uses the canonical Axios client (`api` from `@/lib/axios`) with relative endpoints (`/creator/phase4/...`), eliminating manual `NEXT_PUBLIC_API_URL` interpolation and duplicate `/api/api` path risks.
   - **Important Invariants:**
     - Phase 3 completion and HumainX profile readiness are strictly separate checks.
     - `Phase4ProfileGuard` no longer depends on deprecated `GET /api/creator/offer/readiness`.
     - UI layout, cards, styling, and copy remain completely frozen.

### 6.1 Stage 4.1 — Construction Snapshot (`page.tsx` + `ConstructionSnapshotView.tsx`)
- **Route:** `/dashboard/creator/phase-4`
- **Controller:** `CreatorPhase4ConstructionController` (`GET /api/creator/phase4/construction-snapshot`, `POST /api/creator/phase4/construction-snapshot/generate`, `POST /api/creator/phase4/construction-snapshot/refresh`).
- **Services:** `ConstructionSnapshotService`, `CreatorJourneyService`, `ProfileCompletenessResolver`, `CapabilityMatcher`.
- **Page-Level Header (Canonical Structure):**
  - Rendered inside the main content container (`w-full max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8`) above the status summary:
    - *Eyebrow:* `"PHASE 4 · STEP 4.1"` (`text-xs font-semibold tracking-wider text-muted-foreground uppercase`)
    - *Title:* `"Construction Snapshot"` (`text-2xl sm:text-3xl font-bold text-foreground tracking-tight`)
    - *Supporting text:* `"See what’s ready, what needs attention, and where to go next."` (`text-sm text-muted-foreground max-w-2xl leading-relaxed`)
- **Endpoints & Optimistic Concurrency Contract:**
  - `GET /api/creator/phase4/construction-snapshot?ideaId={ideaId}`: Read-only retrieval of persisted snapshot, category items, and source staleness detection.
  - `POST /api/creator/phase4/construction-snapshot/generate?ideaId={ideaId}&expectedVersion={version}`: Idempotent generation. Requires `expectedVersion` on initial write; returns existing snapshot without re-running if one already exists.
  - `POST /api/creator/phase4/construction-snapshot/refresh?ideaId={ideaId}&expectedVersion={version}`: Explicit regeneration against latest project intelligence, financial forecast, legal assessment, and HumainX profile data. Requires valid `expectedVersion`.
  - *Query & Body Contract:* `{ ideaId, expectedVersion }` submitted in both URL query params and request body; controller validates consistency and rejects conflicting parameters with HTTP 400 Bad Request.
  - *Version Lineage & Response Headers:* Publishes `X-Creator-Idea-Version` response header and returns `data.ideaVersion` in payload.
  - *HTTP 409 Conflict Recovery:* When concurrent writes occur in another tab, the client reloads the latest snapshot (`loadSnapshot()`) and project composite (`refetch()`) to restore state safely and offers a non-destructive retry.
- **Taxonomy Categories (15 Canonical Categories):**
  - `Business Foundation`, `Brand`, `Market`, `Business Model`, `Finance`, `Legal & Administration`, `Team`, `Skills`, `Services`, `Technology`, `Funding`, `Pricing`, `Go-to-Market`, `Launch Assets`, `Operations`.
- **Item Statuses (5 Diagnostic Tiers):**
  - `Ready` (green), `Partial` (amber), `Missing` (gray/slate), `Critical` (rose/red), `Optional` (blue/muted), `NeedsReview` (grouped within Partial with actionable notice).
- **Core UI Structure:**
  1. *Compact Page Header:* Eyebrow, Title, and descriptive subtitle.
  2. *Component 1: Status Summary:* 5-column metric grid reporting exact counts (`Ready`, `Partially Ready`, `Needs Attention`, `Critical Blockers`, `Optional`).
  3. *Critical Blockers Alert:* Surfaces critical blockers with anchor navigation when `criticalCount > 0`.
  4. *Stale Snapshot Banner:* Appears when upstream sources change, with `"Refresh Snapshot"` and `"Keep Current"` controls.
  5. *Component 2: Category Breakdown:* 15 collapsible category cards with requirement status badges, detail accordions, and external service provider recommendations.
  6. *Footer Navigation:* Primary CTA `"Continue to Operational Roadmap →"` routing to Step 4.2 (`/dashboard/creator/phase-4/roadmap?ideaId={ideaId}`) preserving the active idea scope.
- **No Deceptive Percentages:** The snapshot reports raw category counts rather than misleading composite percentages. All data is dynamically derived from live database records.

### 6.2 Stage 4.2 — Operational Roadmap (`OperationalRoadmapView.tsx`)
- **Route:** `/dashboard/creator/phase-4/roadmap`
- **Figma Reference & Layout:** 100% aligned with approved Figma Node `57221:10450` ("Operational Roadmap · Creator Phase 4.2"). Responsive 1440px–1920px container (`w-full max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8`) with dark/light theme token compliance (`globals.css`).
- **Backing Controller & Services:**
  - Controller: `CreatorPhase4ConstructionController` (`GET /api/creator/phase4/roadmap`, `POST /api/creator/phase4/roadmap/generate`, `POST /api/creator/phase4/roadmap/refresh`, `POST /api/creator/phase4/roadmap/task`, `POST /api/creator/phase4/roadmap/activate`, `POST /api/creator/phase4/roadmap/availability`, `POST /api/creator/phase4/roadmap/keep-current`).
  - Services: `OperationalRoadmapService`, `RoadmapScheduler`, `IFounderCapacityResolver`.
- **Page Header (Canonical Structure):**
  - Rendered at top of content container:
    - *Eyebrow:* `"PHASE 4 · STEP 4.2"` (`text-xs font-semibold tracking-wider text-muted-foreground uppercase`)
    - *Title:* `"Operational Roadmap"` (`text-2xl sm:text-3xl font-bold text-foreground tracking-tight`)
    - *Supporting text:* `"Turn your project requirements into a practical plan that fits your availability."` (`text-sm text-muted-foreground max-w-2xl leading-relaxed`)
- **Planning Context (Three-Column Layout):**
  - *Card 1: Your Availability:* Displays real weekly commitment (e.g. `"10–20 hours/week"`) and capacity tier (`Balanced (10–20 hrs)`). Includes interactive `"Adjust Availability"` modal offering 5 canonical presets (`<5 hrs`, `5–10 hrs`, `10–20 hrs`, `20–30 hrs`, `30+ hrs`) that persist via `POST /api/creator/phase4/roadmap/availability`.
  - *Card 2: Planned Now:* Summarizes immediate workload for the Now stage: exact task count, known effort in hours (e.g. `"~3.5 hrs known effort"`), and count of unestimated tasks without assuming missing estimates are 0.
  - *Card 3: Capacity Guardrail & Plan Status:*
    - Central rule-engine pacing guardrail enforcing realistic task limits per availability tier:
      - `<5 hrs/week`: Max 2 Now tasks
      - `5–10 hrs/week`: Max 3 Now tasks
      - `10–20 hrs/week`: Max 5 Now tasks
      - `20–30 hrs/week`: Max 7 Now tasks
      - `30+ hrs/week`: Max 9 Now tasks
    - Live Plan Status badge: `Draft`, `Active`, or `Completed`.
- **Next Best Action ("Start Here" Hero Card):**
  - Dynamically selected from topological dependency DAG based on unblocked status and highest urgency/priority (e.g. `"Confirm SAS-U Entity Formation Plan"`).
  - Displays Title, Purpose / Context ("Why Now"), Priority badge, Estimated Effort, and Upstream Prerequisites.
  - Action controls:
    - `"View Task Details"`: Smoothly scrolls to and auto-expands the specific task card in the roadmap.
    - Status quick-actions: `"Start This Action"` / `"Mark Done"` mutating task state directly.
- **Six Canonical Roadmap Groups (Execution Horizons):**
  1. `Now` (Immediate focus — capacity bounded, zero unresolved blockers)
  2. `Next 30 Days` (Near-term foundation, market validation, and business modeling)
  3. `Days 30–60` (Month 2 build, commercial pricing packages, and statutory partner engagements)
  4. `Days 60–90` (Month 3 go-to-market testing and pre-launch readiness)
  5. `Before Launch` (Mandatory pre-launch administrative gates, statutory formation filings, and launch asset preparation)
  6. `After Launch` (Post-launch operations, customer support, and recurring statutory declarations)
- **Task Row Architecture & Dependency Separation:**
  - *Title & Badges:*
    - Priority badge: `Critical`, `High`, `Medium`, `Low`.
    - Effort badge: Formatted as `~N hrs` (e.g. `~3.5 hrs`) when numerical estimates exist; cleanly falls back to `Effort: Medium` or `Effort: Small` when numerical estimates are unavailable.
    - Status chip: `NotStarted`, `InProgress`, `Blocked`, `Done`, `Skipped`, `NeedsReview`.
  - *Strict Separation of Dependency Impact from Task Status:*
    - **`Blocks N tasks`** (amber badge): Rendered when other roadmap tasks depend on this task (`task.unblocks.length > 0`).
    - **`Blocked by N prereqs`** (rose badge): Rendered when incomplete prerequisites prevent progress.
  - *Expandable Detail Drawer:*
    - *Expected Result:* Clear definition of done for the milestone.
    - *Why It's Here:* Rationale derived from upstream diagnostic or statutory requirements.
    - *Prerequisites / Blocked By:* Lists required prior tasks with individual status chips (`Done`, `InProgress`, `NotStarted`).
    - *Blocks Downstream Tasks:* Lists specific downstream tasks unlocked upon completion.
    - *Built From (Provenance):* Source origin badges (e.g. `Construction Snapshot`, `Formation & Team`, `Market Study`).
    - *Inline Task Adjustment:* In-place editor for Task Status, Target Window, and Founder Notes, persisting via `POST /api/creator/phase4/roadmap/task`.
- **Real Project Data Binding & Upstream Provenance:**
  - 100% bound to real MongoDB project records with zero mock data: `ConstructionSnapshot` (Phase 4.1), `CreatorLegalAssessment` (Phase 3.4), `CreatorFormationGenerator` (Phase 3.5, with `SelectedType` or `RecommendedType` fallback), `ForecastSession` (Phase 3.3), `BusinessPlanSession` (Phase 3.6), and `ProfessionalProfileRecord.VentureContext`.
- **Task Deduplication, Canonical Keys & Edit Preservation:**
  - *Canonical Skill Gap Keys:* Capability gaps from both `ConstructionSnapshot.MissingItems` and `Formation.YouNeed` converge on single canonical keys formatted as `skill-gap.{slug}` (e.g. `skill-gap.financial-advisor` titled `"Engage Financial Advisor Capability"`).
  - *Founder Skill Exclusions:* Skills already verified in founder's `ReadyItems` (e.g. `skill_full-stack developer`) are checked and excluded from generating redundant skill gap tasks.
  - *Statutory Service Preservation:* `legal_service` (`"Structure Legal & Statutory Filing Service"`, category `Services`) is preserved as a distinct Month 2 statutory formalization partner task, dependent on `formation.confirm-structure`.
  - *Founder State Preservation on Refresh:* In `ReconcileTasks`, legacy keys (`skill_{slug}`) are mapped to canonical keys (`skill-gap.{slug}`), preserving founder notes, custom target windows, and manual statuses across roadmap refreshes.
- **Distinction Between Legal Assessment Readiness and Statutory Task Completion:**
  - In Construction Snapshot, the legal assessment item is precisely titled **`"Legal Assessment & Compliance Framework"`**, denoting that the regulatory review in Phase 3 is completed.
  - In `WireDependencies`, ready items from legal assessment or snapshot are strictly prevented from auto-completing corporate filing prerequisites (`FR-CORP-*`, company registration, statuts, JAL, RBE). Statutory filings remain blocked until real prerequisite milestones are achieved.
- **Dependency Resolution, Event-Dependent Scheduling & Honest Empty States:**
  - Explicit DAG dependency wiring: `formation.confirm-structure` unblocks statutory partners (`legal_service`, `accounting_service`); corporate statuts (`FR-CORP-002`) and capital deposit (`FR-CORP-001`) precede legal notice (`FR-CORP-003`) and formal INPI registration (`FR-CORP-004`).
  - *Event-Dependent Scheduling:* Tasks triggered by external milestones rather than static dates state this clearly (e.g. `legal.fr-soc-002` DPAE social declaration: Target Window is `"Timing unresolved (≤ 8 days before employee start date)"` with earliest start `before_launch`).
  - *Honest Empty States:* Stages with 0 tasks render an honest message ("No tasks scheduled for this horizon yet — tasks populate as prerequisites are met.") instead of false placeholders or phantom entries.
- **Optimistic Concurrency Contract & HTTP 409 Recovery:**
  - All roadmap mutations (`generate`, `refresh`, `task`, `activate`, `availability`, `keep-current`) require consistent `ideaId` and `expectedVersion` across URL query params and request body.
  - Backend publishes `X-Creator-Idea-Version` response header and returns `data.ideaVersion`.
  - On HTTP 409 Conflict, UI reloads latest state (`loadRoadmap()` + `refetch(ideaId)`) without destroying user inputs, displaying a non-destructive retry banner.
- **Navigation Flow (4.1 $\to$ 4.2 $\to$ 4.3):**
  - *Upstream:* Step 4.1 Construction Snapshot (`/dashboard/creator/phase-4?ideaId={ideaId}`).
  - *Current:* Step 4.2 Operational Roadmap (`/dashboard/creator/phase-4/roadmap?ideaId={ideaId}`).
  - *Downstream:* Step 4.3 Needs & Requirements (`/dashboard/creator/phase-4/needs?ideaId={ideaId}`).
  - *Footer Actions:*
    - `"Back to Construction Snapshot"` returns to Step 4.1.
    - `"Activate Roadmap & Continue"` persists activation state via `POST /api/creator/phase4/roadmap/activate` and advances to Step 4.3. On revisit of an active plan, button displays `"Continue to Needs & Requirements"`.
  - *Explicit Scope Boundary Note:* Stage 4.3 (Needs & Requirements) is pre-existing canonical architecture; it is not newly implemented in this Phase 4.2 delivery.
- **Verification & Acceptance Records:**
  - *Automated & Unit Testing:* 33/33 unit tests pass in `CreatorPhase4RoadmapTests.cs` (including `Duplicate_Skill_Gaps_Merged_And_Ready_Skills_Excluded` and `LegalCompliance_Assessment_Does_Not_Satisfy_Statutory_Execution_Prerequisites`).
  - *Browser & DOM Verification:* Playwright live browser E2E test on affected project verified 10 persisted tasks across stages and confirmed 0 literal `"svg"` text nodes in DOM.
  - *User Acceptance Record:* Formally verified and accepted by user ("The user has confirmed the current result works correctly").

### 6.3 Stage 4.3 — Needs Analysis & Requirements (`NeedsAnalysisView.tsx`)
- **Route:** `/dashboard/creator/phase-4/needs`
- **Figma Reference & Layout:** 100% aligned with approved Figma design (File key `yLDPLB9hIAIqfYY9uHuJom`, Frame `57221:11163`, Requirements list `57221:11197`, Expanded requirement `57221:11282`).
  - Max content width: `1120px` (`max-w-[1120px] mx-auto`).
  - Section gaps: `24px` (`space-y-6`), Requirement card gaps: `12px` (`space-y-3`).
  - Requirement cards: White/card background, subtle borders, `16px` corners (`rounded-2xl`), `20px` row padding (`p-5`).
  - Category icon containers: `32px` with `8px` corners (`w-8 h-8 rounded-lg flex items-center justify-center shrink-0`).
  - Expanded inset panels: `12px` corners (`rounded-xl p-5 bg-muted/20 border border-border/70`).
  - Responsive across `1440px` and `1920px` desktop viewports down to narrow mobile (`375px`) with complete dark/light theme token compliance (`globals.css`).
- **Controller & Services:**
  - Controller: `CreatorPhase4ConstructionController` (`GET /api/creator/phase4/needs`, `POST /api/creator/phase4/needs/generate`, `POST /api/creator/phase4/needs/refresh`, `POST /api/creator/phase4/needs/keep-current`, `PATCH /api/creator/phase4/needs/{needKey}`, `PUT /api/creator/phase4/needs/{needKey}/state`).
  - Services: `NeedsAnalysisService`, `CreatorJourneyService`, `ICapabilityMatcher`, `IConstructionSnapshotService`, `IOperationalRoadmapService`.
- **Page-Level Header (Canonical Structure):**
  - Rendered at top of content container:
    - *Eyebrow:* `"PHASE 4 · STEP 4.3"` (`text-xs font-semibold tracking-wider text-muted-foreground uppercase`)
    - *Title:* `"Needs & Requirements"` (`text-2xl sm:text-3xl font-bold text-foreground tracking-tight`)
    - *Supporting text:* `"Review what your project needs, what you already have, and what remains to be covered."` (`text-sm text-muted-foreground max-w-2xl leading-relaxed`)
- **Update Available Notice:**
  - Compact warm-tinted alert banner rendered conditionally when upstream project information changes (`updateAvailable === true`):
    - Title: `"Update available:"` (fixes Figma typo `"Updat available"`).
    - Copy: `"Changed project information may affect these needs. Updates detected in: {sources}."`
    - Action 1: `"Review changes"` — opens accessible modal exposing upstream diff and explicit refresh action (`POST /api/creator/phase4/needs/refresh`).
    - Action 2: `"Keep current version"` — persists source version acknowledgement to `POST /api/creator/phase4/needs/keep-current` so the banner clears permanently until future upstream edits occur.
  - Re-generation and refresh strictly preserve all founder decisions, notes, and submitted capabilities by stable requirement key (`Key`).
- **Compact Summary Surface (Single Horizontal Card):**
  - Left: Total authoritative requirements count (e.g. `6 Requirements`).
  - Compact badges: `● {count} Satisfied` (emerald), `● {count} Identified` (muted).
  - Supporting copy: *"Confirming a need records your decision. It does not mean the need has been met."*
  - Subtle vertical divider on desktop.
  - Right: Awaiting review counter (e.g. `6 needs are awaiting your review` in warm amber, or `All needs reviewed` with green checkmark when 0).
  - All metrics computed strictly from authoritative requirement items.
- **Requirement Accordion List (Full-Width Compact Rows):**
  - Desktop row anatomy:
    - 32px Category Icon container (Sky blue for Skills/Team, Purple for Services, Amber for Legal & Admin, Green for Finance).
    - Uppercase small category label (`SKILLS`, `SERVICES`, `LEGAL & ADMIN`, `FINANCE`).
    - Requirement title (e.g. `"Capability: Financial Advisor Capability"`, `"Statutory Share Capital Deposit"`).
    - Priority tag (`· Critical priority`, `· High priority`, `· Medium priority`).
    - Fulfilment status badge (`● Identified`, `● Satisfied`).
    - Decision badge (`Confirmed`, `Awaiting your review`, `Deferred`).
    - Inline action buttons on awaiting-review rows: `"Confirm need"` (card background with border), `"Defer for now"` (subtle text).
    - Dedicated accordion toggle chevron with accessible keyboard controls (`aria-expanded`, `aria-controls`).
  - Long titles and badges wrap gracefully without overlapping or clipping across all viewports.
- **Expanded Requirement Breakdown (5-Section Inset Panel):**
  - Two desktop columns:
    - Left column: `WHAT IS NEEDED`, `WHY THIS APPLIES`.
    - Right column: `WHAT YOU ALREADY HAVE`, `WHAT IS STILL MISSING`.
  - Full-width lower section with subtle hairline divider: `WHAT WOULD SATISFY THIS NEED`.
  - All content is derived dynamically from real project facts and diagnostic models (Snapshot, Roadmap, Legal Assessment, Forecast, Business Model). No hardcoded sample claims.
  - **Connected Work:** Lists linked operational roadmap tasks as compact bordered chips showing real task title, status, and navigation to the Roadmap task preserving `ideaId`.
  - **Built From (Provenance):** Displays genuine source origin chips (e.g. `Construction Snapshot`, `HumainX Profile`, `Company Formation`, `Financial Forecast`) paired with working `View source ↗` navigation.
  - **Founder Information Panel:**
    - Header: `"Provide information about an existing capability, resource, or asset"`.
    - Textarea with contextual placeholder.
    - Actions: `"+ Add what I have"` (primary submit), `"Defer for now"`.
    - Footnote copy: *"Founder-provided details will be assessed against this requirement's criteria. Adding details records your information; it does not automatically mark the need Satisfied."*
    - Persisted via `PUT /api/creator/phase4/needs/{needKey}/state` with non-destructive reload preservation. Rejects blank submissions.
- **Domain Semantics & Decision Independence:**
  - **Decision ≠ Fulfilment:**
    - `Confirm need` (`FounderState = Confirmed`) records acceptance/relevance by the founder. It does NOT mark the requirement `Satisfied`.
    - `Defer for now` (`FounderState = Deferred`) records postponement.
    - Adding founder information records evidence in `FounderInformation`. It does NOT auto-satisfy the need.
    - `Satisfied` requires authoritative evaluation against the requirement's criteria.
  - Legal assessments or formation plans do not prove statutory company registration is complete.
  - Verified founder capabilities inform needs dynamically without redundant duplicates.
- **API, Concurrency & State Ownership:**
  - Persisted strictly to `CreatorIdea.Phase4Data.NeedsAnalysis` via `SetPhase4NeedsAnalysisAsync` with `WriteIdeaAsync`.
  - Enforces `ideaId` validation, `expectedVersion` matching, `HttpContext.Items["CreatorIdeaVersion"]`, and `X-Creator-Idea-Version` response header.
  - Returns authoritative `IdeaVersion` on all responses.
  - HTTP 409 Conflict handling with non-destructive state reload and retry.
- **Footer Navigation (4.2 $\to$ 4.3 $\to$ 4.4):**
  - Thin top divider.
  - Left: `"Back to Roadmap"` linking to `/dashboard/creator/phase-4/roadmap?ideaId={ideaId}`.
  - Supporting copy: `"Your reviewed needs will help shape the next step."`
  - Primary pill button: `"Continue to Skills & Training →"` linking to canonical Step 4.4 `/dashboard/creator/phase-4/skills?ideaId={ideaId}`.
- **Verification & Acceptance Evidence:**
  - *Frontend Unit Tests:* 11 / 11 tests pass in `src/__tests__/creator/phase4-needs-analysis.test.tsx` (summary counts, confirm inline action, defer inline action, 2-column analytical breakdown, founder information submission, update available banner, footer navigation).
  - *Backend Service Tests:* 16 / 16 tests pass in `CreatorPhase4NeedsTests.cs` (including `Founder_Decision_And_Information_Do_Not_Automatically_Satisfy_Need` and `Keep_Current_Preserves_Version_And_Clears_Update_Available`).
  - *TypeScript & Solution Build:* `npx tsc --noEmit` PASS (0 errors); `dotnet build backend/WebApp.csproj` PASS (0 errors).
  - *Playwright Browser E2E Test (`verify_browser_needs.mjs`):* Live execution against running application verified real project data (6 requirements, 0 satisfied, 6 identified), update available banner detection, review modal display, keep current version POST (HTTP 200), confirm need PATCH (HTTP 200), expanded 2-column breakdown, founder information submission PATCH (HTTP 200), persistence across page reload, and responsive rendering at 1440px desktop, 1920px desktop, and 375px mobile viewports.

### 6.4 Stage 4.4 — Skills & Training Plan (`page.tsx` + `SkillsPlanView.tsx`)
- **Figma Reference & Layout:** 100% verified against approved Figma design (File key `yLDPLB9hIAIqfYY9uHuJom`, Frame `57221:11470` "Skills & Training · Step 4.4 Full Plan"). 1120px max content width, 24px section gaps, 12px card gaps, responsive across 1440px desktop, 1920px widescreen, and 375px mobile viewports with strict semantic token compliance (`globals.css`).
- **Canonical Route:** `/dashboard/creator/phase-4/skills`
- **Controller:** `CreatorPhase4ConstructionController` (`GET /api/creator/phase4/skills-plan`, `POST /api/creator/phase4/skills-plan/generate`, `POST /api/creator/phase4/skills-plan/refresh`, `POST /api/creator/phase4/skills-plan/keep-current`, `PATCH /api/creator/phase4/skills-plan/{resolutionKey}`).
- **Services:** `SkillsResolutionService`, `CapabilityResolutionPolicy`, `NeedsAnalysisService`, `OperationalRoadmapService`, `CreatorJourneyService`.
- **Compact Page-Level Header:**
  - *Eyebrow:* `"PHASE 4 · STEP 4.4"` (`text-xs font-semibold tracking-wider text-muted-foreground uppercase font-mono`)
  - *Title:* `"Skills & Training Plan"` (`text-2xl sm:text-3xl font-bold text-foreground tracking-tight`)
  - *Supporting text:* `"Map capabilities to learn, delegate, or verify based on your background, project scope, and weekly time."` (`text-sm text-muted-foreground max-w-2xl leading-relaxed`)
- **Eight Canonical Figma UI Components:**
  1. **Component 1: Upstream Update Notice:** Amber alert banner triggered when upstream sources (Needs Analysis, Roadmap, HumainX profile, Legal Assessment) have updated. Provides `"Review changes"` modal and `"Keep my choices"` action calling `POST /api/creator/phase4/skills-plan/keep-current` to synchronize source versions without losing founder decisions.
  2. **Component 2: Compact Skills Summary Header:** Displays `{total} project skills`, `{covered} covered` (emerald badge), `{attention} need attention` (amber badge), alongside project metadata (`PROJECT SCOPE: {projectName}`, `REGION: France`).
  3. **Component 3: Existing Strengths ("You can already handle"):** Lists capabilities already covered by founder's background or prior phase milestones. Features `"Update my experience ↗"` link to profile and `"Why this matches"` modal explaining coverage evidence.
  4. **Component 4: Resolution Approach Legend:** 3 cards explaining the resolution strategies in plain language:
     - *Learn:* `"Build the skills to do it yourself."`
     - *Delegate:* `"Get help from someone with the right skills."`
     - *Verify:* `"Check whether your experience covers this work."`
  5. **Components 5, 6, 7: Need Attention Cards & Dynamic Inset Panels:**
     - *Header Strip:* Capability name, `Needs attention` badge, `Launch-Blocking` tag (if blocking), and `Statutory` lock icon (if mandatory verification).
     - *Strip Meta:* Current level, Recommended mode, and Your choice (`{Mode} (Selected)`).
     - *Rationale:* Contextual explanation of why this approach was recommended.
     - *3-Button Mode Selector:* Interactive pills for `Learn`, `Delegate`, and `Verify`. Enforces statutory verification safety lock (disables Learn/Delegate when `isMandatoryVerification` is true).
     - *Delegation Detail Panel (Component 5):* 6-field structured brief preview (Capability needed, Target timing, Suggested budget tier, Working language, Estimated weekly time, Expected deliverable dynamically derived from `res.delegationRequirement.expectedOutcome` or `res.capability`) with action buttons (`View brief`, `Edit brief`, `Add existing support`).
     - *Learning Detail Panel (Component 6):* `WHAT YOU'LL BE ABLE TO DO`, `WHAT YOU'LL CREATE`, 4 practical learning steps dynamically derived from curated domain taxonomy (`res.learningAction.learningTopics` from `CapabilityResolutionPolicy` for Tech, Design, Ads, SEO/Content, Sales, Finance, Operations), Training options box, and Workload Impact Preview dynamically calculating weekly availability vs already planned and proposed learning hours with buffer calculation and link to roadmap changes.
     - *Verification Detail Panel (Component 7):* 3 analytical columns (`What needs checking`, `What you can share`, `What is still unclear`) dynamically derived from `res.verificationRequirement` and `res.capability`, with `"See what to share"` Evidence Guide modal and `"Choose Verify"` button.
     - *Built-from Provenance:* Displays source tags (`Needs & Requirements`, `Creator profile`, `Operational Roadmap`, etc.) and `"Why this suggestion?"` explanation modal.
     - *Zero Static/Mock Data Guarantee:* All cards, subtitle descriptions, practical learning steps, deliverables, verification columns, and hours are 100% dynamically bound from backend resolution entities and user profile data; all hardcoded Figma sample copy fallbacks have been eliminated.
  6. **Component 8: Quiet Journey Footer Navigation:**
     - Left: `"← Back to Needs & Requirements"` linking to `/dashboard/creator/phase-4/needs?ideaId={ideaId}`.
     - Right: Primary CTA `"Continue to Aids & Support →"` linking to Step 4.5 `/dashboard/creator/phase-4/support?ideaId={ideaId}`, with supporting text *"Save your choices and explore support for your project."*
- **Zero Static/Mock Data Audit:**
  - Audited fullstack data flow. Identified and replaced 7 static fallback strings borrowed from Figma sales card with 100% dynamic data binding: card subtitles, 4 practical learning steps, deliverables, verification 3-column analysis, workload hours and buffer, and quiet notes.
  - Practical learning steps dynamically bind to `CapabilityResolutionPolicy.cs` curated taxonomy (Finance -> Cash flow / P&L, Tech -> Architecture / APIs, Sales -> ICP / Pitching, Design -> Design systems, etc.), ensuring every capability card reflects true domain-specific guidance without hardcoded sales outreach copy.
- **Resolution Engine Rules & Invariants:**
  - *Pass-through Coverage:* Phase 4.3 Covered Requirements pass through as `Covered` and are separated from attention cards.
  - *Mandatory Statutory Verification:* Regulated requirements (e.g. Legal Capital Deposit, Share Capital, Trademark filing) enforce `VERIFY`. The policy rejects founder overrides to Learn or Delegate with HTTP 403 Forbidden.
  - *Founder Decision Preservation:* Re-generation or refresh preserves founder choices and custom notes across re-derivation cycles by stable resolution key (`Key`).
- **Concurrency & Concurrency Recovery:**
  - Scoped to `CreatorIdea.Phase4Data.SkillsPlan` via `SetPhase4SkillsPlanAsync` with `WriteIdeaAsync`.
  - Requires `expectedVersion`, validates concurrency, passes `X-Creator-Idea-Version` response headers, and gracefully handles HTTP 409 Conflict with non-destructive reload.
- **Verification Evidence:**
  - Automated Unit Tests: 14/14 PASS (`CreatorPhase4SkillsTests.cs`); Frontend tests: 11/11 PASS (`phase4-skills-plan.test.tsx`).
  - Full Creator Vitest Suite: 150/150 PASS across 12 test files.
  - Live Browser E2E: Playwright test verified 1440px desktop, 1920px widescreen, 375px mobile, Delegation Brief modal, and Evidence Guide modal with 0 DOM errors and 0 layout overflows.
  - TypeScript & Build: `npx tsc --noEmit` 0 errors; `dotnet build backend/WebApp.csproj` 0 errors.

### 6.5 Stage 4.5 — Aids, Grants & Public Support (`SupportPlanView.tsx`)
- **Route:** `/dashboard/creator/phase-4/support`
- **Controller:** `CreatorPhase4ConstructionController` (`GET /api/creator/phase4/support`, `POST /api/creator/phase4/support/generate`, `POST /api/creator/phase4/support/refresh`, `PATCH /api/creator/phase4/support/{supportKey}`).
- **Services:** `SupportPlanService`, `SupportCatalogueService`, `SupportEligibilityEngine`, `SupportMatchingService`.
- **Selection Modes:** `Entitlement`, `Discretionary`, `Competitive`, `CreditAssessment`, `NeedsReview`.
- **Eligibility Statuses:** `EligibleToApply`, `Awarded`.
- **Critical Invariant:** `EligibleToApply` ≠ spendable launch cash. Potential or unawarded grants are strictly excluded from spendable launch budgets.

### 6.6 Stage 4.6 — Pricing & Revenue Model (`PricingStrategyView.tsx`)
- **Route:** `/dashboard/creator/phase-4/pricing`
- **Controller:** `CreatorPhase4ConstructionController` (`GET /api/creator/phase4/pricing`, `POST /api/creator/phase4/pricing/generate`, `POST /api/creator/phase4/pricing/refresh`, `PATCH /api/creator/phase4/pricing/{offerKey}`).
- **Services:** `PricingStrategyService`, `PricingPolicyEngine`.
- **13 Supported Models:** OneTime, Subscription, UsageBased, TransactionFee, Commission, Retainer, ProjectBased, Freemium, Tiered, MarketplaceFee, Licensing, Hybrid, Other.
- **Floor Formulas:**
  - Percentage contribution margin: $P_{min} = \frac{VC}{1 - m}$
  - Absolute contribution: $P_{min} = VC + A$
- **Tax Semantics:** Explicit `ConfiguredTaxMode` (`HT`, `TTC`, `Exempt`, `Unknown`). Zero crude B2B/B2C automatic tax inferences.
- **Four-Price Independence:** `RecommendedPrice`, `FounderSelectedPrice`, `MarketReferencePrice`, and `ValidatedMarketPrice` are tracked independently. `ValidatedMarketPrice` strictly requires empirical evidence (paid pilot, preorder, historical sale).

### 6.7 Stage 4.7 — GTM & Launch Strategy (`GtmStrategyView.tsx`)
- **Route:** `/dashboard/creator/phase-4/gtm`
- **Controller:** `CreatorPhase4ConstructionController` (`GET /api/creator/phase4/gtm`, `POST /api/creator/phase4/gtm/generate`, `POST /api/creator/phase4/gtm/refresh`, `PATCH /api/creator/phase4/gtm/channels/{channelKey}`, `POST /api/creator/phase4/gtm/experiments/{experimentKey}/runs`).
- **Services:** `GtmStrategyService`, `GtmPolicyEngine`.
- **Multi-Signal Sales Motion:** Considers price, founder capacity, sales cycle, and buyer persona.
- **Budget Provenance:** Distinguishes `ForecastCacAssumption`, `ObservedCac`, and `ValidatedCac`. If pricing is `NeedsValidation`, GTM enforces validation-first testing before paid scaling.
- **Immutable Experiment Evidence:** Completed validation runs and evidence are never deleted during refreshes.

### 6.8 Stage 4.8 — Launch Assets (Next Approved Stage)
- **Approved Direction:** **One-Page Professional Launch Website** (responsive, branded, component-based, section families: Hero, Problem, Solution, Features, How It Works, Offer/Pricing, Social Proof, FAQ, Final CTA).
- **Storage Decision:** Active configuration in `CreatorJourney.Phase4Data.LaunchAssets`. Historical generated revisions stored in dedicated `LaunchAssetVersions` to avoid unbounded MongoDB documents.
- **Current Status:** **APPROVED ARCHITECTURE / NOT PART OF CURRENT COMMIT**.

### 6.9 Stage 4.9 — Construction Readiness
- Final deterministic assessment synthesizing all 8 stages into launch certification.
- **Current Status:** **RESERVED FOR FUTURE APPROVED TASK**.

### 6.10 Typography & Token Compliance
All Phase 4 screens strictly adhere to the project design canon:
- **Headings:** Inter (`font-heading font-semibold text-foreground`).
- **Body & Paragraphs:** DM Sans (`font-sans text-muted-foreground / text-foreground`).
- **Numerals & Metrics:** JetBrains Mono (`font-mono tabular-nums`).
- **Theme Support:** 100% semantic color tokens (`bg-card`, `border-border`, `text-primary`, etc.) across Light and Dark themes (1440px–1920px responsive).

### 6.11 Phase 4 Single Source Authorities & Clean Baseline

```text
CREATOR PHASE 2–5 CLEAN BASELINE

Phase 2 Brand authority:
BrandKit (canonical visual identity authority; CreatorIdea.Project.Branding is derived projection only)

Phase 3.4 Legal authority:
CreatorLegalAssessment (CreatorIdea.Phase3Data.LegalAssessment)

HumainX onboarding authority:
ProfessionalProfileRecord.QuickStart (sole onboarding journey authority; localStorage has no access/progression authority)

Phase 4 completion authority:
Phase4CompletionResolver (sole Phase 4 completion authority across all 7 stages: 4.1–4.7)

Founder capacity authority:
IFounderCapacityResolver (sole founder-capacity authority)

Pricing authority:
PricingPolicyEngine (canonical pricing-policy authority)

Legacy legal business logic:
0

Legacy compatibility surfaces:
Retained intentionally where needed for backward compatibility (1 BSON field, 1 command adapter, 2 HTTP endpoints)

Phase 4.8:
NOT IMPLEMENTED (Next approved stage)

Phase 4.9:
RESERVED (Construction readiness)
```

---

## 7. Phase 5 — Cross-Roads

The critical strategic decision phase where the venture branches into commercialization.

### Path A — Marketplace (Active Offers: Full Buyout OR Co-Founder / Equity)
- **Listing Authority:** Embedded directly in `CreatorIdeas.Phase5Data.PathA.MarketplaceListing`. Projected dynamically via `MarketplaceProjectDto` (there is NO separate `MarketplaceProjects` MongoDB collection).
- **Active Marketplace Offers:**
  1. **Full Buyout** — 100% IP/asset acquisition by an investor or entrepreneur. Triggers `DealExecutions` pipeline.
  2. **Co-Founder / Equity** — Partnership offer bringing on a co-founder in exchange for equity stake.
- **Superseded Offers:** Legacy `Sell / License`, `License-only`, and `Revenue-share` offers are obsolete and removed from the active marketplace.
- **Marketplace Behavior on Build / Level Up:**
  - When the founder initiates Build Yourself (Path B) or triggers Level Up:
    - **Full Buyout path/listing:** $\to$ **PAUSED** (cannot sell 100% of a company actively being incorporated).
    - **Co-Founder / Equity offer:** $\to$ **REMAINS AVAILABLE** according to canonical product rules (founder can continue seeking equity partners while building).
- **AI IP Valuation:** LIVE (5-factor scoring, 10/day rate limit).
- **NDA Gate:** LIVE (required before buyer can view confidential project details).

### Path B — The Big Leap (Private Venture Spinout — NOT a Marketplace Offer)
- **Canonical Behavior:** Choosing Build / The Big Leap is a private venture spinout progression, NOT a marketplace listing. It initiates the path to Level Up (Phase 6).
- **Path-Switch Window:** Once a path is chosen, switching between Path A and Path B is permitted within a 30-day window (`PathSwitchWindow = TimeSpan.FromDays(30)` in `CreatorJourneyService.cs:40`). After 30 days elapse, the decision locks permanently. (Active canon does NOT use 72 hours).
- **Deferred Compliance:** Company document verification does NOT happen in Phase 5 — it is deferred to Entrepreneur Phase 2.

---

## 8. Phase 6 — Level Up & Continuity Invariants

### 8.1 Creator → Entrepreneur Continuity Invariants (Continuation, Not Restart)
Level Up represents an atomic, server-side promotion from idea formulation into institutional execution. In strict accordance with the RC1 continuity contract:
- **Project identity preserved:** `Project.Name`, `Category`, `Tagline`, and sector classifications carry through.
- **Brand identity preserved:** All 7 Brand Kit vector lockups, 5-role color tokens, and 4-role typography pairings remain intact.
- **Market Study preserved:** TAM/SAM/SOM sizing and competitor matrices transition intact.
- **Business Model preserved:** Osterwalder canvas, pricing tiers, and unit economics are retained.
- **Financial Forecast preserved:** 36-month P&L model and parameters remain live.
- **Legal baseline preserved:** `CreatorJourney.Phase3Data.LegalAssessment` is frozen as the immutable Creator baseline.
- **Evidence links preserved:** All attached compliance evidence records carry through without loss.
- **Business Plan preserved:** Complete 12-section executive business plan transitions intact.
- **Section 12 preserved:** Statutory legal and regulatory framework carries through.
- **Readiness baseline preserved:** Institutional diagnostic score and deductions baseline are recorded.
- **Zero Physical Document Duplication:** Documents are referenced directly into the Entrepreneur Data Room as private/draft assets without duplicating files on the physical filesystem.

### 8.2 Security Architecture & Tenant Isolation (Verified Live)
- **True Two-Real-User Cross-Tenant JWT Enforcement:**
  - Verified live with two distinct authenticated users (`User A` victim and `User B` attacker) using authentic HMAC-SHA256 signed JWTs.
  - **7 / 7 Unauthorized IDOR Access Attempts:** User B attempts to access User A's Creator Journey, Creator Documents, Legal Evidence, Financial Forecast session, Business Plan session, Company entity, and Data Room documents all returned **HTTP 403 Forbidden**.
  - **HTTP 200 Data Leaks:** Exactly **0**.
- **Two-Tier Directory Traversal Defense:**
  - *Tier 1 (Perimeter Router):* Live reverse proxy and ASP.NET Core URL router normalize relative traversal tokens (`../`, `..\`) in path parameters before route matching, returning HTTP 404 Not Found.
  - *Tier 2 (Canonical-Root Filesystem Guard):* `CreatorIdeaDocumentsController` (lines 190–194) and `CompanyService` (lines 2678–2686) enforce `Path.GetFullPath(target).StartsWith(Path.GetFullPath(root))` checks, rejecting `../`, `..\`, absolute paths, and escaping filenames with `UnauthorizedAccessException` (HTTP 403). Router normalization alone does NOT replace this internal guard.

---

## 9. Next Operational Steps (Post-RC1 Freeze)

With Creator MVP RC1 formally frozen, the immediate operational sequence is:
```text
RC1 Freeze
→ Staging Deployment
→ Production Configuration Audit
→ Small Real-User Pilot
→ Feedback / Telemetry Collection
```
*(Stage 13 feature development is deferred until post-pilot review).*

---

## 10. Certified Test Results Accounting (RC1 Release)

```
========================================================================================
                              RC1 CERTIFIED TEST METRICS
========================================================================================
 Suite                         Total        Passed       Failed   Skipped    Blocked
----------------------------------------------------------------------------------------
 Backend (xUnit.net net8.0)    2,105        1,976        0        129*       0
 Frontend Vitest Suites          119          119        0          0        0
 Frontend Vitest Unit Tests    1,028        1,028        0          0        0
 Frontend TypeScript (`tsc`)       -        0 errors     0          -        0
 Next.js Turbopack Build         181 routes   181 built  0          -        0
 Responsive Viewport Audit       4 viewports  0px ovf    0          -        0
========================================================================================
 *Note: The 129 skipped tests reside exclusively in legacy non-Creator marketplace/escrow
 transaction test fixtures and do not affect the Creator MVP domain.
========================================================================================
```

---

## 11. Changelog

**2026-09-24 — Step 3.6 Typography Canon, Step 3.7 Figma 57160:11404 Alignment, and Executive 12-Chapter PDF Export Redesign.**
- **Step 3.6 Executive Business Plan Typography Canon:**
  - Standardized font typography across all 12 chapters: `font-heading` (`Inter`) for page/chapter headings, `font-sans` (`DM Sans`) for body paragraphs, cards, badges, and table headers.
  - Eliminated monospace leakage (`font-mono` on prose/labels): removed from `DRAFT` status badge, `AI Synthesized` badge, table column headers (`YEAR 1`, `YEAR 2`, `YEAR 3`), and milestone phase names (`Phase 1`–`Phase 4`). Monospace is strictly isolated to currency figures, percentages, and numeric quantities.
  - Replaced all remaining arbitrary bracket font sizes (`text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[28px]`) with canonical tokens (`text-badge`, `text-caption`, `text-body`, `text-card-title`, `text-table-header`, `text-section-title`).
  - Standardized chapter headers with uniform `h2 className="text-section-title font-heading font-bold text-foreground"`.
  - Fixed sticky behavior for the left Chapter Navigator (`sticky top-20`) and added `MoreHorizontal` (`•••`) button to the top toolbar.
  - Eliminated redundant outer shell header on Step 3.6 (`hideHeader={showDocument}`) when viewing the assembled plan.
- **Executive PDF Export View Redesign (`PlanForecastPrintView.tsx`):**
  - Completely redesigned `PlanForecastPrintView.tsx` into a modern 12-chapter executive business plan export matching Step 3.6 and Figma Node `57158:10712`.
  - Added executive cover and masthead with sector pill, jurisdiction pill, base currency, and quick 12-chapter Table of Contents.
  - Fully bound all 12 chapters to dynamic venture records: Executive Summary, AI-Synthesized Problem & Solution, Market & Customers, Business Model, Competitor Comparison Matrix, Go-to-Market, 3-Year Financial Plan & Projections (with 3-Year summary table, break-even KPIs, Recharts trajectory, consolidated year-chunked table, and assumptions), Company & Team (SASU/SAS, equity %, leadership role, founder skills, team gaps), Funding Requirements (seed ask & 18–24m deployment allocation), Operations & Milestones (phased roadmap), Risks & Next Steps (categorized risk register), and Legal & Compliance (statutory readiness score, applicable statutory areas, priority open items, disclaimer).
  - Print optimization: `break-inside-avoid` on cards and tables, high-contrast borders, clean pagination, and sleek top toolbar for browser "Save as PDF".
- **Step 3.7 Phase 3 Complete & Readiness Alignment (Figma Node `57160:11404`):**
  - Integrated `InvestorReadinessFigmaFlow.tsx` matching Figma Node `57160:11404` with 3-tab workspace (*OVERVIEW*, *DOCUMENTS*, *READINESS*), institutionally weighted diagnostic scorecard, 4-cell metric ribbon, structured deduction cards with remediation routes, and direct document download links.
- **Verification:** `npx tsc --noEmit` clean with 0 errors; full Vitest suite passing with 8/8 tests across `PlanForecastPrintView12Chapters.test.tsx`, `ForecastViewAndPrintTolerance.test.tsx`, and `BusinessPlanStep36Design.test.tsx`.

**2026-09-19 — Creator MVP RC1 Freeze & Certification (PASS WITH MINOR DOCUMENTED LIMITATIONS).**
- **RC1 Code Freeze:** Declared full code and feature freeze across Phases 1–6. Core Freeze Policy active.
- **Stage 10 Live Verification Passed:** Confirmed live legal refresh preservation, live idempotency (0 duplicate entities), and 4-surface freshness consistency across `Phase3LegalCard`, `Legal Workspace`, `Business Plan Section 12`, and `Investor Readiness`.
- **Cross-Tenant Security Live Verified:** Two real users with valid JWTs verified across 7 attack vectors; 7/7 returned HTTP 403 Forbidden with 0 data leaks. Two-tier path traversal defense classified.
- **Authoritative France Legal Catalog:** Documented version `FR-2026.1` with 18 canonical rules from `FranceRules.json`. Enforced principle that deterministic rules determine statutory applicability while AI provides explanatory support.
- **Legal Source of Truth Defined:** Clarified Creator baseline vs Entrepreneur operational legal state with deep-copy isolation.
- **Business Plan Canon:** Certified 12-section architecture with Section 12 (Legal & Regulatory Framework) across interactive UI, print view, and PDF export.
- **Investor Readiness Weighting Corrected:** Corrected documentation drift to match canonical production weights: Concept 20, Market 20, Financials 25, Legal 15, Team 20 (Total 100).
- **Formation Engine MVP Limitation Disclosed:** Explicitly recorded limitation to SAS, SAS-U, and SARL for France MVP.
- **Path-Switch Window:** Verified canonical 30-day window (`PathSwitchWindow = 30 days`); eliminated obsolete 72-hour references.
- **Creator $\to$ Entrepreneur Continuity:** Formalized 10 continuity invariants with zero physical document duplication.
- **Test Suite Reconciled:** 100% mathematical reconciliation: Backend 2,105 total (1,976 passed, 0 failed, 129 legacy skipped, 0 blocked); Frontend 1,028 passed (119/119 files, 0 TS errors, 181/181 routes compiled).


**2026-09-18 — Phase 3 Complete Redesign (Screens 3.3–3.7), Backend Additions, and Zero-Mock Audit.**
- **Step 3.3 (Business Plan):** Redesigned from accordion to continuous scrollable document with sticky 11-section index and universal inline markdown editing (`PATCH /api/ai/business-plan/{id}/section/{sectionId}`) with word count and diff tracking.
- **Step 3.4 (Financial Forecast):** Unified workspace merging assumptions and projection results. Interactive Live Assumptions drawer with re-run capabilities and full 36-month tabbed financial tables.
- **Step 3.5 (Legal Checklist):** Structured into 4 clear regulatory domains with detailed descriptions, expandable "Why this is essential" context boxes, and deep links to `/marketplace?category=legal` / `compliance`.
- **Step 3.6 (Company Formation):** Added discrete recommendation reasoning (`RecommendationFactors`), override tracking (`IsOverride`), and protected founder skills declarations with clobber guard.
- **Step 3.7 (Phase 3 Complete):** Institutional diagnostic readiness audit with overall score (0–100), structured `Deductions` array (`Dimension`, `Issue`, `PointsLost`, `RemediationTitle`, `RemediationRoute`), 1-click remediation links, and optimistic concurrency version locking (`hasCompletedRef`).
- **100% Zero Mock/Static Data Audit Pass:** Confirmed full live database integration across all 7 steps with MongoDB collections (`MarketStudySessions`, `BusinessModelSessions`, `BusinessPlanSessions`, `ForecastSessions`, `CreatorIdeas`). Zero hardcoded fallback figures.

**2026-09-17 — Phase 3 Market Study & Business Model: Enum Normalisation & Logging.**
- **Lenient Normalisation with Conservative Fallbacks:** `BusinessModelOutputParser` and `MarketStudyOutputParser` normalize LLM output strings to canonical enums (`evidenceLevel`: `evidenced`/`modelled`/`untested` with `untested` safe fallback; `confidenceLevel`: `high`/`moderate`/`speculative` with `speculative` fallback; `threatLevel`/`impactOnSom`: `low`/`medium`/`high` with `medium` fallback; `period`: `monthly`/`annual` with `monthly` fallback). Coerced values are recorded via `ILogger.LogWarning`.
- **Methodology Canon Alignment:** Clarified `marketSizing.methodology` as a freeform descriptive string explaining derivation arithmetic and triangulation formulas, with a parser fallback of `"triangulated"`.
- **Frontend Error Visibility:** `MarketStudyPage` and `BusinessModelPage` badges explicitly style canonical values and render unexpected out-of-contract strings with destructive styling (`border-destructive/60 bg-destructive/10 text-destructive`) rather than quietly absorbing them in neutral styling.

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

**2026-09-13 — Creator Stabilization 03: Build Yourself Direct Level Up.**
- **Phase 5 completion engine:** Build path (`ChosenPath == "build"`) with Phase 4 completed now marks Phase 5 as completed and unlocks Phase 6 without requiring seed funding. Path A requirements remain strictly enforced.
- **Level Up readiness:** Build Yourself readiness checks no longer block on `company_setup` or `funding_preparation`. Sub-documents are marked non-blocking and deferred to the Entrepreneur journey.
- **Legal structure fallback:** Level Up resolves legal structure using fallback order: `PathB.CompanyFormation.SelectedType` -> `Phase3Data.FormationGenerator.SelectedType` -> `Phase3Data.FormationGenerator.RecommendedType` -> `"SAS"`.
- **Funding ask behavior:** If `PathB.SeedFunding` is not specified, `Company.FundingAskAmount` remains null (deferred truthfully to Entrepreneur Phase 5). Initial ownership defaults to Founder 100%.
- **Crossroads Path B UI:** Replaced legacy `CompanyPlanningCard` and `FundingPreparationCard` with a clean private venture spinout confirmation and readiness summary card. Shared cards are preserved intact for the Entrepreneur acquisition workflow.

**2026-07-23 — reconciled with code (Phase 2/3).**
- **AI provider:** consolidated to single-provider OpenRouter `google/gemini-3.8-flash` for all tasks; removed the Anthropic-Claude / meta-llama split (no `AnthropicClient` exists). §1, §4, §5.
- **Discovery (P2):** now LIVE — both entry cards ship; Discovery seeds a Completed clarifier session at `finalize-discovery` (skips the clarifier, satisfies the P3 chain); mid-flow resume derived server-side (2C-2) + resolver-mapped (2C-3); stale "Discovery removed" comments corrected. §2, §4.
- **AI failure handling:** failed sessions not linked; request-failure vs parse-failure distinguished; HTTP timeouts classified permanent (no Hangfire auto-retry); honest failure UI, never blank. §4.
- **Phase-3 3.1 screen removed:** the "Financial Modeling Inputs" form (discarded values) deleted; `/phase-3` redirects to business plan. §5.1.
- **Forecast:** new **dedicated inputs page** (plan → forecast-inputs → results, inputs persisted + pre-filled); **36-month horizon = 12 AI + 24 deterministically derived** from the user's growth rate, with a required projection disclosure; 120s HTTP timeout. §5.1.
- **PDF export (new):** combined plan+forecast print view, year-grouped 36-month tables. §5.8.
- **Legal checklist gate:** the "all mandatory Done" intent is now **implemented** (shared predicate in derivation + endpoint, uniform, no grandfathering; compliance page gates Continue). §5.3.
- **Phase-3 completion:** documented as **success-gated** (Status Completed + version), not session-id presence. §5.7.
- **Poll policy:** 60/3-min → **96 attempts / 4 min**; clarifier + ai-processing consolidated onto the shared constants. §5.5.

**2026-09-16 — Phase 2 Brand Studio: Systematic Audit Pass & AdvanceStep Idempotency.**
- **AdvanceStep Idempotency (Defect #9):** `POST /api/creator/journey/phase2/brand-kit/advance` now treats `targetStep == kit.CurrentStep` on an already-"complete" kit as a 200 no-op (re-confirming an already-satisfied milestone) returning the current kit state unchanged with no `Version` increment, eliminating 400 errors during Hub/Studio re-confirmations. Genuine backwards attempts (`targetStep < kit.CurrentStep`) remain guarded and return 400. §1.5.2.
- **Full Systematic Code-Review Audit:** Verified end-to-end code paths across all backend endpoints (`strategy`, `direction`, `logo`, `colors`, `typography`, `advance`, `open-studio`, `snapshots`), `Project.Branding` 4-field sync, credit debit/refund ordering, and all 7 frontend modals, confirming defects #1 through #9 fixes remain intact.
- **Typography Badge Alignment:** `TypographySystemModal.tsx:285` badge chip corrected from `5 Credits` to `2 Credits`, aligning frontend UI with backend `appsettings.json` pricing.
- **Step-Numbering Drift Resolution:** Corrected modal header step eyebrow counters from legacy `"OF 7"` across all 7 modals to strictly align with the canonical 6-segment progress bar scheme:
  1. Strategy: `STEP 1 OF 6 • BRAND STRATEGY`
  2. Direction: `STEP 2 OF 6 • Visual Direction Board`
  3. Logo Type: `STEP 3 OF 6 • Architectural Mark Form`
  4. Logo Creation: `STEP 4 OF 6 • Logo Creation`
  5. Variations: `STEP 4 OF 6 · VARIATIONS • LOGO SET`
  6. Colour: `STEP 5 OF 6 · COLOUR SYSTEM`
  7. Typography: `STEP 6 OF 6 • TYPOGRAPHY`
**2026-09-18 — Creator Phase 3: Systematic Audit & Closure (DECLARED CLOSED & STABLE).**
- **Closure & Freezing:** Phase 3 (Steps 3.1 Market Study, 3.2 Business Model, 3.3 Business Plan, 3.4 Financial Forecast, 3.5 Compliance, 3.6 Formation, 3.7 Readiness Audit) is formally declared **CLOSED and STABLE**. Architecture frozen against new features or redesigns; critical bug fixes only.
- **Honest-Labelling & AI Glyph Enforcement:** Verified across all 7 steps. Sparkle/Wand glyphs strictly restricted to real AI model calls (3.1 Market Study, 3.2 Business Model, 3.3 Business Plan synthesis & rewrite, 3.4 Forecast). Deterministic features (3.5 Legal standard templates, 3.6 Rule-engine recommendation factors, 3.7 Diagnostic scoring rubric) are cleanly labelled with non-AI icons (`FileText`, `Sliders`, `CheckCircle2`, `BarChart3`).
- **Route Consolidation:** Removed legacy redirect shim `/phase-3/forecast-inputs`; Step 3.4 operates as a single unified workspace at `/dashboard/creator/phase-3/forecast`.
- **Cross-Module Data Integrity:** Verified zero mock data. Business Plan continuously references upstream source models without forking editable state duplicates.
- **Explicit Out-of-Scope Items Tracked:**
**2026-09-18 — Creator Phases 4, 5 & 6 Failure Mode Hardening & Stabilization.**
- **Phase 5 Silent Publish Fix (§7):** `CrossroadsPathA.tsx` now explicitly validates zero or empty asking prices for Full Buyout mode. Displays a clear error banner (`role="alert"`) and highlights the invalid price input (`border-destructive ring-1 ring-destructive`) instead of failing silently.
- **Phase 5 Swallowed Inquiry Load Fix (§7):** Failed `GET /creator/marketplace/interests` calls now render a retryable error container (`"Couldn't load buyer inquiries. Please check your connection and retry."`) with a dedicated "Retry Inquiries" button rather than misleading the creator with a false "0 inquiries" empty state.
- **Phase 4 Live Forecast Divergence Flag (§6.1):** `Phase4Pricing.tsx` dynamically derives `forecastOutdated` in real-time upon mounting and on price changes by comparing entry tier price against `insights.forecastContext.arpu` (flagging divergence if >= 10%) rather than relying solely on stale persisted flags.
- **Phase 6 Sparkle Glyph Enforcement (§8):** In accordance with Canon §1.8/§1.9, removed `<Sparkles />` glyphs from non-generative features in `investors/page.tsx` (deterministic investor matching pill replaced with `<Users />`, legal `CO-FOUNDED` corporate status badge replaced with `<Building2 />`).
- **Phase 4 Platform Builder Placeholder Removed (§6.3):** Removed the disabled `"Use Platform Builder coming soon"` button from the web presence checklist in `Phase4Gtm.tsx`.
- **Phase 4 Dynamic Tier Clamping (§6.1):** Added dynamic tier addition (`addTier`, capped at 5) and deletion (`removeTier`, floored at 3) controls to `Phase4Pricing.tsx` with live counter header `({tiers.length}/5)`, aligning the UI with backend validation rules (3–5 tiers).
- **Transaction Guard Verification (§8.3):** Confirmed `Mongo:TransactionsEnabled: true` in all environment configs and verified `StartupConfigValidation` enforces it at boot; non-transactional fallback in `CreatorPhase6Controller` is strictly guarded by `_isDevelopment` for mock test suites and returns HTTP 503 in production.
**2026-09-19 — Stage 2: Product-Wide Typography Scale Migration (Phase 2 & Brand Studio).**
- **Canonical Role Token Migration:** Replaced 100% of arbitrary bracket font sizes (`text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[13px]`, `text-[15px]`) across all Phase 2 pages and Brand Studio components with the product-wide semantic scale (`text-page-heading`, `text-section-title`, `text-card-title`, `text-body`, `text-label`, `text-input`, `text-button`, `text-caption`, `text-table-header`, `text-footnote`, `text-badge`, `text-stat-lg`, `text-stat-xl`).
- **Zero Arbitrary Brackets:** Zero `text-[...px]` values remain in Phase 2 or Brand Studio source code.
- **Mono-on-Prose Leakage Resolution:** Removed `font-mono` on natural language paragraphs (Audience, Positioning, Concept summaries, and loading messages) in `BrandKitHubView.tsx` and `VariationSetModal.tsx`, restoring `font-sans text-body`. `font-mono` is strictly restricted to HEX/RGB values, character counts, file sizes, step numbers, and telemetry.
- **Viewport Scroll Measurement Audit:** Measured all 7 Brand Studio modals at 1440×900 and 1920×1080 across Light and Dark themes. Verified that all internal containers maintain clean overflow scrolling with sticky header/footer action strips.
- **Build Breakage Audit & Reconciliation:** Resolved pre-existing TypeScript and JSX compilation breaks in `PlanForecastPrintView.tsx`, `asset-library/page.tsx`, `investors/page.tsx`, `api-creator-journey.ts`, `myideas/page.tsx`, `phase-3/forecast/page.tsx`, and `complete/page.tsx`. Next.js build clean with 181/181 routes prerendered.

**2026-09-22 — Creator HumainX Dual-Gate Architecture, Premature Redirect Elimination & Canonical Sync.**
- **Critical HumainX Dual-Gate Architecture (§2):** Fixed regression where profile data completeness allowed skipping Quick Start steps and prematurely unlocking the Creator Dashboard. Decoupled durable profile data completeness (`isQuickStartComplete(profile)`) from browser-local wizard journey completion (`isQuickStartJourneyComplete(userId)`). Dashboard access now strictly enforces `DashboardAllowed = ProfileDataComplete && JourneyCompleted`.
- **Three Wizard Screens Enforced:** Step 1 (Situation), Step 2 (Skills, min 1, valid levels, zero synthetic fallbacks, removed fake `"General Business / Comfortable"` bypass), and Step 3 (How You Build, 4 round-trip distinguishable progress options). Pre-populated profile data cannot skip screens; only explicit `"Start my project"` final CTA on Step 3 completes Quick Start.
- **Frontend Journey State Model:** Introduced `HumainXJourneyState { step1Confirmed, step2Confirmed, step3Confirmed, completed }` scoped per user ID in browser `localStorage`. Formally documented as a `CURRENT FRONTEND-ONLY UX PERSISTENCE LIMITATION`.
- **Debounced Autosave Scope:** 400ms debounced autosave restricted to profile data only; autosave is strictly prohibited from altering journey confirmation milestones.
- **Phase 4 Canonical Alignment & Architecture Freeze:** Documented Phase 4.1–4.7 as LIVE & FROZEN, Stage 4.8 Launch Assets as NEXT APPROVED STAGE (One-Page Launch Website), and Stage 4.9 Construction Readiness as RESERVED. Reconciled retired legacy Phase 4 routes (`/offer-pricing`), controllers (`CreatorPhase4Controller`), and UI across all system architecture docs and diagrams.
- **Test Suite Verification:** HumainX Quick Start dedicated suite: 53/53 tests passing. Full Creator frontend suite: 124/124 tests passing. Routing suite: 31/31 passing. Backend targeted Phase 4/HumainX suite: 213/213 passing. TypeScript: 0 errors. Production build: Exit 0.

**2026-09-22 — Creator Dashboard Canonical Architecture Rebuild & Freeze.**
- **Project Command Center Redesign:** Rebuilt `/dashboard/creator` around a single authoritative summary endpoint (`GET /api/creator/dashboard/summary`), consolidating 10 fragmented initial requests down to 1 primary summary call.
- **Canonical Route Binding:** Confirmed and bound Phase 5 NextAction and Crossroads gate directly to canonical route `/dashboard/creator/crossroads`.
- **Authority Preservation:** Removed all client-side domain recalculations; dashboard state directly reflects `BrandKit`, `CreatorLegalAssessment`, `Phase4CompletionResolver`, `IFounderCapacityResolver`, `PricingPolicyEngine`, and `ProfessionalProfileRecord.QuickStart`.
- **Legacy Artifact Elimination:** Removed hardcoded "SaaS" badge, global "Idea Readiness" score, premature Day-1 "Interested Buyers (0)" KPI, static EBITDA "—" KPI, "Generate Pitch Deck" misnomer, and client-side `advancePhase(5)` bypass.
- **Strict Scope Boundaries:** Confirmed zero cards, routes, or progress items for Phase 4.8 (Launch Assets) or Phase 4.9 (Construction Readiness).

**2026-09-24 — Step 3.3 Financial Forecast: Canonical Architecture, Processing UX, Loading Canon Alignment, Dead Code Cleanup & Final Verification Freeze.**
- **Canonical Flow Reconciliation (§5.3):** Formalized first-generation flow (NO valid forecast $\to$ full Adjust Forecast Assumptions page $\to$ PUT assumptions $\to$ POST generate $\to$ processing state $\to$ Results) and regeneration flow (VALID forecast $\to$ Results directly $\to$ Adjust Assumptions modal $\to$ PUT assumptions $\to$ POST regenerate $\to$ non-destructive processing overlay $\to$ latest valid version replaces on success).
- **Exact Processing UX & Loading Canon Alignment (§5.3):** Standardized exact user-facing titles and descriptions for first generation (`"Generating Your Financial Forecast…"` / `"Building your 36-month projections from the assumptions you confirmed. This may take up to two minutes."`) and regeneration (`"Regenerating Financial Forecast…"` / `"Recalculating projections with your updated assumptions. This may take up to two minutes."`). Reused Phase 3 canonical visual loading presentation (Step 3.1 & 3.2 pattern: `RotateCw animate-spin`, `rounded-full bg-primary/10`, centered `rounded-2xl Card`, `animate-pulse`, `animate-indeterminate` progress bar).
- **Zero-Gap State Bridge (§5.3):** Implemented `useRegenerateForecast.onMutate` optimistic session cache update to `Processing`, bridging mutation dispatch $\to$ HTTP response $\to$ backend polling and eliminating any loading flicker or premature unmount.
- **Non-Destructive Result Preservation (§5.3):** First generation failure preserves saved inputs with retry/edit CTAs; regeneration failure preserves previous valid forecast intact with dismissible banner and retry/edit CTAs. During regeneration, previous valid results remain mounted and visible below the processing card until atomically replaced by the new version.
- **Dead Code & Parallel Schema Elimination (§5.3):** Excised `StartingBudgetModal.tsx`; starting budget natively integrated into `ForecastAssumptionsForm` (single canonical schema). Excised obsolete projection math methods (`ExtendToThirtySixMonths`, `RecomputeBreakEven`) and dead helpers from `ForecastHandler.cs`. Confirmed `FinancialForecastEngine` as the sole deterministic calculation authority.
- **Driver Invariant Rule (§5.3):** Enforced that every active editable backend forecast driver across SaaS, E-commerce, Service, and Marketplace is exposed in the canonical form, with inactive drivers hidden/N-A.
**2026-09-25 — Creator Phase 4.1 Construction Snapshot: Runtime Architecture Fix, Page Header, Optimistic Concurrency & Navigation Delivery.**
- **Runtime Concurrency Fix (§6.1):** Fixed HTTP 400 `"expectedVersion is required for Creator changes."` failure on `POST /api/creator/phase4/construction-snapshot/generate` and `refresh`. Synchronized `expectedVersion` across URL query params and request body with `CreatorJourneyService.WriteIdeaAsync`.
- **Version Tracking & Response Headers (§6.1):** Added `IdeaVersion` to `ConstructionSnapshotResponse` DTO and `ExpectedVersion` to `GenerateSnapshotRequest`. Published `X-Creator-Idea-Version` response header from `CreatorPhase4ConstructionController` and synchronized `j.IdeaVersion = idea.Version` post-write.
- **Client Cache & Concurrency Resolution (§6.1):** Implemented `resolveExpectedVersion(ideaId)` in `src/lib/api-creator-phase4.ts` pulling cached or authoritative `journey.ideaVersion`. Captured response versions on all GET and POST requests.
- **HTTP 409 Conflict Recovery (§6.1):** Implemented non-destructive reload (`loadSnapshot()` + `refetch(ideaId)`) on 409 conflict, surfacing an inline conflict recovery banner with "Reload & Retry" preserving user state.
- **Compact Page-Level Header Added (§6.1):** Added compact page-level header inside the existing content area matching typography canon: Eyebrow `"PHASE 4 · STEP 4.1"` (`text-xs font-semibold tracking-wider text-muted-foreground uppercase`), Title `"Construction Snapshot"` (`text-2xl sm:text-3xl font-bold text-foreground tracking-tight`), and Subtitle `"See what’s ready, what needs attention, and where to go next."` (`text-sm text-muted-foreground max-w-2xl leading-relaxed`). Corrected older statements claiming 4.1 has no page header.
**2026-09-25 — Creator Phase 4.2 Operational Roadmap: Exact Figma 57221-10450 Alignment, Deduplication, Legal Isolation, Concurrency & Final Delivery.**
- **Figma Reference & Layout (§6.2):** 100% verified against approved Figma Node `57221:10450` ("Operational Roadmap · Creator Phase 4.2").
- **Canonical Route:** `/dashboard/creator/phase-4/roadmap`
- **Compact Page-Level Header (§6.2):** Eyebrow `"PHASE 4 · STEP 4.2"`, Title `"Operational Roadmap"`, Subtitle `"Turn your project requirements into a practical plan that fits your availability."`.
- **Three-Column Planning Context:** Your Availability (hours & interactive adjustment modal with 5 presets), Planned Now (task count & known effort hours), Capacity Guardrail & Plan Status (rule-engine pacing limits & live status badge).
- **Start Here (Next Best Action):** Dynamically derived from unblocked tasks with highest priority via dependency DAG; includes direct status quick-actions and smooth auto-expansion.
- **Six Roadmap Groups (Canonical Order):** `Now`, `Next 30 Days`, `Days 30–60`, `Days 60–90`, `Before Launch`, `After Launch`.
- **Dependency Impact vs Status Separation:** Replaced generic blocking badges with distinct `"Blocks N tasks"` (amber) when downstream tasks depend on the item and `"Blocked by N prereqs"` (rose) when unresolved prerequisites remain; effort formatted as `~N hrs` with clean fallback to `Effort: Medium/Small`.
- **Task Deduplication & Stable Canonical Keys:** Capability gaps from snapshot and formation assessment merged under stable canonical keys `skill-gap.{slug}` (e.g. `skill-gap.financial-advisor`); skills already verified in founder's `ReadyItems` (e.g. `skill_full-stack developer`) excluded from duplicate task generation; `legal_service` preserved as distinct chartered statutory filing partner.
- **Legal Assessment Readiness vs Statutory Execution:** Snapshot item labeled `"Legal Assessment & Compliance Framework"`; `WireDependencies` prevents assessment review from satisfying corporate execution/filing prerequisites (`FR-CORP-*`, registration, statuts, JAL, RBE).
- **Concurrency & 409 Recovery:** Mandatory `expectedVersion` and `ideaId` validation on all endpoints, response header publishing, and non-destructive 409 conflict reload banner.
- **Navigation Flow:** 4.1 Construction Snapshot $\to$ 4.2 Operational Roadmap $\to$ 4.3 Needs & Requirements. Note: Stage 4.3 is pre-existing canon, not newly implemented.
- **Verification & Acceptance:**
  - Automated Unit Tests: 33/33 PASS (`CreatorPhase4RoadmapTests.cs`, including deduplication and legal isolation tests).
  - Live Browser & API Verification: 10 persisted tasks across stages verified via Playwright E2E; DOM tree walker confirmed 0 literal "svg" text nodes.
  - User Acceptance: Formally confirmed by user ("The user has confirmed the current result works correctly").

**2026-09-25 — Creator Phase 4.3 Needs & Requirements: Exact Figma 57221-11163 Alignment, Analytical Breakdown, Domain Semantics, Keep-Current Lifecycle & Concurrency Delivery.**
- **Figma Reference & Layout (§6.3):** 100% verified against approved Figma design (File key `yLDPLB9hIAIqfYY9uHuJom`, Frame `57221:11163`, Requirements list `57221:11197`, Expanded requirement `57221:11282`). 1120px max content width, 24px section gaps, 12px requirement card gaps, 32px category icon containers with 8px corners, 12px expanded inset panels, responsive 1440px/1920px desktop and 375px mobile viewports with complete dark/light theme token compliance (`globals.css`).
- **Canonical Route:** `/dashboard/creator/phase-4/needs`
- **Compact Page-Level Header (§6.3):** Eyebrow `"PHASE 4 · STEP 4.3"`, Title `"Needs & Requirements"`, Subtitle `"Review what your project needs, what you already have, and what remains to be covered."`.
- **Horizontal Summary Card:** Single card layout reporting total count, emerald `Satisfied` badge, muted `Identified` badge, authoritative copy (*"Confirming a need records your decision. It does not mean the need has been met."*), subtle vertical divider, and dynamic `Awaiting your review` status badge.
- **Update Available Notice & Modal:** Warm-tinted alert banner with `"Review changes"` modal and `"Keep current version"` action wired to `POST /api/creator/phase4/needs/keep-current` to dismiss staleness across sessions. Re-generation and refresh strictly preserve founder decisions and notes by stable requirement keys.
- **Full-Width Accordion Cards with Inline Actions:** Inline `"Confirm need"` and `"Defer for now"` actions on awaiting-review items; fulfillment badges (`Identified` / `Satisfied`) and decision badges (`Confirmed`, `Deferred`, `Awaiting your review`).
- **5-Section Analytical Breakdown:** Two-column desktop grid for `WHAT IS NEEDED`, `WHY THIS APPLIES`, `WHAT YOU ALREADY HAVE`, `WHAT IS STILL MISSING`, and full-width `WHAT WOULD SATISFY THIS NEED`. Derived from real project data (Snapshot, Roadmap, Legal Assessment, Forecast, Business Model, HumainX profile).
- **Connected Work & Provenance:** Connected operational roadmap tasks with deep links; provenance chips (`Construction Snapshot`, `Financial Forecast`, etc.) with functional `View source ↗` navigation.
- **Founder Information Panel:** Allows recording existing assets, credentials, or resources (`founderInformation`) via `PUT /api/creator/phase4/needs/{needKey}/state` without auto-satisfying the requirement.
- **Domain Semantics & Decision Independence:** Strict decoupling between decision (`Confirmed`/`Deferred`) and fulfillment (`Satisfied`). Confirmed decisions and founder notes are preserved across refreshes by stable requirement keys.
- **Concurrency & Concurrency Recovery:** Scoped to `CreatorIdea` via `WriteIdeaAsync`, enforcing `expectedVersion` matching, `X-Creator-Idea-Version` response headers, and non-destructive HTTP 409 conflict recovery.
- **Navigation Flow:** Step 4.2 Operational Roadmap $\to$ Step 4.3 Needs & Requirements $\to$ Step 4.4 Skills & Training Plan.
- **Zero Static/Mock Data Guarantee:** All rendered requirements, counts, categories, and analytical breakdowns are 100% dynamically derived from active MongoDB database records with zero hardcoded sample cards or fake fallback lists.
- **Verification Evidence:**
  - Automated Unit Tests: 16/16 PASS (`CreatorPhase4NeedsTests.cs`); Frontend tests: 11/11 PASS (`phase4-needs-analysis.test.tsx`).
  - Browser E2E & Visual Verification: Playwright script `verify_browser_needs.mjs` executed cleanly against live environment; generated screenshots for 1440px initial, 1440px expanded, 1920px desktop, 375px mobile, and review modal.
  - TypeScript & Solution Build: `npx tsc --noEmit` 0 errors; `dotnet build backend/WebApp.csproj` 0 errors.

**2026-09-25 — Creator Phase 4.4 Skills & Training Plan: Exact Figma 57221-11470 Alignment, Dynamic Detail Panels, Mandatory Verification Lock, Keep-Current Lifecycle & Concurrency Delivery.**
- **Figma Reference & Layout (§6.4):** 100% verified against approved Figma design (File key `yLDPLB9hIAIqfYY9uHuJom`, Frame `57221:11470` "Skills & Training · Step 4.4 Full Plan"). 1120px max content width, 24px section gaps, 12px card gaps, responsive across 1440px desktop, 1920px widescreen, and 375px mobile viewports with strict semantic token compliance (`globals.css`).
- **Canonical Route:** `/dashboard/creator/phase-4/skills`
- **Compact Page-Level Header (§6.4):** Eyebrow `"PHASE 4 · STEP 4.4"`, Title `"Skills & Training Plan"`, Subtitle `"Map capabilities to learn, delegate, or verify based on your background, project scope, and weekly time."`.
- **Eight Canonical Figma UI Components:**
  1. *Component 1: Upstream Update Notice:* Warm-tinted alert banner with `"Review changes"` modal and `"Keep my choices"` action wired to `POST /api/creator/phase4/skills-plan/keep-current` to synchronize source versions without losing founder decisions.
  2. *Component 2: Compact Skills Summary Header:* Single card displaying `{total} project skills`, `{covered} covered` (emerald badge), `{attention} need attention` (amber badge), and project scope metadata (`PROJECT SCOPE: {projectName}`, `REGION: France`).
  3. *Component 3: Existing Strengths ("You can already handle"):* Lists capabilities covered by founder's background or prior phase milestones with `"Update my experience ↗"` link to profile and `"Why this matches"` modal explaining coverage evidence.
  4. *Component 4: Resolution Approach Legend:* 3 cards explaining the resolution strategies in plain language (Learn: Build skills yourself; Delegate: Get help from someone with right skills; Verify: Check whether experience covers work).
  5. *Components 5, 6, 7: Need Attention Cards & Dynamic Inset Panels:* Unresolved capability cards with 3-button mode selector (`Learn`, `Delegate`, `Verify`), Launch-Blocking badge, Statutory lock icon, and rich dynamic inset panels:
     - *Delegation Detail Panel (Component 5):* 6 structured attributes grid + Delegation Brief Modal (`View brief`, `Edit brief`, `Add existing support`).
     - *Learning Detail Panel (Component 6):* `WHAT YOU'LL BE ABLE TO DO`, `WHAT YOU'LL CREATE`, 4 practical learning steps, Training options box, and Workload Impact Preview calculating weekly availability vs already planned and proposed learning hours with buffer calculation and link to roadmap changes.
     - *Verification Detail Panel (Component 7):* 3 analytical columns (`What needs checking`, `What you can share`, `What is still unclear`) with `"See what to share"` Evidence Guide modal and `"Choose Verify"` button.
  6. *Component 8: Quiet Journey Footer Navigation:* Left `"← Back to Needs & Requirements"` linking to Step 4.3 and Right primary CTA `"Continue to Aids & Support →"` linking to Step 4.5.
- **Resolution Engine Rules & Invariants:**
  - *Pass-through Coverage:* Phase 4.3 Covered Requirements pass through as `Covered` and are separated from attention cards.
  - *Mandatory Statutory Verification:* Regulated requirements (e.g. Legal Capital Deposit, Share Capital, Trademark filing) enforce `VERIFY`. The policy rejects founder overrides to Learn or Delegate with HTTP 403 Forbidden.
  - *Founder Decision Preservation:* Re-generation or refresh preserves founder choices and custom notes across re-derivation cycles by stable resolution key (`Key`).
- **Concurrency & Concurrency Recovery:**
  - Scoped to `CreatorIdea.Phase4Data.SkillsPlan` via `SetPhase4SkillsPlanAsync` with `WriteIdeaAsync`.
  - Requires `expectedVersion`, validates concurrency, passes `X-Creator-Idea-Version` response headers, and gracefully handles HTTP 409 Conflict with non-destructive reload.
- **Verification Evidence:**
  - Automated Unit Tests: 14/14 PASS (`CreatorPhase4SkillsTests.cs`); Frontend tests: 11/11 PASS (`phase4-skills-plan.test.tsx`).
  - Full Creator Vitest Suite: 150/150 PASS across 12 test files.
  - Live Browser E2E: Playwright test verified 1440px desktop, 1920px widescreen, 375px mobile, Delegation Brief modal, and Evidence Guide modal with 0 DOM errors and 0 layout overflows.

**2026-09-25 — Creator Phase 4.5 Aids, Grants & Public Support: Exact Figma 57221-11932 Alignment, Analytical Breakdown, Location Persistence, Audit Trace & Concurrency Delivery.**
- **Figma Reference & Layout (§6.5):** 100% verified against approved Figma design (File key `yLDPLB9hIAIqfYY9uHuJom`, Frame `57221:11932` "Aids, Grants & Support · Step 4.5 Content"). 1120px max content width (`max-w-[1120px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6`), responsive across 1440px desktop, 1920px widescreen, and 375px mobile viewports with strict semantic token compliance (`globals.css`).
- **Canonical Route:** `/dashboard/creator/phase-4/support`
- **Compact Page-Level Header (§6.5):** Eyebrow `"PHASE 4 · STEP 4.5"`, Title `"Aids, Grants & Public Support"`, Subtitle `"Explore funding schemes, training support, and institutional backing for your venture."`.
- **Five Canonical Figma UI Components:**
  1. *Component 1: Summary Card ("{count} options to explore"):* Reports total options count (JetBrains Mono number + bold Inter heading), dynamic founder profile chips (Country `France` • Situation `{currentSituation}` • Formation phase `Project in preparation`), profile edit deep link (`Update my details ↗`), and quiet conditions disclaimer: *"Each programme has its own conditions and application process. Saving an option does not submit an application."*.
  2. *Component 2: Location Card ("Where will you start your business?"):* Subtitle *"This helps us check local support."*, MapPin icon input (`City or postcode (e.g. Lyon, 69002)`), and `"Save location"` button. Dispatches `onAnswerFact('project_location', location)` to persist location fact into `RecordedEligibilityFacts` and automatically trigger re-evaluation without modifying backend schemas.
  3. *Metric Strip (Evaluated / Eligible / Potential / Missing / Ready / Tracking):* Satisfies contract with quantitative counts for catalog schemes, authoritative matches, pending minor facts, requires input, MBC docs ready, and in-preparation founder tracking.
  4. *Component 4: Opportunity Cards List & Rich Inset Panels:*
     - Pill badges: Category badge (`Advice & mentoring`, `Social Contribution Exemption`, `Grant`, `Allowance`, `InnovationSupport`, `Financing & Loan`, `Training support`, `EuropeanFunding`) + Status badge (`● A few details to check`, `● May fit your project`, `● Eligible to Apply`, `● Eligible (Statutory)`, `● Awarded`).
     - Card Headline, Value Subtitle, Description, and Official source provenance line (`Official details: {programmeOwner} via {catalogueSource}`).
     - Collapsed State Actions: `"Save this option"` (with toggleable bookmark icon) + `"View details ⌄"` chevron action.
     - Expanded Inset Panel (Figma 57221:11932):
       - 2-Column Analytical Breakdown: `WHAT YOU COULD GET`, `WHY THIS MAY FIT`, `WHAT WE ALREADY KNOW`, `WHEN TO APPLY`, `WHAT TO CHECK` (5 bullet points with subtle dots), `WHAT YOU MAY NEED`, `OFFICIAL SOURCE` (`Official portal verified ↗` with deep link).
       - Blue Callout Box (`BEFORE YOU APPLY`): Info icon + *"When an official source is verified, you can prepare required documents and propose preparation tasks to your Operational Roadmap."*.
       - Action Buttons Bar: `Check my details`, `Audit Details` (opens Audit Provenance modal), `Save this option`, `Track Application`, and primary `Open official website ↗`.
  5. *Component 5: Quiet Journey Footer Navigation:* Left `"← Back to Skills & Training"` linking to Step 4.4, centered reassurance text *"You can return to your saved support options later."*, and right primary CTA `"Continue to Pricing & Revenue →"` linking to Step 4.6.
  6. *Phase 4.6 Milestone Banner:* Operational readiness banner (`"PHASE 4.6 READY · NEXT OPERATIONAL MILESTONE"`, `"Pricing & Revenue Model Engine"`, `"Build My Pricing Strategy →"`).
- **Audit Details Modal:** Surfaces full provenance trace (`Programme Owner`, `Managing Authority`, `Catalogue Source`, `Selection Dimension`), Conditions Met (with green checkmarks), and Application Checklist & MBC Artifact Reuse ("Reuses: Phase 3 Executive Business Plan", "Reuses: Phase 3 Financial Forecast").
- **Zero Static/Mock Data Guarantee:** 100% of rendered opportunities, amounts, conditions, categories, and breakdown copy are dynamically derived from active MongoDB database records and backend rule evaluation.
- **Verification Evidence:**
  - Automated Unit Tests: 8/8 PASS (`phase4-support-plan.test.tsx`).
  - Full Creator Vitest Suite: 150/150 PASS across all 12 test files.
  - Live Browser E2E: Playwright test verified 1440px desktop, 1920px widescreen, 375px mobile, and Audit Details modal with 0 DOM errors and 0 layout overflows.
  - TypeScript Compilation: `npx tsc --noEmit` 0 errors (Exit 0).

---

*End of Creator canon. Update this doc first, then do not write the code — never the reverse.*



