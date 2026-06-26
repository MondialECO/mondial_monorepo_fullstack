using MongoDB.Driver;
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
    Task<(Companies Company, bool AlreadyExisted)> CreateCompanyFromIdeaAsync(string userId, string ideaId);
    Task<Companies> GetCompanyAsync(string companyId);
    Task<Companies> GetCompanyByUserIdAsync(string userId);

    /// <summary>
    /// Creator → Entrepreneur bridge (Path B Level Up). Idempotent by OwnerId:
    /// returns the user's existing company or creates one following Entrepreneur
    /// conventions (CurrentPhase = 2, CompletedPhases = []). Pre-fills the formation
    /// PLAN (legal structure, funding ask) + provenance link; verification PROOF
    /// (legal name, reg number, documents, beneficial owners) stays empty.
    /// </summary>
    /// <param name="session">
    /// Optional Mongo session so this write joins the Level Up transaction. When null,
    /// writes run without a session (non-transactional fallback path).
    /// </param>
    Task<Companies> EnsureLevelUpCompanyAsync(
        string userId, string sourceLink, string legalStructure, double? fundingAsk,
        IClientSessionHandle session = null);

    // ============ PHASE 2: LEGAL INFO & DOCUMENTS ============

    Task<Companies> UpdateLegalInfoAsync(string companyId, UpdateLegalInfoRequest request);
    Task<DocumentStatusResponse> UploadDocumentAsync(string companyId, DocumentUploadRequest request);
    Task<List<DocumentStatusResponse>> GetDocumentStatusAsync(string companyId);
    Task<Companies> UpdateBeneficialOwnersAsync(string companyId, UpdateBeneficialOwnersRequest request);
    Task<List<BeneficialOwnerResponse>> GetBeneficialOwnersAsync(string companyId);

    // ============ PHASE 3: FINANCIAL & KPI ============

    Task<Companies> SaveRevenueDataAsync(string companyId, SaveRevenueDataRequest request);
    Task<FinancialSummaryResponse> CalculateValuationAsync(string companyId);
    Task<Companies> SaveEquityStructureAsync(string companyId, SaveEquityStructureRequest request);
    Task<Companies> SaveFundingAskAsync(string companyId, SaveFundingAskRequest request);
    Task<FinancialSummaryResponse> GetFinancialSummaryAsync(string companyId);

    Task<Companies> SaveCashPositionAsync(string companyId, SaveCashPositionRequest request);
    Task<List<MonthlyRevenueResponse>> SaveMonthlyRevenueAsync(string companyId, SaveMonthlyRevenueRequest request);
    Task<List<MonthlyRevenueResponse>> GetMonthlyRevenueAsync(string companyId);
    Task<List<QuarterlyRevenueResponse>> GetQuarterlyRevenueAsync(string companyId);
    Task<KpiBaselineResponse> SaveKpiBaselineAsync(string companyId, SaveKpiBaselineRequest request);
    Task<KpiBaselineResponse?> GetKpiBaselineAsync(string companyId);
    Task<FinancialReportResponse> UploadFinancialReportAsync(string companyId, FinancialReportUploadRequest request);
    Task<List<FinancialReportResponse>> GetFinancialReportsAsync(string companyId);
    Task<ConceptResponse> SaveConceptAsync(string companyId, SaveConceptRequest request);
    Task<ConceptResponse?> GetConceptAsync(string companyId);

    // ============ PHASE 4: EQUITY STRUCTURE & DILUTION ============

    Task<SaveEquityStructureRequest> GetCapTableAsync(string companyId);
    Task<DilutionSimulationResponse> SimulateDilutionAsync(string companyId, SimulateDilutionRequest request);

    Task<CapTableSnapshotResponse> SubmitCapTableAsync(string companyId, SubmitCapTableRequest request);
    Task<CapTableSnapshotResponse?> GetLatestCapTableSnapshotAsync(string companyId);
    Task SetExitWaterfallReviewedAsync(string companyId);
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
    Task<NdaAcceptanceResponse> AcceptDataRoomNdaAsync(string companyId, string investorId, string ndaText, string ipHash);

    // ============ PHASE 7: AI REVIEW ============

    Task<AiReviewResponse> RunAiReviewAsync(string companyId);
    Task<AiReviewResponse> GetAiReviewScoreAsync(string companyId);
    Task<List<RecommendationDto>> GetRecommendationsAsync(string companyId);
    Task<List<Phase7ReviewSnapshot>> GetAiReviewHistoryAsync(string companyId);
    Task AwardInvestorReadyBadgeAsync(string companyId);

    // ============ PHASE 8: INVESTOR MATCHING ============

    Task<List<InvestorMatchResponse>> GetMatchedInvestorsAsync(string companyId);
    Task<List<InvestorMatchResponse>> RegenerateInvestorMatchesAsync(string companyId);
    Task RecordInvestorInteractionAsync(string companyId, RecordInteractionRequest request);
    Task<InvestorMatchResponse> UpdateMatchStatusAsync(string companyId, string matchId, string status);
    Task<MatchingInsightsResponse> GetMatchingInsightsAsync(string companyId);

    // ============ PHASE 9: DEAL EXECUTION ============

    Task<DealStatusResponse> CreateDealAsync(string companyId, CreateDealRequest request, string actorUserId, string ipHash);
    Task<DealStatusResponse> GetDealAsync(string dealId);
    Task<string?> GetDealCompanyIdAsync(string dealId);
    Task<List<DealStatusResponse>> GetCompanyDealsAsync(string companyId);

    // ---- Bilateral (participant-based) deal reads (Phase D-2) ----
    // Raw deal entity for participant resolution (CompanyId + Investor ids).
    Task<DealExecution?> GetDealEntityAsync(string dealId);
    // Defense-in-depth reads: require a resolved DealAccessContext, never a
    // bare dealId, so the service cannot be driven without proven participation.
    DealStatusResponse GetDealForParticipant(DealAccessContext ctx);
    Task<List<DealActivityLogResponse>> GetDealActivityForParticipantAsync(DealAccessContext ctx);
    // All deals the caller participates in, by either role (founder via owned
    // company id, investor via catalogue investor id).
    Task<List<DealStatusResponse>> GetDealsForParticipantAsync(string? ownedCompanyId, string? investorId);

    // ---- Offer system (Phase D-4) ----
    Task<DealStatusResponse> CreateInvestorOfferAsync(string companyId, string investorId, OfferTermsRequest req, string actorUserId, string ipHash);
    Task<DealStatusResponse> CounterOfferAsync(DealAccessContext ctx, OfferTermsRequest req, string actorUserId, string ipHash);
    Task<DealStatusResponse> AcceptOfferAsync(DealAccessContext ctx, string actorUserId, string ipHash);
    Task<DealStatusResponse> RejectOfferAsync(DealAccessContext ctx, string note, string actorUserId, string ipHash);
    Task<DealStatusResponse> MarkOfferViewedAsync(DealAccessContext ctx, string actorUserId, string ipHash);

    // Resolve both deal participants (founder + investors) to user id + email,
    // for realtime fan-out and notification delivery (Phase D-4.5).
    Task<List<DealRecipient>> GetDealRecipientsAsync(string dealId);
    // ---- Bilateral (participant-based) deal writes (Phase D-3) ----
    // Each takes a resolved DealAccessContext so the service re-validates the
    // caller's role (defense-in-depth) and never trusts the controller alone.
    Task<DealStatusResponse> UpdateTermSheetAsync(DealAccessContext ctx, TermSheetRequest request, string actorUserId, string ipHash);
    Task<DealStatusResponse> ProgressChecklistAsync(DealAccessContext ctx, ChecklistItemDto item, string actorUserId, string ipHash);
    Task<DealStatusResponse> CloseDealAsync(DealAccessContext ctx, string actorUserId, string ipHash);

    Task<DealStatusResponse> UpdateDealStatusAsync(DealAccessContext ctx, UpdateDealStatusRequest request, string actorUserId, string ipHash);
    Task<DealStatusResponse> SignTermSheetAsync(DealAccessContext ctx, SignTermSheetRequest request, string actorUserId, string ipHash);
    Task<DealStatusResponse> MutateDueDiligenceItemAsync(DealAccessContext ctx, MutateDueDiligenceItemRequest request, string actorUserId, string ipHash);
    Task<DealDocumentResponse> UploadDealDocumentAsync(DealAccessContext ctx, UploadDealDocumentRequest request, string actorUserId, string ipHash);
    Task<(byte[] Content, DealDocumentResponse Document)> GetDealDocumentAsync(DealAccessContext ctx, string documentId);
    Task<List<DealActivityLogResponse>> GetDealActivityAsync(string dealId);

    // ============ INVESTOR-SIDE READS (Phase B/C/D — June 10 demo) ============

    Task<OpportunityFeedResponse> GetOpportunitiesForInvestorAsync(
        string investorId, string sector, string stage, string geography, int take);

    Task<OpportunityDetailResponse> GetOpportunityForInvestorAsync(
        string investorId, string companyId);

    Task<InvestorPipelineResponse> GetInvestorPipelineAsync(string investorId, string callerUserId);

    Task<InvestorDocumentListResponse> GetInvestorDocumentsAsync(string investorId, string companyId);

    Task<InvestorSessionResponse> GetInvestorSessionAsync(string investorId, string companyId);

    Task<DiligenceProgressResponse> GetDiligenceProgressAsync(string investorId, string companyId);

    Task<RoundSummaryResponse> GetRoundSummaryAsync(string companyId);

    Task<TermSheetResponse> GetActiveTermSheetAsync(string companyId);

    Task<List<TimelineEventResponse>> GetDealTimelineAsync(string companyId);
}
