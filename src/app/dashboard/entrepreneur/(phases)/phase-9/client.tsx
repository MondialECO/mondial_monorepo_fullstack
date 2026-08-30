'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info, RefreshCcw, CheckCircle2, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { Phase9PipelineVisuals } from '@/components/entrepreneur/deals/Phase9PipelineVisuals';
import { MatchmakingTimeline } from '@/components/entrepreneur/deals/MatchmakingTimeline';
import entrepreneurApi, {
  DealActivityLogResponse,
  DealStatus,
  DealStatusResponse,
  DueDiligenceStatus,
  InvestorMatchResponse,
  TimelineEventResponse,
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

const VALID_TRANSITIONS: Record<string, string[]> = {
  'initiated': ['contacted', 'rejected', 'withdrawn'],
  'contacted': ['interested', 'rejected', 'withdrawn'],
  'interested': ['meeting_scheduled', 'due_diligence', 'rejected', 'withdrawn'],
  'meeting_scheduled': ['due_diligence', 'negotiating', 'rejected', 'withdrawn'],
  'due_diligence': ['negotiating', 'rejected', 'withdrawn'],
  'negotiating': ['term_sheet', 'rejected', 'withdrawn'],
  'term_sheet': ['agreement_sent', 'negotiating', 'rejected', 'withdrawn'],
  'agreement_sent': ['signed', 'rejected', 'withdrawn'],
  'signed': ['completed'],
  'completed': [],
  'rejected': [],
  'withdrawn': [],
};

function getErrorMessage(err: unknown): string {
  const status = (err as any)?.response?.status;
  const serverMsg = (err as any)?.response?.data?.message || (err as any)?.response?.data?.error;
  if (status === 409) return serverMsg || 'This action conflicts with the current deal state.';
  if (status === 404) return 'The requested deal or term sheet was not found.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 400) return serverMsg || 'Invalid request. Please check your input.';
  if (status === 500) return 'A server error occurred. Please try again later.';
  return serverMsg || 'Something went wrong. Please try again.';
}

export default function Phase9Client() {
  const router = useRouter();
  const { savePhaseData, getPhaseData } =
    useEntrepreneurProgress();

  const [matches, setMatches] = useState<InvestorMatchResponse[]>([]);
  const [deals, setDeals] = useState<DealStatusResponse[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [termSheet, setTermSheet] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEventResponse[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [activity, setActivity] = useState<DealActivityLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState('');
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isCompletingPhase, setIsCompletingPhase] = useState(false);
  const [completionError, setCompletionError] = useState('');

  // Due-diligence form
  const [ddItemName, setDdItemName] = useState('');
  const [ddCategory, setDdCategory] = useState<'legal' | 'financial' | 'technical' | 'business'>('legal');
  const [ddStatus, setDdStatus] = useState<DueDiligenceStatus>('pending');

  // Checklist form
  const [checklistInput, setChecklistInput] = useState('');

  // Focus management for detail panel
  const detailPanelRef = useRef<HTMLDivElement>(null);

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
      const [m, d, s, ts, tl] = await Promise.all([
        entrepreneurApi.getInvestorMatches(companyId).catch(() => []),
        entrepreneurApi.getCompanyDeals(companyId).catch(() => []),
        entrepreneurApi.getRoundSummary(companyId).catch(() => null),
        entrepreneurApi.getActiveTermSheet(companyId).catch(() => null),
        entrepreneurApi.getTimeline(companyId).catch(() => []),
      ]);
      setMatches(m);
      setDeals(d);
      setSummary(s);
      setTermSheet(ts);
      setTimeline(tl);

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
      } else {
        setSelectedDealId(null);
        setActivity([]);
      }
    } catch (e) {
      setError(getErrorMessage(e));
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
    if (!selectedDealId) {
      setActivity([]);
      return;
    }

    const abortController = new AbortController();

    const load = async () => {
      try {
        const log = await entrepreneurApi.getDealActivity(selectedDealId);
        if (!abortController.signal.aborted) {
          setActivity(log);
        }
      } catch {
        if (!abortController.signal.aborted) {
          setActivity([]);
        }
      }
    };

    void load();

    return () => abortController.abort();
  }, [selectedDealId]);

  useEffect(() => {
    if (selectedDealId && detailPanelRef.current) {
      detailPanelRef.current.focus();
    }
  }, [selectedDealId]);

  const buildTimeline = (dealId: string): any[] => {
    return activity.filter((a) => a.dealId === dealId).map((a) => ({
      id: a.id,
      eventType: a.eventType,
      fromStatus: a.fromStatus,
      toStatus: a.toStatus,
      occurredAt: a.occurredAt,
      notes: a.notes,
      dealId: a.dealId,
    }));
  };

  const handleCreateDeal = async (investorId: string, raise: number, valuation: number) => {
    if (isMutating) return;
    setIsMutating(true);
    try {
      const companyId = await resolveCompanyId();
      await entrepreneurApi.createDeal(companyId, investorId, {
        totalRaiseAmount: raise,
        postMoneyValuation: valuation,
        equityType: 'preferred',
        proRataRights: false,
        liquidationPreference: '1x_non_participating',
        boardSeats: 0,
        proposedClosingDate: new Date().toISOString(),
      });
      await reload();
    } finally {
      setIsMutating(false);
    }
  };

  const handleUpdateDealStatus = async (dealId: string, status: DealStatus) => {
    if (isMutating) return;
    setIsMutating(true);
    try {
      await entrepreneurApi.updateDealStatus(dealId, status);
      await reload();
    } finally {
      setIsMutating(false);
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

  const handleStatusChange = async (status: DealStatus) => {
    if (!selectedDealId || isMutating) return;
    setIsMutating(true);
    setError('');
    try {
      await entrepreneurApi.updateDealStatus(selectedDealId, status);
      await reload();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsMutating(false);
    }
  };

  const handleSignTermSheet = async (file: File | null) => {
    if (!selectedDealId || !file || isMutating) return;
    setIsMutating(true);
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
      setError(getErrorMessage(e));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDueDiligenceSubmit = async () => {
    if (!selectedDealId || !ddItemName.trim() || isMutating) return;
    setIsMutating(true);
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
      setError(getErrorMessage(e));
    } finally {
      setIsMutating(false);
    }
  };

  const handleChecklistAdd = async (completed: boolean) => {
    if (!selectedDealId || !checklistInput.trim() || isMutating) return;
    setIsMutating(true);
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
      setError(getErrorMessage(e));
    } finally {
      setIsMutating(false);
    }
  };

  const handleChecklistToggle = async (item: string, currentCompleted: boolean) => {
    if (!selectedDealId || isMutating) return;
    setIsMutating(true);
    setError('');
    try {
      await entrepreneurApi.progressChecklist(selectedDealId, {
        item,
        completed: !currentCompleted,
        owner: 'company',
      });
      await reload();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDocumentUpload = async (file: File | null) => {
    if (!selectedDealId || !file || isMutating) return;
    setIsMutating(true);
    setError('');
    try {
      await entrepreneurApi.uploadDealDocument(selectedDealId, file, 'other');
      await reload();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsMutating(false);
    }
  };

  const handleConfirmCloseDeal = async () => {
    if (!selectedDealId || isMutating) return;
    setIsMutating(true);
    setError('');
    try {
      await entrepreneurApi.closeDeal(selectedDealId);
      setIsCloseModalOpen(false);
      await reload();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsMutating(false);
    }
  };

  const handleCompleteFundingJourney = async () => {
    if (isCompletingPhase) return;
    setIsCompletingPhase(true);
    setCompletionError('');
    try {
      const companyId = await resolveCompanyId();
      const response = await entrepreneurApi.advancePhase(companyId, 9, {});
      if (response?.currentPhase === 10) {
        router.push('/dashboard/entrepreneur/phase-10');
      } else {
        await reload();
      }
    } catch (e) {
      setCompletionError(getErrorMessage(e));
    } finally {
      setIsCompletingPhase(false);
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-card border-2 border-border rounded-2xl animate-pulse" />
        <div className="h-32 bg-card border-2 border-border rounded-2xl animate-pulse" />
        <div className="h-32 bg-card border-2 border-border rounded-2xl animate-pulse" />
      </div>
    );
  }

  const timelineItems: any[] = selectedDealId ? buildTimeline(selectedDealId) : [];

  return (
    <div className="space-y-6">
      {/* Figma P9 — pipeline visuals (real data + honest shells) */}
      <Phase9PipelineVisuals
        deals={deals}
        summary={summary}
        termSheet={termSheet}
        matches={matches}
        timeline={timelineItems}
        onDataChanged={() => void reload()}
        onCreateDeal={handleCreateDeal}
        onUpdateDealStatus={handleUpdateDealStatus}
      />

      {/* Matchmaking Process timeline — round-level events (Phase 5/8 seeded) */}
      <MatchmakingTimeline events={timeline} />

      {/* Dev banner — explicit, no AI claims */}
      <div className="bg-warning/10 border border-warning/40 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="text-sm text-foreground">
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
        <div role="alert" aria-live="assertive" className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-3 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Advanced deal controls — full state machine, term-sheet signing, due
          diligence, checklist and documents. The Figma pipeline above is the
          primary view; these are the granular operations it builds on. */}
      <div className="flex items-center gap-3 pt-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Advanced deal controls</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Selected deal detail */}
      {selectedDeal && (
        <div ref={detailPanelRef} tabIndex={-1} className="bg-card border-2 border-border rounded-2xl p-6 space-y-4 focus:outline-none focus:ring-2 focus:ring-ring">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Deal {selectedDeal.dealId.slice(-6)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Investor: {selectedDeal.investors[0]?.investorName ?? '—'} ·
                Term sheet: {selectedDeal.termSheet.status} ·
                Raise: EUR {selectedDeal.termSheet.totalRaiseAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{selectedDeal.status}</p>
              <p className="text-xs text-muted-foreground">current state</p>
            </div>
          </div>

          <div className="flex justify-end">
            {selectedDeal.status === 'completed' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-text/10 text-success-text text-xs font-semibold">
                <Check className="w-4 h-4" /> Deal Closed & Recorded
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={selectedDeal.status !== 'signed' || isMutating}
                onClick={() => setIsCloseModalOpen(true)}
              >
                {isMutating ? 'Closing…' : 'Close deal (signed → completed)'}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase text-muted-foreground block mb-1">
                Advance status
              </label>
              {/* TODO: Replace with shadcn <Select> primitive for full design-system compliance.
                  Deferred to avoid visual design changes. See audit report HIGH 1. */}
              <select
                aria-label="Advance deal status"
                disabled={isMutating || (VALID_TRANSITIONS[selectedDeal.status]?.length ?? 0) === 0}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                value={selectedDeal.status}
                onChange={(e) => void handleStatusChange(e.target.value as DealStatus)}
                title={
                  (VALID_TRANSITIONS[selectedDeal.status]?.length ?? 0) === 0
                    ? 'This deal is in a terminal state and cannot be changed'
                    : undefined
                }
              >
                <option value={selectedDeal.status}>{selectedDeal.status}</option>
                {(VALID_TRANSITIONS[selectedDeal.status] ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {(VALID_TRANSITIONS[selectedDeal.status]?.length ?? 0) === 0
                  ? 'This deal is complete and cannot be changed.'
                  : 'Backend enforces the transition graph; illegal moves return 409.'}
              </p>
            </div>

            <div>
              <label htmlFor="term-sheet-upload" className="text-xs uppercase text-muted-foreground block mb-1 cursor-pointer">
                Upload signed term sheet
              </label>
              <input
                id="term-sheet-upload"
                type="file"
                aria-label="Upload signed term sheet document"
                accept=".pdf,.docx,.doc,.xlsx"
                className="sr-only"
                onChange={(e) => void handleSignTermSheet(e.target.files?.[0] ?? null)}
              />
              <div className="inline-flex px-3 py-2 rounded-md border border-input bg-background text-sm text-muted-foreground">
                <label htmlFor="term-sheet-upload" className="cursor-pointer">
                  Choose file
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires term sheet axis to be in &apos;agreed&apos; first.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Due diligence */}
      {selectedDeal && (
        <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Due diligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              className="bg-background border border-input rounded-md px-3 py-2 text-sm md:col-span-2"
              placeholder="Item name (e.g. Cap table review)"
              value={ddItemName}
              onChange={(e) => setDdItemName(e.target.value)}
            />
            <select
              aria-label="Due diligence category"
              className="bg-background border border-input rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={ddCategory}
              onChange={(e) => setDdCategory(e.target.value as typeof ddCategory)}
            >
              <option value="legal">legal</option>
              <option value="financial">financial</option>
              <option value="technical">technical</option>
              <option value="business">business</option>
            </select>
            <select
              aria-label="Due diligence status"
              className="bg-background border border-input rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={ddStatus}
              onChange={(e) => setDdStatus(e.target.value as DueDiligenceStatus)}
            >
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
              <option value="flagged">flagged</option>
            </select>
          </div>
          <Button onClick={handleDueDiligenceSubmit} disabled={isMutating}>
            {isMutating ? 'Saving…' : 'Add / update item'}
          </Button>

          {selectedDeal.dueDiligenceChecklist && selectedDeal.dueDiligenceChecklist.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-semibold">Items:</p>
              <ul className="space-y-1">
                {selectedDeal.dueDiligenceChecklist.map((item) => (
                  <li
                    key={item.itemName}
                    className="flex items-center justify-between text-sm bg-background border border-input rounded-md px-3 py-2"
                  >
                    <span className="text-foreground">
                      <span className="font-semibold">{item.itemName}</span>
                      <span className="text-xs text-muted-foreground ml-2">[{item.category}]</span>
                      <span className="text-xs bg-muted/40 px-2 py-0.5 rounded ml-2 inline-block">
                        {item.status}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No due diligence items yet.</p>
          )}
        </div>
      )}

      {/* Closing checklist */}
      {selectedDeal && (
        <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-3">
          <h3 className="text-lg font-bold text-foreground">Closing checklist</h3>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm"
              placeholder="Checklist item (e.g. Sign SPA)"
              value={checklistInput}
              onChange={(e) => setChecklistInput(e.target.value)}
              disabled={isMutating}
            />
            <Button variant="outline" onClick={() => handleChecklistAdd(false)} disabled={isMutating}>
              {isMutating ? 'Adding…' : 'Add pending'}
            </Button>
            <Button onClick={() => handleChecklistAdd(true)} disabled={isMutating}>
              {isMutating ? 'Adding…' : 'Add as done'}
            </Button>
          </div>
          {selectedDeal.closingChecklist.length === 0 ? (
            <p className="text-xs text-muted-foreground">No checklist items yet.</p>
          ) : (
            <ul className="space-y-1">
              {selectedDeal.closingChecklist.map((c) => (
                <li
                  key={c.item}
                  className="flex items-center justify-between text-sm bg-background border border-input rounded-md px-3 py-2"
                >
                  <span className={c.completed ? 'text-muted-foreground line-through' : 'text-foreground'}>
                    {c.item}
                    <span className="text-xs text-muted-foreground ml-2">[{c.owner}]</span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleChecklistToggle(c.item, c.completed)}
                    disabled={isMutating}
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
        <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-3">
          <h3 className="text-lg font-bold text-foreground">Deal documents</h3>
          <p className="text-xs text-muted-foreground">
            Documents are stored per deal; downloads require deal ownership.
            Signed term sheets are uploaded via the deal-detail panel above and
            recorded with kind <code>term_sheet</code>.
          </p>
          <label htmlFor="deal-document-upload" className="text-xs uppercase text-muted-foreground block mb-1 cursor-pointer">
            Upload document
          </label>
          <input
            id="deal-document-upload"
            type="file"
            aria-label="Upload deal document"
            accept=".pdf,.docx,.doc,.xlsx,.jpg,.png"
            className="sr-only"
            onChange={(e) => void handleDocumentUpload(e.target.files?.[0] ?? null)}
          />
          <div className="inline-flex px-3 py-2 rounded-md border border-input bg-background text-sm text-muted-foreground">
            <label htmlFor="deal-document-upload" className="cursor-pointer">
              Choose file
            </label>
          </div>

          {selectedDeal.dealDocuments && selectedDeal.dealDocuments.length > 0 ? (
            <div className="space-y-2 mt-4">
              <p className="text-xs text-muted-foreground font-semibold">Uploaded documents:</p>
              <ul className="space-y-1">
                {selectedDeal.dealDocuments.map((doc) => (
                  <li
                    key={doc.documentId}
                    className="flex items-center justify-between text-sm bg-background border border-input rounded-md px-3 py-2"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{doc.fileName}</span>
                      <span className="text-xs text-muted-foreground ml-2">({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                      {doc.uploadedAt && (
                        <span className="text-xs text-muted-foreground block">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = `/api/companies/deals/${selectedDeal.dealId}/documents/${doc.documentId}`;
                        a.download = doc.fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      disabled={isMutating}
                    >
                      Download
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
          )}
        </div>
      )}

      {/* Activity timeline (backend-derived) */}
      {selectedDeal && (
        <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Activity timeline</h3>
            <span className="text-xs bg-muted/60 px-2 py-1 rounded text-muted-foreground">
              Deal {selectedDeal.dealId.slice(-6)}
            </span>
          </div>
          {activity.length === 0 ? (
            <p className="text-xs text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="text-xs text-muted-foreground bg-background border border-input rounded-md p-2 font-mono"
                >
                  <span className="text-foreground font-semibold">{a.eventType}</span>
                  {a.fromStatus && a.toStatus && ` · ${a.fromStatus} → ${a.toStatus}`}
                  {a.notes && ` · ${a.notes}`}
                  <span className="block text-muted-foreground">
                    {new Date(a.occurredAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Close Deal Confirmation Dialog */}
      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deal Closing</DialogTitle>
            <DialogDescription>
              Both parties have signed. Closing this deal will record the investment in the investor portfolio and, for equity investments, update the company cap table.
            </DialogDescription>
          </DialogHeader>

          {selectedDeal && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investor:</span>
                <span className="font-semibold text-foreground">{selectedDeal.investors[0]?.investorName || 'Investor'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investment Amount:</span>
                <span className="font-semibold text-foreground">EUR {selectedDeal.termSheet.totalRaiseAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Post-Money Valuation:</span>
                <span className="font-semibold text-foreground">EUR {selectedDeal.termSheet.postMoneyValuation.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Instrument:</span>
                <span className="font-semibold text-foreground capitalize">{selectedDeal.termSheet.equityType || 'Equity'}</span>
              </div>
              {selectedDeal.termSheet.investorEquityPercent > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Equity Percentage:</span>
                  <span className="font-semibold text-foreground">{selectedDeal.termSheet.investorEquityPercent}%</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isMutating}
              onClick={() => setIsCloseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isMutating}
              onClick={handleConfirmCloseDeal}
            >
              {isMutating ? 'Closing Deal…' : 'Close Deal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Funding Journey CTA — enabled strictly when >= 1 deal is completed */}
      {deals.some((d) => d.status === 'completed') && (
        <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Complete Funding Journey</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your investment deal is closed and recorded. Complete this phase to finish your Founder-to-Funding journey.
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold"
              disabled={isCompletingPhase}
              onClick={handleCompleteFundingJourney}
            >
              {isCompletingPhase ? 'Completing Journey…' : 'Complete Funding Journey'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {completionError && (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {completionError}
            </div>
          )}
        </div>
      )}

      {/* Info footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-input">
        <p className="text-xs text-muted-foreground">
          Phase 9 requires at least one completed investment deal to finalize the funding journey.
        </p>
      </div>
    </div>
  );
}
