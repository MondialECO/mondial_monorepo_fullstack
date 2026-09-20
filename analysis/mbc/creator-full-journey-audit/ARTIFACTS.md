# MBC Creator Journey — Artifacts, Persistence & Export Renderers

**Audit Date**: 2026-09-20  
**Audit Scope**: Artifact generation, persistence models, asset library surfacing, and export renderers at HEAD  
**Status**: CONFIRMED at HEAD  

---

## 1. Complete Artifact Inventory

| # | Artifact Name | Phase / Step Generated | MongoDB Storage Location | Export / Render Engine at HEAD | Working Export Path? | Surfaced in Asset Library? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Brand Kit & Assets** | Phase 2 (`/phase-2/brand-studio`) | `CreatorIdeas.Branding` | JSZip client bundle + SVG/PNG file stream | **YES** (ZIP containing SVG logos, PNGs, and `tokens.json`) | **YES** |
| **2** | **Market Study Report** | Phase 3.1 (`/phase-3/market-study`) | `CreatorArtifacts` (`type: "market_study"`) | QuestPDF backend renderer (`QuestPdfGenerator.cs`) | **YES** (Downloadable multi-page PDF via `GET /api/creator/phase-3/market-study/pdf`) | **YES** |
| **3** | **Business Model Canvas** | Phase 3.2 (`/phase-3/business-model`) | `CreatorArtifacts` (`type: "business_model"`) | QuestPDF backend renderer (`QuestPdfGenerator.cs`) | **YES** (Downloadable 1-page landscape PDF via `GET /api/creator/phase-3/business-model/pdf`) | **YES** |
| **4** | **3-Year Financial Forecast** | Phase 3.3 (`/phase-3/forecast`) | `CreatorArtifacts` (`type: "forecast"`) | Consolidated into Executive Business Plan PDF | **PARTIAL** (Standalone CSV export available; standalone PDF is bundled inside Business Plan PDF) | **YES** |
| **5** | **Legal & Compliance Checklist** | Phase 3.4 (`/phase-3/compliance`) | `CreatorArtifacts` (`type: "legal_compliance"`) | **None (In-App React UI Only)** | **NO** (No standalone PDF, CSV, or DOCX renderer exists) | **YES** (Renders in-app modal preview; export button is disabled) |
| **6** | **Formation Recommendation Memo** | Phase 3.5 (`/phase-3/formation`) | `CreatorArtifacts` (`type: "formation_generator"`) | **None (In-App React UI Only)** | **NO** (No standalone PDF or document renderer exists) | **YES** (Renders in-app modal preview; no export CTA) |
| **7** | **Executive Business Plan (12-Sec)** | Phase 3.6 (`/phase-3/business-plan`) | `CreatorArtifacts` (`type: "business_plan"`) | QuestPDF backend renderer (`QuestPdfGenerator.cs`) | **YES** (Downloadable formal 12-section PDF via `GET /api/creator/phase-3/business-plan/pdf`) | **YES** |
| **8** | **Investor Readiness Scorecard** | Phase 3.7 (`/phase-3/complete`) | `CreatorJourneys.Phase3.InvestorReadinessScore` | **None (In-App SVG/Radar UI Only)** | **NO** (No PDF or print sheet renderer exists) | **YES** (Surfaced as score badge; clicking opens in-app scorecard modal) |
| **9** | **Offer, Pricing & GTM Strategy** | Phase 4 (`/offer-pricing`) | `CreatorJourneys.Phase4` | **None (In-App React UI Only)** | **NO** (No PDF or export renderer exists) | **YES** (Surfaced as strategy summary; in-app view only) |

---

## 2. Renderer Gaps & Missing Exporters

### 2.1 Artifacts With No Working Exporters
The following 4 artifacts have completed UI and data representations in MongoDB, but have **zero document rendering pipeline** (QuestPDF, Puppeteer, or client-side PDF) at HEAD:
1. **Legal & Compliance Checklist** (`CreatorArtifacts`, `type: "legal_compliance"`)
   - Surface: `/dashboard/creator/phase-3/compliance` and `/asset-library`.
   - Behavior: Users can view the 12-item statutory checklist in the browser, but cannot export a signed or printable PDF for lawyers or accountants.
2. **Formation Recommendation Memo** (`CreatorArtifacts`, `type: "formation_generator"`)
   - Surface: `/dashboard/creator/phase-3/formation` and `/asset-library`.
   - Behavior: The comparison between SAS, SAS-U, and SARL, along with governance rules, cannot be exported as a formal legal memo.
3. **Investor Readiness Scorecard** (`CreatorJourneys.Phase3.InvestorReadinessScore`)
   - Surface: `/dashboard/creator/phase-3/complete`, `/dashboard/creator/investors`, and `/asset-library`.
   - Behavior: The 5-dimension scorecard (100-point breakdown) only exists as dynamic DOM elements. No exportable one-pager or investor teaser sheet exists.
4. **Offer, Pricing & GTM Strategy** (`CreatorJourneys.Phase4`)
   - Surface: `/dashboard/creator/offer-pricing` and `/asset-library`.
   - Behavior: Pricing matrix, 8-week launch timeline, and resource calculator results cannot be exported as a spreadsheet or slide deck.

### 2.2 Asset Library Behavior on Missing Renderers
- **Location**: `src/app/dashboard/creator/asset-library/page.tsx:140-195`.
- **Handling**:
  - For artifacts with working renderers (Brand Kit, Market Study, Business Model, Business Plan), an active `<Button variant="outline"><Download /> Export</Button>` is displayed, triggering direct file download.
  - For artifacts without renderers (Legal Checklist, Formation Memo, Investor Scorecard, GTM Strategy), the Asset Library renders a `<Button variant="ghost"><Eye /> View</Button>` which triggers an in-app slide-over panel.
  - **Silent Failure Guard**: The UI does **not** fail silently; it intentionally omits the download button for unrendered artifacts. However, there is no tool-tip or messaging explaining why an export is unavailable.
