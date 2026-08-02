using FluentAssertions;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using WebApp.Models.DatabaseModels.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// BSON mapping/round-trip checks for the AI persistence entities — no MongoDB
/// server required. Verifies the audited convention (string id stored as
/// ObjectId, BsonElement names, BsonDocument payloads, Decimal128 cost).
/// </summary>
public class AiEntitySerializationTests
{
    private static BsonDocument Bson<T>(T entity) => entity!.ToBsonDocument();
    private static T RoundTrip<T>(T entity) => BsonSerializer.Deserialize<T>(Bson(entity));

    [Fact]
    public void AiRequest_round_trips_with_objectid_and_payload()
    {
        var e = new AiRequest
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = "user-1",
            JobType = "Probe",
            Status = "Pending",
            InputPayload = new BsonDocument { ["idea"] = "solar drones", ["n"] = 3 },
            PromptKey = "probe",
            PromptVersion = 2,
            HangfireJobId = "hf-9",
        };

        var bson = Bson(e);
        bson["_id"].BsonType.Should().Be(BsonType.ObjectId);
        bson.Contains("OwnerUserId").Should().BeTrue();

        var back = RoundTrip(e);
        back.OwnerUserId.Should().Be("user-1");
        back.JobType.Should().Be("Probe");
        back.PromptVersion.Should().Be(2);
        back.InputPayload!["idea"].AsString.Should().Be("solar drones");
        back.InputPayload!["n"].AsInt32.Should().Be(3);
    }

    [Fact]
    public void AiResponse_round_trips_embedded_token_usage()
    {
        var e = new AiResponse
        {
            Id = ObjectId.GenerateNewId().ToString(),
            RequestId = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = "user-1",
            Model = "openai/gpt-oss-20b:free",
            RawText = "hello",
            OutputPayload = new BsonDocument("summary", "ok"),
            TokenUsage = new AiResponseTokenUsage { PromptTokens = 10, CompletionTokens = 5, TotalTokens = 15 },
            FinishReason = "stop",
            Version = 1,
        };

        Bson(e)["RequestId"].BsonType.Should().Be(BsonType.ObjectId);

        var back = RoundTrip(e);
        back.Model.Should().Be("openai/gpt-oss-20b:free");
        back.TokenUsage.TotalTokens.Should().Be(15);
        back.OutputPayload!["summary"].AsString.Should().Be("ok");
    }

    [Fact]
    public void AiModelUsage_stores_cost_as_decimal128()
    {
        var e = new AiModelUsage
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = "user-1",
            RequestId = ObjectId.GenerateNewId().ToString(),
            Model = "openai/gpt-oss-20b:free",
            PromptTokens = 100,
            CompletionTokens = 50,
            TotalTokens = 150,
            EstimatedCost = 0.01234m,
            TaskType = "Probe",
        };

        Bson(e)["EstimatedCost"].BsonType.Should().Be(BsonType.Decimal128);
        RoundTrip(e).EstimatedCost.Should().Be(0.01234m);
    }

    [Fact]
    public void PromptVersion_round_trips()
    {
        var e = new PromptVersion
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Key = "probe",
            Version = 1,
            SystemText = "You are a probe.",
            OutputContract = "json",
            IsActive = true,
        };

        var back = RoundTrip(e);
        back.Key.Should().Be("probe");
        back.IsActive.Should().BeTrue();
        back.SystemText.Should().Be("You are a probe.");
    }

    [Fact]
    public void AiFeedback_round_trips()
    {
        var e = new AiFeedback
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = "user-1",
            ResponseId = ObjectId.GenerateNewId().ToString(),
            Rating = 5,
            Comment = "great",
        };

        var back = RoundTrip(e);
        back.Rating.Should().Be(5);
        back.Comment.Should().Be("great");
    }

    [Fact]
    public void AiInsight_round_trips_payload()
    {
        var e = new AiInsight
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = "user-1",
            Type = "market",
            Payload = new BsonDocument("score", 0.9),
            SourceRequestId = ObjectId.GenerateNewId().ToString(),
        };

        var back = RoundTrip(e);
        back.Type.Should().Be("market");
        back.Payload!["score"].AsDouble.Should().Be(0.9);
    }

    [Fact]
    public void ClarifierSession_round_trips_with_objectids_and_contract()
    {
        var e = new ClarifierSession
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = "user-1",
            BusinessIdeaId = ObjectId.GenerateNewId().ToString(),
            RequestId = ObjectId.GenerateNewId().ToString(),
            Status = "Completed",
            Input = new BsonDocument { ["title"] = "solar drones", ["problemStatement"] = "p" },
            Output = new BsonDocument { ["schemaVersion"] = 1, ["clarityScore"] = 80 },
            ClarityScore = 80,
            SchemaVersion = 1,
            Version = 1,
        };

        var bson = Bson(e);
        bson["_id"].BsonType.Should().Be(BsonType.ObjectId);
        bson["BusinessIdeaId"].BsonType.Should().Be(BsonType.ObjectId);
        bson["RequestId"].BsonType.Should().Be(BsonType.ObjectId);

        var back = RoundTrip(e);
        back.OwnerUserId.Should().Be("user-1");
        back.Status.Should().Be("Completed");
        back.ClarityScore.Should().Be(80);
        back.SchemaVersion.Should().Be(1);
        back.Input!["title"].AsString.Should().Be("solar drones");
        back.Output!["clarityScore"].AsInt32.Should().Be(80);
    }

    [Fact]
    public void ClarifierSession_omits_null_optional_fields()
    {
        var e = new ClarifierSession
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = "user-1",
            Status = "Pending",
            Input = new BsonDocument("title", "x"),
        };

        var bson = Bson(e);
        bson.Contains("BusinessIdeaId").Should().BeFalse();
        bson.Contains("RequestId").Should().BeFalse();
        bson.Contains("Output").Should().BeFalse();
        bson.Contains("ClarityScore").Should().BeFalse();
        bson.Contains("Error").Should().BeFalse();

        var back = RoundTrip(e);
        back.BusinessIdeaId.Should().BeNull();
        back.Output.Should().BeNull();
        back.ClarityScore.Should().BeNull();
    }

    [Fact]
    public void AiCreditLedger_round_trips_debits()
    {
        var e = new AiCreditLedger
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = "user-1",
            Balance = 9,
            LifetimeGranted = 10,
            LifetimeSpent = 1,
            Debits = new List<AiCreditDebit>
            {
                new() { Amount = 1, Reason = "Probe" },
            },
        };

        var back = RoundTrip(e);
        back.Balance.Should().Be(9);
        back.Debits.Should().ContainSingle();
        back.Debits[0].Reason.Should().Be("Probe");
    }
}
