# Stage 9 File Index: Executive Business Plan Section 12 Integration

### 1. Backend Core & Services
- [backend/Models/Dtos/Ai/BusinessPlanOutputDto.cs](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Models/Dtos/Ai/BusinessPlanOutputDto.cs) — Extended `LegalRegulatoryFrameworkDto` with subsections, roadmap summary, priority items, needs info, official sources, evidence summary, and staleness detection.
- [backend/Models/Dtos/LegalComplianceDtos.cs](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Models/Dtos/LegalComplianceDtos.cs) — Added `ReplaceLegalEvidenceRequest`.
- [backend/Services/Legal/ILegalFrameworkSectionBuilder.cs](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Services/Legal/ILegalFrameworkSectionBuilder.cs) — Service interface for deterministic Section 12 compilation.
- [backend/Services/Legal/LegalFrameworkSectionBuilder.cs](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Services/Legal/LegalFrameworkSectionBuilder.cs) — Deterministic section aggregator implementing 12.1 through 12.12 mapping.
- [backend/Extensions/ServiceCollectionExtensions.cs](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Extensions/ServiceCollectionExtensions.cs) — DI registration for `ILegalFrameworkSectionBuilder`.
- [backend/Services/Interface/ICreatorJourneyService.cs](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Services/Interface/ICreatorJourneyService.cs) — Method declaration for `ReplaceLegalEvidenceAsync`.
- [backend/Services/Implementations/CreatorJourneyService.cs](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Services/Implementations/CreatorJourneyService.cs) — Implementation of `ReplaceLegalEvidenceAsync` with audit trail append.
- [backend/Controllers/CreatorPhase3Controller.cs](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Controllers/CreatorPhase3Controller.cs) — API endpoints `POST legal-compliance/evidence/replace` and `GET legal-compliance/section-12`.

### 2. Frontend Components & Types
- [src/types/creator/ai.ts](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/types/creator/ai.ts) — TypeScript interfaces for Section 12 structured data and DTOs.
- [src/lib/api-creator-journey.ts](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/lib/api-creator-journey.ts) — Client API functions `replaceLegalEvidence` and `getBusinessPlanSection12`.
- [src/app/dashboard/creator/phase-3/business-plan/page.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/phase-3/business-plan/page.tsx) — Continuous-scroll business plan page updated to 12 sections with rich Section 12 interactive card, stale detection, and refresh action.
- [src/components/creator/PlanForecastPrintView.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/creator/PlanForecastPrintView.tsx) — Section 12 print & PDF export rendering.
- [src/components/creator/ai/BusinessPlanView.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/creator/ai/BusinessPlanView.tsx) — Business plan tab view Section 12 card with `Scale` icon.

### 3. Tests & Documentation
- [backend/tests/WebApp.Tests/Unit/LegalFrameworkSection12Tests.cs](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/tests/WebApp.Tests/Unit/LegalFrameworkSection12Tests.cs) — 13 unit test scenarios verifying archetype tailoring, readiness, staleness, and fallback logic.
- [analysis/mbc/legal-compliance-implementation/STAGE_9_REPORT.md](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/analysis/mbc/legal-compliance-implementation/STAGE_9_REPORT.md) — Comprehensive implementation report for Stage 9.
