'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { NeedsAnalysisView } from '@/components/creator/phase4/NeedsAnalysisView';
import {
  getNeedsAnalysis,
  generateNeedsAnalysis,
  refreshNeedsAnalysis,
  updateNeedState,
} from '@/lib/api-creator-needs';
import type {
  NeedsAnalysisResponse,
  UpdateNeedStateRequest,
} from '@/types/creator/needs';

export default function CreatorPhase4NeedsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Loading Needs & Requirements...
        </div>
      }
    >
      <Phase4ProfileGuard>
        <NeedsPageContent />
      </Phase4ProfileGuard>
    </Suspense>
  );
}

function NeedsPageContent() {
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('ideaId') || '';

  const [data, setData] = useState<NeedsAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gateError, setGateError] = useState<{ code: string; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await getNeedsAnalysis(ideaId);
      setData(res);
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        setData(null);
      } else {
        setError(err.message || "We couldn't load your needs analysis.");
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
      const res = await generateNeedsAnalysis(ideaId);
      setData(res);
    } catch (err: any) {
      if (err.code) {
        setGateError({ code: err.code, message: err.message });
      } else {
        setError(err.message || "We couldn't generate your needs analysis.");
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
      const res = await refreshNeedsAnalysis(ideaId);
      setData(res);
    } catch (err: any) {
      if (err.code) {
        setGateError({ code: err.code, message: err.message });
      } else {
        setError(err.message || 'Failed to refresh needs analysis.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNeedState = async (needKey: string, req: UpdateNeedStateRequest) => {
    try {
      const res = await updateNeedState(ideaId, needKey, req);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to update requirement state.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <Link
              href={`/dashboard/creator/phase-4/roadmap?ideaId=${encodeURIComponent(ideaId)}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Operational Roadmap</span>
            </Link>
            <div className="text-xs uppercase tracking-wider font-semibold text-indigo-400">
              PHASE 4 · CONSTRUCTION & LAUNCH PREPARATION
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              STEP 4.3 · NEEDS & REQUIREMENTS ENGINE
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Define what you need to build and launch.
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              MBC converts your construction snapshot gaps and operational roadmap into a structured, traceable inventory of team, services, technology, legal, and capital requirements.
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">We couldn't process your needs analysis.</div>
                <div className="text-xs text-rose-300 mt-1">Your existing project data is safe.</div>
                <div className="text-xs text-rose-400/80 mt-1 font-mono">{error}</div>
              </div>
            </div>
            <button
              onClick={() => {
                if (!data?.needsAnalysis) {
                  handleGenerate();
                } else {
                  fetchData();
                }
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Needs Analysis View */}
        <NeedsAnalysisView
          ideaId={ideaId}
          projectName="Your Venture"
          analysis={data?.needsAnalysis || null}
          updateAvailable={data?.updateAvailable || false}
          changedSources={data?.changedSources || []}
          totalActiveNeeds={data?.totalActiveNeeds || 0}
          criticalCount={data?.criticalCount || 0}
          highCount={data?.highCount || 0}
          satisfiedCount={data?.satisfiedCount || 0}
          isLoading={loading}
          gateError={gateError}
          onGenerate={handleGenerate}
          onRefresh={handleRefresh}
          onUpdateNeedState={handleUpdateNeedState}
        />
      </div>
    </div>
  );
}
