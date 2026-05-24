'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import entrepreneurApi from '@/lib/api-entrepreneur';
import { Phase3Data } from '@/types/entrepreneur';

const PHASE_3_STEPS = [
  { step: 1 as const, title: 'Revenue & Cash', subtitle: 'Financial baseline' },
  { step: 2 as const, title: 'Equity Structure', subtitle: 'Cap table setup' },
  { step: 3 as const, title: 'Funding & KPI', subtitle: 'Ask, KPI, reports' },
];

type EquityType = 'founder' | 'investor' | 'esop' | 'advisor';
interface Row {
  stakeholderName: string;
  type: EquityType;
  sharesOwned: string;
  vestingMonths: string;
  investmentAmount: string;
}

function emptyRow(type: EquityType): Row {
  return {
    stakeholderName: '',
    type,
    sharesOwned: '',
    vestingMonths: '',
    investmentAmount: '',
  };
}

function Phase3Step2Client() {
  const router = useRouter();
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  const [totalShares, setTotalShares] = useState('1000000');
  const [esopPoolPercent, setEsopPoolPercent] = useState('');
  const [esopVestingMonths, setEsopVestingMonths] = useState('');
  const [rows, setRows] = useState<Row[]>([emptyRow('founder')]);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!progress) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <p className="text-neutral-5 text-sm">Loading…</p>
      </div>
    );
  }

  const totalSharesNum = parseInt(totalShares, 10) || 0;
  const allocatedShares = rows.reduce(
    (sum, r) => sum + (parseInt(r.sharesOwned, 10) || 0),
    0,
  );
  const allocationPercent =
    totalSharesNum > 0 ? (allocatedShares / totalSharesNum) * 100 : 0;

  const updateRow = (idx: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  const removeRow = (idx: number) =>
    setRows((r) => r.filter((_, i) => i !== idx));
  const addRow = (type: EquityType) =>
    setRows((r) => [...r, emptyRow(type)]);

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const handleNextClick = async () => {
    setValidationError('');

    if (totalSharesNum <= 0) {
      setValidationError('Total shares must be greater than 0');
      return;
    }
    const cleaned = rows
      .map((r) => ({
        ...r,
        stakeholderName: r.stakeholderName.trim(),
        sharesOwned: r.sharesOwned.trim(),
      }))
      .filter((r) => r.stakeholderName || r.sharesOwned);
    if (cleaned.length === 0) {
      setValidationError('Add at least one stakeholder');
      return;
    }
    for (const r of cleaned) {
      if (!r.stakeholderName) {
        setValidationError('Every row needs a stakeholder name');
        return;
      }
      const shares = parseInt(r.sharesOwned, 10);
      if (!Number.isFinite(shares) || shares <= 0) {
        setValidationError(`Shares for "${r.stakeholderName}" must be > 0`);
        return;
      }
    }
    if (allocationPercent < 90 || allocationPercent > 100) {
      setValidationError(
        `Allocated shares must total ~100% of total shares (currently ${allocationPercent.toFixed(2)}%)`,
      );
      return;
    }
    const esopPct = parseFloat(esopPoolPercent);
    if (esopPoolPercent && (Number.isNaN(esopPct) || esopPct < 0 || esopPct > 100)) {
      setValidationError('ESOP pool % must be between 0 and 100');
      return;
    }

    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();

      await entrepreneurApi.saveEquityStructure(companyId, {
        entries: cleaned.map((r) => ({
          stakeholderName: r.stakeholderName,
          type: r.type,
          sharesOwned: parseInt(r.sharesOwned, 10),
          vestingMonths: r.vestingMonths ? parseInt(r.vestingMonths, 10) : undefined,
          investmentAmount: r.investmentAmount ? parseFloat(r.investmentAmount) : undefined,
        })),
        esopPoolPercent: esopPoolPercent ? esopPct : 0,
        esopVestingMonths: esopVestingMonths ? parseInt(esopVestingMonths, 10) : 0,
        totalShares: totalSharesNum,
      });

      const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
      savePhaseData(3, {
        ...existing,
        __companyId: companyId,
        equitySavedAt: new Date().toISOString(),
      });
      moveToNextStep(3, 2);
      router.push('/dashboard/entrepreneur/phase-3/step-3');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save equity structure';
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
      overallScore={66}
      scoreLabel="STEP"
      scoreDescription="Allocate shares between founders, investors, and ESOP."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebar}>
      <div className="space-y-4 md:space-y-6">
        <PhaseHeader
          title="Equity Structure"
          subtitle="Define your cap table. Allocations must total close to 100% of total shares."
          progressLabel="PROGRESS"
          progressValue="Step 2 of 3"
          progressPercentage={66}
        />

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-1 mb-2">
                Total shares
              </label>
              <Input
                type="number"
                min={1}
                value={totalShares}
                onChange={(e) => setTotalShares(e.target.value)}
                className="h-10 bg-background border-neutral-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-1 mb-2">
                ESOP pool (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={esopPoolPercent}
                onChange={(e) => setEsopPoolPercent(e.target.value)}
                placeholder="0"
                className="h-10 bg-background border-neutral-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-1 mb-2">
                ESOP vesting (months)
              </label>
              <Input
                type="number"
                min={0}
                value={esopVestingMonths}
                onChange={(e) => setEsopVestingMonths(e.target.value)}
                placeholder="0"
                className="h-10 bg-background border-neutral-2"
              />
            </div>
          </div>
        </div>

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
              <Users className="w-5 h-5" /> Stakeholders
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => addRow('founder')} className="gap-2">
                <Plus className="w-4 h-4" /> Founder
              </Button>
              <Button variant="outline" size="sm" onClick={() => addRow('investor')} className="gap-2">
                <Plus className="w-4 h-4" /> Investor
              </Button>
              <Button variant="outline" size="sm" onClick={() => addRow('advisor')} className="gap-2">
                <Plus className="w-4 h-4" /> Advisor
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <label className="block text-xs font-semibold text-neutral-5 mb-1">Name</label>
                  <Input
                    type="text"
                    value={row.stakeholderName}
                    onChange={(e) => updateRow(idx, { stakeholderName: e.target.value })}
                    placeholder="Stakeholder"
                    className="h-9 bg-background border-neutral-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-neutral-5 mb-1">Type</label>
                  <select
                    value={row.type}
                    onChange={(e) => updateRow(idx, { type: e.target.value as EquityType })}
                    className="h-9 w-full rounded-md border border-neutral-2 bg-background px-2 text-sm"
                  >
                    <option value="founder">founder</option>
                    <option value="investor">investor</option>
                    <option value="esop">esop</option>
                    <option value="advisor">advisor</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-neutral-5 mb-1">Shares</label>
                  <Input
                    type="number"
                    min={0}
                    value={row.sharesOwned}
                    onChange={(e) => updateRow(idx, { sharesOwned: e.target.value })}
                    placeholder="0"
                    className="h-9 bg-background border-neutral-2"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-neutral-5 mb-1">Vest mo</label>
                  <Input
                    type="number"
                    min={0}
                    value={row.vestingMonths}
                    onChange={(e) => updateRow(idx, { vestingMonths: e.target.value })}
                    placeholder=""
                    className="h-9 bg-background border-neutral-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-neutral-5 mb-1">Invested (€)</label>
                  <Input
                    type="number"
                    min={0}
                    value={row.investmentAmount}
                    onChange={(e) => updateRow(idx, { investmentAmount: e.target.value })}
                    placeholder=""
                    className="h-9 bg-background border-neutral-2"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-1"
                  onClick={() => removeRow(idx)}
                  aria-label="Remove row"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t-2 border-neutral-2 flex items-center justify-between">
            <p className="text-sm text-neutral-5">
              Allocated:{' '}
              <span className="font-bold text-neutral-1">
                {allocatedShares.toLocaleString()} / {totalSharesNum.toLocaleString()}
              </span>
            </p>
            <p
              className={`text-sm font-bold ${
                allocationPercent >= 90 && allocationPercent <= 100
                  ? 'text-green-700'
                  : 'text-amber-700'
              }`}
            >
              {allocationPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Cap table is persisted to the backend on continue. Allocations are validated server-side;
            failed saves block progression.
          </p>
        </div>

        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-3/step-1"
          onNextClick={handleNextClick}
          isLoading={isSubmitting}
          nextLabel="Save &amp; Continue"
          nextValidationError={validationError}
        />
      </div>
    </EntrepreneurLayout>
  );
}

export default function Phase3Step2Page() {
  return (
    <RouteGuard requiredPhase={3} requiredStep={2}>
      <Phase3Step2Client />
    </RouteGuard>
  );
}
