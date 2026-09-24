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
  useSearchParams: () => new URLSearchParams({ ideaId: 'idea-test-123' }),
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
  getCreatorWorkspaceIdea: vi.fn(() => 'idea-test-123'),
}));

vi.mock('recharts', async () => {
  const actual = await vi.importActual<any>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: ({ children }: any) => <svg>{children}</svg>,
  };
});

describe('Step 3.3 Financial Forecast New Flow', () => {
  const mockStartForecastMutate = vi.fn();
  const mockRegenerateMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.spyOn(creatorAiQueries, 'useAiCredits').mockReturnValue({
      data: { balance: 152, costs: { Forecast: 32 } },
      isLoading: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useStartForecast').mockReturnValue({
      mutateAsync: mockStartForecastMutate.mockResolvedValue({
        sessionId: 'new-fc-session',
        jobId: 'job-123',
      }),
      isPending: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useRegenerateForecast').mockReturnValue({
      mutateAsync: mockRegenerateMutate.mockResolvedValue({
        sessionId: 'new-fc-session',
        jobId: 'job-124',
      }),
      isPending: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useForecastAssumptions').mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useBudgetSuggestion').mockReturnValue({
      data: {
        suggestedBudget: 48000,
        rationale: 'Based on your SaaS model with €8,000/mo OPEX, a 6-month runway of €48,000 is recommended.',
        runwayMonths: 6,
        provenance: 'ai_suggested',
      },
      isLoading: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useBusinessPlanSessionTimed').mockReturnValue({
      data: { output: null },
    } as any);

    vi.spyOn(creatorAiQueries, 'useBusinessModelSessionTimed').mockReturnValue({
      data: { output: null },
    } as any);

    vi.spyOn(creatorAiQueries, 'useMarketStudySessionTimed').mockReturnValue({
      data: { output: null },
    } as any);
  });

  it('first visit: automatically opens Starting Budget popup with AI suggested amount and rationale', async () => {
    // No prior forecast session in journey (first visit)
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'EcoVenture', sector: 'CleanTech' },
        phase3Data: {},
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'idle',
      data: null,
    } as any);

    render(<ForecastPage />);

    // Popup opens automatically
    await waitFor(() => {
      expect(screen.getByText('Starting Budget Setup')).toBeInTheDocument();
    });

    // Contains AI Grounded estimate & rationale
    expect(screen.getByText('€48,000')).toBeInTheDocument();
    expect(screen.getByText(/Based on your SaaS model with €8,000\/mo OPEX/)).toBeInTheDocument();
    expect(screen.getByText('6-Month Launch Runway')).toBeInTheDocument();
    expect(screen.getByText('Generate Financial Forecast')).toBeInTheDocument();
  });

  it('first visit: allows creator to edit amount manually before generating forecast', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'EcoVenture', sector: 'CleanTech' },
        phase3Data: {},
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'idle',
      data: null,
    } as any);

    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getByText('Starting Budget Setup')).toBeInTheDocument();
    });

    // Click "Edit Amount"
    const editBtn = screen.getByRole('button', { name: /Edit Amount/i });
    fireEvent.click(editBtn);

    // Input custom value
    const input = screen.getByPlaceholderText('50000');
    fireEvent.change(input, { target: { value: '65000' } });

    // Click "Set"
    const setBtn = screen.getByRole('button', { name: /Set/i });
    fireEvent.click(setBtn);

    // Verify custom value is reflected with "Your value" provenance
    expect(screen.getByText('€65,000')).toBeInTheDocument();
    expect(screen.getByText('Your value')).toBeInTheDocument();

    // Click "Generate Financial Forecast"
    const generateBtn = screen.getByRole('button', { name: /Generate Financial Forecast/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(mockStartForecastMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          startingBudget: 65000,
          provenance: { startingBudget: 'founder_confirmed' },
        })
      );
    });
  });

  it('existing forecast: clicking Regenerate opens Financial Inputs / Assumptions popup with saved values', async () => {
    // Existing forecast exists
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'EcoVenture' },
        phase3Data: { forecastSessionId: 'session-fc-existing' },
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        sessionId: 'session-fc-existing',
        status: 'Completed',
        currentVersion: 1,
        inputs: {
          startingBudget: 55000,
          launchSubscribers: 100,
          monthlyGrowthPct: 18,
          monthlyChurnPct: 4,
          arpu: 45,
          variableCost: 8,
          opex: 9500,
          tam: 850000000,
          provenance: {
            startingBudget: 'founder_confirmed',
            arpu: 'founder_confirmed',
          },
        },
        output: {
          revenueForecast: { monthly: [{ month: 1, amount: 4500 }] },
          costForecast: { monthly: [{ month: 1, fixedCosts: 9500, variableCosts: 800 }] },
          cashFlowProjection: { monthly: [{ month: 1, netCashFlow: -5800, endingBalance: 49200 }] },
        },
      },
    } as any);

    render(<ForecastPage />);

    // Results UI is loaded and StartingBudgetModal should NOT be automatically open
    await waitFor(() => {
      expect(screen.queryByText('Starting Budget Setup')).not.toBeInTheDocument();
      expect(screen.getByText(/Your 3-year financial forecast/i)).toBeInTheDocument();
    });

    // Click "Regenerate" button
    const regenerateBtn = screen.getByRole('button', { name: /Regenerate/i });
    fireEvent.click(regenerateBtn);

    // Financial Inputs / Assumptions popup opens
    await waitFor(() => {
      expect(screen.getByText('Adjust Forecast Assumptions')).toBeInTheDocument();
    });

    // Saved values pre-filled across the 8 drivers in the assumptions dialog
    expect(screen.getAllByDisplayValue('55000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByDisplayValue('100').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByDisplayValue('18').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByDisplayValue('4').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByDisplayValue('45').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByDisplayValue('8').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByDisplayValue('9500').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByDisplayValue('850000000').length).toBeGreaterThanOrEqual(1);

    // Provenance badge for customized fields
    const yourValueBadges = screen.getAllByText('Your value');
    expect(yourValueBadges.length).toBeGreaterThanOrEqual(2);

    // Modify a value in the dialog form and click "Recalculate & Regenerate"
    const opexInputs = screen.getAllByDisplayValue('9500');
    fireEvent.change(opexInputs[opexInputs.length - 1], { target: { value: '11000' } });

    const recalculateBtn = screen.getByRole('button', { name: /Recalculate & Regenerate/i });
    fireEvent.click(recalculateBtn);

    await waitFor(() => {
      expect(mockRegenerateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-fc-existing',
          payload: expect.objectContaining({
            startingBudget: 55000,
            opex: 11000,
            provenance: expect.objectContaining({
              opex: 'founder_confirmed',
            }),
          }),
        })
      );
    });
  });
});
