namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// Per-section rewrite request (audit P1.8). Re-runs C-3 for a single display
    /// section; rate-limited to 100/day/user.
    /// </summary>
    public class RewriteSectionRequest
    {
        public string BusinessPlanSessionId { get; set; }
        public string SectionId { get; set; }
    }
}
