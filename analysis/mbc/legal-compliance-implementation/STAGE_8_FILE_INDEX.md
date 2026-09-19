# STAGE 8 FILE INDEX — LEGAL EVIDENCE VAULT & AUDIT TRAIL

| File Path | Purpose | Modification Type | Dependencies |
| :--- | :--- | :--- | :--- |
| `backend/Models/DatabaseModels/Legal/CreatorLegalAssessment.cs` | Added `LegalEvidenceLink` and `LegalEvidenceAuditEntry` entities, and integrated `EvidenceLinks` and `EvidenceAuditTrail` collections on `CreatorLegalAssessment` | Modified | MongoDB Bson Attributes, C# |
| `backend/Models/DatabaseModels/Legal/LegalEnums.cs` | Added `LegalEvidenceStatuses` (`Linked`, `NeedsReview`, `AcceptedForPlanning`, `Replaced`, `Archived`) and `LegalEvidenceAuditActions` (`Uploaded`, `Linked`, `Unlinked`, `Replaced`, `StatusChanged`) | Modified | C# Enums / Constants |
| `backend/Models/Dtos/LegalComplianceDtos.cs` | Added `UnlinkLegalItemEvidenceRequest`, `UpdateEvidenceStatusRequest`, `LegalEvidenceLinkDto`, `LegalEvidenceAuditEntryDto`, and updated `LegalComplianceOverviewDto` | Modified | C# DTOs, JSON Serialization |
| `backend/Services/Interface/ICreatorJourneyService.cs` | Added `UnlinkLegalAssessmentItemEvidenceAsync`, `UpdateLegalEvidenceStatusAsync`, and updated `AttachLegalAssessmentItemEvidenceAsync` | Modified | C# Interface |
| `backend/Services/Implementations/CreatorJourneyService.cs` | Implemented zero-storage-duplication evidence linking, audit entry appending, unlinking (preserving physical file in `CreatorIdea.Documents`), and status mutation | Modified | MongoDB Driver, Tenant Isolation |
| `backend/Controllers/CreatorPhase3Controller.cs` | Added `POST /api/creator/phase-3/legal-assessment/{ideaId}/item/{itemId}/evidence/unlink` and `PATCH /api/creator/phase-3/legal-assessment/{ideaId}/evidence/{linkId}/status` endpoints | Modified | ASP.NET Core, ClaimsPrincipal Auth |
| `src/lib/api-creator-journey.ts` | Added `LegalEvidenceStatus`, `LegalEvidenceLinkDto`, `LegalEvidenceAuditEntryDto`, updated `ExtendedLegalChecklistItem`, `CreatorLegalAssessmentDto`, and added `unlinkLegalEvidence` / `updateEvidenceStatus` API calls | Modified | TypeScript, Axios, React Query |
| `src/components/creator/legal/LegalEvidenceVaultView.tsx` | Dedicated Legal Evidence Vault & Audit Trail view with KPI header, search, stage/status filters, dual-view table/cards, missing evidence drawer, and immutable audit timeline | Created | React, Lucide, Tailwind, shadcn |
| `src/components/creator/legal/LegalStageNavigation.tsx` | Added Evidence Vault quick nav button with live badge counter to left pane | Modified | React, Lucide, Badge |
| `src/components/creator/legal/LegalRequirementCanvas.tsx` | Updated requirement canvas to display all linked evidence items, direct vault deep links, and multi-document attachment triggers | Modified | React, Lucide, Badge, Button |
| `src/app/dashboard/creator/phase-3/compliance/page.tsx` | Added top workspace section switcher (`Legal Roadmap` vs `Evidence Vault`), bidirectional state synchronization, and unlink / status-update mutations | Modified | React, TanStack Query, Phase3SetupShell |
| `backend/tests/WebApp.Tests/Unit/LegalEvidenceVaultTests.cs` | Suite of 6 unit tests covering link, multi-link, audit trail creation, unlink preservation, status update, and tenant boundary enforcement | Created | xUnit, Moq, MongoDB Driver |
| `analysis/mbc/legal-compliance-implementation/STAGE_8_REPORT.md` | Comprehensive Stage 8 architecture, implementation, and verification report | Created | Markdown Documentation |
| `analysis/mbc/legal-compliance-implementation/STAGE_8_FILE_INDEX.md` | Stage 8 file index and dependency mapping | Created | Markdown Documentation |
