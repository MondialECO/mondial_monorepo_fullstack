'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  Lock,
  RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import entrepreneurApi, {
  InvestorMatchResponse,
  MatchingInsightsResponse,
  type FundingProfileResponse,
} from '@/lib/api-entrepreneur';
import { Phase8Data } from '@/types/entrepreneur';

export default function Phase8Client() {
  const router = useRouter();
  const { savePhaseData, moveToNextStep, getPhaseData, applyBackendResponse, currentPhase } =
    useEntrepreneurProgress();

  const [matches, setMatches] = useState<InvestorMatchResponse[]>([]);
  const [insights, setInsights] = useState<MatchingInsightsResponse | null>(null);
  const [funding, setFunding] = useState<FundingProfileResponse | null>(null);
  const [investorReady, setInvestorReady] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filterStage, setFilterStage] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterTicketSize, setFilterTicketSize] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase8Data = getPhaseData<Phase8Data>(8) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const reload = async () => {
    try {
      const prog = await entrepreneurApi.getCurrentPhase();
      const companyId = (getPhaseData<Phase8Data>(8) ?? {}).__companyId ?? prog.companyId;
      setInvestorReady(prog.isInvestorReady);
      if (!companyId) return;
      const [m, i, f] = await Promise.all([
        entrepreneurApi.getInvestorMatches(companyId),
        entrepreneurApi.getMatchingInsights(companyId).catch(() => null),
        entrepreneurApi.getFundingProfile(companyId).catch(() => null),
      ]);
      setMatches(m);
      setInsights(i);
      setFunding(f);
      const existing: Phase8Data = getPhaseData<Phase8Data>(8) ?? {};
      savePhaseData(8, {
        ...existing,
        __companyId: companyId,
        matchesCount: m.length,
        matchesGeneratedAt: m[0]?.matchedAt,
      });
    } catch {
      // empty hydration is fine; user can still regenerate
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = async () => {
    setError('');
    setIsRegenerating(true);
    try {
      const companyId = await resolveCompanyId();
      const fresh = await entrepreneurApi.regenerateInvestorMatches(companyId);
      setMatches(fresh);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regenerate failed');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleStatusUpdate = async (matchId: string, status: string) => {
    setError('');
    try {
      const companyId = await resolveCompanyId();
      const updated = await entrepreneurApi.updateMatchStatus(companyId, matchId, status);
      setMatches((prev) => prev.map((m) => (m.matchId === matchId ? updated : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed');
    }
  };

  const handleInteraction = async (matchId: string, kind: string) => {
    setError('');
    try {
      const companyId = await resolveCompanyId();
      await entrepreneurApi.recordInvestorInteraction(companyId, matchId, kind, '');
      const existing: Phase8Data = getPhaseData<Phase8Data>(8) ?? {};
      savePhaseData(8, { ...existing, lastInteractionAt: new Date().toISOString() });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Interaction failed');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();
      const advanceResponse = await entrepreneurApi.advancePhase(companyId, 8, {});
      if (advanceResponse?.currentPhase !== 10) {
        throw new Error(
          `Phase advancement failed - expected currentPhase=10, got ${advanceResponse?.currentPhase}`,
        );
      }
      if (!advanceResponse?.completedPhases?.includes(8)) {
        throw new Error('Phase 8 not marked as completed in backend response');
      }
      if (!advanceResponse?.completedPhases?.includes(9)) {
        throw new Error('Phase 9 not auto-completed in backend response');
      }
      applyBackendResponse(advanceResponse);
      const existing: Phase8Data = getPhaseData<Phase8Data>(8) ?? {};
      savePhaseData(8, {
        ...existing,
        __companyId: companyId,
        submittedAt: new Date().toISOString(),
      });
      moveToNextStep(8, 1);
      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-9');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAdvance = matches.some((m) => m.matchScore >= 40);

  const interestedCount = matches.filter((m) => (m.status || '').toLowerCase() === 'interested').length;
  const acceptedCount = matches.filter((m) => (m.status || '').toLowerCase() === 'accepted').length;

  // Extract unique filter values
  const stages = Array.from(new Set(matches.map((m) => m.preferredRound).filter(Boolean))) as string[];
  const types = Array.from(new Set(matches.map((m) => m.investorType).filter(Boolean))) as string[];
  const locations = Array.from(new Set(matches.map((m) => m.investmentRange).filter(Boolean))) as string[];
  const ticketSizes = Array.from(new Set(matches.map((m) => m.investmentRange).filter(Boolean))) as string[];

  // Apply all filters
  const visible = matches.filter((m) => {
    // Tab filter
    if (activeTab === 'all') {
      // pass
    } else if (activeTab === 'interested') {
      if ((m.status || '').toLowerCase() !== 'interested') return false;
    } else if (activeTab === 'accepted') {
      if ((m.status || '').toLowerCase() !== 'accepted') return false;
    }

    // Stage filter
    if (filterStage && m.preferredRound !== filterStage) return false;

    // Type filter
    if (filterType && m.investorType !== filterType) return false;

    // Location filter (stub for now - can be enhanced with country data)
    if (filterLocation && m.investmentRange !== filterLocation) return false;

    // Ticket Size filter
    if (filterTicketSize && m.investmentRange !== filterTicketSize) return false;

    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col" style={{ backgroundColor: 'var(--dr-bg-page)' }}>
      {/* Page Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-semibold leading-[40px]" style={{ color: 'var(--dr-text-primary)' }}>
            Investor Matching — Phase 8
          </h1>
          <p className="text-sm" style={{ color: 'var(--dr-text-secondary)' }}>
            AI has matched your company with {insights?.totalMatches ?? 0} compatible investors.
            Express interest to begin a conversation.
          </p>
        </div>
        <span className="flex items-center gap-1.5 border border-black/8 px-3 py-1 rounded-full text-sm font-semibold shrink-0" style={{ backgroundColor: 'var(--dr-bg-green)', color: 'var(--p8-green)' }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--p8-green)' }} />
          AI MATCHING LIVE
        </span>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* AI Matches */}
        <div className="border border-white rounded-xl px-4 py-3 flex flex-col gap-2 drop-shadow-sm" style={{ backgroundColor: 'var(--dr-bg-card)' }}>
          <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--dr-text-muted)' }}>AI Matches</span>
          <span className="text-[24px] font-semibold leading-[32px]" style={{ color: 'var(--dr-text-primary)' }}>
            {insights?.totalMatches ?? 0}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--dr-text-muted)' }}>Compatible investors</span>
        </div>

        {/* Expressions of Interest */}
        <div className="border border-white rounded-xl px-4 py-3 flex flex-col gap-2 drop-shadow-sm" style={{ backgroundColor: 'var(--dr-bg-card)' }}>
          <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--dr-text-muted)' }}>Expressions</span>
          <span className="text-[24px] font-semibold leading-[32px]" style={{ color: 'var(--dr-yellow)' }}>
            {insights?.highScoreMatches ?? 0}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--dr-text-muted)' }}>Investors interested</span>
        </div>

        {/* Handshakes Confirmed */}
        <div className="border border-white rounded-xl px-4 py-3 flex flex-col gap-2 drop-shadow-sm" style={{ backgroundColor: 'var(--dr-bg-card)' }}>
          <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--dr-text-muted)' }}>Handshakes</span>
          <span className="text-[24px] font-semibold leading-[32px]" style={{ color: 'var(--p8-green)' }}>
            {acceptedCount}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--dr-text-muted)' }}>Meeting scheduled</span>
        </div>

        {/* Profile Views */}
        <div className="border border-white rounded-xl px-4 py-3 flex flex-col gap-2 drop-shadow-sm" style={{ backgroundColor: 'var(--dr-bg-card)' }}>
          <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--dr-text-muted)' }}>Profile Views</span>
          <span className="text-[24px] font-semibold leading-[32px]" style={{ color: 'var(--dr-primary)' }}>
            {insights?.interactionsCount ?? 0}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--dr-text-muted)' }}>Meeting scheduled</span>
        </div>
      </div>

      {/* Funding Ask Info Bar */}
      <div className="border border-white rounded-lg px-4 py-3.5 flex justify-between items-center" style={{ backgroundColor: 'var(--dr-bg-card)' }}>
        <div className="flex items-center gap-3 h-full">
          <span className="text-xs font-semibold" style={{ color: 'var(--p8-green)' }}>Your funding ask is live</span>
          <div className="w-px h-full bg-black/8" />
          <span className="text-xs font-medium" style={{ color: 'var(--dr-text-primary)' }}>{funding?.fundingRoundType ?? '—'}</span>
          <div className="w-px h-full bg-black/8" />
          <span className="text-xs font-medium" style={{ color: 'var(--dr-text-primary)' }}>${funding?.fundingAskAmount?.toLocaleString() ?? '—'}</span>
          <div className="w-px h-full bg-black/8" />
          <span className="text-xs font-medium" style={{ color: 'var(--dr-text-primary)' }}>
            {funding?.equityOfferedPercent ?? '—'}%{' '}
            <span className="text-[11px]" style={{ color: 'var(--dr-text-secondary)' }}>equity</span>
          </span>
          {investorReady && (
            <>
              <div className="w-px h-full bg-black/8" />
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--dr-bg-green)', color: 'var(--p8-green)' }}>
                Investor-Ready Badge ✓
              </span>
            </>
          )}
        </div>
        <button
          onClick={() => router.push('/dashboard/entrepreneur/phase-5')}
          className="bg-white border border-black/8 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors" style={{ color: 'var(--dr-text-secondary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dr-bg-card)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          Edit Ask
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b-2 border-black/8 flex gap-6 overflow-x-auto" role="tablist">
        {[
          { key: 'all', label: `All Matches (${matches.length})` },
          { key: 'interested', label: `Interested in you (${interestedCount})` },
          { key: 'accepted', label: `Handshakes (${acceptedCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            aria-selected={activeTab === tab.key}
            className="px-2 pb-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
            style={{
              borderColor: activeTab === tab.key ? 'var(--dr-primary)' : 'transparent',
              color: activeTab === tab.key ? 'var(--dr-primary)' : 'var(--dr-text-muted)',
            }}
            onMouseEnter={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = 'var(--dr-primary)'; }}
            onMouseLeave={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = 'var(--dr-text-muted)'; }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex gap-3 flex-wrap">
        {/* Stage Filter */}
        <div className="relative group">
          <button className="bg-white border border-black/8 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:border-black/12 transition-colors" style={{ color: 'var(--dr-text-secondary)' }}>
            Stage
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-black/8 rounded-lg shadow-lg p-2 z-10 hidden group-hover:block">
            <button
              onClick={() => setFilterStage('')}
              style={{
                backgroundColor: filterStage === '' ? 'var(--dr-bg-blue)' : 'transparent',
                color: filterStage === '' ? 'var(--dr-primary)' : 'var(--dr-text-primary)',
                fontWeight: filterStage === '' ? '500' : 'normal',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { if (filterStage !== '') e.currentTarget.style.backgroundColor = 'var(--dr-bg-card)'; }}
              onMouseLeave={(e) => { if (filterStage !== '') e.currentTarget.style.backgroundColor = 'transparent'; }}
              className="block w-full text-left px-3 py-2 text-sm rounded-md transition-colors"
            >
              All Stages
            </button>
            {stages.map((stage) => (
              <button
                key={stage}
                onClick={() => setFilterStage(stage)}
                style={{
                  backgroundColor: filterStage === stage ? 'var(--dr-bg-blue)' : 'transparent',
                  color: filterStage === stage ? 'var(--dr-primary)' : 'var(--dr-text-primary)',
                  fontWeight: filterStage === stage ? '500' : 'normal',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { if (filterStage !== stage) e.currentTarget.style.backgroundColor = 'var(--dr-bg-card)'; }}
                onMouseLeave={(e) => { if (filterStage !== stage) e.currentTarget.style.backgroundColor = 'transparent'; }}
                className="block w-full text-left px-3 py-2 text-sm rounded-md transition-colors"
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        {/* Investor Type Filter */}
        <div className="relative group">
          <button className="bg-white border border-black/8 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:border-black/12 transition-colors" style={{ color: 'var(--dr-text-secondary)' }}>
            VC/Angel
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-black/8 rounded-lg shadow-lg p-2 z-10 hidden group-hover:block">
            <button
              onClick={() => setFilterType('')}
              style={{
                backgroundColor: filterType === '' ? 'var(--dr-bg-blue)' : 'transparent',
                color: filterType === '' ? 'var(--dr-primary)' : 'var(--dr-text-primary)',
                fontWeight: filterType === '' ? '500' : 'normal',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { if (filterType !== '') e.currentTarget.style.backgroundColor = 'var(--dr-bg-card)'; }}
              onMouseLeave={(e) => { if (filterType !== '') e.currentTarget.style.backgroundColor = 'transparent'; }}
              className="block w-full text-left px-3 py-2 text-sm rounded-md transition-colors"
            >
              All Types
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  backgroundColor: filterType === type ? 'var(--dr-bg-blue)' : 'transparent',
                  color: filterType === type ? 'var(--dr-primary)' : 'var(--dr-text-primary)',
                  fontWeight: filterType === type ? '500' : 'normal',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { if (filterType !== type) e.currentTarget.style.backgroundColor = 'var(--dr-bg-card)'; }}
                onMouseLeave={(e) => { if (filterType !== type) e.currentTarget.style.backgroundColor = 'transparent'; }}
                className="block w-full text-left px-3 py-2 text-sm rounded-md transition-colors"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Location Filter (Stub) */}
        <div className="relative group">
          <button className="bg-white border border-black/8 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:border-black/12 transition-colors" style={{ color: 'var(--dr-text-secondary)' }}>
            Location
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-black/8 rounded-lg shadow-lg p-2 z-10 hidden group-hover:block">
            <div className="px-3 py-2 text-xs" style={{ color: 'var(--dr-text-secondary)' }}>Coming soon</div>
          </div>
        </div>

        {/* Ticket Size Filter */}
        <div className="relative group">
          <button className="bg-white border border-black/8 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:border-black/12 transition-colors" style={{ color: 'var(--dr-text-secondary)' }}>
            Ticket Size
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-black/8 rounded-lg shadow-lg p-2 z-10 hidden group-hover:block">
            <button
              onClick={() => setFilterTicketSize('')}
              style={{
                backgroundColor: filterTicketSize === '' ? 'var(--dr-bg-blue)' : 'transparent',
                color: filterTicketSize === '' ? 'var(--dr-primary)' : 'var(--dr-text-primary)',
                fontWeight: filterTicketSize === '' ? '500' : 'normal',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { if (filterTicketSize !== '') e.currentTarget.style.backgroundColor = 'var(--dr-bg-card)'; }}
              onMouseLeave={(e) => { if (filterTicketSize !== '') e.currentTarget.style.backgroundColor = 'transparent'; }}
              className="block w-full text-left px-3 py-2 text-sm rounded-md transition-colors"
            >
              All Sizes
            </button>
            {ticketSizes.map((size) => (
              <button
                key={size}
                onClick={() => setFilterTicketSize(size)}
                style={{
                  backgroundColor: filterTicketSize === size ? 'var(--dr-bg-blue)' : 'transparent',
                  color: filterTicketSize === size ? 'var(--dr-primary)' : 'var(--dr-text-primary)',
                  fontWeight: filterTicketSize === size ? '500' : 'normal',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { if (filterTicketSize !== size) e.currentTarget.style.backgroundColor = 'var(--dr-bg-card)'; }}
                onMouseLeave={(e) => { if (filterTicketSize !== size) e.currentTarget.style.backgroundColor = 'transparent'; }}
                className="block w-full text-left px-3 py-2 text-sm rounded-md transition-colors"
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Match Cards Grid (Responsive) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {matches.length === 0 ? (
          <div className="col-span-2 border border-dashed border-black/8 rounded-2xl bg-white p-12 text-sm text-center" style={{ color: 'var(--dr-text-secondary)' }}>
            No matches yet. Click{' '}
            <button onClick={handleRegenerate} className="underline font-medium hover:no-underline" style={{ color: 'var(--dr-primary)' }}>
              Generate matches
            </button>{' '}
            to run the matcher.
          </div>
        ) : visible.length === 0 ? (
          <div className="col-span-2 text-sm text-center py-8" style={{ color: 'var(--dr-text-secondary)' }}>
            No matches in this view.
          </div>
        ) : (
          visible.map((m) => {
            const isHandshake = m.status === 'accepted';
            return (
              <div
                key={m.matchId}
                className="relative border border-white rounded-[20px] p-5 flex flex-col gap-6 overflow-hidden shadow-[−2px_−1px_17px_rgba(0,0,0,0.02),1px_2px_3px_rgba(0,0,0,0.04)]" style={{ backgroundColor: 'var(--dr-bg-card)' }}
              >
                {/* Status Badge */}
                <span
                  className="absolute top-0 right-0 rounded-bl-2xl px-3 py-1 text-[11px] font-medium border border-black/8"
                  style={{
                    backgroundColor: isHandshake ? 'var(--dr-bg-green)' : 'var(--dr-bg-blue)',
                    color: isHandshake ? 'var(--p8-green)' : 'var(--dr-primary)',
                  }}
                >
                  {isHandshake ? 'HANDSHAKE CONFIRM' : 'ACTION REQUIRED'}
                </span>

                {/* Card Header */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--dr-text-primary)' }}>{m.investorName ?? m.investorId}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--dr-text-secondary)' }}>
                      {m.investorType ?? '—'}
                      {m.preferredRound ? ` · ${m.preferredRound}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-[20px] font-semibold" style={{ color: isHandshake ? 'var(--p8-green)' : 'var(--dr-primary)' }}>
                      {m.matchScore}%
                    </span>
                    <span className="text-xs font-medium ml-1" style={{ color: 'var(--dr-text-secondary)' }}>Match</span>
                  </div>
                </div>

                {/* Description */}
                <div className="border-b border-black/8 pb-6 flex flex-col gap-3">
                  <p className="text-sm leading-5" style={{ color: 'var(--dr-text-secondary)' }}>{m.matchRationale || 'Match rationale'}</p>
                  <div className="flex gap-2 flex-wrap">
                    {m.preferredSectors.slice(0, 2).map((s) => (
                      <span key={s} className="bg-white border border-black/8 px-3 py-1 rounded-lg text-xs" style={{ color: 'var(--dr-text-primary)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                {isHandshake ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" style={{ color: 'var(--p8-green)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--p8-green)' }}>
                        Meeting {m.acceptedAt ? new Date(m.acceptedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', 14:00 CET' : 'Scheduled'}
                      </span>
                    </div>
                    <button className="text-white text-xs px-4 py-2 rounded-full font-medium transition-colors" style={{ backgroundColor: 'var(--p8-green)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--p8-green-dark)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--p8-green)'}>
                      Prepare
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4" style={{ color: 'var(--dr-primary)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--dr-primary)' }}>Data Room Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusUpdate(m.matchId, 'viewed')}
                        className="border text-xs px-4 py-2 rounded-full font-medium transition-colors" style={{ borderColor: 'var(--dr-primary)', color: 'var(--dr-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dr-bg-blue)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(m.matchId, 'interested')}
                        className="text-white text-xs px-4 py-2 rounded-full font-medium transition-colors" style={{ backgroundColor: 'var(--dr-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--p8-blue-dark)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--dr-primary)'}
                      >
                        Express Interest
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="border rounded-xl p-4 flex gap-3 items-start text-sm" style={{ backgroundColor: 'rgb(254, 226, 226)', borderColor: 'rgb(252, 165, 165)', color: 'rgb(220, 38, 38)' }} role="alert">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          {error}
        </div>
      )}

      {currentPhase! <= 8 && (
        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-7"
          onNextClick={handleSubmit}
          isLoading={isSubmitting}
          nextLabel="Submit &amp; Complete Phase 8"
          nextValidationError={error}
          isNextDisabled={!canAdvance}
        />
      )}
    </div>
  );
}
