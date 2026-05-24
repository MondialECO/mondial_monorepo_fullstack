'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, BarChart3, History, Info, RefreshCcw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import entrepreneurApi, {
  AiReviewHistoryEntry,
  AiReviewResponse,
} from '@/lib/api-entrepreneur';
import { Phase7Data } from '@/types/entrepreneur';

const SCORE_LABELS: Array<{ key: keyof AiReviewResponse['scoreBreakdown']; label: string }> = [
  { key: 'verificationScore', label: 'Verification' },
  { key: 'financialScore', label: 'Financial' },
  { key: 'equityScore', label: 'Equity' },
  { key: 'fundingScore', label: 'Funding ask' },
  { key: 'dataRoomScore', label: 'Data room' },
];

function Phase7Content() {
  const router = useRouter();
  const { savePhaseData, moveToNextStep, getPhaseData, applyBackendResponse } =
    useEntrepreneurProgress();

  const [review, setReview] = useState<AiReviewResponse | null>(null);
  const [history, setHistory] = useState<AiReviewHistoryEntry[]>([]);
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
      const [latest, hist] = await Promise.all([
        entrepreneurApi.getAiReview(companyId).catch(() => null),
        entrepreneurApi.getAiReviewHistory(companyId).catch(() => [] as AiReviewHistoryEntry[]),
      ]);
      setReview(latest);
      setHistory(hist);
      const existing: Phase7Data = getPhaseData<Phase7Data>(7) ?? {};
      savePhaseData(7, {
        ...existing,
        __companyId: companyId,
        lastReviewRunAt: latest?.reviewedAt,
        lastReviewScore: latest?.overallScore,
      });
    } catch {
      // empty hydration is acceptable; user can still run the review
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
      if (advanceResponse?.currentPhase !== 8) {
        throw new Error(
          `Phase advancement failed - expected currentPhase=8, got ${advanceResponse?.currentPhase}`,
        );
      }
      if (!advanceResponse?.completedPhases?.includes(7)) {
        throw new Error('Phase 7 not marked as completed in backend response');
      }
      applyBackendResponse(advanceResponse);
      const existing: Phase7Data = getPhaseData<Phase7Data>(7) ?? {};
      savePhaseData(7, {
        ...existing,
        __companyId: companyId,
        submittedAt: new Date().toISOString(),
      });
      moveToNextStep(7, 1);
      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-8');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const overallScore = review?.overallScore ?? 0;
  const badge = review?.investorReadyBadge ?? false;
  const meetsThreshold = overallScore >= 70;

  return (
    <div className="space-y-6">
      {/* Dev-mode banner — explicit, non-removable until LLM credentials wired */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Automated rule-based review active</p>
          <p>
            Scores and recommendations are produced by a deterministic backend rules engine
            against your real Phase 2–6 data. LLM-generated expert review will replace this
            when AI provider credentials are configured.
          </p>
        </div>
      </div>

      {/* Latest snapshot summary — fully backend-derived */}
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-neutral-1">Automated Readiness Review</h3>
            <p className="text-xs text-neutral-5 mt-1">
              {review
                ? `Last run ${new Date(review.reviewedAt).toLocaleString()}`
                : 'No review has been run yet.'}
            </p>
          </div>
          <Button onClick={handleRunReview} disabled={isRunning} className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            {isRunning ? 'Running…' : review ? 'Re-run review' : 'Run review'}
          </Button>
        </div>

        {review ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
              <div className="md:col-span-2 bg-background border-2 border-neutral-2 rounded-xl p-4">
                <p className="text-xs uppercase text-neutral-5">Overall</p>
                <p className={`text-3xl font-bold ${meetsThreshold ? 'text-green-700' : 'text-amber-700'}`}>
                  {overallScore}
                </p>
                <p className="text-xs text-neutral-5 mt-1">/100 (threshold 70)</p>
              </div>
              {SCORE_LABELS.map(({ key, label }) => (
                <div key={key as string} className="bg-background border-2 border-neutral-2 rounded-xl p-4">
                  <p className="text-xs uppercase text-neutral-5">{label}</p>
                  <p className="text-xl font-bold text-neutral-1">
                    {review.scoreBreakdown[key]}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <ShieldCheck
                className={`w-5 h-5 ${badge ? 'text-green-700' : 'text-neutral-5'}`}
              />
              <p className={`text-sm font-semibold ${badge ? 'text-green-700' : 'text-neutral-5'}`}>
                {badge
                  ? 'Investor-ready threshold met — badge eligible'
                  : 'Below investor-ready threshold (badge not awarded)'}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-neutral-5">
            Click <strong>Run review</strong> to score your company against the current
            Phase 2–6 data. The result will appear here.
          </p>
        )}
      </div>

      {/* Recommendations — backend-generated only */}
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-3">
        <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Improvement recommendations
        </h3>
        {!review ? (
          <p className="text-sm text-neutral-5">Run a review to see recommendations.</p>
        ) : review.recommendations.length === 0 ? (
          <p className="text-sm text-neutral-5">
            No recommendations from this run — every sub-score is above its template threshold.
          </p>
        ) : (
          <div className="space-y-3">
            {review.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="bg-background border-2 border-neutral-2 rounded-xl p-4"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-neutral-1">{rec.title}</p>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : rec.priority === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-neutral-5">{rec.description}</p>
                <p className="text-xs text-neutral-5 mt-2">
                  Potential point gain: <strong>+{rec.potentialPointGain}</strong>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History — backend snapshots only */}
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-3">
        <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
          <History className="w-5 h-5" />
          Review history
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-neutral-5">No prior reviews yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between bg-background border-2 border-neutral-2 rounded-xl p-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-neutral-1">
                    Score {h.overallScore} · {h.investorReadyBadge ? 'badge eligible' : 'below threshold'}
                  </p>
                  <p className="text-xs text-neutral-5">
                    {new Date(h.reviewedAt).toLocaleString()} · engine: {h.engineVersion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Submitting Phase 7 advances you to Phase 8. The backend validator requires a
          fresh review (within 30 days), score ≥ 70, and the investor-ready badge flag set
          by the engine. Failed validation blocks progression.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-900">{error}</p>
        </div>
      )}

      <StepFooter
        backUrl="/dashboard/entrepreneur/phase-6"
        onNextClick={handleSubmit}
        isLoading={isSubmitting}
        nextLabel="Submit &amp; Complete Phase 7"
        nextValidationError={error}
        isNextDisabled={!review || !meetsThreshold || !badge}
      />
    </div>
  );
}

export default function Phase7Page() {
  return (
    <RouteGuard requiredPhase={7}>
      <EntrepreneurLayout sidebar={<div />}>
        <div className="space-y-6 md:space-y-8">
          <PhaseHeader
            title="Automated Readiness Review"
            subtitle="A deterministic rules engine scores your company against the data you submitted in Phases 2–6. LLM-based expert review is a future upgrade."
            progressLabel="PROGRESS"
            progressValue="Phase 7 of 9"
            progressPercentage={78}
          />
          <Phase7Content />
        </div>
      </EntrepreneurLayout>
    </RouteGuard>
  );
}
