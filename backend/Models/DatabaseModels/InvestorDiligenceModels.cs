using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

public static class DiligenceReviewStatuses
{
    public const string NotReviewed = "not_reviewed";
    public const string Reviewed = "reviewed";
    public const string NeedsAttention = "needs_attention";
}

public static class DiligenceSessionStatuses
{
    public const string NotStarted = "not_started";
    public const string InProgress = "in_progress";
    public const string Completed = "completed";
}

public static class DiligenceQuestionStatuses
{
    public const string Open = "open";
    public const string Answered = "answered";
    public const string Closed = "closed";
}

[BsonIgnoreExtraElements]
public class InvestorDiligenceSession
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public string InvestorId { get; set; } = string.Empty;
    public string InvestorUserId { get; set; } = string.Empty;
    public string CompanyId { get; set; } = string.Empty;
    public string? MatchId { get; set; }
    public string? DealExecutionId { get; set; }

    public string Status { get; set; } = DiligenceSessionStatuses.NotStarted;

    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CompletedByUserId { get; set; }

    /// <summary>
    /// Category key to manual status override ("not_started", "in_review", "complete", "needs_attention")
    /// </summary>
    public Dictionary<string, string> ChecklistOverrides { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class InvestorDiligenceReview
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public string InvestorId { get; set; } = string.Empty;
    public string CompanyId { get; set; } = string.Empty;
    public string DocumentId { get; set; } = string.Empty;

    public string Status { get; set; } = DiligenceReviewStatuses.NotReviewed;

    public string? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class InvestorDiligenceNote
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public string InvestorId { get; set; } = string.Empty;
    public string CompanyId { get; set; } = string.Empty;
    public string? DocumentId { get; set; }
    public string? DealExecutionId { get; set; }

    public string Content { get; set; } = string.Empty;

    public string CreatedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class InvestorDiligenceQuestion
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public string CompanyId { get; set; } = string.Empty;
    public string InvestorId { get; set; } = string.Empty;
    public string? InvestorName { get; set; }

    public string? DocumentId { get; set; }
    public string? DocumentTitle { get; set; }
    public string? MatchId { get; set; }
    public string? DealExecutionId { get; set; }

    public string Question { get; set; } = string.Empty;
    public string AskedByUserId { get; set; } = string.Empty;
    public DateTime AskedAt { get; set; } = DateTime.UtcNow;

    public string? FounderResponse { get; set; }
    public string? RespondedByUserId { get; set; }
    public DateTime? RespondedAt { get; set; }

    public string Status { get; set; } = DiligenceQuestionStatuses.Open;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
