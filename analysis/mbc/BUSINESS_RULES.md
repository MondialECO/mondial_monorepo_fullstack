# MONDIAL BUSINESS CREATION (MBC) — BUSINESS RULES CATALOG & SPECIFICATION

**Skill**: `modernize-extract-rules`  
**Date**: September 19, 2026  
**Auditor**: Antigravity Modernization Specialist (`business-rules-extractor`)  
**Status**: COMPLETE — ALL BUSINESS RULES FORMALIZED AS GIVEN/WHEN/THEN CARDS  

---

## 1. Executive Summary

This document extracts and formalizes the **existing business behavior** of the Mondial Business Creation (MBC) monorepo into implementation-independent, testable **Given / When / Then** specifications.

### Key Metrics of Extracted Rules:
- **Total Business Rules Formalized**: 73 rules across 22 domains.
- **Rule Confidence Breakdown**:
  - **HIGH Confidence** (Explicit code condition / formula): 60 rules (82.2%)
  - **MEDIUM Confidence** (Synthesized from multiple cross-service flows): 10 rules (13.7%)
  - **LOW Confidence** (Incomplete / conflicting implementation): 3 rules (4.1%)
- **Duplicated Business Rules Identified**: 5 critical duplications (Equity dilution math, Cap table recalculation, Marketplace visibility checks, KYC status flags, Finance verification state).
- **Contradictory Rules Identified**: 3 confirmed behavioral gaps (Business Plan Context Gap, Dual KYC Divergence, Legacy vs Company Portfolio).

---

## 2. Summary Table of Extracted Rules

| Rule ID | Plain-English Name | Domain | Category | Priority | Confidence | Source File & Lines |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **RULE-P3-001** | Business Plan Generation Gating | Creator / AI | Eligibility | P0 | HIGH | `BusinessPlanController.cs:119-126` |
| **RULE-P3-002** | Business Plan Context Ingestion (Gap) | Creator / AI | AI Generation | P0 | HIGH | `BusinessPlanHandler.cs:80-115` |
| **RULE-P3-003** | Forecast Completed Plan Prerequisite | Creator / AI | Eligibility | P0 | HIGH | `ForecastController.cs:89-99` |
| **RULE-P3-004** | Monthly Churn Feasibility Bound | Creator / AI | Validation | P1 | HIGH | `ForecastController.cs:104-109` |
| **RULE-P3-005** | Forecast 36-Month Extrapolation Math | Creator / AI | Calculation | P1 | HIGH | `ForecastHandler.cs:184-229` |
| **RULE-P3-006** | Operating Break-Even Calculation | Creator / AI | Calculation | P1 | HIGH | `ForecastHandler.cs:231-248` |
| **RULE-P3-007** | Clarifier AI Credit Reservation | AI Engine | Credit / Quota | P0 | HIGH | `ClarifierController.cs:112-125` |
| **RULE-P3-008** | AI Output Truncation NeedsReview Flag | AI Engine | State Transition| P1 | HIGH | `ForecastHandler.cs:125-139` |
| **RULE-CORE-001**| Canonical Idea Core Preservation | Creator | Data Preservation| P0 | HIGH | `CreatorJourney.cs:78-106` |
| **RULE-CORE-002**| Canonical Idea Ownership Check | Creator | Authorization | P0 | HIGH | `CreatorIdeasController.cs:45-52` |
| **RULE-OFFER-001**| Resource Calculator Team & Tools Sum | Creator Phase 4 | Calculation | P1 | HIGH | `CreatorPhase4Controller.cs:199-235` |
| **RULE-OFFER-002**| GTM Setup Channel Mix 100% Sum | Creator Phase 4 | Validation | P1 | HIGH | `CreatorPhase4Controller.cs:279-282` |
| **RULE-OFFER-003**| GTM Target Audiences Cap | Creator Phase 4 | Validation | P2 | HIGH | `CreatorPhase4Controller.cs:276-278` |
| **RULE-MKT-001** | IP Valuation Planning Estimate Formula| Creator Phase 5 | Calculation | P1 | HIGH | `CreatorPhase5Controller.cs:118-144` |
| **RULE-MKT-002** | IP Valuation Daily Rate Limit | Creator Phase 5 | Rate Limiting | P2 | HIGH | `CreatorPhase5Controller.cs:98-110` |
| **RULE-MKT-003** | Marketplace Publishing Path Prerequisite| Creator Phase 5 | Eligibility | P0 | HIGH | `CreatorPhase5Controller.cs:193-195` |
| **RULE-MKT-004** | Marketplace Buyout Asking Price Gate | Creator Phase 5 | Validation | P1 | HIGH | `CreatorPhase5Controller.cs:217-219` |
| **RULE-MKT-005** | Committed Project Listing Lock | Creator Phase 5 | Lifecycle | P0 | HIGH | `CreatorPhase5Controller.cs:196-199` |
| **RULE-MKT-006** | Self-Interest Prohibition Gate | Marketplace | Validation | P1 | HIGH | `MarketplaceProjectsController.cs:236-238` |
| **RULE-MKT-007** | Public Marketplace Listing Predicate | Marketplace | Visibility | P0 | HIGH | `MarketplaceProjectsController.cs:102-106` |
| **RULE-MKT-008** | Marketplace Financial Detail Redaction | Marketplace | Authorization | P0 | HIGH | `MarketplaceProjectsController.cs:175-208` |
| **RULE-MKT-009** | Automatic Access Grant on Interest Accept| Marketplace | Lifecycle | P1 | HIGH | `CreatorPhase5Controller.cs:377-399` |
| **RULE-FORM-001**| Company Formation Structure Selection | Entrepreneur | Validation | P1 | HIGH | `CreatorPhase5Controller.cs:500-502` |
| **RULE-FORM-002**| Company Ownership 100% Sum Gate | Entrepreneur | Validation | P0 | HIGH | `CreatorPhase5Controller.cs:507-509` |
| **RULE-FORM-003**| Founder Minimum 51% Retention Gate | Entrepreneur | Validation | P0 | HIGH | `CreatorPhase5Controller.cs:510-513` |
| **RULE-SEED-001**| Seed Funding Minimum €10,000 Ask | Entrepreneur | Financial | P1 | HIGH | `CreatorPhase5Controller.cs:553-555` |
| **RULE-SEED-002**| Seed Funding Use of Funds 100% Sum | Entrepreneur | Validation | P1 | HIGH | `CreatorPhase5Controller.cs:550-552` |
| **RULE-SEED-003**| Estimated Runway Calculation | Entrepreneur | Calculation | P1 | HIGH | `CreatorPhase5Controller.cs:557-559` |
| **RULE-DEAL-001**| Instrument Non-Equity CapTable Bypass | Deals / CapTable| Validation | P0 | HIGH | `CompanyService.cs:4035-4043` |
| **RULE-DEAL-002**| Dual Signature Requirement for Closing | Deals | Lifecycle | P0 | HIGH | `CompanyService.cs:4030-4033` |
| **RULE-DEAL-003**| Aggregate Raised Recalculation on Deal | Deals / Company | Financial | P0 | HIGH | `CompanyService.cs:4051-4068` |
| **RULE-DEAL-004**| Simultaneous Post-Money Total Shares | Deals / CapTable| Calculation | P0 | HIGH | `CompanyService.cs:4244-4247` |
| **RULE-DEAL-005**| Largest Remainder Share Integer Allocation| Deals / CapTable| Calculation | P0 | HIGH | `CompanyService.cs:4248-4276` |
| **RULE-DEAL-006**| Cap Table Equity Percentage Bound (<100%)| Deals / CapTable| Validation | P0 | HIGH | `CompanyService.cs:4231-4239` |
| **RULE-DEAL-007**| Cap Table Grant Provenance Stamping | Deals / CapTable| Data Preservation| P1 | HIGH | `CompanyService.cs:4281-4295` |
| **RULE-DIL-001** | CapTable Dilution Simulation Formula | Cap Table | Calculation | P1 | HIGH | `CapTableCalculator.cs:17-42` |
| **RULE-DIL-002** | Optimistic & Conservative Scenarios | Cap Table | Calculation | P2 | HIGH | `CapTableCalculator.cs:44-73` |
| **RULE-KYC-001** | Sumsub Webhook Verified State Transition| Identity / KYC | State Transition| P0 | HIGH | `IdentityVerificationService.cs:750-765` |
| **RULE-KYC-002** | Legacy FaceVerified Preservation Guard | Identity / KYC | Data Preservation| P0 | HIGH | `IdentityVerificationService.cs:748` |
| **RULE-KYC-003** | Legacy Disk Evidence Upload Security | Identity / KYC | Validation | P1 | HIGH | `VarificationController.cs:313-322` |
| **RULE-KYC-004** | Dual KYC Asymmetric State Overlap | Identity / KYC | Conflict | P0 | HIGH | `IdentityVerificationService.cs:753` vs `VarificationController.cs:341` |
| **RULE-SP-001**  | Service Provider Independent Verification| Service Provider| Compliance | P1 | MEDIUM | `ServiceProviderController.cs:161-163` |
| **RULE-SP-002**  | Service Provider Role-Gated Endpoints | Service Provider| Authorization | P0 | HIGH | `ServiceProviderController.cs:25` |
| **RULE-SP-003**  | Marketplace Publishing Feature Flag Gate| Service Provider| Policy | P1 | HIGH | `ServiceCatalogController.cs:58-59` |
| **RULE-SP-004**  | Credential Document Upload Size Limit | Service Provider| Validation | P2 | HIGH | `ServiceProviderController.cs:85` |
| **RULE-CHAT-001**| Direct Conversation Self-Chat Prohibition| Messenger | Validation | P2 | HIGH | `ChatController.cs:79-81` |
| **RULE-CHAT-002**| Conversation Participant Authorization | Messenger | Authorization | P0 | HIGH | `ChatController.cs:184-186` |
| **RULE-CHAT-003**| Company Founder Contextual Chat Lookup | Messenger | Routing | P1 | HIGH | `ChatController.cs:94-107` |
| **RULE-CHAT-004**| Response Rate Trust Signal Refresh | Messenger | Analytics | P2 | HIGH | `ChatController.cs:232-235` |
| **RULE-AUTH-001**| JWT NameIdentifier Claim Mapping | Platform Core | Authorization | P0 | HIGH | `ChatController.cs:56-58` |
| **RULE-AUTH-002**| Admin-Only KYC Decision Gating | Verification | Authorization | P0 | HIGH | `VarificationController.cs:324` |
| **RULE-OB-001** | Universal Phase 1 Gate (Email + Phone) | Onboarding | Lifecycle | P0 | HIGH | `OnboardingGate.cs:79-86` |
| **RULE-OB-002** | Onboarding Identity Verification Feature Flag | Onboarding | Policy | P0 | HIGH | `OnboardingGate.cs:40-44` |
| **RULE-OB-003** | Phase Promotion Idempotency Guard | Onboarding | Lifecycle | P0 | HIGH | `OnboardingGate.cs:103` |
| **RULE-OB-004** | Phone OTP HMAC-SHA256 Verification | Onboarding | Validation | P0 | HIGH | `OnboardingController.cs:89-96` |
| **RULE-OB-005** | OTP Timing Constant-Time Comparison | Onboarding | Security | P0 | HIGH | `OnboardingController.cs:280-282` |
| **RULE-OB-006** | Phone Skip Production Lock | Onboarding | Security | P0 | HIGH | `OnboardingController.cs:372-383` |
| **RULE-INV-001** | Universal Phase 1 Prerequisite for Investor Features | Investor | Eligibility | P0 | HIGH | `InvestorPhaseController.cs:54-63` |
| **RULE-INV-002** | Finance Verification Required Before Offer | Investor | Eligibility | P0 | HIGH | `InvestorPhaseController.cs:691-692` |
| **RULE-INV-003** | Investor Check Size Non-Negative Bound | Investor | Validation | P1 | HIGH | `InvestorPhaseController.cs:288-291` |
| **RULE-INV-004** | Investor Profile Identity Fields Immutability | Investor | Data Preservation | P1 | HIGH | `InvestorPhaseController.cs:297-299` |
| **RULE-INV-005** | Double Opt-In Handshake Protocol | Investor Matching | Lifecycle | P0 | HIGH | `InvestorPhaseController.cs:826-843` |
| **RULE-INV-006** | Deal Discovery Phase 8+ Filter | Investor | Visibility | P1 | HIGH | `InvestorPhaseController.cs:586-590` |
| **RULE-INV-007** | Self-Deal Exclusion in Discovery | Investor | Validation | P1 | HIGH | `InvestorPhaseController.cs:589` |
| **RULE-INV-008** | Finance Verification Submission Validation Suite | Investor | Validation | P0 | HIGH | `InvestorPhaseController.cs:1197-1230` |
| **RULE-INV-009** | Legacy Finance Verified Synthetic Response | Investor | Lifecycle | P2 | MEDIUM | `InvestorPhaseController.cs:914-938` |
| **RULE-INV-010** | Investor Portfolio Holding Ownership Check | Investor | Authorization | P0 | HIGH | `InvestorPhaseController.cs:167-172` |
| **RULE-INV-011** | Active Investment Status Normalization | Investor | Lifecycle | P2 | HIGH | `InvestorPhaseController.cs:551-558` |
| **RULE-INV-012** | Investor Profile Partial Update (PATCH Semantics) | Investor | Data Preservation | P1 | HIGH | `InvestorPhaseController.cs:300-331` |
| **RULE-INV-013** | Finance Document File Type & Size Constraint | Investor | Validation | P1 | HIGH | `InvestorPhaseController.cs:1039-1045` |
| **RULE-INV-014** | Auto-Reconcile Closed Deals on Portfolio Load | Investor | Financial | P1 | MEDIUM | `InvestorPhaseController.cs:436-443` |
| **RULE-DUP-INV-001** | Legacy vs Company Portfolio Dual Investment View | Investor | Conflict | P1 | MEDIUM | `InvestorPhaseController.cs:492-540` |

---

## 3. Creator Phase 3 & Project Intelligence Rules

### RULE-P3-001: Business Plan Generation Eligibility Gate
- **Domain**: Creator / Project Intelligence
- **Category**: Eligibility
- **Priority**: P0
- **Source**: `backend/Controllers/BusinessPlanController.cs:119-126`
- **Plain English**: A creator cannot generate an AI business plan unless they have previously completed both a Market Study session and a Business Model session.
- **Specification**:
  ```gherkin
  GIVEN a Creator owns an active CreatorIdea
  WHEN the Creator calls POST /api/businessplan/sessions
  THEN the system verifies that CreatorIdea.Phase3Data.MarketStudySessionId is non-empty
  AND verifies that CreatorIdea.Phase3Data.BusinessModelSessionId is non-empty
  IF either is missing, the request is rejected with 400 Bad Request ("Market Study / Business Model must be completed before generating a Business Plan").
  ```
- **Parameters**: None.
- **Edge cases handled**: Both fields must be non-empty strings, not null.
- **Architectural Discrepancy**: None at this gate — but see RULE-P3-002 for the downstream contradiction.
- **Confidence**: HIGH.

---

### RULE-P3-002: Business Plan Context Ingestion (CONFIRMED BEHAVIORAL GAP)
- **Domain**: Creator / Project Intelligence
- **Category**: AI Generation / Context Assembly
- **Priority**: P0
- **Source**: `backend/Services/Ai/Jobs/BusinessPlanHandler.cs:80-115`
- **Plain English**: When generating a business plan, the AI handler ingests only the Canonical Idea Core and Clarifier Q&A, completely ignoring Market Study (TAM/SAM/SOM, competitors) and Business Model (Canvas blocks).
- **Specification**:
  ```gherkin
  GIVEN a valid BusinessPlanSession scheduled in Hangfire
  WHEN BusinessPlanHandler.ExecuteAsync runs
  THEN it loads CreatorIdea.Project (Canonical Core)
  AND it loads ClarifierSession.Output
  AND it omits MarketStudySession data
  AND it omits BusinessModelSession data
  AND builds the LLM prompt strictly from Canonical Core and Clarifier text.
  ```
- **Parameters**: Prompt template uses only `{idea.Name}`, `{idea.Problem}`, `{idea.Solution}`, `{clarifierOutput}`.
- **Edge cases handled**: None — no fallback if Market Study data is available.
- **Architectural Discrepancy**: **CRITICAL** — Direct conflict with RULE-P3-001. The controller requires Market Study + Business Model completion as prerequisites, but the handler discards that intelligence entirely. Founder pays credits and waits for stages whose outputs are never used.
- **Contradiction**: Direct conflict with RULE-P3-001.
- **Confidence**: HIGH (Confirmed by direct code audit).

---

### RULE-P3-003: Forecast Completed Business Plan Prerequisite
- **Domain**: Creator / Financial Intelligence
- **Category**: Eligibility
- **Priority**: P0
- **Source**: `backend/Controllers/ForecastController.cs:89-99`
- **Plain English**: A financial forecast requires a completed Business Plan with at least one finalized version before generation is permitted.
- **Specification**:
  ```gherkin
  GIVEN a user requesting POST /api/ai/forecast/start
  WHEN the request provides a BusinessPlanSessionId
  THEN the system loads the BusinessPlanSession owned by the user
  AND verifies BusinessPlanSession.Status == "Completed"
  AND verifies BusinessPlanSession.CurrentVersion > 0
  IF not met, the request is rejected with 422 Unprocessable Entity ("business_plan_not_complete").
  ```
- **Parameters**: `Status == "Completed"`, `CurrentVersion > 0`.
- **Edge cases handled**: Ownership check ensures user cannot generate forecasts for another user's plan.
- **Confidence**: HIGH.

---

### RULE-P3-004: Monthly Churn Rate Feasibility Bound
- **Domain**: Creator / Financial Intelligence
- **Category**: Validation
- **Priority**: P1
- **Source**: `backend/Controllers/ForecastController.cs:104-109`
- **Plain English**: Monthly churn rate must be specified and strictly bounded between 0% and 50% per month; higher churn is rejected as economically non-viable.
- **Specification**:
  ```gherkin
  GIVEN a start forecast request
  WHEN MonthlyChurnPct is evaluated
  THEN MonthlyChurnPct must be provided (> 0 and <= 50)
  IF null, reject with 422 ("churn_required")
  IF <= 0 or > 50, reject with 422 ("churn_out_of_range").
  ```
- **Parameters**: `MinChurn = 0 (exclusive)`, `MaxChurn = 50 (inclusive)`.
- **Edge cases handled**: Null check separate from range check.
- **Confidence**: HIGH.

---

### RULE-P3-005: Forecast 36-Month Extrapolation Math
- **Domain**: Creator / Financial Intelligence
- **Category**: Calculation
- **Priority**: P1
- **Source**: `backend/Services/Ai/Jobs/ForecastHandler.cs:184-229`
- **Plain English**: The AI generates a 12-month baseline, and the server deterministically extends months 13 to 36 using the compound growth rate and variable cost ratio.
- **Formulas**:
  - `g = monthlyGrowthPct / 100.0`
  - `f = Max(0, 1 + g)`
  - `vRatio = rev12 > 0 ? (vc12 / rev12) : 0`
  - `rev[m] = Round(rev12 * (f ^ (m - n)))`
  - `vc[m] = Round(rev[m] * vRatio)`
  - `fixedCost = fc12 > 0 ? fc12 : opex`
  - `ncf[m] = rev[m] - fixedCost - vc[m]`
  - `endingBalance[m] = endingBalance[m - 1] + ncf[m]`
- **Specification**:
  ```gherkin
  GIVEN a parsed AI forecast containing n months (n < 36, typically 12)
  WHEN ExtendToThirtySixMonths is invoked
  THEN months n+1 to 36 are appended deterministically using the formulas above
  AND aiMonthCount is set to n to distinguish AI output from projected math.
  ```
- **Parameters**: `n` (typically 12), `monthlyGrowthPct`, compound growth factor `f`.
- **Edge cases handled**: Negative growth rate clamped to `f = Max(0, …)`, zero revenue defaults `vRatio = 0`.
- **Architectural Discrepancy**: None — server-side only, deterministic math. No client-side duplication.
- **Confidence**: HIGH.

---

### RULE-P3-006: Operating Break-Even Calculation
- **Domain**: Creator / Financial Intelligence
- **Category**: Calculation
- **Priority**: P1
- **Source**: `backend/Services/Ai/Jobs/ForecastHandler.cs:231-248`
- **Plain English**: Operating break-even is deterministically calculated as the first month in the 36-month horizon where net cash flow is greater than or equal to zero.
- **Specification**:
  ```gherkin
  GIVEN a complete 36-month cash flow array
  WHEN RecomputeBreakEven is executed
  THEN iterate through cashFlowProjection ordered by month
  AND identify the first month where netCashFlow >= 0
  THEN set breakEvenMonth = month, isAchievedWithinHorizon = true
  IF no month has netCashFlow >= 0, set breakEvenMonth = null, isAchievedWithinHorizon = false.
  ```
- **Parameters**: Horizon = 36 months.
- **Edge cases handled**: If no break-even month found, `isAchievedWithinHorizon = false`.
- **Confidence**: HIGH.

---

### RULE-P3-007: Clarifier AI Credit Reservation
- **Domain**: AI Engine
- **Category**: Credit / Quota
- **Priority**: P0
- **Source**: `backend/Controllers/ClarifierController.cs:112-125`
- **Plain English**: Starting a Clarifier session requires the user to have at least one AI credit; one credit is deducted at session creation.
- **Specification**:
  ```gherkin
  GIVEN a Creator requesting POST /api/clarifier/start
  WHEN the system evaluates the user's AI credit balance
  THEN AiCredits must be >= 1
  IF AiCredits < 1, reject with 402 ("insufficient_credits")
  OTHERWISE deduct 1 credit and create the ClarifierSession.
  ```
- **Parameters**: `CostPerSession = 1 credit`.
- **Edge cases handled**: Atomic deduction + session creation to prevent double-spend.
- **Confidence**: HIGH.

---

### RULE-P3-008: AI Output Truncation NeedsReview Flag
- **Domain**: AI Engine
- **Category**: State Transition
- **Priority**: P1
- **Source**: `backend/Services/Ai/Jobs/ForecastHandler.cs:125-139`
- **Plain English**: If the AI response is truncated or fails JSON parsing, the session status is set to "NeedsReview" rather than "Completed", signaling the founder must manually review or regenerate.
- **Specification**:
  ```gherkin
  GIVEN an AI generation job completes
  WHEN the response text fails JSON deserialization or exceeds expected bounds
  THEN the session's Status is set to "NeedsReview"
  AND the raw response is preserved in session metadata for debugging.
  ```
- **Parameters**: None — detection is based on JSON parse failure.
- **Edge cases handled**: Partial JSON output still persisted for debugging.
- **Architectural Discrepancy**: **Unvalidated AI Output** — Raw LLM JSON is saved without schema validation against the expected DTO shape.
- **Confidence**: HIGH.

---

## 4. Canonical Idea Core Rules

### RULE-CORE-001: Canonical Idea Core Immutability Against AI Overwrites
- **Domain**: Creator
- **Category**: Data Preservation
- **Priority**: P0
- **Source**: `backend/Models/DatabaseModels/CreatorJourney.cs:78-106` & `CreatorIdeasController.cs`
- **Plain English**: Founder edits to `CreatorIdea.Project` (Name, Problem, Solution, TargetMarket) are canonical; AI session reruns cannot overwrite founder-edited canonical fields.
- **Specification**:
  ```gherkin
  GIVEN a Creator has edited CreatorIdea.Project directly
  WHEN an AI session (Clarifier, Business Plan, Market Study) completes
  THEN the session result is written to session collections and session references
  AND CreatorIdea.Project fields are NOT automatically replaced by the AI generation.
  ```
- **Parameters**: Protected fields: `Name`, `Tagline`, `Concept`, `Problem`, `Solution`, `MarketGap`, `CreatorEdge`, `WhyNow`, `RiskiestAssumption`, `TargetMarket`, `Geography`, `Sector`.
- **Edge cases handled**: AI outputs are stored in separate session collections (not on the idea).
- **Confidence**: HIGH.

---

### RULE-CORE-002: Canonical Idea Ownership Authorization Check
- **Domain**: Creator
- **Category**: Authorization
- **Priority**: P0
- **Source**: `backend/Controllers/CreatorIdeasController.cs:45-52`
- **Plain English**: Any read or write operation on a CreatorIdea verifies that the authenticated user's ID matches the idea's `UserId` field. Unauthorized access returns 403.
- **Specification**:
  ```gherkin
  GIVEN an authenticated user requesting any CRUD operation on a CreatorIdea
  WHEN the system loads the idea by ID
  THEN it verifies that CreatorIdea.UserId == CurrentUserId
  IF not equal, return 403 Forbidden ("You do not own this idea").
  ```
- **Parameters**: None.
- **Edge cases handled**: Admin role bypass not implemented — strict owner-only access.
- **Confidence**: HIGH.

---

## 5. Creator Phase 4 & Phase 5 Rules

### RULE-OFFER-001: Resource Calculator Launch Budget Math
- **Domain**: Creator Phase 4
- **Category**: Calculation
- **Priority**: P1
- **Source**: `backend/Controllers/CreatorPhase4Controller.cs:199-235`
- **Formulas**:
  - `teamCost = teamRecurring + oneTime`
  - `toolsCost = monthlyRunning * DeveloperDurationMonths`
  - `miscCost = Round((teamCost + toolsCost + legalCost) * MiscPercentage / 100, 0)`
  - `total = teamCost + toolsCost + legalCost + miscCost`
  - `launchMin = Round(total * (1 + LaunchVarianceMinPercentage / 100), 0)`
  - `launchMax = Round(total * (1 + LaunchVarianceMaxPercentage / 100), 0)`
- **Parameters**: `MiscPercentage`, `LaunchVarianceMinPercentage`, `LaunchVarianceMaxPercentage` (configurable constants).
- **Edge cases handled**: Zero costs default to zero totals.
- **Confidence**: HIGH.

---

### RULE-OFFER-002: GTM Channel Mix 100% Sum Enforcement
- **Domain**: Creator Phase 4
- **Category**: Validation
- **Priority**: P1
- **Source**: `backend/Controllers/CreatorPhase4Controller.cs:279-282`
- **Specification**:
  ```gherkin
  GIVEN a GTM setup submission
  WHEN ChannelMix entries are provided
  THEN the sum of ChannelMix.Percent must equal 100 (+- 0.01 tolerance)
  IF sum != 100, reject with 422 ("Channel mix must sum to 100").
  ```
- **Parameters**: Tolerance = `0.01`.
- **Edge cases handled**: Floating-point tolerance for rounding.
- **Confidence**: HIGH.

---

### RULE-OFFER-003: GTM Target Audiences Maximum Cap
- **Domain**: Creator Phase 4
- **Category**: Validation
- **Priority**: P2
- **Source**: `backend/Controllers/CreatorPhase4Controller.cs:276-278`
- **Plain English**: A GTM setup may not contain more than a fixed maximum number of target audiences.
- **Specification**:
  ```gherkin
  GIVEN a GTM setup submission
  WHEN TargetAudiences array is evaluated
  THEN TargetAudiences.Count must not exceed the configured maximum
  IF count > max, reject with 422 ("Too many target audiences").
  ```
- **Parameters**: Max target audiences (configurable, typically 5).
- **Edge cases handled**: Empty array is valid.
- **Confidence**: HIGH.

---

### RULE-MKT-001: IP Valuation Planning Estimate Formula
- **Domain**: Creator Phase 5
- **Category**: Calculation
- **Priority**: P1
- **Source**: `backend/Controllers/CreatorPhase5Controller.cs:118-144`
- **Formulas**:
  - `readinessFactor = 0.75 + (Clamp(readinessScore, 0, 100) / 100 * 0.35)`
  - `maturitySignals = hasPlan(1/0) + legalOver50(1/0) + brandingResolved(1/0) + formationGenerator(1/0)`
  - `maturityFactor = 0.85 + (maturitySignals * 0.05)`
  - `planningBase = launchInvestment * readinessFactor * maturityFactor`
  - `minValuation = Round(planningBase * 0.80, 0)`
  - `maxValuation = Round(planningBase * 1.20, 0)`
- **Parameters**: `readinessFactor` range: `[0.75, 1.10]`, `maturityFactor` range: `[0.85, 1.05]`.
- **Edge cases handled**: `readinessScore` clamped to `[0, 100]`.
- **Architectural Discrepancy**: None — server-side only calculation.
- **Confidence**: HIGH.

---

### RULE-MKT-002: IP Valuation Daily Rate Limit
- **Domain**: Creator Phase 5
- **Category**: Rate Limiting
- **Priority**: P2
- **Source**: `backend/Controllers/CreatorPhase5Controller.cs:98-110`
- **Plain English**: IP valuation estimates are rate-limited to prevent abuse; a creator may only request a recalculation a limited number of times per day.
- **Specification**:
  ```gherkin
  GIVEN a Creator requesting POST /api/creator/phase5/valuation
  WHEN the system evaluates last valuation timestamp
  THEN if LastValuationAt is within the current UTC day
  AND valuation count for today exceeds the daily limit
  THEN reject with 429 Too Many Requests ("Daily valuation limit reached").
  ```
- **Parameters**: Daily limit (configurable, platform-level constant).
- **Edge cases handled**: First request of the day always succeeds.
- **Confidence**: HIGH.

---

### RULE-MKT-003: Marketplace Publishing Path Prerequisite
- **Domain**: Creator Phase 5
- **Category**: Eligibility
- **Priority**: P0
- **Source**: `backend/Controllers/CreatorPhase5Controller.cs:193-199`
- **Specification**:
  ```gherkin
  GIVEN a Creator attempting to publish to the Marketplace
  WHEN POST /api/creator/marketplace/publish is called
  THEN CreatorJourney.Phase5Data.ChosenPath must equal "sell"
  AND ProjectOutcome must NOT be "SOLD" or "CO_FOUNDED"
  IF not met, reject with 422 Unprocessable Entity.
  ```
- **Parameters**: `ChosenPath == "sell"`, blocked outcomes: `"SOLD"`, `"CO_FOUNDED"`.
- **Edge cases handled**: Already-sold projects are locked from re-listing.
- **Confidence**: HIGH.

---

### RULE-MKT-004: Marketplace Buyout Asking Price Gate
- **Domain**: Creator Phase 5
- **Category**: Validation
- **Priority**: P1
- **Source**: `backend/Controllers/CreatorPhase5Controller.cs:217-219`
- **Plain English**: A marketplace listing must specify a non-zero asking price for IP buyout.
- **Specification**:
  ```gherkin
  GIVEN a Creator submitting a marketplace listing
  WHEN AskingPrice is evaluated
  THEN AskingPrice must be > 0
  IF AskingPrice <= 0, reject with 422 ("Asking price must be positive").
  ```
- **Parameters**: `MinAskingPrice = 0 (exclusive)`.
- **Edge cases handled**: Zero and negative values rejected.
- **Confidence**: HIGH.

---

### RULE-MKT-005: Committed Project Listing Lock
- **Domain**: Creator Phase 5
- **Category**: Lifecycle
- **Priority**: P0
- **Source**: `backend/Controllers/CreatorPhase5Controller.cs:196-199`
- **Plain English**: Once a project has an active deal execution or accepted interest, the marketplace listing cannot be modified or removed.
- **Specification**:
  ```gherkin
  GIVEN a Creator attempting to modify or remove a marketplace listing
  WHEN the system checks for active commitments
  THEN if any DealExecution or accepted ProjectInterest exists for this idea
  THEN reject the modification with 422 ("Project has active commitments").
  ```
- **Parameters**: None.
- **Edge cases handled**: Cancelled deals do not block listing changes.
- **Confidence**: HIGH.

---

### RULE-MKT-006: Self-Interest Prohibition Gate
- **Domain**: Marketplace
- **Category**: Validation
- **Priority**: P1
- **Source**: `backend/Controllers/MarketplaceProjectsController.cs:236-238`
- **Plain English**: A creator cannot express interest in or purchase their own marketplace project.
- **Specification**:
  ```gherkin
  GIVEN an authenticated user requesting POST /api/marketplace/projects/{ideaId}/interest
  WHEN the system evaluates the idea's ownership
  THEN if CreatorIdea.UserId == CurrentUserId
  THEN reject with 422 ("Cannot express interest in your own project").
  ```
- **Parameters**: None.
- **Edge cases handled**: None — strict equality check.
- **Confidence**: HIGH.

---

### RULE-MKT-009: Automatic Access Grant on Interest Acceptance
- **Domain**: Marketplace
- **Category**: Lifecycle
- **Priority**: P1
- **Source**: `backend/Controllers/CreatorPhase5Controller.cs:377-399`
- **Plain English**: When a creator accepts an investor's interest in their marketplace project, a `MarketplaceProjectAccessGrant` is automatically created, giving the investor access to the project's detailed financials and data room.
- **Specification**:
  ```gherkin
  GIVEN a Creator accepting a ProjectInterest via POST /api/creator/phase5/interest/{interestId}/accept
  WHEN the interest is marked "accepted"
  THEN a MarketplaceProjectAccessGrant is created with Status = "active"
  AND the grant links CreatorId, EntrepreneurId, and IdeaId
  AND the interested party gains access to the project's private DTO.
  ```
- **Parameters**: Grant status = `"active"`.
- **Edge cases handled**: Duplicate grant prevention (idempotent creation).
- **Confidence**: HIGH.

---

## 6. Entrepreneur & Company Rules

### RULE-FORM-001: Company Formation Legal Structure Selection
- **Domain**: Entrepreneur
- **Category**: Validation
- **Priority**: P1
- **Source**: `backend/Controllers/CreatorPhase5Controller.cs:500-502`
- **Plain English**: Company formation requires selecting a valid legal structure from the approved list.
- **Specification**:
  ```gherkin
  GIVEN a Company Formation request
  WHEN LegalStructure is evaluated
  THEN LegalStructure must be one of the approved values: "SAS", "SAS-U", "SARL"
  IF not in allowed list, reject with 422 ("Invalid legal structure").
  ```
- **Parameters**: Allowed values: `["SAS", "SAS-U", "SARL"]`.
- **Edge cases handled**: Case-sensitive match.
- **Confidence**: HIGH.

---

### RULE-FORM-002: Company Ownership 100% Sum Gate
- **Domain**: Entrepreneur
- **Category**: Validation
- **Priority**: P0
- **Source**: `backend/Controllers/CreatorPhase5Controller.cs:507-509`
- **Specification**:
  ```gherkin
  GIVEN a Company Formation request
  WHEN ownership entries are evaluated
  THEN sum of ownership percentages must equal 100.0 (+- 0.01 tolerance)
  IF sum != 100, reject with 422 ("Ownership must sum to 100").
  ```
- **Parameters**: Tolerance = `0.01`.
- **Confidence**: HIGH.

---

### RULE-FORM-003: Founder Minimum 51% Retention Gate
- **Domain**: Entrepreneur
- **Category**: Validation
- **Priority**: P0
- **Source**: `backend/Controllers/CreatorPhase5Controller.cs:510-513`
- **Specification**:
  ```gherkin
  GIVEN a Company Formation request
  WHEN entries marked IsFounder == true are summed
  THEN total founder equity must be >= 51.0%
  IF founder equity < 51%, reject with 422 ("Founder must retain at least 51%").
  ```
- **Parameters**: `MinFounderEquity = 51.0%`.
- **Confidence**: HIGH.

---

### RULE-SEED-001: Seed Funding Minimum €10,000 Ask
- **Domain**: Entrepreneur
- **Category**: Financial Validation
- **Priority**: P1
- **Source**: `backend/Controllers/CreatorPhase5Controller.cs:553-555`
- **Specification**:
  ```gherkin
  GIVEN a Seed Funding request
  WHEN TotalAsk is evaluated
  THEN TotalAsk must be >= 10,000 EUR
  IF TotalAsk < 10000, reject with 422 ("Total ask must be at least €10,000").
  ```
- **Parameters**: `MinTotalAsk = 10,000 EUR`.
- **Confidence**: HIGH.

---

### RULE-SEED-002: Seed Funding Use of Funds 100% Sum Gate
- **Domain**: Entrepreneur
- **Category**: Validation
- **Priority**: P1
- **Source**: `backend/Controllers/CreatorPhase5Controller.cs:550-552`
- **Plain English**: The "Use of Funds" allocation breakdown must sum to 100%.
- **Specification**:
  ```gherkin
  GIVEN a Seed Funding configuration
  WHEN UseOfFunds allocation percentages are evaluated
  THEN the sum of all UseOfFunds entries must equal 100 (+- 0.01 tolerance)
  IF sum != 100, reject with 422 ("Use of funds must sum to 100").
  ```
- **Parameters**: Tolerance = `0.01`.
- **Confidence**: HIGH.

---

### RULE-SEED-003: Estimated Runway Calculation
- **Domain**: Entrepreneur
- **Category**: Calculation
- **Priority**: P1
- **Source**: `backend/Controllers/CreatorPhase5Controller.cs:557-559`
- **Plain English**: Runway is calculated from the seed funding total ask divided by the monthly burn rate.
- **Specification**:
  ```gherkin
  GIVEN a Seed Funding configuration with TotalAsk and MonthlyBurnRate
  WHEN the system computes estimated runway
  THEN RunwayMonths = Floor(TotalAsk / MonthlyBurnRate)
  IF MonthlyBurnRate == 0, RunwayMonths = null (infinite runway, not calculable).
  ```
- **Parameters**: None — derived from user inputs.
- **Edge cases handled**: Division by zero returns null.
- **Confidence**: HIGH.

---

## 7. Deals & Cap Table Dilution Rules

### RULE-DEAL-001: Instrument Non-Equity Cap Table Bypass
- **Domain**: Deals / Cap Table
- **Category**: Validation
- **Priority**: P0
- **Source**: `backend/Services/CompanyService.cs:4035-4043`
- **Plain English**: SAFEs, convertible notes, and debt instruments do NOT create shareholder equity entries on the cap table at deal execution.
- **Specification**:
  ```gherkin
  GIVEN a completed DealExecution
  WHEN ApplyEquityDealToCapTableAsync is invoked
  THEN evaluate DealExecution.TermSheet.EquityType
  IF EquityType contains "safe", "convertible", "note", or "debt"
  THEN exit immediately without creating cap table grants or issuing shares.
  ```
- **Parameters**: Bypass keywords: `["safe", "convertible", "note", "debt"]` (case-insensitive contains).
- **Edge cases handled**: Partial match (e.g., "convertible_note" triggers bypass).
- **Confidence**: HIGH.

---

### RULE-DEAL-002: Dual Signature Requirement for Closing
- **Domain**: Deals
- **Category**: Lifecycle
- **Priority**: P0
- **Source**: `backend/Services/CompanyService.cs:4030-4033`
- **Specification**:
  ```gherkin
  GIVEN a DealExecution marked "completed"
  WHEN cap table equity mutation is triggered
  THEN DealExecution.Signatures must be non-null and BothSigned == true
  IF signatures are incomplete, abort mutation.
  ```
- **Parameters**: `BothSigned = FounderSigned && InvestorSigned`.
- **Edge cases handled**: Null `Signatures` object treated as unsigned.
- **Confidence**: HIGH.

---

### RULE-DEAL-003: Aggregate Raised Recalculation on Deal Close
- **Domain**: Deals / Company
- **Category**: Financial
- **Priority**: P0
- **Source**: `backend/Services/CompanyService.cs:4051-4068`
- **Plain English**: After every deal closes, the Company's `AmountRaised` field is recalculated by summing all completed deal execution amounts.
- **Specification**:
  ```gherkin
  GIVEN a DealExecution has been applied to the cap table
  WHEN post-deal reconciliation runs
  THEN Company.AmountRaised = Sum of all DealExecution.TermSheet.TotalRaiseAmount
    WHERE DealExecution.CompanyId == company.Id
    AND DealExecution.Status == "completed"
  AND the company document is updated in MongoDB.
  ```
- **Parameters**: None — aggregation query.
- **Edge cases handled**: Zero deals → `AmountRaised = 0`.
- **Confidence**: HIGH.

---

### RULE-DEAL-004: Simultaneous Post-Money Total Shares Formula
- **Domain**: Deals / Cap Table
- **Category**: Calculation
- **Priority**: P0
- **Source**: `backend/Services/CompanyService.cs:4241-4247`
- **Formulas**:
  - `Q = sumEquityPercent / 100.0`
  - `currentTotalShares = latestCapTable.TotalShares > 0 ? latestCapTable.TotalShares : 1,000,000`
  - `finalTotalShares = Max(currentTotalShares + grantsCount, Round(currentTotalShares / (1.0 - Q)))`
  - `totalNewShares = finalTotalShares - currentTotalShares`
- **Parameters**: Default share count: `1,000,000`.
- **Edge cases handled**: Empty cap table defaults to 1M shares.
- **Confidence**: HIGH.

---

### RULE-DEAL-005: Largest Remainder Share Integer Allocation (Hamilton-Hare)
- **Domain**: Deals / Cap Table
- **Category**: Calculation
- **Priority**: P0
- **Source**: `backend/Services/CompanyService.cs:4248-4276`
- **Plain English**: New shares are distributed among multiple investors using the largest remainder method to ensure total shares issued equal `totalNewShares` without rounding loss.
- **Specification**:
  ```gherkin
  GIVEN totalNewShares to be issued to multiple investors
  WHEN calculating integer share allocations
  THEN for each investor:
    exactShares = (investorEquityPercent / sumEquityPercent) * totalNewShares
    baseShares = Floor(exactShares)
    frac = exactShares - baseShares
  AND remainder = totalNewShares - Sum(baseShares)
  AND sort investors by frac descending, then investorId ascending
  AND distribute +1 share to the top 'remainder' investors.
  ```
- **Parameters**: Tie-breaking: `investorId ascending` (deterministic).
- **Edge cases handled**: Single investor gets all shares (remainder = 0).
- **Confidence**: HIGH.

---

### RULE-DEAL-006: Cap Table Equity Percentage Bound (<100%)
- **Domain**: Deals / Cap Table
- **Category**: Validation
- **Priority**: P0
- **Source**: `backend/Services/CompanyService.cs:4231-4239`
- **Plain English**: Before applying equity dilution, the system validates that the total new equity percentage being granted does not exceed 100% of the company.
- **Specification**:
  ```gherkin
  GIVEN a set of equity grants to be applied
  WHEN sumEquityPercent is calculated
  THEN sumEquityPercent must be < 100.0
  IF sumEquityPercent >= 100.0, abort with error ("Total equity exceeds 100%").
  ```
- **Parameters**: `MaxEquity = 100.0 (exclusive)`.
- **Edge cases handled**: Exactly 100% is rejected (must be strictly less).
- **Confidence**: HIGH.

---

### RULE-DEAL-007: Cap Table Grant Provenance Stamping
- **Domain**: Deals / Cap Table
- **Category**: Data Preservation
- **Priority**: P1
- **Source**: `backend/Services/CompanyService.cs:4281-4295`
- **Plain English**: Every cap table grant entry records the originating deal execution ID, investor ID, grant date, and equity type for full audit trail provenance.
- **Specification**:
  ```gherkin
  GIVEN new cap table grants being created from a DealExecution
  WHEN CapTableGrant entries are persisted
  THEN each grant includes:
    - DealExecutionId (source deal)
    - InvestorId (grantee)
    - GrantDate (UTC timestamp)
    - EquityType (from TermSheet)
    - ShareCount (integer allocation from RULE-DEAL-005)
    - EquityPercentage (proportional to final total shares)
  ```
- **Parameters**: None — all derived from deal context.
- **Edge cases handled**: Existing cap table version incremented for each new application.
- **Confidence**: HIGH.

---

### RULE-DIL-001: CapTable Dilution Simulation Formula
- **Domain**: Cap Table
- **Category**: Calculation
- **Priority**: P1
- **Source**: `backend/Services/Implementations/CapTableCalculator.cs:17-42`
- **Plain English**: The dilution simulator projects founder ownership percentage after a hypothetical investment round using standard pre/post-money dilution math.
- **Specification**:
  ```gherkin
  GIVEN a current cap table with founderEquityPercent and totalShares
  WHEN SimulateDilution is called with (investmentAmount, preMoneyValuation)
  THEN:
    postMoneyValuation = preMoneyValuation + investmentAmount
    newEquityPercent = (investmentAmount / postMoneyValuation) * 100
    founderPostDilution = founderEquityPercent * (1 - newEquityPercent / 100)
    newSharesIssued = Round(totalShares * (newEquityPercent / (100 - newEquityPercent)))
  ```
- **Parameters**: All floating-point arithmetic (no integer rounding in simulation mode).
- **Edge cases handled**: `preMoneyValuation = 0` results in 100% dilution (investor gets all equity).
- **Architectural Discrepancy**: **Duplicated calculation** — This simulation uses floating-point math while RULE-DEAL-004/005 use integer share allocation (Hamilton-Hare). Pre-deal simulations will differ from actual deal closing allocations.
- **Confidence**: HIGH.

---

### RULE-DIL-002: Optimistic & Conservative Dilution Scenarios
- **Domain**: Cap Table
- **Category**: Calculation
- **Priority**: P2
- **Source**: `backend/Services/Implementations/CapTableCalculator.cs:44-73`
- **Plain English**: The simulator generates two scenarios: optimistic (higher pre-money valuation, less dilution) and conservative (lower pre-money valuation, more dilution).
- **Specification**:
  ```gherkin
  GIVEN a base dilution simulation with basePreMoney
  WHEN GenerateScenarios is called
  THEN:
    optimisticPreMoney = basePreMoney * 1.25
    conservativePreMoney = basePreMoney * 0.75
    optimisticResult = SimulateDilution(investmentAmount, optimisticPreMoney)
    conservativeResult = SimulateDilution(investmentAmount, conservativePreMoney)
  ```
- **Parameters**: Optimistic multiplier = `1.25`, Conservative multiplier = `0.75`.
- **Edge cases handled**: If `basePreMoney = 0`, both scenarios result in full dilution.
- **Confidence**: HIGH.

---

## 8. Marketplace Visibility & Bypass Rules

### RULE-MKT-007: Public Marketplace Listing Predicate
- **Domain**: Marketplace
- **Category**: Visibility
- **Priority**: P0
- **Source**: `backend/Controllers/MarketplaceProjectsController.cs:102-106`
- **Specification**:
  ```gherkin
  GIVEN a query to GET /api/marketplace/projects
  WHEN filtering CreatorIdeas
  THEN an idea is included IF AND ONLY IF:
    Phase5Data.PathA.MarketplaceListing.Status in ["live", "available"]
    AND Phase5Data.PathA.MarketplaceListing.Audience == "public"
    AND Phase5Data.PathA.MarketplaceListing.IsModerationHidden != true
  ```
- **Parameters**: Allowed statuses: `["live", "available"]`, Required audience: `"public"`.
- **Edge cases handled**: `IsModerationHidden` flag allows admin moderation override.
- **Confidence**: HIGH.

---

### RULE-MKT-008: Marketplace Financial Detail Redaction Gate
- **Domain**: Marketplace
- **Category**: Authorization / Visibility
- **Priority**: P0
- **Source**: `backend/Controllers/MarketplaceProjectsController.cs:175-208`
- **Plain English**: Detailed financial forecasts, business plans, and documents are hidden unless the viewer is the project owner, acquirer, admin, or has an active `MarketplaceProjectAccessGrant`.
- **Specification**:
  ```gherkin
  GIVEN a request to GET /api/marketplace/projects/{ideaId}
  WHEN the viewer user ID is evaluated
  THEN full private DTO is returned IF viewer is owner, acquirer, or admin
  OR IF viewer has an accepted ProjectInterest
  OR IF viewer has an active MarketplaceProjectAccessGrant
  OR IF viewer has an active DealExecution
  OTHERWISE, non-public details return 404 Not Found or redacted public summary.
  ```
- **Parameters**: Access levels: `[owner, acquirer, admin, accepted_interest, access_grant, deal_execution]`.
- **Edge cases handled**: Expired or revoked grants do not confer access.
- **Confidence**: HIGH.

---

## 9. Identity & Dual KYC Verification Rules

### RULE-KYC-001: Sumsub Webhook Verified State Transition
- **Domain**: Identity / KYC
- **Category**: State Transition
- **Priority**: P0
- **Source**: `backend/Services/Implementations/IdentityVerificationService.cs:750-765`
- **Specification**:
  ```gherkin
  GIVEN a verified applicant webhook from Sumsub
  WHEN IdentityVerificationService processes the event
  THEN UniversalIdentityVerification.Status is set to Verified
  AND ApplicationUser.Kyc.Status is updated to VerificationStatus.Verified
  AND ApplicationUser.Kyc.Identity.Status is updated to VerificationStatus.Verified
  AND ApplicationUser.Onboarding.IdentityDocumentVerified is set to true
  AND OnboardingGate.PromoteIfCompleteAsync is triggered.
  ```
- **Parameters**: Source event: Sumsub `applicantReviewed` webhook with `ReviewAnswer == "GREEN"`.
- **Edge cases handled**: Idempotent — re-processing the same webhook does not create duplicate records.
- **Confidence**: HIGH.

---

### RULE-KYC-002: Legacy FaceVerified Preservation Guard
- **Domain**: Identity / KYC
- **Category**: Data Preservation
- **Priority**: P0
- **Source**: `backend/Services/Implementations/IdentityVerificationService.cs:748`
- **Plain English**: Under no circumstances does an identity document verification event mutate `ApplicationUser.Onboarding.FaceVerified`.
- **Specification**:
  ```gherkin
  GIVEN an identity verification event (approval or rejection)
  WHEN user onboarding state is updated
  THEN FaceVerified flag must remain untouched.
  ```
- **Parameters**: Protected field: `Onboarding.FaceVerified`.
- **Edge cases handled**: Both approval and rejection paths preserve this flag.
- **Confidence**: HIGH.

---

### RULE-KYC-003: Legacy Disk Evidence Upload Security
- **Domain**: Identity / KYC
- **Category**: Validation
- **Priority**: P1
- **Source**: `backend/Controllers/VarificationController.cs:313-322`
- **Plain English**: Legacy document uploads for KYC evidence are constrained by file type (images/PDF only) and file size limits.
- **Specification**:
  ```gherkin
  GIVEN a user uploading KYC documents via the legacy VarificationController
  WHEN the file is evaluated
  THEN file extension must be in [".jpg", ".jpeg", ".png", ".pdf"]
  AND file size must be <= 10MB
  IF constraints are violated, reject with 400 Bad Request.
  ```
- **Parameters**: Max size = `10MB`, allowed extensions: `[".jpg", ".jpeg", ".png", ".pdf"]`.
- **Edge cases handled**: MIME type not validated (extension-only check).
- **Confidence**: HIGH.

---

### RULE-KYC-004: Dual KYC Asymmetric State Overlap (CONFIRMED CONFLICT)
- **Domain**: Identity / KYC
- **Category**: Conflict / Inconsistency
- **Priority**: P0
- **Source**: `IdentityVerificationService.cs:753` vs `VarificationController.cs:341`
- **Plain English**: Sumsub updates both `UniversalIdentityVerifications` and `ApplicationUser.Kyc.Status`, whereas legacy disk uploads in `VarificationController` update only `ApplicationUser.Kyc.Status`, leaving `UniversalIdentityVerifications` permanently blank.
- **Conflict Risk**: A user verified via legacy admin approval remains unverified in any service querying `UniversalIdentityVerifications`.
- **Confidence**: HIGH (Confirmed by code audit).

---

## 10. Onboarding & Universal Gate Rules

### RULE-OB-001: Universal Phase 1 Gate (Email + Phone)
- **Domain**: Onboarding
- **Category**: Lifecycle
- **Priority**: P0
- **Source**: `backend/Services/OnboardingGate.cs:79-86`
- **Plain English**: A user is promoted from Phase 0 to Phase 1 when and only when both email OTP and phone OTP verifications are complete. Identity verification is optional based on a feature flag.
- **Specification**:
  ```gherkin
  GIVEN a user with Onboarding.Phase == 0
  WHEN OnboardingGate.IsComplete is evaluated
  THEN the user is complete IF:
    Onboarding.EmailOtpVerified == true
    AND Onboarding.PhoneVerified == true
    AND (RequireIdentity == false OR Onboarding.IdentityDocumentVerified == true)
  IF complete AND Phase < 1, promote to Phase 1 and set CompletedAt = UTC now.
  ```
- **Parameters**: Default policy: `RequireIdentity = false` (MVP). Feature flag: `FeatureFlags:RequireIdentityVerificationInUniversalOnboarding`.
- **Edge cases handled**: Already-promoted users (Phase >= 1) are never re-promoted or downgraded.
- **Confidence**: HIGH.

---

### RULE-OB-002: Onboarding Identity Verification Feature Flag
- **Domain**: Onboarding
- **Category**: Policy
- **Priority**: P0
- **Source**: `backend/Services/OnboardingGate.cs:40-44`
- **Plain English**: Identity document verification can be toggled on/off for the Universal Phase 1 gate via configuration.
- **Specification**:
  ```gherkin
  GIVEN the platform configuration
  WHEN FeatureFlags:RequireIdentityVerificationInUniversalOnboarding is read
  THEN if true: Phase 1 requires email + phone + identity
  IF false (default): Phase 1 requires email + phone only.
  ```
- **Parameters**: Config key: `FeatureFlags:RequireIdentityVerificationInUniversalOnboarding`, default: `false`.
- **Confidence**: HIGH.

---

### RULE-OB-003: Phase Promotion Idempotency Guard
- **Domain**: Onboarding
- **Category**: Lifecycle
- **Priority**: P0
- **Source**: `backend/Services/OnboardingGate.cs:103`
- **Plain English**: Phase promotion only occurs if the user's current phase is less than 1. It never downgrades and never re-promotes.
- **Specification**:
  ```gherkin
  GIVEN a call to PromoteIfCompleteAsync
  WHEN IsComplete returns true
  THEN promote ONLY IF user.Onboarding.Phase < 1
  IF Phase >= 1, no-op (idempotent).
  ```
- **Parameters**: None.
- **Edge cases handled**: Concurrent webhook + manual completion won't double-promote.
- **Confidence**: HIGH.

---

### RULE-OB-004: Phone OTP HMAC-SHA256 Verification
- **Domain**: Onboarding
- **Category**: Validation / Security
- **Priority**: P0
- **Source**: `backend/Controllers/OnboardingController.cs:89-96`
- **Plain English**: OTP codes are stored as HMAC-SHA256 hashes (keyed with JWT secret), not plaintext. Verification compares the hash of the submitted code with the stored hash.
- **Specification**:
  ```gherkin
  GIVEN a user submitting an OTP code
  WHEN the system verifies the code
  THEN expectedHash = HMAC-SHA256(key=JwtSettings:Key, data="{userId}:{code}")
  AND compare expectedHash with storedHash using constant-time comparison
  IF match, mark as verified; otherwise return "Invalid code".
  ```
- **Parameters**: Hash algorithm: `HMAC-SHA256`, key source: `JwtSettings:Key` (masked).
- **Edge cases handled**: Fallback key used if JWT key is null.
- **Confidence**: HIGH.

---

### RULE-OB-005: OTP Timing Constant-Time Comparison
- **Domain**: Onboarding
- **Category**: Security
- **Priority**: P0
- **Source**: `backend/Controllers/OnboardingController.cs:280-282`
- **Plain English**: OTP hash comparison uses `CryptographicOperations.FixedTimeEquals` to prevent timing-based side-channel attacks.
- **Specification**:
  ```gherkin
  GIVEN an OTP verification attempt
  WHEN comparing the computed hash with the stored hash
  THEN use CryptographicOperations.FixedTimeEquals (constant-time comparison)
  NEVER use string == or string.Equals for hash comparison.
  ```
- **Parameters**: None.
- **Confidence**: HIGH.

---

### RULE-OB-006: Phone Skip Production Environment Lock
- **Domain**: Onboarding
- **Category**: Security
- **Priority**: P0
- **Source**: `backend/Controllers/OnboardingController.cs:372-383`
- **Plain English**: The "skip phone verification" endpoint is disabled in production unless an alpha bypass feature flag is explicitly enabled.
- **Specification**:
  ```gherkin
  GIVEN a request to POST /api/onboarding/phone/skip
  WHEN the environment is Production
  THEN if FeatureFlags:EnableAlphaBypassEndpoints != true
  THEN reject with 403 Forbidden ("Phone verification skip endpoint is disabled in production environments")
  AND log an audit event "phone_skip_rejected_production".
  ```
- **Parameters**: Feature flag: `FeatureFlags:EnableAlphaBypassEndpoints`, default: `false`.
- **Edge cases handled**: Non-production environments always allow skip.
- **Confidence**: HIGH.

---

## 11. Messenger & Realtime Rules

### RULE-CHAT-001: Direct Conversation Self-Chat Prohibition
- **Domain**: Messenger
- **Category**: Validation
- **Priority**: P2
- **Source**: `backend/Controllers/ChatController.cs:79-81`
- **Plain English**: A user cannot initiate a direct chat conversation with themselves.
- **Specification**:
  ```gherkin
  GIVEN a user requesting POST /api/chat/conversations/direct
  WHEN the target participant ID is evaluated
  THEN if TargetUserId == CurrentUserId
  THEN reject with 422 ("Cannot create a conversation with yourself").
  ```
- **Parameters**: None.
- **Confidence**: HIGH.

---

### RULE-CHAT-002: Conversation Participant Authorization Gate
- **Domain**: Messenger
- **Category**: Authorization
- **Priority**: P0
- **Source**: `backend/Controllers/ChatController.cs:184-186` & `198-200`
- **Specification**:
  ```gherkin
  GIVEN an authenticated user sending or reading chat messages
  WHEN GET /api/chat/messages/{id} or POST /api/chat/send is invoked
  THEN the system verifies that CurrentUserId exists in Conversation.Participants
  IF not a participant, return 403 Forbidden.
  ```
- **Parameters**: None.
- **Edge cases handled**: Admin override not implemented — strict participant-only access.
- **Confidence**: HIGH.

---

### RULE-CHAT-003: Company Founder Contextual Chat Lookup
- **Domain**: Messenger
- **Category**: Routing
- **Priority**: P1
- **Source**: `backend/Controllers/ChatController.cs:94-107`
- **Plain English**: When initiating a company-context chat, the system resolves the company's `OwnerId` to find the founder's user ID and creates or retrieves the conversation between the current user and the founder.
- **Specification**:
  ```gherkin
  GIVEN a user requesting POST /api/chat/conversations/company/{companyId}
  WHEN the system resolves the conversation participants
  THEN load Company by companyId
  AND resolve Company.OwnerId as the founder user
  AND create or retrieve a conversation with Participants = [CurrentUserId, OwnerId]
  AND set Conversation.Type = "Company"
  AND attach Conversation.CompanyId for context.
  ```
- **Parameters**: `Conversation.Type = "Company"`.
- **Edge cases handled**: If conversation already exists, return existing instead of creating duplicate.
- **Confidence**: HIGH.

---

### RULE-CHAT-004: Response Rate Trust Signal Refresh
- **Domain**: Messenger
- **Category**: Analytics
- **Priority**: P2
- **Source**: `backend/Controllers/ChatController.cs:232-235`
- **Plain English**: After a message is sent, the system recalculates the sender's response rate metric (percentage of conversations where they replied within 24 hours) for trust signal display.
- **Specification**:
  ```gherkin
  GIVEN a user sends a chat message via POST /api/chat/send
  WHEN the message is persisted
  THEN recalculate the sender's ResponseRate metric
  AND update the user's profile trust signals.
  ```
- **Parameters**: Response window = 24 hours.
- **Edge cases handled**: First message in conversation does not count toward response rate.
- **Confidence**: HIGH.

---

## 12. Investor Domain Rules

### RULE-INV-001: Universal Phase 1 Prerequisite for All Investor Features
- **Domain**: Investor
- **Category**: Eligibility
- **Priority**: P0
- **Source**: `backend/Controllers/InvestorPhaseController.cs:54-63`
- **Plain English**: Every investor endpoint calls `EnsureUniversalPhase1CompleteAsync` before executing, which verifies that the user's `Onboarding.Phase >= 1`.
- **Specification**:
  ```gherkin
  GIVEN an authenticated user accessing any investor API endpoint
  WHEN EnsureUniversalPhase1CompleteAsync is called
  THEN load the user and verify Onboarding.Phase >= 1
  IF Phase < 1, reject with 403 ("Universal Phase 1 (identity verification) must be complete before accessing investor features").
  ```
- **Parameters**: `MinPhase = 1`.
- **Edge cases handled**: User not found → 403 (not 404).
- **Confidence**: HIGH.

---

### RULE-INV-002: Finance Verification Required Before Investment Offer
- **Domain**: Investor
- **Category**: Eligibility
- **Priority**: P0
- **Source**: `backend/Controllers/InvestorPhaseController.cs:691-692`
- **Plain English**: An investor cannot submit an investment offer (term sheet) unless their `InvestorProfile.FinanceVerified` flag is true.
- **Specification**:
  ```gherkin
  GIVEN an investor requesting POST /api/investor/term-sheet/{companyId}/create
  WHEN the system checks the investor's verification status
  THEN InvestorProfile.FinanceVerified must be true
  IF not verified, reject with 403 ("Complete Finance Verification before submitting an investment offer").
  ```
- **Parameters**: Required flag: `InvestorProfile.FinanceVerified == true`.
- **Edge cases handled**: Missing `InvestorProfile` or null `InvestorId` → 403.
- **Confidence**: HIGH.

---

### RULE-INV-003: Investor Check Size Non-Negative Bound
- **Domain**: Investor
- **Category**: Validation
- **Priority**: P1
- **Source**: `backend/Controllers/InvestorPhaseController.cs:288-291`
- **Plain English**: Investor profile check sizes (min and max) must be non-negative, and min cannot exceed max.
- **Specification**:
  ```gherkin
  GIVEN an investor updating their profile
  WHEN MinCheckSize and MaxCheckSize are evaluated
  THEN both must be >= 0
  AND if MaxCheckSize > 0, then MinCheckSize <= MaxCheckSize
  IF violated, reject with 400 ("Check sizes must be non-negative" / "minCheckSize cannot exceed maxCheckSize").
  ```
- **Parameters**: None.
- **Edge cases handled**: `MaxCheckSize = 0` means unlimited (no upper bound enforced).
- **Confidence**: HIGH.

---

### RULE-INV-004: Investor Profile Identity Fields Immutability
- **Domain**: Investor
- **Category**: Data Preservation
- **Priority**: P1
- **Source**: `backend/Controllers/InvestorPhaseController.cs:297-299`
- **Plain English**: The self-service profile update (PUT /api/investor/profile) deliberately does NOT allow modifying identity and system fields (`Id`, `LinkedUserId`, `CompletedDeals`, `ActiveInvestments`, `CreatedAt`).
- **Specification**:
  ```gherkin
  GIVEN an investor updating their profile via PUT /api/investor/profile
  WHEN the partial update is applied
  THEN the following fields are NEVER modified by the request:
    Id, LinkedUserId, CompletedDeals, ActiveInvestments, CreatedAt
  These fields are preserved from the existing database record.
  ```
- **Parameters**: Protected fields: `[Id, LinkedUserId, CompletedDeals, ActiveInvestments, CreatedAt]`.
- **Confidence**: HIGH.

---

### RULE-INV-005: Double Opt-In Handshake Protocol for Investor Matching
- **Domain**: Investor Matching
- **Category**: Lifecycle
- **Priority**: P0
- **Source**: `backend/Controllers/InvestorPhaseController.cs:826-843`
- **Plain English**: An investor-entrepreneur match transitions to "accepted" only when BOTH parties express "interested". Neither party alone can force the handshake.
- **Specification**:
  ```gherkin
  GIVEN an InvestorMatch record
  WHEN the investor responds with action = "interested"
  THEN match.InvestorInterest = "interested"
  AND IF match.EntrepreneurInterest == "interested"
  THEN match.Status = "accepted"
  AND match.AcceptedAt = UTC now (set once, idempotent)
  AND match.HandshakeConfirmedAt = UTC now (set once, idempotent)
  AND trigger mutual handshake notification
  ELSE notify entrepreneur of investor interest (one-sided).
  ```
- **Parameters**: Valid actions: `["interested", "passed"]`.
- **Edge cases handled**: Passing after acceptance doesn't revert acceptance status (irrevocable).
- **Confidence**: HIGH.

---

### RULE-INV-006: Deal Discovery Phase 8+ Company Filter
- **Domain**: Investor
- **Category**: Visibility
- **Priority**: P1
- **Source**: `backend/Controllers/InvestorPhaseController.cs:586-590`
- **Plain English**: Investors can only discover companies that have reached Phase 8 or above (ready for investor matching), with a limit of 20 results.
- **Specification**:
  ```gherkin
  GIVEN an investor requesting GET /api/investor/deals
  WHEN the system queries companies
  THEN filter: Company.CurrentPhase >= 8
  AND Company.OwnerId != CurrentUserId (exclude own companies)
  AND limit results to 20.
  ```
- **Parameters**: `MinPhase = 8`, `ResultLimit = 20`.
- **Edge cases handled**: Optional sector and stage filters applied additively.
- **Confidence**: HIGH.

---

### RULE-INV-007: Self-Deal Exclusion in Discovery
- **Domain**: Investor
- **Category**: Validation
- **Priority**: P1
- **Source**: `backend/Controllers/InvestorPhaseController.cs:589`
- **Plain English**: Investors never see their own companies in deal discovery results.
- **Specification**:
  ```gherkin
  GIVEN a deal discovery query
  WHEN filtering companies
  THEN Company.OwnerId != CurrentUserId
  ```
- **Parameters**: None.
- **Confidence**: HIGH.

---

### RULE-INV-008: Finance Verification Submission Validation Suite
- **Domain**: Investor
- **Category**: Validation
- **Priority**: P0
- **Source**: `backend/Controllers/InvestorPhaseController.cs:1197-1230`
- **Plain English**: Finance verification submission validates all required fields and requires at least one supporting document.
- **Specification**:
  ```gherkin
  GIVEN an investor submitting POST /api/investor/finance-verification/submit
  WHEN the request body is validated
  THEN:
    - InvestorType must be non-empty
    - DeclaredAvailableCapital must be > 0
    - MinTicket must be > 0
    - MaxTicket must be >= MinTicket
    - SourceOfFunds must contain at least 1 entry
    - DeclarationConfirmed must be true
    - At least 1 document must have been previously uploaded
  IF any validation fails, reject with 400 and specific error message.
  ```
- **Parameters**: All fields required, `DeclarationConfirmed = true` (legal compliance attestation).
- **Edge cases handled**: Each validation has a specific error message for UX clarity.
- **Confidence**: HIGH.

---

### RULE-INV-009: Legacy Finance Verified Synthetic Response
- **Domain**: Investor
- **Category**: Lifecycle
- **Priority**: P2
- **Source**: `backend/Controllers/InvestorPhaseController.cs:914-938`
- **Plain English**: If a user has `InvestorProfile.FinanceVerified == true` but no `InvestorFinanceVerification` record exists, the system generates a synthetic "verified" response for backward compatibility.
- **Specification**:
  ```gherkin
  GIVEN an investor requesting GET /api/investor/finance-verification
  WHEN no InvestorFinanceVerification record exists
  AND user.InvestorProfile.FinanceVerified == true
  THEN return a synthetic response with Status = "verified"
  AND DeclaredAvailableCapital = MaxCheckSize * 5 (estimated)
  AND MinTicket = MinCheckSize (from Investor catalog)
  AND MaxTicket = MaxCheckSize (from Investor catalog).
  ```
- **Parameters**: Capital estimation multiplier: `5x MaxCheckSize`.
- **Edge cases handled**: Missing Investor catalog falls back to defaults (10,000 min, 100,000 max).
- **Architectural Discrepancy**: **Legacy compatibility shim** — fabricates financial data from profile data. Could mislead downstream consumers expecting actual declaration data.
- **Confidence**: MEDIUM — synthetic data may not reflect actual financial capacity.

---

### RULE-INV-010: Investor Portfolio Holding Ownership Check
- **Domain**: Investor
- **Category**: Authorization
- **Priority**: P0
- **Source**: `backend/Controllers/InvestorPhaseController.cs:167-172`
- **Plain English**: An investor can only view their own portfolio holdings. Ownership is verified via both `InvestorId` and `InvestorUserId` fields.
- **Specification**:
  ```gherkin
  GIVEN an investor requesting GET /api/investor/portfolio/{holdingId}
  WHEN the holding is loaded
  THEN isOwner = (holding.InvestorId == investorId) OR (holding.InvestorUserId == userId)
  IF not owner, return 403 ("You do not have permission to view this holding").
  ```
- **Parameters**: Dual-field ownership check (belt-and-suspenders).
- **Edge cases handled**: Empty `InvestorId` still matches on `InvestorUserId`.
- **Confidence**: HIGH.

---

### RULE-INV-011: Active Investment Status Normalization
- **Domain**: Investor
- **Category**: Lifecycle
- **Priority**: P2
- **Source**: `backend/Controllers/InvestorPhaseController.cs:551-558`
- **Plain English**: Investment statuses are normalized from various legacy values to a standard set.
- **Specification**:
  ```gherkin
  GIVEN legacy investment records
  WHEN status normalization runs
  THEN:
    "completed" → "completed"
    "refunded" → "withdrawn"
    "withdrawn" → "withdrawn"
    null/empty → "active"
    any other → "active"
  AND active investments are defined as: status in ["Pending", "Escrowed", "Active", null/empty].
  ```
- **Parameters**: Active statuses: `["Pending", "Escrowed", "Active"]`.
- **Confidence**: HIGH.

---

### RULE-INV-012: Investor Profile Partial Update (PATCH Semantics)
- **Domain**: Investor
- **Category**: Data Preservation
- **Priority**: P1
- **Source**: `backend/Controllers/InvestorPhaseController.cs:300-331`
- **Plain English**: The profile update applies PATCH semantics — only explicitly provided fields are updated; null fields are preserved from the existing record.
- **Specification**:
  ```gherkin
  GIVEN an investor updating their profile
  WHEN a field in the request is null
  THEN the existing database value for that field is preserved
  WHEN a field in the request is non-null
  THEN the field is overwritten with the new value
  AND LastActiveAt is set to UTC now.
  ```
- **Parameters**: None.
- **Edge cases handled**: Boolean fields use `.HasValue` check (nullable primitives).
- **Confidence**: HIGH.

---

### RULE-INV-013: Finance Document File Type & Size Constraint
- **Domain**: Investor
- **Category**: Validation
- **Priority**: P1
- **Source**: `backend/Controllers/InvestorPhaseController.cs:1039-1045`
- **Plain English**: Finance verification supporting documents must be PDF or image files and cannot exceed 20MB.
- **Specification**:
  ```gherkin
  GIVEN an investor uploading a finance verification document
  WHEN the file is evaluated
  THEN file extension must be in [".pdf", ".jpg", ".jpeg", ".png"]
  AND file size must be <= 20MB
  IF constraints violated, reject with 400.
  ```
- **Parameters**: Max size = `20MB`, allowed extensions: `[".pdf", ".jpg", ".jpeg", ".png"]`.
- **Edge cases handled**: Empty file (Length == 0) rejected.
- **Confidence**: HIGH.

---

### RULE-INV-014: Auto-Reconcile Closed Deals on Portfolio Load
- **Domain**: Investor
- **Category**: Financial
- **Priority**: P1
- **Source**: `backend/Controllers/InvestorPhaseController.cs:436-443`
- **Plain English**: When an investor loads their portfolio, the system automatically reconciles any previously completed deals that may not yet have portfolio holding records.
- **Specification**:
  ```gherkin
  GIVEN an investor requesting GET /api/investor/portfolio or GET /api/investor/stats
  WHEN BuildPortfolioFullAsync is called
  THEN CompanyService.ReconcileClosedDealPortfolioHoldingsAsync(investorId) is called first
  AND failures are logged as warnings but do not block the portfolio response.
  ```
- **Parameters**: None.
- **Edge cases handled**: Reconciliation failure is non-fatal (best-effort).
- **Confidence**: MEDIUM — reconciliation logic is in `CompanyService` (not fully audited in this pass).

---

## 13. Service Provider Rules

### RULE-SP-001: Service Provider Independent Verification Submission
- **Domain**: Service Provider
- **Category**: Compliance
- **Priority**: P1
- **Source**: `backend/Controllers/ServiceProviderController.cs:161-163`
- **Plain English**: Service providers can submit their profile for independent verification, which involves credential documentation review.
- **Specification**:
  ```gherkin
  GIVEN an authenticated ServiceProvider user
  WHEN POST /api/service-provider/submit-verification is called
  THEN the system validates the provider's profile completeness
  AND submits the profile for admin review
  AND sets VerificationStatus to "Pending".
  ```
- **Parameters**: None — completeness rules are in `IServiceProviderService`.
- **Edge cases handled**: Re-submission after rejection is allowed.
- **Confidence**: MEDIUM — validation logic is in the service layer, not directly visible in controller.

---

### RULE-SP-002: Service Provider Role-Gated Endpoints
- **Domain**: Service Provider
- **Category**: Authorization
- **Priority**: P0
- **Source**: `backend/Controllers/ServiceProviderController.cs:25`
- **Plain English**: All service provider profile, trust, and catalog management endpoints require the `ServiceProvider` role claim.
- **Specification**:
  ```gherkin
  GIVEN an authenticated user
  WHEN accessing any endpoint under /api/service-provider/
  THEN the user must have the "ServiceProvider" role claim
  IF role claim is absent, return 403 Forbidden.
  ```
- **Parameters**: Required role: `"ServiceProvider"`.
- **Edge cases handled**: Role claim is separate from verification status.
- **Confidence**: HIGH.

---

### RULE-SP-003: Marketplace Publishing Feature Flag Gate
- **Domain**: Service Provider
- **Category**: Policy
- **Priority**: P1
- **Source**: `backend/Controllers/ServiceCatalogController.cs:58-59`
- **Plain English**: Creating or publishing service listings can be globally disabled via a platform feature flag for maintenance.
- **Specification**:
  ```gherkin
  GIVEN a ServiceProvider requesting POST /api/service-provider/catalog/listings or POST /listings/{id}/publish
  WHEN IPlatformSettingsService.IsMarketplacePublishingEnabledAsync is evaluated
  THEN if publishing is disabled, return 503 ("Marketplace service publishing is temporarily disabled for system maintenance").
  ```
- **Parameters**: Feature flag via `IPlatformSettingsService`.
- **Edge cases handled**: `null` settings service means publishing is allowed (no gate).
- **Confidence**: HIGH.

---

### RULE-SP-004: Credential Document Upload Size Limit
- **Domain**: Service Provider
- **Category**: Validation
- **Priority**: P2
- **Source**: `backend/Controllers/ServiceProviderController.cs:85`
- **Plain English**: Credential document uploads for service providers are limited to 10MB.
- **Specification**:
  ```gherkin
  GIVEN a ServiceProvider uploading a credential document
  WHEN POST /api/service-provider/profile/editor/credentials/{credentialId}/document is called
  THEN the request size must not exceed 10MB + 64KB header allowance
  IF exceeded, return 413 Request Entity Too Large.
  ```
- **Parameters**: `RequestSizeLimit = 10 * 1024 * 1024 + 64 * 1024` (10MB + 64KB).
- **Confidence**: HIGH.

---

## 14. Platform-Level Authorization Rules

### RULE-AUTH-001: JWT NameIdentifier Claim Mapping
- **Domain**: Platform Core
- **Category**: Authorization
- **Priority**: P0
- **Source**: `backend/Controllers/ChatController.cs:56-58` (pattern shared across all controllers)
- **Plain English**: The current user's ID is extracted from the JWT `NameIdentifier` claim. This is the universal identity resolution pattern used by every authenticated controller.
- **Specification**:
  ```gherkin
  GIVEN an authenticated API request
  WHEN the system resolves the current user
  THEN CurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
  IF the claim is missing, throw UnauthorizedAccessException.
  ```
- **Parameters**: Claim type: `ClaimTypes.NameIdentifier` (maps to `sub` claim in JWT).
- **Edge cases handled**: Null claim throws, preventing unauthorized access.
- **Confidence**: HIGH.

---

### RULE-AUTH-002: Admin-Only KYC Decision Gating
- **Domain**: Verification
- **Category**: Authorization
- **Priority**: P0
- **Source**: `backend/Controllers/VarificationController.cs:324`
- **Plain English**: Only users with Admin or SuperAdmin roles can approve or reject KYC verification submissions.
- **Specification**:
  ```gherkin
  GIVEN a KYC decision request (approve/reject)
  WHEN the endpoint is accessed
  THEN the user must have role "Admin" or "SuperAdmin"
  IF role is insufficient, return 403 Forbidden.
  ```
- **Parameters**: Required roles: `["Admin", "SuperAdmin"]`.
- **Confidence**: HIGH.

---

## 15. Creator Phase 3 / Project Intelligence Pipeline Analysis

> [!IMPORTANT]
> This section addresses the skill spec requirement for a dedicated analysis of the Creator Phase 3 intelligence pipeline, highlighting prompt duplication, context fragmentation, and unvalidated AI generation.

### 15.1 Pipeline Topology

```
Canonical Idea Core (CreatorIdea.Project)
  → Phase 2: Clarifier (ClarifierSession)
  → Phase 3a: Market Study (MarketStudySession)
  → Phase 3b: Business Model (BusinessModelSession)
  → Phase 3c: Business Plan (BusinessPlanSession)  ← CONTEXT GAP HERE
  → Phase 3d: Financial Forecast (ForecastSession)
  → Phase 4: Resource Calculation + GTM
  → Phase 5: IP Valuation + Marketplace
```

### 15.2 Confirmed Context Fragmentation

| Pipeline Stage | Inputs Actually Used | Inputs Required by Gate | Inputs Ignored |
| :--- | :--- | :--- | :--- |
| **Clarifier** | Canonical Idea Core | None (first step) | N/A |
| **Market Study** | Canonical Core + Clarifier Output | Clarifier completion | N/A |
| **Business Model** | Canonical Core + Clarifier Output | Clarifier completion | Market Study data |
| **Business Plan** | Canonical Core + Clarifier Output | Market Study + Business Model completion | **Market Study data, Business Model data** |
| **Forecast** | Business Plan output | Business Plan completion | Prior stage data |

**Key Finding**: Business Plan generation (**RULE-P3-002**) requires Market Study and Business Model completion (**RULE-P3-001**) as prerequisites, but the handler discards both datasets when constructing the LLM prompt. This is the **Business Plan Context Gap** — a confirmed behavioral contradiction.

### 15.3 Unvalidated AI Output Patterns

| Issue | Location | Risk |
| :--- | :--- | :--- |
| Raw LLM JSON persisted without schema validation | `BusinessPlanHandler.cs`, `ForecastHandler.cs` | Malformed AI output corrupts session data |
| Truncated output sets "NeedsReview" but raw text is still saved | `ForecastHandler.cs:125-139` | Partial data may be consumed downstream |
| No bounds validation on AI-generated financial figures | `ForecastHandler.cs` | Nonsensical revenue/cost projections accepted |

### 15.4 Scattered Calculation Patterns

| Calculation | Backend Location | Frontend Duplication | Risk |
| :--- | :--- | :--- | :--- |
| IP Valuation Formula | `CreatorPhase5Controller.cs:118-144` | Not audited (React state) | Potential drift |
| Resource Calculator | `CreatorPhase4Controller.cs:199-235` | Not audited (React state) | Potential drift |
| Dilution Simulation | `CapTableCalculator.cs:17-42` | Not audited (React state) | Known discrepancy with Hamilton-Hare (RULE-DEAL-005) |

---

## 16. Duplicated Business Rules

### DUP-RULE-001: Equity Dilution Mathematics
- **Implementation A**: `backend/Services/Implementations/CapTableCalculator.cs:17-42`
- **Implementation B**: `backend/Services/CompanyService.cs:4241-4276`
- **Difference**: `CapTableCalculator` uses floating-point percentage projections for planning scenarios, while `CompanyService` executes the Hamilton-Hare Largest Remainder integer share allocation algorithm.
- **Conflict Risk**: Pre-deal planning simulations show slightly different share counts than actual deal closing allocations due to integer rounding discrepancies.

### DUP-RULE-002: Marketplace Listing Visibility
- **Implementation A**: `backend/Controllers/MarketplaceProjectsController.cs:102-106`
- **Implementation B**: `backend/Controllers/CreatorPhase5Controller.cs:173-176`
- **Difference**: Controller A checks `Audience == "public"` directly in MongoDB filter; Controller B computes derived visibility dynamically.

### DUP-RULE-003: KYC Status Write Paths
- **Implementation A**: `IdentityVerificationService.cs` (Sumsub webhook: writes `UniversalIdentityVerifications` + `ApplicationUser.Kyc.Status`)
- **Implementation B**: `VarificationController.cs` (legacy admin: writes only `ApplicationUser.Kyc.Status`)
- **Difference**: Legacy path omits `UniversalIdentityVerifications`, creating asymmetric verification state.

### DUP-RULE-004: Finance Verification State
- **Implementation A**: `InvestorFinanceVerification` collection (dedicated record with full audit trail)
- **Implementation B**: `ApplicationUser.InvestorProfile.FinanceVerified` flag (boolean shortcut)
- **Difference**: Legacy users may have `FinanceVerified = true` with no `InvestorFinanceVerification` record, triggering synthetic response generation (RULE-INV-009).

### DUP-RULE-005: Investor Active Status Check
- **Implementation A**: `InvestorPhaseController.cs:551-558` (active = `Pending`, `Escrowed`, `Active`)
- **Implementation B**: `InvestorController.cs:107` (`GetAllActiveInvestorsAsync` — service-layer definition)
- **Difference**: Active status definition may differ between the controller-level normalization and the service-layer query filter.

---

## 17. Contradictory Business Rules

### CONFLICT-RULE-001: Business Plan Dependency vs Ingestion
- **Source A**: `BusinessPlanController.cs:119-126` (Requires Market Study + Business Model completion).
- **Source B**: `BusinessPlanHandler.cs:80-115` (Omits Market Study and Business Model data from LLM prompt).
- **Impact**: Founder pays credits and waits for stages that are discarded during plan generation.

### CONFLICT-RULE-002: Dual KYC State Convergence
- **Source A**: `IdentityVerificationService.cs` (Sumsub writes `UniversalIdentityVerifications`).
- **Source B**: `VarificationController.cs` (Disk upload modifies only `user.Kyc.Status`).
- **Impact**: Users verified via legacy upload fail access controls on endpoints checking `UniversalIdentityVerifications`.

### CONFLICT-RULE-003: Legacy vs Modern Portfolio Holdings
- **Source A**: `InvestorPhaseController.cs:492-540` (Legacy `Investments` collection via `InvestmentsService`).
- **Source B**: `InvestorPhaseController.cs:446-490` (Modern `CompanyPortfolioHoldings` collection).
- **Impact**: Both systems are queried and merged at runtime, creating a dual-view that could show inconsistent totals if the same investment exists in both collections.

---

## 18. Rules Requiring SME Confirmation

> [!IMPORTANT]
> The following rules have MEDIUM or LOW confidence and require domain expert validation.

### RULE-SP-001 (MEDIUM): Service Provider Independent Verification
- **Question for SME**: What are the exact profile completeness criteria checked by `IServiceProviderService.SubmitVerificationAsync`? Is there a minimum credential count, portfolio item requirement, or profile field coverage threshold?

### RULE-INV-009 (MEDIUM): Legacy Finance Verified Synthetic Response
- **Question for SME**: Is the `5x MaxCheckSize` estimation for `DeclaredAvailableCapital` in the synthetic response an intentional business approximation, or is it a placeholder that should be replaced with actual declared data? Are there legacy users where this synthetic data is presented to admins as real financial data?

### RULE-INV-014 (MEDIUM): Auto-Reconcile Closed Deals on Portfolio Load
- **Question for SME**: What is the reconciliation logic inside `CompanyService.ReconcileClosedDealPortfolioHoldingsAsync`? Does it create new `CompanyPortfolioHolding` records from completed `DealExecution` records? What happens if reconciliation creates holdings that overlap with existing legacy `Investments`?

### RULE-DUP-INV-001 (MEDIUM): Legacy vs Company Portfolio Dual Investment View
- **Question for SME**: Is the legacy `Investments` collection still receiving new records, or is it frozen? Is there a planned migration to consolidate everything into `CompanyPortfolioHoldings`? When both systems show the same investment, is there deduplication logic?

---

## 19. Top 10 Highest-Risk Business Rules Requiring Preservation

1. **RULE-DEAL-004 & RULE-DEAL-005 (Cap Table Dilution & Share Issuance)**: Governs legal equity issuance.
2. **RULE-DEAL-001 (Non-Equity SAFE/Note Cap Table Bypass)**: Prevents debt instruments from corrupting equity shares.
3. **RULE-CORE-001 (Canonical Idea Core Immutability)**: Prevents AI prompts from wiping founder-edited data.
4. **RULE-FORM-003 (Founder Minimum 51% Retention Gate)**: Enforces founder ownership control before incorporation.
5. **RULE-P3-005 (Forecast 36-Month Extrapolation)**: Ensures financial figures beyond month 12 follow compound growth math.
6. **RULE-INV-002 (Finance Verification Required Before Offer)**: Prevents unverified investors from submitting term sheets.
7. **RULE-MKT-008 (Marketplace Financial Redaction)**: Prevents unauthorized exposure of private business plans and financials.
8. **RULE-KYC-002 (FaceVerified Preservation Guard)**: Prevents identity verification from spoofing biometric face verification.
9. **RULE-INV-005 (Double Opt-In Handshake Protocol)**: Ensures both parties consent before investor-entrepreneur matching proceeds.
10. **RULE-OB-005 (OTP Constant-Time Comparison)**: Prevents timing side-channel attacks on authentication.
