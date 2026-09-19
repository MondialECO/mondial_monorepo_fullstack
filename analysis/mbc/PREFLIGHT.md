# MBC Codebase Modernization Preflight Report

**System Name:** Mondial Business Creation (MBC)  
**Inspection Date:** 2026-09-19  
**Audit Mode:** Read-Only Discovery (Zero Production Code Modification)  
**Target Path:** Workspace Root (`.`)  

---

## 1. Preflight Summary

The Mondial Business Creation (MBC) repository is a large-scale, fullstack enterprise monorepo comprising a Next.js 16 / React 19 frontend and an ASP.NET Core 8 Web API backend with MongoDB persistence, Hangfire distributed background processing, SignalR realtime hubs, and OpenRouter AI integrations.

### Readiness Verdicts by Skill

| Downstream Skill | Readiness Status | Notes |
|---|---|---|
| **`modernize-assess`** | **READY (WITH GAPS)** | Fullstack source completeness is high. Tooling relies on built-in fallbacks (`scc` not installed in PATH; LOC/COCOMO will be computed via script). |
| **`modernize-map`** | **READY** | Controllers, services, routes, models, and MongoDB collections are well-defined and discoverable. |
| **`modernize-extract-rules`** | **READY** | Domain logic, AI pipelines, validations, and lifecycle states are inspectable across C# controllers and TypeScript features. |
| **`modernize-harden`** | **READY** | Security surfaces (JWT, Sumsub KYC, Mongo queries, RBAC, AI prompts) are accessible for read-only audit. |
| **Overall Preflight Verdict** | **PASS / READY WITH GAPS** | Environment is approved for read-only modernization discovery. |

---

## 2. Repository Structure

```text
mondial_monorepo_fullstack/
├── src/                         # Primary Next.js App Router frontend (~1,067 files)
│   ├── app/                     # Route handlers & pages ((auth), dashboard, marketplace, etc.)
│   ├── components/              # Radix UI + Tailwind UI components
│   ├── features/                # Domain-specific feature modules
│   ├── hooks/                   # Custom React hooks (auth, creator, realtime)
│   ├── lib/                     # Client libraries, API clients, utilities
│   └── providers/               # Context providers (Theme, QueryClient, Auth)
├── backend/                     # ASP.NET Core 8 Web API (~2,914 files)
│   ├── Controllers/             # 55 REST API controllers
│   ├── DbContext/               # MongoDbContext (50+ collections)
│   ├── Extensions/              # DI extensions (AiService, CompanyServices, Observability)
│   ├── Models/DatabaseModels/   # Domain & AI MongoDB entities (65+ entity classes)
│   ├── Services/                # Business logic, AI orchestrators, Hangfire workers
│   ├── tests/                   # Backend xUnit & integration test suites
│   ├── WebApp.csproj            # .NET 8 project definition
│   └── WebApp.sln               # Solution file
├── frontend/                    # Secondary / baseline frontend tree (duplicate/legacy review)
├── docs/                        # Specifications, product canons, and architecture docs (130 files)
├── tests/                       # E2E test suites (Creator flow Playwright tests)
├── scripts/                     # Monorepo runner, Figma sync scripts, audit utilities
├── analysis/mbc/                # Quarantined audit artifacts directory
└── .agents/                     # Workspace Antigravity customizations & plugins
```

---

## 3. Technology Detection

| Layer | Detected Technology | Version | Location / Manifest |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | `^16.1.7` | `package.json` |
| **UI Library** | React / React DOM | `19.2.3` | `package.json` |
| **Styling** | Tailwind CSS / PostCSS | `^4.1.18` / `@tailwindcss/postcss` | `package.json`, `tailwind.config.ts` |
| **Backend Framework** | ASP.NET Core Web API | .NET 8.0 (`net8.0`) | `backend/WebApp.csproj` |
| **Language Runtime** | C# 12 / .NET SDK | `8.0.425` | `C:\Users\Siraj\.dotnet\dotnet.exe` |
| **JavaScript Runtime** | Node.js | `v22.19.0` | `C:\Program Files\nodejs\node.exe` |
| **Primary Database** | MongoDB | C# Driver `2.30.0` | `backend/WebApp.csproj`, `MongoDbContext.cs` |
| **Distributed Caching** | StackExchange.Redis | `8.0.11` / `10.0.5` | `backend/Program.cs` (Redis/In-memory fallback) |
| **Background Jobs** | Hangfire with Mongo storage | `1.8.14` / `1.10.9` | `backend/Extensions/AiServiceCollectionExtensions.cs` |
| **Realtime** | ASP.NET Core SignalR | `10.0.0` (Client) | `@microsoft/signalr`, `backend/Hubs/` |
| **Observability** | OpenTelemetry + Serilog | `1.15.3` / `8.0.3` | `backend/Observability/`, `Program.cs` |

---

## 4. Frontend Environment

- **Architecture**: Next.js App Router located under `src/app/`.
- **State & Data Management**:
  - `zustand` (`^5.0.10`) for client store management.
  - `@tanstack/react-query` (`^5.90.16`) for server state caching and background refetching.
  - `axios` (`^1.13.2`) for REST calls.
- **Component Primitives**:
  - `@radix-ui/*` (Dialog, Select, Avatar, Tooltip, Progress, ScrollArea, Separator, Slot).
  - Rich text: TipTap editor (`@tiptap/react: ^3.29.0`) and `react-quill-new`.
  - Visuals: `lucide-react`, `recharts`, `framer-motion`.
- **Testing**:
  - `vitest: ^1.1.0` with `@vitest/coverage-v8` for unit tests.
  - `@playwright/test: ^1.61.1` for E2E creator journey tests.

---

## 5. Backend Environment

- **Target Framework**: `net8.0` with nullable reference types enabled and invariant globalization.
- **API Surface**:
  - 55 Controllers under `backend/Controllers/` covering all business domains.
  - API versioning enabled via `Asp.Versioning.Mvc` (`8.1.0`) with header (`X-Api-Version`) and query string (`api-version`) readers.
  - Swagger / OpenAPI documentation via `Swashbuckle.AspNetCore` (`6.4.0`).
- **Resilience & Fault Tolerance**:
  - `Microsoft.Extensions.Http.Polly` (`8.0.14`) handles transient HTTP retries (429 / 5xx) on AI provider requests.
  - Global rate limiter and dedicated per-IP auth rate limiter (5 attempts/min) + per-user AI rate limiter (20 requests/min).
- **Security & Data Protection**:
  - ASP.NET Core Data Protection persisted to StackExchange.Redis in production (filesystem in development).
  - SkiaSharp (`4.150.1`) and Svg.Skia (`5.2.3`) for server-side logo and branding rendering.

---

## 6. Database / MongoDB Environment

- **Connection**: Managed via singleton `IMongoClient` and `IMongoDatabase` in `backend/Program.cs`.
- **Driver**: `MongoDB.Driver: 2.30.0` with retryable reads and writes enabled.
- **Connection Tuning**:
  - `ServerSelectionTimeout`: 5 seconds
  - `ConnectTimeout`: 10 seconds
  - `SocketTimeout`: 30 seconds
  - `MaxConnectionPoolSize`: 200 (Min: 10)
- **Identity Storage**: `AspNetCore.Identity.MongoDbCore` mapped to `applicationUsers` collection.
- **Collections**: Over 50 distinct domain collections registered in `backend/DbContext/MongoDbContext.cs`:
  - Core Business: `BusinessIdeas`, `Companies`, `Deals`, `DealExecutions`, `Investments`, `Transactions`
  - Creator: `CreatorIdeas`, `CreatorJourneys`, `BrandKits`, `IpValuations`, `Phase3Kpis`, `Phase3Concepts`
  - Entrepreneur: `Phase4CapTables`, `Phase4VestingSchedules`, `Phase6DataRooms`, `SmartMatchRuns`
  - Investor: `Investors`, `InvestorMatches`, `InvestorDiligenceSessions`, `InvestorFinanceVerifications`
  - Service Provider: `ProfessionalProfiles`, `ServiceProviderProfiles`, `ServiceListings`, `ClientBriefs`, `WorkroomEngagements`, `Contracts`, `Invoices`
  - Platform: `UniversalIdentityVerifications`, `IdentityWebhookDeliveryLogs`, `ChatMessages`, `Conversations`, `Notifications`, `PlatformSettings`, `AdminAuditLogs`

---

## 7. Background Jobs

- **Job Engine**: Hangfire (`1.8.14`) backed by `Hangfire.Mongo` (`1.10.9`) on the shared MongoDB connection.
- **Collections**: Managed under `hangfire.*` prefix with automatic migration and defensive collection backup strategies.
- **Queue Topology**:
  - `default`: Legacy background tasks, email background workers (`EmailBackgroundService`), workroom expiry and conversion jobs (`WorkroomConversionJob`, `WorkroomTimedRulesJob`).
  - `ai`: Dedicated queue for compute-heavy AI tasks.
- **Worker Concurrency**: Configurable via `Hangfire:WorkerCount` (defaults to 4 workers).
- **Registered AI Task Handlers**:
  - `NoOpProbeHandler`
  - `IdeaGeneratorHandler` (Phase 2 Discovery)
  - `IdeaClarifierHandler` (C-2)
  - `MarketStudyHandler` (Phase 3.1)
  - `BusinessModelHandler` (Phase 3.2)
  - `BusinessPlanHandler` (C-3)
  - `ForecastHandler` (C-4)

---

## 8. AI Integrations Detected

- **Provider**: **OpenRouter** (`https://openrouter.ai/api/v1`) via typed `OpenRouterClient`.
- **Default LLM Model**: `google/gemini-3.8-flash` mapped across all 11 task types in `appsettings.json`:
  1. `Probe`
  2. `IdeaClarifier`
  3. `MarketStudy`
  4. `BusinessModel`
  5. `BusinessPlan`
  6. `BusinessPlanSectionRewrite`
  7. `Forecast`
  8. `IdeaGenerator`
  9. `DirectionGeneration`
  10. `LogoParameterSelection` / `LogoConceptRegenerate`
  11. `ColorGeneration` / `TypographyGeneration`
- **Output Token Limits**: Bounded between 500 (`Probe`) and 8,500 (`BusinessModel`).
- **Credit & Quota Economy**:
  - Starter credits: 200 credits granted upon user onboarding.
  - Credit consumption per task: e.g. Business Plan (33), Forecast (32), Clarifier (20), Market Study (20), Business Model (18).
- **AI Persistence Repositories**: 7 dedicated collections:
  - `AiRequestRepository`
  - `AiResponseRepository`
  - `PromptVersionRepository`
  - `AiModelUsageRepository`
  - `AiFeedbackRepository`
  - `AiInsightRepository`
  - `AiCreditLedgerRepository`

---

## 9. Authentication & Authorization Indicators

- **Authentication Scheme**: JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer: 8.0.0`).
- **Token Configuration**:
  - Issuer / Audience: `mondialbusiness.eu`
  - ClockSkew: 30 seconds
  - Access token query extraction for SignalR websocket handshakes (`/hubs`).
  - Automatic claim backfill: maps JWT `sub` to `ClaimTypes.NameIdentifier` for .NET 8 compatibility.
- **Authorization Policies**:
  - Role-based: `AdminAccess` (`Admin`, `SuperAdmin`), `SuperAdminOnly`.
  - Persona roles in database: `Creator`, `Entrepreneur`, `Investor`, `ServiceProvider`.
- **Identity Verification & KYC**:
  - External KYC: **Sumsub** integration (`SumsubService`, API token, webhook secret) governed by `FeatureFlags:IdentityV2Enabled`.
  - Internal Verification: `UniversalIdentityVerification` (document-only KYC, no face scan required) with partial unique active index per user.

---

## 10. Available Analysis Tooling

| Tool | Status | Version / Path |
|---|---|---|
| `.NET SDK` | ✅ Available | `8.0.425` (`C:\Users\Siraj\.dotnet\dotnet.exe`) |
| `Node.js` | ✅ Available | `v22.19.0` (`C:\Program Files\nodejs\node.exe`) |
| `npm` | ✅ Available | `10.9.3` (`C:\Program Files\nodejs\npm.ps1`) |
| `pnpm` | ✅ Available | `10.16.1` |
| `yarn` | ✅ Available | Present in npm global path |
| `Git` | ✅ Available | `2.51.0.windows.1` |
| `Python` | ✅ Available | Python 3.x available in system PATH |

---

## 11. Missing or Unavailable Tools

| Tool | Severity | Impact | Fallback Strategy |
|---|---|---|---|
| `scc` | ⚠️ Low | Automated SLOC & COCOMO matrix | Computed via Antigravity directory inspection and formula `PM = 2.94 × (KSLOC)^1.10`. |
| `cloc` | ⚠️ Low | Per-language line count | Same as `scc` fallback. |
| `lizard` | ⚠️ Low | Cyclomatic complexity scan | Keyword heuristic scan across C# and TypeScript control structures. |
| `glow` | ℹ️ None | Terminal markdown rendering | Antigravity IDE renders markdown artifacts directly. |

---

## 12. Repository Completeness

- **Source Code**: Complete. Both frontend (`src/`) and backend (`backend/`) have all necessary entry points, models, controllers, and services present.
- **Project Structure Note**: There is both a root Next.js application (`src/`) and a secondary nested `frontend/` directory. The active monorepo dev script (`scripts/dev-monorepo.js`) launches the root frontend on port 3000 and backend on port 5093.
- **Package Manifests**:
  - Root `package.json` contains complete frontend dependencies.
  - `backend/WebApp.csproj` contains complete NuGet package references.
  - `backend/NuGet.config` is present and locks package source to `api.nuget.org`.

---

## 13. Git Working Tree Status

- **Current Branch**: `dev-hafiz` (Commit: `0121a8bb`).
- **Unstaged Changes**: `git diff` is completely empty. **Zero pre-existing production files are modified.**
- **Untracked Files**: Restricted to `.tools/` (cloned Claude source), test/scratch scripts in `scratch/` and `scripts/`, and pre-existing local JSON test logs.
- **Branch Health**: Up to date with `origin/dev-hafiz`.

---

## 14. Risks Before Deeper Audit

1. **Monorepo Directory Ambiguity**: The presence of both root `src/` and subfolder `frontend/` requires subsequent discovery passes to focus explicitly on the active root application while noting legacy/duplicate files in `frontend/`.
2. **Credential Exposure Risk**: Connection strings and API keys reside in local development configs (`appsettings.json`, `.env`). All subsequent audit passes must enforce 100% credential masking (`AKIA****`, `mongodb://admin:****`).
3. **Estate Scale**: With ~4,000 source files across C# and TypeScript, full graph generation must be scoped to domain clusters (Creator, Entrepreneur, Investor, Service Provider, Platform) rather than a monolithic flat graph.

---

## 15. Preflight Pass / Partial Pass / Blocked Status

### **VERDICT: PASS (READY WITH GAPS)**

- No blocking issues exist.
- Required build toolchains (.NET 8 SDK, Node.js 22 LTS, npm, Python, Git) are fully operational.
- Gaps are limited to missing non-critical CLI utilities (`scc`, `lizard`), which are seamlessly replaced by built-in Antigravity script fallbacks.
- Source completeness and architecture integrity are verified.

---

## 16. Recommended Next Audit Step

Execute the **`modernize-assess`** skill to produce:
1. Quantitative SLOC inventory and COCOMO-II effort estimation.
2. Complete technology fingerprint and architectural domain clustering.
3. Technical debt ranking (top 10 findings with `file:line` citations).
4. Generation of `analysis/mbc/ASSESSMENT.md` and `analysis/mbc/ARCHITECTURE.mmd`.
