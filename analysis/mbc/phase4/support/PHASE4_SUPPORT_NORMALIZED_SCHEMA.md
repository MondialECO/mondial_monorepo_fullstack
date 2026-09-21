# Phase 4.5 Support Normalized Schema

## 1. Domain Enums

### SupportType
`Grant`, `Subsidy`, `SocialContributionExemption`, `TaxRelief`, `TaxCredit`, `Allowance`, `Loan`, `HonorLoan`, `Guarantee`, `Advance`, `EquitySupport`, `EmploymentSupport`, `InnovationSupport`, `TrainingFunding`, `ExportSupport`, `RegionalSupport`, `EuropeanFunding`, `CompetitionOrPrize`, `Incubation`, `Mentoring`, `AdvisorySupport`, `Other`.

### SelectionMode
- `Entitlement`: Statutory right upon meeting codified conditions (e.g. ACRE, ARE).
- `Discretionary`: Discretionary allocation subject to administrative assessment.
- `Competitive`: Call for projects with competitive selection committee (e.g. Bourse French Tech, Innov'Up).
- `CreditAssessment`: Reimbursable loan, guarantee, or honor loan requiring solvency/governance committee review.
- `NeedsReview`: Requires human clarification.

### RuleNormalizationStatus
- `VerifiedStructured`: Extracted directly from official API or codified schema.
- `HumanValidated`: Parsed rule reviewed and validated by domain analyst.
- `Ambiguous`: Parsed text contains ambiguous or discretionary phrasing. Yields `NeedsReview`.
- `Rejected`: Invalidated rule. Cannot produce `Eligible`.

### EligibilityStatus
`Eligible`, `PotentiallyEligible`, `NeedsInformation`, `NotYetEligible`, `NotEligible`, `Expired`, `NeedsReview`.

### ApplicationReadiness
`ReadyToApply`, `AlmostReady`, `MissingInformation`, `PrerequisiteRequired`, `NotYetEligible`, `NotApplicable`.

### FounderApplicationState
`NotStarted`, `Reviewing`, `Preparing`, `ReadyToApply`, `Applied`, `Awarded`, `Rejected`, `Withdrawn`, `Skipped`.

---

## 2. Collections Schema

### `SupportOpportunities` (MongoDB Collection: `support_opportunities`)
- `ExternalId`: String (Unique index)
- `SourceId`: String (Index)
- `Name`: String
- `Description`: String
- `SupportType`: String
- `SelectionMode`: String
- `ProgrammeOwner`: String
- `ManagingAuthority`: String
- `ApplicationAuthority`: String
- `CatalogueSource`: String
- `Jurisdiction`: String ("FR", "EU")
- `GeographicScope`: String ("National", "Regional", "European")
- `EligibleLocations`: Array of Strings (Compound index with Status)
- `SupportValueMin` / `SupportValueMax`: Decimal?
- `SupportValueDescription`: String
- `SupportValueType`: String
- `EligibilityRules`: Array of `SupportEligibilityRule`

### `SupportSourceSnapshots` (MongoDB Collection: `support_source_snapshots`)
- `SourceId`: String (Index)
- `OpportunityExternalId`: String (Index)
- `RetrievedAt`: DateTime
- `SourceUpdatedAt`: DateTime?
- `SourceUrl`: String
- `ContentFingerprint`: String (SHA-256)
- `ParserVersion`: String
- `NormalizationVersion`: String
- `RawPayload`: String?
