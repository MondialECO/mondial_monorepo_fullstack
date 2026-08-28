using System;
using System.Collections.Generic;

namespace WebApp.Models.Dtos
{
    public class MarketplaceProjectDto
    {
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string Tagline { get; set; } = string.Empty;
        public string Problem { get; set; } = string.Empty;
        public string TargetUser { get; set; } = string.Empty;
        public string Solution { get; set; } = string.Empty;
        public string Sector { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Stage { get; set; } = "Concept";
        public double ClarityScore { get; set; }
        public double ReadinessScore { get; set; }
        public List<string> DealModes { get; set; } = new();
        public decimal? AskingPrice { get; set; }
        public bool NdaRequired { get; set; }
        public string Audience { get; set; } = "public";
        public string Status { get; set; } = "available";
        public DateTime? PublishedAt { get; set; }
    }

    public class ProjectInterestDto
    {
        public string Id { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string CreatorId { get; set; } = string.Empty;
        public string EntrepreneurId { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;
        public string? EntrepreneurEmail { get; set; }
        public string? Note { get; set; }
        public string Status { get; set; } = "pending";
        public List<string> DealModes { get; set; } = new();
        public string? DealMode { get; set; }
        public string? ConversationId { get; set; }
        public bool NdaRequired { get; set; }
        public bool NdaSigned { get; set; }
        public bool AccessGranted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class ExpressInterestRequest
    {
        public string? Note { get; set; }
        public string? DealMode { get; set; }
    }

    public class NdaStatusDto
    {
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;
        public string InterestId { get; set; } = string.Empty;
        public string InterestStatus { get; set; } = "pending";
        public bool NdaRequired { get; set; }
        public bool NdaSigned { get; set; }
        public DateTime? NdaSignedAt { get; set; }
        public string NdaVersion { get; set; } = "1.0";
        public bool AccessGranted { get; set; }
        public DateTime? AccessExpiresAt { get; set; }
    }

    public class SignNdaRequest
    {
        public string? ConfirmationText { get; set; }
    }

    public class PrivateMarketplaceProjectDto : MarketplaceProjectDto
    {
        // Core Identity & Strategy
        public string Concept { get; set; } = string.Empty;
        public string MarketGap { get; set; } = string.Empty;
        public string CreatorEdge { get; set; } = string.Empty;
        public string ExistingAlternatives { get; set; } = string.Empty;
        public string WhyNow { get; set; } = string.Empty;
        public string RiskiestAssumption { get; set; } = string.Empty;
        public string TargetMarket { get; set; } = string.Empty;
        public string Geography { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public string SourceMethod { get; set; } = string.Empty;

        // Sections
        public PrivateIntelligenceDto Intelligence { get; set; } = new();
        public PrivateBusinessPlanDto BusinessPlan { get; set; } = new();
        public PrivateFinancialForecastDto FinancialForecast { get; set; } = new();
        public PrivatePricingDto Pricing { get; set; } = new();
        public PrivateResourcePlanDto ResourcePlan { get; set; } = new();
        public PrivateGtmPlanDto GtmPlan { get; set; } = new();
        public PrivateBrandingDto Branding { get; set; } = new();
        public List<PrivateDocumentDto> Documents { get; set; } = new();
    }

    public class PrivateIntelligenceDto
    {
        public PrivateInvestorReadinessDto? InvestorReadiness { get; set; }
        public PrivateLegalChecklistDto? LegalChecklist { get; set; }
        public PrivateFormationDto? Formation { get; set; }
        public PrivateDiscoveryInputsDto? DiscoveryInputs { get; set; }
        public bool Available { get; set; }
    }

    public class PrivateInvestorReadinessDto
    {
        public double Total { get; set; }
        public string Label { get; set; } = string.Empty;
        public double ConceptClarity { get; set; }
        public double MarketEvidence { get; set; }
        public double FinancialModel { get; set; }
        public double LegalReadiness { get; set; }
        public double TeamCredibility { get; set; }
    }

    public class PrivateLegalChecklistDto
    {
        public int CompletedCount { get; set; }
        public int TotalCount { get; set; }
        public List<PrivateLegalItemDto> Items { get; set; } = new();
    }

    public class PrivateLegalItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Badge { get; set; }
        public string? SpSpecialty { get; set; }
    }

    public class PrivateFormationDto
    {
        public string RecommendedType { get; set; } = string.Empty;
        public string RecommendationReason { get; set; } = string.Empty;
        public string SelectedType { get; set; } = string.Empty;
        public List<PrivateFormationOptionDto> Options { get; set; } = new();
        public List<string> YouHave { get; set; } = new();
        public List<PrivateSkillGapDto> YouNeed { get; set; } = new();
        public PrivateCofounderDraftDto? CofounderDraft { get; set; }
    }

    public class PrivateFormationOptionDto
    {
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Capital { get; set; } = string.Empty;
        public string FormationTime { get; set; } = string.Empty;
        public string EstimatedCost { get; set; } = string.Empty;
    }

    public class PrivateSkillGapDto
    {
        public string Label { get; set; } = string.Empty;
        public string SpSpecialty { get; set; } = string.Empty;
    }

    public class PrivateCofounderDraftDto
    {
        public string RoleNeeded { get; set; } = string.Empty;
        public string EquityRange { get; set; } = string.Empty;
        public string LocationPreference { get; set; } = string.Empty;
    }

    public class PrivateDiscoveryInputsDto
    {
        public List<string> Sectors { get; set; } = new();
        public string ObservedProblem { get; set; } = string.Empty;
        public List<string> Strengths { get; set; } = new();
    }

    public class PrivateBusinessPlanDto
    {
        public string Summary { get; set; } = string.Empty;
        public string ExecutiveSummary { get; set; } = string.Empty;
        public string MarketOpportunity { get; set; } = string.Empty;
        public string CompetitiveAdvantage { get; set; } = string.Empty;
        public string RevenueModel { get; set; } = string.Empty;
        public bool Available { get; set; }

        // Complete Structured Sections
        public string? ValueProposition { get; set; }
        public List<string> Highlights { get; set; } = new();
        public List<string> TargetSegments { get; set; } = new();
        public string? MarketSizeQualitative { get; set; }
        public List<string> Trends { get; set; } = new();
        public List<PrivateCompetitorDto> Competitors { get; set; } = new();
        public List<PrivateRevenueStreamDto> RevenueStreams { get; set; } = new();
        public string? PricingStrategy { get; set; }
        public List<string> KeyMetrics { get; set; } = new();
        public string? GtmStrategy { get; set; }
        public List<string> GtmChannels { get; set; } = new();
        public List<PrivateGtmPhaseDto> GtmPhases { get; set; } = new();
        public List<string> KeyActivities { get; set; } = new();
        public List<string> Resources { get; set; } = new();
        public List<PrivateMilestoneDto> Milestones { get; set; } = new();
        public List<PrivateRiskDto> Risks { get; set; } = new();
    }

    public class PrivateCompetitorDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Positioning { get; set; }
        public List<string> Strengths { get; set; } = new();
        public List<string> Weaknesses { get; set; } = new();
        public string? OurAdvantage { get; set; }
    }

    public class PrivateRevenueStreamDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class PrivateGtmPhaseDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class PrivateMilestoneDto
    {
        public string Phase { get; set; } = string.Empty;
        public string Deliverable { get; set; } = string.Empty;
        public string Timeframe { get; set; } = string.Empty;
    }

    public class PrivateRiskDto
    {
        public string Category { get; set; } = string.Empty;
        public string Risk { get; set; } = string.Empty;
        public string Mitigation { get; set; } = string.Empty;
    }

    public class PrivateFinancialForecastDto
    {
        public double? Tam { get; set; }
        public double? ProjectedArr { get; set; }
        public double? MonthlyGrowthPct { get; set; }
        public int? BreakEvenMonth { get; set; }
        public decimal? BreakEvenRevenue { get; set; }
        public double? Arpu { get; set; }
        public double? EstimatedRunwayMonths { get; set; }
        public string Currency { get; set; } = "EUR";
        public bool Available { get; set; }

        public string? RevenueSummary { get; set; }
        public string? CostSummary { get; set; }
        public string? CashFlowSummary { get; set; }
        public string? BreakEvenSummary { get; set; }
        public string? BreakEvenNotes { get; set; }
        public List<string> Assumptions { get; set; } = new();
        public List<PrivateRiskDto> Risks { get; set; } = new();
        public string? AdvisoryNotice { get; set; }

        public List<PrivateMonthlyMetricDto> RevenueMonthly { get; set; } = new();
        public List<PrivateCostMetricDto> CostMonthly { get; set; } = new();
        public List<PrivateCashFlowMetricDto> CashFlowMonthly { get; set; } = new();
    }

    public class PrivateMonthlyMetricDto
    {
        public int Month { get; set; }
        public decimal Amount { get; set; }
        public string? Notes { get; set; }
    }

    public class PrivateCostMetricDto
    {
        public int Month { get; set; }
        public decimal FixedCosts { get; set; }
        public decimal VariableCosts { get; set; }
        public string? Notes { get; set; }
    }

    public class PrivateCashFlowMetricDto
    {
        public int Month { get; set; }
        public decimal NetCashFlow { get; set; }
        public decimal EndingBalance { get; set; }
        public string? Notes { get; set; }
    }

    public class PrivatePricingDto
    {
        public string PricingModel { get; set; } = string.Empty;
        public List<PrivatePricingTierDto> Tiers { get; set; } = new();
        public decimal? ForecastArpu { get; set; }
        public bool Available { get; set; }
    }

    public class PrivatePricingTierDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string BillingCycle { get; set; } = "monthly";
        public List<string> Features { get; set; } = new();
        public bool IsHighlighted { get; set; }
    }

    public class PrivateResourcePlanDto
    {
        public decimal? LaunchBudgetMin { get; set; }
        public decimal? LaunchBudgetMax { get; set; }
        public decimal? MonthlyRunningCost { get; set; }
        public int? TimeToLaunchWeeksMin { get; set; }
        public int? TimeToLaunchWeeksMax { get; set; }
        public List<string> TeamRolesNeeded { get; set; } = new();
        public List<PrivateTeamRequirementDto> TeamRequirements { get; set; } = new();
        public List<PrivateSaasItemDto> SaasStack { get; set; } = new();
        public PrivateBudgetBreakdownDto? BudgetBreakdown { get; set; }
        public bool Available { get; set; }
    }

    public class PrivateTeamRequirementDto
    {
        public string Role { get; set; } = string.Empty;
        public decimal Cost { get; set; }
        public int DurationMonths { get; set; }
        public bool OneTime { get; set; }
    }

    public class PrivateSaasItemDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal MonthlyCost { get; set; }
    }

    public class PrivateBudgetBreakdownDto
    {
        public double TeamPct { get; set; }
        public double ToolsPct { get; set; }
        public double LegalPct { get; set; }
        public double MiscPct { get; set; }
    }

    public class PrivateGtmPlanDto
    {
        public List<string> PrimaryChannels { get; set; } = new();
        public List<string> TargetAudiences { get; set; } = new();
        public List<string> WebPresenceAssets { get; set; } = new();
        public List<PrivateChannelMixDto> ChannelMix { get; set; } = new();
        public List<PrivateWebPresenceDto> WebPresence { get; set; } = new();
        public List<PrivateGtmWeekDto> BenchmarkGtmWeeks { get; set; } = new();
        public bool Available { get; set; }
    }

    public class PrivateChannelMixDto
    {
        public string Channel { get; set; } = string.Empty;
        public double Percent { get; set; }
    }

    public class PrivateWebPresenceDto
    {
        public string Id { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public bool Done { get; set; }
    }

    public class PrivateGtmWeekDto
    {
        public int Week { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<string> Tasks { get; set; } = new();
        public bool Completed { get; set; }
    }

    public class PrivateBrandingDto
    {
        public string? LogoAsset { get; set; }
        public string? LogoType { get; set; }
        public string? BrandingMethod { get; set; }
        public string? PaletteName { get; set; }
        public string? TypographyPairing { get; set; }
        public List<string> ColorPalette { get; set; } = new();
    }

    public class PrivateDocumentDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string MimeType { get; set; } = "application/octet-stream";
        public long SizeBytes { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool Downloadable { get; set; } = true;
    }

    // ======================= PHASE 3: CO-FOUNDER / EQUITY OFFER DTOS =======================

    public class EquityTermsDto
    {
        public double EquityPercentage { get; set; }
        public string CreatorRole { get; set; } = string.Empty;
        public decimal? CashComponent { get; set; }
        public bool VestingEnabled { get; set; }
        public int VestingMonths { get; set; }
        public int CliffMonths { get; set; }
        public List<string> Responsibilities { get; set; } = new();
        public string TimeCommitment { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateEquityOfferRequest
    {
        public double EquityPercentage { get; set; }
        public string CreatorRole { get; set; } = string.Empty;
        public decimal? CashComponent { get; set; }
        public bool VestingEnabled { get; set; }
        public int VestingMonths { get; set; } = 48;
        public int CliffMonths { get; set; } = 12;
        public List<string> Responsibilities { get; set; } = new();
        public string TimeCommitment { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }
        public string? Notes { get; set; }
    }

    public class CounterEquityOfferRequest
    {
        public double EquityPercentage { get; set; }
        public string CreatorRole { get; set; } = string.Empty;
        public decimal? CashComponent { get; set; }
        public bool VestingEnabled { get; set; }
        public int VestingMonths { get; set; }
        public int CliffMonths { get; set; }
        public List<string> Responsibilities { get; set; } = new();
        public string TimeCommitment { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }
        public string? Notes { get; set; }

        // Optional Full Buyout fields for unified counter handling
        public BuyoutTermsDto? BuyoutTerms { get; set; }
        public decimal? PurchasePrice { get; set; }
        public int? HandoverPeriodWeeks { get; set; }
        public int? TransitionSupportWeeks { get; set; }
        public List<string>? IncludedAssets { get; set; }
    }

    public class CounterBuyoutOfferRequest
    {
        public decimal PurchasePrice { get; set; }
        public int HandoverPeriodWeeks { get; set; } = 2;
        public int TransitionSupportWeeks { get; set; } = 4;
        public List<string>? IncludedAssets { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? Notes { get; set; }
    }

    public class BuyoutTermsDto
    {
        public decimal PurchasePrice { get; set; }
        public string Currency { get; set; } = "EUR";
        public int HandoverPeriodWeeks { get; set; } = 2;
        public int TransitionSupportWeeks { get; set; } = 4;
        public List<string> IncludedAssets { get; set; } = new();
        public DateTime? ExpiresAt { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateBuyoutOfferRequest
    {
        public decimal PurchasePrice { get; set; }
        public int HandoverPeriodWeeks { get; set; } = 2;
        public int TransitionSupportWeeks { get; set; } = 4;
        public List<string>? IncludedAssets { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? Notes { get; set; }
    }

    public class EquityOfferRevisionDto
    {
        public int RevisionNumber { get; set; }
        public string OfferedByRole { get; set; } = string.Empty;
        public string OfferedByUserId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public EquityTermsDto Terms { get; set; } = new();
        public BuyoutTermsDto? BuyoutTerms { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    public class EquityDealDto
    {
        public string Id { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string DealType { get; set; } = "EQUITY_PARTNERSHIP";
        public string DealStage { get; set; } = "OFFER_NEGOTIATION";
        public string Status { get; set; } = "initiated";
        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string EntrepreneurId { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;
        public string ConversationId { get; set; } = string.Empty;
        public string CurrentTurn { get; set; } = string.Empty;
        public int CurrentRevisionNumber { get; set; }
        public int? AcceptedRevisionNumber { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public EquityTermsDto ActiveTerms { get; set; } = new();
        public BuyoutTermsDto? BuyoutTerms { get; set; }
        public List<EquityOfferRevisionDto> Revisions { get; set; } = new();
        public RoleResponsibilityAgreementDto? RoleAgreement { get; set; }
        public DealCapTableDraftDto? CapTableDraft { get; set; }
        public LegalReviewPackageDto? LegalPackage { get; set; }
        public BuyoutLegalPackageDto? BuyoutLegalPackage { get; set; }
        public BuyoutAssetTransferManifestDto? BuyoutAssetManifest { get; set; }
        public BuyoutSigningPackageDto? BuyoutSigningPackage { get; set; }
        public BuyoutClosingDto? BuyoutClosing { get; set; }
        public BuyoutHandoverDto? BuyoutHandover { get; set; }
        public BuyoutSaleRecordDto? BuyoutSaleRecord { get; set; }
        public AgreementSigningPackageDto? SigningPackage { get; set; }
        public PartnershipActivationDto? Activation { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // ============ PHASE 4: ROLE & RESPONSIBILITY DTOS ============
    public class RoleResponsibilityAgreementDto
    {
        public string Id { get; set; } = string.Empty;
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string EntrepreneurId { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;

        public string CreatorRole { get; set; } = string.Empty;
        public string EntrepreneurRole { get; set; } = string.Empty;

        public List<string> CreatorResponsibilities { get; set; } = new();
        public List<string> EntrepreneurResponsibilities { get; set; } = new();

        public string CreatorTimeCommitment { get; set; } = string.Empty;
        public string EntrepreneurTimeCommitment { get; set; } = string.Empty;

        public string CreatorCommitmentType { get; set; } = "HOURS_PER_WEEK";
        public double? CreatorCommitmentValue { get; set; }

        public string EntrepreneurCommitmentType { get; set; } = "FULL_TIME";
        public double? EntrepreneurCommitmentValue { get; set; }

        public DateTime? CreatorConfirmedAt { get; set; }
        public DateTime? EntrepreneurConfirmedAt { get; set; }

        public int CreatorConfirmedVersion { get; set; }
        public int EntrepreneurConfirmedVersion { get; set; }

        public string Status { get; set; } = "DRAFT";
        public int Version { get; set; } = 1;
        public string? LastEditedByRole { get; set; }
        public string? Notes { get; set; }

        public DealCommercialSummaryDto CommercialTerms { get; set; } = new();

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class DealCommercialSummaryDto
    {
        public double EquityPercentage { get; set; }
        public string CreatorRole { get; set; } = string.Empty;
        public decimal? CashComponent { get; set; }
        public bool VestingEnabled { get; set; }
        public int VestingMonths { get; set; }
        public int CliffMonths { get; set; }
        public int AcceptedRevisionNumber { get; set; }
    }

    public class UpdateRoleAgreementRequest
    {
        public string? CreatorRole { get; set; }
        public string? EntrepreneurRole { get; set; }
        public List<string>? CreatorResponsibilities { get; set; }
        public List<string>? EntrepreneurResponsibilities { get; set; }
        public string? CreatorTimeCommitment { get; set; }
        public string? EntrepreneurTimeCommitment { get; set; }
        public string? CreatorCommitmentType { get; set; }
        public double? CreatorCommitmentValue { get; set; }
        public string? EntrepreneurCommitmentType { get; set; }
        public double? EntrepreneurCommitmentValue { get; set; }
        public string? Notes { get; set; }
    }

    public class RequestRoleChangesRequest
    {
        public string? Feedback { get; set; }
    }

    // ======================= PHASE 5: EQUITY & OWNERSHIP CAP TABLE DTOS =======================

    public class DealCapTableDraftDto
    {
        public string Id { get; set; } = string.Empty;
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;

        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string EntrepreneurId { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;

        public int TotalShares { get; set; } = 10_000_000;
        public List<DealCapTableEntryDto> Entries { get; set; } = new();
        public double EsopPoolPercent { get; set; }
        public double InvestorReservePercent { get; set; }
        public int EsopVestingMonths { get; set; } = 48;

        public double TotalAllocatedPercent { get; set; }
        public bool IsFullyAllocated { get; set; } // TotalAllocatedPercent == 100

        public DateTime? CreatorConfirmedAt { get; set; }
        public DateTime? EntrepreneurConfirmedAt { get; set; }
        public int CreatorConfirmedVersion { get; set; }
        public int EntrepreneurConfirmedVersion { get; set; }

        public string Status { get; set; } = "AWAITING_CONFIRMATION";
        public int Version { get; set; } = 1;
        public string? LastEditedByRole { get; set; }
        public string? Notes { get; set; }

        public DealCommercialSummaryDto CommercialTerms { get; set; } = new();
        public CapTableCompanyContextDto CompanyContext { get; set; } = new();

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class DealCapTableEntryDto
    {
        public string Id { get; set; } = string.Empty;
        public string? UserId { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string RoleTitle { get; set; } = string.Empty;
        public string StakeholderType { get; set; } = "founder";
        public string ShareClass { get; set; } = "common";
        public bool HasVotingRights { get; set; } = true;
        public double EquityPercent { get; set; }
        public int SharesGranted { get; set; }
        public int VestingMonths { get; set; }
        public int CliffMonths { get; set; }
        public bool IsCreator { get; set; }
        public bool IsFounder { get; set; }
        public bool IsEsop { get; set; }
        public bool IsInvestorReserve { get; set; }
        public bool IsLocked { get; set; }
    }

    public class CapTableCompanyContextDto
    {
        public bool HasExistingCompany { get; set; }
        public string? CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string? IncorporationStatus { get; set; } // "INCORPORATED" | "NOT_INCORPORATED"
    }

    public class UpdateCapTableDraftRequest
    {
        public int TotalShares { get; set; } = 10_000_000;
        public List<DealCapTableEntryDto> Entries { get; set; } = new();
        public double EsopPoolPercent { get; set; }
        public double InvestorReservePercent { get; set; }
        public int EsopVestingMonths { get; set; } = 48;
        public string? Notes { get; set; }
    }

    public class RequestCapTableChangesRequest
    {
        public string? Feedback { get; set; }
    }

    // ============ PHASE 6: LEGAL & SHAREHOLDER REVIEW DTOS ============

    public class LegalReviewPackageDto
    {
        public string Id { get; set; } = string.Empty;
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;

        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string EntrepreneurId { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;

        public string? Jurisdiction { get; set; }
        public string CompanyContext { get; set; } = "CASE_A_PRE_INCORPORATION";
        public string? CompanyId { get; set; }
        public string? CompanyName { get; set; }

        public List<LegalDocumentDto> Documents { get; set; } = new();

        public string? AssignedLegalProviderId { get; set; }
        public string? AssignedLegalProviderName { get; set; }
        public string ProviderReviewStatus { get; set; } = "NOT_ASSIGNED";
        public int ProviderReviewedVersion { get; set; }
        public DateTime? ProviderReviewedAt { get; set; }
        public string? ProviderReviewNotes { get; set; }

        public int CreatorApprovedVersion { get; set; }
        public int EntrepreneurApprovedVersion { get; set; }
        public DateTime? CreatorApprovedAt { get; set; }
        public DateTime? EntrepreneurApprovedAt { get; set; }

        public int AcceptedOfferRevisionNumber { get; set; }
        public int RoleAgreementVersion { get; set; }
        public int CapTableVersion { get; set; }

        public string Status { get; set; } = "AWAITING_REVIEW";
        public int Version { get; set; } = 1;

        public string? LastEditedByRole { get; set; }
        public string? Notes { get; set; }

        public DealCommercialSummaryDto CommercialTerms { get; set; } = new();

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class LegalDocumentDto
    {
        public string Id { get; set; } = string.Empty;
        public string DocumentType { get; set; } = "COFOUNDER_AGREEMENT";
        public string Title { get; set; } = string.Empty;
        public string RequirementType { get; set; } = "REQUIRED";
        public string ContentMarkdown { get; set; } = string.Empty;
        public string ContentHash { get; set; } = string.Empty;
        public int Version { get; set; } = 1;
        public string Status { get; set; } = "DRAFT";
        public DateTime LastUpdated { get; set; }
    }

    public class InviteLegalProviderRequest
    {
        public string ProviderId { get; set; } = string.Empty;
        public string? InvitationNotes { get; set; }
    }

    public class ProviderLegalReviewRequest
    {
        /// <summary>
        /// "IN_REVIEW" | "CHANGES_REQUESTED" | "REVIEW_COMPLETE"
        /// </summary>
        public string ReviewStatus { get; set; } = "REVIEW_COMPLETE";
        public string? Notes { get; set; }
        public string? RequestedChangesFeedback { get; set; }
    }

    public class RequestLegalChangesRequest
    {
        public string? DocumentId { get; set; }
        public string Feedback { get; set; } = string.Empty;
    }

    public class SetJurisdictionRequest
    {
        public string Jurisdiction { get; set; } = string.Empty;
    }

    public class ExplainLegalDocumentResponse
    {
        public string DocumentId { get; set; } = string.Empty;
        public string DocumentTitle { get; set; } = string.Empty;
        public string ExplanationMarkdown { get; set; } = string.Empty;
        public List<string> KeyTakeaways { get; set; } = new();
        public string Disclaimer { get; set; } = "AI-generated explanation — not legal advice. A verified human Legal Service Provider review is required.";
    }

    // ============ PHASE 7: AGREEMENT SIGNING DTOS ============
    public class AgreementSigningPackageDto
    {
        public string Id { get; set; } = string.Empty;
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string EntrepreneurId { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;

        public string LegalPackageId { get; set; } = string.Empty;
        public int LegalPackageVersion { get; set; }

        public int AcceptedOfferRevisionNumber { get; set; }
        public int RoleAgreementVersion { get; set; }
        public int CapTableVersion { get; set; }

        public string? Jurisdiction { get; set; }
        public string CompanyContext { get; set; } = "CASE_A_PRE_INCORPORATION";
        public string? CompanyId { get; set; }
        public string? CompanyName { get; set; }

        public List<SigningDocumentRefDto> Documents { get; set; } = new();

        public string ManifestHash { get; set; } = string.Empty;

        public PartySignatureDto? CreatorSignature { get; set; }
        public PartySignatureDto? EntrepreneurSignature { get; set; }

        public string Status { get; set; } = "PENDING_SIGNATURES";
        public int Version { get; set; } = 1;

        public DealCommercialSummaryDto CommercialTerms { get; set; } = new();
        public string? AssignedLegalProviderName { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? FinalizedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class SigningDocumentRefDto
    {
        public string DocumentId { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string RequirementType { get; set; } = "REQUIRED";
        public int DocumentVersion { get; set; } = 1;
        public string DocumentHash { get; set; } = string.Empty;
        public string ContentMarkdown { get; set; } = string.Empty;
    }

    public class PartySignatureDto
    {
        public string SignerUserId { get; set; } = string.Empty;
        public string SignerName { get; set; } = string.Empty;
        public string SignerRole { get; set; } = string.Empty;
        public string ManifestHash { get; set; } = string.Empty;
        public int LegalPackageVersion { get; set; }
        public DateTime SignedAt { get; set; }
        public string SignatureHash { get; set; } = string.Empty;
        public string ConsentStatement { get; set; } = string.Empty;
    }

    public class SignAgreementRequest
    {
        public string ManifestHash { get; set; } = string.Empty;
        public int LegalPackageVersion { get; set; }
        public string? ConsentStatement { get; set; }
    }

    public class RequestSigningLegalChangeRequest
    {
        public string? DocumentId { get; set; }
        public string Feedback { get; set; } = string.Empty;
    }

    public class FinalAgreementPackageDto
    {
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string ManifestHash { get; set; } = string.Empty;
        public int LegalPackageVersion { get; set; }
        public List<SigningDocumentRefDto> Documents { get; set; } = new();
        public PartySignatureDto? CreatorSignature { get; set; }
        public PartySignatureDto? EntrepreneurSignature { get; set; }
        public DateTime FinalizedAt { get; set; }
        public string AuditReference { get; set; } = string.Empty;
        public string Status { get; set; } = "AGREEMENT_SIGNED";
    }

    // ============ PHASE 8: COMPANY & PROJECT ACTIVATION DTOS ============

    public class PartnershipActivationDto
    {
        public string Id { get; set; } = string.Empty;
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string EntrepreneurId { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;
        public string? CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string CompanyCase { get; set; } = "CASE_A_PRE_INCORPORATION";
        public string Status { get; set; } = "ACTIVATION_PENDING";
        public string SignedManifestHash { get; set; } = string.Empty;
        public int AppliedLegalPackageVersion { get; set; }
        public int AppliedOfferRevisionNumber { get; set; }
        public int AppliedRoleAgreementVersion { get; set; }
        public int AppliedCapTableVersion { get; set; }
        public string? CreatorShareholderId { get; set; }
        public string? EntrepreneurShareholderId { get; set; }
        public string CorporateFilingStatus { get; set; } = "NOT_REQUIRED";
        public string? CorporateFilingNotes { get; set; }
        public bool CanActivate { get; set; }
        public List<string> Blockers { get; set; } = new();
        public List<ActivatedDocumentRefDto> LinkedDocuments { get; set; } = new();
        public OwnershipComparisonDto OwnershipComparison { get; set; } = new();
        public DealCommercialSummaryDto CommercialTerms { get; set; } = new();
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int Version { get; set; } = 1;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class ActivatedDocumentRefDto
    {
        public string DocumentId { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int Version { get; set; }
        public string DocumentHash { get; set; } = string.Empty;
        public DateTime LinkedAt { get; set; }
    }

    public class OwnershipComparisonDto
    {
        public List<OwnershipEntryComparisonDto> Entries { get; set; } = new();
        public double EsopPoolPercent { get; set; }
        public double InvestorReservePercent { get; set; }
        public int TotalShares { get; set; } = 10_000_000;
        public string Notice { get; set; } = "Platform ownership record";
    }

    public class OwnershipEntryComparisonDto
    {
        public string UserId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string RoleTitle { get; set; } = string.Empty;
        public string Type { get; set; } = "founder";
        public double PreviousEquityPercent { get; set; }
        public double SignedEquityPercent { get; set; }
        public int PreviousShares { get; set; }
        public int SignedShares { get; set; }
        public int VestingMonths { get; set; }
        public int CliffMonths { get; set; }
        public bool IsCreator { get; set; }
        public bool IsFounder { get; set; }
    }

    public class StartActivationRequest
    {
        public string? CompanyName { get; set; }
    }

    public class CompleteActivationRequest
    {
        public string? Notes { get; set; }
    }

    public class UpdateCorporateFilingRequest
    {
        public string FilingStatus { get; set; } = "FILING_COMPLETE"; // EXTERNAL_FILING_PENDING | FILING_COMPLETE
        public string? Notes { get; set; }
    }

    // ============ PHASE 9: PARTNERSHIP ACTIVE & MY EQUITY DTOS ============

    public class PartnershipSummaryDto
    {
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string? CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string CreatorRole { get; set; } = string.Empty;
        public double CreatorEquityPercent { get; set; }
        public int CreatorShares { get; set; }
        public string EntrepreneurId { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;
        public string EntrepreneurRole { get; set; } = "Founder & CEO";
        public double EntrepreneurEquityPercent { get; set; }
        public int EntrepreneurShares { get; set; }
        public int TotalShares { get; set; } = 10_000_000;
        public string DealStage { get; set; } = "PARTNERSHIP_ACTIVE";
        public string OutcomeBadge { get; set; } = "CO-FOUNDED";
        public DateTime? ActivatedAt { get; set; }
        public string Status { get; set; } = "active";
    }

    public class PartnershipEquityDetailsDto
    {
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string? CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string LegalStructure { get; set; } = string.Empty;
        public string Jurisdiction { get; set; } = string.Empty;
        public int TotalShares { get; set; } = 10_000_000;
        public double CurrentOwnershipPercent { get; set; }
        public int SharesOwned { get; set; }
        public string ShareClass { get; set; } = "Common";
        public string VotingRights { get; set; } = "Standard 1 vote per share";
        public bool VestingEnabled { get; set; }
        public int VestingMonths { get; set; }
        public int CliffMonths { get; set; }
        public DateTime? VestingStartDate { get; set; }
        public double VestedPercent { get; set; }
        public int VestedShares { get; set; }
        public double UnvestedPercent { get; set; }
        public int UnvestedShares { get; set; }
        public string VestingStatusNotice { get; set; } = string.Empty;
        public string ShareholderStatus { get; set; } = "Active Shareholder";
        public string CapTableIntegrityStatus { get; set; } = "VALID"; // VALID | OWNERSHIP_RECONCILIATION_REQUIRED
        public List<ActivatedDocumentRefDto> CompanyDocuments { get; set; } = new();
    }

    public class PartnershipMilestoneDto
    {
        public string Id { get; set; } = string.Empty;
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string? CompanyId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = "NOT_STARTED";
        public string CreatedByUserId { get; set; } = string.Empty;
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class CreatePartnershipMilestoneRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
    }

    public class UpdatePartnershipMilestoneRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Status { get; set; } // NOT_STARTED | IN_PROGRESS | COMPLETED
    }

    public class PartnershipActiveDetailsDto
    {
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string OutcomeBadge { get; set; } = "CO-FOUNDED";
        public string Status { get; set; } = "PARTNERSHIP_ACTIVE";
        public DateTime? ActivatedAt { get; set; }

        public PartnerSummaryDto Creator { get; set; } = new();
        public PartnerSummaryDto Entrepreneur { get; set; } = new();
        public PartnershipCompanySummaryDto Company { get; set; } = new();
        public PartnershipEquityDetailsDto Equity { get; set; } = new();
        public PartnershipRoleSummaryDto CreatorRoleDetails { get; set; } = new();
        public PartnershipRoleSummaryDto EntrepreneurRoleDetails { get; set; } = new();
        public List<ActivatedDocumentRefDto> Documents { get; set; } = new();
        public List<PartnershipMilestoneDto> Milestones { get; set; } = new();
        public string ConversationId { get; set; } = string.Empty;
        public string WorkspaceUrl { get; set; } = string.Empty;
        public string CapTableIntegrityStatus { get; set; } = "VALID";
    }

    public class PartnerSummaryDto
    {
        public string UserId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string RoleTitle { get; set; } = string.Empty;
        public double EquityPercent { get; set; }
        public int Shares { get; set; }
        public bool IsCreator { get; set; }
    }

    public class PartnershipCompanySummaryDto
    {
        public string? CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string LegalStructure { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Jurisdiction { get; set; } = string.Empty;
        public string CompanyStatus { get; set; } = "Active";
        public string CorporateFilingStatus { get; set; } = "NOT_REQUIRED";
        public string? RegistrationNumber { get; set; }
        public int TotalShares { get; set; } = 10_000_000;
        public double EsopPoolPercent { get; set; }
        public double InvestorReservePercent { get; set; }
    }

    public class PartnershipRoleSummaryDto
    {
        public string RoleTitle { get; set; } = string.Empty;
        public List<string> Responsibilities { get; set; } = new();
        public string TimeCommitment { get; set; } = string.Empty;
    }

    // ============ FULL BUYOUT PHASE 3: LEGAL & ASSET TRANSFER DTOS ============

    public class BuyoutLegalPackageDto
    {
        public string Id { get; set; } = string.Empty;
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string EntrepreneurId { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;

        public decimal PurchasePrice { get; set; }
        public string Currency { get; set; } = "EUR";
        public int HandoverPeriodWeeks { get; set; }
        public int TransitionSupportWeeks { get; set; }
        public List<string> IncludedAssets { get; set; } = new();

        public string? Jurisdiction { get; set; }
        public List<BuyoutLegalDocumentDto> Documents { get; set; } = new();
        public BuyoutAssetTransferManifestDto? AssetManifest { get; set; }

        public string? AssignedLegalProviderId { get; set; }
        public string? AssignedLegalProviderName { get; set; }
        public string ProviderReviewStatus { get; set; } = "NOT_ASSIGNED";
        public DateTime? ProviderReviewedAt { get; set; }
        public string? ProviderReviewNotes { get; set; }
        public int ProviderReviewedVersion { get; set; }

        public int CreatorApprovedVersion { get; set; }
        public int EntrepreneurApprovedVersion { get; set; }
        public DateTime? CreatorApprovedAt { get; set; }
        public DateTime? EntrepreneurApprovedAt { get; set; }

        public int AcceptedBuyoutRevisionNumber { get; set; }
        public int AssetManifestVersion { get; set; }

        public string Status { get; set; } = "AWAITING_REVIEW";
        public int Version { get; set; } = 1;
        public string? Notes { get; set; }
        public List<string> Blockers { get; set; } = new();

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class BuyoutLegalDocumentDto
    {
        public string Id { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string RequirementType { get; set; } = "REQUIRED";
        public string ContentMarkdown { get; set; } = string.Empty;
        public string ContentHash { get; set; } = string.Empty;
        public int Version { get; set; } = 1;
        public string Status { get; set; } = "DRAFT";
        public DateTime LastUpdated { get; set; }
    }

    public class BuyoutAssetTransferManifestDto
    {
        public string Id { get; set; } = string.Empty;
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public int AcceptedRevisionNumber { get; set; }
        public decimal PurchasePrice { get; set; }
        public string Currency { get; set; } = "EUR";
        public int HandoverPeriodWeeks { get; set; }
        public int TransitionSupportWeeks { get; set; }
        public List<BuyoutAssetEntryDto> Assets { get; set; } = new();
        public int Version { get; set; } = 1;
        public string ManifestHash { get; set; } = string.Empty;
        public List<string> Blockers { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class BuyoutAssetEntryDto
    {
        public string AssetType { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public bool TransferRequired { get; set; } = true;
        public string AvailabilityStatus { get; set; } = "AVAILABLE_IN_PLATFORM";
        public string? SourceReference { get; set; }
        public string? DocumentId { get; set; }
        public string? FileReference { get; set; }
        public bool ExternalTransferRequired { get; set; }
        public string? Notes { get; set; }
    }

    public class InviteBuyoutLegalProviderRequest
    {
        public string ProviderId { get; set; } = string.Empty;
    }

    public class ReviewBuyoutLegalPackageRequest
    {
        public string Status { get; set; } = "REVIEW_COMPLETE"; // REVIEW_COMPLETE | CHANGES_REQUESTED
        public string? Notes { get; set; }
    }

    public class RequestBuyoutLegalChangesRequest
    {
        public string DocumentId { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
    }

    public class ReviseBuyoutDocumentRequest
    {
        public string ContentMarkdown { get; set; } = string.Empty;
    }

    public class ApproveBuyoutLegalPackageRequest
    {
        public int LegalPackageVersion { get; set; }
    }

    public class ExplainBuyoutLegalDocumentResponse
    {
        public string DocumentId { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
        public string Explanation { get; set; } = string.Empty;
        public string Disclaimer { get; set; } = "AI-generated explanation — not legal advice.";
    }

    // ============ FULL BUYOUT PHASE 4: FINAL TRANSFER AGREEMENT SIGNING DTOS ============

    public class BuyoutSigningPackageDto
    {
        public string Id { get; set; } = string.Empty;
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string DealType { get; set; } = "FULL_BUYOUT";

        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string EntrepreneurId { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;

        public int AcceptedBuyoutRevisionNumber { get; set; }
        public string BuyoutLegalPackageId { get; set; } = string.Empty;
        public int BuyoutLegalPackageVersion { get; set; }

        public int AssetManifestVersion { get; set; }
        public string AssetManifestHash { get; set; } = string.Empty;

        public decimal PurchasePrice { get; set; }
        public string Currency { get; set; } = "EUR";
        public int HandoverPeriodWeeks { get; set; }
        public int TransitionSupportWeeks { get; set; }
        public List<string> IncludedAssets { get; set; } = new();

        public List<SigningDocumentRefDto> Documents { get; set; } = new();
        public BuyoutAssetTransferManifestDto? AssetManifest { get; set; }

        public string ManifestHash { get; set; } = string.Empty;

        public PartySignatureDto? CreatorSignature { get; set; }
        public PartySignatureDto? EntrepreneurSignature { get; set; }

        public string? AssignedLegalProviderName { get; set; }

        public string Status { get; set; } = "PENDING_SIGNATURES";
        public int Version { get; set; } = 1;
        public DateTime CreatedAt { get; set; }
        public DateTime? FinalizedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? AuditReference { get; set; }
    }

    public class SignBuyoutAgreementRequest
    {
        public string ManifestHash { get; set; } = string.Empty;
        public int ExpectedLegalPackageVersion { get; set; }
        public string? ConsentStatement { get; set; }
    }

    public class RequestBuyoutSigningLegalChangeRequest
    {
        public string Feedback { get; set; } = string.Empty;
        public string RequestedChangeType { get; set; } = "LEGAL_WORDING"; // LEGAL_WORDING | COMMERCIAL_TERMS
    }

    public class FinalBuyoutSignedPackageDto
    {
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public int AcceptedBuyoutRevisionNumber { get; set; }
        public decimal PurchasePrice { get; set; }
        public string Currency { get; set; } = "EUR";
        public int HandoverPeriodWeeks { get; set; }
        public int TransitionSupportWeeks { get; set; }
        public int AssetManifestVersion { get; set; }
        public string AssetManifestHash { get; set; } = string.Empty;
        public int LegalPackageVersion { get; set; }
        public string ManifestHash { get; set; } = string.Empty;
        public List<SigningDocumentRefDto> Documents { get; set; } = new();
        public PartySignatureDto? CreatorSignature { get; set; }
        public PartySignatureDto? EntrepreneurSignature { get; set; }
        public DateTime FinalizedAt { get; set; }
        public string AuditReference { get; set; } = string.Empty;
        public string Status { get; set; } = "AGREEMENT_SIGNED";
    }

    // ============ FULL BUYOUT PHASE 5: CLOSING & PAYMENT CONFIRMATION DTOS ============

    public class BuyoutClosingDto
    {
        public string Id { get; set; } = string.Empty;
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string DealType { get; set; } = "FULL_BUYOUT";
        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string EntrepreneurId { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;

        public int AcceptedRevisionNumber { get; set; }
        public string SigningPackageId { get; set; } = string.Empty;
        public string ManifestHash { get; set; } = string.Empty;

        public decimal PurchasePrice { get; set; }
        public string Currency { get; set; } = "EUR";

        public string PaymentMethod { get; set; } = "BANK_TRANSFER";
        public string PaymentStatus { get; set; } = "NOT_STARTED";

        public string? PaymentReference { get; set; }
        public decimal? PaymentAmount { get; set; }
        public string? PaymentCurrency { get; set; }
        public DateTime? PaidAt { get; set; }

        public DateTime? BuyerConfirmedAt { get; set; }
        public DateTime? CreatorConfirmedAt { get; set; }
        public DateTime? ProviderConfirmedAt { get; set; }

        public List<BuyoutPaymentEvidenceEntryDto> Evidence { get; set; } = new();

        public string ClosingStatus { get; set; } = "PENDING";
        public bool CanProceedToHandover { get; set; }
        public List<string> Blockers { get; set; } = new();

        public string? DisputeReason { get; set; }
        public DateTime? DisputedAt { get; set; }
        public string? DisputedByUserId { get; set; }

        public int Version { get; set; } = 1;

        public DateTime StartedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? PaymentCompletedAt { get; set; }
        public DateTime? ReadyForHandoverAt { get; set; }
    }

    public class BuyoutPaymentEvidenceEntryDto
    {
        public string Id { get; set; } = string.Empty;
        public string DocumentReference { get; set; } = string.Empty;
        public string DocumentName { get; set; } = string.Empty;
        public string UploadedByUserId { get; set; } = string.Empty;
        public string UploadedByRole { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public string? ContentHash { get; set; }
        public decimal? StatedAmount { get; set; }
        public string? StatedCurrency { get; set; }
        public string? Notes { get; set; }
    }

    public class SubmitBuyoutPaymentRequest
    {
        public string PaymentMethod { get; set; } = "BANK_TRANSFER"; // BANK_TRANSFER | PAYMENT_PROVIDER | ESCROW | OTHER
        public string PaymentReference { get; set; } = string.Empty;
        public decimal? PaymentAmount { get; set; }
        public string? PaymentCurrency { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? DocumentReference { get; set; }
        public string? DocumentName { get; set; }
        public string? Notes { get; set; }
        public int ExpectedVersion { get; set; } = 0;
    }

    public class ConfirmBuyoutPaymentRequest
    {
        public string? Notes { get; set; }
        public int ExpectedVersion { get; set; } = 0;
    }

    public class DisputeBuyoutPaymentRequest
    {
        public string DisputeReason { get; set; } = string.Empty;
        public int ExpectedVersion { get; set; } = 0;
    }

    // ============ FULL BUYOUT PHASE 6: ASSET HANDOVER & FINAL SALE DTOS ============

    public class BuyoutHandoverDto
    {
        public string Id { get; set; } = string.Empty;
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string DealType { get; set; } = "FULL_BUYOUT";
        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string EntrepreneurId { get; set; } = string.Empty;
        public string EntrepreneurName { get; set; } = string.Empty;

        public int AcceptedRevisionNumber { get; set; }
        public int AssetManifestVersion { get; set; }
        public string AssetManifestHash { get; set; } = string.Empty;
        public string SigningPackageId { get; set; } = string.Empty;
        public string ManifestHash { get; set; } = string.Empty;
        public string ClosingId { get; set; } = string.Empty;

        public decimal PurchasePrice { get; set; }
        public string Currency { get; set; } = "EUR";
        public int HandoverPeriodWeeks { get; set; }
        public int TransitionSupportWeeks { get; set; }

        public List<BuyoutHandoverAssetDto> Assets { get; set; } = new();

        public string Status { get; set; } = "NOT_STARTED";
        public bool CanCompleteSale { get; set; }
        public List<string> Blockers { get; set; } = new();

        public DateTime? SellerConfirmedAt { get; set; }
        public DateTime? BuyerConfirmedAt { get; set; }

        public int Version { get; set; } = 1;
        public DateTime StartedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class BuyoutHandoverAssetDto
    {
        public string Id { get; set; } = string.Empty;
        public string AssetId { get; set; } = string.Empty;
        public string AssetType { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string DeliveryType { get; set; } = "AVAILABLE_IN_PLATFORM";
        public bool IsRequired { get; set; } = true;
        public string Status { get; set; } = "PENDING";

        public string? SourceReference { get; set; }
        public string? DeliveryReference { get; set; }
        public string? DeliveryInstructions { get; set; }

        public DateTime? SellerDeliveredAt { get; set; }
        public string? SellerDeliveredByUserId { get; set; }

        public DateTime? BuyerVerifiedAt { get; set; }
        public string? BuyerVerifiedByUserId { get; set; }

        public string? SellerNotes { get; set; }
        public string? BuyerNotes { get; set; }
        public string? IssueReason { get; set; }
        public DateTime? IssueReportedAt { get; set; }

        public List<BuyoutPaymentEvidenceEntryDto> Evidence { get; set; } = new();
        public int Version { get; set; } = 1;
    }

    public class BuyoutSaleRecordDto
    {
        public string Id { get; set; } = string.Empty;
        public string DealId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;

        public string SellerUserId { get; set; } = string.Empty;
        public string SellerName { get; set; } = string.Empty;
        public string BuyerUserId { get; set; } = string.Empty;
        public string BuyerName { get; set; } = string.Empty;

        public decimal PurchasePrice { get; set; }
        public string Currency { get; set; } = "EUR";

        public int AcceptedRevisionNumber { get; set; }
        public string SigningPackageId { get; set; } = string.Empty;
        public string ManifestHash { get; set; } = string.Empty;
        public int AssetManifestVersion { get; set; }
        public string ClosingId { get; set; } = string.Empty;
        public string HandoverId { get; set; } = string.Empty;

        public DateTime SoldAt { get; set; }
        public List<string> TransferredAssets { get; set; } = new();
        public string Status { get; set; } = "SOLD";
        public string AuditReference { get; set; } = string.Empty;
    }

    public class DeliverBuyoutAssetRequest
    {
        public string? DeliveryReference { get; set; }
        public string? Notes { get; set; }
        public string? DocumentReference { get; set; }
        public string? DocumentName { get; set; }
        public int ExpectedVersion { get; set; } = 0;
    }

    public class VerifyBuyoutAssetRequest
    {
        public string? Notes { get; set; }
        public int ExpectedVersion { get; set; } = 0;
    }

    public class ReportBuyoutAssetIssueRequest
    {
        public string IssueReason { get; set; } = string.Empty;
        public int ExpectedVersion { get; set; } = 0;
    }

    public class ConfirmBuyoutHandoverRequest
    {
        public string? Notes { get; set; }
        public int ExpectedVersion { get; set; } = 0;
    }

    public class CompleteBuyoutSaleRequest
    {
        public string? Notes { get; set; }
        public int ExpectedVersion { get; set; } = 0;
    }

    public class EntrepreneurProjectConnectionDto
    {
        public string IdeaId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string? ProjectLogoUrl { get; set; }
        public string? ProjectSummary { get; set; }
        public string? ProblemStatement { get; set; }
        public string? TargetAudience { get; set; }
        public string? Sector { get; set; }
        public int ClarityScore { get; set; }

        public string CreatorId { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public string? CreatorAvatarUrl { get; set; }

        public string? InterestId { get; set; }
        public string? InterestStatus { get; set; }
        public string? SelectedDealMode { get; set; }

        public bool NdaRequired { get; set; }
        public string? NdaStatus { get; set; }

        public string? DealExecutionId { get; set; }
        public string? DealType { get; set; }
        public string? DealStage { get; set; }
        public string? DealStatus { get; set; }

        public string DisplayStatus { get; set; } = "Interest Pending";
        public string Category { get; set; } = "Pending";
        public string? ProjectOutcome { get; set; }

        public DateTime? LastActivityAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

