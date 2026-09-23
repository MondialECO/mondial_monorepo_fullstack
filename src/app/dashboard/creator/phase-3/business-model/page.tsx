'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  RotateCw,
  RefreshCw,
  AlertTriangle,
  FileWarning,
  Download,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import BusinessModelPrintView from '@/components/creator/BusinessModelPrintView';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  useAiCredits,
  useBusinessModelSessionTimed,
  useStartBusinessModel,
  useRegenerateBusinessModel,
} from '@/hooks/queries/creator-ai';
import { creatorJourneyApi, getCreatorWorkspaceIdea } from '@/lib/api-creator-journey';
import {
  hasAiOutput,
  type BusinessModelOutput,
} from '@/types/creator/ai';
import { toAiError, type AiError } from '@/lib/ai-errors';
import { brandKitApi } from '@/lib/api-creator-brand-kit';
import { resolveMediaUrl } from '@/lib/brand-kit-media';
import { withIdeaContext } from '@/lib/creator-routes';

function formatCurrencyAmount(amount?: number | null, currency = 'EUR'): string {
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

export default function BusinessModelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryIdeaId = searchParams.get('ideaId');
  const { state, completeStep } = useCreatorProgress();
  const activeIdeaId = state?.activeIdeaId;
  const effectiveIdeaId = queryIdeaId || activeIdeaId || getCreatorWorkspaceIdea() || null;

  const [loading, setLoading] = useState(true);
  const [businessModelSessionId, setBusinessModelSessionId] = useState<string | null>(null);
  const [marketStudySessionId, setMarketStudySessionId] = useState<string | null>(null);
  const [businessIdeaId, setBusinessIdeaId] = useState<string | null>(null);
  const [startError, setStartError] = useState<AiError | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [geography, setGeography] = useState<string | null>(null);
  const [creatorMarketGap, setCreatorMarketGap] = useState<string | null>(null);

  const startMutation = useStartBusinessModel();
  const regenerateMutation = useRegenerateBusinessModel();
  const credits = useAiCredits();
  const isCostLoading = credits.isLoading;
  const isCostError = credits.isError || (!isCostLoading && credits.data?.costs?.BusinessModel == null);
  const businessModelCost = credits.data?.costs?.BusinessModel ?? null;
  const insufficientCredits = credits.data != null && businessModelCost != null ? credits.data.balance < businessModelCost : false;

  const session = useBusinessModelSessionTimed(businessModelSessionId);
  const output = (session.data as { output?: BusinessModelOutput } | undefined)?.output;
  const sessionStatus = (session.data as { status?: import('@/types/creator/ai').AiSessionStatus })?.status;
  const completed =
    session.phase === 'terminal' &&
    hasAiOutput(sessionStatus) &&
    !!output;

  const isTimedOut = !!businessModelSessionId && session.phase === 'timedout';
  const terminalFailed = !!businessModelSessionId && session.phase === 'terminal' && !completed;
  const hasFailed = terminalFailed || isTimedOut;
  const modelError = (session.data as { error?: string | null } | undefined)?.error ?? null;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get(effectiveIdeaId);
        if (!active) return;
        const p3 = journey.phase3Data as {
          businessModelSessionId?: string;
          marketStudySessionId?: string;
        } | undefined;

        setBusinessModelSessionId(p3?.businessModelSessionId ?? null);
        setMarketStudySessionId(p3?.marketStudySessionId ?? null);
        setBusinessIdeaId(effectiveIdeaId);
        setCreatorMarketGap(journey.project?.marketGap ?? null);
        setSector(journey.project?.sector ?? null);
        setGeography(journey.project?.geography ?? null);
        setProjectName((journey.project as { name?: string; title?: string } | undefined)?.name ?? (journey.project as { name?: string; title?: string } | undefined)?.title ?? null);

        // Fetch brand kit logo for PDF export with full fallback chain
        let candidateLogoUri: string | null = null;
        let kitVersion: number | undefined;

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
            variations.horizontal?.svgUri ||
            variations.transparent?.svgUri ||
            variations.transparent?.pngUri ||
            variations.badge_stamp?.svgUri ||
            variations.badge_stamp?.pngUri ||
            approvedConcept?.lockupAssetUri ||
            approvedConcept?.markAssetUri ||
            null;
        } catch {
          // Brand kit optional — silently fallback to project branding
        }

        // Fallback to journey project branding logoAsset if BrandKit did not yield an asset
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
  }, []);

  const handleStart = async () => {
    if (!marketStudySessionId) {
      setStartError({
        kind: 'other',
        message: 'No completed Phase 3.1 Market Study session found. Please complete Step 3.1 first.',
      });
      return;
    }
    setStartError(null);
    try {
      const res = await startMutation.mutateAsync({
        marketStudySessionId,
        businessIdeaId: businessIdeaId ?? undefined,
      });
      setBusinessModelSessionId(res.sessionId);
    } catch (err) {
      setStartError(toAiError(err, 'Failed to start Business Model generation.'));
    }
  };

  const handleRegenerate = async () => {
    if (!businessModelSessionId) return;
    setStartError(null);
    try {
      await regenerateMutation.mutateAsync(businessModelSessionId);
    } catch (err) {
      setStartError(toAiError(err, 'Failed to regenerate Business Model.'));
    }
  };

  const handleExport = () => {
    if (!output) return;
    setIsPrintOpen(true);
  };

  const handleNext = () => {
    completeStep(3, 2);
    router.push(withIdeaContext('/dashboard/creator/phase-3/forecast', effectiveIdeaId));
  };

  const handleBack = () => {
    router.push(withIdeaContext('/dashboard/creator/phase-3/market-study', effectiveIdeaId));
  };


  const isGenerating = session.phase === 'polling' || startMutation.isPending || regenerateMutation.isPending;

  const canvas = output?.canvas;
  const unitEconomics = output?.unitEconomics;

  const rawDate = session.data?.updatedAt || session.data?.createdAt;
  const formattedDate = rawDate
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(rawDate))
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

  const displaySector = sector || 'Subscription business model';
  const displayProjectName = projectName || 'Your Project';

  const regenerateButtonText = isCostLoading
    ? 'Loading cost…'
    : isCostError
    ? 'Regenerate'
    : `Regenerate (${businessModelCost ?? 18} credits)`;

  return (
    <Phase3SetupShell
      fullWidth
      headerAlign="left"
      stepEyebrow="STEP 3.2 · BUSINESS MODEL"
      title={`Business model : ${displayProjectName}`}
      description={`Derived from market study 3.1 · ${displaySector} · Last edited ${formattedDate}`}
      headerActions={
        completed && output ? (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isGenerating || insufficientCredits || isCostLoading || isCostError}
              className="h-8 gap-1.5 text-badge font-medium text-muted-foreground hover:text-foreground border-border/70 rounded-lg shadow-none"
            >
              <RotateCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} /> {regenerateButtonText}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 gap-1.5 text-badge font-medium text-muted-foreground hover:text-foreground border-border/70 rounded-lg shadow-none"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="w-full min-w-0 max-w-none space-y-9 pb-16 font-sans">
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

        {hasFailed && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileWarning className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-destructive">
                  {isTimedOut
                    ? 'Business Model generation timed out'
                    : 'Business Model generation was interrupted'}
                </h4>
                <p className="text-xs text-foreground/90">
                  {isTimedOut
                    ? 'The generation request took longer than expected to complete.'
                    : 'The AI generation did not finish.'}{' '}
                  {credits.data
                    ? `Current balance: ${credits.data.balance} credits (generation cost: ${businessModelCost} credits).`
                    : `Generation cost: ${businessModelCost} credits.`}
                </p>
                {modelError && (
                  <p className="text-badge text-muted-foreground font-mono">
                    Detail: {modelError}
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
                  className="gap-1.5 text-xs font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Check Again
                </Button>
              )}
              <Button
                onClick={handleStart}
                disabled={isGenerating || insufficientCredits || isCostLoading || isCostError}
                className="gap-2 shrink-0 text-xs font-semibold"
              >
                <RotateCw className="w-3.5 h-3.5" /> Retry Generation
              </Button>
            </div>
          </div>
        )}

        {/* Pre-generation / Empty State */}
        {!completed && !isGenerating && !hasFailed && (
          <Card className="rounded-2xl border border-border bg-card p-8 md:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <LayoutGrid className="w-7 h-7" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl font-semibold tracking-tight text-foreground font-sans">
                Generate Business Model &amp; Monetization Canvas
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                Synthesize the canonical 9-block Osterwalder canvas, revenue architecture, cost structure, and unit economics grounded in your Step 3.1 Market Study.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/40 text-xs text-muted-foreground">
                Cost:{' '}
                <span className="font-mono font-medium text-foreground">
                  {isCostLoading ? 'Loading cost…' : isCostError ? 'Unavailable' : `${businessModelCost ?? 18} credits`}
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
                onClick={() => router.push(withIdeaContext('/dashboard/creator/phase-3/market-study', effectiveIdeaId))}
                className="w-full sm:w-auto text-xs font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Market Study
              </Button>
              <Button
                onClick={handleStart}
                disabled={isGenerating || insufficientCredits || !marketStudySessionId || isCostLoading || isCostError}
                className="w-full sm:w-auto gap-2 text-xs font-semibold px-6"
              >
                {isCostLoading ? 'Loading cost…' : isCostError ? 'Cost unavailable' : `Generate Business Model (${businessModelCost ?? 18} credits)`}
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
              <h3 className="text-lg font-semibold text-foreground font-sans">Structuring Business Architecture</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto font-sans">
                Synthesizing Osterwalder grid, calculating unit economics (ARPU/CAC/LTV), and mapping market study footnotes...
              </p>
            </div>
            <div className="w-48 h-1.5 bg-muted rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-indeterminate" />
            </div>
          </Card>
        )}

        {/* Completed Output View: Exact Figma Structure matching node 57156:8456 */}
        {completed && output && (
          <div className="space-y-9 animate-in fade-in duration-300 font-sans">
            {/* ========================================================================= */}
            {/* SECTION 0: AUTHENTIC OSTERWALDER BUSINESS MODEL CANVAS GRID */}
            {/* ========================================================================= */}
            <div className="space-y-3.5">
              {/* Upper Region: 5 Equal Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-stretch">
                {/* Column 1: Key Partners (01) */}
                <div className="rounded-xl bg-card border border-border/80 flex flex-col overflow-hidden shadow-none">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border/70 bg-card">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-badge font-medium text-muted-foreground">
                        01
                      </span>
                      <h4 className="font-heading text-badge font-semibold uppercase tracking-wider text-foreground">
                        KEY PARTNERS
                      </h4>
                    </div>
                    <span className="font-sans text-badge text-muted-foreground">
                      {canvas?.keyPartners?.length ?? 0} items
                    </span>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col gap-2">
                    {canvas?.keyPartners && canvas.keyPartners.length > 0 ? (
                      canvas.keyPartners.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/60 px-3 py-2.5 flex items-center justify-between"
                        >
                          <span className="font-sans text-body text-foreground/90 font-normal leading-snug break-words">
                            {item}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="font-sans text-caption text-muted-foreground italic py-2">None defined</p>
                    )}
                  </div>
                </div>

                {/* Column 2: Key Activities (02) & Key Resources (03) */}
                <div className="flex flex-col gap-3.5">
                  {/* 02 Key Activities */}
                  <div className="rounded-xl bg-card border border-border/80 flex-1 flex flex-col overflow-hidden shadow-none">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-border/70 bg-card">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-badge font-medium text-muted-foreground">
                          02
                        </span>
                        <h4 className="font-heading text-badge font-semibold uppercase tracking-wider text-foreground">
                          KEY ACTIVITIES
                        </h4>
                      </div>
                      <span className="font-sans text-badge text-muted-foreground">
                        {canvas?.keyActivities?.length ?? 0} items
                      </span>
                    </div>
                    <div className="p-3.5 flex-1 flex flex-col gap-2">
                      {canvas?.keyActivities && canvas.keyActivities.length > 0 ? (
                        canvas.keyActivities.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/60 px-3 py-2.5 flex items-center justify-between"
                          >
                            <span className="font-sans text-body text-foreground/90 font-normal leading-snug break-words">
                              {item}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="font-sans text-caption text-muted-foreground italic py-2">None defined</p>
                      )}
                    </div>
                  </div>

                  {/* 03 Key Resources */}
                  <div className="rounded-xl bg-card border border-border/80 flex-1 flex flex-col overflow-hidden shadow-none">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-border/70 bg-card">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-badge font-medium text-muted-foreground">
                          03
                        </span>
                        <h4 className="font-heading text-badge font-semibold uppercase tracking-wider text-foreground">
                          KEY RESOURCES
                        </h4>
                      </div>
                      <span className="font-sans text-badge text-muted-foreground">
                        {canvas?.keyResources?.length ?? 0} items
                      </span>
                    </div>
                    <div className="p-3.5 flex-1 flex flex-col gap-2">
                      {canvas?.keyResources && canvas.keyResources.length > 0 ? (
                        canvas.keyResources.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/60 px-3 py-2.5 flex items-center justify-between"
                          >
                            <span className="font-sans text-body text-foreground/90 font-normal leading-snug break-words">
                              {item}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="font-sans text-caption text-muted-foreground italic py-2">None defined</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 3: Value Propositions (04) */}
                <div className="rounded-xl bg-card border border-border/80 flex flex-col overflow-hidden shadow-none">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border/70 bg-card">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-badge font-medium text-muted-foreground">
                        04
                      </span>
                      <h4 className="font-heading text-badge font-semibold uppercase tracking-wider text-foreground">
                        VALUE PROPOSITIONS
                      </h4>
                    </div>
                    <span className="font-sans text-badge text-muted-foreground">
                      {canvas?.valuePropositions?.length ?? 0} items
                    </span>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col gap-2">
                    {canvas?.valuePropositions && canvas.valuePropositions.length > 0 ? (
                      canvas.valuePropositions.map((vp, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/60 px-3 py-2.5 flex flex-col gap-1"
                        >
                          <span className="font-sans text-body text-foreground/90 font-normal leading-snug break-words">
                            {vp.headline}
                          </span>
                          {vp.details && vp.details !== vp.headline && (
                            <span className="font-sans text-caption text-muted-foreground leading-relaxed break-words">
                              {vp.details}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="font-sans text-caption text-muted-foreground italic py-2">None defined</p>
                    )}
                  </div>
                </div>

                {/* Column 4: Customer Relationships (05) & Channels (06) */}
                <div className="flex flex-col gap-3.5">
                  {/* 05 Customer Relationships */}
                  <div className="rounded-xl bg-card border border-border/80 flex-1 flex flex-col overflow-hidden shadow-none">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-border/70 bg-card">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-badge font-medium text-muted-foreground">
                          05
                        </span>
                        <h4 className="font-heading text-badge font-semibold uppercase tracking-wider text-foreground">
                          CUSTOMER RELATIONSHIPS
                        </h4>
                      </div>
                      <span className="font-sans text-badge text-muted-foreground">
                        {canvas?.customerRelationships?.length ?? 0} items
                      </span>
                    </div>
                    <div className="p-3.5 flex-1 flex flex-col gap-2">
                      {canvas?.customerRelationships && canvas.customerRelationships.length > 0 ? (
                        canvas.customerRelationships.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/60 px-3 py-2.5 flex items-center justify-between"
                          >
                            <span className="font-sans text-body text-foreground/90 font-normal leading-snug break-words">
                              {item}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="font-sans text-caption text-muted-foreground italic py-2">None defined</p>
                      )}
                    </div>
                  </div>

                  {/* 06 Channels */}
                  <div className="rounded-xl bg-card border border-border/80 flex-1 flex flex-col overflow-hidden shadow-none">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-border/70 bg-card">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-badge font-medium text-muted-foreground">
                          06
                        </span>
                        <h4 className="font-heading text-badge font-semibold uppercase tracking-wider text-foreground">
                          CHANNELS
                        </h4>
                      </div>
                      <span className="font-sans text-badge text-muted-foreground">
                        {canvas?.channels?.length ?? 0} items
                      </span>
                    </div>
                    <div className="p-3.5 flex-1 flex flex-col gap-2">
                      {canvas?.channels && canvas.channels.length > 0 ? (
                        canvas.channels.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/60 px-3 py-2.5 flex items-center justify-between"
                          >
                            <span className="font-sans text-body text-foreground/90 font-normal leading-snug break-words">
                              {item}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="font-sans text-caption text-muted-foreground italic py-2">None defined</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 5: Customer Segments (07) */}
                <div className="rounded-xl bg-card border border-border/80 flex flex-col overflow-hidden shadow-none">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border/70 bg-card">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-badge font-medium text-muted-foreground">
                        07
                      </span>
                      <h4 className="font-heading text-badge font-semibold uppercase tracking-wider text-foreground">
                        CUSTOMER SEGMENTS
                      </h4>
                    </div>
                    <span className="font-sans text-badge text-muted-foreground">
                      {canvas?.customerSegments?.length ?? 0} items
                    </span>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col gap-2">
                    {canvas?.customerSegments && canvas.customerSegments.length > 0 ? (
                      canvas.customerSegments.map((seg, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/60 px-3 py-2.5 flex items-center justify-between"
                        >
                          <span className="font-sans text-body text-foreground/90 font-normal leading-snug break-words">
                            {seg.segment}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="font-sans text-caption text-muted-foreground italic py-2">None defined</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lower Region: Cost Structure (08) & Revenue Streams (09) */}
              <div className="grid grid-cols-1 xl:grid-cols-11 gap-3.5 items-stretch">
                {/* Cost Structure (55%) -> 6 of 11 columns */}
                <div className="xl:col-span-6 rounded-xl bg-card border border-border/80 flex flex-col overflow-hidden shadow-none">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border/70 bg-card">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-badge font-medium text-muted-foreground">
                        08
                      </span>
                      <h4 className="font-heading text-badge font-semibold uppercase tracking-wider text-foreground">
                        COST STRUCTURE
                      </h4>
                    </div>
                    <span className="font-sans text-badge text-muted-foreground">
                      {canvas?.costStructure?.length ?? 0} items
                    </span>
                  </div>
                  <div className="p-3.5 flex-1">
                    {canvas?.costStructure && canvas.costStructure.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {canvas.costStructure.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/60 px-3 py-2.5 flex items-center justify-between"
                          >
                            <span className="font-sans text-body text-foreground/90 font-normal leading-snug break-words">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-sans text-caption text-muted-foreground italic py-2">None defined</p>
                    )}
                  </div>
                </div>

                {/* Revenue Streams (45%) -> 5 of 11 columns */}
                <div className="xl:col-span-5 rounded-xl bg-card border border-border/80 flex flex-col overflow-hidden shadow-none">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border/70 bg-card">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-badge font-medium text-muted-foreground">
                        09
                      </span>
                      <h4 className="font-heading text-badge font-semibold uppercase tracking-wider text-foreground">
                        REVENUE STREAMS
                      </h4>
                    </div>
                    <span className="font-sans text-badge text-muted-foreground">
                      {canvas?.revenueStreams?.length ?? 0} items
                    </span>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col gap-2">
                    {canvas?.revenueStreams && canvas.revenueStreams.length > 0 ? (
                      canvas.revenueStreams.map((rev, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/60 px-3 py-2.5 flex items-center justify-between"
                        >
                          <span className="font-sans text-body text-foreground/90 font-normal leading-snug break-words">
                            {rev.stream}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="font-sans text-caption text-muted-foreground italic py-2">None defined</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 1: UNIT ECONOMICS STRIP */}
            {/* ========================================================================= */}
            <div className="rounded-xl bg-card border border-border/80 p-6 space-y-4 shadow-none">
              <div className="flex items-center justify-between pb-3 border-b border-border/70">
                <span className="font-heading text-badge font-semibold uppercase tracking-wider text-muted-foreground">
                  UNIT ECONOMICS
                </span>
                <span className="font-sans text-badge text-muted-foreground">
                  Calibrated based on benchmarks
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-border/70">
                {/* CAC */}
                <div className="lg:pr-6 space-y-1.5 flex flex-col justify-between">
                  <span className="font-heading text-badge font-semibold uppercase tracking-wider text-muted-foreground">
                    CAC
                  </span>
                  <div className="font-mono text-stat-lg font-bold tracking-tight text-foreground">
                    {formatCurrencyAmount(unitEconomics?.cac?.amount, unitEconomics?.cac?.currency)}
                  </div>
                </div>

                {/* LTV */}
                <div className="lg:px-6 space-y-1.5 flex flex-col justify-between">
                  <span className="font-heading text-badge font-semibold uppercase tracking-wider text-muted-foreground">
                    LTV
                  </span>
                  <div className="font-mono text-stat-lg font-bold tracking-tight text-foreground">
                    {formatCurrencyAmount(unitEconomics?.ltv?.amount, unitEconomics?.ltv?.currency)}
                  </div>
                </div>

                {/* LTV / CAC */}
                <div className="lg:px-6 space-y-1.5 flex flex-col justify-between">
                  <span className="font-heading text-badge font-semibold uppercase tracking-wider text-muted-foreground">
                    LTV / CAC
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-stat-lg font-bold tracking-tight text-foreground">
                      {unitEconomics?.ltvToCacRatio !== undefined ? `${unitEconomics.ltvToCacRatio.toFixed(1)}x` : '—'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-badge font-sans font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                      {unitEconomics?.ltvToCacRatio !== undefined && unitEconomics.ltvToCacRatio < 1
                        ? 'Needs Attention'
                        : unitEconomics?.ltvToCacRatio !== undefined && unitEconomics.ltvToCacRatio < 3
                        ? 'Moderate'
                        : 'Healthy'}
                    </span>
                  </div>
                </div>

                {/* ESTIMATED PAYBACK */}
                <div className="lg:pl-6 space-y-1.5 flex flex-col justify-between">
                  <span className="font-heading text-badge font-semibold uppercase tracking-wider text-muted-foreground">
                    ESTIMATED PAYBACK
                  </span>
                  <div className="font-mono text-stat-lg font-bold tracking-tight text-foreground">
                    {unitEconomics?.paybackPeriodMonths !== undefined
                      ? `${unitEconomics.paybackPeriodMonths} month${unitEconomics.paybackPeriodMonths === 1 ? '' : 's'}`
                      : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 2: COMPLETION CHECKLIST */}
            {/* ========================================================================= */}
            <div className="rounded-xl bg-card border border-border/80 p-5 space-y-3 shadow-none">
              <div className="font-heading text-badge font-semibold uppercase tracking-wider text-muted-foreground">
                STEP COMPLETE
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {[
                  '9 Business Model blocks completed',
                  'Revenue model defined',
                  'Pricing defined',
                  'Cost structure defined',
                  'Unit economics generated',
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400 stroke-[2.5]" />
                    </div>
                    <span className="font-sans text-body font-medium text-foreground/90">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 3: FOOTER ACTION ROW */}
            {/* ========================================================================= */}
            <div className="pt-6 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-button font-sans font-medium text-muted-foreground hover:text-foreground border-border/80 rounded-xl h-11 px-5 shadow-none cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  onClick={handleNext}
                  className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-button font-semibold inline-flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  Build Financial Forecast <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {completed && output && (
        <BusinessModelPrintView
          open={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          projectName={projectName || undefined}
          logoUrl={logoUrl || undefined}
          project={{
            sector: sector || undefined,
            geography: geography || undefined,
            marketGap: creatorMarketGap || undefined,
          }}
          output={output}
          version={session.data?.currentVersion ?? 1}
          updatedAt={session.data?.updatedAt || session.data?.createdAt}
        />
      )}
    </Phase3SetupShell>
  );
}

