'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Activity, Users, Info, ChevronRight } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import {
  Phase3Container,
  Surface,
  IconStatCard,
  MetricTile,
  RevenueBars,
  Chip,
} from '@/components/entrepreneur/phase3/Phase3Ui';
import { PHASE_3_STEPS } from '@/components/entrepreneur/phase3/steps';
import entrepreneurApi, { type FinancialSummaryResponse } from '@/lib/api-entrepreneur';
import { Phase3Data } from '@/types/entrepreneur';

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

function Phase3ValuationClient() {
  const router = useRouter();
  const { progress, activeCompanyId, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  const [financial, setFinancial] = useState<FinancialSummaryResponse | null>(null);
  const [investorReady, setInvestorReady] = useState<boolean | null>(null);
  const [quarterly, setQuarterly] = useState<{ quarter: string; revenue: number; monthCount: number }[]>([]);
  const [owners, setOwners] = useState<
    { fullName: string; ownershipPercent: number; nationality: string }[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prog = await entrepreneurApi.getCurrentPhase(activeCompanyId || undefined);
        const companyId = activeCompanyId || prog.companyId;
        if (cancelled) return;
        setInvestorReady(prog.isInvestorReady);
        if (!companyId) return;
        const [fin, qtr, own] = await Promise.allSettled([
          entrepreneurApi.getFinancialSummary(companyId),
          entrepreneurApi.getQuarterlyRevenue(companyId),
          entrepreneurApi.getBeneficialOwners(companyId),
        ]);
        if (cancelled) return;
        if (fin.status === 'fulfilled') setFinancial(fin.value);
        if (qtr.status === 'fulfilled') setQuarterly(qtr.value);
        if (own.status === 'fulfilled' && Array.isArray(own.value)) setOwners(own.value);
      } catch {
        // Silent — display falls back to honest empty states.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCompanyId]);

  if (!progress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" role="status" aria-live="polite">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  // Derive intermediate valuation metrics from financial summary
  const revenueMultiple = financial?.revenueMultiple ?? 0;
  const baseValuation = financial ? financial.totalRevenue * revenueMultiple : 0;
  const riskRate = financial?.riskDiscountRate ?? 0;
  const preDiscValuation = financial && riskRate < 1
    ? financial.finalValuation / (1 - riskRate)
    : (financial?.finalValuation ?? 0);
  const growthPremium = preDiscValuation - baseValuation;

  const handleNext = async () => {
    setValidationError('');
    setIsSubmitting(true);
    try {
      const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
      const companyId =
        activeCompanyId || (await entrepreneurApi.getCurrentPhase())?.companyId || existing.__companyId;
      savePhaseData(3, { ...existing, __companyId: companyId, valuationReviewedAt: new Date().toISOString() });
      moveToNextStep(3, 2);
      router.push('/dashboard/entrepreneur/phase-3/step-3');
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to continue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusMap = {
    1: progress.completedSteps.has('3-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending',
    2: progress.completedSteps.has('3-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending',
    3: progress.completedSteps.has('3-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending',
    4: progress.completedSteps.has('3-4') ? 'completed' : progress.currentStep === 4 ? 'current' : 'pending',
  } as const;
  const stepIndicators = PHASE_3_STEPS.map((s) => ({
    ...s,
    status: statusMap[s.step as 1 | 2 | 3 | 4] as 'completed' | 'current' | 'pending',
  }));

  const sidebar = (
    <ProgressSidebar
      title="Verification Progress"
      steps={stepIndicators}
      overallScore={50}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Review your AI-estimated valuation, then continue to live KPI tracking."
    />
  );

  const chartData = quarterly.length > 0
    ? quarterly.map((q) => ({ label: q.quarter, value: q.revenue }))
    : [
        { label: 'Q1', value: 0 },
        { label: 'Q2', value: 0 },
        { label: 'Q3', value: 0 },
        { label: 'Q4', value: 0 },
      ];

  const hasValuation = !!financial && financial.finalValuation > 0;

  return (
    <EntrepreneurLayout sidebar={sidebar}>
      <Phase3Container
        crumbs={['Entrepreneur Verification', 'Automated Valuation']}
        title="Automated Valuation"
        subtitle="Your AI-estimated valuation is derived from the revenue you submitted and sector benchmarks."
      >
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Left rail: ownership / multiplier / logic */}
          <div className="flex flex-col gap-4">
            <Surface className="p-5 space-y-3 bg-popover">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" aria-hidden />
                <h2 className="text-sm font-semibold text-foreground">Beneficial Ownership</h2>
              </div>
              {owners.length > 0 ? (
                <ul className="space-y-2">
                  {owners.map((o, i) => {
                    const initials = o.fullName
                      .split(/\s+/)
                      .map((p) => p[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    return (
                      <li key={`${o.fullName}-${i}`} className="flex items-center gap-3">
                        <span className="grid place-items-center size-10 rounded-lg bg-primary/10 text-primary text-xs font-semibold shrink-0">
                          {initials || '—'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{o.fullName}</p>
                          {o.nationality ? (
                            <p className="text-xs text-muted-foreground truncate">{o.nationality}</p>
                          ) : null}
                        </div>
                        <Chip tone="primary">{o.ownershipPercent}%</Chip>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No beneficial owners recorded yet. Captured during Phase 2 verification.
                </p>
              )}
            </Surface>

            <Surface className="p-5 space-y-3 bg-popover">
              <label htmlFor="multiplier" className="block text-sm font-semibold text-foreground">
                Select Multiplier
              </label>
              <select
                id="multiplier"
                disabled
                className="h-10 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground"
                aria-label="Valuation multiplier (set by valuation engine)"
              >
                <option>
                  {financial && revenueMultiple ? `${revenueMultiple.toFixed(1)}x ${financial.industry ? `(${financial.industry})` : '(Benchmark)'}` : 'Awaiting valuation engine'}
                </option>
              </select>
              <p className="text-xs text-muted-foreground">
                Industry benchmark and market intelligence data set the sector multiplier.
              </p>
            </Surface>

            <Surface className="p-5">
              <div className="flex gap-3">
                <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-foreground">Valuation Logic</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Valuation is derived using a Revenue Multiplier method. We apply the sector benchmark to your TTM
                    (Trailing Twelve Months) revenue, adjusted for historical growth velocity and current market risk
                    factors. It is advisory only — not a binding offer or financial guarantee.
                  </p>
                </div>
              </div>
            </Surface>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
           
            {/* Valuation summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricTile label="Annual Revenue" value={financial ? eur(financial.totalRevenue) : '—'} available={!!financial} />
              <MetricTile
                label="Average Growth"
                value={financial && financial.growthRate ? `${financial.growthRate > 0 ? '+' : ''}${(financial.growthRate * 100).toFixed(1)}%` : '—'}
                available={!!financial}
              />
              <div className="bg-primary text-primary-foreground rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide opacity-80">Estimated Valuation</p>
                  {financial?.confidenceScore != null && (
                    <p className="text-xs font-semibold opacity-90">Confidence: {financial.confidenceScore}/100</p>
                  )}
                </div>
                {hasValuation ? (
                  <p className="text-[28px] leading-9 font-semibold tabular-nums">{eur(financial!.finalValuation)}</p>
                ) : (
                  <p className="text-sm italic opacity-90">Awaiting calculation</p>
                )}
                <Chip tone="neutral">{financial?.industry ? `${financial.industry.replace(/_/g, ' ')} Sector` : 'Sector'}</Chip>
              </div>
            </div>

            {/* Revenue chart */}
            <Surface className="p-6 bg-popover">
              <h2 className="text-lg font-semibold text-foreground mb-6">Revenue Growth Report Card</h2>
              {quarterly.length > 0 ? (
                <RevenueBars data={chartData} />
              ) : (
                <div className="py-8 flex items-center justify-center bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground italic">
                    Quarterly revenue data will appear once you connect a revenue tool or enter transactions in Step 1.
                  </p>
                </div>
              )}
            </Surface>

            {/* Verification + health */}
            <div className="flex flex-col sm:flex-row gap-4" role="status" aria-live="polite">
              <IconStatCard
                label="Verification Status"
                icon={ShieldCheck}
                value={investorReady == null ? '—' : investorReady ? 'Institutional Ready' : 'Pending Review'}
                sub={investorReady ? 'All regulatory checks approved' : 'Set by backend compliance checks'}
              />
              <IconStatCard
                label="Financial Health"
                icon={Activity}
                value={financial && financial.growthRate ? `${(financial.growthRate * 100).toFixed(1)}% Yearly Growth` : 'Awaiting calculation'}
                sub="Strong year-over-year revenue scaling"
              />
            </div>
          </div>
        </div>

        {/* Detailed calculator breakdown (Final real; intermediates backend-blocked) */}
        <Surface className="p-6 mt-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Detailed calculator breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Metric</th>
                  <th className="py-2 font-medium">Current Value</th>
                  <th className="py-2 font-medium">Category</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { metric: 'Revenue Multiple', tone: 'primary', cat: 'Benchmark', value: financial && revenueMultiple ? `${revenueMultiple.toFixed(1)}x` : null },
                  { metric: 'Base Valuation', tone: 'neutral', cat: 'Core Asset', value: financial && baseValuation ? eur(baseValuation) : null },
                  { metric: 'Growth Premium', tone: 'success', cat: 'Performance', value: financial && growthPremium ? `+${eur(growthPremium)}` : null },
                  {
                    metric: 'Risk Discount',
                    tone: 'destructive',
                    cat: 'Dilution Adj',
                    value:
                      financial?.riskDiscountRate != null
                        ? `−${(financial.riskDiscountRate * 100).toFixed(1)}%`
                        : null,
                  },
                ] as const).map(({ metric, tone, cat, value }) => (
                  <tr key={metric} className="border-b border-border/60">
                    <td className="py-3 text-foreground">{metric}</td>
                    <td className={value ? 'py-3 text-foreground tabular-nums' : 'py-3 text-muted-foreground italic'}>
                      {value ?? 'Data unavailable'}
                    </td>
                    <td className="py-3">
                      <Chip tone={tone}>{cat}</Chip>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-3 font-semibold text-foreground">Final Valuation</td>
                  <td className="py-3 font-semibold text-foreground tabular-nums">
                    {hasValuation ? eur(financial!.finalValuation) : <span className="italic text-muted-foreground">Awaiting calculation</span>}
                  </td>
                  <td className="py-3">
                    <Chip tone="primary">Estimated</Chip>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Surface>

        {/* Investor insights (backend-blocked shell) */}
        {/* <Surface className="p-6 mt-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">Investor Insights</h2>
          <p className="text-sm italic text-muted-foreground">
            No investor activity yet. Insights appear once your listing is published and investors engage (Phase 8).
          </p>
        </Surface> */}

        <div className="mt-6">
          <StepFooter
            backUrl="/dashboard/entrepreneur/phase-3/step-1"
            onNextClick={handleNext}
            isLoading={isSubmitting}
            nextLabel="Next: KPI Metrics"
            nextValidationError={validationError}
          />
        </div>
      </Phase3Container>
    </EntrepreneurLayout>
  );
}

export default function Phase3Step2Page() {
  return (
    <RouteGuard requiredPhase={3} requiredStep={2}>
      <Phase3ValuationClient />
    </RouteGuard>
  );
}
