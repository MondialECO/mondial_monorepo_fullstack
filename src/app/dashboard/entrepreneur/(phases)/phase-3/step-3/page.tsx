'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileText, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import entrepreneurApi, {
  FinancialReportResponse,
} from '@/lib/api-entrepreneur';
import { Phase3Data } from '@/types/entrepreneur';

const PHASE_3_STEPS = [
  { step: 1 as const, title: 'Revenue & Cash', subtitle: 'Financial baseline' },
  { step: 2 as const, title: 'Equity Structure', subtitle: 'Cap table setup' },
  { step: 3 as const, title: 'Funding & KPI', subtitle: 'Ask, KPI, reports' },
];

const REQUIRED_REPORT_TYPES: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'pnl', label: 'P&L statement' },
  { id: 'balance', label: 'Balance sheet' },
];

type RoundType = 'pre_seed' | 'seed' | 'series_a';
type ShareType = 'preferred' | 'safe' | 'note';

interface AllocationRow {
  category: string;
  percent: string;
}

function Phase3Step3Client() {
  const router = useRouter();
  const {
    progress,
    savePhaseData,
    moveToNextStep,
    getPhaseData,
    applyBackendResponse,
  } = useEntrepreneurProgress();

  const [raiseAmount, setRaiseAmount] = useState('');
  const [roundType, setRoundType] = useState<RoundType>('pre_seed');
  const [preMoneyValuation, setPreMoneyValuation] = useState('');
  const [shareType, setShareType] = useState<ShareType>('preferred');
  const [allocations, setAllocations] = useState<AllocationRow[]>([
    { category: 'Product', percent: '' },
    { category: 'Sales & marketing', percent: '' },
    { category: 'Operations', percent: '' },
  ]);

  const [mrr, setMrr] = useState('');
  const [arr, setArr] = useState('');
  const [grossMargin, setGrossMargin] = useState('');
  const [cac, setCac] = useState('');
  const [ltv, setLtv] = useState('');
  const [churn, setChurn] = useState('');
  const [activeAccounts, setActiveAccounts] = useState('');

  const [reports, setReports] = useState<FinancialReportResponse[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
        const companyId =
          existing.__companyId ?? (await entrepreneurApi.getCurrentPhase()).companyId;
        if (!companyId) return;
        const list = await entrepreneurApi.getFinancialReports(companyId);
        if (!cancelled) setReports(list);
      } catch {
        // fall through; user can still upload
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

  const allocationTotal = allocations.reduce(
    (sum, a) => sum + (parseFloat(a.percent) || 0),
    0,
  );

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const updateAllocation = (idx: number, patch: Partial<AllocationRow>) =>
    setAllocations((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const addAllocation = () =>
    setAllocations((rs) => [...rs, { category: '', percent: '' }]);
  const removeAllocation = (idx: number) =>
    setAllocations((rs) => rs.filter((_, i) => i !== idx));

  const handleReportUpload = async (type: string, file: File) => {
    setValidationError('');
    setUploadingType(type);
    try {
      const companyId = await resolveCompanyId();
      const fd = new FormData();
      fd.append('file', file);
      fd.append('reportType', type);
      const uploaded = await entrepreneurApi.uploadFinancialReport(companyId, fd);
      setReports((prev) => [uploaded, ...prev]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to upload report';
      setValidationError(msg);
    } finally {
      setUploadingType(null);
    }
  };

  const handleSubmit = async () => {
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
      setValidationError(
        `Capital allocation must total ~100% (currently ${allocationTotal.toFixed(2)}%)`,
      );
      return;
    }
    for (const a of allocations) {
      const p = parseFloat(a.percent);
      if (!a.category.trim() || !Number.isFinite(p) || p < 0) {
        setValidationError('Every allocation row needs a category and non-negative percent');
        return;
      }
    }

    const mrrN = parseFloat(mrr);
    const arrN = parseFloat(arr);
    const gmN = parseFloat(grossMargin);
    const cacN = parseFloat(cac);
    const ltvN = parseFloat(ltv);
    const churnN = parseFloat(churn);
    const aaN = parseInt(activeAccounts, 10);
    if (!Number.isFinite(mrrN) || mrrN < 0 ||
        !Number.isFinite(arrN) || arrN < 0 ||
        !Number.isFinite(gmN) || gmN < -100 || gmN > 100 ||
        !Number.isFinite(cacN) || cacN < 0 ||
        !Number.isFinite(ltvN) || ltvN < 0 ||
        !Number.isFinite(churnN) || churnN < 0 || churnN > 100 ||
        !Number.isFinite(aaN) || aaN < 0) {
      setValidationError('Fill every KPI field with a valid non-negative number');
      return;
    }
    if (mrrN <= 0 && arrN <= 0 && aaN <= 0) {
      setValidationError('KPI baseline needs at least one of MRR, ARR, or active accounts > 0');
      return;
    }

    for (const required of REQUIRED_REPORT_TYPES) {
      const ok = reports.some(
        (r) => r.type.toLowerCase() === required.id && r.status !== 'rejected',
      );
      if (!ok) {
        setValidationError(`Upload your ${required.label} (and ensure it is not rejected)`);
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

      await entrepreneurApi.saveKpiBaseline(companyId, {
        mrr: mrrN,
        arr: arrN,
        grossMarginPercent: gmN,
        cac: cacN,
        ltv: ltvN,
        churnPercent: churnN,
        activeAccounts: aaN,
      });

      const advanceResponse = await entrepreneurApi.advancePhase(companyId, 3, {});
      if (advanceResponse?.currentPhase !== 4) {
        throw new Error(
          `Phase advancement failed - expected currentPhase=4, got ${advanceResponse?.currentPhase}`,
        );
      }
      if (!advanceResponse?.completedPhases?.includes(3)) {
        throw new Error('Phase 3 not marked as completed in backend response');
      }

      applyBackendResponse(advanceResponse);

      const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
      savePhaseData(3, {
        ...existing,
        __companyId: companyId,
        fundingAskSavedAt: new Date().toISOString(),
        kpiBaselineSavedAt: new Date().toISOString(),
        reportsSubmittedCount: reports.length,
        submittedAt: new Date().toISOString(),
      });
      moveToNextStep(3, 3);

      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-4');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to submit Phase 3';
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

  const sidebar = (
    <ProgressSidebar
      title="Financial Submission"
      steps={stepIndicators}
      overallScore={100}
      scoreLabel="STEP"
      scoreDescription="Submit funding ask, KPI baseline, and required reports."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebar}>
      <div className="space-y-4 md:space-y-6">
        <PhaseHeader
          title="Funding Ask, KPI &amp; Reports"
          subtitle="Submit your funding ask, KPI baseline, and required financial reports. Phase 3 completes only after the backend accepts everything."
          progressLabel="PROGRESS"
          progressValue="Step 3 of 3"
          progressPercentage={100}
        />

        {/* Funding ask */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-neutral-1">Funding ask</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-1 mb-2">Raise amount (€)</label>
              <Input
                type="number"
                min={0}
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(e.target.value)}
                className="h-10 bg-background border-neutral-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-1 mb-2">Pre-money valuation (€)</label>
              <Input
                type="number"
                min={0}
                value={preMoneyValuation}
                onChange={(e) => setPreMoneyValuation(e.target.value)}
                className="h-10 bg-background border-neutral-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-1 mb-2">Round</label>
              <select
                value={roundType}
                onChange={(e) => setRoundType(e.target.value as RoundType)}
                className="h-10 w-full rounded-md border border-neutral-2 bg-background px-3 text-sm"
              >
                <option value="pre_seed">pre_seed</option>
                <option value="seed">seed</option>
                <option value="series_a">series_a</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-1 mb-2">Share type</label>
              <select
                value={shareType}
                onChange={(e) => setShareType(e.target.value as ShareType)}
                className="h-10 w-full rounded-md border border-neutral-2 bg-background px-3 text-sm"
              >
                <option value="preferred">preferred</option>
                <option value="safe">safe</option>
                <option value="note">note</option>
              </select>
            </div>
          </div>
        </div>

        {/* Capital allocation */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-1">Capital allocation</h3>
            <Button variant="outline" size="sm" onClick={addAllocation} className="gap-2">
              <Plus className="w-4 h-4" /> Add category
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
                  className="col-span-7 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={a.percent}
                  onChange={(e) => updateAllocation(idx, { percent: e.target.value })}
                  placeholder="%"
                  className="col-span-4 h-9 bg-background border-neutral-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-1"
                  onClick={() => removeAllocation(idx)}
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <p
            className={`text-sm font-semibold ${
              allocationTotal >= 95 && allocationTotal <= 105 ? 'text-green-700' : 'text-amber-700'
            }`}
          >
            Total: {allocationTotal.toFixed(2)}%
          </p>
        </div>

        {/* KPI baseline */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-neutral-1">KPI baseline</h3>
          <p className="text-sm text-neutral-5">
            Reviewers need a snapshot of your unit economics. All fields required.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(
              [
                ['MRR (€)', mrr, setMrr],
                ['ARR (€)', arr, setArr],
                ['Gross margin (%)', grossMargin, setGrossMargin],
                ['CAC (€)', cac, setCac],
                ['LTV (€)', ltv, setLtv],
                ['Churn (%)', churn, setChurn],
                ['Active accounts', activeAccounts, setActiveAccounts],
              ] as const
            ).map(([label, value, setter]) => (
              <div key={label}>
                <label className="block text-sm font-semibold text-neutral-1 mb-2">{label}</label>
                <Input
                  type="number"
                  min={0}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder="0"
                  className="h-10 bg-background border-neutral-2"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Financial reports */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-neutral-1">Financial reports</h3>
          <p className="text-sm text-neutral-5">
            Upload your latest P&amp;L and balance sheet. PDFs or spreadsheets accepted.
          </p>
          <div className="space-y-3">
            {REQUIRED_REPORT_TYPES.map((rt) => {
              const uploaded = reports.find(
                (r) => r.type.toLowerCase() === rt.id && r.status !== 'rejected',
              );
              const uploading = uploadingType === rt.id;
              return (
                <div
                  key={rt.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-background border-2 border-neutral-2 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-5 h-5 text-neutral-5 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-1">{rt.label}</p>
                      {uploaded ? (
                        <p className="text-xs text-neutral-5 mt-1">
                          {uploaded.fileName} · {uploaded.status}
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-5 mt-1">Required</p>
                      )}
                    </div>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleReportUpload(rt.id, f);
                      }}
                    />
                    <Button
                      asChild
                      variant={uploaded ? 'outline' : 'default'}
                      size="sm"
                      disabled={uploading}
                      className="gap-2"
                    >
                      <span>
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading…' : uploaded ? 'Replace' : 'Upload'}
                      </span>
                    </Button>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Submitting Phase 3 sends your financials for compliance review and unlocks Phase 4.
            Verification is awarded separately after a reviewer approves your submission.
          </p>
        </div>

        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-3/step-2"
          onNextClick={handleSubmit}
          isLoading={isSubmitting}
          nextLabel="Submit &amp; Complete Phase 3"
          nextValidationError={validationError}
        />
      </div>
    </EntrepreneurLayout>
  );
}

export default function Phase3Step3Page() {
  return (
    <RouteGuard requiredPhase={3} requiredStep={3}>
      <Phase3Step3Client />
    </RouteGuard>
  );
}
