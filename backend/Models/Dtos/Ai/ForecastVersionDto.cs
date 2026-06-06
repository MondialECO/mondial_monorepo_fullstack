namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// One entry in a Forecast session's history. <see cref="Content"/> is populated
    /// on the single-session fetch and omitted on the list endpoint to keep it light
    /// (mirrors the Business-Plan version-history convention).
    /// </summary>
    public class ForecastVersionDto
    {
        public int Version { get; set; }
        public bool IsEdited { get; set; }
        public string? RequestId { get; set; }

        /// <summary>The version's editable forecast (shape = <see cref="ForecastOutputDto"/>); null on list responses.</summary>
        public object? Content { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
