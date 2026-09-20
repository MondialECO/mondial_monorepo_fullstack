# MONDIAL BUSINESS CREATION (MBC)
## CREATOR PHASE 3 — AI USAGE & DETERMINISTIC BOUNDARIES AUDIT

### 1. AI Call Inventory

| Step | Feature | Handler / Service | Provider / Model | Input Context | Output Structure | Deterministic Fallback? | Persistence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **3.1** | Market Intelligence Generation | `MarketStudyHandler` | OpenRouter / Gemini 2.5 Flash | Project title, category, description, audience, problem | JSON: TAM/SAM/SOM, Segments, Competitors, Demand, Gaps | Fallback template schema if LLM fails | `MarketStudySessions` |
| **3.2** | Business Model Generation | `BusinessModelHandler` | OpenRouter / Gemini 2.5 Flash | Project core + Market segments & positioning | JSON: 9 Canvas blocks, pricing tiers, metrics | Fallback template schema if LLM fails | `BusinessModelSessions` |
| **3.3** | Financial Forecast Generation | `ForecastHandler` | OpenRouter / Gemini 2.5 Flash | Manual inputs, TAM, pricing, team costs | JSON: 36-month P&L, Cash Flow, Unit Economics | Deterministic financial math calculations | `ForecastSessions` |
| **3.4** | Legal & Compliance | **NONE** | **100% Deterministic Engine** | `BusinessProfileClassifier` + `FranceRules.json` | Applicable rules, roadmap stages, readiness | **NO AI USED** | `CreatorIdea.Phase3` |
| **3.5** | Formation & Team Recommendation | **NONE** | **100% Deterministic Engine** | Rule-based evaluator (`CreatorPhase3Controller`) | Structure recommendation (SAS, SAS-U, SARL) | **NO AI USED** | `CreatorPhase3.FormationData` |
| **3.6** | Executive Business Plan Synthesis | `BusinessPlanHandler` | OpenRouter / Gemini 2.5 Flash | Project core + Clarifier output | JSON: 12-section business plan narrative | Fallback template structure | `BusinessPlanSessions` |
| **3.7** | Investor Readiness Evaluation | **NONE** | **100% Deterministic Engine** | Weighted scoring formula (100 pts) | Numerical scores, gaps, remediation CTAs | **NO AI USED** | Cached in `Phase3.Readiness` |

---

### 2. Architectural Boundaries: AI vs Deterministic Logic

#### Legal & Compliance (Step 3.4)
- **Status**: **PASS (STRICT DETERMINISTIC ISOLATION)**.
- **Verification**: `LegalApplicabilityEngine.cs` contains zero LLM integrations.
  - Rule applicability, requirement ordering, authority assignment, and legal readiness scoring are 100% code-driven against `FranceRules.json`.
  - AI is never permitted to determine compliance certification or rule applicability.

#### Company Formation (Step 3.5)
- **Status**: **PASS (DETERMINISTIC RULE ENGINE)**.
- **Verification**: Recommendations for `SAS`, `SAS-U`, or `SARL` are produced strictly via conditional branching in `CreatorPhase3Controller.GetFormationRecommendation`.

#### Investor Readiness (Step 3.7)
- **Status**: **PASS (DETERMINISTIC WEIGHTED FORMULA)**.
- **Verification**: Weighted formula (20 / 20 / 25 / 15 / 20 = 100 pts) is evaluated purely by algorithmic arithmetic in `CreatorPhase3Controller.ComputeReadiness`.

---

### 3. Prompt & Context Deficiencies

1. **Step 3.3 Forecast Context Omission (P3-AUDIT-003)**:
   - `ForecastHandler.cs` constructs prompt context exclusively from manual inputs and project title/description.
   - It fails to pass Step 3.2 Business Model Canvas outputs (pricing tiers, revenue streams, cost structures) into the LLM context.

2. **Step 3.6 Business Plan Context Omission (P3-AUDIT-004)**:
   - `BusinessPlanHandler.cs` constructs its prompt from Phase 2 project data only.
   - The LLM synthesis does not receive Step 3.1 Market Study, Step 3.2 Business Model Canvas, or Step 3.3 Forecast outputs. Sections 7, 8, 9, and 12 are instead dynamically patched or client-rendered.
