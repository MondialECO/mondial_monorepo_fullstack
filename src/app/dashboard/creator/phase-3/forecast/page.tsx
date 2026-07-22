'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, AlertTriangle, RotateCw, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import PlanForecastPrintView from '@/components/creator/PlanForecastPrintView';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ForecastView } from '@/components/creator/ai/ForecastView';
import { useForecastSessionTimed, useBusinessPlanSessionTimed } from '@/hooks/queries/creator-ai';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import { hasAiOutput, type ForecastOutput, type BusinessPlanOutput } from '@/types/creator/ai';

const INPUTS_ROUTE = '/dashboard/creator/phase-3/forecast-inputs';

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

// Non-blocking warnings against the inputs that produced the loaded forecast.
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
  // Export (combined plan + forecast) — same document as the business-plan page.
  const [showExport, setShowExport] = useState(false);
  const [project, setProject] = useState({ name: '', problem: '', solution: '', targetUser: '' });
  const [cross, setCross] = useState({ youNeed: [] as string[], seedAsk: null as number | null });

  const session = useForecastSessionTimed(forecastSessionId);
  // Reuse the existing plan hook so the export renders the full plan alongside the forecast.
  const planSession = useBusinessPlanSessionTimed(businessPlanSessionId);
  const planOutput = (planSession.data as { output?: BusinessPlanOutput } | undefined)?.output ?? null;

  // The inputs that actually produced the loaded forecast (camelCase from the API) —
  // drives the read-only "Inputs used" summary.
  const sessionInputs = (session.data as {
    inputs?: { arpu?: number | null; opex?: number | null; monthlyGrowthPct?: number | null; tam?: number | null; monthlyChurnPct?: number | null } | null;
  } | undefined)?.inputs ?? null;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get();
        const p3 = journey.phase3Data as {
          forecastSessionId?: string; businessPlanSessionId?: string;
          formationGenerator?: { youNeed?: { label: string }[] };
        };
        const p5 = journey.phase5Data as { pathB?: { seedFunding?: { totalAsk?: number } } };
        if (!active) return;
        setForecastSessionId(p3?.forecastSessionId ?? null);
        setBusinessPlanSessionId(p3?.businessPlanSessionId ?? null);
        setProject({ name: journey.project?.name ?? '', problem: journey.project?.problem ?? '', solution: journey.project?.solution ?? '', targetUser: journey.project?.targetUser ?? '' });
        setCross({
          youNeed: (p3?.formationGenerator?.youNeed ?? []).map((n) => n.label),
          seedAsk: p5?.pathB?.seedFunding?.totalAsk ?? null,
        });
      } finally {
        if (active) setLoadingJourney(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // No forecast to show → send the user to the inputs page to generate one (covers a
  // fresh user, a direct URL, or browser-back with no session). Never an empty results page.
  useEffect(() => {
    if (!loadingJourney && !forecastSessionId) router.replace(INPUTS_ROUTE);
  }, [loadingJourney, forecastSessionId, router]);

  const output = (session.data as { output?: ForecastOutput } | undefined)?.output;
  const completed = session.phase === 'terminal' && hasAiOutput((session.data as { status?: import('@/types/creator/ai').AiSessionStatus })?.status) && !!output;
  // Terminal but no usable forecast → the session settled as Failed (AI-service request
  // failure; parse issues become NeedsReview, which has output). Never a blank body.
  const fcError = (session.data as { error?: string | null } | undefined)?.error ?? null;
  const terminalFailed = !!forecastSessionId && session.phase === 'terminal' && !completed;
  const failedIsCredits = /402|credit|insufficient|payment/i.test(fcError ?? '');
  const chartData = toChartData(output);
  const year3Arr = (output?.revenueForecast?.monthly?.[35]?.amount ?? 0) * 12;
  const warnings = sessionInputs
    ? inputWarnings(sessionInputs.arpu ?? 0, sessionInputs.opex ?? 0, sessionInputs.monthlyGrowthPct ?? 0, sessionInputs.tam ?? 0, year3Arr, sessionInputs.monthlyChurnPct ?? 0)
    : [];

  const handleNext = () => router.push('/dashboard/creator/phase-3/compliance');

  return (
    <>
    <PlanForecastPrintView
      open={showExport}
      onClose={() => setShowExport(false)}
      projectName={project.name}
      project={project}
      plan={planOutput}
      forecast={output ?? null}
      cross={cross}
    />
    <Phase3SetupShell
      stepEyebrow="Step 3.3"
      title="Financial Projections & Simulations"
      description="A 36-month forecast computed from your inputs — revenue, costs, cash flow, and break-even."
    >
      {loadingJourney && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      )}

      {/* No session → the effect above redirects to the inputs page; show a spinner meanwhile. */}
      {!loadingJourney && !forecastSessionId && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Opening forecast inputs…</div>
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

      {/* Failed to load (network/query error, not a job failure) */}
      {forecastSessionId && session.isError && session.phase !== 'polling' && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">The forecast failed to load.</p>
          <Button variant="outline" onClick={session.retry} className="gap-2"><RotateCw className="h-4 w-4" /> Retry</Button>
        </div>
      )}

      {/* Terminal but no usable forecast (Failed request) → honest message + back to inputs */}
      {terminalFailed && (
        <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-bold text-sm">We couldn&apos;t generate your forecast</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {failedIsCredits
              ? 'The AI service ran out of credits, so your forecast couldn’t be generated. This isn’t anything you did.'
              : 'The AI service was temporarily unavailable (a provider error, rate limit, or timeout), so your forecast didn’t finish. This isn’t anything you did — please try again.'}
          </p>
          {failedIsCredits && (
            <p className="text-xs text-muted-foreground">Contact support to add more AI credits, then generate again.</p>
          )}
          <Button onClick={() => router.push(INPUTS_ROUTE)} className="gap-2">
            <RotateCw className="h-4 w-4" /> Adjust inputs &amp; retry
          </Button>
        </Card>
      )}

      {/* Completed → real chart + ForecastView (live data only) */}
      {completed && output && (
        <div className="space-y-6">
          {/* Inputs behind THIS forecast: read-only for transparency, with a link to the
              inputs page to edit and regenerate (same start path, persists the new inputs). */}
          {sessionInputs && (
            <Card className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Inputs used:</span>{' '}
                  ARPU €{sessionInputs.arpu ?? '—'}/mo · OPEX €{sessionInputs.opex ?? '—'}/mo · Growth {sessionInputs.monthlyGrowthPct ?? '—'}%/mo · TAM €{(sessionInputs.tam ?? 0).toLocaleString()} · Churn {sessionInputs.monthlyChurnPct ?? '—'}%/mo
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push(INPUTS_ROUTE)} className="gap-1.5">
                  <RotateCw className="h-3.5 w-3.5" /> Adjust &amp; regenerate
                </Button>
              </div>
            </Card>
          )}

          {/* Non-blocking warnings against the COMPLETED output (year3Arr is real here). */}
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowExport(true)}>Export PDF</Button>
              <Button onClick={handleNext} className="gap-1.5">Proceed to Compliance <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      )}
    </Phase3SetupShell>
    </>
  );
}
