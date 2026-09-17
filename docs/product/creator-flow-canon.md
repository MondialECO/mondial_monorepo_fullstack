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
Capabilities are credit-metered against server-authoritative balance and capability costs (`GET /api/ai/credits`). Current standard starter grant is **200 credits** on onboarding or first AI call (`Ai:StarterCredits = 200`). Current costs: `IdeaClarifier`: **20**, `MarketStudy`: **20**, `BusinessModel`: **18**, `BusinessPlan`: **33**, `Forecast`: **32** (provisional), `IdeaGenerator`: **0**, `Probe`: **0**, `DirectionGeneration`: **7**, `LogoParameterSelection`: **4**, `LogoConceptRegenerate`: **0** (free local SVG redraw), `ColorGeneration`: **2**, `TypographyGeneration`: **2**. Exhaustion triggers HTTP 402; failed generations auto-refund under Option A without deterministic fallback substitution.

Output token ceilings are dynamically configured via `Ai:OutputTokenLimits` in `appsettings.json` (`IdeaGenerator: 3500`, `IdeaClarifier: 3500`, `MarketStudy: 7500`, `BusinessModel: 8500`, `BusinessPlan: 7500`, `Forecast: 8000`, `Probe: 500`, `DirectionGeneration: 4500`, `LogoParameterSelection: 3000`, `ColorGeneration: 4500`, `TypographyGeneration: 2000`) with safe fallback constants in handlers.

---

## 2. Flow overview (P1 → P6)

- **P1** — KYC + role select
- **P2** — Smart Gate: **both entry cards ship (LIVE)**. Path B (already-have-idea → clarifier) and Path A (Discovery → concept cards → confirm) are both reachable. Discovery skips the clarifier by seeding a Completed clarifier session at finalize, so it satisfies the Phase-3 prerequisite. Plus project branding + hire-SP-designer.
- **P3** — AI Masterplan: Business Plan + Financial Forecast + Legal Checklist + Formation Generator (4 modules) → readiness score → completion gate (gates on plan + forecast + formation; legal is guidance, §5.3).
- **P4** — Pricing + GTM / landing page.
- **P5** — Cross-Roads: Path A Marketplace (Active offers: Full Buyout OR Co-Founder / Equity; embedded in `CreatorIdeas.Phase5Data.PathA.MarketplaceListing` projected via `MarketplaceProjectDto`) OR Path B The Big Leap (Private venture spinout → 30-day decision timer → Level Up; NOT a marketplace offer). No formation wizard. Company doc verification deferred to Entrepreneur P2.
- **P6** — Level Up: badge + confetti + atomic Creator→Entrepreneur switch + Smart Matchmaking unlocks (first point matchmaking is available at all).

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

## 4. Phase 2 — Project Identity (Canonical Linear Flow)

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

The Brand Visual Identity Studio provides a calm, generative studio workflow across 7 user-facing modal steps followed by a persistent Brand Kit Hub page. Persisted in the dedicated `BrandKits` collection (`BrandKit`) bound 1:1 to each `CreatorIdea` via `BusinessIdeaId` (unique index on `IdeaId`). Fully compiled and verified clean in full-solution backend (.NET 8) and production frontend (Next.js 16/Turbopack) builds. Responsive across 1440px to 1920px viewports with Inter headings, DM Sans body copy, and JetBrains Mono numerals/telemetry.

#### 1. Studio Frontend Architecture
- **Studio Shell (`/dashboard/creator/phase-2/brand-studio`):**
  - Replaces legacy prototypes; the legacy `/logo-tool` route remains in codebase for backward compatibility.
  - Consists of one full-bleed interactive canvas and a top 6-segment progress bar (`BrandStudioProgressBar`).
  - No AI agent rail, no prompt box, and no secondary floating toolbar; all interactions take place in focused modal overlays over the live canvas.
  - **Accumulated Result Cards:** As steps are completed, the canvas accumulates and displays rich summary cards (`StrategyResultCard`, `DirectionResultCard`, `LogoTypeResultCard`, `LogoResultCard`, `ColorsResultCard`, `TypographyResultCard`), which persist across the session.
  - **Completion Transition:** On Step 6 Typography confirmation when `kit.status` flips to `"complete"`, the shell automatically navigates the creator to the full Brand Kit Hub at `/dashboard/creator/phase-2/brand-kit?ideaId=...`.
- **First-Time Creator Entry & Transparent Auto-Provisioning:**
  - When a Creator clicks "Open Brand Studio" on `/phase-2/branding`, the router navigates to `/dashboard/creator/phase-2/brand-studio`.
  - `BrandStudioShell` mounts and invokes `brandKitApi.openStudio(ideaId)`.
  - On the backend, `POST /api/creator/journey/phase2/brand-kit/open-studio` checks for an existing `BrandKit`. If none exists (first-time creator), it transparently auto-provisions a fresh draft kit via the shared `GetOrCreateBrandKitAsync` helper (deriving initial `BrandStrategy` from `idea.Project` and seeding default 5-role Colour and 4-role Typography defaults), returning HTTP 200 with the newly created kit.
  - Studio immediately initializes and opens Step 1 (`StrategyReviewModal`) without requiring any out-of-band pre-creation or encountering 404 errors.
  - **Defense-in-Depth Null Guards:** `BrandStudioShell.tsx` `loadStudioSession()` applies optional chaining on every `currentKit` property access (`currentKit?.strategy?.confirmedAt`, `currentKit?.direction?.selectedAt`, `currentKit?.logo?.logoType`, `currentKit?.logo?.approvedAt`, `currentKit?.colors?.confirmedAt`, `currentKit?.logo?.selectedConceptKey`) and includes a secondary `brandKitApi.createBrandKit(ideaId)` fallback so null or missing kit states never produce unhandled runtime property errors.
- **Step 1 Strategy Review & Per-Field Edit Tracking:**
  - `StrategyReviewModal.tsx` tracks 4 core `BrandProvenancedText` fields: `Concept`, `TargetAudience`, `Industry`, and `Positioning`.
  - On backend `PatchStrategy`, modifying any field's `.Value` sets `.EditedAt = DateTime.UtcNow` and `.Provenance = "user_refined"`.
  - In frontend UI, fields with non-null `editedAt` display a real relative timestamp `"EDITED {time} AGO"` (via `date-fns` `formatDistanceToNowStrict`), while unedited fields render `"From your idea"` with no timestamp.
  - `TonePosition` (Formal $\leftrightarrow$ Casual) and `FirstAppearance` (e.g. `website`, `app_icon`, `invoice`, `social`) are fully wired and consumed downstream in `LogoTypeChooserModal` (fit score reasoning), `DirectionGenerationService` & `TypographyGenerationService` (prompt tuning), and `BrandKitHubView` (summary facts).
- **Unified Modal Step Transition Architecture (`handleStepTransition`):**
  - **Elimination of Conflicting Modal Wiring:** Replaces earlier fragmented patterns (direct state mutation vs out-of-band step reloading vs custom router pushes) with exactly **one unified transition function** in `BrandStudioShell.tsx`:
    ```ts
    const handleStepTransition = useCallback(
      (nextModalKey: StudioModalKey | null, updatedKit?: BrandKit) => { ... }
    );
    ```
  - **Single Source of State Truth:** Whenever any modal completes a step (PATCH, generate, or confirm), it passes the fresh `updatedKit` returned from the API directly into `handleStepTransition(nextStepKey, updatedKit)`. This immediately updates `kit` state, refreshes canvas cards, and ensures the optimistic concurrency version (`kit.version`) is always accurate for the next step.
  - **Standardized Modal Transition Contract (7 Modals Across 6 Progress Segments):**
    1. `StrategyReviewModal` (Step 1: "Strategy"): `handleStrategyConfirm` $\to$ `handleStepTransition("direction", updatedKit)`
    2. `DirectionBoardModal` (Step 2: "Direction"): `onSuccess` $\to$ `handleStepTransition("logo_type", updatedKit)`
    3. `LogoTypeChooserModal` (Step 3: "Logo Type"): `onSuccess` $\to$ `handleStepTransition("logo_creation", updatedKit)`
    4. `LogoCreationModal` (Step 4a within "Logo" segment): `onConfirm` $\to$ `handleStepTransition("variations", updatedKit)`
    5. `VariationSetModal` (Step 4b within "Logo" segment): `onConfirm` $\to$ `handleStepTransition("colors", updatedKit)`, `onBack` $\to$ `handleStepTransition("logo_creation")`
    6. `ColorSystemModal` (Step 5: "Colour"): `onSuccess` $\to$ `handleStepTransition("typography", updatedKit)`
    7. `TypographySystemModal` (Step 6: "Typography"): `onSuccess` $\to$ `handleStepTransition(null, updatedKit)`
  - **Automatic Hub Completion Hand-Off:** When `nextModalKey === null` and `updatedKit.status === "complete"`, `handleStepTransition` intercepts the transition and automatically pushes the browser to the live Brand Kit Hub (`/dashboard/creator/phase-2/brand-kit?ideaId=...`).
  - **Standardized Close/Dismiss:** All modals bind `onClose={() => handleStepTransition(null)}`, safely dismissing the overlay to reveal the accumulated canvas cards without losing session state.
- **Top 6-Segment Progress Bar vs 7 User-Facing Modals (Canonical Step Eyebrow Scheme):**
  1. `strategy` (Step 1 segment: "Strategy", modal: `StrategyReviewModal` $\to$ `STEP 1 OF 6 • BRAND STRATEGY`)
  2. `direction` (Step 2 segment: "Direction", modal: `DirectionBoardModal` $\to$ `STEP 2 OF 6 • Visual Direction Board`)
  3. `logo_type` (Step 3 segment: "Logo Type", modal: `LogoTypeChooserModal` $\to$ `STEP 3 OF 6 • Architectural Mark Form`)
  4. `logo` (Step 4 segment: "Logo", encompassing both Step 4a and Step 4b):
     - `LogoCreationModal` (Step 4a) $\to$ `STEP 4 OF 6 • Logo Creation`
     - `VariationSetModal` (Step 4b) $\to$ `STEP 4 OF 6 · VARIATIONS • LOGO SET`
  5. `colors` (Step 5 segment: "Colour", modal: `ColorSystemModal` $\to$ `STEP 5 OF 6 · COLOUR SYSTEM`)
  6. `typography` (Step 6 segment: "Typography", modal: `TypographySystemModal` $\to$ `STEP 6 OF 6 • TYPOGRAPHY`)
- **Interface Typography:** Standardized on **Inter** and **DM Sans** for all UI body copy, headings, and labels across all Studio surfaces (Syne Bold was an earlier prototype mock and is NOT used). **JetBrains Mono** is used for all numerals, tokens, and telemetry badges.
- **Shared Components:**
  - `RegenerateCapBadge`: Reused across Direction, Logo Creation, Colour, and Typography to display remaining attempts (`N/3 LEFT` in neutral/muted, transitions to amber `0/3 LEFT` when cap is exhausted).

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
       - *Card Footer (16px padding):* `CONCEPT 01` .. `CONCEPT 06` mono tag, live `descriptorLine` from backend, `SELECTED` primary badge, and single-concept redraw icon button (`Redraw just this one`, 2 credits, 3-cap).
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
- **Download Brand Kit (.zip) Packaging:**
  - Client-side ZIP generated via `JSZip` containing:
    1. `/logos/`: 7 canonical SVG assets (`{brand}-primary.svg`, `{brand}-horizontal.svg`, `{brand}-stacked.svg`, `{brand}-icon_only.svg`, `{brand}-black.svg`, `{brand}-white.svg`, `{brand}-transparent.svg`). `BrandKitHubView.tsx` fetches URL-based `/brand-assets/logos/...` SVGs using `API_ORIGIN` (as well as inline SVGs), ensuring all 7 variation files are extracted with non-zero byte size.
    2. `/tokens/colors.json`: 5-role color tokens with hex, rgb, and WCAG contrast ratios.
    3. `/tokens/typography.json`: 4-role typography tokens with family, weight, size, line-height, and specimen text.
    4. `/tokens/brand-tokens.css`: Ready-to-use CSS Custom Properties (`:root { --brand-primary: ... }`).
    5. `/README.md`: Brand identity summary document.

- **Brand Kit Asset Delivery & Origin Resolution:**
  - **Single Shared Helper (`resolveMediaUrl`):** All components displaying brand assets (Concept Tiles, Variation Tiles, MicroScaleViewer, MultiScaleIconViewer, Invoice Mock, Compare Overlay, Hub Logo Grid, and Phase 2 Complete identity card) consume `resolveMediaUrl(uri?: string | null): string` from `src/lib/brand-kit-media.ts`.
  - **Dynamic URL Normalization:** Converts relative paths (`/brand-assets/logos/...`) served by ASP.NET backend to absolute origin (`http://localhost:5093/brand-assets/...` in local development via `NEXT_PUBLIC_API_ORIGIN`), while passing data URIs and existing `http://`/`https://` absolute URLs through untouched.
  - **Next.js Reverse Proxy Rewrite (Defense-in-Depth):** `next.config.ts` includes an `async rewrites()` rule proxying `/brand-assets/:path*` directly to `http://localhost:5093/brand-assets/:path*`, ensuring direct HTTP asset fetches by browser or client-side libraries never 404 across port boundaries.
  - **Clean Standard Image Tags:** `BrandKitHubView.tsx` and `Phase2CompletePage.tsx` use standard `<img src={resolveMediaUrl(...)} />` elements instead of insecure or brittle `dangerouslySetInnerHTML` attempts on relative asset file paths.
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

## 5. Phase 3 — Business Architecture & Masterplan (Canonical 7-Step Sequence)

Phase 3 establishes the comprehensive business, market, financial, and legal foundation for the venture across **seven sequential steps**:

```text
/phase-3
→ Step 3.1: /phase-3/market-study
→ Step 3.2: /phase-3/business-model
→ Step 3.3: /phase-3/business-plan
→ Step 3.4: /phase-3/forecast-inputs → /phase-3/forecast
→ Step 3.5: /phase-3/compliance
→ Step 3.6: /phase-3/formation
→ Step 3.7: /phase-3/complete
→ Phase 4
```

**Session & Prerequisite Chain (Enforced):**
`clarifierSessionId` (P2) $\to$ `marketStudySessionId` (3.1) $\to$ `businessModelSessionId` (3.2) $\to$ `businessPlanSessionId` (3.3) $\to$ `forecastSessionId` (3.4).

### 5.1 Step 3.1 — Market Study & Competitive Intelligence (LIVE)
- **Route:** `/dashboard/creator/phase-3/market-study`
- **Backing Entity & Controller:** `MarketStudySession` stored in `MarketStudySessions` collection via `MarketStudyController` (`/api/ai/market-study`).
- **Inputs Consumed:** `ClarifierSessionId` (from Phase 2, required) and `BusinessIdeaId` (optional/context).
- **Backend Architecture & Benchmark Reuse:** `MarketStudyHandler` reuses `IMarketBenchmarkResolver` (which until now was Phase-4-only) to query sector-specific benchmarks, tailwinds, and median multiples, injecting rich quantitative baselines into the generative prompt.
- **Output Schema (`MarketStudyOutput`, Schema Version 1):**
  1. `marketSizing`: `tam` (`value`, `currency`, `label`, `derivation`, `sourceAttribution`), `sam` (`value`, `currency`, `label`, `percentageOfTam`, `derivation`, `sourceAttribution`), `som` (`value`, `currency`, `label`, `percentageOfSam`, `derivation`, `sourceAttribution`), and `methodology` (freeform descriptive string explaining bottom-up calculation and triangulation arithmetic; parser defaults to `"triangulated"` if empty).
  2. `competitorLandscape`: `summary`, `directCompetitors` array (`name`, `estimatedMarketShare`, `pricingModel`, `strengths`, `weaknesses`, `exploitableGap`, `sourceAttribution`), and `indirectCompetitors` array (`name`, `substituteApproach`, `threatLevel`: `low` | `medium` | `high`).
  3. `demandSignals`: Array of signals with `signal`, `evidence`, `sourceAttribution`, and `relevanceScore` (integer 1–10).
  4. `sizingRisks`: Array of sensitivity risks with `risk`, `impactOnSom` (`low` | `medium` | `high`), and `mitigation`.
  5. `marketGapValidation`: `primaryGap`, `validationRationale`, and `confidenceLevel` (`high` | `moderate` | `speculative`).
- **Parser Normalisation & Logging:** Constrained enum fields (`threatLevel`, `impactOnSom`, `confidenceLevel`) are normalized at the parser layer before persisting to MongoDB using safe, conservative fallbacks that never overstate certainty (`threatLevel`/`impactOnSom` default to `medium`, `confidenceLevel` defaults to `speculative`). Non-canonical raw values that undergo coercion are recorded as backend warnings via `ILogger.LogWarning`.
- **Credit Cost:** **20 credits** (`AiJobType.MarketStudy`).
- **UI Presentation:** Proportional horizontal funnel bars with step reduction percentage bridges, bottom-up methodology strip, competitor benchmarking matrix, demand signals, and sensitivity risk cards. Responsive across 1440px–1920px with Inter headings, DM Sans body copy, JetBrains Mono numerals/metrics, and full dark theme support. Out-of-contract strings reaching the frontend are styled with destructive visual tokens rather than silently absorbed.

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
- **UI Presentation:** Canonical single Osterwalder grid with hairline dividers (5 top columns: Key Partners flanking left, Key Activities over Key Resources, Value Propositions centered with prominent focal emphasis and zero background tint, Customer Relationships over Channels, Customer Segments flanking right; 2 bottom columns: Cost Structure 50% and Revenue Streams 50%), modelled unit economics telemetry strip, and pricing tiers. Responsive across 1440px–1920px with Inter headings, DM Sans body copy, JetBrains Mono numerals/metrics, and full dark theme support. Out-of-contract strings reaching the frontend are styled with destructive visual tokens rather than silently absorbed.

### 5.3 Step 3.3 — Business Plan (C-3, LIVE)
- **Route:** `/dashboard/creator/phase-3/business-plan`
- **Backing Entity & Controller:** `BusinessPlanSession` stored in `BusinessPlanSessions` collection via `BusinessPlanController` (`/api/ai/business-plan`).
- **Inputs Consumed:** `ClarifierSessionId` + `BusinessIdeaId`.
- **Prerequisite Gate & Branching Rule:**
  - Server-side enforced in `BusinessPlanController.Start`.
  - **Fresh Creators** without an existing completed Business Plan session (`idea.Phase3Data.BusinessPlanSessionId == null`): **MUST** complete Step 3.1 (Market Study) and Step 3.2 (Business Model) first (`!hasMarketStudy || !hasBusinessModel` returns HTTP 422 Unprocessable Entity).
  - **Legacy Creators** who already have a completed Business Plan session in their stored journey (`idea.Phase3Data.BusinessPlanSessionId != null`): keep their position, are never pushed backwards, and are permitted to regenerate or continue without blocker.
  - **Branching Rule:** The prerequisite gate branches strictly on **stored session completion in MongoDB (`idea.Phase3Data`)**, never on which parameters the client happens to send in the HTTP request.
- **Continuous Document Architecture:** Rendered as a single continuous scrollable executive document with a sticky 11-section sidebar index.
- **Universal Inline Markdown Editing:** All 5 owned sections (`executive`, `target-market`, `business-model`, `competitive`, `gtm`) support instant inline editing with real-time word counting, diff tracking, and persistent session updates via `PATCH /api/ai/business-plan/{id}/section/{sectionId}`.
- **Attribution & Transparency:**
  - Sections 02 (Problem & Solution), 07 (Financial Projections), and 08 (Team Needs) carry clear source provenance attribution and direct navigation links to their upstream/cross-module sources.
  - Section 09 (Funding Requirements) transparently explains that seed funding ask is configured in Phase 5.
  - Sections 10 (Operations & Milestones) and 11 (Risk Register & Mitigations) explain that they are synthesized as part of the full AI plan and update when the plan is regenerated.
- **Credit Cost:** **33 credits** (`AiJobType.BusinessPlan`).

| # | Section | Source | Rewritable | Badge |
|---|---------|--------|------------|-------|
| 1 | Executive Summary | C-3 `executiveSummary` | ✅ | — |
| 2 | Problem & Solution | Clarifier (Phase 2 project) | ❌ (Source: Clarifier) | `auto_built_phase2` |
| 3 | Target Market | Clarifier + C-3 `marketAnalysis` | ✅ | `auto_built_phase2` |
| 4 | Business Model | C-3 `revenueModel` | ✅ | — |
| 5 | Competitive Landscape | C-3 `competitorAnalysis` | ✅ | `ai_researched` |
| 6 | Go-to-Market | C-3 `goToMarket` | ✅ | `auto_built_43` |
| 7 | Financial Projections | Live C-4 forecast | ❌ (Source: Forecast) | `auto_filled_31` |
| 8 | Team Needs | Live `formation.youNeed` | ❌ (Source: Formation) | — |
| 9 | Funding Requirements | Phase 5 Seed Funding | ❌ (Phase 5) | `used_in_phase5` |
| 10 | Operations & Milestones | C-3 `operationsPlan` | ❌ (Full Plan AI) | — |
| 11 | Risk Register | C-3 `risks[]` | ❌ (Full Plan AI) | — |

### 5.4 Step 3.4 — Financial Forecast (C-4, LIVE)
- **Routes:** Unified workspace at `/dashboard/creator/phase-3/forecast` (with seamless redirect from legacy `/phase-3/forecast-inputs`).
- **Backing Entity & Controller:** `ForecastSession` stored in `ForecastSessions` collection via `ForecastController` (`/api/ai/forecast`).
- **Unified Interactive Workspace:** Merges input parameters (`ARPU`, `OPEX`, `Growth %`, `TAM`, `Churn %`) and live projection results into a single screen. Includes an interactive Live Assumptions drawer for instant parameter modifications and re-runs.
- **Model & Derivation:** 36-month P&L (months 1–12 AI-generated by Gemini; months 13–36 deterministically projected via `ForecastHandler.ExtendToThirtySixMonths`).
- **Visualizations & Telemetry:** Top KPI cards (Year 3 ARR, Break-Even Month, 3-Yr Net Cash Flow), multi-series Recharts visualizations (Revenue vs Costs), full 36-month tabbed financial tables, unit economics telemetry, and risk matrix.
- **Credit Cost:** **32 credits** (`AiJobType.Forecast`).
- **Deliberately Dropped Item:** *Forecast sensitivity matrix* (dynamic scenario shift across arbitrary churn/growth combinations) was deliberately omitted because dynamic multi-variable scenario modeling is not supported in the core backend dataset.

### 5.5 Step 3.5 — Legal & Compliance Checklist (LIVE)
- **Route:** `/dashboard/creator/phase-3/compliance`
- **Backing Entity & Controller:** Backed by `CreatorPhase3Controller` (`/api/creator/legal-checklist`).
- **4 Explicit Domain Groups:**
  1. *Corporate Governance & Structure* (`company-type`, `bank-account`, `shareholder-agreement`, `esop-pool`)
  2. *Intellectual Property & Brand Protection* (`ip-protection`, `trademark`)
  3. *Data Privacy & Consumer Protection* (`gdpr`, `tos-privacy`, `rgpd-article30`, `dpa`)
  4. *Industry Regulatory & Risk Mitigation* (`pci-dss`, `fin-reg`, `employment-contracts`, `liability-insurance`)
- **Behavior:** Sector-specific checklist with detailed plain-language descriptions, expandable "Why this is essential" context boxes, and deep links to `/marketplace?category=legal` / `compliance`. Advisory guidance that never blocks Phase 3 completion.

### 5.6 Step 3.6 — Company Formation & Team (LIVE)
- **Route:** `/dashboard/creator/phase-3/formation`
- **Backing Entity & Controller:** Backed by `CreatorPhase3Controller` (`/api/creator/ai/formation-generator/start`, `PATCH /api/creator/formation/select-type`, `PATCH /api/creator/formation/skills`).
- **Discrete Recommendation Reasoning (Backend Addition):** Exposes `RecommendationFactors` (`Category`, `Signal`, `Implication`) breaking down the exact signals driving the recommendation (Sector/FinTech, TAM & Growth from forecast, Funding model, Founding team structure) rather than an opaque prose block.
- **Override Tracking (Backend Addition):** Persists `IsOverride` (`bool`) on `CreatorFormationGenerator` whenever a founder chooses an alternative entity structure (e.g. SARL or SAS-U) over the automated recommendation (SAS), rendering explicit visual badges and roadmap notices.
- **Skills Declaration & Protected Clobber Guard:** Clear separation between *Founder-Declared Capabilities (Self-Reported)* and *System-Derived Competence Gaps (Inferred Baseline)* with deep links to `/marketplace?category={specialty}`. Atomic clobber guard prevents rule-engine echoes from overwriting self-declared skills.
- **Deliberately Dropped Items:**
  - *5-Criterion comparison matrix & consequences block:* Omitted because statutory registry parameters are jurisdiction-specific and cannot be fabricated.
  - *Sequenced hiring plan with per-role timing:* Omitted because structured hiring timelines are owned by the Phase 4 Resource Calculator.

### 5.7 Step 3.7 — Phase 3 Complete & Investor Readiness Audit (LIVE)
- **Route:** `/dashboard/creator/phase-3/complete`
- **Backing Controller:** `CreatorPhase3Controller` (`PATCH /api/creator/masterplan/complete`).
- **Objective Diagnostic Audit (Not a Fake Celebration):** Renders an institutional readiness audit report with an overall score (0–100), readiness grade (`A` / `B` / `C` / `D`), and status tier (`Investor-Ready`, `Strong`, `Developing`, `Not Ready`).
- **Per-Deduction Breakdown (Backend Addition):** Returns structured `Deductions` array (`Dimension`, `Issue`, `PointsLost`, `RemediationTitle`, `RemediationRoute`) detailing the specific weak areas across the 5 dimensions:
  1. *Concept Clarity & Differentiation* (Max 20 pts)
  2. *Market Evidence & Opportunity Sizing* (Max 20 pts)
  3. *Financial Projections & Unit Economics* (Max 25 pts)
  4. *Legal & Compliance Governance* (Max 15 pts)
  5. *Team Credibility & Founder Advantage* (Max 20 pts)
- **One-Click Remediation Routing:** Each deduction features a direct remediation link navigating to the exact screen where the issue can be corrected.
- **Phase 4 Capabilities Preview:** Unlocks Dynamic Pricing Calculator, Resource & Budget Modeling, and Go-To-Market Execution.

### 5.8 Poll Policy (R12)
One shared timed-session policy (`src/hooks/queries/creator-ai.ts`): **96 attempts OR 4 minutes** wall-clock, 2500ms interval. Inherited identically by Clarifier, Market Study, Business Model, Business Plan, and Forecast polling hooks.

### 5.9 Typography Canon & Token Compliance
All Phase 3 surfaces strictly enforce the project typography canon:
- **Headings:** Inter (`font-heading` / `font-semibold text-foreground`).
- **Body & Paragraphs:** DM Sans (`font-sans text-muted-foreground / text-foreground`); strictly zero DM Mono / monospace leaks on body copy.
- **Numerals & Metrics:** JetBrains Mono (`font-mono tabular-nums`) strictly applied to financial figures, currencies, percentages, and scores.
- **Tokens:** 100% theme semantic tokens (`bg-card`, `border-border`, `text-primary`, etc.); zero raw hex values. Fully verified in both Light and Dark themes across 1440px and 1920px viewports.

---

## 6. Phase 4 — Offer & setup (pricing + GTM)

**Step 4.1 — Pricing (LIVE):** model selection (subscription / one-time / freemium / usage-based) + 3–5 editable tiers, validated and persisted.

**Step 4.2 — Resource Calculator (LIVE):** Sector-specific benchmark resolution (`MarketBenchmarkResolver`) deriving required team roles, salary ranges, duration, essential SaaS stack with costs, and dynamic min/max launch budget calculations based on clarified concept and sector context.

**Step 4.3 — GTM Setup & Roadmap (LIVE):** Structured GTM setup inputs + AI-generated 12-week benchmark GTM schedule with Week 1 foundations auto-completion, marketing channel breakdown, and landing page generator.

**Cross-module note:** the `auto_built_43` badge on business-plan §6 lights on GTM-setup completion, not on pricing data injection. "Pricing feeds GTM" is not literally true — the GTM section still renders the P3 plan text unchanged. Real pricing→GTM data injection is a backlog item, not a claim to make in the doc.

---

## 7. Phase 5 — Cross-Roads

The critical decision phase. Two roads. The old four-screen company-formation wizard is REMOVED from canon — see the forbidden block below.

### Path A — Marketplace (Active Offers: Full Buyout OR Co-Founder / Equity)

- **Listing Authority:** Embedded directly in `CreatorIdeas.Phase5Data.PathA.MarketplaceListing`. Projected dynamically via `MarketplaceProjectDto` (there is NO separate `MarketplaceProjects` MongoDB collection).
- **Active Marketplace Offers:**
  1. **Full Buyout** — 100% IP/asset acquisition by an investor or entrepreneur. Triggers `DealExecutions` pipeline.
  2. **Co-Founder / Equity** — Partnership offer bringing on a co-founder in exchange for equity stake.
- **Superseded Offers:** Legacy `Sell / License`, `License-only`, and `Revenue-share` offers are obsolete and removed from the active marketplace.
- **AI IP Valuation** — **LIVE** (5-factor scoring, 10/day rate limit).
- **NDA Gate** — **LIVE** (required before buyer can view confidential project details).

### Path B — The Big Leap (Private Venture Spinout — NOT a Marketplace Offer)

**Canonical behavior:** choosing Build / The Big Leap is a private journey progression, NOT a marketplace listing. It initiates the path to Level Up (P6). No formation wizard, no cap table, no seed-funding capture in P5.

**STATUS:** The 30-day decision timer is modeled in the product roadmap. Path-B → P6 transitions atomically upon Level Up trigger.

Company document verification does NOT happen in P5 — it is deferred to Entrepreneur Phase 2. (Formation status in P5 stays "drafted" only — this is correct today.)

### REMOVE / FORBIDDEN in P5

- **REMOVE** the stale four-screen wizard, fully live front-to-back: entity-type selector (SAS/SAS-U/SARL), shareholder/cap-table editor (founder/ESOP %), Seed Funding card, the company-formation and seed-funding endpoints, and the CreatorPathB model. For alpha it is hidden so no user can reach it; full deletion follows once business-plan §9 is decoupled.
- **FORBIDDEN:** Listing Path B ("Build Yourself") on the marketplace. Path B is an internal venture spinout to Entrepreneur P1/P6.
- **FORBIDDEN:** showing matched buyers/investors or any match count in Phase 5. Matchmaking does not exist before P6.
- **30-Day Switch Window:** Once a path is chosen, switching between Path A and Path B is permitted within a 30-day window (`PathSwitchWindow = TimeSpan.FromDays(30)` in `CreatorJourneyService.cs`). After 30 days elapse, the decision locks permanently.

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
- **Visual Validation:** Live browser rendering confirmed via headless Playwright runs on running Next.js app, with authentic screenshots captured for modal headers.

---

*End of Creator canon. Update this doc first, then do not write the code — never the reverse.*
