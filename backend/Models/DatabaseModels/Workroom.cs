using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

public enum EngagementStatus { ContractPending, EscrowPending, ReadyToStart, Active, Paused, ClientInputRequired, MilestoneReview, RevisionInProgress, FinalDelivery, Completed, Cancelled, Disputed, Archived }
public enum WorkroomEscrowStatus { NotFunded, AuthorizationPending, Funded, ReleasePending, Released, Refunded, OnHold, Failed }
public enum ContractStatus { Pending, Signed, Voided }
public enum WorkroomMilestoneStatus { Draft, FundingRequired, Funded, Active, SubmissionDraft, Submitted, ClientReviewing, RevisionRequested, RevisionInProgress, Resubmitted, Approved, PaymentProcessing, Paid, Cancelled, Disputed }
// The eleven enums below are exposed RAW on WorkroomDetailResponse — Deliverables,
// RevisionRequests, Tasks, ClientInputRequests, Files and Review ship the BSON model
// itself, with no DTO in between — so these declarations are the wire contract.
// System.Text.Json serialises an unannotated enum as its integer ordinal, which every
// frontend consumer reads as a string; the attribute sits on the TYPE rather than each
// property so any future property using one of these is covered automatically. That gap
// is exactly how RevisionRequest.FeedbackCollectionStatus escaped an earlier per-property
// audit. JSON only: MongoDB.Driver has its own serializers and ignores these attributes,
// so stored documents are unaffected.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DeliverableStatus { Draft, Submitted, Locked, Superseded, Approved, Restricted }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RevisionScopeClassification { WithinScope, NeedsClarification, PotentialScopeChange, ConfirmedScopeChange }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RevisionRequestStatus { FeedbackCollecting, Submitted, Accepted, InProgress, Resolved, Declined, Cancelled }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FeedbackCollectionStatus { Collecting, Consolidated, Locked }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WorkroomFileStatus { Selected, Uploading, Scanning, Ready, Failed, Archived, Restricted }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WorkroomTaskStatus { NotStarted, InProgress, Blocked, Completed, Cancelled }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WorkroomTaskVisibility { ClientVisible, ProviderPrivate, SharedTeam }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ClientInputType { File, Decision, Feedback, Approval, Clarification, Meeting }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ClientInputStatus { Requested, Supplied, Cancelled }
// The five enums below reach the client raw, exactly like the workroom set above:
// ProviderFinancialSummaryResponse returns FinancialTransaction, PayoutRequest, Invoice
// and ProviderFinancialSettings as the BSON models themselves, and StatementResponse
// returns FinancialTransaction, so these declarations are the wire contract. Unannotated
// they serialised as ordinals while types/workroom.ts declares the fields `string`, so
// every comparison against them silently never matched — badges rendered neutral, payout
// amounts rendered positive, and labels rendered a bare digit.
//
// Type-level, not per-property, for the same reason as the workroom batch: a per-property
// audit there missed FeedbackCollectionStatus. Anything that later uses one of these types
// is covered automatically.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FinancialTransactionType { EscrowFunded, MilestoneApproved, PaymentReleased, CommissionCharged, PayoutRequested, PayoutProcessing, PayoutCompleted, PayoutFailed, Refund, Adjustment, DisputeHold, HoldReleased }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PaymentStatus { Pending, Processing, Completed, Failed, OnHold, Refunded }
// PaymentOperation is server-internal — never returned on any response — so its two enums
// are deliberately left unannotated rather than swept in for symmetry.
public enum PaymentOperationType { AuthorizeEscrow, ReleaseEscrow, RefundEscrow, CreatePayout }
public enum PaymentOperationStatus { Pending, GatewaySucceeded, Completed, Failed, ReconciliationRequired }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PayoutStatus { Draft, Requested, UnderReview, Processing, Completed, Failed, Cancelled, OnHold }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PayoutRail { StripeConnect, Wise, BankTransfer, PayPal }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InvoiceStatus { Draft, Generated, Issued, Paid, Cancelled, Corrected, CreditNote }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReviewVisibility { Public, Private }
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReviewVerificationStatus { Pending, Verified, Rejected }
public enum DisputeOutcome { Open, ProviderFavored, ClientFavored, Split }
public enum CouponStatus { Active, Redeemed, Expired, Cancelled }

public class ContractTerms
{
    [BsonRepresentation(BsonType.Decimal128)] public decimal Price { get; set; }
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
    public bool AllowsParallelMilestones { get; set; }
    [BsonRepresentation(BsonType.Decimal128)] public decimal? HourlyRate { get; set; }
    public decimal? WeeklyHourLimit { get; set; }
}

public class WorkroomEngagement
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string ProposalId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = "";
    public string ClientId { get; set; } = "";
    [BsonRepresentation(BsonType.ObjectId)] public string ContractId { get; set; } = string.Empty;
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    [BsonRepresentation(BsonType.Decimal128)] public decimal ContractValue { get; set; }
    public string Currency { get; set; } = "EUR";
    public DateTime? StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    [BsonRepresentation(BsonType.ObjectId)] public string? CurrentMilestoneId { get; set; }
    public double CompletionPercentage { get; set; }
    public EngagementStatus EngagementStatus { get; set; } = EngagementStatus.ContractPending;
    public WorkroomEscrowStatus EscrowStatus { get; set; } = WorkroomEscrowStatus.NotFunded;
    public DateTime? PausedAt { get; set; }
    public int AccumulatedPausedMinutes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Contract
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string EngagementId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = "";
    public string ClientId { get; set; } = "";
    public ContractTerms Terms { get; set; } = new();
    public DateTime? ProviderSignedAt { get; set; }
    public DateTime? ClientSignedAt { get; set; }
    public ContractStatus Status { get; set; } = ContractStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class WorkroomMilestone
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string EngagementId { get; set; } = string.Empty;
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    [BsonRepresentation(BsonType.Decimal128)] public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public int DisplayOrder { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? OriginalDueDate { get; set; }
    public DateTime? ExtensionRequestedAt { get; set; }
    public int ApprovedExtensionDays { get; set; }
    public string CompletionCriteria { get; set; } = "";
    public int IncludedRevisionCount { get; set; }
    public bool UnlimitedRevisions { get; set; }
    public int PurchasedAdditionalRevisions { get; set; }
    public int UsedRevisionCount { get; set; }
    public WorkroomMilestoneStatus MilestoneStatus { get; set; } = WorkroomMilestoneStatus.Draft;
    public WorkroomEscrowStatus EscrowStatus { get; set; } = WorkroomEscrowStatus.NotFunded;
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewWindowEndsAt { get; set; }
    public DateTime? AutoReleaseAt { get; set; }
    /// <summary>Immutable history: when a dispute was first opened. Never cleared —
    /// analytics buckets disputes by this timestamp and the UI renders it alongside the
    /// outcome. To ask "is a dispute active right now", read <see cref="DisputeOutcome"/>
    /// instead; gating on this field freezes escrow permanently once resolved.</summary>
    public DateTime? DisputeOpenedAt { get; set; }
    public DateTime? DisputeReviewEndsAt { get; set; }
    /// <summary>Authoritative dispute state. <c>Open</c> blocks payment release and
    /// auto-release; any other value (including null) means no dispute is in flight.</summary>
    public DisputeOutcome? DisputeOutcome { get; set; }
    /// <summary>Immutable history: when support settled the dispute, set once for either
    /// outcome and never cleared. <c>DisputeOutcome</c> records what was decided but not
    /// when; <c>UpdatedAt</c> is overwritten by the next action on the milestone, so
    /// without this the timing of a provider-favoured resolution is lost as soon as
    /// anything else happens. Counterpart to <c>DisputeOpenedAt</c>.</summary>
    public DateTime? DisputeResolvedAt { get; set; }
    /// <summary>Immutable history: when escrow was refunded to the client after a
    /// client-favoured dispute. <c>Paid</c> means "payment settled" in either direction —
    /// set here it means refunded to the client, null it means released to the provider.
    /// Anything summing provider revenue must exclude <c>Paid &amp;&amp; RefundedAt != null</c>.</summary>
    public DateTime? RefundedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Deliverable
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string MilestoneId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Version { get; set; } = "1.0";
    public List<string> FileIds { get; set; } = new();
    public List<string> ExternalLinks { get; set; } = new();
    public string SubmissionMessage { get; set; } = "";
    public string ClientInstructions { get; set; } = "";
    public bool CompletionConfirmed { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DeliverableStatus DeliverableStatus { get; set; } = DeliverableStatus.Submitted;
}

public class RevisionRequest
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string MilestoneId { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string DeliverableId { get; set; } = string.Empty;
    public string RequestedBy { get; set; } = "";
    public string Description { get; set; } = "";
    public List<string> RequestedChanges { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    public RevisionScopeClassification ScopeClassification { get; set; }
    public FeedbackCollectionStatus FeedbackCollectionStatus { get; set; } = FeedbackCollectionStatus.Collecting;
    public RevisionRequestStatus RevisionRequestStatus { get; set; } = RevisionRequestStatus.FeedbackCollecting;
}

public class FinancialTransaction
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string? EngagementId { get; set; }
    [BsonRepresentation(BsonType.ObjectId)] public string? MilestoneId { get; set; }
    public string ProviderId { get; set; } = "";
    public string ClientId { get; set; } = "";
    [BsonRepresentation(BsonType.Decimal128)] public decimal GrossAmount { get; set; }
    public string Currency { get; set; } = "EUR";
    [BsonRepresentation(BsonType.Decimal128)] public decimal CommissionAmount { get; set; }
    [BsonRepresentation(BsonType.Decimal128)] public decimal NetAmount { get; set; }
    public FinancialTransactionType TransactionType { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public string IdempotencyKey { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReleasedAt { get; set; }
}

public class Review
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string EngagementId { get; set; } = string.Empty;
    public string ClientId { get; set; } = "";
    public string ProviderId { get; set; } = "";
    public int OverallRating { get; set; }
    public int QualityRating { get; set; }
    public int CommunicationRating { get; set; }
    public int DeliveryRating { get; set; }
    public int ProfessionalismRating { get; set; }
    public int ValueRating { get; set; }
    public string WrittenReview { get; set; } = "";
    public string? ProviderResponse { get; set; }
    public ReviewVisibility Visibility { get; set; } = ReviewVisibility.Public;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public ReviewVerificationStatus VerificationStatus { get; set; } = ReviewVerificationStatus.Verified;
}

public class WorkroomTask
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string EngagementId { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string? MilestoneId { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string AssigneeId { get; set; } = "";
    public DateTime? DueDate { get; set; }
    public WorkroomTaskVisibility Visibility { get; set; }
    public WorkroomTaskStatus Status { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ClientInputRequest
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string EngagementId { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string? MilestoneId { get; set; }
    public ClientInputType Type { get; set; }
    public string Description { get; set; } = "";
    public DateTime? DueDate { get; set; }
    public string DeliveryImpact { get; set; } = "";
    public ClientInputStatus Status { get; set; } = ClientInputStatus.Requested;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SuppliedAt { get; set; }
}

public class WorkroomFile
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string EngagementId { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string? MilestoneId { get; set; }
    public string UploadedBy { get; set; } = "";
    public string OriginalName { get; set; } = "";
    /// <summary>Server-internal physical location. <c>WorkroomDetailResponse</c> returns this
    /// model raw, so without <c>[JsonIgnore]</c> every participant received the storage path
    /// for every file in the engagement. Downloads go through the authorised
    /// <c>files/{id}/download</c> endpoint, which resolves the path server-side; no client
    /// needs it. JSON only — MongoDB.Driver has its own serializer and still persists it.</summary>
    [JsonIgnore] public string StoragePath { get; set; } = "";
    public string ContentType { get; set; } = "";
    public long SizeBytes { get; set; }
    public WorkroomFileStatus Status { get; set; }
    public bool ProviderPrivate { get; set; }
    public bool Immutable { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class PaymentOperation
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = "";
    public PaymentOperationType Type { get; set; }
    [BsonRepresentation(BsonType.ObjectId)] public string? EngagementId { get; set; }
    [BsonRepresentation(BsonType.ObjectId)] public string? MilestoneId { get; set; }
    [BsonRepresentation(BsonType.ObjectId)] public string? PayoutRequestId { get; set; }
    [BsonRepresentation(BsonType.Decimal128)] public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public PaymentOperationStatus Status { get; set; } = PaymentOperationStatus.Pending;
    public string? GatewayReference { get; set; }
    public string? Error { get; set; }
    public int AttemptCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class PayoutRequest
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    public string ProviderId { get; set; } = "";
    public string PayoutMethodId { get; set; } = "";
    [BsonRepresentation(BsonType.Decimal128)] public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public PayoutStatus Status { get; set; } = PayoutStatus.Requested;
    public string? GatewayReference { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

public class Invoice
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = "";
    public string ProviderId { get; set; } = "";
    public string ClientId { get; set; } = "";
    [BsonRepresentation(BsonType.ObjectId)] public string EngagementId { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string? MilestoneId { get; set; }
    [BsonRepresentation(BsonType.Decimal128)] public decimal GrossAmount { get; set; }
    [BsonRepresentation(BsonType.Decimal128)] public decimal CommissionAmount { get; set; }
    [BsonRepresentation(BsonType.Decimal128)] public decimal NetAmount { get; set; }
    public string Currency { get; set; } = "EUR";
    public DateTime? ApprovalDate { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public ProviderTaxSettings TaxSnapshot { get; set; } = new();
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    [BsonRepresentation(BsonType.ObjectId)] public string? CorrectsInvoiceId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class HourlyTimeEntry
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    [BsonRepresentation(BsonType.ObjectId)] public string EngagementId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = "";
    public DateTime StartedAt { get; set; }
    public DateTime EndedAt { get; set; }
    public string Description { get; set; } = "";
    public bool ClientApproved { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class WorkroomAuditEvent
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    public string ActorId { get; set; } = "";
    public string ActorRole { get; set; } = "";
    public string Action { get; set; } = "";
    public string EntityType { get; set; } = "";
    public string EntityId { get; set; } = "";
    public string? PreviousState { get; set; }
    public string? NewState { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Reason { get; set; }
}

public class RepeatClientCoupon
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    public string ProviderId { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string Code { get; set; } = "";
    public int DiscountPercent { get; set; }
    public CouponStatus Status { get; set; } = CouponStatus.Active;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
