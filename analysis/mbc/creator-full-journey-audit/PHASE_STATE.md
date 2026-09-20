# MBC Creator Journey — Phase State & Feature Implementation Inventory

**Audit Date**: 2026-09-20  
**Audit Scope**: Detailed state of Phase 1 through Phase 6 at HEAD  
**Status**: CONFIRMED at HEAD  

---

## 1. Executive Implementation Matrix

| Phase | Title | Overall Status | Primary Controller / Component | Key Artifacts Produced |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | Identity & Onboarding | **IMPLEMENTED** | `IdentityController.cs`, `SumsubService.cs`, `Phase1Client.tsx` | Identity Verification Record |
| **Phase 2** | Ideation & Brand Kit | **IMPLEMENTED** | `CreatorPhase2Controller.cs`, `BrandStudioPage.tsx` | Brand Kit, Logo SVG/PNG, Style Guide |
| **Phase 3** | Business Masterplan | **IMPLEMENTED** | `CreatorPhase3Controller.cs`, `CreatorPhase3AiService.cs` | Market Study, Business Model, Financial Forecast, Legal Checklist, Formation Memo, 12-Section Business Plan, Investor Scorecard |
| **Phase 4** | Offer, Pricing & GTM | **PARTIALLY IMPLEMENTED** | `CreatorPhase4Controller.cs`, `Phase4OfferPricingPage.tsx` | Pricing Schedule, Resource Plan, GTM Strategy & Task Checklist |
| **Phase 5** | Crossroads (Sell vs Build) | **IMPLEMENTED** | `CreatorPhase5Controller.cs`, `CrossroadsPage.tsx` | IP Marketplace Listing, SP Workroom Contracts, Company Formation Record |
| **Phase 6** | Investor Readiness & Level-Up | **IMPLEMENTED** | `CreatorPhase6Controller.cs`, `Phase6InvestorsPage.tsx` | Entrepreneur Profile, Cap Table Seed, Startup Entity Link |

---

## 2. Phase 2 Deep Audit (Ideation & Brand Kit)

### 2.1 Step Sequence at HEAD
The real step sequence in Phase 2 consists of 6 discrete screens:
1. `/dashboard/creator/phase-2/clarifier` — 6-question structured conversational questionnaire. Calls `POST /api/creator/phase-2/chat-message` and `POST /api/creator/phase-2/finalize-clarifier`.
2. `/dashboard/creator/phase-2/idea-summary` — Value proposition, problem statement, target audience summary review.
3. `/dashboard/creator/phase-2/concept-name` — AI naming generation (`POST /api/creator/phase-2/name-suggestions`, Redis rate-limited to 3 calls/lifetime) or custom manual entry.
4. `/dashboard/creator/phase-2/branding` — Selection screen with 3 paths:
   - Path 1: "Use Brand Studio" → routes to `/dashboard/creator/phase-2/brand-studio`
   - Path 2: "Hire an M50 Designer" → routes to `/dashboard/creator/phase-2/hire-designer`
   - Path 3: "Skip Branding" → calls `POST /api/creator/phase-2/branding/skip` and routes to `/complete`
5. `/dashboard/creator/phase-2/brand-studio` — 4-step AI generation flow: Direction → Logo Parameters → Color Palette → Typography. Produces SVG logo and visual tokens.
6. `/dashboard/creator/phase-2/complete` — Phase completion summary card; triggers unlock of Phase 3.

### 2.2 Dead & Orphaned Routes in Phase 2
- `/dashboard/creator/phase-2/logo-tool`: **Dead route**. Contains an immediate redirect (`router.replace('/dashboard/creator/phase-2/brand-studio')`).
- `/dashboard/creator/phase-2`: **Redirector route**. Contains an immediate redirect to `/clarifier`.

---

## 3. Phase 3 Deep Audit (Business Masterplan)

### 3.1 Step Order and Numbering
Phase 3 contains 7 consecutive steps, strictly numbered:
- **Step 3.1**: Market Study (`/dashboard/creator/phase-3/market-study`)
- **Step 3.2**: Business Model (`/dashboard/creator/phase-3/business-model`)
- **Step 3.3**: Financial Forecast (`/dashboard/creator/phase-3/forecast`)
- **Step 3.4**: Legal & Compliance (`/dashboard/creator/phase-3/compliance`)
- **Step 3.5**: Formation & Skills (`/dashboard/creator/phase-3/formation`)
- **Step 3.6**: Executive Business Plan (`/dashboard/creator/phase-3/business-plan`)
- **Step 3.7**: Masterplan Completion & Investor Readiness (`/dashboard/creator/phase-3/complete`)

### 3.2 Executive Business Plan: Section Count & Upstream Hydration
Generated at HEAD via `CreatorPhase3AiService.cs:GenerateBusinessPlanAsync` (`backend/Services/Implementations/CreatorPhase3AiService.cs:461-596`). It generates exactly **12 sections**:

| Section Number | Section Title | Hydration Source at HEAD |
| :--- | :--- | :--- |
| **12.1** | Executive Summary | Upstream Idea Concept + Market Study + Financial Forecast |
| **12.2** | Problem & Opportunity | Upstream Clarifier Problem Statement + Market Study Trends |
| **12.3** | Solution & Value Proposition | Upstream Idea Summary + Business Model Value Propositions |
| **12.4** | Market Analysis & Sizing | Upstream Market Study (TAM, SAM, SOM, CAGR, Competitors) |
| **12.5** | Business & Revenue Model | Upstream Business Model Canvas (Revenue streams, Cost structure) |
| **12.6** | Marketing & Go-To-Market | Upstream Market Study Channels + Business Model Customer Segments |
| **12.7** | Operational Plan | Upstream Business Model Key Activities + Key Resources |
| **12.8** | Management & Organization | Upstream Formation Structure + Skills Gap Analysis |
| **12.9** | Financial Plan & Forecast | Upstream Financial Forecast (3-year P&L, Break-even, Cash burn) |
| **12.10** | Funding Requirements | Upstream Financial Forecast (Required capital, Runway months) |
| **12.11** | Risk Analysis & Mitigation | Upstream Legal Compliance Evaluation (Statutory & Industry risks) |
| **12.12** | Appendix & Milestones | Upstream Legal Milestones + Formation Timeline |

### 3.3 Cross-Step Data Dependencies & Hardcoded Defaults
- **Market Sizing → Forecast**: Forecast initializes TAM from Market Study if available. If Market Study is missing or not yet generated, it falls back to hardcoded default `$1,000,000` (`forecast/page.tsx:115`).
- **Other Forecast Defaults**:
  - ARPU default: **$49 / month** (`forecast/page.tsx:116`)
  - Monthly OPEX default: **$8,000 / month** (`forecast/page.tsx:117`)
  - Growth Rate default: **12% / month** (`forecast/page.tsx:118`)
  - Churn Rate default: **5% / month** (`forecast/page.tsx:119`)
- **Formation Engine Supported Structures**:
  - The formation engine (`FormationRecommendationEngine.cs:42-120`) strictly evaluates and supports **3 legal structures**:
    1. `SAS` (Société par Actions Simplifiée)
    2. `SAS-U` (Société par Actions Simplifiée Unipersonnelle)
    3. `SARL` (Société à Responsabilité Limitée)
  - No other corporate structures (e.g., SA, SCI, Auto-entrepreneur, Delaware C-Corp) are supported by the engine at HEAD.

### 3.4 Investor Readiness Scoring Dimensions & Weights
Implemented in `CreatorPhase3Controller.cs:674-720` and `CreatorInvestorReadinessScore.cs`:
- **Concept Clarity**: 20 points
- **Market Evidence**: 20 points
- **Financial Model**: 25 points
- **Legal Readiness**: 15 points
- **Team Credibility**: 20 points
- **Total**: 100 points maximum.
- **Drift**: CLAUDE.md / canonical docs mention a 4-dimension model (25/25/25/25). The code at HEAD implements a 5-dimension model with 25 points allocated to the Financial Model.

### 3.5 Required vs Optional Artifacts for Phase 3 Completion
- At `PATCH /api/creator/masterplan/complete` (`CreatorPhase3Controller.cs:633-668`):
  - **Required**: `forecast`, `business_plan`, `formation_generator`, `legal_compliance`.
  - **Optional / Unchecked**: `market_study`, `business_model`.
- At `CreatorJourneyService.cs:362` (`ComputePhaseStatusAsync`):
  - **Required**: `hasMarketStudy`, `hasBusinessModel`, `hasForecast`, `legalPresent`, `hasFormation`, `hasPlan`.

---

## 4. Phase 4 Deep Audit (Offer, Pricing & GTM)

### 4.1 Feature Implementation Breakdown

| Feature | Status at HEAD | Evidence (File + Symbol / Route) | Implementation Nature |
| :--- | :--- | :--- | :--- |
| **Pricing** | **IMPLEMENTED** | `CreatorPhase4Controller.cs:64-159`, `Phase4Pricing.tsx` | Deterministic benchmark lookup + tier calculations. Benchmark data derived from `Phase4BenchmarkData.cs`. |
| **GTM / Showcase Landing Page** | **PARTIALLY IMPLEMENTED** | `Phase4Gtm.tsx`, `CreatorPhase4Controller.cs:247-279` | **GTM strategy & 8-week task checklist exist**. Public showcase or hosted landing page generator is **ABSENT**. |
| **Roadmap Generation** | **ABSENT in Phase 4** | N/A (Phase 4) | Implemented in **Phase 3** (Step 3.4 Legal Checklist Roadmap & Step 3.6 Business Plan Section 12.11/12.12). None in Phase 4. |
| **Needs Generation** | **IMPLEMENTED** | `Phase4Resource.tsx`, `CreatorPhase4Controller.cs:163-243` | Deterministic resource calculator computing headcount, software, operational budget based on user selections. |
| **Skills Gap** | **ABSENT in Phase 4** | N/A (Phase 4) | Implemented in **Phase 3** Step 3.5 (`CreatorPhase3Controller.cs:816-836`, `formation/page.tsx`). None in Phase 4. |
| **Training Recommendations** | **ABSENT** | Entire codebase (0 occurrences) | No training or course recommendation engine exists in the monorepo. |
| **Aids / Support Matching** | **PARTIALLY IMPLEMENTED** | `CreatorPhase3Controller.cs:725-780` (`/sp-matches`) | SP (Service Provider) marketplace matching exists. Government/statutory financial aid matching is **ABSENT**. |
| **Administrative Journey** | **ABSENT** | N/A | Statutory French admin filing steps exist in Phase 3 Legal, but no dedicated Phase 4 administrative journey module exists. |
| **Next-Best-Action** | **ABSENT** | N/A | No prescriptive next-best-action recommendation engine exists. Progression is strictly linear (4.1 → 4.2 → 4.3). |
| **Business-Readiness Scoring** | **ABSENT in Phase 4** | N/A (Phase 4) | Investor Readiness Scoring is implemented in **Phase 3** Step 3.7. No additional readiness scoring exists in Phase 4. |

### 4.2 Benchmark & Default Data Sources in Phase 4
- **Benchmark Source**: Hardcoded in C# backend class `Phase4BenchmarkData.cs` (`backend/Models/Phase4BenchmarkData.cs:1-85`).
- Contains industry median prices, customer acquisition costs (CAC), lifetime value (LTV), and typical gross margins across 6 sectors (B2B SaaS, B2C Subscription, E-commerce, Marketplace, Professional Services, FinTech).
- **Empty State Behavior**: When no sector matches, falls back to the `B2B SaaS` benchmark profile rather than displaying an honest empty state or asking the user for custom inputs.

---

## 5. Phase 5 & 6 Deep Audit (Crossroads & Investor Readiness)

### 5.1 Structure at HEAD: Path Fork & Transitions
- **Path Fork Screen**: Implemented in `src/app/dashboard/creator/crossroads/page.tsx`.
- The user is presented with an explicit decision between two mutually exclusive paths:
  - **Path A ("Sell or License IP")**:
    - Generates IP valuation report via `POST /api/creator/phase-5/ip-valuation`.
    - Publishes listing to Mondial IP Marketplace via `POST /api/creator/phase-5/marketplace/publish`.
    - Allows viewing and accepting/declining buyer inquiries (`/marketplace/interests`).
    - If user accepts a Full Buyout (`full_buyout`), the idea is marked `SOLD` and **Phase 6 is permanently locked**.
  - **Path B ("Build & Seed")**:
    - Initiates company formation filing (`POST /api/creator/phase-5/company-formation`).
    - Matches with Service Providers (`/sp-matches`) and initiates seed funding (`POST /api/creator/phase-5/seed-funding`).
    - Unlocks Phase 6 Level-Up.

### 5.2 Company Verification Logic
- **Location**: `backend/Services/Implementations/CompanyVerificationService.cs:45-132`.
- **Trigger**: Initiated when the creator triggers legal entity creation in Phase 5 Path B or Phase 6.
- **Verification Checks**:
  1. SIREN / SIRET registration lookup against French government public API (`api.insee.fr`).
  2. Verification of company name matching the legal certificate.
  3. Kbis document upload verification via Sumsub document verification API.
- **Fallback / Mock Mode**: If INSEE API credentials are empty in `appsettings.json`, the service falls back to regex validation of the 9-digit SIREN and marks status as `manual_review_required`.

### 5.3 Level-Up Transition Logic
- **Trigger**: `POST /api/creator/phase-6/level-up` (`CreatorPhase6Controller.cs:188-290`).
- **Atomic Multi-Document Transaction**: Executed inside a MongoDB client session with replica set transaction support.
- **Actions Performed**:
  1. Creates an `EntrepreneurProfiles` record linked to `userId`.
  2. Creates or links a `Companies` document with the chosen corporate structure (SAS, SAS-U, SARL).
  3. Seeds `Phase3Concept` with the finalized concept name, value proposition, and branding assets.
  4. Seeds `CapitalAllocation` with the budget generated in Phase 4 Resource Calculator.
  5. Seeds `Phase4CapTables` with initial equity distribution (100% creator or co-founder split).
  6. Adds role `"Entrepreneur"` to `user.Roles` in `Users` collection (retains `"Creator"` role).
  7. Sets `journey.Phase6.LevelUpTriggered = true` and `journey.Phase6.Status = "completed"`.

### 5.4 Data Carry-Forward Analysis

| Field / Asset | Carried Forward to Entrepreneur Portal? | Evidence |
| :--- | :--- | :--- |
| **Concept Name & Description** | **YES** | `CreatorPhase6Controller.cs:222` → `Phase3Concept.Name` |
| **Branding Assets (Logo SVG, Palette, Font)** | **YES** | `CreatorPhase6Controller.cs:228-235` → `Phase3Concept.Branding` |
| **Financial Forecast (P&L, Burn Rate)** | **YES** | `CreatorPhase6Controller.cs:240` → `CapitalAllocation.Forecast` |
| **Phase 4 Resource Budget** | **YES** | `CreatorPhase6Controller.cs:245` → `CapitalAllocation.InitialBudget` |
| **Cap Table & Equity Split** | **YES** | `CreatorPhase6Controller.cs:252` → `Phase4CapTables.Stakeholders` |
| **Market Study Raw Data (TAM/SAM/SOM)** | **NO** | Raw TAM/SAM/SOM numbers are not copied to `EntrepreneurProfiles`. Kept only in `CreatorArtifacts`. |
| **Legal Compliance Audit Checklist** | **NO** | Statutory compliance items remain in `CreatorArtifacts`; not ported to company compliance ledger. |
| **Phase 4 GTM 8-Week Task Checklist** | **NO** | GTM checklist remains in `CreatorJourneys.Phase4`; not seeded into Entrepreneur project task manager. |

### 5.5 UI Promises vs Implemented Code in Phase 5 & 6
1. **Automated Seed Investor Term Sheet Issuance**:
   - The UI in `Phase6InvestorsPage.tsx:320-350` displays an "Issue Term Sheet" button for matched investors.
   - Evidence in backend: `CreatorPhase6Controller.cs` has **no** endpoint for issuing, signing, or generating term sheets. Clicking the button only triggers a toast notification: `"Investor contact request submitted"`.
2. **Instant French Bank Account (Qonto/Shine) Integration**:
   - In `crossroads/page.tsx:240`, the UI advertises "Instant Capital Deposit Account with partner banks".
   - Evidence in backend: No banking API integrations (Qonto, Shine, Swan) exist at HEAD. The action merely marks a boolean flag `CapitalAccountPending = true` in MongoDB.
