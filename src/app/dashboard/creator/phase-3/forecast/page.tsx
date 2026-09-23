'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
  RotateCw,
  FileDown,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import ForecastPrintView from '@/components/creator/ForecastPrintView';
import {
  RevenueAreaSvg,
  CostVsRevenueCrossingSvg,
  Cash36BarSvg,
  type ForecastRowCalculated,
} from '@/components/creator/ForecastSummaryCharts';
import { brandKitApi } from '@/lib/api-creator-brand-kit';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  useForecastSessionTimed,
  useBusinessPlanSessionTimed,
  useMarketStudySessionTimed,
  useBusinessModelSessionTimed,
  useAiCredits,
  useStartForecast,
} from '@/hooks/queries/creator-ai';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { toAiError, type AiError } from '@/lib/ai-errors';
import { formatMoney } from '@/lib/format-money';
import { hasAiOutput, type ForecastOutput, type BusinessPlanOutput, type MarketStudyOutput, type BusinessModelOutput } from '@/types/creator/ai';
import { withIdeaContext } from '@/lib/creator-routes';

function inputWarnings(growth: number, churn: number) {
  const w: string[] = [];
  if (growth > 30) {
    w.push('Aggressive growth: >30% MoM is difficult to sustain indefinitely — sanity-check market capacity.');
  }
  if (churn > 11) {
    w.push('High churn (>11%/mo) pushes LTV/CAC below the healthy 3× threshold and weakens investor readiness.');
  }
  return w;
}

export default function ForecastPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('ideaId');
  const { completeStep } = useCreatorProgress();

  const [loadingJourney, setLoadingJourney] = useState(true);
  const [forecastSessionId, setForecastSessionId] = useState<string | null>(null);
  const [businessPlanSessionId, setBusinessPlanSessionId] = useState<string | null>(null);
  const [marketStudySessionId, setMarketStudySessionId] = useState<string | null>(null);
  const [businessModelSessionId, setBusinessModelSessionId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [project, setProject] = useState({ name: '', problem: '', solution: '', targetUser: '' });
  const [cross, setCross] = useState({ youNeed: [] as string[], seedAsk: null as number | null });

  // Live Simulation Parameters: initialized and hydrated dynamically from real session / step data
  const [inputs, setInputs] = useState(() => {
    let initialBudget = 40000;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`mondial_forecast_budget_${ideaId || 'active'}`);
        if (stored && !isNaN(Number(stored)) && Number(stored) > 0) {
          initialBudget = Number(stored);
        }
      } catch {}
    }
    return {
      budget: initialBudget,
      launchSubs: 75,
      growth: 15,
      churn: 5,
      arpu: 32,
      varCost: 5,
      opex: 8000,
      tam: 900_000_000,
    };
  });

  const [savedBaselineInputs, setSavedBaselineInputs] = useState<typeof inputs | null>(null);
  const [startError, setStartError] = useState<AiError | null>(null);

  const startForecast = useStartForecast();
  const credits = useAiCredits();
  const isCostLoading = credits.isLoading;
  const forecastCost = credits.data?.costs?.Forecast ?? 32;
  const insufficientCredits = credits.data != null && forecastCost != null ? credits.data.balance < forecastCost : false;

  const session = useForecastSessionTimed(forecastSessionId);
  const planSession = useBusinessPlanSessionTimed(businessPlanSessionId);
  const planOutput = (planSession.data as { output?: BusinessPlanOutput } | undefined)?.output ?? null;

  const marketStudySession = useMarketStudySessionTimed(marketStudySessionId);
  const marketStudyOutput = (marketStudySession.data as { output?: MarketStudyOutput } | undefined)?.output ?? null;
  const marketStudyTam = marketStudyOutput?.marketSizing?.tam?.value ?? null;
  const marketStudyTamFormatted = marketStudyTam != null
    ? marketStudyTam >= 1_000_000_000
      ? `${(marketStudyTam / 1_000_000_000).toFixed(1)}B`
      : `${(marketStudyTam / 1_000_000).toFixed(0)}M`
    : inputs.tam >= 1_000_000_000
      ? `${(inputs.tam / 1_000_000_000).toFixed(1)}B`
      : `${(inputs.tam / 1_000_000).toFixed(0)}M`;

  const businessModelSession = useBusinessModelSessionTimed(businessModelSessionId);
  const bmOutput = (businessModelSession.data as { output?: BusinessModelOutput } | undefined)?.output ?? null;

  const sessionInputs = (session.data as {
    inputs?: { arpu?: number | null; opex?: number | null; monthlyGrowthPct?: number | null; tam?: number | null; monthlyChurnPct?: number | null } | null;
  } | undefined)?.inputs ?? null;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get(ideaId || undefined);
        const p3 = journey.phase3Data as {
          forecastSessionId?: string;
          businessPlanSessionId?: string;
          marketStudySessionId?: string;
          businessModelSessionId?: string;
          formationGenerator?: { youNeed?: { label: string }[] };
          startingBudget?: number;
        };
        const p5 = journey.phase5Data as { pathB?: { seedFunding?: { totalAsk?: number } } };
        const seedAsk = p5?.pathB?.seedFunding?.totalAsk ?? null;
        const projectBudget = (journey.project as { startingBudget?: number; budget?: number } | undefined)?.startingBudget ?? (journey.project as { startingBudget?: number; budget?: number } | undefined)?.budget ?? p3?.startingBudget ?? null;

        if (!active) return;
        setForecastSessionId(p3?.forecastSessionId ?? null);
        setBusinessPlanSessionId(p3?.businessPlanSessionId ?? null);
        setMarketStudySessionId(p3?.marketStudySessionId ?? null);
        setBusinessModelSessionId(p3?.businessModelSessionId ?? null);
        setProject({
          name: journey.project?.name ?? '',
          problem: journey.project?.problem ?? '',
          solution: journey.project?.solution ?? '',
          targetUser: journey.project?.targetUser ?? '',
        });
        setCross({
          youNeed: (p3?.formationGenerator?.youNeed ?? []).map((n) => n.label),
          seedAsk: seedAsk ?? projectBudget ?? null,
        });

        // Fetch brand kit logo for PDF export
        try {
          const kit = await brandKitApi.getBrandKit(ideaId || undefined);
          const selectedKey = kit?.logo?.selectedConceptKey;
          const concepts = kit?.logo?.concepts || [];
          const approvedConcept = selectedKey
            ? concepts.find((c) => c.key === selectedKey)
            : concepts[0];
          const variations = kit?.logo?.variations || {};
          const candidateLogoUri =
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
          if (candidateLogoUri && active) {
            setLogoUrl(candidateLogoUri);
          }
        } catch {}
      } finally {
        if (active) setLoadingJourney(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [ideaId]);

  // Hydrate authoritative real data from sessionInputs, Step 3.2 (Business Model ARPU/Unit Economics), Step 3.1 (TAM), and dynamic budget
  const hydratedRef = useRef<string | null>(null);
  useEffect(() => {
    let storedBudget: number | null = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`mondial_forecast_budget_${ideaId || 'active'}`);
        if (stored && !isNaN(Number(stored)) && Number(stored) > 0) {
          storedBudget = Number(stored);
        }
      } catch {}
    }
    const resolvedBudget = storedBudget ?? cross.seedAsk ?? 40000;

    if (sessionInputs && hydratedRef.current !== `session-${forecastSessionId}`) {
      hydratedRef.current = `session-${forecastSessionId}`;
      const realData = {
        budget: resolvedBudget,
        launchSubs: 75,
        growth: sessionInputs.monthlyGrowthPct ?? 15,
        churn: sessionInputs.monthlyChurnPct ?? 5,
        arpu: sessionInputs.arpu ?? 32,
        varCost: 5,
        opex: sessionInputs.opex ?? 8000,
        tam: sessionInputs.tam ?? marketStudyTam ?? 900_000_000,
      };
      setInputs(realData);
      setSavedBaselineInputs(realData);
    } else if (!sessionInputs && (bmOutput || marketStudyTam || cross.seedAsk) && !hydratedRef.current) {
      hydratedRef.current = 'linked-defaults';
      const step32Arpu = bmOutput?.unitEconomics?.arpu?.amount ?? (bmOutput?.revenueTiers?.[0]?.pricing ? Number(bmOutput.revenueTiers[0].pricing.replace(/[^0-9.]/g, '')) || null : null);
      const step31Tam = marketStudyTam ?? 900_000_000;
      setInputs((prev) => ({
        ...prev,
        budget: resolvedBudget,
        arpu: step32Arpu ?? prev.arpu,
        tam: step31Tam,
      }));
      setSavedBaselineInputs((prev) => ({
        budget: resolvedBudget,
        launchSubs: prev?.launchSubs ?? 75,
        growth: prev?.growth ?? 15,
        churn: prev?.churn ?? 5,
        varCost: prev?.varCost ?? 5,
        opex: prev?.opex ?? 8000,
        arpu: step32Arpu ?? prev?.arpu ?? 32,
        tam: step31Tam,
      }));
    }
  }, [sessionInputs, forecastSessionId, bmOutput, marketStudyTam, cross.seedAsk, ideaId]);

  const output = (session.data as { output?: ForecastOutput } | undefined)?.output;

  const fcError = (session.data as { error?: string | null } | undefined)?.error ?? null;
  const terminalFailed = !!forecastSessionId && session.phase === 'terminal' && !output;
  const failedIsProviderBilling = /openrouter error \(402\)/i.test(fcError ?? '');
  const failedIsCredits = !failedIsProviderBilling && /402|credit|insufficient|payment/i.test(fcError ?? '');

  // Detect live changes from canonical baseline
  const assumptionsChanged = useMemo(() => {
    if (!savedBaselineInputs) return false;
    return (
      inputs.budget !== savedBaselineInputs.budget ||
      inputs.launchSubs !== savedBaselineInputs.launchSubs ||
      inputs.growth !== savedBaselineInputs.growth ||
      inputs.churn !== savedBaselineInputs.churn ||
      inputs.arpu !== savedBaselineInputs.arpu ||
      inputs.varCost !== savedBaselineInputs.varCost ||
      inputs.opex !== savedBaselineInputs.opex ||
      inputs.tam !== savedBaselineInputs.tam
    );
  }, [inputs, savedBaselineInputs]);

  // Deterministic 36-Month Dynamic Projection Model matching Figma Node 57157:9297
  // When authoritative AI output is available and user has not tweaked live inputs, adopt AI monthly data
  const projectionData = useMemo(() => {
    const netGrowthRate = (inputs.growth - inputs.churn) / 100;
    const rows: ForecastRowCalculated[] = [];
    let currentSubs = inputs.launchSubs;
    let cumulativeNet = 0;

    const hasAiMonthly = !assumptionsChanged && (output?.revenueForecast?.monthly?.length ?? 0) > 0;

    for (let m = 1; m <= 36; m++) {
      if (m > 1) {
        currentSubs = Math.round(inputs.launchSubs * Math.pow(1 + netGrowthRate, m - 1));
      }

      const aiRev = hasAiMonthly ? output?.revenueForecast?.monthly?.find((r) => r.month === m) : undefined;
      const aiCost = hasAiMonthly ? output?.costForecast?.monthly?.find((c) => c.month === m) : undefined;
      const aiCash = hasAiMonthly ? output?.cashFlowProjection?.monthly?.find((cf) => cf.month === m) : undefined;

      const revenue = aiRev != null ? aiRev.amount : currentSubs * inputs.arpu;
      const fixedCost = aiCost != null ? aiCost.fixedCosts : inputs.opex;
      const variableCost = aiCost != null ? aiCost.variableCosts : currentSubs * inputs.varCost;
      const totalCost = fixedCost + variableCost;
      const netCashFlow = aiCash?.netCashFlow != null ? aiCash.netCashFlow : revenue - totalCost;
      cumulativeNet += netCashFlow;
      const cumulative = cumulativeNet;
      const cashOnHand = inputs.budget + cumulative;
      const note = aiRev?.notes || aiCost?.notes || aiCash?.notes || `+${inputs.growth}% new, −${inputs.churn}% churn`;

      rows.push({
        month: m,
        name: `M${m}`,
        subscribers: currentSubs,
        revenue,
        fixedCost,
        variableCost,
        totalCost,
        netCashFlow,
        cumulative,
        cashOnHand,
        notes: note,
      });
    }

    // Milestones
    let budgetRunsOutMonth: number | null = null;
    for (const r of rows) {
      if (r.cashOnHand < 0) {
        budgetRunsOutMonth = r.month;
        break;
      }
    }

    let minCumulativeLoss = Infinity;
    let lowestCashMonth = 1;
    let minCashOnHand = Infinity;
    for (const r of rows) {
      if (r.cumulative < minCumulativeLoss) {
        minCumulativeLoss = r.cumulative;
      }
      if (r.cashOnHand < minCashOnHand) {
        minCashOnHand = r.cashOnHand;
        lowestCashMonth = r.month;
      }
    }

    let calculatedBreakEvenMonth: number | null = null;
    let breakEvenSubs = 0;
    let breakEvenRevenue = 0;
    for (const r of rows) {
      if (r.revenue >= r.totalCost) {
        calculatedBreakEvenMonth = r.month;
        breakEvenSubs = r.subscribers;
        breakEvenRevenue = r.revenue;
        break;
      }
    }

    const breakEvenMonth = (!assumptionsChanged && output?.breakEvenAnalysis?.breakEvenMonth)
      ? output.breakEvenAnalysis.breakEvenMonth
      : (calculatedBreakEvenMonth ?? 16);

    const beRow = rows.find((r) => r.month === breakEvenMonth) ?? (calculatedBreakEvenMonth ? rows[calculatedBreakEvenMonth - 1] : undefined);
    const contributionPerSubLocal = inputs.arpu - inputs.varCost;
    const dynamicSubsNeeded = contributionPerSubLocal > 0 ? Math.ceil(inputs.opex / contributionPerSubLocal) : 0;
    const finalBreakEvenSubs = beRow?.subscribers ?? (breakEvenSubs || dynamicSubsNeeded);
    const finalBreakEvenRevenue = beRow?.revenue ?? (breakEvenRevenue || (finalBreakEvenSubs * inputs.arpu));

    let cashPositiveMonth: number | null = null;
    if (budgetRunsOutMonth) {
      for (const r of rows) {
        if (r.month > lowestCashMonth && r.cashOnHand >= 0) {
          cashPositiveMonth = r.month;
          break;
        }
      }
    }

    let lossRecoveryMonth: number | null = null;
    for (const r of rows) {
      if (r.month >= (breakEvenMonth ?? 1) && r.cumulative >= 0) {
        lossRecoveryMonth = r.month;
        break;
      }
    }

    // Tag milestones on rows
    rows.forEach((r) => {
      if (r.month === 1) {
        r.notes = `Launch · ${r.subscribers} subs × €${inputs.arpu}`;
      } else if (r.month === budgetRunsOutMonth) {
        r.isMilestone = true;
        r.milestoneTag = 'Budget runs out';
        r.notes = 'Budget runs out';
      } else if (r.month === lowestCashMonth) {
        r.isMilestone = true;
        r.milestoneTag = 'Lowest cash point';
        r.notes = 'Lowest cash point';
      } else if (r.month === breakEvenMonth) {
        r.isMilestone = true;
        r.milestoneTag = `Break-even · ${r.subscribers} subs`;
        r.notes = `Break-even · ${r.subscribers} subs`;
      } else if (r.month === cashPositiveMonth) {
        r.isMilestone = true;
        r.milestoneTag = 'Cash positive again';
        r.notes = 'Cash positive again';
      } else if (r.month === lossRecoveryMonth) {
        r.isMilestone = true;
        r.milestoneTag = 'All losses recovered';
        r.notes = 'All losses recovered';
      }
    });

    const y1Rows = rows.slice(0, 12);
    const y2Rows = rows.slice(12, 24);
    const y3Rows = rows.slice(24, 36);

    const subtotal = (slice: ForecastRowCalculated[]) => ({
      revenue: slice.reduce((acc, r) => acc + r.revenue, 0),
      fixedCost: slice.reduce((acc, r) => acc + r.fixedCost, 0),
      variableCost: slice.reduce((acc, r) => acc + r.variableCost, 0),
      totalCost: slice.reduce((acc, r) => acc + r.totalCost, 0),
      netCashFlow: slice.reduce((acc, r) => acc + r.netCashFlow, 0),
      cumulative: slice[slice.length - 1].cumulative,
      cashOnHand: slice[slice.length - 1].cashOnHand,
    });

    const y1Total = subtotal(y1Rows);
    const y2Total = subtotal(y2Rows);
    const y3Total = subtotal(y3Rows);

    const fundingGap = minCashOnHand < 0 ? Math.round(Math.abs(minCashOnHand) / 100) * 100 : 0;

    return {
      rows,
      y1Rows,
      y2Rows,
      y3Rows,
      y1Total,
      y2Total,
      y3Total,
      breakEvenMonth: breakEvenMonth ?? calculatedBreakEvenMonth ?? 16,
      breakEvenSubs: finalBreakEvenSubs,
      breakEvenRevenue: finalBreakEvenRevenue,
      budgetRunsOutMonth: budgetRunsOutMonth ?? null,
      lowestCashMonth: lowestCashMonth || 1,
      lowestCashStat: minCashOnHand !== Infinity ? minCashOnHand : inputs.budget,
      fundingGap,
      cashPositiveMonth: cashPositiveMonth ?? (budgetRunsOutMonth ? null : 1),
      lossRecoveryMonth: lossRecoveryMonth ?? (breakEvenMonth ? Math.min(36, breakEvenMonth + 9) : null),
      year1Revenue: y1Total.revenue,
      year2Revenue: y2Total.revenue,
      year3Revenue: y3Total.revenue,
    };
  }, [inputs, output, assumptionsChanged]);

  // Unit Economics & Break-Even calculations grounded in Step 3.2 Business Model Output
  const bmCac = bmOutput?.unitEconomics?.cac?.amount;
  const bmLtv = bmOutput?.unitEconomics?.ltv?.amount;
  const bmLtvCac = bmOutput?.unitEconomics?.ltvToCacRatio;
  const bmPayback = bmOutput?.unitEconomics?.paybackPeriodMonths;

  const contributionPerSub = inputs.arpu - inputs.varCost;
  const subsNeeded = contributionPerSub > 0 ? Math.ceil(inputs.opex / contributionPerSub) : 0;
  const grossMarginPct = inputs.arpu > 0 ? Math.round((contributionPerSub / inputs.arpu) * 100) : 0;
  const cac = bmCac ?? (inputs.launchSubs > 0 ? Math.round((inputs.opex * 0.4) / inputs.launchSubs) : 63);
  const ltv = bmLtv ?? (inputs.churn > 0 && contributionPerSub > 0 ? Math.round(contributionPerSub / (inputs.churn / 100)) : 0);
  const ltvCacRatio = bmLtvCac ? Number(bmLtvCac).toFixed(1) : (cac > 0 ? (ltv / cac).toFixed(1) : '—');
  const paybackMonths = bmPayback ? Number(bmPayback).toFixed(1) : (contributionPerSub > 0 ? (cac / contributionPerSub).toFixed(1) : '—');
  const month1NetLoss = projectionData.rows[0]?.netCashFlow ?? (inputs.launchSubs * inputs.arpu - (inputs.opex + inputs.launchSubs * inputs.varCost));

  const warnings = inputWarnings(inputs.growth, inputs.churn);

  const handleGenerate = async () => {
    setStartError(null);
    try {
      const res = await startForecast.mutateAsync({
        businessPlanSessionId: businessPlanSessionId || undefined,
        businessIdeaId: (ideaId as string) || undefined,
        arpu: inputs.arpu,
        opex: inputs.opex,
        monthlyGrowthPct: inputs.growth,
        tam: inputs.tam,
        monthlyChurnPct: inputs.churn,
      });
      await creatorJourneyApi.setPhase3Session('forecast', res.sessionId);
      setForecastSessionId(res.sessionId);
      setSavedBaselineInputs({ ...inputs });
    } catch (e) {
      setStartError(toAiError(e, 'Could not start the forecast simulation.'));
    }
  };

  const handleNext = () => {
    completeStep(3, 3);
    router.push(withIdeaContext('/dashboard/creator/phase-3/compliance', ideaId));
  };

  return (
    <>
      <ForecastPrintView
        open={showExport}
        onClose={() => setShowExport(false)}
        projectName={project.name}
        logoUrl={logoUrl}
        project={{
          targetUser: project.targetUser,
        }}
        inputs={inputs}
        projectionData={projectionData}
        output={output ?? null}
      />

      <Phase3SetupShell
        fullWidth
        hideHeader={true}
        title="Your 3-year financial forecast"
      >
        {loadingJourney && (
          <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center font-sans">
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading financial workspace…
          </div>
        )}

        {/* Polling / Generating State */}
        {forecastSessionId && session.phase === 'polling' && (
          <div className="space-y-6 max-w-2xl mx-auto py-12">
            <Card className="rounded-2xl border border-border bg-card p-8 text-center space-y-4 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-base text-foreground">Simulating 36-Month Projections…</h3>
                <p className="text-caption text-muted-foreground">
                  Synthesizing multi-year unit economics, revenue compounding, cost dynamics, and cash flow milestones.
                </p>
              </div>
              <div className="h-2 w-48 mx-auto bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-2/3" />
              </div>
            </Card>
          </div>
        )}

        {/* Terminal Failed or Timed Out */}
        {forecastSessionId && terminalFailed && (
          <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-4 max-w-xl mx-auto font-sans my-8">
            <div className="flex items-center gap-2 text-destructive font-bold text-body">
              <AlertTriangle className="h-4 w-4" /> Forecast generation was interrupted
            </div>
            <p className="text-caption text-muted-foreground leading-relaxed">
              {failedIsProviderBilling
                ? 'AI synthesis is temporarily unavailable due to upstream provider billing. Your plan is safe.'
                : failedIsCredits
                ? 'You do not have enough credits to generate this forecast.'
                : fcError || 'The forecast job did not complete successfully. You can retry with the same or modified inputs.'}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" onClick={handleGenerate} disabled={startForecast.isPending} className="gap-1.5 text-button font-semibold rounded-xl">
                <RotateCw className="h-3.5 w-3.5" /> Re-run Simulation
              </Button>
            </div>
          </Card>
        )}

        {/* Continuous 8-Section Layout (Figma Node 57157:9297) */}
        {!loadingJourney && (session.phase !== 'polling' || !forecastSessionId) && (
          <div className="space-y-6">
            {/* ======================================================
                SECTION 1 — Header Bar & Actions (Figma Exact)
                ====================================================== */}
            <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-badge font-sans font-semibold tracking-wider uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                    STEP 3.3 · FINANCIAL FORECAST
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground">
                    Your 3-year financial forecast
                  </h1>
                  <p className="text-caption text-muted-foreground font-sans">
                    36 months · Months 1–12 modelled, 13–36 projected · EUR
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExport(true)}
                      className="gap-2 text-button font-medium rounded-xl h-9 border-border bg-card hover:bg-muted"
                    >
                      <FileDown className="h-4 w-4" /> Download report
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={startForecast.isPending || insufficientCredits || isCostLoading}
                      className="gap-2 text-button font-medium rounded-xl h-9 border-border bg-card hover:bg-muted"
                    >
                      {startForecast.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCw className="h-4 w-4" />
                      )}
                      <span>Regenerate</span>
                    </Button>
                  </div>
                  <span className="text-badge text-muted-foreground font-sans pr-1">
                    Uses {forecastCost} credits · balance {credits.data?.balance != null ? credits.data.balance : (isCostLoading ? '…' : 0)}
                  </span>
                </div>
              </div>
            </Card>

            {/* ======================================================
                SECTION 2 — Verdict Strip (Conditional Alert)
                ====================================================== */}
            {assumptionsChanged && (
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 shadow-sm">
                <div className="flex items-center gap-2.5 text-caption font-sans">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    Assumptions changed since last run — results may be out of date. Click Regenerate to update forecast projections.
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={startForecast.isPending}
                  className="shrink-0 h-7 text-caption font-medium border-amber-500/40 hover:bg-amber-500/20"
                >
                  Regenerate now
                </Button>
              </div>
            )}

            {/* ======================================================
                SECTION 2.5 — Executive Verdict Hero Card (Figma Exact)
                ====================================================== */}
            <Card className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm relative overflow-hidden space-y-3">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${projectionData.fundingGap > 0 ? 'bg-amber-600' : 'bg-emerald-600'}`} />
              <div className="pl-2 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 max-w-3xl">
                    <h2 className="text-xl sm:text-2xl font-heading font-normal text-foreground tracking-tight leading-snug">
                      You break even in{' '}
                      <span className="font-heading font-bold text-foreground font-mono">
                        month {projectionData.breakEvenMonth}
                      </span>
                      {projectionData.lossRecoveryMonth ? (
                        <>
                          , and all losses are recovered by{' '}
                          <span className="font-heading font-bold text-foreground font-mono">
                            month {projectionData.lossRecoveryMonth}
                          </span>
                          .
                        </>
                      ) : (
                        ', and cumulative operating profit continues to compound.'
                      )}
                    </h2>
                    <p className="text-body text-foreground/80 font-sans">
                      {projectionData.budgetRunsOutMonth && projectionData.fundingGap > 0 ? (
                        <>
                          Your €{inputs.budget.toLocaleString()} starting budget runs out in month{' '}
                          {projectionData.budgetRunsOutMonth} — you&apos;ll need about €
                          {projectionData.fundingGap.toLocaleString()} more to get through month{' '}
                          {projectionData.lowestCashMonth}.
                        </>
                      ) : (
                        <>
                          Your €{inputs.budget.toLocaleString()} starting budget sustains operations without a funding deficit throughout the 36-month horizon.
                        </>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {projectionData.fundingGap > 0 ? (
                      <Badge variant="outline" className="bg-amber-600 text-white border-transparent px-3 py-1 text-badge font-sans font-medium rounded-full">
                        Funding gap
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-600 text-white border-transparent px-3 py-1 text-badge font-sans font-medium rounded-full">
                        Fully funded
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-caption text-muted-foreground font-sans">
                  A projection based on your assumptions, not a prediction.
                </div>
              </div>
            </Card>

            {/* ======================================================
                SECTION 3 — Three Summary Cards (Figma Exact Node 57157:9348)
                ====================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Card A: REVENUE */}
              <div className="rounded-[20px] border border-border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-sans text-muted-foreground uppercase tracking-wide font-normal">
                      REVENUE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans bg-[#EAEDFF] text-[#465281] dark:bg-indigo-950/60 dark:text-indigo-300 font-medium">
                      {inputs.growth - inputs.churn}% net growth / mo
                    </span>
                  </div>

                  <div>
                    <div className="text-[32px] font-heading font-bold text-foreground tracking-tight leading-tight">
                      €{Math.round(projectionData.year3Revenue).toLocaleString()}
                    </div>
                    <div className="text-[14px] text-muted-foreground font-sans mt-0.5">Year 3 revenue</div>
                  </div>

                  {/* 3-column submetrics box (Figma Exact #F9F9FA) */}
                  <div className="grid grid-cols-3 gap-2 px-3 py-2 rounded bg-[#F9F9FA] dark:bg-muted/40 border border-border/40 text-center">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-sans">YEAR 1</div>
                      <div className="text-[12px] font-heading font-bold text-foreground">
                        €{Math.round(projectionData.year1Revenue).toLocaleString()}
                      </div>
                    </div>
                    <div className="border-x border-border/40 px-1">
                      <div className="text-[10px] text-muted-foreground uppercase font-sans">YEAR 2</div>
                      <div className="text-[12px] font-heading font-bold text-foreground">
                        €{Math.round(projectionData.year2Revenue).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-sans">YEAR 3</div>
                      <div className="text-[12px] font-heading font-bold text-foreground">
                        €{Math.round(projectionData.year3Revenue).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Area Curve Mini-Chart (Figma SVG Exact) */}
                  <div className="pt-2">
                    <RevenueAreaSvg rows={projectionData.rows} breakEvenMonth={projectionData.breakEvenMonth} />
                  </div>
                </div>

                <div className="text-[12px] text-muted-foreground font-sans pt-3 border-t border-border/40">
                  Growth slows to projection after month 12.
                </div>
              </div>

              {/* Card B: COST VS REVENUE */}
              <div className="rounded-[20px] border border-border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[308px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-sans text-muted-foreground uppercase tracking-wide font-normal">
                      COST VS REVENUE
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-sans text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-[2px] bg-[#0D9488] inline-block" /> Revenue
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-[2px] bg-[#505C8C] inline-block" /> Total cost
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[32px] font-heading font-bold text-foreground tracking-tight leading-tight">
                      Month {projectionData.breakEvenMonth}
                    </div>
                    <div className="text-[14px] text-muted-foreground font-sans mt-0.5">
                      Inflection point to operating profit
                    </div>
                  </div>

                  {/* Crossing Chart Mini-Chart (Figma SVG Exact) */}
                  <div className="pt-2">
                    <CostVsRevenueCrossingSvg
                      rows={projectionData.rows}
                      breakEvenMonth={projectionData.breakEvenMonth}
                      breakEvenRevenue={projectionData.breakEvenRevenue}
                      breakEvenSubs={projectionData.breakEvenSubs}
                    />
                  </div>
                </div>

                <div className="text-[12px] text-muted-foreground font-sans pt-3 border-t border-border/40">
                  Revenue first covers all costs at {projectionData.breakEvenSubs} subscribers.
                </div>
              </div>

              {/* Card C: CASH POSITION */}
              <div className="rounded-[20px] border border-border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[312px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-sans text-muted-foreground uppercase tracking-wide font-normal">
                      CASH POSITION
                    </span>
                    {projectionData.budgetRunsOutMonth && projectionData.fundingGap > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[13px] font-sans bg-[#965F11]/10 text-[#965F11] dark:bg-amber-500/10 dark:text-amber-400 font-normal">
                        Deficit in M{projectionData.budgetRunsOutMonth}–M{projectionData.cashPositiveMonth ? projectionData.cashPositiveMonth - 1 : 36}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[13px] font-sans bg-[#0D9488]/10 text-[#0D9488] dark:bg-teal-500/10 dark:text-teal-400 font-normal">
                        No cash deficit
                      </span>
                    )}
                  </div>

                  <div>
                    <div className={`text-[32px] font-heading font-bold tracking-tight leading-tight ${projectionData.lowestCashStat < 0 ? 'text-[#965F11] dark:text-amber-400' : 'text-[#0D9488] dark:text-teal-400'}`}>
                      {projectionData.lowestCashStat < 0 ? '−' : ''}€{Math.abs(Math.round(projectionData.lowestCashStat)).toLocaleString()}
                    </div>
                    <div className="text-[14px] text-muted-foreground font-sans mt-0.5">
                      Lowest cash point (Month {projectionData.lowestCashMonth})
                    </div>
                  </div>

                  {/* 36-bar Cash Chart (Figma SVG Exact) */}
                  <div className="pt-2">
                    <Cash36BarSvg
                      rows={projectionData.rows}
                      budgetRunsOutMonth={projectionData.budgetRunsOutMonth}
                      cashPositiveMonth={projectionData.cashPositiveMonth}
                      lowestCashMonth={projectionData.lowestCashMonth}
                      fundingGap={projectionData.fundingGap}
                    />
                  </div>
                </div>

                <div className="text-[12px] text-muted-foreground font-sans pt-3 border-t border-border/40">
                  {projectionData.fundingGap > 0 && projectionData.cashPositiveMonth
                    ? `Lowest point in month ${projectionData.lowestCashMonth}. Cash stays positive from month ${projectionData.cashPositiveMonth}.`
                    : `Lowest point in month ${projectionData.lowestCashMonth}. Cash stays positive throughout.`}
                </div>
              </div>
            </div>

            {/* ======================================================
                SECTION 4 — Assumptions & Live Simulation Parameters (Figma Exact)
                ====================================================== */}
            <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
              <div className="space-y-1 border-b border-border pb-3">
                <h3 className="text-caption font-bold uppercase tracking-wider text-muted-foreground font-sans">
                  ASSUMPTIONS CONFIGURE KEY OPERATIONAL DRIVERS FOR THIS BUSINESS MODEL.
                </h3>
              </div>

              {/* 8 Operational Drivers Grid (Figma Exact Dimensions & Styling) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Starting budget */}
                <div className="p-4 rounded-lg border border-border/60 bg-muted/30 flex flex-col justify-between min-h-[112px]">
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-foreground font-sans font-medium">Starting budget</span>
                    {cross.seedAsk && inputs.budget === cross.seedAsk ? (
                      <Badge variant="outline" className="text-badge font-mono bg-primary/10 text-primary border-primary/20 px-1.5 py-0">
                        LINKED
                      </Badge>
                    ) : inputs.budget !== savedBaselineInputs?.budget ? (
                      <Badge variant="outline" className="text-badge font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-1.5 py-0">
                        EDITED
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-badge font-mono bg-muted text-muted-foreground px-1.5 py-0">
                        YOUR INPUT
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-base font-mono font-bold text-foreground">€</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={inputs.budget}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setInputs((s) => ({ ...s, budget: val }));
                        try {
                          if (typeof window !== 'undefined') {
                            localStorage.setItem(`mondial_forecast_budget_${ideaId || 'active'}`, String(val));
                          }
                        } catch {}
                      }}
                      className="w-full bg-transparent text-base font-mono font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="text-badge text-muted-foreground font-sans flex items-center justify-between">
                    <span>Money available before revenue</span>
                    {cross.seedAsk && inputs.budget !== cross.seedAsk && (
                      <button
                        type="button"
                        onClick={() => {
                          setInputs((s) => ({ ...s, budget: cross.seedAsk! }));
                          try {
                            localStorage.setItem(`mondial_forecast_budget_${ideaId || 'active'}`, String(cross.seedAsk));
                          } catch {}
                        }}
                        className="text-primary hover:underline font-semibold"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Subscribers at launch */}
                <div className="p-4 rounded-lg border border-border/60 bg-muted/30 flex flex-col justify-between min-h-[112px]">
                  <div className="text-caption text-foreground font-sans font-medium">Subscribers at launch</div>
                  <div className="flex items-baseline my-1">
                    <input
                      type="number"
                      min={1}
                      value={inputs.launchSubs}
                      onChange={(e) => setInputs((s) => ({ ...s, launchSubs: Number(e.target.value) || 0 }))}
                      className="w-full bg-transparent text-base font-mono font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="text-badge text-muted-foreground font-sans">
                    Paying subscribers in month one
                  </div>
                </div>

                {/* 3. New subscribers */}
                <div className="p-4 rounded-lg border border-border/60 bg-muted/30 flex flex-col justify-between min-h-[112px]">
                  <div className="text-caption text-foreground font-sans font-medium">New subscribers</div>
                  <div className="flex items-baseline gap-1 my-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={inputs.growth}
                      onChange={(e) => setInputs((s) => ({ ...s, growth: Number(e.target.value) || 0 }))}
                      className="w-14 bg-transparent text-base font-mono font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-caption font-sans text-foreground font-medium">% / mo</span>
                  </div>
                  <div className="text-badge text-muted-foreground font-sans">
                    Of your current base, each month
                  </div>
                </div>

                {/* 4. Monthly churn */}
                <div className="p-4 rounded-lg border border-border/60 bg-muted/30 flex flex-col justify-between min-h-[112px]">
                  <div className="text-caption text-foreground font-sans font-medium">Monthly churn</div>
                  <div className="flex items-baseline gap-1 my-1">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={inputs.churn}
                      onChange={(e) => setInputs((s) => ({ ...s, churn: Number(e.target.value) || 0 }))}
                      className="w-14 bg-transparent text-base font-mono font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-caption font-sans text-foreground font-medium">% / mo</span>
                  </div>
                  <div className="text-badge text-muted-foreground font-sans">
                    Subscribers who cancel each month
                  </div>
                </div>

                {/* 5. Price per subscriber */}
                <div className="p-4 rounded-lg border border-border/60 bg-muted/30 flex flex-col justify-between min-h-[112px]">
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-foreground font-sans font-medium">Price per subscriber</span>
                    <Badge variant="outline" className="text-badge font-mono bg-primary/10 text-primary border-primary/20 px-1.5 py-0">
                      LINKED
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-base font-mono font-bold text-foreground">€</span>
                    <input
                      type="number"
                      min={1}
                      value={inputs.arpu}
                      onChange={(e) => setInputs((s) => ({ ...s, arpu: Number(e.target.value) || 0 }))}
                      className="w-12 bg-transparent text-base font-mono font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-caption font-sans text-foreground font-medium">/ mo</span>
                  </div>
                  <div className="text-badge text-muted-foreground font-sans">
                    From your pricing, step 3.2
                  </div>
                </div>

                {/* 6. Variable cost */}
                <div className="p-4 rounded-lg border border-border/60 bg-muted/30 flex flex-col justify-between min-h-[112px]">
                  <div className="text-caption text-foreground font-sans font-medium">Variable cost</div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-base font-mono font-bold text-foreground">€</span>
                    <input
                      type="number"
                      min={0}
                      value={inputs.varCost}
                      onChange={(e) => setInputs((s) => ({ ...s, varCost: Number(e.target.value) || 0 }))}
                      className="w-12 bg-transparent text-base font-mono font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-caption font-sans text-foreground font-medium">/ sub</span>
                  </div>
                  <div className="text-badge text-muted-foreground font-sans">
                    Delivery and logistics per subscriber
                  </div>
                </div>

                {/* 7. Fixed costs */}
                <div className="p-4 rounded-lg border border-border/60 bg-muted/30 flex flex-col justify-between min-h-[112px]">
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-foreground font-sans font-medium">Fixed costs</span>
                    <Sliders className="h-3.5 w-3.5 text-muted-foreground/70" />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-base font-mono font-bold text-foreground">€</span>
                    <input
                      type="number"
                      min={100}
                      step={500}
                      value={inputs.opex}
                      onChange={(e) => setInputs((s) => ({ ...s, opex: Number(e.target.value) || 0 }))}
                      className="w-20 bg-transparent text-base font-mono font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-caption font-sans text-foreground font-medium">/ mo</span>
                  </div>
                  <div className="text-badge text-muted-foreground font-sans">
                    Platform, marketing, team, operations
                  </div>
                </div>

                {/* 8. Market size */}
                <div className="p-4 rounded-lg border border-border/60 bg-muted/30 flex flex-col justify-between min-h-[112px] relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-600" />
                  <div className="pl-1.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-foreground font-sans font-medium">Market size</span>
                      <Badge variant="outline" className="text-badge font-mono bg-primary/10 text-primary border-primary/20 px-1.5 py-0">
                        LINKED
                      </Badge>
                    </div>
                    <div className="text-base font-mono font-bold text-foreground my-1">
                      €{inputs.tam >= 1_000_000_000
                        ? `${(inputs.tam / 1_000_000_000).toFixed(1)}B`
                        : `${(inputs.tam / 1_000_000).toFixed(0)}M`}
                    </div>
                    <div className="text-badge text-muted-foreground font-sans flex flex-col gap-0.5">
                      <span>Market study: €{marketStudyTamFormatted} · This forecast: €{inputs.tam >= 1_000_000_000 ? `${(inputs.tam / 1_000_000_000).toFixed(1)}B` : `${(inputs.tam / 1_000_000).toFixed(0)}M`}</span>
                      {marketStudyTam && inputs.tam !== marketStudyTam && (
                        <button
                          type="button"
                          onClick={() => setInputs((s) => ({ ...s, tam: marketStudyTam }))}
                          className="text-primary hover:underline font-semibold text-left"
                        >
                          Reset to market study value
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Assumption Warnings */}
              {warnings.length > 0 && (
                <div className="space-y-2 pt-2">
                  {warnings.map((wn) => (
                    <div key={wn} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-caption text-amber-700 dark:text-amber-300 font-sans">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <span>{wn}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* ======================================================
                SECTION 5 — 36-Month Data Table (Figma Exact)
                ====================================================== */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden space-y-0">
              <div className="p-6 border-b border-border space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-badge font-sans font-semibold tracking-wider uppercase">
                  STEP 3.3 · FORECAST RESULTS
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground tracking-tight">
                  Financial Forecast — 36-Month Projection
                </h3>
                <p className="text-caption text-muted-foreground font-sans">
                  Month-by-month subscribers, revenue, costs and cash across three years.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-caption font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground text-badge uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-mono">MONTH</th>
                      <th className="px-3 py-3 text-right">SUBSCRIBERS</th>
                      <th className="px-3 py-3 text-right">REVENUE</th>
                      <th className="px-3 py-3 text-right">FIXED COST</th>
                      <th className="px-3 py-3 text-right">VARIABLE COST</th>
                      <th className="px-3 py-3 text-right font-bold text-foreground">TOTAL COST</th>
                      <th className="px-3 py-3 text-right">NET CASH FLOW</th>
                      <th className="px-3 py-3 text-right">CUMULATIVE</th>
                      <th className="px-3 py-3 text-right font-bold text-foreground">CASH ON HAND</th>
                      <th className="px-4 py-3 text-left">NOTES</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/40 font-mono">
                    {/* --- YEAR 1 HEADER --- */}
                    <tr className="bg-muted/50 border-y border-border">
                      <td colSpan={10} className="px-4 py-2 font-heading font-bold text-badge text-foreground tracking-wider uppercase font-sans">
                        YEAR 1 · MODELLED
                      </td>
                    </tr>
                    {projectionData.y1Rows.map((row) => (
                      <tr
                        key={row.month}
                        className={`hover:bg-muted/30 transition-colors ${
                          row.isMilestone ? 'bg-primary/5 font-semibold' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 font-bold text-foreground">{row.name}</td>
                        <td className="px-3 py-2.5 text-right text-foreground">{row.subscribers.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                          €{Math.round(row.revenue).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">€{Math.round(row.fixedCost).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">€{Math.round(row.variableCost).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-foreground">€{Math.round(row.totalCost).toLocaleString()}</td>
                        <td className={`px-3 py-2.5 text-right font-medium ${row.netCashFlow < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {row.netCashFlow < 0 ? '−' : '+'}€{Math.abs(Math.round(row.netCashFlow)).toLocaleString()}
                        </td>
                        <td className={`px-3 py-2.5 text-right ${row.cumulative < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {row.cumulative < 0 ? '−' : '+'}€{Math.abs(Math.round(row.cumulative)).toLocaleString()}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-bold ${row.cashOnHand < 0 ? 'text-destructive' : 'text-foreground'}`}>
                          {row.cashOnHand < 0 ? '−' : ''}€{Math.abs(Math.round(row.cashOnHand)).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-left font-sans text-caption">
                          {row.milestoneTag ? (
                            <Badge variant="outline" className="text-badge font-mono bg-primary/10 text-primary border-primary/20">
                              {row.milestoneTag}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{row.notes}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* --- YEAR 1 SUBTOTAL --- */}
                    <tr className="bg-muted/40 font-bold border-t border-border">
                      <td className="px-4 py-2.5 font-heading text-badge uppercase tracking-wider font-sans">Y1 SUBTOTAL</td>
                      <td className="px-3 py-2.5 text-right">—</td>
                      <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                        €{Math.round(projectionData.y1Total.revenue).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right">€{Math.round(projectionData.y1Total.fixedCost).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right">€{Math.round(projectionData.y1Total.variableCost).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right">€{Math.round(projectionData.y1Total.totalCost).toLocaleString()}</td>
                      <td className={`px-3 py-2.5 text-right ${projectionData.y1Total.netCashFlow < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {projectionData.y1Total.netCashFlow < 0 ? '−' : '+'}€{Math.abs(Math.round(projectionData.y1Total.netCashFlow)).toLocaleString()}
                      </td>
                      <td className={`px-3 py-2.5 text-right ${projectionData.y1Total.cumulative < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {projectionData.y1Total.cumulative < 0 ? '−' : '+'}€{Math.abs(Math.round(projectionData.y1Total.cumulative)).toLocaleString()}
                      </td>
                      <td className={`px-3 py-2.5 text-right ${projectionData.y1Total.cashOnHand < 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {projectionData.y1Total.cashOnHand < 0 ? '−' : ''}€{Math.abs(Math.round(projectionData.y1Total.cashOnHand)).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-left font-sans text-caption text-muted-foreground italic">
                        End of detailed modelled period
                      </td>
                    </tr>

                    {/* --- YEAR 2 HEADER --- */}
                    <tr className="bg-muted/50 border-y border-border">
                      <td colSpan={10} className="px-4 py-2 font-heading font-bold text-badge text-foreground tracking-wider uppercase font-sans">
                        YEAR 2 · PROJECTED
                      </td>
                    </tr>
                    {projectionData.y2Rows.map((row) => (
                      <tr
                        key={row.month}
                        className={`hover:bg-muted/30 transition-colors ${
                          row.isMilestone ? 'bg-primary/5 font-semibold' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 font-bold text-foreground">{row.name}</td>
                        <td className="px-3 py-2.5 text-right text-foreground">{row.subscribers.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                          €{Math.round(row.revenue).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">€{Math.round(row.fixedCost).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">€{Math.round(row.variableCost).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-foreground">€{Math.round(row.totalCost).toLocaleString()}</td>
                        <td className={`px-3 py-2.5 text-right font-medium ${row.netCashFlow < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {row.netCashFlow < 0 ? '−' : '+'}€{Math.abs(Math.round(row.netCashFlow)).toLocaleString()}
                        </td>
                        <td className={`px-3 py-2.5 text-right ${row.cumulative < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {row.cumulative < 0 ? '−' : '+'}€{Math.abs(Math.round(row.cumulative)).toLocaleString()}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-bold ${row.cashOnHand < 0 ? 'text-destructive' : 'text-foreground'}`}>
                          {row.cashOnHand < 0 ? '−' : '+'}€{Math.abs(Math.round(row.cashOnHand)).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-left font-sans text-caption">
                          {row.milestoneTag ? (
                            <Badge variant="outline" className="text-badge font-mono bg-primary/10 text-primary border-primary/20">
                              {row.milestoneTag}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{row.notes}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* --- YEAR 2 SUBTOTAL --- */}
                    <tr className="bg-muted/40 font-bold border-t border-border">
                      <td className="px-4 py-2.5 font-heading text-badge uppercase tracking-wider font-sans">Y2 SUBTOTAL</td>
                      <td className="px-3 py-2.5 text-right">—</td>
                      <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                        €{Math.round(projectionData.y2Total.revenue).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right">€{Math.round(projectionData.y2Total.fixedCost).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right">€{Math.round(projectionData.y2Total.variableCost).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right">€{Math.round(projectionData.y2Total.totalCost).toLocaleString()}</td>
                      <td className={`px-3 py-2.5 text-right ${projectionData.y2Total.netCashFlow < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {projectionData.y2Total.netCashFlow < 0 ? '−' : '+'}€{Math.abs(Math.round(projectionData.y2Total.netCashFlow)).toLocaleString()}
                      </td>
                      <td className={`px-3 py-2.5 text-right ${projectionData.y2Total.cumulative < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {projectionData.y2Total.cumulative < 0 ? '−' : '+'}€{Math.abs(Math.round(projectionData.y2Total.cumulative)).toLocaleString()}
                      </td>
                      <td className={`px-3 py-2.5 text-right ${projectionData.y2Total.cashOnHand < 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {projectionData.y2Total.cashOnHand < 0 ? '−' : '+'}€{Math.abs(Math.round(projectionData.y2Total.cashOnHand)).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-left font-sans text-caption text-muted-foreground italic">
                        Operational profit reached
                      </td>
                    </tr>

                    {/* --- YEAR 3 HEADER --- */}
                    <tr className="bg-muted/50 border-y border-border">
                      <td colSpan={10} className="px-4 py-2 font-heading font-bold text-badge text-foreground tracking-wider uppercase font-sans">
                        YEAR 3 · PROJECTED
                      </td>
                    </tr>
                    {projectionData.y3Rows.map((row) => (
                      <tr
                        key={row.month}
                        className={`hover:bg-muted/30 transition-colors ${
                          row.isMilestone ? 'bg-primary/5 font-semibold' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 font-bold text-foreground">{row.name}</td>
                        <td className="px-3 py-2.5 text-right text-foreground">{row.subscribers.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                          €{Math.round(row.revenue).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">€{Math.round(row.fixedCost).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">€{Math.round(row.variableCost).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-foreground">€{Math.round(row.totalCost).toLocaleString()}</td>
                        <td className={`px-3 py-2.5 text-right font-medium ${row.netCashFlow < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {row.netCashFlow < 0 ? '−' : '+'}€{Math.abs(Math.round(row.netCashFlow)).toLocaleString()}
                        </td>
                        <td className={`px-3 py-2.5 text-right ${row.cumulative < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {row.cumulative < 0 ? '−' : '+'}€{Math.abs(Math.round(row.cumulative)).toLocaleString()}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-bold ${row.cashOnHand < 0 ? 'text-destructive' : 'text-foreground'}`}>
                          {row.cashOnHand < 0 ? '−' : '+'}€{Math.abs(Math.round(row.cashOnHand)).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-left font-sans text-caption">
                          {row.milestoneTag ? (
                            <Badge variant="outline" className="text-badge font-mono bg-primary/10 text-primary border-primary/20">
                              {row.milestoneTag}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{row.notes}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* --- YEAR 3 SUBTOTAL --- */}
                    <tr className="bg-muted/40 font-bold border-t border-border">
                      <td className="px-4 py-2.5 font-heading text-badge uppercase tracking-wider font-sans">Y3 SUBTOTAL</td>
                      <td className="px-3 py-2.5 text-right">—</td>
                      <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                        €{Math.round(projectionData.y3Total.revenue).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right">€{Math.round(projectionData.y3Total.fixedCost).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right">€{Math.round(projectionData.y3Total.variableCost).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right">€{Math.round(projectionData.y3Total.totalCost).toLocaleString()}</td>
                      <td className={`px-3 py-2.5 text-right ${projectionData.y3Total.netCashFlow < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {projectionData.y3Total.netCashFlow < 0 ? '−' : '+'}€{Math.abs(Math.round(projectionData.y3Total.netCashFlow)).toLocaleString()}
                      </td>
                      <td className={`px-3 py-2.5 text-right ${projectionData.y3Total.cumulative < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {projectionData.y3Total.cumulative < 0 ? '−' : '+'}€{Math.abs(Math.round(projectionData.y3Total.cumulative)).toLocaleString()}
                      </td>
                      <td className={`px-3 py-2.5 text-right ${projectionData.y3Total.cashOnHand < 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {projectionData.y3Total.cashOnHand < 0 ? '−' : '+'}€{Math.abs(Math.round(projectionData.y3Total.cashOnHand)).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-left font-sans text-caption text-muted-foreground italic">
                        Full 3-year projection complete
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* ======================================================
                SECTION 6 — Two Cards Side by Side (Break-Even & Unit Economics)
                ====================================================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Break-even analysis */}
              <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-heading font-bold text-foreground">Break-even analysis</h3>
                    <Badge variant="outline" className="text-badge font-mono bg-primary/10 text-primary border-primary/20">
                      Break-even: Month {projectionData.breakEvenMonth}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-caption text-muted-foreground font-sans block">Monthly fixed costs</span>
                      <div className="text-xl font-heading font-bold font-mono text-foreground">
                        €{inputs.opex.toLocaleString()}
                      </div>
                      <span className="text-badge text-muted-foreground font-sans block">Base operating cost</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-caption text-muted-foreground font-sans block">Price per subscriber</span>
                      <div className="text-xl font-heading font-bold font-mono text-foreground">
                        €{inputs.arpu}
                      </div>
                      <span className="text-badge text-muted-foreground font-sans block">Average monthly revenue</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-caption text-muted-foreground font-sans block">Contribution per subscriber</span>
                      <div className="text-xl font-heading font-bold font-mono text-foreground">
                        €{contributionPerSub}
                      </div>
                      <span className="text-badge text-muted-foreground font-sans block">
                        €{inputs.arpu} price − €{inputs.varCost} variable cost
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-caption text-muted-foreground font-sans block">Subscribers needed</span>
                      <div className="text-xl font-heading font-bold font-mono text-foreground">
                        {subsNeeded}
                      </div>
                      <span className="text-badge text-muted-foreground font-sans block">To cover fixed costs</span>
                    </div>
                  </div>

                  <p className="text-body text-muted-foreground font-sans leading-relaxed">
                    Each subscriber leaves €{contributionPerSub} after delivery costs. You need {subsNeeded} of them
                    to cover €{inputs.opex.toLocaleString()} of fixed costs. You pass that point in month{' '}
                    {projectionData.breakEvenMonth} with {projectionData.breakEvenSubs} subscribers.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 font-mono text-caption text-muted-foreground border border-border/70 text-center">
                  €{inputs.opex.toLocaleString()} ÷ €{contributionPerSub} = {(inputs.opex / contributionPerSub).toFixed(1)} → {subsNeeded} subscribers
                </div>
              </Card>

              {/* Right: Unit economics */}
              <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-heading font-bold text-foreground">Unit economics</h3>
                    <Badge
                      variant="outline"
                      className={`text-badge font-mono ${
                        Number(ltvCacRatio) >= 3.0
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {Number(ltvCacRatio) >= 3.0 ? 'Healthy Model' : 'Margin Attention'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-0.5">
                      <span className="text-caption text-muted-foreground font-sans block">CAC</span>
                      <div className="text-lg font-heading font-bold font-mono text-foreground">€{cac}</div>
                      <span className="text-badge text-muted-foreground font-sans block">Marketing ÷ new subs, Y1</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-caption text-muted-foreground font-sans block">LTV</span>
                      <div className="text-lg font-heading font-bold font-mono text-foreground">€{ltv}</div>
                      <span className="text-badge text-muted-foreground font-sans block">
                        €{contributionPerSub} ÷ {inputs.churn}% churn
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-caption text-muted-foreground font-sans">LTV / CAC</span>
                        <span className={`text-badge font-mono ${Number(ltvCacRatio) >= 3.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} font-bold`}>
                          {Number(ltvCacRatio) >= 3.0 ? 'Healthy' : 'Caution'}
                        </span>
                      </div>
                      <div className={`text-lg font-heading font-bold font-mono ${Number(ltvCacRatio) >= 3.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {ltvCacRatio}x
                      </div>
                      <span className="text-badge text-muted-foreground font-sans block">Target: &gt; 3.0x</span>
                    </div>

                    <div className="space-y-0.5 pt-2">
                      <span className="text-caption text-muted-foreground font-sans block">Payback</span>
                      <div className="text-lg font-heading font-bold font-mono text-foreground">{paybackMonths} mo</div>
                      <span className="text-badge text-muted-foreground font-sans block">Time to earn back CAC</span>
                    </div>

                    <div className="space-y-0.5 pt-2">
                      <span className="text-caption text-muted-foreground font-sans block">Gross margin</span>
                      <div className="text-lg font-heading font-bold font-mono text-foreground">{grossMarginPct}%</div>
                      <span className="text-badge text-muted-foreground font-sans block">After variable costs</span>
                    </div>

                    <div className="space-y-0.5 pt-2">
                      <span className="text-caption text-muted-foreground font-sans block">Burn at launch</span>
                      <div className="text-lg font-heading font-bold font-mono text-destructive">
                        €{Math.abs(month1NetLoss).toLocaleString()}
                      </div>
                      <span className="text-badge text-muted-foreground font-sans block">Month one net loss</span>
                    </div>
                  </div>

                  <p className="text-body text-muted-foreground font-sans leading-relaxed">
                    Your unit economics are exceptionally resilient, driven by a high gross margin ({grossMarginPct}%) and manageable customer acquisition cost.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 font-sans text-caption text-muted-foreground border border-border/70">
                  {Number(ltvCacRatio) >= 3.0
                    ? `Target threshold of 3.0x LTV/CAC achieved with sustainable payback within ${paybackMonths} months.`
                    : `LTV/CAC ratio is currently ${ltvCacRatio}x (target > 3.0x) with payback within ${paybackMonths} months.`}
                </div>
              </Card>
            </div>

            {/* ======================================================
                SECTION 7 — Key Model Assumptions & Risk Assessment
                ====================================================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Key model assumptions */}
              <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-heading font-bold text-foreground">Key model assumptions</h3>
                <div className="space-y-3 font-sans">
                  {output?.assumptions && output.assumptions.length > 0 ? (
                    output.assumptions.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/60">
                        <span className="text-body text-foreground">{item}</span>
                        <Badge variant="outline" className="text-badge font-mono bg-primary/10 text-primary border-primary/20 shrink-0">
                          AI SYNTHESIS
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/60">
                        <span className="text-body text-foreground">{inputs.launchSubs} subscribers at launch</span>
                        <Badge variant="outline" className="text-badge font-mono bg-muted text-muted-foreground">
                          YOUR INPUT
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/60">
                        <span className="text-body text-foreground">
                          {inputs.growth}% new subscribers and {inputs.churn}% churn each month — {inputs.growth - inputs.churn}% net growth
                        </span>
                        <Badge variant="outline" className="text-badge font-mono bg-muted text-muted-foreground">
                          YOUR INPUT
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/60">
                        <span className="text-body text-foreground">€{inputs.arpu} average price per subscriber</span>
                        <Badge variant="outline" className="text-badge font-mono bg-primary/10 text-primary border-primary/20">
                          FROM 3.2
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/60">
                        <span className="text-body text-foreground">€{inputs.varCost} delivery and logistics cost per subscriber</span>
                        <Badge variant="outline" className="text-badge font-mono bg-muted text-muted-foreground">
                          YOUR INPUT
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/60">
                        <span className="text-body text-foreground">€{inputs.opex.toLocaleString()} fixed costs, flat for 36 months</span>
                        <Badge variant="outline" className="text-badge font-mono bg-muted text-muted-foreground">
                          YOUR INPUT
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/60">
                        <span className="text-body text-foreground">Months 13–36 extend the first-year trend</span>
                        <Badge variant="outline" className="text-badge font-mono bg-muted text-muted-foreground">
                          MODEL
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-body text-foreground">Excludes future funding rounds and large one-off purchases</span>
                        <Badge variant="outline" className="text-badge font-mono bg-muted text-muted-foreground">
                          MODEL
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Right: Risk assessment */}
              <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-heading font-bold text-foreground">Risk assessment</h3>
                <div className="space-y-3 font-sans">
                  {output?.risks && output.risks.length > 0 ? (
                    output.risks.map((risk, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-caption font-semibold text-foreground">
                            {idx + 1}. {risk.category || 'Identified Risk'}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-badge font-mono ${
                              risk.impact === 'High' || risk.likelihood === 'High'
                                ? 'bg-destructive/15 text-destructive border-destructive/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {risk.impact || risk.likelihood || 'Medium'}
                          </Badge>
                        </div>
                        <p className="text-body text-muted-foreground leading-relaxed">
                          {risk.description}
                        </p>
                        {risk.mitigation && (
                          <p className="text-caption text-primary/90 font-medium pt-1">
                            <span className="font-semibold text-foreground">Mitigation: </span>
                            {risk.mitigation}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <>
                      {/* Risk 1 */}
                      <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-caption font-semibold text-foreground">1. Funding risk</span>
                          <Badge
                            variant="outline"
                            className={`text-badge font-mono ${
                              projectionData.fundingGap > 0
                                ? 'bg-destructive/15 text-destructive border-destructive/30'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {projectionData.fundingGap > 0 ? 'High' : 'Low'}
                          </Badge>
                        </div>
                        <p className="text-body text-muted-foreground leading-relaxed">
                          {projectionData.fundingGap > 0 && projectionData.budgetRunsOutMonth
                            ? `Your budget runs out in month ${projectionData.budgetRunsOutMonth} and cash stays negative until month ${projectionData.cashPositiveMonth || 36}. You'll need about €${projectionData.fundingGap.toLocaleString()} more.`
                            : `Your €${inputs.budget.toLocaleString()} starting budget provides sufficient runway with no projected cash deficit.`}
                        </p>
                      </div>

                      {/* Risk 2 */}
                      <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-caption font-semibold text-foreground">2. Growth shortfall</span>
                          <Badge variant="outline" className="text-badge font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                            Medium
                          </Badge>
                        </div>
                        <p className="text-body text-muted-foreground leading-relaxed">
                          If net growth falls from {inputs.growth - inputs.churn}% to {Math.max(1, inputs.growth - inputs.churn - 2)}%, break-even moves 3 months later, to month {projectionData.breakEvenMonth + 3}.
                        </p>
                      </div>

                      {/* Risk 3 */}
                      <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-caption font-semibold text-foreground">3. Subscriber retention</span>
                          <Badge variant="outline" className="text-badge font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                            Medium
                          </Badge>
                        </div>
                        <p className="text-body text-muted-foreground leading-relaxed">
                          If churn rises from {inputs.churn}% to {inputs.churn + 3}%, break-even moves 6 months later, to month {projectionData.breakEvenMonth + 6}.
                        </p>
                      </div>

                      {/* Risk 4 */}
                      <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-caption font-semibold text-foreground">4. Delivery cost</span>
                          <Badge variant="outline" className="text-badge font-mono bg-muted text-muted-foreground border-border">
                            Low
                          </Badge>
                        </div>
                        <p className="text-body text-muted-foreground leading-relaxed">
                          €{inputs.varCost} per subscriber is a conservative estimate. At €{Math.max(1, inputs.varCost - 1)}, break-even comes one month earlier, in month {projectionData.breakEvenMonth - 1}.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* ======================================================
                SECTION 8 — Milestones Complete & Footer Navigation
                ====================================================== */}
            <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-badge font-sans font-bold uppercase tracking-wider text-muted-foreground">
                  MILESTONES COMPLETE
                </span>
                <span className="text-badge font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Step complete (6/6)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
                {[
                  'Revenue saved',
                  'Cost saved',
                  '36-mo forecast',
                  'Cash flow',
                  'Break-even',
                  'Scenario saved',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-caption text-foreground font-sans">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Bottom Footer Actions (Figma Exact) */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => router.push(withIdeaContext('/dashboard/creator/phase-3/business-model', ideaId))}
                className="gap-2 text-button font-medium font-sans text-muted-foreground hover:text-foreground rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" /> Business Model
              </Button>

              <Button
                onClick={handleNext}
                className="gap-2 text-button font-medium font-sans rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 h-11 px-6"
              >
                <span>Continue to Legal &amp; Compliance</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Phase3SetupShell>
    </>
  );
}
