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
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Audit;
using WebApp.Services.Repository.Ai;
using WebApp.Services.Repository;
using WebApp.Services;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit;

public class CreatorStabilizationTests
{
    private readonly Mock<IClarifierSessionStore> _clarifierSessions = new();
    private readonly Mock<IBusinessPlanSessionStore> _bpSessions = new();
    private readonly Mock<ICreatorIdeaStore> _creatorIdeas = new();
    private readonly Mock<IAiJobService> _jobs = new();
    private readonly Mock<IAiCreditService> _credits = new();
    private readonly Mock<IAuditLogger> _audit = new();

    private const string CreatorAId = "creator-a";
    private const string CreatorBId = "creator-b";
    private const string IdeaAId = "65b00000000000000000000a";
    private const string IdeaBId = "65b00000000000000000000b";

    public CreatorStabilizationTests()
    {
        _creatorIdeas.Setup(x => x.GetOwnedAsync(IdeaAId, CreatorAId))
            .ReturnsAsync(new CreatorIdea { Id = IdeaAId, UserId = CreatorAId });
        _creatorIdeas.Setup(x => x.GetOwnedAsync(IdeaBId, CreatorBId))
            .ReturnsAsync(new CreatorIdea { Id = IdeaBId, UserId = CreatorBId });

        _creatorIdeas.Setup(x => x.GetOwnedAsync(IdeaBId, CreatorAId))
            .ReturnsAsync((CreatorIdea?)null);
        _creatorIdeas.Setup(x => x.GetOwnedAsync(IdeaAId, CreatorBId))
            .ReturnsAsync((CreatorIdea?)null);
    }

    private ClarifierController BuildClarifierController(string userId)
    {
        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { Clarifier = true }
        };
        var controller = new ClarifierController(
            _clarifierSessions.Object,
            _jobs.Object,
            _credits.Object,
            _audit.Object,
            Options.Create(settings),
            NullLogger<ClarifierController>.Instance,
            _creatorIdeas.Object);

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, userId) }));
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        return controller;
    }

    private BusinessPlanController BuildBusinessPlanController(string userId)
    {
        var settings = new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { BusinessPlan = true },
            CreditCosts = new Dictionary<string, int> { ["BusinessPlan"] = 5 }
        };
        var controller = new BusinessPlanController(
            _bpSessions.Object,
            _clarifierSessions.Object,
            _creatorIdeas.Object,
            _jobs.Object,
            _credits.Object,
            _audit.Object,
            Options.Create(settings),
            NullLogger<BusinessPlanController>.Instance,
            new Mock<IServiceProvider>().Object);

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, userId) }));
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        return controller;
    }

    [Fact]
    public async Task Clarifier_CreatorA_With_Own_IdeaA_Passes()
    {
        var controller = BuildClarifierController(CreatorAId);
        var req = new StartClarifierRequest
        {
            BusinessIdeaId = IdeaAId,
            RawIdea = new RawIdeaInput { Title = "Idea A", ProblemStatement = "Prob A", TargetAudience = "Aud A" }
        };

        var result = await controller.Start(req);
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Clarifier_CreatorA_With_IdeaB_Returns_404_NotFound()
    {
        var controller = BuildClarifierController(CreatorAId);
        var req = new StartClarifierRequest
        {
            BusinessIdeaId = IdeaBId,
            RawIdea = new RawIdeaInput { Title = "Idea B", ProblemStatement = "Prob B", TargetAudience = "Aud B" }
        };

        var result = await controller.Start(req);
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Clarifier_CreatorB_With_IdeaA_Returns_404_NotFound()
    {
        var controller = BuildClarifierController(CreatorBId);
        var req = new StartClarifierRequest
        {
            BusinessIdeaId = IdeaAId,
            RawIdea = new RawIdeaInput { Title = "Idea A", ProblemStatement = "Prob A", TargetAudience = "Aud A" }
        };

        var result = await controller.Start(req);
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Clarifier_Invalid_Random_IdeaId_Returns_404_NotFound_No_500()
    {
        var controller = BuildClarifierController(CreatorAId);
        var req = new StartClarifierRequest
        {
            BusinessIdeaId = "not-a-valid-object-id-12345",
            RawIdea = new RawIdeaInput { Title = "Random", ProblemStatement = "Prob", TargetAudience = "Aud" }
        };

        var result = await controller.Start(req);
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task BusinessPlan_CreatorA_With_Foreign_IdeaB_Returns_404_NotFound()
    {
        var clarifierSessionId = ObjectId.GenerateNewId().ToString();
        _clarifierSessions.Setup(x => x.GetOwnedAsync(clarifierSessionId, CreatorAId))
            .ReturnsAsync(new ClarifierSession
            {
                Id = clarifierSessionId,
                OwnerUserId = CreatorAId,
                Status = "Completed",
                Output = new BsonDocument { ["clarityScore"] = 90 },
                BusinessIdeaId = null // caller tries to supply IdeaB in request
            });

        var controller = BuildBusinessPlanController(CreatorAId);
        var req = new StartBusinessPlanRequest
        {
            ClarifierSessionId = clarifierSessionId,
            BusinessIdeaId = IdeaBId // Idea B belongs to Creator B!
        };

        var result = await controller.Start(req);
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task BusinessPlan_CreatorA_With_Own_IdeaA_Passes()
    {
        var clarifierSessionId = ObjectId.GenerateNewId().ToString();
        _clarifierSessions.Setup(x => x.GetOwnedAsync(clarifierSessionId, CreatorAId))
            .ReturnsAsync(new ClarifierSession
            {
                Id = clarifierSessionId,
                OwnerUserId = CreatorAId,
                Status = "Completed",
                Output = new BsonDocument { ["clarityScore"] = 90 },
                BusinessIdeaId = IdeaAId
            });

        var controller = BuildBusinessPlanController(CreatorAId);
        var req = new StartBusinessPlanRequest
        {
            ClarifierSessionId = clarifierSessionId,
            BusinessIdeaId = IdeaAId
        };

        var result = await controller.Start(req);
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Clarifier_List_With_Foreign_IdeaId_Returns_404_NotFound()
    {
        var controller = BuildClarifierController(CreatorAId);
        var result = await controller.List(businessIdeaId: IdeaBId);
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Clarifier_List_With_Own_IdeaId_Returns_200_Ok()
    {
        _clarifierSessions.Setup(x => x.ListByIdeaAsync(IdeaAId, CreatorAId, 0, 30))
            .ReturnsAsync(new List<ClarifierSession>());

        var controller = BuildClarifierController(CreatorAId);
        var result = await controller.List(businessIdeaId: IdeaAId);
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task BusinessPlan_List_With_Foreign_IdeaId_Returns_404_NotFound()
    {
        var controller = BuildBusinessPlanController(CreatorAId);
        var result = await controller.List(businessIdeaId: IdeaBId);
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task BusinessPlan_List_With_Own_IdeaId_Returns_200_Ok()
    {
        _bpSessions.Setup(x => x.ListByIdeaAsync(IdeaAId, CreatorAId, 0, 30))
            .ReturnsAsync(new List<BusinessPlanSession>());

        var controller = BuildBusinessPlanController(CreatorAId);
        var result = await controller.List(businessIdeaId: IdeaAId);
        result.Should().BeOfType<OkObjectResult>();
    }

    private static MongoDB.Driver.IAsyncCursor<T> MakeCursor<T>(List<T> items)
    {
        var mockCursor = new Mock<MongoDB.Driver.IAsyncCursor<T>>();
        var moved = false;
        mockCursor.Setup(c => c.MoveNext(It.IsAny<CancellationToken>()))
            .Returns(() => { if (!moved) { moved = true; return true; } return false; });
        mockCursor.Setup(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => { if (!moved) { moved = true; return true; } return false; });
        mockCursor.Setup(c => c.Current).Returns(items);
        return mockCursor.Object;
    }

    [Fact]
    public async Task Dashboard_Stats_Reports_Canonical_Idea_Count_Multi_Idea()
    {
        var dbMock = new Mock<MongoDB.Driver.IMongoDatabase>();
        var ideasColMock = new Mock<MongoDB.Driver.IMongoCollection<CreatorIdea>>();
        var dealsColMock = new Mock<MongoDB.Driver.IMongoCollection<DealExecution>>();
        var clicksColMock = new Mock<MongoDB.Driver.IMongoCollection<IdeaClick>>();
        var usersColMock = new Mock<MongoDB.Driver.IMongoCollection<ApplicationUser>>();

        dbMock.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null)).Returns(ideasColMock.Object);
        dbMock.Setup(d => d.GetCollection<DealExecution>("DealExecutions", null)).Returns(dealsColMock.Object);
        dbMock.Setup(d => d.GetCollection<IdeaClick>("IdeaClicks", null)).Returns(clicksColMock.Object);
        dbMock.Setup(d => d.GetCollection<ApplicationUser>("applicationUsers", null)).Returns(usersColMock.Object);

        // Creator A has 3 canonical CreatorIdeas
        var creatorAIdeas = new List<CreatorIdea>
        {
            new CreatorIdea { Id = "65b000000000000000000001", UserId = CreatorAId, Project = new CreatorJourneyProject { Name = "Idea 1" } },
            new CreatorIdea { Id = "65b000000000000000000002", UserId = CreatorAId, Project = new CreatorJourneyProject { Name = "Idea 2" } },
            new CreatorIdea { Id = "65b000000000000000000003", UserId = CreatorAId, Project = new CreatorJourneyProject { Name = "Idea 3" } },
        };

        ideasColMock.Setup(c => c.FindAsync(It.IsAny<MongoDB.Driver.FilterDefinition<CreatorIdea>>(), It.IsAny<MongoDB.Driver.FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MakeCursor(creatorAIdeas));
        dealsColMock.Setup(c => c.FindAsync(It.IsAny<MongoDB.Driver.FilterDefinition<DealExecution>>(), It.IsAny<MongoDB.Driver.FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MakeCursor(new List<DealExecution>()));

        var context = new MongoDbContext(dbMock.Object);

        var userStoreMock = new Mock<Microsoft.AspNetCore.Identity.IUserStore<ApplicationUser>>();
        var userManager = new Microsoft.AspNetCore.Identity.UserManager<ApplicationUser>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!
        );
        var appUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "creatorA", Onboarding = new OnboardingState { Phase = 2 } };
        userStoreMock.Setup(u => u.FindByIdAsync(CreatorAId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(appUser);

        var journeysMock = new Mock<ICreatorJourneyService>();
        journeysMock.Setup(j => j.GetOrCreateComposedAsync(CreatorAId, null))
            .ReturnsAsync(new CreatorJourney { UserId = CreatorAId, Phase3Data = new CreatorPhase3Data { InvestorReadinessScore = new CreatorInvestorReadinessScore { Total = 85, Label = "Strong" } } });

        var controller = new CreatorController(
            Mock.Of<IBusinessIdeasService>(),
            Mock.Of<IInvestmentsService>(),
            Mock.Of<ITransactionsService>(),
            null!,
            context,
            userManager,
            journeysMock.Object
        );

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, CreatorAId) }));
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = user } };

        var actionResult = await controller.GetCreatorDashboard();
        var okResult = actionResult.Should().BeOfType<OkObjectResult>().Subject;
        var json = System.Text.Json.JsonSerializer.Serialize(okResult.Value);
        var doc = System.Text.Json.JsonDocument.Parse(json);

        doc.RootElement.GetProperty("totalIdeas").GetInt32().Should().Be(3);
        doc.RootElement.GetProperty("ideas").GetArrayLength().Should().Be(3);
    }

    [Fact]
    public async Task Dashboard_Stats_Zero_Data_Creator_Returns_200_With_Zeros()
    {
        var dbMock = new Mock<MongoDB.Driver.IMongoDatabase>();
        var ideasColMock = new Mock<MongoDB.Driver.IMongoCollection<CreatorIdea>>();
        var dealsColMock = new Mock<MongoDB.Driver.IMongoCollection<DealExecution>>();
        var clicksColMock = new Mock<MongoDB.Driver.IMongoCollection<IdeaClick>>();
        var usersColMock = new Mock<MongoDB.Driver.IMongoCollection<ApplicationUser>>();

        dbMock.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null)).Returns(ideasColMock.Object);
        dbMock.Setup(d => d.GetCollection<DealExecution>("DealExecutions", null)).Returns(dealsColMock.Object);
        dbMock.Setup(d => d.GetCollection<IdeaClick>("IdeaClicks", null)).Returns(clicksColMock.Object);
        dbMock.Setup(d => d.GetCollection<ApplicationUser>("applicationUsers", null)).Returns(usersColMock.Object);

        // Zero ideas
        ideasColMock.Setup(c => c.FindAsync(It.IsAny<MongoDB.Driver.FilterDefinition<CreatorIdea>>(), It.IsAny<MongoDB.Driver.FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MakeCursor(new List<CreatorIdea>()));
        dealsColMock.Setup(c => c.FindAsync(It.IsAny<MongoDB.Driver.FilterDefinition<DealExecution>>(), It.IsAny<MongoDB.Driver.FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MakeCursor(new List<DealExecution>()));

        var context = new MongoDbContext(dbMock.Object);

        var userStoreMock = new Mock<Microsoft.AspNetCore.Identity.IUserStore<ApplicationUser>>();
        var userManager = new Microsoft.AspNetCore.Identity.UserManager<ApplicationUser>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!
        );
        var appUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "newCreator", Onboarding = new OnboardingState { Phase = 1 } };
        userStoreMock.Setup(u => u.FindByIdAsync("new-creator", It.IsAny<CancellationToken>()))
            .ReturnsAsync(appUser);

        var journeysMock = new Mock<ICreatorJourneyService>();
        journeysMock.Setup(j => j.GetOrCreateComposedAsync("new-creator", null))
            .ReturnsAsync(new CreatorJourney { UserId = "new-creator" });

        var controller = new CreatorController(
            Mock.Of<IBusinessIdeasService>(),
            Mock.Of<IInvestmentsService>(),
            Mock.Of<ITransactionsService>(),
            null!,
            context,
            userManager,
            journeysMock.Object
        );

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, "new-creator") }));
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = user } };

        var actionResult = await controller.GetCreatorDashboard();
        var okResult = actionResult.Should().BeOfType<OkObjectResult>().Subject;
        var json = System.Text.Json.JsonSerializer.Serialize(okResult.Value);
        var doc = System.Text.Json.JsonDocument.Parse(json);

        doc.RootElement.GetProperty("totalIdeas").GetInt32().Should().Be(0);
        doc.RootElement.GetProperty("totalFundRaised").GetDouble().Should().Be(0.0);
        doc.RootElement.GetProperty("totalRequired").GetDouble().Should().Be(0.0);
        doc.RootElement.GetProperty("ideas").GetArrayLength().Should().Be(0);
    }
}
