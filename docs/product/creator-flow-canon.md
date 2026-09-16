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

### 1.7 AI credit metering & starter grant
Capabilities are credit-metered against server-authoritative balance and capability costs (`GET /api/ai/credits`). Current standard starter grant is **200 credits** on onboarding or first AI call (`Ai:StarterCredits = 200`). Current costs: IdeaClarifier: **20**, BusinessPlan: **33**, Financial Forecast: **32** (provisional), Probe: **0**. Exhaustion triggers HTTP 402; failed generations auto-refund.

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

**Steps:** email OTP, phone OTP, identity document upload, face verification, role selection.

The Phase-1 completion gate promotes onboarding to Phase 1 only when all four core items (identity, face, phone, email) read verified on the Onboarding model. Promotion is derived — no manual phase writes.

### Status:

- **Email OTP, Phone OTP** — **LIVE** (HMAC-hashed, expiring, rate-limited).
- **Role selection persistence** — **LIVE** (set at signup, read via onboarding status + JWT role claim).
- **Identity + Face verification** — was STUB (only dev-only endpoints wrote the flags). Fixed via the KYC bridge: admin approval of uploaded docs now sets the onboarding identity/face flags and re-runs promotion, so a concierge-approved user clears the gate in production. Reject is symmetric (clears the flags + re-evaluates). SUMSUB is intentionally not wired for alpha.
- **The role UI cosmetic hardcode** ("Role selected (Creator)" without reading actual role) — minor, should read the real role.

**Alpha rule:** KYC clearance is by admin (concierge) approval. This is the legitimate path until SUMSUB is integrated post-alpha.

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
3. **Branding Entry (`/phase-2/branding`):** Redesigned single-card presentation ("Brand Visual Identity Studio", light theme, hairline borders) highlighting 6 concrete deliverables, a single filled primary blue CTA ("Open Brand Studio") routing to `/dashboard/creator/phase-2/brand-studio`, and a quiet secondary "Skip for now" action that calls `creatorJourneyApi.skipBranding()` and navigates directly to `/complete`.
4. **Phase 2 Complete (`/phase-2/complete`):** Redesigned compact summary screen reading the live `BrandKit` from `apiCreatorBrandKit.getBrandKit(ideaId)`. Displays a 5-role color swatch strip, typography pairing ({Heading} + {Body}), and active logo mark alongside the clarified idea summary; provides direct links to the full Brand Kit hub (`/dashboard/creator/phase-2/brand-kit`), studio re-entry (`/dashboard/creator/phase-2/brand-studio`), and proceeds to Phase 3 Business Plan.

### Brand Visual Identity Studio & Hub (LIVE)

The Brand Visual Identity Studio provides a calm, generative studio workflow across 7 user-facing modal steps followed by a persistent Brand Kit Hub page. Persisted in the dedicated `BrandKits` collection (`BrandKit`) bound 1:1 to each `CreatorIdea` via `BusinessIdeaId` (unique index on `IdeaId`). Fully compiled and verified clean in full-solution backend (.NET 8) and production frontend (Next.js 16/Turbopack) builds.

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
- **Top 6-Segment Progress Bar vs 7 User-Facing Steps:**
  1. `strategy` (Step 1 segment: "Strategy", modal: `StrategyReviewModal`)
  2. `direction` (Step 2 segment: "Direction", modal: `DirectionBoardModal`)
  3. `logo_type` (Step 3 segment: "Logo Type", modal: `LogoTypeChooserModal`)
  4. `logo` (Step 4 segment: "Logo", encompassing both Step 4 `LogoCreationModal` and Step 5 `VariationSetModal`)
  5. `colors` (Step 5 segment: "Colours", modal: `ColorSystemModal`)
  6. `typography` (Step 6 segment: "Typography", modal: `TypographySystemModal`)
- **Interface Typography:** Standardized on **Inter** and **DM Sans** for all UI body copy, headings, and labels across all Studio surfaces (Syne Bold was an earlier prototype mock and is NOT used). **JetBrains Mono** is used for all numerals, tokens, and telemetry badges.
- **Shared Components:**
  - `RegenerateCapBadge`: Reused across Direction, Logo Creation, Colour, and Typography to display remaining attempts (`N/3 LEFT` in neutral/muted, transitions to amber `0/3 LEFT` when cap is exhausted).

#### 2. Per-Modal Behavior & Interaction Rules
1. **Strategy Review Modal (`StrategyReviewModal`):**
   - Initial automatic derivation from `CreatorIdea.Project`:
     - `Project.Name` $\to$ `BusinessName`, `NameDisplayForm`
     - `Project.Concept` (fallback `Project.Solution`) $\to$ `Concept` (Provenance: `stated` if from project, `derived` if fallback)
     - `Project.TargetUser` $\to$ `TargetAudience` (`stated` / `derived`)
     - `Project.Category` (fallback `Project.Tags[0]`) $\to$ `Industry` (`stated` / `derived`)
     - `Project.MarketGap` (fallback `Project.Solution`) $\to$ `Positioning` (`stated` / `derived`)
     - `Project.Tags` + `Project.CreatorEdge` $\to$ `PersonalityTraits` (default fallback: `["Precise", "Resilient", "Autonomous"]`)
     - Category keywords $\to$ `AvoidList` heuristics (e.g. avoiding cliché padlocks/shields for cyber, leaves/wheat for agri).
   - Creators can freely edit personality traits and avoid items with zero credit cost.
2. **Direction Board Modal (`DirectionBoardModal`):**
   - Generates exactly 4 distinct visual directions via generative model call (`AiJobType.DirectionGeneration`, **7 credits**).
   - Free interactive **Adjust strip** (Palette variant, Contrast position, Type weight) persisted directly via `PATCH /direction` without credit cost.
   - Enforces a 3-regeneration cap for the entire candidate set (`RegenerateCount <= 3`).
3. **Logo Type Chooser Modal (`LogoTypeChooserModal`):**
   - **0 credit cost** and zero regenerate cap (pure structural choice).
   - Computes dynamic fit indicators (Recommended, Good Fit, Low Fit) in real time based on `CharacterLength` and `WordCount` constraints (e.g. short names favor Monograms, long names favor Wordmarks/Combination marks).
   - Hands off selected `LogoType` to Logo Creation to filter subsequent concept generation.
4. **Logo Creation Modal (`LogoCreationModal`):**
   - Batch generation of 6 parametric logo concepts filtered by the selected `LogoType` (`AiJobType.LogoParameterSelection`, **4 credits**).
   - Per-concept regeneration: creators can regenerate individual concepts independently (`AiJobType.LogoConceptRegenerate`, **2 credits**, capped at 3 regenerations per concept).
   - Includes full-screen Compare Overlay and Micro-Scale Inspection (16px favicon view & invoice mock).
5. **Variation Set Modal (`VariationSetModal`):**
   - Free deterministic derivation of the **7 canonical logo variations** derived from the approved concept mark geometry.
   - Separate confirmation action (`POST derive-variations` / `PATCH logo` with `approvedAt`) from concept selection.
   - 7 Canonical Variation Keys & Purposes:
     1. `primary`: Default master brand lockup for full-color presentations.
     2. `horizontal`: Linear lockup for navbars, page headers, and wide banners.
     3. `stacked`: Centered vertical lockup for square cards, badges, and packaging.
     4. `icon_only`: Standalone mark for favicons (16/32px), app icons, and social avatars.
     5. `black`: Single-ink solid black lockup for dark monochrome printing.
     6. `white`: Reversed solid white lockup for dark backgrounds.
     7. `transparent`: Alpha channel SVG mark with transparency grid rendering.
6. **Colour System Modal (`ColorSystemModal`):**
   - Initial deterministic derivation (`DeriveInitialColors`, **0 credits**).
   - Generative whole-palette regeneration (`AiJobType.ColorGeneration`, **2 credits**, 3-cap).
   - Free individual role editing (Hex color picker and role lock toggles).
   - Real-time deterministic WCAG contrast ratio and rating calculation against `#FFFFFF` canvas. `Background` role has null contrast ratio by design.
   - **Server-Side Confirmation (`Colors.ConfirmedAt`):** Confirming the Colour System sends `confirmedAt: ISO timestamp` via `PATCH /colors`, and `CreatorBrandKitController.cs` records a genuine server-side UTC timestamp in `kit.Colors.ConfirmedAt` (matching Strategy and Logo confirmation patterns). Step 6 prerequisite sequencing in `CheckStepPrerequisite(6)` and `CheckPatchPrerequisite("typography")` strictly requires `kit.Colors.ConfirmedAt != null` (removing prior role-count proxy).
7. **Typography System Modal (`TypographySystemModal`):**
   - Initial deterministic pairing derivation (`DeriveInitialTypography`, **0 credits**).
   - Generative pairing suggestion (`AiJobType.TypographyGeneration`, **2 credits**, 3-cap). *(Note: Known UI badge display bug — `TypographySystemModal.tsx:285` renders a static `<Badge>5 Credits</Badge>` chip while backend authoritatively debits 2 credits per `appsettings.json`).*
   - **Server-Side Immutability of "Logo type":** The `Logo type` role is structurally bound to the approved logo concept. `CreatorBrandKitController.cs` explicitly rejects modifications or unlock attempts on `Logo type` via `PatchTypography`, and regeneration strictly preserves it.
   - **Server-Side Confirmation (`Typography.ConfirmedAt`) & Completion Trigger:** Confirming Step 6 sends `confirmedAt: ISO timestamp` via `PATCH /typography`, setting `kit.Typography.ConfirmedAt`. `AdvanceStep(6)` enforces `kit.Typography.ConfirmedAt != null` before advancing `CurrentStep = 6`, marking `Status = "complete"`, and synchronizing the 4-field pointer to `CreatorIdea.Project.Branding`. Frontend `BrandStudioShell` strictly checks real server `confirmedAt` values (`isColorsComplete = Boolean(kit?.colors?.confirmedAt)`, `isTypographyComplete = Boolean(kit?.typography?.confirmedAt)`).
   - **Downstream Completion Effects:** Setting `Status = "complete"` permanently unlocks non-linear section editing from the Hub, bypassing prerequisite sequencing guards in `CheckPatchPrerequisite`.

#### 3. Brand Kit Hub Page (`/dashboard/creator/phase-2/brand-kit`)
- **Calm Reference View:** A standalone hub page displaying all confirmed brand assets without Studio progress bars or step counters.
- **Header Action Cluster:** Exactly ONE filled blue primary CTA button (`Download Brand Kit (.zip)`); secondary actions (`Version History`, `Open Studio`) are subtle outline/ghost buttons.
- **Section Overview:**
  1. *Logo & 7 Variations:* 7 production SVG tiles with "Copy SVG" actions and checkerboard alpha background on `transparent`.
  2. *Colour Tokens:* 5 canonical roles (`Primary`, `Secondary`, `Accent`, `Background`, `Text`) with WCAG AAA/AA badges.
  3. *Typography Specimens:* 4 canonical roles (`Logo type`, `Heading`, `Body`, `Button & label`) with live specimens and scale metadata.
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

#### 4. Credit Metering, Per-Element Caps & Studio Reset
- **Config-Driven Pricing:** Configured under `Ai:CreditCosts` in `appsettings.json`:
  - Direction Generation (4 candidates): **7 credits** (`AiJobType.DirectionGeneration`)
  - Logo Batch Generation (6 concepts): **4 credits** (`AiJobType.LogoParameterSelection`)
  - Logo Single Concept Regeneration: **2 credits** (`AiJobType.LogoConceptRegenerate`)
  - Color Palette Regeneration: **2 credits** (`AiJobType.ColorGeneration`)
  - Typography System Regeneration: **2 credits** (`AiJobType.TypographyGeneration`) *(Note: Known frontend UI badge discrepancy — `TypographySystemModal.tsx:285` displays a "5 Credits" chip while backend authoritatively debits 2 credits per config).*
  - Deterministic Initial Derivations & Derived Variations: **0 credits (Free)**
  - Total credits spent during full E2E walkthrough is exactly **13 credits** (7 for Direction + 4 for Logo concepts + 2 for single concept regeneration).
  - All generative operations are free-tier eligible per the platform's starter credits model (200 credits granted on onboarding/first AI call).
- **Per-Element Cap (Max 3):** Direction, Logo Concepts, Colors, and Typography each enforce `RegenerateCount <= 3`. Reaching the cap halts further generation with HTTP 400 and **0 credits debited**.
- **Compensating Refunds:** Debits occur before model execution. If an AI call fails, times out, or encounters an optimistic concurrency conflict, `RefundForJobAsync` is immediately dispatched.
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

## 5. Phase 3 — AI Masterplan

The strongest, most canon-correct phase. Four modules assembled into the Masterplan, then a readiness score, then a completion gate.

**Session chain (enforced):** `clarifierSessionId` → `businessPlanSessionId` (C-3) → `forecastSessionId` (C-4). C-4 start returns 422 if the business plan is missing/incomplete.

### 5.1 Module — Financial Forecast (C-4, LIVE)

A **36-month** P&L (revenue, costs, cash flow, break-even). **Only the first 12 months are AI-generated; months 13–36 are derived deterministically** in the backend (`ForecastHandler.ExtendToThirtySixMonths`) by projecting from the user's own inputs — revenue compounds at `monthlyGrowthPct`, fixed cost holds at `opex`, variable cost tracks the AI's month-12 margin, cash flow accumulates, and break-even is recomputed across all 36. Rationale: generating 36 full monthly projection structures in a single prompt risks reliability and latency timeouts, so we keep the AI call focused on month 1–12 and extend deterministically. **Projection disclosure is REQUIRED** — the results view and the PDF both label months 13–36 as *projected, not model output* (`aiMonthCount` marks the boundary). Bound to live output — no mock arrays. Non-blocking warnings for unhealthy inputs (tight unit economics, >30% MoM growth, small TAM, high churn).

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

---

*End of Creator canon. Update this doc first, then do not write the code — never the reverse.*
