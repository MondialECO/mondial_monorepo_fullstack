'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { SupportPlanView } from '@/components/creator/phase4/SupportPlanView';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  getSupportPlan,
  generateSupportPlan,
  refreshSupportPlan,
  updateFounderSupportState,
  answerEligibilityFact,
} from '@/lib/api-creator-support';
import type {
  SupportPlanResponse,
  UpdateFounderSupportStateRequest,
} from '@/types/creator/support';

export default function CreatorPhase4SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono text-sm">
          Loading Aids, Grants & Public Support Engine...
        </div>
      }
    >
      <CreatorPhase4SupportInner />
    </Suspense>
  );
}

function CreatorPhase4SupportInner() {
  const searchParams = useSearchParams();
  const { state: progressState } = useCreatorProgress();
  const ideaId = searchParams.get('ideaId') || progressState?.activeIdeaId || '';

  return (
    <Phase4ProfileGuard>
      <SupportPageContent ideaId={ideaId} />
    </Phase4ProfileGuard>
  );
}

function SupportPageContent({ ideaId }: { ideaId: string }) {
  const { state: progressState, refetch } = useCreatorProgress();
  const effectiveIdeaId = ideaId || progressState?.activeIdeaId || '';
  const projectName = progressState?.project?.name || 'Your Venture';

  const [data, setData] = useState<SupportPlanResponse | null>(null);
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
      const res = await getSupportPlan(effectiveIdeaId);
      setData(res);
      if (res.prerequisiteGate && !res.prerequisiteGate.canAccess) {
        setGateError({
          code: 'PREREQUISITE_FAILED',
          message: res.prerequisiteGate.blockingReasons?.join(' ') || 'Prerequisites not completed.',
        });
      }
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        setData(null);
      } else {
        setError(err.message || "We couldn't load your support plan.");
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
      setError('ideaId is required for Creator changes. Please open your project from the dashboard.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await generateSupportPlan(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      if (err.code) {
        setGateError({ code: err.code, message: err.message });
      } else if (
        err.message &&
        (err.message.includes('Skills') ||
          err.message.includes('Needs') ||
          err.message.includes('Phase 3'))
      ) {
        setGateError({ code: 'PREREQUISITE_FAILED', message: err.message });
      } else {
        setError(err.message || "We couldn't generate your support plan.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!effectiveIdeaId) {
      setError('ideaId is required for Creator changes. Please open your project from the dashboard.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await refreshSupportPlan(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      if (err.code) {
        setGateError({ code: err.code, message: err.message });
      } else {
        setError(err.message || "We couldn't refresh your support plan.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateState = async (matchKey: string, req: UpdateFounderSupportStateRequest) => {
    if (!effectiveIdeaId) return;
    try {
      const res = await updateFounderSupportState(effectiveIdeaId, matchKey, req);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Couldn't update your application state.");
      throw err;
    }
  };

  const handleAnswerFact = async (factKey: string, value: string) => {
    if (!effectiveIdeaId) return;
    try {
      const res = await answerEligibilityFact(effectiveIdeaId, factKey, value);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Couldn't update the eligibility fact.");
      throw err;
    }
  };

  return (
    <div className="w-full max-w-[1120px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 animate-fadeIn">
      {/* Compact Page-Level Header (Aligned with Phase 4 Canon & Figma) */}
      <div className="space-y-1">
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase font-mono">
          PHASE 4 · STEP 4.5
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Aids, Grants & Public Support
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Explore funding schemes, training support, and institutional backing for your venture.
        </p>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground">Notice</h4>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Support Plan View */}
      <SupportPlanView
        ideaId={effectiveIdeaId}
        projectName={projectName}
        plan={data?.supportPlan || null}
        updateAvailable={data?.updateAvailable || false}
        changedSources={data?.changedSources || []}
        profileSummary={data?.founderProfileSummary}
        isLoading={loading}
        gateError={gateError}
        onGenerate={handleGenerate}
        onRefresh={handleRefresh}
        onUpdateState={handleUpdateState}
        onAnswerFact={handleAnswerFact}
      />
    </div>
  );
}
