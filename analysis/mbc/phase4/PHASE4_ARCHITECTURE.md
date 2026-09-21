# Phase 4 Architecture — Mondial Business Creation (MBC)

## Overview

Phase 4 bridges strategic business planning (Phase 3) and execution/launch (Phase 5). Rather than jumping straight into execution with generic assumptions, Phase 4 takes the creator's authoritative business intelligence, matches it deterministically against their HumainX professional profile and venture context, and generates an actionable construction diagnosis.

```
Phase 2 (Brand & Assets) + Phase 3 (Business Intelligence)
                            ↓
     HumainX (ProfessionalProfile + VentureContext)
                            ↓
               Normalized ConstructionContext
                            ↓
       Phase 4.1 — Construction Snapshot Engine
```

## Canonical Phase 4 Flow

1. **4.1 Construction Snapshot**: Diagnostic layer — what is Ready, Partial, Missing, Critical, Optional, and NeedsReview across 15 canonical categories.
2. **4.2 Operational Roadmap**: Sequencing and scheduling — translates diagnostic state into an ordered, dependency-aware action timeline paced by founder weekly availability, featuring a single prominent Next Best Action.
3. **4.3 Needs & Requirements**: Structural capability, services, technology, legal, and capital requirements inventory derived from Snapshot gaps and sequenced Roadmap tasks, with false-positive prevention against HumainX founder capabilities.
4. **4.4 Skills & Training**: Decides Learn / Delegate / Verify pathways deterministically evaluated against founder HumainX profile and statutory legal requirements, generating an actionable, time-budgeted skills development plan.
5. **4.5 Aids, Grants & Support**: Matches venture, needs, and skills with public and institutional grants, subsidies, and exemptions using Aides-entreprises Open Data and official primary authority verification.
6. **4.6 Pricing & Revenue Model Engine**: Launch pricing strategy engine — packaging, price floors, multi-stream revenue architecture, unit economics, forecast alignment, empirical validation experiments, and immediate economics recalculation on founder override.
7. **4.7 GTM & Launch Strategy**: Deterministic customer acquisition channels, reason-coded prioritization, weekly capacity reconciliation, empirical validation experiments (`NeedsBaseline`), and standardized conversion funnel metric definitions.
8. **4.8 Showcase Website / Launch Assets**: Public-facing asset deployment (Strict Boundary Preserved; Coming Next).
9. **4.9 Construction Readiness Score**: Quantitative composite readiness metric.

## Strict Architectural Guardrails

- **Diagnostic Boundary**: Phase 4.1 only diagnoses what exists and what is missing. It does *not* assign work to timelines (4.2), decide learn vs delegate (4.4), or compute percentage scores (4.9).
- **Read-Only Invariants**: Phase 2, Phase 3, and HumainX profile documents are strictly read-only. Phase 4.1 never mutates source documents.
- **Deterministic First**: Capability matching, status determination, and critical blocking gates are 100% deterministic code. AI is used solely for narrative summaries and explanations.
- **Routing Isolation**: `/api/creator/phase4/*` is segregated from legacy `/api/creator/offer/*` routes to eliminate cross-namespace bleed.
