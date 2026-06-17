'use client';

import { useEffect, useState } from 'react';
import { GitBranch, FileText } from 'lucide-react';
import entrepreneurApi, {
  type DealStatusResponse,
  type DealActivityLogResponse,
  type FundingProfileResponse,
} from '@/lib/api-entrepreneur';
import { SectionCard, MetricCard, Chip } from '@/components/entrepreneur/phase3/FinancialWidgets';
import { PipelineBoard, statusTone, type PipelineDeal } from './PipelineBoard';
import { DealTimeline, type TimelineItem } from './DealTimeline';

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
const pct = (n: number) => `${new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(n || 0)}%`;
const committedOf = (d: DealStatusResponse) => (d.investors ?? []).reduce((s, i) => s + (i.committedAmount || 0), 0);
const humanize = (s: string) => (s || '').replace(/_/g, ' ');

function AwaitingField({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/60 py-2 last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      <span className="text-sm italic text-muted-foreground">Awaiting backend field</span>
    </div>
  );
}

function RealRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/60 py-2 last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading deal pipeline…</span>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}

export function Phase9PipelineVisuals() {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<DealStatusResponse[]>([]);
  const [funding, setFunding] = useState<FundingProfileResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activity, setActivity] = useState<TimelineItem[]>([]);
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
        const [dl, fp] = await Promise.allSettled([
          entrepreneurApi.getCompanyDeals(id),
          entrepreneurApi.getFundingProfile(id),
        ]);
        if (cancelled) return;
        const list = dl.status === 'fulfilled' && Array.isArray(dl.value) ? dl.value : [];
        setDeals(list);
        if (fp.status === 'fulfilled') setFunding(fp.value);
        if (list.length > 0) setSelectedId(list[0].dealId);
      } catch {
        if (!cancelled) setError('Could not load the deal pipeline.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selectedId) {
      setActivity([]);
      return;
    }
    (async () => {
      try {
        const log = await entrepreneurApi.getDealActivity(selectedId);
        if (!cancelled) setActivity(Array.isArray(log) ? (log as DealActivityLogResponse[]) : []);
      } catch {
        if (!cancelled) setActivity([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  if (loading) return <Skeleton />;

  const target = funding?.fundingAskAmount ?? 0;
  const committed = deals.reduce((s, d) => s + committedOf(d), 0);
  const remaining = target > 0 ? Math.max(0, target - committed) : 0;
  const progress = target > 0 ? Math.min(100, (committed / target) * 100) : 0;

  const boardDeals: PipelineDeal[] = deals.map((d) => ({
    dealId: d.dealId,
    investorName: d.investors?.[0]?.investorName || `Deal ${d.dealId.slice(-6)}`,
    status: d.status,
    committedAmount: committedOf(d),
    termSheetStatus: d.termSheet?.status,
    progressPercent: d.progressPercent,
  }));

  const selected = deals.find((d) => d.dealId === selectedId) ?? null;
  const ts = selected?.termSheet;

  return (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total deals" value={deals.length > 0 ? String(deals.length) : undefined} unavailable={deals.length > 0 ? undefined : 'unavailable'} chip="Active pipeline" chipTone="muted" />
        <MetricCard label="Committed capital" value={committed > 0 ? eur(committed) : undefined} unavailable={committed > 0 ? undefined : 'unavailable'} chip={target > 0 ? `${pct(progress)} of target` : undefined} chipTone="success" />
        <MetricCard label="Funding target" value={target > 0 ? eur(target) : undefined} unavailable={target > 0 ? undefined : 'unavailable'} />
        <MetricCard label="Remaining" value={target > 0 ? eur(remaining) : undefined} unavailable={target > 0 ? undefined : 'unavailable'} />
      </div>

      {/* Round progress */}
      <SectionCard title="Round progress" subtitle={target > 0 ? `${eur(committed)} committed of ${eur(target)} target` : 'No funding target set yet'}>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Committed vs target" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{target > 0 ? `${pct(progress)} of €${target.toLocaleString()} committed · ${eur(remaining)} remaining` : 'Set a funding ask in Phase 5 to track round progress.'}</p>
      </SectionCard>

      {/* Pipeline board */}
      <SectionCard title="Pipeline" headerRight={<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><GitBranch className="h-4 w-4" aria-hidden /> by stage</span>}>
        <PipelineBoard deals={boardDeals} selectedId={selectedId} onSelect={setSelectedId} />
      </SectionCard>

      {selected && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Term-sheet detail */}
          <SectionCard
            title="Term sheet"
            subtitle={selected.investors?.[0]?.investorName}
            headerRight={ts ? <Chip tone={statusTone(ts.status)}>{humanize(ts.status)}</Chip> : undefined}
          >
            {!ts ? (
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
                <span className="text-sm italic text-muted-foreground">No term sheet on this deal yet.</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <MetricCard label="Raise" value={ts.totalRaiseAmount > 0 ? eur(ts.totalRaiseAmount) : undefined} unavailable={ts.totalRaiseAmount > 0 ? undefined : 'unavailable'} />
                  <MetricCard label="Post-money" value={ts.postMoneyValuation > 0 ? eur(ts.postMoneyValuation) : undefined} unavailable={ts.postMoneyValuation > 0 ? undefined : 'unavailable'} />
                  <MetricCard label="Equity" value={ts.investorEquityPercent > 0 ? `${ts.investorEquityPercent}%` : undefined} unavailable={ts.investorEquityPercent > 0 ? undefined : 'unavailable'} />
                </div>
                <div className="mt-3">
                  <RealRow label="Equity type" value={ts.equityType || '—'} />
                  <RealRow label="Pro-rata rights" value={ts.proRataRights ? 'Yes' : 'No'} />
                  <RealRow label="Signed" value={ts.signedAt ? new Date(ts.signedAt).toLocaleDateString() : 'Not signed'} />
                  <AwaitingField label="Pre-money valuation" />
                  <AwaitingField label="Share class" />
                  <AwaitingField label="Liquidation preference" />
                  <AwaitingField label="Board seat" />
                  <AwaitingField label="Anti-dilution" />
                  <AwaitingField label="Closing deadline / expiry" />
                </div>
              </>
            )}
          </SectionCard>

          {/* Activity timeline */}
          <SectionCard title="Matchmaking timeline" headerRight={<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-4 w-4" aria-hidden /> activity</span>}>
            <DealTimeline items={activity} />
          </SectionCard>
        </div>
      )}
    </div>
  );
}

export default Phase9PipelineVisuals;
