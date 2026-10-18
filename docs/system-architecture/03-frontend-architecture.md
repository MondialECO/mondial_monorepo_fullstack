# Mondial ECO — Frontend Architecture & Route Hierarchy

The frontend is a Next.js 16 App Router application engineered with React 19, TypeScript 5, Tailwind CSS 4, and shadcn/ui. It manages 198 distinct client and server routes across 11 functional domains.

---

## 1. App Router Hierarchy & Layout Tree

```
src/app/layout.tsx (Root HTML, Fonts, Global Meta, Viewport)
└── _providers/RootProviders
    ├── ThemeProvider (Dark / Light / System theme context)
    └── providers/LanguageProvider (Bilingual EN / FR i18n engine, cookie & localStorage sync)
        └── _providers/AuthProvider (Token hydration, multi-tab sync, /auth/me verification)
            └── _providers/ReactQueryProvider (TanStack Query client)
                └── ui/tooltip/TooltipProvider
            ├── (auth)/layout.tsx (Public Auth Container)
            │   ├── /login
            │   ├── /register
            │   ├── /forgot-password
            │   └── /reset-password
            │
            ├── (marketing)/ (Public Root & Informational Portals)
            │   ├── / (Homepage)
            │   ├── /pricing
            │   ├── /for-creators/* (Concept, Positioning, Verification)
            │   ├── /for-entrepreneurs/* (Build, Equity, Funding)
            │   ├── /for-investors/* (Discovery, Diligence, Portfolio)
            │   ├── /for-service-providers/* (Opportunities, Delivery, Earnings)
            │   ├── /marketplace/* (Public listings for Projects & Services)
            │   └── /profile/[slug] (Universal Public Profile)
            │
            ├── onboarding/ (Universal Phase 1 Onboarding & Verification Gate)
            │   ├── /onboarding (Onboarding Hub & State Router)
            │   ├── /onboarding/email & /phone (Required Contact Verification: Phase 1 Gate)
            │   ├── /onboarding/identity (Sumsub Document KYC — Deferred in MVP)
            │   ├── /onboarding/documents/* (Supplementary: Income, License, Residence, Tax)
            │   └── /onboarding/complete (Completion Handoff)
            │
            └── dashboard/layout.tsx (Role-Protected Dashboard Shell)
                └── components/layout/AuthGuard (Enforces Backend Verification & Phase 1 Gate)
                    ├── components/layout/AppSidebar (Role-Dynamic Navigation via menu.ts)
                    ├── components/layout/Topbar (Active Role, Profile, Notifications Bell)
                    │
                    ├── /dashboard/creator/* (45 Routes: Phases 1–6, Studio, AI, Deals)
                    ├── /dashboard/entrepreneur/* (38 Routes: Phases 1–10, Cap Table, Diligence)
                    ├── /dashboard/investor/* (20 Routes: Diligence Dataroom, Term Sheets, Portfolio)
                    ├── /dashboard/serviceprovider/* (13 Routes: Services, Workroom, Leads, Earnings)
                    ├── /dashboard/admin/* (35 Routes: Verification, Marketplace, Commerce, Audits)
                    └── /dashboard/profile & /dashboard/privacy
```

---

## 2. Authentication & Route Guard Engine (`AuthGuard.tsx`)

1. **Hydration Phase**:
   - `AuthProvider` reads `localStorage.getItem("token")`.
   - Before backend verification completes (`isBackendVerified === false`), all protected dashboard routes display the loading shell.
2. **Backend Verification Phase**:
   - `api.get("/auth/me")` is executed.
   - The user's role list (`roles[]`) and onboarding phase (`onboardingPhase`) are parsed from the response.
   - If invalid or unauthenticated, the user is redirected to `/login`.
3. **Universal Phase 1 Gate**:
   - If `user.onboardingPhase === 0`, any attempt to navigate to `/dashboard/*` (except legacy whitelist paths) triggers an immediate redirect to `/onboarding`.
4. **Role Gating & Route Protection**:
   - URL path role is extracted: `/dashboard/[role]/*`.
   - Case-normalization redirects uppercase paths (e.g. `/dashboard/Entrepreneur` -> `/dashboard/entrepreneur`).
   - If the user does not hold the path's role in their verified `roles[]` list, they are redirected to their canonical primary role dashboard.

---

## 3. Domain Route Inventories

### Domain Summary Table

| Domain Module | Total Routes | Path Prefix | Authentication Required? | Primary Persona |
|---|---|---|---|---|
| **PUBLIC** | 23 | `/`, `/pricing`, `/for-*` | No | Visitors, prospective users |
| **AUTH** | 4 | `/(auth)/*` | No | Unauthenticated users |
| **ONBOARDING** | 10 | `/onboarding/*` | Yes | All new users (Phase 0) |
| **CREATOR** | 45 | `/dashboard/creator/*` | Yes (Role: Creator) | Creators / Idea Owners |
| **ENTREPRENEUR** | 38 | `/dashboard/entrepreneur/*` | Yes (Role: Entrepreneur) | Founders / Builders |
| **INVESTOR** | 20 | `/dashboard/investor/*` | Yes (Role: Investor) | Angel / VC Investors |
| **SERVICE PROVIDER** | 13 | `/dashboard/serviceprovider/*`| Yes (Role: ServiceProvider)| Designers, Engineers, Legal |
| **ADMIN** | 35 | `/dashboard/admin/*` | Yes (Role: Admin/SuperAdmin) | Platform Operators |
| **MARKETPLACE** | 5 | `/marketplace/*` | Mixed (Public browse, Private buy) | All Personas |
| **PROFILE** | 3 | `/profile/*`, `/dashboard/profile` | Mixed | Public & Authenticated |
| **DASHBOARD SHELL**| 2 | `/dashboard`, `/dashboard/privacy` | Yes | All Authenticated Users |
| **TOTAL** | **198** | — | — | — |

---

## 4. Key Reusable Component Layers

```
src/components/
├── ui/                     # 38 Primitive Shadcn components (Button, Dialog, Input, Table, etc.)
├── layout/                 # AppSidebar, Topbar, AuthGuard, LanguageSwitcher, MobileNav, Breadcrumbs
├── creator/                # AI Clarifier modal, Phase progress stepper, Branding palette editor
├── entrepreneur/           # Cap Table grid, ESOP calculator, Diligence room upload, KPI tracker
├── investor/               # Term sheet interactive builder, Match score card, Portfolio card
├── serviceprovider/ui/     # Custom SP design system (SpCard, SpMetricCard, SpPage, SpStatusBadge)
├── marketplace/            # ProjectCard, ServiceListingCard, FilterBar, BuyoutOfferModal
└── shared/                 # NotificationBell, MessageDrawer, RichTextDisplay, DocumentPreview
```

### Component Integrity Flags
- **Custom Design System**: The Service Provider dashboard strictly enforces its own UI design system located at `src/components/serviceprovider/ui/` (`SpCard`, `SpMetricCard`, `SpPage`). Raw shadcn cards are bypassed in SP views to preserve visual consistency with Figma specifications.
- **Dynamic Imports**: Heavy third-party UI dependencies such as `react-quill-new` (rich-text document editor in `/create-project` and business plan tools) use `next/dynamic` with `ssr: false` to avoid React hydration mismatches.

---

## 5. Canonical Global Website Screen-Size & Layout Architecture

The entire Mondial Business Creation (MBC) website follows a unified global screen-size and layout hierarchy enforced at the root application layer.

### A. Authoritative Breakpoints

```text
< 768px
→ Mobile (persistent sidebar hidden, drawer sheet nav, full-width main)

768px–1023px
→ Tablet (persistent sidebar hidden, drawer sheet nav, full-width main)

1024px–1439px
→ Compact Desktop / Tablet Landscape (persistent 264px sidebar, remaining column = Viewport - 264px)

1440px–1919px
→ Full Desktop (persistent 264px sidebar, remaining column = Viewport - 264px)

>= 1920px
→ Entire MBC application frame capped at 1920px and horizontally centered
```

### B. Global Layout Hierarchy

```text
Root Application (src/app/layout.tsx)
↓
Global MBC Application Frame (width: 100%, max-width: 1920px, min-width: 0, centered)
↓
Route Layout (dashboard/layout.tsx, public layout, auth layout)
↓
Page
↓
Semantic Internal Content Container (max-w-7xl, max-w-5xl, max-w-4xl, or full-width workspace)
```

### C. Dashboard Shell Geometry
- **Complete Frame Maximum**: `Sidebar (264px) + Topbar + Main Content = maximum 1920px`. The 1920px maximum represents the complete application frame, not an independent constraint on Main content.
- **Navigation Breakpoint**:
  - `< 1024px`: Persistent sidebar hidden; existing Radix `Sheet` drawer navigation active; main content consumes full available width.
  - `≥ 1024px`: Persistent `264px` sidebar (`w-(--sidebar-width)`).
- **Ultrawide Docking (e.g. 2560px)**:
  - Outer frame: `1920px` width, centered with `320px` left margin and `320px` right margin.
  - Fixed sidebar docks at `left: 320px` inside the 1920px shell (`left: max(0px, calc((100vw - 1920px) / 2))`).
  - Dashboard column (`Topbar` + `Main`): `1656px` width (`1920px - 264px`).

### D. Public Website Architecture
- Public pages (Homepage, Marketing, Pricing, Marketplace, Auth, Onboarding, Profiles) inherit the root `1920px` centered frame.
- Internal semantic content remains contained inside readable containers (`max-w-7xl` = 1280px, `max-w-5xl` = 1024px, auth card = `max-w-md`) rather than stretching across 1920px.

### E. Brand Studio Responsive Normalization
- The proposed 3-pane redesign was **CANCELLED**.
- Existing Brand Studio architecture, user journey, modal workflows, cards, and state machines remain preserved.
- Responsive stream sizing:
  - `< 1024px`: Fluid available width
  - `1024px–1279px`: `max-w-4xl` (896px)
  - `1280px–1535px`: `max-w-5xl` (1024px)
  - `≥ 1536px`: `max-w-6xl` (1152px)
- Nested vertical scrollbar pathology eliminated.

### F. Theme System
- Reuses existing `next-themes` provider without duplicating state.
- Global `ThemeToggle` integrated into the shared dashboard `Topbar` across all roles (Creator, Entrepreneur, Investor, Service Provider desktop/mobile, and Phase 2 Topbar).

### G. Validation Summary
- **TypeScript (`npx tsc --noEmit`)**: 0 errors
- **Unit/Integration Tests (`npm run test`)**: 120/120 test files passed (1,036 tests passed)
- **Production Build (`npm run build`)**: 181/181 static and dynamic routes compiled successfully
- **Playwright Viewport Regression**: 18 layout families × 12 viewports (216 test runs) = **0 failures**

---

## 6. Creator Phase 3 Layout Architecture — FINAL / FROZEN

All Creator Phase 3 routes (`/dashboard/creator/phase-3/**`) have been normalized to use the **FULL AVAILABLE DASHBOARD MAIN WIDTH**, operating strictly inside the frozen global MBC screen-size architecture without modifying the root layout, sidebar, or global 1920px frame.

### A. Canonical Phase 3 Outer Width Rule
Every Phase 3 outer page container uses:
```css
w-full max-w-none min-w-0
```
Outer page clamps (`max-w-4xl`, `max-w-5xl`, `max-w-6xl`, `max-w-7xl`, `mx-auto`) have been removed from page shells.

### B. Removed Bottlenecks
1. **`Phase3SetupShell.tsx`**: Removed `fullWidth ? "max-w-6xl" : "max-w-5xl"` and `mx-auto`. Container is now `w-full max-w-none flex-1 flex flex-col min-w-0`. Children wrapper enforces `w-full min-w-0`.
2. **`business-model/page.tsx`**: Removed `<div className="w-full max-w-7xl mx-auto space-y-8 pb-12">`. Replaced with `w-full min-w-0 max-w-none space-y-8 pb-12`.
3. **`formation/page.tsx`**: Removed `contentClassName="mt-8 space-y-6 max-w-5xl mx-auto"`. Replaced with `contentClassName="mt-8 space-y-6 w-full min-w-0 max-w-none"`.
4. **`complete/page.tsx`**: Removed outer `<PageContainer variant="focused">` (`max-w-4xl mx-auto`). Replaced with `w-full min-w-0 max-w-none flex flex-col gap-8`.
5. **`LegalRequirementCanvas.tsx`**: Added `min-w-0` to `flex-1` canvas containers (`flex-1 min-w-0 space-y-6`) to prevent flexbox automatic minimum width clamping.

### C. Intentional Inner Width Exceptions
- **Header Typography**: Centered header titles/subtitles in `Phase3SetupShell` maintain `mx-auto max-w-3xl` for comfortable typographic readability. Left-aligned headers are full width.
- **Business Plan Document**: The 12-column grid (`lg:col-span-4` document index, `lg:col-span-8` document canvas) preserves comfortable reading line lengths for long-form narrative paragraphs without clamping the outer page.
- **Completion Cards**: Outer page is `w-full min-w-0 max-w-none`; inner diagnostic evaluation cards and deduction cards are centered at `max-w-4xl mx-auto`.
- **Pre-Generation / Loading States**: Initial setup/loading cards retain focused centered widths (`max-w-xl` to `max-w-3xl mx-auto`).
- **Financial Tables**: Tables in `/forecast` use local `overflow-x-auto min-w-0` for multi-column data, preventing document-level horizontal scroll.

### D. Route Inventory & Status Classification

| Route | Page Component | Shell / Outer Container | Page Type | Status Classification | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/dashboard/creator/phase-3` | `page.tsx` | Index redirect | `OTHER` | `LAYOUT VERIFIED / FROZEN` | Redirects to Step 3.1 |
| `/dashboard/creator/phase-3/market-study` | `market-study/page.tsx` | `Phase3SetupShell` | `ANALYTICS` | `LAYOUT VERIFIED / FROZEN` | Full width analytics, TAM/SAM/SOM funnel |
| `/dashboard/creator/phase-3/business-model` | `business-model/page.tsx` | `Phase3SetupShell` | `GRID` | `LAYOUT VERIFIED / FROZEN` | Progressive responsive grid (1-col <768px, 2-col 768px–1279px with full-width Value Prop, 3-col 1280px–1727px with 2-col Customer Segments, 5-col >=1728px). Usable card widths >=240px across all desktop widths. Root overflow: 0px. |
| `/dashboard/creator/phase-3/forecast` | `forecast/page.tsx` | `Phase3SetupShell` | `DATA TABLE` / `ANALYTICS` | `LAYOUT VERIFIED / FROZEN` | Full width charts (`ResponsiveContainer width="100%"`), local `overflow-x-auto` table |
| `/dashboard/creator/phase-3/compliance` | `compliance/page.tsx` | `Phase3SetupShell` | `WORKSPACE` | `LAYOUT VERIFIED / FROZEN` | Center canvas normalized: 800px at 1440px, 960px at 1600px, 744px at 1728px, 936px at 1920px. AI Guide rail collapses to on-demand Sheet on 1024px–1727px and docks permanently on >=1728px (3xl). Root overflow: 0px. |
| `/dashboard/creator/phase-3/formation` | `formation/page.tsx` | `Phase3SetupShell` | `FORM` | `LAYOUT VERIFIED / FROZEN` | Entity structure cards, skills assessment grid |
| `/dashboard/creator/phase-3/business-plan` | `business-plan/page.tsx` | `Phase3SetupShell` | `DOCUMENT` | `LAYOUT VERIFIED / FROZEN` | Full width 12-col layout; readable document body |
| `/dashboard/creator/phase-3/complete` | `complete/page.tsx` | `w-full min-w-0` | `COMPLETION` | `LAYOUT VERIFIED / FROZEN` | Full width outer shell; focused inner audit cards (`max-w-4xl mx-auto`) |

### E. Measured Geometry Matrix

| Viewport | Dashboard Main Width | Main Horizontal Padding | Phase 3 Outer Width | Available Content Width | Document Overflow |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **768px** | `768px` | `24px / 24px` | `720px` | `720px` | **0px** |
| **1024px** | `760px` | `32px / 32px` | `696px` | `696px` | **0px** |
| **1440px** | `1176px` | `32px / 32px` | `1112px` | `1112px` | **0px** |
| **1600px** | `1336px` | `32px / 32px` | `1272px` | `1272px` | **0px** |
| **1920px** | `1656px` | `32px / 32px` | `1592px` | `1592px` | **0px** |
| **2560px** | `1656px` | `32px / 32px` | `1592px` | `1592px` | **0px** |

---

## 7. Creator Phase 3 Compliance Internal Responsive Architecture

The internal 3-pane layout of `/dashboard/creator/phase-3/compliance` has been normalized to resolve center canvas compression between 1024px and 1727px while maintaining the frozen outer architecture and 100% feature parity.

### A. Responsive Pane Rules
- **Below 1024px (< lg)**: Existing stacked/mobile behavior is preserved: `LegalStageNavigation` (top) → `LegalRequirementCanvas` (middle) → `LegalAiGuideRail` (bottom).
- **1024px–1727px (lg to < 3xl)**: Left `LegalStageNavigation` (288px) remains docked for immediate stage switching; primary `LegalRequirementCanvas` (`flex-1 min-w-0`) expands to claim full remaining width; `LegalAiGuideRail` collapses into an on-demand slide-over `Sheet` (`@/components/ui/sheet`) accessible via compact `AI Guide` buttons in the header switcher and selected requirement card.
- **>= 1728px (>= 3xl)**: `LegalAiGuideRail` docks permanently as the 3rd right pane (320px), because the available width (>= 1400px) comfortably accommodates the center canvas at >= 744px (exceeding the >= 720px minimum comfort threshold).

### B. Empirical Compliance Geometry Matrix (10 Viewports)

| Viewport | Available Phase 3 Width | Left Rail | Center Canvas | AI Rail State | AI Rail Width | Root Overflow |
| :--- | :---: | :---: | :---: | :--- | :---: | :---: |
| **768x1024** | 720px | 256px | 720px | Stacked (Mobile) | 720px | **0px** |
| **1024x768** | 696px | 288px | 384px | Collapsed (Sheet Trigger) | Collapsed (On-demand) | **0px** |
| **1280x800** | 952px | 288px | 640px | Collapsed (Sheet Trigger) | Collapsed (On-demand) | **0px** |
| **1366x768** | 1038px | 288px | 726px | Collapsed (Sheet Trigger) | Collapsed (On-demand) | **0px** |
| **1440x900** | 1112px | 288px | **800px** | Collapsed (Sheet Trigger) | Collapsed (On-demand) | **0px** |
| **1536x960** | 1208px | 288px | 896px | Collapsed (Sheet Trigger) | Collapsed (On-demand) | **0px** |
| **1600x900** | 1272px | 288px | **960px** | Collapsed (Sheet Trigger) | Collapsed (On-demand) | **0px** |
| **1728x1117** | 1400px | 288px | **744px** | Docked (3-Pane) | 320px | **0px** |
| **1920x1080** | 1592px | 288px | **936px** | Docked (3-Pane) | 320px | **0px** |
| **2560x1440** | 1592px | 288px | **936px** | Docked (3-Pane) | 320px | **0px** |

### C. Sheet Verification
- Slide-over sheet width: 448px (`sm:max-w-md`)
- Local inner scroll ownership: Sheet has its own vertical scroll (`overflow-y-auto`); page vertical scroll remains owned by Dashboard Main.
- Root horizontal overflow with Sheet open: **0px**.

---

## 8. Creator Phase 3 Business Model Internal Responsive Architecture

The internal responsive grid layout of `/dashboard/creator/phase-3/business-model` has been normalized to resolve premature 5-column card compression at 1024px and 1440px, while strictly preserving the 9-block Osterwalder canvas semantics, DOM order, AI features, and zero root overflow.

### A. Root Cause
The canvas previously used `lg:grid-cols-5`, which activated 5 columns immediately at 1024px.
- At 1024px (696px available width): 5 columns yielded ~139px gross / ~99px usable width (severely compressed).
- At 1440px (1112px available width): 5 columns yielded ~222px gross / ~182px usable width (below the 220px usable target).

### B. Progressive Responsive Grid Rules
1. **Row 1 Canvas Grid**: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-5 gap-px bg-border min-w-0`
   - `< 768px (Mobile)`: 1 column. All cards stack naturally in DOM order.
   - `768px–1279px (Tablet & Compact Desktop)`: 2 columns.
     - Row 1: Key Partners (col 1), Key Activities & Resources (col 2).
     - Row 2: Value Propositions (`col-span-1 md:col-span-2 xl:col-span-1` — spans full 2 columns as the central value hero).
     - Row 3: Customer Relationships & Channels (col 1), Customer Segments (col 2).
     - Result at 1024px: 348px gross / 308px usable (Value Prop: 696px gross / 656px usable).
   - `1280px–1727px (Desktop)`: 3 columns.
     - Row 1: Key Partners (col 1), Key Activities & Resources (col 2), Value Propositions (col 3).
     - Row 2: Customer Relationships & Channels (col 1), Customer Segments (`col-span-1 xl:col-span-2 3xl:col-span-1` — spans 2 columns to fill row 2 evenly).
     - Result at 1440px: 370px gross / 330px usable (Customer Segments: 741px gross / 701px usable).
     - Result at 1600px: 424px gross / 384px usable.
   - `>= 1728px (Full Desktop & Ultrawide / 3xl)`: 5 columns.
     - All 5 blocks reset to `col-span-1`.
     - Result at 1728px: 280px gross / 240px usable.
     - Result at 1920px: 318px gross / 278px usable.
2. **Hairline Dividers**: Replaced fragile `divide-x lg:divide-y-0` with `gap-px bg-border` and `bg-card` on all cells. This guarantees uniform 1px borders horizontally and vertically across all wrapping breakpoints without orphaned lines.
3. **Row 2 (Financials)**: `grid grid-cols-1 md:grid-cols-2 gap-px bg-border border-t border-border`. Cost Structure and Revenue Streams evenly split available width.
4. **Unit Economics Strip**: Dedicated 4-card metric strip (`CAC`, `LTV`, `LTV / CAC` with healthy ratio badge, and `ESTIMATED PAYBACK`) accompanied by "Calibrated based on benchmarks" subheader, rendered across responsive grid cards with monospace font numerals (`font-mono`).
5. **Completion Checklist & Footer Action Row**: Clean "STEP COMPLETE" checklist card featuring 5 verified milestone checkboxes, followed by the action footer with "Back" (returns to Step 3.1 Market Study) and "Build Financial Forecast" triggers (while "Regenerate" is maintained in the header actions bar). *(Note: Legacy pricing tiers table and assumptions register not present in Figma Node `57156:8456` were cleanly removed to achieve 1:1 design fidelity).*

### C. Empirical Business Model Geometry Matrix (10 Viewports)

| Viewport | Phase 3 Available Width | Columns | Gross Card Width | Usable Card Width | Value Prop Usable | Document Overflow |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **768x1024** | 720px | 2 | 360px | 320px | 680px (span 2) | **0px** |
| **1024x768** | 696px | 2 | **348px** | **308px** | **656px** (span 2) | **0px** |
| **1280x800** | 952px | 3 | 317px | 277px | 277px | **0px** |
| **1366x768** | 1038px | 3 | 346px | 306px | 306px | **0px** |
| **1440x900** | 1112px | 3 | **370px** | **330px** | **330px** | **0px** |
| **1536x960** | 1208px | 3 | 402px | 362px | 362px | **0px** |
| **1600x900** | 1272px | 3 | **424px** | **384px** | **384px** | **0px** |
| **1728x1117** | 1400px | 5 | **280px** | **240px** | **240px** | **0px** |
| **1920x1080** | 1592px | 5 | **318px** | **278px** | **278px** | **0px** |
| **2560x1440** | 1592px | 5 | **318px** | **278px** | **278px** | **0px** |

---

### D. Step 3.3 Financial Forecast Architecture (Figma Node 57157:9297)

Following Figma Node `57157:9297` (`Financial Forecast · Creator Phase 3.3`), Step 3.3 is structured as a continuous 8-section financial command dashboard replacing legacy tabbed navigation:

1. **Header Bar & Persistent Actions (Section 1)**:
   - Eyebrow: `STEP 3.3 · FINANCIAL FORECAST`
   - Title: `Your 3-year financial forecast`
   - Subtitle: `36 months · Months 1–12 modelled, 13–36 projected · EUR`
   - Persistent Actions: `Download report` (PDF preview overlay) and `Regenerate` button with live credit balance pill (`Uses 32 credits · balance [X]`).
2. **Conditional Out-of-Date Alert Strip (Section 2)**:
   - Activates when live simulation operational drivers deviate from last saved run: *"Assumptions changed since last run — results may be out of date. Click Regenerate to update forecast projections."*
3. **Executive Verdict Hero Card (Section 2.5)**:
   - High-impact milestone headline highlighting dynamically computed Break-even Month (`M{breakEvenMonth}`) and Loss Recovery Month (`M{lossRecoveryMonth}`), budget exhaustion runway, and funding gap calculation with dynamic badge (`Funding gap` in warm amber or `Fully funded` in emerald). When zero funding gap exists, displays affirmative operational runway without deficit.
4. **Three Summary Cards (Section 3 — Figma Node 57157:9348)**:
   - Encapsulated in `rounded-[20px] p-6 bg-card border border-border shadow-sm` cards conforming to system tokens and typography canon.
   - `REVENUE`: Net growth badge (`+X% Y1→Y3`), Year 3 ARR run-rate stat (`€X ARR (Y3)`), Y1/Y2/Y3 mini-breakdown pills, and custom 341x112 SVG area chart (`RevenueAreaSvg`) featuring:
     - Solid line for Months 1–12 (`Modelled`).
     - Dashed line (`strokeDasharray="4 3"`) for Months 12–36 (`Projected`).
     - Month 12 vertical divider line with `M12` and `Modelled / Projected` typography.
     - On-curve break-even indicator dot and floating pill badge `M{breakEvenMonth} break-even`.
   - `COST VS REVENUE`: Revenue vs Total Cost dual curves (`CostVsRevenueCrossingSvg`), drop line at break-even month with outer/inner circle dot and floating badge `€{breakEvenRevenue} ({breakEvenSubs} subs)`, Inflection Point stat (`Month {x}`), and break-even subscriber callout.
   - `CASH POSITION`: Deficit duration badge (`Deficit: M{x}–M{y}` or `Fully funded`), lowest cash point stat (`−€{minCumulative}` or `Cash positive`), and liquidity trajectory chart (`Cash36BarSvg`) featuring:
     - 36 individual vertical bars with 5.7px width and 9.47px pitch across a 341px SVG viewport.
     - Horizontal zero baseline with negative/positive value distribution.
     - Quad-color semantic coding: slate bars for initial cash, warm amber (`#965F11`) for deficit, vibrant amber (`#D97706`) for the lowest cash month, and teal (`#0D9488`) for positive cash flow.
     - Dotted vertical callouts for `Budget runs out · M{x}` and `Cash positive · M{y}`.
5. **Assumptions & Live Simulation Parameters Grid (Section 4)**:
   - Responsive 8-card operational driver grid: Starting budget, Subscribers at launch, New subscribers % MoM, Monthly churn %, Price per subscriber (Linked from 3.2), Variable cost/sub, Fixed costs/mo, and Market size TAM (Linked from 3.1 with reset trigger).
   - Real-time parameter tweaking dynamically recalculates all 36 months, break-even, and runway, with live warning banners for tight economics, high growth, and churn risks.
6. **Continuous 36-Month Consolidated Data Table (Section 5)**:
   - Direct, continuous 10-column table across 36 months: `MONTH`, `SUBSCRIBERS`, `REVENUE`, `FIXED COST`, `VARIABLE COST`, `TOTAL COST`, `NET CASH FLOW`, `CUMULATIVE`, `CASH ON HAND`, `NOTES`.
   - Distinct year grouping headers (`YEAR 1 · MODELLED`, `YEAR 2 · PROJECTED`, `YEAR 3 · PROJECTED`) and subtotal rows (`Y1 SUBTOTAL`, `Y2 SUBTOTAL`, `Y3 SUBTOTAL`).
   - Milestone highlight tags: `Budget runs out`, `Lowest cash point`, `Break-even`, `Cash positive again`, `All losses recovered`.
7. **Break-Even & Unit Economics Side-by-Side (Section 6)**:
   - Left: Break-even analysis with 4 key metrics, narrative analysis, and exact contribution margin formula breakdown.
   - Right: Unit economics with CAC, LTV, LTV/CAC (Healthy badge), Payback period, Gross margin %, and Month 1 Burn.
8. **Key Assumptions & Risk Assessment (Section 7)**:
   - Left: 7 key model assumptions tagged with provenance badges (`YOUR INPUT`, `FROM 3.2`, `MODEL`).
   - Right: 4-tier risk assessment matrix with severity badges (Funding risk, Growth shortfall, Subscriber retention, Delivery cost) dynamically driven by model parameters.
9. **Milestones Complete & Navigation Footer (Section 8)**:
   - Step Complete checklist (6/6 milestones verified).
   - Navigation footer: `Business Model` Back button (navigates to Step 3.2 `/dashboard/creator/phase-3/business-model`), and `Continue to Legal & Compliance` button (navigates to Step 3.4 `/dashboard/creator/phase-3/compliance`).
10. **Zero-Mock & Complete Mathematical Reconciliation**:
    - All metrics, charts, and table rows are 100% dynamic, computed on the fly from live database session data and simulated operational drivers.
    - Zero static fallback data across all sections: starting budget is read directly from session state, TAM is dynamically parsed from Step 3.1, break-even and runway reflect true calculated values, and cumulative net cash flow matches across every visualization.
11. **Dedicated Financial Forecast PDF Export (`ForecastPrintView.tsx`)**:
    - Triggered via 'Download report' button in the Step 3.3 header bar and 'Export PDF' in the Creator Asset Library.
    - Strictly contains 100% Step 3.3 financial forecast data with zero business plan contamination (all Executive Summary, Problem & Solution, Target Market, GTM, Operations, and Legal frameworks from other steps are cleanly excluded).
    - Design mirrors the Step 3.3 screen layout with 100% pixel fidelity: Executive Verdict Hero Card, Three Summary Cards with vector SVGs (`RevenueAreaSvg`, `CostVsRevenueCrossingSvg`, `Cash36BarSvg`), 8-card operational assumptions grid, continuous 36-month consolidated table with year headers and subtotals, break-even & unit economics side-by-side cards, 4-tier risk assessment matrix, transparent brand logo, and print CSS page-break isolation.

---

## 7. Creator Navigation & Brand Studio Architecture — FINAL / FROZEN

### A. Creator Navigation Architecture (MVP Scope)
- **Hierarchical Structure**: Creator sidebar is configured in `src/lib/menu.ts` and rendered via `AppSidebar.tsx`:
  1. `Dashboard` (`Overview`, `My Ideas`)
  2. `Project Workspace`
     - `Build My Project` (9 submenus: `AI Studio`, `Brand Studio`, `Market Study`, `Business Model`, `Financial Forecast`, `Legal & Compliance`, `Company Formation`, `Business Plan`, `Project Readiness`)
     - `Launch Preparation` (9 canonical unnumbered submenus: `Construction Snapshot`, `Operational Roadmap`, `Needs & Requirements`, `Skills & Training`, `Aids, Grants & Support`, `Pricing & Revenue Model`, `GTM & Launch Strategy`, `Launch Assets`, `Construction Readiness`)
     - `Assets & Documents` (2 submenus: `IP Vault & Legal`, `Asset Library`)
  3. `Communication` (`Messages`, `Notifications`)
  4. `Account` (`Profile`, `Settings`, `Billing History`)
- **MVP Deferred Groups (Retained as Comments)**:
  - `Launch to Market` (Market Crossroads, Marketplace, Partnerships, Sales & Buyouts, Growth & Readiness) and `Services & Network` (Hire Providers, Active Engagements) are deferred beyond Creator MVP and commented out in `src/lib/menu.ts`.
  - All underlying routes, APIs, and data stores remain preserved in the codebase for post-MVP reactivation.
- **Completed Phase 4 Next Action (MVP Alignment)**:
  - When all 9 Phase 4 steps are completed, the dashboard serves the available MVP Next Action: *"Review your launch preparation"* pointing to `/dashboard/creator/phase-4?ideaId={activeIdeaId}`.
  - **Restoration Requirement**: Reactivating Crossroads in post-MVP releases requires replacing the MVP review fallback appropriately in `CreatorDashboardService.cs` (`ResolveNextAction`) as well as uncommenting the menu groups in `src/lib/menu.ts`.
- **Canonical Routing & Aliases**: Internal workflow routes map cleanly to canonical sidebar destinations via `CREATOR_ROUTE_ALIASES` in `src/lib/menu-navigation.ts` (e.g. `/branding`, `/logo-tool`, `/brand-kit`, `/complete` all resolve to `Brand Studio`; `/dashboard/creator/phase-4/assets` resolves to `Launch Assets`).
- **Clarifier Workflow**: Clarifier steps retain parent `Build My Project` active/expanded context without activating child links.

### B. Brand Studio Architecture
- **Control Center Principle**:
  - **Page = persistent overview / control center** (View Mode)
  - **Modals = creation and editing tools**
- **Legacy Progress Topbar Removed**:
  - The persistent wizard-style topbar (`BrandStudioProgressBar`) has been removed from `/dashboard/creator/phase-2/brand-studio`.
  - Removed elements: Back button, INSTALY, Visual Identity Studio, Strategy, Direction, Logo type, Logo, Colour, Typography, Studio Live, step icons, progress connectors, active/locked state styling, connecting lines, and the `VIEW MODE` badge.
- **Streamlined Header**:
  - Title: `Brand Studio`
  - Subtitle: `Your Visual Identity — Review and manage your complete brand identity.`
- **Removed UI-Only State**:
  - Obsolete topbar-only state and handlers removed from `BrandStudioShell.tsx`: `inFlightStatus`, `stepSegments`, `currentProgressBarKey`, `handleSelectStep`, `handleBackNavigation`.
  - Redundant `onBack` handler removed from `page.tsx`.
  - Core modal orchestration state (`activeModal`, `isSequentialFlow`) is preserved.
- **Workflow Orchestration**:
  - **Brand-New Creator (No Meaningful Brand Data)**:
    `Brand Studio loads` → `BrandKit resolves` → `no meaningful brand data` → `StrategyReviewModal auto-opens` → `Visual Direction` → `Logo Type` → `Logo Creation` → `Logo Variations` → `Color System` → `Typography` → `Brand Studio View Mode`.
  - **Existing / Partial Brand**:
    `Brand Studio loads` → `meaningful data exists` → `View Mode renders directly` → `no modal auto-opens`. Missing sections show `IncompleteSectionCard` with action buttons.
  - **Edit Existing Section**:
    `View Mode` → `Creator clicks Edit` → `corresponding modal only opens` → `Save` → `modal closes` → `updated View Mode`.

### C. Test Verification Baseline
- **Creator Navigation Suite**: `192/192` (`npx tsx`)
- **Brand Studio Entry & Orchestration**: `31/31` (`npx tsx`)
- **Brand Studio View Mode & UI**: `42/42` (`npx tsx`)
- **Creator Stabilization 02**: `8/8` (`npx vitest run`)
- **Menu Navigation & Submenu Tests**: `25/25` (`vitest`)
- **Creator Dashboard Command Center Tests**: `7/7` (`vitest`)
- **Backend Creator Phase 4 & Dashboard Tests**: `302/302` (`dotnet test`)

### D. Creator Dashboard Zero-State & Resilient Routing
- **Zero-State Command Center**: When an authenticated creator has 0 business ideas (`ideas.length === 0`), `/dashboard/creator` displays a specialized zero-state welcome command card offering direct paths:
  1. `Create Your First Idea`: Mints a blank idea and activates it seamlessly.
  2. `Brainstorm with AI Clarifier`: Navigates to `/dashboard/creator/phase-2/clarifier`.
  3. `View Idea Vault`: Navigates to `/dashboard/creator/myideas`.
  4. `Path from Concept to Liquidity`: 4-phase preview cards explaining Phases 2–5.
- **Resilient Context Fallback**: In `CreatorDashboardService`, invalid or stale `ideaId` references automatically fall back to the active idea rather than throwing 403 Forbidden errors, ensuring high uptime and uninterrupted user journeys.

### E. Creator Single-Active-Idea Cross-Tab Synchronization Architecture

- **Canonical Product Rule**:
  - A user may own multiple business ideas, but works on only **ONE** selected idea at a time.
  - All open Creator workspace tabs within the same browser session follow the active idea selection.
  - Example: If Tab 1 is open to Pricing and Tab 2 is open to Launch Assets for Idea A, and the user switches to Idea B in Tab 1, Tab 1 navigates to Pricing for Idea B and Tab 2 automatically reloads its Launch Assets view for Idea B.
- **Authoritative Selection vs. Notification Signal**:
  - **Authoritative Source of Truth**: MongoDB collection `CreatorJourneys`, field `ActiveIdeaId` (persisted per authenticated user).
  - **Decoupled Account Read**: `creatorJourneyApi.getAccountJourney()` issues parameter-less `GET /api/creator/journey`, guaranteeing retrieval of the authoritative account selection without injecting module-level `workspaceIdeaId`. Existing idea-scoped reads (`creatorJourneyApi.get(ideaId)`) remain fully supported.
  - **Lightweight Notification Payload**: Upon explicit switch (`setActiveIdea`) or new idea creation (`createIdea`), `notifyActiveIdeaChanged` writes a notification payload to `localStorage.setItem('mondial_active_idea_signal', ...)`:
    ```typescript
    interface ActiveIdeaSignalPayload {
      ideaId: string;
      userId: string | null;
      timestamp: number;
      tabId: string;
    }
    ```
  - **Non-Authoritative Signal**: Receiving tabs **never** treat the `localStorage` signal payload as the authoritative selection. It functions strictly as a wakeup notification.
- **Headless Tab Coordination (`CreatorActiveIdeaSync.tsx` & `creator-tab-sync.ts`)**:
  - Headless `<CreatorActiveIdeaSync />` is mounted inside `src/app/dashboard/creator/layout.tsx`.
  - On window `storage` events, the listener:
    1. Ignores events originating from the same tab (`payload.tabId === getTabId()`).
    2. Ignores events from other accounts (`payload.userId !== currentUserId`).
    3. Drops stale or out-of-order notifications (`payload.timestamp <= lastHandledTime`).
    4. Limits execution strictly to Creator routes (`window.location.pathname.startsWith('/dashboard/creator')`).
    5. Re-reads the authoritative backend selection via `creatorJourneyApi.getAccountJourney()`.
    6. If `authoritativeId !== currentDisplayedIdeaId`, cancels pending uncommitted saves and performs a full-page reload via `window.location.replace(buildReloadUrlForNewIdea(...))`.
- **Route Retention & URL Reconstruction (`buildReloadUrlForNewIdea`)**:
  - Retains the current page route and URL hash.
  - Sets or updates `?ideaId={authoritativeId}`.
  - Removes deprecated `?idea=` query parameters.
  - Preserves unrelated query parameters (e.g. `preview=true`).
- **Unsaved Input Policy & Save Cancellation Guards**:
  - **Policy**: Unsaved inputs are deliberately discarded upon an active idea switch; no draft preservation, autosave-before-switch, or confirmation modals are presented.
  - **Save Cancellation Coordination**: `cancelAllPendingSaves()` sets module flag `isTabReloadingForSwitch = true` and invokes all callbacks registered via `registerSaveCancellation()`.
  - **Registered Guards**:
    - `useCreatorProgressState.ts`: Clears pending debounce timer `projectSaveTimerRef`, resets accumulated patches `projectPatchRef.current = {}`, and guards `flushProjectPatch` and `updateProject` against firing during reload.
    - `PricingStrategyView.tsx`: Guards `executeSavePrice` and price input `onBlur` so that blur events during DOM destruction do not fire saves.
    - `phase-3/formation/page.tsx`: Guards `handleBeforeUnload` and unmount cleanup from draining the skills queue.
  - **Scope of Cancellation**: This mechanism cancels pending un-dispatched writes and guards event handlers before network dispatch. Writes already in flight across the network to the server are not cancelled and are safely governed by MongoDB optimistic concurrency (`expectedVersion`).
- **Initial Hydration & URL Reconciliation**:
  - `useCreatorProgressState` unifies parsing of both `?ideaId=` and legacy `?idea=`.
  - On initial mount or reload, `getAccountJourney()` resolves the backend selection.
  - If a Creator tab is opened with a stale URL `?ideaId=A` while the account's active idea is `B`, it automatically aligns by replacing the URL to `?ideaId=B`.
  - Stale workspace recovery in `sessionStorage` (e.g. after idea deletion) derives the replacement workspace from authoritative `journey.activeIdeaId`.
- **System Boundaries & Non-Interference**:
  - Bounded strictly to `/dashboard/creator/**`.
  - Public anonymous launch routes (`/p/launch/[token]`) are completely unaffected.
  - Zero backend code, API contract, model, or database schema modifications.

---

## 9. Creator Phase 4 Full-Width Layout & Launch Preparation Architecture — FINAL / FROZEN

### A. Phase 4 Full-Width Architecture
All 9 Creator Phase 4 pages (`/dashboard/creator/phase-4/**` and views) operate with full available dashboard main width without artificial letterboxing clamps (`w-full max-w-none min-w-0 flex-1 flex flex-col`):

1. **Step 4.1 Construction Snapshot** (`/dashboard/creator/phase-4`): Full-width 9-step timeline overview, dynamic metrics, and readiness scorecard.
2. **Step 4.2 Operational Roadmap** (`/dashboard/creator/phase-4/roadmap`): Multi-track execution timeline with task drawers.
3. **Step 4.3 Needs & Requirements** (`/dashboard/creator/phase-4/needs`): Categorized requirement grid with inline confirmation and deferral.
4. **Step 4.4 Skills & Training** (`/dashboard/creator/phase-4/skills`): Skills matrix, resolution modes (Hire, Train, AI Agent), and training resource library.
5. **Step 4.5 Aids, Grants & Support** (`/dashboard/creator/phase-4/support`): Grant and subsidy directory, eligibility match filters, and application tracking.
6. **Step 4.6 Pricing & Revenue Model** (`/dashboard/creator/phase-4/pricing`): Pricing tier builder, market validation evidence provenance, and simulation engine.
7. **Step 4.7 GTM & Launch Strategy** (`/dashboard/creator/phase-4/gtm`): Go-to-market funnel builder, channel selection, and launch budget allocation.
8. **Step 4.8 Launch Assets** (`/dashboard/creator/phase-4/launch-assets` & `/assets`): Asset gallery, version history, and desktop/mobile responsive preview envelopes.
9. **Step 4.9 Construction Readiness** (`/dashboard/creator/phase-4/readiness`): Final readiness audit, milestone gating, and handoff to Phase 5.

### B. Creator Sidebar & Launch Preparation Navigation
- **Single Source of Truth**: Menu structure defined in [`src/lib/menu.ts`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/lib/menu.ts).
- **Group Labeling**:
  - `Launch Preparation`: Houses all 9 canonical unnumbered submenus (4.1–4.9) under `Project Workspace`.
  - `Launch to Market`: Deferred for MVP; commented in menu configuration while retaining underlying routes.
- **Dynamic Context Preservation**: `AppSidebar.tsx` dynamically preserves `ideaId` across all links via `searchParams` without fabricating fallback IDs.
- **Mutual Exclusivity & Exact Matching**: Exact route matching on root `/dashboard/creator/phase-4` ensures nested subpaths highlight strictly their corresponding active step.
- **Route Aliasing**: Both `/dashboard/creator/phase-4/launch-assets` and `/dashboard/creator/phase-4/assets` resolve and highlight Step 4.8.

---

## 10. Bilingual Internationalization (i18n) Engine — Architecture & Conventions

### A. Architectural Strategy
The internationalization system provides native bilingual support for **English (`en`)** and **French (`fr`)** without route-breaking rewrites:
- **Zero URL Rewrites**: Preserves all 198 App Router paths (`/dashboard/creator`, `/login`, etc.) without inserting `/[locale]/` segments. This ensures 100% backward compatibility with authenticated bookmarking, API query caching, external webhooks, and test harnesses.
- **Provider Layer (`src/providers/LanguageProvider.tsx`)**: Global React context wrapped within `RootProviders.tsx`. Exposes `locale`, `setLocale`, translation function `t(key, params)`, and locale-aware formatters (`formatDate`, `formatCurrency`, `formatNumber`).
- **Translation Dictionaries (`src/locales/{en,fr}/*.json`)**: Modular JSON catalogs organized by domain:
  - `common.json`: Shared button labels, status badges, priority levels, date formats.
  - `creator.json`: Creator journey phases, Empty State hero/CTA/roadmap, and Active Journey State (metrics, quick actions, attention cards, AI outputs, communications).
- **Client Hook (`src/hooks/useTranslation.ts`)**: Direct ergonomic hook (`const { t, locale, setLocale, formatCurrency, formatDate } = useTranslation()`) for functional components.

### B. Storage, Synchronization & Hydration
1. **Locale Resolution Priority**:
   - Stored preference in `localStorage.getItem("mondial_locale")`.
   - Cookie preference in `document.cookie` (`mondial_locale=en|fr; path=/; max-age=31536000`).
   - Browser preference fallback: `navigator.language` (if French, defaults to `fr`; otherwise `en`).
   - System baseline fallback: `en`.
2. **DOM Document Sync**:
   - `useEffect` automatically synchronizes `<html lang="en">` or `<html lang="fr">` on locale change for proper screen-reader pronunciation and browser spellcheck behavior.
3. **Storage Persistence**:
   - Updating the locale via `setLocale('fr')` synchronously sets both `localStorage` and a 1-year persistent cookie (`SameSite=Lax`).

### C. Formatting & Translation Capabilities
- **Dot-Notation Key Traversal**: Supports deep nesting such as `t('creator.dashboard.active.title')` and `t('creator.phases.p2.name')`.
- **Parameter Interpolation**: Handles dynamic templates using `{{key}}` syntax (e.g., `t('creator.dashboard.active.greeting', { name: 'Sarah' })`).
- **Fallback Resolution**: If a key is missing in French (`fr`), the engine automatically falls back to English (`en`). If missing in both, it gracefully outputs the raw key string without crashing the UI.
- **Locale-Aware Formatting Helpers**:
  - `formatDate(date, options)`: Formats dates using `Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US')`.
  - `formatCurrency(amount, currency = 'EUR')`: Formats currency amounts with appropriate French (`1 250 000 €`) or English (`€1,250,000`) conventions.
  - `formatNumber(value)`: Number formatting respecting locale decimal and thousands separators.

### D. UI Component: `LanguageSwitcher` (`src/components/layout/LanguageSwitcher.tsx`)
- **Visual Design**: Compact, high-polish dropdown (`🌐 EN ▾ / FR ▾`) adhering to the Mondial UI Design System tokens (`bg-popover`, `text-popover-foreground`, `border-border`, `hover:bg-accent`).
- **Topbar Integration**: Integrated into `src/components/layout/Topbar.tsx` adjacent to the theme toggle (`ThemeToggle`) across standard and Phase 2 dashboard shells.
- **Accessibility**:
  - Supports keyboard Escape key dismissal.
  - Outside-click detection via document listener with clean event unbinding.
  - Clear checkmark indicator on the currently active language.

### E. Current Surface Rollout & Boundary Rules
- **Creator Dashboard Overview (`src/app/dashboard/creator/page.tsx`)**: Fully localized across both states:
  - **Empty / Welcome State**: Hero title, subtitle, 4-phase visual roadmap, IP protection disclaimer, and "Start Your First Idea Now" action.
  - **Active Journey State**: Time-aware greeting ("Bonjour / Welcome back"), 4 primary metric cards (Clarity Score, AI Assets, Legal Readiness, Reports), Project Info card, Attention Items, Creator Journey progress stepper, Phase 5 Gate warning, AI Forecast preview, and Verified Outputs.
- **Phase 1: Profile & Identity Gate (`src/app/dashboard/creator/phase-1/client.tsx`)**: Fully localized onboarding hero, progress indicator, 5 verification milestones, AML/KYC notices, and locked phase tooltips.
- **Phase 2: Project Identity & Branding (`src/app/dashboard/creator/phase-2/*`)**: 100% bilingual localization across all 12 route pages, 1 shared layout footer, and 26 Brand Kit & Brand Studio components verified line-by-line via AST scanning (0 raw text nodes, 0 raw attributes across all 39 Phase 2 files):
  - `phase-2/page.tsx` & `phase-2/layout.tsx`: Localized loading state and transition to Clarifier.
  - `phase-2/clarifier/page.tsx` & `phase-2/clarifier/layout.tsx`: Localized conversation opener, AI fallback prompt, ring progress bands, step indicator labels, input box with keyboard shortcuts, finalize state with long-poll feedback, timeout/parse/service error boundaries, accessible aria labels (`aria.editAnswer`, `aria.copyAnswer`, `aria.saveEdit`, `aria.sendAnswer`), screen-reader text (`sr.errorPrefix`, `sr.assistantTyping`), and Idea Journal.
  - `phase-2/concept-name/page.tsx`: Localized header, suggested names, custom naming form, French Company Registry Search (SIREN / NAF lookup with authentic `Actif`/`Fermé` badges and race-condition guards), category selectors, save error boundary, and skip hints.
  - `phase-2/idea-summary/page.tsx`: Localized structured concept canvas, iDeal Clarity score, synthesis progression, and naming transition CTAs.
  - `phase-2/branding/page.tsx`: Localized AI Brand Studio deliverables checklist, designer hire matching card, and skip branding dialog.
  - `phase-2/hire-designer/page.tsx`: Localized verified designer directory, M50 tier badges, completed projects count, price & delivery estimates, workroom booking action, sector tags fallback (`allSectors`), and auto-sent brief message.
  - `phase-2/logo-tool/page.tsx`: Localized Brand Identity Studio redirection state.
  - `phase-2/brand-kit/page.tsx` & `phase-2/brand-studio/page.tsx`: Localized Brand Kit Hub loading state, uninitialized error boundary, and studio transition action.
  - `phase-2/complete/page.tsx`: Localized Brand Kit summary showcase, palette roles, typography pairings, 4 logo lockup tooltips/alts (`Horizontal Lockup`, `Stacked Lockup`, `Symbol / Icon Mark`, `Wordmark`), strategy snapshot with bilingual fallbacks (`fallbackBrandName`, `fallbackTagline`, `fallbackIndustry`, `fallbackTargetAudience`, `fallbackPositioning`, `fallbackProblem`, `fallbackPersonality`), master lockup image alt, next phase preview (4 tools), and navigation CTAs.
  - `src/components/layout/Phase2Footer.tsx`: Localized shared Phase 2 footer with copyright, Privacy Policy, Support Center, and Terms of Service links.
  - `src/components/creator/brand-kit/BrandStudioShell.tsx` & `BrandKitHubView.tsx`: Full-bleed Brand Studio canvas and 1080px canonical Brand Kit Hub view with complete version management, asset counters, lockup previews, color token swatches, WCAG contrast badges, type specimens, and connected document tags (`creator.phase2.brandKit.shell.*`, `creator.phase2.brandKit.hub.*`).
  - `src/components/creator/brand-kit/BrandStudioProgressBar.tsx` & `MultiScaleIconViewer.tsx`: Step progress tracker (6 stages) and multi-scale vector icon viewer proofs (`creator.phase2.brandKit.bar.*`).
  - 6 Brand Studio Result Cards (`src/components/creator/brand-kit/cards/*`): `ColorsResultCard.tsx`, `DirectionResultCard.tsx`, `LogoResultCard.tsx`, `LogoTypeResultCard.tsx`, `StrategyResultCard.tsx`, and `TypographyResultCard.tsx` (`creator.phase2.brandKit.cards.*`).
  - 9 Brand Studio Widgets & Modals (`src/components/creator/brand-kit/*`): `CascadeWarningModal.tsx`, `CompareOverlay.tsx`, `ConceptTile.tsx`, `InvoiceMockHeader.tsx`, `MicroScaleViewer.tsx`, `ModalWorkflowHeader.tsx`, `RegenerateCapBadge.tsx`, `RestoreSnapshotModal.tsx`, and `VariationTile.tsx` (`creator.phase2.brandKit.modals.*`).
  - 7 Interactive Flow Modals (`src/components/creator/brand-kit/*`): `StrategyReviewModal.tsx`, `DirectionBoardModal.tsx`, `LogoTypeChooserModal.tsx`, `LogoCreationModal.tsx`, `VariationSetModal.tsx`, `ColorSystemModal.tsx`, and `TypographySystemModal.tsx` (`creator.phase2.brandKit.modals.*`).
- **Phase 3: Business Plan Intelligence**: 100% bilingual localization across all 8 route pages and 12 components verified line-by-line via AST scanning (0 raw text nodes, 0 raw attributes across all 20 Phase 3 files):
  - `phase-3/page.tsx`: Localized intelligent milestone resumption loader.
  - `src/components/creator/Phase3SetupShell.tsx`: Localized default step eyebrow ("Phase 3 · Business Plan Intelligence" / "Phase 3 · Intelligence du Business Plan").
  - `phase-3/market-study/page.tsx` & `src/components/creator/MarketStudyPrintView.tsx`: Step 3.1 Market Study with 8 sections, TAM calculator, competitors, customer segments, 5 checklist items, regeneration, continue CTAs, and full bilingual print/PDF view (`creator.phase3.marketStudy.*`, `creator.phase3.marketStudyPrint.*`).
  - `phase-3/business-model/page.tsx` & `src/components/creator/BusinessModelPrintView.tsx`: Step 3.2 Business Model Canvas with 9 building blocks, item counters, completion checklist, regeneration, forecast transition, and full bilingual print/PDF view (`creator.phase3.businessModel.*`, `creator.phase3.businessModelPrint.*`).
  - `phase-3/forecast/page.tsx`, `src/components/creator/ForecastPrintView.tsx`, `src/components/creator/ForecastSummaryCharts.tsx`, & `src/components/creator/PlanForecastPrintView.tsx`: Step 3.3 3-Year Financial Forecast with interactive 36-month P&L model, unit economics, risk assessment, 8 operational drivers, live assumption warnings, 3 summary cards (Revenue, Cost vs Revenue, Cash Position), Section 8 Milestones Complete (6/6 milestones localized), dual print views (Standalone & Plan integrated), and SVG charts (`creator.phase3.forecast.*`, `creator.phase3.forecast.page.*`, `creator.phase3.forecast.charts.*`, `creator.phase3.planForecastPrint.*`).
  - `src/components/creator/forecast/ForecastAssumptionsModal.tsx`: Forecast Assumptions modal/page form with dynamic archetype drivers, credit cost badges, active model banner, driver labels, validation error messages, and calculation CTAs (`creator.phase3.forecast.assumptions.*`).
  - `phase-3/compliance/page.tsx` & `src/components/creator/legal/LegalFigmaStageSection.tsx`: Step 3.4 Statutory Legal & Compliance Roadmap for France with chronological stage tabs (`before_register`, `register_launch`, `running_business`), expandable requirements with why/when/what guidance, official guidance card, and `markedDone` state tracking (`creator.phase3.compliance.*`, `creator.phase3.legal.*`).
  - `src/components/creator/Phase3LegalCard.tsx`: Dashboard legal readiness card, stale signal detection banner, planning progress bar, stage counts, and archetype chips (`creator.phase3.legalCard.*`).
  - `phase-3/formation/page.tsx` & `src/components/creator/formation/FormationFigmaFlow.tsx`: Step 3.5 Company Formation & Team setup with 12-section formation flow covering starting mode (solo/team/undecided), SASU/SAS/SARL structural comparisons, cap table ownership split, leadership role, starting capital, and skills assessment (`creator.phase3.formation.*`).
  - `phase-3/business-plan/page.tsx` & `src/components/creator/business-plan/BusinessPlanFigmaFlow.tsx`: Step 3.6 12-Chapter Executive Business Plan generation, timeout & credit safeguards, version tracking, PDF export, reviewed badges, source attribution chips, and inline section edit dialog (`creator.phase3.businessPlan.*`, `creator.phase3.businessPlan.flow.*`).
  - `phase-3/complete/page.tsx` & `src/components/creator/readiness/InvestorReadinessFigmaFlow.tsx`: Step 3.7 Institutional Investor Readiness Audit & Phase 3 Completion with 100-point score breakdown across 5 dimensions, gap recommendations, document vault, and Phase 4 unlock (`creator.phase3.complete.*`, `creator.phase3.readiness.*`).
- **Phase 4: Construction Architecture & Full Launch Preparation**: 100% bilingual localization across all 9 steps, views, gate guards, and route wrappers verified line-by-line via AST scanning (0 raw text nodes, 0 raw attributes across all 20 Phase 4 files):
  - `Phase4ProfileGuard.tsx`: Pre-flight personalization gate verifying HumainX founder competencies, current employment situation, and Phase 3 completion (`creator.phase4.profileGuard.*`).
  - `phase-4/page.tsx` & `ConstructionSnapshotView.tsx`: Step 4.1 Construction Snapshot with 6 status pillars, execution overview, update banners, and localized fallback (`creator.phase4.snapshotView.*`).
  - `phase-4/roadmap/page.tsx` & `OperationalRoadmapView.tsx`: Step 4.2 Operational Roadmap with availability-paced multi-phase scheduling, task dependencies, inline editing, and localized fallback (`creator.phase4.roadmapView.*`, `creator.phase4.roadmapPage.*`).
  - `phase-4/needs/page.tsx` & `NeedsAnalysisView.tsx`: Step 4.3 Needs & Requirements Engine with 6 category breakdowns, inline need confirmation, deferral, and localized fallback (`creator.phase4.needsView.*`, `creator.phase4.needsPage.*`).
  - `phase-4/skills/page.tsx` & `SkillsPlanView.tsx`: Step 4.4 Skills & Training Plan with Learn · Delegate · Verify engine, topic taxonomies, hour estimates, and localized fallback (`creator.phase4.skillsView.*`, `creator.phase4.skillsPage.*`).
  - `phase-4/support/page.tsx` & `SupportPlanView.tsx`: Step 4.5 Aids, Grants & Public Support Engine with deterministic eligibility matching, fact verification, and localized fallback (`creator.phase4.supportView.*`, `creator.phase4.supportPage.*`).
  - `phase-4/pricing/page.tsx` & `PricingStrategyView.tsx`: Step 4.6 Pricing & Revenue Model Engine with packaging, price floors, HT/TTC presentation, immediate recalculation, and localized fallback (`creator.phase4.pricingView.*`, `creator.phase4.pricingPage.*`).
  - `phase-4/gtm/page.tsx` & `GtmStrategyView.tsx`: Step 4.7 Go-To-Market & Launch Strategy Engine with channel portfolio, founder capacity load, experiment tracking, and localized fallback (`creator.phase4.gtmView.*`, `creator.phase4.gtmPage.*`).
  - `phase-4/assets/page.tsx` & `LaunchAssetsView.tsx`: Step 4.8 One-Page Website & Launch Assets Engine with live iframe previews, versioning, source HTML export, copy-to-clipboard sharing, and localized fallback (`creator.phase4.launchAssetsView.*`, `creator.phase4.assetsPage.*`).
  - `phase-4/readiness/page.tsx` & `ConstructionReadinessView.tsx`: Step 4.9 Construction Readiness Review & Personalization Gate with 3 core principles, personal commitment sign-off, version locking, and localized fallback (`creator.phase4.readinessView.*`, `creator.phase4.readinessPage.*`).
  - **Route Wrapper Suspense Architecture**: Dedicated micro-client fallback components utilizing `useTranslation()` across all 9 route wrappers, eliminating raw unlocalized loading strings.
- **HumainX System & Profile Gate (`src/app/dashboard/creator/humainx/*` & `src/app/dashboard/creator/profile/*`)**:
  - `humainx/page.tsx`: Step-by-step diagnostic questionnaire, situation, skills taxonomy, progress preferences, availability, and builder completion gate (`creator.humainx.*`).
  - `creator/profile/page.tsx`: 10-step HumainX Profile Builder wizard covering personal info, career trajectory, core strengths, languages, work style, portfolio credentials, and builder profile summary (`creator.profileBuilder.*`).
- **Asset Library (`src/app/dashboard/creator/asset-library/*`)**:
  - `asset-library/page.tsx`: Complete venture asset repository cataloging all 8 canonical artifacts (Brand Kit, Executive Business Plan, 3-Year Financial Forecast, Market Study, Business Model Canvas, Statutory Compliance Roadmap, Company Formation & Cap Table, Investor Readiness Report).
  - Print preview modal integration for Business Model, Market Study, Financial Forecast, and Business Plan with live dual-language SVG charts and print styling (`creator.assetLibrary.*`).
- **Billing History (`src/app/dashboard/creator/billinghistory/*` & `src/components/billing/*`)**:
  - `billinghistory/page.tsx`: Creator subscription and AI credit transaction ledger.
  - Components: `BillingHeader.tsx`, `BillingTable.tsx`, `BillingRow.tsx`, `Pagination.tsx` with localized status pills (`Paid` / `Payé`, `Pending` / `En attente`, `Failed` / `Échoué`, `Refunded` / `Remboursé`) and currency formatting (`creator.billing.*`).
- **Universal Profile System (`src/app/dashboard/profile/*` & `src/components/serviceprovider/profile/*`)**:
  - Universal public and owner profile view (`ProfileView.tsx`, `ProfessionalOverviewView.tsx`) shared across Creator, Entrepreneur, Investor, and Service Provider roles.
  - Localized unified header, avatar, role badges, verified status, member since date, response time metrics, and share/edit actions (`creator.profile.actions.*`, `creator.profile.header.*`).
  - Localized section cards: About, Creator Projects & Focus, Founded Companies & Ventures, Investment Profile, Experience, Education, Skills & Domains, Languages (with CEFR/proficiency tiers), Social Links, Credentials (with status badges), and Reviews (`creator.profile.sections.*`, `creator.profile.proficiencies.*`, `creator.profile.credentialStatus.*`).
- **Document Vault (`src/app/dashboard/creator/documents/*`)**:
  - `documents/page.tsx`: Real-file document storage vault for venture business plans and financial forecasts with localized document types, file sizes, download triggers, and error recovery (`creator.documents.*`).
- **Creator Sidebar Navigation (`src/lib/menu.ts`)**: **Deliberately Deferred**. Per user explicit instruction, Creator sidebar menus remain in English during the initial phase and will be localized in a subsequent dedicated pass.
- **Landing Page & Marketing Surfaces**: Queued for execution following the Creator dashboard audit.
- **Testing & Translation Integrity**:
  - Full dictionary symmetry between `src/locales/en/creator.json` and `src/locales/fr/creator.json` (3,595 total keys in EN, 3,595 total keys in FR, 0 missing keys in either direction).
  - Full dictionary symmetry in shared catalogs (`src/locales/en/common.json` and `src/locales/fr/common.json`: 210 total keys in EN and FR, 0 missing).
  - Verified across all unit test suites (`universal-profile.test.tsx`, `profile-view-and-wizard.test.tsx`, `creator-dashboard.test.tsx`, `creator-i18n.test.tsx`, `analytics-profile.test.tsx`) with 100% pass rate.




