# Mondial ECO — Most Important Files Index

This index identifies the most critical files in the codebase that define platform behavior, data contracts, and security boundaries.

---

## 1. Key Application Files

### 1. `src/app/_providers/AuthProvider.tsx`
- **Role**: Universal Client Authentication & Session Authority
- **Why Important**: Manages JWT token storage in `localStorage`, cross-tab synchronization, `/auth/me` backend verification, and the universal Phase 1 Onboarding gate. If broken, all authenticated routes and dashboards fail.
- **Connected Systems**: `src/components/layout/AuthGuard.tsx`, `src/lib/axios.ts`, `src/app/dashboard/layout.tsx`.

### 2. `src/lib/axios.ts`
- **Role**: Shared HTTP Client & Request/Response Interceptor
- **Why Important**: Automatically injects `Authorization: Bearer <token>` onto all API requests, catches 401 Unauthorized errors, queues failing requests, and seamlessly refreshes access tokens against `/api/auth/refresh-token`.
- **Connected Systems**: All TanStack React Query hooks, `src/lib/api-config.ts`, `backend/Controllers/AuthController.cs`.

### 3. `src/lib/roles.ts`
- **Role**: Role Definitions, Priority Resolution & Route Normalizer
- **Why Important**: Defines the `UserRole` enum, parses strict roles from backend claims, determines primary role precedence, and maps users to their respective `/dashboard/[role]` home routes.
- **Connected Systems**: `AuthProvider.tsx`, `AuthGuard.tsx`, `src/lib/menu.ts`.

### 4. `backend/Program.cs`
- **Role**: Backend Entry Point, IoC Dependency Container & Middleware Pipeline
- **Why Important**: Orchestrates the entire ASP.NET Core server boot: config validation, MongoDB singleton registration, Redis distributed multiplexer, JWT authentication, SignalR hub routing, Hangfire background server, and security middlewares.
- **Connected Systems**: All 51 Controllers, Redis 7, MongoDB Atlas, Traefik.

### 5. `backend/DbContext/MongoDbContext.cs`
- **Role**: Centralized MongoDB Database Context & Index Registry
- **Why Important**: Declares and exposes all 91 MongoDB collections. Executes startup background index creation for the matchmaking queue, cap tables, access logs, workrooms, and audit trails.
- **Connected Systems**: All Repositories, Domain Services, MongoDB Atlas.

### 6. `backend/Services/CompanyService.cs`
- **Role**: Core Venture Building Engine & Deal Closure Orchestrator
- **Why Important**: Manages the entire 9-phase journey for entrepreneurs, traction metric tracking, valuation engine calls, diligence NDA checks, and post-deal execution side effects (updating `AmountRaised`, issuing cap table shares, creating portfolio holdings).
- **Connected Systems**: `CompanyController.cs`, `CapTableCalculator.cs`, `InvestorMatcher.cs`, `DealsController.cs`.

### 7. `backend/Controllers/DealsController.cs`
- **Role**: Platform Deal & Negotiation Gateway
- **Why Important**: Implements the 79 endpoints governing Full Buyout acquisitions, Co-Founder Equity partnerships, and Investor Funding rounds. Manages counter-offer revisions, bilateral digital signatures, escrow payments, and IP handover.
- **Connected Systems**: `DealExecution.cs`, `CompanyService.cs`, `Phase9Requirements.cs`, `NotificationHub.cs`.

### 8. `backend/Models/DatabaseModels/CreatorIdea.cs`
- **Role**: Canonical Multi-Idea Data Entity
- **Why Important**: Represents the core innovation asset created by Creators. Holds branding assets, AI Clarifier data, business plan drafts, financial models, valuation history, and optimistic concurrency versioning tags.
- **Connected Systems**: `CreatorIdeasController.cs`, `CreatorJourneyService.cs`, `MarketplaceProjectsController.cs`.

### 9. `backend/Services/Implementations/CapTableCalculator.cs`
- **Role**: Mathematical Cap Table & ESOP Engine
- **Why Important**: Computes exact share issuance numbers, pre/post-money valuation conversions, option pool dilutions, and vesting schedules without floating-point rounding errors.
- **Connected Systems**: `Phase4CapTables`, `Companies.cs`, `CompanyService.cs`.

### 10. `backend/docker-compose.yml`
- **Role**: Production Container Topology & Orchestration
- **Why Important**: Defines the single-VPS production architecture: Traefik v2.11 reverse proxy with Let's Encrypt TLS, scalable ASP.NET Core API replicas, Redis 7 with AOF persistence, and named Docker volume mounts.
- **Connected Systems**: Docker Engine, Traefik, Redis, ASP.NET Core API.
