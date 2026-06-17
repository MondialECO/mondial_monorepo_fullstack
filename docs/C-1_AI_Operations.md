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
| `Ai:ModelRouting:Models` | appsettings | task-type → model id. `Probe` routes to a **free** model (`openai/gpt-oss-20b:free`) so the self-test runs at $0 balance. |
| `Ai:CreditCosts` | appsettings | per-type credit cost; `Probe = 0` (free). |
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

## 4. Credits

- Per-user balance in `AICredits` (one doc per user, unique `OwnerUserId`).
- `POST /api/ai/jobs` debits the configured cost atomically (`Balance >= cost`)
  before enqueue; insufficient balance → **402**. Cost-0 jobs (Probe) are free
  and never touch the ledger.
- **Starter-credit backfill (optional, config-gated):** set
  `Ai:GrantStarterCreditsToExisting = true` and `Ai:StarterCredits = <n>`. On
  the next boot every existing user **without** a ledger is granted `<n>`
  credits. Idempotent (upsert with `$setOnInsert`) — existing balances are never
  touched, safe to leave on. Off by default.

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
