# MONDIAL BUSINESS CREATION (MBC)
## Legacy Data Compatibility & BSON Model Audit

**Audit Date:** September 21, 2026  
**Mode:** STRICT READ-ONLY AUDIT  
**Scope:** MongoDB collections `CreatorJourneys`, `CreatorIdeas`, `EntrepreneurProfiles`, and embedded BSON structures in `CreatorPhase4Data`.

---

### 1. Executive Summary

This document evaluates the database schema compatibility of historical Creator Phase 4 fields versus canonical Phase 4.1–4.9 Construction Engine entities. 

The primary finding is that **legacy Phase 4 fields and canonical Phase 4.1–4.9 fields currently coexist as sibling properties on the same embedded class: `CreatorPhase4Data`**. 

Because MongoDB update operations in `CreatorJourneyService.cs` use path-scoped `$set` updates (e.g. `$set: { "Phase4Data.PricingStrategy": ... }` and `$set: { "Phase4Data.PricingModel": ... }`), mutations do not physically overwrite sibling BSON keys. However, **data divergence** occurs if both legacy endpoints and canonical endpoints are called for the same idea. Furthermore, historical documents in production MongoDB contain legacy BSON keys that must remain deserializable.

---

### 2. Comprehensive BSON Property Inventory

| BSON Field Path | C# Type | Defined In | Written By | Read By | Current Status | Recommended Compatibility State |
|---|---|---|---|---|---|---|
| `Phase4Data.PricingModel` | `string` | `CreatorPhase4Data` | `CreatorPhase4Controller.SetPricing` via `SetPhase4PricingAsync` | `offer-pricing/page.tsx`, `MarketBenchmarkTests.cs`, Level Up snapshot | Superseded by `PricingStrategy.PricingModel` | **DeprecatedCompatible** |
| `Phase4Data.Tiers` | `List<CreatorPricingTier>` | `CreatorPhase4Data` | `CreatorPhase4Controller.SetPricing` via `SetPhase4PricingAsync` | `offer-pricing/page.tsx`, `Phase4Pricing.tsx`, `MarketBenchmarkTests.cs` | Superseded by `PricingStrategy.Tiers` | **DeprecatedCompatible** |
| `Phase4Data.PricingForecastContext` | `CreatorPricingForecastContext?` | `CreatorPhase4Data` | `CreatorPhase4Controller.SetPricing` via `SetPhase4PricingAsync` | `offer-pricing/page.tsx` | Superseded by `PricingStrategy.BaselineArpuContext` | **DeprecatedCompatible** |
| `Phase4Data.ResourceCalculation` | `CreatorResourceCalculation` | `CreatorPhase4Data` | `CreatorPhase4Controller.SetResource` via `SetPhase4ResourceAsync` | `offer-pricing/page.tsx`, `Phase4Resource.tsx`, `MarketBenchmarkTests.cs` | Superseded by `Phase4.NeedsAnalysis` | **DeprecatedCompatible** |
| `Phase4Data.GtmSetup` | `CreatorGtmSetup` | `CreatorPhase4Data` | `CreatorPhase4Controller.SetGtm` via `SetPhase4GtmAsync` | `offer-pricing/page.tsx`, `Phase4Gtm.tsx`, `MarketBenchmarkTests.cs` | Superseded by `Phase4.GtmStrategy` | **DeprecatedCompatible** |
| `Phase4Data.ConstructionSnapshot` | `Phase4.ConstructionSnapshot?` | `CreatorPhase4Data` | `CreatorPhase4ConstructionController` (Phase 4.1) | Unified Construction Hub (`/phase-4`) | Canonical Phase 4.1 | **Active** |
| `Phase4Data.Roadmap` | `Phase4.OperationalRoadmap?` | `CreatorPhase4Data` | `CreatorPhase4ConstructionController` (Phase 4.2) | Unified Construction Hub (`/phase-4`) | Canonical Phase 4.2 | **Active** |
| `Phase4Data.NeedsAnalysis` | `Phase4.NeedsAnalysis?` | `CreatorPhase4Data` | `NeedsAnalysisService` (Phase 4.3) | Canonical Needs Hub (`/phase-4/needs`) | Canonical Phase 4.3 | **Active** |
| `Phase4Data.SkillsPlan` | `Phase4.SkillsPlan?` | `CreatorPhase4Data` | `SkillsPlanService` (Phase 4.4) | Canonical Skills Hub (`/phase-4/skills`) | Canonical Phase 4.4 | **Active** |
| `Phase4Data.SupportPlan` | `Phase4.SupportPlan?` | `CreatorPhase4Data` | `SupportPlanService` (Phase 4.5) | Canonical Support Hub (`/phase-4/support`) | Canonical Phase 4.5 | **Active** |
| `Phase4Data.PricingStrategy` | `Phase4.PricingStrategy?` | `CreatorPhase4Data` | `PricingStrategyService` (Phase 4.6) | Canonical Pricing Hub (`/phase-4/pricing`) | Canonical Phase 4.6 | **Active** |
| `Phase4Data.GtmStrategy` | `Phase4.GtmStrategy?` | `CreatorPhase4Data` | `GtmStrategyService` (Phase 4.7) | Canonical GTM Hub (`/phase-4/gtm`) | Canonical Phase 4.7 | **Active** |
| `Phase4Data.LaunchAssets` *(Reserved)* | `Phase4.LaunchAssets?` | `CreatorPhase4Data` | Target for Phase 4.8 | Target for `/phase-4/launch-assets` | Canonical Phase 4.8 (Pending) | **Active** (Pending Implementation) |
| `Phase4Data.ConstructionReadiness` *(Reserved)* | `Phase4.ConstructionReadiness?` | `CreatorPhase4Data` | Target for Phase 4.9 | Target for `/phase-4/readiness` | Canonical Phase 4.9 (Pending) | **Active** (Pending Implementation) |
| `Phase4Data.SourceVersions` | `Phase4.Phase4SourceVersions?` | `CreatorPhase4Data` | Multi-phase synchronization services | Snapshot & Strategy change detection | Canonical Source Hash Tracking | **Active** |
| `OutputSnapshots.PricingVersions` | `List<BsonDocument>` | `CreatorOutputSnapshots` | `SetPhase4PricingAsync` | Version history UI / Audit trail | Legacy pricing version append | **ReadOnlyLegacy** |
| `OutputSnapshots.ResourcePlanVersions` | `List<BsonDocument>` | `CreatorOutputSnapshots` | `SetPhase4ResourceAsync` | Version history UI / Audit trail | Legacy resource version append | **ReadOnlyLegacy** |
| `OutputSnapshots.GtmPlanVersions` | `List<BsonDocument>` | `CreatorOutputSnapshots` | `SetPhase4GtmAsync` | Version history UI / Audit trail | Legacy GTM version append | **ReadOnlyLegacy** |
| `EntrepreneurProfileRecord.OfferSetup` | `CreatorPhase4Data` | `EntrepreneurProfileRecord` | `CreatorPhase6Controller.LevelUpAsync` | Entrepreneur Dashboard / Company Profile | Snapshot of Creator Phase 4 data upon Level Up | **Active / Mixed Generation** |

---

### 3. Detailed Field Lifecycle States

#### 1. `DeprecatedCompatible` Fields
- **Fields:** `Phase4Data.PricingModel`, `Phase4Data.Tiers`, `Phase4Data.PricingForecastContext`, `Phase4Data.ResourceCalculation`, `Phase4Data.GtmSetup`.
- **Reason:** Existing documents in MongoDB `CreatorJourneys` and `CreatorIdeas` contain these BSON fields. If removed from the C# `CreatorPhase4Data` class without `[BsonIgnoreExtraElements]`, the C# MongoDB driver will throw deserialization exceptions (`System.FormatException: Element 'pricingModel' does not match any field or property of class CreatorPhase4Data`).
- **Policy:** 
  1. MUST retain properties in `CreatorPhase4Data.cs`.
  2. Decorate with `[Obsolete("Superseded by canonical Phase 4.3 NeedsAnalysis, 4.6 PricingStrategy, and 4.7 GtmStrategy. Kept for MongoDB backward deserialization compatibility.", false)]`.
  3. Ensure `[BsonIgnoreExtraElements]` is present on `CreatorPhase4Data` to safely handle future deprecation steps.

#### 2. `ReadOnlyLegacy` Fields
- **Fields:** `OutputSnapshots.PricingVersions`, `OutputSnapshots.ResourcePlanVersions`, `OutputSnapshots.GtmPlanVersions`.
- **Reason:** Historical append arrays in `CreatorOutputSnapshots`. While canonical Phase 4.3–4.7 manage revision tracking via `Revision` integer fields and deterministic hashing (`SourceVersions`), existing snapshot arrays contain legitimate historical record timestamps.
- **Policy:** Stop appending new versions once legacy endpoints are retired; maintain read-only access for idea history displays.

#### 3. `Active / Mixed Generation` Fields
- **Field:** `EntrepreneurProfileRecord.OfferSetup`.
- **Analysis:** During Phase 6 Level Up (`CreatorPhase6Controller.LevelUpAsync`, lines 500 & 508), `journey.Phase4Data` is assigned directly to `existingProfile.OfferSetup`.
- **Consequence:** For accounts leveled up before Phase 4.6/4.7, `OfferSetup` contains legacy `Tiers`, `ResourceCalculation`, and `GtmSetup`. For accounts leveled up after Phase 4.6/4.7, `OfferSetup` contains `PricingStrategy`, `GtmStrategy`, etc.
- **Invariant:** `OfferSetup` in `EntrepreneurProfileRecord` must remain of type `CreatorPhase4Data` to preserve historical integrity across both generations of leveled-up ventures.

---

### 4. Dual-Write and Data Divergence Risks

#### The Divergence Scenario
1. A Creator begins Phase 4 in the legacy wizard at `/dashboard/creator/offer-pricing`.
2. They save a 3-tier pricing setup (`Phase4Pricing.tsx`), calling `POST /api/creator/offer/pricing`.
3. `SetPhase4PricingAsync` writes `Phase4Data.PricingModel` and `Phase4Data.Tiers` to `CreatorIdea.Phase4Data`.
4. The Creator subsequently navigates to `/dashboard/creator/phase-4/pricing` (the canonical Phase 4.6 engine).
5. Canonical `PricingStrategyService.cs` derives and saves `Phase4Data.PricingStrategy`.
6. At this point, `CreatorIdea.Phase4Data` contains **divergent pricing**:
   - `Phase4Data.Tiers` contains the legacy manually input tiers.
   - `Phase4Data.PricingStrategy.Tiers` contains the policy-derived canonical tiers.
7. Any system component reading `Phase4Data.Tiers` will display different prices and features from components reading `Phase4Data.PricingStrategy.Tiers`.

#### Impact on Phase 4.8 (Launch Assets Engine)
- **Phase 4.8 Requirement:** Launch assets (landing page copy, sales email templates, offer sheets) must pull canonical pricing and positioning.
- **Risk Mitigation:** Phase 4.8 Launch Assets Engine **MUST ONLY read canonical `Phase4Data.PricingStrategy` and `Phase4Data.GtmStrategy`**. It must never read legacy `Phase4Data.Tiers` or `Phase4Data.GtmSetup`.

---

### 5. Safe Removal Conditions

Legacy data fields (`PricingModel`, `Tiers`, `PricingForecastContext`, `ResourceCalculation`, `GtmSetup`) can be transitioned to `SafeToRemove` **ONLY IF ALL of the following criteria are met in the future**:

1. **Route Retirement:** The legacy UI route `/dashboard/creator/offer-pricing` is permanently replaced by a redirect to `/dashboard/creator/phase-4`.
2. **API Retirement:** The endpoints `POST /api/creator/offer/pricing`, `POST /api/creator/offer/resource`, `POST /api/creator/offer/gtm` are deactivated.
3. **Data Backfill Migration Script:** An asynchronous migration script scans all active `CreatorIdea` and `CreatorJourney` documents:
   - Where canonical `PricingStrategy` is null but legacy `Tiers` exist, migrates `Tiers` into a canonical `PricingStrategy` structure.
   - Where canonical `NeedsAnalysis` is null but legacy `ResourceCalculation` exists, maps team/SaaS items into `NeedsAnalysis.Items`.
4. **Class Decorator:** `CreatorPhase4Data` is decorated with `[BsonIgnoreExtraElements]` to prevent deserialization crashes when unmapped MongoDB keys are encountered.
5. **Zero Test Reliance:** Unit and integration test suites are updated to remove expectations of legacy BSON field presence.

---

### 6. Summary Status Table

| Field Group | Compatibility Risk | Immediate Action | Future Action |
|---|---|---|---|
| `Phase4Data.Tiers` & `PricingModel` | Low (Isolated BSON path) | Retain; mark `[Obsolete]` | Backfill to `PricingStrategy`; deprecate |
| `Phase4Data.ResourceCalculation` | Low (Isolated BSON path) | Retain; mark `[Obsolete]` | Backfill to `NeedsAnalysis`; deprecate |
| `Phase4Data.GtmSetup` | Low (Isolated BSON path) | Retain; mark `[Obsolete]` | Backfill to `GtmStrategy`; deprecate |
| `EntrepreneurProfileRecord.OfferSetup` | High (Data continuity) | Retain unchanged | None (Preserve cross-generation schema) |
