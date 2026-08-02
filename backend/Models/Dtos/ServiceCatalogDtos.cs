using System.ComponentModel.DataAnnotations;
using WebApp.Models.DatabaseModels;

namespace WebApp.Models.Dtos;

// ============ MODULE 2 — SERVICE CATALOG DTOs (canon §6) ============
// Enums cross the wire as strings (parsed/emitted by name); the service validates
// them. Owner (ProviderId) is the authenticated principal, never a request field.
// No purchase/checkout/Proposal shapes here — that boundary is Module 3.

// ---------------- Embedded DTOs ----------------

public class ServiceAddOnDto
{
    [Required] public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public int DeliveryTimeAdjustmentDays { get; set; }
    public bool Enabled { get; set; } = true;
}

public class RequirementsFieldDto
{
    public string FieldId { get; set; } = "";
    [Required] public string Label { get; set; } = "";
    /// <summary>Text | File | Choice | Number | Date | Boolean.</summary>
    public string FieldType { get; set; } = "Text";
    public bool Required { get; set; }
}

// ---------------- Requests ----------------

public class UpsertServiceListingRequest
{
    public string ServiceType { get; set; } = "";
    [Required] public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    /// <summary>ServiceCategory name (see the enum).</summary>
    public string Category { get; set; } = "";
    public List<string> MetadataTags { get; set; } = new();
    public List<string> SearchTags { get; set; } = new();
    public List<string> IndustryFocus { get; set; } = new();
    public List<string> GeographicCoverage { get; set; } = new();
}

public class UpsertServicePackageRequest
{
    /// <summary>Basic | Standard | Premium | Custom.</summary>
    public string PackageType { get; set; } = "";
    public string PackageName { get; set; } = "";
    public string PackageTitle { get; set; } = "";
    public string PackageDescription { get; set; } = "";
    public decimal Price { get; set; }
    public string Currency { get; set; } = "EUR";
    /// <summary>Optional PricingModel name; refines pricing guidance.</summary>
    public string? PricingModel { get; set; }

    public int DeliveryTimeValue { get; set; }
    public string DeliveryTimeUnit { get; set; } = "Days";
    public string DeliveryDayType { get; set; } = "BusinessDays";
    public string DeliveryStartRule { get; set; } = "AfterEscrowFunding";
    public string DeliveryTimezone { get; set; } = "UTC";
    public string DailyCutoffTime { get; set; } = "17:00";

    public int IncludedRevisionCount { get; set; }
    public bool UnlimitedRevisions { get; set; }
    public int RevisionRequestWindowDays { get; set; }
    public bool AdditionalRevisionAvailable { get; set; }
    public decimal AdditionalRevisionPrice { get; set; }
    public int AdditionalRevisionDeliveryTime { get; set; }
    public string RevisionScopeDescription { get; set; } = "";

    public List<string> Deliverables { get; set; } = new();
    public List<string> IncludedFeatures { get; set; } = new();
    public List<string> ExcludedFeatures { get; set; } = new();
    public int? ScreensIncluded { get; set; }
    public List<ServiceAddOnDto> AddOns { get; set; } = new();
    public List<RequirementsFieldDto> RequirementsTemplate { get; set; } = new();

    /// <summary>CancellationPolicyType name (platform-predefined).</summary>
    public string CancellationPolicy { get; set; } = "FlexibleFullRefundBeforeStart";
    public bool InstantOrderEnabled { get; set; }
    public bool ManualApprovalRequired { get; set; }
    public int MaximumActiveOrders { get; set; }
}

public class UpsertServiceFaqRequest
{
    /// <summary>Optional — null means "all packages".</summary>
    public string? PackageId { get; set; }
    [Required] public string Question { get; set; } = "";
    [Required] public string Answer { get; set; } = "";
    /// <summary>FaqVisibility name.</summary>
    public string Visibility { get; set; } = "AllPackages";
    public int DisplayOrder { get; set; }
}

public class FaqOrderItem
{
    public string FaqId { get; set; } = "";
    public int DisplayOrder { get; set; }
}

public class ReorderFaqsRequest
{
    public List<FaqOrderItem> Items { get; set; } = new();
}

public class UpdateProviderCapacityRequest
{
    public int MaximumConcurrentOrders { get; set; }
    public bool NewOrderAvailability { get; set; } = true;
    public bool ManualApprovalWhenCapacityLow { get; set; }
}

/// <summary>Publish a package. Set <see cref="ConfirmShorterDelivery"/> to override the
/// "higher package has a shorter delivery time" confirmation gate (§6.2).</summary>
public class PublishPackageRequest
{
    public bool ConfirmShorterDelivery { get; set; }
}

// ---------------- Responses ----------------

public class PreviewVideoResponse
{
    public string StorageKey { get; set; } = "";
    public string PublicUrl { get; set; } = "";
    public string ContentType { get; set; } = "";
    public long Bytes { get; set; }
    public int DurationSeconds { get; set; }
    public string Sha256 { get; set; } = "";
    public DateTime UploadedAt { get; set; }
}

public class GalleryImageResponse
{
    public string Id { get; set; } = "";
    public string StorageKey { get; set; } = "";
    public string PublicUrl { get; set; } = "";
    public string ContentType { get; set; } = "";
    public int Width { get; set; }
    public int Height { get; set; }
    public long Bytes { get; set; }
    public string Sha256 { get; set; } = "";
    public int DisplayOrder { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class ServiceAddOnResponse
{
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public int DeliveryTimeAdjustmentDays { get; set; }
    public bool Enabled { get; set; }
}

public class RequirementsFieldResponse
{
    public string FieldId { get; set; } = "";
    public string Label { get; set; } = "";
    public string FieldType { get; set; } = "";
    public bool Required { get; set; }
}

public class ServiceListingResponse
{
    public string Id { get; set; } = "";
    public string ProviderId { get; set; } = "";
    public string ServiceType { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public List<string> MetadataTags { get; set; } = new();
    public List<string> SearchTags { get; set; } = new();
    public List<string> IndustryFocus { get; set; } = new();
    public List<string> GeographicCoverage { get; set; } = new();
    public long Impressions { get; set; }
    public long Clicks { get; set; }
    public PreviewVideoResponse? PreviewVideo { get; set; }
    public List<GalleryImageResponse> GalleryImages { get; set; } = new();
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ServicePackageResponse
{
    public string Id { get; set; } = "";
    public string ServiceId { get; set; } = "";
    public string PackageName { get; set; } = "";
    public string PackageType { get; set; } = "";
    public string PackageTitle { get; set; } = "";
    public string PackageDescription { get; set; } = "";
    public decimal Price { get; set; }
    public string Currency { get; set; } = "";
    public string? PricingModel { get; set; }

    public int DeliveryTimeValue { get; set; }
    public string DeliveryTimeUnit { get; set; } = "";
    public string DeliveryDayType { get; set; } = "";
    public string DeliveryStartRule { get; set; } = "";
    public string DeliveryTimezone { get; set; } = "";
    public string DailyCutoffTime { get; set; } = "";

    public int IncludedRevisionCount { get; set; }
    public bool UnlimitedRevisions { get; set; }
    public int RevisionRequestWindowDays { get; set; }
    public bool AdditionalRevisionAvailable { get; set; }
    public decimal AdditionalRevisionPrice { get; set; }
    public int AdditionalRevisionDeliveryTime { get; set; }
    public string RevisionScopeDescription { get; set; } = "";

    public List<string> Deliverables { get; set; } = new();
    public List<string> IncludedFeatures { get; set; } = new();
    public List<string> ExcludedFeatures { get; set; } = new();
    public int? ScreensIncluded { get; set; }
    public List<ServiceAddOnResponse> AddOns { get; set; } = new();
    public List<RequirementsFieldResponse> RequirementsTemplate { get; set; } = new();

    public string CancellationPolicy { get; set; } = "";
    public bool InstantOrderEnabled { get; set; }
    public bool ManualApprovalRequired { get; set; }
    public int MaximumActiveOrders { get; set; }

    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ServiceFaqResponse
{
    public string Id { get; set; } = "";
    public string ServiceId { get; set; } = "";
    public string? PackageId { get; set; }
    public string Question { get; set; } = "";
    public string Answer { get; set; } = "";
    public string Visibility { get; set; } = "";
    public int DisplayOrder { get; set; }
    public string Status { get; set; } = "";

    /// <summary>Set when the FAQ text conflicts with the referenced package's config
    /// (§6.5). Package terms are the source of truth; the system never auto-edits the FAQ.</summary>
    public string? ConflictWarning { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>Full detail for one listing: the listing + its packages + its FAQs.</summary>
public class ServiceListingDetailResponse
{
    public ServiceListingResponse Listing { get; set; } = new();
    public List<ServicePackageResponse> Packages { get; set; } = new();
    public List<ServiceFaqResponse> Faqs { get; set; } = new();
}

public class PricingGuidanceResponse
{
    public string Category { get; set; } = "";
    public string? PricingModel { get; set; }
    public decimal Min { get; set; }
    public decimal Max { get; set; }
    public string Currency { get; set; } = "";
}

public class ProviderCapacityResponse
{
    public int MaximumConcurrentOrders { get; set; }
    public int CurrentActiveOrders { get; set; }
    public bool NewOrderAvailability { get; set; }
    public bool ManualApprovalWhenCapacityLow { get; set; }
    /// <summary>Available | Limited | FullyBooked | Unavailable.</summary>
    public string CapacityStatus { get; set; } = "";
    /// <summary>Deterministic gate: instant order is offered only when true.</summary>
    public bool InstantOrderAvailable { get; set; }
}

/// <summary>Result of a publish attempt: the published package plus any non-blocking
/// cross-package warnings (§6.2). Hard-block conditions return a Conflict result instead.</summary>
public class PublishPackageResponse
{
    public ServicePackageResponse Package { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

// ---------------- Mapping (pure, entity → response) ----------------

public static class ServiceCatalogMapping
{
    public static ServiceListingResponse ToResponse(this ServiceListing l) => new()
    {
        Id = l.Id,
        ProviderId = l.ProviderId,
        ServiceType = l.ServiceType,
        Title = l.Title,
        Description = l.Description,
        Category = l.Category.ToString(),
        // Defensive: old documents may not have these fields (null from MongoDB). Default to empty lists.
        MetadataTags = new List<string>(l.MetadataTags ?? []),
        SearchTags = new List<string>(l.SearchTags ?? []),
        IndustryFocus = new List<string>(l.IndustryFocus ?? []),
        GeographicCoverage = new List<string>(l.GeographicCoverage ?? []),
        Impressions = l.Impressions,
        Clicks = l.Clicks,
        PreviewVideo = l.PreviewVideo == null ? null : new PreviewVideoResponse
        {
            StorageKey = l.PreviewVideo.StorageKey,
            PublicUrl = l.PreviewVideo.PublicUrl,
            ContentType = l.PreviewVideo.ContentType,
            Bytes = l.PreviewVideo.Bytes,
            DurationSeconds = l.PreviewVideo.DurationSeconds,
            Sha256 = l.PreviewVideo.Sha256,
            UploadedAt = l.PreviewVideo.UploadedAt,
        },
        GalleryImages = (l.GalleryImages ?? []).Select(img => new GalleryImageResponse
        {
            Id = img.Id,
            StorageKey = img.StorageKey,
            PublicUrl = img.PublicUrl,
            ContentType = img.ContentType,
            Width = img.Width,
            Height = img.Height,
            Bytes = img.Bytes,
            Sha256 = img.Sha256,
            DisplayOrder = img.DisplayOrder,
            UploadedAt = img.UploadedAt,
        }).ToList(),
        Status = l.Status.ToString(),
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt,
    };

    public static ServicePackageResponse ToResponse(this ServicePackage p) => new()
    {
        Id = p.Id,
        ServiceId = p.ServiceId,
        PackageName = p.PackageName,
        PackageType = p.PackageType.ToString(),
        PackageTitle = p.PackageTitle,
        PackageDescription = p.PackageDescription,
        Price = p.Price,
        Currency = p.Currency,
        PricingModel = p.PricingModel?.ToString(),
        DeliveryTimeValue = p.DeliveryTimeValue,
        DeliveryTimeUnit = p.DeliveryTimeUnit.ToString(),
        DeliveryDayType = p.DeliveryDayType.ToString(),
        DeliveryStartRule = p.DeliveryStartRule.ToString(),
        DeliveryTimezone = p.DeliveryTimezone,
        DailyCutoffTime = p.DailyCutoffTime,
        IncludedRevisionCount = p.IncludedRevisionCount,
        UnlimitedRevisions = p.UnlimitedRevisions,
        RevisionRequestWindowDays = p.RevisionRequestWindowDays,
        AdditionalRevisionAvailable = p.AdditionalRevisionAvailable,
        AdditionalRevisionPrice = p.AdditionalRevisionPrice,
        AdditionalRevisionDeliveryTime = p.AdditionalRevisionDeliveryTime,
        RevisionScopeDescription = p.RevisionScopeDescription,
        // Defensive: old documents may not have these list fields (null from MongoDB). Default to empty lists.
        Deliverables = new List<string>(p.Deliverables ?? []),
        IncludedFeatures = new List<string>(p.IncludedFeatures ?? []),
        ExcludedFeatures = new List<string>(p.ExcludedFeatures ?? []),
        ScreensIncluded = p.ScreensIncluded ?? null,
        AddOns = (p.AddOns ?? []).Select(a => new ServiceAddOnResponse
        {
            Name = a.Name, Price = a.Price, DeliveryTimeAdjustmentDays = a.DeliveryTimeAdjustmentDays, Enabled = a.Enabled,
        }).ToList(),
        RequirementsTemplate = (p.RequirementsTemplate ?? []).Select(r => new RequirementsFieldResponse
        {
            FieldId = r.FieldId, Label = r.Label, FieldType = r.FieldType.ToString(), Required = r.Required,
        }).ToList(),
        CancellationPolicy = p.CancellationPolicy.ToString(),
        InstantOrderEnabled = p.InstantOrderEnabled,
        ManualApprovalRequired = p.ManualApprovalRequired,
        MaximumActiveOrders = p.MaximumActiveOrders,
        Status = p.Status.ToString(),
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
    };

    public static ServiceFaqResponse ToResponse(this ServiceFAQ f, string? conflictWarning = null) => new()
    {
        Id = f.Id,
        ServiceId = f.ServiceId,
        PackageId = f.PackageId,
        Question = f.Question,
        Answer = f.Answer,
        Visibility = f.Visibility.ToString(),
        DisplayOrder = f.DisplayOrder,
        Status = f.Status.ToString(),
        ConflictWarning = conflictWarning,
        CreatedAt = f.CreatedAt,
        UpdatedAt = f.UpdatedAt,
    };

    public static GalleryImageResponse ToResponse(this GalleryImage g) => new()
    {
        Id = g.Id,
        StorageKey = g.StorageKey,
        PublicUrl = g.PublicUrl,
        ContentType = g.ContentType,
        Width = g.Width,
        Height = g.Height,
        Bytes = g.Bytes,
        Sha256 = g.Sha256,
        DisplayOrder = g.DisplayOrder,
    };

    public static PreviewVideoResponse ToResponse(this PreviewVideo p) => new()
    {
        StorageKey = p.StorageKey,
        PublicUrl = p.PublicUrl,
        ContentType = p.ContentType,
        Bytes = p.Bytes,
        DurationSeconds = p.DurationSeconds,
        Sha256 = p.Sha256,
        UploadedAt = p.UploadedAt,
    };
}
