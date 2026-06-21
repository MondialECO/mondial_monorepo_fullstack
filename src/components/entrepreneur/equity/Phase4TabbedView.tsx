'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import entrepreneurApi, {
  CapTableSnapshotResponse,
  OwnershipHistoryResponse,
  VestingScheduleResponse,
} from '@/lib/api-entrepreneur';
import { Phase4Data } from '@/types/entrepreneur';
import { Phase4Tabs, Phase4Tab } from './Phase4Tabs';
import { Phase4OverviewTab } from './tabs/Phase4OverviewTab';
import { Phase4CapTableTab } from './tabs/Phase4CapTableTab';
import { Phase4EsopTab } from './tabs/Phase4EsopTab';
import { Phase4DilutionTab } from './tabs/Phase4DilutionTab';
import { Phase4HistoryTab } from './tabs/Phase4HistoryTab';
import { Button } from '@/components/ui/button';

export interface Phase4Context {
  companyId: string;
  snapshot: CapTableSnapshotResponse | null;
  vesting: VestingScheduleResponse[];
  history: OwnershipHistoryResponse[];
  reload: () => Promise<void>;
}

export function Phase4TabbedView() {
  const router = useRouter();
  const { progress, getPhaseData, applyBackendResponse, currentPhase } = useEntrepreneurProgress();

  const [active, setActive] = useState<Phase4Tab>('overview');
  const [companyId, setCompanyId] = useState<string>('');
  const [snapshot, setSnapshot] = useState<CapTableSnapshotResponse | null>(null);
  const [vesting, setVesting] = useState<VestingScheduleResponse[]>([]);
  const [history, setHistory] = useState<OwnershipHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState('');

  async function loadAll(id: string) {
    const [snap, v, h] = await Promise.all([
      entrepreneurApi.getLatestCapTableSnapshot(id),
      entrepreneurApi.getVestingSchedules(id),
      entrepreneurApi.getOwnershipHistory(id),
    ]);
    setSnapshot(snap);
    setVesting(v);
    setHistory(h);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing: Phase4Data = getPhaseData<Phase4Data>(4) ?? {};
        const id = existing.__companyId ?? (await entrepreneurApi.getCurrentPhase()).companyId;
        if (!id || cancelled) return;
        setCompanyId(id);
        await loadAll(id);
      } catch {
        // empty state is fine
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getPhaseData]);

  const ctx: Phase4Context = {
    companyId,
    snapshot,
    vesting,
    history,
    reload: async () => {
      if (companyId) await loadAll(companyId);
    },
  };

  const phase4Done = progress?.completedPhases.has(4) ?? false;

  async function handleComplete() {
    setCompletionError('');
    if (!snapshot) {
      setCompletionError('Submit your cap table first (Cap Table tab).');
      setActive('cap-table');
      return;
    }
    setCompleting(true);
    try {
      // Gate prerequisites: dilution history reviewed + exit waterfall reviewed.
      if (history.length === 0) {
        setCompletionError('Review the Dilution Sim first — add at least one round.');
        setActive('dilution');
        setCompleting(false);
        return;
      }
      await entrepreneurApi.markExitReviewed(companyId);
      const advance = await entrepreneurApi.advancePhase(companyId, 4, {});
      if (advance?.currentPhase !== 5) {
        throw new Error(`Expected currentPhase=5, got ${advance?.currentPhase}`);
      }
      applyBackendResponse(advance);
      await new Promise((r) => setTimeout(r, 250));
      router.push('/dashboard/entrepreneur/phase-5');
    } catch (e) {
      setCompletionError(e instanceof Error ? e.message : 'Failed to complete Phase 4');
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Equity Structure &amp; Ownership
        </h1>
        <p className="text-sm text-muted-foreground">
          Define your cap table, record stakeholders, setup ESOP, and simulate future funding rounds.
        </p>
      </div>

      <Phase4Tabs active={active} onChange={setActive} />

      <div className="min-h-[400px]">
        {active === 'overview' && <Phase4OverviewTab ctx={ctx} onNavigate={setActive} />}
        {active === 'cap-table' && <Phase4CapTableTab ctx={ctx} />}
        {active === 'esop' && <Phase4EsopTab ctx={ctx} />}
        {active === 'dilution' && <Phase4DilutionTab ctx={ctx} />}
        {active === 'history' && <Phase4HistoryTab ctx={ctx} />}
      </div>

      {/* Completion footer */}
      <div className="border-t border-border pt-5 flex flex-col gap-3">
        {completionError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-destructive">{completionError}</p>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground max-w-md">
            Completing Phase 4 locks your cap table, marks the exit waterfall reviewed, and unlocks Phase 5.
          </p>
          {phase4Done ? (
            <div className="flex items-center gap-2 text-success-text text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Phase 4 complete
            </div>
          ) : (
            <Button onClick={handleComplete} disabled={completing || currentPhase! > 4} className="gap-2">
              {completing && <Loader2 className="w-4 h-4 animate-spin" />}
              {currentPhase! > 4 ? 'Phase 4 Complete' : 'Complete Phase 4'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
