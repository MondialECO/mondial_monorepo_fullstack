using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// A derived AI insight surfaced to the user (collection <c>AIInsights</c>),
    /// read by <c>GET /ai/insights</c>.
    /// </summary>
    public class AiInsight
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        [BsonElement("OwnerUserId")]
        public string OwnerUserId { get; set; } = "";

        [BsonElement("Type")]
        public string Type { get; set; } = "";

        [BsonElement("Payload")]
        public BsonDocument? Payload { get; set; }

        [BsonElement("SourceRequestId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? SourceRequestId { get; set; }

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
