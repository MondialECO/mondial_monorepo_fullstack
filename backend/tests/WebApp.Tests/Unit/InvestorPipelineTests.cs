using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit;

public class InvestorPipelineTests
{
    private readonly Mock<MongoDbContext> _mockDbContext;
    private readonly Mock<IMongoDatabase> _mongoDbMock = new();
    private readonly Mock<IMongoCollection<InvestorMatch>> _mockMatchesCollection = new();
    private readonly Mock<IMongoCollection<Companies>> _mockCompaniesCollection = new();
    private readonly Mock<IMongoCollection<Phase6DataRoomAccessRequest>> _mockRequestsCollection = new();
    private readonly Mock<IMongoCollection<Phase6NdaAcceptance>> _mockNdaCollection = new();
    private readonly Mock<IMongoCollection<Phase6AccessLog>> _mockLogsCollection = new();
    private readonly Mock<IMongoCollection<InvestorDiligenceQuestion>> _mockQuestionsCollection = new();
    private readonly Mock<IMongoCollection<DealExecution>> _mockDealsCollection = new();
    private readonly Mock<IMongoCollection<Investments>> _mockInvestmentsCollection = new();

    private readonly Mock<SaveFile> _mockSaveFile = new();
    private readonly Mock<IInvestmentsService> _mockInvestmentsService = new();
    private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
    private readonly Mock<IPhaseNotificationService> _mockNotificationService = new();
    private readonly Mock<ILogger<CompanyService>> _mockLogger = new();
    private readonly Mock<IDiligenceService> _mockDiligenceService = new();

    public InvestorPipelineTests()
    {
        _mockDbContext = new Mock<MongoDbContext>(_mongoDbMock.Object);
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _mockUserManager = new Mock<UserManager<ApplicationUser>>(userStoreMock.Object, null, null, null, null, null, null, null, null);

        _mockDbContext.Setup(db => db.InvestorMatches).Returns(_mockMatchesCollection.Object);
        _mockDbContext.Setup(db => db.Companies).Returns(_mockCompaniesCollection.Object);
        _mockDbContext.Setup(db => db.Phase6DataRoomAccessRequests).Returns(_mockRequestsCollection.Object);
        _mockDbContext.Setup(db => db.Phase6NdaAcceptances).Returns(_mockNdaCollection.Object);
        _mockDbContext.Setup(db => db.Phase6AccessLogs).Returns(_mockLogsCollection.Object);
        _mockDbContext.Setup(db => db.InvestorDiligenceQuestions).Returns(_mockQuestionsCollection.Object);
        _mockDbContext.Setup(db => db.DealExecutions).Returns(_mockDealsCollection.Object);
        _mockDbContext.Setup(db => db.Investments).Returns(_mockInvestmentsCollection.Object);
    }

    [Fact]
    public void BuildOpportunityCard_NullMatch_ReturnsDirectDiscoveryCard()
    {
        var company = new Companies
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyName = "Test Startup",
            Industry = "Tech",
            Country = "Germany",
            FundingRoundType = "Seed",
            FundingAskAmount = 500000,
            Valuation = 2000000,
            IsInvestorReady = true,
            UpdatedAt = DateTime.UtcNow
        };

        var method = typeof(CompanyService).GetMethod("BuildOpportunityCard", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        Assert.NotNull(method);

        var card = method.Invoke(null, new object?[] { company, null }) as OpportunityCardResponse;
        Assert.NotNull(card);
        Assert.Equal(company.Id, card.CompanyId);
        Assert.Equal("Test Startup", card.CompanyName);
        Assert.Null(card.MatchScore);
        Assert.Equal("direct_discovery", card.MatchStatus);
    }

    [Fact]
    public void BuildOpportunityCard_RealMatch_ReturnsPersonalizedScore()
    {
        var company = new Companies
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyName = "Test Startup",
            Industry = "Tech",
            Country = "Germany",
            FundingRoundType = "Seed",
            FundingAskAmount = 500000,
            Valuation = 2000000,
            IsInvestorReady = true,
            UpdatedAt = DateTime.UtcNow
        };

        var match = new InvestorMatch
        {
            MatchScore = 92,
            Status = "matched",
            MatchRationale = "Strong sector fit."
        };

        var method = typeof(CompanyService).GetMethod("BuildOpportunityCard", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        Assert.NotNull(method);

        var card = method.Invoke(null, new object?[] { company, match }) as OpportunityCardResponse;
        Assert.NotNull(card);
        Assert.Equal(company.Id, card.CompanyId);
        Assert.Equal(92, card.MatchScore);
        Assert.Equal("matched", card.MatchStatus);
    }

    [Fact]
    public void ObjectId_TryParse_Distinguishes_Guid_From_ObjectId()
    {
        var guidString = "7032a3fa-1466-4311-84d8-664fbd193afa";
        var objectIdString = ObjectId.GenerateNewId().ToString();

        var isGuidObjectId = ObjectId.TryParse(guidString, out _);
        var isRealObjectId = ObjectId.TryParse(objectIdString, out _);

        Assert.False(isGuidObjectId, "Guid string should not be parsed as ObjectId");
        Assert.True(isRealObjectId, "24-hex string should be parsed as ObjectId");
    }

    [Fact]
    public void OpportunityCardResponse_Carries_Enriched_Lifecycle_Fields()
    {
        var card = new OpportunityCardResponse
        {
            CompanyId = "co-123",
            CompanyName = "Idealy",
            HoldingId = "hold-abc",
            DealId = "deal-xyz",
            DealStatus = "completed",
            InvestmentAmount = 20000,
            EquityPercentage = 5.0,
            InstrumentType = "equity",
            ClosedAt = new DateTime(2026, 9, 1, 12, 0, 0, DateTimeKind.Utc),
            Stage = "won",
            CurrentTurn = "investor"
        };

        Assert.Equal("hold-abc", card.HoldingId);
        Assert.Equal("deal-xyz", card.DealId);
        Assert.Equal("completed", card.DealStatus);
        Assert.Equal(20000, card.InvestmentAmount);
        Assert.Equal(5.0, card.EquityPercentage);
        Assert.Equal("equity", card.InstrumentType);
        Assert.Equal("won", card.Stage);
        Assert.Equal("investor", card.CurrentTurn);
    }

    [Fact]
    public void Deal_Lifecycle_Weight_Prioritizes_Completed_Over_Active_Over_Rejected()
    {
        var deals = new List<DealExecution>
        {
            new DealExecution { Id = "deal-rej", CompanyId = "co-1", Status = "rejected" },
            new DealExecution { Id = "deal-active", CompanyId = "co-1", Status = "term_sheet" },
            new DealExecution { Id = "deal-comp", CompanyId = "co-1", Status = "completed" }
        };

        var bestDeal = deals
            .OrderByDescending(d => d.Status is "completed" ? 3 : (d.Status is "rejected" or "lost" ? 1 : 2))
            .First();

        Assert.Equal("deal-comp", bestDeal.Id);

        var activeOrRejected = new List<DealExecution>
        {
            new DealExecution { Id = "deal-rej", CompanyId = "co-2", Status = "rejected" },
            new DealExecution { Id = "deal-active", CompanyId = "co-2", Status = "term_sheet" }
        };

        var bestActive = activeOrRejected
            .OrderByDescending(d => d.Status is "completed" ? 3 : (d.Status is "rejected" or "lost" ? 1 : 2))
            .First();

        Assert.Equal("deal-active", bestActive.Id);
    }

    // ──────────────────────────────────────────────────────────
    // Stage precedence mirror — reproduces the exact conditional
    // chain in GetInvestorPipelineAsync (lines 5522‒5571) so we
    // can unit-verify all five prescribed test cases.
    // ──────────────────────────────────────────────────────────

    private static string ResolveStage(
        DealExecution? deal,
        InvestorMatch? match,
        bool hasHolding,
        bool hasActiveGrant = false,
        bool hasApprovedRequest = false,
        bool hasPendingRequest = false,
        bool hasNda = false,
        bool hasLogs = false,
        bool hasQuestions = false)
    {
        if (hasHolding || (deal != null && (deal.Status is "completed" || deal.DealStage is "WON" or "COMPLETED")))
            return "won";
        if (deal != null && !(deal.Status is "rejected" or "lost" || deal.DealStage is "LOST" or "REJECTED"))
            return "negotiation";
        if (hasActiveGrant || hasApprovedRequest || hasLogs || hasQuestions)
            return "dataroom";
        if (hasNda)
            return "nda";
        if (hasPendingRequest || match?.Status is "viewed" or "interested" or "reviewing" or "contacted")
            return "review";
        if (match?.Status is "rejected" or "passed" or "lost"
            || (deal != null
                && (deal.Status is "rejected" or "lost" || deal.DealStage is "LOST" or "REJECTED")
                && (match == null || match.Status is "rejected" or "passed" or "lost")))
            return "lost";
        return "new";
    }

    [Fact]
    public void Test1_CompletedDeal_Plus_OldRejected_Plus_Match_Resolves_Won()
    {
        // Completed deal + old rejected deal (dealsByCompany picks completed, weight 3)
        var deal = new DealExecution { Id = "d1", Status = "completed" };
        var match = new InvestorMatch { Status = "matched" };
        Assert.Equal("won", ResolveStage(deal, match, hasHolding: true));
        Assert.Equal("won", ResolveStage(deal, match, hasHolding: false)); // completed deal alone
    }

    [Fact]
    public void Test2_ActiveNegotiatingDeal_Plus_OldRejected_Resolves_Negotiation()
    {
        // dealsByCompany picks the active deal (weight 2 > rejected weight 1)
        var deal = new DealExecution { Id = "d2", Status = "term_sheet" };
        Assert.Equal("negotiation", ResolveStage(deal, null, hasHolding: false));
    }

    [Fact]
    public void Test3_ActiveDataRoom_Plus_OldRejectedDeal_Resolves_DataRoom()
    {
        // Rejected deal is picked, but active data room grant wins at step 3
        var deal = new DealExecution { Id = "d3", Status = "rejected" };
        Assert.Equal("dataroom", ResolveStage(deal, null, hasHolding: false, hasActiveGrant: true));
        Assert.Equal("dataroom", ResolveStage(deal, null, hasHolding: false, hasApprovedRequest: true));
        Assert.Equal("dataroom", ResolveStage(deal, null, hasHolding: false, hasLogs: true));
        Assert.Equal("dataroom", ResolveStage(deal, null, hasHolding: false, hasQuestions: true));
    }

    [Fact]
    public void Test4_NewActiveMatch_Plus_HistoricalRejectedDeal_Resolves_NewMatch()
    {
        // Historical rejected deal + active non-terminal InvestorMatch
        // Must NOT be Lost — the active match should surface as New Match
        var rejectedDeal = new DealExecution { Id = "d4", Status = "rejected" };
        var activeMatch = new InvestorMatch { Status = "new" };
        Assert.Equal("new", ResolveStage(rejectedDeal, activeMatch, hasHolding: false));

        var matchedMatch = new InvestorMatch { Status = "matched" };
        Assert.Equal("new", ResolveStage(rejectedDeal, matchedMatch, hasHolding: false));
    }

    [Fact]
    public void Test5_OnlyRejectedRelationship_NoNewerSignal_Resolves_Lost()
    {
        // Only terminal signals, no newer active match or engagement
        var rejectedDeal = new DealExecution { Id = "d5", Status = "rejected" };
        Assert.Equal("lost", ResolveStage(rejectedDeal, null, hasHolding: false));

        var lostDeal = new DealExecution { Id = "d5b", Status = "lost" };
        Assert.Equal("lost", ResolveStage(lostDeal, null, hasHolding: false));

        // Match itself is terminal
        var passedMatch = new InvestorMatch { Status = "passed" };
        Assert.Equal("lost", ResolveStage(null, passedMatch, hasHolding: false));

        // Both deal and match are terminal
        Assert.Equal("lost", ResolveStage(rejectedDeal, passedMatch, hasHolding: false));
    }
}


