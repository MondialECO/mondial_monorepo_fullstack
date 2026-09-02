export type InvestmentInstrumentType = 'equity' | 'safe' | 'convertible_note' | 'debt';

export type CompanyPortfolioHolding = {
  id: string;
  holdingId?: string | null;
  companyId: string;
  companyName: string;
  industry?: string | null;
  dealExecutionId: string;
  matchId?: string | null;
  investmentAmount: number;
  currency: string;
  instrumentType: InvestmentInstrumentType;
  equityPercentage?: number | null;
  entryValuation?: number | null;
  valuationCap?: number | null;
  discountRate?: number | null;
  interestRate?: number | null;
  maturityDate?: string | null;
  investmentDate: string;
  status: 'active' | 'exited' | 'written_off';
};

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

export type InvestorPortfolioResponse = {
  totalInvested: number;
  currency: string;
  totalHoldingsCount: number;
  distinctCompaniesCount: number;
  companyHoldings: CompanyPortfolioHolding[];
  ideaInvestments: Investment[];
};

export type InvestorStats = {
  totalInvested: number;
  portfolioValue?: number;
  numberOfInvestments: number;
  companiesInvested?: number;
  activeInvestments: number;
  averageROI?: number;
  instrumentBreakdown?: {
    equity: number;
    safe: number;
    convertible_note: number;
    debt: number;
  };
  companyHoldings?: CompanyPortfolioHolding[];
  investments?: Investment[];
};

export type InvestorProfile = Record<string, unknown>;

export type InvestorSettings = Record<string, unknown>;
