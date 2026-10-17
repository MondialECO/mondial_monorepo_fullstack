'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
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
  shareLaunchAssets,
} from '@/lib/api-creator-launch-assets';
import type {
  LaunchAssetsResponse,
  UpdateLaunchAssetsRequest,
} from '@/types/creator/launch-assets';
import { useTranslation } from '@/hooks/useTranslation';

function AssetsPageFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono text-sm">
      {t('creator.phase4.assetsPage.loading', 'Loading Launch Assets Engine...')}
    </div>
  );
}

export default function CreatorPhase4AssetsPage() {
  return (
    <Suspense fallback={<AssetsPageFallback />}>
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
  const { t } = useTranslation();
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

  const inFlightUpdateRef = useRef<Promise<void> | null>(null);

  const handleUpdateAssets = async (req: UpdateLaunchAssetsRequest): Promise<void> => {
    if (!effectiveIdeaId) return;
    if (inFlightUpdateRef.current) {
      return inFlightUpdateRef.current;
    }
    const updatePromise = (async () => {
      try {
        const res = await updateLaunchAssets(effectiveIdeaId, req);
        setData(res);
        await refetch(effectiveIdeaId);
      } catch (err: any) {
        setError(err.message || "Couldn't update launch assets.");
        throw err;
      } finally {
        inFlightUpdateRef.current = null;
      }
    })();
    inFlightUpdateRef.current = updatePromise;
    return updatePromise;
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

  const inFlightShareRef = useRef<Promise<string> | null>(null);

  const handleShareWebsite = async (version?: number): Promise<string> => {
    if (!effectiveIdeaId) throw new Error('ideaId is required to share website.');
    if (inFlightShareRef.current) {
      return inFlightShareRef.current;
    }
    const sharePromise = (async () => {
      try {
        const res = await shareLaunchAssets(effectiveIdeaId, version);
        setData((prev) => {
          if (!prev) return prev;
          const currentAssets = prev.assets;
          if (!currentAssets) return prev;
          return {
            ...prev,
            ideaVersion: res.ideaVersion ?? prev.ideaVersion,
            assets: {
              ...currentAssets,
              shareToken: res.shareToken,
              sharedAt: res.sharedAt,
              publishedStatus: res.publishedStatus || 'Anyone with the link can view this website.',
            },
          };
        });
        return res.shareToken;
      } catch (err: any) {
        setError(err.message || "Couldn't create shareable link for website.");
        throw err;
      } finally {
        inFlightShareRef.current = null;
      }
    })();
    inFlightShareRef.current = sharePromise;
    return sharePromise;
  };

  const handleDownloadSource = async (version?: number) => {
    if (!effectiveIdeaId) return;
    try {
      const targetVersion = version || data?.assets?.version || 1;
      const html = await getSourceCode(effectiveIdeaId, targetVersion);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeSlug = (projectName || 'project')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      a.download = `${safeSlug}-launch-page-v${targetVersion}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Couldn't download source code.");
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global Error Banner */}
      {error && (
        <div className="w-full min-w-0 pb-6">
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">
                {t('creator.phase4.error', 'Error')}
              </h4>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold"
            >
              {t('creator.phase4.dismiss', 'Dismiss')}
            </button>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="min-h-[50vh] flex items-center justify-center font-mono text-sm text-muted-foreground">
          {t('creator.phase4.assetsPage.loading', 'Loading Launch Assets Engine...')}
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
          onShareWebsite={handleShareWebsite}
        />
      )}
    </div>
  );
}
