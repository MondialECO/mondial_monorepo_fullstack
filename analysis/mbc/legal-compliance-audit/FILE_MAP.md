# Mondial Business Creation (MBC) — File-by-File Implementation Map
## Creator Phase 3: Legal & Compliance Intelligence Audit

**Audit Date:** September 19, 2026  
**Status:** Audit & Proposal Only (No Files Created or Modified in Production Codebase)

---

## 1. Backend Core & Services (`backend/`)

| File / Folder Path | Current Purpose | Proposed Change | Why | Dependencies | Risk Level |
|---|---|---|---|---|---|
| `backend/Models/DatabaseModels/Legal/CreatorLegalAssessment.cs`<br>**(NEW FILE PROPOSED)** | Does not exist | Create model for storing versioned legal evaluations, detected archetypes, and readiness scores. | Decouples rich legal assessment metadata from bare checklist strings and enables historical versioning. | MongoDB Driver | **LOW** (Additive) |
| `backend/Models/DatabaseModels/CreatorJourney.cs` | Stores Creator journey phase blocks and nested models. | Extend `CreatorLegalChecklistItem` with `Stage`, `Priority`, `WhyItApplies`, `OfficialSource`, `RequiresEvidence`, and `EvidenceDocumentId`. | Current checklist model only has 7 basic display fields, insufficient for statutory legal guidance. | Existing `CreatorIdea` / `CreatorJourney` models | **LOW** (Additive, backward-compatible defaults) |
| `backend/Models/DatabaseModels/CreatorIdea.cs` | Stores per-idea venture state and `CreatorIdeaDocument` metadata. | Extend `CreatorIdeaDocumentTypes.IsSupported` to include `legal_evidence`, `kbis_extract`, `statuts_draft`, `capital_deposit_cert`, `proof_of_address`, `gdpr_policy`. | Current document types whitelist only allows `business_plan` and `financial_forecast`, rejecting all legal uploads. | `CreatorIdeaDocumentsController.cs` | **LOW** (Additive constant extension) |
| `backend/Resources/LegalRules/FranceRules.json`<br>**(NEW FILE PROPOSED)** | Does not exist | Author authoritative French statutory rules registry (INPI, CNIL, Service-Public, URSSAF, DGCCRF) with citations. | Eliminates hardcoded arbitrary strings; establishes deterministic legal source of truth. | System.Text.Json | **LOW** (Static JSON asset) |
| `backend/Services/Legal/IFranceLegalRulesCatalog.cs`<br>**(NEW FILE PROPOSED)** | Does not exist | Define interface for loading, caching, and querying the France legal rules catalog. | Enables fast in-memory query of statutory rules by jurisdiction and archetype. | .NET DI | **LOW** (New interface) |
| `backend/Services/Legal/FranceLegalRulesCatalog.cs`<br>**(NEW FILE PROPOSED)** | Does not exist | Implement rules catalog loader and cached provider. | Loads and validates `FranceRules.json` on application startup. | `IFranceLegalRulesCatalog` | **LOW** (New service) |
| `backend/Services/Legal/BusinessProfileClassifier.cs`<br>**(NEW FILE PROPOSED)** | Does not exist | Implement classifier extracting normalized signals (`IsSaaS`, `IsB2C`, `HasOnlinePayments`, etc.) from idea and business model. | Provides clean deterministic inputs to the applicability engine without brittle inline checks. | `CreatorIdea`, `BusinessModelSession` | **LOW** (Pure domain logic) |
| `backend/Services/Legal/ILegalApplicabilityEngine.cs`<br>**(NEW FILE PROPOSED)** | Does not exist | Define interface for evaluating business profile against legal rules to generate personalized roadmap. | Core abstraction for deterministic legal applicability. | Domain models | **LOW** (New interface) |
| `backend/Services/Legal/LegalApplicabilityEngine.cs`<br>**(NEW FILE PROPOSED)** | Does not exist | Implement rules evaluation, stage assignment, and weighted readiness score calculation. | Powers Step 3.5 without AI hallucination. | Rules catalog, Classifier | **MEDIUM** (Core calculation engine) |
| `backend/Controllers/CreatorPhase3Controller.cs` | Handles Phase 3 endpoints (legal checklist, formation, masterplan). | Refactor `GenerateLegalChecklist` to delegate to `ILegalApplicabilityEngine`; add evidence linking endpoints. | Replaces 12-item FinTech heuristic with genuine French legal intelligence while preserving API contracts. | `ILegalApplicabilityEngine` | **MEDIUM** (Existing controller modification) |
| `backend/Models/Dtos/Ai/BusinessPlanOutputDto.cs` | Typed contract for 7-section AI Business Plan output. | Add Section 12: `LegalRegulatoryFrameworkDto` to `BusinessPlanOutputDto`. | Integrates legal diligence findings into the master Business Plan document. | `BusinessPlanHandler.cs` | **LOW** (Additive property) |
| `backend/Services/Ai/Jobs/BusinessPlanHandler.cs` | Synthesizes Business Plan from Clarifier and Idea Core. | Populate `LegalRegulatoryFramework` from active `LegalAssessment` when available. | Synchronizes Step 3.5 legal findings into Business Plan generations. | `BusinessPlanOutputDto` | **LOW** (Safe fallback if null) |
| `backend/Controllers/CreatorPhase6Controller.cs` | Handles Level Up from Creator to Entrepreneur. | Extend `LevelUpAsync` to transfer verified legal evidence documents into `Companies.Documents` and `Companies.DataRoomDocuments`. | Solves the data continuity void where legal documents were lost upon conversion. | `Companies`, `CreatorIdeaStore` | **MEDIUM** (Cross-role transaction logic) |

---

## 2. Frontend Components & Pages (`src/`)

| File / Folder Path | Current Purpose | Proposed Change | Why | Dependencies | Risk Level |
|---|---|---|---|---|---|
| `src/app/dashboard/creator/phase-3/compliance/page.tsx` | Step 3.5 compliance checklist screen. | Refactor from single-column card list to 3-pane interactive Legal Workspace (Stages + Canvas + AI Rail). | Current UI is a flat list of 12 checkboxes; lacks chronological stages, official citations, and evidence management. | `Phase3SetupShell`, shadcn/ui | **MEDIUM** (Page rebuild) |
| `src/components/creator/legal/LegalStageNavigation.tsx`<br>**(NEW FILE PROPOSED)** | Does not exist | Left-pane navigation component displaying the 5 chronological stages with completion badges. | Enables founders to focus on immediate stage requirements without cognitive overload. | Lucide icons, Tailwind | **LOW** (New component) |
| `src/components/creator/legal/LegalCanvas.tsx`<br>**(NEW FILE PROPOSED)** | Does not exist | Center-pane requirement cards with official source badges, priority tags, and evidence upload dropzones. | Core working canvas for reviewing and acting on legal requirements. | shadcn/ui Button, Badge, Card | **LOW** (New component) |
| `src/components/creator/legal/LegalAiAssistantRail.tsx`<br>**(NEW FILE PROPOSED)** | Does not exist | Right-pane contextual AI assistant with pre-baked legal action buttons. | Provides instant plain-language clarification without leaving the workflow. | `api-creator-ai.ts` | **LOW** (New component) |
| `src/components/creator/legal/LegalEvidenceUploader.tsx`<br>**(NEW FILE PROPOSED)** | Does not exist | Drag-and-drop modal/dropzone for attaching PDF/image evidence to a legal requirement. | Reuses existing physical document upload pipeline for compliance proof files. | `api-creator-journey.ts` | **LOW** (New component) |
| `src/components/creator/Phase3LegalCard.tsx`<br>**(NEW FILE PROPOSED)** | Does not exist | Smart dashboard card displaying readiness %, France Rules badge, detected archetype pills, and stage counts. | Fulfills Phase 3 dashboard requirement for a prominent Legal & Compliance overview. | Card, Badge, Progress | **LOW** (New component) |
| `src/app/dashboard/creator/phase-3/business-plan/page.tsx` | Step 3.3 Executive Business Plan continuous scroll document. | Add Section 12: "Legal & Regulatory Framework" into continuous document scroll. | Ensures legal analysis is permanently reflected in the core venture business plan. | `BusinessPlanOutput` | **LOW** (Additive section) |
| `src/lib/api-creator-journey.ts` | Frontend API client for Creator journey. | Add typed methods for `evaluateLegalRoadmap`, `updateLegalItemStatus`, and `uploadLegalEvidence`. | Provides type-safe client communication with new backend endpoints. | Axios | **LOW** (Additive functions) |

---

## 3. Documentation & Canons (`docs/`)

| File / Folder Path | Current Purpose | Proposed Change | Why | Dependencies | Risk Level |
|---|---|---|---|---|---|
| `docs/product/creator-flow-canon.md` | Canonical specification for Creator lifecycle. | Update §5.5 to document Step 3.5 Legal & Compliance Intelligence architecture, France rules, and evidence vault. | Keeps canonical specification synchronized with actual production behavior. | None | **LOW** (Documentation update) |
| `docs/system-architecture/07-source-of-truth.md` | Canonical database collections authority. | Document `CreatorLegalAssessment` and extended `CreatorIdea.Documents` evidence linkage. | Maintains single source of truth for repository database collections. | None | **LOW** (Documentation update) |
