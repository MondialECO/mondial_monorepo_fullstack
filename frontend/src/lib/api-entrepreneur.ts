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
  role: string;
  nationality: string;
  ownershipPercent: number;
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
  shareType: "preferred" | "safe" | "note";
  capitalAllocation: CapitalAllocation[];
  resourceMap: ResourceMap;
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
    data: any
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

  getFinancialSummary: async (
    companyId: string
  ): Promise<FinancialSummaryResponse> => {
    const response = await api.get<FinancialSummaryResponse>(
      `/companies/${companyId}/financial-summary`
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
    termSheet: any
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

  updateTermSheet: async (dealId: string, termSheet: any) => {
    const response = await api.put(
      `/companies/deals/${dealId}/term-sheet`,
      termSheet
    );
    return response.data;
  },

  progressChecklist: async (dealId: string, item: any) => {
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
