namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// Status of an AI job for <c>GET /api/ai/jobs/{id}</c>. When the job is
    /// Completed the <see cref="Result"/> is inlined (hydrated from AIResponses),
    /// so the client needs a single call and never sees a response id.
    /// </summary>
    public class AiJobStatusDto
    {
        public string JobId { get; set; } = "";
        public string JobType { get; set; } = "";
        public string Status { get; set; } = "";
        public string? Error { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        /// <summary>Inlined result when Status == Completed; otherwise null.</summary>
        public AiJobResultDto? Result { get; set; }
    }

    public class AiJobResultDto
    {
        public string? ResponseId { get; set; }
        public string Model { get; set; } = "";
        public string? Text { get; set; }
        public object? Output { get; set; }
        public int TotalTokens { get; set; }
        public string? FinishReason { get; set; }
    }
}
