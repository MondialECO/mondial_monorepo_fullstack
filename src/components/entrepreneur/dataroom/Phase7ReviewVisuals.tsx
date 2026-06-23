'use client';

import { useEffect, useState } from 'react';
import { Trophy, BarChart3, Sparkles } from 'lucide-react';
import entrepreneurApi, {
  type AiReviewResponse,
  type AiReviewHistoryEntry,
} from '@/lib/api-entrepreneur';
import { SectionCard, MetricCard, StatusRing, Chip, UnavailableValue, type Tone } from '@/components/entrepreneur/phase3/FinancialWidgets';

const scoreTone = (v: number): Tone => (v >= 80 ? 'success' : v >= 60 ? 'warning' : 'destructive');
const scoreLabel = (v: number) => (v >= 80 ? 'Strong' : v >= 60 ? 'Fair' : 'Low');
const priorityTone = (p: string): Tone => (p === 'high' ? 'destructive' : p === 'medium' ? 'warning' : 'primary');

function ScoreBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="flex items-center gap-2 text-muted-foreground">
          {v}% <Chip tone={scoreTone(v)}>{scoreLabel(v)}</Chip>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${label} score`} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading AI review…</span>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}

export function Phase7ReviewVisuals() {
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<AiReviewResponse | null>(null);
  const [history, setHistory] = useState<AiReviewHistoryEntry[]>([]);
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
        const [rev, hist] = await Promise.allSettled([
          entrepreneurApi.getAiReview(id),
          entrepreneurApi.getAiReviewHistory(id),
        ]);
        if (cancelled) return;
        if (rev.status === 'fulfilled') setReview(rev.value);
        if (hist.status === 'fulfilled') setHistory(Array.isArray(hist.value) ? hist.value : []);
      } catch {
        if (!cancelled) setError('Could not load the AI review.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Skeleton />;

  if (!review) {
    return (
      <SectionCard title="Investor-ready review">
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
          <span className="text-sm italic text-muted-foreground">No review yet — run the readiness review below to generate your score.</span>
        </div>
      </SectionCard>
    );
  }

  const sb = review.scoreBreakdown;
  const recs = review.recommendations ?? [];
  const stageBars: Array<{ label: string; value: number }> = [
    { label: 'Verification', value: sb.verificationScore },
    { label: 'Financials', value: sb.financialScore },
    { label: 'Equity & cap table', value: sb.equityScore },
    { label: 'Funding ask', value: sb.fundingScore },
    { label: 'Data room', value: sb.dataRoomScore },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Readiness score" value={`${review.overallScore}/100`} chip={scoreLabel(review.overallScore)} chipTone={scoreTone(review.overallScore)} />
        <MetricCard label="Actions remaining" value={String(recs.length)} chip={recs.length ? `+${recs.reduce((s, r) => s + (r.potentialPointGain || 0), 0)} pts` : undefined} chipTone="muted" />
        <MetricCard label="Missing documents" unavailable="unavailable" />
        <MetricCard label="Pitch-deck grade" unavailable="unavailable" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        {/* Score ring + badge */}
        <div className="space-y-4">
          <StatusRing percent={review.overallScore} label="Investor-ready profile" sublabel={`Reviewed ${review.reviewedAt ? new Date(review.reviewedAt).toLocaleDateString() : ''}`} />
          <SectionCard title="Investor-ready badge">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-primary/10 p-2 text-primary"><Trophy className="h-5 w-5" aria-hidden /></span>
              <div>
                <p className="text-sm font-semibold text-foreground">{review.overallScore}/100</p>
                <p className="text-xs text-muted-foreground">
                  {review.investorReadyBadge ? 'Threshold met — badge eligible' : 'Below investor-ready threshold'}
                </p>
                <div className="mt-2"><Chip tone={review.investorReadyBadge ? 'success' : 'muted'}>{review.investorReadyBadge ? 'Eligible' : 'Pending'}</Chip></div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Stage breakdown */}
        <SectionCard title="Readiness by stage" subtitle="Score across your verified phases.">
          <div className="space-y-4">
            {stageBars.map((s) => (
              <ScoreBar key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </SectionCard>
      </div>

      {/* AI recommendations */}
      <SectionCard
        title="AI recommendations"
        headerRight={recs.length ? <Chip tone="primary">{`${recs.length} actions`}</Chip> : undefined}
      >
        {recs.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
            <span className="text-sm italic text-muted-foreground">No open recommendations — your profile looks complete.</span>
          </div>
        ) : (
          <ul className="space-y-3">
            {recs.map((r, i) => (
              <li key={`${r.title}-${i}`} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{r.title}</p>
                  <span className="flex items-center gap-2">
                    <Chip tone={priorityTone(r.priority)}>{r.priority}</Chip>
                    {r.potentialPointGain > 0 && <Chip tone="success">{`+${r.potentialPointGain} pts`}</Chip>}
                  </span>
                </div>
                {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Pitch-deck analysis (Backend Gap — honest shell) */}
      <SectionCard
        title="Pitch-deck analysis"
        headerRight={<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Sparkles className="h-4 w-4" aria-hidden /> AI</span>}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {['Clarity & narrative', 'Market size proof', 'Traction & metrics', 'Team pedigree'].map((d) => (
            <div key={d} className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
              <span className="text-sm text-foreground">{d}</span>
              <UnavailableValue kind="integration" />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs italic text-muted-foreground">Per-slide pitch-deck scoring requires a backend field that isn&apos;t exposed yet.</p>
      </SectionCard>

      {history.length > 0 && (
        <SectionCard title="Review history" headerRight={<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><BarChart3 className="h-4 w-4" aria-hidden /> {history.length}</span>}>
          <ul className="space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 last:border-0">
                <span className="text-foreground">{h.overallScore}/100 <Chip tone={h.investorReadyBadge ? 'success' : 'muted'}>{h.investorReadyBadge ? 'Eligible' : 'Pending'}</Chip></span>
                <span className="text-xs text-muted-foreground">{h.reviewedAt ? new Date(h.reviewedAt).toLocaleString() : ''} · {h.engineVersion}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

export default Phase7ReviewVisuals;
