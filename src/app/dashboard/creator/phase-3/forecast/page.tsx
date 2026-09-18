'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
  RotateCw,
  FileWarning,
  FileDown,
  BarChart3,
  Table as TableIcon,
  CheckCircle2,
  CircleDashed,
  ListChecks,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import PlanForecastPrintView from '@/components/creator/PlanForecastPrintView';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import {
  useForecastSessionTimed,
  useBusinessPlanSessionTimed,
  useAiCredits,
  useStartForecast,
} from '@/hooks/queries/creator-ai';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { toAiError, type AiError } from '@/lib/ai-errors';
import { formatMoney } from '@/lib/format-money';
import { hasAiOutput, type ForecastOutput, type BusinessPlanOutput } from '@/types/creator/ai';

const fmt = (n?: number | null, currency = 'EUR') => formatMoney(n, currency);

function toChartData(output?: ForecastOutput) {
  const rev = output?.revenueForecast?.monthly ?? [];
  const cost = output?.costForecast?.monthly ?? [];
  const cash = output?.cashFlowProjection?.monthly ?? [];
  const months = Math.max(rev.length, cost.length, cash.length);
  return Array.from({ length: months }, (_, i) => ({
    name: `M${i + 1}`,
    monthNum: i + 1,
    Revenue: rev[i]?.amount ?? 0,
    Cost: cost[i] != null ? (cost[i].fixedCosts ?? 0) + (cost[i].variableCosts ?? 0) : 0,
    FixedCost: cost[i]?.fixedCosts ?? 0,
    VarCost: cost[i]?.variableCosts ?? 0,
    NetCashFlow: cash[i]?.netCashFlow ?? 0,
    EndingBalance: cash[i]?.endingBalance ?? 0,
  }));
}

function inputWarnings(arpu: number, opex: number, growth: number, churn: number) {
  const w: string[] = [];
  if (arpu > 0 && opex > 0 && arpu < opex / 10) {
    w.push('Tight unit economics: ARPU is low relative to baseline OPEX.');
  }
  if (growth > 30) {
    w.push('Aggressive growth: >30% MoM is difficult to sustain indefinitely — sanity-check market capacity.');
  }
  if (churn > 11) {
    w.push('High churn (>11%/mo) pushes LTV/CAC below the healthy 3× threshold and weakens investor readiness.');
  }
  return w;
}

const likelihoodVariant = (v?: string) => {
  const s = v?.toLowerCase();
  if (s === 'high') return 'bg-destructive/15 text-destructive border-destructive/30';
  if (s === 'medium') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  return 'bg-muted text-muted-foreground border-border';
};

export default function ForecastPage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();

  const [loadingJourney, setLoadingJourney] = useState(true);
  const [forecastSessionId, setForecastSessionId] = useState<string | null>(null);
  const [businessPlanSessionId, setBusinessPlanSessionId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showAssumptionsEditor, setShowAssumptionsEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'charts' | 'table' | 'model'>('charts');
  const [project, setProject] = useState({ name: '', problem: '', solution: '', targetUser: '' });
  const [cross, setCross] = useState({ youNeed: [] as string[], seedAsk: null as number | null });

  const [inputs, setInputs] = useState({
    arpu: 49,
    opex: 8000,
    growth: 12,
    tam: 50_000_000,
    churn: 5,
  });
  const [startError, setStartError] = useState<AiError | null>(null);

  const startForecast = useStartForecast();
  const credits = useAiCredits();
  const isCostLoading = credits.isLoading;
  const isCostError = credits.isError || (!isCostLoading && credits.data?.costs?.Forecast == null);
  const forecastCost = credits.data?.costs?.Forecast ?? null;
  const insufficientCredits = credits.data != null && forecastCost != null ? credits.data.balance < forecastCost : false;

  const session = useForecastSessionTimed(forecastSessionId);
  const planSession = useBusinessPlanSessionTimed(businessPlanSessionId);
  const planOutput = (planSession.data as { output?: BusinessPlanOutput } | undefined)?.output ?? null;

  const sessionInputs = (session.data as {
    inputs?: { arpu?: number | null; opex?: number | null; monthlyGrowthPct?: number | null; tam?: number | null; monthlyChurnPct?: number | null } | null;
  } | undefined)?.inputs ?? null;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get();
        const p3 = journey.phase3Data as {
          forecastSessionId?: string;
          businessPlanSessionId?: string;
          formationGenerator?: { youNeed?: { label: string }[] };
        };
        const p5 = journey.phase5Data as { pathB?: { seedFunding?: { totalAsk?: number } } };
        if (!active) return;
        setForecastSessionId(p3?.forecastSessionId ?? null);
        setBusinessPlanSessionId(p3?.businessPlanSessionId ?? null);
        setProject({
          name: journey.project?.name ?? '',
          problem: journey.project?.problem ?? '',
          solution: journey.project?.solution ?? '',
          targetUser: journey.project?.targetUser ?? '',
        });
        setCross({
          youNeed: (p3?.formationGenerator?.youNeed ?? []).map((n) => n.label),
          seedAsk: p5?.pathB?.seedFunding?.totalAsk ?? null,
        });
      } finally {
        if (active) setLoadingJourney(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !sessionInputs) return;
    seededRef.current = true;
    setInputs((prev) => ({
      arpu: sessionInputs.arpu ?? prev.arpu,
      opex: sessionInputs.opex ?? prev.opex,
      growth: sessionInputs.monthlyGrowthPct ?? prev.growth,
      tam: sessionInputs.tam ?? prev.tam,
      churn: sessionInputs.monthlyChurnPct ?? prev.churn,
    }));
  }, [sessionInputs]);

  const output = (session.data as { output?: ForecastOutput } | undefined)?.output;
  const completed =
    session.phase === 'terminal' &&
    hasAiOutput((session.data as { status?: import('@/types/creator/ai').AiSessionStatus })?.status) &&
    !!output;

  const fcError = (session.data as { error?: string | null } | undefined)?.error ?? null;
  const terminalFailed = !!forecastSessionId && session.phase === 'terminal' && !completed;
  const failedIsProviderBilling = /openrouter error \(402\)/i.test(fcError ?? '');
  const failedIsCredits = !failedIsProviderBilling && /402|credit|insufficient|payment/i.test(fcError ?? '');

  const chartData = useMemo(() => toChartData(output), [output]);
  const rev = output?.revenueForecast;
  const cost = output?.costForecast;
  const cash = output?.cashFlowProjection;
  const be = output?.breakEvenAnalysis;

  const month36Revenue = output?.revenueForecast?.monthly?.[35]?.amount ?? 0;
  const year3Arr = month36Revenue * 12;
  const month36Cash = output?.cashFlowProjection?.monthly?.[35]?.endingBalance ?? 0;
  const breakEvenMonth =
    be?.isAchievedWithinHorizon && typeof be.breakEvenMonth === 'number' ? be.breakEvenMonth : null;

  const warnings = inputWarnings(inputs.arpu, inputs.opex, inputs.growth, inputs.churn);

  const handleGenerate = async () => {
    setStartError(null);
    if (!businessPlanSessionId) {
      setStartError({ kind: 'other', message: 'Generate your Business Plan first — the forecast builds on it.' });
      return;
    }
    try {
      const res = await startForecast.mutateAsync({
        businessPlanSessionId,
        arpu: inputs.arpu,
        opex: inputs.opex,
        monthlyGrowthPct: inputs.growth,
        tam: inputs.tam,
        monthlyChurnPct: inputs.churn,
      });
      await creatorJourneyApi.setPhase3Session('forecast', res.sessionId);
      setForecastSessionId(res.sessionId);
      setShowAssumptionsEditor(false);
    } catch (e) {
      setStartError(toAiError(e, 'Could not start the forecast simulation.'));
    }
  };

  const handleNext = () => {
    completeStep(3, 4);
    router.push('/dashboard/creator/phase-3/compliance');
  };

  return (
    <>
      <PlanForecastPrintView
        open={showExport}
        onClose={() => setShowExport(false)}
        projectName={project.name}
        project={project}
        plan={planOutput}
        forecast={output ?? null}
        forecastInputs={sessionInputs ?? inputs}
        cross={cross}
      />

      <Phase3SetupShell
        fullWidth
        stepEyebrow="Step 3.4"
        title="Financial Projections & Simulations"
        description="Unified 36-month financial model. Adjust key assumptions and re-simulate, or explore detailed projections and break-even trajectories."
      >
        {loadingJourney && (
          <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center font-sans">
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading financial workspace…
          </div>
        )}

        {/* No Forecast Session Created Yet: Initial Interactive Setup */}
        {!loadingJourney && !forecastSessionId && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" /> Initialize Model
                </div>
                <h2 className="text-xl font-bold font-sans tracking-tight">Configure Model Assumptions</h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
                  Establish your baseline unit economics, monthly burn, growth rate, and total addressable market. We will compute a 36-month multi-year financial simulation for your venture.
                </p>
              </div>

              {/* Input Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="text-xs font-semibold font-sans space-y-1.5">
                  <span className="text-foreground">Average Revenue Per User / Mo (€)</span>
                  <input
                    type="number"
                    min={1}
                    value={inputs.arpu}
                    onChange={(e) => setInputs((s) => ({ ...s, arpu: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="49"
                  />
                  <span className="text-body font-normal text-muted-foreground block">Target blended ARPU / seat price.</span>
                </label>

                <label className="text-xs font-semibold font-sans space-y-1.5">
                  <span className="text-foreground">Baseline OPEX / Mo (€)</span>
                  <input
                    type="number"
                    min={100}
                    value={inputs.opex}
                    onChange={(e) => setInputs((s) => ({ ...s, opex: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="8000"
                  />
                  <span className="text-body font-normal text-muted-foreground block">Initial fixed team &amp; infrastructure costs.</span>
                </label>

                <label className="text-xs font-semibold font-sans space-y-1.5">
                  <span className="text-foreground">Monthly Growth Rate (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={inputs.growth}
                    onChange={(e) => setInputs((s) => ({ ...s, growth: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="12"
                  />
                  <span className="text-body font-normal text-muted-foreground block">Target MoM compounded user/revenue expansion.</span>
                </label>

                <label className="text-xs font-semibold font-sans space-y-1.5">
                  <span className="text-foreground">Monthly Churn (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={inputs.churn}
                    onChange={(e) => setInputs((s) => ({ ...s, churn: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="5"
                  />
                  <span className="text-body font-normal text-muted-foreground block">Expected monthly customer/revenue attrition.</span>
                </label>

                <label className="text-xs font-semibold font-sans space-y-1.5 sm:col-span-2">
                  <span className="text-foreground">Total Addressable Market — TAM (€)</span>
                  <input
                    type="number"
                    min={10000}
                    value={inputs.tam}
                    onChange={(e) => setInputs((s) => ({ ...s, tam: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="50000000"
                  />
                  <span className="text-body font-normal text-muted-foreground block">Total annual market size for sizing ceilings.</span>
                </label>
              </div>

              {/* Live Assumption Warnings */}
              {warnings.length > 0 && (
                <div className="space-y-2 pt-1">
                  {warnings.map((wn) => (
                    <div key={wn} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-sans">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <span>{wn}</span>
                    </div>
                  ))}
                </div>
              )}

              {startError && (
                <Alert variant={startError.kind === 'service' || startError.kind === 'rateLimited' ? 'default' : 'destructive'} className="rounded-xl">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex flex-col items-start gap-2 font-sans text-xs">
                    <span>{startError.message}</span>
                    {(startError.kind === 'service' || startError.kind === 'rateLimited') && (
                      <Button variant="outline" size="sm" onClick={handleGenerate} disabled={startForecast.isPending} className="gap-1.5 text-xs">
                        <RotateCw className="h-3.5 w-3.5" /> Try again
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => router.push('/dashboard/creator/phase-3/business-plan')} className="text-xs font-medium font-sans">
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Business Plan
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={startForecast.isPending || !businessPlanSessionId || insufficientCredits || isCostLoading || isCostError}
                  className="gap-2 font-sans font-semibold rounded-xl"
                >
                  {startForecast.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  {isCostLoading
                    ? 'Loading cost…'
                    : isCostError
                    ? 'Cost unavailable'
                    : `Generate 36-Month Forecast (${forecastCost} credits)`}
                </Button>
              </div>

              {insufficientCredits && forecastCost != null && (
                <p className="text-xs font-medium text-destructive font-sans text-right">
                  Insufficient credits: requires {forecastCost} credits (balance: {credits.data?.balance ?? 0}).
                </p>
              )}
            </Card>
          </div>
        )}

        {/* Polling / Generating State */}
        {forecastSessionId && session.phase === 'polling' && (
          <div className="space-y-6">
            <Card className="rounded-2xl border border-border bg-card p-8 text-center space-y-4 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base font-sans">Simulating 36-Month Projections…</h3>
                <p className="text-xs text-muted-foreground font-sans">
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
          <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-4 max-w-xl mx-auto font-sans">
            <div className="flex items-center gap-2 text-destructive font-bold text-sm">
              <AlertTriangle className="h-4 w-4" /> Forecast generation was interrupted
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {failedIsProviderBilling
                ? 'AI synthesis is temporarily unavailable due to upstream provider billing. Your plan is safe.'
                : failedIsCredits
                ? 'You do not have enough credits to generate this forecast.'
                : fcError || 'The forecast job did not complete successfully. You can retry with the same or modified inputs.'}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" onClick={handleGenerate} disabled={startForecast.isPending} className="gap-1.5 text-xs font-semibold rounded-xl">
                <RotateCw className="h-3.5 w-3.5" /> Re-run Simulation
              </Button>
            </div>
          </Card>
        )}

        {/* Completed Unified Workspace */}
        {completed && output && (
          <div className="space-y-8">
            {/* Top Bar: Model Meta & Export Action */}
            <Card className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                      36-Month Horizon
                    </span>
                    <Badge variant="outline" className="text-badge font-sans font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Multi-Year Active Model
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Deterministic simulation based on {inputs.growth}% MoM expansion, €{inputs.arpu} ARPU, and €{inputs.opex.toLocaleString()}/mo OPEX.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssumptionsEditor((v) => !v)}
                    className="gap-1.5 font-sans text-xs font-semibold rounded-xl"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    {showAssumptionsEditor ? 'Hide Assumptions' : 'Adjust Assumptions'}
                    {showAssumptionsEditor ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExport(true)}
                    className="gap-1.5 font-sans text-xs font-semibold rounded-xl"
                  >
                    <FileDown className="h-3.5 w-3.5" /> Export PDF
                  </Button>
                </div>
              </div>

              {/* Expandable Interactive Assumptions Editor */}
              {showAssumptionsEditor && (
                <div className="mt-4 pt-4 border-t border-border/70 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" /> Live Simulation Parameters
                    </h4>
                    <span className="text-body text-muted-foreground font-sans">
                      Modifying values will re-simulate a fresh 36-month trajectory
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    <label className="text-xs font-medium font-sans space-y-1">
                      <span className="text-muted-foreground">ARPU (€/mo)</span>
                      <input
                        type="number"
                        min={1}
                        value={inputs.arpu}
                        onChange={(e) => setInputs((s) => ({ ...s, arpu: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="49"
                      />
                    </label>

                    <label className="text-xs font-medium font-sans space-y-1">
                      <span className="text-muted-foreground">OPEX (€/mo)</span>
                      <input
                        type="number"
                        min={100}
                        value={inputs.opex}
                        onChange={(e) => setInputs((s) => ({ ...s, opex: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="8000"
                      />
                    </label>

                    <label className="text-xs font-medium font-sans space-y-1">
                      <span className="text-muted-foreground">Growth (%/mo)</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={inputs.growth}
                        onChange={(e) => setInputs((s) => ({ ...s, growth: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="12"
                      />
                    </label>

                    <label className="text-xs font-medium font-sans space-y-1">
                      <span className="text-muted-foreground">Churn (%/mo)</span>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={inputs.churn}
                        onChange={(e) => setInputs((s) => ({ ...s, churn: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="5"
                      />
                    </label>

                    <label className="text-xs font-medium font-sans space-y-1">
                      <span className="text-muted-foreground">Horizon (Mo)</span>
                      <input
                        type="number"
                        disabled
                        value={36}
                        className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-sm font-mono opacity-80 cursor-not-allowed"
                      />
                    </label>
                  </div>

                  {warnings.length > 0 && (
                    <div className="space-y-1.5">
                      {warnings.map((wn) => (
                        <div key={wn} className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-sans">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>{wn}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-muted-foreground font-sans">
                      {startError && <span className="text-destructive font-medium">{startError.message}</span>}
                    </div>
                    <Button
                      size="sm"
                      onClick={handleGenerate}
                      disabled={startForecast.isPending || insufficientCredits}
                      className="gap-1.5 text-xs font-semibold rounded-xl"
                    >
                      {startForecast.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
                      Re-run Simulation {(forecastCost ?? 0) > 0 ? `(${forecastCost} credits)` : ''}
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Top KPI Metrics Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">Year 3 ARR</span>
                  <Badge variant="outline" className="text-badge font-mono">M36 Run-Rate</Badge>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                  {fmt(year3Arr, rev?.currency)}
                </div>
                <p className="text-body text-muted-foreground font-sans">
                  Annualized run-rate at month 36 (€{Math.round(month36Revenue).toLocaleString()}/mo).
                </p>
              </Card>

              <Card className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">Break-Even Point</span>
                  {breakEvenMonth ? (
                    <Badge variant="outline" className="text-badge font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      Achieved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-badge font-mono text-amber-600 dark:text-amber-400 border-amber-500/30">
                      In Horizon
                    </Badge>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                  {breakEvenMonth ? `Month ${breakEvenMonth}` : '> 36 Months'}
                </div>
                <p className="text-body text-muted-foreground font-sans">
                  {breakEvenMonth ? `Crosses cumulative break-even in Year ${Math.ceil(breakEvenMonth / 12)}.` : 'Requires additional scale to achieve positive monthly cash flow.'}
                </p>
              </Card>

              <Card className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">Month 36 Balance</span>
                  <Badge variant="outline" className="text-badge font-mono">Net Runway</Badge>
                </div>
                <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${month36Cash < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {fmt(month36Cash, cash?.currency)}
                </div>
                <p className="text-body text-muted-foreground font-sans">
                  Cumulative liquidity position across the modeled 3-year timeline.
                </p>
              </Card>

              <Card className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">Unit Economics</span>
                  <Badge variant="outline" className="text-badge font-mono">Target</Badge>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                  €{inputs.arpu} <span className="text-xs font-sans text-muted-foreground font-normal">/ {inputs.churn}% churn</span>
                </div>
                <p className="text-body text-muted-foreground font-sans">
                  Blended user ARPU with estimated {inputs.churn}% monthly attrition.
                </p>
              </Card>
            </div>

            {/* Projections View Switcher Tabs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeTab === 'charts' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('charts')}
                    className="gap-1.5 text-xs font-semibold font-sans rounded-xl"
                  >
                    <BarChart3 className="h-3.5 w-3.5" /> Trajectory Charts
                  </Button>
                  <Button
                    variant={activeTab === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('table')}
                    className="gap-1.5 text-xs font-semibold font-sans rounded-xl"
                  >
                    <TableIcon className="h-3.5 w-3.5" /> 36-Month Data Table
                  </Button>
                  <Button
                    variant={activeTab === 'model' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('model')}
                    className="gap-1.5 text-xs font-semibold font-sans rounded-xl"
                  >
                    <ListChecks className="h-3.5 w-3.5" /> Logic &amp; Risk Matrix
                  </Button>
                </div>

                <span className="text-badge font-mono text-muted-foreground hidden sm:inline">
                  36 Data Points Modeled
                </span>
              </div>

              {/* View 1: Recharts Visualizations */}
              {activeTab === 'charts' && (
                <div className="space-y-6">
                  {/* Revenue vs Total Costs Trajectory Chart */}
                  <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold font-sans">Revenue vs. Cost Structure (36 Months)</h3>
                        <p className="text-xs text-muted-foreground font-sans">
                          Monthly revenue growth vs fixed &amp; variable operational expenditures.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" /> Revenue
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-destructive inline-block" /> Total Costs
                        </span>
                      </div>
                    </div>

                    <div className="h-[320px] w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'monospace' }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis
                            tick={{ fontSize: 11, fontFamily: 'monospace' }}
                            stroke="hsl(var(--muted-foreground))"
                            tickFormatter={(val) => `€${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '0.75rem',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                            }}
                            formatter={(value: any, name: any) => [
                              fmt(typeof value === 'number' ? value : Number(value) || 0, rev?.currency),
                              String(name ?? ''),
                            ]}
                          />
                          <Area type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                          <Area type="monotone" dataKey="Cost" stroke="hsl(var(--destructive))" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Cash Flow & Cumulative Balance Chart */}
                  <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold font-sans">Monthly Net Cash Flow &amp; Ending Balance</h3>
                        <p className="text-xs text-muted-foreground font-sans">
                          Net liquidity trajectory and cumulative cash reserves over time.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Net Cash Flow
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-sky-500 inline-block" /> Ending Balance
                        </span>
                      </div>
                    </div>

                    <div className="h-[280px] w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'monospace' }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis
                            tick={{ fontSize: 11, fontFamily: 'monospace' }}
                            stroke="hsl(var(--muted-foreground))"
                            tickFormatter={(val) => `€${Math.round(val / 1000)}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '0.75rem',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                            }}
                            formatter={(value: any, name: any) => [
                              fmt(typeof value === 'number' ? value : Number(value) || 0, cash?.currency),
                              String(name ?? ''),
                            ]}
                          />
                          <Bar dataKey="NetCashFlow" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              )}

              {/* View 2: Full 36-Month Consolidated Data Table */}
              {activeTab === 'table' && (
                <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-border/70 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold font-sans">36-Month Projections Table</h3>
                      <p className="text-xs text-muted-foreground font-sans">
                        Full monthly breakdown of revenues, fixed/variable costs, net cash flow, and cumulative balance.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-sans">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                          <th className="px-4 py-3 text-left font-mono">Month</th>
                          <th className="px-4 py-3 text-right">Revenue</th>
                          <th className="px-4 py-3 text-right">Fixed Costs</th>
                          <th className="px-4 py-3 text-right">Variable Costs</th>
                          <th className="px-4 py-3 text-right font-bold text-foreground">Total Cost</th>
                          <th className="px-4 py-3 text-right">Net Cash Flow</th>
                          <th className="px-4 py-3 text-right font-bold text-foreground">Ending Balance</th>
                          <th className="px-4 py-3 text-left">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono">
                        {chartData.map((row, i) => {
                          const note = rev?.monthly?.[i]?.notes ?? cost?.monthly?.[i]?.notes ?? cash?.monthly?.[i]?.notes ?? '';
                          return (
                            <tr key={i} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-2.5 font-bold text-foreground">{row.name}</td>
                              <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                                {fmt(row.Revenue, rev?.currency)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-muted-foreground">
                                {fmt(row.FixedCost, cost?.currency)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-muted-foreground">
                                {fmt(row.VarCost, cost?.currency)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                                {fmt(row.Cost, cost?.currency)}
                              </td>
                              <td className={`px-4 py-2.5 text-right font-medium ${row.NetCashFlow < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {fmt(row.NetCashFlow, cash?.currency)}
                              </td>
                              <td className={`px-4 py-2.5 text-right font-bold ${row.EndingBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                                {fmt(row.EndingBalance, cash?.currency)}
                              </td>
                              <td className="px-4 py-2.5 text-left text-body font-sans text-muted-foreground truncate max-w-[200px]">
                                {note || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* View 3: Break-Even, Assumptions & Risk Matrix */}
              {activeTab === 'model' && (
                <div className="space-y-6">
                  {/* Break-Even Deep Dive Card */}
                  {be && (
                    <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {breakEvenMonth ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <CircleDashed className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          )}
                          <h3 className="text-base font-bold font-sans">Break-Even Analysis</h3>
                        </div>
                        {breakEvenMonth ? (
                          <Badge variant="outline" className="text-xs font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            Break-Even Month {breakEvenMonth}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-mono text-amber-600 dark:text-amber-400 border-amber-500/30">
                            Beyond Horizon
                          </Badge>
                        )}
                      </div>

                      {be.summary && (
                        <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed bg-muted/30 p-3.5 rounded-xl">
                          {be.summary}
                        </p>
                      )}
                    </Card>
                  )}

                  {/* Two Column: Assumptions & Risks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assumptions List */}
                    {!!output.assumptions?.length && (
                      <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <ListChecks className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-bold font-sans">Underlying Model Assumptions</h3>
                        </div>
                        <ul className="space-y-2.5">
                          {output.assumptions.map((a, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground font-sans">
                              <span className="font-mono text-primary font-bold">{i + 1}.</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {/* Risks Register */}
                    {!!output.risks?.length && (
                      <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-destructive" />
                          <h3 className="text-sm font-bold font-sans">Financial Risk Matrix</h3>
                        </div>
                        <div className="space-y-3">
                          {output.risks.map((r, i) => (
                            <div key={i} className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-1.5 font-sans">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">{r.category ?? 'Financial Risk'}</span>
                                {r.likelihood && (
                                  <Badge variant="outline" className={`text-badge font-mono ${likelihoodVariant(r.likelihood)}`}>
                                    {r.likelihood} Likelihood
                                  </Badge>
                                )}
                              </div>
                              {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                              {r.mitigation && (
                                <p className="text-body text-muted-foreground bg-muted/40 p-2 rounded mt-1 font-sans">
                                  <strong className="text-foreground">Mitigation:</strong> {r.mitigation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Step Navigation Bar */}
            <div className="flex items-center justify-between gap-4 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/creator/phase-3/business-plan')}
                className="text-xs font-medium font-sans text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Business Plan
              </Button>
              <Button onClick={handleNext} className="gap-2 font-sans font-semibold rounded-xl">
                Proceed to Legal &amp; Compliance <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Phase3SetupShell>
    </>
  );
}
