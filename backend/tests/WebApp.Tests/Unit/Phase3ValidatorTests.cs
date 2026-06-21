using FluentAssertions;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 3 (Financial Submission) validator coverage.
///
/// Backend-authoritative rule: Phase 3 completes only when revenue,
/// valuation, equity (~100%), funding ask, capital allocation (~100%),
/// monthly burn, current funds, KPI baseline, AND every required
/// financial report (pending OR approved) are persisted.
/// </summary>
public class Phase3ValidatorTests
{
    private readonly Mock<MongoDbContext> _mockDbContext;
    private readonly Mock<IMongoCollection<Phase3Kpi>> _mockKpiCollection;
    private readonly Mock<IMongoCollection<Phase3FinancialReport>> _mockReportCollection;
    private readonly PhaseValidator _validator;

    public Phase3ValidatorTests()
    {
        _mockDbContext = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _mockKpiCollection = new Mock<IMongoCollection<Phase3Kpi>>();
        _mockReportCollection = new Mock<IMongoCollection<Phase3FinancialReport>>();

        _mockDbContext.Setup(x => x.Phase3Kpis).Returns(_mockKpiCollection.Object);
        _mockDbContext.Setup(x => x.Phase3FinancialReports).Returns(_mockReportCollection.Object);

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
        FundingAskAmount = 500_000,
        FundingRoundType = "seed",
        MonthlyBurn = 50_000,
        CurrentFunds = 600_000,
        TotalShares = 1_000_000,
        EquityStructure = new List<EquityEntryDto>
        {
            new() { StakeholderName = "Founder", Type = "founder", SharesOwned = 1_000_000 },
        },
        CapitalAllocation = new List<CapitalAllocationDto>
        {
            new() { Category = "Product", Amount = 250_000, Percent = 50 },
            new() { Category = "Sales", Amount = 250_000, Percent = 50 },
        },
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

    private void SetupReportsReturns(IEnumerable<Phase3FinancialReport> reports)
    {
        var list = reports.ToList();
        var cursor = new Mock<IAsyncCursor<Phase3FinancialReport>>();
        cursor.Setup(c => c.Current).Returns(list);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(list.Count > 0)
            .ReturnsAsync(false);

        _mockReportCollection.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<Phase3FinancialReport>>(),
            It.IsAny<FindOptions<Phase3FinancialReport, Phase3FinancialReport>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    private static IEnumerable<Phase3FinancialReport> AllRequiredReports(string status = Phase3Requirements.ReportStatusPending) => new[]
    {
        new Phase3FinancialReport { CompanyId = "comp-1", Type = "pnl", Status = status, FileName = "pnl.pdf" },
        new Phase3FinancialReport { CompanyId = "comp-1", Type = "balance", Status = status, FileName = "balance.pdf" },
    };

    [Fact]
    public async Task Phase3_AllValidData_Passes()
    {
        SetupKpiReturns(GoodKpi());
        SetupReportsReturns(AllRequiredReports());

        var (isValid, errors) = await _validator.ValidatePhase3Async(CompanyWithGoodBasics());

        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase3_MissingKpiBaseline_Fails()
    {
        SetupKpiReturns(null);
        SetupReportsReturns(AllRequiredReports());

        var (isValid, errors) = await _validator.ValidatePhase3Async(CompanyWithGoodBasics());

        isValid.Should().BeFalse();
        errors.Should().Contain("KPI baseline is required");
    }

    [Fact]
    public async Task Phase3_RejectedRequiredReport_Fails()
    {
        SetupKpiReturns(GoodKpi());
        SetupReportsReturns(new[]
        {
            new Phase3FinancialReport { CompanyId = "comp-1", Type = "pnl", Status = "pending" },
            new Phase3FinancialReport { CompanyId = "comp-1", Type = "balance", Status = Phase3Requirements.ReportStatusRejected },
        });

        var (isValid, errors) = await _validator.ValidatePhase3Async(CompanyWithGoodBasics());

        isValid.Should().BeFalse();
        errors.Should().Contain("Required financial report 'balance' is missing or rejected");
    }

    [Fact]
    public async Task Phase3_MissingRequiredReportType_Fails()
    {
        SetupKpiReturns(GoodKpi());
        SetupReportsReturns(new[]
        {
            new Phase3FinancialReport { CompanyId = "comp-1", Type = "pnl", Status = "pending" },
        });

        var (isValid, errors) = await _validator.ValidatePhase3Async(CompanyWithGoodBasics());

        isValid.Should().BeFalse();
        errors.Should().Contain("Required financial report 'balance' is missing or rejected");
    }

    [Fact]
    public async Task Phase3_InvalidCapitalAllocationTotal_Fails()
    {
        var company = CompanyWithGoodBasics();
        company.CapitalAllocation = new List<CapitalAllocationDto>
        {
            new() { Category = "Product", Amount = 100, Percent = 60 }, // 60% total – outside 95-105
        };
        SetupKpiReturns(GoodKpi());
        SetupReportsReturns(AllRequiredReports());

        var (isValid, errors) = await _validator.ValidatePhase3Async(company);

        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Capital allocation must total"));
    }

    [Fact]
    public async Task Phase3_InvalidEquityOwnershipTotal_Fails()
    {
        var company = CompanyWithGoodBasics();
        company.EquityStructure = new List<EquityEntryDto>
        {
            new() { StakeholderName = "Founder", Type = "founder", SharesOwned = 500_000 }, // 50%
        };
        SetupKpiReturns(GoodKpi());
        SetupReportsReturns(AllRequiredReports());

        var (isValid, errors) = await _validator.ValidatePhase3Async(company);

        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Equity ownership must total"));
    }

    [Fact]
    public async Task Phase3_ZeroMonthlyBurn_Fails()
    {
        var company = CompanyWithGoodBasics();
        company.MonthlyBurn = 0;
        SetupKpiReturns(GoodKpi());
        SetupReportsReturns(AllRequiredReports());

        var (isValid, errors) = await _validator.ValidatePhase3Async(company);

        isValid.Should().BeFalse();
        errors.Should().Contain("Monthly burn rate is required (> 0)");
    }

    [Fact]
    public async Task Phase3_ApprovedReportsAlsoPass()
    {
        SetupKpiReturns(GoodKpi());
        SetupReportsReturns(AllRequiredReports(Phase3Requirements.ReportStatusApproved));

        var (isValid, errors) = await _validator.ValidatePhase3Async(CompanyWithGoodBasics());

        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }
}
