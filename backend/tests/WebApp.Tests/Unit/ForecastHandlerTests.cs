using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using Moq;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// C-4 P4: the Forecast handler builds the prompt from the parent business plan's
/// CURRENT EDITABLE version content (not the immutable generated snapshot, and only
/// when the plan is owner-scoped + Completed) and turns the model's JSON into the
/// locked seven-field contract — appending an immutable version on success (history
/// never overwritten) and marking NeedsReview (without throwing) on malformed output.
/// </summary>
public class ForecastHandlerTests
{
    private readonly Mock<IForecastSessionStore> _sessions = new();
    private readonly Mock<IBusinessPlanSessionStore> _plans = new();
    private readonly Mock<IAiInsightWriter> _insights = new();

    private ForecastHandler Handler() =>
        new(_sessions.Object, _plans.Object, _insights.Object, NullLogger<ForecastHandler>.Instance);

    private static AiRequest Request(BsonDocument input) =>
        new() { Id = ObjectId.GenerateNewId().ToString(), OwnerUserId = "user-1", JobType = "Forecast", InputPayload = input };

    private static AiCompletion Completion(string text) =>
        new() { Text = text, Model = "openai/gpt-oss-20b:free", Usage = new AiTokenUsage(60, 500, 560) };

    private static BusinessPlanSession CompletedPlan(string id, string editedOverview = "Edited plan.") =>
        new()
        {
            Id = id,
            OwnerUserId = "user-1",
            Status = "Completed",
            CurrentVersion = 2,
            Versions =
            {
                new BusinessPlanVersion { Version = 1, Content = new BsonDocument("executiveSummary", new BsonDocument("overview", "v1 generated")) },
                new BusinessPlanVersion
                {
                    Version = 2,
                    GeneratedContent = new BsonDocument("executiveSummary", new BsonDocument("overview", "v2 generated snapshot")),
                    Content = new BsonDocument("executiveSummary", new BsonDocument("overview", editedOverview)),
                    IsEdited = true,
                },
            },
        };

    private static string ValidJson() => """
        {
          "schemaVersion": 1,
          "revenueForecast": { "currency": "USD", "summary": "ramp", "monthly": [ { "month": 1, "amount": 1000, "notes": "launch" } ] },
          "costForecast": { "currency": "USD", "summary": "lean", "monthly": [ { "month": 1, "fixedCosts": 500, "variableCosts": 100, "notes": "" } ] },
          "cashFlowProjection": { "currency": "USD", "summary": "tight", "monthly": [ { "month": 1, "netCashFlow": 400, "endingBalance": 400, "notes": "" } ] },
          "breakEvenAnalysis": { "breakEvenMonth": 9, "summary": "month 9", "isAchievedWithinHorizon": true },
          "assumptions": ["10% MoM growth"],
          "risks": [ { "category": "market", "description": "slow adoption", "likelihood": "medium", "impact": "high", "mitigation": "pilots" } ],
          "advisoryNotice": "Estimates only; not guarantees."
        }
        """;

    // ---- PrepareAsync ----

    [Fact]
    public async Task Prepare_targets_forecast_template_with_tuned_sampling()
    {
        var planId = ObjectId.GenerateNewId().ToString();
        _plans.Setup(p => p.GetOwnedAsync(planId, "user-1")).ReturnsAsync(CompletedPlan(planId));

        var prep = await Handler().PrepareAsync(Request(new BsonDocument
        {
            ["sessionId"] = ObjectId.GenerateNewId().ToString(),
            ["businessPlanSessionId"] = planId,
        }));

        prep.PromptKey.Should().Be(PromptTemplate.Forecast.Key);
        prep.TaskType.Should().Be("Forecast");
        prep.MaxTokens.Should().Be(3800);
        prep.Temperature.Should().Be(0.3);
        prep.Task.Should().Contain("12-month");
    }

    [Fact]
    public async Task Prepare_uses_current_editable_content_not_generated_snapshot()
    {
        var planId = ObjectId.GenerateNewId().ToString();
        _plans.Setup(p => p.GetOwnedAsync(planId, "user-1")).ReturnsAsync(CompletedPlan(planId, editedOverview: "User-edited overview."));

        var prep = await Handler().PrepareAsync(Request(new BsonDocument
        {
            ["sessionId"] = "fc-1",
            ["businessPlanSessionId"] = planId,
        }));

        prep.UserContext.Should().Contain("BUSINESS PLAN");
        prep.UserContext.Should().Contain("User-edited overview.");   // CurrentVersion.Content
        prep.UserContext.Should().NotContain("v2 generated snapshot"); // NOT GeneratedContent
        prep.UserContext.Should().NotContain("v1 generated");          // not a stale version
    }

    [Fact]
    public async Task Prepare_is_owner_scoped()
    {
        // GetOwnedAsync returns null for a plan the caller does not own.
        _plans.Setup(p => p.GetOwnedAsync(It.IsAny<string>(), "user-1")).ReturnsAsync((BusinessPlanSession?)null);

        var prep = await Handler().PrepareAsync(Request(new BsonDocument
        {
            ["sessionId"] = "fc-1",
            ["businessPlanSessionId"] = ObjectId.GenerateNewId().ToString(),
        }));

        // A plan the caller does not own must never reach the prompt (owner-scoping).
        prep.UserContext.Should().NotContain("BUSINESS PLAN");
        prep.Task.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Prepare_ignores_business_plan_that_is_not_completed()
    {
        var planId = ObjectId.GenerateNewId().ToString();
        var pending = CompletedPlan(planId);
        pending.Status = "Processing"; // not Completed
        _plans.Setup(p => p.GetOwnedAsync(planId, "user-1")).ReturnsAsync(pending);

        var prep = await Handler().PrepareAsync(Request(new BsonDocument
        {
            ["sessionId"] = "fc-1",
            ["businessPlanSessionId"] = planId,
        }));

        // A non-Completed plan must be gated out — neither its block nor its content appears.
        prep.UserContext.Should().NotContain("BUSINESS PLAN");
        prep.UserContext.Should().NotContain("Edited plan.");
    }

    // ---- InterpretAsync: happy path ----

    [Fact]
    public async Task Interpret_appends_version_and_returns_contract()
    {
        var sessionId = ObjectId.GenerateNewId().ToString();
        var request = Request(new BsonDocument { ["sessionId"] = sessionId });

        var result = await Handler().InterpretAsync(request, Completion(ValidJson()));

        result.OutputPayload.Should().NotBeNull();
        result.OutputPayload!["schemaVersion"].AsInt32.Should().Be(1);
        result.OutputPayload!["revenueForecast"]["currency"].AsString.Should().Be("USD");

        _sessions.Verify(s => s.AppendGeneratedVersionAsync(sessionId, It.IsAny<BsonDocument>(), request.Id), Times.Once);
        _sessions.Verify(s => s.SetNeedsReviewAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Interpret_strips_code_fences_before_parsing()
    {
        var sessionId = ObjectId.GenerateNewId().ToString();
        var fenced = "```json\n" + ValidJson() + "\n```";

        var result = await Handler().InterpretAsync(Request(new BsonDocument("sessionId", sessionId)), Completion(fenced));

        result.OutputPayload.Should().NotBeNull();
        _sessions.Verify(s => s.AppendGeneratedVersionAsync(sessionId, It.IsAny<BsonDocument>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task Interpret_writes_insight_on_success()
    {
        var request = Request(new BsonDocument("sessionId", ObjectId.GenerateNewId().ToString()));

        await Handler().InterpretAsync(request, Completion(ValidJson()));

        _insights.Verify(i => i.WriteAsync(It.Is<AiInsight>(ins =>
            ins.Type == "Forecast" &&
            ins.OwnerUserId == "user-1" &&
            ins.SourceRequestId == request.Id &&
            ins.Payload != null)), Times.Once);
    }

    // ---- InterpretAsync: malformed / invalid -> NeedsReview ----

    [Theory]
    [InlineData("not json at all")]
    [InlineData("{ \"revenueForecast\": {} }")] // missing required fields
    [InlineData("")]                             // empty
    public async Task Interpret_marks_needs_review_without_throwing(string badOutput)
    {
        var sessionId = ObjectId.GenerateNewId().ToString();

        var result = await Handler().InterpretAsync(Request(new BsonDocument("sessionId", sessionId)), Completion(badOutput));

        result.OutputPayload.Should().BeNull();
        _sessions.Verify(s => s.SetNeedsReviewAsync(sessionId, It.Is<string>(e => e.Length > 0)), Times.Once);
        _sessions.Verify(s => s.AppendGeneratedVersionAsync(It.IsAny<string>(), It.IsAny<BsonDocument>(), It.IsAny<string>()), Times.Never);
        _insights.Verify(i => i.WriteAsync(It.IsAny<AiInsight>()), Times.Never);
    }

    [Fact]
    public async Task Interpret_without_session_id_does_not_write_or_throw()
    {
        var result = await Handler().InterpretAsync(Request(new BsonDocument("businessPlanSessionId", "x")), Completion(ValidJson()));

        result.OutputPayload.Should().NotBeNull();
        _sessions.Verify(s => s.AppendGeneratedVersionAsync(It.IsAny<string>(), It.IsAny<BsonDocument>(), It.IsAny<string>()), Times.Never);
        _insights.Verify(i => i.WriteAsync(It.IsAny<AiInsight>()), Times.Never);
    }
}
