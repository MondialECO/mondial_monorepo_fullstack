'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Plus, Trash2, ShieldCheck, Activity, ArrowRight } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Phase3Container,
  Surface,
  IconStatCard,
  RevenueBars,
  InfoCallout,
} from '@/components/entrepreneur/phase3/Phase3Ui';
import { PHASE_3_STEPS } from '@/components/entrepreneur/phase3/steps';
import entrepreneurApi, { type FinancialSummaryResponse } from '@/lib/api-entrepreneur';
import { Phase3Data } from '@/types/entrepreneur';

interface MonthlyRow {
  yearMonth: string;
  revenue: string;
}

const QUARTERS = [
  ['Q1 Revenue (Jan – Mar)', 'q1'],
  ['Q2 Revenue (Apr – Jun)', 'q2'],
  ['Q3 Revenue (Jul – Sep)', 'q3'],
  ['Q4 Revenue (Oct – Dec)', 'q4'],
] as const;

export function Phase3RevenueInputClient() {
  const router = useRouter();
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');
  const [currentFunds, setCurrentFunds] = useState('');
  const [monthlyBurn, setMonthlyBurn] = useState('');
  const [monthlyRows, setMonthlyRows] = useState<MonthlyRow[]>([{ yearMonth: '', revenue: '' }]);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Real backend-derived status for the Verification + Financial Health cards.
  const [financial, setFinancial] = useState<FinancialSummaryResponse | null>(null);
  const [investorReady, setInvestorReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
        const prog = await entrepreneurApi.getCurrentPhase();
        const companyId = existing.__companyId ?? prog.companyId;
        if (cancelled) return;
        setInvestorReady(prog.isInvestorReady);
        if (!companyId) return;
        const [monthly, fin] = await Promise.allSettled([
          entrepreneurApi.getMonthlyRevenue(companyId),
          entrepreneurApi.getFinancialSummary(companyId),
        ]);
        if (cancelled) return;
        if (monthly.status === 'fulfilled' && monthly.value.length > 0) {
          setMonthlyRows(monthly.value.map((m) => ({ yearMonth: m.yearMonth, revenue: String(m.revenue) })));
        }
        if (fin.status === 'fulfilled') setFinancial(fin.value);
      } catch {
        // Silent — empty form is a fine fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getPhaseData]);

  if (!progress) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4"
        role="status"
        aria-live="polite"
      >
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  const qNum = (s: string) => {
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };
  const setters: Record<string, (v: string) => void> = { q1: setQ1, q2: setQ2, q3: setQ3, q4: setQ4 };
  const values: Record<string, string> = { q1, q2, q3, q4 };
  const totalRevenue = qNum(q1) + qNum(q2) + qNum(q3) + qNum(q4);

  const chartData = [
    { label: 'Q1', value: qNum(q1) },
    { label: 'Q2', value: qNum(q2) },
    { label: 'Q3', value: qNum(q3) },
    { label: 'Q4', value: qNum(q4) },
  ];

  const addMonthlyRow = () => setMonthlyRows((r) => [...r, { yearMonth: '', revenue: '' }]);
  const removeMonthlyRow = (idx: number) => setMonthlyRows((r) => r.filter((_, i) => i !== idx));
  const updateMonthlyRow = (idx: number, patch: Partial<MonthlyRow>) =>
    setMonthlyRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  function validate(): string | null {
    if (totalRevenue <= 0) return 'Enter quarterly revenue totalling more than 0';
    const cf = parseFloat(currentFunds);
    const mb = parseFloat(monthlyBurn);
    if (!Number.isFinite(cf) || cf < 0) return 'Current cash on hand must be 0 or greater';
    if (!Number.isFinite(mb) || mb <= 0) return 'Monthly burn must be greater than 0';
    const cleaned = monthlyRows
      .map((r) => ({ yearMonth: r.yearMonth.trim(), revenue: r.revenue.trim() }))
      .filter((r) => r.yearMonth || r.revenue);
    for (const row of cleaned) {
      if (!/^\d{4}-\d{2}$/.test(row.yearMonth)) return `Monthly entry "${row.yearMonth}" must be YYYY-MM`;
      const rev = parseFloat(row.revenue);
      if (!Number.isFinite(rev) || rev < 0) return `Monthly revenue for ${row.yearMonth} must be a non-negative number`;
    }
    return null;
  }

  async function persistAndCalculate(navigate: boolean) {
    setValidationError('');
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    if (navigate) setIsSubmitting(true);
    else setIsRecalculating(true);
    try {
      const companyId = await resolveCompanyId();
      await entrepreneurApi.saveRevenue(companyId, {
        q1Revenue: qNum(q1),
        q2Revenue: qNum(q2),
        q3Revenue: qNum(q3),
        q4Revenue: qNum(q4),
      });
      await entrepreneurApi.saveCashPosition(companyId, {
        currentFunds: parseFloat(currentFunds),
        monthlyBurn: parseFloat(monthlyBurn),
      });
      const cleanedMonthly = monthlyRows
        .map((r) => ({ yearMonth: r.yearMonth.trim(), revenue: r.revenue.trim() }))
        .filter((r) => r.yearMonth || r.revenue);
      if (cleanedMonthly.length > 0) {
        await entrepreneurApi.saveMonthlyRevenue(companyId, {
          entries: cleanedMonthly.map((r) => ({ yearMonth: r.yearMonth, revenue: parseFloat(r.revenue) })),
        });
      }
      await entrepreneurApi.calculateValuation(companyId);

      // Refresh the verification + health cards with freshly computed values.
      try {
        const fin = await entrepreneurApi.getFinancialSummary(companyId);
        setFinancial(fin);
      } catch {
        /* health cards keep their prior state */
      }

      const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
      savePhaseData(3, {
        ...existing,
        __companyId: companyId,
        revenueSavedAt: new Date().toISOString(),
        cashPositionSavedAt: new Date().toISOString(),
        valuationCalculatedAt: new Date().toISOString(),
      });

      if (navigate) {
        moveToNextStep(3, 1);
        router.push('/dashboard/entrepreneur/phase-3/step-2');
      }
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to save financial data');
    } finally {
      setIsSubmitting(false);
      setIsRecalculating(false);
    }
  }

  const statusMap = {
    1: progress.completedSteps.has('3-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending',
    2: progress.completedSteps.has('3-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending',
    3: progress.completedSteps.has('3-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending',
  } as const;
  const stepIndicators = PHASE_3_STEPS.map((s) => ({
    ...s,
    status: statusMap[s.step as 1 | 2 | 3] as 'completed' | 'current' | 'pending',
  }));

  const sidebar = (
    <ProgressSidebar
      title="Verification Progress"
      steps={stepIndicators}
      overallScore={33}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Complete Step 1 to unlock the automated valuation module."
    />
  );

  const hasValuation = !!financial && financial.finalValuation > 0;

  return (
    <EntrepreneurLayout sidebar={sidebar}>
      <Phase3Container
        crumbs={['Entrepreneur Verification', 'Financial Valuation']}
        title="Revenue Input"
        subtitle="Please provide your company's revenue data for the last four quarters to calculate your valuation."
      >
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Quarterly revenue + recalculate */}
          <Surface className="p-5 flex flex-col gap-6">
            <h2 className="text-lg font-semibold text-foreground">Quarterly Revenue (EUR)</h2>
            <div className="space-y-4">
              {QUARTERS.map(([label, key]) => (
                <div key={key}>
                  <label htmlFor={`rev-${key}`} className="block text-sm font-medium text-foreground mb-2">
                    {label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden>
                      €
                    </span>
                    <Input
                      id={`rev-${key}`}
                      type="number"
                      min={0}
                      value={values[key]}
                      onChange={(e) => setters[key](e.target.value)}
                      placeholder="0.00"
                      aria-label={`${label} in euros`}
                      className="h-10 pl-7"
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => persistAndCalculate(false)}
              disabled={isRecalculating || isSubmitting}
              className="w-full gap-2"
            >
              {isRecalculating ? 'Recalculating…' : 'Recalculate'}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Button>
          </Surface>

          {/* Report card + health */}
          <div className="flex flex-col gap-4">
            <Surface className="p-6 lg:p-8 flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-6">Revenue Growth Report Card</h2>
              <RevenueBars data={chartData} />
            </Surface>
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
                value={
                  financial && financial.growthRate
                    ? `${financial.growthRate > 0 ? '+' : ''}${financial.growthRate}% Yearly Growth`
                    : 'Awaiting calculation'
                }
                sub={
                  hasValuation
                    ? `Estimated valuation €${(financial!.finalValuation / 1000).toFixed(1)}K`
                    : 'Computed after you recalculate'
                }
              />
            </div>
          </div>
        </div>

        {/* Cash position + monthly breakdown (required by backend, not in hero) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <Surface className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Cash Position</h2>
            <div>
              <label htmlFor="current-funds" className="block text-sm font-medium text-foreground mb-2">
                Current cash on hand (EUR)
              </label>
              <Input
                id="current-funds"
                type="number"
                min={0}
                value={currentFunds}
                onChange={(e) => setCurrentFunds(e.target.value)}
                placeholder="0"
                className="h-10"
              />
            </div>
            <div>
              <label htmlFor="monthly-burn" className="block text-sm font-medium text-foreground mb-2">
                Monthly burn (EUR)
              </label>
              <Input
                id="monthly-burn"
                type="number"
                min={0}
                value={monthlyBurn}
                onChange={(e) => setMonthlyBurn(e.target.value)}
                placeholder="0"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground mt-1">Runway is derived backend-side from cash and burn.</p>
            </div>
            <p className="text-sm text-foreground pt-2 border-t border-border">
              Total entered revenue:{' '}
              <span className="font-semibold tabular-nums">€{(totalRevenue / 1000).toFixed(1)}K</span>
            </p>
          </Surface>

          <Surface className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Monthly revenue (optional)</h2>
              <Button variant="outline" size="sm" className="gap-2" onClick={addMonthlyRow}>
                <Plus className="w-4 h-4" aria-hidden /> Add month
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Add monthly breakdowns for a finer-grained picture. YYYY-MM format.</p>
            <div className="space-y-3">
              {monthlyRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <Input
                    type="text"
                    value={row.yearMonth}
                    onChange={(e) => updateMonthlyRow(idx, { yearMonth: e.target.value })}
                    placeholder="2026-04"
                    aria-label={`Month ${idx + 1} (YYYY-MM)`}
                    className="col-span-5 h-10"
                  />
                  <div className="col-span-6 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden>
                      €
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={row.revenue}
                      onChange={(e) => updateMonthlyRow(idx, { revenue: e.target.value })}
                      placeholder="0"
                      aria-label={`Month ${idx + 1} revenue in euros`}
                      className="h-10 pl-7"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="col-span-1"
                    onClick={() => removeMonthlyRow(idx)}
                    aria-label={`Remove month ${idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          </Surface>
        </div>

        <div className="mt-4">
          <InfoCallout icon={AlertCircle} title="Submission, not verification">
            Saving submits your financials for compliance review. Valuation is calculated by the backend; no
            insights are shown until they exist.
          </InfoCallout>
        </div>

        <div className="mt-6">
          <StepFooter
            backUrl="/dashboard/entrepreneur/phase-2"
            onNextClick={() => persistAndCalculate(true)}
            isLoading={isSubmitting}
            nextLabel="Save &amp; Continue"
            nextValidationError={validationError}
          />
        </div>
      </Phase3Container>
    </EntrepreneurLayout>
  );
}
