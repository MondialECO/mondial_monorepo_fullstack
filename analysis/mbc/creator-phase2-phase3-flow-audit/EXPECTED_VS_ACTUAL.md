# Expected vs. Actual Journey Comparison — Creator Phase 2 & Phase 3

**Audit Date:** 2026-09-19  
**Monorepo:** `mondial_monorepo_fullstack`  
**Evaluation:** `MATCHES` · `DIFFERS` · `MISSING` · `EXTRA` · `BETTER EXISTING FLOW`

---

## 1. Phase 2: Project Identity & Branding

### Target Conceptual Flow:
```text
Raw Idea
   ↓
Idea Clarification
   ↓
Project Concept
   ↓
Project Name
   ↓
Brand Foundation
   ↓
Visual Direction
   ↓
Color
   ↓
Typography
   ↓
Logo
   ↓
Brand Assets
   ↓
Mockups
   ↓
Brand Result
```

### Stage-by-Stage Comparison:

| Target Stage | Actual Implemented Code | Status | Finding & Architectural Difference | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Raw Idea** | `/dashboard/creator/phase-2` | **DIFFERS** | The raw idea input prompt is integrated directly as Step 1 of the conversational chat inside `/phase-2/clarifier` rather than as a separate static landing form. | **Keep existing flow**: The conversational start reduces initial friction and leads directly into the clarifying questions. |
| **Idea Clarification** | `/dashboard/creator/phase-2/clarifier` | **MATCHES** | 6-question AI interview explicitly covers: Problem, Solution, Target Audience, Existing Alternatives, Founder Edge, and Why Now, updating live clarity ring (0–100). | **Maintain as is**: Core engine is robust, responsive, and adheres to canon. |
| **Project Concept** | `/dashboard/creator/phase-2/idea-summary` | **BETTER EXISTING FLOW** | Synthesizes the interview into a single confirmation card with key takeaways, clarity ring, and category recommendation. | **Maintain as is**: Clean validation screen before naming. |
| **Project Name** | `/dashboard/creator/phase-2/concept-name` | **MATCHES** | Features 4 AI name suggestion cards with 1-click select OR custom naming input (with 60-character ceiling and generic term validation) + tagline + category. | **Maintain as is**: Excellent UX with both AI and manual options. |
| **Brand Foundation** | `BrandStudioShell` -> `StrategyReviewModal` (Step 1) | **MATCHES** | Modal reviews venture keywords, personality attributes, and audience alignment before graphic generation. | **Maintain as is**: Ensures generative logos align with strategic positioning. |
| **Visual Direction** | `BrandStudioShell` -> `DirectionBoardModal` (Step 2) | **MATCHES** | 3 visual directions: Modern Minimal, Bold Dynamic, and Classic Institutional with curated moodboards. | **Maintain as is**: Clean multi-direction selector. |
| **Logo Type & Gen** | `LogoTypeChooserModal` (Step 3) & `LogoCreationModal` (Step 4) | **MATCHES** | Selects monogram, wordmark, or abstract; generates SVG vector logos with AI prompts and seed controls. | **Maintain as is**: Integrated smoothly into studio sequence. |
| **Logo Variations** | `VariationSetModal` (Step 5) | **EXTRA** | Generates 4 production variations: Primary, Inverted (Dark), Monochrome Black, and Monochrome White. | **Retain**: Highly valuable for real production brand kits. |
| **Color Palette** | `ColorSystemModal` (Step 6) | **MATCHES** | 6 curated color harmonies (Primary, Secondary, Accent, Neutral) tailored to the venture category. | **Maintain as is**: Complies with design system canon. |
| **Typography** | `TypographySystemModal` (Step 7) | **MATCHES** | Curated font pairings (Display + Body) leveraging Inter, DM Sans, and JetBrains Mono. | **Maintain as is**: Matches typography canon. |
| **Brand Assets & Mockups** | `/dashboard/creator/phase-2/brand-kit` | **BETTER EXISTING FLOW** | Digital brand asset showcase with 3D product mockups (business card, mobile app, stationery), SVG/PNG downloads, and full ZIP export. | **Maintain as is**: Exceeds standard expectations with comprehensive mockups. |
| **Brand Result / Complete** | `/dashboard/creator/phase-2/complete` | **MATCHES** | Summary card showing the finalized brand kit, project overview, and transition button to Phase 3. | **Maintain as is**: Clean phase exit. |

---

## 2. Phase 3: Business Plan Intelligence

### Target Conceptual Flow:
```text
Business Foundation
   ↓
Market Intelligence
   ↓
Business Model
   ↓
Executive Business Plan
   ↓
Financial Forecast
   ↓
Legal & Compliance
   ↓
Business Structure
   ↓
Readiness
```

### Stage-by-Stage Comparison:

| Target Stage | Actual Implemented Code | Actual Step # | Status | Finding & Architectural Difference | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Market Intelligence** | `/dashboard/creator/phase-3/market-study` | `Step 3.1` | **MATCHES** | Sizing engine calculating TAM/SAM/SOM, 3-5 competitor cards, demand signals, sizing risks, and founder gap. | **Maintain as is**: Step 3.1 is authoritative and complete. |
| **Business Model** | `/dashboard/creator/phase-3/business-model` | `Step 3.2` | **MATCHES** | Interactive 9-block Osterwalder canvas, unit economics metrics (CAC, LTV, payback), and pricing tiers. | **Maintain as is**: Step 3.2 cleanly ingests Market Study outputs. |
| **Executive Business Plan** | `/dashboard/creator/phase-3/business-plan` | `Step 3.3` | **DIFFERS** | Currently positioned at Step 3.3, before Forecast (3.4) and Legal (3.5). While functional, sections 7, 8, and 12 display placeholders until downstream steps are finished. | **Consider Reordering**: Repositioning the Business Plan to Step 3.6 (after Forecast, Legal, and Formation) would allow the 12 sections to generate fully hydrated on first view. |
| **Financial Forecast** | `/dashboard/creator/phase-3/forecast` | `Step 3.4` | **MATCHES** | 36-month revenue, OPEX, and cash flow projections with interactive assumptions (ARPU, OPEX, growth, churn, TAM), break-even velocity, and risk matrix. | **Maintain as is**: High-fidelity financial simulation engine. |
| **Legal & Compliance** | `/dashboard/creator/phase-3/compliance` | `Step 3.5` | **BETTER EXISTING FLOW** | Deterministic France-first statutory roadmap (FR-2026.1), Evidence Vault integration, stage navigation, and contextual AI guide rail. | **Maintain as is**: Exceptional France-first compliance architecture. |
| **Business Structure** | `/dashboard/creator/phase-3/formation` | `Step 3.6` | **MATCHES** | France corporate legal structure recommendation (SAS, SASU, SARL, EURL, Micro, EI) with transparent rationale + cofounder skill gap mapping. | **Maintain as is**: Matches French legal standards. |
| **Investor Readiness** | `/dashboard/creator/phase-3/complete` | `Step 3.7` | **MATCHES** | Objective 100-point institutional audit across 5 weighted dimensions (Clarity 20, Market 20, Financials 25, Legal 15, Team 20) with itemized point deductions and remediation links. | **Maintain as is**: Institutional diagnostic standard. |

---

## 3. Key Insights

1. **Phase 2 exceeds expectations**: The actual implementation consolidates disparate prototype ideas into a unified 7-step modal studio (`BrandStudioShell`) and a dedicated asset hub (`BrandKitHubView`), which is substantially cleaner and more maintainable than older documentation anticipated.
2. **Phase 3 step numbering is fully resolved**: The code unambiguously uses `Step 3.1` through `Step 3.7`.
3. **The primary architectural tension in Phase 3 is Step 3.3 placement**: Because the Business Plan acts as an executive synthesis document containing sections for Financials, Team Structure, and Legal Framework, placing it before Steps 3.4, 3.5, and 3.6 creates forward dependencies that require real-time synchronization or subsequent plan regenerations.
