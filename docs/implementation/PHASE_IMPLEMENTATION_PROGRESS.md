# Phase Implementation Progress — Living Tracker

**Purpose:** maintained record of every role-phase audit + implementation. Update the relevant row whenever a phase is audited or built. Read-only audits do NOT change phase status to "in progress."
**Legend — Status:** `Not Started` · `Audited` · `In Progress` · `Implemented` · `Verified`. **Audit Result:** `PASS` · `PARTIAL` · `BLOCKED`.

---

## Entrepreneur

### Phase 2 — Company Verification & Dashboard
| Field | Value |
|---|---|
| **Phase Number** | Entrepreneur Phase 2 |
| **Current Status** | Audited (implemented in code; not yet Figma-parity) |
| **Audit Date** | 2026-06-10 |
| **Figma Link** | [Phase 2 section](https://www.figma.com/design/5oHxoppTAyS4zb2DfUdYwy/Mondial-Dashboard-Working-after-restored?node-id=21509-38694&m=dev) · node `21509:38694` (6 screens: 2.1–2.5 + Dashboard) |
| **Frontend Status** | **Partial** — 4 wizard steps + index implemented (`phase-2/page` + `step-1..4`); covers Figma 2.1, 2.2, (2.3+2.4 merged into step-3), 2.5. **Dashboard overview is a 9-line redirect stub** (Figma dashboard not built). Figma has 5 wizard screens; code has 4. |
| **Backend Status** | **Mostly complete** — `CompanyController`: `createCompany`, `legal`, `documents`, `beneficial-owners`, `phase/{n}`, `current-phase`, `progress`, `documents` (GET). **Gaps:** no SUMSUB/identity-verification endpoint for owners; no certificate generation/download; dashboard aggregation (AI mentor, expense table) unconfirmed. |
| **Mongo Status** | **OK** — `Companies` collection (denormalized; legal info, documents, beneficial owners embedded; `nationality` field supported but FE doesn't send it). No schema change needed for the implemented steps. |
| **Audit Result** | **PARTIAL** — functional flow works end-to-end (backend-authoritative); **Figma visual/layout/UX parity NOT met**; one Figma screen (Dashboard) effectively missing; one wizard screen folded. |
| **Blockers** | (1) SUMSUB biometric / identity verification is postponed → Figma 2.3/2.4 KYC CTA has no backend. (2) Certificate download (2.5) has no backend. (3) Dashboard overview aggregation (expense table, AI mentor) source unclear. (4) Universal Phase-1 completion needed to reach Phase 2 with a fresh account for live testing. |
| **Notes** | Detailed gap report: `PHASE_2_RECONCILIATION_AUDIT.md`. Design-token debt: 41 raw Tailwind palette colors in phase-2 UI (0 hex). Code adds a left ProgressSidebar that Figma wizard screens (2.1–2.5) do **not** have; conversely the Figma Dashboard's 264px sidebar shell is unbuilt. Code Step 3 collects **email** where Figma collects **nationality**. Doc set differs (code: KBIS/Articles/License/Tax; Figma: KBIS/RIB/Tax/Insurance). |

### Phases 3–9  (screen-level audited 2026-06-10 — see `ENTREPRENEUR_PHASE_3-9_RECONCILIATION_AUDIT.md`)
**Headline:** all functionally implemented + backend-authoritative (NOT stubs). Gaps are **Figma visual/layout parity + zero realtime/notifications + a11y (no aria-live) + raw-color tokens**, not function.

| Phase | Status (functional / Figma) | Audit Date | Result | Key gaps / Notes |
|---|---|---|---|---|
| 3 — Financial Verification & Tracking | Full / **full 3.1+3.2+3.3 visual pass done** | 2026-06-10 | PARTIAL — high visual parity; data completeness capped by backend gaps | **Figma 3.1 (step-1)** + **full 3.2 KPI Tracker + 3.3 Valuation built** as `Phase3FinancialDashboard` (+ `FinancialWidgets`): real `getFinancialSummary`/`getKpiBaseline`/`getMonthlyRevenue`/`getCurrentPhase`/`calculateValuation`; metric cards, status ring, quarterly chart, valuation breakdown + business-health tables, Recalculate, integration banner. **Every backend-gap element rendered with honest "Data unavailable / Awaiting integration / Not yet configured" — NONE faked** (NPS, burn, multiplier+breakdown, integrations, composites). Tokens (0 raw/0 hex), success/warning/destructive chips, hover/loading/empty, `role`/`aria`/`progressbar`, + **3.3 4-step Verification Progress rail** (`VerificationProgressRail`, real-derived states). **Visual/layout/interaction/a11y parity ≈88–90%**; residual = pixel spacing + Inter-vs-Geist font (global config). step-2 = Figma **Phase 4** drift. See `PHASE_3_CONTINUATION_REPORT.md`. |
| 4 — Equity & Cap Table | Full / **Overview view + visuals built** | 2026-06-10 | PARTIAL (impl ~85–90% visual; not VERIFIED) | **Built P4.1 Overview** (`Phase4Overview`): real metric tiles (issued/pre-money/founder%/ESOP), **ownership donut**, **cap-table list**, **dilution cards + founder journey** from `getLatestCapTableSnapshot`/`getFundingProfile`/`getOwnershipHistory`. **Tokenized all 3 steps + landing** (0 raw/0 hex). Reusable `EquityWidgets`. Remaining: per-step label/select a11y; ESOP slider + benchmark shell; export; History timeline view. Backend gaps (shell+honest): share-class-per-entry/cliff/acceleration/authorized-shares/benchmark/audit-log. See `ENTREPRENEUR_PHASE_4-5_RECONCILIATION_AUDIT.md`. |
| 5 — Equity wizard / Funding ask | Full / **funding visuals built** | 2026-06-10 | PARTIAL (impl ~85–90% visual; not VERIFIED) | **Built P5 visuals** (`Phase5FundingVisuals`): funding-ask tiles + **allocation donut**, **dilution cards/journey**, **cap-table finalization preview**, **readiness** (trust/progress/verification) from real `getFundingProfile`/`getLatestCapTableSnapshot`/`getOwnershipHistory`/`getCurrentPhase`. Tokenized `client.tsx`+landing (0 raw/0 hex), added `htmlFor`/`id`+`aria` on controls. Remaining: runway/burn shells, existing-investors step, completion screen. Backend gaps: runway/burn, AI pre-screening, company fields. See reconciliation doc. |
| 6 — Data Room | Full / **visuals built ~88–92%** | 2026-06-10 | PARTIAL (impl; not VERIFIED) | **Built `Phase6DataRoomVisuals`**: stat cards, published-docs **readiness ring** (real ratio), **category accordion**, access-control rail (NDA real; email/expiry honest shells), **manage-access table** from `getDataRoom`/`getDataRoomAnalytics`. Tokenized page (0 raw/0 hex) + `aria-label` on all controls. Remaining: completion screen; richer doc status chips (Backend Blocked: only draft/published). See `PHASE_6_7_RECONCILIATION_AUDIT.md` + `docs/figma/ENTREPRENEUR_PHASE_6_7_FIGMA_REFERENCE.md`. |
| 7 — AI Expert Review | Full / **visuals built ~88–92%** | 2026-06-10 | PARTIAL (impl; not VERIFIED) | **Built `Phase7ReviewVisuals`**: **score ring**, stat cards, **stage-breakdown progressbars**, AI-recommendations, badge card, pitch-deck honest shell, history from `getAiReview`/`getAiReviewHistory`. Tokenized page (0 raw/0 hex), removed duplicated recs block, kept Run+gating. Backend Blocked: pitch-deck sub-scores/grade, missing-docs count, social-proof. Remaining: badge-claimed completion screen. See reconciliation + Figma reference docs. |
| 8 — Investor Matching | Full / **Figma layout built ~85–90%** | 2026-06-10 | PARTIAL (impl; not VERIFIED) | **Rewrote client to Figma**: KPI row (`MatchingInsights`) + avg-score progressbar, **funding-ask banner** (`FundingProfile`+isInvestorReady), **status tabs** (All/Interested/Accepted/Saved/Rejected), **filters** (type/round real; Location honest "Data unavailable"), **rich investor cards** (name/score/type/round/range/sectors/rationale + honest logo/bio/location shells) with Save/Accept/Reject/Log-interaction preserved. Tokens 0 raw/0 hex, a11y (tablist/progressbar/labelled selects). Backend Blocked: EOI/handshake/profile-view counts, location/bio/logo/meeting. See `PHASE_8_9_RECONCILIATION_AUDIT.md`. |
| 9 — Deal Pipeline / Execution | Full / **Figma layout built ~85–90%** | 2026-06-10 | PARTIAL (impl; not VERIFIED) | **Built `Phase9PipelineVisuals`** (+ `PipelineBoard`, `DealTimeline`): KPI row + **round progress bar**, **kanban board** (group deals by `DealStatus`), deal cards (investor/status/committed/progress), **term-sheet detail** (real raise/post-money/equity/type/pro-rata; missing board-seat/liq-pref/anti-dilution/pre-money/expiry → "Awaiting backend field"), **visual timeline** (`DealActivityLogResponse`), empty states. Mounted in client; tokens 0 raw/0 hex; a11y (progressbar/labelled controls). Deal logic preserved. See reconciliation doc. |
| 10 — Journey Complete | Full / near-parity | 2026-06-10 | PASS-ish | Terminal page; minor celebration polish |

**Cross-cutting (all phases 3–9):** no realtime/notifications wired (doc requires 6 events; Figma shows live states); no `aria-live`/`role` on async/error/empty; raw Tailwind palette colors throughout; `/dashboard/entrepreneur` must become the Figma Dashboard Overview (product decision) + aggregation. Build order & roadmap in `ENTREPRENEUR_PHASE_3-9_RECONCILIATION_AUDIT.md`.

### Dashboard Overview — `/dashboard/entrepreneur` (main dashboard, per product decision)
| Field | Value |
|---|---|
| **Current Status** | **Implemented (Figma-wired body), pending build verification** — Steps 1–6 + 8 done; Step 7 nav-groups done (upgrade-card/user-footer deferred). Was: phase-launcher hub. |
| **Audit Date** | 2026-06-10 |
| **Figma Link** | node `21509:39132` (Dashboard Overview) |
| **Frontend Status** | `overview.tsx` (299L) = hero (trust+progress) + "next action" + 9-phase grid + info card. **No API calls.** Figma's stat cards / capital allocation / funding progress / AI mentor / expense table / investor+deal metrics are **all MISSING**. |
| **Backend Status** | Data mostly EXISTS (`getFundingProfile`, `calculateValuation`, `getMatchingInsights`, `getCompanyDeals`, `getAiReview` recommendations, real `Companies.TrustScore`). **One gap:** no company-scoped expense endpoint (`TransactionController` is user-scoped/generic). |
| **Mongo Status** | OK (`Companies`, `InvestorMatch`, `DealExecution`, `Notification`); `Transactions` exists but needs expense shape for the table. |
| **Audit Result** | **PARTIAL → near-complete (finalized 2026-06-10)** — real-data widgets + **hero progress ring**, **funds-raised mini cards**, **hiring-priorities card**, **resource-allocation panel** (real `resourceMap.techTools`/`serviceProviders`), **KPI typography bump** (text-4xl), and an **investor-insights honest shell**. All additive, real APIs, 0 raw/0 hex, a11y (`role=progressbar`). Parity ≈ **Completion 90% · Figma parity ~82% · Production ~85%**. **Only remaining gap = the expense table itself (needs a company-scoped expense backend endpoint)** + pixel/font polish. See `ENTREPRENEUR_DASHBOARD_PARITY_AUDIT.md`. |
| **Blockers** | (1) Trust score reads fake hardcoded data, not backend `TrustScore`. (2) Expense table needs a company-scoped backend endpoint. (3) "6/12" (Figma) vs "/9 phases" (code) count reconciliation. (4) Phase-1 completion to load real company data. |
| **Notes** | Full blueprint: `ENTREPRENEUR_DASHBOARD_RECONCILIATION_AUDIT.md`. Build order: fix fake data first → stat/KPI row → funding/allocation → AI mentor → activity → expense table (+backend) → sidebar/hero shell → tokens/a11y. Almost entirely a **wiring + UI** effort reusing existing APIs. |

### Completion screens (Figma P5/P6/P7) — BUILT 2026-06-10
`PhaseCompletionScreen` (shared) + routes `/phase-{5,6,7}/complete`. Real data (`getCurrentPhase` trust/progress + `getFundingProfile`/`getDataRoom`/`getAiReview`); honest states for backend-gap items (runway, AI pre-screening, priority listing). Wired: each phase's `advancePhase` success → `/phase-N/complete` → "Continue" → next phase. Tokens (0 raw/0 hex), a11y (`role`/`aria`/`aria-current`), real progress stepper. Phase 10 Journey Complete already existed. Closes the orphan-Figma-screen gap from the journey audit.

## Other roles (placeholder — audit later)
| Role | Phase | Status | Audit Result |
|---|---|---|---|
| Creator | 1 (onboarding), 2 Idea Discovery … 8 Crossroads | Not Started | — |
| Investor | 1 … 10 (Discovery→Tracking) | Not Started | — |
| Service Provider | 1–2 built; 3–10 (catalog→reviews) | Not Started | — |
| Admin | overview, provider-verification | Not Started | — |

---

### Row template (copy for each future phase audit)
```
| Phase Number | <role> Phase <n> |
| Current Status | Not Started / Audited / In Progress / Implemented / Verified |
| Audit Date | YYYY-MM-DD |
| Figma Link | <url> · node <id> |
| Frontend Status | <what exists / gaps> |
| Backend Status | <endpoints / gaps> |
| Mongo Status | <collections / schema notes> |
| Audit Result | PASS / PARTIAL / BLOCKED |
| Blockers | <list> |
| Notes | <link to detailed report + key findings> |
```
