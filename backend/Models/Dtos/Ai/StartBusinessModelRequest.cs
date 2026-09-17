using System.ComponentModel.DataAnnotations;

namespace WebApp.Models.Dtos.Ai
{
    public class StartBusinessModelRequest
    {
        [Required]
        public string MarketStudySessionId { get; set; } = "";

        public string? ClarifierSessionId { get; set; }

        public string? BusinessIdeaId { get; set; }
    }
}
