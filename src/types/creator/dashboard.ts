export type Idea = {
  id: string;
  name: string;
  status: string;
  stageLabel: string | null;
  isPublished: boolean;
  createdAt: string;
  creatdate?: string;
  fundingRequired: number;
  equityOffered: number;
  totalRaised: number;
  fundingProgress: number;
  investors: unknown[];
  marketSize?: string;
  views?: number;
  equity?: number;
};

// Investor-readiness score, computed at Phase-3 masterplan completion (P1.8) and
// surfaced by GET /creator/dashboard/stats. `null` until a masterplan has run.
export type InvestorReadinessScore = {
  total: number;
  label: string; // Not Ready | Developing | Strong | Investor-Ready
  breakdown: {
    conceptClarity: number;
    marketEvidence: number;
    financialModel: number;
    legalReadiness: number;
    teamCredibility: number;
  };
};

export type DashboardStats = {
  totalIdeas: number;
  totalClicksLast14Days: number;
  totalFundRaised: number;
  totalRequired: number;
  totalEquity: number;
  activeInvestors: number;
  investorReadinessScore?: InvestorReadinessScore | null;
  ideas: Idea[];
};

export type Investor = {
  name: string;
  ideaName: string;
  invested: string;
  avatarUrl?: string;
  equity: string;
};

export type CreatorProfile = Record<string, unknown>;

export type BillingInfo = Record<string, unknown>;

export type CreatorSettings = Record<string, unknown>;