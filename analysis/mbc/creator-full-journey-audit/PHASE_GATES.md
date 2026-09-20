# MBC Creator Journey — Phase Gates & Progression Audit

**Audit Date**: 2026-09-20  
**Audit Scope**: Transitions 1→2, 2→3, 3→4, 4→5, 5→6 at HEAD  
**Status**: CONFIRMED at HEAD  

---

## 1. Step Progression Model: Derived vs Stored

At HEAD, step progression across all six phases is **purely derived dynamically from persisted artifact and session state on every read**. It is **not** driven by an authoritative stored numeric step counter.

- **Primary Source of Truth**: `backend/Services/Implementations/CreatorJourneyService.cs:ComputePhaseStatusAsync(string userId, CreatorJourney journey, CreatorIdea idea)`
- The fields `journey.CurrentPhase` and `journey.CurrentStep` exist in MongoDB collection `CreatorJourneys`, but on every invocation of `GET /api/creator/journey` (`backend/Controllers/CreatorJourneyController.cs:41-47`), `ComputePhaseStatusAsync` overwrites the returned step numbers and completion statuses in-memory based on the presence of actual database documents.

### Per-Phase Step Derivation Logic

| Phase | Step Derivation Implementation at HEAD |
| :--- | :--- |
| **Phase 1** | Evaluates `user.Onboarding.Phase`. If `>= 1`, Phase 1 is marked `completed`. No sub-steps stored. |
| **Phase 2** | Step derived dynamically from `journey.Phase2` fields:<br>• `clarifier_started` / `clarifier_completed` / `clarity_score > 0` → Step 6 / Step 7<br>• `concept_name_set` → Step 8<br>• `branding_mode` / `branding_complete` / `branding_skipped` → Step 9 / Step 12 |
| **Phase 3** | Step derived dynamically from 6 child collections/sessions:<br>• Step 1: `market_study` session status<br>• Step 2: `business_model` session status<br>• Step 3: `forecast` artifact presence<br>• Step 4: `legal_compliance` evaluation presence<br>• Step 5: `formation_generator` selection presence<br>• Step 6: `business_plan` artifact presence<br>• Step 7: Complete (`newJourneyComplete` or legacy bypass) |
| **Phase 4** | Step derived dynamically from `journey.Phase4` flags:<br>• Step 1: Pricing (`PricingComplete`)<br>• Step 2: Resource Calculator (`ResourceCalculatorComplete`)<br>• Step 3: Web & GTM Setup (`GtmSetupComplete`)<br>• Step 4: Complete (`hasPricing && hasResource && hasGtm`) |
| **Phase 5** | Step derived dynamically from `journey.Phase5` state:<br>• Path chosen: `path_a` (IP Marketplace) or `path_b` (Build & Seed)<br>• Path A complete: `MarketplaceListingId != null` and listing active<br>• Path B complete: `CompanyFormation` or `SeedFunding` recorded |
| **Phase 6** | Derived from `journey.Phase6.LevelUpTriggered` and `user.Roles.Contains("Entrepreneur")`.<br>• If Path A exit (Full Buyout / `SOLD`), Phase 6 is permanently locked (`status = "locked"`, `currentStep = 0`). |

---

## 2. Server-Side Gate Conditions by Transition

### Phase 1 → Phase 2 Gate
- **Enforcing Endpoint**: `GET /api/creator/journey` (`CreatorJourneyService.cs:274-279`)
- **Required Conditions**:
  - `(user?.Onboarding?.Phase ?? 0) >= 1`
- **Failure Status Code**: HTTP 200 returned with `phase2.Status = "locked"`. Direct attempt to mutate Phase 2 via `POST /api/creator/phase-2/chat-message` checks authentication and tenancy but does not re-validate onboarding status on every message.
- **Legacy Bypass**: None.

### Phase 2 → Phase 3 Gate
- **Enforcing Endpoint**: `GET /api/creator/journey` (`CreatorJourneyService.cs:282-320`) and `src/app/dashboard/creator/phase-2/complete/page.tsx:75-80`.
- **Required Conditions**:
  1. Concept name set: `!string.IsNullOrWhiteSpace(c?.Name) && c.Name != "Untitled Concept"`
  2. Idea clarity scored: `journey.Phase2.ClarityScore > 0`
  3. Branding resolved: `journey.Phase2.BrandingComplete == true || journey.Phase2.BrandingSkipped == true`
- **Failure Status Code**: HTTP 200 with `phase3.Status = "locked"`.
- **Legacy Bypass**: None.

### Phase 3 → Phase 4 Gate
- **Enforcing Endpoints**:
  1. `PATCH /api/creator/masterplan/complete` (`CreatorPhase3Controller.cs:633-668`)
  2. `CreatorJourneyService.cs:323-380` (`ComputePhaseStatusAsync`)
- **Required Conditions at `/masterplan/complete`**:
  - `forecast` artifact exists in `CreatorArtifacts`
  - `business_plan` artifact exists in `CreatorArtifacts`
  - `formation_generator` artifact exists in `CreatorArtifacts`
  - `legal_compliance` evaluation exists in `CreatorArtifacts`
- **Failure Status Code at `/masterplan/complete`**: HTTP 422 Unprocessable Entity (`{ message: "Missing required artifacts: [names]" }`).
- **Required Conditions in `ComputePhaseStatusAsync`**:
  - Standard Path: `hasMarketStudy && hasBusinessModel && hasForecast && legalPresent && hasFormation && hasPlan`
  - **Legacy-Bypass Branch**: `hasPlan && hasForecast && hasFormation && !marketStudyStarted && !businessModelStarted`
  - *Evidence*: `CreatorJourneyService.cs:361-365`:
    ```csharp
    var legacyComplete = hasPlan && hasForecast && hasFormation && !marketStudyStarted && !businessModelStarted;
    var newJourneyComplete = hasMarketStudy && hasBusinessModel && hasForecast && legalPresent && hasFormation && hasPlan;
    p3.IsCompleted = newJourneyComplete || legacyComplete;
    ```
- **Gate Discrepancy / Drift**: `/masterplan/complete` does **not** check `hasMarketStudy` or `hasBusinessModel`. A user can successfully hit `PATCH /masterplan/complete` (200 OK) with only the 4 artifacts, but `ComputePhaseStatusAsync` will still evaluate Phase 3 as `in_progress` if they started Market Study or Business Model without finishing them.

### Phase 4 → Phase 5 Gate
- **Enforcing Endpoints**:
  1. `PATCH /api/creator/phase-4/complete` (`CreatorPhase4Controller.cs:282-311`)
  2. `CreatorJourneyService.cs:382-416` (`ComputePhaseStatusAsync`)
- **Required Conditions**:
  - `journey.Phase4.PricingComplete == true`
  - `journey.Phase4.ResourceCalculatorComplete == true`
  - `journey.Phase4.GtmSetupComplete == true`
- **Failure Status Code**: HTTP 400 Bad Request (`{ message: "All 3 Phase 4 steps must be completed before marking Phase 4 complete" }`).
- **Legacy Bypass**: None.

### Phase 5 → Phase 6 Gate
- **Enforcing Endpoints**:
  1. `POST /api/creator/phase-6/level-up` (`CreatorPhase6Controller.cs:188-290`)
  2. `CreatorJourneyService.cs:418-478` (`ComputePhaseStatusAsync`)
- **Required Conditions**:
  - Decision made: `journey.Phase5.PathChosen == "path_a"` OR `"path_b"`
  - For Path A: IP Marketplace listing is active (`MarketplaceListingId != null`). However, if creator accepts Full Buyout (`DealType == "full_buyout"`), Phase 6 is permanently **locked** (`status = "locked"`), as ownership is transferred.
  - For Path B: `journey.Phase5.CompanyFormationComplete == true` OR `journey.Phase5.SeedFundingApplied == true`
  - For Level-Up execution: Phase 5 Path B must be completed, and `journey.Phase6.LevelUpTriggered` must be false.
- **Failure Status Code**: HTTP 400 Bad Request (`{ message: "Phase 5 must be completed via Path B (Build & Seed) before leveling up" }`).
- **Legacy Bypass**: None.

---

## 3. Frontend vs Backend Gate Alignment & Drift

| Gate | Frontend Behavior | Backend Behavior | Alignment Status |
| :--- | :--- | :--- | :--- |
| **1 → 2** | `Phase1Client` checks `onboarding.Phase >= 1`. If not, redirects to `/onboarding`. | `ComputePhaseStatusAsync` locks Phase 2 if `onboarding.Phase < 1`. | **ALIGNED** |
| **2 → 3** | `complete/page.tsx:75` checks `computed.phase3?.status !== 'locked'`. Disable/Enables "Enter Phase 3" button. | `ComputePhaseStatusAsync` locks Phase 3 if name, clarity, or branding missing. | **ALIGNED** |
| **3 → 4** | `complete/page.tsx:180-210` submits `PATCH /masterplan/complete` and then pushes `/offer-pricing`. | `PATCH /masterplan/complete` requires 4 artifacts (forecast, plan, formation, legal), but ignores market study and business model. | **DRIFT**: Frontend assumes completing Step 3.7 unlocks Phase 4, but if user has an unfinished market study session, backend `ComputePhaseStatusAsync` marks Phase 3 incomplete. |
| **4 → 5** | `Phase4Complete.tsx:55-75` disables "Proceed to Crossroads" until Pricing, Resource, and GTM steps are completed. Calls `PATCH /complete`. | Rejects with 400 if any of the 3 steps is false. | **ALIGNED** |
| **5 → 6** | `crossroads/page.tsx` routes Path B completion to `/dashboard/creator/investors`. Disables Level Up CTA if Path A chosen. | Rejects `POST /level-up` with 400 if Path B is not complete or if Path A Full Buyout was executed. | **ALIGNED** |
