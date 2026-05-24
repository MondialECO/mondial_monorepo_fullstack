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
/// Phase 7 validator (Automated Readiness Review) coverage. Backend-authoritative.
///
/// Phase 7 completes only when:
///   - company.AiReview is present,
///   - OverallScore >= Phase7Requirements.ScoreThresholdForAdvance,
///   - InvestorReadyBadge == true,
///   - LastAiReviewAt is fresher than Phase7Requirements.MaxReviewAgeForAdvance.
/// </summary>
public class Phase7ValidatorTests
{
    private readonly PhaseValidator _validator;

    public Phase7ValidatorTests()
    {
        var ctx = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _validator = new PhaseValidator(ctx.Object);
    }

    private static Companies CompanyWithReview(
        int score, bool badge, DateTime? reviewedAt = null)
    {
        var when = reviewedAt ?? DateTime.UtcNow;
        return new Companies
        {
            Id = "comp-1",
            AiReview = new AiReviewResponse
            {
                OverallScore = score,
                InvestorReadyBadge = badge,
                ReviewedAt = when,
                ScoreBreakdown = new ScoreBreakdownDto { OverallScore = score },
                Recommendations = new List<RecommendationDto>(),
            },
            LastAiReviewAt = when,
        };
    }

    [Fact]
    public async Task Phase7_FreshHighScoreWithBadge_Passes()
    {
        var (isValid, errors) = await _validator.ValidatePhase7Async(CompanyWithReview(80, true));
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase7_NoReview_Fails()
    {
        var company = new Companies { Id = "comp-1" };
        var (isValid, errors) = await _validator.ValidatePhase7Async(company);
        isValid.Should().BeFalse();
        errors.Should().Contain("Automated readiness review must be completed");
    }

    [Fact]
    public async Task Phase7_LowScore_Fails()
    {
        var (isValid, errors) = await _validator.ValidatePhase7Async(CompanyWithReview(50, false));
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Review score must be at least"));
    }

    [Fact]
    public async Task Phase7_BadgeFalse_Fails()
    {
        // High enough score but engine refused the badge.
        var (isValid, errors) = await _validator.ValidatePhase7Async(CompanyWithReview(80, false));
        isValid.Should().BeFalse();
        errors.Should().Contain("Latest review did not award the investor-ready badge");
    }

    [Fact]
    public async Task Phase7_StaleReview_Fails()
    {
        var stale = DateTime.UtcNow - Phase7Requirements.MaxReviewAgeForAdvance - TimeSpan.FromDays(1);
        var (isValid, errors) = await _validator.ValidatePhase7Async(CompanyWithReview(85, true, stale));
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("stale"));
    }
}
