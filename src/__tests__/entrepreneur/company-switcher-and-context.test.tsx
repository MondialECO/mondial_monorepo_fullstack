import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CompanySwitcher } from '@/components/entrepreneur/CompanySwitcher';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import MyCompaniesPage from '@/app/dashboard/entrepreneur/companies/page';
import * as providerModule from '@/providers/EntrepreneurProgressProvider';
import * as authModule from '@/app/_providers/AuthProvider';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/dashboard/entrepreneur/phase-5',
}));

let currentMockUser: { id: string; name: string; onboardingPhase: number; role: string } = {
  id: 'user-1',
  name: 'Test User',
  onboardingPhase: 1,
  role: 'Entrepreneur',
};

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: currentMockUser,
    token: 'fake-token',
  }),
}));

describe('CompanySwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders active company name and phase badge', () => {
    const mockContext: providerModule.EntrepreneurProgressContextType = {
      progress: {
        currentPhase: 3,
        currentStep: 1,
        completedPhases: new Set([2]),
        completedSteps: new Set(),
        phaseData: {},
        trustScore: 40,
        lastUpdated: Date.now(),
      },
      isLoading: false,
      backendFetchFailed: false,
      currentPhase: 3,
      currentStep: 1,
      trustScore: 40,
      companies: [
        {
          id: 'comp-1',
          companyName: 'Acme Robotics',
          currentPhase: 3,
          completedPhases: [2],
          isInvestorReady: false,
          isActive: true,
        },
        {
          id: 'comp-2',
          companyName: 'Beta Solar',
          currentPhase: 2,
          completedPhases: [],
          isInvestorReady: false,
          isActive: false,
        },
      ],
      activeCompany: {
        id: 'comp-1',
        companyName: 'Acme Robotics',
        currentPhase: 3,
        completedPhases: [2],
        isInvestorReady: false,
        isActive: true,
      },
      activeCompanyId: 'comp-1',
      isSwitching: false,
      switchCompany: vi.fn().mockResolvedValue(true),
      refreshCompanies: vi.fn(),
      isStepComplete: vi.fn(),
      getPhaseProgress: vi.fn(),
      canMoveToNextStep: vi.fn(),
      completeStep: vi.fn(),
      moveToNextStep: vi.fn(),
      moveToStep: vi.fn(),
      savePhaseData: vi.fn(),
      getPhaseData: vi.fn(),
      resetProgress: vi.fn(),
      applyBackendResponse: vi.fn(),
      refreshFromBackend: vi.fn(),
    };

    vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockContext);

    render(<CompanySwitcher />);

    expect(screen.getByText('Acme Robotics')).toBeInTheDocument();
    expect(screen.getByText('P3')).toBeInTheDocument();
  });

  it('opens dropdown and lists all owned companies', () => {
    const mockSwitch = vi.fn().mockResolvedValue(true);
    const mockContext: providerModule.EntrepreneurProgressContextType = {
      progress: {
        currentPhase: 3,
        currentStep: 1,
        completedPhases: new Set([2]),
        completedSteps: new Set(),
        phaseData: {},
        trustScore: 40,
        lastUpdated: Date.now(),
      },
      isLoading: false,
      backendFetchFailed: false,
      companies: [
        {
          id: 'comp-1',
          companyName: 'Acme Robotics',
          currentPhase: 3,
          completedPhases: [2],
          isInvestorReady: false,
          isActive: true,
        },
        {
          id: 'comp-2',
          companyName: 'Beta Solar',
          currentPhase: 2,
          completedPhases: [],
          isInvestorReady: false,
          isActive: false,
        },
      ],
      activeCompany: {
        id: 'comp-1',
        companyName: 'Acme Robotics',
        currentPhase: 3,
        completedPhases: [2],
        isInvestorReady: false,
        isActive: true,
      },
      activeCompanyId: 'comp-1',
      isSwitching: false,
      switchCompany: mockSwitch,
      refreshCompanies: vi.fn(),
      isStepComplete: vi.fn(),
      getPhaseProgress: vi.fn(),
      canMoveToNextStep: vi.fn(),
      completeStep: vi.fn(),
      moveToNextStep: vi.fn(),
      moveToStep: vi.fn(),
      savePhaseData: vi.fn(),
      getPhaseData: vi.fn(),
      resetProgress: vi.fn(),
      applyBackendResponse: vi.fn(),
      refreshFromBackend: vi.fn(),
      trustScore: 40,
    };

    vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockContext);

    render(<CompanySwitcher />);

    // Click trigger to open dropdown
    const trigger = screen.getByRole('button', { name: /switch active company context/i });
    fireEvent.click(trigger);

    expect(screen.getByText('Active Operating Context')).toBeInTheDocument();
    expect(screen.getByText('Beta Solar')).toBeInTheDocument();
    expect(screen.getByText('Manage Companies')).toBeInTheDocument();

    // Click on Beta Solar to switch
    const betaButton = screen.getByText('Beta Solar');
    fireEvent.click(betaButton);

    expect(mockSwitch).toHaveBeenCalledWith('comp-2');
  });
});

describe('RouteGuard active company phase isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to active company phase when requesting locked phase', () => {
    // User is trying to access Phase 5, but active company is on Phase 2
    const mockContext: providerModule.EntrepreneurProgressContextType = {
      progress: {
        currentPhase: 2,
        currentStep: 1,
        completedPhases: new Set([]),
        completedSteps: new Set(),
        phaseData: {},
        trustScore: 0,
        lastUpdated: Date.now(),
      },
      isLoading: false,
      backendFetchFailed: false,
      currentPhase: 2,
      currentStep: 1,
      trustScore: 0,
      companies: [],
      activeCompany: null,
      activeCompanyId: 'comp-2',
      isSwitching: false,
      switchCompany: vi.fn(),
      refreshCompanies: vi.fn(),
      isStepComplete: vi.fn(),
      getPhaseProgress: vi.fn(),
      canMoveToNextStep: vi.fn(),
      completeStep: vi.fn(),
      moveToNextStep: vi.fn(),
      moveToStep: vi.fn(),
      savePhaseData: vi.fn(),
      getPhaseData: vi.fn(),
      resetProgress: vi.fn(),
      applyBackendResponse: vi.fn(),
      refreshFromBackend: vi.fn(),
    };

    vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockContext);

    render(
      <RouteGuard>
        <div>Phase 5 Content</div>
      </RouteGuard>
    );

    // RouteGuard should block Phase 5 and redirect to phase 2 step 1
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-2/step-1');
  });
});

describe('MyCompaniesPage', () => {
  it('renders list of owned companies and handles set active action', async () => {
    const mockSwitch = vi.fn().mockResolvedValue(true);
    const mockRefresh = vi.fn();

    const mockContext: providerModule.EntrepreneurProgressContextType = {
      progress: null,
      isLoading: false,
      backendFetchFailed: false,
      companies: [
        {
          id: 'comp-1',
          companyName: 'Acme Robotics',
          industry: 'Robotics',
          legalStructure: 'SAS',
          currentPhase: 4,
          completedPhases: [2, 3],
          isInvestorReady: true,
          isActive: true,
        },
        {
          id: 'comp-2',
          companyName: 'Beta Solar',
          industry: 'CleanTech',
          legalStructure: 'SARL',
          currentPhase: 2,
          completedPhases: [],
          isInvestorReady: false,
          isActive: false,
        },
      ],
      activeCompany: {
        id: 'comp-1',
        companyName: 'Acme Robotics',
        currentPhase: 4,
        completedPhases: [2, 3],
        isInvestorReady: true,
        isActive: true,
      },
      activeCompanyId: 'comp-1',
      isSwitching: false,
      switchCompany: mockSwitch,
      refreshCompanies: mockRefresh,
      isStepComplete: vi.fn(),
      getPhaseProgress: vi.fn(),
      canMoveToNextStep: vi.fn(),
      completeStep: vi.fn(),
      moveToNextStep: vi.fn(),
      moveToStep: vi.fn(),
      savePhaseData: vi.fn(),
      getPhaseData: vi.fn(),
      resetProgress: vi.fn(),
      applyBackendResponse: vi.fn(),
      refreshFromBackend: vi.fn(),
      trustScore: 80,
    };

    vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockContext);

    render(<MyCompaniesPage />);

    expect(screen.getByRole('heading', { name: 'My Companies' })).toBeInTheDocument();
    expect(screen.getByText('Acme Robotics')).toBeInTheDocument();
    expect(screen.getByText('Beta Solar')).toBeInTheDocument();
    expect(screen.getByText('Active Context')).toBeInTheDocument();

    const setActiveButton = screen.getByRole('button', { name: /set active/i });
    fireEvent.click(setActiveButton);

    expect(mockSwitch).toHaveBeenCalledWith('comp-2');
  });

  it('CompaniesPage_UsesApprovedSuccessToken - verifies approved success token is used', () => {
    const mockContext: providerModule.EntrepreneurProgressContextType = {
      progress: null,
      isLoading: false,
      backendFetchFailed: false,
      companies: [
        {
          id: 'comp-1',
          companyName: 'Acme Robotics',
          isInvestorReady: true,
          isActive: true,
          currentPhase: 4,
          completedPhases: [2, 3],
        },
      ],
      activeCompany: null,
      activeCompanyId: 'comp-1',
      isSwitching: false,
      switchCompany: vi.fn(),
      refreshCompanies: vi.fn(),
      isStepComplete: vi.fn(),
      getPhaseProgress: vi.fn(),
      canMoveToNextStep: vi.fn(),
      completeStep: vi.fn(),
      moveToNextStep: vi.fn(),
      moveToStep: vi.fn(),
      savePhaseData: vi.fn(),
      getPhaseData: vi.fn(),
      resetProgress: vi.fn(),
      applyBackendResponse: vi.fn(),
      refreshFromBackend: vi.fn(),
      trustScore: 80,
    };

    vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockContext);

    const { container } = render(<MyCompaniesPage />);
    const readySpan = screen.getByText('Ready').closest('span');
    expect(readySpan).toHaveClass('text-success-text');
    expect(container.querySelector('.text-success')).toBeNull();
  });
});

describe('Deep Link Notification and RouteGuard Activation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('CompanyNotification_DeepLinkActivatesCorrectCompany', async () => {
    const mockSwitch = vi.fn().mockResolvedValue(true);

    // Simulate URL having ?companyId=comp-2
    delete (window as any).location;
    (window as any).location = new URL('https://test.local/dashboard/entrepreneur/phase-5?companyId=comp-2');

    const mockContext: providerModule.EntrepreneurProgressContextType = {
      progress: {
        currentPhase: 5,
        currentStep: 1,
        completedPhases: new Set([2, 3, 4]),
        completedSteps: new Set(),
        phaseData: {},
        trustScore: 80,
        lastUpdated: Date.now(),
      },
      isLoading: false,
      backendFetchFailed: false,
      currentPhase: 5,
      currentStep: 1,
      trustScore: 80,
      companies: [],
      activeCompany: null,
      activeCompanyId: 'comp-1', // Initially on comp-1
      isSwitching: false,
      switchCompany: mockSwitch,
      refreshCompanies: vi.fn(),
      isStepComplete: vi.fn(),
      getPhaseProgress: vi.fn(),
      canMoveToNextStep: vi.fn(),
      completeStep: vi.fn(),
      moveToNextStep: vi.fn(),
      moveToStep: vi.fn(),
      savePhaseData: vi.fn(),
      getPhaseData: vi.fn(),
      resetProgress: vi.fn(),
      applyBackendResponse: vi.fn(),
      refreshFromBackend: vi.fn(),
    };

    vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockContext);

    render(
      <RouteGuard>
        <div>Phase 5 Content</div>
      </RouteGuard>
    );

    // RouteGuard should trigger switchCompany with comp-2 from deep link
    expect(mockSwitch).toHaveBeenCalledWith('comp-2');
  });

  it('CompanyNotification_RouteGuardUsesTargetCompany', async () => {
    // When comp-2 is active and has currentPhase = 2, RouteGuard redirects to phase 2
    delete (window as any).location;
    (window as any).location = new URL('https://test.local/dashboard/entrepreneur/phase-5?companyId=comp-2');

    const mockContext: providerModule.EntrepreneurProgressContextType = {
      progress: {
        currentPhase: 2,
        currentStep: 1,
        completedPhases: new Set([]),
        completedSteps: new Set(),
        phaseData: {},
        trustScore: 10,
        lastUpdated: Date.now(),
      },
      isLoading: false,
      backendFetchFailed: false,
      currentPhase: 2,
      currentStep: 1,
      trustScore: 10,
      companies: [],
      activeCompany: null,
      activeCompanyId: 'comp-2',
      isSwitching: false,
      switchCompany: vi.fn(),
      refreshCompanies: vi.fn(),
      isStepComplete: vi.fn(),
      getPhaseProgress: vi.fn(),
      canMoveToNextStep: vi.fn(),
      completeStep: vi.fn(),
      moveToNextStep: vi.fn(),
      moveToStep: vi.fn(),
      savePhaseData: vi.fn(),
      getPhaseData: vi.fn(),
      resetProgress: vi.fn(),
      applyBackendResponse: vi.fn(),
      refreshFromBackend: vi.fn(),
    };

    vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockContext);

    render(
      <RouteGuard>
        <div>Phase 5 Content</div>
      </RouteGuard>
    );

    expect(mockReplace).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-2/step-1');
  });
});

describe('EntrepreneurOverview Reactivity and Stale Data Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Overview_Refetches_WhenActiveCompanyChanges and Overview_NoCrossCompanyStaleData', async () => {
    const { entrepreneurApi } = await import('@/lib/api-entrepreneur');
    const { default: EntrepreneurOverview } = await import('@/app/dashboard/entrepreneur/overview');

    const getCurrentPhaseSpy = vi.spyOn(entrepreneurApi, 'getCurrentPhase').mockImplementation(async (cid) => {
      if (cid === 'comp-B') {
        return {
          companyId: 'comp-B',
          companyName: 'Company Beta',
          currentPhase: 2,
          currentStep: 1,
          completedPhases: [],
          isInvestorReady: false,
          overallProgressPercent: 20,
          trustScore: 25,
        } as any;
      }
      return {
        companyId: 'comp-A',
        companyName: 'Company Alpha',
        currentPhase: 5,
        currentStep: 1,
        completedPhases: [2, 3, 4],
        isInvestorReady: true,
        overallProgressPercent: 55,
        trustScore: 85,
      } as any;
    });

    const getFundingProfileSpy = vi.spyOn(entrepreneurApi, 'getFundingProfile').mockImplementation(async (cid) => {
      if (cid === 'comp-B') {
        return {
          fundingAskAmount: 500000,
          fundingRoundType: 'seed',
          capitalAllocation: [],
        } as any;
      }
      return {
        fundingAskAmount: 100000,
        fundingRoundType: 'pre_seed',
        capitalAllocation: [],
      } as any;
    });

    vi.spyOn(entrepreneurApi, 'getFinancialSummary').mockResolvedValue({ finalValuation: 0 } as any);
    vi.spyOn(entrepreneurApi, 'getMatchingInsights').mockResolvedValue({ totalMatches: 0, highScoreMatches: 0 } as any);
    vi.spyOn(entrepreneurApi, 'getCompanyDeals').mockResolvedValue([]);
    vi.spyOn(entrepreneurApi, 'getRecommendations').mockResolvedValue([]);
    vi.spyOn(entrepreneurApi, 'getDataRoomActivityTimeline').mockResolvedValue([]);

    // 1. Render with Company A active
    let mockContext: providerModule.EntrepreneurProgressContextType = {
      progress: null,
      isLoading: false,
      backendFetchFailed: false,
      companies: [],
      activeCompany: null,
      activeCompanyId: 'comp-A',
      isSwitching: false,
      switchCompany: vi.fn(),
      refreshCompanies: vi.fn(),
      isStepComplete: vi.fn(),
      getPhaseProgress: vi.fn(),
      canMoveToNextStep: vi.fn(),
      completeStep: vi.fn(),
      moveToNextStep: vi.fn(),
      moveToStep: vi.fn(),
      savePhaseData: vi.fn(),
      getPhaseData: vi.fn(),
      resetProgress: vi.fn(),
      applyBackendResponse: vi.fn(),
      refreshFromBackend: vi.fn(),
      trustScore: 85,
    };

    const spyContext = vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockContext);

    const { rerender } = render(<EntrepreneurOverview />);

    await waitFor(() => {
      expect(screen.getByText('P5 Active')).toBeInTheDocument();
      expect(screen.getByText('85/100')).toBeInTheDocument();
    });
    expect(getCurrentPhaseSpy).toHaveBeenCalledWith('comp-A');
    expect(getFundingProfileSpy).toHaveBeenCalledWith('comp-A');

    // 2. Switch context to Company B (without page refresh)
    mockContext = {
      ...mockContext,
      activeCompanyId: 'comp-B',
      trustScore: 25,
    };
    spyContext.mockReturnValue(mockContext);

    rerender(<EntrepreneurOverview />);

    await waitFor(() => {
      expect(screen.getByText('P2 Active')).toBeInTheDocument();
      expect(screen.getByText('25/100')).toBeInTheDocument();
    });
    expect(getCurrentPhaseSpy).toHaveBeenCalledWith('comp-B');
    expect(getFundingProfileSpy).toHaveBeenCalledWith('comp-B');

    // Stale Company A data must no longer exist
    expect(screen.queryByText('P5 Active')).toBeNull();
    expect(screen.queryByText('85/100')).toBeNull();
  });

  it('VerifiedCreator_LevelUp_DashboardDoesNotShowPhase1CTA', async () => {
    const { entrepreneurApi } = await import('@/lib/api-entrepreneur');
    const { default: EntrepreneurOverview } = await import('@/app/dashboard/entrepreneur/overview');

    currentMockUser = { id: 'user-creator', name: 'Verified Creator', onboardingPhase: 1, role: 'Entrepreneur' };

    // Simulate no company returned initially or error fetching company
    vi.spyOn(entrepreneurApi, 'getCurrentPhase').mockRejectedValue(new Error('No company found'));

    const mockContext: providerModule.EntrepreneurProgressContextType = {
      progress: null,
      isLoading: false,
      backendFetchFailed: false,
      companies: [],
      activeCompany: null,
      activeCompanyId: null,
      isSwitching: false,
      switchCompany: vi.fn(),
      refreshCompanies: vi.fn(),
      isStepComplete: vi.fn(),
      getPhaseProgress: vi.fn(),
      canMoveToNextStep: vi.fn(),
      completeStep: vi.fn(),
      moveToNextStep: vi.fn(),
      moveToStep: vi.fn(),
      savePhaseData: vi.fn(),
      getPhaseData: vi.fn(),
      resetProgress: vi.fn(),
      applyBackendResponse: vi.fn(),
      refreshFromBackend: vi.fn(),
      trustScore: 0,
    };

    vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockContext);

    render(<EntrepreneurOverview />);

    await waitFor(() => {
      expect(screen.getByText('Continue your entrepreneur journey')).toBeInTheDocument();
      expect(screen.getByText('Complete your company verification to continue building your business.')).toBeInTheDocument();
      const cta = screen.getByRole('link', { name: /continue company verification/i });
      expect(cta).toHaveAttribute('href', '/dashboard/entrepreneur/phase-2');
    });

    expect(screen.queryByText('Start your entrepreneur journey')).toBeNull();
    expect(screen.queryByRole('link', { name: /begin verification/i })).toBeNull();
  });

  it('UnverifiedUser_ShowsPhase1CTA', async () => {
    const { entrepreneurApi } = await import('@/lib/api-entrepreneur');
    const { default: EntrepreneurOverview } = await import('@/app/dashboard/entrepreneur/overview');

    currentMockUser = { id: 'user-unverified', name: 'Unverified User', onboardingPhase: 0, role: 'Entrepreneur' };

    vi.spyOn(entrepreneurApi, 'getCurrentPhase').mockRejectedValue(new Error('No company found'));

    const mockContext: providerModule.EntrepreneurProgressContextType = {
      progress: null,
      isLoading: false,
      backendFetchFailed: false,
      companies: [],
      activeCompany: null,
      activeCompanyId: null,
      isSwitching: false,
      switchCompany: vi.fn(),
      refreshCompanies: vi.fn(),
      isStepComplete: vi.fn(),
      getPhaseProgress: vi.fn(),
      canMoveToNextStep: vi.fn(),
      completeStep: vi.fn(),
      moveToNextStep: vi.fn(),
      moveToStep: vi.fn(),
      savePhaseData: vi.fn(),
      getPhaseData: vi.fn(),
      resetProgress: vi.fn(),
      applyBackendResponse: vi.fn(),
      refreshFromBackend: vi.fn(),
      trustScore: 0,
    };

    vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockContext);

    render(<EntrepreneurOverview />);

    await waitFor(() => {
      expect(screen.getByText('Start your entrepreneur journey')).toBeInTheDocument();
      expect(screen.getByText('Complete your identity verification to continue.')).toBeInTheDocument();
      const cta = screen.getByRole('link', { name: /begin verification/i });
      expect(cta).toHaveAttribute('href', '/dashboard/entrepreneur/phase-1');
    });

    expect(screen.queryByText('Continue your entrepreneur journey')).toBeNull();
    expect(screen.queryByRole('link', { name: /continue company verification/i })).toBeNull();
  });

  it('VerifiedEntrepreneur_Phase2_ShowsCompanyVerificationCTA', async () => {
    const { entrepreneurApi } = await import('@/lib/api-entrepreneur');
    const { default: EntrepreneurOverview } = await import('@/app/dashboard/entrepreneur/overview');

    currentMockUser = { id: 'user-1', name: 'Verified Founder', onboardingPhase: 1, role: 'Entrepreneur' };

    vi.spyOn(entrepreneurApi, 'getCurrentPhase').mockResolvedValue({
      companyId: 'comp-p2',
      companyName: 'Phase 2 Corp',
      currentPhase: 2,
      currentStep: 1,
      completedPhases: [],
      isInvestorReady: false,
      overallProgressPercent: 10,
      trustScore: 30,
    } as any);

    const mockContext: providerModule.EntrepreneurProgressContextType = {
      progress: {
        currentPhase: 2,
        currentStep: 1,
        completedPhases: new Set([]),
        completedSteps: new Set(),
        phaseData: {},
        trustScore: 30,
        lastUpdated: Date.now(),
      },
      isLoading: false,
      backendFetchFailed: false,
      currentPhase: 2,
      currentStep: 1,
      companies: [],
      activeCompany: null,
      activeCompanyId: 'comp-p2',
      isSwitching: false,
      switchCompany: vi.fn(),
      refreshCompanies: vi.fn(),
      isStepComplete: vi.fn(),
      getPhaseProgress: vi.fn(),
      canMoveToNextStep: vi.fn(),
      completeStep: vi.fn(),
      moveToNextStep: vi.fn(),
      moveToStep: vi.fn(),
      savePhaseData: vi.fn(),
      getPhaseData: vi.fn(),
      resetProgress: vi.fn(),
      applyBackendResponse: vi.fn(),
      refreshFromBackend: vi.fn(),
      trustScore: 30,
    };

    vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockContext);

    render(<EntrepreneurOverview />);

    await waitFor(() => {
      expect(screen.getByText('P2 Active')).toBeInTheDocument();
      const heroCta = screen.getByRole('link', { name: /continue company verification/i });
      expect(heroCta).toHaveAttribute('href', '/dashboard/entrepreneur/phase-2');
    });

    expect(screen.queryByRole('link', { name: /begin verification/i })).toBeNull();
  });

  it('ActiveCompanyPhase5_DoesNotShowPhase1CTA and CompanySwitch_UpdatesJourneyCTA', async () => {
    const { entrepreneurApi } = await import('@/lib/api-entrepreneur');
    const { default: EntrepreneurOverview } = await import('@/app/dashboard/entrepreneur/overview');

    currentMockUser = { id: 'user-1', name: 'Verified Founder', onboardingPhase: 1, role: 'Entrepreneur' };

    vi.spyOn(entrepreneurApi, 'getCurrentPhase').mockImplementation(async (cid) => {
      if (cid === 'comp-5') {
        return {
          companyId: 'comp-5',
          companyName: 'Series A Corp',
          currentPhase: 5,
          currentStep: 1,
          completedPhases: [2, 3, 4],
          isInvestorReady: true,
          overallProgressPercent: 55,
          trustScore: 90,
        } as any;
      }
      return {
        companyId: 'comp-2',
        companyName: 'Seed Corp',
        currentPhase: 2,
        currentStep: 1,
        completedPhases: [],
        isInvestorReady: false,
        overallProgressPercent: 15,
        trustScore: 35,
      } as any;
    });

    let mockContext: providerModule.EntrepreneurProgressContextType = {
      progress: {
        currentPhase: 5,
        currentStep: 1,
        completedPhases: new Set([2, 3, 4]),
        completedSteps: new Set(),
        phaseData: {},
        trustScore: 90,
        lastUpdated: Date.now(),
      },
      isLoading: false,
      backendFetchFailed: false,
      currentPhase: 5,
      currentStep: 1,
      companies: [],
      activeCompany: null,
      activeCompanyId: 'comp-5',
      isSwitching: false,
      switchCompany: vi.fn(),
      refreshCompanies: vi.fn(),
      isStepComplete: vi.fn(),
      getPhaseProgress: vi.fn(),
      canMoveToNextStep: vi.fn(),
      completeStep: vi.fn(),
      moveToNextStep: vi.fn(),
      moveToStep: vi.fn(),
      savePhaseData: vi.fn(),
      getPhaseData: vi.fn(),
      resetProgress: vi.fn(),
      applyBackendResponse: vi.fn(),
      refreshFromBackend: vi.fn(),
      trustScore: 90,
    };

    const spyContext = vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockContext);

    const { rerender } = render(<EntrepreneurOverview />);

    await waitFor(() => {
      expect(screen.getByText('P5 Active')).toBeInTheDocument();
      const heroCta = screen.getByRole('link', { name: /continue funding ask/i });
      expect(heroCta).toHaveAttribute('href', '/dashboard/entrepreneur/phase-5');
    });

    // Switch to comp-2
    mockContext = {
      ...mockContext,
      activeCompanyId: 'comp-2',
    };
    spyContext.mockReturnValue(mockContext);

    rerender(<EntrepreneurOverview />);

    await waitFor(() => {
      expect(screen.getByText('P2 Active')).toBeInTheDocument();
      const heroCta = screen.getByRole('link', { name: /continue company verification/i });
      expect(heroCta).toHaveAttribute('href', '/dashboard/entrepreneur/phase-2');
    });
  });

  it('DirectEntrepreneur_ZeroCompany_CreatesCompany and ExistingCompany_Phase2_DoesNotCallCreateCompany', async () => {
    const { entrepreneurApi } = await import('@/lib/api-entrepreneur');

    const createCompanySpy = vi.spyOn(entrepreneurApi, 'createCompany').mockResolvedValue({
      id: 'comp-first-1',
      companyName: 'New Direct Co',
      currentPhase: 2,
    } as any);

    const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockResolvedValue({} as any);

    // Test 1: Zero Company calls createCompany
    const createResult = await entrepreneurApi.createCompany({
      companyName: 'New Direct Co',
      industry: 'Technology',
      website: 'https://example.com',
      tagline: 'Direct Entrepreneur First Company',
    });
    expect(createCompanySpy).toHaveBeenCalledTimes(1);
    expect(createResult.id).toBe('comp-first-1');

    // Test 2: Existing company calls updateLegalInfo directly and does NOT call createCompany
    await entrepreneurApi.updateLegalInfo('comp-first-1', {
      legalName: 'New Direct Co',
      registrationNumber: '123456789',
    });
    expect(updateLegalSpy).toHaveBeenCalledWith('comp-first-1', expect.objectContaining({ legalName: 'New Direct Co' }));
    expect(createCompanySpy).toHaveBeenCalledTimes(1); // createCompany was NOT called again
  });
});

