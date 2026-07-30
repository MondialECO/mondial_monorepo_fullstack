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
        MetadataTags = new List<string>(l.MetadataTags),
        SearchTags = new List<string>(l.SearchTags),
        IndustryFocus = new List<string>(l.IndustryFocus),
        GeographicCoverage = new List<string>(l.GeographicCoverage),
        Impressions = l.Impressions,
        Clicks = l.Clicks,
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
        Deliverables = new List<string>(p.Deliverables),
        IncludedFeatures = new List<string>(p.IncludedFeatures),
        ExcludedFeatures = new List<string>(p.ExcludedFeatures),
        AddOns = p.AddOns.Select(a => new ServiceAddOnResponse
        {
            Name = a.Name, Price = a.Price, DeliveryTimeAdjustmentDays = a.DeliveryTimeAdjustmentDays, Enabled = a.Enabled,
        }).ToList(),
        RequirementsTemplate = p.RequirementsTemplate.Select(r => new RequirementsFieldResponse
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
}
