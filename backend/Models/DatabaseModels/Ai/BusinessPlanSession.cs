using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// One AI Business-Plan workspace (collection <c>BusinessPlanSessions</c>) and
    /// the C-3 source of truth. Mirrors <see cref="ClarifierSession"/>'s audited
    /// conventions (string id stored as ObjectId, OwnerUserId scoping,
    /// CreatedAt/UpdatedAt, Status lifecycle) but, unlike the clarifier, it does
    /// NOT overwrite its output: every AI run is preserved as an append-only
    /// <see cref="BusinessPlanVersion"/> (regeneration history), and user edits
    /// mutate only the current version's editable content — never a historical
    /// version. The authoritative generation input is the referenced
    /// <see cref="ClarifierSessionId"/>'s <c>Output</c> (locked C-3 decision #2);
    /// <see cref="BusinessIdeaId"/> is optional secondary context only.
    /// </summary>
    public class BusinessPlanSession
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        [BsonElement("OwnerUserId")]
        public string OwnerUserId { get; set; } = "";

        /// <summary>
        /// The authoritative input: the completed <c>ClarifierSessions</c> document
        /// whose <c>Output</c> seeds this plan (locked C-3 decision #2). Required.
        /// </summary>
        [BsonElement("ClarifierSessionId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ClarifierSessionId { get; set; } = "";

        /// <summary>Optional source <c>BusinessIdeas</c> document — secondary context only.</summary>
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
        /// Append-only generation/edit history. Each AI run appends one version;
        /// previous versions are never overwritten (locked C-3 decision #5).
        /// </summary>
        [BsonElement("Versions")]
        public List<BusinessPlanVersion> Versions { get; set; } = new();

        /// <summary>
        /// Version number of the active plan (the latest generated/edited one).
        /// 0 until the first run completes.
        /// </summary>
        [BsonElement("CurrentVersion")]
        public int CurrentVersion { get; set; }

        /// <summary>Populated on terminal failure / needs-review.</summary>
        [BsonElement("Error")]
        [BsonIgnoreIfNull]
        public string? Error { get; set; }

        /// <summary>Version of the <c>BusinessPlanOutput</c> contract shape (starts at 1).</summary>
        [BsonElement("SchemaVersion")]
        public int SchemaVersion { get; set; } = 1;

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// One immutable generation in a <see cref="BusinessPlanSession"/>'s history.
    /// <see cref="GeneratedContent"/> is the verbatim AI output snapshot and is
    /// never mutated; <see cref="Content"/> is the editable working copy (starts
    /// equal to the generated snapshot) that user edits update in place without an
    /// AI run (locked C-3 decision #6).
    /// </summary>
    public class BusinessPlanVersion
    {
        /// <summary>1-based version number within the session.</summary>
        [BsonElement("Version")]
        public int Version { get; set; }

        /// <summary>The verbatim, immutable AI output (BusinessPlanOutput contract).</summary>
        [BsonElement("GeneratedContent")]
        public BsonDocument? GeneratedContent { get; set; }

        /// <summary>The editable working copy surfaced to the user; starts == generated.</summary>
        [BsonElement("Content")]
        public BsonDocument? Content { get; set; }

        /// <summary>The <c>AIRequests</c> job that produced this version (null for pure edits).</summary>
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
