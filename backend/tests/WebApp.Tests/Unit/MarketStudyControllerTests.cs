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
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Audit;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

public class MarketStudyControllerTests
{
    private readonly Mock<IMarketStudySessionStore> _sessions = new();
    private readonly Mock<IClarifierSessionStore> _clarifiers = new();
    private readonly Mock<ICreatorIdeaStore> _creatorIdeas = new();
    private readonly Mock<IAiJobService> _jobs = new();
    private readonly Mock<IAiCreditService> _credits = new();
    private readonly Mock<IAuditLogger> _audit = new();

    private const string UserId = "user-1";
    private readonly string _clarifierId = ObjectId.GenerateNewId().ToString();

    public MarketStudyControllerTests()
    {
        _sessions.Setup(s => s.TryCreateInFlightAsync(It.IsAny<MarketStudySession>()))
            .ReturnsAsync((MarketStudySession s) => (true, s));
        _sessions.Setup(s => s.TryAcquireRegenerateLockAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((string id, string owner) => (true, new MarketStudySession { Id = id, OwnerUserId = owner, Status = "Processing", CurrentVersion = 1 }));
    }

    private MarketStudyController BuildController(AiSettings? settings = null)
    {
        settings ??= new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { MarketStudy = true },
            CreditCosts = new Dictionary<string, int> { ["MarketStudy"] = 20 }
        };

        var controller = new MarketStudyController(
            _sessions.Object,
            _clarifiers.Object,
            _creatorIdeas.Object,
            _jobs.Object,
            _credits.Object,
            _audit.Object,
            Options.Create(settings),
            NullLogger<MarketStudyController>.Instance);

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }));
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        return controller;
    }

    private void SetupCompletedClarifier(string clarifierId, string owner = UserId)
    {
        _clarifiers.Setup(c => c.GetOwnedAsync(clarifierId, owner))
            .ReturnsAsync(new ClarifierSession
            {
                Id = clarifierId,
                OwnerUserId = owner,
                Status = "Completed",
                Output = new BsonDocument("schemaVersion", 1)
            });
    }

    [Fact]
    public async Task Start_WithInsufficientCredits_Returns402_NoJob_NoSuccessAudit()
    {
        SetupCompletedClarifier(_clarifierId);
        _credits.Setup(c => c.DebitForJobAsync(UserId, AiJobType.MarketStudy, It.IsAny<string>()))
            .ThrowsAsync(new InsufficientCreditsException("Insufficient credits", 402));

        var controller = BuildController();
        var result = await controller.Start(new StartMarketStudyRequest { ClarifierSessionId = _clarifierId });

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(402);
        _jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
        _audit.Verify(a => a.Record("MarketStudy.Start", UserId, false, It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task Start_Success_Debits20Credits_EnqueuesJob_AndRecordsSuccessAudit()
    {
        SetupCompletedClarifier(_clarifierId);
        string? capturedDebitOpId = null;

        _credits.Setup(c => c.DebitForJobAsync(UserId, AiJobType.MarketStudy, It.IsAny<string>()))
            .Callback<string, AiJobType, string?>((u, j, op) => capturedDebitOpId = op)
            .Returns(Task.CompletedTask);
        _jobs.Setup(j => j.EnqueueAsync(AiJobType.MarketStudy, UserId, It.IsAny<BsonDocument>())).ReturnsAsync("job-ms-123");

        var controller = BuildController();
        var result = await controller.Start(new StartMarketStudyRequest { ClarifierSessionId = _clarifierId });

        result.Should().BeOfType<OkObjectResult>();
        capturedDebitOpId.Should().NotBeNullOrEmpty();
        _credits.Verify(c => c.DebitForJobAsync(UserId, AiJobType.MarketStudy, capturedDebitOpId), Times.Once);
        _jobs.Verify(j => j.EnqueueAsync(AiJobType.MarketStudy, UserId, It.IsAny<BsonDocument>()), Times.Once);
        _audit.Verify(a => a.Record("MarketStudy.Start", UserId, true, It.IsAny<object>()), Times.Once);
    }
}
