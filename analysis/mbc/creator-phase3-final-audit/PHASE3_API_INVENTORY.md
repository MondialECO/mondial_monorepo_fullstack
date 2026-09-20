# MONDIAL BUSINESS CREATION (MBC)
## CREATOR PHASE 3 — API INVENTORY & SECURITY AUDIT

### 1. Complete Phase 3 Backend Endpoints

| Method | Route | Controller | Step | Purpose | Auth | ideaId-Scoped? | Concurrency Check (`expectedVersion`)? | Mutates DB? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/creator/market-study/generate` | `MarketStudyController` | 3.1 | Generate/stream AI Market Study | `[Authorize]` | Yes (`ideaId` in query/body) | No | Yes (`MarketStudySessions`) |
| `GET` | `/api/creator/market-study/session/{sessionId}` | `MarketStudyController` | 3.1 | Get single market study session | `[Authorize]` | Yes (Verified via CreatorIdea ownership) | N/A (Read) | No |
| `GET` | `/api/creator/market-study/idea/{ideaId}` | `MarketStudyController` | 3.1 | Get market study for idea | `[Authorize]` | Yes (Verified via user ideas) | N/A (Read) | No |
| `POST` | `/api/creator/business-model/generate` | `BusinessModelController` | 3.2 | Generate AI Business Model Canvas | `[Authorize]` | Yes (`ideaId` in body) | No | Yes (`BusinessModelSessions`) |
| `GET` | `/api/creator/business-model/session/{sessionId}` | `BusinessModelController` | 3.2 | Get single business model session | `[Authorize]` | Yes (Ownership validated) | N/A (Read) | No |
| `GET` | `/api/creator/business-model/idea/{ideaId}` | `BusinessModelController` | 3.2 | Get business model for idea | `[Authorize]` | Yes (Ownership validated) | N/A (Read) | No |
| `POST` | `/api/creator/forecast/generate` | `ForecastController` | 3.3 | Generate 36-month financial forecast | `[Authorize]` | Yes (`ideaId` in query/body) | No | Yes (`ForecastSessions`) |
| `GET` | `/api/creator/forecast/session/{sessionId}` | `ForecastController` | 3.3 | Get single forecast session | `[Authorize]` | Yes (Ownership validated) | N/A (Read) | No |
| `GET` | `/api/creator/forecast/idea/{ideaId}` | `ForecastController` | 3.3 | Get forecast for idea | `[Authorize]` | Yes (Ownership validated) | N/A (Read) | No |
| `GET` | `/api/creator/phase-3/legal-rules` | `CreatorPhase3Controller` | 3.4 | Get active legal rules catalog | `[Authorize]` | N/A (Static catalog) | N/A (Read) | No |
| `POST` | `/api/creator/phase-3/legal-assessment` | `CreatorPhase3Controller` | 3.4 | Evaluate legal rules for idea | `[Authorize]` | Yes (`ideaId` in query) | No | Yes (`CreatorIdea.Phase3`) |
| `GET` | `/api/creator/phase-3/legal-assessment` | `CreatorPhase3Controller` | 3.4 | Get current legal assessment | `[Authorize]` | Yes (`ideaId` in query) | N/A (Read) | No |
| `POST` | `/api/creator/phase-3/legal-requirement-status` | `CreatorPhase3Controller` | 3.4 | Update requirement progress | `[Authorize]` | Yes (`ideaId` in query) | No | Yes (`CreatorIdea.Phase3`) |
| `POST` | `/api/creator/phase-3/formation-recommendation` | `CreatorPhase3Controller` | 3.5 | Calculate recommended entity structure | `[Authorize]` | Yes (`ideaId` in query) | No | Yes (`CreatorIdea.Phase3`) |
| `GET` | `/api/creator/phase-3/formation-data` | `CreatorPhase3Controller` | 3.5 | Get saved formation & team data | `[Authorize]` | Yes (`ideaId` in query) | N/A (Read) | No |
| `POST` | `/api/creator/phase-3/formation-data` | `CreatorPhase3Controller` | 3.5 | Save formation selection & team profile | `[Authorize]` | Yes (`ideaId` in query) | No | Yes (`CreatorIdea.Phase3`) |
| `POST` | `/api/creator/business-plan/generate` | `BusinessPlanController` | 3.6 | Generate 12-section business plan | `[Authorize]` | Yes (`ideaId` in body) | No | Yes (`BusinessPlanSessions`) |
| `GET` | `/api/creator/business-plan/session/{sessionId}` | `BusinessPlanController` | 3.6 | Get single business plan session | `[Authorize]` | Yes (Ownership validated) | N/A (Read) | No |
| `GET` | `/api/creator/business-plan/idea/{ideaId}` | `BusinessPlanController` | 3.6 | Get business plan for idea | `[Authorize]` | Yes (Ownership validated) | N/A (Read) | No |
| `PUT` | `/api/creator/business-plan/session/{sessionId}` | `BusinessPlanController` | 3.6 | Update business plan sections | `[Authorize]` | Yes (Ownership validated) | No | Yes (`BusinessPlanSessions`) |
| `GET` | `/api/creator/phase-3/business-plan-section-12` | `CreatorPhase3Controller` | 3.6 | Get Section 12 Legal Framework slice | `[Authorize]` | **DEFECT (Silent fallback)** | N/A (Read) | No |
| `GET` | `/api/creator/phase-3/investor-readiness` | `CreatorPhase3Controller` | 3.7 | Calculate 100-pt investor readiness score | `[Authorize]` | Yes (`ideaId` in query) | N/A (Read) | No |
| `POST` | `/api/creator/phase-3/complete` | `CreatorPhase3Controller` | 3.7 | Complete Phase 3 & unlock Crossroads | `[Authorize]` | Yes (`ideaId` in query) | Yes (`WriteIdeaAsync` version check) | Yes (`CreatorIdea.Journey`) |
| `POST` | `/api/creator/documents/upload` | `CreatorIdeaDocumentsController` | 3.4 | Upload legal evidence attachment | `[Authorize]` | Yes (`ideaId` in form) | No | Yes (`CreatorIdeaDocuments` + disk) |
| `GET` | `/api/creator/documents/download/{id}` | `CreatorIdeaDocumentsController` | 3.4 | Download legal evidence file | `[Authorize]` | Yes (Ownership validated via ideaId) | N/A (Read) | No |
| `DELETE` | `/api/creator/documents/{id}` | `CreatorIdeaDocumentsController` | 3.4 | Delete legal evidence document | `[Authorize]` | Yes (Ownership validated via ideaId) | No | Yes (soft delete) |

---

### 2. Authorization & IDOR Surface Findings

1. **Object-Level Authorization Model**:
   - `MarketStudyController`, `BusinessModelController`, `ForecastController`, and `BusinessPlanController` fetch the parent `CreatorIdea` by querying `_creatorIdeas.GetByIdAsync(ideaId)` and immediately verifying:
     ```csharp
     if (creatorIdea == null || creatorIdea.UserId != currentUserId)
         return Forbid(); // or NotFound
     ```
   - This provides **STRONG** object-level ownership checks across session retrieval.

2. **Silent Fallback Context Leakage (P3-AUDIT-001)**:
   - In `CreatorPhase3Controller.GetBusinessPlanSection12` (L420-424):
     ```csharp
     idea = ideas.FirstOrDefault(i => i.Id == ideaId);
     if (idea == null)
     {
         idea = ideas.FirstOrDefault(i => i.Status == "active") ?? ideas.FirstOrDefault();
     }
     ```
   - **Severity**: HIGH. If a client queries `?ideaId=nonexistent-or-unauthorized-id`, the API silently delivers Section 12 data belonging to another project of the user rather than returning a 404.

3. **Missing `Cache-Control` on Evidence Download (P3-AUDIT-012)**:
   - In `CreatorIdeaDocumentsController.Download` (L157):
     ```csharp
     return File(fileStream, doc.MimeType, doc.FileName);
     ```
   - **Severity**: LOW. Missing explicit `Cache-Control: private, no-store, must-revalidate`. Evidence documents (e.g. contracts, bank identity, incorporation certificates) could be cached by shared corporate proxies.

4. **Optimistic Concurrency Coverage**:
   - `WriteIdeaAsync` enforces `expectedVersion` checking and returns `409 Conflict`.
   - **Defect (P3-AUDIT-010)**: `MarketStudyController` and `BusinessModelController` mutate `CreatorIdea.Phase3.*` via raw `_creatorIdeas.UpdateAsync(creatorIdea)` without verifying `expectedVersion`.
