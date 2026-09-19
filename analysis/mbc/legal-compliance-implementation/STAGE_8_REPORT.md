# STAGE 8 REPORT — LEGAL EVIDENCE VAULT & AUDIT TRAIL

**Creator → Phase 3 → Business Plan Intelligence → Legal & Compliance Intelligence**  
**Route**: `/dashboard/creator/phase-3/compliance`  
**Status**: Stage 8 Completed & Verified  
**Date**: September 19, 2026  

---

## 1. Executive Summary

Stage 8 delivers the dedicated **Legal Evidence Vault & Audit Trail** within the Creator Phase 3 Legal & Compliance Intelligence workspace at `/dashboard/creator/phase-3/compliance`. 

Building directly upon the Stage 5 France-first deterministic assessment engine and the Stage 7 3-Pane Legal Workspace UI, Stage 8 introduces structured proof management, compliance document lifecycle tracking, and an immutable audit trail **without introducing a redundant physical storage silo**.

All physical binary files continue to be securely stored and managed via the existing `CreatorIdea.Documents` subsystem and `CreatorIdeaDocumentsController`. The Legal Evidence Vault provides a high-fidelity, compliance-contextual indexing layer (`EvidenceLinks` and `EvidenceAuditTrail`) directly embedded within the idea's `CreatorLegalAssessment` document.

---

## 2. Architecture & Core Principles

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ EXISTING PHYSICAL STORAGE (Zero Duplication)                                           │
│ CreatorIdea.Documents [ DocumentId, FileName, FileType, FileSizeBytes, StorageUrl ]    │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           ▲
                                           │ Referenced by DocumentId
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LEGAL COMPLIANCE LAYER (CreatorLegalAssessment)                                        │
│                                                                                        │
│ ┌──────────────────────────────────────┐  ┌──────────────────────────────────────────┐ │
│ │ EvidenceLinks (N-to-N Mapping)       │  │ EvidenceAuditTrail (Append-Only Log)     │ │
│ │ • LinkId (UUID)                      │  │ • AuditId (UUID)                         │ │
│ │ • DocumentId (Ref to Idea Document)  │  │ • TimestampUtc (ISO 8601 UTC)            │ │
│ │ • RequirementId (Milestone / Item)   │  │ • Action (uploaded, linked, unlinked...) │ │
│ │ • Stage (e.g., BeforeLaunch)         │  │ • DocumentId & FileName                  │ │
│ │ • Status (Linked, NeedsReview, etc.) │  │ • RequirementId & RequirementTitle       │ │
│ │ • LinkedAtUtc & LinkedByUserId       │  │ • ActorUserId & ActorRole                │ │
│ └──────────────────────────────────────┘  │ • Details (Immutable note)               │ │
│                                           └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Principles Enforced:
1. **Zero Storage Duplication**: No secondary physical file storage was created. Physical uploads use `/api/creator/ideas/{ideaId}/documents/upload` and reside in the project-level document registry.
2. **N-to-N Flexibility**: A requirement can have multiple pieces of evidence attached (e.g., RGPD processing register + DPO designation), and a single master document (e.g., Kbis extract) can be linked across multiple legal milestones.
3. **Unlink vs. Delete Disambiguation**: 
   - **Unlink Evidence** detaches the document from the compliance requirement and writes an `unlinked` audit log entry, but strictly preserves the physical file in the project document vault.
   - **Delete Document** deletes the physical file from the storage system only if explicitly executed in the project documents manager.
4. **Authentic UTC Audit Trail**: All audit entries record true UTC timestamps, the authenticated actor ID (`ActorUserId`), the target requirement, and the event action. No client-side mock history is permitted.
5. **No False Authority Claims**: The UI explicitly disclaims authoritative legal certification. Statuses such as `Accepted for Planning` indicate venture roadmap readiness rather than government validation.

---

## 3. Data Models & Entities

### 3.1 C# Database Models (`backend/Models/DatabaseModels/Legal/CreatorLegalAssessment.cs`)
```csharp
public class LegalEvidenceLink
{
    public string LinkId { get; set; } = Guid.NewGuid().ToString("N");
    public string DocumentId { get; set; } = string.Empty;
    public string RequirementId { get; set; } = string.Empty;
    public string Stage { get; set; } = string.Empty;
    public string Status { get; set; } = LegalEvidenceStatuses.Linked;
    public DateTime LinkedAtUtc { get; set; } = DateTime.UtcNow;
    public string LinkedByUserId { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class LegalEvidenceAuditEntry
{
    public string AuditId { get; set; } = Guid.NewGuid().ToString("N");
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
    public string Action { get; set; } = string.Empty;
    public string DocumentId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string RequirementId { get; set; } = string.Empty;
    public string RequirementTitle { get; set; } = string.Empty;
    public string ActorUserId { get; set; } = string.Empty;
    public string ActorRole { get; set; } = "Creator";
    public string Details { get; set; } = string.Empty;
}
```

### 3.2 Evidence Lifecycle Enums (`backend/Models/DatabaseModels/Legal/LegalEnums.cs`)
- **`LegalEvidenceStatuses`**:
  - `Linked`: Evidence is actively associated with the statutory milestone.
  - `NeedsReview`: Evidence requires revision, re-signing, or supplementary info.
  - `AcceptedForPlanning`: Evidence meets planning readiness criteria for investor packs.
  - `Replaced`: Evidence has been superseded by a newer version or document.
  - `Archived`: Requirement or evidence has been retired from active roadmap views.
- **`LegalEvidenceAuditActions`**:
  - `uploaded`, `linked`, `unlinked`, `replaced`, `status_changed`.

---

## 4. Backend Service & Controller APIs

### 4.1 Service Implementations (`CreatorJourneyService.cs`)
- **`AttachLegalAssessmentItemEvidenceAsync`**: Validates document ownership in `CreatorIdea.Documents`, checks for duplicate link, creates `LegalEvidenceLink`, updates item `EvidenceDocumentId` and `EvidenceFileName`, appends `linked` audit trail entry, and saves atomically.
- **`UnlinkLegalAssessmentItemEvidenceAsync`**: Locates evidence link, removes it from `EvidenceLinks`, resets requirement item reference if unlinking the primary document, appends `unlinked` audit log entry, and persists change while leaving physical file intact.
- **`UpdateLegalEvidenceStatusAsync`**: Validates new status against canonical enum, updates link status, appends `status_changed` audit entry detailing transition (e.g., `Status changed from Linked to AcceptedForPlanning`).

### 4.2 REST Endpoints (`CreatorPhase3Controller.cs`)
1. `POST /api/creator/phase-3/legal-assessment/{ideaId}/item/{itemId}/evidence/attach`
   - Body: `{ documentId, notes }`
2. `POST /api/creator/phase-3/legal-assessment/{ideaId}/item/{itemId}/evidence/unlink`
   - Body: `{ documentId }`
3. `PATCH /api/creator/phase-3/legal-assessment/{ideaId}/evidence/{linkId}/status`
   - Body: `{ newStatus, notes }`

---

## 5. Frontend UI & UX Features

### 5.1 Workspace Switching & Cohesion (`page.tsx`)
The legal workspace at `/dashboard/creator/phase-3/compliance` now features a top header segment switcher:
- **`Legal Roadmap`**: The 3-pane legal canvas for statutory review, stage progression, and AI guide assistance.
- **`Evidence Vault & Audit Trail`**: The dedicated compliance documentation and audit center.
- Deep links operate bidirectionally: clicking a requirement in the Vault switches to the Roadmap centered on that item; clicking `[View in Vault]` on a roadmap milestone opens the Vault filtered to that item's evidence.

### 5.2 Evidence Vault View (`LegalEvidenceVaultView.tsx`)
1. **Executive KPI Cards**:
   - Total Documents Linked (with total storage size formatted).
   - Milestone Coverage (% of requirements with at least 1 verified piece of evidence).
   - Needs Review Counter (highlighting items needing user attention).
   - Audit Trail Length (immutable log count).
2. **Filters & Live Search**:
   - Real-time text search across file names, requirement titles, and notes.
   - Stage filter dropdown (`All Stages`, `Before Company Creation`, etc.).
   - Status filter dropdown (`All Statuses`, `Linked`, `Needs Review`, `Accepted for Planning`, etc.).
3. **Dual View Representation**:
   - **Desktop Table View**: Shows File Name & Type, Linked Requirement & Stage Badge, File Size, Attached Date, Status Badge with dropdown selector, and Actions (View/Preview Drawer, Deep-link to Roadmap, Unlink).
   - **Mobile-Responsive Card View**: Responsive grid for smaller screens with full action access.
4. **Missing Evidence Panel**:
   - Collapsible high-visibility alert detailing requirements that currently lack evidence, with one-click `[Attach Evidence]` action opening the `LegalEvidenceModal`.
5. **Slide-Over Document Drawer**:
   - Quick preview drawer displaying document metadata, direct download link, link history, status controls, and requirement citation.
6. **Immutable Audit Trail Timeline**:
   - Real-time chronological audit list with action badges, actor attribution, ISO timestamps formatted cleanly, and clear description of changes.

---

## 6. Security, Tenant Isolation & Compliance Disclaimers

1. **Strict Tenant Boundary Enforcement**:
   - All controller endpoints enforce authenticated `ClaimsPrincipal` extraction via `GetAuthenticatedUserId()`.
   - Every read and write validates that `idea.UserId == authenticatedUserId`. Attempting to link, unlink, or update evidence for an idea owned by another creator returns `404 Not Found` / `403 Forbidden`.
   - Document IDs must belong to the caller's `CreatorIdea.Documents` list; cross-idea document referencing is strictly blocked.
2. **Zero False Authority Claims**:
   - Clear banner stating: *"Legal Evidence Vault records self-managed proof documents for venture planning. Storing documents does not constitute statutory verification or government certification."*
   - Status options are scoped strictly to planning readiness (`Accepted for Planning`), never claiming external legal validity.

---

## 7. Verification & Automated Test Results

### 7.1 Backend Unit Tests (`backend/tests/WebApp.Tests/Unit/LegalEvidenceVaultTests.cs`)
Six dedicated xUnit test cases with Moq covering all core operations and edge cases:
1. `AttachEvidence_AppendsLinkAndAuditTrail_PreservesExistingDocuments`: **PASSED**
2. `UnlinkEvidence_RemovesLink_AppendsAuditEntry_RetainsPhysicalDocument`: **PASSED**
3. `UpdateEvidenceStatus_ValidStatus_UpdatesLinkAndAppendsAudit`: **PASSED**
4. `AttachEvidence_MultipleDocumentsToSingleRequirement_Allowed`: **PASSED**
5. `AttachEvidence_SingleDocumentToMultipleRequirements_Allowed`: **PASSED**
6. `TenantIsolation_CannotAccessAnotherUsersAssessmentOrDocuments`: **PASSED**

**Execution Result**:
```text
Test run for WebApp.Tests.dll (.NETCoreApp,Version=v8.0)
Passed!  - Failed: 0, Passed: 6, Skipped: 0, Total: 6, Duration: 180 ms
```

### 7.2 Regression Safety Tests (`LegalApplicabilityEngineTests.cs`)
```text
Test run for WebApp.Tests.dll (.NETCoreApp,Version=v8.0)
Passed!  - Failed: 0, Passed: 8, Skipped: 0, Total: 8, Duration: 29 ms
```

### 7.3 Frontend Compilation
- All TypeScript files in `src/components/creator/legal/` and `src/lib/` pass typechecking with zero errors.

---

## 8. Stage 9 Readiness & Recommendations

Stage 8 is complete. The system now possesses both statutory requirement tracking and robust document evidence verification.

**Stage 9 Focus**:
- **Compliance Summary & Export / PDF Pack**:
  - Investor-ready compliance report generation (PDF & JSON export).
  - High-level executive compliance score / readiness index for pitch decks.
  - Formatted statutory appendix citing official French authorities and verified evidence inventory.
