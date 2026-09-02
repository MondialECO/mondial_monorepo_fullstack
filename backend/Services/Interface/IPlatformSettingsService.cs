using System.Threading.Tasks;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Interface
{
    public interface IPlatformSettingsService
    {
        Task<PlatformSettings> GetSettingsAsync();
        Task<AdminPlatformSettingsDto> GetAdminSettingsDtoAsync();
        Task<PublicPlatformSettingsDto> GetPublicSettingsDtoAsync();
        Task<(bool Success, string Message, AdminPlatformSettingsDto? UpdatedSettings)> UpdateSettingsAsync(UpdatePlatformSettingsRequest request, string updatedBy);
        Task<bool> IsRegistrationEnabledAsync();
        Task<bool> IsMarketplacePublishingEnabledAsync();
        Task<bool> IsPayoutRequestsEnabledAsync();
        Task<bool> IsReportsEnabledAsync();
    }
}
