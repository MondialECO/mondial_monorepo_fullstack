using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

// ============ MODULE 2 — SERVICE CATALOG (canon §6, commit c8ec63a) ============
// Three new top-level collections (singular class → plural collection, §4.2):
//   ServiceListing → "ServiceListings", ServicePackage → "ServicePackages",
//   ServiceFAQ → "ServiceFAQs".
// A ServiceListing owns its packages via ServiceId (the listing's Id). Add-ons and
// the requirements template are bounded, so they are EMBEDDED on ServicePackage
// (not their own collections). ServiceCategory / PricingModel are reused from
// ApplicationUser.cs; the enums below are new to this module.
//
// Module 2 publishes packages; it never creates a Proposal or runs checkout — that
// boundary belongs to Module 3 (Leads). Reserved `Custom` packages are not shown in
// the public package table (future custom-offer use in Module 3).

// ---------------- Enums (new to Module 2) ----------------

public enum CatalogStatus
{
    Draft,
    Published,
    Unpublished,
    Archived,
}

public enum PackageType
{
    Basic,
    Standard,
    Premium,
    Custom, // reserved for Module-3 custom offers; excluded from the public package table
}

// Shared across Service Catalog, Leads and Workroom (canon §4.2 — reuse, never fork).
// The converter is a JSON-layer concern only: ContractTerms reaches the client raw on
// ContractResponse.Terms, so without it these arrive as ordinals against frontend types
// expecting names. It does NOT touch value ORDER, which is what the §4.2 ordinal-stability
// rule protects — BSON still persists the ordinal, so append-only still applies.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DeliveryTimeUnit
{
    Hours,
    Days,
    Weeks,
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DeliveryDayType
{
    BusinessDays,
    CalendarDays,
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DeliveryStartRule
{
    AfterOrderConfirmation,
    AfterEscrowFunding,
    AfterClientRequirementsComplete,
    AfterProviderStarts,
}

public enum FaqVisibility
{
    AllPackages,
    BasicOnly,
    StandardOnly,
    PremiumOnly,
    SelectedPackages,
    PrivateDraft,
}

public enum RequirementsFieldType
{
    Text,
    File,
    Choice,
    Number,
    Date,
    Boolean,
}

// Platform-predefined cancellation options (no custom rule builder in Module 2).
// The SP picks one per package; it fills the purchase snapshot's "Cancellation
// Terms" later (Module 3/4). The behavioural rule engine is deferred to Module 4.
public enum CancellationPolicyType
{
    FlexibleFullRefundBeforeStart,
    PartialRefundAfterDeliveryStart,
    NoRefundAfterDeliveryStart,
}

// ---------------- Embedded structures (bounded — no own collection) ----------------

// A non-revision extra (e.g. "Additional Five Screens", "Priority Delivery").
// Extra-revision purchases are NEVER modeled here — they use the dedicated
// AdditionalRevision* fields on ServicePackage.
public class ServiceAddOn
{
    public string Name { get; set; } = "";

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Price { get; set; }

    // Delivery-time delta in the package's delivery-day type (may be negative,
    // e.g. Priority Delivery = −2). Folded into the due-date formula (§6.3).
    public int DeliveryTimeAdjustmentDays { get; set; }

    public bool Enabled { get; set; } = true;
}

// One field the SP wants a client to supply. SCHEMA ONLY — the client's answers are
// a separate Module-3 structure; Module 2 never collects submissions (§6.6).
public class RequirementsField
{
    public string FieldId { get; set; } = "";
    public string Label { get; set; } = "";
    public RequirementsFieldType FieldType { get; set; } = RequirementsFieldType.Text;
    public bool Required { get; set; }
}

// Service-level gallery image. Server-determined file reference (SaveFile.cs);
// client never provides or modifies the path. Stable UUID ID for concurrent-edit safety.
public class GalleryImage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string StorageKey { get; set; } = "";
    public string PublicUrl { get; set; } = "";
    public string ContentType { get; set; } = "";
    public int Width { get; set; }
    public int Height { get; set; }
    public long Bytes { get; set; }
    public string Sha256 { get; set; } = "";
    public int DisplayOrder { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

// Service-level preview video. Server-determined file reference (SaveFile.cs);
// client never provides or modifies the path. Optional single record (not an array).
public class PreviewVideo
{
    public string StorageKey { get; set; } = "";
    public string PublicUrl { get; set; } = "";
    public string ContentType { get; set; } = "";
    public long Bytes { get; set; }
    public int DurationSeconds { get; set; }
    public string Sha256 { get; set; } = "";
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

// ---------------- Collections ----------------

// The service-level record. Owns its packages via its Id (referenced as ServiceId).
public class ServiceListing
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    // Owner (authenticated principal). Owner-scoped everywhere.
    public string ProviderId { get; set; } = "";

    public string ServiceType { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public ServiceCategory Category { get; set; }

    // Metadata tags (internal/technical descriptors, capped at 5).
    // Captured now for future use; not currently consumed by search/matching.
    // [BsonIgnoreIfNull]: handles legacy docs with BSON null values.
    [BsonIgnoreIfNull]
    public List<string> MetadataTags { get; set; } = new();

    // Search tags (customer-facing search phrases, capped at 5).
    // Captured now for future use; not currently consumed by search/matching.
    // [BsonIgnoreIfNull]: handles legacy docs with BSON null values.
    [BsonIgnoreIfNull]
    public List<string> SearchTags { get; set; } = new();

    // [BsonIgnoreIfNull]: handles legacy docs with BSON null values.
    [BsonIgnoreIfNull]
    public List<string> IndustryFocus { get; set; } = new();

    // [BsonIgnoreIfNull]: handles legacy docs with BSON null values.
    [BsonIgnoreIfNull]
    public List<string> GeographicCoverage { get; set; } = new();

    // Analytics counters seeded at 0 now so §9 has real history from day one.
    // Incremented via ServiceCatalogService.RecordImpression/RecordClick; the call
    // sites (a client browsing a listing) are Module 3, so nothing fires them here.
    public long Impressions { get; set; }
    public long Clicks { get; set; }

    // Service-level media (Step 5 in wizard). PreviewVideo is optional single record;
    // GalleryImages is a bounded array capped at 20 items (§1A.13 Portfolio precedent,
    // BSON protection). File references are server-determined; client never provides paths.
    // [BsonIgnoreIfNull]: omit field on write when null; on read, return null if absent
    // or if the stored field is BSON null (handles corrupted legacy docs).
    [BsonIgnoreIfNull]
    public PreviewVideo? PreviewVideo { get; set; }

    // [BsonIgnoreIfNull]: handles legacy docs with BSON null array values.
    [BsonIgnoreIfNull]
    public List<GalleryImage> GalleryImages { get; set; } = new();

    public CatalogStatus Status { get; set; } = CatalogStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// One package under a service. At most one public Basic/Standard/Premium per service
// (0–3); Custom is excluded from the public table.
public class ServicePackage
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string ServiceId { get; set; } = ""; // → ServiceListing.Id

    public string PackageName { get; set; } = "";
    public PackageType PackageType { get; set; }
    public string PackageTitle { get; set; } = "";
    public string PackageDescription { get; set; } = "";

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Price { get; set; }
    public string Currency { get; set; } = "EUR";

    // Optional — reused enum. When set, refines the deterministic pricing guidance
    // (§6.1). Nullable: the SP need not set one.
    public PricingModel? PricingModel { get; set; }

    // ---- Delivery-time configuration (§6.3) ----
    public int DeliveryTimeValue { get; set; }
    public DeliveryTimeUnit DeliveryTimeUnit { get; set; } = DeliveryTimeUnit.Days;
    public DeliveryDayType DeliveryDayType { get; set; } = DeliveryDayType.BusinessDays;
    public DeliveryStartRule DeliveryStartRule { get; set; } = DeliveryStartRule.AfterEscrowFunding;
    public string DeliveryTimezone { get; set; } = "UTC";
    public string DailyCutoffTime { get; set; } = "17:00"; // HH:mm, provider timezone

    // ---- Per-package revision system (§6.4) ----
    public int IncludedRevisionCount { get; set; }
    public bool UnlimitedRevisions { get; set; }
    public int RevisionRequestWindowDays { get; set; }
    public bool AdditionalRevisionAvailable { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal AdditionalRevisionPrice { get; set; }
    public int AdditionalRevisionDeliveryTime { get; set; }
    public string RevisionScopeDescription { get; set; } = "";

    // [BsonIgnoreIfNull]: handles legacy docs with BSON null array values.
    [BsonIgnoreIfNull]
    public List<string> Deliverables { get; set; } = new();

    // [BsonIgnoreIfNull]: handles legacy docs with BSON null array values.
    [BsonIgnoreIfNull]
    public List<string> IncludedFeatures { get; set; } = new();

    // [BsonIgnoreIfNull]: handles legacy docs with BSON null array values.
    [BsonIgnoreIfNull]
    public List<string> ExcludedFeatures { get; set; } = new();

    // Optional: number of screens/mockups/deliverables included in the package.
    // Nullable: not applicable to all service types (e.g., consulting, legal).
    public int? ScreensIncluded { get; set; }

    // Embedded (bounded), §6 storage.
    // [BsonIgnoreIfNull]: handles legacy docs with BSON null array values.
    [BsonIgnoreIfNull]
    public List<ServiceAddOn> AddOns { get; set; } = new();

    // [BsonIgnoreIfNull]: handles legacy docs with BSON null array values.
    [BsonIgnoreIfNull]
    public List<RequirementsField> RequirementsTemplate { get; set; } = new();

    // Platform-predefined cancellation option (§6.8).
    public CancellationPolicyType CancellationPolicy { get; set; } = CancellationPolicyType.FlexibleFullRefundBeforeStart;

    public bool InstantOrderEnabled { get; set; }
    public bool ManualApprovalRequired { get; set; }
    public int MaximumActiveOrders { get; set; }

    public CatalogStatus Status { get; set; } = CatalogStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// One FAQ entry for a service (optionally scoped to a package).
public class ServiceFAQ
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string ServiceId { get; set; } = ""; // → ServiceListing.Id

    // Nullable: null means "applies to all packages" (see also Visibility).
    [BsonRepresentation(BsonType.ObjectId)]
    public string? PackageId { get; set; }

    public string Question { get; set; } = "";
    public string Answer { get; set; } = "";
    public FaqVisibility Visibility { get; set; } = FaqVisibility.AllPackages;
    public int DisplayOrder { get; set; }
    public CatalogStatus Status { get; set; } = CatalogStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
