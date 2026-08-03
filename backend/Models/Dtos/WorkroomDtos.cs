using System.ComponentModel.DataAnnotations;
using WebApp.Models.DatabaseModels;

namespace WebApp.Models.Dtos;

public class ConfirmContractRequest { public bool ExplicitlyConfirmed { get; set; } }
public class SubmitDeliverableRequest
{
    [Required] public string Title { get; set; } = "";
    [Required] public string Description { get; set; } = "";
    public List<string> FileIds { get; set; } = new();
    public List<string> ExternalLinks { get; set; } = new();
    public string SubmissionMessage { get; set; } = "";
    [Required] public string ClientInstructions { get; set; } = "";
    public bool AllDeliverablesIncluded { get; set; }
    public bool FilesReviewed { get; set; }
    public bool NoUnrelatedPrivateInfo { get; set; }
    public bool ReadyForReview { get; set; }
    public bool MajorScopeVersion { get; set; }
}
public class CreateRevisionRequest
{
    [Required] public string Description { get; set; } = "";
    public List<string> RequestedChanges { get; set; } = new();
    [Required] public string ScopeClassification { get; set; } = "WithinScope";
    public DateTime? DueDate { get; set; }
    public bool ConsolidatedFeedbackConfirmed { get; set; }
}
public class OpenDisputeRequest { [Required] public string Reason { get; set; } = ""; }
public class PauseEngagementRequest { [Required] public string Reason { get; set; } = ""; }
public class ExtensionRequest { [Range(1, 365)] public int Days { get; set; } [Required] public string Reason { get; set; } = ""; }
public class ExtensionDecisionRequest { public bool Approve { get; set; } [Range(1, 365)] public int Days { get; set; } [Required] public string Reason { get; set; } = ""; }
public class ResolveDisputeRequest { [Required] public string Outcome { get; set; } = ""; [Required] public string Reason { get; set; } = ""; }
public class CreateReviewRequest
{
    [Range(1,5)] public int OverallRating { get; set; }
    [Range(1,5)] public int QualityRating { get; set; }
    [Range(1,5)] public int CommunicationRating { get; set; }
    [Range(1,5)] public int DeliveryRating { get; set; }
    [Range(1,5)] public int ProfessionalismRating { get; set; }
    [Range(1,5)] public int ValueRating { get; set; }
    public string WrittenReview { get; set; } = "";
}
public class ProviderReviewResponseRequest { [Required] public string Response { get; set; } = ""; }
public class AddPayoutMethodRequest
{
    [Required] public string Rail { get; set; } = "";
    [Required] public string DisplayName { get; set; } = "";
    [Required] public string MaskedDescriptor { get; set; } = "";
}
public class UpdateTaxSettingsRequest
{
    [Required] public string LegalName { get; set; } = "";
    [Required] public string CountryCode { get; set; } = "";
    public string? TaxIdentifierMasked { get; set; }
    public bool VatRegistered { get; set; }
    public string? VatNumberMasked { get; set; }
}
public class CreatePayoutRequest
{
    [Range(typeof(decimal), "0.01", "999999999")] public decimal Amount { get; set; }
    [Required] public string Currency { get; set; } = "EUR";
    public string? PayoutMethodId { get; set; }
}
public class CreateTaskRequest
{
    [Required] public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string? MilestoneId { get; set; }
    public string AssigneeId { get; set; } = "";
    public DateTime? DueDate { get; set; }
    public string Visibility { get; set; } = "ClientVisible";
}
public class CreateClientInputRequest
{
    [Required] public string Type { get; set; } = "Clarification";
    [Required] public string Description { get; set; } = "";
    public string? MilestoneId { get; set; }
    public DateTime? DueDate { get; set; }
    public string DeliveryImpact { get; set; } = "";
}
public class CreateTimeEntryRequest
{
    public DateTime StartedAt { get; set; }
    public DateTime EndedAt { get; set; }
    [Required] public string Description { get; set; } = "";
}

public class WorkroomEngagementResponse
{
    public string Id { get; set; } = "";
    public string ProposalId { get; set; } = "";
    public string ProviderId { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string ClientDisplayName { get; set; } = "";
    /// <summary>The provider's display name. This endpoint is actor-scoped and serves both
    /// parties, so a buyer viewing their own engagements needs the counterparty named too.</summary>
    public string ProviderDisplayName { get; set; } = "";
    public string ContractId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal ContractValue { get; set; }
    public string Currency { get; set; } = "";
    public DateTime? StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public string? CurrentMilestoneId { get; set; }
    public double CompletionPercentage { get; set; }
    public string EngagementStatus { get; set; } = "";
    public string EscrowStatus { get; set; } = "";
    public DateTime? PausedAt { get; set; }
    public int AccumulatedPausedMinutes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
public class ContractResponse
{
    public string Id { get; set; } = "";
    public ContractTerms Terms { get; set; } = new();
    public DateTime? ProviderSignedAt { get; set; }
    public DateTime? ClientSignedAt { get; set; }
    public string Status { get; set; } = "";
    public bool SimpleConsentStub { get; set; } = true;
}
public class WorkroomMilestoneResponse
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "";
    public int DisplayOrder { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string CompletionCriteria { get; set; } = "";
    public int RemainingRevisions { get; set; }
    public bool UnlimitedRevisions { get; set; }
    public string Status { get; set; } = "";
    public string EscrowStatus { get; set; } = "";
    public string DeliveryClockState { get; set; } = "";
    public bool ExtensionRequested { get; set; }
    public int ApprovedExtensionDays { get; set; }
    public DateTime? ReviewWindowEndsAt { get; set; }
    public DateTime? AutoReleaseAt { get; set; }
    public DateTime? DisputeOpenedAt { get; set; }
    public DateTime? DisputeReviewEndsAt { get; set; }
    public string? DisputeOutcome { get; set; }
    /// <summary>When support settled the dispute, for either outcome. Immutable history —
    /// DisputeOutcome says what was decided, this says when.</summary>
    public DateTime? DisputeResolvedAt { get; set; }
    /// <summary>Set when Status is Paid because escrow was refunded to the client rather
    /// than released to the provider. UI renders "Refunded" as the primary label.</summary>
    public DateTime? RefundedAt { get; set; }
}
/// <summary>
/// Everything the controller needs to stream a workroom file. Carries a resolved absolute
/// path rather than bytes so the response can be streamed instead of buffered — the
/// documents folder policy allows files far larger than is sensible to hold in memory.
/// </summary>
public sealed record WorkroomFileDownload(string PhysicalPath, string ContentType, string OriginalName);

public class WorkroomDetailResponse
{
    public WorkroomEngagementResponse Engagement { get; set; } = new();
    public ContractResponse Contract { get; set; } = new();
    public List<WorkroomMilestoneResponse> Milestones { get; set; } = new();
    public List<Deliverable> Deliverables { get; set; } = new();
    public List<RevisionRequest> RevisionRequests { get; set; } = new();
    public List<WorkroomTask> Tasks { get; set; } = new();
    public List<ClientInputRequest> ClientInputRequests { get; set; } = new();
    public List<WorkroomFile> Files { get; set; } = new();
    public List<HourlyTimeEntry> HourlyTimeEntries { get; set; } = new();
    public Review? Review { get; set; }
}
public class ProviderFinancialSummaryResponse
{
    public decimal WorkInProgress { get; set; }
    public decimal InReview { get; set; }
    public decimal Pending { get; set; }
    public decimal Available { get; set; }
    public decimal Withdrawn { get; set; }
    public decimal OnHold { get; set; }
    public decimal ProtectedEscrow { get; set; }
    public decimal GrossEarnings { get; set; }
    public decimal CommissionPaid { get; set; }
    public decimal NetEarnings { get; set; }
    public string Currency { get; set; } = "EUR";
    public List<string> AvailableCurrencies { get; set; } = new();
    public List<FinancialTransaction> Transactions { get; set; } = new();
    public List<PayoutRequest> Payouts { get; set; } = new();
    public List<Invoice> Invoices { get; set; } = new();
    public ProviderFinancialSettings Settings { get; set; } = new();
}
public class StatementResponse
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal Gross { get; set; }
    public decimal Commission { get; set; }
    public decimal Adjustments { get; set; }
    public decimal Payouts { get; set; }
    public decimal ClosingBalance { get; set; }
    public List<FinancialTransaction> Transactions { get; set; } = new();
}

public static class WorkroomMapping
{
    public static WorkroomEngagementResponse ToResponse(this WorkroomEngagement e, string? clientDisplayName = null, string? providerDisplayName = null) => new()
    {
        Id=e.Id, ProposalId=e.ProposalId, ProviderId=e.ProviderId, ClientId=e.ClientId, ContractId=e.ContractId,
        ClientDisplayName=clientDisplayName ?? "",
        ProviderDisplayName=providerDisplayName ?? "",
        Title=e.Title, Description=e.Description, ContractValue=e.ContractValue, Currency=e.Currency, StartDate=e.StartDate,
        ExpectedEndDate=e.ExpectedEndDate, ActualEndDate=e.ActualEndDate, CurrentMilestoneId=e.CurrentMilestoneId,
        CompletionPercentage=e.CompletionPercentage, EngagementStatus=e.EngagementStatus.ToString(),
        EscrowStatus=e.EscrowStatus.ToString(), PausedAt=e.PausedAt,
        AccumulatedPausedMinutes=e.AccumulatedPausedMinutes, CreatedAt=e.CreatedAt, UpdatedAt=e.UpdatedAt,
    };
}
