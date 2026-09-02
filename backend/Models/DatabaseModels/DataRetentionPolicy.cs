using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    public class DataRetentionPolicy
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string DataCategory { get; set; } = string.Empty;
        public int? RetentionDays { get; set; } // null means indefinite / legal hold
        public string ActionAfterRetention { get; set; } = "ReviewOnly"; // ReviewOnly, Anonymize, Delete, Archive
        public string StorageAuthority { get; set; } = "MongoDB";
        public string DataSensitivity { get; set; } = "Internal"; // Public, Internal, Confidential, RestrictedPII, FinancialRegulatory
        public string AccessAuthority { get; set; } = "Admin"; // Admin, SuperAdmin, System
        public bool Enabled { get; set; } = true;
        public string? UpdatedBy { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public int Version { get; set; } = 1;
    }
}
