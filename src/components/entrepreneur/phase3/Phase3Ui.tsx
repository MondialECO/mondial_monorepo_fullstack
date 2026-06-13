'use client';

import { ReactNode } from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shared presentational primitives for the Phase 3 redesign
 * (Figma "Financial Verification & Tracking" — Revenue Input / Automated
 * Valuation / KPI Tracker). All values are passed in; these render real data
 * or honest "Data unavailable" states — they never fabricate numbers.
 */

/* ---- Container with breadcrumb tabs + header ----------------------------- */

export function Phase3Container({
  crumbs,
  title,
  subtitle,
  children,
}: {
  crumbs: [string, string];
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden">
      <div className="flex items-center gap-2 px-6 pt-6 text-sm">
        <span className="text-muted-foreground">{crumbs[0]}</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground" aria-hidden />
        <span className="font-semibold text-primary">{crumbs[1]}</span>
      </div>
      <div className="px-6 py-6 mt-4 border-y border-border">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">{subtitle}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ---- Plain surface card -------------------------------------------------- */

export function Surface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('bg-card border border-border rounded-2xl', className)}>
      {children}
    </div>
  );
}

/* ---- Icon + bold value card (Verification Status / Financial Health) ----- */

export function IconStatCard({
  label,
  icon: Icon,
  value,
  sub,
  tone = 'primary',
}: {
  label: string;
  icon: LucideIcon;
  value: ReactNode;
  sub: string;
  tone?: 'primary' | 'success' | 'muted';
}) {
  const valueTone =
    tone === 'success'
      ? 'text-success-text'
      : tone === 'muted'
        ? 'text-muted-foreground'
        : 'text-primary';
  return (
    <Surface className="flex-1 min-w-0 px-4 py-5 flex flex-col gap-3 justify-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <span className="shrink-0 grid place-items-center size-12 rounded-full bg-primary/10 text-primary">
          <Icon className="w-5 h-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className={cn('text-sm font-semibold', valueTone)}>{value}</p>
          <p className="text-[13px] text-muted-foreground leading-snug">{sub}</p>
        </div>
      </div>
    </Surface>
  );
}

/* ---- Metric tile: label + big value + optional delta --------------------- */

export function MetricTile({
  label,
  value,
  available = true,
  delta,
  deltaPositive = true,
  icon: Icon,
  className,
}: {
  label: string;
  value: ReactNode;
  available?: boolean;
  delta?: string;
  deltaPositive?: boolean;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <Surface className={cn('p-5 flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon ? <Icon className="w-4 h-4 text-muted-foreground" aria-hidden /> : null}
      </div>
      {available ? (
        <p className="text-[28px] leading-9 font-semibold text-foreground tabular-nums">{value}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">Data unavailable</p>
      )}
      {available && delta ? (
        <p className={cn('text-xs font-medium', deltaPositive ? 'text-success-text' : 'text-destructive')}>
          {delta}
        </p>
      ) : null}
    </Surface>
  );
}

/* ---- Primary-tinted info callout ----------------------------------------- */

export function InfoCallout({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
      <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden />
      <div>
        {title ? <p className="text-sm font-semibold text-foreground mb-1">{title}</p> : null}
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

/* ---- Status chip --------------------------------------------------------- */

export function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'destructive' | 'primary';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-muted text-muted-foreground',
    success: 'bg-success-light text-success-text',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
    primary: 'bg-primary/10 text-primary',
  };
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}

/* ---- Gradient quarterly/period bar chart (pure CSS, token-based) --------- */

export function RevenueBars({
  data,
  className,
  height = 236,
}: {
  data: { label: string; value: number }[];
  className?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);
  const hasData = max > 0;

  if (!hasData) {
    return (
      <div
        className={cn('flex items-center justify-center rounded-xl bg-muted/40', className)}
        style={{ height }}
        role="img"
        aria-label="Revenue chart — no data entered yet"
      >
        <p className="text-sm italic text-muted-foreground">Enter revenue to see the trend</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-end justify-between gap-3" style={{ height }}>
        {data.map((d) => {
          const pct = max > 0 ? Math.max((d.value / max) * 100, 4) : 0;
          return (
            <div key={d.label} className="flex-1 h-full flex items-end">
              <div className="w-full rounded-md bg-primary/10 relative" style={{ height: '100%' }}>
                <div
                  className="absolute bottom-0 inset-x-0 rounded-md bg-gradient-to-t from-primary/30 to-primary"
                  style={{ height: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3 text-center text-sm text-foreground">
        {data.map((d) => (
          <p key={d.label} className="flex-1">
            {d.label}
          </p>
        ))}
      </div>
    </div>
  );
}
