import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NeedsAnalysisView } from '@/components/creator/phase4/NeedsAnalysisView';
import type { NeedsAnalysis, CreatorNeed } from '@/types/creator/needs';

const mockActiveNeeds: CreatorNeed[] = [
  {
    id: 'need-1',
    key: 'team.software-dev',
    category: 'Skills',
    title: 'Technical delivery capability',
    description: 'The capability to build and maintain the initial digital product.',
    whyNeeded: 'The business model depends on a working product for enquiries and transactions.',
    priority: 'Critical',
    timing: 'Now',
    requirementType: 'Capability',
    systemStatus: 'Identified',
    founderState: 'Unreviewed',
    fulfillmentMode: 'Unassigned',
    blocking: true,
    source: ['Construction Snapshot', 'HumainX Profile', 'Operational Roadmap'],
    sourceReference: [],
    relatedSnapshotItemKeys: ['skills.software-dev'],
    relatedRoadmapTaskKeys: ['task.prepare-tech-brief', 'task.confirm-tech-support'],
    whatIsNeeded: 'The capability to build and maintain the initial digital product.',
    whyThisApplies: 'The business model depends on a working product for enquiries and transactions.',
    whatYouAlreadyHave: 'Your profile lists beginner-level digital skills.',
    whatIsStillMissing: 'Dedicated software engineering talent.',
    whatWouldSatisfy: 'Assigning a qualified founding team member or engaging an accredited technical partner.',
    founderInformation: '',
    founderEdited: false,
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
  },
  {
    id: 'need-2',
    key: 'finance.launch-capital',
    category: 'Finance',
    title: 'Launch Capital & Operating Reserve',
    description: 'Secure initial financing before break-even.',
    whyNeeded: 'Forecast models pre-launch cash flow deficit.',
    priority: 'Critical',
    timing: 'Now',
    requirementType: 'Capital',
    estimatedBudget: 45000,
    budgetConfidence: 'DerivedFromForecast',
    systemStatus: 'Identified',
    founderState: 'Confirmed',
    fulfillmentMode: 'Unassigned',
    blocking: true,
    source: ['Financial Forecast'],
    sourceReference: [],
    relatedSnapshotItemKeys: [],
    relatedRoadmapTaskKeys: [],
    whatIsNeeded: 'Initial launch capital of approximately €45,000.',
    whyThisApplies: 'Forecast models pre-launch cash flow deficit.',
    whatYouAlreadyHave: 'Financial forecast model.',
    whatIsStillMissing: 'Confirmed funding agreements.',
    whatWouldSatisfy: 'Verified deposit or signed loan/grant contract.',
    founderInformation: 'Self-funding €15k, applying for Bpifrance grant.',
    founderEdited: true,
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
  },
];

const mockCoveredRequirements: CreatorNeed[] = [
  {
    id: 'need-covered-1',
    key: 'team.product-design',
    category: 'Brand',
    title: 'Brand Guidelines & Identity Design',
    description: 'Product brand and visual identity.',
    whyNeeded: 'Covered by your declared profile capability.',
    priority: 'High',
    timing: 'Now',
    requirementType: 'Capability',
    systemStatus: 'Satisfied',
    founderState: 'ClaimedSatisfied',
    fulfillmentMode: 'Unassigned',
    blocking: false,
    source: ['HumainX Profile'],
    sourceReference: [],
    relatedSnapshotItemKeys: [],
    relatedRoadmapTaskKeys: [],
    whatIsNeeded: 'Brand lockup and identity guidelines.',
    whyThisApplies: 'Core commercial asset.',
    whatYouAlreadyHave: 'Design skills verified in HumainX profile.',
    whatIsStillMissing: 'None; ready for execution.',
    whatWouldSatisfy: 'Verified portfolio or brand kit assets.',
    founderInformation: '',
    founderEdited: false,
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
  },
];

const mockAnalysis: NeedsAnalysis = {
  status: 'Completed',
  generatedAt: '2026-09-21T00:00:00Z',
  updatedAt: '2026-09-21T00:00:00Z',
  summary: '3 requirements identified across 3 categories.',
  activeNeeds: mockActiveNeeds,
  coveredRequirements: mockCoveredRequirements,
  sourceVersions: {
    businessModelVersion: 1,
    forecastVersion: 1,
  },
};

describe('NeedsAnalysisView', () => {
  it('renders ungenerated state and triggers onGenerate', () => {
    const onGenerate = vi.fn().mockResolvedValue(undefined);
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={null}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={0}
        criticalCount={0}
        highCount={0}
        satisfiedCount={0}
        isLoading={false}
        onGenerate={onGenerate}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText('Analyze Needs & Requirements')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /generate needs analysis/i });
    fireEvent.click(btn);
    expect(onGenerate).toHaveBeenCalled();
  });

  it('renders loading state when isLoading is true and no analysis exists', () => {
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={null}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={0}
        criticalCount={0}
        highCount={0}
        satisfiedCount={0}
        isLoading={true}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText(/loading your needs & requirements analysis/i)).toBeInTheDocument();
  });

  it('renders gate prerequisite error state when gateError is present', () => {
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={null}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={0}
        criticalCount={0}
        highCount={0}
        satisfiedCount={0}
        isLoading={false}
        gateError={{
          code: 'ROADMAP_MISSING',
          message: 'Operational Roadmap must be generated first.',
        }}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText('Phase 4 Requirements Check')).toBeInTheDocument();
    expect(screen.getByText('Operational Roadmap must be generated first.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to operational roadmap/i })).toHaveAttribute(
      'href',
      '/dashboard/creator/phase-4/roadmap?ideaId=idea-1'
    );
  });

  it('renders compact horizontal summary surface with counts and copy', () => {
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={2}
        criticalCount={2}
        highCount={0}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    // 3 total requirements (2 active + 1 covered)
    expect(screen.getByText('3 Requirements')).toBeInTheDocument();
    expect(screen.getByText('1 Satisfied')).toBeInTheDocument();
    expect(screen.getByText('2 Identified')).toBeInTheDocument();
    expect(screen.getByText(/confirming a need records your decision/i)).toBeInTheDocument();
    expect(screen.getByText(/1 need is awaiting your review/i)).toBeInTheDocument();
  });

  it('renders unified requirement rows with category labels and priority', () => {
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={2}
        criticalCount={2}
        highCount={0}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText('Technical delivery capability')).toBeInTheDocument();
    expect(screen.getByText('Launch Capital & Operating Reserve')).toBeInTheDocument();
    expect(screen.getByText('Brand Guidelines & Identity Design')).toBeInTheDocument();

    expect(screen.getByText('SKILLS')).toBeInTheDocument();
    expect(screen.getByText('FINANCE')).toBeInTheDocument();
    expect(screen.getByText('BRAND')).toBeInTheDocument();
  });

  it('handles Confirm need inline action without toggling accordion', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={2}
        criticalCount={2}
        highCount={0}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={onUpdate}
        onKeepCurrent={vi.fn()}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /confirm need/i });
    fireEvent.click(confirmBtn);

    expect(onUpdate).toHaveBeenCalledWith('team.software-dev', { founderState: 'Confirmed' });
  });

  it('handles Defer for now inline action', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={2}
        criticalCount={2}
        highCount={0}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={onUpdate}
        onKeepCurrent={vi.fn()}
      />
    );

    const deferBtn = screen.getAllByRole('button', { name: /defer for now/i })[0];
    fireEvent.click(deferBtn);

    expect(onUpdate).toHaveBeenCalledWith('team.software-dev', { founderState: 'Deferred' });
  });

  it('renders 2-column analytical breakdown when expanded', () => {
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={2}
        criticalCount={2}
        highCount={0}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    // The first item (team.software-dev) is expanded by default
    expect(screen.getByText('WHAT IS NEEDED')).toBeInTheDocument();
    expect(screen.getByText('WHY THIS APPLIES')).toBeInTheDocument();
    expect(screen.getByText('WHAT YOU ALREADY HAVE')).toBeInTheDocument();
    expect(screen.getByText('WHAT IS STILL MISSING')).toBeInTheDocument();
    expect(screen.getByText('WHAT WOULD SATISFY THIS NEED')).toBeInTheDocument();
    expect(screen.getByText('CONNECTED WORK')).toBeInTheDocument();
    expect(screen.getByText('BUILT FROM:')).toBeInTheDocument();
  });

  it('submits founder information via Add what I have', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={2}
        criticalCount={2}
        highCount={0}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={onUpdate}
        onKeepCurrent={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/e\.g\. Contracted software agency/i);
    fireEvent.change(textarea, { target: { value: 'Contract signed with WebStudio agency.' } });

    const addBtn = screen.getByRole('button', { name: /add what i have/i });
    fireEvent.click(addBtn);

    expect(onUpdate).toHaveBeenCalledWith('team.software-dev', {
      founderInformation: 'Contract signed with WebStudio agency.',
    });
  });

  it('renders warm update available notice and calls onKeepCurrent', async () => {
    const onKeepCurrent = vi.fn().mockResolvedValue(undefined);
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={true}
        changedSources={['Operational Roadmap', 'HumainX Profile']}
        totalActiveNeeds={2}
        criticalCount={2}
        highCount={0}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
        onKeepCurrent={onKeepCurrent}
      />
    );

    expect(screen.getByText(/update available:/i)).toBeInTheDocument();
    expect(screen.getByText(/operational roadmap, humainx profile/i)).toBeInTheDocument();

    const keepBtn = screen.getByRole('button', { name: /keep current version/i });
    fireEvent.click(keepBtn);

    expect(onKeepCurrent).toHaveBeenCalled();
  });

  it('renders footer navigation to Roadmap and Skills', () => {
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={2}
        criticalCount={2}
        highCount={0}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByRole('link', { name: /back to roadmap/i })).toHaveAttribute(
      'href',
      '/dashboard/creator/phase-4/roadmap?ideaId=idea-1'
    );
    expect(screen.getByRole('link', { name: /continue to skills & training/i })).toHaveAttribute(
      'href',
      '/dashboard/creator/phase-4/skills?ideaId=idea-1'
    );
  });
});
