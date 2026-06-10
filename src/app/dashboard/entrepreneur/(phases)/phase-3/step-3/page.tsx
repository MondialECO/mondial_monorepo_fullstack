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
import { Phase3FinancialDashboard } from '@/components/entrepreneur/phase3/Phase3FinancialDashboard';
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
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4"
        role="status"
        aria-live="polite"
      >
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  const allocationTotal = allocations.reduce(
    (sum, a) => sum + (parseFloat(a.percent) || 0),
    0,
  );
  const allocationValid = allocationTotal >= 95 && allocationTotal <= 105;

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

        {/* Figma 3.2 / 3.3 — live valuation + KPI tracker (real data, honest unavailable states) */}
        <Phase3FinancialDashboard />

        {/* Funding ask */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Funding ask</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="raise-amount" className="block text-sm font-semibold text-foreground mb-2">Raise amount (€)</label>
              <Input
                id="raise-amount"
                type="number"
                min={0}
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(e.target.value)}
                className="h-10"
              />
            </div>
            <div>
              <label htmlFor="pre-money" className="block text-sm font-semibold text-foreground mb-2">Pre-money valuation (€)</label>
              <Input
                id="pre-money"
                type="number"
                min={0}
                value={preMoneyValuation}
                onChange={(e) => setPreMoneyValuation(e.target.value)}
                className="h-10"
              />
            </div>
            <div>
              <label htmlFor="round-type" className="block text-sm font-semibold text-foreground mb-2">Round</label>
              <select
                id="round-type"
                value={roundType}
                onChange={(e) => setRoundType(e.target.value as RoundType)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="pre_seed">pre_seed</option>
                <option value="seed">seed</option>
                <option value="series_a">series_a</option>
              </select>
            </div>
            <div>
              <label htmlFor="share-type" className="block text-sm font-semibold text-foreground mb-2">Share type</label>
              <select
                id="share-type"
                value={shareType}
                onChange={(e) => setShareType(e.target.value as ShareType)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="preferred">preferred</option>
                <option value="safe">safe</option>
                <option value="note">note</option>
              </select>
            </div>
          </div>
        </div>

        {/* Capital allocation */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Capital allocation</h2>
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-1"
                  onClick={() => removeAllocation(idx)}
                  aria-label={`Remove allocation ${idx + 1}`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
          <p className={`text-sm font-semibold ${allocationValid ? 'text-primary' : 'text-destructive'}`} role="status" aria-live="polite">
            Total: {allocationTotal.toFixed(2)}%
          </p>
        </div>

        {/* KPI baseline */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">KPI baseline</h2>
          <p className="text-sm text-muted-foreground">
            Reviewers need a snapshot of your unit economics. All fields required.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(
              [
                ['MRR (€)', 'mrr', mrr, setMrr],
                ['ARR (€)', 'arr', arr, setArr],
                ['Gross margin (%)', 'gm', grossMargin, setGrossMargin],
                ['CAC (€)', 'cac', cac, setCac],
                ['LTV (€)', 'ltv', ltv, setLtv],
                ['Churn (%)', 'churn', churn, setChurn],
                ['Active accounts', 'aa', activeAccounts, setActiveAccounts],
              ] as const
            ).map(([label, id, value, setter]) => (
              <div key={id}>
                <label htmlFor={`kpi-${id}`} className="block text-sm font-semibold text-foreground mb-2">{label}</label>
                <Input
                  id={`kpi-${id}`}
                  type="number"
                  min={0}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder="0"
                  className="h-10"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Financial reports */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Financial reports</h2>
          <p className="text-sm text-muted-foreground">
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
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-background border border-border rounded-xl p-4"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rt.label}</p>
                      {uploaded ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          {uploaded.fileName} · {uploaded.status}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">Required</p>
                      )}
                    </div>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      aria-label={`Upload ${rt.label}`}
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
                        <Upload className="w-4 h-4" aria-hidden />
                        {uploading ? 'Uploading…' : uploaded ? 'Replace' : 'Upload'}
                      </span>
                    </Button>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Submitting Phase 3 sends your financials for compliance review and unlocks Phase 4.
            Verification is awarded separately after a reviewer approves your submission.
          </p>
        </div>

        <StepFooter
          backUrl="/dashboard/entr