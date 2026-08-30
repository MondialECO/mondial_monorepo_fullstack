'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Activity, ArrowRight, AlertCircle } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PHASE_3_STEPS } from '@/components/entrepreneur/phase3/steps';
import { Surface, RevenueBars } from '@/components/entrepreneur/phase3/Phase3Ui';
import entrepreneurApi, { type FinancialSummaryResponse } from '@/lib/api-entrepreneur';
import { Phase3Data } from '@/types/entrepreneur';

const QUARTERS = [
  { label: 'Q1 Revenue (Jan – Mar)', key: 'q1' },
  { label: 'Q2 Revenue (Apr – Jun)', key: 'q2' },
  { label: 'Q3 Revenue (Jul – Sep)', key: 'q3' },
  { label: 'Q4 Revenue (Oct – Dec)', key: 'q4' },
] as const;

export function Phase3RevenueInputClient() {
  const router = useRouter();
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');
  const [validationError, setValidationError] = useState('');
  const [recalcError, setRecalcError] = useState('');
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
        const fin = await entrepreneurApi.getFinancialSummary(companyId);
        if (!cancelled) setFinancial(fin);
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

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  async function persistAndCalculate(navigate: boolean) {
    setValidationError('');
    setRecalcError('');
    if (qNum(q1) < 0 || qNum(q2) < 0 || qNum(q3) < 0 || qNum(q4) < 0) {
      const err = 'Quarterly revenue amounts cannot be negative';
      if (navigate) setValidationError(err);
      else setRecalcError(err);
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
        valuationCalculatedAt: new Date().toISOString(),
      });

      if (navigate) {
        moveToNextStep(3, 1);
        router.push('/dashboard/entrepreneur/phase-3/step-2');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save financial data';
      if (navigate) setValidationError(msg);
      else setRecalcError(msg);
    } finally {
      setIsSubmitting(false);
      setIsRecalculating(false);
    }
  }

  const hasValuation = !!financial && financial.finalValuation > 0;

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

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
      {/* Left: Progress Sidebar */}
      <div className="hidden w-80 flex-shrink-0 lg:block">
        <ProgressSidebar
          title="Verification Progress"
          steps={stepIndicators}
          overallScore={25}
          scoreLabel="OVERALL SCORE"
          scoreDescription="Complete Step 1 to unlock the automated valuation module."
        />
      </div>

      {/* Right: Main Card */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-8 bg-card border-2 border-background rounded-[20px] shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-border p-6">
          <h1 className="text-2xl sm:text-3xl font-medium text-foreground leading-tight">Revenue Input</h1>
          <p className="text-sm text-muted-foreground">
            Please provide your company's revenue data for the last four quarters to calculate your valuation.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6 px-6 md:grid-cols-[300px_1fr]">
          {/* Left: Quarterly Revenue Inputs */}
          <div className="space-y-4 bg-popover border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground">Quarterly Revenue (EUR)</h2>
            <div className="space-y-3">
              {QUARTERS.map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    {label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                    <Input
                      type="number"
                      min={0}
                      value={values[key]}
                      onChange={(e) => setters[key](e.target.value)}
                      placeholder="0.00"
                      className="h-10 pl-7 bg-popover border-border rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </div>
            {totalRevenue === 0 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-primary block mb-0.5">Pre-Revenue Company</span>
                Revenue has not started yet. You can still complete your financial baseline and valuation readiness.
              </div>
            )}
            {recalcError && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {recalcError}
              </div>
            )}
            <Button
              onClick={() => persistAndCalculate(false)}
              disabled={isRecalculating || isSubmitting}
              className="w-full gap-2"
            >
              {isRecalculating ? 'Recalculating…' : 'Recalculate'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Right: Revenue Chart & Health Cards */}
          <div className="flex flex-col gap-4">
            {/* Chart */}
            <Surface className="p-6 lg:p-8 flex-1 bg-popover">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Revenue Growth Report Card</h2>
                {totalRevenue === 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium text-muted-foreground">
                    Pre-Revenue Baseline
                  </span>
                )}
              </div>
              <RevenueBars data={chartData} />
            </Surface>

            {/* Health Cards */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 rounded-lg border border-border bg-popover p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">VERIFICATION STATUS</p>
                    <p className="text-sm font-semibold text-foreground">
                      {investorReady == null ? '—' : investorReady ? 'Institutional Ready' : 'Pending Review'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 rounded-lg border border-border bg-popover p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">FINANCIAL HEALTH</p>
                    <p className="text-sm font-semibold text-foreground">
                      {financial && financial.growthRate
                        ? `${financial.growthRate > 0 ? '+' : ''}${(financial.growthRate * 100).toFixed(1)}% Growth`
                        : 'Awaiting calculation'}
                    </p>
                  </div>
                </div>
                {hasValuation && (
                  <p className="text-xs text-muted-foreground">
                    Estimated valuation €{(financial!.finalValuation / 1000).toFixed(1)}K
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {validationError && (
          <div className="mx-6 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {validationError}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-background p-6">
          <button
            onClick={() => router.push('/dashboard/entrepreneur/phase-3')}
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Back
          </button>
          <Button
            onClick={() => persistAndCalculate(true)}
            disabled={isSubmitting}
            className="gap-2 px-6"
          >
            {isSubmitting ? 'Saving…' : 'Save & Continue'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
