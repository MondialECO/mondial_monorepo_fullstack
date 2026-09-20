# Phase 4.1 — Construction Snapshot Specification

## Core Objective

Answers:
- **What is already ready?**
- **What is partially ready?**
- **What is missing?**
- **What requires review?**
- **What is critical?**
- **What is optional?**

## 15 Canonical Categories

1. **Business Foundation** (Concept, Mission, Problem & Solution)
2. **Brand** (Brand identity, Logo, Color palette, Typography)
3. **Market** (Target customer, Problem, Competition, Demand signals)
4. **Business Model** (Value proposition, Customer relationships, Key activities & partners)
5. **Finance** (Forecast existence, Revenue model, Cost structure, Break-even runway)
6. **Legal & Administration** (Legal structure selection, Compliance obligations, Evidence vault)
7. **Team** (YouHave, YouNeed, Co-founder structure, Team complement)
8. **Skills** (Founder declared skills, Proficiency ratings, Taxonomy alignment)
9. **Services** (Accounting support, Legal review, Development services, Advisory)
10. **Technology** (Technical execution, Software infrastructure, Stack readiness)
11. **Funding** (Funding requirement detection, Target capital ask, Readiness posture)
12. **Pricing** (Pricing model identification, Tier structure definition)
13. **Go-to-Market** (Channel definition, Outreach readiness, Positioning)
14. **Launch Assets** (Landing page, Sales materials, Brand kit assets)
15. **Operations** (Operating workflow, Supplier links, Delivery processes)

## Statuses & UI Mappings

| Backend Status | UI Group | Visible Badge | Count Bucket |
|---|---|---|---|
| `Critical` | Critical Attention | Critical / Blocking | `criticalCount` |
| `Ready` | Ready | Ready | `readyCount` |
| `Partial` | Partially Ready | Partial | `partialCount` |
| `NeedsReview` | Partially Ready | Needs Review | `partialCount` |
| `Missing` | Missing | Missing | `missingCount` |
| `Optional` | Optional | Optional | (Excluded from blocking counts) |

## Strict Critical Criteria

An item is marked `Critical` if and only if all 6 conditions are met:
1. Structured business/project data proves the capability is required.
2. It is required before build or launch.
3. Founder has no matching usable capability.
4. Existing team/cofounder does not satisfy it.
5. Existing declared resource/service does not satisfy it.
6. The missing capability materially blocks execution.
