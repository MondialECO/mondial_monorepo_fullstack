using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services;

public interface ICompanyService
{
    // ============ PHASE FLOW ============

    Task<CompanyProgressResponse> GetCurrentPhaseAsync(string userId);
    Task<CompanyProgressResponse> AdvancePhaseAsync(string companyId, int phaseNumber, object phaseData);
    Task<CompanyProgressResponse> GetPhaseProgressAsync(string companyId);

    // ============ PHASE 1: IDENTITY & ONBOARDING (via Auth) ============

    Task<Companies> CreateCompanyAsync(string userId, CreateCompanyDto dto);
    Task<Companies> GetCompanyAsync(string companyId);
    Task<Companies> GetCompanyByUserIdAsync(string userId);

    // ============ PHASE 2: LEGAL INFO & DOCUMENTS ============

    Task<Companies> UpdateLegalInfoAsync(string companyId, UpdateLegalInfoRequest request);
    Task<DocumentStatusResponse> UploadDocumentAsync(string companyId, DocumentUploadRequest request);
    Task<List<DocumentStatusResponse>> GetDocumentStatusAsync(string companyId);
    Task<Companies> UpdateBeneficialOwnersAsync(string companyId, UpdateBeneficialOwnersRequest request);

    // ============ PHASE 3: FINANCIAL & KPI ============

    Task<Companies> SaveRevenueDataAsync(string companyId, SaveRevenueDataRequest request);
    Task<FinancialSummaryResponse> CalculateValuationAsync(string companyId);
    Task<Companies> SaveEquityStructureAsync(string companyId, SaveEquityStructureRequest request);
    Task<Companies> SaveFundingAskAsync(string companyId, SaveFundingAskRequest request);
    Task<FinancialSummaryResponse> GetFinancialSummaryAsync(string companyId);

    Task<Companies> SaveCashPositionAsync(string companyId, SaveCashPositionRequest request);
    Task<List<MonthlyRevenueResponse>> SaveMonthlyRevenueAsync(string companyId, SaveMonthlyRevenueRequest request);
    Task<List<MonthlyRevenueResponse>> GetMonthlyRevenueAsync(string companyId);
    Task<KpiBaselineResponse> SaveKpiBaselineAsync(string companyId, SaveKpiBaselineRequest request);
    Task<KpiBaselineResponse?> GetKpiBaselineAsync(string companyId);
    Task<FinancialReportResponse> UploadFinancialReportAsync(string companyId, FinancialReportUploadRequest request);
    Task<List<FinancialReportResponse>> GetFinancialReportsAsync(string companyId);

    // ============ PHASE 4: EQUITY STRUCTURE & DILUTION ============

    Task<SaveEquityStructureRequest> GetCapTableAsync(string companyId);
    Task<DilutionSimulationResponse> SimulateDilutionAsync(string companyId, SimulateDilutionRequest request);

    Task<CapTableSnapshotResponse> SubmitCapTableAsync(string companyId, SubmitCapTableRequest request);
    Task<CapTableSnapshotResponse?> GetLatestCapTableSnapshotAsync(string companyId);
    Task<List<VestingScheduleResponse>> SaveVestingSchedulesAsync(string companyId, SaveVestingScheduleRequest request);
    Task<List<VestingScheduleResponse>> GetVestingSchedulesAsync(string companyId);
    Task<List<OwnershipHistoryResponse>> SaveOwnershipHistoryAsync(string companyId, SaveOwnershipHistoryRequest request);
    Task<List<OwnershipHistoryResponse>> GetOwnershipHistoryAsync(string companyId);
    Task<ShareIssuanceResponse> RecordShareIssuanceAsync(string companyId, RecordShareIssuanceRequest request);

    // ============ PHASE 5: FUNDING ASK & PITCH ============

    Task<PitchDeckResponse> UploadPitchDeckAsync(string companyId, PitchDeckUploadRequest request);
    Task<PitchDeckResponse?> GetPitchDeckAsync(string companyId);
    Task<Companies> SaveFundingNarrativeAsync(string companyId, string narrative);
    Task<FundingNarrativeResponse> GetFundingNarrativeAsync(string companyId);
    Task<Companies> SaveOutreachCampaignAsync(string companyId, List<string> investorIds, string template);
    Task<FundingProfileResponse> GetFundingProfileAsync(string companyId);

    // ============ PHASE 6: DATA ROOM ============

    Task<DataRoomDocumentResponse> UploadDataRoomDocumentAsync(string companyId, UploadDataRoomDocumentRequest request, string uploadedByUserId);
    Task<DataRoomStatusResponse> GetDataRoomStatusAsync(string companyId);
    Task<DataRoomStatusResponse> GrantDataRoomAccessAsync(string companyId, DataRoomAccessRequest request);
    Task RevokeDataRoomAccessAsync(string companyId, string investorId);
    Task UpdateNdaRequirementAsync(string companyId, bool required);
    Task<DataRoomStatusResponse> PublishDataRoomAsync(string companyId);
    Task<(byte[] Content, DataRoomDocumentResponse Document)> DownloadDataRoomDocumentAsync(string companyId, string documentId, string callerUserId, bool callerIsOwner);
    Task<Phase6AccessLogResponse> TrackDataRoomEventAsync(string companyId, string documentId, string investorId, bool callerIsOwner, string eventType, string ipHash);
    Task<DataRoomAnalyticsResponse> GetDataRoomAnalyticsAsync(string companyId);
    Task<List<Phase6AccessLogResponse>> GetDataRoomActivityTimelineAsync(string companyId);
    Task AcceptDataRoomNdaAsync(string companyId, string investorId, string ndaText, string ipHash);

    // ============ PHASE 7: AI REVIEW ============

    Task<AiReviewResponse> RunAiReviewAsync(string companyId);
    Task<AiReviewResponse> GetAiReviewScoreAsync(string companyId);
    Task<List<RecommendationDto>> GetRecommendationsAsync(string companyId);
    Task<List<Phase7ReviewSnapshot>> GetAiReviewHistoryAsync(string companyId);
    Task AwardInvestorReadyBadgeAsync(string companyId);

    // ============ PHASE 8: INVESTOR MATCHING ============

    Task<List<InvestorMatchResponse>> GetMatchedInvestorsAsync(string companyId);
    Task RecordInvestorInteractionAsync(string companyId, RecordInteractionRequest request);
    Task<List<InvestorMatch>> GetMatchingInsightsAsync(string companyId);

    // ============ PHASE 9: DEAL EXECUTION ============

    Task<DealStatusResponse> CreateDealAsync(string companyId, CreateDealRequest request);
    Task<DealStatusResponse> GetDealAsync(string dealId);
    Task<string?> GetDealCompanyIdAsync(string dealId);
    Task<List<DealStatusResponse>> GetCompanyDealsAsync(string companyId);
    Task<DealStatusResponse> UpdateTermSheetAsync(string dealId, TermSheetRequest request);
    Task<DealStatusResponse> ProgressChecklistAsync(string dealId, ChecklistItemDto item);
    Task<DealStatusResponse> CloseDealAsync(string dealId);
}
