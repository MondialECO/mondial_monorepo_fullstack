using System.ComponentModel.DataAnnotations;

namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// Request body for <c>PUT /api/ai/business-plan/{sessionId}</c>. Replaces the
    /// current version's editable plan with user-supplied content WITHOUT triggering
    /// a new AI run (locked C-3 decision #6). The immutable generated snapshot and
    /// all historical versions are preserved (locked C-3 decision #5).
    /// </summary>
    public class EditBusinessPlanRequest
    {
        /// <summary>The edited plan (BusinessPlanOutput contract shape).</summary>
        [Required]
        public BusinessPlanOutputDto Plan { get; set; } = new();
    }
}
