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
/// Phase 4 (Cap Table Submission) validator coverage. Backend-authoritative.
///
/// Phase 4 completes only when the latest Phase4CapTable snapshot has:
/// total shares > 0, at least one founder, no negative grants, issued shares
/// reconcile to 90-100% of total, valid share classes, no duplicate rows,
/// ESOP allocation sane, and every per-grant + standalone vesting schedule
/// has cliff <= total.
/// </summary>
public class Phase4ValidatorTests
{
    private readonly Mock<MongoDbContext> _mockDbContext;
    private readonly Mock<IMongoCollection<Phase4CapTable>> _mockCapTableCollection;
    private readonly Mock<IMongoCollection<Phase4VestingSchedule>> _mockVestingCollection;
    private readonly PhaseValidator _validator;

    public Phase4ValidatorTests()
    {
        _mockDbContext = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _mockCapTableCollection = new Mock<IMongoCollection<Phase4CapTable>>();
        _mockVestingCollection = new Mock<IMongoCollection<Phase4VestingSchedule>>();

        _mockDbContext.Setup(x => x.Phase4CapTables).Returns(_mockCapTableCollection.Object);
        _mockDbContext.Setup(x => x.Phase4VestingSchedules).Returns(_mockVestingCollection.Object);

        _validator = new PhaseValidator(_mockDbContext.Object);
    }

    private static Companies CompanyWithId(string id = "comp-1") => new()
    {
        Id = id,
        Q1Revenue = 100, Q2Revenue = 100, Q3Revenue = 100, Q4Revenue = 100,
        Valuation = 1_000_000,
        FundingAskAmount = 100_000,
        FundingRoundType = "seed",
    };

    private static Phase4CapTable GoodCapTable(string companyId = "comp-1") => new()
    {
        Id = "ct-1",
        CompanyId = companyId,
        Version = 1,
        TotalShares = 1_000_000,
        EsopPoolPercent = 10,
        EsopVestingMonths = 48,
        Grants = new List<EquityGrant>
        {
            new() { StakeholderName = "Founder A", StakeholderType = "founder", ShareClass = "common", SharesGranted = 800_000, CliffMonths = 12, TotalVestMonths = 48 },
            new() { StakeholderName = "Investor X", StakeholderType = "investor", ShareClass = "preferred", SharesGranted = 100_000, CliffMonths = 0, TotalVestMonths = 0 },
            new() { StakeholderName = "ESOP Pool", StakeholderType = "esop", ShareClass = "common", SharesGranted = 100_000, CliffMonths = 0, TotalVestMonths = 48 },
        },
        RecordedAt = DateTime.UtcNow,
    };

    private void SetupCapTable(Phase4CapTable? snapshot)
    {
        var list = snapshot == null ? new List<Phase4CapTable>() : new List<Phase4CapTable> { snapshot };
        var cursor = new Mock<IAsyncCursor<Phase4CapTable>>();
        cursor.Setup(c => c.Current).Returns(list);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(list.Count > 0)
            .ReturnsAsync(false);

        _mockCapTableCollection.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<Phase4CapTable>>(),
            It.IsAny<FindOptions<Phase4CapTable, Phase4CapTable>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    private void SetupVesting(IEnumerable<Phase4VestingSchedule> schedules)
    {
        var list = schedules.ToList();
        var cursor = new Mock<IAsyncCursor<Phase4VestingSchedule>>();
        cursor.Setup(c => c.Current).Returns(list);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(list.Count > 0)
            .ReturnsAsync(false);

        _mockVestingCollection.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<Phase4VestingSchedule>>(),
            It.IsAny<FindOptions<Phase4VestingSchedule, Phase4VestingSchedule>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    [Fact]
    public async Task Phase4_AllValid_Passes()
    {
        SetupCapTable(GoodCapTable());
        SetupVesting(Enumerable.Empty<Phase4VestingSchedule>());

        var (isValid, errors) = await _validator.ValidatePhase4Async(CompanyWithId());

        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase4_NoCapTableSubmitted_Fails()
    {
        SetupCapTable(null);
        SetupVesting(Enumerable.Empty<Phase4VestingSchedule>());

        var (isValid, errors) = await _validator.ValidatePhase4Async(CompanyWithId());

        isValid.Should().BeFalse();
        errors.Should().Contain("Cap table must be submitted");
    }

    [Fact]
    public async Task Phase4_OwnershipExceedsTotal_Fails()
    {
        var ct = GoodCapTable();
        ct.Grants.Add(new EquityGrant
        {
            StakeholderName = "Investor Y", StakeholderType = "investor",
            ShareClass = "preferred", SharesGranted = 500_000,
        });
        SetupCapTable(ct);
        SetupVesting(Enumerable.Empty<Phase4VestingSchedule>());

        var (isValid, errors) = await _validator.ValidatePhase4Async(CompanyWithId());

        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("exceed total authorised shares"));
    }

    [Fact]
    public async Task Phase4_NegativeOwnership_Fails()
    {
        var ct = GoodCapTable();
        ct.Grants[0].SharesGranted = -1;
        SetupCapTable(ct);
        SetupVesting(Enumerable.Empty<Phase4VestingSchedule>());

        var (isValid, errors) = await _validator.ValidatePhase4Async(CompanyWithId());

        isValid.Should().BeFalse();
        errors.Should().Contain("Cap table contains negative share grants");
    }

    [Fact]
    public async Task Phase4_NoFounder_Fails()
    {
        var ct = GoodCapTable();
        ct.Grants[0].StakeholderType = "investor";
        SetupCapTable(ct);
        SetupVesting(Enumerable.Empty<Phase4VestingSchedule>());

        var (isValid, errors) = await _validator.ValidatePhase4Async(CompanyWithId());

        isValid.Should().BeFalse();
        errors.Should().Contain("At least one founder grant is required");
    }

    [Fact]
    public async Task Phase4_InvalidShareClass_Fails()
    {
        var ct = GoodCapTable();
        ct.Grants[1].ShareClass = "weird-class";
        SetupCapTable(ct);
        SetupVesting(Enumerable.Empty<Phase4VestingSchedule>());

        var (isValid, errors) = await _validator.ValidatePhase4Async(CompanyWithId());

        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("invalid share class 'weird-class'"));
    }

    [Fact]
    public async Task Phase4_DuplicateRows_Fail()
    {
        var ct = GoodCapTable();
        ct.Grants.Add(new EquityGrant
        {
            StakeholderName = "Investor X", StakeholderType = "investor",
            ShareClass = "preferred", SharesGranted = 0,
        });
        // Also remove some other shares to avoid totals overflow masking the dup test.
        ct.Grants[2].SharesGranted = 100_000;
        SetupCapTable(ct);
        SetupVesting(Enumerable.Empty<Phase4VestingSchedule>());

        var (isValid, errors) = await _validator.ValidatePhase4Async(CompanyWithId());

        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Duplicate cap-table row"));
    }

    [Fact]
    public async Task Phase4_EsopPoolWithoutVestingMonths_Fails()
    {
        var ct = GoodCapTable();
        ct.EsopPoolPercent = 15;
        ct.EsopVestingMonths = 0;
        SetupCapTable(ct);
        SetupVesting(Enumerable.Empty<Phase4VestingSchedule>());

        var (isValid, errors) = await _validator.ValidatePhase4Async(CompanyWithId());

        isValid.Should().BeFalse();
        errors.Should().Contain("ESOP vesting months must be > 0 when ESOP pool is non-zero");
    }

    [Fact]
    public async Task Phase4_InvalidVestingCliffGreaterThanTotal_Fails()
    {
        var ct = GoodCapTable();
        ct.Grants[0].CliffMonths = 60;
        ct.Grants[0].TotalVestMonths = 48;
        SetupCapTable(ct);
        SetupVesting(Enumerable.Empty<Phase4VestingSchedule>());

        var (isValid, errors) = await _validator.ValidatePhase4Async(CompanyWithId());

        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("cliff months (60) cannot exceed total vest months (48)"));
    }

    [Fact]
    public async Task Phase4_UnderReconciledTotals_Fails()
    {
        // 700k of 1M = 70% → outside 90-100 band
        var ct = GoodCapTable();
        ct.Grants[0].SharesGranted = 500_000;
        ct.Grants[1].SharesGranted = 100_000;
        ct.Grants[2].SharesGranted = 100_000;
        SetupCapTable(ct);
        SetupVesting(Enumerable.Empty<Phase4VestingSchedule>());

        var (isValid, errors) = await _validator.ValidatePhase4Async(CompanyWithId());

        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("reconcile to ~100%"));
    }
}
