'use client';

import { Phase4Context } from '../Phase4TabbedView';
import { Phase4Tab } from '../Phase4Tabs';
import {
  deriveCapTable,
  initials,
  fmtNum,
  fmtPct,
  TYPE_LABEL,
  TYPE_CHART_VAR,
  StakeType,
} from '../phase4-utils';
import { Button } from '@/components/ui/button';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Donut({
  segments,
}: {
  segments: { label: string; pct: number; color: string }[];
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
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative rounded-full"
        style={{ width: 168, height: 168, background: `conic-gradient(${stops})` }}
      >
        <div className="absolute inset-[18px] rounded-full bg-card flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-foreground">
            {segments.length}
          </p>
          <p className="text-xs text-muted-foreground">holders</p>
        </div>
      </div>
      <div className="w-full space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: seg.color }}
              />
              {seg.label}
            </span>
            <span className="font-semibold text-foreground">{fmtPct(seg.pct)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          No cap table yet. Add your founders and investors to get started.
        </p>
        <Button onClick={() => onNavigate('cap-table')}>Go to Cap Table</Button>
      </div>
    );
  }

  const segments = (['founder', 'investor', 'advisor', 'esop'] as StakeType[])
    .map((t) => ({
      label: TYPE_LABEL[t],
      pct:
        t === 'founder'
          ? d.founderPct
          : t === 'investor'
            ? d.investorPct
            : t === 'advisor'
              ? d.advisorPct
              : d.esopPct,
      color: TYPE_CHART_VAR[t],
    }))
    .filter((s) => s.pct > 0);

  return (
    <div className="space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total shares issued" value={fmtNum(d.totalIssued)} sub={`of ${fmtNum(d.totalShares)} authorised`} />
        <StatCard label="Stakeholders" value={String(d.holders.length)} sub={`${d.founderCount} founders · ${d.investorCount} investors`} />
        <StatCard label="Founder ownership" value={fmtPct(d.founderPct, 2)} />
        <StatCard label="ESOP pool" value={fmtPct(esopPool)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stakeholder table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-bold text-foreground">Stakeholders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <th className="px-5 py-2.5 font-medium">Stakeholder</th>
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 font-medium">Class</th>
                  <th className="px-3 py-2.5 font-medium text-right">Shares</th>
                  <th className="px-3 py-2.5 font-medium text-right">Ownership</th>
                </tr>
              </thead>
              <tbody>
                {d.holders.map((h, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-primary-foreground"
                          style={{ background: TYPE_CHART_VAR[h.type] }}
                        >
                          {initials(h.name)}
                        </span>
                        <span className="font-medium text-foreground">{h.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {TYPE_LABEL[h.type]}
                      </span>
                    </td>
                    <td className="px-3 py-3 capitalize text-muted-foreground">{h.shareClass}</td>
                    <td className="px-3 py-3 text-right text-foreground">{fmtNum(h.shares)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-foreground">{fmtPct(h.ownershipPct, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ownership donut */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">Ownership valuation</h3>
          {segments.length > 0 ? (
            <Donut segments={segments} />
          ) : (
            <p className="text-sm text-muted-foreground">No ownership data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
