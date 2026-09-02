using System;
using System.ComponentModel.DataAnnotations;

namespace WebApp.Models.Dtos
{
    public class AdminPlatformSettingsDto
    {
        public bool RegistrationEnabled { get; set; } = true;
        public bool MarketplacePublishingEnabled { get; set; } = true;
        public bool PayoutRequestsEnabled { get; set; } = true;
        public bool ReportsEnabled { get; set; } = true;
        public bool MaintenanceBannerEnabled { get; set; } = false;
        public string MaintenanceBannerTitle { get; set; } = string.Empty;
        public string MaintenanceBannerMessage { get; set; } = string.Empty;
        public string MaintenanceBannerSeverity { get; set; } = "info";
        public DateTime UpdatedAt { get; set; }
        public string UpdatedBy { get; set; } = string.Empty;
        public int Version { get; set; } = 1;
    }

    public class UpdatePlatformSettingsRequest
    {
        public bool RegistrationEnabled { get; set; } = true;
        public bool MarketplacePublishingEnabled { get; set; } = true;
        public bool PayoutRequestsEnabled { get; set; } = true;
        public bool ReportsEnabled { get; set; } = true;
        public bool MaintenanceBannerEnabled { get; set; } = false;

        [MaxLength(200, ErrorMessage = "Banner title cannot exceed 200 characters.")]
        public string MaintenanceBannerTitle { get; set; } = string.Empty;

        [MaxLength(1000, ErrorMessage = "Banner message cannot exceed 1000 characters.")]
        public string MaintenanceBannerMessage { get; set; } = string.Empty;

        [RegularExpression("^(info|warning|alert)$", ErrorMessage = "Severity must be 'info', 'warning', or 'alert'.")]
        public string MaintenanceBannerSeverity { get; set; } = "info";

        public int ExpectedVersion { get; set; } = 1;
    }

    public class PublicPlatformSettingsDto
    {
        public bool RegistrationEnabled { get; set; } = true;
        public bool MarketplacePublishingEnabled { get; set; } = true;
        public bool PayoutRequestsEnabled { get; set; } = true;
        public bool ReportsEnabled { get; set; } = true;
        public bool MaintenanceBannerEnabled { get; set; } = false;
        public string MaintenanceBannerTitle { get; set; } = string.Empty;
        public string MaintenanceBannerMessage { get; set; } = string.Empty;
        public string MaintenanceBannerSeverity { get; set; } = "info";
    }
}
