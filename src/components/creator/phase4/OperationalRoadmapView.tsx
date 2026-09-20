'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  Check,
  Play,
  RotateCcw,
  Info,
} from 'lucide-react';
import type {
  OperationalRoadmap,
  RoadmapTask,
  RoadmapStage,
  RoadmapTaskStatus,
  RoadmapTaskPriority,
  NextBestAction,
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
  isLoading: boolean;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: RoadmapTaskStatus) => Promise<void>;
}

const STAGE_LABELS: Record<RoadmapStage, string> = {
  NOW: 'Now',
  NEXT_30_DAYS: 'Next 30 Days',
  DAYS_30_TO_60: '30–60 Days',
  DAYS_60_TO_90: '60–90 Days',
  BEFORE_LAUNCH: 'Before Launch',
  POST_LAUNCH: 'Post-Launch',
};

const CANONICAL_STAGE_ORDER: RoadmapStage[] = [
  'NOW',
  'NEXT_30_DAYS',
  'DAYS_30_TO_60',
  'DAYS_60_TO_90',
  'BEFORE_LAUNCH',
  'POST_LAUNCH',
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
  isLoading,
  onGenerate,
  onRefresh,
  onUpdateTaskStatus,
}: OperationalRoadmapViewProps) {
  const [staleDismissed, setStaleDismissed] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const handleStatusChange = async (taskId: string, newStatus: RoadmapTaskStatus) => {
    try {
      setUpdatingTaskId(taskId);
      await onUpdateTaskStatus(taskId, newStatus);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 1. Empty State
  if (!roadmap && !isLoading) {
    return (
      <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center min-h-[460px]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Your roadmap has not been generated yet.
        </h2>
        <p className="text-slate-400 max-w-lg text-sm leading-relaxed mb-8">
          MBC will turn your construction snapshot into a realistic sequence of actions.
        </p>
        <button
          onClick={onGenerate}
          className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-950/40 hover:scale-[1.02] flex items-center gap-2"
        >
          <span>Generate My Roadmap</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 2. Loading State
  if (isLoading && !roadmap) {
    return (
      <div className="p-16 rounded-3xl bg-slate-900/30 border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[460px]">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 animate-pulse">
          <RefreshCw className="w-7 h-7 animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Building your operational roadmap…</h3>
        <p className="text-slate-400 text-sm max-w-md">
          MBC is sequencing your priorities, dependencies and available time.
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

  return (
    <div className="space-y-8 font-sans">
      {/* Stale State Banner */}
      {updateAvailable && !staleDismissed && (
        <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 shadow-lg text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-white text-base">Update Available</div>
              <div className="text-sm text-amber-200/90 mt-0.5">
                Your project or availability has changed and may affect this roadmap.
              </div>
              {changedSources && changedSources.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-amber-300">
                  <span className="font-medium text-amber-400">Changed Sources:</span>
                  {changedSources.map((src, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-100 text-[11px]">
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <button
              onClick={() => setStaleDismissed(true)}
              className="px-4 py-2 text-xs font-medium text-amber-300 hover:text-white transition-colors"
            >
              Keep Current Version
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-all shadow flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Roadmap
            </button>
          </div>
        </div>
      )}

      {/* Hero Header: NO readiness percentage */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span>{projectName || 'Your Venture'}</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Operational Roadmap
            </h1>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              {roadmap.roadmapSummary || 'A realistic, capacity-paced execution sequence derived from your construction diagnostic and team context.'}
            </p>
          </div>

          {/* Counts Matrix (NO readiness percentage!) */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-center min-w-[90px]">
              <div className="text-2xl font-bold text-indigo-400">{activeTasks}</div>
              <div className="text-xs font-medium text-indigo-300/80 uppercase tracking-wider">Active Tasks</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center min-w-[90px]">
              <div className="text-2xl font-bold text-rose-400">{criticalTasks}</div>
              <div className="text-xs font-medium text-rose-300/80 uppercase tracking-wider">Critical</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-center min-w-[90px]">
              <div className="text-2xl font-bold text-emerald-400">{completedTasks}</div>
              <div className="text-xs font-medium text-emerald-300/80 uppercase tracking-wider">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Next Best Action Card (Exactly ONE) */}
      {nextBestAction && (
        <NextBestActionCard
          nba={nextBestAction}
          tasks={tasks}
          onUpdateStatus={handleStatusChange}
          isUpdating={updatingTaskId === nextBestAction.taskId}
        />
      )}

      {/* Timeline Stages UI */}
      <div className="space-y-10">
        {CANONICAL_STAGE_ORDER.map((stage) => {
          const stageTasks = tasksByStage.get(stage) || [];
          if (stageTasks.length === 0) return null; // Empty stages may collapse

          return (
            <div key={stage} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-200">
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                    {stageTasks.length} {stageTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                {stage === 'NOW' && (
                  <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                    Immediate Focus
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stageTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    allTasks={tasks}
                    onUpdateStatus={handleStatusChange}
                    isUpdating={updatingTaskId === task.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Phase 4.3 Transition Gate */}
      <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Next Step</div>
          <h3 className="text-lg font-semibold text-white">Phase 4.3 · Needs & Requirements</h3>
          <p className="text-sm text-slate-400 mt-1">
            Determine the required personnel, technical resources, and external services to fulfill your roadmap.
          </p>
        </div>

        <button
          disabled
          className="px-6 py-3 bg-slate-800 text-slate-400 font-medium rounded-xl cursor-not-allowed border border-slate-700/50 flex items-center gap-2 shrink-0"
        >
          <span>Review My Needs</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold">
            Coming Next
          </span>
        </button>
      </div>
    </div>
  );
}

function NextBestActionCard({
  nba,
  tasks,
  onUpdateStatus,
  isUpdating,
}: {
  nba: NextBestAction;
  tasks: RoadmapTask[];
  onUpdateStatus: (taskId: string, status: RoadmapTaskStatus) => Promise<void>;
  isUpdating: boolean;
}) {
  const matchingTask = tasks.find((t) => t.id === nba.taskId);
  const isInProgress = matchingTask?.status === 'InProgress';

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-purple-950/40 border-2 border-indigo-500/40 shadow-xl shadow-indigo-950/30">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              YOUR NEXT BEST ACTION
            </span>
            {nba.blocking && (
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Blocking
              </span>
            )}
            <span className="text-xs text-slate-400">
              Priority: <strong className="text-white">{nba.priority}</strong>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            {nba.title}
          </h2>

          <div className="text-sm text-indigo-200/90 leading-relaxed bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-500/20">
            <span className="font-semibold text-indigo-300 mr-1.5">Why Now:</span>
            {nba.whyNow}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {isInProgress ? (
            <>
              <button
                onClick={() => onUpdateStatus(nba.taskId, 'Done')}
                disabled={isUpdating}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Mark Done</span>
              </button>
              <button
                onClick={() => onUpdateStatus(nba.taskId, 'InProgress')}
                disabled={isUpdating}
                className="w-full sm:w-auto px-5 py-3 bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all border border-indigo-400/30 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Continue This Action</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onUpdateStatus(nba.taskId, 'InProgress')}
              disabled={isUpdating}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-950/40 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Start This Action</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  allTasks,
  onUpdateStatus,
  isUpdating,
}: {
  task: RoadmapTask;
  allTasks: RoadmapTask[];
  onUpdateStatus: (taskId: string, status: RoadmapTaskStatus) => Promise<void>;
  isUpdating: boolean;
}) {
  // Resolve dependency titles
  const depTitles = (task.dependencies || [])
    .map((depKey) => {
      const dep = allTasks.find((t) => t.key === depKey);
      return dep ? dep.title : depKey;
    })
    .filter(Boolean);

  return (
    <div
      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
        task.status === 'Done'
          ? 'bg-slate-900/20 border-slate-800/40 opacity-70'
          : task.blocking
          ? 'bg-slate-900/60 border-rose-500/30 hover:border-rose-500/50'
          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="space-y-3">
        {/* Header: Status, Category, Priority, Blocking */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <span className="text-xs text-slate-400 font-medium">
              {task.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {task.blocking && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Blocking
              </span>
            )}
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </div>

        {/* Title */}
        <h3 className={`text-base font-semibold text-white tracking-tight ${task.status === 'Done' ? 'line-through text-slate-400' : ''}`}>
          {task.title}
        </h3>

        {/* Why */}
        {task.why && (
          <p className="text-xs text-slate-300 leading-relaxed">
            <span className="text-slate-400 font-medium mr-1">Why:</span>
            {task.why}
          </p>
        )}

        {/* Estimated Effort */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500 text-[11px]">Estimated Effort:</span>
          <span className="font-medium text-slate-300">{task.estimatedEffort}</span>
          {task.targetWindow && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-slate-500 text-[11px]">Target:</span>
              <span className="text-slate-300 font-medium">{task.targetWindow}</span>
            </>
          )}
        </div>

        {/* Dependencies */}
        {depTitles.length > 0 && (
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Dependencies:</span>
            <div className="flex flex-wrap gap-1.5">
              {depTitles.map((dep, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 border border-slate-700/60"
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sources */}
        {task.source && task.source.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 pt-1">
            <span className="text-slate-500 text-[11px]">Sources:</span>
            {task.source.map((src, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300"
              >
                {src}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {task.status !== 'Done' ? (
            <button
              onClick={() => onUpdateStatus(task.id, 'Done')}
              disabled={isUpdating}
              className="text-xs px-2.5 py-1 rounded-md bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1 font-medium"
            >
              <Check className="w-3 h-3" />
              <span>Mark Done</span>
            </button>
          ) : (
            <button
              onClick={() => onUpdateStatus(task.id, 'InProgress')}
              disabled={isUpdating}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reopen</span>
            </button>
          )}

          {task.status === 'NotStarted' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'InProgress')}
              disabled={isUpdating}
              className="text-xs px-2.5 py-1 rounded-md bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 transition-colors flex items-center gap-1 font-medium"
            >
              <Play className="w-3 h-3" />
              <span>Start</span>
            </button>
          )}

          {task.status === 'InProgress' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'Blocked')}
              disabled={isUpdating}
              className="text-xs px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-400 transition-colors"
            >
              Mark Blocked
            </button>
          )}
        </div>

        {task.founderEdited && (
          <span className="text-[10px] text-indigo-400 italic">Edited by you</span>
        )}
      </div>
    </div>
  );
}

function TaskStatusBadge({ status }: { status: RoadmapTaskStatus }) {
  switch (status) {
    case 'Done':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Done
        </span>
      );
    case 'InProgress':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-semibold">
          <Play className="w-3 h-3" />
          In Progress
        </span>
      );
    case 'Blocked':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold">
          <AlertTriangle className="w-3 h-3" />
          Blocked
        </span>
      );
    case 'NeedsReview':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
          <Clock className="w-3 h-3" />
          Needs Review
        </span>
      );
    case 'Skipped':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 border border-slate-700/60 font-medium">
          Skipped
        </span>
      );
    case 'NotStarted':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 font-medium">
          Not Started
        </span>
      );
  }
}

function TaskPriorityBadge({ priority }: { priority: RoadmapTaskPriority }) {
  const styles: Record<RoadmapTaskPriority, string> = {
    Critical: 'text-rose-400',
    High: 'text-amber-400',
    Medium: 'text-slate-300',
    Low: 'text-slate-400',
    Optional: 'text-slate-500',
  };

  return (
    <span className={`text-[11px] font-medium ${styles[priority] || 'text-slate-400'}`}>
      {priority}
    </span>
  );
}
