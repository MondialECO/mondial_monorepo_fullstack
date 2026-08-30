using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using WebApp.Models.Dtos;

namespace WebApp.Models.DatabaseModels;

/// <summary>
/// Immutable snapshot of one Automated Readiness Review run. Persisted so
/// entrepreneurs can see how their score has trended over time and so we
/// have an audit trail for the badge-award decision. The latest snapshot
/// is also mirrored to <c>Companies.AiReview</c> for the cheap "current
/// score" read path.
///
/// LLM note: when an external AI provider is wired up later, the model
/// output should be persisted into this same snapshot shape (plus any
/// model identifier / prompt-hash for reproducibility). Keep the snapshot
/// model stable across dev and prod review engines.
/// </summary>
public class Phase7ReviewSnapshot
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string CompanyId { get; set; }

    public int OverallScore { get; set; }
    public ScoreBreakdownDto ScoreBreakdown { get; set; }
    public bool InvestorReadyBadge { get; set; }
    public List<RecommendationDto> Recommendations { get; set; } = new();
    public PitchDeckAnalysisDto PitchDeckAnalysis { get; set; }

    // Qualitative intelligence layer
    public string ExecutiveSummary { get; set; } = string.Empty;
    public List<string> Strengths { get; set; } = new();
    public List<string> Weaknesses { get; set; } = new();
    public List<ExpertRiskItem> Risks { get; set; } = new();
    public List<CrossModuleInconsistency> Inconsistencies { get; set; } = new();
    public List<MissingItemGap> MissingItems { get; set; } = new();
    public List<PitchRefinementItem> PitchRecommendations { get; set; } = new();
    public List<ActionRemediationItem> ActionItems { get; set; } = new();
    public Phase7MatchingIntelligence MatchingIntelligence { get; set; } = new();

    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Engine provenance version. e.g. "expert_intelligence_v1" or OpenRouter model ID.
    /// </summary>
    public string EngineVersion { get; set; } = "expert_intelligence_v1";
}

public class ExpertRiskItem
{
    public string Category { get; set; } = "General"; // Financial | Governance | Market | Legal | Product
    public string Severity { get; set; } = "MEDIUM"; // LOW | MEDIUM | HIGH | CRITICAL
    public string Title { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public string Evidence { get; set; } = string.Empty;
    public string RecommendedAction { get; set; } = string.Empty;
}

public class CrossModuleInconsistency
{
    public string ModuleA { get; set; } = string.Empty;
    public string ModuleB { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Evidence { get; set; } = string.Empty;
    public string Severity { get; set; } = "MEDIUM";
}

public class MissingItemGap
{
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RequiredBy { get; set; } = string.Empty;
}

public class PitchRefinementItem
{
    public string Section { get; set; } = string.Empty;
    public string Problem { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty;
    public string Priority { get; set; } = "medium";
}

public class ActionRemediationItem
{
    public int PhaseNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "medium";
    public int PotentialPointGain { get; set; }
}

public class Phase7MatchingIntelligence
{
    public List<string> ValidatedSectorTags { get; set; } = new();
    public List<string> BusinessModelTags { get; set; } = new();
    public string RiskBand { get; set; } = "Moderate";
    public List<string> FundingFitSignals { get; set; } = new();
    public List<string> RecommendedInvestorTypes { get; set; } = new();
    public List<string> QualitativeStrengthTags { get; set; } = new();
}

