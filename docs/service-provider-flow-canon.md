# Mondial.eco — Service Provider System Design (Canonical)

Source of truth for development. When code and this doc disagree, this doc wins — unless a change is agreed and written back here first.

**Last reconciled with code: 2026-07-27.** See the Changelog (bottom) for what changed. If a claim here contradicts the code, treat it as drift to reconcile — not a spec to build back toward — and confirm before acting.

## 0. How to use this doc

The complete system-design reference for the Service Provider (SP) system: architecture, every module (built and planned), the database picture, the AI decision, and the design system. Two standing instructions for any implementer:

1. Do not invent phases, steps, or features not written here.
2. When a request contradicts this doc, flag the contradiction and confirm before proceeding — do not silently comply.

Every feature carries a STATUS tag:

- **LIVE** — built and canon-correct
- **STUB** — built but fake/placeholder (works, not the real thing)
- **PLANNED** — specced here, not built yet
- **FORBIDDEN** — must never be built (violates a core rule)

Section map: **§1** architecture · **§2** AI (none) · **§3** design system · **§4** database · **§5** Module 1 Profile & Trust (LIVE) · **§6** Module 2 Service Catalog · **§7** Module 3 Leads · **§8** Module 4 Workroom & Earnings · **§9** Module 5 Analytics & Growth · **§10** cross-cutting rules · **§11** SP journey (product experience) · Appendix + Changelog.

---

## 1. Architecture principles (locked)

### 1.1 No phases — a single verification gate, then a flat dashboard

The SP experience is **one verification gate, then a flat dashboard**. There is no phase-numbered wizard of any kind. Once approved, the entire dashboard opens at once — a **Fiverr/Upwork model** of independent sections, worked in any order. No sequential unlock.

**The gate in code (LIVE, unchanged):**
- **Universal Gate** — the shared KYC/onboarding gate every role passes (`OnboardingGate`; sets `Tier_level` to at least 1). Not SP-specific.
- **Verification/Onboarding** — the provider fills their profile and submits; an admin approves. Carried by two fields on `ServiceProviderProfile`:
  - `CurrentPhase` — an int that **only ever holds 1 or 2** (a profile-completeness marker, advanced one-way 1→2 by `MaybeAdvancePhase` when `IsProfileComplete`). It is **not** a journey counter and must never be grown into one.
  - `VerificationStatus` (`ServiceProviderVerificationStatus`) — `Pending → UnderReview → Verified | Rejected` (a `Rejected` profile may resubmit → `UnderReview`). Owner submits via `submit-verification`; admin drives the decision (`ApproveVerificationAsync` / `RejectVerificationAsync`, with `GetPendingVerificationsAsync` for the queue).

Crossing to `Verified` is what opens the flat dashboard.

**Superseded planning models (never implemented — do not cite as history):** a **9-phase / archetype** model (Builder/Structural/Deal SP) and a later **7-phase / Tier-1–4** model. Neither exists in code. The enterprise planning file `docs/mondial-eco-mvp-final-docs/05_Service_Provider_Journey_v2.0_Enterprise.docx` describes one of these unbuilt journeys — treat it as superseded input; this canon supersedes it.

### 1.2 Five sections, in data-dependency order (not a user sequence)

A verified SP sees all five at once. The order is **build order** (each produces data a later one reads) — **not** a sequence the user walks through:

**Profile & Trust (§5) → Service Catalog (§6) → Leads (§7) → Workroom & Earnings (§8) → Analytics & Growth (§9).**

### 1.3 Storage rule — embed the bounded profile, collection-per-module after that

`ServiceProviderProfile` (with its embedded trust record and skills-test attempts) **stays embedded on `ApplicationUser`** — bounded (one profile, one `TrustScoreBreakdown`, a cooldown-capped `SkillsTestAttempts` list). **Every module from Service Catalog onward gets its own top-level MongoDB collection** (`ServiceListings`, `ClientBriefs`, `WorkroomEngagements`, …), keyed by `ProviderId`/`UserId`.

> **FORBIDDEN:** embedding unbounded data (listings, engagements, leads, transactions, time entries) as arrays on `ApplicationUser` or `ServiceProviderProfile`.

### 1.4 Commission — flat 12%, Workroom layer, tier-independent

Commission is a **flat 12% platform rate, Fiverr-style**, applied **once, at the Workroom & Earnings escrow-release layer** (§8) on **every completed transaction**. It is **completely independent of `Tier_level` and `TrustScore`** — no sliding scale, discount, or surcharge by tier or reputation. The **12%** is a single §8 config value (one source of truth), never hardcoded per call site. **Not implemented yet** (Module 4 is unbuilt) — the number is locked here for when it is.

> **FORBIDDEN:** deriving commission from `Tier_level`, `TrustScore`, or any reputation/ranking input.

### 1.5 `Tier_level` — ranking/matching only (existing field)

`ApplicationUser.Tier_level` (`int`, `ApplicationUser.cs:47`). Generic platform ranking weight, used **only** by matching (§1.7) and exposed as a **ranking-only badge** by Module 1 (§5.4). **No pricing, commission, or payout relationship of any kind** (§1.4).

### 1.6 `Trust_score` — legacy fallback (existing field, untouched)

`ApplicationUser.Trust_score` (`int`, `ApplicationUser.cs:48`) is **separate** from `ServiceProviderProfile.TrustScore` (the double Module 1 derives). It exists **only** as `SpMatchingService`'s fallback for `rating` when the derived score has no data yet (`sp.TrustScore > 0 ? sp.TrustScore : u.Trust_score`). Module 1 did **not** modify, migrate, or reconcile it. Leave as-is; reconciliation is deferred (§4.3).

### 1.7 Existing matching engine — `SpMatchingService` (LIVE)

Ranks `Tier_level >= 2` verified providers in the requested `ServiceCategory`:

`score = sectorOverlap×0.35 + rating×0.25 + responseRate×0.20 + tierNorm×0.20`

- **`rating`** = `sp.TrustScore > 0 ? sp.TrustScore : u.Trust_score`, normalized (§1.6).
- **`tierNorm`** (`SpMatchingService.cs:40`) = `Tier_level >= 3 ? 1.0 : == 2 ? 0.7 : 0.4`.
- **`responseRate`** — **STUB:** hardcoded `0.85` (`SpMatchingService.cs:48`, `TODO`). Retired by Leads (§7), not before.

It owns **no collection** — it queries `ApplicationUsers` directly. Leads (§7) reuses this exact formula as the "Brief Match Score"; it must not spawn a parallel scoring engine.

---

## 2. AI — the SP system uses NONE (permanent)

**Permanent architectural decision: the SP system uses no generative AI anywhere.** Not now, not as a future-upgrade stub. Every feature that *sounds* AI-branded is deterministic.

### 2.1 The "smart-sounding" features are deterministic

- **Brief Match Score** (§7) = the `SpMatchingService` weighted formula (§1.7). Not an LLM call.
- **Pricing guidance** (§6) = a deterministic suggested-price-range lookup by `ServiceCategory`. Not AI, no upgrade path.
- Any **"suggested keywords" / "suggested next steps"** style feature, *if* built, must be a **rule-based lookup/trigger** — never generative text.

### 2.2 No AI-implying names — rename on sight (from the Stitch mockups)

The Stitch mockups label features with AI/generative-sounding names. **None exist in code or in this doc's active spec** (Modules 3–4 unbuilt); this table locks the deterministic naming so an implementer renames on sight.

| Mockup name (do NOT use) | Canon name | What it deterministically is |
|---|---|---|
| "AI Push" | **Featured Push** | A lead **source category** (platform-surfaced/featured lead), §7. A routing/surfacing flag, no model. |
| "AI Match" / "AI Brief Match Score" | **Brief Match Score** | The `SpMatchingService` weighted formula (§1.7, §7). Not an LLM call. |
| "AI keyword suggestions" | **Suggested Keywords** *(if kept)* | A Catalog helper (§6): a **deterministic lookup** (category → common keywords), never generated. Not decided/built. |
| "Deal Intelligence" | **Opportunity Snapshot** | A negotiation-panel view of **static/computed data only** — match score, client stats, brief facts (§7). No AI analysis. |
| "Smart Actions" | **Suggested Next Steps** | If built, **deterministic rule triggers only** (e.g. "no response in 48h → follow up"). Never LLM text. |
| "Improve Tone" | **DROPPED — do not build** | A messenger tone-rewrite button. A real tone rewrite is inherently generative with no honest non-AI version → **removed entirely**, not renamed. **FORBIDDEN.** |

**Rule:** every SP feature name must describe a deterministic mechanism. If a name implies the software "thinks", "generates", or "understands", it's wrong — rename or drop it before it reaches code.

### 2.3 Context — the platform's real AI stack (SP does not participate)

So nobody assumes AI is simply unavailable: the platform has a working AI stack used by the **Creator** flow — `IAiProvider.CompleteAsync`, the async job framework (`AiJobType` + `IAiTaskHandler` + Hangfire + session/poll, behind Business Plan / Forecast / Idea Generator/Clarifier), credit metering (`AiCreditService`/`AiUsageService`), and model routing pinned to **OpenRouter only**, free-tier `openai/gpt-oss-20b:free`. **SP touches none of it, by decision.**

### 2.4 Why no AI for SP

Shared free-tier quota (~50 req/day, deliberately protected); deterministic pricing ranges and match scores are transparent and repeatable (an LLM adds cost/latency/unpredictability for no gain); and there is no marketplace pricing dataset to ground a "smart" number against — it would be invented.

---

## 3. Design system (verified against code)

SP UI uses the existing design system only — light theme, single blue accent, theme tokens from `globals.css` (never `#hex` in components). **Typography, verified against `src/lib/fonts.ts`, `src/styles/fonts.css`, `src/app/globals.css`:**

- **Headings — Inter** (`--font-inter`, exposed as `--font-heading`). Loaded via `next/font/google`, applied in `layout.tsx`.
- **Body — DM Sans** (`--font-dm-sans`, exposed as `--font-sans`).
- **Mono — token `--font-mono`, UNRESOLVED.** It aliases `--font-geist-mono`, **deliberately undefined/unloaded** (`globals.css`, issue **CI-10**) — no mono webfont is imported, so mono falls back to system monospace. Out of SP scope to fix; do not assume a loaded mono face.
- **Playfair Display** (`--font-playfair`) is loaded but **not applied globally** — available-but-unused.

> **Correction (propagated doc-wide):** SP does **NOT** use **Syne** or **JetBrains Mono** — neither is installed anywhere in the codebase. No SP doc or UI copy may reference that trio.

---

## 4. Database — what's real vs. what's planned

**Verified reality (2026-07-27):** *all* SP data today lives **embedded in the single `ApplicationUsers` collection**. **No SP-specific top-level collection exists yet** — confirmed by grep: no `ServiceListing` / `ClientBrief` / `WorkroomEngagement` model, no `MongoDbContext` registration.

### 4.1 `ApplicationUsers` (existing top-level collection) — SP-relevant contents

Registered as `GetCollection<ApplicationUser>("ApplicationUsers")` in `DbContext/MongoDbContext.cs`. SP fields on `ApplicationUser` (exact names):

- `Tier_level` (`int`) — ranking/matching only (§1.5).
- `Trust_score` (`int`) — legacy matching fallback (§1.6).
- `ServiceProviderProfile` (embedded object):
  - `ProviderId` (`string`), `CurrentPhase` (`int`, default 1)
  - `VerificationStatus` (`ServiceProviderVerificationStatus`), `VerificationSubmittedAt` (`DateTime?`), `VerifiedAt` (`DateTime?`), `RejectionReason` (`string`)
  - `TrustScore` (`double`) — derived (§5.1)
  - `Skills` (`List<string>`), `ServiceCategories` (`List<ServiceCategory>`), `PortfolioItems` (`List<PortfolioItem>`)
  - `Headline` (`string`), `Bio` (`string`), `Industries` (`List<string>`), `Languages` (`List<string>`), `PricingModels` (`List<PricingModel>`)
  - **Module 1 additions:** `TrustBreakdown` (`TrustScoreBreakdown`), `HasEnoughTrustData` (`bool`), `SkillsTestAttempts` (`List<SkillsTestAttempt>`)
  - `CreatedAt` (`DateTime`), `UpdatedAt` (`DateTime`)

Embedded types (all nested in `ServiceProviderProfile`; none has its own collection):
- **`TrustScoreBreakdown`** — `ClientSatisfaction`, `OnTimeDelivery`, `ResponseRate`, `RepeatClientRate`, `SkillTest` (each a `TrustSignal`); `HasDisputes` (`bool`); `DisputePenalty` (`double`); `LastRecalculatedAt` (`DateTime?`).
- **`TrustSignal`** — `HasData` (`bool`), `Value` (`double`).
- **`SkillsTestAttempt`** — `Category` (`ServiceCategory`), `Score` (`int`), `Passed` (`bool`), `TakenAt` (`DateTime`), `NextEligibleRetestAt` (`DateTime`).
- **`PortfolioItem`** — `Title`, `Description`, `Url`, `ImagePath` (`string`), `AddedAt` (`DateTime`).

**Storage-rule check:** ✅ compliant (§1.3) — the profile is bounded, so embedding is correct.

### 4.2 Shared enums — reuse, never fork

Authoritative vocabulary for the whole SP domain; every module reuses these, none defines a parallel list.

- **`ServiceCategory`** (`ApplicationUser.cs:359`): `Development, Design, Marketing, Legal, Finance, Accounting, Operations, Strategy, DueDiligence, FundraisingSupport, AiAutomation, HrRecruitment, Other`.
- **`PricingModel`** (`ApplicationUser.cs:380`): `FixedPrice, Hourly, MonthlyRetainer, ProjectBased, EquityCompensation, RevenueShare, Other`.

> **Ordinal-stability (hard rule):** both are **serialized as Int32 ordinals**. Existing entries keep their order and `Other` stays last — new values are **appended only**. Reordering silently corrupts every stored document. (There is no "milestone-based" or "custom quote" pricing model — if wanted, they must be appended as a deliberate decision.)

### 4.3 Collections — real vs. planned

**EXISTS today:**
- **`ApplicationUsers`** — holds everything above (embedded).
- The skills-test question bank is **static in-code** (`SkillsTestQuestionBank.cs`), **not** a collection.

**Naming convention (verified against `MongoDbContext.cs`):** the **entity class is singular** PascalCase; the **collection string is its plural** (`ApplicationUser` → `"ApplicationUsers"`, `DealExecution` → `"DealExecutions"`, `Conversation` → `"Conversations"`). Where a class carries a `Record`/`Model`/`Entity` suffix, the collection drops it and pluralizes the core noun (`EntrepreneurProfileRecord` → `"EntrepreneurProfiles"`, `ContactModel` → `"Contacts"`). A few **legacy** classes are themselves plural (`BusinessIdeas`, `Investments`, `Transactions`, `Companies`) — **do not copy that**; new SP models follow singular-class → plural-collection.

**PLANNED (not built — do not describe as existing).** For each, the model class and collection string are stated side by side:
- **Model `ServiceListing` → collection `"ServiceListings"`** (Module 2, §6) — listings + Basic/Standard/Premium package records + `Impressions`/`Clicks` counters. Top-level.
- **Model `ClientBrief` → collection `"ClientBriefs"`** (Module 3, §7) — client-authored requests, 72h TTL. Top-level.
- **Model `WorkroomEngagement` → collection `"WorkroomEngagements"`** (Module 4, §8) — milestone/escrow engagements, revision/dispute state, earnings. Top-level.

**Deferred decision:** whether the legacy `Trust_score` int (§1.6) is retired once the derived `TrustScore` has broad data coverage. Not urgent.

---

## 5. Module 1 — Profile & Trust — **LIVE**

**Commits:** `b29bcde` (backend) / `5e2da20` (frontend), on `dev-hafiz` (both verified present).
**Verification at ship:** backend build 0 errors, frontend `tsc` 0 errors, 100/100 SP unit tests passing.

Extends the embedded `ServiceProviderProfile` into a trust/reputation layer. Rendered on the SP profile workspace **only when `VerificationStatus == Verified`** — post-approval and non-blocking.

### 5.1 Derived TrustScore (never hand-set) — LIVE

`ServiceProviderProfile.TrustScore` (double, 0–100) is **DERIVED**. `RecalculateTrustScore` is its **sole writer** — no endpoint hand-sets it. It renormalizes the weighted average **across only the signals that have data**, so a single available signal scores on the full 0–100 range, not capped at its weight.

| Signal | Weight | Data source | Status |
|---|---|---|---|
| Client Satisfaction | 40 | Workroom & Earnings (§8) | **PLANNED** (no producer yet) |
| On-time Delivery | 25 | Workroom & Earnings (§8) | **PLANNED** |
| Response Rate | 15 | Leads (§7) | **PLANNED** |
| Repeat-Client Rate | 10 | Workroom & Earnings (§8) | **PLANNED** |
| Skill Test | 10 | §5.3 | **LIVE** |

- **Dispute Penalty** is **not** part of the 100 base — it is **subtracted afterward, unnormalized, only when disputes exist** (`HasDisputes`). Always 0 today (no producer).
- **Renormalization example:** with only the skills-test signal present, `score = skillTestValue` (a 90% test → TrustScore 90), not 9.

### 5.2 Neutral "not enough data" state — LIVE

`HasEnoughTrustData` is **false until at least one signal has data** — **the skills test alone is sufficient** to flip it true. While false, the derived score is 0 and the UI shows a neutral "building your trust score" state and **ignores** the number. On approval, `RecalculateTrustScore` runs against an empty breakdown, so a freshly-verified provider reads as neutral (this replaced the old hand-set 50 baseline).

### 5.3 Skills Test — LIVE mechanism, STUB content

Optional, non-blocking, post-verification.

- **Question bank** — `SkillsTestQuestionBank.cs`, static in-code, per `ServiceCategory`. **STUB content:** a small manually-authored generic-professional placeholder set re-tagged per category — not production per-category content (authoring that is deferred). Correct answers are server-side only, never sent to the client.
- **Mechanism (real):** random 5-question selection; server-side auto-grade; **70% pass**; **30-day cooldown** via `NextEligibleRetestAt` (read-time check, no Hangfire). A recorded attempt feeds the Skill Test signal and triggers `RecalculateTrustScore`. Signal value = mean of the most-recent attempt score per distinct category.

### 5.4 Tier badge — ranking-only — LIVE

`tierLevel` (from `Tier_level`, §1.5) is on the trust response and rendered as a **ranking-only** badge, visually distinct from the score. **No commission/pricing/payout language near it** — tooltip says it affects match ordering only.

### 5.5 Endpoints (all `/api/service-provider`, `[Authorize]`, owner-scoped, `ApiResponse`)

`GET trust` · `GET skills-test/status` · `GET skills-test/questions?category=` · `POST skills-test/submit`. All map through the controller's `Map<T>()` onto the shared envelope.

### 5.6 Files

**Backend:** `Models/DatabaseModels/ApplicationUser.cs` (embedded `TrustScoreBreakdown`, `TrustSignal`, `SkillsTestAttempt`), `Services/Implementations/SkillsTestQuestionBank.cs` (new), `Services/Implementations/ServiceProviderService.cs` (recompute + 4 methods; approval recomputes), `Services/Interface/IServiceProviderService.cs`, `Models/Dtos/ServiceProviderDtos.cs`, `Controllers/ServiceProviderController.cs`, `tests/WebApp.Tests/Unit/ServiceProviderServiceTests.cs`.
**Frontend:** `components/serviceprovider/TrustAndSkillsSection.tsx` (new), `components/serviceprovider/ProfileWorkspace.tsx`, `lib/api-service-provider.ts`, `types/service-provider.ts`, `hooks/queries/service-provider.ts`.

---

## 6. Module 2 — Service Catalog — **PLANNED** (decisions locked, not built)

**Purpose.** The provider's offerings, Fiverr-style: discrete, priced service listings a client (or the matcher) can browse. Depends on a verified profile; produces the impression/click data Analytics (§9) later aggregates.

**Storage.** New top-level collection — **model `ServiceListing` → collection `"ServiceListings"`** (§4.3 convention), keyed by `ProviderId`. Per-listing fields:
- `ServiceType` / `Title` / `Description`
- `ServiceCategory` (reuse the enum, §4.2)
- `IndustryFocus` (reuse the profile's free-form industry vocabulary)
- `GeographicCoverage` (e.g. remote / country / region list)
- `PricingModel` (reuse the enum, §4.2 — `FixedPrice, Hourly, MonthlyRetainer, ProjectBased, EquityCompensation, RevenueShare, Other`) + price fields appropriate to the model
- **Package records** (see Logic) + **event counters** (see Logic)

**Logic (locked).**
- **Basic / Standard / Premium are structurally distinct package records, NOT UI labels on one object** — each its own record (or first-class sub-document with its own id, price, scope) so a booking and its analytics/earnings attribute precisely. Do not model the three as three string fields on one listing.
- **Per-service `Impressions` / `Clicks` counters are added at build time** — even though Analytics (§9) ships later — so Analytics never launches on zero history. Increment server-side on listing render/interaction. (This module does **not** build any aggregation/display for them; it only ensures the fields exist and get incremented.)
- **Pricing guidance = permanent deterministic** suggested-price-range lookup by `ServiceCategory` (optionally refined by `PricingModel`), shown as **guidance, not a quote**. **No AI, ever** (§2); no competitor benchmark (no marketplace pricing data exists to benchmark against).

**Sub-features.**
- Listing CRUD (create / update / publish / unpublish / delete), owner-scoped.
- Package management (the Basic/Standard/Premium records).

**Open decisions — candidate fields from the Stitch mockups (NOT approved; pending confirmation).** Surfaced from design; **do not treat as settled scope** — each needs a yes/no before it enters the schema:
- **Per-package delivery time** (in days).
- **Per-package revision count.**
- A **"screens / units included"** field.
- A **buyer-requirements questionnaire** (client answers before ordering).
- An **FAQ builder** per listing.

**Dependencies.** Reads: verified profile (§1.1), shared enums (§4.2). Produces: impressions/clicks → Analytics (§9).

---

## 7. Module 3 — Leads — **PLANNED**

**Purpose.** Turn the existing matching flow into a provider-facing **inbox / pipeline** of inbound interest — the module that makes the SP match surface actionable, and where the **real response-rate metric** is built.

**Storage.** New top-level collection — **model `ClientBrief` → collection `"ClientBriefs"`** (§4.3 convention) — client-authored requests, with a **72-hour TTL** (MongoDB TTL index) so stale briefs auto-expire. Lead/pipeline state (new / viewed / responded / declined) tracked per provider. Builds on `SpMatchingService` (§1.7) — **no parallel scoring engine.**

**Logic.**
- **Brief Match Score = the existing `SpMatchingService` formula** (§1.7), reused as-is. Deterministic, **not** AI (§2).
- **Real Response Rate (retires the `0.85` STUB).** Build the actual metric from **lead/message response timestamps** (time-to-first-response vs. a window). Once live it **replaces the `0.85` placeholder** in `SpMatchingService.cs:48` **and** feeds the **Response Rate trust signal (15%)** in §5.1 — closing one of the four PLANNED signals. Retired **by this module, not before**; until then matching keeps the constant and the signal stays `HasData = false`.
- **Real-time Availability Signal** affects **match priority** (available ranks ahead of away). Must not silently become a commission or trust input.

**Sub-features.** Lead inbox/pipeline UI + state transitions; availability toggle.

**Open decisions.** Response-window definition (hours to "responded"); whether the availability signal is a ranking weight or a hard pre-filter.

**Dependencies.** Reads: catalog listings (§6), `SpMatchingService` (§1.7). Produces: response-rate → matching (§1.7) + the Response Rate trust signal (§5.1).

---

## 8. Module 4 — Workroom & Earnings — **PLANNED**

**Purpose.** The delivery + money module: run an engagement kickoff → paid, including escrow, revisions, disputes, and **commission**. **Produces the four still-PLANNED trust signals** — Client Satisfaction (40), On-time Delivery (25), Repeat-Client Rate (10), and the Dispute Penalty — that §5.1 consumes.

**Storage.** New top-level collection — **model `WorkroomEngagement` → collection `"WorkroomEngagements"`** (§4.3 convention), keyed by provider + client + listing: milestones, escrow state, invoice, revision count, review/dispute windows, timestamps.

**Logic (locked rules).**
- **Milestone + escrow via Stripe.** Funds escrowed per milestone, released on client acceptance (or auto-release, below).
- **Atomicity:** a release is **one atomic operation** — milestone status update **+** escrow release **+** invoice update commit together (all-or-nothing). Never money-moved-but-invoice-didn't (or vice-versa).
- **Windows / limits:** **48-hour** client review window on a submitted milestone; **max 3 revisions** per milestone; **7-day auto-release** if the client neither accepts nor disputes (a **Hangfire** job — see §10); **5-day dispute review** once opened.
- **Flat 12% commission applied HERE, at release** (§1.4): the single flat 12% platform rate deducted on payout, tier-independent. The **only** place commission is computed.
- **Trust-signal production:** acceptance/rating → Client Satisfaction; on-time vs. window → On-time Delivery; repeat engagements per client → Repeat-Client Rate; opened/upheld disputes → Dispute Penalty (subtracted). Each recompute goes through `RecalculateTrustScore` (§5.1) — never hand-set.

**Sub-features.**
- **Hourly Time Tracker** (for `Hourly` listings — logged time → invoice).
- **Repeat Client Coupon System** (provider-issued repeat-client discount).
- **Payout Method Setup** — **Stripe Connect / Wise / Bank / PayPal.**
- **Tax / VAT Invoice Settings** (invoice identity, VAT handling).

**Open decisions.** Whether repeat-client **coupon counts are tier-linked** — a **reward** tied to `Tier_level`, **NOT** a commission mechanic (must stay clear of the commission path, §1.4) — **not yet decided**. Dispute-resolution authority (admin-mediated vs. automated) and its effect on Dispute Penalty magnitude.

**Dependencies.** Reads: leads (§7), catalog (§6), commission config (§1.4). Produces: satisfaction / on-time / repeat / dispute → trust (§5.1); earnings/dispute data → Analytics (§9).

---

## 9. Module 5 — Analytics & Growth — **PLANNED (built last)**

**Purpose.** A **pure read/aggregation layer** over everything Modules 2–4 produce: catalog performance, response behaviour, earnings, dispute/quality trends.

**Storage.** **No new source-of-truth data and no user input.** Aggregates existing data only — catalog impressions/clicks (§6), response-time/response-rate (§7), earnings/dispute/delivery (§8).

**Logic.** Read-side aggregation/rollups only (counts, rates, trends). Introduces no new writes, so it is **built last by design** — nothing to aggregate until upstream modules exist and accrue history (why §6 starts its counters early).

**Open decisions.** Rollup strategy (on-read vs. periodic materialized rollups) — a scale decision, deferred until data volume is known.

**Dependencies.** Reads everything above; produces nothing consumed elsewhere.

---

## 10. Cross-cutting technical rules (every module)

1. **Auth + ownership on every endpoint.** JWT `[Authorize]` at the controller; every action is **owner-scoped** — the `ProviderId`/`UserId` comes from the authenticated principal, never a request field. An SP can only read/write its own data.
2. **`ApiResponse` envelope on every response.** No bare `Ok(obj)` or ad-hoc shapes; the service layer returns `ServiceProviderResult<T>` and the controller maps it via `Map<T>()`.
3. **No browser storage as source of truth.** No `localStorage` / `sessionStorage` for SP state — the backend is authoritative; a read-through paint cache is the only permitted client cache and must never diverge.
4. **Every time-based rule is backed by a real Hangfire job**, not just a UI countdown — 72h brief TTL (§7, via TTL index), 7-day auto-release + dispute windows (§8). A UI timer alone is never the enforcement mechanism. (Exception, by design: the skills-test 30-day cooldown is a **read-time** check, §5.3 — no job needed.)

---

## 11. The Service Provider journey (product experience)

This is the **experience** order — what a real SP lives through, in the order they live it — **distinct from §1.2's data-dependency build order** (that's for developers). Because there are **no phases** (§1.1), the journey is not enforced by gating; it is shaped by **smart empty-states and dashboard nudges**. Each step is tagged **LIVE** (built today) or **PLANNED** (Modules 2–5, not built) so the narrative never implies unbuilt behavior exists.

### 11.1 First-time flow (signup → verified) — **LIVE (existing, unchanged by the redesign)**

1. **Universal Gate** — the shared KYC/onboarding every role passes (`OnboardingGate`).
2. **SP role selection** — the user picks the Service Provider role (shared onboarding).
3. **Profile submission (Stage 1 → Stage 2)** — skills/categories/portfolio (Stage 1), then headline/bio/industries/languages/pricing (Stage 2); `CurrentPhase` advances 1→2 when complete (§1.1).
4. **Submit for verification** → `VerificationStatus: Pending → UnderReview`.
5. **Admin verification queue** — an admin reviews (`GetPendingVerificationsAsync`) and approves or rejects.
6. **Approval** → `Verified`. This is the **single gate**; crossing it opens the flat dashboard.

All of the above predates and is unchanged by the redesign.

### 11.2 First login after verification — what a freshly-verified SP sees

No gating: **all five sections are conceptually open at once.** But a brand-new SP has zero data, so the realistic first visit is mostly empty. **Reality today: only Profile & Trust is built and renders — the other four sections do not exist in the UI yet.** The intended full first-visit experience (once Modules 2–5 ship):

- **Profile & Trust — LIVE.** Renders today. Shows the neutral **"building your trust score"** state (§5.2; `HasEnoughTrustData = false`, no number). The Tier badge shows the current tier (ranking-only, §5.4). The Skills Test is available (§5.3).
- **Service Catalog — PLANNED.** *When built:* empty with a **"create your first service listing"** prompt (§6).
- **Leads — PLANNED.** *When built:* empty — correctly, because **no listings = no matching eligibility** (§1.7/§7). Its empty state must explain *why* ("add a service to start receiving briefs"), not just "no leads."
- **Workroom & Earnings — PLANNED.** *When built:* empty until a brief is accepted.
- **Analytics & Growth — PLANNED.** *When built:* empty until upstream modules produce data (§9).

**Getting-started nudge (PLANNED pattern).** With no wizard forcing a path, onboarding guidance must come from **smart empty-states**, not gating. The first-visit dashboard should surface one clear next step — *"Create your first service listing to start receiving briefs"* — pointing at Catalog (§6), since a listing is the prerequisite that unlocks matching/Leads. This nudge is part of the Module-2 build, **not live today**.

### 11.3 Steady-state / returning-user loop — **PLANNED** (depends on Modules 3–4)

Once listings exist and briefs arrive, a working SP repeats this loop. **All PLANNED — none of these modules are built:**

1. **Check Leads** — new briefs, ranked by the Brief Match Score (§7).
2. **Respond to a brief** — response timestamps feed the real response-rate metric (§7 → Trust §5.1).
3. **On acceptance → Workroom** — the engagement moves to §8.
4. **Deliver via milestones** — submit → 48h client review → up to 3 revisions → accept or 7-day auto-release (§8).
5. **Get paid** — escrow releases, **flat 12% commission** deducted (§1.4/§8).
6. **Signals feed back** — satisfaction / on-time / repeat / dispute → Trust (§5.1); earnings/response data → Analytics (§9).
7. **Repeat.**

**Returning-user landing view (PLANNED — Stitch-mockup concept).** With no "next phase" to resume, a returning SP is oriented by the **dashboard overview**, not wizard logic. The Stitch screens propose a **"Requires Attention"** panel (briefs awaiting response, milestones due, disputes) and a **"Recent Activity"** feed — the natural landing view that replaces phase-progress. Design concepts only, not built; when built they must render from real §7/§8 data — deterministic, no AI (§2).

### 11.4 Skills Test and Tier — optional side-paths (not steps in the loop)

Both are **asynchronous to the main loop** — an SP can engage them any time, and neither gates anything:

- **Skills Test — LIVE (§5.3).** Optional, non-blocking. Take a per-category test whenever; passing feeds the Skill Test trust signal — the **only** trust signal available before Workroom exists (§5.1). 30-day cooldown per category.
- **Tier — badge LIVE, progression NOT built.** The Tier badge (§5.4) shows the current `Tier_level` (ranking-only). **How tier advances is not implemented or decided** — `Tier_level` is set at onboarding (≥1) and used only for match ranking (§1.5/§1.7). Do **not** describe a "tier progression journey"; there is none today.

### 11.5 Why a zero-data SP doesn't look broken on first login

With no phases to sequence the new SP, the "this isn't broken — here's what to do" burden falls entirely on **empty-state design**, section by section. This ties the per-module empty states into one narrative:

- **Profile & Trust (LIVE):** the neutral "building your trust score" state (§5.2) is already an honest, non-broken empty state — it explains the score is accruing and points to the Skills Test as the one thing that moves it now.
- **Service Catalog (PLANNED):** the "create your first service listing" prompt (§6) — the primary getting-started call to action.
- **Leads (PLANNED):** an empty state that explains the dependency ("add a service to become eligible for briefs"), never a bare "nothing here."
- **Workroom / Analytics (PLANNED):** honest empties ("your active work appears here" / "insights appear once you have activity").

**Coherence rule:** every SP section must ship a purposeful empty-state that tells the provider what to do next — that is the flat model's replacement for a wizard. **Today only Profile & Trust satisfies this, because it is the only built section**; a freshly-verified SP currently sees a working Profile & Trust and no other rendered sections. The rest of this narrative is the **plan** for when Modules 2–5 land.

---

## Appendix A — tooling gotcha (preserve)

The repo's **root `.gitignore` is a binary / non-UTF8 file**, which can make the Grep/ripgrep tool **silently mis-parse ignore rules and skip whole directory subtrees**. During Module 1 this produced a false-negative "`Tier_level` doesn't exist" (a search returned only `backend/tests/` and skipped `Models`/`Services`/`Controllers`), later corrected. **Rule:** any "grep found nothing" for a symbol believed to exist must be double-checked with a **direct file open** or **`git log -S"<symbol>"`** — never conclude absence from a single empty grep.

---

## Changelog

**2026-07-27 — model-vs-collection naming disambiguated (Modules 2–4).** Verified the established convention against `MongoDbContext.cs` (singular entity class → plural collection string, dropping `Record`/`Model`/`Entity` suffixes; legacy plural-class names not to be copied) and stated **model → collection** side by side for each planned collection: `ServiceListing`→`"ServiceListings"`, `ClientBrief`→`"ClientBriefs"`, `WorkroomEngagement`→`"WorkroomEngagements"` (§4.3, §6–§8). Doc-only; Modules 2–4 not started in code.

**2026-07-27 — added §11, the SP journey (product experience).** Documented the real end-to-end user flow, distinct from the developer build order (§1.2): first-time signup→verified (LIVE, unchanged), the first-login empty-state experience, the planned steady-state loop (Leads → Workroom → paid → signals feed back), Skills Test / Tier as optional async side-paths, and the empty-state coherence that keeps a zero-data SP from looking broken. Grounded throughout in LIVE (Module 1) vs PLANNED (Modules 2–5); "Requires Attention" / "Recent Activity" flagged as unbuilt Stitch-mockup concepts.

**2026-07-27 — consolidated into a single system-design reference.** Reorganized the whole doc into §1 architecture · §2 AI(none) · §3 design · §4 database · §5–§9 modules 1–5 · §10 cross-cutting, merging the prior sections' overlapping content. Re-verified fresh against code: `ServiceListings`/`ClientBriefs`/`WorkroomEngagements` still unbuilt; commits `b29bcde`/`5e2da20` present; `SpMatchingService.cs:48` still `0.85`; embedded field names current; fonts current. Added §6 candidate fields (delivery-time, revisions, units, buyer questionnaire, FAQ) as **unapproved open decisions**; added §8 payout methods (Stripe Connect/Wise/Bank/PayPal); added §10 cross-cutting rules. STATUS tag `MISSING` → `PLANNED` for unbuilt modules.

**2026-07-27 — commission locked at 12%; AI-implying feature names stripped from the plan.** Flat platform commission locked at **12%** (§1.4, §8); recorded deterministic names for the Stitch-mockup concepts (§2.2) so no AI-implying name reaches code; "Improve Tone" dropped.

**2026-07-26 — SP confirmed AI-free (permanent); provider references corrected; typography corrected; DB collection map added; expanded to full Modules 2–5 plan; SP canon created (flat model, Module 1 shipped).** (Earlier same-day history condensed.)

---

*End of Service Provider system design. Update this doc first, then write the code — never the reverse.*
