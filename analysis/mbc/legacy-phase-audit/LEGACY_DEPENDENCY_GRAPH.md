# MONDIAL BUSINESS CREATION (MBC)
## Legacy Architecture Dependency Graph & Call Lineage

**Audit Date:** September 21, 2026  
**Mode:** STRICT READ-ONLY AUDIT  
**Scope:** Full call graphs, service layers, API clients, UI components, routes, tests, and data persistence for Creator Phase 4, Phase 5, and Phase 6.

---

### 1. Architectural Topology Overview

The codebase exhibits two parallel tracks for Creator Construction:
1. **Legacy Track (Phase 4 Old):** A 4-step wizard (`offer-pricing`) that persists unconstrained form inputs directly to `CreatorIdea.Phase4Data` via `CreatorPhase4Controller`.
2. **Canonical Track (Phase 4.1–4.9 Construction Engine):** A deterministic, policy-driven orchestration suite (`/dashboard/creator/phase-4/*`) persisting validated strategy models to `CreatorJourney.Phase4Data` via `CreatorPhase4ConstructionController`, `PricingStrategyService`, `GtmStrategyService`, `NeedsAnalysisService`, etc.

In contrast, **Phase 5 (Crossroads)** and **Phase 6 (Smart Matchmaking & Level Up)** are single-generation architectures: the existing `CreatorPhase5Controller` and `CreatorPhase6Controller` represent the active, canonical implementations of their respective domain phases.

---

### 2. End-to-End Call Flow Diagrams

#### Diagram A: Legacy Phase 4 (Offer & Pricing)
```mermaid
flowchart TD
    subgraph UI_Layer [Frontend UI]
        OP["/dashboard/creator/offer-pricing<br/>(page.tsx)"]
        P4P["Phase4Pricing.tsx"]
        P4R["Phase4Resource.tsx"]
        P4G["Phase4Gtm.tsx"]
        P4C["Phase4Complete.tsx"]
        CR["creator-state-resolver.ts<br/>(Step 4 fallback)"]
        
        CR -.->|routes to| OP
        OP --> P4P
        OP --> P4R
        OP --> P4G
        OP --> P4C
    end

    subgraph API_Client [Frontend API Client]
        ACJ["api-creator-journey.ts"]
        P4P -->|saveOfferPricing| ACJ
        P4R -->|saveOfferResource| ACJ
        P4G -->|saveOfferGtm| ACJ
        OP -->|getMarketBenchmark| ACJ
    end

    subgraph Controllers [Backend Controllers]
        CP4C["CreatorPhase4Controller.cs<br/>/api/creator/offer/*"]
        ACJ -->|HTTP POST/GET| CP4C
    end

    subgraph Services [Backend Services]
        MBR["MarketBenchmarkResolver.cs"]
        CJS["CreatorJourneyService.cs"]
        
        CP4C -->|ResolveBenchmark| MBR
        CP4C -->|SetPhase4PricingAsync| CJS
        CP4C -->|SetPhase4ResourceAsync| CJS
        CP4C -->|SetPhase4GtmAsync| CJS
    end

    subgraph Data_Store [MongoDB Persistence]
        MB_COLL[("MarketBenchmarks Collection")]
        CI_DOC[("CreatorIdea.Phase4Data<br/>(PricingModel, Tiers,<br/>ResourceCalculation, GtmSetup)")]
        
        MBR -->|Read| MB_COLL
        CJS -->|Write $set| CI_DOC
    end

    subgraph Tests [Automated Tests]
        MBT["MarketBenchmarkTests.cs"]
        MBT -.->|Verifies| CP4C
        MBT -.->|Verifies| MBR
    end
```

---

#### Diagram B: Canonical Phase 4 Construction Engine (Coexisting Track)
```mermaid
flowchart TD
    subgraph Canonical_UI [Canonical Frontend UI]
        HUB["/dashboard/creator/phase-4<br/>(Construction Hub)"]
        P_PRICING["/phase-4/pricing<br/>(PricingStrategyView.tsx)"]
        P_GTM["/phase-4/gtm<br/>(GtmStrategyView.tsx)"]
        P_NEEDS["/phase-4/needs<br/>(NeedsAnalysisView.tsx)"]
        P_SKILLS["/phase-4/skills<br/>(SkillsPlanView.tsx)"]
        P_SUPPORT["/phase-4/support<br/>(SupportPlanView.tsx)"]
        P_ASSETS["/phase-4/launch-assets<br/>(Pending Phase 4.8)"]
        
        HUB --> P_PRICING
        HUB --> P_GTM
        HUB --> P_NEEDS
        HUB --> P_SKILLS
        HUB --> P_SUPPORT
        HUB --> P_ASSETS
    end

    subgraph Canonical_Clients [Canonical API Clients]
        AC_PRICING["api-creator-pricing.ts"]
        AC_GTM["api-creator-gtm.ts"]
        AC_CONST["api-creator-construction.ts"]
        
        P_PRICING --> AC_PRICING
        P_GTM --> AC_GTM
        HUB --> AC_CONST
    end

    subgraph Canonical_Controllers [Canonical Backend Controllers]
        CP4_CONST["CreatorPhase4ConstructionController.cs<br/>/api/creator/phase4/*"]
        AC_PRICING --> CP4_CONST
        AC_GTM --> CP4_CONST
        AC_CONST --> CP4_CONST
    end

    subgraph Domain_Engines [Policy Engines & Services]
        PPE["PricingPolicyEngine.cs"]
        GPE["GtmPolicyEngine.cs"]
        PSS["PricingStrategyService.cs"]
        GSS["GtmStrategyService.cs"]
        NAS["NeedsAnalysisService.cs"]
        SPS["SkillsPlanService.cs"]
        
        CP4_CONST --> PSS
        CP4_CONST --> GSS
        CP4_CONST --> NAS
        CP4_CONST --> SPS
        PSS --> PPE
        GSS --> GPE
    end

    subgraph Canonical_Data [MongoDB Persistence]
        CJ_DOC[("CreatorJourney.Phase4Data<br/>(PricingStrategy, GtmStrategy,<br/>NeedsAnalysis, SkillsPlan, SupportPlan)")]
        
        PSS -->|SetPhase4PricingStrategyAsync| CJ_DOC
        GSS -->|SetPhase4GtmStrategyAsync| CJ_DOC
        NAS -->|SetPhase4NeedsAnalysisAsync| CJ_DOC
    end
```

---

#### Diagram C: Phase 5 (Crossroads) and Phase 6 (Level Up) Call Graph
```mermaid
flowchart TD
    subgraph P5_P6_UI [Phase 5 & 6 Frontend]
        CR_PAGE["/dashboard/creator/crossroads<br/>(Crossroads Hub)"]
        PA_COMP["CrossroadsPathA.tsx<br/>(Marketplace / Buyout)"]
        PB_COMP["CrossroadsPathB.tsx<br/>(Build / Seed Funding)"]
        INV_PAGE["/dashboard/creator/investors<br/>(Investors / Matchmaking)"]
        LUC_MODAL["LevelUpCelebration.tsx<br/>(Celebration Modal)"]
        
        CR_PAGE --> PA_COMP
        CR_PAGE --> PB_COMP
        INV_PAGE --> LUC_MODAL
    end

    subgraph P5_P6_Clients [API Client Methods]
        ACJ56["api-creator-journey.ts"]
        
        PA_COMP -->|choosePath / updatePathA| ACJ56
        PB_COMP -->|updatePathB| ACJ56
        INV_PAGE -->|levelUpToEntrepreneur| ACJ56
    end

    subgraph P5_P6_Controllers [Backend Controllers]
        CP5C["CreatorPhase5Controller.cs<br/>/api/creator/crossroads/*<br/>/api/creator/phase5/*"]
        CP6C["CreatorPhase6Controller.cs<br/>/api/creator/level-up<br/>/api/creator/investor-readiness"]
        
        ACJ56 --> CP5C
        ACJ56 --> CP6C
    end

    subgraph Integration_Services [Deals, Escrow & Identity Services]
        DEALS["DealsService / EscrowService<br/>(Path A Acquisition Deals)"]
        CJS_P5["CreatorJourneyService.cs<br/>(Phase 5 Data Mutators)"]
        AUTH["AuthService / Identity<br/>(User Role Upgrade)"]
        
        CP5C --> DEALS
        CP5C --> CJS_P5
        CP6C --> AUTH
    end

    subgraph P5_P6_Data [MongoDB Multi-Collection Storage]
        CJ_P5[("CreatorJourney.Phase5Data")]
        DEALS_COLL[("Deals Collection")]
        ENT_COLL[("EntrepreneurProfiles Collection<br/>(OfferSetup copied here)")]
        COMP_COLL[("Companies Collection<br/>(New Venture Document)")]
        USERS_COLL[("Users Collection<br/>(Roles: +Entrepreneur)")]
        
        CJS_P5 --> CJ_P5
        DEALS --> DEALS_COLL
        CP6C -->|Transaction| ENT_COLL
        CP6C -->|Transaction| COMP_COLL
        CP6C -->|Transaction| USERS_COLL
    end
```

---

### 3. Detailed Component Interdependency Matrix

| Source Component | Target Component | Relationship Type | Coupling Level | Deletion Impact |
|---|---|---|---|---|
| `creator-state-resolver.ts` | `/dashboard/creator/offer-pricing` | Route redirection | Loose | If modified to point to `/dashboard/creator/phase-4`, eliminates traffic to legacy wizard |
| `offer-pricing/page.tsx` | `Phase4Pricing.tsx` | Direct child component | Tight | Can be deprecated together with parent page |
| `offer-pricing/page.tsx` | `Phase4Resource.tsx` | Direct child component | Tight | Can be deprecated together with parent page |
| `offer-pricing/page.tsx` | `Phase4Gtm.tsx` | Direct child component | Tight | Can be deprecated together with parent page |
| `offer-pricing/page.tsx` | `Phase4Complete.tsx` | Direct child component | Tight | Can be deprecated together with parent page |
| `Phase4Pricing.tsx` | `api-creator-journey.ts (saveOfferPricing)` | API invocation | Medium | None if parent page is retired |
| `Phase4Resource.tsx` | `api-creator-journey.ts (saveOfferResource)` | API invocation | Medium | None if parent page is retired |
| `Phase4Gtm.tsx` | `api-creator-journey.ts (saveOfferGtm)` | API invocation | Medium | None if parent page is retired |
| `api-creator-journey.ts` | `CreatorPhase4Controller.cs` | HTTP REST (`/api/creator/offer/*`) | Medium | Endpoints can be marked obsolete once frontend caller is rerouted |
| `CreatorPhase4Controller.cs` | `MarketBenchmarkResolver.cs` | Dependency Injection | Loose | `MarketBenchmarkResolver` is ALSO used by `MarketStudyHandler.cs` (Phase 3.1); resolver MUST NOT be deleted |
| `CreatorPhase4Controller.cs` | `CreatorJourneyService.cs` | Dependency Injection | Medium | Methods (`SetPhase4PricingAsync`, etc.) write to `CreatorIdea.Phase4Data` |
| `MarketBenchmarkTests.cs` | `CreatorPhase4Controller.cs` | Test invocation | High | Test will fail if `CreatorPhase4Controller` is deleted before test refactoring |
| `CreatorPhase5Controller.cs` | `DealsService` & `EscrowService` | Domain integration | Tight | Must NOT be deleted; active transactional marketplace logic |
| `CreatorPhase6Controller.cs` | `EntrepreneurProfileRecord` | Database copy | Critical | Writes `journey.Phase4Data` into `existingProfile.OfferSetup` |

---

### 4. Cross-System Architectural Observations

1. **Reusability of `MarketBenchmarkResolver`:**
   `MarketBenchmarkResolver` provides statistical reference data (min/median/max budgets, durations, and pricing benchmarks based on industry sectors). While `CreatorPhase4Controller` consumes it for legacy benchmark views, `MarketStudyHandler` in Phase 3.1 also relies on it. It is therefore a **reusable domain utility**, not dead code.

2. **Phase 5 & 6 Are Production-Ready Canonical Modules:**
   Unlike Phase 4 (which underwent a comprehensive 9-phase redesign into `Phase4Construction`), Phase 5 (Crossroads) and Phase 6 (Level Up) are already structured around their permanent business capabilities:
   - Phase 5 manages high-value real-world workflows: IP valuation, marketplace publishing with NDA gating, and company formation.
   - Phase 6 manages the transition invariant: keeping user identity and company records continuous while adding the Entrepreneur role.
