# Recommended Final Creator Journey — Phase 2 & Phase 3

**Audit Date:** 2026-09-19  
**Monorepo:** `mondial_monorepo_fullstack`  
**Philosophy:** Maximize code reuse · Preserve verified systems · Eliminate dead routes · Streamline forward data dependencies · Zero loss of France-first legal intelligence

---

## 1. Principles of the Recommendation

1. **Do NOT Rebuild Functioning Systems**: The existing 7-step `BrandStudioShell`, `BrandKitHubView`, `MarketStudyPage`, `BusinessModelPage`, `ComplianceWorkspacePage` (France FR-2026.1), and `FormationPage` are mature, high-value implementations that must be preserved.
2. **Eliminate Dead & Orphan Routes**: Safely remove or redirect `/phase-2/logo-tool` and `/phase-2/hire-designer` to avoid dead ends and fragmented state.
3. **Harmonize Upstream Data (Eliminate Repeated Inputs)**: Auto-populate the Financial Forecast (Step 3.4) TAM input directly from the verified TAM calculated in Step 3.1 Market Study.
4. **Preserve Section 12 & Legal Readiness**: Maintain the deterministic synthesis of French statutory requirements directly into Business Plan Section 12 and the 15-point Legal Readiness allocation.
5. **Optimize Forward Sequencing Option**: While the current Step 3.1 -> 3.7 sequence functions via live reactive links, a clean two-phase synthesis or explicit completion badge in Business Plan removes placeholder confusion.

---

## 2. Final Recommended Route Journey

```text
CREATOR DASHBOARD
   │ (/dashboard/creator)
   ▼
PHASE 2 — PROJECT IDENTITY & BRANDING
   │
   ├─► Page 1: AI Idea Clarifier
   │   Route: /dashboard/creator/phase-2/clarifier
   │   Action: 6-question AI interview · Live clarity ring (0–100%)
   │
   ├─► Page 2: Concept Summary & Validation
   │   Route: /dashboard/creator/phase-2/idea-summary
   │   Action: Review clarity breakdown · Edit takeaways · Confirm category
   │
   ├─► Page 3: Project Naming & Tagline
   │   Route: /dashboard/creator/phase-2/concept-name
   │   Action: Select from 4 AI suggestions or enter custom validated name
   │
   ├─► Page 4: Brand Studio Gateway
   │   Route: /dashboard/creator/phase-2/branding
   │   Action: Choose "Launch Brand Studio" or "Skip to Phase 3"
   │
   ├─► Page 5: Brand Identity Studio (Modal Workflow)
   │   Route: /dashboard/creator/phase-2/brand-studio
   │   Action: 7-step studio (Strategy → Direction → Type → Logo → Variations → Colors → Typography)
   │
   ├─► Page 6: Brand Kit & Asset Hub
   │   Route: /dashboard/creator/phase-2/brand-kit
   │   Action: Review generated assets · Inspect mockups · Download ZIP
   │
   └─► Page 7: Phase 2 Completion Showcase
       Route: /dashboard/creator/phase-2/complete
       Action: Review unified project summary · Execute advancePhase(2)
   │
   ▼
PHASE 3 — BUSINESS PLAN INTELLIGENCE
   │
   ├─► Step 3.1: Market Sizing & Competitive Intelligence
   │   Route: /dashboard/creator/phase-3/market-study
   │   Action: TAM/SAM/SOM funnel · 3-5 competitors · Demand signals · Founder gap
   │
   ├─► Step 3.2: 9-Block Business Model Canvas
   │   Route: /dashboard/creator/phase-3/business-model
   │   Action: Interactive Osterwalder canvas · Unit economics (CAC/LTV) · Pricing tiers
   │
   ├─► Step 3.3: Executive Business Plan Document
   │   Route: /dashboard/creator/phase-3/business-plan
   │   Action: 12 continuous-scroll sections · Inline editing · Live synchronized modules
   │
   ├─► Step 3.4: Financial Projections & Simulations
   │   Route: /dashboard/creator/phase-3/forecast
   │   Action: 36-month revenue/burn/cash runway · Break-even velocity · Seeded from Step 3.1 TAM
   │
   ├─► Step 3.5: Legal & Compliance Intelligence
   │   Route: /dashboard/creator/phase-3/compliance
   │   Action: Deterministic France rules (FR-2026.1) · Evidence Vault · Statutory roadmap · AI guide rail
   │
   ├─► Step 3.6: Company Formation & Team
   │   Route: /dashboard/creator/phase-3/formation
   │   Action: French corporate structure recommendation (SAS/SARL/Micro) · Skills gap matrix
   │
   └─► Step 3.7: Investor Readiness Audit
       Route: /dashboard/creator/phase-3/complete
       Action: 100-pt institutional audit (5 dimensions) · Remediation links · Phase 4 Unlock
   │
   ▼
PHASE 4 — COMMERCIAL & GO-TO-MARKET SETUP
   Route: /dashboard/creator/offer-pricing
```

---

## 3. Targeted Optimizations to Implement

### Optimization A: Remove Dead Routes (Zero UX Risk)
- **Delete / Redirect `/phase-2/logo-tool`**: Redirect directly to `/dashboard/creator/phase-2/brand-studio`.
- **Handle `/phase-2/hire-designer`**: Either expose a secondary link on `/phase-2/branding` ("Need a custom agency designer? Browse M50 certified partners") or redirect to the Service Provider directory.

### Optimization B: Seed Step 3.4 TAM from Step 3.1 Market Study
- In `src/app/dashboard/creator/phase-3/forecast/page.tsx`:
  - Fetch `marketStudySession.output.tamSamSom.tam.amount` when initializing input state.
  - If available, set `inputs.tam = marketStudyTam` instead of default `50,000,000`.

### Optimization C: Preserve `?ideaId=` in Intra-Phase Navigation
- Update `Phase3SetupShell` and next/back buttons in Phase 3 to preserve `activeIdeaId`:
  ```typescript
  const ideaParam = activeIdeaId ? `?ideaId=${activeIdeaId}` : '';
  router.push(`/dashboard/creator/phase-3/business-model${ideaParam}`);
  ```

### Optimization D: Enhance Step 3.3 Status Badging
- In `BusinessPlanPage`, for Section 7 (Financials), Section 8 (Team), and Section 12 (Legal Framework):
  - If upstream data has not yet been completed, display an informative status badge: `"Will update automatically when Step 3.4 is completed"`.
  - If upstream data is completed, display: `"✓ Synced with Step 3.4"`.
