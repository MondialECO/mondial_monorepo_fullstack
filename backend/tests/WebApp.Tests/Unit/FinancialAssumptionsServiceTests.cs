using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

public class FinancialAssumptionsServiceTests
{
    private readonly Mock<IForecastSessionStore> _sessions = new();
    private readonly Mock<ICreatorIdeaStore> _ideas = new();
    private readonly Mock<IMarketStudySessionStore> _marketStudies = new();
    private readonly Mock<IBusinessModelSessionStore> _businessModels = new();

    private FinancialAssumptionsService Service(IAiProvider? aiProvider = null, IModelRouter? modelRouter = null) =>
        new(_sessions.Object, _ideas.Object, _marketStudies.Object, _businessModels.Object, NullLogger<FinancialAssumptionsService>.Instance, aiProvider, modelRouter);

    [Fact]
    public async Task Step31_GeneratesPartialAssumptions_WithCanonicalTam_AndDeterministicFacts()
    {
        var ideaId = ObjectId.GenerateNewId().ToString();
        var idea = new CreatorIdea
        {
            Id = ideaId,
            UserId = "user-1",
            Project = new CreatorJourneyProject { Sector = "SaaS" }
        };

        var session = new ForecastSession
        {
            Id = "session-1",
            OwnerUserId = "user-1",
            BusinessIdeaId = ideaId,
            Inputs = new ForecastInputs()
        };

        _ideas.Setup(x => x.GetOwnedAsync(ideaId, "user-1")).ReturnsAsync(idea);
        _sessions.Setup(x => x.GetByIdeaAsync(ideaId, "user-1")).ReturnsAsync(session);
        _sessions.Setup(x => x.GetOwnedAsync("session-1", "user-1")).ReturnsAsync(session);

        var marketStudyContent = new BsonDocument
        {
            ["marketSizing"] = new BsonDocument
            {
                ["tam"] = new BsonDocument { ["value"] = 500000000.0 },
                ["som"] = new BsonDocument { ["growthRate"] = 18.0 }
            }
        };

        var result = await Service().UpdateFromMarketStudyAsync(ideaId, "user-1", marketStudyContent, 1);

        result.Inputs.Should().NotBeNull();
        result.Inputs!.Tam.Should().Be(500000000.0);
        result.Inputs.MonthlyGrowthPct.Should().Be(18.0);
        result.Inputs.MarketStudyVersion.Should().Be(1);
        result.Inputs.Provenance!["tam"].Should().Be("upstream_market");
        result.Inputs.Provenance["monthlyGrowthPct"].Should().Be("upstream_market");
    }

    [Fact]
    public async Task Step31_TriggersStructuredAi_WhenProviderAvailable()
    {
        var ideaId = ObjectId.GenerateNewId().ToString();
        var idea = new CreatorIdea
        {
            Id = ideaId,
            UserId = "user-1",
            Project = new CreatorJourneyProject { Sector = "B2B SaaS", Name = "CloudMetric" }
        };

        var session = new ForecastSession
        {
            Id = "session-1",
            OwnerUserId = "user-1",
            BusinessIdeaId = ideaId,
            Inputs = new ForecastInputs()
        };

        _ideas.Setup(x => x.GetOwnedAsync(ideaId, "user-1")).ReturnsAsync(idea);
        _sessions.Setup(x => x.GetByIdeaAsync(ideaId, "user-1")).ReturnsAsync(session);
        _sessions.Setup(x => x.GetOwnedAsync("session-1", "user-1")).ReturnsAsync(session);

        var aiMock = new Mock<IAiProvider>();
        aiMock.Setup(p => p.CompleteAsync(It.IsAny<AiCompletionRequest>(), default))
            .ReturnsAsync(new AiCompletion
            {
                Text = @"{
                    ""businessModelType"": ""saas"",
                    ""monthlyGrowthPct"": 14.5,
                    ""growthRationale"": ""Grounded in mid-market SaaS benchmark growth."",
                    ""launchVolume"": 85,
                    ""launchVolumeRationale"": ""Beta waitlist conversion estimate."",
                    ""canEstimateGrowth"": true,
                    ""canEstimateLaunchVolume"": true
                }",
                Model = "test-model",
                Usage = new AiTokenUsage(100, 100, 200)
            });

        var marketStudyContent = new BsonDocument
        {
            ["marketSizing"] = new BsonDocument
            {
                ["tam"] = new BsonDocument { ["value"] = 800000000.0 }
            }
        };

        var result = await Service(aiMock.Object).UpdateFromMarketStudyAsync(ideaId, "user-1", marketStudyContent, 1);

        result.Inputs.Should().NotBeNull();
        result.Inputs!.Tam.Should().Be(800000000.0);
        result.Inputs.Provenance!["tam"].Should().Be("upstream_market");
        result.Inputs.MonthlyGrowthPct.Should().Be(14.5);
        result.Inputs.Provenance["monthlyGrowthPct"].Should().Be("ai_suggested");
        result.Inputs.LaunchSubscribers.Should().Be(85);
        result.Inputs.Provenance["launchSubscribers"].Should().Be("ai_suggested");
        result.Inputs.NeedsFounderInput!["launchSubscribers"].Should().BeFalse();
    }

    [Fact]
    public async Task Step32_EnrichesSameSession_WithoutCreatingDuplicate()
    {
        var ideaId = ObjectId.GenerateNewId().ToString();
        var idea = new CreatorIdea
        {
            Id = ideaId,
            UserId = "user-1",
            Phase3Data = new CreatorPhase3Data { ForecastSessionId = "session-1" }
        };

        var session = new ForecastSession
        {
            Id = "session-1",
            OwnerUserId = "user-1",
            BusinessIdeaId = ideaId,
            Inputs = new ForecastInputs
            {
                Tam = 500000000.0,
                MonthlyGrowthPct = 18.0,
                MarketStudyVersion = 1,
                Provenance = new Dictionary<string, string> { ["tam"] = "upstream_market" }
            }
        };

        _ideas.Setup(x => x.GetOwnedAsync(ideaId, "user-1")).ReturnsAsync(idea);
        _sessions.Setup(x => x.GetOwnedAsync("session-1", "user-1")).ReturnsAsync(session);
        _sessions.Setup(x => x.GetByIdeaAsync(ideaId, "user-1")).ReturnsAsync(session);

        var bmContent = new BsonDocument
        {
            ["unitEconomics"] = new BsonDocument
            {
                ["arpu"] = new BsonDocument { ["amount"] = 49.0 },
                ["cac"] = new BsonDocument { ["amount"] = 120.0 },
                ["margins"] = new BsonDocument { ["grossMarginPct"] = 80.0 }
            },
            ["canvas"] = new BsonDocument
            {
                ["costStructure"] = new BsonArray { "Cloud hosting", "Lean remote team" }
            }
        };

        var result = await Service().UpdateFromBusinessModelAsync(ideaId, "user-1", bmContent, 1);

        result.Id.Should().Be("session-1"); // Exactly same session, no duplicate
        result.Inputs.Should().NotBeNull();
        result.Inputs!.Tam.Should().Be(500000000.0); // Step 3.1 TAM preserved
        result.Inputs.Provenance!["tam"].Should().Be("upstream_market");
        result.Inputs.Arpu.Should().Be(49.0);
        result.Inputs.Provenance["arpu"].Should().Be("upstream_business_model");
        result.Inputs.VariableCost.Should().BeApproximately(9.80, 0.01); // 49 * (1 - 0.80)
        result.Inputs.Provenance["variableCost"].Should().Be("upstream_business_model");
        result.Inputs.Opex.Should().Be(5000.0); // Lean cost structure
        result.Inputs.Provenance["opex"].Should().Be("upstream_business_model");
        result.Inputs.BusinessModelVersion.Should().Be(1);
    }

    [Fact]
    public async Task FounderConfirmed_Values_AreNeverOverwritten_ByRegeneration()
    {
        var ideaId = ObjectId.GenerateNewId().ToString();
        var idea = new CreatorIdea
        {
            Id = ideaId,
            UserId = "user-1",
            Phase3Data = new CreatorPhase3Data { ForecastSessionId = "session-1" }
        };

        var session = new ForecastSession
        {
            Id = "session-1",
            OwnerUserId = "user-1",
            BusinessIdeaId = ideaId,
            Inputs = new ForecastInputs
            {
                Arpu = 99.0, // Founder edited ARPU
                StartingBudget = 65000.0, // Founder confirmed budget
                Provenance = new Dictionary<string, string>
                {
                    ["arpu"] = "founder_edited",
                    ["startingBudget"] = "founder_confirmed"
                }
            }
        };

        _ideas.Setup(x => x.GetOwnedAsync(ideaId, "user-1")).ReturnsAsync(idea);
        _sessions.Setup(x => x.GetOwnedAsync("session-1", "user-1")).ReturnsAsync(session);

        // Step 3.2 regenerates with a different ARPU (29.0)
        var newBmContent = new BsonDocument
        {
            ["unitEconomics"] = new BsonDocument
            {
                ["arpu"] = new BsonDocument { ["amount"] = 29.0 },
                ["cac"] = new BsonDocument { ["amount"] = 200.0 }
            },
            ["canvas"] = new BsonDocument
            {
                ["costStructure"] = new BsonArray { "Standard team" }
            }
        };

        var result = await Service().UpdateFromBusinessModelAsync(ideaId, "user-1", newBmContent, 2);

        // Strict protection: founder values remain untouched!
        result.Inputs!.Arpu.Should().Be(99.0);
        result.Inputs.StartingBudget.Should().Be(65000.0);
        result.Inputs.Provenance!["arpu"].Should().Be("founder_edited");
        result.Inputs.Provenance["startingBudget"].Should().Be("founder_confirmed");
    }

    [Fact]
    public async Task MonotonicVersionRaceProtection_StaleMarketStudy_Ignored()
    {
        var ideaId = ObjectId.GenerateNewId().ToString();
        var idea = new CreatorIdea { Id = ideaId, UserId = "user-1" };

        var session = new ForecastSession
        {
            Id = "session-1",
            OwnerUserId = "user-1",
            BusinessIdeaId = ideaId,
            Inputs = new ForecastInputs
            {
                MarketStudyVersion = 3, // Already on v3
                Tam = 950000000.0,
                Provenance = new Dictionary<string, string> { ["tam"] = "upstream_market" }
            }
        };

        _ideas.Setup(x => x.GetOwnedAsync(ideaId, "user-1")).ReturnsAsync(idea);
        _sessions.Setup(x => x.GetByIdeaAsync(ideaId, "user-1")).ReturnsAsync(session);
        _sessions.Setup(x => x.GetOwnedAsync("session-1", "user-1")).ReturnsAsync(session);

        // Old v2 job completes later with an outdated TAM
        var staleMarketStudy = new BsonDocument
        {
            ["marketSizing"] = new BsonDocument
            {
                ["tam"] = new BsonDocument { ["value"] = 100000000.0 }
            }
        };

        var result = await Service().UpdateFromMarketStudyAsync(ideaId, "user-1", staleMarketStudy, 2);

        // Result MUST ignore stale v2 and keep v3 TAM
        result.Inputs!.MarketStudyVersion.Should().Be(3);
        result.Inputs.Tam.Should().Be(950000000.0);
    }

    [Fact]
    public async Task MonotonicVersionRaceProtection_StaleBusinessModel_Ignored()
    {
        var ideaId = ObjectId.GenerateNewId().ToString();
        var idea = new CreatorIdea { Id = ideaId, UserId = "user-1" };

        var session = new ForecastSession
        {
            Id = "session-1",
            OwnerUserId = "user-1",
            BusinessIdeaId = ideaId,
            Inputs = new ForecastInputs
            {
                BusinessModelVersion = 3, // Already on v3
                Arpu = 120.0,
                Provenance = new Dictionary<string, string> { ["arpu"] = "upstream_business_model" }
            }
        };

        _ideas.Setup(x => x.GetOwnedAsync(ideaId, "user-1")).ReturnsAsync(idea);
        _sessions.Setup(x => x.GetByIdeaAsync(ideaId, "user-1")).ReturnsAsync(session);
        _sessions.Setup(x => x.GetOwnedAsync("session-1", "user-1")).ReturnsAsync(session);

        // Old v2 finishes later with stale ARPU = 35.0
        var staleBm = new BsonDocument
        {
            ["unitEconomics"] = new BsonDocument
            {
                ["arpu"] = new BsonDocument { ["amount"] = 35.0 }
            }
        };

        var result = await Service().UpdateFromBusinessModelAsync(ideaId, "user-1", staleBm, 2);

        // Stale v2 ignored
        result.Inputs!.BusinessModelVersion.Should().Be(3);
        result.Inputs.Arpu.Should().Be(120.0);
    }

    [Fact]
    public async Task Ecommerce_MarksChurnInactive_WithoutFakeZeroOrFakeProvenance()
    {
        var ideaId = ObjectId.GenerateNewId().ToString();
        var idea = new CreatorIdea
        {
            Id = ideaId,
            UserId = "user-1",
            Project = new CreatorJourneyProject { Solution = "Online DTC Eco-Fashion Store" }
        };

        var session = new ForecastSession
        {
            Id = "session-1",
            OwnerUserId = "user-1",
            BusinessIdeaId = ideaId,
            Inputs = new ForecastInputs()
        };

        _ideas.Setup(x => x.GetOwnedAsync(ideaId, "user-1")).ReturnsAsync(idea);
        _sessions.Setup(x => x.GetByIdeaAsync(ideaId, "user-1")).ReturnsAsync(session);
        _sessions.Setup(x => x.GetOwnedAsync("session-1", "user-1")).ReturnsAsync(session);

        var bmContent = new BsonDocument
        {
            ["unitEconomics"] = new BsonDocument
            {
                ["arpu"] = new BsonDocument { ["amount"] = 75.0 }
            }
        };

        var result = await Service().UpdateFromBusinessModelAsync(ideaId, "user-1", bmContent, 1);

        result.Inputs!.BusinessModelType.Should().Be("ecommerce");
        // Inactive driver is excluded, NOT persisted as fake canonical 0, and has no fake upstream_business_model provenance
        result.Inputs.MonthlyChurnPct.Should().BeNull();
        result.Inputs.ActiveDrivers.Should().NotBeNull();
        result.Inputs.ActiveDrivers!["monthlyChurnPct"].Should().BeFalse();
        (result.Inputs.Provenance?.ContainsKey("monthlyChurnPct") ?? false).Should().BeFalse();
    }

    [Theory]
    [InlineData("Online Fashion Store selling apparel DTC", "ecommerce")]
    [InlineData("Legal and Advisory Consulting Agency", "service")]
    [InlineData("Peer-to-peer equipment rental marketplace", "marketplace")]
    [InlineData("Cloud analytics B2B software platform", "saas")]
    public async Task BusinessModel_AdaptsToArchetype(string solutionText, string expectedType)
    {
        var ideaId = ObjectId.GenerateNewId().ToString();
        var idea = new CreatorIdea
        {
            Id = ideaId,
            UserId = "user-1",
            Project = new CreatorJourneyProject { Solution = solutionText }
        };

        var session = new ForecastSession
        {
            Id = "session-1",
            OwnerUserId = "user-1",
            BusinessIdeaId = ideaId,
            Inputs = new ForecastInputs()
        };

        _ideas.Setup(x => x.GetOwnedAsync(ideaId, "user-1")).ReturnsAsync(idea);
        _sessions.Setup(x => x.GetOwnedAsync("session-1", "user-1")).ReturnsAsync(session);

        var bmContent = new BsonDocument
        {
            ["unitEconomics"] = new BsonDocument { ["arpu"] = new BsonDocument { ["amount"] = 50.0 } }
        };

        var result = await Service().UpdateFromBusinessModelAsync(ideaId, "user-1", bmContent, 1);

        result.Inputs!.BusinessModelType.Should().Be(expectedType);
    }
}
