# PHASE 4.3 — NEEDS & REQUIREMENTS ENGINE

## Overview & Domain Purpose
Phase 4.3 translates the business's diagnostic state (**Phase 4.1 Construction Snapshot**) and sequenced operational tasks (**Phase 4.2 Operational Roadmap**) into a structured, traceable, capacity-aware inventory of **WHAT** resources, capabilities, services, technology, finance, legal/admin support, or infrastructure are required to build and launch the venture.

### Strict Domain Boundaries
- **Phase 4.1 Construction Snapshot**: Answers **WHAT** is ready, partial, missing, or critical.
- **Phase 4.2 Operational Roadmap**: Answers **WHEN** and in **WHAT ORDER** work happens.
- **Phase 4.3 Needs & Requirements**: Answers **WHAT IS REQUIRED** (team, services, technology, finance, legal/admin, operations).
- **Phase 4.4 Skills & Training**: Answers **HOW TO SOLVE IT** (LEARN, DELEGATE, VERIFY). *Boundary strictly locked; no premature training classification or service matchmaking.*

---

## The 7 Invariant Rules (Approved Architecture)

1. **Single Source of Truth**:
   - Persisted strictly to `CreatorJourney.Phase4Data.NeedsAnalysis`.
   - Zero dual-writing to `CreatorIdea`. If `CreatorIdea` reads needs, it acts only as an unpersisted projection.
2. **Upstream Freshness Gate**:
   - Both `ConstructionSnapshot` and `OperationalRoadmap` must exist AND be current (not stale).
   - If either is stale, generation is blocked with structured prerequisite codes: `SNAPSHOT_REFRESH_REQUIRED` or `ROADMAP_REFRESH_REQUIRED`.
   - Phase 4.3 never mutates or auto-refreshes upstream sources.
3. **Decoupled System Applicability vs. Founder State**:
   - `SystemStatus` (`Identified`, `NeedsReview`, `Satisfied`, `NotRequired`) is system-derived from evidence.
   - `FounderState` (`Unreviewed`, `Confirmed`, `InProgress`, `Deferred`, `ClaimedSatisfied`) tracks founder execution and is editable via PATCH.
4. **No Premature Training Classification**:
   - Missing skills stay as `Capability` under `Team` or `Services`.
   - `TrainingCandidate` is generated only when upstream sources explicitly mandate statutory training/certifications.
   - Final Learn / Delegate / Verify decision belongs to Phase 4.4.
5. **Single Canonical PATCH Endpoint**:
   - `PATCH /api/creator/phase4/needs/{needKey}?ideaId={ideaId}`.
6. **Explicit Source Fingerprints**:
   - Uses real repository timestamp and version fields in `NeedsSourceVersions` without synthetic or mocked hashes.
7. **Separation of Active Needs vs. Covered Requirements**:
   - Main view displays only unresolved `ActiveNeeds`.
   - Covered capabilities are sequestered into a lightweight, collapsible `CoveredRequirements` section, preventing artificial inflation of active needs.

---

## Canonical Taxonomies

### Canonical Categories (`NeedCategory`)
- `Team`: Roles and execution capabilities needed in the founding team.
- `Services`: Professional external services (accounting, legal counsel, specialized auditing).
- `Technology`: Software tools, infrastructure platforms, payment gateways, hosting.
- `Finance`: Working capital, share capital deposit, pre-launch funding requirements.
- `LegalAdmin`: Statutory corporate filings, trademark registrations, regulatory authorizations.
- `Marketing`: Go-to-market assets, brand design, acquisition channels.
- `Sales`: Commercial collateral, CRM setup, customer agreements.
- `Operations`: Banking setups, operational tooling, merchant accounts.
- `Training`: Explicit statutory or certified training prerequisites.
- `Infrastructure`: Cloud hosting, physical workspace, regulatory equipment.

### Requirement Types (`NeedRequirementType`)
- `Role`: Specific human headcount or cofounder needed.
- `Capability`: Functional skill gap (e.g. software engineering, B2B sales).
- `Service`: Contracted external agency or certified practitioner.
- `Software`: SaaS product, API, or vendor tooling.
- `Capital`: Monetary balance required.
- `Compliance`: Statutory legal prerequisite or filing.
- `Asset`: Intellectual property, domain name, or creative asset.
- `TrainingCandidate`: Explicit training or certification requirement.
- `Infrastructure`: Physical or cloud operational foundation.

### Need Timing (`NeedTiming`)
- `Now`: Immediate requirement aligned with Roadmap `NOW` stage.
- `Next30Days`: Month 1 prerequisite.
- `Days30To60`: Month 2 prerequisite.
- `Days60To90`: Month 3 prerequisite.
- `BeforeLaunch`: Mandatory statutory launch prerequisite.
- `PostLaunch`: Post-incorporation ongoing requirement.

---

## REST Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/creator/phase4/needs?ideaId={ideaId}` | Returns current Needs Analysis, staleness, and counts |
| `POST` | `/api/creator/phase4/needs/generate` | Idempotently derives needs (enforcing upstream freshness gate) |
| `POST` | `/api/creator/phase4/needs/refresh` | Re-evaluates needs against fresh sources while preserving founder edits |
| `PATCH` | `/api/creator/phase4/needs/{needKey}?ideaId={ideaId}` | Updates founder state, notes, custom budget, or custom timing |
