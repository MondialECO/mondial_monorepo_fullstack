# PHASE 4.3 — NEEDS & REQUIREMENTS SOURCE MAP

This document maps all upstream artifacts (Construction Snapshot, Operational Roadmap, Phase 3 modules, HumainX Profile) to derived Creator Needs.

---

## 1. Upstream Source Matrix

| Upstream Source | Source Field / Entity | Derived Need Category | Requirement Type | Example Need Key |
|---|---|---|---|---|
| **Phase 4.1 Construction Snapshot** | `CriticalItems`, `MissingItems` (Skills & Team) | `Team` | `Capability` / `Role` | `team.skills-software-development` |
| **Phase 4.2 Operational Roadmap** | `Tasks` (RequiresExternalAction / Blocking) | `LegalAdmin`, `Services`, `Technology` | `Service`, `Compliance`, `Technology` | `roadmap.legal-company-registration` |
| **Legal Assessment (FR-2026.1)** | Statutory requirements (`FR-CORP-001`, `FR-IP-001`) | `LegalAdmin` | `Compliance`, `Asset` | `legal.capital-deposit`, `legal.trademark-filing` |
| **Legal Assessment & Team** | Statutory fiscal accounting requirement | `Services` | `ProfessionalService` | `service.accounting-support` |
| **Financial Forecast (C-4)** | `FundingNeed`, `TotalLaunchBudget`, `Opex` | `Finance` | `Capital` | `finance.launch-capital` |
| **Business Model Canvas** | `RevenueStreams` | `Technology` | `Software` | `technology.payment-processing` |
| **HumainX Profile & Team** | `Skills`, `LanguageProficiencies`, `YouHave` | *Coverage Suppression* | *N/A* | *Marks needs Satisfied in CoveredRequirements* |

---

## 2. False-Positive Prevention Matrix

To prevent inflating the Creator's requirement list with items they already possess:

1. **Declared Founder Skills**:
   - Evaluated using `ICapabilityMatcher`.
   - If the founder has a skill at `Comfortable` or `Expert` level (e.g. `React`, `Frontend Development`, `Accounting`), the corresponding need is classified as `NeedSystemStatus.Satisfied` and stored in `CoveredRequirements`.
2. **Founding Team Capabilities**:
   - If `FormationGenerator.YouHave` contains a capability (e.g. `Technical Co-founder`, `Software Engineer`), the corresponding need is classified as `Satisfied`.
3. **Phase 3 Completed Milestones**:
   - Completed statutory legal checklist items are marked `Satisfied`.
   - Completed roadmap tasks are marked `Satisfied`.

---

## 3. Budget Derivation Rules (Zero Invention)

- **Forecast Present**: `EstimatedBudget` is populated strictly from `context.Forecast.FundingNeed` or `TotalLaunchBudget` with `BudgetConfidence = "DerivedFromForecast"`.
- **Forecast Absent or Incomplete**: `EstimatedBudget` is set to `null` with `BudgetConfidence = "Unknown"`.
- Under no circumstances does the engine synthesize monetary figures out of thin air.
