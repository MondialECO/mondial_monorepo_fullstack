# Creator Phase 4.5 — Aids, Grants & Public Support Engine

## 1. Canonical Boundary & Architecture Overview

The purpose of Phase 4.5 is:
> Match the Creator and project with relevant public, institutional, regional, national, and European support opportunities using current authoritative source data and explain exactly why each opportunity may or may not apply, what information is missing, what need it funds, when to apply, what evidence is required, and citing authoritative sources.

```text
4.1 Construction Snapshot   = What is ready / missing / critical
4.2 Operational Roadmap     = When and in what order work happens
4.3 Needs & Requirements    = What resources / support are required
4.4 Skills & Training       = Learn / Delegate / Verify
4.5 Aids, Grants & Support  = What external public / institutional support applies (Current)
4.6 Pricing                 = Locked / Coming Next
```

---

## 2. The Seven Locked Refinements

### Refinement 1: SelectionMode Dimension Decoupled from Eligibility
Eligibility does NOT equal award for competitive or credit-assessed schemes.
- Canonical Modes: `Entitlement`, `Discretionary`, `Competitive`, `CreditAssessment`, `NeedsReview`.
- UI Rule: For `Competitive`, `Discretionary`, and `CreditAssessment` opportunities, the badge displays **"Eligible to Apply"**, NEVER "Eligible for Funding" or "Awarded".
- Zero fabricated probabilities: No "87% chance of grant".

### Refinement 2: Aides-entreprises Open Data Bulk Catalogue Ingestion
Bulk baseline catalog bootstrap is ingested from Aides-entreprises Open Data (CSV/JSON/XML/API) while individual official sources act as rule verification and authority overrides.

### Refinement 3: Programme Owner vs Information Source Separation
The catalogue cleanly distinguishes:
- `ProgrammeOwner`: e.g. "France Travail" for ARCE/ARE, "URSSAF" for ACRE, "Region Île-de-France" for Innov'Up.
- `ManagingAuthority`: e.g. "Bpifrance", "France Travail", "URSSAF".
- `ApplicationAuthority`: e.g. "Portail URSSAF Déclaration CFE".
- `CatalogueSource`: e.g. "AidesEntreprisesOpenDataAdapter", "ServicePublicAdapter".
- `AuthoritativeRuleSources`: Array of official regulatory citations.

### Refinement 4: Regional Support Adapter Architecture
No monolithic regional adapter. Implements `IRegionalSupportAdapter` with modular regional implementations (`IleDeFranceSupportAdapter`, `HautsDeFranceSupportAdapter`, etc.) capable of region-specific rules, URLs, and update cadences.

### Refinement 5: Reproducible Provenance & Source Snapshots
Every opportunity ingestion generates a `SupportSourceSnapshot`:
- `SourceId`
- `OpportunityExternalId`
- `RetrievedAt`
- `SourceUpdatedAt`
- `SourceUrl`
- `ContentFingerprint` (SHA-256)
- `ParserVersion`
- `NormalizationVersion`
- `RawPayload`

### Refinement 6: Rule Normalization Status
Rules extracted from official text require confidence status:
- `VerifiedStructured`
- `HumanValidated`
- `Ambiguous`
- `Rejected`
**Safety Rule**: Only `VerifiedStructured` and `HumanValidated` rules can produce `Eligible`. Ambiguous rules produce `EligibilityStatus.NeedsReview` with reason code `AMBIGUOUS_PARSED_RULE`.

### Refinement 7: Zero Hardcoded Code Constants
Scheme amounts, percentages, deadlines, and criteria are strictly loaded from versioned source records, never frozen as C# or TypeScript code constants.

---

## 3. Data Persistence & Monorepo Boundaries

1. **Normalized Catalogue**: Stored in root MongoDB collections:
   - `SupportOpportunities`
   - `SupportSourceRegistry`
   - `SupportRuleVersions`
   - `SupportSourceSnapshots`
2. **Project-Specific Results**: Persisted strictly on `CreatorJourney.Phase4Data.SupportPlan`. Zero dual-writes to legacy `CreatorIdea`.
3. **Zero Upstream Mutation**: Leaves Phase 1, Phase 2, Phase 3, HumainX, Snapshot, Roadmap, Needs, and Skills completely intact.
4. **MBC Artifact Reuse**: Application checklists automatically detect:
   - Phase 3 Business Plan
   - Phase 3 Financial Forecast
   - Phase 4.4 Skills & Training Plan
   - Phase 3 Legal Assessment / Checklist
