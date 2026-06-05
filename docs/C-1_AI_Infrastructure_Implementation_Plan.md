# C-1 — AI Infrastructure: File-Level Implementation Plan

> Scope: foundational AI layer only. C-2 (Idea Clarifier), C-3 (Business Plan), C-4 (Forecast)
> plug into this. C-1 ships NO module-specific prompt logic — only the provider client,
> prompt framework scaffold, durable job engine, persistence, notification/realtime wiring,
> config/secrets, and read endpoints (usage/insights).
>
> Locked decisions: Provider = OpenRouter · Job Engine = Hangfire (Mongo storage) ·
> Secrets = env vars · no scope reduction · no placeholders · no static mock AI outputs.

---

## SECTION A — Existing reusable infrastructure (audited, reuse as-is)

| Capability | Existing asset | How C-1 reuses it |
|---|---|---|
| Mongo client/db | `Program.cs` singletons `IMongoClient` / `IMongoDatabase` / `MongoDbContext` | AI repos take `IMongoDatabase` in ctor, identical to `NotificationRepository` |
| Repository base | `Services/Repository/MongoRepository<T>` (+ sync index creation in ctor via `CreateIndexesAsync().GetAwaiter().GetResult()`) | All AI repos inherit `MongoRepository<T>` |
| Entity/BSON convention | `Models/DatabaseModels/*` — `[BsonId] ObjectId` **or** `[BsonId][BsonRepresentation(ObjectId)] string`; `CreatedAt=DateTime.UtcNow` | AI entities follow same; standardize on `string` id (matches `BusinessIdeas`) |
| DI module pattern | `Extensions/ServiceCollectionExtensions.cs` → `AddCompanyServices(config)`, called once in `Program.cs:311` | New `AddAiServices(config)` extension, mirror exactly |
| Notifications (persist + dual-path) | `INotificationService` / `NotificationService` (`CreateNotification`, `NotifyUser`) | Job-completion handler calls `NotifyUser(userId, title, body)` |
| Realtime push | `IHubContext<NotificationHub>` + per-user groups (`Clients.Group(userId).SendAsync(...)`); `DealEventPublisher` is the canonical publisher pattern | AI emits `AiJobUpdate` / `AiJobCompleted` events to `Group(ownerUserId)` |
| Presence | `IPresenceTracker.IsOnlineAsync` (Redis / in-memory fallback) | Already used inside `NotifyUser`; no new work |
| Config binding | `IOptions<T>` + `builder.Services.Configure<T>(section)` (`MongoDbSettings`, `VapidSettings`) | `OpenRouterSettings`, `AiSettings` |
| Secrets fail-fast | `Configuration/StartupConfigValidation.cs` → `ValidateRequiredConfiguration()` (`Program.cs:53`) | Add `OpenRouter:ApiKey` requirement |
| HTTP instrumentation | OTel `AddHttpClientInstrumentation()` already on | Typed `OpenRouterClient` auto-traced |
| Response envelope | `Models/ApiResponse.cs` (`Ok` / `Error` + TraceId) | All AI endpoints wrap responses |
| Validation | FluentValidation + global `ValidationFilter`; auto-registered via `AddValidatorsFromAssemblyContaining<>` | AI request DTO validators auto-discovered |
| Current user | `User.FindFirst(ClaimTypes.NameIdentifier)` → `Guid` (sub is remapped) | AI controllers use same accessor |
| Rate limiting | `[EnableRateLimiting("auth")]` + global limiter | New `"ai"` credit-aware policy |
| Async-worker precedent | `IEmailQueue` + `EmailBackgroundService` (Channel + IHostedService) | Conceptual model; Hangfire replaces durability gap |
| Prior job stub (to supersede) | `IBackgroundJobService` / `BackgroundJobService` (in-memory `Dictionary`, `Task.Run`, comment "in production use Hangfire") + `BackgroundJobController` | Re-implement backing on Hangfire; keep interface where possible |
| Existing AI review hook | `IAiReviewEngine` / `AiReviewEngine` (company onboarding) | Note only — separate concern; do NOT fold into C-1 |

**Gaps C-1 must fill:** Hangfire (not referenced anywhere), OpenRouter typed client (no `IHttpClientFactory`/Polly today), AI persistence collections, prompt-versioning store, AI job abstraction.

---

## SECTION B — Files to create

### B.1 Configuration / settings
| File | Purpose |
|---|---|
| `backend/Configuration/AiOptions/OpenRouterSettings.cs` | `ApiKey`, `BaseUrl` (default `https://openrouter.ai/api/v1`), `HttpReferer`, `AppTitle`, `TimeoutSeconds`, `MaxRetries` |
| `backend/Configuration/AiOptions/AiSettings.cs` | Model routing map (task→model), default credit costs, regeneration limits, cache TTL, feature flags (Clarifier/BusinessPlan/Forecast = enabled) |
| `backend/Configuration/AiOptions/ModelRoutingSettings.cs` | `Dictionary<string,string>` task-type → OpenRouter model id (OpenAI for structured/plan/finance; Anthropic for reasoning/long-context) |

### B.2 OpenRouter provider (typed client + abstraction)
| File | Purpose |
|---|---|
| `backend/Services/Ai/Providers/IAiProvider.cs` | Provider-agnostic contract: `Task<AiCompletion> CompleteAsync(AiCompletionRequest, CancellationToken)` (returns text + token usage + model + cost) |
| `backend/Services/Ai/Providers/OpenRouterClient.cs` | Typed `HttpClient` impl of `IAiProvider`; builds chat-completions payload, sets `Authorization`/`HTTP-Referer`/`X-Title` headers, parses usage, maps errors |
| `backend/Services/Ai/Providers/OpenRouterDtos.cs` | Request/response DTOs for OpenRouter `/chat/completions` (messages, model, usage block) |
| `backend/Services/Ai/Providers/IModelRouter.cs` + `ModelRouter.cs` | Resolves model id from task type via `ModelRoutingSettings` |
| `backend/Services/Ai/AiException.cs` | `AiProviderException`, `InsufficientCreditsException`, `AiRateLimitException` |

### B.3 Prompt framework (versioned, layered)
| File | Purpose |
|---|---|
| `backend/Services/Ai/Prompts/IPromptBuilder.cs` + `PromptBuilder.cs` | Assembles the 5 layers (System · Product Context · User Context · Task · Output Formatter) into a message list |
| `backend/Services/Ai/Prompts/PromptTemplate.cs` | In-code template descriptor: `Key`, `Version`, `SystemText`, `OutputContract` |
| `backend/Services/Ai/Prompts/IPromptVersionStore.cs` + `PromptVersionStore.cs` | Persists/reads active `PromptVersions` doc per template key; seeds version on first run |
| `backend/Services/Ai/Prompts/ProductContext.cs` | Static Mondial product-context layer text (single source) |
| `backend/Services/Ai/Prompts/SafetyRules.cs` | AI safety clauses (no financial/legal/valuation guarantees, uncertainty) injected into every system prompt |

### B.4 AI job engine (Hangfire-backed, generic)
| File | Purpose |
|---|---|
| `backend/Services/Ai/Jobs/IAiJobService.cs` | `Enqueue(AiJobType, ownerUserId, inputPayload)` → jobId; `GetStatus(jobId, userId)`; ownership-scoped |
| `backend/Services/Ai/Jobs/AiJobService.cs` | Persists an `AIRequests` doc, calls `BackgroundJob.Enqueue(() => runner.Run(jobId))`, returns id |
| `backend/Services/Ai/Jobs/IAiJobRunner.cs` + `AiJobRunner.cs` | Hangfire entrypoint: loads request → resolves handler by type → builds prompt → calls provider → persists `AIResponses` + `ModelUsage` → updates status → fires notification/realtime. **C-2/3/4 register handlers, not new jobs.** |
| `backend/Services/Ai/Jobs/IAiTaskHandler.cs` | Strategy interface each module implements (`AiJobType Type`, `Task<AiHandlerResult> HandleAsync(AiRequest, ...)`). C-1 ships the registry + a `NoOpProbeHandler` for health/self-test only |
| `backend/Services/Ai/Jobs/AiTaskHandlerRegistry.cs` | Resolves `IAiTaskHandler` by `AiJobType` from DI |
| `backend/Services/Ai/Jobs/AiJobType.cs` | Enum: `IdeaClarifier`, `BusinessPlan`, `Forecast`, `Probe` (probe only is live in C-1) |
| `backend/Services/Ai/Jobs/AiJobCompletionHandler.cs` | On terminal state: `INotificationService.NotifyUser` + `IHubContext<NotificationHub>` `AiJobCompleted` event |

### B.5 Persistence — entities + repositories (collections in Section D)
| File | Entity / repo |
|---|---|
| `backend/Models/DatabaseModels/Ai/AiRequest.cs` + `Services/Repository/Ai/AiRequestRepository.cs` | `AIRequests` |
| `backend/Models/DatabaseModels/Ai/AiResponse.cs` + `.../AiResponseRepository.cs` | `AIResponses` |
| `backend/Models/DatabaseModels/Ai/PromptVersion.cs` + `.../PromptVersionRepository.cs` | `PromptVersions` |
| `backend/Models/DatabaseModels/Ai/AiModelUsage.cs` + `.../AiModelUsageRepository.cs` | `ModelUsage` (token/cost ledger) |
| `backend/Models/DatabaseModels/Ai/AiFeedback.cs` + `.../AiFeedbackRepository.cs` | `AIFeedback` |
| `backend/Models/DatabaseModels/Ai/AiInsight.cs` + `.../AiInsightRepository.cs` | `AIInsights` |
| `backend/Models/DatabaseModels/Ai/AiCreditLedger.cs` + `.../AiCreditLedgerRepository.cs` | `AICredits` (balance + debits; gates regenerations) |

### B.6 Application service + DTOs
| File | Purpose |
|---|---|
| `backend/Services/Ai/IAiUsageService.cs` + `AiUsageService.cs` | Aggregates `ModelUsage`/`AICredits` for `GET /ai/usage`; reads `AIInsights` for `GET /ai/insights` |
| `backend/Models/Dtos/Ai/AiJobStatusDto.cs`, `AiUsageDto.cs`, `AiInsightDto.cs`, `EnqueueAiJobRequest.cs`, `AiFeedbackRequest.cs` | API contracts |
| `backend/Validation/Ai/AiRequestValidators.cs` | FluentValidation for the DTOs above |

### B.7 Controller + DI wiring
| File | Purpose |
|---|---|
| `backend/Controllers/AiController.cs` | C-1 endpoints only (Section E): `POST /ai/jobs`, `GET /ai/jobs/{id}`, `GET /ai/usage`, `GET /ai/insights`, `POST /ai/feedback`. Module routes (clarifier/business-plan/forecast) land in C-2/3/4 |
| `backend/Extensions/AiServiceCollectionExtensions.cs` | `AddAiServices(config)` — Configure settings, typed `HttpClient<IAiProvider,OpenRouterClient>` (+ Polly), Hangfire + Mongo storage + server, all repos/services/handlers/registry |
| `backend/HealthChecks/OpenRouterHealthCheck.cs` | Optional readiness probe (config present + cheap auth ping), tag `ready` opt-in via flag |

---

## SECTION C — Files to modify

| File | Change |
|---|---|
| `backend/WebApp.csproj` | Add `Hangfire.AspNetCore`, `Hangfire.Mongo`, `Microsoft.Extensions.Http.Polly` (or `Microsoft.Extensions.Http.Resilience`). No version bumps elsewhere |
| `backend/Program.cs` | (1) `builder.Services.AddAiServices(builder.Configuration);` next to `AddCompanyServices` (~L311). (2) `app.UseHangfireDashboard("/hangfire", ...)` Admin-authorized + `DisableRequestTimeout` style exclusion. (3) Replace/back the existing `BackgroundJobService` registration if re-pointed at Hangfire (decide in Phase 0) |
| `backend/Configuration/StartupConfigValidation.cs` | Add `Require("OpenRouter:ApiKey");` + optional length sanity check |
| `backend/appsettings.json` | Add non-secret `OpenRouter` (BaseUrl only), `Ai` (routing map, credit costs, limits), `Hangfire` (queue/worker counts) sections — **no keys** |
| `backend/appsettings.Example.json` | Document `OpenRouter:ApiKey` placeholder + full `Ai` section |
| `backend/.env.example` | Add `OpenRouter__ApiKey=` (and any `Ai__*` overrides) |
| `backend/DbContext/MongoDbContext.cs` | Optional: expose AI collections as properties for parity (repos can also self-resolve) |
| `backend/Services/Implementations/BackgroundJobService.cs` | **DECIDED — adapter approach.** Keep `IBackgroundJobService` interface + `BackgroundJobController` contracts unchanged. Replace the in-memory `Dictionary`/`Task.Run` body with Hangfire enqueue so existing AI Review + Investor Matching callers keep working through the same interface but gain durability/retries/monitoring. No second job abstraction; no platform-wide cleanup in C-1 |
| `backend/Controllers/BackgroundJobController.cs` | Unchanged contract; status reads now backed by Hangfire/`AIRequests` instead of in-memory cache |

---

## SECTION D — Database collections

All entities follow audited convention: `[BsonId][BsonRepresentation(BsonType.ObjectId)] string Id`, `[BsonElement(...)]` on fields, `CreatedAt=DateTime.UtcNow`, `UpdatedAt`. Indexes created in repo ctor (`CreateIndexesAsync().GetAwaiter().GetResult()`), matching `NotificationRepository`/`BusinessIdeasRepository`.

| Collection | Key fields | Indexes |
|---|---|---|
| `AIRequests` | `OwnerUserId`, `JobType`, `Status` (Pending/Processing/Completed/Failed), `InputPayload` (Bson doc), `PromptKey`+`PromptVersion`, `HangfireJobId`, `CreatedAt`, `UpdatedAt` | `OwnerUserId+CreatedAt(desc)`; `Status`; `HangfireJobId` |
| `AIResponses` | `RequestId`, `OwnerUserId`, `Model`, `OutputPayload`, `RawText`, `TokenUsage` (prompt/completion/total), `FinishReason`, `Version`, `CreatedAt` | `RequestId`; `OwnerUserId+CreatedAt(desc)` |
| `PromptVersions` | `Key`, `Version`, `SystemText`, `OutputContract`, `IsActive`, `CreatedAt` | unique `Key+Version`; partial `Key` where `IsActive=true` |
| `ModelUsage` | `OwnerUserId`, `RequestId`, `Model`, `PromptTokens`, `CompletionTokens`, `TotalTokens`, `EstimatedCost`, `TaskType`, `CreatedAt` | `OwnerUserId+CreatedAt(desc)`; `Model+CreatedAt` |
| `AIFeedback` | `OwnerUserId`, `ResponseId`, `Rating` (1–5/up-down), `Comment`, `CreatedAt` | `ResponseId`; `OwnerUserId+CreatedAt(desc)` |
| `AIInsights` | `OwnerUserId`, `Type`, `Payload`, `SourceRequestId`, `CreatedAt` | `OwnerUserId+Type+CreatedAt(desc)` |
| `AICredits` | `OwnerUserId` (unique), `Balance`, `LifetimeGranted`, `LifetimeSpent`, debit sub-docs/`UpdatedAt` | unique `OwnerUserId` |
| Hangfire (`hangfire.*`) | auto-created by `Hangfire.Mongo` (jobs, locks, schema, server, set/list/hash/counter) | managed by the library |

Audit/soft-delete: include `OwnerUserId` for ownership scoping on every query (matches `NotificationRepository.MarkAsRead(id, userId)`); no global `isDeleted` since the codebase doesn't use one — terminal status is tracked via `Status`.

---

## SECTION E — API endpoints (C-1 scope)

Convention: `[Route("api/[controller]")]`, `[ApiController]`, `[Authorize]`; responses wrapped in `ApiResponse`; user id from `ClaimTypes.NameIdentifier`. Versioning stays header/query-driven (global config) — no `/v1/` in routes.

| Method + route | Purpose | Notes |
|---|---|---|
| `POST /api/ai/jobs` | Generic enqueue (`EnqueueAiJobRequest{ JobType, Input }`) → `{ jobId }` | `[EnableRateLimiting("ai")]`; validates job type is enabled; debits credit; in C-1 only `Probe` executes end-to-end |
| `GET /api/ai/jobs/{id}` | Poll status + progress + metadata; **when complete, inline result payload** | Ownership-scoped (404 if not owner). Backend hydrates the result by loading the persisted `AIResponses` doc — single fetch, no response-id round-trip exposed to frontend |
| `GET /api/ai/usage` | Token/credit/cost summary for current user | From `ModelUsage` + `AICredits` |
| `GET /api/ai/insights` | Current user's `AIInsights` (paged) | |
| `POST /api/ai/feedback` | Submit `AIFeedback` for a response | Ownership-checked against `AIResponses` |
| `GET /hangfire` (dashboard) | Ops job monitoring | Admin-only authorization filter |

> Module endpoints `POST /ai/idea-clarifier`, `/ai/business-plan`, `/ai/forecast` are defined by C-2/C-3/C-4. They will thin-wrap `IAiJobService.Enqueue(<type>, ...)` — the controller skeleton + DTO/validator conventions are established here so those tasks only add a handler + route.

Realtime completion (below) means clients may either poll `GET /ai/jobs/{id}` or subscribe to the hub event — both supported.

---

## SECTION F — Hangfire jobs

- **Storage:** `Hangfire.Mongo` on the existing Mongo connection (reuse `MongoDbSettings`), dedicated prefix (e.g. `hangfire`) in the same database. Registered inside `AddAiServices`.
- **Server:** `AddHangfireServer` with bounded `WorkerCount` (from `Hangfire:WorkerCount`, default small — AI calls are I/O-bound and rate-limited) and a dedicated queue `ai`.
- **Enqueue pattern:** `BackgroundJob.Enqueue<IAiJobRunner>(r => r.RunAsync(requestId))` — one durable job per AI request. The runner is the single Hangfire entrypoint; module logic lives in `IAiTaskHandler` strategies, NOT in separate Hangfire methods.
- **Retries:** `[AutomaticRetry(Attempts = N)]` on the runner with backoff; on final failure → request `Status=Failed`, persist error, fire failure notification. OpenRouter transient errors also retried at the HTTP layer (Polly) — keep Hangfire retries low to avoid compounding cost.
- **Idempotency:** runner checks request `Status`; if already `Completed`, no-op (guards Hangfire at-least-once delivery — prevents duplicate paid AI calls).
- **Recurring jobs (C-1):** optional `RecurringJob` for daily `ModelUsage` rollups / stale-`Processing` reaper. Keep minimal; log anything skipped.
- **Dashboard:** `/hangfire` mapped with Admin auth filter, excluded from request-timeout middleware.
- **Adapter for existing jobs (decided):** `IBackgroundJobService` is re-implemented over Hangfire (interface + `BackgroundJobController` contract preserved). Existing AI Review / Investor Matching / Data Room / Financial Projections enqueues route through the same Hangfire infrastructure — one job system, durable + retried + dashboard-visible. No parallel abstraction introduced.

---

## SECTION G — Notification integration

Reuse `INotificationService` unchanged. On terminal job state, `AiJobCompletionHandler` calls:

```
await _notificationService.NotifyUser(
    ownerUserId,
    title: "AI job complete" / "AI job failed",
    body:  "<job type> finished" );
```

`NotifyUser` already: (1) persists a `Notification`, (2) pushes SignalR `ReceiveNotification` if online, (3) falls back to Web Push when offline. No changes to `NotificationService`, `NotificationRepository`, `WebPushService`, or presence required. Notification `Type` extended with an `"AI"` value (string field — no migration). Failure notifications use the same path with a failure title so users aren't left polling.

---

## SECTION H — Realtime integration

- Reuse `IHubContext<NotificationHub>` + per-user groups (group name = user GUID, joined in `NotificationHub.OnConnectedAsync`). No new hub.
- `AiJobCompletionHandler` emits, in addition to the notification:
  - `AiJobUpdate` — `{ jobId, status }` on transitions (Processing → Completed/Failed) so a watching client updates live.
  - `AiJobCompleted` — `{ jobId, jobType, status, resultSummary }` on success.
- Follow the `DealEventPublisher` pattern (`Clients.Group(uid).SendAsync(eventName, payload)`); optionally add a small `IAiEventPublisher` wrapper for testability, mirroring `IDealEventPublisher`.
- SignalR auth/user-id already wired (`CustomUserIdProvider`, JWT `sub`→`NameIdentifier`, `/hubs/notifications` mapped with `DisableRequestTimeout`). Frontend subscribes on the existing notifications hub — no new endpoint.

---

## SECTION I — Migration strategy

- **Schema:** MongoDB document-first — collections materialize on first insert. No DDL migration. Indexes created idempotently in repo constructors (existing convention), so first app start after deploy provisions them.
- **Hangfire schema:** `Hangfire.Mongo` auto-migrates its own collections on first server start; pin `MigrationStrategy` to `Migrate` and `BackupStrategy` appropriately so an upgrade doesn't drop job state.
- **Prompt seeding:** on startup (in the existing `Program.cs` seed scope), `PromptVersionStore` upserts each in-code `PromptTemplate` as an active `PromptVersions` doc if absent — idempotent, mirrors the role/onboarding backfill already in `Program.cs`.
- **Credit backfill:** optional idempotent grant of starter `AICredits` to existing users (Phase pattern like the Onboarding backfill: only touch users with no `AICredits` doc). Gate behind config flag; `log()` count.
- **Config rollout:** `OpenRouter:ApiKey` must exist in the target env BEFORE deploy or `ValidateRequiredConfiguration` fails fast (intended). Document in `appsettings.Example.json` + `.env.example`.
- **Backward compatibility:** all additions are new collections/sections/endpoints; zero changes to existing entities except a new string `Type="AI"` value on notifications (no migration). No existing route or contract changes.
- **Rollback:** feature flags (`Ai:Enabled`, per-module flags) allow disabling enqueue without redeploy; Hangfire dashboard allows draining/deleting queued jobs.

---

## SECTION J — Verification plan

**Build/static**
- `dotnet build` clean; no new analyzer warnings. New packages restore (`Hangfire.AspNetCore`, `Hangfire.Mongo`, Polly).
- `ValidateRequiredConfiguration` fails fast when `OpenRouter:ApiKey` absent (negative test).

**Unit tests** (mirror existing `tests/WebApp.Tests/Unit` layout)
- `ModelRouter` resolves correct model per task type; unknown type → default/throws.
- `PromptBuilder` emits the 5 layers in order incl. safety clause.
- `AiJobRunner` idempotency: second run on `Completed` request is a no-op (no provider call).
- `AiUsageService` aggregates `ModelUsage`/`AICredits` correctly.
- Credit gate: enqueue with zero balance → `InsufficientCreditsException`.
- `OpenRouterClient` against a mocked `HttpMessageHandler`: header construction, usage parsing, error mapping, Polly retry on transient 5xx/429.

**Integration tests** (`WebApplicationFactory<Program>` already supported)
- `POST /ai/jobs` (type `Probe`) → 200 `{ jobId }`; `GET /ai/jobs/{id}` transitions to `Completed`; ownership: other user → 404.
- `GET /ai/usage` / `GET /ai/insights` / `POST /ai/feedback` happy + auth-required paths.
- Validation: malformed DTO → `ApiResponse.Error` shape via `ValidationFilter`.
- Rate limit `"ai"` policy returns 429 envelope.

**End-to-end (manual, real provider — no mock outputs)**
- With a real `OpenRouter__ApiKey`, run a `Probe` job: confirm real completion text, `AIResponses` + `ModelUsage` persisted with real token counts, `Notification` created, `AiJobCompleted` received on the notifications hub (online) and Web Push (offline).
- Hangfire `/hangfire` dashboard reachable for Admin, 401/403 for others; job visible, retried on induced failure.

**Ops/observability**
- OTel traces show outbound OpenRouter HTTP spans.
- `/health/ready` still green (+ OpenRouter check if enabled).
- Induced provider 500 → job `Failed`, failure notification fired, error persisted, no partial `AIResponses`.

---

## SECTION K — Implementation phases

> Each phase is independently buildable/testable. No commits/implementation in this planning task.

- **Phase 0 — Skeleton + adapter.** Add NuGet packages; register Hangfire + Mongo storage + server. Re-implement `IBackgroundJobService` over Hangfire (adapter — keep interface + `BackgroundJobController` contract; existing AI Review / Investor Matching enqueues now durable). Create empty `AddAiServices` + folder structure. Wire `appsettings`/`.env.example` sections + `OpenRouter:ApiKey` validation. *Exit: builds, fails fast without key, existing job callers green on Hangfire.*
- **Phase 1 — Provider.** `IAiProvider`/`OpenRouterClient` (typed HttpClient + Polly), DTOs, `ModelRouter`, settings. Unit-tested against mocked handler. *Exit: can call OpenRouter from a test.*
- **Phase 2 — Persistence.** All 7 AI entities + repositories with indexes; expose via DI; optional `MongoDbContext` properties. *Exit: repos round-trip in integration tests.*
- **Phase 3 — Prompt framework.** `PromptBuilder`, `PromptTemplate`, `ProductContext`, `SafetyRules`, `PromptVersionStore` + startup seeding. *Exit: build a layered prompt + persisted active version.*
- **Phase 4 — Job engine.** Hangfire + Mongo storage + server + dashboard; `AiJobService`, `AiJobRunner`, handler registry, `AiJobType`, `NoOpProbeHandler`, idempotency + retries. *Exit: `Probe` job runs end-to-end, status persisted.*
- **Phase 5 — Notifications + realtime.** `AiJobCompletionHandler` + optional `IAiEventPublisher`; wire into runner terminal states. *Exit: completion notification + hub event + Web Push fallback verified.*
- **Phase 6 — API surface.** `AiController` (jobs/usage/insights/feedback), DTOs, validators, `"ai"` rate-limit policy, credit gating. *Exit: integration tests green.*
- **Phase 7 — Hardening & verification.** Full Section J pass: real-provider Probe e2e, dashboard auth, failure paths, OTel, health. Migration/backfill flags + docs. *Exit: C-1 ready; C-2/3/4 only add an `IAiTaskHandler` + a thin route.*

**Handoff contract for C-2/3/4:** implement `IAiTaskHandler` for the module's `AiJobType`, register it in `AddAiServices`, add a thin `POST` route delegating to `IAiJobService.Enqueue`, and provide the module's `PromptTemplate`. No infra changes required.



