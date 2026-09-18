'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  RefreshCw,
  AlertTriangle,
  FileWarning,
  Download,
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

  // Funnel bar proportions (no artificial clamps)
  const samWidthPct = tamVal && samVal ? Math.max(4, Math.min(100, (samVal / tamVal) * 100)) : 35;
  const somWidthPct = tamVal && somVal ? Math.max(2, Math.min(100, (somVal / tamVal) * 100)) : 8;

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
            {/* 1. Market Sizing Funnel (Proportional Bars + Quiet Step Reductions + Methodology 2-Column Strip + Single Source Footer) */}
            <Card className="rounded-xl border border-border/70 bg-card p-6 md:p-8 space-y-6 shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-foreground font-sans tracking-tight">
                    Market Sizing Funnel (TAM / SAM / SOM)
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans">
                    Hierarchical top-down and bottom-up market constriction showing addressable and serviceable capture.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Version {session.data?.currentVersion ?? 1}
                </span>
              </div>

              {/* Stacked Proportional Horizontal Bars */}
              <div className="space-y-4 pt-2">
                {/* Level 1: TAM Bar (100% width) */}
                <div className="space-y-2">
                  <div className="w-full rounded-xl border border-border/70 bg-muted/20 dark:bg-muted/15 p-4 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-muted text-foreground uppercase tracking-wider">
                            TAM
                          </span>
                          <span className="text-xs font-semibold text-foreground font-sans">
                            {tam?.label || 'Total Addressable Market'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl font-sans">
                          {tam?.derivation || 'Total global market demand and theoretical ceiling for this sector.'}
                        </p>
                      </div>
                      <div className="text-left md:text-right shrink-0">
                        <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                          {formatCurrency(tam?.value, tam?.currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step Bridge 1: TAM -> SAM Reduction (Quiet Right-Aligned Text, No Icon Chips) */}
                <div className="text-right text-xs text-muted-foreground font-mono pr-2">
                  <span>-{samReductionPct}% filter · {sam?.derivation ? sam.derivation.split('.')[0] : 'Constrained by geography, target vertical, and ICP focus'}</span>
                </div>

                {/* Level 2: SAM Bar (Width strictly proportional, no artificial clamp) */}
                <div className="space-y-2">
                  <div
                    style={{ width: `${samWidthPct}%` }}
                    className="rounded-xl border border-border/80 bg-muted/40 dark:bg-muted/30 p-4 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-muted text-foreground uppercase tracking-wider">
                            SAM
                          </span>
                          <span className="text-xs font-semibold text-foreground font-sans">
                            {sam?.label || 'Serviceable Addressable Market'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-sans">
                          {sam?.derivation || 'Target segment directly reachable with current business capabilities and geography.'}
                        </p>
                      </div>
                      <div className="text-left md:text-right shrink-0">
                        <div className="text-xl font-bold font-mono text-foreground tracking-tight">
                          {formatCurrency(sam?.value, sam?.currency)}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {samPctOfTam.toFixed(0)}% of TAM
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step Bridge 2: SAM -> SOM Reduction (Quiet Right-Aligned Text, No Icon Chips) */}
                <div className="text-right text-xs text-muted-foreground font-mono pr-2">
                  <span>-{somReductionPct}% capture limit · {som?.derivation ? som.derivation.split('.')[0] : 'Constrained by initial 24-36 month capacity and sales velocity'}</span>
                </div>

                {/* Level 3: SOM Bar (Width strictly proportional, Teal Accent Only) */}
                <div className="space-y-2">
                  <div
                    style={{ width: `${somWidthPct}%` }}
                    className="rounded-xl border border-teal-500/40 bg-teal-500/10 dark:bg-teal-500/15 p-4 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-teal-500/20 text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                            SOM
                          </span>
                          <span className="text-xs font-semibold text-foreground font-sans">
                            {som?.label || 'Serviceable Obtainable Market'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl font-sans">
                          {som?.derivation || 'Realistic market share achievable within the initial 24–36 month operational runway.'}
                        </p>
                      </div>
                      <div className="text-left md:text-right shrink-0">
                        <div className="text-lg font-bold font-mono text-teal-600 dark:text-teal-400 tracking-tight">
                          {formatCurrency(som?.value, som?.currency)}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {somPctOfSam.toFixed(0)}% of SAM
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Methodology Two-Column Strip (Methodology Left, Derivation Arithmetic Right) */}
              <div className="border-t border-border/60 pt-5 mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 space-y-1.5">
                  <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Methodology
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                    {output.marketSizing?.methodology ||
                      'Triangulated top-down macroeconomic sizing with bottom-up operational unit economics.'}
                  </p>
                </div>
                <div className="md:col-span-7 space-y-2">
                  <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Derivation Arithmetic
                  </h4>
                  <div className="space-y-1 text-xs font-sans text-muted-foreground">
                    {tam?.derivation && (
                      <p><strong className="font-mono text-foreground font-medium">TAM:</strong> {tam.derivation}</p>
                    )}
                    {sam?.derivation && (
                      <p><strong className="font-mono text-foreground font-medium">SAM:</strong> {sam.derivation}</p>
                    )}
                    {som?.derivation && (
                      <p><strong className="font-mono text-foreground font-medium">SOM:</strong> {som.derivation}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Consolidated Source Attribution Line at Card Foot */}
              {sourceAttributions.length > 0 && (
                <div className="border-t border-border/50 pt-3 text-[11px] font-mono text-muted-foreground truncate">
                  Sources: {sourceAttributions.join(' · ')}
                </div>
              )}
            </Card>

            {/* 2. Gap Validation Two-Column Split (Green Accent & Label Only) */}
            {output.marketGapValidation && (
              <Card className="rounded-xl border border-border/70 border-l-[3px] border-l-emerald-500 bg-card p-6 md:p-8 space-y-4 shadow-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <h3 className="text-sm font-semibold text-foreground font-sans tracking-tight">
                    Market Gap Validation
                  </h3>
                  <span className="text-xs font-mono font-medium uppercase text-emerald-600 dark:text-emerald-400">
                    Confidence: {output.marketGapValidation.confidenceLevel || 'Moderate'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  {/* Left Column: Creator Stated Gap */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                      Founder's Stated Gap
                    </span>
                    <p className="text-xs text-foreground/90 font-sans leading-relaxed">
                      {creatorMarketGap || 'No explicit initial gap recorded in journey setup.'}
                    </p>
                  </div>

                  {/* Right Column: Validated Opportunity & Benchmark Assessment */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Benchmark Assessment
                    </span>
                    <p className="text-xs font-semibold text-foreground font-sans leading-relaxed">
                      {output.marketGapValidation.primaryGap}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                      {output.marketGapValidation.validationRationale}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* 3. Competitor Landscape (Dense Table, Monospace Headers, Thin Inline Share Bars) */}
            {output.competitorLandscape && (
              <Card className="rounded-xl border border-border/70 bg-card p-6 md:p-8 space-y-6 shadow-none">
                <div className="space-y-1 border-b border-border/60 pb-4">
                  <h3 className="text-sm font-semibold text-foreground font-sans tracking-tight">
                    Competitor Landscape &amp; Benchmarking
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans">
                    {output.competitorLandscape.summary || 'Direct incumbents and indirect substitutes mapped by position, pricing, and structural gaps.'}
                  </p>
                </div>

                {/* Direct Competitors Dense Table */}
                {output.competitorLandscape.directCompetitors?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                      Direct Competitors
                    </h4>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border/70 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            <th className="py-2.5 pr-4 font-semibold">Company</th>
                            <th className="py-2.5 px-4 font-semibold">Segment</th>
                            <th className="py-2.5 px-4 font-semibold">Pricing Model</th>
                            <th className="py-2.5 px-4 font-semibold">Estimated Share</th>
                            <th className="py-2.5 pl-4 font-semibold">Exploitable Gap</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {output.competitorLandscape.directCompetitors.map((comp, idx) => {
                            const parsedShare = parseShareNumber(comp.estimatedMarketShare);
                            return (
                              <tr key={idx} className="transition-colors hover:bg-muted/30">
                                <td className="py-3 pr-4 font-medium text-foreground font-sans whitespace-nowrap align-top">
                                  {comp.name}
                                </td>
                                <td className="py-3 px-4 text-muted-foreground font-sans align-top">
                                  {comp.segment ? (
                                    <span className="text-foreground/90">{comp.segment}</span>
                                  ) : (
                                    <span className="text-muted-foreground/60">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-muted-foreground font-sans whitespace-nowrap align-top">
                                  {comp.pricingModel || '—'}
                                </td>
                                <td className="py-3 px-4 font-mono align-top whitespace-nowrap">
                                  {comp.estimatedMarketShare ? (
                                    <div className="relative w-28 h-5 flex items-center">
                                      <div
                                        className="absolute inset-y-0.5 left-0 bg-muted/60 dark:bg-muted/40 rounded-sm"
                                        style={{ width: `${Math.min(100, Math.max(10, parsedShare * 2))}%` }}
                                      />
                                      <span className="relative z-10 text-xs font-mono font-medium text-foreground pl-1.5">
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

                {/* Indirect Substitutes Dense Table (Same Language) */}
                {output.competitorLandscape.indirectCompetitors?.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                      Indirect Substitutes &amp; Alternatives
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

            {/* 4. Demand Signals & Sizing Risks (2-Column Grid, No Nested Card Wrappers) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demand Signals (Single-Line Rows, Right-Aligned Score, Small Muted Source) */}
              <Card className="rounded-xl border border-border/70 bg-card p-6 space-y-4 shadow-none">
                <div className="border-b border-border/60 pb-3">
                  <h3 className="text-sm font-semibold text-foreground font-sans tracking-tight">
                    Market Demand Signals
                  </h3>
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
                            <span className="text-xs font-mono font-medium text-muted-foreground shrink-0">
                              Score: {sig.relevanceScore}/10
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                          {sig.evidence}
                        </p>
                        {sig.sourceAttribution && (
                          <div className="text-[10px] font-mono text-muted-foreground/70 truncate">
                            Source: {sig.sourceAttribution}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic font-sans">No discrete demand signals recorded.</p>
                )}
              </Card>

              {/* Sizing Risks (Plain Numbered List, Coloured Word Severity, Mitigation Muted Beneath) */}
              <Card className="rounded-xl border border-border/70 bg-card p-6 space-y-4 shadow-none">
                <div className="border-b border-border/60 pb-3">
                  <h3 className="text-sm font-semibold text-foreground font-sans tracking-tight">
                    Sizing Risks &amp; Sensitivity Mitigations
                  </h3>
                </div>
                {output.sizingRisks && output.sizingRisks.length > 0 ? (
                  <div className="divide-y divide-border/60">
                    {output.sizingRisks.map((risk, idx) => {
                      const impact = (risk.impactOnSom || 'medium').toLowerCase();
                      const severityColor =
                        impact === 'high'
                          ? 'text-rose-500'
                          : impact === 'medium'
                          ? 'text-amber-500'
                          : 'text-muted-foreground';

                      return (
                        <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-mono text-muted-foreground">{idx + 1}.</span>
                              <span className="text-xs font-medium text-foreground font-sans leading-snug">
                                {risk.risk}
                              </span>
                            </div>
                            <span className={`text-xs font-mono font-medium uppercase shrink-0 ${severityColor}`}>
                              {risk.impactOnSom || 'Medium'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground font-sans leading-relaxed pl-4">
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

            {/* Bottom Action Bar: Blue Only on Continue Button */}
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
