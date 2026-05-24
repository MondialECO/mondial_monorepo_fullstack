'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Plus, ShieldCheck, Trash2 } from 'lucide-react';
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
  OwnershipHistoryEntryDto,
  OwnershipHistoryResponse,
  VestingScheduleResponse,
} from '@/lib/api-entrepreneur';
import { Phase4Data } from '@/types/entrepreneur';

const PHASE_4_STEPS = [
  { step: 1 as const, title: 'Equity Grants', subtitle: 'Founders & investors' },
  { step: 2 as const, title: 'ESOP & Vesting', subtitle: 'Option pool, issuance' },
  { step: 3 as const, title: 'Ownership & Submit', subtitle: 'History, advance' },
];

interface HistoryRow {
  roundName: string;
  eventDate: string;
  founderOwnershipBefore: string;
  founderOwnershipAfter: string;
  investorOwnership: string;
  esopOwnership: string;
  valuation: string;
  notes: string;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function Phase4Step3Client() {
  const router = useRouter();
  const {
    progress,
    savePhaseData,
    moveToNextStep,
    getPhaseData,
    applyBackendResponse,
  } = useEntrepreneurProgress();

  const [snapshot, setSnapshot] = useState<CapTableSnapshotResponse | null>(null);
  const [vesting, setVesting] = useState<VestingScheduleResponse[]>([]);
  const [rows, setRows] = useState<HistoryRow[]>([]);
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
        const [snap, v, h] = await Promise.all([
          entrepreneurApi.getLatestCapTableSnapshot(companyId),
          entrepreneurApi.getVestingSchedules(companyId),
          entrepreneurApi.getOwnershipHistory(companyId),
        ]);
        if (cancelled) return;
        setSnapshot(snap);
        setVesting(v);
        if (h.length > 0) {
          setRows(
            h.map((r: OwnershipHistoryResponse) => ({
              roundName: r.roundName,
              eventDate: r.eventDate.slice(0, 10),
              founderOwnershipBefore: String(r.founderOwnershipBefore),
              founderOwnershipAfter: String(r.founderOwnershipAfter),
              investorOwnership: String(r.investorOwnership),
              esopOwnership: String(r.esopOwnership),
              valuation: String(r.valuation),
              notes: r.notes ?? '',
            })),
          );
        }
      } catch {
        // empty
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

  // Reconciliation summary derived from backend snapshot only.
  const totalShares = snapshot?.totalShares ?? 0;
  const issued = snapshot?.grants.reduce((s, g) => s + g.sharesGranted, 0) ?? 0;
  const issuedPercent = totalShares > 0 ? (issued / totalShares) * 100 : 0;
  const hasFounder = snapshot?.grants.some((g) => g.stakeholderType === 'founder') ?? false;
  const reconciledOk =
    issuedPercent >= 90 && issuedPercent <= 100 && hasFounder && totalShares > 0;

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase4Data = getPhaseData<Phase4Data>(4) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const addRow = () =>
    setRows((rs) => [
      ...rs,
      {
        roundName: '',
        eventDate: todayIso(),
        founderOwnershipBefore: '',
        founderOwnershipAfter: '',
        investorOwnership: '',
        esopOwnership: '',
        valuation: '',
        notes: '',
      },
    ]);
  const removeRow = (idx: number) => setRows((rs) => rs.filter((_, i) => i !== idx));
  const updateRow = (idx: number, patch: Partial<HistoryRow>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const handleSubmit = async () => {
    setValidationError('');

    if (!snapshot) {
      setValidationError('No cap table snapshot found — complete step 1 and step 2 first.');
      return;
    }
    if (!reconciledOk) {
      setValidationError(
        `Cap table must reconcile (currently ${issuedPercent.toFixed(2)}% allocated, founder present: ${hasFounder ? 'yes' : 'no'}).`,
      );
      return;
    }

    // Optional but if any row is touched, it must validate.
    for (const r of rows) {
      if (!r.roundName.trim()) {
        setValidationError('Every ownership-history row needs a round name');
        return;
      }
      const nums = [r.founderOwnershipBefore, r.founderOwnershipAfter, r.investorOwnership, r.esopOwnership, r.valuation];
      if (nums.some((n) => {
        const v = parseFloat(n);
        return !Number.isFinite(v) || v < 0;
      })) {
        setValidationError(`Round '${r.roundName}': all numbers must be >= 0`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();

      if (rows.length > 0) {
        const entries: OwnershipHistoryEntryDto[] = rows.map((r) => ({
          roundName: r.roundName.trim(),
          eventDate: new Date(r.eventDate).toISOString(),
          founderOwnershipBefore: parseFloat(r.founderOwnershipBefore),
          founderOwnershipAfter: parseFloat(r.founderOwnershipAfter),
          investorOwnership: parseFloat(r.investorOwnership),
          esopOwnership: parseFloat(r.esopOwnership),
          valuation: parseFloat(r.valuation),
          notes: r.notes || undefined,
        }));
        await entrepreneurApi.saveOwnershipHistory(companyId, { entries });
      }

      const advanceResponse = await entrepreneurApi.advancePhase(companyId, 4, {});
      if (advanceResponse?.currentPhase !== 5) {
        throw new Error(
          `Phase advancement failed - expected currentPhase=5, got ${advanceResponse?.currentPhase}`,
        );
      }
      if (!advanceResponse?.completedPhases?.includes(4)) {
        throw new Error('Phase 4 not marked as completed in backend response');
      }

      applyBackendResponse(advanceResponse);

      const existing: Phase4Data = getPhaseData<Phase4Data>(4) ?? {};
      savePhaseData(4, {
        ...existing,
        __companyId: companyId,
        ownershipHistorySavedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      });
      moveToNextStep(4, 3);

      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-5');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to submit Phase 4';
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
      overallScore={100}
      scoreLabel="STEP"
      scoreDescription="Record ownership history and submit for review."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebar}>
      <div className="space-y-4 md:space-y-6">
        <PhaseHeader
          title="Ownership History &amp; Submit"
          subtitle="Record dilution events (optional but recommended) and submit your cap table for compliance review. Phase 4 completes only after the backend validator accepts the full submission."
          progressLabel="PROGRESS"
          progressValue="Step 3 of 3"
          progressPercentage={100}
        />

        {/* Backend-derived reconciliation summary */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-3">
          <h3 className="text-lg font-bold text-neutral-1">Reconciliation summary</h3>
          {snapshot ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase text-neutral-5">Total shares</p>
                <p className="font-bold text-neutral-1">{totalShares.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-5">Issued</p>
                <p className="font-bold text-neutral-1">{issued.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-5">Allocated %</p>
                <p
                  className={`font-bold ${
                    reconciledOk ? 'text-green-700' : 'text-amber-700'
                  }`}
                >
                  {issuedPercent.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-5">Founder present</p>
                <p className={`font-bold ${hasFounder ? 'text-green-700' : 'text-amber-700'}`}>
                  {hasFounder ? 'yes' : 'no'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-5">No cap table snapshot yet — go back to step 1.</p>
          )}

          {snapshot && vesting.length > 0 && (
            <div className="pt-3 border-t border-neutral-2">
              <p className="text-xs uppercase text-neutral-5 mb-2">Vesting (backend-computed)</p>
              <div className="space-y-1 text-xs">
                {vesting.map((v) => (
                  <div key={v.grantId} className="flex justify-between">
                    <span className="text-neutral-1">{v.stakeholderName}</span>
                    <span className="text-neutral-5">
                      {v.vestedSharesNow.toLocaleString()} / {v.sharesGranted.toLocaleString()}{' '}
                      ({v.vestedPercentNow.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-1">Ownership history</h3>
            <Button variant="outline" size="sm" onClick={addRow} className="gap-2">
              <Plus className="w-4 h-4" /> Add round
            </Button>
          </div>
          <p className="text-xs text-neutral-5">
            Optional. Record each round so reviewers can see the dilution trajectory.
          </p>
          <div className="space-y-2">
            {rows.map((r, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <Input
                  type="text"
                  value={r.roundName}
                  onChange={(e) => updateRow(idx, { roundName: e.target.value })}
                  placeholder="Round (e.g. Seed)"
                  className="col-span-3 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="date"
                  value={r.eventDate}
                  onChange={(e) => updateRow(idx, { eventDate: e.target.value })}
                  className="col-span-2 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="number"
                  value={r.founderOwnershipBefore}
                  onChange={(e) => updateRow(idx, { founderOwnershipBefore: e.target.value })}
                  placeholder="Founder before %"
                  className="col-span-1 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="number"
                  value={r.founderOwnershipAfter}
                  onChange={(e) => updateRow(idx, { founderOwnershipAfter: e.target.value })}
                  placeholder="After %"
                  className="col-span-1 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="number"
                  value={r.investorOwnership}
                  onChange={(e) => updateRow(idx, { investorOwnership: e.target.value })}
                  placeholder="Inv %"
                  className="col-span-1 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="number"
                  value={r.esopOwnership}
                  onChange={(e) => updateRow(idx, { esopOwnership: e.target.value })}
                  placeholder="ESOP %"
                  className="col-span-1 h-9 bg-background border-neutral-2"
                />
                <Input
                  type="number"
                  value={r.valuation}
                  onChange={(e) => updateRow(idx, { valuation: e.target.value })}
                  placeholder="Valuation €"
                  className="col-span-2 h-9 bg-background border-neutral-2"
                />
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
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Submitting Phase 4 sends your cap table for compliance review and unlocks Phase 5.
            Verification is awarded separately after a reviewer approves your submission.
          </p>
        </div>

        {validationError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-900">{validationError}</p>
          </div>
        )}

        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-4/step-2"
          onNextClick={handleSubmit}
          isLoading={isSubmitting}
          nextLabel="Submit &amp; Complete Phase 4"
          nextValidationError={validationError}
        />
      </div>
    </EntrepreneurLayout>
  );
}

export default function Phase4Step3Page() {
  return (
    <RouteGuard requiredPhase={4} requiredStep={3}>
      <Phase4Step3Client />
    </RouteGuard>
  );
}
