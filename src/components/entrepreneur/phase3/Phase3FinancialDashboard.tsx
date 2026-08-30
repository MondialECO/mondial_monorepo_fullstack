'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import entrepreneurApi, {
  type FinancialSummaryResponse,
  type KpiBaselineResponse,
  type MonthlyRevenueResponse,
  type CompanyProgressResponse,
} from '@/lib/api-entrepreneur';
import {
  SectionCard,
  MetricCard,
  StatusRing,
  DataTable,
  QuarterBars,
  IntegrationNotice,
  VerificationProgressRail,
  Chip,
  type DataTableRow,
  type RailStep,
  type Tone,
} from './FinancialWidgets';

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n || 0);

const num = (n: number) => new Intl.NumberFormat('en-IE', { maximumFractionDigits: 1 }).format(n || 0);

function toQuarters(entries: MonthlyRevenueResponse[]): Array<{ label: string; value: number }> {
  if (!entries.length) return [];
  const byKey = new Map<string, number>();
  let maxYear = -Infinity;
  for (const e of entries) {
    const [yStr, mStr] = (e.yearMonth ?? '').split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    if (!Number.isFinite(y) || !Number.isFinite(m)) continue;
    const q = Math.floor((m - 1) / 3) + 1;
    byKey.set(`${y}-Q${q}`, (byKey.get(`${y}-Q${q}`) ?? 0) + (e.revenue || 0));
    if (y > maxYear) maxYear = y;
  }
  if (maxYear === -Infinity) return [];
  return [1, 2, 3, 4].map((q) => ({ label: `Q${q}`, value: byKey.get(`${maxYear}-Q${q}`) ?? 0 }));
}

function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading financial tracking…</span>
      <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
    </div>
  );
}

export function Phase3FinancialDashboard({ companyId: companyIdProp }: { companyId?: string }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<CompanyProgressResponse | null>(null);
  const [financial, setFinancial] = useState<FinancialSummaryResponse | null>(null);
  const [kpi, setKpi] = useState<KpiBaselineResponse | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRevenueResponse[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(companyIdProp ?? null);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prog = await entrepreneurApi.getCurrentPhase();
        if (cancelled) return;
        setProgress(prog);
        const id = companyIdProp ?? prog.companyId;
        setCompanyId(id);
        if (!id) {
          setLoading(false);
          return;
        }
        const [fin, kpiRes, mr] = await Promise.allSettled([
          entrepreneurApi.getFinancialSummary(id),
          entrepreneurApi.getKpiBaseline(id),
          entrepreneurApi.getMonthlyRevenue(id),
        ]);
        if (cancelled) return;
        if (fin.status === 'fulfilled') setFinancial(fin.value);
        if (kpiRes.status === 'fulfilled') setKpi(kpiRes.value);
        if (mr.status === 'fulfilled') setMonthly(mr.value ?? []);
      } catch {
        if (!cancelled) setError('Could not load financial tracking data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyIdProp]);

  const handleRecalculate = async () => {
    if (!companyId) return;
    setError('');
    setRecalculating(true);
    try {
      const fin = await entrepreneurApi.calculateValuation(companyId);
      setFinancial(fin);
    } catch {
      setError('Failed to recalculate valuation.');
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) return <Skeleton />;

  const hasKpi = kpi !== null;
  const hasFin = financial !== null;
  const quarters = toQuarters(monthly);

  const ltvCac = hasKpi && kpi!.cac > 0 ? kpi!.ltv / kpi!.cac : null;
  const growth = hasFin ? financial!.growthRate : null;
  const churn = hasKpi ? kpi!.churnPercent : null;

  const ratioTone: Tone = ltvCac == null ? 'muted' : ltvCac >= 3 ? 'success' : ltvCac >= 1 ? 'warning' : 'destructive';
  const ratioLabel = ltvCac == null ? '' : ltvCac >= 3 ? 'Healthy' : ltvCac >= 1 ? 'Watch' : 'Low';
  const growthTone: Tone = growth == null ? 'muted' : growth > 0 ? 'success' : 'warning';
  const churnTone: Tone = churn == null ? 'muted' : churn < 5 ? 'success' : churn < 10 ? 'warning' : 'destructive';
  const churnLabel = churn == null ? '' : churn < 5 ? 'Low' : churn < 10 ? 'Moderate' : 'High';

  // Verification-progress rail — step states derived from REAL data (no fabrication).
  const phase3Done = progress?.completedPhases?.includes(3) ?? false;
  const s1 = phase3Done || quarters.length > 0 || (hasFin && typeof financial!.totalRevenue === 'number');
  const s2 = phase3Done || (hasFin && financial!.finalValuation > 0);
  const s3 = phase3Done || hasKpi;
  const s4 = phase3Done;
  const done = [s1, s2, s3, s4];
  const firstPending = done.findIndex((x) => !x);
  const stepState = (i: number): RailStep['state'] => (done[i] ? 'complete' : firstPending === i ? 'current' : 'pending');
  const railSteps: RailStep[] = [
    { label: 'Revenue input', description: 'Enter revenue for the last four quarters.', state: stepState(0) },
    { label: 'Automated valuation', description: 'Estimated valuation from sector benchmarks.', state: stepState(1) },
    { label: 'Live KPI tracking', description: 'Track growth metrics on the dashboard.', state: stepState(2) },
    { label: 'Concept overview', description: 'Explain your core concept.', state: stepState(3) },
  ];

  const breakdownRows: DataTableRow[] = [
    { metric: 'Revenue multiple', unavailable: 'unavailable', chip: 'Benchmark', chipTone: 'primary' },
    { metric: 'Base valuation', unavailable: 'unavailable', chip: 'Core asset', chipTone: 'muted' },
    { metric: 'Growth premium', unavailable: 'unavailable', chip: 'Performance', chipTone: 'success' },
    { metric: 'Risk discount', unavailable: 'unavailable', chip: 'Dilution adj', chipTone: 'destructive' },
    {
      metric: 'Final valuation',
      value: hasFin && financial!.finalValuation > 0 ? eur(financial!.finalValuation) : undefined,
      unavailable: hasFin && financial!.finalValuation > 0 ? undefined : 'unavailable',
      chip: 'Estimated',
      chipTone: 'primarySolid',
      highlight: true,
    },
  ];

  const healthRows: DataTableRow[] = [
    {
      metric: 'LTV / CAC ratio',
      value: ltvCac != null ? `${ltvCac.toFixed(1)}x` : undefined,
      unavailable: ltvCac != null ? undefined : 'unavailable',
      chip: ratioLabel || undefined,
      chipTone: ratioTone,
    },
    { metric: 'Burn multiple', unavailable: 'unavailable', chip: 'No expense data', chipTone: 'muted' },
    {
      metric: 'Growth rate',
      value: growth != null ? `${growth > 0 ? '+' : ''}${num(growth)}%` : undefined,
      unavailable: growth != null ? undefined : 'unavailable',
      chip: growth != null ? (growth > 0 ? 'Positive' : 'Flat') : undefined,
      chipTone: growthTone,
    },
    {
      metric: 'Churn rate',
      value: churn != null ? `${num(churn)}%` : undefined,
      unavailable: churn != null ? undefined : 'unavailable',
      chip: churnLabel || undefined,
      chipTone: churnTone,
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ───────── Figma 3.3 — Automated valuation (left rail + content) ───────── */}
      <SectionCard
        title="Automated valuation"
        subtitle="Estimated from your saved financials. Recalculate after updating inputs."
        headerRight={
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRecalculate} disabled={recalculating || !companyId}>
            <RefreshCw className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} aria-hidden />
            {recalculating ? 'Recalculating…' : 'Recalculate'}
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
          <VerificationProgressRail
            steps={railSteps}
            overallPercent={progress ? progress.overallProgressPercent : null}
            helper="Complete each step to unlock the next module."
          />

          <div className="space-y-4">
            {/* Top metric cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricCard
                label="Annual revenue"
                value={hasFin && typeof financial!.totalRevenue === 'number' ? eur(financial!.totalRevenue) : undefined}
                unavailable={hasFin && typeof financial!.totalRevenue === 'number' ? undefined : 'unavailable'}
                chip={hasFin && financial!.totalRevenue === 0 ? 'Pre-Revenue' : undefined}
                chipTone={hasFin && financial!.totalRevenue === 0 ? 'primary' : undefined}
              />
              <MetricCard label="Average growth" value={growth != null ? `${growth > 0 ? '+' : ''}${num(growth)}%` : undefined} unavailable={growth != null ? undefined : 'unavailable'} chip="Per year" chipTone="muted" />
              <MetricCard label="Estimated valuation" tone="primary" value={hasFin && financial!.finalValuation > 0 ? eur(financial!.finalValuation) : undefined} unavailable={hasFin && financial!.finalValuation > 0 ? undefined : 'unavailable'} />
            </div>

            {/* Revenue growth chart */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Revenue growth (quarterly)</p>
                {growth != null && <Chip tone={growthTone}>{`${growth > 0 ? '+' : ''}${num(growth)}% YoY`}</Chip>}
              </div>
              <QuarterBars data={quarters} />
            </div>

            {/* Two status cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-border p-4">
                <span className="rounded-lg bg-primary/10 p-2 text-primary"><ShieldCheck className="h-5 w-5" aria-hidden /></span>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Verification status</p>
                  <p className="text-sm font-semibold text-foreground">
                    {progress == null ? '—' : progress.isInvestorReady ? 'Institutional ready' : 'Pending review'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border p-4">
                <span className="rounded-lg bg-primary/10 p-2 text-primary"><Activity className="h-5 w-5" aria-hidden /></span>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Financial health</p>
                  <p className="text-sm font-semibold text-foreground">
                    {growth != null ? `${num(growth)}% yearly growth` : 'Awaiting calculation'}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed calculator breakdown */}
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Detailed valuation breakdown</p>
              <DataTable columns={['Metric', 'Current value', 'Category']} rows={breakdownRows} caption="Valuation breakdown" />
              <p className="mt-2 text-xs italic text-muted-foreground">
                Multiplier-method intermediates require backend valuation fields that aren&apos;t exposed yet.
              </p>
            </div>

            {/* Multiplier / beneficial ownership (config-dependent) */}
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold text-foreground">Valuation multiplier</p>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground">Sector benchmark multiplier and beneficial-ownership adjustments are not yet configured.</p>
              <div className="mt-2">
                <Chip tone="muted">Not yet configured</Chip>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ───────── Figma 3.2 — KPI Tracker ───────── */}
      <SectionCard
        title="KPI Tracker"
        subtitle={hasKpi && kpi!.recordedAt ? `Tracking since ${new Date(kpi!.recordedAt).toLocaleDateString()}` : 'No KPI baseline recorded yet'}
      >
        <IntegrationNotice
          title="Connect Stripe to enable automatic KPI sync"
          body="Currently showing manually entered data. Connect to get real-time MRR, churn, and revenue updates."
          actions={['Connect Stripe', 'Connect ChartMogul']}
        />

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
          <StatusRing percent={progress ? progress.overallProgressPercent : null} label="Overall progress" sublabel="Phase completion" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <MetricCard label="MRR" value={hasKpi ? eur(kpi!.mrr) : hasFin ? eur(financial!.monthlyRecurringRevenue) : undefined} unavailable={hasKpi || hasFin ? undefined : 'unavailable'} />
            <MetricCard label="Annual recurring rev." value={hasKpi ? eur(kpi!.arr) : hasFin ? eur(financial!.annualRecurringRevenue) : undefined} unavailable={hasKpi || hasFin ? undefined : 'unavailable'} />
            <MetricCard label="Churn rate" value={hasKpi ? `${num(kpi!.churnPercent)}%` : undefined} unavailable={hasKpi ? undefined : 'unavailable'} />
            <MetricCard label="CAC" value={hasKpi ? eur(kpi!.cac) : undefined} unavailable={hasKpi ? undefined : 'unavailable'} />
            <MetricCard label="LTV" value={hasKpi ? eur(kpi!.ltv) : undefined} unavailable={hasKpi ? undefined : 'unavailable'} />
            <MetricCard label="Total runway" value={hasFin && financial!.runwayMonths > 0 ? `${num(financial!.runwayMonths)} mo` : undefined} unavailable={hasFin && financial!.runwayMonths > 0 ? undefined : 'unavailable'} />
            <MetricCard label="Gross margin" value={hasKpi ? `${num(kpi!.grossMarginPercent)}%` : undefined} unavailable={hasKpi ? undefined : 'unavailable'} />
            <MetricCard label="NPS" unavailable="unavailable" />
            <MetricCard label="Burn rate" unavailable="unavailable" />
          </div>
        </div>

        {/* Business health */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Business health</p>
            {progress && <Chip tone="primary">{`Trust score ${progress.trustScore}/100`}</Chip>}
          </div>
          <DataTable columns={['Metric', 'Value', 'Status']} rows={healthRows} caption="Business health metrics" />
        </div>
      </SectionCard>
    </div>
  );
}

export default Phase3FinancialDashboard;
