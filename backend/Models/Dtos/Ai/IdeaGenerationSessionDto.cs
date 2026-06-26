using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Models.Dtos.Ai
{
    public class IdeaGenerationSessionDto
    {
        public string SessionId { get; set; } = "";
        public string Status { get; set; } = "Pending";
        public string? BusinessIdeaId { get; set; }
        public IdeaGenerationInput Input { get; set; } = new();
        public IdeaGenerationOutput? Output { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
