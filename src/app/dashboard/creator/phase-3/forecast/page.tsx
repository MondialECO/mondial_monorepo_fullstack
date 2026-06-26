'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ArrowLeft, ArrowRight, Loader2, AlertTriangle, RotateCw, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ForecastView } from '@/components/creator/ai/ForecastView';
import { useForecastSessionTimed, useStartForecast } from '@/hooks/queries/creator-ai';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import { toAiError, type AiError } from '@/lib/ai-errors';
import { hasAiOutput, type ForecastOutput } from '@/types/creator/ai';

// Recharts series from the live monthly arrays — null-safe per the audit note.
function toChartData(output?: ForecastOutput) {
  const rev = output?.revenueForecast?.monthly ?? [];
  const cost = output?.costForecast?.monthly ?? [];
  const cash = output?.cashFlowProjection?.monthly ?? [];
  const months = Math.max(rev.length, cost.length, cash.length);
  return Array.from({ length: months }, (_, i) => ({
    name: `M${i + 1}`,
    Revenue: rev[i]?.amount ?? null,
    Cost: cost[i] != null ? (cost[i].fixedCosts ?? 0) + (cost[i].variableCosts ?? 0) : null,
    Cashflow: cash[i]?.netCashFlow ?? null,
  }));
}

// Non-blocking input-validation warnings.
function inputWarnings(arpu: number, opex: number, growth: number, tam: number, year3Arr: number, churn: number) {
  const w: string[] = [];
  if (arpu > 0 && opex > 0 && arpu < opex / 10) w.push('Tight unit economics: ARPU is low relative to OPEX.');
  if (growth > 30) w.push('Aggressive growth: >30% MoM is hard to sustain — sanity-check assumptions.');
  if (tam > 0 && year3Arr > 0 && tam < year3Arr * 100) w.push('Small TAM relative to your Year-3 ARR target.');
  // ~11%/mo churn is where LTV/CAC crosses the healthy 3× bar (CreatorScoring).
  if (churn > 11) w.push('High churn (>11%/mo) pushes LTV/CAC below the healthy 3× bar — it weakens your readiness Financial score.');
  return w;
}

export default function ForecastResultsPage() {
  const router = useRouter();

  const [loadingJourney, setLoadingJourney] = useState(true);
  const [forecastSessionId, setForecastSessionId] = useState<string | null>(null);
  const [businessPlanSessionId, setBusinessPlanSessionId] = useState<string | null>(null);
  const [inputs, setInputs] = useState({ arpu: 49, opex: 8000, growth: 12, tam: 50_000_000, churn: 5 });
  const [startError, setStartError] = useState<AiError | null>(null);

  const startForecast = useStartForecast();
  const session = useForecastSessionTimed(forecastSessionId);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get();
        const p3 = journey.phase3Data as { forecastSessionId?: string; businessPlanSessionId?: string };
        if (!active) return;
        setForecastSessionId(p3?.forecastSessionId ?? null);
        setBusinessPlanSessionId(p3?.businessPlanSessionId ?? null);
      } finally {
        if (active) setLoadingJourney(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Forecast (step 3) consumes the business plan (step 2). The plan provides revenue
  // model + market context; the numeric inputs (ARPU/OPEX/growth/TAM) are still sent.
  // The guard below is now CORRECT because the plan genuinely precedes the forecast.
  const handleStart = async () => {
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
    } catch (e) {
      // 402 (your credits are out) vs 503 (provider issue) read differently to the user.
      setStartError(toAiError(e, 'Could not start the forecast.'));
    }
  };

  const output = (session.data as { output?: ForecastOutput } | undefined)?.output;
  const completed = session.phase === 'terminal' && hasAiOutput((session.data as { status?: import('@/types/creator/ai').AiSessionStatus })?.status) && !!output;
  const chartData = toChartData(output);
  const year3Arr = (output?.revenueForecast?.monthly?.[35]?.amount ?? 0) * 12;
  const warnings = inputWarnings(inputs.arpu, inputs.opex, inputs.growth, inputs.tam, year3Arr, inputs.churn);

  const handleNext = () => router.push('/dashboard/creator/phase-3/compliance');

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.3"
      title="Financial Projections & Simulations"
      description="A 36-month forecast computed from your inputs — revenue, costs, cash flow, and break-even."
      stepLabel="Phase 3 Step 3 of 6"
      progress={50}
    >
      {loadingJourney && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      )}

      {/* No session yet → input form (never mock) */}
      {!loadingJourney && !forecastSessionId && (
        <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-xl">
          <h3 className="font-bold text-sm">Forecast inputs</h3>
          <div className="grid grid-cols-2 gap-4">
            {([
              ['arpu', 'ARPU (€/mo)'], ['opex', 'OPEX (€/mo)'], ['growth', 'Growth (% MoM)'], ['tam', 'TAM (€)'], ['churn', 'Monthly churn (%)'],
            ] as const).map(([k, label]) => (
              <label key={k} className="text-sm space-y-1">
                <span className="text-muted-foreground">{label}</span>
                <input type="number" value={inputs[k]} onChange={(e) => setInputs((s) => ({ ...s, [k]: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>
            ))}
          </div>
          {warnings.length > 0 && warnings.map((wn) => (
            <Alert key={wn}><AlertTriangle className="h-4 w-4" /><AlertDescription>{wn}</AlertDescription></Alert>
          ))}
          {startError && (
            <Alert variant={startError.kind === 'service' || startError.kind === 'rateLimited' ? 'default' : 'destructive'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex flex-col items-start gap-2">
                <span>{startError.message}</span>
                {/* Credits exhausted is NOT retryable — point to support, not a retry. */}
                {startError.kind === 'credits' && (
                  <span className="text-xs text-muted-foreground">Contact support to add more AI credits to your account.</span>
                )}
                {/* Provider/rate-limit issues are transient — offer a retry, not an upgrade. */}
                {(startError.kind === 'service' || startError.kind === 'rateLimited') && (
                  <Button variant="outline" size="sm" onClick={handleStart} disabled={startForecast.isPending} className="gap-1.5">
                    <RotateCw className="h-3.5 w-3.5" /> Try again
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            {!businessPlanSessionId && (
              <Button variant="outline" onClick={() => router.push('/dashboard/creator/phase-3/business-plan')}>
                Go to Business Plan
              </Button>
            )}
            <Button onClick={handleStart} disabled={startForecast.isPending || !businessPlanSessionId} className="gap-2">
              {startForecast.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />} Generate forecast
            </Button>
          </div>
        </Card>
      )}

      {/* Session in flight → skeleton (NOT mock) */}
      {forecastSessionId && session.phase === 'polling' && (
        <div className="space-y-4">
          <div className="h-[260px] w-full rounded-2xl border border-border bg-card animate-pulse" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Running your 36-month simulation…</div>
        </div>
      )}

      {/* Timed out (R12) — distinct from failed */}
      {forecastSessionId && session.phase === 'timedout' && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <FileWarning className="h-8 w-8 text-warning" />
          <p className="text-sm text-muted-foreground">This is taking longer than expected. The job may still finish.</p>
          <Button variant="outline" onClick={session.retry} className="gap-2"><RotateCw className="h-4 w-4" /> Resume</Button>
        </div>
      )}

      {/* Failed */}
      {forecastSessionId && session.isError && session.phase !== 'polling' && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">The forecast failed to load.</p>
          <Button variant="outline" onClick={session.retry} className="gap-2"><RotateCw className="h-4 w-4" /> Retry</Button>
        </div>
      )}

      {/* Completed → real chart + ForecastView (live data only) */}
      {completed && output && (
        <div className="space-y-6">
          {/* Non-blocking warnings against the COMPLETED output (FG-5: year3Arr is now
              real, so the small-TAM check can actually fire). */}
          {warnings.length > 0 && warnings.map((wn) => (
            <Alert key={wn}><AlertTriangle className="h-4 w-4" /><AlertDescription>{wn}</AlertDescription></Alert>
          ))}
          {chartData.length > 0 && (
            <Card className="rounded-2xl border border-border bg-card p-6">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} /><stop offset="95%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval={5} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => (v != null ? `€${Math.round(Number(v) / 1000)}k` : '')} />
                    <Tooltip formatter={(v) => (v != null ? [`€${Number(v).toLocaleString()}`] : [])} contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                    <Legend iconType="circle" />
                    <Area type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={2.5} fill="url(#cRev)" />
                    <Area type="monotone" dataKey="Cost" stroke="var(--warning)" strokeWidth={2} fillOpacity={0} />
                    <Area type="monotone" dataKey="Cashflow" stroke="var(--success-text)" strokeWidth={2} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <ForecastView output={output} />

          <div className="flex justify-between border-t border-border pt-6">
            <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</Button>
            <Button onClick={handleNext} className="gap-1.5">Proceed to Compliance <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </Phase3SetupShell>
  );
}
