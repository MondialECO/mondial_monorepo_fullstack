using System.Reflection;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

public class CreatorIdeaScopeTests
{
    private const string UserId = "11111111-1111-1111-1111-111111111111";
    private const string ActiveIdeaId = "active-idea";
    private const string StaleIdeaId = "stale-idea";
    private const string ConflictMessage = "You've switched to a different idea elsewhere — refresh this page and try again.";

    private readonly Mock<ICreatorIdeaStore> _ideas = new();

    [Fact]
    public void Formation_skills_request_allows_an_absent_cofounder_draft()
    {
        var property = typeof(DeclareFormationSkillsRequest).GetProperty(nameof(DeclareFormationSkillsRequest.Cofounder));
        property.Should().NotBeNull();

        var nullability = new NullabilityInfoContext().Create(property!);
        nullability.WriteState.Should().Be(NullabilityState.Nullable);
    }

    private CreatorJourneyService BuildJourneyService()
    {
        var database = new Mock<IMongoDatabase>();
        var context = new MongoDbContext(database.Object);
        return new CreatorJourneyService(
            context,
            Mock.Of<IBusinessPlanSessionStore>(),
            Mock.Of<IForecastSessionStore>(),
            _ideas.Object,
            Mock.Of<IClarifierSessionStore>());
    }

    private static Task<CreatorIdea> ResolveIdeaAsync(
        CreatorJourneyService service,
        CreatorJourney journey,
        string? ideaId)
    {
        var method = typeof(CreatorJourneyService).GetMethod(
            "ResolveIdeaAsync",
            BindingFlags.Instance | BindingFlags.NonPublic);

        method.Should().NotBeNull();
        return (Task<CreatorIdea>)method!.Invoke(service, new object?[] { journey, ideaId })!;
    }

    [Fact]
    public async Task Explicit_owned_active_idea_is_resolved()
    {
        var expected = new CreatorIdea { Id = ActiveIdeaId, UserId = UserId };
        _ideas.Setup(store => store.GetOwnedAsync(ActiveIdeaId, UserId)).ReturnsAsync(expected);

        var resolved = await ResolveIdeaAsync(
            BuildJourneyService(),
            new CreatorJourney { UserId = UserId, ActiveIdeaId = ActiveIdeaId },
            ActiveIdeaId);

        resolved.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task Explicit_owned_non_active_idea_throws_409()
    {
        var owned = new CreatorIdea { Id = StaleIdeaId, UserId = UserId };
        _ideas.Setup(store => store.GetOwnedAsync(StaleIdeaId, UserId)).ReturnsAsync(owned);

        var action = () => ResolveIdeaAsync(
            BuildJourneyService(),
            new CreatorJourney { UserId = UserId, ActiveIdeaId = ActiveIdeaId },
            StaleIdeaId);

        var thrown = await action.Should().ThrowAsync<CreatorJourneyException>();
        thrown.Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        thrown.Which.Message.Should().Be(ConflictMessage);
    }

    [Fact]
    public async Task Explicit_unowned_idea_remains_404()
    {
        _ideas.Setup(store => store.GetOwnedAsync(StaleIdeaId, UserId)).ReturnsAsync((CreatorIdea?)null);

        var action = () => ResolveIdeaAsync(
            BuildJourneyService(),
            new CreatorJourney { UserId = UserId, ActiveIdeaId = ActiveIdeaId },
            StaleIdeaId);

        var thrown = await action.Should().ThrowAsync<CreatorJourneyException>();
        thrown.Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Missing_idea_id_still_resolves_the_active_idea()
    {
        var expected = new CreatorIdea { Id = ActiveIdeaId, UserId = UserId };
        _ideas.Setup(store => store.GetOwnedAsync(ActiveIdeaId, UserId)).ReturnsAsync(expected);

        var resolved = await ResolveIdeaAsync(
            BuildJourneyService(),
            new CreatorJourney { UserId = UserId, ActiveIdeaId = ActiveIdeaId },
            null);

        resolved.Should().BeSameAs(expected);
    }
}

public class CreatorIdeaConflictControllerTests
{
    private const string UserId = "11111111-1111-1111-1111-111111111111";
    private const string IdeaId = "stale-idea";

    private static ControllerContext AuthenticatedContext() => new()
    {
        HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                new[] { new Claim(ClaimTypes.NameIdentifier, UserId) },
                "test")),
        },
    };

    private static void AssertConflict(IActionResult result)
    {
        result.Should().BeOfType<ObjectResult>();
        ((ObjectResult)result).StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task Formation_generation_propagates_idea_conflict()
    {
        var journeys = new Mock<ICreatorJourneyService>();
        journeys.Setup(service => service.GetOrCreateComposedAsync(UserId, IdeaId))
            .ThrowsAsync(new CreatorJourneyException(409, "conflict"));
        var controller = new CreatorPhase3Controller(
            journeys.Object,
            Mock.Of<ISpMatchingService>(),
            Mock.Of<IChatService>(),
            Mock.Of<IForecastSessionStore>(),
            Mock.Of<IBusinessPlanSessionStore>())
        {
            ControllerContext = AuthenticatedContext(),
        };

        AssertConflict(await controller.GenerateFormation(IdeaId));
    }

    [Fact]
    public async Task Pricing_insights_propagates_idea_conflict()
    {
        var journeys = new Mock<ICreatorJourneyService>();
        journeys.Setup(service => service.GetOrCreateComposedAsync(UserId, IdeaId))
            .ThrowsAsync(new CreatorJourneyException(409, "conflict"));
        var controller = new CreatorPhase4Controller(journeys.Object, Mock.Of<IMarketBenchmarkResolver>())
        {
            ControllerContext = AuthenticatedContext(),
        };

        AssertConflict(await controller.PricingInsights(IdeaId));
    }

    [Fact]
    public async Task Resource_calculator_propagates_idea_conflict()
    {
        var journeys = new Mock<ICreatorJourneyService>();
        journeys.Setup(service => service.GetOrCreateComposedAsync(UserId, IdeaId))
            .ThrowsAsync(new CreatorJourneyException(409, "conflict"));
        var controller = new CreatorPhase4Controller(journeys.Object, Mock.Of<IMarketBenchmarkResolver>())
        {
            ControllerContext = AuthenticatedContext(),
        };

        AssertConflict(await controller.ResourceCalculator(new ResourceCalcRequest(), IdeaId));
    }

    [Fact]
    public async Task Gtm_setup_propagates_idea_conflict()
    {
        var journeys = new Mock<ICreatorJourneyService>();
        journeys.Setup(service => service.GetOrCreateComposedAsync(UserId, IdeaId))
            .ThrowsAsync(new CreatorJourneyException(409, "conflict"));
        var controller = new CreatorPhase4Controller(journeys.Object, Mock.Of<IMarketBenchmarkResolver>())
        {
            ControllerContext = AuthenticatedContext(),
        };

        AssertConflict(await controller.GtmSetup(new GtmSetupRequest(), IdeaId));
    }

    [Fact]
    public async Task Completion_propagates_idea_conflict()
    {
        var journeys = new Mock<ICreatorJourneyService>();
        journeys.Setup(service => service.GetOrCreateComposedAsync(UserId, IdeaId))
            .ThrowsAsync(new CreatorJourneyException(409, "conflict"));
        var controller = new CreatorPhase4Controller(journeys.Object, Mock.Of<IMarketBenchmarkResolver>())
        {
            ControllerContext = AuthenticatedContext(),
        };

        AssertConflict(await controller.Complete(IdeaId));
    }
}
