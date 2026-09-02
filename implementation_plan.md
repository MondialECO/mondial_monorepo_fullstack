# Funding Flow Consolidation & Duplicate Deal Prevention Plan

## Overview
This plan details the consolidation of Entrepreneur Phase 9 into `/dashboard/entrepreneur/deals`, the unification of Investor Incoming Matches into `/dashboard/investor/discovery`, and the strict deduplication of `DealExecution` creation across Phase 8 investor matching and deal workflows.

## User Review Required
> [!IMPORTANT]
> - `/dashboard/entrepreneur/phase-9` will redirect to `/dashboard/entrepreneur/deals`. The backend logical phase progression (Phase 9 Deal Execution) remains fully intact and validates on deal completion.
> - `/dashboard/investor/incoming-matches` will redirect to `/dashboard/investor/discovery`. The sidebar link will be streamlined to Discovery as canonical.

## Proposed Changes

### Component 1: Deal Creation Deduplication & Matching Invariant
#### [MODIFY] [CompanyService.cs](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Services/CompanyService.cs)
- In `CreateDealAsync`: Check if an active (non-terminal) deal already exists for `(companyId, request.InvestorId)`. If an active deal exists, reuse and return it idempotently instead of inserting duplicate `DealExecution` records.
- In `CreateInvestorOfferAsync`: Ensure search for existing deal checks for active (non-terminal) deals (`!DealTerminalStates.Contains(d.Status)`).
- Ensure `RegenerateInvestorMatchesAsync` strictly mutates `InvestorMatches` and never initiates `DealExecutions`.

### Component 2: Entrepreneur Phase 9 Consolidation
#### [MODIFY] [src/app/dashboard/entrepreneur/(phases)/phase-9/page.tsx](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/app/dashboard/entrepreneur/(phases)/phase-9/page.tsx)
- Redirect to `/dashboard/entrepreneur/deals` to preserve bookmarks, links, and old notifications without 404s.
#### [MODIFY] [src/app/dashboard/entrepreneur/(phases)/phase-8/client.tsx](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/app/dashboard/entrepreneur/(phases)/phase-8/client.tsx)
- Update post-advance navigation target from `/phase-9` to `/dashboard/entrepreneur/deals`.
#### [MODIFY] [src/lib/menu.ts](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/lib/menu.ts)
- Point Entrepreneur "Investor Deals" sidebar item to `/dashboard/entrepreneur/deals`.
#### [MODIFY] [src/app/dashboard/entrepreneur/overview.tsx](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/app/dashboard/entrepreneur/overview.tsx)
- Point Phase 9 card href to `/dashboard/entrepreneur/deals`.

### Component 3: Investor Discovery & Incoming Matches Consolidation
#### [MODIFY] [src/app/dashboard/investor/incoming-matches/page.tsx](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/app/dashboard/investor/incoming-matches/page.tsx)
- Add redirect to `/dashboard/investor/discovery` for seamless backward compatibility.
#### [MODIFY] [src/lib/menu.ts](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/lib/menu.ts)
- Remove duplicate "Incoming Matches" sidebar entry, keeping "Discover Opportunities" (`/dashboard/investor/discovery`) as canonical.
#### [MODIFY] [PhaseNotificationService.cs](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Services/Implementations/PhaseNotificationService.cs)
- Update investor interest notification link to `/dashboard/investor/discovery`.

## Verification Plan
1. **Regeneration Invariant**: Trigger match regeneration 3 times for a company; assert `InvestorMatches` are refreshed while `DealExecutions` count remains unchanged.
2. **Deal Deduplication**: Call `CreateDealAsync` / `CreateInvestorOfferAsync` multiple times for the same investor; assert exactly one active `DealExecution` is created/reused.
3. **Route Redirects**: Test `/dashboard/entrepreneur/phase-9` -> `/dashboard/entrepreneur/deals` and `/dashboard/investor/incoming-matches` -> `/dashboard/investor/discovery`.
4. **Cross-Role Deals Sync**: Verify entrepreneur and investor load the identical `DealId` and see synchronized terms, revisions, and status.
5. **Automated Tests**: Run full frontend and backend test suites.
