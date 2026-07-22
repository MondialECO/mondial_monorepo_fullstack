'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ArrowLeft, Loader2, AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useForecastSessionTimed, useStartForecast } from '@/hooks/queries/creator-ai';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import { toAiError, type AiError } from '@/lib/ai-errors';

// Non-blocking input warnings (pre-generation subset; the small-TAM check needs a
// completed forecast's Year-3 ARR, so it lives on the results page).
function inputWarnings(arpu: number, opex: number, growth: number, churn: number) {
  const w: string[] = [];
  if (arpu > 0 && opex > 0 && arpu < opex / 10) w.push('Tight unit economics: ARPU is low relative to OPEX.');
  if (growth > 30) w.push('Aggressive growth: >30% MoM is hard to sustain — sanity-check assumptions.');
  if (churn > 11) w.push('High churn (>11%/mo) pushes LTV/CAC below the healthy 3× bar — it weakens your readiness Financial score.');
  return w;
}

export default function ForecastInputsPage() {
  const router = useRouter();

  const [loadingJourney, setLoadingJourney] = useState(true);
  const [forecastSessionId, setForecastSessionId] = useState<string | null>(null);
  const [businessPlanSessionId, setBusinessPlanSessionId] = useState<string | null>(null);
  const [inputs, setInputs] = useState({ arpu: 49, opex: 8000, growth: 12, tam: 50_000_000, churn: 5 });
  const [startError, setStartError] = useState<AiError | null>(null);

  const startForecast = useStartForecast();
  // Read the latest forecast session only to PRE-FILL from its stored inputs (reuse the
  // existing hook — no new fetch pattern). Fetches once when terminal; no polling need.
  const session = useForecastSessionTimed(forecastSessionId);
  const sessionInputs = (session.data as {
    inputs?: { arpu?: number | null; opex?: number | null; monthlyGrowthPct?: number | null; tam?: number | null; monthlyChurnPct?: number | null } | null;
  } | undefined)?.inputs ?? null;

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

  // Seed the form ONCE from the last generation's stored inputs; defaults for a fresh
  // user or a legacy session with no inputs. Guarded so it never clobbers user typing.
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

  const warnings = inputWarnings(inputs.arpu, inputs.opex, inputs.growth, inputs.churn);

  // Generate = the existing start path: persists these inputs on a new forecast session,
  // then hands off to the results page which polls it. No backend change.
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
      router.push('/dashboard/creator/phase-3/forecast');
    } catch (e) {
      // 402 (your credits are out) vs 503 (provider issue) read differently to the user.
      setStartError(toAiError(e, 'Could not start the forecast.'));
    }
  };

  const inputGrid = (
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
  );

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.3"
      title="Forecast Inputs"
      description="Set the assumptions for your 36-month forecast, then generate it."
    >
      {loadingJourney && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      )}

      {!loadingJourney && (
        <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-xl">
          <h3 className="font-bold text-sm">Forecast inputs</h3>
          {inputGrid}
          {warnings.length > 0 && warnings.map((wn) => (
            <Alert key={wn}><AlertTriangle className="h-4 w-4" /><AlertDescription>{wn}</AlertDescription></Alert>
          ))}
          {startError && (
            <Alert variant={startError.kind === 'service' || startError.kind === 'rateLimited' ? 'default' : 'destructive'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex flex-col items-start gap-2">
                <span>{startError.message}</span>
                {startError.kind === 'credits' && (
                  <span className="text-xs text-muted-foreground">Contact support to add more AI credits to your account.</span>
                )}
                {(startError.kind === 'service' || startError.kind === 'rateLimited') && (
                  <Button variant="outline" size="sm" onClick={handleGenerate} disabled={startForecast.isPending} className="gap-1.5">
                    <RotateCw className="h-3.5 w-3.5" /> Try again
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard/creator/phase-3/business-plan')} className="text-xs font-bold text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Business Plan
            </Button>
            <Button onClick={handleGenerate} disabled={startForecast.isPending || !businessPlanSessionId} className="gap-2">
              {startForecast.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />} Generate forecast
            </Button>
          </div>
          {!businessPlanSessionId && (
            <p className="text-xs text-muted-foreground">You need a completed business plan first — use “Business Plan”.</p>
          )}
        </Card>
      )}
    </Phase3SetupShell>
  );
}
