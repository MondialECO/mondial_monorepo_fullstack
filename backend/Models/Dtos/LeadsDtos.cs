using System.ComponentModel.DataAnnotations;
using WebApp.Configuration;
using WebApp.Models.DatabaseModels;

namespace WebApp.Models.Dtos;

public class CreateClientBriefRequest
{
    [Required] public string Title { get; set; } = "";
    [Required] public string Description { get; set; } = "";
    [Required] public string ServiceCategory { get; set; } = "";
    public List<string> RequiredSkills { get; set; } = new();
    public List<string> Industries { get; set; } = new();
    public decimal BudgetMinimum { get; set; }
    public decimal BudgetMaximum { get; set; }
    public string Currency { get; set; } = "EUR";
    public string PricingType { get; set; } = "FixedPrice";
    public string ExpectedDuration { get; set; } = "";
    public string Location { get; set; } = "";
    public bool RemoteAllowed { get; set; } = true;
    public string Visibility { get; set; } = "Public";
    public string Source { get; set; } = "Marketplace";
    public List<string> InvitedProviderIds { get; set; } = new();
    public bool ExclusiveInvitation { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class LeadQueryRequest
{
    public string? Category { get; set; }
    public string? Skill { get; set; }
    public decimal? BudgetMinimum { get; set; }
    public decimal? BudgetMaximum { get; set; }
    public string? Duration { get; set; }
    public string? Location { get; set; }
    public bool? RemoteAllowed { get; set; }
    public string? Source { get; set; }
    public DateTime? PostedAfter { get; set; }
    public DateTime? DeadlineBefore { get; set; }
    public bool SavedOnly { get; set; }
    public string Sort { get; set; } = "newest";
}

public class UpdateBriefInteractionRequest
{
    public bool? Saved { get; set; }
    public bool? Dismissed { get; set; }
}

public class ProposalMilestoneRequest
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Amount { get; set; }
    public int DeliveryTimeValue { get; set; }
    public string DeliveryTimeUnit { get; set; } = "Days";
    public int DisplayOrder { get; set; }
}

public class RequirementAnswerRequest
{
    public string TemplateFieldId { get; set; } = "";
    public string FieldType { get; set; } = "Text";
    public string Value { get; set; } = "";
    public string? Attachment { get; set; }
}

public class UpsertProposalRequest
{
    public string? ClientBriefId { get; set; }
    public string? ClientId { get; set; }
    public string? ServiceId { get; set; }
    public string? PackageId { get; set; }
    public string ProposalSource { get; set; } = "StandardProposal";
    public string Title { get; set; } = "";
    public string CoverMessage { get; set; } = "";
    public decimal ProposedPrice { get; set; }
    public string Currency { get; set; } = "EUR";
    public string PricingType { get; set; } = "FixedPrice";
    public int DeliveryTimeValue { get; set; }
    public string DeliveryTimeUnit { get; set; } = "Days";
    public string DeliveryDayType { get; set; } = "BusinessDays";
    public string DeliveryStartRule { get; set; } = "AfterEscrowFunding";
    public int IncludedRevisionCount { get; set; }
    public bool UnlimitedRevisions { get; set; }
    public bool ConfirmUnlimitedRevisions { get; set; }
    public int RevisionRequestWindowDays { get; set; }
    public List<string> Deliverables { get; set; } = new();
    public List<ProposalMilestoneRequest> MilestonePlan { get; set; } = new();
    public List<string> Attachments { get; set; } = new();
    public DateTime? ExpiresAt { get; set; }
}

public class AcceptProposalRequest
{
    public bool ExplicitlyConfirmed { get; set; }
    public bool EscrowAuthorized { get; set; }
}

public class PackagePurchaseRequest
{
    [Required] public string PackageId { get; set; } = "";
    public List<string> SelectedAddOnNames { get; set; } = new();
    public List<RequirementAnswerRequest> Requirements { get; set; } = new();
    public bool ExplicitlyConfirmed { get; set; }
    public bool PaymentMethodVerified { get; set; }
    public bool EscrowAuthorized { get; set; }
    public bool ComplianceHold { get; set; }
    public bool FinalSummaryShown { get; set; }
}

public class CommissionPreviewResponse
{
    public decimal Price { get; set; }
    public decimal Commission { get; set; }
    public decimal Net { get; set; }
    public string Currency { get; set; } = "EUR";
    public static CommissionPreviewResponse From(decimal price, string currency)
    {
        var commission = decimal.Round(price * PlatformCommerceConstants.CommissionRate, 2, MidpointRounding.AwayFromZero);
        return new() { Price = price, Commission = commission, Net = price - commission, Currency = currency };
    }
}

public class ClientBriefResponse
{
    public string Id { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string ServiceCategory { get; set; } = "";
    public List<string> RequiredSkills { get; set; } = new();
    public List<string> Industries { get; set; } = new();
    public decimal BudgetMinimum { get; set; }
    public decimal BudgetMaximum { get; set; }
    public string Currency { get; set; } = "";
    public string PricingType { get; set; } = "";
    public string ExpectedDuration { get; set; } = "";
    public string Location { get; set; } = "";
    public bool RemoteAllowed { get; set; }
    public string Visibility { get; set; } = "";
    public string Source { get; set; } = "";
    public DateTime? PublishedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string Status { get; set; } = "";
    public bool Viewed { get; set; }
    public DateTime? ViewedAt { get; set; }
    public bool Saved { get; set; }
    public bool Dismissed { get; set; }
    public bool ProposalSubmitted { get; set; }
    public double MatchScore { get; set; }
}

public class ProposalResponse
{
    public string Id { get; set; } = "";
    public string? ClientBriefId { get; set; }
    public string? ServiceId { get; set; }
    public string? PackageId { get; set; }
    public string ProviderId { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string ProposalSource { get; set; } = "";
    public string AcceptanceMode { get; set; } = "";
    public string Title { get; set; } = "";
    public string CoverMessage { get; set; } = "";
    public decimal ProposedPrice { get; set; }
    public string Currency { get; set; } = "";
    public string PricingType { get; set; } = "";
    public int DeliveryTimeValue { get; set; }
    public string DeliveryTimeUnit { get; set; } = "";
    public string DeliveryDayType { get; set; } = "";
    public string DeliveryStartRule { get; set; } = "";
    public int IncludedRevisionCount { get; set; }
    public bool UnlimitedRevisions { get; set; }
    public int RevisionRequestWindowDays { get; set; }
    public List<string> Deliverables { get; set; } = new();
    public List<ProposalMilestoneRequest> MilestonePlan { get; set; } = new();
    public List<string> Attachments { get; set; } = new();
    public string RequirementsStatus { get; set; } = "";
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public string? AcceptanceTrigger { get; set; }
    public string EscrowStatus { get; set; } = "";
    public string ConversionStatus { get; set; } = "";
    public string Status { get; set; } = "";
    public int Version { get; set; }
    public int PreviousVersionCount { get; set; }
    public bool HasPurchaseSnapshot { get; set; }
    public CommissionPreviewResponse EarningsPreview { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public DateTime UpdatedAt { get; set; }
}

public class PackagePurchaseResponse
{
    public ProposalResponse Proposal { get; set; } = new();
    public bool AutoAccepted { get; set; }
    public string UiStatus { get; set; } = "";
    public List<string> FailedConditions { get; set; } = new();
}

public static class LeadsMapping
{
    public static ClientBriefResponse ToResponse(this ClientBrief b, ClientBriefInteraction? i = null,
        bool proposalSubmitted = false, double matchScore = 0) => new()
    {
        Id = b.Id, ClientId = b.ClientId, Title = b.Title, Description = b.Description,
        ServiceCategory = b.ServiceCategory.ToString(), RequiredSkills = new(b.RequiredSkills), Industries = new(b.Industries),
        BudgetMinimum = b.BudgetMinimum, BudgetMaximum = b.BudgetMaximum, Currency = b.Currency,
        PricingType = b.PricingType.ToString(), ExpectedDuration = b.ExpectedDuration, Location = b.Location,
        RemoteAllowed = b.RemoteAllowed, Visibility = b.Visibility.ToString(), Source = b.Source.ToString(),
        PublishedAt = b.PublishedAt, ExpiresAt = b.ExpiresAt, Status = b.Status.ToString(),
        Viewed = i?.Viewed ?? false, ViewedAt = i?.ViewedAt, Saved = i?.Saved ?? false,
        Dismissed = i?.Dismissed ?? false, ProposalSubmitted = proposalSubmitted, MatchScore = matchScore,
    };

    public static ProposalResponse ToResponse(this Proposal p, List<string>? warnings = null) => new()
    {
        Id = p.Id, ClientBriefId = p.ClientBriefId, ServiceId = p.ServiceId, PackageId = p.PackageId,
        ProviderId = p.ProviderId, ClientId = p.ClientId, ProposalSource = p.ProposalSource.ToString(),
        AcceptanceMode = p.AcceptanceMode.ToString(), Title = p.Title, CoverMessage = p.CoverMessage,
        ProposedPrice = p.ProposedPrice, Currency = p.Currency, PricingType = p.PricingType.ToString(),
        DeliveryTimeValue = p.DeliveryTimeValue, DeliveryTimeUnit = p.DeliveryTimeUnit.ToString(),
        DeliveryDayType = p.DeliveryDayType.ToString(), DeliveryStartRule = p.DeliveryStartRule.ToString(),
        IncludedRevisionCount = p.IncludedRevisionCount, UnlimitedRevisions = p.UnlimitedRevisions,
        RevisionRequestWindowDays = p.RevisionRequestWindowDays, Deliverables = new(p.Deliverables),
        MilestonePlan = p.MilestonePlan.Select(x => new ProposalMilestoneRequest
        {
            Title = x.Title, Description = x.Description, Amount = x.Amount,
            DeliveryTimeValue = x.DeliveryTimeValue, DeliveryTimeUnit = x.DeliveryTimeUnit.ToString(), DisplayOrder = x.DisplayOrder,
        }).ToList(), Attachments = new(p.Attachments), RequirementsStatus = p.RequirementsStatus.ToString(),
        SubmittedAt = p.SubmittedAt, ExpiresAt = p.ExpiresAt, AcceptedAt = p.AcceptedAt,
        AcceptanceTrigger = p.AcceptanceTrigger, EscrowStatus = p.EscrowStatus.ToString(),
        ConversionStatus = p.ConversionStatus.ToString(), Status = p.Status.ToString(), Version = p.Version,
        PreviousVersionCount = p.PreviousVersions.Count, HasPurchaseSnapshot = p.PurchaseSnapshot is not null,
        EarningsPreview = CommissionPreviewResponse.From(p.ProposedPrice, p.Currency), Warnings = warnings ?? new(), UpdatedAt = p.UpdatedAt,
    };
}
