// Frontend mirror of the backend investor-side DTOs in
// backend/Models/Dtos/CompanyDtos.cs (search for "INVESTOR-SIDE READS").
//
// These are the only source of truth for the investor-journey wire format
// on the frontend; do not duplicate or re-declare these shapes elsewhere.

export type MatchStatus =
  | "new"
  | "viewed"
  | "interested"
  | "reviewing"
  | "matched"
  | "rejected"
  | "passed";

export type PipelineColumnKey =
  | "newMatches"
  | "inReview"
  | "ndaSigned"
  | "dataRoom"
  | "negotiation"
  | "won"
  | "lost";

export interface OpportunityCard {
  companyId: string;
  companyName: string;
  tagline: string | null;
  industry: string | null;
  country: string | null;
  fundingRoundType: string | null;
  fundingAskAmount: number | null;
  valuation: number | null;
  matchScore?: number | null;
  matchStatus: MatchStatus | string;
  isInvestorReady: boolean;
  lastUpdatedAt: string;
  // Lifecycle enrichment fields
  dealId?: string | null;
  dealStatus?: string | null;
  currentTurn?: string | null;
  holdingId?: string | null;
  investmentAmount?: number | null;
  equityPercentage?: number | null;
  instrumentType?: string | null;
  closedAt?: string | null;
  stage?: PipelineColumnKey | string | null;
}

export interface OpportunityFeed {
  totalMatches: number;
  newMatchesToday: number;
  items: OpportunityCard[];
}

export interface OpportunityScoreBreakdown {
  sectorFit: number;
  stageFit: number;
  checkSizeFit: number;
  geographyFit: number;
  equityTypeFit: number;
  investmentHistoryFit: number;
  revenueStageScore: number;
  marketSizeScore: number;
  growthPotentialScore: number;
}

export interface EquityEntry {
  stakeholderName: string | null;
  type: string | null;
  sharesOwned: number;
  vestingMonths: number | null;
  investmentAmount: number | null;
}

export interface OpportunityCapTableSummary {
  totalShares: number;
  esopPoolPercent: number;
  entries: EquityEntry[];
}

export interface OpportunityTeamMember {
  name: string | null;
  role: string | null;
}

export interface OpportunityDetail {
  companyId: string;
  companyName: string;
  tagline: string | null;
  industry: string | null;
  country: string | null;
  fundingRoundType: string | null;
  fundingAskAmount: number | null;
  equityOfferedPercent: number | null;
  preMoneyValuation: number | null;
  valuation: number | null;
  trustScore: number;
  isInvestorReady: boolean;
  matchScore?: number | null;
  matchStatus: MatchStatus | string;
  matchRationale: string | null;
  scoreBreakdown?: OpportunityScoreBreakdown | null;
  ndaRequired: boolean;
  ndaAccepted: boolean;
  ndaAcceptedAt: string | null;
  /** Present only when ndaAccepted is true. */
  capTableSummary: OpportunityCapTableSummary | null;
  /** Present only when ndaAccepted is true. */
  team: OpportunityTeamMember[] | null;
  documentsCount: number;
  aiReviewScore: number | null;
  lastUpdatedAt: string;
}

export interface InvestorPipelineSummary {
  activeDeals: number;
  capitalCommitted: number;
  averageMatchScore: number;
}

export interface InvestorPipelineColumns {
  newMatches: OpportunityCard[];
  inReview: OpportunityCard[];
  ndaSigned: OpportunityCard[];
  dataRoom: OpportunityCard[];
  negotiation: OpportunityCard[];
  won?: OpportunityCard[];
  lost?: OpportunityCard[];
}

export interface InvestorPipeline {
  summary: InvestorPipelineSummary;
  columns: InvestorPipelineColumns;
}

export interface NdaAcceptanceResult {
  acceptedAt: string;
  ndaTextHash: string;
}

export interface InvestorDocumentListItem {
  documentId: string;
  title: string | null;
  category: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number;
  uploadedAt: string;
}

export interface InvestorDocumentList {
  ndaRequired: boolean;
  ndaAccepted: boolean;
  items: InvestorDocumentListItem[];
}

export interface InvestorReviewedDocument {
  documentId: string;
  title: string | null;
  viewedAt: string;
}

export interface InvestorSession {
  viewedDocsCount: number;
  totalDocsCount: number;
  viewEventsCount: number;
  downloadEventsCount: number;
  firstAccessAt: string | null;
  lastAccessAt: string | null;
  reviewedDocuments: InvestorReviewedDocument[];
}

export interface DiligenceProgress {
  totalItems: number;
  completed: number;
  inProgress: number;
  pending: number;
  flagged: number;
  percentComplete: number;
}

export interface OpportunityFeedFilters {
  sector?: string;
  stage?: string;
  geography?: string;
  take?: number;
}
