# Mondial Creator Journey — System Design

## 1. Purpose
A guided, 6-phase onboarding-to-funding pipeline for creators. Each creator moves from identity verification → idea → intelligence → pricing → a "buyout vs build" decision → investor matching. Progress is a client-owned state machine, persisted to `localStorage` and reconciled with the .NET backend for Phase 1.

## 2. Architecture layers

```
app/dashboard/creator/layout.tsx
  └─ CreatorProgressProvider          (context: state + mutators)
       └─ useCreatorProgressState()   (the state machine + persistence)
       └─ CreatorPhaseGuard           (route-level access control)
            └─ {page}                 (reads via useCreatorProgress())

src/lib/creator-state-resolver.ts     (getNextCreatorAction — "where do I go next")
src/types/creator/creator-journey.ts  (the data contract)
src/lib/axios.ts                       (backend sync: /onboarding/status)
```

| Layer | File | Responsibility |
|-------|------|----------------|
| Provider | `src/providers/CreatorProgressProvider.tsx` | Exposes `state` + mutators via React Context |
| State machine | `src/hooks/useCreatorProgressState.ts` | Owns journey state, persistence, backend sync |
| Guard | `src/components/layout/CreatorPhaseGuard.tsx` | Redirects out of locked phases |
| Resolver | `src/lib/creator-state-resolver.ts` | Pure fn → next action/route/CTA label |
| Contract | `src/types/creator/creator-journey.ts` | Types for journey, project, outputs |

## 3. The phase state machine

**6 phases**, each a `PhaseState` with a status lifecycle:

```
locked → available / available_not_started → in_progress → completed
                                                          ↘ skipped_for_now
```

| Phase | Domain | Entry route | Steps |
|-------|--------|-------------|-------|
| 1 | Identity & verification | `/phase-1` | 1 (verification) |
| 2 | Project identity & branding | `/phase-2` | 12 sub-steps (discovery→logo→complete) |
| 3 | Project intelligence | `/phase-3` | 6 (forecast→business-plan→compliance→formation→complete) |
| 4 | Offer & pricing | `/offer-pricing` | tracked as one |
| 5 | **The Crossroads** | `/crossroads` | decision: `selectedPath: 'buyout' \| 'build'` |
| 6 | Smart matchmaking | `/investors` | matching |

**Phase 2 is the most complex** — `currentStep` (1–12) maps to a sub-route via the resolver. Two entry paths converge: `already_have_idea` (→ clarifier) and `needs_discovery` (→ ai-chat/processing).

## 4. Routing & access control

Two complementary mechanisms:

**(a) Forward navigation** — `getNextCreatorAction(journeyState)` returns the next `{ route, targetPhase, targetStep, buttonLabel }`. It walks phases 1→6, returning the first non-`completed` one. This drives "Resume Setup" CTAs.

**(b) Access guard** — `CreatorPhaseGuard` enforces a route→phase matrix. If you hit a phase route while that phase is `locked`, it `router.replace('/dashboard/creator')`:

```
/phase-2      → blocked if phase2.status === 'locked'
/phase-3      → blocked if phase3.status === 'locked'
/offer-pricing→ blocked if phase4.status === 'locked'
/crossroads   → blocked if phase5.status === 'locked'
/investors    → blocked if phase6.status === 'locked'
```

> Gap: the guard only blocks `locked`, and the resolver can still return a route to a `locked` phase (it only checks `!== 'completed'`). The two aren't cross-validated.

## 5. State mutation API (Context surface)

```ts
updateProject(fields)                       // patch project fields
saveOutputVersion(outputKey, payload)       // append a versioned AI output
upsertDocument(doc)                          // add/replace a generated doc
completeStep(phaseNum, stepNum)              // mark step done, advance currentStep
setEntryPath('already_have_idea'|'needs_discovery'|null)
setCrossroadsPath('buyout'|'build'|null)     // Phase 5 decision
advancePhase(phaseNum)                        // complete phase N, unlock N+1
resetJourney()                                // wipe to INITIAL_STATE (keeps phase1)
```

**`advancePhase(N)`** is the unlock transition: sets phase N → `completed` (+`completedAt`), phase N+1 → `available`, `currentStep: 1`.

## 6. Data model (the three buckets)

```
CreatorJourneyData
├─ journeyState   { phase1..phase6: PhaseState }     ← the state machine
├─ project        { name, problem, solution,         ← the canonical idea
│                   clarityScore, branding{...}, ... }
├─ outputs        { financialForecastVersions[],      ← versioned AI artifacts
│                   businessPlanVersions[], ... }        (append-only history)
├─ documents[]    generated files (forecast PDF, ...)
├─ assets[] / conversations[] / notifications[] / activityHistory[]
```

`outputs` is **version-append** by design — each regeneration pushes a new entry, so `latestForecast = versions.at(-1)`.

## 7. Persistence & backend sync

- **Key:** `localStorage['mondial_creator_progress_draft']`
- **Write:** debounced 500ms (`SAVE_DEBOUNCE_MS`) on state change
- **Read:** on mount, deep-merged over `INITIAL_STATE` (backfills new fields for phase2/phase3/project/branding)
- **Backend reconcile:** on load, `GET /onboarding/status` → if `phase >= 1`, force `phase1 = completed` and unlock `phase2`. Backend is source of truth for verification only; phases 2–6 are client-authoritative (MVP).

```
mount → read localStorage → merge over INITIAL_STATE
      → GET /onboarding/status → reconcile phase1 → setState → isLoading=false
state change → debounce 500ms → write localStorage
```

## 8. Known design risks (from audit)
- **Mutation-on-load:** the verification reconcile shallow-copies then mutates nested phase objects — can corrupt the shared `INITIAL_STATE` constant when no draft exists.
- **`completeStep` is non-monotonic:** always sets `in_progress`, regressing a re-visited `completed` phase.
- **Resolver/guard divergence:** resolver can point at a phase the guard will bounce.
- **MVP boundary:** outputs/documents are mock-generated client-side; only Phase 1 verification touches the backend. Many feature pages (asset-library, settings, billing) are unwired placeholders.
