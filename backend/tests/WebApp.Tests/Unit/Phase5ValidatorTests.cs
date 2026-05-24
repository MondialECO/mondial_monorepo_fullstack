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
/// Phase 5 (Funding Submission) validator coverage.
///
/// Backend-authoritative completion: revenue/cap-table prerequisites assumed
/// from prior phases; Phase 5 additionally requires funding ask + capital
/// allocation + hiring plan + pitch deck + funding narrative + valuation +
/// equity offered + whitelisted share type.
/// </summary>
public class Phase5ValidatorTests
{
    private readonly Mock<MongoDbContext> _mockDbContext;
    private readonly PhaseValidator _validator;

    public Phase5ValidatorTests()
    {
        _mockDbContext = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _validator = new PhaseValidator(_mockDbContext.Object);
    }

    private static Companies GoodCompany() => new()
    {
        Id = "comp-1",
        FundingAskAmount = 500_000,
        FundingRoundType = "seed",
        PreMoneyValuation = 5_000_000,
        EquityOfferedPercent = 10,
        ShareType = "preferred",
        CapitalAllocation = new List<CapitalAllocationDto>
        {
            new() { Category = "Product", Amount = 250_000, Percent = 50 },
            new() { Category = "Sales", Amount = 250_000, Percent = 50 },
        },
        ResourceMap = new ResourceMapDto
        {
            HiringPlan = new List<HiringPlanDto>
            {
                new() { Role = "Engineer", Salary = 80_000, Timeline = "Q1", Priority = "high" },
            },
        },
        PitchDeckFileName = "pitch.pdf",
        FundingNarrative = new string('x', 250),
    };

    [Fact]
    public async Task Phase5_AllValid_Passes()
    {
        var (isValid, errors) = await _validator.ValidatePhase5Async(GoodCompany());
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase5_MissingPitchDeck_Fails()
    {
        var c = GoodCompany();
        c.PitchDeckFileName = null;
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain("Pitch deck must be uploaded");
    }

    [Fact]
    public async Task Phase5_ShortNarrative_Fails()
    {
        var c = GoodCompany();
        c.FundingNarrative = "too short";
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Funding narrative must be at least"));
    }

    [Fact]
    public async Task Phase5_MissingValuation_Fails()
    {
        var c = GoodCompany();
        c.PreMoneyValuation = null;
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Pre-money valuation must be >="));
    }

    [Fact]
    public async Task Phase5_InvalidShareType_Fails()
    {
        var c = GoodCompany();
        c.ShareType = "weird";
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Share type must be one of"));
    }

    [Fact]
    public async Task Phase5_InvalidEquityOffered_Fails()
    {
        var c = GoodCompany();
        c.EquityOfferedPercent = 0;
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Equity offered must be between"));
    }

    [Fact]
    public async Task Phase5_NonFiniteFundingAsk_Fails()
    {
        var c = GoodCompany();
        c.FundingAskAmount = double.NaN;
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain("Funding ask amount is required");
    }

    [Fact]
    public async Task Phase5_NonFiniteValuation_Fails()
    {
        var c = GoodCompany();
        c.PreMoneyValuation = double.PositiveInfinity;
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Pre-money valuation must be >="));
    }

    [Fact]
    public async Task Phase5_NonFiniteEquityOffered_Fails()
    {
        var c = GoodCompany();
        c.EquityOfferedPercent = double.NaN;
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Equity offered must be between"));
    }

    [Fact]
    public async Task Phase5_AllocationOutsideBand_Fails()
    {
        var c = GoodCompany();
        c.CapitalAllocation = new List<CapitalAllocationDto>
        {
            new() { Category = "Product", Amount = 100, Percent = 50 },
        };
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Capital allocation must total"));
    }

    [Fact]
    public async Task Phase5_MissingHiringPlan_Fails()
    {
        var c = GoodCompany();
        c.ResourceMap = new ResourceMapDto { HiringPlan = new List<HiringPlanDto>() };
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain("Hiring plan is required");
    }

    [Fact]
    public async Task Phase5_BlankAllocationCategory_Fails()
    {
        var c = GoodCompany();
        c.CapitalAllocation = new List<CapitalAllocationDto>
        {
            new() { Category = "", Amount = 250_000, Percent = 50 },
            new() { Category = "Sales", Amount = 250_000, Percent = 50 },
        };
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("category is required"));
    }

    [Fact]
    public async Task Phase5_NegativeAllocationPercentOffsetByInflated_Fails()
    {
        // Two rows: -25 and 125 → total 100 (would pass the band check) but each row is invalid.
        var c = GoodCompany();
        c.CapitalAllocation = new List<CapitalAllocationDto>
        {
            new() { Category = "Product", Amount = -100, Percent = -25 },
            new() { Category = "Sales", Amount = 600_000, Percent = 125 },
        };
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("percent must be >= 0"));
        errors.Should().Contain(e => e.Contains("percent must be <= 100"));
        errors.Should().Contain(e => e.Contains("amount must be >= 0"));
    }

    [Fact]
    public async Task Phase5_NaNAllocationPercent_Fails()
    {
        var c = GoodCompany();
        c.CapitalAllocation = new List<CapitalAllocationDto>
        {
            new() { Category = "Product", Amount = double.NaN, Percent = double.PositiveInfinity },
            new() { Category = "Sales", Amount = 250_000, Percent = 50 },
        };
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("percent must be a finite number"));
        errors.Should().Contain(e => e.Contains("amount must be a finite number"));
    }

    [Fact]
    public async Task Phase5_BlankHiringRole_Fails()
    {
        var c = GoodCompany();
        c.ResourceMap = new ResourceMapDto
        {
            HiringPlan = new List<HiringPlanDto>
            {
                new() { Role = "  ", Salary = 80_000, Timeline = "Q1", Priority = "high" },
            },
        };
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("role is required"));
    }

    [Fact]
    public async Task Phase5_BlankHiringTimeline_Fails()
    {
        var c = GoodCompany();
        c.ResourceMap = new ResourceMapDto
        {
            HiringPlan = new List<HiringPlanDto>
            {
                new() { Role = "Engineer", Salary = 80_000, Timeline = "", Priority = "high" },
            },
        };
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("timeline is required"));
    }

    [Fact]
    public async Task Phase5_NegativeHiringSalary_Fails()
    {
        var c = GoodCompany();
        c.ResourceMap = new ResourceMapDto
        {
            HiringPlan = new List<HiringPlanDto>
            {
                new() { Role = "Engineer", Salary = -1, Timeline = "Q1", Priority = "high" },
            },
        };
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("salary must be >= 0"));
    }

    [Fact]
    public async Task Phase5_NonFiniteHiringSalary_Fails()
    {
        var c = GoodCompany();
        c.ResourceMap = new ResourceMapDto
        {
            HiringPlan = new List<HiringPlanDto>
            {
                new() { Role = "Engineer", Salary = double.PositiveInfinity, Timeline = "Q1", Priority = "high" },
            },
        };
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("salary must be a finite number"));
    }

    [Fact]
    public async Task Phase5_InvalidHiringPriority_Fails()
    {
        var c = GoodCompany();
        c.ResourceMap = new ResourceMapDto
        {
            HiringPlan = new List<HiringPlanDto>
            {
                new() { Role = "Engineer", Salary = 80_000, Timeline = "Q1", Priority = "urgent" },
            },
        };
        var (isValid, errors) = await _validator.ValidatePhase5Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("priority must be one of"));
    }
}
