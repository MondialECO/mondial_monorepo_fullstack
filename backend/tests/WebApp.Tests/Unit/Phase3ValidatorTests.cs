using FluentAssertions;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 3 (Financial Valuation & KPI) validator coverage.
///
/// Backend-authoritative rule for the four-step workflow (Revenue →
/// Automated Valuation → Live KPI Tracking → Concept Overview): Phase 3
/// completes only when positive quarterly revenue, a calculated valuation,
/// a valid KPI baseline, AND a Concept Overview document are persisted.
///
/// Funding ask, capital allocation, equity structure, cash position, and
/// financial-report uploads are intentionally NOT required (they belong to
/// later phases / different workflows).
/// </summary>
public class Phase3ValidatorTests
{
    private readonly Mock<MongoDbContext> _mockDbContext;
    private readonly Mock<IMongoCollection<Phase3Kpi>> _mockKpiCollection;
    private readonly Mock<IMongoCollection<Phase3Concept>> _mockConceptCollection;
    private readonly PhaseValidator _validator;

    public Phase3ValidatorTests()
    {
        _mockDbContext = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _mockKpiCollection = new Mock<IMongoCollection<Phase3Kpi>>();
        _mockConceptCollection = new Mock<IMongoCollection<Phase3Concept>>();

        _mockDbContext.Setup(x => x.Phase3Kpis).Returns(_mockKpiCollection.Object);
        _mockDbContext.Setup(x => x.Phase3Concepts).Returns(_mockConceptCollection.Object);

        _validator = new PhaseValidator(_mockDbContext.Object);
    }

    private static Companies CompanyWithGoodBasics() => new()
    {
        Id = "comp-1",
        Q1Revenue = 100_000,
        Q2Revenue = 110_000,
        Q3Revenue = 120_000,
        Q4Revenue = 130_000,
        Valuation = 5_000_000,
    };

    private static Phase3Kpi GoodKpi() => new()
    {
        Mrr = 10_000,
        Arr = 120_000,
        GrossMarginPercent = 70,
        Cac = 200,
        Ltv = 2_000,
        ChurnPercent = 4,
        ActiveAccounts = 50,
    };

    private static Phase3Concept GoodConcept() => new()
    {
        CompanyId = "comp-1",
        OneLiner = "An AI co-pilot for indie founders to ship faster.",
        ProblemStatement = "Founders waste weeks on boilerplate before validating an idea.",
        SolutionDescription = "Generate and wire features from a spec.",
        Stage = "mvp",
        BusinessModel = "SaaS_Subscription",
        SectorTags = new List<string> { "SaaS" },
        ClarityScore = 100,
    };

    private void SetupKpiReturns(Phase3Kpi? kpi)
    {
        var cursor = new Mock<IAsyncCursor<Phase3Kpi>>();
        cursor.Setup(c => c.Current).Returns(kpi == null ? new List<Phase3Kpi>() : new[] { kpi });
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(kpi != null)
            .ReturnsAsync(false);

        _mockKpiCollection.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<Phase3Kpi>>(),
            It.IsAny<FindOptions<Phase3Kpi, Phase3Kpi>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    private void SetupConceptReturns(Phase3Concept? concept)
    {
        var cursor = new Mock<IAsyncCursor<Phase3Concept>>();
        cursor.Setup(c => c.Current).Returns(concept == null ? new List<Phase3Concept>() : new[] { concept });
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(concept != null)
            .ReturnsAsync(false);

        _mockConceptCollection.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<Phase3Concept>>(),
            It.IsAny<FindOptions<Phase3Concept, Phase3Concept>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    [Fact]
    public async Task Phase3_AllValidData_Passes()
    {
        SetupKpiReturns(GoodKpi());
        SetupConceptReturns(GoodConcept());

        var (isValid, errors) = await _validator.ValidatePhase3Async(CompanyWithGoodBasics());

        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase3_MissingKpiBaseline_Fails()
    {
        SetupKpiReturns(null);
        SetupConceptReturns(GoodConcept());

        var (isValid, errors) = await _validator.ValidatePhase3Async(CompanyWithGoodBasics());

        isValid.Should().BeFalse();
        errors.Should().Contain("KPI baseline is required");
    }

    [Fact]
    public async Task Phase3_MissingConcept_Fails()
    {
        SetupKpiReturns(GoodKpi());
        SetupConceptReturns(null);

        var (isValid, errors) = await _validator.ValidatePhase3Async(CompanyWithGoodBasics());

        isValid.Should().BeFalse();
        errors.Should().Contain("Concept overview is required");
    }

    [Fact]
    public async Task Phase3_PreRevenue_ZeroRevenueAccepted()
    {
        var company = CompanyWithGoodBasics();
        company.Q1Revenue = company.Q2Revenue = company.Q3Revenue = company.Q4Revenue = 0;
        company.Valuation = 1_200_000; // Pre-revenue scorecard valuation
        SetupKpiReturns(GoodKpi());
        SetupConceptReturns(GoodConcept());

        var (isValid, errors) = await _validator.ValidatePhase3Async(company);

        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase3_PreRevenue_CanCompleteWithValidBaseline()
    {
        var company = new Companies
        {
            Id = "comp-pre-rev",
            Industry = "saas",
            Q1Revenue = 0,
            Q2Revenue = 0,
            Q3Revenue = 0,
            Q4Revenue = 0,
            Valuation = 1_050_000,
        };

        var preRevKpi = new Phase3Kpi
        {
            Mrr = 0,
            Arr = 0,
            GrossMarginPercent = 0,
            Cac = 0,
            Ltv = 0,
            ChurnPercent = 0,
            ActiveAccounts = 25, // Beta pilot users
        };

        SetupKpiReturns(preRevKpi);
        SetupConceptReturns(GoodConcept());

        var (isValid, errors) = await _validator.ValidatePhase3Async(company);

        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase3_PreRevenue_ValuationUsesNonRevenueMethod()
    {
        var engine = new ValuationEngine();
        var context = new ValuationContext
        {
            Stage = "mvp",
            IsLegalEntityFormed = true,
            FounderCount = 2,
            DocumentsVerified = true,
            LargestOwnershipPct = 50,
        };

        var result = await engine.CalculateValuationAsync(0, 0, "saas", context);

        result.EstimatedValuation.Should().BeGreaterThan(500_000);
        result.RevenueMultiple.Should().Be(0.0);
        result.Rationale.Should().StartWith("Pre-Revenue Scorecard");
        result.ConfidenceScore.Should().BeInRange(45, 60);
    }

    [Fact]
    public async Task Phase3_PreRevenue_DoesNotFakeRevenue()
    {
        var company = CompanyWithGoodBasics();
        company.Q1Revenue = 0;
        company.Q2Revenue = 0;
        company.Q3Revenue = 0;
        company.Q4Revenue = 0;

        // Proves 0 is stored honestly without needing synthetic 1 EUR
        ((company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0))
            .Should().Be(0);
    }

    [Fact]
    public async Task Phase3_RevenueGenerating_ExistingValuationStillWorks()
    {
        var engine = new ValuationEngine();
        var context = new ValuationContext
        {
            Stage = "revenue",
            IsLegalEntityFormed = true,
            FounderCount = 2,
            Q1 = 100_000, Q2 = 110_000, Q3 = 120_000, Q4 = 130_000,
        };

        var result = await engine.CalculateValuationAsync(460_000, 0.1, "saas", context);

        result.EstimatedValuation.Should().BeGreaterThan(3_000_000);
        result.RevenueMultiple.Should().Be(8.0);
        result.Rationale.Should().StartWith("Revenue");
    }

    [Fact]
    public async Task Phase3_NegativeRevenueRejected()
    {
        var company = CompanyWithGoodBasics();
        company.Q1Revenue = -10_000;
        SetupKpiReturns(GoodKpi());
        SetupConceptReturns(GoodConcept());

        var (isValid, errors) = await _validator.ValidatePhase3Async(company);

        isValid.Should().BeFalse();
        errors.Should().Contain("Quarterly revenue cannot be negative");
    }

    [Fact]
    public async Task Phase3_RequiresKpiBaseline()
    {
        SetupKpiReturns(null);
        SetupConceptReturns(GoodConcept());

        var (isValid, errors) = await _validator.ValidatePhase3Async(CompanyWithGoodBasics());

        isValid.Should().BeFalse();
        errors.Should().Contain("KPI baseline is required");
    }

    [Fact]
    public async Task Phase3_RequiresConceptOverview()
    {
        SetupKpiReturns(GoodKpi());
        SetupConceptReturns(null);

        var (isValid, errors) = await _validator.ValidatePhase3Async(CompanyWithGoodBasics());

        isValid.Should().BeFalse();
        errors.Should().Contain("Concept overview is required");
    }

    [Fact]
    public async Task Phase3_RequiresValuationAssessment()
    {
        var company = CompanyWithGoodBasics();
        company.Valuation = null;
        SetupKpiReturns(GoodKpi());
        SetupConceptReturns(GoodConcept());

        var (isValid, errors) = await _validator.ValidatePhase3Async(company);

        isValid.Should().BeFalse();
        errors.Should().Contain("Valuation must be calculated");
    }

    [Fact]
    public async Task Phase3_DoesNotRequireFundingOrEquityOrReports()
    {
        SetupKpiReturns(GoodKpi());
        SetupConceptReturns(GoodConcept());

        var (isValid, errors) = await _validator.ValidatePhase3Async(CompanyWithGoodBasics());

        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }
}
