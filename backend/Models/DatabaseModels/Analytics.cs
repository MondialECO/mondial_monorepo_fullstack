using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

public enum GrowthTaskStatus { Open, InProgress, Completed, Dismissed, Expired }

/// <summary>
/// Provider-owned, manually created growth work. Analytics observations are
/// computed at display time and never create tasks automatically.
/// </summary>
public class GrowthTask
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    public string ProviderId { get; set; } = "";
    public string TaskType { get; set; } = "General";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public GrowthTaskStatus Status { get; set; } = GrowthTaskStatus.Open;
    public string? TriggerRuleId { get; set; }
    public string? RelatedEntityType { get; set; }
    public string? RelatedEntityId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
}
