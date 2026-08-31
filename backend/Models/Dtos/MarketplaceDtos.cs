namespace WebApp.Models.Dtos
{
    // Grid card response
    public class MarketplaceListingCard
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public MarketplaceProviderMini Provider { get; set; } = new();
        public decimal StartingPrice { get; set; }
        public string Currency { get; set; } = "EUR";
        public int DeliveryTimeValue { get; set; }
        public string DeliveryTimeUnit { get; set; } = string.Empty;
        public decimal? Rating { get; set; }
        public int? ReviewCount { get; set; }
    }

    public class MarketplaceProviderMini
    {
        public string ProviderId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public bool Verified { get; set; }
        public string? PublicSlug { get; set; }
    }

    // Grid list response (paginated)
    public class MarketplaceListingsResponse
    {
        public List<MarketplaceListingCard> Items { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    // Public detail response
    public class MarketplaceListingDetailResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string ServiceType { get; set; } = string.Empty;
        public List<string> IndustryFocus { get; set; } = new();
        public List<string> GeographicCoverage { get; set; } = new();
        public string DescriptionHtml { get; set; } = string.Empty;
        public MarketplaceProviderHeader Provider { get; set; } = new();
        public List<MarketplacePackage> Packages { get; set; } = new();
        public List<MarketplaceGalleryImage> Gallery { get; set; } = new();
        public MarketplacePreviewVideo? PreviewVideo { get; set; }
        public List<MarketplaceFaq> Faqs { get; set; } = new();
        public List<string> MetadataTags { get; set; } = new();
        public List<string> SearchTags { get; set; } = new();
    }

    public class MarketplaceProviderHeader
    {
        public string ProviderId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Headline { get; set; }
        public string? ProfileImageUrl { get; set; }
        public bool Verified { get; set; }
        public decimal? TrustScore { get; set; }
        public int? CompletedOrders { get; set; }
        public string? MedianResponseTime { get; set; }
        public string? PublicSlug { get; set; }
    }

    public class MarketplacePackage
    {
        public string Id { get; set; } = string.Empty;
        public string Tier { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Currency { get; set; } = "EUR";
        public int DeliveryTimeValue { get; set; }
        public string DeliveryTimeUnit { get; set; } = string.Empty;
        public int IncludedRevisionCount { get; set; }
        public bool UnlimitedRevisions { get; set; }
        public int? ScreensIncluded { get; set; }
        public List<string> IncludedFeatures { get; set; } = new();
        public List<string> ExcludedFeatures { get; set; } = new();
        public List<MarketplaceAddOn> AddOns { get; set; } = new();
        public MarketplaceAdditionalRevision? AdditionalRevision { get; set; }
        public List<RequirementsFieldResponse> RequirementsTemplate { get; set; } = new();
    }

    public class MarketplaceAddOn
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int? DeliveryTimeAdjustmentDays { get; set; }
    }

    public class MarketplaceAdditionalRevision
    {
        public decimal Price { get; set; }
        public int DeliveryTimeDays { get; set; }
    }

    public class MarketplaceGalleryImage
    {
        public string Id { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
    }

    public class MarketplacePreviewVideo
    {
        public string Url { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
    }

    public class MarketplaceFaq
    {
        public string Id { get; set; } = string.Empty;
        public string Question { get; set; } = string.Empty;
        public string AnswerHtml { get; set; } = string.Empty;
        public string? PackageId { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class MarketplaceListingsQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 12;
        public string? Search { get; set; }
        public string? Category { get; set; }
        public string? SubCategory { get; set; }
        public decimal? PriceMin { get; set; }
        public decimal? PriceMax { get; set; }
        public int? DeliveryTimeMaxDays { get; set; }
        public string? Sort { get; set; }
    }
}
