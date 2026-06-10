import * as React from 'react';
import { cn } from '@/lib/utils';
import { Chip, UnavailableValue, type Tone } from '@/components/entrepreneur/phase3/FinancialWidgets';

/**
 * Phase 4/5 equity & cap-table presentational widgets (ownership donut, dilution round cards,
 * founder-ownership journey, cap-table list). Pure presentational — real values in, honest
 * "Data unavailable" states when absent. All colors are theme tokens (dark-mode-safe).
 */

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
const intl = (n: number) => new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(n || 0);
const pct = (n: number) => `${new Intl.NumberFormat('en-IE', { maximumFractionDigits: 1 }).format(n || 0)}%`;

// Distinct, token-only segment colors (stroke = currentColor via these text-* classes).
const SEGMENT_COLORS = ['text-primary', 'text-success-text', 'text-warning', 'text-destructive', 'text-muted-foreground', 'text-foreground'] as const;

export interface DonutSegment {
  label: string;
  percent: number;
  value?: React.ReactNode;
}

// Cumulative start-percent per segment, computed outside render (a plain helper,
// not the component body) so there is no variable reassignment during render —
// satisfies the React Compiler `react-hooks/immutability` rule.
function cumulativeStarts(segments: DonutSegment[]): number[] {
  const starts: number[] = [];
  let cum = 0;
  for (const s of segments) {
    starts.push(cum);
    cum += s.percent || 0;
  }
  return starts;
}

export function OwnershipDonut({
  data,
  centerTop,
  centerBottom,
  className,
}: {
  data: DonutSegment[];
  centerTop?: React.ReactNode;
  centerBottom?: React.ReactNode;
  className?: string;
}) {
  const total = data.reduce((s, d) => s + (d.percent || 0), 0);
  if (!data.length || total <= 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
        <UnavailableValue />
      </div>
    );
  }
  const R = 42;
  const C = 2 * Math.PI * R;
  const starts = cumulativeStarts(data);
  return (
    <div className={cn('flex flex-col items-center gap-4 sm:flex-row sm:items-center', className)}>
      <div className="relative shrink-0" role="img" aria-label={`Ownership breakdown: ${data.map((d) => `${d.label} ${pct(d.percent)}`).join(', ')}`}>
        <svg viewBox="0 0 120 120" className="h-36 w-36">
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="16" stroke="currentColor" className="text-muted" />
          {data.map((d, i) => {
            const dash = (d.percent / 100) * C;
            const offset = -(starts[i] / 100) * C;
            return (
              <circle
                key={`${d.label}-${i}`}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                strokeWidth="16"
                stroke="currentColor"
                className={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerTop && <span className="text-lg font-bold leading-none text-foreground">{centerTop}</span>}
          {centerBottom && <span className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{centerBottom}</span>}
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {data.map((d, i) => (
          <li key={`${d.label}-leg-${i}`} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-foreground">
              <span className={cn('h-2.5 w-2.5 rounded-full bg-current', SEGMENT_COLORS[i % SEGMENT_COLORS.length])} aria-hidden />
              {d.label}
            </span>
            <span className="tabular-nums font-medium text-muted-foreground">
              {pct(d.percent)}{d.value != null ? <> · {d.value}</> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface DilutionRound {
  round: string;
  founderBefore: number;
  founderAfter: number;
  investor: number;
  valuation: number;
}

export function DilutionRoundCards({ rounds }: { rounds: DilutionRound[] }) {
  if (!rounds.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
        <span className="text-sm italic text-muted-foreground">No dilution scenarios yet — run a simulation to project future rounds.</span>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {rounds.map((r, i) => (
        <div key={`${r.round}-${i}`} className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{r.round}</p>
            <Chip tone={i === 0 ? 'primary' : 'muted'}>{i === 0 ? 'Current' : 'Projection'}</Chip>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Founder</dt>
              <dd className="font-medium text-foreground">
                {pct(r.founderBefore)} <span aria-hidden>→</span> <span className="text-primary">{pct(r.founderAfter)}</span>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">New investor</dt>
              <dd className="font-medium text-foreground">{pct(r.investor)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Valuation</dt>
              <dd className="font-medium text-foreground">{r.valuation > 0 ? eur(r.valuation) : '—'}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}

export interface JourneyPoint {
  label: string;
  percent: number;
}

export function JourneyBar({ points, title }: { points: JourneyPoint[]; title?: string }) {
  if (!points.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <UnavailableValue />
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {title && <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>}
      <ol className="flex items-end justify-between gap-2" role="img" aria-label={`${title ?? 'Ownership journey'}: ${points.map((p) => `${p.label} ${pct(p.percent)}`).join(', ')}`}>
        {points.map((p, i) => (
          <li key={`${p.label}-${i}`} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{pct(p.percent)}</span>
            <div className="flex w-full items-end justify-center">
              <div className="w-2/3 rounded-t-md bg-primary/80" style={{ height: `${Math.max(6, Math.min(100, p.percent))}px` }} />
            </div>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{p.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export interface CapTableRow {
  stakeholderName: string;
  type: string;
  shareClass?: string;
  sharesGranted: number;
  percent: number;
  investmentAmount?: number;
}

const TYPE_TONE: Record<string, Tone> = {
  founder: 'primary',
  investor: 'success',
  advisor: 'warning',
  esop: 'muted',
};

export function CapTableList({ rows, totalShares }: { rows: CapTableRow[]; totalShares?: number }) {
  if (!rows.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
        <span className="text-sm italic text-muted-foreground">No cap-table entries recorded yet.</span>
      </div>
    );
  }
  const totalInvest = rows.reduce((s, r) => s + (r.investmentAmount ?? 0), 0);
  const totalPct = rows.reduce((s, r) => s + (r.percent || 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Cap table of record</caption>
        <thead>
          <tr className="border-b border-border text-left">
            {['Stakeholder', 'Type', 'Share class', '% fully diluted', 'Investment'].map((c) => (
              <th key={c} scope="col" className="py-2 pr-4 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.stakeholderName}-${i}`} className="border-b border-border/60 last:border-0">
              <th scope="row" className="py-2.5 pr-4 text-left font-medium text-foreground">{r.stakeholderName}</th>
              <td className="py-2.5 pr-4"><Chip tone={TYPE_TONE[r.type?.toLowerCase()] ?? 'muted'}>{r.type}</Chip></td>
              <td className="py-2.5 pr-4 text-muted-foreground">{r.shareClass ?? <span className="italic">—</span>}</td>
              <td className="py-2.5 pr-4 tabular-nums text-foreground">{pct(r.percent)} <span className="text-muted-foreground">({intl(r.sharesGranted)})</span></td>
              <td className="py-2.5 tabular-nums text-foreground">{r.investmentAmount ? eur(r.investmentAmount) : '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className