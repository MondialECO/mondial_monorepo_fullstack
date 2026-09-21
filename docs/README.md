# Mondial ECO — Platform Documentation

Welcome to the canonical documentation for **Mondial ECO**, the premier platform connecting Creators, Entrepreneurs, Investors, and Service Providers.

This documentation repository is structured into four core pillars, governed by the [Documentation Authority Matrix](DOCUMENTATION-AUTHORITY.md).

---

## Documentation Navigation

```
docs/
├── README.md                      # Documentation Master Entry Point (this file)
├── DOCUMENTATION-AUTHORITY.md     # Single Source of Truth Matrix across all domains
│
├── system-architecture/           # AS-IS Canonical System Architecture (v1 Locked)
│   ├── MONDIAL-ECO-SYSTEM-DESIGN.md
│   ├── MONDIAL-ECO-TECHNICAL-ARCHITECTURE.md
│   ├── MONDIAL-ECO-GITDIAGRAM.md
│   ├── 01-repository-map.md
│   ├── 07-source-of-truth.md
│   ├── ...
│   └── diagrams/                  # 33 Validated Mermaid architecture diagrams (.mmd)
│
├── product/                       # Product Strategy & Domain Canons
│   ├── creator-flow-canon.md      # Creator journey canon (P1–P6, multi-idea, Level Up)
│   ├── service-provider-flow-canon.md # Service Provider canon (flat dashboard, 4 tiers)
│   ├── buyer-journey-reference.md # Investor & Buyer discovery & deal journey
│   └── blueprints/                # Target Enterprise v2.0 product specifications (.docx & .txt)
│
├── operations/                    # Runbooks, Developer Setup & Infrastructure Guides
│   ├── DEVELOPER_SETUP.md         # Monorepo local development & container setup
│   ├── RUNBOOK.md                 # Production deployment, Traefik, & health verification
│   ├── C-1_AI_Operations.md       # OpenRouter AI inference operations & limits
│   ├── C-1_AI_Infrastructure_Plan.md # AI infrastructure engineering guide
│   ├── CREATOR_STABILITY_TESTING.md  # Verification & automated test procedures
│   ├── LOCAL_AUTH_TEST.md         # Local authentication test procedures
│   ├── SUMSUB_INTEGRATION.md      # Sumsub identity verification architecture
│   ├── tech-debt-mongodbcontext-casing.md # MongoDbContext casing debt ledger
│   ├── USER_GUIDE.md              # High-level platform user guide
│   └── issues/                    # Active architectural issue analyses
│
└── archive/                       # Historical Reference & Pre-Consolidation Audits
    ├── README.md                  # Historical disclaimer & archive catalog
    └── ...                        # Preserved legacy audits and implementation logs
```

---

## 1. System Architecture (AS-IS Codebase Authority)

The [system-architecture/](system-architecture/) directory contains the complete, verified AS-IS engineering architecture of the current repository:

- **[System Design](system-architecture/MONDIAL-ECO-SYSTEM-DESIGN.md):** Executive technical summary, actor models, core flows, and system boundaries.
- **[Technical Architecture](system-architecture/MONDIAL-ECO-TECHNICAL-ARCHITECTURE.md):** Deep technical specifications covering backend architecture, frontend routing, data access, and infrastructure.
- **[GitDiagram Application Map](system-architecture/MONDIAL-ECO-GITDIAGRAM.md):** Complete component-level mapping of every directory, controller, service, component, and database collection.
- **[Source of Truth](system-architecture/07-source-of-truth.md):** Strict catalog of canonical MongoDB collections, entities, and projection boundaries.
- **[Auth and Security](system-architecture/08-auth-and-security.md):** JWT authentication, OTP hashing, role claims, and authorization rules.
- **[Architecture Health](system-architecture/37-architecture-health.md):** Codebase health, linting status, test coverage, and stability metrics.
- **[Architecture Diagrams](system-architecture/diagrams/):** 33 validated Mermaid diagrams representing the complete platform state machine, sequences, and domain interactions.

---

## 2. Product Design & Domain Canons

The [product/](product/) directory contains the functional specifications and domain rules:

- **[Creator Flow Canon](product/creator-flow-canon.md):** Definitive guide to Creator Phases P1–P6, HumainX Quick Start gate, multi-idea architecture, AI Clarifier/Discovery, business plan generation, Phase 4 Construction Engine (4.1–4.7), Marketplace listings (Full Buyout and Co-Founder / Equity), and the Level Up transition to Entrepreneur. See also the master [Creator Current Canonical State](file:///d:/mondial.eco/9-12-2026/mondial_monorepo_fullstack/analysis/mbc/creator/CREATOR_CURRENT_CANONICAL_STATE.md).
- **[Service Provider Flow Canon](product/service-provider-flow-canon.md):** Complete specification of the Service Provider flat dashboard (no sequential wizard), 4 provider tiers, flat 12% platform commission, and split profile data architecture (`ProfessionalProfiles`, `UserCredentials`, `ServiceProviderProfiles`).
- **[Buyer Journey Reference](product/buyer-journey-reference.md):** Operational reference for buyers and investors discovering projects and transacting on the marketplace.
- **[Target Product Blueprints](product/blueprints/):** Product roadmap specifications for future Enterprise v2.0 capabilities (non-normative for current AS-IS code).

---

## 3. Operations & Engineering Runbooks

The [operations/](operations/) directory provides hands-on engineering runbooks:

- **[Developer Setup](operations/DEVELOPER_SETUP.md):** Complete instructions for spinning up the full monorepo locally via native servers or Docker Compose.
- **[Production Runbook](operations/RUNBOOK.md):** Deployment checklist, Traefik reverse proxy configuration, health probes (`/health/ready`, `/health/live`), and rollback procedures.
- **[AI Operations](operations/C-1_AI_Operations.md):** Guidelines for managing OpenRouter AI integrations, rate limits, timeouts, and fallback policies.
- **[Technical Debt Ledger](operations/tech-debt-mongodbcontext-casing.md):** Analysis and migration strategy for legacy database casing nuances.

---

## 4. Historical Archive

The [archive/](archive/) directory preserves point-in-time implementation reports, early codebase audits, and scratch files. All archived documents are clearly marked as non-normative. See [archive/README.md](archive/README.md) for the catalog.

---

## Documentation Governance Rules

1. **One Topic, One Authority:** Consult [DOCUMENTATION-AUTHORITY.md](DOCUMENTATION-AUTHORITY.md) before writing or updating documentation to avoid duplication.
2. **Code is Ground Truth:** Technical documentation must strictly reflect working repository code. Future product ideas belong in `docs/product/blueprints/`.
3. **Keep Docs Clean:** Never commit temporary audit reports, raw model scratchpads, or duplicate extracts to the active documentation trees.
