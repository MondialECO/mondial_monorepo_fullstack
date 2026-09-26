'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { LaunchAssetsView } from '@/components/creator/phase4/LaunchAssetsView';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  getLaunchAssets,
  generateLaunchAssets,
  refreshLaunchAssets,
  updateLaunchAssets,
  createNewVersion,
  selectVersion,
  getSourceCode,
} from '@/lib/api-creator-launch-assets';
import type {
  LaunchAssetsResponse,
  UpdateLaunchAssetsRequest,
} from '@/types/creator/launch-assets';

export default function CreatorPhase4AssetsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono text-sm">
          Loading Launch Assets Engine...
        </div>
      }
    >
      <CreatorPhase4AssetsInner />
    </Suspense>
  );
}

function CreatorPhase4AssetsInner() {
  const searchParams = useSearchParams();
  const { state: progressState } = useCreatorProgress();
  const ideaId = searchParams.get('ideaId') || progressState?.activeIdeaId || '';

  return (
    <Phase4ProfileGuard>
      <AssetsPageContent ideaId={ideaId} />
    </Phase4ProfileGuard>
  );
}

function AssetsPageContent({ ideaId }: { ideaId: string }) {
  const { state: progressState, refetch } = useCreatorProgress();
  const effectiveIdeaId = ideaId || progressState?.activeIdeaId || '';
  const projectName = progressState?.project?.name || 'Your Project';

  const [data, setData] = useState<LaunchAssetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!effectiveIdeaId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await getLaunchAssets(effectiveIdeaId);
      setData(res);
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        setData(null);
      } else {
        setError(err.message || 'Failed to load Launch Assets.');
      }
    } finally {
      setLoading(false);
    }
  }, [effectiveIdeaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    if (!effectiveIdeaId) {
      setError('ideaId is required. Please open your project from the dashboard.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await generateLaunchAssets(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      setError(err.message || "We couldn't generate your launch assets.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!effectiveIdeaId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await refreshLaunchAssets(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      setError(err.message || "We couldn't refresh your launch assets.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssets = async (req: UpdateLaunchAssetsRequest) => {
    if (!effectiveIdeaId) return;
    try {
      const res = await updateLaunchAssets(effectiveIdeaId, req);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      setError(err.message || "Couldn't update launch assets.");
      throw err;
    }
  };

  const handleNewVersion = async () => {
    if (!effectiveIdeaId) return;
    try {
      const res = await createNewVersion(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      setError(err.message || "Couldn't create new version.");
      throw err;
    }
  };

  const handleSelectVersion = async () => {
    if (!effectiveIdeaId) return;
    try {
      const res = await selectVersion(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      setError(err.message || "Couldn't select version.");
      throw err;
    }
  };

  const handleDownloadSource = async () => {
    if (!effectiveIdeaId) return;
    try {
      const html = await getSourceCode(effectiveIdeaId);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-launch-page.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Couldn't download source code.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">Error</h4>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="min-h-[50vh] flex items-center justify-center font-mono text-sm text-muted-foreground">
          Loading Launch Assets...
        </div>
      ) : (
        <LaunchAssetsView
          ideaId={effectiveIdeaId}
          projectName={projectName}
          assets={data?.assets || null}
          updateAvailable={data?.updateAvailable || false}
          changedSources={data?.changedSources || []}
          isLoading={loading}
          onGenerate={handleGenerate}
          onRefresh={handleRefresh}
          onUpdateAssets={handleUpdateAssets}
          onNewVersion={handleNewVersion}
          onSelectVersion={handleSelectVersion}
          onDownloadSource={handleDownloadSource}
        />
      )}
    </div>
  );
}
