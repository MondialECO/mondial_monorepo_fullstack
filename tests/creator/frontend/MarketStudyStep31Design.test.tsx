import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarketStudyPage from '@/app/dashboard/creator/phase-3/market-study/page';
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

describe('MarketStudyPage (Step 3.1 Design Alignment)', () => {
  const mockStudyOutput = {
    schemaVersion: 1,
    marketSizing: {
      tam: {
        value: 12000000000,
        currency: 'USD',
        label: 'Global Enterprise Logistics SaaS',
        derivation: '120k enterprises spending $100k annually on supply chain visibility.',
        sourceAttribution: 'Gartner Supply Chain Report 2026',
      },
      sam: {
        value: 2400000000,
        currency: 'USD',
        label: 'European Cross-Border Freight',
        percentageOfTam: 20,
        derivation: '24k European freight forwarders with EU regulatory mandate.',
        sourceAttribution: 'Eurostat Freight Logistics 2025',
      },
      som: {
        value: 120000000,
        currency: 'USD',
        label: 'Beachhead EU Sustainable Shippers',
        percentageOfSam: 5,
        derivation: '1,200 initial target customers reachable in 24 months.',
        sourceAttribution: 'Internal Bottom-Up Cohort Model',
      },
      methodology: 'Triangulated bottom-up cohort adoption model cross-referenced with top-down Gartner telemetry.',
    },
    competitorLandscape: {
      summary: 'Market dominated by legacy ERP extensions with slow API refresh cycles.',
      directCompetitors: [
        {
          name: 'LogiCorp Enterprise',
          segment: 'Global Tier 1 Freight Forwarders',
          pricingModel: 'Enterprise SaaS ($80k/yr)',
          estimatedMarketShare: '32%',
          strengths: ['Global distribution network'],
          weaknesses: ['Legacy on-premise sync'],
          exploitableGap: 'No real-time carbon tracking API',
          sourceAttribution: 'Logistics Benchmark 2026',
        },
        {
          name: 'LegacyFreight',
          // segment intentionally omitted to test backward compatibility with older stored documents
          pricingModel: 'Per-seat license ($120/mo)',
          estimatedMarketShare: '14%',
          strengths: ['Low initial pricing'],
          weaknesses: ['Poor developer tooling'],
          exploitableGap: 'Lacks automated customs declaration',
        },
      ],
      indirectCompetitors: [
        {
          name: 'Internal Excel & Spreadsheets',
          substituteApproach: 'Manual data entry and reconciliation',
          threatLevel: 'medium',
        },
      ],
    },
    demandSignals: [
      {
        signal: 'EU CSRD reporting mandate enforcement',
        evidence: 'Over 50k EU companies require digital supply chain emissions auditing by Q4 2026.',
        sourceAttribution: 'European Commission Regulatory Directive',
        relevanceScore: 9,
      },
    ],
    sizingRisks: [
      {
        risk: 'Legacy API integration inertia',
        impactOnSom: 'high',
        mitigation: 'Provide drop-in EDI adapters and pre-built SAP/Oracle connectors.',
      },
      {
        risk: 'Macroeconomic freight volume fluctuations',
        impactOnSom: 'medium',
        mitigation: 'Tiered volume-based pricing model with minimum base commitments.',
      },
    ],
    marketGapValidation: {
      primaryGap: 'Zero-configuration real-time carbon audit engine for mid-market freight forwarders',
      validationRationale: 'Interviews with 30 logistics directors confirmed unserved demand for instant ESG compliance.',
      confidenceLevel: 'high',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (creatorJourneyApi.creatorJourneyApi.get as any).mockResolvedValue({
      journey: {
        project: {
          marketGap: 'Existing tools require 6-month enterprise onboarding with no automated ESG calculation.',
          sector: 'CleanTech Logistics',
          geography: 'Europe',
        },
        phase3Data: {
          marketStudySessionId: 'session-456',
          clarifierSessionId: 'clarifier-123',
        },
      },
    });

    vi.spyOn(creatorAiQueries, 'useAiCredits').mockReturnValue({
      data: { balance: 150, costs: { MarketStudy: 20 } },
    } as any);

    vi.spyOn(creatorAiQueries, 'useStartMarketStudy').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(creatorAiQueries, 'useRegenerateMarketStudy').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
  });

  it('renders Section 1 (Your Market Opportunity) and Section 2 (Market Overview Grid)', async () => {
    vi.spyOn(creatorAiQueries, 'useMarketStudySessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        status: 'Completed',
        currentVersion: 1,
        output: mockStudyOutput,
      },
    } as any);

    render(<MarketStudyPage />);

    expect(await screen.findByText(/YOUR MARKET OPPORTUNITY/i)).toBeInTheDocument();
    expect(screen.getByText('INDUSTRY')).toBeInTheDocument();
    expect(screen.getByText('MARKET')).toBeInTheDocument();
    expect(screen.getByText('PRIMARY GEOGRAPHY')).toBeInTheDocument();
    expect(screen.getByText('MARKET STAGE')).toBeInTheDocument();
    expect(screen.getByText('Growing')).toBeInTheDocument();
  });

  it('renders Section 3 (TAM/SAM/SOM sizing) and Section 7 (Completion Checklist)', async () => {
    vi.spyOn(creatorAiQueries, 'useMarketStudySessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        status: 'Completed',
        currentVersion: 1,
        output: mockStudyOutput,
      },
    } as any);

    render(<MarketStudyPage />);

    expect(await screen.findByText('TAM')).toBeInTheDocument();
    expect(screen.getByText('SAM')).toBeInTheDocument();
    expect(screen.getByText('SOM')).toBeInTheDocument();
    expect(screen.getByText(/STEP COMPLETE/i)).toBeInTheDocument();
    expect(screen.getByText(/Market identified/i)).toBeInTheDocument();
    expect(screen.getByText(/Target users defined/i)).toBeInTheDocument();
    expect(screen.getByText(/TAM \/ SAM \/ SOM generated/i)).toBeInTheDocument();
    expect(screen.getByText(/Competitor landscape analyzed/i)).toBeInTheDocument();
    expect(screen.getByText(/Market gaps identified/i)).toBeInTheDocument();
  });

  it('renders dense competitor table with segment column and honest empty cell for legacy studies', async () => {
    vi.spyOn(creatorAiQueries, 'useMarketStudySessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        status: 'Completed',
        currentVersion: 1,
        output: mockStudyOutput,
      },
    } as any);

    render(<MarketStudyPage />);

    expect(await screen.findByText('LogiCorp Enterprise')).toBeInTheDocument();
    expect(screen.getByText('Global Tier 1 Freight Forwarders')).toBeInTheDocument();

    // Legacy competitor without segment field renders honest empty cell '—'
    expect(screen.getByText('LegacyFreight')).toBeInTheDocument();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('renders left-aligned header with real metadata line and quiet actions in title row', async () => {
    vi.spyOn(creatorAiQueries, 'useMarketStudySessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        status: 'Completed',
        currentVersion: 1,
        updatedAt: '2026-09-18T10:00:00Z',
        output: mockStudyOutput,
      },
    } as any);

    render(<MarketStudyPage />);

    expect(await screen.findByText(/Market Study & Competitive Intelligence/i)).toBeInTheDocument();
    expect(screen.getAllByText(/CleanTech Logistics · Europe/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Regenerate/i })).toBeInTheDocument();
  });

  it('renders extreme case of SOM at 1% or less with full uncrushed text and sliver bar', async () => {
    const extremeOutput = {
      ...mockStudyOutput,
      marketSizing: {
        ...mockStudyOutput.marketSizing,
        tam: {
          value: 100000000000,
          currency: 'USD',
          label: 'Global Heavy Logistics',
          derivation: '100B global market ceiling across heavy freight.',
        },
        sam: {
          value: 5000000000,
          currency: 'USD',
          label: 'EU Regulated Freight Forwarders',
          percentageOfTam: 5,
          derivation: '5B serviceable European transport corridor.',
        },
        som: {
          value: 50000000, // 0.05% of TAM, 1% of SAM
          currency: 'USD',
          label: 'Early Pilot Beta Cohort',
          percentageOfSam: 1,
          derivation: 'Targeted beachhead with 50 enterprise shippers in Benelux.',
        },
      },
    };

    vi.spyOn(creatorAiQueries, 'useMarketStudySessionTimed').mockReturnValue({
      phase: 'terminal',
      data: {
        status: 'Completed',
        currentVersion: 1,
        output: extremeOutput,
      },
    } as any);

    render(<MarketStudyPage />);

    expect(await screen.findByText('Early Pilot Beta Cohort')).toBeInTheDocument();
    expect(screen.getAllByText(/1% of SAM/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('$50M')).toBeInTheDocument();
  });

  it('triggers PDF export print view overlay when clicking Export PDF button', async () => {
    const userEvent = (await import('@testing-library/user-event')).default.setup();
    render(<MarketStudyPage />);

    const exportBtn = await screen.findByRole('button', { name: /export pdf/i });
    expect(exportBtn).toBeInTheDocument();

    await userEvent.click(exportBtn);

    // Verify print preview overlay elements
    expect(screen.getByText(/Print \/ Save as PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/Mondial · Market Study & Competitive Intelligence/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Market Sizing Funnel/i).length).toBeGreaterThanOrEqual(1);
  });
});
