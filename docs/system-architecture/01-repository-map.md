# Mondial ECO — Repository Architecture & Inventory Map

**Repository Root**: `d:\mondial.eco\9-12-2026\mondial_monorepo_fullstack`  
**Current Branch**: `dev-hafiz`  
**Baseline Commit SHA**: `ab41c402392cbb64e6c2e667285c09e0e3b1213e`  
**Status**: Clean working tree  
**Analysis Date**: September 13, 2026  

---

## 1. Top-Level Directory Inventory

| Path | Responsibility | Runtime Context | Main Technologies | Main Dependencies / Connections |
|---|---|---|---|---|
| `src/` | Canonical Frontend Application Root | Client-side & Next.js Server Components | Next.js 16, React 19.2, TypeScript 5, Tailwind 4, shadcn/ui | Consumes ASP.NET Core API via Axios (`src/lib/axios.ts`) and SignalR hubs |
| `backend/` | Canonical Backend Monolith Service | ASP.NET Core Web API on Kestrel (.NET 8) | C# 12, ASP.NET Core 8, MongoDB Driver, StackExchange.Redis, Hangfire | MongoDB Atlas, Redis 7, OpenRouter AI, Zoho SMTP, Sumsub |
| `public/` | Public Static Assets | Browser Static Serving | SVG, WebP, PNG, Favicons | Served directly by Next.js static asset handler |
| `tests/` | Playwright End-to-End Test Suite | Node.js Test Harness / CI & Local | Playwright, TypeScript, Docker Compose (`tests/creator/e2e`) | Tests full browser user journeys against running Next.js and API |
| `scripts/` | Audit, verification, and development automation | Node.js / PowerShell / Bash Dev Scripts | Node.js (ESM), PowerShell, Bash | Monorepo dev runner (`dev-monorepo.js`), Figma parsers, integrity audits |
| `docs/` | System Documentation, Phase Reports, Architecture | Documentation | Markdown, Mermaid | System Architecture Suite (`docs/system-architecture/`) |
| `backend/tests/` | Backend Unit & Integration Tests | .NET 8 Test Runner (`dotnet test`) | xUnit, FluentAssertions, Moq, Mongo2Go | Tests controllers, services, calculators, engines, security gates |
| `mondial-baseline/` | Reference Archive of Historical Baseline Code | Archival / Non-runtime | C#, Markdown | Historical reference snapshot (excluded from build) |
| `frontend/` | Legacy Frontend Wrapper / Earlier Phase Workspace | Build Wrapper / Historical Root | Next.js, npm delegation (`npm --prefix .. run ...`) | Configured to forward npm tasks to the root project |
| `service/` | Legacy Auth Helper Workspace | Archival / Historical Stub | TypeScript (`service/auth/auth.ts`) | Legacy auth client stub (retained for backward reference) |
| `scratch/` | Local analysis and temporary audit tooling | Development Scratchpad | Node.js scripts, temporary JSON outputs | Ignored scripts for schema and endpoint introspection |
| `.github/` | GitHub Actions Workflows & Issue Templates | CI / CD Automation | YAML, GitHub Actions Runners | Automated testing, linting, Docker image packaging |

---

## 2. Frontend Source Tree Breakdown (`src/`)

| Directory / File | Architectural Role | Key Modules & Files | Used By |
|---|---|---|---|
| `src/app/` | Next.js 16 App Router Routes | 198 `page.tsx` routes across 11 domains | End Users (Browser) |
| `src/app/(auth)/` | Authentication Routes | `login/`, `register/`, `forgot-password/`, `reset-password/` | Unauthenticated Visitors |
| `src/app/onboarding/` | Universal Phase 1 Identity & Verification Hub | `identity/`, `documents/*`, `face-verification/`, `complete/` | New Users across all roles |
| `src/app/dashboard/` | Role-Based Authenticated Dashboards | `creator/`, `entrepreneur/`, `investor/`, `serviceprovider/`, `admin/` | Authenticated Users with valid roles |
| `src/app/_providers/` | Root Context Providers | `AuthProvider.tsx`, `ReactQueryProvider.tsx`, `RootProviders.tsx` | All routes wrapped by `src/app/layout.tsx` |
| `src/components/ui/` | shadcn/ui Design Primitives | Button, Dialog, Card, Input, Table, Tooltip, Dropdown, etc. | Feature components across all domains |
| `src/components/layout/` | Shell, Navigation & Guards | `AppSidebar.tsx`, `Topbar.tsx`, `AuthGuard.tsx` | Dashboard pages and root layouts |
| `src/components/serviceprovider/` | Service Provider Design System & UI | `SpCard`, `SpMetricCard`, `SpPage`, analytics charts | Service Provider Dashboard routes |
| `src/components/creator/` | Creator Phase 1-6 UI Components | AI Clarifier, Branding tool, Business plan editor, Crossroads | Creator Dashboard routes |
| `src/components/entrepreneur/` | Entrepreneur Phase 2-10 Components | Cap Table, KPI Tracker, Data Room, Diligence, Pitch Deck | Entrepreneur Dashboard routes |
| `src/components/investor/` | Investor Discovery & Deal Components | Diligence room, Term Sheet builder, Pipeline Kanban, Portfolio | Investor Dashboard routes |
| `src/components/marketplace/` | Marketplace Listings & Exploration | Project grid, Service catalog, Filters, Deal modals | Public & Authenticated Marketplace |
| `src/lib/` | Core Utilities, API Clients & Contracts | `axios.ts`, `roles.ts`, `api-config.ts`, `menu.ts`, `auth-contract.ts` | Entire frontend application |
| `src/context/` | Legacy and specialized context stores | `AuthContext.tsx` (re-exports AuthProvider) | Components consuming auth state |
| `src/hooks/` | Custom React Hooks | `useBreadcrumb.ts`, `use-mobile.ts`, `use-notifications.ts` | Navigation and layout components |
| `src/types/` | TypeScript Domain Interfaces | `deals.ts`, `creator/`, `investor/`, `entrepreneur.ts`, `workroom.ts` | Frontend type checking and API DTO contracts |
| `src/styles/` | Global CSS & Typography | `globals.css`, `fonts.css` | Root styling, theme tokens (light/dark mode) |

---

## 3. Backend Source Tree Breakdown (`backend/`)

| Directory / File | Architectural Role | Key Responsibilities | Runtime Relevance |
|---|---|---|---|
| `Controllers/` | HTTP API Ingress (51 Controllers, 579 Endpoints) | Route handling, model binding, API response envelope formatting | Critical / Primary Ingress |
| `Services/` | Core Domain Services & Business Logic Engines | `CompanyService.cs`, `CreatorIdeaService.cs`, `WorkroomService.cs`, `LeadsService.cs` | Critical Domain Core |
| `Services/Implementations/` | Stateful Service Implementations | `ValuationEngine.cs`, `CapTableCalculator.cs`, `InvestorMatcher.cs`, `AiReviewEngine.cs` | Pure & Stateful Business Logic |
| `Services/Repository/` | MongoDB Data Access Repositories | `MongoRepository<T>`, `CompanyRepository.cs`, `CreatorIdeaRepository.cs` | Primary DB Abstraction |
| `Services/Repository/Ai/` | AI Session and Operational Repositories | `ClarifierSessionRepository.cs`, `BusinessPlanSessionRepository.cs`, `ForecastSessionRepository.cs` | AI Session Persistence |
| `Services/Ai/` | AI Subsystem (OpenRouter Client & Handlers) | `OpenRouterClient.cs`, `ModelRouter.cs`, `PromptBuilder.cs`, `AiJobRunner.cs` | AI Generation & Streaming |
| `DbContext/` | MongoDB Database Context & Indexing | `MongoDbContext.cs` (91 Collections), `MongoDbSettings.cs` | MongoDB Database Connection |
| `Models/DatabaseModels/` | Domain Entities & MongoDB Documents | BSON entity models (`ApplicationUser`, `CreatorIdea`, `Companies`, `DealExecution`) | Database Schema Definition |
| `Models/Dtos/` | Data Transfer Objects | Request & Response contracts for all controllers | API Contract Integrity |
| `Middleware/` | HTTP Middleware Pipeline | `CorrelationIdMiddleware.cs`, `SecurityHeadersMiddleware.cs`, `ExceptionHandlingMiddleware.cs` | Request Pre/Post Processing |
| `Filters/` | MVC Action & Authorization Filters | `ValidationFilter.cs`, `HangfireDashboardAuthorizationFilter.cs` | Request validation & Dashboard Auth |
| `Hubs/` | SignalR Real-Time Communication | `ChatHub.cs` (`/hubs/chat`), `NotificationHub.cs` (`/hubs/notifications`) | Real-time WebSocket Messaging |
| `HealthChecks/` | Orchestrator Health Probes | `MongoHealthCheck.cs`, `RedisHealthCheck` (`/health/live`, `/health/ready`) | Traefik & Docker load balancing |
| `Observability/` | Metrics & OpenTelemetry Tracing | Prometheus metrics exporter (`/metrics`), Serilog correlation enrichment | Monitoring & Diagnostics |
| `Validation/` | FluentValidation Request Validators | `LoginRequestModelValidator.cs`, `AuthValidators.cs` | Input Validation & Defense |
| `Configuration/` | Strongly-Typed Configuration & Validation | `StartupConfigValidation.cs`, `OpenRouterSettings.cs`, `PlatformCommerceConstants.cs` | Fail-fast Boot & Env Binding |
| `Extensions/` | Dependency Injection Composition Modules | `ServiceCollectionExtensions.cs`, `AiServiceCollectionExtensions.cs`, `SeedingExtensions.cs` | Program.cs IoC Setup |
