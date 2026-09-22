# MONDIAL BUSINESS CREATION (MBC)
# CREATOR DASHBOARD POST-ARCHITECTURE FULL AUDIT

**Audit Date:** September 22, 2026  
**Mode:** STRICT READ-ONLY DASHBOARD AUDIT  
**Audit Scope:** Real Current Creator Dashboard (`/dashboard/creator`), Layouts, Guards, Data Sources, Backend Authorities, and Navigation  
**Audited Route:** `src/app/dashboard/creator/page.tsx` & `src/app/dashboard/creator/layout.tsx`  
**Git Working Branch:** `dev-hafiz` (Commit `1f651b93`)  
**Strict Policy:** No code modifications, no database edits, no redesigns, no implementation of Phase 4.8/4.9.

---

## 1. CURRENT CREATOR ARCHITECTURE — CODE-VERIFIED BASELINE

The actual canonical flow verified from production code is:
```
Login
  ↓
Normal MBC Universal Onboarding (Phase 0 / KYC)
  ↓
Creator HumainX Quick Start (First-time onboarding only, backend-authoritative)
  ↓
Creator Dashboard (/dashboard/creator)
  ↓
Phase 2 — Project Identity & Branding (Clarifier → Naming → Branding Decision → Brand Studio)
  ↓
Phase 3 — Business Plan Intelligence (Sequential 3.1 to 3.7)
  ↓
Phase 4 — Construction & Launch Preparation Engine (4.1 to 4.7 Engines)
  ↓
Phase 5 — Crossroads (Sell / Full Buyout vs. Build / Equity Partnership)
  ↓
Phase 6 — Creator → Entrepreneur Level Up (Smart Matchmaking & Level Up Trigger)
```

### Established Canonical Backend Authorities:
- **Phase 2 Brand:** `BrandKit` document (`BrandKits` collection) is sole authority; `CreatorIdea.Project.Branding` is derived projection only.
- **Phase 3.4 Legal:** `CreatorLegalAssessment` (`Phase3Data.LegalAssessment`) is sole authority; `LegalChecklist` is an inert legacy BSON compatibility field.
- **HumainX Onboarding:** `ProfessionalProfileRecord.QuickStart` on backend is sole authority.
- **Founder Capacity:** `IFounderCapacityResolver` is sole capacity authority.
- **Pricing:** `PricingPolicyEngine` is sole pricing authority.
- **Phase 4 Completion:** `Phase4CompletionResolver` is sole completion authority.
- **Phase 4.8:** Launch Assets is **NOT IMPLEMENTED**.
- **Phase 4.9:** Construction Readiness is **RESERVED**.

---

## 2. AUDIT OF CURRENT CREATOR DASHBOARD ROUTE (`/dashboard/creator`)

### File Inventory:
- **Page Component:** `src/app/dashboard/creator/page.tsx` (881 lines)
- **Layout Component:** `src/app/dashboard/creator/layout.tsx` (22 lines)
- **Layout Guards:** `CreatorProgressProvider`, `CreatorHumainXQuickStartGuard`, `CreatorPhaseGuard`, `CreatorConflictNotice`
- **Subcomponents:** `Phase3LegalCard` (`src/components/creator/Phase3LegalCard.tsx`), `HumainXDashboardCard` (`src/components/creator/dashboard/HumainXDashboardCard.tsx`)
- **Query Hooks:** `useDashboardStats`, `useCreatorProgress`, `useForecastSessionTimed`, `useConversations`, `useNotifications`

### Creator Dashboard Component Map

| Component / Block | Lines in `page.tsx` | Purpose | Current Data Source | Current Status | Problem Identified? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Breadcrumbs & Back** | 185–199 | Top navigation header | Static labels | PASS | Links back to root `/dashboard`. |
| **Welcome Header** | 201–236 | Greeting, date, phase-sensitive subtitle, actions | `user.name`, `dashboardState` (A–F) | **PARTIAL** | Subtitle for State D uses obsolete wording ("Complete pricing options"). |
| **Idea Clarity Score** | 240–256 | Top KPI 1: Idea clarity | `project.clarityScore` (Phase 2 Clarifier) | **PASS** | Honest cell, real backend value or "—". |
| **AI Assets Generated** | 258–278 | Top KPI 2: Persisted document count | `creatorDocumentsApi.list(activeIdeaId)` | **PASS** | Honest count of real documents. |
| **Investor Readiness** | 280–302 | Top KPI 3: Readiness score | `/creator/dashboard/stats` (`InvestorReadinessScore.total`) | **PARTIAL** | Misleading for early-stage users (Phase 2/3.1). |
| **Interested Buyers** | 304–320 | Top KPI 4: Matched investors | `journey.phase5Data.pathB.seedFunding.matchedInvestorCount` | **MISLEADING** | Irrelevant for early creators; 0/empty 95% of time. |
| **Crossroads Banner** | 322–359 | Banner when Phase 4 is done (State E) | `dashboardState === 'E'` | **HIGH RISK** | "Sell" & "Build" buttons trigger `advancePhase(5)` locally. |
| **HumainX Profile Card** | 361–363 | Banner to complete builder profile | `creatorProfileApi.getCompleteness()` | **PASS** | Honest progress % and link to `/dashboard/creator/profile`. |
| **Your Project Card** | 368–523 | Project hero, concept, category, stepper, continue CTA | `useCreatorProgress()`, `getNextCreatorAction()` | **OUTDATED** | Stepper labels P4 as "Pricing", hardcodes "SaaS", uses State D "Offer & Pricing". |
| **AI Financial Forecast Card**| 524–612 | Revenue chart, ARR, Break-even | `useForecastSessionTimed(forecastSessionId)` | **PARTIAL** | Honest loading/empty/error, but hardcodes EBITDA margin as "—". |
| **Phase3LegalCard** | 614–616 | Stage 6 Legal intelligence | `creatorJourneyApi.getLegalOverview(ideaId)` | **PASS** | Authoritative France legal status and readiness. |
| **Document Vault Card** | 618–665 | List of idea documents | `creatorDocumentsApi.list(activeIdeaId)` | **PASS** | Sourced from real database documents. |
| **Messages Card** | 669–728 | Recent chat conversations | `useConversations()` | **PASS** | Real chat API integration. |
| **Notifications Card** | 730–778 | Recent user notifications | `useNotifications()` | **PASS** | Real notifications hook. |
| **Marketplace Card** | 780–815 | Matched investors or locked message | `matchedInvestorCount` | **PARTIAL** | Prompts "Marketplace Push" to Crossroads. |
| **Quick Actions Grid** | 818–877 | 4 navigation cards | Router pushes | **OUTDATED** | Misnomer: "Generate Pitch Deck" links to Business Plan. 2 tiles link to Crossroads. |

---

## 3. SCREENSHOT / UI STRUCTURE INVENTORY

Visually, the current dashboard renders as a dense, 2-column desktop dashboard (max-width `1136px`):
1. **Header Row:**
   - Small breadcrumb ("Creator Flow > Dashboard")
   - Title: "Good morning, {FirstName} 👋"
   - Contextual subtitle based on coarse states A–F.
   - Action buttons: Date badge, "New Idea" / "Edit Concept", and "AI Tools".
2. **Top KPI Metrics Grid (4 Cards across):**
   - Idea Clarity Score (`{clarityScore}/100`)
   - AI Assets Generated (`{assetsGenerated}`)
   - Investor Readiness (`{readiness}/100` + Label)
   - Interested Buyers (`{matchedInvestorCount}`)
3. **Crossroads Callout Banner (Rendered only when in State E):**
   - Gradient warning banner with "Sell the Project" and "Build It" CTAs.
4. **HumainX Personalization Banner:**
   - Full-width card with builder profile progress bar and "Continue My Profile" CTA.
5. **Main 2-Column Grid:**
   - **Left Column (2/3 width):**
     - *Your Project Card:* Initial letter avatar box, Name, Concept, badges (Category + hardcoded "SaaS" badge), 6-step progress stepper (Identity, Concept, Intel, Pricing, Crossroads, Matching), and "Currently on Phase X" Continue banner.
     - *AI Financial Forecast Card:* Recharts bar chart of monthly revenue, Year 3 ARR, Break-even month, EBITDA margin ("—").
     - *Legal & Compliance Intelligence Card:* France legal readiness progress bar, stage breakdowns, refresh assessment button.
     - *Document Vault Card:* Real documents list (Business Plan, Financial Forecast).
   - **Right Column (1/3 width):**
     - *Messages Card:* 3 most recent chat threads with avatars, timestamps, and unread counts.
     - *Notifications Card:* 4 most recent notifications.
     - *Marketplace / Smart Matching Card:* Buyer match count or "Smart Matching Locked" card.
6. **Bottom Row: Quick Actions Grid (4 Cards across):**
   - "Generate Pitch Deck" (links to `/dashboard/creator/phase-3/business-plan`)
   - "Marketplace Push" (links to `/dashboard/creator/crossroads`)
   - "Hire a Provider" (links to `/marketplace/services`)
   - "Build My Company" (links to `/dashboard/creator/crossroads`)

---

## 4. DASHBOARD PURPOSE AUDIT

### What the dashboard currently believes its job is:
The dashboard is currently a **hybrid mixture (Option F)**:
- Part **Results Snapshot** (Forecast chart, Legal readiness, Document vault).
- Part **Phase Navigation Page** (Stepper and Continue button).
- Part **Marketplace / Deal Portal** (Interested buyers, Marketplace push, Sell vs. Build).
- Part **Inbox** (Messages & Notifications).

### Overload & Architectural Friction:
- **Phase 4 is completely invisible:** The dashboard gives zero surface to the 7 construction engines (Snapshot, Roadmap, Needs, Skills, Support, Pricing, GTM).
- **Early vs. Late Stage Mismatch:** An early-stage founder clarifying an idea in Phase 2 is confronted with "Interested Buyers (0)", "Marketplace Locked", "Crossroads", and "Sell the Project", which causes severe cognitive overload.
- **Missing Asset & Result Access:** The founder has no way to see or download their BrandKit, Market Study, Business Model, or Roadmap from the dashboard.

---

## 5. HUMAINX DASHBOARD ENTRY

- **Layout Guard Verification:** `CreatorHumainXQuickStartGuard` wraps `src/app/dashboard/creator/layout.tsx`.
- **Backend Authority:**
  - Evaluates `isBackendQuickStartComplete(profile)`.
  - Checks strictly `profile.quickStart?.completedAt`.
  - If incomplete, automatically redirects to `/dashboard/creator/humainx?step={targetStep}`.
- **Elimination of `localStorage`:** Confirmed that `localStorage` is **NEVER** consulted for access. `resetQuickStartJourneyState` is called purely for cleanup.
- **Dashboard Independence:** The dashboard page itself performs **ZERO** manual HumainX completion calculations.

---

## 6. PROJECT IDENTITY HEADER AUDIT

Inspected lines 398–420 in `page.tsx`:
- **Project Name:** Reads `project.name` from `CreatorProgressProvider` (backed by `CreatorIdea.Project.Name`).
- **Concept Statement:** Reads `project.concept` from `CreatorIdea.Project.Concept`.
- **Category:** Reads `project.category || 'FinTech'`.
- **Hardcoded Badge Defect:** Line 411 explicitly renders:
  ```tsx
  <Badge variant="outline" className="...">SaaS</Badge>
  ```
  Every single project displays a static `"SaaS"` badge regardless of actual sector or category!
- **Logo Display Defect:** Line 398 renders an initial letter in a gradient box:
  ```tsx
  {project.name ? project.name.charAt(0).toUpperCase() : 'P'}
  ```
  It **ignores** the canonical `BrandKit` logo asset and `Project.Branding.LogoAsset` projection!
- **Brand Colors Defect:** The dashboard does not apply or preview the founder's committed BrandKit color palette.

---

## 7. PHASE 2 DASHBOARD REPRESENTATION

### Current Behavior:
- Represented as "Step 2: Concept" in the stepper and "Phase 2 — Idea Refinement" in the Continue card.
- Displays `Idea Clarity Score` (from Phase 2 Clarifier) as a top KPI.
- Displays "Identity Ready" badge if past State A.

### Architectural Gaps:
- **Zero BrandKit Visibility:** Brand Studio is one of the centerpiece features of Phase 2, yet the dashboard does not show whether a BrandKit exists, its palette, typography pairing, or logo status.
- **No Distinction of Brand States:** Does not distinguish between:
  - Brand not started
  - Brand in progress in Studio
  - BrandKit committed & synced
  - Brand skipped / M50 designer hired

---

## 8. PHASE 3 DASHBOARD REPRESENTATION

### Current Behavior:
- Shows "Phase 3 — Project Intelligence".
- Stepper step 3 is labeled "Intel".
- Displays **AI Financial Forecast** card (Phase 3.3).
- Displays **Phase3LegalCard** (Phase 3.4).
- Displays **Investor Readiness** score (Phase 3.7).

### Architectural Gaps:
- **3.1 Market Intelligence is absent:** Zero visibility into TAM/SAM/SOM, competitor count, or market risks.
- **3.2 Business Model Canvas is absent:** Zero visibility into revenue streams or 9 blocks.
- **3.5 Company Formation & Team is absent:** Zero visibility into SAS/SARL selection or incorporation checklist.
- **3.6 Executive Business Plan has no dedicated summary:** Only exists as an entry in the Document Vault and a mislabeled Quick Action.

---

## 9. PHASE 3.1 MARKET INTELLIGENCE AUDIT

- **Dashboard Presence:** **ABSENT**.
- **Canonical Source:** `MarketStudySessions` collection (`CreatorIdea.Phase3Data.MarketStudySessionId`).
- **What Dashboard Should Expose:**
  - Status: Not Started / In Progress / Ready / Update Available.
  - High-level metrics: Target Market Segment, TAM/SAM/SOM summary, Competitor count.
  - Quick action: "View Market Intelligence".

---

## 10. PHASE 3.2 BUSINESS MODEL AUDIT

- **Dashboard Presence:** **ABSENT**.
- **Canonical Source:** `BusinessModelSessions` collection (`CreatorIdea.Phase3Data.BusinessModelSessionId`).
- **What Dashboard Should Expose:**
  - Status: Draft / Canvas Complete / Stale.
  - High-level summary: Primary Revenue Stream model, Key Partnerships count.
  - Quick action: "Open Business Model Canvas".

---

## 11. PHASE 3.3 FINANCIAL FORECAST AUDIT

- **Existing Card:** `AI Financial Forecast` card (Lines 524–612).
- **Data Source:** Real query `useForecastSessionTimed(forecastSessionId)` using `ForecastOutput`.
- **Chart Verification:** Renders actual monthly projected revenue via Recharts.
- **Honest States:**
  - Empty: "No forecast yet — Run your financial forecast in Phase 3".
  - Loading: Skeleton layout.
  - Error: Retryable error card.
- **Static Defect:** Line 587 renders EBITDA Margin as `<div className="...">—</div>` because EBITDA is not part of the active forecast contract.

---

## 12. PHASE 3.4 LEGAL & COMPLIANCE AUDIT

- **Existing Component:** `Phase3LegalCard` (Lines 614–616).
- **Data Source:** `creatorJourneyApi.getLegalOverview(ideaId)`, reading canonical `CreatorLegalAssessment`.
- **Content:** Displays France compliance planning readiness percentage, stage breakdowns, and detected archetypes.
- **Wording Evaluation:** Uses honest terminology: "Legal & Compliance", "France Roadmap", "Planning Readiness". Does **NOT** make misleading claims like "Officially Certified" or "MBC Verified".
- **Legacy Absence:** Verified that it does not query or display legacy `LegalChecklist`.

---

## 13. PHASE 3.5 FORMATION AUDIT

- **Dashboard Presence:** **ABSENT**.
- **Canonical Source:** `CreatorIdea.Phase3Data.Formation` (`FormationGenerator`).
- **What Dashboard Should Expose:**
  - Recommended Entity Type: (e.g. `SAS`, `SASU`, `SARL`).
  - Formation Checklist progress (e.g. "3 of 7 tasks done").
  - Founding Team Status.

---

## 14. PHASE 3.6 EXECUTIVE BUSINESS PLAN AUDIT

- **Existing Representation:**
  - Listed inside `Document Vault` as a generated PDF item.
  - Mislabeled in Quick Actions: "Generate Pitch Deck" links to `/dashboard/creator/phase-3/business-plan`!
- **Architectural Gaps:**
  - Phase 3.6 is the culmination of Phase 3, producing a comprehensive 12-section document. It deserves a prominent "Business Plan Ready / In Progress" card with export CTA.
  - The link to `/phase-3/business-plan` must be properly titled "Executive Business Plan", not "Pitch Deck".
- **Phase 4 Independence:** Verified that the business plan link operates independently from Phase 4 GTM state.

---

## 15. PHASE 3.7 INVESTOR READINESS AUDIT

- **Existing Representation:** Top KPI Card 3 renders `Investor Readiness ... /100` from `/creator/dashboard/stats`.
- **Backend Authority:** `CreatorIdea.Phase3Data.InvestorReadinessScore`.
- **UX Problem:** Exposing "Investor Readiness" to a founder on Day 1 (in Phase 2) displays an alarming `0/100` or empty dash, implying their idea has failed before they've even reached Phase 3.7.
- **Recommendation:** Investor Readiness should only become visible once Phase 3.7 is unlocked or reached.

---

## 16. READINESS SCORE DUPLICATION AUDIT (HIGH PRIORITY)

Audited all readiness and percentage metrics across the dashboard:
1. **Idea Clarity Score:** `0–100` (from Phase 2 Clarifier) — *Valid*.
2. **Investor Readiness Score:** `0–100` (from Phase 3.7) — *Valid, but surfaced prematurely*.
3. **Builder Profile Completeness:** `0–100%` (HumainX) — *Valid*.
4. **Legal Planning Readiness:** `0–100%` (Phase 3.4) — *Valid*.
5. **Phase Progress Count:** `completedCount of 6 phases completed` — *Coarse*.
6. **Level Up Overall Progress:** `finalReadinessQ.data.overallProgress %` (State F only) — *Valid*.

### Critical Safety Invariant:
**Phase 4.9 Construction Readiness is RESERVED.**  
The dashboard correctly contains **ZERO** fake "Construction Readiness %" or "Launch Readiness %" metrics. This boundary must remain strictly enforced.

---

## 17. PHASE 4 DASHBOARD REPRESENTATION

### Phase 4 Stage Coverage Audit

| Phase 4 Stage | Dashboard Visible? | Status Source | CTA | Correct? |
| :--- | :---: | :--- | :--- | :---: |
| **4.1 Construction Snapshot** | **NO** | None | None | **COVERAGE GAP** |
| **4.2 Operational Roadmap** | **NO** | None | None | **COVERAGE GAP** |
| **4.3 Needs & Requirements** | **NO** | None | None | **COVERAGE GAP** |
| **4.4 Skills & Training** | **NO** | None | None | **COVERAGE GAP** |
| **4.5 Aids, Grants & Support** | **NO** | None | None | **COVERAGE GAP** |
| **4.6 Pricing & Revenue Model**| **NO** | Obsolete label in Stepper | None | **OUTDATED** |
| **4.7 GTM & Launch Strategy** | **NO** | None | None | **COVERAGE GAP** |

**Conclusion:** Phase 4 has **0% component coverage** on the Creator Dashboard. The dashboard treats the entire 7-engine Construction phase as an invisible black box labeled "Pricing" or "Offer & Pricing".

---

## 18. 4.1 CONSTRUCTION SNAPSHOT AUDIT

- **Dashboard Presence:** **ABSENT**.
- **Canonical Source:** `CreatorJourney.Phase4Data.ConstructionSnapshot`.
- **What Dashboard Should Expose:** A high-level readiness summary:
  - Ready Items count (e.g. "8 Ready")
  - Missing/Critical Items count (e.g. "2 Critical")
  - Status chip: "Snapshot Complete" or "Needs Review".

---

## 19. 4.2 OPERATIONAL ROADMAP AUDIT

- **Dashboard Presence:** **ABSENT**.
- **Canonical Source:** `CreatorJourney.Phase4Data.Roadmap`.
- **What Dashboard Should Expose:**
  - Current Horizon (e.g. `NOW`, `PRE_LAUNCH`).
  - Next Best Action task card.
  - Weekly capacity utilization (hours scheduled vs. available).

---

## 20. NEXT BEST ACTION AUDIT (HIGH PRIORITY)

### Current Implementation:
The dashboard determines its primary CTA via `getNextCreatorAction(journeyState)` in `src/lib/creator-state-resolver.ts`:
- If Phase 2 incomplete → `/dashboard/creator/phase-2/clarifier` (or step)
- If Phase 3 incomplete → `/dashboard/creator/phase-3/market-study` (or step)
- If Phase 4 incomplete → `/dashboard/creator/phase-4`
- If Phase 5 incomplete → `/dashboard/creator/crossroads`
- If Phase 6 incomplete → `/dashboard/creator/investors`

### Architectural Problem:
Once the user enters Phase 4, the dashboard links only to the generic `/dashboard/creator/phase-4` landing page. It does **NOT** query the Roadmap's authoritative `NextBestAction` (e.g. "Resolve statutory insurance mandate" or "Finalize tier pricing").

---

## 21. 4.3 NEEDS & REQUIREMENTS AUDIT

- **Dashboard Presence:** **ABSENT**.
- **Old Concept:** Historical concepts displayed a "Resources / Matches: 4 SP matches found" card.
- **Canonical Reality:** Current Phase 4.3 distinguishes `Active Need` vs. `Covered Need` across 6 categories (Software, Tools, Legal, Operational, Marketing, HR).
- **Finding:** The old "Resources/Matches" concept is obsolete. The dashboard must not show crude provider counts before real needs are established.

---

## 22. 4.4 SKILLS & TRAINING AUDIT

- **Dashboard Presence:** **ABSENT**.
- **Canonical Source:** `CreatorJourney.Phase4Data.SkillsPlan`.
- **What Dashboard Should Expose:**
  - Skills gap summary: Count of competencies resolved via `LEARN`, `DELEGATE`, or `VERIFY`.
  - Zero-gap indicator: "All essential competencies covered".

---

## 23. 4.5 AIDS, GRANTS & SUPPORT AUDIT

- **Dashboard Presence:** **ABSENT**.
- **Canonical Source:** `CreatorJourney.Phase4Data.SupportPlan`.
- **Budget Safety Check:** The dashboard must never count potential grants as available cash.
- **What Dashboard Should Expose:**
  - Matched public programs count (e.g. "3 eligible aids identified").
  - Awarded aids count (only awarded grants can be tracked as funds).

---

## 24. 4.6 PRICING STRATEGY AUDIT

- **Dashboard Presence:** **ABSENT** (misleadingly used as the label for all of Phase 4).
- **Canonical Source:** `CreatorJourney.Phase4Data.PricingStrategy` & `PricingPolicyEngine`.
- **What Dashboard Should Expose:**
  - Model: (e.g. "SaaS Tiered").
  - Selected Price: (e.g. "€49 / mo").
  - Tax Mode: (`HT`, `TTC`, or `Exempt`).

---

## 25. 4.7 GTM & LAUNCH STRATEGY AUDIT

- **Dashboard Presence:** **ABSENT**.
- **Canonical Source:** `CreatorJourney.Phase4Data.GtmStrategy`.
- **What Dashboard Should Expose:**
  - Primary Launch Segment.
  - Active validation experiments count.
  - Planned marketing cash.

---

## 26. PHASE 4 COMPLETION SOURCE AUDIT

- **Canonical Authority:** `Phase4CompletionResolver.Resolve(p4)`.
- **Current Dashboard Behavior:** Lines 151 & 158 evaluate coarse progress:
  ```ts
  const isPhase4Done = journeyState.phase4.status === 'completed';
  ```
  `computed.phase4.status` is derived by backend `CreatorJourneyService.ComputePhaseStatusAsync`, which calls `Phase4CompletionResolver`.
- **Safety Status:** **PASS**. The dashboard does not independently calculate Phase 4 completion via ad-hoc checks (`hasNeeds`, `hasPricing`, `hasGtm`). Competing completion logic = **0**.

---

## 27. PHASE 5 CROSSROADS AUDIT

- **Existing Representation:**
  - Banner in State E: "⚡ You've reached The Crossroads — Phase 5" (Lines 322–359).
  - Two Quick Action cards link to `/dashboard/creator/crossroads` ("Marketplace Push" and "Build My Company").
- **Gating Check:**
  - If Phase 4 is incomplete (`journeyState.phase4.status !== 'completed'`), State E does not trigger.
  - Accessing `/dashboard/creator/crossroads` via URL is intercepted by `CreatorPhaseGuard`, redirecting to `/dashboard/creator`.
  - Direct API calls to `POST /api/creator/journey/crossroads/path` are rejected with HTTP 403 Forbidden.
- **Flaw in State E Banner:** The banner buttons call `advancePhase(5)` locally on click, which prematurely updates local state before backend confirmation.

---

## 28. CREATOR MVP CROSSROADS OPTIONS

- **Current Production Options:**
  1. **Sell the Project (Path A):** Full Buyout Offer / Marketplace Listing.
  2. **Build It (Path B):** Equity Partnership / Co-founder search or Bootstrapped Builder.
- **Dashboard Representation:** The State E banner offers "Sell the Project" and "Build It", matching the canonical MVP options.

---

## 29. PHASE 4.8 / 4.9 DASHBOARD SAFETY

- **Phase 4.8 (Launch Assets):** **ABSENT**. No fake launch asset cards are rendered.
- **Phase 4.9 (Construction Readiness):** **ABSENT**. No premature launch certification scores are displayed.
- **Safety Status:** **PASS**.

---

## 30. SIDEBAR AUDIT

Audited `src/lib/menu.ts` (`[UserRole.CREATOR]`):

| Sidebar Entry | Route / Href | Canonical Feature | Status | Evaluation & Alignment |
| :--- | :--- | :--- | :---: | :--- |
| **Overview** | `/dashboard/creator` | Dashboard | Active | **PASS** |
| **My Ideas** | `/dashboard/creator/myideas` | Multi-Idea Hub | Active | **PASS** |
| **Build My Project** | `#build-my-project` | Parent Group | Active | **PASS** |
| ↳ AI Studio | `/dashboard/creator/ai` | Ideation / Clarifier | Active | **PASS** |
| ↳ Brand Studio | `/dashboard/creator/phase-2/brand-studio` | Phase 2 BrandKit | Active | **PASS** |
| ↳ Market Study | `/dashboard/creator/phase-3/market-study`| Phase 3.1 Market | Active | **PASS** |
| ↳ Business Model | `/dashboard/creator/phase-3/business-model` | Phase 3.2 Canvas | Active | **PASS** |
| ↳ Financial Forecast | `/dashboard/creator/phase-3/forecast` | Phase 3.3 Forecast | Active | **PASS** |
| ↳ Legal & Compliance | `/dashboard/creator/phase-3/compliance` | Phase 3.4 Legal | Active | **PASS** |
| ↳ Company Formation | `/dashboard/creator/phase-3/formation` | Phase 3.5 Formation| Active | **PASS** |
| ↳ Business Plan | `/dashboard/creator/phase-3/business-plan` | Phase 3.6 Plan | Active | **PASS** |
| ↳ Project Readiness | `/dashboard/creator/phase-3/complete` | Phase 3.7 Investor | Active | **PASS** |
| **Offers & Marketplace** | `/dashboard/creator/phase-4` | Parent Group | Active | **OUTDATED GROUPING** |
| ↳ Construction Engine | `/dashboard/creator/phase-4` | Phase 4 Hub | Active | **MISSING SUB-STAGES** (4.1–4.7 not in menu) |
| ↳ Launch to Market | `/dashboard/creator/crossroads` | Phase 5 Crossroads | Active | **PASS** |
| ↳ Marketplace | `/marketplace/projects` | Deal Listing | Active | **PASS** |
| ↳ Partnerships | `/dashboard/creator/partnerships` | Co-founder Deals | Active | **PASS** |
| ↳ Sales & Buyouts | `/dashboard/creator/sales` | Buyout Deals | Active | **PASS** |
| ↳ Growth & Readiness| `/dashboard/creator/investors` | Phase 6 Smart Match | Active | **PASS** |
| **Assets & Documents** | `/dashboard/creator/documents` | Documents | Active | **PASS** |
| ↳ IP Vault & Legal | `/dashboard/creator/documents` | Vault | Active | **PASS** |
| ↳ Asset Library | `/dashboard/creator/asset-library` | Assets | Active | **PASS** |
| **Services & Network** | `/marketplace/services` | Services | Active | **PASS** |
| ↳ Hire Providers | `/marketplace/services` | Provider Catalog | Active | **PASS** |
| ↳ Active Engagements | `/dashboard/creator/engagements` | Workroom | Active | **PASS** |
| **Messages** | `/dashboard/creator/messages` | Chat | Active | **PASS** |
| **Notifications** | `/dashboard/creator/notifications` | Notifications | Active | **PASS** |
| **Profile** | `/dashboard/profile` | Account Profile | Active | **PASS** |
| **Billing History** | `/dashboard/creator/billinghistory` | Billing | Active | **PASS** |
| **Settings** | `/dashboard/creator/settings` | Settings | Active | **PASS** |

### Sidebar Audit Findings:
- The sidebar accurately reflects Phase 3.1–3.7 routes!
- However, Phase 4 is condensed into a single entry ("Construction Engine"), with none of the 7 stages exposed in navigation.
- The parent label "Offers & Marketplace" is legacy wording from the old Phase 4 offer model.

---

## 31. DASHBOARD VS. SIDEBAR RESPONSIBILITY

- **Current Problem:** Both the dashboard and the sidebar try to present navigation, but with conflicting mental models:
  - Sidebar shows detailed 3.1–3.7 steps.
  - Dashboard hides 3.1–3.7 and shows a 6-phase stepper where Phase 4 is labeled "Pricing".
- **Target Separation of Concerns:**
  - **Sidebar:** Full hierarchical navigation for direct stage access.
  - **Dashboard:** Executive command center answering *"Where am I?"*, *"What needs my attention?"*, *"What is my next action?"*, and *"What outputs are ready?"*.

---

## 32. DASHBOARD CARDS — DATA SOURCE MATRIX

| Dashboard Card | Current Data Source | Canonical Data Source | Classification | Action Needed |
| :--- | :--- | :--- | :---: | :--- |
| **Welcome Header** | `user.name`, coarse `dashboardState` | `user`, `CreatorJourney`, `Roadmap` | **OUTDATED** | Update state messaging to reflect real phases. |
| **Idea Clarity Score** | `project.clarityScore` | `CreatorIdea.Project.ClarityScore` | **CORRECT** | Keep as top KPI. |
| **AI Assets Generated** | `creatorDocumentsApi.list()` | `IdeaDocuments` Collection | **CORRECT** | Keep as count of generated artifacts. |
| **Investor Readiness** | `dashboardStats.investorReadinessScore` | `Phase3Data.InvestorReadinessScore` | **MISLEADING** | Hide or dim until Phase 3.7 reached. |
| **Interested Buyers** | `phase5Data.pathB.seedFunding` | `DealExecutions` (Phase 5/6) | **MISLEADING** | Remove from top KPI row for early-stage creators. |
| **HumainX Profile Card** | `creatorProfileApi.getCompleteness()` | `ProfessionalProfile` Completeness | **CORRECT** | Keep; update badge to show personalization state. |
| **Your Project Card** | `project.*` | `CreatorIdea.Project` & `BrandKit` | **OUTDATED** | Fix hardcoded "SaaS" badge; display real BrandKit logo. |
| **Stepper (1–6)** | `completedCount` (ad-hoc) | `ComputedJourneyStatus` | **OUTDATED** | Align 6 phase labels with canonical canon. |
| **Continue Button** | `getNextCreatorAction()` | `getNextCreatorAction()` & `Roadmap` | **CORRECT** | Route calculation is safe, but needs Phase 4 depth. |
| **Financial Forecast Card**| `useForecastSessionTimed()` | `ForecastSessions` | **CORRECT** | Fix static EBITDA "—" field. |
| **Legal & Compliance Card**| `getLegalOverview()` | `CreatorLegalAssessment` | **CORRECT** | Keep; fully compliant with Stage 3.4. |
| **Document Vault Card** | `creatorDocumentsApi.list()` | `IdeaDocuments` | **CORRECT** | Keep as real downloadable assets list. |
| **Messages Card** | `useConversations()` | Chat Service | **CORRECT** | Keep in side rail. |
| **Notifications Card** | `useNotifications()` | Notification Service | **CORRECT** | Keep in side rail. |
| **Marketplace Card** | `matchedInvestorCount` | Deal / Marketplace Engine | **OUTDATED** | Replace with contextual Next Opportunities card. |
| **Quick Actions (4 tiles)**| Hardcoded links | Canonical module URLs | **MISLEADING** | Rename "Pitch Deck" to "Business Plan". Remove duplicate Crossroads links. |

---

## 33. STATIC / MOCK DATA AUDIT

Production-facing static/mock values identified in `page.tsx`:
1. **Line 411:** `<Badge ...>SaaS</Badge>` — Static hardcoded category badge.
2. **Line 408:** `project.category || 'FinTech'` — Fallback text `'FinTech'`.
3. **Line 587:** EBITDA Margin `<div className="...">—</div>` — Hardcoded placeholder.
4. **Line 834:** "Generate Pitch Deck - One-click AI generator" — Misleading label for Executive Business Plan.

---

## 34. USER-SPECIFIC DATA AUDIT

- **Authentication Check:** All queries enforce authenticated session tokens.
- **Tenant Isolation:**
  - `state.activeIdeaId` scopes idea-specific queries (`documents`, `dashboardRefs`, `legalOverview`).
  - `/creator/dashboard/stats` filters on authenticated `userId`.
- **Demo Fixture Check:** Zero hardcoded persona names ("Tanvir", "Marie", "Alex") were found in production components.

---

## 35. DASHBOARD QUERY / API AUDIT

### Network Call Inventory on Mount:
1. `GET /api/creator/journey?ideaId={id}` (`useCreatorProgress`)
2. `GET /api/creator/dashboard/stats` (`useDashboardStats`)
3. `GET /api/creator/idea-documents?ideaId={id}` (`creatorDocumentsApi.list`)
4. `GET /api/creator/profile/completeness` (`creatorProfileApi.getCompleteness`)
5. `GET /api/creator/journey?ideaId={id}` (`refsQ` - **DUPLICATE** of query #1)
6. `GET /api/creator/ai/forecast/session/{id}` (`useForecastSessionTimed`)
7. `GET /api/creator/legal-compliance/overview?ideaId={id}` (`Phase3LegalCard`)
8. `GET /api/chat/conversations` (`useConversations`)
9. `GET /api/notifications` (`useNotifications`)
10. `GET /api/creator/readiness?ideaId={id}` (Only in State F)

**Total Initial HTTP Requests:** **8 to 9 concurrent requests**.  
*Observation:* Query #5 (`refsQ`) duplicates query #1 (`useCreatorProgress`). Both fetch `/api/creator/journey`.

---

## 36. DASHBOARD AGGREGATION ARCHITECTURE

- **Current Pattern:** Client-side orchestration. The browser fires 8+ independent requests and stitches together the dashboard view in React state.
- **Risk Assessment:**
  - Elevated network traffic on mobile/slow connections.
  - Staggered loading and multiple skeleton layout shifts.
  - Risk of inconsistent UI snapshots if one query fails while others succeed.
- **Future Recommendation:** A dedicated `CreatorDashboardSummaryDto` endpoint (`GET /api/creator/dashboard/summary`) that aggregates project identity, phase statuses, top KPIs, legal readiness, and next best action in a single round-trip.

---

## 37. SINGLE SOURCE OF TRUTH AUDIT

- **BrandKit:** Current dashboard does not query BrandKit, but derives `project.branding` projection safely.
- **Legal:** Queries `CreatorLegalAssessment` exclusively via `Phase3LegalCard`.
- **QuickStart:** Guarded exclusively by `ProfessionalProfile.QuickStart` on backend.
- **Phase 4 Completion:** Evaluated by backend `Phase4CompletionResolver`.
- **Evaluation:** **PASS**. The dashboard does not create competing recalculation engines.

---

## 38. STALENESS VISIBILITY ON DASHBOARD

- **Current Implementation:**
  - `Phase3LegalCard` displays a refresh prompt when legal rules or metadata change.
- **Coverage Gap:**
  - If upstream data changes (e.g. founder updates 3.3 Forecast, which invalidates 4.6 Pricing), the dashboard surfaces **NO** "Update Available" notification.
  - Centralized staleness detection is missing from the dashboard view.

---

## 39. NOTIFICATIONS & ATTENTION MODEL

- **Current Implementation:**
  - Generic notification bell card (showing chat/system alerts).
- **Missing Attention Model:**
  - The dashboard lacks a dedicated **"Needs Attention"** section.
  - Critical blocking issues (e.g. "Legal compliance review pending", "Pricing cost floor breached", "HumainX availability needed") are buried in individual sub-pages.

---

## 40. COMPLETION & PROGRESS VISUALIZATION

### Identified Duplication:
The dashboard communicates progress in 4 overlapping ways simultaneously:
1. Top KPI: "Idea Clarity Score (75/100)"
2. Top KPI: "Investor Readiness (42/100)"
3. Stepper: "3 of 6 phases completed"
4. Progress Bar: "Builder Profile (60% complete)"
5. Context Badge: "Identity Ready"

*Finding:* Too many numbers competing for attention without a unified progress hierarchy.

---

## 41. HUMAN-CENTERED UX AUDIT

- **Good UX Copy:** "Good morning, {FirstName}", "Your defined project concept statement", "Run your financial forecast in Phase 3".
- **Internal / Technical Leakage:**
  - "Idea Clarity Score" vs. "Investor Readiness" vs. "Level Up Overall Progress".
  - "The Crossroads — Phase 5" (Crossroads is an internal architectural term; founder understands "Sell vs. Build").
  - "Smart Matching Locked".

---

## 42. "ONE THING AT A TIME" PRINCIPLE

- **Current Status:** **FAILED**.
- **Evidence:** When viewing the dashboard, the user sees:
  - 4 KPI cards
  - 1 HumainX banner
  - 1 Project hero card with "Continue" CTA
  - 1 Forecast chart with "View full" CTA
  - 1 Legal card with "Explore France Roadmap" CTA
  - 1 Document vault with "View vault" CTA
  - 1 Messages card with "Open Messages" CTA
  - 1 Notifications card with "View all" CTA
  - 4 Quick Action cards with individual CTAs
- **Result:** Over 10 competing call-to-actions on a single screen. There is no singular, unmistakable "Primary Action".

---

## 43. CURRENT CREATOR STATE SCENARIOS AUDIT

| Scenario | What Dashboard Shows | Primary CTA | What Is Misleading or Missing? |
| :--- | :--- | :--- | :--- |
| **A. New Creator after Quick Start** | Empty project card ("Start Project Now"), 0 KPIs | "Start Project Now" (`/phase-2`) | Shows "Interested Buyers (0)" and "Investor Readiness (—)". |
| **B. Phase 2 Partially Complete** | Clarity score, Project Name, "Phase 2 — Idea Refinement" | "Continue Setup" | Stepper shows Step 2 active. Zero Brand Studio preview. |
| **C. Phase 2 Done / Phase 3 Not Started** | Identity Ready badge, Clarity score, "Phase 3 — Project Intel" | "Continue Setup" (`/phase-3/market-study`)| Forecast card shows empty state. Legal card shows empty state. |
| **D. Mid Phase 3** | Forecast chart or Legal card populated | "Resume Project Intelligence" | 3.1, 3.2, 3.5 are completely invisible. |
| **E. Phase 3 Done / Phase 4 Not Started** | Subtitle: "Complete pricing options", Stepper on "Pricing" | "Continue Setup" (`/phase-4`) | **Severe:** Labels Phase 4 as "Pricing"; ignores 4.1–4.5 & 4.7. |
| **F. Mid Phase 4** | Same as above: "Phase 4 — Offer & Pricing" | "Resume Construction" | **Severe:** Zero visibility into 4.1–4.7 status or Roadmap tasks. |
| **G. Phase 4 Stale** | No change in dashboard | Generic continue | Dashboard does not notify user of upstream staleness. |
| **H. Phase 4 Done / Phase 5 Unlocked** | Crossroads Banner appears with "Sell" vs "Build" | Two competing buttons | Banner buttons execute local `advancePhase(5)`. |
| **I. Returning Creator** | Top KPIs, recent messages, last active phase card | "Continue" | Does not summarize *"What changed while you were away"*. |

---

## 44. RETURNING USER EXPERIENCE

The dashboard should answer 4 questions for a returning creator:
1. *Where am I?* → **Partially answered** (Current phase badge).
2. *What did I finish?* → **Partially answered** (Documents list & Forecast).
3. *What changed?* → **NOT ANSWERED** (No activity or staleness feed).
4. *What should I do next?* → **Unclear** (Diluted across 10 competing buttons).

---

## 45. EMPTY STATES AUDIT

- **Forecast Card:** Excellent empty state ("No forecast yet — Run your financial forecast in Phase 3").
- **Document Vault:** Excellent empty state ("No documents yet").
- **Messages & Notifications:** Clean empty states ("You're all caught up").
- **Overall Empty State Quality:** **PASS**. No fabricated demo data is shown.

---

## 46. ERROR STATES AUDIT

- **Implementation:** Uses custom `StatCell` component with retry button and error badge.
- **Safety Invariant:** A failed API call renders an explicit error indicator, **NEVER** a fake `0` or static placeholder.
- **Overall Error State Quality:** **PASS**.

---

## 47. LOADING EXPERIENCE AUDIT

- **Implementation:** Skeletons are used consistently across cards, stat cells, and charts.
- **Layout Shift:** Slight layout shift occurs when the Recharts ResponsiveContainer mounts after data loads.
- **Overall Loading Quality:** **PASS**.

---

## 48. RESPONSIVE AUDIT

- **Desktop (1440px – 1920px):** Clean 2-column layout, max-width constrained to `1136px`.
- **Tablet / Mobile:** Stacks into a single column.
- **Mobile Usability Flaws:**
  - Stepper connector line overlaps step circles on narrow screens (`< 480px`).
  - Quick Actions 4-column grid stacks into 2 columns nicely, but cards occupy substantial vertical height.

---

## 49. INFORMATION DENSITY AUDIT

- **Verdict:** Currently **unbalanced**.
- **Reason:** It displays excessive real estate for peripheral features (Chat, Notifications, Marketplace) while completely omitting core business engines (BrandKit, Market Study, Business Model, Roadmap, Pricing, GTM).

---

## 50. RECOMMENDED DASHBOARD INFORMATION ARCHITECTURE

```
Creator Dashboard Command Center
├── 1. Project Header (BrandKit Logo, Project Name, Tagline, Category, Verified Phase)
├── 2. "Continue Building" (Single Unmistakable Next Action Card + Effort + Reason)
├── 3. "Needs Attention" (Only if applicable: Staleness alerts, Legal reviews, Blocked tasks)
├── 4. "Your Journey" (High-level Phase 2 → 3 → 4 → 5 status cards)
├── 5. "Your Results & Assets" (Direct access to BrandKit, Market Study, Forecast, Business Plan, Roadmap)
└── 6. Activity & Communication Rail (Side rail: Messages, Notifications, Next Opportunities)
```

---

## 51. RESULTS VS. TASKS AUDIT

- **Current State:** Tasks and results are mixed. For example, Quick Actions mixes a result action ("Generate Pitch Deck") with external services ("Hire a Provider") and terminal decisions ("Marketplace Push").
- **Target Separation:**
  - **Results Section:** Read-only outputs that have been generated and can be viewed or exported.
  - **Tasks Section:** Actionable steps required to advance the venture.

---

## 52. DOWNLOADABLE OUTPUTS AUDIT

Outputs that exist in code and should be accessible from the dashboard:
- BrandKit (Tokens, SVG Logo)
- Market Study Summary
- Financial Forecast Export (Excel/PDF)
- France Legal Compliance Assessment
- Executive Business Plan PDF
- Operational Roadmap Task Export
- Pricing Strategy Specification
- GTM Launch Strategy Plan

---

## 53. MARKETPLACE & NETWORK SIGNALS

- **Current Implementation:** Displays "Marketplace / Matches" with investor match count.
- **Classification:** **PARTIAL**. Investor matches come from real `phase5Data` seeds, but displaying this to a Phase 2 or Phase 3 creator is premature.

---

## 54. MESSENGER AUDIT

- **Current Implementation:** Displays 3 recent conversations in a card with link to `/dashboard/creator/messages`.
- **Boundaries:** Standard MVP creator messaging. Does not overload the core view.

---

## 55. DASHBOARD SECURITY & AUTHORIZATION

- **Authentication:** Enforced by route layout and API client interceptors.
- **Role Enforcement:** Wrapped by `CreatorHumainXQuickStartGuard` and `CreatorPhaseGuard`. Non-creators are redirected.
- **Tenant Isolation:** Data queries are strictly bound to authenticated `userId` and `activeIdeaId`. Cross-user data leakage is strictly blocked.

---

## 56. DASHBOARD PERFORMANCE AUDIT

- **Bundle:** Recharts is imported directly; causes moderate bundle size increase.
- **Request Volume:** 8 to 9 parallel HTTP queries on mount.
- **Performance Verdict:** **PARTIAL**. Functional, but ripe for query consolidation via a unified summary DTO.

---

## 57. DASHBOARD TEST COVERAGE AUDIT

| Behavior / Area | Test Exists? | Test Type | Gap Description |
| :--- | :---: | :---: | :--- |
| **New Creator Mount** | NO | — | **GAP**: No component test verifies initial dashboard render for new user. |
| **Mid Phase 2 Mount** | NO | — | **GAP**: No test verifies Phase 2 state and clarity score display. |
| **Mid Phase 3 Mount** | NO | — | **GAP**: No test verifies forecast and legal cards mounting together. |
| **Mid Phase 4 Mount** | NO | — | **GAP**: No test verifies behavior when Phase 4 is in progress. |
| **State E Crossroads Banner** | NO | — | **GAP**: No test verifies Crossroads banner appearance. |
| **Route Guard Protection** | **YES** | Integration | `CreatorPhaseGuard.test.tsx` verifies unauthorized phase redirects. |
| **HumainX Guard Protection**| **YES** | Unit / Mock | `humainx-quick-start.test.tsx` verifies QuickStart redirection. |
| **Document Vault Rendering** | **YES** | Component | `tests/creator/frontend/page.test.tsx` verifies document list rendering. |

---

## 58. DASHBOARD ROUTE REGRESSION AUDIT

- Retired route `/dashboard/creator/offer-pricing`: **0 references in dashboard code**.
- Retired controller `CreatorPhase4Controller`: **0 references**.
- Retired endpoint `DecideCrossRoads`: **0 references**.
- Retired symbol `isQuickStartJourneyComplete`: **0 references**.
- Retired symbol `gtmSetup`: **0 references**.
- **Regression Status:** **CLEAN**.

---

## 59. CURRENT DASHBOARD SCREEN MAP

```
/dashboard/creator
├── Breadcrumb Header
├── Greeting & Date Bar
├── Top KPI Grid
│   ├── Idea Clarity Score (/100)
│   ├── AI Assets Generated (Count)
│   ├── Investor Readiness (/100)
│   └── Interested Buyers (Count)
├── [Conditional] Crossroads Banner (State E only)
├── HumainX Profile Card
├── Main Grid (2-Column)
│   ├── Left Column (66%)
│   │   ├── Your Project Card (Hero, Hardcoded SaaS, 6-Step Stepper, Continue CTA)
│   │   ├── AI Financial Forecast Card (Bar Chart, ARR, Break-Even, Static EBITDA)
│   │   ├── Phase3LegalCard (France Legal Overview & Readiness)
│   │   └── Document Vault Card (List of Persisted PDFs)
│   └── Right Column (33%)
│       ├── Messages Card (Recent Chat Threads)
│       ├── Notifications Card (Recent Alerts)
│       └── Marketplace Card (Matched Investors / Locked)
└── Bottom Row: Quick Actions Grid
    ├── "Generate Pitch Deck" (Links to Business Plan)
    ├── "Marketplace Push" (Links to Crossroads)
    ├── "Hire a Provider" (Links to Marketplace Services)
    └── "Build My Company" (Links to Crossroads)
```

---

## 60. RECOMMENDED FUTURE DASHBOARD MODEL

### Target Philosophy:
> **"One next action + a clear view of what has been achieved."**

The Creator Dashboard must not feel like an overloaded generator or a cluttered admin portal. It must feel like the Creator's **command center**. It should celebrate finished milestones, surface only actionable blockers, and clearly point to the single next step.

---

## 61. POTENTIAL TARGET DASHBOARD STRUCTURE EVALUATION

| Target Section | Assessment & Fit for Mondial ECO |
| :--- | :--- |
| **1. Project Header** | **EXCELLENT FIT**: Project Name, Tagline, Category, BrandKit SVG Logo, and Active Phase badge. |
| **2. Continue Building** | **CRITICAL UPGRADE**: Single primary card stating current task, reason, estimated effort, and direct CTA. |
| **3. Needs Attention** | **CRITICAL UPGRADE**: Clean alert tray appearing *only* when upstream staleness or blockers exist. |
| **4. Your Journey** | **EXCELLENT FIT**: 4 clean phase milestone cards (Phase 2 Identity, Phase 3 Intelligence, Phase 4 Construction, Phase 5 Crossroads) replacing the inaccurate 6-step stepper. |
| **5. Your Results** | **EXCELLENT FIT**: Direct download/view cards for generated assets (BrandKit, Forecast, Legal Roadmap, Business Plan, Operational Roadmap). |
| **6. Side Rail** | **BALANCED FIT**: Keeps Messages, Notifications, and Network signals cleanly separated from the primary build flow. |

---

## 62. OLD DASHBOARD CONCEPT COMPARISON

| Old Dashboard Concept | Current Status | Recommended Action | Justification |
| :--- | :--- | :---: | :--- |
| **Welcome back greeting** | Present | **KEEP** | Standard friendly greeting. |
| **Idea Readiness %** | Split across KPIs | **REPLACE** | Replace with unified Phase Progress & milestone status. |
| **Interested Buyers KPI** | Present in top row | **MOVE** | Premature for early creators; move to Phase 5/6 section. |
| **Phase 4 labeled "Pricing"**| Present in stepper | **REPLACE** | Replace with "Construction Engine" (4.1–4.7). |
| **Hardcoded "SaaS" badge** | Present in Project card | **REMOVE** | Defect; must display actual project sector/category. |
| **Business Plan Card** | Only in Document Vault | **EXPAND** | Give Phase 3.6 a dedicated result card with PDF export. |
| **Financial Forecast Chart**| Present & Live | **KEEP** | Real data; remove static EBITDA "—" field. |
| **Legal & Compliance Card** | Present (`Phase3LegalCard`) | **KEEP** | Authoritative France legal status; keep as result card. |
| **Resources / 4 SP Matches** | Absent (Marketplace card) | **REMOVE** | Obsolete concept; replaced by 4.3 Needs Engine. |
| **"Generate Pitch Deck" CTA** | Present in Quick Actions | **RENAME** | Mislabeled; rename to "Executive Business Plan". |
| **Crossroads Banner in State E**| Present | **REPLACE** | Replace with controlled Phase 5 transition modal/page. |

---

## 63. FINDINGS & TECHNICAL ACTION CARDS

### Finding F-01: Phase 4 Construction Engines Completely Absent from Dashboard
- **Area:** Phase 4 Dashboard Coverage
- **Current Behavior:** The dashboard has zero cards, statuses, or metrics for Stages 4.1 through 4.7.
- **Canonical Expectation:** Dashboard should display high-level readiness across Construction Snapshot, Roadmap, Needs, Skills, Support, Pricing, and GTM.
- **Impact:** Founders working in Phase 4 feel disconnected from their operational progress.
- **Severity:** **HIGH**
- **Recommended Action:** Introduce a dedicated Construction Engine summary module once Phase 4 is reached.

### Finding F-02: Misleading Stepper Labels & "Offer & Pricing" Legacy Wording
- **Area:** Navigation & Journey Visualization
- **Current Behavior:** Stepper step 4 is labeled "Pricing". Subtitle in State D reads "Complete pricing options to proceed". State D subtitle reads "Phase 4 — Offer & Pricing".
- **Canonical Expectation:** Phase 4 is titled "Construction & Launch Preparation Engine". Pricing is only Stage 4.6.
- **Impact:** Misinforms the founder of the scope of Phase 4 and perpetuates retired legacy terminology.
- **Severity:** **HIGH**
- **Recommended Action:** Rename step 4 to "Construction" and update subtitle copy.

### Finding F-03: Hardcoded "SaaS" Badge in Project Identity Card
- **Area:** Project Identity Header
- **Current Behavior:** Line 411 renders `<Badge>SaaS</Badge>` statically on every project.
- **Canonical Expectation:** Badges should reflect the project's real category and sector from `CreatorIdea.Project`.
- **Impact:** Cosmetic defect; mislabels non-SaaS projects.
- **Severity:** **MEDIUM**
- **Recommended Action:** Remove static badge; map dynamically from `project.category` and `project.sector`.

### Finding F-04: BrandKit Assets & Visual Tokens Omitted from Project Card
- **Area:** Phase 2 Brand Authority Integration
- **Current Behavior:** Renders an initial letter in a colored square instead of the founder's committed BrandKit logo and palette.
- **Canonical Expectation:** Project card should render `project.branding.logoAsset` and color tokens.
- **Impact:** Brand Studio outputs are invisible on the main project dashboard.
- **Severity:** **MEDIUM**
- **Recommended Action:** Connect project avatar to `Project.Branding.LogoAsset`.

### Finding F-05: Missing Dedicated Dashboard Summary Backend Endpoint
- **Area:** Query Architecture & Performance
- **Current Behavior:** Dashboard executes 8 to 9 concurrent HTTP queries on initial load.
- **Canonical Expectation:** A consolidated dashboard summary DTO.
- **Impact:** Increased load time and layout shifts on slower mobile connections.
- **Severity:** **LOW**
- **Recommended Action:** Future implementation of `GET /api/creator/dashboard/summary`.

---

## 64. REQUIRED OUTPUT ARTIFACTS

1. `analysis/mbc/creator/CREATOR_DASHBOARD_POST_ARCHITECTURE_AUDIT.md` (This document)
2. `analysis/mbc/creator/CREATOR_DASHBOARD_DATA_FLOW.mmd` (Mermaid Data Flow & Gap Diagram)

---

## 65. OPTIONAL DASHBOARD DATA FLOW DIAGRAM

Generated and verified at [`CREATOR_DASHBOARD_DATA_FLOW.mmd`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/analysis/mbc/creator/CREATOR_DASHBOARD_DATA_FLOW.mmd).

---

## 66. FINAL STATUS MATRIX

| Category / Area | Audit Status | Key Evaluation Summary |
| :--- | :---: | :--- |
| **Dashboard Route Integrity** | **PASS** | Compiles, runs, routes correctly |
| **Creator Authorization** | **PASS** | Role gate, tenant isolation, idea ownership enforced |
| **HumainX Dashboard Gate** | **PASS** | Layout guard enforces backend `QuickStart.CompletedAt` |
| **Project Identity Data** | **PARTIAL** | Real name/concept, but hardcoded "SaaS" badge and missing logo |
| **BrandKit Integration** | **FAIL** | Zero display of committed BrandKit logo, palette, or fonts |
| **Phase 2 Dashboard Coverage** | **PARTIAL** | Shows clarity score; hides Brand Studio status |
| **Phase 3 Dashboard Coverage** | **PARTIAL** | Shows Forecast & Legal; hides 3.1, 3.2, 3.5, 3.6 status |
| **Phase 4 Dashboard Coverage** | **FAIL** | 0% coverage of stages 4.1 to 4.7; mislabeled as "Pricing" |
| **Phase 5 Dashboard Transition** | **PARTIAL** | Crossroads banner present, but triggers local `advancePhase(5)` |
| **Legal 3.4 Dashboard Source** | **PASS** | Real `CreatorLegalAssessment` via `Phase3LegalCard` |
| **Business Plan Independence** | **PASS** | Independent from Phase 4; operates cleanly |
| **Phase 4 Completion Source** | **PASS** | Driven by backend `Phase4CompletionResolver` |
| **Single-Source-of-Truth Compliance**| **PASS** | No competing recalculation engines created |
| **Static / Mock Data** | **PRESENT** | Static "SaaS" badge, EBITDA "—", Pitch Deck misnomer |
| **Legacy Route References** | **NONE** | Zero references to `/offer-pricing` or dead controllers |
| **Next Best Action** | **PARTIAL** | Generic stage routing; does not surface Roadmap action |
| **Returning Creator UX** | **PARTIAL** | Welcomes user, but does not summarize changes |
| **Needs Attention Model** | **MISSING** | No unified alert tray for blockers or staleness |
| **Results Visibility** | **PARTIAL** | Shows Forecast and Docs; hides BrandKit and Business Plan |
| **Staleness Visibility** | **MISSING** | Upstream changes do not surface "Update Available" banners |
| **Founder Edit Safety** | **PASS** | Dashboard does not perform destructive writes |
| **Loading States** | **PASS** | Consistent skeleton loaders |
| **Error States** | **PASS** | Honest error cells with retry buttons |
| **Empty States** | **PASS** | Clean, honest empty states without fake data |
| **Responsive Layout** | **PASS** | Responsive from 1440px down to mobile |
| **Dashboard Test Coverage** | **FAIL** | Zero direct component tests for `creator/page.tsx` |
| **Performance / Query Architecture**| **PARTIAL** | 8–9 parallel queries on mount |
| **Dashboard Requires Redesign / Update** | **YES** | Outdated relative to frozen Phase 2–5 canonical canon |

---

## 67. THE 17 MOST IMPORTANT FINAL ANSWERS

1. **Is the current Creator Dashboard outdated after the recent architecture changes?**  
   **Yes.** While its underlying queries (forecast, legal, documents) use real backend data, its visual structure, phase stepper, labels, and coverage represent the legacy architecture and omit Phase 4 almost entirely.

2. **Which cards/components are now incorrect?**  
   - "Your Project" card stepper (labels Phase 4 as "Pricing", hardcodes "SaaS" badge).
   - "Currently on" subtitle (labels Phase 4 as "Offer & Pricing").
   - Quick Actions grid (labels Business Plan as "Generate Pitch Deck").
   - State E Crossroads banner (executes client-side `advancePhase(5)`).

3. **Which cards are still correct?**  
   - `Phase3LegalCard` (Stage 3.4 Legal intelligence).
   - `AI Financial Forecast` card (Phase 3.3 Forecast charts and figures).
   - `HumainXDashboardCard` (Builder Profile progress).
   - `Document Vault` card (Real generated PDFs).
   - `Messages` & `Notifications` side rail cards.

4. **What important Creator capabilities are missing from the dashboard?**  
   - BrandKit visual tokens (SVG logo, palette, typography).
   - Market Study summary (TAM/SAM/SOM, competitors).
   - Business Model summary (Revenue streams).
   - Company Formation status (SAS/SARL selection).
   - Operational Roadmap (Next best action task, horizons).
   - Needs, Skills, Support, Pricing, and GTM summaries (Stages 4.3–4.7).

5. **Is Idea Readiness still appropriate?**  
   **No.** Surfacing a generic `0/100` "Investor Readiness" score to a founder who is just starting Phase 2 creates premature discouragement and confusion.

6. **Is there any fake/global readiness metric that should be removed?**  
   There is no fake Construction Readiness metric (which is good), but the premature top-row "Interested Buyers (0)" and "Investor Readiness (—)" KPIs should be moved or deferred.

7. **What should be the single primary CTA?**  
   A dedicated **"Continue Building"** card derived from the founder's active stage or Phase 4.2 Roadmap Next Best Action.

8. **How should the dashboard determine "Next Best Action"?**  
   It should consume `Roadmap.NextBestAction` if in Phase 4, or the current incomplete phase stage resolver (3.1 → 3.7) if in Phase 3.

9. **What should a returning Creator immediately see?**  
   A 3-part greeting:
   1. Current project & phase status.
   2. What changed / Needs attention (if any).
   3. One prominent button to resume work.

10. **Which Phase 3 outputs should appear in Results?**  
    - Market Intelligence Brief
    - Business Model Canvas
    - 36-Month Financial Forecast (Excel/PDF)
    - France Legal & Compliance Roadmap
    - Executive Business Plan PDF

11. **Which Phase 4 outputs should appear in Results?**  
    - Construction Snapshot
    - Operational Roadmap
    - Pricing Policy & Revenue Model
    - GTM Launch Strategy Plan

12. **What belongs in "Needs Attention"?**  
    - Staleness notices ("Forecast updated → Pricing review suggested").
    - Regulatory alerts ("New statutory requirement applies").
    - Over-allocated weekly capacity warnings.

13. **Should Phase 4.8 or 4.9 appear yet?**  
    **No.** 4.8 is not implemented; 4.9 is reserved. They must remain completely absent.

14. **Are Resources/Matches still architecturally correct?**  
    **No.** The old concept of showing "4 SP matches" before analyzing needs is obsolete. It has been superseded by Phase 4.3 Needs Analysis.

15. **Does the sidebar need updating?**  
    **Yes.** The sidebar groups Phase 4 under "Offers & Marketplace" and only lists "Construction Engine". It should eventually be organized to reflect the canonical phases.

16. **Is a dedicated CreatorDashboardSummary backend contract advisable?**  
    **Yes.** Consolidating 8+ queries into `GET /api/creator/dashboard/summary` will significantly improve performance and eliminate client-side state stitching.

17. **What is the recommended final dashboard information architecture?**  
    A 5-section executive command center:
    1. Project Header
    2. Continue Building (Primary CTA)
    3. Needs Attention (Conditional Alerts)
    4. Your Journey (Milestones)
    5. Your Results & Assets

---

## 68. FINAL PRODUCT EXPLANATION: WHAT SHOULD THE CREATOR DASHBOARD FEEL LIKE?

> **"The Creator Dashboard must not feel like another AI generator or an administrative form.**  
> **It must feel like the founder's personal venture command center."**

When a young creator logs into Mondial ECO, they should not be overwhelmed by 10 competing buttons, premature investor metrics, or obscure legal codes. 

The dashboard should immediately give them complete clarity:
- **"Here is your project."** (Your name, your brand logo, your category).
- **"Here is where you stand."** (Clearly marked milestones showing what is done and what lies ahead).
- **"Here is what changed while you were away."** (Only if something needs review).
- **"Here is your exact next step."** (One prominent, unmistakable button).
- **"Here are the real business assets you own."** (One-click access to download your Business Plan, Financial Forecast, and BrandKit).

---

## 69. STOP CONDITION & REVIEW READINESS

- **Audit Complete:** Both audit artifacts have been generated:
  - [`CREATOR_DASHBOARD_POST_ARCHITECTURE_AUDIT.md`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/analysis/mbc/creator/CREATOR_DASHBOARD_POST_ARCHITECTURE_AUDIT.md)
  - [`CREATOR_DASHBOARD_DATA_FLOW.mmd`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/analysis/mbc/creator/CREATOR_DASHBOARD_DATA_FLOW.mmd)
- **Strict Compliance:** Zero production code, tests, database models, or UI designs were modified.
- **Status:** Complete. Awaiting your review and explicit instructions.
