import api from '@/lib/axios';
import { ProjectInterest } from '@/lib/api-creator-journey';

export interface MarketplaceProject {
  ideaId: string;
  projectName: string;
  tagline: string;
  problem: string;
  targetUser: string;
  solution: string;
  sector: string;
  country?: string;
  stage: string;
  clarityScore: number;
  readinessScore: number;
  dealModes: string[];
  askingPrice?: number | null;
  ndaRequired: boolean;
  audience: string;
  status: string;
  publishedAt?: string;
}

export interface MarketplaceProjectsQuery {
  sector?: string;
  dealMode?: string;
  search?: string;
}

export interface NdaStatus {
  ideaId: string;
  projectName: string;
  creatorName: string;
  entrepreneurName: string;
  interestId: string;
  interestStatus: string;
  ndaRequired: boolean;
  ndaSigned: boolean;
  ndaSignedAt?: string | null;
  ndaVersion: string;
  accessGranted: boolean;
  accessExpiresAt?: string | null;
}

export interface PrivatePricingTier {
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  isHighlighted: boolean;
}

export interface PrivateDocument {
  id: string;
  title: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  downloadable: boolean;
}

export interface PrivateCompetitor {
  name: string;
  positioning?: string | null;
  strengths: string[];
  weaknesses: string[];
  ourAdvantage?: string | null;
}

export interface PrivateRevenueStream {
  name: string;
  description?: string | null;
}

export interface PrivateGtmPhase {
  name: string;
  description?: string | null;
}

export interface PrivateMilestone {
  phase: string;
  deliverable: string;
  timeframe: string;
}

export interface PrivateRisk {
  category: string;
  risk: string;
  mitigation: string;
}

export interface PrivateMonthlyMetric {
  month: number;
  amount: number;
  notes?: string | null;
}

export interface PrivateCostMetric {
  month: number;
  fixedCosts: number;
  variableCosts: number;
  notes?: string | null;
}

export interface PrivateCashFlowMetric {
  month: number;
  netCashFlow: number;
  endingBalance: number;
  notes?: string | null;
}

export interface PrivateTeamRequirement {
  role: string;
  cost: number;
  durationMonths: number;
  oneTime: boolean;
}

export interface PrivateSaasItem {
  name: string;
  monthlyCost: number;
}

export interface PrivateBudgetBreakdown {
  teamPct: number;
  toolsPct: number;
  legalPct: number;
  miscPct: number;
}

export interface PrivateChannelMix {
  channel: string;
  percent: number;
}

export interface PrivateWebPresence {
  id: string;
  label: string;
  done: boolean;
}

export interface PrivateGtmWeek {
  week: number;
  title: string;
  tasks: string[];
  completed: boolean;
}

export interface PrivateInvestorReadiness {
  total: number;
  label: string;
  conceptClarity: number;
  marketEvidence: number;
  financialModel: number;
  legalReadiness: number;
  teamCredibility: number;
}

export interface PrivateLegalItem {
  id: string;
  label: string;
  category: string;
  status: string;
  badge?: string | null;
  spSpecialty?: string | null;
}

export interface PrivateLegalChecklist {
  completedCount: number;
  totalCount: number;
  items: PrivateLegalItem[];
}

export interface PrivateFormationOption {
  code: string;
  description: string;
  capital: string;
  formationTime: string;
  estimatedCost: string;
}

export interface PrivateSkillGap {
  label: string;
  spSpecialty: string;
}

export interface PrivateCofounderDraft {
  roleNeeded: string;
  equityRange: string;
  locationPreference: string;
}

export interface PrivateFormation {
  recommendedType: string;
  recommendationReason: string;
  selectedType: string;
  options: PrivateFormationOption[];
  youHave: string[];
  youNeed: PrivateSkillGap[];
  cofounderDraft?: PrivateCofounderDraft | null;
}

export interface PrivateDiscoveryInputs {
  sectors: string[];
  observedProblem: string;
  strengths: string[];
}

export interface PrivateIntelligence {
  investorReadiness?: PrivateInvestorReadiness | null;
  legalChecklist?: PrivateLegalChecklist | null;
  formation?: PrivateFormation | null;
  discoveryInputs?: PrivateDiscoveryInputs | null;
  available: boolean;
}

export interface PrivateMarketplaceProject extends MarketplaceProject {
  concept?: string;
  marketGap?: string;
  creatorEdge?: string;
  existingAlternatives?: string;
  whyNow?: string;
  riskiestAssumption?: string;
  targetMarket?: string;
  geography?: string;
  category?: string;
  tags?: string[];
  sourceMethod?: string;

  intelligence?: PrivateIntelligence;

  businessPlan: {
    summary: string;
    executiveSummary: string;
    marketOpportunity: string;
    competitiveAdvantage: string;
    revenueModel: string;
    available: boolean;
    valueProposition?: string | null;
    highlights?: string[];
    targetSegments?: string[];
    marketSizeQualitative?: string | null;
    trends?: string[];
    competitors?: PrivateCompetitor[];
    revenueStreams?: PrivateRevenueStream[];
    pricingStrategy?: string | null;
    keyMetrics?: string[];
    gtmStrategy?: string | null;
    gtmChannels?: string[];
    gtmPhases?: PrivateGtmPhase[];
    keyActivities?: string[];
    resources?: string[];
    milestones?: PrivateMilestone[];
    risks?: PrivateRisk[];
  };
  financialForecast: {
    tam?: number | null;
    projectedArr?: number | null;
    monthlyGrowthPct?: number | null;
    breakEvenMonth?: number | null;
    breakEvenRevenue?: number | null;
    arpu?: number | null;
    estimatedRunwayMonths?: number | null;
    currency: string;
    available: boolean;
    revenueSummary?: string | null;
    costSummary?: string | null;
    cashFlowSummary?: string | null;
    breakEvenSummary?: string | null;
    breakEvenNotes?: string | null;
    assumptions?: string[];
    risks?: PrivateRisk[];
    advisoryNotice?: string | null;
    revenueMonthly?: PrivateMonthlyMetric[];
    costMonthly?: PrivateCostMetric[];
    cashFlowMonthly?: PrivateCashFlowMetric[];
  };
  pricing: {
    pricingModel: string;
    tiers: PrivatePricingTier[];
    forecastArpu?: number | null;
    available: boolean;
  };
  resourcePlan: {
    launchBudgetMin?: number | null;
    launchBudgetMax?: number | null;
    monthlyRunningCost?: number | null;
    timeToLaunchWeeksMin?: number | null;
    timeToLaunchWeeksMax?: number | null;
    teamRolesNeeded: string[];
    teamRequirements?: PrivateTeamRequirement[];
    saasStack?: PrivateSaasItem[];
    budgetBreakdown?: PrivateBudgetBreakdown | null;
    available: boolean;
  };
  gtmPlan: {
    primaryChannels: string[];
    targetAudiences: string[];
    webPresenceAssets: string[];
    channelMix?: PrivateChannelMix[];
    webPresence?: PrivateWebPresence[];
    benchmarkGtmWeeks?: PrivateGtmWeek[];
    available: boolean;
  };
  branding: {
    logoAsset?: string | null;
    logoType?: string | null;
    brandingMethod?: string | null;
    paletteName?: string | null;
    typographyPairing?: string | null;
    colorPalette: string[];
  };
  documents: PrivateDocument[];
}

function unwrap<T>(response: unknown): T {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    (response as { success?: boolean }).success !== false
  ) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export const marketplaceProjectsApi = {
  getProjects: async (query?: MarketplaceProjectsQuery): Promise<MarketplaceProject[]> => {
    const res = await api.get('/marketplace/projects', { params: query });
    return unwrap<MarketplaceProject[]>(res.data);
  },

  getProjectDetail: async (ideaId: string): Promise<MarketplaceProject> => {
    const res = await api.get(`/marketplace/projects/${ideaId}`);
    return unwrap<MarketplaceProject>(res.data);
  },

  expressInterest: async (ideaId: string, note?: string): Promise<ProjectInterest> => {
    const res = await api.post(`/marketplace/projects/${ideaId}/interest`, { note });
    return unwrap<ProjectInterest>(res.data);
  },

  getMyInterest: async (ideaId: string): Promise<{ hasInterest: boolean; interest?: ProjectInterest | null }> => {
    const res = await api.get(`/marketplace/projects/${ideaId}/interest/my`);
    return unwrap<{ hasInterest: boolean; interest?: ProjectInterest | null }>(res.data);
  },

  getNdaStatus: async (ideaId: string): Promise<NdaStatus> => {
    const res = await api.get(`/marketplace/projects/${ideaId}/nda/status`);
    return unwrap<NdaStatus>(res.data);
  },

  signNda: async (ideaId: string, confirmationText?: string): Promise<{ ndaStatus: string; signedAt: string; accessGranted: boolean; expiresAt?: string }> => {
    const res = await api.post(`/marketplace/projects/${ideaId}/nda/sign`, { confirmationText });
    return unwrap<{ ndaStatus: string; signedAt: string; accessGranted: boolean; expiresAt?: string }>(res.data);
  },

  getPrivateProject: async (ideaId: string): Promise<PrivateMarketplaceProject> => {
    const res = await api.get(`/marketplace/projects/${ideaId}/private`);
    return unwrap<PrivateMarketplaceProject>(res.data);
  },

  downloadDocument: async (ideaId: string, documentId: string): Promise<Blob> => {
    const res = await api.get(`/marketplace/projects/${ideaId}/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // ======================= PHASE 3: CO-FOUNDER / EQUITY & FULL BUYOUT DEALS =======================

  createEquityOffer: async (ideaId: string, request: CreateEquityOfferRequest): Promise<EquityDeal> => {
    const res = await api.post(`/marketplace/projects/${ideaId}/deals/equity`, request);
    return unwrap<EquityDeal>(res.data);
  },

  createBuyoutOffer: async (ideaId: string, request: CreateBuyoutOfferRequest): Promise<EquityDeal> => {
    const res = await api.post(`/marketplace/projects/${ideaId}/deals/buyout`, request);
    return unwrap<EquityDeal>(res.data);
  },

  getMyDeal: async (ideaId: string): Promise<{ hasDeal: boolean; deal?: EquityDeal | null }> => {
    const res = await api.get(`/marketplace/projects/${ideaId}/deals/my`);
    return unwrap<{ hasDeal: boolean; deal?: EquityDeal | null }>(res.data);
  },

  getDeal: async (dealId: string): Promise<EquityDeal> => {
    const res = await api.get(`/deals/${dealId}`);
    return unwrap<EquityDeal>(res.data);
  },

  getDealRevisions: async (dealId: string): Promise<EquityOfferRevision[]> => {
    const res = await api.get(`/deals/${dealId}/revisions`);
    return unwrap<EquityOfferRevision[]>(res.data);
  },

  counterOffer: async (dealId: string, request: CounterEquityOfferRequest): Promise<EquityDeal> => {
    const res = await api.post(`/deals/${dealId}/counter`, request);
    return unwrap<EquityDeal>(res.data);
  },

  counterBuyoutOffer: async (dealId: string, request: CounterBuyoutOfferRequest): Promise<EquityDeal> => {
    const res = await api.post(`/deals/${dealId}/counter`, {
      buyoutTerms: request,
      purchasePrice: request.purchasePrice,
      handoverPeriodWeeks: request.handoverPeriodWeeks,
      transitionSupportWeeks: request.transitionSupportWeeks,
      includedAssets: request.includedAssets,
      notes: request.notes,
      expiresAt: request.expiresAt,
    });
    return unwrap<EquityDeal>(res.data);
  },

  acceptOffer: async (dealId: string): Promise<EquityDeal> => {
    const res = await api.post(`/deals/${dealId}/accept`);
    return unwrap<EquityDeal>(res.data);
  },

  rejectOffer: async (dealId: string): Promise<EquityDeal> => {
    const res = await api.post(`/deals/${dealId}/reject`);
    return unwrap<EquityDeal>(res.data);
  },

  // ======================= PHASE 4 METHODS =======================
  async getRoleAgreement(dealId: string): Promise<RoleResponsibilityAgreement> {
    const res = await api.get(`/deals/${dealId}/roles`);
    return unwrap<RoleResponsibilityAgreement>(res.data);
  },

  async updateRoleAgreement(dealId: string, req: UpdateRoleAgreementRequest): Promise<RoleResponsibilityAgreement> {
    const res = await api.put(`/deals/${dealId}/roles`, req);
    return unwrap<RoleResponsibilityAgreement>(res.data);
  },

  async confirmRoleAgreement(dealId: string): Promise<RoleResponsibilityAgreement> {
    const res = await api.post(`/deals/${dealId}/roles/confirm`);
    return unwrap<RoleResponsibilityAgreement>(res.data);
  },

  async requestRoleChanges(dealId: string, req: RequestRoleChangesRequest): Promise<RoleResponsibilityAgreement> {
    const res = await api.post(`/deals/${dealId}/roles/request-changes`, req);
    return unwrap<RoleResponsibilityAgreement>(res.data);
  },

  // ======================= PHASE 5: CAP TABLE DRAFT APIS =======================

  async getCapTableDraft(dealId: string): Promise<DealCapTableDraft> {
    const res = await api.get(`/deals/${dealId}/cap-table`);
    return unwrap<DealCapTableDraft>(res.data);
  },

  async updateCapTableDraft(dealId: string, req: UpdateCapTableDraftRequest): Promise<DealCapTableDraft> {
    const res = await api.put(`/deals/${dealId}/cap-table`, req);
    return unwrap<DealCapTableDraft>(res.data);
  },

  async approveCapTableDraft(dealId: string): Promise<DealCapTableDraft> {
    const res = await api.post(`/deals/${dealId}/cap-table/approve`);
    return unwrap<DealCapTableDraft>(res.data);
  },

  async requestCapTableChanges(dealId: string, req: RequestCapTableChangesRequest): Promise<DealCapTableDraft> {
    const res = await api.post(`/deals/${dealId}/cap-table/request-changes`, req);
    return unwrap<DealCapTableDraft>(res.data);
  },

  // ======================= PHASE 6: LEGAL REVIEW APIS =======================

  async getLegalPackage(dealId: string): Promise<LegalReviewPackage> {
    const res = await api.get(`/deals/${dealId}/legal`);
    return unwrap<LegalReviewPackage>(res.data);
  },

  async inviteLegalProvider(dealId: string, req: InviteLegalProviderRequest): Promise<LegalReviewPackage> {
    const res = await api.post(`/deals/${dealId}/legal/provider/invite`, req);
    return unwrap<LegalReviewPackage>(res.data);
  },

  async getLegalDocument(dealId: string, documentId: string): Promise<LegalDocument> {
    const res = await api.get(`/deals/${dealId}/legal/documents/${documentId}`);
    return unwrap<LegalDocument>(res.data);
  },

  async explainLegalDocument(dealId: string, documentId: string): Promise<ExplainLegalDocumentResponse> {
    const res = await api.post(`/deals/${dealId}/legal/documents/${documentId}/explain`);
    return unwrap<ExplainLegalDocumentResponse>(res.data);
  },

  async requestLegalChanges(dealId: string, req: RequestLegalChangesRequest): Promise<LegalReviewPackage> {
    const res = await api.post(`/deals/${dealId}/legal/request-changes`, req);
    return unwrap<LegalReviewPackage>(res.data);
  },

  async providerReviewLegalPackage(dealId: string, req: ProviderLegalReviewRequest): Promise<LegalReviewPackage> {
    const res = await api.post(`/deals/${dealId}/legal/provider/review`, req);
    return unwrap<LegalReviewPackage>(res.data);
  },

  async approveLegalPackage(dealId: string): Promise<LegalReviewPackage> {
    const res = await api.post(`/deals/${dealId}/legal/approve`);
    return unwrap<LegalReviewPackage>(res.data);
  },

  async setDealJurisdiction(dealId: string, req: SetJurisdictionRequest): Promise<LegalReviewPackage> {
    const res = await api.put(`/deals/${dealId}/legal/jurisdiction`, req);
    return unwrap<LegalReviewPackage>(res.data);
  },

  // ======================= FULL BUYOUT PHASE 3: LEGAL & ASSET TRANSFER REVIEW APIS =======================
  async getBuyoutLegalPackage(dealId: string): Promise<BuyoutLegalPackage> {
    const res = await api.get(`/deals/${dealId}/buyout/legal`);
    return unwrap<BuyoutLegalPackage>(res.data);
  },

  async inviteBuyoutLegalProvider(dealId: string, req: InviteBuyoutLegalProviderRequest): Promise<BuyoutLegalPackage> {
    const res = await api.post(`/deals/${dealId}/buyout/legal/provider/invite`, req);
    return unwrap<BuyoutLegalPackage>(res.data);
  },

  async reviewBuyoutLegalPackage(dealId: string, req: ReviewBuyoutLegalPackageRequest): Promise<BuyoutLegalPackage> {
    const res = await api.post(`/deals/${dealId}/buyout/legal/provider/review`, req);
    return unwrap<BuyoutLegalPackage>(res.data);
  },

  async requestBuyoutLegalChanges(dealId: string, req: RequestBuyoutLegalChangesRequest): Promise<BuyoutLegalPackage> {
    const res = await api.post(`/deals/${dealId}/buyout/legal/request-changes`, req);
    return unwrap<BuyoutLegalPackage>(res.data);
  },

  async reviseBuyoutDocument(dealId: string, documentId: string, req: ReviseBuyoutDocumentRequest): Promise<BuyoutLegalPackage> {
    const res = await api.post(`/deals/${dealId}/buyout/legal/documents/${documentId}/revise`, req);
    return unwrap<BuyoutLegalPackage>(res.data);
  },

  async approveBuyoutLegalPackage(dealId: string, req?: ApproveBuyoutLegalPackageRequest): Promise<BuyoutLegalPackage> {
    const res = await api.post(`/deals/${dealId}/buyout/legal/approve`, req || {});
    return unwrap<BuyoutLegalPackage>(res.data);
  },

  async getBuyoutLegalDocument(dealId: string, documentId: string): Promise<BuyoutLegalDocument> {
    const res = await api.get(`/deals/${dealId}/buyout/legal/documents/${documentId}`);
    return unwrap<BuyoutLegalDocument>(res.data);
  },

  async explainBuyoutLegalDocument(dealId: string, documentId: string): Promise<ExplainBuyoutLegalDocumentResponse> {
    const res = await api.post(`/deals/${dealId}/buyout/legal/documents/${documentId}/explain`);
    return unwrap<ExplainBuyoutLegalDocumentResponse>(res.data);
  },

  // ======================= FULL BUYOUT PHASE 4: FINAL TRANSFER AGREEMENT SIGNING APIS =======================
  async getBuyoutSigningPackage(dealId: string): Promise<BuyoutSigningPackage> {
    const res = await api.get(`/deals/${dealId}/buyout/signing`);
    return unwrap<BuyoutSigningPackage>(res.data);
  },

  async prepareBuyoutSigningPackage(dealId: string): Promise<BuyoutSigningPackage> {
    const res = await api.post(`/deals/${dealId}/buyout/signing/prepare`);
    return unwrap<BuyoutSigningPackage>(res.data);
  },

  async signBuyoutAgreement(dealId: string, req: SignBuyoutAgreementRequest): Promise<BuyoutSigningPackage> {
    const res = await api.post(`/deals/${dealId}/buyout/signing/sign`, req);
    return unwrap<BuyoutSigningPackage>(res.data);
  },

  async requestBuyoutSigningLegalChange(dealId: string, req: RequestBuyoutSigningLegalChangeRequest): Promise<EquityDeal> {
    const res = await api.post(`/deals/${dealId}/buyout/signing/request-legal-change`, req);
    return unwrap<EquityDeal>(res.data);
  },

  async getBuyoutSigningDocument(dealId: string, documentId: string): Promise<SigningDocumentRef> {
    const res = await api.get(`/deals/${dealId}/buyout/signing/documents/${documentId}`);
    return unwrap<SigningDocumentRef>(res.data);
  },

  async getFinalBuyoutSignedPackage(dealId: string): Promise<FinalBuyoutSignedPackage> {
    const res = await api.get(`/deals/${dealId}/buyout/signing/final-package`);
    return unwrap<FinalBuyoutSignedPackage>(res.data);
  },

  // ======================= FULL BUYOUT PHASE 5: CLOSING & PAYMENT APIS =======================
  async getBuyoutClosing(dealId: string): Promise<BuyoutClosing> {
    const res = await api.get(`/deals/${dealId}/buyout/closing`);
    return unwrap<BuyoutClosing>(res.data);
  },

  async startBuyoutClosing(dealId: string): Promise<BuyoutClosing> {
    const res = await api.post(`/deals/${dealId}/buyout/closing/start`);
    return unwrap<BuyoutClosing>(res.data);
  },

  async submitBuyoutPayment(dealId: string, req: SubmitBuyoutPaymentRequest): Promise<BuyoutClosing> {
    const res = await api.post(`/deals/${dealId}/buyout/closing/payment`, req);
    return unwrap<BuyoutClosing>(res.data);
  },

  async confirmBuyoutPayment(dealId: string, req?: ConfirmBuyoutPaymentRequest): Promise<BuyoutClosing> {
    const res = await api.post(`/deals/${dealId}/buyout/closing/payment/confirm`, req || {});
    return unwrap<BuyoutClosing>(res.data);
  },

  async disputeBuyoutPayment(dealId: string, req: DisputeBuyoutPaymentRequest): Promise<BuyoutClosing> {
    const res = await api.post(`/deals/${dealId}/buyout/closing/dispute`, req);
    return unwrap<BuyoutClosing>(res.data);
  },

  // ======================= FULL BUYOUT PHASE 6: ASSET HANDOVER & FINAL SALE APIS =======================
  async getBuyoutHandover(dealId: string): Promise<BuyoutHandover> {
    const res = await api.get(`/deals/${dealId}/buyout/handover`);
    return unwrap<BuyoutHandover>(res.data);
  },

  async startBuyoutHandover(dealId: string): Promise<BuyoutHandover> {
    const res = await api.post(`/deals/${dealId}/buyout/handover/start`);
    return unwrap<BuyoutHandover>(res.data);
  },

  async deliverBuyoutAsset(dealId: string, assetId: string, req: DeliverBuyoutAssetRequest): Promise<BuyoutHandover> {
    const res = await api.post(`/deals/${dealId}/buyout/handover/assets/${assetId}/deliver`, req);
    return unwrap<BuyoutHandover>(res.data);
  },

  async verifyBuyoutAsset(dealId: string, assetId: string, req: VerifyBuyoutAssetRequest): Promise<BuyoutHandover> {
    const res = await api.post(`/deals/${dealId}/buyout/handover/assets/${assetId}/verify`, req);
    return unwrap<BuyoutHandover>(res.data);
  },

  async reportBuyoutAssetIssue(dealId: string, assetId: string, req: ReportBuyoutAssetIssueRequest): Promise<BuyoutHandover> {
    const res = await api.post(`/deals/${dealId}/buyout/handover/assets/${assetId}/issue`, req);
    return unwrap<BuyoutHandover>(res.data);
  },

  async confirmBuyoutHandover(dealId: string, req?: ConfirmBuyoutHandoverRequest): Promise<BuyoutHandover> {
    const res = await api.post(`/deals/${dealId}/buyout/handover/confirm`, req || {});
    return unwrap<BuyoutHandover>(res.data);
  },

  async completeBuyoutSale(dealId: string, req?: CompleteBuyoutSaleRequest): Promise<EquityDeal> {
    const res = await api.post(`/deals/${dealId}/buyout/handover/complete-sale`, req || {});
    return unwrap<EquityDeal>(res.data);
  },

  async getBuyoutSaleRecord(dealId: string): Promise<BuyoutSaleRecord> {
    const res = await api.get(`/deals/${dealId}/buyout/sale-record`);
    return unwrap<BuyoutSaleRecord>(res.data);
  },

  async getMyBuyoutSales(): Promise<BuyoutSaleRecord[]> {
    const res = await api.get('/deals/buyout/my-sales');
    return unwrap<BuyoutSaleRecord[]>(res.data);
  },

  async getMyAcquisitions(): Promise<BuyoutSaleRecord[]> {
    const res = await api.get('/deals/buyout/my-acquisitions');
    return unwrap<BuyoutSaleRecord[]>(res.data);
  },

  async getMyActiveBuyoutDeals(): Promise<EquityDeal[]> {
    const res = await api.get('/deals/buyout/my-active');
    return unwrap<EquityDeal[]>(res.data);
  },

  async getMyActiveAcquisitions(): Promise<EquityDeal[]> {
    const res = await api.get('/deals/buyout/my-active-acquisitions');
    return unwrap<EquityDeal[]>(res.data);
  },

  // ======================= PHASE 7: AGREEMENT SIGNING APIS =======================

  async getSigningPackage(dealId: string): Promise<AgreementSigningPackage> {
    const res = await api.get(`/deals/${dealId}/signing`);
    return unwrap<AgreementSigningPackage>(res.data);
  },

  async prepareSigningPackage(dealId: string): Promise<AgreementSigningPackage> {
    const res = await api.post(`/deals/${dealId}/signing/prepare`);
    return unwrap<AgreementSigningPackage>(res.data);
  },

  async signAgreement(dealId: string, req: SignAgreementRequest): Promise<AgreementSigningPackage> {
    const res = await api.post(`/deals/${dealId}/signing/sign`, req);
    return unwrap<AgreementSigningPackage>(res.data);
  },

  async requestSigningLegalChange(dealId: string, req: RequestSigningLegalChangeRequest): Promise<AgreementSigningPackage> {
    const res = await api.post(`/deals/${dealId}/signing/request-legal-change`, req);
    return unwrap<AgreementSigningPackage>(res.data);
  },

  async getSigningDocument(dealId: string, documentId: string): Promise<SigningDocumentRef> {
    const res = await api.get(`/deals/${dealId}/signing/documents/${documentId}`);
    return unwrap<SigningDocumentRef>(res.data);
  },

  async getFinalSignedPackage(dealId: string): Promise<FinalAgreementPackage> {
    const res = await api.get(`/deals/${dealId}/signing/final-package`);
    return unwrap<FinalAgreementPackage>(res.data);
  },

  // ======================= PHASE 8: COMPANY & PROJECT ACTIVATION =======================

  async getDealActivation(dealId: string): Promise<PartnershipActivation> {
    const res = await api.get(`/deals/${dealId}/activation`);
    return unwrap<PartnershipActivation>(res.data);
  },

  async startDealActivation(dealId: string, req?: StartActivationRequest): Promise<PartnershipActivation> {
    const res = await api.post(`/deals/${dealId}/activation/start`, req || {});
    return unwrap<PartnershipActivation>(res.data);
  },

  async completeDealActivation(dealId: string, req?: CompleteActivationRequest): Promise<PartnershipActivation> {
    const res = await api.post(`/deals/${dealId}/activation/complete`, req || {});
    return unwrap<PartnershipActivation>(res.data);
  },

  async updateCorporateFilingStatus(dealId: string, req: UpdateCorporateFilingRequest): Promise<PartnershipActivation> {
    const res = await api.post(`/deals/${dealId}/activation/filing-status`, req);
    return unwrap<PartnershipActivation>(res.data);
  },

  // ======================= PHASE 9: PARTNERSHIP ACTIVE & MY EQUITY =======================

  async getMyPartnerships(): Promise<PartnershipSummary[]> {
    const res = await api.get('/partnerships');
    return unwrap<PartnershipSummary[]>(res.data);
  },

  async getPartnershipActiveDetails(dealId: string): Promise<PartnershipActiveDetails> {
    const res = await api.get(`/partnerships/${dealId}`);
    return unwrap<PartnershipActiveDetails>(res.data);
  },

  async getPartnershipEquityDetails(dealId: string): Promise<PartnershipEquityDetails> {
    const res = await api.get(`/partnerships/${dealId}/equity`);
    return unwrap<PartnershipEquityDetails>(res.data);
  },

  async getPartnershipDocuments(dealId: string): Promise<ActivatedDocumentRef[]> {
    const res = await api.get(`/partnerships/${dealId}/documents`);
    return unwrap<ActivatedDocumentRef[]>(res.data);
  },

  async getPartnershipMilestones(dealId: string): Promise<PartnershipMilestone[]> {
    const res = await api.get(`/partnerships/${dealId}/milestones`);
    return unwrap<PartnershipMilestone[]>(res.data);
  },

  async createPartnershipMilestone(dealId: string, req: CreatePartnershipMilestoneRequest): Promise<PartnershipMilestone> {
    const res = await api.post(`/partnerships/${dealId}/milestones`, req);
    return unwrap<PartnershipMilestone>(res.data);
  },

  async updatePartnershipMilestone(dealId: string, milestoneId: string, req: UpdatePartnershipMilestoneRequest): Promise<PartnershipMilestone> {
    const res = await api.put(`/partnerships/${dealId}/milestones/${milestoneId}`, req);
    return unwrap<PartnershipMilestone>(res.data);
  },
};

// ======================= PHASE 3 TYPES =======================

export interface BuyoutTerms {
  purchasePrice: number;
  currency?: string;
  handoverPeriodWeeks: number;
  transitionSupportWeeks: number;
  includedAssets: string[];
  expiresAt?: string | null;
  notes?: string | null;
}

export interface CreateBuyoutOfferRequest {
  purchasePrice: number;
  handoverPeriodWeeks?: number;
  transitionSupportWeeks?: number;
  includedAssets?: string[];
  expiresAt?: string | null;
  notes?: string | null;
}

export interface EquityTerms {
  equityPercentage: number;
  creatorRole: string;
  cashComponent?: number | null;
  vestingEnabled: boolean;
  vestingMonths: number;
  cliffMonths: number;
  responsibilities: string[];
  timeCommitment: string;
  expiresAt?: string | null;
  notes?: string | null;
}

export interface CreateEquityOfferRequest {
  equityPercentage: number;
  creatorRole: string;
  cashComponent?: number | null;
  vestingEnabled: boolean;
  vestingMonths?: number;
  cliffMonths?: number;
  responsibilities?: string[];
  timeCommitment?: string;
  expiresAt?: string | null;
  notes?: string | null;
}

export interface CounterEquityOfferRequest {
  equityPercentage?: number;
  creatorRole?: string;
  cashComponent?: number | null;
  vestingEnabled?: boolean;
  vestingMonths?: number;
  cliffMonths?: number;
  responsibilities?: string[];
  timeCommitment?: string;
  expiresAt?: string | null;
  notes?: string | null;
  buyoutTerms?: BuyoutTerms | null;
  purchasePrice?: number;
  handoverPeriodWeeks?: number;
  transitionSupportWeeks?: number;
  includedAssets?: string[];
}

export interface CounterBuyoutOfferRequest {
  purchasePrice: number;
  handoverPeriodWeeks?: number;
  transitionSupportWeeks?: number;
  includedAssets?: string[];
  expiresAt?: string | null;
  notes?: string | null;
}

export interface EquityOfferRevision {
  revisionNumber: number;
  offeredByRole: string;
  offeredByUserId: string;
  status: string;
  terms: EquityTerms;
  buyoutTerms?: BuyoutTerms | null;
  note?: string | null;
  createdAt: string;
  respondedAt?: string | null;
  expiresAt?: string | null;
}

export interface EquityDeal {
  id: string;
  ideaId: string;
  projectName: string;
  dealType: string;
  dealStage: string;
  status: string;
  creatorId: string;
  creatorName: string;
  entrepreneurId: string;
  entrepreneurName: string;
  conversationId: string;
  currentTurn: string;
  currentRevisionNumber: number;
  acceptedRevisionNumber?: number | null;
  acceptedAt?: string | null;
  activeTerms: EquityTerms;
  buyoutTerms?: BuyoutTerms | null;
  revisions: EquityOfferRevision[];
  roleAgreement?: RoleResponsibilityAgreement | null;
  capTableDraft?: DealCapTableDraft | null;
  legalPackage?: LegalReviewPackage | null;
  buyoutLegalPackage?: BuyoutLegalPackage | null;
  buyoutAssetManifest?: BuyoutAssetTransferManifest | null;
  buyoutSigningPackage?: BuyoutSigningPackage | null;
  buyoutClosing?: BuyoutClosing | null;
  buyoutHandover?: BuyoutHandover | null;
  buyoutSaleRecord?: BuyoutSaleRecord | null;
  signingPackage?: AgreementSigningPackage | null;
  activation?: PartnershipActivation | null;
  createdAt: string;
  updatedAt: string;
}

// ======================= PHASE 4 TYPES =======================

export interface DealCommercialSummary {
  equityPercentage: number;
  creatorRole: string;
  cashComponent?: number | null;
  vestingEnabled: boolean;
  vestingMonths: number;
  cliffMonths: number;
  acceptedRevisionNumber: number;
}

export interface RoleResponsibilityAgreement {
  id: string;
  dealId: string;
  ideaId: string;
  projectName: string;
  creatorId: string;
  creatorName: string;
  entrepreneurId: string;
  entrepreneurName: string;
  creatorRole: string;
  entrepreneurRole: string;
  creatorResponsibilities: string[];
  entrepreneurResponsibilities: string[];
  creatorTimeCommitment: string;
  entrepreneurTimeCommitment: string;
  creatorCommitmentType: string;
  creatorCommitmentValue?: number | null;
  entrepreneurCommitmentType: string;
  entrepreneurCommitmentValue?: number | null;
  creatorConfirmedAt?: string | null;
  entrepreneurConfirmedAt?: string | null;
  creatorConfirmedVersion: number;
  entrepreneurConfirmedVersion: number;
  status: string; // AWAITING_CONFIRMATION | CREATOR_CONFIRMED | ENTREPRENEUR_CONFIRMED | CONFIRMED | CHANGES_REQUESTED
  version: number;
  lastEditedByRole?: string | null;
  notes?: string | null;
  commercialTerms: DealCommercialSummary;
}

export interface UpdateRoleAgreementRequest {
  creatorRole?: string | null;
  entrepreneurRole?: string | null;
  creatorResponsibilities?: string[] | null;
  entrepreneurResponsibilities?: string[] | null;
  creatorTimeCommitment?: string | null;
  entrepreneurTimeCommitment?: string | null;
  creatorCommitmentType?: string | null;
  creatorCommitmentValue?: number | null;
  entrepreneurCommitmentType?: string | null;
  entrepreneurCommitmentValue?: number | null;
  notes?: string | null;
}

export interface RequestRoleChangesRequest {
  feedback: string;
  notes?: string | null;
}

// ======================= PHASE 5 TYPES =======================

export interface DealCapTableEntry {
  id: string;
  userId?: string | null;
  displayName: string;
  roleTitle: string;
  stakeholderType: string; // founder | creator | esop | investor_reserve | advisor
  shareClass: string;      // common | preferred | safe | note
  hasVotingRights: boolean;
  equityPercent: number;
  sharesGranted: number;
  vestingMonths: number;
  cliffMonths: number;
  isCreator: boolean;
  isFounder: boolean;
  isEsop: boolean;
  isInvestorReserve: boolean;
  isLocked: boolean;
}

export interface CapTableCompanyContext {
  hasExistingCompany: boolean;
  companyId?: string | null;
  companyName?: string | null;
  incorporationStatus?: string | null; // "INCORPORATED" | "NOT_INCORPORATED"
}

export interface DealCapTableDraft {
  id: string;
  dealId: string;
  ideaId: string;
  projectName: string;
  creatorId: string;
  creatorName: string;
  entrepreneurId: string;
  entrepreneurName: string;
  totalShares: number;
  entries: DealCapTableEntry[];
  esopPoolPercent: number;
  investorReservePercent: number;
  esopVestingMonths: number;
  totalAllocatedPercent: number;
  isFullyAllocated: boolean;
  creatorConfirmedAt?: string | null;
  entrepreneurConfirmedAt?: string | null;
  creatorConfirmedVersion: number;
  entrepreneurConfirmedVersion: number;
  status: string; // AWAITING_CONFIRMATION | CREATOR_APPROVED | ENTREPRENEUR_APPROVED | APPROVED | CHANGES_REQUESTED
  version: number;
  lastEditedByRole?: string | null;
  notes?: string | null;
  commercialTerms: DealCommercialSummary;
  companyContext: CapTableCompanyContext;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCapTableDraftRequest {
  totalShares: number;
  entries: DealCapTableEntry[];
  esopPoolPercent: number;
  investorReservePercent: number;
  esopVestingMonths?: number;
  notes?: string | null;
}

export interface RequestCapTableChangesRequest {
  feedback: string;
}

// ======================= PHASE 6 TYPES =======================

export interface LegalDocument {
  id: string;
  documentType: string;
  title: string;
  requirementType: string; // REQUIRED | CONDITIONAL | NOT_APPLICABLE
  contentMarkdown: string;
  contentHash: string;
  version: number;
  status: string;          // DRAFT | REVIEWED | APPROVED
  lastUpdated: string;
}

export interface LegalReviewPackage {
  id: string;
  dealId: string;
  ideaId: string;
  projectName: string;
  creatorId: string;
  creatorName: string;
  entrepreneurId: string;
  entrepreneurName: string;
  jurisdiction?: string | null;
  companyContext: string;  // CASE_A_PRE_INCORPORATION | CASE_B_EXISTING_COMPANY
  companyId?: string | null;
  companyName?: string | null;
  documents: LegalDocument[];
  assignedLegalProviderId?: string | null;
  assignedLegalProviderName?: string | null;
  providerReviewStatus: string; // NOT_ASSIGNED | ASSIGNED | IN_REVIEW | CHANGES_REQUESTED | REVIEW_COMPLETE
  providerReviewedAt?: string | null;
  providerReviewNotes?: string | null;
  creatorApprovedVersion: number;
  entrepreneurApprovedVersion: number;
  creatorApprovedAt?: string | null;
  entrepreneurApprovedAt?: string | null;
  acceptedOfferRevisionNumber: number;
  roleAgreementVersion: number;
  capTableVersion: number;
  status: string; // AWAITING_REVIEW | IN_REVIEW | CHANGES_REQUESTED | CREATOR_APPROVED | ENTREPRENEUR_APPROVED | APPROVED
  version: number;
  lastEditedByRole?: string | null;
  notes?: string | null;
  commercialTerms: DealCommercialSummary;
  createdAt: string;
  updatedAt: string;
}

export interface InviteLegalProviderRequest {
  providerId: string;
  notes?: string | null;
}

export interface ProviderLegalReviewRequest {
  reviewStatus: string; // IN_REVIEW | CHANGES_REQUESTED | REVIEW_COMPLETE
  notes?: string | null;
  requestedChangesFeedback?: string | null;
}

export interface RequestLegalChangesRequest {
  documentId?: string | null;
  feedback: string;
}

export interface SetJurisdictionRequest {
  jurisdiction: string;
}

export interface ExplainLegalDocumentResponse {
  documentId: string;
  documentTitle: string;
  explanationMarkdown: string;
  keyTakeaways: string[];
  disclaimer: string;
}

// ======================= PHASE 7 TYPES =======================

export interface PartySignature {
  signerUserId: string;
  signerName: string;
  signerRole: string; // Creator | Entrepreneur
  manifestHash: string;
  legalPackageVersion: number;
  signedAt: string;
  signatureHash: string;
  consentStatement?: string | null;
}

export interface SigningDocumentRef {
  documentId: string;
  documentType: string;
  title: string;
  requirementType: string; // REQUIRED | CONDITIONAL | NOT_APPLICABLE
  documentVersion: number;
  documentHash: string;
  contentMarkdown?: string | null;
}

export interface AgreementSigningPackage {
  id: string;
  dealId: string;
  ideaId: string;
  projectName: string;
  creatorId: string;
  creatorName: string;
  entrepreneurId: string;
  entrepreneurName: string;
  legalPackageId: string;
  legalPackageVersion: number;
  acceptedOfferRevisionNumber: number;
  roleAgreementVersion: number;
  capTableVersion: number;
  jurisdiction?: string | null;
  companyContext: string;
  companyId?: string | null;
  companyName?: string | null;
  documents: SigningDocumentRef[];
  manifestHash: string;
  creatorSignature?: PartySignature | null;
  entrepreneurSignature?: PartySignature | null;
  status: string; // PENDING_SIGNATURES | CREATOR_SIGNED | ENTREPRENEUR_SIGNED | AGREEMENT_SIGNED | INVALIDATED
  version: number;
  commercialTerms: DealCommercialSummary;
  assignedLegalProviderName?: string | null;
  createdAt: string;
  finalizedAt?: string | null;
  updatedAt: string;
}

export interface SignAgreementRequest {
  manifestHash?: string | null;
  legalPackageVersion?: number;
  consentStatement?: string | null;
}

export interface RequestSigningLegalChangeRequest {
  feedback: string;
}

export interface FinalAgreementPackage {
  dealId: string;
  ideaId: string;
  projectName: string;
  manifestHash: string;
  legalPackageVersion: number;
  documents: SigningDocumentRef[];
  creatorSignature?: PartySignature | null;
  entrepreneurSignature?: PartySignature | null;
  finalizedAt: string;
  auditReference: string;
  status: string;
}

// ======================= PHASE 8 TYPES =======================

export interface ActivatedDocumentRef {
  documentId: string;
  documentType: string;
  title: string;
  version: number;
  documentHash: string;
  linkedAt: string;
}

export interface OwnershipEntryComparison {
  userId: string;
  displayName: string;
  roleTitle: string;
  type: string;
  previousEquityPercent: number;
  signedEquityPercent: number;
  previousShares: number;
  signedShares: number;
  vestingMonths: number;
  cliffMonths: number;
  isCreator: boolean;
  isFounder: boolean;
}

export interface OwnershipComparison {
  entries: OwnershipEntryComparison[];
  esopPoolPercent: number;
  investorReservePercent: number;
  totalShares: number;
  notice: string;
}

export interface PartnershipActivation {
  id: string;
  dealId: string;
  ideaId: string;
  projectName: string;
  creatorId: string;
  creatorName: string;
  entrepreneurId: string;
  entrepreneurName: string;
  companyId?: string | null;
  companyName?: string | null;
  companyCase: string; // CASE_A_PRE_INCORPORATION | CASE_B_EXISTING_COMPANY
  status: string; // ACTIVATION_PENDING | READY_TO_ACTIVATE | PARTNERSHIP_ACTIVE | FAILED
  signedManifestHash: string;
  appliedLegalPackageVersion: number;
  appliedOfferRevisionNumber: number;
  appliedRoleAgreementVersion: number;
  appliedCapTableVersion: number;
  creatorShareholderId?: string | null;
  entrepreneurShareholderId?: string | null;
  corporateFilingStatus: string; // NOT_REQUIRED | EXTERNAL_FILING_PENDING | FILING_COMPLETE
  corporateFilingNotes?: string | null;
  canActivate: boolean;
  blockers: string[];
  linkedDocuments: ActivatedDocumentRef[];
  ownershipComparison: OwnershipComparison;
  commercialTerms: DealCommercialSummary;
  startedAt?: string | null;
  completedAt?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface StartActivationRequest {
  companyName?: string | null;
}

export interface CompleteActivationRequest {
  notes?: string | null;
}

export interface UpdateCorporateFilingRequest {
  filingStatus: string;
  notes?: string | null;
}

// ======================= PHASE 9 TYPES =======================

export interface PartnershipSummary {
  dealId: string;
  ideaId: string;
  projectName: string;
  companyId?: string | null;
  companyName?: string | null;
  creatorId: string;
  creatorName: string;
  creatorRole: string;
  creatorEquityPercent: number;
  creatorShares: number;
  entrepreneurId: string;
  entrepreneurName: string;
  entrepreneurRole: string;
  entrepreneurEquityPercent: number;
  entrepreneurShares: number;
  totalShares: number;
  dealStage: string;
  outcomeBadge: string;
  activatedAt?: string | null;
  status: string;
}

export interface PartnershipEquityDetails {
  dealId: string;
  ideaId: string;
  projectName: string;
  companyId?: string | null;
  companyName?: string | null;
  legalStructure: string;
  jurisdiction: string;
  totalShares: number;
  currentOwnershipPercent: number;
  sharesOwned: number;
  shareClass: string;
  votingRights: string;
  vestingEnabled: boolean;
  vestingMonths: number;
  cliffMonths: number;
  vestingStartDate?: string | null;
  vestedPercent: number;
  vestedShares: number;
  unvestedPercent: number;
  unvestedShares: number;
  vestingStatusNotice: string;
  shareholderStatus: string;
  capTableIntegrityStatus: string; // VALID | OWNERSHIP_RECONCILIATION_REQUIRED
  companyDocuments: ActivatedDocumentRef[];
}

export interface PartnershipMilestone {
  id: string;
  dealId: string;
  ideaId: string;
  companyId?: string | null;
  title: string;
  description: string;
  dueDate?: string | null;
  status: string; // NOT_STARTED | IN_PROGRESS | COMPLETED
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface CreatePartnershipMilestoneRequest {
  title: string;
  description?: string | null;
  dueDate?: string | null;
}

export interface UpdatePartnershipMilestoneRequest {
  title?: string | null;
  description?: string | null;
  dueDate?: string | null;
  status?: string | null;
}

export interface PartnerSummary {
  userId: string;
  displayName: string;
  roleTitle: string;
  equityPercent: number;
  shares: number;
  isCreator: boolean;
}

export interface PartnershipCompanySummary {
  companyId?: string | null;
  companyName: string;
  legalStructure: string;
  country: string;
  jurisdiction: string;
  companyStatus: string;
  corporateFilingStatus: string;
  registrationNumber?: string | null;
  totalShares: number;
  esopPoolPercent: number;
  investorReservePercent: number;
}

export interface PartnershipRoleSummary {
  roleTitle: string;
  responsibilities: string[];
  timeCommitment: string;
}

export interface PartnershipActiveDetails {
  dealId: string;
  ideaId: string;
  projectName: string;
  outcomeBadge: string;
  status: string;
  activatedAt?: string | null;
  creator: PartnerSummary;
  entrepreneur: PartnerSummary;
  company: PartnershipCompanySummary;
  equity: PartnershipEquityDetails;
  creatorRoleDetails: PartnershipRoleSummary;
  entrepreneurRoleDetails: PartnershipRoleSummary;
  documents: ActivatedDocumentRef[];
  milestones: PartnershipMilestone[];
  conversationId: string;
  workspaceUrl: string;
  capTableIntegrityStatus: string;
}

// ======================= FULL BUYOUT PHASE 3 TYPES =======================

export interface BuyoutAssetEntry {
  assetType: string;
  displayName: string;
  description?: string | null;
  availabilityStatus: string; // AVAILABLE_IN_PLATFORM | EXTERNAL_TRANSFER_REQUIRED | MISSING | NOT_APPLICABLE
  externalTransferRequired: boolean;
  notes?: string | null;
  uploadedAssetRef?: string | null;
}

export interface BuyoutAssetTransferManifest {
  dealId: string;
  ideaId: string;
  acceptedRevisionNumber: number;
  purchasePrice: number;
  currency: string;
  handoverPeriodWeeks: number;
  transitionSupportWeeks: number;
  assets: BuyoutAssetEntry[];
  version: number;
  manifestHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuyoutLegalDocument {
  id: string;
  documentType: string;
  title: string;
  requirementType: string; // REQUIRED | CONDITIONAL | NOT_APPLICABLE
  contentMarkdown: string;
  contentHash: string;
  version: number;
  status: string; // GENERATED | REVIEWED | APPROVED
  lastUpdated: string;
}

export interface BuyoutLegalPackage {
  id: string;
  dealId: string;
  ideaId: string;
  projectName?: string;
  creatorId?: string;
  creatorName?: string;
  entrepreneurId?: string;
  entrepreneurName?: string;
  jurisdiction: string;
  version: number;
  status: string; // AWAITING_REVIEW | ASSIGNED | IN_REVIEW | CHANGES_REQUESTED | CREATOR_APPROVED | ENTREPRENEUR_APPROVED | APPROVED
  providerReviewStatus: string; // NOT_ASSIGNED | ASSIGNED | IN_REVIEW | CHANGES_REQUESTED | REVIEW_COMPLETE
  assignedLegalProviderId?: string | null;
  assignedLegalProviderName?: string | null;
  providerReviewedAt?: string | null;
  providerReviewNotes?: string | null;
  providerReviewedVersion?: number;
  creatorApprovedVersion: number;
  creatorApprovedAt?: string | null;
  entrepreneurApprovedVersion: number;
  entrepreneurApprovedAt?: string | null;
  acceptedBuyoutRevisionNumber: number;
  purchasePrice: number;
  currency: string;
  handoverPeriodWeeks: number;
  transitionSupportWeeks: number;
  includedAssets?: string[];
  assetManifestVersion: number;
  assetManifest?: BuyoutAssetTransferManifest | null;
  documents: BuyoutLegalDocument[];
  notes?: string | null;
  lastEditedByRole?: string | null;
  lastEditedByUserId?: string | null;
  blockers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InviteBuyoutLegalProviderRequest {
  providerId: string;
}

export interface ReviewBuyoutLegalPackageRequest {
  status: string; // REVIEW_COMPLETE | CHANGES_REQUESTED
  notes?: string | null;
}

export interface RequestBuyoutLegalChangesRequest {
  documentId?: string | null;
  comment: string;
}

export interface ReviseBuyoutDocumentRequest {
  contentMarkdown: string;
}

export interface ApproveBuyoutLegalPackageRequest {
  legalPackageVersion?: number;
}

export interface ExplainBuyoutLegalDocumentResponse {
  documentId: string;
  documentTitle: string;
  explanation: string;
  disclaimer: string;
}

// ======================= FULL BUYOUT PHASE 4 TYPES =======================

export interface BuyoutSigningPackage {
  id: string;
  dealId: string;
  ideaId: string;
  projectName: string;
  dealType: string;
  creatorId: string;
  creatorName: string;
  entrepreneurId: string;
  entrepreneurName: string;
  acceptedBuyoutRevisionNumber: number;
  buyoutLegalPackageId: string;
  buyoutLegalPackageVersion: number;
  assetManifestVersion: number;
  assetManifestHash: string;
  purchasePrice: number;
  currency: string;
  handoverPeriodWeeks: number;
  transitionSupportWeeks: number;
  includedAssets: string[];
  documents: SigningDocumentRef[];
  assetManifest?: BuyoutAssetTransferManifest | null;
  manifestHash: string;
  creatorSignature?: PartySignature | null;
  entrepreneurSignature?: PartySignature | null;
  assignedLegalProviderName?: string | null;
  status: string; // PENDING_SIGNATURES | CREATOR_SIGNED | BUYER_SIGNED | AGREEMENT_SIGNED | INVALIDATED
  version: number;
  createdAt: string;
  finalizedAt?: string | null;
  updatedAt: string;
  auditReference?: string | null;
}

export interface SignBuyoutAgreementRequest {
  manifestHash: string;
  expectedLegalPackageVersion: number;
  consentStatement?: string | null;
}

export interface RequestBuyoutSigningLegalChangeRequest {
  feedback: string;
  requestedChangeType?: string; // LEGAL_WORDING | COMMERCIAL_TERMS
}

export interface FinalBuyoutSignedPackage {
  dealId: string;
  ideaId: string;
  projectName: string;
  acceptedBuyoutRevisionNumber: number;
  purchasePrice: number;
  currency: string;
  handoverPeriodWeeks: number;
  transitionSupportWeeks: number;
  assetManifestVersion: number;
  assetManifestHash: string;
  legalPackageVersion: number;
  manifestHash: string;
  documents: SigningDocumentRef[];
  creatorSignature?: PartySignature | null;
  entrepreneurSignature?: PartySignature | null;
  finalizedAt: string;
  auditReference: string;
  status: string;
}

// ======================= FULL BUYOUT PHASE 5 TYPES =======================

export interface BuyoutPaymentEvidenceEntry {
  id: string;
  documentReference: string;
  documentName: string;
  uploadedByUserId: string;
  uploadedByRole: string;
  uploadedAt: string;
  contentHash?: string | null;
  statedAmount?: number | null;
  statedCurrency?: string | null;
  notes?: string | null;
}

export interface BuyoutClosing {
  id: string;
  dealId: string;
  ideaId: string;
  projectName: string;
  dealType: string;
  creatorId: string;
  creatorName: string;
  entrepreneurId: string;
  entrepreneurName: string;
  acceptedRevisionNumber: number;
  signingPackageId: string;
  manifestHash: string;
  purchasePrice: number;
  currency: string;
  paymentMethod: string; // BANK_TRANSFER | PAYMENT_PROVIDER | ESCROW | OTHER
  paymentStatus: string; // NOT_STARTED | PAYMENT_PENDING | PAYMENT_SUBMITTED | PAYMENT_VERIFICATION_PENDING | PAYMENT_CONFIRMED | PAYMENT_FAILED | PAYMENT_DISPUTED
  paymentReference?: string | null;
  paymentAmount?: number | null;
  paymentCurrency?: string | null;
  paidAt?: string | null;
  buyerConfirmedAt?: string | null;
  creatorConfirmedAt?: string | null;
  providerConfirmedAt?: string | null;
  evidence: BuyoutPaymentEvidenceEntry[];
  closingStatus: string; // PENDING | PAYMENT_PENDING | PAYMENT_VERIFICATION | PAYMENT_CONFIRMED | READY_FOR_HANDOVER | BLOCKED | DISPUTED
  canProceedToHandover: boolean;
  blockers: string[];
  disputeReason?: string | null;
  disputedAt?: string | null;
  disputedByUserId?: string | null;
  version: number;
  startedAt: string;
  updatedAt: string;
  paymentCompletedAt?: string | null;
  readyForHandoverAt?: string | null;
}

export interface SubmitBuyoutPaymentRequest {
  paymentMethod?: string;
  paymentReference: string;
  paymentAmount?: number | null;
  paymentCurrency?: string | null;
  paidAt?: string | null;
  documentReference?: string | null;
  documentName?: string | null;
  notes?: string | null;
  expectedVersion?: number;
}

export interface ConfirmBuyoutPaymentRequest {
  notes?: string | null;
  expectedVersion?: number;
}

export interface DisputeBuyoutPaymentRequest {
  disputeReason: string;
  expectedVersion?: number;
}

// ======================= FULL BUYOUT PHASE 6 TYPES =======================

export interface BuyoutHandoverAsset {
  id: string;
  assetId: string;
  assetType: string;
  displayName: string;
  deliveryType: string; // AVAILABLE_IN_PLATFORM | EXTERNAL_TRANSFER_REQUIRED | DOCUMENT_EXPORT | CREDENTIAL_COORDINATION
  isRequired: boolean;
  status: string; // PENDING | DELIVERY_IN_PROGRESS | DELIVERED | VERIFICATION_PENDING | VERIFIED | ISSUE_REPORTED | BLOCKED
  sourceReference?: string | null;
  deliveryReference?: string | null;
  deliveryInstructions?: string | null;
  sellerDeliveredAt?: string | null;
  sellerDeliveredByUserId?: string | null;
  buyerVerifiedAt?: string | null;
  buyerVerifiedByUserId?: string | null;
  sellerNotes?: string | null;
  buyerNotes?: string | null;
  issueReason?: string | null;
  issueReportedAt?: string | null;
  evidence: BuyoutPaymentEvidenceEntry[];
  version: number;
}

export interface BuyoutHandover {
  id: string;
  dealId: string;
  ideaId: string;
  projectName: string;
  dealType: string;
  creatorId: string;
  creatorName: string;
  entrepreneurId: string;
  entrepreneurName: string;
  acceptedRevisionNumber: number;
  assetManifestVersion: number;
  assetManifestHash: string;
  signingPackageId: string;
  manifestHash: string;
  closingId: string;
  purchasePrice: number;
  currency: string;
  handoverPeriodWeeks: number;
  transitionSupportWeeks: number;
  assets: BuyoutHandoverAsset[];
  status: string; // NOT_STARTED | IN_PROGRESS | AWAITING_BUYER_CONFIRMATION | CHANGES_REQUESTED | COMPLETED | DISPUTED
  canCompleteSale: boolean;
  blockers: string[];
  sellerConfirmedAt?: string | null;
  buyerConfirmedAt?: string | null;
  version: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface BuyoutSaleRecord {
  id: string;
  dealId: string;
  ideaId: string;
  projectName: string;
  sellerUserId: string;
  sellerName: string;
  buyerUserId: string;
  buyerName: string;
  purchasePrice: number;
  currency: string;
  acceptedRevisionNumber: number;
  signingPackageId: string;
  manifestHash: string;
  assetManifestVersion: number;
  closingId: string;
  handoverId: string;
  soldAt: string;
  transferredAssets: string[];
  status: string; // SOLD
  auditReference: string;
}

export interface DeliverBuyoutAssetRequest {
  deliveryReference?: string | null;
  notes?: string | null;
  documentReference?: string | null;
  documentName?: string | null;
  expectedVersion?: number;
}

export interface VerifyBuyoutAssetRequest {
  notes?: string | null;
  expectedVersion?: number;
}

export interface ReportBuyoutAssetIssueRequest {
  issueReason: string;
  expectedVersion?: number;
}

export interface ConfirmBuyoutHandoverRequest {
  notes?: string | null;
  expectedVersion?: number;
}

export interface CompleteBuyoutSaleRequest {
  notes?: string | null;
  expectedVersion?: number;
}

export default marketplaceProjectsApi;


