# Investor Verification Sprint — Live Journey Audit

**Date:** 2026-06-11 · **Mode:** READ-ONLY (no code changed, no fixes, no implementation)
**Account:** seeded demo investor `demo.investor@mondial.local` (role `Investor`, onboarding `phase 1`, user id `d12e3bba-…`)
**Surfaces exercised live:** Browser (Chrome) + live API (`localhost:5093/api`) + frontend (`localhost:3000`).

### Method & honesty notes (how each claim was grounded)
- **Frontend + API are live and were driven directly.** Every route below was loaded in the real browser; API status codes were read from the network log and by calling endpoints with the live JWT.
- **MongoDB / backend logs were NOT reachable** from the execution sandbox (network-isolated; `host.docker.internal` blocked). Per agreement, **Mongo persistence was verified by proxy**: read-back through the API after a hard refresh, and the fact that a *fresh login* surfaced all seeded state. Where a Mongo-level claim is made, it is corroborated by reading the model/seed source, not by querying the DB.
- **Seeded-account caveat.** The demo investor is pre-onboarded (`phase 1`). Signup and the per-step onboarding screens were therefore verified at **code + API** level, not by a fresh live click-through.
- **No mutations were performed** (no NDA accept, no offer create/counter/sign/close). Write paths are assessed from the seeded state already present plus endpoint/source inspection. This keeps the audit strictly read-only.

---

## 1. Highest phase reached

The investor traverses the **entire built deal funnel end-to-end**:

`Login → Dashboard → Discovery (matched) → Opportunity Detail → NDA gate (locked vs unlocked) → Data Room (list) → Term Sheet (read-only) → Pipeline → Deals/Negotiation → Messages`

- **Highest *fully functional* surface:** **Opportunity Detail + NDA (redesign "Phase 6")** — detail, match score, NDA gating and unlock all work correctly.
- **Highest surface *reached but partial/read-only*:** **Term Sheet (Phase 8, read-only)** and **Pipeline (Phase 9, static)**, plus **Deals/Negotiation** and **Messages**.
- **Where forward progress actually stops for a real user:** the last *write* actions are blocked or absent — **data-room document download 403s**, the **term sheet is read-only** (investor cannot edit/send), and the **realtime negotiation hub is Offline**. So the investor can *see* the whole funnel but cannot *complete* a data-room review or drive an investor-side term sheet from the UI.

Surfaces that **do not exist at all** (so cannot be "reached"): Accreditation (P2), Investment Thesis (P3), Public Profile (P4), Social Feed (P5). Confirmed live: the sidebar is only `Investments · Discovery · Pipeline · Deals · Messages` — no Thesis/Profile destinations.

---

## 2. Every blocker

| # | Blocker | Evidence (live) | Impact |
|---|---------|-----------------|--------|
| B1 | **Data-room document download returns `403 "No data-room access grant for this investor"`** for an NDA-signed investor with view access. | `GET /api/companies/6a259293…fa/dataroom/documents/6a259293…06` → **403**. Root cause read from source: `CompanyService.EnsureDataRoomAccessAsync` requires a founder-issued `DataRoomAccessRecord` keyed to the investor's user id; the seed creates the **NDA acceptance** (`Phase6NdaAcceptances`) but **never the access grant**, and there is **no investor-initiated path** to obtain one (only the owner can call `POST …/dataroom/access`). | Data Room is effectively view-list-only. Downloads, and even view/download **tracking**, all 403 → Session Activity is permanently `Views 0 / Downloads 0 / Last access Never`. |
| B2 | **Investor cannot create/edit/send a term sheet from the term-sheet route.** | `…/term-sheet` renders the read-only `ReadOnlyActionsRow` ("Investor-side editing arrives in a later release"); Download/Message/Edit are disabled. The only working create path is `deals/OfferComposerDialog` → `POST /api/investor/term-sheet/{companyId}/create`. | The designed Term Sheet *Builder* (Phase 8) does not exist; the route is a preview. |
| B3 | **Realtime negotiation hub is Offline.** | Deals page header shows **"Offline"** while Messages shows **"Live"** — the chat hub connects, the deal/negotiation hub does not. | Live counter-offer / negotiation updates don't stream; relates to `FIX_03_signalr_realtime.md` / `FIX_06_chathub_authprovider_scope.md`. |
| B4 | **`PUT /api/investor/profile` does not exist.** | No such route in `InvestorPhaseController` (only `GET` stats/portfolio/profile/settings). | Blocks all of Phase 3 (Thesis) and Phase 4 (Public Profile) self-write — exactly the blueprint's B-1. |
| B5 | **Portfolio analytics are not data-backed.** | Dashboard: Total Invested `$0`, Portfolio Value `$0`, ROI `0.0%` with "2 investments". Pipeline: Capital Committed `€0`, **MOIC `0.00x` labelled "demo placeholder"**. | No MOIC/IRR/DPI/valuation server-side; Portfolio Snapshot (P9) cannot be rendered honestly. |

---

## 3. Every bug (functional + data + display)

| # | Bug | Evidence |
|---|-----|----------|
| G1 | **Term sheet shows fabricated legal terms not backed by the deal.** The read-only term sheet displays *"Governing law: France · Jurisdiction: Paris Commercial Court"*, instrument type, governance and "key conditions". | The live deal payload has **`termSheet.governingLaw` = ABSENT** and **`termSheet.jurisdiction` = ABSENT** (verified via API). These strings are client-side **derived placeholders** (`term-sheet-derivation.ts` fake-terms helpers), presented as if real. |
| G2 | **Activity feed claims "data room access granted"** on the Rousseau deal, but downloads 403 (B1). | Term-sheet activity text: *"NDA signed and data room access granted"* — contradicts the actual access-grant state. Misleading. |
| G3 | **Counterparty names unresolved in Deals and Messages.** | Deals list renders **"Founder · 2916"**, **"Founder · 6CD1"** (raw last-4 of the deal id). Messages renders **"Entrepreneur · FEB5"**, **"Entrepreneur · 75B1"**. Real founder/company names are not joined. |
| G4 | **Opportunity valuation data inconsistency.** | NovaPay detail shows **Pre-Money €8M and Post-Money €8M** (identical) with a €1.2M ask — post-money should exceed pre-money by the raise. (Rousseau is consistent: €2.4M → €2.85M.) |
| G5 | **Pipeline stage logic places a deal in "Negotiation" without an NDA.** | NovaPay appears in the **Negotiation** column with a €1.2M offer, yet its Opportunity Detail shows **"NDA Required"** (not signed). A deal in negotiation without a signed NDA is internally inconsistent. |
| G6 | **Portfolio "Your Investments" shows "by Unknown founder".** | Dashboard investment rows (`PAT API Test Idea`, `PAT Audit Test Idea`) render `by Unknown founder`, `$0`, `0% equity` — founder/amount/equity not resolved. |
| G7 | **Equity figure differs across surfaces for the same NovaPay deal.** | Detail "Equity Offered 15.00%" vs Pipeline expanded card "Equity 15.00%" vs Deals list "16.6%" — the deals list uses a different (post-money) derivation, creating a visible mismatch. |

> Not a bug: a one-off **renderer freeze / screenshot timeout** occurred on `/login` and the animation-heavy `/term-sheet` page. `/login` serves **HTTP 200** with a full document and rendered fine on retry; term-sheet content was confirmed via DOM text. These were tooling/capture hiccups, **not** application errors (no console errors observed). Flagged only so it isn't mistaken for a route failure.

---

## 4. Every missing endpoint (frontend expects / design needs, backend lacks)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `PUT /api/investor/profile` | **MISSING** | Blueprint B-1. No investor self-write for profile/thesis. (`PUT /api/investors/{id}` exists but is Admin-scoped.) |
| Data-room **access self-grant** for investor | **MISSING** | Only owner-side `POST …/dataroom/access` exists; no path for an NDA-signed investor to obtain the grant that downloads require (cause of B1). |
| Traction KPI read on opportunity detail | **MISSING** | Detail payload has **no `traction` object**; Traction tab renders client placeholders. |
| Portfolio analytics (MOIC/IRR/DPI/valuation) | **MISSING** | `GET /api/investor/stats` returns zeros; no analytics source (B5). |
| AI analysis / AI next-best-action | **MISSING** | No endpoint behind the designed Data-Room AI panel / Pipeline nudge. |
| Accreditation review-workflow + Social/Feed APIs | **MISSING** | Entire P2 accreditation state machine and P5 feed subsystem absent. |

All other journey endpoints **exist and returned 200 live**: `/auth/me`, `/onboarding/status`, `/investor/stats|portfolio|profile|settings`, `/companies/opportunities(+/{id}, /documents, /my-session, /diligence-progress, /pipeline)`, `/companies/{id}/dataroom/nda/accept`, `/companies/deals/{id}(+/activity)`, `/investor/term-sheet/{id}/create`, `/companies/deals/{id}/offer/(counter|accept|reject|viewed)`, `/term-sheet/sign`, `/close`, `/chat/conversations`, `/notification`.

---

## 5. Every API mismatch (frontend ↔ backend contract)

- **No URL/verb mismatches found in the live funnel.** Every call the app made returned 200 (`/auth/me`, `/investor/stats`, `/companies/opportunities*`, `/companies/deals*`, `/chat/conversations`, `/notification?skip=0&limit=30`).
- **Corrected a false positive:** a prior backend scan suggested notifications were `/api/notifications` (plural) vs the frontend's `/notification`. **Verified against source:** `NotificationController` is `[Route("api/[controller]")]` → **`/api/notification`** (singular), and the live call `GET /api/notification?skip=0&limit=30` returned **200**. **No mismatch.**
- **Response-envelope shape (not a mismatch, but a contract note):** auth/profile responses wrap payloads as `{ success, message, data }` while some list endpoints return bare arrays/objects. Any new investor hooks must unwrap `.data` consistently.
- **Projection mismatch (read vs model):** `GET /api/investor/profile` returns a **sparse** projection — it **drops** `RequiresProRataRights`, `RequiresBoardSeat`, `PreferredEquityTypes`, `SuccessfulExits`, `CompletedDeals`, `ActiveInvestments`, `AverageCheckSize` that exist on the `Investor` model (blueprint B-2). The Thesis/Profile UI will read fields the endpoint currently omits.

---

## 6. Every Mongo mismatch (model ↔ design/blueprint needs)

Verified against `Investor.cs`, `DealExecution.cs`/`TermSheet`, `OfferDtos.cs` (source) and corroborated live where the field surfaces through the API.

**`investors` collection — MISSING fields** (blueprint B-3): `TargetReturnMultiple`, `FollowOnPolicy`, `ThesisStatement`, `PreferredRole`, `BoardParticipationLevel`, `Headline`, `CoverImageUrl`, `SocialLinks`, `IsPublic`.
**Present (so thesis form can partly build today):** `PreferredSectors`, `PreferredStages`, `Min/MaxCheckSize`, `PreferredGeographies`, `RequiresProRataRights`, `RequiresBoardSeat`, `PreferredEquityTypes`, `SuccessfulExits`, `AverageCheckSize`, `CompletedDeals`, `ActiveInvestments`, `ProfileScore`.

**`dealExecutions.termSheet` (embedded) — MISSING fields** (blueprint B-4): `GoverningLaw`, `Jurisdiction`, typed `Rofr`, `CoSale`. **Confirmed live ABSENT** in the Rousseau deal payload. `ProposedClosingDate` **exists**.

**`OfferTermsRequest` DTO — MISSING fields** (blueprint B-5): `GoverningLaw`, `Jurisdiction`, `ProposedClosingDate` — so the builder cannot persist closing/legal terms through create/counter.

No collection renames or removed fields detected; all blueprint Mongo changes are additive (schemaless, no migration needed).

---

## 7. Every broken route

**None of the in-nav investor routes are broken.** All loaded and rendered with 200 backing calls:

| Route | Result |
|-------|--------|
| `/dashboard/investor` | ✅ renders; `/investor/stats` 200 |
| `/dashboard/investor/discovery` | ✅ renders; `/companies/opportunities` 200; 4 matched deals |
| `/dashboard/investor/discovery/{id}` | ✅ renders (locked & unlocked variants) |
| `/dashboard/investor/discovery/{id}/dataroom` | ✅ renders list; **download path 403 (B1)** |
| `/dashboard/investor/discovery/{id}/term-sheet` | ✅ renders **read-only**; fabricated legal terms (G1) |
| `/dashboard/investor/pipeline` | ✅ renders Kanban |
| `/dashboard/investor/deals` | ✅ renders; realtime **Offline** (B3) |
| `/dashboard/investor/messages` | ✅ renders; realtime **Live** |

**Route guards — all correct live:**
- No token → protected route ⇒ **redirect to `/login`** ✅
- Investor → `/dashboard/entrepreneur` ⇒ **redirect to `/dashboard/investor`** ✅
- Completed investor → `/onboarding` ⇒ **redirect to `/dashboard/investor`** ✅
- (Incomplete-onboarding ⇒ `/onboarding`: verified at code level only; seeded account is `phase 1`.)

**Legacy/orphan routes still present (not in nav, not broken):** `investor/phase-1` (KYC gateway, reached via guard redirect — acceptable) and `investor/phase-5` (legacy raw-axios deal stub hitting the deprecated `/investor/deals`).

**Persistence — verified:**
- *Refresh:* hard-reload of a deep route (`…/discovery/{id}`) held the path (no login bounce), token persisted, and `ndaAccepted` re-read **true** from a fresh fetch.
- *Mongo (by proxy):* the initial **fresh login** surfaced all seeded state (NDA signed, 2 deals, pipeline columns, diligence 2/4) — i.e. login/logout persistence holds because all journey state is server-side and re-read on a new session.

---

## 8. Every dead / orphan / stub component

| Component | State | Recommendation (blueprint-aligned) |
|-----------|-------|-------------------------------------|
| `…/term-sheet/_components/ReadOnlyActionsRow.tsx` | **Dead-ish** — rendered, but all buttons disabled. | Delete when the builder ships (blueprint §10). |
| `src/app/dashboard/investor/phase-5/page.tsx` + `client.tsx` | **Orphan legacy stub** (not in nav; disabled "View Details"; calls deprecated `/investor/deals`). | Delete (blueprint §10). |
| Fake-terms helpers in `src/lib/term-sheet-derivation.ts` (`instrumentForRound`, `investorRightsForRound`, `governanceForRound`, `KEY_CONDITIONS`) | **Actively misleading** — they produce G1's fabricated legal terms shown live. | Delete; keep only `deriveDealStage`/`STAGE_LABEL` (blueprint §10). |
| Fake-data bindings in `InvestmentSummaryGrid.tsx` / `DealTermsSection.tsx` | Render derived placeholders as real offer terms. | Repurpose into a real-deal-bound preview (blueprint §10). |
| `InvestorProfile` / `InvestorSettings` types = `Record<string,unknown>` | **Stub types** (not yet consumed by a built page). | Replace with real shapes when Thesis/Profile land. |

No genuinely *unreferenced* components were found beyond the above intentional stubs.

---

## 9. Production readiness %

Two readings, to avoid a single misleading number:

- **Against the full redesigned investor vision (Phases 2–9): ~35%.** Half the designed surfaces (Accreditation, Thesis, Public Profile, Feed) **do not exist** — confirmed live (no nav, no routes). Matches the prior reconciliation audit.
- **The currently-built deal-funnel slice on its own (Discovery → Detail → NDA → Data Room → Term Sheet → Pipeline → Deals/Messages): ~65% production-ready.** It browses and reads cleanly, but the **live walk lowered the prior ~70% estimate** because of runtime blockers the static audit didn't catch: data-room download 403 (B1), fabricated term-sheet legals (G1), negotiation realtime Offline (B3), unresolved counterparty names (G3/G6), and €0 portfolio analytics (B5).

---

## 10. VERIFIED readiness %

**~60%** — the share of the investor journey I confirmed **working live, end-to-end, with real API + persistence**:

**Verified working (live):** login + JWT, all four route guards, onboarding gating + status API, dashboard/stats, discovery + match scoring, opportunity detail (locked & unlocked), NDA gating + unlock + persistence, data-room **listing** + diligence/session reads, term-sheet **read-only** view, pipeline Kanban, deals listing, messages (Live), refresh + Mongo-proxy persistence.

**NOT verified / could not be confirmed live (excluded from the 60%):**
- Fresh **signup** click-through and per-step **onboarding** verification screens (used a pre-onboarded seeded account).
- Any **write/mutation**: NDA accept, offer create/counter/accept/reject, term-sheet sign, deal close (no mutations performed, by design).
- **Data-room download** (actively 403 — verified *broken*, not working).
- **Realtime negotiation** streaming (hub Offline).
- Direct **MongoDB** field-level inspection and **backend logs** (sandbox network-isolated; persistence shown by API proxy only).

---

## 11. Exact fixes required before implementing the blueprint

**Must-fix (unblock the existing funnel; the blueprint largely doesn't cover these):**
1. **Data-room access grant (B1).** Decide the policy: either auto-create a `DataRoomAccessRecord` (download level) when NDA is accepted, or add an investor-reachable grant path, **and** seed the grant for the demo investor. Until then, the Data Room download/viewer cannot be demoed or built on. Also fix the misleading "data room access granted" activity copy (G2).
2. **Remove fabricated term-sheet legals (G1)** before/while building the Phase 8 builder — the route currently presents invented governing-law/jurisdiction/instrument as real. This is the §10 "delete fake-terms helpers" item and is now confirmed user-visible.
3. **Negotiation realtime (B3).** Investigate why the deal hub is Offline while chat is Live (see `FIX_03`/`FIX_06`).
4. **Counterparty name resolution (G3/G6)** in Deals, Messages, and dashboard investments ("Founder · 2916", "Unknown founder").
5. **Data sanity (G4/G5/G7):** NovaPay pre=post €8M; a deal in "Negotiation" with no NDA; equity % differing across surfaces.

**Blueprint-prerequisite backend (do first, as the blueprint says):**
6. **`PUT /api/investor/profile`** (B-1) + **expand the `GET` projection** (B-2).
7. **Add `Investor` fields** (B-3) and **`TermSheet` fields** `GoverningLaw`/`Jurisdiction`/`Rofr`/`CoSale` (B-4), and **extend `OfferTermsRequest`** with `GoverningLaw`/`Jurisdiction`/`ProposedClosingDate` (B-5). All confirmed missing live.

**Hygiene (read-only-safe deletions):** remove `phase-5/*`, `ReadOnlyActionsRow`, and the fake-terms helpers (blueprint §10).

---

## 12. Is the Final Investor Blueprint still correct?

**Yes — the blueprint (`INVESTOR_BUILD_PLAN_FINAL.md`) is accurate and still valid for its scope (Phases 3, 4, 6, 8).** The live walk independently confirms every premise it rests on:
- Phase 3 (Thesis) and Phase 4 (Public Profile) genuinely don't exist (no nav/routes). ✔
- `PUT /api/investor/profile` is missing; `GET /investor/profile` is a sparse projection. ✔ (B-1/B-2)
- `Investor` B-3 fields and `TermSheet`/`OfferTermsRequest` B-4/B-5 fields are missing — confirmed at the live-data level (`governingLaw`/`jurisdiction` ABSENT in the deal payload). ✔
- The Term Sheet route is read-only with derived fake terms; `ReadOnlyActionsRow`, `phase-5`, and the fake-terms helpers exist and should be deleted (§10). ✔

**Adjustments to make before/with implementation (the blueprint is correct but incomplete on live runtime realities):**
- **Add the §11 must-fix items** above — especially the **data-room download 403** and **negotiation Offline**, which sit just outside the blueprint's 3/4/6/8 scope but block the funnel the blueprint builds on top of. The Phase 8 builder in particular should not ship while the route still renders fabricated legal terms.
- **Correct one onboarding assumption:** the live `onboarding/status` shows **income/tax are `required:false`** for investors (only the core-4 identity/face/phone/email are required). Any Thesis/Accreditation work that assumes investors must upload income/tax docs is mistaken — onboarding is the universal core-4.
- **Sequencing still holds:** Step 0 backend (B-1…B-5) remains the right first move; it unblocks Phases 3/4 and the Phase 8 builder exactly as written.

---

*Audit only. No code modified, no fixes applied, no implementation performed. Mongo/log claims corroborated via API read-back + source; all route/API/guard/persistence claims verified live in-browser.*
