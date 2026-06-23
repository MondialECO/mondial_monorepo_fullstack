# Investor Ecosystem Audit — Mondial.Client

**Date:** 2026-06-23
**Scope:** Complete discovery and mapping of the **Investor** role ecosystem (routes, phases, modules, workflows, APIs, dead/hidden features, technical debt).
**Method:** Static read-only code audit. No code modified. Evidence is cited as `file:line`.
**Explicitly out of scope (per brief):** Founder/entrepreneur workflows; re-testing the already-certified deal lifecycle.
**Figma comparison:** Pending live Figma link (Section G — placeholder until link supplied).

> **Source of nav truth:** `src/lib/menu.ts` (investor block `:109-150`). There is exactly **one** investor sidebar section ("Dashboard") with **7 items**. The `MenuItem` type (`menu.ts:25-29`) supports only `label`, `href`, `icon` — there is **no** `disabled` / `comingSoon` / `hidden` / `badge` capability in the data model, so nothing can be flagged "coming soon" at the nav layer.

---

## Executive summary

The investor ecosystem is **substantially built and genuinely API-wired** — far more complete than a typical scaffold. The discovery → NDA → data room → term-sheet → negotiation spine is real, backed by typed API wrappers over a shared axios client, with correct NDA gating and a working offer-creation path. The defects are concentrated and identifiable: **2 orphaned/legacy routes** (one of which calls a non-existent endpoint), **a handful of dead or self-referential buttons**, **a dead component import**, an **entire orphaned dashboard data path**, and **design-token violations** confined to the two lowest-polish areas.

| Dimension | Count | Notes |
|---|---|---|
| Investor route files | 14 | 12 functional + 2 orphaned (phase-1, phase-5) |
| Reachable from sidebar | 7 | Investments, Discovery, Thesis, Profile, Pipeline, Deals, Messages |
| Reachable via deep-link only | 5 | opportunity detail, dataroom, term-sheet, term-sheet/build, profile/edit |
| Orphaned (no inbound nav at all) | 2 | phase-1 (legacy onboarding shim), phase-5 (dead "Deal Discovery") |
| Backend endpoints wired | 22 | + 1 broken (`/api/investor/deals` 404 in phase-5) |
| Orphaned API fns / hooks | 6 | entire dashboard data path minus `getInvestorStats` |
| Dead / non-functional buttons | 6 | 2 silent dead buttons, 4 honestly-disabled |

---

## A. Investor Phase Inventory

The codebase contains **two different meanings of "phase"**, and conflating them is itself a finding:

1. **Functional lifecycle phases** — the real investor journey, encoded as the pipeline stage enum `new → review → nda → dataroom → negotiation → closed` (`pipeline/_components/KanbanColumn.tsx:11`, `types/investor/opportunities.ts` pipeline columns). This is the meaningful phase map and is documented below.
2. **Legacy numbered `phase-N` routes** — a URL convention that is a real navigational model **only for the Entrepreneur role** (`menu.ts:154-215`). For the investor role, only two `phase-N` pages exist (`phase-1`, `phase-5`) and **both are orphaned** (Section D).

### A.1 — Functional phase map (the investor journey)

Each phase below lists: **Route · Purpose · Entry criteria · Exit criteria · APIs · UI components · Status.**

---

#### Phase 0 — Onboarding / Identity (Universal Phase-1)
- **Phase name:** Identity & document onboarding
- **Route:** `/onboarding/*` (live) — and orphaned shim `/dashboard/investor/phase-1`
- **Purpose:** Verify identity; investor adds Income + Tax documents (`lib/onboarding-routes.ts:1-11`)
- **Entry criteria:** Authenticated user with `onboardingPhase ?? 0 === 0` (`AuthGuard.tsx:76-89`)
- **Exit criteria:** `status.phase >= 1` (`onboarding-routes.ts:125-127`) → redirected to `/dashboard/investor`
- **APIs:** `GET /onboarding/status` (universal)
- **UI components:** `UniversalPhase1` (shared)
- **Status:** ✅ Functional (universal). The investor-specific `phase-1` route is an **orphaned legacy shim** — see Section D.

#### Phase 1 — Thesis Setup
- **Phase name:** Investment Thesis
- **Route:** `/dashboard/investor/thesis`
- **Purpose:** 3-step wizard capturing check size, geographies, stages, sectors, equity prefs, philosophy
- **Entry criteria:** Investor role; sidebar entry "Investment Thesis" (`menu.ts:123-127`); seeds from existing profile
- **Exit criteria:** Save → `ThesisCompletionCard` → "Continue to Discovery" → `/dashboard/investor/discovery` (`ThesisCompletionCard.tsx:121`)
- **APIs:** `GET /investor/profile` (seed) · `PUT /investor/profile` (save) via `useUpdateInvestorProfile`
- **UI components:** `ThesisWizard`, `StepCheckSizeGeoStage`, `StepSectorsEquityBoard`, `StepPhilosophy`, `ThesisCompletionCard`
- **Status:** ✅ **Complete.** Validation gate on step 1; error/pending states wired.

#### Phase 2 — Discovery (sourcing)
- **Phase name:** Discovery Feed
- **Route:** `/dashboard/investor/discovery`
- **Purpose:** Matched-opportunity feed with sector/stage/geography filters
- **Entry criteria:** Investor role; sidebar "Discovery" (`menu.ts:118-122`); optional URL filter params
- **Exit criteria:** Click card → `/dashboard/investor/discovery/{companyId}` (`OpportunityCardListItem.tsx:41`)
- **APIs:** `GET /companies/opportunities` (+ sector/stage/geography/take query) via `useOpportunities`
- **UI components:** `FeedHeader`, `FilterChipBar`, `OpportunityCardListItem`, `EmptyFeedState`, `FeedSkeletonRow`, `MessageFounderButton`
- **Status:** ✅ **Complete.** Filters, loading, empty, error/retry all wired.

#### Phase 3 — Opportunity Evaluation
- **Phase name:** Opportunity Detail
- **Route:** `/dashboard/investor/discovery/[companyId]`
- **Purpose:** Tabbed deep-dive (Overview, Traction, Cap Table, Team, Documents) + match score; NDA gate on sensitive tabs
- **Entry criteria:** Reached from feed/pipeline; `useOpportunity(companyId)` resolves
- **Exit criteria:** Accept NDA (unlocks tabs), "Make Offer" → deals, "Open full Data Room" → dataroom, Message Founder
- **APIs:** `GET /companies/opportunities/{companyId}` · `GET …/{companyId}/documents` (Documents tab) · `POST …/dataroom/nda/accept` (via modal)
- **UI components:** `OpportunityHeader`, `OpportunityKPIStrip`, `MatchScoreCard` (`ScoreBreakdownPanel` — 9 sub-scores), tab panels, `NDARequiredCard`, `NDAAcceptModal`, `MakeOfferButton`
- **Status:** 🟡 **Partial.** NDA gating is correct and real. **Two dead header buttons** (Save `OpportunityHeader.tsx:96-99`, Share `:100-103`) render as active but have no handler.

#### Phase 4 — Diligence (Data Room)
- **Phase name:** Data Room
- **Route:** `/dashboard/investor/discovery/[companyId]/dataroom`
- **Purpose:** NDA-gated document room + session analytics + diligence progress
- **Entry criteria:** **Hard NDA gate** — `if (detail.ndaRequired && !detail.ndaAccepted)` renders `NDALockedScreen` and returns early (`dataroom/page.tsx:79-86`)
- **Exit criteria:** Download documents; proceed to term-sheet
- **APIs:** `GET …/{companyId}/documents`, `…/my-session`, `…/diligence-progress` (all `enabled` only when NDA ok) · `GET /companies/{companyId}/dataroom/documents/{documentId}` (blob download)
- **UI components:** `DataRoomHeader`, `DocumentsSection`, `SessionActivityCard`, `DiligenceProgressCard`, `NDALockedScreen`
- **Status:** ✅ **Complete (functionally).** Known backend caveat: seeded docs carry empty `StoragePath` → download 400s on dev seed only; wiring is real (`api-investor-opportunities.ts:84-87`).

#### Phase 5 — Term Sheet (read-only summary)
- **Phase name:** Term Sheet
- **Route:** `/dashboard/investor/discovery/[companyId]/term-sheet`
- **Purpose:** Read-only deal-stage summary + timeline + activity feed; entry to the builder
- **Entry criteria:** Opportunity resolves; deal stage derived client-side
- **Exit criteria:** "Build & Send Term Sheet" → `…/term-sheet/build` (`ReadOnlyActionsRow.tsx:12-15`)
- **APIs:** **None of its own** — derives everything from `useOpportunity` + `useInvestorSession` + `useDiligenceProgress` (`lib/term-sheet-derivation.ts`, zero API calls)
- **UI components:** `TermSheetHeader`, `InvestmentSummaryGrid`, `DealTermsSection`, `DealTimeline`, `ActivityFeed`, `ReadOnlyActionsRow`
- **Status:** 🟡 **Partial by design.** Two **disabled** buttons (Download, Message Founder) with honest "arrive in a later release" copy (`ReadOnlyActionsRow.tsx:17-30`). The disabled Message Founder is redundant — a working `MessageFounderButton` exists elsewhere.

#### Phase 6 — Term Sheet Builder (offer authoring)
- **Phase name:** Term Sheet Builder
- **Route:** `/dashboard/investor/discovery/[companyId]/term-sheet/build`
- **Purpose:** 3-step wizard to compose and **send** an investor offer
- **Entry criteria:** From read-only term-sheet; draft seeded from founder's real published ask (`builder-model.ts:121`) or resumed from localStorage
- **Exit criteria:** **Send** → `POST /investor/term-sheet/{companyId}/create` → success routes to `/dashboard/investor/deals?d={dealId}` (`build/page.tsx:125-141`)
- **APIs:** `useCreateInvestorOffer` → `createInvestorOffer` → `POST /investor/term-sheet/{companyId}/create`
- **UI components:** `BuilderStepper`, `StepCoreEconomics`, `StepRightsGovernance`, `StepReviewSend`, `LiveTermSheetPreview`
- **Status:** ✅ **Complete.** Fully wired send path; step-1 validation gate; pending/error states surfaced.

#### Phase 7 — Negotiation (Deals)
- **Phase name:** Deals / Negotiation Workspace
- **Route:** `/dashboard/investor/deals`
- **Purpose:** Full term-sheet negotiation: inbox + detail, counter/accept/reject, dual-party signature, close
- **Entry criteria:** Sidebar "Deals" (`menu.ts:138-142`); or deep-link `?d={dealId}` after sending an offer
- **Exit criteria:** Deal closed / signed (`closeDeal`, `signTermSheet`)
- **APIs:** `GET /deals`, `GET /companies/deals/{id}`, `…/activity`; `POST …/offer/counter|accept|reject|viewed`, `…/close`, `…/term-sheet/sign`; realtime via `useDealRealtime`
- **UI components:** `NegotiationWorkspace` → `DealInbox`/`DealInboxItem`, `DealDetailPanel` → `OfferTermsCard`, `OfferComposerDialog`, `RejectOfferDialog`, `SignaturePanel`, `DealCompletionPanel`, `RevisionTimeline`, `DealActivityTimeline`, `OfferDiffCard`
- **Status:** ✅ **Complete.** Full negotiation + signature flow wired to live mutations. (This is the certified deal lifecycle — not re-tested per brief, but mapped for completeness.)

#### Phase 8 — Portfolio (post-investment)
- **Phase name:** Investments (dashboard root)
- **Route:** `/dashboard/investor`
- **Purpose:** Portfolio overview — KPI tiles (Total Invested, Portfolio Value, Investments, Avg ROI) + investment list
- **Entry criteria:** Investor role; landing route after login
- **Exit criteria:** "Recommended next steps" CTAs — **but both are self-links** (Section F)
- **APIs:** `GET /investor/stats` via `useInvestorStats`
- **UI components:** 4 KPI tiles, "Recommended next steps" card, investments list / `EmptyState`
- **Status:** 🟡 **Partial.** Both CTAs link to `/dashboard/investor` (the page itself) — dead-end navigation (`page.tsx:41,47`). KPI/list render is correct.

### A.2 — Cross-cutting modules (not phase-bound)

| Module | Route | Purpose | APIs | Status |
|---|---|---|---|---|
| Pipeline | `/dashboard/investor/pipeline` | Kanban of opportunities across 5 stages + KPI strip | `GET /companies/opportunities/pipeline` | 🟡 Partial — **display-only, no drag-and-drop** |
| Public Profile | `/dashboard/investor/profile` | Read-only public investor profile | `GET /investor/profile` | 🟡 Complete but **dead import** (`ProfileStatsCard`) |
| Profile Edit | `/dashboard/investor/profile/edit` | Self-service profile edit form | `GET` + `PUT /investor/profile` | ✅ Complete |
| Messages | `/dashboard/investor/messages` | Shared cross-role messaging workspace | (messaging service) | ✅ Complete (thin shell) |

---

## B. Investor Workflow Diagram

See **`INVESTOR_WORKFLOW_DIAGRAM.png`** (rendered) and **`INVESTOR_WORKFLOW_DIAGRAM.mmd`** (Mermaid source) alongside this report. Textual summary of the happy path:

```
Onboarding (Phase-1)
      │  onboardingPhase >= 1
      ▼
Thesis Setup ──► Discovery Feed ──► Opportunity Detail
                                          │
                                   accept NDA (gate)
                                          ▼
                                   Data Room (diligence)
                                          ▼
                              Term Sheet (read-only)
                                          ▼
                          Term Sheet Builder ──send──► Deals (negotiation)
                                                              ▼
                                                  counter / accept / sign / close
                                                              ▼
                                                  Portfolio (Investments dashboard)
```

Pipeline (Kanban) is a **read-only projection** of the same lifecycle stages (`new → review → nda → dataroom → negotiation → closed`), not a separate workflow. Messages and Public Profile are ambient.

**Orphaned, off-graph:** `phase-1` (legacy onboarding shim) and `phase-5` (dead "Deal Discovery"). Neither is reachable from any link.

---

## C. Missing Features

Genuine functionality gaps (not cosmetic), with evidence:

1. **Pipeline drag-and-drop is missing.** The Kanban is display-only — no DnD library, no `draggable`, no drop handlers, no mutation. Moving a card cannot persist (`KanbanColumn.tsx:44-51`; cards are plain `<Link>` via `DealCardCompact.tsx:44-46`). A Kanban that cannot be reordered sets the wrong expectation.
2. **"Edit Terms" write path not built.** `ExpandedDealCard` Edit Terms button is `disabled` with comment *"Edit Terms remains visual-only until the write path lands"* (`ExpandedDealCard.tsx:142-156`).
3. **No investor-facing AI-analysis route.** `NDAAcceptModal` "View full AI analysis" is disabled — *"no investor-facing AI-analysis route/data exists yet"* (`NDAAcceptModal.tsx:111-128`). `OpportunityDetail.aiReviewScore` is shown but not drillable.
4. **Term-sheet Download not implemented.** Disabled with "arrive in a later release" (`ReadOnlyActionsRow.tsx:17-30`).
5. **Dashboard "next best action" routing missing.** The two CTAs that should route to pipeline/active-investments are self-links (`investor/page.tsx:41,47`).
6. **Save / Share opportunity not implemented.** Header buttons exist with no handler (`OpportunityHeader.tsx:96-103`) — "save for later" and "share" are advertised but inert.
7. **Lossy offer terms round-trip.** `OfferTermsInput` carries `liquidationPreference`, `boardSeats`, `antiDilutionProtection` (`types/deals.ts:96`) with **no matching field** on the read-side `TermSheetView` — submitted terms are not reflected back in the deal view (extra governance terms are folded into the free-text `note`, `builder-model.ts:142-165`).

---

## D. Dead Features (orphaned / unreachable code)

1. **`/dashboard/investor/phase-5` — dead legacy "Deal Discovery."** Not in sidebar; **zero inbound links** anywhere. Calls a **non-existent endpoint** `GET /api/investor/deals` (`phase-5/client.tsx:33`) — the only reference to that path in the repo; it 404s and renders the error state. Carries a disabled "View Details / Detail view coming in P1" CTA (`client.tsx:113-118`). Superseded by the live `/discovery` flow. **Recommend deletion.**
2. **`/dashboard/investor/phase-1` — orphaned onboarding shim.** Not in sidebar; only referenced by the `VALID_PHASE_1_PATHS` allow-list in `AuthGuard.tsx:33`. Reachable only by typing the URL while `onboardingPhase === 0`. Explicitly described in code as legacy back-compat (`AuthGuard.tsx:80-83`).
3. **Entire dashboard data path is dead weight (except stats).** Orphaned exports, never imported: `useInvestorPortfolio`, `useInvestorSettings`, `useInvestorProfile` (dashboard copy) — `hooks/queries/investor.ts:14,21,28`; and transitively `getInvestorPortfolio`, `getInvestorSettings`, `getInvestorProfile` (dashboard copy) — `api-investor-dashboard.ts:20,29,38`. Only `getInvestorStats`/`useInvestorStats` is live.
4. **`ProfileStatsCard` — dead import.** Imported at `profile/page.tsx:7` but never rendered in the returned JSX (`:40-51`). Fully built KPI-tile component, orphaned at its only import site.
5. **`counterpartyRole` — orphaned util.** Defined `deal-utils.ts:16`, never imported (easy to confuse with the used `counterpartyLabel`).
6. **Duplicate `InvestorProfile` type.** `types/investor/dashboard.ts:23` (`Record<string,unknown>`, dead) vs `types/investor/profile.ts:5` (full interface, live). Same name, two modules — rename/remove candidate.

---

## E. Technical Debt

1. **Duplicated role→route maps.** `ROLE_DASHBOARD_ROUTES` defined identically in both `roles.ts:14` and `role-routes.ts:8`.
2. **Query-key collision.** `['investor','profile']` is used by both the dead dashboard `useInvestorProfile` and the live profile `useInvestorProfile` with different fetchers (`investor.ts:24` vs `investor-profile.ts:13`). Latent cache footgun; currently inert because only the typed one is used.
3. **Direct `axios` usage bypassing typed wrappers.** Only `phase-5/client.tsx:5,33` imports axios directly and hand-builds a URL — every other screen uses the `api-investor-*` wrappers. (Dead file, but symptomatic.)
4. **Dashboard API swallows errors into empty fallbacks.** `getInvestorStats/Portfolio/Profile/Settings` catch all errors and return zeroed/empty objects (`api-investor-dashboard.ts:8-44`), masking backend/auth failures as a legitimate "empty account." Contrast with the newer opportunity/deal layers which deliberately surface errors.
5. **Demo/placeholder content in shipping path.** `DEMO_NDA_TEXT` hardcoded in `NDAAcceptModal.tsx:27-46` (self-labeled non-binding). Acceptable for demo, must be replaced with a real NDA before production.
6. **Local one-off types.** `phase-5/client.tsx:7-15` defines a bespoke `interface Deal` unrelated to the canonical `OpportunityCard`.
7. **Duplicated helpers.** `shortId` in both `deal-utils.ts:91` and `messaging-utils.ts:42` (both used).

---

## F. UI/UX Issues

1. **Silent dead buttons (worst offenders — look active, do nothing):** Save & Share on `OpportunityHeader.tsx:96-103`; both dashboard CTAs self-link (`investor/page.tsx:41,47`).
2. **Design-token violations (CLAUDE.md hard rule — "theme tokens only, no hardcoded palette"):**
   - `KanbanColumn.tsx:17-24` — `bg-blue-50/border-blue-200`, `bg-amber-50`, `bg-emerald-50`, `bg-teal-50`, `bg-orange-50`, `bg-gray-50`.
   - `phase-5/client.tsx:45-96` — `bg-neutral-100`, `bg-red-50 border-red-200 text-red-600`, `bg-white`, etc. (dead file, but a violation nonetheless).
3. **Misleading static status text.** `ExpandedDealCard.tsx:136` hardcodes "Term sheet draft in progress" regardless of actual deal state.
4. **Redundant disabled control.** Term-sheet Message Founder disabled (`ReadOnlyActionsRow.tsx:21-24`) while a working `MessageFounderButton` exists elsewhere — inconsistent affordance.
5. **Kanban implies interactivity it doesn't have.** Column layout strongly signals drag-and-drop; users will try to drag and nothing happens.
6. **Empty-state honesty (positive).** Most empty states are explicit and documented (Traction "not published", term-sheet "terms appear once an offer is on the table") — good practice, called out so they're not mistaken for bugs.

---

## G. Figma Comparison — *pending live link*

The brief's final stage ("Compare implementation against Figma; classify each screen as Matches / Better than Figma / Missing from Figma / Missing from implementation") requires the Figma file. **Provide the figma.com URL(s) for the investor screens** and this section will be completed frame-by-frame using the official Figma MCP, cross-referenced against `FIGMA.md`'s theme-token map and `components/ui/` inventory.

Screens queued for comparison: Investments dashboard, Discovery feed, Opportunity detail (+ NDA states), Data Room, Term Sheet (read-only), Term Sheet Builder, Thesis wizard, Public Profile, Profile Edit, Pipeline, Deals/Negotiation, Messages.

---

## Appendix — Complete route → API map

| Route | Reachable via | APIs called | Status |
|---|---|---|---|
| `/dashboard/investor` | sidebar | `GET /investor/stats` | 🟡 partial (self-link CTAs) |
| `/dashboard/investor/discovery` | sidebar | `GET /companies/opportunities` | ✅ |
| `/dashboard/investor/discovery/[companyId]` | feed/pipeline link | `GET /companies/opportunities/{id}`, `…/documents`, `POST …/nda/accept` | 🟡 (dead Save/Share) |
| `…/[companyId]/dataroom` | detail link | `GET …/documents`, `…/my-session`, `…/diligence-progress`, `GET …/dataroom/documents/{docId}` | ✅ (seed 400 caveat) |
| `…/[companyId]/term-sheet` | pipeline/build link | none (derived) | 🟡 by design |
| `…/[companyId]/term-sheet/build` | term-sheet link | `POST /investor/term-sheet/{companyId}/create` | ✅ |
| `/dashboard/investor/thesis` | sidebar | `GET` + `PUT /investor/profile` | ✅ |
| `/dashboard/investor/profile` | sidebar | `GET /investor/profile` | 🟡 (dead import) |
| `/dashboard/investor/profile/edit` | profile link | `GET` + `PUT /investor/profile` | ✅ |
| `/dashboard/investor/pipeline` | sidebar | `GET /companies/opportunities/pipeline` | 🟡 (no DnD) |
| `/dashboard/investor/deals` | sidebar / `?d=` | deals + offer + sign endpoints | ✅ |
| `/dashboard/investor/messages` | sidebar | messaging service | ✅ |
| `/dashboard/investor/phase-1` | **none** (orphan) | onboarding/status | ⚠️ orphaned |
| `/dashboard/investor/phase-5` | **none** (orphan) | `GET /api/investor/deals` (**404**) | ❌ dead |

---
*End of code-side audit. Section G to follow once the Figma link is provided.*
