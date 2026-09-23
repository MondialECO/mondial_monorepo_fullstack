import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BusinessModelPage from '@/app/dashboard/creator/phase-3/business-model/page';
import * as creatorAiQueries from '@/hooks/queries/creator-ai';
import * as creatorJourneyApi from '@/lib/api-creator-journey';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    completeStep: vi.fn(),
  }),
}));

vi.mock('@/lib/api-creator-journey', () => ({
  creatorJourneyApi: {
    get: vi.fn(),
  },
  getCreatorWorkspaceIdea: vi.fn(() => 'idea-123'),
}));

vi.mock('@/lib/api-creator-brand-kit', () => ({
  brandKitApi: {
    getBrandKit: vi.fn().mockResolvedValue(null),
  },
}));

describe('BusinessModelPage (Step 3.2 Design Alignment)', () => {
  const mockBusinessModelOutput = {
    schemaVersion: 1,
    canvas: {
      keyPartners: ['Payment processor', 'Local retailer associations', 'Hosting provider'],
      keyActivities: ['Product development', 'Customer onboarding', 'Local partnerships'],
      keyResources: ['Product platform', 'Customer support team', 'Payment infrastructure'],
      valuePropositions: [
        { headline: 'One tool instead of four spreadsheets', details: 'Streamlined invoicing and inventory sync' },
        { headline: 'Set up in an afternoon, no training needed', details: 'Zero friction onboarding' },
        { headline: 'Priced for a shop, not an enterprise', details: 'Accessible subscription model' },
      ],
      customerRelationships: ['Self-serve onboarding', 'In-app chat support', 'Monthly check-in email'],
      channels: ['Direct online signup', 'Retailer association partnerships', 'Word of mouth referrals'],
      customerSegments: [
        { segment: 'Independent retailers' },
        { segment: 'Small café owners' },
        { segment: 'Market traders' },
      ],
      costStructure: [
        'Hosting — €900/month fixed',
        'Support staff — €1,800/month fixed',
        'Payment fees — €0.40 per active user',
        'Customer acquisition — variable',
      ],
      revenueStreams: [
        { stream: 'Monthly subscription — €29 to €149' },
        { stream: 'Annual plans at two months free' },
        { stream: 'Setup and migration — one-off' },
      ],
    },
    unitEconomics: {
      cac: { amount: 45, currency: 'EUR' },
      ltv: { amount: 620, currency: 'EUR' },
      ltvToCacRatio: 13.8,
      paybackPeriodMonths: 3,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: {
          name: 'AutoInvoice',
          sector: 'Retail SaaS',
          geography: 'France',
        },
        phase3Data: {
          businessModelSessionId: 'session-bm-123',
          marketStudySessionId: 'session-ms-456',
        },
      },
    });

    vi.spyOn(creatorAiQueries, 'useAiCredits').mockReturnValue({
      data: { balance: 150, costs: { BusinessModel: 18 } },
    } as any);

    vi.spyOn(creatorAiQueries, 'useStartBusinessModel').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useRegenerateBusinessModel').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useBusinessModelSessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        status: 'Completed',
        output: mockBusinessModelOutput,
        updatedAt: '2026-09-20T12:00:00Z',
      },
      retry: vi.fn(),
    } as any);
  });

  it('renders Section 0: Osterwalder Canvas with 9 canonical numbered blocks and counts', async () => {
    render(<BusinessModelPage />);

    // Block titles
    expect(await screen.findByText('KEY PARTNERS')).toBeInTheDocument();
    expect(screen.getByText('KEY ACTIVITIES')).toBeInTheDocument();
    expect(screen.getByText('KEY RESOURCES')).toBeInTheDocument();
    expect(screen.getByText('VALUE PROPOSITIONS')).toBeInTheDocument();
    expect(screen.getByText('CUSTOMER RELATIONSHIPS')).toBeInTheDocument();
    expect(screen.getByText('CHANNELS')).toBeInTheDocument();
    expect(screen.getByText('CUSTOMER SEGMENTS')).toBeInTheDocument();
    expect(screen.getByText('COST STRUCTURE')).toBeInTheDocument();
    expect(screen.getByText('REVENUE STREAMS')).toBeInTheDocument();

    // Block numbers
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
    expect(screen.getByText('05')).toBeInTheDocument();
    expect(screen.getByText('06')).toBeInTheDocument();
    expect(screen.getByText('07')).toBeInTheDocument();
    expect(screen.getByText('08')).toBeInTheDocument();
    expect(screen.getByText('09')).toBeInTheDocument();

    // Content items from real data
    expect(screen.getByText('Payment processor')).toBeInTheDocument();
    expect(screen.getByText('Product development')).toBeInTheDocument();
    expect(screen.getByText('Product platform')).toBeInTheDocument();
    expect(screen.getByText('One tool instead of four spreadsheets')).toBeInTheDocument();
    expect(screen.getByText('Self-serve onboarding')).toBeInTheDocument();
    expect(screen.getByText('Direct online signup')).toBeInTheDocument();
    expect(screen.getByText('Independent retailers')).toBeInTheDocument();
    expect(screen.getByText('Hosting — €900/month fixed')).toBeInTheDocument();
    expect(screen.getByText('Monthly subscription — €29 to €149')).toBeInTheDocument();
  });

  it('renders Section 1: Unit Economics Strip with CAC, LTV, LTV/CAC Healthy badge, and Payback', async () => {
    render(<BusinessModelPage />);

    expect(await screen.findByText('UNIT ECONOMICS')).toBeInTheDocument();
    expect(screen.getByText('Calibrated based on benchmarks')).toBeInTheDocument();

    expect(screen.getByText('CAC')).toBeInTheDocument();
    expect(screen.getByText('€45')).toBeInTheDocument();

    expect(screen.getByText('LTV')).toBeInTheDocument();
    expect(screen.getByText('€620')).toBeInTheDocument();

    expect(screen.getByText('LTV / CAC')).toBeInTheDocument();
    expect(screen.getByText('13.8x')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();

    expect(screen.getByText('ESTIMATED PAYBACK')).toBeInTheDocument();
    expect(screen.getByText('3 months')).toBeInTheDocument();
  });

  it('renders Section 2: Completion Checklist with 5 completion items', async () => {
    render(<BusinessModelPage />);

    expect(await screen.findByText('STEP COMPLETE')).toBeInTheDocument();
    expect(screen.getByText('9 Business Model blocks completed')).toBeInTheDocument();
    expect(screen.getByText('Revenue model defined')).toBeInTheDocument();
    expect(screen.getByText('Pricing defined')).toBeInTheDocument();
    expect(screen.getByText('Cost structure defined')).toBeInTheDocument();
    expect(screen.getByText('Unit economics generated')).toBeInTheDocument();
  });

  it('renders Section 3: Footer Action Row with Back button and Build Financial Forecast button', async () => {
    render(<BusinessModelPage />);

    const buildBtn = await screen.findByRole('button', { name: /Build Financial Forecast/i });
    expect(buildBtn).toBeInTheDocument();

    // Footer Back button
    const backBtn = screen.getByRole('button', { name: /Back/i });
    expect(backBtn).toBeInTheDocument();

    // Header actions still have Regenerate button
    const regenBtns = screen.getAllByRole('button', { name: /Regenerate/i });
    expect(regenBtns.length).toBeGreaterThanOrEqual(1);
  });
});
