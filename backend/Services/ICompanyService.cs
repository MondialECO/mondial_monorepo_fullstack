using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services;

public interface ICompanyService
{
    // ============ PHASE FLOW ============

    Task<CompanyProgressResponse> GetCurrentPhaseAsync(string userId);
    Task<CompanyProgressResponse> AdvancePhaseAsync(string userId, int phaseNumber, object phaseData);
    Task<CompanyProgressResponse> GetPhaseProgressAsync(string userId);

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

    // ============ PHASE 4: EQUITY STRUCTURE & DILUTION ============

    Task<SaveEquityStructureRequest> GetCapTableAsync(string companyId);
    Task<DilutionSimulationResponse> SimulateDilutionAsync(string companyId, SimulateDilutionRequest request);

    // ============ PHASE 6: DATA ROOM ============

    Task<DataRoomDocumentResponse> UploadDataRoomDocumentAsync(string companyId, UploadDataRoomDocumentRequest request);
    Task<DataRoomStatusResponse> GetDataRoomStatusAsync(string companyId);
    Task<DataRoomStatusResponse> GrantDataRoomAccessAsync(string companyId, DataRoomAccessRequest request);
    Task RevokeDataRoomAccessAsync(string companyId, string investorId);
    Task UpdateNdaRequirementAsync(string companyId, bool required);

    // ============ PHASE 7: AI REVIEW ============

    Task<AiReviewResponse> RunAiReviewAsync(string companyId);
    Task<AiReviewResponse> GetAiReviewScoreAsync(string companyId);
    Task<List<RecommendationDto>> GetRecommendationsAsync(string companyId);
    Task AwardInvestorReadyBadgeAsync(string companyId);

    // ============ PHASE 8: INVESTOR MATCHING ============

    Task<List<InvestorMatchResponse>> GetMatchedInvestorsAsync(string companyId);
    Task RecordInvestorInteractionAsync(string companyId, RecordInteractionRequest request);
    Task<List<InvestorMatch>> GetMatchingInsightsAsync(string companyId);

    // ============ PHASE 9: DEAL EXECUTION ============

    Task<DealStatusResponse> CreateDealAsync(string companyId, CreateDealRequest request);
    Task<DealStatusResponse> GetDealAsync(string dealId);
    Task<List<DealStatusResponse>> GetCompanyDealsAsync(string companyId);
    Task<DealStatusResponse> UpdateTermSheetAsync(string dealId, TermSheetRequest request);
    Task<DealStatusResponse> ProgressChecklistAsync(string dealId, ChecklistItemDto item);
    Task<DealStatusResponse> CloseDealAsync(string dealId);
}
