import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InvestorDashboard from '@/app/dashboard/investor/page';
import * as investorHooks from '@/hooks/queries/investor';
import * as financeHooks from '@/hooks/queries/investor-finance';
import type { InvestorPortfolioResponse, InvestorStats, CompanyPortfolioHolding } from '@/types/investor/dashboard';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard/investor',
}));

// Mock react-query hooks
vi.mock('@/hooks/queries/investor', () => ({
  useInvestorStats: vi.fn(),
  useInvestorPortfolio: vi.fn(),
  useInvestorPortfolioHolding: vi.fn(),
  useInvestorProfile: vi.fn(),
  useInvestorSettings: vi.fn(),
}));

vi.mock('@/hooks/queries/investor-finance', () => ({
  useInvestorFinanceVerification: vi.fn(),
}));

describe('Investor Phase 9B Portfolio Holdings UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(financeHooks.useInvestorFinanceVerification).mockReturnValue({
      data: { status: 'verified', financeVerified: true } as any,
      isLoading: false,
      isError: false,
    } as any);
  });

  it('renders loading state when queries are loading', () => {
    vi.mocked(investorHooks.useInvestorStats).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);
    vi.mocked(investorHooks.useInvestorPortfolio).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);

    render(<InvestorDashboard />);
    expect(screen.getByText(/loading your portfolio/i)).toBeInTheDocument();
  });

  it('renders empty state when investor has no holdings', () => {
    const emptyPortfolio: InvestorPortfolioResponse = {
      totalInvested: 0,
      currency: 'USD',
      totalHoldingsCount: 0,
      distinctCompaniesCount: 0,
      companyHoldings: [],
      ideaInvestments: [],
    };
    const emptyStats: InvestorStats = {
      totalInvested: 0,
      numberOfInvestments: 0,
      companiesInvested: 0,
      activeInvestments: 0,
      companyHoldings: [],
      investments: [],
    };

    vi.mocked(investorHooks.useInvestorStats).mockReturnValue({
      data: emptyStats,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(investorHooks.useInvestorPortfolio).mockReturnValue({
      data: emptyPortfolio,
      isLoading: false,
      isError: false,
    } as any);

    render(<InvestorDashboard />);
    expect(screen.getByText(/no company holdings yet/i)).toBeInTheDocument();
    expect(screen.getByText(/when you sign term sheets and close deals/i)).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('renders real company holdings with equity details and provenance', () => {
    const equityHolding: CompanyPortfolioHolding = {
      id: 'hold-1',
      companyId: 'comp-100',
      companyName: 'Acme Robotics',
      industry: 'AI & Robotics',
      dealExecutionId: 'deal-exec-abc12345',
      matchId: 'match-1',
      investmentAmount: 150000,
      currency: 'USD',
      instrumentType: 'equity',
      equityPercentage: 10.0,
      entryValuation: 1500000,
      investmentDate: '2026-08-20T10:00:00Z',
      status: 'active',
    };

    const portfolio: InvestorPortfolioResponse = {
      totalInvested: 150000,
      currency: 'USD',
      totalHoldingsCount: 1,
      distinctCompaniesCount: 1,
      companyHoldings: [equityHolding],
      ideaInvestments: [],
    };

    const stats: InvestorStats = {
      totalInvested: 150000,
      numberOfInvestments: 1,
      companiesInvested: 1,
      activeInvestments: 1,
      instrumentBreakdown: { equity: 1, safe: 0, convertible_note: 0, debt: 0 },
      companyHoldings: [equityHolding],
    };

    vi.mocked(investorHooks.useInvestorStats).mockReturnValue({
      data: stats,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(investorHooks.useInvestorPortfolio).mockReturnValue({
      data: portfolio,
      isLoading: false,
      isError: false,
    } as any);

    render(<InvestorDashboard />);

    // Company Name and details
    expect(screen.getByText('Acme Robotics')).toBeInTheDocument();
    expect(screen.getByText('AI & Robotics')).toBeInTheDocument();
    expect(screen.getByText(/Deal #deal-exe/i)).toBeInTheDocument();

    // Instrument Badge
    expect(screen.getByText('Equity')).toBeInTheDocument();

    // Financial breakdown
    expect(screen.getByText('$150,000 USD')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('Confirmed Equity')).toBeInTheDocument();
    expect(screen.getByText('$1,500,000')).toBeInTheDocument();
    expect(screen.getByText('Entry Valuation')).toBeInTheDocument();

    // Stats
    expect(screen.getByText('$150,000')).toBeInTheDocument();
    expect(screen.getAllByText('01').length).toBeGreaterThanOrEqual(1);
  });

  it('renders SAFE holding with valuation cap and does not display fake equity percentage', () => {
    const safeHolding: CompanyPortfolioHolding = {
      id: 'hold-2',
      companyId: 'comp-200',
      companyName: 'NextGen Health',
      industry: 'HealthTech',
      dealExecutionId: 'deal-exec-safe9999',
      investmentAmount: 75000,
      currency: 'USD',
      instrumentType: 'safe',
      equityPercentage: null, // SAFE has no confirmed equity percentage
      valuationCap: 5000000,
      discountRate: 20,
      investmentDate: '2026-08-22T10:00:00Z',
      status: 'active',
    };

    const portfolio: InvestorPortfolioResponse = {
      totalInvested: 75000,
      currency: 'USD',
      totalHoldingsCount: 1,
      distinctCompaniesCount: 1,
      companyHoldings: [safeHolding],
      ideaInvestments: [],
    };

    vi.mocked(investorHooks.useInvestorStats).mockReturnValue({
      data: {
        totalInvested: 75000,
        numberOfInvestments: 1,
        companiesInvested: 1,
        activeInvestments: 1,
        instrumentBreakdown: { equity: 0, safe: 1, convertible_note: 0, debt: 0 },
      },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(investorHooks.useInvestorPortfolio).mockReturnValue({
      data: portfolio,
      isLoading: false,
      isError: false,
    } as any);

    render(<InvestorDashboard />);

    expect(screen.getByText('NextGen Health')).toBeInTheDocument();
    expect(screen.getByText('SAFE')).toBeInTheDocument();
    expect(screen.getByText('$75,000 USD')).toBeInTheDocument();
    expect(screen.getByText('Valuation Cap')).toBeInTheDocument();
    expect(screen.getByText('$5,000,000')).toBeInTheDocument();
    expect(screen.getByText('Discount Rate')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();

    // Ensure Confirmed Equity is NOT displayed for SAFE
    expect(screen.queryByText('Confirmed Equity')).not.toBeInTheDocument();
  });

  it('renders Convertible Note and Debt holdings with interest rate and no fake equity', () => {
    const noteHolding: CompanyPortfolioHolding = {
      id: 'hold-3',
      companyId: 'comp-300',
      companyName: 'FinMatrix',
      industry: 'FinTech',
      dealExecutionId: 'deal-exec-note4567',
      investmentAmount: 100000,
      currency: 'USD',
      instrumentType: 'convertible_note',
      equityPercentage: null,
      interestRate: 6.0,
      maturityDate: '2028-08-20T00:00:00Z',
      investmentDate: '2026-08-20T10:00:00Z',
      status: 'active',
    };

    const portfolio: InvestorPortfolioResponse = {
      totalInvested: 100000,
      currency: 'USD',
      totalHoldingsCount: 1,
      distinctCompaniesCount: 1,
      companyHoldings: [noteHolding],
      ideaInvestments: [],
    };

    vi.mocked(investorHooks.useInvestorStats).mockReturnValue({
      data: {
        totalInvested: 100000,
        numberOfInvestments: 1,
        companiesInvested: 1,
        activeInvestments: 1,
        instrumentBreakdown: { equity: 0, safe: 0, convertible_note: 1, debt: 0 },
      },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(investorHooks.useInvestorPortfolio).mockReturnValue({
      data: portfolio,
      isLoading: false,
      isError: false,
    } as any);

    render(<InvestorDashboard />);

    expect(screen.getByText('FinMatrix')).toBeInTheDocument();
    expect(screen.getByText('Convertible Note')).toBeInTheDocument();
    expect(screen.getByText('$100,000 USD')).toBeInTheDocument();
    expect(screen.getByText('Interest Rate')).toBeInTheDocument();
    expect(screen.getByText('6% p.a.')).toBeInTheDocument();
    expect(screen.getByText('Maturity Date')).toBeInTheDocument();

    // Ensure Confirmed Equity is NOT displayed for note
    expect(screen.queryByText('Confirmed Equity')).not.toBeInTheDocument();
  });

  it('separates Company Holdings and Idea investments via tabs', () => {
    const equityHolding: CompanyPortfolioHolding = {
      id: 'hold-1',
      companyId: 'comp-100',
      companyName: 'Acme Corp',
      dealExecutionId: 'deal-1',
      investmentAmount: 50000,
      currency: 'USD',
      instrumentType: 'equity',
      equityPercentage: 5.0,
      investmentDate: '2026-08-20T10:00:00Z',
      status: 'active',
    };

    const ideaInvestment = {
      id: 'idea-inv-1',
      ideaName: 'Solar Drone Delivery',
      creatorName: 'Alice Innovator',
      investedAmount: 5000,
      equityOwned: 2.5,
      status: 'active' as const,
      investmentDate: '2026-07-15T00:00:00Z',
    };

    const portfolio: InvestorPortfolioResponse = {
      totalInvested: 55000,
      currency: 'USD',
      totalHoldingsCount: 2,
      distinctCompaniesCount: 1,
      companyHoldings: [equityHolding],
      ideaInvestments: [ideaInvestment],
    };

    vi.mocked(investorHooks.useInvestorStats).mockReturnValue({
      data: {
        totalInvested: 55000,
        numberOfInvestments: 2,
        companiesInvested: 1,
        activeInvestments: 2,
      },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(investorHooks.useInvestorPortfolio).mockReturnValue({
      data: portfolio,
      isLoading: false,
      isError: false,
    } as any);

    render(<InvestorDashboard />);

    // Default tab shows Company Holdings
    expect(screen.getByText('Company Holdings (1)')).toBeInTheDocument();
    expect(screen.getByText('Idea Investments (1)')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText('Solar Drone Delivery')).not.toBeInTheDocument();

    // Click Idea Investments Tab
    fireEvent.click(screen.getByText('Idea Investments (1)'));
    expect(screen.getByText('Solar Drone Delivery')).toBeInTheDocument();
    expect(screen.getByText('by Alice Innovator')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });
});
