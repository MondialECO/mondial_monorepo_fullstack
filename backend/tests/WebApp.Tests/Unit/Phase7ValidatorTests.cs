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
        int score, bool badge, DateTime? reviewedAt = null, bool isClaimed = true)
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
            IsInvestorReady = isClaimed,
        };
    }

    [Fact]
    public async Task Phase7_FreshHighScoreWithBadge_Passes()
    {
        var (isValid, errors) = await _validator.ValidatePhase7Async(CompanyWithReview(80, true, isClaimed: true));
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase7_EligibleReview_DoesNotCompleteWithoutClaim_WhenClaimRequired()
    {
        // Eligible (score 85, badge true), but not claimed
        var (isValid, errors) = await _validator.ValidatePhase7Async(CompanyWithReview(85, true, isClaimed: false));
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("claimed/awarded"));
    }

    [Fact]
    public async Task Phase7_AdvanceRequiresCurrentInvestorReady()
    {
        var company = CompanyWithReview(85, true, isClaimed: true);
        var (isValid, errors) = await _validator.ValidatePhase7Async(company);
        isValid.Should().BeTrue();
        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeTrue();
    }

    [Fact]
    public async Task Phase7_StaleReviewInvalidatesCurrentReadiness()
    {
        var stale = DateTime.UtcNow.AddDays(-35);
        var company = CompanyWithReview(85, true, stale, isClaimed: true);
        var (isValid, errors) = await _validator.ValidatePhase7Async(company);
        isValid.Should().BeFalse();
        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void Phase7_DataRoomChangePreservesHistoricalCompletion()
    {
        var company = new Companies
        {
            Id = "comp-1",
            CurrentPhase = 8,
            CompletedPhases = new List<int> { 1, 2, 3, 4, 5, 6, 7 },
            LastAiReviewAt = DateTime.UtcNow.AddDays(-5),
            AiReview = new AiReviewResponse
            {
                OverallScore = 85,
                InvestorReadyBadge = true,
                ReviewedAt = DateTime.UtcNow.AddDays(-5),
            },
            IsInvestorReady = true,
            DataRoomLastMaterialChangeAt = DateTime.UtcNow.AddDays(-1), // changed after review
        };

        // Historical completion remains intact
        company.CompletedPhases.Should().Contain(7);
        company.CurrentPhase.Should().Be(8);
        // But current live investor readiness is false
        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void Phase7_RerunAndReclaimRestoresCurrentReadiness()
    {
        var changeTime = DateTime.UtcNow.AddHours(-5);
        var company = new Companies
        {
            Id = "comp-1",
            DataRoomLastMaterialChangeAt = changeTime,
            LastAiReviewAt = changeTime.AddHours(-1), // older than change
            AiReview = new AiReviewResponse
            {
                OverallScore = 85,
                InvestorReadyBadge = true,
                ReviewedAt = changeTime.AddHours(-1),
            },
            IsInvestorReady = true,
        };

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();

        // Simulate Re-run review
        var rerunTime = DateTime.UtcNow;
        company.LastAiReviewAt = rerunTime;
        company.AiReview.ReviewedAt = rerunTime;
        company.IsInvestorReady = true;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeTrue();
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

    [Fact]
    public async Task Phase6_UploadAfterAiReview_MarksReviewStale()
    {
        var reviewedAt = DateTime.UtcNow.AddDays(-2);
        var company = CompanyWithReview(85, true, reviewedAt);
        // Document uploaded yesterday (after review)
        company.DataRoomLastMaterialChangeAt = DateTime.UtcNow.AddDays(-1);

        var (isValid, errors) = await _validator.ValidatePhase7Async(company);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("stale"));
    }

    [Fact]
    public async Task Phase6_DeleteAfterAiReview_MarksReviewStale()
    {
        var reviewedAt = DateTime.UtcNow.AddHours(-10);
        var company = CompanyWithReview(85, true, reviewedAt);
        // Document deleted 1 hour ago
        company.DataRoomLastMaterialChangeAt = DateTime.UtcNow.AddHours(-1);

        var (isValid, errors) = await _validator.ValidatePhase7Async(company);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("stale"));
    }

    [Fact]
    public async Task Phase6_ReplaceAfterAiReview_MarksReviewStale()
    {
        var reviewedAt = DateTime.UtcNow.AddHours(-5);
        var company = CompanyWithReview(85, true, reviewedAt);
        // Document replaced 30 mins ago
        company.DataRoomLastMaterialChangeAt = DateTime.UtcNow.AddMinutes(-30);

        var (isValid, errors) = await _validator.ValidatePhase7Async(company);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("stale"));
    }

    [Fact]
    public async Task Phase7_ReviewAfterDataRoomChange_IsFreshAgain()
    {
        var changeTime = DateTime.UtcNow.AddHours(-5);
        var reviewedAt = DateTime.UtcNow.AddHours(-1); // Re-run after change
        var company = CompanyWithReview(85, true, reviewedAt);
        company.DataRoomLastMaterialChangeAt = changeTime;

        var (isValid, errors) = await _validator.ValidatePhase7Async(company);
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }
}
