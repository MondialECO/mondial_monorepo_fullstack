using System.ComponentModel.DataAnnotations;

namespace WebApp.Models.Dtos.Ai
{
    public class StartIdeaGenerationRequest
    {
        [Required]
        [MinLength(1)]
        [MaxLength(3)]
        public string[] Sectors { get; set; } = Array.Empty<string>();

        [Required]
        [MinLength(10)]
        public string ObservedProblem { get; set; } = "";

        [Required]
        [MinLength(1)]
        [MaxLength(3)]
        public string[] Strengths { get; set; } = Array.Empty<string>();
    }
}
