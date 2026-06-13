'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Plus, Trash2, ShieldCheck, Activity, Users, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  InfoCallout,
  Chip,
} from '@/components/entrepreneur/phase3/Phase3Ui';
import { PHASE_3_STEPS } from '@/components/entrepreneur/phase3/steps';
import entrepreneurApi, { type FinancialSummaryResponse } from '@/lib/api-entrepreneur';
import { Phase3Data } from '@/types/entrepreneur';

type RoundType = 'pre_seed' | 'seed' | 'series_a';
type ShareType = 'preferred' | 'safe' | 'note';

interface AllocationRow {
  category: string;
  percent: string;
}

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

function Phase3ValuationClient() {
  const router = useRouter();
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  const [raiseAmount, setRaiseAmount] = useState('');
  const [roundType, setRoundType] = useState<RoundType>('pre_seed');
  const [preMoneyValuation, setPreMoneyValuation] = useState('');
  const [shareType, setShareType] = useState<ShareType>('preferred');
  const [allocations, setAllocations] = useState<AllocationRow[]>([
    { category: 'Product', percent: '' },
    { category: 'Sales & marketing', percent: '' },
    { category: 'Operations', percent: '' },
  ]);

  const [financial, setFinancial] = useState<FinancialSummaryResponse | null>(null);
  const [investorReady, setInvestorReady] = useState<boolean | null>(null);
  const [monthly, setMonthly] = useState<{ yearMonth: string; revenue: number }[]>([]);

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const [fin, mon] = await Promise.allSettled([
          entrepreneurApi.getFinancialSummary(companyId),
          entrepreneurApi.getMonthlyRevenue(companyId),
        ]);
        if (cancelled) return;
        if (fin.status === 'fulfilled') setFinancial(fin.value);
        if (mon.status === 'fulfilled') setMonthly(mon.value);
      } catch {
        // Silent — display falls back to honest empty states.
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

  const allocationTotal = allocations.reduce((sum, a) => sum + (parseFloat(a.percent) || 0), 0);
  const allocationValid = allocationTotal >= 95 && allocationTotal <= 105;

  const updateAllocation = (idx: number, patch: Partial<AllocationRow>) =>
    setAllocations((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const addAllocation = () => setAllocations((rs) => [...rs, { category: '', percent: '' }]);
  const removeAllocation = (idx: number) => setAllocations((rs) => rs.filter((_, i) => i !== idx));

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const handleNext = async () => {
    setValidationError('');
    const raise = parseFloat(raiseAmount);
    if (!Number.isFinite(raise) || raise <= 0) {
      setValidationError('Raise amount must be greater than 0');
      return;
    }
    const preMoney = parseFloat(preMoneyValuation);
    if (!Number.isFinite(preMoney) || preMoney <= 0) {
      setValidationError('Pre-money valuation must be greater than 0');
      return;
    }
    if (allocationTotal < 95 || allocationTotal > 105) {
      setValidationError(`Capital allocation must total ~100% (currently ${allocationTotal.toFixed(2)}%)`);
      return;
    }
    for (const a of allocations) {
      const p = parseFloat(a.percent);
      if (!a.category.trim() || !Number.isFinite(p) || p < 0) {
        setValidationError('Every allocation row needs a category and non-negative percent');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();
      await entrepreneurApi.saveFundingAsk(companyId, {
        raiseAmount: raise,
        roundType,
        preMoneyValuation: preMoney,
        shareType,
        capitalAllocation: allocations.map((a) => ({
          category: a.category.trim(),
          amount: (raise * parseFloat(a.percent)) / 100,
          percent: parseFloat(a.percent),
        })),
        resourceMap: { hiringPlan: [], serviceProviders: [], techTools: [] },
      });

      const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
      savePhaseData(3, { ...existing, __companyId: companyId, fundingAskSavedAt: new Date().toISOString() });
      moveToNextStep(3, 2);
      router.push('/dashboard/entrepreneur/phase-3/step-3');
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to save funding ask');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      overallScore={66}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Review your automated valuation and define your funding ask."
    />
  );

  const chartData = (monthly.length > 0
    ? monthly.slice(-4).map((m) => ({ label: m.yearMonth.slice(5), value: m.revenue }))
    : [
        { label: 'Q1', value: 0 },
        { label: 'Q2', value: 0 },
        { label: 'Q3', value: 0 },
        { label: 'Q4', value: 0 },
      ]);

  const hasValuation = !!financial && financial.finalValuation > 0;

  return (
    <EntrepreneurLayout sidebar={sidebar}>
      <Phase3Container
        crumbs={['Entrepreneur Verification', 'Automated Valuation']}
        title="Automated Valuation"
        subtitle="Your AI-estimated valuation is derived from the revenue you submitted and sector benchmarks. Define your funding ask to continue."
      >
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Left rail: ownership / multiplier / logic (backend-blocked shells) */}
          <div className="flex flex-col gap-4">
            <Surface className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" aria-hidden />
                <h2 className="text-sm font-semibold text-foreground">Beneficial Ownership</h2>
              </div>
              <p className="text-sm italic text-muted-foreground">
                Captured in Phase 4 (Cap Table). Not yet available.
              </p>
            </Surface>

            <Surface className="p-5 space-y-3">
              <label htmlFor="multiplier" className="block text-sm font-semibold text-foreground">
                Select Multiplier
              </label>
              <select
                id="multiplier"
                disabled
                className="h-10 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground"
                aria-label="Valuation multiplier (awaiting valuation engine)"
              >
                <option>Awaiting valuation engine</option>
              </select>
              <p className="text-xs text-muted-foreground">The sector multiplier is set by the backend valuation engine.</p>
            </Surface>

            <Surface className="p-5">
              <div className="flex gap-3">
                <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-foreground">Valuation Logic</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Valuation is advisory and computed from revenue, growth, and sector benchmarks. It is not a
                    binding offer or financial guarantee.
                  </p>
                </div>
              </div>
            </Surface>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Applicant header */}
            <Surface className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid place-items-center size-12 rounded-full bg-primary/10 text-primary shrink-0">
                  <Users className="w-5 h-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">Entrepreneur Verification</p>
                  <p className="text-[13px] text-muted-foreground truncate">Financial valuation review</p>
                </div>
              </div>
              <Chip tone="primary">Phase 3</Chip>
            </Surface>

            {/* Valuation summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricTile label="Annual Revenue" value={financial ? eur(financial.totalRevenue) : '—'} available={!!financial} />
              <MetricTile
                label="Average Growth"
                value={financial && financial.growthRate ? `${financial.growthRate > 0 ? '+' : ''}${financial.growthRate}%` : '—'}
                available={!!financial}
              />
              <div className="bg-primary text-primary-foreground rounded-2xl p-5 flex flex-col gap-3">
                <p className="text-xs uppercase tracking-wide opacity-80">Estimated Valuation</p>
                {hasValuation ? (
                  <p className="text-[28px] leading-9 font-semibold tabular-nums">{eur(financial!.finalValuation)}</p>
                ) : (
                  <p className="text-sm italic opacity-90">Awaiting calculation</p>
                )}
                <Chip tone="neutral">B2B SaaS Sector</Chip>
              </div>
            </div>

            {/* Revenue chart */}
            <Surface className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Revenue Growth Report Card</h2>
              <RevenueBars data={chartData} />
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
                value={financial && financial.growthRate ? `${financial.growthRate}% Yearly Growth` : 'Awaiting calculation'}
                sub="Strong year-over-year revenue scaling"
              />
            </div>
          </div>
        </div>

        {/* Detailed valuation breakdown (Final real; intermediates backend-blocked) */}
        <Surface className="p-6 mt-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Detailed valuation breakdown</h2>
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
                {[
                  ['Revenue Multiple', null, 'primary', 'Benchmark'],
                  ['Base Valuation', null, 'neutral', 'Computed'],
                  ['Growth Premium', null, 'success', 'Performance'],
                  ['Risk Discount', null, 'destructive', 'Adjustment'],
                ].map(([metric, , tone, cat]) => (
                  <tr key={metric as string} className="border-b border-border/60">
                    <td className="py-3 text-foreground">{metric}</td>
                    <td className="py-3 text-muted-foreground italic">Data unavailable</td>
                    <td className="py-3">
                      <Chip tone={tone as 'primary' | 'neutral' | 'success' | 'destructive'}>{cat as string}</Chip>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-3 font-semibold text-foreground">Final Valuation</td>
                  <td className="py-3 font-semibold text-foreground tabular-nums">
                    {hasValuation ? eur(financial!.finalValuation) : <span className="italic text-muted-foreground">Awaiting calculation</span>}
                  </td>
                  <td className="py-3">
                    <Chip tone="primary">Result</Chip>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Surface>

        {/* Investor insights (backend-blocked shell) */}
        <Surface className="p-6 mt-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">Investor Insights</h2>
          <p className="text-sm italic text-muted-foreground">
            No investor activity yet. Insights appear once your listing is published and investors engage (Phase 8).
          </p>
        </Surface>

        {/* Funding ask (the real submission for this step) */}
        <Surface className="p-6 mt-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Funding Ask</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="raise-amount" className="block text-sm font-medium text-foreground mb-2">Raise amount (€)</label>
              <Input id="raise-amount" type="number" min={0} value={raiseAmount} onChange={(e) => setRaiseAmount(e.target.value)} className="h-10" />
            </div>
            <div>
              <label htmlFor="pre-money" className="block text-sm font-medium text-foreground mb-2">Pre-money valuation (€)</label>
              <Input id="pre-money" type="number" min={0} value={preMoneyValuation} onChange={(e) => setPreMoneyValuation(e.target.value)} className="h-10" />
            </div>
            <div>
              <label htmlFor="round-type" className="block text-sm font-medium text-foreground mb-2">Round</label>
              <select
                id="round-type"
                value={roundType}
                onChange={(e) => setRoundType(e.target.value as RoundType)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="pre_seed">Pre-seed</option>
                <option value="seed">Seed</option>
                <option value="series_a">Series A</option>
              </select>
            </div>
            <div>
              <label htmlFor="share-type" className="block text-sm font-medium text-foreground mb-2">Share type</label>
              <select
                id="share-type"
                value={shareType}
                onChange={(e) => setShareType(e.target.value as ShareType)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="preferred">Preferred</option>
                <option value="safe">SAFE</option>
                <option value="note">Convertible note</option>
              </select>
            </div>
          </div>
        </Surface>

        {/* Capital allocation */}
        <Surface className="p-6 mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Capital allocation</h2>
            <Button variant="outline" size="sm" onClick={addAllocation} className="gap-2">
              <Plus className="w-4 h-4" aria-hidden /> Add category
            </Button>
          </div>
          <div className="space-y-2">
            {allocations.map((a, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <Input
                  type="text"
                  value={a.category}
                  onChange={(e) => updateAllocation(idx, { category: e.target.value })}
                  placeholder="Category"
                  aria-label={`Allocation ${idx + 1} category`}
                  className="col-span-7 h-9"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={a.percent}
                  onChange={(e) => updateAllocation(idx, { percent: e.target.value })}
                  placeholder="%"
                  aria-label={`Allocation ${idx + 1} percent`}
                  className="col-span-4 h-9"
                />
                <Button variant="ghost" size="sm" className="col-span-1" onClick={() => removeAllocation(idx)} aria-label={`Remove allocation ${idx + 1}`}>
                  <Trash2 className="w-4 h-4" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
          <p className={`text-sm font-semibold ${allocationValid ? 'text-primary' : 'text-destructive'}`} role="status" aria-live="polite">
            Total: {allocationTotal.toFixed(2)}%
          </p>
        </Surface>

        <div className="mt-4">
          <InfoCallout icon={AlertCircle} title="Advisory only">
            The estimated valuation is advisory and recomputed by the backend; it is not a binding offer. Your funding
            ask is saved on continue.
          </InfoCallout>
        </div>

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
