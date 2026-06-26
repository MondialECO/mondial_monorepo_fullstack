'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCcw, ShieldCheck, TrendingUp, FileText, Zap, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { Phase7ReviewVisuals } from '@/components/entrepreneur/dataroom/Phase7ReviewVisuals';
import entrepreneurApi, { AiReviewResponse } from '@/lib/api-entrepreneur';
import { Phase7Data } from '@/types/entrepreneur';

function KPICard({ title, value, subtext, badge, badgeColor }: { title: string; value: string; subtext?: string; badge: string; badgeColor?: 'green' | 'yellow' | 'red' | 'blue' }) {
  const badgeStyles = {
    green: 'bg-success/10 text-success-text',
    yellow: 'bg-warning/10 text-warning',
    red: 'bg-destructive/10 text-destructive',
    blue: 'bg-primary/10 text-primary',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="text-center space-y-2">
        <p className="text-2xl font-semibold text-foreground">
          {value}
          {subtext && <span className="text-sm text-muted-foreground font-normal ml-1">{subtext}</span>}
        </p>
        <div className={`px-2 py-1 rounded-full inline-block text-xs font-medium ${badgeStyles[badgeColor || 'blue']}`}>
          {badge}
        </div>
      </div>
    </div>
  );
}

function Phase7Content() {
  const router = useRouter();
  const { savePhaseData, moveToNextStep, getPhaseData, applyBackendResponse, currentPhase } = useEntrepreneurProgress();

  const [review, setReview] = useState<AiReviewResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase7Data = getPhaseData<Phase7Data>(7) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const reload = async () => {
    try {
      const companyId = await resolveCompanyId();
      const latest = await entrepreneurApi.getAiReview(companyId).catch(() => null);
      setReview(latest);
      const existing: Phase7Data = getPhaseData<Phase7Data>(7) ?? {};
      savePhaseData(7, { ...existing, __companyId: companyId, lastReviewRunAt: latest?.reviewedAt, lastReviewScore: latest?.overallScore });
    } catch {
      // empty hydration acceptable
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunReview = async () => {
    setError('');
    setIsRunning(true);
    try {
      const companyId = await resolveCompanyId();
      const result = await entrepreneurApi.runAiReview(companyId);
      setReview(result);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run review');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();
      const advanceResponse = await entrepreneurApi.advancePhase(companyId, 7, {});
      if (advanceResponse?.currentPhase !== 8) throw new Error(`Phase advancement failed - expected currentPhase=8, got ${advanceResponse?.currentPhase}`);
      if (!advanceResponse?.completedPhases?.includes(7)) throw new Error('Phase 7 not marked as completed in backend response');
      applyBackendResponse(advanceResponse);
      const existing: Phase7Data = getPhaseData<Phase7Data>(7) ?? {};
      savePhaseData(7, { ...existing, __companyId: companyId, submittedAt: new Date().toISOString() });
      moveToNextStep(7, 1);
      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-7/complete');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const overallScore = review?.overallScore ?? 0;
  const badge = review?.investorReadyBadge ?? false;
  const meetsThreshold = overallScore >= 70;
  const actionCount = review?.recommendations?.length ?? 0;

  return (
    <div className="space-y-6">
 
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Readiness Score" value={String(overallScore)} subtext="/100" badge={overallScore >= 80 ? '↑ Top tier' : '→ On track'} badgeColor={overallScore >= 80 ? 'green' : 'blue'} />
        <KPICard title="Actions Remaining" value={String(actionCount)} badge={actionCount > 0 ? `+${actionCount * 5} pts` : 'Complete'} badgeColor={actionCount > 0 ? 'yellow' : 'green'} />
        <KPICard title="Missing Documents" value={actionCount > 0 ? String(actionCount) : '0'} badge="Data Room" badgeColor="red" />
        <KPICard title="Pitch Deck Grade" value={review?.pitchDeckAnalysis?.grade ?? '—'} badge={review?.pitchDeckAnalysis ? 'Analyzed' : 'Not available'} badgeColor={review?.pitchDeckAnalysis?.grade && ['A+', 'A'].includes(review.pitchDeckAnalysis.grade) ? 'green' : 'blue'} />
      </div>

      {/* Investor-Ready Profile + Visuals */}
      <Phase7ReviewVisuals review={review} />

      {/* Run Review */}
      {!review && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">Start Readiness Review</h3>
              <p className="text-xs text-muted-foreground mt-1">Run the automated review engine to score your company</p>
            </div>
            <Button onClick={handleRunReview} disabled={isRunning} className="gap-2">
              <RefreshCcw className="w-4 h-4" />
              {isRunning ? 'Running…' : 'Run review'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Click to analyze Phases 2–6 data against investor readiness criteria.</p>
        </div>
      )}

      {review && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">Review Controls</h3>
              <p className="text-xs text-muted-foreground mt-1">Last run {new Date(review.reviewedAt).toLocaleString()}</p>
            </div>
            <Button onClick={handleRunReview} disabled={isRunning} variant="outline" className="gap-2">
              <RefreshCcw className="w-4 h-4" />
              {isRunning ? 'Running…' : 'Re-run review'}
            </Button>
          </div>
        </div>
      )}

      {/* Validator Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-primary">
          Phase 7 requires: fresh review (&lt; 30 days), score ≥ 70, investor-ready badge. All 3 gates must pass to advance to Phase 8.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-destructive">{error}</p>
        </div>
      )}

      {currentPhase! <= 7 && (
        <StepFooter backUrl="/dashboard/entrepreneur/phase-6" onNextClick={handleSubmit} isLoading={isSubmitting} nextLabel="Submit & Complete Phase 7" nextValidationError={error} isNextDisabled={!review || !meetsThreshold || !badge} />
      )}
    </div>
  );
}

export default function Phase7Page() {
  return (
    <RouteGuard requiredPhase={7}>
      {/* <EntrepreneurLayout sidebar={<div />}> */}
        <div className="space-y-6 md:space-y-8">
          <PhaseHeader title="Automated Readiness Review" subtitle="A deterministic rules engine scores your company against Phases 2–6 data. This determines investor-readiness." progressLabel="PROGRESS" progressValue="Phase 7 of 9" progressPercentage={78} />
          <Phase7Content />
        </div>
      {/* </EntrepreneurLayout> */}
    </RouteGuard>
  );
}
