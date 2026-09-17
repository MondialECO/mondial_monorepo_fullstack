using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using Moq;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

public class AiJobRunnerSessionFailureTests
{
    private readonly Mock<AiRequestRepository> _requests;
    private readonly Mock<AiResponseRepository> _responses;
    private readonly Mock<AiModelUsageRepository> _usage;
    private readonly Mock<IPromptVersionStore> _promptStore = new();
    private readonly Mock<IPromptBuilder> _promptBuilder = new();
    private readonly Mock<IModelRouter> _modelRouter = new();
    private readonly Mock<IAiProvider> _provider = new();
    private readonly Mock<IAiJobCompletionHandler> _completion = new();
    private readonly Mock<IIdeaGenerationSessionRepository> _ideaGenerationSessions = new();
    private readonly Mock<IClarifierSessionStore> _clarifierSessions = new();
    private readonly Mock<IMarketStudySessionStore> _marketStudySessions = new();
    private readonly Mock<IBusinessModelSessionStore> _businessModelSessions = new();
    private readonly Mock<IBusinessPlanSessionStore> _businessPlanSessions = new();
    private readonly Mock<IForecastSessionStore> _forecastSessions = new();
    private readonly Mock<IAiCreditService> _creditService = new();

    public AiJobRunnerSessionFailureTests()
    {
        var db = new Mock<MongoDB.Driver.IMongoDatabase>();
        var reqColl = new Mock<MongoDB.Driver.IMongoCollection<AiRequest>>();
        db.Setup(d => d.GetCollection<AiRequest>(It.IsAny<string>(), It.IsAny<MongoDB.Driver.MongoCollectionSettings>())).Returns(reqColl.Object);
        var respColl = new Mock<MongoDB.Driver.IMongoCollection<AiResponse>>();
        db.Setup(d => d.GetCollection<AiResponse>(It.IsAny<string>(), It.IsAny<MongoDB.Driver.MongoCollectionSettings>())).Returns(respColl.Object);
        var usageColl = new Mock<MongoDB.Driver.IMongoCollection<AiModelUsage>>();
        db.Setup(d => d.GetCollection<AiModelUsage>(It.IsAny<string>(), It.IsAny<MongoDB.Driver.MongoCollectionSettings>())).Returns(usageColl.Object);

        _requests = new Mock<AiRequestRepository>(db.Object);
        _responses = new Mock<AiResponseRepository>(db.Object);
        _usage = new Mock<AiModelUsageRepository>(db.Object);
    }

    [Fact]
    public async Task RunAsync_WhenMarketStudyFails_SyncsMarketStudySessionToFailed()
    {
        var requestId = ObjectId.GenerateNewId().ToString();
        var sessionId = ObjectId.GenerateNewId().ToString();

        var request = new AiRequest
        {
            Id = requestId,
            OwnerUserId = "user-1",
            JobType = AiJobType.MarketStudy.ToString(),
            Status = "Pending",
            InputPayload = new BsonDocument
            {
                ["sessionId"] = sessionId,
                ["creditOperationId"] = "op-1"
            }
        };

        _requests.Setup(r => r.GetByIdAsync(requestId)).ReturnsAsync(request);

        var handlerMock = new Mock<IAiTaskHandler>();
        handlerMock.Setup(h => h.Type).Returns(AiJobType.MarketStudy);
        handlerMock.Setup(h => h.PrepareAsync(request, default)).ThrowsAsync(new InvalidOperationException("Prompt failed"));

        var registry = new AiTaskHandlerRegistry(new[] { handlerMock.Object });

        var runner = new AiJobRunner(
            _requests.Object,
            _responses.Object,
            _usage.Object,
            registry,
            _promptStore.Object,
            _promptBuilder.Object,
            _modelRouter.Object,
            _provider.Object,
            _completion.Object,
            _ideaGenerationSessions.Object,
            _clarifierSessions.Object,
            _marketStudySessions.Object,
            _businessModelSessions.Object,
            _businessPlanSessions.Object,
            _forecastSessions.Object,
            _creditService.Object,
            NullLogger<AiJobRunner>.Instance);

        var act = () => runner.RunAsync(requestId);
        await act.Should().ThrowAsync<InvalidOperationException>();

        _marketStudySessions.Verify(m => m.SetFailedAsync(sessionId, "Prompt failed"), Times.Once);
        _creditService.Verify(c => c.RefundForJobAsync("user-1", AiJobType.MarketStudy, "op-1", It.Is<string>(s => s.Contains("Prompt failed") && s.Contains(AiReconciliationSource.RunnerAutomatic))), Times.Once);
    }

    [Fact]
    public async Task RunAsync_WhenBusinessModelFails_SyncsBusinessModelSessionToFailed()
    {
        var requestId = ObjectId.GenerateNewId().ToString();
        var sessionId = ObjectId.GenerateNewId().ToString();

        var request = new AiRequest
        {
            Id = requestId,
            OwnerUserId = "user-1",
            JobType = AiJobType.BusinessModel.ToString(),
            Status = "Pending",
            InputPayload = new BsonDocument
            {
                ["sessionId"] = sessionId,
                ["creditOperationId"] = "op-2"
            }
        };

        _requests.Setup(r => r.GetByIdAsync(requestId)).ReturnsAsync(request);

        var handlerMock = new Mock<IAiTaskHandler>();
        handlerMock.Setup(h => h.Type).Returns(AiJobType.BusinessModel);
        handlerMock.Setup(h => h.PrepareAsync(request, default)).ThrowsAsync(new InvalidOperationException("Model error"));

        var registry = new AiTaskHandlerRegistry(new[] { handlerMock.Object });

        var runner = new AiJobRunner(
            _requests.Object,
            _responses.Object,
            _usage.Object,
            registry,
            _promptStore.Object,
            _promptBuilder.Object,
            _modelRouter.Object,
            _provider.Object,
            _completion.Object,
            _ideaGenerationSessions.Object,
            _clarifierSessions.Object,
            _marketStudySessions.Object,
            _businessModelSessions.Object,
            _businessPlanSessions.Object,
            _forecastSessions.Object,
            _creditService.Object,
            NullLogger<AiJobRunner>.Instance);

        var act = () => runner.RunAsync(requestId);
        await act.Should().ThrowAsync<InvalidOperationException>();

        _businessModelSessions.Verify(b => b.SetFailedAsync(sessionId, "Model error"), Times.Once);
        _creditService.Verify(c => c.RefundForJobAsync("user-1", AiJobType.BusinessModel, "op-2", It.Is<string>(s => s.Contains("Model error") && s.Contains(AiReconciliationSource.RunnerAutomatic))), Times.Once);
    }

    [Fact]
    public async Task RunAsync_WhenJobTypeUnparseableEnum_StillRefundsViaRefundOperationAsyncAndMarksSessionFailed()
    {
        var requestId = ObjectId.GenerateNewId().ToString();
        var sessionId = ObjectId.GenerateNewId().ToString();

        var request = new AiRequest
        {
            Id = requestId,
            OwnerUserId = "user-1",
            JobType = "UnknownOrFutureJobType",
            Status = "Pending",
            InputPayload = new BsonDocument
            {
                ["sessionId"] = sessionId,
                ["creditOperationId"] = "op-unparseable"
            }
        };

        _requests.Setup(r => r.GetByIdAsync(requestId)).ReturnsAsync(request);

        var registry = new AiTaskHandlerRegistry(Array.Empty<IAiTaskHandler>());

        var runner = new AiJobRunner(
            _requests.Object,
            _responses.Object,
            _usage.Object,
            registry,
            _promptStore.Object,
            _promptBuilder.Object,
            _modelRouter.Object,
            _provider.Object,
            _completion.Object,
            _ideaGenerationSessions.Object,
            _clarifierSessions.Object,
            _marketStudySessions.Object,
            _businessModelSessions.Object,
            _businessPlanSessions.Object,
            _forecastSessions.Object,
            _creditService.Object,
            NullLogger<AiJobRunner>.Instance);

        var act = () => runner.RunAsync(requestId);
        await act.Should().ThrowAsync<ArgumentException>();

        // Verification: The unparseable job type failed to parse in RunAsync, but TryAutomaticRefundAsync caught it
        // and called RefundOperationAsync directly with op-unparseable without throwing or skipping!
        _creditService.Verify(c => c.RefundOperationAsync("user-1", "op-unparseable", It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task RunAsync_WhenJobTypeStringMatchesBusinessModelCaseInsensitive_MarksBusinessModelSessionFailed()
    {
        var requestId = ObjectId.GenerateNewId().ToString();
        var sessionId = ObjectId.GenerateNewId().ToString();

        var request = new AiRequest
        {
            Id = requestId,
            OwnerUserId = "user-1",
            JobType = "businessmodel", // lowercase
            Status = "Pending",
            InputPayload = new BsonDocument
            {
                ["sessionId"] = sessionId,
                ["creditOperationId"] = "op-case"
            }
        };

        _requests.Setup(r => r.GetByIdAsync(requestId)).ReturnsAsync(request);

        var handlerMock = new Mock<IAiTaskHandler>();
        handlerMock.Setup(h => h.Type).Returns(AiJobType.BusinessModel);
        handlerMock.Setup(h => h.PrepareAsync(request, default)).ThrowsAsync(new InvalidOperationException("Execution failed"));

        var registry = new AiTaskHandlerRegistry(new[] { handlerMock.Object });

        var runner = new AiJobRunner(
            _requests.Object,
            _responses.Object,
            _usage.Object,
            registry,
            _promptStore.Object,
            _promptBuilder.Object,
            _modelRouter.Object,
            _provider.Object,
            _completion.Object,
            _ideaGenerationSessions.Object,
            _clarifierSessions.Object,
            _marketStudySessions.Object,
            _businessModelSessions.Object,
            _businessPlanSessions.Object,
            _forecastSessions.Object,
            _creditService.Object,
            NullLogger<AiJobRunner>.Instance);

        var act = () => runner.RunAsync(requestId);
        await act.Should().ThrowAsync<InvalidOperationException>();

        _businessModelSessions.Verify(b => b.SetFailedAsync(sessionId, "Execution failed"), Times.Once);
        _creditService.Verify(c => c.RefundForJobAsync("user-1", AiJobType.BusinessModel, "op-case", It.Is<string>(s => s.Contains("Execution failed") && s.Contains(AiReconciliationSource.RunnerAutomatic))), Times.Once);
    }
}
