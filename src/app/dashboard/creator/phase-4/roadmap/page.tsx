'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { OperationalRoadmapView } from '@/components/creator/phase4/OperationalRoadmapView';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  getOperationalRoadmap,
  generateOperationalRoadmap,
  refreshOperationalRoadmap,
  updateRoadmapTask,
  activateOperationalRoadmap,
  updateWeeklyAvailability,
  keepCurrentRoadmap,
} from '@/lib/api-creator-roadmap';
import type {
  OperationalRoadmapResponse,
  RoadmapTaskStatus,
  UpdateRoadmapTaskRequest,
} from '@/types/creator/roadmap';

export default function CreatorPhase4RoadmapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          Loading Operational Roadmap...
        </div>
      }
    >
      <CreatorPhase4RoadmapInner />
    </Suspense>
  );
}

function CreatorPhase4RoadmapInner() {
  const searchParams = useSearchParams();
  const { state: progressState } = useCreatorProgress();
  const ideaId = searchParams.get('ideaId') || progressState?.activeIdeaId || '';

  return (
    <Phase4ProfileGuard>
      <RoadmapPageContent ideaId={ideaId} />
    </Phase4ProfileGuard>
  );
}

function RoadmapPageContent({ ideaId }: { ideaId: string }) {
  const { state: progressState, refetch } = useCreatorProgress();
  const [data, setData] = useState<OperationalRoadmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveIdeaId = ideaId || progressState?.activeIdeaId || '';
  const projectName = progressState?.project?.name || 'Your Venture';

  const loadRoadmap = useCallback(async () => {
    if (!effectiveIdeaId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res: OperationalRoadmapResponse = await getOperationalRoadmap(effectiveIdeaId);
      setData(res);
    } catch (err: any) {
      console.warn('Could not load operational roadmap:', err);
      // If 404 or empty, set data with empty roadmap
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveIdeaId]);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const handleGenerate = async () => {
    if (!effectiveIdeaId) {
      setError('ideaId is required for Creator changes. Please open your project from the dashboard.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await generateOperationalRoadmap(effectiveIdeaId);
      setData(res);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadRoadmap();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. We loaded the latest project version for you. Please try again.');
      } else {
        const message = err.response?.data?.message || err.message || "We couldn't build your roadmap.";
        setError(message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    if (!effectiveIdeaId) {
      setError('ideaId is required for Creator changes. Please open your project from the dashboard.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await refreshOperationalRoadmap(effectiveIdeaId);
      setData(res);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadRoadmap();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. We loaded the latest project version for you. Please try again.');
      } else {
        const message = err.response?.data?.message || err.message || 'Failed to refresh roadmap.';
        setError(message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: RoadmapTaskStatus) => {
    if (!effectiveIdeaId) return;
    try {
      const res = await updateRoadmapTask(effectiveIdeaId, { taskId, status });
      setData(res);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadRoadmap();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. Please review and retry.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to update task.');
      }
    }
  };

  const handleUpdateTask = async (req: UpdateRoadmapTaskRequest) => {
    if (!effectiveIdeaId) return;
    try {
      const res = await updateRoadmapTask(effectiveIdeaId, req);
      setData(res);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadRoadmap();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. Please review and retry.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to update task details.');
      }
    }
  };

  const handleActivate = async () => {
    if (!effectiveIdeaId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await activateOperationalRoadmap(effectiveIdeaId);
      setData(res);
      return res;
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadRoadmap();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. We reloaded the latest state.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to activate roadmap.');
      }
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateAvailability = async (weeklyAvailability: string) => {
    if (!effectiveIdeaId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await updateWeeklyAvailability(effectiveIdeaId, weeklyAvailability);
      setData(res);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadRoadmap();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. We loaded the latest state.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to update weekly availability.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeepCurrent = async () => {
    if (!effectiveIdeaId) return;
    try {
      const res = await keepCurrentRoadmap(effectiveIdeaId);
      setData(res);
    } catch (err: any) {
      console.warn('Could not preserve current version:', err);
    }
  };

  return (
    <div className="w-full max-w-[1120px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 animate-fadeIn">
      {/* Compact Page Header (Aligned with 4.1 Canon) */}
      <div className="space-y-1">
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          PHASE 4 · STEP 4.2
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Operational Roadmap
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Turn your project requirements into a practical plan that fits your availability.
        </p>
      </div>

      {/* Main Roadmap View */}
      <OperationalRoadmapView
        ideaId={effectiveIdeaId}
        projectName={projectName}
        roadmap={data?.roadmap || null}
        updateAvailable={data?.updateAvailable || false}
        changedSources={data?.changedSources || []}
        totalTasks={data?.totalTasksCount ?? data?.totalTasks ?? 0}
        activeTasks={data?.activeTasksCount ?? data?.activeTasks ?? 0}
        criticalTasks={data?.criticalTasksCount ?? data?.criticalTasks ?? 0}
        completedTasks={data?.completedTasksCount ?? data?.completedTasks ?? 0}
        weeklyAvailability={data?.weeklyAvailability || '10–20 hours/week'}
        capacityTier={data?.capacityTier || 'Standard'}
        capacityMessage={data?.capacityMessage || 'Capacity paced for your current availability.'}
        maxNowTasks={data?.maxNowTasks || 3}
        knownEffortHours={data?.knownEffortHours ?? null}
        unestimatedTasksCount={data?.unestimatedTasksCount ?? 0}
        planStatus={data?.planStatus || data?.roadmap?.status || 'Active'}
        isLoading={isLoading}
        isGenerating={isGenerating}
        error={error}
        onGenerate={handleGenerate}
        onRefresh={handleRefresh}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        onUpdateTask={handleUpdateTask}
        onActivate={handleActivate}
        onUpdateAvailability={handleUpdateAvailability}
        onKeepCurrent={handleKeepCurrent}
        onClearError={() => setError(null)}
      />
    </div>
  );
}
