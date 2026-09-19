# Flow Gap Analysis — Creator Phase 2 & Phase 3

**Audit Date:** 2026-09-19  
**Monorepo:** `mondial_monorepo_fullstack`  
**Classification:** `BLOCKER` · `HIGH` · `MEDIUM` · `LOW` · `UX POLISH`

---

## 1. Summary of Identified Gaps

| ID | Severity | Category | Screen / Route | Issue Summary |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | `HIGH` | Dead Route / Redundancy | `/phase-2/hire-designer` | M50 Designer booking is reachable via direct URL but has no active inbound trigger in the current canonical Phase 2 flow. |
| **GAP-02** | `HIGH` | Dead Route / Prototype | `/phase-2/logo-tool` | Orphan prototype wrapper directly loading `LogoCreationModal` in isolation, bypassing `BrandStudioShell` and failing to persist brand kit state. |
| **GAP-03** | `MEDIUM` | Repeated Input | Phase 2 -> Step 3.1 & 3.4 | Target user profile is collected in Clarifier (Phase 2), but TAM sizing in Step 3.4 defaults to €50M and does not auto-populate from Step 3.1 TAM output. |
| **GAP-04** | `MEDIUM` | Navigation Ordering | Step 3.3 -> Step 3.4 | Business Plan is placed at Step 3.3 before Financial Forecast (Step 3.4) and Legal (Step 3.5), causing Section 7 (Financials), Section 8 (Team), and Section 12 (Legal) to display unpopulated placeholders on initial generation. |
| **GAP-05** | `MEDIUM` | Context Loss Risk | Deep linking without `?ideaId=` | If a user opens `/dashboard/creator/phase-3/compliance` directly without `?ideaId=`, the page must rely on the global active idea in React state; if the session refreshes, it falls back to the user's default idea. |
| **GAP-06** | `LOW` | Step Numbering Mismatch | Phase 2 Steps 6, 7, 8, 9, 12 | Backend `DerivePhase2Step` uses historical legacy step numbers (6, 7, 8, 9, 12) reflecting the older 12-step path, while frontend presents Phase 2 as a seamless 5-screen flow. |
| **GAP-07** | `LOW` | Mobile Rail Layout | Step 3.5 Compliance Workspace | On screens under 1024px, the 3-column layout (Stage Navigation, Canvas, AI Guide Rail) stacks into a very long vertical document where the AI rail is pushed to the bottom. |
| **GAP-08** | `UX POLISH` | Skip Branding Clarity | `/phase-2/branding` | "Skip for now" directly advances the user to `/phase-2/complete` without clarifying that brand assets will be defaulted to empty monogram placeholders in downstream documents. |
| **GAP-09** | `UX POLISH` | Breadcrumb Traceability | Phase 3 Header | Breadcrumbs currently read `Phase 3 · Business Plan Intelligence` without linking back directly to intermediate steps (e.g. jumping from 3.6 to 3.2 requires multiple back clicks or sidebar navigation). |

---

## 2. Detailed Gap Findings

### GAP-01: Dead Route — `/phase-2/hire-designer`
- **Classification:** `HIGH`
- **Location:** `src/app/dashboard/creator/phase-2/hire-designer/page.tsx`
- **Description:** This page contains a fully built interface for browsing, reviewing, and booking M50 verified branding designers. However, the canonical Phase 2 branding gateway (`/dashboard/creator/phase-2/branding`) only displays two buttons: "Open Brand Studio" and "Skip for now". The M50 booking option was unlinked during the consolidation to `BrandStudioShell`.
- **Evidence:** `src/app/dashboard/creator/phase-2/branding/page.tsx` lines 50–90 render only the studio launch card and skip button.
- **Recommended Action:** Either surface "Collaborate with an M50 Designer" as a third tier on `/phase-2/branding` or deprecate and redirect the route to avoid orphan maintenance.

---

### GAP-02: Dead Route — `/phase-2/logo-tool`
- **Classification:** `HIGH`
- **Location:** `src/app/dashboard/creator/phase-2/logo-tool/page.tsx`
- **Description:** A legacy 30-line standalone page that renders `LogoCreationModal` directly. When completed, it pushes to `/phase-2/complete` without executing the other 6 steps of the Brand Studio (Strategy, Directions, Color Palette, Typography Pairing, etc.), resulting in an incomplete brand profile.
- **Evidence:** `src/app/dashboard/creator/phase-2/logo-tool/page.tsx` lines 12–14: `handleConfirm` pushes directly to `/dashboard/creator/phase-2/complete`.
- **Recommended Action:** Deprecate `/dashboard/creator/phase-2/logo-tool` and redirect all incoming requests to `/dashboard/creator/phase-2/brand-studio`.

---

### GAP-03: Repeated Input / Disconnected TAM
- **Classification:** `MEDIUM`
- **Location:** Step 3.1 (`/phase-3/market-study`) to Step 3.4 (`/phase-3/forecast`)
- **Description:** Market Study computes a numeric TAM in Step 3.1 (`tamSamSom.tam.amount`). However, when the user arrives at Step 3.4 Forecast, the TAM input defaults to `50,000,000` rather than auto-populating with the validated TAM from Step 3.1.
- **Evidence:** `src/app/dashboard/creator/phase-3/forecast/page.tsx` line 113: default state `tam: 50_000_000` is hardcoded instead of seeded from `marketStudySession.output.tamSamSom.tam.amount`.
- **Recommended Action:** Hydrate `inputs.tam` in `ForecastPage` from the upstream `MarketStudySession` output if present.

---

### GAP-04: Upstream Synchronization in Business Plan (Step 3.3)
- **Classification:** `MEDIUM`
- **Location:** Step 3.3 (`/phase-3/business-plan`)
- **Description:** The current step sequence places the comprehensive 12-section Business Plan at Step 3.3, BEFORE Step 3.4 (Forecast), Step 3.5 (Compliance), and Step 3.6 (Formation). As a consequence:
  - Section 7 (Financial Projections) shows an empty placeholder until the creator later completes Step 3.4.
  - Section 8 (Team Needs & Structure) shows an empty placeholder until Step 3.6 is finished.
  - Section 12 (Legal Framework) shows default text until Step 3.5 is evaluated.
- **Evidence:** `src/app/dashboard/creator/phase-3/business-plan/page.tsx` lines 144–146, 158–160, 207.
- **Recommended Action:** Document this circular dependency clearly or consider repositioning the full Business Plan synthesis as the penultimate consolidation step (Step 3.6) before Investor Readiness (Step 3.7).

---

### GAP-05: Context Loss in Direct Route Access
- **Classification:** `MEDIUM`
- **Location:** All Phase 3 sub-pages
- **Description:** While `useCreatorProgress` provides an in-memory `activeIdeaId`, direct bookmarked links or shared URLs to `/phase-3/compliance` without `?ideaId=...` rely solely on the backend user's active idea. If a user owns multiple ideas and navigates between them, deep linking without query parameters can inadvertently display the wrong venture's compliance roadmap.
- **Evidence:** `ComplianceWorkspacePage` checks `searchParams.get('ideaId')`, but navigation inside `Phase3SetupShell` does not always propagate `?ideaId=${activeIdeaId}` across tabs.
- **Recommended Action:** Ensure all intra-phase route push calls preserve `?ideaId=${activeIdeaId}` if an explicit idea is selected.

---

### GAP-06: Step Numbering Divergence in Phase 2
- **Classification:** `LOW`
- **Location:** `backend/Services/Implementations/CreatorJourneyService.cs`
- **Description:** The backend assigns `CurrentStep` values of `6`, `7`, `8`, `9`, and `12` for Phase 2. This is an artifact of the historical 12-step path where raw idea discovery and problem interview occupied steps 1–5. The frontend handles this seamlessly by mapping steps to specific sub-routes, but it creates cognitive dissonance for developers inspecting API payloads.
- **Evidence:** `CreatorJourneyService.cs` lines 410–417.
- **Recommended Action:** Update backend step derivation comments or normalize Phase 2 step integers (1 through 5) in a future API revision.

---

### GAP-07: Mobile Responsiveness in Compliance Workspace
- **Classification:** `LOW`
- **Location:** `src/app/dashboard/creator/phase-3/compliance/page.tsx`
- **Description:** The compliance workspace employs a 3-pane desktop layout: Stage Navigation (left 280px), Requirement Canvas (center), and AI Guide Rail (right 320px). On viewport widths < 1024px, these columns stack vertically, creating an extremely tall page where the contextual AI assistant is pushed far below the fold.
- **Evidence:** `src/app/dashboard/creator/phase-3/compliance/page.tsx` lines 380–440 grid classes: `grid-cols-1 lg:grid-cols-[280px_1fr_320px]`.
- **Recommended Action:** On mobile/tablet, introduce a collapsible bottom sheet or tabbed switcher between the Requirement Canvas and the AI Guide Rail.

---

### GAP-08: Ambiguous "Skip for now" on Branding
- **Classification:** `UX POLISH`
- **Location:** `src/app/dashboard/creator/phase-2/branding/page.tsx`
- **Description:** Clicking "Skip for now" marks `brandingMethod = "skipped"` and advances the creator to `/phase-2/complete`. However, the UI does not explain to the creator what skipping entails (e.g. that system-generated lettermarks and standard monochrome palettes will be used in subsequent business plan exports).
- **Evidence:** `src/app/dashboard/creator/phase-2/branding/page.tsx` lines 95–105.
- **Recommended Action:** Add a small explanatory tooltip or subtext under "Skip for now" noting: "You can always create your logo and color system later from your project settings."

---

### GAP-09: Non-Clickable Breadcrumb Parent Nodes
- **Classification:** `UX POLISH`
- **Location:** `src/components/creator/Phase3SetupShell.tsx`
- **Description:** The header eyebrow displays `Step 3.X` and the title, but the top bar lacks a clickable sequence bar allowing rapid jumping between completed steps. A creator on Step 3.5 wanting to verify their Step 3.1 Market Study must click "Back" four times or exit to the dashboard.
- **Evidence:** `Phase3SetupShell.tsx` renders static title and description with a simple back button.
- **Recommended Action:** Incorporate a horizontal step progress bar with direct click-through to any previously completed Step in Phase 3.
