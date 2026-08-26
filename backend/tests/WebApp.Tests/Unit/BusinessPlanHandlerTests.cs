using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using Moq;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository.Ai;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// C-3 P3: the Business-Plan handler builds the prompt from the clarifier session's
/// output (the authoritative input) and turns the model's JSON into the locked
/// seven-section contract — appending an immutable version on success (history is
/// never overwritten) and marking NeedsReview (without throwing) on malformed output.
/// </summary>
public class BusinessPlanHandlerTests
{
    private readonly Mock<IBusinessPlanSessionStore> _sessions = new();
    private readonly Mock<IClarifierSessionStore> _clarifiers = new();
    private readonly Mock<ICreatorIdeaStore> _creatorIdeas = new();
    private readonly Mock<IAiInsightWriter> _insights = new();

    // The BusinessIdeas repo is only touched when a businessIdeaId is supplied; the
    // tests below never exercise that path, so the concrete dependency stays null.
    private BusinessPlanHandler Handler() =>
        new(_sessions.Object, _clarifiers.Object, _creatorIdeas.Object, null!, _insights.Object,
            NullLogger<BusinessPlanHandler>.Instance);

    private static AiRequest Request(BsonDocument input) =>
        new() { Id = ObjectId.GenerateNewId().ToString(), OwnerUserId = "user-1", JobType = "BusinessPlan", InputPayload = input };

    private static AiCompletion Completion(string text) =>
        new() { Text = text, Model = "openai/gpt-oss-20b:free", Usage = new AiTokenUsage(50, 400, 450) };

    private static BsonDocument ClarifierOutput() => BsonDocument.Parse("""
        { "schemaVersion": 1, "problemDefinition": { "statement": "Crop monitoring is manual." }, "clarityScore": 80 }
        """);

    private static string ValidJson() => """
        {
          "schemaVersion": 1,
          "executiveSummary": { "overview": "Autonomous crop monitoring.", "valueProposition": "Save time", "highlights": ["solar"] },
          "marketAnalysis": { "overview": "Agtech is growing.", "targetSegments": ["mid-size farms"], "marketSizeQualitative": "regional", "trends": ["automation"] },
          "competitorAnalysis": { "overview": "Few automated players.", "competitors": [ { "name": "Manual scouting", "positioning": "incumbent", "strengths": ["cheap"], "weaknesses": ["slow"], "ourAdvantage": "speed" } ] },
          "revenueModel": { "summary": "Subscription.", "revenueStreams": [ { "name": "SaaS", "description": "per acre" } ], "pricingStrategy": "tiered", "keyMetrics": ["churn"] },
          "goToMarket": { "strategy": "Direct sales.", "channels": ["co-ops"], "phases": [ { "name": "Pilot", "description": "3 farms" } ] },
          "operationsPlan": { "overview": "Lean ops.", "keyActivities": ["assembly"], "resources": ["drones"], "milestones": [ { "title": "MVP", "description": "fly", "timeframe": "first 90 days" } ] },
          "risks": [ { "category": "regulatory", "description": "airspace", "likelihood": "medium", "impact": "high", "mitigation": "permits" } ]
        }
        """;

    // ---- PrepareAsync ----

    [Fact]
    public async Task Prepare_targets_business_plan_template_and_uses_clarifier_output()
    {
        var clarifierId = ObjectId.GenerateNewId().ToString();
        _clarifiers.Setup(c => c.GetOwnedAsync(clarifierId, "user-1"))
            .ReturnsAsync(new ClarifierSession { Id = clarifierId, OwnerUserId = "user-1", Status = "Completed", Output = ClarifierOutput() });

        var prep = await Handler().PrepareAsync(Request(new BsonDocument
        {
            ["sessionId"] = ObjectId.GenerateNewId().ToString(),
            ["clarifierSessionId"] = clarifierId,
        }));

        prep.PromptKey.Should().Be(PromptTemplate.BusinessPlan.Key);
        prep.TaskType.Should().Be("BusinessPlan");
        prep.MaxTokens.Should().Be(5000);
        prep.ResponseFormat.Should().Be("json_object");
        prep.UserContext.Should().Contain("CLARIFIER HISTORY");
        prep.UserContext.Should().Contain("Crop monitoring is manual."); // retained as supporting history
        prep.Task.Should().Contain("JSON");
    }

    [Fact]
    public async Task Prepare_prefers_the_canonical_idea_core_over_clarifier_history()
    {
        var ideaId = ObjectId.GenerateNewId().ToString();
        var clarifierId = ObjectId.GenerateNewId().ToString();
        _creatorIdeas.Setup(i => i.GetOwnedAsync(ideaId, "user-1"))
            .ReturnsAsync(new WebApp.Models.DatabaseModels.CreatorIdea
            {
                Id = ideaId,
                UserId = "user-1",
                Project = new WebApp.Models.DatabaseModels.CreatorJourneyProject
                {
                    Problem = "Creator-edited irrigation scheduling problem.",
                    TargetUser = "Smallholder farms",
                    SourceMethod = "discovery",
                },
            });
        _clarifiers.Setup(c => c.GetOwnedAsync(clarifierId, "user-1"))
            .ReturnsAsync(new ClarifierSession { Id = clarifierId, OwnerUserId = "user-1", Status = "Completed", Output = ClarifierOutput() });

        var prep = await Handler().PrepareAsync(Request(new BsonDocument
        {
            ["sessionId"] = ObjectId.GenerateNewId().ToString(),
            ["clarifierSessionId"] = clarifierId,
            ["businessIdeaId"] = ideaId,
        }));

        prep.UserContext.Should().Contain("CANONICAL IDEA CORE (authoritative source");
        prep.UserContext.Should().Contain("Creator-edited irrigation scheduling problem.");
        prep.UserContext.Should().Contain("CLARIFIER HISTORY (supporting context only");
        prep.Task.Should().Contain("Preserve creator edits");
    }

    [Fact]
    public async Task Prepare_tolerates_missing_clarifier_output()
    {
        _clarifiers.Setup(c => c.GetOwnedAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((ClarifierSession?)null);

        var prep = await Handler().PrepareAsync(Request(new BsonDocument
        {
            ["sessionId"] = "x",
            ["clarifierSessionId"] = ObjectId.GenerateNewId().ToString(),
        }));

        prep.UserContext.Should().NotBeNullOrWhiteSpace();
        prep.Task.Should().NotBeNullOrWhiteSpace();
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
        result.OutputPayload!["executiveSummary"]["overview"].AsString.Should().Be("Autonomous crop monitoring.");

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
            ins.Type == "BusinessPlan" &&
            ins.OwnerUserId == "user-1" &&
            ins.SourceRequestId == request.Id &&
            ins.Payload != null)), Times.Once);
    }

    [Fact]
    public async Task Interpret_drops_any_funding_ask_field()
    {
        var sessionId = ObjectId.GenerateNewId().ToString();
        var withFunding = ValidJson().TrimEnd().TrimEnd('}') + ", \"fundingAsk\": { \"amount\": 100000 } }";

        var result = await Handler().InterpretAsync(Request(new BsonDocument("sessionId", sessionId)), Completion(withFunding));

        result.OutputPayload.Should().NotBeNull();
        result.OutputPayload!.Contains("fundingAsk").Should().BeFalse(); // locked decision #1
    }

    // ---- InterpretAsync: malformed / invalid -> NeedsReview ----

    [Theory]
    [InlineData("not json at all")]
    [InlineData("{ \"executiveSummary\": {} }")] // missing required sections
    [InlineData("")]                              // empty
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
        var result = await Handler().InterpretAsync(Request(new BsonDocument("clarifierSessionId", "x")), Completion(ValidJson()));

        result.OutputPayload.Should().NotBeNull();
        _sessions.Verify(s => s.AppendGeneratedVersionAsync(It.IsAny<string>(), It.IsAny<BsonDocument>(), It.IsAny<string>()), Times.Never);
        _insights.Verify(i => i.WriteAsync(It.IsAny<AiInsight>()), Times.Never);
    }
}
