'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { GtmStrategyView } from '@/components/creator/phase4/GtmStrategyView';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  getGtmStrategy,
  generateGtmStrategy,
  refreshGtmStrategy,
  updateGtmChannel,
  recordExperimentRun,
} from '@/lib/api-creator-gtm';
import type {
  GtmStrategyResponse,
  UpdateGtmChannelRequest,
  RecordExperimentRunRequest,
} from '@/types/creator/gtm';

export default function CreatorPhase4GtmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono text-sm">
          Loading GTM & Launch Strategy Engine...
        </div>
      }
    >
      <CreatorPhase4GtmInner />
    </Suspense>
  );
}

function CreatorPhase4GtmInner() {
  const searchParams = useSearchParams();
  const { state: progressState } = useCreatorProgress();
  const ideaId = searchParams.get('ideaId') || progressState?.activeIdeaId || '';

  return (
    <Phase4ProfileGuard>
      <GtmPageContent ideaId={ideaId} />
    </Phase4ProfileGuard>
  );
}

function GtmPageContent({ ideaId }: { ideaId: string }) {
  const { state: progressState, refetch } = useCreatorProgress();
  const effectiveIdeaId = ideaId || progressState?.activeIdeaId || '';
  const projectName = progressState?.project?.name || 'Your Project';

  const [data, setData] = useState<GtmStrategyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gateError, setGateError] = useState<{ code: string; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!effectiveIdeaId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await getGtmStrategy(effectiveIdeaId);
      setData(res);
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        setData(null);
      } else if (
        err.message &&
        (err.message.includes('PricingStrategy') ||
          err.message.includes('Pricing') ||
          err.message.includes('Phase 4.6') ||
          err.message.includes('PREREQUISITE_GATE_FAILED'))
      ) {
        setGateError({
          code: 'PREREQUISITE_GATE_FAILED',
          message: err.message,
        });
      } else {
        setError(err.message || 'Failed to load GTM strategy.');
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
      setGateError(null);
      const res = await generateGtmStrategy(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      if (err.message && (err.message.includes('Pricing') || err.message.includes('PREREQUISITE_GATE_FAILED'))) {
        setGateError({ code: 'PREREQUISITE_GATE_FAILED', message: err.message });
      } else {
        setError(err.message || "We couldn't generate your GTM strategy.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!effectiveIdeaId) return;
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await refreshGtmStrategy(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      if (err.message && (err.message.includes('Pricing') || err.message.includes('PREREQUISITE_GATE_FAILED'))) {
        setGateError({ code: 'PREREQUISITE_GATE_FAILED', message: err.message });
      } else {
        setError(err.message || "We couldn't refresh your GTM strategy.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChannel = async (channelKey: string, req: UpdateGtmChannelRequest) => {
    if (!effectiveIdeaId) return;
    try {
      const res = await updateGtmChannel(channelKey, req, effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      setError(err.message || "Couldn't update channel priority.");
      throw err;
    }
  };

  const handleUpdateStrategy = async (req: any) => {
    if (!effectiveIdeaId) return;
    try {
      const res = await import('@/lib/api-creator-gtm').then((m) =>
        m.updateGtmStrategy(req, effectiveIdeaId)
      );
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      setError(err.message || "Couldn't update GTM strategy.");
      throw err;
    }
  };

  const handleRecordExperimentRun = async (experimentKey: string, req: RecordExperimentRunRequest) => {
    if (!effectiveIdeaId) return;
    try {
      const res = await recordExperimentRun(experimentKey, req, effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      setError(err.message || "Couldn't record experiment run.");
      throw err;
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

      {/* Main View */}
      <GtmStrategyView
        ideaId={effectiveIdeaId}
        projectName={projectName}
        strategy={data?.strategy || null}
        updateAvailable={data?.updateAvailable || false}
        changedSources={data?.changedSources || []}
        isLoading={loading}
        gateError={
          gateError ||
          (data?.prerequisiteGate && !data.prerequisiteGate.canAccess
            ? {
                code: 'PREREQUISITE_GATE_FAILED',
                message: data.prerequisiteGate.blockingReasons.join(' '),
              }
            : null)
        }
        onGenerate={handleGenerate}
        onRefresh={handleRefresh}
        onUpdateChannel={handleUpdateChannel}
        onUpdateStrategy={handleUpdateStrategy}
        onRecordExperimentRun={handleRecordExperimentRun}
      />
    </div>
  );
}

