'use client';

import React, { useEffect, useState, useCallback, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { ConstructionSnapshotView } from '@/components/creator/phase4/ConstructionSnapshotView';
import { 
  getConstructionSnapshot, 
  generateConstructionSnapshot, 
  refreshConstructionSnapshot 
} from '@/lib/api-creator-phase4';
import { ConstructionSnapshot, ConstructionSnapshotResponse } from '@/types/creator/phase4';

export default function CreatorPhase4Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Construction Snapshot...</div>}>
      <CreatorPhase4Inner />
    </Suspense>
  );
}

function CreatorPhase4Inner() {
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('ideaId') || '';

  return (
    <Phase4ProfileGuard>
      <Phase4Content ideaId={ideaId} />
    </Phase4ProfileGuard>
  );
}

function Phase4Content({ ideaId }: { ideaId: string }) {
  const [snapshot, setSnapshot] = useState<ConstructionSnapshot | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [changedSources, setChangedSources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('Your Project');

  const loadSnapshot = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: ConstructionSnapshotResponse = await getConstructionSnapshot(ideaId);
      if (res.snapshot) {
        setSnapshot(res.snapshot);
      } else {
        setSnapshot(null);
      }
      setUpdateAvailable(res.updateAvailable || false);
      setChangedSources(res.changedSources || []);
    } catch (err: any) {
      console.warn('Could not load construction snapshot:', err);
      // Empty/not generated snapshot might 404 or return empty, which is valid empty state
      setSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  }, [ideaId]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await generateConstructionSnapshot(ideaId);
      if (res.snapshot) {
        setSnapshot(res.snapshot);
      }
      setUpdateAvailable(res.updateAvailable || false);
      setChangedSources(res.changedSources || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate construction snapshot.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await refreshConstructionSnapshot(ideaId);
      if (res.snapshot) {
        setSnapshot(res.snapshot);
      }
      setUpdateAvailable(false);
      setChangedSources([]);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh construction snapshot.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Canonical Phase 4 Header */}
        <div className="space-y-3 pb-8 border-b border-slate-800">
          <div className="text-xs uppercase font-bold tracking-widest text-emerald-400">
            PHASE 4 · CONSTRUCTION & LAUNCH PREPARATION
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Turn your business plan into an action plan.
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            MBC combines your business intelligence with your skills, situation and resources to help you understand what is ready, what is missing and what needs attention next.
          </p>
        </div>

        {/* Canonical Step 4.1 Header */}
        <div className="space-y-2">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            STEP 4.1 · CONSTRUCTION SNAPSHOT
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            See what is ready — and what is still missing.
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl">
            MBC reviews your project, business plan and professional profile to build a complete construction snapshot.
          </p>
        </div>

        {/* Construction Snapshot Main View */}
        <ConstructionSnapshotView
          ideaId={ideaId}
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
    </div>
  );
}
