# Complete Page Inventory — Creator Phase 2 & Phase 3

**Audit Date:** 2026-09-19  
**Monorepo:** `mondial_monorepo_fullstack`  
**Path:** `src/app/dashboard/creator/`

---

## 1. Phase 2 Pages

### 1.1 Phase 2 Root Redirect
- **Page Name:** Phase 2 Entry Dispatcher
- **Route:** `/dashboard/creator/phase-2`
- **Main Component:** `Phase2IndexPage` (`src/app/dashboard/creator/phase-2/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.selectEntryPath('already_have_idea')`
  - `creatorJourneyApi.setPhase2CurrentStep(6)`
- **Data Read:** User session / auth token
- **Data Written:** `phase2Data.selectedEntryPath = "already_have_idea"`, `phase2.currentStep = 6`
- **Primary CTA:** None (Automatic client-side redirect)
- **Next Page:** `/dashboard/creator/phase-2/clarifier`
- **Completion Status:** Fully Implemented (Redirect Shell)

---

### 1.2 Idea Clarifier
- **Page Name:** AI Idea Clarifier
- **Route:** `/dashboard/creator/phase-2/clarifier`
- **Main Component:** `ClarifierPage` (`src/app/dashboard/creator/phase-2/clarifier/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.get(activeIdeaId)`
  - `creatorJourneyApi.startClarifier(rawIdea, activeIdeaId)`
  - `creatorJourneyApi.sendClarifierMessage(sessionId, message)`
  - `creatorJourneyApi.finalizeClarifier(sessionId)`
- **Data Read:** `project.problem`, `project.solution`, `project.targetUser`, `phase2Data.clarifierSessionId`, chat messages history
- **Data Written:**
  - `ClarifierSession` document (6 questions, answers, transcript)
  - `project.clarityScore` (0–100 integer)
  - `project.problem`, `project.solution`, `project.targetUser`
  - `project.creatorEdge`, `project.marketGap`, `project.category`
- **Primary CTA:** "Generate My Concept Summary" (`finalizeClarifier`)
- **Next Page:** `/dashboard/creator/phase-2/idea-summary`
- **Completion Status:** Fully Implemented (Interactive AI Interview)

---

### 1.3 Idea Summary
- **Page Name:** Clarified Idea Result
- **Route:** `/dashboard/creator/phase-2/idea-summary`
- **Main Component:** `IdeaSummaryPage` (`src/app/dashboard/creator/phase-2/idea-summary/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.get(activeIdeaId)`
  - `creatorJourneyApi.setPhase2CurrentStep(8)`
- **Data Read:** `project.clarityScore`, `project.problem`, `project.solution`, `project.targetUser`, `project.category`, `project.creatorEdge`
- **Data Written:** `phase2.currentStep = 8`
- **Primary CTA:** "Continue to Project Name" (`router.push('/dashboard/creator/phase-2/concept-name')`)
- **Secondary CTA:** "Refine My Answers" (`router.push('/dashboard/creator/phase-2/clarifier')`)
- **Next Page:** `/dashboard/creator/phase-2/concept-name`
- **Completion Status:** Fully Implemented (Verification & Handoff Screen)

---

### 1.4 Concept & Name Generator
- **Page Name:** Concept & Name Selection
- **Route:** `/dashboard/creator/phase-2/concept-name`
- **Main Component:** `ConceptNamePage` (`src/app/dashboard/creator/phase-2/concept-name/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.get(activeIdeaId)`
  - `creatorJourneyApi.updateProject({ name, tagline, category }, activeIdeaId)`
  - `creatorJourneyApi.setPhase2CurrentStep(9)`
- **Data Read:** `project.name`, `project.tagline`, `project.category`, `project.solution`, `project.problem`
- **Data Written:**
  - `project.name` (string, max 60 chars, blocked against generic nouns)
  - `project.tagline` (string)
  - `project.category` (string)
  - `phase2.currentStep = 9`
- **Primary CTA:** "Confirm Project Identity" (`router.push('/dashboard/creator/phase-2/branding')`)
- **Next Page:** `/dashboard/creator/phase-2/branding`
- **Completion Status:** Fully Implemented (Custom + AI Name Options)

---

### 1.5 Branding Choice Gateway
- **Page Name:** Brand Identity Gateway
- **Route:** `/dashboard/creator/phase-2/branding`
- **Main Component:** `BrandingChoicePage` (`src/app/dashboard/creator/phase-2/branding/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.get(activeIdeaId)`
  - `creatorJourneyApi.skipBranding(activeIdeaId)`
- **Data Read:** `project.name`, `project.branding`
- **Data Written:** `project.branding.brandingMethod = "skipped"` (if user skips)
- **Primary CTA:** "Open Brand Studio" (`router.push('/dashboard/creator/phase-2/brand-studio')`)
- **Secondary CTA:** "Skip for now" (`skipBranding()` -> `router.push('/dashboard/creator/phase-2/complete')`)
- **Next Page:** `/dashboard/creator/phase-2/brand-studio` (or `/phase-2/complete`)
- **Completion Status:** Fully Implemented

---

### 1.6 Brand Studio
- **Page Name:** Brand Identity Studio
- **Route:** `/dashboard/creator/phase-2/brand-studio`
- **Main Component:** `BrandStudioPage` (`src/app/dashboard/creator/phase-2/brand-studio/page.tsx`) hosting `BrandStudioShell`
- **API Calls:**
  - `creatorJourneyApi.get(activeIdeaId)`
  - `creatorJourneyApi.brandKitSave(payload, activeIdeaId)`
- **Data Read:** `project.name`, `project.problem`, `project.solution`, `project.category`
- **Data Written:**
  - `project.branding.logoAsset` (SVG string + base64 PNG)
  - `project.branding.logoType` ("monogram" | "wordmark" | "abstract")
  - `project.branding.colorPalette` (Array of 4 Hex codes)
  - `project.branding.paletteName` (string)
  - `project.branding.typographyPairing` (string)
  - `project.branding.brandingMethod = "ai_tool"`
- **Primary CTA:** "Save & Finalize Brand Kit" (`router.push('/dashboard/creator/phase-2/brand-kit')`)
- **Next Page:** `/dashboard/creator/phase-2/brand-kit`
- **Completion Status:** Fully Implemented (7-step sequential modal pipeline)

---

### 1.7 Brand Kit Hub
- **Page Name:** Brand Kit Hub & Asset Repository
- **Route:** `/dashboard/creator/phase-2/brand-kit`
- **Main Component:** `BrandKitPage` (`src/app/dashboard/creator/phase-2/brand-kit/page.tsx`) hosting `BrandKitHubView`
- **API Calls:**
  - `creatorJourneyApi.get(activeIdeaId)`
  - `creatorJourneyApi.downloadBrandKitZip(activeIdeaId)`
- **Data Read:** `project.branding.*`, `project.name`, `project.tagline`
- **Data Written:** Exports/downloads client-side ZIP assets
- **Primary CTA:** "Continue to Phase 2 Completion" (`router.push('/dashboard/creator/phase-2/complete')`)
- **Next Page:** `/dashboard/creator/phase-2/complete`
- **Completion Status:** Fully Implemented

---

### 1.8 Phase 2 Complete
- **Page Name:** Phase 2 Complete Showcase
- **Route:** `/dashboard/creator/phase-2/complete`
- **Main Component:** `Phase2CompletePage` (`src/app/dashboard/creator/phase-2/complete/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.get(activeIdeaId)`
  - `advancePhase(2)` -> POST `/api/creator/journey/advance-phase`
- **Data Read:** `project.name`, `project.tagline`, `project.branding`, `project.clarityScore`, `computedStatus.phase3.status`
- **Data Written:** Backend unlocks Phase 3 (`phase3.status = "available"`)
- **Primary CTA:** "Continue to Phase 3: Business Plan" (`router.push('/dashboard/creator/phase-3')`)
- **Next Page:** `/dashboard/creator/phase-3` (redirects to `/dashboard/creator/phase-3/market-study`)
- **Completion Status:** Fully Implemented

---

## 2. Phase 3 Pages

### 2.1 Phase 3 Root Redirect
- **Page Name:** Phase 3 Entry Dispatcher
- **Route:** `/dashboard/creator/phase-3`
- **Main Component:** `Phase3IndexPage` (`src/app/dashboard/creator/phase-3/page.tsx`)
- **API Calls:** None
- **Data Read:** None
- **Data Written:** None
- **Primary CTA:** None (Immediate client-side router replace)
- **Next Page:** `/dashboard/creator/phase-3/market-study`
- **Completion Status:** Fully Implemented (Redirect Shell)

---

### 2.2 Market Study (Step 3.1)
- **Page Name:** Market Sizing & Competitive Intelligence
- **Route:** `/dashboard/creator/phase-3/market-study`
- **Main Component:** `MarketStudyPage` (`src/app/dashboard/creator/phase-3/market-study/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.get(activeIdeaId)`
  - `useStartMarketStudy()` -> POST `/api/creator/ai/market-study/start`
  - `useMarketStudySessionTimed(sessionId)` -> GET `/api/creator/ai/market-study/session/{id}`
  - `completeStep(3, 1)` -> PATCH `/api/creator/journey/step-progress`
- **Data Read:** `project.problem`, `project.solution`, `project.targetUser`, `phase3Data.marketStudySessionId`
- **Data Written:**
  - `MarketStudySession` MongoDB document (TAM/SAM/SOM values, competitor table, demand signals, market risks, founder gap)
  - `phase3Data.marketStudySessionId`
- **Primary CTA:** "Next: Business Model" (`completeStep(3, 1)` -> `router.push('/dashboard/creator/phase-3/business-model')`)
- **Next Page:** `/dashboard/creator/phase-3/business-model`
- **Completion Status:** Fully Implemented

---

### 2.3 Business Model (Step 3.2)
- **Page Name:** 9-Block Business Model Canvas
- **Route:** `/dashboard/creator/phase-3/business-model`
- **Main Component:** `BusinessModelPage` (`src/app/dashboard/creator/phase-3/business-model/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.get(activeIdeaId)`
  - `useStartBusinessModel()` -> POST `/api/creator/ai/business-model/start`
  - `useBusinessModelSessionTimed(sessionId)` -> GET `/api/creator/ai/business-model/session/{id}`
  - `completeStep(3, 2)` -> PATCH `/api/creator/journey/step-progress`
- **Data Read:** `project.problem`, `project.solution`, `phase3Data.marketStudySessionId`, `phase3Data.businessModelSessionId`
- **Data Written:**
  - `BusinessModelSession` MongoDB document (9 canvas blocks, unit economics, revenue streams, cost structures)
  - `phase3Data.businessModelSessionId`
- **Primary CTA:** "Proceed to Business Plan" (`completeStep(3, 2)` -> `router.push('/dashboard/creator/phase-3/business-plan')`)
- **Next Page:** `/dashboard/creator/phase-3/business-plan`
- **Completion Status:** Fully Implemented

---

### 2.4 Executive Business Plan (Step 3.3)
- **Page Name:** Executive Business Plan Document
- **Route:** `/dashboard/creator/phase-3/business-plan`
- **Main Component:** `BusinessPlanPage` (`src/app/dashboard/creator/phase-3/business-plan/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.get(activeIdeaId)`
  - `creatorJourneyApi.getLegalRegulatoryFramework(activeIdeaId)`
  - `useStartBusinessPlan()` -> POST `/api/creator/ai/business-plan/start`
  - `useBusinessPlanSessionTimed(sessionId)` -> GET `/api/creator/ai/business-plan/session/{id}`
  - `creatorJourneyApi.patchBusinessPlanSection(sessionId, sectionId, body)` -> PATCH `/api/creator/ai/business-plan/session/{id}/sections/{sectionId}`
  - `creatorJourneyApi.rewriteBusinessPlanSection(sessionId, sectionId, prompt)`
  - `completeStep(3, 3)` -> PATCH `/api/creator/journey/step-progress`
- **Data Read:**
  - `phase3Data.marketStudySessionId`, `phase3Data.businessModelSessionId`
  - `project.problem`, `project.solution`, `project.targetUser`
  - `LegalRegulatoryFramework` (deterministic synthesis from Step 3.5)
- **Data Written:**
  - `BusinessPlanSession` MongoDB document (12 continuous-scroll sections)
  - `phase3Data.businessPlanSessionId`
  - User inline overrides in `_sectionMeta`
- **Primary CTA:** "Proceed to Financial Forecast" (`completeStep(3, 3)` -> `router.push('/dashboard/creator/phase-3/forecast')`)
- **Next Page:** `/dashboard/creator/phase-3/forecast`
- **Completion Status:** Fully Implemented

---

### 2.5 Financial Forecast (Step 3.4)
- **Page Name:** Financial Projections & 36-Month Simulations
- **Route:** `/dashboard/creator/phase-3/forecast`
- **Main Component:** `ForecastPage` (`src/app/dashboard/creator/phase-3/forecast/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.get(activeIdeaId)`
  - `useStartForecast()` -> POST `/api/creator/ai/forecast/start`
  - `useForecastSessionTimed(sessionId)` -> GET `/api/creator/ai/forecast/session/{id}`
  - `creatorJourneyApi.setPhase3Session('forecast', sessionId)`
  - `completeStep(3, 4)` -> PATCH `/api/creator/journey/step-progress`
- **Data Read:** `phase3Data.businessPlanSessionId`, `phase3Data.forecastSessionId`, `inputs` (ARPU, OPEX, growth, churn, TAM)
- **Data Written:**
  - `ForecastSession` MongoDB document (36 monthly revenue/cost/cash flow points, break-even month, sensitivity, risk register)
  - `phase3Data.forecastSessionId`
- **Primary CTA:** "Proceed to Legal & Compliance" (`completeStep(3, 4)` -> `router.push('/dashboard/creator/phase-3/compliance')`)
- **Next Page:** `/dashboard/creator/phase-3/compliance`
- **Completion Status:** Fully Implemented

---

### 2.6 Venture Compliance & Legal Intelligence (Step 3.5)
- **Page Name:** Legal & Compliance Workspace
- **Route:** `/dashboard/creator/phase-3/compliance`
- **Main Component:** `ComplianceWorkspacePage` (`src/app/dashboard/creator/phase-3/compliance/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.getLegalOverview(queryIdeaId)` -> GET `/api/creator/legal/overview`
  - `creatorJourneyApi.evaluateLegalCompliance(queryIdeaId)` -> POST `/api/creator/legal/evaluate`
  - `creatorJourneyApi.updateLegalItemStatus(itemId, newStatus, queryIdeaId)` -> PATCH `/api/creator/legal/items/{itemId}/status`
  - `creatorJourneyApi.attachLegalEvidence(itemId, docId, ...)` -> POST `/api/creator/legal/items/{itemId}/evidence`
  - `creatorJourneyApi.unlinkLegalEvidence(reqId, docId, ...)` -> DELETE `/api/creator/legal/items/{reqId}/evidence/{docId}`
  - `completeStep(3, 5)` -> PATCH `/api/creator/journey/step-progress`
- **Data Read:** `LegalComplianceOverview`, `CreatorLegalAssessment` (deterministic France statutory rules FR-2026.1), Evidence Vault documents
- **Data Written:** Statutory requirement completion statuses, evidence links, `planningReadinessPct` (0–100)
- **Primary CTA:** "Proceed to Company Formation" (`completeStep(3, 5)` -> `router.push('/dashboard/creator/phase-3/formation')`)
- **Next Page:** `/dashboard/creator/phase-3/formation`
- **Completion Status:** Fully Implemented

---

### 2.7 Company Formation & Team (Step 3.6)
- **Page Name:** Company Formation & Team Skills Gap
- **Route:** `/dashboard/creator/phase-3/formation`
- **Main Component:** `FormationPage` (`src/app/dashboard/creator/phase-3/formation/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.generateFormation(activeIdeaId)` -> POST `/api/creator/formation/generate`
  - `creatorJourneyApi.selectFormationType(type, activeIdeaId)` -> POST `/api/creator/formation/select`
  - `creatorJourneyApi.declareFormationSkills(skills, cofounderDraft, activeIdeaId)` -> PATCH `/api/creator/formation/skills`
  - `completeStep(3, 6)` -> PATCH `/api/creator/journey/step-progress`
- **Data Read:** `phase3Data.formationGenerator` (EI, Micro, EURL, SARL, SASU, SAS recommendations), `youHave` skills, `forecastSessionId` basis
- **Data Written:**
  - `formationGenerator.selectedType` ("SAS" | "SASU" | "SARL" | "EURL" | "MICRO" | "EI")
  - `formationGenerator.youHave` (declared founder skills)
  - `formationGenerator.cofounderDraft` (roleNeeded, equityRange, locationPreference)
- **Primary CTA:** "Proceed to Investor Readiness" (`completeStep(3, 6)` -> `router.push('/dashboard/creator/phase-3/complete')`)
- **Next Page:** `/dashboard/creator/phase-3/complete`
- **Completion Status:** Fully Implemented

---

### 2.8 Investor Readiness Audit (Step 3.7)
- **Page Name:** Investor Readiness Audit & Phase 4 Unlock
- **Route:** `/dashboard/creator/phase-3/complete`
- **Main Component:** `Phase3CompletePage` (`src/app/dashboard/creator/phase-3/complete/page.tsx`)
- **API Calls:**
  - `creatorJourneyApi.completeMasterplan(activeIdeaId)` -> PATCH `/api/creator/masterplan/complete`
  - `creatorJourneyApi.get(activeIdeaId)`
  - `advancePhase(3)` -> POST `/api/creator/journey/advance-phase`
- **Data Read:** `InvestorReadinessScore` (Score 0-100, Grade A-D, Breakdown by 5 dimensions, Detailed point deductions with remediation routes)
- **Data Written:** Backend marks `phase3.status = "completed"`, unlocks Phase 4 (`phase4.status = "available"`)
- **Primary CTA:** "Proceed to Phase 4: Commercial Setup" (`advancePhase(3)` -> `router.push('/dashboard/creator/offer-pricing')`)
- **Next Page:** `/dashboard/creator/offer-pricing` (Phase 4 Entry)
- **Completion Status:** Fully Implemented
