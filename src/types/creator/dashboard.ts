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

export type DashboardStats = {
  totalIdeas: number;
  totalClicksLast14Days: number;
  totalFundRaised: number;
  totalRequired: number;
  totalEquity: number;
  activeInvestors: number;
  ideas: Idea[];
};

export type Investor = {
  name: string;
  ideaName: string;
  invested: string;
  avatarUrl?: string;
  equity: string;
};