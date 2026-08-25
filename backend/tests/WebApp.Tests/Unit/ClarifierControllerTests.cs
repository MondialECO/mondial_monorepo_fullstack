using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using WebApp.Configuration.AiOptions;
using WebApp.Controllers;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Audit;
using WebApp.Services.Repository.Ai;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// C-2 P5: ClarifierController guard-rail behavior that does not need a live
/// Mongo (feature flags). Full create/read/list flows are covered by
/// ClarifierControllerIntegrationTests against a real database.
/// </summary>
public class ClarifierControllerTests
{
    private readonly Mock<IClarifierSessionStore> _sessions = new();
    private readonly Mock<IAiJobService> _jobs = new();
    private readonly Mock<IAiCreditService> _credits = new();
    private readonly Mock<ICreatorIdeaStore> _creatorIdeas = new();
    private const string IdeaId = "65b000000000000000000001";

    private ClarifierController Build(AiSettings settings)
    {
        var controller = new ClarifierController(
            _sessions.Object, _jobs.Object, _credits.Object,
            Mock.Of<IAuditLogger>(), Options.Create(settings),
            NullLogger<ClarifierController>.Instance,
            _creatorIdeas.Object);
        _creatorIdeas.Setup(x => x.GetOwnedAsync(IdeaId, "user-1"))
            .ReturnsAsync(new CreatorIdea { Id = IdeaId, UserId = "user-1" });

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, "user-1") }));
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user },
        };
        return controller;
    }

    private static StartClarifierRequest ValidRequest() => new()
    {
        BusinessIdeaId = IdeaId,
        RawIdea = new RawIdeaInput { Title = "t", ProblemStatement = "p", TargetAudience = "a" },
    };

    [Fact]
    public async Task Start_returns_503_when_ai_master_switch_off()
    {
        var settings = new AiSettings { Enabled = false };
        settings.Features.Clarifier = true;

        var result = await Build(settings).Start(ValidRequest());

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(503);
        _sessions.Verify(s => s.AddAsync(It.IsAny<WebApp.Models.DatabaseModels.Ai.ClarifierSession>()), Times.Never);
        _jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<MongoDB.Bson.BsonDocument>()), Times.Never);
    }

    [Fact]
    public async Task Start_returns_503_when_clarifier_feature_disabled()
    {
        var settings = new AiSettings { Enabled = true };
        settings.Features.Clarifier = false;

        var result = await Build(settings).Start(ValidRequest());

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(503);
        _credits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>()), Times.Never);
        _sessions.Verify(s => s.AddAsync(It.IsAny<WebApp.Models.DatabaseModels.Ai.ClarifierSession>()), Times.Never);
    }
}
