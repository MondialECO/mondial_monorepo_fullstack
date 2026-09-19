# MONDIAL BUSINESS CREATION (MBC)
## Creator Dashboard Layout Foundation Implementation Report (Stages 1–4)
### Including Post-Implementation Geometry Verification

**Target Desktop Viewport Range:** 1440px → 1920px  
**Audit Date:** September 19, 2026  
**Geometry Verification Date:** September 20, 2026  
**Status:** IMPLEMENTED, TESTED & EMPIRICALLY VERIFIED VIA PLAYWRIGHT  
**Applicable Scope:** All currently implemented Creator routes discovered in the repository (44 routes).

---

## 1. Executive Summary & Geometry Verification Notice

> [!IMPORTANT]
> **Post-Implementation Geometry Verification Correction:**
> The initial implementation walkthrough reported theoretical container widths calculated directly against the browser viewport width (e.g. stating `1440px viewport → StandardContainer = 1280px`).
> 
> In reality, standard desktop dashboard routes host a persistent `264px` (`16.5rem`) `AppSidebar`. Therefore, all geometric calculations must subtract the sidebar and shell padding to reflect actual available space:
> 
> $$\text{Available Main Width} = \text{Viewport Width} - \text{Rendered Sidebar Width}$$
> $$\text{Usable Page Width} = \text{Available Main Width} - \text{Shell Left Padding (32px)} - \text{Shell Right Padding (32px)}$$
> $$\text{StandardContainer Width} = \min(\text{Usable Page Width}, 1280\text{px})$$
> 
> This verification report incorporates empirical measurements executed in headless Chromium across all five target viewports (`1440×900`, `1536×960`, `1600×900`, `1728×1117`, `1920×1080`).

---

## 2. Corrected Desktop Geometry Matrix (Empirically Measured)

### A. Standard Dashboard Routes (Sidebar Visible = 264px)

Evaluated on `/dashboard/creator/sales`, `/dashboard/creator/investors`, `/dashboard/creator/crossroads`, `/dashboard/creator/partnerships`, etc.:

| Metric | 1440 × 900 | 1536 × 960 (`2xl`) | 1600 × 900 | 1728 × 1117 (16" Mac) | 1920 × 1080 (FHD) |
|---|---:|---:|---:|---:|---:|
| **1. Browser Viewport Width** | 1440px | 1536px | 1600px | 1728px | 1920px |
| **2. AppSidebar Rendered Width** | 264px | 264px | 264px | 264px | 264px |
| **3. Main Column Width** | 1176px | 1272px | 1336px | 1464px | 1656px |
| **4. Main Left Padding** (`lg:p-8`) | 32px | 32px | 32px | 32px | 32px |
| **5. Main Right Padding** (`lg:p-8`) | 32px | 32px | 32px | 32px | 32px |
| **6. PageContainer Available Width** | **1112px** | **1208px** | **1272px** | **1400px** | **1592px** |
| **7. StandardContainer Computed Width** | **1112px** | **1208px** | **1272px** | **1280px** *(clamped)* | **1280px** *(clamped)* |
| **8. Left Free Space (`mx-auto`)** | 0px | 0px | 0px | 60px | 156px |
| **9. Right Free Space (`mx-auto`)** | 0px | 0px | 0px | 60px | 156px |
| **10. FocusedContainer Computed Width** | **896px** | **896px** | **896px** | **896px** | **896px** |
| **11. Focused Free Space (Left / Right)** | 108px / 108px | 156px / 156px | 188px / 188px | 252px / 252px | 348px / 348px |
| **12. WideContainer Computed Width** | **1112px** | **1208px** | **1272px** | **1400px** | **1592px** *(max)* |
| **13. FullWorkspace Available Width** | **1176px** | **1272px** | **1336px** | **1464px** | **1656px** |
| **14. Browser Horizontal Overflow** | **NO** (`1440/1440`) | **NO** (`1536/1536`) | **NO** (`1600/1600`) | **NO** (`1728/1728`) | **NO** (`1920/1920`) |

### Key Geometric Takeaways:
1. **`StandardContainer` (`max-w-7xl` = 1280px) does NOT reach 1280px at 1440, 1536, or 1600!**
   - At 1440px, usable width is `1112px`. `StandardContainer` consumes 100% of usable space with 0px free space margins.
   - At 1536px, usable width is `1208px`. Still below 1280px.
   - At 1600px, usable width is `1272px`. It is 8px shy of the 1280px clamp.
   - Only at viewports $\ge 1608\text{px}$ (such as 1728px and 1920px) does `StandardContainer` clamp to 1280px and develop symmetric `mx-auto` margins.
2. **`FocusedContainer` (`max-w-4xl` = 896px) clamps and centers inside the main column across all target viewports:**
   - Centering occurs relative to the **Usable Page Width** of the dashboard main column, NOT relative to the browser window.
   - At 1440px: Left edge is at $264\text{px (sidebar)} + 32\text{px (shell pad)} + 108\text{px (margin)} = 404\text{px}$ from browser window left. Right edge is at $108\text{px (margin)} + 32\text{px (shell pad)} = 140\text{px}$ from browser window right.
3. **`WideContainer` (`max-w-[1680px]`) NEVER reaches 1680px under 1920px with a persistent sidebar:**
   - At 1920px, usable page width is $1920 - 264 - 64 = 1592\text{px}$.
   - To reach 1680px, browser viewport would need to be at least $1680 + 264 + 64 = 2008\text{px}$.
4. **`FullWorkspace` (`w-full min-w-0`):**
   - Fills 100% of the available dashboard main column ($1176\text{px}$ at 1440 → $1656\text{px}$ at 1920).

---

## 3. Route-by-Route Sidebar & Chrome Behavior (Phase 2 & Phase 3)

Empirically verified in headless browser across viewports:

| Route | Route Type | AppSidebar | Topbar | Shell Padding | `isUnpadded` | Actual Available Width (1440) | Actual Available Width (1920) |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `/dashboard/creator/sales` | Standard | **Visible (264px)** | Standard (72px) | Active (32px/32px) | `false` | **1112px** | **1592px** |
| `/dashboard/creator/investors` | Standard | **Visible (264px)** | Standard (72px) | Active (32px/32px) | `false` | **1112px** | **1592px** |
| `/dashboard/creator/crossroads` | Standard | **Visible (264px)** | Standard (72px) | Active (32px/32px) | `false` | **1112px** | **1592px** |
| `/dashboard/creator/partnerships` | Standard | **Visible (264px)** | Standard (72px) | Active (32px/32px) | `false` | **1112px** | **1592px** |
| `/dashboard/creator/offer-pricing` | Standard | **Visible (264px)** | Standard (72px) | Active (32px/32px) | `false` | **1112px** | **1592px** |
| `/dashboard/creator/phase-2/clarifier` | Phase 2 Chrome | **SUPPRESSED** | Reduced P2 (72px) | Suppressed (0px) | `true` | **1440px** *(full-bleed)* | **1920px** *(full-bleed)* |
| `/dashboard/creator/phase-2/brand-studio` | Full Workspace | **SUPPRESSED** | Reduced P2 (72px) | Suppressed (0px) | `true` | **1440px** *(full-bleed)* | **1920px** *(full-bleed)* |
| `/dashboard/creator/phase-2/brand-kit` | Full Workspace | **SUPPRESSED** | Reduced P2 (72px) | Suppressed (0px) | `true` | **1440px** *(full-bleed)* | **1920px** *(full-bleed)* |
| `/dashboard/creator/phase-2/complete` | Phase 2 Chrome | **SUPPRESSED** | Reduced P2 (72px) | Suppressed (0px) | `true` | **1440px** *(full-bleed)* | **1920px** *(full-bleed)* |
| `/dashboard/creator/phase-3/compliance` | 3-Pane Workspace | **Visible (264px)** | Standard (72px) | Active (32px/32px) | `false` | **1112px** (shell card) | **1152px** (`max-w-6xl`) |
| `/dashboard/creator/phase-3/business-model` | Osterwalder Grid | **Visible (264px)** | Standard (72px) | Active (32px/32px) | `false` | **1112px** (shell card) | **1152px** (`max-w-6xl`) |
| `/dashboard/creator/phase-3/forecast` | Table / Chart | **Visible (264px)** | Standard (72px) | Active (32px/32px) | `false` | **1112px** (shell card) | **1152px** (`max-w-6xl`) |
| `/dashboard/creator/phase-3/market-study` | Analytical | **Visible (264px)** | Standard (72px) | Active (32px/32px) | `false` | **1112px** (shell card) | **1152px** (`max-w-6xl`) |
| `/dashboard/creator/phase-3/complete` | Focused | **Visible (264px)** | Standard (72px) | Active (32px/32px) | `false` | **896px** (`max-w-4xl`) | **896px** (`max-w-4xl`) |

### Crucial Architectural Insight for Phase 2:
All Phase 2 chrome routes operate in true **full-bleed workspace mode** without the 264px sidebar. Their main container spans the full 1440px–1920px browser width.
When designing the Brand Studio 3-pane layout, the available canvas width is **1440px at 1440**, not 1112px!

---

## 4. Phase 3 Width Gain Analysis (Before Foundation vs. After Foundation)

All five Phase 3 setup pages utilize `Phase3SetupShell` with `fullWidth = true` (`max-w-6xl` = 1152px).

### 1. Compliance (`/dashboard/creator/phase-3/compliance`)
- **3-Pane Components:**
  - Left Stage Navigation: `lg:w-72` = 288px (shrink-0)
  - Right AI Guide Rail: `lg:w-80` = 320px (shrink-0)
  - Inter-pane gaps: `gap-6` (24px × 2) = 48px
  - Total fixed side width: $288 + 320 + 48 = 656\text{px}$.
- **Geometry at 1440px:**
  - **Before Foundation:** Double-padding (64px shell + 64px shell duplicate = 128px). Available width was $1176 - 128 = 1048\text{px}$. Center canvas width was $1048 - 656 = \mathbf{392\text{px}}$.
  - **After Foundation:** Duplicate padding removed. Single-source shell padding is 64px. Available width is $1176 - 64 = 1112\text{px}$. Center canvas width is $1112 - 656 = \mathbf{456\text{px}}$.
  - **Width Regained:** $\mathbf{+64\text{px}}$ ($+16.3\%$ increase).
- **At 1536px → 1920px:**
  - `Phase3SetupShell` clamps at `max-w-6xl` = 1152px. Center canvas expands to $1152 - 656 = \mathbf{496\text{px}}$.
  - *Observation:* Center canvas cannot exceed 496px unless `Phase3SetupShell` allows wide/workspace mode for 3-pane layouts.

### 2. Business Model Osterwalder Grid (`/dashboard/creator/phase-3/business-model`)
- **5-Column Grid (`lg:grid-cols-5`):**
  - Internal column padding: `p-5` (20px left + 20px right = 40px padding per column).
- **Geometry at 1440px:**
  - **Before Foundation:** Total card width was 1048px.
    - Column gross width: $1048 / 5 = \mathbf{209.6\text{px}}$ (~209px).
    - Readable internal text width: $209.6 - 40 = \mathbf{169.6\text{px}}$ (~169px).
  - **After Foundation:** Total card width is 1112px.
    - Column gross width: $1112 / 5 = \mathbf{222.4\text{px}}$ ($\mathbf{+12.8\text{px}}$ gain).
    - Readable internal text width: $222.4 - 40 = \mathbf{182.4\text{px}}$ ($\mathbf{+12.8\text{px}}$ / $+7.5\%$ gain).
- **At 1536px → 1920px:**
  - Clamped at `max-w-6xl` (1152px). Column gross width is $230.4\text{px}$, readable width is $190.4\text{px}$.

### 3. Financial Forecast (`/dashboard/creator/phase-3/forecast`)
- **36-Month Data Table Viewport:**
  - **Before Foundation (1440px):** Table container card width was $1048\text{px}$.
  - **After Foundation (1440px):** Table container card width is $\mathbf{1112\text{px}}$ ($\mathbf{+64\text{px}}$ gain).
  - **After Foundation (1920px):** Table container card width is $\mathbf{1152\text{px}}$ (clamped at `max-w-6xl`).
  - Table horizontal overflow is safely contained inside the local `overflow-x-auto` wrapper; `document.documentElement` horizontal overflow remains `false`.

### 4. Market Study (`/dashboard/creator/phase-3/market-study`)
- **Analytical Container Width:**
  - **Before Foundation (1440px):** $1048\text{px}$.
  - **After Foundation (1440px):** $\mathbf{1112\text{px}}$ ($\mathbf{+64\text{px}}$ gain).
  - **After Foundation (1920px):** $\mathbf{1152\text{px}}$ (clamped at `max-w-6xl`).

---

## 5. Recalculated Post-Foundation Finding Severity Status

| Area / Component | Pre-Foundation Baseline | Post-Foundation Status | Current Finding Severity | Justification |
|---|---|---|:---:|---|
| **AppShell Flex Blowout & Root Scroll** | Root horizontal scroll active across viewports | **RESOLVED BY FOUNDATION** | **Resolved** | `document.documentElement.scrollWidth <= clientWidth` verified across all viewports. |
| **Double-Padding Pathology** | 128px gutters on all standard routes | **RESOLVED BY FOUNDATION** | **Resolved** | Single-source 32px padding strictly enforced. |
| **Semantic Landmark Duplication** | 11 invalid nested `<main>` tags | **RESOLVED BY FOUNDATION** | **Resolved** | Exactly 1 `<main>` landmark exists in DOM. |
| **Topbar Axis Alignment** | Topbar was 20px/24px; body was 32px | **RESOLVED BY FOUNDATION** | **Resolved** | Topbar left edge pixel-synchronized to 32px desktop axis. |
| **Phase 3 Compliance 3-Pane** | Center canvas cramped to ~392px | **IMPROVED TO P1** | **P1** | Regained 64px (now 456px/496px), but still constrained by `max-w-6xl`. Needs dedicated responsive workspace tuning. |
| **Business Model Osterwalder Grid** | 5 columns at ~169px readable width | **IMPROVED TO P1** | **P1** | Regained 12.8px per col (now 182px), clipping resolved, but text density remains tight for long cards. |
| **Financial Forecast 36-Month Table** | Root horizontal blowout | **IMPROVED TO P1** | **P1** | Root overflow resolved, table contained locally (+64px wider), but lacks sticky column headers and horizontal scroll cues. |
| **Phase 2 Brand Studio** | Canvas layout issues | **RESOLVED VIA RESPONSIVE NORMALIZATION** | **Resolved** | Proposed 3-pane redesign CANCELLED by user instruction. Preserved existing journey, cards, and modal workflow. Normalized responsive stream sizing (<1024px fluid, 1024-1279px max-w-4xl, 1280-1535px max-w-5xl, >=1536px max-w-6xl) and eliminated nested vertical scrollbars. |
| **Billing History Table** | Multi-column density | **IMPROVED TO P2** | **P2** | Cleanly contained in `max-w-7xl` with 32px margins, readable across desktop viewports. |

---

## 6. Brand Studio Resolution & Superseded Proposals

> [!NOTE]
> **Cancellation of Proposed 3-Pane Redesign:**
> The earlier proposed 3-pane redesign (Agent Rail + Canvas + Inspector) was explicitly **CANCELLED**.
> - The existing Brand Studio architecture, user journey, modal workflows, cards, and state machines are fully **preserved**.
> - Only responsive normalization was applied:
>   - `< 1024px`: Fluid available width
>   - `1024px–1279px`: `max-w-4xl` (896px)
>   - `1280px–1535px`: `max-w-5xl` (1024px)
>   - `≥ 1536px`: `max-w-6xl` (1152px)
> - Nested vertical scrollbar pathology was resolved cleanly without redesigning the product.

---

## 7. Canonical Global Website Architecture Integration

The Creator layout foundation has been formalized into the **Canonical Global Website Screen-Size & Layout Architecture** across the entire Mondial Business Creation (MBC) platform:

### A. Authoritative Global Breakpoints
- `< 768px` → **Mobile** (persistent sidebar hidden, drawer sheet navigation, full available main width)
- `768px–1023px` → **Tablet** (persistent sidebar hidden, drawer sheet navigation, full available main width)
- `1024px–1439px` → **Compact Desktop / Tablet Landscape** (persistent 264px sidebar, remaining dashboard column = `Viewport - 264px`)
- `1440px–1919px` → **Full Desktop** (persistent 264px sidebar, remaining dashboard column = `Viewport - 264px`)
- `≥ 1920px` → **Complete MBC Application Frame capped at 1920px and horizontally centered** (`margin-inline: auto` / `flex justify-center`)

### B. Ultrawide Behavior at 2560px
- Global application frame = `1920px` centered.
- Left margin = `320px`, Right margin = `320px`.
- Fixed desktop sidebar docks at `left: 320px` inside the 1920px frame (`left: max(0px, calc((100vw - 1920px) / 2))`).
- Dashboard geometry inside 1920px shell: `264px` Sidebar + `1656px` Dashboard Column (`Topbar` + `Main`).
- Zero browser-level horizontal scroll (`document.documentElement.scrollWidth <= document.documentElement.clientWidth`).

### C. Theme Toggle Integration
- Reuses existing `next-themes` provider and tokens across all dashboard roles (Creator, Entrepreneur, Investor, Service Provider desktop/mobile, Phase 2 Topbar).

---

## 8. Final Automated Validation Suite Results

- **TypeScript (`npx tsc --noEmit`)**: 0 errors
- **Unit & Integration Tests (`npm run test`)**: 120 / 120 test files passed (1,036 tests passed)
- **Production Build (`npm run build`)**: 181 / 181 static and dynamic routes compiled successfully
- **Playwright Layout Regression**: 18 layout families × 12 viewports (216 test runs) = **0 failures**

