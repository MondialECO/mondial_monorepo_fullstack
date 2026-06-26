using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// Phase 2 Idea Generation session: synthesizes 3 venture concepts from
    /// sectors, observed problem, and strengths. Stored in MongoDB, source of truth
    /// for the discovery branch (steps 2–5). Status workflow: Pending → Processing →
    /// Completed/Failed/NeedsReview (terminal).
    /// </summary>
    [BsonIgnoreExtraElements]
    public class IdeaGenerationSession
    {
        [BsonId]
        public ObjectId Id { get; set; }

        public string OwnerUserId { get; set; } = null!;

        [BsonIgnoreIfNull]
        public string? BusinessIdeaId { get; set; }

        public string Status { get; set; } = "Pending";

        /// <summary>Input payload: sectors[], observedProblem, strengths[]</summary>
        [BsonIgnoreIfNull]
        public BsonDocument? Input { get; set; }

        /// <summary>Output: ideas[] array. Populated when status=Completed.</summary>
        [BsonIgnoreIfNull]
        public BsonDocument? Output { get; set; }

        /// <summary>The job request ID (Hangfire) that processed this session.</summary>
        [BsonIgnoreIfNull]
        public string? RequestId { get; set; }

        /// <summary>Error message if status=Failed or NeedsReview.</summary>
        [BsonIgnoreIfNull]
        public string? Error { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
