export type Investment = {
  id: string;
  ideaName: string;
  creatorName: string;
  investedAmount: number;
  equityOwned: number;
  status: 'active' | 'completed' | 'withdrawn';
  investmentDate: string;
  currentValuation?: number;
  returns?: number;
  fundingRound?: string;
};

export type InvestorStats = {
  totalInvested: number;
  portfolioValue: number;
  numberOfInvestments: number;
  averageROI: number;
  activeInvestments: number;
  investments: Investment[];
};

export type InvestorProfile = Record<string, unknown>;

export type InvestorSettings = Record<string, unknown>;
