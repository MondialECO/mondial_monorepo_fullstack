import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GtmStrategyView } from '@/components/creator/phase4/GtmStrategyView';
import type { GtmStrategy } from '@/types/creator/gtm';

const mockStrategy: GtmStrategy = {
  generatedAt: '2026-09-21T10:00:00Z',
  updatedAt: '2026-09-21T10:00:00Z',
  status: 'Active',
  overallMotion: 'ConsultativePilot',
  primarySegment: {
    segmentName: 'B2B SMBs',
    isPrimary: true,
    rationale: 'High immediate operational bottleneck in financial reconciliation.',
    problem: 'Manual multi-bank reconciliation',
    primaryMessage: 'Eliminate reconciliation bottlenecks in 48 hours.',
    offerKey: 'pricing.starter',
    offerName: 'Starter Tier',
    selectedPrice: 99,
    revenueModel: 'Subscription',
    buyingComplexity: 'Medium',
    estimatedSalesCycle: '2-4 weeks',
    relevanceScore: 92
  },
  secondarySegments: [],
  channelStrategy: [
    {
      key: 'gtm.channel.founder-led-sales',
      channel: 'FounderLedSales',
      channelName: 'Founder-Led Direct Sales',
      category: 'Direct Outbound',
      priority: 'Primary',
      recommendedPriority: 'Primary',
      effortLevel: 'High',
      estimatedWeeklyHours: 6,
      capacityScore: 4,
      setupCostEstimate: 0,
      monthlySpendEstimate: 0,
      reasonCodes: ['FOUNDER_CAPABILITY_MATCH', 'SALES_MOTION_MATCH', 'SEGMENT_REACHABLE'],
      rationale: 'Direct founder outreach is the most reliable way to validate willingness-to-pay.',
      whyNow: 'Initial pilots require founder credibility and rapid customer feedback.',
      evidenceGrounded: 'Matches high consultative sales motion.',
      firstStep: 'Reach out to 15 warm network contacts matching target criteria.',
      founderEdited: false,
      founderNotes: null
    },
    {
      key: 'gtm.channel.organic-social',
      channel: 'OrganicSocial',
      channelName: 'Organic Social & Thought Leadership',
      category: 'Inbound',
      priority: 'Secondary',
      recommendedPriority: 'Secondary',
      effortLevel: 'Medium',
      estimatedWeeklyHours: 3,
      capacityScore: 2,
      setupCostEstimate: 0,
      monthlySpendEstimate: 0,
      reasonCodes: ['BUDGET_COMPATIBLE', 'FOUNDER_CAPABILITY_MATCH'],
      rationale: 'Builds authority in modern financial operations.',
      whyNow: 'Complements direct conversations by sharing lessons learned.',
      evidenceGrounded: 'Zero cash requirement fits bootstrapped stage.',
      firstStep: 'Publish 2 breakdowns per week of common reconciliation pitfalls.',
      founderEdited: false,
      founderNotes: null
    }
  ],
  founderExecutionPlan: {
    weeklyHoursAvailable: 15,
    weeklyHoursAllocated: 9,
    remainingWeeklyHours: 6,
    capacityBand: 'PartTimeFocused',
    isOverloaded: false,
    overloadMitigationNotice: null,
    channelEffortPoints: {
      'FounderLedSales': 4,
      'OrganicSocial': 2
    }
  },
  delegationPlan: [],
  funnelStrategy: ['Awareness', 'Discovery', 'Pilot', 'Conversion', 'Activation'],
  launchPlan: {
    primaryLaunchMonth: 'Month 1',
    estimatedPreparationWeeks: 4,
    phases: [
      {
        phaseNumber: 1,
        phaseName: 'Founder Pilot Validation',
        objective: 'Secure 3 paying pilot customers.',
        timeframe: 'Weeks 1-4',
        keyMilestones: ['Finalize pilot offer deck', 'Conduct 15 discovery calls'],
        exitCriteria: ['3 signed pilot commitments', 'Objection log documented'],
        contingencyTrigger: 'Zero commitments after 10 calls',
        fallbackAction: 'Adjust value proposition framing'
      }
    ]
  },
  experiments: [
    {
      key: 'gtm.experiment.willingness-to-pay-validation',
      hypothesis: 'Target B2B SMBs will commit to an exploratory pilot at €99 when presented with our core solution.',
      segment: 'B2B SMBs',
      channel: 'FounderLedSales',
      offer: 'pricing.starter',
      messageAngle: 'Eliminate reconciliation bottlenecks in 48 hours.',
      budgetCap: 150,
      timebox: '3 weeks',
      primaryMetric: 'Qualified Pilot Commitments',
      targetValue: null,
      targetStatus: 'NeedsBaseline',
      successCondition: 'Secure 3 paid pilot letters of intent.',
      stopCondition: '5 consecutive prospects reject the price floor.',
      evidenceRequired: 'Call notes and qualification scores.',
      status: 'Draft',
      runs: []
    }
  ],
  metricsFramework: [
    {
      key: 'metric.awareness.reach',
      name: 'Qualified Account Reach',
      funnelStage: 'Awareness',
      definition: 'Unique target accounts contacted or engaged.',
      numerator: 'Count of unique ICP prospects contacted',
      denominator: 'Total target list',
      dataSource: 'Outreach Log / CRM',
      baseline: '0',
      target: 'NeedsBaseline',
      targetStatus: 'NeedsBaseline',
      measurementFrequency: 'Weekly'
    }
  ],
  budgetPlan: {
    currency: 'EUR',
    totalAvailableBudget: 1500,
    forecastCacAssumption: 45,
    observedCac: null,
    validatedCac: null,
    budgetSource: 'ForecastAssumption',
    spendableStatus: 'Planned',
    validationStatus: 'Supported',
    provenanceExplanation: 'Forecast assumption from Phase 3.4 Financial Forecast (€1,500 planned).'
  },
  risks: ['Longer sales cycles than anticipated.'],
  assumptions: ['Target SMBs have discretionary authority up to €200/mo.'],
  sourceVersions: {
    marketStudyVersion: 1,
    businessModelVersion: 1,
    forecastVersion: 1,
    roadmapVersion: 1,
    consumedWeeklyAvailability: '10–20 hours/week',
    supportPlanConsumed: false
  },
  founderOverrides: {},
  pricingValidationRequired: false,
  capacityWarningActive: false
};

describe('GtmStrategyView Component', () => {
  it('renders prerequisite gate blocker when gateError is present', () => {
    render(
      <GtmStrategyView
        ideaId="test-idea"
        projectName="Test Venture"
        strategy={null}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        gateError={{ code: 'PREREQUISITE_GATE_FAILED', message: 'PricingStrategy is required before GTM.' }}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateChannel={vi.fn()}
        onRecordExperimentRun={vi.fn()}
      />
    );

    expect(screen.getByText(/PREREQUISITE GATE ACTIVE/i)).toBeInTheDocument();
    expect(screen.getByText(/Phase 4.6 Pricing Strategy Required First/i)).toBeInTheDocument();
    expect(screen.getByText(/PricingStrategy is required before GTM/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Complete Step 4.6 Pricing Strategy/i })).toBeInTheDocument();
  });

  it('renders ungenerated state with generate button when strategy is null and no gate error', () => {
    const handleGenerate = vi.fn();
    render(
      <GtmStrategyView
        ideaId="test-idea"
        projectName="Test Venture"
        strategy={null}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        gateError={null}
        onGenerate={handleGenerate}
        onRefresh={vi.fn()}
        onUpdateChannel={vi.fn()}
        onRecordExperimentRun={vi.fn()}
      />
    );

    expect(screen.getByText(/Convert Pricing & Market Intelligence into a Sequenced Launch/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Generate Go-To-Market Strategy/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleGenerate).toHaveBeenCalledTimes(1);
  });

  it('renders complete GTM strategy dashboard with primary segment, capacity, and channels', () => {
    render(
      <GtmStrategyView
        ideaId="test-idea"
        projectName="Test Venture"
        strategy={mockStrategy}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        gateError={null}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateChannel={vi.fn()}
        onRecordExperimentRun={vi.fn()}
      />
    );

    // Header checks
    expect(screen.getByText(/Test Venture Go-To-Market Strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/ConsultativePilot/i)).toBeInTheDocument();

    // Capacity reconciliation
    expect(screen.getByText(/9h \/ 15h/i)).toBeInTheDocument();
    expect(screen.getByText(/6h buffer/i)).toBeInTheDocument();

    // Budget provenance
    expect(screen.getByText(/€1,500/i)).toBeInTheDocument();
    expect(screen.getByText(/Planned/i)).toBeInTheDocument();
    expect(screen.getByText(/ForecastAssumption/i)).toBeInTheDocument();

    // Primary Segment
    expect(screen.getByText(/Primary Launch Segment & Positioning/i)).toBeInTheDocument();
    expect(screen.getByText(/Eliminate reconciliation bottlenecks in 48 hours/i)).toBeInTheDocument();

    // Channels & deterministic reason codes
    expect(screen.getByText(/Founder-Led Direct Sales/i)).toBeInTheDocument();
    expect(screen.getAllByText(/FOUNDER_CAPABILITY_MATCH/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/SALES_MOTION_MATCH/i)).toBeInTheDocument();

    // Experiments with NeedsBaseline
    expect(screen.getByText(/GTM Validation Experiments/i)).toBeInTheDocument();
    expect(screen.getAllByText(/NeedsBaseline/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Qualified Pilot Commitments/i)).toBeInTheDocument();

    // Strict Phase 4.8 boundary banner
    expect(screen.getByText(/PHASE 4.8 BOUNDARY · COMING NEXT/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Launch Assets \(Phase 4.8 Coming Next\)/i })).toBeDisabled();
  });

  it('shows staleness banner with changed sources when updateAvailable is true', () => {
    const handleRefresh = vi.fn();
    render(
      <GtmStrategyView
        ideaId="test-idea"
        projectName="Test Venture"
        strategy={mockStrategy}
        updateAvailable={true}
        changedSources={['Pricing & Revenue Model (Phase 4.6)']}
        isLoading={false}
        gateError={null}
        onGenerate={vi.fn()}
        onRefresh={handleRefresh}
        onUpdateChannel={vi.fn()}
        onRecordExperimentRun={vi.fn()}
      />
    );

    expect(screen.getByText(/GTM Strategy Has Upstream Dependency Updates/i)).toBeInTheDocument();
    expect(screen.getByText(/Pricing & Revenue Model \(Phase 4.6\)/i)).toBeInTheDocument();

    const refreshBtn = screen.getByRole('button', { name: /Refresh Now/i });
    fireEvent.click(refreshBtn);
    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });

  it('allows founder to adjust channel priority in modal', async () => {
    const handleUpdateChannel = vi.fn().mockResolvedValue(undefined);
    render(
      <GtmStrategyView
        ideaId="test-idea"
        projectName="Test Venture"
        strategy={mockStrategy}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        gateError={null}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateChannel={handleUpdateChannel}
        onRecordExperimentRun={vi.fn()}
      />
    );

    const adjustBtns = screen.getAllByRole('button', { name: /Adjust Priority/i });
    fireEvent.click(adjustBtns[0]);

    expect(screen.getByText(/Select Channel Priority/i)).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Save Override/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleUpdateChannel).toHaveBeenCalledTimes(1);
      expect(handleUpdateChannel).toHaveBeenCalledWith(
        'gtm.channel.founder-led-sales',
        expect.objectContaining({
          ideaId: 'test-idea',
          priority: 'Primary'
        })
      );
    });
  });

  it('allows logging an immutable experiment run with observations', async () => {
    const handleRecordRun = vi.fn().mockResolvedValue(undefined);
    render(
      <GtmStrategyView
        ideaId="test-idea"
        projectName="Test Venture"
        strategy={mockStrategy}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        gateError={null}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateChannel={vi.fn()}
        onRecordExperimentRun={handleRecordRun}
      />
    );

    const logBtn = screen.getByRole('button', { name: /Log Completed Run/i });
    fireEvent.click(logBtn);

    expect(screen.getByText(/Record Historical Evidence/i)).toBeInTheDocument();

    const obsTextarea = screen.getByPlaceholderText(/Record qualitative customer quotes/i);
    fireEvent.change(obsTextarea, { target: { value: 'Customer loved the pilot offer at €99' } });

    const commitBtn = screen.getByRole('button', { name: /Commit Immutable Run/i });
    fireEvent.click(commitBtn);

    await waitFor(() => {
      expect(handleRecordRun).toHaveBeenCalledTimes(1);
      expect(handleRecordRun).toHaveBeenCalledWith(
        'gtm.experiment.willingness-to-pay-validation',
        expect.objectContaining({
          ideaId: 'test-idea',
          observations: 'Customer loved the pilot offer at €99',
          outcome: 'Validated'
        })
      );
    });
  });
});
