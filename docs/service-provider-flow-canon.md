# Mondial.eco — Service Provider System Design (Canonical)

Source of truth for development. When code and this doc disagree, this doc wins — unless a change is agreed and written back here first.

**Last reconciled with code: 2026-07-31.** See the Changelog (bottom) for what changed. If a claim here contradicts the code, treat it as drift to reconcile — not a spec to build back toward — and confirm before acting.

**All five Service Provider modules are now LIVE.** Remaining platform-wide truth in one line: the payment gateway, file scanner, and e-signature/contract-consent mechanism are **STUB** integrations; public profile/search tracking, durable proposal-event history, and test-record provenance are **deferred/not tracked**.

**2026-07-29 — SP data-model split (uncommitted, in review).** Service Provider data now lives in three root collections — `ProfessionalProfiles`, `UserCredentials`, `ServiceProviderProfiles` — with the embedded `ApplicationUser.ServiceProviderProfile` retained as a **temporary read-only migration fallback**. See **Service Provider Data Ownership Architecture** and **Migration Compatibility Reader** below. Creator, Entrepreneur, and Investor models are unchanged; the new collections are currently consumed only by Service Provider workflows.

**Release status: ⛔ NOT RELEASE-READY.** “All five modules LIVE” describes implemented product surfaces, not production-security approval. Provider/client actor separation, self-dealing and self-review prevention, Trust Score manipulation prevention, provider-only controller enforcement, server-side amount/referential/masking/URL validation, internal-path exposure, and vulnerable NuGet dependencies remain backend release blockers (§15.2, §17). Frontend containment in `3a19c1e` is defence-in-depth and must never be represented as server-side authorization or validation.

## 0. How to use this doc

The complete system-design reference for the Service Provider (SP) system: architecture, every module (built and planned), the database picture, the AI decision, and the design system. Two standing instructions for any implementer:

1. Do not invent phases, steps, or features not written here.
2. When a request contradicts this doc, flag the contradiction and confirm before proceeding — do not silently comply.

Every feature carries a STATUS tag:

- **LIVE** — built and canon-correct
- **STUB** — built but fake/placeholder (works, not the real thing)
- **PLANNED** — specced here, not built yet
- **FORBIDDEN** — must never be built (violates a core rule)

Section map: **§1** architecture · **§1A** SP data ownership architecture (split collections, editor, tier, trust, migration, status) · **§2** AI (none) · **§3** design system · **§4** database · **§5** Module 1 Profile & Trust (LIVE) · **§6** Module 2 Service Catalog (LIVE) · **§7** Module 3 Leads (LIVE) · **§8** Module 4 Workroom & Earnings (LIVE) · **§9** Module 5 Analytics & Growth (LIVE) · **§10** cross-cutting rules · **§11** SP journey (product experience) · **§12** notifications · **§13** audit log · **§14** validation/error · **§15** security/trust · **§16** roles & permissions · **§17** acceptance criteria · Appendix + Changelog.

---

## 1. Architecture principles (locked)

### 1.1 No phases — automatic profile verification, then a flat dashboard

The SP experience is **profile completion and immediate verification, then a flat dashboard**. There is no phase-numbered wizard of any kind. Once a complete profile is submitted and verified, the entire dashboard opens at once — a **Fiverr/Upwork model** of independent sections, worked in any order. No sequential unlock.

**The gates in code (LIVE):**
- **Universal Gate** — the shared KYC/onboarding gate every role passes (`OnboardingGate`; sets `Tier_level` to at least 1). Not SP-specific.
- **SP profile verification/onboarding** — the provider fills their profile and submits; a complete first submission is verified immediately, with no admin manual-review step. Carried by two fields on `ServiceProviderProfile`:
  - `CurrentPhase` — an int that **only ever holds 1 or 2** (a profile-completeness marker, advanced one-way 1→2 by `MaybeAdvancePhase` when `IsProfileComplete`). It is **not** a journey counter and must never be grown into one.
  - `VerificationStatus` (`ServiceProviderVerificationStatus`) — normal onboarding is `Pending → submit-verification → Verified`. Submission calls the full `IsProfileComplete` predicate and requires a non-blank headline and bio plus at least one skill, service category, industry, language, pricing model, and portfolio item; the former skill/category/portfolio-only submission minimum is superseded. `VerificationSubmittedAt` and `VerifiedAt` are stamped from the same UTC value, the prior rejection reason is cleared, and Trust is recalculated.

**Admin manual review is not part of normal SP onboarding.** Admin is suspension/moderation only: `Verified → Rejected` through `RejectVerificationAsync`. A rejected provider may remediate and resubmit, producing the controlled loop `Rejected → submit-verification → UnderReview → admin approves to Verified or rejects to Rejected`; `GetPendingVerificationsAsync` contains only that moderation/remediation queue. This is also how an admin initiates re-review of an already-Verified provider: reject first, then review the provider's resubmission. There is no separate direct `Verified → UnderReview` endpoint in the current code.

Crossing to `Verified` is what opens the flat dashboard; every SP who completes and submits the full required profile crosses it immediately during normal onboarding.

**Superseded planning models (never implemented — do not cite as history):** a **9-phase / archetype** model (Builder/Structural/Deal SP) and a later **7-phase / Tier-1–4** model. Neither exists in code. The enterprise planning file `docs/mondial-eco-mvp-final-docs/05_Service_Provider_Journey_v2.0_Enterprise.docx` describes one of these unbuilt journeys — treat it as superseded input; this canon supersedes it.

### 1.2 Five sections, in data-dependency order (not a user sequence)

A verified SP sees all five at once. The order is **build order** (each produces data a later one reads) — **not** a sequence the user walks through:

**Profile & Trust (§5) → Service Catalog (§6) → Leads (§7) → Workroom & Earnings (§8) → Analytics & Growth (§9).**

### 1.3 Storage rule — split SP root collections; embedded profile is legacy fallback *(superseded 2026-07-29)*

**LEGACY (pre-split):** `ServiceProviderProfile` stayed embedded on `ApplicationUser` while it was bounded. That rule is **superseded**: once the profile grew to include professional data, credentials, portfolio, trust, capacity, financial settings, and editor-draft state, every SP write replaced the complete `ApplicationUser` document, and the embedded shape could no longer support independent credential review querying or editor concurrency.

**CURRENT:** SP data lives in three root collections — `ProfessionalProfiles`, `UserCredentials`, `ServiceProviderProfiles` — joined by unique `UserId` (§1A). The embedded `ApplicationUser.ServiceProviderProfile` remains only as a **temporary read-only migration fallback** (frozen after single-write cutover; removed in Phase 6, §1A). **Unbounded records from Service Catalog onward keep their top-level MongoDB collections** (`ServiceListings`, `ClientBriefs`, `WorkroomEngagements`, `PayoutRequests`, …), keyed by `ProviderId`/`UserId` or their owning domain FK — unchanged.

> **FORBIDDEN:** embedding unbounded data (listings, engagements, leads, transactions, time entries) as arrays on `ApplicationUser`, the legacy embedded profile, or any of the three split records.

### 1.4 Commission — flat 12%, Workroom layer, tier-independent

Commission is a **flat 12% platform rate, Fiverr-style**, applied **once, at the Workroom & Earnings escrow-release layer** (§8) on **every completed transaction**. It is **completely independent of `Tier_level` and `TrustScore`** — no sliding scale, discount, or surcharge by tier or reputation. The single source of truth is **LIVE** as `PlatformCommerceConstants.CommissionRate = 0.12m`: Module 3 uses it for proposal earnings previews and Module 4 consumes the same constant when it computes commission at release. There is no second rate and no stored per-provider commission rate.

> **FORBIDDEN:** deriving commission from `Tier_level`, `TrustScore`, or any reputation/ranking input.

### 1.5 `Tier_level` — global/legacy only; SP tier moved to `ProviderTier` *(updated 2026-07-29)*

`ApplicationUser.Tier_level` (`int`) remains the **global/legacy** platform ranking field (Universal Gate still sets it to at least 1). After the SP cutover it is **no longer the SP matching or badge authority** — the SP tier source of truth is `ServiceProviderProfiles.ProviderTier` (§1A Tier canon). **No pricing, commission, or payout relationship of any kind** (§1.4) — true for both fields.

### 1.6 `Trust_score` — legacy field; SP matching dependence removed *(updated 2026-07-29)*

`ApplicationUser.Trust_score` (`int`) is **separate** from the derived SP `TrustScore` (double). **LEGACY:** it previously served as `SpMatchingService`'s rating fallback. That fallback read has been **removed** — matching now reads the split record's `TrustScore` only (§1A Trust canon). The field itself is untouched and survives only inside the temporary embedded-profile fallback until Phase-6 deprecation.

### 1.7 Existing matching engine — `SpMatchingService` (LIVE, split-backed) *(updated 2026-07-29)*

Ranks **Verified, `ProviderTier >= Tier2`** providers offering the requested `ServiceCategory`, from an **indexed `ServiceProviderProfiles` query** (no longer an `ApplicationUsers` scan). The formula is unchanged:

`score = sectorOverlap×0.35 + rating×0.25 + responseRate×0.20 + tierNorm×0.20`

- **`rating`** = the split record's derived `TrustScore`, normalized. The legacy `u.Trust_score` fallback is gone (§1.6).
- **`tierNorm`** = `ProviderTier >= Tier3 ? 1.0 : == Tier2 ? 0.7 : 0.4`.
- **`sectorOverlap`** reads `Industries` from the provider's `ProfessionalProfiles` record.
- **`responseRate`** — **LIVE:** `ResponseRateService` derives the percentage of surfaced briefs answered within 48 hours and persists it to the split record's `TrustBreakdown.ResponseRate`; matching reads that signal.
- **Availability/capacity** is a **hard candidate pre-filter** (`IsEligibleCandidate`), not another formula term: unavailable or at-capacity providers are excluded before scoring.

**Fixed with the split:** the legacy `Tier_level >= 2` query filter was unsatisfiable — no code path ever wrote a tier above 1, so the candidate pool was empty in normal operation. `ProviderTier` has a real server-controlled writer (verification → Tier2, §1A), so verified providers now actually enter the pool. Leads (§7) reuses this exact formula as the "Brief Match Score"; it must not spawn a parallel scoring engine.

---

## Service Provider Data Ownership Architecture

*(§1A — implemented 2026-07-29, currently uncommitted/in review. SP-only: **`CreatorProfile` remains unchanged, `EntrepreneurProfile` remains unchanged, `InvestorProfile` remains unchanged.** The three collections below are consumed only by Service Provider workflows; adoption by another role requires a separate approved migration.)*

**Why the split was introduced.** The embedded SP profile had grown to include professional data, credentials, portfolio, trust, capacity, financial settings, and editor-draft state. Every SP write replaced the complete `ApplicationUser` document, creating race risks between profile editing, trust recomputation, capacity updates, and financial updates. Credentials required independent review querying and indexing; admin review queues were scanning **all** `ApplicationUser` documents; and the four-step Profile Editor requires multi-document concurrency and atomic submission controls. Shared professional data may be reusable by other roles in the future — but **no other role is migrated in this version**.

**Final ownership decision:**

```text
ApplicationUser
→ Account, identity, KYC, onboarding and other role models

ProfessionalProfiles
→ Shared professional presentation data, currently SP-only

UserCredentials
→ Independent credential records and review lifecycle

ServiceProviderProfiles
→ Service Provider-specific business and reputation data
```

### 1A.1 Canonical collection map

```text
ApplicationUsers
├── Authentication and account identity
├── Contact and address
├── KYC
├── Universal onboarding
├── Global/legacy Tier_level
├── CreatorProfile — unchanged
├── EntrepreneurProfile — unchanged
├── InvestorProfile — unchanged
└── Embedded ServiceProviderProfile
    └── Temporary read-only migration fallback

ProfessionalProfiles
├── UserId · Headline · Bio · Professional Overview
├── Profile Image · Cover Image
├── Experience · Education · Skills
├── Languages and proficiency (+ temporary legacy Languages mirror)
├── Industries · Social Links · Public availability display
├── Profile Version · Editor Draft
└── CreatedAt / UpdatedAt

UserCredentials
├── Credential Id (stable GUID, preserved by migration) · UserId
├── Credential kind · Title · Issuing organisation
├── Issue date · Expiry date · Credential number
├── Document reference · Display filename
├── Status · Provider-visible review note · Applicable roles
└── Submission/review timestamps · CreatedAt / UpdatedAt

ServiceProviderProfiles
├── UserId · ProviderId · Current phase
├── Provider verification lifecycle · Provider Tier
├── Service categories · Pricing models · Portfolio
├── Trust Score and breakdown · Skills-test attempts
├── Capacity · Order availability · Financial settings
└── CreatedAt / UpdatedAt
```

### 1A.2 Data ownership (one canonical owner per field)

- **ApplicationUser owns:** authentication; email/phone; name; address; refresh-token/account state; KYC; universal onboarding; global legacy `Tier_level` (**not** the SP tier source after the split, §1A.8); the unchanged `CreatorProfile`/`EntrepreneurProfile`/`InvestorProfile`; and the temporary embedded SP fallback during migration.
- **ProfessionalProfiles owns:** Headline; Bio; Professional Overview (sanitised Tiptap JSON + plain text); profile image; cover image; Experience; Education; Skills; Industries; Languages **with proficiency** (plus the temporary plain-`Languages` compatibility mirror, kept in step on every write, removed in Phase 6); Social Links; public availability display; `ProfileVersion`; `EditorDraft`.
- **UserCredentials owns:** one document per credential; owner identity via `UserId` (always the authenticated principal, never a body field); credential details; the credential document reference; review status and lifecycle; `ApplicableRoles` — initially `[ServiceProvider]`, extensible without schema change.
- **ServiceProviderProfiles owns:** provider verification lifecycle; `ProviderTier`; service categories; pricing models; portfolio; `TrustScore`; `TrustBreakdown`; `HasEnoughTrustData`; `SkillsTestAttempts`; capacity (`MaximumConcurrentOrders`); active-order count (`CurrentActiveOrders` — targeted-increment writer only); new-order availability; `FinancialSettings`.

No back-reference IDs are stored on `ApplicationUser` — all three collections join by unique `UserId`.

### 1A.3 Four-step Profile Editor — backend behaviour

The steps remain: **1. Identity & Overview · 2. Experience & Education · 3. Skills & Languages · 4. Credentials.**

- **Opening the editor** loads published data from the split collections, loads owner credentials separately, and seeds an **in-memory** draft when no saved draft exists. Opening performs **no database write** and never changes the public profile.
- **Step saves** write only `ProfessionalProfiles.EditorDraft` (a targeted draft-field update — published fields are untouched). The draft contains: `BasedOnVersion`, `LastStep`, Headline, Bio, Professional Overview, profile/cover media references where the current flow supports them, Experience, Education, Skills, Languages, Industries, and **draft values** for Service Categories and Pricing Models. Categories and pricing remain **SP-specific published data owned by `ServiceProviderProfiles`** — their draft values are only coordinated through the professional draft so the final submit stays atomic. **Step saves must not publish profile or business fields.**
- **Credentials are not embedded in `EditorDraft`.** Credential upload creates or updates an independent `UserCredentials` record. Credential files survive profile validation failure, final-submit failure, and transaction rollback. Uploading never auto-verifies the credential or the provider.

```text
Profile View
    ↓ Edit Profile
ProfessionalProfiles.EditorDraft
    ↓ Step 1–4 saves
Draft only — no public publish
    ↓ Final Submit
MongoDB transaction
    ├── ProfessionalProfiles publish
    ├── ServiceProviderProfiles publish
    └── UserCredentials → PendingReview
    ↓
ProfileVersion + 1
EditorDraft cleared
    ↓
Updated Profile View
```

Credential verification remains a later authorised review action — never part of submit.

### Atomic Profile Submission

Final submission touches **ProfessionalProfiles + ServiceProviderProfiles + UserCredentials**. The preferred path is **one MongoDB multi-document transaction** (`Mongo:TransactionsEnabled=true`, the same replica-set requirement Module 4 already enforces, §8.0):

```text
1. Load ProfessionalProfile inside the session
2. Compare EditorDraft.BasedOnVersion with ProfileVersion
3. Reject stale submissions
4. Validate all four steps
5. Publish professional profile fields
6. Publish Service Provider categories and pricing
7. Promote eligible credential records to PendingReview
   (Draft or ResubmissionRequired, WITH an attached document; Verified untouched)
8. Increment ProfileVersion exactly once
9. Clear EditorDraft
10. Commit transaction
```

*(In the implementation, steps 1–3 are realised as a version-conditional replace — the write predicate `ProfileVersion == BasedOnVersion` **is** the concurrency check; zero matches aborts the transaction.)*

**Failure behaviour:** no partial profile publication; no partial category/pricing publication; no partial credential promotion; `ProfileVersion` does not increment; `EditorDraft` remains available; the existing public profile is unchanged.

**Gated fallback** (only when `Mongo:TransactionsEnabled=false`): ordered writes — `Credentials → ServiceProviderProfile → ProfessionalProfile publish → ProfileVersion increment and draft clear last`. The `ProfileVersion` update is the fallback **commit point**. Fallback writes are **not fully atomic**; retries must be (and are) idempotent and convergent — credential promotions and the SP upsert re-apply harmlessly, and nothing reads the new state until the version-conditional publish lands.

### Profile Concurrency

- `ProfessionalProfiles.ProfileVersion` is the **single** editor concurrency token.
- `EditorDraft.BasedOnVersion` records the published version editing began from.
- A stale submit returns a **conflict** rather than overwriting another tab's changes.
- The version increments **once per successful final submission**; draft saves never increment it. (The legacy non-wizard profile upsert also bumps it once per publish, so an open editor correctly conflicts with it.)
- Capacity, trust, and financial updates **no longer replace the full `ApplicationUser` document** — they are targeted split-record writes (the engagement counter is a guarded increment), which removes the previous unrelated last-write-wins races.

### 1A.4 Credential canon

Status lifecycle (server-controlled):

```text
Draft → PendingReview → Verified
PendingReview → Rejected
Rejected → ResubmissionRequired → PendingReview
```

- Provider-created actions may produce **only** `Draft` or `PendingReview`. `Verified`, `Rejected`, and `ResubmissionRequired` require authorised review. `Expired` is **derived** from `ExpiresAt` at projection time — never provider-set, never persisted.
- Uploading a document grants **neither** provider verification **nor** `ProviderTier`.
- Credential number is **owner-only**; the document URL is **owner/reviewer-only**.
- Public profiles expose **verified credential summaries only** — never document URLs, `StorageKey`, credential numbers, `ReviewNote`, or pending/rejected credentials.
- Replacement order: `Validate new file → Save new file → Persist new reference → Delete superseded owned file`. A failed replacement preserves the previous document.

### 1A.5 Media ownership

```text
ProfessionalProfiles
├── ProfileImage
└── CoverImage

ServiceProviderProfiles
└── PortfolioItem.PrimaryImage

UserCredentials
└── Credential.Document
```

Physical files were **not moved** by the split; the existing `SaveFile.cs` remains the permanent file-saving mechanism; MongoDB stores **references and metadata only — no binary or Base64 media**. `StorageKey` is server-internal; public projections expose only approved `PublicUrl` values; physical server paths must never appear in browser responses. `StorageKey` and `PublicUrl` currently may hold the same relative value for compatibility, but they remain separate semantic fields. Legacy `PortfolioItem.ImagePath` remains temporarily for compatibility and is deprecated (Phase 6).

### 1A.6 Migration Compatibility Reader

*(Also referenced as “Migration Compatibility Reader” from the header block.)* SP responses are built by an aggregate reader:

```text
ProfessionalProfile + ServiceProviderProfileRecord + UserCredentials
→ Existing ServiceProvider DTO (names unchanged)
```

Dual-read rules — **per user**, never assumed globally complete:

```text
Split records exist       → read the new collections
Split records do not exist → read embedded ApplicationUser.ServiceProviderProfile
```

Migrated and unmigrated providers may coexist. Existing frontend DTO names remain stable. Completion percentage is computed over the aggregate data through the one existing formula — the reader **must not duplicate it**. **No indefinite dual-write:** after single-write cutover, all SP writes go to the split collections (migrate-on-write seeds a user's records from the frozen embedded copy on first touch) and the embedded SP data is frozen read-only.

### 1A.7 Migration phases (SP-only)

1. **Additive foundation** — create the three collections + indexes; no behaviour change. *(done)*
2. **Dual read** — prefer new records, fall back to embedded per user. *(done)*
3. **Single write** — all new SP writes go to split collections; embedded profile frozen (unit tests assert `UserManager.UpdateAsync` is never called by SP services). *(done)*
4. **Migration** — idempotent upsert by `UserId`; preserves stable IDs, `ProfileVersion`, `EditorDraft`, Trust data, media references, and credential review state; physical files not moved. *(implemented: migrate-on-write + sweep; production sweep not yet run)*
5. **Verification** — record counts, missing-reference checks, stable-ID checks, credential counts, canonical JSON checksums (both read paths projected through the same DTO mapping, then hashed), Trust equality, `ProfileVersion` equality, draft equality, idempotency. *(implemented; not yet run against production)*
6. **Legacy deprecation** — only after all readers have moved: remove the embedded SP fallback, legacy duplicate fields, and the old `Trust_score` fallback; repoint remaining legacy consumers; repoint the Creator-side designer-card readers through an approved separate change. **Phase 6 is NOT completed by the current implementation.**

### 1A.8 Provider Tier canon (SP source of truth)

`ServiceProviderProfiles.ProviderTier` — enum `Tier1 | Tier2 | Tier3 | Tier4`.

- **Tier 1** — default provider state; basic identity/profile access; cannot accept paid marketplace work where Tier-2 eligibility is required (matching and paid-eligibility gates require Tier 2+).
- **Tier 2** — server-controlled verified-provider eligibility; enters SP marketplace/matching per current gates. **Exact server-controlled assignment (code-proven):** the verification paths grant Tier 2 when the current tier is lower — both the normal-onboarding automatic verification of a complete first submission (§1.1/§11.1) and admin approval of a remediated `UnderReview` provider. Assignment never downgrades a higher, separately-earned tier.
- **Tier 3** — reserved for authorised evaluation based on verified track record and reputation criteria. **No writer exists yet.**
- **Tier 4** — reserved for Mondial-vetted elite providers. **No writer exists yet.**

Critical rules: the provider cannot directly update Tier; profile submit cannot update Tier; credential upload cannot update Tier; Tier 3/4 currently have **no provider-controlled writer** (nor any writer). Tier affects **matching priority, not pricing** — it never changes gross service prices and never changes the fixed **12% platform commission** (§1.4). `ApplicationUser.Tier_level` remains global/legacy and is **not** the SP matching authority after cutover (§1.5).

### 1A.9 Trust Score canon (SP source of truth)

`ServiceProviderProfiles.TrustScore` is the **only** SP Trust Score source of truth, derived exclusively from `TrustBreakdown` by the single recompute path. Rules: never client-set; recomputed only from the approved signals (locked weights and dispute penalty unchanged, §5.1); `ApplicationUser.Trust_score` is **legacy only** — new SP matching and analytics do not depend on it; the public profile displays TrustScore only when `HasEnoughTrustData` is true; raw trust-signal internals remain server-only.

### 1A.10 Implemented indexes

- **ProfessionalProfiles:** unique `UserId`; `UpdatedAt` descending.
- **UserCredentials:** `UserId`; compound `Status + SubmittedAt` (review queue); sparse `ExpiresAt`.
- **ServiceProviderProfiles:** unique `UserId`; `ProviderId`; compound `VerificationStatus + VerificationSubmittedAt` (admin verification queue — replaces the legacy all-users scan); `ServiceCategories` (multikey); `NewOrderAvailability`; `ProviderTier`; `UpdatedAt` descending.
- **Deferred (do NOT assume they exist):** public slug; `Skills`; `Industries`; `ApplicableRoles` — each waits for a real consumer.

### 1A.11 Security & projection visibility

| Visibility | Fields |
|---|---|
| **Public** | Published headline; Bio; sanitised Professional Overview; Skills; Industries; Languages + proficiency; Experience; Education; public profile/cover URLs; Portfolio; Categories; Pricing Models; **verified credential summaries only**; Trust Score only when enough data exists; verification badge; public availability |
| **Owner-only** | `EditorDraft`; `BasedOnVersion`/`ProfileVersion` conflict information; credential number; credential document URL; credential filename; pending/rejected credentials; provider-facing `ReviewNote`; profile-completion guidance |
| **Admin/reviewer-only** | Review actions; pending queues; submitter identity; internal review data where stored elsewhere |
| **Server-only** | `StorageKey`; physical paths; raw `TrustBreakdown` signals; `FinancialSettings` internals; audit records |

Raw collection documents must never be returned directly — every response goes through a projection.

### 1A.12 Module data-source map (post-cutover)

- **Aggregate reader / ProfessionalProfiles:** Profile View; Profile Editor; profile completeness; Professional Overview; profile/cover media; SP dashboard professional details; matching professional fields (Industries); analytics profile-completion fields.
- **ServiceProviderProfiles:** verification gates; Service Catalog capacity; Leads eligibility; SP matching eligibility; Workroom active-order counter; trust recomputation; analytics Tier and Trust; portfolio; financial settings.
- **UserCredentials:** credential editor; credential file replacement; admin review queue; public verified credentials; expiry projection.
- **Unchanged transactional collections:** service listings, client briefs, proposals, engagements, workrooms, milestones, deliverables, reviews, transactions, payouts — none moved or reshaped; only how they load provider profile state changed.

## Implementation Status

*(2026-07-29 — the SP data-model split, working tree, **uncommitted**, pending review.)*

- Backend data-model split is **implemented**; the existing Profile Editor backend work was **refactored onto the split model** (preserved, not restarted).
- Embedded SP data remains a **read-only fallback**; the split migration is implemented and **idempotent** (migrate-on-write + sweep + checksum verification).
- **Focused split tests: 18 passed.** **Full backend suite: 622 passed, 0 failed, 60 skipped.** **Release build: passed with 0 errors.** **Replica-set transaction tests: 3 added, locally skipped** (Docker unavailable) — compile-verified only; they still require execution against a working replica-set environment. Replica-set transaction behaviour is **not runtime-verified locally**.
- **Not yet done:** production migration sweep + verification run; Phase-6 legacy removal; frontend Profile View/Edit route split and the four-step wizard UI (the next implementation stage).
- **The entire Service Provider portal is NOT release-ready** (§15.2) — the split does not resolve the standing backend security blockers.

**Known technical debt (unchanged by the split, plus split follow-ups):** provider/client actor separation; self-dealing prevention; self-review prevention; provider-only role enforcement; financial validation; sensitive-value masking; referential validation; Workroom internal storage-path exposure; backend URL validation; stub-only file scanning; existing vulnerable dependencies; production migration execution; replica-set transaction test execution; Phase-6 embedded-field deprecation; remaining Creator-side designer-card repointing. These do not invalidate the data-model split implementation, but they prevent declaring the entire SP portal production-ready.

---

## 2. AI — the SP system uses NONE (permanent)

**Permanent architectural decision: the SP system uses no generative AI anywhere.** Not now, not as a future-upgrade stub. Every feature that *sounds* AI-branded is deterministic.

### 2.1 The "smart-sounding" features are deterministic

- **Brief Match Score** (§7) = the `SpMatchingService` weighted formula (§1.7). Not an LLM call.
- **Pricing guidance** (§6) = a deterministic suggested-price-range lookup by `ServiceCategory`. Not AI, no upgrade path.
- Any **"suggested keywords" / "suggested next steps"** style feature, *if* built, must be a **rule-based lookup/trigger** — never generative text.

### 2.2 No AI-implying names — rename on sight (from the Stitch mockups)

The Stitch mockups label features with AI/generative-sounding names. The table below remains the locked deterministic vocabulary now that all five modules are live; none of these labels authorizes an AI feature.

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

The Service Provider workspace is a **scoped light-only surface**. `dashboard/layout.tsx` detects `/dashboard/serviceprovider` routes, applies the `sp-workspace` boundary, hides the generic dashboard top bar, renders the SP mobile header, and supplies shared responsive content padding (`16px / 24px / 32px`). `.sp-workspace` in `globals.css` pins the canonical light variables even when another role has selected the global dark theme; the global theme provider, toggle, and dark tokens remain unchanged for other roles. Shared `Sp*` primitives and approved SP components use the same light palette (`#F4F5F7` workspace, white cards, `#E5E7EB` hairlines, `#3C61DD` primary accent). **Typography, verified against `src/lib/fonts.ts`, `src/app/layout.tsx`, and SP components:**

- **Headings — Inter** (`--font-inter`, exposed as `--font-heading`). Loaded via `next/font/google`, applied in `layout.tsx`.
- **Body — DM Sans** (`--font-dm-sans`, exposed as `--font-sans`).
- **Numbers — DM Sans.** The SP workspace does not apply a dedicated monospace face.
- **Playfair Display** (`--font-playfair`) is loaded but **not applied globally** — available-but-unused.

> **Correction (propagated doc-wide):** SP does **NOT** use **Syne** or **JetBrains Mono** — neither is installed anywhere in the codebase. No SP doc or UI copy may reference that trio.

**Unified SP navigation — LIVE.** The preserved shell uses one flat, query-aware primary navigation: Dashboard; Profile & Trust; Client Briefs; Pipeline; Active Projects; Completed Projects; Service Catalog; Analytics & Growth; and Earnings & Payouts. Earnings & Payouts alone expands to Earnings Overview, Payouts, and Financial Settings. There is no duplicate page-level sidebar/header and no top-level general Settings link. Active-state resolution includes canonical query defaults, and expanded state resynchronizes after navigation. The mobile header exposes the sidebar trigger, contextual title/wordmark, notifications, and account menu. Breadcrumbs come from the canonical terminology map rather than raw route segments. `/dashboard/serviceprovider/phase-1` retains navigation access and the same light shell; its Universal Gate logic is unchanged and the UI does not present a numbered phase journey.

---

## 4. Database — what's real vs. what's planned

**Verified reality (2026-07-29):** SP profile data now lives in the three split root collections (`ProfessionalProfiles`, `UserCredentials`, `ServiceProviderProfiles` — §1A); the embedded copy on `ApplicationUsers` is a **temporary read-only migration fallback**. Modules 2–5 own the top-level collections listed below. Module 4 added 16 unbounded execution, financial, and audit collections; Module 5 added only the stateful manual-task collection and stores no metric snapshots.

### 4.1 `ApplicationUsers` (existing top-level collection) — SP-relevant contents *(embedded profile = LEGACY FALLBACK, frozen after cutover)*

Registered as `GetCollection<ApplicationUser>("ApplicationUsers")` in `DbContext/MongoDbContext.cs`. SP fields on `ApplicationUser` (exact names):

- `Tier_level` (`int`) — global/legacy only after the split (§1.5); SP tier is `ServiceProviderProfiles.ProviderTier` (§1A.8).
- `Trust_score` (`int`) — legacy; the matching fallback read was removed (§1.6).
- `ServiceProviderProfile` (embedded object — **read-only fallback for unmigrated users; no SP service writes it after cutover**):
  - `ProviderId` (`string`), `CurrentPhase` (`int`, default 1)
  - `VerificationStatus` (`ServiceProviderVerificationStatus`), `VerificationSubmittedAt` (`DateTime?`), `VerifiedAt` (`DateTime?`), `RejectionReason` (`string`)
  - `TrustScore` (`double`) — derived (§5.1)
  - `Skills` (`List<string>`), `ServiceCategories` (`List<ServiceCategory>`), `PortfolioItems` (`List<PortfolioItem>`)
  - `Headline` (`string`), `Bio` (`string`), `Industries` (`List<string>`), `Languages` (`List<string>`), `PricingModels` (`List<PricingModel>`)
  - **Module 1 additions:** `TrustBreakdown` (`TrustScoreBreakdown`), `HasEnoughTrustData` (`bool`), `SkillsTestAttempts` (`List<SkillsTestAttempt>`)
  - **Module 2 additions:** `MaximumConcurrentOrders`, `CurrentActiveOrders`, `NewOrderAvailability`, `ManualApprovalWhenCapacityLow`
  - **Module 4 addition:** `FinancialSettings` (`ProviderFinancialSettings`, embedded — never a collection)
  - **Profile-editor additions (frozen with the rest of the embedded copy):** `Experiences`, `Education`, `LanguageProficiencies`, `Credentials`, `ProfileVersion`, `EditorDraft`
  - `CreatedAt` (`DateTime`), `UpdatedAt` (`DateTime`)

Embedded types (all nested in `ServiceProviderProfile`; none has its own collection):
- **`TrustScoreBreakdown`** — `ClientSatisfaction`, `OnTimeDelivery`, `ResponseRate`, `RepeatClientRate`, `SkillTest` (each a `TrustSignal`); `HasDisputes` (`bool`); `DisputePenalty` (`double`); `LastRecalculatedAt` (`DateTime?`).
- **`TrustSignal`** — `HasData` (`bool`), `Value` (`double`).
- **`SkillsTestAttempt`** — `Category` (`ServiceCategory`), `Score` (`int`), `Passed` (`bool`), `TakenAt` (`DateTime`), `NextEligibleRetestAt` (`DateTime`).
- **`PortfolioItem`** — `Id` (stable server-owned GUID), `Title`, `Description`, `Url`, `ImagePath` (`string`, legacy/deprecated), `PrimaryImage` (`ProviderMediaAsset?`), `ImageCaption`, `AddedAt` (`DateTime`).
- **`ProviderFinancialSettings`** — `PayoutMethods[]`, `DefaultPayoutMethodId`, `Tax`, `AccountOnHold`, `MinimumPayoutAmount`; nested `MaskedPayoutMethod` and `ProviderTaxSettings` fields are listed in §8.0.1.

**Storage-rule check:** ✅ compliant with the **updated** §1.3 — the split records own SP data; the embedded copy is a temporary read-only fallback, not the canonical store.

### 4.2 Shared enums — reuse, never fork

Authoritative vocabulary for the whole SP domain; every module reuses these, none defines a parallel list.

- **`ServiceCategory`** (`ApplicationUser.cs:359`): `Development, Design, Marketing, Legal, Finance, Accounting, Operations, Strategy, DueDiligence, FundraisingSupport, AiAutomation, HrRecruitment, Other`.
- **`PricingModel`** (`ApplicationUser.cs:380`): `FixedPrice, Hourly, MonthlyRetainer, ProjectBased, EquityCompensation, RevenueShare, Other`.

> **Ordinal-stability (hard rule):** both are **serialized as Int32 ordinals**. Existing entries keep their order and `Other` stays last — new values are **appended only**. Reordering silently corrupts every stored document. (There is no "milestone-based" or "custom quote" pricing model — if wanted, they must be appended as a deliberate decision.)

### 4.3 Collections — real vs. planned

**EXISTS today:**
- **`ApplicationUsers`** — holds the legacy embedded fallback above.
- **`ProfessionalProfiles`** (`ProfessionalProfileRecord`) — SP data split (§1A, 2026-07-29, uncommitted). Role-neutral professional presentation data, **SP-only for now**; unique `UserId`.
- **`UserCredentials`** (`UserCredentialRecord`) — SP data split. One document per credential, stable-GUID `_id`, server-controlled review lifecycle, `ApplicableRoles = [ServiceProvider]`.
- **`ServiceProviderProfiles`** (`ServiceProviderProfileRecord`) — SP data split. SP business/reputation data incl. `ProviderTier`; unique `UserId`.
- Indexes for the three split collections are established best-effort via **`EnsureProfileSplitIndexes()`** in both `MongoDbContext` constructors (§1A.10).
- The skills-test question bank is **static in-code** (`SkillsTestQuestionBank.cs`), **not** a collection.
- **`ServiceListings`** (`ServiceListing`) — Module 2, §6 (LIVE, `533d2e2`). Service-level record + `Impressions`/`Clicks` counters; owns its packages via a `ServiceId` FK.
- **`ServicePackages`** (`ServicePackage`) — Module 2, §6 (LIVE). Per-service Basic/Standard/Premium/Custom packages, keyed by `ServiceId`; **add-ons + requirements template embedded** as bounded arrays. Real field list: §6.0.1.
- **`ServiceFAQs`** (`ServiceFAQ`) — Module 2, §6 (LIVE). Per-service/package FAQ entries (nullable `PackageId`).
- Indexes for the three are established best-effort via **`EnsureServiceCatalogIndexes()`** (ServiceListings by `ProviderId`; ServicePackages/ServiceFAQs by `ServiceId`), called from both `MongoDbContext` constructors.
- **`ClientBriefs`** (`ClientBrief`) — Module 3, §7 (LIVE, `d419ed1`). Client-authored acquisition briefs; real field list: §7.0.1.
- **`ClientBriefInteractions`** (`ClientBriefInteraction`) — Module 3, §7 (LIVE). Provider-relative viewed/saved/dismissed state plus the response-window anchor; unique by (`ProviderId`, `ClientBriefId`).
- **`Proposals`** (`Proposal`) — Module 3, §7 (LIVE). Negotiated proposals and published-package purchase snapshots; revision history is embedded.
- Indexes for the three Module-3 collections are established best-effort via **`EnsureLeadsIndexes()`**. There is deliberately **no TTL index**; `ClientBriefExpirationJob` performs soft lifecycle transitions.
- **`WorkroomEngagements`** (`WorkroomEngagement`) — Module 4, §8 (LIVE, `7e31162`); unique by `ProposalId`.
- **`Contracts`** (`Contract`) — Module 4 (LIVE); one contract per engagement, with bounded `ContractTerms` embedded.
- **`WorkroomMilestones`** (`WorkroomMilestone`) — Module 4 (LIVE); funded delivery/review/release units under an engagement.
- **`Deliverables`** (`Deliverable`) — Module 4 (LIVE); separate version documents whose submitted content is never overwritten (the prior row's status becomes `Superseded`).
- **`RevisionRequests`** (`RevisionRequest`) — Module 4 (LIVE); consolidated feedback and manual scope classification.
- **`FinancialTransactions`** (`FinancialTransaction`) — Module 4 (LIVE); provider ledger rows with unique idempotency keys and no stored commission rate.
- **`Reviews`** (`Review`) — Module 4 (LIVE); one verified review per engagement.
- **`WorkroomTasks`** (`WorkroomTask`), **`ClientInputRequests`** (`ClientInputRequest`), and **`WorkroomFiles`** (`WorkroomFile`) — Module 4 (LIVE) coordination/file records.
- **`PaymentOperations`** (`PaymentOperation`) — Module 4 (LIVE); idempotent external-operation/reconciliation records. The active adapter is a STUB (§8.0).
- **`PayoutRequests`** (`PayoutRequest`), **`Invoices`** (`Invoice`), and **`HourlyTimeEntries`** (`HourlyTimeEntry`) — Module 4 (LIVE) financial-support records.
- **`WorkroomAuditEvents`** (`WorkroomAuditEvent`) — Module 4 (LIVE). This is the real name; the original generic `AuditEvents` label drifted.
- **`RepeatClientCoupons`** (`RepeatClientCoupon`) — Module 4 (LIVE); tier-independent repeat-client rewards.
- Module-4 indexes are established best-effort via **`EnsureWorkroomIndexes()`**, including unique `WorkroomEngagement.ProposalId`, `Contract.EngagementId`, `Review.EngagementId`, payment/financial idempotency keys, and invoice numbers. Full fields: §8.0.1.
- **`GrowthTasks`** (`GrowthTask`) — Module 5 (LIVE, `c64aab5`); provider-owned manual tasks with lifecycle state. `EnsureAnalyticsIndexes()` indexes `ProviderId + Status + UpdatedAt`.
- **No analytics-metric collection exists by design.** Module 5 computes metrics and observations at read time over Modules 2–4; there are no metric snapshots, tracking-event collections, cache documents, or export records (§9).

**Naming convention (verified against `MongoDbContext.cs`):** the **entity class is singular** PascalCase; the **collection string is its plural** (`ApplicationUser` → `"ApplicationUsers"`, `DealExecution` → `"DealExecutions"`, `Conversation` → `"Conversations"`). Where a class carries a `Record`/`Model`/`Entity` suffix, the collection drops it and pluralizes the core noun (`EntrepreneurProfileRecord` → `"EntrepreneurProfiles"`, `ContactModel` → `"Contacts"`). A few **legacy** classes are themselves plural (`BusinessIdeas`, `Investments`, `Transactions`, `Companies`) — **do not copy that**; new SP models follow singular-class → plural-collection.

**Deferred storage truth:** no Module-4 or Module-5 collection remains to build from the approved specs. Future upstream tracking may require deliberately designed event/history storage, but none is implied or silently created by the current `notTracked` metrics (§9.0).

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

Extends the embedded `ServiceProviderProfile` into a trust/reputation layer. The owner-scoped Profile & Trust workspace renders honest profile/completeness states throughout onboarding; verified-only trust actions (including skills tests) remain guarded by verification status.

### 5.1 Derived TrustScore (never hand-set) — LIVE

`ServiceProviderProfile.TrustScore` (double, 0–100) is **DERIVED**. `RecalculateTrustScore` is its **sole writer** — no endpoint hand-sets it. It renormalizes the weighted average **across only the signals that have data**, so a single available signal scores on the full 0–100 range, not capped at its weight.

| Signal | Weight | Data source | Status |
|---|---|---|---|
| Client Satisfaction | 40 | Workroom & Earnings (§8) | **LIVE** (`WorkroomService.RefreshTrust`) |
| On-time Delivery | 25 | Workroom & Earnings (§8) | **LIVE** (`WorkroomService.RefreshTrust`) |
| Response Rate | 15 | Leads (§7) | **LIVE** (`ResponseRateService`) |
| Repeat-Client Rate | 10 | Workroom & Earnings (§8) | **LIVE** (`WorkroomService.RefreshTrust`) |
| Skill Test | 10 | §5.3 | **LIVE** |

- **Dispute Penalty — LIVE:** not part of the 100 base; it is subtracted afterward, unnormalized, only when disputes exist (`HasDisputes`). Module 4 counts adverse `ClientFavored` or `Split` dispute outcomes at **5 points each, capped at 20**.
- All four Module-4 signals enter through `ServiceProviderService.UpdateWorkroomTrustSignalsAsync`, which calls the existing private `RecalculateTrustScore`. **No parallel TrustScore writer was introduced.**
- **Renormalization example:** with only the skills-test signal present, `score = skillTestValue` (a 90% test → TrustScore 90), not 9.

### 5.2 Neutral "not enough data" state — LIVE

`HasEnoughTrustData` is **false until at least one signal has data** — **the skills test alone is sufficient** to flip it true. While false, the derived score is 0 and the UI shows a neutral "building your trust score" state and **ignores** the number. On approval, `RecalculateTrustScore` runs against an empty breakdown, so a freshly-verified provider reads as neutral (this replaced the old hand-set 50 baseline).

### 5.3 Skills Test — LIVE mechanism, STUB content

Optional, non-blocking, post-verification.

- **Question bank** — `SkillsTestQuestionBank.cs`, static in-code, per `ServiceCategory`. **STUB content:** a small manually-authored generic-professional placeholder set re-tagged per category — not production per-category content (authoring that is deferred). Correct answers are server-side only, never sent to the client.
- **Mechanism (real):** random 5-question selection; server-side auto-grade; **70% pass**; **30-day cooldown** via `NextEligibleRetestAt` (read-time check, no Hangfire). A recorded attempt feeds the Skill Test signal and triggers `RecalculateTrustScore`. Signal value = mean of the most-recent attempt score per distinct category.

### 5.4 Tier badge — ranking-only — LIVE *(source updated 2026-07-29)*

`tierLevel` on the trust/dashboard responses is rendered as a **ranking-only** badge, visually distinct from the score. **Source after the split:** `ServiceProviderProfiles.ProviderTier` for migrated providers; the legacy `Tier_level` clamp only inside the embedded fallback (§1A.8, §1.5). **No commission/pricing/payout language near it** — tooltip says it affects match ordering only.

### 5.5 Endpoints (all `/api/service-provider`, `[Authorize]`, owner-scoped, `ApiResponse`)

`GET trust` · `GET skills-test/status` · `GET skills-test/questions?category=` · `POST skills-test/submit`. All map through the controller's `Map<T>()` onto the shared envelope.

### 5.6 Files

**Backend:** `Models/DatabaseModels/ApplicationUser.cs` (embedded `TrustScoreBreakdown`, `TrustSignal`, `SkillsTestAttempt`), `Services/Implementations/SkillsTestQuestionBank.cs` (new), `Services/Implementations/ServiceProviderService.cs` (recompute + 4 methods; approval recomputes), `Services/Interface/IServiceProviderService.cs`, `Models/Dtos/ServiceProviderDtos.cs`, `Controllers/ServiceProviderController.cs`, `tests/WebApp.Tests/Unit/ServiceProviderServiceTests.cs`.
**Frontend:** `components/serviceprovider/TrustAndSkillsSection.tsx` (new), `components/serviceprovider/ProfileWorkspace.tsx`, `lib/api-service-provider.ts`, `types/service-provider.ts`, `hooks/queries/service-provider.ts`.

**2026-07-28 workspace reconciliation — LIVE in `fd38914`:** the responsive Profile & Trust redesign reuses the existing profile, overview, capacity, catalog, trust, skills-test, and portfolio APIs. URL states are `/profile` (Overview), `/profile?view=edit`, and `/profile?view=trust`; loading/error/retry, neutral trust, form feedback, accessible category/tag controls, confirmation dialogs, and portfolio image-path preservation are live. Verified and Tier remain separate badges; Tier copy is ranking/matching-only. *(Partially superseded 2026-07-29, §1A:)* profile/cover/portfolio image upload, employment (Experience), Education, language proficiency, and credential upload now have real backend ownership on the split collections; the four-step editor frontend that surfaces them is the next implementation stage. Video upload, provider location, and public-rating breakdown controls remain omitted rather than being stored as frontend-only data.

---

## 6. Module 2 — Service Catalog — **LIVE** (full-scope build; supersedes the earlier Module 2 spec)

Absorbs the "Service Package / Delivery Time / FAQ / Revision" source doc in full. **Full-scope for the first build:** Add-ons, Instant/Manual approval modes, Capacity limits, and Cancellation logic are all **in scope now**, not deferred.

**Commits:** `533d2e2` (backend) / `36b6f71` (frontend), on `dev-hafiz` (both verified present).
**Verification:** `dotnet build` 0 errors / **0 Module-2 warnings** (repo total unchanged at the 1048 pre-existing baseline); full backend suite **500 passed / 0 failed / 57 skipped**; Module 1's **100** tests still pass; Module 2's **22** new calculator tests pass; `npx tsc --noEmit` clean.

### 6.0 What's live vs. deferred (verified against code)
- **Collections `ServiceListings` / `ServicePackages` / `ServiceFAQs`** are registered in `MongoDbContext.cs` (indexes via `EnsureServiceCatalogIndexes()`) — see §4.3.
- **Reusable calculators:** `RevisionCalculator` and `DeliveryScheduleCalculator` are now consumed by Module 4 for live revision entitlement, due-date, and clock-state logic; `PricingGuidance` remains Catalog-only guidance.
- **`CurrentActiveOrders`** now has a live Module-4 writer: first milestone activation increments it and engagement completion decrements it (clamped at zero).
- **`Impressions` / `Clicks`** fields + internal `RecordImpressionAsync` / `RecordClickAsync` exist, but there is **still no live call-site** — Module 3 shipped the provider Leads workspace and package-purchase API, not a client catalog-browsing surface. The counters remain unwritten until that client surface is wired.
- **Sidebar:** the flat **Service Catalog** nav item (`menu.ts`) → **`/dashboard/serviceprovider/services`**.
- **Confirmed-decision fixes in this build:** `PricingModel` added as a **nullable** field on `ServicePackage`; `CancellationPolicy` is a **fixed `CancellationPolicyType` enum** (3 platform options: `FlexibleFullRefundBeforeStart` / `PartialRefundAfterDeliveryStart` / `NoRefundAfterDeliveryStart`) — **not** a custom rule engine.

### 6.0.1 Six-step creation + edit wizard (as of 2026-07-30 session)

A dual-purpose **creation and edit flow** — the sole mode for edits (the tabbed manage-flow was removed in Checkpoint 2 Part 2, 2026-07-31). **Route patterns:**
- **Create:** `/services?view=new&step=1` through `step=6`, carrying `draftId={id}` across steps.
- **Edit:** `/services?view=edit&step=1` through `step=6`, carrying `serviceId={id}` across steps.

Each step auto-saves to a real backend Draft-status `ServiceListing` record (created after Step 1 if new), not browser storage. **Publish-to-live transition (Step 6):** For Draft/Unpublished listings, publishing changes `Status` to `Published`. For already-Published listings, clicking Publish saves changes **without changing status** (edit-mode preserves Published state).

**Step structure:**
- **Step 1: Overview** — title, `ServiceType` (free-form string, server-side validated against `ServiceTypeLookup.cs`), `Category` (enum), `IndustryFocus` and `GeographicCoverage` (tag arrays), `MetadataTags` (capped at 5), `SearchTags` (capped at 5). Deterministic "Suggested Keywords" lookup by category (static rule table, never AI/trending). All fields wired to real `ServiceListing` schema.
- **Step 2: Scope & Pricing** — Basic/Standard/Premium package inline-editable grid; **fields wired to send on Next Step click:** `packageTitle, price, currency, pricingModel (nullable), deliveryTimeValue, deliveryTimeUnit, includedRevisionCount, includedFeatures, screensIncluded`. Deterministic Pricing Guidance by category only — never tier-conditioned. Save batches all package writes (POST for new temp IDs, PUT for real ObjectIds).
- **Step 3: Description & FAQ** — reuses `FaqBuilder` with optional `hideItemActions` and `onFaqsChange` props for wizard mode; all FAQ edits stay local and are batch-saved on Next Step.
- **Step 4: Client Requirements** — `RequirementsTemplate` editor with Text/File/Choice field types and per-question Required toggle. Same template applied to **all packages on the listing**.
- **Step 5: Gallery & Video** — `PreviewVideo` (single record, server-side duration validation via TagLibSharp, max 60s/50MB) and `GalleryImages[]` (bounded array, 20-image cap, 8MB per image). All URLs rendered via `resolveProviderMediaUrl()` for backend-to-frontend URL resolution.
- **Step 6: Review & Publish** — summary + publish-validation gate. **Context-aware button label:** "Publish Service Listing" (Draft), "Save Changes" (Published, preserves status), "Republish Service Listing" (Archived).

**New API endpoints (route prefix `/api/service-provider/listings/{listingId}`, all owner-scoped, existing `ApiResponse` envelope):**
- `POST /gallery-images` — atomic `$push` with `Exists=false OR SizeLt(20)` filter (race-safe cap enforcement). Request limit: 8MB/image. Response: `GalleryImageResponse` (small DTO, not full listing).
- `DELETE /gallery-images/{imageId}` — atomic `$pull`; uses `$unset` for deletions.
- `POST /preview-video` — server-side TagLibSharp duration validation before SaveFile persistence. Request limit: 50MB, max 60 seconds. Response: `PreviewVideoResponse` (small DTO).
- `DELETE /preview-video` — uses `$unset` for deletion.

**SaveFile folder allow-list updates (§4.3):**
- `"service-provider/gallery"` — `.jpg, .jpeg, .png, .webp` — 8 MB max
- `"service-provider/preview-video"` — `.mp4, .webm, .mov` — 50 MB max

### 6.0.2 As-built entities (real fields — note the drift from the spec's field names)
Each entity's PK is **`Id`** (`[BsonId]` ObjectId), **not** the spec's `ServiceId`/`PackageId`/`FaqId`; packages/FAQs reference the listing via a `ServiceId` FK (FAQs also an optional nullable `PackageId`). The listing's category property is **`Category`** (type `ServiceCategory`).

**Null-handling rules (as of 2026-07-30 session):** `PreviewVideo`, `GalleryImages`, `MetadataTags`, `SearchTags`, `IndustryFocus`, `GeographicCoverage` on `ServiceListing`, and `Deliverables`, `IncludedFeatures`, `ExcludedFeatures`, `AddOns`, `RequirementsTemplate` on `ServicePackage` all carry `[BsonIgnoreIfNull]` and are defensively null-coalesced in `ToResponse()`. Delete paths (e.g. `DeleteListingGalleryImageAsync`) use atomic `$unset` instead of writing `null`.

**BSON null-tolerance (critical for legacy data, 2026-07-31):** Some ServiceListing and ServicePackage documents may have been created with explicit BSON null values for these array/object fields. The `[BsonIgnoreIfNull]` attribute enables graceful deserialization: on READ, treats BSON null as "absent" and uses field initializers to create empty collections; on WRITE, skips the field if null, preventing new nulls. 

**One-time MongoDB data cleanup required (post-deploy):** Connect to MongoDB and run cleanup queries to remove existing null fields from ServiceListings and ServicePackages. See the cleanup guide in `BSON_NULL_CLEANUP.md` for exact queries (count affected docs, run updateMany with $unset, verify). This is a backwards-compatible, non-breaking migration for pre-existing data only; no new nulls will be created going forward.

- **`ServiceListing`**: `Id, ProviderId, ServiceType, Title, Description, Category, IndustryFocus (nullable), GeographicCoverage (nullable), MetadataTags (capped list, nullable), SearchTags (capped list, nullable), PreviewVideo (nullable embedded; server-determined `PublicUrl` from SaveFile, server-validated duration via TagLibSharp, not client-reported; 60s max, 50MB max enforced before persistence), GalleryImages[] (nullable bounded array, capped at 20; each has stable server-generated `Id`, server-determined `PublicUrl`, `DisplayOrder`; 8MB max per image), Impressions, Clicks, Status, CreatedAt, UpdatedAt`.
- **`ServicePackage`**: `Id, ServiceId, PackageName, PackageType, PackageTitle, PackageDescription, Price, Currency, PricingModel (nullable), DeliveryTimeValue, DeliveryTimeUnit, DeliveryDayType, DeliveryStartRule, DeliveryTimezone, DailyCutoffTime, IncludedRevisionCount, UnlimitedRevisions, RevisionRequestWindowDays, AdditionalRevisionAvailable, AdditionalRevisionPrice, AdditionalRevisionDeliveryTime, RevisionScopeDescription, Deliverables (nullable list), IncludedFeatures (nullable list), ExcludedFeatures (nullable list), ScreensIncluded (nullable int), AddOns[] (nullable), RequirementsTemplate[] (nullable), CancellationPolicy, InstantOrderEnabled, ManualApprovalRequired, MaximumActiveOrders, Status, CreatedAt, UpdatedAt`.
- **`ServiceFAQ`**: `Id, ServiceId, PackageId (nullable), Question, Answer, Visibility, DisplayOrder, Status, CreatedAt, UpdatedAt`.
- Embedded **`ServiceAddOn`**: `Name, Price, DeliveryTimeAdjustmentDays, Enabled`. Embedded **`RequirementsField`**: `FieldId, Label, FieldType, Required`. Embedded **`GalleryImage`**: `Id, StorageKey, PublicUrl, ContentType, Width, Height, Bytes, Sha256, DisplayOrder`. Embedded **`PreviewVideo`**: `StorageKey, PublicUrl, ContentType, Bytes, DurationSeconds, Sha256, UploadedAt`.
- Files — **backend:** `Models/DatabaseModels/ServiceCatalog.cs` (includes embedded types), `Services/Implementations/{ServiceCatalogService,RevisionCalculator,DeliveryScheduleCalculator,PricingGuidance,ServiceProviderMediaService}.cs`, `Services/Interface/{IServiceCatalogService,IServiceProviderMediaService}.cs`, `Controllers/{ServiceCatalogController,ServiceProviderController}.cs` (media endpoints under `/api/service-provider/listings/{id}/gallery-images|preview-video`), `Models/Dtos/ServiceCatalogDtos.cs` (with GalleryImageResponse, PreviewVideoResponse DTOs), `DbContext/MongoDbContext.cs`. **Frontend:** `components/serviceprovider/catalog/wizard/{WizardStep*.tsx}`, `lib/api-service-provider.ts` (media upload wrappers), `lib/service-provider/provider-media.ts` (`resolveProviderMediaUrl()` helper), `hooks/queries/service-catalog.ts`, `types/service-catalog.ts`.

**2026-07-28 workspace reconciliation — LIVE in `fd38914`; tabbed flow removed 2026-07-31:** Catalog remains one route with URL-backed states, not duplicate pages: `/services` lists/searches/filters real listings; `?view=new` creates via wizard; `?view=edit&step=N&serviceId={id}` edits via wizard (legacy `?service={id}` URLs redirect to edit mode). The redesigned cards, editors, package builder, FAQ builder, loading/error/empty/success/confirmation states, and accessible controls reuse the shipped Module-2 APIs and business validation. **Legacy tabbed manage-flow removed (Checkpoint 2 Part 2, 2026-07-31):** the old `ListingDetail`, `ListingEditor`, and `CapacityPanel` components that handled `?service={id}&tab=overview|packages|faqs|capacity` routes are gone; editing is exclusively through the wizard. Capacity endpoints remain for backend use and Profile area availability control, but Capacity has no UI surface until its future re-attachment. Unsupported public marketplace preview and media-upload capabilities are not fabricated.

### 6.0.3 BSON Null-Tolerance Audit Scope & Findings *(added 2026-07-31)*

**Root cause:** MongoDB's C# serializer cannot deserialize BSON null into non-nullable reference types without explicit null-tolerance attributes. ServiceListing and ServicePackage documents created with explicit BSON null values for array/object fields caused C# deserialization to throw `FormatException: 'Cannot deserialize ... from BsonType 'Null'`, resulting in 500 errors on read paths.

**Audit scope:** 68 total fields analyzed across 4 models: ServiceListing (11 fields), ServicePackage (15 fields), ServiceFAQ (3 fields), embedded types (39 primitives). **12 fields required `[BsonIgnoreIfNull]` fixes:**

**ServiceListing (6 fields):**
- `PreviewVideo` (PreviewVideo?) — nullable reference type
- `GalleryImages` (List<GalleryImage>) — array of objects
- `MetadataTags` (List<string>) — array of strings (capped 5)
- `SearchTags` (List<string>) — array of strings (capped 5)
- `IndustryFocus` (List<string>) — array of strings
- `GeographicCoverage` (List<string>) — array of strings

**ServicePackage (5 fields):**
- `Deliverables` (List<string>) — array of strings
- `IncludedFeatures` (List<string>) — array of strings
- `ExcludedFeatures` (List<string>) — array of strings
- `AddOns` (List<ServiceAddOn>) — array of objects
- `RequirementsTemplate` (List<RequirementsField>) — array of objects

**ServiceFAQ & embedded types:** no reference-type arrays requiring fixes (all fields safe).

### 6.0.4 Write-Path Safety & Critical Fix *(added 2026-07-31)*

**All current write patterns are safe — no code explicitly sets these fields to null:**

| Field | Write Pattern | Safety | Notes |
|-------|---------------|--------|-------|
| GalleryImages | `.Push()` operator | ✅ Appends to array | UploadGalleryImageAsync |
| GalleryImages delete | `.PullFilter()` operator | ✅ Removes item, keeps array | DeleteGalleryImageAsync |
| PreviewVideo delete | ✅ **FIXED** to `.Unset()` | ✅ Removes field entirely (no null storage) | **Critical fix at line 850** |
| Deliverables, IncludedFeatures, ExcludedFeatures | `Normalize()` helper | ✅ Returns `[]` if null | ApplyPackageRequest |
| AddOns | `.Where().Select()` on new list | ✅ Creates new list | ApplyPackageRequest |
| RequirementsTemplate | Built in loop as List<T> | ✅ Always non-null | ApplyPackageRequest |

**One critical fix applied (ServiceCatalogService.cs, line 850):**
```csharp
// BEFORE (caused BSON null storage):
.Set(l => l.PreviewVideo, (PreviewVideo?)null)

// AFTER (uses $unset, prevents null storage):
.Unset(l => l.PreviewVideo)
```
This change ensures that deleting a preview video removes the field from the document instead of storing an explicit BSON null.

### 6.0.5 MongoDB Data Cleanup (Operational Guide) *(added 2026-07-31)*

**One-time cleanup required after deploying the code changes.** This migration removes existing BSON null values from the database; no new nulls will be created going forward.

**Step 1: Count affected documents**
Run these queries in MongoDB to measure the scope:
```javascript
// ServiceListings with any null array/object fields
db.ServiceListings.countDocuments({
  $or: [
    { GalleryImages: null },
    { MetadataTags: null },
    { SearchTags: null },
    { IndustryFocus: null },
    { GeographicCoverage: null },
    { PreviewVideo: null }
  ]
})

// ServicePackages with any null array fields
db.ServicePackages.countDocuments({
  $or: [
    { Deliverables: null },
    { IncludedFeatures: null },
    { ExcludedFeatures: null },
    { AddOns: null },
    { RequirementsTemplate: null }
  ]
})
```
Note the counts — they tell you whether cleanup is needed and how many documents will be touched.

**Step 2: Clean ServiceListings**
```javascript
db.ServiceListings.updateMany(
  {
    $or: [
      { GalleryImages: null },
      { MetadataTags: null },
      { SearchTags: null },
      { IndustryFocus: null },
      { GeographicCoverage: null },
      { PreviewVideo: null }
    ]
  },
  {
    $unset: {
      GalleryImages: "",
      MetadataTags: "",
      SearchTags: "",
      IndustryFocus: "",
      GeographicCoverage: "",
      PreviewVideo: ""
    }
  }
)
```

**Step 3: Clean ServicePackages**
```javascript
db.ServicePackages.updateMany(
  {
    $or: [
      { Deliverables: null },
      { IncludedFeatures: null },
      { ExcludedFeatures: null },
      { AddOns: null },
      { RequirementsTemplate: null }
    ]
  },
  {
    $unset: {
      Deliverables: "",
      IncludedFeatures: "",
      ExcludedFeatures: "",
      AddOns: "",
      RequirementsTemplate: ""
    }
  }
)
```

**Step 4: Verify cleanup — both counts should return 0**
Re-run the count queries from Step 1. Both should return **0**. If either returns a non-zero count, the cleanup did not fully apply; investigate and rerun if needed.

### 6.0.6 Post-Cleanup Verification & Testing *(added 2026-07-31)*

After MongoDB cleanup and backend restart, verify the fix is complete:

**Automated:**
1. Rebuild backend: `dotnet build` — 0 errors (the `[BsonIgnoreIfNull]` attributes are recognized by MongoDB.Driver)
2. Restart backend service
3. Run the full test suite: `dotnet test` — all Module 2 tests pass (22 targeted tests)

**Manual endpoint testing (in browser or via API client):**
1. **Gallery upload:** upload an image, reload the page → image persists and displays correctly
2. **Gallery delete:** delete an image → reload → listing loads without 500 error
3. **Video upload:** upload a video, reload → video persists and displays correctly
4. **Video delete:** delete a video, reload → listing loads without 500 error
5. **Package creation:** create packages with full array fields (features, add-ons, requirements) → reload → all fields persist
6. **Legacy listing access:** access a previously-failing listing that had BSON nulls → should now deserialize and display without error

**Log monitoring:**
- No deserialization errors should appear in the backend logs
- All 500 errors on gallery/video operations and listing reads should cease

**Risk reduction summary:** Before this fix, any ServiceListing/ServicePackage with BSON null arrays caused automatic 500 errors across the wizard, dashboard, detail views, and all related API endpoints — a cascade failure. After the fix, graceful deserialization via `[BsonIgnoreIfNull]` + field initializers + safe write patterns ensures that legacy nulls no longer corrupt client experience, and forward-facing code prevents new nulls from being stored.

### 6.1b Listing lifetime cap — server-side enforcement *(added 2026-07-30)*
**Hard limit:** a Service Provider may have at most **4 ServiceListing records** at any time, regardless of status (Draft, Published, Unpublished, Archived all count toward the cap). Archiving or unpublishing does NOT free a slot — once a listing is created, it occupies the slot until deleted (deletion is not a supported user action; listing cleanup is admin-only).
**Server-side enforcement (CreateListingAsync):** before creating a new Draft listing, check the total count of non-deleted ServiceListings for the provider. If count >= 4, return a conflict error ("You've reached the limit of 4 service listings").
**Frontend UX:** the "New service" button is disabled when the provider is at capacity, with a banner explaining the limit and directing them to archive or remove an existing listing to proceed.

**Storage (top-level collections, §4.2 convention):**
- **`ServiceListing` → `"ServiceListings"`** — the service-level record: `ProviderId, ServiceType, Title, Description (TipTap-produced HTML string), Category (enum §4.2), IndustryFocus, GeographicCoverage, MetadataTags, SearchTags, PreviewVideo (embedded), GalleryImages[] (embedded)`, plus lifetime `Impressions`/`Clicks` counters. No live caller or timestamped history exists, so these counters do not support period analytics (§9). Owns its packages via `serviceId`. **Deferred to admin:** deletion.
- **`ServicePackage` → `"ServicePackages"`** (new) — per-service packages, keyed by `serviceId`: `packageId, serviceId, packageName, packageType, packageTitle, packageDescription, price, currency, deliveryTimeValue, deliveryTimeUnit, deliveryDayType, includedRevisionCount, unlimitedRevisions, revisionRequestWindowDays, deliverables, includedFeatures, excludedFeatures, addOns (embedded — below), requirementsTemplate (embedded — below), instantOrderEnabled, manualApprovalRequired, maximumActiveOrders, status, createdAt, updatedAt`. Package types: `Basic, Standard, Premium, Custom` (Custom not shown in the public table — used for custom offers, §7).
- **`ServiceFAQ` → `"ServiceFAQs"`** (new) — `faqId, serviceId, packageId, question, answer, visibility, displayOrder, status, createdAt, updatedAt`.
- **Add-ons are EMBEDDED** on `ServicePackage` as a bounded `addOns` array (a handful per package), each: name, price, delivery-time delta (business days), enabled — **non-revision extras only** (extra revisions use the dedicated fields, §6.4). *(Flag: the source names the field `addOnIds` — id references to a collection — but per the modeling decision we embed the add-on objects directly instead.)*
- **`RequirementsTemplate` is EMBEDDED** on `ServicePackage` (bounded — a handful of questions per package), not a top-level collection: a `requirementsTemplate` list of `{ fieldId, label, fieldType (text/file/choice/etc.), required }` entries. *(This is what the source's `requirementsTemplateId` field points at; like add-ons, we embed the structure directly rather than reference a collection. The client's filled-in answers are a separate Module-3 structure — §6.6.)*

### 6.1 Package Builder — inline-editable table, batch save *(updated 2026-07-30)*
Each service may have Basic / Standard / Premium, each **independently configured**. Example — Basic "UX Audit Essentials" $450 / 5 Business Days / 1 revision; Standard "UX Audit & User Flow Redesign" $950 / 10 Business Days / 2 revisions; Premium "Complete Product UX Improvement" $1,650 / 18 Business Days / 3 revisions.

**Step 2 UX (inline comparison table):** every field is **inline-editable** within the grid — no modal or popup. The user edits:
- **Per-package:** `PackageTitle`, `Price` (numeric input), `DeliveryTimeValue` + `DeliveryTimeUnit` (dropdown: 1–10 days), `IncludedRevisionCount` (dropdown), `ScreensIncluded` (numeric input), `IncludedFeatures` (checkboxes: Source Files, Responsive Design, Interactive Prototype, plus custom rows).
- **Batch save:** changes are persisted only when the user clicks "Next Step". No keystroke-triggered writes; no blur-triggered auto-save. All packages' changes are sent in one batch (POST for new temp IDs, PUT for existing real ObjectIds based on `/^[0-9a-fA-F]{24}$/` detection).

**Hidden fields (server-seeded defaults):** `PackageDescription` (empty string), `CancellationPolicy`, `PricingModel`, `RevisionRequestWindowDays`, `AdditionalRevisionPrice`, etc. are pre-populated with defaults at draft creation; the user does not edit them in Step 2. They remain in the payload sent on save, preserving any backend-server defaults.

**Pricing guidance (deterministic, no AI, §2):** a suggested-price-range lookup by `ServiceCategory` (optionally `PricingModel`), shown as guidance-only panel ("Pricing Guidance"), never tier-conditioned. The label is **never** "AI Pricing Assistant" or branded with sparkle icons.

### 6.2 Package validation (deterministic — system never auto-changes price/delivery/revision policy) *(updated 2026-07-30)*
**Required before publish (per-package):** title, price > 0, currency, delivery time, revision policy, availability status.
**Service-level description requirement:** the service's **top-level Description** (`ServiceListing.Description`, configured in Step 3 via TipTap rich text) is the **single source of truth** for describing the service to clients. Per-package `PackageDescription` is no longer required; it may remain empty on the schema (for future use) but is not validated at publish time.
**Deliverables:** the per-package `Deliverables` array is no longer required at publish. Its content (what the client receives) is now captured by `ScreensIncluded` (numeric input in Step 2), `IncludedFeatures` (checkboxes in Step 2), and the service-level description. The field remains on the schema but is not validated.
**Cross-package validation:** Standard must not have fewer features than Basic; Premium not fewer than Standard; a higher package priced **lower** than a lower one shows a **warning**; a higher package with **shorter** delivery time needs **explicit confirmation**; same-service packages must share currency; no duplicate package titles; unpublished packages aren't purchasable.

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

### 6.3b Service Description — TipTap rich-text editor *(added 2026-07-30)*
**Step 3 — Description & FAQ.** The service-level description uses a **TipTap-based WYSIWYG rich-text editor** (`ServiceDescriptionEditor.tsx`), producing an **HTML string** output. Backend field type remains `string` (stored as HTML).
**Rendering & sanitization:** all render sites apply `DOMPurify` via the `sanitize-html.ts` helper to prevent XSS. Render sites include Step 6 review and any client-side preview surface (the old ListingDetail view was removed in Checkpoint 2 Part 2, 2026-07-31).
**Word count:** HTML tags are stripped before counting; the UI displays the cleaned plain-text length.
**Batch save:** like Step 2, description edits and FAQ changes are persisted only on "Next Step" click.

### 6.4 Client Requirements (formerly Step 4) — flat numbered cards *(updated 2026-07-30)*
**Field types supported:** Free Text (textarea), File Upload (drag-drop), Choice (dropdown with user-defined options).
**Per-question:** a Required toggle (boolean). All questions apply to **all packages** on the listing; there is one template, not per-package variants.
**UX:** cards are flat/numbered (no accordion), each showing field type, label, and required indicator. Provider can add, reorder, or remove questions.
**Batch save:** all requirement changes are saved on "Next Step" click.

### 6.5 FAQ Builder
Entity `ServiceFAQ` (above). **Visibility:** All Packages / Basic Only / Standard Only / Premium Only / Selected Packages / Private Draft. **Actions:** add / edit / delete draft / reorder / duplicate / assign-to-package / publish / unpublish.
**Wizard-mode props (as of 2026-07-30):** `FaqBuilder` accepts optional `hideItemActions` (for wizard mode, hides per-row action buttons) and `onFaqsChange` (callback fired when FAQs are modified locally). In wizard mode, all edits stay in component state and are batch-persisted on Next Step.
**Validation:** question + answer required; question unique within a service; no empty answers; character limits; no prohibited external-payment instructions; can't override contract/package/platform terms; can't promise a feature not in the selected package; unpublished FAQs aren't shown publicly.
**Groups (optional):** Service Requirements, Delivery, Revisions, Files and Formats, Meetings, Communication, Licensing, Ownership, Support.
**Package-conflict handling:** FAQ content should reflect the selected package; if it conflicts with actual package config, **package terms are the source of truth** — the system shows a conflict warning ("This FAQ does not match the selected package settings") and the provider corrects it manually.

### 6.6 Client-requirements template (split across modules)
**Schema (Module 2):** the SP defines what information they need as an **embedded `RequirementsTemplate`** on `ServicePackage` — a bounded list of `{ fieldId, label, fieldType (text/file/choice/etc.), required }` entries (the source's `requirementsTemplateId`; embedded, not a collection — see §6 storage).
**Answers (Module 3 / checkout):** the client fills the template in at purchase / proposal-submission time. Those answers are a **separate small structure** (e.g. a `requirementsSubmission` referencing the template's fields with the client's values), tracked via `requirementsStatus` on the Proposal (§7). Schema-definition (Module 2) and answer-submission (Module 3) stay clearly distinct. *(This does not reopen the earlier "buyer-requirements questionnaire deferred to Module 3" decision — the template schema is configured here; its submission happens in Leads/checkout.)*

### 6.7 Provider capacity rule — **touches shipped code** *(home updated 2026-07-29)*
`maximumConcurrentOrders, currentActiveOrders, newOrderAvailability, manualApprovalWhenCapacityLow` now live on the **`ServiceProviderProfiles` split record** (§1A; dual-read falls back to the frozen embedded copy for unmigrated users) — still **not** a Module-2 entity. `CurrentActiveOrders` is written only by the engagement lifecycle via a guarded targeted increment, no longer a whole-user replace. Capacity status: `Available, Limited, Fully Booked, Unavailable`. Instant order must be **blocked when `currentActiveOrders >= maximumConcurrentOrders`** unless the provider explicitly allows overbooking (recommended: instant order disabled, client may still send an order request).
> **SHIPPED-CODE IMPACT (done):** these four fields were added to the already-committed `ServiceProviderProfile` in the Module-2 build (`533d2e2`) — a real Module-1 entity amendment. Additive (Mongo defaults for legacy docs); Module 1's 100 tests re-ran green.

### 6.8 Package order cancellation
**Before delivery starts:** client may request cancellation; provider may approve; platform cancellation policy applies; escrow refund may process; the proposal snapshot stays in history.
**After delivery starts:** cancellation follows contract policy; completed work may require partial payment; an active dispute blocks automatic refund; an administrator may review exceptional cases. **The system never makes an automatic cancellation decision unless a predefined policy explicitly applies** (§2).

### 6.8b Step 6 Review & Publish — two-column layout redesign *(added 2026-07-30)*
**Layout:** replaces the single-column stacked card layout with a responsive two-column grid:
- **LEFT COLUMN:** service title with edit pencil icon (navigates to Step 1), gallery thumbnails (up to 4 visible, with overflow count "+N"), no metadata/rich description shown.
- **RIGHT COLUMN:** three stacked package cards (Basic, Standard, Premium). Standard card has a hardcoded blue "RECOMMENDED" badge in top-right corner and a stronger blue border (visually emphasized). Each card shows: tier name, price in large text, summary line "X Screens • Y Revisions • Z Days Delivery" (pulls actual field values; omits screens if count is 0 or null), edit pencil icon (navigates to Step 2).
- **VALIDATION & PUBLISH:** errors/warnings above the two-column area (if any). Sticky footer with "Back" button and context-aware publish button (blue primary style).

**Excluded:** the "SEO Scan Complete" / "AI Provider verified" panel shown in some mockups is **NOT present**. This is a permanent canon rule (§2) — no AI-branded UI surfaces anywhere.

### 6.9 Empty state (Catalog)
- **No Services** — "No Published Services" / "Create your first service listing to start receiving briefs." / Action: "Create Service". *(This is the getting-started nudge the §11 journey references — the flat model's replacement for a wizard.)* **Regression note (2026-07-30):** the empty-state title had regressed to "Create your first service" during the 2026-07-28 UI reconciliation (`fd38914`); it was corrected back to canonical text during this reconciliation.

**Dependencies.** Reads: verified profile (§1.1), shared enums (§4.2), capacity fields on the profile (§6.7). Produces: published packages + FAQs → Leads/checkout (§7); impressions/clicks + order counts → Analytics (§9) — public listing detail pages will record fire-and-forget impression/click events per the planned tracking architecture (§9.4, Phase C when implemented); a purchased package → an auto-accepted Proposal (§7). **New backend dependency (2026-07-30):** `TagLibSharp` (v2.3.0, pure managed .NET library, no native binaries) added to support server-side video duration inspection for `PreviewVideo` uploads — replacing what would otherwise be a client-trusted duration value. Chosen over FFmpeg-based alternatives to avoid adding a native-binary dependency to the Docker-based deployment.

---

## 7. Module 3 — Leads (Client Acquisition) — **LIVE**

**Commits:** `d419ed1` (backend) / `4df8122` (frontend), on `dev-hafiz` (both verified present).
**Verification:** `dotnet build` **0 errors / 0 warnings**; full backend suite **519 passed / 0 failed / 57 skipped**; Module 3's **19** targeted tests pass; `npx tsc --noEmit` clean.

**Purpose.** The provider-facing acquisition surface: matched Client Briefs inbox, brief detail, saved/dismissed state, proposal composer/pipeline, published-package purchase convergence, and the real response-rate signal. Backend entity/collection naming remains `ClientBrief` / `"ClientBriefs"`; the reconciled provider UI also uses **Client Brief/Client Briefs**, while older API concepts and changelog history may still say opportunity.

### 7.0 What's live vs. deferred (verified against code)

- **LIVE:** three top-level MongoDB collections (`ClientBriefs`, `ClientBriefInteractions`, `Proposals`), best-effort indexes, actor-scoped `/api/leads` endpoints, the provider `/dashboard/serviceprovider/leads` workspace, proposal state validation/version history, notifications, package purchase/manual fallback, soft expiry, matching, and response-rate persistence.
- **LIVE scope boundary:** Module 3 still ends at `Proposal.Status = Accepted` with `ConversionStatus = AwaitingModule4`; Module 3 itself creates no delivery records and starts no clock. Module 4 now consumes that boundary asynchronously and performs `Accepted/AwaitingModule4 → ConvertedToProject/Converted` while atomically creating the contract, engagement, and milestones (§8.0).
- **LIVE but backend-only/client-side boundary:** client brief create/publish/close, client proposal review/change/accept/decline, and package purchase endpoints exist. This provider module does not add a client dashboard/checkout UI.
- **LIVE provider proposal depth (2026-07-28 reconciliation, `fd38914`):** the response now returns the complete `PreviousVersions` snapshots and the provider UI exposes version history, client-requested revision editing/submission, milestone-plan editing, and attachment-reference editing. `CommissionPreviewResponse.Rate` is a server-computed response value from `PlatformCommerceConstants.CommissionRate`, not a stored rate or a frontend constant.
- **DEFERRED/unwired vocabulary:** `PlatformAdminResolution`, `CustomOffer`, `PackageAddOn`, and `ChangeRequest` exist in enums/models, but there is no admin-resolution endpoint and no complete custom-offer/package-add-on/change-request producer flow. A standalone custom offer cannot currently pass submission validation without an open `ClientBrief`.
- **Module boundary:** payment-method verification, escrow authorisation, compliance hold, and final-summary confirmation remain authoritative request flags in Module 3. The downstream gateway-shaped payment operations, ledger, contract, audit writer, and conversion now live in Module 4, but the payment adapter is explicitly a STUB (§8.0).
- **Known filter drift:** API filters are category, skill, budget bounds, duration, location, remote flag, source, posted-after, deadline-before, and saved-only. The planned client-verification/payment-verification filters are not implemented. The reconciled UI exposes URL-backed search, category, skill, budget bounds, source, remote, deadline, saved view, and all five sorts; duration/location/posted-after remain API-only.

### 7.0.1 As-built entities (real fields; spec drift called out)

All three PKs are **`Id`** (`[BsonId]` ObjectId), not the spec's `clientBriefId`/`proposalId`. `ClientBrief.ServiceCategory` is the real category property.

- **`ClientBrief` → `"ClientBriefs"`:** `Id, ClientId, Title, Description, ServiceCategory, RequiredSkills[], Industries[], BudgetMinimum, BudgetMaximum, Currency, PricingType, ExpectedDuration, Location, RemoteAllowed, Visibility, Source, InvitedProviderIds[], InvitationDeliveries[], ExclusiveInvitation, PublishedAt, ExpiresAt, Status, CreatedAt, UpdatedAt`.
- Embedded **`ClientBriefInvitationDelivery`**: `ProviderId, DeliveredAt`. It records the persisted notification receipt time for that provider.
- **`ClientBriefInteraction` → `"ClientBriefInteractions"`:** `Id, ProviderId, ClientBriefId, Viewed, ViewedAt, Saved, Dismissed, ExpiryNotificationSentAt, CreatedAt, UpdatedAt`. This is a separate unbounded provider×brief collection, not a shared brief status. (`ProviderId`, `ClientBriefId`) is unique.
- **`Proposal` → `"Proposals"`:** `Id, ClientBriefId, ServiceId, PackageId, ProviderId, ClientId, ProposalSource, AcceptanceMode, Title, CoverMessage, ProposedPrice, Currency, PricingType, DeliveryTimeValue, DeliveryTimeUnit, DeliveryDayType, DeliveryStartRule, IncludedRevisionCount, UnlimitedRevisions, RevisionRequestWindowDays, Deliverables[], MilestonePlan[], SelectedAddOns[], RequirementsStatus, RequirementsSubmission[], Attachments[], SubmittedAt, ExpiresAt, AcceptedAt, AcceptedBy, AcceptanceTrigger, EscrowStatus, ConversionStatus, Status, Version, PreviousVersions[], PurchaseSnapshot, CreatedAt, UpdatedAt`.
- Embedded **`ProposalRequirementAnswer`**: `TemplateFieldId, FieldType, Value, Attachment, AnsweredAt`. Embedded **`ProposalMilestonePlanItem`**: `Title, Description, Amount, DeliveryTimeValue, DeliveryTimeUnit, DisplayOrder` — a commercial proposal plan only, **not** a Module-4 milestone entity. Embedded **`SelectedAddOnSnapshot`**: `Name, Price, DeliveryTimeAdjustmentDays`.
- Embedded **`ProposalVersionSnapshot`**: `Version, Title, CoverMessage, ProposedPrice, Currency, PricingType, DeliveryTimeValue, DeliveryTimeUnit, DeliveryDayType, DeliveryStartRule, IncludedRevisionCount, UnlimitedRevisions, RevisionRequestWindowDays, Deliverables[], MilestonePlan[], Attachments[], ExpiresAt, SupersededAt`.
- Embedded immutable **`PurchaseSnapshot`**: `ServiceId, ServiceTitle, ServiceCategory, PackageId, PackageTitle, PackagePrice, SelectedAddOns[], FinalPrice, Currency, DeliveryTimeValue, DeliveryTimeUnit, DeliveryDayType, IncludedRevisionCount, UnlimitedRevisions, RevisionRequestWindowDays, Deliverables[], Requirements[], FaqSnapshot[], CancellationTerms, AcceptedAt`.

**Schema corrections made during implementation:**

- `ClientBrief.Status` is lifecycle-only: `Draft, Published, Open, Closed, Expired, Cancelled`. Saved/viewed/dismissed are provider-relative `ClientBriefInteraction` fields; “proposal submitted” is derived from proposal existence.
- `Currency` and `Industries[]` were added to `ClientBrief`; the former enables currency validation and the latter supplies the match formula's sector-overlap input.
- `Proposal.PreviousVersions[]` preserves the superseded commercial state on revision.
- Commission uses the single shared `PlatformCommerceConstants.CommissionRate = 0.12m`. `CommissionPreviewResponse` computes gross/commission/net from it; Module 4 must consume this same constant. Contrary to the earlier planned prose, **neither `Proposal` nor `PurchaseSnapshot` stores a commission rate or amount**.
- Interaction creation remains **lazy** on first eligible inbox-query surfacing, but `ClientBriefInteraction.CreatedAt` is the client-brief availability timestamp: normally `ClientBrief.PublishedAt`; for a direct invitation, the provider's `ClientBriefInvitationDelivery.DeliveredAt`; legacy missing receipts fall back to `PublishedAt`. `UpdatedAt` represents persistence/mutation time.

### 7.1 Lifecycle, proposal rules, and expiry

- Only an **Open** brief accepts proposals. Closing freezes linked proposals read-only. Expiry defaults to 72 hours from publish and is capped at 30 days.
- There is **no MongoDB TTL index and no deletion**. The minutely scheduled Hangfire `ClientBriefExpirationJob` changes due `Open` briefs to `Expired`, expires due submitted proposals, and sends deduplicated saved-brief-expiry notifications.
- Proposal statuses: `Draft, Submitted, Viewed, ChangesRequested, Revised, ClientReviewing, Accepted, Declined, Withdrawn, Expired`; `ConvertedToProject` is now written only by Module 4's transaction-safe conversion job.
- Live negotiated transitions: Draft→Submitted; Submitted→Viewed/Withdrawn/Expired; Viewed→ChangesRequested/ClientReviewing; ChangesRequested→Revised; Revised→ClientReviewing; ClientReviewing→Accepted/Declined. Accepted cannot be withdrawn or converted by Module 3; Viewed→Accepted, Saved→Accepted, and MessageSent→Accepted are disallowed.
- Submission requires an open linked brief, future expiration, title, cover message, positive price, delivery duration, at least one deliverable, non-negative revision count, matching currency, and a verified/available provider below capacity. Out-of-budget price is a warning. Unlimited revisions require explicit confirmation. Expired proposals can be duplicated into a new draft.
- Commission preview: `Commission = ProposedPrice × 12%`; `Net = ProposedPrice − Commission`. Example: $2,150 → $258 commission → $1,892 net.

### 7.2 Acceptance paths and Module-4 boundary

- **Standard/direct-invitation proposal — LIVE through Accepted:** provider draft→submit; client view/review/request changes; provider may revise; client explicitly confirms and supplies escrow-authorised state; proposal becomes `Accepted/AwaitingModule4`. A direct invitation alone never accepts anything.
- **Published-package purchase — LIVE through Accepted:** validates published service/package, instant-order/manual-approval settings, provider eligibility and global/package capacity, requirements, client activity, explicit confirmation, payment/escrow flags, compliance hold, and final-summary confirmation. Passing all conditions creates an immutable accepted snapshot; any failure produces a submitted request with UI status **“Provider Approval Required”**, which the provider can approve/decline before the client confirms.
- **No synchronous Module-3 creation:** acceptance enqueues Module 4; the conversion worker creates those records transactionally and independently decides when delivery is ready to start (§8.0).

### 7.3 Matching, response rate, notifications, and UI

- **Brief Match Score — LIVE reuse:** `SpMatchingService.Score` remains `sectorOverlap×0.35 + rating×0.25 + responseRate×0.20 + tierNorm×0.20`; Module 3 supplies `ClientBrief.Industries` to sector overlap. Availability is a **hard pre-filter**, not a weight/formula change: unverified providers, providers with `NewOrderAvailability = false`, and providers at `MaximumConcurrentOrders` never enter the candidate pool.
- **Real Response Rate — LIVE:** `ResponseRateService` counts an interaction as responded only when the first submitted proposal or first provider-authored, brief-linked `ChatMessage` occurs from `Interaction.CreatedAt` through `CreatedAt + 48h` inclusive. Viewing alone never counts. It writes `TrustBreakdown.ResponseRate` through `ServiceProviderService.UpdateResponseRateSignalAsync`, which reuses the sole TrustScore recalculation path. Re-grep at ship confirms the former `0.85`/TODO stub is absent from `SpMatchingService.cs`.
- **Sorting — LIVE:** newest, highest budget, closest deadline, best match, previously viewed. **Provider UI — LIVE:** one query-backed workspace uses `/leads?view=leads` for Client Briefs, `?view=proposals` for Pipeline, and `?view=saved` as the internal Saved view; `brief`, `proposal`, and `mode` preserve detail/editor/revision state. It includes filters, brief detail, save/dismiss, draft/revision composer, server-provided fixed-12% earnings preview, budget warning, milestone/attachment inputs, previous-version history, submit/withdraw/duplicate, and provider approval fallback.
- **Notifications — LIVE:** direct invitation received; saved brief expiring; proposal viewed; changes requested; proposal accepted; proposal declined; proposal expired; client sent a brief-linked message.
- **Empty states — LIVE:** “No new client briefs” explains that matching briefs will appear here; Pipeline and Saved have their own purposeful empty states and links back to Client Briefs. No unsupported standalone custom-offer producer is advertised as a working action.

**Dependencies.** Reads: Catalog (§6), verified provider profile/capacity (§1), and `SpMatchingService` (§1.7). Produces: the accepted-proposal boundary consumed live by §8, the response-rate trust signal (§5.1), and future analytics inputs (§9).

---

## 8. Module 4 — Workroom & Earnings — **LIVE**

**Commits:** `7e31162` (backend) / `7b6acf7` (frontend), on `dev-hafiz` (both verified present).
**Verification:** `dotnet build` **0 errors / 0 warnings**; full backend suite **546 passed / 0 failed / 57 skipped**; Module 1 **100**, Module 2 **22**, Module 3 **19**, and Module 4 **25** targeted tests pass; `npx tsc --noEmit` clean.

Merges delivery workroom and earnings into one module. It consumes accepted Module-3 proposals, owns the execution/financial lifecycle, and produces Client Satisfaction, On-time Delivery, Repeat-Client Rate, and Dispute Penalty for the existing Module-1 TrustScore path.

**Module-5 amendment — LIVE (`c64aab5`):** the private repeat-client and on-time formulas were extracted from `WorkroomService.RefreshTrust` into shared `IClientRelationshipCalculator` / `ClientRelationshipCalculator`. Module 4 Trust and Module 5 client/delivery analytics now consume the identical implementation, eliminating formula drift. Module-4 targeted tests were **25 passed / 0 failed / 0 skipped before** and **25 / 0 / 0 after** the extraction (also **25 / 0 / 0** in final regression).

### 8.0 What's live vs. deferred (verified against code)

- **LIVE storage/backend:** 16 top-level MongoDB collections (§4.3), `EnsureWorkroomIndexes()`, actor-scoped `/api/workroom` and `/api/earnings` APIs, state-machine checks, audit rows, notifications, timed rules, statements, and provider financial settings on the `ServiceProviderProfiles` split record (§1A; formerly embedded on the profile).
- **LIVE Proposal→Engagement handoff:** every accepted proposal path immediately enqueues `WorkroomConversionJob.ConvertAsync`; a minutely sweeper catches missed `Accepted/AwaitingModule4` rows. Conversion is idempotent through a unique `WorkroomEngagement.ProposalId`, an existence check, and the proposal's atomic ownership transition. An empty `MilestonePlan` becomes exactly one full-scope milestone for the accepted price. Contract + engagement + milestone creation and `Proposal → ConvertedToProject/Converted` commit in one Mongo transaction.
- **LIVE provider frontend:** `/dashboard/serviceprovider/workroom?view=active|completed` lists projects; `project`, `tab`, and `milestone` preserve drill-down state. Project tabs are Overview, Milestones, Deliveries, Tasks & Inputs, Contract, and Time Entries for hourly work. The workspace exposes **STUB in-app contract consent**, milestone activation, file upload, versioned delivery, revision-start/resubmission, review response, and completion. `/dashboard/serviceprovider/earnings?tab=activity|payouts|settings` exposes balances, transactions, payouts, invoices, masked payout-method setup, and tax settings, with purposeful loading/error/empty/success/confirmation states.
- **API-first/client-UI boundary:** client STUB-backed funding, revision request, approval/release, disputes, extensions, reviews, and the second **STUB contract-consent** action exist as owner-scoped backend endpoints, but **no client Workroom/checkout frontend was added**. The build was provider-frontend-prioritized. The provider can request and view the structured statement response by date range; PDF/document download remains unsupported.
- **`[STUB — PAYMENT]`** `IPaymentGatewayService` is the swappable boundary; `StubPaymentGatewayService` is the registered implementation. **No Stripe/Stripe Connect or other real payment integration exists.** “Escrow funded” currently means the deterministic stub returned success and Mongo recorded funded state/ledger rows; “payment released” means the stub returned success and Mongo recorded the release, 12% commission, invoice, and available balance. Payouts are likewise mocked responses — **no real money is held, released, refunded, or disbursed**.
- **`[STUB — FILE SECURITY]`** `IFileSecurityScanner` is the swappable boundary; `StubFileSecurityScanner` is registered. It rejects empty files, files over 20 MB, and extensions outside the existing document/image allow-list, then deterministically passes. **No virus/malware/content scanning exists.**
- **`[STUB — CONTRACT CONSENT]`** “Signing” is authenticated in-app explicit consent: the API stores `ProviderSignedAt` / `ClientSignedAt`, and both timestamps set `Contract.Status = Signed`. `ContractResponse.SimpleConsentStub = true` and the provider UI labels it as a STUB. **This is not an e-signature provider, identity-signing ceremony, or independently validated legally binding signature mechanism.**
- **Operational requirement:** `Mongo:TransactionsEnabled=true` is a hard startup gate in `StartupConfigValidation`; missing, malformed, or false configuration prevents startup. Transactional code has **no silent non-atomic fallback**. The flag expresses deployment intent; Mongo still must actually support transactions. Production Atlas / `srv1172497` transaction capability was **not independently verified in this session** because DNS/egress from the dev sandbox was blocked — manually verify replica-set topology and transaction support before production deploy.
- **PARTIAL/deferred:** real gateway/scanner/e-signature integrations; client UI; additional-revision purchase/change-order flow; client-input fulfilment endpoint; task update/reopen flow; meetings/decisions/case-study/archive UI; invoice/statement document download; and broader analytics remain unbuilt.

**2026-07-28 response/UI reconciliation — LIVE in `fd38914`:** owner/participant checks are unchanged. Engagement responses now include the client's display name, current milestone, pause metadata, and created timestamp; detail responses include participant-filtered files, hourly time entries, the engagement review record, and dispute timing/outcome fields. Financial summary responses now add provider-scoped gross earnings, commission paid, net earnings, and available currencies. Owner-scoped endpoints can set a verified payout method as default or remove one; removal is blocked while that method belongs to an active payout, and historical payout references are preserved. Payout/tax identifiers remain masked. The redesigned UI makes payment, protected-funds, payout verification, file-scanning, and contract-consent STUB status visible at the point of use; it does not turn those adapters into production integrations.

### 8.0.1 As-built entities (real fields; spec drift called out)

Every top-level PK is **`Id`** (`[BsonId]` ObjectId), not the source's entity-specific `projectId`/`milestoneId`/etc. Property names below are the exact C# model names.

- **`WorkroomEngagement` → `"WorkroomEngagements"`:** `Id, ProposalId, ProviderId, ClientId, ContractId, Title, Description, ContractValue, Currency, StartDate, ExpectedEndDate, ActualEndDate, CurrentMilestoneId, CompletionPercentage, EngagementStatus, EscrowStatus, PausedAt, AccumulatedPausedMinutes, CreatedAt, UpdatedAt`.
- **`Contract` → `"Contracts"`:** `Id, EngagementId, ProviderId, ClientId, Terms, ProviderSignedAt, ClientSignedAt, Status, CreatedAt`. `ProviderSignedAt` / `ClientSignedAt` and `Signed` mean **STUB authenticated in-app consent only**, not e-signature. Embedded **`ContractTerms`**: `Price, Currency, PricingType, DeliveryTimeValue, DeliveryTimeUnit, DeliveryDayType, DeliveryStartRule, IncludedRevisionCount, UnlimitedRevisions, RevisionRequestWindowDays, Deliverables[], AllowsParallelMilestones, HourlyRate, WeeklyHourLimit`.
- **`WorkroomMilestone` → `"WorkroomMilestones"`:** `Id, EngagementId, Title, Description, Amount, Currency, DisplayOrder, StartDate, DueDate, OriginalDueDate, ExtensionRequestedAt, ApprovedExtensionDays, CompletionCriteria, IncludedRevisionCount, UnlimitedRevisions, PurchasedAdditionalRevisions, UsedRevisionCount, MilestoneStatus, EscrowStatus, SubmittedAt, ReviewWindowEndsAt, AutoReleaseAt, DisputeOpenedAt, DisputeReviewEndsAt, DisputeOutcome, ApprovedAt, CreatedAt, UpdatedAt`.
- **`Deliverable` → `"Deliverables"`:** `Id, MilestoneId, ProviderId, Title, Description, Version, FileIds[], ExternalLinks[], SubmissionMessage, ClientInstructions, CompletionConfirmed, SubmittedAt, DeliverableStatus`.
- **`RevisionRequest` → `"RevisionRequests"`:** `Id, MilestoneId, DeliverableId, RequestedBy, Description, RequestedChanges[], CreatedAt, DueDate, ScopeClassification, FeedbackCollectionStatus, RevisionRequestStatus`.
- **`FinancialTransaction` → `"FinancialTransactions"`:** `Id, EngagementId, MilestoneId, ProviderId, ClientId, GrossAmount, Currency, CommissionAmount, NetAmount, TransactionType, PaymentStatus, IdempotencyKey, CreatedAt, ReleasedAt`.
- **`Review` → `"Reviews"`:** `Id, EngagementId, ClientId, ProviderId, OverallRating, QualityRating, CommunicationRating, DeliveryRating, ProfessionalismRating, ValueRating, WrittenReview, ProviderResponse, Visibility, SubmittedAt, VerificationStatus`.
- **`WorkroomTask` → `"WorkroomTasks"`:** `Id, EngagementId, MilestoneId, Title, Description, AssigneeId, DueDate, Visibility, Status, CreatedAt, UpdatedAt`.
- **`ClientInputRequest` → `"ClientInputRequests"`:** `Id, EngagementId, MilestoneId, Type, Description, DueDate, DeliveryImpact, Status, CreatedAt, SuppliedAt`.
- **`WorkroomFile` → `"WorkroomFiles"`:** `Id, EngagementId, MilestoneId, UploadedBy, OriginalName, StoragePath, ContentType, SizeBytes, Status, ProviderPrivate, Immutable, CreatedAt`.
- **`PaymentOperation` → `"PaymentOperations"`:** `Id, IdempotencyKey, Type, EngagementId, MilestoneId, PayoutRequestId, Amount, Currency, Status, GatewayReference, Error, AttemptCount, CreatedAt, UpdatedAt`.
- **`PayoutRequest` → `"PayoutRequests"`:** `Id, ProviderId, PayoutMethodId, Amount, Currency, Status, GatewayReference, CreatedAt, UpdatedAt, CompletedAt`.
- **`Invoice` → `"Invoices"`:** `Id, InvoiceNumber, ProviderId, ClientId, EngagementId, MilestoneId, GrossAmount, CommissionAmount, NetAmount, Currency, ApprovalDate, ReleaseDate, TaxSnapshot, Status, CorrectsInvoiceId, CreatedAt`.
- **`HourlyTimeEntry` → `"HourlyTimeEntries"`:** `Id, EngagementId, ProviderId, StartedAt, EndedAt, Description, ClientApproved, CreatedAt`.
- **`WorkroomAuditEvent` → `"WorkroomAuditEvents"`:** `Id, ActorId, ActorRole, Action, EntityType, EntityId, PreviousState, NewState, Timestamp, Reason`. **Drift:** the discovery/spec shorthand said `AuditEvents`; the built class/collection is deliberately workroom-scoped.
- **`RepeatClientCoupon` → `"RepeatClientCoupons"`:** `Id, ProviderId, ClientId, Code, DiscountPercent, Status, ExpiresAt, CreatedAt`.
- **`ProviderFinancialSettings`** at `ServiceProviderProfiles.FinancialSettings` (§1A; the frozen embedded copy remains only as migration fallback) — **not its own collection:** `PayoutMethods[], DefaultPayoutMethodId, Tax, AccountOnHold, MinimumPayoutAmount`. Embedded **`MaskedPayoutMethod`**: `Id, Rail, DisplayName, MaskedDescriptor, Verified, CreatedAt`. Embedded **`ProviderTaxSettings`**: `LegalName, CountryCode, TaxIdentifierMasked, VatRegistered, VatNumberMasked`.

**As-built drift summary:** the implementation added currency, ordering, pause accounting, extension, review/auto-release/dispute clocks, idempotency/reconciliation, tax snapshots, hourly support, and audit fields beyond the original seven-entity sketch. Status properties are strongly named (`EngagementStatus`, `MilestoneStatus`, `DeliverableStatus`, `RevisionRequestStatus`) rather than a generic `Status` where ambiguity mattered. `ProviderFinancialSettings` is embedded per §1.3; `ContractTerms` and invoice tax snapshots are also bounded embedded objects. No entity stores `CommissionRate`; release always reads `PlatformCommerceConstants.CommissionRate`.

### 8A — Workroom & Delivery (live mechanics)

**Storage:** exact top-level and embedded shapes are in §8.0.1. The original five-item workroom sketch expanded to support transaction reconciliation, audit, files, tasks, client input, hourly work, payouts, invoices, and repeat-client behavior.

**Provider surface — LIVE:** Active Projects, contract summary/**STUB consent**, milestones, delivery history, task/input summaries, file upload, revision work, completion, and earnings. Decisions, meetings, case-study permission, and archive controls are deferred; client-side decision UI is API-only (§8.0).

**WorkroomEngagement status model:** `Contract Pending, Escrow Pending, Ready to Start, Active, Paused, Client Input Required, Milestone Review, Revision in Progress, Final Delivery, Completed, Cancelled, Disputed, Archived`.
Core rules: no **Active** without `Contract.Status = Signed` (**STUB in-app consent only**) and the required **STUB-backed escrow state**; **Paused** follows the deadline-freeze policy; **Disputed** can block payment release; **Completed** deliverable history is read-only; **Archived** is never deleted.

**WorkroomMilestone status model:** `Draft, Funding Required, Funded, Active, Submission Draft, Submitted, Client Reviewing, Revision Requested, Revision in Progress, Resubmitted, Approved, Payment Processing, Paid, Cancelled, Disputed`.
The live service converts proposals directly into `FundingRequired`; funding moves to `Funded`; activation moves to `Active`; submission moves directly to `ClientReviewing`; approval/auto-release atomically moves reviewable work to `Paid`. Revision loop: Client Reviewing/Resubmitted→Revision Requested→Revision in Progress→Resubmitted. Dispute: Submitted/Client Reviewing/Resubmitted/Revision Requested→Disputed.
**Activation logic:** a milestone is Active only when — contract active; previous required milestone approved; required escrow funded; start condition satisfied; project not paused; no blocking dispute. Parallel milestones only if the contract explicitly allows it.

**Review / release windows — LIVE:** submission stores a **48-hour client review marker** and a distinct **7-day auto-release** time. Minutely `WorkroomTimedRulesJob` releases an undisputed due milestone. Opening a dispute stores a **5-day support-review** deadline; expiry records an admin-attention audit event rather than auto-resolving it. Release atomically commits milestone/engagement state + ledger + invoice + payment operation + audit after the STUB gateway response.

**Deliverable submission (source §7):** required — delivery title, description, ≥1 file or external link, version number, client instructions, completion confirmation. Provider confirms: all agreed deliverables included; files reviewed; no unrelated private info; ready for review.
**Version rules:** first submission **1.0**; revisions **1.1, 1.2**; a major approved scope update **2.0**; previous versions can't be overwritten; submitted files can't be silently replaced — a replacement **creates a new version**.

**File states:** `Selected, Uploading, Scanning, Ready, Failed, Archived, Restricted`. Uploads create a `Scanning` record, pass through the **STUB extension/size checker**, then become `Ready` or `Restricted`; submitted files become immutable. No real malware scanning or suspicious-download warning exists (§8.0).

**Task logic:** create + list are live; fields and statuses match §8.0.1, and provider-private tasks are filtered from client reads. Task update/reopen/audit behavior is not implemented; **task completion ≠ milestone approval** remains the domain rule.

**Revision logic — LIVE/PARTIAL:** `Remaining = Included + Purchased Additional − Used`, using Module 2's `RevisionCalculator`. One consolidated feedback submission is required; manual scope values are `WithinScope / NeedsClarification / PotentialScopeChange / ConfirmedScopeChange`; only `WithinScope` consumes allowance. When exhausted, the API blocks normal within-scope revision creation and points to an explicit paid change request. `PurchasedAdditionalRevisions` is modeled, but the actual paid-purchase/change-order producer is deferred.

**Deadline states — LIVE:** `ClockState` exposes `WaitingForRequirements`, `WaitingForEscrow`, `ReadyToStart`, `Paused`, `ExtensionRequested`, `ExtensionApproved`, or Module 2's computed `OnTrack / DueSoon / DueToday / Overdue / Delivered`. *(Due Soon means `<48h` before the due date, distinct from post-submission review.)* Approval changes the due date; decline clears the request and preserves the existing due date rather than persisting a separate `ExtensionDeclined` state. The system reminds but never auto-extends.

**Client input requests — PARTIAL:** provider request creation is live for file / decision / feedback / approval / clarification / meeting and moves the engagement to `ClientInputRequired` without changing a deadline. The client fulfilment endpoint that would set `SuppliedAt` is deferred.

**Project completion — LIVE:** requires at least one milestone, every milestone `Paid`, no open dispute, and no unresolved revision. Explicit completion sets 100%, records `ActualEndDate`, decrements provider capacity, refreshes trust, and may create a repeat coupon. The broader source checks for case-study permission/archive UI and separately modeled contract-obligation/file-availability completion are not built.

**Workroom notifications — LIVE subset:** workroom/contract ready, milestone funded, deadline approaching, deliverable submitted, revision requested, extension requested/decided, payment released, project completed, and review submitted. Client-upload/client-answer/review-start/revision-accepted/support-ticket notifications from the broader source list are not wired.

### 8B — Earnings & Financial Activity (live records; STUB-backed movement)

**Storage:** exact financial/payment/payout/invoice/settings fields are in §8.0.1. No record stores `CommissionRate`; release always reads the shared flat 12% constant (§1.4).

**Escrow vs. payout:** the lifecycle still separates **hold → release → disburse**, but every external operation currently runs through `StubPaymentGatewayService`. Stripe Connect / Wise / Bank Transfer / PayPal are enum/configuration labels for future adapters, not live rails. No real escrow holder or disbursement provider is connected (§8.0).

**Sections:** provider Earnings Overview, financial activity, payouts, invoices, and settings are live. Statements are live via API only; there is no statement/invoice file-download flow.

**Amount categories:** **Work in Progress** (escrow funded, work not yet submitted/approved — never shown as earned); **In Review** (submitted, client reviewing); **Pending** (approved, release/processing in progress); **Available** (in balance, payout-eligible); **Withdrawn** (payout completed); **On Hold** (dispute/verification/payment issue).

**Transaction-type vocabulary:** `Escrow Funded, Milestone Approved, Payment Released, Commission Charged, Payout Requested, Payout Processing, Payout Completed, Payout Failed, Refund, Adjustment, Dispute Hold, Hold Released`. Live writers currently emit `EscrowFunded`, `PaymentReleased`, `PayoutCompleted`, `Refund`, and `DisputeHold`; the remaining enum values are reserved/unwired.

**Commission (flat 12%, computed at milestone release, §1.4):** `Commission = Gross × PlatformCommerceConstants.CommissionRate`; `Net = Gross − Commission`, rounded to two decimals away from zero. Example: Gross **$950.00** → Commission **$114.00** → Net **$836.00**. Release atomically records milestone/engagement state, the ledger row, issued invoice, completed payment operation, and audit event after the STUB response.

**Balance calculations:**
- `Available Balance = Released Earnings − Completed Payouts − Active Payout Requests + Completed Adjustments`
- `Pending Balance = Approved Payments − Released Payments`
- `Protected Escrow = Funded Milestones − Approved or Refunded Amounts`

**Payout eligibility — LIVE/PARTIAL:** validates provider existence/settings, embedded account hold, a `Verified` masked payout method, minimum amount, available balance, and no existing active payout. A separate identity-verification recheck is not performed in `RequestPayoutAsync`. The STUB marks successful payouts completed immediately; failure leaves funds available. Payout details are masked.

**Invoices — LIVE/PARTIAL:** milestone release creates an `Issued` invoice with a snapshot of embedded tax settings. Correction/credit-note fields and statuses exist, but no correction endpoint or document generator/download exists.
**Statements — LIVE API:** a custom date range returns opening balance, gross, commission, adjustments, payouts, closing balance, and transaction rows. Monthly/quarterly/annual presets and downloadable documents are not built.

**Financial notifications — LIVE subset:** milestone funded and payment released are sent. Payout/invoice/statement/hold notification variants from the source list are not wired.

**Financial empty states — LIVE:**
- **No Earnings** — "No Earnings Yet" / "Approved project payments will appear here."
- **No Available Balance** — "No Funds Available" / "Released earnings that are ready for payout will appear here."
- **No Payout Method** — "Add a Payout Method" / "Verify a payout method before requesting a withdrawal." The setup form is on the same Earnings page.
- **No Invoices** — "No Invoices Yet" / "Issued milestone invoices will appear here."

### 8C — Cross-module handoff and event chain (live boundary)

`Proposal Accepted/AwaitingModule4` → immediate Hangfire enqueue (plus minutely recovery sweeper) → atomic `Contract + WorkroomEngagement + WorkroomMilestone(s)` creation and proposal `ConvertedToProject/Converted` → both parties record **STUB authenticated in-app consent** → client calls STUB escrow funding → provider activates milestone → provider submits immutable deliverable version → client requests a revision, disputes, or approves via API / seven-day job auto-releases if undisputed → STUB release records flat 12% commission, invoice, and available balance atomically → engagement completes → review/repeat/on-time/dispute signals feed Module 1.

**Cross-path facts:** package and negotiated proposals converge on the same conversion worker. Proposal milestone plans are copied; an empty plan gets one full-price fallback milestone. `DeliveryScheduleCalculator` starts the due date on provider activation; `RevisionCalculator` enforces live entitlement. Module 5 now reads the resulting records directly—Module 4 emits no analytics side-effect/snapshot—and `Additional Revision Purchased` remains deferred.

**Supporting features:** hourly contracts can record completed time entries; `WeeklyHourLimit` is captured in contract terms but is **not enforced** by `AddTimeEntryAsync`, and automatic hourly billing/client approval is not wired. Repeat-client coupons are fixed 5%, expire after 90 days, and are tier-independent; payout methods store masked future-rail descriptors; Tax/VAT settings are embedded and snapshotted into invoices.

**Resolved decisions / remaining flags:** coupon behavior is tier-independent. Admin dispute resolution is live for `ProviderFavored` and `ClientFavored`; split settlement is deliberately rejected until an explicit contract-amendment/pricing flow exists. Real payment/scanning/signing adapters and production transaction-topology verification remain deployment blockers (§8.0).

**Dependencies.** Reads: proposals (§7), catalog delivery/revision calculators (§6), provider capacity/financial settings on the `ServiceProviderProfiles` record (§1A; embedded copy is fallback only, §4.1), and the shared commission constant (§1.4). Produces: four Trust signals + `Review` → §5.1; earnings/dispute/delivery data → Analytics (§9); workroom audit events → §13.

---

## 9. Module 5 — Analytics & Growth — **LIVE**

**Commits:** `c64aab5` (backend, including the Module-4 calculator extraction) / `18c54e1` (frontend), on `dev-hafiz`.
**Verification:** `dotnet build` **0 errors / 0 new warnings in Module-5/shared-calculator files** (the final incremental build reported 16 pre-existing NuGet audit warnings); full backend suite **575 passed / 0 failed / 57 skipped**; Module 1 **100**, Module 2 **22**, Module 3 **19**, Module 4 **25**, and Module 5 **29** targeted tests pass; `npx tsc --noEmit` clean. Module-4 extraction check: **25 / 0 / 0 before** and **25 / 0 / 0 after**.

Module 5 is a provider-owned, read-time aggregation surface over Modules 2–4. It adds no metric source-of-truth: no metric snapshots, tracking-event collection, cache, export mechanism, or observation job. The only persisted state is a manual `GrowthTask` that the provider creates and updates. All observations are deterministic rule evaluations—never AI (§2).

### 9.0 What's live vs. honestly unavailable (verified against code)

- **LIVE backend/UI:** `[Authorize]`, owner-scoped `/api/service-provider/analytics` plus growth-task endpoints; one `/dashboard/serviceprovider/analytics` workspace with URL-backed `view=overview|services|proposals|profile|earnings|clients` (legacy `view=growth` normalizes to Overview), `range`, `currency`, `from`, and `to`; Last 7/30/90 Days, This Year, Previous Year, and Custom Range filters; equal-period/calendar comparisons; per-response `ComputedAt`; currency selection; overview, service, proposal, profile, revenue, client, observation, task, and purposeful empty-state views.
- **LIVE read-time metrics:** gross/net revenue and commission; available/pending/protected balances; average/highest project value; revenue by service/client/month/category; submitted/accepted/declined/withdrawn/expired proposals, acceptance rate, and average proposal value; completed work; average delivery time; on-time rate; total/new/returning clients; repeat-client rate/revenue; average projects/client; average client lifetime value; verified-review average; most-active clients; service orders, average selling price, completion rate, on-time delivery, and repeat orders.
- **LIVE financial integrity:** financial results are scoped to the selected three-letter currency; only completed `PaymentReleased` rows count as earned; a release whose milestone also has a completed/refunded `Refund` row is excluded; funded/protected escrow is shown separately and never presented as earned revenue. Service/category breakdown joins historical proposal snapshots/listings; work with no effective `ServiceId` is explicitly grouped as **`Custom/Unattributed`**.
- **LIVE shared formula amendment:** `IClientRelationshipCalculator` / `ClientRelationshipCalculator` is the one implementation for unique-client-weighted repeat rate (`clients with ≥2 completed/archived engagements ÷ unique completed clients`) and milestone on-time rate (`SubmittedAt <= DueDate`). `WorkroomService.RefreshTrust` and Module 5 both use it (§8 amendment); no duplicate formula remains.
- **LIVE manual state:** `GrowthTask` is provider-created only. Statuses are `Open, InProgress, Completed, Dismissed, Expired`; terminal tasks cannot reopen. Expiry is applied lazily when tasks are read/updated. `TriggerRuleId` remains null for provider-created work. There is deliberately **no periodic observation→task job**, no eager task fan-out, and no automatic commercial action.
- **`notTracked` is an honest data-source state, not a bug or fabricated zero:** unavailable metrics carry `State = "notTracked"`, null numeric/comparison/change values, and a reason in the API; the UI labels them “Not tracked yet.”
  - **Profile metrics:** profile views, search appearances, portfolio views, profile saves, contact rate, and portfolio engagement. These require a real public profile/search/portfolio browsing surface with privacy-safe, date-stamped tracking first.
  - **Date-filtered Service counters:** impressions, service views/clicks, conversion rate, and enquiry conversion. Module 2 has lifetime `Impressions`/`Clicks` counters and record methods, but no live caller or timestamped events; a lifetime number cannot honestly answer a selected-period query. **A planned event-tracking architecture (§9.4, Phase A–E) will wire real timestamped impressions/clicks/inquiries when implemented.**
  - **Enquiries:** no enquiry entity/source-of-truth writer exists. The `ServiceInquiry` source enum alone is not activity history; enquiry tracking must exist before enquiry counts/rates can be computed.
  - **Proposal view/client-response rates:** current proposal status can say `Viewed`, but there is no durable `ViewedAt`/client-response timestamp or event history after later transitions. Durable proposal-event history is required before period rates are real. Module 3's provider response-rate signal is a different metric and is not reused as a client-response substitute.
  - **Cancellation rate:** engagement/milestone cancellation is not a complete historical lifecycle and cannot support a trustworthy period denominator. A durable cancellation lifecycle/history must be built upstream first.
- **Known test-provenance limitation:** no `IsTest`/environment-provenance field exists on `ServiceListing`, `Proposal`, `WorkroomEngagement`, `FinancialTransaction`, or elsewhere in this SP chain. Module 5 therefore includes all upstream records and cannot exclude “test projects.” This is disclosed through `IncludesRecordsWithoutTestProvenance` / `DataLimitation` in the API and in the UI. No Module-5-only provenance field was retrofitted.

### 9.0.1 As-built state and response shapes

- **`GrowthTask` → `"GrowthTasks"`:** `Id, ProviderId, TaskType, Title, Description, Status, TriggerRuleId, RelatedEntityType, RelatedEntityId, CreatedAt, UpdatedAt, ExpiresAt`. This is the single new top-level collection; fields match the approved stateful exception.
- **Dashboard envelope:** `Period, Currency, AvailableCurrencies, HistoryStartedAt, HasMinimumHistory, IncludesRecordsWithoutTestProvenance, DataLimitation, Overview, Services, Proposals, Profile, Revenue, Clients, Observations, UnavailableObservationRuleIds, EmptyStates`.
- **Metric shape:** `State, Value, PreviousValue, ChangePercentage, Unit, Reason`; tracked values use `available`, missing source data uses `notTracked`, and a real metric with no qualifying rows may use `notEnoughActivity`.
- **As-built Profile DTO:** real profile state is exposed as `TrustScore, TrustSignals[], DisputePenalty, ProfileCompleteness, VerificationStatus, TierLevel, TierMeaning, SkillsTestsTaken, SkillsTestsPassed, LatestSkillsTestScore, PortfolioItems, PublishedServices`; tracked marketplace visibility remains `ProfileViews, SearchAppearances, PortfolioViews, ProfileSaves, ContactRate, PortfolioEngagement`, all as `notTracked`. The earlier planned raw `ClientEnquiries`, `ServiceClicks`, and `ReturningVisitorRate` fields are not separate response properties and remain **NOT MET**; none has an upstream event source.
- **As-built detail enrichments (2026-07-28 reconciliation, `fd38914`):** service rows add historical/live `Status`, click-through rate, and gross/net revenue; proposal analytics expose all current status buckets plus conversion-to-project while view/response rates remain `notTracked`; revenue adds Withdrawn; clients add repeat count, completed engagements, on-time delivery, review count and rating dimensions, and opened/resolved/adverse disputes. These values remain read-time, period/currency scoped where applicable, and owner scoped.
- **Period shape:** `Range, From, To, ComparisonFrom, ComparisonTo, ComputedAt`.
- **Growth-task endpoints:** list, create, and owner-scoped status update. Analytics observations are not stored in `GrowthTasks`.

### 9.1 Metrics and date behavior

**Business overview:** gross/net revenue, completed work, submitted/accepted proposals, clients, average delivery days, and on-time rate. Current and comparison values are returned where the source exists; percentage change is null rather than invented when a zero comparison makes growth undefined.

**Service analytics:** real order/completion/delivery/revenue/repeat measures are grouped by live or historical service identity. `Custom/Unattributed` preserves brief-based work without a service. Date-filtered view/impression/enquiry/conversion and cancellation fields remain explicit `notTracked` per §9.0.

**Proposal analytics:** submitted-proposal cohorts drive submitted, accepted, acceptance rate, average value, and terminal status counts. Proposal view rate and client response rate remain `notTracked`; current status is not treated as timestamp history.

**Revenue analytics:** gross, commission, and net derive only from non-refunded completed release rows; current balances reuse Module 4's amount categories; breakdowns cover service, category, masked client ID, and month. All values are currency-scoped.

**Client analytics:** period clients/new/returning and period repeat revenue sit alongside lifetime-as-of-period repeat rate, average projects/client, and lifetime value. Verified reviews supply rating averages. Client identifiers are masked in the most-active list. Repeat/on-time formulas use the shared calculator, not an analytics copy.

### 9.2 Deterministic growth observations and manual tasks

The four canon rules remain exact and are evaluated when the dashboard is read; they are not persisted or scheduled:

- **Rule 1:** Service Views > 500 AND Conversion < 10%.
- **Rule 2:** Profile Views > 1000 AND Contact Rate < 5%.
- **Rule 3:** Proposal View Rate < 40%.
- **Rule 4:** Repeat Client Rate > 30%.

**Current computability:** only **Rule 4** can execute because repeat-client rate has a real source. Rules 1–3 are listed in `UnavailableObservationRuleIds` and cannot fire while their inputs are `notTracked`. Rule 4 yields fixed positive-reinforcement copy plus fixed suggested actions; no rule generates dynamic prose, creates a task, messages a client, changes pricing, or performs any commercial action.

`GrowthTask` remains a separate manual/provider-only checklist. The provider supplies title/description/type and may move an open task to in-progress/completed/dismissed. Observation banners never create or synchronize task documents.

### 9.3 Empty states — LIVE

- **“Not Enough Activity Yet”** — performance analytics appear after real marketplace work begins; unavailable tracking signals remain visibly `notTracked` even in this state.
- **“No Published Services”** — action: **“Create Service.”**
- **“No Revenue Activity”** — approved and released project payments will appear here.

**Dependencies.** Reads `ServiceListings`, `ClientBriefs`, `Proposals`, `WorkroomEngagements`, `WorkroomMilestones`, `FinancialTransactions`, `Reviews`, and Module-4 financial summary state. Persists only provider-owned `GrowthTasks`; no metric is consumed elsewhere and no Trust signal is written by Analytics.

### 9.4 Planned — Analytics Tracking System Architecture (Phase A–E, **not yet implemented**)

**Status: [PLANNED]** — The following architecture specifies a real, event-based tracking system that will power per-service and provider-wide Impressions/Clicks/Inquiries metrics in the Analytics workspace. All phases are reference only; nothing below is currently implemented. Providers see `notTracked` for service-view metrics until Phase D ships (§9.0).

#### 9.4.1 Goals and definitions

**Goals:**
- Providers see real, honest Impressions, Clicks, Inquiries, and Conversion Rate for each service listing and an aggregate "All services" view.
- Time-range filtering: Today / Last 7 days / Last 30 days / Last 90 days.
- Time-series chart: Impressions vs Clicks over the selected range.
- Provider self-views/clicks never inflate their own metrics.
- Bot/spam protection at the recording layer.
- Backend-authoritative — frontend records fire-and-forget, no client-side synthesis.

**Definitions:**
- **Impression** — a public visitor loads a listing detail page. One impression per (listing, session, 30-minute deduplication window).
- **Click** — a public visitor clicks any primary CTA on the listing detail page (Contact / Order / View Packages / package tier card). One click per (listing, session, 5-second deduplication window).
- **Inquiry** — a public visitor successfully sends a message to the provider about a specific listing. One inquiry per completed message send (piggybacked on existing message-send persistence).
- **Conversion Rate** — inquiries ÷ impressions, expressed as percentage; displayed only when impressions > 0.

#### 9.4.2 Data model

**`AnalyticsDailyBuckets` collection:**

One document per listing per day. Atomic `$inc` operations record impressions/clicks/inquiries daily. No periodic rollup job needed.

```
{
  _id: ObjectId,
  ListingId: string,          // ServiceListing.Id
  ProviderId: string,         // Denormalized for fast provider-wide 
                              // aggregations
  Date: DateTime,             // UTC midnight, day granularity
  Impressions: int,
  Clicks: int,
  Inquiries: int,
  UpdatedAt: DateTime
}
```

Indexes:
- Unique compound on `(ListingId, Date)` — one bucket per listing per day.
- Compound on `(ProviderId, Date)` — provider-wide date-range scans.

**`AnalyticsSessionSeen` collection (deduplication):**

Tracks session-level visibility for dedup within 30-minute (impressions) and 5-second (clicks) windows.

```
{
  _id: ObjectId,
  ListingId: string,
  SessionKey: string,         // SHA-256(salt + IP + User-Agent)
  EventType: string,          // "impression" | "click"
  LastSeenAt: DateTime,
  ExpiresAt: DateTime         // TTL: 30min (impression), 5sec (click)
}
```

Indexes:
- Compound on `(ListingId, SessionKey, EventType)` — dedup lookup.
- TTL index on `ExpiresAt` — MongoDB auto-cleanup, no manual job.

**Why daily buckets, not raw events:**
Daily granularity satisfies all four time-range filters. Direct `$inc` on daily buckets is atomic and cheap. No periodic aggregation job needed. Storage is bounded—one document per listing per day, TTL-cleaned session records.

#### 9.4.3 Recording endpoints (**Phase A**)

**`POST /api/analytics/impression`** — Fire on public listing detail page mount.

Request body:
```json
{ "listingId": "string" }
```

Server logic (in order):
1. If request carries valid provider auth AND token ProviderId == listing ProviderId → return 204, drop the event. Provider self-views never count.
2. Compute `SessionKey = SHA-256(salt + clientIP + userAgent)`.
3. Query `AnalyticsSessionSeen` for `(listingId, SessionKey, "impression")`. If hit and not expired → return 204.
4. Insert `AnalyticsSessionSeen` with `ExpiresAt = now + 30 minutes`.
5. Atomic upsert on `AnalyticsDailyBuckets`: `{ listingId, providerId, date: today00 } → $inc Impressions: 1, $set UpdatedAt: now`.
6. Return 204 No Content.

Additional: Coarse per-IP rate limit at middleware (e.g., 60 impressions/IP/min) as fallback.

**`POST /api/analytics/click`** — Fire on listing-detail CTA click (Contact, Order, View Packages, tier card).

Same logic as impression, with:
- 5-second dedup window (not 30 minutes).
- `$inc Clicks: 1`.
- Optional `target` field (`"contact"` / `"order"` / `"packages"` / tier SKU) stored on session doc, not the daily bucket (v1).

**Inquiry counting — no new endpoint.** Existing message-send flow gets a small wiring addition: on successful message persistence from a listing context, `$inc Inquiries: 1` on that day's bucket. No dedup—existing message system handles spam.

#### 9.4.4 Aggregation endpoints (**Phase B**)

**`GET /api/analytics/summary?listingId={id|all}&range={today|7d|30d|90d}`**

Auth: Provider must own the listing (or all their listings for `listingId=all`).

Response:
```json
{
  "impressions": integer,
  "impressionsDelta": decimal | null,
  "clicks": integer,
  "clicksDelta": decimal | null,
  "inquiries": integer,
  "inquiriesDelta": decimal | null,
  "conversionRate": decimal | null,
  "conversionRateDelta": decimal | null
}
```

Delta = `((current − previous) ÷ previous) × 100`. If `previous == 0`, delta is `null` (UI shows em-dash). Conversion rate is `null` when impressions == 0.

**`GET /api/analytics/timeseries?listingId={id|all}&range={today|7d|30d|90d}`**

Response:
```json
{
  "buckets": [
    { "date": "2026-06-15", "impressions": 12, "clicks": 3 },
    ...
  ]
}
```

Missing days filled with zeros for continuous chart axis.

**`GET /api/analytics/listings`**

Populating the dropdown selector. Returns "All services" pseudo-entry + each provider listing, with optional `impressions30d` for badging. Read-owned listings excluded from dropdown.

#### 9.4.5 Frontend recording (**Phase C**)

**Impression:** Fire once on public listing detail page mount.

```javascript
useEffect(() => {
  const controller = new AbortController();
  fetch('/api/analytics/impression', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId }),
    keepalive: true,
    signal: controller.signal,
  }).catch(() => { /* silent */ });
  return () => controller.abort();
}, [listingId]);
```

Rules: Fire once, fire-and-forget, non-blocking, no UI feedback, do not delay primary rendering.

**Click:** Similar fire-and-forget on CTA click. Never delay the action to wait for analytics.

**Inquiry:** Entirely backend; existing message-send flow adds the increment.

#### 9.4.6 Analytics workspace UI (**Phase D**)

Layout: Listing selector dropdown ("All services" + provider's listings, default "All services") → time-range filter (Today / 7d / 30d / 90d, default 30d) → four metric cards (Impressions, Clicks, Inquiries, Conversion Rate with value + delta chip + icon) → line chart (Impressions vs Clicks, selected range).

**Canon compliance:**
- All colors from `globals.css` design tokens—no hardcoded hex.
- No fabricated numbers. When a metric is 0, UI shows em-dash `—` instead of `0` to distinguish "no activity" from a real zero. No delta chip in that state.
- Empty chart state: "No activity yet for this range. Data appears as visitors interact with your listing."—not an empty grid.
- "TOP GIG" badge deferred (Phase E). Not rendered at Phase D.

#### 9.4.7 Privacy, security, edge cases

- **No PII in `AnalyticsSessionSeen`** — only the hashed session key.
- **SHA-256 with per-instance salt** (config value). Salt does not rotate (would break in-flight dedup).
- **TTL auto-cleanup** — MongoDB handles `AnalyticsSessionSeen` TTL; no manual job.
- **Daily buckets have no TTL** — providers may want long-term history; storage cost is negligible.
- **Deleted listings:** buckets preserved; frontend excludes from dropdown. "All services" aggregate still counts them historically.
- **Provider detection:** JWT ProviderId claim vs listing's ProviderId, both strings, request-scoped, no session state.
- **No cross-provider leakage** — every read endpoint enforces ownership (§2, §10.1).

#### 9.4.8 Implementation phases (planned, not implemented)

**Phase A — Backend data model + write endpoints.** Collections, indexes, impression + click recording endpoints with provider-drop and session dedup. Inquiry hook into existing message-send flow. Unit tests for provider-drop and dedup. No frontend changes; no read endpoints yet.

**Phase B — Backend read endpoints.** Summary, timeseries, listings-for-dropdown aggregations. Unit tests for date-range aggregation and edge cases (zero-comparison deltas, missing days, owned+read-only listings).

**Phase C — Frontend recording.** Fire-and-forget impression/click calls on public listing detail pages. Verify events land in MongoDB. Confirm provider self-view does NOT increment.

**Phase D — Analytics workspace UI.** Dropdown + 4 metric cards + chart, all matching mockup. `globals.css` tokens only. Honest empty states. React Query hooks wired to Phase B endpoints. Conversion-rate handling. No fabricated zero-state data.

**Phase E — TOP GIG badge and optional additional breakdowns.** Deferred. Server-computed best-performing-listing flag. Optional per-CTA click breakdown. Advanced comparison ranges.

#### 9.4.9 What NOT to do

- **Do NOT ship analytics UI with fabricated numbers "for now."** Canon rule §2 (no AI-generated/fake content). Empty states + `notTracked` are the honest alternative.
- **Do NOT create a raw events collection.** Daily buckets are sufficient and simpler. No "we'll aggregate later" deferral.
- **Do NOT rate-limit at the daily-bucket level.** Would drop legitimate events. Rate-limit at session-dedup layer + coarse per-IP middleware only.
- **Do NOT ship Phase D before Phase A, B, C complete.** No fake data is preferable to real UI with no real data.
- **Do NOT store PII** (user emails, names, IDs) in session dedup records. Hash only.

---

## 10. Cross-cutting technical rules (every module)

1. **Auth + ownership on every endpoint.** JWT `[Authorize]` at the controller; every action is **owner-scoped** — the `ProviderId`/`UserId` comes from the authenticated principal, never a request field. An SP can only read/write its own data.
2. **`ApiResponse` envelope on every response.** No bare `Ok(obj)` or ad-hoc shapes; the service layer returns `ServiceProviderResult<T>` and the controller maps it via `Map<T>()`.
3. **No browser storage as source of truth.** No `localStorage` / `sessionStorage` for SP state — the backend is authoritative; a read-through paint cache is the only permitted client cache and must never diverge.
4. **Every time-based rule is backed by a real Hangfire job**, not just a UI countdown — Module 3's per-brief `expiresAt` is enforced by `ClientBriefExpirationJob`; Module 4's minutely `WorkroomTimedRulesJob` enforces 7-day undisputed auto-release, deadline reminders, elapsed 5-day dispute-window audit escalation, and payment-operation reconciliation (§8). A UI timer alone is never the enforcement mechanism. (Exception, by design: the skills-test 30-day cooldown is a **read-time** check, §5.3 — no job needed.)

---

## 11. The Service Provider journey (product experience)

This is the **experience** order — what a real SP lives through, in the order they live it — **distinct from §1.2's data-dependency build order** (that's for developers). Because there are **no phases** (§1.1), the journey is not enforced by gating; it is shaped by **purposeful, context-aware empty-states and dashboard nudges**. Each step is tagged **LIVE**, **PARTIAL**, or **PLANNED** so the narrative never implies unbuilt behavior exists. **Modules 1–5 are now mechanically live.** Module 4's payment, scanning, and contract-consent boundaries remain STUB-backed (§8.0), and Module 5 visibly identifies upstream tracking gaps as `notTracked` (§9.0).

### 11.1 First-time flow (signup → verified) — **LIVE (automatic SP profile verification)**

1. **Universal Gate** — the shared KYC/onboarding every role passes (`OnboardingGate`).
2. **SP role selection** — the user picks the Service Provider role (shared onboarding).
3. **Complete the SP profile** — headline, bio, at least one skill, category, industry, language, pricing model, and portfolio item; `CurrentPhase` advances 1→2 when complete (§1.1).
4. **Submit for verification** → `VerificationStatus: Pending → Verified` immediately after the server's full `IsProfileComplete` check. No admin queue or approval intervenes; crossing to Verified opens the flat dashboard.
5. **Moderation exception only** — an admin may suspend `Verified → Rejected`. After remediation, provider resubmission produces `Rejected → UnderReview`; the admin queue then approves back to `Verified` or rejects again.

The Universal Gate remains unchanged and separate. Automatic SP profile verification and the moderation-only admin queue were reconciled with code in commit `dc29810`.

### 11.2 First login after verification — what a freshly-verified SP sees

No gating: **all five sections are open at once.** But a brand-new SP has zero data, so the realistic first visit is mostly empty. **Reality today: Profile & Trust, Service Catalog, Leads, Workroom, Earnings, and Analytics & Growth all render for the provider.** The first-visit experience:

- **Profile & Trust — LIVE.** Renders today. Shows the neutral **"building your trust score"** state (§5.2; `HasEnoughTrustData = false`, no number). The Tier badge shows the current tier (ranking-only, §5.4). The Skills Test is available (§5.3).
- **Service Catalog — LIVE.** Renders today. A freshly-verified SP sees a working, empty **Service Catalog** section with the **"No Published Services" / "Create your first service listing to start receiving briefs"** empty state (§6.9), and can immediately build listings + packages + FAQs.
- **Client Briefs / Pipeline — LIVE.** A freshly verified/available provider sees the working Client Briefs / Pipeline workspace and its internal Saved view, including the purposeful “No new client briefs” state (§7.3). Eligibility is driven by verified profile categories plus availability/capacity; the current code does **not** require a published listing. Setup guidance may link to Service Catalog, but it is not a hard gate.
- **Workroom & Earnings — LIVE provider UI.** Workroom shows “No Active Projects” until an accepted proposal is converted; Earnings shows “No Earnings Yet”, “No Funds Available”, “Add a Payout Method”, and “No Invoices Yet” as applicable. Client actions are API-only and financial movement is STUB-backed (§8).
- **Analytics & Growth — LIVE.** The provider sees “Not Enough Activity Yet,” “No Published Services,” and “No Revenue Activity” when appropriate; tracked metrics populate from real Modules 2–4 records, while unavailable profile/view/enquiry/proposal-event/cancellation signals are plainly “Not tracked yet” (§9).

**Getting-started nudge.** With no wizard forcing a path, onboarding guidance comes from **purposeful, context-aware empty-states**, not gating. Catalog encourages publishing services; Leads points back to service preferences when no client brief is available. Today those are guidance paths, while the actual Leads eligibility gate is verified profile + matching category + availability/capacity (§7.3).

### 11.3 Steady-state / returning-user loop — **LIVE mechanically, with explicit production/integration gaps**

Once briefs arrive, a working SP can traverse the Leads→Workroom→paid-record→Trust feedback loop end-to-end in application state. The financial leg is a simulation until a real gateway is installed, and client-side controls are deferred:

1. **Check Leads — LIVE** — new briefs, ranked by the Brief Match Score (§7).
2. **Respond to a brief — LIVE** — proposal/message timestamps feed the real response-rate metric (§7 → Trust §5.1).
3. **Convert acceptance — LIVE** — Module 3 stops at `Accepted/AwaitingModule4`; immediate Hangfire enqueue plus a recovery sweeper transactionally creates Module-4 records and moves the proposal to `ConvertedToProject/Converted` (§8.0).
4. **Deliver via milestones — LIVE provider UI + client APIs** — **STUB authenticated in-app consent** → STUB funding → activate → versioned submit → revision/dispute/approve or 7-day auto-release. The provider UI is live; client decisions currently require API callers.
5. **Get paid in platform state — LIVE mechanics / STUB money movement** — a mocked gateway success records release, deducts the **flat 12% commission**, issues the invoice, and exposes net Available balance. It does not move real funds.
6. **Signals feed back — LIVE** — satisfaction / on-time / repeat / dispute route through the existing TrustScore recalculation (§5.1). Module 4 Trust and Module 5 analytics share the same repeat/on-time calculator (§8/§9).
7. **Review performance — LIVE** — the provider opens Analytics & Growth for real revenue, proposal, delivery, service-order, and client measures; Rule 4 may display deterministic repeat-client reinforcement. `notTracked` gaps are not presented as zeros and observations never auto-create tasks or take actions (§9).
8. **Repeat.**

**Returning-user landing view — LIVE.** With no “next phase” to resume, a returning SP is oriented by the API-backed dashboard overview, not wizard logic. It shows real balances, Active Projects, New Leads, neutral/scored Trust states, Requires Attention actions, the honest availability state of service-view analytics, and Recent Activity from the dashboard response. No page-level duplicate shell, mock statistics, phase progress, or AI label is introduced.

### 11.4 Skills Test and Tier — optional side-paths (not steps in the loop)

Both are **asynchronous to the main loop** — an SP can engage them any time, and neither gates anything:

- **Skills Test — LIVE (§5.3).** Optional, non-blocking. Take a per-category test whenever; passing feeds the Skill Test trust signal. It coexists with the live Response Rate and Module-4 reputation signals (§5.1). 30-day cooldown per category.
- **Tier — badge LIVE; Tier1→Tier2 progression LIVE via verification; Tier3/4 NOT built.** The Tier badge (§5.4) shows the SP `ProviderTier` (ranking-only; legacy `Tier_level` only for unmigrated fallback). **Progression as implemented (§1A.8):** `Tier1` is the default; server-controlled verification (automatic first-submission verification or admin approval) grants `Tier2` and never downgrades; `Tier3`/`Tier4` have **no writer** and remain reserved for authorised evaluation. Do **not** describe any provider-controlled tier journey; there is none.

### 11.5 Why a zero-data SP doesn't look broken on first login

With no phases to sequence the new SP, the "this isn't broken — here's what to do" burden falls entirely on **empty-state design**, section by section. This ties the per-module empty states into one narrative:

- **Profile & Trust (LIVE):** the neutral "building your trust score" state (§5.2) is already an honest, non-broken empty state — it explains the score is accruing and points to the Skills Test as the one thing that moves it now.
- **Service Catalog (LIVE):** the "No Published Services" / "Create your first service listing to start receiving briefs" empty state (§6.9) — the primary getting-started call to action, live today.
- **Client Briefs / Pipeline (LIVE):** the Client Briefs empty state explains that profile-matched briefs will appear here; Pipeline and Saved have their own purposeful empty states (§7.3).
- **Workroom & Earnings (LIVE):** “No Active Projects”, “No Earnings Yet”, “No Funds Available”, “Add a Payout Method”, and “No Invoices Yet” explain which upstream event supplies data.
- **Analytics & Growth (LIVE):** “Not Enough Activity Yet”, “No Published Services”, and “No Revenue Activity” explain which upstream work supplies tracked data; “Not tracked yet” distinguishes missing event infrastructure from a measured zero (§9.0/§9.3).

**Coherence rule:** every SP section must ship a purposeful empty-state that tells the provider what to do next — that is the flat model's replacement for a wizard. **All five live SP modules now satisfy this rule.**

---

## 12. Notifications (source §11)

Categories: `Opportunities, Proposals, Projects, Deadlines, Revisions, Payments, Reviews, Support, System`.
Fields: `notificationId, recipientId, category, title, message, relatedEntityType, relatedEntityId, isRead, createdAt, actionLabel`.
**Rule:** a notification may *suggest* an action but **never executes** one (§2). Per-module notification lists live in §7 and §8.

## 13. Audit log (source §12)

**Module-4 audit — LIVE:** `WorkroomAuditEvent` → `"WorkroomAuditEvents"` records conversion, **STUB contract-consent**, STUB-backed funding, activation, delivery, revision, pause/resume, extensions, disputes/admin resolution, STUB-backed release/payout, completion, and review actions. Real fields: `Id, ActorId, ActorRole, Action, EntityType, EntityId, PreviousState, NewState, Timestamp, Reason`. It has no edit/delete endpoint. Broader cross-module audit coverage remains partial.

## 14. Validation & error rules (source §13)

**Field-level examples:** "Enter a proposal price." · "Add at least one deliverable." · "Select a future delivery date." · "Upload at least one delivery file." · "The payout amount exceeds your available balance."
**Business-rule errors:** "This client brief is no longer accepting proposals." · "This proposal has already been accepted." · "The milestone cannot begin until escrow is funded." · "The project cannot be completed while a revision is open." · "The payout cannot be processed while the account is under review."
**Data-failure behaviour:** preserve user drafts; don't needlessly remove uploaded files; a partial module failure must not block other modules; always offer retry; prevent duplicate submission. (Reinforces §10 rule 3 — backend-authoritative, no browser storage of truth.)

## 15. Security & trust rules (source §14)

Only authorised project participants get workroom access; provider-private tasks/files are not returned to clients; financial details are provider-scoped; payout descriptors and tax identifiers are masked; contract / approval / transaction history is preserved; critical actions require confirmation. **STUB caveats:** current file “scanning” is only deterministic extension/20 MB validation, suspicious-download warnings are not implemented, payment protection is not real until a production gateway/escrow adapter exists, and contract consent is not an e-signature (§8.0).

### 15.1 Frontend safety containment — **LIVE** (`3a19c1e`)

- One shared Service Provider dirty-form guard protects Profile, portfolio dialogs, Catalog listing/package editors, Proposal editing, and Financial Settings. It fingerprints real form values, warns on refresh/tab close and supported internal navigation, preserves edits when navigation is cancelled, clears after successful persistence, remains dirty after failed persistence, and makes no autosave claim.
- Portfolio project URLs and Workroom deliverable links accept only complete `http:`/`https:` URLs. Proposal attachment references remain contract-compatible opaque strings, but any URL-shaped reference must be valid HTTP(S) before it can be stored or rendered as a link. `javascript:`, `data:`, `file:`, `vbscript:`, malformed, protocol-relative, and unknown-scheme values are rejected in the UI. External anchors use `rel="noopener noreferrer"`.
- Availability controls in the SP sidebar and Dashboard expose pending/success/failure state, disable repeated submission while pending, preserve the previous visible value after failure, and offer retry guidance. Success is shown only after the API mutation resolves.
- Earnings navigation keeps `Earnings & Payouts` as workspace context while exactly one query-aware child is the selected destination. Provider-facing Client Brief copy no longer uses “Opportunity” for the `ClientBrief` domain object.
- Proposal commission presentation consumes the server-returned `earningsPreview.rate`, commission, and net values. The frontend does not define or recompute `0.12`; `PlatformCommerceConstants.CommissionRate` remains the sole rate source (§1.4).
- Regression coverage added **19 Service Provider scenarios** for dirty forms, Financial Settings initialization, safe/unsafe URLs, availability success/failure/restoration, Earnings selection, Client Brief terminology, STUB disclosures, and server-provided 12% presentation. Verification: TypeScript clean; changed-file ESLint **0 errors / 0 warnings**; frontend **126 passed / 0 failed**; production build successful with **107 / 107 routes**; diff check clean. The initially restricted build could not fetch configured Google Fonts; the network-enabled build passed.

This is **frontend defence-in-depth only**. Equivalent backend URL validation is still required, and frontend visibility/disablement is not authorization. Browser interaction QA for internal-navigation and `beforeunload` behavior remains useful when a controllable browser is available.

### 15.2 Production release gate — **⛔ NOT MET**

- **Critical:** provider/client actor separation; self-dealing prevention; self-review prevention; Trust Score manipulation prevention.
- **High:** provider-only controller role enforcement; negative add-on validation; milestone amount positivity and milestone-total validation; sensitive-value masking bypass; vulnerable NuGet dependencies.
- **Medium:** milestone-to-engagement referential validation; task-assignee validation; internal `StoragePath` exposure; backend URL-scheme validation.
- **Split follow-ups (2026-07-29, §1A — operational, not security regressions):** production migration sweep + verification execution; replica-set transaction test execution (added, locally Docker-skipped); Phase-6 embedded-field deprecation; Creator-side designer-card repointing. The data split resolves none of the Critical/High/Medium items above and none of them invalidates the split.

Until an authorized backend remediation implements and verifies these controls, do not deploy SP Leads, Workroom, reviews, Trust Score, or financial workflows to production. Client-side hiding, disabled buttons, redirects, ownership comparisons, filtering, or warnings do not resolve these server-side vulnerabilities.

---

## 16. Roles & permissions (source §4)

**Service Provider — can:** view client briefs; save/dismiss; create / submit / revise / withdraw proposals; message the client; open an accepted workroom; upload files; submit milestone deliverables; respond to revisions; schedule meetings; view earnings; request payout; download invoices/statements; view analytics; improve service/profile.
**Service Provider — cannot:** accept own proposal; approve own milestone; release own escrow; manually change commission; edit verified reviews; delete financial transactions; overwrite contract records.

**Client — can:** view SP profile; publish or directly send a client brief; review a proposal; request changes; accept/decline a proposal; upload files; review deliverables; request revisions; approve milestones; submit reviews.
**Client — cannot:** see provider private notes / earnings / payout info; delete deliverable history; secretly reopen approved milestones.

**Platform Administrator — can:** review fraud/safety/disputes; pause suspicious projects; apply payment holds; review verified documents; view audit history; apply a policy-based status override — **always audit-logged** (§13).

---

## 17. Acceptance criteria — per-module "definition of done" (source §15)

- **Module 2 — Service Catalog (§6, full-scope; source §20) — ✅ MET (built `533d2e2`/`36b6f71`), with the config-vs-enforcement caveats flagged below:**
  - **Delivery time — ✅ MET:** independent per-package config; Business/Calendar Days; start rule; due-date formula (`DeliveryScheduleCalculator`, unit-tested); and extension. Module 4 now consumes the calculator on milestone activation and approved extension. Generic purchased add-on delivery-time application remains part of the unwired add-on/change-order path.
  - **FAQ Builder — ✅ MET:** creatable; package-specific; reorderable; draft/published; package-conflict warning (`DetectFaqConflict`); can't override package terms.
  - **Per-package revisions — ⚠️ PARTIAL:** independent count/config and remaining-revision calc **✅**; Module 4 now enforces one consolidated feedback round, manual scope classification, and “only WithinScope consumes” **✅**. The actual paid purchase/change-order producer and source-configured request-window enforcement are **NOT MET**.
  - **Auto-accepted proposal (§6↔§7↔§8 boundary) — ✅ LIVE mechanically:** Module 3 validates and snapshots the package order; Module 4 converts accepted proposals into execution records. Client checkout UI and real payment/escrow integration remain deferred/STUB-backed.
  - **Other — ✅ MET for Module-2-owned pieces:** lifetime impression/click fields + internal record methods exist, but still have no live caller after Module 3; deterministic pricing guidance is shown (`PricingGuidance`, unit-tested, no AI); capacity fields exist on the profile (§6.7).
- **Module 3 — Leads / Client Acquisition (§7) — ⚠️ PARTIAL overall; approved Module-3 boundary shipped (`d419ed1`/`4df8122`):**
  - **Client Briefs inbox/state — ✅ MET:** eligible briefs visible; deterministic match score; availability hard pre-filter; save/dismiss/view state is provider-specific; working Client Briefs/Saved UI and purposeful empty states.
  - **Proposal core — ✅ MET backend and provider UI:** draft, edit, submit, view, withdraw, expire, duplicate, changes-request, revise with preserved `PreviousVersions`, review, decline, and accept are implemented server-side. The reconciled provider UI exposes create/edit/revise, milestone-plan and attachment-reference controls, previous-version history, submit, withdraw, duplicate, and provider order-request approval.
  - **Acceptance modes — ⚠️ PARTIAL:** manual standard/direct-invitation acceptance and rule-based published-package purchase/manual fallback are live through `Accepted/AwaitingModule4`. Platform-admin resolution and complete custom-offer/package-add-on/change-request flows are not wired; client checkout UI and payment/escrow-provider integration are not built.
  - **Response rate — ✅ MET:** first submitted proposal or first provider-authored brief-linked message within 48 hours; view does not count; availability timestamp uses publish/invitation-delivery receipt rather than lazy persistence time; TrustScore signal and matching consumer are live; old `0.85` stub is gone.
  - **Expiry/notifications — ✅ MET:** Hangfire soft-expiry (no TTL deletion), saved-expiry dedupe, and the §7 notification set are live.
  - **Accepted→project conversion — ✅ LIVE IN MODULE 4 / still not a Module-3 write:** Module 3 stops at `Status=Accepted`, `ConversionStatus=AwaitingModule4`; Module 4's immediate job + recovery sweeper atomically creates the records and advances conversion (§8.0).
  - **Cross-cutting gaps — ⚠️ PARTIAL:** planned client-verification/payment-verification lead filters and Module-3 audit-log writes are not implemented; catalog impression/click counters still have no live caller.
- **Module 4 — Workroom & Earnings (§8) — ⚠️ PARTIAL overall; core mechanics shipped (`7e31162`/`7b6acf7`), production external integrations deliberately not shipped:**
  - **Proposal→Engagement conversion — ✅ MET:** immediate Hangfire enqueue + minutely sweeper; unique `ProposalId`; transaction-safe contract/engagement/milestone creation; atomic proposal transition; empty-plan single-milestone fallback.
  - **Active projects / contracts / milestones — ✅ MET backend and provider UI / ⚠️ PARTIAL client UI:** provider workrooms are visible; **STUB authenticated in-app consent**, STUB-backed funding state, activation, pause/resume, extension, review, dispute, completion, and owner checks exist. Client decision endpoints are live, but a client Workroom/checkout frontend is deferred.
  - **Delivery/versioning — ✅ MET mechanics:** files can be uploaded through the **STUB scanner boundary**; deliverables require confirmations and ready file/link data; versions are separate documents and earlier versions are superseded, never overwritten. Real file-security scanning is separately **NOT MET** below.
  - **Revision flow — ⚠️ PARTIAL:** consolidated feedback, manual scope, allowance consumption, provider start, and resubmission are live. Client UI, configured request-window enforcement, and paid additional-revision/change-order purchase are not built.
  - **Milestone release/completion — ✅ MET application-state mechanics:** client approval or 7-day Hangfire auto-release is dispute-blocked and transactionally records milestone/engagement state, ledger, invoice, payment operation, and audit; project completion and capacity decrement are live. Money movement remains STUB-backed.
  - **Financial calculations/stages — ✅ MET in persisted application state:** Work in Progress / In Review / Pending / Available / Withdrawn / On Hold are derived; gross / 12% commission / net and available-balance formulas use the shared constant and are tested.
  - **Payouts / invoices / statements — ⚠️ PARTIAL:** masked settings, set-default/remove-method lifecycle rules, hold/minimum/method/balance/active-request validation, payout tracking, invoice tax snapshots, transaction detail, and structured date-range statement UI/API are live. The stub completes payouts immediately; identity is not separately rechecked in `RequestPayoutAsync`; correction and invoice/statement document generation/download remain absent.
  - **Trust feedback — ✅ MET:** Client Satisfaction, On-time Delivery, Repeat-Client Rate, and 5-point/capped-20 Dispute Penalty feed the existing Module-1 `RecalculateTrustScore`; no parallel score writer exists.
  - **Timed/audit rules — ✅ MET for the implemented lifecycle:** minutely conversion/timed sweepers, reconciliation state, and `WorkroomAuditEvents` are live. The 5-day dispute deadline escalates to an audit event; it does not auto-resolve.
  - **Real payment gateway / escrow / payout rail — ⛔ NOT MET (by confirmed design):** `StubPaymentGatewayService` only returns deterministic mock references. No real money moves.
  - **Real file-security scanning — ⛔ NOT MET (by confirmed design):** `StubFileSecurityScanner` only checks empty/size/extension. No virus/malware scanner exists.
  - **Real e-signature/legal signing — ⛔ NOT MET (by confirmed design):** contract “signing” is **STUB authenticated in-app consent** timestamps only.
  - **Production transaction-capability verification — ⛔ NOT MET:** `Mongo:TransactionsEnabled=true` is a hard startup gate with no fallback, but production Atlas / `srv1172497` topology could not be checked from the DNS/egress-blocked sandbox. Manual pre-deploy verification is required.
- **Module 5 — Analytics & Growth (§9) — ⚠️ PARTIAL overall; approved real-data boundary shipped (`c64aab5`/`18c54e1`) with unavailable sources explicitly `notTracked`:**
  - **Read-time architecture / ownership / UI — ✅ MET:** authenticated owner-scoped API and provider dashboard are live; metrics are computed from Modules 2–4 with a per-response timestamp; no snapshot/event/cache/export collection was introduced; `GrowthTasks` is the sole stateful collection.
  - **Revenue analytics — ✅ MET for application-state money:** currency-scoped gross/net/commission, current amount categories, average/highest project, and service/client/month/category breakdowns are live. Protected escrow is separate; refunded releases do not count as earned. Real money movement remains the Module-4 payment STUB caveat, not an Analytics claim.
  - **Proposal/work/client analytics — ✅ MET for source-backed fields:** submitted/accepted/terminal proposal counts, acceptance rate/value, completed work, average delivery, on-time rate, total/new/returning clients, repeat rate/revenue, projects/client, lifetime value, verified rating average, and most-active clients are live. `Custom/Unattributed` preserves work without a ServiceId.
  - **Shared repeat/on-time formula — ✅ MET:** Module 4 Trust and Module 5 Analytics consume `ClientRelationshipCalculator`; targeted Module-4 tests stayed **25 / 0 / 0 before and after** extraction.
  - **Date/comparison/integrity behavior — ✅ MET:** Last 7/30/90, This Year, Previous Year, Custom, comparison windows, computed-at, historical service attribution, selected currency, and refund exclusion are live.
  - **Service metrics — ⚠️ PARTIAL:** orders, average selling price/delivery, order completion, on-time delivery, and repeat orders are live. Date-filtered impressions/views, conversion, and enquiry conversion are **⛔ NOT MET / `notTracked`** because timestamped service browsing and enquiry history do not exist.
  - **Profile analytics — ⛔ NOT MET / `notTracked`:** no public profile/search/portfolio/save event source exists; profile views, search appearances, portfolio views/saves, contact rate, and portfolio engagement are intentionally null with reasons, not fabricated zeros. The earlier planned raw Client Enquiries, Service Clicks, and Returning Visitor Rate are not separate response fields and remain NOT MET.
  - **Proposal view/client-response analytics — ⛔ NOT MET / `notTracked`:** current proposal status is not durable timestamped history. `ViewedAt`/client-response event history must exist before period rates can be computed. Module 3's provider response rate is not substituted.
  - **Enquiries and cancellation rate — ⛔ NOT MET / `notTracked`:** no enquiry writer/source-of-truth and no complete cancellation lifecycle/history exist upstream.
  - **Growth observations/tasks — ⚠️ PARTIAL:** the deterministic display-time evaluator, Rule 4, and manual GrowthTask create/list/status/expiry are **✅ MET**. Rules 1–3 are **⛔ NOT MET / `notTracked`-blocked** because their source inputs do not exist. There is no periodic observation-to-task job and no auto-executed action.
  - **Test-record exclusion — ⛔ NOT MET (known platform limitation):** no upstream `IsTest`/environment provenance exists, so analytics includes all records and discloses the limitation in API/UI. No inconsistent Module-5-only field was added.
  - **No AI — ✅ MET:** rule text/actions are fixed deterministic output; no generative call, AI-branded behavior, or AI-executed action was introduced (§2).

**System-wide production release gate — ⛔ NOT MET:** the five modules are implemented, but the backend security/validation findings in §15.2 block production deployment. Frontend containment in `3a19c1e` is verified UX safety and regression coverage—not actor authorization, self-dealing prevention, or server validation.

**System-wide (source "Final System Rule"):** operates as **independent modules** — not phases, no sequential phase completion, and no AI-generated decisions or AI-executed actions. The acceptance flags above are authoritative: a modeled field or enum is not evidence that its producer, UI, external integration, or production-security gate is live.

---

## Appendix A — tooling gotcha (preserve)

The repo's **root `.gitignore` is a binary / non-UTF8 file**, which can make the Grep/ripgrep tool **silently mis-parse ignore rules and skip whole directory subtrees**. During Module 1 this produced a false-negative "`Tier_level` doesn't exist" (a search returned only `backend/tests/` and skipped `Models`/`Services`/`Controllers`), later corrected. **Rule:** any "grep found nothing" for a symbol believed to exist must be double-checked with a **direct file open** or **`git log -S"<symbol>"`** — never conclude absence from a single empty grep.

---

## Changelog

**2026-07-31 — Archived analytics tracking system architecture as canonical reference (§9.4, Phase A–E planned, not yet implemented).** Added full specification for real, event-based tracking system powering per-service and provider-wide Impressions/Clicks/Inquiries metrics: data model (`AnalyticsDailyBuckets`, `AnalyticsSessionSeen` with TTL dedup), write/read/aggregation endpoints, frontend fire-and-forget recording pattern, Analytics workspace UI layout requirements (4 metric cards + chart, canonical empty states), privacy/security design (SHA-256 session hashing, no PII, provider self-view drops, bot/spam rate-limiting), and 5-phase implementation plan. All content marked **[PLANNED]** — nothing is currently implemented. Cross-referenced in §6 (listing detail pages will record events per Phase C) and §9.0 (noting Phase A–E will resolve missing service-view/click/inquiry metrics). Replaces any prior stub content in Module 5 Analytics section.

**2026-07-31 — Checkpoint 2 Part 2: removed tabbed manage-flow entirely (ListingDetail, ListingEditor, CapacityPanel).** Wizard is now the sole edit mode. Old `?service={id}&tab=overview|packages|faqs|capacity` URLs now redirect to `?view=edit&step=1&serviceId={id}`. Backend Capacity endpoints remain active for Profile area and availability control, but Capacity UI is removed pending future re-attachment to Profile & Trust. Design-token migration complete in wizard steps and related editors (all hardcoded hex colors converted to `.sp-workspace` theme tokens). Verification: frontend TypeScript clean; ServicesWorkspace.tsx deletion flow tested syntax-clean; redirect logic verified; no external dependencies on deleted components found.

**2026-07-30 — Service Catalog 6-step creation wizard + gallery/video upload shipped; TagLibSharp integration for server-side duration validation; empty-state copy regression fixed.** Commits `3435450` (gallery/video backend wiring + atomic MongoDB cap enforcement) / `2d0767d` (refactor delete methods to use ProviderMediaFiles.DeleteBestEffort) / `7de669b` (TagLibSharp + video duration validation + empty state text fix) / `6d3d489` (validation test fixtures) on `dev-hafiz`. **New features:** 6-step wizard (§6.0.1) routes `/services?view=new&step=1-6`, originally coexisting with tabbed manage-flow (now removed in Checkpoint 2 Part 2). Step 1 Overview, Step 2 Scope & Pricing, Step 3 Description & FAQ (reuses `FaqBuilder`), Step 4 Client Requirements (applies template to all packages), Step 5 Gallery & Video (new `PreviewVideo` + `GalleryImages[]` fields), Step 6 Review & Publish. Each step auto-saves to a real Draft-status `ServiceListing` (not browser storage). **New fields on `ServiceListing`:** `PreviewVideo` (nullable single embedded record; 60s max, 50MB max; server-determined file reference and duration via TagLibSharp server-side inspection, not client-reported) and `GalleryImages[]` (bounded embedded array, capped at 20 items, 8MB per image, stable UUID id per item, display-order field; matches existing Portfolio max-image convention for consistency). **New gallery/video endpoints:** `POST /listings/{id}/gallery-images` with atomic `$push` + `$size`-filter cap enforcement (21st image rejected via single atomic operation), `DELETE /listings/{id}/gallery-images/{imageId}`, `POST /listings/{id}/preview-video` with server-side duration validation before SaveFile, `DELETE /listings/{id}/preview-video`. All endpoints owner-scoped, using shared `ApiResponse` envelope. Gallery/video deletion reuses existing shared `ProviderMediaFiles.DeleteBestEffort()` helper (immediate delete + Hangfire retry on failure) — no new delete-cleanup implementation introduced. **TagLibSharp (2.3.0):** added to backend dependencies for real server-side video duration inspection (§6.0.1 Dependencies); chosen over FFmpeg-based alternatives to avoid native-binary dependency in Docker deployment. **Regression fixed:** empty-state title "Create your first service" (regressed 2026-07-28 `fd38914`) corrected back to canonical "No Published Services" (§6.9). **"Screens Included" deliberately not built** (unapproved, not-yet-generalized field). **Verification:** backend `dotnet build` 0 errors, 604 backend tests passing (57 skipped, consistent with existing pattern), 222 frontend tests passing; TypeScript clean; no regressions introduced. **Outstanding verification gap (flagged honestly per doc convention):** live authenticated HTTP upload-and-reload verification through actual Step 5 UI not yet performed in a real browser (blocked during this session only by local JWT-key environment setup during automated testing, not a code-quality issue) — this manual browser check should be done before the feature is treated as fully verified end-to-end.**

**2026-07-30 — Service Provider Profile Cover redesign and Portfolio safety remediation shipped (UNCOMMITTED, in working tree).** Profile Cover rule enforced to fixed 1600×400 (4:1 aspect ratio), independent of stored image dimensions — no focal-point metadata, no dimension derivation; unified LinkedIn-style header with SpCard, cover div, avatar overlap, and identity below (§1A.13). Portfolio items now: (1) render with `isOwner` gate — edit/delete/add controls visible **only to provider**, public mode shows read-only list; (2) addressed by stable UUID-based `id` field instead of array index, preventing post-add concurrent races; (3) capped at 20 items (MongoDB BSON protection, §1A.13); (4) client-writable `imagePath` field removed from add/update requests — file URLs are server-determined from SaveFile only. Removal of all hardcoded hex colors from PortfolioSection (converted to theme tokens: foreground, muted-foreground, destructive, border). Converted raw `<img>` to `next/image` with proper alt text and aspect-ratio aspect-ratio (unoptimized flag due to concurrent portfolio workflow). Backend file cleanup is **retry-enabled best-effort** (immediate `File.Delete()` → Hangfire `DeletePortfolioMediaAsync` enqueue on failure, decorated `[AutomaticRetry(Attempts = 2)]`, path-validated, idempotent on missing files) — **explicitly NOT durable/transactional** (MongoDB replica-set transaction support deferred until replica-set Docker test environment available; current system is production-safe for async retry but makes no atomicity guarantees across deletion and record update). New file: `ProviderMediaFiles.cs` (shared `DeleteBestEffort` static helper with path validation and logger). All portfolio endpoints changed from `{index:int}` parameter to `{portfolioItemId}` string (Controller, Service, IService interface, DTO, validator). TanStack Query invalidation on portfolio mutations corrected for stable IDs. Frontend portfolio tests: public-mode button-role regression assertions added (Edit/Delete/Add controls must not render as buttons or links). Cover aspect-ratio tests: all assert 1600 / 400. React 19 `next/image` happy-dom mock fixed (createElement call pattern, drops Next-only props before DOM render). Backend tests: all constructors now inject `Mock.Of<IBackgroundJobClient>()`, `using Hangfire;` added to affected test files. Verification: backend **622 passed / 0 failed / 60 skipped**; frontend **222 passed / 0 failed**; TypeScript clean; ESLint clean.

**2026-07-28 — frontend safety containment and SP regression coverage shipped.** Commit `3a19c1e` on `dev-hafiz` (pushed after `fd38914`); frontend-only, with **0 backend, API-contract, dependency, lockfile, commission-rule, Trust, payment-lifecycle, or review-behavior changes**. Added the shared unsaved-change guard across Profile/portfolio, Catalog listing/package, Proposal, and Financial Settings; HTTP(S)-only validation and safe external-link attributes; availability pending/success/failure/restoration/retry feedback; non-competing Earnings parent/child selection; and Client Brief terminology cleanup. Proposal earnings continue to display the API-provided fixed 12% preview without frontend recomputation. Payment, file-security, and contract-consent mechanisms remain explicitly STUB.

**Frontend-remediation verification:** TypeScript clean; changed-file ESLint **0 errors / 0 warnings**; frontend **126 passed / 0 failed** across 11 files, including **19 new SP scenarios**; production build successful with **107 / 107 routes**; diff check clean. Frontend URL checks are defence-in-depth only, and real-browser navigation/`beforeunload` inspection remains useful. The portal remains **⛔ NOT RELEASE-READY** because the critical/high/medium backend blockers enumerated in §15.2 and §17 are unresolved.

**2026-07-28 — Service Provider UI and integration reconciliation shipped (`fd38914`; no business-model change).** Reconciled the approved responsive redesign across the preserved light-only shell, flat/query-aware navigation, Dashboard, Profile & Trust, Service Catalog, Client Briefs/Pipeline, Active/Completed Projects and Workroom, Earnings/Payouts/Financial Settings, and Analytics & Growth. Documented the real URL-backed views; proposal revision editor and exposed immutable `PreviousVersions`; Workroom client/pause/file/time/review/dispute response enrichments; provider-scoped gross/commission/net/currency aggregates; set-default/remove payout-method endpoints; and enriched read-time Analytics response. The reconciliation introduced no new collection, dependency, lockfile change, frontend commission constant, tier-based commercial rule, AI action, production payment/scanner/e-signature claim, or unsupported frontend-only profile field. Fixed commission remains server-authoritative at **12%**; Tier remains ranking/matching-only; payment, file security, and contract consent remain visibly **STUB**.

**Reconciliation verification:** TypeScript clean; changed-file ESLint clean; frontend **107 passed / 0 failed**; backend **589 passed / 0 failed / 57 skipped** (Analytics targeted **36 passed**); Release backend **0 errors / 16 pre-existing NuGet audit warnings, none from changed SP files**; frontend production build succeeded and generated **107 / 107 routes**; working and staged diff checks clean. Required real-browser inspection at 320/375/768/1024/1440 remains **NOT VERIFIED** in this session because the in-app browser connector exposed no controllable browser; complete that inspection before approving a commit.

**2026-07-27 — SP profile submission now auto-verifies; admin review is moderation-only.** Commit `dc29810` on `dev-hafiz`. Normal onboarding is now `Pending → submit-verification → Verified`, with `VerificationSubmittedAt` and `VerifiedAt` stamped from one UTC value, rejection state cleared, and the derived Trust score recalculated. Submission now enforces the full `IsProfileComplete` predicate—headline, bio, skill, category, industry, language, pricing model, and portfolio item—instead of the former three-field skill/category/portfolio minimum. Admin manual review is no longer an onboarding gate: admin may suspend `Verified → Rejected`, and remediation follows `Rejected → resubmit → UnderReview → admin approve/reject`; there is no separate direct `Verified → UnderReview` endpoint. Verification: SP-focused suite **102 passed / 0 failed / 0 skipped**; full backend suite **577 passed / 0 failed / 57 skipped**; `tsc --noEmit` clean.

**2026-07-27 — Module 5 (Analytics & Growth) shipped → all five SP modules marked LIVE.** Commits `c64aab5` (backend, including the Module-4 shared-calculator amendment) / `18c54e1` (frontend) on `dev-hafiz`. §4.3 adds only `GrowthTasks` to EXISTS and records that metrics/observations remain read-time with no snapshot, event, cache, or export collection. §9 records currency-scoped non-refunded revenue, proposal/completed-work/delivery/client/service-order metrics, historical and `Custom/Unattributed` service attribution, date/comparison filters, computed-at, provider UI/empty states, and manual provider-only GrowthTasks. The private Module-4 repeat-client/on-time formulas moved into `IClientRelationshipCalculator` / `ClientRelationshipCalculator`, now shared by `WorkroomService.RefreshTrust` and Analytics; Module-4 targeted tests remained **25 passed / 0 failed / 0 skipped before and after** extraction.

**Module-5 data-source truth:** profile/search/portfolio/save metrics, date-filtered service counters, enquiries, proposal-view/client-response rates, and cancellation rate are explicit `notTracked` null states—not zeros or bugs—until upstream public browsing/search tracking, timestamped service/enquiry events, durable proposal-event history, and a cancellation lifecycle exist. Only deterministic growth Rule 4 is currently computable; Rules 1–3 report unavailable inputs. Observations are display-time only and never persist tasks; GrowthTask is manual/provider-only. No `IsTest`/environment provenance exists upstream, so all records are included and the limitation is disclosed in API/UI. Verification: build **0 errors / 0 new Module-5/shared-calculator warnings** (16 pre-existing NuGet audit warnings in the final incremental build); suite **575 passed / 0 failed / 57 skipped** (Module 1 **100**, Module 2 **22**, Module 3 **19**, Module 4 **25**, Module 5 **29**); `tsc --noEmit` clean.

**All-five-module rollup:** Profile & Trust, Service Catalog, Leads, Workroom & Earnings, and Analytics & Growth are LIVE. Platform-wide remaining truth: the payment gateway `[STUB — PAYMENT]`, file scanner `[STUB — FILE SECURITY]`, and e-signature/contract-consent mechanism `[STUB — CONTRACT CONSENT]` are not production integrations; public profile/search tracking, durable proposal-event history, and test provenance are deferred. Production Atlas transaction capability still requires the manual pre-deploy check already recorded in §8.0.

**2026-07-27 — Module 4 (Workroom & Earnings) shipped → marked LIVE.** Commits `7e31162` (backend) / `7b6acf7` (frontend) on `dev-hafiz`. §4.3 moves 16 real collections to EXISTS: `WorkroomEngagements`, `Contracts`, `WorkroomMilestones`, `Deliverables`, `RevisionRequests`, `FinancialTransactions`, `Reviews`, `WorkroomTasks`, `ClientInputRequests`, `WorkroomFiles`, `PaymentOperations`, `PayoutRequests`, `Invoices`, `HourlyTimeEntries`, `WorkroomAuditEvents` (the built name, not the earlier `AuditEvents` shorthand), and `RepeatClientCoupons`; `ProviderFinancialSettings` is correctly embedded on `ServiceProviderProfile`, with masked payout methods and tax settings. §8.0/§8.0.1 records exact fields and as-built drift, the immediate Hangfire conversion enqueue + minutely recovery sweeper, unique-`ProposalId` idempotency, atomic proposal/contract/engagement/milestone conversion, and the empty-plan single-milestone fallback. Workroom delivery, versioning, consolidated revisions, pause/extension/dispute/auto-release rules, earnings stages, flat-12% release, invoices/statements/payout records, hourly entries, repeat coupons, audits, provider Workroom/Earnings UI, and four Trust signals are mechanically live. Client Satisfaction, On-time Delivery, Repeat-Client Rate, and 5-points-per-adverse-dispute capped at 20 all route through Module 1's existing `RecalculateTrustScore`; no parallel score writer was introduced.

**Production/integration truth recorded with the Module-4 ship:** `[STUB — PAYMENT]` `StubPaymentGatewayService` moves no money; “funded/released/paid” currently means a mocked success plus Mongo state/ledger changes. `[STUB — FILE SECURITY]` `StubFileSecurityScanner` performs only deterministic empty/20 MB/extension checks, not malware scanning. `[STUB — CONTRACT CONSENT]` contract confirmation is authenticated in-app consent timestamps, not a real e-signature/legal signing provider. `Mongo:TransactionsEnabled=true` is now a hard startup gate with no non-atomic fallback; production Atlas / `srv1172497` transaction capability was not independently verified because sandbox DNS/egress was blocked and requires a manual pre-deploy check. §11 now marks the Leads→Workroom→paid-record→Trust loop mechanically LIVE across Modules 1–4 while flagging STUB money movement and provider-frontend/API-first client scope. §17 marks core mechanics MET/PARTIAL without blanket completion and explicitly marks real payment gateway, real file scanning, real e-signature, and production transaction verification NOT MET. Verification: build **0 errors / 0 warnings**; suite **546 passed / 0 failed / 57 skipped** (Module 1 **100**, Module 2 **22**, Module 3 **19**, Module 4 **25**); `tsc --noEmit` clean.

**2026-07-27 — Module 3 (Leads / Client Acquisition) shipped → marked LIVE.** Commits `d419ed1` (backend) / `4df8122` (frontend) on `dev-hafiz`. §7 now records the three live collections (`ClientBriefs`, `ClientBriefInteractions`, `Proposals`), real field lists, lifecycle-only brief status, provider-relative interaction state, `Currency`/`Industries`, embedded proposal history/purchase snapshots, shared `PlatformCommerceConstants.CommissionRate = 0.12m`, Hangfire soft expiry (no TTL/delete), lazy interaction creation with publish/invitation-receipt response anchors, real 48-hour response rate, unchanged match formula with availability as a hard pre-filter, provider Leads UI/empty states, and the package/manual acceptance paths. Scope stops at `Accepted/AwaitingModule4`; no engagement/contract/workroom milestone is created. §11 updated to a live acquisition/ planned delivery journey; §17 is honestly PARTIAL for missing frontend revise controls, client checkout/payment integrations, special-source/admin flows, planned filters, audit writes, and catalog metric call-sites. Verification: build 0 errors / 0 warnings; suite 519 passed / 0 failed / 57 skipped (Module 3: 19 pass); `tsc --noEmit` clean.

**2026-07-27 — Module 2 (Service Catalog) shipped → marked LIVE.** Commits `533d2e2` (backend) / `36b6f71` (frontend) on `dev-hafiz`. §6 status PLANNED → LIVE with a §6.0 live-vs-deferred block + §6.0.1 as-built field lists (PK is `Id`, not the spec's `ServiceId`/`PackageId`/`FaqId`; category property is `Category`). §4.3: `ServiceListings`/`ServicePackages`/`ServiceFAQs` moved PLANNED → EXISTS (indexes via `EnsureServiceCatalogIndexes()`). §11.2/§11.5: Catalog is now a LIVE, working empty state, not a planned description. §17: Module 2 criteria marked ✅ MET, with **⚠️ PARTIAL** on per-package revisions (config + calc live; window-enforcement / consumption-rule / additional-revision *purchase* deferred to Module 4) and **⛔ auto-accepted proposal deferred to Module 3**. Confirmed-decision fixes recorded: `PricingModel` nullable on `ServicePackage`; `CancellationPolicy` a fixed 3-option enum (not a rule engine). Reusable `RevisionCalculator`/`DeliveryScheduleCalculator`/`PricingGuidance` built + unit-tested but unwired (Module 4 consumes). `CurrentActiveOrders` field + capacity check present, no live writer (Module 4). `Impressions`/`Clicks` fields + record methods present, no call-site (Module 3). Sidebar "Services" → `/dashboard/serviceprovider/services`. Verification: build 0 errors / 0 Module-2 warnings; suite 500 passed / 0 failed / 57 skipped (Module 1 100 pass; Module 2 22 new pass); `tsc --noEmit` clean.

**2026-07-27 — consistency audit: all 9 findings fixed.**
- **D1 (HIGH):** renamed the planned SP `Milestone` → **`WorkroomMilestone`** (collection `"WorkroomMilestones"`) to avoid a class-name collision with `BusinessIdeas.cs:119` (§4.3, §8A); FK fields `milestoneId`/`currentMilestoneId` note added.
- **B1:** dropped the now-dangling **`requirementsTemplateId`** from the Proposal entity (§7) — template is embedded on `ServicePackage`, reached via `packageId`; answers via `requirementsStatus`.
- **A1:** §10 rule 4 "72h brief TTL" → "per-brief `expiresAt` (default 72h, max 30 days) TTL index" to match §7.
- **A2:** disambiguated the two "48h" concepts — the **48-hour client review window** (§8A) vs. the **Due Soon threshold** (`<48h remaining before due date`, §6.3/§8A).
- **D2:** renamed `projectStatus` → **`engagementStatus`** on `WorkroomEngagement` (§8A).
- **D3 (historical, superseded 2026-07-28):** the entity remained `ClientBrief`; the then-current UI retained “Opportunity/Opportunities.” Commit `3a19c1e` later standardized provider-facing references to **Client Brief** while leaving backend names, DTOs, enums, and routes unchanged.
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
