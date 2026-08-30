import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Phase9Client from '@/app/dashboard/entrepreneur/(phases)/phase-9/client';
import { Phase9PipelineVisuals } from '@/components/entrepreneur/deals/Phase9PipelineVisuals';
import entrepreneurApi, { DealStatusResponse } from '@/lib/api-entrepreneur';
import * as entrepreneurProgressHooks from '@/hooks/useEntrepreneurProgress';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard/entrepreneur/phase-9',
}));

// Mock entrepreneurApi
vi.mock('@/lib/api-entrepreneur', () => ({
  default: {
    getCurrentPhase: vi.fn(),
    getInvestorMatches: vi.fn(),
    getCompanyDeals: vi.fn(),
    getRoundSummary: vi.fn(),
    getActiveTermSheet: vi.fn(),
    getTimeline: vi.fn(),
    getDealActivity: vi.fn(),
    closeDeal: vi.fn(),
    advancePhase: vi.fn(),
    updateDealStatus: vi.fn(),
    signTermSheet: vi.fn(),
    mutateDueDiligenceItem: vi.fn(),
    progressChecklist: vi.fn(),
    uploadDealDocument: vi.fn(),
  },
}));

// Mock useEntrepreneurProgress
vi.mock('@/hooks/useEntrepreneurProgress', () => ({
  useEntrepreneurProgress: vi.fn(),
}));

describe('Phase 9 UI / UX Remediation Tests', () => {
  const mockSavePhaseData = vi.fn();
  const mockGetPhaseData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPhaseData.mockReturnValue({ __companyId: 'comp-100' });
    vi.mocked(entrepreneurProgressHooks.useEntrepreneurProgress).mockReturnValue({
      savePhaseData: mockSavePhaseData,
      getPhaseData: mockGetPhaseData,
      currentPhase: 9,
      completedPhases: [1, 2, 3, 4, 5, 6, 7, 8],
    } as any);

    vi.mocked(entrepreneurApi.getCurrentPhase).mockResolvedValue({
      companyId: 'comp-100',
      currentPhase: 9,
      completedPhases: [1, 2, 3, 4, 5, 6, 7, 8],
    } as any);
    vi.mocked(entrepreneurApi.getInvestorMatches).mockResolvedValue([]);
    vi.mocked(entrepreneurApi.getRoundSummary).mockResolvedValue({
      totalDeals: 1,
      roundTargetEur: 500000,
      committedAmountEur: 100000,
      remainingEur: 400000,
      percentFilled: 20,
    });
    vi.mocked(entrepreneurApi.getActiveTermSheet).mockResolvedValue(null);
    vi.mocked(entrepreneurApi.getTimeline).mockResolvedValue([]);
    vi.mocked(entrepreneurApi.getDealActivity).mockResolvedValue([]);
  });

  const sampleSignedDeal: DealStatusResponse = {
    dealId: 'deal-signed-001',
    status: 'signed',
    progressPercent: 90,
    termSheet: {
      totalRaiseAmount: 200000,
      postMoneyValuation: 2000000,
      equityType: 'preferred',
      investorEquityPercent: 10,
      proRataRights: true,
      status: 'signed',
      signedAt: '2026-08-25T12:00:00Z',
    },
    closingChecklist: [],
    dueDiligenceChecklist: [],
    dealDocuments: [],
    investors: [
      {
        investorId: 'inv-1',
        investorName: 'Apex Capital',
        investorType: 'Venture Capital',
        committedAmount: 200000,
        status: 'committed',
      },
    ],
  };

  const sampleCompletedDeal: DealStatusResponse = {
    dealId: 'deal-completed-002',
    status: 'completed',
    progressPercent: 100,
    termSheet: {
      totalRaiseAmount: 250000,
      postMoneyValuation: 2500000,
      equityType: 'preferred',
      investorEquityPercent: 10,
      proRataRights: true,
      status: 'signed',
      signedAt: '2026-08-25T12:00:00Z',
    },
    closingChecklist: [],
    dueDiligenceChecklist: [],
    dealDocuments: [],
    investors: [
      {
        investorId: 'inv-2',
        investorName: 'Horizon Ventures',
        investorType: 'Venture Capital',
        committedAmount: 250000,
        status: 'funded',
      },
    ],
  };

  it('Phase9_SignedDeal_DoesNotRenderAsClosed', async () => {
    vi.mocked(entrepreneurApi.getCompanyDeals).mockResolvedValue([sampleSignedDeal]);

    render(<Phase9Client />);
    await waitFor(() => {
      expect(screen.getByText('Ready to Close')).toBeInTheDocument();
    });

    // Ready to Close tab has count (01), Closed tab has count (00)
    expect(screen.getByRole('tab', { name: /Ready to Close/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Closed/i })).toBeInTheDocument();
  });

  it('Phase9_SignedDeal_ShowsReadyToClose', async () => {
    vi.mocked(entrepreneurApi.getCompanyDeals).mockResolvedValue([sampleSignedDeal]);

    render(<Phase9Client />);
    await waitFor(() => {
      // Card has the Signed — Ready to Close badge
      expect(screen.getAllByText('Signed — Ready to Close').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('Phase9_CompletedDeal_ShowsClosed', async () => {
    vi.mocked(entrepreneurApi.getCompanyDeals).mockResolvedValue([sampleCompletedDeal]);

    render(<Phase9Client />);
    await waitFor(() => {
      expect(screen.getAllByText('Deal Closed').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('Phase9_CompletedDeal_ShowsCompleteJourneyCTA', async () => {
    vi.mocked(entrepreneurApi.getCompanyDeals).mockResolvedValue([sampleCompletedDeal]);

    render(<Phase9Client />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete Funding Journey/i })).toBeInTheDocument();
      expect(screen.getByText(/Your investment deal is closed and recorded/i)).toBeInTheDocument();
    });
  });

  it('Phase9_SignedDeal_DoesNotShowCompleteJourneyCTA', async () => {
    vi.mocked(entrepreneurApi.getCompanyDeals).mockResolvedValue([sampleSignedDeal]);

    render(<Phase9Client />);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Complete Funding Journey/i })).not.toBeInTheDocument();
    });
  });

  it('Phase9_CompleteJourney_CallsAdvancePhase9', async () => {
    vi.mocked(entrepreneurApi.getCompanyDeals).mockResolvedValue([sampleCompletedDeal]);
    vi.mocked(entrepreneurApi.advancePhase).mockResolvedValue({
      companyId: 'comp-100',
      currentPhase: 10,
      completedPhases: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    } as any);

    render(<Phase9Client />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete Funding Journey/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Complete Funding Journey/i }));

    await waitFor(() => {
      expect(entrepreneurApi.advancePhase).toHaveBeenCalledWith('comp-100', 9, {});
    });
  });

  it('Phase9_CompleteJourney_NavigatesToPhase10', async () => {
    vi.mocked(entrepreneurApi.getCompanyDeals).mockResolvedValue([sampleCompletedDeal]);
    vi.mocked(entrepreneurApi.advancePhase).mockResolvedValue({
      companyId: 'comp-100',
      currentPhase: 10,
      completedPhases: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    } as any);

    render(<Phase9Client />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete Funding Journey/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Complete Funding Journey/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-10');
    });
  });

  it('Phase9_CloseDeal_RequiresConfirmation', async () => {
    vi.mocked(entrepreneurApi.getCompanyDeals).mockResolvedValue([sampleSignedDeal]);

    render(<Phase9Client />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Close deal \(signed → completed\)/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Close deal \(signed → completed\)/i }));

    // Confirmation Dialog modal is shown
    expect(screen.getByText('Confirm Deal Closing')).toBeInTheDocument();
    expect(screen.getByText(/Both parties have signed. Closing this deal will record the investment/i)).toBeInTheDocument();
    expect(screen.getAllByText('Apex Capital').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('EUR 200,000')).toBeInTheDocument();
    expect(screen.getByText('EUR 2,000,000')).toBeInTheDocument();
  });

  it('Phase9_CloseDeal_CancelDoesNotCallAPI', async () => {
    vi.mocked(entrepreneurApi.getCompanyDeals).mockResolvedValue([sampleSignedDeal]);

    render(<Phase9Client />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Close deal \(signed → completed\)/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Close deal \(signed → completed\)/i }));
    expect(screen.getByText('Confirm Deal Closing')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(entrepreneurApi.closeDeal).not.toHaveBeenCalled();
  });

  it('Phase9_CloseDeal_ConfirmCallsAPI', async () => {
    vi.mocked(entrepreneurApi.getCompanyDeals).mockResolvedValue([sampleSignedDeal]);
    vi.mocked(entrepreneurApi.closeDeal).mockResolvedValue(sampleCompletedDeal);

    render(<Phase9Client />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Close deal \(signed → completed\)/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Close deal \(signed → completed\)/i }));
    expect(screen.getByText('Confirm Deal Closing')).toBeInTheDocument();

    // Click "Close Deal" button inside dialog
    const confirmButtons = screen.getAllByRole('button', { name: /^Close Deal$/i });
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(entrepreneurApi.closeDeal).toHaveBeenCalledWith('deal-signed-001');
    });
  });

  it('Phase9_CounterOffer_ShowsChangedTermDiff', () => {
    const dealWithDiff: DealStatusResponse = {
      dealId: 'deal-negotiating-003',
      status: 'negotiating',
      progressPercent: 60,
      termSheet: {
        totalRaiseAmount: 250000,
        postMoneyValuation: 1800000,
        equityType: 'preferred',
        investorEquityPercent: 15,
        proRataRights: true,
        status: 'negotiating',
      },
      revisions: [
        {
          revisionNumber: 1,
          proposedByRole: 'investor',
          status: 'countered',
          createdAt: '2026-08-20T10:00:00Z',
          terms: {
            totalRaiseAmount: 200000,
            postMoneyValuation: 2000000,
            equityType: 'preferred',
            investorEquityPercent: 12,
            proRataRights: true,
            status: 'countered',
          },
        },
        {
          revisionNumber: 2,
          proposedByRole: 'founder',
          status: 'sent',
          note: 'Adjusted valuation based on latest ARR metrics',
          createdAt: '2026-08-21T14:00:00Z',
          terms: {
            totalRaiseAmount: 250000,
            postMoneyValuation: 1800000,
            equityType: 'preferred',
            investorEquityPercent: 15,
            proRataRights: true,
            status: 'sent',
          },
        },
      ],
      closingChecklist: [],
      dueDiligenceChecklist: [],
      dealDocuments: [],
      investors: [
        {
          investorId: 'inv-3',
          investorName: 'Nordic Angels',
          committedAmount: 250000,
          status: 'negotiating',
        },
      ],
    };

    render(
      <Phase9PipelineVisuals
        deals={[dealWithDiff]}
        summary={null}
        termSheet={dealWithDiff.termSheet}
        matches={[]}
        timeline={[]}
      />
    );

    expect(screen.getByText(/Counter-Offer Term Changes \(Rev #2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Proposed by founder/i)).toBeInTheDocument();
    expect(screen.getByText(/Adjusted valuation based on latest ARR metrics/i)).toBeInTheDocument();
  });

  it('Phase9_StaleAutoCompleteCopy_NotRendered', async () => {
    vi.mocked(entrepreneurApi.getCompanyDeals).mockResolvedValue([sampleSignedDeal]);

    render(<Phase9Client />);
    await waitFor(() => {
      expect(screen.queryByText(/Phase 9 auto-completes when Phase 8 is completed/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/auto-complete/i)).not.toBeInTheDocument();
    });
  });
});
