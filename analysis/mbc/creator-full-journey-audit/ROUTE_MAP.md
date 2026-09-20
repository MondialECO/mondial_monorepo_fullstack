# MBC Creator Journey — Route Map & Page Inventory

**Audit Date**: 2026-09-20  
**Audit Scope**: Phase 1 through Phase 6 Creator Journey (HEAD verification)  
**Status**: CONFIRMED at HEAD  

---

## 1. Route Inventory & Reachability Table

| Route | Component Mount | Reachable via Inbound CTA | Status | Direct Bookmark / State Vulnerability |
| :--- | :--- | :--- | :--- | :--- |
| `/dashboard/creator` | `src/app/dashboard/creator/page.tsx` | App Sidebar / Root Navigation | Active | None. Direct mount loads overview / active phase redirect. |
| `/dashboard/creator/phase-1` | `src/app/dashboard/creator/phase-1/page.tsx` (`Phase1Client`) | Sidebar, Onboarding CTA | Active | Vulnerability: Direct URL load reads `useOnboarding()`. If onboarding phase < 1, renders redirect to `/onboarding`. |
| `/dashboard/creator/phase-2` | `src/app/dashboard/creator/phase-2/page.tsx` | Phase 1 completion CTA, Sidebar | Redirector | Direct load redirects immediately via `router.replace('/dashboard/creator/phase-2/clarifier')`. |
| `/dashboard/creator/phase-2/clarifier` | `src/app/dashboard/creator/phase-2/clarifier/page.tsx` (`ClarifierPage`) | Inbound from `/phase-2` redirect | Active | Direct URL load initializes 6-question chat. If no `ideaId` in query param, relies on `useIdea()` hook fallback. |
| `/dashboard/creator/phase-2/idea-summary` | `src/app/dashboard/creator/phase-2/idea-summary/page.tsx` (`IdeaSummaryPage`) | Inbound CTA from `clarifier/page.tsx:378` | Active | **State Vulnerability**: Inbound push does NOT pass `?ideaId=...`. Direct bookmark with no cached idea state renders empty fields or errors. |
| `/dashboard/creator/phase-2/concept-name` | `src/app/dashboard/creator/phase-2/concept-name/page.tsx` (`ConceptNamePage`) | Inbound CTA from `idea-summary/page.tsx:74` | Active | **State Vulnerability**: Inbound push does NOT pass `?ideaId=...`. Direct load without idea state fails name generation rate limit or loads empty. |
| `/dashboard/creator/phase-2/branding` | `src/app/dashboard/creator/phase-2/branding/page.tsx` (`BrandingPage`) | Inbound CTA from `concept-name/page.tsx:142` | Active | Can be accessed directly. Presents Studio (`/brand-studio`), Hire Designer (`/hire-designer`), or Skip (`/complete`). |
| `/dashboard/creator/phase-2/brand-studio` | `src/app/dashboard/creator/phase-2/brand-studio/page.tsx` (`BrandStudioPage`) | Inbound CTA from `branding/page.tsx:102` | Active | AI Studio for logo/color/font generation. Direct URL load functional if idea exists in context. |
| `/dashboard/creator/phase-2/logo-tool` | `src/app/dashboard/creator/phase-2/logo-tool/page.tsx` (`LogoToolPage`) | **Orphaned / Dead Route** | Dead (Redirect) | Immediately redirects to `/dashboard/creator/phase-2/brand-studio` (`router.replace`). No component UI renders. |
| `/dashboard/creator/phase-2/hire-designer` | `src/app/dashboard/creator/phase-2/hire-designer/page.tsx` (`HireDesignerPage`) | Inbound CTA from `branding/page.tsx:118` | Active | M50 Designer booking directory. Reachable from branding option. |
| `/dashboard/creator/phase-2/brand-kit` | `src/app/dashboard/creator/phase-2/brand-kit/page.tsx` (`BrandKitPage`) | Inbound link from Brand Studio / Complete | Active | Direct bookmark renders brand kit hub. If brand not yet finalized, displays blank preview. |
| `/dashboard/creator/phase-2/complete` | `src/app/dashboard/creator/phase-2/complete/page.tsx` (`Phase2CompletePage`) | Inbound CTA from branding skip / brand studio save | Active | **Fabricated State Vulnerability**: Contains hardcoded fallback sample data (mock value propositions, mock brand traits, mock color hex codes) if brand is missing. |
| `/dashboard/creator/phase-3` | `src/app/dashboard/creator/phase-3/page.tsx` | Inbound CTA from `phase-2/complete` | Redirector | Direct load calls `router.replace('/dashboard/creator/phase-3/market-study')`. |
| `/dashboard/creator/phase-3/market-study` | `src/app/dashboard/creator/phase-3/market-study/page.tsx` | Inbound from `/phase-3` redirect, Step 3.1 | Active | Direct URL load triggers AI generation if no active market study session exists. |
| `/dashboard/creator/phase-3/business-model` | `src/app/dashboard/creator/phase-3/business-model/page.tsx` | Inbound CTA from `market-study/page.tsx`, Step 3.2 | Active | Direct URL load initiates business model canvas generation. |
| `/dashboard/creator/phase-3/forecast` | `src/app/dashboard/creator/phase-3/forecast/page.tsx` | Inbound CTA from `business-model/page.tsx`, Step 3.3 | Active | **State Vulnerability**: If visited directly before Market Study, TAM/SAM/SOM cannot auto-seed and defaults to hardcoded fallback constant ($1,000,000). |
| `/dashboard/creator/phase-3/compliance` | `src/app/dashboard/creator/phase-3/compliance/page.tsx` | Inbound CTA from `forecast/page.tsx`, Step 3.4 | Active | Evaluates regulatory checklist. Direct URL load runs evaluation on current idea. |
| `/dashboard/creator/phase-3/formation` | `src/app/dashboard/creator/phase-3/formation/page.tsx` | Inbound CTA from `compliance/page.tsx`, Step 3.5 | Active | Direct URL load generates legal structure recommendation (SAS, SAS-U, SARL). |
| `/dashboard/creator/phase-3/business-plan` | `src/app/dashboard/creator/phase-3/business-plan/page.tsx` | Inbound CTA from `formation/page.tsx`, Step 3.6 | Active | 12-section business plan. Direct URL load requires upstream artifacts for full hydration. |
| `/dashboard/creator/phase-3/complete` | `src/app/dashboard/creator/phase-3/complete/page.tsx` | Inbound CTA from `business-plan/page.tsx`, Step 3.7 | Active | Evaluates Investor Readiness Score (0-100). Submits `PATCH /api/creator/masterplan/complete`. |
| `/dashboard/creator/offer-pricing` | `src/app/dashboard/creator/offer-pricing/page.tsx` (`Phase4OfferPricingPage`) | Inbound CTA from Phase 3 complete / Sidebar | Active | **Phase 4 Multi-Step Hub**: Controls Steps 4.1 (`Phase4Pricing`), 4.2 (`Phase4Resource`), 4.3 (`Phase4Gtm`), and 4.4 (`Phase4Complete`). |
| `/dashboard/creator/crossroads` | `src/app/dashboard/creator/crossroads/page.tsx` (`CrossroadsPage`) | Inbound CTA from Phase 4 complete / Sidebar | Active | **Phase 5 Hub**: Presents Path A (Sell/License via IP Marketplace) vs Path B (Build & Seed via SPs/Formation). |
| `/dashboard/creator/investors` | `src/app/dashboard/creator/investors/page.tsx` (`Phase6InvestorsPage`) | Inbound CTA from Phase 5 Path B completion | Active | **Phase 6 Hub**: Presents Investor Readiness scorecard, Smart Matchmaking with active investors, and the Level-Up CTA. |
| `/dashboard/creator/asset-library` | `src/app/dashboard/creator/asset-library/page.tsx` (`AssetLibraryPage`) | Inbound link from sidebar / journey headers | Active | Displays all 8 produced artifacts. Working exports exist for 4; 4 are in-app viewers only. |

---

## 2. Orphaned & Dead Route Analysis

### 2.1 Orphaned Routes
- No completely disconnected page directories exist at HEAD under `src/app/dashboard/creator`. All routes have an inbound link from at least one adjacent step, header, or dashboard navigation bar.
- However, `/dashboard/creator/phase-2/logo-tool` is completely bypassed by the application UI (the UI directly links to `/brand-studio` instead).

### 2.2 Dead Routes & Immediate Redirectors
1. `src/app/dashboard/creator/phase-2/page.tsx`:
   - Evidence: `src/app/dashboard/creator/phase-2/page.tsx:8-12`:
     ```typescript
     export default function Phase2Page() {
       const router = useRouter();
       useEffect(() => {
         router.replace('/dashboard/creator/phase-2/clarifier');
       }, [router]);
       return null;
     }
     ```
   - Renders null; purely redirects.
2. `src/app/dashboard/creator/phase-2/logo-tool/page.tsx`:
   - Evidence: `src/app/dashboard/creator/phase-2/logo-tool/page.tsx:8-12`:
     ```typescript
     export default function LogoToolPage() {
       const router = useRouter();
       useEffect(() => {
         router.replace('/dashboard/creator/phase-2/brand-studio');
       }, [router]);
       return null;
     }
     ```
   - Renders null; legacy endpoint permanently redirecting to brand studio.
3. `src/app/dashboard/creator/phase-3/page.tsx`:
   - Evidence: `src/app/dashboard/creator/phase-3/page.tsx:8-12`:
     ```typescript
     export default function Phase3Page() {
       const router = useRouter();
       useEffect(() => {
         router.replace('/dashboard/creator/phase-3/market-study');
       }, [router]);
       return null;
     }
     ```
   - Renders null; purely redirects.

---

## 3. Direct URL / Bookmark State Vulnerabilities

1. **Query Parameter Loss in Phase 2**:
   - `src/app/dashboard/creator/phase-2/clarifier/page.tsx:378` navigates via `router.push('/dashboard/creator/phase-2/idea-summary')` without attaching `?ideaId=${ideaId}`.
   - `src/app/dashboard/creator/phase-2/idea-summary/page.tsx:74` navigates via `router.push('/dashboard/creator/phase-2/concept-name')` without attaching `?ideaId=${ideaId}`.
   - If a user reloads or bookmarks these URLs, the frontend relies on `useIdea()` in `src/contexts/IdeaContext.tsx` reading from `sessionStorage`/`localStorage`. If cleared or in incognito, the page loads without idea context.

2. **Phase 3 Step Skip Vulnerability**:
   - Every Phase 3 step (`market-study`, `business-model`, `forecast`, `compliance`, `formation`, `business-plan`, `complete`) is a distinct Next.js route with no route middleware or layout-level step guard.
   - A user can directly enter `/dashboard/creator/phase-3/business-plan` by URL. If upstream artifacts do not exist in the database, the page renders empty cards or triggers fallback defaults without blocking navigation.
   - A user can directly enter `/dashboard/creator/phase-3/complete` and trigger `PATCH /api/creator/masterplan/complete`. The backend verifies 4 artifacts (forecast, business plan, formation, legal) but does NOT verify Market Study or Business Model canvas at that endpoint (`CreatorPhase3Controller.cs:633-668`).
