import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreatorHumainXQuickStartGuard from '@/components/layout/CreatorHumainXQuickStartGuard';
import HumainXQuickStartPage from '@/app/dashboard/creator/humainx/page';
import {
  isStep1Complete,
  isStep2Complete,
  isStep3Complete,
  isQuickStartComplete,
  getFirstIncompleteStep,
  mapSituationToCanonical,
  mapSituationFromCanonical,
  mapAvailabilityToCanonical,
  mapAvailabilityFromCanonical,
  mapExperienceToCanonical,
  mapExperienceFromCanonical,
  mapProgressPreferenceToCanonical,
  deriveProgressPreference,
  buildSavePayloadFromQuickStart,
  getQuickStartJourneyState,
  saveQuickStartJourneyState,
  resetQuickStartJourneyState,
  resolveTargetQuickStartStep,
  isBackendQuickStartComplete,
} from '@/lib/humainx-quick-start';
import { UserRole } from '@/lib/roles';
import api from '@/lib/axios';
import { creatorProfileApi } from '@/lib/api-creator-profile';

// Mock next/navigation
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
};

let mockPathname = '/dashboard/creator';
let mockSearchParamString = '';

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(mockSearchParamString),
  usePathname: () => mockPathname,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock AuthProvider
let mockAuthUser: any = {
  id: 'usr-creator-1',
  name: 'Test Creator',
  role: UserRole.CREATOR,
  roles: [UserRole.CREATOR],
  onboardingPhase: 1,
};
let mockIsAuthLoading = false;
let mockIsAuthenticated = true;

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isLoading: mockIsAuthLoading,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

// Mock axios and creatorProfileApi
vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn().mockResolvedValue({ data: { success: true } }),
    post: vi.fn(),
  },
}));

vi.mock('@/lib/api-creator-profile', () => ({
  creatorProfileApi: {
    getMyProfile: vi.fn(),
    saveHumainXProfile: vi.fn(),
    getQuickStartStatus: vi.fn(),
    confirmQuickStartStep1: vi.fn().mockResolvedValue({ step1ConfirmedAt: '2026-09-22T12:00:00Z', nextRequiredStep: 2 }),
    confirmQuickStartStep2: vi.fn().mockResolvedValue({ step2ConfirmedAt: '2026-09-22T12:00:00Z', nextRequiredStep: 3 }),
    completeQuickStart: vi.fn().mockResolvedValue({ completed: true, completedAt: '2026-09-22T12:00:00Z' }),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

describe('HumainX Quick Start Completion & Derivation Unit Tests', () => {
  const completeProfile = {
    skills: [
      { name: 'Coding', level: 'Advanced' },
      { name: 'Marketing', level: 'Comfortable' },
    ],
    ventureContext: {
      region: 'Hauts-de-France',
      currentSituation: 'Employed',
      weeklyAvailability: '10–20 hours/week',
      previousEntrepreneurialExperience: 'No, this is my first project',
      learningPreference: 'I want to learn them myself',
      delegationPreference: 'Minimal delegation — self-reliant learning',
    },
  };

  it('Step1_RequiresRegionSituationAndAvailability', () => {
    expect(isStep1Complete(null)).toBe(false);
    expect(isStep1Complete({})).toBe(false);

    // Missing region
    expect(
      isStep1Complete({
        ventureContext: { currentSituation: 'Employed', weeklyAvailability: '10–20 hours/week' },
      })
    ).toBe(false);

    // Missing situation
    expect(
      isStep1Complete({
        ventureContext: { region: 'Hauts-de-France', weeklyAvailability: '10–20 hours/week' },
      })
    ).toBe(false);

    // Missing availability
    expect(
      isStep1Complete({
        ventureContext: { region: 'Hauts-de-France', currentSituation: 'Employed' },
      })
    ).toBe(false);

    // Complete Step 1
    expect(
      isStep1Complete({
        ventureContext: {
          region: 'Hauts-de-France',
          currentSituation: 'Employed',
          weeklyAvailability: '10–20 hours/week',
        },
      })
    ).toBe(true);
  });

  it('Step2_RequiresAtLeastOneSkill', () => {
    expect(isStep2Complete({ skills: [] })).toBe(false);
    expect(isStep2Complete({ skills: [{ name: '', level: 'Beginner' }] })).toBe(false);
    expect(isStep2Complete({ skills: [{ name: 'Sales', level: 'Beginner' }] })).toBe(true);
  });

  it('SkipLink_WithZeroSkills_DoesNotCompleteStep2', () => {
    // Canonical predicate: empty skills never complete Step 2
    expect(isStep2Complete({ skills: [] })).toBe(false);
  });

  it('NoGeneralBusinessFallbackSkillIsPersisted', () => {
    // Verify that payload builder never injects "General Business" if not in data
    const payload = buildSavePayloadFromQuickStart(
      { skills: [], ventureContext: {} },
      { skills: [] }
    );
    expect(payload.skills.some((s: any) => s.name === 'General Business')).toBe(false);
  });

  it('Step2_RequiresLevelForEverySkill', () => {
    // Missing level on one skill
    expect(
      isStep2Complete({
        skills: [
          { name: 'Sales', level: 'Comfortable' },
          { name: 'Coding', level: null },
        ],
      })
    ).toBe(false);

    // Invalid level
    expect(
      isStep2Complete({
        skills: [{ name: 'Sales', level: 'UnknownLevel' }],
      })
    ).toBe(false);

    // Valid levels
    expect(
      isStep2Complete({
        skills: [
          { name: 'Sales', level: 'Beginner' },
          { name: 'Coding', level: 'Comfortable' },
          { name: 'Design', level: 'Advanced' },
        ],
      })
    ).toBe(true);
  });

  it('Step3_RequiresExperienceAndProgressPreference', () => {
    // Missing progress preference
    expect(
      isStep3Complete({
        ventureContext: {
          previousEntrepreneurialExperience: 'No, this is my first project',
          learningPreference: '',
          delegationPreference: '',
        },
      })
    ).toBe(false);

    // Missing experience
    expect(
      isStep3Complete({
        ventureContext: {
          previousEntrepreneurialExperience: '',
          learningPreference: 'I want to learn them myself',
          delegationPreference: 'Minimal delegation',
        },
      })
    ).toBe(false);

    // Complete Step 3
    expect(isStep3Complete(completeProfile)).toBe(true);
  });

  it('MixedPreference_RoundTripsDistinctly', () => {
    const canonical = mapProgressPreferenceToCanonical('A bit of both');
    expect(canonical.learningPreference).toBe('A mix of learning and delegation');
    expect(canonical.delegationPreference).toBe('A mix of learning and delegation');

    const derived = deriveProgressPreference(
      canonical.learningPreference,
      canonical.delegationPreference
    );
    expect(derived).toBe('A bit of both');
  });

  it('HelpMeDecide_RoundTripsDistinctly', () => {
    const canonical = mapProgressPreferenceToCanonical('Help me decide');
    expect(canonical.learningPreference).toBe("I'm not sure — recommend the best option");
    expect(canonical.delegationPreference).toBe("I'm not sure — recommend the best option");

    const derived = deriveProgressPreference(
      canonical.learningPreference,
      canonical.delegationPreference
    );
    expect(derived).toBe('Help me decide');

    // Confirm distinctly separated from "A bit of both"
    expect(derived).not.toBe('A bit of both');
  });

  it('QuickStart_RequiresAllThreeSteps', () => {
    expect(isQuickStartComplete(null)).toBe(false);
    expect(isQuickStartComplete(completeProfile)).toBe(true);
  });

  it('FirstIncompleteStep_IdentifiesStepCorrectly', () => {
    expect(getFirstIncompleteStep(null)).toBe(1);
    expect(getFirstIncompleteStep({})).toBe(1);

    // Step 1 complete, Step 2 incomplete
    const step1Done = {
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
      skills: [],
    };
    expect(getFirstIncompleteStep(step1Done)).toBe(2);

    // Steps 1 & 2 complete, Step 3 incomplete
    const steps1And2Done = {
      ...step1Done,
      skills: [{ name: 'Coding', level: 'Advanced' }],
    };
    expect(getFirstIncompleteStep(steps1And2Done)).toBe(3);

    // All complete
    expect(getFirstIncompleteStep(completeProfile)).toBeNull();
  });

  it('SituationMapping_IsBiDirectionalAndAccurate', () => {
    expect(mapSituationToCanonical('Employed')).toBe('Employed');
    expect(mapSituationToCanonical('Self-employed or freelance')).toBe('Self-employed / Freelance');
    expect(mapSituationToCanonical('Looking for work')).toBe('Looking for work');
    expect(mapSituationToCanonical('Something else')).toBe('Other');

    expect(mapSituationFromCanonical('Self-employed / Freelance')).toBe('Self-employed or freelance');
    expect(mapSituationFromCanonical('Other')).toBe('Something else');
  });

  it('AvailabilityMapping_IsBiDirectionalAndAccurate', () => {
    expect(mapAvailabilityToCanonical('Under 5 hrs')).toBe('Less than 5 hours/week');
    expect(mapAvailabilityToCanonical('10–20 hrs')).toBe('10–20 hours/week');
    expect(mapAvailabilityToCanonical('Full-time')).toBe('Full-time');

    expect(mapAvailabilityFromCanonical('Less than 5 hours/week')).toBe('Under 5 hrs');
    expect(mapAvailabilityFromCanonical('10–20 hours/week')).toBe('10–20 hrs');
  });

  it('ExperienceMapping_IsBiDirectionalAndAccurate', () => {
    expect(mapExperienceToCanonical('This is my first time')).toBe('No, this is my first project');
    expect(mapExperienceToCanonical("I've created a company before")).toBe('I have previously created a company');

    expect(mapExperienceFromCanonical('No, this is my first project')).toBe('This is my first time');
    expect(mapExperienceFromCanonical('I have previously created a company')).toBe("I've created a company before");
  });

  it('BuildSavePayload_PreservesExistingExperiencesAndEducation', () => {
    const existing = {
      experiences: [{ id: 'exp-1', jobTitle: 'Lead Dev', companyName: 'Mondial Corp' }],
      education: [{ id: 'edu-1', institution: 'Sorbonne' }],
      languageProficiencies: [{ id: 'lang-1', language: 'French', proficiency: 'Native' }],
      skills: [{ name: 'TypeScript', level: 'Advanced', source: 'Certified' }],
      ventureContext: { region: 'Île-de-France' },
    };

    const payload = buildSavePayloadFromQuickStart(existing, {
      region: 'Hauts-de-France',
      currentSituation: 'Employed',
      weeklyAvailability: '10–20 hrs',
      skills: [{ name: 'TypeScript', level: 'Advanced' }],
      previousEntrepreneurialExperience: 'This is my first time',
      progressPreference: 'A bit of both',
    });

    expect(payload.experiences[0].jobTitle).toBe('Lead Dev');
    expect(payload.education[0].institution).toBe('Sorbonne');
    expect(payload.languageProficiencies[0].language).toBe('French');
    expect(payload.skills[0].source).toBe('Certified'); // Preserves source
    expect(payload.ventureContext.region).toBe('Hauts-de-France');
  });
});

describe('CreatorHumainXQuickStartGuard Guarding & Role Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.replace.mockClear();
    mockPathname = '/dashboard/creator';
    mockAuthUser = {
      id: 'usr-creator-1',
      name: 'Test Creator',
      role: UserRole.CREATOR,
      roles: [UserRole.CREATOR],
      onboardingPhase: 1,
    };
    mockIsAuthLoading = false;
    mockIsAuthenticated = true;
    localStorage.clear();
  });

  it('CreatorIncompleteQuickStart_IsRedirectedToIncompleteStep', async () => {
    // Backend profile is incomplete: missing state / nextRequiredStep = 1
    const incompleteProfile = {
      quickStart: {
        version: 1,
        step1ConfirmedAt: null,
        step2ConfirmedAt: null,
        step3ConfirmedAt: null,
        completedAt: null,
        completed: false,
        nextRequiredStep: 1,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(incompleteProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div data-testid="dashboard-content">Creator Dashboard Content</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=1');
    });
    expect(screen.queryByTestId('dashboard-content')).toBeNull();
  });

  it('BackendStep1Confirmed_ResumesAtStep2', async () => {
    const step1Profile = {
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-09-22T10:00:00Z',
        step2ConfirmedAt: null,
        step3ConfirmedAt: null,
        completedAt: null,
        completed: false,
        nextRequiredStep: 2,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(step1Profile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div data-testid="dashboard-content">Creator Dashboard Content</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=2');
    });
    expect(screen.queryByTestId('dashboard-content')).toBeNull();
  });

  it('BackendStep2Confirmed_ResumesAtStep3', async () => {
    const step2Profile = {
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-09-22T10:00:00Z',
        step2ConfirmedAt: '2026-09-22T10:05:00Z',
        step3ConfirmedAt: null,
        completedAt: null,
        completed: false,
        nextRequiredStep: 3,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(step2Profile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div data-testid="dashboard-content">Creator Dashboard Content</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=3');
    });
    expect(screen.queryByTestId('dashboard-content')).toBeNull();
  });

  it('DashboardAllowed_WhenBackendCompleted', async () => {
    const completeProfile = {
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-09-22T10:00:00Z',
        step2ConfirmedAt: '2026-09-22T10:05:00Z',
        step3ConfirmedAt: '2026-09-22T10:10:00Z',
        completedAt: '2026-09-22T10:10:00Z',
        completed: true,
        nextRequiredStep: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(completeProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div data-testid="dashboard-content">Creator Dashboard Content</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeDefined();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('BackendCompleted_LocalStorageMissing_AllowsDashboard', async () => {
    // LocalStorage is completely empty
    localStorage.clear();

    const completeProfile = {
      quickStart: {
        version: 1,
        completedAt: '2026-09-22T10:10:00Z',
        completed: true,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(completeProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div data-testid="dashboard-content">Creator Dashboard Content</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeDefined();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('BackendIncomplete_LocalStorageCompleted_BackendWins', async () => {
    // LocalStorage has old/legacy completed state set to true
    saveQuickStartJourneyState(mockAuthUser.id, {
      step1Confirmed: true,
      step2Confirmed: true,
      step3Confirmed: true,
      completed: true,
    });

    // Authoritative backend says FALSE
    const incompleteProfile = {
      quickStart: {
        version: 1,
        completedAt: null,
        completed: false,
        nextRequiredStep: 1,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(incompleteProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div data-testid="dashboard-content">Creator Dashboard Content</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    // BACKEND WINS: User must be redirected to HumainX
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=1');
    });
    expect(screen.queryByTestId('dashboard-content')).toBeNull();
  });

  it('BackendCompleted_LocalStorageFalse_BackendWins', async () => {
    // LocalStorage says incomplete
    saveQuickStartJourneyState(mockAuthUser.id, {
      step1Confirmed: false,
      completed: false,
    });

    // Authoritative backend says TRUE
    const completeProfile = {
      quickStart: {
        version: 1,
        completedAt: '2026-09-22T10:10:00Z',
        completed: true,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(completeProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div data-testid="dashboard-content">Creator Dashboard Content</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    // BACKEND WINS: Dashboard allowed
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeDefined();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('CompletedAt_Exists_ProfileFieldChange_DoesNotReopenQuickStart', async () => {
    // One-time onboarding rule: Once CompletedAt exists, changing/clearing profile fields later
    // never re-triggers the Quick Start screens. Profile completeness is Phase 4's concern.
    const completedProfileMissingSkills = {
      skills: [], // Skills later removed or changed
      ventureContext: {},
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-09-22T10:00:00Z',
        step2ConfirmedAt: '2026-09-22T10:05:00Z',
        step3ConfirmedAt: '2026-09-22T10:10:00Z',
        completedAt: '2026-09-22T10:10:00Z',
        completed: true,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(completedProfileMissingSkills);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div data-testid="dashboard-content">Creator Dashboard Content</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeDefined();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('CompletedCreator_OnHumainXRoute_RedirectsToDashboard', async () => {
    mockPathname = '/dashboard/creator/humainx';

    const completeProfile = {
      quickStart: {
        version: 1,
        completedAt: '2026-09-22T10:10:00Z',
        completed: true,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(completeProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div>HumainX Page</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator');
    });
  });

  it('HumainXRoute_DoesNotRedirectLoop', async () => {
    mockPathname = '/dashboard/creator/humainx';

    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue({
      skills: [],
      ventureContext: {},
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div data-testid="humainx-page-content">HumainX Quick Start Page</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('humainx-page-content')).toBeDefined();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('NonCreator_IsNotAffectedByHumainXQuickStartGuard', async () => {
    mockAuthUser = {
      id: 'usr-inv-1',
      name: 'Test Investor',
      role: UserRole.INVESTOR,
      roles: [UserRole.INVESTOR],
      onboardingPhase: 1,
    };

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div data-testid="investor-content">Investor Workspace</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('investor-content')).toBeDefined();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(creatorProfileApi.getMyProfile).not.toHaveBeenCalled();
  });

  it('RoleIsolation_Entrepreneur_IsUnaffected', async () => {
    mockAuthUser = {
      id: 'usr-ent-1',
      name: 'Test Entrepreneur',
      role: UserRole.ENTREPRENEUR,
      roles: [UserRole.ENTREPRENEUR],
      onboardingPhase: 1,
    };

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div data-testid="entrepreneur-content">Entrepreneur Workspace</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('entrepreneur-content')).toBeDefined();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('RoleIsolation_ServiceProvider_IsUnaffected', async () => {
    mockAuthUser = {
      id: 'usr-sp-1',
      name: 'Test SP',
      role: UserRole.SERVICE_PROVIDER,
      roles: [UserRole.SERVICE_PROVIDER],
      onboardingPhase: 1,
    };

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreatorHumainXQuickStartGuard>
          <div data-testid="sp-content">Service Provider Workspace</div>
        </CreatorHumainXQuickStartGuard>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('sp-content')).toBeDefined();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});

describe('HumainX 3-Screen Flow Interactive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.replace.mockClear();
    mockPathname = '/dashboard/creator/humainx';
    mockSearchParamString = 'step=1';
    mockAuthUser = {
      id: 'usr-creator-1',
      name: 'Test Creator',
      role: UserRole.CREATOR,
      roles: [UserRole.CREATOR],
      onboardingPhase: 1,
    };
    mockIsAuthLoading = false;
    mockIsAuthenticated = true;
    vi.mocked(api.put).mockResolvedValue({ data: { success: true } });
    localStorage.clear();
  });

  it('ExistingProfileData_PrepopulatesStep1', async () => {
    const existingProfile = {
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(existingProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('region-badge')).toBeDefined();
    });

    const select = screen.getByLabelText('Your region') as HTMLSelectElement;
    expect(select.value).toBe('Hauts-de-France');
  });

  it('UnverifiedRegion_DoesNotShowVerifiedSemantic', async () => {
    const unverifiedProfile = {
      ventureContext: {
        region: 'Hauts-de-France',
        territoryVerified: false,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(unverifiedProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const badge = await screen.findByTestId('region-badge');
    expect(badge.getAttribute('data-verified')).toBe('false');
    expect(screen.getByText('Selected region')).toBeDefined();
    expect(screen.queryByText('Territory Verified')).toBeNull();
  });

  it('VerifiedRegion_ShowsVerifiedSemantic', async () => {
    const verifiedProfile = {
      ventureContext: {
        region: 'Hauts-de-France',
        territoryVerified: true,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(verifiedProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const badge = await screen.findByTestId('region-badge');
    expect(badge.getAttribute('data-verified')).toBe('true');
    expect(screen.getByText('Territory Verified')).toBeDefined();
  });

  it('DirectStep3_WhenStep1Incomplete_NormalizesToStep1', async () => {
    mockSearchParamString = 'step=3';
    // Profile is empty (Step 1 incomplete)
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue({
      skills: [],
      ventureContext: {},
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=1');
    });
  });

  it('DirectStep3_WhenStep2Incomplete_NormalizesToStep2', async () => {
    mockSearchParamString = 'step=3';
    // User already completed/confirmed Step 1 in journey
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true });

    // Step 1 is done, but Step 2 (skills) is incomplete
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue({
      skills: [],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: null,
        completedAt: null,
      },
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=2');
    });
  });

  it('InvalidStepQuery_NormalizesSafely', async () => {
    mockSearchParamString = 'step=invalidParam99';
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue({
      skills: [],
      ventureContext: {},
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=1');
    });
  });

  it('Step1_SaveFailure_DoesNotAdvance', async () => {
    mockSearchParamString = 'step=1';
    const existingProfile = {
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(existingProfile);
    // Mock save failure
    vi.mocked(api.put).mockRejectedValue(new Error('Network error on Step 1'));

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const continueBtn = await screen.findByRole('button', { name: /Continue/i });
    expect(continueBtn).toBeDefined();

    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalled();
    });

    // Crucial: Must NOT navigate to step 2 when save failed
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/dashboard/creator/humainx?step=2');
  });

  it('SkipLink_DoesNotInjectSyntheticSkill', async () => {
    mockSearchParamString = 'step=2';
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true });

    const profileOnStep2 = {
      skills: [],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: null,
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profileOnStep2);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const skipBtn = await screen.findByText("I'll add these later");
    fireEvent.click(skipBtn);

    // Expect validation message to show, but NO fake skills injected and NO navigation to step 3
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
    expect(screen.queryByText('General Business')).toBeNull();
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/dashboard/creator/humainx?step=3');
  });

  it('Step2_SaveFailure_DoesNotAdvance', async () => {
    mockSearchParamString = 'step=2';
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true });

    const profileOnStep2 = {
      skills: [{ name: 'Coding', level: 'Advanced' }],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: null,
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profileOnStep2);
    vi.mocked(api.put).mockRejectedValue(new Error('Network error on Step 2'));

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const continueBtn = await screen.findByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalled();
    });

    // Crucial: Must NOT navigate to step 3 when save failed
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/dashboard/creator/humainx?step=3');
  });

  it('Autosave_PersistsChangedSituation', async () => {
    const existingProfile = {
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(existingProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    // Wait for hydration
    await waitFor(() => {
      expect(screen.getByText('Looking for work')).toBeDefined();
    });

    // Select "Looking for work"
    fireEvent.click(screen.getByText('Looking for work'));

    // Wait for debounced autosave to trigger PUT
    await waitFor(
      () => {
        expect(api.put).toHaveBeenCalledWith(
          '/profile/me',
          expect.objectContaining({
            ventureContext: expect.objectContaining({
              currentSituation: 'Looking for work',
            }),
          })
        );
      },
      { timeout: 2500 }
    );
  });

  it('Autosave_PersistsAvailability', async () => {
    const existingProfile = {
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(existingProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('20–30 hrs')).toBeDefined();
    });

    // Click "20–30 hrs"
    fireEvent.click(screen.getByText('20–30 hrs'));

    await waitFor(
      () => {
        expect(api.put).toHaveBeenCalledWith(
          '/profile/me',
          expect.objectContaining({
            ventureContext: expect.objectContaining({
              weeklyAvailability: '20–30 hours/week',
            }),
          })
        );
      },
      { timeout: 2500 }
    );
  });

  it('Autosave_PersistsSkillLevel', async () => {
    mockSearchParamString = 'step=2';
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true });

    const existingProfile = {
      skills: [{ name: 'Coding', level: 'Comfortable' }],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: null,
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(existingProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Beginner' })).toBeDefined();
    });

    // Click Beginner level
    fireEvent.click(screen.getByRole('radio', { name: 'Beginner' }));

    await waitFor(
      () => {
        expect(api.put).toHaveBeenCalledWith(
          '/profile/me',
          expect.objectContaining({
            skills: expect.arrayContaining([
              expect.objectContaining({ name: 'Coding', level: 'Beginner' }),
            ]),
          })
        );
      },
      { timeout: 2500 }
    );
  });

  it('Autosave_Error_ShowsFailureState', async () => {
    const existingProfile = {
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(existingProfile);
    vi.mocked(api.put).mockRejectedValue(new Error('Network error on autosave'));

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Looking for work')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Looking for work'));

    await waitFor(
      () => {
        expect(screen.getByText('Couldn’t save — try again')).toBeDefined();
      },
      { timeout: 2500 }
    );
  });

  it('Autosave_StaleResponseDoesNotOverwriteNewerState', async () => {
    const existingProfile = {
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(existingProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Student')).toBeDefined();
      expect(screen.getByText('In training')).toBeDefined();
    });

    // Click Student, then quickly click In training
    fireEvent.click(screen.getByText('Student'));
    fireEvent.click(screen.getByText('In training'));

    // Wait for final debounce save
    await waitFor(
      () => {
        expect(api.put).toHaveBeenCalledWith(
          '/profile/me',
          expect.objectContaining({
            ventureContext: expect.objectContaining({
              currentSituation: 'In training',
            }),
          })
        );
      },
      { timeout: 2500 }
    );
  });

  it('ExistingSkills_PrepopulateStep2', async () => {
    mockSearchParamString = 'step=2';
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true });

    const existingProfile = {
      skills: [
        { name: 'Coding', level: 'Advanced' },
        { name: 'Marketing', level: 'Comfortable' },
      ],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: null,
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(existingProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Coding').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Marketing').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Your selected skills \(2\)/i)).toBeDefined();
    });
  });

  it('FinalSubmit_PersistsBeforeDashboardRedirect', async () => {
    mockSearchParamString = 'step=3';
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true, step2Confirmed: true });

    const profileOnStep3 = {
      skills: [{ name: 'Coding', level: 'Advanced' }],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
        previousEntrepreneurialExperience: 'No, this is my first project',
        learningPreference: 'I want to learn them myself',
        delegationPreference: 'Minimal delegation — self-reliant learning',
      },
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: '2026-03-01T10:05:00Z',
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profileOnStep3);
    vi.mocked(api.put).mockResolvedValue({ data: { success: true } });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const submitBtn = await screen.findByRole('button', { name: /Start my project/i });
    expect(submitBtn).toBeDefined();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/profile/me', expect.anything());
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator');
    });

    expect(creatorProfileApi.completeQuickStart).toHaveBeenCalled();
  });

  it('FinalSaveFailure_DoesNotUnlockDashboard', async () => {
    mockSearchParamString = 'step=3';
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true, step2Confirmed: true });

    const profileOnStep3 = {
      skills: [{ name: 'Coding', level: 'Advanced' }],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
        previousEntrepreneurialExperience: 'No, this is my first project',
        learningPreference: 'I want to learn them myself',
        delegationPreference: 'Minimal delegation',
      },
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: '2026-03-01T10:05:00Z',
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profileOnStep3);
    vi.mocked(api.put).mockRejectedValue(new Error('Network error'));

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const submitBtn = await screen.findByRole('button', { name: /Start my project/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
    // Crucial: Must NOT navigate to dashboard if persistence failed
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/dashboard/creator');
    expect(creatorProfileApi.completeQuickStart).not.toHaveBeenCalled();
  });

  it('Step1Completion_DoesNotRedirectToDashboard', async () => {
    mockSearchParamString = 'step=1';
    const profile = {
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
      skills: [],
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profile);
    vi.mocked(api.put).mockResolvedValue({ data: { success: true } });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const continueBtn = await screen.findByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      // Must advance ONLY to step 2, NEVER to /dashboard/creator
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=2');
      expect(mockRouter.replace).not.toHaveBeenCalledWith('/dashboard/creator');
    });

    expect(creatorProfileApi.confirmQuickStartStep1).toHaveBeenCalled();
  });

  it('Step1Completion_WithPreexistingStep2And3Data_StillShowsStep2', async () => {
    mockSearchParamString = 'step=1';
    // User already has skills and step 3 data, so isQuickStartComplete is ALREADY true
    const completeProfile = {
      skills: [{ name: 'Coding', level: 'Advanced' }],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
        previousEntrepreneurialExperience: 'No, this is my first project',
        learningPreference: 'I want to learn them myself',
        delegationPreference: 'Minimal delegation',
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(completeProfile);
    vi.mocked(api.put).mockResolvedValue({ data: { success: true } });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const continueBtn = await screen.findByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      // CRUCIAL BUG FIX VERIFICATION:
      // Even though profile is 100% complete, Step 1 completion MUST navigate to step 2, NOT to /dashboard/creator
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=2');
      expect(mockRouter.replace).not.toHaveBeenCalledWith('/dashboard/creator');
    });
  });

  it('Step2Completion_DoesNotRedirectToDashboard', async () => {
    mockSearchParamString = 'step=2';
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true });

    const profile = {
      skills: [{ name: 'Coding', level: 'Advanced' }],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: null,
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profile);
    vi.mocked(api.put).mockResolvedValue({ data: { success: true } });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const continueBtn = await screen.findByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      // Must advance ONLY to step 3, NEVER to /dashboard/creator
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=3');
      expect(mockRouter.replace).not.toHaveBeenCalledWith('/dashboard/creator');
    });

    expect(creatorProfileApi.confirmQuickStartStep2).toHaveBeenCalled();
  });

  it('Step2Completion_WithPreexistingStep3Data_StillShowsStep3', async () => {
    mockSearchParamString = 'step=2';
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true });

    const completeProfile = {
      skills: [{ name: 'Coding', level: 'Advanced' }],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
        previousEntrepreneurialExperience: 'No, this is my first project',
        learningPreference: 'I want to learn them myself',
        delegationPreference: 'Minimal delegation',
      },
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: null,
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(completeProfile);
    vi.mocked(api.put).mockResolvedValue({ data: { success: true } });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const continueBtn = await screen.findByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      // Must advance to step 3, NOT to /dashboard/creator
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=3');
      expect(mockRouter.replace).not.toHaveBeenCalledWith('/dashboard/creator');
    });
  });

  it('OnlyStartMyProject_CanCompleteQuickStartJourney', async () => {
    mockSearchParamString = 'step=3';
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true, step2Confirmed: true });

    const profile = {
      skills: [{ name: 'Coding', level: 'Advanced' }],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
        previousEntrepreneurialExperience: 'No, this is my first project',
        learningPreference: 'I want to learn them myself',
        delegationPreference: 'Minimal delegation',
      },
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: '2026-03-01T10:05:00Z',
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profile);
    vi.mocked(api.put).mockResolvedValue({ data: { success: true } });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    expect(creatorProfileApi.completeQuickStart).not.toHaveBeenCalled();

    const submitBtn = await screen.findByRole('button', { name: /Start my project/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator');
      expect(creatorProfileApi.completeQuickStart).toHaveBeenCalled();
    });
  });

  it('Step3Autosave_DoesNotCompleteJourney', async () => {
    mockSearchParamString = 'step=3';
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true, step2Confirmed: true });

    const profile = {
      skills: [{ name: 'Coding', level: 'Advanced' }],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
        previousEntrepreneurialExperience: 'No, this is my first project',
        learningPreference: 'I want to learn them myself',
        delegationPreference: 'Minimal delegation',
      },
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: '2026-03-01T10:05:00Z',
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profile);
    vi.mocked(api.put).mockResolvedValue({ data: { success: true } });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const learnPrefCard = await screen.findByText("I'd rather learn it");
    fireEvent.click(learnPrefCard);

    // Autosave triggers PUT
    await waitFor(
      () => {
        expect(api.put).toHaveBeenCalled();
      },
      { timeout: 2500 }
    );

    // CRUCIAL: Autosave does NOT complete journey or redirect to dashboard!
    expect(creatorProfileApi.completeQuickStart).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/dashboard/creator');
  });

  it('ReloadAfterStep1_ResumesStep2', async () => {
    mockSearchParamString = ''; // no ?step query
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true, step2Confirmed: false });

    const profile = {
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
      skills: [],
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: null,
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=2');
    });
  });

  it('ReloadAfterStep2_ResumesStep3', async () => {
    mockSearchParamString = ''; // no ?step query
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true, step2Confirmed: true });

    const profile = {
      skills: [{ name: 'Coding', level: 'Advanced' }],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: '2026-03-01T10:05:00Z',
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=3');
    });
  });

  it('DirectStep3_BeforeStep1Confirmation_NormalizesToStep1', async () => {
    mockSearchParamString = 'step=3';
    // User hasn't confirmed step 1
    resetQuickStartJourneyState('usr-creator-1');

    const profile = {
      skills: [],
      ventureContext: {},
      quickStart: {
        version: 1,
        step1ConfirmedAt: null,
        step2ConfirmedAt: null,
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=1');
    });
  });

  it('DirectStep3_BeforeStep2Confirmation_NormalizesToStep2', async () => {
    mockSearchParamString = 'step=3';
    // User confirmed step 1, but NOT step 2
    saveQuickStartJourneyState('usr-creator-1', { step1Confirmed: true, step2Confirmed: false });

    const profile = {
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
      skills: [],
      quickStart: {
        version: 1,
        step1ConfirmedAt: '2026-03-01T10:00:00Z',
        step2ConfirmedAt: null,
        completedAt: null,
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/creator/humainx?step=2');
    });
  });

  it('JourneyState_IsScopedPerCreatorUser', () => {
    saveQuickStartJourneyState('user-A', { step1Confirmed: true, step2Confirmed: true, step3Confirmed: true, completed: true });
    const stateA = getQuickStartJourneyState('user-A');
    expect(stateA.completed).toBe(true);

    const stateB = getQuickStartJourneyState('user-B');
    expect(stateB.step1Confirmed).toBe(false);
    expect(stateB.step2Confirmed).toBe(false);
    expect(stateB.completed).toBe(false);

    // Canonical backend authority is independent of local storage
    expect(isBackendQuickStartComplete({ quickStart: { completed: true } })).toBe(true);
    expect(isBackendQuickStartComplete({ quickStart: { completed: false } })).toBe(false);
  });

  it('SaveFailure_DoesNotMarkStepConfirmed', async () => {
    mockSearchParamString = 'step=1';
    const profile = {
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
      },
      skills: [],
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(profile);
    vi.mocked(api.put).mockRejectedValue(new Error('Network failure'));

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    const continueBtn = await screen.findByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalled();
    });

    expect(creatorProfileApi.confirmQuickStartStep1).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/dashboard/creator/humainx?step=2');
  });

  it('ExistingProfileData_PrepopulatesWithoutSkippingScreens', async () => {
    mockSearchParamString = 'step=1';
    const completeProfile = {
      skills: [{ name: 'Coding', level: 'Advanced' }],
      ventureContext: {
        region: 'Hauts-de-France',
        currentSituation: 'Employed',
        weeklyAvailability: '10–20 hours/week',
        previousEntrepreneurialExperience: 'No, this is my first project',
        learningPreference: 'I want to learn them myself',
        delegationPreference: 'Minimal delegation',
      },
    };
    vi.mocked(creatorProfileApi.getMyProfile).mockResolvedValue(completeProfile);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXQuickStartPage />
      </QueryClientProvider>
    );

    // Verify Step 1 is rendered and not bypassed
    const regionSelect = await screen.findByLabelText('Your region') as HTMLSelectElement;
    expect(regionSelect.value).toBe('Hauts-de-France');
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/dashboard/creator');
  });
});
