# Creator Flow — Carried-Forward Issues

Defects and structural debt surfaced during the Creator Phase 2 completion-page
work (poll repair + backend-status gating, commits `78cab62` / `ff6c20d`) that
were **deliberately out of scope** for that change and filed here rather than
fixed. Each is standalone and actionable without the originating conversation.

Status legend: `OPEN` = not started. All six are OPEN.

Priority ordering (highest first): **CI-1** is the highest-priority item (largest
source of redundant traffic). CI-2 and CI-3 are structural and repo-wide. CI-4/5/6
are localized correctness / data-quality items.

| ID | Title | Priority | Kind |
|----|-------|----------|------|
| CI-1 | Un-deduplicated journey fetch surface | **P1 — highest** | performance / architecture |
| CI-2 | Optimistic advance feeds the client route guard | P2 | correctness / architecture |
| CI-3 | Phase 2 has no backend completion endpoint | P2 | structural asymmetry |
| CI-4 | Computed status has no `failed` value | P3 | type / derivation |
| CI-5 | Path A merges `Failed` and `NeedsReview` | P3 | inconsistency to verify |
| CI-6 | `advancePhase` rewrites `completedAt` on every call | P3 | data quality |
| CI-7 | `ResourceCalculation` type omits the fields Phase 4 uses | P3 | type drift |

---

## CI-1 — Journey endpoint has an un-deduplicated fetch surface (P1, highest)

**Defect.** The creator journey endpoint (`GET /creator/journey`) is fetched
redundantly across the Creator flow. Context hydration has **no in-flight guard,
no deduplication, and no cache-skip** — it issues a fresh request on every
provider mount — and roughly a dozen pages each fetch the same endpoint again
independently from their own mount effects. In development, React StrictMode
(framework default, not disabled in `next.config.ts`) double-invokes the
hydration effect, doubling that call too.

**Where.**
- Hydration, no dedup/guard/cache-skip: `src/hooks/useCreatorProgressState.ts:270-293`
  (`hydrate` always calls `creatorJourneyApi.get()`; the localStorage cache only
  seeds first paint, it never suppresses the fetch).
- Provider mounted once per segment entry: `src/app/dashboard/creator/layout.tsx:10`.
- Independent direct callers on mount: `src/app/dashboard/creator/phase-3/complete/page.tsx:46`
  **and** `:71` (twice), `.../phase-3/formation/page.tsx:68`,
  `.../phase-3/forecast-inputs/page.tsx:45`, `.../phase-3/forecast/page.tsx:70`,
  `.../phase-3/compliance/page.tsx:39`, `.../phase-3/business-plan/page.tsx:226`,
  `.../offer-pricing/page.tsx:47`, `.../crossroads/page.tsx:25`,
  `.../myideas/page.tsx:64`, `.../phase-2/complete/page.tsx:36`, and
  `src/components/creator/phase4/Phase4Complete.tsx:34`.
- **Pattern to follow already exists:** the creator dashboard home routes its
  fetch through TanStack Query with a shared key — `src/app/dashboard/creator/page.tsx:104`
  (`useQuery({ queryKey: ['creator','dashboardRefs'], queryFn: () => creatorJourneyApi.get() })`).

**Why it matters.** This is the largest source of redundant network traffic in the
Creator flow. Entering the segment fires 1–2 hydration calls (2 in dev), and then
each page a user visits fires its own identical GET on top, none deduplicated
against hydration or each other.

**Blast radius.** Whole Creator flow; every creator page mount. Read-only, so no
correctness risk — purely wasted requests and server load.

**Fix sketch.** Route the journey fetch through the existing query layer (TanStack
Query) with a single shared key + dedup/cache, exactly as the dashboard home
already does; or add an in-flight guard + short-TTL cache to `hydrate` and have
pages consume the context value instead of re-fetching. Prefer the former for
consistency with the established pattern.

---

## CI-2 — Optimistic advance feeds the client route guard (P2)

**Defect.** `advancePhase` writes phase status into **local** `journeyState`, and
`CreatorPhaseGuard` reads that same local status to decide route access, blocking
only when a phase is `locked`. So a purely optimistic local advance can admit a
route the backend has not actually unlocked, and — conversely — an optimistic
write that *regresses* a phase to a lower-but-still-non-locked status changes what
downstream UI renders while leaving navigation unaffected.

**Where.**
- `src/hooks/useCreatorProgressState.ts:466-475` (`advancePhase` — local status write).
- `src/components/layout/CreatorPhaseGuard.tsx:19-42` (reads `journeyState.phaseN.status`,
  blocks only on `'locked'`).

**Why it matters.** The route guard is a client-only gate keyed on optimistic local
state, not backend-derived truth. Concrete finding from the Phase 2 work: because
the guard admits on **any** non-locked status, an unconditional `advancePhase(2)`
that regressed an already-advanced `phase3` back to `available` hid as a **rendering
regression rather than a navigation failure** — navigation kept working while
dashboards showed stale/regressed state. The Phase 2 completion page now gates its
advance on staleness (commit `ff6c20d`), but the guard-reads-optimistic-local
design is pre-existing and repo-wide.

**Blast radius.** Every creator route gated by `CreatorPhaseGuard` (phase-2/3,
offer-pricing, crossroads, investors) and every caller of `advancePhase`.

**Fix sketch.** Have the guard consult backend-derived status (freshly fetched or
reconciled) rather than optimistic local state, or make `advancePhase` a backend
round-trip so local status can never diverge from server truth. Related to the
long-standing "advancePhase round-trip" backlog note in the canon.

---

## CI-3 — Phase 2 has no backend completion endpoint (P2)

**Defect.** Phase 3 and Phase 4 each expose a backend completion endpoint that
enforces module preconditions and returns `422` with the missing module. Phase 2
has **no equivalent** — advancement is a purely local `advancePhase(2)` call, so
there is no server-side precondition enforcement for the Phase 2 → Phase 3
transition.

**Where.**
- Present for P3/P4: `backend/Controllers/CreatorPhase4Controller.cs:203-224`
  (`PATCH /creator/offer/complete`), and the analogous masterplan-complete on
  `backend/Controllers/CreatorPhase3Controller.cs`.
- Absent for P2: no completion endpoint; frontend `src/app/dashboard/creator/phase-2/complete/page.tsx`
  relies on a fresh computed-status read (`phase3 !== 'locked'`) as **proxy**
  authority only.

**Why it matters.** Structural asymmetry. Phase 2 eligibility is enforced only by
derived computed status (itself a function of persisted project fields), never by
an authoritative server gate. Anyone assuming P2 has parity with P3/P4's 422
enforcement will be wrong.

**Blast radius.** Phase 2 → Phase 3 transition integrity; any future work assuming
a symmetric completion contract across phases.

**Fix sketch.** Add a Phase 2 completion endpoint that enforces name + non-zero
clarity score + branding method, returning `422` with the missing field like
P3/P4; have the completion page call it instead of (or in addition to) reading
computed status.

---

## CI-4 — Computed status vocabulary has no `failed` value (P3)

**Defect.** `ComputedPhaseState.status` is `locked | available | in_progress |
completed`. There is no `failed`. A failed asynchronous job (business plan,
forecast, clarifier, idea-generation) simply leaves its phase not advancing, which
is **indistinguishable from `locked`/incomplete**.

**Where.**
- Type: `src/types/creator/journey-api.ts:8-11`.
- Derivation: `backend/Services/Implementations/CreatorJourneyService.cs:201+`
  (`ComputePhaseStatusAsync`) emits only those four states; success is gated by
  `AiSessionSuccess.IsComplete(...)` with no failed surfacing.

**Why it matters.** Consumers cannot tell "a job failed" from "not started yet."
This directly shaped the Phase 2 not-ready state: it had to be phrased in terms of
**unfinished fields** ("finish naming / branding / idea setup") rather than job
failure, because the completion page cannot observe failure through computed
status. Phase 3/4 complete pages work around this by surfacing the completion
endpoint's `422` "missing module" message, but there is no first-class failed
state anywhere.

**Blast radius.** Any UI that wants to distinguish failure from incompletion — all
phase completion pages and the dashboards. Cross-cutting; a type + derivation
change.

**Fix sketch.** Add a `failed` value (and evaluate `needs_review`, see CI-5) to
`ComputedPhaseState.status` in both the backend derivation and the shared TS type;
thread AI-session `Failed` status into the derivation; update consumers to render
a distinct failed affordance.

---

## CI-5 — Path A merges `Failed` and `NeedsReview` (P3, verify)

**Defect (to verify, not confirmed).** The Path A idea-generation polling treats
`Failed` and `NeedsReview` as a single failure outcome. This was never verified
against the backend's `NeedsReview` semantics — if `NeedsReview` is a distinct,
possibly recoverable state, collapsing it into failure gives the user the wrong
affordance (retry/support instead of a review action).

**Where.** `src/app/dashboard/creator/phase-2/ai-processing/page.tsx:114-116`
(`status === "Failed" || status === "NeedsReview"` → `handleFailed(...)`).

**Why it matters.** Correctness of the Path A discovery UX depends on whether
`NeedsReview` means the same thing as `Failed`. File as an **inconsistency to
check**, not a confirmed bug. (The Phase 2 completion work deliberately declined
to merge the two on the clarifier side for the same reason.)

**Blast radius.** Path A (Discovery) idea-generation failure UX only.

**Fix sketch.** Read the backend's `NeedsReview` semantics for idea-generation
sessions; if distinct from `Failed`, give it its own affordance and stop merging
them.

---

## CI-6 — `advancePhase` rewrites `completedAt` on every call (P3)

**Defect.** `advancePhase` stamps `completedAt: new Date().toISOString()`
unconditionally on each invocation, so repeated calls overwrite the timestamp with
the time of the most recent advance rather than the true first-completion time.

**Where.** `src/hooks/useCreatorProgressState.ts:471`.

**Why it matters.** `completedAt` is unreliable as a record of **when** a phase was
actually completed — every re-advance (e.g. revisiting a completion page and
clicking Continue) moves it forward. Semantically harmless to gating today, but it
corrupts the field for any audit/analytics/ordering that reads it.

**Blast radius.** Any current or future consumer of `completedAt` (no visible
consumer today — latent data-quality issue).

**Fix sketch.** Only set `completedAt` on the `locked → completed` transition (do
not overwrite when already set), or remove the field if it has no consumer.

---

## CI-7 — `ResourceCalculation` type omits the fields Phase 4 actually uses (P3)

**Defect.** The shared `ResourceCalculation` type in the creator journey API layer
models only the calculator's **outputs** (budgets, running cost, time-to-launch,
breakdown percentages). It omits the two **input** fields the Phase 4 resource step
reads back on re-entry — `teamRequirements` and `saasStack` — which the backend
persists and returns as part of the resource block. To keep the Phase 4 hydration
change scoped, those fields were typed **locally** inside the resource step as
`SavedResourceCalculation = ResourceCalculation & { teamRequirements?; saasStack? }`
rather than by extending the shared type. That was the right call at the time, but
it leaves the component's local type as the *only* description of the real shape.

**Where.**
- Shared type (incomplete): `src/lib/api-creator-journey.ts:349-353`
  (`interface ResourceCalculation` — outputs only).
- Local augmentation (the only description of the full shape):
  `src/components/creator/phase4/Phase4Resource.tsx` (`type SavedResourceCalculation`),
  and the host's mirror in `src/app/dashboard/creator/offer-pricing/page.tsx`
  (`SavedPhase4Data.resourceCalculation` intersection).
- Backend source of truth: `CreatorResourceCalculation` in
  `backend/Models/DatabaseModels/CreatorJourney.cs:240-250` (carries
  `TeamRequirements` + `SaasStack` alongside the outputs).

**Why it matters.** The shared type and the local type describe the same backend
object but only the local one is complete. If someone later extends the shared
`ResourceCalculation` working from it — or the backend response shape changes —
the two definitions can **drift apart with no compile error to catch it**, because
the intersection silently masks the omission. A consumer trusting the shared type
would not see `teamRequirements`/`saasStack`; a consumer trusting the local type
could go stale against the backend.

**Blast radius.** Localized today (Phase 4 resource step + the wizard host), but it
is a latent correctness trap for anyone extending the shared type or adding a new
consumer of the resource block.

**Fix sketch.** Extend the shared `ResourceCalculation` type to include
`teamRequirements` and `saasStack`, and remove the local `SavedResourceCalculation`
augmentation (and the host's intersection) so there is a single description of the
shape. **Verify the added fields against the actual backend response** (inspect a
real `GET /creator/journey` payload or `CreatorResourceCalculation`), **not**
against the local type — the local type is itself unverified and must not be
treated as the reference.

---

*Filed during the Creator Phase 2 completion-page work (2026-07). No GitHub issue
tracker / `gh` CLI is configured in this repo; the established convention is
standalone markdown docs (`FIX_0N_*.md`, `*_AUDIT.md`), which this file follows.*
