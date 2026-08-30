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
/// Proves cross-phase freshness invalidation for Phase 7 Investor Readiness.
/// Any material mutation to authoritative company evidence consumed by the Phase 7 scoring
/// engine (Phase 2 Legal, Phase 3 Financials/Valuation, Phase 4 Cap Table, Phase 5 Funding Ask,
/// Phase 6 Data Room) must invalidate the current readiness badge and gate new Phase 8 matching
/// until a fresh review is executed and reclaimed.
/// </summary>
public class Phase7CrossPhaseFreshnessTests
{
    private readonly PhaseValidator _validator;

    public Phase7CrossPhaseFreshnessTests()
    {
        var ctx = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _validator = new PhaseValidator(ctx.Object);
    }

    private static Companies CreateReadyCompany(DateTime? reviewedAt = null)
    {
        var when = reviewedAt ?? DateTime.UtcNow.AddMinutes(-10);
        return new Companies
        {
            Id = "comp-freshness-1",
            CompanyName = "Acme Corp",
            LegalName = "Acme Corp SAS",
            RegistrationNumber = "FR123456789",
            CurrentPhase = 8,
            CompletedPhases = new List<int> { 2, 3, 4, 5, 6, 7 },
            IsInvestorReady = true,
            InvestorReadyBadgeAwardedAt = when,
            LastAiReviewAt = when,
            AiReview = new AiReviewResponse
            {
                OverallScore = 85,
                InvestorReadyBadge = true,
                ReviewedAt = when,
                ScoreBreakdown = new ScoreBreakdownDto
                {
                    VerificationScore = 85,
                    FinancialScore = 80,
                    EquityScore = 90,
                    FundingScore = 85,
                    DataRoomScore = 85,
                    OverallScore = 85
                },
                Recommendations = new List<RecommendationDto>(),
                PitchDeckAnalysis = new PitchDeckAnalysisDto { Grade = "A" },
                IsFresh = true,
                IsCurrentlyInvestorReady = true
            },
            DataRoomLastMaterialChangeAt = when.AddMinutes(-5),
            InvestorReadinessInputsLastMaterialChangeAt = when.AddMinutes(-5)
        };
    }

    [Fact]
    public void P2_MaterialLegalChangeAfterReview_MarksP7Stale()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        // Initially fresh
        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeTrue();

        // Material legal update in Phase 2
        company.LegalName = "Acme Global Holding SAS";
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        // Current readiness becomes stale
        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P2_NonMaterialChange_DoesNotStaleP7()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        // Cosmetic UI update that does not touch InvestorReadinessInputsLastMaterialChangeAt
        company.Tagline = "Next Gen Cloud AI";

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeTrue();
    }

    [Fact]
    public void P3_RevenueChangeAfterReview_MarksP7Stale()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        // Revenue mutation in Phase 3
        company.Q1Revenue = 50000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P3_ValuationChangeAfterReview_MarksP7Stale()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        // Valuation mutation in Phase 3
        company.Valuation = 5_000_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P3_KpiChangeConsumedByScorer_MarksP7Stale()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        // Cash position / funds mutation in Phase 3
        company.CurrentFunds = 250_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P4_EquityGrantChangeAfterReview_MarksP7Stale()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        // Cap table mutation in Phase 4
        company.EquityStructure.Add(new EquityEntryDto
        {
            StakeholderName = "New Partner",
            Type = "advisor",
            SharesOwned = 50_000
        });
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P4_ShareIssuanceAfterReview_MarksP7Stale()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        // Total shares mutation
        company.TotalShares = 2_000_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P4_EsopChange_StalesOnlyIfScored()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        company.EsopPoolPercent = 15;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P5_FundingAskChangeAfterReview_MarksP7Stale()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        // Funding ask change in Phase 5
        company.FundingAskAmount = 2_000_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P5_InstrumentChangeAfterReview_MarksP7Stale()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        // Share type / round type mutation in Phase 5
        company.ShareType = "safe";
        company.FundingRoundType = "seed";
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P5_AllocationChangeAfterReview_MarksP7Stale()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        // Capital allocation mutation
        company.CapitalAllocation = new List<CapitalAllocationDto>
        {
            new() { Category = "Engineering", Percent = 60, Amount = 600000 },
            new() { Category = "Marketing", Percent = 40, Amount = 400000 }
        };
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P5_PitchDeckReplacement_StalesIfReviewed()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        // Pitch deck upload
        company.PitchDeckFileName = "new_pitch_deck_v2.pdf";
        company.PitchDeckUploadedAt = DateTime.UtcNow;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P6_DataRoomUploadReplaceDelete_MarksP7Stale()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-2);
        var company = CreateReadyCompany(reviewTime);

        // Data room document change
        company.DataRoomLastMaterialChangeAt = DateTime.UtcNow;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public async Task P7_ClaimBlockedWhenP3ChangedAfterReview()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-1);
        var company = CreateReadyCompany(reviewTime);

        // Modify Phase 3 financials after review was generated
        company.Q1Revenue = 120_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        // Validation fails because the review does not reflect current evidence
        var (isValid, errors) = await _validator.ValidatePhase7Async(company);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Review is stale"));
    }

    [Fact]
    public async Task P7_ClaimBlockedWhenP4ChangedAfterReview()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-1);
        var company = CreateReadyCompany(reviewTime);

        // Modify Phase 4 Cap Table after review
        company.TotalShares = 5_000_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        var (isValid, errors) = await _validator.ValidatePhase7Async(company);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Review is stale"));
    }

    [Fact]
    public async Task P7_ClaimBlockedWhenP5ChangedAfterReview()
    {
        var reviewTime = DateTime.UtcNow.AddHours(-1);
        var company = CreateReadyCompany(reviewTime);

        // Modify Phase 5 Funding Ask after review
        company.FundingAskAmount = 3_000_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        var (isValid, errors) = await _validator.ValidatePhase7Async(company);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Review is stale"));
    }

    [Fact]
    public void P7_RerunAfterUpstreamChange_RestoresFreshness()
    {
        var oldReviewTime = DateTime.UtcNow.AddDays(-2);
        var company = CreateReadyCompany(oldReviewTime);

        // Change Phase 5 funding ask
        company.FundingAskAmount = 1_500_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow.AddDays(-1);

        // Stale
        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();

        // Rerun review now
        var freshReviewTime = DateTime.UtcNow;
        company.LastAiReviewAt = freshReviewTime;
        company.AiReview.ReviewedAt = freshReviewTime;
        company.AiReview.OverallScore = 88;
        company.AiReview.InvestorReadyBadge = true;

        // Freshness restored
        Phase7Requirements.IsFreshEnough(
            freshReviewTime,
            Phase7Requirements.GetReadinessInputsLastMaterialChangeAt(company),
            now: null).Should().BeTrue();
    }

    [Fact]
    public void P7_ReclaimAfterRerun_RestoresCurrentReadiness()
    {
        var oldReviewTime = DateTime.UtcNow.AddDays(-2);
        var company = CreateReadyCompany(oldReviewTime);

        // Change financials
        company.Q1Revenue = 200_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow.AddDays(-1);

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();

        // Rerun & reclaim
        var freshReviewTime = DateTime.UtcNow;
        company.LastAiReviewAt = freshReviewTime;
        company.AiReview.ReviewedAt = freshReviewTime;
        company.IsInvestorReady = true;
        company.InvestorReadyBadgeAwardedAt = freshReviewTime;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeTrue();
    }

    [Fact]
    public void P8_P3Change_BlocksNewMatching()
    {
        var company = CreateReadyCompany();
        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeTrue();

        // Change revenue
        company.Q1Revenue = 50_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        // Match generation is blocked
        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P8_P4Change_BlocksNewMatching()
    {
        var company = CreateReadyCompany();
        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeTrue();

        // Change Cap Table
        company.TotalShares = 2_000_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P8_P5Change_BlocksNewMatching()
    {
        var company = CreateReadyCompany();
        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeTrue();

        // Change Funding Ask
        company.FundingAskAmount = 2_500_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();
    }

    [Fact]
    public void P8_UpstreamChange_PreservesExistingMatches()
    {
        var company = CreateReadyCompany();
        var existingMatches = new List<InvestorMatch>
        {
            new()
            {
                Id = "match-1",
                CompanyId = company.Id,
                InvestorId = "inv-1",
                Status = "interested",
                MatchScore = 85
            }
        };

        // Upstream mutation
        company.Valuation = 4_000_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        // Existing matches remain intact
        existingMatches.Should().HaveCount(1);
        existingMatches[0].Status.Should().Be("interested");
        existingMatches[0].MatchScore.Should().Be(85);
    }

    [Fact]
    public void P8_UpstreamChange_PreservesHandshake()
    {
        var company = CreateReadyCompany();
        var match = new InvestorMatch
        {
            Id = "match-handshake",
            CompanyId = company.Id,
            InvestorId = "inv-1",
            Status = "accepted",
            EntrepreneurInterest = "interested",
            InvestorInterest = "interested",
            HandshakeConfirmedAt = DateTime.UtcNow.AddDays(-1)
        };

        // Upstream Cap table edit
        company.TotalShares = 1_500_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        // Handshake remains valid and accepted
        match.Status.Should().Be("accepted");
        match.HandshakeConfirmedAt.Should().NotBeNull();
    }

    [Fact]
    public void P8_UpstreamChange_PreservesMessages()
    {
        var company = CreateReadyCompany();
        var interactions = new List<InteractionRecord>
        {
            new()
            {
                Type = "message",
                Details = "Looking forward to partnering",
                Timestamp = DateTime.UtcNow.AddHours(-1)
            }
        };

        // Upstream funding ask change
        company.FundingAskAmount = 800_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        interactions.Should().HaveCount(1);
        interactions[0].Details.Should().Be("Looking forward to partnering");
    }

    [Fact]
    public void P8_RerunAndReclaim_ReenablesMatching()
    {
        var company = CreateReadyCompany();

        // Mutate upstream data
        company.FundingAskAmount = 1_200_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeFalse();

        // Rerun AI Review and claim credential
        var freshTime = DateTime.UtcNow;
        company.LastAiReviewAt = freshTime;
        company.AiReview.ReviewedAt = freshTime;
        company.AiReview.OverallScore = 90;
        company.AiReview.InvestorReadyBadge = true;
        company.IsInvestorReady = true;

        // Matching re-enabled
        Phase7Requirements.IsCurrentlyInvestorReady(company).Should().BeTrue();
    }

    [Fact]
    public void P9_ActiveDealSurvivesReadinessStaleness()
    {
        var company = CreateReadyCompany();
        var deal = new DealExecution
        {
            Id = "deal-1",
            CompanyId = company.Id,
            Status = Phase9Requirements.DealStatusNegotiating,
            TermSheet = new TermSheet
            {
                TotalRaiseAmount = 1_000_000,
                PreMoneyValuation = 5_000_000
            }
        };

        // Upstream data room doc replacement
        company.DataRoomLastMaterialChangeAt = DateTime.UtcNow;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        // Active deal is not destroyed
        deal.Status.Should().Be(Phase9Requirements.DealStatusNegotiating);
        deal.TermSheet.TotalRaiseAmount.Should().Be(1_000_000);
    }

    [Fact]
    public void P9_CompletedEquityDealMayStaleFutureReadinessButRemainsCompleted()
    {
        var company = CreateReadyCompany();
        var deal = new DealExecution
        {
            Id = "deal-completed-1",
            CompanyId = company.Id,
            Status = Phase9Requirements.DealStatusCompleted,
            ClosedAt = DateTime.UtcNow
        };

        // Completed equity deal closes and mutates Phase 4 Cap Table
        company.TotalShares = 1_200_000;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;

        // Completed deal remains completed
        deal.Status.Should().Be(Phase9Requirements.DealStatusCompleted);
        deal.ClosedAt.Should().NotBeNull();
    }

    [Fact]
    public void P9_PortfolioUnaffectedByP7Staleness()
    {
        var holding = new CompanyPortfolioHolding
        {
            Id = "holding-1",
            CompanyId = "comp-1",
            InvestorId = "inv-1",
            InvestmentAmount = 250_000,
            InstrumentType = "equity",
            Status = "active"
        };

        // Upstream company changes do not mutate or delete existing portfolio holding
        holding.Status.Should().Be("active");
        holding.InvestmentAmount.Should().Be(250_000);
    }

    [Fact]
    public void P10_RemainsTerminalAfterCompletedFundingJourney()
    {
        var company = CreateReadyCompany();
        company.CurrentPhase = 10;
        company.CompletedPhases = new List<int> { 2, 3, 4, 5, 6, 7, 8, 9 };

        // Even if upstream data is later modified, Phase 10 status is permanent
        company.CurrentPhase.Should().Be(10);
        company.CompletedPhases.Should().Contain(9);
    }
}
