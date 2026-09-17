# C-1 AI Infrastructure — Operations & Rollout

Operational runbook for the C-1 AI layer (provider, durable jobs, persistence,
prompts, notifications, API). Covers config/secrets rollout, the Hangfire
dashboard, health, credits, observability and failure behaviour.

---

## 1. Environment rollout (required before deploy)

| Key | Where | Notes |
|---|---|---|
| `OpenRouter__ApiKey` | env var / user-secrets | **Required.** `StartupConfigValidation` fails fast if absent — the app refuses to boot. |
| `OpenRouter:BaseUrl` | appsettings | Default `https://openrouter.ai/api/v1`. |
| `Ai:ModelRouting:Models` | appsettings | task-type → model id (`IModelRouter`). All tasks route to `google/gemini-3.8-flash` with zero hardcoded model fallbacks in application code. Tasks include `Probe`, `IdeaClarifier`, `BusinessPlan`, `Forecast`, `DirectionGeneration`, `LogoParameterSelection`, `ColorGeneration`, `TypographyGeneration`. |
| `Ai:CreditCosts` | appsettings | per-type credit cost config: `DirectionGeneration=7`, `LogoParameterSelection=4`, `LogoConceptRegenerate=0`, `ColorGeneration=2`, `TypographyGeneration=2`, `IdeaClarifier=20`, `MarketStudy=20`, `BusinessModel=18`, `BusinessPlan=33`, `Forecast=32`, `Probe=0`. |
| `Ai:OutputTokenLimits` | appsettings | per-type max output token ceilings (`IOptions<AiSettings>`): `IdeaGenerator=3500`, `IdeaClarifier=3500`, `MarketStudy=7500`, `BusinessModel=8500`, `BusinessPlan=7500`, `Forecast=8000`, `Probe=500`, `DirectionGeneration=4500`, `LogoParameterSelection=3000`, `ColorGeneration=4500`, `TypographyGeneration=2000`. Missing keys safely degrade to handler-internal `DefaultMaxOutputTokens` constants rather than 0 or unbounded requests. |
| `Hangfire:WorkerCount` | appsettings | bounded worker count (default 4). |
| `Ai:Enabled` | appsettings | master kill-switch for enqueue (rollback without redeploy). |

Templates: `appsettings.Example.json` and `.env.example` document every key.
The key is a **secret** — never commit it; supply via `OpenRouter__ApiKey`
(env) or `dotnet user-secrets set "OpenRouter:ApiKey" "<key>"` locally.

Rollout order: set `OpenRouter__ApiKey` in the target environment **before**
deploying, or startup validation aborts the boot (intended fail-fast).

---

## 2. Hangfire dashboard

- Mounted at **`/hangfire`**, after authentication, restricted to the **Admin**
  role via `HangfireDashboardAuthorizationFilter` (checks `IsInRole("Admin")`).
- Unauthenticated / non-Admin requests are rejected (401); Admins get the UI.
- Two queues are processed: `default` (legacy jobs) and `ai` (AI jobs). AI jobs
  run on the `ai` queue; legacy `BackgroundJobService` jobs on `default`.
- Use the dashboard to inspect, retry, or drain queued jobs during incidents.

---

## 3. Durable jobs & failure behaviour

- One Hangfire job per AI request (`AIRequests`). The runner is idempotent: a
  request already `Completed` is a no-op (guards Hangfire at-least-once — no
  duplicate paid calls).
- Bounded retries (`[AutomaticRetry(Attempts = 2)]`) with backoff; OpenRouter
  transient errors (429/5xx) also retried at the HTTP layer (Polly). Retries are
  kept low to avoid compounding cost.
- **On failure the request is set `Failed` with the error, and NO partial
  `AIResponses`/`ModelUsage` is written** — those are persisted only after a
  successful provider call. A failure notification is fired so users aren't left
  polling.
- Status lifecycle: `Pending → Processing → Completed | Failed`.

---

## 4. Credits & Metering

- Per-user balance in `AICredits` / `AiCreditLedgers` (one doc per user, unique `OwnerUserId`).
- Single source of truth: `GET /api/ai/credits` returns balance, lifetime stats (`TotalGranted`, `TotalSpent`), and per-capability cost table.
- Enqueue debits the configured cost atomically (`Balance >= cost`) before dispatch; insufficient balance → **402**. Cost-0 jobs (Probe, IdeaGenerator, LogoConceptRegenerate) are free and never touch the ledger.
- **Automatic Refunds & Zero-Unfair-Debit:**
  - Any job failing in Hangfire or returning unparseable output automatically refunds the debited credits (`Balance += amount`).
  - Gross spent accounting: `TotalSpent` remains immutable lifetime consumption history; refunds are recorded in a dedicated `Refunds` subdocument array with original `DebitOperationId`.
  - Deterministic timing: `AiJobRunner` applies the refund before transitioning the user session to `Failed`, eliminating timing races for client pollers.
- **Visibility:** Topbar `AiCreditBadge` renders real-time balance for Creator and Entrepreneur roles, invalidates immediately on mutation dispatch and session terminal state, updating dynamically without page reload.
- Full architectural details: see `docs/operations/ai-credit-metering-and-visibility.md`.
- **Starter-credit backfill (optional, config-gated):** set
  `Ai:GrantStarterCreditsToExisting = true` and `Ai:StarterCredits = <n>`. On
  the next boot every existing user **without** a ledger is granted `<n>`
  credits. Idempotent (upsert with `$setOnInsert`) — existing balances are never
  touched, safe to leave on. Off by default.

### 4.1 Brand Kit Studio Generative Metering & Per-Element Caps
- **Synchronous Debits:** Billed Brand Kit AI generative calls (`DirectionGeneration`: 7, `LogoParameterSelection`: 4, `ColorGeneration`: 2, `TypographyGeneration`: 2) are debited immediately before model execution in `CreatorBrandKitController`. Local SVG redraws (`LogoConceptRegenerate`: 0 credits) are unmetered and free. Billed operations are eligible for deduction against the starter credit grant (200 credits).
- **Per-Element Regenerate Cap (Max 3):** Direction candidate generation, single logo concept regeneration, colour palette regeneration, and typography regeneration each track an individual `RegenerateCount`. When `RegenerateCount >= 3`, the request halts with HTTP 400 and **0 credits debited**.
- **Hub Reset (`POST open-studio`):** Entering the visual identity studio hub resets all section regenerate counters to 0 (`Direction.RegenerateCount = 0`, `Logo.Concepts[i].RegenerateCount = 0`, `Colors.RegenerateCount = 0`, `Typography.RegenerateCount = 0`). Section `PATCH` updates do not reset counters.
- **Compensating Refunds & Option A Failure Handling:** If an AI model call throws, times out, returns malformed parameters, or encounters an optimistic concurrency write conflict:
  1. The deterministic fallback generator is unreachable from billed paths (Option A).
  2. The exception propagates cleanly, returning an honest HTTP 500 error naming the failure.
  3. Upfront debited credits are refunded immediately via `RefundForJobAsync(userId, jobType, opId, reason)` with the matching `operationId`.
  4. The section's `RegenerateCount` is left untouched, preserving the user's quota.



---

## 5. Health & observability

- **Readiness** (`/health/ready`, tag `ready`): MongoDB + Redis + OpenRouter.
  The OpenRouter check is **config-only** by default (API key present + valid
  base URL — no network). Set `OpenRouter:EnableHealthCheckPing = true` to add a
  live authenticated `GET /key` ping.
- **Liveness** (`/health/live`): process up.
- **Tracing:** OpenTelemetry `AddHttpClientInstrumentation()` is on, so outbound
  OpenRouter calls emit HTTP client spans (`System.Net.Http`). Exported via OTLP
  when `OpenTelemetry:OtlpEndpoint` / `OTEL_EXPORTER_OTLP_ENDPOINT` is set.
- **Metrics:** `/metrics` (Prometheus).
- **Reasoning-token telemetry attribution:** Reasoning-share figures and token breakdowns recorded in benchmarks and operational documentation were derived from manual capture of provider payloads rather than stored database telemetry. The `ModelUsage` schema will be expanded to persist reasoning tokens directly in a subsequent release.
- **Tracked failure modes (Malformed JSON):** Unterminated JSON strings and syntax malformations appeared in roughly ~8% of runs across all three capabilities. This is the largest remaining non-retryable failure mode (unaffected by output ceiling changes) and is tracked for separate prompt and parsing hardening.

---

## 6. Prompts

- In-code `PromptTemplate`s are seeded idempotently into `PromptVersions` on
  startup. Only the **active** version per key is resolvable for execution.
- C-1 ships the `probe` template only; modules add their own.

---

## 7. Rollback

- `Ai:Enabled = false` disables enqueue without a redeploy.
- The Hangfire dashboard can drain/delete queued jobs.
- All C-1 changes are additive (new collections/sections/endpoints); the only
  change to an existing entity is a new `Type = "AI"` value on notifications (no
  migration).

---

## 8. Failure Reconciliation & Audit System (Three-Tier Architecture)

To guarantee financial correctness, prevent silent loss of debited credits, and recover from unhandled runtime or process restarts, the platform implements a three-tier safety architecture:

### 8.1 Tier 1: Dedicated Critical Structured Logging (Active)
- Emits distinct, high-priority log events (`AiLogEvents`) whenever an automatic refund is skipped or a session cannot be transitioned:
  - `AiLogEvents.UnrefundedDebit` (EventId: `4001`) — Logged with `UserId`, `OperationId`, `RequestId`, `Amount`, and forensic evidence.
  - `AiLogEvents.SessionStatusMappingFailed` (EventId: `4002`) — Logged when an unexpected job type or session collection cannot be resolved.
  - `AiLogEvents.CriticalFailure` (EventId: `4003`) — Emitted on unhandled job runner failures.

### 8.2 Tier 2: Startup Reconciliation Service (Active in Report-Only Mode)
- **Hosted Service:** `AiStartupReconciliationService` executes on backend boot to inspect system state for discrepancies across all 6 AI session stores (`BusinessModelSessions`, `MarketStudySessions`, `BusinessPlanSessions`, `ForecastSessions`, `ClarifierSessions`, `IdeaGenerationSessions`) and `AIRequests`.
- **Evidence Hierarchy:**
  1. *Primary Signal:* Associated `AiRequest` reached a terminal status (`Failed` or `Completed`).
  2. *Secondary Signal:* Associated Hangfire job is demonstrably inactive/terminal via `JobStorage.MonitoringApi`.
  3. *Safety Constraint on Legacy Stale Rows:* Never guesses or flags orphans based on elapsed time alone when no terminal request signal or unrefunded debit damage is proven. Aged-out historical records are left untouched.
- **Positive Real-User Verification:** Only accounts passing positive real-user signals (verified email, verified phone, and an active `CreatorJourneys` record) are evaluated for user reconciliation, preventing test harness debris from polluting audits.
- **Audit Persistence:** Detected anomalies are written immutably to the `AiReconciliationAudits` MongoDB collection with `Source = "StartupReconciliation"` and full forensic evidence.
- **Operational Mode:** Shipped strictly in **Report-Only Mode** (`DryRun = true`). Zero automated ledger balance modifications or session transitions occur unsupervised.

### 8.3 Tier 3: Periodic Background Sweeps (Deliberately Deferred)
- **Status:** **Deliberately Deferred.**
- **Rationale:** A standing scheduled background sweep in non-production environments risks continuously processing synthetic test artifacts and mask real user telemetry. Tier 3 scheduled sweeps will be evaluated and configured prior to production rollout against verified production telemetry.
