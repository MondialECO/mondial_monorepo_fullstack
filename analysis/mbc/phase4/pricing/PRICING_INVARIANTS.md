# MONDIAL BUSINESS CREATION (MBC) — Phase 4.6 Invariants Verification

## Invariant 1: Four-Price Separation Invariant (Four Semantically Independent Price Fields)
The four price fields represent distinct concepts and provenance. They may contain identical numeric values without violating the invariant.
- `RecommendedPrice`: MBC deterministic recommendation synthesized from unit cost floors, competitor benchmarks, and forecast ARPU.
- `FounderPrice` / `FounderSelectedPrice`: Price explicitly chosen or accepted by the founder (editable via PATCH; may equal `RecommendedPrice` when founder accepts recommendation).
- `MarketReferencePrice`: External researched or observed market reference (indicative/supported external anchor; never automatically converted to validated price; may equal `RecommendedPrice`).
- `ValidatedMarketPrice`: Empirically validated market price evidence derived ONLY from real economic transactions (Paid Pilot, Historical Sale, Pre-Order, Quote Accepted). Remains `null` if no empirical evidence exists; may equal `FounderSelectedPrice` without losing empirical evidence semantics.

These fields:
- May be equal numerically.
- May be null independently (e.g. `ValidatedMarketPrice = null`).
- Must preserve separate provenance.
- Must never overwrite one another.
- Must never silently promote one source type into another.

---

## Invariant 2: Single Source of Truth
- Persisted strictly under `CreatorJourney.Phase4Data.PricingStrategy`.
- Zero dual-writing to `CreatorIdea`.
- Zero in-memory mutations to upstream collections (`FinancialForecastSession`, `BusinessModelSession`, `MarketStudySession`).

---

## Invariant 3: Immediate Economics Recalculation on Founder Edit
When the founder submits a custom price (e.g. Recommended €49 -> Founder €19):
- The engine recalculates contribution margin amount and rate immediately.
- The engine checks price floor violations immediately.
- The engine flags forecast variance immediately.
- The UI never displays stale margins or uncalculated states.

---

## Invariant 4: Conditional Staleness Dependency & SupportPlan Optionality
- Critical sources (Market Study, Business Model Canvas, Financial Forecast, Project Core) trigger staleness when modified.
- Phase 4.5 `SupportPlan` is OPTIONAL for generation gate check (generation succeeds with `SupportPlan = null`).
- Conditional sources (Needs Analysis, Support Plan) trigger staleness **ONLY IF** the Pricing Strategy consumed them during generation (`SupportPlanConsumed = true`).
- Phase 4.5 public grants/subsidies do NOT alter commercial pricing or trigger invalidation unless directly linked to project unit delivery costs.

---

## Invariant 5: Strict Canonical Phase 4.7 Boundary
- Phase 4.7 GTM & Launch Strategy is NOT implemented.
- The UI renders a dedicated boundary banner with a disabled CTA button and lock icon.
- No GTM routes or state leaks exist in Phase 4.6.
