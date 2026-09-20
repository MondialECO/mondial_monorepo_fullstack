# MONDIAL BUSINESS CREATION (MBC)
## CREATOR PHASE 3 — TEST COVERAGE AUDIT

### 1. Test Suite Inventory

| Step / Feature | Test File | Test Framework | Test Types | Coverage Rating | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **3.1 Market Study** | `MarketStudyTests.cs` | xUnit (.NET) | Unit / Handler tests | **STRONG** | Tests prompt assembly, JSON parsing, fallback handling, TAM persistence |
| **3.2 Business Model** | `BusinessModelTests.cs` | xUnit (.NET) | Unit / Controller tests | **PARTIAL** | Tests canvas block generation, missing integration tests for pricing metrics |
| **3.3 Forecast** | `ForecastTests.cs`, `ForecastMathTests.cs` | xUnit (.NET) | Financial Math / Edge cases | **STRONG** | Tests TAM scaling, gross margin formulas, breakeven calculations, runway |
| **3.4 Legal & Compliance** | `LegalFrameworkSection12Tests.cs`, `LegalApplicabilityEngineTests.cs`, `BusinessProfileClassifierTests.cs` | xUnit (.NET) | Unit / Catalog verification | **STRONG** | Tests signal detection, rule evaluation, roadmap categorization, readiness scoring |
| **3.5 Formation & Team** | `FormationRecommendationTests.cs` | xUnit (.NET) | Unit / Logic tests | **PARTIAL** | Evaluates SAS/SAS-U branching; does not test Phase 4/5 inversion bug |
| **3.6 Business Plan** | `BusinessPlanTests.cs`, `BusinessPlanSection12Tests.cs` | xUnit (.NET) | Section building / Splicing | **STRONG** | Verifies 12-section assembly, manual edit protection, Section 12 hydration |
| **3.7 Investor Readiness** | `InvestorReadinessTests.cs` | xUnit (.NET) | Weighting / Score derivation | **STRONG** | Verifies 20/20/25/15/20 weights, threshold calculations, remediation triggers |
| **Multi-Project Isolation** | `CreatorPhase3IsolationTests.cs` | xUnit (.NET) | Cross-idea auth & leak tests | **PARTIAL** | Tests ideaId parameter enforcement; misses Section 12 fallback leak test |
| **Frontend UI (Steps 3.1-3.7)** | Vitest / Playwright specs | Vitest | Component / Flow rendering | **PARTIAL** | Tests render states; lacks multi-tab idea context switching tests |

---

### 2. Critical Test Gaps

1. **Section 12 Ambient Fallback (P3-AUDIT-001)**:
   - No test currently asserts that calling `/api/creator/phase-3/business-plan-section-12?ideaId=invalid` returns HTTP 404 instead of falling back to the user's active idea.
2. **Formation Recommendation Phase Inversion (P3-AUDIT-002)**:
   - Tests assert output given mocked `ResourceCalculation`, but do not assert behavior when called in a pure Phase 3 context where `Phase4` is null.
3. **Empty-State Navigation (P3-AUDIT-007)**:
   - Vitest specs do not verify query parameter preservation when clicking empty-state back buttons.
