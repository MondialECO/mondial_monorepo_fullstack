import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import CreatorDashboard from '@/app/dashboard/creator/page';
import type { CreatorDashboardSummary } from '@/types/creator/dashboard';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/dashboard/creator',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

// Mock Auth
vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-creator-1', name: 'Jean Dupont', email: 'jean@example.com' },
    isAuthenticated: true,
  }),
}));

// Mock Creator Progress Provider
vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    state: {
      activeIdeaId: 'idea-123',
      journeyState: {
        phase1: { status: 'completed' },
        phase2: { status: 'in_progress' },
        phase3: { status: 'locked' },
        phase4: { status: 'locked' },
        phase5: { status: 'locked' },
      },
      project: { name: 'EcoVenture' },
    },
    advancePhase: vi.fn(),
    setCrossroadsPath: vi.fn(),
  }),
}));

// Mock Chat and Notifications queries
vi.mock('@/hooks/queries/chat', () => ({
  useConversations: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/hooks/queries/notifications', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    isError: false,
  }),
}));

// Mock HumainXDashboardCard
vi.mock('@/components/creator/dashboard/HumainXDashboardCard', () => ({
  HumainXDashboardCard: () => React.createElement('div', { 'data-testid': 'humainx-card' }, 'HumainX Card'),
}));

// Mock useCreatorDashboardSummary
let mockSummaryData: CreatorDashboardSummary | undefined = undefined;
let mockIsLoading = false;
let mockIsError = false;

vi.mock('@/hooks/queries/creator', () => ({
  useCreatorDashboardSummary: () => ({
    data: mockSummaryData,
    isLoading: mockIsLoading,
    isError: mockIsError,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('CreatorDashboard Component — Canonical Command Center', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
    mockIsError = false;
  });

  it('1. New Creator (Phase 2): Next action points to Phase 2 Brand Studio, no SaaS badge or global scores', () => {
    mockSummaryData = {
      project: {
        id: 'idea-123',
        name: 'CleanDrop',
        tagline: 'Refillable household essentials',
        sector: 'Retail / Eco',
        category: 'Eco Products',
      },
      nextAction: {
        key: 'brand_identity',
        phase: 2,
        title: 'Build Brand Identity',
        description: 'Define your brand voice, color palette, typography, and generate your Brand Kit.',
        buttonLabel: 'Open Brand Studio',
        href: '/dashboard/creator/phase-2',
      },
      attentionItems: [],
      journey: {
        currentPhase: 2,
        overallProgress: 10,
        phases: [
          { phase: 2, title: 'Identity & Brand', status: 'In Progress', href: '/dashboard/creator/phase-2' },
          { phase: 3, title: 'Business Intelligence', status: 'Locked', href: '/dashboard/creator/phase-3' },
          { phase: 4, title: 'Construction', status: 'Locked', href: '/dashboard/creator/phase-4' },
          { phase: 5, title: 'The Crossroads', status: 'Locked', href: '/dashboard/creator/phase-5' },
        ],
        activeSubstages: [
          { id: 'concept', title: 'Concept Statement', isCompleted: true, status: 'Completed', href: '/dashboard/creator/phase-2' },
          { id: 'brand_kit', title: 'Brand Kit', isCompleted: false, status: 'In Progress', href: '/dashboard/creator/phase-2' },
        ],
      },
      results: [],
      phase5: {
        isUnlocked: false,
        href: '/dashboard/creator/phase-5',
        guidanceText: 'Complete Phase 4 Construction milestones (Snapshot, Roadmap, Needs, Skills, Support, Pricing, GTM) to unlock Phase 5 Crossroads.',
      },
    };

    render(<CreatorDashboard />);

    // Brand / Project name displayed
    expect(screen.getByText('CleanDrop')).toBeInTheDocument();
    expect(screen.getByText('Retail / Eco')).toBeInTheDocument();

    // Next action card points to Phase 2 Brand Studio
    expect(screen.getByText('Build Brand Identity')).toBeInTheDocument();
    const actionBtn = screen.getByRole('link', { name: /Open Brand Studio/i });
    expect(actionBtn).toHaveAttribute('href', '/dashboard/creator/phase-2');

    // No hardcoded "SaaS" badge
    expect(screen.queryByText('SaaS')).toBeNull();

    // No global "Idea Readiness" score or investor readiness score
    expect(screen.queryByText(/Idea Readiness/i)).toBeNull();
    expect(screen.queryByText(/Investor Readiness/i)).toBeNull();

    // No Interested Buyers (0) or EBITDA —
    expect(screen.queryByText(/Interested Buyers/i)).toBeNull();
    expect(screen.queryByText(/EBITDA/i)).toBeNull();
  });

  it('2. BrandKit Output: displays verified output card and logo in header', () => {
    mockSummaryData = {
      project: {
        id: 'idea-123',
        name: 'SolarPack',
        tagline: 'Portable solar generators',
        brand: {
          brandName: 'SolarPack',
          logoUrl: 'https://storage.mondial.eco/logos/solarpack.png',
          primaryColor: '#0055FF',
          secondaryColor: '#FF9900',
          fontFamily: 'Inter',
        },
      },
      nextAction: {
        key: 'phase3_start',
        phase: 3,
        title: 'Begin Business Intelligence',
        description: 'Conduct market validation and competitive positioning in Phase 3.1.',
        buttonLabel: 'Start Market Study',
        href: '/dashboard/creator/phase-3/market',
      },
      attentionItems: [],
      journey: {
        currentPhase: 3,
        overallProgress: 30,
        phases: [
          { phase: 2, title: 'Identity & Brand', status: 'Completed', href: '/dashboard/creator/phase-2' },
          { phase: 3, title: 'Business Intelligence', status: 'In Progress', href: '/dashboard/creator/phase-3' },
          { phase: 4, title: 'Construction', status: 'Locked', href: '/dashboard/creator/phase-4' },
          { phase: 5, title: 'The Crossroads', status: 'Locked', href: '/dashboard/creator/phase-5' },
        ],
      },
      results: [
        {
          id: 'brand_kit_res',
          title: 'Brand Identity & Kit',
          category: 'Brand',
          status: 'Ready',
          href: '/dashboard/creator/phase-2',
          updatedAtUtc: new Date().toISOString(),
        },
      ],
      phase5: {
        isUnlocked: false,
        href: '/dashboard/creator/phase-5',
        guidanceText: 'Complete Phase 4 Construction milestones (Snapshot, Roadmap, Needs, Skills, Support, Pricing, GTM) to unlock Phase 5 Crossroads.',
      },
    };

    render(<CreatorDashboard />);

    // Brand logo image is rendered
    const logoImg = screen.getByAltText('SolarPack');
    expect(logoImg).toHaveAttribute('src', 'https://storage.mondial.eco/logos/solarpack.png');

    // Brand Identity output card exists
    expect(screen.getByText('Brand Identity & Kit')).toBeInTheDocument();
    expect(screen.getByText('Verified Outputs & Assets (1)')).toBeInTheDocument();
  });

  it('3. Mid-Phase 3 Next Action: points to next unresolved Phase 3 step', () => {
    mockSummaryData = {
      project: { id: 'idea-123', name: 'HydroFlow' },
      nextAction: {
        key: 'phase3_legal',
        phase: 3,
        title: 'Review Legal & Regulatory Assessment',
        description: 'Complete mandatory compliance checks in Phase 3.4.',
        buttonLabel: 'Open Legal Center',
        href: '/dashboard/creator/phase-3/legal',
      },
      attentionItems: [],
      journey: {
        currentPhase: 3,
        overallProgress: 45,
        phases: [
          { phase: 2, title: 'Identity & Brand', status: 'Completed', href: '/dashboard/creator/phase-2' },
          { phase: 3, title: 'Business Intelligence', status: 'In Progress', href: '/dashboard/creator/phase-3' },
          { phase: 4, title: 'Construction', status: 'Locked', href: '/dashboard/creator/phase-4' },
          { phase: 5, title: 'The Crossroads', status: 'Locked', href: '/dashboard/creator/phase-5' },
        ],
      },
      results: [],
      phase5: {
        isUnlocked: false,
        href: '/dashboard/creator/phase-5',
        guidanceText: 'Complete Phase 4 Construction milestones.',
      },
    };

    render(<CreatorDashboard />);

    expect(screen.getByText('Review Legal & Regulatory Assessment')).toBeInTheDocument();
    const legalLink = screen.getByRole('link', { name: /Open Legal Center/i });
    expect(legalLink).toHaveAttribute('href', '/dashboard/creator/phase-3/legal');
  });

  it('4. Attention Items: displays prioritized attention panel when items exist', () => {
    mockSummaryData = {
      project: { id: 'idea-123', name: 'VoltCharge' },
      nextAction: {
        key: 'roadmap',
        phase: 4,
        title: 'Execute Roadmap',
        description: 'Implement milestones.',
        buttonLabel: 'Continue',
        href: '/dashboard/creator/phase-4/roadmap',
      },
      attentionItems: [
        {
          id: 'stale_pricing',
          title: 'Pricing Strategy Needs Refresh',
          description: 'Underlying financial figures updated.',
          severity: 'high',
          actionLabel: 'Refresh Pricing',
          href: '/dashboard/creator/phase-4/pricing',
          phase: 4,
        },
      ],
      journey: {
        currentPhase: 4,
        overallProgress: 60,
        phases: [],
      },
      results: [],
      phase5: { isUnlocked: false, href: '/dashboard/creator/phase-5', guidanceText: 'Locked.' },
    };

    render(<CreatorDashboard />);

    expect(screen.getByText('Items Requiring Attention (1)')).toBeInTheDocument();
    expect(screen.getByText('Pricing Strategy Needs Refresh')).toBeInTheDocument();
    expect(screen.getByText('high priority')).toBeInTheDocument();
    const refreshBtn = screen.getByRole('link', { name: /Refresh Pricing/i });
    expect(refreshBtn).toHaveAttribute('href', '/dashboard/creator/phase-4/pricing');
  });

  it('5. Phase 4 Incomplete Locks Phase 5: Crossroads banner shows locked state with guidance text', () => {
    mockSummaryData = {
      project: { id: 'idea-123', name: 'AgriSense' },
      nextAction: {
        key: 'skills',
        phase: 4,
        title: 'Review Founder Skills Plan',
        description: 'Resolve capability gaps in Phase 4.4.',
        buttonLabel: 'Open Skills Plan',
        href: '/dashboard/creator/phase-4/skills',
      },
      attentionItems: [],
      journey: {
        currentPhase: 4,
        overallProgress: 70,
        phases: [
          { phase: 2, title: 'Identity & Brand', status: 'Completed', href: '/dashboard/creator/phase-2' },
          { phase: 3, title: 'Business Intelligence', status: 'Completed', href: '/dashboard/creator/phase-3' },
          { phase: 4, title: 'Construction', status: 'In Progress', href: '/dashboard/creator/phase-4' },
          { phase: 5, title: 'The Crossroads', status: 'Locked', href: '/dashboard/creator/phase-5' },
        ],
        activeSubstages: [
          { id: 'snapshot', title: 'Construction Snapshot', isCompleted: true, status: 'Completed', href: '/dashboard/creator/phase-4/snapshot' },
          { id: 'roadmap', title: 'Execution Roadmap', isCompleted: true, status: 'Completed', href: '/dashboard/creator/phase-4/roadmap' },
          { id: 'needs', title: 'Operational Needs', isCompleted: true, status: 'Completed', href: '/dashboard/creator/phase-4/needs' },
          { id: 'skills', title: 'Founder Skills Plan', isCompleted: false, status: 'In Progress', href: '/dashboard/creator/phase-4/skills' },
          { id: 'support', title: 'Public Support Matrix', isCompleted: false, status: 'Pending', href: '/dashboard/creator/phase-4/support' },
          { id: 'pricing', title: 'Pricing Strategy', isCompleted: false, status: 'Pending', href: '/dashboard/creator/phase-4/pricing' },
          { id: 'gtm', title: 'GTM Strategy', isCompleted: false, status: 'Pending', href: '/dashboard/creator/phase-4/gtm' },
        ],
      },
      results: [],
      phase5: {
        isUnlocked: false,
        href: '/dashboard/creator/phase-5',
        guidanceText: 'Complete Phase 4 Construction milestones (Snapshot, Roadmap, Needs, Skills, Support, Pricing, GTM) to unlock Phase 5 Crossroads.',
      },
    };

    render(<CreatorDashboard />);

    // Locked status badge (appears in Phase 5 milestone card and Crossroads banner)
    expect(screen.getAllByText('Locked').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Complete Phase 4 Construction milestones \(Snapshot, Roadmap, Needs, Skills, Support, Pricing, GTM\) to unlock Phase 5 Crossroads\./i)).toBeInTheDocument();

    // Button is disabled
    const lockedBtn = screen.getByRole('button', { name: /Crossroads Locked/i });
    expect(lockedBtn).toBeDisabled();

    // Verify ABSOLUTELY NO Phase 4.8 or 4.9 substages exist
    expect(screen.queryByText(/Launch Assets/i)).toBeNull();
    expect(screen.queryByText(/Construction Readiness/i)).toBeNull();
    expect(screen.queryByText(/4\.8/i)).toBeNull();
    expect(screen.queryByText(/4\.9/i)).toBeNull();
  });

  it('6. Phase 4 Complete Enables Phase 5: Crossroads banner is unlocked and actionable', () => {
    mockSummaryData = {
      project: { id: 'idea-123', name: 'AgriSense' },
      nextAction: {
        key: 'crossroads',
        phase: 5,
        title: 'Choose Strategic Path at The Crossroads',
        description: 'Decide between Full Buyout and Building Your Company.',
        buttonLabel: 'Enter The Crossroads',
        href: '/dashboard/creator/phase-5',
      },
      attentionItems: [],
      journey: {
        currentPhase: 5,
        overallProgress: 100,
        phases: [
          { phase: 2, title: 'Identity & Brand', status: 'Completed', href: '/dashboard/creator/phase-2' },
          { phase: 3, title: 'Business Intelligence', status: 'Completed', href: '/dashboard/creator/phase-3' },
          { phase: 4, title: 'Construction', status: 'Completed', href: '/dashboard/creator/phase-4' },
          { phase: 5, title: 'The Crossroads', status: 'Available', href: '/dashboard/creator/phase-5' },
        ],
      },
      results: [],
      phase5: {
        isUnlocked: true,
        href: '/dashboard/creator/phase-5',
        guidanceText: 'All Phase 4 Construction milestones are complete. Enter The Crossroads to decide your launch route.',
        selectedPath: 'sell',
      },
    };

    render(<CreatorDashboard />);

    expect(screen.getByText('Unlocked')).toBeInTheDocument();
    expect(screen.getByText('Path: Full Buyout')).toBeInTheDocument();

    const crossroadsLinks = screen.getAllByRole('link', { name: /Enter The Crossroads/i });
    expect(crossroadsLinks.length).toBe(2);
    crossroadsLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/dashboard/creator/phase-5');
    });
  });
});
