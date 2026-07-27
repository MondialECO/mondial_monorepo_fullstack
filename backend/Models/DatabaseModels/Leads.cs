using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

public enum ClientBriefStatus { Draft, Published, Open, Closed, Expired, Cancelled }
public enum ClientBriefVisibility { Public, DirectInvitation, Private }
public enum ClientBriefSource { Marketplace, DirectInvitation, FeaturedPush, ServiceInquiry }
public enum ProposalStatus
{
    Draft, Submitted, Viewed, ChangesRequested, Revised, ClientReviewing,
    Accepted, Declined, Withdrawn, Expired, ConvertedToProject,
}
public enum ProposalSource
{
    StandardProposal, DirectInvitationProposal, CustomOffer,
    PublishedPackagePurchase, PackageAddOn, ChangeRequest,
}
public enum ProposalAcceptanceMode { ManualClientAcceptance, RuleBasedInstantOrder, PlatformAdminResolution }
public enum ProposalRequirementsStatus { NotRequired, Pending, Complete, Incomplete }
public enum ProposalEscrowStatus { NotStarted, AuthorizationPending, Authorized, Failed }
public enum ProposalConversionStatus { NotApplicable, AwaitingModule4, Converted }

public class ClientBriefInvitationDelivery
{
    public string ProviderId { get; set; } = "";
    public DateTime DeliveredAt { get; set; }
}

public class ClientBrief
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;
    public string ClientId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public ServiceCategory ServiceCategory { get; set; }
    public List<string> RequiredSkills { get; set; } = new();
    public List<string> Industries { get; set; } = new();
    [BsonRepresentation(BsonType.Decimal128)] public decimal BudgetMinimum { get; set; }
    [BsonRepresentation(BsonType.Decimal128)] public decimal BudgetMaximum { get; set; }
    public string Currency { get; set; } = "EUR";
    public PricingModel PricingType { get; set; } = PricingModel.FixedPrice;
    public string ExpectedDuration { get; set; } = "";
    public string Location { get; set; } = "";
    public bool RemoteAllowed { get; set; } = true;
    public ClientBriefVisibility Visibility { get; set; } = ClientBriefVisibility.Public;
    public ClientBriefSource Source { get; set; } = ClientBriefSource.Marketplace;
    public List<string> InvitedProviderIds { get; set; } = new();
    public List<ClientBriefInvitationDelivery> InvitationDeliveries { get; set; } = new();
    public bool ExclusiveInvitation { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public ClientBriefStatus Status { get; set; } = ClientBriefStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ClientBriefInteraction
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;
    public string ProviderId { get; set; } = "";
    [BsonRepresentation(BsonType.ObjectId)] public string ClientBriefId { get; set; } = "";
    public bool Viewed { get; set; }
    public DateTime? ViewedAt { get; set; }
    public bool Saved { get; set; }
    public bool Dismissed { get; set; }
    public DateTime? ExpiryNotificationSentAt { get; set; }
    /// <summary>The brief's provider-specific availability time; independent of when this row was persisted.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ProposalRequirementAnswer
{
    public string TemplateFieldId { get; set; } = "";
    public RequirementsFieldType FieldType { get; set; } = RequirementsFieldType.Text;
    public string Value { get; set; } = "";
    public string? Attachment { get; set; }
    public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;
}

public class ProposalMilestonePlanItem
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    [BsonRepresentation(BsonType.Decimal128)] public decimal Amount { get; set; }
    public int DeliveryTimeValue { get; set; }
    public DeliveryTimeUnit DeliveryTimeUnit { get; set; } = DeliveryTimeUnit.Days;
    public int DisplayOrder { get; set; }
}

public class SelectedAddOnSnapshot
{
    public string Name { get; set; } = "";
    [BsonRepresentation(BsonType.Decimal128)] public decimal Price { get; set; }
    public int DeliveryTimeAdjustmentDays { get; set; }
}

public class ProposalVersionSnapshot
{
    public int Version { get; set; }
    public string Title { get; set; } = "";
    public string CoverMessage { get; set; } = "";
    [BsonRepresentation(BsonType.Decimal128)] public decimal ProposedPrice { get; set; }
    public string Currency { get; set; } = "EUR";
    public PricingModel PricingType { get; set; }
    public int DeliveryTimeValue { get; set; }
    public DeliveryTimeUnit DeliveryTimeUnit { get; set; }
    public DeliveryDayType DeliveryDayType { get; set; }
    public DeliveryStartRule DeliveryStartRule { get; set; }
    public int IncludedRevisionCount { get; set; }
    public bool UnlimitedRevisions { get; set; }
    public int RevisionRequestWindowDays { get; set; }
    public List<string> Deliverables { get; set; } = new();
    public List<ProposalMilestonePlanItem> MilestonePlan { get; set; } = new();
    public List<string> Attachments { get; set; } = new();
    public DateTime? ExpiresAt { get; set; }
    public DateTime SupersededAt { get; set; } = DateTime.UtcNow;
}

public class PurchaseSnapshot
{
    public string ServiceId { get; set; } = "";
    public string ServiceTitle { get; set; } = "";
    public ServiceCategory ServiceCategory { get; set; }
    public string PackageId { get; set; } = "";
    public string PackageTitle { get; set; } = "";
    [BsonRepresentation(BsonType.Decimal128)] public decimal PackagePrice { get; set; }
    public List<SelectedAddOnSnapshot> SelectedAddOns { get; set; } = new();
    [BsonRepresentation(BsonType.Decimal128)] public decimal FinalPrice { get; set; }
    public string Currency { get; set; } = "EUR";
    public int DeliveryTimeValue { get; set; }
    public DeliveryTimeUnit DeliveryTimeUnit { get; set; }
    public DeliveryDayType DeliveryDayType { get; set; }
    public int IncludedRevisionCount { get; set; }
    public bool UnlimitedRevisions { get; set; }
    public int RevisionRequestWindowDays { get; set; }
    public List<string> Deliverables { get; set; } = new();
    public List<ProposalRequirementAnswer> Requirements { get; set; } = new();
    public List<string> FaqSnapshot { get; set; } = new();
    public CancellationPolicyType CancellationTerms { get; set; }
    public DateTime AcceptedAt { get; set; }
}

public class Proposal
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string? ClientBriefId { get; set; }
    [BsonRepresentation(BsonType.ObjectId)] public string? ServiceId { get; set; }
    [BsonRepresentation(BsonType.ObjectId)] public string? PackageId { get; set; }
    public string ProviderId { get; set; } = "";
    public string ClientId { get; set; } = "";
    public ProposalSource ProposalSource { get; set; } = ProposalSource.StandardProposal;
    public ProposalAcceptanceMode AcceptanceMode { get; set; } = ProposalAcceptanceMode.ManualClientAcceptance;
    public string Title { get; set; } = "";
    public string CoverMessage { get; set; } = "";
    [BsonRepresentation(BsonType.Decimal128)] public decimal ProposedPrice { get; set; }
    public string Currency { get; set; } = "EUR";
    public PricingModel PricingType { get; set; } = PricingModel.FixedPrice;
    public int DeliveryTimeValue { get; set; }
    public DeliveryTimeUnit DeliveryTimeUnit { get; set; } = DeliveryTimeUnit.Days;
    public DeliveryDayType DeliveryDayType { get; set; } = DeliveryDayType.BusinessDays;
    public DeliveryStartRule DeliveryStartRule { get; set; } = DeliveryStartRule.AfterEscrowFunding;
    public int IncludedRevisionCount { get; set; }
    public bool UnlimitedRevisions { get; set; }
    public int RevisionRequestWindowDays { get; set; }
    public List<string> Deliverables { get; set; } = new();
    public List<ProposalMilestonePlanItem> MilestonePlan { get; set; } = new();
    public List<SelectedAddOnSnapshot> SelectedAddOns { get; set; } = new();
    public ProposalRequirementsStatus RequirementsStatus { get; set; } = ProposalRequirementsStatus.NotRequired;
    public List<ProposalRequirementAnswer> RequirementsSubmission { get; set; } = new();
    public List<string> Attachments { get; set; } = new();
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public string? AcceptedBy { get; set; }
    public string? AcceptanceTrigger { get; set; }
    public ProposalEscrowStatus EscrowStatus { get; set; } = ProposalEscrowStatus.NotStarted;
    public ProposalConversionStatus ConversionStatus { get; set; } = ProposalConversionStatus.NotApplicable;
    public ProposalStatus Status { get; set; } = ProposalStatus.Draft;
    public int Version { get; set; } = 1;
    public List<ProposalVersionSnapshot> PreviousVersions { get; set; } = new();
    public PurchaseSnapshot? PurchaseSnapshot { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
