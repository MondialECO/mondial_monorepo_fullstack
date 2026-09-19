# BATCH 1 FILE INDEX — LEGAL & COMPLIANCE INTELLIGENCE (FRANCE MVP)

| File Path | Purpose | Modification Type | Dependencies |
| :--- | :--- | :--- | :--- |
| `src/app/dashboard/creator/phase-3/compliance/page.tsx` | Sanitizes compliance copy (BLOCK-01), replaces absolute compliance claim with Legal Planning Readiness and legal disclaimer | Modified | React, Tailwind, Lucide Icons |
| `backend/Models/DatabaseModels/Legal/LegalEnums.cs` | Domain enumeration definitions: stages, status, priority, confidence, evaluation | Created | None |
| `backend/Models/DatabaseModels/Legal/OfficialSourceReference.cs` | Authoritative source citation metadata model (INPI, CNIL, DGCCRF, etc.) | Created | `LegalEnums.cs` |
| `backend/Models/DatabaseModels/Legal/LegalBusinessProfile.cs` | Normalized business profile & signal provenance tracker | Created | `LegalEnums.cs` |
| `backend/Models/DatabaseModels/Legal/LegalRuleDefinition.cs` | Statutory legal rule specification and precondition schema | Created | `LegalEnums.cs`, `OfficialSourceReference.cs` |
| `backend/Models/DatabaseModels/Legal/CreatorLegalAssessment.cs` | Legal assessment entity, stage summaries, snapshot hash, and audit traces | Created | `LegalBusinessProfile.cs`, `LegalRuleDefinition.cs`, `LegalEnums.cs` |
| `backend/Models/DatabaseModels/CreatorIdea.cs` | Whitelist legal evidence document types (BLOCK-03 fix) | Modified | MongoDB Bson |
| `backend/Models/DatabaseModels/CreatorJourney.cs` | Embeds `CreatorLegalAssessment` and expands `CreatorLegalChecklistItem` | Modified | `CreatorLegalAssessment.cs`, `LegalEnums.cs` |
| `backend/Models/Dtos/Ai/BusinessPlanOutputDto.cs` | Section 12 Legal & Regulatory framework DTO foundation | Modified | None |
| `backend/Models/Dtos/LegalComplianceDtos.cs` | Request and response DTOs for roadmap and legal endpoints | Created | `CreatorLegalAssessment.cs`, `LegalEnums.cs` |
| `backend/Resources/LegalRules/FranceRules.json` | Curated France statutory rules catalogue (FR-2026.1, 18 rules) | Created | JSON Resource |
| `backend/Services/Legal/IFranceLegalRulesCatalog.cs` | Interface for in-memory rules catalogue provider | Created | `LegalRuleDefinition.cs` |
| `backend/Services/Legal/FranceLegalRulesCatalog.cs` | Implements robust catalog loader with path traversal & bootstrap fallback | Created | `IFranceLegalRulesCatalog.cs`, System.Text.Json |
| `backend/Services/Legal/BusinessProfileClassifier.cs` | Deterministic classifier mapping MBC project/canvas/study data to signals | Created | `LegalBusinessProfile.cs`, `CreatorJourney.cs` |
| `backend/Services/Legal/ILegalApplicabilityEngine.cs` | Interface for deterministic applicability engine & score calculator | Created | `CreatorLegalAssessment.cs`, `LegalBusinessProfile.cs` |
| `backend/Services/Legal/LegalApplicabilityEngine.cs` | Pure deterministic applicability matcher, SHA-256 hash, and readiness calculator | Created | `ILegalApplicabilityEngine.cs`, `IFranceLegalRulesCatalog.cs` |
| `backend/Services/Interface/ICreatorJourneyService.cs` | Declares assessment mutation and evidence linking contracts | Modified | `CreatorLegalAssessment.cs` |
| `backend/Services/Implementations/CreatorJourneyService.cs` | Persists assessment, enforces doc ownership, updates item status & readiness | Modified | `ICreatorJourneyService.cs`, MongoDB Driver |
| `backend/Extensions/ServiceCollectionExtensions.cs` | Registers Legal Rules Catalog, Classifier, and Applicability Engine in DI | Modified | Microsoft.Extensions.DependencyInjection |
| `backend/Controllers/CreatorPhase3Controller.cs` | Exposes legal overview, evaluate, status patch, evidence attachment endpoints; updates Step 3.7 readiness | Modified | `ILegalApplicabilityEngine.cs`, `ICreatorJourneyService.cs` |
| `backend/WebApp.csproj` | Configures rules JSON copying to build output | Modified | MSBuild |
| `backend/tests/WebApp.Tests/Unit/LegalApplicabilityEngineTests.cs` | 8 unit tests validating Scenarios 1–7 and evidence document types | Created | xUnit, FluentAssertions, Moq |
| `analysis/mbc/legal-compliance-implementation/BATCH_1_REPORT.md` | Comprehensive batch completion report | Created | Markdown Documentation |
| `analysis/mbc/legal-compliance-implementation/BATCH_1_FILE_INDEX.md` | File index and architecture mapping | Created | Markdown Documentation |
