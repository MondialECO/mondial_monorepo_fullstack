using System.ComponentModel.DataAnnotations;

namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// Request body for <c>POST /api/ai/business-plan</c> (one-shot MVP). The plan
    /// is generated from the referenced clarifier session's output (locked C-3
    /// decision #2); the business idea, if any, is secondary context only.
    /// </summary>
    public class StartBusinessPlanRequest
    {
        /// <summary>The completed Idea-Clarifier session whose output seeds the plan.</summary>
        [Required]
        public string ClarifierSessionId { get; set; } = "";

        /// <summary>Optional source business idea, used only as secondary context.</summary>
        public string? BusinessIdeaId { get; set; }
    }
}
