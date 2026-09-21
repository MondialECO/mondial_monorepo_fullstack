# Creator Phase 4.7 — GTM & Launch Strategy Engine

## 1. Executive Summary

Phase 4.7 transforms upstream intelligence—Market Study (3.1), Business Model (3.2), Financial Forecast (3.4), Operational Roadmap (4.2), Needs & Requirements (4.3), Skills Plan (4.4), Public Aids (4.5), and Pricing & Revenue Model (4.6)—into a deterministic, sequenced, capacity-grounded Go-To-Market and Launch Strategy.

Crucially, Phase 4.7 enforces the canonical Phase 4 boundary:
- **Phase 4.7 defines WHAT launch actions exist, who they target, which channels are prioritized, weekly capacity loads, and what empirical experiments must test them.**
- **Phase 4.8 produces Launch Assets (copywriting, wireframes, decks, email scripts). Phase 4.8 remains strictly disabled and locked in Phase 4.7.**

---

## 2. The 7 Approved Refinements

1. **Shared Founder Capacity Resolver**: Reuses `FounderCapacityResolver` across Phase 4.2 Roadmap and Phase 4.7 GTM. Instead of simple channel counting, channel effort loads (`FounderLedSales`=High (4 pts), `OrganicSocial`=Medium (2 pts), `ColdOutreach`=High (4 pts), `Referral`=Low (1 pt)) are evaluated against normalized weekly hours available.
2. **Deterministic Reason Codes**: Replaces any opaque AI ranking with explicit reason codes (`GtmRecommendationReason` enum: `SEGMENT_REACHABLE`, `FOUNDER_CAPABILITY_MATCH`, `DELEGATION_AVAILABLE`, `BUDGET_COMPATIBLE`, `SALES_MOTION_MATCH`, `PRICE_MODEL_MATCH`, `LOW_FOUNDER_CAPACITY`, `PRICE_NOT_VALIDATED`, etc.). Every channel answers: Why recommended? Why now? Why not another channel? What evidence supports it?
3. **Honest Experiment Thresholds (`NeedsBaseline`)**: Without empirical benchmark data, conversion percentages and CAC ceilings are NOT fabricated. Thresholds default to `ExperimentThresholdStatus.NeedsBaseline` to establish initial empirical response baselines honestly.
4. **Stronger Budget Provenance Semantics**: Explicit `GtmBudgetSourceType` (`FounderDeclared`, `ForecastAssumption`, `ExistingCompanyBudget`, `AwardedSupport`, `ConfirmedFinancing`, `Unknown`) and `SpendableStatus` (`ConfirmedAvailable`, `Planned`, `Potential`, `Unknown`). Forecast marketing assumptions are marked `Planned`, not available cash in hand; conditional grants are excluded from spendable cash.
5. **Multi-Signal Sales Motion (`SalesMotionContext`)**: Sales motion is determined from customer type, buying complexity, decision maker count, offer complexity, and trust requirements—never from a naive raw price threshold alone.
6. **Immutable Historical Experiment Evidence**: Completed experiment runs are saved immutably as `ExperimentRun` records on `GtmExperiment.Runs`. On strategy refresh, historical test runs are never wiped or overwritten.
7. **Consumed-Source Staleness Detection**: Staleness is triggered ONLY when consumed fields change (pricing offers/prices, weekly availability, consumed marketing budget, consumed ARPU, market study versions). Unconsumed forecast changes (tax assumptions, unrelated opex) do not stale GTM.

---

## 3. Architecture & Persistence

- **Endpoint Root**: `/api/creator/phase4/gtm`
- **Controller**: `CreatorPhase4ConstructionController.cs`
- **Orchestrator**: `GtmStrategyService.cs` (`IGtmStrategyService`)
- **Policy Engine**: `GtmPolicyEngine.cs` (`IGtmPolicyEngine`)
- **Capacity Engine**: `FounderCapacityResolver.cs` (`IFounderCapacityResolver`)
- **Persistence Root**: Strictly `CreatorJourney.Phase4Data.GtmStrategy`. No dual-write to `CreatorIdea`. Upstream phases remain completely read-only.

---

## 4. Technical Stack & Runtime Environment

- **Backend**: `.NET 8.0` (`net8.0` ASP.NET Core)
- **Frontend**: `Next.js 16.1.7` (Next.js 16.2.6 Turbopack compiler) / `React 19.2.3` / `React DOM 19.2.3`
- **Design Canon**: Strict Tailwind token compliance, zero unauthorized raw hex colors, responsive across 375px, 768px, 1440px, and 1920px viewports.
- **Phase 4.8 Boundary**: Strictly disabled with `cursor-not-allowed` and locked status ("Phase 4.8 Coming Next").

