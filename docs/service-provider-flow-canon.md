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

Section map: **§1** architecture · **§2** AI (none) · **§3** design system · **§4** database · **§5** Module 1 Profile & Trust (LIVE) · **§6** Module 2 Service Catalog · **§7** Module 3 Leads · **§8** Module 4 Workroom & Earnings · **§9** Module 5 Analytics & Growth · **§10** cross-cutting rules · **§11** SP journey (product experience) · **§12** notifications · **§13** audit log · **§14** validation/error · **§15** security/trust · **§16** roles & permissions · **§17** acceptance criteria · Appendix + Changelog.

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

**PLANNED (not built — do not describe as existing).** Model class → collection string; all top-level, all following the §4.2 convention:
- **`ServiceListing` → `"ServiceListings"`** (Module 2, §6) — the service-level record + `Impressions`/`Clicks` counters. Owns its packages via `serviceId`.
- **`ServicePackage` → `"ServicePackages"`** (Module 2, §6) — per-service Basic/Standard/Premium/Custom packages (keyed by `serviceId`); **add-ons embedded** as a bounded array (not a collection — §6 flag).
- **`ServiceFAQ` → `"ServiceFAQs"`** (Module 2, §6) — per-service/package FAQ entries.
- **`ClientBrief` → `"ClientBriefs"`** (Module 3, §7) — client-authored requests/briefs (the source's *Opportunity*, renamed), status-modelled.
- **`Proposal` → `"Proposals"`** (Module 3, §7) — an SP's offer against a ClientBrief, or the auto-accepted snapshot for a package purchase (§6/§7). Versioned. **Field set superseded** by the fuller entity in §7 (adds source/acceptance/delivery/requirements/add-on fields; `opportunityId` → `clientBriefId`).
- **`WorkroomEngagement` → `"WorkroomEngagements"`** (Module 4, §8) — the delivery-workspace / engagement record (the source doc's *Project*, renamed). References a `Contract`.
- **`Contract` → `"Contracts"`** (Module 4, §8) — the signed agreement the engagement references (the source's `contractId`, which it implies but never defines). Kept **separate** from the engagement (mapping note below).
- **`WorkroomMilestone` → `"WorkroomMilestones"`** (Module 4, §8) — funded units of work under an engagement; carries `includedRevisionCount` / `usedRevisionCount` + escrow status. **Renamed from `Milestone`** to avoid a class-name collision with the existing `Milestone` in `BusinessIdeas.cs:119` (same `WebApp.Models.DatabaseModels` namespace). FK fields `milestoneId` / `currentMilestoneId` reference this entity.
- **`Deliverable` → `"Deliverables"`** (Module 4, §8) — versioned submissions against a milestone (1.0 / 1.1 / 2.0; never overwritten).
- **`RevisionRequest` → `"RevisionRequests"`** (Module 4, §8) — client-requested changes against a deliverable; manual scope classification.
- **`FinancialTransaction` → `"FinancialTransactions"`** (Module 4, §8) — escrow / commission / payout / refund / adjustment / hold ledger rows. **No stored `commissionRate` field** (below).
- **`Review` → `"Reviews"`** (Module 4, §8; feeds §5 reputation) — client review at project completion.

**Entity-map decisions (from the source design doc):**
- **`ServiceProvider` (source's top-level entity) is NOT a new collection.** It duplicates the already-built embedded `ServiceProviderProfile` (§4.1). Map its fields onto the existing structure: `displayName`/`professionalTitle`/`companyName`/`primaryCategory`/`skills` → profile fields; `verificationTier` → `Tier_level` (§1.5); `verificationStatus` → `VerificationStatus`; `rating`/`reviewCount`/`responseRate`/`onTimeDeliveryRate`/`projectCompletionRate` → **derived** reputation (Trust signals, §5.1), never hand-set. `commissionRate` is **dropped** (below).
- **`Project` → `WorkroomEngagement` (1:1), plus a separate `Contract`.** The source's `Project` is the delivery workspace; its `contractId` references a separate contract record and its `escrowStatus` mirrors escrow that actually lives in `FinancialTransaction` rows — so engagement and contract stay **two entities**, not collapsed.
- **Commission is never a stored per-entity field.** `commissionRate` on the source's `ServiceProvider` / `FinancialTransaction` / proposal preview is **removed**; every commission figure is computed from the single flat **12%** constant (§1.4). The source's `8%` examples are transcribed as **12%**.
- **Embedded, not collections (bounded per-package):** `addOns` and `requirementsTemplate` are **embedded arrays on `ServicePackage`** (§6), deliberately not top-level collections. This resolves the otherwise-dangling `addOnIds` / `requirementsTemplateId` references — the source's reference-style names are overridden to embedded structures.

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

## 6. Module 2 — Service Catalog — **PLANNED** (full-scope build; supersedes the earlier Module 2 spec)

Absorbs the "Service Package / Delivery Time / FAQ / Revision" source doc in full. **Full-scope for the first build:** Add-ons, Instant/Manual approval modes, Capacity limits, and Cancellation logic are all **in scope now**, not deferred.

**Storage (top-level collections, §4.2 convention):**
- **`ServiceListing` → `"ServiceListings"`** — the service-level record: `ServiceType, Title, Description, ServiceCategory (enum §4.2), IndustryFocus, GeographicCoverage`, plus `Impressions`/`Clicks` counters (seeded at build time so §9 has history). Owns its packages via `serviceId`.
- **`ServicePackage` → `"ServicePackages"`** (new) — per-service packages, keyed by `serviceId`: `packageId, serviceId, packageName, packageType, packageTitle, packageDescription, price, currency, deliveryTimeValue, deliveryTimeUnit, deliveryDayType, includedRevisionCount, unlimitedRevisions, revisionRequestWindowDays, deliverables, includedFeatures, excludedFeatures, addOns (embedded — below), requirementsTemplate (embedded — below), instantOrderEnabled, manualApprovalRequired, maximumActiveOrders, status, createdAt, updatedAt`. Package types: `Basic, Standard, Premium, Custom` (Custom not shown in the public table — used for custom offers, §7).
- **`ServiceFAQ` → `"ServiceFAQs"`** (new) — `faqId, serviceId, packageId, question, answer, visibility, displayOrder, status, createdAt, updatedAt`.
- **Add-ons are EMBEDDED** on `ServicePackage` as a bounded `addOns` array (a handful per package), each: name, price, delivery-time delta (business days), enabled — **non-revision extras only** (extra revisions use the dedicated fields, §6.4). *(Flag: the source names the field `addOnIds` — id references to a collection — but per the modeling decision we embed the add-on objects directly instead.)*
- **`RequirementsTemplate` is EMBEDDED** on `ServicePackage` (bounded — a handful of questions per package), not a top-level collection: a `requirementsTemplate` list of `{ fieldId, label, fieldType (text/file/choice/etc.), required }` entries. *(This is what the source's `requirementsTemplateId` field points at; like add-ons, we embed the structure directly rather than reference a collection. The client's filled-in answers are a separate Module-3 structure — §6.6.)*

### 6.1 Package Builder
Each service may have Basic / Standard / Premium, each **independently configured**: title, short description, price, delivery time, included revisions, deliverables, features, add-ons, client-requirements template, instant-order availability. Example — Basic "UX Audit Essentials" $450 / 5 Business Days / 1 revision; Standard "UX Audit & User Flow Redesign" $950 / 10 Business Days / 2 revisions; Premium "Complete Product UX Improvement" $1,650 / 18 Business Days / 3 revisions.
**Pricing guidance (deterministic, no AI, §2):** a suggested-price-range lookup by `ServiceCategory` (optionally `PricingModel`), shown as guidance not a quote; no competitor benchmark.

### 6.2 Package validation (deterministic — system never auto-changes price/delivery/revision policy)
Required before publish: title, description, price > 0, currency, delivery time, ≥1 deliverable, revision policy, client requirements, availability status.
Cross-package: Standard must not have fewer features than Basic; Premium not fewer than Standard; a higher package priced **lower** than a lower one shows a **warning**; a higher package with **shorter** delivery time needs **explicit confirmation**; same-service packages must share currency; no duplicate package titles; unpublished packages aren't purchasable.

### 6.3 Delivery-time configuration
Fields: `deliveryTimeValue, deliveryTimeUnit (Hours/Days/Weeks), deliveryDayType (Business/Calendar Days), deliveryStartRule (After Order Confirmation / After Escrow Funding / After Client Requirements Complete / After Provider Starts — recommended default: escrow funded AND requirements complete), deliveryTimezone, dailyCutoffTime`.
**Clock starts only at "Ready to Start"** = package/proposal accepted + escrow funded + mandatory requirements submitted + provider account active + package available + no blocking hold.
**Due-date formula:** `Delivery Due Date = Delivery Start + Package Delivery Duration + Approved Add-on Delivery Time + Approved Extension Time`. Example: 03 Aug 2026 + 10 business days + 2 (add-on) + 1 (extension) = +13 business days.
**Business-day rules:** Business Days exclude Sat/Sun + platform holidays, use provider timezone for cutoff, orders after cutoff start next business day; Calendar Days count every day unless the contract says otherwise.
**Delivery-clock states:** `Not Started, Waiting for Requirements, Waiting for Escrow, Ready to Start, In Progress, Due Soon (<48h remaining before the due date), Due Today, Overdue, Extension Requested, Extension Approved, Paused, Delivered`. The system may remind but **never** extends deadlines, submits delivery, removes late status, or marks requirements complete on its own (§2).
**Client-delay logic:** an overdue client requirement → "Waiting for Client Requirements" / "Client Input Required". Clock behaviour per contract policy (Continue / Pause / Request Manual Extension); recommended: clock doesn't start until mandatory requirements are in; post-start delays don't auto-pause unless the contract permits; provider can request an extension; no new deadline without client approval.
**Delivery add-ons:** e.g. "Additional Five Screens" (+$300, +3 business days) or "Priority Delivery" (+$250, −2 business days). Priority delivery: provider must explicitly enable; capacity must allow it; result can't go below the platform minimum; client must see the final delivery date before purchase; provider can't silently increase delivery time after acceptance.

### 6.4 Per-package revision system
Fields: `includedRevisionCount, unlimitedRevisions, revisionRequestWindowDays, additionalRevisionAvailable, additionalRevisionPrice, additionalRevisionDeliveryTime, revisionScopeDescription`. Example: Basic 1 / $75 / +1 day; Standard 2 / $100 / +2 days; Premium 3 / $150 / +2 days.
**Add-ons vs. additional revisions — two separate mechanisms (never overlapping):** the generic embedded `addOns` array (§6 storage) is for **non-revision extras only** (e.g. "Additional Five Screens", "Priority Delivery"). Purchasing an extra revision is **always** handled through the dedicated `additionalRevisionAvailable / additionalRevisionPrice / additionalRevisionDeliveryTime` fields — **never** modeled as a generic add-on. One concept, one code path.
**Calculation:** `Remaining Revisions = Included + Purchased Additional − Used`. Example: 2 + 1 − 2 = 1 remaining.
**Request window:** a client may request only when a deliverable is submitted, the review window is active, the milestone is not finally approved, the request is within agreed scope, and entitlement (or a paid revision) is available. Example window: 3 days. After expiry: no normal request, but a support request, a voluntary provider update, or a paid change request are possible.
**One revision = "one consolidated client feedback submission against one submitted version"** — a round may hold many comments; a client can't split feedback across messages to burn extra revisions. Flow: `Collecting Feedback → Feedback Submitted → Revision Accepted → Revision In Progress → Revision Submitted`; a round consumes an allowance **only** once the client confirms "Feedback Submitted".
**Scope rules:** Within Scope (consumes allowance) / Needs Clarification / **Potential Scope Change (does NOT auto-consume** — provider may ask clarification, create a paid change request, send a custom add-on, continue free, or request support) / Confirmed Scope Change (requires a paid add-on, revised custom offer, contract amendment, or separate proposal — **system never auto-charges or auto-accepts**, §2).
**Unlimited revisions:** provider-enabled, with a mandatory warning that it applies only to the **original agreed scope**, not new deliverables/scope changes; the review window and scope restriction still apply; abuse-reporting exists; no automatic delivery extension; no new features included.

### 6.5 FAQ Builder
Entity `ServiceFAQ` (above). **Visibility:** All Packages / Basic Only / Standard Only / Premium Only / Selected Packages / Private Draft. **Actions:** add / edit / delete draft / reorder / duplicate / assign-to-package / publish / unpublish.
**Validation:** question + answer required; question unique within a service; no empty answers; character limits; no prohibited external-payment instructions; can't override contract/package/platform terms; can't promise a feature not in the selected package; unpublished FAQs aren't shown publicly.
**Groups (optional):** Service Requirements, Delivery, Revisions, Files and Formats, Meetings, Communication, Licensing, Ownership, Support.
**Package-conflict handling:** FAQ content should reflect the selected package; if it conflicts with actual package config, **package terms are the source of truth** — the system shows a conflict warning ("This FAQ does not match the selected package settings") and the provider corrects it manually.

### 6.6 Client-requirements template (split across modules)
**Schema (Module 2):** the SP defines what information they need as an **embedded `RequirementsTemplate`** on `ServicePackage` — a bounded list of `{ fieldId, label, fieldType (text/file/choice/etc.), required }` entries (the source's `requirementsTemplateId`; embedded, not a collection — see §6 storage).
**Answers (Module 3 / checkout):** the client fills the template in at purchase / proposal-submission time. Those answers are a **separate small structure** (e.g. a `requirementsSubmission` referencing the template's fields with the client's values), tracked via `requirementsStatus` on the Proposal (§7). Schema-definition (Module 2) and answer-submission (Module 3) stay clearly distinct. *(This does not reopen the earlier "buyer-requirements questionnaire deferred to Module 3" decision — the template schema is configured here; its submission happens in Leads/checkout.)*

### 6.7 Provider capacity rule — **touches shipped code**
`maximumConcurrentOrders, currentActiveOrders, newOrderAvailability, manualApprovalWhenCapacityLow` live on the **existing embedded `ServiceProviderProfile`** (Module 1, shipped `b29bcde`/`5e2da20`) — **not** a new Module-2 entity. Capacity status: `Available, Limited, Fully Booked, Unavailable`. Instant order must be **blocked when `currentActiveOrders >= maximumConcurrentOrders`** unless the provider explicitly allows overbooking (recommended: instant order disabled, client may still send an order request).
> **SHIPPED-CODE IMPACT (flag):** building this adds four fields to the already-committed `ServiceProviderProfile` — a real change to Module-1 code, not routine new Module-2 work. Treat it as a Module-1 entity amendment when Module 2 is built.

### 6.8 Package order cancellation
**Before delivery starts:** client may request cancellation; provider may approve; platform cancellation policy applies; escrow refund may process; the proposal snapshot stays in history.
**After delivery starts:** cancellation follows contract policy; completed work may require partial payment; an active dispute blocks automatic refund; an administrator may review exceptional cases. **The system never makes an automatic cancellation decision unless a predefined policy explicitly applies** (§2).

### 6.9 Empty state (Catalog)
- **No Services** — "No Published Services" / "Create your first service listing to start receiving briefs." / Action: "Create Service". *(This is the getting-started nudge the §11 journey references — the flat model's replacement for a wizard.)*

**Dependencies.** Reads: verified profile (§1.1), shared enums (§4.2), capacity fields on the profile (§6.7). Produces: published packages + FAQs → Leads/checkout (§7); impressions/clicks + order counts → Analytics (§9); a purchased package → an auto-accepted Proposal (§7).

---

## 7. Module 3 — Leads (Client Acquisition) — **PLANNED**

**Purpose.** The provider-facing side of client acquisition: a lead inbox of briefs, brief detail, a proposal workspace, and a proposal pipeline. This is where the **Upwork-style negotiated path** lives; the Fiverr-style Catalog direct-buy path (§6) converges here via an auto-accepted `Proposal`. It is also where the **real response-rate metric** is built (retiring the §1.7 `0.85` stub). Absorbs the source doc's §6 "Client Acquisition" verbatim, renamed per §4.3.

**Storage (new top-level collections, §4.3):**
- **`ClientBrief` → `"ClientBriefs"`** (source's *Opportunity*): `clientId, title, description, category, requiredSkills, budgetMinimum, budgetMaximum, pricingType, expectedDuration, location, visibility, source, publishedAt, expiresAt, status`.
- **`Proposal` → `"Proposals"`** (superseded/merged entity, source §19; `opportunityId` → `clientBriefId`): `proposalId, clientBriefId, serviceId, packageId, providerId, clientId, proposalSource, acceptanceMode, title, coverMessage, proposedPrice, currency, pricingType, deliveryTimeValue, deliveryTimeUnit, deliveryDayType, deliveryStartRule, includedRevisionCount, unlimitedRevisions, revisionRequestWindowDays, deliverables, milestonePlan, selectedAddOns, requirementsStatus, attachments, submittedAt, expiresAt, acceptedAt, acceptedBy, acceptanceTrigger, escrowStatus, conversionStatus, status, version`. **No `commissionRate` field** — commission is the flat 12% snapshot (§7 acceptance block, §1.4). **No `requirementsTemplateId`** — the template is embedded on `ServicePackage` (§6); the Proposal reaches it via `packageId`, and the client's answers are the Module-3 `requirementsSubmission` tracked by `requirementsStatus`.

> **Naming note (deliberate dual-naming — do not "fix"):** the backend entity/collection is `ClientBrief` / `"ClientBriefs"`, but **user-facing UI copy intentionally keeps the friendlier term "Opportunity/Opportunities"** (from the Stitch/source design — e.g. "Opportunity Details", "No New Client Opportunities"). This is a deliberate UX-naming choice, **not** drift — never "correct" user-visible text to say `ClientBrief`, and never rename the entity to `Opportunity`.

**Sections (source §6):** Lead Inbox ("Leads & Briefs" — new / direct-invite / saved / previously-viewed / dismissed / expiring); Brief Detail ("Opportunity Details" — client identity + verification, brief, skills, budget, timeline, attachments, client activity, deadline, saved status); Proposal Workspace ("Create Proposal" — title, cover message, price, delivery duration, deliverables, revisions, milestones, attachments, expiration, **earnings preview**); Proposal Pipeline (Draft / Submitted / Viewed / Changes Requested / Client Reviewing / Accepted / Declined / Withdrawn / Expired).

**ClientBrief status model:** `Draft, Published, Open, Saved, Proposal Submitted, Closed, Expired, Cancelled`.
Rules: only **Open** accepts proposals; **Expired** blocks new proposals; **Saved** briefs persist without submission; a client **Closing** a brief freezes existing proposals **read-only**; direct invitations may go to multiple SPs unless marked **exclusive**.
**Expiry bounds:** `expiresAt` is **client-set** (source design). If the client specifies none, **default to 72 hours from publish**; regardless of client input, **cap the maximum at 30 days**. A TTL index on `expiresAt` auto-expires briefs to `Expired`.

**Proposal status model:** `Draft, Submitted, Viewed, Changes Requested, Revised, Client Reviewing, Accepted, Declined, Withdrawn, Expired, Converted to Project` (Converted = `WorkroomEngagement` created, §8).
Allowed transitions: Draft→Submitted; Submitted→Viewed; Submitted→Withdrawn; Viewed→Changes Requested; Viewed→Client Reviewing; Changes Requested→Revised; Revised→Client Reviewing; Client Reviewing→Accepted; Client Reviewing→Declined; Accepted→Converted to Project; Submitted→Expired.
Restricted: an **Accepted** proposal can't be withdrawn; a **Converted** proposal can't be edited; a **Declined** proposal requires a **new version** to resubmit; a **Submitted** proposal's price can't silently change; a **Revised** proposal must preserve the previous version.

**Proposal business logic (source §6):**
- **Required before submission:** title, cover message, price, delivery duration, ≥1 deliverable, revision policy, expiration, active provider account, provider eligible for paid work.
- **Price validation:** price > 0; currency must match the brief's currency; a price outside the budget range shows a **warning, not a blocking error**; **commission preview shown before submit**.
- **Commission preview (flat 12%, §1.4):** `Commission = Proposed Price × 12%`; `Net = Proposed Price − Commission`. Example: Proposed Price **$2,150.00** → Commission **$258.00** → Net **$1,892.00**. *(Source example used 8%; transcribed to 12%.)*
- **Revision logic:** revision count ≥ 0; "Unlimited" optional but requires explicit confirmation; "Changes Requested" does **not** auto-edit the proposal — the provider manually reviews and submits a revised version.
- **Expiration:** must be a future date; expired proposals can't be accepted; the provider can duplicate an expired proposal into a new one.

**Acceptance modes (source §8):** `Manual Client Acceptance`, `Rule-Based Instant Order` (explicitly **NOT** AI acceptance, §2), `Platform Admin Resolution`. Proposal sources: `Standard Proposal, Direct Invitation Proposal, Custom Offer, Published Package Purchase, Package Add-on, Change Request`.

**Auto-Accepted Proposal — definition (source §9).** "Auto-accepted" means the provider **already published fixed commercial terms** via a package and the client **explicitly** (1) selects the package, (2) selects add-ons, (3) reviews full terms, (4) submits required info, (5) confirms the order, (6) authorises/funds payment — then the system **rule-based-ly** creates an accepted-proposal snapshot. The system makes **no commercial decision**; the client accepts pre-published terms. It must **never** mean: the system accepted without consent, AI accepted, a *viewed* proposal became accepted, a *saved* package became an order, a message created a contract, payment was bypassed, or capacity was ignored (source Final Rule).

**Cross-paths (source §10–§13):**
- **Package purchase (auto-accept):** Published Service → select package → select add-ons → review final price / delivery / revision allowance → submit requirements → **capacity/availability validation** → confirm purchase → escrow/payment authorised → **proposal snapshot created → status = Accepted** → contract/order record → project draft → delivery-waiting conditions checked → workroom enabled when ready.
- **Standard proposal (always manual):** client brief → provider creates + submits → client reviews → (requests changes or continues) → provider may revise → **client manually accepts** → escrow funded → contract/project draft.
- **Direct invitation:** client sends invitation → provider declines OR creates proposal → client reviews → **client manually accepts** → escrow funded → project. *A direct invitation itself is never an accepted order.*
- **Custom offer:** messenger conversation → provider creates custom offer (price/delivery/revisions/deliverables) → sends → **client accepts** → payment/escrow authorised → status = Accepted → project draft.

**Purchase snapshot — immutable (source §10.1).** Preserves: Selected Service, Selected Package, Package Price, Selected Add-ons, Final Price, Delivery Duration, Delivery Day Type, Revision Allowance, Deliverables, Requirements, FAQ Version, **Provider Commission Rate = the flat 12% platform constant snapshotted at purchase time (never a stored per-provider variable rate, §1.4)**, Cancellation Terms, Acceptance Timestamp. Later package edits never change an already-accepted order.

**Auto-accept conditions — ALL required (source §10.2):** service Published; package Active; Instant Order enabled; provider active + eligible for paid work; package capacity available; max-active-order limit not exceeded; client account active; client payment method verified where required; client explicitly confirms; escrow/payment authorised; no compliance/platform hold; final order summary shown before confirmation. **Any failed condition → no auto-accept.**

**Manual-approval fallback (source §10.3):** when instant-order conditions fail — package selected → client sends order request → **provider reviews → accepts/declines** → client confirms final terms → escrow funded → accepted. UI status: "Provider Approval Required". Causes: capacity full, incomplete requirements, package paused, unusual add-ons, delivery-date conflict, manual approval enabled, compliance review needed.

**Auto-accepted status flow (source §14):** Package Selected → Checkout Draft → Client Confirmation Required → Payment Authorisation Required → **Accepted** → Converted to Project. Failure paths: Checkout Draft→Abandoned; Payment Authorisation Required→Payment Failed; Client Confirmation Required→Cancelled; Accepted→Compliance Hold. **Explicitly disallowed transitions:** Viewed→Accepted; Saved→Accepted; Message Sent→Accepted.

**Acceptance ≠ delivery start (source §15).** Accepting a proposal does **not** start the delivery clock. Accepted + Escrow Funded + Requirements Incomplete → engagement "Waiting for Requirements", clock = Not Started. Delivery begins only when Accepted AND Escrow Funded AND Mandatory Requirements Complete AND No Blocking Hold → "Ready to Start", clock started (see §6.3, §8).

**Brief Match Score = the existing `SpMatchingService` formula** (§1.7), reused as-is — deterministic, **not** AI. The source's "best skill match" sort is the same deterministic rule set (exact skill overlap, category overlap, availability, budget compatibility, service category, location) — **explicitly not an AI decision** (§2).
**Filtering:** category, required skills, budget range, project duration, client location, remote availability, client verification, payment verification, source, posted date, proposal deadline, saved-only.
**Sorting:** newest, highest budget, closest deadline, best skill match (deterministic), previously viewed.

**Real Response Rate (retires the `0.85` STUB, §1.7/§5.1):** built from lead/message response timestamps; once live it replaces the placeholder in `SpMatchingService.cs:48` and feeds the Response Rate trust signal (15%). Retired by this module, not before. The **Availability Signal** (source `availabilityStatus`) affects match priority; it must not silently become a commission or trust input.

**Notifications (source §6, never self-executing, §2):** direct invitation received; saved brief expiring; proposal viewed; changes requested; proposal accepted; proposal declined; proposal expired; client sent a new message.

**Empty states (source §6, verbatim):**
- **No Leads** — "No New Client Opportunities" / "New opportunities matching your professional profile will appear here." / Action: "Review Service Preferences".
- **No Proposals** — "No Active Proposals" / "Submit a proposal or send a custom offer to begin a client discussion." / Action: "Browse Opportunities".
- **No Saved** — "No Saved Opportunities" / "Save relevant client briefs to review them later."

**Open decisions / flags.**
- Response-window definition (hours to "responded") for the response-rate metric; whether the availability signal is a ranking weight or a hard pre-filter.

**Dependencies.** Reads: catalog listings (§6), `SpMatchingService` (§1.7), verified profile (§1.1). Produces: `Proposal` (→ §8 on acceptance), response-rate (→ §1.7 + Trust §5.1), proposal analytics counts (→ §9).

---

## 8. Module 4 — Workroom & Earnings — **PLANNED**

Merges the source doc's §7 (Project Workroom & Delivery) and §8 (Earnings & Financial Activity) into one module, per the 5-module structure. **Produces the four still-PLANNED trust signals** (Client Satisfaction 40, On-time Delivery 25, Repeat-Client Rate 10, Dispute Penalty) that §5.1 consumes.

### 8A — Workroom & Delivery (source §7)

**Storage (new top-level collections, §4.3):**
- **`WorkroomEngagement` → `"WorkroomEngagements"`** (source's *Project*): `proposalId, providerId, clientId, contractId, title, description, contractValue, startDate, expectedEndDate, actualEndDate, currentMilestoneId, completionPercentage, engagementStatus, escrowStatus`. *(Status field renamed from the source's `projectStatus` to match the `Project → WorkroomEngagement` rename.)*
- **`Contract` → `"Contracts"`** — the signed agreement `contractId` references (kept **separate**, §4.3 mapping note).
- **`WorkroomMilestone` → `"WorkroomMilestones"`** (renamed from `Milestone` — collision with `BusinessIdeas.cs:119`, §4.3): `engagementId, title, description, amount, startDate, dueDate, completionCriteria, includedRevisionCount, usedRevisionCount, status, escrowStatus, approvedAt`.
- **`Deliverable` → `"Deliverables"`**: `milestoneId, providerId, title, description, version, fileIds, externalLinks, submissionMessage, submittedAt, status`.
- **`RevisionRequest` → `"RevisionRequests"`**: `milestoneId, deliverableId, requestedBy, description, requestedChanges, createdAt, dueDate, scopeClassification, status`.

**Sections (source §7):** Active Projects; Project Workroom (conversation/summary/milestones/tasks/files/decisions/meetings/deliverable history/contract shortcut); Milestone Delivery; Revision Management; Project Completion.

**WorkroomEngagement status model:** `Contract Pending, Escrow Pending, Ready to Start, Active, Paused, Client Input Required, Milestone Review, Revision in Progress, Final Delivery, Completed, Cancelled, Disputed, Archived`.
Core rules: no **Active** without a signed contract **and** required escrow; **Paused** follows the deadline-freeze policy; **Disputed** can block payment release; **Completed** deliverable history is read-only; **Archived** is never deleted.

**WorkroomMilestone status model:** `Draft, Funding Required, Funded, Active, Submission Draft, Submitted, Client Reviewing, Revision Requested, Revision in Progress, Resubmitted, Approved, Payment Processing, Paid, Cancelled, Disputed`.
Happy path: Draft→Funding Required→Funded→Active→Submission Draft→Submitted→Client Reviewing→Approved→Payment Processing→Paid. Revision loop: Client Reviewing→Revision Requested→Revision in Progress→Resubmitted→Client Reviewing. Dispute: (Submitted / Client Reviewing / Revision Requested)→Disputed.
**Activation logic:** a milestone is Active only when — contract active; previous required milestone approved; required escrow funded; start condition satisfied; project not paused; no blocking dispute. Parallel milestones only if the contract explicitly allows it.

**Review / release windows (CANON-LOCKED — from prior turns, not in the source; layered on the milestone flow):** the **48-hour client review window** on a submitted milestone (the post-submission review clock — **distinct from** the *Due Soon* deadline threshold, which is `<48h remaining` before a due date, §6.3); **7-day auto-release** if the client neither accepts nor disputes (a **Hangfire** job, §10); **5-day dispute review** once opened; **atomic release** — milestone status **+** escrow release **+** invoice update commit as one operation (all-or-nothing).

**Deliverable submission (source §7):** required — delivery title, description, ≥1 file or external link, version number, client instructions, completion confirmation. Provider confirms: all agreed deliverables included; files reviewed; no unrelated private info; ready for review.
**Version rules:** first submission **1.0**; revisions **1.1, 1.2**; a major approved scope update **2.0**; previous versions can't be overwritten; submitted files can't be silently replaced — a replacement **creates a new version**.

**File states:** `Selected, Uploading, Scanning, Ready, Failed, Archived, Restricted`. Rules: contract/approval files can't be deleted; submitted deliverables keep permanent history; failed uploads don't count toward submission; restricted files aren't client-visible; private provider files must be explicitly marked; size/type follow platform settings.

**Task logic:** fields — title, description, assignee, due date, visibility, related milestone, status. Statuses: `Not Started, In Progress, Blocked, Completed, Cancelled`. Visibility: `Client Visible, Provider Private, Shared Team`. Rules: private tasks aren't client-visible; reopening a completed task creates audit history; **task completion ≠ milestone approval**.

**Revision logic:** `Remaining Revisions = Included Revisions + Purchased Additional Revisions − Used Revisions` — **matches §6.4 exactly** — where **Included** is sourced from the specific package/proposal tied to the engagement at purchase (§6/§7) and **Purchased Additional Revisions** counts any additional-revision purchases recorded against this engagement (the `Additional Revision Purchased` event, §8C). Never a platform constant (the old fixed "max 3 revisions" is removed).
**Scope classification (manual):** `Within Scope / Needs Clarification / Potential Scope Change / Confirmed Scope Change`. The system may show predefined comparison info, but the final scope decision is the user's; **the system never auto-adds a price**. When the revision limit is reached the client can still send a request (system warns), the provider can propose a paid change request, and existing approved scope is preserved.

**Deadline states:** `On Track, Due Soon (<48h remaining before the due date), Due Today (same date), Overdue (passed, no approved submission), Extension Requested, Extension Approved, Extension Declined`. *(The "Due Soon" threshold is remaining-time-before-due — not the same as the 48-hour post-submission client review window above.)* An approved extension replaces the due date; a declined one preserves the original. The system reminds (Hangfire, §10) but **never auto-extends**.

**Client input requests:** provider can request file / decision / feedback / approval / clarification / meeting (fields: type, description, due date, related milestone, delivery impact). Delayed client input can set the engagement to **Client Input Required**; a deadline change is never automatic unless a contract rule exists.

**Project completion — allowed only when:** all required milestones approved; all payment releases resolved; final delivery approved; no active revision; no active dispute; required files available; contract obligations complete. Requires explicit confirmation. After completion: deliverables read-only; messaging may stay open; review request enabled; case-study permission request enabled; archive enabled; financial records retained.

**Workroom notifications (source §7):** ready to start; milestone funded; deadline approaching; client uploaded file; client answered question; deliverable submitted; client started review; revision requested; revision accepted; milestone approved; payment released; project completed; support ticket updated.

### 8B — Earnings & Financial Activity (source §8)

**Storage:** **`FinancialTransaction` → `"FinancialTransactions"`**: `engagementId, milestoneId, providerId, clientId, grossAmount, commissionAmount, netAmount, transactionType, paymentStatus, createdAt, releasedAt`. **No stored `commissionRate`** — commission is always the flat 12% constant (§1.4).

**Escrow vs. payout — two distinct stages (single-rail escrow):**
- **Escrow (hold) is single-rail.** While a milestone is in progress, funds are held via **Stripe (Stripe Connect)**. Only one provider holds escrow — there are never multiple simultaneous escrow implementations.
- **Payout (disbursement) is a separate, later step** — how the SP withdraws already-**released net** earnings from the Available balance. Payout methods (**Stripe Connect / Wise / Bank Transfer / PayPal**) are disbursement rails, **not** escrow holders.
- These are two different lifecycle stages (**hold → release → disburse**), not competing escrow providers.

**Sections (source §8):** Financial Overview ("Earnings Overview"); Escrow Activity ("Escrow" — a **view** over escrow-type transactions + milestone escrow status); Transactions ("Financial Activity"); Payouts; Statements; Invoices.

**Amount categories:** **Work in Progress** (escrow funded, work not yet submitted/approved — never shown as earned); **In Review** (submitted, client reviewing); **Pending** (approved, release/processing in progress); **Available** (in balance, payout-eligible); **Withdrawn** (payout completed); **On Hold** (dispute/verification/payment issue).

**Transaction types:** `Escrow Funded, Milestone Approved, Payment Released, Commission Charged, Payout Requested, Payout Processing, Payout Completed, Payout Failed, Refund, Adjustment, Dispute Hold, Hold Released`.

**Commission (flat 12%, computed at milestone payment release, §1.4):** `Commission = Gross × 12%`; `Net = Gross − Commission`. Example: Gross Milestone **$950.00** → Commission **$114.00** → Net **$836.00**. *(Source example used 8%; transcribed to 12%.)* The source's variable "rate comes from provider tier / rate preserved at signed time" rules are **dropped** in favour of the single platform constant. A manual adjustment still requires an authorised, audit-logged record (§12).

**Balance calculations:**
- `Available Balance = Released Earnings − Completed Payouts − Active Payout Requests − Applicable Adjustments`
- `Pending Balance = Approved Payments − Released Payments`
- `Protected Escrow = Funded Milestones − Approved or Refunded Amounts`

**Payout eligibility — allowed when:** account active; identity verification valid; payment account verified; available balance > minimum payout; no account-level hold; amount ≤ available balance. When blocked, show a specific reason ("Payment account not verified" / "Balance below minimum" / "Account review in progress" / "Existing payout processing" / "Financial hold active").
**Payout status model:** `Draft, Requested, Under Review, Processing, Completed, Failed, Cancelled, On Hold`. Rules: Processing can't be cancelled; Failed returns the amount to Available; Completed is immutable; payout method details shown **masked**.

**Invoices:** per milestone / project / client / date range. Fields: invoice number, provider + client identity, project, milestone, gross, commission, net, currency, approval date, release date, tax info, status (`Draft, Generated, Issued, Paid, Cancelled, Corrected`). Issued invoices can't be edited directly — corrections require a credit note / corrected invoice.
**Statements:** monthly / quarterly / annual / custom — opening balance, gross, commission, adjustments, payouts, closing balance, transaction list.

**Financial notifications:** escrow funded; milestone payment approved; payment released; balance available; payout requested; payout completed; payout failed; hold applied; hold removed; invoice generated; statement available.

**Financial empty states (source §8, verbatim):**
- **No Earnings** — "No Earnings Yet" / "Approved project payments will appear here." / Action: "View Client Opportunities".
- **No Available Balance** — "No Funds Available" / "Released earnings that are ready for payout will appear here."
- **No Payout Method** — "Add a Payout Method" / "Verify a payout method before requesting a withdrawal." / Action: "Set Up Payout Method".

### 8C — Cross-module event chain (source §10, renamed)

`Proposal Accepted` (proposal read-only; Contract setup enabled; **`WorkroomEngagement` draft created**; pipeline + accepted-proposal analytics updated — engagement does **not** auto-activate) → `Contract Signed + Escrow Funded` (engagement → Ready to Start; workroom enabled; first milestone can go Active; escrow visible) → `Milestone Submitted` (→ Submitted; earnings move Work in Progress → In Review; deliverable version locked) → `Milestone Approved` (→ Approved; revision disabled unless reopened by support policy; payment-release begins; completion metrics update) → `Payment Released` (`FinancialTransaction` created; 12% commission deducted; net → Available Balance; revenue analytics update) → `Project Completed` (deliverables read-only; review + case-study requests enabled; archive enabled) → `Review Submitted` (attached to project; provider rating recalculated — feeds §5 reputation; provider response enabled).

**Catalog/checkout events (source §18, added):**
- `Package Published` — service becomes purchasable; package analytics enabled; FAQ visible; instant-order eligibility calculated (§6).
- `Package Purchased` — accepted-proposal **snapshot** created; contract/order record created; escrow record created; project draft created; Client Acquisition updated; messenger event created; analytics order count updated (§6/§7).
- `Requirements Completed` — requirements status updated; delivery-start eligibility recalculated; provider notified (§6.6/§7).
- `Delivery Clock Started` — project status → Active; due date calculated (§6.3 formula); deadline notifications scheduled; workroom enabled.
- `Revision Requested` — package revision entitlement checked; remaining count updated **only** after valid request confirmation; scope classification required; workroom notified (§6.4).
- `Additional Revision Purchased` — accepted add-on record created; payment secured; purchased revision count increased; additional delivery time applied where configured (§6.4).

**Sub-features:** Hourly Time Tracker (`Hourly` listings → invoice); Repeat-Client Coupon System; Payout Method Setup (**Stripe Connect / Wise / Bank / PayPal**); Tax / VAT Invoice Settings.

**Open decisions / flags.**
- **Escrow provider (resolved):** escrow is **single-rail via Stripe / Stripe Connect** (hold); the payout rails (Stripe Connect / Wise / Bank / PayPal) are the separate disbursement step (§8B) — not competing escrow providers.
- Repeat-client **coupon tier-linkage** (a reward, not a commission mechanic, §1.4) — not yet decided. Dispute-resolution authority (admin-mediated vs. automated) + its effect on the Dispute Penalty.

**Dependencies.** Reads: proposals (§7), catalog packages (§6), commission constant (§1.4). Produces: the four trust signals + `Review` → §5.1; earnings/dispute/delivery data → Analytics (§9); audit events → §12.

---

## 9. Module 5 — Analytics & Growth — **PLANNED (built last)**

A **pure read/aggregation layer** over Modules 2–4's data — no new source-of-truth, no user input. Absorbs the source doc's §9 verbatim; all observations are **deterministic rule-based, never AI** (§2). Built last (nothing to aggregate until upstream modules accrue history — why §6 starts its counters early).

**Sections (source §9):** Business Overview ("Business Performance"); Service Analytics ("Service Performance"); Profile Analytics ("Profile Performance"); Proposal Analytics ("Proposal Performance"); Client Analytics ("Client Relationships"); Growth Tasks.

**Service metrics:** Impressions, Service Views, Enquiries, Orders, Conversion Rate, Average Selling Price, Average Delivery Time, Order Completion Rate, On-Time Delivery Rate, Cancellation Rate, Repeat Orders.
- `Conversion Rate = Orders ÷ Service Views × 100` (e.g. 8 ÷ 42 = 19.05%)
- `Enquiry Conversion = Orders ÷ Enquiries × 100`

**Proposal metrics:**
- `Proposal View Rate = Viewed ÷ Submitted × 100`
- `Response Rate = Client Responses ÷ Submitted × 100`
- `Acceptance Rate = Accepted ÷ Submitted × 100`
- `Average Proposal Value = Total Submitted Value ÷ Submitted Count`
- Declined / withdrawn / expired proposals tracked separately.

**Profile metrics:**
- `Contact Rate = Client Enquiries ÷ Profile Views × 100`
- `Portfolio Engagement = Portfolio Views ÷ Profile Views × 100`
- Also: profile views, search appearances, client enquiries, profile saves, portfolio views, service clicks, returning-visitor rate.

**Revenue metrics:** gross earnings, net earnings, commission, available balance, pending earnings, average project value, highest project value, revenue by service / client / month / category. **Escrow-protected amounts must never be mixed with earned revenue.**

**Client-relationship metrics:** total / new / returning clients, repeat-client rate, repeat-client revenue, average projects per client, average client lifetime value, client-rating average, most-active clients.

**Deterministic growth observations (rule-based, no AI; none auto-executes an action, §2):**
- **Rule 1** — Service Views > 500 AND Conversion < 10% → "This service receives strong visibility but has a low order conversion rate." (review description / pricing / add stronger portfolio examples).
- **Rule 2** — Profile Views > 1000 AND Contact Rate < 5% → "Your profile receives traffic, but few clients start a conversation." (review intro / add portfolio evidence / clarify availability).
- **Rule 3** — Proposal View Rate < 40% → "Many submitted proposals are not being opened by clients." (review titles / apply to more relevant opportunities / confirm brief alignment).
- **Rule 4** — Repeat Client Rate > 30% → "Returning clients are an important source of your project revenue." (review previous clients / share new services manually / update availability).

**Date filters:** Last 7 / 30 / 90 Days, This Year, Previous Year, Custom Range. Comparison: previous period / month / year.
**Data rules:** only verified marketplace activity counts; cancelled test projects excluded; refunded payments don't count as earned revenue; deleted services retain historical metrics; private profile views shown aggregated; client identity may be masked in exports per permission; metrics show an update timestamp.
**Growth Tasks:** e.g. update availability, improve a low-converting service, add a portfolio project, reply to a verified review, complete a profile field, review pricing, follow up on an expiring proposal, update an outdated service, add a recent work sample. Statuses: `Open, In Progress, Completed, Dismissed, Expired`. Tasks never auto-execute a commercial action.

**Empty states (source §9, verbatim):**
- **No Analytics Data** — "Not Enough Activity Yet" / "Performance analytics will appear after clients begin viewing your profile and services."
- **No Service Data** — "No Published Services" / "Publish a service to begin tracking impressions, views and conversions." / Action: "Create Service".
- **No Revenue Data** — "No Revenue Activity" / "Approved and released project payments will appear in your financial analytics."

**Dependencies.** Reads everything from §6–§8; produces nothing consumed elsewhere.

---

## 10. Cross-cutting technical rules (every module)

1. **Auth + ownership on every endpoint.** JWT `[Authorize]` at the controller; every action is **owner-scoped** — the `ProviderId`/`UserId` comes from the authenticated principal, never a request field. An SP can only read/write its own data.
2. **`ApiResponse` envelope on every response.** No bare `Ok(obj)` or ad-hoc shapes; the service layer returns `ServiceProviderResult<T>` and the controller maps it via `Map<T>()`.
3. **No browser storage as source of truth.** No `localStorage` / `sessionStorage` for SP state — the backend is authoritative; a read-through paint cache is the only permitted client cache and must never diverge.
4. **Every time-based rule is backed by a real Hangfire job**, not just a UI countdown — per-brief `expiresAt` (default 72h, max 30 days) TTL index (§7), 7-day auto-release + dispute windows (§8). A UI timer alone is never the enforcement mechanism. (Exception, by design: the skills-test 30-day cooldown is a **read-time** check, §5.3 — no job needed.)

---

## 11. The Service Provider journey (product experience)

This is the **experience** order — what a real SP lives through, in the order they live it — **distinct from §1.2's data-dependency build order** (that's for developers). Because there are **no phases** (§1.1), the journey is not enforced by gating; it is shaped by **purposeful, context-aware empty-states and dashboard nudges**. Each step is tagged **LIVE** (built today) or **PLANNED** (Modules 2–5, not built) so the narrative never implies unbuilt behavior exists.

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

**Getting-started nudge (PLANNED pattern).** With no wizard forcing a path, onboarding guidance must come from **purposeful, context-aware empty-states**, not gating. The first-visit dashboard should surface one clear next step — *"Create your first service listing to start receiving briefs"* — pointing at Catalog (§6), since a listing is the prerequisite that unlocks matching/Leads. This nudge is part of the Module-2 build, **not live today**.

### 11.3 Steady-state / returning-user loop — **PLANNED** (depends on Modules 3–4)

Once listings exist and briefs arrive, a working SP repeats this loop. **All PLANNED — none of these modules are built:**

1. **Check Leads** — new briefs, ranked by the Brief Match Score (§7).
2. **Respond to a brief** — response timestamps feed the real response-rate metric (§7 → Trust §5.1).
3. **On acceptance → Workroom** — the engagement moves to §8.
4. **Deliver via milestones** — submit → 48h client review → revisions up to the package's revision limit → accept or 7-day auto-release (§8).
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

## 12. Notifications (source §11)

Categories: `Opportunities, Proposals, Projects, Deadlines, Revisions, Payments, Reviews, Support, System`.
Fields: `notificationId, recipientId, category, title, message, relatedEntityType, relatedEntityId, isRead, createdAt, actionLabel`.
**Rule:** a notification may *suggest* an action but **never executes** one (§2). Per-module notification lists live in §7 and §8.

## 13. Audit log (source §12)

**Audited actions:** proposal submitted / revised / withdrawn / accepted; contract signed; escrow funded; deliverable submitted; revision requested; milestone approved; payment released; payout requested / completed; project completed; review submitted; administrator override.
Record fields: `auditId, actorId, actorRole, action, entityType, entityId, previousState, newState, timestamp, reason`. **Not user-editable or deletable.**

## 14. Validation & error rules (source §13)

**Field-level examples:** "Enter a proposal price." · "Add at least one deliverable." · "Select a future delivery date." · "Upload at least one delivery file." · "The payout amount exceeds your available balance."
**Business-rule errors:** "This opportunity is no longer accepting proposals." · "This proposal has already been accepted." · "The milestone cannot begin until escrow is funded." · "The project cannot be completed while a revision is open." · "The payout cannot be processed while the account is under review."
**Data-failure behaviour:** preserve user drafts; don't needlessly remove uploaded files; a partial module failure must not block other modules; always offer retry; prevent duplicate submission. (Reinforces §10 rule 3 — backend-authoritative, no browser storage of truth.)

## 15. Security & trust rules (source §14)

Only authorised project participants get workroom access; provider private notes are never client-visible; financial details are never exposed in client-facing modules; payment account numbers are masked; submitted files are security-scanned; suspicious file downloads show a warning; contract / approval / transaction records preserve immutable history; critical actions require confirmation; repeated failed payments or suspicious communication can trigger a support review; all paid work stays under Mondial payment protection. (The SP-domain expression of §10 rule 1 — owner-scoped access.)

---

## 16. Roles & permissions (source §4)

**Service Provider — can:** view opportunities; save/dismiss; create / submit / revise / withdraw proposals; message the client; open an accepted workroom; upload files; submit milestone deliverables; respond to revisions; schedule meetings; view earnings; request payout; download invoices/statements; view analytics; improve service/profile.
**Service Provider — cannot:** accept own proposal; approve own milestone; release own escrow; manually change commission; edit verified reviews; delete financial transactions; overwrite contract records.

**Client — can:** view SP profile; send an opportunity / direct brief; review a proposal; request changes; accept/decline a proposal; upload files; review deliverables; request revisions; approve milestones; submit reviews.
**Client — cannot:** see provider private notes / earnings / payout info; delete deliverable history; secretly reopen approved milestones.

**Platform Administrator — can:** review fraud/safety/disputes; pause suspicious projects; apply payment holds; review verified documents; view audit history; apply a policy-based status override — **always audit-logged** (§13).

---

## 17. Acceptance criteria — per-module "definition of done" (source §15)

- **Module 2 — Service Catalog (§6, full-scope; source §20):**
  - **Delivery time:** independent per-package config; Business/Calendar Days supported; start rule visible; due date calculated correctly (§6.3 formula); add-on adjustment supported; client delay + approved extension supported.
  - **FAQ Builder:** creatable; package-specific; reorderable; draft/published states; package-conflict validation; can't override package terms.
  - **Per-package revisions:** Basic/Standard/Premium each with an independent revision count; correct remaining-revision calculation; request window enforced; one-consolidated-feedback-round rule; scope change never auto-consumes; additional paid revision supported.
  - **Auto-accepted proposal (§6↔§7 boundary):** only from published fixed packages; explicit client confirmation required; payment/escrow authorisation required; provider capacity validated; immutable accepted snapshot; manual-approval fallback exists; acceptance and delivery-start are separate; no AI or silent commercial decision.
  - Impression/click counters seeded; deterministic pricing guidance shown; capacity fields on the profile (§6.7).
- **Module 3 — Leads / Client Acquisition (§7):** opportunities visible; save/dismiss works; proposals draftable / submittable / trackable; changes-request and revision supported; an **accepted proposal converts to a project** (→ `WorkroomEngagement`, §8).
- **Module 4 — Workroom & Earnings (§8):** active projects visible; milestones activate; files uploadable; deliverables submittable with **preserved versions**; client can request a revision and the provider can respond; milestone approval recorded; project completable. Financial: escrow states visible; **gross / commission / net correct** (flat 12%); financial stages separated; available balance correct; payout eligibility validated + tracked; invoice + statement records available.
- **Module 5 — Analytics & Growth (§9):** service / proposal / profile / revenue metrics calculated; repeat-client performance visible; rule-based observations displayed; **no AI action executed** (§2).

**System-wide (source "Final System Rule"):** operates as **independent modules** — not phases, no sequential phase completion, **no AI-generated decisions or AI-executed actions**, no API routing. All business logic, validations, status transitions, permissions, financial calculations, audit history, and cross-module events preserved.

---

## Appendix A — tooling gotcha (preserve)

The repo's **root `.gitignore` is a binary / non-UTF8 file**, which can make the Grep/ripgrep tool **silently mis-parse ignore rules and skip whole directory subtrees**. During Module 1 this produced a false-negative "`Tier_level` doesn't exist" (a search returned only `backend/tests/` and skipped `Models`/`Services`/`Controllers`), later corrected. **Rule:** any "grep found nothing" for a symbol believed to exist must be double-checked with a **direct file open** or **`git log -S"<symbol>"`** — never conclude absence from a single empty grep.

---

## Changelog

**2026-07-27 — consistency audit: all 9 findings fixed.**
- **D1 (HIGH):** renamed the planned SP `Milestone` → **`WorkroomMilestone`** (collection `"WorkroomMilestones"`) to avoid a class-name collision with `BusinessIdeas.cs:119` (§4.3, §8A); FK fields `milestoneId`/`currentMilestoneId` note added.
- **B1:** dropped the now-dangling **`requirementsTemplateId`** from the Proposal entity (§7) — template is embedded on `ServicePackage`, reached via `packageId`; answers via `requirementsStatus`.
- **A1:** §10 rule 4 "72h brief TTL" → "per-brief `expiresAt` (default 72h, max 30 days) TTL index" to match §7.
- **A2:** disambiguated the two "48h" concepts — the **48-hour client review window** (§8A) vs. the **Due Soon threshold** (`<48h remaining before due date`, §6.3/§8A).
- **D2:** renamed `projectStatus` → **`engagementStatus`** on `WorkroomEngagement` (§8A).
- **D3:** added an explicit deliberate-dual-naming note (§7) — entity `ClientBrief`, UI copy keeps "Opportunity/Opportunities" by design.
- **E1:** "smart empty-states" → "purposeful, context-aware empty-states" (§11, both occurrences).
- **F1:** added a §6 Catalog empty state ("No Published Services", reusing §9/§11 wording).
- Verified during the audit (no change needed): commission 12% consistent across §1.4/§7/§8B/snapshot; commit hashes + `SpMatchingService.cs:48` 0.85 + §4.1 fields + enum line refs all still accurate; no Module 2–5 collection created.

**2026-07-27 — cross-section fixes: revision formula, RequirementsTemplate entity, add-ons vs. revisions.**
- **§8A revision formula** corrected to `Included + Purchased Additional − Used` (was `Included − Used`) so a paid extra revision (§8C `Additional Revision Purchased`) is actually usable at delivery time — now matches §6.4.
- **`RequirementsTemplate`** defined as an **embedded** structure on `ServicePackage` (`{ fieldId, label, fieldType, required }` list), resolving the dangling `requirementsTemplateId` reference (§4.3, §6 storage). §6.6 clarifies schema (Module 2) vs. answer-submission (Module 3, a separate `requirementsSubmission` via `requirementsStatus`).
- **Add-ons vs. additional revisions** documented as two separate mechanisms (§6/§6.4): generic `addOns` = non-revision extras only; extra revisions always via the dedicated `additionalRevision*` fields — one code path each.

**2026-07-27 — full-scope Package/Delivery/FAQ/Revision/Proposal reconciliation (§6 replaced).** Absorbed the ServicePackage/Delivery/FAQ/Revision source doc, superseding the smaller Module 2 spec. Added collections `ServicePackages` + `ServiceFAQs` (§4.3); **add-ons embedded** on `ServicePackage` (flagged the source's `addOnIds` reference shape as overridden). §6 now covers Package Builder, validation, delivery-time config (units/day-types/start-rules/clock-states/due-date formula), per-package revision system (calc, request window, one-consolidated-round, scope classes, additional paid revision, unlimited), FAQ Builder, delivery add-ons, cancellation. **Capacity fields** (`maximumConcurrentOrders` etc.) documented on the **already-shipped `ServiceProviderProfile`** — flagged as a real Module-1 code change (§6.7). Requirements template split: schema in Module 2, fulfilment in Module 3 (§6.6). §7: superseded **Proposal** entity (`opportunityId`→`clientBriefId`), acceptance modes, auto-accepted definition + 4 cross-paths, immutable purchase snapshot (**commission = 12% snapshot, never a stored rate**), auto-accept conditions, manual-approval fallback, disallowed transitions, acceptance≠delivery-start. §8C: added Package Published/Purchased, Requirements Completed, Delivery Clock Started, Revision Requested, Additional Revision Purchased. §17 Module 2 criteria expanded (source §20). Doc-only; nothing built.

**2026-07-27 — finalized reconciliation: roles matrix, acceptance criteria, escrow/payout wording, brief-expiry bounds.** Added **§16 Roles & permissions** (source §4 — SP/Client/Admin can/cannot, admin override always audit-logged) and **§17 Acceptance criteria** (source §15 — per-module definition of done). Clarified **§8B**: escrow is single-rail (Stripe/Stripe Connect hold); payout methods (Stripe Connect/Wise/Bank/PayPal) are the separate disbursement step — resolved the §8C escrow flag. Set **§7 brief-expiry bounds**: `expiresAt` client-set, default 72h from publish, capped at 30 days.

**2026-07-27 — reconciled the independent module design doc into the 5-module canon.** Applied the naming map (Opportunity→ClientBrief; new collections Proposals/Milestones/Deliverables/RevisionRequests/FinancialTransactions/Reviews; **Project→WorkroomEngagement + a separate Contract**, not a collapse — see §4.3; source's `ServiceProvider` mapped onto the existing embedded profile, not a new entity). Applied the **commission fix** (removed stored `commissionRate` everywhere; all commission = flat **12%**; every 8% example → 12%). Absorbed: §6 Catalog↔Proposal cross-path (both acquisition paths coexist, one event trail); §7 Leads = source §6 Client Acquisition (ClientBrief + Proposal status models, transitions/restrictions, business logic, filters, notifications, empty states); §8 Workroom & Earnings = source §7+§8 merged (WorkroomEngagement/Milestone/Deliverable/Revision/deadline/completion + amount categories/transaction types/balance/payout/invoice/statement) with the source §10 cross-module event chain; §9 Analytics = source §9 (formulas verbatim, deterministic growth rules); new cross-cutting §12–§15 = source §11–§14. **Flags:** brief expiry is per-brief `expiresAt` (supersedes the earlier fixed "72h TTL" — confirm); escrow provider assumed Stripe (confirm vs. Wise/Bank/PayPal payout rails); source §4 Roles & Permissions and §15 acceptance criteria not yet folded in (available on request). Doc-only; nothing built.

**2026-07-27 — Catalog fields confirmed; revision limit made per-package.**
- **§6 confirmed scope:** per-package **delivery time (days, required)** — the baseline Module 4's On-time Delivery signal measures against — and a per-listing **FAQ** (Q&A pairs).
- **§6 revision count** promoted from a deferred/fixed idea to a **per-package field** (integer or "Unlimited"), set by the SP per package, not a platform constant.
- **§8 reconciled:** removed the fixed "max 3 revisions" rule (it contradicted the new field); Workroom now enforces the revision limit by reading the specific package tied to the engagement at purchase. 48h review / 7-day auto-release / 5-day dispute windows unchanged.
- **§6 still deferred (NOT approved):** buyer-requirements questionnaire (→ Module 3, Leads) and "screens/units included" (pending a category-generalized definition).

**2026-07-27 — model-vs-collection naming disambiguated (Modules 2–4).** Verified the established convention against `MongoDbContext.cs` (singular entity class → plural collection string, dropping `Record`/`Model`/`Entity` suffixes; legacy plural-class names not to be copied) and stated **model → collection** side by side for each planned collection: `ServiceListing`→`"ServiceListings"`, `ClientBrief`→`"ClientBriefs"`, `WorkroomEngagement`→`"WorkroomEngagements"` (§4.3, §6–§8). Doc-only; Modules 2–4 not started in code.

**2026-07-27 — added §11, the SP journey (product experience).** Documented the real end-to-end user flow, distinct from the developer build order (§1.2): first-time signup→verified (LIVE, unchanged), the first-login empty-state experience, the planned steady-state loop (Leads → Workroom → paid → signals feed back), Skills Test / Tier as optional async side-paths, and the empty-state coherence that keeps a zero-data SP from looking broken. Grounded throughout in LIVE (Module 1) vs PLANNED (Modules 2–5); "Requires Attention" / "Recent Activity" flagged as unbuilt Stitch-mockup concepts.

**2026-07-27 — consolidated into a single system-design reference.** Reorganized the whole doc into §1 architecture · §2 AI(none) · §3 design · §4 database · §5–§9 modules 1–5 · §10 cross-cutting, merging the prior sections' overlapping content. Re-verified fresh against code: `ServiceListings`/`ClientBriefs`/`WorkroomEngagements` still unbuilt; commits `b29bcde`/`5e2da20` present; `SpMatchingService.cs:48` still `0.85`; embedded field names current; fonts current. Added §6 candidate fields (delivery-time, revisions, units, buyer questionnaire, FAQ) as **unapproved open decisions**; added §8 payout methods (Stripe Connect/Wise/Bank/PayPal); added §10 cross-cutting rules. STATUS tag `MISSING` → `PLANNED` for unbuilt modules.

**2026-07-27 — commission locked at 12%; AI-implying feature names stripped from the plan.** Flat platform commission locked at **12%** (§1.4, §8); recorded deterministic names for the Stitch-mockup concepts (§2.2) so no AI-implying name reaches code; "Improve Tone" dropped.

**2026-07-26 — SP confirmed AI-free (permanent); provider references corrected; typography corrected; DB collection map added; expanded to full Modules 2–5 plan; SP canon created (flat model, Module 1 shipped).** (Earlier same-day history condensed.)

---

*End of Service Provider system design. Update this doc first, then write the code — never the reverse.*
