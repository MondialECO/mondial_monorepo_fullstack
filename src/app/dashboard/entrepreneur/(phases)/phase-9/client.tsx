'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import entrepreneurApi, {
  DealActivityLogResponse,
  DealStatus,
  DealStatusResponse,
  DueDiligenceStatus,
  InvestorMatchResponse,
} from '@/lib/api-entrepreneur';
import { Phase9Data } from '@/types/entrepreneur';

const TERMINAL_SUCCESS: DealStatus[] = ['signed', 'completed'];

const DEAL_STATUS_OPTIONS: DealStatus[] = [
  'initiated',
  'contacted',
  'interested',
  'meeting_scheduled',
  'due_diligence',
  'negotiating',
  'term_sheet',
  'agreement_sent',
  'signed',
  'completed',
  'rejected',
  'withdrawn',
];

export default function Phase9Client() {
  const router = useRouter();
  const { savePhaseData, getPhaseData, applyBackendResponse } =
    useEntrepreneurProgress();

  const [matches, setMatches] = useState<InvestorMatchResponse[]>([]);
  const [deals, setDeals] = useState<DealStatusResponse[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [activity, setActivity] = useState<DealActivityLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state for "Create deal" inline section.
  const [newDealInvestorId, setNewDealInvestorId] = useState('');
  const [newDealRaise, setNewDealRaise] = useState('');
  const [newDealValuation, setNewDealValuation] = useState('');

  // Due-diligence form
  const [ddItemName, setDdItemName] = useState('');
  const [ddCategory, setDdCategory] = useState<'legal' | 'financial' | 'technical' | 'business'>('legal');
  const [ddStatus, setDdStatus] = useState<DueDiligenceStatus>('pending');

  // Checklist form
  const [checklistInput, setChecklistInput] = useState('');

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase9Data = getPhaseData<Phase9Data>(9) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const reload = async () => {
    try {
      const companyId = await resolveCompanyId();
      const [m, d] = await Promise.all([
        entrepreneurApi.getInvestorMatches(companyId).catch(() => []),
        entrepreneurApi.getCompanyDeals(companyId).catch(() => []),
      ]);
      setMatches(m);
      setDeals(d);

      const signedCount = d.filter((x) =>
        TERMINAL_SUCCESS.includes(x.status as DealStatus),
      ).length;

      const existing: Phase9Data = getPhaseData<Phase9Data>(9) ?? {};
      savePhaseData(9, {
        ...existing,
        __companyId: companyId,
        dealsCount: d.length,
        signedDealsCount: signedCount,
      });

      // Keep current selection if still valid; otherwise pick the first deal.
      if (d.length > 0) {
        const nextSelected =
          selectedDealId && d.some((x) => x.dealId === selectedDealId)
            ? selectedDealId
            : d[0].dealId;
        setSelectedDealId(nextSelected);
        await loadActivity(nextSelected);
      } else {
        setSelectedDealId(null);
        setActivity([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Phase 9 data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivity = async (dealId: string) => {
    try {
      const log = await entrepreneurApi.getDealActivity(dealId);
      setActivity(log);
    } catch {
      setActivity([]);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDeal = useMemo(
    () => deals.find((d) => d.dealId === selectedDealId) ?? null,
    [deals, selectedDealId],
  );

  const handleCreateDeal = async () => {
    setError('');
    if (!newDealInvestorId || !newDealRaise || !newDealValuation) {
      setError('investor, raise amount, and valuation are required');
      return;
    }
    try {
      const companyId = await resolveCompanyId();
      const raise = Number(newDealRaise);
      const valuation = Number(newDealValuation);
      if (!Number.isFinite(raise) || raise <= 0)
        throw new Error('raise must be > 0');
      if (!Number.isFinite(valuation) || valuation <= 0)
        throw new Error('valuation must be > 0');

      await entrepreneurApi.createDeal(companyId, newDealInvestorId, {
        totalRaiseAmount: raise,
        postMoneyValuation: valuation,
        equityType: 'preferred',
        proRataRights: false,
        liquidationPreference: '1x_non_participating',
        boardSeats: 0,
        proposedClosingDate: new Date().toISOString(),
      });

      setNewDealInvestorId('');
      setNewDealRaise('');
      setNewDealValuation('');

      const existing: Phase9Data = getPhaseData<Phase9Data>(9) ?? {};
      savePhaseData(9, {
        ...existing,
        lastDealCreatedAt: new Date().toISOString(),
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create deal failed');
    }
  };

  const handleStatusChange = async (status: DealStatus) => {
    if (!selectedDealId) return;
    setError('');
    try {
      await entrepreneurApi.updateDealStatus(selectedDealId, status);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed');
    }
  };

  const handleSignTermSheet = async (file: File | null) => {
    if (!selectedDealId || !file) return;
    setError('');
    try {
      await entrepreneurApi.signTermSheet(selectedDealId, file);
      const existing: Phase9Data = getPhaseData<Phase9Data>(9) ?? {};
      savePhaseData(9, {
        ...existing,
        lastTermSheetSignedAt: new Date().toISOString(),
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Term sheet sign failed');
    }
  };

  const handleDueDiligenceSubmit = async () => {
    if (!selectedDealId || !ddItemName.trim()) return;
    setError('');
    try {
      await entrepreneurApi.mutateDueDiligenceItem(selectedDealId, {
        itemName: ddItemName.trim(),
        category: ddCategory,
        status: ddStatus,
      });
      setDdItemName('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Due diligence update failed');
    }
  };

  const handleChecklistAdd = async (completed: boolean) => {
    if (!selectedDealId || !checklistInput.trim()) return;
    setError('');
    try {
      await entrepreneurApi.progressChecklist(selectedDealId, {
        item: checklistInput.trim(),
        completed,
        owner: 'company',
      });
      setChecklistInput('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checklist update failed');
    }
  };

  const handleChecklistToggle = async (item: string, currentCompleted: boolean) => {
    if (!selectedDealId) return;
    setError('');
    try {
      await entrepreneurApi.progressChecklist(selectedDealId, {
        item,
        completed: !currentCompleted,
        owner: 'company',
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checklist toggle failed');
    }
  };

  const handleDocumentUpload = async (file: File | null) => {
    if (!selectedDealId || !file) return;
    setError('');
    try {
      await entrepreneurApi.uploadDealDocument(selectedDealId, file, 'other');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Document upload failed');
    }
  };

  const handleCloseDeal = async () => {
    if (!selectedDealId) return;
    setError('');
    try {
      // Dedicated close endpoint; backend enforces signed -> completed transition.
      await entrepreneurApi.closeDeal(selectedDealId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Close failed (deal must be signed first)');
    }
  };

  const handleAdvance = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();
      const advanceResponse = await entrepreneurApi.advancePhase(
        companyId,
        9,
        {},
      );
      if (advanceResponse?.currentPhase !== 10) {
        throw new Error(
          `Phase advancement failed - expected currentPhase=10, got ${advanceResponse?.currentPhase}`,
        );
      }
      if (!advanceResponse?.completedPhases?.includes(9)) {
        throw new Error('Phase 9 not marked as completed in backend response');
      }
      applyBackendResponse(advanceResponse);

      const existing: Phase9Data = getPhaseData<Phase9Data>(9) ?? {};
      savePhaseData(9, {
        ...existing,
        __companyId: companyId,
        submittedAt: new Date().toISOString(),
      });

      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-10');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Advance failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAdvance = deals.some((d) =>
    TERMINAL_SUCCESS.includes(d.status as DealStatus),
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-neutral-3 border-2 border-neutral-4 rounded-2xl animate-pulse" />
        <div className="h-32 bg-neutral-3 border-2 border-neutral-4 rounded-2xl animate-pulse" />
        <div className="h-32 bg-neutral-3 border-2 border-neutral-4 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dev banner — explicit, no AI claims */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Deterministic deal pipeline active</p>
          <p>
            Deal state transitions, term-sheet signing, and document storage are
            persisted by the backend and constrained by a strict 12-state machine.
            Illegal transitions are rejected with HTTP 400. No AI-derived signals
            (sentiment, deal-success prediction, negotiation insights) are surfaced
            here; LLM analysis will be added once provider credentials are configured.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-md p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create deal */}
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-neutral-1">Create deal</h3>
        <p className="text-xs text-neutral-5">
          Pick an investor from your matches and seed the term sheet. The deal
          starts in <code>initiated</code>; move it through the pipeline via the
          status selector once created.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            className="bg-background border border-neutral-2 rounded-md px-3 py-2 text-sm"
            value={newDealInvestorId}
            onChange={(e) => setNewDealInvestorId(e.target.value)}
          >
            <option value="">Select investor…</option>
            {matches.map((m) => (
              <option key={m.matchId} value={m.investorId}>
                {m.investorName ?? m.investorId} ({m.matchScore})
              </option>
            ))}
          </select>
          <input
            className="bg-background border border-neutral-2 rounded-md px-3 py-2 text-sm"
            placeholder="Total raise (EUR)"
            type="number"
            min="0"
            value={newDealRaise}
            onChange={(e) => setNewDealRaise(e.target.value)}
          />
          <input
            className="bg-background border border-neutral-2 rounded-md px-3 py-2 text-sm"
            placeholder="Post-money valuation (EUR)"
            type="number"
            min="0"
            value={newDealValuation}
            onChange={(e) => setNewDealValuation(e.target.value)}
          />
        </div>
        <Button onClick={handleCreateDeal} disabled={matches.length === 0}>
          Create deal
        </Button>
        {matches.length === 0 && (
          <p className="text-xs text-neutral-5">
            No investor matches available — generate matches in Phase 8 first.
          </p>
        )}
      </div>

      {/* Deal list + selector */}
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-neutral-1">Deals</h3>
            <p className="text-xs text-neutral-5 mt-1">
              {isLoading
                ? 'Loading…'
                : deals.length === 0
                  ? 'No deals yet. Create one above.'
                  : `${deals.length} deal${deals.length === 1 ? '' : 's'} · ${deals.filter((d) => TERMINAL_SUCCESS.includes(d.status as DealStatus)).length} signed/completed`}
            </p>
          </div>
          <Button variant="outline" onClick={() => void reload()} className="gap-2">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {deals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {deals.map((d) => (
              <button
                key={d.dealId}
                onClick={() => {
                  setSelectedDealId(d.dealId);
                  void loadActivity(d.dealId);
                }}
                className={`text-xs px-3 py-1.5 rounded-md border ${
                  d.dealId === selectedDealId
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-neutral-2 text-neutral-1'
                }`}
              >
                {d.investors[0]?.investorName ?? d.dealId.slice(-6)} · {d.status}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected deal detail */}
      {selectedDeal && (
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-neutral-1">
                Deal {selectedDeal.dealId.slice(-6)}
              </h3>
              <p className="text-xs text-neutral-5 mt-1">
                Investor: {selectedDeal.investors[0]?.investorName ?? '—'} ·
                Term sheet: {selectedDeal.termSheet.status} ·
                Raise: EUR {selectedDeal.termSheet.totalRaiseAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-neutral-1">{selectedDeal.status}</p>
              <p className="text-xs text-neutral-5">current state</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              disabled={selectedDeal.status !== 'signed'}
              onClick={handleCloseDeal}
            >
              Close deal (signed → completed)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase text-neutral-5 block mb-1">
                Advance status
              </label>
              <select
                className="w-full bg-background border border-neutral-2 rounded-md px-3 py-2 text-sm"
                value={selectedDeal.status}
                onChange={(e) => void handleStatusChange(e.target.value as DealStatus)}
              >
                {DEAL_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-5 mt-1">
                Backend enforces the transition graph; illegal moves return 400.
              </p>
            </div>

            <div>
              <label className="text-xs uppercase text-neutral-5 block mb-1">
                Upload signed term sheet
              </label>
              <input
                type="file"
                className="block w-full text-xs"
                onChange={(e) => void handleSignTermSheet(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-neutral-5 mt-1">
                Requires term sheet axis to be in &apos;agreed&apos; first.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Due diligence */}
      {selectedDeal && (
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-neutral-1">Due diligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              className="bg-background border border-neutral-2 rounded-md px-3 py-2 text-sm md:col-span-2"
              placeholder="Item name (e.g. Cap table review)"
              value={ddItemName}
              onChange={(e) => setDdItemName(e.target.value)}
            />
            <select
              className="bg-background border border-neutral-2 rounded-md px-3 py-2 text-sm"
              value={ddCategory}
              onChange={(e) => setDdCategory(e.target.value as typeof ddCategory)}
            >
              <option value="legal">legal</option>
              <option value="financial">financial</option>
              <option value="technical">technical</option>
              <option value="business">business</option>
            </select>
            <select
              className="bg-background border border-neutral-2 rounded-md px-3 py-2 text-sm"
              value={ddStatus}
              onChange={(e) => setDdStatus(e.target.value as DueDiligenceStatus)}
            >
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
              <option value="flagged">flagged</option>
            </select>
          </div>
          <Button onClick={handleDueDiligenceSubmit}>Add / update item</Button>
        </div>
      )}

      {/* Closing checklist */}
      {selectedDeal && (
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-3">
          <h3 className="text-lg font-bold text-neutral-1">Closing checklist</h3>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-background border border-neutral-2 rounded-md px-3 py-2 text-sm"
              placeholder="Checklist item (e.g. Sign SPA)"
              value={checklistInput}
              onChange={(e) => setChecklistInput(e.target.value)}
            />
            <Button variant="outline" onClick={() => handleChecklistAdd(false)}>
              Add pending
            </Button>
            <Button onClick={() => handleChecklistAdd(true)}>Add as done</Button>
          </div>
          {selectedDeal.closingChecklist.length === 0 ? (
            <p className="text-xs text-neutral-5">No checklist items yet.</p>
          ) : (
            <ul className="space-y-1">
              {selectedDeal.closingChecklist.map((c) => (
                <li
                  key={c.item}
                  className="flex items-center justify-between text-sm bg-background border border-neutral-2 rounded-md px-3 py-2"
                >
                  <span className={c.completed ? 'text-neutral-5 line-through' : 'text-neutral-1'}>
                    {c.item}
                    <span className="text-xs text-neutral-5 ml-2">[{c.owner}]</span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleChecklistToggle(c.item, c.completed)}
                  >
                    {c.completed ? 'Reopen' : 'Mark done'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Deal documents */}
      {selectedDeal && (
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-3">
          <h3 className="text-lg font-bold text-neutral-1">Deal documents</h3>
          <p className="text-xs text-neutral-5">
            Documents are stored per deal; downloads require deal ownership.
            Signed term sheets are uploaded via the deal-detail panel above and
            recorded with kind <code>term_sheet</code>.
          </p>
          <label className="text-xs uppercase text-neutral-5 block">
            Upload other document
          </label>
          <input
            type="file"
            className="block w-full text-xs"
            onChange={(e) => void handleDocumentUpload(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {/* Activity timeline (backend-derived) */}
      {selectedDeal && (
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-3">
          <h3 className="text-lg font-bold text-neutral-1">Activity timeline</h3>
          {activity.length === 0 ? (
            <p className="text-xs text-neutral-5">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="text-xs text-neutral-5 bg-background border border-neutral-2 rounded-md p-2 font-mono"
                >
                  <span className="text-neutral-1 font-semibold">{a.eventType}</span>
                  {a.fromStatus && a.toStatus && ` · ${a.fromStatus} → ${a.toStatus}`}
                  {a.notes && ` · ${a.notes}`}
                  <span className="block text-neutral-5">
                    {new Date(a.occurredAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Advance footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-2">
        <p className="text-xs text-neutral-5">
          {canAdvance
            ? 'At least one deal is signed/completed — Phase 9 can advance.'
            : 'At least one deal must reach signed or completed before Phase 9 can advance.'}
        </p>
        <Button
          onClick={handleAdvance}
          disabled={!canAdvance || isSubmitting}
        >
          {isSubmitting ? 'Advancing…' : 'Complete Phase 9'}
        </Button>
      </div>
    </div>
  );
}
