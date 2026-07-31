using WebApp.Models.Dtos;

namespace WebApp.Services.Interface
{
    public interface IMarketplaceService
    {
        Task<ServiceProviderResult<MarketplaceListingsResponse>> GetPublishedListingsAsync(
            MarketplaceListingsQuery query,
            CancellationToken ct);

        Task<ServiceProviderResult<MarketplaceListingDetailResponse>> GetListingDetailAsync(
            string listingId,
            CancellationToken ct);
    }
}
