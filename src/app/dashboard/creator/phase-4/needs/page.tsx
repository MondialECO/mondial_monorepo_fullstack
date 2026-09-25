'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { NeedsAnalysisView } from '@/components/creator/phase4/NeedsAnalysisView';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  getNeedsAnalysis,
  generateNeedsAnalysis,
  refreshNeedsAnalysis,
  updateNeedState,
  keepCurrentNeeds,
} from '@/lib/api-creator-needs';
import type {
  NeedsAnalysisResponse,
  UpdateNeedStateRequest,
} from '@/types/creator/needs';

export default function CreatorPhase4NeedsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          Loading Needs & Requirements...
        </div>
      }
    >
      <CreatorPhase4NeedsInner />
    </Suspense>
  );
}

function CreatorPhase4NeedsInner() {
  const searchParams = useSearchParams();
  const { state: progressState } = useCreatorProgress();
  const ideaId = searchParams.get('ideaId') || progressState?.activeIdeaId || '';

  return (
    <Phase4ProfileGuard>
      <NeedsPageContent ideaId={ideaId} />
    </Phase4ProfileGuard>
  );
}

function NeedsPageContent({ ideaId }: { ideaId: string }) {
  const { state: progressState, refetch } = useCreatorProgress();
  const [data, setData] = useState<NeedsAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gateError, setGateError] = useState<{ code: string; message: string } | null>(null);

  const effectiveIdeaId = ideaId || progressState?.activeIdeaId || '';
  const projectName = progressState?.project?.name || 'Your Venture';

  const loadNeeds = useCallback(async () => {
    if (!effectiveIdeaId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setGateError(null);
    try {
      const res: NeedsAnalysisResponse = await getNeedsAnalysis(effectiveIdeaId);
      setData(res);
    } catch (err: any) {
      if (err?.response?.status === 404 || (err?.message && err.message.includes('404'))) {
        setData(null);
      } else {
        console.warn('Could not load needs analysis:', err);
        setError(err.response?.data?.message || err.message || "We couldn't load your needs analysis.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [effectiveIdeaId]);

  useEffect(() => {
    loadNeeds();
  }, [loadNeeds]);

  const handleGenerate = async () => {
    if (!effectiveIdeaId) {
      setError('ideaId is required for Creator changes. Please open your project from the dashboard.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    setGateError(null);
    try {
      const res = await generateNeedsAnalysis(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadNeeds();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. We loaded the latest project version for you. Please try again.');
      } else if (err.code) {
        setGateError({ code: err.code, message: err.message });
      } else {
        const message = err.response?.data?.message || err.message || "We couldn't generate your needs analysis.";
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
    setGateError(null);
    try {
      const res = await refreshNeedsAnalysis(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadNeeds();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. We loaded the latest project version for you. Please try again.');
      } else if (err.code) {
        setGateError({ code: err.code, message: err.message });
      } else {
        const message = err.response?.data?.message || err.message || 'Failed to refresh needs analysis.';
        setError(message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateNeedState = async (needKey: string, req: UpdateNeedStateRequest) => {
    if (!effectiveIdeaId) return;
    try {
      const res = await updateNeedState(effectiveIdeaId, needKey, req);
      setData(res);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadNeeds();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. Please review and retry.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to update requirement state.');
      }
      throw err;
    }
  };

  const handleKeepCurrent = async () => {
    if (!effectiveIdeaId) return;
    try {
      const res = await keepCurrentNeeds(effectiveIdeaId);
      setData(res);
    } catch (err: any) {
      console.warn('Could not preserve current version:', err);
    }
  };

  return (
    <div className="w-full max-w-[1120px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 animate-fadeIn">
      {/* Compact Page Header (Aligned with Phase 4 Canon) */}
      <div className="space-y-1">
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          PHASE 4 · STEP 4.3
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Needs & Requirements
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Review what your project needs, what you already have, and what remains to be covered.
        </p>
      </div>

      {/* Main Needs Analysis View */}
      <NeedsAnalysisView
        ideaId={effectiveIdeaId}
        projectName={projectName}
        analysis={data?.needsAnalysis || null}
        updateAvailable={data?.updateAvailable || false}
        changedSources={data?.changedSources || []}
        totalActiveNeeds={data?.totalActiveNeeds || 0}
        criticalCount={data?.criticalCount || 0}
        highCount={data?.highCount || 0}
        satisfiedCount={data?.satisfiedCount || 0}
        isLoading={isLoading}
        isGenerating={isGenerating}
        error={error}
        gateError={gateError}
        onGenerate={handleGenerate}
        onRefresh={handleRefresh}
        onUpdateNeedState={handleUpdateNeedState}
        onKeepCurrent={handleKeepCurrent}
        onClearError={() => setError(null)}
      />
    </div>
  );
}
