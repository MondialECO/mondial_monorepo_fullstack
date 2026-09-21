# Phase 4.7 — GTM Refresh & Overrides Policy

## 1. Refresh Invariants

When `POST /api/creator/phase4/gtm/refresh` executes:
1. **Founder Channel Overrides Preserved**: Any channel where `founderEdited = true` retains the founder's selected priority and notes.
2. **Historical Runs Preserved**: Completed `ExperimentRun` items from previous strategy generations are merged into the refreshed strategy.
3. **Upstream Source Version Update**: `SourceVersions` is updated with current timestamps and fingerprints.
4. **Idempotent `/generate`**: Calling `/generate` when a strategy already exists returns the existing strategy with zero mutation. `/refresh` must be called explicitly to re-run derivation.

---

## 2. Consumed-Source Staleness Detection

Staleness is calculated in `GtmStrategyService.DetectStaleness`:
- `PricingStrategyUpdatedAt` or `PricingOffersFingerprint` mismatch -> Stale.
- `ConsumedWeeklyAvailability` mismatch -> Stale.
- `MarketStudyVersion` mismatch -> Stale.
- `BusinessModelVersion` mismatch -> Stale.
- `ConsumedForecastMarketingBudget` or `ConsumedForecastCac` mismatch -> Stale.
- Unconsumed forecast modifications (e.g. corporate tax rate, office rent) -> **NOT Stale**.
