'use client';

import { useState } from 'react';
import { GitBranch, FileText, Plus, Calendar, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type DealStatus,
  type DealStatusResponse,
  type InvestorMatchResponse,
  type TimelineItem,
} from '@/lib/api-entrepreneur';
import { SectionCard, MetricCard, Chip } from '@/components/entrepreneur/phase3/FinancialWidgets';
import { statusTone } from './PipelineBoard';
import { DealTimeline } from './DealTimeline';

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
const pct = (n: number) => `${new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(n || 0)}%`;
const committedOf = (d: DealStatusResponse) => (d.investors ?? []).reduce((s, i) => s + (i.committedAmount || 0), 0);
const humanize = (s: string) => (s || '').replace(/_/g, ' ');

// Figma pipeline tabs → backend 12-state buckets.
const TABS: Array<{ key: string; label: string; match: string[] }> = [
  { key: 'interested', label: 'Interested', match: ['initiated', 'contacted', 'interested'] },
  { key: 'discussion', label: 'In Discussion', match: ['meeting_scheduled', 'negotiating', 'due_diligence'] },
  { key: 'term_sheet', label: 'Term Sheet', match: ['term_sheet', 'agreement_sent'] },
  { key: 'closed', label: 'Closed', match: ['signed', 'completed'] },
];

const tabForStatus = (status: string) =>
  TABS.find((t) => t.match.includes((status || '').toLowerCase()))?.key ?? 'interested';

// Human one-liner derived from real deal state (no fabricated data).
function activityLine(d: DealStatusResponse): string {
  const ts = d.termSheet;
  if (d.status === 'signed' || d.status === 'completed') return 'Deal closed — funds committed.';
  if (d.status === 'agreement_sent') return 'Agreement sent for signature.';
  if (d.status === 'term_sheet') return `Term sheet ${humanize(ts?.status || 'issued')}.`;
  if (d.status === 'negotiating') return 'Negotiating terms.';
  if (d.status === 'due_diligence') return 'Due diligence in progress.';
  if (d.status === 'meeting_scheduled') return 'Meeting scheduled.';
  if (d.status === 'interested') return 'Investor expressed interest.';
  if (d.status === 'contacted') return 'Investor contacted.';
  return 'Deal initiated.';
}

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

export interface Phase9PipelineVisualsProps {
  deals: DealStatusResponse[];
  summary: any | null;
  termSheet: any | null;
  matches: InvestorMatchResponse[];
  timeline: TimelineItem[];
  onDataChanged?: () => void;
  onCreateDeal?: (investorId: string, raise: number, valuation: number) => Promise<void>;
  onUpdateDealStatus?: (dealId: string, status: DealStatus) => Promise<void>;
}

export function Phase9PipelineVisuals({
  deals,
  summary,
  termSheet,
  matches,
  timeline,
  onDataChanged,
  onCreateDeal,
  onUpdateDealStatus,
}: Phase9PipelineVisualsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(deals.length > 0 ? deals[0].dealId : null);
  const [activeTab, setActiveTab] = useState<string>(deals.length > 0 ? tabForStatus(deals[0].status ?? '') : 'interested');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Add-deal inline form
  const [showAdd, setShowAdd] = useState(false);
  const [addInvestor, setAddInvestor] = useState('');
  const [addRaise, setAddRaise] = useState('');
  const [addValuation, setAddValuation] = useState('');

  const target = summary?.roundTargetEur ?? 0;
  const committed = summary?.committedAmountEur ?? 0;
  const remaining = summary?.remainingEur ?? 0;
  const progress = Math.min(100, summary?.percentFilled ?? 0);

  const counts = TABS.map((t) => {
    if (t.key === 'interested') return { ...t, count: summary?.interestedCount ?? 0 };
    if (t.key === 'discussion') return { ...t, count: summary?.inDiscussionCount ?? 0 };
    if (t.key === 'term_sheet') return { ...t, count: summary?.termSheetCount ?? 0 };
    if (t.key === 'closed') return { ...t, count: summary?.closedCount ?? 0 };
    return { ...t, count: 0 };
  });
  const visibleDeals = deals.filter((d) =>
    (TABS.find((t) => t.key === activeTab)?.match ?? []).includes((d.status || '').toLowerCase()),
  );

  const selected = deals.find((d) => d.dealId === selectedId) ?? null;
  const ts = termSheet;
  const tsActionable = selected?.status === 'term_sheet';
  const selectedTimeline = selectedId && timeline.filter((t) => (t as any).dealId === selectedId) || [];

  const handleAddDeal = async () => {
    setError('');
    if (!onCreateDeal) return;
    const raise = Number(addRaise);
    const valuation = Number(addValuation);
    if (!addInvestor || !Number.isFinite(raise) || raise <= 0 || !Number.isFinite(valuation) || valuation <= 0) {
      setError('Investor, raise amount, and valuation are required (amounts must be > 0).');
      return;
    }
    setBusy(true);
    try {
      await onCreateDeal(addInvestor, raise, valuation);
      setShowAdd(false);
      setAddInvestor('');
      setAddRaise('');
      setAddValuation('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create deal failed.');
    } finally {
      setBusy(false);
    }
  };

  // Accept → agreement_sent, Counter → negotiating (both legal from term_sheet).
  const handleTermSheetAction = async (next: DealStatus, label: string) => {
    if (!selected || !onUpdateDealStatus) return;
    setError('');
    setBusy(true);
    try {
      await onUpdateDealStatus(selected.dealId, next);
    } catch (e) {
      setError(e instanceof Error ? e.message : `${label} failed (illegal transition).`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total deals" value={String(summary?.totalDeals ?? 0)} chip="Active pipeline" chipTone="muted" />
        <MetricCard label="Committed" value={committed > 0 ? eur(committed) : undefined} unavailable={committed > 0 ? undefined : 'unavailable'} chip={target > 0 ? `${pct(progress)} of target` : undefined} chipTone="success" />
        <MetricCard label="Round target" value={target > 0 ? eur(target) : undefined} unavailable={target > 0 ? undefined : 'unavailable'} />
        <MetricCard label="Remaining" value={target > 0 ? eur(remaining) : undefined} unavailable={target > 0 ? undefined : 'unavailable'} chip={target > 0 ? 'To close' : undefined} chipTone="warning" />
      </div>

      {/* Round progress */}
      <SectionCard title="Round progress" subtitle={target > 0 ? `${eur(committed)} committed of ${eur(target)} target` : 'No funding target set yet'}>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Committed vs target" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-success-text transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{target > 0 ? `${pct(progress)} of €${target.toLocaleString()} committed · ${eur(remaining)} remaining` : 'Set a funding ask in Phase 5 to track round progress.'}</p>
      </SectionCard>

      {/* Pipeline tabs + Add deal */}
      <SectionCard
        title="Pipeline"
        headerRight={
          <div className="flex flex-col items-end gap-1">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setShowAdd((v) => !v)}
              disabled={matches.length === 0}
              title={matches.length === 0 ? 'Complete Phase 8 and generate matches first' : undefined}
            >
              <Plus className="h-4 w-4" aria-hidden /> Add Deal
            </Button>
            {matches.length === 0 && (
              <p className="text-xs text-muted-foreground">Generate investor matches in Phase 8 to unlock deal creation</p>
            )}
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2 border-b border-border" role="tablist" aria-label="Deal pipeline stages">
          {counts.map((t) => (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              type="button"
              role="tab"
              aria-selected={activeTab === t.key}
              aria-controls={`panel-${t.key}`}
              onClick={() => setActiveTab(t.key)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  const currentIndex = TABS.findIndex((x) => x.key === t.key);
                  const nextIndex =
                    e.key === 'ArrowRight'
                      ? (currentIndex + 1) % TABS.length
                      : (currentIndex - 1 + TABS.length) % TABS.length;
                  setActiveTab(TABS[nextIndex].key);
                  e.preventDefault();
                }
              }}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label} <span className="ml-1 tabular-nums">({String(t.count).padStart(2, '0')})</span>
            </button>
          ))}
        </div>

        {showAdd && (
          <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select
                aria-label="Select investor for new deal"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={addInvestor}
                onChange={(e) => setAddInvestor(e.target.value)}
              >
                <option value="">Select investor…</option>
                {matches.map((m) => (
                  <option key={m.matchId} value={m.investorId}>
                    {m.investorName ?? m.investorId} ({m.matchScore})
                  </option>
                ))}
              </select>
              <input
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Total raise (EUR)"
                type="number"
                min="0"
                value={addRaise}
                onChange={(e) => setAddRaise(e.target.value)}
              />
              <input
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Post-money valuation (EUR)"
                type="number"
                min="0"
                value={addValuation}
                onChange={(e) => setAddValuation(e.target.value)}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleAddDeal} disabled={busy}>Create deal</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} disabled={busy}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Deal activity cards */}
        <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {visibleDeals.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
              <span className="text-sm italic text-muted-foreground">
                {deals.length === 0 ? 'No deals in the pipeline yet — add one from a matched investor.' : 'No deals in this stage.'}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
              {visibleDeals.map((d) => {
                const isSel = d.dealId === selectedId;
                const inv = d.investors?.[0];
                const investorType = inv?.investorType || '';
                const isAngelType = investorType.toLowerCase().includes('angel');
                const investorTypeChip = inv?.investorType ? (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isAngelType
                      ? 'bg-warning/10 text-warning'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {investorType}
                  </span>
                ) : null;
                return (
                  <button
                    key={d.dealId}
                    type="button"
                    onClick={() => setSelectedId(d.dealId)}
                    aria-pressed={isSel}
                    className={`rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSel ? 'border-primary' : 'border-border'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">{inv?.investorName || `Deal ${d.dealId.slice(-6)}`}</span>
                      <Chip tone={statusTone(d.status)}>{humanize(d.status)}</Chip>
                    </div>
                    {investorTypeChip && <div className="mt-2">{investorTypeChip}</div>}
                    <p className={`${investorTypeChip ? 'mt-1' : 'mt-2'} text-sm text-muted-foreground`}>{activityLine(d)}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Committed <span className="font-medium text-foreground">{committedOf(d) > 0 ? eur(committedOf(d)) : '—'}</span></span>
                      {d.termSheet?.signedAt && (
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" aria-hidden />{new Date(d.termSheet.signedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${inv?.investorName ?? 'Deal'} progress`} aria-valuenow={Math.round(d.progressPercent || 0)} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, d.progressPercent || 0))}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
                  <MetricCard label="Equity" value={ts.investorEquityPercent > 0 ? `${ts.investorEquityPercent}%` : undefined} unavailable={ts.investorEquityPercent > 0 ? undefined : 'unavailable'} />
                  <MetricCard label="Post-money" value={ts.postMoneyValuation > 0 ? eur(ts.postMoneyValuation) : undefined} unavailable={ts.postMoneyValuation > 0 ? undefined : 'unavailable'} />
                  <MetricCard label="Raise" value={ts.totalRaiseAmount > 0 ? eur(ts.totalRaiseAmount) : undefined} unavailable={ts.totalRaiseAmount > 0 ? undefined : 'unavailable'} />
                </div>
                <div className="mt-3">
                  <RealRow label="Equity type" value={ts.equityType || '—'} />
                  <RealRow label="Pro-rata rights" value={ts.proRataRights ? 'Yes' : 'No'} />
                  <RealRow label="Signed" value={ts.signedAt ? new Date(ts.signedAt).toLocaleDateString() : 'Not signed'} />
                  {ts.shareClass ? <RealRow label="Share class" value={ts.shareClass} /> : <AwaitingField label="Share class" />}
                  {ts.liquidationPref ? <RealRow label="Liquidation preference" value={ts.liquidationPref} /> : <AwaitingField label="Liquidation preference" />}
                  {ts.boardSeat ? <RealRow label="Board seat" value={ts.boardSeat} /> : <AwaitingField label="Board seat" />}
                  {ts.hasBoardSeat !== undefined ? (
                    <RealRow label="Board seat" value={ts.hasBoardSeat ? 'Yes · standard' : 'No'} />
                  ) : (
                    <AwaitingField label="Board seat detail" />
                  )}
                  {ts.antiDilutionType ? <RealRow label="Anti-dilution" value={ts.antiDilutionType} /> : <AwaitingField label="Anti-dilution" />}
                  {ts.closingDeadline ? (
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 py-2 last:border-0">
                      <span className="text-sm text-foreground">Closing deadline / expiry</span>
                      <span className="text-sm font-medium text-warning">{new Date(ts.closingDeadline).toLocaleDateString('en-IE', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  ) : (
                    <AwaitingField label="Closing deadline / expiry" />
                  )}
                </div>
                {ts.expiresAt && (
                  <div className="mt-2 inline-flex rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                    Expires {new Date(ts.expiresAt).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' })}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={!tsActionable || busy}
                    onClick={() => handleTermSheetAction('negotiating', 'Counter offer')}
                  >
                    <X className="h-4 w-4" aria-hidden /> Counter offer
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={!tsActionable || busy}
                    onClick={() => handleTermSheetAction('agreement_sent', 'Accept term sheet')}
                    title="Moves deal to agreement-sent status. Legal signing happens outside the platform."
                  >
                    <Check className="h-4 w-4" aria-hidden /> Accept term sheet
                  </Button>
                  {!tsActionable && (
                    <span className="self-center text-xs italic text-muted-foreground">Actions available when the deal is in the term-sheet stage.</span>
                  )}
                </div>
              </>
            )}
          </SectionCard>

          {/* Activity timeline */}
          <SectionCard title="Matchmaking timeline" headerRight={<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-4 w-4" aria-hidden /> activity</span>}>
            <DealTimeline items={selectedTimeline} />
          </SectionCard>
        </div>
      )}

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <GitBranch className="h-3.5 w-3.5" aria-hidden /> Pipeline stages map to the backend 12-state deal machine; illegal transitions are rejected.
      </p>
    </div>
  );
}

export default Phase9PipelineVisuals;
