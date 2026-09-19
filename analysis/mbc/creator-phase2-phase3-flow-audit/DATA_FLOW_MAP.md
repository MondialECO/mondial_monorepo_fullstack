# Data Flow & Model Lineage Map — Creator Phase 2 & Phase 3

**Audit Date:** 2026-09-19  
**Monorepo:** `mondial_monorepo_fullstack`  
**Backend Data Source:** MongoDB collections (`CreatorJourneys`, `CreatorIdeas`, `ClarifierSessions`, `MarketStudySessions`, `BusinessModelSessions`, `BusinessPlanSessions`, `ForecastSessions`, `CreatorLegalAssessments`)

---

## 1. High-Level Data Flow Pipeline

```mermaid
flowchart TD
    subgraph Phase 2: Project Identity & Branding
        P2_In["Raw Idea Text"] --> ClarifierSession["ClarifierSession<br/>(6-question AI chat)"]
        ClarifierSession --> ProjectDoc["CreatorJourneyProject<br/>• Problem<br/>• Solution<br/>• TargetUser<br/>• ClarityScore (0-100)<br/>• CreatorEdge<br/>• MarketGap"]
        ProjectDoc --> Naming["Project Naming<br/>• Name (max 60 chars)<br/>• Tagline<br/>• Category"]
        Naming --> BrandKit["BrandKit / Branding<br/>• LogoAsset (SVG/PNG)<br/>• LogoType<br/>• ColorPalette (4 hex)<br/>• TypographyPairing<br/>• BrandingMethod"]
    end

    subgraph Phase 3: Intelligence Pipeline
        ProjectDoc & Naming --> MS_Input["Market Study Engine<br/>(AI Market Analysis)"]
        MS_Input --> MSS["MarketStudySession<br/>• TAM / SAM / SOM<br/>• Competitors (3-5 items)<br/>• Demand Signals<br/>• Sizing Risks<br/>• Founder Gap"]

        ProjectDoc & MSS --> BM_Input["Business Model Engine<br/>(AI Canvas Generator)"]
        BM_Input --> BMS["BusinessModelSession<br/>• 9 Osterwalder Blocks<br/>• Unit Economics<br/>• Revenue Streams<br/>• Cost Structure"]

        ProjectDoc & MSS & BMS --> BP_Input["Business Plan Engine<br/>(12-Section Continuous Document)"]
        BP_Input --> BPS["BusinessPlanSession<br/>• 12 Structured Sections<br/>• Section Meta / Overrides"]

        BPS & ProjectDoc --> FC_Input["Financial Forecast Engine<br/>(Interactive Input + AI Simulation)"]
        FC_Input --> FCS["ForecastSession<br/>• 36-Month Projections<br/>• Break-Even Analysis<br/>• Cash Flow Runway<br/>• Canonical TAM<br/>• ARPU & Churn Inputs"]

        ProjectDoc & MSS & BMS & FCS --> Legal_Input["Legal Applicability Engine<br/>(Deterministic France FR-2026.1)"]
        Legal_Input --> LegalDoc["CreatorLegalAssessment<br/>• Archetype Codes<br/>• Statutory Checklist<br/>• Planning Readiness Pct<br/>• Evidence Links"]
        LegalDoc --> Sec12["Business Plan Section 12<br/>(Legal & Regulatory Framework)"]
        Sec12 -.-> BPS

        ProjectDoc & FCS --> Formation_Input["Company Formation Engine<br/>(Rule Matrix)"]
        Formation_Input --> FormationDoc["FormationGenerator<br/>• Selected Type (SAS/SASU/SARL/...)<br/>• Declared Skills (youHave)<br/>• Gap Baseline (youNeed)<br/>• Cofounder Draft"]
    end

    subgraph Phase 3 Evaluation & Gateway
        ProjectDoc & FCS & BPS & LegalDoc & FormationDoc --> Score_Engine["ComputeReadiness Engine<br/>(Weighted 5-Dimension Algorithm)"]
        Score_Engine --> ReadinessScore["CreatorInvestorReadinessScore<br/>• Total Score (0-100)<br/>• Grade (A, B, C, D)<br/>• 5 Component Breakdown<br/>• Actionable Deductions & Links"]
    end

    classDef p2 fill:#2563eb,stroke:#1d4ed8,color:#fff;
    classDef p3 fill:#0284c7,stroke:#0369a1,color:#fff;
    classDef eval fill:#059669,stroke:#047857,color:#fff;
    class P2_In,ClarifierSession,ProjectDoc,Naming,BrandKit p2;
    class MS_Input,MSS,BM_Input,BMS,BP_Input,BPS,FC_Input,FCS,Legal_Input,LegalDoc,Sec12,Formation_Input,FormationDoc p3;
    class Score_Engine,ReadinessScore eval;
```

---

## 2. Exact C# Class & MongoDB Model Reference

### 2.1 `CreatorJourneyProject` (Stored inside `CreatorIdea` / `CreatorJourney`)
```csharp
public class CreatorJourneyProject
{
    public string Name { get; set; }
    public string Tagline { get; set; }
    public string Concept { get; set; }
    public string Problem { get; set; }
    public string Solution { get; set; }
    public string TargetUser { get; set; }
    public string Category { get; set; }
    public string CreatorEdge { get; set; }
    public string MarketGap { get; set; }
    public int ClarityScore { get; set; }               // 0 to 100
    public CreatorBranding Branding { get; set; }
}

public class CreatorBranding
{
    public string BrandingMethod { get; set; }           // "ai_tool" | "m50_designer" | "skipped"
    public string LogoType { get; set; }                 // "monogram" | "wordmark" | "abstract"
    public string LogoAsset { get; set; }                // SVG/data URL string
    public List<string> ColorPalette { get; set; }       // 4 Hex strings
    public string PaletteName { get; set; }
    public string TypographyPairing { get; set; }
}
```

### 2.2 `MarketStudySession`
- **Collection:** `MarketStudySessions`
- **Output Schema:**
  ```typescript
  interface MarketStudyOutput {
    tamSamSom: {
      tam: { amount: number; description: string };
      sam: { amount: number; description: string };
      som: { amount: number; description: string };
    };
    competitorAnalysis: Array<{
      name: string;
      tier: 'Direct' | 'Indirect' | 'Alternative';
      strengths: string[];
      weaknesses: string[];
      pricingModel: string;
    }>;
    demandSignals: Array<{ signal: string; sourceOrProxy: string; confidence: 'High' | 'Medium' | 'Low' }>;
    sizingRisks: Array<{ risk: string; severity: 'High' | 'Medium' | 'Low'; mitigation: string }>;
    founderGap: { summary: string; missingCompetencies: string[] };
  }
  ```

### 2.3 `BusinessModelSession`
- **Collection:** `BusinessModelSessions`
- **Output Schema:**
  ```typescript
  interface BusinessModelOutput {
    canvas: {
      customerSegments: string[];
      valuePropositions: string[];
      channels: string[];
      customerRelationships: string[];
      revenueStreams: string[];
      keyResources: string[];
      keyActivities: string[];
      keyPartners: string[];
      costStructure: string[];
    };
    unitEconomics: {
      estimatedCac: number;
      estimatedLtv: number;
      paybackPeriodMonths: number;
      grossMarginPct: number;
    };
    pricingTiers: Array<{ name: string; price: number; billingFrequency: string; features: string[] }>;
  }
  ```

### 2.4 `BusinessPlanSession`
- **Collection:** `BusinessPlanSessions`
- **12 Continuous Sections:**
  1. `executiveSummary` (owned editable)
  2. `problemSolution` (synced from Phase 2 Clarifier)
  3. `marketAnalysis` (owned editable)
  4. `revenueModel` (owned editable)
  5. `competitorAnalysis` (owned editable)
  6. `goToMarket` (owned editable)
  7. `financials` (synced live from Step 3.4 ForecastSession)
  8. `team` (synced live from Step 3.6 FormationGenerator)
  9. `fundingRequirements` (bound to Phase 5 seed round)
  10. `operationsPlan` (owned full plan)
  11. `risks` (owned full plan)
  12. `legalFramework` (synced live from Step 3.5 LegalRegulatoryFramework)

### 2.5 `ForecastSession`
- **Collection:** `ForecastSessions`
- **Inputs:** `arpu`, `opex`, `monthlyGrowthPct`, `tam` (Canonical TAM), `monthlyChurnPct`
- **Output Schema:**
  - `revenueForecast.monthly[36]`
  - `costForecast.monthly[36]` (fixed costs, variable costs)
  - `cashFlowProjection.monthly[36]` (net cash flow, ending balance)
  - `breakEvenAnalysis` (`isAchievedWithinHorizon`, `breakEvenMonth`, `breakEvenRevenue`)
  - `risks` (financial category, likelihood, mitigation)

### 2.6 `CreatorLegalAssessment`
- **Collection:** `CreatorLegalAssessments`
- **Deterministic French Rules:** FR-2026.1 statutory rule set
- **Fields:**
  - `DetectedArchetypes`: Array of detected French business archetypes
  - `Items`: Extended statutory checklist items (stage, requirement, authority citation, status)
  - `PlanningReadinessPct`: Weighted score (0–100%)
  - `EvidenceLinks`: Evidence documents attached from Idea Vault

### 2.7 `FormationGenerator`
- **Stored in:** `Phase3Data.FormationGenerator`
- **Fields:**
  - `RecommendedType`: SAS, SASU, SARL, EURL, MICRO, or EI
  - `SelectedType`: Creator's confirmed legal structure
  - `Options`: Full metadata comparison for each legal structure
  - `YouHave`: Array of declared skills (Tech, Finance, Legal, etc.)
  - `YouNeed`: Derived skill gaps paired with specialist profiles
  - `CofounderDraft`: Target cofounder role, equity range, location preference

### 2.8 `CreatorInvestorReadinessScore`
- **Computed By:** `CreatorPhase3Controller.ComputeReadiness(journey, forecast)`
- **Max Score:** 100 points across 5 dimensions:
  1. `ConceptClarity` (Max 20 pts): `(ClarityScore / 100.0) * 20`
  2. `MarketEvidence` (Max 20 pts): TAM Tier (+8), Business Plan present (+6), TargetUser defined (+6)
  3. `FinancialModel` (Max 25 pts): Forecast present (+10), BreakEven <= 24 mo (+8), LTV/CAC >= 3.0 (+7)
  4. `LegalReadiness` (Max 15 pts): `(PlanningReadinessPct / 100.0) * 15`
  5. `TeamCredibility` (Max 20 pts): CreatorEdge defined (+14), SP engaged or Co-founder mapped (+6)
