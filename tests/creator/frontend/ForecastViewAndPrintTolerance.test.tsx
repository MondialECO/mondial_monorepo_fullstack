import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ForecastView } from '@/components/creator/ai/ForecastView';
import PlanForecastPrintView from '@/components/creator/PlanForecastPrintView';
import type { ForecastOutput } from '@/types/creator/ai';

// Mock recharts responsive container / area chart in jsdom
vi.mock('recharts', async () => {
  const actual = await vi.importActual<any>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: ({ children }: any) => <div data-testid="mock-area-chart">{children}</div>,
  };
});

const trimmedForecast: ForecastOutput = {
  schemaVersion: 1,
  aiMonthCount: 12,
  revenueForecast: {
    currency: 'EUR',
    summary: 'Strong initial adoption.',
    monthly: [
      { month: 1, amount: 10000, notes: 'Launch month' },
      { month: 2, amount: 15000, notes: 'Direct outreach' },
    ],
  },
  costForecast: {
    currency: 'EUR',
    summary: 'Stable baseline operating costs.',
    monthly: [
      { month: 1, fixedCosts: 5000, variableCosts: 2000 }, // NO notes field
      { month: 2, fixedCosts: 5000, variableCosts: 3000 }, // NO notes field
    ],
  },
  cashFlowProjection: {
    currency: 'EUR',
    summary: 'Positive operational runway.',
    monthly: [
      { month: 1, netCashFlow: 3000, endingBalance: 3000 }, // NO notes field
      { month: 2, netCashFlow: 7000, endingBalance: 10000 }, // NO notes field
    ],
  },
  breakEvenAnalysis: {
    breakEvenMonth: 1,
    isAchievedWithinHorizon: true,
    summary: 'Break-even reached in Month 1.',
  },
  assumptions: ['Conservative conversion rate', 'Low churn'],
  risks: [
    { category: 'Execution', description: 'Hiring delay', likelihood: 'low', impact: 'medium', mitigation: 'Agencies' },
  ],
  advisoryNotice: 'Planning estimates only.',
};

const legacyForecastWithNotes: ForecastOutput = {
  ...trimmedForecast,
  costForecast: {
    ...trimmedForecast.costForecast!,
    monthly: [
      { month: 1, fixedCosts: 5000, variableCosts: 2000, notes: 'Unused cost note M1' },
      { month: 2, fixedCosts: 5000, variableCosts: 3000, notes: 'Unused cost note M2' },
    ],
  },
  cashFlowProjection: {
    ...trimmedForecast.cashFlowProjection!,
    monthly: [
      { month: 1, netCashFlow: 3000, endingBalance: 3000, notes: 'Unused cash note M1' },
      { month: 2, netCashFlow: 7000, endingBalance: 10000, notes: 'Unused cash note M2' },
    ],
  },
};

describe('ForecastView and PlanForecastPrintView Consumer Tolerance', () => {
  describe('ForecastView (Interactive Dashboard View)', () => {
    it('renders trimmed forecast without notes on cost or cash-flow without throwing or breaking layout', () => {
      render(<ForecastView output={trimmedForecast} />);

      expect(screen.getByText('Financial Forecast - 36-Month Projection')).toBeInTheDocument();
      expect(screen.getByText('Launch month')).toBeInTheDocument();
      expect(screen.getByText('Direct outreach')).toBeInTheDocument();
      expect(screen.getByText('Break-Even Achieved: Month 1')).toBeInTheDocument();
    });

    it('renders legacy forecast with notes identically', () => {
      render(<ForecastView output={legacyForecastWithNotes} />);

      expect(screen.getByText('Financial Forecast - 36-Month Projection')).toBeInTheDocument();
      expect(screen.getByText('Launch month')).toBeInTheDocument();
      // Cost and cash notes were never rendered on screen
      expect(screen.queryByText('Unused cost note M1')).not.toBeInTheDocument();
      expect(screen.queryByText('Unused cash note M1')).not.toBeInTheDocument();
    });
  });

  describe('PlanForecastPrintView (Print / Export View)', () => {
    it('renders trimmed forecast in print table tolerating omitted cost/cash notes', () => {
      render(
        <PlanForecastPrintView
          open={true}
          projectName="Test Project"
          project={{ problem: 'Problem', solution: 'Solution', targetUser: 'Users' }}
          plan={null}
          forecast={trimmedForecast}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('7. Financial Projections')).toBeInTheDocument();
      expect(screen.getByText('Consolidated monthly forecast')).toBeInTheDocument();
      expect(screen.getByText('Launch month')).toBeInTheDocument();
    });

    it('renders legacy forecast in print view gracefully', () => {
      render(
        <PlanForecastPrintView
          open={true}
          projectName="Test Project"
          project={{ problem: 'Problem', solution: 'Solution', targetUser: 'Users' }}
          plan={null}
          forecast={legacyForecastWithNotes}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('7. Financial Projections')).toBeInTheDocument();
      expect(screen.getByText('Consolidated monthly forecast')).toBeInTheDocument();
    });
  });
});
