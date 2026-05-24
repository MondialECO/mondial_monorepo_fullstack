import api from "@/lib/axios";

// ============ TYPES ============

export interface CompanyProgressResponse {
  companyId: string;
  currentPhase: number;
  completedPhases: number[];
  overallProgressPercent: number;
  trustScore: number;
  isInvestorReady: boolean;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface CreateCompanyRequest {
  companyName: string;
  industry: string;
  website: string;
  tagline: string;
}

// Phase 2
export interface UpdateLegalInfoRequest {
  legalName: string;
  registrationNumber: string;
  legalStructure: string;
  incorporationDate: string;
  registeredAddress: string;
  country: string;
  nafCode: string;
}

export interface DocumentStatusResponse {
  documentId: string;
  type: string;
  fileName: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  reviewNote?: string;
}

export interface BeneficialOwner {
  fullName: string;
  email: string;
  ownershipPercent: number;
  role?: string;
  nationality?: string;
}

export interface UpdateBeneficialOwnersRequest {
  owners: BeneficialOwner[];
}

// Phase 3
export interface SaveRevenueDataRequest {
  q1Revenue: number;
  q2Revenue: number;
  q3Revenue: number;
  q4Revenue: number;
}

export interface SaveCashPositionRequest {
  currentFunds: number;
  monthlyBurn: number;
}

export interface CashPositionResponse {
  currentFunds: number;
  monthlyBurn: number;
}

export interface MonthlyRevenueEntry {
  yearMonth: string; // YYYY-MM
  revenue: number;
  sectorBreakdown?: Record<string, number>;
}

export interface SaveMonthlyRevenueRequest {
  entries: MonthlyRevenueEntry[];
}

export interface MonthlyRevenueResponse {
  yearMonth: string;
  revenue: number;
  sectorBreakdown: Record<string, number>;
  recordedAt: string;
}

export interface SaveKpiBaselineRequest {
  mrr: number;
  arr: number;
  grossMarginPercent: number;
  cac: number;
  ltv: number;
  churnPercent: number;
  activeAccounts: number;
}

export interface KpiBaselineResponse {
  mrr: number;
  arr: number;
  grossMarginPercent: number;
  cac: number;
  ltv: number;
  churnPercent: number;
  activeAccounts: number;
  recordedAt: string;
}

export interface FinancialReportResponse {
  reportId: string;
  type: string;
  fileName: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  fileSize: number;
  storagePath: string;
  reviewNote?: string;
}

export interface FinancialSummaryResponse {
  totalRevenue: number;
  finalValuation: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  runwayMonths: number;
  growthRate: number;
  lastUpdatedAt: string;
}

export interface EquityEntry {
  stakeholderName: string;
  type: "founder" | "investor" | "esop" | "advisor";
  sharesOwned: number;
  vestingMonths?: number;
  investmentAmount?: number;
}

export interface SaveEquityStructureRequest {
  entries: EquityEntry[];
  esopPoolPercent: number;
  esopVestingMonths: number;
  totalShares: number;
}

export interface CapitalAllocation {
  category: string;
  amount: number;
  percent: number;
}

export interface HiringPlan {
  role: string;
  salary: number;
  timeline: string;
  priority: string;
}

export interface ResourceMap {
  hiringPlan: HiringPlan[];
  serviceProviders: Array<{ name: string; estimatedCost: number }>;
  techTools: Array<{ name: string; monthlyCost: number }>;
}

export interface SaveFundingAskRequest {
  raiseAmount: number;
  roundType: "pre_seed" | "seed" | "series_a";
  preMoneyValuation: number;
  /** Optional at write time; required at Phase 5 advancement. */
  equityOfferedPercent?: number;
  shareType?: "preferred" | "safe" | "note";
  capitalAllocation: CapitalAllocation[];
  resourceMap: ResourceMap;
}

// Phase 5 — additional reads/writes
export interface PitchDeckResponse {
  fileName: string;
  storagePath: string;
  fileSize: number;
  uploadedAt: string;
}

export interface FundingNarrativeResponse {
  narrative: string;
}

export interface SaveFundingNarrativeRequest {
  narrative: string;
}

export interface SaveOutreachCampaignRequest {
  investorIds: string[];
  template: string;
}

export interface FundingProfileResponse {
  fundingAskAmount?: number;
  fundingRoundType?: string;
  preMoneyValuation?: number;
  equityOfferedPercent?: number;
  shareType?: string;
  capitalAllocation: CapitalAllocation[];
  resourceMap?: ResourceMap;
  pitchDeckFileName?: string;
  pitchDeckUploadedAt?: string;
  fundingNarrative?: string;
  hasOutreachCampaign: boolean;
}

// Phase 4 — Cap Table Submission
export interface EquityGrantDto {
  grantId?: string;
  stakeholderName: string;
  stakeholderType: 'founder' | 'investor' | 'advisor' | 'esop';
  shareClass: 'common' | 'preferred' | 'safe' | 'note';
  sharesGranted: number;
  investmentAmount?: number;
  grantDate?: string;
  cliffMonths: number;
  totalVestMonths: number;
}

export interface SubmitCapTableRequest {
  totalShares: number;
  esopPoolPercent: number;
  esopVestingMonths: number;
  grants: EquityGrantDto[];
}

export interface CapTableSnapshotResponse {
  capTableId: string;
  version: number;
  totalShares: number;
  esopPoolPercent: number;
  esopVestingMonths: number;
  grants: EquityGrantDto[];
  recordedAt: string;
}

export interface VestingScheduleEntryDto {
  grantId?: string;
  stakeholderName: string;
  sharesGranted: number;
  grantDate: string;
  cliffMonths: number;
  totalVestMonths: number;
}

export interface SaveVestingScheduleRequest {
  entries: VestingScheduleEntryDto[];
}

export interface VestingScheduleResponse {
  grantId: string;
  stakeholderName: string;
  sharesGranted: number;
  grantDate: string;
  cliffMonths: number;
  totalVestMonths: number;
  vestedPercentNow: number;
  vestedSharesNow: number;
}

export interface OwnershipHistoryEntryDto {
  roundName: string;
  eventDate?: string;
  founderOwnershipBefore: number;
  founderOwnershipAfter: number;
  investorOwnership: number;
  esopOwnership: number;
  valuation: number;
  notes?: string;
}

export interface SaveOwnershipHistoryRequest {
  entries: OwnershipHistoryEntryDto[];
}

export interface OwnershipHistoryResponse {
  roundName: string;
  eventDate: string;
  founderOwnershipBefore: number;
  founderOwnershipAfter: number;
  investorOwnership: number;
  esopOwnership: number;
  valuation: number;
  notes?: string;
  recordedAt: string;
}

export interface RecordShareIssuanceRequest {
  issuedTo: string;
  shareClass: 'common' | 'preferred' | 'safe' | 'note';
  sharesIssued: number;
  pricePerShare?: number;
  reason?: string;
}

export interface ShareIssuanceResponse {
  issuanceId: string;
  issuedTo: string;
  shareClass: string;
  sharesIssued: number;
  pricePerShare?: number;
  reason?: string;
  issuedAt: string;
}

// Phase 4
export interface DilutionScenario {
  round: string;
  founderOwnershipBefore: number;
  founderOwnershipAfter: number;
  investorOwnership: number;
  valuation: number;
}

export interface DilutionSimulationResponse {
  scenarios: DilutionScenario[];
}

export interface SimulateDilutionRequest {
  fundingAmount: number;
  postMoneyValuation: number;
  roundType: string;
}

// Phase 6
export interface DataRoomDocumentResponse {
  documentId: string;
  title: string;
  category: string;
  status: "draft" | "published";
  uploadedAt: string;
  viewCount: number;
}

export interface DataRoomStatusResponse {
  isLive: boolean;
  ndaRequired: boolean;
  totalDocuments: number;
  documents: DataRoomDocumentResponse[];
  accessGrants: Array<{
    investorId: string;
    investorName: string;
    accessLevel: string;
    grantedAt: string;
    expiresAt: string;
  }>;
}

// Phase 7
export interface RecommendationDto {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  potentialPointGain: number;
}

export interface ScoreBreakdownDto {
  verificationScore: number;
  financialScore: number;
  equityScore: number;
  fundingScore: number;
  dataRoomScore: number;
  overallScore: number;
}

export interface AiReviewResponse {
  overallScore: number;
  scoreBreakdown: ScoreBreakdownDto;
  investorReadyBadge: boolean;
  recommendations: RecommendationDto[];
  reviewedAt: string;
}

// Phase 8
export interface InvestorMatchResponse {
  matchId: string;
  investorId: string;
  investorName?: string;
  matchScore: number;
  investorType?: string;
  preferredRound?: string;
  investmentRange?: string;
  preferredSectors?: string[];
  status: string;
}

// Phase 9
export interface DealStatusResponse {
  dealId: string;
  status: string;
  progressPercent: number;
  termSheet: {
    totalRaiseAmount: number;
    postMoneyValuation: number;
    equityType: string;
    investorEquityPercent: number;
    proRataRights: boolean;
    status: string;
    signedAt?: string;
  };
  closingChecklist: Array<{
    item: string;
    completed: boolean;
    owner: string;
    dueDate?: string;
  }>;
  investors: Array<{
    investorId: string;
    investorName: string;
    committedAmount: number;
    status: string;
  }>;
}

export interface JobStatus {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed" | "not_found";
  createdAt: string;
  completedAt?: string;
  result?: string;
  errorMessage?: string;
}

// ============ PHASE FLOW ============

export const entrepreneurApi = {
  // Phase Flow
  getCurrentPhase: async (): Promise<CompanyProgressResponse> => {
    const response = await api.get<CompanyProgressResponse>(
      "/companies/current-phase"
    );
    return response.data;
  },

  advancePhase: async (
    companyId: string,
    phaseNumber: number,
    data: Record<string, unknown>
  ): Promise<CompanyProgressResponse> => {
    const response = await api.post<CompanyProgressResponse>(
      `/companies/${companyId}/phase/${phaseNumber}`,
      data
    );
    return response.data;
  },

  getPhaseProgress: async (
    companyId: string
  ): Promise<CompanyProgressResponse> => {
    const response = await api.get<CompanyProgressResponse>(
      `/companies/${companyId}/progress`
    );
    return response.data;
  },

  // ============ PHASE 1: IDENTITY & ONBOARDING ============

  createCompany: async (
    data: CreateCompanyRequest
  ): Promise<CompanyProgressResponse> => {
    const response = await api.post<CompanyProgressResponse>(
      "/companies",
      data
    );
    return response.data;
  },

  getCompany: async (companyId: string) => {
    const response = await api.get(`/companies/${companyId}`);
    return response.data;
  },

  // ============ PHASE 2: LEGAL & DOCUMENTS ============

  updateLegalInfo: async (
    companyId: string,
    data: UpdateLegalInfoRequest
  ) => {
    const response = await api.post(`/companies/${companyId}/legal`, data);
    return response.data;
  },

  uploadDocument: async (companyId: string, formData: FormData) => {
    const response = await api.post<DocumentStatusResponse>(
      `/companies/${companyId}/documents`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  getDocuments: async (companyId: string): Promise<DocumentStatusResponse[]> => {
    const response = await api.get<DocumentStatusResponse[]>(
      `/companies/${companyId}/documents`
    );
    return response.data;
  },

  updateBeneficialOwners: async (
    companyId: string,
    data: UpdateBeneficialOwnersRequest
  ) => {
    const response = await api.post(
      `/companies/${companyId}/beneficial-owners`,
      data
    );
    return response.data;
  },

  // ============ PHASE 3: FINANCIAL & KPI ============

  saveRevenue: async (companyId: string, data: SaveRevenueDataRequest) => {
    const response = await api.post(`/companies/${companyId}/revenue`, data);
    return response.data;
  },

  calculateValuation: async (
    companyId: string
  ): Promise<FinancialSummaryResponse> => {
    const response = await api.post<FinancialSummaryResponse>(
      `/companies/${companyId}/valuation`
    );
    return response.data;
  },

  saveEquityStructure: async (
    companyId: string,
    data: SaveEquityStructureRequest
  ) => {
    const response = await api.post(
      `/companies/${companyId}/equity-structure`,
      data
    );
    return response.data;
  },

  saveFundingAsk: async (
    companyId: string,
    data: SaveFundingAskRequest
  ) => {
    const response = await api.post(
      `/companies/${companyId}/funding-ask`,
      data
    );
    return response.data;
  },

  uploadPitchDeck: async (
    companyId: string,
    formData: FormData
  ): Promise<PitchDeckResponse> => {
    const response = await api.post<PitchDeckResponse>(
      `/companies/${companyId}/pitch-deck`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  getPitchDeck: async (
    companyId: string
  ): Promise<PitchDeckResponse | null> => {
    const response = await api.get<PitchDeckResponse | null>(
      `/companies/${companyId}/pitch-deck`
    );
    return response.data;
  },

  saveFundingNarrative: async (
    companyId: string,
    data: SaveFundingNarrativeRequest
  ): Promise<{ narrative: string }> => {
    const response = await api.post<{ narrative: string }>(
      `/companies/${companyId}/funding-narrative`,
      data
    );
    return response.data;
  },

  getFundingNarrative: async (
    companyId: string
  ): Promise<FundingNarrativeResponse> => {
    const response = await api.get<FundingNarrativeResponse>(
      `/companies/${companyId}/funding-narrative`
    );
    return response.data;
  },

  saveOutreachCampaign: async (
    companyId: string,
    data: SaveOutreachCampaignRequest
  ): Promise<void> => {
    await api.post(`/companies/${companyId}/outreach-campaign`, data);
  },

  getFundingProfile: async (
    companyId: string
  ): Promise<FundingProfileResponse> => {
    const response = await api.get<FundingProfileResponse>(
      `/companies/${companyId}/funding-profile`
    );
    return response.data;
  },

  getFinancialSummary: async (
    companyId: string
  ): Promise<FinancialSummaryResponse> => {
    const response = await api.get<FinancialSummaryResponse>(
      `/companies/${companyId}/financial-summary`
    );
    return response.data;
  },

  saveCashPosition: async (
    companyId: string,
    data: SaveCashPositionRequest
  ): Promise<CashPositionResponse> => {
    const response = await api.post<CashPositionResponse>(
      `/companies/${companyId}/cash-position`,
      data
    );
    return response.data;
  },

  saveMonthlyRevenue: async (
    companyId: string,
    data: SaveMonthlyRevenueRequest
  ): Promise<MonthlyRevenueResponse[]> => {
    const response = await api.post<MonthlyRevenueResponse[]>(
      `/companies/${companyId}/monthly-revenue`,
      data
    );
    return response.data;
  },

  getMonthlyRevenue: async (
    companyId: string
  ): Promise<MonthlyRevenueResponse[]> => {
    const response = await api.get<MonthlyRevenueResponse[]>(
      `/companies/${companyId}/monthly-revenue`
    );
    return response.data;
  },

  saveKpiBaseline: async (
    companyId: string,
    data: SaveKpiBaselineRequest
  ): Promise<KpiBaselineResponse> => {
    const response = await api.post<KpiBaselineResponse>(
      `/companies/${companyId}/kpis`,
      data
    );
    return response.data;
  },

  getKpiBaseline: async (
    companyId: string
  ): Promise<KpiBaselineResponse | null> => {
    const response = await api.get<KpiBaselineResponse | null>(
      `/companies/${companyId}/kpis`
    );
    return response.data;
  },

  uploadFinancialReport: async (
    companyId: string,
    formData: FormData
  ): Promise<FinancialReportResponse> => {
    const response = await api.post<FinancialReportResponse>(
      `/companies/${companyId}/financial-reports`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  getFinancialReports: async (
    companyId: string
  ): Promise<FinancialReportResponse[]> => {
    const response = await api.get<FinancialReportResponse[]>(
      `/companies/${companyId}/financial-reports`
    );
    return response.data;
  },

  // ============ PHASE 4: EQUITY & DILUTION ============

  getCapTable: async (companyId: string) => {
    const response = await api.get(`/companies/${companyId}/cap-table`);
    return response.data;
  },

  simulateDilution: async (
    companyId: string,
    data: SimulateDilutionRequest
  ): Promise<DilutionSimulationResponse> => {
    const response = await api.post<DilutionSimulationResponse>(
      `/companies/${companyId}/dilution-simulation`,
      data
    );
    return response.data;
  },

  submitCapTable: async (
    companyId: string,
    data: SubmitCapTableRequest
  ): Promise<CapTableSnapshotResponse> => {
    const response = await api.post<CapTableSnapshotResponse>(
      `/companies/${companyId}/cap-table`,
      data
    );
    return response.data;
  },

  getLatestCapTableSnapshot: async (
    companyId: string
  ): Promise<CapTableSnapshotResponse | null> => {
    const response = await api.get<CapTableSnapshotResponse | null>(
      `/companies/${companyId}/cap-table/snapshot`
    );
    return response.data;
  },

  saveVestingSchedules: async (
    companyId: string,
    data: SaveVestingScheduleRequest
  ): Promise<VestingScheduleResponse[]> => {
    const response = await api.post<VestingScheduleResponse[]>(
      `/companies/${companyId}/vesting`,
      data
    );
    return response.data;
  },

  getVestingSchedules: async (
    companyId: string
  ): Promise<VestingScheduleResponse[]> => {
    const response = await api.get<VestingScheduleResponse[]>(
      `/companies/${companyId}/vesting`
    );
    return response.data;
  },

  saveOwnershipHistory: async (
    companyId: string,
    data: SaveOwnershipHistoryRequest
  ): Promise<OwnershipHistoryResponse[]> => {
    const response = await api.post<OwnershipHistoryResponse[]>(
      `/companies/${companyId}/ownership-history`,
      data
    );
    return response.data;
  },

  getOwnershipHistory: async (
    companyId: string
  ): Promise<OwnershipHistoryResponse[]> => {
    const response = await api.get<OwnershipHistoryResponse[]>(
      `/companies/${companyId}/ownership-history`
    );
    return response.data;
  },

  recordShareIssuance: async (
    companyId: string,
    data: RecordShareIssuanceRequest
  ): Promise<ShareIssuanceResponse> => {
    const response = await api.post<ShareIssuanceResponse>(
      `/companies/${companyId}/share-issuance`,
      data
    );
    return response.data;
  },

  // ============ PHASE 6: DATA ROOM ============

  uploadDataRoomDocument: async (companyId: string, formData: FormData) => {
    const response = await api.post(
      `/companies/${companyId}/dataroom/documents`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  getDataRoom: async (
    companyId: string
  ): Promise<DataRoomStatusResponse> => {
    const response = await api.get<DataRoomStatusResponse>(
      `/companies/${companyId}/dataroom`
    );
    return response.data;
  },

  grantDataRoomAccess: async (
    companyId: string,
    investorId: string,
    accessLevel: string,
    daysValid: number = 7
  ) => {
    const response = await api.post(
      `/companies/${companyId}/dataroom/access`,
      { investorId, accessLevel, daysValid }
    );
    return response.data;
  },

  revokeDataRoomAccess: async (companyId: string, investorId: string) => {
    const response = await api.delete(
      `/companies/${companyId}/dataroom/access/${investorId}`
    );
    return response.data;
  },

  updateNdaRequirement: async (companyId: string, required: boolean) => {
    const response = await api.put(`/companies/${companyId}/dataroom/nda`, required);
    return response.data;
  },

  // ============ PHASE 7: AI REVIEW ============

  runAiReview: async (companyId: string): Promise<AiReviewResponse> => {
    const response = await api.post<AiReviewResponse>(
      `/companies/${companyId}/ai-review`
    );
    return response.data;
  },

  getAiReview: async (companyId: string): Promise<AiReviewResponse> => {
    const response = await api.get<AiReviewResponse>(
      `/companies/${companyId}/ai-review`
    );
    return response.data;
  },

  getRecommendations: async (
    companyId: string
  ): Promise<RecommendationDto[]> => {
    const response = await api.get<RecommendationDto[]>(
      `/companies/${companyId}/recommendations`
    );
    return response.data;
  },

  awardInvestorReadyBadge: async (companyId: string) => {
    const response = await api.post(
      `/companies/${companyId}/investor-ready`
    );
    return response.data;
  },

  // ============ PHASE 8: INVESTOR MATCHING ============

  getInvestorMatches: async (
    companyId: string
  ): Promise<InvestorMatchResponse[]> => {
    const response = await api.get<InvestorMatchResponse[]>(
      `/companies/${companyId}/investor-matches`
    );
    return response.data;
  },

  recordInvestorInteraction: async (
    companyId: string,
    matchId: string,
    interactionType: string,
    details: string
  ) => {
    const response = await api.post(
      `/companies/${companyId}/investor-interaction`,
      { matchId, interactionType, details }
    );
    return response.data;
  },

  getMatchingInsights: async (companyId: string) => {
    const response = await api.get(
      `/companies/${companyId}/matching-insights`
    );
    return response.data;
  },

  // ============ PHASE 9: DEAL EXECUTION ============

  createDeal: async (
    companyId: string,
    investorId: string,
    termSheet: Record<string, unknown>
  ): Promise<DealStatusResponse> => {
    const response = await api.post<DealStatusResponse>(
      `/companies/${companyId}/deals`,
      { investorId, termSheet }
    );
    return response.data;
  },

  getDeal: async (dealId: string): Promise<DealStatusResponse> => {
    const response = await api.get<DealStatusResponse>(`/companies/deals/${dealId}`);
    return response.data;
  },

  getCompanyDeals: async (companyId: string): Promise<DealStatusResponse[]> => {
    const response = await api.get<DealStatusResponse[]>(
      `/companies/${companyId}/deals`
    );
    return response.data;
  },

  updateTermSheet: async (dealId: string, termSheet: Record<string, unknown>) => {
    const response = await api.put(
      `/companies/deals/${dealId}/term-sheet`,
      termSheet
    );
    return response.data;
  },

  progressChecklist: async (dealId: string, item: Record<string, unknown>) => {
    const response = await api.post(
      `/companies/deals/${dealId}/checklist`,
      item
    );
    return response.data;
  },

  closeDeal: async (dealId: string) => {
    const response = await api.post(
      `/companies/deals/${dealId}/close`
    );
    return response.data;
  },

  // ============ BACKGROUND JOBS ============

  enqueueAiReview: async (companyId: string): Promise<JobStatus> => {
    const response = await api.post<JobStatus>(
      `/jobs/${companyId}/ai-review`
    );
    return response.data;
  },

  enqueueInvestorMatching: async (companyId: string): Promise<JobStatus> => {
    const response = await api.post<JobStatus>(
      `/jobs/${companyId}/investor-matching`
    );
    return response.data;
  },

  enqueueDataRoomAnalysis: async (companyId: string): Promise<JobStatus> => {
    const response = await api.post<JobStatus>(
      `/jobs/${companyId}/data-room-analysis`
    );
    return response.data;
  },

  enqueueFinancialProjections: async (companyId: string): Promise<JobStatus> => {
    const response = await api.post<JobStatus>(
      `/jobs/${companyId}/financial-projections`
    );
    return response.data;
  },

  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    const response = await api.get<JobStatus>(`/jobs/${jobId}`);
    return response.data;
  },
};

export default entrepreneurApi;
