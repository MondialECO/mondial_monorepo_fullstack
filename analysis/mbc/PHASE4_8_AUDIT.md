# MBC Creator Phase 4.8 — Launch Assets Implementation & Audit Report

**Target Route**: `/dashboard/creator/phase-4/launch-assets?ideaId=...` (Known Alias: `/dashboard/creator/phase-4/assets`)  
**Repository**: `MondialECO/mondial_monorepo_fullstack`  
**Git Source Revision**: `9a10d8cd65c7d22bdc1bdaeda6a314a7d0e345fa` (Branch: `dev-hafiz`)  
**Approved Figma Reference**: Node `57221:12861` (`Launch Assets · Step 4.8 Workspace`)  
**Figma URL**: `https://www.figma.com/design/yLDPLB9hIAIqfYY9uHuJom/Mondial-Dashboard-EDU?node-id=57221-12861&m=dev`  
**Verdict**: **VERIFIED WITHIN TESTED SCOPE** (Backend Moq, Frontend jsdom, and Static Type Verification)  
**Date**: September 2026  

---

## 1. Executive Summary & Remediation

In this milestone, Phase 4.8 Launch Assets was audited, remediated, and verified against the approved product plan and Figma specification (Node `57221:12861`).

### Confirmed Defects & Fixes:

1. **Founder Offer Precedence & Resolution Policy**:
   - *Previous Defect*: `ResolvePricingExclusion` checked `LaunchRecommendation.RecommendedOffers` before founder-customized offers, allowing a system recommendation to override an explicit founder-customized offer. In addition, multiple customized offers were silently collapsed using heuristics instead of exposing a needs-review state.
   - *Clarification on Terminology*: A single `FounderEdited` or `FounderPrice` candidate is a **resolution policy** prioritizing customized offers when uncontested. It is distinguishable from an explicit founder primary-offer selection action.
   - *Fix*:
     1. **Resolution Policy Priority**: Checks `pricing.Offers.Where(o => o.FounderEdited || o.FounderPrice.HasValue)`. If exactly one founder-customized candidate exists, it is selected with absolute precedence over any system recommendation.
     2. **Multiple Customized Candidates (Needs-Review State)**: If several candidate offers have been customized by the founder without a single authoritative choice, an `Unconfirmed` needs-review state is returned (`Reason = "Multiple offers have been customized. Confirm a single primary offer before adding pricing to the website."`), preventing heuristics from fabricating founder confirmation.
     3. **Distinguishable Fallback Recommendation**: If no founder customization exists, `LaunchRecommendation.RecommendedOffers` or candidate offers are identified, but their `PriceStatus` remains `Unconfirmed` (`Reason = "Recommended offer '...' has not been confirmed by the founder yet. Review and confirm offer details..."`) so fallback recommendations are never conflated with confirmed founder choices.
     4. **Regression Verified**: When system recommends paid Offer A (€49/mo) and founder-customized candidate is free Offer B (€0/mo), Launch Assets resolves Offer B with `SelectedOfferId = "offer-b-free"`, `ChosenPrice = 0m`, `PriceStatus = "ConfirmedZero"`, `Currency = "€"`, and `BillingPeriod = "monthly"`.

2. **Authoritative Section Toggle Precedence & Pricing Inclusion Rules**:
   - *Conflicting-Flag Defect*: Previously combined signals with `(section.IsIncluded == true) || (!assets.PricingExclusion.Excluded)`, allowing a stale legacy `Excluded=false` flag to override an explicit section exclusion `IsIncluded=false`.
   - *Resolution*:
     - **Authoritative Persisted Field**: `Sections["pricing"].IsIncluded` is canonical whenever the section exists in the `Sections` list.
     - **Legacy Fallback**: `PricingExclusion.Excluded == false` is consulted **only** when the pricing section is completely absent from the `Sections` list.
     - **Synchronization on Write**: When `UpdateLaunchAssetsAsync` updates `Sections`, `PricingExclusion.Excluded` is synchronized (`existing.PricingExclusion.Excluded = !pricingSec.IsIncluded`) without letting legacy values override explicit founder choices.
     - **Unified Rendering Invariant**: Editor, preview, HTML export, and version snapshots all require BOTH:
       1. `pricingSectionExplicitlyIncluded` (`pricingSection != null ? pricingSection.IsIncluded : assets.PricingExclusion?.Excluded == false`)
       2. `pricingValidAndConfirmed` (`PriceStatus == "ConfirmedPositive"` or `PriceStatus == "ConfirmedZero"`, with `ChosenPrice >= 0`).
   - *Coverage Verified*:
     - **`IsIncluded=false`, `Excluded=false`, confirmed positive**: Pricing absent from export (`DoesNotContain("id=\"pricing-section\"")`, `DoesNotContain("Transparent Pricing")`).
     - **`IsIncluded=false`, `Excluded=false`, confirmed zero**: Pricing absent from export (`DoesNotContain("id=\"pricing-section\"")`, `DoesNotContain("Free")`).
     - **`IsIncluded=true`, `Excluded=true`, valid confirmed price**: Canonical section decision wins (`Contains("id=\"pricing-section\"")`, `Contains("Transparent Pricing")`).
     - **Missing section**: Consults legacy fallback (`Excluded=false` renders; `Excluded=true` excludes).
     - **Unconfirmed or invalid price**: Pricing absent regardless of section inclusion (`DoesNotContain("id=\"pricing-section\"")`).

3. **Identifiable Version Behavior & History Snapshots**:
   - *Previous Defect*: Generic `Status = "Selected"` without version identification or snapshot history; creating a new version immediately overwrote active version state.
   - *Fix*: Added `SelectedVersion` (`int`) and `VersionHistory` (`List<LaunchAssetsPlanSnapshot>`) to `LaunchAssetsPlan`.
   - *Verified Sequence*:
     1. Version 1 is generated and selected (`Version = 1`, `SelectedVersion = 1`, `Status = "Selected"`).
     2. New version 2 is created (`Version = 2`, `SelectedVersion = 1`, `Status = "Draft"`).
     3. Version 2 is modified and saved (`Headline = "Version 2 Headline"`).
     4. Version 1 remains intact in `VersionHistory` with original headline and remains selected (`SelectedVersion = 1`).
     5. Standalone download and export support versioned snapshot retrieval (`GetSourceCodeBundleAsync(userId, ideaId, versionNumber)`).
     6. Version 2 becomes selected only when explicitly confirmed via `SelectVersionAsync(userId, ideaId, 2)`.

4. **Restored Step 4.9 Product Meaning & Navigation Accuracy**:
   - *Previous Inaccuracy*: Documentation previously mislabeled Step 4.9 as "final global launch certification".
   - *Correction*: Step 4.9 is canonically **Construction Readiness** (assessing the Creator's readiness to build and launch, remaining work, and readiness checklist). Step 4.9 handoff remains **Pending** until implemented.
   - *Navigation*: The footer Continue button navigates to `/dashboard/creator/phase-4?ideaId={ideaId}`, which renders Step 4.1 (Phase 4 Construction Overview Hub). Copy clearly identifies Step 4.9 handoff as pending while directing the founder to the Construction Hub.

5. **Preview Rendering & Security Mechanism**:
   - *Clarification*: The editor preview is an in-memory React component layout with inert CTA elements (`disabled` button / `return false;`), not an isolated iframe security sandbox.
   - *Export Security*: The generated standalone HTML bundle applies full `WebUtility.HtmlEncode` escaping on all user-supplied strings and dynamic section filtering based on `IsIncluded`.

---

## 2. Source Precedence & Generation Lineage

```
Upstream Source Lineage:
├── Brand Kit (Phase 2 & 3)
│   ├── BusinessName & Concept ────────────► Brand Identity & Hero Headline
│   ├── Color Palette (Hex Roles) ─────────► Preview Styles & CSS Variables
│   ├── Typography (Display/Text Families) ─► Google Fonts Link & Styles
│   └── Logos (Mark / Lockup SVGs) ────────► Navigation Brand Mark
├── Pricing Strategy (Phase 4.6)
│   ├── Resolution Policy Priority ────────► Precedence (Single Founder Edited Offer Candidate)
│   ├── Conflicted Founder Candidates ─────► Unconfirmed Needs-Review State
│   ├── System Recommendation Fallback ────► Distinguishable Unconfirmed Recommendation
│   └── Multi-Offer Identity ──────────────► SelectedOfferId & SelectedOfferName
├── Go-To-Market Strategy (Phase 4.7)
│   ├── CustomCustomerGroup Override ──────► Launch Audience Context (Problem/CTA)
│   └── Strategic PrimaryPromise ──────────► Positioning (Isolated from Outreach)
└── Project Definition (Phase 1 & 3)
    ├── Problem & Solution Statements ─────► Problem Card & Planned Solutions
    └── Target User / Target Market ───────► Contextual Framing
```

---

## 3. Files Modified & Added

| File | Change Summary |
| :--- | :--- |
| [`backend/Models/DatabaseModels/Phase4/LaunchAssetModels.cs`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Models/DatabaseModels/Phase4/LaunchAssetModels.cs) | Added `LaunchAssetsPlanSnapshot`, `SelectedVersion`, `VersionHistory`, and `SelectVersionRequest`. Refined `LaunchPricingExclusion` with `ChosenPrice` (`decimal?`), `PriceStatus`, `SelectedOfferId`, and `SelectedOfferName`. |
| [`backend/Services/Interface/ILaunchAssetsService.cs`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Services/Interface/ILaunchAssetsService.cs) | Updated `SelectVersionAsync` and `GetSourceCodeBundleAsync` signatures to support optional version numbers. |
| [`backend/Services/Implementations/LaunchAssetsService.cs`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Services/Implementations/LaunchAssetsService.cs) | Implemented founder-candidate resolution policy in `ResolvePricingExclusion`, multi-offer needs-review states, canonical `Sections["pricing"].IsIncluded` precedence, legacy fallback, write-path compatibility synchronization, version history snapshots, and versioned HTML bundling. |
| [`backend/Controllers/CreatorPhase4ConstructionController.cs`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Controllers/CreatorPhase4ConstructionController.cs) | Added `SelectVersionRequest` handling and `version` query parameter support on `POST /assets/select-version` and `GET /assets/source`. |
| [`backend/tests/WebApp.Tests/Unit/CreatorPhase4LaunchAssetsTests.cs`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/tests/WebApp.Tests/Unit/CreatorPhase4LaunchAssetsTests.cs) | **18 unit tests** covering founder precedence, unconfirmed recommendation distinction, conflicting flags (`IsIncluded=false, Excluded=false`, `IsIncluded=true, Excluded=true`), legacy fallback when section absent, unconfirmed/invalid price exclusion, compatibility synchronization on update, version snapshot preservation across edits, and HTML export. |
| [`src/types/creator/launch-assets.ts`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/types/creator/launch-assets.ts) | Added TypeScript interfaces matching backend models (`LaunchAssetsPlanSnapshot`, `SelectedVersion`, `VersionHistory`, `PriceStatus`). |
| [`src/lib/api-creator-launch-assets.ts`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/lib/api-creator-launch-assets.ts) | Updated `selectVersion` and `getSourceCode` with version number support. |
| [`src/components/creator/phase4/LaunchAssetsView.tsx`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/components/creator/phase4/LaunchAssetsView.tsx) | Implemented canonical `isPricingExplicitlyIncluded` / `isPricingRendered`, preview pricing card, synchronized editor badge (`On site` vs `Not on site`), and Step 4.1 Hub navigation. |
| [`src/__tests__/creator/phase4-launch-assets.test.tsx`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/__tests__/creator/phase4-launch-assets.test.tsx) | **10 tests** covering compact summary, version creation, pricing badges, section editing, section toggles, and Step 4.1 navigation. |

---

## 4. Verification Evidence & Environment Breakdown

### 4.1 Backend Fresh Build & Unit Test Verification
- **Source Revision**: `9a10d8cd65c7d22bdc1bdaeda6a314a7d0e345fa` (Branch: `dev-hafiz`)
- **Build Command**: `dotnet build backend/tests/WebApp.Tests/WebApp.Tests.csproj -c Release -o backend/tests/WebApp.Tests/bin/ReleaseOut`
  - *Exit Code*: **0**
  - *Result*: **0 Errors**, 1673 Warnings (framework/analyzer warnings in existing unrelated test suites).
- **Targeted Test Command**: `dotnet vstest backend/tests/WebApp.Tests/bin/ReleaseOut/WebApp.Tests.dll --TestCaseFilter:"FullyQualifiedName~CreatorPhase4LaunchAssetsTests"`
  - *Exit Code*: **0**
  - *Result*: **18 / 18 PASS** (Duration: 215 ms).
- **Phase 4 Full Test Command**: `dotnet vstest backend/tests/WebApp.Tests/bin/ReleaseOut/WebApp.Tests.dll --TestCaseFilter:"FullyQualifiedName~CreatorPhase4"`
  - *Exit Code*: **0**
  - *Result*: **215 / 215 PASS** (Duration: 586 ms across all Phase 4 modules).

### 4.2 Frontend DOM & jsdom Verification
- **Targeted Test Command**: `cmd /c npx vitest run src/__tests__/creator/phase4-launch-assets.test.tsx`
  - *Exit Code*: **0**
  - *Result*: **10 / 10 PASS** (Duration: 2.28s).
- **Creator Full Test Command**: `cmd /c npx vitest run src/__tests__/creator/`
  - *Exit Code*: **0**
  - *Result*: **165 / 165 PASS** across all 13 Creator test files.

### 4.3 Static Type & Compiler Verification
- **Command**: `cmd /c npx tsc --noEmit`
  - *Exit Code*: **0**
  - *Result*: **0 Errors** (Clean TypeScript compilation).

### 4.4 Out-of-Scope / Deferred Verifications
- **Step 4.9 Construction Readiness Handoff**: **Pending** (remains pending until Step 4.9 is implemented).
- **Live Database & HTTP Concurrency Verification**: **Not verified** in live multi-instance deployment; verified via unit tests with Moq-based `ICreatorJourneyService` and optimistic locking checks (`CreatorIdeaVersion`).
- **Rendered Live Browser Verification**: **Not verified** in multi-browser live session; verified in simulated jsdom/Vite environment.

---

## 5. Scoped Verdicts

| Scope Area | Status | Evidence |
| :--- | :--- | :--- |
| **Founder Candidate Resolution Policy** | **Verified within tested scope** | Uncontested founder-edited candidate overrides system recommendation; conflicting candidates expose needs-review state. |
| **Authoritative Section Inclusion Precedence** | **Verified within tested scope** | `Sections["pricing"].IsIncluded` is canonical when present; legacy `Excluded` flag is fallback only when section is absent. |
| **Compatibility Field Synchronization** | **Verified within tested scope** | `UpdateLaunchAssetsAsync` writes synchronize `PricingExclusion.Excluded` without overriding canonical section decisions. |
| **Confirmed Free Support** | **Verified within tested scope** | `ConfirmedZero` accurately renders `Free` in exported HTML and displays `Confirmed Free · Not on site` / `On site` badge. |
| **Version History & Selection** | **Verified within tested scope** | Version snapshots preserved across sequential edits; `SelectedVersion` explicitly tracked and exported. |
| **Step 4.9 Meaning & Routing** | **Verified within tested scope** | Accurately describes Construction Readiness and routes interim continuation to Step 4.1 Hub. |
| **HTML Export & Sanitization** | **Verified within tested scope** | Output HTML is safely encoded against XSS and includes configured sections with `id="pricing-section"`. |
| **Design Token Alignment** | **Verified within tested scope** | Uses Tailwind tokens and styling consistent with `mondial-ui-workflow`. |


