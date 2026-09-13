# Creator stability testing

Creator transaction tests use the existing `ReplicaSetAppFixture`. It starts a
disposable single-node Mongo replica set and Redis through Testcontainers; no
developer, staging, or production database is used.

## Isolated authenticated browser E2E

`npm run test:e2e:creator` starts a disposable, isolated stack before running
the Creator Playwright suite:

```text
Playwright -> Next (localhost:3001) -> ASP.NET E2E API (localhost:5094)
                                      -> single-node Mongo replica set + Redis
```

The runner generates a unique Compose project and Mongo database name per run,
then tears down the containers and volumes in `finally`. It never reads the
normal local, staging, or production database.

The API exposes `POST /api/e2e/creators` only when
`ASPNETCORE_ENVIRONMENT=E2E`. That narrow factory creates a normal Identity
Creator (verified email/onboarding, Creator role, journey and optional ideas).
Playwright then signs in through the real `/api/auth/login` UI flow; the helper
does not mint a JWT or bypass Creator ownership checks. In every other
environment the route returns 404. No storage-state/token file is written or
committed (`tests/creator/e2e/.auth`, Playwright reports and results are ignored).

Creator test source is centralized under `tests/creator/`: browser specs are
in `e2e/specs`, their fixtures and runner are under `e2e/fixtures` and
`e2e/support`, and Creator frontend unit tests are under `frontend`. The
E2E provisioning controller is compiled into `backend/tests/WebApp.E2eSupport`
and loaded only by the isolated `E2E` backend image.

Prerequisites: Docker with Compose, Node 20+, .NET 8 (for backend tests), and
the Chromium browser installed by Playwright. CI installs Chromium explicitly.

```bash
# once after dependency install (or use the CI step)
npx playwright install chromium

# isolated authenticated Creator browser suite
npm run test:e2e:creator
```

The browser suite covers normal authenticated dashboard access, unauthenticated
redirect, foreign-idea denial, different-idea tab isolation, same-idea
optimistic-concurrency 409, stale session-storage recovery, Full Buyout
publishing, and the Build path. Build coverage starts from fixtures with no
invented ownership/funding decisions, persists creator-entered ownership and
funding preferences, rejects invalid ownership, and verifies the readiness
progression from incomplete Build preparation to Level Up eligibility. The
eligible fixture deliberately has no investor matches, proving matching is not
a Level Up prerequisite. The Level Up browser case runs only against the
transaction-capable replica-set stack.

## Prerequisites

- .NET 8 SDK
- Docker Desktop or another Docker daemon reachable by Testcontainers
- Node dependencies installed (`npm ci`) for frontend tests

## Commands

Run the transaction-backed Level Up suite:

```powershell
dotnet test backend/tests/WebApp.Tests/WebApp.Tests.csproj --filter "FullyQualifiedName~LevelUpTransactionIntegrationTests"
```

Run Creator frontend unit tests:

```powershell
npm test -- --run src/__tests__/lib/creator-idea-scope.test.ts
npm test -- --run src/components/creator
```

The `Creator Transaction Tests` GitHub Actions workflow runs the same
transaction command on a Docker-capable GitHub-hosted runner and uploads TRX
results. It is intentionally separate from production deployment workflows.

## Browser E2E status

The legacy live-AI specs still require manually supplied credentials and are
not part of the Creator stability command. Use `npm run test:e2e:creator` for
the CI-safe, disposable authenticated suite; never point either suite at a
shared/demo/production database.

Google Fonts connectivity affects `next build` in network-restricted runners;
it does not replace frontend TypeScript or browser correctness checks.
