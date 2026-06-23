import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Phase 3 financial-tracking presentational widgets (Figma 3.2 KPI Tracker / 3.3 Valuation).
 * Pure presentational — no data fetching, no fabricated values. When a value is absent the
 * caller passes `unavailable` so the exact card structure still renders with an honest state.
 * All colors are theme tokens (dark-mode-safe); typography/spacing follow the Figma scale.
 */

export type Tone = 'success' | 'warning' | 'destructive' | 'primary' | 'primarySolid' | 'muted';

const TONE: Record<Tone, string> = {
  success: 'bg-success-light text-success-text',
  warning: 'bg-warning text-warning-foreground',
  destructive: 'bg-destructive/10 text-destructive',
  primary: 'bg-primary/10 text-primary',
  primarySolid: 'bg-primary text-primary-foreground',
  muted: 'bg-muted text-muted-foreground',
};

export function Chip({ children, tone = 'muted', className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', TONE[tone], className)}>
      {children}
    </span>
  );
}

const UNAVAILABLE_COPY: Record<string, string> = {
  unavailable: 'Data unavailable',
  integration: 'Awaiting integration',
  config: 'Not yet configured',
};

export function UnavailableValue({ kind = 'unavailable', className }: { kind?: 'unavailable' | 'integration' | 'config'; className?: string }) {
  return (
    <span className={cn('text-sm italic text-muted-foreground', className)}>{UNAVAILABLE_COPY[kind]}</span>
  );
}

export function SectionCard({
  title,
  subtitle,
  headerRight,
  children,
  className,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-5 shadow-sm', className)}>
      {(title || headerRight) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-bold text-foreground">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{subtitle}</p>}
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </section>
  );
}

/** A KPI / valuation metric tile. Pass `unavailable` to render an honest empty state. */
export function MetricCard({
  label,
  value,
  delta,
  deltaTone = 'muted',
  chip,
  chipTone = 'muted',
  tone = 'card',
  unavailable,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: Tone;
  chip?: React.ReactNode;
  chipTone?: Tone;
  tone?: 'card' | 'muted' | 'primary';
  unavailable?: 'unavailable' | 'integration' | 'config';
  className?: string;
}) {
  const toneCls =
    tone === 'primary'
      ? 'bg-primary text-primary-foreground border-transparent'
      : tone === 'muted'
        ? 'bg-muted/40 border-border'
        : 'bg-card border-border';
  const labelCls = tone === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground';
  const valueCls = tone === 'primary' ? 'text-primary-foreground' : 'text-foreground';
  return (
    <div className={cn('rounded-xl border p-5 transition-colors hover:border-primary/40', toneCls, className)}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn('text-[13px] font-medium uppercase leading-5 tracking-wide', labelCls)}>{label}</p>
        {chip ? <Chip tone={chipTone}>{chip}</Chip> : null}
      </div>
      {unavailable ? (
        <div className="mt-2"><UnavailableValue kind={unavailable} /></div>
      ) : (
        <p className={cn('mt-1 text-[32px] font-semibold leading-[40px]', valueCls)}>{value}</p>
      )}
      {delta && !unavailable ? (
        <p className={cn('mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', TONE[deltaTone])}>{delta}</p>
      ) : null}
    </div>
  );
}

/** Circular progress ring. `percent` null → honest "Data unavailable". Real value only. */
export function StatusRing({
  percent,
  label,
  sublabel,
  className,
}: {
  percent: number | null;
  label: string;
  sublabel?: string;
  className?: string;
}) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const pct = percent == null ? 0 : Math.max(0, Math.min(100, percent));
  const offset = C - (pct / 100) * C;
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5', className)}>
      <div className="relative" role="img" aria-label={percent == null ? `${label}: data unavailable` : `${label}: ${pct}%`}>
        <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="10" stroke="currentColor" className="text-muted" />
          {percent != null && (
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              stroke="currentColor"
              className="text-primary transition-[stroke-dashoffset] duration-700"
              strokeDasharray={C}
              strokeDashoffset={offset}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {percent == null ? (
            <span className="px-3 text-center text-xs italic text-muted-foreground">Data unavailable</span>
          ) : (
            <span className="text-[28px] font-bold leading-none text-foreground">{pct}%</span>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
      {sublabel && <p className="text-[13px] leading-5 text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

export interface DataTableRow {
  metric: string;
  value?: React.ReactNode;
  unavailable?: 'unavailable' | 'integration' | 'config';
  chip?: React.ReactNode;
  chipTone?: Tone;
  highlight?: boolean;
}

/** Generic 3-column data table (METRIC | value | category/status chip). */
export function DataTable({
  columns,
  rows,
  caption,
}: {
  columns: [string, string, string];
  rows: DataTableRow[];
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-border text-left">
            {columns.map((c) => (
              <th key={c} scope="col" className="py-2 pr-4 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.metric}-${i}`} className={cn('border-b border-border/60 last:border-0', r.highlight && 'bg-primary/5')}>
              <th scope="row" className={cn('py-2.5 pr-4 text-left font-medium', r.highlight ? 'text-foreground font-semibold' : 'text-foreground')}>
                {r.metric}
              </th>
              <td className="py-2.5 pr-4 tabular-nums text-foreground">
                {r.unavailable ? <UnavailableValue kind={r.unavailable} /> : r.value}
              </td>
              <td className="py-2.5">{r.chip ? <Chip tone={r.chipTone ?? 'muted'}>{r.chip}</Chip> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Simple tokenized quarterly bar chart from real data; empty -> honest state. */
export function QuarterBars({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
        <UnavailableValue />
      </div>
    );
  }
  return (
    <div className="flex h-40 items-end gap-3" role="img" aria-label="Quarterly revenue">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-primary/80 transition-all"
              style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Honest integration banner — actions disabled until the integration exists. */
export function IntegrationNotice({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            disabled
            aria-disabled="true"
            title="Awaiting integration"
            className="inline-flex cursor-not-allowed items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground opacity-70"
          >
            {a}
          </button>
        ))}
        <span className="text-xs italic text-muted-foreground">Awaiting integration</span>
      </div>
    </div>
  );
}

export interface RailStep {
  label: string;
  description: string;
  state: 'complete' | 'current' | 'pending';
}

/** Figma 3.3 left "Verification Progress" rail — vertical stepper + overall-score footer. */
export function VerificationProgressRail({
  steps,
  overallPercent,
  helper,
}: {
  steps: RailStep[];
  overallPercent: number | null;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
        Verification progress
      </p>
      <ol className="space-y-1">
        {steps.map((s, i) => (
          <li key={s.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  s.state === 'complete'
                    ? 'border-transparent bg-success-light text-success-text'
                    : s.state === 'current'
                      ? 'border-transparent bg-primary text-primary-foreground'
                      : 'border-border bg-muted text-muted-foreground',
                )}
                aria-hidden
              >
                {s.state === 'complete' ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              {i < steps.length - 1 && <span className="my-1 w-px flex-1 bg-border" aria-hidden />}
            </div>
            <div className="pb-3">
              <p className="text-sm font-semibold text-foreground">
                {s.label}
                <span className="sr-only"> — {s.state}</span>
              </p>
              <p className="text-xs leading-5 text-muted-foreground">{s.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-2 rounded-lg border border-border bg-muted/40 p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Overall score</span>
          <span className="text-sm font-semibold text-foreground">{overallPercent == null ? '—' : `${overallPercent}%`}</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={overallPercent ?? 0}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${overallPercent ?? 0}%` }} />
        </div>
        {helper && <p className="mt-2 text-xs text-muted-foreground">{helper}</p>}
      </div>
    </div>
  );
}
