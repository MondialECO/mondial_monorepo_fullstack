# Mondial Business Creation (MBC) — Implementation Plan
## Creator Phase 3: Legal & Compliance Intelligence

**Audit Date:** September 19, 2026  
**Status:** PROPOSED Implementation Stages (Grounded in Existing Architecture)  
**Strict Rule:** No code implementation is performed in this phase. Execution begins only after formal plan review and approval.

---

## Roadmap Overview

```text
Stage 0: Prerequisites & Canon Reconciliation
   ↓
Stage 1: Legal Domain Foundation (Schemas & DTOs)
   ↓
Stage 2: France Statutory Rule Catalogue & Official Sources
   ↓
Stage 3: Business Data Classifier & Profile Mapping
   ↓
Stage 4: Deterministic Applicability Engine
   ↓
Stage 5: Legal Roadmap & Checklist Backend APIs
   ↓
Stage 6: Phase 3 Dashboard Smart Card
   ↓
Stage 7: Full Legal Workspace UI (3-Pane Layout)
   ↓
Stage 8: Document Vault & Evidence Upload Pipeline
   ↓
Stage 9: Executive Business Plan Section Integration
   ↓
Stage 10: Change Detection & Stale State Management
   ↓
Stage 11: Creator → Entrepreneur Continuity Pipeline
   ↓
Stage 12: End-to-End Hardening & Security Verification
```

---

## Stage-by-Stage Implementation Breakdown

### Stage 0 — Prerequisites & Canon Reconciliation
- **Objective:** Ensure all foundational documentation and authority matrices reflect the planned enhancements without violating Phase 3 closure.
- **Tasks:**
  1. Reconcile `docs/product/creator-flow-canon.md` (§5.5, §11) to document Step 3.5 enhancement as a deep specification completion of the advisory compliance roadmap.
  2. Verify that `DOCUMENTATION-AUTHORITY.md` maintains code-as-truth and single OpenRouter model routing.
  3. Ensure no running processes or database migrations will conflict with existing `CreatorIdeas` or `CreatorJourneys`.

### Stage 1 — Legal Domain Foundation
- **Objective:** Establish the core typed models and DTOs in the backend without database schema mutations.
- **Tasks:**
  1. Create `backend/Models/DatabaseModels/Legal/CreatorLegalAssessment.cs`:
     - Fields: `Jurisdiction`, `RulesVersion`, `EvaluatedAt`, `BusinessSnapshotHash`, `IsPotentiallyOutdated`, `DetectedArchetypes`, `PlanningReadinessPct`, `Items`.
  2. Extend `CreatorLegalChecklistItem` in `backend/Models/DatabaseModels/CreatorJourney.cs`:
     - Add `Stage`, `Priority`, `WhyItApplies`, `OfficialSource`, `RequiresEvidence`, `EvidenceDocumentId`.
  3. Extend `CreatorIdeaDocumentTypes` in `backend/Models/DatabaseModels/CreatorIdea.cs`:
     - Add supported document types: `legal_evidence`, `kbis_extract`, `statuts_draft`, `capital_deposit_cert`, `proof_of_address`, `gdpr_policy`.
  4. Create response and request DTOs in `backend/Models/Dtos/LegalComplianceDtos.cs`.

### Stage 2 — France Statutory Rule Catalogue
- **Objective:** Create the curated, authoritative French statutory rules registry with verified citations.
- **Tasks:**
  1. Create `backend/Resources/LegalRules/FranceRules.json` (version `"FR-2026.1"`).
  2. Curate statutory rules for:
     - **INPI Guichet Unique:** Incorporation, RCS filing, Kbis extract (Code de commerce L123-33).
     - **Banque / Notaire:** Dépôt du capital social et attestation de blocage des fonds.
     - **CNIL:** RGPD conformity, privacy policy, cookie consent, Article 30 register.
     - **DGCCRF / Consumer Code:** B2C CGV, 14-day right of withdrawal, legal guarantees.
     - **URSSAF:** Social declarations, executive status (TNS vs assimilé salarié).
     - **IP / INPI:** Trademark registration, proprietary code/asset IP assignment.
     - **Insurance:** Assurance Responsabilité Civile Professionnelle (RC Pro).
  3. Create `backend/Services/Legal/IF пу FranceLegalRulesCatalog.cs` service to load, validate, and query the catalog in memory at startup.

### Stage 3 — Business Data Classifier & Profile Mapping
- **Objective:** Extract and normalize creator project facts into a unified classification payload for legal rules.
- **Tasks:**
  1. Create `BusinessProfileClassifier` in `backend/Services/Legal/`:
     - Ingests `CreatorIdea.Project`, `BusinessModelSession`, and `ForecastSession`.
     - Normalizes signals: `IsSaaS`, `IsB2C`, `IsB2B`, `IsEcommerce`, `IsMarketplace`, `IsConsulting`, `HasOnlinePayments`, `HasPhysicalPremises`, `CollectsPersonalData`, `ExpectedEmployees`.
  2. Build a unit test suite to verify classification accuracy against SaaS, B2C, Marketplace, and Consulting archetypes.

### Stage 4 — Deterministic Applicability Engine
- **Objective:** Evaluate business signals against the France rule catalogue to produce the personalized requirements roadmap.
- **Tasks:**
  1. Create `ILegalApplicabilityEngine` and `LegalApplicabilityEngine.cs` in `backend/Services/Legal/`:
     - Evaluates rule preconditions deterministically.
     - Generates personalized requirement items.
     - Computes the initial `PlanningReadinessPct` (weighted scoring).
     - Assigns stages: *1. Before Company Creation, 2. Company Creation, 3. Before Website Launch, 4. Before First Sale, 5. Ongoing*.
  2. Provide zero-credit deterministic evaluation (100% free, runs in <50ms without LLM latency).

### Stage 5 — Legal Roadmap & Checklist Backend APIs
- **Objective:** Expose clean, RESTful endpoints adhering to the `ApiResponse` envelope.
- **Tasks:**
  1. Update `CreatorPhase3Controller.cs`:
     - `GET /api/creator/legal-compliance/overview`: Returns current assessment, detected archetypes, readiness score, and stage metrics.
     - `POST /api/creator/legal-compliance/evaluate`: Triggers deterministic applicability evaluation.
     - `PATCH /api/creator/legal-compliance/item/{itemId}/status`: Updates item status.
     - `POST /api/creator/legal-compliance/item/{itemId}/evidence`: Links uploaded document to requirement.
  2. Register endpoints in API map and audit for `[Authorize]` and `GetUserId()` tenant isolation.

### Stage 6 — Phase 3 Dashboard Smart Card
- **Objective:** Provide high-visibility entry point on the Phase 3 dashboard.
- **Tasks:**
  1. Create `src/components/creator/Phase3LegalCard.tsx`:
     - Renders Planning Readiness percentage dial.
     - Displays `🇫🇷 France Rules Applied` badge.
     - Renders detected business archetype tags (`SaaS`, `B2C`, `Subscription`).
     - Shows stage breakdown chips (`3 Before Launch`, `5 Before First Sale`).
     - Displays primary CTA: `"Open My Legal Roadmap →"`.
  2. Integrate card into Phase 3 dashboard overview and sidebar navigation.

### Stage 7 — Full Legal Workspace UI (3-Pane Layout)
- **Objective:** Transform `/dashboard/creator/phase-3/compliance` into a high-utility legal cockpit.
- **Tasks:**
  1. Build 3-pane responsive layout:
     - **Left Pane (`LegalStageNavigation.tsx`):** 5 chronological stages with completion counts and active stage indicators.
     - **Center Pane (`LegalCanvas.tsx`):** Filterable requirement cards with status badges, official source pills, expandable "Why this applies", and evidence actions.
     - **Right Pane (`LegalAiAssistantRail.tsx`):** Contextual AI rail with pre-baked action pills (*"Why does this apply?"*, *"Show official source"*, *"What should I do next?"*).
  2. Ensure strict design system compliance (Inter headings, DM Sans prose, JetBrains Mono telemetry, light/dark mode tokens).

### Stage 8 — Document Vault & Evidence Upload Pipeline
- **Objective:** Enable creators to attach real proof files to compliance requirements.
- **Tasks:**
  1. Create `src/components/creator/LegalEvidenceUploader.tsx`:
     - Inline drag-and-drop file upload zone.
     - Enforces PDF, PNG, JPG file format limits.
  2. Integrate with `DocumentUploadController`:
     - Uploads physical file to `uploads/`.
     - Records entry in `CreatorIdea.Documents`.
     - Links `document.Id` to `CreatorLegalChecklistItem.EvidenceDocumentId`.

### Stage 9 — Executive Business Plan Section Integration
- **Objective:** Synthesize findings into the Master Business Plan (Step 3.3).
- **Tasks:**
  1. Extend `BusinessPlanOutputDto` with Section 12: `LegalRegulatoryFrameworkDto`.
  2. Update `BusinessPlanView.tsx` and `src/app/dashboard/creator/phase-3/business-plan/page.tsx`:
     - Render Section 12 in the continuous scroll document.
     - Provide automatic synchronization from Step 3.5 findings.
  3. Include Legal Framework in `PlanForecastPrintView.tsx` for PDF export.

### Stage 10 — Change Detection & Stale State Management
- **Objective:** Alert founders when business plan edits impact their legal obligations.
- **Tasks:**
  1. In `CreatorJourneyService`, compute `BusinessSnapshotHash` on idea updates.
  2. If hash diverges from `LegalAssessment.BusinessSnapshotHash`:
     - Flag `IsPotentiallyOutdated = true`.
     - In UI, render non-intrusive alert: *"Your business model changed. Click to update your legal roadmap."*
     - Re-running evaluation preserves manually completed items while adding new obligations.

### Stage 11 — Creator → Entrepreneur Continuity Pipeline
- **Objective:** Carry forward verified legal assets upon Level Up.
- **Tasks:**
  1. In `CreatorPhase6Controller.LevelUpAsync`:
     - Copy verified `CreatorIdea.Documents` to `Companies.Documents`.
     - Map company incorporation details to `Companies.Legal`.
     - Pre-populate `Companies.DataRoomDocuments` with uploaded evidence.
  2. Verify that the new Entrepreneur opens `/dashboard/entrepreneur/phase-2` with pre-filled, verified company data.

### Stage 12 — End-to-End Hardening & Security Verification
- **Objective:** Validate security, tenant isolation, performance, and legal safety copy.
- **Tasks:**
  1. Execute unit and integration tests across all 12 test scenarios (SaaS B2B, SaaS B2C, E-commerce, Marketplace, etc.).
  2. Security audit: verify IDOR resistance on evidence downloads and upload MIME validation.
  3. Copy audit: ensure zero promises of "full legal certification" and verify presence of required disclaimers.
