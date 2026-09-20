# Phase 4 Source Map & Normalized ConstructionContext

## Source Document Mapping

| Source Document | Phase | Key Fields Extracted |
|---|---|---|
| `CreatorJourney.Project` | Phase 2 | Name, Tagline, Sector, Problem, Solution, TargetUser |
| `CreatorJourney.Phase2Data` | Phase 2 | LogoAsset, BrandingMethod, Palette, Typography |
| `MarketStudySession` | Phase 3.1 | Status, CurrentVersion, TargetCustomer, Competitors, DemandSignals |
| `BusinessModelSession` | Phase 3.2 | Status, CurrentVersion, ValueProposition, Channels, CostStructure |
| `ForecastSession` | Phase 3.3 | Status, CurrentVersion, RevenueProjections, RunwayMonths, FundingRequired |
| `CreatorLegalAssessment` | Phase 3.4 | EvaluatedAt, SelectedStructure, Obligations, Status, EvidenceCount |
| `CreatorFormationGenerator` | Phase 3.5 | YouHave, YouNeed, SelectedCompanyType, CofounderDraft |
| `BusinessPlanSession` | Phase 3.6 | Status, CurrentVersion, ExecutiveSummary, OperationalOverview |
| `CreatorInvestorReadinessScore` | Phase 3.7 | Total, Label, Stage, GeneratedAt |
| `ProfessionalProfileRecord` | HumainX | Skills (Name, Level, Source), Experience, Languages, VentureContext |

## ConstructionContext DTO

The engine isolates business logic from raw MongoDB schemas through the `ConstructionContext` POCO:

```csharp
public class ConstructionContext
{
    public ProjectContext Project { get; set; }
    public BrandContext Brand { get; set; }
    public MarketContext Market { get; set; }
    public BusinessModelContext BusinessModel { get; set; }
    public FinanceContext Finance { get; set; }
    public LegalContext Legal { get; set; }
    public TeamContext Team { get; set; }
    public BusinessPlanContext BusinessPlan { get; set; }
    public InvestorReadinessContext InvestorReadiness { get; set; }
    public FounderProfileContext FounderProfile { get; set; }
}
```
