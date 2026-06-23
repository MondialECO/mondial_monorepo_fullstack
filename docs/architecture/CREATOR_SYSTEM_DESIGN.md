# Mondial Creator — System Design

> **Scope:** The Creator role subsystem (`src/app/dashboard/creator/**`, providers, hooks, components).  
> **Stack:** Next.js 16 (App Router, React Compiler) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · TanStack Query · SignalR · recharts.  
> **Last Updated:** June 2026  
> **Status:** ~60% complete (infrastructure 100%, Phase 1 blocked, Phases 2–3 WIP, Phases 4–6 stubs).

---

## 1. Executive Summary

The Creator subsystem is a **guided 6-phase journey** that walks a creator from identity verification → idea capture → AI business intelligence → pricing → a buyout-vs-build decision → investor matching.

**Dual-architecture system:**

| Surface | Source of Truth | Persistence |
|---------|-----------------|-------------|
| **Guided journey** (phases 1–6, project studio, crossroads) | Client state machine | `localStorage` (`mondial_creator_progress_draft`) |
| **Feature pages** (live messages, notifications, AI sessions, dashboard stats) | .NET backend REST + SignalR | Server DB; cached in TanStack Query |

**Most important concept:** the *journey* is largely client-authoritative except Phase 1, while *feature pages* are server-driven. This hybrid model enables offline-first journey progression but means multi-device sync is absent for phases 2–6.

---

## 2. Architecture Layers

```
RootLayout (app/layout.tsx)
└─ RootProviders (app/_providers/RootProviders.tsx)
   ├─ ThemeProvider (next-themes, light default)
   ├─ AuthProvider (app/_providers/AuthProvider.tsx)
   │  └─ ReactQueryProvider (TanStack Query, staleTime 60s)
   │     └─ DashboardLayout (app/dashboard/layout.tsx)
   │        └─ AuthGuard (authn + role RBAC)
   │           └─ OnboardingGuard (Phase-1 KYC gate)
   │              └─ CreatorLayout (app/dashboard/creator/layout.tsx)
   │                 └─ CreatorProgressProvider (journey state + localStorage)
   │                    └─ CreatorPhaseGuard (route→phase access matrix)
   │                       └─ {creator page}
```

| Layer | File(s) | Responsibility |
|-------|---------|----------------|
| **Auth Session** | `app/_providers/AuthProvider.tsx` | Bearer token, backend `/auth/me` verification, cross-tab sync |
| **Query Caching** | `app/_providers/ReactQueryProvider.tsx` | TanStack Query client (staleTime 60s, no aggressive refetch) |
| **App Shell** | `app/dashboard/layout.tsx` | Wraps all dashboards with AuthGuard + OnboardingGuard + sidebar/topbar |
| **KYC Gate** | `components/layout/OnboardingGuard.tsx` + `providers/OnboardingProvider.tsx` | Phase 1 verification; reads `/onboarding/status` |
| **Creator Shell** | `app/dashboard/creator/layout.tsx` | Wraps creator routes with CreatorProgressProvider + CreatorPhaseGuard |
| **Journey State** | `hooks/useCreatorProgressState.ts` | 6-phase state machine; localStorage persistence; Phase-1 reconcile |
| **Journey Context** | `providers/CreatorProgressProvider.tsx` | Exposes state + mutators via `useCreatorProgress()` |
| **Phase Guard** | `components/layout/CreatorPhaseGuard.tsx` | Redirects locked phase routes to `/dashboard/creator` |
| **Resolver** | `lib/creator-state-resolver.ts` | Pure fn: journey state → next unfinished phase + route + CTA label |
| **Type Contract** | `types/creator/creator-journey.ts` | Journey, project, outputs types (source of truth for shape) |

---

## 3. Authentication & Access Control

### 3.1 AuthGuard (Backend-verified Session)
- Uses `useAuth()` from `AuthProvider`.
- `isAuthenticated = !!user && !!token && isBackendVerified`.
- Token hydrates from `localStorage`, then verified via `GET /auth/me` (backend-signing).
- Cross-tab sync via `storage` event listener.
- Unauthenticated → `/login`. Wrong role → redirected to user's dashboard.
- Token refresh via axios interceptor (`/auth/refresh-token`); request queue prevents concurrent refreshes.

### 3.2 OnboardingGuard (Phase-1 KYC)
- `OnboardingProvider` fetches `GET /onboarding/status`; exposes `useOnboarding()`.
- Incomplete Phase-1 → `/onboarding` (identity verification, KYC docs).
- **Creator exception:** skip if `creator_verification_skipped_at` within 24h.

### 3.3 CreatorPhaseGuard (Journey Gating)
Route→phase access matrix; redirects to `/dashboard/creator` if phase status is `locked`:
- `/phase-2` ← blocked if `phase2.status === 'locked'`
- `/phase-3` ← blocked if `phase3.status === 'locked'`
- `/offer-pricing` ← blocked if `phase4.status === 'locked'`
- `/crossroads` ← blocked if `phase5.status === 'locked'`
- `/investors` ← blocked if `phase6.status === 'locked'`

**Known gap:** resolver can return a route the guard will bounce (divergence not cross-validated).

---

## 4. The Phase State Machine

Six phases, each a `PhaseState`:
```typescript
type PhaseStatus = 'locked' | 'available' | 'available_not_started' | 'in_progress' | 'completed' | 'skipped_for_now';

interface PhaseState {
  status: PhaseStatus;
  currentStep: number;      // 1–N (phase-specific max)
  startedAt?: string;       // ISO
  completedAt?: string;     // ISO
}
```

| Phase | Domain | Route | Steps | Entry Condition |
|-------|--------|-------|-------|---|
| **1** | Identity & verification | `/phase-1` | 1 (verification) | Always available; locked until verified via backend |
| **2** | Project identity & branding | `/phase-2` | 12 (discovery/clarifier → branding → complete) | Phase 1 completed |
| **3** | Project intelligence (AI) | `/phase-3` | 6 (forecast → plan → compliance → formation → complete) | Phase 2 completed |
| **4** | Offer & pricing | `/offer-pricing` | tracked as one (no substeps) | Phase 3 completed |
| **5** | The Crossroads decision | `/crossroads` | decision: `selectedPath: 'buyout' \| 'build'` | Phase 4 completed |
| **6** | Investor matching | `/investors` | matching engine + messaging | Phase 5 completed |

### Phase 2 Complexity
**Two entry paths converge:**
- `already_have_idea` → Clarifier flow (C-2 AI session) → idea summary
- `needs_discovery` → AI discovery chat (STUB) → concept generation (STUB)

Both converge at branding (steps 9–12). Currently only Clarifier path is functional.

### Phase 5: Crossroads Decision
Writes `phase5.selectedPath` ('buyout' or 'build'), which downstream pages (messenger, deals) read to unlock the correct deal thread:
- `'buyout'` → Aster buyout deal
- `'build'` → Mira equity deal

### Mutators (`useCreatorProgress()`)
```typescript
updateProject(fields: Partial<CreatorProject>)
saveOutputVersion(outputKey: CreatorOutputKey, payload: Record<string, unknown>)
upsertDocument(doc: Omit<CreatorDocument, 'createdAt'> & { createdAt?: string })
completeStep(phaseNum: number, stepNum: number)
setEntryPath('already_have_idea' | 'needs_discovery' | null)
setCrossroadsPath('buyout' | 'build' | null)
advancePhase(phaseNum: number)   // phase N → completed, phase N+1 → available, reset currentStep
resetJourney()                     // wipes all but phase1
```

**`advancePhase(N)` transition:**
- Phase N: status → `completed`, set `completedAt`
- Phase N+1: status → `available`, set `currentStep: 1`
- Write localStorage + notify subscribers.

---

## 5. Data Model

```typescript
interface CreatorJourneyData {
  journeyState: {
    phase1: PhaseState;      // Verification
    phase2: PhaseState;      // Project identity
    phase3: PhaseState;      // Intelligence
    phase4: PhaseState;      // Offer & pricing
    phase5: PhaseState;      // Crossroads
    phase6: PhaseState;      // Matching
  };

  project: CreatorProject;   // Canonical idea
  outputs: {                 // Versioned AI artifacts (append-only)
    clarifierVersions: ClarifierOutput[];
    businessPlanVersions: BusinessPlanOutput[];
    forecastVersions: ForecastOutput[];
    complianceVersions: ComplianceOutput[];
    pricingVersions: PricingOutput[];
    gtmPlanVersions: GTMPlanOutput[];
    valuationVersions: ValuationOutput[];
    marketplaceListingVersions: MarketplaceListingOutput[];
    companyFormationVersions: FormationOutput[];
    fundingAskVersions: FundingAskOutput[];
    matchingRuns: MatchingRun[];
  };

  documents: CreatorDocument[];  // Generated files (forecast PDF, articles, etc.)
  assets: CreatorAsset[];        // Branding assets (logos, colors)
  conversations: Conversation[]; // Phase 5/6 deal messaging
  notifications: Notification[]; // User alerts
  activityHistory: ActivityLog[];
}

interface CreatorProject {
  name: string;
  tagline: string;
  concept: string;
  problem: string;
  solution: string;
  targetAudience: string;
  clarityScore?: number;
  entryPath?: 'already_have_idea' | 'needs_discovery';
  branding: {
    logoType?: 'text' | 'icon' | 'wordmark';
    colorPalette?: string[];
    fontFamily?: string;
  };
  [key: string]: unknown;
}
```

**Key design:**
- `outputs` is **version-append** (immutable history) — each regeneration pushes an entry, so `latest = versions.at(-1)`.
- All stored in Context + `localStorage` only (not backend for phases 2–6).
- Phase 1 reconciled with backend on load via `/onboarding/status`.

---

## 6. Persistence & Sync

### Hydration (Load)
```
mount → read localStorage('mondial_creator_progress_draft')
      → deep-merge over INITIAL_STATE (backfills missing phases/project)
      → if phase1.status !== 'completed': GET /onboarding/status
      → reconcile: if backend phase1 completed, set journeyState.phase1.completed + unlock phase2
      → setState → isLoading=false
```

### Mutation (Write)
```
state change → debounce 500ms → JSON.stringify + write localStorage
            → notify subscribers (pages re-render via context)
```

**Backend is source of truth only for Phase-1**; phases 2–6 are client-authoritative. No multi-device sync; localStorage is per-browser.

**Known risk:** mutation-on-load shallow-copies then mutates nested phase objects. If no draft exists, `loadedState === INITIAL_STATE` (module constant), risking corruption.

---

## 7. Routing & Navigation

### Forward Navigation: `getNextCreatorAction(journeyState)`
Pure function (`lib/creator-state-resolver.ts`) that walks phases 1→6 and returns the first non-`completed` one:

```typescript
interface NextAction {
  targetPhase: number;
  targetStep: string;          // e.g., 'step-2.6', 'crossroads'
  route: string;               // e.g., '/dashboard/creator/phase-2/clarifier'
  buttonLabel: string;         // e.g., 'Resume Setup'
  prerequisiteReason?: string;
}

getNextCreatorAction(state) → NextAction
```

Drives "Resume / Continue" CTAs on dashboard. Note: `targetStep` is string, `targetPhase` is number.

### Sidebar Menu (`lib/menu.ts`, role = Creator)

| Section | Items → Routes |
|---------|---|
| **Main** | Dashboard `/dashboard/creator` · My Idea `/myideas` · Project Studio `/project-studio` · AI Masterplan `/ai-masterplan` · Offer & Pricing `/offer-pricing` |
| **Growth** | The Crossroads `/crossroads` · Marketplace `/marketplace` · Hire Providers `/hire-providers` · IP Vault `/ip-vault` |
| **Communication** | Messenger `/messenger` (mock) · Messages `/messages` (live) · Notifications `/notifications` |
| **Assets** | Asset Library `/asset-library` · Documents `/documents` · Settings `/settings` |

Roles defined in `lib/roles.ts` (`UserRole`); `ROLE_DASHBOARD_ROUTES` maps each to its landing.

---

## 8. Backend API Surface

Base URL: `lib/api-config.ts` → dev `http://localhost:5093/api` (.NET); prod from `NEXT_PUBLIC_API_BASE_URL`.  
All calls via `lib/axios.ts` (Bearer token, 401→refresh queue, localhost mock fallback).

### 8.1 Dashboard & Profile (`lib/api-creator-dashboard.ts`)
| Endpoint | Method | Purpose | Cache |
|----------|--------|---------|-------|
| `/creator/dashboard/stats` | GET | Dashboard KPIs | 60s |
| `/creator/ideas` | GET | List creator ideas | 60s |
| `/creator/profile` | GET | Creator profile | 60s |
| `/creator/settings` | GET | Account settings | 60s |
| `/creator/billing` | GET | Billing summary | 60s |
| `/creator/billing-history` | GET | Transaction history | 60s |
| `/creator/new-idea` | POST | Create idea (multipart) | invalidate ideas list |
| `/creator/new-idea/{id}` | PATCH | Update idea | invalidate ideas list |
| `/creator/ideas/{ideaId}/pause` | PATCH | Pause published idea | invalidate ideas list |
| `/companies/from-idea/{ideaId}` | POST | Spin company from idea | invalidate ideas list |

### 8.2 AI Sessions (`lib/api-creator-ai.ts`)
Three async session types — **C-2 Clarifier**, **C-3 BusinessPlan**, **C-4 Forecast** — same lifecycle:

| Operation | Endpoint | Method | Purpose |
|-----------|----------|--------|---------|
| Start | `/ai/clarifier` | POST | Begin idea clarification (inputs: problem, solution, etc.) |
| Poll | `/ai/clarifier/{sessionId}` | GET | Check status (Pending/Processing/Completed/Failed) |
| List | `/ai/clarifier?limit=10` | GET | Historical sessions |
| (same for `/ai/business-plan` and `/ai/forecast`) | | | |

Sessions polled every **2.5s** until terminal status (Completed/Failed). Sessions chain via filter params (e.g., plan requires `clarifierSessionId`).

Hooks in `hooks/queries/creator-ai.ts`:
- `useStartClarifier()` → mutation
- `useClarifierSession(sessionId)` → query with polling
- `useClarifierHistory()` → list

### 8.3 Chat (`lib/api-chat.ts`)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/chat/conversations` | GET/POST | List or create conversations |
| `/chat/conversations/by-company/{companyId}` | POST | Get or create conversation for deal |
| `/chat/messages/{conversationId}` | GET | Fetch messages (page 30) |
| `/chat/send` | POST | Send message |
| `/chat/read/{conversationId}` | POST | Mark as read |

Cache: TanStack Query + SignalR echo de-duping.

### 8.4 Deals & Term-sheets (`lib/api-deals.ts`)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/deals` | GET | List deals |
| `/companies/deals/{dealId}` | GET | Deal detail + activity |
| `/offer/counter` \| `/accept` \| `/reject` \| `/viewed` | POST | Offer lifecycle |
| `/deals/{dealId}/close` | POST | Close deal |
| `/term-sheet/sign` | POST | Sign term-sheet (multipart) |
| `/investor/term-sheet/{companyId}/create` | POST | Create new term-sheet |

staleTime: 15s; mutations patch detail + invalidate list.

### 8.5 Notifications (`lib/api-notifications.ts`)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/notification` | GET | List notifications (page 30, cache bound 50) |
| `/notification/read/{id}` | POST | Mark as read |

---

## 9. Real-time (SignalR)

**Transport:** Microsoft SignalR over WebSocket.

**Hubs:**
- `/hubs/chat` — ReceiveMessage, ConversationCreated
- `/hubs/notifications` — ReceiveNotification

**Setup:** `connection-manager.ts` (ref-counted connections, deferred teardown, exponential backoff).

**Hook:** `useSignalRHub(hub, opts)` → `{ connection, status, invoke }` + `hubEvent(method, handler)`.

**Auto-cleanup:** 1s grace period before stopping unused hubs (survives React Strict-Mode remounts).

**Auth:** JWT passed as `access_token` query param (backend reads from SignalR `.OnMessageReceived` event).

---

## 10. Mock vs. Live Boundary

| Page / Surface | State | Notes |
|---|---|---|
| Phases 1–6 journey, project studio, crossroads | **Local** (localStorage) | Only Phase 1 reconciles with backend |
| `/creator/messenger` | **Mock** | Hardcoded conversations + message simulation, no API |
| `/creator/messages` (MessagingWorkspace) | **Live** | TanStack Query + SignalR chat hub |
| Dashboard stats / ideas / billing | **Live** (with mock fallback) | Real endpoints; some charts use mock constants |
| AI masterplan / forecast charts | **Mock data** | recharts on constants or `latestForecast` |
| Notifications page | **Placeholder** | Static "under development"; real infra exists, unwired |
| Asset library / settings pagination | **Unwired** | Buttons without handlers (MVP placeholders) |

**Design risk:** Two independent messengers confuse developers about which to use.

---

## 11. Presentation & UI

- **Charts:** recharts (`AreaChart`, `BarChart`, `LineChart` + `Tooltip`, `Legend`, `ResponsiveContainer`). Tooltip formatters must null-check values (`v != null ? … : []`).
- **Primitives:** shadcn/ui (`Button`, `Card`, `Badge`, `Avatar`, `Input`, `Textarea`, `Progress`, `Select`, `Sheet`, `ScrollArea`, `Tooltip`, `Dialog`, `Skeleton`, `Alert`).
- **State management:** React Context (journey, onboarding, auth) + TanStack Query (chat, deals, notifications, AI sessions). Zustand is a dependency but unused in creator surface.
- **Theming:** Theme tokens only (no hardcoded hex in components); light default, `.dark` variant.
- **Client components:** All 7 creator AI components are `'use client'`; no server-side rendering for the wizard.

---

## 12. Directory Reference

```
src/
  app/dashboard/creator/
    layout.tsx                           CreatorProgressProvider + CreatorPhaseGuard wrapper
    page.tsx                             Dashboard overview (stats, chart, stepper)
    phase-1/                             Identity verification (BLOCKED)
    phase-2/                             Project identity & branding (30% WIP)
      page.tsx                           Smart Gate entry
      discovery/                         Needs-discovery path (STUB)
      clarifier/                         Idea Clarifier (C-2, WIP)
      branding/  logo-tool/              Logo & color (STUB)
      idea-summary/  idea-confirm/       Summary & confirmation (WIP)
      complete/                          Phase 2 completion gate (WIP)
    phase-3/                             Project intelligence (40% WIP)
      page.tsx                           Phase 3 hub
      forecast/                          Financial forecast (ForecastView, WIP)
      business-plan/                     Business plan (BusinessPlanView, WIP)
      compliance/  formation/            Legal & formation (STUB)
      complete/                          Phase 3 completion gate (WIP)
    offer-pricing/                       Pricing options (STUB)
    crossroads/                          Buyout vs. Build decision (STUB)
    investors/                           Investor matching (STUB)
    project-studio/                      Work surfaces (STUB)
    ai-masterplan/                       Long-term planning (STUB)
    myideas/                             Creator ideas list (WIP)
    marketplace/  hire-providers/        Growth surfaces (STUB)
    ip-vault/  asset-library/            IP & assets (partial)
    documents/                           Downloadable documents (STUB)
    messenger/                           Mock messaging (UNWIRED)
    messages/                            Live messaging workspace (partial)
    notifications/                       Notifications list (PLACEHOLDER)
    settings/  profile/                  Account pages (partial)
    billinghistory/                      Billing history (partial)

  providers/
    CreatorProgressProvider.tsx          Journey state + localStorage + Phase-1 reconcile
    OnboardingProvider.tsx               Phase-1 KYC gate

  components/creator/
    ai/
      CreatorAiWorkspace.tsx             Multi-stage form (Clarifier → Plan → Forecast)
      AiStatusBadge.tsx                  Status badge (Pending/Processing/Completed/Failed)
      AiJobProgress.tsx                  Progress bar + step indicators
      BusinessPlanView.tsx               BusinessPlanOutput renderer
      ForecastView.tsx                   ForecastOutput + revenue chart
      ClarifierResultsCard.tsx           ClarifierOutput display
    Phase3SetupShell.tsx                 Layout wrapper for Phase 3 pages

  components/layout/
    AuthGuard.tsx                        Backend-verified session gate
    OnboardingGuard.tsx                  Phase-1 KYC gate
    CreatorPhaseGuard.tsx                Route→phase access matrix
    AppSidebar.tsx                       Role-filtered menu
    Topbar.tsx                           Breadcrumb + notifications + logout

  hooks/
    useCreatorProgressState.ts           State machine + localStorage + Phase-1 reconcile
    queries/
      creator.ts                         Dashboard stats, ideas, profile, billing
      creator-ai.ts                      Clarifier, BusinessPlan, Forecast sessions
      chat.ts                            Conversations, messages, send
      deals.ts                           Deals, term-sheets, offers
      notifications.ts                   Notifications list
      use-deal-realtime.ts               SignalR deal events

  lib/
    api-creator-dashboard.ts             Dashboard + ideas + profile endpoints
    api-creator-ai.ts                    Clarifier + BusinessPlan + Forecast endpoints
    api-chat.ts                          Chat conversations + messages
    api-deals.ts                         Deals + term-sheets + offers
    api-notifications.ts                 Notifications endpoints
    creator-state-resolver.ts            getNextCreatorAction(state) → NextAction
    realtime/
      connection-manager.ts              SignalR ref-counted connection pool
      use-signalr-hub.ts                 useSignalRHub(hub) hook
      reconnect-policy.ts                Exponential backoff + jitter
      types.ts                           Hub paths, message types
    axios.ts                             Bearer token, refresh queue, axios config
    menu.ts                              Role-based sidebar menu
    roles.ts                             UserRole enum + ROLE_DASHBOARD_ROUTES

  types/creator/
    creator-journey.ts                   Phase, Project, Outputs, Document types
    ai.ts                                Clarifier, BusinessPlan, Forecast contracts
    dashboard.ts                         Idea, Stats, Profile, Billing types
    create-idea-model.ts                 Idea creation form shape
    project.ts                           Legacy Project type
    publicProfile.ts                     Public profile display
```

---

## 13. Known Design Risks & Gaps

| Risk | Severity | Description | Impact |
|------|----------|-------------|--------|
| **Mutation-on-load** | HIGH | Phase-1 reconcile shallow-copies, then mutates nested phase objects. If no draft, `loadedState === INITIAL_STATE`, corrupting the shared constant. | Could break other users' instances in the same browser session. |
| **Non-monotonic `completeStep`** | MEDIUM | Always sets status to `in_progress`, regressing a re-visited `completed` phase. | Users can "regress" a phase by revisiting it. |
| **Resolver/guard divergence** | MEDIUM | Resolver can return a phase the guard will bounce (no cross-validation). | User clicks "Resume", gets redirected to dashboard instead. |
| **Two messengers** | MEDIUM | Mock `/messenger` and live `/messages` can confuse users and developers. | Maintenance burden; unclear which to use. |
| **MVP placeholders** | MEDIUM | Settings, billing pagination, asset library have unwired controls. | Clicking buttons does nothing; implies missing features. |
| **Phase 1 completely blocked** | HIGH | Verification flow not implemented; users can't start. | Production blocker. |
| **Phase 2 discovery path unfinished** | MEDIUM | "Needs discovery" → AI chat (STUB) → concept generation (STUB). | Half of Phase 2 entry path is dead. |
| **Phase 2/3/4/5/6 sub-routes are stubs** | MEDIUM | Branding, logo, compliance, formation, pricing, crossroads, matching all missing UI/logic. | Users can't complete any phase end-to-end. |
| **No error handling UI** | MEDIUM | AI job failures don't surface to user; no retry pattern. | Silent failures; users don't know what went wrong. |
| **AI polling has no timeout** | MEDIUM | Could loop indefinitely if backend job hangs. | Poor UX; infinite loading state. |
| **No backend sync for phases 2–6** | MEDIUM | All state localStorage-only; multi-device journey diverges. | Mobile user can't resume on desktop. |
| **Forecast chart hardcoded fallback** | MEDIUM | Chart shows mock data even when forecast exists; doesn't bind live. | Users see placeholder instead of real forecast. |
| **Phase 3 completion gate missing** | MEDIUM | No validation before Phase 4 unlock; users can skip compliance/formation. | Incomplete compliance/formation when moving to Phase 4. |

---

## 14. Next Steps (Roadmap)

### Critical (Production Blocker)
1. **Implement Phase 1 KYC flow** — identity verification UI, document upload, backend gating.
2. **Fix mutation-on-load bug** — deep-clone INITIAL_STATE before mutating.
3. **Add error handling UI** — surface AI job failures, retry logic, user-facing errors.

### High Priority (Phase Completion)
4. **Phase 2 discovery path** — wire AI chat + concept generation (C-2 discovery variant).
5. **Phase 2 branding tools** — logo type, color palette, designer hire, logo generator.
6. **Phase 3 compliance & formation** — legal checklist UI, company formation workflow.
7. **Phase 4 pricing matrix** — buyout vs. license tier selection + valuation input.
8. **Phase 5 crossroads UI** — decision flow with messaging tie-in.
9. **Phase 6 investor matching** — matching algorithm + partner rendering + deal initiation.

### Medium Priority (Feature Completion)
10. **Backend sync for phases 2–6** — save journey state to server; enable multi-device resume.
11. **Consolidate messengers** — pick one (live `/messages`) as canonical; deprecate mock.
12. **Wire feature page controls** — settings, billing pagination, asset library actions.
13. **Add timeout to AI polling** — max duration + graceful failure.
14. **Forecast chart live binding** — render actual `ForecastOutput.data` instead of fallback.

---

## 15. Key Takeaways for Developers

1. **Journey is client-authoritative** — localStorage is the source of truth for phases 2–6. Phase 1 is backend-verified.
2. **Phases chain strictly** — Phase N must be completed before Phase N+1 unlocks; `advancePhase(N)` handles the transition.
3. **Outputs are versioned & immutable** — each AI regen pushes a new entry. Access latest via `versions.at(-1)`.
4. **CreatorProgressProvider is the hub** — all state flows through this. Don't bypass it with direct setState.
5. **SignalR hubs are ref-counted** — safe to use in multiple components; auto-cleanup handles teardown.
6. **Three independent gates stack** — AuthGuard → OnboardingGuard → CreatorPhaseGuard. Check all three when adding routes.
7. **Resolver drives navigation** — when unsure what route to show, call `getNextCreatorAction(state)`.
8. **localStorage debounces on mutation** — don't assume writes are synchronous. Persist is 500ms debounced.
