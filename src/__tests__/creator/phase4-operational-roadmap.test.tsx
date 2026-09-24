import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OperationalRoadmapView } from '@/components/creator/phase4/OperationalRoadmapView';
import type { OperationalRoadmap, RoadmapTask } from '@/types/creator/roadmap';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

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
    expectedResult: 'Fractional CTO or technical agency engaged with signed agreement.',
    estimatedEffort: '2.5 hrs',
    estimatedEffortHours: 2.5,
    dependencies: [],
    unblocks: ['Finalize launch pricing tiers'],
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
    expectedResult: 'Three tiered pricing plans modeled with gross margin > 70%.',
    estimatedEffort: 'Medium',
    estimatedEffortHours: null,
    dependencies: ['tech.execution'],
    unblocks: [],
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
  stages: ['NOW', 'NEXT_30_DAYS', 'DAYS_30_TO_60', 'DAYS_60_TO_90', 'BEFORE_LAUNCH', 'POST_LAUNCH'],
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

describe('OperationalRoadmapView — Phase 4.2 Canon Visual Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders empty state when roadmap is null and triggers onGenerate', async () => {
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
        weeklyAvailability="4 hours / week"
        capacityTier="VeryLight"
        capacityMessage="Under 5 hours/week permits at most 2 Now tasks to protect momentum."
        maxNowTasks={2}
        knownEffortHours={null}
        unestimatedTasksCount={0}
        planStatus="Draft"
        isLoading={false}
        isGenerating={false}
        onGenerate={onGenerate}
        onRefresh={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
        onUpdateTask={vi.fn()}
        onActivate={vi.fn()}
        onUpdateAvailability={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText('Your roadmap has not been generated yet.')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /generate my roadmap/i });
    fireEvent.click(btn);
    expect(onGenerate).toHaveBeenCalled();
  });

  it('renders loading state when isLoading is true and roadmap is null', () => {
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
        weeklyAvailability="4 hours / week"
        capacityTier="VeryLight"
        capacityMessage="Under 5 hours/week permits at most 2 Now tasks to protect momentum."
        maxNowTasks={2}
        knownEffortHours={null}
        unestimatedTasksCount={0}
        planStatus="Draft"
        isLoading={true}
        isGenerating={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
        onUpdateTask={vi.fn()}
        onActivate={vi.fn()}
        onUpdateAvailability={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText('Building your operational roadmap…')).toBeInTheDocument();
  });

  it('renders 3-column planning context card, Start Here card, and 6 canonical stacked group cards', () => {
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
        weeklyAvailability="4 hours / week"
        capacityTier="VeryLight"
        capacityMessage="Under 5 hours/week permits at most 2 Now tasks to protect momentum."
        maxNowTasks={2}
        knownEffortHours={2.5}
        unestimatedTasksCount={1}
        planStatus="Draft"
        isLoading={false}
        isGenerating={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
        onUpdateTask={vi.fn()}
        onActivate={vi.fn()}
        onUpdateAvailability={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    // Section 2: Planning Context (3 columns)
    expect(screen.getByText('Your Availability')).toBeInTheDocument();
    expect(screen.getByText('4 hours / week')).toBeInTheDocument();
    expect(screen.getByText('Planned Now')).toBeInTheDocument();
    expect(screen.getAllByText(/~2.5 hrs/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Plan Status')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText(/Under 5 hours\/week permits at most 2 Now tasks/i)).toBeInTheDocument();

    // Section 3: Start Here
    expect(screen.getByText('START HERE')).toBeInTheDocument();
    expect(screen.getAllByText('Resolve technical execution capability').length).toBeGreaterThan(0);
    expect(screen.getByText(/Technical execution is critical and blocking/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view task/i })).toBeInTheDocument();

    // Section 4: Roadmap Groups (in canonical order)
    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByText('Next 30 days')).toBeInTheDocument();
    expect(screen.getByText('Days 30–60')).toBeInTheDocument();
    expect(screen.getByText('Days 60–90')).toBeInTheDocument();
    expect(screen.getByText('Before launch')).toBeInTheDocument();
    expect(screen.getByText('After launch')).toBeInTheDocument();

    // Section 5: Activation Footer
    expect(screen.getByRole('link', { name: /back to snapshot/i })).toHaveAttribute(
      'href',
      '/dashboard/creator/phase-4?ideaId=idea-1'
    );
    expect(screen.getByRole('button', { name: /activate roadmap & continue/i })).toBeInTheDocument();
  });

  it('expands task row to reveal 2-row inset detail panel with Expected Result and Why', () => {
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
        weeklyAvailability="4 hours / week"
        capacityTier="VeryLight"
        capacityMessage="Under 5 hours/week permits at most 2 Now tasks to protect momentum."
        maxNowTasks={2}
        knownEffortHours={2.5}
        unestimatedTasksCount={1}
        planStatus="Draft"
        isLoading={false}
        isGenerating={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
        onUpdateTask={vi.fn()}
        onActivate={vi.fn()}
        onUpdateAvailability={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    // Click the first task row title to expand
    const taskTitle = screen.getAllByText('Resolve technical execution capability')[1];
    fireEvent.click(taskTitle);

    // Verify detail area content
    expect(screen.getByText('Expected Result')).toBeInTheDocument();
    expect(
      screen.getByText('Fractional CTO or technical agency engaged with signed agreement.')
    ).toBeInTheDocument();
    expect(screen.getByText('Why This Is Here')).toBeInTheDocument();
    expect(screen.getAllByText('Software platform requires technical lead').length).toBeGreaterThan(0);
    expect(screen.getByText('Estimated Effort')).toBeInTheDocument();
    expect(screen.getByText(/Prerequisites \/ Blocked by/i)).toBeInTheDocument();
    expect(screen.getByText(/Blocks Downstream Tasks/i)).toBeInTheDocument();
    expect(screen.getAllByText('Finalize launch pricing tiers').length).toBeGreaterThan(0);
    expect(screen.getByText('Built from:')).toBeInTheDocument();
    expect(screen.getByText('Construction Snapshot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adjust task/i })).toBeInTheDocument();
  });

  it('triggers task inline adjustment edit and saves changes via onUpdateTask', async () => {
    const onUpdateTask = vi.fn().mockResolvedValue(undefined);
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
        weeklyAvailability="4 hours / week"
        capacityTier="VeryLight"
        capacityMessage="Under 5 hours/week permits at most 2 Now tasks to protect momentum."
        maxNowTasks={2}
        knownEffortHours={2.5}
        unestimatedTasksCount={1}
        planStatus="Draft"
        isLoading={false}
        isGenerating={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
        onUpdateTask={onUpdateTask}
        onActivate={vi.fn()}
        onUpdateAvailability={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    // Expand first task
    fireEvent.click(screen.getAllByText('Resolve technical execution capability')[1]);

    // Click "Adjust task"
    const adjustBtn = screen.getByRole('button', { name: /adjust task/i });
    fireEvent.click(adjustBtn);

    // Edit founder notes
    const notesInput = screen.getByPlaceholderText(/Add personal notes, contacts, or requirements/i);
    fireEvent.change(notesInput, { target: { value: 'Engaged Alex from fractional team.' } });

    // Save
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    expect(onUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        founderNotes: 'Engaged Alex from fractional team.',
      })
    );
  });

  it('opens Adjust Availability modal, selects new tier, and calls onUpdateAvailability', async () => {
    const onUpdateAvailability = vi.fn().mockResolvedValue(undefined);
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
        weeklyAvailability="4 hours / week"
        capacityTier="VeryLight"
        capacityMessage="Under 5 hours/week permits at most 2 Now tasks to protect momentum."
        maxNowTasks={2}
        knownEffortHours={2.5}
        unestimatedTasksCount={1}
        planStatus="Draft"
        isLoading={false}
        isGenerating={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
        onUpdateTask={vi.fn()}
        onActivate={vi.fn()}
        onUpdateAvailability={onUpdateAvailability}
        onKeepCurrent={vi.fn()}
      />
    );

    const adjustBtn = screen.getByRole('button', { name: /adjust availability/i });
    fireEvent.click(adjustBtn);

    expect(screen.getByText('Adjust Weekly Availability')).toBeInTheDocument();

    // Select 10–20 hours/week
    const tierOption = screen.getByText('10–20 hours/week');
    fireEvent.click(tierOption);

    const saveBtn = screen.getByRole('button', { name: /save & update roadmap/i });
    fireEvent.click(saveBtn);

    expect(onUpdateAvailability).toHaveBeenCalledWith('10–20 hours/week');
  });

  it('renders Update Notice strip with blue left accent and triggers onKeepCurrent or onRefresh', async () => {
    const onKeepCurrent = vi.fn().mockResolvedValue(undefined);
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
        weeklyAvailability="4 hours / week"
        capacityTier="VeryLight"
        capacityMessage="Under 5 hours/week permits at most 2 Now tasks to protect momentum."
        maxNowTasks={2}
        knownEffortHours={2.5}
        unestimatedTasksCount={1}
        planStatus="Draft"
        isLoading={false}
        isGenerating={false}
        onGenerate={vi.fn()}
        onRefresh={onRefresh}
        onUpdateTaskStatus={vi.fn()}
        onUpdateTask={vi.fn()}
        onActivate={vi.fn()}
        onUpdateAvailability={vi.fn()}
        onKeepCurrent={onKeepCurrent}
      />
    );

    // Section 1: Update Notice Strip
    expect(
      screen.getByText(/Your project or availability has changed and may affect this roadmap/i)
    ).toBeInTheDocument();

    // Review changes modal
    const reviewBtn = screen.getByRole('button', { name: /review changes/i });
    fireEvent.click(reviewBtn);
    expect(screen.getByText('Review Upstream Changes')).toBeInTheDocument();
    expect(screen.getAllByText('Professional Profile / Availability').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Financial Forecast').length).toBeGreaterThan(0);

    // Close review modal
    const closeBtn = screen.getByRole('button', { name: /^close$/i });
    fireEvent.click(closeBtn);

    // Keep current plan
    const keepBtn = screen.getByRole('button', { name: /keep current plan/i });
    fireEvent.click(keepBtn);
    expect(onKeepCurrent).toHaveBeenCalled();
  });

  it('triggers onActivate and navigates to 4.3 Needs & Requirements on success', async () => {
    const onActivate = vi.fn().mockResolvedValue({ success: true });
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
        weeklyAvailability="4 hours / week"
        capacityTier="VeryLight"
        capacityMessage="Under 5 hours/week permits at most 2 Now tasks to protect momentum."
        maxNowTasks={2}
        knownEffortHours={2.5}
        unestimatedTasksCount={1}
        planStatus="Draft"
        isLoading={false}
        isGenerating={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
        onUpdateTask={vi.fn()}
        onActivate={onActivate}
        onUpdateAvailability={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    const activateBtn = screen.getByRole('button', { name: /activate roadmap & continue/i });
    fireEvent.click(activateBtn);

    expect(onActivate).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/dashboard/creator/phase-4/needs?ideaId=idea-1'
      );
    });
  });

  it('Next Best Action View Task button expands the task row', () => {
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
        weeklyAvailability="4 hours / week"
        capacityTier="VeryLight"
        capacityMessage="Under 5 hours/week permits at most 2 Now tasks to protect momentum."
        maxNowTasks={2}
        knownEffortHours={2.5}
        unestimatedTasksCount={1}
        planStatus="Draft"
        isLoading={false}
        isGenerating={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
        onUpdateTask={vi.fn()}
        onActivate={vi.fn()}
        onUpdateAvailability={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    const viewTaskBtn = screen.getByRole('button', { name: /view task/i });
    fireEvent.click(viewTaskBtn);

    // It should expand the task detail view
    expect(screen.getByText('Expected Result')).toBeInTheDocument();
    expect(
      screen.getByText('Fractional CTO or technical agency engaged with signed agreement.')
    ).toBeInTheDocument();
  });
});
