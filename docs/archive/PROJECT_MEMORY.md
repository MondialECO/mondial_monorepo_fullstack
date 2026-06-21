# Project Memory - Mondial Frontend Shell Transformation

## 1. Mission

### What we are building:
A scalable enterprise Next.js frontend-shell architecture for Mondial.

### Why:
Backend owns all business logic, workflows, verification, payments, and websocket domain events.
Frontend must focus on:
- Routing and navigation
- UI shell and role-based layouts
- React Query caching and data fetching
- WebSocket subscriptions and real-time updates
- DTO mapping and API contract layer
- Shared component system
- Authentication and authorization boundaries

## 2. Architecture Direction

### Agreed Target Structure:
```
src/
├─ app/                                   # Next 13+ **app router**
│  ├─ (auth)/                             # Route‑group for auth pages
│  ├─ dashboard/                          # Top‑level dashboard namespace
│  │   ├─ layout.tsx                       # Common dashboard layout
│  │   ├─ creator/                         # /dashboard/creator
│  │   │   ├─ layout.tsx                   # Creator‑specific layout
│  │   │   ├─ page.tsx                     # Landing page for creator
│  │   │   └─ module/                     # Feature‑module boundary
│  │   ├─ investor/                        # /dashboard/investor
│  │   └─ other roles...
│  ├─ _providers/                         # Provider boundaries
│  │   ├─ AuthProvider.tsx
│  │   ├─ ReactQueryProvider.tsx
│  │   └─ WebSocketProvider.tsx
│  └─ _middleware.ts                       # Next.js auth middleware
├─ components/                            # UI primitives & shared widgets
│  ├─ ui/                                 # Atomic design system
│  ├─ layout/                             # reusable layout pieces
│  └─ dashboard/                          # shared dashboard widgets
├─ hooks/                                 # Custom React hooks
│  ├─ queries/                            # React‑Query wrappers
│  └─ websocket/                          # WS subscription helpers
├─ lib/                                   # Low‑level utilities
│  ├─ api/                                # API contracts & mappers
│  │   ├─ contracts/                      # Backend contract definitions
│  │   └─ mappers/                        # DTO ↔ UI model mappers
│  └─ utils.ts
└─ types/                                 # TypeScript DTOs & query result types
```

## 3. Current Migration Phase

### Status: Phase 2 COMPLETE ✅ → Phase 3 Starting
- **Phase 2 (Completed 2026-04-15)**: React Query Integration
  - All creator dashboard pages migrated to React Query
  - Loading, error, and empty states implemented
  - API service layer created and ready for backend integration

- **Phase 3 (Next)**: Investor Dashboard Migration
  - Move investor dashboard pages to React Query hooks
  - Replicate same pattern: service functions → hooks → components
  - Ensure consistent error/loading states across all role-based dashboards

## 4. Completed Work Log

### 2026-04-10: Provider Foundation
- ✅ Created `src/app/_providers/AuthProvider.tsx` 
- ✅ Created `src/app/_providers/ReactQueryProvider.tsx`
- ✅ Created `src/app/_providers/WebSocketProvider.tsx`
- ✅ Updated `src/app/layout.tsx` with proper provider nesting
- ✅ Added storage event listener to AuthProvider for cross-tab sync
- **Risk Resolved**: WebSocket initialization before AuthProvider hydration

### 2026-04-11: Dashboard Hooks & Component Updates
- ✅ Created `src/types/creator/dashboard.ts` with centralized DTOs
- ✅ Created `src/hooks/queries/creator.ts` with useDashboardStats hook
- ✅ Updated `src/app/dashboard/creator/page.tsx` to use React Query
- ✅ Updated `src/app/dashboard/creator/myideas/page.tsx` to use React Query
- **Decision**: Use direct hook values (data, isLoading, isError) instead of manual state management

### 2026-04-15: React Query Integration for Billing Page (Phase 2 Complete)
- ✅ Created `src/lib/api-creator-dashboard.ts` with all dashboard service functions including `getBillingHistory`
- ✅ Added `useBillingHistory` hook to `src/hooks/queries/creator.ts`
- ✅ Updated `src/app/dashboard/creator/billinghistory/page.tsx` to use React Query with loading/error/empty states
- ✅ Refactored `src/components/billing/BillingTable.tsx` to accept items as props
- **Result**: All creator dashboard pages now use React Query with consistent error handling
- **Phase 2 Complete**: React Query integration fully deployed across creator dashboard

## 5. Next Immediate Step

### Task: Migrate Investor Dashboard to React Query
- **Files to touch**:
  - `src/app/dashboard/investor/page.tsx` - Add investor-specific hooks
  - `src/lib/api-creator-dashboard.ts` - Add investor service functions
  - `src/hooks/queries/creator.ts` - Add investor query hooks
- **Why it is the next priority**:
  Establishes the pattern for all other role-based dashboards (advisor, founder, admin)
- **Expected validation checklist**:
  - [ ] Investor dashboard data loads with proper loading state
  - [ ] Error handling shows appropriate UI
  - [ ] Loading states prevent race conditions
  - [ ] No breaking changes to existing URL or layout

## 6. Risks / Watchouts

### Route Breakage Risks
- Manual data fetching refactoring might break existing URL patterns
- **Mitigation**: Always keep same file paths and route structure

### Import Alias Risks
- Moving files might break relative imports
- **Mitigation**: Use absolute imports with `@/` prefix consistently

### Provider Nesting Issues
- Incorrect provider order can cause hydration mismatches
- **Mitigation**: Always nest AuthProvider > ReactQueryProvider > WebSocketProvider

### Hydration Concerns
- localStorage access during SSR
- **Mitigation**: All hydration logic in useEffect (client-side only)

### Backend Contract Mismatch
- API responses might not match expected DTOs
- **Mitigation**: Create strict contract definitions before refactoring

## 7. Session Resume Prompt

### Best Next Command:
```
Read src/service/creator/dashboard.ts to find getBillingHistory function
Then update src/hooks/queries/creator.ts to add useBillingHistory hook
Finally update src/app/dashboard/creator/billinghistory/page.tsx to use the new hook
```