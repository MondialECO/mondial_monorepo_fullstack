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
/// Unit tests verifying the BusinessPlan lifecycle: credit debit, session persistence,
/// job enqueue, compensation/refund on downstream failure, and truthful audit logging.
/// </summary>
public class BusinessPlanControllerTests
{
    private readonly Mock<IBusinessPlanSessionStore> _sessions = new();
    private readonly Mock<IClarifierSessionStore> _clarifiers = new();
    private readonly Mock<IAiJobService> _jobs = new();
    private readonly Mock<IAiCreditService> _credits = new();
    private readonly Mock<IAuditLogger> _audit = new();

    private const string UserId = "user-1";
    private readonly string _clarifierId = ObjectId.GenerateNewId().ToString();

    private BusinessPlanController BuildController(AiSettings? settings = null)
    {
        settings ??= new AiSettings
        {
            Enabled = true,
            Features = new AiFeatureFlags { BusinessPlan = true },
            CreditCosts = new Dictionary<string, int> { ["BusinessPlan"] = 5 }
        };

        var controller = new BusinessPlanController(
            _sessions.Object,
            _clarifiers.Object,
            _jobs.Object,
            _credits.Object,
            _audit.Object,
            Options.Create(settings),
            NullLogger<BusinessPlanController>.Instance,
            new Mock<IServiceProvider>().Object);

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

    // ---- A. Insufficient credits ----

    [Fact]
    public async Task Start_WithInsufficientCredits_Returns402_NoSession_NoJob_NoSuccessAudit_AndFailureAuditRecorded()
    {
        SetupCompletedClarifier(_clarifierId);
        _credits.Setup(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>()))
            .ThrowsAsync(new InsufficientCreditsException("Insufficient credits", 402));

        var controller = BuildController();
        var result = await controller.Start(new StartBusinessPlanRequest { ClarifierSessionId = _clarifierId });

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(402);
        _sessions.Verify(s => s.AddAsync(It.IsAny<BusinessPlanSession>()), Times.Never);
        _jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
        _audit.Verify(a => a.Record("BusinessPlan.Start", UserId, true, It.IsAny<object>()), Times.Never);
        _audit.Verify(a => a.Record("BusinessPlan.Start", UserId, false, It.IsAny<object>()), Times.Once);
        _credits.Verify(c => c.RefundForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    // ---- B. Exact / sufficient credits ----

    [Fact]
    public async Task Start_WithSufficientCredits_Returns200_CreatesSession_EnqueuesJob_RecordsSuccessAudit()
    {
        SetupCompletedClarifier(_clarifierId);
        _credits.Setup(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>())).Returns(Task.CompletedTask);
        _jobs.Setup(j => j.EnqueueAsync(AiJobType.BusinessPlan, UserId, It.IsAny<BsonDocument>())).ReturnsAsync("job-123");

        var controller = BuildController();
        var result = await controller.Start(new StartBusinessPlanRequest { ClarifierSessionId = _clarifierId });

        result.Should().BeOfType<OkObjectResult>();
        _credits.Verify(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>()), Times.Once);
        _sessions.Verify(s => s.AddAsync(It.Is<BusinessPlanSession>(sp => sp.OwnerUserId == UserId && sp.ClarifierSessionId == _clarifierId)), Times.Once);
        _jobs.Verify(j => j.EnqueueAsync(AiJobType.BusinessPlan, UserId, It.IsAny<BsonDocument>()), Times.Once);
        _sessions.Verify(s => s.SetRequestIdAsync(It.IsAny<string>(), "job-123"), Times.Once);
        _audit.Verify(a => a.Record("BusinessPlan.Start", UserId, true, It.IsAny<object>()), Times.Once);
        _audit.Verify(a => a.Record("BusinessPlan.Start", UserId, false, It.IsAny<object>()), Times.Never);
    }

    // ---- D. Validation failure before debit ----

    [Fact]
    public async Task Start_WhenClarifierNotCompleted_ReturnsConflict_NoDebit_NoSession_NoJob_NoSuccessAudit()
    {
        _clarifiers.Setup(c => c.GetOwnedAsync(_clarifierId, UserId))
            .ReturnsAsync(new ClarifierSession { Id = _clarifierId, OwnerUserId = UserId, Status = "Pending", Output = null });

        var controller = BuildController();
        var result = await controller.Start(new StartBusinessPlanRequest { ClarifierSessionId = _clarifierId });

        result.Should().BeOfType<ConflictObjectResult>();
        _credits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>()), Times.Never);
        _sessions.Verify(s => s.AddAsync(It.IsAny<BusinessPlanSession>()), Times.Never);
        _jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
        _audit.Verify(a => a.Record(It.IsAny<string>(), It.IsAny<string>(), true, It.IsAny<object>()), Times.Never);
    }

    // ---- E. Session persistence failure after debit ----

    [Fact]
    public async Task Start_WhenSessionPersistenceFailsAfterDebit_CompensatesCredit_Returns500_NoAcceptedJob_NoSuccessAudit()
    {
        SetupCompletedClarifier(_clarifierId);
        _credits.Setup(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>())).Returns(Task.CompletedTask);
        _sessions.Setup(s => s.AddAsync(It.IsAny<BusinessPlanSession>())).ThrowsAsync(new TimeoutException("Mongo connection failed"));

        var controller = BuildController();
        var result = await controller.Start(new StartBusinessPlanRequest { ClarifierSessionId = _clarifierId });

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
        _credits.Verify(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>()), Times.Once);
        _credits.Verify(c => c.RefundForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        _jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
        _audit.Verify(a => a.Record("BusinessPlan.Start", UserId, true, It.IsAny<object>()), Times.Never);
        _audit.Verify(a => a.Record("BusinessPlan.Start", UserId, false, It.IsAny<object>()), Times.Once);
    }

    // ---- F. Job enqueue failure after debit/session creation ----

    [Fact]
    public async Task Start_WhenJobEnqueueFailsAfterDebitAndSessionCreation_CompensatesCredit_CleansUpSession_Returns500_NoSuccessAudit()
    {
        SetupCompletedClarifier(_clarifierId);
        var sessionId = ObjectId.GenerateNewId().ToString();
        _credits.Setup(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>())).Returns(Task.CompletedTask);
        _sessions.Setup(s => s.AddAsync(It.IsAny<BusinessPlanSession>()))
            .Callback<BusinessPlanSession>(s => s.Id = sessionId)
            .Returns(Task.CompletedTask);
        _jobs.Setup(j => j.EnqueueAsync(AiJobType.BusinessPlan, UserId, It.IsAny<BsonDocument>()))
            .ThrowsAsync(new InvalidOperationException("Hangfire queue unreachable"));

        var controller = BuildController();
        var result = await controller.Start(new StartBusinessPlanRequest { ClarifierSessionId = _clarifierId });

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
        _credits.Verify(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>()), Times.Once);
        _credits.Verify(c => c.RefundForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        _sessions.Verify(s => s.DeleteAsync(sessionId), Times.Once);
        _audit.Verify(a => a.Record("BusinessPlan.Start", UserId, true, It.IsAny<object>()), Times.Never);
        _audit.Verify(a => a.Record("BusinessPlan.Start", UserId, false, It.IsAny<object>()), Times.Once);
    }

    // ---- Regenerate Insufficient Credits & Compensation ----

    [Fact]
    public async Task Regenerate_WithInsufficientCredits_Returns402_NoJob_NoSuccessAudit_AndFailureAuditRecorded()
    {
        var sessionId = ObjectId.GenerateNewId().ToString();
        _sessions.Setup(s => s.GetOwnedAsync(sessionId, UserId))
            .ReturnsAsync(new BusinessPlanSession { Id = sessionId, OwnerUserId = UserId, ClarifierSessionId = _clarifierId });
        SetupCompletedClarifier(_clarifierId);
        _credits.Setup(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>()))
            .ThrowsAsync(new InsufficientCreditsException("Insufficient credits", 402));

        var controller = BuildController();
        var result = await controller.Regenerate(sessionId);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(402);
        _jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
        _audit.Verify(a => a.Record("BusinessPlan.Regenerate", UserId, true, It.IsAny<object>()), Times.Never);
        _audit.Verify(a => a.Record("BusinessPlan.Regenerate", UserId, false, It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task Regenerate_WhenEnqueueFailsAfterDebit_CompensatesCredit_Returns500_NoSuccessAudit()
    {
        var sessionId = ObjectId.GenerateNewId().ToString();
        _sessions.Setup(s => s.GetOwnedAsync(sessionId, UserId))
            .ReturnsAsync(new BusinessPlanSession { Id = sessionId, OwnerUserId = UserId, ClarifierSessionId = _clarifierId });
        SetupCompletedClarifier(_clarifierId);
        _credits.Setup(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>())).Returns(Task.CompletedTask);
        _jobs.Setup(j => j.EnqueueAsync(AiJobType.BusinessPlan, UserId, It.IsAny<BsonDocument>()))
            .ThrowsAsync(new InvalidOperationException("Hangfire queue unreachable"));

        var controller = BuildController();
        var result = await controller.Regenerate(sessionId);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
        _credits.Verify(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>()), Times.Once);
        _credits.Verify(c => c.RefundForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        _audit.Verify(a => a.Record("BusinessPlan.Regenerate", UserId, true, It.IsAny<object>()), Times.Never);
        _audit.Verify(a => a.Record("BusinessPlan.Regenerate", UserId, false, It.IsAny<object>()), Times.Once);
    }

    // ---- RewriteSection Insufficient Credits & Compensation ----

    [Fact]
    public async Task RewriteSection_WithInsufficientCredits_Returns402_NoJob_NoSuccessAudit_AndFailureAuditRecorded()
    {
        var sessionId = ObjectId.GenerateNewId().ToString();
        _sessions.Setup(s => s.GetOwnedAsync(sessionId, UserId))
            .ReturnsAsync(new BusinessPlanSession { Id = sessionId, OwnerUserId = UserId, ClarifierSessionId = _clarifierId, CurrentVersion = 1 });
        SetupCompletedClarifier(_clarifierId);
        _credits.Setup(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>()))
            .ThrowsAsync(new InsufficientCreditsException("Insufficient credits", 402));

        var controller = BuildController();
        var result = await controller.RewriteSection(new RewriteSectionRequest
        {
            BusinessPlanSessionId = sessionId,
            SectionId = "executive"
        });

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(402);
        _jobs.Verify(j => j.EnqueueAsync(It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<BsonDocument>()), Times.Never);
        _audit.Verify(a => a.Record("BusinessPlan.RewriteSection", UserId, true, It.IsAny<object>()), Times.Never);
        _audit.Verify(a => a.Record("BusinessPlan.RewriteSection", UserId, false, It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task RewriteSection_WhenEnqueueFailsAfterDebit_CompensatesCredit_Returns500_NoSuccessAudit()
    {
        var sessionId = ObjectId.GenerateNewId().ToString();
        _sessions.Setup(s => s.GetOwnedAsync(sessionId, UserId))
            .ReturnsAsync(new BusinessPlanSession { Id = sessionId, OwnerUserId = UserId, ClarifierSessionId = _clarifierId, CurrentVersion = 1 });
        SetupCompletedClarifier(_clarifierId);
        _credits.Setup(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>())).Returns(Task.CompletedTask);
        _jobs.Setup(j => j.EnqueueAsync(AiJobType.BusinessPlan, UserId, It.IsAny<BsonDocument>()))
            .ThrowsAsync(new InvalidOperationException("Hangfire queue unreachable"));

        var controller = BuildController();
        var result = await controller.RewriteSection(new RewriteSectionRequest
        {
            BusinessPlanSessionId = sessionId,
            SectionId = "executive"
        });

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
        _credits.Verify(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>()), Times.Once);
        _credits.Verify(c => c.RefundForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        _audit.Verify(a => a.Record("BusinessPlan.RewriteSection", UserId, true, It.IsAny<object>()), Times.Never);
        _audit.Verify(a => a.Record("BusinessPlan.RewriteSection", UserId, false, It.IsAny<object>()), Times.Once);
    }

    // ---- I. Business Plan enqueue failure with idempotency check ----

    [Fact]
    public async Task Start_WhenEnqueueFails_CompensatesWithSameSessionId_NoOrphanSession_TruthfulFailureAudit()
    {
        SetupCompletedClarifier(_clarifierId);
        string? capturedDebitOpId = null;
        string? capturedRefundOpId = null;

        _credits.Setup(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>()))
            .Callback<string, AiJobType, string?>((u, j, op) => capturedDebitOpId = op)
            .Returns(Task.CompletedTask);

        _credits.Setup(c => c.RefundForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>(), It.IsAny<string>()))
            .Callback<string, AiJobType, string, string>((u, j, op, r) => capturedRefundOpId = op)
            .ReturnsAsync(WebApp.Models.DatabaseModels.Ai.CreditRefundResult.Applied);

        _sessions.Setup(s => s.AddAsync(It.IsAny<BusinessPlanSession>())).Returns(Task.CompletedTask);
        _jobs.Setup(j => j.EnqueueAsync(AiJobType.BusinessPlan, UserId, It.IsAny<BsonDocument>()))
            .ThrowsAsync(new InvalidOperationException("Redis queue down"));

        var controller = BuildController();
        var result = await controller.Start(new StartBusinessPlanRequest { ClarifierSessionId = _clarifierId });

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
        capturedDebitOpId.Should().NotBeNullOrEmpty();
        capturedRefundOpId.Should().Be(capturedDebitOpId, "compensation must reference the exact same debit operation ID");
        _sessions.Verify(s => s.DeleteAsync(capturedDebitOpId!), Times.Once);
        _audit.Verify(a => a.Record("BusinessPlan.Start", UserId, false, It.IsAny<object>()), Times.Once);
        _audit.Verify(a => a.Record("BusinessPlan.Start", UserId, true, It.IsAny<object>()), Times.Never);
    }

    // ---- J. Successful Business Plan preserves debit and session ----

    [Fact]
    public async Task Start_Success_ConsumesDebitOnce_EnqueuesJob_NoRefundMarker_AndTruthfulSuccessAudit()
    {
        SetupCompletedClarifier(_clarifierId);
        string? capturedDebitOpId = null;

        _credits.Setup(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, It.IsAny<string>()))
            .Callback<string, AiJobType, string?>((u, j, op) => capturedDebitOpId = op)
            .Returns(Task.CompletedTask);
        _jobs.Setup(j => j.EnqueueAsync(AiJobType.BusinessPlan, UserId, It.IsAny<BsonDocument>())).ReturnsAsync("job-999");

        var controller = BuildController();
        var result = await controller.Start(new StartBusinessPlanRequest { ClarifierSessionId = _clarifierId });

        result.Should().BeOfType<OkObjectResult>();
        capturedDebitOpId.Should().NotBeNullOrEmpty();
        _credits.Verify(c => c.DebitForJobAsync(UserId, AiJobType.BusinessPlan, capturedDebitOpId), Times.Once);
        _credits.Verify(c => c.RefundForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        _sessions.Verify(s => s.AddAsync(It.Is<BusinessPlanSession>(s => s.Id == capturedDebitOpId)), Times.Once);
        _jobs.Verify(j => j.EnqueueAsync(AiJobType.BusinessPlan, UserId, It.IsAny<BsonDocument>()), Times.Once);
        _audit.Verify(a => a.Record("BusinessPlan.Start", UserId, true, It.IsAny<object>()), Times.Once);
        _audit.Verify(a => a.Record("BusinessPlan.Start", UserId, false, It.IsAny<object>()), Times.Never);
    }
}
