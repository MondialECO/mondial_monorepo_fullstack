using System;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class PlatformSettingsService : IPlatformSettingsService
    {
        private readonly MongoDbContext _context;
        private readonly IAuditLogger _auditLogger;
        private readonly ILogger<PlatformSettingsService> _logger;
        private static readonly HtmlEncoder _htmlEncoder = HtmlEncoder.Default;

        public PlatformSettingsService(
            MongoDbContext context,
            IAuditLogger auditLogger,
            ILogger<PlatformSettingsService> logger)
        {
            _context = context;
            _auditLogger = auditLogger;
            _logger = logger;
        }

        public async Task<PlatformSettings> GetSettingsAsync()
        {
            try
            {
                var settings = await _context.PlatformSettings.Find(_ => true).FirstOrDefaultAsync();
                if (settings != null) return settings;

                // Seed initial default settings if collection is empty
                var defaultSettings = new PlatformSettings
                {
                    RegistrationEnabled = true,
                    MarketplacePublishingEnabled = true,
                    PayoutRequestsEnabled = true,
                    ReportsEnabled = true,
                    MaintenanceBannerEnabled = false,
                    MaintenanceBannerTitle = string.Empty,
                    MaintenanceBannerMessage = string.Empty,
                    MaintenanceBannerSeverity = "info",
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedBy = "system",
                    Version = 1
                };

                await _context.PlatformSettings.InsertOneAsync(defaultSettings);
                return defaultSettings;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve platform settings from database; using safe fallback.");
                return new PlatformSettings(); // Safe defaults
            }
        }

        public async Task<AdminPlatformSettingsDto> GetAdminSettingsDtoAsync()
        {
            var s = await GetSettingsAsync();
            return MapToAdminDto(s);
        }

        public async Task<PublicPlatformSettingsDto> GetPublicSettingsDtoAsync()
        {
            var s = await GetSettingsAsync();
            return new PublicPlatformSettingsDto
            {
                RegistrationEnabled = s.RegistrationEnabled,
                MarketplacePublishingEnabled = s.MarketplacePublishingEnabled,
                PayoutRequestsEnabled = s.PayoutRequestsEnabled,
                ReportsEnabled = s.ReportsEnabled,
                MaintenanceBannerEnabled = s.MaintenanceBannerEnabled,
                MaintenanceBannerTitle = s.MaintenanceBannerTitle,
                MaintenanceBannerMessage = s.MaintenanceBannerMessage,
                MaintenanceBannerSeverity = s.MaintenanceBannerSeverity
            };
        }

        public async Task<(bool Success, string Message, AdminPlatformSettingsDto? UpdatedSettings)> UpdateSettingsAsync(
            UpdatePlatformSettingsRequest request, string updatedBy)
        {
            var current = await GetSettingsAsync();

            // Optimistic concurrency check
            if (request.ExpectedVersion != current.Version)
            {
                return (false, "Settings were modified by another administrator. Please refresh and try again.", MapToAdminDto(current));
            }

            // Sanitize banner title & message against HTML injection
            var safeTitle = string.IsNullOrWhiteSpace(request.MaintenanceBannerTitle)
                ? string.Empty
                : _htmlEncoder.Encode(request.MaintenanceBannerTitle.Trim());

            var safeMessage = string.IsNullOrWhiteSpace(request.MaintenanceBannerMessage)
                ? string.Empty
                : _htmlEncoder.Encode(request.MaintenanceBannerMessage.Trim());

            var safeSeverity = request.MaintenanceBannerSeverity?.ToLowerInvariant() switch
            {
                "warning" => "warning",
                "alert" => "alert",
                _ => "info"
            };

            var newVersion = current.Version + 1;
            var now = DateTime.UtcNow;

            var update = Builders<PlatformSettings>.Update
                .Set(x => x.RegistrationEnabled, request.RegistrationEnabled)
                .Set(x => x.MarketplacePublishingEnabled, request.MarketplacePublishingEnabled)
                .Set(x => x.PayoutRequestsEnabled, request.PayoutRequestsEnabled)
                .Set(x => x.ReportsEnabled, request.ReportsEnabled)
                .Set(x => x.MaintenanceBannerEnabled, request.MaintenanceBannerEnabled)
                .Set(x => x.MaintenanceBannerTitle, safeTitle)
                .Set(x => x.MaintenanceBannerMessage, safeMessage)
                .Set(x => x.MaintenanceBannerSeverity, safeSeverity)
                .Set(x => x.UpdatedAt, now)
                .Set(x => x.UpdatedBy, updatedBy)
                .Set(x => x.Version, newVersion);

            var filter = Builders<PlatformSettings>.Filter.Eq(x => x.Id, current.Id);
            var result = await _context.PlatformSettings.UpdateOneAsync(filter, update);

            if (result.MatchedCount == 0)
            {
                return (false, "Platform settings record not found.", null);
            }

            // Record audit log
            _auditLogger.Record(
                "admin_platform_settings_updated",
                updatedBy,
                true,
                new
                {
                    resourceType = "PlatformSettings",
                    resourceId = current.Id.ToString(),
                    RegistrationEnabled = request.RegistrationEnabled,
                    MarketplacePublishingEnabled = request.MarketplacePublishingEnabled,
                    PayoutRequestsEnabled = request.PayoutRequestsEnabled,
                    ReportsEnabled = request.ReportsEnabled,
                    MaintenanceBannerEnabled = request.MaintenanceBannerEnabled,
                    Version = newVersion
                }
            );

            var updatedDoc = await GetSettingsAsync();
            return (true, "Platform settings updated successfully.", MapToAdminDto(updatedDoc));
        }

        public async Task<bool> IsRegistrationEnabledAsync()
        {
            var s = await GetSettingsAsync();
            return s.RegistrationEnabled;
        }

        public async Task<bool> IsMarketplacePublishingEnabledAsync()
        {
            var s = await GetSettingsAsync();
            return s.MarketplacePublishingEnabled;
        }

        public async Task<bool> IsPayoutRequestsEnabledAsync()
        {
            var s = await GetSettingsAsync();
            return s.PayoutRequestsEnabled;
        }

        public async Task<bool> IsReportsEnabledAsync()
        {
            var s = await GetSettingsAsync();
            return s.ReportsEnabled;
        }

        private static AdminPlatformSettingsDto MapToAdminDto(PlatformSettings s)
        {
            return new AdminPlatformSettingsDto
            {
                RegistrationEnabled = s.RegistrationEnabled,
                MarketplacePublishingEnabled = s.MarketplacePublishingEnabled,
                PayoutRequestsEnabled = s.PayoutRequestsEnabled,
                ReportsEnabled = s.ReportsEnabled,
                MaintenanceBannerEnabled = s.MaintenanceBannerEnabled,
                MaintenanceBannerTitle = s.MaintenanceBannerTitle,
                MaintenanceBannerMessage = s.MaintenanceBannerMessage,
                MaintenanceBannerSeverity = s.MaintenanceBannerSeverity,
                UpdatedAt = s.UpdatedAt,
                UpdatedBy = s.UpdatedBy,
                Version = s.Version
            };
        }
    }
}
