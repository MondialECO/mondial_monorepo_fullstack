'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import entrepreneurApi, {
  EquityGrantDto,
  CapTableSnapshotResponse,
} from '@/lib/api-entrepreneur';
import { Phase4Data } from '@/types/entrepreneur';

const PHASE_4_STEPS = [
  { step: 1 as const, title: 'Equity Grants', subtitle: 'Founders & investors' },
  { step: 2 as const, title: 'ESOP & Vesting', subtitle: 'Option pool, issuance' },
  { step: 3 as const, title: 'Ownership & Submit', subtitle: 'History, advance' },
];

type StakeholderType = 'founder' | 'investor' | 'advisor' | 'esop';
type ShareClass = 'common' | 'preferred' | 'safe' | 'note';

interface Row {
  stakeholderName: string;
  stakeholderType: StakeholderType;
  shareClass: ShareClass;
  sharesGranted: string;
  investmentAmount: string;
}

function emptyRow(type: StakeholderType, shareClass: ShareClass = 'common'): Row {
  return {
    stakeholderName: '',
    stakeholderType: type,
    shareClass,
    sharesGranted: '',
    investmentAmount: '',
  };
}

function Phase4Step1Client() {
  const router = useRouter();
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  const [totalShares, setTotalShares] = useState('');
  const [rows, setRows] = useState<Row[]>([emptyRow('founder')]);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing: Phase4Data = getPhaseData<Phase4Data>(4) ?? {};
        const companyId =
          existing.__companyId ?? (await entrepreneurApi.getCurrentPhase()).companyId;
        if (!companyId) return;
        const snap: CapTableSnapshotResponse | null =
          await entrepreneurApi.getLatestCapTableSnapshot(companyId);
        if (cancelled || !snap) return;
        setTotalShares(String(snap.totalShares));
        // Show only the founder/investor/advisor rows in step 1; ESOP belongs in step 2.
        const visible = snap.grants.filter(
          (g) => g.stakeholderType !== 'esop',
        );
        if (visible.length > 0) {
          setRows(
            visible.map((g) => ({
              stakeholderName: g.stakeholderName,
              stakeholderType: g.stakeholderType,
              shareClass: g.shareClass,
              sharesGranted: String(g.sharesGranted),
              investmentAmount: g.investmentAmount != null ? String(g.investmentAmount) : '',
            })),
          );
        }
      } catch {
        // fall through; empty form is fine
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

  const totalSharesNum = parseInt(totalShares, 10) || 0;
  const allocated = rows.reduce(
    (sum, r) => sum + (parseInt(r.sharesGranted, 10) || 0),
    0,
  );
  const allocatedPercent =
    totalSharesNum > 0 ? (allocated / totalSharesNum) * 100 : 0;

  const updateRow = (idx: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeRow = (idx: number) =>
    setRows((rs) => rs.filter((_, i) => i !== idx));
  const addRow = (type: StakeholderType) =>
    setRows((rs) => [...rs, emptyRow(type)]);

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase4Data = getPhaseData<Phase4Data>(4) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const handleNext = async () => {
    setValidationError('');
    if (totalSharesNum <= 0) {
      setValidationError('Total shares must be > 0');
      return;
    }
    if (rows.length === 0) {
      setValidationError('Add at least one grant');
      return;
    }
    for (const r of rows) {
      if (!r.stakeholderName.trim()) {
        setValidationError('Every row needs a stakeholder name');
        return;
      }
      const s = parseInt(r.sharesGranted, 10);
      if (!Number.isFinite(s) || s <= 0) {
        setValidationError(`Shares for '${r.stakeholderName}' must be > 0`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();
      const existingSnap = await entrepreneurApi.getLatestCapTableSnapshot(companyId);

      // Merge: step 1 owns founder/investor/advisor rows; preserve any existing
      // ESOP grants the user already created in step 2.
      const esopRows: EquityGrantDto[] = (existingSnap?.grants ?? []).filter(
        (g) => g.stakeholderType === 'esop',
      );
      const newGrants: EquityGrantDto[] = [
        ...rows.map((r) => ({
          stakeholderName: r.stakeholderName.trim(),
          stakeholderType: r.stakeholderType,
          shareClass: r.shareClass,
          sharesGranted: parseInt(r.sharesGranted, 10),
          investmentAmount: r.investmentAmount
            ? parseFloat(r.investmentAmount)
            : undefined,
          cliffMonths: 0,
          totalVestMonths: 0,
        })),
        ...esopRows,
      ];

      const snap = await entrepreneurApi.submitCapTable(companyId, {
        totalShares: totalSharesNum,
        esopPoolPercent: existingSnap?.esopPoolPercent ?? 0,
        esopVestingMonths: existingSnap?.esopVestingMonths ?? 0,
        grants: newGrants,
      });

      const existing: Phase4Data = getPhaseData<Phase4Data>(4) ?? {};
      savePhaseData(4, {
        ...existing,
        __companyId: companyId,
        capTableVersion: snap.version,
        capTableSubmittedAt: new Date().toISOString(),
      });
      moveToNextStep(4, 1);
      router.push('/dashboard/entrepreneur/phase-4/step-2');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save cap table';
      setValidationError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusMap = {
    1: progress.completedSteps.has('4-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending',
    2: progress.completedSteps.has('4-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending',
    3: progress.completedSteps.has('4-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending',
  };
  const stepIndicators = PHASE_4_STEPS.map((s) => ({
    ...s,
    status: statusMap[s.step as keyof typeof statusMap] as 'completed' | 'current' | 'pending',
  }));

  const sidebar = (
    <ProgressSidebar
      title="Cap Table Submission"
      steps={stepIndicators}
      overallScore={33}
      scoreLabel="STEP"
      scoreDescription="Define founder & investor grants."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebar}>
      <div className="space-y-4 md:space-y-6">
        <PhaseHeader
          title="Founder &amp; Investor Equity"
          subtitle="Define every founder, investor, and advisor grant. Totals do not need to reconcile yet — ESOP and final reconciliation happen in step 2 and step 3."
          progressLabel="PROGRESS"
          progressValue="Step 1 of 3"
          progressPercentage={33}
        />

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-1 mb-2">
                Total authorised shares
              </label>
              <Input
                type="number"
                min={1}
                value={totalShares}
                onChange={(e) => setTotalShares(e.target.value)}
                placeholder="e.g. 1000000"
                className="h-10 bg-background border-neutral-2"
              />
              <p className="text-xs text-neutral-5 mt-1">
                Enter the total authorised share count for your company. Nothing is persisted until you continue.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
              <Users className="w-5 h-5" /> Grants
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
                    value={row.stakeholderType}
                    onChange={(e) =>
                      updateRow(idx, { stakeholderType: e.target.value as StakeholderType })
                    }
                    className="h-9 w-full rounded-md border border-neutral-2 bg-background px-2 text-sm"
                  >
                    <option value="founder">founder</option>
                    <option value="investor">investor</option>
                    <option value="advisor">advisor</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-neutral-5 mb-1">Class</label>
                  <select
                    value={row.shareClass}
                    onChange={(e) => updateRow(idx, { shareClass: e.target.value as ShareClass })}
                    className="h-9 w-full rounded-md border border-neutral-2 bg-background px-2 text-sm"
                  >
                    <option value="common">common</option>
                    <option value="preferred">preferred</option>
                    <option value="safe">safe</option>
                    <option value="note">note</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-neutral-5 mb-1">Shares</label>
                  <Input
                    type="number"
                    min={0}
                    value={row.sharesGranted}
                    onChange={(e) => updateRow(idx, { sharesGranted: e.target.value })}
                    className="h-9 bg-background border-neutral-2"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-neutral-5 mb-1">€</label>
                  <Input
                    type="number"
                    min={0}
                    value={row.investmentAmount}
                    onChange={(e) => updateRow(idx, { investmentAmount: e.target.value })}
                    className="h-9 bg-background border-neutral-2"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-1"
                  onClick={() => removeRow(idx)}
                  aria-label="Remove"
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
                {allocated.toLocaleString()} / {totalSharesNum.toLocaleString()}
              </span>
            </p>
            <p className="text-sm font-bold text-neutral-1">{allocatedPercent.toFixed(2)}%</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Step 1 persists a draft cap table to the backend. Final reconciliation to 100% is enforced
            on Submit in step 3 by <code>ValidatePhase4Async</code>.
          </p>
        </div>

        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-4"
          onNextClick={handleNext}
          isLoading={isSubmitting}
          nextLabel="Save &amp; Continue"
          nextValidationError={validationError}
        />
      </div>
    </EntrepreneurLayout>
  );
}

export default function Phase4Step1Page() {
  return (
    <RouteGuard requiredPhase={4} requiredStep={1}>
      <Phase4Step1Client />
    </RouteGuard>
  );
}
