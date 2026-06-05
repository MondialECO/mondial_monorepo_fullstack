using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Jobs
{
    /// <summary>
    /// Durable persistence for the LEGACY background jobs (AI Review, Investor
    /// Matching, Data Room Analysis, Financial Projections) that previously lived
    /// only in an in-memory <c>Dictionary</c> and were lost on restart.
    ///
    /// This is a DEDICATED collection (<c>BackgroundJobs</c>) — deliberately NOT
    /// the AI-pipeline <c>AIRequests</c> collection (C-1 Section C / item 12–13).
    /// The new AI job engine (Phase 4) uses its own entities; these two job
    /// families share only the Hangfire execution infrastructure, not storage.
    ///
    /// Field set mirrors the public <c>JobStatus</c> DTO so the existing
    /// BackgroundJobController contract is preserved exactly.
    /// </summary>
    public class BackgroundJobRecord
    {
        /// <summary>
        /// App-generated GUID string. Also the correlation key returned to API
        /// callers as <c>jobId</c> and used by <c>GetJobStatusAsync</c>.
        /// </summary>
        [BsonId]
        [BsonRepresentation(BsonType.String)]
        public string JobId { get; set; } = "";

        /// <summary>ai-review | investor-matching | data-room-analysis | financial-projections</summary>
        [BsonElement("JobType")]
        public string JobType { get; set; } = "";

        [BsonElement("CompanyId")]
        public string? CompanyId { get; set; }

        [BsonElement("OwnerUserId")]
        public string OwnerUserId { get; set; } = "";

        /// <summary>queued | processing | completed | failed</summary>
        [BsonElement("Status")]
        public string Status { get; set; } = "queued";

        [BsonElement("Result")]
        public string? Result { get; set; }

        [BsonElement("ErrorMessage")]
        public string? ErrorMessage { get; set; }

        /// <summary>Hangfire's own job id for dashboard correlation.</summary>
        [BsonElement("HangfireJobId")]
        public string? HangfireJobId { get; set; }

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("CompletedAt")]
        public DateTime? CompletedAt { get; set; }
    }
}
