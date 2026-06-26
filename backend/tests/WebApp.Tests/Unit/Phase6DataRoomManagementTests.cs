using FluentAssertions;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 6 data-room management: grant deduplication, investor-existence
/// validation on grant, and the NDA lock that prevents disabling enforcement
/// after an investor has signed.
/// </summary>
public class Phase6DataRoomManagementTests
{
    private readonly Mock<MongoDbContext> _mockDb;
    private readonly Mock<IMongoCollection<Companies>> _companies;
    private readonly Mock<IMongoCollection<Investor>> _investors;
    private readonly Mock<IMongoCollection<Phase6NdaAcceptance>> _ndas;
    private readonly CompanyService _service;

    public Phase6DataRoomManagementTests()
    {
        _mockDb = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _companies = new Mock<IMongoCollection<Companies>>();
        _investors = new Mock<IMongoCollection<Investor>>();
        _ndas = new Mock<IMongoCollection<Phase6NdaAcceptance>>();

        _mockDb.Setup(d => d.Companies).Returns(_companies.Object);
        _mockDb.Setup(d => d.Investors).Returns(_investors.Object);
        _mockDb.Setup(d => d.Phase6NdaAcceptances).Returns(_ndas.Object);

        _companies.Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<Companies>(),
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

        _service = new CompanyService(
            _mockDb.Object,
            new Mock<IValuationEngine>().Object,
            new Mock<ICapTableCalculator>().Object,
            new Mock<IInvestorMatcher>().Object,
            new Mock<IAiReviewEngine>().Object,
            new Mock<IDocumentManager>().Object,
            new Mock<IPhaseValidator>().Object,
            new Mock<IDealEventPublisher>().Object);
    }

    // Fresh cursor per call so methods that read the company more than once
    // (grant → GetDataRoomStatus) both resolve.
    private void SetupCompanyFind(Companies company)
    {
        _companies.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<FindOptions<Companies, Companies>>(),
                It.IsAny<CancellationToken>()))
            .Returns(() => Task.FromResult(MakeCursor(company)));
    }

    private void SetupInvestorFind(Investor? investor)
    {
        _investors.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Investor>>(),
                It.IsAny<FindOptions<Investor, Investor>>(),
                It.IsAny<CancellationToken>()))
            .Returns(() => Task.FromResult(MakeCursor(investor)));
    }

    private static IAsyncCursor<T> MakeCursor<T>(T? item) where T : class
    {
        var list = item == null ? new List<T>() : new List<T> { item };
        var cursor = new Mock<IAsyncCursor<T>>();
        cursor.Setup(c => c.Current).Returns(list);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(list.Count > 0).ReturnsAsync(false);
        return cursor.Object;
    }

    private static Companies Company(List<DataRoomAccessRecord>? grants = null, DateTime? ndaLockedAt = null)
        => new()
        {
            Id = "comp-1",
            OwnerId = "owner-1",
            IsDataRoomLive = true,
            IsDataRoomNdaRequired = true,
            DataRoomNdaLockedAt = ndaLockedAt,
            DataRoomAccessRecords = grants ?? new List<DataRoomAccessRecord>(),
        };

    private static Investor LiveInvestor() => new() { Id = "inv-1", Name = "Acme Capital" };

    // ============================================================
    // Grant validation + dedupe
    // ============================================================

    [Fact]
    public async Task Grant_InvalidInvestor_Throws()
    {
        SetupCompanyFind(Company());
        SetupInvestorFind(null); // investor does not exist

        var act = async () => await _service.GrantDataRoomAccessAsync(
            "comp-1", new DataRoomAccessRequest { InvestorId = "ghost", AccessLevel = "download", DaysValid = 30 });

        (await act.Should().ThrowAsync<ArgumentException>())
            .Which.Message.Should().Contain("not found");
    }

    [Fact]
    public async Task Grant_EmptyInvestorId_Throws()
    {
        SetupCompanyFind(Company());

        var act = async () => await _service.GrantDataRoomAccessAsync(
            "comp-1", new DataRoomAccessRequest { InvestorId = "  ", AccessLevel = "download", DaysValid = 30 });

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task Grant_SameInvestorTwice_DedupesToOneRecord()
    {
        var existing = new DataRoomAccessRecord
        {
            InvestorId = "inv-1",
            AccessLevel = "view_only",
            GrantedAt = DateTime.UtcNow.AddDays(-5),
            ExpiresAt = DateTime.UtcNow.AddDays(2),
        };
        SetupCompanyFind(Company(new List<DataRoomAccessRecord> { existing }));
        SetupInvestorFind(LiveInvestor());

        var result = await _service.GrantDataRoomAccessAsync(
            "comp-1", new DataRoomAccessRequest { InvestorId = "inv-1", AccessLevel = "download", DaysValid = 30 });

        result.AccessGrants.Should().HaveCount(1);
        result.AccessGrants[0].InvestorId.Should().Be("inv-1");
        result.AccessGrants[0].AccessLevel.Should().Be("download"); // updated, not stacked
        result.AccessGrants[0].InvestorName.Should().Be("Acme Capital");
    }

    // ============================================================
    // NDA lock
    // ============================================================

    [Fact]
    public async Task NdaToggle_DisableAfterLock_Throws()
    {
        SetupCompanyFind(Company(ndaLockedAt: DateTime.UtcNow.AddDays(-1)));

        var act = async () => await _service.UpdateNdaRequirementAsync("comp-1", required: false);

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .Which.Message.Should().Contain("cannot be disabled after investors have signed");
    }

    [Fact]
    public async Task NdaToggle_DisableBeforeLock_Succeeds()
    {
        SetupCompanyFind(Company(ndaLockedAt: null));

        var act = async () => await _service.UpdateNdaRequirementAsync("comp-1", required: false);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task NdaToggle_EnableAlways_Succeeds()
    {
        SetupCompanyFind(Company(ndaLockedAt: DateTime.UtcNow.AddDays(-1)));

        // Enabling NDA is always allowed, even when locked.
        var act = async () => await _service.UpdateNdaRequirementAsync("comp-1", required: true);

        await act.Should().NotThrowAsync();
    }
}
