using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// One AI Idea-Clarifier run (collection <c>ClarifierSessions</c>) and the
    /// C-2 source of truth: it owns the user-facing lifecycle and the structured
    /// clarified <see cref="Output"/> contract that C-3 (Business Plan) and C-4
    /// (Forecast) consume. The underlying <c>AIRequests</c>/<c>AIResponses</c>
    /// documents remain infrastructure-only (engine plumbing); this entity is
    /// what the API and downstream modules read. Does not extend
    /// <c>BusinessIdeas</c> — it references it by id. Follows the audited
    /// convention: string id stored as ObjectId, OwnerUserId scoping,
    /// CreatedAt/UpdatedAt.
    /// </summary>
    public class ClarifierSession
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        [BsonElement("OwnerUserId")]
        public string OwnerUserId { get; set; } = "";

        /// <summary>Optional reference to the source <c>BusinessIdeas</c> document.</summary>
        [BsonElement("BusinessIdeaId")]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonIgnoreIfNull]
        public string? BusinessIdeaId { get; set; }

        /// <summary>The infrastructure <c>AIRequests</c> job that processes this session.</summary>
        [BsonElement("RequestId")]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonIgnoreIfNull]
        public string? RequestId { get; set; }

        /// <summary>Pending | Processing | Completed | Failed | NeedsReview</summary>
        [BsonElement("Status")]
        public string Status { get; set; } = "Pending";

        /// <summary>The raw idea fields submitted by the creator.</summary>
        [BsonElement("Input")]
        public BsonDocument? Input { get; set; }

        /// <summary>
        /// The structured ClarifierOutput contract (see <c>ClarifierOutputDto</c>).
        /// Null until the run completes. Shape is versioned via
        /// <see cref="SchemaVersion"/> for forward-compatible C-3/C-4 consumption.
        /// </summary>
        [BsonElement("Output")]
        [BsonIgnoreIfNull]
        public BsonDocument? Output { get; set; }

        /// <summary>Denormalized 0–100 clarity score, for list/sort without parsing Output.</summary>
        [BsonElement("ClarityScore")]
        [BsonIgnoreIfNull]
        public int? ClarityScore { get; set; }

        /// <summary>Populated on terminal failure / needs-review.</summary>
        [BsonElement("Error")]
        [BsonIgnoreIfNull]
        public string? Error { get; set; }

        /// <summary>Version of the <see cref="Output"/> contract shape (starts at 1).</summary>
        [BsonElement("SchemaVersion")]
        public int SchemaVersion { get; set; } = 1;

        /// <summary>Regeneration counter (1 for the first run).</summary>
        [BsonElement("Version")]
        public int Version { get; set; } = 1;

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
