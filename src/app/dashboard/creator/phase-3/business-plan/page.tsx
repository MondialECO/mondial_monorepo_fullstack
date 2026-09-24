'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { withIdeaContext } from '@/lib/creator-routes';
import {
  FileText,
  ArrowLeft,
  Loader2,
  RotateCw,
  AlertTriangle,
  FileWarning,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import PlanForecastPrintView from '@/components/creator/PlanForecastPrintView';
import { BusinessPlanFigmaFlow } from '@/components/creator/business-plan/BusinessPlanFigmaFlow';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  useAiCredits,
  useBusinessPlanSessionTimed,
  useForecastSessionTimed,
  useStartBusinessPlan,
  useRegenerateBusinessPlan,
  useRewriteBusinessPlanSection,
} from '@/hooks/queries/creator-ai';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import { creatorAiApi } from '@/lib/api-creator-ai';
import { hasAiOutput, type BusinessPlanOutput, type ForecastOutput } from '@/types/creator/ai';
import { toAiError, type AiError } from '@/lib/ai-errors';

function friendlyError(e: unknown, fallback: string): string {
  const res = (e as { response?: { status?: number; data?: { message?: string } } } | undefined)?.response;
  if (res?.status === 422 && res.data?.message === 'section_not_editable') {
    return 'This section is auto-generated from another module — update its source to change it.';
  }
  return e instanceof Error ? e.message : fallback;
}

export default function BusinessPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('ideaId');
  const { state: { activeIdeaId }, completeStep } = useCreatorProgress();
  const effectiveIdeaId = ideaId || activeIdeaId || null;

  const [loading, setLoading] = useState(true);
  const [bpSessionId, setBpSessionId] = useState<string | null>(null);
  const [forecastSessionId, setForecastSessionId] = useState<string | null>(null);
  const [clarifierSessionId, setClarifierSessionId] = useState<string | null>(null);
  const [project, setProject] = useState({
    name: '',
    problem: '',
    solution: '',
    targetUser: '',
    country: '',
    category: '',
    sector: '',
  });
  const [formation, setFormation] = useState<{
    selectedType?: string;
    founderEquity?: number;
    plannedRole?: string;
    skills?: { youHave?: string[]; youNeed?: string[] };
  } | undefined>(undefined);

  const [showExport, setShowExport] = useState(false);
  const [cross, setCross] = useState({
    hasForecast: false,
    hasGtm: false,
    youNeed: [] as string[],
    seedAsk: null as number | null,
  });
  const [startError, setStartError] = useState<AiError | null>(null);
  const [rewriting, setRewriting] = useState<{
    sectionId: string;
    baseVersion: number;
    hasEnteredProcessing: boolean;
  } | null>(null);

  const startBp = useStartBusinessPlan();
  const regenerateBp = useRegenerateBusinessPlan();
  const rewriteSectionMutation = useRewriteBusinessPlanSection();
  const credits = useAiCredits();
  const isCostLoading = credits.isLoading;
  const isCostError = credits.isError || (!isCostLoading && credits.data?.costs?.BusinessPlan == null);
  const planCost = credits.data?.costs?.BusinessPlan ?? null;
  const insufficientCredits = credits.data != null && planCost != null ? credits.data.balance < planCost : false;
  
  const session = useBusinessPlanSessionTimed(bpSessionId);
  const forecastSession = useForecastSessionTimed(forecastSessionId);
  const forecastOutput = (forecastSession.data as { output?: ForecastOutput } | undefined)?.output ?? null;
  const currentVersion = (session.data as { currentVersion?: number } | undefined)?.currentVersion ?? 0;

  const isStatusProcessing =
    (session.data as { status?: string } | undefined)?.status?.toLowerCase() === 'processing' ||
    (session.data as { status?: string } | undefined)?.status?.toLowerCase() === 'pending' ||
    (session.data as { status?: string } | undefined)?.status?.toLowerCase() === 'queued';
  const isSessionProcessing = Boolean(bpSessionId && (session.phase === 'polling' || isStatusProcessing));
  const isGenerating = Boolean(
    startBp.isPending ||
    regenerateBp.isPending ||
    rewriteSectionMutation.isPending ||
    isSessionProcessing
  );

  useEffect(() => {
    if (rewriting && currentVersion > rewriting.baseVersion) {
      setRewriting(null);
    }
  }, [currentVersion, rewriting]);

  useEffect(() => {
    if (
      rewriting &&
      !rewriting.hasEnteredProcessing &&
      (session.phase === 'polling' || isStatusProcessing || rewriteSectionMutation.isPending)
    ) {
      setRewriting((prev) => (prev ? { ...prev, hasEnteredProcessing: true } : null));
    }
  }, [rewriting, session.phase, isStatusProcessing, rewriteSectionMutation.isPending]);

  useEffect(() => {
    if (
      rewriting &&
      rewriting.hasEnteredProcessing &&
      session.phase === 'terminal' &&
      !rewriteSectionMutation.isPending &&
      currentVersion <= rewriting.baseVersion
    ) {
      setRewriting(null);
      setStartError({
        kind: 'other',
        message: 'The section rewrite didn’t complete — your plan is unchanged. You can try again.',
      });
    }
  }, [session.phase, currentVersion, rewriting, rewriteSectionMutation.isPending]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get(effectiveIdeaId);
        if (!active) return;
        const p3 = journey.phase3Data as {
          businessPlanSessionId?: string;
          clarifierSessionId?: string;
          forecastSessionId?: string;
          formationGenerator?: {
            selectedType?: string;
            founderEquity?: number;
            plannedRole?: string;
            youHave?: Array<{ label: string }>;
            youNeed?: Array<{ label: string }>;
          };
        } | undefined;
        const p2 = journey.phase2Data as { clarifierSessionId?: string } | undefined;
        const p5 = journey.phase5Data as { pathB?: { seedFunding?: { totalAsk?: number } } } | undefined;

        setBpSessionId(p3?.businessPlanSessionId ?? null);
        setForecastSessionId(p3?.forecastSessionId ?? null);
        setClarifierSessionId(p3?.clarifierSessionId ?? p2?.clarifierSessionId ?? null);

        setProject({
          name: journey.project?.name ?? '',
          problem: journey.project?.problem ?? '',
          solution: journey.project?.solution ?? '',
          targetUser: journey.project?.targetUser ?? '',
          country: (journey.project as any)?.country ?? 'France',
          category: journey.project?.category ?? 'Subscription software',
          sector: journey.project?.sector ?? '',
        });

        if (p3?.formationGenerator) {
          setFormation({
            selectedType: p3.formationGenerator.selectedType,
            founderEquity: p3.formationGenerator.founderEquity,
            plannedRole: p3.formationGenerator.plannedRole,
            skills: {
              youHave: (p3.formationGenerator.youHave ?? []).map((x) => x.label),
              youNeed: (p3.formationGenerator.youNeed ?? []).map((x) => x.label),
            },
          });
        }

        setCross({
          hasForecast: !!p3?.forecastSessionId,
          hasGtm: Boolean(journey.phase4Data?.gtmStrategy),
          youNeed: (p3?.formationGenerator?.youNeed ?? []).map((n) => n.label),
          seedAsk: p5?.pathB?.seedFunding?.totalAsk ?? null,
        });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [effectiveIdeaId]);

  const bpOutput = (session.data as { output?: BusinessPlanOutput } | undefined)?.output;
  const completed =
    session.phase === 'terminal' &&
    hasAiOutput((session.data as { status?: import('@/types/creator/ai').AiSessionStatus })?.status) &&
    !!bpOutput;
  const showDocument = completed || (!!rewriting && !!bpOutput) || (isGenerating && !!bpOutput);

  const bpError = (session.data as { error?: string | null } | undefined)?.error ?? null;
  const terminalFailed = !!bpSessionId && session.phase === 'terminal' && !completed && !rewriting && !bpOutput && !isGenerating;
  const failedIsProviderBilling = /openrouter error \(402\)/i.test(bpError ?? '');
  const failedIsCredits = !failedIsProviderBilling && /402|credit|insufficient|payment/i.test(bpError ?? '');

  const { data: legalFramework } = useQuery({
    queryKey: ['business-plan-section-12', effectiveIdeaId],
    queryFn: () => creatorJourneyApi.getBusinessPlanSection12(effectiveIdeaId),
    staleTime: 60_000,
  });

  const { data: clarifierSession } = useQuery({
    queryKey: ['clarifier-session-bp', clarifierSessionId],
    queryFn: () => creatorAiApi.getClarifier(clarifierSessionId!),
    enabled: !!clarifierSessionId,
    staleTime: 60_000,
  });
  const clarifierOutput = clarifierSession?.output ?? null;

  // Calculate 3-Year P&L Basis from Step 3.3 Forecast
  const forecastBasis = useMemo(() => {
    if (!forecastOutput) return undefined;
    const revMonths = forecastOutput.revenueForecast?.monthly ?? [];
    const costMonths = forecastOutput.costForecast?.monthly ?? [];
    const currency = forecastOutput.revenueForecast?.currency ?? 'EUR';

    const calcYear = (startM: number, endM: number) => {
      let rev = 0;
      let opex = 0;
      for (let m = startM; m <= endM; m++) {
        const rm = revMonths.find((x) => x.month === m);
        const cm = costMonths.find((x) => x.month === m);
        if (rm) rev += rm.amount ?? 0;
        if (cm) opex += (cm.fixedCosts ?? 0) + (cm.variableCosts ?? 0);
      }
      return { rev, opex, net: rev - opex };
    };

    const y1 = calcYear(1, 12);
    const y2 = calcYear(13, 24);
    const y3 = calcYear(25, 36);

    return {
      currency,
      years: [
        { year: 1, revenue: y1.rev, opex: y1.opex, netIncome: y1.net },
        { year: 2, revenue: y2.rev, opex: y2.opex, netIncome: y2.net },
        { year: 3, revenue: y3.rev, opex: y3.opex, netIncome: y3.net },
      ],
      summary: {
        breakEvenMonth: forecastOutput.breakEvenAnalysis?.breakEvenMonth,
      },
    };
  }, [forecastOutput]);

  const handleStart = async () => {
    setStartError(null);
    if (!clarifierSessionId) {
      setStartError({ kind: 'other', message: 'Complete the Idea Clarifier first — the plan builds on it.' });
      return;
    }
    try {
      const res = await startBp.mutateAsync({ clarifierSessionId });
      await creatorJourneyApi.setPhase3Session('businessPlan', res.sessionId);
      setBpSessionId(res.sessionId);
    } catch (e) {
      setStartError(toAiError(e, 'Could not start the business plan.'));
    }
  };

  const handleRegenerate = async () => {
    if (!bpSessionId || isGenerating) return;
    setStartError(null);
    try {
      await regenerateBp.mutateAsync(bpSessionId);
    } catch (e) {
      setStartError(toAiError(e, 'Could not regenerate the business plan.'));
    }
  };

  const handleRewrite = async (sectionId: string) => {
    if (!bpSessionId || rewriting || rewriteSectionMutation.isPending) return;
    setStartError(null);
    setRewriting({
      sectionId,
      baseVersion: currentVersion,
      hasEnteredProcessing: false,
    });
    try {
      await rewriteSectionMutation.mutateAsync({
        businessPlanSessionId: bpSessionId,
        sectionId,
      });
    } catch (e) {
      setStartError({ kind: 'other', message: friendlyError(e, 'Rewrite failed.') });
      setRewriting(null);
    }
  };

  const handleEditSection = async (sectionId: string, content: string) => {
    if (!bpSessionId) return;
    await creatorAiApi.editSection(bpSessionId, sectionId, content);
    session.retry();
  };

  const handleNext = () => {
    completeStep(3, 6);
    router.push(withIdeaContext('/dashboard/creator/phase-3/complete', effectiveIdeaId));
  };

  return (
    <>
      <PlanForecastPrintView
        open={showExport}
        onClose={() => setShowExport(false)}
        projectName={project.name}
        project={project}
        plan={bpOutput}
        forecast={forecastOutput}
        forecastBasis={forecastBasis}
        formation={formation}
        cross={{ youNeed: cross.youNeed, seedAsk: cross.seedAsk }}
        legalFramework={legalFramework}
      />

      <Phase3SetupShell
        fullWidth
        hideHeader={showDocument}
        stepEyebrow="STEP 3.6 · EXECUTIVE BUSINESS PLAN"
        title="Executive Business Plan"
        description="Comprehensive 12-chapter executive business plan synthesized directly from your verified venture inputs."
      >
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading business plan…
          </div>
        )}

        {!loading && !bpSessionId && !isGenerating && (
          <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-xl mx-auto shadow-sm">
            <h3 className="font-bold text-base font-sans">
              {startError?.kind === 'credits'
                ? "You've used all your AI credits"
                : 'Generate your business plan'}
            </h3>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              {startError?.kind === 'credits'
                ? "You've used all your AI credits."
                : 'We will synthesize a 12-section investor-ready document from your clarified idea and venture core.'}
            </p>
            {startError && startError.kind !== 'credits' && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{startError.message}</p>
                {(startError.kind === 'service' || startError.kind === 'rateLimited') && (
                  <Button variant="outline" size="sm" onClick={handleStart} disabled={startBp.isPending} className="gap-1.5">
                    <RotateCw className="h-3.5 w-3.5" /> Try again
                  </Button>
                )}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
              <Button
                variant="ghost"
                onClick={() => router.push(withIdeaContext('/dashboard/creator/phase-3/formation', effectiveIdeaId))}
                className="text-xs font-bold text-muted-foreground font-sans"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Company Formation
              </Button>
              <Button
                onClick={handleStart}
                disabled={startBp.isPending || startError?.kind === 'credits' || insufficientCredits || isCostLoading || isCostError}
                className="gap-2 font-sans font-semibold"
              >
                {startBp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {isCostLoading
                  ? 'Loading cost…'
                  : isCostError
                  ? 'Cost unavailable'
                  : `Generate plan (${planCost} credits)`}
              </Button>
            </div>
            {insufficientCredits && planCost != null && (
              <p className="text-xs font-medium text-destructive">
                Insufficient credits: requires {planCost} credits (you have {credits.data?.balance ?? 0}).
              </p>
            )}
          </Card>
        )}

        {!showDocument && isGenerating && !rewriting && (
          <Card className="rounded-2xl border border-border bg-card p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm animate-pulse" role="status" aria-live="polite">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <RotateCw className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground font-sans">Synthesizing Executive Business Plan</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto font-sans">
                Assembling 12-chapter investor-ready plan across market sizing, operations, unit economics, and governance…
              </p>
            </div>
            <div className="w-48 h-1.5 bg-muted rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-indeterminate" />
            </div>
          </Card>
        )}

        {bpSessionId && session.phase === 'timedout' && (
          <div className="flex flex-col items-center gap-3 py-16 text-center max-w-md mx-auto">
            <FileWarning className="h-10 w-10 text-warning" />
            <h3 className="font-bold text-base">Generation timed out</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This generation is taking longer than expected. The job may still finish in the background.
            </p>
            <Button variant="outline" onClick={session.retry} className="gap-2 mt-2">
              <RotateCw className="h-4 w-4" /> Check Status
            </Button>
          </div>
        )}

        {bpSessionId && session.isError && session.phase !== 'polling' && !showDocument && (
          <div className="flex flex-col items-center gap-3 py-16 text-center max-w-md mx-auto">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <h3 className="font-bold text-base text-destructive">Unable to load business plan</h3>
            <p className="text-sm text-muted-foreground">An error occurred while retrieving the session data.</p>
            <Button variant="outline" onClick={session.retry} className="gap-2 mt-2">
              <RotateCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {terminalFailed && (
          <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-bold text-base font-sans">
                {startError?.kind === 'credits' || failedIsCredits
                  ? "You've used all your AI credits"
                  : 'We couldn’t generate your business plan'}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              {startError?.kind === 'credits' || failedIsCredits
                ? "You've used all your AI credits."
                : failedIsProviderBilling
                ? 'The AI service is temporarily unavailable on our side. Your credits have been safeguarded — please try again shortly.'
                : 'The AI service was temporarily unavailable (provider rate limit or timeout). Please try generating again.'}
            </p>
            {startError && startError.kind !== 'credits' && (
              <div className="space-y-1">
                <p className="text-sm text-destructive">{startError.message}</p>
              </div>
            )}
            <Button
              onClick={handleStart}
              disabled={startBp.isPending || startError?.kind === 'credits' || failedIsCredits}
              className="gap-2 font-sans font-semibold"
            >
              {startBp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />} Generate again
            </Button>
          </Card>
        )}

        {startError && showDocument && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-destructive font-sans">Regeneration Error</h4>
              <p className="text-xs text-foreground/80 font-sans">{startError.message}</p>
            </div>
          </div>
        )}

        {showDocument && isGenerating && !rewriting && (
          <div className="mb-6">
            <Card className="rounded-2xl border border-border bg-card p-8 text-center max-w-2xl mx-auto space-y-5 shadow-sm animate-pulse" role="status" aria-live="polite">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <RotateCw className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-foreground font-sans">Regenerating Executive Business Plan</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto font-sans">
                  Updating 12-chapter document with latest verified inputs across financials, market data, and formation…
                </p>
              </div>
              <div className="w-48 h-1.5 bg-muted rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-indeterminate" />
              </div>
            </Card>
          </div>
        )}

        {showDocument && (
          <BusinessPlanFigmaFlow
            project={project}
            bpOutput={bpOutput}
            clarifierOutput={clarifierOutput}
            forecastBasis={forecastBasis}
            formation={formation}
            cross={cross}
            legalFramework={legalFramework}
            currentVersion={currentVersion}
            rewritingSectionId={rewriting?.sectionId ?? null}
            onRewriteSection={handleRewrite}
            onEditSection={handleEditSection}
            onExportPdf={() => setShowExport(true)}
            onRegenerate={handleRegenerate}
            isGenerating={isGenerating}
            onNext={handleNext}
            onBack={() => router.push(withIdeaContext('/dashboard/creator/phase-3/formation', effectiveIdeaId))}
            effectiveIdeaId={effectiveIdeaId}
          />
        )}
      </Phase3SetupShell>
    </>
  );
}
