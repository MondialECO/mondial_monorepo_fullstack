using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// Persisted AI completion result (collection <c>AIResponses</c>), one per
    /// successful <see cref="AiRequest"/> run. <c>GET /ai/jobs/{id}</c> hydrates
    /// the inline result from here.
    /// </summary>
    public class AiResponse
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        [BsonElement("RequestId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string RequestId { get; set; } = "";

        [BsonElement("OwnerUserId")]
        public string OwnerUserId { get; set; } = "";

        [BsonElement("Model")]
        public string Model { get; set; } = "";

        /// <summary>Structured/parsed output (module-defined schema).</summary>
        [BsonElement("OutputPayload")]
        public BsonDocument? OutputPayload { get; set; }

        /// <summary>Raw model text as returned by the provider.</summary>
        [BsonElement("RawText")]
        public string? RawText { get; set; }

        [BsonElement("TokenUsage")]
        public AiResponseTokenUsage TokenUsage { get; set; } = new();

        [BsonElement("FinishReason")]
        public string? FinishReason { get; set; }

        /// <summary>Regeneration version (1 for the first response).</summary>
        [BsonElement("Version")]
        public int Version { get; set; } = 1;

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>Embedded token accounting for a persisted response.</summary>
    public class AiResponseTokenUsage
    {
        [BsonElement("PromptTokens")]
        public int PromptTokens { get; set; }

        [BsonElement("CompletionTokens")]
        public int CompletionTokens { get; set; }

        [BsonElement("TotalTokens")]
        public int TotalTokens { get; set; }
    }
}
