using FluentAssertions;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 9 validator: gate phase advancement on at least one deal in a
/// successful terminal state ('signed' or 'completed') and reject any
/// persisted free-form deal statuses that bypassed the state machine.
/// </summary>
public class Phase9ValidatorTests
{
    private readonly Mock<MongoDbContext> _mockDb;
    private readonly Mock<IMongoCollection<DealExecution>> _dealsColl;
    private readonly PhaseValidator _validator;

    public Phase9ValidatorTests()
    {
        _mockDb = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _dealsColl = new Mock<IMongoCollection<DealExecution>>();
        _mockDb.Setup(d => d.DealExecutions).Returns(_dealsColl.Object);
        _validator = new PhaseValidator(_mockDb.Object);
    }

    private void SetupDeals(IEnumerable<DealExecution> deals)
    {
        var list = deals.ToList();
        var cursor = new Mock<IAsyncCursor<DealExecution>>();
        cursor.Setup(c => c.Current).Returns(list);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(list.Count > 0).ReturnsAsync(false);
        _dealsColl.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<DealExecution>>(),
                It.IsAny<FindOptions<DealExecution, DealExecution>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    private static DealExecution Deal(string status = "initiated", string id = "d-1") => new()
    {
        Id = id,
        CompanyId = "comp-1",
        Status = status,
        Investors = new List<DealParticipant>
        {
            new() { InvestorId = "inv-1", Status = "interested" },
        },
        TermSheet = new TermSheet { Status = "draft" },
    };

    [Fact]
    public async Task Phase9_NoDeals_Fails()
    {
        SetupDeals(Enumerable.Empty<DealExecution>());
        var (isValid, errors) = await _validator.ValidatePhase9Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("At least"));
    }

    [Fact]
    public async Task Phase9_OnlyInitiated_Fails()
    {
        SetupDeals(new[] { Deal("initiated") });
        var (isValid, errors) = await _validator.ValidatePhase9Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("terminal success state"));
    }

    [Fact]
    public async Task Phase9_LegacyFreeFormStatus_Fails()
    {
        // Pre-Phase-9 free-form strings (e.g., "negotiation", "closed") must
        // surface as validation errors so callers migrate via legal transitions.
        SetupDeals(new[] { Deal("negotiation") });
        var (isValid, errors) = await _validator.ValidatePhase9Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("invalid status"));
    }

    [Fact]
    public async Task Phase9_OneSigned_Passes()
    {
        SetupDeals(new[] { Deal("signed") });
        var (isValid, errors) = await _validator.ValidatePhase9Async(new Companies { Id = "comp-1" });
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase9_OneCompleted_Passes()
    {
        SetupDeals(new[] { Deal("completed") });
        var (isValid, errors) = await _validator.ValidatePhase9Async(new Companies { Id = "comp-1" });
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase9_RejectedOrWithdrawnOnly_Fails()
    {
        // Terminal but not successful — must not advance.
        SetupDeals(new[] { Deal("rejected"), Deal("withdrawn", "d-2") });
        var (isValid, errors) = await _validator.ValidatePhase9Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("terminal success state"));
    }

    [Fact]
    public async Task Phase9_InvalidParticipantStatus_Fails()
    {
        var d = Deal("signed");
        d.Investors[0].Status = "weird";
        SetupDeals(new[] { d });
        var (isValid, errors) = await _validator.ValidatePhase9Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("invalid status"));
    }
}
