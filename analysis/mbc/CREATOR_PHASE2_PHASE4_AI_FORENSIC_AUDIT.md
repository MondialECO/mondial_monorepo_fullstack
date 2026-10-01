# CREATOR PHASE 2–4 COMPLETE AI USAGE FORENSIC AUDIT

---

## 1. Baseline

- **Branch:** `dev-hafiz`
- **HEAD:** `b7e93c15e1c54354cea433316e30ef772495657e`
- **Remote HEAD (`origin/dev-hafiz`):** `b7e93c15e1c54354cea433316e30ef772495657e`
- **Audit Scope:** Creator Phase 2 through Phase 4 runtime AI usage, credit debit mechanisms, provider invocations, and token ceilings.

---

## 2. Current Creator Journey

### Phase 2: Idea Structuring & Brand Identity
- **2.1 `/dashboard/creator/phase-2`**  
  *Redirect-only entry point* → Automatically resolves current state and redirects to `/clarifier`.
- **2.2 `/dashboard/creator/phase-2/clarifier`**  
  *Clarifier Chat (Steps 1–6)* → Progressive clarification Q&A (deterministic questions), followed by mandatory AI idea synthesis upon completing the final answer.
- **2.3 `/dashboard/creator/phase-2/idea-summary`**  
  *Step 7: Idea Final Summary* → Displays the synthesized value proposition, customer personas, problem, and solution. Allows manual editing or full re-synthesis.
- **2.4 `/dashboard/creator/phase-2/concept-name`**  
  *Step 8: Concept Name* → Selection or generation of brand names. Powered entirely by deterministic C# algorithms (0 AI calls).
- **2.5 `/dashboard/creator/phase-2/branding`**  
  *Step 9: Brand Entry Hub* → Tri-path chooser: (1) Self-directed Brand Studio, (2) Hire a Designer, (3) Skip branding for now.
- **2.6 `/dashboard/creator/phase-2/hire-designer`**  
  *Step 10: Hire Designer* → Rule-based matching with verified platform designers (0 AI calls).
- **2.7 `/dashboard/creator/phase-2/logo-tool`**  
  *Step 11 (Legacy/Redirect)* → Legacy standalone logo tool URL, automatically 301-redirects to `/dashboard/creator/phase-2/brand-studio`.
- **2.8 `/dashboard/creator/phase-2/brand-studio`**  
  *Interactive 6-Step Brand Studio Modal/Page* → Brand Strategy, Visual Direction (AI), Logo Concepts (AI parameters + local SVG), Colors (Deterministic initial / AI regen), Typography (Deterministic initial / AI regen), Export/Kit.
- **2.9 `/dashboard/creator/phase-2/brand-kit`**  
  *Brand Kit Overview Hub* → Read-only overview of active brand assets, downloadable tokens, and snapshots.
- **2.10 `/dashboard/creator/phase-2/complete`**  
  *Step 12: Phase 2 Completion* → Validation gate and transition screen to Phase 3.

---

### Phase 3: Business Planning & Financial Feasibility
- **3.1 `/dashboard/creator/phase-3/market-study`**  
  *Step 3.1: Market Study* → Asynchronous AI market analysis (TAM/SAM/SOM, competitors, customer segments, demand drivers). Automatically triggers background financial assumptions seeding.
- **3.2 `/dashboard/creator/phase-3/business-model`**  
  *Step 3.2: Business Model Canvas* → Asynchronous AI generation of 9-block Osterwalder canvas, pricing tiers, and revenue stream definitions. Automatically triggers background financial assumptions seeding.
- **3.3 `/dashboard/creator/phase-3/forecast`**  
  *Step 3.3: Financial Forecast* → Asynchronous AI generation of 36-month P&L, balance sheet, cash flows, unit economics, and break-even milestones.
- **3.4 `/dashboard/creator/phase-3/compliance`**  
  *Step 3.4: Legal & Regulatory Compliance* → French statutory and regulatory checklist. 100% deterministic rules catalog (0 AI calls).
- **3.5 `/dashboard/creator/phase-3/formation`**  
  *Step 3.5: Formation & Team Structure* → Legal entity recommendation (SAS, SASU, SARL, etc.) and organizational gap analysis. 100% deterministic rule engine (0 AI calls).
- **3.6 `/dashboard/creator/phase-3/business-plan`**  
  *Step 3.6: Executive Business Plan* → Asynchronous AI synthesis of comprehensive 11-section business plan drawing from Steps 3.1–3.5. Includes individual section AI rewrite capabilities.
- **3.7 `/dashboard/creator/phase-3/complete`**  
  *Step 3.7: Investor Readiness & Phase Complete* → 5-dimension investor readiness score computed via deterministic mathematical formulas (0 AI calls).

---

### Phase 4: Construction & Execution
- **4.1 `/dashboard/creator/phase-4`**  
  *Construction Snapshot* → Phase 3 data summary and execution readiness dashboard (0 AI calls).
- **4.2 `/dashboard/creator/phase-4/roadmap`**  
  *Operational Roadmap* → Phase 4 task DAG and Gantt scheduling engine. 100% deterministic template/dependency logic (0 AI calls).
- **4.3 `/dashboard/creator/phase-4/needs`**  
  *Needs Analysis* → Operational resource and tooling requirements. Rule-based derivation from sector/company type (0 AI calls).
- **4.4 `/dashboard/creator/phase-4/skills`**  
  *Skills Resolution & Delegation* → Team skill gap matching with marketplace providers. Deterministic query engine (0 AI calls).
- **4.5 `/dashboard/creator/phase-4/support`**  
  *Aides & Public Grants* → French regional/national public subsidy matching (`bpifrance`, `cci`, etc.). Static database catalog (0 AI calls).
- **4.6 `/dashboard/creator/phase-4/pricing`**  
  *Pricing Strategy* → Pricing matrix and tier configuration tool. Deterministic math engine (0 AI calls).
- **4.7 `/dashboard/creator/phase-4/gtm`**  
  *Go-To-Market & Launch Strategy* → GTM milestone generator. Rule-based sector mapping (0 AI calls).
- **4.8 `/dashboard/creator/phase-4/assets` & `/launch-assets`**  
  *Launch Assets Hub* → Collateral, legal checklists, and document templates. Static asset builder (0 AI calls).
- **4.9 `/dashboard/creator/phase-4/readiness`**  
  *Construction Readiness* → Final operational sign-off audit. Deterministic checklist calculation (0 AI calls).

---

## 3. Executive AI Map

| Phase | Step | Feature | AI YES/NO | Mandatory/Optional | Initial/Regen/Rewrite | Credit Cost | Active Model | Token Limit |
|---|---|---|---|---|---|---|---|---|
| **Phase 2** | 2.2 | Idea Clarifier Synthesis | **YES** | Mandatory | Initial & Regen | 20 | `google/gemini-3.8-flash` | 3,500 |
| **Phase 2** | 2.4 | Concept Name Generator | **NO** | Optional | Initial & Regen | 0 | None (Deterministic C#) | N/A |
| **Phase 2** | 2.8 | Brand Studio: Visual Direction | **YES** | Optional | Initial & Regen | 7 | `google/gemini-3.8-flash` | 4,500 |
| **Phase 2** | 2.8 | Brand Studio: Logo Concepts (6 marks) | **YES** | Optional | Initial & Redraw All | 4 | `google/gemini-3.8-flash` | 3,000 |
| **Phase 2** | 2.8 | Brand Studio: Single Logo Redraw | **NO** | Optional | Redraw Single | 0 | None (Deterministic C#) | N/A |
| **Phase 2** | 2.8 | Brand Studio: Logo Variations (7 formats) | **NO** | Optional | Derivation | 0 | None (Deterministic Skia) | N/A |
| **Phase 2** | 2.8 | Brand Studio: Color Palette (Initial) | **NO** | Optional | Initial | 0 | None (Deterministic C#) | N/A |
| **Phase 2** | 2.8 | Brand Studio: Color Palette (Regen) | **YES** | Optional | Regeneration | 2 | `google/gemini-3.8-flash` | 4,500 |
| **Phase 2** | 2.8 | Brand Studio: Typography (Initial) | **NO** | Optional | Initial | 0 | None (Deterministic C#) | N/A |
| **Phase 2** | 2.8 | Brand Studio: Typography (Regen) | **YES** | Optional | Regeneration | 2 | `google/gemini-3.8-flash` | 2,000 |
| **Phase 3** | 3.1 | Market Study Generation | **YES** | Mandatory | Initial & Regen | 20 | `google/gemini-3.8-flash` | 7,500 |
| **Phase 3** | 3.1 | Background Market Assumptions Seeding | **YES** | Mandatory (Auto) | Background Sync | 0 (Unmetered) | `google/gemini-3.8-flash` | 800 |
| **Phase 3** | 3.2 | Business Model Canvas Generation | **YES** | Mandatory | Initial & Regen | 18 | `google/gemini-3.8-flash` | 8,500 |
| **Phase 3** | 3.2 | Background Model Assumptions Seeding | **YES** | Mandatory (Auto) | Background Sync | 0 (Unmetered) | `google/gemini-3.8-flash` | 1,000 |
| **Phase 3** | 3.3 | Financial Forecast Simulation | **YES** | Mandatory | Initial & Regen | 32 | `google/gemini-3.8-flash` | 8,000 |
| **Phase 3** | 3.4 | Legal Compliance Checklist | **NO** | Mandatory | Initial & Refresh | 0 | None (Deterministic Rules) | N/A |
| **Phase 3** | 3.5 | Formation & Legal Structure | **NO** | Mandatory | Initial & Refresh | 0 | None (Deterministic Rules) | N/A |
| **Phase 3** | 3.6 | Full Business Plan Generation | **YES** | Mandatory | Initial & Regen | 33 | `google/gemini-3.8-flash` | 7,500 |
| **Phase 3** | 3.6 | Business Plan Single Section Rewrite | **YES** | Optional | Rewrite | 5 | `google/gemini-3.8-flash` | 2,500 |
| **Phase 3** | 3.7 | Investor Readiness Score | **NO** | Mandatory | Compute | 0 | None (Deterministic Math) | N/A |
| **Phase 4** | 4.1–4.9 | All Phase 4 Features & Tools | **NO** | Mandatory/Opt | All Actions | 0 | None (Deterministic Engines) | N/A |

---

## 4. Phase 2 Detailed Audit

### 4.1 Clarifier Chat (Steps 1–6)
- **AI Used:** **NO** for Q1–Q6 questions and chat turns. **YES** for final synthesis.
- **Mechanism:** Questions 1 through 6 are served from a static server-side C# catalog in `CreatorPhase2Controller.cs`. Chat answers are validated and appended to MongoDB read-only state.
- **Synthesis Trigger:** Explicit user click on `"Finaliser mon idée"` after answer 6, or re-run from the summary screen.
- **Endpoint:** `POST /api/ai/idea-clarifier/start`
- **Controller & Handler:** `IdeaClarifierJobController` → `IdeaClarifierHandler`
- **Credit Cost:** 20 credits.
- **Model & Token Ceiling:** `google/gemini-3.8-flash`, 3,500 output tokens.
- **Persistence:** Saved into MongoDB `AIResponses` and `CreatorIdeas` collection (`IdeaClarificationSummary`).
- **Mandatory:** **YES**. Phase 2 cannot advance past Step 7 without a completed synthesis.

### 4.2 Concept Name (Step 8)
- **AI Used:** **NO**.
- **Authority:** `ConceptNameGeneratorService.cs`
- **Mechanism:** 100% deterministic C# string manipulation. Combines sector prefixes, suffix archetypes (e.g., `-ly`, `-io`, `-ia`), syllables from the idea keywords, and startup linguistic patterns.
- **Credits:** 0 credits.
- **Provider Calls:** 0 calls.

### 4.3 Branding Choice (Step 9) & Hire Designer (Step 10)
- **AI Used:** **NO**.
- **Mechanism:** Step 9 is a frontend navigational fork. Step 10 queries the designer marketplace database via `SpMatchingService.cs` using deterministic capability filters (sector tags, language, rate, rating).

---

## 5. Brand Studio Detailed AI Audit

Brand Studio is implemented in `BrandKitController.cs` and orchestrated through synchronous services in `Mondial.Core/Services/Brand/`.

| Step | Action | Classification | AI? | Provider | Model | Endpoint | Current Credit | Max Tokens | Auto or Click? | Token Logged? | Cost Logged? | Required or Optional? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Strategy & Tone** | Initialize / Edit | Database-Only | NO | None | None | `PUT /api/creator/brand-kit/brand-strategy` | 0 | N/A | Click | NO | NO | Optional |
| **Visual Direction** | Generate 3 Directions | Real AI Initial | **YES** | OpenRouter | `google/gemini-3.8-flash` | `POST /api/creator/brand-kit/direction/generate` | 7 | 4,500 | Click | Console only | NO | Optional |
| **Visual Direction** | Regenerate Directions | Real AI Regen | **YES** | OpenRouter | `google/gemini-3.8-flash` | `POST /api/creator/brand-kit/direction/generate` | 7 | 4,500 | Click | Console only | NO | Optional |
| **Logo Concepts** | Generate 6 Concepts | Real AI Initial (Hybrid) | **YES** | OpenRouter | `google/gemini-3.8-flash` | `POST /api/creator/brand-kit/logo/generate-concepts` | 4 | 3,000 | Click | Console only | NO | Optional |
| **Logo Concepts** | Redraw All 6 | Real AI Regen (Hybrid) | **YES** | OpenRouter | `google/gemini-3.8-flash` | `POST /api/creator/brand-kit/logo/generate-concepts` | 4 | 3,000 | Click | Console only | NO | Optional |
| **Logo Concepts** | Redraw Single Mark | Deterministic Gen | **NO** | None | None (C# Generator) | `POST /api/creator/brand-kit/logo/redraw-single` | 0 | N/A | Click | NO | NO | Optional |
| **Logo Variations** | Generate 7 Variants | Deterministic Gen | **NO** | None | None (Skia/SVG) | `POST /api/creator/brand-kit/logo/derive-variations` | 0 | N/A | Click / Auto | NO | NO | Optional |
| **Color System** | Derive from Direction | Deterministic Gen | **NO** | None | None (Rule Derivation) | `POST /api/creator/brand-kit/colors/generate` | 0 | N/A | Click | NO | NO | Optional |
| **Color System** | AI Regenerate Colors | Real AI Regen | **YES** | OpenRouter | `google/gemini-3.8-flash` | `POST /api/creator/brand-kit/colors/regenerate` | 2 | 4,500 | Click | Console only | NO | Optional |
| **Typography** | Derive from Direction | Deterministic Gen | **NO** | None | None (Font Pairing Rules)| `POST /api/creator/brand-kit/typography/generate`| 0 | N/A | Click | NO | NO | Optional |
| **Typography** | AI Regenerate Fonts | Real AI Regen | **YES** | OpenRouter | `google/gemini-3.8-flash` | `POST /api/creator/brand-kit/typography/regenerate`| 2 | 2,000 | Click | Console only | NO | Optional |
| **Studio Snapshot** | Save / Restore | Database-Only | **NO** | None | None | `POST /api/creator/brand-kit/snapshot` | 0 | N/A | Click | NO | NO | Optional |
| **Brand Kit** | Export / Download | Local Assembly | **NO** | None | None (Zip Archive) | `GET /api/creator/brand-kit/export` | 0 | N/A | Click | NO | NO | Optional |

### Critical Forensic Discovery on Logo Concepts & SVG Rendering
The LLM generates **structured geometry parameters** (mark archetype, aspect ratio, stroke widths, geometric primitives, transform matrices, color role assignments). The backend then takes these parameters and renders raw SVG strings locally via `ILogoMarkRendererRegistry.cs`. The AI provider produces **zero raw images and zero raw SVG markup**.

---

## 6. Phase 3 Detailed Audit

### 6.1 Step 3.1: Market Study
- **AI Used:** **YES**.
- **Initial Generation:** User clicks `"Générer l'étude de marché"`. Calls `POST /api/ai/market-study/start`.
- **Credit Cost:** 20 credits. Ceiling: 7,500 output tokens.
- **Provider & Model:** OpenRouter, `google/gemini-3.8-flash`.
- **Outputs Produced by AI:** TAM/SAM/SOM narrative and numeric approximations, market growth rate, key competitor profiles, customer persona breakdown, macro market risks.
- **Silent Background AI Call:** When `MarketStudyHandler` finishes, it triggers `FinancialAssumptionsService.UpdateFromMarketStudyAsync`, which executes a non-metered call to `_aiProvider.CompleteAsync` (max 800 tokens) to seed initial financial assumptions.
- **Mandatory:** **YES**.

### 6.2 Step 3.2: Business Model Canvas
- **AI Used:** **YES**.
- **Initial Generation:** User clicks `"Générer le modèle économique"`. Calls `POST /api/ai/business-model/start`.
- **Credit Cost:** 18 credits. Ceiling: 8,500 output tokens.
- **Provider & Model:** OpenRouter, `google/gemini-3.8-flash`.
- **Outputs Produced by AI:** 9-block Osterwalder canvas entries, pricing strategy tiers, monetization model, cost structure breakdown, key partnerships.
- **Silent Background AI Call:** Triggers `FinancialAssumptionsService.UpdateFromBusinessModelAsync`, executing a non-metered call to `_aiProvider.CompleteAsync` (max 1,000 tokens) to seed ARPU, CAC, and margin assumptions.
- **Mandatory:** **YES**.

### 6.3 Step 3.3: Financial Forecast
- **AI Used:** **YES**.
- **Initial Generation:** User clicks `"Lancer la simulation financière"`. Calls `POST /api/ai/forecast/start`.
- **Credit Cost:** 32 credits. Ceiling: 8,000 output tokens.
- **Provider & Model:** OpenRouter, `google/gemini-3.8-flash`.
- **Outputs Produced by AI:** 36-month revenue progression, COGS, OPEX buckets, cash burn, break-even month, working capital requirements, sensitivity analysis.
- **Forecast Re-simulation Behavior:** When the user changes assumptions (ARPU, OPEX, Churn, Growth, TAM) and clicks `"Re-simuler"`, the frontend updates assumptions via `PUT /api/ai/forecast/assumptions` and immediately calls `POST /api/ai/forecast/{sessionId}/regenerate`. This **debits 32 credits and runs a full AI generation again**.
- **Mandatory:** **YES**.

### 6.4 Step 3.4: Compliance & Legal
- **AI Used:** **NO**.
- **Mechanism:** Calls `POST /api/creator/ai/legal-checklist/generate`. Routes directly to `LegalChecklistService.cs` evaluating `FranceLegalRulesCatalog.cs` against idea metadata.
- **Credits:** 0 credits. Provider calls: 0.

### 6.5 Step 3.5: Formation & Team
- **AI Used:** **NO**.
- **Mechanism:** Calls `POST /api/creator/ai/formation-generator/start`. Routes directly to `FormationRecommendationEngine.cs` evaluating deterministic decision trees.
- **Credits:** 0 credits. Provider calls: 0.

### 6.6 Step 3.6: Executive Business Plan
- **AI Used:** **YES**.
- **Initial Generation:** User clicks `"Rédiger le Business Plan"`. Calls `POST /api/ai/business-plan/start`.
- **Credit Cost:** 33 credits. Ceiling: 7,500 output tokens.
- **Provider & Model:** OpenRouter, `google/gemini-3.8-flash`.
- **Synthesis Structure:** Synthesizes upstream data from Market Study (3.1), Business Model (3.2), Forecast (3.3), Legal (3.4), and Formation (3.5) into an 11-section executive document.
- **Single Section Rewrite:** User clicks `"Réécrire la section"`. Calls `POST /api/ai/business-plan/section/rewrite`. Debits 5 credits, calls `BusinessPlanSectionRewriteHandler` with a ceiling of 2,500 tokens.
- **Mandatory:** **YES** (full generation). Single section rewrite is optional.

### 6.7 Step 3.7: Investor Readiness
- **AI Used:** **NO**.
- **Mechanism:** Calls `GET /api/creator/phase-3/readiness`. Calculated via `InvestorReadinessCalculator.cs` computing a weighted 0–100 score across 5 deterministic dimensions.
- **Credits:** 0 credits. Provider calls: 0.

---

## 7. Phase 4 Detailed Audit

All Phase 4 screens, endpoints, and background services were inspected:
**PHASE 4 CONTAINS EXACTLY ZERO AI PROVIDER CALLS.**

| Step | Route | Purpose | API Endpoint | Backend Authority | AI? | Why Non-AI? |
|---|---|---|---|---|---|---|
| **4.1** | `/dashboard/creator/phase-4` | Construction Snapshot | `GET /api/creator/phase-4/snapshot` | `Phase4SnapshotService` | **NO** | Aggregates Phase 2 and 3 MongoDB documents without LLM. |
| **4.2** | `/dashboard/creator/phase-4/roadmap` | Operational Roadmap | `GET /api/creator/phase-4/roadmap` | `RoadmapDagEngine` | **NO** | Deterministic topological sorting DAG based on company type & sector templates. |
| **4.3** | `/dashboard/creator/phase-4/needs` | Needs Analysis | `GET /api/creator/phase-4/needs` | `NeedsAnalysisService` | **NO** | Hardcoded category mapping (Tech, Legal, Marketing, Tools). |
| **4.4** | `/dashboard/creator/phase-4/skills` | Skills & Delegation | `GET /api/creator/phase-4/skills` | `SkillsDirectoryService` | **NO** | Database lookup filtering platform experts by tag. |
| **4.5** | `/dashboard/creator/phase-4/support` | Aides & Public Grants | `GET /api/creator/phase-4/support` | `FrenchGrantsCatalog` | **NO** | Static rule-matching catalog against Bpifrance/CCI grant conditions. |
| **4.6** | `/dashboard/creator/phase-4/pricing` | Pricing Strategy | `GET /api/creator/phase-4/pricing` | `PricingModelService` | **NO** | Deterministic margins & tier formula calculator. |
| **4.7** | `/dashboard/creator/phase-4/gtm` | GTM Launch Strategy | `GET /api/creator/phase-4/gtm` | `GtmTemplateService` | **NO** | Static playbook selection based on B2B / B2C archetype. |
| **4.8** | `/dashboard/creator/phase-4/assets` | Launch Assets Hub | `GET /api/creator/phase-4/assets` | `AssetTemplateService` | **NO** | Pre-formatted markdown document templates and checklists. |
| **4.9** | `/dashboard/creator/phase-4/readiness` | Construction Readiness | `GET /api/creator/phase-4/readiness` | `ConstructionAuditEngine` | **NO** | Boolean completeness checklist of Phase 4 operational milestones. |

---

## 8. Complete AI Call Graph

```
[UI Trigger (Button Click / Synthesis)]
       │
       ▼
[Next.js Client API Method]
  - apiClient.post('/api/ai/{job}/start')
  - apiClient.post('/api/creator/brand-kit/{feature}')
       │
       ▼
[ASP.NET Core Controller]
  - Job Controllers (IdeaClarifierJobController, MarketStudyJobController, etc.)
  - BrandKitController (Direction, Logo, Colors, Typography)
       │
       ▼
[Pre-Execution Security & Credit Check]
  - Ownership Check: Idea.OwnerUserId == CurrentUser.Id
  - Concurrency Lock: AiJobService.TryAcquireJobLock(InFlightKey)
  - Balance Verification: AiCreditService.HasSufficientCreditsAsync(jobCost)
       │
       ▼
[Credit Debit]
  - AiCreditService.DebitForJobAsync(jobType, ideaId, cost)
       │
       ▼
[Execution Mechanism]
  ├── [Asynchronous Jobs (Hangfire Queue)]
  │     │
  │     ▼
  │   [AiJobRunner.ExecuteJobAsync]
  │     │
  │     ▼
  │   [Job Handler (e.g., MarketStudyHandler)]
  │     │
  │     ▼
  │   [OpenRouterClient.CompleteAsync (IAiProvider)]
  │     │
  │     ▼
  │   [Model: google/gemini-3.8-flash]
  │     │
  │     ▼
  │   [Persistence & Audit Logging]
  │     - AIResponses (Full prompt, completion, raw JSON)
  │     - AiModelUsage (PromptTokens, CompletionTokens, Cost)
  │     - Target Domain Collection (CreatorIdeas, MarketStudies, etc.)
  │
  └── [Synchronous Brand Studio Services]
        │
        ▼
      [Direction / Logo / Color / Typography GenerationService]
        │
        ▼
      [OpenRouterClient.CompleteAsync (IAiProvider)]
        │
        ▼
      [Model: google/gemini-3.8-flash]
        │
        ▼
      [Persistence (BrandKitSessions Collection)]
```

---

## 9. Mandatory vs Optional AI

### Mandatory AI (Required to complete Journey)
1. **Idea Clarifier Synthesis (Phase 2):** Cannot pass Step 7 without completing. (20 credits)
2. **Market Study Generation (Step 3.1):** Required to unlock Step 3.2. (20 credits)
3. **Business Model Generation (Step 3.2):** Required to unlock Step 3.3. (18 credits)
4. **Financial Forecast Simulation (Step 3.3):** Required to unlock Step 3.6. (32 credits)
5. **Business Plan Generation (Step 3.6):** Required to complete Phase 3. (33 credits)

### Optional AI (Enhancements / Discretionary)
1. **Brand Studio Visual Direction:** User can skip branding or choose "Hire a Designer". (7 credits)
2. **Brand Studio Logo Concepts:** Optional within Brand Studio. (4 credits)
3. **Brand Studio Color Palette AI Regeneration:** Optional (initial derivation is deterministic & free). (2 credits)
4. **Brand Studio Typography AI Regeneration:** Optional (initial derivation is deterministic & free). (2 credits)
5. **Business Plan Section Rewrite:** Optional per-section polish. (5 credits per rewrite)

---

## 10. Current Credit Costs & Starter Grant Architecture

Values are loaded directly from `backend/src/Mondial.Api/appsettings.json` under `Ai:CreditCosts`:

- **Current Starter Credits:** **200 credits** (`Ai:StarterCredits = 200`)
- **Starter Grant Initialization Mechanism:** The configured starter balance is 200 credits. The `AICredits` ledger is lazily initialized on the first credit-balance request (`GET /api/ai/credits` when the topbar `AiCreditBadge` mounts) or before the first paid AI debit via fallback guard in `AiCreditService.DebitForJobAsync`, rather than being created directly inside registration/onboarding.
- **Initial Grant Idempotency:** Uses MongoDB `UpdateOneAsync` with `IsUpsert = true` and `.SetOnInsert`. An existing balance is never touched on repeat requests, and spent zero balances are never topped back up.
- **Per-Capability Cost Table:**
  - `IdeaClarifier`: 20 credits
  - `MarketStudy`: 20 credits
  - `BusinessModel`: 18 credits
  - `BusinessPlan`: 33 credits
  - `BusinessPlanSectionRewrite`: 5 credits
  - `Forecast`: 32 credits
  - `DirectionGeneration` (Brand Studio): 7 credits
  - `LogoParameterSelection` (Brand Studio): 4 credits
  - `ColorGeneration` (Brand Studio): 2 credits
  - `TypographyGeneration` (Brand Studio): 2 credits
  - `IdeaGenerator` (Dormant): 0 credits
  - `Probe` (Test): 0 credits

---

## 11. One Normal Idea Calculation

Calculating the exact AI provider invocations and credit debits for one normal user creating one idea on the standard happy path without optional regenerations:

### Scenario A: Standard Path Skipping Brand Studio (User selects "Skip branding for now" at Step 2.5)
- **Phase 2:**
  - Clarifier Synthesis: 1 call (20 credits)
  - Subtotal: **1 AI Call | 20 Credits**
- **Phase 3:**
  - Market Study: 1 user job + 1 background assumptions call = 2 provider calls (20 credits debited)
  - Business Model: 1 user job + 1 background assumptions call = 2 provider calls (18 credits debited)
  - Financial Forecast: 1 user job = 1 provider call (32 credits debited)
  - Business Plan: 1 user job = 1 provider call (33 credits debited)
  - Subtotal: **6 AI Calls | 103 Credits**
- **Phase 4:**
  - Entire Phase 4: 0 provider calls (0 credits debited)
  - Subtotal: **0 AI Calls | 0 Credits**
- **TOTAL (Scenario A):**
  - **Total Provider Calls:** **7**
  - **Credits Consumed:** **123 credits**
  - **Starter Balance:** **200 credits**
  - **Remaining Balance:** **77 credits**

---

### Scenario B: Complete Path with Brand Studio (User creates Brand Kit via Brand Studio)
- **Phase 2:**
  - Clarifier Synthesis: 1 call (20 credits)
  - Visual Direction: 1 call (7 credits)
  - Logo Concepts (6 marks): 1 call (4 credits)
  - Color Palette (Initial Derivation): 0 AI calls (0 credits)
  - Typography (Initial Derivation): 0 AI calls (0 credits)
  - Subtotal: **3 AI Calls | 31 Credits**
- **Phase 3:**
  - Market Study: 2 provider calls (20 credits debited)
  - Business Model: 2 provider calls (18 credits debited)
  - Financial Forecast: 1 provider call (32 credits debited)
  - Business Plan: 1 provider call (33 credits debited)
  - Subtotal: **6 AI Calls | 103 Credits**
- **Phase 4:**
  - Entire Phase 4: 0 provider calls (0 credits debited)
  - Subtotal: **0 AI Calls | 0 Credits**
- **TOTAL (Scenario B):**
  - **Total Provider Calls:** **9**
  - **Credits Consumed:** **134 credits**
  - **Starter Balance:** **200 credits**
  - **Remaining Balance:** **66 credits**

---

## 12. Final Verdict

- **Phase 2 fully audited:** **YES**
- **Phase 3 fully audited:** **YES**
- **Phase 4 fully audited:** **YES**
- **Configured Starter Balance:** **200 credits**
- **Standard Journey Consumes:** **123 credits** (Leaving 77 credits)
- **Brand Studio Journey Consumes:** **134 credits** (Leaving 66 credits)
- **Every active Creator AI provider call traced:** **YES**
- **Every current credit debit traced:** **YES**
