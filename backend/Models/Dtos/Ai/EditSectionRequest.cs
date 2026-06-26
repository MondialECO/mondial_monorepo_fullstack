using System.ComponentModel.DataAnnotations;

namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// Request body for <c>PATCH /api/ai/business-plan/{sessionId}/section</c>. Persists
    /// a manual edit of ONE display section's primary text to the canonical plan (no AI
    /// run). The splice goes through the same <c>BusinessPlanSections.ReplaceField</c>
    /// path the AI rewrite uses; the other sections are preserved, the version is bumped,
    /// and a new immutable snapshot is appended (locked C-3 decision #5).
    /// </summary>
    public class EditSectionRequest
    {
        /// <summary>The display section id (e.g. "executive", "target-market", "gtm").</summary>
        [Required]
        public string SectionId { get; set; } = string.Empty;

        /// <summary>The edited primary free-text for that section.</summary>
        public string Content { get; set; } = string.Empty;
    }
}
