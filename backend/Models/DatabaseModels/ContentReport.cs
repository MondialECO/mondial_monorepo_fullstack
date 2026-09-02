using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    public enum ReportTargetType
    {
        ServiceListing,
        CreatorOffer,
        Review,
        UserProfile
    }

    public enum ReportCategory
    {
        Spam,
        MisleadingContent,
        HarassmentOrAbuse,
        InappropriateContent,
        FraudOrScamConcern,
        Impersonation,
        Other
    }

    public enum ReportStatus
    {
        Open,
        UnderReview,
        Resolved,
        Dismissed
    }

    public class ContentReport
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string ReporterUserId { get; set; } = string.Empty;
        public string ReporterEmail { get; set; } = string.Empty;
        public string ReporterName { get; set; } = string.Empty;

        [BsonRepresentation(BsonType.String)]
        public ReportTargetType TargetType { get; set; }

        public string TargetId { get; set; } = string.Empty;

        [BsonRepresentation(BsonType.String)]
        public ReportCategory Category { get; set; }

        public string Description { get; set; } = string.Empty;

        [BsonRepresentation(BsonType.String)]
        public ReportStatus Status { get; set; } = ReportStatus.Open;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public string? ReviewedByAdminId { get; set; }
        public DateTime? ReviewedAt { get; set; }

        public string? Resolution { get; set; }
        public string? AdminNotes { get; set; }
    }
}
