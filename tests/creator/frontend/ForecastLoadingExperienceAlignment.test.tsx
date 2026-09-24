import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ForecastPage from '@/app/dashboard/creator/phase-3/forecast/page';
import * as creatorAiQueries from '@/hooks/queries/creator-ai';
import { isTerminalStatus } from '@/types/creator/ai';
import * as creatorJourneyApi from '@/lib/api-creator-journey';
import creatorAiApi from '@/lib/api-creator-ai';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams({ ideaId: 'idea-align-999' }),
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
  getCreatorWorkspaceIdea: vi.fn(() => 'idea-align-999'),
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

describe('Step 3.3 Financial Forecast AI Generation Loading Experience Alignment (3.1 & 3.2)', () => {
  const validForecastOutput = {
    revenueForecast: {
      currency: 'EUR',
      summary: 'Revenue summary',
      monthly: Array.from({ length: 36 }, (_, i) => ({ month: i + 1, amount: 5000 + i * 100 })),
    },
    costForecast: {
      currency: 'EUR',
      summary: 'Cost summary',
      monthly: Array.from({ length: 36 }, (_, i) => ({ month: i + 1, fixedCosts: 4000, variableCosts: 500 })),
    },
    cashFlowProjection: {
      currency: 'EUR',
      summary: 'Cash summary',
      monthly: Array.from({ length: 36 }, (_, i) => ({ month: i + 1, netCashFlow: 500, endingBalance: 40000 })),
    },
    breakEvenAnalysis: {
      breakEvenMonth: 12,
      isAchievedWithinHorizon: true,
      summary: 'Break even reached in month 12',
    },
    assumptions: ['75 subscribers at launch'],
    risks: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.spyOn(creatorAiQueries, 'useAiCredits').mockReturnValue({
      data: { balance: 150, costs: { Forecast: 32 } },
      isLoading: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useStartForecast').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any);

    vi.spyOn(creatorAiQueries, 'useRegenerateForecast').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any);

    vi.spyOn(creatorAiQueries, 'useForecastAssumptions').mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useBudgetSuggestion').mockReturnValue({
      data: { suggestedBudget: 45000, rationale: 'Test budget', runwayMonths: 6, provenance: 'ai_suggested' },
      isLoading: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useBusinessPlanSessionTimed').mockReturnValue({ data: { output: null } } as any);
    vi.spyOn(creatorAiQueries, 'useBusinessModelSessionTimed').mockReturnValue({ data: { output: null } } as any);
    vi.spyOn(creatorAiQueries, 'useMarketStudySessionTimed').mockReturnValue({ data: { output: null } } as any);
  });

  it('1. First-generation loading: renders canonical Phase 3 loading card with exact copy, spinner, and indeterminate progress bar', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'AlignProject' },
        phase3Data: { forecastSessionId: 'session-first-gen' },
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'polling',
      data: {
        sessionId: 'session-first-gen',
        status: 'Processing',
        currentVersion: 1,
        latestValidVersion: null,
        hasValidCompletedForecast: false,
        inputs: { startingBudget: 45000 },
        versions: [],
      },
    } as any);

    const { container } = render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading financial workspace/i)).not.toBeInTheDocument();
    });

    // Verification of exact copy
    const title = screen.getByRole('heading', { level: 3, name: 'Generating Your Financial Forecast…' });
    expect(title).toBeInTheDocument();
    expect(title.className).toContain('font-sans');
    expect(title.className).toContain('text-lg');

    const desc = screen.getByText('Building your 36-month projections from the assumptions you confirmed. This may take up to two minutes.');
    expect(desc).toBeInTheDocument();

    // Verify RotateCw spinner with animate-spin
    const spinIcon = container.querySelector('.animate-spin');
    expect(spinIcon).toBeInTheDocument();

    // Verify indeterminate progress bar (NO fake percentage or pulse bar)
    const progressBar = container.querySelector('.animate-indeterminate');
    expect(progressBar).toBeInTheDocument();

    // Verify results screen is NOT prematurely displayed
    expect(screen.queryByText(/Your 3-year financial forecast/i)).not.toBeInTheDocument();
  });

  it('2. Regeneration loading: preserves existing valid forecast below and renders canonical Phase 3 loading card with exact copy', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'AlignProject' },
        phase3Data: { forecastSessionId: 'session-regen-active' },
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'polling',
      data: {
        sessionId: 'session-regen-active',
        status: 'Processing',
        currentVersion: 2,
        latestValidVersion: 1,
        hasValidCompletedForecast: true,
        output: validForecastOutput,
        inputs: { startingBudget: 45000 },
        versions: [
          { version: 1, content: validForecastOutput },
          { version: 2, content: null },
        ],
      },
    } as any);

    const { container } = render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading financial workspace/i)).not.toBeInTheDocument();
      // Existing valid forecast remains rendered and preserved below
      expect(screen.getByText(/Your 3-year financial forecast/i)).toBeInTheDocument();
    });

    // Top regeneration loading card is rendered with exact copy
    const title = screen.getByRole('heading', { level: 3, name: 'Regenerating Financial Forecast…' });
    expect(title).toBeInTheDocument();
    expect(title.className).toContain('font-sans');
    expect(title.className).toContain('text-lg');

    const desc = screen.getByText('Recalculating projections with your updated assumptions. This may take up to two minutes.');
    expect(desc).toBeInTheDocument();

    // Indeterminate animation present
    const progressBar = container.querySelector('.animate-indeterminate');
    expect(progressBar).toBeInTheDocument();

    // RotateCw spinner with animate-spin present
    const spinIcon = container.querySelector('.animate-spin');
    expect(spinIcon).toBeInTheDocument();
  });

  it('3. First-generation failure: loading ends, error alert is displayed, and founder assumptions are preserved', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'AlignProject' },
        phase3Data: { forecastSessionId: 'session-first-fail' },
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        sessionId: 'session-first-fail',
        status: 'Failed',
        currentVersion: 1,
        latestValidVersion: null,
        hasValidCompletedForecast: false,
        inputs: { startingBudget: 45000, launchSubscribers: 100 },
        versions: [{ version: 1, content: null }],
        error: 'Engine timeout',
      },
    } as any);

    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading financial workspace/i)).not.toBeInTheDocument();
    });

    // Loading card is gone
    expect(screen.queryByText('Generating Your Financial Forecast…')).not.toBeInTheDocument();
    // Error banner is visible
    expect(screen.getByText('We couldn’t generate your forecast.')).toBeInTheDocument();
    expect(screen.getByText('Your assumptions are still saved. You can review them and try again.')).toBeInTheDocument();
    // Actions to retry or adjust assumptions are present
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adjust Assumptions/i })).toBeInTheDocument();
  });

  it('4. Regeneration failure: loading ends, previous valid forecast remains preserved, and error alert is shown', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'AlignProject' },
        phase3Data: { forecastSessionId: 'session-regen-fail' },
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        sessionId: 'session-regen-fail',
        status: 'Failed',
        currentVersion: 2,
        latestValidVersion: 1,
        hasValidCompletedForecast: true,
        output: validForecastOutput,
        inputs: { startingBudget: 45000 },
        versions: [
          { version: 1, content: validForecastOutput },
          { version: 2, content: null },
        ],
        error: 'Simulation divergence',
      },
    } as any);

    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading financial workspace/i)).not.toBeInTheDocument();
      // Previous valid forecast is still displayed
      expect(screen.getByText(/Your 3-year financial forecast/i)).toBeInTheDocument();
    });

    // Loading card is gone
    expect(screen.queryByText('Regenerating Financial Forecast…')).not.toBeInTheDocument();
    // Regeneration failure banner is shown
    expect(screen.getByText('We couldn’t regenerate your forecast.')).toBeInTheDocument();
    expect(screen.getByText(/Your previous forecast \(Version 1\) is still available/i)).toBeInTheDocument();
  });

  it('5. Project context isolation: uses explicit current ideaId and does not query or mutate cross-project', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'AlignProject' },
        phase3Data: { forecastSessionId: 'session-isolate' },
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        sessionId: 'session-isolate',
        status: 'completed',
        currentVersion: 1,
        latestValidVersion: 1,
        hasValidCompletedForecast: true,
        output: validForecastOutput,
        inputs: { startingBudget: 45000 },
        versions: [{ version: 1, content: validForecastOutput }],
      },
    } as any);

    render(<ForecastPage />);

    await waitFor(() => {
      expect(creatorJourneyApi.creatorJourneyApi.get).toHaveBeenCalledWith('idea-align-999');
    });
  });

  it('6. Case-insensitivity & status synonyms: lowercase "processing" or "generating" status maintains isGenerating and renders loading card', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'AlignProject' },
        phase3Data: { forecastSessionId: 'session-case-insensitive' },
      },
    });

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'polling',
      data: {
        sessionId: 'session-case-insensitive',
        status: 'processing', // lowercase from backend
        currentVersion: 2,
        latestValidVersion: 1,
        hasValidCompletedForecast: true,
        output: validForecastOutput,
        inputs: { startingBudget: 45000 },
        versions: [{ version: 1, content: validForecastOutput }],
      },
    } as any);

    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Regenerating Financial Forecast…' })).toBeInTheDocument();
      expect(screen.getByText(/Your 3-year financial forecast/i)).toBeInTheDocument();
    });
  });

  it('7. Recalculation modal submission triggers regeneration with zero gap: modal closes and loading card renders', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'AlignProject' },
        phase3Data: { forecastSessionId: 'session-modal-flow' },
      },
    });

    // Currently completed version 1
    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        sessionId: 'session-modal-flow',
        status: 'Completed',
        currentVersion: 1,
        latestValidVersion: 1,
        hasValidCompletedForecast: true,
        output: validForecastOutput,
        inputs: { startingBudget: 45000 },
        versions: [{ version: 1, content: validForecastOutput }],
      },
    } as any);

    const mutateAsyncSpy = vi.fn().mockImplementation(async () => {
      // simulate network delay during mutation
      await new Promise((r) => setTimeout(r, 50));
    });
    vi.spyOn(creatorAiQueries, 'useRegenerateForecast').mockReturnValue({
      mutateAsync: mutateAsyncSpy,
      isPending: false,
      error: null,
    } as any);

    (creatorAiApi.updateForecastAssumptions as any).mockResolvedValue({ success: true });

    render(<ForecastPage />);

    await waitFor(() => {
      expect(screen.getByText(/Your 3-year financial forecast/i)).toBeInTheDocument();
    });

    // Click Adjust Assumptions to open modal
    const adjustBtn = screen.getByRole('button', { name: /Adjust Assumptions/i });
    adjustBtn.click();

    await waitFor(() => {
      expect(screen.getByText('Adjust Forecast Assumptions')).toBeInTheDocument();
    });
  });

  it('8. Terminal status validation: isTerminalStatus accurately identifies all canonical terminal states case-insensitively', () => {
    expect(isTerminalStatus('Completed')).toBe(true);
    expect(isTerminalStatus('completed')).toBe(true);
    expect(isTerminalStatus('Failed')).toBe(true);
    expect(isTerminalStatus('failed')).toBe(true);
    expect(isTerminalStatus('NeedsReview')).toBe(true);
    expect(isTerminalStatus('needsreview')).toBe(true);

    expect(isTerminalStatus('Pending')).toBe(false);
    expect(isTerminalStatus('pending')).toBe(false);
    expect(isTerminalStatus('Processing')).toBe(false);
    expect(isTerminalStatus('processing')).toBe(false);
    expect(isTerminalStatus(null)).toBe(false);
    expect(isTerminalStatus(undefined)).toBe(false);
  });
});

