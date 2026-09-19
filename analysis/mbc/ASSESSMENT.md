# Codebase Modernization Assessment: Mondial Business Creation (MBC)

**System Name:** Mondial Business Creation (MBC) Monorepo  
**Inspection Date:** 2026-09-19  
**Audit Stage:** Stage 2 — Architecture & Technical Debt Assessment (`modernize-assess`)  
**Mode:** Strictly Read-Only Discovery (Zero Production Code Modifications)  
**Associated Diagram:** [`analysis/mbc/ARCHITECTURE.mmd`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/analysis/mbc/ARCHITECTURE.mmd)

---

## 1. Executive Summary

The Mondial Business Creation (MBC) codebase is an enterprise-scale fullstack monorepo spanning **~406,500 source lines of code (SLOC)** across TypeScript/React (frontend) and C#/.NET 8 (backend). It powers a multi-sided ecosystem connecting **Creators / Founders**, **Entrepreneurs**, **Investors**, and **Service Providers**.

The platform exhibits strong architectural foundations:
- A durable, well-isolated **AI Orchestration Engine** backed by OpenRouter (routing tasks by default to `google/gemini-3.8-flash`), structured schema interpretation, immutable session versioning, and rate-limited Hangfire workers.
- Rich domain models with **over 50 MongoDB collections**, indexing strategies, and multi-replica Redis coordination for SignalR websockets and distributed caching.

However, significant technical debt and structural divergence exist:
1. **Severe Controller Over-concentration**: `DealsController.cs` spans **8,376 lines**, `CompanyService.cs` spans **5,952 lines**, and `CompanyController.cs` spans **2,789 lines**. Massive business workflows (escrow state machines, cap table mutations, and diligence approvals) are concentrated directly inside API controllers rather than encapsulated within domain services.
2. **Dual Frontend Trees**: The active Next.js application lives under root [`src/`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src) (1,067 files), while a legacy/historical snapshot of 220 files remains under [`frontend/`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/frontend).
3. **Client-Side Architectural Heavyweighting**: 64% of all frontend components (`676` of `1,062` files) declare `"use client"`. Server Component advantages are underutilized, with complex business calculations, status derivations, and financial tables computed directly inside client component hooks.
4. **Creator Phase 3 Pipeline Fragmentation**: While the Project Intelligence pipeline (`Clarifier` → `Market Study` → `Business Model` → `Business Plan` → `Forecast`) follows a logical lineage, data context is assembled via distinct session stores (`ClarifierSession`, `MarketStudySession`, etc.), and intermediate AI outputs are partially denormalized into `CreatorIdea.Phase3Data` and raw BSON documents.

---

## 2. Quantitative Inventory

### SLOC Breakdown by Language & Type

| Language / Asset Type | Files | Approx. SLOC | Typical Locations |
|---|---|---|---|
| **TypeScript / TSX (`.tsx`)** | 1,111 | 198,521 | `src/app/`, `src/components/`, `src/features/` |
| **C# (`.cs`)** | 636 | 152,892 | `backend/Controllers/`, `backend/Services/`, `backend/Models/` |
| **TypeScript (`.ts`)** | 237 | 30,194 | `src/lib/`, `src/hooks/`, `src/types/` |
| **JavaScript / Node Modules (`.mjs`, `.js`)** | 220 | 24,912 | `scripts/`, `tests/` |
| **Documentation & Specs (`.md`)** | 95 | 20,904 | `docs/`, root audits |
| **Styles (`.css`)** | 4 | 711 | `src/app/globals.css`, `src/styles/` |
| **JSON Specifications & Fixtures (`.json`)** | 103 | 2,491,154* | `scripts/` (Figma dumps), seed payloads |
| **Total Active Application Code** | **2,204** | **~406,519** | *(Excluding JSON fixtures, node_modules, build bins)* |

*\*Note: JSON volume is dominated by large Figma node export snapshots in `scripts/` (~2.4M lines).*

### COCOMO-II Effort Estimation

Using the COCOMO-II basic model for Organic/Semi-detached systems:
$$\text{Effort (Person-Months)} = 2.94 \times (\text{KSLOC})^{1.10}$$
- **Total Application KSLOC**: $\approx 406.5$ KSLOC
- **Computed Effort**: $2.94 \times (406.5)^{1.10} \approx 2,130\text{ person-months}$ (~177 person-years)
- **Backend Only (C#)**: $152.9\text{ KSLOC} \to 2.94 \times (152.9)^{1.10} \approx 720\text{ person-months}$
- **Frontend Only (TS/TSX)**: $228.7\text{ KSLOC} \to 2.94 \times (228.7)^{1.10} \approx 1,127\text{ person-months}$

### Top 15 Largest Source Files in Codebase

| File Path | Lines | Language | Architectural Role | Risk / Debt Observation |
|---|---|---|---|---|
| [`backend/Controllers/DealsController.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Controllers/DealsController.cs) | 8,376 | C# | Deal execution, escrow, term sheets | **Extreme Fat Controller**: 415 KB; mixes HTTP, Mongo, PDF, legal logic |
| [`backend/Services/CompanyService.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Services/CompanyService.cs) | 5,952 | C# | 9-phase entrepreneur company logic | **God Service**: Orchestrates all entrepreneur phases in one class |
| [`backend/Controllers/CompanyController.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Controllers/CompanyController.cs) | 2,789 | C# | Entrepreneur API endpoints | Overly fat controller; duplicates logic with `CompanyService` |
| [`src/app/dashboard/entrepreneur/discover/[ideaId]/page.tsx`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/entrepreneur/discover/[ideaId]/page.tsx) | 2,079 | TSX | Discovery detail view | **Giant Client Component**: 2,000+ lines in a single page component |
| [`backend/Controllers/MarketplaceProjectsController.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Controllers/MarketplaceProjectsController.cs) | 2,022 | C# | Marketplace project aggregation | Direct database queries bypassing service layer |
| [`backend/Controllers/CreatorBrandKitController.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Controllers/CreatorBrandKitController.cs) | 1,988 | C# | Brand studio logo/color generation | Heavy file manipulation & SVG rendering |
| [`src/lib/api-entrepreneur.ts`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/lib/api-entrepreneur.ts) | 1,908 | TS | Frontend client for CompanyController | Monolithic API helper file |
| [`src/lib/api-marketplace-projects.ts`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/lib/api-marketplace-projects.ts) | 1,787 | TS | Marketplace frontend client | Monolithic API helper file |
| [`backend/Models/Dtos/MarketplaceProjectDtos.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Models/Dtos/MarketplaceProjectDtos.cs) | 1,569 | C# | DTOs for Marketplace | Large DTO bag with overlapping contracts |
| [`src/components/entrepreneur/AcquiredProjectWorkspace.tsx`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/entrepreneur/AcquiredProjectWorkspace.tsx) | 1,555 | TSX | Acquired project view | Monolithic UI workspace |
| [`backend/Services/Implementations/AnalyticsService.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Services/Implementations/AnalyticsService.cs) | 1,426 | C# | Metrics & Analytics | Complex multi-collection aggregation |
| [`src/components/creator/phase5/CrossroadsPathA.tsx`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/creator/phase5/CrossroadsPathA.tsx) | 1,401 | TSX | Creator Phase 5 decision flow | High JSX complexity with embedded calculations |
| [`backend/Controllers/InvestorPhaseController.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Controllers/InvestorPhaseController.cs) | 1,330 | C# | Investor stage flow | Fat controller managing diligence flows |
| [`src/components/creator/brand-kit/ColorSystemModal.tsx`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/creator/brand-kit/ColorSystemModal.tsx) | 1,229 | TSX | Brand studio color picker modal | High local state & color math in modal |
| [`src/components/serviceprovider/AnalyticsWorkspace.tsx`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/serviceprovider/AnalyticsWorkspace.tsx) | 1,221 | TSX | Service Provider analytics | Large dashboard UI with charts and tables |

---

## 3. Technology Fingerprint

```text
[Frontend: Next.js 16.1.7 + React 19.2.3 + Tailwind 4.1.18]
                           │
                 HTTP REST │ WebSocket (SignalR 10.0.0)
                           ▼
[Backend: ASP.NET Core 8 Web API (.NET 8.0.425)]
   │                     │                       │
   ▼                     ▼                       ▼
[MongoDB 2.30.0]    [Hangfire 1.8.14]    [OpenRouter AI Client]
(50+ Collections)   (default + ai queues) (google/gemini-3.8-flash)
```

- **Backend Runtime**: C# 12 / .NET 8.0 SDK (8.0.425) on ASP.NET Core Kestrel.
- **Frontend Runtime**: Node.js 22 LTS, Next.js App Router (`src/app`), React 19.
- **Database**: MongoDB Driver `2.30.0`, `AspNetCore.Identity.MongoDbCore: 6.0.0`.
- **Background Orchestrator**: Hangfire (`1.8.14`) with `Hangfire.Mongo: 1.10.9`.
- **Realtime Backplane**: ASP.NET Core SignalR with StackExchange.Redis backplane.
- **AI Infrastructure**: OpenRouter via typed `HttpClient` with Polly transient fault retry (`Microsoft.Extensions.Http.Polly`).

---

## 4. Repository / Domain Breakdown

### Active vs Duplicate Frontend Analysis

| Characteristic | Root `src/` Tree | Subfolder `frontend/` Tree | Architectural Status |
|---|---|---|---|
| **File Count** | **1,067 files** | **220 files** | `src/` is the active production frontend; `frontend/` is an orphaned historical baseline. |
| **Referenced by Dev Script** | **YES** (`node scripts/dev-monorepo.js` targets `rootDir`) | **NO** (Not spawned by dev runner) | `src/` runs on port 3000 during active development. |
| **Next.js & React Version** | Next `^16.1.7`, React `19.2.3` | Next `^16.1.7`, React `19.2.3` | Identical dependency version baseline. |
| **Creator Phase 3–6 Coverage** | **Complete** (All phase 3, 4, 5, 6 routes present) | **None** (Stops at Phase 2 Step 3) | `frontend/` lacks 896 modern files present in `src/`. |
| **Cross-Tree Imports** | **Zero** (No imports between `src/` and `frontend/`) | **Zero** | Completely decoupled trees. |
| **Recommendation** | **Retain as Canonical** | **Quarantine / Deprecate** | Flag `frontend/` as technical debt to be archived. |

---

## 5. Frontend Architecture Assessment

### 1. Component Boundaries & "use client" Density
- **Density**: 676 of 1,062 TypeScript files (64%) explicitly include `"use client"`.
- **Implication**: The application operates largely as a Single-Page Application (SPA) inside Next.js. Most pages fetch data on the client side via `useEffect` or `useQuery` instead of leveraging React Server Components for data hydration.
- **Overly Coupled Components**: Multiple page components exceed 1,000 lines (e.g. `AcquiredProjectWorkspace.tsx`, `discover/[ideaId]/page.tsx`, `CrossroadsPathA.tsx`), containing embedded modal dialogs, data mapping, and calculation logic.

### 2. State & Networking
- **Data Fetching**: Split across raw `fetch`, custom Axios instances (`src/lib/axios.ts`), and 41 React Query hooks.
- **API Clients**: Over 20 specialized client files under `src/lib/api-*.ts` (e.g. `api-entrepreneur.ts` is 51 KB; `api-marketplace-projects.ts` is 55 KB).
- **Zustand**: Declared as a dependency in `package.json`, but currently unreferenced in `src/`. State is handled almost entirely by component state (`useState`), custom hooks, and React Context.

---

## 6. Backend Architecture Assessment

### 1. Business Logic Placement
Business logic is heavily weighted in the **Controller layer**:
- `DealsController.cs` (8,376 lines) contains full state machines for deals, legal term validation, escrow milestone changes, document generation, and direct Mongo queries.
- `CompanyController.cs` (2,788 lines) duplicates domain validation found in `CompanyService.cs`.
- `MarketplaceProjectsController.cs` (2,021 lines) directly injects `MongoDbContext` and queries 6 different collections without a dedicated domain service.

### 2. God Services
- `backend/Services/CompanyService.cs` spans **5,952 lines**. It manages all 9 phases of the entrepreneur journey, company profile creation, cap table updates, share issuances, data room access, and compliance checks in a single class.

---

## 7. Database Assessment

### Domain Collection Grouping in `MongoDbContext`

```text
Database: MondialEcoDev (50+ Collections)
├── Core Business: BusinessIdeas, Companies, Deals, DealExecutions, Investments, Transactions
├── Creator Domain: CreatorIdeas, CreatorJourneys, BrandKits, IpValuations, Phase3Kpis, Phase3Concepts
├── AI Infrastructure: AiRequests, AiResponses, PromptVersions, AiModelUsages, AiFeedbacks,
│                      AiInsights, AiCreditLedgers, AiReconciliationAudits
├── AI Session Stores: ClarifierSessions, MarketStudySessions, BusinessModelSessions,
│                      BusinessPlanSessions, ForecastSessions
├── Entrepreneur Domain: Phase4CapTables, Phase4VestingSchedules, Phase4OwnershipHistories,
│                        Phase6DataRoomAccessRequests, SmartMatchRuns
├── Investor Domain: Investors, InvestorMatches, InvestorDiligenceSessions, InvestorDiligenceReviews,
│                    InvestorFinanceVerifications, CompanyPortfolioHoldings
├── Service Provider: ProfessionalProfiles, UserCredentials, ServiceProviderProfiles, ServiceListings,
│                     ClientBriefs, Proposals, WorkroomEngagements, Contracts, Invoices
└── Platform & Shared: UniversalIdentityVerifications, IdentityWebhookDeliveryLogs, IdentityDecisionAuditLogs,
                       ApplicationUsers, Conversations, ChatMessages, Notifications, PlatformSettings
```

### Database Observations & Risks
1. **Case-Sensitivity Anomaly**: `ApplicationUsers` is mapped as `_database.GetCollection<ApplicationUser>("applicationUsers")` (camelCase) to appease `AspNetCore.Identity.MongoDbCore`, whereas all other collections are PascalCase.
2. **Denormalization vs Reference**: Creator project data is denormalized across `CreatorIdea.Project`, `CreatorIdea.Phase3Data`, and individual session collections (`ClarifierSession`, `MarketStudySession`, `BusinessPlanSession`). Updates to the core project do not automatically propagate to already-generated session snapshots.
3. **Unbounded Embedded Arrays**: Certain document models embed interaction logs and event histories directly (e.g. `ClientBriefInteractions`, `DealExecution.AuditTrail`), which could approach the 16MB BSON document limit in high-volume lifecycles.

---

## 8. Creator Domain Assessment

The Creator domain handles Founder ideas from raw concept through Brand Identity and Project Intelligence:
- **Ideation & Journey**: Managed via `CreatorIdeaRepository` and `CreatorJourneyRepository`. A Creator has one `CreatorJourney` with derived milestone statuses.
- **Brand Visual Identity Studio**: Fully implemented server-side in `CreatorBrandKitController` using **SkiaSharp** and **Svg.Skia** to generate vector logos, color harmonies, and exportable brand assets.
- **State Flow**:
  1. Frontend submits concept to `api/creator/ideas`.
  2. Idea Clarifier (`api/ai/clarifier`) creates a `ClarifierSession`.
  3. Hangfire executes `IdeaClarifierHandler` via OpenRouter (`google/gemini-3.8-flash`).
  4. Output is stored in `ClarifierSession.Output` and synced to `CreatorIdea`.

---

## 9. Creator Phase 3 / Project Intelligence Assessment

### Lineage & Context Propagation Pipeline

```text
[Founder Submission]
       │
       ▼
[ClarifierSession] ────► Clarifier Output
       │                        │
       ▼                        ▼
[MarketStudySession] ◄── [Canonical Idea Core] + Benchmark
       │
       ▼
[BusinessModelSession] ◄── [Canonical Idea Core] + MarketStudy Output
       │
       ▼
[BusinessPlanSession] ◄── [Canonical Idea Core] + Clarifier History
       │
       ▼
[ForecastSession] ◄── BusinessPlan Content + Financial Inputs (ARPU, OPEX, Churn)
       │
       ▼
[CreatorPhase3Controller] ──► Legal Checklist & Company Formation Options
```

### Critical Findings in Project Intelligence
1. **Canonical Context Precedence**: In `BusinessPlanHandler.cs` (lines 70–84) and `MarketStudyHandler.cs` (lines 70–79), the system explicitly prioritizes `CANONICAL IDEA CORE` (`creatorIdea.Project`) over historical session outputs. This is an intentional architectural pattern to preserve founder manual edits.
2. **Missing Market Study / Business Model Prompt Injection in Business Plan**: While `BusinessPlanController` enforces that a creator must complete Market Study and Business Model before generating a plan (line 114), `BusinessPlanHandler.cs` (lines 80–115) injects **only** `Canonical Idea Core` and `Clarifier Output` into the LLM prompt. The rich TAM/SAM/SOM insights from Market Study and Canvas blocks from Business Model are **not directly injected into the Business Plan prompt**.
3. **Dual Representation of Output**: Forecast output is stored both as a structured BSON document in `ForecastSession.Versions` and parsed via raw key lookups (e.g. `breakEvenAnalysis.breakEvenMonth`) in `CreatorPhase3Controller.cs` (lines 92–100) for formation gating.

---

## 10. AI Architecture Assessment

- **Provider**: **OpenRouter** (`https://openrouter.ai/api/v1`) via typed `OpenRouterClient`.
- **Model Standard**: All 11 handlers are mapped to `google/gemini-3.8-flash` via `appsettings.json`.
- **Resilience**: `OpenRouterClient` incorporates Polly transient retry handling for HTTP 429 and 5xx responses.
- **Fault Handling & NeedsReview**: When JSON parsing of an LLM completion fails, handlers (e.g. `BusinessPlanHandler.cs` line 22) do **not** crash the background worker; they record the raw text on `AiResponse`, flag the session as `NeedsReview`, and preserve user credit balance.
- **Idempotency**: Requests enforce single-flight keys per user (e.g. `{owner}:business_plan:{clarifierId}`) to prevent double billing.

---

## 11. Background Job Architecture (Hangfire)

- **Engine**: Hangfire `1.8.14` with MongoDB storage (`Hangfire.Mongo: 1.10.9`).
- **Queues**:
  - `default`: Scheduled tasks (email sending, client brief soft-expiration, workroom timed rules).
  - `ai`: Dedicated queue for AI generators (`IdeaGeneratorHandler`, `IdeaClarifierHandler`, `MarketStudyHandler`, `BusinessModelHandler`, `BusinessPlanHandler`, `ForecastHandler`).
- **Concurrency**: Pinned to 4 background workers via `Hangfire:WorkerCount` to prevent outbound AI rate limit exhaustion.
- **Job Recovery**: Uses `StopRetryOnPermanentAiFailureAttribute` to cancel repeated Hangfire retries on unrecoverable authentication or model errors.

---

## 12. Identity & Authorization Assessment

- **Authentication**: JWT Bearer with ASP.NET Core 8 claim backfilling (`sub` → `ClaimTypes.NameIdentifier`).
- **Authorization Models**:
  - **RBAC**: Strictly enforced on Admin (`Authorize(Roles = "Admin,SuperAdmin")`) and Service Provider (`Authorize(Roles = "ServiceProvider")`).
  - **OBAC (Ownership-Based Access Control)**: Creator and Entrepreneur endpoints rely primarily on `[Authorize]` with in-code ownership queries (`GetOwnedAsync(id, currentUserId)`).
- **SignalR Token Transport**: WebSocket handshakes pass tokens via query strings, which are sanitized by `QueryStringRedactionMiddleware` to prevent credential leakage in HTTP server logs.

---

## 13. Verification & Compliance Architecture

The repository exhibits two distinct verification systems operating concurrently:
1. **Legacy `VarificationController` (`api/Varification`)**: Direct multipart document upload stored on local disk via `KycStorageService`. Admin manual review workflow.
2. **Modern `IdentityController` (`api/Identity`)**: WebSDK session initialization with **Sumsub** and `UniversalIdentityVerification` collection.
- **Coexistence**: `VarificationController` injects `IIdentityVerificationService?` to bridge records, but the dual-controller existence represents technical debt and operational confusion.

---

## 14. Role Domain Boundaries

| Role | Frontend Module | API Surface | Persistence Boundary | Cleanliness Rating |
|---|---|---|---|---|
| **Creator** | `src/app/dashboard/creator` | `CreatorPhase*Controller`, `BrandKitController`, AI Controllers | `CreatorIdeas`, `CreatorJourneys`, AI Sessions | **Moderate**: Clean storage, but logic split across many controllers |
| **Entrepreneur** | `src/app/dashboard/entrepreneur` | `CompanyController`, `DealsController` | `Companies`, `Phase4*`, `Deals` | **Low / Tangled**: Heavily coupled with Investor deal flows |
| **Investor** | `src/app/dashboard/investor` | `InvestorController`, `InvestorPhaseController` | `Investors`, `InvestorMatches`, `DealExecutions` | **Low / Tangled**: Shares deal state machine with Entrepreneur |
| **Service Provider** | `src/app/dashboard/serviceprovider` | `ServiceProviderController`, `WorkroomController` | `ProfessionalProfiles`, `ServiceProviderProfiles`, `Workrooms` | **High**: Clean profile split migration, independent catalog/workroom |

---

## 15. Testing Architecture

- **Backend Test Suite**: **181 test files** (152 Unit, 25 Integration) under `backend/tests/WebApp.Tests`. Strong coverage for Marketplace push logic, Deal lifecycle reconciliation, and identity verification.
- **Frontend Unit Tests**: **67 test files** under `src/__tests__/` (Service Provider: 15, Entrepreneur: 10, Admin: 10, Routing/Lib: 20).
- **Coverage Gap**: Creator Phase 2 and Phase 3 have **zero frontend unit tests** in `src/__tests__`. Creator coverage is limited to 16 Playwright E2E test scripts under `tests/creator/e2e`.

---

## 16. Technical Debt Classification

| Classification | Definition | MBC Codebase Instances |
|---|---|---|
| **HEALTHY** | Well-structured, modular, robust | AI Job Engine (`OpenRouterClient`, `AiJobRunner`), Hangfire dual-queue setup, MongoDB connection pooling, Service Provider 3-way profile split. |
| **MINOR DEBT** | Local cleanup opportunity | Orphaned `frontend/` directory (220 files), unused `zustand` dependency in root `package.json`, spelling in `VarificationController`. |
| **REFACTOR CANDIDATE** | Architecture needs improvement without behavior change | 64% `"use client"` density, monolithic frontend API client files (`api-entrepreneur.ts` > 50KB), multiple 1,000+ line UI workspace components. |
| **HIGH-RISK DEBT** | Threat to reliability, maintainability, or scaling | **`DealsController.cs` (8,376 lines)**, **`CompanyService.cs` (5,952 lines)**, direct Mongo querying in `MarketplaceProjectsController.cs`, dual KYC verification controllers. |
| **NEEDS DEEPER MAPPING** | Insufficient evidence until topological tracing | Creator Project Intelligence prompt context injection gaps, exact Deal state machine transitions between Entrepreneur and Investor. |

---

## 17. Top Technical Debt Findings

### Finding DEBT-01: Massive Fat Controller (`DealsController.cs`)
- **Severity**: **HIGH-RISK DEBT**
- **Domain**: Deals & Transactions / Entrepreneur / Investor
- **Evidence**: [`backend/Controllers/DealsController.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Controllers/DealsController.cs) (Lines 1–8,376)
- **Why It Matters**: 8,376 lines in a single controller. Mixes HTTP routing, database queries, escrow calculations, legal agreement parsing, and PDF document generation.
- **Likely Impact**: Extreme regression risk during maintenance, unmaintainable unit testing, race condition susceptibility during deal status transitions.
- **Next Step**: Investigate in `modernize-map` (call graph) and `modernize-extract-rules`.

---

### Finding DEBT-02: God Service (`CompanyService.cs`)
- **Severity**: **HIGH-RISK DEBT**
- **Domain**: Entrepreneur 9-Phase Journey
- **Evidence**: [`backend/Services/CompanyService.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Services/CompanyService.cs) (Lines 1–5,952)
- **Why It Matters**: Orchestrates company onboarding, cap tables, share issuances, data rooms, and milestone reviews across all 9 phases in a single 6,000-line service.
- **Likely Impact**: Tight coupling; failure in one phase logic can destabilize unrelated phases.
- **Next Step**: Investigate in `modernize-map`.

---

### Finding DEBT-03: Orphaned Baseline Tree (`frontend/`)
- **Severity**: **MINOR DEBT**
- **Domain**: Frontend Repository Structure
- **Evidence**: Root [`src/`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src) (1,067 files) vs [`frontend/`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/frontend) (220 files)
- **Why It Matters**: 171 identical or outdated files exist in `frontend/`. Developers or automated tools might mistakenly inspect or edit the wrong tree.
- **Likely Impact**: Confusion, wasted disk space, potential tooling drift.
- **Next Step**: Archive or delete `frontend/` in a future cleanup PR (outside discovery).

---

### Finding DEBT-04: Direct Database Bypass in Controller (`MarketplaceProjectsController.cs`)
- **Severity**: **REFACTOR CANDIDATE**
- **Domain**: Marketplace
- **Evidence**: [`backend/Controllers/MarketplaceProjectsController.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Controllers/MarketplaceProjectsController.cs) (Lines 31, 100–2,021)
- **Why It Matters**: The controller bypasses domain services and directly queries `_context.Companies`, `_context.Investments`, and `_creatorIdeas`.
- **Likely Impact**: Marketplace business rules cannot be reused by internal services or background jobs.
- **Next Step**: Investigate in `modernize-map`.

---

### Finding DEBT-05: High "use client" Density & Giant Components
- **Severity**: **REFACTOR CANDIDATE**
- **Domain**: Frontend Architecture
- **Evidence**: `676` of `1,062` files (64%) declare `"use client"`. Several components exceed 1,500 lines:
  - [`src/app/dashboard/entrepreneur/discover/[ideaId]/page.tsx`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/entrepreneur/discover/[ideaId]/page.tsx) (2,079 lines)
  - [`src/components/entrepreneur/AcquiredProjectWorkspace.tsx`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/entrepreneur/AcquiredProjectWorkspace.tsx) (1,555 lines)
- **Why It Matters**: Large client bundles, degraded initial page load performance, hard-to-test client components with heavy embedded state.
- **Likely Impact**: Slower mobile page rendering and high memory usage in browser sessions.
- **Next Step**: Investigate in `modernize-map`.

---

### Finding DEBT-06: Dual Identity Verification Controllers
- **Severity**: **HIGH-RISK DEBT**
- **Domain**: Identity & Compliance
- **Evidence**: [`backend/Controllers/VarificationController.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Controllers/VarificationController.cs) (414 lines) vs [`backend/Controllers/IdentityController.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Controllers/IdentityController.cs) (163 lines)
- **Why It Matters**: Two separate verification paths exist: one storing files on disk (`uploads/kyc`), the other delegating to Sumsub WebSDK.
- **Likely Impact**: Split verification status, security risk if unvetted documents are approved via legacy routes.
- **Next Step**: Investigate in `modernize-harden` and `modernize-map`.

---

### Finding DEBT-07: Project Intelligence Upstream Context Truncation
- **Severity**: **NEEDS DEEPER MAPPING**
- **Domain**: Creator Phase 3 / Project Intelligence
- **Evidence**: [`backend/Services/Ai/Jobs/BusinessPlanHandler.cs`](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/backend/Services/Ai/Jobs/BusinessPlanHandler.cs) (Lines 80–115)
- **Why It Matters**: While `BusinessPlanController` gates execution on completing Market Study and Business Model, `BusinessPlanHandler` only feeds `Canonical Idea Core` and `Clarifier Output` into the prompt. Market Study data (TAM/SAM/SOM) is not passed into the business plan prompt.
- **Likely Impact**: Generated business plans may contradict earlier market study outputs.
- **Next Step**: Investigate in `modernize-extract-rules`.

---

### Finding DEBT-08: Missing Frontend Unit Tests for Creator Flow
- **Severity**: **MINOR DEBT**
- **Domain**: Testing
- **Evidence**: Zero test files under `src/__tests__/creator/`.
- **Why It Matters**: Creator Phase 2 and 3 rely entirely on 16 Playwright E2E tests, with no fast-running unit tests for complex client-side calculations or brand kit UI state.
- **Likely Impact**: High risk of silent UI regressions during frontend refactoring.
- **Next Step**: Note in testing roadmap.

---

## 18. Areas Requiring Deeper Analysis

### Areas Requiring `modernize-map`
1. **Deals State Machine**: Trace all inbound and outbound edges from `DealsController` across Entrepreneur, Investor, and MongoDB.
2. **Marketplace Data Lineage**: Map how projects, companies, and service listings aggregate into marketplace search and detail views.
3. **Realtime SignalR Mesh**: Map SignalR hub publishers and client subscribers for Notifications and Messenger.

### Areas Requiring `modernize-extract-rules`
1. **Financial Calculations in Phase 3 / 4**: Extract formulas for Forecast break-even, LTV/CAC, Cap Table vesting, and dilution schedules.
2. **Creator Project Intelligence Pipeline**: Formalize Given/When/Then rule cards for context propagation across all 5 AI session stages.
3. **Universal Verification Gating**: Extract exact rules determining when a user is allowed to publish an idea, list an investment, or book a service.

### Areas Requiring `modernize-harden`
1. **Direct Mongo Query Sanitization**: Inspect raw queries in `MarketplaceProjectsController` and `DealsController` for injection vectors.
2. **Legacy KYC Storage Security**: Audit `VarificationController` disk uploads for path traversal or insecure file permissions.
3. **Role Gating Uniformity**: Verify whether Creator AI endpoints require persona role authorization beyond simple user ownership.

---

## 19. Assessment Verdict

> **ASSESSMENT VERDICT: HEALTHY CORE WITH SIGNIFICANT STRUCTURAL DEBT**
>
> The MBC platform possesses an exceptionally well-engineered AI execution layer, clean Mongo indexing, and complete functional coverage across all four personas. 
> 
> The primary architectural liabilities are **monolithic fat controllers** (`DealsController` @ 8.3K lines, `CompanyService` @ 6K lines), an **orphaned legacy frontend tree** (`frontend/`), **dual KYC verification controllers**, and **64% client-side component density**.
>
> The codebase is fully ready for topological mapping (`modernize-map`) and business rule extraction (`modernize-extract-rules`).
