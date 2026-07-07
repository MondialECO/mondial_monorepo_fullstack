'use client';

import { ReactNode } from 'react';
import { Plus, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Phase4Context } from '../Phase4TabbedView';
import { Phase4Tab } from '../Phase4Tabs';
import {
  deriveCapTable,
  initials,
  fmtNum,
  fmtPct,
  TYPE_LABEL,
} from '../phase4-utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const HOLDER_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n || 0);

/* ---------- small presentational helpers ---------- */

function StatCard({
  label,
  value,
  sub,
  subTone,
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: 'success' | 'muted';
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mt-2">{value}</p>
      {sub && (
        <p
          className={cn(
            'text-xs mt-1 flex items-center gap-1',
            subTone === 'success' ? 'text-success-text font-medium' : 'text-muted-foreground',
          )}
        >
          {subTone === 'success' && <ArrowUpRight className="w-3 h-3" />}
          {sub}
        </p>
      )}
    </div>
  );
}

function Chip({ children, tone = 'success' }: { children: ReactNode; tone?: 'success' | 'info' | 'muted' }) {
  const tones = {
    success: 'bg-success-light text-success-text',
    info: 'bg-secondary text-primary',
    muted: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', tones[tone])}>
      {tone === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-success-text" />}
      {children}
    </span>
  );
}

function HolderDonut({
  segments,
  centerCount,
}: {
  segments: { label: string; pct: number; color: string }[];
  centerCount: number;
}) {
  const total = segments.reduce((s, x) => s + x.pct, 0) || 1;
  const stops = segments
    .map((seg, i) => {
      const before = segments.slice(0, i).reduce((s, x) => s + x.pct, 0);
      const start = (before / total) * 100;
      const end = ((before + seg.pct) / total) * 100;
      return `${seg.color} ${start}% ${end}%`;
    })
    .join(', ');

  return (
    <div className="flex justify-center">
      <div
        className="relative rounded-full"
        style={{ width: 160, height: 160, background: `conic-gradient(${stops})` }}
      >
        <div className="absolute inset-[20px] rounded-full bg-popover flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-foreground leading-none">{centerCount}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-1">Holders</p>
        </div>
      </div>
    </div>
  );
}

function JourneySlider({
  stops,
}: {
  stops: { label: string; value?: string; active?: boolean }[];
}) {
  const activeIdx = Math.max(0, stops.findIndex((s) => s.active));
  const fillPct = stops.length > 1 ? (activeIdx / (stops.length - 1)) * 100 : 0;

  return (
    <div className="relative pt-1 pb-1">
      {/* track */}
      <div className="absolute left-1.5 right-1.5 top-2.5 h-1 bg-border rounded-full" />
      <div
        className="absolute left-1.5 top-2.5 h-1 bg-primary rounded-full transition-all"
        style={{ width: `${fillPct}%` }}
      />
      <div className="relative flex justify-between">
        {stops.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                'w-3.5 h-3.5 rounded-full border-2',
                i <= activeIdx ? 'bg-primary border-primary' : 'bg-popover border-border',
              )}
            />
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{s.label}</span>
            {s.value && <span className="text-xs font-semibold text-foreground">{s.value}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- main tab ---------- */

export function Phase4OverviewTab({
  ctx,
  onNavigate,
}: {
  ctx: Phase4Context;
  onNavigate: (tab: Phase4Tab) => void;
}) {
  const d = deriveCapTable(ctx.snapshot);
  const esopPool = ctx.snapshot?.esopPoolPercent ?? 0;

  if (!ctx.snapshot) {
    return (
      <div className="bg-popover border border-border rounded-2xl p-10 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          No cap table yet. Add your founders and investors to get started.
        </p>
        <Button onClick={() => onNavigate('cap-table')}>Go to Cap Table</Button>
      </div>
    );
  }

  const latestValuation = ctx.history.length > 0 ? ctx.history[ctx.history.length - 1].valuation : 0;
  const esopOptions = Math.round((esopPool / 100) * d.totalShares);

  // Per-holder donut segments (top holders by ownership).
  const holderSegments = d.holders
    .map((h, i) => ({ label: h.name, pct: h.ownershipPct, color: HOLDER_COLORS[i % HOLDER_COLORS.length] }))
    .filter((s) => s.pct > 0);

  // ESOP quick-setup simulation: dilute each holder proportionally by the ESOP pool.
  const esopFactor = 1 - esopPool / 100;
  const beforeAfter = d.holders.map((h) => {
    const before = h.ownershipPct;
    const after = before * esopFactor;
    return { name: h.name, before, after, change: after - before };
  });

  // Founder ownership journey — driven by recorded ownership history when present.
  const journeyStops =
    ctx.history.length > 0
      ? [
          { label: 'Today', value: fmtPct(d.founderPct, 1), active: false },
          ...ctx.history.map((h, i) => ({
            label: h.roundName || `Round ${i + 1}`,
            value: fmtPct(h.founderOwnershipAfter, 1),
            active: i === ctx.history.length - 1,
          })),
        ]
      : [
          { label: 'Today', value: fmtPct(d.founderPct, 1), active: true },
          { label: 'Pre-Seed', active: false },
          { label: 'Seed', active: false },
          { label: 'Series A', active: false },
        ];

  const esopJourneyStops = [
    { label: 'Today', active: true },
    { label: 'Pre-seed', active: false },
    { label: 'Seed', active: false },
    { label: 'Series A', active: false },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Shares Issued"
          value={fmtNum(d.totalIssued)}
          sub={`of ${fmtNum(d.totalShares)} authorised`}
        />
        <StatCard
          label="Pre-Money Valuation"
          value={latestValuation > 0 ? eur(latestValuation) : '—'}
          sub="From Phase 3"
          subTone="success"
        />
        <StatCard
          label="Founder Ownership"
          value={fmtPct(d.founderPct, 2)}
          sub="Combined post-ESOP"
        />
        <StatCard
          label="ESOP Pool"
          value={fmtPct(esopPool)}
          sub={`${fmtNum(esopOptions)} options`}
          subTone="success"
        />
      </div>

      {/* Recent Matches + Ownership Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Matches (stakeholders) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-foreground">Recent Matches</h3>
              <Chip tone="success">Active</Chip>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 self-start sm:self-auto bg-white" onClick={() => onNavigate('cap-table')}>
              <Plus className="w-4 h-4" />
              Add Stakeholder
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="px-5 py-2.5 font-semibold">Stakeholder</th>
                  <th className="px-3 py-2.5 font-semibold">Type</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Ownership</th>
                  {/* <th className="px-3 py-2.5 font-semibold text-right">Shares</th> */}
                  <th className="px-5 py-2.5 font-semibold text-right">Investment</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {d.holders.map((h, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                          style={{ background: HOLDER_COLORS[i % HOLDER_COLORS.length] }}
                        >
                          {initials(h.name)}
                        </span>
                        <span className="font-medium text-foreground whitespace-nowrap">{h.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full text-muted-foreground whitespace-nowrap" style={{ color: HOLDER_COLORS[i % HOLDER_COLORS.length] }}>
                        {TYPE_LABEL[h.type]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-semibold text-foreground">{fmtPct(h.ownershipPct, 2)}</span>
                    </td>
                    {/* <td className="px-3 py-3 text-right text-muted-foreground whitespace-nowrap">{fmtNum(h.shares)}</td> */}
                    <td className="px-5 py-3 text-right text-muted-foreground whitespace-nowrap">{h.investment}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => onNavigate('cap-table')}
                        className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-3.5 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Total Shares: <span className="font-semibold text-foreground">{fmtNum(d.totalIssued)}</span>
            </p>
            <button
              onClick={() => onNavigate('cap-table')}
              className="text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
            >
              Add stakeholder or investor
            </button>
          </div>
        </div>

        {/* Ownership Valuation */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">Ownership Valuation</h3>
            <Chip tone="info">Interactive</Chip>
          </div>

          {holderSegments.length > 0 ? (
            <>
              <HolderDonut segments={holderSegments} centerCount={d.holders.length} />
              <div className="space-y-2">
                {holderSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                      <span className="truncate">{seg.label}</span>
                    </span>
                    <span className="font-semibold text-foreground flex-shrink-0">{fmtPct(seg.pct, 2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto rounded-lg bg-success-light p-3 flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-success-text flex-shrink-0 mt-0.5" />
                <p className="text-xs text-success-text">
                  Founders retain majority control — {fmtPct(d.founderPct, 2)} combined ownership.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No ownership data yet.</p>
          )}
        </div>
      </div>

      {/* ESOP Pool - Quick Setup */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">ESOP Pool — Quick Setup</h3>
          <Chip tone="success">Setup 4.3 Active</Chip>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: founder ownership journey */}
          <div className="space-y-5 bg-popover border border-border rounded-2xl p-5 sm:p-6">
            <p className="font-bold text-muted-foreground">Founder ownership journey</p>
            <div className="flex items-center justify-center gap-3">
              
              <p className="text-4xl font-bold text-primary mt-1">{fmtPct(esopPool)}</p>
              <p className="text-xs text-muted-foreground mt-1">~{fmtNum(esopOptions)} shares reserved</p>
            </div>
            <JourneySlider stops={esopJourneyStops} />
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                ESOP pool dilutes existing holders proportionally at each new stage.
              </p>
            </div>
          </div>

          {/* Right: before / after table */}
          <div className="overflow-x-auto bg-popover border border-border rounded-2xl p-5 sm:p-6">
            <table className="w-full text-sm min-w-[360px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="py-2.5 pr-3 font-semibold">Stakeholder</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Before</th>
                  <th className="py-2.5 px-3 font-semibold text-right">After</th>
                  <th className="py-2.5 pl-3 font-semibold text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {beforeAfter.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">{r.name}</td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground">{fmtPct(r.before, 2)}</td>
                    <td className="py-2.5 px-3 text-right text-foreground">{fmtPct(r.after, 2)}</td>
                    <td
                      className={cn(
                        'py-2.5 pl-3 text-right font-semibold',
                        r.change >= 0 ? 'text-success-text' : 'text-destructive',
                      )}
                    >
                      {r.change >= 0 ? '+' : ''}
                      {fmtPct(r.change, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Founder ownership journey */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Founder ownership journey</h3>
          <Chip tone="success">Setup 4.3 Active</Chip>
        </div>

        <JourneySlider stops={journeyStops} />

        <div className="rounded-lg bg-success-light p-3 flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-success-text flex-shrink-0 mt-0.5" />
          <p className="text-xs text-success-text">
            Founders retain majority control across recorded rounds — a healthy dilution path at this stage.
          </p>
        </div>
      </div>
    </div>
  );
}
