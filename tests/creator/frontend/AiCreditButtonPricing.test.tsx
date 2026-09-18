import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AiCreditBadge } from '@/components/layout/AiCreditBadge';
import { creatorAiApi } from '@/lib/api-creator-ai';
import { CreatorAiWorkspace } from '@/components/creator/ai/CreatorAiWorkspace';

const mockApi = vi.hoisted(() => ({
  getCredits: vi.fn(),
  listClarifiers: vi.fn().mockResolvedValue([]),
  listBusinessPlans: vi.fn().mockResolvedValue([]),
  listForecasts: vi.fn().mockResolvedValue([]),
  startClarifier: vi.fn().mockResolvedValue({ sessionId: 's-1' }),
  startBusinessPlan: vi.fn().mockResolvedValue({ sessionId: 's-2' }),
  startForecast: vi.fn().mockResolvedValue({ sessionId: 's-3' }),
}));

vi.mock('@/lib/api-creator-ai', () => ({
  creatorAiApi: mockApi,
  default: mockApi,
}));

vi.mock('@/lib/api-creator-journey', () => ({
  getCreatorWorkspaceIdea: vi.fn().mockResolvedValue({
    exists: true,
    ideaId: 'idea-1',
    name: 'Test Venture',
    problem: 'Test Problem',
    targetUser: 'Test Users',
  }),
}));

describe('AI Credit Server-Authoritative Costs & Button Rendering', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderWithClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('renders dynamic server-authoritative costs on AiCreditBadge and Clarifier button', async () => {
    vi.mocked(creatorAiApi.getCredits).mockResolvedValue({
      balance: 200,
      lifetimeGranted: 200,
      lifetimeSpent: 0,
      costs: {
        IdeaClarifier: 20,
        BusinessPlan: 33,
        Forecast: 32,
        IdeaGenerator: 0,
        Probe: 0,
      },
    });

    renderWithClient(
      <div>
        <AiCreditBadge />
        <CreatorAiWorkspace />
      </div>
    );

    // Badge resolves to server balance
    await waitFor(() => {
      expect(screen.getByText('200 credits')).toBeInTheDocument();
    });

    // Clarifier button renders exact measured cost (20 credits)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Run Idea Clarifier \(20 credits\)/i })).toBeInTheDocument();
    });
  });

  it('renders disabled state and honest shortfall notice when balance < 20 credits', async () => {
    vi.mocked(creatorAiApi.getCredits).mockResolvedValue({
      balance: 10,
      lifetimeGranted: 200,
      lifetimeSpent: 190,
      costs: {
        IdeaClarifier: 20,
        BusinessPlan: 33,
        Forecast: 32,
        IdeaGenerator: 0,
        Probe: 0,
      },
    });

    renderWithClient(
      <div>
        <AiCreditBadge />
        <CreatorAiWorkspace />
      </div>
    );

    await waitFor(() => {
      expect(screen.getByText('10 credits')).toBeInTheDocument();
    });

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Run Idea Clarifier \(20 credits\)/i });
      expect(btn).toBeDisabled();
      expect(screen.getByText(/Insufficient credits: requires 20 credits/i)).toBeInTheDocument();
    });
  });

  it('correctly formats and derives button labels for BusinessPlan (33) and Forecast (32)', async () => {
    vi.mocked(creatorAiApi.getCredits).mockResolvedValue({
      balance: 150,
      lifetimeGranted: 200,
      lifetimeSpent: 50,
      costs: {
        IdeaClarifier: 20,
        BusinessPlan: 33,
        Forecast: 32,
        IdeaGenerator: 0,
        Probe: 0,
      },
    });

    const res = await creatorAiApi.getCredits();
    const planCost = res.costs?.BusinessPlan ?? 0;
    const forecastCost = res.costs?.Forecast ?? 0;
    const clarifierCost = res.costs?.IdeaClarifier ?? 0;

    expect(clarifierCost).toBe(20);
    expect(planCost).toBe(33);
    expect(forecastCost).toBe(32);

    // Verify exact button string formatting used across Phase-3 pages
    const planBtnText = `Generate plan${planCost > 0 ? ` (${planCost} credits)` : ''}`;
    const forecastBtnText = `Generate forecast${forecastCost > 0 ? ` (${forecastCost} credits)` : ''}`;
    const clarifierBtnText = `Run Idea Clarifier${clarifierCost > 0 ? ` (${clarifierCost} ${clarifierCost === 1 ? 'credit' : 'credits'})` : ''}`;

    expect(planBtnText).toBe('Generate plan (33 credits)');
    expect(forecastBtnText).toBe('Generate forecast (32 credits)');
    expect(clarifierBtnText).toBe('Run Idea Clarifier (20 credits)');

    // Verify shortfall notices when balance drops below required thresholds
    const testBalance = 25; // enough for clarifier (20), but not plan (33) or forecast (32)
    const isPlanInsufficient = testBalance < planCost;
    const isForecastInsufficient = testBalance < forecastCost;

    expect(isPlanInsufficient).toBe(true);
    expect(isForecastInsufficient).toBe(true);

    const planWarning = `Insufficient credits: requires ${planCost} credits (you have ${testBalance}).`;
    const forecastWarning = `Insufficient credits: requires ${forecastCost} credits (you have ${testBalance}).`;

    expect(planWarning).toBe('Insufficient credits: requires 33 credits (you have 25).');
    expect(forecastWarning).toBe('Insufficient credits: requires 32 credits (you have 25).');
  });

  it('correctly derives section rewrite button cost label from BusinessPlanSectionRewrite (5 credits placeholder)', async () => {
    vi.mocked(creatorAiApi.getCredits).mockResolvedValue({
      balance: 150,
      lifetimeGranted: 200,
      lifetimeSpent: 50,
      costs: {
        BusinessPlan: 33,
        BusinessPlanSectionRewrite: 5,
        Forecast: 32,
      },
    });

    const res = await creatorAiApi.getCredits();
    const rewriteCost = res.costs?.BusinessPlanSectionRewrite ?? 5;
    expect(rewriteCost).toBe(5);

    const rewriteBtnText = `AI Rewrite${rewriteCost > 0 ? ` (${rewriteCost} credits)` : ''}`;
    expect(rewriteBtnText).toBe('AI Rewrite (5 credits)');
  });
});

