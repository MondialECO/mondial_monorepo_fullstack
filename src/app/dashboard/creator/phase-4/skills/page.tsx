'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { SkillsPlanView } from '@/components/creator/phase4/SkillsPlanView';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  getSkillsPlan,
  generateSkillsPlan,
  refreshSkillsPlan,
  updateResolution,
  keepCurrentSkills,
} from '@/lib/api-creator-skills';
import type {
  SkillsPlanResponse,
  UpdateResolutionRequest,
} from '@/types/creator/skills';

export default function CreatorPhase4SkillsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono text-sm">
          Loading Skills & Training Plan...
        </div>
      }
    >
      <CreatorPhase4SkillsInner />
    </Suspense>
  );
}

function CreatorPhase4SkillsInner() {
  const searchParams = useSearchParams();
  const { state: progressState } = useCreatorProgress();
  const ideaId = searchParams.get('ideaId') || progressState?.activeIdeaId || '';

  return (
    <Phase4ProfileGuard>
      <SkillsPageContent ideaId={ideaId} />
    </Phase4ProfileGuard>
  );
}

function SkillsPageContent({ ideaId }: { ideaId: string }) {
  const { state: progressState, refetch } = useCreatorProgress();
  const [data, setData] = useState<SkillsPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gateError, setGateError] = useState<{ code: string; message: string } | null>(null);

  const effectiveIdeaId = ideaId || progressState?.activeIdeaId || '';
  const projectName = progressState?.project?.name || 'Your Venture';

  const loadSkills = useCallback(async () => {
    if (!effectiveIdeaId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setGateError(null);
    try {
      const res: SkillsPlanResponse = await getSkillsPlan(effectiveIdeaId);
      setData(res);
    } catch (err: any) {
      if (err?.response?.status === 404 || (err?.message && err.message.includes('404'))) {
        setData(null);
      } else {
        console.warn('Could not load skills plan:', err);
        setError(err.response?.data?.message || err.message || "We couldn't load your skills plan.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [effectiveIdeaId]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleGenerate = async () => {
    if (!effectiveIdeaId) {
      setError('ideaId is required for Creator changes. Please open your project from the dashboard.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    setGateError(null);
    try {
      const res = await generateSkillsPlan(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadSkills();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. We loaded the latest project version for you. Please try again.');
      } else if (err.code) {
        setGateError({ code: err.code, message: err.message });
      } else if (err.message && (err.message.includes('Needs') || err.message.includes('Phase 3'))) {
        setGateError({ code: 'PREREQUISITE_FAILED', message: err.message });
      } else {
        const message = err.response?.data?.message || err.message || "We couldn't generate your skills plan.";
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
      const res = await refreshSkillsPlan(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadSkills();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. We loaded the latest project version for you. Please try again.');
      } else if (err.code) {
        setGateError({ code: err.code, message: err.message });
      } else {
        const message = err.response?.data?.message || err.message || 'Failed to refresh skills plan.';
        setError(message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateResolution = async (resolutionKey: string, req: UpdateResolutionRequest) => {
    if (!effectiveIdeaId) return;
    try {
      const res = await updateResolution(effectiveIdeaId, resolutionKey, req);
      setData(res);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await loadSkills();
        await refetch(effectiveIdeaId);
        setError('This idea was updated in another tab. Please review and retry.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to update decision.');
      }
      throw err;
    }
  };

  const handleKeepCurrent = async () => {
    if (!effectiveIdeaId) return;
    try {
      const res = await keepCurrentSkills(effectiveIdeaId);
      setData(res);
    } catch (err: any) {
      console.warn('Could not preserve current version:', err);
    }
  };

  return (
    <div className="w-full max-w-[1120px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 animate-fadeIn">
      {/* Compact Page Header (Aligned with Phase 4 Canon & Figma) */}
      <div className="space-y-1">
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase font-mono">
          PHASE 4 · STEP 4.4
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Skills & Training Plan
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Map capabilities to learn, delegate, or verify based on your background, project scope, and weekly time.
        </p>
      </div>

      {/* Main Skills Plan View */}
      <SkillsPlanView
        ideaId={effectiveIdeaId}
        projectName={projectName}
        plan={data?.skillsPlan || null}
        updateAvailable={data?.updateAvailable || false}
        changedSources={data?.changedSources || []}
        profileSummary={data?.profileContext || data?.founderProfileSummary}
        isLoading={isLoading}
        isGenerating={isGenerating}
        error={error}
        gateError={gateError}
        onGenerate={handleGenerate}
        onRefresh={handleRefresh}
        onUpdateResolution={handleUpdateResolution}
        onKeepCurrent={handleKeepCurrent}
        onClearError={() => setError(null)}
      />
    </div>
  );
}
