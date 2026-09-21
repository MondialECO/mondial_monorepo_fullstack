# MONDIAL BUSINESS CREATION (MBC)
## Legacy vs. Canonical API Route Audit Map

**Mode:** STRICT READ-ONLY AUDIT  
**Date:** September 21, 2026  

---

### 1. Legacy vs. Canonical Phase 4 Endpoints

| HTTP Method | Route | Controller | Frontend Caller(s) | Tests | Current Canonical Replacement | Classification | Status & Risk |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/creator/offer/readiness` | `CreatorPhase4Controller` | `api-creator-journey.ts` (`creatorJourneyApi.getPhase4Readiness`) | None | `GET /api/creator/phase4/construction-snapshot` | **DEPRECATE** | Legacy gate check; uses profile completeness. Does not conflict with Phase 4.8. |
| `GET` | `/api/creator/offer/benchmark` | `CreatorPhase4Controller` | `api-creator-journey.ts` (`marketBenchmark`) | `MarketBenchmarkTests.cs` | Internal resolver `MarketBenchmarkResolver` (can be used as reference service) | **DEPRECATE / REUSE** | Sector reference data; read-only. Zero data mutation. |
| `GET` | `/api/creator/offer/pricing-insights` | `CreatorPhase4Controller` | `api-creator-journey.ts` (`pricingInsights`), `Phase4Pricing.tsx` | None | `GET /api/creator/phase4/pricing` | **DEPRECATE** | Reads forecast ARPU assumption. Superseded by Phase 4.6 multi-stream economics. |
| `POST` | `/api/creator/offer/pricing` | `CreatorPhase4Controller` | `api-creator-journey.ts` (`setPricing`), `Phase4Pricing.tsx` | `MarketBenchmarkTests.cs` | `POST /api/creator/phase4/pricing/generate`, `PATCH /api/creator/phase4/pricing/{offerKey}` | **DEPRECATE (DUAL-WRITE RISK)** | **CRITICAL MUTATION:** Writes `PricingModel`, `Tiers`, `PricingForecastContext` into `CreatorIdea.Phase4Data`. Disjoint from `CreatorJourney.Phase4Data.PricingStrategy`. Users visiting `/offer-pricing` mutate legacy tiers, not Phase 4.6 strategy. |
| `POST` | `/api/creator/offer/resource-calculator` | `CreatorPhase4Controller` | `api-creator-journey.ts` (`resourceCalculator`), `Phase4Resource.tsx` | `MarketBenchmarkTests.cs` | `POST /api/creator/phase4/needs/generate` (Phase 4.3 Needs Engine) | **DEPRECATE (DUAL-WRITE RISK)** | Writes `ResourceCalculation` into `CreatorIdea.Phase4Data`. Disjoint from `CreatorJourney.Phase4Data.NeedsAnalysis`. |
| `POST` | `/api/creator/offer/gtm-setup` | `CreatorPhase4Controller` | `api-creator-journey.ts` (`gtmSetup`), `Phase4Gtm.tsx` | `MarketBenchmarkTests.cs` | `POST /api/creator/phase4/gtm/generate` (Phase 4.7 GTM Engine) | **DEPRECATE (DUAL-WRITE RISK)** | Writes `GtmSetup` into `CreatorIdea.Phase4Data`. Disjoint from `CreatorJourney.Phase4Data.GtmStrategy`. |
| `PATCH` | `/api/creator/offer/complete` | `CreatorPhase4Controller` | `api-creator-journey.ts` (`completeOffer`), `Phase4Complete.tsx` | `MarketBenchmarkTests.cs` | Phase 4.9 Construction Readiness (future) | **DEPRECATE** | Validates presence of legacy pricing/resource/gtm fields. |

---

### 2. Phase 5 & Phase 6 Endpoints (Canonical Lifecycle Operations)

| HTTP Method | Route | Controller | Frontend Caller(s) | Tests | Classification | Notes & Canonical Ownership |
|---|---|---|---|---|---|---|
| `POST` | `/api/creator/ip-valuation` | `CreatorPhase5Controller` | `api-creator-journey.ts` (`ipValuation`), `CrossroadsPathA.tsx` | Deals & Escrow tests | **KEEP** | Computes planning IP valuation for Full Buyout / Marketplace listing using formula based on launch resources and maturity signals. |
| `POST` | `/api/creator/marketplace/publish` | `CreatorPhase5Controller` | `api-creator-journey.ts` (`publishMarketplace`), `CrossroadsPathA.tsx` | Marketplace tests | **KEEP** | Publishes project to live marketplace with Full Buyout asking price or Co-founder equity mode. Essential marketplace functionality. |
| `POST` | `/api/creator/marketplace/status` | `CreatorPhase5Controller` | `api-creator-journey.ts` (`setMarketplaceStatus`), `CrossroadsPathA.tsx` | Marketplace tests | **KEEP** | Sets listing status (`available` / `paused`). |
| `GET` | `/api/creator/marketplace/interests` | `CreatorPhase5Controller` | `api-creator-journey.ts` (`getInterests`), `CrossroadsPathA.tsx` | Marketplace tests | **KEEP** | Reads inbound entrepreneur purchase/equity inquiries. |
| `POST` | `/api/creator/marketplace/interests/{id}/accept` | `CreatorPhase5Controller` | `api-creator-journey.ts`, `CrossroadsPathA.tsx` | Marketplace tests | **KEEP** | Accepts inbound offer, initiates Deal state machine. |
| `POST` | `/api/creator/marketplace/interests/{id}/decline` | `CreatorPhase5Controller` | `api-creator-journey.ts`, `CrossroadsPathA.tsx` | Marketplace tests | **KEEP** | Declines inbound inquiry. |
| `POST` | `/api/creator/company-formation` | `CreatorPhase5Controller` | `api-creator-journey.ts`, `CrossroadsPathB.tsx` | Journey tests | **KEEP** | Drafts legal company formation structure (`SAS`, `SAS-U`, `SARL`) and founder equity split. |
| `POST` | `/api/creator/seed-funding` | `CreatorPhase5Controller` | `api-creator-journey.ts`, `CrossroadsPathB.tsx` | Journey tests | **KEEP** | Records seed capital ask, use of funds, and calculates projected runway. |
| `GET` | `/api/creator/readiness` | `CreatorPhase6Controller` | `api-creator-journey.ts` (`creatorReadiness`), `investors/page.tsx` | Journey tests | **KEEP** | Evaluates Path A / Path B / Co-founded requirements for Level Up eligibility. |
| `GET` | `/api/creator/investors` | `CreatorPhase6Controller` | `api-creator-journey.ts` (`getInvestors`), `investors/page.tsx` | Matching tests | **KEEP** | Matches verified investors based on venture sector and thesis. |
| `POST` | `/api/creator/level-up` | `CreatorPhase6Controller` | `api-creator-journey.ts` (`levelUp`), `investors/page.tsx` | Transaction tests | **KEEP** | **CRITICAL ATOMIC OPERATION:** Transfers Creator project into Entrepreneur workspace (`Companies` collection), initializes cap table, assigns `Entrepreneur` role, and maintains CreatorJourney continuity. |

---

### 3. Duplicate Route Detection Summary

- **Duplicate Pricing Route:**
  - Legacy: `POST /api/creator/offer/pricing` (Saves 3–5 simple tiers on `Phase4Data.Tiers`)
  - Canonical: `POST /api/creator/phase4/pricing/generate` & `PATCH /api/creator/phase4/pricing/{offerKey}` (Phase 4.6 Pricing Policy Engine, contribution margins, mathematical price floors, empirical experiments, persisted on `Phase4Data.PricingStrategy`)
  - *Caller isolation:* Legacy route is called ONLY from `offer-pricing/page.tsx`. Canonical pages (`/dashboard/creator/phase-4/pricing`) call exclusively canonical `/api/creator/phase4/pricing` routes.
- **Duplicate GTM Route:**
  - Legacy: `POST /api/creator/offer/gtm-setup` (Saves channel split % and 12 static weekly tasks on `Phase4Data.GtmSetup`)
  - Canonical: `POST /api/creator/phase4/gtm/generate` & `PATCH /api/creator/phase4/gtm/channels/{channelKey}` (Phase 4.7 deterministic reason-coded channels, shared capacity resolver, empirical validation experiments on `Phase4Data.GtmStrategy`)
  - *Caller isolation:* Completely isolated. No cross-calling.
- **Duplicate Resource / Needs Route:**
  - Legacy: `POST /api/creator/offer/resource-calculator` (Saves Developer/Hosting/Legal breakdown on `Phase4Data.ResourceCalculation`)
  - Canonical: `POST /api/creator/phase4/needs/generate` (Phase 4.3 Needs Analysis engine evaluating 6 resource categories with HumainX capability matching on `Phase4Data.NeedsAnalysis`)
  - *Caller isolation:* Completely isolated.
