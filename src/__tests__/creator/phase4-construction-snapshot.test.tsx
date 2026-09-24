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
    source: ['Business Plan', 'Professional Profile'],
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
  categories: [
    'Business Foundation',
    'Brand',
    'Market',
    'Business Model',
    'Finance',
    'Legal & Administration',
    'Team',
    'Skills',
    'Services',
    'Technology',
    'Funding',
    'Pricing',
    'Go-to-Market',
    'Launch Assets',
    'Operations',
  ],
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

  it('renders Status Summary 5-column counts and scope sub-strip without any percentage score', () => {
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

    expect(screen.getByText(/TEST ENTERPRISE · SCOPE V1/i)).toBeDefined();
    expect(screen.getByText('Includes items needing review')).toBeDefined();
    expect(screen.getByText(/requirements identified from your project and Creator profile/i)).toBeDefined();
    
    // Status column labels
    expect(screen.getAllByText('Ready').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Partial').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Missing').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Critical').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Optional').length).toBeGreaterThanOrEqual(1);

    // Confirm no fake percentage appears
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('renders Critical item highlight attention strip when criticalItems exist', () => {
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

    expect(screen.getByText('Critical item identified')).toBeDefined();
    expect(screen.getAllByText('Full-Stack Technical Execution').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Detailed under Technology category below/i)).toBeDefined();
  });

  it('renders all 15 canonical categories with expandable/collapsible interaction', () => {
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

    // Verify presence of canonical categories
    expect(screen.getByText('Business Foundation')).toBeDefined();
    expect(screen.getByText('Brand')).toBeDefined();
    expect(screen.getByText('Market')).toBeDefined();
    expect(screen.getByText('Business Model')).toBeDefined();
    expect(screen.getByText('Finance')).toBeDefined();
    expect(screen.getByText('Legal & Administration')).toBeDefined();
    expect(screen.getByText('Team')).toBeDefined();
    expect(screen.getByText('Skills')).toBeDefined();
    expect(screen.getByText('Services')).toBeDefined();
    expect(screen.getByText('Technology')).toBeDefined();
    expect(screen.getByText('Funding')).toBeDefined();
    expect(screen.getByText('Pricing')).toBeDefined();
    expect(screen.getByText('Go-to-Market')).toBeDefined();
    expect(screen.getByText('Launch Assets')).toBeDefined();
    expect(screen.getByText('Operations')).toBeDefined();

    // Items within categories
    expect(screen.getByText('Market Problem & Customer Definition')).toBeDefined();
    expect(screen.getByText('React Capability Review')).toBeDefined();
    expect(screen.getByText('Accounting Support')).toBeDefined();
    expect(screen.getByText('Trademark Registration')).toBeDefined();

    // Badges
    expect(screen.getByText('Needs Review')).toBeDefined();
    expect(screen.getByText('Blocking')).toBeDefined();
  });

  it('renders 3-column diagnostic breakdown and Provenance source footer for expanded items', () => {
    render(
      <ConstructionSnapshotView
        ideaId="idea_123"
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

    // Click on Market item row to expand it
    const marketItem = screen.getByText('Market Problem & Customer Definition');
    fireEvent.click(marketItem);

    expect(screen.getAllByText('WHAT IS NEEDED').length).toBeGreaterThan(0);
    expect(screen.getAllByText('WHAT WE KNOW').length).toBeGreaterThan(0);
    expect(screen.getAllByText('WHY THIS MATTERS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Built from').length).toBeGreaterThan(0);
    expect(screen.getAllByText('View source').length).toBeGreaterThan(0);
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

    expect(screen.getByText(/Update available · Changes to your project information may affect this snapshot/i)).toBeDefined();
    expect(screen.getAllByText('Professional Profile').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Financial Forecast').length).toBeGreaterThanOrEqual(1);

    const refreshBtn = screen.getByRole('button', { name: /review changes/i });
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalledTimes(1);

    const keepBtn = screen.getByRole('button', { name: /keep current version/i });
    fireEvent.click(keepBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders Quiet Journey Footer with Back and Continue to Roadmap links', () => {
    render(
      <ConstructionSnapshotView
        ideaId="idea_456"
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

    const backLink = screen.getByRole('link', { name: /back/i });
    expect(backLink).toBeDefined();
    expect(backLink.getAttribute('href')).toContain('/dashboard/creator/phase-3?ideaId=idea_456');

    const roadmapLink = screen.getByRole('link', { name: /continue to roadmap/i });
    expect(roadmapLink).toBeDefined();
    expect(roadmapLink.getAttribute('href')).toContain('/dashboard/creator/phase-4/roadmap?ideaId=idea_456');
  });

  it('renders genuine API error message and retry button without mock fallback', () => {
    const onGenerate = vi.fn();
    render(
      <ConstructionSnapshotView
        snapshot={null}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        isGenerating={false}
        error="ideaId is required for Creator changes."
        onGenerate={onGenerate}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText("We couldn't build your construction snapshot.")).toBeDefined();
    expect(screen.getByText(/ideaId is required for Creator changes\./i)).toBeDefined();
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    expect(retryBtn).toBeDefined();
    fireEvent.click(retryBtn);
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });
});

describe('api-creator-phase4 client contract', () => {
  it('validates ideaId on getConstructionSnapshot, generateConstructionSnapshot and refreshConstructionSnapshot', async () => {
    const { getConstructionSnapshot, generateConstructionSnapshot, refreshConstructionSnapshot } = await import('@/lib/api-creator-phase4');
    
    await expect(getConstructionSnapshot('')).rejects.toThrow('ideaId is required');
    await expect(getConstructionSnapshot('   ')).rejects.toThrow('ideaId is required');
    await expect(generateConstructionSnapshot('')).rejects.toThrow('ideaId is required');
    await expect(generateConstructionSnapshot('   ')).rejects.toThrow('ideaId is required');
    await expect(refreshConstructionSnapshot('')).rejects.toThrow('ideaId is required');
    await expect(refreshConstructionSnapshot('   ')).rejects.toThrow('ideaId is required');
  });

  it('passes ideaId and expectedVersion in both params and body and tracks version progression', async () => {
    const apiModule = await import('@/lib/axios');
    const postSpy = vi.spyOn(apiModule.default, 'post').mockResolvedValueOnce({
      data: { data: { snapshot: { status: 'Completed' }, ideaVersion: 2 } },
      headers: { 'x-creator-idea-version': '2' }
    } as any).mockResolvedValueOnce({
      data: { data: { snapshot: { status: 'Completed' }, ideaVersion: 3 } },
      headers: { 'x-creator-idea-version': '3' }
    } as any);

    const { generateConstructionSnapshot, refreshConstructionSnapshot } = await import('@/lib/api-creator-phase4');
    
    // First mutation: Generate with explicit or resolved expectedVersion=1
    const genRes = await generateConstructionSnapshot('idea_real_123', 1);
    expect(postSpy).toHaveBeenNthCalledWith(
      1,
      '/creator/phase4/construction-snapshot/generate',
      { ideaId: 'idea_real_123', expectedVersion: 1 },
      { params: { ideaId: 'idea_real_123', expectedVersion: 1 } }
    );
    expect(genRes.ideaVersion).toBe(2);

    // Second mutation: Refresh using stored next version=2
    const refRes = await refreshConstructionSnapshot('idea_real_123');
    expect(postSpy).toHaveBeenNthCalledWith(
      2,
      '/creator/phase4/construction-snapshot/refresh',
      { ideaId: 'idea_real_123', expectedVersion: 2 },
      { params: { ideaId: 'idea_real_123', expectedVersion: 2 } }
    );
    expect(refRes.ideaVersion).toBe(3);
  });
});



