'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Bookmark,
  Check,
  Info,
  MessageSquare,
  RefreshCcw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import entrepreneurApi, {
  InvestorMatchResponse,
  MatchingInsightsResponse,
} from '@/lib/api-entrepreneur';
import { Phase8Data } from '@/types/entrepreneur';

const INTERACTION_TYPES = ['view', 'message', 'call', 'proposal_sent', 'term_sheet'] as const;

export default function Phase8Client() {
  const router = useRouter();
  const { savePhaseData, moveToNextStep, getPhaseData, applyBackendResponse } =
    useEntrepreneurProgress();

  const [matches, setMatches] = useState<InvestorMatchResponse[]>([]);
  const [insights, setInsights] = useState<MatchingInsightsResponse | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase8Data = getPhaseData<Phase8Data>(8) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const reload = async () => {
    try {
      const companyId = await resolveCompanyId();
      const [m, i] = await Promise.all([
        entrepreneurApi.getInvestorMatches(companyId),
        entrepreneurApi.getMatchingInsights(companyId).catch(() => null),
      ]);
      setMatches(m);
      setInsights(i);
      const existing: Phase8Data = getPhaseData<Phase8Data>(8) ?? {};
      savePhaseData(8, {
        ...existing,
        __companyId: companyId,
        matchesCount: m.length,
        matchesGeneratedAt: m[0]?.matchedAt,
      });
    } catch {
      // empty hydration is fine; user can still regenerate
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = async () => {
    setError('');
    setIsRegenerating(true);
    try {
      const companyId = await resolveCompanyId();
      const fresh = await entrepreneurApi.regenerateInvestorMatches(companyId);
      setMatches(fresh);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regenerate failed');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleStatusUpdate = async (matchId: string, status: string) => {
    setError('');
    try {
      const companyId = await resolveCompanyId();
      const updated = await entrepreneurApi.updateMatchStatus(companyId, matchId, status);
      setMatches((prev) => prev.map((m) => (m.matchId === matchId ? updated : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed');
    }
  };

  const handleInteraction = async (matchId: string, kind: string) => {
    setError('');
    try {
      const companyId = await resolveCompanyId();
      await entrepreneurApi.recordInvestorInteraction(companyId, matchId, kind, '');
      const existing: Phase8Data = getPhaseData<Phase8Data>(8) ?? {};
      savePhaseData(8, { ...existing, lastInteractionAt: new Date().toISOString() });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Interaction failed');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();
      const advanceResponse = await entrepreneurApi.advancePhase(companyId, 8, {});
      if (advanceResponse?.currentPhase !== 9) {
        throw new Error(
          `Phase advancement failed - expected currentPhase=9, got ${advanceResponse?.currentPhase}`,
        );
      }
      if (!advanceResponse?.completedPhases?.includes(8)) {
        throw new Error('Phase 8 not marked as completed in backend response');
      }
      applyBackendResponse(advanceResponse);
      const existing: Phase8Data = getPhaseData<Phase8Data>(8) ?? {};
      savePhaseData(8, {
        ...existing,
        __companyId: companyId,
        submittedAt: new Date().toISOString(),
      });
      moveToNextStep(8, 1);
      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-9');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAdvance = matches.some((m) => m.matchScore >= 40);

  return (
    <div className="space-y-6">
      {/* Dev banner — explicit, no AI claims */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Deterministic rule-based matching active</p>
          <p>
            Match scores and rationales are computed by a backend rules engine that
            intersects your company profile with each investor&apos;s declared preferences
            (sector, stage, check-size band, geography). LLM-driven personalised matching
            will replace this when AI provider credentials are configured.
          </p>
        </div>
      </div>

      {/* Insights summary — backend-derived */}
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-neutral-1">Investor matches</h3>
            <p className="text-xs text-neutral-5 mt-1">
              {insights
                ? `${insights.totalMatches} total · ${insights.highScoreMatches} high-score · avg ${insights.averageScore}`
                : 'No matches generated yet.'}
            </p>
          </div>
          <Button onClick={handleRegenerate} disabled={isRegenerating} className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            {isRegenerating ? 'Generating…' : matches.length > 0 ? 'Re-run matching' : 'Generate matches'}
          </Button>
        </div>
      </div>

      {/* Match cards */}
      <div className="space-y-3">
        {matches.length === 0 ? (
          <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 text-sm text-neutral-5">
            No matches yet. Click <strong>Generate matches</strong> to run the matcher against the
            active investor pool.
          </div>
        ) : (
          matches.map((m) => (
            <div
              key={m.matchId}
              className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-neutral-1">
                    {m.investorName ?? m.investorId}
                  </p>
                  <p className="text-xs text-neutral-5">
                    {m.investorType ?? '—'}
                    {m.investmentRange ? ` · ${m.investmentRange}` : ''}
                    {m.preferredRound ? ` · ${m.preferredRound}` : ''}
                  </p>
                  {m.preferredSectors.length > 0 && (
                    <p className="text-xs text-neutral-5 mt-1">
                      Sectors: {m.preferredSectors.join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${m.matchScore >= 70 ? 'text-green-700' : m.matchScore >= 40 ? 'text-amber-700' : 'text-neutral-5'}`}>
                    {m.matchScore}
                  </p>
                  <p className="text-xs text-neutral-5">match score</p>
                </div>
              </div>

              {m.matchRationale && (
                <p className="text-xs text-neutral-5 bg-background border border-neutral-2 rounded-md p-2 font-mono">
                  {m.matchRationale}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase text-neutral-5">Status:</span>
                  <span className="text-xs font-semibold text-neutral-1">{m.status}</span>
                  {m.engineVersion && (
                    <span className="text-xs text-neutral-5">· engine: {m.engineVersion}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(m.matchId, 'saved')}>
                    <Bookmark className="w-3 h-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(m.matchId, 'accepted')}>
                    <Check className="w-3 h-3 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(m.matchId, 'rejected')}>
                    <X className="w-3 h-3 mr-1" /> Reject
                  </Button>
                  <details className="relative">
                    <summary className="list-none cursor-pointer">
                      <Button size="sm" variant="outline" asChild>
                        <span><MessageSquare className="w-3 h-3 mr-1" /> Log interaction</span>
                      </Button>
                    </summary>
                    <div className="absolute right-0 mt-2 w-48 bg-background border border-neutral-2 rounded-md shadow-lg p-2 z-10">
                      {INTERACTION_TYPES.map((kind) => (
                        <button
                          key={kind}
                          className="block w-full text-left px-2 py-1 text-xs text-neutral-1 hover:bg-neutral-2 rounded"
                          onClick={() => handleInteraction(m.matchId, kind)}
                        >
                          {kind}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-900">{error}</p>
        </div>
      )}

      <StepFooter
        backUrl="/dashboard/entrepreneur/phase-7"
        onNextClick={handleSubmit}
        isLoading={isSubmitting}
        nextLabel="Submit &amp; Complete Phase 8"
        nextValidationError={error}
        isNextDisabled={!canAdvance}
      />
    </div>
  );
}
