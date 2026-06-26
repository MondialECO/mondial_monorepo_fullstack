namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// A Clarifier session for <c>GET /api/ai/idea-clarifier/{sessionId}</c> (and
    /// the list endpoint). The structured <see cref="Output"/> is inlined when
    /// the run has produced it, so the client needs a single call.
    /// </summary>
    public class ClarifierSessionDto
    {
        public string SessionId { get; set; } = "";

        /// <summary>Pending | Processing | Completed | Failed | NeedsReview</summary>
        public string Status { get; set; } = "";

        public string? BusinessIdeaId { get; set; }

        /// <summary>Denormalized 0–100 score; null until completed.</summary>
        public int? ClarityScore { get; set; }

        /// <summary>
        /// The structured ClarifierOutput contract (shape = <see cref="ClarifierOutputDto"/>,
        /// camelCase keys), inlined as the stored document so the wire shape matches
        /// <c>AiController</c>'s result mapping. Null until completed.
        /// </summary>
        public object? Output { get; set; }

        public string? Error { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
