using WebApp.Models.Dtos;

namespace WebApp.Services.Interface;

/// <summary>
/// Module 2 — Service Catalog (canon §6). Owner-scoped over three top-level collections
/// (ServiceListings / ServicePackages / ServiceFAQs) plus provider-capacity fields on the
/// embedded ServiceProviderProfile. Publishes packages; never creates a Proposal or runs
/// checkout — that boundary is Module 3. Reuses the typed <see cref="ServiceProviderResult{T}"/>
/// envelope so the controller stays a thin status mapper.
/// </summary>
public interface IServiceCatalogService
{
    // ---- Listings ----
    Task<ServiceProviderResult<List<ServiceListingResponse>>> GetListingsAsync(string userId);
    Task<ServiceProviderResult<ServiceListingDetailResponse>> GetListingAsync(string userId, string listingId);
    Task<ServiceProviderResult<ServiceListingResponse>> CreateListingAsync(string userId, UpsertServiceListingRequest request);
    Task<ServiceProviderResult<ServiceListingResponse>> UpdateListingAsync(string userId, string listingId, UpsertServiceListingRequest request);
    Task<ServiceProviderResult<ServiceListingResponse>> PublishListingAsync(string userId, string listingId);
    Task<ServiceProviderResult<ServiceListingResponse>> UnpublishListingAsync(string userId, string listingId);

    // ---- Packages (at most one public Basic/Standard/Premium per service; Custom excluded from the public table) ----
    Task<ServiceProviderResult<ServicePackageResponse>> AddPackageAsync(string userId, string listingId, UpsertServicePackageRequest request);
    Task<ServiceProviderResult<ServicePackageResponse>> UpdatePackageAsync(string userId, string packageId, UpsertServicePackageRequest request);
    Task<ServiceProviderResult<PublishPackageResponse>> PublishPackageAsync(string userId, string packageId, PublishPackageRequest request);
    Task<ServiceProviderResult<ServicePackageResponse>> UnpublishPackageAsync(string userId, string packageId);


    // ---- FAQs ----
    Task<ServiceProviderResult<ServiceFaqResponse>> AddFaqAsync(string userId, string listingId, UpsertServiceFaqRequest request);
    Task<ServiceProviderResult<ServiceFaqResponse>> UpdateFaqAsync(string userId, string faqId, UpsertServiceFaqRequest request);
    Task<ServiceProviderResult<ServiceFaqResponse>> DuplicateFaqAsync(string userId, string faqId);
    Task<ServiceProviderResult<ServiceFaqResponse>> PublishFaqAsync(string userId, string faqId);
    Task<ServiceProviderResult<ServiceFaqResponse>> UnpublishFaqAsync(string userId, string faqId);
    Task<ServiceProviderResult<bool>> DeleteFaqAsync(string userId, string faqId);
    Task<ServiceProviderResult<List<ServiceFaqResponse>>> ReorderFaqsAsync(string userId, string listingId, ReorderFaqsRequest request);

    // ---- Provider capacity (fields on ServiceProviderProfile, §6.7) ----
    Task<ServiceProviderResult<ProviderCapacityResponse>> GetCapacityAsync(string userId);
    Task<ServiceProviderResult<ProviderCapacityResponse>> UpdateCapacityAsync(string userId, UpdateProviderCapacityRequest request);

    // ---- Pricing guidance (deterministic, no AI — §6.1). Pure; no DB/owner state. ----
    ServiceProviderResult<PricingGuidanceResponse> GetPricingGuidance(string category, string? pricingModel);

    // ---- Analytics counters (§9 aggregates later). Increment sites are Module 3
    // (a client browsing a listing); exposed here so Module 3 calls in server-side. ----
    Task<ServiceProviderResult<bool>> RecordImpressionAsync(string listingId);
    Task<ServiceProviderResult<bool>> RecordClickAsync(string listingId);
}
