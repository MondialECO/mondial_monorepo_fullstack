import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForecastPage from '@/app/dashboard/creator/phase-3/forecast/page';
import * as creatorAiQueries from '@/hooks/queries/creator-ai';
import * as creatorJourneyApi from '@/lib/api-creator-journey';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/creator/phase-3/forecast',
}));

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    completeStep: vi.fn(),
  }),
}));

vi.mock('@/lib/api-creator-journey', () => ({
  creatorJourneyApi: {
    get: vi.fn(),
    setPhase3Session: vi.fn(),
  },
  getCreatorWorkspaceIdea: vi.fn(() => 'idea-123'),
}));

vi.mock('recharts', async () => {
  const actual = await vi.importActual<any>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div data-testid="mock-responsive-container">{children}</div>,
    AreaChart: ({ children }: any) => <svg data-testid="mock-area-chart">{children}</svg>,
  };
});

describe('ForecastPage (Step 3.3 Figma Node 57157:9297 Alignment)', () => {
  const mockForecastOutput = {
    schemaVersion: 1,
    aiMonthCount: 12,
    revenueForecast: {
      currency: 'EUR',
      summary: '36-month revenue scaling projection.',
      monthly: Array.from({ length: 36 }, (_, i) => ({
        month: i + 1,
        amount: Math.round(75 * Math.pow(1.10, i) * 32),
        notes: `Month ${i + 1} revenue`,
      })),
    },
    costForecast: {
      currency: 'EUR',
      summary: 'Operational and variable cost structure.',
      monthly: Array.from({ length: 36 }, (_, i) => ({
        month: i + 1,
        fixedCosts: 8000,
        variableCosts: Math.round(75 * Math.pow(1.10, i) * 5),
        notes: `Month ${i + 1} cost`,
      })),
    },
    cashFlowProjection: {
      currency: 'EUR',
      summary: 'Cash flow dynamics and liquidity milestones.',
      monthly: Array.from({ length: 36 }, (_, i) => ({
        month: i + 1,
        netCashFlow: Math.round(75 * Math.pow(1.10, i) * 27) - 8000,
        endingBalance: 40000 + (i * 2000 - 15000),
        notes: `Month ${i + 1} cash`,
      })),
    },
    breakEvenAnalysis: {
      breakEvenMonth: 16,
      isAchievedWithinHorizon: true,
      summary: 'Break-even reached in Month 16 with 316 subscribers.',
    },
    assumptions: [
      '75 subscribers at launch',
      '15% new subscribers and 5% churn each month — 10% net growth',
      '€32 average price per subscriber',
      '€5 delivery and logistics cost per subscriber',
      '€8,000 fixed costs, flat for 36 months',
      'Months 13–36 extend the first-year trend',
      'Excludes future funding rounds and large one-off purchases',
    ],
    risks: [
      { category: 'Funding risk', description: 'Your budget runs out in month 8 and cash stays negative until month 21.', likelihood: 'High' },
      { category: 'Growth shortfall', description: 'If net growth falls from 10% to 8%, break-even moves 3 months later.', likelihood: 'Medium' },
      { category: 'Subscriber retention', description: 'If churn rises from 5% to 8%, break-even moves 6 months later.', likelihood: 'Medium' },
      { category: 'Delivery cost', description: '€5 per subscriber is a conservative estimate.', likelihood: 'Low' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: {
          name: 'AutoInvoice',
          sector: 'Retail SaaS',
          geography: 'France',
        },
        phase3Data: {
          forecastSessionId: 'session-fc-123',
          businessPlanSessionId: 'session-bp-456',
          marketStudySessionId: 'session-ms-789',
        },
      },
    });

    vi.spyOn(creatorAiQueries, 'useAiCredits').mockReturnValue({
      data: { balance: 152, costs: { Forecast: 32 } },
      isLoading: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useStartForecast').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        sessionId: 'session-fc-123',
        status: 'completed',
        output: mockForecastOutput,
        inputs: {
          arpu: 32,
          opex: 8000,
          monthlyGrowthPct: 15,
          tam: 900_000_000,
          monthlyChurnPct: 5,
        },
      },
    } as any);

    vi.spyOn(creatorAiQueries, 'useBusinessPlanSessionTimed').mockReturnValue({
      data: { output: null },
    } as any);

    vi.spyOn(creatorAiQueries, 'useBusinessModelSessionTimed').mockReturnValue({
      data: {
        output: {
          unitEconomics: {
            arpu: { amount: 32, currency: 'EUR' },
            cac: { amount: 63, currency: 'EUR' },
            ltv: { amount: 540, currency: 'EUR' },
            ltvToCacRatio: 8.6,
            paybackPeriodMonths: 2.3,
          },
        },
      },
    } as any);

    vi.spyOn(creatorAiQueries, 'useMarketStudySessionTimed').mockReturnValue({
      data: {
        output: {
          marketSizing: {
            tam: { value: 1_200_000_000, sourceAttribution: 'Industry Report' },
          },
        },
      },
    } as any);
  });

  it('renders Section 1 Header with exact copy, credit badge, and actions', async () => {
    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getAllByText('STEP 3.3 · FINANCIAL FORECAST').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('heading', { name: 'Your 3-year financial forecast', level: 1 })).toBeInTheDocument();
      expect(screen.getByText('36 months · Months 1–12 modelled, 13–36 projected · EUR')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download report/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Regenerate/i })).toBeInTheDocument();
      expect(screen.getByText(/Uses 32 credits · balance 152/i)).toBeInTheDocument();
    });
  });

  it('renders Section 2.5 Executive Verdict Hero Card with break-even and runway', async () => {
    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getByText(/You break even in/i)).toBeInTheDocument();
      expect(screen.getAllByText(/month 16/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/all losses are recovered by/i)).toBeInTheDocument();
      expect(screen.getByText(/Funding gap/i)).toBeInTheDocument();
      expect(screen.getByText(/A projection based on your assumptions, not a prediction/i)).toBeInTheDocument();
    });
  });

  it('renders Section 3 Three Summary Cards (Revenue, Cost vs Revenue, Cash Position)', async () => {
    render(<ForecastPage />);

    await waitFor(() => {
      // Card A: Revenue
      expect(screen.getAllByText('REVENUE').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Year 3 revenue')).toBeInTheDocument();
      expect(screen.getByText('YEAR 1')).toBeInTheDocument();
      expect(screen.getByText('YEAR 2')).toBeInTheDocument();
      expect(screen.getByText('YEAR 3')).toBeInTheDocument();
      expect(screen.getByText('Modelled')).toBeInTheDocument();
      expect(screen.getByText('Projected')).toBeInTheDocument();
      expect(screen.getByText('Growth slows to projection after month 12.')).toBeInTheDocument();

      // Card B: Cost vs Revenue
      expect(screen.getByText('COST VS REVENUE')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Total cost')).toBeInTheDocument();
      expect(screen.getByText(/Inflection point to operating profit/i)).toBeInTheDocument();
      expect(screen.getByText(/Revenue first covers all costs at/i)).toBeInTheDocument();

      // Card C: Cash Position
      expect(screen.getByText('CASH POSITION')).toBeInTheDocument();
      expect(screen.getAllByText(/Lowest cash point/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByLabelText(/36-month cash position bar chart/i)).toBeInTheDocument();
    });
  });

  it('renders Section 4 Assumptions / Live Simulation Parameters with 8 operational drivers', async () => {
    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getByText(/ASSUMPTIONS CONFIGURE KEY OPERATIONAL DRIVERS FOR THIS BUSINESS MODEL/i)).toBeInTheDocument();
      expect(screen.getByText('Starting budget')).toBeInTheDocument();
      expect(screen.getByText('Subscribers at launch')).toBeInTheDocument();
      expect(screen.getByText('New subscribers')).toBeInTheDocument();
      expect(screen.getByText('Monthly churn')).toBeInTheDocument();
      expect(screen.getAllByText('Price per subscriber').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Variable cost')).toBeInTheDocument();
      expect(screen.getByText('Fixed costs')).toBeInTheDocument();
      expect(screen.getByText('Market size')).toBeInTheDocument();
    });
  });

  it('triggers Section 2 out-of-date alert strip when an assumption is edited live', async () => {
    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getByText('Starting budget')).toBeInTheDocument();
    });

    const budgetInput = screen.getByDisplayValue('40000');
    fireEvent.change(budgetInput, { target: { value: '50000' } });

    await waitFor(() => {
      expect(screen.getByText(/Assumptions changed since last run — results may be out of date/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Regenerate now/i })).toBeInTheDocument();
      expect(screen.getByText(/Your €50,000 starting budget/i)).toBeInTheDocument();
    });
  });

  it('dynamically seeds starting budget from journey seed funding ask when available', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValueOnce({
      journey: {
        project: { name: 'FinTech App' },
        phase3Data: { forecastSessionId: 'session-fc-123' },
        phase5Data: { pathB: { seedFunding: { totalAsk: 65000 } } },
      },
    });

    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('65000')).toBeInTheDocument();
      expect(screen.getByText(/Your €65,000 starting budget/i)).toBeInTheDocument();
    });
  });

  it('renders Section 5 36-Month Data Table with Year 1, 2, 3 blocks and subtotals', async () => {
    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getByText('Financial Forecast — 36-Month Projection')).toBeInTheDocument();
      expect(screen.getByText('YEAR 1 · MODELLED')).toBeInTheDocument();
      expect(screen.getByText('Y1 SUBTOTAL')).toBeInTheDocument();
      expect(screen.getByText('YEAR 2 · PROJECTED')).toBeInTheDocument();
      expect(screen.getByText('Y2 SUBTOTAL')).toBeInTheDocument();
      expect(screen.getByText('YEAR 3 · PROJECTED')).toBeInTheDocument();
      expect(screen.getByText('Y3 SUBTOTAL')).toBeInTheDocument();
      expect(screen.getByText('End of detailed modelled period')).toBeInTheDocument();
      expect(screen.getByText('Operational profit reached')).toBeInTheDocument();
      expect(screen.getByText('Full 3-year projection complete')).toBeInTheDocument();
    });
  });

  it('renders Section 6 Side-by-Side Break-Even and Unit Economics Cards', async () => {
    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Break-even/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Unit economics')).toBeInTheDocument();
      expect(screen.getByText('Monthly fixed costs')).toBeInTheDocument();
      expect(screen.getAllByText('Price per subscriber').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Contribution per subscriber')).toBeInTheDocument();
      expect(screen.getByText('Subscribers needed')).toBeInTheDocument();
      expect(screen.getByText('CAC')).toBeInTheDocument();
      expect(screen.getByText('LTV')).toBeInTheDocument();
      expect(screen.getByText('LTV / CAC')).toBeInTheDocument();
      expect(screen.getByText('Gross margin')).toBeInTheDocument();
    });
  });

  it('renders Section 7 Key Model Assumptions and Risk Assessment', async () => {
    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getByText('Key model assumptions')).toBeInTheDocument();
      expect(screen.getByText('Risk assessment')).toBeInTheDocument();
      expect(screen.getByText(/1. Funding risk/i)).toBeInTheDocument();
      expect(screen.getByText(/2. Growth shortfall/i)).toBeInTheDocument();
      expect(screen.getByText(/3. Subscriber retention/i)).toBeInTheDocument();
      expect(screen.getByText(/4. Delivery cost/i)).toBeInTheDocument();
    });
  });

  it('renders Section 8 Milestones complete card and footer navigation buttons', async () => {
    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getByText('MILESTONES COMPLETE')).toBeInTheDocument();
      expect(screen.getByText('Step complete (6/6)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Business Model/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue to Legal & Compliance/i })).toBeInTheDocument();
    });
  });
});
