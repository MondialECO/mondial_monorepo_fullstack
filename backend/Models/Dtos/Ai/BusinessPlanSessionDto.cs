namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// A Business-Plan session for <c>GET /api/ai/business-plan/{sessionId}</c>
    /// (and the list endpoint). The current version's editable plan is inlined as
    /// <see cref="Output"/> so the client needs a single call; <see cref="Versions"/>
    /// carries the full regeneration/edit history (content included on the single
    /// fetch, metadata-only on the list).
    /// </summary>
    public class BusinessPlanSessionDto
    {
        public string SessionId { get; set; } = "";

        /// <summary>Pending | Processing | Completed | Failed | NeedsReview</summary>
        public string Status { get; set; } = "";

        public string ClarifierSessionId { get; set; } = "";

        public string? BusinessIdeaId { get; set; }

        /// <summary>Active version number; 0 until the first run completes.</summary>
        public int CurrentVersion { get; set; }

        public int SchemaVersion { get; set; }

        /// <summary>
        /// The current version's editable plan (shape = <see cref="BusinessPlanOutputDto"/>,
        /// camelCase keys), inlined as the stored document. Null until completed.
        /// </summary>
        public object? Output { get; set; }

        /// <summary>Full version history (newest concepts first preserved in order).</summary>
        public List<BusinessPlanVersionDto> Versions { get; set; } = new();

        public string? Error { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// One entry in a session's history. <see cref="Content"/> is populated on the
    /// single-session fetch and omitted on the list endpoint to keep it light.
    /// </summary>
    public class BusinessPlanVersionDto
    {
        public int Version { get; set; }
        public bool IsEdited { get; set; }
        public string? RequestId { get; set; }

        /// <summary>The version's editable plan; null on list responses.</summary>
        public object? Content { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
