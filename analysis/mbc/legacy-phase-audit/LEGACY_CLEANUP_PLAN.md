# MONDIAL BUSINESS CREATION (MBC)
## Legacy Architecture Phased Cleanup Plan (Waves 0–6)

**Audit Date:** September 21, 2026  
**Mode:** STRICT READ-ONLY AUDIT & PROPOSED PLAN (NO CODE CHANGES EXECUTED)  
**Scope:** Actionable roadmap for gradual, zero-downtime, non-breaking retirement of legacy Phase 4 code following the deployment of canonical Phase 4.1–4.9 Construction Engines.

---

### Wave 0 — No Change / Keep (Active Canonical Systems)

**Objective:** Explicitly preserve all modules that represent active canonical business logic, domain boundaries, and reference stores.

* **Components to Keep:**
  1. `CreatorPhase4ConstructionController.cs`: The sole canonical controller for Phase 4.1–4.9 Construction.
  2. `CreatorPhase5Controller.cs`: The canonical controller for Crossroads, Marketplace IP deals, and Formation.
  3. `CreatorPhase6Controller.cs`: The canonical controller for Smart Matchmaking and atomic Creator → Entrepreneur Level Up.
  4. `MarketBenchmark.cs` & `MarketBenchmarkResolver.cs`: Sector-based statistical reference data used across Phase 3.1 and Phase 4.
  5. `crossroads/page.tsx`, `CrossroadsPathA.tsx`, `CrossroadsPathB.tsx`: Canonical Phase 5 UI.
  6. `investors/page.tsx`, `LevelUpCelebration.tsx`: Canonical Phase 6 UI.
  7. `CreatorProgressProvider.tsx` & `useCreatorProgressState.ts`: Journey progress orchestration.
* **Execution Guard:**
  - Absolutely no deletion or refactoring of these files during legacy cleanup.

---

### Wave 1 — Mark Deprecated (Zero Runtime Impact)

**Objective:** Signal architectural intent to developers and tools without breaking existing routes, APIs, or database operations.

* **Actions:**
  1. **Backend Controller:** Add `[Obsolete("Superseded by CreatorPhase4ConstructionController (/api/creator/phase4/*). Kept for backward compatibility with legacy offer-pricing route.")]` to `CreatorPhase4Controller.cs`.
  2. **Data Model:** Add `[Obsolete]` attributes to legacy fields in `CreatorPhase4Data.cs`:
     - `PricingModel`
     - `Tiers`
     - `PricingForecastContext`
     - `ResourceCalculation`
     - `GtmSetup`
  3. **Data Model Hygiene:** Ensure `[BsonIgnoreExtraElements]` is explicitly annotated on `CreatorPhase4Data.cs`.
  4. **Frontend API Client:** Annotate legacy methods in `src/lib/api-creator-journey.ts` with JSDoc `@deprecated`:
     - `saveOfferPricing()`
     - `saveOfferResource()`
     - `saveOfferGtm()`
     - `completeOffer()`
     - `getOfferSummary()`
     - `getMarketBenchmark()`
* **Risk:** None. Runtime behavior is unchanged.

---

### Wave 2 — Redirect Callers (Decouple Frontend Traffic)

**Objective:** Divert all Creator traffic away from the legacy wizard (`offer-pricing`) to the canonical Construction Engine (`phase-4`).

* **Actions:**
  1. **State Resolver Update:** In `src/lib/creator-state-resolver.ts`, update `getNextCreatorAction` step 4 route:
     - Change target from `/dashboard/creator/offer-pricing` to `/dashboard/creator/phase-4`.
  2. **Page Redirection:** In `src/app/dashboard/creator/offer-pricing/page.tsx`, introduce a client-side redirect (`router.replace('/dashboard/creator/phase-4')`) or banner notice guiding the Creator to the Unified Construction Hub.
  3. **Dashboard Banner Sync:** In `src/app/dashboard/creator/page.tsx`, update step action links to ensure all Phase 4 references navigate to `/dashboard/creator/phase-4`.
* **Verification:** Creators navigating through their dashboard naturally land on the canonical 9-step Construction Engine. Legacy wizard stops receiving human user input.

---

### Wave 3 — Migrate Useful Shared Logic

**Objective:** Extract valuable calculation utilities or reference resolvers from legacy classes into shared domain services before deleting legacy controllers.

* **Actions:**
  1. **Benchmark Integration:** Ensure `MarketBenchmarkResolver` is registered as a standalone DI singleton in `Program.cs` / `Startup.cs` without relying on `CreatorPhase4Controller`.
  2. **Forecast ARPU Comparison:** The ARPU divergence warning logic from `CreatorPhase4Controller.SetPricing` (checking if tier price deviates from Phase 2 financial forecast ARPU) is already canonically implemented in `PricingPolicyEngine.cs`. Verify full parity.
  3. **Timeline Week Milestones:** Migrate any reusable week-by-week GTM launch checklist templates from `Phase4Gtm.tsx` into canonical launch templates if desired for Phase 4.8 Launch Assets.
* **Verification:** Unit tests confirm that no necessary utility depends on legacy classes.

---

### Wave 4 — Remove Dead Frontend & API Client Code

**Objective:** Remove legacy UI components once telemetry confirms zero inbound traffic to the legacy wizard.

* **Actions:**
  1. Delete legacy components:
     - `src/components/creator/phase4/Phase4Pricing.tsx`
     - `src/components/creator/phase4/Phase4Resource.tsx`
     - `src/components/creator/phase4/Phase4Gtm.tsx`
     - `src/components/creator/phase4/Phase4Complete.tsx`
  2. Delete legacy route:
     - `src/app/dashboard/creator/offer-pricing/` directory.
  3. Remove deprecated API client methods from `src/lib/api-creator-journey.ts`:
     - Remove `saveOfferPricing`, `saveOfferResource`, `saveOfferGtm`, `completeOffer`, `getOfferSummary`.
* **Verification:** Frontend build (`npm run build`) completes cleanly with zero broken imports or references.

---

### Wave 5 — Remove Dead Backend Code

**Objective:** Safely eliminate the deprecated legacy controller and update test suites.

* **Actions:**
  1. Delete backend controller:
     - `backend/Controllers/CreatorPhase4Controller.cs`.
  2. Remove legacy mutators from `CreatorJourneyService.cs` and `ICreatorJourneyService.cs`:
     - `SetPhase4PricingAsync`
     - `SetPhase4ResourceAsync`
     - `SetPhase4GtmAsync`
     - `GetPhase4OfferSummaryAsync`
  3. Refactor test suite:
     - In `backend/tests/WebApp.Tests/Unit/MarketBenchmarkTests.cs`, retain `MarketBenchmarkResolver` tests and remove or update tests specifically verifying `CreatorPhase4Controller` HTTP routes.
* **Verification:** Backend solution builds cleanly (`dotnet build`) and all unit tests pass (`dotnet test`).

---

### Wave 6 — Data Migration & Compatibility Cleanup (Post-Verification)

**Objective:** Clean up historical MongoDB documents and remove unused C# properties.

* **Actions:**
  1. **Historical Backfill Script:** Run a one-time idempotent MongoDB script:
     - For any `CreatorIdea` where `Phase4Data.PricingStrategy` is null and `Phase4Data.Tiers` has entries, translate legacy tiers into a minimal `PricingStrategy` document.
     - For any `CreatorIdea` where `Phase4Data.NeedsAnalysis` is null and `Phase4Data.ResourceCalculation` has entries, translate team/SaaS items into `NeedsAnalysis.Items`.
  2. **Model Cleanup:** Once backfill is verified in production:
     - Remove legacy properties (`PricingModel`, `Tiers`, `PricingForecastContext`, `ResourceCalculation`, `GtmSetup`) from `CreatorPhase4Data.cs`.
     - Retain `[BsonIgnoreExtraElements]` to prevent errors if old archived documents still contain these keys.
* **Verification:** MongoDB read/write tests confirm 100% backward and forward compatibility.
