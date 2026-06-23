'use client';

import { useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';
import entrepreneurApi, {
  type FundingProfileResponse,
  type CapTableSnapshotResponse,
  type OwnershipHistoryResponse,
  type CompanyProgressResponse,
} from '@/lib/api-entrepreneur';
import { SectionCard, MetricCard, Chip } from '@/components/entrepreneur/phase3/FinancialWidgets';
import {
  OwnershipDonut,
  CapTableList,
  DilutionRoundCards,
  JourneyBar,
  type DonutSegment,
  type CapTableRow,
  type DilutionRound,
  type JourneyPoint,
} from './EquityWidgets';

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
const intl = (n: number) => new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(n || 0);
const pct = (n: number) => `${new Intl.NumberFormat('en-IE', { maximumFractionDigits: 1 }).format(n || 0)}%`;
const ROUND_LABEL: Record<string, string> = { pre_seed: 'Pre-Seed', seed: 'Seed', series_a: 'Series A' };

function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading funding overview…</span>
      <div className="h-44 animate-pulse rounded-xl border border-border bg-muted/40" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
    </div>
  );
}

export function Phase5FundingVisuals() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<CompanyProgressResponse | null>(null);
  const [funding, setFunding] = useState<FundingProfileResponse | null>(null);
  const [snapshot, setSnapshot] = useState<CapTableSnapshotResponse | null>(null);
  const [history, setHistory] = useState<OwnershipHistoryResponse[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prog = await entrepreneurApi.getCurrentPhase();
        if (cancelled) return;
        setProgress(prog);
        const id = prog.companyId;
        if (!id) {
          setLoading(false);
          return;
        }
        const [fund, snap, hist] = await Promise.allSettled([
          entrepreneurApi.getFundingProfile(id),
          entrepreneurApi.getLatestCapTableSnapshot(id),
          entrepreneurApi.getOwnershipHistory(id),
        ]);
        if (cancelled) return;
        if (fund.status === 'fulfilled') setFunding(fund.value);
        if (snap.status === 'fulfilled') setSnapshot(snap.value);
        if (hist.status === 'fulfilled') setHistory(Array.isArray(hist.value) ? hist.value : []);
      } catch {
        if (!cancelled) setError('Could not load funding overview.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Skeleton />;

  const raise = funding?.fundingAskAmount ?? 0;
  const preMoney = funding?.preMoneyValuation ?? 0;
  const postMoney = raise > 0 && preMoney > 0 ? preMoney + raise : 0;
  const roundLabel = funding?.fundingRoundType ? (ROUND_LABEL[funding.fundingRoundType] ?? funding.fundingRoundType) : null;

  const allocationDonut: DonutSegment[] = (funding?.capitalAllocation ?? [])
    .filter((c) => c.percent > 0)
    .map((c) => ({ label: c.category, percent: c.percent, value: eur(c.amount) }));

  const grants = snapshot?.grants ?? [];
  const totalGranted = grants.reduce((s, g) => s + (g.sharesGranted || 0), 0);
  const capRows: CapTableRow[] = grants.map((g) => ({
    stakeholderName: g.stakeholderName,
    type: g.stakeholderType,
    shareClass: g.shareClass,
    sharesGranted: g.sharesGranted,
    percent: totalGranted > 0 ? (g.sharesGranted / totalGranted) * 100 : 0,
    investmentAmount: g.investmentAmount,
  }));
  const capitalRaised = grants.reduce((s, g) => s + (g.investmentAmount ?? 0), 0);

  const dilutionRounds: DilutionRound[] = history.map((h) => ({
    round: h.roundName,
    founderBefore: h.founderOwnershipBefore,
    founderAfter: h.founderOwnershipAfter,
    investor: h.investorOwnership,
    valuation: h.valuation,
  }));
  const journeyPoints: JourneyPoint[] = history.map((h) => ({ label: h.roundName, percent: h.founderOwnershipAfter }));

  return (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Figma P5.1 — Funding ask & allocation */}
      <SectionCard
        title="Funding ask"
        subtitle="Your capital target and allocation, as saved."
        headerRight={roundLabel ? <Chip tone="primary">{roundLabel} round</Chip> : undefined}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <MetricCard label="Target raise" tone="primary" value={raise > 0 ? eur(raise) : undefined} unavailable={raise > 0 ? undefined : 'unavailable'} />
            <MetricCard label="Pre-money valuation" value={preMoney > 0 ? eur(preMoney) : undefined} unavailable={preMoney > 0 ? undefined : 'unavailable'} />
            <MetricCard label="Post-money (auto)" value={postMoney > 0 ? eur(postMoney) : undefined} unavailable={postMoney > 0 ? undefined : 'unavailable'} chip="Pre + raise" chipTone="muted" />
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">Capital allocation</p>
            <OwnershipDonut data={allocationDonut} centerTop={raise > 0 ? eur(raise) : undefined} centerBottom={raise > 0 ? 'Allocated' : undefined} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Runway after raise" unavailable="unavailable" />
          <MetricCard label="Equity offered" value={funding?.equityOfferedPercent ? pct(funding.equityOfferedPercent) : undefined} unavailable={funding?.equityOfferedPercent ? undefined : 'unavailable'} />
          <MetricCard label="Burn rate" unavailable="unavailable" />
        </div>
      </SectionCard>

      {/* Figma P5.4 — Dilution simulation */}
      <SectionCard title="Dilution simulation" subtitle="Projected from your recorded ownership history.">
        <DilutionRoundCards rounds={dilutionRounds} />
        {journeyPoints.length > 0 && (
          <div className="mt-4">
            <JourneyBar points={journeyPoints} title="Founder ownership journey" />
          </div>
        )}
      </SectionCard>

      {/* Figma P5.5 — Cap table finalization preview */}
      <SectionCard
        title="Cap table (finalization preview)"
        subtitle={snapshot ? `Version ${snapshot.version} · ${intl(snapshot.totalShares)} authorised shares` : 'No cap table submitted yet'}
      >
        <CapTableList rows={capRows} totalShares={snapshot?.totalShares} />
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Capital raised" value={capitalRaised > 0 ? eur(capitalRaised) : undefined} unavailable={capitalRaised > 0 ? undefined : 'unavailable'} />
          <MetricCard label="Current valuation" value={postMoney > 0 ? eur(postMoney) : preMoney > 0 ? eur(preMoney) : undefined} unavailable={postMoney > 0 || preMoney > 0 ? undefined : 'unavailable'} />
          <MetricCard label="Investor-ready score" value={undefined} unavailable={'unavailable'} />
          <MetricCard label="Marketplace" value={funding?.hasOutreachCampaign ? 'Published' : 'Not published'} chip={funding?.hasOutreachCampaign ? 'Live' : undefined} chipTone="success" />
        </div>
      </SectionCard>

      {/* Figma P5.6 — readiness / unlock summary (real progress) */}
      <SectionCard
        title="Funding readiness"
        headerRight={<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Rocket className="h-4 w-4" aria-hidden /> Phase 5</span>}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Investor-ready score" value={undefined} unavailable={'unavailable'} />
          <MetricCard label="Overall progress" value={progress ? `${progress.overallProgressPercent}%` : undefined} unavailable={progress ? undefined : 'unavailable'} />
          <MetricCard label="Verification" value={progress ? (progress.isInvestorReady ? 'Institutional ready' : 'Pending review') : undefined} unavailable={progress ? undefined : 'unavailable'} />
        </div>
      </SectionCard>
    </div>
  );
}

export default Phase5FundingVisuals;
