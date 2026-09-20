'use client';

import React, { useEffect, useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { OperationalRoadmapView } from '@/components/creator/phase4/OperationalRoadmapView';
import {
  getOperationalRoadmap,
  generateOperationalRoadmap,
  refreshOperationalRoadmap,
  updateRoadmapTask,
} from '@/lib/api-creator-roadmap';
import type {
  OperationalRoadmapResponse,
  RoadmapTaskStatus,
} from '@/types/creator/roadmap';

export default function CreatorPhase4RoadmapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Operational Roadmap...</div>}>
      <Phase4ProfileGuard>
        <RoadmapPageContent />
      </Phase4ProfileGuard>
    </Suspense>
  );
}

function RoadmapPageContent() {
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('ideaId') || '';

  const [data, setData] = useState<OperationalRoadmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOperationalRoadmap(ideaId);
      setData(res);
    } catch (err: any) {
      // 404 means not generated yet
      if (err.message && err.message.includes('404')) {
        setData(null);
      } else {
        setError(err.message || "We couldn't build your roadmap.");
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
      const res = await generateOperationalRoadmap(ideaId);
      setData(res);
    } catch (err: any) {
      setError(err.message || "We couldn't build your roadmap.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await refreshOperationalRoadmap(ideaId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh roadmap.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: RoadmapTaskStatus) => {
    try {
      const res = await updateRoadmapTask(ideaId, { taskId, status });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to update task.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <Link
              href={`/dashboard/creator/phase-4?ideaId=${encodeURIComponent(ideaId)}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Construction Snapshot</span>
            </Link>
            <div className="text-xs uppercase tracking-wider font-semibold text-indigo-400">
              PHASE 4 · CONSTRUCTION & LAUNCH PREPARATION
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              STEP 4.2 · OPERATIONAL ROADMAP
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Know what to do — and in what order.
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              MBC turns your construction snapshot, business plan, legal timeline and availability into a realistic execution roadmap.
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">We couldn't build your roadmap.</div>
                <div className="text-xs text-rose-300 mt-1">Your existing project data is safe.</div>
                <div className="text-xs text-rose-400/80 mt-1 font-mono">{error}</div>
              </div>
            </div>
            <button
              onClick={() => {
                if (!data?.roadmap) {
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

        {/* Roadmap View */}
        <OperationalRoadmapView
          ideaId={ideaId}
          projectName="Your Venture"
          roadmap={data?.roadmap || null}
          updateAvailable={data?.updateAvailable || false}
          changedSources={data?.changedSources || []}
          totalTasks={data?.totalTasks || 0}
          activeTasks={data?.activeTasks || 0}
          criticalTasks={data?.criticalTasks || 0}
          completedTasks={data?.completedTasks || 0}
          isLoading={loading}
          onGenerate={handleGenerate}
          onRefresh={handleRefresh}
          onUpdateTaskStatus={handleUpdateTaskStatus}
        />
      </div>
    </div>
  );
}
