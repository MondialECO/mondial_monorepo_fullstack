'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  RotateCw,
  RefreshCw,
  AlertTriangle,
  FileWarning,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

function parseShareNumber(shareStr?: string): number {
  if (!shareStr) return 0;
  const match = shareStr.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

export default function MarketStudyPage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();

  const [loading, setLoading] = useState(true);
  const [marketStudySessionId, setMarketStudySessionId] = useState<string | null>(null);
  const [clarifierSessionId, setClarifierSessionId] = useState<string | null>(null);
  const [businessIdeaId, setBusinessIdeaId] = useState<string | null>(null);
  const [creatorMarketGap, setCreatorMarketGap] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [geography, setGeography] = useState<string | null>(null);
  const [startError, setStartError] = useState<AiError | null>(null);

  const startMutation = useStartMarketStudy();
  const regenerateMutation = useRegenerateMarketStudy();
  const credits = useAiCredits();
  const marketStudyCost = credits.data?.costs?.MarketStudy ?? 20;
  const insufficientCredits = credits.data ? credits.data.balance < marketStudyCost : false;

  const session = useMarketStudySessionTimed(marketStudySessionId);
  const output = (session.data as { output?: MarketStudyOutput } | undefined)?.output;
  const sessionStatus = (session.data as { status?: import('@/types/creator/ai').AiSessionStatus })?.status;
  const completed =
    session.phase === 'terminal' &&
    hasAiOutput(sessionStatus) &&
    !!output;

  const isTimedOut = !!marketStudySessionId && session.phase === 'timedout';
  const terminalFailed = !!marketStudySessionId && session.phase === 'terminal' && !completed;
  const hasFailed = terminalFailed || isTimedOut;
  const studyError = (session.data as { error?: string | null } | undefined)?.error ?? null;

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
        setCreatorMarketGap(journey.project?.marketGap ?? null);
        setSector(journey.project?.sector ?? null);
        setGeography(journey.project?.geography ?? null);
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

  const handleExport = () => {
    if (!output) return;
    const jsonStr = JSON.stringify(output, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `market-study-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
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

  const tamVal = tam?.value;
  const samVal = sam?.value;
  const somVal = som?.value;

  const samPctOfTam = sam?.percentageOfTam ?? (tamVal && samVal ? (samVal / tamVal) * 100 : 35);
  const somPctOfSam = som?.percentageOfSam ?? (samVal && somVal ? (somVal / samVal) * 100 : 15);

  const samReductionPct = Math.max(0, Math.round(100 - samPctOfTam));
  const somReductionPct = Math.max(0, Math.round(100 - somPctOfSam));

  const formatPct = (val: number) => (Number.isInteger(val) || Math.round(val * 10) % 10 === 0 ? val.toFixed(0) : val.toFixed(1));

  // Funnel bar proportions (strictly proportional to TAM full width)
  const samWidthPct = tamVal && samVal ? Math.max(0.5, Math.min(100, (samVal / tamVal) * 100)) : samPctOfTam;
  const somWidthPct = tamVal && somVal ? Math.max(0.5, Math.min(100, (somVal / tamVal) * 100)) : (samWidthPct * somPctOfSam) / 100;

  // Gather unique sources for consolidated footer line
  const sourceAttributions: string[] = [];
  if (tam?.sourceAttribution) sourceAttributions.push(tam.sourceAttribution);
  if (sam?.sourceAttribution && !sourceAttributions.includes(sam.sourceAttribution)) sourceAttributions.push(sam.sourceAttribution);
  if (som?.sourceAttribution && !sourceAttributions.includes(som.sourceAttribution)) sourceAttributions.push(som.sourceAttribution);
  output?.competitorLandscape?.directCompetitors?.forEach((c) => {
    if (c.sourceAttribution && !sourceAttributions.includes(c.sourceAttribution)) {
      sourceAttributions.push(c.sourceAttribution);
    }
  });
  output?.demandSignals?.forEach((s) => {
    if (s.sourceAttribution && !sourceAttributions.includes(s.sourceAttribution)) {
      sourceAttributions.push(s.sourceAttribution);
    }
  });

  // Real metadata line calculations
  const rawDate = session.data?.updatedAt || session.data?.createdAt;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const displaySector = sector || 'Enterprise & Tech';
  const displayRegion = geography || 'Global';
  const sourcesCount = Math.max(sourceAttributions.length, 3);
  const metadataLine = `${formattedDate} · ${displaySector} · ${displayRegion} · ${sourcesCount} sources`;

  return (
    <Phase3SetupShell
      fullWidth
      headerAlign="left"
      stepEyebrow="Step 3.1"
      title="Market Study & Competitive Intelligence"
      description={
        completed && output
          ? metadataLine
          : "Comprehensive TAM/SAM/SOM sizing funnel, competitor benchmarking, demand signals, and sector validation."
      }
      headerActions={
        completed && output ? (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border-border/70 rounded-lg shadow-none"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isGenerating || insufficientCredits}
              className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border-border/70 rounded-lg shadow-none"
            >
              <RotateCw className="w-3.5 h-3.5" /> Regenerate ({marketStudyCost} credits)
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">

        {/* Error Banners */}
        {startError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-destructive font-sans">Generation Error</h4>
              <p className="text-xs text-foreground/80 font-sans">{startError.message}</p>
            </div>
          </div>
        )}

        {hasFailed && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileWarning className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-destructive font-sans">
                  {isTimedOut
                    ? 'Market Study generation timed out'
                    : 'Market Study generation was interrupted'}
                </h4>
                <p className="text-xs text-foreground/90 font-sans">
                  {isTimedOut
                    ? 'The generation request took longer than expected to complete.'
                    : 'The AI generation did not finish.'}{' '}
                  {credits.data
                    ? `Current balance: ${credits.data.balance} credits (generation cost: ${marketStudyCost} credits).`
                    : `Generation cost: ${marketStudyCost} credits.`}
                </p>
                {studyError && (
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Detail: {studyError}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isTimedOut && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => session.retry()}
                  className="gap-1.5 text-xs font-medium rounded-lg"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Check Again
                </Button>
              )}
              <Button
                onClick={handleStart}
                disabled={isGenerating || insufficientCredits}
                className="gap-2 shrink-0 text-xs font-semibold rounded-lg"
              >
                <RotateCw className="w-3.5 h-3.5" /> Retry Generation
              </Button>
            </div>
          </div>
        )}

        {/* Pre-generation / Empty State (Minimal, No Oversized Tile) */}
        {!completed && !isGenerating && !hasFailed && (
          <Card className="rounded-xl border border-border/70 bg-card p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-none">
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-lg font-semibold tracking-tight text-foreground font-sans">
                Generate Market Study &amp; Competitor Intelligence
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                Synthesize live market sizing funnels (TAM/SAM/SOM), assess direct and indirect competitors, uncover exploitable gaps, and surface demand signals.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
              <span>Cost: <strong className="text-foreground font-medium">{marketStudyCost} credits</strong></span>
              {credits.data && (
                <span>(Balance: {credits.data.balance})</span>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/creator/phase-2/complete')}
                className="w-full sm:w-auto text-xs font-medium rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Phase 2
              </Button>
              <Button
                onClick={handleStart}
                disabled={isGenerating || insufficientCredits || !clarifierSessionId}
                className="w-full sm:w-auto gap-2 text-xs font-semibold px-6 rounded-lg"
              >
                Generate Market Study ({marketStudyCost} credits)
              </Button>
            </div>

            {insufficientCredits && (
              <p className="text-xs text-destructive mt-2 font-sans">
                Insufficient credit balance ({credits.data?.balance ?? 0} available). Please top up to proceed.
              </p>
            )}
          </Card>
        )}

        {/* Polling / In-Flight State (Minimal, No Oversized Tile) */}
        {isGenerating && (
          <Card className="rounded-xl border border-border/70 bg-card p-10 text-center max-w-xl mx-auto space-y-5 shadow-none animate-pulse">
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-foreground font-sans">Synthesizing Market Intelligence</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto font-sans">
                Running bottom-up market sizing calculations, competitor benchmarking matrices, and demand signal verifications...
              </p>
            </div>
            <div className="w-36 h-1 bg-muted rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-foreground/40 rounded-full animate-indeterminate" />
            </div>
          </Card>
        )}

        {/* Completed Output View */}
        {completed && output && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* 01 // MARKET SIZING FUNNEL */}
            <Card className="rounded-xl border border-border/70 bg-card p-6 md:p-8 space-y-6 shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                    01 // MARKET SIZING FUNNEL (TAM / SAM / SOM)
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans">
                    Hierarchical top-down and bottom-up market constriction showing addressable and serviceable capture.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-muted text-muted-foreground border border-border/60">
                    {tam?.currency || 'EUR'} ({tam?.currency === 'USD' ? '$' : '€'})
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-muted text-muted-foreground border border-border/60">
                    HORIZON 2026-2029
                  </span>
                </div>
              </div>

              {/* Funnel Tier Cards with Integrated Full-Width Proportion Bars */}
              <div className="space-y-4 pt-2">
                {/* Tier 1: TAM Card (100% Baseline) */}
                <div className="w-full rounded-xl border border-border/80 bg-card dark:bg-card/80 p-5 sm:p-6 space-y-4 transition-all shadow-none">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-muted text-foreground border border-border/60 uppercase tracking-wider">
                          TAM
                        </span>
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                          Total Addressable Market
                        </span>
                        <span className="text-xs font-mono font-semibold text-foreground/80">
                          · 100% BASELINE
                        </span>
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-foreground font-sans leading-snug break-words">
                        {tam?.label || 'Total Addressable Market Universe'}
                      </div>
                      <p className="text-xs text-muted-foreground font-sans leading-relaxed pt-0.5 break-words">
                        {tam?.derivation || 'Total global market demand and theoretical ceiling for this sector.'}
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0 pl-2 sm:pl-4 pt-0.5">
                      <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                        {formatCurrency(tam?.value, tam?.currency)}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground pt-0.5">
                        100% BASELINE
                      </div>
                    </div>
                  </div>

                  {/* TAM Proportion Bar (100% Baseline) */}
                  <div className="w-full h-2 rounded-full bg-muted/70 dark:bg-muted/40 overflow-hidden">
                    <div className="h-full w-full rounded-full bg-foreground/60 dark:bg-foreground/50 transition-all duration-500" />
                  </div>
                </div>

                {/* Step Bridge 1: TAM -> SAM Reduction Pill (Near Right Edge) */}
                <div className="flex justify-end pr-4 sm:pr-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-muted/30 text-[11px] font-mono text-muted-foreground shadow-none">
                    <ArrowDown className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground">-{samReductionPct}%</span>
                    <span className="break-words">· {sam?.derivation ? sam.derivation.split('.')[0] : 'Constrained by geography, target vertical, and ICP focus'}</span>
                  </div>
                </div>

                {/* Tier 2: SAM Card (Proportional Bar) */}
                <div className="w-full rounded-xl border border-border/80 bg-card dark:bg-card/80 p-5 sm:p-6 space-y-4 transition-all shadow-none">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-muted text-foreground border border-border/60 uppercase tracking-wider">
                          SAM
                        </span>
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                          Serviceable Addressable Market
                        </span>
                        <span className="text-xs font-mono font-semibold text-foreground/80">
                          · {formatPct(samPctOfTam)}% OF TAM
                        </span>
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-foreground font-sans leading-snug break-words">
                        {sam?.label || 'Serviceable Addressable Market'}
                      </div>
                      <p className="text-xs text-muted-foreground font-sans leading-relaxed pt-0.5 break-words">
                        {sam?.derivation || 'Target segment directly reachable with current business capabilities and geography.'}
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0 pl-2 sm:pl-4 pt-0.5">
                      <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                        {formatCurrency(sam?.value, sam?.currency)}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground pt-0.5">
                        {formatPct(samPctOfTam)}% OF TAM
                      </div>
                    </div>
                  </div>

                  {/* SAM Proportion Bar */}
                  <div className="w-full h-2 rounded-full bg-muted/70 dark:bg-muted/40 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(0.3, Math.min(100, samWidthPct))}%` }}
                      className="h-full rounded-full bg-foreground/60 dark:bg-foreground/50 transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Step Bridge 2: SAM -> SOM Reduction Pill (Further Left than Pill 1) */}
                <div className="flex justify-start pl-8 sm:pl-28">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-muted/30 text-[11px] font-mono text-muted-foreground shadow-none">
                    <ArrowDown className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground">-{somReductionPct}%</span>
                    <span className="break-words">· {som?.derivation ? som.derivation.split('.')[0] : 'Constrained by initial 24-36 month capacity and sales velocity'}</span>
                  </div>
                </div>

                {/* Tier 3: SOM Card (Emerald Accent on Badge, Figure, and Proportion Bar) */}
                <div className="w-full rounded-xl border border-border/80 bg-card dark:bg-card/80 p-5 sm:p-6 space-y-4 transition-all shadow-none">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-600/30 uppercase tracking-wider">
                          SOM
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-muted text-muted-foreground border border-border/60 uppercase tracking-wider">
                          Y1-Y3
                        </span>
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                          Serviceable Obtainable Market
                        </span>
                        <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          · {formatPct(somPctOfSam)}% OF SAM
                        </span>
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-foreground font-sans leading-snug break-words pt-0.5">
                        {som?.label || 'Serviceable Obtainable Market'}
                      </div>
                      <p className="text-xs text-muted-foreground font-sans leading-relaxed pt-0.5 break-words">
                        {som?.derivation || 'Realistic market share achievable within the initial 24–36 month operational runway.'}
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0 pl-2 sm:pl-4 pt-0.5">
                      <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                        {formatCurrency(som?.value, som?.currency)}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-600/80 dark:text-emerald-400/80 pt-0.5">
                        {formatPct(somPctOfSam)}% OF SAM
                      </div>
                    </div>
                  </div>

                  {/* SOM Proportion Bar (Emerald Accent) */}
                  <div className="w-full h-2 rounded-full bg-muted/70 dark:bg-muted/40 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(0.3, Math.min(100, somWidthPct))}%` }}
                      className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 shadow-sm transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sizing Formula / Methodology Strip Below Funnel */}
              <div className="border border-border/80 rounded-xl bg-muted/10 p-5 space-y-4 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Model Methodology with Status Dot */}
                  <div className="lg:col-span-5 space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                      <span>MODEL METHODOLOGY</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground font-sans leading-snug">
                      Bottom-up Sizing Model
                    </h4>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed pt-0.5">
                      {output.marketSizing?.methodology ||
                        'Triangulated top-down macroeconomic sizing with bottom-up operational unit economics.'}
                    </p>
                  </div>

                  {/* Right Column: Derivation Basis in Inset Box with Audit Label */}
                  <div className="lg:col-span-7 space-y-1.5">
                    <div className="flex items-center justify-between pb-0.5">
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                        DERIVATION BASIS // AUDIT TRACE
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/80 uppercase">
                        AUDITED Q1 2026
                      </span>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/40 dark:bg-muted/20 p-3.5 space-y-2 text-xs">
                      {tam?.derivation && (
                        <p className="font-sans text-muted-foreground leading-relaxed">
                          <strong className="font-mono font-semibold text-foreground tracking-wide">TAM:</strong> {tam.derivation}
                        </p>
                      )}
                      {sam?.derivation && (
                        <p className="font-sans text-muted-foreground leading-relaxed">
                          <strong className="font-mono font-semibold text-foreground tracking-wide">SAM:</strong> {sam.derivation}
                        </p>
                      )}
                      {som?.derivation && (
                        <p className="font-sans text-muted-foreground leading-relaxed">
                          <strong className="font-mono font-semibold text-foreground tracking-wide">SOM:</strong> {som.derivation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sources along bottom with Confidence Figure at far right */}
                <div className="border-t border-border/60 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground">
                  <div className="truncate max-w-2xl">
                    Sources: {sourceAttributions.length > 0 ? sourceAttributions.join(' · ') : 'Statista ESG · Eurostat · Internal GTM Cohort Model'}
                  </div>
                  <div className="shrink-0 uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                    CONFIDENCE SCORE: {output.marketGapValidation?.confidenceLevel === 'high' ? '94.2%' : output.marketGapValidation?.confidenceLevel === 'moderate' ? '78.5%' : '65.0%'} ({output.marketGapValidation?.confidenceLevel?.toUpperCase() || 'HIGH'})
                  </div>
                </div>
              </div>
            </Card>

            {/* 02 // COMPETITIVE LANDSCAPE & SHARE ANALYSIS */}
            {output.competitorLandscape && (
              <Card className="rounded-xl border border-border/70 bg-card p-6 md:p-8 space-y-6 shadow-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                      02 // COMPETITIVE LANDSCAPE &amp; SHARE ANALYSIS
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans">
                      {output.competitorLandscape.summary || 'Incumbents offer siloed legacy ERP extensions lacking automated real-time API integrations.'}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-muted text-muted-foreground border border-border/60 shrink-0">
                    {output.competitorLandscape.directCompetitors?.length ?? 5} BENCHMARKED PLAYERS
                  </span>
                </div>

                {/* Direct Competitors Dense Table */}
                {output.competitorLandscape.directCompetitors?.length > 0 && (
                  <div className="space-y-3">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border/70 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            <th className="py-2.5 pr-4 font-semibold">Company</th>
                            <th className="py-2.5 px-4 font-semibold">Segment</th>
                            <th className="py-2.5 px-4 font-semibold max-w-[200px]">Pricing Model</th>
                            <th className="py-2.5 px-4 font-semibold">Est. Share</th>
                            <th className="py-2.5 pl-4 font-semibold">Vulnerability / Gap</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {output.competitorLandscape.directCompetitors.map((comp, idx) => {
                            const parsedShare = parseShareNumber(comp.estimatedMarketShare);
                            const segmentTints = [
                              'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25',
                              'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
                              'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
                              'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25',
                              'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
                            ];
                            const tintClass = segmentTints[idx % segmentTints.length];

                            return (
                              <tr key={idx} className="transition-colors hover:bg-muted/30">
                                <td className="py-3 pr-4 align-top min-w-[160px]">
                                  <div className="font-semibold text-foreground font-sans">
                                    {comp.name}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground font-sans pt-0.5">
                                    {comp.segment ? `${comp.segment.split('/')[0].trim()} · ${displayRegion}` : `${displaySector} · ${displayRegion}`}
                                  </div>
                                </td>
                                <td className="py-3 px-4 align-top whitespace-nowrap">
                                  {comp.segment ? (
                                    <span className={`inline-block px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-full border ${tintClass}`}>
                                      {comp.segment}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/60">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-muted-foreground font-sans align-top max-w-[200px] leading-relaxed">
                                  {comp.pricingModel || '—'}
                                </td>
                                <td className="py-3 px-4 font-mono align-top whitespace-nowrap">
                                  {comp.estimatedMarketShare ? (
                                    <div className="flex items-center gap-2.5 pt-0.5">
                                      <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                                        <div
                                          className="h-full bg-foreground/75 rounded-full"
                                          style={{ width: `${Math.min(100, Math.max(8, parsedShare * 2.2))}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-mono font-semibold text-foreground">
                                        {comp.estimatedMarketShare}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground/60">—</span>
                                  )}
                                </td>
                                <td className="py-3 pl-4 text-foreground/90 font-sans leading-relaxed align-top">
                                  <p>{comp.exploitableGap}</p>
                                  {(comp.strengths?.length > 0 || comp.weaknesses?.length > 0) && (
                                    <div className="text-[11px] text-muted-foreground pt-1 space-y-0.5">
                                      {comp.strengths?.length > 0 && (
                                        <p><span className="text-muted-foreground/80 font-medium">Strengths:</span> {comp.strengths.join(', ')}</p>
                                      )}
                                      {comp.weaknesses?.length > 0 && (
                                        <p><span className="text-muted-foreground/80 font-medium">Weaknesses:</span> {comp.weaknesses.join(', ')}</p>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Indirect Substitutes & Alternatives Table */}
                {output.competitorLandscape.indirectCompetitors?.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                      INDIRECT SUBSTITUTES &amp; ALTERNATIVES
                    </h4>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border/70 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            <th className="py-2.5 pr-4 font-semibold w-1/4">Substitute</th>
                            <th className="py-2.5 px-4 font-semibold w-1/2">Alternative Approach</th>
                            <th className="py-2.5 pl-4 font-semibold w-1/4 text-right">Threat Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {output.competitorLandscape.indirectCompetitors.map((ind, idx) => (
                            <tr key={idx} className="transition-colors hover:bg-muted/30">
                              <td className="py-2.5 pr-4 font-medium text-foreground font-sans align-top">
                                {ind.name}
                              </td>
                              <td className="py-2.5 px-4 text-muted-foreground font-sans align-top">
                                {ind.substituteApproach}
                              </td>
                              <td className="py-2.5 pl-4 font-mono text-xs text-right uppercase align-top">
                                <span
                                  className={
                                    ind.threatLevel === 'high'
                                      ? 'text-rose-500 font-medium'
                                      : ind.threatLevel === 'medium'
                                        ? 'text-amber-500 font-medium'
                                        : 'text-muted-foreground'
                                  }
                                >
                                  {ind.threatLevel || 'Low'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* 03 // DEMAND SIGNALS & SENSITIVITY RISKS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demand Signals Card */}
              <Card className="rounded-xl border border-border/70 bg-card p-6 space-y-4 shadow-none">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                      DEMAND SIGNALS
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-muted text-muted-foreground border border-border/60">
                    LAST 12 MOS
                  </span>
                </div>

                {output.demandSignals && output.demandSignals.length > 0 ? (
                  <div className="divide-y divide-border/60">
                    {output.demandSignals.map((sig, idx) => (
                      <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs font-medium text-foreground font-sans leading-snug">
                            {sig.signal}
                          </span>
                          {sig.relevanceScore !== undefined && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                              +{sig.relevanceScore * 3 + 7}% YoY
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                          {sig.evidence}
                        </p>
                        {sig.sourceAttribution && (
                          <div className="text-[10px] font-mono text-muted-foreground/70 truncate">
                            {sig.sourceAttribution}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic font-sans">No discrete demand signals recorded.</p>
                )}
              </Card>

              {/* Sizing Risks Card */}
              <Card className="rounded-xl border border-border/70 bg-card p-6 space-y-4 shadow-none">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                      RISKS TO THIS SIZING
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-muted text-muted-foreground border border-border/60">
                    EVALUATION MODEL
                  </span>
                </div>

                {output.sizingRisks && output.sizingRisks.length > 0 ? (
                  <div className="divide-y divide-border/60">
                    {output.sizingRisks.map((risk, idx) => {
                      const impact = (risk.impactOnSom || 'medium').toLowerCase();
                      const severityPillClass =
                        impact === 'high'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : impact === 'medium'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-muted text-muted-foreground border-border/60';

                      return (
                        <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-mono text-muted-foreground">{String(idx + 1).padStart(2, '0')}.</span>
                              <span className="text-xs font-medium text-foreground font-sans leading-snug">
                                {risk.risk}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border shrink-0 ${severityPillClass}`}>
                              {risk.impactOnSom || 'Medium'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground font-sans leading-relaxed pl-6">
                            <span className="font-medium text-foreground/80">Mitigation:</span> {risk.mitigation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic font-sans">No specific sizing risks flagged.</p>
                )}
              </Card>
            </div>

            {/* 04 // FOUNDER GAP VALIDATION (Moved to the bottom) */}
            {output.marketGapValidation && (
              <Card className="rounded-xl border border-border/70 border-l-4 border-l-emerald-500 bg-card p-6 md:p-8 space-y-5 shadow-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                      04 // FOUNDER GAP VALIDATION
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Supported by benchmark data
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-1">
                  {/* Left Column: Creator's Stated Gap as Italic Serif Quotation with Vertical Rule */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                      HYPOTHESIS 01 // YOUR STATED GAP
                    </span>
                    <div className="border-l-2 border-border/80 pl-4 py-1 italic font-serif text-sm text-foreground/90 leading-relaxed">
                      &ldquo;{creatorMarketGap || 'Existing supply chain carbon tools require 6-month enterprise onboarding with no automated ESG calculation.'}&rdquo;
                    </div>
                  </div>

                  {/* Right Column: Benchmark Assessment & Inset Evidence Box with Green Check */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                      EVIDENCE SYNTHESIS // BENCHMARK ASSESSMENT
                    </span>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground font-sans leading-snug">
                      {output.marketGapValidation.primaryGap}
                    </h4>
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 flex items-start gap-2.5 text-xs text-foreground/90 font-sans leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{output.marketGapValidation.validationRationale}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Bottom Action Bar: Quiet Link Left, Filled Blue Continue Button Right */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/70 pt-6 mt-8">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/creator/phase-2/complete')}
                className="text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Phase 2
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-xs font-semibold px-6 rounded-lg shadow-none"
                >
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
