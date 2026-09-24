'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { ConstructionSnapshotView } from '@/components/creator/phase4/ConstructionSnapshotView';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { 
  getConstructionSnapshot, 
  generateConstructionSnapshot, 
  refreshConstructionSnapshot 
} from '@/lib/api-creator-phase4';
import { ConstructionSnapshot, ConstructionSnapshotResponse } from '@/types/creator/phase4';

export default function CreatorPhase4Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading Construction Snapshot...</div>}>
      <CreatorPhase4Inner />
    </Suspense>
  );
}

function CreatorPhase4Inner() {
  const searchParams = useSearchParams();
  const { state: progressState } = useCreatorProgress();
  const ideaId = searchParams.get('ideaId') || progressState?.activeIdeaId || '';

  return (
    <Phase4ProfileGuard>
      <Phase4Content ideaId={ideaId} />
    </Phase4ProfileGuard>
  );
}

function Phase4Content({ ideaId }: { ideaId: string }) {
  const { state: progressState, refetch } = useCreatorProgress();
  const [snapshot, setSnapshot] = useState<ConstructionSnapshot | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [changedSources, setChangedSources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveIdeaId = ideaId || progressState?.activeIdeaId || '';
  const projectName = progressState?.project?.name || 'Your Project';

  const loadSnapshot = useCallback(async () => {
    if (!effectiveIdeaId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res: ConstructionSnapshotResponse = await getConstructionSnapshot(effectiveIdeaId);
      if (res.snapshot) {
        setSnapshot(res.snapshot);
      } else {
        setSnapshot(null);
      }
      setUpdateAvailable(res.updateAvailable || false);
      setChangedSources(res.changedSources || []);
    } catch (err: any) {
      console.warn('Could not load construction snapshot:', err);
      setSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveIdeaId]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const handleGenerate = async () => {
    if (!effectiveIdeaId) {
      setError('ideaId is required for Creator changes. Please open your project from the dashboard.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await generateConstructionSnapshot(effectiveIdeaId);
      if (res.snapshot) {
        setSnapshot(res.snapshot);
      }
      setUpdateAvailable(res.updateAvailable || false);
      setChangedSources(res.changedSources || []);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadSnapshot();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. We loaded the latest project version for you. Please try again.');
      } else {
        const message = err.response?.data?.message || err.message || 'Failed to generate construction snapshot.';
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
      const res = await refreshConstructionSnapshot(effectiveIdeaId);
      if (res.snapshot) {
        setSnapshot(res.snapshot);
      }
      setUpdateAvailable(false);
      setChangedSources([]);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadSnapshot();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. We loaded the latest project version for you. Please try again.');
      } else {
        const message = err.response?.data?.message || err.message || 'Failed to refresh construction snapshot.';
        setError(message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      {/* Compact Page Header */}
      <div className="mb-6 space-y-1">
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          PHASE 4 · STEP 4.1
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Construction Snapshot
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          See what’s ready, what needs attention, and where to go next.
        </p>
      </div>

      {/* Construction Snapshot Content */}
      <ConstructionSnapshotView
        ideaId={effectiveIdeaId}
        projectName={projectName}
        snapshot={snapshot}
        updateAvailable={updateAvailable}
        changedSources={changedSources}
        isLoading={isLoading}
        isGenerating={isGenerating}
        error={error}
        onGenerate={handleGenerate}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
