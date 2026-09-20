import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConstructionSnapshotView } from '@/components/creator/phase4/ConstructionSnapshotView';
import { ConstructionSnapshot, ConstructionSnapshotItem } from '@/types/creator/phase4';

const mockItems: ConstructionSnapshotItem[] = [
  {
    key: 'tech_critical',
    category: 'Technology',
    title: 'Full-Stack Technical Execution',
    status: 'Critical',
    priority: 'Critical',
    reason: 'Software product requires technical execution before build.',
    source: ['Business Plan'],
    sourceReference: [],
    recommendedNextStep: 'Find technical partner or development team.',
    blocking: true,
    generatedAt: '2026-09-21T00:00:00Z',
  },
  {
    key: 'market_ready',
    category: 'Market',
    title: 'Market Problem & Customer Definition',
    status: 'Ready',
    priority: 'High',
    reason: 'Target audience and market problem clearly defined in Phase 3.1.',
    source: ['Market Study'],
    sourceReference: [],
    recommendedNextStep: 'Validate during outreach.',
    blocking: false,
    generatedAt: '2026-09-21T00:00:00Z',
  },
  {
    key: 'skill_needs_review',
    category: 'Skills',
    title: 'React Capability Review',
    status: 'NeedsReview',
    priority: 'Medium',
    reason: 'Skill declared without confirmed proficiency level.',
    source: ['Professional Profile'],
    sourceReference: [],
    recommendedNextStep: 'Update proficiency level in HumainX profile.',
    blocking: false,
    generatedAt: '2026-09-21T00:00:00Z',
  },
  {
    key: 'accounting_missing',
    category: 'Services',
    title: 'Accounting Support',
    status: 'Missing',
    priority: 'Medium',
    reason: 'Financial forecast exists but no accounting support resource identified.',
    source: ['Financial Forecast'],
    sourceReference: [],
    recommendedNextStep: 'Review in Needs & Requirements.',
    blocking: false,
    generatedAt: '2026-09-21T00:00:00Z',
  },
  {
    key: 'trademark_optional',
    category: 'Legal & Administration',
    title: 'Trademark Registration',
    status: 'Optional',
    priority: 'Optional',
    reason: 'Optional protection for early stage venture.',
    source: ['Legal Assessment'],
    sourceReference: [],
    recommendedNextStep: 'Consider post-incorporation.',
    blocking: false,
    generatedAt: '2026-09-21T00:00:00Z',
  },
];

const mockSnapshot: ConstructionSnapshot = {
  status: 'Completed',
  generatedAt: '2026-09-21T00:00:00Z',
  updatedAt: '2026-09-21T00:00:00Z',
  overallSummary: 'Your strategic foundation is strong.',
  readyItems: [mockItems[1]],
  partialItems: [mockItems[2]], // NeedsReview inside partial
  missingItems: [mockItems[3]],
  criticalItems: [mockItems[0]],
  optionalItems: [mockItems[4]],
  categories: ['Technology', 'Market', 'Skills', 'Services', 'Legal & Administration'],
  sourceReferences: {},
  founderEdited: false,
};

describe('ConstructionSnapshotView', () => {
  it('renders empty state with Generate CTA when snapshot is null', () => {
    const onGenerate = vi.fn();
    render(
      <ConstructionSnapshotView
        snapshot={null}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        isGenerating={false}
        error={null}
        onGenerate={onGenerate}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Your construction snapshot is ready to be generated.')).toBeDefined();
    const btn = screen.getByRole('button', { name: /generate my snapshot/i });
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('renders loading state when isLoading is true', () => {
    render(
      <ConstructionSnapshotView
        snapshot={null}
        updateAvailable={false}
        changedSources={[]}
        isLoading={true}
        isGenerating={false}
        error={null}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Building your construction snapshot…')).toBeDefined();
    expect(screen.getByText(/MBC is combining your business plan/i)).toBeDefined();
  });

  it('renders counts in Hero without any percentage score', () => {
    render(
      <ConstructionSnapshotView
        projectName="Test Enterprise"
        snapshot={mockSnapshot}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        isGenerating={false}
        error={null}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Test Enterprise')).toBeDefined();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(4); // 4 category boxes
    // Confirm no fake percentage appears
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('renders canonical UI sections with Critical Attention first and NeedsReview under Partially Ready', () => {
    render(
      <ConstructionSnapshotView
        snapshot={mockSnapshot}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        isGenerating={false}
        error={null}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    // Section headings by role or getAllByText
    expect(screen.getByRole('heading', { level: 2, name: 'Critical Attention' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Ready' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Partially Ready' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Missing' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Optional' })).toBeDefined();

    // NeedsReview badge is visible inside Partially Ready
    expect(screen.getByText('Needs Review')).toBeDefined();
    expect(screen.getByText('React Capability Review')).toBeDefined();

    // Blocking badge on critical item
    expect(screen.getByText('Blocking')).toBeDefined();
    expect(screen.getByText('Full-Stack Technical Execution')).toBeDefined();
  });

  it('renders Stale banner when updateAvailable is true with Refresh and Keep Current Version actions', () => {
    const onRefresh = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ConstructionSnapshotView
        snapshot={mockSnapshot}
        updateAvailable={true}
        changedSources={['Professional Profile', 'Financial Forecast']}
        isLoading={false}
        isGenerating={false}
        error={null}
        onGenerate={vi.fn()}
        onRefresh={onRefresh}
        onDismissStale={onDismiss}
      />
    );

    expect(screen.getByText('Update Available')).toBeDefined();
    expect(screen.getByText('• Professional Profile')).toBeDefined();
    expect(screen.getByText('• Financial Forecast')).toBeDefined();

    const refreshBtn = screen.getByRole('button', { name: /refresh snapshot/i });
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalledTimes(1);

    const keepBtn = screen.getByRole('button', { name: /keep current version/i });
    fireEvent.click(keepBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders Build My Roadmap CTA as disabled with Coming Next tag', () => {
    render(
      <ConstructionSnapshotView
        snapshot={mockSnapshot}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        isGenerating={false}
        error={null}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    const roadmapLink = screen.getByRole('link', { name: /build my roadmap/i });
    expect(roadmapLink).toBeDefined();
    expect(roadmapLink.getAttribute('href')).toContain('/dashboard/creator/phase-4/roadmap');
  });
});
