# Mondial Creator — Full System Audit

> **Purpose:** Single-source audit for external review (system-design AI agent).
> **Scope:** Creator role subsystem — architecture, APIs, business logic, data model, gaps.
> **Stack:** Next.js 16 (App Router, React Compiler) · React 19 · TS · Tailwind 4 · shadcn/ui · TanStack Query · SignalR · recharts. Backend: ASP.NET Core 8 + MongoDB.
> **Audited:** June 2026 · all claims verified against source.
> **Overall completion:** ~60% (infra 100%, Phase 1 blocked, Phase 2–3 WIP, Phase 4–6 stubs).

---

## 0. How to Read This Doc (for the reviewing agent)

This system has a **critical architectural split** you must understand before suggesting changes:

| Surface | Source of truth | Persistence | Risk |
|---------|-----------------|-------------|------|
| **Guided journey** (phases 1–6) | Client state machine | `localStorage` only | No multi-device sync; lost on cache clear |
| **Feature pages** (messages, deals, notifications, AI sessions, dashboard) | .NET backend REST + SignalR | MongoDB + TanStack cache | Standard server-driven |

**Only Phase 1 reconciles with the backend.** Phases 2–6 are a *client-side simulation* persisted to `localStorage`. This is the #1 thing to evaluate: is client-authoritative journey state acceptable, or should it move server-side?

---

## 1. Architecture Layers

```
RootLayout (app/layout.tsx)
└─ RootProviders
   ├─ ThemeProvider (next-themes, light default)
   └─ AuthProvider (backend-verified session)        ← app/_providers/AuthProvider.tsx
      └─ ReactQueryProvider (TanStack, staleTime 60s)
         └─ DashboardLayout (app/dashboard/layout.tsx)
            └─ AuthGuard (authn + role RBAC)
               └─ OnboardingGuard (Phase-1 KYC gate)
                  └─ CreatorLayout (app/dashboard/creator/layout.tsx)
                     └─ CreatorProgressProvider (journey state + localStorage)
                        └─ CreatorPhaseGuard (route→phase access matrix)
                           └─ {creator page}
```

| Layer | File | Responsibility |
|-------|------|----------------|
| Auth session | `app/_providers/AuthProvider.tsx` | Bearer token, `GET /auth/me` verify, cross-tab sync |
| Query cache | `app/_providers/ReactQueryProvider.tsx` | QueryClient (staleTime 60s) |
| App shell | `app/dashboard/layout.tsx` | AuthGuard + OnboardingGuard + sidebar/topbar |
| KYC gate | `components/layout/OnboardingGuard.tsx` + `providers/OnboardingProvider.tsx` | Phase-1 via `/onboarding/status` |
| Creator shell | `app/dashboard/creator/layout.tsx` | Wraps with progress provider + phase guard |
| Journey state | `hooks/useCreatorProgressState.ts` | 6-phase machine + localStorage + Phase-1 reconcile |
| Journey context | `providers/CreatorProgressProvider.tsx` | Exposes state + mutators via `useCreatorProgress()` |
| Phase guard | `components/layout/CreatorPhaseGuard.tsx` | Redirects locked phase routes |
| Resolver | `lib/creator-state-resolver.ts` | Pure fn → next action/route/CTA |
| Type contract | `types/creator/creator-journey.ts` | Journey, project, outputs types |

---

## 2. Access Control — Three Stacked Gates

Every creator route passes through three independent gates:

### 2.1 AuthGuard (`components/layout/AuthGuard.tsx`)
- `isAuthenticated = !!user && !!token && isBackendVerified`.
- Token hydrates from `localStorage` → backend-verified via `GET /auth/me`.
- Cross-tab sync via `storage` event.
- Unauthenticated → `/login`. Wrong role → user's own `/dashboard/{role}`.
- Refresh via axios interceptor (`/auth/refresh-token`) with request queue (de-dupes concurrent refreshes).

### 2.2 OnboardingGuard (Phase-1 KYC)
- `OnboardingProvider` fetches `GET /onboarding/status` → `useOnboarding()` (`status`, `isComplete`, `items`, `nextRequired`).
- Incomplete → `/onboarding`. **Creator exception:** skip if `creator_verification_skipped_at` < 24h old.

### 2.3 CreatorPhaseGuard (`components/layout/CreatorPhaseGuard.tsx`)
Route→phase matrix; `router.replace('/dashboard/creator')` if phase `locked`:

| Route prefix | Blocked when |
|--------------|--------------|
| `/dashboard/creator/phase-2` | `phase2.status === 'locked'` |
| `/dashboard/creator/phase-3` | `phase3.status === 'locked'` |
| `/dashboard/creator/offer-pricing` | `phase4.status === 'locked'` |
| `/dashboard/creator/crossroads` | `phase5.status === 'locked'` |
| `/dashboard/creator/investors` | `phase6.status === 'locked'` |

> ⚠️ **Gap:** resolver (`getNextCreatorAction`) only checks `!== 'completed'`, so it can return a route this guard bounces. Not cross-validated. → see §9 Risk R3.

---

## 3. The Phase State Machine

### 3.1 Status lifecycle
```
locked → available / available_not_started → in_progress → completed
                                                          ↘ skipped_for_now
```

### 3.2 Type (verified — `types/creator/creator-journey.ts`)
```typescript
type CreatorPhaseStatus =
  | 'locked' | 'available' | 'available_not_started'
  | 'in_progress' | 'completed' | 'skipped_for_now';

interface PhaseState {
  status: CreatorPhaseStatus;
  currentStep: number;
  completedSteps: string[];          // e.g. ['2-6','2-7']
  startedAt?: string;
  lastSavedAt?: string;
  completedAt?: string;
  selectedEntryPath?: 'already_have_idea' | 'needs_discovery' | null;
  // Phase-2-only scratch fields:
  discoveryInputs?: { sectors: string[]; observedProblem: string; strengths: string[] };
  chatMessages?: Array<{ id: string; sender: 'ai' | 'user'; text: string }>;
  generatedConcepts?: any[];          // ⚠️ untyped
  selectedConceptId?: string | null;
}

interface CreatorJourneyState {
  phase1: PhaseState;
  phase2: PhaseState;
  phase3: PhaseState;
  phase4: PhaseState;
  phase5: PhaseState & { selectedPath?: 'buyout' | 'build' | null };
  phase6: PhaseState;
}
```

### 3.3 Phases
| Phase | Domain | Entry route | Steps | Backend? |
|-------|--------|-------------|-------|----------|
| 1 | Identity & verification | `/phase-1` | 1 | ✅ reconciled via `/onboarding/status` |
| 2 | Project identity & branding | `/phase-2` | 12 (discovery→logo→complete) | ❌ localStorage only |
| 3 | Project intelligence (AI) | `/phase-3` | 6 (forecast→plan→compliance→formation→complete) | ❌ (AI sessions are live, journey state local) |
| 4 | Offer & pricing | `/offer-pricing` | 1 | ❌ |
| 5 | The Crossroads | `/crossroads` | decision: `selectedPath` | ❌ |
| 6 | Smart matchmaking | `/investors` | matching | ❌ |

**Phase 2** is most complex — two entry paths converge:
- `already_have_idea` → sets `currentStep: 6` → Clarifier (C-2 AI).
- `needs_discovery` → sets `currentStep: 2` → discovery chat (STUB) → concept gen (STUB).

**Phase 5** writes `selectedPath`, read downstream (messenger/deals) to unlock the right deal thread (`buyout` → Aster buyout, `build` → Mira equity).

---

## 4. Business Logic — Mutators

All journey writes go through `useCreatorProgressState.ts` (exposed via `useCreatorProgress()`). **Verified behavior:**

### 4.1 `updateProject(fields)`
Shallow-merges `fields` into `project`, forces `exists: true`. Used by Clarifier/branding to write idea data.

### 4.2 `saveOutputVersion(outputKey, payload)`
**Prepends** a versioned entry to `outputs[outputKey]`:
```typescript
const version = { id: `${outputKey}-${Date.now()}`, phase: 3, createdAt: now, ...payload };
outputs[outputKey] = [version, ...prev];   // newest first → latest = versions[0]
```
> ⚠️ **Inconsistency:** `phase: 3` is **hardcoded** for every output, even non-phase-3 outputs (pricing, valuation, matching). → Risk R6.
> ⚠️ Newest-first ordering. The design doc claims `latest = versions.at(-1)` (last) but code prepends, so `latest = versions[0]`. Consumers must agree. → Risk R7.

### 4.3 `upsertDocument(doc)`
De-dupes by `id` (filter out existing, prepend new). Stamps `createdAt` if absent.

### 4.4 `completeStep(phaseNum, stepNum)`
```typescript
completedSteps: add `${phaseNum}-${stepNum}` (dedup)
currentStep: stepNum + 1
status: 'in_progress'      // ⚠️ ALWAYS — see Risk R2
```
> ⚠️ **Non-monotonic:** unconditionally sets `in_progress`. Re-visiting a `completed` phase **regresses** it. → Risk R2.

### 4.5 `setEntryPath(path)` — Phase 2 fork
```typescript
phase2.selectedEntryPath = path
phase2.status = 'in_progress'
phase2.currentStep = path === 'already_have_idea' ? 6 : 2
```

### 4.6 `setCrossroadsPath(path)` — Phase 5 decision
```typescript
phase5.selectedPath = path        // 'buyout' | 'build'
phase5.status = 'in_progress'
phase5.currentStep = 2
```

### 4.7 `advancePhase(phaseNum)` — the unlock transition
```typescript
phase{N}.status = 'completed'; phase{N}.completedAt = now
phase{N+1}.status = 'available'; phase{N+1}.currentStep = 1
```
The only function that unlocks the next phase. Called by each phase's `complete/` page.

### 4.8 `resetJourney()`
Wipes to `INITIAL_STATE` **but keeps `phase1`** (verification persists). Removes localStorage key.

### 4.9 Persistence lifecycle (verified)
```
MOUNT:
  read localStorage('mondial_creator_progress_draft')
  → deep-merge over INITIAL_STATE (backfills phase2/phase3/project.branding/outputs)
  → GET /onboarding/status
      obStatus.phase >= 1 ? phase1='completed' (+unlock phase2 if locked)
                          : phase1='in_progress'
  → setState; isLoading=false

WRITE:
  state change → debounce 500ms → localStorage.setItem(JSON.stringify(state))
```
> ⚠️ **Mutation-on-load (Risk R1):** when no draft exists, `loadedState === INITIAL_STATE` (the shared module constant). The reconcile does `const updatedState = { ...loadedState }` (shallow) then **mutates nested** `updatedState.journeyState.phase1.status = ...`. Because `journeyState` is shared by reference, this **mutates the module constant**. Subsequent `resetJourney()`/remounts inherit corrupted defaults.

---

## 5. Routing & Navigation

### 5.1 Resolver — `getNextCreatorAction(state)` (`lib/creator-state-resolver.ts`)
Pure fn; walks phases 1→6, returns first non-`completed`:
```typescript
interface NextAction {
  targetPhase: number;          // 1–6
  targetStep: string;           // 'step-2.6' | 'crossroads' | ...
  route: string;
  buttonLabel: string;
  prerequisiteReason?: string;
}
```
**Phase 2 step→route map** (verified):
| step | route |
|------|-------|
| 2 | `/phase-2/discovery` |
| 3 | `/phase-2/ai-processing` |
| 4 | `/phase-2/idea-cards` |
| 5 | `/phase-2/idea-confirm` |
| 6 | `/phase-2/clarifier` |
| 7 | `/phase-2/idea-summary` |
| 8 | `/phase-2/concept-name` |
| 9 | `/phase-2/branding` |
| 10 | `/phase-2/hire-designer` |
| 11 | `/phase-2/logo-tool` |
| 12 | `/phase-2/complete` |

**Phase 3 step→route:** 2→forecast, 3→business-plan, 4→compliance, 5→formation, 6→complete.

### 5.2 Sidebar menu (`lib/menu.ts`, role Creator) — verified hrefs
| Section | Items → routes |
|---------|----------------|
| Main | Dashboard `/dashboard/creator` · My Idea `/myideas` · Project Studio `/project-studio` · AI Masterplan `/ai-masterplan` · Offer & Pricing `/offer-pricing` |
| Growth | The Crossroads `/crossroads` · Marketplace `/marketplace` · Hire Providers `/hire-providers` · IP Vault `/ip-vault` |
| Communication | Messenger `/messenger` (mock) · Notifications `/notifications` |
| Assets | Asset Library `/asset-library` · Documents `/documents` · Settings `/settings` |

> ⚠️ The **live** messaging workspace (`/messages`) is NOT in the menu; only the **mock** `/messenger` is linked. → Risk R4.

---

## 6. Data Model

### 6.1 Client journey store (`CreatorJourneyData`) — localStorage
```typescript
interface CreatorJourneyData {
  journeyState: CreatorJourneyState;   // 6 phases (§3.2)
  project: CreatorProject;             // canonical idea (§6.2)
  outputs: {                           // versioned AI artifacts (append, newest-first)
    financialForecastVersions: any[];  // ⚠️ all any[]
    businessPlanVersions: any[];
    complianceVersions: any[];
    skillGapVersions: any[];
    pricingVersions: any[];
    resourcePlanVersions: any[];
    gtmPlanVersions: any[];
    valuationVersions: any[];
    marketplaceListingVersions: any[];
    companyFormationVersions: any[];
    fundingAskVersions: any[];
    matchingRuns: any[];
  };
  assets: any[];           // branding assets
  documents: CreatorDocument[];
  conversations: any[];
  notifications: any[];
  activityHistory: any[];
}
```
> ⚠️ Every `outputs.*` array and `assets/conversations/notifications/activityHistory` is `any[]` — **no type safety** on the most important data. → Risk R8.

### 6.2 `CreatorProject` (the canonical idea)
```typescript
interface CreatorProject {
  exists: boolean;
  projectId: string | null;     // ⚠️ never populated client-side (no backend link)
  name: string;
  tagline: string;
  concept: string;
  targetUser: string;
  problem: string;
  solution: string;
  marketGap: string;
  creatorEdge: string;
  category: string;
  tags: string[];
  clarityScore: number;         // from Clarifier
  validationScore: number;      // ⚠️ never written
  marketPotential: string;      // ⚠️ never written
  feasibilityScore: number;     // ⚠️ never written
  branding: {
    logoType: 'ai' | 'designer' | null;
    logoAsset: string | null;
    colorPalette: string[];
    paletteName: string;
    typographyPairing: string;
  };
  currentVersion: number;
}
```

### 6.3 `CreatorDocument`
```typescript
interface CreatorDocument {
  id: string; name: string; category: string; size: string;
  phase: number; step: number; createdAt: string;
  outputKey?: CreatorOutputKey;
}
```

### 6.4 Idea submission model (`create-idea-model.ts`) — backend-bound
`CreateIdeaModel` is a **flat 40-field** form (snake_case) mapped to multipart `POST /creator/new-idea/{id?}`. Groups: Concept Overview, Proposed Solution, Market Analysis, Business Model, Operations, Roadmap, Risks & Compliance, Founder, Equity (`amount_required`, `equity_percentage`), Media/Docs (`File[]`), Meta (`status: 'DRAFT'|'SUBMITTED'`).
> ⚠️ **Two parallel idea models** that don't share fields: `CreatorProject` (journey, camelCase, local) vs `CreateIdeaModel` (submission, snake_case, backend). No mapping layer between them. → Risk R9.

### 6.5 Dashboard read models (`dashboard.ts`)
`Idea` (id, name, status, funding/equity/raised, investors, views), `DashboardStats` (totalIdeas, clicks, fundRaised, required, equity, activeInvestors, ideas[]), `Investor`. `CreatorProfile`/`BillingInfo`/`CreatorSettings` are `Record<string, unknown>` — **untyped placeholders**. → Risk R8.

### 6.6 Backend collections (inferred — MongoDB, from `SYSTEM_DESIGN.md` + endpoints)
| Collection | Used by creator | Notes |
|------------|-----------------|-------|
| `users` | auth, profile | role-based |
| `businessIdeas` | `/creator/new-idea`, AI sessions | `businessIdeaId` links Clarifier/Plan/Forecast |
| `companies` | `/companies/from-idea/{ideaId}` | spun from idea at Phase 4/5 |
| `aiSessions` (clarifier/plan/forecast) | C-2/C-3/C-4 | session + output, PascalCase status |
| `conversations` / `messages` | live chat | SignalR-backed |
| `deals` / `termSheets` | Phase 9 deal pipeline | see PHASE_9 docs |
| `notifications` | `/notification` | |
> ⚠️ **No `creatorJourney` collection.** Journey state (phases 2–6) has **no backend home** — it lives only in the browser. → Risk R1/R10.

---

## 7. Backend API Surface

Base: `lib/api-config.ts` → dev `http://localhost:5093/api`; prod `NEXT_PUBLIC_API_BASE_URL`. All via `lib/axios.ts` (Bearer, 401→refresh queue). **Two envelope conventions coexist:**
- `api-creator-dashboard.ts` returns `res.data` raw, **swallows errors** (returns `{}`/`[]`/mock fallback).
- `api-creator-ai.ts` unwraps `res.data.data` (ApiResponse envelope), **propagates errors**.
> ⚠️ Inconsistent error handling across clients. Dashboard's silent-catch hides backend failures. → Risk R11.

### 7.1 Dashboard & ideas (`api-creator-dashboard.ts`)
| Endpoint | Method | Returns | On error |
|----------|--------|---------|----------|
| `/creator/dashboard/stats` | GET | DashboardStats | zeros |
| `/creator/ideas` | GET | Idea[] | `[]` |
| `/ideas` | GET | investor feed | `[]` |
| `/creator/profile` | GET | profile | `{}` |
| `/creator/billing` | GET | billing | `{}` |
| `/creator/settings` | GET | settings | `{}` |
| `/creator/billing-history` | GET | BillingItem[] | mock `billingData` |
| `/creator/new-idea/{id?}` | POST | SaveIdeaResponse | **throws** (multipart) |
| `/creator/ideas/{ideaId}/pause` | PATCH | — | `{success:false}` |
| `/companies/from-idea/{ideaId}` | POST | `{companyId, sourceBusinessIdeaId, alreadyExisted}` | **throws** |

### 7.2 AI sessions (`api-creator-ai.ts`) — `creatorAiApi`
Three chained session types, each start/get/list. Polled every **2500ms** (`POLL_INTERVAL_MS`, `hooks/queries/creator-ai.ts`) until terminal (`Completed|Failed|NeedsReview`).
| Op | C-2 Clarifier | C-3 Business Plan | C-4 Forecast |
|----|---------------|-------------------|--------------|
| start (POST) | `/ai/idea-clarifier` | `/ai/business-plan` | `/ai/forecast` |
| get (GET) | `/ai/idea-clarifier/{id}` | `/ai/business-plan/{id}` | `/ai/forecast/{id}` |
| list (GET) | `/ai/idea-clarifier?businessIdeaId=` | `/ai/business-plan?clarifierSessionId=` | `/ai/forecast?businessPlanSessionId=` |

**Chaining (enforced by request DTOs):** Clarifier → `clarifierSessionId` → Plan → `businessPlanSessionId` → Forecast. Start returns `{ sessionId, jobId }`.

### 7.3 Chat (`api-chat.ts`)
`GET/POST /chat/conversations`, `POST /chat/conversations/by-company/{companyId}`, `GET /chat/messages/{conversationId}` (page 30), `POST /chat/send`, `POST /chat/read/{conversationId}`. Cache de-dupes REST vs SignalR echo.

### 7.4 Deals / term-sheets (`api-deals.ts`)
`GET /deals`, `GET /companies/deals/{dealId}` (+`/activity`), `POST /offer/{counter|accept|reject|viewed}`, `/deals/{id}/close`, `/term-sheet/sign` (multipart), `POST /investor/term-sheet/{companyId}/create`. staleTime 15s.

### 7.5 Notifications (`api-notifications.ts`)
`GET /notification` (page 30, cache bound 50), `POST /notification/read/{id}`.

---

## 8. AI Session Contracts (`types/creator/ai.ts`)

Status (PascalCase, backend source of truth): `Pending | Processing | Completed | Failed | NeedsReview`. Terminal = `Completed | Failed | NeedsReview`. `hasAiOutput = Completed | NeedsReview`.

### 8.1 C-2 Clarifier
**In:** `StartClarifierRequest { businessIdeaId?, rawIdea: { title, problemStatement, targetAudience, description?, existingAlternatives?, attachments? } }`
**Out:** `ClarifierOutput { problemDefinition, targetAudience, existingAlternatives[], proposedSolution, riskAssessment[], assumptions[], clarityScore, clarityRationale, tags[] }`

### 8.2 C-3 Business Plan
**In:** `{ clarifierSessionId, businessIdeaId? }`
**Out:** `BusinessPlanOutput { executiveSummary, marketAnalysis, competitorAnalysis, revenueModel, goToMarket, operationsPlan, risks[] }` (+ `currentVersion`, `schemaVersion` on session)

### 8.3 C-4 Forecast
**In:** `{ businessPlanSessionId, businessIdeaId? }`
**Out:** `ForecastOutput { revenueForecast{monthly[]}, costForecast{monthly[]}, cashFlowProjection{monthly[]}, breakEvenAnalysis, assumptions[], risks[], advisoryNotice }`

> ⚠️ **Type disconnect:** these well-typed outputs are stored into `outputs.*Versions: any[]` (§6.1), erasing the types at the storage boundary. → Risk R8.

---

## 9. Real-time (SignalR)

- Transport: Microsoft SignalR / WebSocket. Hubs `/hubs/chat`, `/hubs/notifications`.
- URL: `{API_ORIGIN}/hubs/{hub}` (origin = base minus `/api`); JWT via `access_token` query param.
- `connection-manager.ts`: **one ref-counted connection per hub**, shared `startPromise`, **1s deferred teardown** (survives React Strict-Mode double-mount; cancels stop if re-acquired). Capped exponential backoff + jitter (`reconnect-policy.ts`).
- Hook `useSignalRHub(hub)` → `{ connection, status, invoke }` + `hubEvent(method, handler)`.
- Events: chat `ReceiveMessage`/`ConversationCreated`; notifications `ReceiveNotification`.
- Consumers: `hooks/queries/notifications.ts`, `hooks/queries/use-deal-realtime.ts`.

This layer is **production-grade** — the most mature part of the system.

---

## 10. Page Inventory & Status (verified routes)

Legend: 🟢 wired/live · 🟡 partial/WIP · 🔴 stub/placeholder · ⛔ blocked

### Journey
| Route | Status | Notes |
|-------|--------|-------|
| `/dashboard/creator` | 🟢 | Dashboard: stats, chart, stepper |
| `/phase-1` | ⛔ | Verification — gated, no content |
| `/phase-2` | 🟡 | Smart Gate (entry path picker) |
| `/phase-2/clarifier` | 🟡 | C-2 form + polling (works) |
| `/phase-2/discovery` `/ai-chat` `/ai-processing` | 🔴 | Discovery path skeleton |
| `/phase-2/idea-cards` `/idea-confirm` `/idea-summary` `/concept-name` | 🔴/🟡 | Mixed stubs |
| `/phase-2/branding` `/logo-tool` `/hire-designer` | 🔴 | Branding tools unbuilt |
| `/phase-2/complete` | 🟡 | Completion gate |
| `/phase-3` | 🟢 | Hub |
| `/phase-3/forecast` | 🟡 | ForecastView (chart fallback hardcoded) |
| `/phase-3/business-plan` | 🟡 | BusinessPlanView |
| `/phase-3/compliance` `/formation` | 🔴 | Stubs |
| `/phase-3/complete` | 🟡 | Completion gate |
| `/offer-pricing` (P4) | 🔴 | Pricing matrix unbuilt |
| `/crossroads` (P5) | 🔴 | Decision UI unbuilt (state machine ready) |
| `/investors` (P6) | 🔴 | Matching unbuilt |

### Feature / work surfaces
| Route | Status | Notes |
|-------|--------|-------|
| `/myideas` | 🟡 | Lists ideas (live stats) |
| `/messages` | 🟢 | Live chat (TanStack + SignalR) — **not in menu** |
| `/messenger` | 🔴 | Mock chat (hardcoded) — **in menu** |
| `/notifications` | 🔴 | "Under development" card (live infra exists, unwired) |
| `/billinghistory` | 🟡 | Live + mock fallback |
| `/settings` `/profile` `/profile/[id]` | 🟡 | Partial; `[id]` has server fetch |
| `/asset-library` `/documents` | 🟡/🔴 | Reads context; actions unwired |
| `/project-studio` `/ai-masterplan` | 🔴 | Stubs (masterplan uses mock recharts) |
| `/marketplace` `/hire-providers` `/ip-vault` | 🔴 | Growth stubs |

---

## 11. Risk Register (for reviewer prioritization)

| ID | Risk | Severity | Location | Description | Suggested fix |
|----|------|----------|----------|-------------|---------------|
| **R1** | Mutation-on-load corrupts shared constant | 🔴 HIGH | `useCreatorProgressState.ts:134` | No-draft path mutates nested `INITIAL_STATE.journeyState` by reference | Deep-clone INITIAL_STATE (`structuredClone`) before reconcile |
| **R2** | Non-monotonic `completeStep` | 🟠 MED | `:220` | Always sets `in_progress`, regresses revisited completed phases | Guard: don't downgrade `completed`; or compute status from steps |
| **R3** | Resolver/guard divergence | 🟠 MED | resolver vs `CreatorPhaseGuard` | Resolver can point at a phase the guard bounces | Single shared access matrix; cross-validate |
| **R4** | Two messengers | 🟠 MED | `/messenger` (mock) vs `/messages` (live) | Menu links the mock; live one hidden | Pick `/messages` as canonical, deprecate mock, fix menu |
| **R5** | No backend persistence for phases 2–6 | 🔴 HIGH | whole journey | localStorage-only; no multi-device, lost on clear | Add `creatorJourney` collection + sync endpoints |
| **R6** | Hardcoded `phase: 3` in every output | 🟡 LOW | `saveOutputVersion:189` | Mislabels non-P3 outputs | Pass phase as arg |
| **R7** | Latest-version ambiguity | 🟡 LOW | `saveOutputVersion` | Code prepends (`[0]` newest), prior design doc said `.at(-1)` | Standardize + document; add `getLatest()` helper |
| **R8** | `any[]` on all outputs/assets/etc. | 🟠 MED | `creator-journey.ts:68-85`, `dashboard.ts:37-41` | No type safety on core data | Type with `ai.ts` output interfaces |
| **R9** | Two unmapped idea models | 🟠 MED | `CreatorProject` vs `CreateIdeaModel` | camelCase/local vs snake_case/backend; no adapter | Add mapping layer; converge fields |
| **R10** | `project.projectId` never set | 🟠 MED | journey | No link between local journey and backend businessIdea/company | Capture id on idea-create; persist |
| **R11** | Inconsistent error handling | ✅ CLOSED | dashboard client swallows, AI client throws | Silent `{}`/`[]` hide failures | DONE: `api-creator-dashboard.ts` now uses the shared tolerant `unwrap` + propagates errors (no `{}`/`[]`/mock); `billingData.ts` deleted; billinghistory shows loading/empty/error+Retry. All 3 creator clients share one contract. |
| **R12** | AI polling has no timeout | 🟠 MED | `creator-ai.ts` | Loops indefinitely if job hangs | Max attempts/duration + failure state |
| **R13** | Phase 1 blocked | 🔴 HIGH | `/phase-1` | No verification UI — users can't start | Build KYC flow |
| **R14** | Untyped Phase-2 scratch (`generatedConcepts: any[]`) | 🟡 LOW | `creator-journey.ts:24` | Discovery concepts untyped | Define `GeneratedConcept` |
| **R15** | Forecast chart hardcoded fallback | 🟠 MED | `ForecastView` | Shows mock even when real forecast exists | Bind to `ForecastOutput.*.monthly` |

---

## 12. Key Questions for the Reviewing Agent

1. **Journey persistence model:** Is client-authoritative localStorage acceptable for a multi-phase SaaS onboarding, or must phases 2–6 move server-side (R5)? This is the central architectural decision — everything else is downstream.
2. **State source of truth:** Should phase/step status be *stored* (current) or *derived* from completed artifacts/backend records (would fix R1/R2 structurally)?
3. **Idea model unification:** Merge `CreatorProject` + `CreateIdeaModel` into one contract, or keep separate with an explicit adapter (R9)?
4. **Backend journey schema:** What should a `creatorJourney` collection look like? (proposed: `{ userId, businessIdeaId, companyId, phases:{1..6:{status,currentStep,completedSteps,timestamps}}, project, outputRefs }`)
5. **AI output storage:** Keep full output snapshots in journey (`any[]`) or store only session IDs and re-fetch from `aiSessions` (R8)?
6. **Two messengers:** Confirm `/messages` (live) as canonical and delete `/messenger` (mock) (R4)?

---

## 13. Roadmap (priority order)

**P0 — Unblock & stabilize**
1. R1 deep-clone INITIAL_STATE · 2. R13 Phase-1 KYC · 3. R11 error handling + UI · 4. R5 decision on backend persistence.

**P1 — Phase completion**
5. Phase-2 discovery path (chat + concept gen) · 6. Phase-2 branding/logo · 7. Phase-3 compliance/formation · 8. Phase-4 pricing · 9. Phase-5 crossroads UI · 10. Phase-6 matching.

**P2 — Hardening**
11. R8 type the outputs · 12. R9 idea-model adapter · 13. R4 consolidate messengers · 14. R12 polling timeout · 15. R15 forecast live binding · 16. R2/R3 status logic + guard/resolver unify.

---

## 14. Directory Reference
```
src/
  app/dashboard/creator/
    layout.tsx                          provider + guard wrapper
    page.tsx                            dashboard overview
    phase-1/ phase-2/* phase-3/*        guided journey
    offer-pricing/ crossroads/ investors/   phases 4–6
    project-studio/ ai-masterplan/ myideas/ marketplace/ hire-providers/ ip-vault/
    messenger/(mock) messages/(live) notifications/
    asset-library/ documents/ settings/ profile/ billinghistory/
  providers/CreatorProgressProvider.tsx · OnboardingProvider.tsx
  hooks/useCreatorProgressState.ts
  hooks/queries/{creator,creator-ai,chat,deals,notifications,use-deal-realtime}.ts
  lib/creator-state-resolver.ts
  lib/api-{creator-dashboard,creator-ai,chat,deals,notifications}.ts
  lib/{axios,menu,roles,api-config}.ts
  lib/realtime/{connection-manager,use-signalr-hub,reconnect-policy,types}.ts
  types/creator/{creator-journey,ai,dashboard,create-idea-model,project,publicProfile}.ts
  components/creator/ai/{CreatorAiWorkspace,AiStatusBadge,AiJobProgress,BusinessPlanView,ForecastView,ClarifierResultsCard}.tsx
  components/creator/Phase3SetupShell.tsx
  components/layout/{AuthGuard,OnboardingGuard,CreatorPhaseGuard,AppSidebar,Topbar}.tsx
```

---
*End of audit. All file paths and behaviors verified against source June 2026. Untyped/never-written fields and the localStorage-only journey are the highest-leverage items to review.*
