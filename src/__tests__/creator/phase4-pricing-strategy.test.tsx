import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PricingStrategyView } from '@/components/creator/phase4/PricingStrategyView';
import type {
  PricingStrategy,
  PricingOffer,
  PricingRisk,
  PricingExperiment,
} from '@/types/creator/pricing';

const mockOffers: PricingOffer[] = [
  {
    key: 'offer-starter',
    name: 'Starter Tier',
    tier: 'Starter',
    targetSegment: 'Early Stage Startups',
    revenueModel: 'Subscription',
    billingPeriod: 'Monthly',
    presentation: {
      currency: 'EUR',
      taxMode: 'TaxExclusive',
      displayPrice: '€29 HT / month',
    },
    unitEconomics: {
      variableCostPerUnit: 6.0,
      deliveryCostPerUnit: 2.0,
      marginTargetType: 'Percentage',
      targetMarginRate: 60.0,
      minimumPriceFloor: 15.0,
      contributionMarginAmount: 21.0,
      contributionMarginRate: 72.4,
      breakevenUnitsPerMonth: 45,
      economicsValidation: 'Valid',
    },
    forecastAlignment: {
      alignmentBasis: 'MonthlyRevenuePerCustomer',
      forecastBenchmarkValue: 30.0,
      normalizedOfferValue: 29.0,
      varianceAmount: -1.0,
      variancePercentage: -3.3,
      isAligned: true,
      notes: 'Aligned with Phase 3.4 Forecast ARPU.',
    },
    recommendedPrice: 29.0,
    marketReferencePrice: null,
    validatedMarketPrice: 25.0,
    marketPriceValidationLevel: 'EmpiricallyValidated',
    founderPrice: null,
    effectivePrice: 29.0,
    featuresIncluded: ['Core Dashboard', '1 Integration', 'Standard SLA'],
    launchDiscountPercentage: null,
    isRecommendedDefault: false,
    status: 'Valid',
    founderNotes: null,
  },
  {
    key: 'offer-pro',
    name: 'Professional Tier',
    tier: 'Professional',
    targetSegment: 'Scaling B2B SMBs',
    revenueModel: 'Subscription',
    billingPeriod: 'Monthly',
    presentation: {
      currency: 'EUR',
      taxMode: 'TaxExclusive',
      displayPrice: '€49 HT / month',
    },
    unitEconomics: {
      variableCostPerUnit: 12.0,
      deliveryCostPerUnit: 3.0,
      marginTargetType: 'Percentage',
      targetMarginRate: 65.0,
      minimumPriceFloor: 34.29,
      contributionMarginAmount: 34.0,
      contributionMarginRate: 69.4,
      breakevenUnitsPerMonth: 80,
      economicsValidation: 'Valid',
    },
    forecastAlignment: {
      alignmentBasis: 'MonthlyRevenuePerCustomer',
      forecastBenchmarkValue: 50.0,
      normalizedOfferValue: 49.0,
      varianceAmount: -1.0,
      variancePercentage: -2.0,
      isAligned: true,
      notes: 'Benchmark aligned.',
    },
    recommendedPrice: 49.0,
    marketReferencePrice: 45.0,
    validatedMarketPrice: null,
    marketPriceValidationLevel: 'Supported',
    founderPrice: 39.0,
    effectivePrice: 39.0,
    featuresIncluded: ['Unlimited Integrations', 'Priority Support', 'Custom Exports'],
    launchDiscountPercentage: 20,
    isRecommendedDefault: true,
    status: 'Valid',
    founderNotes: 'Founder early launch discount applied.',
  },
  {
    key: 'offer-enterprise',
    name: 'Enterprise Retainer',
    tier: 'Enterprise',
    targetSegment: 'Mid-Market & Corporates',
    revenueModel: 'Retainer',
    billingPeriod: 'Monthly',
    presentation: {
      currency: 'EUR',
      taxMode: 'TaxExclusive',
      displayPrice: '€1,200 HT / month',
    },
    unitEconomics: {
      variableCostPerUnit: 1400.0,
      deliveryCostPerUnit: 100.0,
      marginTargetType: 'AbsoluteAmount',
      targetMarginAmount: 500.0,
      minimumPriceFloor: 1500.0,
      contributionMarginAmount: -300.0,
      contributionMarginRate: -25.0,
      breakevenUnitsPerMonth: 10,
      economicsValidation: 'BelowFloor',
    },
    forecastAlignment: {
      alignmentBasis: 'MonthlyRevenuePerCustomer',
      forecastBenchmarkValue: 2000.0,
      normalizedOfferValue: 1200.0,
      varianceAmount: -800.0,
      variancePercentage: -40.0,
      isAligned: false,
      notes: 'Significant variance from enterprise forecast.',
    },
    recommendedPrice: 1600.0,
    validatedMarketPrice: null,
    founderPrice: 1200.0,
    effectivePrice: 1200.0,
    featuresIncluded: ['Dedicated Account Manager', 'Custom API', 'SLA 99.9%'],
    launchDiscountPercentage: null,
    isRecommendedDefault: false,
    status: 'BelowFloor',
    founderNotes: 'Discounted to acquire reference customer.',
  },
];

const mockRisks: PricingRisk[] = [
  {
    id: 'risk-1',
    riskType: 'PriceFloorViolation',
    description: 'Enterprise Retainer is priced below variable delivery floor.',
    severity: 'Critical',
    mitigationSuggestion: 'Increase retainer or limit dedicated consulting hours.',
  },
  {
    id: 'risk-2',
    riskType: 'ForecastVarianceWarning',
    description: 'Forecast revenue expectations exceed packaging realization.',
    severity: 'Medium',
    mitigationSuggestion: 'Re-align forecast assumptions or introduce onboarding setup fee.',
  },
];

const mockExperiments: PricingExperiment[] = [
  {
    id: 'exp-1',
    hypothesis: 'Early adopters will convert at €39/mo with 30-day trial.',
    experimentType: 'PilotDiscount',
    testDurationDays: 30,
    successMetric: '15% Free-to-paid conversion',
    targetSegment: 'Early Stage Startups',
    suggestedAction: 'Deploy pilot landing page cohort.',
  },
];

const mockStrategy: PricingStrategy = {
  status: 'Ready',
  generatedAt: '2026-09-21T00:00:00Z',
  updatedAt: '2026-09-21T00:00:00Z',
  primaryRevenueModel: 'Subscription',
  revenueModels: ['Subscription', 'Retainer', 'SetupFee'],
  offers: mockOffers,
  risks: mockRisks,
  experiments: mockExperiments,
  recommendation: {
    recommendedModel: 'Subscription',
    underlyingRevenueModels: ['Subscription', 'SetupFee'],
    recommendedOffers: ['offer-starter', 'offer-pro'],
    reasoning: 'Subscription provides predictable recurring cash flow aligned with SMB SaaS benchmarks.',
    confidence: 'High',
    validationRequired: false,
    financialWarnings: [],
  },
  sourceVersions: {
    marketStudyVersion: 1,
    businessModelVersion: 1,
    forecastVersion: 1,
    consumedSources: ['Project', 'BusinessModel', 'Forecast', 'MarketStudy'],
  },
  founderEdited: true,
  overallHealthStatus: 'RequiresReview',
};

describe('Phase 4.6 Pricing Strategy View Component', () => {
  it('1. Renders empty state when strategy is null and triggers onGenerate', () => {
    const handleGenerate = vi.fn().mockResolvedValue(undefined);
    render(
      <PricingStrategyView
        ideaId="idea-123"
        projectName="Test Project"
        strategy={null}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={handleGenerate}
        onRefresh={vi.fn()}
        onUpdateOffer={vi.fn()}
      />
    );

    expect(screen.getByText(/Launch Pricing & Revenue Model Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-stream revenue model support/i)).toBeInTheDocument();
    expect(screen.getByText(/Rigorous price floor/i)).toBeInTheDocument();

    const generateBtn = screen.getByRole('button', { name: /Generate Pricing Strategy/i });
    fireEvent.click(generateBtn);
    expect(handleGenerate).toHaveBeenCalledTimes(1);
  });

  it('2. Renders gate blocking alert when gateError is present', () => {
    render(
      <PricingStrategyView
        ideaId="idea-123"
        projectName="Test Project"
        strategy={null}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        gateError={{
          code: 'PREREQUISITE_FAILED',
          message: 'Phase 3 must be completed before building launch pricing.',
        }}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateOffer={vi.fn()}
      />
    );

    expect(screen.getByText(/Prerequisite Gates Incomplete/i)).toBeInTheDocument();
    expect(screen.getByText(/Phase 3 must be completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Back to Phase 4.5 Aids & Grants/i)).toBeInTheDocument();
  });

  it('3. Renders full strategy with Hero counters, Primary model, and Multi-stream badges', () => {
    render(
      <PricingStrategyView
        ideaId="idea-123"
        projectName="Analytics SaaS"
        strategy={mockStrategy}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateOffer={vi.fn()}
      />
    );

    expect(screen.getByText(/Launch Pricing & Revenue Model Strategy/i)).toBeInTheDocument();
    expect(screen.getAllByText('Subscription').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/3 Offers/i)).toBeInTheDocument();
    expect(screen.getByText('Retainer')).toBeInTheDocument();
    expect(screen.getByText('SetupFee')).toBeInTheDocument();
    expect(screen.getByText(/Founder Customized/i)).toBeInTheDocument();
  });

  it('4. Renders Four-Price Separation Invariant without conflation', () => {
    render(
      <PricingStrategyView
        ideaId="idea-123"
        projectName="Analytics SaaS"
        strategy={mockStrategy}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateOffer={vi.fn()}
      />
    );

    // Pro tier has Recommended €49 and Founder/Your Price €39
    expect(screen.getAllByText(/MBC Recommendation:/i).length).toBe(3);
    expect(screen.getByText('€49')).toBeInTheDocument();
    expect(screen.getAllByText(/Your Price:/i).length).toBe(2);
    expect(screen.getAllByText('€39').length).toBe(2);

    // Starter tier has Validated Market €25
    expect(screen.getAllByText(/Validated Market Price:/i).length).toBe(3);
    expect(screen.getByText('€25')).toBeInTheDocument();
  });

  it('4b. Renders four semantic price fields even when values are equal', () => {
    const equalStrategy: PricingStrategy = {
      ...mockStrategy,
      offers: [
        {
          key: 'offer-equal',
          name: 'Equal Price Tier',
          tier: 'Growth',
          targetSegment: 'SMBs',
          revenueModel: 'Subscription',
          billingPeriod: 'Monthly',
          presentation: {
            currency: 'EUR',
            taxMode: 'TaxExclusive',
            displayPrice: '€49 HT / month',
          },
          unitEconomics: mockOffers[1].unitEconomics,
          forecastAlignment: mockOffers[1].forecastAlignment,
          recommendedPrice: 49.0,
          founderPrice: 49.0,
          marketReferencePrice: 49.0,
          validatedMarketPrice: 49.0,
          marketPriceValidationLevel: 'EmpiricallyValidated',
          effectivePrice: 49.0,
          featuresIncluded: ['Full Suite'],
          launchDiscountPercentage: null,
          isRecommendedDefault: true,
          status: 'Valid',
          founderNotes: null,
        },
      ],
    };

    render(
      <PricingStrategyView
        ideaId="idea-123"
        projectName="Analytics SaaS"
        strategy={equalStrategy}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateOffer={vi.fn()}
      />
    );

    // Assert all 4 semantic fields are present with distinct labels
    expect(screen.getByText(/MBC Recommendation:/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Price:/i)).toBeInTheDocument();
    expect(screen.getByText(/Market Reference:/i)).toBeInTheDocument();
    expect(screen.getByText(/Validated Market Price:/i)).toBeInTheDocument();

    // The value €49 should be rendered across all 4 fields (plus effective price) without collapsing
    const elements49 = screen.getAllByText('€49');
    expect(elements49.length).toBeGreaterThanOrEqual(4);
  });

  it('4c. Does not collapse market reference into validated market price', () => {
    const unvalidatedStrategy: PricingStrategy = {
      ...mockStrategy,
      offers: [
        {
          key: 'offer-ref-only',
          name: 'Competitor Reference Only Tier',
          tier: 'Standard',
          targetSegment: 'General',
          revenueModel: 'Subscription',
          billingPeriod: 'Monthly',
          presentation: {
            currency: 'EUR',
            taxMode: 'TaxExclusive',
            displayPrice: '€55 HT / month',
          },
          unitEconomics: mockOffers[1].unitEconomics,
          forecastAlignment: mockOffers[1].forecastAlignment,
          recommendedPrice: 55.0,
          founderPrice: null,
          marketReferencePrice: 49.0,
          validatedMarketPrice: null,
          marketPriceValidationLevel: 'Supported',
          effectivePrice: 55.0,
          featuresIncluded: ['Standard'],
          launchDiscountPercentage: null,
          isRecommendedDefault: false,
          status: 'Valid',
          founderNotes: null,
        },
      ],
    };

    render(
      <PricingStrategyView
        ideaId="idea-123"
        projectName="Analytics SaaS"
        strategy={unvalidatedStrategy}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateOffer={vi.fn()}
      />
    );

    expect(screen.getByText(/Market Reference:/i)).toBeInTheDocument();
    expect(screen.getByText('€49')).toBeInTheDocument();
    expect(screen.getByText('Supported')).toBeInTheDocument();

    // ValidatedMarketPrice must NOT collapse into €49; it must show 'Not validated yet'
    expect(screen.getByText(/Not validated yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/€0/i)).not.toBeInTheDocument();
  });

  it('5. Highlights price floor violation with alert warning', () => {
    render(
      <PricingStrategyView
        ideaId="idea-123"
        projectName="Analytics SaaS"
        strategy={mockStrategy}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateOffer={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Price below floor! Loss-making under current cost structure/i)
    ).toBeInTheDocument();
  });

  it('6. Renders stale notification banner when updateAvailable is true and triggers onRefresh', () => {
    const handleRefresh = vi.fn().mockResolvedValue(undefined);
    render(
      <PricingStrategyView
        ideaId="idea-123"
        projectName="Analytics SaaS"
        strategy={mockStrategy}
        updateAvailable={true}
        changedSources={['Business Model Canvas (Phase 3.2)', 'Financial Forecast (Phase 3.4)']}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={handleRefresh}
        onUpdateOffer={vi.fn()}
      />
    );

    expect(screen.getByText(/Upstream Milestone Updates Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Business Model Canvas \(Phase 3\.2\)/i)).toBeInTheDocument();

    const refreshBtns = screen.getAllByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshBtns[0]);
    expect(handleRefresh).toHaveBeenCalled();
  });

  it('7. Enforces strict Phase 4.7 Boundary Banner (disabled button, lock icon)', () => {
    render(
      <PricingStrategyView
        ideaId="idea-123"
        projectName="Analytics SaaS"
        strategy={mockStrategy}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateOffer={vi.fn()}
      />
    );

    expect(screen.getByText(/PHASE 4.7 · GTM & LAUNCH STRATEGY/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready to Sequence Your Go-To-Market Strategy\?/i)).toBeInTheDocument();
    const gtmLink = screen.getByRole('link', { name: /Build My Launch Strategy/i });
    expect(gtmLink).toBeInTheDocument();
    expect(gtmLink).toHaveAttribute('href', '/dashboard/creator/phase-4/gtm?ideaId=idea-123');
  });

  it('8. Opens founder edit modal and submits update to recalculate economics', async () => {
    const handleUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <PricingStrategyView
        ideaId="idea-123"
        projectName="Analytics SaaS"
        strategy={mockStrategy}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateOffer={handleUpdate}
      />
    );

    const customizeBtns = screen.getAllByRole('button', { name: /Customize Offer/i });
    fireEvent.click(customizeBtns[0]); // Click first offer

    expect(screen.getByText(/Customize Offer: Starter Tier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Founder Selected Price/i)).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Save & Recalculate/i });
    fireEvent.submit(saveBtn.closest('form')!);

    await waitFor(() => {
      expect(handleUpdate).toHaveBeenCalledWith('offer-starter', expect.any(Object));
    });
  });

  it('9. Displays empirical experiments and financial risks cards', () => {
    render(
      <PricingStrategyView
        ideaId="idea-123"
        projectName="Analytics SaaS"
        strategy={mockStrategy}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateOffer={vi.fn()}
      />
    );

    expect(screen.getAllByText(/Empirical Validation Experiments/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Financial Integrity & Risk Guardrails/i)).toBeInTheDocument();
    expect(screen.getByText(/PriceFloorViolation/i)).toBeInTheDocument();
    expect(screen.getByText(/15% Free-to-paid conversion/i)).toBeInTheDocument();
  });
});
