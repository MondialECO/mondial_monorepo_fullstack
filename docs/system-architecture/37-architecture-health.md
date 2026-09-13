# Mondial ECO — Comprehensive Architecture Health Report

This assessment provides an objective architectural health audit for every functional domain across the platform. In accordance with architectural rules, **no application logic has been modified**.

---

## 1. Executive Health Scorecard

| Domain | Assessment Status | Primary Evidence & File Paths | Risk Rationale & Architectural Observations |
|---|---|---|---|
| **Authentication & RBAC** | **HEALTHY** | `src/app/_providers/AuthProvider.tsx`<br/>`backend/Controllers/AuthController.cs` | Strong multi-tab synchronization, IP-based rate limiting (5 req/min), HMAC-256 JWT validation, and 30s clock skew. |
| **Universal Phase 1 Gate**| **HEALTHY** | `src/components/layout/AuthGuard.tsx`<br/>`backend/Controllers/OnboardingController.cs` | Universal gating guarantees Phase 0 users cannot access dashboards before completing certified onboarding. |
| **Creator System (1–6)** | **HEALTHY** | `backend/Services/Implementations/CreatorIdeaService.cs`<br/>`backend/DbContext/MongoDbContext.cs` | Multi-idea foundation is cleanly anchored with session references; derived journey statuses eliminate desync bugs. |
| **Entrepreneur Venture (2–10)**| **HEALTHY** | `backend/Services/CompanyService.cs`<br/>`backend/Services/Implementations/CapTableCalculator.cs` | 9-phase onboarding and post-deal Cap Table mathematical calculations are thoroughly unit-tested. |
| **Investor Pipeline & Diligence**| **HEALTHY** | `backend/Services/CompanyService.cs`<br/>`backend/Models/DatabaseModels/InvestorDiligenceModels.cs` | Strict NDA gating enforced in DiligenceService before data room access is granted. |
| **Service Provider Platform**| **HEALTHY** | `backend/Services/Implementations/WorkroomService.cs`<br/>`backend/DbContext/MongoDbContext.cs` | Profile split migration separates SP data into root collections; workroom state machine governs escrow and reviews. |
| **Payment Gateway** | **PARTIAL / STUB** | `backend/Services/Implementations/StubPaymentGatewayService.cs` | Workroom transactions currently execute through an in-memory stub; production Stripe/SEPA gateway adapter must be wired prior to public commercial launch. |
| **Antivirus / File Security**| **PARTIAL / STUB** | `backend/Services/Implementations/StubFileSecurityScanner.cs` | File scanner performs MIME checks via stub; full ClamAV or external virus scanning daemon is not yet connected. |
| **Deals & Negotiation Engine**| **HEALTHY** | `backend/Controllers/DealsController.cs`<br/>`backend/Services/Implementations/Phase9Requirements.cs` | Comprehensive state machines for Full Buyout, Co-Founder Equity, and Funding rounds with bilateral signing checks. |
| **Universal Profile** | **PARTIAL (TRANSITIONAL)**| `backend/DbContext/MongoDbContext.cs` line 240 | SP profiles have migrated to split root collections; Creator, Entrepreneur, and Investor profiles remain embedded on `ApplicationUser`. |
| **Realtime Messaging** | **HEALTHY** | `backend/Hubs/ChatHub.cs`<br/>`backend/Services/Implementations/RedisPresenceTracker.cs` | SignalR with Redis backplane and camelCase JSON protocol pin ensures cross-replica delivery without casing drift. |
| **Realtime Notifications**| **HEALTHY** | `backend/Hubs/NotificationHub.cs`<br/>`backend/Services/NotificationService.cs` | Dedicated per-user SignalR groups, offline email queuing, and unread receipt counts. |
| **AI Subsystem** | **HEALTHY** | `backend/Services/Ai/Jobs/AiJobRunner.cs`<br/>`backend/Configuration/AiOptions/OpenRouterSettings.cs` | Asynchronous Hangfire worker queue (`ai`), Polly retry policies, in-code prompt seeding, and credit deduction. |
| **File Storage & Security**| **HEALTHY** | `backend/Program.cs` line 727<br/>`backend/docker-compose.yml` | Deny rule blocks direct static web access to `/uploads/documents` and `/uploads/identity`, routing sensitive files through authorized download endpoints. |
| **Production Deployment** | **HEALTHY** | `backend/docker-compose.yml`<br/>`backend/traefik-dynamic.yml` | Traefik v2.11 provides automatic Let's Encrypt TLS, HTTP->HTTPS redirects, readiness probes, and `/metrics` IP allowlisting. |

---

## 2. Priority Risk Analysis

### P0 (Critical Launch Blockers)
*None*. All foundational authentication, multi-idea data persistence, authorization guards, and database schemas are structurally sound and verified.

### P1 (Pre-Commercial Requirements)
- **Real Payment Gateway Integration**:
  - *Evidence*: `backend/Services/Implementations/StubPaymentGatewayService.cs`
  - *Impact*: Real credit card or SEPA transactions cannot be captured until a live payment gateway (e.g. Stripe) is integrated.
- **Production Antivirus Daemon**:
  - *Evidence*: `backend/Services/Implementations/StubFileSecurityScanner.cs`
  - *Impact*: Client-uploaded workroom and onboarding PDFs are validated for extension and MIME type, but not scanned with signature-based antivirus definitions.

### P2 (Architectural Optimization & Tech Debt)
- **Profile Split Migration Phase 2**:
  - *Evidence*: `backend/DbContext/MongoDbContext.cs` lines 238–244
  - *Impact*: Having Service Provider profiles in root collections while Creator and Investor profiles remain embedded on `applicationUsers` introduces dual-read paths. A future migration should unify all roles into `ProfessionalProfiles`.
- **Private File Path Isolation**:
  - *Evidence*: `backend/Program.cs` lines 723–727
  - *Impact*: Workroom and identity documents reside inside `wwwroot/uploads` and rely on a middleware deny rule to prevent static serving. Moving these files completely outside `wwwroot` eliminates reliance on middleware execution order.

### P3 (Low Severity Maintenance)
- **Retire Deprecated Stubs**:
  - Clean up `SubmmitdataRepository.cs` and the empty `frontend/` directory once CI/CD configurations exclusively target the root repository.
