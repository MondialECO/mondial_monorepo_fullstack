using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// Token/cost ledger entry (collection <c>ModelUsage</c>), one per AI call.
    /// Aggregated by the usage service (Phase 6) for <c>GET /ai/usage</c>.
    /// </summary>
    public class AiModelUsage
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        [BsonElement("OwnerUserId")]
        public string OwnerUserId { get; set; } = "";

        [BsonElement("RequestId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string RequestId { get; set; } = "";

        [BsonElement("Model")]
        public string Model { get; set; } = "";

        [BsonElement("PromptTokens")]
        public int PromptTokens { get; set; }

        [BsonElement("CompletionTokens")]
        public int CompletionTokens { get; set; }

        [BsonElement("TotalTokens")]
        public int TotalTokens { get; set; }

        /// <summary>Provider-reported USD cost. Stored numerically as Decimal128
        /// (the driver default for decimal is a string) so it can be aggregated.</summary>
        [BsonElement("EstimatedCost")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal EstimatedCost { get; set; }

        [BsonElement("TaskType")]
        public string TaskType { get; set; } = "";

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
