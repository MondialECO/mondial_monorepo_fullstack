'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { GtmStrategyView } from '@/components/creator/phase4/GtmStrategyView';
import {
  getGtmStrategy,
  generateGtmStrategy,
  refreshGtmStrategy,
  updateGtmChannel,
  recordExperimentRun
} from '@/lib/api-creator-gtm';
import type {
  GtmStrategyResponse,
  UpdateGtmChannelRequest,
  RecordExperimentRunRequest
} from '@/types/creator/gtm';

export default function CreatorPhase4GtmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
          Loading GTM & Launch Strategy Engine...
        </div>
      }
    >
      <Phase4ProfileGuard>
        <GtmPageContent />
      </Phase4ProfileGuard>
    </Suspense>
  );
}

function GtmPageContent() {
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('ideaId') || '';

  const [data, setData] = useState<GtmStrategyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gateError, setGateError] = useState<{ code: string; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await getGtmStrategy(ideaId);
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
          message: err.message
        });
      } else {
        setError(err.message || 'Failed to load GTM strategy.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ideaId]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await generateGtmStrategy(ideaId);
      setData(res);
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
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await refreshGtmStrategy(ideaId);
      setData(res);
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
    try {
      const res = await updateGtmChannel(channelKey, req);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Couldn't update channel priority.");
      throw err;
    }
  };

  const handleRecordExperimentRun = async (experimentKey: string, req: RecordExperimentRunRequest) => {
    try {
      const res = await recordExperimentRun(experimentKey, req);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Couldn't record experiment run.");
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Banner Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href={`/dashboard/creator/phase-4/pricing?ideaId=${ideaId}`}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Step 4.6 Pricing Strategy
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>4.1 Snapshot ✓</span>
            <span>4.2 Roadmap ✓</span>
            <span>4.3 Needs ✓</span>
            <span>4.4 Skills ✓</span>
            <span>4.5 Grants ✓</span>
            <span>4.6 Pricing ✓</span>
            <span className="text-emerald-400 font-semibold">4.7 GTM (Current)</span>
            <span className="text-slate-600">4.8 Launch Assets (Locked)</span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-200">Error</h4>
              <p className="text-xs text-red-300/80">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-400 hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main View */}
      <GtmStrategyView
        ideaId={ideaId}
        projectName="Your Project"
        strategy={data?.strategy || null}
        updateAvailable={data?.updateAvailable || false}
        changedSources={data?.changedSources || []}
        isLoading={loading}
        gateError={
          gateError ||
          (data?.prerequisiteGate && !data.prerequisiteGate.canAccess
            ? {
                code: 'PREREQUISITE_GATE_FAILED',
                message: data.prerequisiteGate.blockingReasons.join(' ')
              }
            : null)
        }
        onGenerate={handleGenerate}
        onRefresh={handleRefresh}
        onUpdateChannel={handleUpdateChannel}
        onRecordExperimentRun={handleRecordExperimentRun}
      />
    </div>
  );
}
