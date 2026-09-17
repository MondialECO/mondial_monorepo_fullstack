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
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Verifies Commit 2 in-flight duplicate charge guard across Clarifier, BusinessPlan, and Forecast:
/// 1. Atomic check and reservation before debit.
/// 2. Request joining an existing in-flight session does not debit at all.
/// 3. In-flight session is returned rather than an error so work resumes.
/// 4. Failed and NeedsReview sessions are not considered in-flight and allow immediate retry.
/// </summary>
public class InFlightDuplicateGuardUnitTests
{
    private const string UserId = "user-test-guard";
    private readonly string _ideaId = ObjectId.GenerateNewId().ToString();
    private readonly string _clarifierId = ObjectId.GenerateNewId().ToString();
    private readonly string _planId = ObjectId.GenerateNewId().ToString();

    // ==========================================
    // 1. CLARIFIER IN-FLIGHT DUPLICATE GUARD
    // ==========================================

    [Fact]
    public async Task Clarifier_Start_WhenDuplicateInFlight_ReturnsExistingSession_AndDebitsZeroCredits()
    {
        var sessionStore = new Mock<IClarifierSessionStore>();
        var creatorIdeas = new Mock<WebApp.Services.Repository.ICreatorIdeaStore>();
        var jobs = new Mock<IAiJobService>();
        var credits = new Mock<IAiCreditService>();
        var audit = new Mock<IAuditLogger>();

        creatorIdeas.Setup(c => c.GetOwnedAsync(_ideaId, UserId))
            .ReturnsAsync(new WebApp.Models.DatabaseModels.CreatorIdea { Id = _ideaId, UserId = UserId });

        var inFlightSession = new ClarifierSession
        {
            Id = "existing-clarifier-session",
            OwnerUserId = UserId,
            BusinessIdeaId = _ideaId,
            Status = "Processing",
            RequestId = "existing-job-111"
        };

        sessionStore.Setup(s => s.TryCreateInFlightAsync(It.IsAny<ClarifierSession>()))
            .ReturnsAsync((false, inFlightSession));

        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { Clarifier = true },
            CreditCosts = new Dictionary<string, int> { ["IdeaClarifier"] = 1 }
        };

        var controller = new ClarifierController(
            sessionStore.Object,
            jobs.Object,
            credits.Object,
            audit.Object,
            Options.Create(settings),
            NullLogger<ClarifierController>.Instance,
            creatorIdeas.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }))
            }
        };

        var request = new StartClarifierRequest
        {
            BusinessIdeaId = _ideaId,
            RawIdea = new RawIdeaInput
            {
                Title = "Test Idea",
                ProblemStatement = "Test Problem",
                TargetAudience = "Test Audience"
            }
        };

        var result = await controller.Start(request);

        result.Should().BeOfType<OkObjectResult>();
        credits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string>()), Times.Never);
        jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
    }

    // ==========================================
    // 2. BUSINESS PLAN IN-FLIGHT DUPLICATE GUARD
    // ==========================================

    [Fact]
    public async Task BusinessPlan_Start_WhenDuplicateInFlight_ReturnsExistingSession_AndDebitsZeroCredits()
    {
        var sessionStore = new Mock<IBusinessPlanSessionStore>();
        var clarifierStore = new Mock<IClarifierSessionStore>();
        var creatorIdeas = new Mock<WebApp.Services.Repository.ICreatorIdeaStore>();
        var jobs = new Mock<IAiJobService>();
        var credits = new Mock<IAiCreditService>();
        var audit = new Mock<IAuditLogger>();

        clarifierStore.Setup(c => c.GetOwnedAsync(_clarifierId, UserId))
            .ReturnsAsync(new ClarifierSession
            {
                Id = _clarifierId,
                OwnerUserId = UserId,
                Status = "Completed",
                Output = new BsonDocument("v", 1)
            });

        var existingSession = new BusinessPlanSession
        {
            Id = "existing-bp-session",
            OwnerUserId = UserId,
            ClarifierSessionId = _clarifierId,
            Status = "Processing",
            RequestId = "existing-bp-job"
        };

        sessionStore.Setup(s => s.TryCreateInFlightAsync(It.IsAny<BusinessPlanSession>()))
            .ReturnsAsync((false, existingSession));

        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { BusinessPlan = true },
            CreditCosts = new Dictionary<string, int> { ["BusinessPlan"] = 5 }
        };

        var controller = new BusinessPlanController(
            sessionStore.Object,
            clarifierStore.Object,
            creatorIdeas.Object,
            jobs.Object,
            credits.Object,
            audit.Object,
            Options.Create(settings),
            NullLogger<BusinessPlanController>.Instance,
            new Mock<IServiceProvider>().Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }))
            }
        };

        var result = await controller.Start(new StartBusinessPlanRequest { ClarifierSessionId = _clarifierId });

        result.Should().BeOfType<OkObjectResult>();
        credits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string>()), Times.Never);
        jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
    }

    [Fact]
    public async Task BusinessPlan_Regenerate_WhenDuplicateInFlight_ReturnsExistingSession_AndDebitsZeroCredits()
    {
        var sessionStore = new Mock<IBusinessPlanSessionStore>();
        var clarifierStore = new Mock<IClarifierSessionStore>();
        var creatorIdeas = new Mock<WebApp.Services.Repository.ICreatorIdeaStore>();
        var jobs = new Mock<IAiJobService>();
        var credits = new Mock<IAiCreditService>();
        var audit = new Mock<IAuditLogger>();

        sessionStore.Setup(s => s.GetOwnedAsync(_planId, UserId))
            .ReturnsAsync(new BusinessPlanSession { Id = _planId, OwnerUserId = UserId, ClarifierSessionId = _clarifierId, CurrentVersion = 1 });

        clarifierStore.Setup(c => c.GetOwnedAsync(_clarifierId, UserId))
            .ReturnsAsync(new ClarifierSession { Id = _clarifierId, OwnerUserId = UserId, Status = "Completed", Output = new BsonDocument("v", 1) });

        var inFlightSession = new BusinessPlanSession
        {
            Id = _planId,
            OwnerUserId = UserId,
            ClarifierSessionId = _clarifierId,
            Status = "Processing",
            RequestId = "active-regen-job"
        };

        sessionStore.Setup(s => s.TryAcquireRegenerateLockAsync(_planId, UserId))
            .ReturnsAsync((false, inFlightSession));

        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { BusinessPlan = true },
            CreditCosts = new Dictionary<string, int> { ["BusinessPlan"] = 5 }
        };

        var controller = new BusinessPlanController(
            sessionStore.Object,
            clarifierStore.Object,
            creatorIdeas.Object,
            jobs.Object,
            credits.Object,
            audit.Object,
            Options.Create(settings),
            NullLogger<BusinessPlanController>.Instance,
            new Mock<IServiceProvider>().Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }))
            }
        };

        var result = await controller.Regenerate(_planId);

        result.Should().BeOfType<OkObjectResult>();
        credits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string>()), Times.Never);
        jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
    }

    [Fact]
    public async Task BusinessPlan_RewriteSection_WhenDuplicateInFlightForSameSection_ReturnsExistingSession_AndDebitsZeroCredits()
    {
        var sessionStore = new Mock<IBusinessPlanSessionStore>();
        var clarifierStore = new Mock<IClarifierSessionStore>();
        var creatorIdeas = new Mock<WebApp.Services.Repository.ICreatorIdeaStore>();
        var jobs = new Mock<IAiJobService>();
        var credits = new Mock<IAiCreditService>();
        var audit = new Mock<IAuditLogger>();

        sessionStore.Setup(s => s.GetOwnedAsync(_planId, UserId))
            .ReturnsAsync(new BusinessPlanSession { Id = _planId, OwnerUserId = UserId, ClarifierSessionId = _clarifierId, CurrentVersion = 1 });

        clarifierStore.Setup(c => c.GetOwnedAsync(_clarifierId, UserId))
            .ReturnsAsync(new ClarifierSession { Id = _clarifierId, OwnerUserId = UserId, Status = "Completed", Output = new BsonDocument("v", 1) });

        var inFlightSession = new BusinessPlanSession
        {
            Id = _planId,
            OwnerUserId = UserId,
            ClarifierSessionId = _clarifierId,
            Status = "Processing",
            ActiveRewriteSection = "executive",
            RequestId = "active-rewrite-job"
        };

        sessionStore.Setup(s => s.TryAcquireSectionRewriteLockAsync(_planId, UserId, "executive"))
            .ReturnsAsync((false, inFlightSession));

        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { BusinessPlan = true },
            CreditCosts = new Dictionary<string, int> { ["BusinessPlan"] = 5 }
        };

        var controller = new BusinessPlanController(
            sessionStore.Object,
            clarifierStore.Object,
            creatorIdeas.Object,
            jobs.Object,
            credits.Object,
            audit.Object,
            Options.Create(settings),
            NullLogger<BusinessPlanController>.Instance,
            new Mock<IServiceProvider>().Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }))
            }
        };

        var result = await controller.RewriteSection(new RewriteSectionRequest
        {
            BusinessPlanSessionId = _planId,
            SectionId = "executive"
        });

        result.Should().BeOfType<OkObjectResult>();
        credits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string>()), Times.Never);
        jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
    }

    [Fact]
    public async Task BusinessPlan_RewriteSection_WhenAnotherSectionActive_ReturnsConflict_AndDebitsZeroCredits()
    {
        var sessionStore = new Mock<IBusinessPlanSessionStore>();
        var clarifierStore = new Mock<IClarifierSessionStore>();
        var creatorIdeas = new Mock<WebApp.Services.Repository.ICreatorIdeaStore>();
        var jobs = new Mock<IAiJobService>();
        var credits = new Mock<IAiCreditService>();
        var audit = new Mock<IAuditLogger>();

        sessionStore.Setup(s => s.GetOwnedAsync(_planId, UserId))
            .ReturnsAsync(new BusinessPlanSession { Id = _planId, OwnerUserId = UserId, ClarifierSessionId = _clarifierId, CurrentVersion = 1 });

        clarifierStore.Setup(c => c.GetOwnedAsync(_clarifierId, UserId))
            .ReturnsAsync(new ClarifierSession { Id = _clarifierId, OwnerUserId = UserId, Status = "Completed", Output = new BsonDocument("v", 1) });

        var inFlightSession = new BusinessPlanSession
        {
            Id = _planId,
            OwnerUserId = UserId,
            ClarifierSessionId = _clarifierId,
            Status = "Processing",
            ActiveRewriteSection = "target-market", // Different section active!
            RequestId = "active-rewrite-job"
        };

        sessionStore.Setup(s => s.TryAcquireSectionRewriteLockAsync(_planId, UserId, "executive"))
            .ReturnsAsync((false, inFlightSession));

        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { BusinessPlan = true },
            CreditCosts = new Dictionary<string, int> { ["BusinessPlan"] = 5 }
        };

        var controller = new BusinessPlanController(
            sessionStore.Object,
            clarifierStore.Object,
            creatorIdeas.Object,
            jobs.Object,
            credits.Object,
            audit.Object,
            Options.Create(settings),
            NullLogger<BusinessPlanController>.Instance,
            new Mock<IServiceProvider>().Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }))
            }
        };

        var result = await controller.RewriteSection(new RewriteSectionRequest
        {
            BusinessPlanSessionId = _planId,
            SectionId = "executive"
        });

        result.Should().BeOfType<ConflictObjectResult>();
        credits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string>()), Times.Never);
        jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
    }

    // ==========================================
    // 3. FORECAST IN-FLIGHT DUPLICATE GUARD
    // ==========================================

    [Fact]
    public async Task Forecast_Start_WhenDuplicateInFlight_ReturnsExistingSession_AndDebitsZeroCredits()
    {
        var sessionStore = new Mock<IForecastSessionStore>();
        var planStore = new Mock<IBusinessPlanSessionStore>();
        var creatorIdeas = new Mock<WebApp.Services.Repository.ICreatorIdeaStore>();
        var jobs = new Mock<IAiJobService>();
        var credits = new Mock<IAiCreditService>();
        var audit = new Mock<IAuditLogger>();

        planStore.Setup(p => p.GetOwnedAsync(_planId, UserId))
            .ReturnsAsync(new BusinessPlanSession { Id = _planId, OwnerUserId = UserId, Status = "Completed", CurrentVersion = 1 });

        var inFlightSession = new ForecastSession
        {
            Id = "existing-forecast-session",
            OwnerUserId = UserId,
            BusinessPlanSessionId = _planId,
            Status = "Processing",
            RequestId = "existing-forecast-job"
        };

        sessionStore.Setup(s => s.TryCreateInFlightAsync(It.IsAny<ForecastSession>()))
            .ReturnsAsync((false, inFlightSession));

        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { Forecast = true },
            CreditCosts = new Dictionary<string, int> { ["Forecast"] = 5 }
        };

        var controller = new ForecastController(
            sessionStore.Object,
            planStore.Object,
            creatorIdeas.Object,
            jobs.Object,
            credits.Object,
            audit.Object,
            Options.Create(settings),
            NullLogger<ForecastController>.Instance);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }))
            }
        };

        var request = new StartForecastRequest
        {
            BusinessPlanSessionId = _planId,
            MonthlyChurnPct = 5,
            Arpu = 50,
            Opex = 1000,
            MonthlyGrowthPct = 10,
            Tam = 1000000
        };

        var result = await controller.Start(request);

        result.Should().BeOfType<OkObjectResult>();
        credits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string>()), Times.Never);
        jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
    }

    [Fact]
    public async Task Forecast_Regenerate_WhenDuplicateInFlight_ReturnsExistingSession_AndDebitsZeroCredits()
    {
        var sessionStore = new Mock<IForecastSessionStore>();
        var planStore = new Mock<IBusinessPlanSessionStore>();
        var creatorIdeas = new Mock<WebApp.Services.Repository.ICreatorIdeaStore>();
        var jobs = new Mock<IAiJobService>();
        var credits = new Mock<IAiCreditService>();
        var audit = new Mock<IAuditLogger>();

        var forecastId = ObjectId.GenerateNewId().ToString();
        sessionStore.Setup(s => s.GetOwnedAsync(forecastId, UserId))
            .ReturnsAsync(new ForecastSession { Id = forecastId, OwnerUserId = UserId, BusinessPlanSessionId = _planId, CurrentVersion = 1 });

        var inFlightSession = new ForecastSession
        {
            Id = forecastId,
            OwnerUserId = UserId,
            BusinessPlanSessionId = _planId,
            Status = "Processing",
            RequestId = "active-forecast-regen-job"
        };

        sessionStore.Setup(s => s.TryAcquireRegenerateLockAsync(forecastId, UserId))
            .ReturnsAsync((false, inFlightSession));

        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { Forecast = true },
            CreditCosts = new Dictionary<string, int> { ["Forecast"] = 5 }
        };

        var controller = new ForecastController(
            sessionStore.Object,
            planStore.Object,
            creatorIdeas.Object,
            jobs.Object,
            credits.Object,
            audit.Object,
            Options.Create(settings),
            NullLogger<ForecastController>.Instance);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }))
            }
        };

        var result = await controller.Regenerate(forecastId);

        result.Should().BeOfType<OkObjectResult>();
        credits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string>()), Times.Never);
        jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
    }

    // ==========================================
    // 4. RETRY AFTER TERMINAL STATES (NeedsReview / Failed)
    // ==========================================

    [Theory]
    [InlineData("NeedsReview")]
    [InlineData("Failed")]
    public async Task Clarifier_Start_WhenPreviousRunReachedTerminalState_AllowsImmediateRetryAndDebitsCredits(string terminalStatus)
    {
        var sessionStore = new Mock<IClarifierSessionStore>();
        var creatorIdeas = new Mock<WebApp.Services.Repository.ICreatorIdeaStore>();
        var jobs = new Mock<IAiJobService>();
        var credits = new Mock<IAiCreditService>();
        var audit = new Mock<IAuditLogger>();

        creatorIdeas.Setup(c => c.GetOwnedAsync(_ideaId, UserId))
            .ReturnsAsync(new WebApp.Models.DatabaseModels.CreatorIdea { Id = _ideaId, UserId = UserId });

        // Previous session ended in terminalStatus (NeedsReview or Failed).
        // Since InFlightKey was unset upon entering terminalStatus, TryCreateInFlightAsync succeeds.
        sessionStore.Setup(s => s.TryCreateInFlightAsync(It.IsAny<ClarifierSession>()))
            .ReturnsAsync((ClarifierSession s) =>
            {
                s.Status = "Pending"; // New session begins Pending regardless of previous terminalStatus
                return (true, s);
            });

        jobs.Setup(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()))
            .ReturnsAsync("new-job-id");

        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { Clarifier = true },
            CreditCosts = new Dictionary<string, int> { ["IdeaClarifier"] = 1 }
        };

        var controller = new ClarifierController(
            sessionStore.Object,
            jobs.Object,
            credits.Object,
            audit.Object,
            Options.Create(settings),
            NullLogger<ClarifierController>.Instance,
            creatorIdeas.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }))
            }
        };

        var request = new StartClarifierRequest
        {
            BusinessIdeaId = _ideaId,
            RawIdea = new RawIdeaInput
            {
                Title = $"Retry after {terminalStatus}",
                ProblemStatement = "Retry Problem",
                TargetAudience = "Retry Audience"
            }
        };

        var result = await controller.Start(request);

        result.Should().BeOfType<OkObjectResult>();
        credits.Verify(c => c.DebitForJobAsync(UserId, AiJobType.IdeaClarifier, It.IsAny<string>()), Times.Once);
        jobs.Verify(j => j.EnqueueAsync(AiJobType.IdeaClarifier, UserId, It.IsAny<BsonDocument>()), Times.Once);
    }

    [Theory]
    [InlineData("NeedsReview")]
    [InlineData("Failed")]
    public async Task BusinessPlan_Regenerate_WhenPreviousRunReachedTerminalState_AllowsImmediateRetryAndDebitsCredits(string terminalStatus)
    {
        var sessionStore = new Mock<IBusinessPlanSessionStore>();
        var clarifierStore = new Mock<IClarifierSessionStore>();
        var creatorIdeas = new Mock<WebApp.Services.Repository.ICreatorIdeaStore>();
        var jobs = new Mock<IAiJobService>();
        var credits = new Mock<IAiCreditService>();
        var audit = new Mock<IAuditLogger>();

        sessionStore.Setup(s => s.GetOwnedAsync(_planId, UserId))
            .ReturnsAsync(new BusinessPlanSession { Id = _planId, OwnerUserId = UserId, ClarifierSessionId = _clarifierId, CurrentVersion = 1, Status = terminalStatus });

        clarifierStore.Setup(c => c.GetOwnedAsync(_clarifierId, UserId))
            .ReturnsAsync(new ClarifierSession { Id = _clarifierId, OwnerUserId = UserId, Status = "Completed", Output = new BsonDocument("v", 1) });

        // Lock acquisition succeeds because status is terminal (not Pending/Processing) and InFlightKey was cleared
        sessionStore.Setup(s => s.TryAcquireRegenerateLockAsync(_planId, UserId))
            .ReturnsAsync((true, new BusinessPlanSession { Id = _planId, OwnerUserId = UserId, Status = "Processing" }));

        jobs.Setup(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()))
            .ReturnsAsync("new-bp-job");

        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { BusinessPlan = true },
            CreditCosts = new Dictionary<string, int> { ["BusinessPlan"] = 5 }
        };

        var controller = new BusinessPlanController(
            sessionStore.Object,
            clarifierStore.Object,
            creatorIdeas.Object,
            jobs.Object,
            credits.Object,
            audit.Object,
            Options.Create(settings),
            NullLogger<BusinessPlanController>.Instance,
            new Mock<IServiceProvider>().Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }))
            }
        };

        var result = await controller.Regenerate(_planId);

        result.Should().BeOfType<OkObjectResult>();
        credits.Verify(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>()), Times.Once);
        jobs.Verify(j => j.EnqueueAsync(AiJobType.BusinessPlan, UserId, It.IsAny<BsonDocument>()), Times.Once);
    }

    // ==========================================
    // 4. MARKET STUDY IN-FLIGHT DUPLICATE GUARD
    // ==========================================

    [Fact]
    public async Task MarketStudy_Start_WhenDuplicateInFlight_ReturnsExistingSession_AndDebitsZeroCredits()
    {
        var sessionStore = new Mock<IMarketStudySessionStore>();
        var clarifierStore = new Mock<IClarifierSessionStore>();
        var creatorIdeas = new Mock<WebApp.Services.Repository.ICreatorIdeaStore>();
        var jobs = new Mock<IAiJobService>();
        var credits = new Mock<IAiCreditService>();
        var audit = new Mock<IAuditLogger>();

        clarifierStore.Setup(c => c.GetOwnedAsync(_clarifierId, UserId))
            .ReturnsAsync(new ClarifierSession { Id = _clarifierId, OwnerUserId = UserId, Status = "Completed", Output = new BsonDocument("v", 1) });

        var inFlightSession = new MarketStudySession
        {
            Id = "existing-ms-session",
            OwnerUserId = UserId,
            ClarifierSessionId = _clarifierId,
            Status = "Processing",
            RequestId = "existing-job-ms"
        };

        sessionStore.Setup(s => s.TryCreateInFlightAsync(It.IsAny<MarketStudySession>()))
            .ReturnsAsync((false, inFlightSession));

        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { MarketStudy = true },
            CreditCosts = new Dictionary<string, int> { ["MarketStudy"] = 20 }
        };

        var controller = new MarketStudyController(
            sessionStore.Object,
            clarifierStore.Object,
            creatorIdeas.Object,
            jobs.Object,
            credits.Object,
            audit.Object,
            Options.Create(settings),
            NullLogger<MarketStudyController>.Instance);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }))
            }
        };

        var result = await controller.Start(new StartMarketStudyRequest { ClarifierSessionId = _clarifierId });

        result.Should().BeOfType<OkObjectResult>();
        credits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string>()), Times.Never);
        jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
    }

    // ==========================================
    // 5. BUSINESS MODEL IN-FLIGHT DUPLICATE GUARD
    // ==========================================

    [Fact]
    public async Task BusinessModel_Start_WhenDuplicateInFlight_ReturnsExistingSession_AndDebitsZeroCredits()
    {
        var sessionStore = new Mock<IBusinessModelSessionStore>();
        var marketStudyStore = new Mock<IMarketStudySessionStore>();
        var clarifierStore = new Mock<IClarifierSessionStore>();
        var creatorIdeas = new Mock<WebApp.Services.Repository.ICreatorIdeaStore>();
        var jobs = new Mock<IAiJobService>();
        var credits = new Mock<IAiCreditService>();
        var audit = new Mock<IAuditLogger>();

        var msId = ObjectId.GenerateNewId().ToString();
        marketStudyStore.Setup(c => c.GetOwnedAsync(msId, UserId))
            .ReturnsAsync(new MarketStudySession
            {
                Id = msId,
                OwnerUserId = UserId,
                ClarifierSessionId = _clarifierId,
                Status = "Completed",
                Versions = new List<MarketStudyVersion> { new MarketStudyVersion { Version = 1 } }
            });

        var inFlightSession = new BusinessModelSession
        {
            Id = "existing-bm-session",
            OwnerUserId = UserId,
            MarketStudySessionId = msId,
            Status = "Processing",
            RequestId = "existing-job-bm"
        };

        sessionStore.Setup(s => s.TryCreateInFlightAsync(It.IsAny<BusinessModelSession>()))
            .ReturnsAsync((false, inFlightSession));

        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { BusinessModel = true },
            CreditCosts = new Dictionary<string, int> { ["BusinessModel"] = 18 }
        };

        var controller = new BusinessModelController(
            sessionStore.Object,
            marketStudyStore.Object,
            clarifierStore.Object,
            creatorIdeas.Object,
            jobs.Object,
            credits.Object,
            audit.Object,
            Options.Create(settings),
            NullLogger<BusinessModelController>.Instance);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }))
            }
        };

        var result = await controller.Start(new StartBusinessModelRequest { MarketStudySessionId = msId });

        result.Should().BeOfType<OkObjectResult>();
        credits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string>()), Times.Never);
        jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
    }
}


