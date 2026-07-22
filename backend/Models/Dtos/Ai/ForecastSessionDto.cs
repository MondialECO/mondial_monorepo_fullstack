using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// A Forecast session for <c>GET /api/ai/forecast/{sessionId}</c> (and the list
    /// endpoint). The current version's editable forecast is inlined as
    /// <see cref="Output"/> so the client needs a single call; <see cref="Versions"/>
    /// carries the full regeneration/edit history (content included on the single
    /// fetch, metadata-only on the list). Mirrors <c>BusinessPlanSessionDto</c>.
    /// </summary>
    public class ForecastSessionDto
    {
        public string SessionId { get; set; } = "";

        /// <summary>Pending | Processing | Completed | Failed | NeedsReview</summary>
        public string Status { get; set; } = "";

        /// <summary>The Business-Plan session this forecast was generated from.</summary>
        public string BusinessPlanSessionId { get; set; } = "";

        public string? BusinessIdeaId { get; set; }

        /// <summary>Active version number; 0 until the first run completes.</summary>
        public int CurrentVersion { get; set; }

        public int SchemaVersion { get; set; }

        /// <summary>
        /// The current version's editable forecast (shape = <see cref="ForecastOutputDto"/>,
        /// camelCase keys), inlined as the stored document. Null until completed.
        /// </summary>
        public object? Output { get; set; }

        /// <summary>Full version history (order preserved).</summary>
        public List<ForecastVersionDto> Versions { get; set; } = new();

        public string? Error { get; set; }

        /// <summary>
        /// The five stored generation inputs (arpu / opex / monthlyGrowthPct / tam /
        /// monthlyChurnPct), so the client can pre-fill the form from the last run.
        /// Null on sessions created before this field was exposed. Reuses the domain
        /// model, which carries exactly these five values — no internal fields.
        /// </summary>
        public ForecastInputs? Inputs { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
