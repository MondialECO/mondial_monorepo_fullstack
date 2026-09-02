using System;
using System.Collections.Generic;
using WebApp.Models.DatabaseModels;

namespace WebApp.Models.Dtos
{
    public class AdminMarketplaceSummaryDto
    {
        public int TotalServices { get; set; }
        public int PublishedServices { get; set; }
        public int HiddenServices { get; set; }
        public int DraftServices { get; set; }

        public int TotalCreatorOffers { get; set; }
        public int PublishedCreatorOffers { get; set; }
        public int HiddenCreatorOffers { get; set; }
        public int BuyoutOffersCount { get; set; }
        public int EquityOffersCount { get; set; }

        public int TotalReviews { get; set; }
        public int PublicReviews { get; set; }
        public int HiddenReviews { get; set; }
        public decimal AverageRating { get; set; }

        public int OpenReportsCount { get; set; }
        public bool ReportsSystemActive { get; set; } = false;
    }

    public class AdminServiceModerationListItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string ProviderId { get; set; } = string.Empty;
        public string ProviderName { get; set; } = string.Empty;
        public string ProviderEmail { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string ServiceType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsModerationHidden { get; set; }
        public string? ModerationReason { get; set; }
        public string? ModeratedBy { get; set; }
        public DateTime? ModeratedAt { get; set; }
        public int PackagesCount { get; set; }
        public decimal StartingPrice { get; set; }
        public string Currency { get; set; } = "EUR";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class AdminServiceDetailDto : AdminServiceModerationListItemDto
    {
        public List<ServicePackage> Packages { get; set; } = new();
        public List<ServiceFAQ> Faqs { get; set; } = new();
        public List<GalleryImage> GalleryImages { get; set; } = new();
        public PreviewVideo? PreviewVideo { get; set; }
        public int ReviewsCount { get; set; }
        public decimal AverageRating { get; set; }
    }

    public class AdminCreatorOfferListItemDto
    {
        public string IdeaId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string CreatorEmail { get; set; } = string.Empty;
        public string Sector { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // draft, live, available, paused
        public string SaleType { get; set; } = string.Empty; // full_buyout, equity_partnership
        public List<string> DealModes { get; set; } = new();
        public decimal? AskingPrice { get; set; }
        public string Audience { get; set; } = "public";
        public bool NdaRequired { get; set; }
        public bool IsModerationHidden { get; set; }
        public string? ModerationReason { get; set; }
        public string? ModeratedBy { get; set; }
        public DateTime? ModeratedAt { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class AdminCreatorOfferDetailDto : AdminCreatorOfferListItemDto
    {
        public double ValuationEstimate { get; set; }
        public string Stage { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
    }

    public class AdminReviewListItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string EngagementId { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string ClientEmail { get; set; } = string.Empty;
        public string ProviderId { get; set; } = string.Empty;
        public string ProviderName { get; set; } = string.Empty;
        public string ProviderEmail { get; set; } = string.Empty;
        public int OverallRating { get; set; }
        public int QualityRating { get; set; }
        public int CommunicationRating { get; set; }
        public int DeliveryRating { get; set; }
        public string WrittenReview { get; set; } = string.Empty;
        public string? ProviderResponse { get; set; }
        public string Visibility { get; set; } = "Public";
        public string VerificationStatus { get; set; } = "Verified";
        public bool IsModerationHidden { get; set; }
        public string? ModerationReason { get; set; }
        public string? ModeratedBy { get; set; }
        public DateTime? ModeratedAt { get; set; }
        public DateTime SubmittedAt { get; set; }
    }

    public class AdminModerationActionRequest
    {
        public string Action { get; set; } = string.Empty; // "hide" | "restore"
        public string? Reason { get; set; }
    }
}
