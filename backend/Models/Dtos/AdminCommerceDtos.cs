using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using WebApp.Models.DatabaseModels;

namespace WebApp.Models.Dtos
{
    public class AdminCommerceMetricsDto
    {
        public int TotalEngagements { get; set; }
        public int ActiveEngagements { get; set; }
        public int CompletedEngagements { get; set; }
        public int OpenDisputes { get; set; }
        public int OpenDisputesCount { get; set; }
        public decimal DisputedAmountTotal { get; set; }
        public int PendingPayoutRequests { get; set; }
        public int PendingPayoutsCount { get; set; }
        public decimal PendingPayoutVolume { get; set; }
        public decimal PendingPayoutsAmount { get; set; }
        public int ProcessedPayouts { get; set; }
        public decimal ProcessedPayoutVolume { get; set; }
        public decimal GrossTransactionVolume { get; set; }
        public decimal TotalPlatformRevenue { get; set; }
        public decimal PlatformCommission { get; set; }
        public decimal RefundedAmount { get; set; }
        public decimal TotalEscrowHeld { get; set; }
        public int ActiveEscrowContractsCount { get; set; }
        public decimal AllTimeGMV { get; set; }
        public decimal RecentTransactionVolume30Days { get; set; }
        public string Currency { get; set; } = "EUR";
    }

    public class AdminCommerceSummaryDto : AdminCommerceMetricsDto
    {
    }

    public class AdminEngagementListQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Search { get; set; }
        public string? ClientId { get; set; }
        public string? ProviderId { get; set; }
        public string? Status { get; set; }
        public bool? HasDispute { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class AdminEngagementListItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string ClientEmail { get; set; } = string.Empty;
        public string ProviderId { get; set; } = string.Empty;
        public string ProviderName { get; set; } = string.Empty;
        public string ProviderEmail { get; set; } = string.Empty;
        public decimal ContractValue { get; set; }
        public string Currency { get; set; } = "EUR";
        public string Status { get; set; } = string.Empty;
        public string EscrowStatus { get; set; } = string.Empty;
        public int MilestonesCount { get; set; }
        public double CompletionPercentage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpectedEndDate { get; set; }
        public DateTime? ActualEndDate { get; set; }
        public bool HasDispute { get; set; }
    }

    public class AdminEngagementDetailDto
    {
        public string Id { get; set; } = string.Empty;
        public string ProposalId { get; set; } = string.Empty;
        public string ContractId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal ContractValue { get; set; }
        public string Currency { get; set; } = "EUR";
        public string Status { get; set; } = string.Empty;
        public string EscrowStatus { get; set; } = string.Empty;
        public double CompletionPercentage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? ExpectedEndDate { get; set; }
        public DateTime? ActualEndDate { get; set; }

        public AdminPartyDto Client { get; set; } = new();
        public AdminPartyDto Provider { get; set; } = new();
        public AdminContractSummaryDto? Contract { get; set; }

        public List<AdminMilestoneDto> Milestones { get; set; } = new();
        public List<AdminDeliverableDto> Deliverables { get; set; } = new();
        public List<AdminFinancialTransactionDto> Transactions { get; set; } = new();
        public List<AdminFileMetaDto> Files { get; set; } = new();
    }

    public class AdminPartyDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new();
        public string? PhoneNumber { get; set; }
        public bool EmailConfirmed { get; set; }
        public string KycStatus { get; set; } = string.Empty;
    }

    public class AdminContractSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? ProviderSignedAt { get; set; }
        public DateTime? ClientSignedAt { get; set; }
        public decimal Price { get; set; }
        public string Currency { get; set; } = "EUR";
        public string PricingType { get; set; } = string.Empty;
        public int DeliveryTimeValue { get; set; }
        public string DeliveryTimeUnit { get; set; } = string.Empty;
        public int IncludedRevisionCount { get; set; }
        public bool UnlimitedRevisions { get; set; }
        public List<string> Deliverables { get; set; } = new();
        public decimal? HourlyRate { get; set; }
        public decimal? WeeklyHourLimit { get; set; }
    }

    public class AdminMilestoneDto
    {
        public string Id { get; set; } = string.Empty;
        public string EngagementId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "EUR";
        public int DisplayOrder { get; set; }
        public string Status { get; set; } = string.Empty;
        public string EscrowStatus { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? RefundedAt { get; set; }
        public DateTime? DisputeOpenedAt { get; set; }
        public DateTime? DisputeResolvedAt { get; set; }
        public string? DisputeOutcome { get; set; }
        public int IncludedRevisionCount { get; set; }
        public int UsedRevisionCount { get; set; }
        public bool UnlimitedRevisions { get; set; }
        public string CompletionCriteria { get; set; } = string.Empty;
    }

    public class AdminDeliverableDto
    {
        public string Id { get; set; } = string.Empty;
        public string MilestoneId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime SubmittedAt { get; set; }
        public int FilesCount { get; set; }
        public int LinksCount { get; set; }
    }

    public class AdminFileMetaDto
    {
        public string Id { get; set; } = string.Empty;
        public string MilestoneId { get; set; } = string.Empty;
        public string OriginalName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class AdminDisputeListItemDto
    {
        public string MilestoneId { get; set; } = string.Empty;
        public string MilestoneTitle { get; set; } = string.Empty;
        public string EngagementId { get; set; } = string.Empty;
        public string EngagementTitle { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string ProviderId { get; set; } = string.Empty;
        public string ProviderName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "EUR";
        public DateTime? DisputeOpenedAt { get; set; }
        public DateTime? DisputeResolvedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Outcome { get; set; }
        public int RevisionCount { get; set; }
    }

    public class AdminDisputeDetailDto
    {
        public AdminMilestoneDto Milestone { get; set; } = new();
        public AdminEngagementListItemDto Engagement { get; set; } = new();
        public AdminContractSummaryDto? Contract { get; set; }
        public List<AdminDeliverableDto> Deliverables { get; set; } = new();
        public List<AdminRevisionRequestDto> RevisionHistory { get; set; } = new();
        public List<AdminFinancialTransactionDto> RelatedTransactions { get; set; } = new();
        public string? CurrentDisputeOutcome { get; set; }
        public DateTime? DisputeOpenedAt { get; set; }
        public DateTime? DisputeResolvedAt { get; set; }
    }

    public class AdminRevisionRequestDto
    {
        public string Id { get; set; } = string.Empty;
        public string MilestoneId { get; set; } = string.Empty;
        public string RequestedBy { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> RequestedChanges { get; set; } = new();
        public string Status { get; set; } = string.Empty;
        public string ScopeClassification { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class AdminTransactionListQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Search { get; set; }
        public string? UserId { get; set; }
        public string? EngagementId { get; set; }
        public string? TransactionType { get; set; }
        public string? PaymentStatus { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
    }

    public class AdminFinancialTransactionDto
    {
        public string Id { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ReleasedAt { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public decimal GrossAmount { get; set; }
        public decimal CommissionAmount { get; set; }
        public decimal NetAmount { get; set; }
        public string Currency { get; set; } = "EUR";
        public string ClientId { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string ProviderId { get; set; } = string.Empty;
        public string ProviderName { get; set; } = string.Empty;
        public string? EngagementId { get; set; }
        public string? EngagementTitle { get; set; }
        public string? MilestoneId { get; set; }
        public string IdempotencyKey { get; set; } = string.Empty;
    }

    public class AdminPayoutListQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Status { get; set; }
        public string? ProviderId { get; set; }
    }

    public class AdminPayoutListItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string ProviderId { get; set; } = string.Empty;
        public string ProviderName { get; set; } = string.Empty;
        public string ProviderEmail { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "EUR";
        public string Status { get; set; } = string.Empty;
        public string PayoutMethodId { get; set; } = string.Empty;
        public string PayoutMethodLabel { get; set; } = string.Empty;
        public string MaskedDestination { get; set; } = string.Empty;
        public string? GatewayReference { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class AdminPayoutDetailDto
    {
        public AdminPayoutListItemDto Payout { get; set; } = new();
        public AdminPartyDto Provider { get; set; } = new();
        public decimal AvailableBalance { get; set; }
        public decimal WithdrawnTotal { get; set; }
        public decimal PendingPayoutsTotal { get; set; }
        public List<AdminPayoutListItemDto> PreviousPayouts { get; set; } = new();
    }

    public class AdminPayoutActionRequest
    {
        [Required]
        public string Reason { get; set; } = string.Empty;
        public string? Reference { get; set; }
    }

    public class AdminEscrowListQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 15;
        public string? Search { get; set; }
        public string? Status { get; set; }
    }

    public class AdminEscrowMilestoneItemDto
    {
        public string MilestoneId { get; set; } = string.Empty;
        public string EngagementId { get; set; } = string.Empty;
        public string? EngagementTitle { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string ProviderName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "EUR";
        public string Status { get; set; } = string.Empty;
        public DateTime? FundedAt { get; set; }
        public DateTime? DueDate { get; set; }
        public int DeliverablesCount { get; set; }
        public bool CanRelease { get; set; }
        public bool HasDispute { get; set; }
    }

    public class AdminCommissionTierDto
    {
        public int TierLevel { get; set; }
        public string TierName { get; set; } = string.Empty;
        public decimal CommissionPercentage { get; set; } = 12.0m;
        public string Eligibility { get; set; } = string.Empty;
        public string MatchingPriority { get; set; } = string.Empty;
    }

    public class AdminCommissionConfigDto
    {
        public decimal DefaultCommissionPercentage { get; set; } = 12.0m;
        public decimal MinimumFeeAmount { get; set; } = 0m;
        public string Currency { get; set; } = "EUR";
        public Dictionary<string, decimal> CategoryOverrides { get; set; } = new();
        public bool IsLocked { get; set; } = true;
        public string PolicyStatement { get; set; } = "Flat 12% platform commission across all marketplace engagements. Service provider tiers govern matching priority and profile ranking only.";
        public List<AdminCommissionTierDto> Tiers { get; set; } = new();
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedByAdminId { get; set; }
    }
}
