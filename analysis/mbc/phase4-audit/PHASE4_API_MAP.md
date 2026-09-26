# MONDIAL BUSINESS CREATION (MBC) — CREATOR PHASE 4 API MAP
**Complete API Surface, Routes, DTOs, Security, Concurrency, and Error Handling**

---

## 1. Global Controller & Route Structure

- **Controller:** `CreatorPhase4ConstructionController.cs` (`backend/Controllers/CreatorPhase4ConstructionController.cs`)
- **Base Route:** `/api/creator/phase4`
- **Security Policy:** `[Authorize]` JWT Bearer authentication; project ownership validated via `User.FindFirst(ClaimTypes.NameIdentifier)`.
- **Response Envelope:** `ApiResponse<T>` with `success`, `message`, `data`, and `traceId`.

---

## 2. Comprehensive Endpoint Directory

### 2.1 Step 4.1 — Construction Snapshot
| Method | Endpoint | Request Model / Params | Response Model | Concurrency Header | Status Codes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/construction-snapshot` | `?ideaId={ideaId}` | `ConstructionSnapshotResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 404, 500 |
| `POST` | `/construction-snapshot/generate` | `GenerateSnapshotRequest` body + `?ideaId={id}&expectedVersion={v}` | `ConstructionSnapshotResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `POST` | `/construction-snapshot/refresh` | `GenerateSnapshotRequest` body + `?ideaId={id}&expectedVersion={v}` | `ConstructionSnapshotResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |

### 2.2 Step 4.2 — Operational Roadmap
| Method | Endpoint | Request Model / Params | Response Model | Concurrency Header | Status Codes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/roadmap` | `?ideaId={ideaId}` | `OperationalRoadmapResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 404, 500 |
| `POST` | `/roadmap/generate` | `GenerateRoadmapRequest` body + `?ideaId={id}&expectedVersion={v}` | `OperationalRoadmapResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `POST` | `/roadmap/refresh` | `GenerateRoadmapRequest` body + `?ideaId={id}&expectedVersion={v}` | `OperationalRoadmapResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `PATCH` | `/roadmap/task` | `UpdateRoadmapTaskRequest` body + `?ideaId={id}&expectedVersion={v}` | `OperationalRoadmapResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `POST` | `/roadmap/activate` | `ActivateRoadmapTaskRequest` body + `?ideaId={id}&expectedVersion={v}` | `OperationalRoadmapResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `POST` | `/roadmap/availability`| `UpdateWeeklyAvailabilityRequest` body + `?ideaId={id}&expectedVersion={v}` | `OperationalRoadmapResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `POST` | `/roadmap/keep-current`| `KeepCurrentRoadmapRequest` body + `?ideaId={id}&expectedVersion={v}` | `OperationalRoadmapResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |

### 2.3 Step 4.3 — Needs Analysis
| Method | Endpoint | Request Model / Params | Response Model | Concurrency Header | Status Codes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/needs` | `?ideaId={ideaId}` | `NeedsAnalysisResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 404, 500 |
| `POST` | `/needs/generate` | `GenerateNeedsRequest` body + `?ideaId={id}&expectedVersion={v}` | `NeedsAnalysisResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `POST` | `/needs/refresh` | `GenerateNeedsRequest` body + `?ideaId={id}&expectedVersion={v}` | `NeedsAnalysisResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `PATCH` | `/needs/{needKey}` | `UpdateNeedRequest` body + `?ideaId={id}&expectedVersion={v}` | `NeedsAnalysisResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `PUT` | `/needs/{needKey}/state` | `UpdateNeedStateRequest` body + `?ideaId={id}&expectedVersion={v}` | `NeedsAnalysisResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `POST` | `/needs/keep-current` | `KeepCurrentNeedsRequest` body + `?ideaId={id}&expectedVersion={v}` | `NeedsAnalysisResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |

### 2.4 Step 4.4 — Skills & Training Plan
| Method | Endpoint | Request Model / Params | Response Model | Concurrency Header | Status Codes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/skills-plan` | `?ideaId={ideaId}` | `SkillsPlanResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 404, 500 |
| `POST` | `/skills-plan/generate` | `GenerateSkillsPlanRequest` body + `?ideaId={id}&expectedVersion={v}` | `SkillsPlanResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `POST` | `/skills-plan/refresh` | `GenerateSkillsPlanRequest` body + `?ideaId={id}&expectedVersion={v}` | `SkillsPlanResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `POST` | `/skills-plan/keep-current` | `KeepCurrentSkillsPlanRequest` body + `?ideaId={id}&expectedVersion={v}` | `SkillsPlanResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |
| `PATCH` | `/skills-plan/{resolutionKey}` | `UpdateSkillResolutionRequest` body + `?ideaId={id}&expectedVersion={v}` | `SkillsPlanResponse` | `X-Creator-Idea-Version` | 200, 400, 401, 403, 409, 500 |

### 2.5 Step 4.5 — Aids, Grants & Public Support
| Method | Endpoint | Request Model / Params | Response Model | Concurrency Header | Status Codes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/support` | `?ideaId={ideaId}` | `SupportPlanResponse` | *(Finding P4-002)* | 200, 400, 401, 403, 404, 500 |
| `POST` | `/support/generate` | `GenerateSupportPlanRequest` body | `SupportPlanResponse` | *(Finding P4-002)* | 200, 400, 401, 403, 500 |
| `POST` | `/support/refresh` | `GenerateSupportPlanRequest` body | `SupportPlanResponse` | *(Finding P4-002)* | 200, 400, 401, 403, 500 |
| `PATCH` | `/support/{supportKey}` | `UpdateSupportMatchRequest` body | `SupportPlanResponse` | *(Finding P4-002)* | 200, 400, 401, 403, 500 |
| `POST` | `/support/facts` | `AnswerEligibilityFactRequest` body | `SupportPlanResponse` | *(Finding P4-002)* | 200, 400, 401, 403, 500 |

### 2.6 Step 4.6 — Pricing & Revenue Model Strategy
| Method | Endpoint | Request Model / Params | Response Model | Concurrency Header | Status Codes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/pricing` | `?ideaId={ideaId}` | `PricingStrategyResponse` | *(Finding P4-001)* | 200, 400, 401, 403, 404, 500 |
| `POST` | `/pricing/generate` | `GeneratePricingRequest` body | `PricingStrategyResponse` | *(Finding P4-001)* | 200, 400, 401, 403, 500 |
| `POST` | `/pricing/refresh` | `GeneratePricingRequest` body | `PricingStrategyResponse` | *(Finding P4-001)* | 200, 400, 401, 403, 500 |
| `PATCH` | `/pricing/{offerKey}` | `UpdatePricingOfferRequest` body | `PricingStrategyResponse` | *(Finding P4-001)* | 200, 400, 401, 403, 500 |

---

## 3. Concurrency & Header Evaluation

- **Optimistic Concurrency Pattern:** `expectedVersion` query parameter compared against `CreatorIdea.Version`. If `expectedVersion != dbRecord.Version`, the service throws a concurrency conflict yielding `HTTP 409 Conflict`.
- **Response Synchronization:** `Response.Headers["X-Creator-Idea-Version"]` transmits the newly incremented document version back to the frontend axios interceptors.
- **Audit Findings:** Steps 4.1–4.4 have full concurrency support. Step 4.5 and Step 4.6 have open findings (P4-001, P4-002) for integrating `expectedVersion`.

---
*End of Phase 4 API Map.*
