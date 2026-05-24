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

    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// "rule_based_v1" today. When an LLM is wired in, this becomes e.g.
    /// "claude-opus-4-7" or similar so callers can tell which engine
    /// produced the snapshot.
    /// </summary>
    public string EngineVersion { get; set; } = "rule_based_v1";
}
