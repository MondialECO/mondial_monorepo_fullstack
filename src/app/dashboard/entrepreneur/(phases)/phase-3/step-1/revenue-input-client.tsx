'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Activity, ArrowRight } from 'lucide-react';
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
} from '@/components/entrepreneur/phase3/Phase3Ui';
import { PHASE_3_STEPS } from '@/components/entrepreneur/phase3/steps';
import entrepreneurApi, { type FinancialSummaryResponse } from '@/lib/api-entrepreneur';
import { Phase3Data } from '@/types/entrepreneur';

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
    if (totalRevenue <= 0) {
      const err = 'Enter quarterly revenue totalling more than 0';
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
      overallScore={25}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Complete Step 1 to unlock the automated valuation module."
    />
  );

  const hasValuation = !!financial && financial.finalValuation > 0;

  return (
    <EntrepreneurLayout sidebar={sidebar}>
      <Phase3Container
        crumbs={['Entrepreneur Verification', 'Revenue Input']}
        title="Revenue Input"
        subtitle="Please provide your company's revenue data for the last four quarters to calculate your valuation."
      >
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Quarterly revenue + recalculate */}
          <Surface className="p-5 flex flex-col gap-6">
            <h2 className="text-lg font-semibold text-foreground">Quarterly Revenue (EUR)</h2>
            <div className="space-y-4">
              {QUARTERS.map(([label, key]) => (
                <div key={key}>
                  <label
                    htmlFor={`rev-${key}`}
                    className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2"
                  >
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
                    ? `${financial.growthRate > 0 ? '+' : ''}${(financial.growthRate * 100).toFixed(1)}% Yearly Growth`
                    : 'Awaiting calculation'
                }
                sub={
                  hasValuation
                    ? `Estimated valuation €${(financial!.finalValuation / 1000).toFixed(1)}K`
                    : 'Strong year-over-year revenue scaling'
                }
              />
            </div>
          </div>
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
