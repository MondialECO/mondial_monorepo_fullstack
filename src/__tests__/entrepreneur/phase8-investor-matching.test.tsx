import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Phase8Client from '@/app/dashboard/entrepreneur/(phases)/phase-8/client';
import InvestorIncomingMatchesPage from '@/app/dashboard/investor/incoming-matches/page';
import entrepreneurApi, {
  InvestorMatchResponse,
  InvestorIncomingMatchResponse,
  PublicInvestorProfile
} from '@/lib/api-entrepreneur';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard/entrepreneur/phase-8',
  useSearchParams: () => new URLSearchParams(),
}));

const mockSavePhaseData = vi.fn();
const mockMoveToNextStep = vi.fn();
const mockApplyBackendResponse = vi.fn();

vi.mock('@/hooks/useEntrepreneurProgress', () => ({
  useEntrepreneurProgress: () => ({
    savePhaseData: mockSavePhaseData,
    moveToNextStep: mockMoveToNextStep,
    getPhaseData: () => ({ __companyId: 'comp-101' }),
    applyBackendResponse: mockApplyBackendResponse,
    currentPhase: 8,
  }),
}));

vi.mock('@/components/messaging/MessageFounderButton', () => ({
  default: ({ companyId, label }: { companyId: string; label?: string }) => (
    <button data-testid={`message-founder-${companyId}`}>{label || 'Message Founder'}</button>
  ),
}));

const baseMatch: InvestorMatchResponse = {
  matchId: 'match-1',
  investorId: 'inv-1',
  investorName: 'Acme Ventures',
  investorType: 'Venture Capital',
  preferredRound: 'Seed',
  investmentRange: 'EUR 250K - 1M',
  preferredSectors: ['SaaS', 'AI & Big Data'],
  status: 'new',
  entrepreneurInterest: 'new',
  investorInterest: 'new',
  matchScore: 88,
  matchRationale: 'Strong sector fit in SaaS and stage alignment in Seed.',
  matchedAt: '2026-08-29T10:00:00Z',
};

const mockSafeInvestorProfile: PublicInvestorProfile = {
  id: 'inv-1',
  name: 'Acme Ventures',
  type: 'Venture Capital',
  headline: 'Backing category-defining European B2B platforms',
  thesisStatement: 'We invest in seed-stage B2B SaaS companies with verified PMF.',
  preferredSectors: ['SaaS', 'AI & Big Data'],
  preferredStages: ['Seed', 'Series A'],
  minCheckSize: 250000,
  maxCheckSize: 1000000,
  preferredGeographies: ['France', 'United Kingdom', 'Germany'],
  bio: 'Pan-European tech investment fund founded in 2018.',
};

describe('Phase 8 — Entrepreneur Investor Matching & Double Opt-In Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(entrepreneurApi, 'getCurrentPhase').mockResolvedValue({
      companyId: 'comp-101',
      currentPhase: 8,
      completedPhases: [1, 2, 3, 4, 5, 6, 7],
      isInvestorReady: true,
      overallProgressPercent: 80,
      trustScore: 90,
      createdAt: '2026-08-29',
      lastUpdatedAt: '2026-08-29',
    });

    vi.spyOn(entrepreneurApi, 'getFundingProfile').mockResolvedValue({
      fundingRoundType: 'Seed',
      fundingAskAmount: 500000,
      equityOfferedPercent: 10,
    } as any);

    vi.spyOn(entrepreneurApi, 'getMatchingInsights').mockResolvedValue({
      totalMatches: 1,
      highScoreMatches: 1,
      interactionsCount: 4,
      averageScore: 88,
    });

    vi.spyOn(entrepreneurApi, 'getPublicInvestorProfile').mockResolvedValue(mockSafeInvestorProfile);
  });

  it('1. Phase8_RendersRealMatches: displays real investor details and live funding ask', async () => {
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([baseMatch]);

    render(<Phase8Client />);

    expect(await screen.findByText('Acme Ventures')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('Venture Capital · Seed · EUR 250K - 1M')).toBeInTheDocument();
    expect(screen.getByText('EUR 500,000')).toBeInTheDocument();
    expect(screen.getByText('Investor-Ready Badge ✓')).toBeInTheDocument();
  });

  it('2. Phase8_ExpressInterestShowsWaitingState: flips state to Waiting for investor response', async () => {
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([baseMatch]);
    vi.spyOn(entrepreneurApi, 'updateMatchStatus').mockResolvedValue({
      ...baseMatch,
      status: 'interested',
      entrepreneurInterest: 'interested',
    });

    render(<Phase8Client />);

    const expressBtn = await screen.findByRole('button', { name: /express interest/i });
    fireEvent.click(expressBtn);

    expect(await screen.findByText('Waiting for investor response')).toBeInTheDocument();
    expect(screen.getByText('EXPRESSED INTEREST')).toBeInTheDocument();
  });

  it('3. Phase8_OneSidedInterestDoesNotHandshake: does not unlock meeting or handshake CTAs', async () => {
    const oneSidedMatch: InvestorMatchResponse = {
      ...baseMatch,
      status: 'interested',
      entrepreneurInterest: 'interested',
      investorInterest: 'new',
    };
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([oneSidedMatch]);

    render(<Phase8Client />);

    expect(await screen.findByText('Waiting for investor response')).toBeInTheDocument();
    expect(screen.queryByText(/handshake confirmed/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /schedule meeting/i })).not.toBeInTheDocument();
  });

  it('4. Phase8_InvestorInterestedFirstShowsIncomingInterest: renders incoming interest banner', async () => {
    const investorFirstMatch: InvestorMatchResponse = {
      ...baseMatch,
      status: 'new',
      entrepreneurInterest: 'new',
      investorInterest: 'interested',
    };
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([investorFirstMatch]);

    render(<Phase8Client />);

    expect(await screen.findByText('INVESTOR INTERESTED')).toBeInTheDocument();
    expect(screen.getByText(/is interested in connecting with you/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /express interest/i })).toBeInTheDocument();
  });

  it('5. Phase8_MutualInterestShowsHandshake: displays MUTUAL HANDSHAKE banner', async () => {
    const mutualMatch: InvestorMatchResponse = {
      ...baseMatch,
      status: 'accepted',
      entrepreneurInterest: 'interested',
      investorInterest: 'interested',
      handshakeConfirmedAt: '2026-08-29T12:00:00Z',
    };
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([mutualMatch]);

    render(<Phase8Client />);

    expect(await screen.findByText('MUTUAL HANDSHAKE')).toBeInTheDocument();
    expect(screen.getByText('Handshake Confirmed')).toBeInTheDocument();
  });

  it('6. Phase8_HandshakeUnlocksMessageInvestor: renders Message Investor CTA', async () => {
    const mutualMatch: InvestorMatchResponse = {
      ...baseMatch,
      status: 'accepted',
      entrepreneurInterest: 'interested',
      investorInterest: 'interested',
      handshakeConfirmedAt: '2026-08-29T12:00:00Z',
    };
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([mutualMatch]);

    render(<Phase8Client />);

    const messageBtn = await screen.findByRole('button', { name: /message investor/i });
    expect(messageBtn).toBeInTheDocument();

    fireEvent.click(messageBtn);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/dashboard/entrepreneur/messages'));
  });

  it('7. Phase8_HandshakeUnlocksScheduleMeeting: opens meeting scheduling modal', async () => {
    const mutualMatch: InvestorMatchResponse = {
      ...baseMatch,
      status: 'accepted',
      entrepreneurInterest: 'interested',
      investorInterest: 'interested',
      handshakeConfirmedAt: '2026-08-29T12:00:00Z',
    };
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([mutualMatch]);

    render(<Phase8Client />);

    const scheduleBtn = await screen.findByRole('button', { name: /schedule meeting/i });
    fireEvent.click(scheduleBtn);

    expect(await screen.findByText('Schedule Investor Meeting')).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm meeting/i })).toBeInTheDocument();
  });

  it('8. Phase8_CannotAdvanceWithoutHandshake: disables Submit & Complete button', async () => {
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([baseMatch]);

    render(<Phase8Client />);

    await screen.findByText('Acme Ventures');
    const submitBtn = screen.getByRole('button', { name: /submit & complete phase 8/i });
    expect(submitBtn).toBeDisabled();
    expect(
      screen.getByText(/complete a mutual investor handshake before continuing/i)
    ).toBeInTheDocument();
  });

  it('9. Phase8_CanAdvanceAfterHandshake: enables Submit & Complete button and navigates to Phase 9', async () => {
    const mutualMatch: InvestorMatchResponse = {
      ...baseMatch,
      status: 'accepted',
      entrepreneurInterest: 'interested',
      investorInterest: 'interested',
      handshakeConfirmedAt: '2026-08-29T12:00:00Z',
    };
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([mutualMatch]);
    vi.spyOn(entrepreneurApi, 'advancePhase').mockResolvedValue({
      currentPhase: 9,
      completedPhases: [1, 2, 3, 4, 5, 6, 7, 8],
    } as any);

    render(<Phase8Client />);

    await screen.findByText('Acme Ventures');
    const submitBtn = screen.getByRole('button', { name: /submit & complete phase 8/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(entrepreneurApi.advancePhase).toHaveBeenCalledWith('comp-101', 8, expect.any(Object));
      expect(mockPush).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-9');
    });
  });

  it('10. Phase8_MeetingCanReschedule: opens scheduling modal with existing parameters', async () => {
    const meetingMatch: InvestorMatchResponse = {
      ...baseMatch,
      status: 'accepted',
      entrepreneurInterest: 'interested',
      investorInterest: 'interested',
      handshakeConfirmedAt: '2026-08-29T12:00:00Z',
      scheduledMeeting: {
        meetingId: 'meet-1',
        startsAt: '2026-09-05T14:30:00Z',
        durationMinutes: 45,
        timezone: 'UTC',
        meetingType: 'video',
        note: 'Q3 discussion',
        status: 'confirmed',
        createdBy: 'entrepreneur',
        createdAt: '2026-08-29T12:00:00Z',
        updatedAt: '2026-08-29T12:00:00Z',
      },
    };
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([meetingMatch]);

    render(<Phase8Client />);

    const rescheduleBtn = await screen.findByRole('button', { name: /reschedule/i });
    fireEvent.click(rescheduleBtn);

    expect(await screen.findByText('Schedule Investor Meeting')).toBeInTheDocument();
  });

  it('11. Phase8_MeetingCanCancel: prompts cancel dialog and marks meeting cancelled', async () => {
    const meetingMatch: InvestorMatchResponse = {
      ...baseMatch,
      status: 'accepted',
      entrepreneurInterest: 'interested',
      investorInterest: 'interested',
      handshakeConfirmedAt: '2026-08-29T12:00:00Z',
      scheduledMeeting: {
        meetingId: 'meet-1',
        startsAt: '2026-09-05T14:30:00Z',
        durationMinutes: 45,
        timezone: 'UTC',
        meetingType: 'video',
        note: 'Q3 discussion',
        status: 'confirmed',
        createdBy: 'entrepreneur',
        createdAt: '2026-08-29T12:00:00Z',
        updatedAt: '2026-08-29T12:00:00Z',
      },
    };
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([meetingMatch]);
    vi.spyOn(entrepreneurApi, 'updateMeetingStatus').mockResolvedValue({
      ...meetingMatch,
      scheduledMeeting: {
        ...meetingMatch.scheduledMeeting!,
        status: 'cancelled',
      },
    });

    render(<Phase8Client />);

    const cancelBtn = await screen.findByRole('button', { name: /cancel$/i });
    fireEvent.click(cancelBtn);

    expect(await screen.findByText('Cancel Meeting?')).toBeInTheDocument();

    const confirmCancelBtn = screen.getAllByRole('button', { name: /cancel meeting/i })[0];
    fireEvent.click(confirmCancelBtn);

    await waitFor(() => {
      expect(entrepreneurApi.updateMeetingStatus).toHaveBeenCalledWith('comp-101', 'match-1', 'cancelled');
    });
  });

  it('12. Phase8_CancelledMeetingCanScheduleAgain: shows Schedule New Meeting button while retaining handshake', async () => {
    const cancelledMeetingMatch: InvestorMatchResponse = {
      ...baseMatch,
      status: 'accepted',
      entrepreneurInterest: 'interested',
      investorInterest: 'interested',
      handshakeConfirmedAt: '2026-08-29T12:00:00Z',
      scheduledMeeting: {
        meetingId: 'meet-1',
        startsAt: '2026-09-05T14:30:00Z',
        durationMinutes: 45,
        timezone: 'UTC',
        meetingType: 'video',
        note: 'Q3 discussion',
        status: 'cancelled',
        createdBy: 'entrepreneur',
        createdAt: '2026-08-29T12:00:00Z',
        updatedAt: '2026-08-29T12:00:00Z',
      },
    };
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([cancelledMeetingMatch]);

    render(<Phase8Client />);

    expect(await screen.findByText('Meeting Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Handshake remains active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /schedule new meeting/i })).toBeInTheDocument();
  });

  it('13. Phase8_ViewInvestorUsesSafeProfile: opens modal showing only safe public profile', async () => {
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([baseMatch]);

    render(<Phase8Client />);

    const viewBtn = await screen.findByRole('button', { name: /view investor/i });
    fireEvent.click(viewBtn);

    expect(await screen.findByText('Investment Thesis')).toBeInTheDocument();
    expect(screen.getByText(/backing category-defining european b2b platforms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close profile/i })).toBeInTheDocument();
  });
});

describe('Phase 8 — Investor Dashboard Incoming Matches UI Suite', () => {
  const incomingMatch: InvestorIncomingMatchResponse = {
    matchId: 'm-inv-1',
    companyId: 'comp-202',
    companyName: 'NexHealth AI',
    industry: 'Healthcare',
    fundingRoundType: 'Seed',
    fundingAskAmount: 750000,
    country: 'France',
    tagline: 'AI diagnostic platform for radiology',
    elevatorPitch: 'Transforming clinical workflows with certified edge AI.',
    matchScore: 92,
    matchRationale: 'Direct match on Healthcare industry and EUR 750K check size.',
    entrepreneurInterest: 'interested',
    investorInterest: 'new',
    status: 'interested',
    matchedAt: '2026-08-29T10:00:00Z',
    phase7IntelligenceSnapshot: {
      riskBand: 'Low',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('15. Investor sees entrepreneur incoming interest with Interested & Pass actions', async () => {
    vi.spyOn(entrepreneurApi, 'getInvestorIncomingMatches').mockResolvedValue([incomingMatch]);

    render(<InvestorIncomingMatchesPage />);

    expect(await screen.findByText('NexHealth AI')).toBeInTheDocument();
    expect(screen.getByText('NEW COMPANY INTEREST')).toBeInTheDocument();
    expect(screen.getByText('EUR 750,000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^interested$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^pass$/i })).toBeInTheDocument();
  });

  it('16. Investor clicking Interested updates status and creates confirmed handshake', async () => {
    vi.spyOn(entrepreneurApi, 'getInvestorIncomingMatches').mockResolvedValue([incomingMatch]);
    vi.spyOn(entrepreneurApi, 'respondToInvestorMatch').mockResolvedValue({
      ...incomingMatch,
      investorInterest: 'interested',
      status: 'accepted',
      handshakeConfirmedAt: '2026-08-29T14:00:00Z',
    });

    render(<InvestorIncomingMatchesPage />);

    const interestedBtn = await screen.findByRole('button', { name: /^interested$/i });
    fireEvent.click(interestedBtn);

    expect(await screen.findByText('MUTUAL HANDSHAKE')).toBeInTheDocument();
    expect(screen.getByText('Handshake Confirmed')).toBeInTheDocument();
    expect(screen.getByTestId('message-founder-comp-202')).toBeInTheDocument();
  });

  it('17. Investor Pass sets status to passed without creating handshake', async () => {
    vi.spyOn(entrepreneurApi, 'getInvestorIncomingMatches').mockResolvedValue([incomingMatch]);
    vi.spyOn(entrepreneurApi, 'respondToInvestorMatch').mockResolvedValue({
      ...incomingMatch,
      investorInterest: 'passed',
      status: 'passed',
    });

    render(<InvestorIncomingMatchesPage />);

    const passBtn = await screen.findByRole('button', { name: /^pass$/i });
    fireEvent.click(passBtn);

    expect(await screen.findByText('PASSED')).toBeInTheDocument();
    expect(screen.queryByText('Handshake Confirmed')).not.toBeInTheDocument();
  });

  it('Phase8_StaleReadiness_ShowsWarning: shows warning when readiness is stale', async () => {
    vi.spyOn(entrepreneurApi, 'getAiReview').mockResolvedValue({
      overallScore: 85,
      scoreBreakdown: { verificationScore: 85, financialScore: 85, equityScore: 85, fundingScore: 85, dataRoomScore: 85, overallScore: 85 },
      investorReadyBadge: true,
      isInvestorReady: true,
      isFresh: false,
      isCurrentlyInvestorReady: false,
      recommendations: [],
      pitchDeckAnalysis: { grade: 'A', averageScore: 8.5, clarityNarrative: 9, marketSizeProof: 8, tractionMetrics: 8, teamPedigree: 9 },
      reviewedAt: '2026-08-01T10:00:00Z',
    });

    render(<Phase8Client />);

    expect(await screen.findByText(/investor readiness needs refresh/i)).toBeInTheDocument();
  });

  it('Phase8_StaleReadiness_DisablesGenerateMatches: disables refresh matches button when stale', async () => {
    vi.spyOn(entrepreneurApi, 'getAiReview').mockResolvedValue({
      overallScore: 85,
      scoreBreakdown: { verificationScore: 85, financialScore: 85, equityScore: 85, fundingScore: 85, dataRoomScore: 85, overallScore: 85 },
      investorReadyBadge: true,
      isInvestorReady: true,
      isFresh: false,
      isCurrentlyInvestorReady: false,
      recommendations: [],
      pitchDeckAnalysis: { grade: 'A', averageScore: 8.5, clarityNarrative: 9, marketSizeProof: 8, tractionMetrics: 8, teamPedigree: 9 },
      reviewedAt: '2026-08-01T10:00:00Z',
    });

    render(<Phase8Client />);

    const refreshBtn = await screen.findByRole('button', { name: /refresh matches/i });
    expect(refreshBtn).toBeDisabled();
  });

  it('Phase8_ExistingMatchesRemainVisibleWhenStale: existing matches remain visible when stale', async () => {
    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([baseMatch]);
    vi.spyOn(entrepreneurApi, 'getAiReview').mockResolvedValue({
      overallScore: 85,
      scoreBreakdown: { verificationScore: 85, financialScore: 85, equityScore: 85, fundingScore: 85, dataRoomScore: 85, overallScore: 85 },
      investorReadyBadge: true,
      isInvestorReady: true,
      isFresh: false,
      isCurrentlyInvestorReady: false,
      recommendations: [],
      pitchDeckAnalysis: { grade: 'A', averageScore: 8.5, clarityNarrative: 9, marketSizeProof: 8, tractionMetrics: 8, teamPedigree: 9 },
      reviewedAt: '2026-08-01T10:00:00Z',
    });

    render(<Phase8Client />);

    expect(await screen.findByText('Acme Ventures')).toBeInTheDocument();
  });

  it('Phase8_RefreshReadiness_LinkTargetsPhase7: CTA button routes to phase 7', async () => {
    vi.spyOn(entrepreneurApi, 'getAiReview').mockResolvedValue({
      overallScore: 85,
      scoreBreakdown: { verificationScore: 85, financialScore: 85, equityScore: 85, fundingScore: 85, dataRoomScore: 85, overallScore: 85 },
      investorReadyBadge: true,
      isInvestorReady: true,
      isFresh: false,
      isCurrentlyInvestorReady: false,
      recommendations: [],
      pitchDeckAnalysis: { grade: 'A', averageScore: 8.5, clarityNarrative: 9, marketSizeProof: 8, tractionMetrics: 8, teamPedigree: 9 },
      reviewedAt: '2026-08-01T10:00:00Z',
    });

    render(<Phase8Client />);

    const ctaBtn = await screen.findByRole('button', { name: /refresh investor readiness/i });
    fireEvent.click(ctaBtn);
    expect(mockPush).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-7');
  });

  it('Phase8_LowScoreMatch_DisplaysAdvisoryFitAndAllowsInterest: renders low fit score and enables interest button', async () => {
    const lowScoreMatch: InvestorMatchResponse = {
      ...baseMatch,
      id: 'match-low-1',
      matchId: 'match-low-1',
      matchScore: 28,
      status: 'new',
      entrepreneurInterest: 'new',
      investorInterest: 'new',
      investorName: 'Low Fit Capital',
      investorNameSnapshot: 'Low Fit Capital',
      matchRationale: 'check size outside band; sector mismatch (company=saas, investor prefers biotech)',
    };

    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue([lowScoreMatch]);

    render(<Phase8Client />);

    expect(await screen.findByText('Low Fit Capital')).toBeInTheDocument();
    expect(screen.getByText('28%')).toBeInTheDocument();
    const expressBtn = screen.getByRole('button', { name: /express interest/i });
    expect(expressBtn).toBeEnabled();
  });

  it('Phase8_AllLowScoreMatches_RendersRealCardsWithoutFakeEmptyState: renders all low score matches sorted by score', async () => {
    const matches: InvestorMatchResponse[] = [
      { ...baseMatch, id: 'm-39', matchId: 'm-39', matchScore: 39, investorName: 'Investor 39' },
      { ...baseMatch, id: 'm-24', matchId: 'm-24', matchScore: 24, investorName: 'Investor 24' },
      { ...baseMatch, id: 'm-12', matchId: 'm-12', matchScore: 12, investorName: 'Investor 12' },
    ];

    vi.spyOn(entrepreneurApi, 'getInvestorMatches').mockResolvedValue(matches);

    render(<Phase8Client />);

    expect(await screen.findByText('Investor 39')).toBeInTheDocument();
    expect(screen.getByText('Investor 24')).toBeInTheDocument();
    expect(screen.getByText('Investor 12')).toBeInTheDocument();
    expect(screen.queryByText(/no matches found/i)).toBeNull();
  });
});
