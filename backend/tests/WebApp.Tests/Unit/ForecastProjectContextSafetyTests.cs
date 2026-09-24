using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using Moq;
using WebApp.Configuration.AiOptions;
using WebApp.Controllers;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Audit;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

public class ForecastProjectContextSafetyTests
{
    private const string UserId = "user-123";
    private const string ForeignUserId = "user-foreign";
    private const string IdeaAId = "507f1f77bcf86cd799439011";
    private const string IdeaBId = "507f1f77bcf86cd799439022";
    private const string ForeignIdeaId = "507f1f77bcf86cd799439033";

    private readonly Mock<IForecastSessionStore> _sessionStore = new();
    private readonly Mock<IBusinessPlanSessionStore> _planStore = new();
    private readonly Mock<ICreatorIdeaStore> _creatorIdeas = new();
    private readonly Mock<IAiJobService> _jobs = new();
    private readonly Mock<IAiCreditService> _credits = new();
    private readonly Mock<IAuditLogger> _audit = new();
    private readonly Mock<IBusinessModelSessionStore> _businessModels = new();
    private readonly Mock<IMarketStudySessionStore> _marketStudies = new();

    private readonly CreatorIdea _ideaA = new()
    {
        Id = IdeaAId,
        UserId = UserId,
        Project = new CreatorJourneyProject { Name = "Idea A Venture", Sector = "Technology" },
        Phase3Data = new CreatorPhase3Data()
    };

    private readonly CreatorIdea _ideaB = new()
    {
        Id = IdeaBId,
        UserId = UserId,
        Project = new CreatorJourneyProject { Name = "Idea B Venture", Sector = "E-Commerce" },
        Phase3Data = new CreatorPhase3Data()
    };

    private readonly AiSettings _settings = new()
    {
        Enabled = true,
        Features = new AiFeatureFlags { Forecast = true },
        CreditCosts = new Dictionary<string, int> { ["Forecast"] = 32 }
    };

    private ForecastController CreateController(IFinancialAssumptionsService? assumptionsService = null, string currentUserId = UserId)
    {
        var controller = new ForecastController(
            _sessionStore.Object,
            _planStore.Object,
            _creatorIdeas.Object,
            _jobs.Object,
            _credits.Object,
            _audit.Object,
            Options.Create(_settings),
            NullLogger<ForecastController>.Instance,
            _businessModels.Object,
            _marketStudies.Object,
            assumptionsService);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, currentUserId) }))
            }
        };

        return controller;
    }

    [Fact]
    public async Task GetAssumptions_MissingIdeaId_ReturnsBadRequest400()
    {
        _creatorIdeas.Setup(x => x.ListByUserAsync(UserId)).ReturnsAsync(new List<CreatorIdea> { _ideaA });
        var controller = CreateController();

        var resultNull = await controller.GetAssumptions(null);
        var resultEmpty = await controller.GetAssumptions("");
        var resultWhitespace = await controller.GetAssumptions("   ");

        resultNull.Should().BeOfType<BadRequestObjectResult>();
        resultEmpty.Should().BeOfType<BadRequestObjectResult>();
        resultWhitespace.Should().BeOfType<BadRequestObjectResult>();

        // Proves that missing ideaId NEVER silently falls back to ListByUserAsync / FirstOrDefault
        _creatorIdeas.Verify(x => x.ListByUserAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAssumptions_MissingIdeaId_ReturnsBadRequest400()
    {
        _creatorIdeas.Setup(x => x.ListByUserAsync(UserId)).ReturnsAsync(new List<CreatorIdea> { _ideaA });
        var controller = CreateController();

        var dto = new UpdateFinancialAssumptionsDto { StartingBudget = 25000 };
        var result = await controller.UpdateAssumptions(dto, null);

        result.Should().BeOfType<BadRequestObjectResult>();
        _creatorIdeas.Verify(x => x.ListByUserAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Start_MissingIdeaId_ReturnsBadRequest400()
    {
        var controller = CreateController();

        var request = new StartForecastRequest
        {
            BusinessIdeaId = null,
            BusinessPlanSessionId = null
        };
        var result = await controller.Start(request);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Regenerate_MissingIdeaId_ReturnsBadRequest400()
    {
        var controller = CreateController();

        var result = await controller.RegenerateByIdea(null);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetBudgetSuggestion_MissingIdeaId_ReturnsBadRequest400_AndNeverFallsBackToFirstIdea()
    {
        _creatorIdeas.Setup(x => x.ListByUserAsync(UserId)).ReturnsAsync(new List<CreatorIdea> { _ideaA, _ideaB });
        var controller = CreateController();

        var result = await controller.GetBudgetSuggestion(null);

        result.Should().BeOfType<BadRequestObjectResult>();
        _creatorIdeas.Verify(x => x.ListByUserAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task ForeignIdeaId_CannotAccessForecast_ReturnsNotFound404()
    {
        _creatorIdeas.Setup(x => x.GetOwnedAsync(ForeignIdeaId, UserId))
            .ReturnsAsync((CreatorIdea?)null);

        var controller = CreateController();

        var assumptionsResult = await controller.GetAssumptions(ForeignIdeaId);
        var budgetResult = await controller.GetBudgetSuggestion(ForeignIdeaId);
        var startResult = await controller.Start(new StartForecastRequest { BusinessIdeaId = ForeignIdeaId, MonthlyChurnPct = 5 });

        assumptionsResult.Should().BeOfType<NotFoundObjectResult>();
        budgetResult.Should().BeOfType<NotFoundObjectResult>();
        startResult.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task MultiProject_IdeaA_And_IdeaB_NeverCrossLeak()
    {
        _creatorIdeas.Setup(x => x.GetOwnedAsync(IdeaAId, UserId)).ReturnsAsync(_ideaA);
        _creatorIdeas.Setup(x => x.GetOwnedAsync(IdeaBId, UserId)).ReturnsAsync(_ideaB);

        var sessionStore = new Mock<IForecastSessionStore>();
        var assumptionsService = new FinancialAssumptionsService(
            sessionStore.Object,
            _creatorIdeas.Object,
            _marketStudies.Object,
            _businessModels.Object,
            NullLogger<FinancialAssumptionsService>.Instance);

        var sessionA = new ForecastSession
        {
            Id = "session-a",
            BusinessIdeaId = IdeaAId,
            OwnerUserId = UserId,
            Inputs = new ForecastInputs { StartingBudget = 100000, Arpu = 500 }
        };
        var sessionB = new ForecastSession
        {
            Id = "session-b",
            BusinessIdeaId = IdeaBId,
            OwnerUserId = UserId,
            Inputs = new ForecastInputs { StartingBudget = 20000, Arpu = 29 }
        };

        sessionStore.Setup(s => s.GetByIdeaAsync(IdeaAId, UserId)).ReturnsAsync(sessionA);
        sessionStore.Setup(s => s.GetByIdeaAsync(IdeaBId, UserId)).ReturnsAsync(sessionB);

        var controller = CreateController(assumptionsService);

        var resA = await controller.GetAssumptions(IdeaAId) as OkObjectResult;
        var resB = await controller.GetAssumptions(IdeaBId) as OkObjectResult;

        resA.Should().NotBeNull();
        resB.Should().NotBeNull();

        var jsonA = System.Text.Json.JsonSerializer.Serialize(resA!.Value);
        var docA = System.Text.Json.JsonDocument.Parse(jsonA);
        var dataA = docA.RootElement.TryGetProperty("data", out var dA) ? dA : docA.RootElement.GetProperty("Data");
        var inputsA = dataA.TryGetProperty("inputs", out var inA) ? inA : dataA.GetProperty("Inputs");
        var sessionAId = dataA.TryGetProperty("sessionId", out var sA) ? sA.GetString() : dataA.GetProperty("SessionId").GetString();
        var budgetA = inputsA.TryGetProperty("startingBudget", out var bA) ? bA.GetDouble() : inputsA.GetProperty("StartingBudget").GetDouble();
        sessionAId.Should().Be("session-a");
        budgetA.Should().Be(100000);

        var jsonB = System.Text.Json.JsonSerializer.Serialize(resB!.Value);
        var docB = System.Text.Json.JsonDocument.Parse(jsonB);
        var dataB = docB.RootElement.TryGetProperty("data", out var dB) ? dB : docB.RootElement.GetProperty("Data");
        var inputsB = dataB.TryGetProperty("inputs", out var inB) ? inB : dataB.GetProperty("Inputs");
        var sessionBId = dataB.TryGetProperty("sessionId", out var sB) ? sB.GetString() : dataB.GetProperty("SessionId").GetString();
        var budgetB = inputsB.TryGetProperty("startingBudget", out var bB) ? bB.GetDouble() : inputsB.GetProperty("StartingBudget").GetDouble();
        sessionBId.Should().Be("session-b");
        budgetB.Should().Be(20000);
    }

    [Fact]
    public async Task VersionGuard_MarketStudyVersion_V2CannotOverwriteV3_IsMonotonic()
    {
        var sessionStore = new Mock<IForecastSessionStore>();
        var assumptionsService = new FinancialAssumptionsService(
            sessionStore.Object,
            _creatorIdeas.Object,
            _marketStudies.Object,
            _businessModels.Object,
            NullLogger<FinancialAssumptionsService>.Instance);

        var session = new ForecastSession
        {
            Id = "session-test",
            BusinessIdeaId = IdeaAId,
            OwnerUserId = UserId,
            Inputs = new ForecastInputs
            {
                MarketStudyVersion = 3,
                Tam = 5000000,
                Provenance = new Dictionary<string, string> { ["tam"] = "upstream_market" }
            }
        };

        sessionStore.Setup(s => s.GetByIdeaAsync(IdeaAId, UserId)).ReturnsAsync(session);

        var staleContentV2 = new BsonDocument
        {
            ["marketSizing"] = new BsonDocument
            {
                ["tam"] = new BsonDocument { ["value"] = 2000000 }
            }
        };

        // 13. Stale v2 arrives after v3
        var resStale = await assumptionsService.UpdateFromMarketStudyAsync(IdeaAId, UserId, staleContentV2, marketStudyVersion: 2);
        resStale.Inputs!.MarketStudyVersion.Should().Be(3);
        resStale.Inputs.Tam.Should().Be(5000000); // untouched

        // 14. Repeated v3 is idempotent
        var contentV3 = new BsonDocument
        {
            ["marketSizing"] = new BsonDocument
            {
                ["tam"] = new BsonDocument { ["value"] = 5000000 }
            }
        };
        var resIdempotent = await assumptionsService.UpdateFromMarketStudyAsync(IdeaAId, UserId, contentV3, marketStudyVersion: 3);
        resIdempotent.Inputs!.MarketStudyVersion.Should().Be(3);
        resIdempotent.Inputs.Tam.Should().Be(5000000);

        // 15. Newer v4 successfully updates
        var contentV4 = new BsonDocument
        {
            ["marketSizing"] = new BsonDocument
            {
                ["tam"] = new BsonDocument { ["value"] = 9000000 }
            }
        };
        var resV4 = await assumptionsService.UpdateFromMarketStudyAsync(IdeaAId, UserId, contentV4, marketStudyVersion: 4);
        resV4.Inputs!.MarketStudyVersion.Should().Be(4);
        resV4.Inputs.Tam.Should().Be(9000000);
    }

    [Fact]
    public async Task VersionGuard_FounderEditedAssumptions_SurviveV4UpstreamUpdate()
    {
        var sessionStore = new Mock<IForecastSessionStore>();
        var assumptionsService = new FinancialAssumptionsService(
            sessionStore.Object,
            _creatorIdeas.Object,
            _marketStudies.Object,
            _businessModels.Object,
            NullLogger<FinancialAssumptionsService>.Instance);

        var session = new ForecastSession
        {
            Id = "session-founder",
            BusinessIdeaId = IdeaAId,
            OwnerUserId = UserId,
            Inputs = new ForecastInputs
            {
                MarketStudyVersion = 3,
                MonthlyGrowthPct = 25,
                Provenance = new Dictionary<string, string>
                {
                    ["monthlyGrowthPct"] = "founder_confirmed"
                }
            }
        };

        sessionStore.Setup(s => s.GetByIdeaAsync(IdeaAId, UserId)).ReturnsAsync(session);

        var contentV4 = new BsonDocument
        {
            ["marketSizing"] = new BsonDocument
            {
                ["som"] = new BsonDocument { ["growthRate"] = 10 }
            }
        };

        var res = await assumptionsService.UpdateFromMarketStudyAsync(IdeaAId, UserId, contentV4, marketStudyVersion: 4);

        // 16. Founder-edited assumption strictly preserved
        res.Inputs!.MonthlyGrowthPct.Should().Be(25);
        res.Inputs.Provenance!["monthlyGrowthPct"].Should().Be("founder_confirmed");
        res.Inputs.MarketStudyVersion.Should().Be(4);
    }
}
