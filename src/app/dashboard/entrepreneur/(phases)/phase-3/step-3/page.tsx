'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileText, Upload, ShieldCheck, Zap } from 'lucide-react';
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
  MetricTile,
  RevenueBars,
  InfoCallout,
  Chip,
} from '@/components/entrepreneur/phase3/Phase3Ui';
import { PHASE_3_STEPS } from '@/components/entrepreneur/phase3/steps';
import entrepreneurApi, { FinancialReportResponse } from '@/lib/api-entrepreneur';
import { Phase3Data } from '@/types/entrepreneur';

const REQUIRED_REPORT_TYPES: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'pnl', label: 'P&L statement' },
  { id: 'balance', label: 'Balance sheet' },
];

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

function Phase3KpiTrackerClient() {
  const router = useRouter();
  const { progress, savePhaseData, moveToNextStep, getPhaseData, applyBackendResponse, trustScore } =
    useEntrepreneurProgress();

  const [mrr, setMrr] = useState('');
  const [arr, setArr] = useState('');
  const [grossMargin, setGrossMargin] = useState('');
  const [cac, setCac] = useState('');
  const [ltv, setLtv] = useState('');
  const [churn, setChurn] = useState('');
  const [activeAccounts, setActiveAccounts] = useState('');

  const [reports, setReports] = useState<FinancialReportResponse[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [monthly, setMonthly] = useState<{ yearMonth: string; revenue: number }[]>([]);
  const [overallProgress, setOverallProgress] = useState<number | null>(null);

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
        const prog = await entrepreneurApi.getCurrentPhase();
        if (!cancelled) setOverallProgress(prog.overallProgressPercent);
        const companyId = existing.__companyId ?? prog.companyId;
        if (!companyId) return;
        const [list, mon] = await Promise.allSettled([
          entrepreneurApi.getFinancialReports(companyId),
          entrepreneurApi.getMonthlyRevenue(companyId),
        ]);
        if (cancelled) return;
        if (list.status === 'fulfilled') setReports(list.value);
        if (mon.status === 'fulfilled') setMonthly(mon.value);
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4" role="status" aria-live="polite">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  const num = (s: string) => (Number.isFinite(parseFloat(s)) ? parseFloat(s) : null);

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

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
      setValidationError(error instanceof Error ? error.message : 'Failed to upload report');
    } finally {
      setUploadingType(null);
    }
  };

  const handleSubmit = async () => {
    setValidationError('');
    const mrrN = num(mrr), arrN = num(arr), gmN = num(grossMargin);
    const cacN = num(cac), ltvN = num(ltv), churnN = num(churn), aaN = num(activeAccounts);
    if (
      mrrN == null || mrrN < 0 || arrN == null || arrN < 0 ||
      gmN == null || gmN < -100 || gmN > 100 || cacN == null || cacN < 0 ||
      ltvN == null || ltvN < 0 || churnN == null || churnN < 0 || churnN > 100 ||
      aaN == null || aaN < 0
    ) {
      setValidationError('Fill every KPI field with a valid non-negative number');
      return;
    }
    if (mrrN <= 0 && arrN <= 0 && aaN <= 0) {
      setValidationError('KPI baseline needs at least one of MRR, ARR, or active accounts > 0');
      return;
    }
    for (const required of REQUIRED_REPORT_TYPES) {
      const ok = reports.some((r) => r.type.toLowerCase() === required.id && r.status !== 'rejected');
      if (!ok) {
        setValidationError(`Upload your ${required.label} (and ensure it is not rejected)`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();
      await entrepreneurApi.saveKpiBaseline(companyId, {
        mrr: mrrN, arr: arrN, grossMarginPercent: gmN, cac: cacN, ltv: ltvN, churnPercent: churnN, activeAccounts: aaN,
      });
      const advanceResponse = await entrepreneurApi.advancePhase(companyId, 3, {});
      if (advanceResponse?.currentPhase !== 4) {
        throw new Error(`Phase advancement failed - expected currentPhase=4, got ${advanceResponse?.currentPhase}`);
      }
      if (!advanceResponse?.completedPhases?.includes(3)) {
        throw new Error('Phase 3 not marked as completed in backend response');
      }
      applyBackendResponse(advanceResponse);

      const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
      savePhaseData(3, {
        ...existing,
        __companyId: companyId,
        kpiBaselineSavedAt: new Date().toISOString(),
        reportsSubmittedCount: reports.length,
        submittedAt: new Date().toISOString(),
      });
      moveToNextStep(3, 3);
      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-4');
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to submit Phase 3');
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
      overallScore={100}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Submit your KPI baseline and required reports to complete Phase 3."
    />
  );

  const chartData =
    monthly.length > 0
      ? monthly.slice(-4).map((m) => ({ label: m.yearMonth.slice(5), value: m.revenue }))
      : [
          { label: 'Q1', value: 0 },
          { label: 'Q2', value: 0 },
          { label: 'Q3', value: 0 },
          { label: 'Q4', value: 0 },
        ];

  const ltvCac = num(ltv) != null && num(cac) != null && num(cac)! > 0 ? (num(ltv)! / num(cac)!).toFixed(1) : null;

  const KPI_FIELDS = [
    ['MRR (€)', 'mrr', mrr, setMrr],
    ['ARR (€)', 'arr', arr, setArr],
    ['Gross margin (%)', 'gm', grossMargin, setGrossMargin],
    ['CAC (€)', 'cac', cac, setCac],
    ['LTV (€)', 'ltv', ltv, setLtv],
    ['Churn (%)', 'churn', churn, setChurn],
    ['Active accounts', 'aa', activeAccounts, setActiveAccounts],
  ] as const;

  return (
    <EntrepreneurLayout sidebar={sidebar}>
      <Phase3Container
        crumbs={['Entrepreneur Verification', 'Live KPI Tracking']}
        title="KPI Tracker"
        subtitle="Submit your KPI baseline and required financial reports. Phase 3 completes once the backend accepts everything."
      >
        {/* Integration banner — backend-blocked, disabled actions */}
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex gap-3">
            <Zap className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-foreground">Connect Stripe to enable automatic KPI sync</p>
              <p className="text-[13px] text-muted-foreground">Live metric sync is awaiting integration. Enter your baseline manually below.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" disabled>Connect Stripe</Button>
            <Button variant="outline" size="sm" disabled>Connect ChartMogul</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
          {/* Operational mastery — composite score is backend-blocked; show real progress */}
          <Surface className="p-6 flex flex-col items-center text-center gap-4">
            <div className="self-start">
              <p className="text-sm font-medium text-muted-foreground">Data Efficiency</p>
              <p className="text-lg font-semibold text-foreground">Operational Mastery</p>
            </div>
            <div className="relative grid place-items-center size-40 rounded-full bg-primary/10">
              <div className="absolute inset-2 rounded-full border-[10px] border-primary/20" />
              <div className="text-center">
                <p className="text-3xl font-semibold text-foreground tabular-nums">{overallProgress ?? 0}%</p>
                <p className="text-xs text-muted-foreground">Overall progress</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full text-left">
              <div>
                <p className="text-xs text-muted-foreground">System Health</p>
                <p className="text-sm italic text-muted-foreground">Data unavailable</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data Throughput</p>
                <p className="text-sm italic text-muted-foreground">Data unavailable</p>
              </div>
            </div>
            <div className="w-full rounded-xl border border-dashed border-border p-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Data Integration</p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" disabled className="w-full">Connect Stripe</Button>
                <Button variant="outline" size="sm" disabled className="w-full">Connect ChartMogul</Button>
              </div>
            </div>
          </Surface>

          {/* Metric grid (live from inputs; honest shells for unbacked metrics) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 content-start">
            <MetricTile label="Monthly Recurring Revenue" value={num(mrr) != null ? eur(num(mrr)!) : ''} available={num(mrr) != null} />
            <MetricTile label="Churn Rate" value={num(churn) != null ? `${num(churn)}%` : ''} available={num(churn) != null} />
            <MetricTile label="Annual Revenue" value={num(arr) != null ? eur(num(arr)!) : ''} available={num(arr) != null} />
            <MetricTile label="NPS" value="" available={false} />
            <MetricTile label="CAC" value={num(cac) != null ? eur(num(cac)!) : ''} available={num(cac) != null} />
            <MetricTile label="LTV" value={num(ltv) != null ? eur(num(ltv)!) : ''} available={num(ltv) != null} />
            <MetricTile label="Total Runway" value="" available={false} />
            <MetricTile label="Gross Margin" value={num(grossMargin) != null ? `${num(grossMargin)}%` : ''} available={num(grossMargin) != null} />
            <MetricTile label="Burn Rate" value="" available={false} icon={ShieldCheck} />
          </div>
        </div>

        {/* Revenue trend + business health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <Surface className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Revenue trend</h2>
              <Chip tone="success">Live from submitted revenue</Chip>
            </div>
            <RevenueBars data={chartData} height={180} />
          </Surface>
          <Surface className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Business Health</h2>
              <Chip tone="primary">Score {trustScore}/100</Chip>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['LTV / CAC ratio', ltvCac != null ? `${ltvCac}x` : null],
                  ['Burn multiple', null],
                  ['Growth', null],
                  ['Churn rate', num(churn) != null ? `${num(churn)}%` : null],
                ].map(([label, value]) => (
                  <tr key={label as string} className="border-b border-border/60 last:border-0">
                    <td className="py-3 text-foreground">{label}</td>
                    <td className="py-3 text-right font-medium text-foreground tabular-nums">
                      {value ?? <span className="italic text-muted-foreground font-normal">Data unavailable</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>
        </div>

        {/* KPI baseline input (real submission) */}
        <Surface className="p-6 mt-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">KPI baseline</h2>
          <p className="text-sm text-muted-foreground">Reviewers need a snapshot of your unit economics. All fields required.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {KPI_FIELDS.map(([label, id, value, setter]) => (
              <div key={id}>
                <label htmlFor={`kpi-${id}`} className="block text-sm font-medium text-foreground mb-2">{label}</label>
                <Input id={`kpi-${id}`} type="number" min={0} value={value} onChange={(e) => setter(e.target.value)} placeholder="0" className="h-10" />
              </div>
            ))}
          </div>
        </Surface>

        {/* Financial reports */}
        <Surface className="p-6 mt-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Financial reports</h2>
          <p className="text-sm text-muted-foreground">Upload your latest P&amp;L and balance sheet. PDFs or spreadsheets accepted.</p>
          <div className="space-y-3">
            {REQUIRED_REPORT_TYPES.map((rt) => {
              const uploaded = reports.find((r) => r.type.toLowerCase() === rt.id && r.status !== 'rejected');
              const uploading = uploadingType === rt.id;
              return (
                <div key={rt.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-background border border-border rounded-xl p-4">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" aria-hidden />
                    <div>
                      <p className="text-sm font-medium text-foreground">{rt.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{uploaded ? `${uploaded.fileName} · ${uploaded.status}` : 'Required'}</p>
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
                    <Button asChild variant={uploaded ? 'outline' : 'default'} size="sm" disabled={uploading} className="gap-2">
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
        </Surface>

        <div className="mt-4">
          <InfoCallout icon={AlertCircle} title="Submission completes Phase 3">
            Submitting sends your financials for compliance review and unlocks Phase 4. Verification is awarded
            separately after a reviewer approves your submission.
          </InfoCallout>
        </div>

        <div className="mt-6">
          <StepFooter
            backUrl="/dashboard/entrepreneur/phase-3/step-2"
            onNextClick={handleSubmit}
            isLoading={isSubmitting}
            nextLabel="Submit &amp; Complete Phase 3"
            nextValidationError={validationError}
          />
        </div>
      </Phase3Container>
    </EntrepreneurLayout>
  );
}

export default function Phase3Step3Page() {
  return (
    <RouteGuard requiredPhase={3} requiredStep={3}>
      <Phase3KpiTrackerClient />
    </RouteGuard>
  );
}
