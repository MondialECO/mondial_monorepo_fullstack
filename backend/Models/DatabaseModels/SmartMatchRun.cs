using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    /// <summary>One smart-match run snapshot (collection <c>SmartMatchRuns</c>).</summary>
    public class SmartMatchRun
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string UserId { get; set; }
        public int PhaseContext { get; set; } // 5 buyers | 6 investors
        public int MatchCount { get; set; }
        public double TopScore { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
