'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { ConstructionReadinessView } from '@/components/creator/phase4/ConstructionReadinessView';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  getReadinessAssessment,
  saveReadinessReview,
} from '@/lib/api-creator-readiness';
import type { ConstructionReadinessResponse } from '@/types/creator/construction-readiness';
import { useTranslation } from '@/hooks/useTranslation';

function ReadinessPageFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono text-sm">
      {t('creator.phase4.readinessPage.loading', 'Loading Construction Readiness...')}
    </div>
  );
}

export default function CreatorPhase4ReadinessPage() {
  return (
    <Suspense fallback={<ReadinessPageFallback />}>
      <CreatorPhase4ReadinessInner />
    </Suspense>
  );
}

function CreatorPhase4ReadinessInner() {
  const searchParams = useSearchParams();
  const { state: progressState } = useCreatorProgress();
  const ideaId = searchParams.get('ideaId') || progressState?.activeIdeaId || '';

  return (
    <Phase4ProfileGuard>
      <ReadinessPageContent ideaId={ideaId} />
    </Phase4ProfileGuard>
  );
}

function ReadinessPageContent({ ideaId }: { ideaId: string }) {
  const { t } = useTranslation();
  const { state: progressState, refetch } = useCreatorProgress();
  const effectiveIdeaId = ideaId || progressState?.activeIdeaId || '';
  const projectName = progressState?.project?.name || 'Your Project';

  const [data, setData] = useState<ConstructionReadinessResponse | null>(null);
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
      const res = await getReadinessAssessment(effectiveIdeaId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Construction Readiness assessment.');
    } finally {
      setLoading(false);
    }
  }, [effectiveIdeaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveReview = async () => {
    if (!effectiveIdeaId) {
      throw new Error('ideaId is required to save review. Please open your project from the dashboard.');
    }
    const res = await saveReadinessReview(effectiveIdeaId, undefined, data?.review?.sourceFingerprint);
    setData(res);
    await refetch(effectiveIdeaId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global Error Banner */}
      {error && (
        <div className="w-full min-w-0 pb-6">
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">{t('creator.phase4.error', 'Error')}</h4>
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
          {t('creator.phase4.readinessPage.loading', 'Loading Construction Readiness...')}
        </div>
      ) : (
        <ConstructionReadinessView
          ideaId={effectiveIdeaId}
          projectName={projectName}
          review={data?.review || null}
          isSaved={data?.isSaved || false}
          updateAvailable={data?.updateAvailable || false}
          changedSources={data?.changedSources || []}
          isLoading={loading}
          onSaveReview={handleSaveReview}
        />
      )}
    </div>
  );
}
