# MONDIAL BUSINESS CREATION (MBC)
# CREATOR PHASE 3 — PER-SCREEN UI & FIGMA READINESS MAPPING

**Audit Date:** 2026-09-23  
**Design Reference:** Figma Node `57126-16986` ([Mondial-Dashboard-EDU](https://www.figma.com/design/yLDPLB9hIAIqfYY9uHuJom/Mondial-Dashboard-EDU?node-id=57126-16986&m=dev))  
**Core Architecture Principle:**  
$$\text{FIGMA} = \text{Visual / Layout / Component / Token Reference Only}$$
$$\text{PRODUCTION CODE} = \text{Sole Authority for Business Logic, API Contracts, Persistence \& Progression}$$
All static, hardcoded numbers, mock revenue, sample percentages, and dummy statuses visible in Figma designs are **DESIGN PLACEHOLDERS ONLY** and must never be committed as production fallback values.

---

## Screen 3.1 — Market Intelligence (TAM/SAM/SOM & Competitors)

- **Production route:** `/dashboard/creator/phase-3/market-study`
- **Production page:** [src/app/dashboard/creator/phase-3/market-study/page.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/phase-3/market-study/page.tsx)
- **Current components:**
  - `Phase3SetupShell`: Step progress header, milestone title, subtitle, credit badge, print CTA.
  - Sizing Summary Cards: TAM, SAM, SOM value cards with EUR formatting and methodology notes.
  - Competitor Table & Landscape Grid: Direct, indirect, and substitute competitors with pricing and defensibility notes.
  - Target Customer Segments: Persona cards with demographic and firmographic criteria.
  - Print View Modal: `MarketStudyPrintView.tsx` for client-side review and PDF generation.
- **Canonical API:**
  - `POST /api/ai/market-study`: Initiates AI generation job (20 credits).
  - `GET /api/ai/market-study/{sessionId}`: Polls session status and retrieves completed market study content.
  - `POST /api/ai/market-study/{sessionId}/regenerate`: Appends new version to session.
  - `POST /api/creator/journey/phase3/session`: Links session ID to journey.
- **Canonical persisted source:** `MarketStudySessions` collection (`Versions[].Content`), linked by ID to `CreatorIdea.Phase3Data.MarketStudySessionId`.
- **Upstream dependencies:** Phase 2 Idea Clarifier (`ClarifierSessionId` completed) + `CreatorIdea.Project` (Problem, Solution, TargetUser, Sector).
- **Downstream dependencies:** Step 3.2 (Business Model Canvas requires completed market study), Step 3.6 (Business Plan Section 04), Step 3.7 (Investor Readiness Market Evidence dimension), Step 4.7 (GTM).
- **Progression guard:** Cannot advance to Step 3.2 until `marketStudySession.status === 'Completed'`.
- **Founder-edit behavior:** Founder clicks "Regenerate". System appends a new `MarketStudyVersion` to the session. Prior versions are preserved in `Versions[]` history.
- **Staleness behavior:** If Phase 2 project definition changes, `GET /api/creator/phase-3/freshness` flags `MarketStudy` as having changed upstream; shows "Update Available" badge without destroying existing data.
- **Safe visual components to replace:**
  - Card layouts for TAM/SAM/SOM metrics.
  - Competitor table styling and category tabs.
  - Persona criteria chips and icon badges.
  - Loading skeleton and empty-state graphic.
- **Business logic that MUST remain untouched:**
  - Credit debit and balance check logic before starting generation.
  - Polling interval and exponential backoff in TanStack Query.
  - Session linking call (`api.post('/creator/journey/phase3/session', { kind: 'marketStudy', sessionId })`).
  - Print view modal integration (`MarketStudyPrintView`).
- **Potential Figma/static-data risks:**
  - *DESIGN PLACEHOLDER — MUST BIND TO REAL DATA:* Sample market sizes (e.g. "€4.2B TAM", "€450M SAM"), fictitious competitor names (e.g. "Acme Corp"), and mock growth percentages (+12.4%) must be strictly bound to `output.marketSizing` and `output.competitorLandscape`.
- **Required regression tests after redesign:**
  - `tests/creator/frontend/MarketStudyStep31Design.test.tsx` (must pass 8/8).

---

## Screen 3.2 — Business Model Canvas & Commercial Tiers

- **Production route:** `/dashboard/creator/phase-3/business-model`
- **Production page:** [src/app/dashboard/creator/phase-3/business-model/page.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/phase-3/business-model/page.tsx)
- **Current components:**
  - `Phase3SetupShell`: Navigation wrapper and credit balance tracker.
  - 9-Block Interactive Canvas Grid: Value Propositions, Customer Segments, Channels, Customer Relationships, Revenue Streams, Key Resources, Key Activities, Key Partnerships, Cost Structure.
  - Pricing & Revenue Tiers: Tier cards (e.g. Free, Starter, Enterprise) with billing frequencies and target segments.
  - Unit Economics Card: Variable cost margins, customer acquisition estimates, LTV expectations.
  - Print View Modal: `BusinessModelPrintView.tsx`.
- **Canonical API:**
  - `POST /api/ai/business-model`: Initiates AI generation job (15 credits). Asserts Step 3.1 completed.
  - `GET /api/ai/business-model/{sessionId}`: Retrieves versioned canvas document.
  - `POST /api/ai/business-model/{sessionId}/regenerate`: Appends new version.
  - `POST /api/creator/journey/phase3/session`: Links session ID to journey.
- **Canonical persisted source:** `BusinessModelSessions` collection (`Versions[].Content`), linked by ID to `CreatorIdea.Phase3Data.BusinessModelSessionId`.
- **Upstream dependencies:** Step 3.1 `MarketStudySessionId` (mandatory prerequisite) + `CreatorIdea.Project`.
- **Downstream dependencies:** Step 3.3 (Forecast requires pricing and cost structures), Step 3.4 (Legal applicability profile classification), Step 3.6 (Business Plan Section 05), Step 4.6 (Pricing Strategy).
- **Progression guard:** Backend `BusinessModelController.Start` returns `409 Conflict` if Step 3.1 is not completed. Frontend disables "Next to Forecast" until canvas is complete.
- **Founder-edit behavior:** Appends immutable `BusinessModelVersion` upon regeneration.
- **Staleness behavior:** If Step 3.1 is regenerated, Step 3.2 displays a banner: *"Market intelligence was updated. Refresh your business model to incorporate new sizing."*
- **Safe visual components to replace:**
  - 9-block layout grid and expandable block cards.
  - Pricing tier selector and feature pill badges.
  - Margin meters and unit economics progress indicators.
- **Business logic that MUST remain untouched:**
  - 3.1 completion check before enabling generation button.
  - Session linking call to `CreatorPhase3Controller`.
  - Export and print view trigger.
- **Potential Figma/static-data risks:**
  - *DESIGN PLACEHOLDER — MUST BIND TO REAL DATA:* Pre-baked pricing numbers (e.g. "€29/mo", "€99/mo") and sample customer segment text in Figma frames must bind to `output.revenueTiers` and `output.canvas.customerSegments`.
- **Required regression tests after redesign:**
  - Canvas block expansion, credit checking, and route navigation to `/phase-3/forecast`.

---

## Screen 3.3 — 36-Month Financial Forecast & Unit Economics

- **Production route:** `/dashboard/creator/phase-3/forecast`
- **Production page:** [src/app/dashboard/creator/phase-3/forecast/page.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/phase-3/forecast/page.tsx)
- **Current components:**
  - Model Assumptions Drawer: Input sliders and fields for ARPU (€/mo), OPEX (€/mo), Monthly Growth Rate (%), TAM (€), and Monthly Churn Rate (%).
  - KPI Metric Overview Cards: Month 36 Annualized Run-Rate, Break-Even Horizon, Peak Working Capital Need, Gross Margin Target.
  - Multi-Series Recharts Visualizer: Tabs for Revenue Growth, Monthly Cash Flow, and Cumulative Ending Balance across 36 months.
  - Monthly Projections Table: Expandable table showing Revenue, Fixed Costs, Variable Costs, Net Cash Flow, and Ending Balance for all 36 periods.
  - Break-Even & Risk Matrix: Break-even month readout and AI risk factors.
  - Print View Modal: `PlanForecastPrintView.tsx`.
- **Canonical API:**
  - `POST /api/ai/forecast`: Runs 12-month AI projection + C# deterministic 13–36 month geometric projection and break-even recomputation (15 credits).
  - `GET /api/ai/forecast/{sessionId}`: Retrieves 36-month array payload.
  - `PUT /api/ai/forecast/{sessionId}`: Saves founder manual overrides.
  - `POST /api/creator/journey/phase3/session`: Links session ID to journey.
- **Canonical persisted source:** `ForecastSessions` collection, linked by ID to `CreatorIdea.Phase3Data.ForecastSessionId`.
- **Upstream dependencies:** Step 3.2 Business Model (for initial pricing/OPEX grounding) or `CreatorIdea.Project`. Mandatory founder input: `MonthlyChurnPct` ($0 < \text{churn} \le 50\%$).
- **Downstream dependencies:** Step 3.5 Formation (TAM and growth rate influence entity selection), Step 3.6 Business Plan (Section 07 Financial Plan), Step 3.7 Investor Readiness (Financial Model dimension, break-even $\le 24$ mo, LTV/CAC $\ge 3$), Step 4.6 Pricing Strategy.
- **Progression guard:** Cannot advance to Step 3.4 until a completed forecast session exists.
- **Founder-edit behavior:** Founders can adjust parameters and re-simulate (`handleGenerate`) or edit numbers directly (`PUT /sessionId`). Updates append a new `ForecastVersion`.
- **Staleness behavior:** If Business Model changes, `GET /phase-3/freshness` sets `ForecastNeedsReview = true` with reason: *"Business model canvas was modified after financial forecast was generated."*
- **Safe visual components to replace:**
  - Recharts chart wrapper, tooltip styling, and legend placement.
  - KPI metric cards layout.
  - Monthly table presentation and pagination/scrolling.
  - Assumptions slider and input field controls.
- **Business logic that MUST remain untouched:**
  - Mandatory validation on `MonthlyChurnPct` ($0 < \text{churn} \le 50\%$).
  - Strict preservation of the backend's deterministic arithmetic (months 13–36 and break-even calculation). **Never calculate financial projections in frontend JavaScript.**
  - Session linking call upon generation.
- **Potential Figma/static-data risks:**
  - *DESIGN PLACEHOLDER — MUST BIND TO REAL DATA:* Sample chart curves, fake revenue numbers (e.g. "€120,000 in Year 1"), and arbitrary break-even badges (e.g. "Month 14") must strictly bind to `output.revenueForecast` and `output.breakEvenAnalysis`.
- **Required regression tests after redesign:**
  - `tests/creator/frontend/ForecastViewAndPrintTolerance.test.tsx` (must pass 7/7).

---

## Screen 3.4 — Legal & Compliance Framework (Statutory France Rules & Evidence Vault)

- **Production route:** `/dashboard/creator/phase-3/compliance`
- **Production page:** [src/app/dashboard/creator/phase-3/compliance/page.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/phase-3/compliance/page.tsx)
- **Current components:**
  - Workspace View Switcher: Toggle between "Legal Roadmap & Requirements" and "Evidence Vault".
  - Stage Navigation Tabs (`LegalStageNavigation`): Before Creation, Company Creation, Before Launch, Before Sale, Ongoing Compliance.
  - Statutory Requirements Canvas (`LegalRequirementCanvas`): Grouped statutory requirement cards with status toggles (`not_started`, `in_progress`, `ready_for_review`, `completed`), priority badges (`critical`, `recommended`), official legal sources (e.g. Legifrance, CNIL), and evidence attachment triggers.
  - Legal AI Guide Rail (`LegalAiGuideRail`): Slide-over guidance sheet explaining France statutory applicability and SP matching.
  - Evidence Attachment Modal (`LegalEvidenceModal`): Links documents from the idea's document vault to specific statutory requirements.
  - Evidence Vault Grid (`LegalEvidenceVaultView`): Document table with MIME types, sizes, link statuses, and audit trail.
  - Staleness Review Banner: Displays detected changes in business profile or rules catalog with human-readable change lists.
- **Canonical API:**
  - `GET /api/creator/legal-compliance/overview`: Retrieves current `LegalAssessment`, stage breakdowns, readiness %, and stale metadata.
  - `POST /api/creator/legal-compliance/evaluate`: Triggers deterministic evaluation via `LegalApplicabilityEngine.ReconcileAndEvaluate`.
  - `PATCH /api/creator/legal-compliance/item/{itemId}/status`: Updates requirement status.
  - `POST /api/creator/legal-compliance/item/{itemId}/evidence`: Links document as compliance evidence.
  - `POST /api/creator/legal-compliance/item/{itemId}/evidence/unlink`: Unlinks document.
  - `PATCH /api/creator/legal-compliance/evidence/{linkId}/status`: Updates review status.
- **Canonical persisted source:** `CreatorIdea.Phase3Data.LegalAssessment` (MongoDB). **`LegalChecklist` is DEPRECATED and has zero active writers.**
- **Upstream dependencies:** `CreatorIdea.Project` (Sector, Concept, Problem, Solution) + Step 3.2 Business Model (B2B, B2C, Online payments) + Step 3.3 Forecast (financial signals).
- **Downstream dependencies:** Step 3.5 Formation (FinTech badge detection), Step 3.6 Business Plan (Section 12 Legal & Regulatory Framework), Step 3.7 Investor Readiness (Legal Readiness dimension, max 15 points).
- **Progression guard:** New journeys require `LegalAssessment != null` to complete Phase 3.
- **Founder-edit behavior:** Manual status updates, evidence links, and notes are **100% preserved** during rule evaluation or reconciliation (`ReconcileAndEvaluate`).
- **Staleness behavior:** `LegalChangeDetector` compares SHA-256 snapshot hashes of the business profile and rules fingerprint. When upstream data changes, shows *"Your venture information changed after your last legal assessment"* banner with "Refresh Roadmap" button.
- **Safe visual components to replace:**
  - Stage navigation tab bar and progress pills.
  - Requirement card styling, category tags, and priority icons.
  - Evidence modal sheet and drag-and-drop file upload styling.
  - Staleness alert banner styling.
- **Business logic that MUST remain untouched:**
  - Preservation of the disclaimer: *"This feature provides planning guidance and does not constitute legal advice. Consult verified French legal counsel before filing."*
  - Distinction between founder completion and professional legal certification: **Never label founder-marked items as "Legally Certified"**.
  - Direct binding to `creatorJourneyApi.evaluateLegalCompliance` and `creatorJourneyApi.updateLegalItemStatus`.
- **Potential Figma/static-data risks:**
  - *DESIGN PLACEHOLDER — MUST BIND TO REAL DATA:* Hardcoded French statutory rules (e.g. "RGPD", "Mentions Légales", "ACPR") in Figma must bind to dynamic `overview.items` evaluated by the engine. Never hardcode statutory rules in JSX.
- **Required regression tests after redesign:**
  - Reconcile preservation test, status toggle test, evidence link test, and Section 12 generation test.

---

## Screen 3.5 — Company Formation & Founding Team Architecture

- **Production route:** `/dashboard/creator/phase-3/formation`
- **Production page:** [src/app/dashboard/creator/phase-3/formation/page.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/phase-3/formation/page.tsx)
- **Current components:**
  - Entity Structure Recommendation Card: Primary recommendation (SAS, SAS-U, SARL) with detailed rationale, formation capital, timeline, and estimated setup cost.
  - Alternative Entity Selector: Cards to compare and override recommendation (e.g. choose SARL over SAS).
  - Statutory Setup Sequence Checklist: Incorporation stages (Statutes drafting, Capital deposit with notary/bank, Legal announcement, INPI filing).
  - Founding Team Skills Matrix: "You Have" (declared founder skills) vs. "You Need" (skill gaps and hiring needs).
  - Co-Founder Brief Configuration: Role needed, equity range (<5%, 5–15%, 15–30%, 30%+), and location preference.
  - Matched Service Providers: Directory cards of verified providers (lawyers, CPAs, developers) to fulfill skill gaps.
- **Canonical API:**
  - `POST /api/creator/ai/formation-generator/start`: Evaluates deterministic formation logic and persists recommendation.
  - `PATCH /api/creator/formation/select-type`: Persists chosen entity type (marks `IsOverride = true` if differing from suggestion).
  - `PATCH /api/creator/formation/skills`: Persists self-declared skills and co-founder draft.
  - `GET /api/creator/sp-matches`: Fetches matching service providers.
  - `POST /api/creator/workroom/open`: Opens a live Messenger workroom with a provider.
- **Canonical persisted source:** `CreatorIdea.Phase3Data.FormationGenerator` (MongoDB).
- **Upstream dependencies:** `CreatorIdea.Project` (Sector, Concept, Solo vs. Team keywords), Step 3.3 Forecast (TAM, monthly growth %), Step 3.4 Legal (FinTech badge).
- **Downstream dependencies:** Step 3.6 Business Plan (Section 08 Operations & Team), Step 3.7 Investor Readiness (Team Credibility dimension, max 20 points), Step 4.3 Needs Analysis, Phase 6 Level Up (INPI company registration).
- **Progression guard:** Cannot advance to Step 3.6 until `p3.FormationGenerator != null`.
- **Founder-edit behavior:** Founder's self-declared skills (`YouHave`) and entity overrides (`SelectedType`) are protected by `SkillsDeclared = true`, preventing future re-generation from wiping manual input.
- **Staleness behavior:** If Forecast or Project inputs change, `freshness.BusinessPlanStaleSections` flags Section 08 as stale.
- **Safe visual components to replace:**
  - Entity card grid and comparison table.
  - Skill chip pills, gap badges, and co-founder preference selectors.
  - SP directory cards and CTA buttons.
- **Business logic that MUST remain untouched:**
  - Boundary separation: Step 3.5 **guides and prepares** formation, but **does not execute registration** (company creation execution is strictly Phase 6).
  - Direct call to `creatorJourneyApi.selectFormationType` and `creatorJourneyApi.declareFormationSkills`.
- **Potential Figma/static-data risks:**
  - *DESIGN PLACEHOLDER — MUST BIND TO REAL DATA:* Static entity recommendations (e.g. "SAS recommended") in Figma frames must bind to `formation.recommendedType` and `formation.recommendationReason`.
- **Required regression tests after redesign:**
  - Entity selection patch test, skill declaration persistence test, and workroom opening test.

---

## Screen 3.6 — Executive Business Plan (12-Section Synthesized Masterplan)

- **Production route:** `/dashboard/creator/phase-3/business-plan`
- **Production page:** [src/app/dashboard/creator/phase-3/business-plan/page.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/phase-3/business-plan/page.tsx)
- **Current components:**
  - Document Navigation Sticky Sidebar: 12-section anchor navigation with edit indicators and completion badges.
  - Continuous Document Canvas: Synthesized 12 standard sections:
    1. Executive Summary
    2. Problem Statement
    3. Solution & Value Proposition
    4. Market Analysis (TAM/SAM/SOM from 3.1)
    5. Business Model & Commercial Structure (from 3.2)
    6. Go-To-Market Strategy
    7. Financial Plan (36-month P&L and Break-Even from 3.3)
    8. Operations, Team & Company Structure (from 3.5)
    9. Technology & IP Assets
    10. Customer Success & Retention
    11. Risk Register & Mitigations
    12. Legal & Regulatory Framework (from 3.4)
  - Inline Section Editor: Markdown / Rich text editing of individual sections with "Save Changes" and "Rewrite with AI" options.
  - Sync Status Badges: Visual tags indicating live synchronization with upstream modules (e.g. *"Synced (36-mo Model)"*, *"Synced (Step 3.4 Legal)"*).
  - Export Toolbar: Client-side PDF export and print formatting.
- **Canonical API:**
  - `POST /api/ai/business-plan`: Synthesizes 12 sections from 3.1–3.5 + Project Core (25 credits).
  - `GET /api/ai/business-plan/{sessionId}`: Retrieves plan document.
  - `PATCH /api/ai/business-plan/{sessionId}/section`: Saves manual edits to an individual section.
  - `POST /api/ai/business-plan/rewrite-section`: Generates AI rewrite preview (5 credits).
  - `POST /api/creator/journey/phase3/session`: Links session ID to journey.
- **Canonical persisted source:** `BusinessPlanSessions` collection, linked by ID to `CreatorIdea.Phase3Data.BusinessPlanSessionId`.
- **Upstream dependencies:** `CreatorIdea.Project` (Core Identity), Step 3.1 `MarketStudySession`, Step 3.2 `BusinessModelSession`, Step 3.3 `ForecastSession`, Step 3.4 `LegalAssessment`, Step 3.5 `FormationGenerator`.
- **Downstream dependencies:** Step 3.7 Investor Readiness (contributes to Market Evidence and overall plan completion), Phase 5 Crossroads / Data Room.
- **Progression guard:** Backend requires both Market Study and Business Model to be completed before allowing generation. Phase 3 cannot complete without a completed Business Plan.
- **Cross-Phase Invariant Verification:**  
  $$\text{Phase4Data} == \text{null} \implies \text{Business Plan generates, renders, and completes 100\% successfully.}$$
  The reference to `journey.phase4Data?.gtmStrategy` at line 791 of `page.tsx` is an optional display flag only and never blocks plan generation or completion.
- **Founder-edit behavior:** Manual edits to any section append a new `BusinessPlanVersion` with `IsEdited = true` on that section. Subsequent regenerations respect and flag edited sections.
- **Staleness behavior:** If Forecast, Formation, or Legal are modified, `GET /phase-3/freshness` identifies the exact stale sections (Section 07, Section 08, or Section 12) and displays warning chips on the navigation sidebar.
- **Safe visual components to replace:**
  - 12-section sidebar layout and anchor links.
  - Document typography, line spacing, callout boxes, and print styles.
  - Section action toolbar (Edit, AI Rewrite, Save, Cancel).
  - Document header, cover page, and metadata presentation.
- **Business logic that MUST remain untouched:**
  - Section ID mappings (`executive-summary`, `financial-plan`, `legal-framework`, etc.).
  - Section uneditable enforcement for external synced modules (`friendlyError`).
  - Session linking call to journey.
- **Potential Figma/static-data risks:**
  - *DESIGN PLACEHOLDER — MUST BIND TO REAL DATA:* Mock business plan prose, fictional founder biographies, and sample market share figures in Figma must bind to `output[sectionKey]`.
- **Required regression tests after redesign:**
  - `tests/creator/frontend/BusinessPlanErrorClassification.test.tsx` (must pass 6/6), section edit test, and PDF export test.

---

## Screen 3.7 — Investor Readiness Audit & Phase 3 Final Gate

- **Production route:** `/dashboard/creator/phase-3/complete`
- **Production page:** [src/app/dashboard/creator/phase-3/complete/page.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/phase-3/complete/page.tsx)
- **Current components:**
  - Readiness Header Card: Institutional letter grade (A/B/C/D), total readiness score (0–100), and readiness label (*"Not Ready"*, *"Developing"*, *"Strong"*, *"Investor-Ready"*).
  - 5-Dimension Radar / Progress Bars:
    1. Concept Clarity (Max 20 pts)
    2. Market Evidence (Max 20 pts)
    3. Financial Model (Max 25 pts)
    4. Legal Readiness (Max 15 pts)
    5. Team Credibility (Max 20 pts)
  - Actionable Deduction Cards: Itemized list of lost points with remediation instructions and deep-links back to earlier Phase 2/3 screens to fix them.
  - Phase 4 Unlocks Preview: Cards illustrating upcoming capabilities in Phase 4 (Commercial Pricing, Resource Modeling, GTM Engine).
  - Final Milestone Gate CTA: "Continue to Phase 4" button, enabled only when `phase3.status === 'completed'`.
- **Canonical API:**
  - `PATCH /api/creator/masterplan/complete`: Evaluates deterministic readiness score via `InvestorReadinessCalculator.ComputeReadiness` and completes Phase 3.
  - `GET /api/creator/phase-3/freshness`: Checks for upstream drift.
  - `GET /api/creator/journey`: Retrieves computed journey status (`phase3.status: "completed"`, `phase4.status: "available"`).
- **Canonical persisted source:** `CreatorIdea.Phase3Data.InvestorReadinessScore` (MongoDB).
- **Upstream dependencies:** Completed sessions for 3.1 Market Study, 3.2 Business Model, 3.3 Forecast, 3.4 Legal Assessment, 3.5 Formation, and 3.6 Business Plan.
- **Downstream dependencies:** Unlocks Phase 4 (`/dashboard/creator/phase-4`) subject to `Phase4ProfileGuard` (HumainX profile completeness).
- **Progression guard:** Backend returns `422 UnprocessableEntity` with `"Missing module: ..."` if any mandatory module is incomplete. The UI catches 422, disables the continue CTA, and displays the exact missing module.
- **Founder-edit behavior:** Non-editable calculation. If a founder revises upstream modules (e.g. improves legal compliance or uploads evidence), they click "Re-run Audit" to recompute score deterministically.
- **Staleness behavior:** If upstream data changed after evaluation, displays *"Score update available — upstream models have evolved"* banner with a re-run trigger.
- **Safe visual components to replace:**
  - Score badge, letter grade circle, and progress bar styles.
  - Deduction card styling and severity icons.
  - Phase 4 unlock feature cards.
- **Business logic that MUST remain untouched:**
  - The 5-dimension deterministic formula:
    $$\text{Total} = \text{ConceptClarity}(20) + \text{MarketEvidence}(20) + \text{FinancialModel}(25) + \text{LegalReadiness}(15) + \text{TeamCredibility}(20)$$
  - Remediation deep-link routing (`remediationRoute`).
  - Double-gate check before navigating to Phase 4:
    $$\text{canContinue} = (\text{computed.phase3.status} == \text{'completed'}) \land (\text{computed.phase4.status} == \text{'available'})$$
- **Potential Figma/static-data risks:**
  - *DESIGN PLACEHOLDER — MUST BIND TO REAL DATA:* Sample readiness scores (e.g. "82/100", "Grade A") and mock deduction issues in Figma must strictly bind to `readiness.total`, `readiness.breakdown`, and `readiness.deductions`.
- **Required regression tests after redesign:**
  - `tests/creator/frontend/CreatorPhaseGuard.test.tsx` (must pass 12/12) and readiness deduction link navigation test.
