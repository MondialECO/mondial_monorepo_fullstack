# Entrepreneur Phase 6 & 7 — Reconciliation Audit + Implementation

**Date:** 2026-06-10 · **Scope:** Entrepreneur **Phase 6** (Data Room) + **Phase 7** (AI Expert Review) ONLY.
**Figma:** P6 `21760:9075`, P7 `21799:10856` (+ subs `21760:9084`, `21795:10047`). Full reference: `docs/figma/ENTREPRENEUR_PHASE_6_7_FIGMA_REFERENCE.md`.
**Build:** sandbox can't run `next build`/`tsc` → static verification; run `npm run build && npm run lint` locally.
**Data rule:** existing APIs + existing `Companies` Mongo only; backend-gap elements get a visual shell + honest state. No fabricated metrics.

Gap legend: **F**unctional · **V**isual · **UX** · **A11y** · **B**ackend.

## Contracts in scope (existing — unchanged)
- **P6 APIs:** `getDataRoom`, `getDataRoomAnalytics`, `uploadDataRoomDocument`, `grantDataRoomAccess`, `revokeDataRoomAccess`, `updateNdaRequirement`, `publishDataRoom`, `downloadDataRoomDocument`, `trackDataRoomView/Download`, `getDataRoomActivityTimeline`, `acceptDataRoomNda`, `advancePhase`.
- **P7 APIs:** `getAiReview`, `getAiReviewHistory`, `runAiReview`, `enqueueAiReview`, `advancePhase`.
- **Types:** `DataRoomStatusResponse{isLive,ndaRequired,totalDocuments,documents[DataRoomDocumentResponse],accessGrants[DataRoomAccessGrant]}`, `DataRoomAnalyticsResponse{totalViews,totalDownloads,uniqueInvestorsEngaged,documentEngagement[],investorEngagement[]}`, `AiReviewResponse{overallScore,scoreBreakdown{verification/financial/equity/funding/dataRoom/overall},investorReadyBadge,recommendations[],reviewedAt}`, `AiReviewHistoryEntry[]`.
- **Mongo:** `Companies` (embedded data-room + Phase7 models). No schema change.

---

## PHASE 6 — Data Room

### P6.1 Main data room (`21760:9075`)
| Gap | Detail |
|---|---|
| **V** | Code was form-only (upload/grant/list). Figma = stat cards + readiness donut + **category accordion** + access-control rail + **manage-access investor list**. |
| **F** | Counts/sizes/views/grants all real (`getDataRoom`/`getDataRoomAnalytics`). |
| **UX** | No at-a-glance readiness, no grouped accordion. |
| **A11y** | Raw `<select>`/file/inputs were unlabelled. |
| **B** | Doc status Verified/Pending/Re-upload (only draft/published); auto-populated flag; "/16" & "1.2 TB" quotas; required-docs definition list; email-alert + access-expiry settings; per-investor role. |

### P6.2 Completion screen
| Gap | Detail |
|---|---|
| **V/F** | Not built (code does `router.push('/phase-7')`). Figma = celebration + score + unlock checklist + stepper. |
| **B** | "Visible to 2,400+ investors", "Top 15%" social-proof. |

## PHASE 7 — AI Expert Review

### P7.1 Review dashboard (`21760:9084`)
| Gap | Detail |
|---|---|
| **V** | Code was plain KPI boxes. Figma = **score ring**, stat cards, **stage-progress bars**, AI-recommendation cards, pitch-deck-analysis bars, badge card. |
| **F** | Score/breakdown/recommendations/badge all real (`getAiReview`). |
| **UX** | No ring/bars; recommendations lacked priority emphasis. |
| **A11y** | No progressbar roles / aria-live. |
| **B** | **Pitch-deck grade B+ + 4 sub-scores** (no field); "Missing documents" count (partial); "Top 5%" social-proof. |

### P7.2 Badge-claimed completion (`21795:10047`)
| Gap | Detail |
|---|---|
| **V/F** | Not built. Figma = badge-active celebration + Phase-8 preview + stepper. |
| **B** | Phase-8 matchmaking data (pre-screened count, named investors, match %). |

### Code-not-in-Figma (reported)
- P7 **dev-mode rules-engine banner** (honest disclosure that LLM review is pending) — keep; not in Figma but correct for current backend.
- P6/P7 functional **upload/grant/run/submit** controls — required for the real flow; Figma shows the populated state only.

---

## Implementation results (this pass)

**Components created (2):**
- `src/components/entrepreneur/dataroom/Phase6DataRoomVisuals.tsx` — stat cards, **published-docs readiness ring** (real ratio, not the Figma-mock 70%), **category accordion** (native `<details>`), access-control rail (NDA real; email/expiry honest "Not yet configured"), **manage-access table**.
- `src/components/entrepreneur/dataroom/Phase7ReviewVisuals.tsx` — stat cards, **score ring**, **stage-breakdown bars** (`role=progressbar`), badge card, AI-recommendations list, **pitch-deck-analysis honest shell**, review history.
(Reuse phase-3 `MetricCard`/`StatusRing`/`Chip`/`SectionCard`/`UnavailableValue`.)

**Files modified (2):** `phase-6/page.tsx` (tokenized → semantic tokens; mounts `Phase6DataRoomVisuals` replacing the plain stats card; `aria-label` on title/category/file/investor/level/days controls); `phase-7/page.tsx` (tokenized; mounts `Phase7ReviewVisuals`; removed the duplicated recommendations block; kept Run-review + submit gating).

**APIs used (real):** P6 `getCurrentPhase`,`getDataRoom`,`getDataRoomAnalytics` (display) + existing `uploadDataRoomDocument`/`grant`/`revoke`/`updateNdaRequirement`/`publishDataRoom`/`download`/`trackDownload`/`advancePhase` (flow). P7 `getCurrentPhase`,`getAiReview`,`getAiReviewHistory` (display) + `runAiReview`/`advancePhase` (flow). **Mongo:** `Companies` (read-only via existing endpoints).

**Status by Figma screen (post-implementation):**

| Figma Section | Status | Notes |
|---|---|---|
| P6.1 stat cards | **Complete** | docs/size/grants/views, real |
| P6.1 readiness donut | **Partial** | real **published ratio** (Figma's 70% mock has no field) |
| P6.1 document accordion | **Complete** | grouped by category, status chip draft/published; Verified/Pending = Backend Blocked |
| P6.1 access-control rail | **Partial** | NDA real; email-alerts + expiry = Backend-blocked honest shells |
| P6.1 manage-access list | **Complete** | investor/level/granted/expires table |
| P6.2 completion | **Not built** | Backend-gap social-proof; low priority |
| P7.1 score ring + stat cards | **Complete** | real overallScore + recommendation count; missing-docs/pitch-grade = Backend Blocked |
| P7.1 stage-progress bars | **Complete** | real scoreBreakdown, `role=progressbar` |
| P7.1 AI recommendations | **Complete** | real, priority + potentialPointGain |
| P7.1 pitch-deck analysis | **Backend Blocked** | honest "Awaiting integration" shells |
| P7.1 badge card | **Complete** | real investorReadyBadge + score |
| P7.2 completion | **Not built** | Phase-8 data = out of scope |
| Design-system (tokens) | **Complete** | 0 raw palette / 0 hex across all 4 files |
| Accessibility | **Complete (P6/P7 main)** | labelled controls, progressbar/scope/caption/sr-only; completion screens n/a |

**Achieved parity (visual/layout/interaction/responsive/typography/spacing/a11y/design-system):** **≈ 88–92%** for the two main screens. **NOT marked VERIFIED** (requires >95%).
**Remaining to >95% (frontend-only):** the two **completion screens**; richer doc status chips need a backend enum (Backend Blocked); minor duplication cleanup (P7 score grid / P6 download list vs visuals); Inter font; exact pixel spacing. **Backend-blocked** (cannot reach without API work): doc verified/pending status, pitch-deck sub-scores, quotas, per-investor role, social-proof, Phase-8 matchmaking.
**Build:** static-verified (0 raw/0 hex, real APIs only, 0 fabricated literals, imports resolve, wiring intact). Run `npm run build && npm run lint` locally.
