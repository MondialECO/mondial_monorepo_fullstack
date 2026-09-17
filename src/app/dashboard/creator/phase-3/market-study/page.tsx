'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Sparkles,
  RotateCw,
  AlertTriangle,
  FileWarning,
  TrendingDown,
  ShieldAlert,
  Radio,
  CheckCircle2,
  ExternalLink,
  Target,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  useAiCredits,
  useMarketStudySessionTimed,
  useStartMarketStudy,
  useRegenerateMarketStudy,
} from '@/hooks/queries/creator-ai';
import { creatorJourneyApi, getCreatorWorkspaceIdea } from '@/lib/api-creator-journey';
import {
  hasAiOutput,
  type MarketStudyOutput,
  type MarketSizingNode,
  type DirectCompetitor,
  type IndirectCompetitor,
  type DemandSignal,
  type SizingRisk,
} from '@/types/creator/ai';
import { toAiError, type AiError } from '@/lib/ai-errors';

function formatCurrency(amount?: number, currency = 'USD'): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return '—';
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  if (amount >= 1_000_000_000) {
    const val = amount / 1_000_000_000;
    return `${symbol}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `${symbol}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return `${symbol}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
  }
  return `${symbol}${amount.toLocaleString()}`;
}

export default function MarketStudyPage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();

  const [loading, setLoading] = useState(true);
  const [marketStudySessionId, setMarketStudySessionId] = useState<string | null>(null);
  const [clarifierSessionId, setClarifierSessionId] = useState<string | null>(null);
  const [businessIdeaId, setBusinessIdeaId] = useState<string | null>(null);
  const [startError, setStartError] = useState<AiError | null>(null);

  const startMutation = useStartMarketStudy();
  const regenerateMutation = useRegenerateMarketStudy();
  const credits = useAiCredits();
  const marketStudyCost = credits.data?.costs?.MarketStudy ?? 20;
  const insufficientCredits = credits.data ? credits.data.balance < marketStudyCost : false;

  const session = useMarketStudySessionTimed(marketStudySessionId);
  const output = (session.data as { output?: MarketStudyOutput } | undefined)?.output;
  const completed =
    session.phase === 'terminal' &&
    hasAiOutput((session.data as { status?: import('@/types/creator/ai').AiSessionStatus })?.status) &&
    !!output;

  const studyError = (session.data as { error?: string | null } | undefined)?.error ?? null;
  const terminalFailed = !!marketStudySessionId && session.phase === 'terminal' && !completed;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get();
        if (!active) return;
        const p3 = journey.phase3Data as {
          marketStudySessionId?: string;
          clarifierSessionId?: string;
        } | undefined;
        const p2 = journey.phase2Data as { clarifierSessionId?: string } | undefined;

        setMarketStudySessionId(p3?.marketStudySessionId ?? null);
        setClarifierSessionId(p3?.clarifierSessionId ?? p2?.clarifierSessionId ?? null);
        setBusinessIdeaId(getCreatorWorkspaceIdea());
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleStart = async () => {
    if (!clarifierSessionId) {
      setStartError({
        kind: 'other',
        message: 'No completed Phase 2 Clarifier session found. Please complete Phase 2 first.',
      });
      return;
    }
    setStartError(null);
    try {
      const res = await startMutation.mutateAsync({
        clarifierSessionId,
        businessIdeaId: businessIdeaId ?? undefined,
      });
      setMarketStudySessionId(res.sessionId);
    } catch (err) {
      setStartError(toAiError(err, 'Failed to start Market Study generation.'));
    }
  };

  const handleRegenerate = async () => {
    if (!marketStudySessionId) return;
    setStartError(null);
    try {
      await regenerateMutation.mutateAsync(marketStudySessionId);
    } catch (err) {
      setStartError(toAiError(err, 'Failed to regenerate Market Study.'));
    }
  };

  const handleNext = () => {
    completeStep(3, 1);
    router.push('/dashboard/creator/phase-3/business-model');
  };

  const isGenerating = session.phase === 'polling' || startMutation.isPending || regenerateMutation.isPending;

  // Market Sizing Calculations for Funnel Proportions
  const tam = output?.marketSizing?.tam;
  const sam = output?.marketSizing?.sam;
  const som = output?.marketSizing?.som;

  const samPctOfTam = sam?.percentageOfTam ?? (tam?.value && sam?.value ? (sam.value / tam.value) * 100 : 35);
  const somPctOfSam = som?.percentageOfSam ?? (sam?.value && som?.value ? (som.value / sam.value) * 100 : 15);

  const samReductionPct = Math.max(0, Math.round(100 - samPctOfTam));
  const somReductionPct = Math.max(0, Math.round(100 - somPctOfSam));

  return (
    <Phase3SetupShell
      fullWidth
      stepEyebrow="Step 3.1"
      title="Market Study & Competitive Intelligence"
      description="Comprehensive TAM/SAM/SOM sizing funnel, competitor benchmarking, demand signals, and sector validation."
    >
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
        {/* Error Banners */}
        {startError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-destructive">Generation Error</h4>
              <p className="text-xs text-foreground/80">{startError.message}</p>
            </div>
          </div>
        )}

        {terminalFailed && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileWarning className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-destructive">Market Study generation was interrupted</h4>
                <p className="text-xs text-foreground/90">
                  The AI generation did not finish. Your {marketStudyCost} credits have been automatically refunded to your balance.
                </p>
                {studyError && (
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Detail: {studyError}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={handleStart}
              disabled={isGenerating || insufficientCredits}
              className="gap-2 shrink-0 text-xs font-semibold"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry Generation
            </Button>
          </div>
        )}

        {/* Pre-generation / Empty State */}
        {!completed && !isGenerating && !terminalFailed && (
          <Card className="rounded-2xl border border-border bg-card p-8 md:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Generate Market Study &amp; Competitor Intelligence
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Synthesize live market sizing funnels (TAM/SAM/SOM), assess direct and indirect competitors, uncover exploitable gaps, and surface demand signals.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/40 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Cost:{' '}
                <span className="font-mono font-medium text-foreground">
                  {marketStudyCost} credits
                </span>
                {credits.data && (
                  <span className="text-muted-foreground/80">
                    (Balance: <span className="font-mono">{credits.data.balance}</span>)
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/creator/phase-2/complete')}
                className="w-full sm:w-auto text-xs font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Phase 2
              </Button>
              <Button
                onClick={handleStart}
                disabled={isGenerating || insufficientCredits || !clarifierSessionId}
                className="w-full sm:w-auto gap-2 text-xs font-semibold px-6"
              >
                <Sparkles className="w-4 h-4" />
                Generate Market Study
              </Button>
            </div>

            {insufficientCredits && (
              <p className="text-xs text-destructive mt-2">
                Insufficient credit balance ({credits.data?.balance ?? 0} available). Please top up to proceed.
              </p>
            )}
          </Card>
        )}

        {/* Polling / In-Flight State */}
        {isGenerating && (
          <Card className="rounded-2xl border border-border bg-card p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm animate-pulse">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <RotateCw className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Synthesizing Market Intelligence</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Running bottom-up market sizing calculations, competitor benchmarking matrices, and demand signal verifications...
              </p>
            </div>
            <div className="w-48 h-1.5 bg-muted rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-indeterminate" />
            </div>
          </Card>
        )}

        {/* Completed Output View */}
        {completed && output && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* 1. Market Sizing Funnel (Stacked Horizontal Bars + Step Reductions + Methodology Strip) */}
            <Card className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-semibold text-foreground tracking-tight">
                      Market Sizing Funnel (TAM / SAM / SOM)
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hierarchical top-down and bottom-up market constriction showing addressable and serviceable capture.
                  </p>
                </div>
                <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground self-start sm:self-auto">
                  Version <span className="font-mono font-medium ml-1">{session.data?.currentVersion ?? 1}</span>
                </Badge>
              </div>

              {/* Stacked Proportional Horizontal Bars */}
              <div className="space-y-4 pt-2">
                {/* Level 1: TAM Bar (100% width) */}
                <div className="space-y-2">
                  <div className="w-full rounded-xl border border-border/70 bg-muted/20 dark:bg-muted/15 p-4 transition-all hover:border-primary/40">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-primary/10 text-primary uppercase tracking-wider">
                            TAM
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {tam?.label || 'Total Addressable Market'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                          {tam?.derivation || 'Total global market demand and theoretical ceiling for this sector.'}
                        </p>
                      </div>
                      <div className="text-left md:text-right shrink-0">
                        <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                          {formatCurrency(tam?.value, tam?.currency)}
                        </div>
                        {tam?.sourceAttribution ? (
                          <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                            <span className="text-muted-foreground/70">Source:</span> {tam.sourceAttribution}
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground/60 italic">Estimated from industry baseline</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step Bridge 1: TAM -> SAM Reduction */}
                <div className="pl-6 md:pl-10 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 dark:bg-muted/40 border border-border/60">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      <strong className="font-mono text-foreground font-semibold">-{samReductionPct}%</strong> filter
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/90 italic line-clamp-1">
                    Narrowed by: {sam?.derivation ? sam.derivation.split('.')[0] : 'Geographic, regulatory, and direct demographic focus'}
                  </p>
                </div>

                {/* Level 2: SAM Bar (Width proportional, min 45%) */}
                <div className="space-y-2">
                  <div
                    style={{ width: `${Math.max(45, Math.min(100, samPctOfTam))}%` }}
                    className="rounded-xl border border-border/80 bg-muted/50 dark:bg-muted/40 p-4 transition-all hover:border-primary/40"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-primary/15 text-primary uppercase tracking-wider">
                            SAM
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {sam?.label || 'Serviceable Addressable Market'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                          {sam?.derivation || 'Target segment directly reachable with current business capabilities and geography.'}
                        </p>
                      </div>
                      <div className="text-left md:text-right shrink-0">
                        <div className="text-xl font-bold font-mono text-foreground tracking-tight">
                          {formatCurrency(sam?.value, sam?.currency)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-mono font-medium">{samPctOfTam.toFixed(0)}%</span> of TAM
                        </div>
                        {sam?.sourceAttribution && (
                          <div className="text-[10px] text-muted-foreground/80 mt-0.5 truncate max-w-[200px]">
                            {sam.sourceAttribution}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step Bridge 2: SAM -> SOM Reduction */}
                <div className="pl-6 md:pl-10 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 dark:bg-muted/40 border border-border/60">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      <strong className="font-mono text-foreground font-semibold">-{somReductionPct}%</strong> capture limit
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/90 italic line-clamp-1">
                    Constrained by: {som?.derivation ? som.derivation.split('.')[0] : 'Realistic early-stage adoption capacity and acquisition economics'}
                  </p>
                </div>

                {/* Level 3: SOM Bar (Width proportional, min 25%) */}
                <div className="space-y-2">
                  <div
                    style={{ width: `${Math.max(28, Math.min(85, (samPctOfTam * somPctOfSam) / 100 * 2.5))}%` }}
                    className="rounded-xl border-2 border-primary/50 bg-primary/5 dark:bg-primary/10 p-4 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-primary text-primary-foreground uppercase tracking-wider">
                            SOM
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {som?.label || 'Serviceable Obtainable Market'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                          {som?.derivation || 'Realistic market share achievable within the initial 24–36 month operational runway.'}
                        </p>
                      </div>
                      <div className="text-left md:text-right shrink-0">
                        <div className="text-lg font-bold font-mono text-primary tracking-tight">
                          {formatCurrency(som?.value, som?.currency)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-mono font-medium">{somPctOfSam.toFixed(0)}%</span> of SAM
                        </div>
                        {som?.sourceAttribution && (
                          <div className="text-[10px] text-muted-foreground/80 mt-0.5 truncate max-w-[200px]">
                            {som.sourceAttribution}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Methodology Strip (Bottom-Up Arithmetic) */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 mt-6">
                <div className="flex items-start gap-2.5">
                  <Compass className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Estimation Methodology &amp; Bottom-Up Arithmetic
                    </h4>
                    <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                      {output.marketSizing?.methodology ||
                        'TAM derived from sector-wide transactional volume and addressable seats; SAM adjusted for target geographies and platform compatibility; SOM constrained by realistic first-year CAC, sales velocity, and retention modeling.'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Market Gap Validation Card */}
            {output.marketGapValidation && (
              <Card className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-base font-semibold text-foreground tracking-tight">
                      Validated Market Gap
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold capitalize px-2.5 py-0.5 ${
                      output.marketGapValidation.confidenceLevel === 'high'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : output.marketGapValidation.confidenceLevel === 'moderate'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : output.marketGapValidation.confidenceLevel === 'speculative'
                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'border-destructive/60 bg-destructive/10 text-destructive'
                    }`}
                  >
                    Confidence: {output.marketGapValidation.confidenceLevel || 'UNKNOWN'}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Primary Opportunity</span>
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {output.marketGapValidation.primaryGap}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-1">
                    {output.marketGapValidation.validationRationale}
                  </p>
                </div>
              </Card>
            )}

            {/* 3. Competitor Landscape Matrix */}
            {output.competitorLandscape && (
              <Card className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
                <div className="space-y-1 border-b border-border pb-4">
                  <h3 className="text-base font-semibold text-foreground tracking-tight">
                    Competitor Landscape &amp; Benchmarking
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {output.competitorLandscape.summary || 'Direct incumbents and indirect substitutes mapped by position, pricing, and structural gaps.'}
                  </p>
                </div>

                {/* Direct Competitors Grid */}
                {output.competitorLandscape.directCompetitors?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Direct Competitors
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {output.competitorLandscape.directCompetitors.map((comp, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-border bg-card p-4 space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-semibold text-sm text-foreground">{comp.name}</h5>
                              {comp.estimatedMarketShare && (
                                <span className="text-[11px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                  {comp.estimatedMarketShare}
                                </span>
                              )}
                            </div>
                            {comp.pricingModel && (
                              <p className="text-xs text-muted-foreground">
                                <strong className="text-foreground/80 font-medium">Pricing:</strong> {comp.pricingModel}
                              </p>
                            )}

                            {/* Strengths & Weaknesses */}
                            <div className="space-y-1.5 pt-1">
                              {comp.strengths?.length > 0 && (
                                <div className="text-[11px] text-muted-foreground leading-tight">
                                  <span className="font-semibold text-foreground/80">Strengths:</span> {comp.strengths.join(', ')}
                                </div>
                              )}
                              {comp.weaknesses?.length > 0 && (
                                <div className="text-[11px] text-muted-foreground leading-tight">
                                  <span className="font-semibold text-foreground/80">Weaknesses:</span> {comp.weaknesses.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Exploitable Gap (Highlighted) */}
                          <div className="mt-3 pt-2.5 border-t border-border/80 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                              Exploitable Gap
                            </span>
                            <p className="text-xs text-foreground/95 font-medium leading-relaxed">
                              {comp.exploitableGap}
                            </p>
                            {comp.sourceAttribution && (
                              <div className="text-[10px] text-muted-foreground/70 truncate pt-0.5">
                                Ref: {comp.sourceAttribution}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Indirect Competitors Strip */}
                {output.competitorLandscape.indirectCompetitors?.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Indirect Substitutes &amp; Alternatives
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {output.competitorLandscape.indirectCompetitors.map((ind, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-border/70 bg-muted/20 p-3 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-foreground">{ind.name}</div>
                            <p className="text-xs text-muted-foreground">{ind.substituteApproach}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-semibold shrink-0 ${
                              ind.threatLevel === 'high'
                                ? 'border-destructive/40 text-destructive'
                                : ind.threatLevel === 'medium'
                                ? 'border-amber-500/40 text-amber-600 dark:text-amber-400'
                                : ind.threatLevel === 'low'
                                ? 'border-border text-muted-foreground'
                                : 'border-destructive/60 bg-destructive/10 text-destructive'
                            }`}
                          >
                            {ind.threatLevel || 'UNKNOWN'} threat
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* 4. Demand Signals & Sizing Risks (2-Column Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demand Signals */}
              <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Radio className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">
                    Market Demand Signals
                  </h3>
                </div>
                {output.demandSignals && output.demandSignals.length > 0 ? (
                  <div className="space-y-3">
                    {output.demandSignals.map((sig, idx) => (
                      <div key={idx} className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-semibold text-foreground">{sig.signal}</h5>
                          {sig.relevanceScore !== undefined && (
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              Score: {sig.relevanceScore}/100
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{sig.evidence}</p>
                        {sig.sourceAttribution && (
                          <div className="text-[10px] text-muted-foreground/70 truncate pt-0.5">
                            Source: {sig.sourceAttribution}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No discrete demand signals recorded.</p>
                )}
              </Card>

              {/* Sizing Risks & Mitigations */}
              <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">
                    Sizing Risks &amp; Sensitivity Mitigations
                  </h3>
                </div>
                {output.sizingRisks && output.sizingRisks.length > 0 ? (
                  <div className="space-y-3">
                    {output.sizingRisks.map((risk, idx) => (
                      <div key={idx} className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-semibold text-foreground">{risk.risk}</h5>
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-semibold shrink-0 ${
                              risk.impactOnSom === 'high'
                                ? 'border-destructive/40 text-destructive'
                                : risk.impactOnSom === 'medium'
                                ? 'border-amber-500/40 text-amber-600 dark:text-amber-400'
                                : risk.impactOnSom === 'low'
                                ? 'border-border text-muted-foreground'
                                : 'border-destructive/60 bg-destructive/10 text-destructive'
                            }`}
                          >
                            {risk.impactOnSom || 'UNKNOWN'} SOM Impact
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          <strong className="text-foreground/80 font-medium">Mitigation:</strong> {risk.mitigation}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No specific sizing risks flagged.</p>
                )}
              </Card>
            </div>

            {/* Bottom Sticky/Standard Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 mt-8">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/creator/phase-2/complete')}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Phase 2
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={isGenerating || insufficientCredits}
                  className="text-xs font-medium gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Regenerate ({marketStudyCost} credits)
                </Button>
                <Button onClick={handleNext} className="gap-2 text-xs font-semibold px-5">
                  Continue to Business Model <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Phase3SetupShell>
  );
}
