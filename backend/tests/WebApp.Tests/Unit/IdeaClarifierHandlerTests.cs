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
/// C-2 P3: the Idea-Clarifier handler builds the prompt from the stored raw
/// idea and turns the model's JSON into the locked contract — writing the
/// ClarifierSession + AiInsight on success, and marking NeedsReview (without
/// throwing) on malformed output.
/// </summary>
public class IdeaClarifierHandlerTests
{
    private readonly Mock<IClarifierSessionStore> _sessions = new();
    private readonly Mock<IAiInsightWriter> _insights = new();

    private IdeaClarifierHandler Handler() =>
        new(_sessions.Object, _insights.Object, NullLogger<IdeaClarifierHandler>.Instance);

    private static AiRequest Request(BsonDocument input) =>
        new() { Id = ObjectId.GenerateNewId().ToString(), OwnerUserId = "user-1", JobType = "IdeaClarifier", InputPayload = input };

    private static AiCompletion Completion(string text) =>
        new() { Text = text, Model = "openai/gpt-4o", Usage = new AiTokenUsage(10, 20, 30) };

    private static string ValidJson(int clarityScore = 72) => $$"""
        {
          "schemaVersion": 1,
          "problemDefinition": { "statement": "Manual crop monitoring is slow.", "painPoints": ["labor"], "severity": "high" },
          "targetAudience": { "primarySegment": "Mid-size farms", "characteristics": ["data-driven"], "sizeQualitative": "regional" },
          "existingAlternatives": [ { "name": "Manual scouting", "gap": "slow" } ],
          "proposedSolution": { "summary": "Autonomous solar drones.", "differentiation": "solar", "valueProposition": "save time" },
          "riskAssessment": [ { "category": "regulatory", "description": "airspace", "likelihood": "medium", "mitigation": "permits" } ],
          "assumptions": ["farms have wifi"],
          "clarityScore": {{clarityScore}},
          "clarityRationale": "well scoped",
          "tags": ["agtech"]
        }
        """;

    // ---- PrepareAsync ----

    [Fact]
    public async Task Prepare_targets_clarifier_template_and_task_type()
    {
        var prep = await Handler().PrepareAsync(Request(new BsonDocument
        {
            ["sessionId"] = ObjectId.GenerateNewId().ToString(),
            ["title"] = "Solar drones",
            ["problemStatement"] = "Crop monitoring is manual.",
            ["targetAudience"] = "Farmers",
        }));

        prep.PromptKey.Should().Be(PromptTemplate.IdeaClarifier.Key);
        prep.TaskType.Should().Be("IdeaClarifier");
        prep.MaxTokens.Should().Be(1500);
        prep.UserContext.Should().Contain("Solar drones");
        prep.UserContext.Should().Contain("Crop monitoring is manual.");
        prep.UserContext.Should().Contain("Farmers");
        prep.Task.Should().Contain("JSON");
    }

    [Fact]
    public async Task Prepare_tolerates_missing_idea_fields()
    {
        var prep = await Handler().PrepareAsync(Request(new BsonDocument("sessionId", "x")));
        prep.UserContext.Should().NotBeNullOrWhiteSpace();
        prep.Task.Should().NotBeNullOrWhiteSpace();
    }

    // ---- InterpretAsync: happy path ----

    [Fact]
    public async Task Interpret_completes_session_and_returns_contract()
    {
        var sessionId = ObjectId.GenerateNewId().ToString();
        var request = Request(new BsonDocument { ["sessionId"] = sessionId });

        var result = await Handler().InterpretAsync(request, Completion(ValidJson(72)));

        result.OutputPayload.Should().NotBeNull();
        result.OutputPayload!["schemaVersion"].AsInt32.Should().Be(1);
        result.OutputPayload!["proposedSolution"]["summary"].AsString.Should().Be("Autonomous solar drones.");

        _sessions.Verify(s => s.SetCompletedAsync(sessionId,
            It.Is<BsonDocument>(d => d["clarityScore"].AsInt32 == 72), 72), Times.Once);
        _sessions.Verify(s => s.SetNeedsReviewAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Interpret_strips_code_fences_before_parsing()
    {
        var sessionId = ObjectId.GenerateNewId().ToString();
        var fenced = "```json\n" + ValidJson(50) + "\n```";

        var result = await Handler().InterpretAsync(Request(new BsonDocument("sessionId", sessionId)), Completion(fenced));

        result.OutputPayload.Should().NotBeNull();
        _sessions.Verify(s => s.SetCompletedAsync(sessionId, It.IsAny<BsonDocument>(), 50), Times.Once);
    }

    // ---- InterpretAsync: insight creation ----

    [Fact]
    public async Task Interpret_writes_insight_on_success()
    {
        var request = Request(new BsonDocument("sessionId", ObjectId.GenerateNewId().ToString()));

        await Handler().InterpretAsync(request, Completion(ValidJson()));

        _insights.Verify(i => i.WriteAsync(It.Is<AiInsight>(ins =>
            ins.Type == "IdeaClarifier" &&
            ins.OwnerUserId == "user-1" &&
            ins.SourceRequestId == request.Id &&
            ins.Payload != null)), Times.Once);
    }

    // ---- InterpretAsync: score clamp ----

    [Theory]
    [InlineData(150, 100)]
    [InlineData(-20, 0)]
    [InlineData(64, 64)]
    public async Task Interpret_clamps_clarity_score(int raw, int expected)
    {
        var sessionId = ObjectId.GenerateNewId().ToString();

        var result = await Handler().InterpretAsync(Request(new BsonDocument("sessionId", sessionId)), Completion(ValidJson(raw)));

        result.OutputPayload!["clarityScore"].AsInt32.Should().Be(expected);
        _sessions.Verify(s => s.SetCompletedAsync(sessionId, It.IsAny<BsonDocument>(), expected), Times.Once);
    }

    // ---- InterpretAsync: malformed / invalid -> NeedsReview ----

    [Theory]
    [InlineData("not json at all")]
    [InlineData("{ \"clarityScore\": 50 }")]                 // missing required fields
    [InlineData("")]                                          // empty
    public async Task Interpret_marks_needs_review_without_throwing(string badOutput)
    {
        var sessionId = ObjectId.GenerateNewId().ToString();

        var result = await Handler().InterpretAsync(Request(new BsonDocument("sessionId", sessionId)), Completion(badOutput));

        result.OutputPayload.Should().BeNull(); // no structured payload persisted on the response
        _sessions.Verify(s => s.SetNeedsReviewAsync(sessionId, It.Is<string>(e => e.Length > 0)), Times.Once);
        _sessions.Verify(s => s.SetCompletedAsync(It.IsAny<string>(), It.IsAny<BsonDocument>(), It.IsAny<int?>()), Times.Never);
        _insights.Verify(i => i.WriteAsync(It.IsAny<AiInsight>()), Times.Never);
    }

    [Fact]
    public async Task Interpret_without_session_id_does_not_write_or_throw()
    {
        var result = await Handler().InterpretAsync(Request(new BsonDocument("title", "x")), Completion(ValidJson()));

        result.OutputPayload.Should().NotBeNull(); // still returns the parsed contract for the response
        _sessions.Verify(s => s.SetCompletedAsync(It.IsAny<string>(), It.IsAny<BsonDocument>(), It.IsAny<int?>()), Times.Never);
        _insights.Verify(i => i.WriteAsync(It.IsAny<AiInsight>()), Times.Never);
    }
}
