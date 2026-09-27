import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GtmStrategyView } from '@/components/creator/phase4/GtmStrategyView';
import type { GtmStrategy } from '@/types/creator/gtm';

const mockStrategy: GtmStrategy = {
  generatedAt: '2026-09-21T10:00:00Z',
  updatedAt: '2026-09-21T10:00:00Z',
  status: 'Active',
  overallMotion: 'Start with customer conversations',
  primarySegment: {
    segmentName: 'Independent service businesses',
    isPrimary: true,
    rationale: 'High immediate operational bottleneck in managing customer enquiries.',
    problem: 'Independent service businesses in France that manage enquiries and quotations manually.',
    primaryMessage: 'Keep customer enquiries, quotations, and follow-ups in one place.',
    offerKey: 'pricing.starter',
    offerName: 'Starter Tier',
    selectedPrice: 15,
    revenueModel: 'Subscription',
    buyingComplexity: 'Business owner',
    estimatedSalesCycle: '1-3 weeks',
    relevanceScore: 92,
  },
  secondarySegments: [],
  channelStrategy: [
    {
      key: 'gtm.channel.direct-outreach',
      channel: 'ColdOutreach',
      channelName: 'Direct outreach',
      category: 'Direct Outbound',
      priority: 'Primary',
      recommendedPriority: 'Primary',
      effortLevel: 'High',
      estimatedWeeklyHours: 4,
      capacityScore: 4,
      setupCostEstimate: 0,
      monthlySpendEstimate: 0,
      reasonCodes: ['FOUNDER_CAPABILITY_MATCH', 'SALES_MOTION_MATCH', 'SEGMENT_REACHABLE'],
      rationale: 'It supports direct conversations about the workflow your product will address.',
      whyNow: 'Identify relevant businesses and invite them to discuss how they manage enquiries and quotations.',
      evidenceGrounded: 'Which businesses fit, how to reach them, and the time required.',
      firstStep: 'Prepare a relevant contact shortlist and adapt your introduction.',
      founderEdited: false,
      founderNotes: null,
    },
    {
      key: 'gtm.channel.inbound-content',
      channel: 'InboundContent',
      channelName: 'Inbound content',
      category: 'Inbound',
      priority: 'Secondary',
      recommendedPriority: 'Secondary',
      effortLevel: 'Medium',
      estimatedWeeklyHours: 2,
      capacityScore: 2,
      setupCostEstimate: 0,
      monthlySpendEstimate: 0,
      reasonCodes: ['BUDGET_COMPATIBLE', 'FOUNDER_CAPABILITY_MATCH'],
      rationale: 'Builds authority in modern service operations.',
      whyNow: 'Complements direct conversations by sharing lessons learned.',
      evidenceGrounded: 'Zero cash requirement fits bootstrapped stage.',
      firstStep: 'Publish 2 breakdowns per week of common quotation pitfalls.',
      founderEdited: false,
      founderNotes: null,
    },
  ],
  founderExecutionPlan: {
    weeklyHoursAvailable: 4,
    weeklyHoursAllocated: 4,
    remainingWeeklyHours: 0,
    capacityBand: 'PartTimeFocused',
    isOverloaded: false,
    overloadMitigationNotice: null,
    channelEffortPoints: {
      DirectOutreach: 4,
    },
  },
  delegationPlan: [],
  funnelStrategy: ['Awareness', 'Discovery', 'Pilot', 'Conversion', 'Activation'],
  launchPlan: {
    primaryLaunchMonth: 'Month 1',
    estimatedPreparationWeeks: 4,
    phases: [
      {
        phaseNumber: 1,
        phaseName: 'Customer Discovery Conversations',
        objective: 'Conduct 15 customer discovery calls.',
        timeframe: 'Weeks 1-4',
        keyMilestones: ['Shortlist 20 contacts', 'Conduct 15 discovery calls'],
        exitCriteria: ['3 signed pilot commitments'],
        contingencyTrigger: 'Zero replies after 10 calls',
        fallbackAction: 'Adjust value proposition framing',
      },
    ],
  },
  experiments: [
    {
      key: 'gtm.experiment.willingness-to-pay-validation',
      hypothesis: 'Independent service businesses will agree to exploratory discovery conversations.',
      segment: 'Independent service businesses',
      channel: 'ColdOutreach',
      offer: 'pricing.starter',
      messageAngle: 'Keep customer enquiries, quotations, and follow-ups in one place.',
      budgetCap: 0,
      timebox: '3 weeks',
      primaryMetric: 'Businesses contacted',
      targetValue: 50,
      targetStatus: 'NeedsBaseline',
      successCondition: 'Secure 10 discovery call replies.',
      stopCondition: 'Zero interest after 20 contacts.',
      evidenceRequired: 'Call notes and workflow feedback.',
      status: 'Draft',
      runs: [],
    },
  ],
  metricsFramework: [
    {
      key: 'metric.awareness.reach',
      name: 'Businesses contacted',
      funnelStage: 'Awareness',
      definition: 'Unique prospects contacted.',
      numerator: 'Count of prospects contacted',
      denominator: 'Total target list',
      dataSource: 'Outreach Log',
      baseline: '0',
      target: '50',
      targetStatus: 'NeedsBaseline',
      measurementFrequency: 'Weekly',
    },
  ],
  budgetPlan: {
    currency: 'EUR',
    totalAvailableBudget: null,
    forecastCacAssumption: null,
    observedCac: null,
    validatedCac: null,
    budgetSource: 'Unknown',
    spendableStatus: 'Unknown',
    validationStatus: 'NeedsValidation',
    provenanceExplanation: 'No budget confirmed yet. Not assumed as €0.',
  },
  risks: ['Longer sales cycles than anticipated.'],
  assumptions: ['Service businesses handle quotations manually.'],
  sourceVersions: {
    marketStudyVersion: 1,
    businessModelVersion: 1,
    forecastVersion: 1,
    roadmapVersion: 1,
    consumedWeeklyAvailability: '4 hours/week',
    supportPlanConsumed: false,
  },
  founderOverrides: {},
  pricingValidationRequired: false,
  capacityWarningActive: false,
};

describe('GtmStrategyView Component — Figma 57221:12464 Canon', () => {
  it('1. Renders prerequisite gate blocker when gateError is present', () => {
    render(
      <GtmStrategyView
        ideaId="test-idea"
        projectName="Test Venture"
        strategy={null}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        gateError={{
          code: 'PREREQUISITE_GATE_FAILED',
          message: 'PricingStrategy is required before GTM.',
        }}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateChannel={vi.fn()}
        onRecordExperimentRun={vi.fn()}
      />
    );

    expect(screen.getByText(/PREREQUISITE GATE ACTIVE/i)).toBeInTheDocument();
    expect(screen.getByText(/Phase 4.6 Pricing Strategy Required First/i)).toBeInTheDocument();
    expect(screen.getByText(/PricingStrategy is required before GTM/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Complete Step 4.6 Pricing Strategy/i })
    ).toBeInTheDocument();
  });

  it('2. Renders ungenerated state with generate button when strategy is null and no gate error', () => {
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

    expect(
      screen.getByText(/Convert Pricing & Market Intelligence into a Sequenced Launch/i)
    ).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Build My Launch Strategy/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleGenerate).toHaveBeenCalledTimes(1);
  });

  it('3. Renders complete Figma 57221:12464 GTM strategy dashboard with 10 canonical sections', () => {
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

    // Header & Section 1: Summary Card
    expect(screen.getByText(/PHASE 4 · STEP 4.7/i)).toBeInTheDocument();
    expect(screen.getByText(/YOUR LAUNCH PLAN/i)).toBeInTheDocument();
    expect(screen.getByText(/Start with customer conversations/i)).toBeInTheDocument();
    expect(screen.getByText(/Project: Test Venture/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Independent service businesses/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Direct outreach/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Needs validation/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Next launch action: Prepare customer conversations/i)
    ).toBeInTheDocument();

    // Section 2: Your First Customers
    expect(screen.getByText(/Your first customers/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adjust customer group/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Suggested/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Likely decision-maker:/i)).toBeInTheDocument();
    expect(screen.getByText(/Why this group\?/i)).toBeInTheDocument();

    // Section 3: What You'll Say
    expect(screen.getByText(/What you’ll say/i)).toBeInTheDocument();
    expect(screen.getByText(/POSITIONING/i)).toBeInTheDocument();
    expect(screen.getByText(/INITIAL OUTREACH MESSAGE DRAFT/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy message/i })).toBeInTheDocument();

    // Section 4: How Customers Will Buy
    expect(screen.getByText(/How customers will buy/i)).toBeInTheDocument();
    expect(screen.getByText(/Talk first, demonstrate when ready/i)).toBeInTheDocument();
    expect(screen.getByText(/WHO DECIDES\?/i)).toBeInTheDocument();
    expect(screen.getByText(/WHAT NEEDS EXPLAINING\?/i)).toBeInTheDocument();
    expect(screen.getByText(/WHAT COULD BUILD TRUST\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Now: Customer conversations/i)).toBeInTheDocument();
    expect(screen.getByText(/Later: Product demo/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Review pricing/i })).toBeInTheDocument();

    // Section 5: Where To Reach Them
    expect(screen.getByText(/Where to reach them/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Change channel/i })).toBeInTheDocument();
    expect(screen.getByText(/Primary focus/i)).toBeInTheDocument();
    expect(screen.getByText(/WHY START HERE\?/i)).toBeInTheDocument();
    expect(screen.getByText(/WHAT YOU’LL DO/i)).toBeInTheDocument();
    expect(screen.getByText(/WHAT NEEDS CHECKING/i)).toBeInTheDocument();

    // Section 6: What You Can Commit
    expect(screen.getByText(/What you can commit/i)).toBeInTheDocument();
    expect(screen.getByText(/PROJECT TIME/i)).toBeInTheDocument();
    expect(screen.getByText(/MARKETING BUDGET/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Review available time/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Set budget/i })).toBeInTheDocument();

    // Section 7: Your Launch Actions
    expect(screen.getByText(/Your launch actions/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Prepare customer conversations/i).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Show a working demo/i)).toBeInTheDocument();
    expect(screen.getByText(/Review your launch website/i)).toBeInTheDocument();
    expect(screen.getByText(/Review your launch results/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Review roadmap task/i })).toBeInTheDocument();

    // Section 8: What To Track
    expect(screen.getByText(/What to track/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Businesses contacted/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Replies received/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Demo requests/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Purchases/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Set targets/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Record results/i })).toBeInTheDocument();

    // Section 9: Next Step Preview
    expect(screen.getByText(/Your plan will guide your launch assets/i)).toBeInTheDocument();
    expect(screen.getByText(/Proposed CTA:/i)).toBeInTheDocument();

    // Section 10: Journey Footer
    expect(screen.getByRole('link', { name: /Back to Pricing/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Activate plan & continue/i })
    ).toBeInTheDocument();
  });

  it('4. Shows staleness banner with changed sources when updateAvailable is true', () => {
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

    expect(screen.getByText(/Update available:/i)).toBeInTheDocument();
    expect(screen.getByText(/Pricing & Revenue Model \(Phase 4.6\)/i)).toBeInTheDocument();

    const refreshBtn = screen.getByRole('button', { name: /Refresh Launch Plan/i });
    fireEvent.click(refreshBtn);
    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });

  it('5. Allows founder to change channel in modal', async () => {
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

    const changeBtn = screen.getByRole('button', { name: /Change channel/i });
    fireEvent.click(changeBtn);

    expect(screen.getByText(/Select Starting Outreach Channel/i)).toBeInTheDocument();

    const setPrimaryBtns = screen.getAllByRole('button', { name: /Set as Primary/i });
    fireEvent.click(setPrimaryBtns[0]);

    await waitFor(() => {
      expect(handleUpdateChannel).toHaveBeenCalledTimes(1);
      expect(handleUpdateChannel).toHaveBeenCalledWith(
        'gtm.channel.direct-outreach',
        expect.objectContaining({
          ideaId: 'test-idea',
          priority: 'Primary',
        })
      );
    });
  });

  it('6. Allows recording launch results in modal', async () => {
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

    const recordBtn = screen.getByRole('button', { name: /Record results/i });
    fireEvent.click(recordBtn);

    expect(screen.getByText(/Record Launch Outreach Activity/i)).toBeInTheDocument();

    const obsTextarea = screen.getByPlaceholderText(/Contacted 10 local electricians/i);
    fireEvent.change(obsTextarea, {
      target: { value: 'Contacted 10 businesses, 3 replied positively.' },
    });

    const saveBtn = screen.getByRole('button', { name: /Save Results/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleRecordRun).toHaveBeenCalledTimes(1);
      expect(handleRecordRun).toHaveBeenCalledWith(
        'gtm.experiment.willingness-to-pay-validation',
        expect.objectContaining({
          ideaId: 'test-idea',
          observations: 'Contacted 10 businesses, 3 replied positively.',
          outcome: 'Validated',
        })
      );
    });
  });

  it('7. Allows founder to edit outreach message in modal and calls onUpdateStrategy', async () => {
    const handleUpdateStrategy = vi.fn().mockResolvedValue(undefined);
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
        onUpdateStrategy={handleUpdateStrategy}
        onRecordExperimentRun={vi.fn()}
      />
    );

    const editMsgBtn = screen.getByRole('button', { name: /Edit message/i });
    fireEvent.click(editMsgBtn);

    expect(screen.getByText(/Edit Initial Outreach Message/i)).toBeInTheDocument();

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, {
      target: { value: '“Customized outreach message for early feedback.”' },
    });

    const saveBtn = screen.getByRole('button', { name: /Save Message/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleUpdateStrategy).toHaveBeenCalledTimes(1);
      expect(handleUpdateStrategy).toHaveBeenCalledWith({
        customOutreachMessage: '“Customized outreach message for early feedback.”',
      });
    });
  });

  it('8. Allows founder to adjust customer group in modal and calls onUpdateStrategy', async () => {
    const handleUpdateStrategy = vi.fn().mockResolvedValue(undefined);
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
        onUpdateStrategy={handleUpdateStrategy}
        onRecordExperimentRun={vi.fn()}
      />
    );

    const adjustBtn = screen.getByRole('button', { name: /Adjust customer group/i });
    fireEvent.click(adjustBtn);

    expect(screen.getByText(/Adjust Target Customer Group/i)).toBeInTheDocument();

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, {
      target: { value: 'B2B boutique consulting agencies in Paris' },
    });

    const saveBtn = screen.getByRole('button', { name: /Save Customer Group/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleUpdateStrategy).toHaveBeenCalledTimes(1);
      expect(handleUpdateStrategy).toHaveBeenCalledWith({
        customCustomerGroup: 'B2B boutique consulting agencies in Paris',
      });
    });
  });

  it('9. Allows founder to set budget and time in modal and calls onUpdateStrategy', async () => {
    const handleUpdateStrategy = vi.fn().mockResolvedValue(undefined);
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
        onUpdateStrategy={handleUpdateStrategy}
        onRecordExperimentRun={vi.fn()}
      />
    );

    const setBudgetBtn = screen.getByRole('button', { name: /Set budget/i });
    fireEvent.click(setBudgetBtn);

    expect(screen.getByText(/Set Time & Marketing Budget/i)).toBeInTheDocument();

    const inputs = screen.getAllByRole('spinbutton');
    // inputs[0] is timeInput, inputs[1] is budgetInput
    fireEvent.change(inputs[0], { target: { value: '6' } });
    fireEvent.change(inputs[1], { target: { value: '500' } });

    const saveBtn = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleUpdateStrategy).toHaveBeenCalledTimes(1);
      expect(handleUpdateStrategy).toHaveBeenCalledWith({
        weeklyHoursAvailable: 6,
        spendableBudget: 500,
      });
    });
  });

  it('10. Allows founder to set tracking targets in modal and calls onUpdateStrategy', async () => {
    const handleUpdateStrategy = vi.fn().mockResolvedValue(undefined);
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
        onUpdateStrategy={handleUpdateStrategy}
        onRecordExperimentRun={vi.fn()}
      />
    );

    const setTargetsBtn = screen.getByRole('button', { name: /Set targets/i });
    fireEvent.click(setTargetsBtn);

    expect(screen.getByText(/Set Launch Tracking Targets/i)).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Save Targets/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleUpdateStrategy).toHaveBeenCalledTimes(1);
      expect(handleUpdateStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          targetContacted: 50,
          targetReplies: 10,
          targetDemos: 5,
          targetPurchases: 2,
        })
      );
    });
  });

  it('11. Activates plan and triggers strategy update on footer action', async () => {
    const handleUpdateStrategy = vi.fn().mockResolvedValue(undefined);
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
        onUpdateStrategy={handleUpdateStrategy}
        onRecordExperimentRun={vi.fn()}
      />
    );

    const activateBtn = screen.getByRole('button', { name: /Activate plan & continue/i });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(handleUpdateStrategy).toHaveBeenCalledTimes(1);
      expect(handleUpdateStrategy).toHaveBeenCalledWith({
        status: 'Active',
      });
    });
  });
});
