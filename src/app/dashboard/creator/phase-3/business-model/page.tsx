'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  Sparkles,
  RotateCw,
  AlertTriangle,
  FileWarning,
  DollarSign,
  TrendingUp,
  Layers,
  HelpCircle,
  CheckCircle,
  Zap,
  Users,
  Building,
  Key,
  ShieldCheck,
  Scale,
  CreditCard,
  Target,
  Truck,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
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
  type BusinessModelCanvas,
  type RevenueTier,
  type UnitEconomics,
  type BusinessModelAssumption,
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

export default function BusinessModelPage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();

  const [loading, setLoading] = useState(true);
  const [businessModelSessionId, setBusinessModelSessionId] = useState<string | null>(null);
  const [marketStudySessionId, setMarketStudySessionId] = useState<string | null>(null);
  const [businessIdeaId, setBusinessIdeaId] = useState<string | null>(null);
  const [startError, setStartError] = useState<AiError | null>(null);

  const startMutation = useStartBusinessModel();
  const regenerateMutation = useRegenerateBusinessModel();
  const credits = useAiCredits();
  const businessModelCost = credits.data?.costs?.BusinessModel ?? 18;
  const insufficientCredits = credits.data ? credits.data.balance < businessModelCost : false;

  const session = useBusinessModelSessionTimed(businessModelSessionId);
  const output = (session.data as { output?: BusinessModelOutput } | undefined)?.output;
  const completed =
    session.phase === 'terminal' &&
    hasAiOutput((session.data as { status?: import('@/types/creator/ai').AiSessionStatus })?.status) &&
    !!output;

  const modelError = (session.data as { error?: string | null } | undefined)?.error ?? null;
  const terminalFailed = !!businessModelSessionId && session.phase === 'terminal' && !completed;

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

  const handleNext = () => {
    completeStep(3, 2);
    router.push('/dashboard/creator/phase-3/business-plan');
  };

  const isGenerating = session.phase === 'polling' || startMutation.isPending || regenerateMutation.isPending;

  const canvas = output?.canvas;
  const unitEconomics = output?.unitEconomics;

  return (
    <Phase3SetupShell
      fullWidth
      stepEyebrow="Step 3.2"
      title="Business Model & Monetization Canvas"
      description="Canonical Osterwalder canvas, pricing tier architecture, and ground-truth unit economics."
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
              <div>
                <h4 className="text-sm font-semibold text-destructive">Business Model generation was interrupted</h4>
                <p className="text-xs text-foreground/80 mt-0.5">
                  {modelError || 'The AI job did not finish successfully. Any deducted credits have been refunded.'}
                </p>
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
              <LayoutGrid className="w-7 h-7" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Generate Business Model &amp; Monetization Canvas
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Synthesize the canonical 9-block Osterwalder canvas, revenue architecture, cost structure, and unit economics grounded in your Step 3.1 Market Study.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/40 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Cost:{' '}
                <span className="font-mono font-medium text-foreground">
                  {businessModelCost} credits
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
                disabled={isGenerating || insufficientCredits || !marketStudySessionId}
                className="w-full sm:w-auto gap-2 text-xs font-semibold px-6"
              >
                <Sparkles className="w-4 h-4" />
                Generate Business Model
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
              <h3 className="text-lg font-semibold text-foreground">Structuring Business Architecture</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Synthesizing Osterwalder grid, calculating unit economics (ARPU/CAC/LTV), and mapping market study footnotes...
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
            {/* 1. The Canvas — Canonical Osterwalder Single Grid (Hairline dividers, no background tints, VP central emphasis) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-semibold text-foreground tracking-tight">
                      Business Model Canvas
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Canonical 9-block architecture grounded in Step 3.1 Market Study intelligence.
                  </p>
                </div>
                <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground self-start sm:self-auto">
                  Version <span className="font-mono font-medium ml-1">{session.data?.currentVersion ?? 1}</span>
                </Badge>
              </div>

              {/* Osterwalder Single Grid Container */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                {/* Desktop & Tablet: 5-Column Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 divide-border">
                  {/* Column 1: Key Partners (Full Height / Row Span 2) */}
                  <div className="lg:border-r border-border p-5 space-y-3 flex flex-col justify-start">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground pb-1 border-b border-border/40">
                      <Building className="w-3.5 h-3.5 text-muted-foreground" />
                      <h4>Key Partners</h4>
                    </div>
                    {canvas?.keyPartners && canvas.keyPartners.length > 0 ? (
                      <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed pl-3.5 list-disc">
                        {canvas.keyPartners.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">None defined</p>
                    )}
                  </div>

                  {/* Column 2: Key Activities (Top) + Key Resources (Bottom) */}
                  <div className="lg:border-r border-border divide-y divide-border flex flex-col">
                    {/* Key Activities */}
                    <div className="p-5 space-y-3 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground pb-1 border-b border-border/40">
                        <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                        <h4>Key Activities</h4>
                      </div>
                      {canvas?.keyActivities && canvas.keyActivities.length > 0 ? (
                        <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed pl-3.5 list-disc">
                          {canvas.keyActivities.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">None defined</p>
                      )}
                    </div>

                    {/* Key Resources */}
                    <div className="p-5 space-y-3 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground pb-1 border-b border-border/40">
                        <Key className="w-3.5 h-3.5 text-muted-foreground" />
                        <h4>Key Resources</h4>
                      </div>
                      {canvas?.keyResources && canvas.keyResources.length > 0 ? (
                        <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed pl-3.5 list-disc">
                          {canvas.keyResources.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">None defined</p>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Value Propositions (Centre, Full Height / Row Span 2, ONLY Emphasis) */}
                  <div className="lg:border-r border-border p-5 space-y-3 flex flex-col justify-start relative">
                    <div className="flex items-center justify-between gap-1 text-xs font-bold text-primary pb-1 border-b border-primary/20">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <h4>Value Propositions</h4>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        Core
                      </span>
                    </div>

                    {canvas?.valuePropositions && canvas.valuePropositions.length > 0 ? (
                      <div className="space-y-3 pt-1">
                        {canvas.valuePropositions.map((vp, idx) => (
                          <div key={idx} className="space-y-1">
                            <h5 className="text-xs font-semibold text-foreground leading-snug">
                              {vp.headline}
                            </h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {vp.details}
                            </p>
                            {vp.marketStudyFootnote && (
                              <div className="text-[10px] text-primary/90 font-medium inline-flex items-center gap-1 pt-0.5">
                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Market Study Ref:</span>
                                {vp.marketStudyFootnote}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">None defined</p>
                    )}
                  </div>

                  {/* Column 4: Customer Relationships (Top) + Channels (Bottom) */}
                  <div className="lg:border-r border-border divide-y divide-border flex flex-col">
                    {/* Customer Relationships */}
                    <div className="p-5 space-y-3 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground pb-1 border-b border-border/40">
                        <HeartHandshake className="w-3.5 h-3.5 text-muted-foreground" />
                        <h4>Customer Relationships</h4>
                      </div>
                      {canvas?.customerRelationships && canvas.customerRelationships.length > 0 ? (
                        <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed pl-3.5 list-disc">
                          {canvas.customerRelationships.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">None defined</p>
                      )}
                    </div>

                    {/* Channels */}
                    <div className="p-5 space-y-3 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground pb-1 border-b border-border/40">
                        <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                        <h4>Channels</h4>
                      </div>
                      {canvas?.channels && canvas.channels.length > 0 ? (
                        <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed pl-3.5 list-disc">
                          {canvas.channels.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">None defined</p>
                      )}
                    </div>
                  </div>

                  {/* Column 5: Customer Segments (Full Height / Row Span 2) */}
                  <div className="p-5 space-y-3 flex flex-col justify-start">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground pb-1 border-b border-border/40">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <h4>Customer Segments</h4>
                    </div>
                    {canvas?.customerSegments && canvas.customerSegments.length > 0 ? (
                      <div className="space-y-3 pt-1">
                        {canvas.customerSegments.map((seg, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="text-xs font-semibold text-foreground">
                              {seg.segment}
                            </div>
                            {seg.marketStudyFootnote && (
                              <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Footnote:</span>
                                {seg.marketStudyFootnote}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">None defined</p>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Cost Structure & Revenue Streams (Hairline divider above) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border border-t border-border">
                  {/* Cost Structure */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground pb-1 border-b border-border/40">
                      <Scale className="w-3.5 h-3.5 text-muted-foreground" />
                      <h4>Cost Structure</h4>
                    </div>
                    {canvas?.costStructure && canvas.costStructure.length > 0 ? (
                      <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed pl-3.5 list-disc">
                        {canvas.costStructure.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">None defined</p>
                    )}
                  </div>

                  {/* Revenue Streams */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground pb-1 border-b border-border/40">
                      <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                      <h4>Revenue Streams</h4>
                    </div>
                    {canvas?.revenueStreams && canvas.revenueStreams.length > 0 ? (
                      <div className="space-y-2.5">
                        {canvas.revenueStreams.map((rev, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="text-xs font-semibold text-foreground">
                              {rev.stream}
                            </div>
                            {rev.marketStudyFootnote && (
                              <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Footnote:</span>
                                {rev.marketStudyFootnote}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">None defined</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Modelled Unit Economics Strip (Digits in JetBrains Mono) */}
            {unitEconomics && (
              <Card className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">
                    Modelled Unit Economics
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* ARPU */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      ARPU {unitEconomics.arpu?.period ? `(${unitEconomics.arpu.period})` : ''}
                    </span>
                    <div className="text-xl font-bold font-mono text-foreground tracking-tight">
                      {formatCurrency(unitEconomics.arpu?.amount, unitEconomics.arpu?.currency)}
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      {unitEconomics.arpu?.isModelled ? 'Modelled estimate' : 'Target baseline'}
                    </span>
                  </div>

                  {/* CAC */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Blended CAC
                    </span>
                    <div className="text-xl font-bold font-mono text-foreground tracking-tight">
                      {formatCurrency(unitEconomics.cac?.amount, unitEconomics.cac?.currency)}
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      {unitEconomics.cac?.isModelled ? 'Modelled acquisition' : 'Baseline'}
                    </span>
                  </div>

                  {/* LTV */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Customer LTV
                    </span>
                    <div className="text-xl font-bold font-mono text-foreground tracking-tight">
                      {formatCurrency(unitEconomics.ltv?.amount, unitEconomics.ltv?.currency)}
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      {unitEconomics.ltv?.isModelled ? 'Lifetime value' : 'Baseline'}
                    </span>
                  </div>

                  {/* LTV:CAC Ratio */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      LTV : CAC Ratio
                    </span>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {unitEconomics.ltvToCacRatio !== undefined ? `${unitEconomics.ltvToCacRatio.toFixed(1)}x` : '—'}
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      Healthy benchmark ≥ 3.0x
                    </span>
                  </div>

                  {/* Payback Period */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      CAC Payback
                    </span>
                    <div className="text-xl font-bold font-mono text-foreground tracking-tight">
                      {unitEconomics.paybackPeriodMonths !== undefined ? `${unitEconomics.paybackPeriodMonths} mo` : '—'}
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      Cash recovery velocity
                    </span>
                  </div>
                </div>

                {unitEconomics.commentary && (
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1 font-sans">
                    {unitEconomics.commentary}
                  </p>
                )}
              </Card>
            )}

            {/* 3. Revenue Tiers Architecture */}
            {output.revenueTiers && output.revenueTiers.length > 0 && (
              <Card className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5 shadow-sm">
                <div className="space-y-1 border-b border-border pb-4">
                  <h3 className="text-base font-semibold text-foreground tracking-tight">
                    Pricing Tiers &amp; Revenue Architecture
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Target customer packages, pricing models, and projected revenue contribution.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {output.revenueTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border bg-muted/10 p-5 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{tier.tierName}</h4>
                            <p className="text-xs text-muted-foreground">{tier.targetSegment}</p>
                          </div>
                          {tier.projectedContributionPct !== undefined && (
                            <Badge variant="outline" className="text-[10px] font-mono font-medium">
                              {tier.projectedContributionPct}% share
                            </Badge>
                          )}
                        </div>

                        <div className="text-lg font-bold font-mono text-foreground">
                          {tier.pricing}
                        </div>

                        {tier.features && tier.features.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-border/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Features &amp; Scope
                            </span>
                            <ul className="text-xs text-muted-foreground space-y-1 pl-3.5 list-disc leading-relaxed">
                              {tier.features.map((feat, fIdx) => (
                                <li key={fIdx}>{feat}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 4. Strategic Assumptions Register */}
            {output.assumptions && output.assumptions.length > 0 && (
              <Card className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">
                    Key Model Assumptions &amp; Evidence Register
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {output.assumptions.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-1.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {item.category}
                        </span>
                        <p className="text-xs text-foreground/90 leading-relaxed">
                          {item.assumption}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-semibold self-start mt-1 ${
                          item.evidenceLevel === 'evidenced'
                            ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                            : item.evidenceLevel === 'modelled'
                            ? 'border-amber-500/40 text-amber-600 dark:text-amber-400'
                            : item.evidenceLevel === 'untested'
                            ? 'border-border text-muted-foreground'
                            : 'border-destructive/60 bg-destructive/10 text-destructive'
                        }`}
                      >
                        {item.evidenceLevel || 'UNKNOWN'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Bottom Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 mt-8">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/creator/phase-3/market-study')}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Market Study
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={isGenerating || insufficientCredits}
                  className="text-xs font-medium gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Regenerate ({businessModelCost} credits)
                </Button>
                <Button onClick={handleNext} className="gap-2 text-xs font-semibold px-5">
                  Continue to Business Plan <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Phase3SetupShell>
  );
}
