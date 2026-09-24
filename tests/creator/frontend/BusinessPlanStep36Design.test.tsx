import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BusinessPlanPage from '@/app/dashboard/creator/phase-3/business-plan/page';
import { BusinessPlanFigmaFlow } from '@/components/creator/business-plan/BusinessPlanFigmaFlow';
import * as creatorJourneyApiModule from '@/lib/api-creator-journey';
import * as creatorAiApiModule from '@/lib/api-creator-ai';
import * as creatorAiQueries from '@/hooks/queries/creator-ai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = vi.fn();
const mockCompleteStep = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams('ideaId=idea-123'),
  usePathname: () => '/dashboard/creator/phase-3/business-plan',
}));

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    state: { activeIdeaId: 'idea-123' },
    isLoading: false,
    completeStep: mockCompleteStep,
  }),
}));

describe('BusinessPlanPage & BusinessPlanFigmaFlow (Figma Node 57158:10712 Alignment)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'get').mockResolvedValue({
      journey: {
        id: 'journey-123',
        userId: 'user-123',
        currentPhase: 3,
        currentStep: 6,
        isCompleted: false,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        project: {
          name: 'AutoInvoice',
          problem: 'Businesses spend excessive time manually organizing incoming invoices.',
          solution: 'AutoInvoice streamlines intake, OCR extraction, and reconciliation.',
          targetUser: 'Small service businesses & boutique agencies',
          country: 'France',
          category: 'Subscription software',
        },
        phase3Data: {
          businessPlanSessionId: 'bp-sess-123',
          clarifierSessionId: 'clarifier-123',
          forecastSessionId: 'forecast-123',
          formationGenerator: {
            selectedType: 'SASU',
            founderEquity: 100,
            plannedRole: 'President',
            youHave: [{ label: 'Product Architecture' }],
            youNeed: [{ label: 'Backend development' }],
          },
        },
      } as any,
    } as any);

    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'getBusinessPlanSection12').mockResolvedValue({
      summary: 'France-first legal roadmap covering SASU statutory incorporation, GDPR, and invoice compliance.',
      isPotentiallyOutdated: false,
      topLevelPriorityRules: [],
      statutoryRequirements: [],
      needsInformationItems: [],
      officialSources: [],
      disclaimerNotice: 'Planning guidance only.',
    } as any);

    vi.spyOn(creatorAiQueries, 'useAiCredits').mockReturnValue({
      data: { balance: 100, costs: { BusinessPlan: 25, BusinessPlanSectionRewrite: 5 } },
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useBusinessPlanSessionTimed').mockReturnValue({
      data: {
        sessionId: 'bp-sess-123',
        currentVersion: 1,
        status: 'Completed',
        output: {
          problemSolution: {
            problem: 'Businesses spend excessive time manually organizing incoming invoices.',
            solution: 'AutoInvoice streamlines intake, OCR extraction, and reconciliation.',
          },
          executiveSummary: {
            overview: 'AutoInvoice is a planned subscription platform that helps small businesses organise incoming invoices.',
          },
          revenueModel: {
            summary: 'The business operates on recurring subscription software tiers.',
          },
          goToMarket: {
            strategy: 'The initial launch will focus on a targeted pilot with independent accountants.',
            channels: ['Primary direct outreach'],
          },
          operationsPlan: {
            milestones: [
              { title: 'Validate', description: 'Confirm problem and workflow', timeframe: 'Q1' },
              { title: 'Build', description: 'Develop minimum version', timeframe: 'Q2' },
            ],
          },
          risks: [
            { category: 'Market Demand', description: 'Demand is weaker than expected', mitigation: 'Test willingness to pay' },
          ],
        },
      },
      phase: 'terminal',
      isError: false,
      retry: vi.fn(),
    } as any);

    vi.spyOn(creatorAiQueries, 'useForecastSessionTimed').mockReturnValue({
      data: {
        output: {
          revenueForecast: {
            currency: 'EUR',
            monthly: [
              { month: 1, amount: 30000 },
              { month: 12, amount: 35000 },
              { month: 13, amount: 100000 },
              { month: 24, amount: 120000 },
              { month: 25, amount: 350000 },
              { month: 36, amount: 400000 },
            ],
          },
          costForecast: {
            currency: 'EUR',
            monthly: [
              { month: 1, fixedCosts: 20000, variableCosts: 5000 },
              { month: 12, fixedCosts: 20000, variableCosts: 5000 },
              { month: 13, fixedCosts: 60000, variableCosts: 10000 },
              { month: 24, fixedCosts: 60000, variableCosts: 10000 },
              { month: 25, fixedCosts: 150000, variableCosts: 25000 },
              { month: 36, fixedCosts: 150000, variableCosts: 25000 },
            ],
          },
        },
      },
    } as any);
  });

  it('renders all 12 chapters and the continuous document surface aligned with Figma Node 57158:10712', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BusinessPlanPage />
      </QueryClientProvider>
    );

    // Toolbar & Cover Header
    await waitFor(() => {
      expect(screen.getByText('Your business plan')).toBeInTheDocument();
      expect(screen.getAllByText('AutoInvoice').length).toBeGreaterThan(0);
      expect(screen.getByText("Built from the work you've already completed.")).toBeInTheDocument();
      expect(screen.getByText('All chapters are currently in Draft status based on assembled project data.')).toBeInTheDocument();
    });

    // Verify presence of all 12 chapter headers
    expect(screen.getByText('01 · Executive Summary')).toBeInTheDocument();
    expect(screen.getByText('02 · Problem & Solution')).toBeInTheDocument();
    expect(screen.getByText('03 · Market & Customers')).toBeInTheDocument();
    expect(screen.getByText('04 · Business Model')).toBeInTheDocument();
    expect(screen.getByText('05 · Competition & Positioning')).toBeInTheDocument();
    expect(screen.getByText('06 · Go-to-Market')).toBeInTheDocument();
    expect(screen.getByText('07 · Financial Plan')).toBeInTheDocument();
    expect(screen.getByText('08 · Company & Team')).toBeInTheDocument();
    expect(screen.getByText('09 · Funding Requirements')).toBeInTheDocument();
    expect(screen.getByText('10 · Operations & Milestones')).toBeInTheDocument();
    expect(screen.getByText('11 · Risks & Next Steps')).toBeInTheDocument();
    expect(screen.getByText('12 · Legal & Compliance')).toBeInTheDocument();
  });

  it('binds dynamic venture, formation, and financial forecast data without hardcoded mocks', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BusinessPlanPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Your business plan')).toBeInTheDocument();
    });

    // Problem & Solution dynamically appears in Chapter 02 & Chapter 03
    expect(screen.getAllByText(/Businesses spend excessive time manually organizing incoming invoices/).length).toBeGreaterThan(0);
    // Company Structure & Leadership from Step 3.5
    expect(screen.getByText('SASU')).toBeInTheDocument();
    expect(screen.getByText('100% Founder')).toBeInTheDocument();
    expect(screen.getByText('President')).toBeInTheDocument();
    // Financial Plan Section SVG projection
    expect(screen.getByText('FORECAST PROJECTION (3 YEARS)')).toBeInTheDocument();
  });

  it('allows toggling "Mark reviewed" state on individual chapters', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BusinessPlanPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('01 · Executive Summary')).toBeInTheDocument();
    });

    const markReviewedBtn = screen.getAllByRole('button', { name: /Mark reviewed/i })[0];
    expect(markReviewedBtn).toBeInTheDocument();

    fireEvent.click(markReviewedBtn);

    // After clicking, the button text updates to Reviewed
    await waitFor(() => {
      expect(screen.getAllByText('Reviewed').length).toBeGreaterThan(0);
    });
  });

  it('renders "Regenerate Business Plan" in the toolbar', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BusinessPlanPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Regenerate Business Plan/i })).toBeInTheDocument();
    });
  });

  it('does not prematurely show section rewrite error when Rewrite with AI is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BusinessPlanPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('01 · Executive Summary')).toBeInTheDocument();
    });

    const rewriteBtns = screen.getAllByRole('button', { name: /Rewrite with AI/i });
    expect(rewriteBtns.length).toBeGreaterThan(0);

    fireEvent.click(rewriteBtns[0]);

    // Ensure the premature generic error message is NOT rendered
    expect(screen.queryByText(/The section rewrite didn’t complete/i)).not.toBeInTheDocument();
  });

  it('marks all Draft sections as Reviewed, persists them via editBusinessPlan, completes Step 3.6, and navigates with same ideaId', async () => {
    const editPlanSpy = vi.spyOn(creatorAiApiModule.creatorAiApi, 'editBusinessPlan').mockResolvedValue({
      sessionId: 'bp-sess-123',
      currentVersion: 1,
      status: 'Completed',
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <BusinessPlanPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('01 · Executive Summary')).toBeInTheDocument();
    });

    const continueBtn = screen.getByRole('button', { name: /Continue to Investor Readiness/i });
    expect(continueBtn).toBeInTheDocument();

    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(editPlanSpy).toHaveBeenCalledTimes(1);
    });

    const [calledSessionId, calledPlan] = editPlanSpy.mock.calls[0] as [string, any];
    expect(calledSessionId).toBe('bp-sess-123');

    // Verify all 12 sections are marked reviewed in _sectionMeta
    expect(calledPlan._sectionMeta).toBeDefined();
    expect(calledPlan._sectionMeta['01'].status).toBe('reviewed');
    expect(calledPlan._sectionMeta['12'].status).toBe('reviewed');
    expect(calledPlan._sectionMeta['executive'].status).toBe('reviewed');
    expect(calledPlan._sectionMeta['executiveSummary'].status).toBe('reviewed');

    // Verify Business Plan content is completely preserved
    expect(calledPlan.problemSolution.problem).toBe('Businesses spend excessive time manually organizing incoming invoices.');
    expect(calledPlan.executiveSummary.overview).toBe('AutoInvoice is a planned subscription platform that helps small businesses organise incoming invoices.');

    // Verify step completion and navigation with same ideaId
    await waitFor(() => {
      expect(mockCompleteStep).toHaveBeenCalledWith(3, 6);
      expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/phase-3/complete?ideaId=idea-123');
    });
  });

  it('preserves already Reviewed sections without resetting them', async () => {
    vi.spyOn(creatorAiQueries, 'useBusinessPlanSessionTimed').mockReturnValue({
      data: {
        sessionId: 'bp-sess-123',
        currentVersion: 1,
        status: 'Completed',
        output: {
          problemSolution: {
            problem: 'Businesses spend excessive time manually organizing incoming invoices.',
            solution: 'AutoInvoice streamlines intake, OCR extraction, and reconciliation.',
          },
          executiveSummary: {
            overview: 'AutoInvoice is a planned subscription platform.',
          },
          _sectionMeta: {
            '01': { status: 'reviewed', lastEditedAt: '2026-09-01T12:00:00.000Z' },
            executive: { status: 'reviewed', lastEditedAt: '2026-09-01T12:00:00.000Z' },
            executiveSummary: { status: 'reviewed', lastEditedAt: '2026-09-01T12:00:00.000Z' },
          },
        },
      },
      phase: 'terminal',
      isError: false,
      retry: vi.fn(),
    } as any);

    const editPlanSpy = vi.spyOn(creatorAiApiModule.creatorAiApi, 'editBusinessPlan').mockResolvedValue({
      sessionId: 'bp-sess-123',
      currentVersion: 1,
      status: 'Completed',
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <BusinessPlanPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('01 · Executive Summary')).toBeInTheDocument();
    });

    const continueBtn = screen.getByRole('button', { name: /Continue to Investor Readiness/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(editPlanSpy).toHaveBeenCalledTimes(1);
    });

    const [, calledPlan] = editPlanSpy.mock.calls[0] as [string, any];
    // Chapter 01 already-reviewed timestamp and status must be preserved
    expect(calledPlan._sectionMeta['01'].status).toBe('reviewed');
    expect(calledPlan._sectionMeta['01'].lastEditedAt).toBe('2026-09-01T12:00:00.000Z');
    // Draft chapters become reviewed
    expect(calledPlan._sectionMeta['02'].status).toBe('reviewed');
  });

  it('does not navigate or complete step if review persistence fails', async () => {
    vi.spyOn(creatorAiApiModule.creatorAiApi, 'editBusinessPlan').mockRejectedValueOnce(
      new Error('Database network timeout')
    );

    render(
      <QueryClientProvider client={queryClient}>
        <BusinessPlanPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('01 · Executive Summary')).toBeInTheDocument();
    });

    const continueBtn = screen.getByRole('button', { name: /Continue to Investor Readiness/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText(/Database network timeout|Failed to save reviewed sections/i)).toBeInTheDocument();
    });

    // Does NOT navigate or complete step on failure
    expect(mockCompleteStep).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
