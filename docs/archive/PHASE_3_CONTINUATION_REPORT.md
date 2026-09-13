# Phase 3 — Continuation (Figma 3.2 / 3.3) · Reconciliation + Implementation

**Date:** 2026-06-10 · **Figma:** `21595:9284` (3.2 KPI Tracker `21509:39370`, 3.3 Valuation calculator `21509:39268`). Read-only Figma; scope = Entrepreneur Phase 3 only.
**Build:** sandbox can't compile → static verification; run `npm run build && npm run lint` locally.

> **Headline (read this):** Figma **3.2 and 3.3 cannot reach >90% parity under the stated rules** (no backend changes, no new endpoints, no fake data). ~35–40% of those two screens is composed of elements with **no backing data in the current APIs** — NPS, Burn Rate / monthly-burn series, burn multiple, the revenue-**multiplier** method + valuation breakdown (Base Valuation / Growth Premium / Risk Discount), Stripe/ChartMogul **integration** state, system telemetry, and **composite scores** (Operational Mastery 88%, Business Health 80/100). Building those would require either backend fields (forbidden) or fabricated values (forbidden). **I implemented every element that maps to a real API and refused to fake the rest.** Phase 3 therefore stays **PARTIAL → cannot be marked VERIFIED at >90%** without backend work.

---

## Phase 3 Reconciliation — Figma 3.2 / 3.3

| Figma Element | Exists in code | Gap Type | Action |
|---|---|---|---|
| **3.3** Estimated Valuation tile | ⛔→✅ added (step-3) | Functional/Visual | Real `financialSummary.finalValuation` |
| **3.3** Annual Revenue tile | ⛔→✅ added | Functional | Real `financialSummary.totalRevenue` |
| **3.3** Average Growth tile | ⛔→✅ added | Functional | Real `financialSummary.growthRate` |
| **3.3** Runway | ⛔→✅ added | Functional | Real `financialSummary.runwayMonths` |
| **3.3** Verification Status card | ✅ (step-1 + step-3) | Functional | Real `progress.isInvestorReady` |
| **3.3** Financial Health card | ✅ (step-1 + step-3) | Functional | Real `growthRate` + computed LTV/CAC |
| **3.3** Final Valuation (table summed result) | ✅ (as Estimated Valuation) | Functional | Real `finalValuation` |
| **3.3** "Recalculate" action | ⛔→✅ added (step-3) | UX | Real `calculateValuation` + refresh |
| **3.3** Revenue Growth Report Card chart | ✅ (step-1 quarterly chart, tokenized) | Visual | Covered by step-1 |
| **3.2** LTV/CAC ratio (Business Health) | ⛔→✅ added | Functional | Computed from `kpiBaseline.ltv`/`cac` |
| **3.2** MRR / ARR / Churn / CAC / LTV tiles | ⚠ entered as inputs (step-3); read-back valuation-level shown | Visual | Inputs exist; dedicated display tiles partial |
| **3.2** Revenue trend chart | ✅ (step-1) | Visual | Covered |
| **3.2** Overall Score / Step progress | ⚠ sidebar shows step %; `overallProgressPercent` available | Visual | Partial |
| **3.2** NPS (68 / "World-class") | ❌ | **Backend Gap** | No NPS field — not implemented (no fake) |
| **3.2** Burn Rate + monthly-burn bar trend | ❌ | **Backend Gap** | No burn/expense series — not implemented |
| **3.2** Burn multiple (0.40) | ❌ | **Backend Gap** | Depends on burn — not implemented |
| **3.2** System Health / Data Throughput | ❌ | **Backend Gap** | Telemetry, no field — not implemented |
| **3.2** Composite scores (Operational Mastery 88%, Business Health 80/100) | ❌ | **Backend Gap** | No composite-score field — not implemented |
| **3.2 / 3.3** Stripe / ChartMogul "Connect" + sync state | ❌ | **Backend Gap** | No integration field — not implemented |
| **3.3** Revenue Multiplier (8x) + sector benchmark selector | ❌ | **Backend Gap** | No multiplier field/endpoint — not implemented |
| **3.3** Valuation breakdown: Base Valuation / Growth Premium / Risk Discount | ❌ | **Backend Gap** | Intermediate calc steps not exposed — not implemented |
| **3.3** "View Audit Details" / regulatory-check states | ❌ | **Backend Gap** | No audit field — not implemented |
| Raw blue/green/amber colors (step-3) | ✅→tokens | Visual/Token | Tokenized (primary / destructive) |
| Input label associations / aria (step-3) | ⛔→✅ | Accessibility | `htmlFor`/`id`, `aria-label`, `role`/`aria-live` |

---

## Phase 3 Implementation (this pass)
- **step-3** rewritten (logic preserved): added a real **"Live valuation & financial health"** read-back panel — Estimated Valuation, Annual Revenue, Avg Growth, Runway (from `getFinancialSummary`), Verification Status (`isInvestorReady`), Financial Health (`growthRate`) + computed **LTV/CAC**, with honest empty/"—"/"Awaiting calculation" states. Added a **Recalculate** button (`calculateValuation` → refresh). Tokenized the blue callout + the green/amber allocation total (→ `text-primary`/`text-destructive`). Added `htmlFor`/`id` on funding + KPI inputs, `aria-label` on allocation/file inputs, `aria-label`+focus-ring on selects, `role="status"`/`aria-live` on dynamic regions, semantic `<h2>`s.
- **step-1** (prior pass): Figma 3.1 status cards + tokens + a11y (unchanged).
- **step-2** (Equity Structure): **NOT touched** — it is Figma **Phase 4** content (cap table), not Figma Phase 3. Out of Phase-3-parity scope; resolve in the Phase 4 reconciliation.
- **No fake/mock/hardcoded metrics; no backend/Mongo/endpoint changes.**

## Report
1. **Files modified (1 this pass):** `…/phase-3/step-3/page.tsx`. (Prior: `…/phase-3/step-1/revenue-input-client.tsx`.)
2. **Components created:** none (reused `EntrepreneurLayout`/`ProgressSidebar`/`PhaseHeader`/`StepFooter`/`Input`/`Button`).
3. **APIs used (real):** `getCurrentPhase`, `getFinancialSummary`, `calculateValuation`, `getFinancialReports`, `uploadFinancialReport`, `saveFundingAsk`, `saveKpiBaseline`, `advancePhase`.
4. **Remaining gaps:** the **Backend-Gap** elements above (NPS, burn rate/multiple, multiplier + valuation breakdown, integrations, telemetry, composite scores, audit states) — each needs a backend field/endpoint; step-2 equity = Phase-4 drift; dedicated 3.2 MRR/ARR/churn display tiles; pixel typography/spacing.
5. **Browser verification checklist:** [ ] step-3 valuation panel shows real values after Recalculate, "—"/"Awaiting" before · [ ] Recalculate spinner + refresh · [ ] tokens render light + dark · [ ] all inputs labelled + focus rings · [ ] allocation total turns destructive when out of 95–105% · [ ] file upload still works · [ ] submit still advances to phase-4 · [ ] mobile→desktop grids.
6. **Updated completion %:** functional **100%** (unchanged). Figma-parity: step-1 ≈90%, step-3 ≈60% (real subset done; Backend-Gap elements unbuildable under rules), step-2 = Phase-4 drift. **Phase-3 Figma-parity ceiling under current rules ≈ 60–65%** — **>90% / VERIFIED is blocked** pending backend additions.
7. **Updated tracker row:** see `PHASE_IMPLEMENTATION_PROGRESS.md`.

---

# Visual Parity Pass (v2) — full Figma 3.2/3.3 structure built

**Reframe:** parity is measured on **layout / visuals / typography / spacing / interaction / accessibility** — not on missing backend fields. Every Figma 3.2/3.3 section now renders its exact structure; real data where it exists, honest **"Data unavailable" / "Awaiting integration" / "Not yet configured"** where the backend has no field. **No fabricated values.**

## Re-audit — Figma Section | Status | Notes

| Figma Section | Status | Notes |
|---|---|---|
| **3.3** Overall verification score bar | **Complete** | Real `progress.overallProgressPercent`; `role=progressbar` + aria values |
| **3.3** Annual Revenue / Avg Growth / Estimated Valuation cards | **Complete** | Real `totalRevenue`/`growthRate`/`finalValuation`; valuation card = primary tone |
| **3.3** Revenue Growth quarterly chart | **Complete** | Real `monthlyRevenue` rolled to quarters; honest empty state if none |
| **3.3** Verification Status / Financial Health cards | **Complete** | Real `isInvestorReady` + `growthRate` |
| **3.3** Detailed valuation breakdown table | **Partial** | Full table structure + Final Valuation real; Revenue Multiple/Base/Growth Premium/Risk Discount = **Backend Blocked** → "Data unavailable" rows (chips kept) |
| **3.3** Valuation multiplier / beneficial ownership | **Backend Blocked** | Card rendered with "Not yet configured" (no multiplier/ownership field) |
| **3.3** Verification Progress left rail (4 steps + score footer) | **Complete** | `VerificationProgressRail`; step states derived from real signals (quarters/revenue, finalValuation, kpiBaseline, `completedPhases`); check/current/pending indicators, `sr-only` state text |
| **3.2** Header + "Tracking since" | **Complete** | Real `kpi.recordedAt` or honest "No KPI baseline recorded yet" |
| **3.2** Stripe/ChartMogul integration banner | **Complete (structure)** | Exact banner; actions disabled + "Awaiting integration" (integration = Backend Blocked) |
| **3.2** Status ring | **Complete** | SVG ring on real `overallProgressPercent` (Figma's composite "88% Operational Mastery" has no field → honest "Overall progress" label, not faked) |
| **3.2** Metric tiles MRR/ARR/Churn/CAC/LTV/Runway/Gross margin | **Complete** | Real `kpiBaseline` (+`financialSummary` fallback); per-tile "Data unavailable" until baseline saved |
| **3.2** NPS / Burn Rate tiles | **Backend Blocked** | Rendered in-grid as "Data unavailable" (no field) |
| **3.2** Business Health table (+ Trust Score chip) | **Partial** | LTV/CAC, Growth, Churn real; chip = real `trustScore`/100; Burn multiple = **Backend Blocked** |
| Card structure / radius / padding / 13px label / 32px value scale | **Complete** | Figma scale mapped to tokens (`rounded-xl`/`rounded-lg`, `p-5`, `gap-4`, `text-[13px]`, `text-[32px]/40`) |
| Hover / loading / empty / a11y states | **Complete** | hover:border-primary/40, skeletons, per-element empty states, `role`/`aria`/`scope`/`progressbar` |
| Status chips green/amber | **Complete** | Real tokens `success-light/success-text`, `warning/warning-foreground`, `destructive`, `primary` |

## Report (v2)
1. **Files modified:** `phase-3/step-3/page.tsx` (mounts dashboard; inline panel removed, all form/save/advance logic intact).
2. **Components created (3):** `components/entrepreneur/phase3/FinancialWidgets.tsx` (SectionCard, MetricCard, StatusRing, DataTable, QuarterBars, IntegrationNotice, Chip, UnavailableValue) + `Phase3FinancialDashboard.tsx` (composes 3.2 + 3.3). 
3. **APIs used (real):** `getCurrentPhase`, `getFinancialSummary`, `getKpiBaseline`, `getMonthlyRevenue`, `calculateValuation` (dashboard) + step-3 form's existing `getFinancialReports`/`uploadFinancialReport`/`saveFundingAsk`/`saveKpiBaseline`/`advancePhase`.
4. **Backend-blocked items (rendered with honest states, NOT faked):** NPS, Burn Rate + burn multiple, valuation multiplier + breakdown intermediates (Revenue Multiple/Base/Growth Premium/Risk Discount), Stripe/ChartMogul integration sync, system telemetry, the Figma composite scores (88% / 80/100 → replaced by real `overallProgressPercent` / `trustScore`).
5. **Updated parity %:** **visual/layout/interaction/a11y parity ≈ 88–90%** (every 3.2/3.3 section rendered to structure with real data or honest states; the 3.3 4-step verification rail now built). Pure-data completeness still capped by the backend gaps above. Functional flow **100%**.
6. **Updated tracker row:** see `PHASE_IMPLEMENTATION_PROGRESS.md`.
7. **Browser checklist (v2):** [ ] 3.3 valuation cards populate after Recalculate · [ ] quarterly bars reflect real monthly revenue (empty state when none) · [ ] breakdown table shows "Data unavailable" rows + real Final Valuation · [ ] KPI tiles real when baseline saved, "Data unavailable" before · [ ] NPS/Burn tiles show "Data unavailable" · [ ] integration banner buttons disabled + "Awaiting integration" · [ ] status ring uses real progress % · [ ] business-health chips colour by real thresholds · [ ] light + dark · [ ] mobile→desktop grids · [ ] submit still advances to phase-4.

**Residual visual-parity gaps (not backend):** exact pixel spacing + Inter-vs-Geist font family (global config), and the decorative burn-trend mini bar (shown as honest unavailable). These are the ~10–12% remainder. The 4-step verification rail is now built (`VerificationProgressRail`).

---

## To actually reach Phase-3 VERIFIED (>90%)
Backend (out of current scope) must add: monthly **burn-rate/expense** series, **NPS**, valuation **multiplier-method** fields (multiplier, base valuation, growth premium, risk discount), **composite** health/efficiency scores, and integration **sync** state. Then the 3.2/3.3 displays can be completed with real data and the screens verified.
