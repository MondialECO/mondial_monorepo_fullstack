import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForecastPage from '@/app/dashboard/creator/phase-3/forecast/page';
import * as creatorAiQueries from '@/hooks/queries/creator-ai';
import * as creatorJourneyApi from '@/lib/api-creator-journey';
import { ForecastAssumptionsModal } from '@/components/creator/forecast/ForecastAssumptionsModal';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams({ ideaId: 'idea-prog-test' }),
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
  getCreatorWorkspaceIdea: vi.fn(() => 'idea-prog-test'),
}));

vi.mock('recharts', async () => {
  const actual = await vi.importActual<any>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: ({ children }: any) => <svg>{children}</svg>,
  };
});

describe('Progressive Financial Assumptions Generation & Display Flow', () => {
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
        sessionId: 'session-fc-new',
        jobId: 'job-123',
      }),
      isPending: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useRegenerateForecast').mockReturnValue({
      mutateAsync: mockRegenerateMutate.mockResolvedValue({
        sessionId: 'session-fc-new',
        jobId: 'job-124',
      }),
      isPending: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useBudgetSuggestion').mockReturnValue({
      data: {
        suggestedBudget: 60000,
        rationale: 'Runway tailored from Step 3.2 OPEX and launch CAC.',
        runwayMonths: 6,
        provenance: 'ai_suggested',
      },
      isLoading: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      phase: 'idle',
      data: null,
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

  it('pre-loads progressive assumptions generated during Step 3.1 & 3.2 on first visit', async () => {
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: { name: 'SaaS Suite', sector: 'Software' },
        phase3Data: {},
      },
    });

    // Mock progressive assumptions from Step 3.1 & 3.2
    vi.spyOn(creatorAiQueries, 'useForecastAssumptions').mockReturnValue({
      data: {
        startingBudget: 60000,
        launchSubscribers: 120,
        monthlyGrowthPct: 14,
        monthlyChurnPct: 3.5,
        arpu: 89,
        variableCost: 12,
        opex: 9000,
        tam: 450000000,
        businessModelType: 'saas',
        provenance: {
          tam: 'canonical_step_3_1',
          arpu: 'ai_suggested',
          variableCost: 'ai_suggested',
        },
        rationales: {
          startingBudget: 'Tailored 6-month runway covering OPEX and acquisition.',
        },
      },
      isLoading: false,
    } as any);

    render(<ForecastPage />);

    // Budget setup modal automatically displays progressive starting budget
    await waitFor(() => {
      expect(screen.getByText('Starting Budget Setup')).toBeInTheDocument();
      expect(screen.getByText('€60,000')).toBeInTheDocument();
      expect(screen.getByText(/Runway tailored from Step 3.2 OPEX/i)).toBeInTheDocument();
    });
  });

  it('ForecastAssumptionsModal adapts labels and units to E-commerce archetype', () => {
    const onConfirmMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <ForecastAssumptionsModal
        open={true}
        onClose={onCloseMock}
        businessModelType="ecommerce"
        initialValues={{
          startingBudget: 50000,
          launchSubscribers: 200,
          monthlyGrowthPct: 15,
          monthlyChurnPct: 10,
          arpu: 65,
          variableCost: 25,
          opex: 7000,
          tam: 200000000,
        }}
        initialProvenance={{
          startingBudget: 'ai_suggested',
          launchSubscribers: 'ai_suggested',
        }}
        isRegenerating={false}
        creditCost={15}
        onConfirm={onConfirmMock}
      />
    );

    // E-commerce specific labels
    expect(screen.getByText('Initial Monthly Orders')).toBeInTheDocument();
    expect(screen.getByText('Average Order Value (AOV) (€)')).toBeInTheDocument();
    expect(screen.getByText('N/A · Inactive Driver')).toBeInTheDocument();
    expect(screen.getByText('Canonical · Step 3.1 Market Study')).toBeInTheDocument();
  });

  it('ForecastAssumptionsModal marks TAM as read-only and canonical to Step 3.1', () => {
    const onConfirmMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <ForecastAssumptionsModal
        open={true}
        onClose={onCloseMock}
        businessModelType="saas"
        initialValues={{
          startingBudget: 40000,
          launchSubscribers: 75,
          monthlyGrowthPct: 15,
          monthlyChurnPct: 5,
          arpu: 32,
          variableCost: 5,
          opex: 8000,
          tam: 900000000,
        }}
        initialProvenance={{
          tam: 'canonical_step_3_1',
        }}
        isRegenerating={false}
        creditCost={15}
        onConfirm={onConfirmMock}
      />
    );

    // TAM input should be disabled/read-only
    const tamInput = screen.getByDisplayValue('900000000');
    expect(tamInput).toBeDisabled();
    expect(tamInput).toHaveAttribute('readOnly');
    expect(screen.getByText(/Canonical TAM ceiling from Step 3.1 Market Study/i)).toBeInTheDocument();
  });
});
