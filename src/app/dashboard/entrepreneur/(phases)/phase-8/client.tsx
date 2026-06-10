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
import {
  SectionCard,
  MetricCard,
  Chip,
  UnavailableValue,
  type Tone,
} from '@/components/entrepreneur/phase3/FinancialWidgets';
import entrepreneurApi, {
  InvestorMatchResponse,
  MatchingInsightsResponse,
  type FundingProfileResponse,
} from '@/lib/api-entrepreneur';
import { Phase8Data } from '@/types/entrepreneur';

const INTERACTION_TYPES = ['view', 'message', 'call', 'proposal_sent', 'term_sheet'] as const;

const TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'interested', label: 'Interested' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'saved', label: 'Saved' },
  { key: 'rejected', label: 'Rejected' },
];

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

function scoreTone(s: number): Tone {
  return s >= 70 ? 'success' : s >= 40 ? 'warning' : 'muted';
}
function statusTone(s: string): Tone {
  const v = (s || '').toLowerCase();
  if (v === 'accepted') return 'success';
  if (v === 'interested') return 'primary';
  if (v === 'rejected') return 'destructive';
  return 'muted';
}

export default function Phase8Client() {
  const router = useRouter();
  const { savePhaseData, moveToNextStep, getPhaseData, applyBackendResponse } =
    useEntrepreneurProgress();

  const [matches, setMatches] = useState<InvestorMatchResponse[]>([]);
  const [insights, setInsights] = useState<MatchingInsightsResponse | null>(null);
  const [funding, setFunding] = useState<FundingProfileResponse | null>(null);
  const [investorReady, setInvestorReady] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filterType, setFilterType] = useState('');
  const [filterRound, setFilterRound] = useState('');
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
      const prog = await entrepreneurApi.getCurrentPhase();
      const companyId = (getPhaseData<Phase8Data>(8) ?? {}).__companyId ?? prog.companyId;
      setInvestorReady(prog.isInvestorReady);
      if (!companyId) return;
      const [m, i, f] = await Promise.all([
        entrepreneurApi.getInvestorMatches(companyId),
        entrepreneurApi.getMatchingInsights(companyId).catch(() => null),
        entrepreneurApi.getFundingProfile(companyId).catch(() => null),
      ]);
      setMatches(m);
      setInsights(i);
      setFunding(f);
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

  const types = Array.from(new Set(matches.map((m) => m.investorType).filter(Boolean))) as string[];
  const rounds = Array.from(new Set(matches.map((m) => m.preferredRound).filter(Boolean))) as string[];
  const tabCount = (key: string) =>
    key === 'all' ? matches.length : matches.filter((m) => (m.status || '').toLowerCase() === key).length;
  const visible = matches.filter((m) => {
    if (activeTab !== 'all' && (m.status || '').toLowerCase() !== activeTab) return false;
    if (filterType && m.investorType !== filterType) return false;
    if (filterRound && m.preferredRound !== filterRound) return false;
    return true;
  });
  const avg = insights ? Math.max(0, Math.min(100, insights.averageScore)) : 0;

  return (
    <div className="space-y-6">
      {/* Dev banner — explicit, no AI claims */}
      <div className="bg-warning/10 border border-warning/40 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden />
        <div className="text-sm text-foreground">
          <p className="font-semibold mb-1">Deterministic rule-based matching active</p>
          <p>
            Match scores and rationales are computed by a backend rules engine that intersects your
            company profile with each investor&apos;s declared preferences (sector, stage, check-size
            band, geography). LLM-driven personalised matching will replace this when AI provider
            credentials are configured.
          </p>
        </div>
      </div>

      {/* KPI row — real MatchingInsights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Total matches" value={insights ? String(insights.totalMatches) : undefined} unavailable={insights ? undefined : 'unavailable'} />
        <MetricCard label="High-score matches" value={insights ? String(insights.highScoreMatches) : undefined} unavailable={insights ? undefined : 'unavailable'} chip="score ≥ 70" chipTone="success" />
        <MetricCard label="Average match score" value={insights ? String(insights.averageScore) : undefined} unavailable={insights ? undefined : 'unavailable'} />
      </div>
      {insights && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Average match score</span><span>{insights.averageScore}/100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Average match score" aria-valuenow={avg} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${avg}%` }} />
          </div>
        </div>
      )}

      {/* Funding ask banner — real FundingProfile */}
      <SectionCard
        title="Your funding ask is live"
        headerRight={
          <Button onClick={handleRegenerate} disabled={isRegenerating} size="sm" className="gap-2">
            <RefreshCcw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} aria-hidden />
            {isRegenerating ? 'Generating…' : matches.length > 0 ? 'Re-run matching' : 'Generate matches'}
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="text-foreground"><span className="text-muted-foreground">Amount:</span> <span className="font-semibold">{funding?.fundingAskAmount ? eur(funding.fundingAskAmount) : '—'}</span></span>
          <span className="text-foreground"><span className="text-muted-foreground">Round:</span> <span className="font-semibold">{funding?.fundingRoundType ?? '—'}</span></span>
          <span className="text-foreground"><span className="text-muted-foreground">Equity offered:</span> <span className="font-semibold">{funding?.equityOfferedPercent ? `${funding.equityOfferedPercent}%` : '—'}</span></span>
          <Chip tone={investorReady ? 'success' : 'muted'}>{investorReady == null ? 'Status pending' : investorReady ? 'Investor-ready ✓' : 'Not yet investor-ready'}</Chip>
        </div>
      </SectionCard>

      {/* Tabs + filters */}
      <div className="space-y-3">
        <div role="tablist" aria-label="Match status" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              onClick={() => setActiveTab(t.key)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === t.key ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/40'}`}
            >
              {t.label} <span className={activeTab === t.key ? 'text-primary-foreground/80' : 'text-muted-foreground'}>({tabCount(t.key)})</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="filter-type" className="block text-xs font-medium text-muted-