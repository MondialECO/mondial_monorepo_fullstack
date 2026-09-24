'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield,
  Layers,
  Info,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import type {
  OperationalRoadmap,
  RoadmapTask,
  RoadmapStage,
  RoadmapTaskStatus,
  RoadmapTaskPriority,
  NextBestAction,
  UpdateRoadmapTaskRequest,
} from '@/types/creator/roadmap';

interface OperationalRoadmapViewProps {
  ideaId: string;
  projectName: string;
  roadmap: OperationalRoadmap | null;
  updateAvailable: boolean;
  changedSources: string[];
  totalTasks: number;
  activeTasks: number;
  criticalTasks: number;
  completedTasks: number;
  weeklyAvailability: string;
  capacityTier: string;
  capacityMessage: string;
  maxNowTasks: number;
  knownEffortHours: number | null;
  unestimatedTasksCount: number;
  planStatus: string;
  isLoading: boolean;
  isGenerating: boolean;
  error?: string | null;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: RoadmapTaskStatus) => Promise<void>;
  onUpdateTask: (req: UpdateRoadmapTaskRequest) => Promise<void>;
  onActivate: () => Promise<any>;
  onUpdateAvailability: (weeklyAvailability: string) => Promise<void>;
  onKeepCurrent: () => Promise<void>;
  onClearError?: () => void;
}

const STAGE_CONFIG: Record<
  RoadmapStage,
  { label: string; subtitle: string; badgeVariant: string }
> = {
  NOW: {
    label: 'Now',
    subtitle: 'Immediate focus — capacity bounded',
    badgeVariant: 'border-rose-500/30 bg-rose-500/10 text-rose-500 dark:text-rose-400',
  },
  NEXT_30_DAYS: {
    label: 'Next 30 days',
    subtitle: 'Near-term foundation and preparation',
    badgeVariant: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  DAYS_30_TO_60: {
    label: 'Days 30–60',
    subtitle: 'Month 2 build & operational milestones',
    badgeVariant: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
  DAYS_60_TO_90: {
    label: 'Days 60–90',
    subtitle: 'Month 3 validation & pre-launch readiness',
    badgeVariant: 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  BEFORE_LAUNCH: {
    label: 'Before launch',
    subtitle: 'Mandatory pre-launch gates & formation filings',
    badgeVariant: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  POST_LAUNCH: {
    label: 'After launch',
    subtitle: 'Ongoing operations, compliance & reporting',
    badgeVariant: 'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
};

const CANONICAL_STAGE_ORDER: RoadmapStage[] = [
  'NOW',
  'NEXT_30_DAYS',
  'DAYS_30_TO_60',
  'DAYS_60_TO_90',
  'BEFORE_LAUNCH',
  'POST_LAUNCH',
];

const AVAILABILITY_OPTIONS = [
  { value: '<5 hours/week', label: '< 5 hours/week', desc: 'Very Light · Max 2 Now tasks' },
  { value: '5–10 hours/week', label: '5–10 hours/week', desc: 'Light · Max 3 Now tasks' },
  { value: '10–20 hours/week', label: '10–20 hours/week', desc: 'Standard · Max 5 Now tasks' },
  { value: '20–30 hours/week', label: '20–30 hours/week', desc: 'Accelerated · Max 7 Now tasks' },
  { value: '30+ hours/week', label: '30+ hours/week', desc: 'Intensive · Max 9 Now tasks' },
];

export function OperationalRoadmapView({
  ideaId,
  projectName,
  roadmap,
  updateAvailable,
  changedSources,
  totalTasks,
  activeTasks,
  criticalTasks,
  completedTasks,
  weeklyAvailability,
  capacityTier,
  capacityMessage,
  maxNowTasks,
  knownEffortHours,
  unestimatedTasksCount,
  planStatus,
  isLoading,
  isGenerating,
  error,
  onGenerate,
  onRefresh,
  onUpdateTaskStatus,
  onUpdateTask,
  onActivate,
  onUpdateAvailability,
  onKeepCurrent,
  onClearError,
}: OperationalRoadmapViewProps) {
  const router = useRouter();
  const [staleDismissed, setStaleDismissed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState(weeklyAvailability);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // References for scrolling
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const scrollToAndExpandTask = (taskId: string) => {
    setExpandedTaskIds((prev) => new Set(prev).add(taskId));
    setTimeout(() => {
      const el = taskRefs.current.get(taskId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleStatusChange = async (taskId: string, newStatus: RoadmapTaskStatus) => {
    try {
      setUpdatingTaskId(taskId);
      await onUpdateTaskStatus(taskId, newStatus);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleActivateAndContinue = async () => {
    try {
      setIsActivating(true);
      await onActivate();
      router.push(`/dashboard/creator/phase-4/needs?ideaId=${encodeURIComponent(ideaId)}`);
    } catch (err) {
      console.error('Failed to activate roadmap:', err);
    } finally {
      setIsActivating(false);
    }
  };

  // 1. Initial Empty State
  if (!roadmap && !isLoading) {
    return (
      <div className="p-8 sm:p-12 rounded-2xl bg-card border border-border text-center flex flex-col items-center justify-center min-h-[420px] shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
          <Clock className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Your roadmap has not been generated yet.
        </h2>
        <p className="text-muted-foreground max-w-lg text-xs sm:text-sm leading-relaxed mb-6">
          MBC will transform your construction snapshot, business model, financial runway, and weekly availability into an actionable operational roadmap.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs max-w-md">
            {error}
          </div>
        )}

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs sm:text-sm disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating Roadmap…</span>
            </>
          ) : (
            <>
              <span>Generate My Roadmap</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    );
  }

  // 2. Initial Loading State
  if (isLoading && !roadmap) {
    return (
      <div className="p-16 rounded-2xl bg-card border border-border text-center flex flex-col items-center justify-center min-h-[420px] shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5 animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1.5">Building your operational roadmap…</h3>
        <p className="text-muted-foreground text-xs max-w-md">
          MBC is sequencing your priorities, dependencies, and available hours into a capacity-paced plan.
        </p>
      </div>
    );
  }

  if (!roadmap) return null;

  const tasks = roadmap.tasks || [];
  const nextBestAction = roadmap.nextBestAction;

  // Group tasks into canonical stages
  const tasksByStage = new Map<RoadmapStage, RoadmapTask[]>();
  CANONICAL_STAGE_ORDER.forEach((s) => tasksByStage.set(s, []));
  tasks.forEach((t) => {
    const list = tasksByStage.get(t.stage) || [];
    list.push(t);
    tasksByStage.set(t.stage, list);
  });

  const nowTasks = tasksByStage.get('NOW') || [];
  const nowTasksCount = nowTasks.length;

  return (
    <div className="space-y-6 font-sans">
      {/* Error / Conflict Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs text-foreground">Action Required</div>
              <div className="text-xs text-muted-foreground mt-0.5">{error}</div>
            </div>
          </div>
          {onClearError && (
            <button
              onClick={onClearError}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 px-2.5 py-1 rounded bg-muted/80"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* 1. Update Notice Strip */}
      {updateAvailable && !staleDismissed && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 border-l-4 border-l-blue-600 dark:border-l-blue-500 shadow-sm text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-foreground font-medium">
              Your project or availability has changed and may affect this roadmap.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted text-foreground font-semibold transition-colors shadow-sm"
            >
              Review changes
            </button>
            <button
              onClick={async () => {
                setStaleDismissed(true);
                await onKeepCurrent();
              }}
              className="px-3 py-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Keep current plan
            </button>
          </div>
        </div>
      )}

      {/* 2. Planning Context Card (Exact 3 Columns + Capacity Rule Below) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {/* Column 1: Your Availability */}
          <div className="space-y-1.5 pb-4 sm:pb-0 sm:pr-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your Availability
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground font-mono">
              {weeklyAvailability}
            </div>
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-muted-foreground">
                Tier: <strong className="text-foreground font-medium">{capacityTier}</strong>
              </span>
              <button
                onClick={() => {
                  setSelectedAvailability(weeklyAvailability);
                  setShowAvailabilityModal(true);
                }}
                className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <Sliders className="w-3 h-3" />
                <span>Adjust availability</span>
              </button>
            </div>
          </div>

          {/* Column 2: Planned Now */}
          <div className="space-y-1.5 py-4 sm:py-0 sm:px-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Planned Now
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              <span className="font-mono">{nowTasksCount}</span>{' '}
              <span className="text-sm font-normal text-muted-foreground">
                {nowTasksCount === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground pt-0.5">
              {knownEffortHours !== null ? (
                <>
                  <span className="font-mono font-medium text-foreground">~{knownEffortHours} hrs</span> known effort
                  {unestimatedTasksCount > 0 && (
                    <span className="text-muted-foreground ml-1">
                      (+{unestimatedTasksCount} unestimated)
                    </span>
                  )}
                </>
              ) : (
                <span className="italic">Effort unestimated</span>
              )}
            </div>
          </div>

          {/* Column 3: Plan Status */}
          <div className="space-y-1.5 pt-4 sm:pt-0 sm:pl-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Plan Status
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  planStatus === 'Active' || planStatus === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}
              >
                {planStatus || 'Draft'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground pt-0.5">
              {totalTasks} total tasks across 6 stages
            </div>
          </div>
        </div>

        {/* Capacity Explanation beneath columns inside same card */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="leading-relaxed">{capacityMessage}</span>
          </div>
          <div className="shrink-0 font-mono text-[11px] text-muted-foreground">
            Max {maxNowTasks} Now tasks limit
          </div>
        </div>
      </div>

      {/* 3. Start Here Card (Subtle Blue-Tinted Background) */}
      {nextBestAction && (
        <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60">
                START HERE
              </span>
              {nextBestAction.blocking && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  Blocking
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                Priority: <strong className="text-foreground">{nextBestAction.priority}</strong>
              </span>
            </div>

            <h3 className="text-base font-semibold text-foreground tracking-tight">
              {nextBestAction.title}
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {nextBestAction.whyNow}
            </p>
          </div>

          <button
            onClick={() => scrollToAndExpandTask(nextBestAction.taskId)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-muted text-foreground transition-all shadow-sm shrink-0 flex items-center gap-1.5 self-start sm:self-center"
          >
            <span>View task</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Roadmap Groups (6 Vertically Stacked Cards) */}
      <div className="space-y-6">
        {CANONICAL_STAGE_ORDER.map((stage) => {
          const stageTasks = tasksByStage.get(stage) || [];
          const config = STAGE_CONFIG[stage];

          return (
            <div
              key={stage}
              className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-sm space-y-3"
            >
              {/* Group Heading */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    {config.label}
                  </h3>
                  <span
                    className={`text-badge font-semibold px-2 py-0.5 rounded-full border ${config.badgeVariant}`}
                  >
                    <span className="font-mono">{stageTasks.length}</span>{' '}
                    {stageTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                  <span className="hidden sm:inline-block text-xs text-muted-foreground">
                    • {config.subtitle}
                  </span>
                </div>
              </div>

              {/* Compact Task Rows */}
              {stageTasks.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground italic">
                  No tasks currently scheduled in this stage.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {stageTasks.map((task) => (
                    <div
                      key={task.id}
                      ref={(el) => {
                        if (el) taskRefs.current.set(task.id, el);
                      }}
                      className="py-3 first:pt-1 last:pb-1"
                    >
                      <TaskRow
                        task={task}
                        allTasks={tasks}
                        isExpanded={expandedTaskIds.has(task.id)}
                        onToggleExpand={() => toggleTaskExpanded(task.id)}
                        onUpdateStatus={handleStatusChange}
                        onUpdateTask={onUpdateTask}
                        isUpdating={updatingTaskId === task.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. Footer (Thin Top Divider + Left Link + Right Pill CTA) */}
      <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href={`/dashboard/creator/phase-4?ideaId=${encodeURIComponent(ideaId)}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Snapshot</span>
        </Link>

        <div className="flex flex-col items-start sm:items-end gap-1.5 w-full sm:w-auto">
          <button
            onClick={handleActivateAndContinue}
            disabled={isActivating || isGenerating}
            className="w-full sm:w-auto px-7 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isActivating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Activating…</span>
              </>
            ) : (
              <>
                <span>
                  {planStatus === 'Active' || planStatus === 'Completed'
                    ? 'Continue to Needs & Requirements'
                    : 'Activate roadmap & continue'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
          <span className="text-[11px] text-muted-foreground sm:text-right">
            {planStatus === 'Active' || planStatus === 'Completed'
              ? 'Proceed to Step 4.3 Needs Analysis & Requirements.'
              : 'Saves your plan and advances to Step 4.3 Needs & Requirements.'}
          </span>
        </div>
      </div>

      {/* Review Changes Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Review Upstream Changes</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                The following upstream project records have been updated since this roadmap was generated:
              </p>
              <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-1.5">
                {changedSources.map((src, i) => (
                  <div key={i} className="flex items-center gap-2 text-foreground font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{src}</span>
                  </div>
                ))}
              </div>
              <p>
                Refreshing will recalculate task prioritization while <strong>preserving all your custom task edits, statuses, and notes</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowReviewModal(false);
                  await onRefresh();
                }}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all shadow"
              >
                Refresh Roadmap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Adjust Weekly Availability</h3>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Select your weekly availability. MBC will automatically adapt the task pacing in your Now stage to avoid overload.
              </p>

              <div className="space-y-2">
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedAvailability === opt.value
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="availability"
                      value={opt.value}
                      checked={selectedAvailability === opt.value}
                      onChange={() => setSelectedAvailability(opt.value)}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground">{opt.label}</div>
                      <div className="text-[11px] text-muted-foreground">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowAvailabilityModal(false);
                  await onUpdateAvailability(selectedAvailability);
                }}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all shadow"
              >
                Save & Update Roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  allTasks,
  isExpanded,
  onToggleExpand,
  onUpdateStatus,
  onUpdateTask,
  isUpdating,
}: {
  task: RoadmapTask;
  allTasks: RoadmapTask[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateStatus: (taskId: string, status: RoadmapTaskStatus) => Promise<void>;
  onUpdateTask: (req: UpdateRoadmapTaskRequest) => Promise<void>;
  isUpdating: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState<RoadmapTaskStatus>(task.status);
  const [editedNotes, setEditedNotes] = useState<string>(task.founderNotes || '');
  const [editedTargetWindow, setEditedTargetWindow] = useState<string>(task.targetWindow || '');
  const [editedEffort, setEditedEffort] = useState<string>(task.estimatedEffort || 'Medium');

  // Resolve dependencies with prerequisite statuses
  const resolvedDependencies = (task.dependencies || [])
    .map((depKey) => {
      const dep = allTasks.find((t) => t.key === depKey || t.id === depKey);
      return dep
        ? { title: dep.title, status: dep.status }
        : { title: depKey, status: 'NotStarted' as RoadmapTaskStatus };
    })
    .filter(Boolean);

  const handleSaveAdjustment = async () => {
    await onUpdateTask({
      taskId: task.id,
      status: editedStatus,
      founderNotes: editedNotes,
      targetWindow: editedTargetWindow,
      estimatedEffort: editedEffort,
    });
    setIsEditing(false);
  };

  const getStatusDotClass = (status: RoadmapTaskStatus) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-500';
      case 'InProgress':
        return 'bg-primary animate-pulse';
      case 'Blocked':
        return 'bg-rose-500';
      case 'NeedsReview':
        return 'bg-amber-500';
      default:
        return 'bg-slate-400 dark:bg-slate-600';
    }
  };

  return (
    <div className="group">
      {/* Horizontal Compact Task Header Row */}
      <div
        onClick={onToggleExpand}
        className="flex items-center justify-between gap-3 py-1 px-1.5 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Status Dot */}
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${getStatusDotClass(task.status)}`}
            title={`Status: ${task.status}`}
          />

          {/* Title */}
          <span
            className={`text-sm font-medium text-foreground tracking-tight truncate ${
              task.status === 'Done' ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {task.title}
          </span>

          {/* Blocking Badge */}
          {task.blocking && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
              Blocking
            </span>
          )}
        </div>

        {/* Right Metadata & Action Area */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Priority */}
          <TaskPriorityBadge priority={task.priority} />

          {/* Effort */}
          {task.estimatedEffort && (
            <span className="hidden sm:inline-block text-xs text-muted-foreground font-mono">
              {task.estimatedEffort}
            </span>
          )}

          {/* Status Chip */}
          <TaskStatusChip status={task.status} />

          {/* Expand Chevron */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            aria-label={isExpanded ? 'Collapse task details' : 'Expand task details'}
            className="p-1 text-muted-foreground group-hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Inset Detail Panel */}
      {isExpanded && (
        <div className="mt-2.5 mb-1 p-4 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/70 space-y-3.5 text-xs animate-fadeIn">
          {/* First Row: Expected Result and Why This Is Here (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span>Expected Result</span>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-5">
                {task.expectedResult || 'Deliverable outcome verified upon completion.'}
              </p>
            </div>

            <div>
              <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                <span>Why This Is Here</span>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-5">
                {task.why || task.description}
              </p>
            </div>
          </div>

          {/* Second Row: Estimated Effort, Dependencies, Unblocks (3 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2.5 border-t border-border/50">
            <div>
              <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Estimated Effort</span>
              </div>
              <div className="text-muted-foreground pl-5 space-y-0.5">
                <div>
                  Effort:{' '}
                  <span className="font-mono font-medium text-foreground">
                    {task.estimatedEffort || 'Medium'}
                  </span>
                </div>
                {task.estimatedDuration && (
                  <div className="text-[11px]">
                    Turnaround:{' '}
                    <span className="font-medium text-foreground">{task.estimatedDuration}</span>
                  </div>
                )}
                {task.targetWindow && (
                  <div className="text-[11px]">
                    Target:{' '}
                    <span className="font-medium text-foreground">{task.targetWindow}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Dependencies</span>
              </div>
              <div className="pl-5">
                {resolvedDependencies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {resolvedDependencies.map((dep, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-[11px] text-foreground"
                      >
                        <span>{dep.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({dep.status})
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">None (Ready now)</span>
                )}
              </div>
            </div>

            <div>
              <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
                <span>Unblocks</span>
              </div>
              <div className="pl-5">
                {task.unblocks && task.unblocks.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {task.unblocks.map((unb, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] text-muted-foreground"
                      >
                        {unb}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Final deliverable / None</span>
                )}
              </div>
            </div>
          </div>

          {/* Founder Notes if any */}
          {task.founderNotes && !isEditing && (
            <div className="p-2.5 rounded-lg bg-card border border-border/80 text-xs">
              <span className="font-semibold text-foreground mr-1">Founder Notes:</span>
              <span className="text-muted-foreground italic">{task.founderNotes}</span>
            </div>
          )}

          {/* Inline Editing Form */}
          {isEditing && (
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-3 mt-2">
              <div className="font-semibold text-foreground text-xs">Adjust Task Details</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium">Status</label>
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value as RoadmapTaskStatus)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground"
                  >
                    <option value="NotStarted">Not Started</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Done">Done</option>
                    <option value="NeedsReview">Needs Review</option>
                    <option value="Skipped">Skipped</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium">
                    Target Window
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Month 1, Week 2"
                    value={editedTargetWindow}
                    onChange={(e) => setEditedTargetWindow(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium">
                  Founder Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Add personal notes, contacts, or requirements for this task..."
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-lg border border-border bg-card text-foreground resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAdjustment}
                  className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Bottom Row: Source chips on left, Adjust task on right */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-muted-foreground font-medium">Built from:</span>
              {task.source && task.source.length > 0 ? (
                task.source.map((src, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] text-muted-foreground font-mono"
                  >
                    {src}
                  </span>
                ))
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] text-muted-foreground font-mono">
                  Construction Snapshot
                </span>
              )}
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust task</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskPriorityBadge({ priority }: { priority: RoadmapTaskPriority }) {
  switch (priority) {
    case 'Critical':
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
          Critical
        </span>
      );
    case 'High':
      return (
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          High
        </span>
      );
    case 'Medium':
      return (
        <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
          Medium
        </span>
      );
    case 'Low':
      return (
        <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-muted/60 text-muted-foreground">
          Low
        </span>
      );
  }
}

function TaskStatusChip({ status }: { status: RoadmapTaskStatus }) {
  switch (status) {
    case 'Done':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Done
        </span>
      );
    case 'InProgress':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
          In Progress
        </span>
      );
    case 'Blocked':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">
          Blocked
        </span>
      );
    case 'NeedsReview':
      return (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Needs Review
        </span>
      );
    case 'Skipped':
      return (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
          Skipped
        </span>
      );
    default:
      return (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/60">
          Not Started
        </span>
      );
  }
}
