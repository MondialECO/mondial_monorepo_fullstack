# API CONTRACT & DTO VERIFICATION REPORT

## Acceptance QA Pass — Mondial Business Creation (MBC)

**Evaluated Date:** 2026-09-19  
**Target:** Backend ASP.NET Core Controllers vs Frontend TypeScript API Clients

---

## 1. Executive Summary

A comprehensive endpoint audit was conducted across all Creator journey controllers:
- `CreatorJourneyController` (`api/creator`)
- `CreatorPhase2Controller` (`api/creator/journey/phase2`)
- `CreatorPhase3Controller` (`api/creator`)
- `CreatorPhase5Controller` (`api/creator`)
- `CreatorPhase6Controller` (`api/creator`)
- `CreatorIdeaDocumentsController` (`api/creator/ideas/{ideaId}/documents`)
- `MarketplaceProjectsController` (`api/marketplace/projects`)

**Contract Status:**
- **Zero Casing Drift:** System standardizes on camelCase JSON serialization via `System.Text.Json` settings.
- **Optimistic Concurrency Alignment:** All mutations on `CreatorJourney` and `CreatorIdea` enforce `?ideaId={ideaId}&expectedVersion={version}` via `WriteIdeaAsync`.
- **Zero Orphan Rule IDs:** All legal rule IDs strictly follow `FR-CORP-*`, `FR-FISCAL-*`, `FR-SOCIAL-*`, `FR-REG-*`, `FR-GDPR-*` derived from `FranceRules.json`.

---

## 2. Verified Controller Endpoint Matrix

| Module | HTTP Method | Route | Query / Body Parameters | Response Model | Status |
|---|---|---|---|---|---|
| **Journey Core** | `GET` | `/api/creator/journey` | `ideaId` (optional) | `ApiResponse<JourneyResponse>` | `PASS` |
| **Project Identity** | `PATCH` | `/api/creator/journey/project` | `ideaId`, `expectedVersion`, `UpdateProjectRequest` | `ApiResponse<CreatorJourney>` | `PASS` |
| **Ideas List** | `GET` | `/api/creator/ideas` | None | `ApiResponse<{ ideas, activeIdeaId }>` | `PASS` |
| **Idea Create** | `POST` | `/api/creator/ideas` | None | `ApiResponse<{ ideaId }>` | `PASS` |
| **Active Idea Switch** | `PATCH` | `/api/creator/ideas/active` | `{ ideaId }` | `ApiResponse<{ activeIdeaId }>` | `PASS` |
| **Phase 2 Chat** | `POST` | `/api/creator/journey/phase2/chat-message` | `ideaId`, `expectedVersion`, `{ message }` | `ApiResponse<{ messages, questionIndex, summaryReady }>` | `PASS` |
| **Name Suggestions** | `POST` | `/api/creator/journey/phase2/name-suggestions` | `{ concept }` | `ApiResponse<{ names: string[] }>` | `PASS` |
| **M50 Designers** | `GET` | `/api/creator/journey/phase2/m50-designers` | `ideaId` | `ApiResponse<DesignerDto[]>` | `PASS` |
| **Skip Branding** | `POST` | `/api/creator/journey/phase2/branding/skip` | `ideaId`, `expectedVersion` | `ApiResponse<{ branding }>` | `PASS` |
| **Logo Upload** | `POST` | `/api/creator/journey/phase2/branding/upload-logo` | `ideaId`, `expectedVersion`, Multipart Form | `ApiResponse<{ logoAsset, branding }>` | `PASS` |
| **Legal Evaluate** | `POST` | `/api/creator/legal-compliance/evaluate` | `ideaId`, `expectedVersion` | `ApiResponse<CreatorLegalAssessment>` | `PASS` |
| **Legal Overview** | `GET` | `/api/creator/legal-compliance/overview` | `ideaId` | `ApiResponse<LegalComplianceOverviewDto>` | `PASS` |
| **Legal Item Status** | `PATCH` | `/api/creator/legal-compliance/item/{itemId}/status` | `ideaId`, `expectedVersion`, `{ status }` | `ApiResponse<CreatorLegalAssessment>` | `PASS` |
| **Evidence Attach** | `POST` | `/api/creator/legal-compliance/item/{itemId}/evidence` | `ideaId`, `expectedVersion`, `{ documentId, status, notes }` | `ApiResponse<CreatorLegalAssessment>` | `PASS` |
| **Evidence Unlink** | `POST` | `/api/creator/legal-compliance/item/{itemId}/evidence/unlink` | `ideaId`, `expectedVersion`, `{ documentId }` | `ApiResponse<CreatorLegalAssessment>` | `PASS` |
| **Evidence Status** | `PATCH` | `/api/creator/legal-compliance/evidence/{linkId}/status` | `ideaId`, `expectedVersion`, `{ status, notes }` | `ApiResponse<CreatorLegalAssessment>` | `PASS` |
| **Evidence Replace** | `POST` | `/api/creator/legal-compliance/evidence/replace` | `ideaId`, `expectedVersion`, `{ oldLinkId, newDocumentId, notes }` | `ApiResponse<CreatorLegalAssessment>` | `PASS` |
| **Section 12 Legal** | `GET` | `/api/creator/legal-compliance/section-12` | `ideaId` | `ApiResponse<BusinessPlanSection12Dto>` | `PASS` |
| **Phase 3 Freshness** | `GET` | `/api/creator/phase-3/freshness` | `ideaId` | `ApiResponse<Phase3FreshnessOverviewDto>` | `PASS` |
| **Doc Upload** | `POST` | `/api/creator/ideas/{ideaId}/documents/upload` | Multipart: `file`, `documentType`, `title` | `ApiResponse<CreatorIdeaDocumentDto>` | `PASS` |
| **Doc List** | `GET` | `/api/creator/ideas/{ideaId}/documents` | None | `ApiResponse<{ documents: CreatorIdeaDocumentDto[] }>` | `PASS` |
| **Doc Download** | `GET` | `/api/creator/ideas/{ideaId}/documents/{docId}/download` | None | Physical File Stream (`200 OK`) | `PASS` |
| **Formation Start** | `POST` | `/api/creator/ai/formation-generator/start` | `ideaId`, `expectedVersion` | `ApiResponse<CreatorFormationGenerator>` | `PASS` |
| **Formation Type** | `PATCH` | `/api/creator/formation/select-type` | `ideaId`, `expectedVersion`, `{ selectedType }` | `ApiResponse<{ formation, legalChecklist }>` | `PASS` |
| **Formation Skills** | `PATCH` | `/api/creator/formation/skills` | `ideaId`, `expectedVersion`, `{ youHave, cofounder }` | `ApiResponse<CreatorFormationGenerator>` | `PASS` |
| **Masterplan Complete**| `PATCH` | `/api/creator/masterplan/complete` | `ideaId`, `expectedVersion` | `ApiResponse<{ investorReadinessScore }>` | `PASS` |
| **Readiness Get** | `GET` | `/api/creator/readiness` | `ideaId` | `ApiResponse<CreatorReadinessResponse>` | `PASS` |
| **Crossroads Path** | `PATCH` | `/api/creator/journey/phase5/path` | `ideaId`, `expectedVersion`, `{ path: "build" }` | `ApiResponse<CreatorJourney>` | `PASS` |
| **Level-Up** | `POST` | `/api/creator/level-up` | `ideaId`, `expectedVersion` | `ApiResponse<LevelUpResultDto>` | `PASS` |

---

## 3. DTO Schema & Nullability Analysis

### 3.1 `LegalComplianceOverviewDto`
```typescript
interface LegalComplianceOverviewDto {
  hasAssessment: boolean;
  assessment?: CreatorLegalAssessment;
  jurisdiction: string;          // "FR"
  rulesVersion: string;          // "FR-2026.1"
  planningReadinessPct: number;  // 0.0 - 100.0
  stageBreakdown: LegalStageBreakdown[];
  detectedArchetypes: string[];  // ["saas", "b2b", "marketplace", ...]
  isPotentiallyOutdated: boolean;
  staleMetadata?: LegalStalenessMetadata;
  officialSources: OfficialSourceDto[];
  evidenceLinks: LegalEvidenceLink[];
  evidenceAuditTrail: LegalEvidenceAuditEntry[];
  disclaimer: string;            // Must include "MONDIAL BUSINESS CREATION (MBC)"
}
```
- **Audit Verification:** All fields map 1:1 between backend `WebApp.Models.Dtos.LegalComplianceOverviewDto` and frontend consumers.

### 3.2 `CreatorIdeaDocument`
```csharp
public class CreatorIdeaDocument {
    public string Id { get; set; }
    public string DocumentType { get; set; }
    public string Title { get; set; }
    public string FileName { get; set; }
    public string MimeType { get; set; }
    public long SizeBytes { get; set; }
    public string StorageReference { get; set; } // Internal filename (Guid)
    public string SourceModule { get; set; }     // "legal_compliance"
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Status { get; set; }           // "ready"
}
```
- **Security Check:** `StorageReference` is stripped before returning to client; only `id`, `fileName`, `mimeType`, and `sizeBytes` are exposed in public API DTOs.
