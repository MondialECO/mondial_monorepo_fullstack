'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Shield,
  Layers,
  Check,
  Play,
  RotateCcw,
  Info,
  Sliders,
  ExternalLink,
  Hourglass,
  HelpCircle,
  FileText,
  UserCheck,
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
    badgeVariant: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  },
  NEXT_30_DAYS: {
    label: 'Next 30 Days',
    subtitle: 'Near-term foundation and preparation',
    badgeVariant: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  DAYS_30_TO_60: {
    label: 'Days 30–60',
    subtitle: 'Month 2 build & operational milestones',
    badgeVariant: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
  },
  DAYS_60_TO_90: {
    label: 'Days 60–90',
    subtitle: 'Month 3 validation & pre-launch readiness',
    badgeVariant: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  },
  BEFORE_LAUNCH: {
    label: 'Before Launch',
    subtitle: 'Mandatory pre-launch gates & formation filings',
    badgeVariant: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },
  POST_LAUNCH: {
    label: 'After Launch',
    subtitle: 'Ongoing operations, compliance & reporting',
    badgeVariant: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
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
  { value: '30+ hours/week', label: '30+ hours/week (Full-time)', desc: 'Intensive · Max 9 Now tasks' },
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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
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
      <div className="p-8 sm:p-12 rounded-3xl bg-card border border-border text-center flex flex-col items-center justify-center min-h-[460px] shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Your roadmap has not been generated yet.
        </h2>
        <p className="text-muted-foreground max-w-lg text-sm leading-relaxed mb-8">
          MBC will transform your construction snapshot, business model, financial runway, and weekly availability into an actionable execution plan.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm max-w-md">
            {error}
          </div>
        )}

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all duration-200 shadow-md hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50"
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
      <div className="p-16 rounded-3xl bg-card border border-border text-center flex flex-col items-center justify-center min-h-[460px] shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 animate-pulse">
          <RefreshCw className="w-7 h-7 animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Building your operational roadmap…</h3>
        <p className="text-muted-foreground text-sm max-w-md">
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
    <div className="space-y-8 font-sans">
      {/* Error / Conflict Alert */}
      {error && (
        <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/30 text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-foreground">Action Required</div>
              <div className="text-xs text-muted-foreground mt-0.5">{error}</div>
            </div>
          </div>
          {onClearError && (
            <button
              onClick={onClearError}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 px-3 py-1 rounded-md bg-muted/80"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* 1. Update Notice Banner */}
      {updateAvailable && !staleDismissed && (
        <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-foreground flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-foreground text-base">Update Available</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Your project or availability has changed and may affect this roadmap.
              </div>
              {changedSources && changedSources.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-medium text-amber-500">Changed Sources:</span>
                  {changedSources.map((src, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-badge font-mono"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg border border-border bg-card hover:bg-muted transition-colors"
            >
              Review Changes
            </button>
            <button
              onClick={async () => {
                await onKeepCurrent();
                setStaleDismissed(true);
              }}
              className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Keep Current Plan
            </button>
            <button
              onClick={onRefresh}
              disabled={isGenerating}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-all shadow flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Refresh Roadmap</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Planning Context Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="w-4 h-4" />
              <span>{projectName || 'Your Venture'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Planning Context
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {roadmap.roadmapSummary ||
                'A realistic, capacity-paced execution sequence derived from your construction diagnostic and personal availability.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">Status:</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary uppercase tracking-wider">
              {planStatus || 'Active'}
            </span>
          </div>
        </div>

        {/* 4 Context Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Availability Tile */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Availability
                </span>
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-foreground font-mono">
                {weeklyAvailability}
              </div>
              <div className="text-xs text-muted-foreground">
                Tier: <strong className="text-foreground">{capacityTier}</strong>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedAvailability(weeklyAvailability);
                setShowAvailabilityModal(true);
              }}
              className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors self-start"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Adjust Availability</span>
            </button>
          </div>

          {/* Planned Now Tile */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Planned Now
                </span>
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-foreground">
                <span className="font-mono">{nowTasksCount}</span>{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  {nowTasksCount === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {knownEffortHours !== null ? (
                  <>
                    Known effort: <strong className="font-mono text-foreground">~{knownEffortHours} hrs</strong>
                    {unestimatedTasksCount > 0 && (
                      <span className="text-muted-foreground ml-1">
                        (+{unestimatedTasksCount} unestimated)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground italic">Effort unestimated</span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Max limit: <span className="font-mono text-foreground">{maxNowTasks}</span> Now tasks
            </div>
          </div>

          {/* Capacity Message Tile (Span 2 on lg) */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 sm:col-span-2 flex flex-col justify-between space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Capacity Guardrail
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
              {capacityMessage}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <div>
                Total Tasks: <span className="font-mono font-semibold text-foreground">{totalTasks}</span>
              </div>
              <div>
                Critical: <span className="font-mono font-semibold text-rose-500">{criticalTasks}</span>
              </div>
              <div>
                Completed: <span className="font-mono font-semibold text-emerald-500">{completedTasks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Start Here (Next Best Action) */}
      {nextBestAction ? (
        <NextBestActionCard
          nba={nextBestAction}
          tasks={tasks}
          onViewTask={scrollToAndExpandTask}
          onUpdateStatus={handleStatusChange}
          isUpdating={updatingTaskId === nextBestAction.taskId}
        />
      ) : (
        <div className="p-6 rounded-2xl bg-card border border-border text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="text-base font-semibold text-foreground">All Immediate Tasks Completed</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            You have resolved all critical action items in the immediate stage. Continue with near-term milestones or proceed to Needs & Requirements.
          </p>
        </div>
      )}

      {/* 4. Roadmap Groups (in canonical order) */}
      <div className="space-y-8">
        {CANONICAL_STAGE_ORDER.map((stage) => {
          const stageTasks = tasksByStage.get(stage) || [];
          const config = STAGE_CONFIG[stage];

          return (
            <div key={stage} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                    {config.label}
                  </span>
                  <span
                    className={`text-badge font-semibold px-2.5 py-0.5 rounded-full border ${config.badgeVariant}`}
                  >
                    <span className="font-mono">{stageTasks.length}</span>{' '}
                    {stageTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                  <span className="hidden sm:inline-block text-xs text-muted-foreground">
                    • {config.subtitle}
                  </span>
                </div>
              </div>

              {stageTasks.length === 0 ? (
                <div className="p-5 rounded-2xl bg-muted/20 border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                  No tasks currently scheduled in this window.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stageTasks.map((task) => (
                    <div
                      key={task.id}
                      ref={(el) => {
                        if (el) taskRefs.current.set(task.id, el);
                      }}
                    >
                      <TaskCard
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

      {/* 5. Activation Footer */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <Link
            href={`/dashboard/creator/phase-4?ideaId=${encodeURIComponent(ideaId)}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Construction Snapshot</span>
          </Link>
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Next Step: Phase 4.3
          </div>
          <h3 className="text-lg font-bold text-foreground">Needs Analysis & Requirements</h3>
          <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
            Translate this operational schedule into required team skills, tooling, funding, and external services.
          </p>
        </div>

        <button
          onClick={handleActivateAndContinue}
          disabled={isActivating || isGenerating}
          className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-md hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
        >
          {isActivating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Activating & Navigating…</span>
            </>
          ) : (
            <>
              <span>{planStatus === 'Active' ? 'Continue to Needs & Requirements' : 'Activate Roadmap & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Review Changes Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Review Upstream Changes</h3>
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
              <div className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-1.5">
                {changedSources.map((src, i) => (
                  <div key={i} className="flex items-center gap-2 text-foreground font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{src}</span>
                  </div>
                ))}
              </div>
              <p>
                Refreshing will recalculate task prioritization and timelines while <strong>preserving all your custom task edits, statuses, and notes</strong>.
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
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-all"
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
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Adjust Weekly Availability</h3>
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
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
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
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all shadow"
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

function NextBestActionCard({
  nba,
  tasks,
  onViewTask,
  onUpdateStatus,
  isUpdating,
}: {
  nba: NextBestAction;
  tasks: RoadmapTask[];
  onViewTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: RoadmapTaskStatus) => Promise<void>;
  isUpdating: boolean;
}) {
  const matchingTask = tasks.find((t) => t.id === nba.taskId || t.key === nba.taskId);
  const isInProgress = matchingTask?.status === 'InProgress';
  const isDone = matchingTask?.status === 'Done';

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary/15 via-card to-primary/5 border-2 border-primary/30 shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-badge font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-primary/20 text-primary border border-primary/30">
              START HERE · NEXT BEST ACTION
            </span>
            {nba.blocking && (
              <span className="text-badge font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40">
                Blocking
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Priority: <strong className="text-foreground">{nba.priority}</strong>
            </span>
            {matchingTask?.estimatedEffort && (
              <span className="text-xs text-muted-foreground">
                • Effort: <strong className="font-mono text-foreground">{matchingTask.estimatedEffort}</strong>
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {nba.title}
          </h2>

          <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed bg-muted/60 p-3.5 rounded-xl border border-border/80">
            <span className="font-semibold text-primary mr-1.5">Purpose / Why Now:</span>
            {nba.whyNow}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={() => onViewTask(matchingTask?.id || nba.taskId)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <FileText className="w-4 h-4 text-primary" />
            <span>View Task Details</span>
          </button>

          {!isDone && (
            <>
              {isInProgress ? (
                <button
                  onClick={() => onUpdateStatus(matchingTask?.id || nba.taskId, 'Done')}
                  disabled={isUpdating}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow flex items-center justify-center gap-2 text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark Done</span>
                </button>
              ) : (
                <button
                  onClick={() => onUpdateStatus(matchingTask?.id || nba.taskId, 'InProgress')}
                  disabled={isUpdating}
                  className="w-full sm:w-auto px-7 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-md hover:scale-[1.02] flex items-center justify-center gap-2 text-xs"
                >
                  <Play className="w-4 h-4" />
                  <span>Start This Action</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({
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

  return (
    <div
      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
        task.status === 'Done'
          ? 'bg-card/40 border-border/50 opacity-80'
          : task.blocking
          ? 'bg-card border-rose-500/30 hover:border-rose-500/50 shadow-sm'
          : 'bg-card border-border hover:border-border/80 shadow-sm'
      }`}
    >
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <span className="text-badge text-muted-foreground font-medium px-2 py-0.5 rounded bg-muted/60">
              {task.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {task.blocking && (
              <span className="text-badge font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                Blocking
              </span>
            )}
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </div>

        {/* Title */}
        <h3
          className={`text-base font-semibold text-foreground tracking-tight ${
            task.status === 'Done' ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {task.title}
        </h3>

        {/* Short Why */}
        {task.why && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {task.why}
          </p>
        )}

        {/* Effort & Duration Metadata */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap pt-1">
          <span className="text-muted-foreground">Effort:</span>
          <span className="font-mono font-medium text-foreground">{task.estimatedEffort}</span>
          {task.estimatedDuration && (
            <>
              <span className="text-border">•</span>
              <span className="text-muted-foreground">Turnaround:</span>
              <span className="font-medium text-foreground">{task.estimatedDuration}</span>
            </>
          )}
          {task.targetWindow && (
            <>
              <span className="text-border">•</span>
              <span className="text-muted-foreground">Target:</span>
              <span className="font-medium text-foreground">{task.targetWindow}</span>
            </>
          )}
        </div>

        {/* Expandable Details Accordion */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border/80 space-y-3.5 text-xs animate-fadeIn">
            {/* Expected Result */}
            {task.expectedResult && (
              <div className="space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>Expected Result:</span>
                </div>
                <div className="text-muted-foreground pl-5">{task.expectedResult}</div>
              </div>
            )}

            {/* Why this is here */}
            {task.why && (
              <div className="space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-primary" />
                  <span>Why this is here:</span>
                </div>
                <div className="text-muted-foreground pl-5">{task.why}</div>
              </div>
            )}

            {/* Dependencies */}
            {resolvedDependencies.length > 0 && (
              <div className="space-y-1.5">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>Dependencies (Prerequisites):</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-5">
                  {resolvedDependencies.map((dep, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-[11px] text-foreground"
                    >
                      <span>{dep.title}</span>
                      <span className="text-[10px] text-muted-foreground">({dep.status})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unblocks */}
            {task.unblocks && task.unblocks.length > 0 && (
              <div className="space-y-1.5">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                  <span>Unblocks Downstream:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-5">
                  {task.unblocks.map((unb, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/80 text-[11px] text-muted-foreground"
                    >
                      {unb}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Provenance / Sources */}
            {task.source && task.source.length > 0 && (
              <div className="space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Built from:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-5">
                  {task.source.map((src, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-muted/60 border border-border text-[11px] text-muted-foreground font-mono"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Founder Notes */}
            {task.founderNotes && !isEditing && (
              <div className="space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border">
                <div className="font-semibold text-foreground text-[11px]">Your Notes:</div>
                <div className="text-muted-foreground text-xs italic">{task.founderNotes}</div>
              </div>
            )}

            {/* Inline Task Adjustment Form */}
            {isEditing ? (
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-3 mt-3">
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
                    <label className="text-[11px] text-muted-foreground font-medium">Target Window</label>
                    <input
                      type="text"
                      placeholder="e.g. Month 1, Week 2"
                      value={editedTargetWindow}
                      onChange={(e) => setEditedTargetWindow(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground"
                    >
                    </input>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground font-medium">Founder Notes</label>
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
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors pt-1"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Task & Notes</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions Row */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {task.status !== 'Done' ? (
            <button
              onClick={() => onUpdateStatus(task.id, 'Done')}
              disabled={isUpdating}
              className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1 font-medium"
            >
              <Check className="w-3 h-3" />
              <span>Mark Done</span>
            </button>
          ) : (
            <button
              onClick={() => onUpdateStatus(task.id, 'InProgress')}
              disabled={isUpdating}
              className="text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reopen</span>
            </button>
          )}

          {task.status === 'NotStarted' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'InProgress')}
              disabled={isUpdating}
              className="text-xs px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors flex items-center gap-1 font-medium"
            >
              <Play className="w-3 h-3" />
              <span>Start</span>
            </button>
          )}

          {task.status === 'InProgress' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'Blocked')}
              disabled={isUpdating}
              className="text-xs px-2 py-1 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark Blocked
            </button>
          )}
        </div>

        <button
          onClick={onToggleExpand}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors"
        >
          <span>{isExpanded ? 'Less' : 'Details'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function TaskStatusBadge({ status }: { status: RoadmapTaskStatus }) {
  switch (status) {
    case 'Done':
      return (
        <span className="inline-flex items-center gap-1 text-badge px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Done
        </span>
      );
    case 'InProgress':
      return (
        <span className="inline-flex items-center gap-1 text-badge px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/30 font-semibold">
          <Play className="w-3 h-3" />
          In Progress
        </span>
      );
    case 'Blocked':
      return (
        <span className="inline-flex items-center gap-1 text-badge px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/30 font-semibold">
          <AlertTriangle className="w-3 h-3" />
          Blocked
        </span>
      );
    case 'NeedsReview':
      return (
        <span className="inline-flex items-center gap-1 text-badge px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium">
          <Clock className="w-3 h-3" />
          Needs Review
        </span>
      );
    case 'Skipped':
      return (
        <span className="inline-flex items-center gap-1 text-badge px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border font-medium">
          Skipped
        </span>
      );
    case 'NotStarted':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-badge px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border font-medium">
          Not Started
        </span>
      );
  }
}

function TaskPriorityBadge({ priority }: { priority: RoadmapTaskPriority }) {
  const styles: Record<RoadmapTaskPriority, string> = {
    Critical: 'text-rose-500 dark:text-rose-400',
    High: 'text-amber-500 dark:text-amber-400',
    Medium: 'text-muted-foreground',
    Low: 'text-muted-foreground/80',
    Optional: 'text-muted-foreground/60',
  };

  return (
    <span className={`text-badge font-medium ${styles[priority] || 'text-muted-foreground'}`}>
      {priority}
    </span>
  );
}
