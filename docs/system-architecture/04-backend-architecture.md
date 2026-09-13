# Mondial ECO — Backend Architecture & Service Ecosystem

The backend is an ASP.NET Core 8 Web API monolith running on Kestrel, engineered for stateless, horizontal scalability behind a reverse proxy (Traefik). It communicates with MongoDB Atlas as the primary persistence layer, Redis 7 as the distributed coordination and cache layer, and Hangfire for asynchronous background job execution.

---

## 1. Architectural Layers & Data Flow

```
[ HTTP Ingress / Reverse Proxy (Traefik) ]
                  │
                  ▼
[ Kestrel Web Server (.NET 8) ]
                  │
                  ▼
[ Middleware Pipeline ]
   1. ForwardedHeaders (RFC 1918 / Traefik CIDRs)
   2. CorrelationIdMiddleware (X-Correlation-ID tracing)
   3. ExceptionHandlingMiddleware (Global 500 -> ApiResponse envelope)
   4. SecurityHeadersMiddleware (HSTS, CSP, Sniff protection)
   5. SerilogRequestLogging (Correlation & principal context enrichment)
   6. ResponseCompression (Brotli & Gzip for JSON bodies)
   7. Cors ("AllowAll" with strict domain matching & exposed headers)
   8. UploadPathSecurityDeny (404s direct access to /uploads/documents & /uploads/identity)
   9. UseStaticFiles (Serves media/branding uploads from /app/wwwroot/uploads)
  10. RateLimiter (Partitioned by IP & User ID)
  11. UseAuthentication & UseAuthorization (JWT Bearer)
  12. Hangfire Dashboard (/hangfire with HangfireDashboardAuthorizationFilter)
                  │
                  ▼
[ API Controllers (51 Controllers, 579 Actions) ]
                  │
                  ▼
[ Domain Services & Business Logic Engines ]
   ├── CompanyService.cs (9-phase entrepreneur journey & deals)
   ├── CreatorIdeaService.cs & CreatorJourneyService.cs (Phases 2-6)
   ├── DiligenceService.cs (Data rooms & NDA tracking)
   ├── WorkroomService.cs (Milestones, deliverables & escrow)
   ├── LeadsService.cs & ServiceCatalogService.cs (SP acquisition)
   ├── ValuationEngine.cs & CapTableCalculator.cs
   ├── InvestorMatcher.cs & SmartMatchingService.cs
   └── AiJobService.cs & AiJobRunner.cs
                  │
                  ▼
[ Data Access Repositories & State Engines ]
   ├── MongoRepository<T> & Specialized Stores
   ├── MongoDbContext.cs (91 Collections)
   ├── Redis (Distributed Cache, DataProtection, Presence, SignalR Backplane)
   └── Hangfire.Mongo (Durable queues: 'default', 'ai')
                  │
                  ▼
[ Storage Infrastructure ]
   ├── MongoDB Atlas (ACID Transactions & Documents)
   ├── Redis 7 (In-Memory Key/Value & Pub/Sub)
   └── Docker Volume `uploads-data` (/app/wwwroot/uploads)
```

---

## 2. Controller & Service Organization

### Core Domain Controllers
1. **Entrepreneur & Venture Journey**:
   - `CompanyController.cs` (105 endpoints): End-to-end company operations, 9-phase onboarding advancement, traction KPIs, pitch decks, Cap Table management, valuation requests, and investor matching.
   - `DealsController.cs` (79 endpoints): Full lifecycle management for `FULL_BUYOUT`, `EQUITY_PARTNERSHIP`, and `INVESTMENT_ROUND` deals. Manages term sheet revisions, bilateral electronic signatures, legal review checks, escrow/closing, and post-deal company conversions.
2. **Creator & Idea Incubation**:
   - `CreatorController.cs`, `CreatorIdeasController.cs`, `CreatorJourneyController.cs`, and `CreatorPhase2..6Controller.cs` (63 endpoints combined): Multi-idea lifecycle, AI Clarifier triggers, brand asset generation, business plan authoring, financial forecasting, IP valuation, and Crossroads exit routing.
3. **Investor Operations**:
   - `InvestorController.cs`, `InvestorPhaseController.cs`, and `InvestorDiligenceController.cs` (35 endpoints combined): Investor thesis formulation, incoming match triage, data room diligence questions, term sheet submission, active deal pipeline kanban, and portfolio holding tracking.
4. **Service Provider Marketplace & Workroom**:
   - `ServiceProviderController.cs`, `ServiceCatalogController.cs`, `LeadsController.cs`, `WorkroomController.cs`, and `EarningsController.cs` (100 endpoints combined): Credential submission, catalog listings and packages, client briefs, custom proposals, escrow milestones, deliverable submissions, client revision requests, invoices, and payout processing.
5. **Platform Administration & Security**:
   - `AdminController.cs`, `AdminCommerceController.cs`, `AdminComplianceController.cs`, `AdminSecurityController.cs`, `AdminSystemController.cs`, `AdminAuditController.cs` (71 endpoints combined): KYC verification approvals, marketplace listing moderation, platform fee settings, content reports, compliance cases, data retention policies, and background queue oversight.
6. **AI Subsystem**:
   - `AiController.cs`, `ClarifierController.cs`, `BusinessPlanController.cs`, `ForecastController.cs`, `IdeaGeneratorController.cs` (22 endpoints): Session initialization, prompt assembly, OpenRouter dispatching, credit balance deduction, and insight persistence.

---

## 3. Real-Time Communication & Hubs

- **Transport**: WebSockets / Server-Sent Events with fallback to Long Polling via ASP.NET Core SignalR.
- **Backplane**: `AddStackExchangeRedis` using prefix `MondialSignalR`. Guarantees message delivery across multiple horizontal API instances.
- **Serialization Contract**:
  - `options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;`
  - Explicitly pinned so all JSON payloads delivered over WebSockets match the frontend REST models exactly.
- **Registered Hubs**:
  1. `NotificationHub` (`/hubs/notifications`): Dispatches real-time badge updates, deal offer alerts, KYC status updates, and AI generation completion events to individual user groups (`user_{userId}`).
  2. `ChatHub` (`/hubs/chat`): Powers direct conversation threads between Creators, Entrepreneurs, Investors, and Service Providers, with online presence tracked via `RedisPresenceTracker`.

---

## 4. Background Job Engine & Queues

- **Engine**: Hangfire (`1.8.14`) backed by MongoDB (`Hangfire.Mongo 1.10.9`).
- **Queues**:
  - `default`: General tasks (email dispatching, lead expiration, workroom sweeps).
  - `ai`: Dedicated worker queue for LLM generation jobs, isolating long-running AI tasks from transactional background duties.
- **Recurring Jobs**:
  - `module3-expire-client-briefs` (`ClientBriefExpirationJob`): Minutely sweep evaluating `ClientBriefs` past `ExpiresAt`.
  - `module4-convert-accepted-proposals` (`WorkroomConversionJob`): Minutely sweep converting accepted proposals into active `WorkroomEngagements`.
  - `module4-workroom-timed-rules` (`WorkroomTimedRulesJob`): Minutely auto-acceptance of deliverables when client review deadlines elapse without feedback.

---

## 5. Observability & Health Probes

- **Logging**: Serilog console JSON sink with properties: `Application: MondialBackend`, `Environment`, `CorrelationId`, `UserId`.
- **Metrics**: OpenTelemetry runtime instrumentation exporting to Prometheus at `/metrics` (restricted at reverse proxy).
- **Health Checks**:
  - `/health/live`: Unconditional 200 indicating the ASP.NET Core process is responsive.
  - `/health/ready`: Dependent check verifying that both MongoDB Atlas and Redis are reachable. Used by Traefik load balancer to remove failing nodes before routing traffic.
