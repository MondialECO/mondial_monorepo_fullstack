using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// One durable AI job request (collection <c>AIRequests</c>). This is the
    /// AI-pipeline request store — distinct from the legacy <c>BackgroundJobs</c>
    /// collection. Follows the audited convention: string id represented as
    /// ObjectId, OwnerUserId for ownership scoping, CreatedAt/UpdatedAt.
    /// </summary>
    public class AiRequest
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        [BsonElement("OwnerUserId")]
        public string OwnerUserId { get; set; } = "";

        /// <summary>Probe | IdeaClarifier | BusinessPlan | Forecast</summary>
        [BsonElement("JobType")]
        public string JobType { get; set; } = "";

        /// <summary>Pending | Processing | Completed | Failed</summary>
        [BsonElement("Status")]
        public string Status { get; set; } = "Pending";

        /// <summary>Free-form module input (schema owned by each module).</summary>
        [BsonElement("InputPayload")]
        public BsonDocument? InputPayload { get; set; }

        [BsonElement("PromptKey")]
        public string? PromptKey { get; set; }

        [BsonElement("PromptVersion")]
        public int? PromptVersion { get; set; }

        /// <summary>Hangfire job id for dashboard correlation.</summary>
        [BsonElement("HangfireJobId")]
        public string? HangfireJobId { get; set; }

        /// <summary>Populated on terminal failure.</summary>
        [BsonElement("Error")]
        public string? Error { get; set; }

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
