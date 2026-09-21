import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NeedsAnalysisView } from '@/components/creator/phase4/NeedsAnalysisView';
import type { NeedsAnalysis, CreatorNeed } from '@/types/creator/needs';

const mockActiveNeeds: CreatorNeed[] = [
  {
    id: 'need-1',
    key: 'team.software-dev',
    category: 'Team',
    title: 'Web / Software Development Capability',
    description: 'Engineering lead required for platform development',
    whyNeeded: 'No technical founder declared in HumainX profile',
    priority: 'Critical',
    timing: 'Now',
    requirementType: 'Capability',
    systemStatus: 'Identified',
    founderState: 'Unreviewed',
    fulfillmentMode: 'Unassigned',
    blocking: true,
    source: ['Construction Snapshot', 'HumainX Profile'],
    sourceReference: [],
    relatedSnapshotItemKeys: ['skills.software-dev'],
    relatedRoadmapTaskKeys: [],
    founderEdited: false,
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
  },
  {
    id: 'need-2',
    key: 'finance.launch-capital',
    category: 'Finance',
    title: 'Launch Capital & Operating Reserve',
    description: 'Secure initial financing before break-even',
    whyNeeded: 'Forecast models pre-launch cash flow deficit',
    priority: 'Critical',
    timing: 'Now',
    requirementType: 'Capital',
    estimatedBudget: 45000,
    budgetConfidence: 'DerivedFromForecast',
    systemStatus: 'Identified',
    founderState: 'Unreviewed',
    fulfillmentMode: 'Unassigned',
    blocking: true,
    source: ['Financial Forecast'],
    sourceReference: [],
    relatedSnapshotItemKeys: [],
    relatedRoadmapTaskKeys: [],
    founderEdited: false,
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
  },
  {
    id: 'need-3',
    key: 'service.chartered-accountant',
    category: 'Services',
    title: 'Chartered Accounting & Financial Supervision',
    description: 'Expert-comptable for statutory corporate books',
    whyNeeded: 'Mandatory statutory requirement under French commercial code',
    priority: 'High',
    timing: 'Next30Days',
    requirementType: 'Service',
    systemStatus: 'Identified',
    founderState: 'Unreviewed',
    fulfillmentMode: 'Unassigned',
    blocking: false,
    source: ['Legal Assessment'],
    sourceReference: [],
    relatedSnapshotItemKeys: [],
    relatedRoadmapTaskKeys: [],
    founderEdited: false,
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
  },
];

const mockCoveredRequirements: CreatorNeed[] = [
  {
    id: 'need-covered-1',
    key: 'team.product-design',
    category: 'Team',
    title: 'Product Design & UI/UX',
    description: 'Product design experience',
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
    founderEdited: false,
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
  },
];

const mockAnalysis: NeedsAnalysis = {
  status: 'Completed',
  generatedAt: '2026-09-21T00:00:00Z',
  updatedAt: '2026-09-21T00:00:00Z',
  summary: '3 active operational requirements identified.',
  activeNeeds: mockActiveNeeds,
  coveredRequirements: mockCoveredRequirements,
  sourceVersions: {
    businessModelVersion: 1,
    forecastVersion: 1,
  },
};

describe('NeedsAnalysisView', () => {
  it('renders empty state when analysis is null and triggers onGenerate', () => {
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
      />
    );

    expect(screen.getByText('Your project needs have not been analyzed yet.')).toBeInTheDocument();
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
      />
    );

    expect(screen.getByText(/analyzing requirements & capabilities…/i)).toBeInTheDocument();
  });

  it('renders gate prerequisite error state when snapshot refresh is required', () => {
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
          code: 'SNAPSHOT_REFRESH_REQUIRED',
          message: 'Construction snapshot is stale. Please refresh.',
        }}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
      />
    );

    expect(screen.getByText(/construction snapshot refresh required/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /refresh snapshot/i })).toHaveAttribute(
      'href',
      '/dashboard/creator/phase-4/snapshot?ideaId=idea-1'
    );
  });

  it('renders hero metric pills with counts and NO percentage', () => {
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={3}
        criticalCount={2}
        highCount={1}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
      />
    );

    expect(screen.getByText('2 Critical')).toBeInTheDocument();
    expect(screen.getByText('1 High Priority')).toBeInTheDocument();
    expect(screen.getByText('3 Active Needs')).toBeInTheDocument();
    expect(screen.getByText('1 Already Covered')).toBeInTheDocument();
    // No percentage sign in hero
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('renders active needs with title, why needed, budget, and timing', () => {
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={3}
        criticalCount={2}
        highCount={1}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
      />
    );

    expect(screen.getByText('Web / Software Development Capability')).toBeInTheDocument();
    expect(screen.getByText(/no technical founder declared in humainx profile/i)).toBeInTheDocument();
    expect(screen.getByText('Launch Capital & Operating Reserve')).toBeInTheDocument();
    expect(screen.getByText('€45,000')).toBeInTheDocument();
  });

  it('allows expanding collapsible Already Covered section', () => {
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={3}
        criticalCount={2}
        highCount={1}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
      />
    );

    expect(screen.queryByText('Product Design & UI/UX')).toBeNull();
    const coveredToggle = screen.getByRole('button', { name: /already covered capabilities/i });
    fireEvent.click(coveredToggle);
    expect(screen.getByText('Product Design & UI/UX')).toBeInTheDocument();
  });

  it('calls onUpdateNeedState when founder updates state', () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={3}
        criticalCount={2}
        highCount={1}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={onUpdate}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Confirmed' } });
    expect(onUpdate).toHaveBeenCalledWith('team.software-dev', { founderState: 'Confirmed' });
  });

  it('renders upstream stale warning banner when updateAvailable is true', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={true}
        changedSources={['ConstructionSnapshot', 'OperationalRoadmap']}
        totalActiveNeeds={3}
        criticalCount={2}
        highCount={1}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={onRefresh}
        onUpdateNeedState={vi.fn()}
      />
    );

    expect(screen.getByText(/upstream changes detected/i)).toBeInTheDocument();
    expect(screen.getByText(/constructionsnapshot, operationalroadmap/i)).toBeInTheDocument();
    const refreshBtn = screen.getByRole('button', { name: /refresh needs/i });
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('locks Phase 4.4 boundary with disabled Coming Next CTA', () => {
    render(
      <NeedsAnalysisView
        ideaId="idea-1"
        projectName="SaaS Pro"
        analysis={mockAnalysis}
        updateAvailable={false}
        changedSources={[]}
        totalActiveNeeds={3}
        criticalCount={2}
        highCount={1}
        satisfiedCount={1}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateNeedState={vi.fn()}
      />
    );

    const nextCta = screen.getByRole('link', { name: /build my skills plan/i });
    expect(nextCta).toHaveAttribute('href', expect.stringContaining('/dashboard/creator/phase-4/skills'));
    expect(screen.getByText('Next Step in MBC Journey')).toBeInTheDocument();
  });
});
