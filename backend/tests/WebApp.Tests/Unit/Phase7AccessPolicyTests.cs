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
/// Phase 7 access policy — investor-ready badge gating and forgery resistance.
///
/// Covers the P0 fixes for:
///   - AwardInvestorReadyBadgeAsync must not flip IsInvestorReady without
///     a passing review on file.
///   - (Job-endpoint cross-tenant access is a controller-level concern; tested
///     indirectly via the ICompanyService.GetCompanyAsync ownership compare.)
/// </summary>
public class Phase7AccessPolicyTests
{
    private readonly Mock<MongoDbContext> _mockDb;
    private readonly Mock<IMongoCollection<Companies>> _companies;
    private readonly Mock<IMongoCollection<Phase7ReviewSnapshot>> _snapshots;
    private readonly CompanyService _service;

    public Phase7AccessPolicyTests()
    {
        _mockDb = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _companies = new Mock<IMongoCollection<Companies>>();
        _snapshots = new Mock<IMongoCollection<Phase7ReviewSnapshot>>();
        _mockDb.Setup(d => d.Companies).Returns(_companies.Object);
        _mockDb.Setup(d => d.Phase7ReviewSnapshots).Returns(_snapshots.Object);

        _service = new CompanyService(
            _mockDb.Object,
            new Mock<IValuationEngine>().Object,
            new Mock<ICapTableCalculator>().Object,
            new Mock<IInvestorMatcher>().Object,
            new Mock<IAiReviewEngine>().Object,
            new Mock<IDocumentManager>().Object,
            new Mock<IPhaseValidator>().Object);
    }

    private void SetupCompanyLookup(Companies company)
    {
        var cursor = new Mock<IAsyncCursor<Companies>>();
        cursor.Setup(c => c.Current).Returns(new[] { company });
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true).ReturnsAsync(false);
        _companies.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<FindOptions<Companies, Companies>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    [Fact]
    public async Task AwardBadge_WithoutReview_Throws()
    {
        SetupCompanyLookup(new Companies { Id = "comp-1", OwnerId = "owner-1" });

        var act = async () => await _service.AwardInvestorReadyBadgeAsync("comp-1");

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .Which.Message.Should().Contain("no automated review");
    }

    [Fact]
    public async Task AwardBadge_LowScore_Throws()
    {
        SetupCompanyLookup(new Companies
        {
            Id = "comp-1",
            OwnerId = "owner-1",
            AiReview = new AiReviewResponse
            {
                OverallScore = 55,
                InvestorReadyBadge = false,
            },
        });

        var act = async () => await _service.AwardInvestorReadyBadgeAsync("comp-1");

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .Which.Message.Should().Contain("below");
    }

    [Fact]
    public async Task AwardBadge_BadgeFlagFalse_Throws()
    {
        // Score is high enough, but engine refused the badge.
        SetupCompanyLookup(new Companies
        {
            Id = "comp-1",
            OwnerId = "owner-1",
            AiReview = new AiReviewResponse
            {
                OverallScore = 90,
                InvestorReadyBadge = false,
            },
        });

        var act = async () => await _service.AwardInvestorReadyBadgeAsync("comp-1");

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .Which.Message.Should().Contain("did not award InvestorReadyBadge");
    }

    [Fact]
    public async Task AwardBadge_FreshValidReview_DoesNotThrow()
    {
        var fresh = DateTime.UtcNow;
        SetupCompanyLookup(new Companies
        {
            Id = "comp-1",
            OwnerId = "owner-1",
            LastAiReviewAt = fresh,
            AiReview = new AiReviewResponse
            {
                OverallScore = 85,
                InvestorReadyBadge = true,
                ReviewedAt = fresh,
            },
        });
        _companies.Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<Companies>(),
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

        var act = async () => await _service.AwardInvestorReadyBadgeAsync("comp-1");

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task AwardBadge_StalePassingReview_Throws()
    {
        // Score and badge flag would otherwise pass, but the review snapshot is
        // older than Phase7Requirements.MaxReviewAgeForAdvance.
        var stale = DateTime.UtcNow - Phase7Requirements.MaxReviewAgeForAdvance - TimeSpan.FromDays(1);
        SetupCompanyLookup(new Companies
        {
            Id = "comp-1",
            OwnerId = "owner-1",
            LastAiReviewAt = stale,
            AiReview = new AiReviewResponse
            {
                OverallScore = 90,
                InvestorReadyBadge = true,
                ReviewedAt = stale,
            },
        });

        var act = async () => await _service.AwardInvestorReadyBadgeAsync("comp-1");

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .Which.Message.Should().Contain("stale");
    }
}
