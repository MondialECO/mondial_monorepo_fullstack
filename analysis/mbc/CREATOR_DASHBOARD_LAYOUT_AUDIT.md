# MONDIAL BUSINESS CREATION (MBC)
## Creator Dashboard — Full Layout & Responsive Audit (1440px → 1920px)

> **Document Status**: HISTORICAL AUDIT — FULLY RESOLVED & SUPERSEDED BY GLOBAL CANONICAL ARCHITECTURE  
> **Target Desktop Range**: Minimum Supported Desktop: **1440px** → Maximum Design Target: **1920px**  
> **Tested Viewport Steps**: 1440px, 1536px, 1600px, 1728px, 1920px  
> **Audit Mode**: Strict Audit Only (Historical baseline; all identified issues resolved in production)  
> **Output Location**: `analysis/mbc/CREATOR_DASHBOARD_LAYOUT_AUDIT.md`  
> **Structured Index**: [CREATOR_DASHBOARD_LAYOUT_INDEX.json](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/analysis/mbc/CREATOR_DASHBOARD_LAYOUT_INDEX.json)  
>
> [!NOTE]
> **Resolution Status:**
> - All identified shell pathologies (double-padding, flex blowout, duplicate `<main>` landmarks, Topbar axis misalignment) were resolved via the Layout Foundation.
> - The proposed Stage 5 Brand Studio 3-pane redesign was **CANCELLED** in favor of responsive stream normalization (<1024px fluid, 1024-1279px max-w-4xl, 1280-1535px max-w-5xl, >=1536px max-w-6xl).
> - The layout architecture was formalized globally for the entire MBC platform (<768px Mobile, 768-1023px Tablet, 1024-1439px Compact Desktop, 1440-1919px Full Desktop, >=1920px Centered 1920px Frame).

---

## EXECUTIVE SUMMARY

### Core Diagnostic Answers

1. **Is the dashboard genuinely optimized for 1440px?**  
   **NO.** While simple form pages and card grids fit, the mission-critical analytical workspaces break down at 1440px:
   * In **Phase 3 Step 3.5 Legal Compliance Workspace** (`/dashboard/creator/phase-3/compliance`), double-padding (128px total) combined with a hardcoded `max-w-6xl` clamp (1152px) and fixed 288px navigation + 320px AI guide rails squashes the central requirement canvas to **392px** — smartphone width on a 1440px display (**P0 Critical**).
   * In **Phase 3 Step 3.2 Business Model Canvas** (`/dashboard/creator/phase-3/business-model`), the 5-column Osterwalder layout inside double-padding receives only ~209px total column width (~169px text width), forcing 14px body text to break every 2–3 words (**P0 Critical**).
   * In the **App Shell** (`src/app/dashboard/layout.tsx`), lines 37 and 50 lack `min-w-0` on flex containers, making any wide table or canvas blow out the entire dashboard viewport horizontally.

2. **Does it scale correctly between 1440px and 1920px?**  
   **NO.** The current implementation relies on rigid, arbitrary `max-w-[...px]` clamps rather than intelligent fluid sizing:
   * At 1536px (`2xl:` breakpoint), no further Tailwind breakpoint exists; the UI behaves identically from 1536px to 1920px.
   * At 1600px, 1728px, and 1920px, pages locked to `max-w-[1136px]`, `max-w-4xl` (896px), or `max-w-5xl` (1024px) float in the center of the monitor with massive, barren lateral dead spaces exceeding 500px to 1024px.

3. **What happens at 1536px, 1600px, 1728px, and 1920px?**  
   * **1536px**: Cards and forms gain minor breathing space, but `max-w-6xl` containers remain clamped.
   * **1600px**: Standard desktop baseline; arbitrary clamps (`1136px`, `1080px`, `1024px`) begin to look conspicuously narrow.
   * **1728px**: Over 40% of the display area is wasted background canvas.
   * **1920px**: High-resolution wide displays suffer catastrophic layout underutilization. In Phase 2 Brand Studio (`/dashboard/creator/phase-2/brand-studio`), over **1024px (53% of screen width)** is empty grey background dots, while tools remain trapped inside full-screen modals. In Billing History (`/dashboard/creator/billinghistory`), an unconstrained table card spans 1592px, but fixed 944px column headers leave **648px of blank white void** on the right side.

4. **Are components using intelligent fluid sizing or random fixed pixel widths?**  
   **Random Fixed Pixel Widths.** The codebase contains **144 instances** of arbitrary bracketed widths (`max-w-[1136px]`, `max-w-[1140px]`, `max-w-[1200px]`, `max-w-[1080px]`, `max-w-[1000px]`, `max-w-[960px]`, `max-w-[776px]`, `max-w-[680px]`, `max-w-[548px]`, `w-[300px]`, `w-[280px]`, `w-40`, `w-52`, `w-28`).

5. **Does content become excessively stretched on large displays?**  
   **YES, in unconstrained text zones; NO, in clamped dashboards.**  
   * On unconstrained or `max-w-7xl` pages (e.g., Business Plan paragraphs at 1152px or Crossroads cards at 1280px), text lines span 160+ characters, exceeding comfortable reading ergonomics (65–80 characters).
   * Conversely, data-intensive workspaces that *should* stretch (such as the 36-Month Forecast table) are artificially choked inside 1152px.

6. **Does anything become compressed at 1440px?**  
   **YES.** The Legal Compliance Canvas (392px), Osterwalder Business Model columns (169px text width), and Financial Forecast 36-Month tables are severely compressed at 1440px.

7. **Are there horizontal overflows?**  
   **YES.** Financial tables in Step 3.3 horizontally scroll. More critically, the root flex container lacks `min-w-0`, allowing local table overflows to trigger whole-window page horizontal scrolling.

8. **Are there unnecessary empty areas?**  
   **YES.** At 1728px and 1920px, Brand Studio leaves 1024px empty, Creator Home leaves 456px empty, Market Study leaves 896px empty, and Billing History leaves 648px blank inside its card.

9. **Are cards, tables, generators, forms, canvases, and panels aligned consistently?**  
   **NO.** The Topbar has `px-5` (20px gutter), whereas the main application shell applies `lg:p-8` (32px gutter), and child pages inject a secondary `px-4 sm:px-6 lg:px-8` (32px gutter). Content left-edges misalign by 12px, 32px, or 64px across adjacent pages.

10. **Is the current dashboard shell suitable for the complete Creator journey?**  
    **NO.** The shell currently treats diverse paradigms (focused forms, multi-column KPI dashboards, 36-month financial statements, and 3-pane live interactive canvases) as a monolithic container. Furthermore, 11 Creator routes render invalid nested `<main>` tags inside the layout's root `<main>`, violating HTML5 specifications.

---

## PART A: CURRENT LAYOUT ARCHITECTURE

### 1. Component Hierarchy & Exact Source Files

```text
RootLayout (src/app/layout.tsx)
 └── AuthGuard (src/components/layout/AuthGuard.tsx)
      └── EntrepreneurProgressProvider (src/providers/EntrepreneurProgressProvider.tsx)
           └── SidebarProvider (src/components/ui/sidebar.tsx)
                └── DashboardLayout (src/app/dashboard/layout.tsx)
                     ├── AppSidebar (src/components/layout/AppSidebar.tsx) [Suppressed in Phase 2]
                     └── flex-1 flex-col wrapper [MISSING min-w-0] (line 37)
                          ├── Topbar (src/components/layout/Topbar.tsx) [Height: 72px, px-5]
                          └── <main> (line 50) [MISSING min-w-0, bg-background, p-4 sm:p-6 lg:p-8 pb-16]
                               └── Page Component (e.g. CreatorDashboardHome, Phase3SetupShell, etc.)
                                    └── [INVALID] Nested <main> tags on 11 routes!
```

### 2. File Paths & Roles

| Component | Absolute / Workspace Path | Layout Responsibility | Defect / Note |
| :--- | :--- | :--- | :--- |
| **Root Shell** | [layout.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/layout.tsx) | Hosts Sidebar, Topbar, and `<main>` route container | Missing `min-w-0` on line 37 and line 50. `isCreatorPhase3FullWidth` only includes `business-plan` and `forecast`, omitting `compliance`, `business-model`, etc. |
| **App Sidebar** | [AppSidebar.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/layout/AppSidebar.tsx) | Global 264px desktop navigation rail | Suppressed completely in Phase 2 (`isPhase2ChromeRoute`). |
| **Sidebar Primitive** | [sidebar.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/ui/sidebar.tsx) | Sizing tokens: `16.5rem` (264px), `4.5rem` (72px collapsed) | Fixed sticky `h-svh` container. |
| **Topbar** | [Topbar.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/layout/Topbar.tsx) | Sticky 72px header with breadcrumbs & account menu | Uses `px-5` (20px), misaligned with `<main>` `p-8` (32px). |
| **Phase 3 Shell** | [Phase3SetupShell.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/creator/Phase3SetupShell.tsx) | Shared wrapper for Phase 3 steps | Enforces `px-4 sm:px-6 lg:px-8` (causes 128px double-padding), renders nested `<main>`, and clamps to `max-w-5xl` (1024px) or `max-w-6xl` (1152px). |
| **Brand Studio Shell** | [BrandStudioShell.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/creator/brand-kit/BrandStudioShell.tsx) | Phase 2 Visual Identity Studio | Suppresses AppSidebar; clamps card column to `max-w-4xl` (896px); tools trapped in modals. |

---

## PART B: CURRENT RESPONSIVE ARCHITECTURE

### 1. Breakpoint Inventory

Inspecting [tailwind.config.ts](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/tailwind.config.ts) and [globals.css](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/globals.css) confirms that **no custom desktop breakpoints exist**:

| Token | Width (px) | Tailwind Default | Used in MBC | Behavior in 1440px → 1920px Range |
| :--- | :--- | :--- | :--- | :--- |
| `sm` | 640px | Yes | Yes | Mobile to tablet transition |
| `md` | 768px | Yes | Yes | Tablet / small desktop |
| `lg` | 1024px | Yes | Yes | Applies padding `p-8` (32px) and activates multi-column grids |
| `xl` | 1280px | Yes | Yes | Primary desktop threshold |
| `2xl` | 1536px | Yes | Rare | **Only breakpoint between 1440px and 1920px!** |
| **1440px** | **1440px** | **NO** | **MISSING** | **Treated as generic `xl:` (same as 1280px)** |
| **1600px** | **1600px** | **NO** | **MISSING** | **Treated as generic `2xl:` (same as 1536px)** |
| **1728px** | **1728px** | **NO** | **MISSING** | **Treated as generic `2xl:` (same as 1536px)** |
| **1920px** | **1920px** | **NO** | **MISSING** | **Treated as generic `2xl:` (same as 1536px)** |

> [!WARNING]
> Because there are no distinct breakpoint tokens for 1440px, 1600px, 1728px, or 1920px, CSS styles cannot adapt fluidly across large displays without arbitrary inline utilities.

### 2. Max-Width Fragmentation Inventory

Instead of a unified design token system, Creator pages utilize **14 different arbitrary container widths**:

```text
680px  ──► /phase-2/branding (Option choice card)
768px  ──► /phase-2/idea-summary (Idea synthesis summary)
776px  ──► /offer-pricing (Internal step progress bar)
896px  ──► /phase-2/brand-studio & /phase-3/complete (max-w-4xl)
960px  ──► /phase-2/concept-name & /creator/ai
1000px ──► /phase-2/complete (Completion view)
1024px ──► Phase3SetupShell default (/market-study, /formation, /asset-library) (max-w-5xl)
1080px ──► /phase-2/brand-kit (BrandKitHubView)
1136px ──► /creator (Dashboard Home), /documents, /project-studio, /settings
1140px ──► /phase-1 (Client), /myideas, /phase-2/hire-designer
1152px ──► Phase3SetupShell fullWidth (/business-model, /forecast, /business-plan, /compliance) (max-w-6xl)
1200px ──► /phase-2/clarifier (Idea Clarifier transcript)
1280px ──► /crossroads, /investors, /sales, /partnerships, /notifications (max-w-7xl)
1440px ──► /messages (MessagingWorkspace max-w-[1440px])
w-full ──► /billinghistory (Unconstrained container with fixed 944px column headers)
```

---

## PART C: VIEWPORT-BY-VIEWPORT FINDINGS

### 1. Viewport: 1440px (Minimum Supported Desktop — HIGHEST PRIORITY)

* **Available Content Width Calculation**:
  * Total Display: `1440px`
  * Minus AppSidebar: `264px` (`16.5rem`)
  * Remaining Viewport: `1176px`
  * Minus DashboardLayout `<main>` padding (`lg:p-8`): `64px` (32px left + 32px right)
  * Base Content Area: **`1112px`**
  * Minus secondary child padding on pages with `Phase3SetupShell` (`lg:px-8`): **`1048px`**

#### Defect 1.1: Legal Compliance 3-Pane Workspace Squeeze (CRITICAL — P0)
* **Route**: `/dashboard/creator/phase-3/compliance`
* **Source File**: [src/app/dashboard/creator/phase-3/compliance/page.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/phase-3/compliance/page.tsx)
* **Classes Involved**: `flex flex-col lg:flex-row gap-6 items-start`, `w-full md:w-64 lg:w-72 shrink-0` (288px), `w-full lg:w-80 shrink-0` (320px)
* **Symptom**: Center canvas squashed to **392px**!
* **Technical Cause**: 
  1. `/dashboard/creator/phase-3/compliance` is **omitted** from `isCreatorPhase3FullWidth` in `src/app/dashboard/layout.tsx` (line 23).
  2. It receives double padding: `DashboardLayout` (64px) + `Phase3SetupShell` (64px) = 128px total.
  3. Available width is 1176px - 128px = `1048px`.
  4. Fixed Left Nav (`288px`) + Fixed Right AI Rail (`320px`) + 2x gaps (`48px`) = **`656px`** consumed by rails.
  5. Central canvas receives: `1048px - 656px = 392px`!
* **Impact**: Core legal compliance checklist, evidence dropzones, and status selectors are unusable.

#### Defect 1.2: Business Model Osterwalder 9-Block Severe Compression (CRITICAL — P0)
* **Route**: `/dashboard/creator/phase-3/business-model`
* **Source File**: [src/app/dashboard/creator/phase-3/business-model/page.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/phase-3/business-model/page.tsx)
* **Classes Involved**: `grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border`, internal `p-5`
* **Symptom**: Text wraps every 2 to 3 words; vertical cards become illegible ribbons.
* **Technical Cause**: Inside 1048px available width, 5 columns receive 209.6px total. Minus 40px internal padding (`p-5`) leaves only **169.6px readable width**.
* **Impact**: Critical Osterwalder model cannot be read or reviewed comfortably at 1440px.

#### Defect 1.3: Missing `min-w-0` on Flex Containers (MAJOR — P1)
* **File**: [src/app/dashboard/layout.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/layout.tsx#L37-L50)
* **Classes Involved**: `<div className="flex flex-1 flex-col">` (line 37) and `<main className="flex-1 overflow-auto ...">` (line 50)
* **Symptom**: Tables exceeding 1112px (e.g., 36-Month Forecast or Billing Table) blow out the entire dashboard flex container, forcing horizontal scrolling on the root browser window and pushing the Topbar and Sidebar off-screen.
* **Technical Cause**: CSS Flexbox specification sets default `min-width: auto` on flex children. Flexible containers must declare `min-w-0` to allow child content to scroll locally.

---

### 2. Viewport: 1536px (`2xl:` Breakpoint Threshold)

* **Available Content Width**:
  * Viewport: `1536px` - Sidebar `264px` = `1272px`
  * Minus single padding (64px) = **`1208px`**
  * Minus double padding (128px) = **`1144px`**
* **Findings**:
  * Standard pages (`max-w-7xl` / 1280px) fit cleanly with zero horizontal pressure.
  * Pages locked to `max-w-6xl` (1152px) stop growing at 1152px, leaving ~56px margins.
  * In Step 3.5 Compliance, center canvas expands slightly from 392px to ~480px, but remains substantially constrained.

---

### 3. Viewport: 1600px (Comfortable Desktop Workspace)

* **Available Content Width**:
  * Viewport: `1600px` - Sidebar `264px` = `1336px`
  * Minus single padding (64px) = **`1272px`**
* **Findings**:
  * **Visual Disconnect Begins**: Pages with `max-w-[1136px]` (Dashboard Home, Documents, Settings) now leave **136px of empty grey space** on each side.
  * **Brand Studio Waste**: With sidebar suppressed in Phase 2, the 1600px display renders an 896px card column, leaving **704px (44%)** of barren grey dot canvas.
  * **Billing Table Disalignment**: The card spans 1272px, but the headers and rows end at 944px, leaving 328px of empty white space inside the right of the card.

---

### 4. Viewport: 1728px (Large Display — Retina / MacBook Pro 16")

* **Available Content Width**:
  * Viewport: `1728px` - Sidebar `264px` = `1464px`
  * Minus single padding (64px) = **`1400px`**
* **Findings**:
  * **Underutilized Grids**: Dashboard Home 4-KPI grid remains frozen at `max-w-[1136px]` (each card 266px), despite having 1400px available to expand cards to 330px+.
  * **Market Study TAM/SAM/SOM Cards**: Trapped inside `max-w-5xl` (1024px), wasting 376px of available width.
  * **Brand Studio Canvas**: Clamped to 896px; empty margin space reaches **832px (48% of screen)**.

---

### 5. Viewport: 1920px (Maximum Design Target — Full HD / 4K Scaled)

* **Available Content Width**:
  * Viewport: `1920px` - Sidebar `264px` = `1656px`
  * Minus single padding (64px) = **`1592px`**
* **Findings**:

#### Defect 5.1: Extreme Canvas Waste in Brand Studio (CRITICAL — P0)
* **Route**: `/dashboard/creator/phase-2/brand-studio`
* **Source File**: [BrandStudioShell.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/creator/brand-kit/BrandStudioShell.tsx#L349)
* **Classes Involved**: `w-full max-w-4xl flex flex-col items-center gap-6` (896px)
* **Symptom**: On a 1920px monitor, **1024px (>53%)** of the entire screen is an empty desert of grey dot-grid. The core visual identity work is trapped in a narrow vertical tube.

#### Defect 5.2: Billing History Table Void (MAJOR — P1)
* **Route**: `/dashboard/creator/billinghistory`
* **Source File**: [BillingTable.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/components/billing/BillingTable.tsx#L11-L47)
* **Classes Involved**: Card is `w-full` (1592px), while header columns sum to fixed `944px` (`w-40`, `w-24`, `w-32`, `w-28`, `w-52`).
* **Symptom**: Table data is huddled on the left half of the card, with **648px of blank white void** spanning the right half.

#### Defect 5.3: Paragraph Line-Length Stretch in Business Plan (MODERATE — P2)
* **Route**: `/dashboard/creator/phase-3/business-plan`
* **Source File**: [business-plan/page.tsx](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/phase-3/business-plan/page.tsx)
* **Classes Involved**: `max-w-6xl` (1152px) without multi-column or persistent outline rail.
* **Symptom**: Paragraphs stretch 1100px wide (160–180 characters per line), creating severe visual fatigue and difficult reading ergonomics.

---

## PART D: ROUTE-BY-ROUTE LAYOUT MATRIX

| Phase | Route Path | Component Name | Layout Family | Current Width Strategy | Viewport Evaluation (1440 / 1920) | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hub** | `/dashboard/creator` | `CreatorDashboardHome` | Type B — Dashboard | `max-w-[1136px] mx-auto` | 1440: PASS / 1920: MAJOR (456px dead space) | **P2** |
| **Phase 1** | `/dashboard/creator/phase-1` | `CreatorPhase1Client` | Type A — Setup Form | `max-w-[1140px] mx-auto` | 1440: PASS / 1920: MINOR (Comfortable form) | **P3** |
| **Phase 2** | `/dashboard/creator/phase-2` | `Phase2EntryPage` | Gate / Redirect | Full viewport loader | 1440: PASS / 1920: PASS | **P3** |
| **Phase 2** | `/dashboard/creator/phase-2/clarifier` | `AIClarifierPage` | Type D — Studio | `max-w-[1200px]`, 2-pane | 1440: PASS / 1920: MAJOR (720px dead space) | **P2** |
| **Phase 2** | `/dashboard/creator/phase-2/concept-name` | `ConceptNamePage` | Type A — Selection | `max-w-[960px] mx-auto` | 1440: PASS / 1920: MINOR (960px dead space) | **P3** |
| **Phase 2** | `/dashboard/creator/phase-2/idea-summary` | `IdeaSummaryPage` | Type A — Document | `max-w-[768px] mx-auto` | 1440: PASS / 1920: MINOR (1152px dead space) | **P3** |
| **Phase 2** | `/dashboard/creator/phase-2/branding` | `BrandingOptionsPage` | Type A — Decision | `max-w-[680px] mx-auto` | 1440: PASS / 1920: MINOR (1240px dead space) | **P3** |
| **Phase 2** | `/dashboard/creator/phase-2/brand-studio` | `BrandStudioShell` | Type D — Studio | `max-w-4xl` (896px) + Modals | 1440: MAJOR / 1920: **CRITICAL (1024px dead space)** | **P0** |
| **Phase 2** | `/dashboard/creator/phase-2/brand-kit` | `BrandKitHubView` | Type B — Asset Hub | `max-w-[1080px] mx-auto` | 1440: PASS / 1920: MAJOR (Nested `<main>`) | **P2** |
| **Phase 2** | `/dashboard/creator/phase-2/hire-designer` | `HireDesignerPage` | Type B — Catalog | `max-w-[1140px] mx-auto` | 1440: PASS / 1920: MAJOR (Nested `<main>`) | **P2** |
| **Phase 2** | `/dashboard/creator/phase-2/complete` | `Phase2CompletePage` | Type A — Milestone | `max-w-[1000px] mx-auto` | 1440: PASS / 1920: MINOR (Nested `<main>`) | **P2** |
| **Phase 3** | `/dashboard/creator/phase-3` | `Phase3IndexPage` | Gate / Redirect | Full viewport loader | 1440: PASS / 1920: PASS | **P3** |
| **Phase 3** | `/dashboard/creator/phase-3/market-study` | `MarketStudyPage` | Type C — Analytical | `Phase3SetupShell` (`max-w-5xl`) | 1440: MAJOR (Double pad) / 1920: **CRITICAL (896px dead)** | **P1** |
| **Phase 3** | `/dashboard/creator/phase-3/business-model` | `BusinessModelPage` | Type D — Canvas | `Phase3SetupShell` (`max-w-6xl`) | 1440: **CRITICAL (169px col)** / 1920: **CRITICAL (choked)** | **P0** |
| **Phase 3** | `/dashboard/creator/phase-3/forecast` | `FinancialForecastPage`| Type C — Financial | `Phase3SetupShell` (`max-w-6xl`) | 1440: MAJOR (36mo overflow) / 1920: MAJOR (choked) | **P1** |
| **Phase 3** | `/dashboard/creator/phase-3/business-plan` | `BusinessPlanPage` | Type A/B — Document | `Phase3SetupShell` (`max-w-6xl`) | 1440: PASS / 1920: MAJOR (Line length stretch) | **P2** |
| **Phase 3** | `/dashboard/creator/phase-3/compliance` | `ComplianceWorkspacePage`| Type D — 3-Pane | `Phase3SetupShell` (`max-w-6xl`) | 1440: **CRITICAL (392px center)** / 1920: **CRITICAL (496px)**| **P0** |
| **Phase 3** | `/dashboard/creator/phase-3/formation` | `FormationPage` | Type A — Multi-Step | `Phase3SetupShell` (`max-w-5xl`) | 1440: MINOR (Double pad) / 1920: MINOR (Nested `<main>`) | **P2** |
| **Phase 3** | `/dashboard/creator/phase-3/complete` | `Phase3CompletePage` | Type B — Audit | `max-w-4xl` (896px) mx-auto | 1440: MINOR (Double pad) / 1920: MAJOR (760px dead) | **P2** |
| **Phase 4** | `/dashboard/creator/offer-pricing` | `OfferPricingPage` | Type A/B — Pricing | `max-w-7xl` (1280px) mx-auto | 1440: MINOR (Double pad) / 1920: MINOR (776px bar) | **P2** |
| **Phase 5** | `/dashboard/creator/crossroads` | `CrossroadsPage` | Type B — Decision | `max-w-7xl` (1280px) mx-auto | 1440: PASS / 1920: MINOR (Double pad) | **P2** |
| **Hub** | `/dashboard/creator/myideas` | `MyIdeasPage` | Type B — Portfolio | `max-w-[1140px] mx-auto` | 1440: PASS / 1920: MAJOR (3-col locked) | **P2** |
| **Hub** | `/dashboard/creator/documents` | `DocumentsPage` | Type B — Archive | `max-w-[1136px] mx-auto` | 1440: PASS / 1920: MAJOR (456px dead space) | **P2** |
| **Hub** | `/dashboard/creator/sales` | `SalesPage` | Type B — Deals | `max-w-7xl` (1280px) mx-auto | 1440: PASS / 1920: MINOR (Double pad) | **P2** |
| **Hub** | `/dashboard/creator/investors` | `InvestorsPage` | Type B — Matching | `max-w-7xl` (1280px) mx-auto | 1440: PASS / 1920: MINOR (Double pad) | **P2** |
| **Hub** | `/dashboard/creator/partnerships` | `PartnershipsPage` | Type B — Equity | `max-w-7xl` (1280px) mx-auto | 1440: PASS / 1920: MINOR (Double pad) | **P2** |
| **Hub** | `/dashboard/creator/messages` | `MessagingWorkspace` | Type D — Split-Pane | `max-w-[1440px]`, `320px_1fr` | 1440: PASS / 1920: PASS (Clean centered anchor) | **P3** |
| **Hub** | `/dashboard/creator/notifications` | `SharedNotificationsPage`| Type B — Feed | `max-w-7xl` (1280px) mx-auto | 1440: PASS / 1920: MINOR (Nested `<main>`) | **P2** |
| **Hub** | `/dashboard/creator/settings` | `SettingsPage` | Type A/B — Settings | `max-w-[1136px] mx-auto` | 1440: PASS / 1920: MINOR (Good reading width) | **P3** |
| **Hub** | `/dashboard/creator/billinghistory`| `BillingHistoryPage` | Type C — Data Table | `w-full` with 944px fixed col | 1440: PASS / 1920: **CRITICAL (648px void on right)** | **P1** |
| **Hub** | `/dashboard/creator/project-studio`| `ProjectStudioPage` | Type B — Studio Hub | `max-w-[1136px] mx-auto` | 1440: PASS / 1920: MAJOR (456px dead space) | **P2** |
| **Hub** | `/dashboard/creator/asset-library` | `AssetLibraryPage` | Type B — Artifacts | `Phase3SetupShell` (`max-w-5xl`) | 1440: MINOR (Double pad) / 1920: MAJOR (700px dead) | **P2** |
| **Hub** | `/dashboard/creator/ai` | `CreatorAiWorkspace` | Type A/B — Console | `max-w-[960px] mx-auto` | 1440: PASS / 1920: MAJOR (632px dead space) | **P2** |

---

## PART E: HARDCODED STRUCTURAL WIDTH INVENTORY

Representative inventory of suspicious structural dimensions extracted from the codebase:

| File | Component | Value | Current Purpose | Architectural Risk Assessment |
| :--- | :--- | :--- | :--- | :--- |
| `src/app/dashboard/layout.tsx:37` | `DashboardLayout` | `flex flex-1 flex-col` | Root content wrapper | **Layout Risk**: Missing `min-w-0` causes table overflow blowouts. |
| `src/app/dashboard/layout.tsx:50` | `DashboardLayout` | `p-4 sm:p-6 lg:p-8` | Global page padding | **Layout Risk**: Causes 128px double-padding when combined with page wrappers. |
| `Phase3SetupShell.tsx:31` | `Phase3SetupShell` | `px-4 sm:px-6 lg:px-8` | Phase 3 inner padding | **Layout Risk**: Directly produces double-padding pathology. |
| `Phase3SetupShell.tsx:37` | `Phase3SetupShell` | `max-w-6xl` (1152px) | Maximum container bound | **Layout Risk**: Chokes compliance 3-pane and financial tables on 1920px. |
| `BrandStudioShell.tsx:349` | `BrandStudioShell` | `max-w-4xl` (896px) | Studio canvas card column | **Layout Risk**: Causes 1024px of dead grey dot space on 1920px. |
| `BillingTable.tsx:11` | `BillingTable` | `md:min-w-[1000px]` | Table minimum scroll width | **Questionable**: Forces scrollbar, but header columns only sum to 944px. |
| `BillingRow.tsx:13-60` | `BillingRow` | `w-40, w-24, w-32, w-28, w-52` | Fixed table column widths | **Layout Risk**: Fixed pixels inside unconstrained `w-full` leave 648px blank void. |
| `LegalStageNavigation.tsx:96` | `LegalStageNavigation` | `lg:w-72 shrink-0` (288px) | Legal left stage nav | **Acceptable**: Fixed rail width is appropriate, but requires collapsible mode. |
| `LegalAiGuideRail.tsx:40` | `LegalAiGuideRail` | `lg:w-80 shrink-0` (320px) | Legal contextual AI guide | **Questionable**: Consumes 320px permanently; must collapse or float at 1440px. |
| `page.tsx (Creator Home):183` | `CreatorDashboardHome` | `max-w-[1136px]` | Dashboard home width | **Questionable**: Arbitrary dimension; leaves 456px empty on 1920px. |
| `client.tsx (Phase 1):62` | `CreatorPhase1Client` | `max-w-[1140px]` | Onboarding modal container | **Acceptable**: 4px variance from 1136px, but visually benign. |
| `branding/page.tsx:89` | `BrandingOptionsPage` | `max-w-[680px]` | 2-choice decision card | **Intentional**: Good reading width for a focused choice dialog. |
| `clarifier/page.tsx:397` | `AIClarifierPage` | `max-w-[1200px]` | Chat transcript container | **Questionable**: Suppresses sidebar but clamps to 1200px, wasting 720px on 1920px. |
| `clarifier/page.tsx:700` | `AIClarifierPage` | `lg:w-[300px]` | Progress ring rail | **Intentional**: Clean fixed rail alongside flexible transcript. |
| `concept-name/page.tsx:174` | `ConceptNamePage` | `max-w-[960px]` | Name selection container | **Questionable**: Leaves 960px (50%) empty space on 1920px. |
| `idea-summary/page.tsx:84` | `IdeaSummaryPage` | `max-w-[768px]` | Document summary card | **Intentional**: Optimal typographic line-length, but needs document canvas frame. |
| `offer-pricing/page.tsx:132` | `OfferPricingPage` | `max-w-[776px]` | Step progress indicator | **Questionable**: Misaligned with outer `max-w-7xl` container. |

---

## PART F: OVERFLOW & SCROLL OWNERSHIP INVENTORY

### 1. Architectural Scroll Ownership Model

The application should adhere to a strict three-tier scroll hierarchy:

```text
Tier 1: Browser / Window Level
   └── No horizontal scrollbar EVER.
Tier 2: Main Dashboard Content Area (<main>)
   └── Primary vertical scroll container for dashboard pages.
Tier 3: Local Localized Overflow Containers
   ├── Data Tables: Dedicated overflow-x-auto container with sticky headers.
   ├── Code / Terminal / Canvas: Pan, zoom, or local horizontal scroll.
   └── Modals & Drawers: Self-contained max-h-[92vh] scrollboxes with visible footers.
```

### 2. Violations Identified in Current Codebase

1. **Root Horizontal Overflow Hazard**:
   * Because `src/app/dashboard/layout.tsx` lacks `min-w-0` on its flex wrappers, any element exceeding available width pushes the outer layout boundaries, producing a horizontal scrollbar on the browser window and clipping the fixed `AppSidebar`.
2. **Double Scroll in Phase 2 Brand Studio**:
   * `BrandStudioShell.tsx` renders a nested `<main>` with `overflow-y-auto` (line 334) inside `DashboardLayout`'s `<main>` with `overflow-auto` (line 50), creating two competing vertical scrollbars when card contents exceed screen height.
3. **Modal Clipping at 1440px**:
   * Modals such as `VariationSetModal` (`max-w-6xl max-h-[94vh]`), `DirectionBoardModal` (`max-w-5xl max-h-[92vh]`), and `StrategyReviewModal` (`max-w-[1080px] max-h-[94vh]`) occupy over 90% of screen height at 1440 × 900. When system DPI scaling is active (125% or 150%), the modal action footers become clipped beneath the bottom viewport edge unless internally scrolled.

---

## PART G: INCONSISTENCY MAP

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR (px-5 = 20px padding)                                   [Breadcrumb Item 1 > 2] │
└────────────────────────────────────────────────────────────────────────────────────────┘
  ▲ 12px horizontal offset!
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ DASHBOARD LAYOUT <main> (p-8 = 32px padding)                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ CHILD PAGE (Phase3SetupShell / Sales / Crossroads) (px-8 = 32px secondary pad)   │  │
│  │   ▲ Content pushed in by 64px! (Total 128px gutter!)                             │  │
│  │   [REDUNDANT BREADCRUMB] "Creator Flow > Dashboard"                              │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Systematic Inconsistencies:
1. **Double-Padding Pathology**:
   * `DashboardLayout` enforces `p-4 sm:p-6 lg:p-8 pb-16`.
   * Multiple child pages (`Phase3SetupShell`, `compliance`, `sales`, `investors`, `crossroads`, `partnerships`, `offer-pricing`, `formation`, `complete`, `SharedNotificationsPage`) wrap their content in *another* `px-4 sm:px-6 lg:px-8 py-6`.
   * Result: **128px total horizontal gutter** on standard desktop viewports.
2. **Visual Axis Misalignment**:
   * Topbar left icon starts at **20px** padding.
   * Standard page content starts at **32px** padding.
   * Double-padded pages start at **64px** padding.
   * The user experiences a jarring 12px–44px horizontal "jump" when switching tabs.
3. **Duplicate Breadcrumbs**:
   * Topbar renders breadcrumbs globally (`hidden lg:flex`).
   * `CreatorDashboardHome` ([src/app/dashboard/creator/page.tsx:185](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/page.tsx#L185)) renders a second internal breadcrumb row directly underneath the Topbar.
4. **Invalid Semantic Nesting**:
   * 11 Creator routes render `<main>` elements inside `DashboardLayout`'s `<main>` element, invalidating the HTML document outline.

---

## PART H: RECOMMENDED CANONICAL LAYOUT SYSTEM

### 1. Normalized Four-Family Layout Architecture

To accommodate all Creator interfaces without forcing an inappropriate global max-width, the application must normalize into **four explicit layout containers**:

```text
                              ┌────────────────────────┐
                              │    AppShell Root       │
                              │ (min-w-0, single pad)  │
                              └───────────┬────────────┘
                                          │
        ┌───────────────────┬─────────────┴───────┬───────────────────┐
        ▼                   ▼                     ▼                   ▼
┌────────────────┐  ┌────────────────┐    ┌────────────────┐  ┌────────────────┐
│ Focused        │  │ Standard       │    │ Wide           │  │ Full           │
│ Container      │  │ Container      │    │ Container      │  │ Workspace      │
│ (Type A)       │  │ (Type B)       │    │ (Type C)       │  │ (Type D)       │
├────────────────┤  ├────────────────┤    ├────────────────┤  ├────────────────┤
│ Target: 768px  │  │ Target: 1360px │    │ Target: 1680px │    │ Target: 100%   │
│ - Forms        │  │ - Dashboards   │    │ - 36mo Forecast│    │ - Brand Studio │
│ - Questionaire │  │ - KPI Grids    │    │ - Statements   │    │ - Legal 3-Pane │
│ - Decision/Doc │  │ - Portfolios   │    │ - Comp Matrix  │    │ - Osterwalder  │
└────────────────┘  └────────────────┘    └────────────────┘  └────────────────┘
```

#### Family Specifications:

1. **`FocusedContainer` (Type A — Input & Document Ergonomics)**:
   * **Max-Width**: `max-w-3xl` (768px) to `max-w-4xl` (896px). Centered with `mx-auto`.
   * **Purpose**: Questionnaires, legal setup forms, single-idea summaries, decision cards.
   * **Typographic Rule**: Paragraphs stay within 65–80 characters per line. Visual frame provided by card elevation or document page margins.

2. **`StandardContainer` (Type B — Multi-Column Dashboard Overview)**:
   * **Max-Width**: `max-w-7xl` (1280px) at 1440px, scaling up to `max-w-[1400px]` at 1920px. Centered with `mx-auto`.
   * **Purpose**: Creator Home, My Ideas, Documents, Sales, Investors, Settings, Project Studio.
   * **Grid Behavior**: 2 columns at 1024px, 3 columns at 1440px, expanding to 4 columns at 1728px+.

3. **`WideContainer` (Type C — Data-Intensive Analysis)**:
   * **Max-Width**: `max-w-[1680px]` or `w-full` with controlled outer gutters.
   * **Purpose**: 36-Month Financial Projections, Market Study Competitive Matrices, Billing History.
   * **Table Rule**: Enclosed in dedicated local `overflow-x-auto` scrollboxes with sticky headers; columns use flex-based distribution or sensible percentage widths so that tables fill the card at 1920px without blank right voids.

4. **`FullWorkspace` (Type D — Live Interactive Studio & 3-Pane Canvases)**:
   * **Width**: `w-full h-full min-w-0` (consumes 100% of available viewport width minus sidebar).
   * **Outer Padding**: Zero layout padding (`p-0`). Inner panes manage their own padding.
   * **Purpose**: Brand Studio, Step 3.5 Legal Compliance Workspace, Step 3.2 Business Model Canvas, Messaging Workspace.
   * **Panel Ergonomics**: 
     * Side rails must support a **collapsible icon state** at 1440px to grant the central canvas at least 600px+ usable width.
     * In Brand Studio: Restore the canonical 3-pane architecture (`App Sidebar + Agent Rail + Canvas`). Eliminate blocking modals for creation tools; dock them directly into the Agent Rail.

---

## PART I: IMMEDIATE FIX PRIORITY MATRIX

### P0 — Critical (Must Fix Before Creator MVP Acceptance)
* [ ] **Fix Step 3.5 Compliance Center Canvas Squeeze**:
  * Add `/dashboard/creator/phase-3/compliance` to full-width route exceptions in `DashboardLayout`.
  * Eliminate secondary padding in `Phase3SetupShell`.
  * Convert `LegalAiGuideRail` (320px) to be collapsible on displays ≤ 1536px, ensuring the center canvas maintains ≥ 650px width at 1440px.
* [ ] **Fix Step 3.2 Business Model Osterwalder 5-Column Collapse**:
  * Remove double-padding and expand Osterwalder canvas beyond `max-w-6xl` to use the available desktop workspace.
  * Implement minimum column widths (e.g., `min-w-[220px]`) with horizontal scroll or auto-adjusting responsive grid.
* [ ] **Add `min-w-0` to AppShell Flex Wrappers**:
  * Add `min-w-0` to `src/app/dashboard/layout.tsx` line 37 and line 50 to eliminate browser-level horizontal overflow blowouts.
* [ ] **Restore Canonical Brand Studio Architecture**:
  * Re-integrate Brand Studio with `AppSidebar` and dock creation tools into a persistent Agent Rail rather than modal overlays and clamped 896px card columns.

### P1 — Major (Fix Before Production Release)
* [ ] **Eliminate Double-Padding Pathology**:
  * Establish single-source layout padding in `DashboardLayout`. Strip redundant `px-4 sm:px-6 lg:px-8` wrappers from child pages (`sales`, `investors`, `crossroads`, `partnerships`, `Phase3SetupShell`, `offer-pricing`).
* [ ] **Fix Billing History Table Dead Space Void**:
  * Remove rigid fixed pixel columns in `BillingTable.tsx` / `BillingRow.tsx`; use flexible percentages or CSS grid so that data spans the card comfortably at 1920px without creating a 648px void.
* [ ] **Expand Financial Forecast to Wide Container**:
  * Remove `max-w-6xl` clamp on `forecast/page.tsx` to allow 36-month projections and financial statements to use up to 1680px width.
* [ ] **Fix 11 Invalid Nested `<main>` Tags**:
  * Replace inner `<main>` tags in `Phase3SetupShell`, `complete`, `business-plan`, `hire-designer`, `offer-pricing`, `investors`, `crossroads`, and `BrandStudioShell` with semantic `<div>` or `<section>`.

### P2 — Moderate (Normalize During UI Refinement)
* [ ] **Align Topbar and Main Content Left Axes**:
  * Harmonize Topbar padding (`px-5` = 20px) with `<main>` padding (`px-6` or `px-8` = 24px/32px).
* [ ] **Remove Duplicate Internal Breadcrumbs**:
  * Remove internal breadcrumb row from [src/app/dashboard/creator/page.tsx:185](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/page.tsx#L185).
* [ ] **Enable 4-Column Responsive Grid Scaling at 1728px / 1920px**:
  * Upgrade Dashboard Home KPI cards and My Ideas project cards from rigid 3-column / 1136px clamp to 4-column responsive grid (`2xl:grid-cols-4`).
* [ ] **Typography Line-Length Bounding in Business Plan**:
  * Introduce a persistent sticky Table of Contents navigation rail in `business-plan/page.tsx` to bound reading line-lengths to 750px–850px.

### P3 — Minor (Polish & Refinement)
* [ ] **Add Custom Desktop Breakpoints to Tailwind**:
  * Extend `tailwind.config.ts` with explicit screens: `desktop: '1440px'`, `desktop-wide: '1600px'`, `desktop-xl: '1728px'`, `desktop-max: '1920px'`.
* [ ] **Normalize Arbitrary Pixel Clamp Differences**:
  * Unify `1136px` vs `1140px` into canonical system container token.
* [ ] **Replace Fixed `h-[calc(100vh-260px)]` in Messaging**:
  * Implement flex-grow vertical fill with `flex-1 min-h-0`.

---

## PART J: IMPLEMENTATION ORDER & SAFE ENGINEERING ROADMAP

```text
Stage 1: AppShell Flex Normalization (min-w-0, scroll ownership)
   │
Stage 2: Single-Source Padding Enforcement (kill double-padding)
   │
Stage 3: Remove Invalid Nested <main> Tags
   │
Stage 4: Topbar & Content Axis Alignment (px-8 unification)
   │
Stage 5: Phase 3 Step 3.5 Compliance Workspace Rescue (3-pane layout, collapsible guide)
   │
Stage 6: Phase 3 Step 3.2 Business Model Canvas Expansion
   │
Stage 7: Phase 3 Step 3.3 Financial Forecast Wide Container Implementation
   │
Stage 8: Phase 2 Brand Studio Canonical Architecture Alignment
   │
Stage 9: Hub Table Normalization (Billing History flex columns)
   │
Stage 10: 4-Column Dashboard Grid Scaling (1728px / 1920px)
   │
Stage 11: Final 1440px → 1920px Visual Regression Verification
```

---
*Report certified and compiled in accordance with Mondial ECO Architectural Standards and Design System Canon.*
