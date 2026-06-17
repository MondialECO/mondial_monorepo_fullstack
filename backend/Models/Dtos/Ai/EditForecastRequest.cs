using System.ComponentModel.DataAnnotations;

namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// Request body for <c>PUT /api/ai/forecast/{sessionId}</c>. Replaces the current
    /// version's editable forecast with user-supplied content WITHOUT triggering a new
    /// AI run. The immutable generated snapshot and all historical versions are
    /// preserved (mirrors the Business-Plan edit semantics).
    /// </summary>
    public class EditForecastRequest
    {
        /// <summary>The edited forecast (ForecastOutput contract shape).</summary>
        [Required]
        public ForecastOutputDto Forecast { get; set; } = new();
    }
}
