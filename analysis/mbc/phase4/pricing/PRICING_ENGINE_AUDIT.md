# MONDIAL BUSINESS CREATION (MBC) — Phase 4.6 Pricing Strategy Engine Audit

## 1. Executive Summary

Creator Phase 4.6 turns the upstream outputs of Phase 3 (Business Model, Market Study, Financial Forecast), Phase 4 prerequisites (Construction Snapshot, Operational Roadmap, Needs Analysis, Skills Plan), and HumainX Founder Profile into a coherent, mathematically floor-tested launch pricing strategy.

Phase 4.6 serves as the operational commercial launch layer that precedes Phase 4.7 Go-To-Market (GTM).

---

## 2. Source Upstream Data Map

| Upstream Artifact | Milestone | Ingestion Channel | Purpose in Pricing Engine |
|---|---|---|---|
| **Project Details** | Phase 1 / Core | `CreatorJourney.Project` | Problem, solution, sector, edge, target user context |
| **Market Study** | Phase 3.1 | `MarketStudySession` | Competitor landscape, price reference points, threat levels |
| **Business Model Canvas** | Phase 3.2 | `BusinessModelSession` | Revenue streams, customer segments, cost structures, channel |
| **Financial Forecast** | Phase 3.4 | `FinancialForecastSession` | Target ARPU benchmark, monthly OpEx, variable margins, breakeven |
| **Needs & Requirements** | Phase 4.3 | `CreatorJourney.Phase4Data.NeedsAnalysis` | Cost basis for tools, team, external services |
| **Skills & Training** | Phase 4.4 | `CreatorJourney.Phase4Data.SkillsPlan` | Delivery capacity, internal vs outsourced service delivery costs |
| **Aids & Grants** | Phase 4.5 | `CreatorJourney.Phase4Data.SupportPlan` | OPTIONAL (pricing generates normally without it; consumed only when explicitly relevant) |

---

## 3. The Mandatory Architectural Corrections Implemented

1. **Multi-Model / Multi-Stream Architecture**: Root `PricingStrategy` supports `PrimaryRevenueModel`, `RevenueModels[]` (underlying streams), and `Offers[]`. Multi-stream aware for hybrid setups (e.g., Subscription + Setup Fee, Marketplace Commission + Seller Subscription).
2. **Mathematically Rigorous Price Floor**: `MarginTargetType` (`Percentage` vs `AbsoluteAmount`). If percentage $m$: $\text{MinimumPrice} = \frac{\text{VariableCost}}{1 - m}$. If absolute $A$: $\text{MinimumPrice} = \text{VariableCost} + A$.
3. **Economic Basis Normalization for Forecast Alignment**: Never blindly compare one-time project fees against monthly ARPU. Uses `ForecastAlignmentBasis` to convert offer and forecast to identical basis before evaluating variance.
4. **Configurable Materiality Policy**: `PricingMaterialityPolicy` with `RelativeVarianceThreshold`, `AbsoluteVarianceThreshold`, `RevenueModel`, and `ComparisonBasis`. Zero universal 20% hardcodes.
5. **Price Presentation & Tax Treatment**: `PricePresentation` with `Currency`, `TaxMode` (`TaxExclusive`, `TaxInclusive`, `NotApplicableOrUnknown`), `TaxRateReference`, `DisplayPrice`. Zero invented taxes: default to `NotApplicableOrUnknown` if legal/tax data is missing.
6. **Immediate Economics Recalculation on Founder Edit**: PATCH flow immediately recalculates offer economics, contribution margins, forecast alignment, and pricing risks based on founder price. If feature changes have unknown cost impact, marks `EconomicsValidation = NeedsReview` without fake recalculations.
7. **SupportPlan Optional Gate & Conditional Staleness**: Phase 4.5 `SupportPlan` is NOT a hard prerequisite for generation. Generation succeeds when `SupportPlan = null`. `SupportPlan` changes trigger staleness *only* when Phase 4.6 explicitly consumed support-related financial context (`SupportPlanConsumed = true`).
8. **Market Price Evidence Semantics & Invariants**:
   - `MarketPriceEvidenceType`: `CompetitorObserved`, `CustomerInterview`, `CustomerSurvey`, `HistoricalSale`, `PaidPilot`, `PreOrder`, `QuoteAccepted`, `MarketStudyEstimate`, `ModelEstimate`, `Unknown`.
   - `MarketPriceValidationLevel`: `EmpiricallyValidated`, `Supported`, `Indicative`, `Unvalidated`, `Unknown`.
   - **Four-Price Separation Invariant**: Four semantically independent price fields (`RecommendedPrice`, `FounderSelectedPrice`, `MarketReferencePrice`, `ValidatedMarketPrice`) representing distinct concepts and provenance. They may contain identical numeric values without violating the invariant.
   - Competitor/desk research populates `MarketReferencePrice` (`Supported`/`Indicative`), leaving `ValidatedMarketPrice = null`.
   - `ValidatedMarketPrice` is populated ONLY by empirical transactions (`HistoricalSale`, `PaidPilot`, `PreOrder`, `QuoteAccepted`).
