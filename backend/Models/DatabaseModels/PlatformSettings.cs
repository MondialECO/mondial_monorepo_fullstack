using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    public class PlatformSettings
    {
        [BsonId]
        public ObjectId Id { get; set; }

        [BsonElement("RegistrationEnabled")]
        public bool RegistrationEnabled { get; set; } = true;

        [BsonElement("MarketplacePublishingEnabled")]
        public bool MarketplacePublishingEnabled { get; set; } = true;

        [BsonElement("PayoutRequestsEnabled")]
        public bool PayoutRequestsEnabled { get; set; } = true;

        [BsonElement("ReportsEnabled")]
        public bool ReportsEnabled { get; set; } = true;

        [BsonElement("MaintenanceBannerEnabled")]
        public bool MaintenanceBannerEnabled { get; set; } = false;

        [BsonElement("MaintenanceBannerTitle")]
        public string MaintenanceBannerTitle { get; set; } = string.Empty;

        [BsonElement("MaintenanceBannerMessage")]
        public string MaintenanceBannerMessage { get; set; } = string.Empty;

        [BsonElement("MaintenanceBannerSeverity")]
        public string MaintenanceBannerSeverity { get; set; } = "info"; // "info", "warning", "alert"

        [BsonElement("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedBy")]
        public string UpdatedBy { get; set; } = "system";

        [BsonElement("Version")]
        public int Version { get; set; } = 1;
    }
}
