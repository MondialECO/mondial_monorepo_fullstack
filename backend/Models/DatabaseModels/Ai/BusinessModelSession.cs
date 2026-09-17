using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// One AI Business-Model workspace (collection <c>BusinessModelSessions</c>) and the
    /// Phase 3.2 source of truth. Mirrors <see cref="BusinessPlanSession"/>'s audited
    /// conventions (string id stored as ObjectId, OwnerUserId scoping, CreatedAt/UpdatedAt,
    /// Status lifecycle) and append-only versioning: each AI run appends an immutable
    /// <see cref="BusinessModelVersion"/>. The authoritative inputs are the referenced
    /// <see cref="MarketStudySessionId"/>'s <c>Output</c>, <see cref="ClarifierSessionId"/>,
    /// and <see cref="CreatorIdea.Project"/> fields.
    /// </summary>
    public class BusinessModelSession
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        [BsonElement("OwnerUserId")]
        public string OwnerUserId { get; set; } = "";

        /// <summary>
        /// The authoritative input: the completed <c>MarketStudySessions</c> document
        /// whose <c>Output</c> seeds this business model. Required.
        /// </summary>
        [BsonElement("MarketStudySessionId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string MarketStudySessionId { get; set; } = "";

        /// <summary>
        /// Secondary reference to the underlying <c>ClarifierSessions</c> document.
        /// </summary>
        [BsonElement("ClarifierSessionId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ClarifierSessionId { get; set; } = "";

        /// <summary>Optional source <c>BusinessIdeas</c> document — secondary context.</summary>
        [BsonElement("BusinessIdeaId")]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonIgnoreIfNull]
        public string? BusinessIdeaId { get; set; }

        /// <summary>The latest infrastructure <c>AIRequests</c> job driving this session.</summary>
        [BsonElement("RequestId")]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonIgnoreIfNull]
        public string? RequestId { get; set; }

        /// <summary>Pending | Processing | Completed | Failed | NeedsReview</summary>
        [BsonElement("Status")]
        public string Status { get; set; } = "Pending";

        /// <summary>
        /// Present only while generation is in flight (Pending/Processing).
        /// Indexed with a unique sparse index to guarantee atomic double-click deduplication.
        /// Cleared upon terminal transition (Completed, Failed, NeedsReview).
        /// </summary>
        [BsonElement("InFlightKey")]
        [BsonIgnoreIfNull]
        public string? InFlightKey { get; set; }

        /// <summary>
        /// Append-only generation/edit history. Each AI run appends one version;
        /// previous versions are never overwritten.
        /// </summary>
        [BsonElement("Versions")]
        public List<BusinessModelVersion> Versions { get; set; } = new();

        /// <summary>
        /// Version number of the active model (the latest generated/edited one).
        /// 0 until the first run completes.
        /// </summary>
        [BsonElement("CurrentVersion")]
        public int CurrentVersion { get; set; }

        /// <summary>Populated on terminal failure / needs-review.</summary>
        [BsonElement("Error")]
        [BsonIgnoreIfNull]
        public string? Error { get; set; }

        /// <summary>Version of the <c>BusinessModelOutput</c> contract shape (starts at 1).</summary>
        [BsonElement("SchemaVersion")]
        public int SchemaVersion { get; set; } = 1;

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// One immutable generation in a <see cref="BusinessModelSession"/>'s history.
    /// <see cref="GeneratedContent"/> is the verbatim AI output snapshot;
    /// <see cref="Content"/> is the working copy surfaced to the user.
    /// </summary>
    public class BusinessModelVersion
    {
        /// <summary>1-based version number within the session.</summary>
        [BsonElement("Version")]
        public int Version { get; set; }

        /// <summary>The verbatim, immutable AI output (BusinessModelOutput contract).</summary>
        [BsonElement("GeneratedContent")]
        public BsonDocument? GeneratedContent { get; set; }

        /// <summary>The editable working copy surfaced to the user; starts == generated.</summary>
        [BsonElement("Content")]
        public BsonDocument? Content { get; set; }

        /// <summary>The <c>AIRequests</c> job that produced this version.</summary>
        [BsonElement("RequestId")]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonIgnoreIfNull]
        public string? RequestId { get; set; }

        /// <summary>True once a user has edited <see cref="Content"/> away from the generated snapshot.</summary>
        [BsonElement("IsEdited")]
        public bool IsEdited { get; set; }

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
