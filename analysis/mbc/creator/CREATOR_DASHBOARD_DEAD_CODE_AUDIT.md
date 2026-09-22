# MONDIAL BUSINESS CREATION (MBC)
# CREATOR DASHBOARD — DEAD / OBSOLETE CODE AUDIT

**Date:** 2026-09-22  
**Baseline Commits:**  
- `bd3d52b8`: `feat(creator): rebuild dashboard around canonical journey state`  
- `6f6ff0be`: `fix(creator): align dashboard Phase 5 route with canonical crossroads`  
- `35975fb7`: `fix(creator): implement stage-native Phase 4 result semantics on dashboard`  
**Branch:** `dev-hafiz`  
**Mode:** STRICT SAFE CLEANUP (Pre-Removal Audit)  

---

## 1. Executive Summary & Purpose

Following the successful canonical rebuild of the Creator Dashboard, this audit documents the discovery, classification, and safe removal plan for legacy, unused, duplicate, or superseded dashboard artifacts.

The current dashboard is fully frozen and operates as a unified command center reading exclusively from the canonical aggregation endpoint:
`GET /api/creator/dashboard/summary` via `useCreatorDashboardSummary(activeIdeaId)`.

The goal of this cleanup is to establish a minimal, pristine baseline before Phase 4.8 begins, with zero runtime regressions and 100% preservation of canonical authorities.

---

## 2. Canonical Authorities Preserved (Non-Negotiable)

The following core domain authorities and architectural boundaries remain completely untouched:

| Authority / Boundary | Canonical Implementation | Preservation Status |
| :--- | :--- | :--- |
| **Phase 2 Visual Identity** | `BrandKit` & `IBrandKitStore` | **PRESERVED** |
| **Phase 3.4 Legal Authority** | `CreatorLegalAssessment` | **PRESERVED** |
| **HumainX Authority** | `ProfessionalProfileRecord.QuickStart` | **PRESERVED** |
| **Founder Capacity Authority** | `IFounderCapacityResolver` | **PRESERVED** |
| **Pricing Policy Engine** | `PricingPolicyEngine` | **PRESERVED** |
| **Phase 4 Completion Authority**| `Phase4CompletionResolver` | **PRESERVED** |
| **Phase 4 Result Semantics** | Stage-native evaluations (`35975fb7`) | **PRESERVED** |
| **Dashboard Aggregation Layer**| `CreatorDashboardService` | **PRESERVED** |
| **Dashboard Summary Endpoint** | `GET /api/creator/dashboard/summary` | **PRESERVED** |
| **Canonical Crossroads Route** | `/dashboard/creator/crossroads` | **PRESERVED** |
| **Phase 4.8** | Not implemented | **PRESERVED (ABSENT)** |
| **Phase 4.9** | Reserved | **PRESERVED (RESERVED)** |

---

## 3. Known Legacy Concept Repository-Wide Scan

A complete audit of known legacy concepts was conducted across `src/`, `backend/`, and documentation:

| Concept | Scan Query | Active Production Occurrences | Classification | Finding / Disposition |
| :--- | :--- | :---: | :--- | :--- |
| **"Idea Readiness"** | `Idea Readiness` | 0 | TEST_ONLY / HISTORICAL_DOC | Absent from production dashboard; only present in test assertions confirming its absence. |
| **"Interested Buyers"** | `Interested Buyers` | 0 | TEST_ONLY / HISTORICAL_DOC | Absent from production dashboard; only in anti-regression test assertions. |
| **"Generate Pitch Deck"** | `Generate Pitch Deck` | 0 | HISTORICAL_DOC | Absent from active code. |
| **"Offer & Pricing"** | `Offer & Pricing` | 0 | HISTORICAL_DOC | Absent from production navigation (`src/lib/menu.ts`) and dashboard. |
| **"Pricing/GTM"** | `Pricing/GTM` | 0 | HISTORICAL_DOC | Absent from production navigation and dashboard. |
| **"4 SP matches"** | `4 SP matches` | 0 | HISTORICAL_DOC | Absent from active code. |
| **"Resources / Matches"** | `Resources / Matches` | 0 | HISTORICAL_DOC | Absent from active dashboard. |
| **"SaaS"** | `"SaaS"` | 0 | ACTIVE_CANONICAL | Dashboard renders dynamic `{summary?.project.category \|\| 'Venture'}` without hardcoded "SaaS". |
| **"EBITDA"** | `EBITDA` | 0 | HISTORICAL_DOC | Absent from active Creator Dashboard. |
| **"advancePhase(5)"** | `advancePhase(5)` | 0 | HISTORICAL_DOC | Absent from active Creator Dashboard. |
| **"/dashboard/creator/phase-5"** | `/dashboard/creator/phase-5` | 0 | HISTORICAL_DOC | Absent from active code; aligned to `/dashboard/creator/crossroads`. |
| **"/dashboard/creator/offer-pricing"**| `/dashboard/creator/offer-pricing` | 0 | HISTORICAL_DOC | Absent from active routes and code. |
| **"gtmSetup"** | `gtmSetup` | 0 | TEST_ONLY / HISTORICAL_DOC | Absent from active code; anti-regression test assertions only. |
| **"CreatorPhase4Controller"** | `CreatorPhase4Controller` | 0 | HISTORICAL_DOC | Consolidated in previous refactors. |
| **"DecideCrossRoads"** | `DecideCrossRoads` | 0 | HISTORICAL_DOC | Previously purged in dead duplicate cleanup. |
| **"p4Complete"** | `p4Complete` | 0 | HISTORICAL_DOC | Absent from active dashboard. |
| **"hasNeeds"** | `hasNeeds` | 0 | HISTORICAL_DOC | Absent from active dashboard. |
| **"hasPricing"** | `hasPricing` | 0 | HISTORICAL_DOC | Absent from active dashboard. |
| **"hasGtm"** | `hasGtm` | 0 in dashboard (2 in phase 3/entrepreneur) | ACTIVE_SHARED | Used in Phase 3 business-plan cross-stage checking, not dashboard. |
| **"isQuickStartJourneyComplete"**| `isQuickStartJourneyComplete` | 0 | HISTORICAL_DOC | Previously purged from production code. |
| **"getNextQuickStartJourneyStep"**| `getNextQuickStartJourneyStep` | 0 | HISTORICAL_DOC | Previously purged from production code. |
| **"getQuickStartJourneyState"** | `getQuickStartJourneyState` | 0 in dashboard | ACTIVE_SHARED | Used in HumainX wizard persistence tests, not dashboard. |

---

## 4. Candidate Discovery & Classification Audit Table

Every candidate discovered during inspection is classified below:

| File / Symbol | Classification | Current References | Replacement | Runtime Reachable? | Safe to Remove? |
| :--- | :--- | :---: | :--- | :---: | :---: |
| `src/hooks/queries/creator.ts` -> `useDashboardStats` | `DEAD_CODE` / `UNUSED` | 0 | `useCreatorDashboardSummary` | No | **YES** |
| `src/hooks/queries/creator.ts` -> query key `['creator', 'dashboardStats']` | `DEAD_CODE` / `UNUSED` | 0 | `['creator', 'dashboardSummary']` | No | **YES** |
| `src/lib/api-creator-dashboard.ts` -> `getDashboardStats` | `DEAD_CODE` / `UNUSED` | 1 (in dead `useDashboardStats`) | `getCreatorDashboardSummary` | No | **YES** |
| `src/lib/api-creator-dashboard.ts` -> `creatorDashboardApi` | `UNUSED` | 0 | `getCreatorDashboardSummary` | No | **YES** |
| `src/types/creator/dashboard.ts` -> `DashboardStats` | `SUPERSEDED` / `DEAD_CODE` | 2 (in dead API/hook) | `CreatorDashboardSummary` | No | **YES** |
| `src/types/creator/dashboard.ts` -> `InvestorReadinessScore` | `SUPERSEDED` / `DUPLICATE` | 1 (in dead `DashboardStats`) | `InvestorReadinessScore` from `@/lib/api-creator-journey` | No | **YES** |
| `src/types/creator/dashboard.ts` -> `Investor` | `SUPERSEDED` / `UNUSED` | 1 (in dead `topInvestors`) | Canonical deal/execution types | No | **YES** |
| `src/constants/investors.ts` -> entire file (`topInvestors`) | `DEAD_CODE` / `UNUSED` | 0 in active app | Real deal executions | No | **YES** |
| `backend/Controllers/CreatorController.cs` -> `GetCreatorDashboard` (`/creator/dashboard/stats`) | `COMPATIBILITY` | Legacy/mobile/test route interception | Canonical `CreatorDashboardController` | Yes (via API route) | **NO (RETAIN)** |
| `src/app/dashboard/creator/page.tsx` | `ACTIVE_CANONICAL` | Root dashboard page | N/A | Yes | **NO (RETAIN)** |
| `src/lib/api-creator-dashboard.ts` -> `getCreatorDashboardSummary` | `ACTIVE_CANONICAL` | Core dashboard client | N/A | Yes | **NO (RETAIN)** |
| `src/hooks/queries/creator.ts` -> `useCreatorDashboardSummary` | `ACTIVE_CANONICAL` | Core dashboard hook | N/A | Yes | **NO (RETAIN)** |
| `src/types/creator/dashboard.ts` -> `CreatorDashboardSummary` & related DTOs | `ACTIVE_CANONICAL` | Canonical dashboard contracts | N/A | Yes | **NO (RETAIN)** |
| `backend/Controllers/CreatorDashboardController.cs` | `ACTIVE_CANONICAL` | Canonical dashboard endpoint | N/A | Yes | **NO (RETAIN)** |
| `backend/Services/Implementations/CreatorDashboardService.cs` | `ACTIVE_CANONICAL` | Canonical dashboard aggregator | N/A | Yes | **NO (RETAIN)** |
| `backend/Models/Dtos/CreatorDashboardDtos.cs` | `ACTIVE_CANONICAL` | Canonical dashboard DTOs | N/A | Yes | **NO (RETAIN)** |
| `src/components/creator/dashboard/HumainXDashboardCard.tsx` | `ACTIVE_CANONICAL` | Profile quick-start card | N/A | Yes | **NO (RETAIN)** |
| `src/lib/menu.ts` -> `UserRole.CREATOR` menu items | `ACTIVE_CANONICAL` | Creator navigation sidebar | N/A | Yes | **NO (RETAIN)** |
| `src/hooks/queries/creator.ts` -> `useBillingHistory` | `ACTIVE_SHARED` | 1 (`billinghistory/page.tsx`) | N/A | Yes | **NO (RETAIN)** |
| `src/hooks/queries/creator.ts` -> `useMyIdeas`, `useInvestorIdeas`, etc. | `ACTIVE_SHARED` | Shared helper hooks | N/A | Yes | **NO (RETAIN)** |

---

## 5. Safe Removal Plan

The execution will follow a strict, phased removal procedure:

1. **Delete Dead Constant File:**
   - File: `src/constants/investors.ts`
   - Justification: Orphaned mock data from pre-rebuild dashboard (`topInvestors`). Zero production references.

2. **Remove Dead Types in `src/types/creator/dashboard.ts`:**
   - Remove `InvestorReadinessScore` (dashboard duplicate; journey has canonical type).
   - Remove `DashboardStats` (superseded by `CreatorDashboardSummary`).
   - Remove `Investor` (superseded mock type).
   - Retain `Idea`, `CreatorProfile`, `BillingInfo`, `CreatorSettings`, and all canonical `Dashboard*` contracts.

3. **Remove Dead Client API in `src/lib/api-creator-dashboard.ts`:**
   - Remove `getDashboardStats`.
   - Remove `creatorDashboardApi` object (direct function exports are standard).
   - Clean up unused type import `DashboardStats`.

4. **Remove Dead Query Hook in `src/hooks/queries/creator.ts`:**
   - Remove `useDashboardStats`.
   - Clean up unused import `getDashboardStats`.
   - Clean up unused type import `DashboardStats`.

5. **Verify No Lingering Imports or References:**
   - Run grep searches to confirm zero broken imports.
   - Run typecheck (`npx tsc --noEmit`).

6. **Automated Verification:**
   - Run backend test suites:
     - `CreatorDashboardSummaryTests`
     - Creator Phase 4 tests
     - Creator Phase 5 tests
   - Run frontend test suites:
     - `creator-dashboard.test.tsx`
     - full `src/__tests__/creator/`
     - `src/__tests__/routing/`
   - Run Next.js production build (`npm run build`).

7. **Create Cleanup Report:**
   - `analysis/mbc/creator/CREATOR_DASHBOARD_DEAD_CODE_CLEANUP_REPORT.md`
