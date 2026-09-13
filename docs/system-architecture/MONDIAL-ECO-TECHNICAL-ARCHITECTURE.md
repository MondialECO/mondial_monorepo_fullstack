# Mondial ECO — Comprehensive Developer & Technical Architecture Specification

**Audience**: Senior Engineers, Solutions Architects, Security Engineers, and DevOps Operators  
**Repository Branch**: `dev-hafiz`  
**Git Baseline**: Commit `ab41c402392cbb64e6c2e667285c09e0e3b1213e`  
**Architecture Date**: September 13, 2026  

---

## 1. Monorepo Structure & Runtime Topography

The repository is structured as a full-stack monorepo featuring a Next.js 16 frontend at the workspace root (`src/`) and an ASP.NET Core 8 Web API backend (`backend/`):

```
mondial_monorepo_fullstack/
├── src/                    # Next.js 16 App Router Frontend (198 Routes)
│   ├── app/                # Route definitions & nested layouts
│   ├── components/         # Feature components & shadcn/ui primitives
│   ├── lib/                # Axios interceptor, roles engine, api config
│   ├── types/              # TypeScript domain types & API DTO contracts
│   └── styles/             # Tailwind 4 & HSL theme tokens
├── backend/                # ASP.NET Core 8 Monolith API (51 Controllers)
│   ├── Controllers/        # HTTP API surface (579 endpoints)
│   ├── Services/           # Core domain services & algorithmic engines
│   ├── DbContext/          # MongoDbContext.cs (78 collections, 81 backend total)
│   ├── Hubs/               # SignalR ChatHub & NotificationHub
│   ├── Models/             # MongoDB database models & DTOs
│   ├── Configuration/      # Fail-fast StartupConfigValidation & settings
│   └── tests/              # 153 C# test suites (181 test files including fixtures)
├── e2e/                    # Playwright E2E browser test specs (4 test files)
├── src/__tests__/          # Vitest React & unit test suites (62 test files)
└── docs/system-architecture/# Architecture suite & 33 Mermaid diagrams
```

---

## 2. Authentication, Session & Role Security

### A. Authentication Lifecycle
- **Credentials Validation**: Executed via ASP.NET Core Identity on `applicationUsers`.
- **JWT Specification**:
  - Algorithm: HMAC-SHA256 with >= 256-bit secret key (`JwtSettings:Key`).
  - Claims: `sub` (User GUID), `email`, `roles[]`.
  - Expiry: 8 hours (`ExpiryHours: 8`).
  - Clock Skew: Enforced at 30 seconds (`ClockSkew = TimeSpan.FromSeconds(30)`).
  - Claim Mapping: `JwtBearerEvents.OnTokenValidated` maps `sub` directly to `ClaimTypes.NameIdentifier`.

### B. Client Session Management
- **Storage Target**: JWT token is stored in browser `localStorage.getItem("token")`.
- **Multi-Tab Sync**: `AuthProvider.tsx` listens on `window.addEventListener('storage', syncAuth)` to propagate logout immediately across all browser instances.
- **Silent Token Refresh**: `src/lib/axios.ts` intercepts HTTP 401, buffers concurrent requests in a promise queue, issues a refresh request to `POST /api/auth/refresh-token`, updates `localStorage`, and replays queued requests without session loss.

### C. Role Precedence & Hierarchy
Multiple roles are supported per user account in `ApplicationUser.Roles`. The primary landing dashboard is resolved via strict priority in `src/lib/roles.ts`:
```
1. SuperAdmin  ──► /dashboard/admin
2. Admin       ──► /dashboard/admin
3. Entrepreneur──► /dashboard/entrepreneur
4. Investor    ──► /dashboard/investor
5. ServiceProvider ──► /dashboard/serviceprovider
6. Creator     ──► /dashboard/creator
```

---

## 3. Core Domain Engines & Data Flows

### A. Algorithmic Valuation Engine (`ValuationEngine.cs`)
- **Location**: `backend/Services/Implementations/ValuationEngine.cs`
- **Methodologies**:
  - Discounted Cash Flow (DCF): Applied to 5-year financial models.
  - Market Multiple Benchmark Matrix: Resolves sector-specific ARR/EBITDA multiples via `MarketBenchmarkResolver.cs`.
- **Auditing**: Valuation runs write immutable snapshots to `IpValuations`.

### B. Cap Table & ESOP Engine (`CapTableCalculator.cs`)
- **Location**: `backend/Services/Implementations/CapTableCalculator.cs`
- **Integrity Guarantee**:
  - Operates on exact integer share math to prevent floating-point rounding discrepancies.
  - Enforces versioned append-only snapshots in `Phase4CapTables`.
  - Maintains unique composite index `{CompanyId, GrantId}` on `Phase4VestingSchedules`.

### C. Deal State Machine (`Phase9Requirements.cs`)
- **Location**: `backend/Services/Implementations/Phase9Requirements.cs`
- **States**: `initiated`, `contacted`, `interested`, `meeting_scheduled`, `due_diligence`, `negotiating`, `term_sheet`, `agreement_sent`, `signed`, `completed`, `rejected`, `withdrawn`.
- **Terminal States**: `completed`, `rejected`, `withdrawn`.
- **Closure Guard**: Advancing to `completed` requires both founder and investor/creator digital signatures (`deal.Signatures.BothSigned == true`).

---

## 4. Real-Time & Asynchronous Subsystems

### A. SignalR WebSocket Topology
- **Hubs**:
  - `NotificationHub` at `/hubs/notifications`
  - `ChatHub` at `/hubs/chat`
- **Redis Backplane**: `AddStackExchangeRedis` using prefix `MondialSignalR`.
- **Contract Pin**: `PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase` guarantees hub messages match REST DTO schemas.

### B. Hangfire Background Server
- **Storage**: `Hangfire.Mongo` on the primary MongoDB connection string with prefix `hangfire`.
- **Worker Configuration**: WorkerCount = 4, listening on queues: `default` and `ai`.
- **Recurring Sweeps**:
  - `ClientBriefExpirationJob`: Minutely check transitioning expired briefs to `expired`.
  - `WorkroomConversionJob`: Minutely sweep converting accepted proposals into active `WorkroomEngagements`.
  - `WorkroomTimedRulesJob`: Minutely sweep auto-accepting deliverables past the client review deadline.

---

## 5. Storage & Production Infrastructure

### A. File Storage Security
- **Volume**: Docker volume `uploads-data` mounted at `/app/wwwroot/uploads`.
- **Deny Rule Middleware** (`Program.cs` line 727):
  - Inbound HTTP requests for `/uploads/documents/*` and `/uploads/identity/*` are intercepted and rejected with HTTP 404.
  - Workroom attachments must be downloaded via `GET /api/workroom/files/{id}/download`, enforcing JWT authentication and workroom participation checks.
  - KYC files are stored in isolated storage via `KycStorageService`.

### B. Production Deployment Topology
```
Internet ──► Traefik v2.11 (:80, :443 TLS)
                │
                ├─► Frontend (Next.js 16 via http://172.17.0.1:3000)
                │
                └─► API Replicas (api=1..N on :8080)
                        │
                        ├─► Redis 7 (Backplane, Cache, DataProtection)
                        ├─► MongoDB Atlas (78 Core Collections, 81 Total)
                        └─► Docker Volume uploads-data
```

---

## 6. Technical Risk Registry & Architectural Reality

1. **Payment Gateway Settlement**:
   - `StubPaymentGatewayService.cs` is the active DI registration for `IPaymentGatewayService`. Payment operations, escrow balances, and payout requests are modeled in application domain state; real monetary settlement requires configuring a production payment adapter (e.g. Stripe Connect).
2. **File Antivirus Scanner Stub**:
   - `StubFileSecurityScanner.cs` currently validates extensions and MIME types. An external scanning daemon (e.g. ClamAV) should be integrated for upload scanning.
3. **Universal Profile Authority & Role Data Segmentation**:
   - Universal public/professional profiles (`/dashboard/profile`, `/profile/[slug]`) for ALL roles (Creator, Entrepreneur, Investor, Service Provider) are read and written via `ProfessionalProfiles` (`ProfessionalProfileRecord`).
   - Role-specific operational data is segmented: Service Provider tiers/verification live in `ServiceProviderProfiles`, Entrepreneur company data lives in `Companies`, Investor thesis/portfolio data lives in `Investors`, while `ApplicationUser` embedded fields remain as legacy/identity records.
