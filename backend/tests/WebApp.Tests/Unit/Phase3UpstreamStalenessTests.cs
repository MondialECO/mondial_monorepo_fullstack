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
using WebApp.Services.Implementations;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 3 outputs flag when their upstream input moved on (stale signal), and regenerate always
/// builds from the CURRENT upstream: C-2 for Market Study / Business Plan, Market Study for Business Model.
/// </summary>
public class Phase3UpstreamStalenessTests
{
    private const string UserId = "user-1";
    private static readonly DateTime T0 = new(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly string _ideaId = ObjectId.GenerateNewId().ToString();
    private readonly string _oldClarifier = ObjectId.GenerateNewId().ToString();
    private readonly string _newClarifier = ObjectId.GenerateNewId().ToString();

    private readonly Mock<IClarifierSessionStore> _clarifiers = new();
    private readonly Mock<ICreatorIdeaStore> _ideas = new();
    private readonly Mock<IAiJobService> _jobs = new();
    private readonly Mock<IAiCreditService> _credits = new();
    private readonly Mock<IAuditLogger> _audit = new();
    private BsonDocument? _enqueued;

    public Phase3UpstreamStalenessTests()
    {
        _jobs.Setup(j => j.EnqueueAsync(It.IsAny<AiJobType>(), UserId, It.IsAny<BsonDocument?>()))
            .Callback<AiJobType, string, BsonDocument?>((_, _, input) => _enqueued = input)
            .ReturnsAsync("job-1");
        foreach (var id in new[] { _oldClarifier, _newClarifier })
            _clarifiers.Setup(c => c.GetOwnedAsync(id, UserId)).ReturnsAsync(new ClarifierSession
            {
                Id = id, OwnerUserId = UserId, Status = "Completed", Output = new BsonDocument("schemaVersion", 1),
            });
    }

    private void IdeaWith(string? clarifierSessionId = null, string? marketStudySessionId = null) =>
        _ideas.Setup(i => i.GetOwnedAsync(_ideaId, UserId)).ReturnsAsync(new CreatorIdea
        {
            Id = _ideaId, UserId = UserId,
            Phase2Data = new CreatorPhase2Data { ClarifierSessionId = clarifierSessionId },
            Phase3Data = new CreatorPhase3Data { MarketStudySessionId = marketStudySessionId },
        });

    private static T Authed<T>(T controller) where T : ControllerBase
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, UserId) })),
            },
        };
        return controller;
    }

    private static TDto Data<TDto>(IActionResult result) =>
        (TDto)((ApiResponse)((OkObjectResult)result).Value!).Data!;

    // ---------------- pure rules ----------------

    [Theory]
    [InlineData("a", "b", true)]
    [InlineData("a", "a", false)]
    [InlineData("a", null, false)]
    [InlineData(null, "b", false)]
    public void ClarifierStale(string? builtFrom, string? current, bool stale) =>
        Phase3UpstreamStaleness.ClarifierStale(builtFrom, current).Should().Be(stale);

    [Fact]
    public void MarketStudyStale_NewSession_NewerVersion_LegacyTimestamps_UnknownCurrent()
    {
        Phase3UpstreamStaleness.MarketStudyStale("ms1", 1, T0, "ms2", 1, T0).Should().BeTrue("different market study session");
        Phase3UpstreamStaleness.MarketStudyStale("ms1", 1, T0, "ms1", 2, T0).Should().BeTrue("market study regenerated");
        Phase3UpstreamStaleness.MarketStudyStale("ms1", 2, T0, "ms1", 2, T0.AddDays(1)).Should().BeFalse("same version");
        Phase3UpstreamStaleness.MarketStudyStale("ms1", null, T0, "ms1", 2, T0.AddDays(1)).Should().BeTrue("legacy: study newer than model");
        Phase3UpstreamStaleness.MarketStudyStale("ms1", null, T0.AddDays(2), "ms1", 2, T0.AddDays(1)).Should().BeFalse();
        Phase3UpstreamStaleness.MarketStudyStale("ms1", 1, T0, null, null, null).Should().BeFalse("current unknown");
    }

    // ---------------- Market Study ----------------

    private (MarketStudyController controller, Mock<IMarketStudySessionStore> store) MarketStudy(MarketStudySession session)
    {
        var store = new Mock<IMarketStudySessionStore>();
        store.Setup(s => s.GetOwnedAsync(session.Id, UserId)).ReturnsAsync(session);
        store.Setup(s => s.TryAcquireRegenerateLockAsync(session.Id, UserId)).ReturnsAsync((true, session));
        var controller = new MarketStudyController(store.Object, _clarifiers.Object, _ideas.Object, _jobs.Object, _credits.Object,
            _audit.Object, Options.Create(new AiSettings { Enabled = true, Features = new AiFeatureFlags { MarketStudy = true } }),
            NullLogger<MarketStudyController>.Instance);
        return (Authed(controller), store);
    }

    private MarketStudySession StudySession(string? builtFrom) => new()
    {
        Id = ObjectId.GenerateNewId().ToString(), OwnerUserId = UserId, BusinessIdeaId = _ideaId,
        ClarifierSessionId = _oldClarifier, Status = "Completed", CurrentVersion = 1,
        Versions = new() { new MarketStudyVersion { Version = 1, Content = new BsonDocument(), BuiltFromClarifierSessionId = builtFrom } },
    };

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task MarketStudy_Get_IsStale_OnlyWhenC2SummaryChanged(bool summaryChanged)
    {
        IdeaWith(clarifierSessionId: summaryChanged ? _newClarifier : _oldClarifier);
        var session = StudySession(_oldClarifier);
        var (controller, _) = MarketStudy(session);

        Data<MarketStudySessionDto>(await controller.Get(session.Id)).UpstreamStale.Should().Be(summaryChanged);
    }

    [Fact]
    public async Task MarketStudy_Get_LegacyVersionFallsBackToSessionClarifier()
    {
        IdeaWith(clarifierSessionId: _newClarifier);
        var session = StudySession(builtFrom: null);
        var (controller, _) = MarketStudy(session);

        Data<MarketStudySessionDto>(await controller.Get(session.Id)).UpstreamStale.Should().BeTrue();
    }

    [Fact]
    public async Task MarketStudy_Regenerate_UsesCurrentC2Summary()
    {
        IdeaWith(clarifierSessionId: _newClarifier);
        var session = StudySession(_oldClarifier);
        var (controller, _) = MarketStudy(session);

        (await controller.Regenerate(session.Id)).Should().BeOfType<OkObjectResult>();

        _enqueued!["clarifierSessionId"].AsString.Should().Be(_newClarifier);
    }

    // ---------------- Business Plan ----------------

    private BusinessPlanSession PlanSession(string? builtFrom) => new()
    {
        Id = ObjectId.GenerateNewId().ToString(), OwnerUserId = UserId, BusinessIdeaId = _ideaId,
        ClarifierSessionId = _oldClarifier, Status = "Completed", CurrentVersion = 1,
        Versions = new() { new BusinessPlanVersion { Version = 1, Content = new BsonDocument(), BuiltFromClarifierSessionId = builtFrom } },
    };

    private BusinessPlanController Plan(BusinessPlanSession session)
    {
        var store = new Mock<IBusinessPlanSessionStore>();
        store.Setup(s => s.GetOwnedAsync(session.Id, UserId)).ReturnsAsync(session);
        store.Setup(s => s.TryAcquireRegenerateLockAsync(session.Id, UserId)).ReturnsAsync((true, session));
        return Authed(new BusinessPlanController(store.Object, _clarifiers.Object, _ideas.Object, _jobs.Object, _credits.Object,
            _audit.Object, Options.Create(new AiSettings { Enabled = true, Features = new AiFeatureFlags { BusinessPlan = true } }),
            NullLogger<BusinessPlanController>.Instance, new Mock<IServiceProvider>().Object));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task BusinessPlan_Get_IsStale_OnlyWhenC2SummaryChanged(bool summaryChanged)
    {
        IdeaWith(clarifierSessionId: summaryChanged ? _newClarifier : _oldClarifier);
        var session = PlanSession(_oldClarifier);

        Data<BusinessPlanSessionDto>(await Plan(session).Get(session.Id)).UpstreamStale.Should().Be(summaryChanged);
    }

    [Fact]
    public async Task BusinessPlan_Regenerate_UsesCurrentC2Summary()
    {
        IdeaWith(clarifierSessionId: _newClarifier);
        var session = PlanSession(_oldClarifier);

        (await Plan(session).Regenerate(session.Id)).Should().BeOfType<OkObjectResult>();

        _enqueued!["clarifierSessionId"].AsString.Should().Be(_newClarifier);
    }

    // ---------------- Business Model (chain: depends on the current Market Study) ----------------

    private MarketStudySession CurrentStudy(string id, int version) => new()
    {
        Id = id, OwnerUserId = UserId, BusinessIdeaId = _ideaId, ClarifierSessionId = _newClarifier,
        Status = "Completed", CurrentVersion = version,
        Versions = Enumerable.Range(1, version)
            .Select(v => new MarketStudyVersion { Version = v, Content = new BsonDocument(), CreatedAt = T0.AddDays(v) })
            .ToList(),
    };

    private BusinessModelController Model(BusinessModelSession session, params MarketStudySession[] studies)
    {
        var store = new Mock<IBusinessModelSessionStore>();
        store.Setup(s => s.GetOwnedAsync(session.Id, UserId)).ReturnsAsync(session);
        store.Setup(s => s.TryAcquireRegenerateLockAsync(session.Id, UserId)).ReturnsAsync((true, session));
        var studyStore = new Mock<IMarketStudySessionStore>();
        foreach (var s in studies)
            studyStore.Setup(m => m.GetOwnedAsync(s.Id, UserId)).ReturnsAsync(s);
        return Authed(new BusinessModelController(store.Object, studyStore.Object, _clarifiers.Object, _ideas.Object, _jobs.Object,
            _credits.Object, _audit.Object,
            Options.Create(new AiSettings { Enabled = true, Features = new AiFeatureFlags { BusinessModel = true } }),
            NullLogger<BusinessModelController>.Instance));
    }

    private BusinessModelSession ModelSession(string studyId, int? studyVersion) => new()
    {
        Id = ObjectId.GenerateNewId().ToString(), OwnerUserId = UserId, BusinessIdeaId = _ideaId,
        MarketStudySessionId = studyId, ClarifierSessionId = _oldClarifier, Status = "Completed", CurrentVersion = 1,
        Versions = new()
        {
            new BusinessModelVersion
            {
                Version = 1, Content = new BsonDocument(), CreatedAt = T0.AddDays(1).AddHours(1),
                BuiltFromMarketStudySessionId = studyId, BuiltFromMarketStudyVersion = studyVersion,
            },
        },
    };

    [Fact]
    public async Task BusinessModel_Get_IsStale_AfterMarketStudyRegenerated()
    {
        var studyId = ObjectId.GenerateNewId().ToString();
        IdeaWith(marketStudySessionId: studyId);
        var model = ModelSession(studyId, studyVersion: 1);

        Data<BusinessModelSessionDto>(await Model(model, CurrentStudy(studyId, version: 1)).Get(model.Id))
            .UpstreamStale.Should().BeFalse("built from the current market study version");
        Data<BusinessModelSessionDto>(await Model(model, CurrentStudy(studyId, version: 2)).Get(model.Id))
            .UpstreamStale.Should().BeTrue("the market study was regenerated after the business model");
    }

    [Fact]
    public async Task BusinessModel_Get_IsStale_WhenIdeaHasANewMarketStudy()
    {
        var oldStudy = ObjectId.GenerateNewId().ToString();
        var newStudy = ObjectId.GenerateNewId().ToString();
        IdeaWith(marketStudySessionId: newStudy);
        var model = ModelSession(oldStudy, studyVersion: 1);

        Data<BusinessModelSessionDto>(await Model(model, CurrentStudy(newStudy, 1)).Get(model.Id)).UpstreamStale.Should().BeTrue();
    }

    [Fact]
    public async Task BusinessModel_Regenerate_UsesCurrentMarketStudyAndItsVersion()
    {
        var oldStudy = ObjectId.GenerateNewId().ToString();
        var newStudy = ObjectId.GenerateNewId().ToString();
        IdeaWith(marketStudySessionId: newStudy);
        var model = ModelSession(oldStudy, studyVersion: 1);

        (await Model(model, CurrentStudy(oldStudy, 1), CurrentStudy(newStudy, 3)).Regenerate(model.Id)).Should().BeOfType<OkObjectResult>();

        _enqueued!["marketStudySessionId"].AsString.Should().Be(newStudy);
        _enqueued["marketStudyVersion"].AsInt32.Should().Be(3);
        _enqueued["clarifierSessionId"].AsString.Should().Be(_newClarifier);
    }

    [Fact]
    public async Task BusinessModel_Regenerate_AfterMarketStudyRegeneratedFromNewC2_SendsTheNewC2()
    {
        // The study's session-level reference still names the C-2 it was FIRST built from;
        // its current version (v2) was built from the new C-2.
        var studyId = ObjectId.GenerateNewId().ToString();
        var study = new MarketStudySession
        {
            Id = studyId, OwnerUserId = UserId, BusinessIdeaId = _ideaId, ClarifierSessionId = _oldClarifier,
            Status = "Completed", CurrentVersion = 2,
            Versions = new()
            {
                new MarketStudyVersion { Version = 1, Content = new BsonDocument(), BuiltFromClarifierSessionId = _oldClarifier },
                new MarketStudyVersion { Version = 2, Content = new BsonDocument(), BuiltFromClarifierSessionId = _newClarifier },
            },
        };
        IdeaWith(clarifierSessionId: _newClarifier, marketStudySessionId: studyId);
        var model = ModelSession(studyId, studyVersion: 1);

        (await Model(model, study).Regenerate(model.Id)).Should().BeOfType<OkObjectResult>();

        _enqueued!["clarifierSessionId"].AsString.Should().Be(_newClarifier, "the C-2 behind the market study's current version");
        _enqueued["marketStudyVersion"].AsInt32.Should().Be(2);
    }

    [Fact]
    public void ResolveClarifier_PrefersCurrentVersionSource_ThenIdea_ThenSession()
    {
        var study = new MarketStudySession
        {
            ClarifierSessionId = "session-level", CurrentVersion = 1,
            Versions = new() { new MarketStudyVersion { Version = 1, BuiltFromClarifierSessionId = "from-version" } },
        };
        var idea = new CreatorIdea { Phase2Data = new CreatorPhase2Data { ClarifierSessionId = "idea-current" } };

        BusinessModelController.ResolveClarifierSessionId(study, idea, "fallback").Should().Be("from-version");
        study.Versions[0].BuiltFromClarifierSessionId = null;
        BusinessModelController.ResolveClarifierSessionId(study, idea, "fallback").Should().Be("idea-current");
        BusinessModelController.ResolveClarifierSessionId(study, null, "fallback").Should().Be("session-level");
        study.ClarifierSessionId = "";
        BusinessModelController.ResolveClarifierSessionId(study, null, "fallback").Should().Be("fallback");
    }
}
