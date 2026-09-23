'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  RefreshCw,
  AlertTriangle,
  FileWarning,
  Download,
  Check,
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
import MarketStudyPrintView from '@/components/creator/MarketStudyPrintView';
import { brandKitApi } from '@/lib/api-creator-brand-kit';
import { resolveMediaUrl } from '@/lib/brand-kit-media';
import { withIdeaContext } from '@/lib/creator-routes';

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
  const searchParams = useSearchParams();
  const queryIdeaId = searchParams.get('ideaId');
  const { state, completeStep } = useCreatorProgress();
  const activeIdeaId = state?.activeIdeaId;
  const effectiveIdeaId = queryIdeaId || activeIdeaId || getCreatorWorkspaceIdea() || null;

  const [loading, setLoading] = useState(true);
  const [marketStudySessionId, setMarketStudySessionId] = useState<string | null>(null);
  const [clarifierSessionId, setClarifierSessionId] = useState<string | null>(null);
  const [businessIdeaId, setBusinessIdeaId] = useState<string | null>(null);
  const [creatorMarketGap, setCreatorMarketGap] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [geography, setGeography] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<string | null>(null);
  const [startError, setStartError] = useState<AiError | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const startMutation = useStartMarketStudy();
  const regenerateMutation = useRegenerateMarketStudy();
  const credits = useAiCredits();
  const isCostLoading = credits.isLoading;
  const isCostError = credits.isError || (!isCostLoading && credits.data?.costs?.MarketStudy == null);
  const marketStudyCost = credits.data?.costs?.MarketStudy ?? null;
  const insufficientCredits = credits.data != null && marketStudyCost != null ? credits.data.balance < marketStudyCost : false;

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
        const { journey } = await creatorJourneyApi.get(effectiveIdeaId);
        if (!active) return;
        const p3 = journey.phase3Data as {
          marketStudySessionId?: string;
          clarifierSessionId?: string;
        } | undefined;
        const p2 = journey.phase2Data as { clarifierSessionId?: string } | undefined;

        setMarketStudySessionId(p3?.marketStudySessionId ?? null);
        setClarifierSessionId(p3?.clarifierSessionId ?? p2?.clarifierSessionId ?? null);
        setBusinessIdeaId(effectiveIdeaId);
        setCreatorMarketGap(journey.project?.marketGap ?? null);
        setSector(journey.project?.sector ?? null);
        setGeography(journey.project?.geography ?? null);
        setTargetUser(journey.project?.targetUser ?? null);
        setProjectName((journey.project as { name?: string; title?: string } | undefined)?.name ?? (journey.project as { name?: string; title?: string } | undefined)?.title ?? null);

        // Fetch brand kit logo for PDF export
        let candidateLogoUri: string | null = null;
        let kitVersion: number | undefined = undefined;
        try {
          const currentIdeaId = effectiveIdeaId;
          const kit = await brandKitApi.getBrandKit(currentIdeaId ?? undefined);
          kitVersion = kit?.version;
          const selectedKey = kit?.logo?.selectedConceptKey;
          const concepts = kit?.logo?.concepts || [];
          const approvedConcept = selectedKey
            ? concepts.find(c => c.key === selectedKey)
            : concepts[0];
          const variations = kit?.logo?.variations || {};
          candidateLogoUri =
            variations.primary?.svgUri ||
            variations.primary?.pngUri ||
            variations.horizontal?.svgUri ||
            variations.horizontal?.pngUri ||
            variations.transparent?.svgUri ||
            variations.transparent?.pngUri ||
            variations.badge_stamp?.svgUri ||
            variations.badge_stamp?.pngUri ||
            approvedConcept?.lockupAssetUri ||
            approvedConcept?.markAssetUri ||
            null;
        } catch {
          // Brand kit optional — fallback silently
        }

        if (!candidateLogoUri) {
          const projectBranding = (journey.project as { branding?: { logoAsset?: string | null } } | undefined)?.branding;
          candidateLogoUri = projectBranding?.logoAsset || null;
        }

        if (candidateLogoUri) {
          setLogoUrl(resolveMediaUrl(candidateLogoUri, kitVersion));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [effectiveIdeaId]);

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
    setIsPrintOpen(true);
  };

  const handleNext = () => {
    completeStep(3, 1);
    router.push(withIdeaContext('/dashboard/creator/phase-3/business-model', effectiveIdeaId));
  };

  const isGenerating = session.phase === 'polling' || startMutation.isPending || regenerateMutation.isPending;

  // Market Sizing calculations
  const tam = output?.marketSizing?.tam;
  const sam = output?.marketSizing?.sam;
  const som = output?.marketSizing?.som;

  const tamVal = tam?.value;
  const samVal = sam?.value;
  const somVal = som?.value;

  const samPctOfTam = sam?.percentageOfTam ?? (tamVal && samVal ? (samVal / tamVal) * 100 : 15);
  const somPctOfSam = som?.percentageOfSam ?? (samVal && somVal ? (somVal / samVal) * 100 : 2.5);
  const somPctOfTam = tamVal && somVal ? (somVal / tamVal) * 100 : (samPctOfTam * somPctOfSam) / 100;

  const formatPct = (val: number) =>
    Number.isInteger(val) || Math.round(val * 10) % 10 === 0 ? val.toFixed(0) : val.toFixed(1);

  // Derived Target Segments List (strictly following Figma structure: 01, 02, 03)
  const targetSegmentsList = useMemo(() => {
    if (targetUser) {
      const parts = targetUser.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
      return parts.map((p, idx) => ({
        id: String(idx + 1).padStart(2, '0'),
        title: p,
        description: idx === 0 && output?.marketGapValidation?.primaryGap
          ? output.marketGapValidation.primaryGap
          : `Core target customer cohort operating in ${geography || 'target territory'}.`,
      }));
    }

    return [
      {
        id: '01',
        title: sector ? `${sector} Customers` : 'Primary Target Users',
        description: `Core target user segment operating in ${geography || 'target territory'}.`,
      },
    ];
  }, [output, targetUser, geography, sector]);

  const rawDate = session.data?.updatedAt || session.data?.createdAt;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const displaySector = sector || 'Small-business software';
  const displayRegion = geography || 'France';
  const displayTargetUser = targetUser || targetSegmentsList[0]?.title || 'independent retailers';
  const metadataLine = `Generated ${formattedDate} · Sector: ${displaySector} · Region: ${displayRegion} · ${displaySector} · ${displayRegion}`;

  return (
    <Phase3SetupShell
      fullWidth
      headerAlign="left"
      stepEyebrow="STEP 3.1 · MARKET STUDY"
      title={projectName ? `Market study — ${projectName}` : 'Market Study & Competitive Intelligence'}
      description={
        completed && output
          ? metadataLine
          : 'Comprehensive TAM/SAM/SOM sizing funnel, competitor benchmarking, demand signals, and sector validation.'
      }
      headerActions={
        completed && output ? (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isGenerating || insufficientCredits}
              className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border-border/70 rounded-lg shadow-none"
            >
              <RotateCw className="w-3.5 h-3.5" /> Regenerate ({marketStudyCost} credits)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border-border/70 rounded-lg shadow-none"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="w-full min-w-0 max-w-none space-y-8 pb-16 font-sans">
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
                  <p className="text-xs text-muted-foreground font-mono">
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

        {/* Pre-generation / Empty State */}
        {!completed && !isGenerating && !hasFailed && (
          <Card className="rounded-xl border border-border/70 bg-card p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-none">
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-lg font-semibold tracking-tight text-foreground font-heading">
                Generate Market Study &amp; Competitor Intelligence
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                Synthesize live market sizing funnels (TAM/SAM/SOM), assess direct and indirect competitors, uncover exploitable gaps, and surface demand signals.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
              <span>Cost: <strong className="text-foreground font-medium">{isCostLoading ? 'Loading cost…' : isCostError ? 'Unavailable' : `${marketStudyCost} credits`}</strong></span>
              {credits.data && (
                <span>(Balance: {credits.data.balance})</span>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(withIdeaContext('/dashboard/creator/phase-2/complete', effectiveIdeaId))}
                className="w-full sm:w-auto text-xs font-medium rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Phase 2
              </Button>
              <Button
                onClick={handleStart}
                disabled={isGenerating || insufficientCredits || !clarifierSessionId || isCostLoading || isCostError}
                className="w-full sm:w-auto gap-2 text-xs font-semibold px-6 rounded-lg"
              >
                {isCostLoading
                  ? 'Loading cost…'
                  : isCostError
                    ? 'Cost unavailable'
                    : `Generate Market Study (${marketStudyCost} credits)`}
              </Button>
            </div>

            {insufficientCredits && (
              <p className="text-xs text-destructive mt-2 font-sans">
                Insufficient credit balance ({credits.data?.balance ?? 0} available). Please top up to proceed.
              </p>
            )}
          </Card>
        )}

        {/* Polling / In-Flight State */}
        {isGenerating && (
          <Card className="rounded-xl border border-border/70 bg-card p-10 text-center max-w-xl mx-auto space-y-5 shadow-none animate-pulse">
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-foreground font-heading">Synthesizing Market Intelligence</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto font-sans">
                Running bottom-up market sizing calculations, competitor benchmarking matrices, and demand signal verifications...
              </p>
            </div>
            <div className="w-36 h-1 bg-muted rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-foreground/40 rounded-full animate-indeterminate" />
            </div>
          </Card>
        )}

        {/* Completed Output View Matching EXACTLY Figma 57156:8209 */}
        {completed && output && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* SECTION 1: Opportunity Summary Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 space-y-2 shadow-none">
              <div className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                YOUR MARKET OPPORTUNITY
              </div>
              <p className="text-base sm:text-lg font-sans font-normal leading-relaxed text-foreground">
                Your project operates in the {displaySector.toLowerCase()} market, targeting{' '}
                {displayTargetUser} in {displayRegion}, with an estimated addressable opportunity of{' '}
                <span className="font-mono font-semibold">{formatCurrency(tam?.value, tam?.currency)}</span>.
              </p>
            </div>

            {/* SECTION 2: Market Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Industry */}
              <div className="rounded-xl border border-border/80 bg-card p-5 space-y-1.5 shadow-none flex flex-col justify-between min-h-[96px]">
                <div className="text-xs font-heading font-medium uppercase tracking-wider text-muted-foreground">
                  INDUSTRY
                </div>
                <div className="text-base font-sans font-medium text-foreground truncate">
                  {displaySector}
                </div>
              </div>

              {/* Market */}
              <div className="rounded-xl border border-border/80 bg-card p-5 space-y-1.5 shadow-none flex flex-col justify-between min-h-[96px]">
                <div className="text-xs font-heading font-medium uppercase tracking-wider text-muted-foreground">
                  MARKET
                </div>
                <div className="text-base font-sans font-medium text-foreground truncate">
                  {tam?.label || creatorMarketGap || `${displaySector} operations tools`}
                </div>
              </div>

              {/* Primary Geography */}
              <div className="rounded-xl border border-border/80 bg-card p-5 space-y-1.5 shadow-none flex flex-col justify-between min-h-[96px]">
                <div className="text-xs font-heading font-medium uppercase tracking-wider text-muted-foreground">
                  PRIMARY GEOGRAPHY
                </div>
                <div className="text-base font-sans font-medium text-foreground truncate">
                  {displayRegion}
                </div>
              </div>

              {/* Market Stage */}
              <div className="rounded-xl border border-border/80 bg-card p-5 space-y-1.5 shadow-none flex flex-col justify-between min-h-[96px]">
                <div className="text-xs font-heading font-medium uppercase tracking-wider text-muted-foreground">
                  MARKET STAGE
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
                    Growing
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 3: Market Sizing */}
            <div className="space-y-4">
              {/* TAM / SAM / SOM 3-Card Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* TAM */}
                <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-2.5 shadow-none flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-center justify-between text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>TAM</span>
                    <span className="text-xs font-normal font-mono text-muted-foreground">100%</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground font-mono">
                    {formatCurrency(tam?.value, tam?.currency)}
                  </div>
                  <div className="text-xs sm:text-sm font-sans font-normal text-muted-foreground">
                    {tam?.label || 'Total addressable market'}
                  </div>
                </div>

                {/* SAM */}
                <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-2.5 shadow-none flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-center justify-between text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>SAM</span>
                    <span className="text-xs font-normal font-mono text-muted-foreground">{formatPct(samPctOfTam)}%</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground font-mono">
                    {formatCurrency(sam?.value, sam?.currency)}
                  </div>
                  <div className="text-xs sm:text-sm font-sans font-normal text-muted-foreground">
                    {sam?.label || 'Serviceable available market'}
                  </div>
                </div>

                {/* SOM */}
                <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-2.5 shadow-none flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-center justify-between text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>SOM</span>
                    <span className="text-xs font-normal font-mono text-muted-foreground">
                      {formatPct(somPctOfTam)}% ({formatPct(somPctOfSam)}% of SAM)
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground font-mono">
                    {formatCurrency(som?.value, som?.currency)}
                  </div>
                  <div className="text-xs sm:text-sm font-sans font-normal text-muted-foreground">
                    {som?.label || 'Serviceable obtainable market'}
                  </div>
                </div>
              </div>

              {/* Nested Horizontal Bar Visual */}
              <div className="rounded-xl border border-border/80 bg-card p-5 space-y-3 shadow-none">
                <div className="h-3.5 w-full rounded-full bg-muted overflow-hidden flex">
                  {/* SOM segment */}
                  <div
                    style={{ width: `${Math.max(somPctOfTam > 0 ? somPctOfTam : 2, 2)}%` }}
                    className="h-full bg-foreground shrink-0"
                  />
                  {/* SAM segment */}
                  <div
                    style={{ width: `${Math.max(samPctOfTam - somPctOfTam > 0 ? samPctOfTam - somPctOfTam : 6, 6)}%` }}
                    className="h-full bg-muted-foreground/40 shrink-0"
                  />
                  {/* TAM remainder */}
                  <div className="h-full flex-1 bg-muted" />
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-6 pt-1 text-xs font-mono text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-foreground shrink-0" />
                    <span>SOM {formatCurrency(som?.value, som?.currency)} ({formatPct(somPctOfTam)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-muted-foreground/40 shrink-0" />
                    <span>SAM {formatCurrency(sam?.value, sam?.currency)} ({formatPct(samPctOfTam)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-muted border border-border shrink-0" />
                    <span>TAM {formatCurrency(tam?.value, tam?.currency)} (100%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: Target Segments */}
            <div className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground tracking-tight">
                Target segments
              </h2>
              <div className="space-y-3">
                {targetSegmentsList.map((segment) => (
                  <div
                    key={segment.id}
                    className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 flex items-start gap-4 shadow-none min-h-[85px]"
                  >
                    <span className="text-sm font-heading font-bold font-mono text-muted-foreground shrink-0 mt-0.5">
                      {segment.id}
                    </span>
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-base font-sans font-semibold text-foreground">
                        {segment.title}
                      </h3>
                      <p className="text-sm font-sans font-normal text-muted-foreground leading-relaxed">
                        {segment.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5: Competitor Analysis */}
            <div className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground tracking-tight">
                Competitor landscape
              </h2>

              <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-none">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/40 text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3.5 px-4 w-[20%]">COMPETITOR</th>
                        <th className="py-3.5 px-4 w-[20%]">POSITIONING</th>
                        <th className="py-3.5 px-4 w-[20%]">STRENGTHS</th>
                        <th className="py-3.5 px-4 w-[20%]">WEAKNESSES</th>
                        <th className="py-3.5 px-4 w-[20%]">OPPORTUNITY FOR YOU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 bg-card">
                      {output.competitorLandscape?.directCompetitors?.map((comp, idx) => (
                        <tr key={idx} className="transition-colors hover:bg-muted/20">
                          {/* COMPETITOR */}
                          <td className="py-4 px-4 align-top">
                            <div className="text-sm font-sans font-semibold text-foreground">
                              {comp.name}
                            </div>
                            <div className="text-xs font-sans font-normal text-muted-foreground pt-0.5">
                              {comp.segment || displaySector} · {displayRegion}
                            </div>
                          </td>

                          {/* POSITIONING */}
                          <td className="py-4 px-4 text-sm font-sans font-normal text-muted-foreground align-top">
                            {comp.segment ? (
                              <span>{comp.segment}</span>
                            ) : (
                              <span className="font-mono text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* STRENGTHS */}
                          <td className="py-4 px-4 text-sm font-sans font-normal text-muted-foreground align-top">
                            {comp.strengths && comp.strengths.length > 0 ? (
                              comp.strengths.join(', ')
                            ) : (
                              <span className="font-mono text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* WEAKNESSES */}
                          <td className="py-4 px-4 text-sm font-sans font-normal text-muted-foreground align-top">
                            {comp.weaknesses && comp.weaknesses.length > 0 ? (
                              comp.weaknesses.join(', ')
                            ) : (
                              <span className="font-mono text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* OPPORTUNITY FOR YOU */}
                          <td className="py-4 px-4 text-sm font-sans font-medium text-foreground align-top">
                            {comp.exploitableGap || <span className="font-mono text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      ))}
                      {(!output.competitorLandscape?.directCompetitors || output.competitorLandscape.directCompetitors.length === 0) && (
                        <tr>
                          <td colSpan={5} className="py-8 px-4 text-center text-sm text-muted-foreground">
                            No direct competitors recorded for this study.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SECTION 6: Demand Signals and Market Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Demand Signals */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 space-y-4 shadow-none min-h-[227px]">
                <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground">
                  Demand signals
                </h3>
                {output.demandSignals && output.demandSignals.length > 0 ? (
                  <ul className="space-y-3.5">
                    {output.demandSignals.map((sig, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0 mt-2" />
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-sm font-sans font-medium text-foreground block">
                            {sig.signal}
                          </span>
                          {sig.evidence && (
                            <span className="text-xs sm:text-sm font-sans font-normal text-muted-foreground block leading-relaxed">
                              {sig.evidence}
                            </span>
                          )}
                          {sig.sourceAttribution && (
                            <span className="text-xs font-sans font-normal text-muted-foreground/80 block pt-0.5">
                              Source: {sig.sourceAttribution}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic font-sans">
                    No discrete demand signals recorded.
                  </p>
                )}
              </div>

              {/* Market Gaps */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 space-y-4 shadow-none min-h-[227px]">
                <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground">
                  Market gaps
                </h3>
                <ul className="space-y-3.5">
                  {output.sizingRisks?.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0 mt-2" />
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-sm font-sans font-normal text-muted-foreground block leading-relaxed">
                          <strong className="font-semibold text-foreground">{risk.risk}:</strong>{' '}
                          {risk.mitigation || 'Identified sizing constraint in sector addressability.'}
                        </span>
                      </div>
                    </li>
                  ))}
                  {(!output.sizingRisks || output.sizingRisks.length === 0) && (
                    <li className="text-sm text-muted-foreground italic font-sans">
                      No specific market gaps flagged.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* SECTION 7: Completion Checklist */}
            <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 space-y-3 shadow-none">
              <div className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                STEP COMPLETE
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  'Market identified',
                  'Target users defined',
                  'TAM / SAM / SOM generated',
                  'Competitor landscape analyzed',
                  'Market gaps identified',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full border border-emerald-600 dark:border-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                    </div>
                    <span className="text-xs sm:text-sm font-sans font-medium text-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 8: Footer Action Row */}
            <div className="border-t border-border/80 pt-6 flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating || insufficientCredits}
                aria-label="Re-run market study"
                className="inline-flex items-center gap-2 p-2 text-xs sm:text-sm font-sans font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg"
              >
                <RotateCw className="w-4 h-4 text-muted-foreground" />
                <span>Regenerate</span>
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-2.5 text-xs sm:text-sm font-sans font-medium inline-flex items-center gap-2 shadow-none transition-colors"
                >
                  <span>Continue to Business Model</span>
                  <ArrowRight className="w-4 h-4 text-primary-foreground" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {completed && output && (
        <MarketStudyPrintView
          open={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          projectName={projectName || undefined}
          logoUrl={logoUrl || undefined}
          project={{
            sector: sector || undefined,
            geography: geography || undefined,
            marketGap: creatorMarketGap || undefined,
            targetUser: targetUser || undefined,
          }}
          output={output}
        />
      )}
    </Phase3SetupShell>
  );
}
