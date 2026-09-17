using System.ComponentModel.DataAnnotations;

namespace WebApp.Models.Dtos.Ai
{
    public class StartMarketStudyRequest
    {
        [Required]
        public string ClarifierSessionId { get; set; } = "";

        public string? BusinessIdeaId { get; set; }
    }
}
