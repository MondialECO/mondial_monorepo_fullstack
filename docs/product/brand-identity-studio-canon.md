# Mondial ECO — Brand Identity Studio Flow Canonical Documentation

Source of truth for development and architecture of the **Brand Identity Studio (Creator Phase 2 / Visual Identity)**.

**Last reconciled with code: 2026-09-20.**

---

## 1. Overview & Architectural Principles

The **Brand Identity Studio** (`/dashboard/creator/phase-2/brand-studio`) operates as an enterprise-grade visual identity workspace built into Creator Phase 2.

### Architectural Canon
- **Control Center Principle**:
  - **Page = persistent overview / control center** (View Mode)
  - **Modals = creation and editing tools** (on-demand or sequential)
- **Legacy Wizard Topbar Removed**: The legacy persistent wizard-style topbar (`BrandStudioProgressBar`) has been completely removed from `/dashboard/creator/phase-2/brand-studio`.
  - Removed elements: Back, INSTALY, Visual Identity Studio, Strategy, Direction, Logo type, Logo, Colour, Typography, Studio Live, step icons, progress connectors, active/locked state styling, connecting lines, and the `VIEW MODE` badge.
  - Streamlined persistent header:
    - **Title**: `Brand Studio`
    - **Subtitle**: `Your Visual Identity — Review and manage your complete brand identity.`
- **Removed UI-Only State**: Obsolete topbar-only state and handlers (`inFlightStatus`, `stepSegments`, `currentProgressBarKey`, `handleSelectStep`, `handleBackNavigation`) and redundant `onBack` in `page.tsx` were eliminated. Core modal orchestration state (`activeModal`, `isSequentialFlow`) remains canonical.
- **Workflow Modes**:
  1. **Brand-New Creator (First-Time Setup)**: If `hasMeaningfulBrandData(kit)` evaluates to false, Studio auto-launches `StrategyReviewModal` in sequential mode (`isSequentialFlow = true`) chaining across all 7 stages:
     `StrategyReviewModal` → `DirectionBoardModal` → `LogoTypeChooserModal` → `LogoCreationModal` → `VariationSetModal` → `ColorSystemModal` → `TypographySystemModal` → View Mode.
  2. **Existing / Partial Brand**: If meaningful brand data exists, Studio renders View Mode directly without auto-opening any modal (`activeModal = null`). Incomplete sections render `IncompleteSectionCard` with action buttons.
  3. **On-Demand Section Edit**: The creator clicks "Edit" on a specific card, opening only that modal (`isSequentialFlow = false`). Saving returns the user directly to the View Mode overview.

### The 7 Modal Workflow Tools
0. **Entry: Branding Options** (`/dashboard/creator/phase-2/branding`) — Single-card presentation reconciled with Figma (`57007:12780` revision).
1. **Stage 1: Strategy Review** (`StrategyReviewModal.tsx`) — Figma Node `57003:9780` / `57004:9812`
2. **Stage 2: Direction Board** (`DirectionBoardModal.tsx`) — Figma Node `57012:9066`
3. **Stage 3: Logo Type Chooser** (`LogoTypeChooserModal.tsx`) — Figma Node `57004:10297`
4. **Stage 4: Logo Creation** (`LogoCreationModal.tsx`) — Figma Node `57004:10578`
5. **Stage 5: Logo Variations Set** (`VariationSetModal.tsx`) — Figma Node `57004:11174`
6. **Stage 6: Color System** (`ColorSystemModal.tsx`) — Figma Node `57004:11600`
7. **Stage 7: Typography System** (`TypographySystemModal.tsx`) — Figma Node `57004:12100`

### 1.1 Viewport Responsiveness & Typography Scale Canon
- **Viewport Scaling**: Authored at 1440px desktop base, engineered to stay fluidly responsive from 1440px up to 1920px (and down to mobile viewports).
- **Modal Scroll Behavior & Known Consequences**: All 7 studio modals constrain height to `max-h-[90vh]` with fixed header/footer strips and internal `overflow-y-auto` body containers:
  - At 1440×900: Strategy Review and Direction Board fit cleanly with modest scroll; Color System overflows by ~510px, Typography System by ~340px, and Variation Set by ~180px. These scroll consequences are **accepted and recorded as known**—an internally scrollable modal with legible 14px text is strictly superior to illegible micro-text, and modal layout restructuring is deferred.
  - At 1920×1080: Strategy Review, Direction Board, and Logo Creation fit fully within viewport without scroll; Color, Typography, and Variation Set modals scroll cleanly.
  - Light & Dark theme parity: 100% token-based scrollbars and container borders.
- **Completed Typography Token Migration (Stages 1, 2, and 3 Complete)**:
  - All arbitrary bracket sizes (`text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[13px]`, `text-[15px]`, `text-[28px]`, `text-[32px]`) are eliminated across the entire Creator workflow (Phase 1, Phase 2 Brand Studio, Phase 3 Intel, Phase 4 Pricing/Offers, Phase 5/6 Crossroads/Sales, Project Studio, Documents, Asset Library, and Print Views).
  - **Single Source of Truth**: `src/app/globals.css` (lines 155–167) is the sole authority for token values:
    - `text-page-heading`: 30px
    - `text-section-title`: 16px
    - `text-card-title`: 16px
    - `text-body`: 14px
    - `text-label`: 14px
    - `text-input`: 14px
    - `text-button`: 14px
    - `text-caption`: 14px
    - `text-table-header`: 14px
    - `text-footnote`: 14px
    - `text-badge`: 12px
    - `text-stat-lg`: 30px
    - `text-stat-xl`: 36px
  - **Mono-on-Prose Rule (Active Habit)**: `font-mono` is strictly prohibited on descriptive prose paragraphs, milestone lists, and section labels. It is an **active habit on every new screen** to enforce `font-sans` on prose and reserve `font-mono` exclusively for numeric metrics, currency figures, and raw code tokens.
- **Design Tokens**: 100% theme token classes (`bg-background`, `text-foreground`, `bg-card`, `border-border/80`, `bg-primary`, `text-primary-foreground`, `text-muted-foreground`), zero raw hex.

---

## 2. Page & Modal Specifications

### 2.0 Branding Entry Screen (`/dashboard/creator/phase-2/branding`)
- **Figma Reference**: Node `57007:12780` / `57003:9780`
- **Layout**: Centered single-card container (`max-w-[680px]`). The icon tile from earlier drafts was removed per an updated Figma revision.
- **Card Content**:
  - Title: `"Build your brand identity"` & Subtitle in DM Sans (`font-sans`).
  - Studio Deliverables Checklist: 6 concrete deliverables (`Brand strategy`, `Visual direction`, `Logo concepts`, `7 logo variations`, `5-role colour system`, `4-role typography system`).
  - Single filled blue primary CTA: `"Open Brand Studio"` (routes to `/dashboard/creator/phase-2/brand-studio`).
  - Navigation Footer: `"Back"` and quiet `"Skip Branding for Now"` action calling `creatorJourneyApi.skipBranding()` routing directly to `/complete`.

### 2.1 Step 1: Strategy Review Modal (`StrategyReviewModal.tsx`)
- **Figma Reference**: Node `57003:9780` / `57004:9812`
- **Purpose**: Review and hand-refine brand strategy tokens, tone, and first placement before visual rendering begins.
- **Per-Field Edit Tracking (`BrandProvenancedText`)**:
  - Four core text fields are tracked individually: `Concept`, `TargetAudience`, `Industry`, and `Positioning`.
  - Backend (`CreatorBrandKitController.PatchStrategy`): Whenever any of these 4 fields has its `.Value` modified via `BrandStrategyPatchDto`, the controller updates `.Value`, sets that field's `.EditedAt = DateTime.UtcNow`, and marks `.Provenance = "user_refined"`.
  - Untouched fields retain `.EditedAt = null` and their original provenance (`"derived"` / `"stated"`).
  - Frontend Rendering: Dynamically computes and displays relative-time `"EDITED X AGO"` badges (e.g. `EDITED 5 MINUTES AGO`, `EDITED JUST NOW`) using `date-fns` `formatDistanceToNowStrict` only when `editedAt` is non-null. Untouched fields display a clean `"From your idea"` badge with no timestamp.
- **Interactive Tone & Placement Tokens (Fully Wired & Consumed Downstream)**:
  - `TonePosition` / `Tone`: Interactive Formal $\leftrightarrow$ Casual slider (1–5 scale).
  - `FirstAppearance`: Selection choice for where the mark first appears (`website`, `app_icon`, `invoice`, `social`).
  - **Downstream Consumer Integrations**:
    1. `LogoTypeChooserModal.tsx`: Consumes `firstAppearance` and `tone` to compute family fit scores and display context-aware reasoning badges (e.g. `"Best for invoice headers"`, `"Matches your tone"`).
    2. `DirectionGenerationService.cs` & `TypographyGenerationService.cs`: Ingest `Tone` and `FirstAppearance` as prompt tuning inputs for Gemini direction & pairing generation.
    3. `BrandKitHubView.tsx`: Displays `Tone` and `First Appearance` on the Strategy summary card.
- **Other Editable Strategy Attributes**:
  - `nameDisplayForm`: Editable brand name casing and typography rendering.
  - `personalityTraits`: Tag cloud editor (add/remove up to 8 traits).

### 2.2 Step 2: Direction Board Modal (`DirectionBoardModal.tsx`)
- **Figma Reference**: Node `57012:9066`
- **Purpose**: Select high-level creative direction from 4–8 curated candidate boards.
- **Components**:
  - Primary + Accent color swatches.
  - Heading font + Text font pairing preview.
  - Moodboard visual assets with dynamic regeneration rotation.

### 2.3 Step 3: Logo Type Chooser Modal (`LogoTypeChooserModal.tsx`)
- **Figma Reference**: Node `57004:10297`
- **Purpose**: Select the structural family for logo generation.
- **Families**:
  1. `symbol_plus_name`: Standalone icon mark + brand wordmark.
  2. `wordmark`: Typographic wordmark with custom glyph ligature.
  3. `monogram`: Two-letter architectural initial monogram (`AI`, `AB`).
  4. `abstract`: 3D faceted geometric / mathematical mark.
  5. `icon`: Technology or organic modern metaphor (Shield, Nodes, Prism, Spark).
  6. `minimal`: Swiss minimalist sliced geometric primitives.

### 2.4 Step 4A: Logo Creation Modal (`LogoCreationModal.tsx`)
- **Figma Reference**: Node `57004:10578`
- **Features**:
  - **3×2 Concept Grid**: 6 distinct parametric vector concepts.
  - **3 View Modes**:
    1. `mark`: Vector mark SVG + centered brand name.
    2. `invoice`: Live real-world Invoice header mock (`InvoiceMockHeader.tsx`).
    3. `16px`: Micro-scale favicon inspection (`MicroScaleViewer.tsx`).
  - **Compare Mode**: Select 2 concepts to open `CompareOverlay.tsx` with side-by-side zoom and light/dark contrast comparison.
  - **Regeneration**:
    - Batch redraw (4 credits, capped at 3 batch redraws).
    - Per-tile redraw (2 credits, capped at 3 per-concept redraws).
    - Dynamic cache-busting via `?v=${version}` and unique React `key` bindings.

### 2.5 Step 4B: Approved Logo Variation Set Modal (`VariationSetModal.tsx`)
- **Figma Reference**: Node `57004:11174`
- **Header**:
  - Title: `"Your logo, in every form"`
  - Subtitle: `"Seven variations built from Concept 04. Same geometry throughout — only arrangement and colour change."`
  - Top Action: `"Download set"` button (DM Mono) + `"STEP 4 OF 6"` badge + Close button.
- **Batch Summary Metadata Strip**:
  - `SOURCE`: `Concept 04` | `VARIATIONS`: `7` | `FORMATS`: `SVG + PNG` | `COST`: `Free, derived` | `✓ No credits used`
- **7 Deterministic Logo Variation Tiles**:
  1. `PRIMARY` (3:1): Primary full-color lockup for light backgrounds. Pinned green `PRIMARY` badge.
  2. `HORIZONTAL` (4:1): Compact lockup for navbars & email signatures. Hover actions with `"Redraw just this variation"` tooltip.
  3. `STACKED` (1:1): Centered emblem lockup for square avatars & packaging.
  4. `ICON-ONLY` (1:1): Standalone mark with 3 micro-scale fidelity proofs (`64px`, `32px`, `16px`).
  5. `BLACK` (3:1): 100% solid black monochrome for print, fax, and laser engraving.
  6. `WHITE` (3:1): 100% pure white knockout on isolated dark ground (`#0A1128`).
  7. `TRANSPARENT` (3:1): 32-bit RGBA alpha channel preview with `PNG · ALPHA` corner chip.
- **Actions**:
  - `"Export ZIP"`: Complete client-side `.zip` bundle via `JSZip`.
  - Individual download on hover.
  - `"Approve all seven"`: Persists `approvedAt` to backend and advances workflow.

### 2.6 Step 5: Color System Modal (`ColorSystemModal.tsx`)
- **Figma Reference**: Node `57004:11484` (and `57004:11600`)
- **Header Cluster**:
  - Title: `"Your colour system"`
  - Subtitle: `"Five roles pulled from your logo. Each one has a job — change any of them without touching the rest."`
  - Top Action: `"Regenerate palette"` button with refresh icon + `[N]/3 LEFT` amber cap badge + `"STEP 5 OF 6"` badge + Close button.
  - Fixed 6-step progress bar track with Step 5 "Colour" active.
- **Palette Mood Filter Strip**:
  - `PALETTE MOOD` uppercase mono label.
  - 4 instant tuning chips: `As generated`, `Calmer`, `Warmer`, `Higher contrast`.
  - Right helper text: `"Switching mood is free — it doesn't use a regenerate."`
- **5 Canonical Brand Roles (Section A)**:
  1. `Primary`: `"Buttons, links, the one thing you want clicked."` + `Core Brand` badge.
  2. `Secondary`: `"Headlines, navigation, dense text areas."` + `LOCKED` badge when protected.
  3. `Accent`: `"Highlights, badges, small emphasis only."` + `EDITED` badge when custom-tuned.
  4. `Background`: `"Page and surface background."` + Ground note `"Used as a ground, not for text."` (null contrast).
  5. `Text`: `"Body copy on background."` + high-contrast `AAA` ratio.
  - Features per row: 68×68 swatch well with native color picker, bold uppercase HEX code with copy action, RGB triplet, WCAG 2.1 contrast ratio badge (`AAA`, `AA`, `AA Large`, `FAIL`), slider adjust button with `"Adjust this role only — free"` tooltip, and lock/unlock toggle against regeneration.
- **Live Application Preview (Section B: "How it looks together")**:
  - Segmented control tabs: `Website`, `Invoice`, `Deck`.
  - 220px tall preview band with live dynamic background (`bgColor`):
    - `Website`: Live navigation bar, hero headline, subtitle, primary CTA, secondary CTA, live network badge.
    - `Invoice`: Clean invoice header with `#INV-2026-089`, paid badge, items table, and total callout.
    - `Deck`: Pitch deck slide frame `SLIDE 04` with executive summary title, subline, and 3 metric callout cards (+142% MoM, 99.4% Retention, $4.2M ARR).
- **Footer**:
  - Info note: `"5 Canonical Roles · Free Hex Edits · 3-Cap Palette Regen"`.
  - Actions: `"Cancel"` (ghost) + `"Confirm Colour System"` (primary blue with `ArrowRight` icon).

### 2.7 Step 6: Typography System Modal (`TypographySystemModal.tsx`)
- **Figma Reference**: Node `57004:11793`
- **Header Cluster**:
  - Title: `"Your typography"`
  - Subtitle: `"Two families, four roles. The display face carries personality; the text face carries everything people actually read."`
  - Top Action: `"Suggest other pairings"` button with refresh icon + `[N]/3 LEFT` amber cap badge + `"STEP 6 OF 6"` badge + Close button.
  - Fixed 6-step progress bar track with Step 6 "Typography" active.
- **Section A: Pairing Choice ("PICK A PAIRING")**:
  - Header with `"PICK A PAIRING"` mono label and `"Tuning below updates automatically"` helper note.
  - 3 Pairing Cards Grid:
    1. `Syne + DM Sans`: `"Geometric and assertive, with a neutral workhorse underneath."` (`Open licence`, `5 weights`, `48kb`).
    2. `Plus Jakarta Sans + Inter`: `"Warmer headlines, same clarity in body copy."` (`Open licence`, `6 weights`, `52kb`).
    3. `Space Grotesk + Inter`: `"Technical and precise, closer to documentation."` (`Open licence`, `4 weights`, `44kb`).
  - Interactive selection updates active families and auto-patches typography configuration.
- **Section B: Four Roles Specimen Editor ("FOUR ROLES")**:
  - Header with `"FOUR ROLES"` mono label and `"Tuning is free"` helper note.
  - Single Unified Card with 4 divided rows:
    1. `Logo type` (ROW 1 - LOCKED STATE): `"Locked to your wordmark. Changing this would redraw your logo."` + `{DisplayFamily} · Bold · 40px / 1.1` specimen badge + live business name specimen.
    2. `Heading`: `"Page titles, section headers, deck slides."` + `{DisplayFamily} · Bold · 40px / 1.2` + live tagline specimen with font weight selector.
    3. `Body`: `"Paragraph copy, descriptions, customer communication."` + `{TextFamily} · Regular · 16px / 1.5` + multi-line paragraph specimen with font weight selector.
    4. `Button & label`: `"Action triggers, badges, navigation items, metrics."` + `{TextFamily} · Medium · 14px / 1.0` + interactive button and status badge specimens.
- **Footer**:
  - Info note: `"2 Font Families · 4 Canonical Roles · Zero Credit Hand-Tuning"`.
  - Actions: `"Cancel"` (ghost) + `"Confirm & Complete Brand Kit"` (primary blue with `ArrowRight` icon). Calling confirmation marks kit as `Status = "complete"`, advancing the creator journey.

### 2.8 Brand Kit Hub Page (`BrandKitHubView.tsx`)
- **Figma Reference**: Node `57004:12057`
- **Layout**: Centered 1080px canonical column on 1440px/1920px viewports with `#EFEFF1` (light) / `#0c0d0e` (dark) canvas.
- **Identity Block**:
  - Top Row: 56px Avatar mark box, brand title, `v1` version badge, `"v1 · Stored in Mondial cloud"`, `"Updated {Date}"`, `"Open in Studio"` button, `"Download all assets (.zip)"` client-side JSZip packaging button.
  - 4-Column Metadata Strip: `STATUS: Ready to use` (emerald dot), `TIED TO: {brandName} (Project #{shortId})`, `STORAGE: SVG + PNG + CSS + JSON Tokens`, `VERSION: v{kit.version}.0.4`.
- **Section 1 (Logo)**:
  - Header: `"Logo"` + `"6 LOCKUPS READY"` badge + `"Open in Studio"` button.
  - 240px Hero Band: Centered active lockup container with interactive switching.
  - 6 Thumbnails Row: `HORIZONTAL`, `STACKED`, `ICON-ONLY`, `BLACK`, `WHITE`, `TRANSPARENT`.
- **Section 2 (Colour)**:
  - Header: `"Colour"` + `"5 ROLES"` badge + `"Contrast checked"` shield check badge + `"Open in Studio"` button.
  - 5 Swatch Cards Grid: 110px color fill, role names (`Primary`, `Secondary`, `Accent`, `Background`, `Text`), uppercase hex codes, RGB values, WCAG contrast ratio badges (`AAA`/`AA`), usage notes, one-click copy hex.
- **Section 3 (Typography)**:
  - Header: `"Typography"` + `"4 ROLES · 2 FAMILIES"` badge + `"Open licence"` check badge + `"Open in Studio"` button.
  - 4 Divided Rows: `Logo type` (locked), `Heading`, `Body`, `Button & label` (`Start free` pill & `INVOICE NUMBER` label).
- **Section 4 (Strategy)**:
  - Header: `"Strategy"` + `"Open in Studio"` button.
  - 2-Column 6-Fact Grid: `BUSINESS NAME`, `CONCEPT`, `AUDIENCE`, `INDUSTRY` (badge pill), `POSITIONING`, `PERSONALITY` (trait badges).
- **Section 5 (Used by)**:
  - Header: `"Used by"` + `"2 OF 4 CONNECTED"` badge.
  - 4 Integration Tiles: `Business plan` (Applied), `Landing page` (Applied), `Pitch deck` (Not generated yet), `Invoices` (Not generated yet).
- **Section 6 (Coming Soon)**:
  - 2 Cards: `Brand assets` and `Brand guidelines PDF` with `"Coming soon"` badges.
- **Footer Strip**:
  - Info note: `"Edits apply the next time a generator runs. Already-generated documents keep the version they were made with."`
  - Studio Modal & Navigation: Clicking `"Edit in Studio"` opens the corresponding studio modal (Strategy, Direction, Logo, Colour, Typography). Modals support linear progression with Next button transitioning to subsequent steps and ultimately completing to `/dashboard/creator/phase-2/complete`.

### 2.9 Phase 2 Complete Page (`Phase2CompletePage.tsx`)
- **Figma Reference**: Node `57007:12780`
- **Layout**: Centered 720px canonical column on 1440px/1920px viewports with `#EFEFF1` (light) / `#0c0d0e` (dark) canvas.
- **Header Cluster**:
  - Emerald circular check icon tile (56×56px).
  - Eyebrow / Super-title: `"✓ Phase 2 complete"`.
  - Main Title: Dynamic Project Name (`{businessName}`).
  - Subtitle: Dynamic Industry & Concept Summary (`{category} · {tagline}`).
- **Card 1: Brand Kit Showcase**:
  - Header: `"BRAND KIT READY"` mono pill + `"Open Brand Kit"` link with arrow routing to `/dashboard/creator/phase-2/brand-kit`.
  - 200px Logo Hero Band: Centered rendering of the approved primary vector mark and dynamic wordmark.
  - 3-Column Specimen Grid:
    1. *Colours*: 5 mini role swatches (`Primary`, `Secondary`, `Accent`, `Background`, `Text`) with hex labels.
    2. *Typography*: Display & Text font pairings (`{displayFamily} Bold / {textFamily} Regular`).
    3. *Logo Forms*: 4 variation chips (`Horizontal`, `Stacked`, `Dark`, `Light`).
- **Card 2: Project Summary**:
  - Header: 40×40px Mark avatar tile, Project Name, Tagline, and Industry Category badge pill.
  - 2×2 Facts Grid:
    1. *Target Audience*: Stated / derived audience context.
    2. *Positioning*: Value proposition statement.
    3. *Core Problem*: Clarified customer pain point.
    4. *Personality Traits*: Badges cloud (e.g. `Precise`, `Resilient`, `Autonomous`).
- **Card 3: Next Phase Strip ("Next: Phase 3 — Business plan")**:
  - Header: `"Next: Phase 3 — Business plan"` + `"4 TOOLS"` badge.
  - 4 Tool Preview Items: `Financial forecast`, `Business plan`, `Legal checklist`, `Formation generator`.
- **Centered Footer Actions**:
  - Primary CTA: `"Continue to Phase 3"` (`ArrowRight` icon) routing to `/dashboard/creator/phase-3`.
  - Secondary Row: `"Back to dashboard"` (`/dashboard/creator`) • `"Edit Brand Kit"` (`/dashboard/creator/phase-2/brand-studio`).

---

## 3. Vector Generation Engine & Asset Export Pipeline

- **C# Parametric Renderers** (`backend/Services/Creator/BrandKit/LogoEngine`):
  - `SymbolPlusNameLogoRenderer.cs`: Smart initial ligatures, primary/accent dual tones.
  - `MonogramLogoRenderer.cs`: Dual-letter architectural frames (`bracket_frame`, `chamfer_box`, `solid_disc`).
  - `AbstractLogoRenderer.cs`: 3D faceted diamonds, isometric optical cubes, Mobius loops.
  - `IconLogoRenderer.cs`: Security shields, organic sprout leaves, quantum node networks, optical prisms, energy bolts.
  - `MinimalLogoRenderer.cs`: 45° sliced circles, Neo-Swiss hairline cross, offset vertical data bars, concentric quadrant arcs.
- **Rasterization & Variations**:
  - `LogoVariationService.cs`: Uses SkiaSharp (`SKSvg` and `SKBitmap`) to generate pixel-perfect PNGs and vector SVGs directly on disk (`wwwroot/brand-assets/logos/{ideaId}/variations/`).

### 3.1 Canonical Media URL Resolution (`resolveMediaUrl`)
- **Single Resolver Canon**: All surfaces rendering or fetching brand assets MUST route relative and absolute URIs through `resolveMediaUrl(uri, version)` from `@/lib/brand-kit-media`.
- **Origin & SVG Data URI Handling**:
  - Automatically converts raw vector `<svg...` and `<?xml...` strings directly into RFC 2397 Data URIs (`data:image/svg+xml;utf8,...`), ensuring browser-renderability across all `<img>` tags without illegal URL path concatenation.
  - Prepends `API_ORIGIN` (e.g. `http://localhost:5093` in development) to server-relative asset paths (`/brand-assets/logos/...`), while preserving existing `data:`, `blob:`, `http://`, and `https://` URIs untouched.
- **PDF Export Logo & CORS Canon**:
  - In PDF export views (e.g., `MarketStudyPrintView`, `BusinessModelPrintView`), never specify `crossOrigin="anonymous"` on `<img>` tags for backend static files unless the ASP.NET static file middleware returns CORS headers; otherwise, the browser silently blocks the logo from rendering.
  - Always implement the 7-step candidate fallback chain (`primary`, `horizontal`, `transparent`, `badge_stamp`, `lockupAssetUri`, `markAssetUri`, `branding.logoAsset`), and render a branded monogram/lettermark badge if no image is available or errors out.
- **Applies Uniformly To**: Concept tiles, variation tiles, color system modals, compare overlays, logo cards, invoice mocks, micro-scale proofers, Brand Kit Hub, Phase 2 Complete summary cards, and Phase 3 PDF export views (Market Study & Business Model).

### 3.2 Canonical ZIP Export Engine (`src/lib/brand-kit-export.ts`)
- **Single Source of Truth**: All export actions across the application (`BrandKitHubView`, `VariationSetModal`, and the Creator `AssetLibraryPage`) delegate exclusively to `exportBrandKitZip(kit, customBrandName)`.
- **ZIP File Structure**:
  1. `/logos/`: Vector lockups and icon variations (`primary.svg`, `horizontal.svg`, `stacked.svg`, `icon-only.svg`, `black.svg`, `white.svg`, `transparent.svg`).
  2. `/tokens/colors.json`: 5-role WCAG contrast color palette definitions with HEX, RGB, and contrast ratios.
  3. `/tokens/typography.json`: Display and text font family definitions with role sizes, weights, line-heights, and specimens.
  4. `/tokens/brand-tokens.css`: Ready-to-use CSS Custom Properties (`:root { --brand-primary: ... }`).
  5. `/README.md`: Complete brand identity summary document with strategy metadata.

### 3.3 Concept Fallback & Fail-Loud Error Transparency
- **Concept Fallback Matrix**: If Step 3b logo variations have not yet been derived, `exportBrandKitZip` deterministically falls back to the approved concept mark and lockup assets (`approvedConcept.lockupAssetUri`, `approvedConcept.markAssetUri`) so creators can immediately export their confirmed visual identity.
- **Fail-Loud Error Policy**:
  - A failed asset fetch (404, network error, non-SVG response) MUST NEVER produce an empty `/logos/` folder or silently incomplete ZIP.
  - If any logo asset fails to fetch, `exportBrandKitZip` aborts the download immediately and throws an explicit error naming the failed variations and HTTP reasons: `Failed to export brand kit: could not retrieve logo assets for <variationKey> (<reason>)`.
  - Both `BrandKitHubView` and `AssetLibraryPage` catch this and display a prominent, dismissible on-screen error banner.

---

## 4. Testing & Verification Canon
- All Brand Studio components and export pipelines are covered by automated unit and integration suites:
  - `tests/creator/frontend/BrandKitExport.test.ts` (Canonical resolver, concept fallback, and fail-loud error verification)
  - `tests/creator/frontend/AssetLibrary.test.tsx` (Asset library rendering, lazy session loading, ZIP download, and error alert rendering)
  - `tests/creator/frontend/BrandKitLogoCreationModal.test.tsx`
  - `tests/creator/frontend/BrandKitVariationSetModal.test.tsx`
  - `tests/creator/frontend/LogoTypeChooserModal.test.tsx`
  - `tests/creator/frontend/BrandKitHubView.test.tsx`
  - `tests/creator/frontend/BrandStudioShell.test.tsx`
- **Current Canonical Test Baseline (273/273 Passed)**:
  - Creator Navigation Suite: `192/192` (`npx tsx`)
  - Brand Studio Entry & Orchestration: `31/31` (`npx tsx`)
  - Brand Studio View Mode & UI: `42/42` (`npx tsx`)
  - Creator Stabilization 02: `8/8` (`npx vitest run`)
  - **Total**: **273/273 tests passed (0 failures)**
- **Real Browser Verification**:
  - `scripts/verify_brand_kit_real_browser.mjs`: Automated Playwright test verifying Case A (full variations download & ZIP unpacking), Case B (concept fallback ZIP unpacking), and Case C (deliberate 404 injection & on-screen error banner confirmation).

---

## 5. Freeze Status

- `CREATOR NAVIGATION ARCHITECTURE — COMPLETE & FROZEN`
- `CREATOR BRAND STUDIO ENTRY, VIEW MODE & EDITING ARCHITECTURE — COMPLETE & FROZEN`
- `CREATOR BRAND STUDIO LEGACY PROGRESS TOPBAR — REMOVED & FROZEN`


