using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    [BsonIgnoreExtraElements]
    public class IdeaGenerationSession
    {
        [BsonId]
        public ObjectId Id { get; set; }

        public string OwnerUserId { get; set; } = null!;

        [BsonIgnoreIfNull]
        public string? BusinessIdeaId { get; set; }

        public string Status { get; set; } = "Pending"; // Pending/Processing/Completed/Failed/NeedsReview

        public IdeaGenerationInput Input { get; set; } = new();

        [BsonIgnoreIfNull]
        public IdeaGenerationOutput? Output { get; set; }

        [BsonIgnoreIfNull]
        public string? RequestId { get; set; }

        [BsonIgnoreIfNull]
        public string? ErrorMessage { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class IdeaGenerationInput
    {
        public string[] Sectors { get; set; } = Array.Empty<string>();
        public string ObservedProblem { get; set; } = "";
        public string[] Strengths { get; set; } = Array.Empty<string>();
    }

    public class IdeaGenerationOutput
    {
        public GeneratedIdea[] Ideas { get; set; } = Array.Empty<GeneratedIdea>();
        public int SchemaVersion { get; set; } = 1;
    }

    public class GeneratedIdea
    {
        public string Title { get; set; } = "";
        public string Problem { get; set; } = "";
        public string Solution { get; set; } = "";
        public string MarketGap { get; set; } = "";
        public double Score { get; set; } // 0-100

        // Intelligence-panel fields (qualitative — small models estimate these).
        public string Tam { get; set; } = "";              // e.g. "$2.5B"
        public string Saturation { get; set; } = "";       // Low / Medium / High
        public string SimilarTo { get; set; } = "";        // comparable company
        public string TargetUser { get; set; } = "";       // primary customer segment
        public string FounderEdge { get; set; } = "";      // why this founder wins
    }
}
