namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// Request to initiate Phase 2 Idea Generation. Validates input at the
    /// controller layer (sectors 1-3, problem ≥10 chars, strengths 1-3).
    /// </summary>
    public class StartIdeaGenerationRequest
    {
        /// <summary>1-3 market sectors/verticals (e.g., ["tech", "health"]).</summary>
        public string[] Sectors { get; set; } = Array.Empty<string>();

        /// <summary>Observed problem statement (min 10 characters).</summary>
        public string ObservedProblem { get; set; } = "";

        /// <summary>1-3 core strengths/complements (e.g., ["design", "coding"]).</summary>
        public string[] Strengths { get; set; } = Array.Empty<string>();

        /// <summary>Optional: existing business idea ID to associate with this generation.</summary>
        public string? BusinessIdeaId { get; set; }
    }
}
