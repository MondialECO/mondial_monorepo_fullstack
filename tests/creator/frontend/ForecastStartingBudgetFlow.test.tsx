import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForecastPage from '@/app/dashboard/creator/phase-3/forecast/page';
import * as creatorAiQueries from '@/hooks/queries/creator-ai';
import * as creatorJourneyApi from '@/lib/api-creator-journey';
import creatorAiApi from '@/lib/api-creator-ai';

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

vi.mock('@/lib/api-creator-ai', () => ({
  default: {
    updateForecastAssumptions: vi.fn(),
  },
}));

vi.mock('recharts', async () => {
  const actual = await vi.importActual<any>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: ({ children }: any) => <svg>{children}</svg>,
  };
});

describe('Step 3.3 Financial Forecast Canonical Assumptions & Entry Flow', () => {
  const mockStartForecastMutate = vi.fn();
  const mockRegenerateMutate = vi.fn();

  const validForecastOutput = {
    revenueForecast: { monthly: [{ month: 1, amount: 4500 }] },
    costForecast: { monthly: [{ month: 1, fixedCosts: 9500, variableCosts: 800 }] },
    cashFlowProjection: { monthly: [{ month: 1, netCashFlow: -5800, endingBalance: 49200 }] },
    kpis: {
      breakEvenMonth: 14,
      year1Revenue: 54000,
      year2Revenue: 180000,
      year3Revenue: 450000,
      minCashBalance: 24000,
      fundingGap: 0,
    },
  };

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
      error: null,
    } as any);

    vi.spyOn(creatorAiQueries, 'useRegenerateForecast').mockReturnValue({
      mutateAsync: mockRegenerateMutate.mockResolvedValue({
        sessionId: 'new-fc-session',
        jobId: 'job-124',
      }),
      isPending: false,
      error: null,
    } as any);

    (creatorAiApi.updateForecastAssumptions as any).mockResolvedValue({
      success: true,
    });

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

  it('first visit with NO valid completed forecast: renders Adjust Forecast Assumptions page mode with Generate Forecast CTA', async () => {
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

    // Renders full page Adjust Forecast Assumptions form
    await waitFor(() => {
      expect(screen.queryByText(/Loading financial workspace/i)).not.toBeInTheDocument();
      expect(screen.getAllByText('Adjust Forecast Assumptions').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getAllByText(/Review the assumptions prepared from your Market Study and Business Model/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Generate Forecast/i })).toBeInTheDocument();

    // No modal popup
    expect(screen.queryByText('Starting Budget Setup')).not.toBeInTheDocument();
  });

  it('first visit submit: calls PUT /api/ai/forecast/assumptions FIRST, then POST /api/ai/forecast on success', async () => {
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
      expect(screen.queryByText(/Loading financial workspace/i)).not.toBeInTheDocument();
      expect(screen.getAllByText('Adjust Forecast Assumptions').length).toBeGreaterThanOrEqual(1);
    });

    // Modify Starting Budget
    const budgetInput = screen.getByDisplayValue('48000');
    fireEvent.change(budgetInput, { target: { value: '55000' } });

    // Click "Generate Forecast"
    const generateBtn = screen.getByRole('button', { name: /Generate Forecast/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      // 1. First calls assumptions save
      expect(creatorAiApi.updateForecastAssumptions).toHaveBeenCalledWith(
        expect.objectContaining({
          startingBudget: 55000,
          provenance: expect.objectContaining({
            startingBudget: 'founder_edited',
          }),
        }),
        'idea-test-123'
      );

      // 2. Then triggers forecast generation
      expect(mockStartForecastMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          businessIdeaId: 'idea-test-123',
          startingBudget: 55000,
        })
      );
    });
  });

  it('first visit submit failure: if PUT assumptions fails, does NOT call POST /api/ai/forecast', async () => {
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

    (creatorAiApi.updateForecastAssumptions as any).mockRejectedValueOnce(new Error('Network error saving assumptions'));

    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading financial workspace/i)).not.toBeInTheDocument();
      expect(screen.getAllByText('Adjust Forecast Assumptions').length).toBeGreaterThanOrEqual(1);
    });

    const generateBtn = screen.getByRole('button', { name: /Generate Forecast/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(creatorAiApi.updateForecastAssumptions).toHaveBeenCalled();
    });

    // POST /api/ai/forecast should NOT be called
    expect(mockStartForecastMutate).not.toHaveBeenCalled();
    expect(await screen.findByText(/Network error saving assumptions/i)).toBeInTheDocument();
  });

  it('existing valid completed forecast: renders Results UI directly and Adjust Assumptions opens modal with Recalculate & Regenerate CTA', async () => {
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
        output: validForecastOutput,
      },
    } as any);

    render(<ForecastPage />);

    // Results UI is loaded directly
    await waitFor(() => {
      expect(screen.queryByText(/Loading financial workspace/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Your 3-year financial forecast/i)).toBeInTheDocument();
    });

    // Click "Adjust Assumptions" button in Header
    const adjustBtn = screen.getByRole('button', { name: /Adjust Assumptions/i });
    fireEvent.click(adjustBtn);

    // Modal opens with canonical form and "Recalculate & Regenerate" CTA
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Recalculate & Regenerate/i })).toBeInTheDocument();
    });

    // Change OPEX value
    const opexInputs = screen.getAllByDisplayValue('9500');
    fireEvent.change(opexInputs[opexInputs.length - 1], { target: { value: '11000' } });

    const recalculateBtn = screen.getByRole('button', { name: /Recalculate & Regenerate/i });
    fireEvent.click(recalculateBtn);

    await waitFor(() => {
      // Calls PUT assumptions first
      expect(creatorAiApi.updateForecastAssumptions).toHaveBeenCalledWith(
        expect.objectContaining({
          opex: 11000,
        }),
        'idea-test-123'
      );

      // Then calls POST /api/ai/forecast/regenerate
      expect(mockRegenerateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-fc-existing',
          payload: expect.objectContaining({
            startingBudget: 55000,
            opex: 11000,
            provenance: expect.objectContaining({
              opex: 'founder_edited',
            }),
          }),
        })
      );
    });
  });

  it('v3 completed + v4 failed: preserves v3 Results and displays non-destructive failed regeneration notice with exact copy', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'EcoVenture' },
        phase3Data: { forecastSessionId: 'session-multi-ver' },
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        sessionId: 'session-multi-ver',
        status: 'Failed',
        currentVersion: 4,
        latestValidVersion: 3,
        hasValidCompletedForecast: true,
        inputs: {
          startingBudget: 60000,
          opex: 10000,
        },
        versions: [
          { version: 1, content: validForecastOutput },
          { version: 2, content: validForecastOutput },
          { version: 3, content: validForecastOutput },
          { version: 4, content: null, generatedContent: null }, // Failed v4
        ],
        error: 'AI Provider timeout',
      },
    } as any);

    render(<ForecastPage />);

    // Results UI remains visible using v3 data
    await waitFor(() => {
      expect(screen.queryByText(/Loading financial workspace/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Your 3-year financial forecast/i)).toBeInTheDocument();
    });

    // Non-destructive regeneration failure notice is displayed with exact copy
    expect(screen.getByText('We couldn’t regenerate your forecast.')).toBeInTheDocument();
    expect(screen.getByText(/Your previous forecast \(Version 3\) is still available./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Adjust Assumptions/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('v3 completed + v4 in-flight: preserves v3 Results and renders top regeneration processing banner with exact copy', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'EcoVenture' },
        phase3Data: { forecastSessionId: 'session-multi-ver-inflight' },
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'polling',
      data: {
        sessionId: 'session-multi-ver-inflight',
        status: 'Processing',
        currentVersion: 4,
        latestValidVersion: 3,
        hasValidCompletedForecast: true,
        inputs: { startingBudget: 60000 },
        versions: [
          { version: 1, content: validForecastOutput },
          { version: 2, content: validForecastOutput },
          { version: 3, content: validForecastOutput },
          { version: 4, content: null },
        ],
      },
    } as any);

    render(<ForecastPage />);

    // Results UI remains visible
    await waitFor(() => {
      expect(screen.queryByText(/Loading financial workspace/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Your 3-year financial forecast/i)).toBeInTheDocument();
    });

    // Top regeneration processing notice is visible with exact copy
    expect(screen.getByText('Regenerating Financial Forecast…')).toBeInTheDocument();
    expect(screen.getByText('Recalculating projections with your updated assumptions. This may take up to two minutes.')).toBeInTheDocument();
  });

  it('only failed version 1 (no prior valid version): hides Results UI and shows first-time failure state with exact copy', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'EcoVenture' },
        phase3Data: { forecastSessionId: 'session-v1-only-failed' },
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        sessionId: 'session-v1-only-failed',
        status: 'Failed',
        currentVersion: 1,
        latestValidVersion: null,
        hasValidCompletedForecast: false,
        inputs: { startingBudget: 50000 },
        versions: [
          { version: 1, content: null, generatedContent: null },
        ],
        error: 'Credit check failed',
      },
    } as any);

    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading financial workspace/i)).not.toBeInTheDocument();
    });

    // Results UI is NOT rendered
    expect(screen.queryByText(/Your 3-year financial forecast/i)).not.toBeInTheDocument();
    // First-time failure card is shown with exact copy
    expect(screen.getByText('We couldn’t generate your forecast.')).toBeInTheDocument();
    expect(screen.getByText('Your assumptions are still saved. You can review them and try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adjust Assumptions/i })).toBeInTheDocument();
  });

  it('first-time in-flight generation: renders generating processing card with exact copy', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'EcoVenture' },
        phase3Data: { forecastSessionId: 'session-v1-in-flight' },
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'polling',
      data: {
        sessionId: 'session-v1-in-flight',
        status: 'Pending',
        currentVersion: 1,
        latestValidVersion: null,
        hasValidCompletedForecast: false,
        inputs: { startingBudget: 50000 },
        versions: [],
      },
    } as any);

    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading financial workspace/i)).not.toBeInTheDocument();
    });

    // Results UI is NOT rendered
    expect(screen.queryByText(/Your 3-year financial forecast/i)).not.toBeInTheDocument();
    // First-time processing card is shown with exact copy
    expect(screen.getByText('Generating Your Financial Forecast…')).toBeInTheDocument();
    expect(screen.getByText('Building your 36-month projections from the assumptions you confirmed. This may take up to two minutes.')).toBeInTheDocument();
  });

  it('handles backend 409 in-progress response gracefully without generic destructive error', async () => {
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
        inputs: { startingBudget: 55000, opex: 9500 },
        output: validForecastOutput,
      },
    } as any);

    mockRegenerateMutate.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { error: 'Forecast generation is already in progress for this session' },
      },
    });

    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getByText(/Your 3-year financial forecast/i)).toBeInTheDocument();
    });

    const adjustBtn = screen.getByRole('button', { name: /Adjust Assumptions/i });
    fireEvent.click(adjustBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Recalculate & Regenerate/i })).toBeInTheDocument();
    });

    const recalculateBtn = screen.getByRole('button', { name: /Recalculate & Regenerate/i });
    fireEvent.click(recalculateBtn);

    await waitFor(() => {
      expect(mockRegenerateMutate).toHaveBeenCalled();
    });

    // 409 does NOT show destructive error and modal is closed
    expect(screen.queryByText(/Could not recalculate forecast projections/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Your 3-year financial forecast/i)).toBeInTheDocument();
  });
});
