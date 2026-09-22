# MONDIAL BUSINESS CREATION (MBC)
# CREATOR JOURNEY — CANONICAL STATE & ARCHITECTURE SPECIFICATION

**Current Status:** IMPLEMENTED, VERIFIED & FROZEN  
**Last Updated:** 2026-09-22  
**Target Role:** Creator (`UserRole.CREATOR`)  
**Core Repository Scope:**
- Creator HumainX Quick Start (3-Screen Dashboard Gate)
- Creator Phase 4.1 → Phase 4.7 (Construction & Launch Preparation Engine)
- Legacy Phase 4 Cleanup & Retirement
- Canonical Profile & Journey Persistence Architecture

---

## 1. MACRO CREATOR JOURNEY

The Creator macro journey in Mondial Business Creation (MBC) guides an aspiring founder from initial orientation through commercial launch and company formation:

```text
Login / Sign Up
      ↓
Universal Onboarding (Identity, Documents, Verification)
      ↓
Creator Role Selected (`role === 'Creator'`)
      ↓
[GATE] HumainX Quick Start (`/dashboard/creator/humainx`)
      ↓ (Dual Gate: Profile Completeness && Local Journey Completion)
Creator Dashboard Workspace (`/dashboard/creator`)
      ↓
Phase 1 — Project Identity & Access
      ↓
Phase 2 — Concept Clarification, Positioning & Brand Studio
      ↓
Phase 3 — Business Plan Intelligence (3.1 → 3.7)
      ↓
HumainX Deep Profile (Full Skills, Capacity & Operational Profile Enrichment)
      ↓
Phase 4 — Construction & Launch Preparation (4.1 → 4.9)
      ↓
Phase 5 — Crossroads / Commercial Activation
      ↓
Phase 6 — Creator → Entrepreneur Level Up
```

> [!IMPORTANT]
> **Continuity Invariant:** Creator → Entrepreneur Level Up is a **seamless continuation** of the venture, never a restart or data re-entry. All Phase 1–4 intelligence, brand assets, pricing strategy, operational roadmaps, and verified profiles flow forward directly into company incorporation and live venture operations.

---

## 2. HUMAINX QUICK START — CANONICAL GATE ARCHITECTURE

### 2.1 Placement & Scope
The **HumainX Quick Start** is a mandatory 3-screen frontend journey gate positioned directly between universal onboarding completion and the Creator Dashboard:
- **Route:** `/dashboard/creator/humainx`
- **Isolation:** Strictly Creator-only (`normalizeUserRole(user?.role) === UserRole.CREATOR`).
- **Zero Impact on Other Roles:** Investors (`/dashboard/investor`), Entrepreneurs (`/dashboard/entrepreneur`), and Service Providers (`/dashboard/serviceprovider`) never mount or interact with this guard.
- **Architectural Nature:** It is NOT authentication, backend authorization, a global role gate, a second profile entity, or a replacement for Phase 4 backend validation.
- **Backend-Authoritative Gate Formula:** Creator Dashboard access strictly requires authoritative backend Quick Start completion:
  $$\text{DashboardAllowed} = \text{isBackendQuickStartComplete}(\text{profile})$$
- **Single Source of Truth:** `ProfessionalProfileRecord.QuickStart` on the backend profile is the sole onboarding journey authority across refresh, logout/login, storage wipe, and different devices/browsers.
- **LocalStorage Role:** `localStorage` has zero access or progression authority. It is only cleaned upon completion (`resetQuickStartJourneyState(userId)`).

### 2.2 Data Model: Single Canonical Truth
There is **NO duplicate HumainX profile entity** in Mondial ECO. Quick Start and Deep HumainX interact exclusively with the existing canonical `ProfessionalProfileRecord`:

```text
ProfessionalProfileRecord (MongoDB collection: ProfessionalProfiles)
├── Experiences[]
├── Education[]
├── Skills[]                              ← Populated in Step 2 (min 1 required)
│   └── ProfileSkill ({ name, level, source })
├── Languages[]
├── Certifications[]
└── VentureContext
    ├── Region                            ← Populated in Step 1
    ├── CurrentSituation                  ← Populated in Step 1
    ├── WeeklyAvailability                ← Populated in Step 1
    ├── PreviousEntrepreneurialExperience ← Populated in Step 3
    ├── LearningPreference                ← Populated in Step 3
    └── DelegationPreference              ← Populated in Step 3
```

Quick Start partially populates this canonical profile upon onboarding. Later, HumainX Deep Profile enriches this **exact same profile** prior to Phase 4.

---

## 3. HUMAINX QUICK START — 3 SCREENS (FROZEN FIGMA UI)

The visual design is frozen to Figma Node `57125:16446` (656px centered max-width canvas, 1440px–1920px responsiveness, Inter typography tokens):

### Screen 1 — Your Situation
- **Your Region:** French regions select dropdown pre-populated from `VentureContext.Region`. Truthful verification badge displays `"Territory Verified"` only if profile context contains an authoritative address/territory verification signal; otherwise displays `"Selected region"`.
- **Current Situation (7 Cards):** Employed, Self-employed or freelance, Looking for work, Student, In training, Already running a business, Something else.
- **Weekly Availability (7 Pills):** Under 5 hrs, 5–10 hrs, 10–20 hrs, 20–30 hrs, 30+ hrs, Full-time, Not sure yet. Mapped to canonical strings consumed by `IFounderCapacityResolver`.
- **Advance Contract:** Validates Step 1 → Persists data to `ProfessionalProfile` → Marks `step1Confirmed` in browser journey state → Advances to Step 2. Never navigates to Dashboard.

### Screen 2 — Your Skills
- **Skill Requirements:** Minimum 1 skill required (`Skills.length >= 1`). Every selected skill must have a valid level: `Beginner`, `Comfortable`, or `Advanced`.
- **Skill Management:** Curated suggested chips + custom skill entry with duplicate prevention and removal.
- **"I'll add these later" Link:** Visually preserved in the footer per Figma. **NO synthetic skill bypass**: if `skills.length === 0`, clicking it triggers inline validation and strictly blocks advancement to Step 3. The former fake `"General Business / Comfortable"` fallback is permanently removed.
- **Advance Contract:** Validates `Skills.length >= 1` → Persists data → Marks `step2Confirmed` → Advances to Step 3. Never navigates to Dashboard.

### Screen 3 — How You Build
- **Previous Experience (6 Cards):** This is my first time, I've explored an idea, I've worked on a business project, I've freelanced, I've created a company before, I run something right now.
- **Progress Preference (4 Cards):**
  - *I'd rather learn it* → `learningPreference`: "I want to learn them myself", `delegationPreference`: "Minimal delegation — self-reliant learning"
  - *I'd rather hand it off* → `learningPreference`: "Focus on core strengths only", `delegationPreference`: "I prefer to delegate when possible"
  - *A bit of both* → `learningPreference`: "A mix of learning and delegation", `delegationPreference`: "A mix of learning and delegation"
  - *Help me decide* → `learningPreference`: "I'm not sure — recommend the best option", `delegationPreference`: "I'm not sure — recommend the best option"
  (All 4 choices remain round-trip distinguishable after reload).

---

## 4. HUMAINX QUICK START — DUAL-GATE & VERIFIED FRONTEND LOGIC RULES

1. **Separation of Profile Data Completeness and Journey Completion:**
   - **Profile Data Completeness (`isQuickStartComplete(profile)`):** Checks whether canonical `ProfessionalProfileRecord` has all required fields across Steps 1, 2, and 3.
   - **Journey Completion (`isQuickStartJourneyComplete(userId)`):** Verifies that the founder has explicitly navigated through and confirmed all 3 wizard screens.
2. **Frontend Journey State Model:**
   ```typescript
   interface HumainXJourneyState {
     step1Confirmed: boolean;
     step2Confirmed: boolean;
     step3Confirmed: boolean;
     completed: boolean;
   }
   ```
   Stored in browser localStorage under key `humainx_journey_state_${userId}`. Contains zero duplicate business fields.
3. **CURRENT FRONTEND-ONLY UX PERSISTENCE LIMITATION:**
   Because journey confirmation is browser-local:
   - Same account + same browser: Journey state persists smoothly.
   - Same account + different browser/device: Local journey state may not exist; user re-confirms wizard steps (pre-populated with existing profile data).
   - Browser storage cleared: Local journey state is reset; user re-confirms steps.
   `ProfessionalProfile` remains the sole durable account-level business data in MongoDB.
4. **Debounced Autosave (400ms):**
   Autosave handles profile **data only**. Autosave MUST NOT confirm Step 1, confirm Step 2, complete Step 3, complete Quick Start, or unlock the Creator Dashboard. Only explicit CTA button actions alter journey confirmation states.
5. **Only Final CTA Completes Quick Start:**
   Only clicking `"Start my project"` on Step 3 can finalize HumainX Quick Start.
   Canonical sequence:
   $$\text{Flush pending autosave} \to \text{Persist latest data} \to \text{Reconcile profile} \to \text{Assert profile complete} \to \text{Mark step3Confirmed \& completed} \to \text{Navigate to Dashboard}$$
6. **Pre-Existing Data Pre-populates but CANNOT Skip:**
   Pre-existing `ProfessionalProfile` data pre-fills wizard screens. It does not bypass screens. A founder returning with complete data still visits Step 1 $\to$ Step 2 (pre-populated) $\to$ Step 3 (pre-populated) $\to$ clicks "Start my project" $\to$ Dashboard.
7. **Sequential Navigation Enforcement:**
   - `!step1Confirmed` $\implies$ Maximum allowed step is 1.
   - `step1Confirmed && !step2Confirmed` $\implies$ Maximum allowed step is 2.
   - `step1Confirmed && step2Confirmed && !completed` $\implies$ Allowed step is 3.
   - `completed && isQuickStartComplete` $\implies$ Dashboard.
   URL query parameters (`?step=N`) cannot skip ahead beyond confirmed milestones.
8. **Save-Failure Blocks Step Advance:**
   `handleNext()` awaits `persistChanges()`. If persistence fails, the UI remains on the current step and displays actionable error feedback.
9. **Completed User Deflection:**
   Fully completed creators (data complete + journey complete) navigating directly to `/dashboard/creator/humainx` are smoothly deflected to `/dashboard/creator` with zero redirect flash.
10. **Data Safety:**
    Payload generation (`buildSavePayloadFromQuickStart`) preserves all unrelated `ProfessionalProfile` fields (`Experiences`, `Education`, `Languages`, `Certifications`).

---

## 5. PHASE 3 CANONICAL FLOW

Phase 3 establishes complete business plan intelligence prior to construction preparation:
```text
3.1 Market Intelligence & Competitive Landscape
3.2 Business Model & Value Proposition
3.3 Financial Forecast (3-Year P&L, Cash Flow, Unit Economics)
3.4 Legal & Compliance Framework
3.5 Company Formation & Team Architecture
3.6 Executive Business Plan Synthesis
3.7 Investor Readiness & Pitch Kit
      ↓
Phase 3 Complete → HumainX Deep Profile → Phase 4
```

---

## 6. PHASE 4 — CONSTRUCTION & LAUNCH PREPARATION

### 6.1 Purpose & Role Separation
```text
Phase 3 = Understand the Business
HumainX = Understand the Person
Phase 4 = Prepare to Build
Phase 5 = Choose & Execute Commercial Path
Phase 6 = Incorporate & Level Up
```
**Canonical Name:** Construction & Launch Preparation (Internal engine reference: *Construction Engine*).

### 6.2 Canonical Stage Sequence & Implementation Status
```text
Stage 4.1: Construction Snapshot       → FROZEN (Backend 14/14, Frontend 6/6)
Stage 4.2: Operational Roadmap         → FROZEN (Backend 10/10, Frontend 5/5)
Stage 4.3: Needs & Requirements        → FROZEN (Backend 14/14, Frontend 31/31)
Stage 4.4: Skills & Training           → FROZEN (Backend 14/14, Frontend 9/9)
Stage 4.5: Aids, Grants & Support      → FROZEN (Backend 22/22, Adapters Active)
Stage 4.6: Pricing & Revenue Model     → FROZEN (Backend 41/41, Frontend 11/11)
Stage 4.7: GTM & Launch Strategy       → FROZEN (Backend 19/19, Frontend 6/6)
Stage 4.8: Launch Assets               → NEXT / APPROVED ARCHITECTURE (Not in this commit)
Stage 4.9: Construction Readiness      → RESERVED / FUTURE TASK
```

### 6.3 Stage Boundaries
- **4.1:** *WHAT* is ready, missing, partial, or critical across the business foundation.
- **4.2:** *WHEN* and in what order tasks execute across 6 operational horizons.
- **4.3:** *WHAT* operational, technical, legal, and financial resources are required.
- **4.4:** *HOW* capability gaps are resolved: `LEARN`, `DELEGATE`, or `VERIFY`.
- **4.5:** *WHICH* public grants, institutional aids, or tax subsidies apply.
- **4.6:** *WHAT* pricing structure and revenue mechanics produce positive contribution margin.
- **4.7:** *HOW* early customers are systematically acquired, validated, and converted.
- **4.8:** *CREATE* customer-facing launch materials (one-page launch website, collateral).
- **4.9:** Final global Construction Readiness assessment.

---

## 7. PHASE 4 SHARED ARCHITECTURAL INVARIANTS

1. **State Ownership:** `CreatorJourney.Phase4Data` owns all project Phase 4 state in MongoDB.
2. **Upstream Referencing:** Phase 4 stages reference upstream data by IDs/versions rather than duplicating large upstream objects.
3. **Staleness Model:** Explicit provenance tracking (`Update Available`, `Changed Sources`, `Review Changes`, `Refresh`, `Keep Current`). Founder edits are **never silently overwritten**.
4. **Deterministic Policy vs AI:**
   - Deterministic logic owns statuses, math, floor prices, applicability, eligibility rules, and capacity limits.
   - AI is strictly advisory, explanatory, and presentational.
5. **No Premature Global Readiness %:** Global Construction Readiness is owned exclusively by Stage 4.9. Stages 4.1–4.7 track only their own completion status.

---

## 8. PHASE 4.1 → 4.7 STAGE SPECIFICATIONS

### Stage 4.1 — Construction Snapshot
- **Persistence:** `Phase4Data.ConstructionSnapshot`.
- **Item Statuses:** `Ready`, `Partial`, `Missing`, `Critical`, `Optional`, `NeedsReview`.
- **Contract:** Read-only `GET`, idempotent `generate`, explicit `refresh`.

### Stage 4.2 — Operational Roadmap
- **Horizons:** `NOW`, `NEXT_30_DAYS`, `DAYS_30_TO_60`, `DAYS_60_TO_90`, `BEFORE_LAUNCH`, `POST_LAUNCH`.
- **Task Statuses:** `NotStarted`, `InProgress`, `Blocked`, `Done`, `Skipped`, `NeedsReview`.
- **Capacity:** Constrained by `IFounderCapacityResolver`. Completed tasks are never resurrected on refresh.

### Stage 4.3 — Needs Analysis & Requirements
- **Persistence:** `Phase4Data.NeedsAnalysis`.
- **Freshness Pre-conditions:** Phase 3 complete, HumainX complete, Snapshot active, Roadmap scheduled.
- **SystemStatus:** `Identified`, `NeedsReview`, `Satisfied`, `NotRequired`.
- **FounderState:** `Unreviewed`, `Confirmed`, `InProgress`, `Deferred`, `ClaimedSatisfied`.
- **Invariant:** Active Need ≠ Covered Need. `TrainingCandidate` is reserved exclusively for formal/mandatory training needs.

### Stage 4.4 — Skills & Training
- **Resolution Modes:**
  - `Advanced` / `Comfortable` → normally covered.
  - `Comfortable` + critical/blocking requirement without verified track record → `NeedsReview`.
  - `Beginner` → never auto-covered (routes to `LEARN` or `DELEGATE`).
  - `null` / unassessed → `NeedsReview`.
- **Mandatory Legal Verification:** Legal or regulated requirements enforce `VERIFY`. Learning alone cannot bypass legal compliance.

### Stage 4.5 — Aids, Grants & Support Plan
- **Selection Modes:** `Entitlement`, `Discretionary`, `Competitive`, `CreditAssessment`, `NeedsReview`.
- **Eligibility Statuses:** `EligibleToApply`, `Awarded`.
- **Critical Invariant:** `EligibleToApply` ≠ spendable launch cash. Potential or unawarded grants are strictly excluded from spendable launch budgets.
- **Data Provenance:** Integrates *Aides-entreprises* Open Data + official French regional adapters.

### Stage 4.6 — Pricing & Revenue Model
- **Persistence:** `Phase4Data.PricingStrategy`.
- **13 Supported Models:** OneTime, Subscription, UsageBased, TransactionFee, Commission, Retainer, ProjectBased, Freemium, Tiered, MarketplaceFee, Licensing, Hybrid, Other.
- **No Invented Prices:** Grounding required from research, forecasts, or benchmarks. Insufficient data resolves to `NeedsValidation`.
- **Floor Formulas:**
  - Percentage margin: $P_{min} = \frac{VC}{1 - m}$
  - Absolute contribution: $P_{min} = VC + A$
- **Tax Semantics:** Explicit `ConfiguredTaxMode` (`HT`, `TTC`, `Exempt`, `Unknown`). Zero crude B2B/B2C automatic tax inferences.
- **Four-Price Independence:** `RecommendedPrice`, `FounderSelectedPrice`, `MarketReferencePrice`, and `ValidatedMarketPrice` are tracked independently. `ValidatedMarketPrice` strictly requires empirical evidence (paid pilot, preorder, historical sale).

### Stage 4.7 — GTM & Launch Strategy
- **Persistence:** `Phase4Data.GtmStrategy`.
- **Multi-Signal Sales Motion:** Price alone cannot determine sales motion; considers founder capacity, sales cycle, and buyer persona.
- **Budget Provenance:** Distinguishes `ForecastCacAssumption`, `ObservedCac`, and `ValidatedCac`. If pricing is `NeedsValidation`, GTM enforces validation-first testing before paid scaling.
- **Immutable Experiment Evidence:** Completed validation runs and evidence are never deleted during refreshes.

---

## 9. RETIREMENT OF LEGACY PHASE 4 IMPLEMENTATION

The legacy, unaligned Phase 4 implementation has been completely retired:
- **Removed Controllers:** `CreatorPhase4Controller.cs` and all `/api/creator/offer/*` endpoints.
- **Removed Frontend Routes:** `/dashboard/creator/offer-pricing`.
- **Removed Legacy Components:** `Phase4Pricing.tsx`, `Phase4Resource.tsx`, `Phase4Gtm.tsx`, `Phase4Complete.tsx`.
- **Database Hygiene:** Cleaned duplicate legacy fields from `CreatorJourney.Phase4Data`. Verified across 137 CreatorIdeas and 110 CreatorJourneys in MongoDB.

---

## 10. APPROVED ARCHITECTURE FOR FUTURE STAGES

### Stage 4.8 — Launch Assets (NEXT APPROVED STAGE)
- **Objective:** Convert approved GTM, positioning, pricing, brand identity, and legal compliance into customer-facing launch assets.
- **Primary Deliverable:** **One-Page Professional Launch Website** (responsive, branded, component-based, section families: Hero, Problem, Solution, Features, How It Works, Offer/Pricing, Social Proof, FAQ, Final CTA).
- **Storage Decision:** Active configuration in `CreatorJourney.Phase4Data.LaunchAssets`. Historical generated revisions stored in dedicated `LaunchAssetVersions` to avoid unbounded MongoDB documents.
- **Current Status:** **NOT IMPLEMENTED IN THIS COMMIT**.

### Stage 4.9 — Construction Readiness
- Final deterministic assessment synthesizing all 8 stages into launch certification.
- **Current Status:** **NOT IMPLEMENTED IN THIS COMMIT**.

---

## 11. VERIFICATION MATRIX & REGRESSION SIGNALS

| Test Suite | Files | Tests Passed | Status |
| :--- | :--- | :--- | :--- |
| **HumainX Quick Start Suite** | 1 | **53 / 53** | **PASS** |
| **Creator Full Frontend Suite** | 10 | **124 / 124** | **PASS** |
| **Routing & Auth Guard Suite** | 4 | **31 / 31** | **PASS** |
| **Backend Targeted Phase 4 / HumainX** | 1 | **213 / 213** | **PASS** |
| **TypeScript Compiler (`tsc --noEmit`)** | Whole repo | **0 errors (Exit 0)** | **PASS** |
| **Next.js Production Build (`npm run build`)** | Whole repo | **Exit 0** (All routes static/dynamic emitted) | **PASS** |

*Historical Full Repository Baseline (unrelated pre-existing external tests):*
- *Backend Full Suite: 2113 passed, 5 failed (known pre-existing SP failures).*
- *Frontend Full Suite: 1085 passed, 8 failed (known pre-existing theme token / BrandStudio).*

---

## 12. FROZEN ARCHITECTURAL POLICY

```text
FROZEN / DO NOT REOPEN WITHOUT REGRESSION
- HumainX Quick Start (UI & Logic)
- Phase 4.1 Construction Snapshot
- Phase 4.2 Operational Roadmap
- Phase 4.3 Needs & Requirements
- Phase 4.4 Skills & Training
- Phase 4.5 Aids, Grants & Support
- Phase 4.6 Pricing & Revenue Model
- Phase 4.7 GTM & Launch Strategy
- Legacy Phase 4 Retirement
```
Only reopen if a confirmed regression is introduced by future Phase 4.8 / 4.9 integration or an explicit product canon modification is authorized.

---

## 13. CREATOR PHASE 2–5 CLEAN BASELINE

```text
CREATOR PHASE 2–5 CLEAN BASELINE

Phase 2 Brand authority:
BrandKit (canonical visual identity authority; CreatorIdea.Project.Branding is derived projection only)

Phase 3.4 Legal authority:
CreatorLegalAssessment (CreatorIdea.Phase3Data.LegalAssessment)

HumainX onboarding authority:
ProfessionalProfileRecord.QuickStart (sole onboarding journey authority; localStorage has no access/progression authority)

Phase 4 completion authority:
Phase4CompletionResolver (sole Phase 4 completion authority)

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
