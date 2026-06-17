using System.ComponentModel.DataAnnotations;

namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// Request body for <c>POST /api/ai/forecast</c> (one-shot MVP). The forecast is
    /// generated from the referenced Business-Plan session's output; the business
    /// idea, if any, is secondary context only. The horizon is fixed at 12 months —
    /// there is intentionally no horizon parameter.
    /// </summary>
    public class StartForecastRequest
    {
        /// <summary>The completed Business-Plan session whose output seeds the forecast.</summary>
        [Required]
        public string BusinessPlanSessionId { get; set; } = "";

        /// <summary>Optional source business idea, used only as secondary context.</summary>
        public string? BusinessIdeaId { get; set; }
    }
}
