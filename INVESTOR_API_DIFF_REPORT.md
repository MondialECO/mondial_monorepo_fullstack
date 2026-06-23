# INVESTOR API DIFF REPORT

**Date:** 2026-06-22
**Compared:** working HEAD `9749b44` → `origin/main` `b2ea2ae` (9 commits)
**Method:** Real `git diff` of backend Controllers/DTOs/Services and frontend investor code. No assumptions.

---

## HEADLINE

> **No breaking changes to the investor API contract on main.** The 9 commits are **entrepreneur Phase-2/Phase-3** work (concept, quarterly revenue, beneficial owners, valuation engine) plus a JWT fix. Every investor-facing endpoint and DTO (Opportunity*, Deal*, Signature*, NDA*, InvestorPipeline*) is **unchanged**. The investor frontend needs **no updates** to stay in sync with main.

The developer's note that "investor APIs may have changed" is, per the actual diff, **not borne out** — the shared `CompanyController.cs` / `CompanyDtos.cs` changed, but only in their **entrepreneur Phase-3** sections.

---

## 1. Investor FRONTEND changes on main

**None.** `git diff` of `src/app/dashboard/investor/**`, `src/components/investor`, `src/components/deals`, `src/lib/api-deals.ts`, `src/types/deals.ts` → **0 files changed** on main. The investor UI/client on main is identical to your HEAD.

(The only `src/lib`/`src/types` changes are `api-entrepreneur.ts`, `entrepreneur.ts`, `types/entrepreneur.ts` — entrepreneur-side.)

## 2. Backend changes affecting the shared CompanyController / DTOs

Diffstat: `CompanyController.cs` +93, `CompanyDtos.cs` +53/-8, `CompanyService.cs` +270/− (all Phase-3).

### New endpoints added (entrepreneur Phase-3 — not investor)
| Method | Route | Purpose |
|---|---|---|
| `GET` | `companies/{companyId}/beneficial-owners` | Phase-3 KYC owners |
| `GET` | `companies/{companyId}/quarterly-revenue` | Phase-3 revenue |
| `POST` | `companies/{companyId}/concept` | Phase-3 save concept |
| `GET` | `companies/{companyId}/concept` | Phase-3 read concept |

### New DTOs added (entrepreneur Phase-3)
`BeneficialOwnerResponse`, `QuarterlyRevenueResponse`, `SaveConceptRequest`, `ConceptResponse`, plus valuation fields (`RiskDiscountRate`, `RevenueMultiple`, `BurnRate`, `Nps`, `ConfidenceScore`, etc.).

### Modified field (the only OLD → NEW change)
| Field | OLD | NEW | Class | Investor impact |
|---|---|---|---|---|
| `Role` | `public string Role` | `public string? Role` | `BeneficialOwnerDto` (Phase-3 entrepreneur KYC) | **None** — not an investor DTO; nullable is backward-compatible |

### Removed / renamed
**None.** `git diff --name-status` shows **0 deletions, 0 renames**. No investor endpoint or field removed or renamed.

## 3. Investor-facing DTOs — change check (each UNCHANGED on main)

| DTO / endpoint | Changed on main? |
|---|---|
| `OpportunityFeedResponse` (discovery feed) | ❌ unchanged |
| `OpportunityCardResponse` / `OpportunityScoreBreakdownDto` (match score) | ❌ unchanged |
| `OpportunityDetailResponse` (opportunity detail) | ❌ unchanged |
| `NdaAcceptanceResponse` / NDA endpoints | ❌ unchanged |
| Data-room documents / session / diligence | ❌ unchanged |
| `InvestorPipelineSummaryDto` (pipeline KPIs) | ❌ unchanged |
| `DealStatusResponse` / `TermSheetRevisionResponse` (negotiation) | ❌ unchanged |
| `SignatureRecordDto` / term-sheet sign | ❌ unchanged |
| `/api/investor/*` (stats, profile, term-sheet/create) | ❌ unchanged |

## 4. Frontend-already-updated assessment

- **Investor surface:** No investor API changed → investor frontend is **already in sync** with main (nothing to update).
- **Entrepreneur Phase-3 surface:** main updates **both** sides (`api-entrepreneur.ts`, `types/entrepreneur.ts` consume the new endpoints), so the Phase-3 contract is self-consistent **on main** — but those updates are **not yet in your working HEAD** (you're 9 commits behind). Until you sync, your entrepreneur client lacks the new Phase-3 calls.

## 5. Contract-verification note (static only)

This diff is a **static** comparison of committed code. A true request↔response contract check requires the **running backend**, which is currently returning **HTTP 503 on every endpoint** (MongoDB unreachable — see `FINAL_STAGING_CERTIFICATION.md`). So casing/shape verification against live JSON could **not** be executed. Based on the diff alone, the investor contract is stable; live confirmation is pending a healthy backend.

---

*Source: live `git diff HEAD origin/main`. No fabricated values.*
