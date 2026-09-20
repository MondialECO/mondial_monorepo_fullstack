import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OperationalRoadmapView } from '@/components/creator/phase4/OperationalRoadmapView';
import type { OperationalRoadmap, RoadmapTask } from '@/types/creator/roadmap';

const mockTasks: RoadmapTask[] = [
  {
    id: 'task-1',
    key: 'tech.execution',
    title: 'Resolve technical execution capability',
    description: 'Ensure engineering capability is present',
    category: 'Technology',
    stage: 'NOW',
    priority: 'Critical',
    status: 'NotStarted',
    blocking: true,
    why: 'Software platform requires technical lead',
    estimatedEffort: 'Large',
    dependencies: [],
    source: ['Construction Snapshot'],
    sourceReference: [],
    requiresExternalAction: true,
    founderEdited: false,
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
  },
  {
    id: 'task-2',
    key: 'pricing.structure',
    title: 'Finalize launch pricing tiers',
    description: 'Structure B2B subscription pricing',
    category: 'Pricing',
    stage: 'NEXT_30_DAYS',
    priority: 'High',
    status: 'NotStarted',
    blocking: false,
    why: 'Unit economics depend on launch tiers',
    estimatedEffort: 'Medium',
    dependencies: ['tech.execution'],
    source: ['Business Plan'],
    sourceReference: [],
    requiresExternalAction: false,
    founderEdited: false,
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
  },
];

const mockRoadmap: OperationalRoadmap = {
  status: 'Completed',
  generatedAt: '2026-09-21T00:00:00Z',
  updatedAt: '2026-09-21T00:00:00Z',
  roadmapSummary: 'Your immediate priority is to resolve technical capability.',
  stages: ['NOW', 'NEXT_30_DAYS'],
  tasks: mockTasks,
  nextBestAction: {
    taskId: 'task-1',
    title: 'Resolve technical execution capability',
    whyNow: 'Technical execution is critical and blocking initial development.',
    priority: 'Critical',
    blocking: true,
    source: ['Construction Snapshot'],
  },
  sourceVersions: {},
  founderEdited: false,
};

describe('OperationalRoadmapView', () => {
  it('renders empty state when roadmap is null and calls onGenerate', () => {
    const onGenerate = vi.fn().mockResolvedValue(undefined);
    render(
      <OperationalRoadmapView
        ideaId="idea-1"
        projectName="SaaS Pro"
        roadmap={null}
        updateAvailable={false}
        changedSources={[]}
        totalTasks={0}
        activeTasks={0}
        criticalTasks={0}
        completedTasks={0}
        isLoading={false}
        onGenerate={onGenerate}
        onRefresh={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
      />
    );

    expect(screen.getByText('Your roadmap has not been generated yet.')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /generate my roadmap/i });
    fireEvent.click(btn);
    expect(onGenerate).toHaveBeenCalled();
  });

  it('renders loading state when isLoading is true', () => {
    render(
      <OperationalRoadmapView
        ideaId="idea-1"
        projectName="SaaS Pro"
        roadmap={null}
        updateAvailable={false}
        changedSources={[]}
        totalTasks={0}
        activeTasks={0}
        criticalTasks={0}
        completedTasks={0}
        isLoading={true}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
      />
    );

    expect(screen.getByText('Building your operational roadmap…')).toBeInTheDocument();
  });

  it('renders generated roadmap with hero counts, next best action card, and canonical stages', () => {
    render(
      <OperationalRoadmapView
        ideaId="idea-1"
        projectName="SaaS Pro"
        roadmap={mockRoadmap}
        updateAvailable={false}
        changedSources={[]}
        totalTasks={2}
        activeTasks={2}
        criticalTasks={1}
        completedTasks={0}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
      />
    );

    // Hero matrix counts
    expect(screen.getByText('Active Tasks')).toBeInTheDocument();
    expect(screen.getAllByText('Critical').length).toBeGreaterThan(0);
    expect(screen.getByText('Completed')).toBeInTheDocument();

    // Next Best Action
    expect(screen.getByText('YOUR NEXT BEST ACTION')).toBeInTheDocument();
    expect(screen.getAllByText('Resolve technical execution capability').length).toBeGreaterThan(0);
    expect(screen.getByText(/Technical execution is critical and blocking/i)).toBeInTheDocument();

    // Stages
    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByText('Next 30 Days')).toBeInTheDocument();

    // Dependencies & Task display
    expect(screen.getAllByText('Resolve technical execution capability').length).toBeGreaterThanOrEqual(2);

    // Verify readiness percentage does NOT exist
    expect(screen.queryByText(/readiness/i)).not.toBeInTheDocument();
  });

  it('triggers task status mutation when clicking Start or Mark Done', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <OperationalRoadmapView
        ideaId="idea-1"
        projectName="SaaS Pro"
        roadmap={mockRoadmap}
        updateAvailable={false}
        changedSources={[]}
        totalTasks={2}
        activeTasks={2}
        criticalTasks={1}
        completedTasks={0}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateTaskStatus={onUpdate}
      />
    );

    const startBtns = screen.getAllByRole('button', { name: /start/i });
    fireEvent.click(startBtns[0]);
    expect(onUpdate).toHaveBeenCalledWith('task-1', 'InProgress');
  });

  it('renders stale state banner and allows refreshing or keeping current version', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(
      <OperationalRoadmapView
        ideaId="idea-1"
        projectName="SaaS Pro"
        roadmap={mockRoadmap}
        updateAvailable={true}
        changedSources={['Professional Profile / Availability', 'Financial Forecast']}
        totalTasks={2}
        activeTasks={2}
        criticalTasks={1}
        completedTasks={0}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={onRefresh}
        onUpdateTaskStatus={vi.fn()}
      />
    );

    expect(screen.getByText('Update Available')).toBeInTheDocument();
    expect(screen.getByText('Professional Profile / Availability')).toBeInTheDocument();
    expect(screen.getByText('Financial Forecast')).toBeInTheDocument();

    const refreshBtn = screen.getByRole('button', { name: /refresh roadmap/i });
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalled();

    const keepBtn = screen.getByRole('button', { name: /keep current version/i });
    fireEvent.click(keepBtn);
    expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
  });
});
