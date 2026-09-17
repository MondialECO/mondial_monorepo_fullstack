namespace WebApp.Models.Dtos.Ai
{
    public class BusinessModelSessionDto
    {
        public string SessionId { get; set; } = "";
        public string Status { get; set; } = "";
        public string MarketStudySessionId { get; set; } = "";
        public string ClarifierSessionId { get; set; } = "";
        public string? BusinessIdeaId { get; set; }
        public int CurrentVersion { get; set; }
        public int SchemaVersion { get; set; }
        public object? Output { get; set; }
        public List<BusinessModelVersionDto> Versions { get; set; } = new();
        public string? Error { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class BusinessModelVersionDto
    {
        public int Version { get; set; }
        public bool IsEdited { get; set; }
        public string? RequestId { get; set; }
        public object? Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
