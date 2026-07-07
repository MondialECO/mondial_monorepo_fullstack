'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { Phase3Container, Surface, Chip } from '@/components/entrepreneur/phase3/Phase3Ui';
import { PHASE_3_STEPS } from '@/components/entrepreneur/phase3/steps';
import { cn } from '@/lib/utils';
import entrepreneurApi, { type FinancialSummaryResponse } from '@/lib/api-entrepreneur';
import { Phase3Data } from '@/types/entrepreneur';

function Phase3KpiTrackerClient() {
  const router = useRouter();
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  const [mrr, setMrr] = useState('');
  const [monthlyBurn, setMonthlyBurn] = useState('');
  const [cac, setCac] = useState('');
  const [ltv, setLtv] = useState('');
  const [churn, setChurn] = useState('');
  const [nps, setNps] = useState('');

  const [financial, setFinancial] = useState<FinancialSummaryResponse | null>(null);

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
        const prog = await entrepreneurApi.getCurrentPhase();
        const companyId = existing.__companyId ?? prog.companyId;
        if (!companyId) return;
        const [fin, kpi] = await Promise.allSettled([
          entrepreneurApi.getFinancialSummary(companyId),
          entrepreneurApi.getKpiBaseline(companyId),
        ]);
        if (cancelled) return;
        if (fin.status === 'fulfilled') setFinancial(fin.value);
        // Prefill from a previously saved KPI baseline so returning users
        // don't re-type everything. All fields (including burnRate and nps) are
        // now persisted in the API response.
        if (kpi.status === 'fulfilled' && kpi.value) {
          const k = kpi.value;
          if (k.mrr) setMrr(String(k.mrr));
          if (k.cac) setCac(String(k.cac));
          if (k.ltv) setLtv(String(k.ltv));
          if (k.churnPercent != null) setChurn(String(k.churnPercent));
          if (k.burnRate != null) setMonthlyBurn(String(k.burnRate));
          if (k.nps != null) setNps(String(k.nps));
        }
      } catch {
        // fall through; user can still enter metrics
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getPhaseData]);

  if (!progress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" role="status" aria-live="polite">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  const num = (s: string) => (Number.isFinite(parseFloat(s)) ? parseFloat(s) : null);

  // Locked / derived values (honest: shown only when computable).
  const arrValue = num(mrr) != null ? num(mrr)! * 12 : null;
  const runwayValue = financial && financial.runwayMonths > 0 ? financial.runwayMonths : null;

  // Health indicators (honest — only render values we can derive).
  const ltvCac = num(ltv) != null && num(cac) != null && num(cac)! > 0 ? num(ltv)! / num(cac)! : null;

  // Revenue growth from the canonical backend value (avg quarterly growth,
  // returned as a fraction → ×100 for percent). Matches the valuation engine.
  const revenueGrowth =
    financial && financial.growthRate != null ? financial.growthRate * 100 : null;

  // Burn multiple = monthly burn / monthly recurring revenue (≡ burn / (ARR/12)).
  // Mirrors the backend matchmaking formula in Phase3CompletionEvents.
  const burnMultiple =
    num(monthlyBurn) != null && num(mrr) != null && num(mrr)! > 0
      ? num(monthlyBurn)! / num(mrr)!
      : null;

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const handleNext = async () => {
    setValidationError('');
    const mrrN = num(mrr), burnN = num(monthlyBurn), cacN = num(cac), ltvN = num(ltv), churnN = num(churn), npsN = num(nps);
    if (
      mrrN == null || mrrN < 0 || burnN == null || burnN < 0 ||
      cacN == null || cacN <= 0 || ltvN == null || ltvN < 0 ||
      churnN == null || churnN < 0 || churnN > 100 || npsN == null || npsN < 0 || npsN > 100
    ) {
      setValidationError('Fill every KPI field with a valid number (CAC > 0, churn 0–100%, NPS 0–100)');
      return;
    }
    if (mrrN <= 0) {
      setValidationError('Monthly Recurring Revenue must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();
      // saveKpiBaseline carries the fields the backend models. Gross margin and
      // active accounts aren't collected in the new design, so default them; the
      // backend only requires one of MRR/ARR/accounts > 0 (MRR satisfies it).
      await entrepreneurApi.saveKpiBaseline(companyId, {
        mrr: mrrN,
        arr: mrrN * 12,
        grossMarginPercent: 0,
        cac: cacN,
        ltv: ltvN,
        churnPercent: churnN,
        activeAccounts: 0,
        burnRate: burnN,
        nps: npsN,
      });

      const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
      savePhaseData(3, {
        ...existing,
        __companyId: companyId,
        kpiBaselineSavedAt: new Date().toISOString(),
        burnRate: burnN,
        nps: npsN,
      });
      moveToNextStep(3, 3);
      router.push('/dashboard/entrepreneur/phase-3/step-4');
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to save KPI baseline');
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
      overallScore={75}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Enter your KPI baseline, then describe your concept to complete Phase 3."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebar}>
      <Phase3Container
        crumbs={['Entrepreneur Verification', 'Live KPI Tracking']}
        title="KPI & Traction Metrics"
        subtitle="Connect your revenue tools or enter key metrics manually to establish an accurate traction profile."
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          {/* Left: integrations + manual KPI entry */}
          <div className="flex flex-col gap-4">
            {/* Connect Revenue tools */}
            <Surface className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Connect Revenue tools</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <IntegrationCard letter="S" name="Stripe" colorClass="text-orange-500 border-orange-500/40" buttonClass="bg-orange-500 text-white" />
                <IntegrationCard letter="C" name="ChartMogul" colorClass="text-purple-600 border-purple-600/40" buttonClass="bg-purple-600 text-white" />
              </div>
              <div className="flex items-center gap-3 my-5" aria-hidden>
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">OR</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t use these tools? Enter your metrics manually below.
              </p>
            </Surface>

            {/* Manual KPI Entry */}
            <Surface className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Manual KPI Entry</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <KpiField id="mrr" label="Monthly Recurring Revenue (MRR)" value={mrr} onChange={setMrr} prefix="€" />
                <KpiField id="arr" label="Annual Recurring Revenue (ARR)" value={arrValue != null ? String(arrValue) : ''} prefix="€" locked lockedHint="Auto-calculated (MRR × 12)" />
                <KpiField id="burn" label="Monthly Burn Rate" value={monthlyBurn} onChange={setMonthlyBurn} prefix="€" />
                <KpiField id="runway" label="Runway (Months)" value={runwayValue != null ? String(runwayValue) : ''} locked lockedHint="Derived from revenue & burn" />
                <KpiField id="cac" label="Customer Acquisition Cost (CAC)" value={cac} onChange={setCac} prefix="€" />
                <KpiField id="ltv" label="Lifetime Value (LTV)" value={ltv} onChange={setLtv} prefix="€" />
                <KpiField id="churn" label="Monthly Churn Rate" value={churn} onChange={setChurn} suffix="%" />
                <KpiField id="nps" label="Net Promoter Score (NPS)" value={nps} onChange={setNps} />
              </div>
            </Surface>
          </div>

          {/* Right rail */}
          <div className="flex flex-col gap-4">
            <Surface className="p-5 space-y-4">
              <h2 className="text-base font-semibold text-foreground">Health Indicators</h2>
              <HealthRow label="LTV/CAC Ratio" value={ltvCac != null ? `${ltvCac.toFixed(1)}x` : null} badge={ltvCac != null ? (ltvCac >= 3 ? 'Excellent' : ltvCac >= 1 ? 'Efficient' : 'Low') : null} tone={ltvCac != null && ltvCac >= 3 ? 'success' : ltvCac != null && ltvCac >= 1 ? 'primary' : 'destructive'} />
              <HealthRow label="Burn Multiple" value={burnMultiple != null ? `${burnMultiple.toFixed(1)}x` : null} badge={burnMultiple != null ? (burnMultiple <= 1 ? 'Efficient' : burnMultiple <= 2 ? 'Moderate' : 'High') : null} tone={burnMultiple != null && burnMultiple <= 1 ? 'success' : burnMultiple != null && burnMultiple <= 2 ? 'primary' : 'destructive'} />
              <HealthRow label="Revenue Growth" value={revenueGrowth != null ? `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(2)}%` : null} badge={revenueGrowth != null ? (revenueGrowth >= 0 ? 'Efficient' : 'Declining') : null} tone={revenueGrowth != null && revenueGrowth >= 0 ? 'success' : 'destructive'} />
            </Surface>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex gap-3">
              <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-primary mb-1">Why we need this information</p>
                <p className="text-[13px] text-muted-foreground">
                  Investors rely on standardized traction metrics to benchmark your performance against peers.
                  Consistent KPI tracking demonstrates operational maturity and significantly increases valuation
                  confidence.
                </p>
              </div>
            </div>

            <div className="bg-success-light border border-success-text/20 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold text-success-text">Complete Phase 3 to unlock Phase 4 — Equity Structure</p>
              <p className="text-[13px] text-muted-foreground">Finish the concept overview next to finalise your valuation profile.</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <StepFooter
            backUrl="/dashboard/entrepreneur/phase-3/step-2"
            onNextClick={handleNext}
            isLoading={isSubmitting}
            nextLabel="Concept Overview"
            nextValidationError={validationError}
          />
        </div>
      </Phase3Container>
    </EntrepreneurLayout>
  );
}

/* ---- Local presentational helpers --------------------------------------- */

function IntegrationCard({
  letter,
  name,
  colorClass,
  buttonClass,
}: {
  letter: string;
  name: string;
  colorClass: string;
  buttonClass: string;
}) {
  return (
    <div className="border border-border bg-popover rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
      <span className={cn('grid place-items-center size-12 rounded-full border-2 text-lg font-bold', colorClass)}>
        {letter}
      </span>
      <p className="text-sm font-semibold text-foreground">{name}</p>
      <Chip tone="neutral">Not Connected</Chip>
      <Button
        type="button"
        disabled
        className={cn('w-full', buttonClass)}
      >
        Connect {name}
      </Button>
    </div>
  );
}

function KpiField({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  locked = false,
  lockedHint,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  prefix?: string;
  suffix?: string;
  locked?: boolean;
  lockedHint?: string;
}) {
  return (
    <div>
      <label htmlFor={`kpi-${id}`} className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <div className="relative bg-popover">
        {prefix ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden>
            {prefix}
          </span>
        ) : null}
        <Input
          id={`kpi-${id}`}
          type="number"
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={locked}
          disabled={locked}
          placeholder={locked ? '—' : '0'}
          aria-label={lockedHint ? `${label} — ${lockedHint}` : label}
          className={cn('h-10', prefix && 'pl-7', (suffix || locked) && 'pr-16', locked && 'bg-muted text-muted-foreground')}
        />
        {locked ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            Locked <Lock className="w-3 h-3" aria-hidden />
          </span>
        ) : suffix ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden>
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function HealthRow({
  label,
  value,
  badge,
  tone,
}: {
  label: string;
  value: string | null;
  badge: string | null;
  tone: 'success' | 'primary' | 'destructive' | 'neutral';
}) {
  return (
    <div className="bg-popover border border-border rounded-xl p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground tabular-nums">
          {value ?? <span className="text-sm italic font-normal text-muted-foreground">Data unavailable</span>}
        </p>
      </div>
      {badge ? <Chip tone={tone}>{badge}</Chip> : null}
    </div>
  );
}

export default function Phase3Step3Page() {
  return (
    <RouteGuard requiredPhase={3} requiredStep={3}>
      <Phase3KpiTrackerClient />
    </RouteGuard>
  );
}
