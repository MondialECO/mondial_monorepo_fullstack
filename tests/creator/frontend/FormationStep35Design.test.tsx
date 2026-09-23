import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormationPage from '@/app/dashboard/creator/phase-3/formation/page';
import * as creatorJourneyApiModule from '@/lib/api-creator-journey';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = vi.fn();
const mockCompleteStep = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams('ideaId=idea-123'),
  usePathname: () => '/dashboard/creator/phase-3/formation',
}));

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    state: { activeIdeaId: 'idea-123' },
    isLoading: false,
    completeStep: mockCompleteStep,
  }),
}));

describe('FormationPage (Figma Node 57156:8767 Alignment)', () => {
  let queryClient: QueryClient;

  const mockFormation: creatorJourneyApiModule.FormationGenerator = {
    recommendedType: 'SAS-U',
    recommendationReason: 'SAS-U is recommended for solo founder digital ventures.',
    recommendationFactors: [
      {
        category: 'Founding Team & Governance',
        signal: 'Solo founder (single initial shareholder)',
        implication: 'Permits SAS-U with frictionless transition to SAS.',
      },
    ],
    isOverride: false,
    forecastBasis: {
      forecastSessionId: 'sess-123',
      monthlyGrowthPct: 15,
      tam: 50000000,
      opex: 2500,
      breakEvenMonth: 8,
      currency: 'EUR',
      forecastUpdatedAt: new Date().toISOString(),
    },
    options: [
      {
        code: 'SAS-U',
        description: 'Single shareholder SAS - solo founders.',
        capital: 'Min €1 (flexible)',
        formationTime: '1-2 weeks',
        estimatedCost: '€500-€1,200',
      },
      {
        code: 'SAS',
        description: 'Multiple goals, flexible governance.',
        capital: 'Min €1 (flexible)',
        formationTime: '1-2 weeks',
        estimatedCost: '€500-€1,200',
      },
      {
        code: 'SARL',
        description: 'Traditional, real-estate/family-friendly.',
        capital: 'Min €1 (fixed shares)',
        formationTime: '2-3 weeks',
        estimatedCost: '€500-€1,200',
      },
    ],
    youHave: ['Product direction', 'Customer research', 'Basic marketing'],
    youNeed: [
      { label: 'Backend development', spSpecialty: 'development' },
      { label: 'Accounting setup', spSpecialty: 'finance' },
      { label: 'Legal review', spSpecialty: 'legal' },
    ],
    matchedSpIds: ['sp-1', 'sp-2'],
    selectedType: 'SAS-U',
    skillsDeclared: true,
    cofounderDraft: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'get').mockResolvedValue({
      journey: {
        id: 'journey-123',
        userId: 'user-123',
        phase3Data: {
          formationGenerator: mockFormation,
        },
      } as any,
      computedStatus: {} as any,
    });

    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'generateFormation').mockResolvedValue(mockFormation);
    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'selectFormationType').mockResolvedValue({
      formation: mockFormation,
    });
    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'declareFormationSkills').mockResolvedValue(mockFormation);
  });

  it('renders the 13 canonical sections from Figma node 57156:8767', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FormationPage />
      </QueryClientProvider>
    );

    // Section 1: Quiet Intro
    await waitFor(() => {
      expect(screen.getByText(/Let’s work out how your company could be set up/i)).toBeInTheDocument();
    });

    // Section 2: Your setup so far
    expect(screen.getByText(/Your setup so far/i)).toBeInTheDocument();

    // Section 3: How are you planning to start?
    expect(screen.getByText(/How are you planning to start\?/i)).toBeInTheDocument();
    expect(screen.getByText('Just me')).toBeInTheDocument();
    expect(screen.getByText('With co-founders')).toBeInTheDocument();
    expect(screen.getByText('I’m not sure yet')).toBeInTheDocument();

    // Section 4: A structure to consider
    expect(screen.getByText(/Your company structure/i)).toBeInTheDocument();
    expect(screen.getByText(/A STRUCTURE TO CONSIDER/i)).toBeInTheDocument();
    expect(screen.getAllByText('SASU').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/OWNERS/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/MANAGEMENT/i)).toBeInTheDocument();

    // Section 5: Ownership
    expect(screen.getByText(/Who will own the company\?/i)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Section 6: Leadership
    expect(screen.getByText(/Who will lead the company\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Planned role: President/i)).toBeInTheDocument();

    // Section 7: Starting capital
    expect(screen.getByText(/Starting capital plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Looks right/i)).toBeInTheDocument();

    // Section 8: Who do you actually need
    expect(screen.getByText(/Who do you actually need to get started\?/i)).toBeInTheDocument();
    expect(screen.getAllByText(/YOU CAN HANDLE/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/YOU MAY NEED HELP WITH/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/NOT NEEDED YET/i).length).toBeGreaterThanOrEqual(1);

    // Section 9: One expanded team need
    expect(screen.getAllByText('Backend development').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/External specialist/i)).toBeInTheDocument();

    // Section 10: Professional support
    expect(screen.getByText(/Professional support you may use/i)).toBeInTheDocument();
    expect(screen.getByText('Chartered accountant')).toBeInTheDocument();
    expect(screen.getByText('Legal professional')).toBeInTheDocument();

    // Section 11: Day 1 vs Later
    expect(screen.getByText(/Your starting team/i)).toBeInTheDocument();
    expect(screen.getByText('DAY 1')).toBeInTheDocument();
    expect(screen.getByText('LATER')).toBeInTheDocument();

    // Section 12: Final setup summary
    expect(screen.getByText(/Your company setup plan/i)).toBeInTheDocument();
    expect(screen.getByText('COMPANY')).toBeInTheDocument();
    expect(screen.getByText('TEAM')).toBeInTheDocument();

    // Section 13: Footer navigation
    expect(screen.getByRole('button', { name: /Legal Roadmap/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to Executive Business Plan/i })).toBeInTheDocument();
  });

  it('updates starting mode and triggers selectType when switching to team mode', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FormationPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('With co-founders')).toBeInTheDocument();
    });

    const withCofoundersBtn = screen.getByText('With co-founders').closest('button')!;
    fireEvent.click(withCofoundersBtn);

    await waitFor(() => {
      expect(creatorJourneyApiModule.creatorJourneyApi.selectFormationType).toHaveBeenCalledWith(
        'SAS',
        'idea-123'
      );
    });
  });

  it('handles navigation actions correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FormationPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Legal Roadmap/i })).toBeInTheDocument();
    });

    // Back to compliance
    const backBtn = screen.getByRole('button', { name: /Legal Roadmap/i });
    fireEvent.click(backBtn);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/dashboard/creator/phase-3/compliance'));
    });

    // Continue to business plan
    const continueBtn = screen.getByRole('button', { name: /Continue to Executive Business Plan/i });
    fireEvent.click(continueBtn);
    await waitFor(() => {
      expect(mockCompleteStep).toHaveBeenCalledWith(3, 5);
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/dashboard/creator/phase-3/business-plan'));
    });
  });
});
