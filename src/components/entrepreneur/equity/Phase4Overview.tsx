'use client';

import { useEffect, useState } from 'react';
import { PieChart } from 'lucide-react';
import entrepreneurApi, {
  type CapTableSnapshotResponse,
  type FundingProfileResponse,
  type OwnershipHistoryResponse,
} from '@/lib/api-entrepreneur';
import { SectionCard, MetricCard } from '@/components/entrepreneur/phase3/FinancialWidgets';
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

function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading equity overview…</span>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}

export function Phase4Overview() {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<CapTableSnapshotResponse | null>(null);
  const [funding, setFunding] = useState<FundingProfileResponse | null>(null);
  const [history, setHistory] = useState<OwnershipHistoryResponse[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prog = await entrepreneurApi.getCurrentPhase();
        const id = prog.companyId;
        if (!id) {
          if (!cancelled) setLoading(false);
          return;
        }
        const [snap, fund, hist] = await Promise.allSettled([
          entrepreneurApi.getLatestCapTableSnapshot(id),
          entrepreneurApi.getFundingProfile(id),
          entrepreneurApi.getOwnershipHistory(id),
        ]);
        if (cancelled) return;
        if (snap.status === 'fulfilled') setSnapshot(snap.value);
        if (fund.status === 'fulfilled') setFunding(fund.value);
        if (hist.status === 'fulfilled') setHistory(Array.isArray(hist.value) ? hist.value : []);
      } catch {
        if (!cancelled) setError('Could not load equity overview.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Skeleton />;

  const grants = snapshot?.grants ?? [];
  const totalGranted = grants.reduce((s, g) => s + (g.sharesGranted || 0), 0);
  const founderShares = grants.filter((g) => g.stakeholderType === 'founder').reduce((s, g) => s + (g.sharesGranted || 0), 0);
  const founderPct = totalGranted > 0 ? (founderShares / totalGranted) * 100 : null;
  const esopPct = snapshot ? snapshot.esopPoolPercent : null;
  const preMoney = funding?.preMoneyValuation;

  const donutData: DonutSegment[] = grants
    .filter((g) => g.sharesGranted > 0)
    .map((g) => ({ label: g.stakeholderName, percent: totalGranted > 0 ? (g.sharesGranted / totalGranted) * 100 : 0, value: intl(g.sharesGranted) }));

  const capRows: CapTableRow[] = grants.map((g) => ({
    stakeholderName: g.stakeholderName,
    type: g.stakeholderType,
    shareClass: g.shareClass,
    sharesGranted: g.sharesGranted,
    percent: totalGranted > 0 ? (g.sharesGranted / totalGranted) * 100 : 0,
    investmentAmount: g.investmentAmount,
  }));

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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Issued shares" value={totalGranted > 0 ? intl(totalGranted) : undefined} unavailable={totalGranted > 0 ? undefined : 'unavailable'} chip={snapshot ? `of ${intl(snapshot.totalShares)} auth.` : undefined} chipTone="muted" />
        <MetricCard label="Pre-money valuation" value={preMoney && preMoney > 0 ? eur(preMoney) : undefined} unavailable={preMoney && preMoney > 0 ? undefined : 'unavailable'} />
        <MetricCard label="Founder ownership" value={founderPct != null ? pct(founderPct) : undefined} unavailable={founderPct != null ? undefined : 'unavailable'} chip="Post-ESOP" chipTone="muted" />
        <MetricCard label="ESOP pool" value={esopPct != null ? pct(esopPct) : undefined} unavailable={esopPct != null ? undefined : 'unavailable'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Ownership breakdown">
          <OwnershipDonut data={donutData} centerTop={donutData.length || undefined} centerBottom={donutData.length ? 'Holders' : undefined} />
        </SectionCard>
        <SectionCard title="Cap table">
          <CapTableList rows={capRows} totalShares={snapshot?.totalShares} />
        </SectionCard>
      </div>

      <SectionCard
        title="Dilution & founder journey"
        subtitle="Projected from your recorded ownership history."
        headerRight={<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><PieChart className="h-4 w-4" aria-hidden /> equity</span>}
      >
        <DilutionRoundCards rounds={dilutionRounds} />
        {journeyPoints.length > 0 && (
          <div className="mt-4">
            <JourneyBar points={journeyPoints} title="Founder ownership journey" />
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default Phase4Overview;
