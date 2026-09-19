# FAILED & PARTIAL TESTS REPORT

## Acceptance QA Pass — Mondial Business Creation (MBC)

**Evaluated Date:** 2026-09-19  
**Scope:** Canonical Creator Journey (Phase 2 → Phase 3 → Crossroads → Level Up → Entrepreneur Workspace)  
**Rule Applied:** Strict QA Pass — Zero Silent Fixes, Zero Production Code Modifications.

---

## 1. Summary of Non-Pass Tests

| Test ID | Area | Check Name | Status | Severity | Root Cause Summary |
|---|---|---|---|---|---|
| `UI-RESP-01` | Mobile UI | Brand Studio 375px / 768px Viewport | `PARTIAL` | `MEDIUM` | Horizontal overflow (+111px at 375px, +349px at 768px) due to fixed-width canvas tools and unstacked palettes. |
| `UI-RESP-02` | Mobile UI | Market Study 768px Viewport | `PARTIAL` | `LOW` | Horizontal overflow (+102px at 768px) due to 3-column TAM/SAM/SOM funnel cards without `flex-wrap`. |
| `UI-RESP-03` | Mobile UI | Business Model 375px / 768px Viewport | `PARTIAL` | `MEDIUM` | Horizontal overflow (+18px at 375px, +142px at 768px) due to 9-block canvas grid min-width constraints. |
| `FE-VITEST-01` | Frontend Tests | `AssetLibrary.test.tsx` (2 tests) | `PARTIAL` | `LOW` | Vitest test-mock defect: `useSearchParams` not exported from `next/navigation` mock. |
| `FE-VITEST-02` | Frontend Tests | `BrandingOptionsPage.test.tsx` (2 tests) | `PARTIAL` | `LOW` | Vitest test-mock defect: `useSearchParams` not exported from `next/navigation` mock. |
| `FE-VITEST-03` | Frontend Tests | `Phase2CompletePage.test.tsx` (2 tests) | `PARTIAL` | `LOW` | Unit test expects `/dashboard/creator/phase-3`, but production code correctly provides `/dashboard/creator/phase-3?ideaId=...` for multi-project continuity. |
| `FE-VITEST-04` | Frontend Tests | `phase7-due-diligence.test.tsx` (16 tests) | `PARTIAL` | `LOW` | Investor due diligence component test timeout/text matcher mismatch (outside Creator MVP scope). |
| `FE-TSC-01` | Typecheck | Test Mocks in `tests/creator/frontend/` | `PARTIAL` | `LOW` | 41 mock object literal errors in test files missing newly added optional/provenance fields on `BrandKit`. Zero errors in `src/`. |
| `ENV-ATLAS-01` | Database | Integration Tests Ephemeral Collections | `BLOCKED_BY_ENVIRONMENT` | `ENVIRONMENT` | MongoDB Atlas shared tier 500-collection limit blocks tests creating disposable ephemeral databases. Live application operational against `MondialEcoDev`. |

---

## 2. Detailed Findings

### Item 1: `UI-RESP-01` — Brand Studio Mobile/Tablet Overflow
- **Area:** Phase 2 Brand Studio UI (`/dashboard/creator/phase-2/brand-studio`)
- **Observed Behavior:**
  - At 375px (Mobile): `scrollWidth` = 486px vs `clientWidth` = 375px (+111px horizontal overflow).
  - At 768px (Tablet): `scrollWidth` = 1117px vs `clientWidth` = 768px (+349px horizontal overflow).
  - At 1440px / 1920px: PASS (`diff` = 0px).
- **Root Cause:**
  - The color system palette tiles and typography preview cards utilize fixed-min-width containers (`min-w-[400px]` and multi-column flex rows) that do not break to vertical stacks on screens below 800px.
- **Severity:** `MEDIUM` (Functional UX degradation on smaller devices; desktop/laptop experience is unimpaired).

---

### Item 2: `UI-RESP-02` — Market Study 768px Tablet Overflow
- **Area:** Step 3.1 Market Study (`/dashboard/creator/phase-3/market-study`)
- **Observed Behavior:**
  - At 375px: PASS (`scrollWidth` = 375px, `diff` = 0px).
  - At 768px: `scrollWidth` = 870px vs `clientWidth` = 768px (+102px horizontal overflow).
  - At 1440px / 1920px: PASS (`diff` = 0px).
- **Root Cause:**
  - The TAM/SAM/SOM funnel cards render in a 3-column grid that switches directly to mobile stack at `<640px`, but maintains a rigid 3-column layout between `640px` and `880px` without horizontal scroll encapsulation.
- **Severity:** `LOW` (Readable, minor lateral scrolling required on tablet).

---

### Item 3: `UI-RESP-03` — Business Model Canvas Mobile/Tablet Overflow
- **Area:** Step 3.2 Business Model Canvas (`/dashboard/creator/phase-3/business-model`)
- **Observed Behavior:**
  - At 375px: `scrollWidth` = 393px vs `clientWidth` = 375px (+18px minor overflow).
  - At 768px: `scrollWidth` = 910px vs `clientWidth` = 768px (+142px overflow).
  - At 1440px / 1920px: PASS (`diff` = 0px).
- **Root Cause:**
  - Standard 9-block Business Model Canvas layout enforces minimum column widths to preserve table structure readability. The container lacks an explicit `overflow-x-auto` wrapper with smooth indicator.
- **Severity:** `MEDIUM` (Canvas columns slightly truncate on tablet viewports).

---

### Item 4: `FE-VITEST-01` & `FE-VITEST-02` — Vitest Mock Missing `useSearchParams`
- **Area:** Frontend Unit Tests (`AssetLibrary.test.tsx`, `BrandingOptionsPage.test.tsx`)
- **Observed Behavior:**
  - Test run failure: `[vitest] No "useSearchParams" export is defined on the "next/navigation" mock.`
- **Root Cause:**
  - In Stage 12, components were upgraded to read `ideaId` from `useSearchParams()` to maintain strict multi-project context continuity. The test mock in `vitest.setup.ts` only mocked `useRouter` and `usePathname`, but omitted `useSearchParams: vi.fn(() => new URLSearchParams())`.
- **Production Impact:** None. In the live Next.js running application, Next.js provides the genuine `useSearchParams` hook, which functions without error.
- **Severity:** `LOW` (Test harness mock defect).

---

### Item 5: `FE-VITEST-03` — `Phase2CompletePage.test.tsx` Multi-Project Route Assertion
- **Area:** Frontend Unit Tests (`Phase2CompletePage.test.tsx`)
- **Observed Behavior:**
  ```text
  AssertionError: expected "spy" to be called with arguments: [ '/dashboard/creator/phase-3' ]
  Received: [ '/dashboard/creator/phase-3?ideaId=idea_cyber_123' ]
  ```
- **Root Cause:**
  - The production component was correctly hardened to pass `ideaId` query parameter to preserve venture context across phase transitions. The test file was written prior to Stage 12 multi-project parameter preservation and asserted on the old bare route.
- **Production Impact:** None. Preserving `ideaId` is the required canonical behavior.
- **Severity:** `LOW` (Stale assertion in unit test).

---

### Item 6: `FE-TSC-01` — Mock TypeScript Interface Alignment in Test Files
- **Area:** Build / Typecheck (`tests/creator/frontend/*.test.tsx`)
- **Observed Behavior:**
  - `npx tsc --noEmit` reports 41 errors, all situated in `tests/creator/frontend/` test mock objects.
  - Zero errors in `src/`.
- **Root Cause:**
  - `BrandKit` and `BrandColorRole` interfaces were expanded in Stage 12 with provenance fields (`provenance`, `usageNote`, `isLocked`). Test files constructing raw mock objects did not provide these new fields.
- **Severity:** `LOW` (Zero production compilation impact; tests run in Vitest via esbuild/Vite which strips types).

---

### Item 7: `ENV-ATLAS-01` — MongoDB Atlas 500-Collection Quota on Integration Tests
- **Area:** Test Environment & Integration Test Suite
- **Observed Behavior:**
  - Integration tests attempting to initialize ephemeral database instances hit the shared MongoDB Atlas free-tier quota (`500 collections max`).
- **Production Impact:**
  - None. The live backend running against `MondialEcoDev` operates well within active collection bounds (18 collections in active use). All 109 unit tests with mocked stores and all 27 live API acceptance tests executed without database errors.
- **Severity:** `ENVIRONMENT` (Documented per Prompt Section 5).
