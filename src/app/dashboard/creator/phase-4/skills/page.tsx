'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { SkillsPlanView } from '@/components/creator/phase4/SkillsPlanView';
import {
  getSkillsPlan,
  generateSkillsPlan,
  refreshSkillsPlan,
  updateResolution,
} from '@/lib/api-creator-skills';
import type {
  SkillsPlanResponse,
  UpdateResolutionRequest,
} from '@/types/creator/skills';

export default function CreatorPhase4SkillsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
          Loading Skills & Training Plan...
        </div>
      }
    >
      <Phase4ProfileGuard>
        <SkillsPageContent />
      </Phase4ProfileGuard>
    </Suspense>
  );
}

function SkillsPageContent() {
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('ideaId') || '';

  const [data, setData] = useState<SkillsPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gateError, setGateError] = useState<{ code: string; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await getSkillsPlan(ideaId);
      setData(res);
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        setData(null);
      } else {
        setError(err.message || "We couldn't load your skills plan.");
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
      const res = await generateSkillsPlan(ideaId);
      setData(res);
    } catch (err: any) {
      if (err.code) {
        setGateError({ code: err.code, message: err.message });
      } else if (err.message && (err.message.includes('Needs') || err.message.includes('Phase 3'))) {
        setGateError({ code: 'PREREQUISITE_FAILED', message: err.message });
      } else {
        setError(err.message || "We couldn't generate your skills plan.");
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
      const res = await refreshSkillsPlan(ideaId);
      setData(res);
    } catch (err: any) {
      if (err.code) {
        setGateError({ code: err.code, message: err.message });
      } else {
        setError(err.message || "We couldn't refresh your skills plan.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResolution = async (resolutionKey: string, req: UpdateResolutionRequest) => {
    try {
      const res = await updateResolution(ideaId, resolutionKey, req);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Couldn't update your decision.");
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Banner Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href={`/dashboard/creator/phase-4/needs?ideaId=${ideaId}`}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Step 4.3 Needs & Requirements
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>4.1 Snapshot ✓</span>
            <span>4.2 Roadmap ✓</span>
            <span>4.3 Needs ✓</span>
            <span className="text-emerald-400 font-semibold">4.4 Skills (Current)</span>
            <span className="text-slate-600">4.5 Grants</span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="max-w-6xl mx-auto p-6">
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
      <SkillsPlanView
        ideaId={ideaId}
        projectName="Your Project"
        plan={data?.skillsPlan || null}
        updateAvailable={data?.updateAvailable || false}
        changedSources={data?.changedSources || []}
        profileSummary={data?.founderProfileSummary}
        isLoading={loading}
        gateError={gateError}
        onGenerate={handleGenerate}
        onRefresh={handleRefresh}
        onUpdateResolution={handleUpdateResolution}
      />
    </div>
  );
}
