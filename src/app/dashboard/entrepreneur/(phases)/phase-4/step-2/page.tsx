'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, PieChart, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import entrepreneurApi, {
  CapTableSnapshotResponse,
  EquityGrantDto,
  VestingScheduleEntryDto,
} from '@/lib/api-entrepreneur';
import { Phase4Data } from '@/types/entrepreneur';

const PHASE_4_STEPS = [
  { step: 1 as const, title: 'Equity Grants', subtitle: 'Founders & investors' },
  { step: 2 as const, title: 'ESOP & Vesting', subtitle: 'Option pool, issuance' },
  { step: 3 as const, title: 'Ownership & Submit', subtitle: 'History, advance' },
];

type ShareClass = 'common' | 'preferred' | 'safe' | 'note';

interface VestingRow {
  stakeholderName: string;
  sharesGranted: string;
  grantDate: string; // YYYY-MM-DD
  cliffMonths: string;
  totalVestMonths: string;
}

interface IssuanceRow {
  issuedTo: string;
  shareClass: ShareClass;
  sharesIssued: string;
  pricePerShare: string;
  reason: string;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function Phase4Step2Client() {
  const router = useRouter();
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  const [esopPoolPercent, setEsopPoolPercent] = useState('');
  const [esopVestingMonths, setEsopVestingMonths] = useState('48');
  const [snapshot, setSnapshot] = useState<CapTableSnapshotResponse | null>(null);
  const [vestingRows, setVestingRows] = useState<VestingRow[]>([]);
  const [issuanceRows, setIssuanceRows] = useState<IssuanceRow[]>([]);
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

        const [snap, existingVesting] = await Promise.all([
          entrepreneurApi.getLatestCapTableSnapshot(companyId),
          entrepreneurApi.getVestingSchedules(companyId),
        ]);
        if (cancelled) return;

        if (snap) {
          setSnapshot(snap);
          setEsopPoolPercent(snap.esopPoolPercent ? String(snap.esopPoolPercent) : '');
          setEsopVestingMonths(String(snap.esopVestingMonths || 48));
          if (existingVesting.length === 0) {
            // Seed vesting rows from the cap-table grants so the user only fills cliff/total.
            setVestingRows(
              snap.grants
                .filter((g) => g.stakeholderType !== 'esop')
                .map((g) => ({
                  stakeholderName: g.stakeholderName,
                  sharesGranted: String(g.sharesGranted),
                  grantDate: g.grantDate ? g.grantDate.slice(0, 10) : todayIso(),
                  cliffMonths: g.cliffMonths ? String(g.cliffMonths) : '12',
                  totalVestMonths: g.totalVestMonths ? String(g.totalVestMonths) : '48',
                })),
            );
          } else {
            setVestingRows(
              existingVesting.map((v) => ({
                stakeholderName: v.stakeholderName,
                sharesGranted: String(v.sharesGranted),
                grantDate: v.grantDate.slice(0, 10),
                cliffMonths: String(v.cliffMonths),
                totalVestMonths: String(v.totalVestMonths),
              })),
            );
          }
        }
      } catch {
        // empty form is OK
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

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase4Data = getPhaseData<Phase4Data>(4) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const addVestingRow = () =>
    setVestingRows((rs) => [
      ...rs,
      { stakeholderName: '', sharesGranted: '', grantDate: todayIso(), cliffMonths: '12', totalVestMonths: '48' },
    ]);
  const removeVestingRow = (idx: number) =>
    setVestingRows((rs) => rs.filter((_, i) => i !== idx));
  const updateVestingRow = (idx: number, patch: Partial<VestingRow>) =>
    setVestingRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const addIssuanceRow = () =>
    setIssuanceRows((rs) => [
      ...rs,
      { issuedTo: '', shareClass: 'common', sharesIssued: '', pricePerShare: '', reason: '' },
    ]);
  const removeIssuanceRow = (idx: number) =>
    setIssuanceRows((rs) => rs.filter((_, i) => i !== idx));
  const updateIssuanceRow = (idx: number, patch: Partial<IssuanceRow>) =>
    setIssuanceRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const handleNext = async () => {
    setValidationError('');

    const esopPct = parseFloat(esopPoolPercent);
    if (esopPoolPercent && (!Number.isFinite(esopPct) || esopPct < 0 || esopPct > 100)) {
      setValidationError('ESOP pool % must be between 0 and 100');
      return;
    }
    const esopVest = parseInt(esopVestingMonths, 10);
    if (esopPct > 0 && (!Number.isFinite(esopVest) || esopVest <= 0)) {
      setValidationError('ESOP vesting months must be > 0 when ESOP pool > 0');
      return;
    }

    for (const v of vestingRows) {
      if (!v.stakeholderName.trim()) {
        setValidationError('Every vesting row needs a stakeholder');
        return;
      }
      const shares = parseInt(v.sharesGranted, 10);
      const cliff = parseInt(v.cliffMonths, 10);
      const total = parseInt(v.totalVestMonths, 10);
      if (!Number.isFinite(shares) || shares <= 0) {
        setValidationError(`Vesting for '${v.stakeholderName}': shares must be > 0`);
        return;
      }
      if (!Number.isFinite(cliff) || cliff < 0 || !Number.isFinite(total) || total < 0 || cliff > total) {
        setValidationError(`Vesting for '${v.stakeholderName}': invalid cliff/total months`);
        return;
      }
    }

    for (const i of issuanceRows) {
      if (!i.issuedTo.trim()) {
        setValidationError('Every issuance row needs a recipient');
        return;
      }
      const shares = parseInt(i.sharesIssued, 10);
      if (!Number.isFinite(shares) || shares <= 0) {
        setValidationError(`Issuance to '${i.issuedTo}': shares must be > 0`);
        return;
      }
    }

    if (!snapshot) {
      setValidationError('No cap table found — go back to Step 1 first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();

      // Re-submit cap table with ESOP allocation merged in. ESOP grant is a
      // synthetic row representing the unallocated option pool.
      const nonEsopGrants: EquityGrantDto[] = snapshot.grants.filter(
        (g) => g.stakeholderType !== 'esop',
      );
      const esopShares = esopPct > 0
        ? Math.floor((esopPct / 100) * snapshot.totalShares)
        : 0;
      const allGrants: EquityGrantDto[] = [...nonEsopGrants];
      if (esopShares > 0) {
        allGrants.push({
          stakeholderName: 'ESOP Pool',
          stakeholderType: 'esop',
          shareClass: 'common',
          sharesGranted: esopShares,
          cliffMonths: 0,
          totalVestMonths: esopVest,
        });
      }

      const snap = await entrepreneurApi.submitCapTable(companyId, {
        totalShares: snapshot.totalShares,
        esopPoolPercent: esopPct || 0,
        esopVestingMonths: esopPct > 0 ? esopVest : 0,
        grants: allGrants,
      });

      if (vestingRows.length > 0) {
        const entries: VestingScheduleEntryDto[] = vestingRows.map((v) => ({
          stakeholderName: v.stakeholderName.trim(),
          sharesGranted: parseInt(v.sharesGranted, 10),
          grantDate: new Date(v.grantDate).toISOString(),
          cliffMonths: parseInt(v.cliffMonths, 10),
          totalVestMonths: parseInt(v.totalVestMonths, 10),
        }));
        await entrepreneurApi.saveVestingSchedules(companyId, { entries });
      }

      for (const i of issuanceRows) {
        await entrepreneurApi.recordShareIssuance(companyId, {
          issuedTo: i.issuedTo.trim(),
          shareClass: i.shareClass,
          sharesIssued: parseInt(i.sharesIssued, 10),
          pricePerShare: i.pricePerShare ? parseFloat(i.pricePerShare) : undefined,
          reason: i.reason || undefined,
        });
      }

      const existing: Phase4Data = getPhaseData<Phase4Data>(4) ?? {};
      savePhaseData(4, {
        ...existing,
        __companyId: companyId,
        capTableVersion: snap.version,
        vestingSavedAt: new Date().toISOString(),
        shareIssuancesCount: (existing.shareIssuancesCount ?? 0) + issuanceRows.length,
      });
      moveToNextStep(4, 2);
      router.push('/dashboard/entrepreneur/phase-4/step-3');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save ESOP/vesting';
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
      overallScore={66}
      scoreLabel="STEP"
      scoreDescription="Allocate ESOP, declare vesting, record issuances."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebar}>
      <div className="space-y-4 md:space-y-6">
        <PhaseHeader
          title="ESOP, Issuance &amp; Vesting"
          subtitle="Allocate the option pool, declare vesting schedules per grant, and record any share issuances since the last cap-table version."
          progressLabel="PROGRESS"
          progressValue="Step 2 of 3"
          progressPercentage={66}
        />

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
            <PieChart className="w-5 h-5" /> ESOP pool
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-1 mb-2">Pool (%)</label>
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
              <label className="block text-sm font-semibold text-neutral-1 mb-2">Vesting months</label>
              <Input
                type="number"
                min={0}
                value={esopVestingMonths}
                onChange={(e) => setEsopVestingMonths(e.target.value)}
                className="h-10 bg-background border-neutral-2"
              />
            </div>
          </div>
          <p className="text-xs text-neutral-5">
            ESOP shares are calculated server-side as <code>floor(pool% × totalShares)</code>.
          </p>
        </div>

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-1">Vesting schedules</h3>
            <Button variant="outline" size="sm" onClick={addVestingRow} className="gap-2">
              <Plus className="w-4 h-4" /> Add schedule
            </Button>
          </div>
          <p className="text-xs text-neutral-5">
            Standard schedule: 12-month cliff, 48-month total (25% at 12, 50% at 24, 75% at 36, 100% at 48).
            Backend computes vested % from grant date.
          </p>
          <div className="space-y-2">
            {vestingRows.map((v, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <Input
                  type="text"
                  value={v.stakeholderName}
                  onChange={(e) => updateVestingRow(idx, { stakeholderName: e.target.value })}
                  placeholder="Name"
                  className="col-span-3 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="number"
                  min={0}
                  value={v.sharesGranted}
                  onChange={(e) => updateVestingRow(idx, { sharesGranted: e.target.value })}
                  placeholder="Shares"
                  className="col-span-2 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="date"
                  value={v.grantDate}
                  onChange={(e) => updateVestingRow(idx, { grantDate: e.target.value })}
                  className="col-span-3 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="number"
                  min={0}
                  value={v.cliffMonths}
                  onChange={(e) => updateVestingRow(idx, { cliffMonths: e.target.value })}
                  placeholder="Cliff"
                  className="col-span-1 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="number"
                  min={0}
                  value={v.totalVestMonths}
                  onChange={(e) => updateVestingRow(idx, { totalVestMonths: e.target.value })}
                  placeholder="Total"
                  className="col-span-2 h-9 bg-background border-neutral-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-1"
                  onClick={() => removeVestingRow(idx)}
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-1">Share issuances (optional)</h3>
            <Button variant="outline" size="sm" onClick={addIssuanceRow} className="gap-2">
              <Plus className="w-4 h-4" /> Add issuance
            </Button>
          </div>
          <div className="space-y-2">
            {issuanceRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <Input
                  type="text"
                  value={row.issuedTo}
                  onChange={(e) => updateIssuanceRow(idx, { issuedTo: e.target.value })}
                  placeholder="Issued to"
                  className="col-span-3 h-9 bg-background border-neutral-2"
                />
                <select
                  value={row.shareClass}
                  onChange={(e) => updateIssuanceRow(idx, { shareClass: e.target.value as ShareClass })}
                  className="col-span-2 h-9 rounded-md border border-neutral-2 bg-background px-2 text-sm"
                >
                  <option value="common">common</option>
                  <option value="preferred">preferred</option>
                  <option value="safe">safe</option>
                  <option value="note">note</option>
                </select>
                <Input
                  type="number"
                  min={0}
                  value={row.sharesIssued}
                  onChange={(e) => updateIssuanceRow(idx, { sharesIssued: e.target.value })}
                  placeholder="Shares"
                  className="col-span-2 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="number"
                  min={0}
                  value={row.pricePerShare}
                  onChange={(e) => updateIssuanceRow(idx, { pricePerShare: e.target.value })}
                  placeholder="€/share"
                  className="col-span-2 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="text"
                  value={row.reason}
                  onChange={(e) => updateIssuanceRow(idx, { reason: e.target.value })}
                  placeholder="Reason"
                  className="col-span-2 h-9 bg-background border-neutral-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-1"
                  onClick={() => removeIssuanceRow(idx)}
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Saving here writes a new cap-table version, persists vesting schedules, and records each
            issuance event. Failed save blocks progression.
          </p>
        </div>

        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-4/step-1"
          onNextClick={handleNext}
          isLoading={isSubmitting}
          nextLabel="Save &amp; Continue"
          nextValidationError={validationError}
        />
      </div>
    </EntrepreneurLayout>
  );
}

export default function Phase4Step2Page() {
  return (
    <RouteGuard requiredPhase={4} requiredStep={2}>
      <Phase4Step2Client />
    </RouteGuard>
  );
}
