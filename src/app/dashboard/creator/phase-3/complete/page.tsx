'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { withIdeaContext } from '@/lib/creator-routes';
import { PageContainer } from '@/components/layout/PageContainer';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  FileText,
  HelpCircle,
  Layers,
  Lightbulb,
  Loader2,
  Lock,
  MinusCircle,
  Rocket,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
  RotateCw,
} from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  creatorJourneyApi,
  type InvestorReadinessScore,
  type ReadinessDeduction,
} from '@/lib/api-creator-journey';
import type { Phase3FreshnessOverview } from '@/types/creator/ai';
import type { ComputedJourneyStatus } from '@/types/creator/journey-api';
import { cn } from '@/lib/utils';

type UnlockItem = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
};

const UNLOCKS: UnlockItem[] = [
  {
    icon: BarChart3,
    title: 'Commercial Pricing & Margin Calculator',
    body: 'Structure subscription tiers, one-time fees, and unit margins against benchmark cost structures.',
  },
  {
    icon: FileText,
    title: 'Resource & Budget Modeling',
    body: 'Model headcount timeline, infra runway, and operational capital expenditure allocations.',
  },
  {
    icon: Rocket,
    title: 'Go-To-Market Execution Engine',
    body: 'Deploy channel acquisition sequencing, customer payback milestones, and commercial rollout roadmap.',
  },
];

const gradeForScore = (score?: number | null) => {
  const val = score ?? 0;
  if (val >= 85) return 'A';
  if (val >= 70) return 'B';
  if (val >= 50) return 'C';
  return 'D';
};

const displayScore = (score?: number | null) =>
  typeof score === 'number' && !isNaN(score)
    ? Number.isInteger(score)
      ? score.toFixed(0)
      : score.toFixed(1)
    : '0';

function ProgressTrack({
  value,
  max,
  prominent = false,
}: {
  value: number;
  max: number;
  prominent?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cn(
        'overflow-hidden rounded-full bg-muted border border-border/40',
        prominent ? 'h-2.5' : 'h-1.5',
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          percentage >= 80 ? 'bg-primary' : percentage >= 50 ? 'bg-amber-500' : 'bg-destructive/80',
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function Phase3CompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryIdeaId = searchParams.get('ideaId');
  const {
    state: { activeIdeaId },
    advancePhase,
  } = useCreatorProgress();
  const currentIdeaId = queryIdeaId || activeIdeaId || null;

  const [computed, setComputed] = useState<ComputedJourneyStatus | null>(null);
  const [readiness, setReadiness] = useState<InvestorReadinessScore | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [freshness, setFreshness] = useState<Phase3FreshnessOverview | null>(null);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const hasCompletedRef = useRef(false);

  const loadFreshness = async () => {
    try {
      const f = await creatorJourneyApi.getPhase3Freshness(currentIdeaId);
      setFreshness(f);
    } catch {
      // Non-blocking
    }
  };

  const handleRecompute = async () => {
    try {
      setIsRecomputing(true);
      const res = await creatorJourneyApi.computeReadiness(currentIdeaId);
      if (res?.investorReadinessScore) {
        setReadiness(res.investorReadinessScore);
      }
      await loadFreshness();
    } catch (e) {
      console.error('Failed to recompute readiness score', e);
    } finally {
      setIsRecomputing(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          try {
            const { investorReadinessScore } = await creatorJourneyApi.completeMasterplan(currentIdeaId);
            if (active) setReadiness(investorReadinessScore);
          } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
              const message = (error.response.data?.message as string) ?? 'A module is missing.';
              if (active) setMissing(message.replace('Missing module: ', ''));
            }
          }
        }
        const { journey, computedStatus } = await creatorJourneyApi.get(currentIdeaId);
        if (active) {
          setComputed(computedStatus);
          const p3 = journey.phase3Data as { investorReadinessScore?: InvestorReadinessScore };
          if (p3?.investorReadinessScore) {
            setReadiness(p3.investorReadinessScore);
          }
        }
        loadFreshness();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentIdeaId]);

  const canContinue =
    computed?.phase3.status === 'completed' && computed?.phase4.status === 'available';

  const handleContinue = async () => {
    if (!canContinue) return;
    setIsNavigating(true);
    advancePhase(3);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        const { computedStatus } = await creatorJourneyApi.get(activeIdeaId);
        if (computedStatus?.phase4?.status === 'available') break;
      } catch {
        // Keep polling briefly; the destination performs its own backend gate too.
      }
    }

    router.push(withIdeaContext('/dashboard/creator/offer-pricing', currentIdeaId));
  };

  const dimensions = readiness?.breakdown
    ? [
        {
          key: 'ConceptClarity',
          label: 'Concept Clarity & Differentiation',
          icon: Lightbulb,
          value: readiness.breakdown.conceptClarity ?? 0,
          max: 20,
          description: 'Idea validation score, clarity of value proposition, and competitive uniqueness.',
        },
        {
          key: 'MarketEvidence',
          label: 'Market Evidence & Opportunity Sizing',
          icon: TrendingUp,
          value: readiness.breakdown.marketEvidence ?? 0,
          max: 20,
          description: 'Canonical TAM addressability, customer segment specificity, and synthesized business plan.',
        },
        {
          key: 'FinancialModel',
          label: 'Financial Projections & Unit Economics',
          icon: BarChart3,
          value: readiness.breakdown.financialModel ?? 0,
          max: 25,
          description: '36-month bottom-up projections, break-even velocity, and LTV/CAC customer payback sustainability.',
        },
        {
          key: 'LegalReadiness',
          label: 'Legal & Compliance Governance',
          icon: Scale,
          value: readiness.breakdown.legalReadiness ?? 0,
          max: 15,
          description: 'Completion of statutory, corporate structure, IP protection, and data privacy milestones.',
        },
        {
          key: 'TeamCredibility',
          label: 'Team Credibility & Founder Advantage',
          icon: Users,
          value: readiness.breakdown.teamCredibility ?? 0,
          max: 20,
          description: 'Documented founder edge, specialist matching coverage, and execution capabilities.',
        },
      ]
    : [];

  const getDeductionsForDimension = (dimKey: string): ReadinessDeduction[] => {
    if (!readiness?.deductions) return [];
    return readiness.deductions.filter(
      (d) => d.dimension.toLowerCase() === dimKey.toLowerCase(),
    );
  };

  return (
    <PageContainer variant="focused" className="flex flex-col gap-8">
      {/* Header - Diagnostic, Objective, Institutional */}
        <header className="flex flex-col items-center gap-2.5 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider font-mono">
            <span>Phase 3 Evaluation · Step 3.7</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans">
            Investor Readiness Audit
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            An objective diagnostic evaluation of your venture intelligence. Review specific deductions and remediation paths before advancing to commercial setup.
          </p>
        </header>

        {loading && (
          <Card className="flex items-center justify-center gap-3 py-16 border-border/70 bg-card text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-sm font-medium">Computing institutional readiness score &amp; component breakdown…</span>
          </Card>
        )}

        {!loading && missing && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-foreground">
            <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-300">
                Incomplete Phase 3 Prerequisite:
              </span>{' '}
              One module still requires completion: <strong>{missing.replace(/_/g, ' ')}</strong>. Complete it to unlock Phase 4.
            </div>
          </div>
        )}

        {!loading && readiness && (
          <>
            {/* Upstream Changes / Update Available Alert */}
            {(readiness.updateAvailable || freshness?.readinessUpdateAvailable) && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-bold">Readiness update available:</span>{' '}
                    Upstream Phase 3 modules ({readiness.changedSources?.join(', ') || freshness?.readinessChangedSources?.join(', ') || 'Business Model / Legal / Projections'}) were modified since this score was computed.
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRecompute}
                  disabled={isRecomputing}
                  className="h-8 text-xs border-amber-500/40 text-amber-900 dark:text-amber-100 hover:bg-amber-500/20 shrink-0 font-medium"
                >
                  {isRecomputing ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <RotateCw className="size-3.5 mr-1.5" />}
                  Re-evaluate Score
                </Button>
              </div>
            )}

            {/* Score Hero Summary Card */}
            <Card className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border/70">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Aggregated Readiness Score
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight text-foreground">
                      {displayScore(readiness.total)}
                    </span>
                    <span className="text-xl font-mono text-muted-foreground font-semibold">/ 100</span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
                    <span className="font-mono text-sm font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Grade {gradeForScore(readiness.total)}
                    </span>
                    <span>{readiness.label}</span>
                  </div>
                  <p className="text-body text-muted-foreground max-w-[240px] sm:text-right">
                    {readiness.total >= 85
                      ? 'Exceeds standard institutional seed diligence thresholds.'
                      : readiness.total >= 70
                      ? 'Solid foundation with minor optimization opportunities identified below.'
                      : 'Key venture weaknesses require remediation before institutional review.'}
                  </p>
                </div>
              </div>

              {/* Progress Track */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>Audit Benchmark Trajectory</span>
                  <span className="font-mono text-foreground font-semibold">
                    {displayScore(readiness.total)}% Complete
                  </span>
                </div>
                <ProgressTrack value={readiness.total} max={100} prominent />
              </div>
            </Card>

            {/* Dimensional Breakdown & Per-Deduction Detail */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground font-sans">
                    Dimensional Diagnostic &amp; Deduction Breakdown
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Inspect the exact components costing points and tap remediation actions to repair them.
                  </p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">5 Evaluated Dimensions</span>
              </div>

              <div className="space-y-4">
                {dimensions.map((dim) => {
                  const Icon = dim.icon;
                  const dimDeductions = getDeductionsForDimension(dim.key);
                  const isPerfect = dimDeductions.length === 0 && dim.value >= dim.max;

                  return (
                    <Card
                      key={dim.key}
                      className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm space-y-4 transition-colors hover:border-border"
                    >
                      {/* Dimension Title & Score Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary">
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground font-sans">
                              {dim.label}
                            </h3>
                            <p className="text-xs text-muted-foreground">{dim.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0">
                          <span className="text-base font-bold font-mono text-foreground">
                            {displayScore(dim.value)}{' '}
                            <span className="text-xs font-normal text-muted-foreground">/ {dim.max}</span>
                          </span>
                          <div className="w-24 sm:w-28">
                            <ProgressTrack value={dim.value} max={dim.max} />
                          </div>
                        </div>
                      </div>

                      {/* Deduction Detail or Perfect Status */}
                      <div className="pt-2 border-t border-border/60">
                        {dimDeductions.length > 0 ? (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 text-label font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                              <MinusCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Identified Weaknesses &amp; Point Deductions ({dimDeductions.length})</span>
                            </div>

                            <div className="space-y-2">
                              {dimDeductions.map((deduction, dIdx) => (
                                <div
                                  key={dIdx}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs"
                                >
                                  <div className="flex items-start gap-2.5">
                                    <span className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-badge font-mono font-bold text-destructive bg-destructive/10 border border-destructive/20">
                                      -{deduction.pointsLost} pts
                                    </span>
                                    <p className="text-foreground leading-snug">{deduction.issue}</p>
                                  </div>

                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="h-7 shrink-0 gap-1.5 rounded-lg border-primary/25 bg-card px-2.5 text-badge font-medium text-primary hover:bg-primary/5 shadow-none"
                                  >
                                    <Link href={withIdeaContext(deduction.remediationRoute, currentIdeaId)}>
                                      <span>{deduction.remediationTitle}</span>
                                      <ChevronRight className="size-3" />
                                    </Link>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span>Institutional standard met — no point deductions applied in this dimension.</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Unlocked Capabilities in Phase 4 */}
            <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Rocket className="size-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                  Phase 4 Unlocks — Commercial &amp; Go-To-Market Execution
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {UNLOCKS.map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-4"
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <h4 className="text-xs font-semibold text-foreground font-sans">{title}</h4>
                    <p className="text-body text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Action Footer Navigation */}
        <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => router.push(withIdeaContext('/dashboard/creator/phase-3/business-plan', currentIdeaId))}
            disabled={isNavigating}
            className="h-10 rounded-xl border-border px-4 text-sm font-medium text-muted-foreground shadow-none"
          >
            <ArrowLeft className="size-4 mr-2" /> Business Plan
          </Button>
          <Button
            onClick={handleContinue}
            disabled={isNavigating || !canContinue}
            className="h-10 gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-60"
          >
            {isNavigating && <Loader2 className="size-4 animate-spin" />}
            Proceed to Phase 4: Commercial Setup
            {!isNavigating && <ArrowRight className="size-4" />}
          </Button>
        </div>
    </PageContainer>
  );
}
