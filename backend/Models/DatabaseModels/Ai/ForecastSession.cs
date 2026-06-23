using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// One AI Forecast workspace (collection <c>ForecastSessions</c>) and the C-4
    /// source of truth. Mirrors <see cref="BusinessPlanSession"/>'s audited
    /// conventions (string id stored as ObjectId, OwnerUserId scoping,
    /// CreatedAt/UpdatedAt, Status lifecycle) and its append-only versioning: every
    /// AI run is preserved as an immutable <see cref="ForecastVersion"/>, and user
    /// edits mutate only the current version's editable content — never a historical
    /// version. The authoritative generation input is the referenced
    /// <see cref="BusinessPlanSessionId"/>'s active plan; <see cref="BusinessIdeaId"/>
    /// is optional secondary context only.
    /// </summary>
    public class ForecastSession
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        [BsonElement("OwnerUserId")]
        public string OwnerUserId { get; set; } = "";

        /// <summary>
        /// The authoritative input: the <c>BusinessPlanSessions</c> document whose
        /// active plan seeds this forecast. Required at Start (ForecastController.Start
        /// enforces via 422 guards: business_plan_required, business_plan_not_found,
        /// business_plan_not_complete). Nullable at storage layer ([BsonIgnoreIfNull])
        /// for backwards compatibility with older sessions.
        /// </summary>
        [BsonElement("BusinessPlanSessionId")]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonIgnoreIfNull]
        public string? BusinessPlanSessionId { get; set; }

        /// <summary>Standalone forecast inputs (ARPU / OPEX / monthly growth / TAM).</summary>
        [BsonElement("Inputs")]
        [BsonIgnoreIfNull]
        public ForecastInputs? Inputs { get; set; }

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
        /// previous versions are never overwritten.
        /// </summary>
        [BsonElement("Versions")]
        public List<ForecastVersion> Versions { get; set; } = new();

        /// <summary>
        /// Version number of the active forecast (the latest generated/edited one).
        /// 0 until the first run completes.
        /// </summary>
        [BsonElement("CurrentVersion")]
        public int CurrentVersion { get; set; }

        /// <summary>Populated on terminal failure / needs-review.</summary>
        [BsonElement("Error")]
        [BsonIgnoreIfNull]
        public string? Error { get; set; }

        /// <summary>Version of the <c>ForecastOutput</c> contract shape (starts at 1).</summary>
        [BsonElement("SchemaVersion")]
        public int SchemaVersion { get; set; } = 1;

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// One immutable generation in a <see cref="ForecastSession"/>'s history.
    /// <see cref="GeneratedContent"/> is the verbatim AI output snapshot and is never
    /// mutated; <see cref="Content"/> is the editable working copy (starts equal to
    /// the generated snapshot) that user edits update in place without an AI run.
    /// </summary>
    public class ForecastVersion
    {
        /// <summary>1-based version number within the session.</summary>
        [BsonElement("Version")]
        public int Version { get; set; }

        /// <summary>The verbatim, immutable AI output (ForecastOutput contract).</summary>
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

    /// <summary>Standalone forecast inputs the engine computes from (no plan required).</summary>
    public sealed class ForecastInputs
    {
        public double? Arpu { get; set; }
        public double? Opex { get; set; }
        public double? MonthlyGrowthPct { get; set; }
        public double? Tam { get; set; }

        /// <summary>
        /// Monthly customer churn, as a PERCENT number (e.g. 3 = 3%/month), matching the
        /// MonthlyGrowthPct convention. Drives the readiness LTV/CAC sub-score
        /// (LTV = ARPU / churn) so it discriminates real unit economics. Nullable at
        /// storage (old sessions / not entered) → readiness falls back to the documented
        /// prior constant. See <see cref="WebApp.Services.Implementations.CreatorScoring.LtvCacHealthy"/>.
        /// </summary>
        public double? MonthlyChurnPct { get; set; }
    }
}
