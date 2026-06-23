# Entrepreneur Phase 8 & 9 — Reconciliation Audit (READ-ONLY)

**Date:** 2026-06-10 · **Mode:** AUDIT ONLY — no code changed, nothing implemented.
**Scope:** Entrepreneur **Phase 8** (Investor Matching) + **Phase 9** (Deal Pipeline / Deal Execution).
**Figma:** P8 `21888:10106`, P9 `21888:26506`. **Build:** sandbox can't compile; this is analysis only.
**Data rule for any later implementation:** existing APIs + existing `Companies`/`InvestorMatch`/`DealExecution` Mongo only; honest states for gaps; no fabricated metrics.

> **Figma-read caveat (honest):** Phase 8 was fully read (screen + all sub-frame node IDs below). Phase 9's section (6205×1849) repeatedly timed out on `get_metadata`/`get_design_context` and the Figma MCP socket then dropped — so **the four P9 child-frame node IDs were not captured**, and P9 content was read from a 2400px section screenshot. A few fine-text values (stage-tab counts; 2 term-sheet line-item labels) need a re-zoom. Re-run `get_metadata` per individual P9 frame (select each in-canvas first) when the MCP reconnects. This does not affect the element/gap analysis below, which is grounded in the screenshot + the verified backend contracts.

---

## STEP 2 — Current implementation (what truly exists)

**Phase 8** — `phase-8/page.tsx` (wrapper) + `phase-8/client.tsx` (279L). Route `/dashboard/entrepreneur/phase-8`.
- Sections: dev banner (rule-engine disclaimer); **insights summary** (totalMatches / highScoreMatches / averageScore) + Generate/Re-run; **match cards** (name, type, investment range, preferred round, sectors, rationale, color-coded score) with Save / Accept / Reject + "Log interaction" (view/message/call/proposal_sent/term_sheet); error alert; StepFooter (advance gated on a match score ≥ 40).
- APIs: `getCurrentPhase`, `getInvestorMatches`, `getMatchingInsights`, `regenerateInvestorMatches`, `updateMatchStatus`, `recordInvestorInteraction`, `advancePhase(8)` → `/phase-9`.

**Phase 9** — `phase-9/page.tsx` + `phase-9/client.tsx` (636L). Route `/dashboard/entrepreneur/phase-9`.
- Sections: dev banner; **create deal** (investor select + raise + valuation); **deals list** (status pills); **deal detail** (investor/term-sheet-status/raise + a 12-state status `<select>` + signed-term-sheet upload + Close deal); **due-diligence** (item + category + status); **closing checklist** (add/toggle); **deal documents** (upload); **activity timeline** (event/from→to/notes/timestamp); advance footer (gated on a `signed`/`completed` deal).
- APIs: `getCurrentPhase`, `getInvestorMatches`, `getCompanyDeals`, `getDealActivity`, `createDeal`, `updateDealStatus`, `signTermSheet`, `mutateDueDiligenceItem`, `progressChecklist`, `uploadDealDocument`, `closeDeal`, `advancePhase(9)` → `/phase-10`.
- **No** kanban board, metric cards, term-sheet detail card, or visual timeline — it is a complete **form-driven** state machine.

**Cross-cutting (both):** raw palette colors (`amber-*`, `neutral-1..5`, `green-700`, `red-*`, `primary`); no `htmlFor`/`id` on inputs; raw `<select>`; no `aria-live`/`role`; dev banners disclaim AI; full reload after each mutation.

## STEP 3 — Backend contracts (exact, do NOT assume)
- **Matching:** `InvestorMatchResponse{matchId, investorId, investorName?, matchScore, investorType?, preferredRound?, investmentRange?, preferredSectors[], status, matchRationale?, engineVersion?, matchedAt?, savedAt?, acceptedAt?, rejectedAt?}`. `MatchingInsightsResponse{totalMatches, highScoreMatches, interactionsCount, averageScore, lastMatchedAt?}`. `UpdateMatchStatusRequest.status` (saved|accepted|rejected|viewed|new|passed|interested|reviewing|matched). Outreach: `hasOutreachCampaign`.
- **Deals:** `DealStatus` (12: initiated→…→completed | rejected | withdrawn). `DealStatusResponse{dealId, status, progressPercent, termSheet{totalRaiseAmount, postMoneyValuation, equityType, investorEquityPercent, proRataRights, status:TermSheetStatus, signedAt?}, closingChecklist[{item,completed,owner,dueDate?}], investors[{investorId,investorName,committedAmount,status:ParticipantStatus}]}`. `DealDocumentResponse`, `DealActivityLogResponse{id,dealId,eventType,fromStatus?,toStatus?,actorUserId,occurredAt,notes?}`. `TermSheetStatus`(draft|proposed|negotiating|agreed|signed|rejected), `DueDiligenceStatus`(pending|in_progress|completed|flagged), `ParticipantStatus`(interested|negotiating|committed|funded|withdrawn).
- **Mongo:** `InvestorMatch` collection (Phase 8); `DealExecution`/`Companies.Phase9Models` (Phase 9). Progress: `trustScore/overallProgressPercent/isInvestorReady/completedPhases`.

---

## STEP 4 — Element-by-element reconciliation

### Phase 8 (`21888:10106`)
| Figma element | Existing frontend | Existing backend | Mongo | Status |
|---|---|---|---|---|
| AI Matches stat card (12) | insights number (no card) | `MatchingInsights.totalMatches` | InvestorMatch | **PARTIAL** (data ✓, card visual ✗) |
| Expressions of Interest card (3) | — | no distinct EOI count (`interactionsCount` is generic) | — | **BACKEND GAP** |
| Handshakes Confirmed card (3) | — | no handshake/meeting count | — | **BACKEND GAP** |
| Profile Views card (56) | — | no profile-view analytics | — | **BACKEND GAP** |
| Funding-ask bar (live/round/amount/equity/badge) | — | `FundingProfile.fundingAskAmount/RoundType/equityOfferedPercent` + `isInvestorReady` | Companies | **PARTIAL** (publishedAt = gap) |
| Tabs: All / Interested / Handshakes | — | match `status` field | InvestorMatch | **PARTIAL** (All/Interested ✓; Handshakes state weak) |
| Filters: Stage / Type / Location / Ticket | — | `investorType`, `preferredRound` ✓; location ✗ | InvestorMatch | **PARTIAL** (Location = gap) |
| Investor match card: name/type/score/range/round/sectors/rationale | match list (real) | `InvestorMatchResponse` | InvestorMatch | **PARTIAL** (data ✓ as list; Figma card layout ✗) |
| Investor card: logo / bio / sector-tags / location / meeting date | — | none of these fields | — | **BACKEND GAP** |
| Status chips (HANDSHAKE / ACTION REQUIRED) | status text | `status` enum | InvestorMatch | **PARTIAL** |
| CTAs: Express Interest / View Profile / Prepare / Data Room Access | Save / Accept / Reject / Log interaction | `updateMatchStatus`, `recordInvestorInteraction` | InvestorMatch | **PARTIAL** (Express≈accept; Prepare/meeting = gap) |
| Save / Accept / Reject / Log interaction | ✓ | `updateMatchStatus`, `recordInvestorInteraction` | InvestorMatch | **PASS** |
| Generate / Re-run matching | ✓ | `regenerateInvestorMatches` | InvestorMatch | **PASS** |
| Advance to Phase 9 | ✓ | `advancePhase(8)` | Companies | **PASS** |

### Phase 9 (`21888:26506`)
| Figma element | Existing frontend | Existing backend | Mongo | Status |
|---|---|---|---|---|
| Metric cards: Total Deals / Committed / Round Target / Remaining | — | deals[] + `investors[].committedAmount`; target via `fundingAskAmount` | DealExecution/Companies | **PARTIAL** (data derivable; cards ✗) |
| Round progress bar (committed vs target) | — | derivable (committed ÷ target) | DealExecution/Companies | **PARTIAL** |
| Pipeline stage board (columns by status + counts) | status `<select>` only | `DealStatus` (12) on each deal | DealExecution | **PARTIAL** (data ✓; kanban ✗) |
| Deal card: investor / type / activity note / date | deal pills + detail | `DealStatusResponse` + `DealActivityLogResponse` | DealExecution | **PARTIAL** (data ✓; rich card ✗) |
| Term-sheet detail: equity % / pre-money / post-money | term-sheet status + sign | `termSheet.investorEquityPercent`, `postMoneyValuation`, `totalRaiseAmount`; **pre-money ✗** | DealExecution | **PARTIAL** |
| Term-sheet line items: share class / liq pref / board seat / anti-dilution / closing deadline / expiry | — | **not on `DealStatusResponse.termSheet`** (only on `createDeal` request) | DealExecution | **BACKEND GAP** (read-back) |
| Counter Offer / Accept Term Sheet CTAs | `updateTermSheet`/`signTermSheet` | `updateTermSheet`, `signTermSheet` | DealExecution | **PARTIAL** (data ✓; visual ✗) |
| Matchmaking process timeline (dated milestones) | activity timeline (text) | `DealActivityLogResponse[]` | DealExecution | **PARTIAL** (data ✓; visual stepper ✗) |
| Empty state ("no closed deals … wired") | — | derived (no `funded` deal) | DealExecution | **PARTIAL** (derivable; visual ✗) |
| Due-diligence checklist | ✓ | `mutateDueDiligenceItem` | DealExecution | **PASS** (Figma de-emphasises) |
| Closing checklist | ✓ | `progressChecklist` | DealExecution | **PASS** |
| Deal documents | ✓ | `uploadDealDocument` | DealExecution | **PASS** |
| Create deal / status machine / close / advance | ✓ | `createDeal`/`updateDealStatus`/`closeDeal`/`advancePhase(9)` | DealExecution | **PASS** |
| Investor logos / meetings / term-sheet expiry / activity "X of Y" | — | none of these fields | — | **BACKEND GAP** |

---

## STEP 5 — Gap classification
- **Functional gaps:** essentially none — both phases are functionally complete (matching, deal lifecycle, term sheet, DD, checklist, docs, advance all work end-to-end, backend-authoritative). The Figma "Express Interest / Prepare / Counter Offer / Accept" CTAs map to existing actions (accept/interaction, updateTermSheet/signTermSheet) — wording differs, function exists.
- **Visual gaps (dominant):** P8 — 4 stat cards, funding-ask bar, tabs, filters, the rich investor-card layout. P9 — metric cards, progress bar, **pipeline kanban board**, **term-sheet detail card**, **visual matchmaking timeline**, empty state. Both are form-driven where Figma is dashboard/board-driven.
- **UX gaps:** P8 no tabbed/filtered triage of matches; P9 status change via a raw `<select>` instead of stage columns / drag; no at-a-glance round progress.
- **Accessibility gaps:** no `htmlFor`/`id`, raw `<select>`, no `aria-live`/`role`/progressbar, raw palette colors (also a design-system gap).
- **Backend gaps:** P8 — EOI/handshake/profile-view distinct counts, investor location/bio/logo/sector-tags-as-shown, meeting/calendar, ask publishedAt. P9 — term-sheet read-back of share-class/liq-pref/board-seat/anti-dilution/closing-deadline/**pre-money**/expiry, investor logos, meeting scheduling, activity-log pagination.
- **Code-not-in-Figma (reported):** dev-mode rule-engine banners (correct disclosure); the full DD/closing-checklist/document-upload management UI (richer than Figma's emphasis) — keep.

## STEP 6 — Implementation feasibility (existing backend only)
| Missing element | Now with existing backend? | If NO — what's needed |
|---|---|---|
| P8 AI-Matches/avg-score stat cards | **YES** (`MatchingInsights`) | — |
| P8 EOI / Handshakes / Profile-Views cards | **NO** | distinct counts (EOI, handshake/meeting, profile views) on `MatchingInsightsResponse` |
| P8 funding-ask bar | **YES** (FundingProfile + isInvestorReady) | publishedAt field for the date only |
| P8 status tabs (All/Interested) | **YES** (match `status`) | a dedicated handshake state for the Handshakes tab |
| P8 filters (type/round) | **YES** | investor `location` for the Location filter |
| P8 rich investor card (name/type/score/range/round/sectors/rationale) | **YES** | logo/bio/sector-tags/location/meeting for full parity |
| P9 metric cards + progress bar | **YES** (deals[] + committedAmount + fundingAskAmount target) | — |
| P9 pipeline kanban (group deals by `status`) | **YES** (`DealStatus`) | — |
| P9 term-sheet detail (equity/post-money/raise) | **YES** (partial) | read-back of pre-money + share-class/liq-pref/board-seat/anti-dilution/closing-deadline/expiry on `DealStatusResponse.termSheet` |
| P9 visual matchmaking timeline | **YES** (`DealActivityLogResponse`) | — |
| P9 empty state | **YES** (derived) | — |
| Investor logos / meetings / activity pagination | **NO** | new fields/endpoints |

## STEP 7 — Roadmap

**Completion % (functional):** **P8 ≈ 95%**, **P9 ≈ 95%** — every flow works end-to-end against real backend; only backend-gap data (EOI/handshake counts, term-sheet read-back fields) is absent.
**Figma parity % (visual/layout, current):** **P8 ≈ 40%**, **P9 ≈ 35%** — the dashboards/boards/detail cards/timelines are not built; the screens are functional forms. (Estimated from the Step-4 tables: P8 ≈3/13 PASS + ~6 PARTIAL; P9 ≈4/15 PASS + ~8 PARTIAL.)
**Production readiness % (current):** **P8 ≈ 70%**, **P9 ≈ 72%** — real data, validation, advance-gating, error states work; but raw colors, no a11y, no loading skeleton on P8, and not visually at parity.

**Backend blockers (cannot reach without API work):** EOI/handshake/profile-view counts; investor location/bio/logo/sector-tags/meeting; ask publishedAt; term-sheet read-back of pre-money/share-class/liq-pref/board-seat/anti-dilution/closing-deadline/expiry; activity-log pagination; Phase-8-card "Prepare/meeting" scheduling.

**Frontend-only wins (high value, real data, no backend):**
- P8: stat-card row (totalMatches/highScore/avg from `MatchingInsights`), funding-ask bar (FundingProfile), status tabs + type/round filters, rich investor card from existing fields, tokenize + a11y.
- P9: metric cards + round progress (deals[]/committed/target), **pipeline kanban by grouping deals on `status`**, term-sheet detail from the exposed `termSheet` fields, **visual matchmaking timeline from `DealActivityLogResponse`**, empty state, tokenize + a11y.

**Fastest path to 95% (visual) parity — frontend only:**
1. **Tokenize** both pages (raw → semantic tokens; 0 raw/0 hex) + **a11y** (label/aria/progressbar). *(broad, safe; biggest design-system + a11y jump)*
2. **P9 pipeline kanban** (group `getCompanydeals` by `DealStatus` into stage columns + counts) + **metric cards** + **progress bar** — the marquee P9 visuals, all real data.
3. **P9 term-sheet detail card** (equity/post-money/raise real; remaining line items = honest "Awaiting field" shells) + **visual timeline** from activity log.
4. **P8 stat-card row** + **funding-ask bar** + **rich investor cards** + **tabs/filters** (EOI/handshake/profile-views + location render as honest "Data unavailable" shells).
5. Reuse the established widget kit (`MetricCard`/`StatusRing`/`Chip`/`DataTable`/`SectionCard`/`UnavailableValue`) + a new `PipelineBoard` + `DealTimeline`.

This lands **≈ 85–90% visual parity frontend-only**; the residual to >95% needs the backend-gap fields above. **VERIFIED would require >95% and a local `npm run build`.**

---

# Implementation results (approved pass, 2026-06-10)

**Components created (3):** `deals/PipelineBoard.tsx` (kanban columns grouped by `DealStatus`, progressbar cards), `deals/DealTimeline.tsx` (activity timeline from `DealActivityLogResponse`), `deals/Phase9PipelineVisuals.tsx` (KPI row + round progress + board + term-sheet detail + timeline + empty states). Reuse phase-3 `MetricCard`/`SectionCard`/`Chip`/`UnavailableValue`.

**Files modified (4):** `phase-8/client.tsx` (rewritten to Figma: KPI row + avg-score progressbar, funding-ask banner, status tabs, type/round filters + Location honest shell, rich investor cards with preserved Save/Accept/Reject/Log-interaction/regenerate/advance), `phase-8/page.tsx` (tokenized), `phase-9/client.tsx` (tokenized + mounts `Phase9PipelineVisuals` + `aria-label` on investor/status/DD selects + file input; all deal logic preserved), `phase-9/page.tsx` (tokenized).

**APIs used (real):** P8 `getCurrentPhase`, `getInvestorMatches`, `getMatchingInsights`, `getFundingProfile`, `regenerateInvestorMatches`, `updateMatchStatus`, `recordInvestorInteraction`, `advancePhase`. P9 `getCurrentPhase`, `getCompanyDeals`, `getFundingProfile`, `getDealActivity` (display) + existing `createDeal`/`updateDealStatus`/`signTermSheet`/`mutateDueDiligenceItem`/`progressChecklist`/`uploadDealDocument`/`closeDeal`/`advancePhase` (flow). **Mongo:** `InvestorMatch`, `DealExecution`/`Companies` — read-only via existing endpoints, no schema change.

**Status by element (post-implementation):**
- **P8 PASS/Complete:** KPI cards, avg-score progressbar, funding-ask banner, status tabs, type/round filters, rich investor cards, save/accept/reject/interaction/regenerate/advance, tokens, a11y. **Backend Blocked (honest shells):** EOI/handshake/profile-view distinct counts, investor location/bio/logo/meeting (Location renders "Data unavailable").
- **P9 PASS/Complete:** KPI row, round progress bar, pipeline kanban, deal cards, visual timeline, empty states, tokens, a11y. **Partial:** term-sheet detail (real raise/post-money/equity/type/pro-rata/signed; board-seat/liq-pref/anti-dilution/pre-money/expiry → "Awaiting backend field"). Existing create/status/DD/checklist/doc/close flow preserved.

**Updated completion % (functional):** P8 ≈ 95%, P9 ≈ 95% (unchanged — flows intact).
**Updated Figma parity % (visual):** **P8 ≈ 85–90%**, **P9 ≈ 85–90%** (was 40% / 35%). **NOT VERIFIED** (requires >95% + local build).
**Updated production readiness %:** P8 ≈ 88%, P9 ≈ 88%.
**Remaining backend blockers:** EOI/handshake/profile-view counts; investor location/bio/logo/meeting; ask publishedAt; term-sheet read-back of pre-money/share-class/liq-pref/board-seat/anti-dilution/closing-deadline/expiry; activity-log pagination. **Plus** the unbuilt P9 child-frame node IDs + fine-text re-zoom (Figma MCP socket dropped during audit).
**Build:** static-verified (0 raw/0 hex, real APIs only, 0 fabricated literals, imports/wiring intact, a11y present). Run `npm run build && npm run lint` locally.
