'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { TrendingUp, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import entrepreneurApi from '@/lib/api-entrepreneur';
import { Phase3Data } from '@/types/entrepreneur';

const PHASE_3_STEPS = [
  { step: 1 as const, title: 'Revenue & Cash', subtitle: 'Financial baseline' },
  { step: 2 as const, title: 'Equity Structure', subtitle: 'Cap table setup' },
  { step: 3 as const, title: 'Funding & KPI', subtitle: 'Ask, KPI, reports' },
];

interface MonthlyRow {
  yearMonth: string;
  revenue: string;
}

export function Phase3RevenueInputClient() {
  const router = useRouter();
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');
  const [currentFunds, setCurrentFunds] = useState('');
  const [monthlyBurn, setMonthlyBurn] = useState('');
  const [monthlyRows, setMonthlyRows] = useState<MonthlyRow[]>([
    { yearMonth: '', revenue: '' },
  ]);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hydrate from backend if a monthly series exists.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
        const companyId =
          existing.__companyId ?? (await entrepreneurApi.getCurrentPhase()).companyId;
        if (!companyId) return;
        const monthly = await entrepreneurApi.getMonthlyRevenue(companyId);
        if (cancelled) return;
        if (monthly.length > 0) {
          setMonthlyRows(
            monthly.map((m) => ({ yearMonth: m.yearMonth, revenue: String(m.revenue) })),
          );
        }
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
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <p className="text-neutral-5 text-sm">Loading…</p>
      </div>
    );
  }

  const qNum = (s: string) => {
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };
  const totalRevenue = qNum(q1) + qNum(q2) + qNum(q3) + qNum(q4);

  const chartData = [
    { quarter: 'Q1', revenue: qNum(q1) },
    { quarter: 'Q2', revenue: qNum(q2) },
    { quarter: 'Q3', revenue: qNum(q3) },
    { quarter: 'Q4', revenue: qNum(q4) },
  ];

  const addMonthlyRow = () =>
    setMonthlyRows((r) => [...r, { yearMonth: '', revenue: '' }]);
  const removeMonthlyRow = (idx: number) =>
    setMonthlyRows((r) => r.filter((_, i) => i !== idx));
  const updateMonthlyRow = (idx: number, patch: Partial<MonthlyRow>) =>
    setMonthlyRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const progressFromServer = await entrepreneurApi.getCurrentPhase();
    if (!progressFromServer?.companyId) throw new Error('No company found in backend');
    return progressFromServer.companyId;
  }

  const handleNextClick = async () => {
    setValidationError('');

    // Client-side guardrails (validator is the authority; this is just UX).
    if (totalRevenue <= 0) {
      setValidationError('Enter quarterly revenue totalling more than 0');
      return;
    }
    const cf = parseFloat(currentFunds);
    const mb = parseFloat(monthlyBurn);
    if (!Number.isFinite(cf) || cf < 0) {
      setValidationError('Current cash on hand must be 0 or greater');
      return;
    }
    if (!Number.isFinite(mb) || mb <= 0) {
      setValidationError('Monthly burn must be greater than 0');
      return;
    }

    // Filter valid monthly rows (optional in P0, but if any row is partially
    // filled we surface the error rather than silently skip).
    const cleanedMonthly = monthlyRows
      .map((r) => ({ yearMonth: r.yearMonth.trim(), revenue: r.revenue.trim() }))
      .filter((r) => r.yearMonth || r.revenue);
    for (const row of cleanedMonthly) {
      if (!/^\d{4}-\d{2}$/.test(row.yearMonth)) {
        setValidationError(`Monthly entry "${row.yearMonth}" must be YYYY-MM`);
        return;
      }
      const rev = parseFloat(row.revenue);
      if (!Number.isFinite(rev) || rev < 0) {
        setValidationError(`Monthly revenue for ${row.yearMonth} must be a non-negative number`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();

      await entrepreneurApi.saveRevenue(companyId, {
        q1Revenue: qNum(q1),
        q2Revenue: qNum(q2),
        q3Revenue: qNum(q3),
        q4Revenue: qNum(q4),
      });

      await entrepreneurApi.saveCashPosition(companyId, {
        currentFunds: cf,
        monthlyBurn: mb,
      });

      if (cleanedMonthly.length > 0) {
        await entrepreneurApi.saveMonthlyRevenue(companyId, {
          entries: cleanedMonthly.map((r) => ({
            yearMonth: r.yearMonth,
            revenue: parseFloat(r.revenue),
          })),
        });
      }

      await entrepreneurApi.calculateValuation(companyId);

      const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
      savePhaseData(3, {
        ...existing,
        __companyId: companyId,
        revenueSavedAt: new Date().toISOString(),
        cashPositionSavedAt: new Date().toISOString(),
        valuationCalculatedAt: new Date().toISOString(),
      });
      moveToNextStep(3, 1);
      router.push('/dashboard/entrepreneur/phase-3/step-2');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save financial data';
      setValidationError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusMap = {
    1: progress.completedSteps.has('3-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending',
    2: progress.completedSteps.has('3-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending',
    3: progress.completedSteps.has('3-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending',
  };
  const stepIndicators = PHASE_3_STEPS.map((step) => ({
    ...step,
    status: statusMap[step.step as keyof typeof statusMap] as 'completed' | 'current' | 'pending',
  }));

  const sidebarContent = (
    <ProgressSidebar
      title="Financial Submission"
      steps={stepIndicators}
      overallScore={33}
      scoreLabel="STEP"
      scoreDescription="Submit revenue and cash position to continue."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebarContent}>
      <div className="space-y-4 md:space-y-6">
        <PhaseHeader
          title="Revenue &amp; Cash Position"
          subtitle="Enter quarterly revenue and your current cash position. This data is submitted to the backend and used to calculate your valuation."
          progressLabel="PROGRESS"
          progressValue="Step 1 of 3"
          progressPercentage={33}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-1 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Quarterly Revenue (EUR)
                </h3>
                <div className="space-y-4">
                  {(
                    [
                      ['Q1', q1, setQ1],
                      ['Q2', q2, setQ2],
                      ['Q3', q3, setQ3],
                      ['Q4', q4, setQ4],
                    ] as const
                  ).map(([label, value, setter]) => (
                    <div key={label}>
                      <label className="block text-sm font-semibold text-neutral-1 mb-2">
                        {label}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-5">€</span>
                        <Input
                          type="number"
                          min={0}
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          placeholder="0"
                          className="h-10 bg-background border-neutral-2 placeholder:text-neutral-5 flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-neutral-2 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5">
                  Total entered
                </p>
                <p className="text-2xl font-bold text-neutral-1">
                  €{(totalRevenue / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-neutral-5">Computed locally from inputs.</p>
              </div>
            </div>

            <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-neutral-1">Cash position</h3>
              <div>
                <label className="block text-sm font-semibold text-neutral-1 mb-2">
                  Current cash on hand (EUR)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={currentFunds}
                  onChange={(e) => setCurrentFunds(e.target.value)}
                  placeholder="0"
                  className="h-10 bg-background border-neutral-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-1 mb-2">
                  Monthly burn (EUR)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={monthlyBurn}
                  onChange={(e) => setMonthlyBurn(e.target.value)}
                  placeholder="0"
                  className="h-10 bg-background border-neutral-2"
                />
                <p className="text-xs text-neutral-5 mt-1">
                  Runway is derived backend-side from cash and burn.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-neutral-1 mb-4">Quarterly trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="quarter" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip
                    formatter={(value) =>
                      typeof value === 'number' ? `€${(value / 1000).toFixed(1)}K` : String(value)
                    }
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-neutral-5 mt-2">
                Chart reflects what you have entered above. No precomputed numbers are shown.
              </p>
            </div>

            <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-1">Monthly revenue (optional)</h3>
                <Button variant="outline" size="sm" className="gap-2" onClick={addMonthlyRow}>
                  <Plus className="w-4 h-4" /> Add month
                </Button>
              </div>
              <p className="text-sm text-neutral-5">
                Add monthly breakdowns to give reviewers a finer-grained picture. YYYY-MM format.
              </p>
              <div className="space-y-3">
                {monthlyRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <Input
                      type="text"
                      value={row.yearMonth}
                      onChange={(e) => updateMonthlyRow(idx, { yearMonth: e.target.value })}
                      placeholder="2026-04"
                      className="col-span-5 h-10 bg-background border-neutral-2"
                    />
                    <div className="col-span-6 flex items-center gap-2">
                      <span className="text-sm text-neutral-5">€</span>
                      <Input
                        type="number"
                        min={0}
                        value={row.revenue}
                        onChange={(e) => updateMonthlyRow(idx, { revenue: e.target.value })}
                        placeholder="0"
                        className="h-10 bg-background border-neutral-2 flex-1"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="col-span-1"
                      onClick={() => removeMonthlyRow(idx)}
                      aria-label="Remove month"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Submission, not verification</p>
                <p className="text-sm text-blue-800">
                  Saving this data submits your financials for compliance review. Valuation is calculated
                  by the backend; no insights are shown until they exist.
                </p>
              </div>
            </div>
          </div>
        </div>

        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-2"
          onNextClick={handleNextClick}
          isLoading={isSubmitting}
          nextLabel="Save &amp; Continue"
          nextValidationError={validationError}
        />
      </div>
    </EntrepreneurLayout>
  );
}
