'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import entrepreneurApi, {
  type FinancialSummaryResponse,
  type KpiBaselineResponse,
  type QuarterlyRevenueResponse,
} from '@/lib/api-entrepreneur';
import { Surface, RevenueBars, Chip } from '@/components/entrepreneur/phase3/Phase3Ui';
import { cn } from '@/lib/utils';

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n || 0);

type HealthStatus = 'excellent' | 'good' | 'moderate' | 'warning' | 'critical';

function getHealthStatus(value: number | null, metric: string): HealthStatus {
  if (value === null || value === undefined) return 'moderate';
  switch (metric) {
    case 'ltv-cac':
      if (value >= 3) return 'excellent';
      if (value >= 1) return 'good';
      return 'warning';
    case 'churn':
      if (value <= 5) return 'excellent';
      if (value <= 10) return 'good';
      if (value <= 20) return 'moderate';
      return 'critical';
    case 'burn-multiple':
      if (value <= 0.5) return 'excellent';
      if (value <= 1) return 'good';
      if (value <= 2) return 'moderate';
      return 'warning';
    case 'growth':
      if (value >= 20) return 'excellent';
      if (value >= 10) return 'good';
      if (value >= 0) return 'moderate';
      return 'critical';
    default:
      return 'moderate';
  }
}

function HealthBadge({ status }: { status: HealthStatus }) {
  const tones: Record<HealthStatus, string> = {
    excellent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    good: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    warning: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  };
  const labels: Record<HealthStatus, string> = {
    excellent: 'Excellent',
    good: 'Good',
    moderate: 'Moderate',
    warning: 'Warning',
    critical: 'Critical',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold', tones[status])}>
      {labels[status]}
    </span>
  );
}

function HealthStatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value: ReactNode;
  status: HealthStatus;
}) {
  const dotColor = {
    excellent: 'bg-emerald-500',
    good: 'bg-blue-500',
    moderate: 'bg-amber-500',
    warning: 'bg-orange-500',
    critical: 'bg-red-500',
  }[status];

  return (
    <div className="flex items-center justify-between pb-2 border-b border-border/50">
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', dotColor)} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        <HealthBadge status={status} />
      </div>
    </div>
  );
}

function CircularGauge({ percentage }: { percentage: number }) {
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-48 h-48">
      <svg width="192" height="192" viewBox="0 0 192 192" className="w-full h-full">
        <circle cx="96" cy="96" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="96"
          cy="96"
          r="90"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 96 96)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-4xl font-bold text-foreground">{percentage}%</p>
        <p className="text-sm text-muted-foreground mt-1">+{(percentage * 0.048).toFixed(1)}% Mon</p>
      </div>
    </div>
  );
}

function Phase3KpiTrackerClient() {
  const router = useRouter();
  const { progress, getPhaseData } = useEntrepreneurProgress();
  const [financial, setFinancial] = useState<FinancialSummaryResponse | null>(null);
  const [kpi, setKpi] = useState<KpiBaselineResponse | null>(null);
  const [quarterly, setQuarterly] = useState<QuarterlyRevenueResponse[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const phase3Data = getPhaseData(3);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = phase3Data ?? {};
        const prog = await entrepreneurApi.getCurrentPhase();
        const companyId = (existing as any).__companyId ?? prog.companyId;
        if (cancelled || !companyId) return;

        const [fin, kpiRes, qtr] = await Promise.allSettled([
          entrepreneurApi.getFinancialSummary(companyId),
          entrepreneurApi.getKpiBaseline(companyId),
          entrepreneurApi.getQuarterlyRevenue(companyId),
        ]);

        if (cancelled) return;
        if (fin.status === 'fulfilled') setFinancial(fin.value);
        if (kpiRes.status === 'fulfilled') setKpi(kpiRes.value);
        if (qtr.status === 'fulfilled') setQuarterly(qtr.value ?? []);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [phase3Data]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const existing = phase3Data ?? {};
      const prog = await entrepreneurApi.getCurrentPhase();
      const companyId = (existing as any).__companyId ?? prog.companyId;
      if (!companyId) return;

      const [fin, kpiRes, qtr] = await Promise.allSettled([
        entrepreneurApi.getFinancialSummary(companyId),
        entrepreneurApi.getKpiBaseline(companyId),
        entrepreneurApi.getQuarterlyRevenue(companyId),
      ]);

      if (fin.status === 'fulfilled') setFinancial(fin.value);
      if (kpiRes.status === 'fulfilled') setKpi(kpiRes.value);
      if (qtr.status === 'fulfilled') setQuarterly(qtr.value ?? []);
    } catch {} finally {
      setRefreshing(false);
    }
  };

  if (!progress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" role="status">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  const chartData = quarterly && quarterly.length > 0
    ? quarterly.map((q) => ({ label: q.quarter ?? 'Q', value: q.revenue ?? 0 }))
    : [
        { label: 'Q1', value: 0 },
        { label: 'Q2', value: 0 },
        { label: 'Q3', value: 0 },
        { label: 'Q4', value: 0 },
      ];

  const ltvCac = kpi && kpi.ltv && kpi.cac ? kpi.ltv / kpi.cac : null;
  const revenueGrowthPct =
    financial && typeof financial.growthRate === 'number' ? financial.growthRate * 100 : null;
  const growthStatus = revenueGrowthPct !== null ? getHealthStatus(revenueGrowthPct, 'growth') : 'moderate';

  // Prefer API response values; fall back to local storage for backward compatibility
  const burnRate = typeof kpi?.burnRate === 'number' ? kpi.burnRate : (phase3Data as any)?.burnRate;
  const nps = typeof kpi?.nps === 'number' ? kpi.nps : (phase3Data as any)?.nps;
  const burnMultiple = burnRate && kpi?.arr && kpi.arr > 0 ? burnRate / (kpi.arr / 12) : null;
  const runway = financial?.runwayMonths ?? 0;
  const churnStatus = getHealthStatus(kpi?.churnPercent ?? null, 'churn');
  const burnStatus = burnMultiple ? getHealthStatus(burnMultiple, 'burn-multiple') : 'moderate';
  const confidenceScore = financial?.confidenceScore ?? 80;
  const yoyGrowth = revenueGrowthPct ? `+${revenueGrowthPct.toFixed(2)}% YoY` : 'N/A';

  return (
    <div className="bg-background relative w-full min-h-screen overflow-x-hidden overflow-y-auto">

      {/* Main Content */}
      <div className="pt-16 pb-8 px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-semibold text-foreground">KPI Tracker</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Phase 3 complete · Tracking since Apr 1, 2026
            </p>
          </div>

          {/* Main Grid: Left + Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Operational Mastery Card */}
            <Surface className="p-8 flex flex-col gap-8 h-fit">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Core Efficiency</p>
                <h2 className="text-2xl font-semibold text-foreground">Operational Mastery</h2>
              </div>

              <div className="flex justify-center">
                <CircularGauge percentage={confidenceScore} />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">System Health</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Optimal</p>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn('h-1 w-4 rounded-full', i < 3 ? 'bg-emerald-500' : 'bg-emerald-500/40')}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Data Throughput</p>
                  <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                    {financial?.riskDiscountRate ? `${(financial.riskDiscountRate * 100).toFixed(0)}%` : '—'}
                  </p>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={cn('h-1 w-4 rounded-full', i < 2 ? 'bg-cyan-500' : 'bg-cyan-500/40')} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">DATA INTEGRATION</p>
                    <p className="text-xs text-muted-foreground">Sync real time transaction data</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                    Connect Stripe
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                    Connect ChartMogul
                  </Button>
                </div>
              </div>
            </Surface>

            {/* Right: Metrics Stack */}
            <div className="flex flex-col gap-4 h-fit">
              {/* Row 1: MRR, Churn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Surface className="p-5 space-y-6">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly Recurring Revenue</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {financial?.monthlyRecurringRevenue != null ? eur(financial.monthlyRecurringRevenue) : '—'}
                  </p>
                  {revenueGrowthPct !== null && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      ↑ {revenueGrowthPct.toFixed(1)}% vs last month
                    </p>
                  )}
                </Surface>

                <Surface className="p-5 space-y-6">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Churn Rate</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {kpi?.churnPercent != null ? `${kpi.churnPercent.toFixed(1)}%` : '—'}
                  </p>
                  <HealthBadge status={churnStatus} />
                </Surface>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Surface className="p-5 space-y-6">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Annual Revenue</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {financial?.annualRecurringRevenue != null ? eur(financial.annualRecurringRevenue) : '—'}
                  </p>
                  {revenueGrowthPct !== null && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      ↑ {revenueGrowthPct.toFixed(1)}% vs last month
                    </p>
                  )}
                </Surface>

                <Surface className="p-5 space-y-6">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">NPS</p>
                  <p className="text-2xl font-semibold text-foreground">{typeof nps === 'number' ? nps : '—'}</p>
                  {typeof nps === 'number' && nps >= 50 && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">World-class</p>
                  )}
                </Surface>
              </div>

              

              {/* Row 2: CAC/LTV Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Row 2: CAC/LTV Card */}
                <Surface className="p-6 grid grid-cols-3 gap-4 space-y-6">
                  <div className="space-y-6">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">CAC</p>
                    <p className="text-2xl font-semibold text-foreground">{kpi?.cac != null ? eur(kpi.cac) : '—'}</p>
                  </div>
                  <div className="border-l border-border/50" />
                  <div className="space-y-6">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">LTV</p>
                    <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                      {kpi?.ltv != null ? eur(kpi.ltv) : '—'}
                    </p>
                  </div>
                  
                </Surface>
                <Surface className="p-5 space-y-6">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">TOTAL RUNWAY</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-bold text-primary">
                        {runway > 0 ? Math.round(runway) : '—'}
                      </p>
                      <p className="text-sm text-muted-foreground">months</p>
                    </div>
                </Surface>
              </div>
            </div>
          </div>

          {/* Revenue Trend + Business Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Burn Rate Chart */}
            <Surface className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Monthly Burn Rate</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="gap-2"
                >
                  <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
              <div className="space-y-3">
                <p className="text-2xl font-semibold text-foreground">{burnRate != null ? eur(burnRate) : '—'}</p>
                {burnRate != null && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">↑ 12% vs last month</p>
                )}
                <div className="h-24 flex items-end gap-1 bg-muted/50 rounded-lg p-4">
                  {[60, 87, 64, 40, 50, 21, 40, 64].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-red-600 to-red-300 rounded-sm"
                      style={{ height: `${(h / 87) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            </Surface>

            <Surface className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Revenue trend (Q1-Q4 2026)</h3>
                <Chip tone="success">{yoyGrowth}</Chip>
              </div>
              <RevenueBars data={chartData} height={180} />
            </Surface>
          </div>

            <Surface className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Business Health</h3>
                <Chip tone="success">Score {confidenceScore}/100</Chip>
              </div>
              <div className="space-y-3 text-sm">
                <HealthStatusRow
                  label="LTV / CAC ratio"
                  value={ltvCac ? `${ltvCac.toFixed(1)}x` : '—'}
                  status={ltvCac ? getHealthStatus(ltvCac, 'ltv-cac') : 'moderate'}
                />
                <HealthStatusRow
                  label="Burn multiple"
                  value={burnMultiple ? burnMultiple.toFixed(2) : '—'}
                  status={burnStatus}
                />
                <HealthStatusRow
                  label="MoM growth"
                  value={revenueGrowthPct != null ? `${revenueGrowthPct.toFixed(1)}%` : '—'}
                  status={growthStatus}
                />
                <HealthStatusRow
                  label="Churn rate"
                  value={kpi?.churnPercent != null ? `${kpi.churnPercent.toFixed(1)}%` : '—'}
                  status={churnStatus}
                />
              </div>
            </Surface>
          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard/entrepreneur/phase-3/step-3')}>
              Update KPIs
            </Button>
            <Button onClick={() => router.push('/dashboard/entrepreneur/phase-4')}>
              Continue to Phase 4
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Phase3KpiTrackerPage() {
  return (
    <RouteGuard requiredPhase={3}>
      <Phase3KpiTrackerClient />
    </RouteGuard>
  );
}
