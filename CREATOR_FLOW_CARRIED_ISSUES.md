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
| CI-8 | Pricing seeds tiers by length, not existence (masked) | P4 — not reachable | latent inconsistency |
| CI-9 | Profile screen pins 37 font overrides, incl. a fourth family | P3 | typography debt |
| CI-10 | Monospace mapping undefined — numeric sites never rendered mono | P3 | design-intent divergence |
| CI-11 | Product never loaded any declared font (root cause, fixed 2026-07) | Record | historical root cause |
| CI-12 | Homepage display accents pin three families that never load | P3 | design-intent divergence |

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

**Progress (2026-07):** first step done — an in-flight guard on context hydration
(`useCreatorProgressState.hydrate`) collapses concurrent hydration attempts into one
request (cleared on settle, no caching). This is groundwork, not the traffic fix:
production is unchanged on a clean entry; the redundant volume is the ~dozen per-page
direct fetches above, still untouched.

**Constraint introduced by that guard (must survive here):** a caller that performs a
write and then re-hydrates to observe it can attach to a request that predates the
write and receive stale data. The existing such caller (`myideas` switch/create) is
safe only because it verifies `activeIdeaId === target` and fails into an error path.
Any future write-then-rehydrate caller MUST verify likewise, or bypass the shared
in-flight request.

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

## CI-8 — Pricing seeds tiers by length, not existence — masked, currently unreachable (P4)

**Defect (masked).** The Phase 4 pricing step seeds its tiers with a **length**
check — `initial?.tiers?.length ? initial.tiers : [defaults]` — so a saved block
containing **zero tiers** would fall back to the hardcoded defaults (empty-treated-
as-absent). This is the same pattern the GTM step deliberately **avoids** for its
audience list, where an **existence** check (`initial ? initial.targetAudiences ?? []
: [default]`) preserves a deliberately-empty selection. The two steps are
inconsistent about the empty-vs-absent distinction.

**Why it is NOT a live defect (the masking invariant).** Backend validation enforces
a floor: **3–5 tiers, each with ≥3 features** (`CreatorPhase4Controller.SetPricing`
returns 422 otherwise), and the frontend strips blank features on save. So an empty
(or sub-floor) tiers array can never be **persisted**, and therefore never comes back
from a saved block — the empty-as-absent branch is unreachable, and no deliberate
user choice is overwritten today. The features list has no independent reseed at all
(features ride inside each tier), so there is no features-level empty-as-absent path
either.

**The cross-layer dependency (why it still deserves recording).** The frontend's
safety here rests **entirely on that backend invariant**, and nothing near the
frontend code says so. If the tier/feature floor is ever relaxed on the backend, the
empty-as-absent overwrite returns silently — no compile-time signal, no test to
catch it, and the same class of data-loss the Phase 4 hydration work closed elsewhere.

**Where.**
- Frontend seed (length check): `src/components/creator/phase4/Phase4Pricing.tsx`
  (`initial?.tiers?.length ? … : [blankTier(...)]`).
- Contrast — GTM existence check: `src/components/creator/phase4/Phase4Gtm.tsx`
  (audiences: `initial ? initial.targetAudiences ?? [] : [default]`).
- Masking invariant: `backend/Controllers/CreatorPhase4Controller.cs:73-79`
  (3–5 tiers, ≥3 features each → 422).

**Blast radius.** None today (unreachable). Becomes a silent frontend overwrite of a
saved pricing block only if the backend tier/feature floor is relaxed.

**Fix sketch.** Switch the tiers seed to an **existence** check for consistency with
GTM (`initial ? initial.tiers ?? [] : [defaults]`, or seed defaults only when the
block is genuinely absent) — a change with **no reachable behavioural difference
today**, so it is safe to make whenever the file is next touched. It removes the
hidden dependency on backend validation rather than relying on it.

---

## CI-9 — Profile screen pins 37 font overrides, including a fourth family used exactly once (P3)

**Debt.** `src/components/founder/profile/profile.tsx` (rendered at
`/dashboard/creator/profile` — a dashboard surface) pins fonts with arbitrary
Tailwind classes: **36× `font-['Inter']`** on form inputs/fields and
**1× `font-['Inter Tight']`** on the "Edit Profile" page title (a styled `div`,
not a semantic heading). Under the global typography adopted in 2026-07 (Inter for
headings, DM Sans for body), these overrides silently keep the screen inconsistent
with everything around it.

**The fourth family.** Inter Tight appears exactly once in the product, and the
package `@fontsource/inter-tight` is installed in `package.json` solely for it —
except it was never imported, so the pin has always fallen back anyway. When this
file is cleaned up, remove the dependency too; do not leave a stray package behind
a single dead class.

**Why not fixed in the typography pass.** Removing the 36 input overrides changes
36 form fields visibly (Inter → DM Sans — correct under the new hierarchy, but a
visible change needing its own review). The title also needs a semantic tag or the
`font-heading` utility at the same time, or it lands in body font.

**Fix sketch.** Strip all 37 arbitrary font classes; convert the title to a
semantic heading (or apply `font-heading`); remove `@fontsource/inter-tight` from
`package.json`. Verify the form visually after.

---

## CI-10 — Monospace mapping undefined: numeric sites have never rendered monospace (P3)

**Divergence.** The Tailwind theme maps `font-mono` → `var(--font-geist-mono)`
(`src/app/globals.css` `@theme`), but `--font-geist-mono` is defined nowhere. The
declaration is invalid at computed-value time, so every `font-mono` element
**inherits** the surrounding font instead. The design intent is that numeric
values render in a monospace family; the reality is they never have.

**Scope (where `font-mono` is used):**
- `src/app/dashboard/creator/asset-library/page.tsx:70` (color hex labels)
- `src/app/dashboard/creator/phase-3/formation/page.tsx:191-193, 292` (capital/time/cost facts, input)
- `src/app/dashboard/creator/project-studio/page.tsx:196, 307` (hex labels, route paths)
- `src/app/dashboard/entrepreneur/(phases)/phase-2/step-1/client.tsx:77` (input)
- `src/app/dashboard/entrepreneur/(phases)/phase-9/client.tsx:704` (textarea)
- `src/components/creator/PlanForecastPrintView.tsx:91` (print table)
- `src/components/investor/NDAAcceptModal.tsx:105` (NDA text block)

Related: several stat values use `tabular-nums` (a feature of the inherited font,
which does work) — e.g. investor dataroom cards — so the numeric-alignment intent
is partially served by that instead.

**Why it is a decision, not a cleanup.** Restoring a real mono stack (delete the
dead mapping so Tailwind's default applies, or point it at a loaded mono font)
makes all the sites above visibly change typeface at once. Decide the family
first, then fix the mapping in one commit.

---

## CI-11 — The product never loaded any declared font (root cause; fixed 2026-07)

**Finding.** Until the 2026-07 typography work, no mechanism actually loaded a
font: `src/lib/fonts.ts` defined `next/font` instances but was imported nowhere;
`@fontsource/inter` (and `inter-tight`) were installed but never imported; there
were no `@font-face` rules or font `<link>` tags. CSS requested "Inter" by name,
so every screen rendered in the OS fallback (Segoe UI on Windows, SF on macOS)
while the code declared otherwise.

**Why record it.** It explains why the global typography change is visible on
every screen (first time declared fonts actually load), and it is a recurrence
risk: a font added by declaration alone fails **silently** — the browser falls
back without warning. Any future font addition must be wired through
`src/lib/fonts.ts` + the root layout `className`, and verified in the rendered
page (computed style / network request for the font file), not by reading CSS.

**Status.** Fixed for Inter and DM Sans (loaded via `next/font/google`). Still
latent for: `font-mono` (CI-10), Inter Tight (CI-9), and "Instrument Sans"
requested by name in `src/components/homepage/HeroSection.tsx` (marketing
surface, out of dashboard scope).

---

## CI-12 — Homepage display accents pin three families that never load (P3)

**Divergence.** The marketing homepage pins three display families by name, and
none of them is loaded anywhere — so all three have rendered in fallback since
they were written, and still do:

- **Playfair Display** — `HeroSection.tsx:102` (inline), `FeaturesSection.tsx:40`
  (`font-playfair` utility), `FeaturesSection2.tsx:226` (inline), `FAQ.tsx:90`
  (inline). Falls back to Georgia (the fallback stack's serif), so the
  serif-italic *intent* partially lands, but not the designed family. A ready
  `next/font` instance (`playfairDisplay`) already exists in `src/lib/fonts.ts`
  and is simply not imported in the root layout — the fix is a one-line import
  plus adding its variable to the html className, decided deliberately because
  it adds a font download to every route.
- **Instrument Sans** — `HeroSection.tsx:92` (the main hero headline). Nothing
  loads it (no package, no `next/font` instance); falls back to the system sans.
- **PP Editorial Old** — `Pricing.tsx:305`. A commercial family, not on Google
  Fonts; nothing loads it; falls back to a system serif.

**Why record rather than fix.** Same class as CI-9/CI-10/CI-11: loading these
changes visible marketing typography and (for PP Editorial Old) requires a
licensing decision. Marketing surface is out of scope for the 2026-07 dashboard
typography pass. Until fixed, treat homepage accent typography as *fallback
rendering, not design reference* when comparing against mockups.

---

*CI-1 through CI-8 filed during the Creator Phase 2 completion-page work (2026-07);
CI-9 through CI-12 filed during the global typography work (2026-07). No GitHub
issue tracker / `gh` CLI is configured in this repo; the established convention is
standalone markdown docs (`FIX_0N_*.md`, `*_AUDIT.md`), which this file follows.*
