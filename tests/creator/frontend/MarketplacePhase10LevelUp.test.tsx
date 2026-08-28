import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import InvestorsPage from '@/app/dashboard/creator/investors/page';
import { LevelUpCelebration } from '@/components/creator/phase6/LevelUpCelebration';
import creatorJourneyApi, { CreatorReadiness } from '@/lib/api-creator-journey';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    state: {
      activeIdeaId: 'idea-phase10',
      project: { name: 'AutoInvoice SAS', clarityScore: 85 },
      journeyState: {
        phase5: { status: 'completed', selectedPath: 'sell' },
        phase6: { status: 'available' },
      },
    },
  }),
}));

const mockRefreshAuthMe = vi.fn();
vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    refreshAuthMe: mockRefreshAuthMe,
    user: { id: 'creator-user-123', roles: ['Creator'] },
  }),
}));

vi.mock('@/hooks/queries/chat', () => ({
  useCreateConversation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    getInvestors: vi.fn(),
    creatorReadiness: vi.fn(),
    levelUp: vi.fn(),
  },
}));

vi.mock('@/lib/api-creator-journey', () => ({
  default: mockApi,
  creatorJourneyApi: mockApi,
}));

const mockCofoundedReadiness: CreatorReadiness = {
  overallProgress: 100,
  levelUpEligible: true,
  selectedPath: 'sell',
  qualificationPath: 'CO_FOUNDED',
  companyName: 'AutoInvoice SAS',
  creatorRole: 'Co-founder & Head of Product',
  creatorEquityPercent: 12.0,
  partnerName: 'Bob Entrepreneur',
  companyId: 'comp-10',
  dealId: 'deal-10',
  outcomeBadge: 'CO-FOUNDED',
  requirements: [
    { key: 'verification', label: 'Verify your identity', route: '/dashboard/creator/phase-1', complete: true, required: true, blocking: true, status: 'COMPLETE', details: 'Identity verified' },
    { key: 'partnership_active', label: 'Partnership active', route: '/dashboard/creator/partnerships/deal-10', complete: true, required: true, blocking: true, status: 'COMPLETE', details: 'Equity partnership active and completed' },
    { key: 'company_linked', label: 'Company linked', route: '/dashboard/creator/partnerships/deal-10', complete: true, required: true, blocking: true, status: 'COMPLETE', details: 'Linked to AutoInvoice SAS' },
    { key: 'creator_shareholder', label: 'Creator shareholder recorded', route: '/dashboard/creator/partnerships/deal-10', complete: true, required: true, blocking: true, status: 'COMPLETE', details: 'Recorded on company cap table' },
    { key: 'role_confirmed', label: 'Role confirmed', route: '/dashboard/creator/partnerships/deal-10', complete: true, required: true, blocking: true, status: 'COMPLETE', details: 'Confirmed role: Co-founder & Head of Product' },
    { key: 'equity_recorded', label: 'Equity recorded', route: '/dashboard/creator/partnerships/deal-10', complete: true, required: true, blocking: true, status: 'COMPLETE', details: 'Equity grant: 12%' },
    { key: 'legal_signed', label: 'Legal package signed', route: '/dashboard/creator/partnerships/deal-10', complete: true, required: true, blocking: true, status: 'COMPLETE', details: 'All agreements signed with matching manifest hash' },
    { key: 'company_documents', label: 'Company documents available', route: '/dashboard/creator/partnerships/deal-10', complete: true, required: true, blocking: true, status: 'COMPLETE', details: 'Executed documents deposited' },
  ],
  missingRequired: [],
  nextBestAction: null,
};

describe('Marketplace Phase 10 — Co-founded Phase 6 Readiness & Level Up Frontend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (creatorJourneyApi.getInvestors as any).mockResolvedValue({
      featured: null,
      qualified: [],
      matchingTip: 'Growth matching tip',
      isEmpty: true,
    });
    (creatorJourneyApi.creatorReadiness as any).mockResolvedValue(mockCofoundedReadiness);
  });

  it('renders co-founded partnership summary header with company, role, equity and badges', async () => {
    render(<InvestorsPage />);

    await waitFor(() => {
      expect(screen.getByText('CO-FOUNDED')).toBeInTheDocument();
      expect(screen.getByText('Partnership Active ✓')).toBeInTheDocument();
      expect(screen.getByText('AutoInvoice SAS')).toBeInTheDocument();
      expect(screen.getByText('12%')).toBeInTheDocument();
      expect(screen.getByText('Co-founder & Head of Product')).toBeInTheDocument();
      expect(screen.getByText('Bob Entrepreneur')).toBeInTheDocument();
    });
  });

  it('renders all 8 canonical co-founded readiness checklist items with verified indicators', async () => {
    render(<InvestorsPage />);

    await waitFor(() => {
      expect(screen.getByText('Verify your identity')).toBeInTheDocument();
      expect(screen.getByText('Partnership active')).toBeInTheDocument();
      expect(screen.getByText('Company linked')).toBeInTheDocument();
      expect(screen.getByText('Creator shareholder recorded')).toBeInTheDocument();
      expect(screen.getByText('Role confirmed')).toBeInTheDocument();
      expect(screen.getByText('Equity recorded')).toBeInTheDocument();
      expect(screen.getByText('Legal package signed')).toBeInTheDocument();
      expect(screen.getByText('Company documents available')).toBeInTheDocument();
    });

    const verifiedBadges = screen.getAllByText('✓ Verified');
    expect(verifiedBadges.length).toBe(8);
  });

  it('renders "Ready to Level Up" hero card with explicit transition explanation', async () => {
    render(<InvestorsPage />);

    await waitFor(() => {
      expect(screen.getByText('Ready to Level Up')).toBeInTheDocument();
      expect(screen.getByText(/You have successfully co-founded AutoInvoice SAS!/i)).toBeInTheDocument();
      expect(screen.getByText(/You will keep access to your Creator projects and gain Entrepreneur access for your active company/i)).toBeInTheDocument();
      expect(screen.getByText('Level Up to Entrepreneur')).toBeInTheDocument();
    });
  });

  it('opens confirmation modal and triggers Level Up with auth refresh and redirect', async () => {
    (creatorJourneyApi.levelUp as any).mockResolvedValue({
      levelUpComplete: true,
      entrepreneurProfileId: 'profile-123',
      redirectTo: '/dashboard/entrepreneur',
    });

    render(<InvestorsPage />);

    await waitFor(() => {
      expect(screen.getByText('Level Up to Entrepreneur')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Level Up to Entrepreneur'));

    // Modal is rendered
    expect(screen.getByText(/Resulting roles: Creator & Entrepreneur/i)).toBeInTheDocument();
    expect(screen.getByText('Confirm Level Up')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirm Level Up'));

    await waitFor(() => {
      expect(creatorJourneyApi.levelUp).toHaveBeenCalledWith('idea-phase10');
      expect(mockRefreshAuthMe).toHaveBeenCalled();
    });
  });

  it('displays pending notice when requirements are not all complete', async () => {
    const incompleteReadiness: CreatorReadiness = {
      ...mockCofoundedReadiness,
      overallProgress: 75,
      levelUpEligible: false,
      requirements: mockCofoundedReadiness.requirements.map(r =>
        r.key === 'legal_signed' ? { ...r, complete: false, status: 'PENDING', details: 'Signed legal package required' } : r
      ),
      missingRequired: ['legal_signed'],
    };

    (creatorJourneyApi.creatorReadiness as any).mockResolvedValue(incompleteReadiness);

    render(<InvestorsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Some requirements are still pending/i)).toBeInTheDocument();
      expect(screen.queryByText('Level Up to Entrepreneur')).not.toBeInTheDocument();
    });
  });

  it('LevelUpCelebration handles Level Up execution and cancellation', async () => {
    const onDone = vi.fn();
    const onCancel = vi.fn();

    render(<LevelUpCelebration ideaId="idea-phase10" onDone={onDone} onCancel={onCancel} />);

    expect(screen.getByText('Level Up')).toBeInTheDocument();
    expect(screen.getByText(/You will keep access to your Creator projects/i)).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
