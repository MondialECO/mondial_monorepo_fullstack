# MONDIAL BUSINESS CREATION (MBC)
## CREATOR PHASE 3 — FILE INDEX

### 1. Frontend Route Pages (`src/app/dashboard/creator/phase-3/`)
- `page.tsx`: Entry route with unconditional redirect to `/market-study`.
- `market-study/page.tsx`: Step 3.1 Market Intelligence & Landscape.
- `business-model/page.tsx`: Step 3.2 Business Model Canvas.
- `forecast/page.tsx`: Step 3.3 36-Month Financial Forecast.
- `compliance/page.tsx`: Step 3.4 Legal & Regulatory Framework.
- `formation/page.tsx`: Step 3.5 Company Formation & Team Architecture.
- `business-plan/page.tsx`: Step 3.6 Executive Business Plan (12 Sections).
- `complete/page.tsx`: Step 3.7 Investor Readiness Assessment & Completion.

### 2. Frontend Components & Shared Utilities
- `src/components/creator/Phase3SetupShell.tsx`: Standard wrapper for Phase 3 steps.
- `src/components/creator/Phase3LegalCard.tsx`: Legal framework summary, rules, evidence drawer.
- `src/components/creator/market-study/MarketStudyPrintView.tsx`: Clean printable/exportable layout.
- `src/lib/api-creator-journey.ts`: Client API methods for Phase 3 endpoints.
- `src/lib/creator-routes.ts`: Route builder and `withIdeaContext` helper.
- `src/lib/creator-state-resolver.ts`: Step derivation and milestone resolution.

### 3. Backend Controllers (`backend/Controllers/`)
- `CreatorPhase3Controller.cs`: Main Phase 3 controller (Legal assessment, Formation recommendation, Section 12, Investor readiness, Complete).
- `MarketStudyController.cs`: Market study AI generation and session retrieval.
- `BusinessModelController.cs`: Business model canvas generation and session retrieval.
- `ForecastController.cs`: Financial forecast generation and session retrieval.
- `BusinessPlanController.cs`: Executive business plan generation and manual edit updates.
- `CreatorIdeaDocumentsController.cs`: Legal Evidence Vault document upload, download, and deletion.

### 4. Backend Services & Engines (`backend/Services/` & `backend/Engines/`)
- `CreatorJourneyService.cs`: Journey state computation, milestone gating, session setting.
- `LegalApplicabilityEngine.cs`: Deterministic evaluation of French regulatory rules against profile signals.
- `BusinessProfileClassifier.cs`: Signal extractor for B2B, B2C, SaaS, Marketplace, Payments, etc.
- `FranceLegalRulesCatalog.cs`: Singleton provider for `backend/Resources/LegalRules/FranceRules.json`.
- `LegalFrameworkSectionBuilder.cs`: Builder for Section 12 Legal Framework in Executive Business Plan.
- `LegalChangeDetector.cs`: Profile hash comparison to detect material legal changes.

### 5. Backend Handlers (`backend/Handlers/`)
- `MarketStudyHandler.cs`: OpenRouter LLM orchestration for market intelligence.
- `BusinessModelHandler.cs`: OpenRouter LLM orchestration for business model canvas.
- `ForecastHandler.cs`: Financial calculation and forecasting engine.
- `BusinessPlanHandler.cs`: Executive business plan synthesis engine.

### 6. Resources & Data Catalogs
- `backend/Resources/LegalRules/FranceRules.json`: Authoritative 18-rule French legal compliance catalog.

### 7. Documentation References
- `docs/product/creator-flow-canon.md`: Canonical Creator Flow definition.
- `docs/releases/MBC_CREATOR_MVP_RC1.md`: Release candidate 1 specification.
- `analysis/mbc/final-functional-verification/RC1_FINAL_LIVE_VERIFICATION.md`.
- `analysis/mbc/legal-compliance-implementation/FINAL_RETEST_REPORT.md`.
- `analysis/mbc/creator-phase2-phase3-flow-implementation/FLOW_RECONCILIATION_REPORT.md`.
