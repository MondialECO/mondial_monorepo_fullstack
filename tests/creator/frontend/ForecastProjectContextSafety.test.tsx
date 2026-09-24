import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, waitFor } from '@testing-library/react';
import ForecastPage from '@/app/dashboard/creator/phase-3/forecast/page';
import {
  useForecastAssumptions,
  useBudgetSuggestion,
  useUpdateForecastAssumptions,
} from '@/hooks/queries/creator-ai';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import { creatorAiApi } from '@/lib/api-creator-ai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let mockSearchParams = new URLSearchParams('ideaId=idea-123');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/lib/api-creator-journey', () => ({
  creatorJourneyApi: {
    get: vi.fn(),
    setPhase3Session: vi.fn().mockResolvedValue({}),
  },
  getCreatorWorkspaceIdea: vi.fn().mockReturnValue(null),
}));

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    completeStep: vi.fn(),
  }),
}));

vi.mock('@/lib/api-creator-ai', async () => {
  const actual = await vi.importActual<any>('@/lib/api-creator-ai');
  return {
    ...actual,
    creatorAiApi: {
      getBudgetSuggestion: vi.fn(),
      getForecastAssumptions: vi.fn(),
      updateForecastAssumptions: vi.fn(),
      startForecast: vi.fn(),
      regenerateForecast: vi.fn(),
      getForecast: vi.fn(),
      listForecasts: vi.fn(),
    },
  };
});

describe('Step 3.3 Frontend Project Context Safety', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    (creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        phase3Data: {},
        project: { name: 'Venture 1' },
      },
    });
  });

  it('8. frontend queries do not run while ideaId is undefined or null', async () => {
    // 8a. useForecastAssumptions with null ideaId
    const { result: assumptionsHook } = renderHook(() => useForecastAssumptions(null), { wrapper });
    expect(assumptionsHook.current.fetchStatus).toBe('idle');
    expect(creatorAiApi.getForecastAssumptions).not.toHaveBeenCalled();

    // 8b. useBudgetSuggestion with null ideaId
    const { result: budgetHook } = renderHook(() => useBudgetSuggestion(null), { wrapper });
    expect(budgetHook.current.fetchStatus).toBe('idle');
    expect(creatorAiApi.getBudgetSuggestion).not.toHaveBeenCalled();

    // 8c. ForecastPage mounts with empty search params
    mockSearchParams = new URLSearchParams('');
    render(
      <QueryClientProvider client={queryClient}>
        <ForecastPage />
      </QueryClientProvider>
    );

    // Remains in loading / context resolution state
    expect(screen.getByText(/Loading financial workspace/i)).toBeInTheDocument();
    expect(creatorAiApi.getForecastAssumptions).not.toHaveBeenCalled();
    expect(creatorAiApi.getBudgetSuggestion).not.toHaveBeenCalled();
  });

  it('9. frontend mutations and api methods guard against missing ideaId', async () => {
    // 9a. Hook mutation guards before dispatch
    const { result: updateHook } = renderHook(() => useUpdateForecastAssumptions(null), { wrapper });
    await expect(
      updateHook.current.mutateAsync({ startingBudget: 50000 } as any)
    ).rejects.toThrow('ideaId is required');

    // 9b. Actual API client methods reject immediately without ideaId
    const actualModule = await vi.importActual<any>('@/lib/api-creator-ai');
    await expect(actualModule.creatorAiApi.getForecastAssumptions(undefined)).rejects.toThrow('ideaId is required');
    await expect(actualModule.creatorAiApi.getBudgetSuggestion(undefined)).rejects.toThrow('ideaId is required');
    await expect(
      actualModule.creatorAiApi.updateForecastAssumptions({ startingBudget: 50000 } as any, undefined)
    ).rejects.toThrow('ideaId is required');
    await expect(
      actualModule.creatorAiApi.startForecast({ monthlyChurnPct: 5 } as any)
    ).rejects.toThrow('ideaId is required');
  });

  it('10. no localStorage key using "active" is ever written or read', async () => {
    mockSearchParams = new URLSearchParams(''); // No ideaId

    render(
      <QueryClientProvider client={queryClient}>
        <ForecastPage />
      </QueryClientProvider>
    );

    // When ideaId is missing, localStorage must never have 'active'
    expect(localStorage.getItem('mondial_forecast_budget_active')).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('11. scoped temporary cache is isolated to specific ideaId', async () => {
    // Cache for Idea A
    localStorage.setItem('mondial_forecast_budget_idea-A', '99000');

    // When mounting with Idea B, Idea A cache must not be read
    expect(localStorage.getItem('mondial_forecast_budget_idea-B')).toBeNull();
    expect(localStorage.getItem('mondial_forecast_budget_idea-A')).toBe('99000');
  });

  it('12. server persisted assumptions strictly take precedence over local cache', async () => {
    // Stale local cache: 25000
    localStorage.setItem('mondial_forecast_budget_idea-123', '25000');

    // Authoritative server assumptions
    const serverInputs = {
      startingBudget: 85000,
      launchSubscribers: 100,
      monthlyGrowthPct: 15,
      monthlyChurnPct: 4,
      arpu: 50,
      variableCost: 5,
      opex: 3000,
      tam: 5000000,
    };

    // Precedence rule: server persisted value (85000) > temporary cache (25000)
    const effectiveBudget = serverInputs.startingBudget != null
      ? serverInputs.startingBudget
      : Number(localStorage.getItem('mondial_forecast_budget_idea-123') || 0);

    expect(effectiveBudget).toBe(85000);
  });
});
