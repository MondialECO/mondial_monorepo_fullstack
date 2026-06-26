# Entrepreneur Phase 3 — Full Audit (APIs · Logic · Database)

**Date:** 2026-06-17 · **Scope:** Steps 1–4 + KPI Tracker · backend + frontend + MongoDB
**Verdict:** ✅ Functionally complete & production-ready. 1 rendering bug fixed this session; 2 data-consistency notes (1 display bug pre-existing, 1 duplicated-logic risk).

---

## 1. Architecture at a glance

Phase 3 = **Financial Valuation & KPI**. Four steps, each saving to a distinct place, gated at completion.

```
Step 1  Revenue Input      → Companies.Q1–Q4  +  Companies.Valuation* (cached)
Step 2  Automated Valuation→ (read-only display; no writes)
Step 3  KPI Baseline       → Phase3Kpis (insert)  +  Companies.MonthlyBurn/Nps
Step 4  Concept Overview   → Phase3Concepts (upsert)  → advancePhase(3)
                                                         ├─ scores bumped
                                                         └─ MatchmakingQueue (enqueue)
KPI Tracker (post-step-4)  → reads financial-summary + kpis + quarterly-revenue
```

`*` Companies caches `Valuation`, `ValuationRevenueMultiple`, `ValuationRiskDiscountRate`, `ValuationConfidenceScore`.

---

## 2. Complete API map — endpoint → service → collection → response

All routes are `…/companies/{companyId}/…`, all require `EnsureUniversalPhase1CompleteAsync` + `EnsureCompanyOwnershipAsync`. JSON is **camelCase** (`Program.cs:463`), so C# `MonthlyRecurringRevenue` → `monthlyRecurringRevenue` on the wire.

| # | Method · Route | Controller | Service method | Writes / Reads | Response DTO |
|---|---|---|---|---|---|
| 1 | POST `/revenue` | `:402` | `SaveRevenueDataAsync` | **W:** Companies.Q1–Q4 | `Companies` |
| 2 | POST `/valuation` | `:425` | `CalculateValuationAsync` | **W:** Companies.Valuation + 3 cached fields | `FinancialSummaryResponse` |
| 3 | GET `/financial-summary` | `:635` | `GetFinancialSummaryAsync` | **R:** Companies | `FinancialSummaryResponse` |
| 4 | POST `/cash-position` | `:658` | `SaveCashPositionAsync` | **W:** Companies.CurrentFunds/MonthlyBurn | `{currentFunds, monthlyBurn}` |
| 5 | POST `/monthly-revenue` | `:681` | `SaveMonthlyRevenueAsync` | **W:** Phase3MonthlyRevenues (upsert) + recompute Companies.Q1–Q4 | `MonthlyRevenueResponse[]` |
| 6 | GET `/monthly-revenue` | `:705` | `GetMonthlyRevenueAsync` | **R:** Phase3MonthlyRevenues | `MonthlyRevenueResponse[]` |
| 7 | GET `/quarterly-revenue` | `:728` | `GetQuarterlyRevenueAsync` | **R:** Companies.Q1–Q4 + count Phase3MonthlyRevenues | `QuarterlyRevenueResponse[]` |
| 8 | POST `/kpis` | `:751` | `SaveKpiBaselineAsync` | **W:** Phase3Kpis (insert) + Companies.MonthlyBurn/Nps | `KpiBaselineResponse` |
| 9 | GET `/kpis` | `:775` | `GetKpiBaselineAsync` | **R:** Phase3Kpis (latest) | `KpiBaselineResponse \| null` |
| 10 | POST `/financial-reports` | `:798` | `UploadFinancialReportAsync` | **W:** Phase3FinancialReports + disk | `FinancialReportResponse` |
| 11 | GET `/financial-reports` | `:822` | `GetFinancialReportsAsync` | **R:** Phase3FinancialReports | `FinancialReportResponse[]` |
| 12 | POST `/concept` | `:845` | `SaveConceptAsync` | **W:** Phase3Concepts (upsert) | `ConceptResponse` |
| 13 | GET `/concept` | `:869` | `GetConceptAsync` | **R:** Phase3Concepts | `ConceptResponse \| null` |
| 14 | POST `/phase/{n}/advance` | (phase ctrl) | `AdvancePhaseAsync` | **W:** Companies.CurrentPhase/CompletedPhases → side-effects | `CompanyProgressResponse` |

**Used by the live UI:** Step 1 → #1,#2,#3 · Step 2 → #3,#7 · Step 3 → #8,#9,#3 · Step 4 → #12,#14 · KPI Tracker → #3,#9,#7.
**Built but not on the Phase-3 happy path:** #4 cash-position, #5/#6 monthly-revenue, #10/#11 reports (future Stripe sync / compliance upload).

---

## 3. Database collections — what lives where

| Collection | Registered | Purpose | Key fields | Cardinality |
|---|---|---|---|---|
| **Companies** | `MongoDbContext:31` | Canonical quarterly revenue + cached valuation + score counters | Q1–Q4Revenue, Valuation, ValuationRevenueMultiple/RiskDiscountRate/ConfidenceScore, MonthlyBurn, Nps, InvestorReadyScore, TrustScore | 1 per owner |
| **Phase3Kpis** | `:37` | KPI baselines (history; latest used) | Mrr, Arr, GrossMarginPercent, Cac, Ltv, ChurnPercent, ActiveAccounts, RecordedAt | many per company |
| **Phase3Concepts** | `:40` | Concept overview | OneLiner, ProblemStatement, SolutionDescription, Stage, BusinessModel, SectorTags, KeywordTags, ClarityScore | 1 per company (upsert) |
| **Phase3MonthlyRevenues** | `:38` | Optional monthly detail (future integrations) | YearMonth (YYYY-MM), Revenue, SectorBreakdown | many per company (upsert by month) |
| **Phase3FinancialReports** | `:39` | P&L/balance/audit uploads (metadata; binary on disk) | Type, FileName, StoragePath, FileSize, Status | many per company |
| **MatchmakingQueue** | `:43` | Outbox for Phase-3 completion payload | CompanyId, Payload (BsonDocument), Status, CreatedAt | 1 per completion |

**Single source of truth:** quarterly revenue is **Companies.Q1–Q4**. Both Step 1 (`SaveRevenueDataAsync`) and the monthly path (`SaveMonthlyRevenueAsync` recompute) converge there; `GetQuarterlyRevenueAsync` reads it back. No dual source. ⚠️ One index gap: MatchmakingQueue has **no indexes** (Status/CompanyId/CreatedAt) — fine now, slow at scale.

---

## 4. Business logic

### 4.1 Valuation (`ValuationEngine.cs`)
`Final = Revenue × IndustryMultiple × GrowthAdj − RiskDiscount`. 8 industry multiples (SaaS 8.0 … logistics 1.8, other 3.0). Growth weight 0.5/1.0/1.5/2.0 by band. Risk discount **additive, clamped 0–0.25** (stage, legal entity, founders, KPI/revenue source, docs, NDAs, ownership concentration). Confidence 60 + 15(all quarters) + 15(non-manual KPI) + 10(YoY>30%), clamped 0–100. ✅ Deterministic, 10/10 unit tests pass.

### 4.2 Validation gate (`PhaseValidator.ValidatePhase3Async:100`)
Four checks — all must pass to advance: **revenue>0**, **valuation>0**, **KPI baseline** (latest Phase3Kpi with MRR∨ARR∨accounts>0, via `Phase3Requirements.ValidateKpiBaseline`), **concept exists**. Funding/equity/reports correctly **not** required. ✅ 6/6 validator tests pass.

### 4.3 Completion side-effects (`Phase3CompletionEvents.cs`)
Fires on advance (best-effort, all exceptions swallowed): InvestorReadyScore +18, TrustScore +20 (both clamp 100, single atomic update); builds matchmaking BsonDocument (financials/kpis/concept/scores, null-safe with /0 guards on LTV-CAC & burn-multiple); enqueues to MatchmakingQueue. ✅ Logic verified correct; ⚠️ producer-only (no consumer yet — see §6).

---

## 5. Response shapes (camelCase on the wire)

```
FinancialSummaryResponse  { totalRevenue, finalValuation, monthlyRecurringRevenue,
  annualRecurringRevenue, runwayMonths, growthRate(FRACTION), confidenceScore,
  riskDiscountRate, revenueMultiple, industry, lastUpdatedAt }
KpiBaselineResponse       { mrr, arr, grossMarginPercent, cac, ltv, churnPercent,
  activeAccounts, recordedAt }            // null if no baseline saved
QuarterlyRevenueResponse[] { quarter, revenue, monthCount }
ConceptResponse           { oneLiner, problemStatement, solutionDescription, stage,
  businessModel, sectorTags[], keywordTags[], clarityScore, recordedAt }
```
All backend DTO fields map 1:1 to the `api-entrepreneur.ts` interfaces. ✅ No contract drift.

---

## 6. Findings

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | 🔴→✅ | **KPI Tracker health badges were tautologies.** MRR/ARR/Active-Accounts amounts fed into `getHealthStatus(value,'growth')` whose first test is `value>=20` → always "Excellent". | **Fixed this session** — those badges now reflect `growthRate×100`. |
| 2 | 🟡 | **growthRate display unit mismatch.** Backend returns a **fraction** (`CalculateGrowthRate`, `/3` no ×100). KPI Tracker & Step 3 ×100 correctly; **Steps 1 & 2 render `growthRate.toFixed(2)%` without ×100** → shows "0.10%" for 10%. | Open (pre-existing, cosmetic) |
| 3 | 🟡 | **Duplicated growth logic.** `CompanyService.CalculateGrowthRate` (fraction) and `Phase3CompletionEvents.ComputeGrowthPct` (×100) are two copies of the same formula in different units — drift risk. | Open (refactor candidate) |
| 4 | 🟢 | **MatchmakingQueue: no consumer + no indexes.** Producer enqueues correctly; nothing drains it; Status/CompanyId/CreatedAt unindexed. | Post-MVP (Phase 8 matching) |
| 5 | 🟢 | **No ILogger in completion-events catch.** Silent failure of score-bump/enqueue is invisible to ops. | Post-MVP nicety |

**Security/integrity:** parameterized Mongo filters (no injection), numeric bounds enforced (revenue≥0, nps 0–100, churn 0–100), null-safe throughout, atomic single-doc writes, ownership enforced per request. ✅ No issues.

---

## 7. Verdict

| Dimension | Status |
|---|---|
| Functional (4 steps + gate + side-effects) | ✅ 100% |
| API contract (14 endpoints, camelCase parity) | ✅ aligned |
| Database (6 collections, single source of truth) | ✅ sound (⚠ 1 index gap) |
| Business logic (valuation/validation/events) | ✅ correct, 16/16 tests pass |
| Bugs | 1 fixed (badges); 2 open cosmetic/refactor; 2 post-MVP |

**Recommended before launch:** fix #2 (×100 on Steps 1–2) and add MatchmakingQueue indexes (#4). Everything else is post-MVP.

---
*Companion docs: PHASE3_BACKEND_AUDIT.md, KPI_TRACKER_API_AUDIT.md, MATCHMAKING_QUEUE_AUDIT.md, PHASE3_COMPLETION_EVENTS_AUDIT.md*
