namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// The structured Idea-Clarifier output contract — the typed mirror of the
    /// JSON the model is asked to return (see the IdeaClarifier prompt's output
    /// contract) and of <c>ClarifierSession.Output</c>. This is the locked
    /// hand-off shape consumed by C-3 (Business Plan) and C-4 (Forecast):
    ///   ProblemDefinition + ExistingAlternatives → Market/Competitor Analysis
    ///   ProposedSolution                         → Executive Summary / Revenue Model
    ///   TargetAudience                           → Go-To-Market
    ///   RiskAssessment                           → weakness analysis
    ///   Assumptions + TargetAudience.SizeQualitative → Forecast inputs
    ///   ClarityScore                             → confidence / gating metric
    /// <see cref="SchemaVersion"/> keeps it forward-compatible.
    /// </summary>
    public class ClarifierOutputDto
    {
        /// <summary>Current contract version emitted by C-2.</summary>
        public const int CurrentSchemaVersion = 1;

        public int SchemaVersion { get; set; } = CurrentSchemaVersion;

        public ProblemDefinitionDto ProblemDefinition { get; set; } = new();

        public TargetAudienceDto TargetAudience { get; set; } = new();

        public List<ExistingAlternativeDto> ExistingAlternatives { get; set; } = new();

        public ProposedSolutionDto ProposedSolution { get; set; } = new();

        public List<RiskDto> RiskAssessment { get; set; } = new();

        /// <summary>Key assumptions that seed C-4 Forecast.</summary>
        public List<string> Assumptions { get; set; } = new();

        /// <summary>0–100 clarity score.</summary>
        public int ClarityScore { get; set; }

        public string? ClarityRationale { get; set; }

        public List<string> Tags { get; set; } = new();
    }

    public class ProblemDefinitionDto
    {
        public string Statement { get; set; } = "";
        public List<string> PainPoints { get; set; } = new();

        /// <summary>low | medium | high</summary>
        public string? Severity { get; set; }
    }

    public class TargetAudienceDto
    {
        public string PrimarySegment { get; set; } = "";
        public List<string> Characteristics { get; set; } = new();

        /// <summary>Qualitative size/reach statement (no quantitative guarantees).</summary>
        public string? SizeQualitative { get; set; }
    }

    public class ExistingAlternativeDto
    {
        public string Name { get; set; } = "";
        public string? Gap { get; set; }
    }

    public class ProposedSolutionDto
    {
        public string Summary { get; set; } = "";
        public string? Differentiation { get; set; }
        public string? ValueProposition { get; set; }
    }

    public class RiskDto
    {
        public string Category { get; set; } = "";
        public string Description { get; set; } = "";

        /// <summary>low | medium | high</summary>
        public string? Likelihood { get; set; }
        public string? Mitigation { get; set; }
    }
}
