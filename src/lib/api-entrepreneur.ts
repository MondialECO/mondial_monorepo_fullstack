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

export interface CompanySummaryDto {
  id: string;
  companyName: string;
  legalName?: string;
  industry?: string;
  tagline?: string;
  logo?: string;
  legalStructure?: string;
  currentPhase: number;
  completedPhases: number[];
  sourceBusinessIdeaId?: string;
  isInvestorReady: boolean;
  isActive: boolean;
  updatedAt?: string;
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

export interface QuarterlyRevenueResponse {
  quarter: string; // "Q1", "Q2", "Q3", "Q4"
  revenue: number;
  monthCount: number;
}

export interface SaveKpiBaselineRequest {
  mrr: number;
  arr: number;
  grossMarginPercent: number;
  cac: number;
  ltv: number;
  churnPercent: number;
  activeAccounts: number;
  // Optional Step-3 extras → persisted on the company (MonthlyBurn / Nps).
  burnRate?: number;
  nps?: number;
}

export interface SaveConceptRequest {
  oneLiner: string;
  problemStatement: string;
  solutionDescription: string;
  stage: string;        // idea | mvp | beta | revenue | growth
  businessModel: string;
  sectorTags: string[]; // 1–3
  keywordTags: string[]; // 0–5
}

export interface ConceptResponse {
  oneLiner: string;
  problemStatement: string;
  solutionDescription: string;
  stage: string;
  businessModel: string;
  sectorTags: string[];
  keywordTags: string[];
  clarityScore: number;
  recordedAt: string;
}

export interface KpiBaselineResponse {
  mrr: number;
  arr: number;
  grossMarginPercent: number;
  cac: number;
  ltv: number;
  churnPercent: number;
  activeAccounts: number;
  burnRate?: number | null;
  nps?: number | null;
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
  // Phase 3 valuation-model outputs (Step 2 display).
  confidenceScore?: number;
  riskDiscountRate?: number;
  revenueMultiple?: number;
  industry?: string;
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
  /** Explicit minimum cheque size (EUR). Optional at write time. */
  minimumTicketEur?: number;
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
  minimumTicketEur?: number;
  capitalAllocation: CapitalAllocation[];
  resourceMap?: ResourceMap;
  pitchDeckFileName?: string;
  pitchDeckFileSize?: number;
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
  downloadCount: number;
  fileName: string;
  mimeType?: string;
  fileSize: number;
  storagePath?: string;
  uploadedBy?: string;
}

export interface DataRoomAccessGrant {
  investorId: string;
  investorName?: string;
  accessLevel: string;
  grantedAt: string;
  expiresAt: string;
}

export interface DataRoomStatusResponse {
  isLive: boolean;
  ndaRequired: boolean;
  /** Set once an investor has signed; NDA can no longer be disabled. */
  ndaLockedAt?: string | null;
  totalDocuments: number;
  documents: DataRoomDocumentResponse[];
  accessGrants: DataRoomAccessGrant[];
}

export interface Phase6AccessLogResponse {
  id: string;
  documentId: string;
  investorId: string;
  eventType: 'view' | 'download';
  occurredAt: string;
}

export interface DocumentEngagementResponse {
  documentId: string;
  title: string;
  category: string;
  viewCount: number;
  downloadCount: number;
  uniqueInvestors: number;
  lastEventAt?: string;
}

export interface InvestorEngagementResponse {
  investorId: string;
  viewCount: number;
  downloadCount: number;
  documentsTouched: number;
  lastEventAt?: string;
}

export interface DataRoomAnalyticsResponse {
  totalDocuments: number;
  totalViews: number;
  totalDownloads: number;
  uniqueInvestorsEngaged: number;
  documentEngagement: DocumentEngagementResponse[];
  investorEngagement: InvestorEngagementResponse[];
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

export interface PitchDeckAnalysis {
  grade: string;
  averageScore: number;
  clarityNarrative: number;
  marketSizeProof: number;
  tractionMetrics: number;
  teamPedigree: number;
}

export interface ExpertRiskItem {
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  explanation: string;
  evidence: string;
  recommendedAction: string;
}

export interface CrossModuleInconsistency {
  moduleA: string;
  moduleB: string;
  description: string;
  evidence: string;
  severity: string;
}

export interface MissingItemGap {
  category: string;
  description: string;
  requiredBy: string;
}

export interface PitchRefinementItem {
  section: string;
  problem: string;
  recommendation: string;
  priority: string;
}

export interface ActionRemediationItem {
  phaseNumber: number;
  title: string;
  description: string;
  priority: string;
  potentialPointGain: number;
}

export interface AiReviewResponse {
  overallScore: number;
  scoreBreakdown: ScoreBreakdownDto;
  investorReadyBadge: boolean;
  isInvestorReady?: boolean;
  investorReadyBadgeAwardedAt?: string;
  recommendations: RecommendationDto[];
  pitchDeckAnalysis: PitchDeckAnalysis;
  reviewedAt: string;
  executiveSummary?: string;
  strengths?: string[];
  weaknesses?: string[];
  risks?: ExpertRiskItem[];
  inconsistencies?: CrossModuleInconsistency[];
  missingItems?: MissingItemGap[];
  pitchRecommendations?: PitchRefinementItem[];
  actionItems?: ActionRemediationItem[];
  pitchDeckContentAvailable?: boolean;
  isFresh?: boolean;
  isCurrentlyInvestorReady?: boolean;
  dataRoomLastMaterialChangeAt?: string | null;
  investorReadinessInputsLastMaterialChangeAt?: string | null;
}

export interface AwardInvestorReadyBadgeResponse {
  isInvestorReady: boolean;
  badgeAwarded: boolean;
  issuedAt?: string;
}

export interface AiReviewHistoryEntry {
  id: string;
  companyId: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdownDto;
  investorReadyBadge: boolean;
  recommendations: RecommendationDto[];
  pitchDeckAnalysis: PitchDeckAnalysis;
  reviewedAt: string;
  engineVersion: string;
  executiveSummary?: string;
  strengths?: string[];
  weaknesses?: string[];
  risks?: ExpertRiskItem[];
  inconsistencies?: CrossModuleInconsistency[];
  missingItems?: MissingItemGap[];
  pitchRecommendations?: PitchRefinementItem[];
  actionItems?: ActionRemediationItem[];
}

// Phase 8
export interface InvestorMeetingRecord {
  meetingId: string;
  startsAt: string;
  durationMinutes: number;
  timezone: string;
  meetingType: string;
  note: string;
  status: "proposed" | "confirmed" | "cancelled";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleMeetingRequest {
  startsAt: string;
  durationMinutes?: number;
  timezone?: string;
  meetingType?: string;
  note?: string;
}

export interface InvestorMatchResponse {
  matchId: string;
  investorId: string;
  investorName?: string;
  matchScore: number;
  investorType?: string;
  preferredRound?: string;
  investmentRange?: string;
  preferredSectors: string[];
  status: string;
  entrepreneurInterest?: string;
  investorInterest?: string;
  handshakeConfirmedAt?: string;
  scheduledMeeting?: InvestorMeetingRecord;
  matchRationale?: string;
  engineVersion?: string;
  matchedAt?: string;
  savedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
}

export interface InvestorIncomingMatchResponse {
  matchId: string;
  companyId: string;
  companyName: string;
  industry: string;
  fundingRoundType: string;
  fundingAskAmount: number;
  country: string;
  tagline?: string;
  elevatorPitch?: string;
  matchScore: number;
  matchRationale?: string;
  entrepreneurInterest: string;
  investorInterest: string;
  status: string;
  handshakeConfirmedAt?: string;
  scheduledMeeting?: InvestorMeetingRecord;
  phase7IntelligenceSnapshot?: {
    validatedSectorTags?: string[];
    riskBand?: string;
    fundingFitSignals?: string[];
    recommendedInvestorTypes?: string[];
    qualitativeStrengthTags?: string[];
  };
  matchedAt?: string;
}

export interface PublicInvestorProfile {
  id: string;
  name: string;
  type: string;
  headline?: string;
  bio?: string;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  socialLinks?: Record<string, string>;
  isPublic?: boolean;
  preferredSectors: string[];
  preferredStages: string[];
  minCheckSize: number;
  maxCheckSize: number;
  preferredGeographies: string[];
  requiresProRataRights?: boolean;
  requiresBoardSeat?: boolean;
  preferredEquityTypes?: string[];
  thesisStatement?: string;
  targetReturnMultiple?: string;
  followOnPolicy?: string;
  preferredRole?: string;
  boardParticipationLevel?: string;
  successfulExits?: number;
  averageCheckSize?: number;
  completedDeals?: number;
  activeInvestments?: number;
  profileScore?: number;
}

export interface MatchingInsightsResponse {
  totalMatches: number;
  highScoreMatches: number;
  interactionsCount: number;
  averageScore: number;
  lastMatchedAt?: string;
}

export interface UpdateMatchStatusRequest {
  status: string; // saved | accepted | rejected | viewed | new | passed | interested | reviewing | matched
}

// Phase 9
// Round summary: real-time aggregate of deal committed amounts + round target
// Active term sheet — mirrors backend TermSheetResponse DTO (camelCased).
export interface TermSheetResponse {
  totalRaiseAmount: number;
  postMoneyValuation: number;
  equityType: string;
  investorEquityPercent: number;
  proRataRights: boolean;
  status: string;
  signedAt?: string | null;
  shareClass: string;
  liquidationPref: string;
  boardSeat: string;
  hasBoardSeat?: boolean | null;
  antiDilutionType: string;
  closingDeadline: string;
  expiresAt: string;
}

export interface RoundSummaryResponse {
  totalDeals: number;
  committedAmountEur: number;
  roundTargetEur: number;
  remainingEur: number;
  percentFilled: number;
  interestedCount: number;
  inDiscussionCount: number;
  termSheetCount: number;
  closedCount: number;
}

// Matchmaking Process timeline — round-level events (auto-seeded from Phase 5/8).
export interface TimelineEventResponse {
  eventId: string;
  eventDate: string;
  title: string;
  subtitle: string;
  status: "completed" | "active" | "pending";
  color: "green" | "blue" | "amber" | "gray";
}

// 12-state deal lifecycle. Mirrors backend Phase9Requirements.DealStatusWhitelist.
export type DealStatus =
  | 'initiated'
  | 'contacted'
  | 'interested'
  | 'meeting_scheduled'
  | 'due_diligence'
  | 'negotiating'
  | 'term_sheet'
  | 'agreement_sent'
  | 'signed'
  | 'completed'
  | 'rejected'
  | 'withdrawn';

export type TermSheetStatus =
  | 'draft' | 'proposed' | 'negotiating' | 'agreed' | 'signed' | 'rejected';

export type ParticipantStatus =
  | 'interested' | 'negotiating' | 'committed' | 'funded' | 'withdrawn';

export type DueDiligenceStatus =
  | 'pending' | 'in_progress' | 'completed' | 'flagged';

export type DealDocumentKind =
  | 'term_sheet' | 'signed_agreement' | 'due_diligence' | 'other';

export interface TimelineItem {
  id: string;
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  occurredAt: string;
  notes?: string;
  dealId?: string;
}

export interface DealStatusResponse {
  dealId: string;
  status: DealStatus | string;
  progressPercent: number;
  termSheet: {
    totalRaiseAmount: number;
    postMoneyValuation: number;
    equityType: string;
    investorEquityPercent: number;
    proRataRights: boolean;
    status: TermSheetStatus | string;
    signedAt?: string;
    shareClass?: string;
    liquidationPref?: string;
    boardSeat?: string;
    hasBoardSeat?: boolean;
    antiDilutionType?: string;
    closingDeadline?: string;
    expiresAt?: string;
  };
  closingChecklist: Array<{
    item: string;
    completed: boolean;
    owner: string;
    dueDate?: string;
  }>;
  dueDiligenceChecklist: Array<{
    itemName: string;
    category: 'legal' | 'financial' | 'technical' | 'business';
    status: 'pending' | 'in_progress' | 'completed' | 'flagged';
    owner?: string;
    addedAt?: string;
  }>;
  dealDocuments: DealDocumentResponse[];
  investors: Array<{
    investorId: string;
    investorName: string;
    investorType?: string;
    committedAmount: number;
    status: ParticipantStatus | string;
  }>;
  currentTurn?: string;
  revisions?: Array<{
    revisionNumber: number;
    proposedByRole: string;
    status: string;
    note?: string | null;
    createdAt: string;
    viewedAt?: string | null;
    respondedAt?: string | null;
    terms: {
      totalRaiseAmount: number;
      postMoneyValuation: number;
      equityType: string;
      investorEquityPercent: number;
      proRataRights: boolean;
      status: string;
      signedAt?: string;
    };
  }>;
  founderSignature?: {
    signedAt?: string | null;
    signedBy?: string | null;
  } | null;
  investorSignature?: {
    signedAt?: string | null;
    signedBy?: string | null;
  } | null;
}

export interface DealDocumentResponse {
  documentId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentKind: DealDocumentKind | string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface DealActivityLogResponse {
  id: string;
  dealId: string;
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  actorUserId: string;
  occurredAt: string;
  notes?: string;
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
  getCurrentPhase: async (
    companyId?: string
  ): Promise<CompanyProgressResponse> => {
    const url = companyId
      ? `/companies/current-phase?companyId=${encodeURIComponent(companyId)}`
      : "/companies/current-phase";
    const response = await api.get<CompanyProgressResponse>(url);
    return response.data;
  },

  // Multi-Company Context
  getMyCompanies: async (): Promise<CompanySummaryDto[]> => {
    const response = await api.get<CompanySummaryDto[]>("/companies/my-companies");
    return response.data;
  },

  setActiveCompany: async (companyId: string): Promise<CompanySummaryDto> => {
    const response = await api.post<CompanySummaryDto>("/companies/active", {
      companyId,
    });
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

  getBeneficialOwners: async (companyId: string) => {
    const response = await api.get(
      `/companies/${companyId}/beneficial-owners`
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

  getQuarterlyRevenue: async (
    companyId: string
  ): Promise<QuarterlyRevenueResponse[]> => {
    const response = await api.get<QuarterlyRevenueResponse[]>(
      `/companies/${companyId}/quarterly-revenue`
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

  saveConcept: async (
    companyId: string,
    data: SaveConceptRequest
  ): Promise<ConceptResponse> => {
    const response = await api.post<ConceptResponse>(
      `/companies/${companyId}/concept`,
      data
    );
    return response.data;
  },

  getConcept: async (
    companyId: string
  ): Promise<ConceptResponse | null> => {
    const response = await api.get<ConceptResponse | null>(
      `/companies/${companyId}/concept`
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

  markExitReviewed: async (companyId: string): Promise<void> => {
    await api.post(`/companies/${companyId}/exit-reviewed`);
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

  deleteDataRoomDocument: async (
    companyId: string,
    documentId: string
  ): Promise<DataRoomStatusResponse> => {
    const response = await api.delete<DataRoomStatusResponse>(
      `/companies/${companyId}/dataroom/documents/${documentId}`
    );
    return response.data;
  },

  replaceDataRoomDocument: async (
    companyId: string,
    documentId: string,
    formData: FormData
  ): Promise<DataRoomDocumentResponse> => {
    const response = await api.post<DataRoomDocumentResponse>(
      `/companies/${companyId}/dataroom/documents/${documentId}/replace`,
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
    investorEmail: string,
    accessLevel: string,
    daysValid: number = 7
  ) => {
    const response = await api.post(
      `/companies/${companyId}/dataroom/access`,
      { investorEmail, accessLevel, daysValid }
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
    // Backend binds [FromBody] bool, which requires a raw JSON literal (true/false).
    // Axios only serializes a primitive boolean when the JSON content type is set
    // explicitly; without this header the body is unparseable and the API returns 400.
    const response = await api.put(
      `/companies/${companyId}/dataroom/nda`,
      required,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  },

  publishDataRoom: async (
    companyId: string
  ): Promise<DataRoomStatusResponse> => {
    const response = await api.post<DataRoomStatusResponse>(
      `/companies/${companyId}/dataroom/publish`
    );
    return response.data;
  },

  downloadDataRoomDocument: async (
    companyId: string,
    documentId: string
  ): Promise<Blob> => {
    const response = await api.get(
      `/companies/${companyId}/dataroom/documents/${documentId}`,
      { responseType: 'blob' }
    );
    return response.data as Blob;
  },

  trackDataRoomView: async (
    companyId: string,
    documentId: string
  ): Promise<Phase6AccessLogResponse> => {
    const response = await api.post<Phase6AccessLogResponse>(
      `/companies/${companyId}/dataroom/track-view`,
      { documentId }
    );
    return response.data;
  },

  trackDataRoomDownload: async (
    companyId: string,
    documentId: string
  ): Promise<Phase6AccessLogResponse> => {
    const response = await api.post<Phase6AccessLogResponse>(
      `/companies/${companyId}/dataroom/track-download`,
      { documentId }
    );
    return response.data;
  },

  getDataRoomAnalytics: async (
    companyId: string
  ): Promise<DataRoomAnalyticsResponse> => {
    const response = await api.get<DataRoomAnalyticsResponse>(
      `/companies/${companyId}/dataroom/analytics`
    );
    return response.data;
  },

  getDataRoomActivityTimeline: async (
    companyId: string
  ): Promise<Phase6AccessLogResponse[]> => {
    const response = await api.get<Phase6AccessLogResponse[]>(
      `/companies/${companyId}/dataroom/activity-timeline`
    );
    return response.data;
  },

  getDataRoomInvestorEngagement: async (
    companyId: string
  ): Promise<InvestorEngagementResponse[]> => {
    const response = await api.get<InvestorEngagementResponse[]>(
      `/companies/${companyId}/dataroom/investor-engagement`
    );
    return response.data;
  },

  acceptDataRoomNda: async (
    companyId: string,
    ndaText: string
  ): Promise<void> => {
    await api.post(`/companies/${companyId}/dataroom/nda/accept`, { ndaText });
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

  awardInvestorReadyBadge: async (
    companyId: string
  ): Promise<AwardInvestorReadyBadgeResponse> => {
    const response = await api.post<AwardInvestorReadyBadgeResponse>(
      `/companies/${companyId}/investor-ready`
    );
    return response.data;
  },

  getAiReviewHistory: async (
    companyId: string
  ): Promise<AiReviewHistoryEntry[]> => {
    const response = await api.get<AiReviewHistoryEntry[]>(
      `/companies/${companyId}/ai-review/history`
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

  getMatchingInsights: async (
    companyId: string
  ): Promise<MatchingInsightsResponse> => {
    const response = await api.get<MatchingInsightsResponse>(
      `/companies/${companyId}/matching-insights`
    );
    return response.data;
  },

  regenerateInvestorMatches: async (
    companyId: string
  ): Promise<InvestorMatchResponse[]> => {
    const response = await api.post<InvestorMatchResponse[]>(
      `/companies/${companyId}/investor-matches/regenerate`
    );
    return response.data;
  },

  updateMatchStatus: async (
    companyId: string,
    matchId: string,
    status: string
  ): Promise<InvestorMatchResponse> => {
    const response = await api.post<InvestorMatchResponse>(
      `/companies/${companyId}/investor-matches/${matchId}/status`,
      { status }
    );
    return response.data;
  },

  scheduleMeeting: async (
    companyId: string,
    matchId: string,
    data: ScheduleMeetingRequest
  ): Promise<InvestorMatchResponse> => {
    const response = await api.post<InvestorMatchResponse>(
      `/companies/${companyId}/investor-matches/${matchId}/schedule-meeting`,
      data
    );
    return response.data;
  },

  updateMeetingStatus: async (
    companyId: string,
    matchId: string,
    status: string
  ): Promise<InvestorMatchResponse> => {
    const response = await api.post<InvestorMatchResponse>(
      `/companies/${companyId}/investor-matches/${matchId}/meeting-status`,
      { status }
    );
    return response.data;
  },

  getPublicInvestorProfile: async (
    investorId: string
  ): Promise<PublicInvestorProfile> => {
    const response = await api.get<PublicInvestorProfile>(
      `/investors/${investorId}`
    );
    return response.data;
  },

  getInvestorIncomingMatches: async (): Promise<InvestorIncomingMatchResponse[]> => {
    const response = await api.get<InvestorIncomingMatchResponse[]>(
      `/investor/incoming-matches`
    );
    return response.data;
  },

  respondToInvestorMatch: async (
    matchId: string,
    action: 'interested' | 'passed'
  ): Promise<InvestorIncomingMatchResponse> => {
    const response = await api.post<InvestorIncomingMatchResponse>(
      `/investor/matches/${matchId}/respond`,
      { action }
    );
    return response.data;
  },

  // ============ PHASE 9: DEAL EXECUTION ============

  getRoundSummary: async (companyId: string): Promise<RoundSummaryResponse> => {
    const response = await api.get<RoundSummaryResponse>(
      `/companies/${companyId}/deals/summary`
    );
    return response.data;
  },

  getTimeline: async (companyId: string): Promise<TimelineEventResponse[]> => {
    const response = await api.get<TimelineEventResponse[]>(
      `/companies/${companyId}/deals/timeline`
    );
    return response.data;
  },

  getActiveTermSheet: async (
    companyId: string
  ): Promise<TermSheetResponse | null> => {
    try {
      const response = await api.get<TermSheetResponse>(
        `/companies/${companyId}/term-sheets/active`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

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

  updateDealStatus: async (
    dealId: string,
    status: DealStatus,
    notes?: string
  ): Promise<DealStatusResponse> => {
    const response = await api.post<DealStatusResponse>(
      `/companies/deals/${dealId}/status`,
      { status, notes }
    );
    return response.data;
  },

  signTermSheet: async (
    dealId: string,
    file: File
  ): Promise<DealStatusResponse> => {
    const form = new FormData();
    form.append('File', file);
    const response = await api.post<DealStatusResponse>(
      `/companies/deals/${dealId}/term-sheet/sign`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  mutateDueDiligenceItem: async (
    dealId: string,
    item: {
      itemName: string;
      category: 'legal' | 'financial' | 'technical' | 'business';
      status: DueDiligenceStatus;
      assignedTo?: string;
      dueDate?: string;
      notes?: string;
    }
  ): Promise<DealStatusResponse> => {
    const response = await api.post<DealStatusResponse>(
      `/companies/deals/${dealId}/due-diligence`,
      item
    );
    return response.data;
  },

  getDealActivity: async (dealId: string): Promise<DealActivityLogResponse[]> => {
    const response = await api.get<DealActivityLogResponse[]>(
      `/companies/deals/${dealId}/activity`
    );
    return response.data;
  },

  uploadDealDocument: async (
    dealId: string,
    file: File,
    documentKind: DealDocumentKind
  ): Promise<DealDocumentResponse> => {
    const form = new FormData();
    form.append('File', file);
    form.append('DocumentKind', documentKind);
    const response = await api.post<DealDocumentResponse>(
      `/companies/deals/${dealId}/documents`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  getDealDocumentUrl: (dealId: string, documentId: string): string => {
    return `/companies/deals/${dealId}/documents/${documentId}`;
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

  // ============ ACQUISITIONS -> BUILD COMPANY ============

  buildCompanyFromAcquisition: async (
    dealId: string,
    data: BuildAcquisitionCompanyRequest
  ): Promise<BuildAcquisitionCompanyResponse> => {
    const response = await api.post<BuildAcquisitionCompanyResponse>(
      `/entrepreneur/acquisitions/${dealId}/build-company`,
      data
    );
    return response.data;
  },
};

export interface BuildAcquisitionCompanyRequest {
  companyName?: string;
  industry?: string;
  tagline?: string;
  legalStructure?: string;
  ownership?: Array<{
    holder: string;
    percent: number;
    isFounder: boolean;
    isEsop: boolean;
  }>;
  totalAsk?: number;
  useOfFunds?: Array<{
    category: string;
    percent: number;
    amount?: number;
  }>;
  investorTypesTargeted?: string[];
}

export interface BuildAcquisitionCompanyResponse {
  companyId: string;
  companyName: string;
  sourceBusinessIdeaId: string;
  sourceDealId: string;
  currentPhase: number;
  alreadyExisted: boolean;
  activeOperatingContext: string;
}

export default entrepreneurApi;
