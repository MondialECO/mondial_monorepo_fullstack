# MONDIAL BUSINESS CREATION (MBC)
## CREATOR PHASE 3 — ROUTE MAP & NAVIGATION AUDIT

### 1. Canonical Route Sequence

The authoritative Creator Phase 3 order is:
```text
3.1 Market Intelligence      → /dashboard/creator/phase-3/market-study
3.2 Business Model           → /dashboard/creator/phase-3/business-model
3.3 Financial Forecast       → /dashboard/creator/phase-3/forecast
3.4 Legal & Compliance       → /dashboard/creator/phase-3/compliance
3.5 Company Formation & Team → /dashboard/creator/phase-3/formation
3.6 Executive Business Plan  → /dashboard/creator/phase-3/business-plan
3.7 Investor Readiness       → /dashboard/creator/phase-3/complete
```

---

### 2. Route Audit Matrix

| Step | Canonical Route | Page Component | Previous Target | Next Target | ideaId Propagation | Deep-Link Safe? | Refresh Safe? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Index** | `/dashboard/creator/phase-3` | `phase-3/page.tsx` | N/A | `/market-study` (redirect) | Inherits search params | Partial (Blind redirect) | Yes |
| **3.1** | `/dashboard/creator/phase-3/market-study` | `market-study/page.tsx` | `/phase-2/complete` | `/business-model` | **PARTIAL** (Omits `useSearchParams`) | **NO** (Context desync if URL differs from ambient) | Yes |
| **3.2** | `/dashboard/creator/phase-3/business-model` | `business-model/page.tsx` | `/market-study` | `/forecast` | **PARTIAL** (Omits `useSearchParams`) | **NO** (Context desync if URL differs from ambient) | Yes |
| **3.3** | `/dashboard/creator/phase-3/forecast` | `forecast/page.tsx` | `/business-model` | `/compliance` | **PASS** (`withIdeaContext` on all links) | Yes | Yes |
| **3.4** | `/dashboard/creator/phase-3/compliance` | `compliance/page.tsx` | `/forecast` | `/formation` | **PASS** (`useSearchParams` + `withIdeaContext`) | Yes | Yes |
| **3.5** | `/dashboard/creator/phase-3/formation` | `formation/page.tsx` | `/compliance` | `/business-plan` | **PASS** (`useSearchParams` + `withIdeaContext`) | Yes | Yes |
| **3.6** | `/dashboard/creator/phase-3/business-plan` | `business-plan/page.tsx` | `/formation` | `/complete` | **PARTIAL** (Empty state back drops ideaId) | Yes | Yes |
| **3.7** | `/dashboard/creator/phase-3/complete` | `complete/page.tsx` | `/business-plan` | `/crossroads` | **PASS** (`useSearchParams` + `withIdeaContext`) | Yes | Yes |

---

### 3. Entry Route Audit (`/dashboard/creator/phase-3`)

#### Current Behavior:
```typescript
// src/app/dashboard/creator/phase-3/page.tsx
export default function CreatorPhase3IndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ideaId = searchParams.get('ideaId');
    const target = ideaId
      ? `/dashboard/creator/phase-3/market-study?ideaId=${encodeURIComponent(ideaId)}`
      : '/dashboard/creator/phase-3/market-study';
    router.replace(target);
  }, [router, searchParams]);
  ...
}
```

#### Evaluation:
- **New Canonical Journey**: Directs to Step 3.1 (`/market-study`). **PASS**.
- **Partially Completed Journey**: **FAIL / LIMITATION**. Unconditionally redirects to 3.1 rather than resolving the active artifact milestone (e.g. if Market and Business Model exist, it still sends user to 3.1 instead of 3.3).
- **Fully Completed Journey**: Redirects to 3.1 instead of `/complete` or showing completion state.
- **Legacy Journey**: No special handling; redirects to 3.1.

---

### 4. Navigation & Context Propagation Defects

1. **`market-study/page.tsx` (L367)**:
   - Empty state "Back to Phase 2":
     ```typescript
     router.push('/dashboard/creator/phase-2/complete')
     ```
   - **Defect**: Drops `ideaId` parameter from URL.

2. **`business-model/page.tsx` (L338)**:
   - Empty state "Back to Market Study":
     ```typescript
     router.push('/dashboard/creator/phase-3/market-study')
     ```
   - **Defect**: Drops `ideaId` parameter from URL.

3. **`business-plan/page.tsx` (L638)**:
   - Remediation link for Legal Framework:
     ```typescript
     router.push('/dashboard/creator/phase-3/compliance')
     ```
   - **Defect**: Drops `ideaId` parameter from URL; UI text refers to obsolete Step "3.5".

4. **`business-plan/page.tsx` (L955)**:
   - Initial ungenerated empty state Back button:
     ```typescript
     router.push('/dashboard/creator/phase-3/business-model')
     ```
   - **Defect**: Drops `ideaId`, and incorrectly jumps back to Step 3.2, skipping Steps 3.3 (Forecast), 3.4 (Compliance), and 3.5 (Formation).

---

### 5. Crossroads Transition

- Step 3.7 (`/dashboard/creator/phase-3/complete`) Primary CTA routes to:
  ```typescript
  withIdeaContext('/dashboard/creator/crossroads', activeIdeaId)
  ```
- Carries full project context, ideaId, and enables path selection (Path A / Path B) within the 30-day decision window.
