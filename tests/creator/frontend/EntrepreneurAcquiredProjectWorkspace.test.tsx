import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EntrepreneurAcquisitionDetailPage from '@/app/dashboard/entrepreneur/acquisitions/[dealId]/page';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    getDeal: vi.fn(),
    getPrivateProject: vi.fn(),
    getBuyoutSaleRecord: vi.fn(),
    downloadDocument: vi.fn(),
    getBuyoutLegalPackage: vi.fn(),
    getBuyoutSigningPackage: vi.fn(),
    getBuyoutClosing: vi.fn(),
    getBuyoutHandover: vi.fn(),
  },
}));

vi.mock('@/lib/api-marketplace-projects', () => ({
  default: mockApi,
  marketplaceProjectsApi: mockApi,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ dealId: 'deal-123' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/dashboard/entrepreneur/acquisitions/deal-123',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Entrepreneur Acquired Project Workspace', () => {
  const mockSoldDeal = {
    id: 'deal-123',
    dealType: 'FULL_BUYOUT',
    dealStage: 'SOLD',
    status: 'completed',
    ideaId: 'idea-999',
    projectName: 'Fintech Revolution',
    creatorId: 'creator-1',
    creatorName: 'Alice Creator',
    entrepreneurId: 'buyer-1',
    entrepreneurName: 'Bob Buyer',
    currentRevisionNumber: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    buyoutClosing: {
      id: 'closing-1',
      dealId: 'deal-123',
      purchasePrice: 27500,
      currency: 'EUR',
      paymentStatus: 'PAYMENT_CONFIRMED',
      closingStatus: 'COMPLETED',
      updatedAt: new Date().toISOString(),
    },
    buyoutSaleRecord: {
      id: 'sale-1',
      dealId: 'deal-123',
      ideaId: 'idea-999',
      projectName: 'Fintech Revolution',
      sellerUserId: 'creator-1',
      sellerName: 'Alice Creator',
      buyerUserId: 'buyer-1',
      buyerName: 'Bob Buyer',
      purchasePrice: 27500,
      currency: 'EUR',
      auditReference: 'SALE-REF-12345678',
      manifestHash: 'hash-abc',
      assetManifestVersion: 1,
      closingId: 'closing-1',
      handoverId: 'handover-1',
      soldAt: new Date().toISOString(),
      transferredAssets: ['Brand Assets', 'Source Code', 'Business Plan PDF'],
      status: 'SOLD',
    },
    buyoutHandover: {
      id: 'handover-1',
      dealId: 'deal-123',
      ideaId: 'idea-999',
      dealType: 'FULL_BUYOUT',
      status: 'COMPLETED',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 2,
      canCompleteSale: true,
      blockers: [],
      assets: [
        {
          assetId: 'asset_1',
          assetType: 'Design Files',
          displayName: 'Brand Assets',
          deliveryType: 'DIRECT_UPLOAD',
          isRequired: true,
          status: 'VERIFIED',
          version: 1,
        },
      ],
    },
  };

  const mockPrivateProject = {
    ideaId: 'idea-999',
    projectName: 'Fintech Revolution',
    tagline: 'Autonomous AI Accounting',
    problem: 'Manual bookkeeping is slow and error-prone.',
    solution: 'Automated AI pipeline for real-time ledger accounting.',
    concept: 'End-to-end autonomous ledger synchronization engine.',
    targetUser: 'SMB owners and accountants',
    targetMarket: 'European SaaS and Tech SMEs',
    geography: 'European Union (France, Germany, Benelux)',
    sector: 'Fintech',
    category: 'Financial Software',
    country: 'FR',
    stage: 'Concept',
    clarityScore: 92,
    readinessScore: 88,
    dealModes: ['full_buyout'],
    askingPrice: 27500,
    ndaRequired: false,
    audience: 'public',
    status: 'closed',
    publishedAt: new Date().toISOString(),
    creatorEdge: 'Proprietary ML reconciler trained on millions of invoices.',
    marketGap: 'Existing tools require heavy manual validation.',
    existingAlternatives: 'QuickBooks and manual spreadsheets.',
    whyNow: 'Mandatory electronic invoicing regulations in Europe 2026.',
    riskiestAssumption: 'Accountants willing to trust automated ledger writes.',
    tags: ['Fintech', 'AI', 'Accounting', 'Automation'],

    intelligence: {
      available: true,
      investorReadiness: {
        total: 88,
        label: 'Investor-Ready',
        conceptClarity: 92,
        marketEvidence: 85,
        financialModel: 90,
        legalReadiness: 84,
        teamCredibility: 89,
      },
      legalChecklist: {
        completedCount: 4,
        totalCount: 4,
        items: [
          { id: '1', label: 'Commercial IP Assignment', category: 'mandatory', status: 'done', badge: 'urgent', spSpecialty: 'Legal' },
          { id: '2', label: 'GDPR & Privacy Compliance', category: 'mandatory', status: 'done', badge: 'fintech', spSpecialty: 'Compliance' },
        ],
      },
      formation: {
        recommendedType: 'SAS (Société par Actions Simplifiée)',
        recommendationReason: 'Flexible capital structure optimal for European tech ventures.',
        selectedType: 'SAS',
        options: [
          { code: 'SAS', description: 'Simplified Joint Stock Company', capital: '€1 min', formationTime: '3-5 days', estimatedCost: '€500' },
        ],
        youHave: ['Product Vision', 'System Architecture'],
        youNeed: [{ label: 'Senior ML Engineer', spSpecialty: 'development' }],
        cofounderDraft: {
          roleNeeded: 'Chief Commercial Officer',
          equityRange: '15% - 25%',
          locationPreference: 'Remote / Paris',
        },
      },
    },

    businessPlan: {
      summary: 'Automated AI pipeline for real-time ledger accounting.',
      executiveSummary: 'Automated AI pipeline for real-time ledger accounting.',
      valueProposition: 'Save 20+ hours per month on bookkeeping with 99.9% reconciliation accuracy.',
      highlights: ['Zero human data entry', 'Real-time bank feed sync', 'Multi-currency support'],
      marketOpportunity: '€12B European SMB accounting market.',
      targetSegments: ['Tech Startups', 'E-commerce Sellers', 'Accounting Practices'],
      marketSizeQualitative: 'Over 25 million registered SMEs across the EU.',
      competitiveAdvantage: 'Proprietary ML reconciler trained on millions of invoices.',
      competitors: [
        {
          name: 'Legacy Ledger Inc',
          positioning: 'Enterprise ERP',
          strengths: ['Brand recognition', 'Wide feature set'],
          weaknesses: ['Expensive', 'Slow onboarding'],
          ourAdvantage: '10x faster automated onboarding and modern UX',
        },
      ],
      revenueModel: 'Tiered monthly subscription.',
      revenueStreams: [
        { name: 'Core SaaS Subscription', description: 'Monthly per-seat license' },
        { name: 'API Volume Usage', description: 'Metered per 1,000 processed transactions' },
      ],
      pricingStrategy: 'Value-based tiering with freemium tier',
      keyMetrics: ['MRR Growth', 'Churn < 1%', 'LTV/CAC > 4.0'],
      milestones: [
        { phase: 'Phase 1', deliverable: 'Core API Integration', timeframe: 'Month 1-3' },
        { phase: 'Phase 2', deliverable: 'Public Beta Launch', timeframe: 'Month 4-6' },
      ],
      risks: [
        { category: 'Regulatory', risk: 'Banking API downtime', mitigation: 'Redundant aggregator fallback' },
      ],
      available: true,
    },

    financialForecast: {
      tam: 12000000000,
      monthlyGrowthPct: 15,
      breakEvenMonth: 8,
      breakEvenRevenue: 45000,
      projectedArr: 300000,
      arpu: 99,
      estimatedRunwayMonths: 18,
      currency: 'EUR',
      available: true,
      assumptions: ['5% initial conversion rate from free trial', 'Average sales cycle of 14 days'],
      advisoryNotice: 'Planning estimates based on market benchmark data.',
      revenueMonthly: [
        { month: 1, amount: 2500, notes: 'Beta launch' },
        { month: 2, amount: 6000, notes: 'Early adopters' },
      ],
      costMonthly: [
        { month: 1, fixedCosts: 1500, variableCosts: 500, notes: 'Hosting & APIs' },
        { month: 2, fixedCosts: 1500, variableCosts: 800, notes: 'Server scaling' },
      ],
      cashFlowMonthly: [
        { month: 1, netCashFlow: 500, endingBalance: 25500, notes: 'Positive margin' },
        { month: 2, netCashFlow: 3700, endingBalance: 29200, notes: 'Accelerating growth' },
      ],
    },

    pricing: {
      pricingModel: 'tiered',
      forecastArpu: 99,
      tiers: [
        {
          name: 'Starter',
          price: 49,
          billingCycle: 'monthly',
          features: ['Up to 500 tx/mo', 'Basic exports'],
          isHighlighted: false,
        },
        {
          name: 'Pro',
          price: 149,
          billingCycle: 'monthly',
          features: ['Unlimited tx', 'Real-time reconciliation', 'Priority support'],
          isHighlighted: true,
        },
      ],
      available: true,
    },

    resourcePlan: {
      launchBudgetMin: 15000,
      launchBudgetMax: 35000,
      monthlyRunningCost: 2500,
      timeToLaunchWeeksMin: 4,
      timeToLaunchWeeksMax: 8,
      teamRolesNeeded: ['Fullstack Engineer', 'Growth Marketer'],
      teamRequirements: [
        { role: 'Fullstack Engineer', cost: 18000, durationMonths: 3, oneTime: false },
        { role: 'Growth Marketer', cost: 7000, durationMonths: 2, oneTime: false },
      ],
      saasStack: [
        { name: 'AWS Cloud Services', monthlyCost: 450 },
        { name: 'Stripe Billing', monthlyCost: 150 },
      ],
      budgetBreakdown: { teamPct: 60, toolsPct: 20, legalPct: 10, miscPct: 10 },
      available: true,
    },

    gtmPlan: {
      primaryChannels: ['Content Marketing', 'Accountant Partnerships'],
      targetAudiences: ['Tech SMBs', 'Boutique Accounting Firms'],
      webPresenceAssets: ['Landing Page', 'Documentation'],
      benchmarkGtmWeeks: [
        { week: 1, title: 'Landing Page & Waitlist', tasks: ['Deploy site', 'Setup analytics'], completed: true },
        { week: 2, title: 'Accountant Outreach', tasks: ['Direct email to 100 CPAs'], completed: false },
      ],
      available: true,
    },

    branding: {
      logoAsset: null,
      logoType: 'designer',
      brandingMethod: 'm50_designer',
      paletteName: 'Ocean Deep',
      typographyPairing: 'Syne (Headings) / DM Sans (Body)',
      colorPalette: ['#3C61DD', '#157A55', '#F1F5FF'],
    },

    documents: [
      {
        id: 'doc-1',
        title: 'Venture Architecture Spec',
        documentType: 'SPECIFICATION',
        fileName: 'architecture_spec.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 245000,
        createdAt: new Date().toISOString(),
        downloadable: true,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getDeal.mockResolvedValue(mockSoldDeal);
    mockApi.getPrivateProject.mockResolvedValue(mockPrivateProject);
    mockApi.getBuyoutSaleRecord.mockResolvedValue(mockSoldDeal.buyoutSaleRecord);
    mockApi.getBuyoutLegalPackage.mockResolvedValue({
      id: 'pkg-1',
      documents: [],
      creatorApproval: { status: 'approved' },
      entrepreneurApproval: { status: 'approved' },
    });
    mockApi.getBuyoutSigningPackage.mockResolvedValue({
      id: 'sign-1',
      status: 'AGREEMENT_SIGNED',
    });
    mockApi.getBuyoutClosing.mockResolvedValue(mockSoldDeal.buyoutClosing);
    mockApi.getBuyoutHandover.mockResolvedValue(mockSoldDeal.buyoutHandover);
  });

  it('renders complete Overview tab with strategic differentiation and tags', async () => {
    render(<EntrepreneurAcquisitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Acquired Project')).toBeDefined();
      expect(screen.getByText('Fintech Revolution')).toBeDefined();
      expect(screen.getByText('The Problem')).toBeDefined();
      expect(screen.getByText('The Solution')).toBeDefined();
      expect(screen.getByText('Proprietary ML reconciler trained on millions of invoices.')).toBeDefined();
      expect(screen.getByText('QuickBooks and manual spreadsheets.')).toBeDefined();
      expect(screen.getByText('Mandatory electronic invoicing regulations in Europe 2026.')).toBeDefined();
      expect(screen.getByText('Accounting')).toBeDefined();
    });
  });

  it('allows switching to Acquisition Record view and back', async () => {
    render(<EntrepreneurAcquisitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchased Project')).toBeDefined();
    });

    const recordBtn = screen.getAllByRole('button', { name: /Acquisition Record/i })[0];
    fireEvent.click(recordBtn);

    await waitFor(() => {
      expect(screen.getByText('Full Buyout Lifecycle Progress')).toBeDefined();
    });
  });

  it('renders Project Intelligence tab with investor score, market, and formation', async () => {
    render(<EntrepreneurAcquisitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Project Intelligence'));
    await waitFor(() => {
      expect(screen.getByText('Investor Readiness Evaluation')).toBeDefined();
      expect(screen.getByText(/Investor-Ready/i)).toBeDefined();
      expect(screen.getByText('Concept Clarity')).toBeDefined();
      expect(screen.getByText('92%')).toBeDefined();
      expect(screen.getByText('Corporate Formation & Skill Analysis')).toBeDefined();
      expect(screen.getByText('SAS (Société par Actions Simplifiée)')).toBeDefined();
      expect(screen.getByText('Commercial IP Assignment')).toBeDefined();
    });
  });

  it('renders Business Plan tab using canonical Creator 11-section layout in read-only mode', async () => {
    render(<EntrepreneurAcquisitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /Business Plan/i }));
    await waitFor(() => {
      expect(screen.getByText(/Fintech Revolution — Business Plan/i)).toBeDefined();
      expect(screen.getByText(/Executive Summary/i)).toBeDefined();
      expect(screen.getByText(/Problem & Solution/i)).toBeDefined();
      expect(screen.getByText(/Target Market/i)).toBeDefined();
      expect(screen.getByText(/Business Model/i)).toBeDefined();
      expect(screen.getByText(/Competitive Landscape/i)).toBeDefined();
      expect(screen.getByText(/Go-to-Market/i)).toBeDefined();
      expect(screen.getByText(/Financial Projections/i)).toBeDefined();
      expect(screen.getByText(/Team Needs/i)).toBeDefined();
      expect(screen.getByText(/Funding Requirements/i)).toBeDefined();
      expect(screen.getByText(/Operations & Milestones/i)).toBeDefined();
      expect(screen.getByText(/Risk Register/i)).toBeDefined();
      expect(screen.getByText('Save 20+ hours per month on bookkeeping with 99.9% reconciliation accuracy.')).toBeDefined();
      expect(screen.getByText(/Legacy Ledger Inc/i)).toBeDefined();
      expect(screen.getAllByRole('button', { name: /Download Report/i }).length).toBeGreaterThan(0);
      expect(screen.queryByRole('button', { name: /Edit/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Rewrite/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Generate plan/i })).toBeNull();
    });
  });

  it('renders Financial Forecast tab using canonical Creator Recharts graphs and ForecastView in read-only mode', async () => {
    render(<EntrepreneurAcquisitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /Financial Forecast/i }));
    await waitFor(() => {
      expect(screen.getByText(/Your 3-Year Financial Forecast/i)).toBeDefined();
      expect(screen.getByText('Revenue Growth')).toBeDefined();
      expect(screen.getByText('Cost vs Revenue')).toBeDefined();
      expect(screen.getByText('Break-even Point')).toBeDefined();
      expect(screen.getByText(/Cashflow/i)).toBeDefined();
      expect(screen.getByText(/Inputs used:/i)).toBeDefined();
      expect(screen.getByText('Financial Forecast Results')).toBeDefined();
      expect(screen.getByText('Break-Even Analysis')).toBeDefined();
      expect(screen.getByText('Break-Even Timing')).toBeDefined();
      expect(screen.getByText('Key Model Assumptions')).toBeDefined();
      expect(screen.getByText('Risk Assessment Matrix')).toBeDefined();
      expect(screen.getAllByRole('button', { name: /Download Report/i }).length).toBeGreaterThan(0);
      expect(screen.queryByRole('button', { name: /Adjust & regenerate/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Set inputs & generate/i })).toBeNull();
    });
  });

  it('renders Pricing & GTM tab with tiers, team roles, and execution weeks', async () => {
    render(<EntrepreneurAcquisitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Pricing & GTM'));
    await waitFor(() => {
      expect(screen.getByText('Pricing Strategy & Commercial Tiers')).toBeDefined();
      expect(screen.getByText('Starter')).toBeDefined();
      expect(screen.getByText('Pro')).toBeDefined();
      expect(screen.getByText('Resource Plan & Launch Budget')).toBeDefined();
      expect(screen.getByText('Fullstack Engineer')).toBeDefined();
      expect(screen.getByText('AWS Cloud Services: €450/mo')).toBeDefined();
      expect(screen.getByText('Benchmark GTM Execution Timeline:')).toBeDefined();
      expect(screen.getByText('Week 1: Landing Page & Waitlist')).toBeDefined();
    });
  });

  it('renders Brand & Assets tab with color swatches and deliverables', async () => {
    render(<EntrepreneurAcquisitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Brand & Assets'));
    await waitFor(() => {
      expect(screen.getByText('Brand Identity & Visual Design')).toBeDefined();
      expect(screen.getByText('Ocean Deep')).toBeDefined();
      expect(screen.getByText('Transferred Handover Deliverables')).toBeDefined();
      expect(screen.getByText('Brand Assets')).toBeDefined();
    });
  });

  it('renders Project Documents tab with download button', async () => {
    render(<EntrepreneurAcquisitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Project Documents'));
    await waitFor(() => {
      expect(screen.getByText('Transferred Project Documents')).toBeDefined();
      expect(screen.getByText('Venture Architecture Spec')).toBeDefined();
      expect(screen.getByRole('button', { name: /Download/i })).toBeDefined();
    });
  });
});
