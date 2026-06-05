namespace WebApp.Models.Dtos.Ai
{
    /// <summary>An AI insight for <c>GET /api/ai/insights</c>.</summary>
    public class AiInsightDto
    {
        public string Id { get; set; } = "";
        public string Type { get; set; } = "";
        public object? Payload { get; set; }
        public string? SourceRequestId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
