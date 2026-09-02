'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  Lock,
  RefreshCcw,
  Clock,
  Video,
  X,
  CheckCircle2,
  MessageSquare,
  Building2,
  ExternalLink,
  Globe,
  Award,
  DollarSign,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import entrepreneurApi, {
  InvestorMatchResponse,
  MatchingInsightsResponse,
  PublicInvestorProfile,
  type FundingProfileResponse,
  type AiReviewResponse,
} from '@/lib/api-entrepreneur';
import { Phase8Data } from '@/types/entrepreneur';

export default function Phase8Client() {
  const router = useRouter();
  const { activeCompanyId, savePhaseData, moveToNextStep, getPhaseData, applyBackendResponse, currentPhase } =
    useEntrepreneurProgress();

  const [matches, setMatches] = useState<InvestorMatchResponse[]>([]);
  const [insights, setInsights] = useState<MatchingInsightsResponse | null>(null);
  const [funding, setFunding] = useState<FundingProfileResponse | null>(null);
  const [review, setReview] = useState<AiReviewResponse | null>(null);
  const [investorReady, setInvestorReady] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filterStage, setFilterStage] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterTicketSize, setFilterTicketSize] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Meeting Scheduling State
  const [schedulingMatch, setSchedulingMatch] = useState<InvestorMatchResponse | null>(null);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('14:00');
  const [meetingDuration, setMeetingDuration] = useState(30);
  const [meetingType, setMeetingType] = useState('video');
  const [meetingNote, setMeetingNote] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Meeting Cancellation State
  const [cancellingMatch, setCancellingMatch] = useState<InvestorMatchResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // View Investor Profile Modal State
  const [viewingProfile, setViewingProfile] = useState<PublicInvestorProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  async function resolveCompanyId(): Promise<string> {
    if (activeCompanyId) return activeCompanyId;
    const fromServer = await entrepreneurApi.getCurrentPhase(activeCompanyId || undefined);
    if (fromServer?.companyId) return fromServer.companyId;
    const existing: Phase8Data = getPhaseData<Phase8Data>(8) ?? {};
    if (existing.__companyId) return existing.__companyId;
    throw new Error('No company found in backend');
  }

  const reload = async () => {
    try {
      const prog = await entrepreneurApi.getCurrentPhase(activeCompanyId || undefined);
      const companyId = activeCompanyId || prog.companyId || (getPhaseData<Phase8Data>(8) ?? {}).__companyId;
      setInvestorReady(prog.isInvestorReady);
      if (!companyId) return;
      const [m, i, f, rev] = await Promise.all([
        entrepreneurApi.getInvestorMatches(companyId),
        entrepreneurApi.getMatchingInsights(companyId).catch(() => null),
        entrepreneurApi.getFundingProfile(companyId).catch(() => null),
        entrepreneurApi.getAiReview(companyId).catch(() => null),
      ]);
      setMatches(m);
      setInsights(i);
      setFunding(f);
      setReview(rev);
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

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingMatch || !meetingDate) return;
    setError('');
    setIsScheduling(true);
    try {
      const companyId = await resolveCompanyId();
      const startsAt = new Date(`${meetingDate}T${meetingTime}:00Z`).toISOString();
      const updated = await entrepreneurApi.scheduleMeeting(companyId, schedulingMatch.matchId, {
        startsAt,
        durationMinutes: Number(meetingDuration),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        meetingType,
        note: meetingNote,
      });
      setMatches((prev) => prev.map((m) => (m.matchId === schedulingMatch.matchId ? updated : m)));
      setSchedulingMatch(null);
      setMeetingNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule meeting');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelMeetingConfirm = async () => {
    if (!cancellingMatch) return;
    setError('');
    setIsCancelling(true);
    try {
      const companyId = await resolveCompanyId();
      const updated = await entrepreneurApi.updateMeetingStatus(
        companyId,
        cancellingMatch.matchId,
        'cancelled'
      );
      setMatches((prev) => prev.map((m) => (m.matchId === cancellingMatch.matchId ? updated : m)));
      setCancellingMatch(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel meeting');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenInvestorProfile = async (investorId: string) => {
    setIsLoadingProfile(true);
    try {
      const profile = await entrepreneurApi.getPublicInvestorProfile(investorId);
      setViewingProfile(profile);
    } catch {
      // Fallback preview from match snapshot
      const match = matches.find((m) => m.investorId === investorId);
      if (match) {
        setViewingProfile({
          id: match.investorId,
          name: match.investorName ?? match.investorId,
          type: match.investorType ?? 'Investor',
          preferredSectors: match.preferredSectors ?? [],
          preferredStages: match.preferredRound ? [match.preferredRound] : [],
          minCheckSize: 0,
          maxCheckSize: 0,
          preferredGeographies: ['European Union'],
          thesisStatement: match.matchRationale,
        });
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleMessageInvestor = (investorId: string, investorName?: string) => {
    router.push(`/dashboard/entrepreneur/messages?investorId=${investorId}&name=${encodeURIComponent(investorName || '')}`);
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();
      const advanceResponse = await entrepreneurApi.advancePhase(companyId, 8, {
        matchesReviewed: matches.length,
        hasCompletedHandshake: acceptedCount > 0,
      });
      if (advanceResponse?.currentPhase !== 9)
        throw new Error(
          `Phase advancement failed - expected currentPhase=9, got ${advanceResponse?.currentPhase}`
        );
      if (!advanceResponse?.completedPhases?.includes(8))
        throw new Error('Phase 8 not marked as completed in backend response');
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

  // Canonical Phase 8 completion gate: requires at least one confirmed mutual handshake
  const canAdvance = matches.some(
    (m) =>
      (m.status || '').toLowerCase() === 'accepted' &&
      (m.entrepreneurInterest === 'interested' || m.status === 'accepted') &&
      (m.investorInterest === 'interested' || m.status === 'accepted') &&
      !!m.handshakeConfirmedAt
  );

  const interestedCount = matches.filter(
    (m) => (m.entrepreneurInterest || '').toLowerCase() === 'interested' && (m.status || '').toLowerCase() !== 'accepted'
  ).length;
  const acceptedCount = matches.filter((m) => (m.status || '').toLowerCase() === 'accepted').length;

  // Extract unique filter values
  const stages = Array.from(new Set(matches.map((m) => m.preferredRound).filter(Boolean))) as string[];
  const types = Array.from(new Set(matches.map((m) => m.investorType).filter(Boolean))) as string[];
  const locations = ['France', 'United Kingdom', 'Germany', 'United States', 'European Union', 'Global'];
  const ticketSizes = Array.from(new Set(matches.map((m) => m.investmentRange).filter(Boolean))) as string[];

  // Apply all filters
  const visible = matches.filter((m) => {
    if (activeTab === 'interested') {
      if ((m.entrepreneurInterest || '').toLowerCase() !== 'interested') return false;
    } else if (activeTab === 'accepted') {
      if ((m.status || '').toLowerCase() !== 'accepted') return false;
    }

    if (filterStage && m.preferredRound !== filterStage) return false;
    if (filterType && m.investorType !== filterType) return false;
    if (filterLocation && !m.matchRationale?.toLowerCase().includes(filterLocation.toLowerCase())) return false;
    if (filterTicketSize && m.investmentRange !== filterTicketSize) return false;

    return true;
  });

  const isStale = Boolean(review && (!review.isFresh || (review.isCurrentlyInvestorReady === false && (investorReady ?? false))));

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-6" style={{ backgroundColor: 'var(--dr-bg-page)' }}>
      {/* Page Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-semibold leading-[40px]" style={{ color: 'var(--dr-text-primary)' }}>
            Investor Matching — Phase 8
          </h1>
          <p className="text-sm" style={{ color: 'var(--dr-text-secondary)' }}>
            AI has matched your company with {insights?.totalMatches ?? matches.length} compatible investors based on verified Phase 7 readiness.
            Express interest to initiate bilateral investor handshakes.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating || isStale}
            variant="outline"
            className="gap-2 text-xs font-semibold"
            title={isStale ? 'Re-run Phase 7 review before regenerating matches' : undefined}
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Refreshing Matches…' : 'Refresh Matches'}
          </Button>
          <span className="flex items-center gap-1.5 border border-black/8 px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: 'var(--dr-bg-green)', color: 'var(--p8-green)' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--p8-green)' }} />
            AI MATCHING LIVE
          </span>
        </div>
      </div>

      {/* Stale Readiness Warning Banner */}
      {isStale && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Investor Readiness needs refresh</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Your company information or review status has changed. Run a new AI Review before generating new matches.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => router.push('/dashboard/entrepreneur/phase-7')}
            size="sm"
            variant="outline"
            className="border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 flex-shrink-0"
          >
            Refresh Investor Readiness
          </Button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border border-white rounded-xl px-4 py-3 flex flex-col gap-2 drop-shadow-sm" style={{ backgroundColor: 'var(--dr-bg-card)' }}>
          <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--dr-text-muted)' }}>AI Matches</span>
          <span className="text-[24px] font-semibold leading-[32px]" style={{ color: 'var(--dr-text-primary)' }}>
            {insights?.totalMatches ?? matches.length}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--dr-text-muted)' }}>Compatible investors</span>
        </div>

        <div className="border border-white rounded-xl px-4 py-3 flex flex-col gap-2 drop-shadow-sm" style={{ backgroundColor: 'var(--dr-bg-card)' }}>
          <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--dr-text-muted)' }}>Expressions</span>
          <span className="text-[24px] font-semibold leading-[32px]" style={{ color: 'var(--dr-yellow)' }}>
            {interestedCount}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--dr-text-muted)' }}>Pending response</span>
        </div>

        <div className="border border-white rounded-xl px-4 py-3 flex flex-col gap-2 drop-shadow-sm" style={{ backgroundColor: 'var(--dr-bg-card)' }}>
          <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--dr-text-muted)' }}>Handshakes</span>
          <span className="text-[24px] font-semibold leading-[32px]" style={{ color: 'var(--p8-green)' }}>
            {acceptedCount}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--dr-text-muted)' }}>Bilateral agreement</span>
        </div>

        <div className="border border-white rounded-xl px-4 py-3 flex flex-col gap-2 drop-shadow-sm" style={{ backgroundColor: 'var(--dr-bg-card)' }}>
          <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--dr-text-muted)' }}>Profile Views</span>
          <span className="text-[24px] font-semibold leading-[32px]" style={{ color: 'var(--dr-primary)' }}>
            {insights?.interactionsCount ?? 0}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--dr-text-muted)' }}>Recorded touches</span>
        </div>
      </div>

      {/* Funding Ask Info Bar */}
      <div className="border border-white rounded-lg px-4 py-3.5 flex justify-between items-center" style={{ backgroundColor: 'var(--dr-bg-card)' }}>
        <div className="flex items-center gap-3 h-full flex-wrap">
          <span className="text-xs font-semibold" style={{ color: 'var(--p8-green)' }}>Your funding ask is live</span>
          <div className="w-px h-full bg-black/8" />
          <span className="text-xs font-medium" style={{ color: 'var(--dr-text-primary)' }}>{funding?.fundingRoundType ?? 'Seed'}</span>
          <div className="w-px h-full bg-black/8" />
          <span className="text-xs font-medium" style={{ color: 'var(--dr-text-primary)' }}>EUR {funding?.fundingAskAmount?.toLocaleString() ?? '—'}</span>
          <div className="w-px h-full bg-black/8" />
          <span className="text-xs font-medium" style={{ color: 'var(--dr-text-primary)' }}>
            {funding?.equityOfferedPercent ?? '—'}% <span className="text-[11px]" style={{ color: 'var(--dr-text-secondary)' }}>equity</span>
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
          className="bg-white border border-black/8 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-muted"
          style={{ color: 'var(--dr-text-secondary)' }}
        >
          Edit Ask
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b-2 border-black/8 flex gap-6 overflow-x-auto" role="tablist">
        {[
          { key: 'all', label: `All Matches (${matches.length})` },
          { key: 'interested', label: `Expressed Interest (${interestedCount})` },
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
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex gap-3 flex-wrap items-center">
        {/* Stage Filter */}
        <div className="relative group">
          <button className="bg-white border border-black/8 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 hover:border-black/12 transition-colors" style={{ color: 'var(--dr-text-secondary)' }}>
            Stage {filterStage ? `: ${filterStage}` : ''}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-black/8 rounded-lg shadow-lg p-2 z-10 hidden group-hover:block">
            <button onClick={() => setFilterStage('')} className="block w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted">All Stages</button>
            {stages.map((st) => (
              <button key={st} onClick={() => setFilterStage(st)} className="block w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted">{st}</button>
            ))}
          </div>
        </div>

        {/* Investor Type Filter */}
        <div className="relative group">
          <button className="bg-white border border-black/8 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 hover:border-black/12 transition-colors" style={{ color: 'var(--dr-text-secondary)' }}>
            Type {filterType ? `: ${filterType}` : ''}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-black/8 rounded-lg shadow-lg p-2 z-10 hidden group-hover:block">
            <button onClick={() => setFilterType('')} className="block w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted">All Types</button>
            {types.map((tp) => (
              <button key={tp} onClick={() => setFilterType(tp)} className="block w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted">{tp}</button>
            ))}
          </div>
        </div>

        {/* Location Filter */}
        <div className="relative group">
          <button className="bg-white border border-black/8 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 hover:border-black/12 transition-colors" style={{ color: 'var(--dr-text-secondary)' }}>
            Location {filterLocation ? `: ${filterLocation}` : ''}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-black/8 rounded-lg shadow-lg p-2 z-10 hidden group-hover:block">
            <button onClick={() => setFilterLocation('')} className="block w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted">All Locations</button>
            {locations.map((loc) => (
              <button key={loc} onClick={() => setFilterLocation(loc)} className="block w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted">{loc}</button>
            ))}
          </div>
        </div>

        {/* Ticket Size Filter */}
        <div className="relative group">
          <button className="bg-white border border-black/8 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 hover:border-black/12 transition-colors" style={{ color: 'var(--dr-text-secondary)' }}>
            Ticket Size {filterTicketSize ? `: ${filterTicketSize}` : ''}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-black/8 rounded-lg shadow-lg p-2 z-10 hidden group-hover:block">
            <button onClick={() => setFilterTicketSize('')} className="block w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted">All Sizes</button>
            {ticketSizes.map((sz) => (
              <button key={sz} onClick={() => setFilterTicketSize(sz)} className="block w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted">{sz}</button>
            ))}
          </div>
        </div>

        {(filterStage || filterType || filterLocation || filterTicketSize) && (
          <button
            onClick={() => { setFilterStage(''); setFilterType(''); setFilterLocation(''); setFilterTicketSize(''); }}
            className="text-xs text-muted-foreground hover:underline ml-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Match Cards Grid */}
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
            No matches matching the selected filters.
          </div>
        ) : (
          visible.map((m) => {
            const isHandshake = (m.status || '').toLowerCase() === 'accepted';
            const isMeetingActive = m.scheduledMeeting && m.scheduledMeeting.status !== 'cancelled';
            const isMeetingCancelled = m.scheduledMeeting && m.scheduledMeeting.status === 'cancelled';
            const isEntrepreneurInterestedOnly = !isHandshake && (m.entrepreneurInterest || '').toLowerCase() === 'interested';
            const isInvestorInterestedFirst = !isHandshake && (m.investorInterest || '').toLowerCase() === 'interested' && (m.entrepreneurInterest || '').toLowerCase() !== 'interested';

            return (
              <div
                key={m.matchId}
                data-testid={`match-card-${m.matchId}`}
                className="relative border border-white rounded-[20px] p-5 flex flex-col gap-5 overflow-hidden shadow-sm"
                style={{ backgroundColor: 'var(--dr-bg-card)' }}
              >
                {/* Status Badge */}
                <span
                  className="absolute top-0 right-0 rounded-bl-2xl px-3 py-1 text-[11px] font-medium border border-black/8"
                  style={{
                    backgroundColor: isHandshake
                      ? 'var(--dr-bg-green)'
                      : isInvestorInterestedFirst
                      ? 'rgba(124, 58, 237, 0.1)'
                      : isEntrepreneurInterestedOnly
                      ? 'var(--dr-bg-yellow)'
                      : 'var(--dr-bg-blue)',
                    color: isHandshake
                      ? 'var(--p8-green)'
                      : isInvestorInterestedFirst
                      ? '#7c3aed'
                      : isEntrepreneurInterestedOnly
                      ? 'var(--dr-yellow)'
                      : 'var(--dr-primary)',
                  }}
                >
                  {isHandshake
                    ? 'MUTUAL HANDSHAKE'
                    : isInvestorInterestedFirst
                    ? 'INVESTOR INTERESTED'
                    : isEntrepreneurInterestedOnly
                    ? 'EXPRESSED INTEREST'
                    : 'ACTION REQUIRED'}
                </span>

                {/* Card Header */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--dr-text-primary)' }}>
                      {m.investorName ?? m.investorId}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--dr-text-secondary)' }}>
                      {m.investorType ?? '—'}
                      {m.preferredRound ? ` · ${m.preferredRound}` : ''}
                      {m.investmentRange ? ` · ${m.investmentRange}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-[20px] font-semibold" style={{ color: isHandshake ? 'var(--p8-green)' : 'var(--dr-primary)' }}>
                      {m.matchScore}%
                    </span>
                    <span className="text-xs font-medium ml-1" style={{ color: 'var(--dr-text-secondary)' }}>Fit</span>
                  </div>
                </div>

                {/* Description & Sectors */}
                <div className="border-b border-black/8 pb-4 flex flex-col gap-3">
                  <p className="text-xs leading-5 text-muted-foreground">
                    {m.matchRationale || 'Qualified investor match based on industry and stage parameters.'}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {m.preferredSectors.slice(0, 3).map((s) => (
                      <span key={s} className="bg-white border border-black/8 px-2.5 py-1 rounded-lg text-xs" style={{ color: 'var(--dr-text-primary)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Incoming Interest Banner (State 3) */}
                {isInvestorInterestedFirst && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      <p className="text-xs font-medium text-purple-800 dark:text-purple-300">
                        {m.investorName ?? 'Investor'} is interested in connecting with you.
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer Actions / Meeting Card */}
                {isHandshake ? (
                  <div className="space-y-3">
                    {isMeetingActive ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <div className="text-xs">
                            <p className="font-bold text-emerald-800 dark:text-emerald-300">
                              Meeting Confirmed: {new Date(m.scheduledMeeting!.startsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} ({m.scheduledMeeting!.durationMinutes} min)
                            </p>
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                              Format: {m.scheduledMeeting!.meetingType}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMessageInvestor(m.investorId, m.investorName)}
                            className="text-xs font-semibold text-primary underline hover:no-underline flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Message
                          </button>
                          <button
                            onClick={() => {
                              setMeetingDate(m.scheduledMeeting!.startsAt.slice(0, 10));
                              setMeetingTime(m.scheduledMeeting!.startsAt.slice(11, 16) || '14:00');
                              setMeetingDuration(m.scheduledMeeting!.durationMinutes || 30);
                              setMeetingType(m.scheduledMeeting!.meetingType || 'video');
                              setMeetingNote(m.scheduledMeeting!.note || '');
                              setSchedulingMatch(m);
                            }}
                            className="text-xs font-semibold text-emerald-700 underline hover:no-underline"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => setCancellingMatch(m)}
                            className="text-xs font-semibold text-destructive underline hover:no-underline ml-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : isMeetingCancelled ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="text-xs">
                          <p className="font-bold text-amber-800 dark:text-amber-300">Meeting Cancelled</p>
                          <p className="text-[11px] text-amber-700/80">Handshake remains active</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMessageInvestor(m.investorId, m.investorName)}
                            className="border text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5"
                            style={{ borderColor: 'var(--dr-primary)', color: 'var(--dr-primary)' }}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Message Investor
                          </button>
                          <button
                            onClick={() => {
                              setMeetingDate('');
                              setMeetingTime('14:00');
                              setMeetingDuration(30);
                              setMeetingType('video');
                              setMeetingNote('');
                              setSchedulingMatch(m);
                            }}
                            className="text-white text-xs px-3 py-1.5 rounded-full font-medium transition-colors shadow-sm flex items-center gap-1.5"
                            style={{ backgroundColor: 'var(--p8-green)' }}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Schedule New Meeting
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--p8-green)' }} />
                          <span className="text-xs font-medium" style={{ color: 'var(--p8-green)' }}>
                            Handshake Confirmed
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMessageInvestor(m.investorId, m.investorName)}
                            className="border text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5"
                            style={{ borderColor: 'var(--dr-primary)', color: 'var(--dr-primary)' }}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Message Investor
                          </button>
                          <button
                            onClick={() => {
                              setMeetingDate('');
                              setMeetingTime('14:00');
                              setMeetingDuration(30);
                              setMeetingType('video');
                              setMeetingNote('');
                              setSchedulingMatch(m);
                            }}
                            className="text-white text-xs px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                            style={{ backgroundColor: 'var(--p8-green)' }}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Schedule Meeting
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isEntrepreneurInterestedOnly ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Waiting for investor response</span>
                    </div>
                    <button
                      onClick={() => handleOpenInvestorProfile(m.investorId)}
                      className="border text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors"
                      style={{ borderColor: 'var(--dr-primary)', color: 'var(--dr-primary)' }}
                    >
                      View Investor
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Standard Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenInvestorProfile(m.investorId)}
                        className="border text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors"
                        style={{ borderColor: 'var(--dr-primary)', color: 'var(--dr-primary)' }}
                      >
                        View Investor
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(m.matchId, 'interested')}
                        className="text-white text-xs px-4 py-1.5 rounded-full font-medium transition-colors shadow-sm"
                        style={{ backgroundColor: 'var(--dr-primary)' }}
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

      {/* Scheduling Modal */}
      {schedulingMatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Schedule Investor Meeting</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{schedulingMatch.investorName ?? schedulingMatch.investorId}</p>
              </div>
              <button onClick={() => setSchedulingMatch(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="meeting-date" className="text-xs font-semibold text-foreground">Date</label>
                  <input
                    id="meeting-date"
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="meeting-time" className="text-xs font-semibold text-foreground">Time</label>
                  <input
                    id="meeting-time"
                    type="time"
                    required
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="meeting-duration" className="text-xs font-semibold text-foreground">Duration</label>
                  <select
                    id="meeting-duration"
                    value={meetingDuration}
                    onChange={(e) => setMeetingDuration(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="meeting-type" className="text-xs font-semibold text-foreground">Meeting Format</label>
                  <select
                    id="meeting-type"
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background"
                  >
                    <option value="video">Video Call (Google Meet)</option>
                    <option value="call">Phone Call</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="meeting-note" className="text-xs font-semibold text-foreground">Agenda / Notes</label>
                <textarea
                  id="meeting-note"
                  rows={3}
                  value={meetingNote}
                  onChange={(e) => setMeetingNote(e.target.value)}
                  placeholder="Share discussion topics (e.g. Q3 traction, funding round tranches)..."
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSchedulingMatch(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isScheduling}>
                  {isScheduling ? 'Scheduling...' : 'Confirm Meeting'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Meeting Confirmation Dialog */}
      {cancellingMatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Cancel Meeting?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                This meeting with {cancellingMatch.investorName ?? 'the investor'} will be marked as cancelled for both participants. Your mutual handshake will remain active.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCancellingMatch(null)}>
                Keep Meeting
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isCancelling}
                onClick={handleCancelMeetingConfirm}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Meeting'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Public Investor Profile Modal */}
      {viewingProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {viewingProfile.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{viewingProfile.name}</h3>
                  <p className="text-xs text-muted-foreground">{viewingProfile.type} · {viewingProfile.preferredGeographies?.join(', ') || 'Global'}</p>
                </div>
              </div>
              <button onClick={() => setViewingProfile(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {viewingProfile.headline && (
              <p className="text-xs italic text-muted-foreground font-medium">{viewingProfile.headline}</p>
            )}

            {viewingProfile.thesisStatement && (
              <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Investment Thesis</span>
                <p className="text-xs text-foreground leading-relaxed">{viewingProfile.thesisStatement}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="border border-border rounded-xl p-3 space-y-1">
                <span className="text-[11px] text-muted-foreground">Preferred Stages</span>
                <p className="font-semibold text-foreground">{viewingProfile.preferredStages?.join(', ') || 'All stages'}</p>
              </div>
              <div className="border border-border rounded-xl p-3 space-y-1">
                <span className="text-[11px] text-muted-foreground">Target Check Size</span>
                <p className="font-semibold text-foreground">
                  {viewingProfile.maxCheckSize > 0
                    ? `EUR ${viewingProfile.minCheckSize.toLocaleString()} - ${viewingProfile.maxCheckSize.toLocaleString()}`
                    : 'Flexible'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Focus Sectors</span>
              <div className="flex flex-wrap gap-1.5">
                {viewingProfile.preferredSectors?.map((s) => (
                  <span key={s} className="bg-muted text-foreground text-xs px-2.5 py-1 rounded-lg">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {viewingProfile.bio && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">About</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{viewingProfile.bio}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="button" size="sm" onClick={() => setViewingProfile(null)}>
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="border rounded-xl p-4 flex gap-3 items-start text-sm bg-destructive/10 border-destructive/30 text-destructive" role="alert">
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
          nextValidationError={error || (canAdvance ? undefined : 'Complete a mutual investor handshake before continuing to Investor Deals.')}
          isNextDisabled={!canAdvance}
        />
      )}
    </div>
  );
}
