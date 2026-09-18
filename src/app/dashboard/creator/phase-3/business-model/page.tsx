'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  RotateCw,
  RefreshCw,
  AlertTriangle,
  FileWarning,
  Download,
} from 'lucide-react';
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
  const { completeStep } = useCreatorProgress();

  const [loading, setLoading] = useState(true);
  const [businessModelSessionId, setBusinessModelSessionId] = useState<string | null>(null);
  const [marketStudySessionId, setMarketStudySessionId] = useState<string | null>(null);
  const [businessIdeaId, setBusinessIdeaId] = useState<string | null>(null);
  const [startError, setStartError] = useState<AiError | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
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
        const { journey } = await creatorJourneyApi.get();
        if (!active) return;
        const p3 = journey.phase3Data as {
          businessModelSessionId?: string;
          marketStudySessionId?: string;
        } | undefined;

        setBusinessModelSessionId(p3?.businessModelSessionId ?? null);
        setMarketStudySessionId(p3?.marketStudySessionId ?? null);
        setBusinessIdeaId(getCreatorWorkspaceIdea());
        setCreatorMarketGap(journey.project?.marketGap ?? null);
        setSector(journey.project?.sector ?? null);
        setGeography(journey.project?.geography ?? null);
        setProjectName((journey.project as { name?: string; title?: string } | undefined)?.name ?? (journey.project as { name?: string; title?: string } | undefined)?.title ?? null);
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
    router.push('/dashboard/creator/phase-3/business-plan');
  };

  const isGenerating = session.phase === 'polling' || startMutation.isPending || regenerateMutation.isPending;

  const canvas = output?.canvas;
  const unitEconomics = output?.unitEconomics;

  const rawDate = session.data?.updatedAt || session.data?.createdAt;
  const formattedDate = rawDate
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(rawDate))
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

  const displaySector = sector || 'Subscription, cost-driven';
  const displayProjectName = projectName || 'AutoInvoice';

  const regenerateButtonText = isCostLoading
    ? 'Loading cost…'
    : isCostError
    ? 'Regenerate'
    : `Regenerate (${businessModelCost ?? 18} credits)`;

  return (
    <Phase3SetupShell
      fullWidth
      headerAlign="left"
      stepEyebrow="3.2 / BUSINESS MODEL"
      title={`Business model : ${displayProjectName}`}
      description={`Derived from market study 3.1 · ${displaySector} · Last edited ${formattedDate}`}
      headerActions={
        completed && output ? (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border-border/80 rounded-lg shadow-none"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isGenerating || insufficientCredits || isCostLoading || isCostError}
              className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border-border/80 rounded-lg shadow-none"
            >
              <RotateCw className="w-3.5 h-3.5" /> {regenerateButtonText}
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
                onClick={() => router.push('/dashboard/creator/phase-3/market-study')}
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

        {/* Completed Output View: Exact Figma Structure with Full Wrapping & Dynamic Row Heights */}
        {completed && output && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* ========================================================================= */}
            {/* SECTION 1: THE CANVAS — Single white card holding 9 Osterwalder blocks */}
            {/* ========================================================================= */}
            <div className="rounded-2xl border border-border bg-card shadow-xs">
              {/* Row 1: 5 Columns with Hairline Dividers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border">
                {/* Column 1: Key Partners (Full Height) */}
                <div className="p-5 flex flex-col justify-start space-y-3 min-w-0">
                  <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                    Key Partners
                  </h4>
                  {canvas?.keyPartners && canvas.keyPartners.length > 0 ? (
                    <ul className="text-body text-foreground/90 space-y-2.5 leading-relaxed font-sans list-disc pl-4">
                      {canvas.keyPartners.map((item, idx) => (
                        <li key={idx} className="break-words">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                  )}
                </div>

                {/* Column 2: Key Activities (Top) + Key Resources (Bottom) */}
                <div className="flex flex-col divide-y divide-border min-w-0">
                  {/* Key Activities */}
                  <div className="p-5 flex-1 space-y-3 min-w-0">
                    <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                      Key Activities
                    </h4>
                    {canvas?.keyActivities && canvas.keyActivities.length > 0 ? (
                      <ul className="text-body text-foreground/90 space-y-2.5 leading-relaxed font-sans list-disc pl-4">
                        {canvas.keyActivities.map((item, idx) => (
                          <li key={idx} className="break-words">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                    )}
                  </div>

                  {/* Key Resources */}
                  <div className="p-5 flex-1 space-y-3 min-w-0">
                    <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                      Key Resources
                    </h4>
                    {canvas?.keyResources && canvas.keyResources.length > 0 ? (
                      <ul className="text-body text-foreground/90 space-y-2.5 leading-relaxed font-sans list-disc pl-4">
                        {canvas.keyResources.map((item, idx) => (
                          <li key={idx} className="break-words">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                    )}
                  </div>
                </div>

                {/* Column 3: Value Propositions (Full Height, Blue Left Border & Heavier Weight) */}
                <div className="p-5 flex flex-col justify-start space-y-3 border-l-2 border-primary bg-card/60 relative min-w-0">
                  <h4 className="text-label font-semibold uppercase tracking-wider text-primary font-sans">
                    Value Propositions
                  </h4>

                  {canvas?.valuePropositions && canvas.valuePropositions.length > 0 ? (
                    <div className="space-y-4">
                      {canvas.valuePropositions.map((vp, idx) => (
                        <div key={idx} className="space-y-1">
                          <h5 className="text-body font-medium text-foreground leading-snug font-sans break-words">
                            {vp.headline}
                          </h5>
                          <p className="text-caption text-muted-foreground leading-relaxed font-sans break-words">
                            {vp.details}
                          </p>
                          {vp.marketStudyFootnote && (
                            <div className="text-footnote text-muted-foreground font-mono pt-1 break-words">
                              ← {vp.marketStudyFootnote}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                  )}

                  {/* Quiet Footnote at bottom */}
                  {(!canvas?.valuePropositions?.some((v) => v.marketStudyFootnote)) && (
                    <div className="text-footnote text-muted-foreground font-mono mt-auto pt-4 break-words">
                      ← 3.1 §4
                    </div>
                  )}
                </div>

                {/* Column 4: Customer Relationships (Top) + Channels (Bottom) */}
                <div className="flex flex-col divide-y divide-border min-w-0">
                  {/* Customer Relationships */}
                  <div className="p-5 flex-1 space-y-3 min-w-0">
                    <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                      Customer Relationships
                    </h4>
                    {canvas?.customerRelationships && canvas.customerRelationships.length > 0 ? (
                      <ul className="text-body text-foreground/90 space-y-2.5 leading-relaxed font-sans list-disc pl-4">
                        {canvas.customerRelationships.map((item, idx) => (
                          <li key={idx} className="break-words">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                    )}
                  </div>

                  {/* Channels */}
                  <div className="p-5 flex-1 space-y-3 min-w-0">
                    <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                      Channels
                    </h4>
                    {canvas?.channels && canvas.channels.length > 0 ? (
                      <ul className="text-body text-foreground/90 space-y-2.5 leading-relaxed font-sans list-disc pl-4">
                        {canvas.channels.map((item, idx) => (
                          <li key={idx} className="break-words">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                    )}
                  </div>
                </div>

                {/* Column 5: Customer Segments (Full Height) */}
                <div className="p-5 flex flex-col justify-start space-y-3 min-w-0">
                  <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                    Customer Segments
                  </h4>
                  {canvas?.customerSegments && canvas.customerSegments.length > 0 ? (
                    <div className="space-y-3">
                      {canvas.customerSegments.map((seg, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="text-body text-foreground/90 font-sans break-words leading-snug">
                            {seg.segment}
                          </div>
                          {seg.marketStudyFootnote && (
                            <div className="text-footnote text-muted-foreground font-mono break-words">
                              ← {seg.marketStudyFootnote}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                  )}

                  {/* Quiet Footnote at bottom */}
                  {(!canvas?.customerSegments?.some((s) => s.marketStudyFootnote)) && (
                    <div className="text-footnote text-muted-foreground font-mono mt-auto pt-4 break-words">
                      ← 3.1 §2
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Cost Structure and Revenue Streams (Split full width beneath) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border border-t border-border">
                {/* Cost Structure */}
                <div className="p-5 flex flex-col justify-start space-y-3 min-w-0">
                  <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                    Cost Structure
                  </h4>
                  {canvas?.costStructure && canvas.costStructure.length > 0 ? (
                    <ul className="text-body text-foreground/90 space-y-2 leading-relaxed font-sans list-disc pl-4">
                      {canvas.costStructure.map((item, idx) => (
                        <li key={idx} className="break-words">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                  )}
                </div>

                {/* Revenue Streams */}
                <div className="p-5 flex flex-col justify-start space-y-3 min-w-0">
                  <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                    Revenue Streams
                  </h4>
                  {canvas?.revenueStreams && canvas.revenueStreams.length > 0 ? (
                    <div className="space-y-2.5">
                      {canvas.revenueStreams.map((rev, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="text-body text-foreground/90 font-sans break-words leading-snug">
                            {rev.stream}
                          </div>
                          {rev.marketStudyFootnote && (
                            <div className="text-footnote text-muted-foreground font-mono break-words">
                              ← {rev.marketStudyFootnote}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                  )}

                  {/* Quiet Footnote at bottom */}
                  {(!canvas?.revenueStreams?.some((r) => r.marketStudyFootnote)) && (
                    <div className="text-footnote text-muted-foreground font-mono mt-auto pt-4 break-words">
                      ← 3.1 §1
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 2: UNIT ECONOMICS STRIP — 5 metric columns divided by hairlines */}
            {/* ========================================================================= */}
            {unitEconomics && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
                  {/* Metric 1: ARPU */}
                  <div className="p-3 sm:px-4 sm:py-1 space-y-1.5 flex flex-col justify-between min-w-0">
                    <span className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans break-words">
                      ARPU
                    </span>
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-2xl font-bold font-mono text-foreground tracking-tight break-all">
                        {formatCurrencyAmount(unitEconomics.arpu?.amount, unitEconomics.arpu?.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground font-sans">
                        / mo
                      </span>
                    </div>
                    <span className="text-caption text-muted-foreground font-sans block break-words leading-snug">
                      {unitEconomics.arpu?.period ? `Tier mix ${unitEconomics.arpu.period}` : 'Tier mix 60-30-10'}
                    </span>
                  </div>

                  {/* Metric 2: CAC */}
                  <div className="p-3 sm:px-4 sm:py-1 space-y-1.5 flex flex-col justify-between min-w-0">
                    <span className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans break-words">
                      CAC
                    </span>
                    <div className="text-2xl font-bold font-mono text-foreground tracking-tight break-all">
                      {formatCurrencyAmount(unitEconomics.cac?.amount, unitEconomics.cac?.currency)}
                    </div>
                    <span className="text-caption text-muted-foreground font-sans block break-words leading-snug">
                      {unitEconomics.cac?.isModelled ? 'Blended, self-serve + content' : 'Baseline acquisition'}
                    </span>
                  </div>

                  {/* Metric 3: LTV */}
                  <div className="p-3 sm:px-4 sm:py-1 space-y-1.5 flex flex-col justify-between min-w-0">
                    <span className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans break-words">
                      LTV
                    </span>
                    <div className="text-2xl font-bold font-mono text-foreground tracking-tight break-all">
                      {formatCurrencyAmount(unitEconomics.ltv?.amount, unitEconomics.ltv?.currency)}
                    </div>
                    <span className="text-caption text-muted-foreground font-sans block break-words leading-snug">
                      22-mo avg retention
                    </span>
                  </div>

                  {/* Metric 4: LTV:CAC (Only figure in GREEN) */}
                  <div className="p-3 sm:px-4 sm:py-1 space-y-1.5 flex flex-col justify-between min-w-0">
                    <span className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans break-words">
                      LTV:CAC
                    </span>
                    <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight break-all">
                      {unitEconomics.ltvToCacRatio !== undefined ? `${unitEconomics.ltvToCacRatio.toFixed(1)}x` : '—'}
                    </div>
                    <span className="text-caption text-muted-foreground font-sans block break-words leading-snug">
                      Healthy above 3x
                    </span>
                  </div>

                  {/* Metric 5: PAYBACK */}
                  <div className="p-3 sm:px-4 sm:py-1 space-y-1.5 flex flex-col justify-between min-w-0">
                    <span className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans break-words">
                      PAYBACK
                    </span>
                    <div className="text-2xl font-bold font-mono text-foreground tracking-tight break-all">
                      {unitEconomics.paybackPeriodMonths !== undefined ? `${unitEconomics.paybackPeriodMonths} mo` : '—'}
                    </div>
                    <span className="text-caption text-muted-foreground font-sans block break-words leading-snug">
                      Gross-margin adjusted
                    </span>
                  </div>
                </div>

                {/* Muted caption stating figures are modelled rather than validated */}
                <div className="pt-3 border-t border-border/50 text-caption text-muted-foreground font-sans break-words leading-relaxed">
                  Modelled from pricing assumptions — not yet validated against real customers.
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 3: TWO EQUAL CARDS — Revenue Model Detail & Model Assumptions to Test */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left Card: Revenue Model Detail Table */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-card-title font-semibold uppercase tracking-wider text-foreground font-sans">
                    Revenue Model Detail
                  </h3>
                  <span className="text-badge font-mono text-muted-foreground">
                    EUR (€)
                  </span>
                </div>

                {/* Table with natural wrapping on long target segments, tier names and feature lists */}
                {output.revenueTiers && output.revenueTiers.length > 0 ? (
                  <div className="w-full">
                    <table className="w-full text-left text-body table-auto">
                      <thead>
                        <tr className="border-b border-border text-table-header font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                          <th className="pb-2.5 pr-3 font-semibold">Tier</th>
                          <th className="pb-2.5 pr-3 font-semibold">Price</th>
                          <th className="pb-2.5 pr-3 font-semibold">Target Segment</th>
                          <th className="pb-2.5 font-semibold text-right whitespace-nowrap">% of Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {output.revenueTiers.map((tier, idx) => (
                          <tr key={idx}>
                            <td className="py-3 pr-3 align-top">
                              <div className="font-medium text-body text-foreground font-sans break-words leading-snug">
                                {tier.tierName}
                              </div>
                              {tier.features && tier.features.length > 0 && (
                                <div className="text-caption text-muted-foreground/80 font-sans mt-1 leading-relaxed break-words">
                                  {tier.features.join(' · ')}
                                </div>
                              )}
                            </td>
                            <td className="py-3 pr-3 align-top font-mono font-medium text-body text-foreground break-words leading-snug">
                              {tier.pricing}
                            </td>
                            <td className="py-3 pr-3 align-top text-body text-muted-foreground font-sans break-words leading-relaxed">
                              {tier.targetSegment}
                            </td>
                            <td className="py-3 align-top text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-2">
                                <span className="font-mono text-body font-medium text-foreground">
                                  {tier.projectedContributionPct !== undefined ? `${tier.projectedContributionPct}%` : '—'}
                                </span>
                                {tier.projectedContributionPct !== undefined && (
                                  <div className="w-12 sm:w-14 h-1.5 bg-muted rounded-full overflow-hidden shrink-0 inline-block align-middle">
                                    <div
                                      className="h-full bg-muted-foreground/60 rounded-full"
                                      style={{ width: `${Math.min(100, Math.max(0, tier.projectedContributionPct))}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-caption text-muted-foreground italic font-sans py-4">No pricing tiers defined.</p>
                )}
              </div>

              {/* Right Card: Model Assumptions to Test */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-card-title font-semibold uppercase tracking-wider text-foreground font-sans">
                    Model Assumptions to Test
                  </h3>
                  <span className="text-badge font-mono text-muted-foreground">
                    {output.assumptions?.length ?? 0} ACTIVE
                  </span>
                </div>

                {/* Assumptions List with unconstrained vertical growth and natural wrapping */}
                {output.assumptions && output.assumptions.length > 0 ? (
                  <div className="space-y-4">
                    {output.assumptions.map((item, idx) => {
                      const isBenchmark = item.evidenceLevel === 'evidenced';
                      const isModelled = item.evidenceLevel === 'modelled';

                      return (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-3 text-body leading-relaxed min-w-0"
                        >
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <span className="font-mono text-badge text-muted-foreground shrink-0 pt-0.5">
                              {idx + 1}.
                            </span>
                            <div className="text-body text-foreground/90 font-sans break-words leading-relaxed min-w-0 flex-1">
                              {item.category && (
                                <span className="font-mono text-footnote uppercase font-semibold text-muted-foreground mr-1.5 break-words">
                                  [{item.category}]
                                </span>
                              )}
                              {item.assumption}
                            </div>
                          </div>

                          {/* Right-aligned mapped evidence label with design colors */}
                          <div className="shrink-0 pt-0.5 ml-2">
                            {isBenchmark ? (
                              <span className="text-badge font-medium text-teal-600 dark:text-teal-400 font-sans whitespace-nowrap">
                                Benchmark-backed
                              </span>
                            ) : isModelled ? (
                              <span className="text-badge font-medium text-amber-600 dark:text-amber-400 font-sans whitespace-nowrap">
                                Modelled
                              </span>
                            ) : (
                              <span className="text-badge font-medium text-muted-foreground font-sans whitespace-nowrap">
                                Untested
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-caption text-muted-foreground italic font-sans py-4">No model assumptions registered.</p>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* FOOTER: Quiet back link left, single filled blue continue button right */}
            {/* ========================================================================= */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-8">
              <button
                type="button"
                onClick={() => router.push('/dashboard/creator/phase-3/market-study')}
                className="text-body font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors font-sans"
              >
                <ArrowLeft className="w-4 h-4" /> Market study
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  onClick={handleNext}
                  className="gap-2 text-button font-semibold px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  Continue to business plan <ArrowRight className="w-4 h-4" />
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

