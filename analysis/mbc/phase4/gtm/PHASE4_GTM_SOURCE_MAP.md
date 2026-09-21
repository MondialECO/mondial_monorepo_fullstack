# Phase 4.7 — GTM Source Mapping & Dependencies

## 1. Upstream Consumed Sources

| Phase | Module | Consumed Fields | Impact on GTM | Stales GTM When Changed? |
|---|---|---|---|---|
| **Phase 3.1** | Market Study | `segments[]`, `competitors[]`, `pricingBenchmark` | Informs target segment and value proposition | Yes (`currentVersion != savedVersion`) |
| **Phase 3.2** | Business Model | `channels[]`, `customerRelationships[]`, `valuePropositions[]` | Informs channel portfolio and message angle | Yes (`currentVersion != savedVersion`) |
| **Phase 3.4** | Financial Forecast | `marketingBudget`, `forecastCac`, `arpu` | Sets forecast benchmark and planned spend | **Conditional**: Only when consumed budget/CAC/ARPU changes |
| **Phase 4.2** | Operational Roadmap | `tasks[]`, `timeToLaunchWeeks` | Aligns launch phasing with roadmap tasks | Yes (on schedule version change) |
| **Phase 4.3** | Needs Analysis | `needs[]` (Marketing, CRM, Legal) | Informs channel feasibility and delegation | Informational |
| **Phase 4.4** | Skills Plan | `resolutions[]` (Delegated capabilities) | Confirms delegation availability for channels | Informational |
| **Phase 4.5** | Aids & Grants | `confirmedBudget`, `potentialBudget` | Populates spendable cash vs excluded grants | **Conditional**: Only when confirmed grant changes |
| **Phase 4.6** | Pricing Strategy | `offers[]`, `confidence`, `primaryRevenueModel` | Mandatory gate; selected price and confidence | **Yes**: Price changes, offer edits, or confidence shifts |
| **Profile** | Professional Profile | `weeklyAvailability` | Reconciles founder effort via shared resolver | **Yes**: Availability changes immediately stale GTM |

---

## 2. Invariant Rules

1. **Zero Upstream Mutation**: Phase 4.7 NEVER mutates any Phase 3 session or Phase 4.1–4.6 plan.
2. **Conditional Forecast Invariance**: If a founder edits forecast tax assumptions or unrelated SG&A, GTM is NOT invalidated.
3. **Potential Support Invariance**: Potential or unawarded grants NEVER count as spendable launch cash.
