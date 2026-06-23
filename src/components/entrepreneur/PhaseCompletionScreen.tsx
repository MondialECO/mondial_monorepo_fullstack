'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Trophy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard, Chip, UnavailableValue, type Tone } from '@/components/entrepreneur/phase3/FinancialWidgets';

/**
 * Shared Phase-completion / celebration screen (Figma P5 Complete, P6 Data Room
 * Complete, P7 Badge Claimed). Pure presentational — the route page fetches the
 * real progress/funding values and passes them in. Backend-gap items render honest
 * states; no fabricated metrics. Theme tokens only; dark-mode-safe; a11y.
 */

export interface CompletionStatusCard {
  icon: LucideIcon;
  label: string;
  value?: React.ReactNode;
  sub?: string;
  tone?: Tone;
  unavailable?: 'unavailable' | 'integration' | 'config';
}

export interface CompletionUnlockItem {
  label: string;
  sub?: string;
  /** true when this item has no backing backend field (render honest, not a check). */
  gap?: boolean;
}

export function PhaseCompletionScreen({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  statusCards,
  score,
  scoreSub,
  unlocked,
  next,
  continueHref,
  continueLabel,
  completedPhases,
  currentPhase,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
  statusCards: CompletionStatusCard[];
  score: number | null;
  scoreSub?: string;
  unlocked: CompletionUnlockItem[];
  next: { chip: string; title: string; desc: string };
  continueHref: string;
  continueLabel: string;
  completedPhases: number[];
  currentPhase: number;
}) {
  const phases = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-light text-success-text">
          <Icon className="h-9 w-9" aria-hidden />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-success-text">{eyebrow}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">{subtitle}</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statusCards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <span className={`inline-flex rounded-lg p-2 ${c.tone === 'success' ? 'bg-success-light text-success-text' : 'bg-primary/10 text-primary'}`}>
              <c.icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
            {c.unavailable ? (
              <div className="mt-0.5"><UnavailableValue kind={c.unavailable} /></div>
            ) : (
              <p className="text-lg font-bold text-foreground">{c.value}</p>
            )}
            {c.sub && <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* Investor-Ready Score (real trust score) */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <span className="flex items-center gap-3">
          <span className="rounded-lg bg-primary/10 p-2 text-primary"><Trophy className="h-5 w-5" aria-hidden /></span>
          <span>
            <span className="block text-sm font-semibold text-foreground">Investor-Ready Score</span>
            {scoreSub && <span className="block text-xs text-muted-foreground">{scoreSub}</span>}
          </span>
        </span>
        <span className="text-2xl font-bold text-foreground" role="status" aria-live="polite">
          {score == null ? '—' : `${score}/100`}
        </span>
      </div>

      {/* You just unlocked */}
      <SectionCard title="You just unlocked">
        <ul className="space-y-3">
          {unlocked.map((u) => (
            <li key={u.label} className="flex items-start gap-3">
              {u.gap ? (
                <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-border bg-muted" aria-hidden />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-text" aria-hidden />
              )}
              <span>
                <span className="block text-sm font-medium text-foreground">{u.label}</span>
                {u.gap ? (
                  <span className="block text-xs"><UnavailableValue kind="integration" /></span>
                ) : (
                  u.sub && <span className="block text-xs text-muted-foreground">{u.sub}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Next phase preview */}
      <SectionCard title={next.title} headerRight={<Chip tone="primary">{next.chip}</Chip>}>
        <p className="text-sm text-muted-foreground">{next.desc}</p>
      </SectionCard>

      {/* Phase stepper (real completedPhases / currentPhase) */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Journey progress</p>
        <ol className="flex flex-wrap items-center gap-2" aria-label="Phase progress">
          {phases.map((p) => {
            const done = completedPhases.includes(p);
            const current = currentPhase === p;
            return (
              <li
                key={p}
                aria-current={current ? 'step' : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? 'bg-success-light text-success-text'
                    : current
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {p}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <Button asChild variant="outline">
          <Link href="/dashboard/entrepreneur">View dashboard</Link>
        </Button>
        <Button asChild>
          <Link href={continueHref}>
            {continueLabel}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default PhaseCompletionScreen;
