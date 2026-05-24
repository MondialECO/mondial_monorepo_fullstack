namespace WebApp.Models.Dtos;

// ============ PHASE 1: IDENTITY & ONBOARDING ============

public class CreateCompanyDto
{
    public string CompanyName { get; set; }
    public string Industry { get; set; }
    public string Website { get; set; }
    public string Tagline { get; set; }
}

// ============ PHASE 2: LEGAL INFO & DOCUMENTS ============

public class UpdateLegalInfoRequest
{
    public string LegalName { get; set; }
    public string RegistrationNumber { get; set; } // SIRET
    public string LegalStructure { get; set; }
    public string IncorporationDate { get; set; }
    public string RegisteredAddress { get; set; }
    public string Country { get; set; }
    public string NafCode { get; set; }
}

public class UpdateBeneficialOwnersRequest
{
    public List<BeneficialOwnerDto> Owners { get; set; }
}

public class BeneficialOwnerDto
{
    // Canonical required fields shared by frontend and backend.
    public string FullName { get; set; }
    public string Email { get; set; }
    public double OwnershipPercent { get; set; }

    // Optional metadata.
    public string Role { get; set; }
    public string Nationality { get; set; }
}

public class DocumentUploadRequest
{
    // Multipart form upload. `File` carries the actual upload stream;
    // `DocumentType` is the document category (kbis, rib, tax_cert, articles, license, insurance, etc).
    public Microsoft.AspNetCore.Http.IFormFile File { get; set; }
    public string DocumentType { get; set; }
}

public class DocumentStatusResponse
{
    public string DocumentId { get; set; }
    public string Type { get; set; }
    public string FileName { get; set; }
    public string Status { get; set; } // pending, approved, rejected
    public DateTime UploadedAt { get; set; }
    public string ReviewNote { get; set; }
    public string StoragePath { get; set; }
    public long FileSize { get; set; }
}

// ============ PHASE 3: FINANCIAL ============

public class SaveRevenueDataRequest
{
    public double Q1Revenue { get; set; }
    public double Q2Revenue { get; set; }
    public double Q3Revenue { get; set; }
    public double Q4Revenue { get; set; }
}

public class SaveEquityStructureRequest
{
    public List<EquityEntryDto> Entries { get; set; }
    public double EsopPoolPercent { get; set; }
    public int EsopVestingMonths { get; set; }
    public int TotalShares { get; set; } = 1000000;
}

public class EquityEntryDto
{
    public string StakeholderName { get; set; }
    public string Type { get; set; } // founder, investor, esop, advisor
    public int SharesOwned { get; set; }
    public int? VestingMonths { get; set; }
    public double? InvestmentAmount { get; set; }
}

public class SaveFundingAskRequest
{
    public double RaiseAmount { get; set; }
    public string RoundType { get; set; } // pre_seed, seed, series_a
    public double PreMoneyValuation { get; set; }
    public string ShareType { get; set; } // preferred, safe, note
    public List<CapitalAllocationDto> CapitalAllocation { get; set; }
    public ResourceMapDto ResourceMap { get; set; }
}

public class CapitalAllocationDto
{
    public string Category { get; set; }
    public double Amount { get; set; }
    public double Percent { get; set; }
}

public class ResourceMapDto
{
    public List<HiringPlanDto> HiringPlan { get; set; } = new();
    public List<ServiceProviderDto> ServiceProviders { get; set; } = new();
    public List<TechToolDto> TechTools { get; set; } = new();
}

public class HiringPlanDto
{
    public string Role { get; set; }
    public double Salary { get; set; }
    public string Timeline { get; set; }
    public string Priority { get; set; }
}

public class ServiceProviderDto
{
    public string Name { get; set; }
    public double EstimatedCost { get; set; }
}

public class TechToolDto
{
    public string Name { get; set; }
    public double MonthlyCost { get; set; }
}

public class FinancialSummaryResponse
{
    public double TotalRevenue { get; set; }
    public double FinalValuation { get; set; }
    public double MonthlyRecurringRevenue { get; set; }
    public double AnnualRecurringRevenue { get; set; }
    public int RunwayMonths { get; set; }
    public double GrowthRate { get; set; }
    public DateTime LastUpdatedAt { get; set; }
}

// ============ PHASE 4: DILUTION SIMULATION ============

public class SimulateDilutionRequest
{
    public double FundingAmount { get; set; }
    public double PostMoneyValuation { get; set; }
    public string RoundType { get; set; } // seed, series_a, series_b
}

public class DilutionSimulationResponse
{
    public List<DilutionScenarioDto> Scenarios { get; set; }
}

public class DilutionScenarioDto
{
    public string Round { get; set; }
    public double FounderOwnershipBefore { get; set; }
    public double FounderOwnershipAfter { get; set; }
    public double InvestorOwnership { get; set; }
    public double Valuation { get; set; }
}

// ============ PHASE 6: DATA ROOM ============

public class UploadDataRoomDocumentRequest
{
    public string Title { get; set; }
    public string Category { get; set; } // legal, financial, technical, business, ip
    public bool IsRequired { get; set; }
    public byte[] FileContent { get; set; }
    public string FileName { get; set; }
}

public class DataRoomAccessRequest
{
    public string InvestorId { get; set; }
    public string AccessLevel { get; set; } // view_only, download, comment
    public int DaysValid { get; set; } = 7;
}

public class DataRoomDocumentResponse
{
    public string DocumentId { get; set; }
    public string Title { get; set; }
    public string Category { get; set; }
    public string Status { get; set; } // draft, published
    public DateTime UploadedAt { get; set; }
    public int ViewCount { get; set; }
}

public class DataRoomStatusResponse
{
    public bool IsLive { get; set; }
    public bool NdaRequired { get; set; }
    public int TotalDocuments { get; set; }
    public List<DataRoomDocumentResponse> Documents { get; set; }
    public List<DataRoomAccessRecord> AccessGrants { get; set; }
}

public class DataRoomAccessRecord
{
    public string InvestorId { get; set; }
    public string InvestorName { get; set; }
    public string AccessLevel { get; set; }
    public DateTime GrantedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}

// ============ PHASE 7: AI REVIEW ============

public class AiReviewResponse
{
    public int OverallScore { get; set; }
    public ScoreBreakdownDto ScoreBreakdown { get; set; }
    public bool InvestorReadyBadge { get; set; }
    public List<RecommendationDto> Recommendations { get; set; }
    public DateTime ReviewedAt { get; set; }
}

public class ScoreBreakdownDto
{
    public int VerificationScore { get; set; }
    public int FinancialScore { get; set; }
    public int EquityScore { get; set; }
    public int FundingScore { get; set; }
    public int DataRoomScore { get; set; }
    public int OverallScore { get; set; }
}

public class RecommendationDto
{
    public string Title { get; set; }
    public string Description { get; set; }
    public string Priority { get; set; } // high, medium, low
    public int PotentialPointGain { get; set; }
}

// ============ PHASE 8: INVESTOR MATCHING ============

public class InvestorMatchResponse
{
    public string MatchId { get; set; }
    public string InvestorId { get; set; }
    public string InvestorName { get; set; }
    public int MatchScore { get; set; }
    public string InvestorType { get; set; }
    public string PreferredRound { get; set; }
    public string InvestmentRange { get; set; }
    public List<string> PreferredSectors { get; set; }
    public string Status { get; set; }
}

public class RecordInteractionRequest
{
    public string MatchId { get; set; }
    public string InteractionType { get; set; } // view, message, call, proposal_sent
    public string Details { get; set; }
}

// ============ PHASE 9: DEAL EXECUTION ============

public class CreateDealRequest
{
    public string InvestorId { get; set; }
    public List<DealParticipantDto> AdditionalInvestors { get; set; }
    public TermSheetRequest TermSheet { get; set; }
}

public class DealParticipantDto
{
    public string InvestorId { get; set; }
    public double CommittedAmount { get; set; }
}

public class TermSheetRequest
{
    public double TotalRaiseAmount { get; set; }
    public double PostMoneyValuation { get; set; }
    public string EquityType { get; set; }
    public bool ProRataRights { get; set; }
    public string LiquidationPreference { get; set; }
    public int BoardSeats { get; set; }
    public DateTime ProposedClosingDate { get; set; }
}

public class DealStatusResponse
{
    public string DealId { get; set; }
    public string Status { get; set; }
    public double ProgressPercent { get; set; }
    public TermSheetResponse TermSheet { get; set; }
    public List<ChecklistItemDto> ClosingChecklist { get; set; }
    public List<DealParticipantStatusDto> Investors { get; set; }
}

public class TermSheetResponse
{
    public double TotalRaiseAmount { get; set; }
    public double PostMoneyValuation { get; set; }
    public string EquityType { get; set; }
    public double InvestorEquityPercent { get; set; }
    public bool ProRataRights { get; set; }
    public string Status { get; set; }
    public DateTime? SignedAt { get; set; }
}

public class ChecklistItemDto
{
    public string Item { get; set; }
    public bool Completed { get; set; }
    public string Owner { get; set; }
    public DateTime? DueDate { get; set; }
}

public class DealParticipantStatusDto
{
    public string InvestorId { get; set; }
    public string InvestorName { get; set; }
    public double CommittedAmount { get; set; }
    public string Status { get; set; }
}

// ============ PHASE 5: FUNDING ASK & PITCH ============

public class SaveFundingNarrativeRequest
{
    public string Narrative { get; set; }
}

public class SaveOutreachCampaignRequest
{
    public List<string> InvestorIds { get; set; }
    public string Template { get; set; }
}

// ============ GENERAL RESPONSES ============

public class CompanyProgressResponse
{
    public string CompanyId { get; set; }
    public int CurrentPhase { get; set; }
    public List<int> CompletedPhases { get; set; }
    public int OverallProgressPercent { get; set; }
    public int TrustScore { get; set; }
    public bool IsInvestorReady { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastUpdatedAt { get; set; }
}

public class AdvancePhaseRequest
{
    public int PhaseNumber { get; set; }
}

// ============ PHASE 3: CASH POSITION / KPI / MONTHLY REVENUE / REPORTS ============

public class SaveCashPositionRequest
{
    public double CurrentFunds { get; set; }
    public double MonthlyBurn { get; set; }
}

public class SaveMonthlyRevenueRequest
{
    public List<MonthlyRevenueEntryDto> Entries { get; set; } = new();
}

public class MonthlyRevenueEntryDto
{
    /// <summary>YYYY-MM, e.g. "2026-05".</summary>
    public string YearMonth { get; set; }
    public double Revenue { get; set; }
    public Dictionary<string, double> SectorBreakdown { get; set; } = new();
}

public class MonthlyRevenueResponse
{
    public string YearMonth { get; set; }
    public double Revenue { get; set; }
    public Dictionary<string, double> SectorBreakdown { get; set; } = new();
    public DateTime RecordedAt { get; set; }
}

public class SaveKpiBaselineRequest
{
    public double Mrr { get; set; }
    public double Arr { get; set; }
    public double GrossMarginPercent { get; set; }
    public double Cac { get; set; }
    public double Ltv { get; set; }
    public double ChurnPercent { get; set; }
    public int ActiveAccounts { get; set; }
}

public class KpiBaselineResponse
{
    public double Mrr { get; set; }
    public double Arr { get; set; }
    public double GrossMarginPercent { get; set; }
    public double Cac { get; set; }
    public double Ltv { get; set; }
    public double ChurnPercent { get; set; }
    public int ActiveAccounts { get; set; }
    public DateTime RecordedAt { get; set; }
}

public class FinancialReportUploadRequest
{
    public Microsoft.AspNetCore.Http.IFormFile File { get; set; }
    /// <summary>pnl | balance | audit | other</summary>
    public string ReportType { get; set; }
}

public class FinancialReportResponse
{
    public string ReportId { get; set; }
    public string Type { get; set; }
    public string FileName { get; set; }
    public string Status { get; set; }
    public DateTime UploadedAt { get; set; }
    public long FileSize { get; set; }
    public string StoragePath { get; set; }
    public string ReviewNote { get; set; }
}

// ============ PHASE 4: CAP TABLE / VESTING / OWNERSHIP HISTORY / ISSUANCE ============

public class EquityGrantDto
{
    public string GrantId { get; set; }
    public string StakeholderName { get; set; }
    public string StakeholderType { get; set; } // founder | investor | advisor | esop
    public string ShareClass { get; set; }       // common | preferred | safe | note
    public int SharesGranted { get; set; }
    public double? InvestmentAmount { get; set; }
    public DateTime? GrantDate { get; set; }
    public int CliffMonths { get; set; }
    public int TotalVestMonths { get; set; }
}

public class SubmitCapTableRequest
{
    public int TotalShares { get; set; }
    public double EsopPoolPercent { get; set; }
    public int EsopVestingMonths { get; set; }
    public List<EquityGrantDto> Grants { get; set; } = new();
}

public class CapTableSnapshotResponse
{
    public string CapTableId { get; set; }
    public int Version { get; set; }
    public int TotalShares { get; set; }
    public double EsopPoolPercent { get; set; }
    public int EsopVestingMonths { get; set; }
    public List<EquityGrantDto> Grants { get; set; } = new();
    public DateTime RecordedAt { get; set; }
}

public class SaveVestingScheduleRequest
{
    public List<VestingScheduleEntryDto> Entries { get; set; } = new();
}

public class VestingScheduleEntryDto
{
    public string GrantId { get; set; }
    public string StakeholderName { get; set; }
    public int SharesGranted { get; set; }
    public DateTime GrantDate { get; set; }
    public int CliffMonths { get; set; }
    public int TotalVestMonths { get; set; }
}

public class VestingScheduleResponse
{
    public string GrantId { get; set; }
    public string StakeholderName { get; set; }
    public int SharesGranted { get; set; }
    public DateTime GrantDate { get; set; }
    public int CliffMonths { get; set; }
    public int TotalVestMonths { get; set; }
    public double VestedPercentNow { get; set; }
    public int VestedSharesNow { get; set; }
}

public class SaveOwnershipHistoryRequest
{
    public List<OwnershipHistoryEntryDto> Entries { get; set; } = new();
}

public class OwnershipHistoryEntryDto
{
    public string RoundName { get; set; }
    public DateTime? EventDate { get; set; }
    public double FounderOwnershipBefore { get; set; }
    public double FounderOwnershipAfter { get; set; }
    public double InvestorOwnership { get; set; }
    public double EsopOwnership { get; set; }
    public double Valuation { get; set; }
    public string Notes { get; set; }
}

public class OwnershipHistoryResponse
{
    public string RoundName { get; set; }
    public DateTime EventDate { get; set; }
    public double FounderOwnershipBefore { get; set; }
    public double FounderOwnershipAfter { get; set; }
    public double InvestorOwnership { get; set; }
    public double EsopOwnership { get; set; }
    public double Valuation { get; set; }
    public string Notes { get; set; }
    public DateTime RecordedAt { get; set; }
}

public class RecordShareIssuanceRequest
{
    public string IssuedTo { get; set; }
    public string ShareClass { get; set; }
    public int SharesIssued { get; set; }
    public double? PricePerShare { get; set; }
    public string Reason { get; set; }
}

public class ShareIssuanceResponse
{
    public string IssuanceId { get; set; }
    public string IssuedTo { get; set; }
    public string ShareClass { get; set; }
    public int SharesIssued { get; set; }
    public double? PricePerShare { get; set; }
    public string Reason { get; set; }
    public DateTime IssuedAt { get; set; }
}
