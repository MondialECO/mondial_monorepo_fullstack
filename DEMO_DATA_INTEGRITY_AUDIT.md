# Mondial Eco — Demo Data Integrity Audit

**Role:** Senior Platform Auditor
**Date:** 2026-06-08
**Scope:** Seeded/demo data integrity only. No application-code fixes, no feature work. Fixes 01–06 assumed complete.
**Method:** Static analysis of the seed pipeline (`backend/Extensions/SeedingExtensions.cs`), seed JSON (`backend/Configuration/SeedData/*.json`), data models (`backend/Models/DatabaseModels/**`), and the read paths that consume seeded data (`InvestorPhaseController`, `CompanyService`, `ServiceProviderService`, `MessagesRepository`, `AiCreditSeeder`, `Program.cs`). No code modified.

> **Reading note on “drift.”** Two DB states exist. A **clean re-seed** (drop the `MondialEcoInvestorDemo` database, restart) produces an internally coherent dataset for almost every view. A **re-seed over a partially-persisted DB** (Identity `ApplicationUsers` survives but `Investors`/other collections were dropped) produces the documented FIX-05 drift. Findings below say which state they apply to.

---

## SECTION A — Summary

The seed pipeline is well-structured and idempotent, and on a **clean re-seed** the investor pipeline board (the demo’s hero view) is fully coherent: 5 companies, 5 matches, 3 NDAs, data-room docs + access logs on Rousseau/Veris, and one deal — each company lands in exactly one distinct pipeline column as intended.

However the audit found **two P0 issues that block the investor green-path demo**, plus several P1/P2 gaps where a seeded surface is empty or a reference is dangling.

| Sev | Finding |
|-----|---------|
| **P0** | Investor catalogue-link **drift is not self-healing** — `InvestorProfile.InvestorId` can dangle; breaks investor profile + “Send Offer” (the FIX-05 root cause). |
| **P0** | **Deal Discovery is empty** — seeded companies are `CurrentPhase = 7`, but discovery requires `CurrentPhase >= 8`, even though they are `IsInvestorReady = true`. |
| **P1** | **Service provider is an empty shell** — no `ServiceProviderProfile` seeded → not in admin verification queue, `TrustScore = 0`, no portfolio. |
| **P1** | **No demo Admin user** — only the `Admin` role is seeded; the admin verification-queue demo cannot be logged into. |
| **P2** | **Notifications collection not seeded** — notification bell list is empty (unread-message badge works separately). |
| **P2** | **`users` vs `ApplicationUsers` collection split** — `AiCreditSeeder`/onboarding backfill target an empty `users` collection. Dormant under default demo config. |
| **P2** | **Cap table doesn’t reconcile** — hardcoded equity rows sum to 950,000 shares vs `TotalShares = 1,000,000`. |
| **P2** | Orphaned access-log `documentId` (Veris synthetic); 4 of 5 data-room docs are metadata-only (download fails); AI sessions not seeded. |

**Verdict:** Do not deploy the demo from a re-used DB. A clean re-seed plus the P0/P1 fixes in Section M is required for a reliable end-to-end investor demo.

---

## SECTION B — Users

Seeded by `SeedDemoUsersAsync` / `GetOrCreateDemoUserAsync` / `SeedDemoEntrepreneurAsync` / `SeedDemoServiceProviderAsync`. IDs are runtime-generated `Guid`s (Identity), so they are reported by email, not literal id.

| Email | Role | Onboarding phase | Verification state | Profile linkage |
|-------|------|------------------|--------------------|-----------------|
| `demo.creator@mondial.local` | Creator | Phase 1 (all KYC flags true, `CompletedAt` set) | Email/Phone/ID/Face all `true` | `CreatorProfile` default; owns seeded ideas |
| `demo.investor@mondial.local` | Investor | Phase 1 complete | all `true` | `InvestorProfile.InvestorId` → stub `Investors` row (**drift-prone**, see D) |
| `demo.entrepreneur@mondial.local` | Entrepreneur | Phase 1 complete | all `true` | owns 5 seeded `Companies` |
| `demo.provider@mondial.local` | ServiceProvider | Phase 1 complete | KYC all `true` | `ServiceProviderProfile` **default/empty** — `Pending`, `TrustScore 0` (see F) |
| *(none)* | Admin | — | — | **No admin user seeded** (role exists only) — see Section F/L |

Password for all demo users: `DemoP@ss1`. All four users share `EmailConfirmed = true` and a pre-completed Phase-1 `Onboarding` block so dashboards unlock without an OTP walkthrough.

Findings: **B-1 (P1)** no Admin demo account. **B-2 (info)** the live Identity collection is `ApplicationUsers` (controllers + the FIX-05 live test confirm reads resolve); the `users` collection referenced elsewhere is a separate, empty collection (see Section J / K-6).

---

## SECTION C — Creator Data

Seeded by `SeedBusinessIdeasAsync` from `business-ideas.json` (4 ideas) and `SeedInvestmentsAsync`.

* **Ideas / business ideas:** 4 — *GridPulse — Smart City Energy Grid*, *Halia — Wearable Health Monitoring*, *Lexion — Compliance Copilot for SMBs*, *Verda — Carbon-Negative Packaging*. All `Status = Approved`, `IsPublished = true`. `CreatorId` set to the demo creator’s Guid at insert. ✔ ownership consistent.
* **Creator profile:** default `CreatorProfile` (no extra seeding). ✔ no broken refs.
* **AI sessions / AI credits:** the creator receives a **100-credit `AICredits` ledger** (`SeedDemoAiCreditsAsync`). **No** clarifier/business-plan/forecast sessions are seeded — AI Studio history starts empty (see Section J).

Reference check: ideas → creator ✔. Investments link the demo **investor** to the **first 3 ideas** (GridPulse/Halia/Lexion) at 20% of ask. `Investments.IdeaId` → seeded idea ✔; `Investments.InvestorId` = investor **user Guid** (intentional — see D / K). No orphaned creator records.

---

## SECTION D — Investor Data (incl. FIX-05 drift)

Seeded by `SeedInvestorsAsync` (catalogue from `investors.json`, 10 rows, all `IsActive`, `ProfileScore 70–97`, `LinkedUserId = null`) + a **stub `Investor` row** created for the demo investor user via `IInvestorService.CreateInvestorAsync` (type `angel`, score 60). Total catalogue = **11 rows**.

* **Investor profile:** `InvestorProfile.InvestorId` → the stub row’s id. `GetProfile` resolves the catalogue row and returns `linked = true` — **only when the row exists**.
* **Investor catalogue row:** present after a clean seed.
* **investorId linkage:** ✔ on clean seed.
* **Discovery eligibility:** **BROKEN** — see Section A / E. `GetDealDiscovery` filters `CurrentPhase >= 8`; seeded companies are at 7 → discovery returns **0** companies regardless of linkage.
* **Pipeline visibility:** ✔ on clean seed — `GetInvestorPipelineAsync` filters `InvestorMatches.InvestorId == InvestorProfile.InvestorId` (the catalogue id). 5 matches seeded with that id.
* **Deal visibility:** ✔ on clean seed — `DealExecution.Investors[].InvestorId` = catalogue id; one deal on Rousseau.

### FIX-05 drift — investigated, status: **VALID (real, reproducible)**

**Evidence (code-proven):**
1. `SeedInvestorsAsync` short-circuits if the `Investors` collection has any rows (`L92`). 
2. `SeedDemoUsersAsync` links the investor **only if `InvestorProfile.InvestorId` is empty** (`L153`); it never validates that an already-set id still resolves to a live `Investors` row, and `GetOrCreateDemoUserAsync` returns the pre-existing user untouched (`L194`).
3. Net effect: if Identity (`ApplicationUsers`) persists across a re-seed while the `Investors` collection is dropped/reseeded independently, the investor keeps a **dangling `InvestorId`**. The seeder cannot self-heal.

**Downstream impact of the dangling id:**
* `GetProfile` → catalogue lookup throws `KeyNotFoundException`, surfaced as `linked = false` (graceful, but profile shows unlinked).
* `CreateInvestorOfferAsync` validates `investorId` against the `Investors` collection → **400 `"investorId '…' does not match any investor"`** (the exact FIX-05 symptom; the empty `catch{}` that FIX-05 removed had been masking it).
* Pipeline board: **survives** the drift (it filters `InvestorMatches` by the id string; the seeded matches still carry the old id), so the board renders but the “Send Offer” action fails — an inconsistent demo state.

**Note — FIX-05 mis-attribution:** FIX-05 stated the drift “also empties the demo investor’s Discovery.” That is not the mechanism. Discovery is empty because of the **`CurrentPhase >= 8` gate vs seeded phase 7** (Section A/E), which is independent of investor linkage. Both must be fixed to demo the green-path offer flow end-to-end.

---

## SECTION E — Entrepreneur Data

Seeded by `SeedDemoCompaniesAsync` from `companies.json` (5 companies) + match/NDA/data-room/access/deal steps.

* **Companies (5):** Atomica Ventures, NovaPay Labs, Helio Solar, Veris Health, Rousseau Technologies SAS. All `OwnerId` = demo entrepreneur Guid ✔, `VerificationStatus = verified`, `VerifiedBadge = true`, `IsInvestorReady = true`.
* **Ownership:** ✔ all 5 owned by the demo entrepreneur.
* **Phase progress:** `CurrentPhase = 7`, `CompletedPhases = {1,2,3,4,5,6}`. ⚠ **Inconsistent**: companies carry Phase-8 artifacts (`InvestorMatches`) and `IsInvestorReady = true`, yet `CurrentPhase = 7` and phase 7 itself is not in `CompletedPhases`. This is the root of the empty-discovery P0 (E-1).
* **Cap table:** `EquityStructure` is **hardcoded** for all 5 companies: Founder 600,000 + Co-Founder 250,000 + ESOP 100,000 = **950,000**. But `TotalShares = 1,000,000` from JSON. ⚠ **50,000 shares (5%) unaccounted** — cap-table summary (shown post-NDA via `OpportunityCapTableSummaryDto`) will not reconcile to 100% (E-2, P2). `EsopPoolPercent = 10` is internally consistent with the 100,000 ESOP row.
* **Data room:** seeded **only on Rousseau** (`IsDataRoomLive = true`, `IsDataRoomNdaRequired = true`, 5 documents). Only *Pitch Deck v3* has a real `StoragePath` (a minimal valid PDF written to disk); the other 4 are **metadata-only** (`StoragePath = ""`) → downloads fail for them (E-3, P2, intentional MVP).
* **Investor matches:** 5 (one per company) — see D / I.
* **Deals:** 1 on Rousseau — see I.

Reference check: companies → entrepreneur ✔; matches/NDA/access/deal → company ids ✔.

---

## SECTION F — Provider Data

Seeded by `SeedDemoServiceProviderAsync` → `GetOrCreateDemoUserAsync` only. **No provider-profile content is seeded.**

* **Service provider account:** ✔ exists (`demo.provider@mondial.local`, role `ServiceProvider`, Phase-1 onboarding complete).
* **Service provider profile:** **default/empty** `ServiceProviderProfile` — `ProviderId = null`, `CurrentPhase = 1`, `Headline/Bio = null`, empty `Skills/ServiceCategories/Industries/Languages/PortfolioItems/PricingModels`.
* **Verification state:** `Pending`, `VerificationSubmittedAt = null`. ⚠ **The admin verification queue (`GetPendingVerificationsAsync`) lists only `UnderReview` providers** → the seeded provider **does not appear** in the queue. The “service provider verification queue” demo (commit `fc33549`) renders **empty** (F-1, P1).
* **Trust score:** `0` (baseline `50` is only set on approval). 
* **Portfolio:** empty.

Net: the provider exists purely as a chat counterpart (Section G works). Any demo of the provider profile, verification queue, or trust score has no data behind it.

---

## SECTION G — Messaging

Seeded by `SeedDemoConversationsAsync` / `SeedConversationAsync`. Writes directly to `Conversations` + `ChatMessages` (the same collections the live repos use).

* **Conversations (3), all `Type = Direct`:**
  1. Creator ↔ Investor (GridPulse interest) — 5 messages.
  2. Entrepreneur ↔ Investor (Rousseau deal, €450K @ €2.4M pre) — 4 messages.
  3. Entrepreneur ↔ Service Provider (term-sheet review) — 4 messages.
* **Participants:** `List<Guid>` of two real seeded users each ✔. **No orphaned conversations** — every participant id resolves to a seeded user.
* **Unread counts:** the last message in each thread is `IsRead = false`; unread is computed as `SenderId != me && !IsRead`. Verified each thread’s final sender is the *opposite* party, so exactly the intended recipient sees +1 unread (creator, investor, entrepreneur respectively). ✔ correct, no false unread for senders.
* **Last-message pointers:** `LastMessage` / `LastMessageAt` updated to the final message ✔.

Cross-references resolve; messaging seed is **clean**. (Content references—GridPulse idea, Rousseau data room, €450K/€2.4M deal—all correspond to actually-seeded entities ✔.)

---

## SECTION H — Notifications

* **Notification ownership / unread state / references:** **No `Notifications` documents are seeded anywhere** (no insert in `SeedingExtensions` or `Program.cs`).
* **Broken references:** none — because there are zero rows.
* **Impact:** the notification **bell list** is empty at boot. The **message unread badge** is unaffected (it derives from `ChatMessages`, which are seeded, Section G). If the demo shows the bell’s notification feed it will have nothing (H-1, P2).

---

## SECTION I — Deals

Seeded by `SeedDealExecutionAsync` (1 deal) + `SeedInvestorMatchesAsync` (5 matches).

* **Deal record:** 1 `DealExecution` on **Rousseau**, `Status = "initiated"`, full `TermSheet` (raise €450K, pre €2.4M, post €2.85M, 15.78% preferred), 4-item due-diligence checklist, `CreatedByUserId` = investor user Guid.
* **Participants:** `Investors[0].InvestorId` = catalogue `InvestorId` ✔ (matches pipeline/deal-visibility key).
* **Company references:** `CompanyId` → Rousseau ✔.
* **Negotiation state:** `TermSheet.Status = "draft"`, deal `initiated` → places Rousseau in the **Negotiation** column ✔.
* **Orphaned deals:** none.

Pipeline column derivation verified end-to-end (most-advanced-state-wins): Atomica→NewMatches, NovaPay→InReview, Helio→NdaSigned, Veris→DataRoom, Rousseau→Negotiation — one card per column, matching each row’s `PipelineColumn` intent. ✔

---

## SECTION J — AI

* **AI credit ledgers:** seeded via `SeedDemoAiCreditsAsync` for **creator, investor, entrepreneur** (100 credits each), using the same idempotent `TryGrantInitialAsync` as production. ⚠ **Service provider is NOT granted a ledger** (J-1, P2 — harmless; provider doesn’t use AI Studio).
* **Clarifier sessions / business plans / forecasts:** **none seeded.** Created only at runtime via `BusinessPlanController` etc. AI Studio history is empty on boot; the seeded conversation’s “generated an updated plan in AI Studio” line has **no backing `BusinessPlanSession`** (J-2, P2 — cosmetic).
* **Ownership/linkage consistency:** the seeded ledgers key on `user.Id.ToString()` ✔, consistent with `AiCreditLedgerRepository`.
* **⚠ Collection-name hazard (J-3, see K-6):** the *bulk* starter-credit backfill `AiCreditSeeder.GrantStarterCreditsAsync` reads `GetCollection<ApplicationUser>("users")` — a **different, empty** collection from the live `ApplicationUsers`. The demo’s per-user grant path bypasses this, so it is **dormant under default config** (`GrantStarterCreditsToExisting = false`), but if enabled it would silently grant **0** credits.

---

## SECTION K — Broken / Inconsistent References (matrix)

| # | Source | Reference | Target | State | Severity |
|---|--------|-----------|--------|-------|----------|
| K-1 | `ApplicationUser.InvestorProfile.InvestorId` (demo investor) | id string | `Investors` row | **Dangles** after re-seed over persisted Identity; never self-heals | **P0** |
| K-2 | `Companies.CurrentPhase = 7` | phase gate | `GetDealDiscovery` requires `>= 8` | **Mismatch** → discovery empty despite `IsInvestorReady = true` | **P0** |
| K-3 | `ServiceProviderProfile` (demo provider) | verification queue | `GetPendingVerificationsAsync` (UnderReview only) | Provider `Pending`/unsubmitted → **absent from queue** | **P1** |
| K-4 | Admin role | login account | demo Admin user | **No admin user seeded** | **P1** |
| K-5 | `Companies.EquityStructure` (×5) | share total | `Companies.TotalShares` | 950,000 ≠ 1,000,000 (5% gap) | **P2** |
| K-6 | `AiCreditSeeder` / `Program` onboarding backfill | `GetCollection("users")` | live `ApplicationUsers` | **Wrong collection** (empty); dormant by default | **P2** (latent P1) |
| K-7 | `Phase6AccessLog` (Veris) | `DocumentId` | a `DataRoomDocument` | **Synthetic id → no such document** (deliberate) | **P2** |
| K-8 | Rousseau data-room docs (4 of 5) | `StoragePath = ""` | file on disk | Download fails (metadata-only MVP) | **P2** |
| K-9 | `Notifications` | — | — | **No rows seeded**; bell feed empty | **P2** |
| — | `Investments.InvestorId` = user Guid | (not catalogue id) | — | **Valid by design** (pipeline summary reads by caller user Guid; see CompanyService L2970–2979). Documented for clarity, **not a defect**. | info |

---

## SECTION L — Demo Risks

1. **Re-used database = guaranteed FIX-05 drift (P0).** The single biggest risk. Re-seeding over the existing `MondialEcoInvestorDemo` DB leaves the investor un-linked and breaks “Send Offer.” The seeder will *not* repair it.
2. **Investor green-path is doubly blocked (P0).** Even with a fresh link, the company can’t be reached via Discovery (phase-7 vs ≥8). The pipeline board works, but the “browse → open company → make offer” path does not.
3. **Provider & admin demos have no data (P1).** Empty verification queue, no admin login, trust score 0. Any provider/admin walkthrough will look broken.
4. **Empty notification feed (P2)** may read as a bug on stage if the bell is opened.
5. **Cap-table numbers don’t add up (P2)** — a sharp-eyed investor-side viewer may notice 95% allocated.
6. **Latent credit-seeder collection bug (P2/P1)** — safe today only because the demo path avoids it; a config change re-arms it.

---

## SECTION M — Recommended Fixes (audit-only; do not implement here)

**P0 — must fix before demo**

* **M-1 (K-1): Make the investor link self-healing.** In `SeedDemoUsersAsync`, when `InvestorProfile.InvestorId` is non-empty, **validate it resolves** to a live `Investors` row; if not, re-create the stub and re-link. *Operational alternative for the demo:* always deploy from a **clean re-seed** (drop `MondialEcoInvestorDemo`, restart) — never re-seed over a persisted DB.
* **M-2 (K-2): Make seeded companies discoverable.** Set seeded `CurrentPhase = 8` (or 9) and add 7 (and 8) to `CompletedPhases`, so phase, `IsInvestorReady`, and the existing `InvestorMatches` agree and `GetDealDiscovery` returns them. (Data-only change in `SeedDemoCompaniesAsync`.)

**P1 — strongly recommended**

* **M-3 (K-3): Seed the provider into a demoable state.** Populate `ServiceProviderProfile` (ProviderId, Headline/Bio, Skills, ServiceCategories, a portfolio item) and set `VerificationStatus = UnderReview` with `VerificationSubmittedAt` so it appears in the admin queue — or `Verified` with `TrustScore = 50` if the demo shows a verified provider. Pick per the demo script.
* **M-4 (K-4): Seed a demo Admin user** (e.g. `demo.admin@mondial.local`, role `Admin`, Phase-1 complete) so the verification queue / admin dashboards can be logged into.

**P2 — polish / latent**

* **M-5 (K-5):** Reconcile the cap table — either set `TotalShares = 950000` or add a 50,000-share row (e.g. option pool / angel) so `EquityStructure` sums to `TotalShares`.
* **M-6 (K-6):** Point `AiCreditSeeder` and the `Program.cs` onboarding backfill at the live `ApplicationUsers` collection (or inject `MongoDbContext.ApplicationUsers`) so they aren’t silent no-ops; fix the test accordingly. (Code change — flagged for the dev team, out of audit scope.)
* **M-7 (K-9 / H-1):** Seed a handful of `Notifications` for the demo users (match/NDA/offer/message events) so the bell feed isn’t empty.
* **M-8 (J-2):** Optionally seed one `ClarifierSession` + `BusinessPlanSession` + `ForecastSession` for the creator so AI Studio shows history consistent with the seeded chat.
* **M-9 (K-7/K-8):** Either give the remaining Rousseau docs real `StoragePath`s (so any document downloads) or ensure the demo only clicks *Pitch Deck v3*; drop the synthetic Veris access-log `DocumentId` or back it with a real doc.

---

*End of audit. No code was modified. Recommendations are for a follow-up implementation pass.*
