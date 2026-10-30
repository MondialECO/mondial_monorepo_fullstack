using System.ComponentModel.DataAnnotations;

namespace WebApp.Models.Dtos.Ai
{
    /// <summary>Request body for <c>POST /api/ai/idea-clarifier</c> (one-shot MVP).</summary>
    public class StartClarifierRequest
    {
        /// <summary>Optional source business idea to attach the session to.</summary>
        public string? BusinessIdeaId { get; set; }

        /// <summary>ISO 639-1 language code (en, fr, etc.). Clarifier output will be generated in this language.</summary>
        public string? Language { get; set; }

        /// <summary>The raw idea fields to clarify.</summary>
        [Required]
        public RawIdeaInput RawIdea { get; set; } = new();
    }

    /// <summary>
    /// Raw idea the creator submits. Required fields mirror the Creator Journey
    /// validation rules (Idea Title, Problem Statement, Target Audience).
    /// </summary>
    public class RawIdeaInput
    {
        [Required]
        public string Title { get; set; } = "";

        [Required]
        public string ProblemStatement { get; set; } = "";

        [Required]
        public string TargetAudience { get; set; } = "";

        public string? Description { get; set; }

        public string? ExistingAlternatives { get; set; }

        /// <summary>Founder-provided reason the idea is timely.</summary>
        public string? WhyNow { get; set; }

        /// <summary>Founder-provided highest-risk assumption.</summary>
        public string? RiskiestAssumption { get; set; }

        /// <summary>Founder-provided relevant experience or unfair advantage.</summary>
        public string? FounderAdvantage { get; set; }

        /// <summary>
        /// Raw-idea field names (e.g. "whyNow") whose clarifier topic ended weak. C-2 and Phase 3
        /// must treat them as unconfirmed assumptions, never as confirmed answers.
        /// </summary>
        public List<string> UnconfirmedFields { get; set; } = new();

        /// <summary>Optional supporting reference/attachment URLs.</summary>
        public List<string> Attachments { get; set; } = new();
    }
}
