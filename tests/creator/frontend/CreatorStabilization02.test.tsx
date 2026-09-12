import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/creator',
}));

// Mock AuthProvider
vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'usr-42', name: 'Dr. Sarah Connor', email: 'sarah@skynet-defense.org', role: 'Creator' },
    logout: vi.fn(),
    isAuthenticated: true,
  }),
}));

// Mock CreatorProgressProvider
const mockCreatorProgressState = {
  activeIdeaId: 'idea-1',
  journeyState: {
    phase1: { status: 'completed' as const, currentStep: 1, completedSteps: [1] },
    phase2: {
      status: 'completed' as const,
      currentStep: 1,
      completedSteps: [1],
      selectedEntryPath: null,
      clarifierSessionId: null,
      chatMessages: [],
      discoveryInputs: undefined,
      generatedConcepts: undefined,
      selectedConceptId: null,
    },
    phase3: { status: 'in_progress' as const, currentStep: 1, completedSteps: [] },
    phase4: { status: 'locked' as const, currentStep: 1, completedSteps: [] },
    phase5: { status: 'locked' as const, currentStep: 1, completedSteps: [], selectedPath: null },
    phase6: { status: 'locked' as const, currentStep: 1, completedSteps: [] },
  },
  dashboardStats: { activeIdeasCount: 1, inProgressCount: 1, completedCount: 0, totalEarned: 0 },
  project: {
    exists: true,
    projectId: 'idea-1',
    name: 'Cyberdyne Defense System',
    concept: 'Autonomous cyber security intelligence network.',
    currentVersion: 1,
    branding: {
      palette: ['#000', '#fff'],
      selectedLogo: 1,
    },
  },
  outputs: {
    businessPlanVersions: [] as Array<{ id: string; version: number; createdAt: string }>,
    financialForecastVersions: [] as Array<{ id: string; version: number; createdAt: string }>,
  },
};

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    state: mockCreatorProgressState,
    advancePhase: vi.fn(),
    setCrossroadsPath: vi.fn(),
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

// Mock axios
const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
vi.mock('@/lib/axios', () => ({
  default: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('@/lib/api-creator-documents', () => ({
  creatorDocumentsApi: {
    list: vi.fn().mockResolvedValue([]),
  },
}));

// Imports for the tested pages
import CreatorProfileRedirect from '@/app/dashboard/creator/profile/page';
import CreatorProfileIdRedirect from '@/app/dashboard/creator/profile/[id]/page';
import IpVaultRedirect from '@/app/dashboard/creator/ip-vault/page';
import HireProvidersRedirect from '@/app/dashboard/creator/hire-providers/page';
import CreatorMarketplaceRedirect from '@/app/dashboard/creator/marketplace/page';
import SettingsPage from '@/app/dashboard/creator/settings/page';
import ProjectStudioPage from '@/app/dashboard/creator/project-studio/page';
import CreatorDashboard from '@/app/dashboard/creator/page';

describe('Creator Stabilization 02 — Route Redirects Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. /dashboard/creator/profile redirects to /dashboard/profile', () => {
    CreatorProfileRedirect();
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard/profile');
  });

  it('2. /dashboard/creator/profile/[id] redirects to /profile/[id]', async () => {
    await CreatorProfileIdRedirect({ params: Promise.resolve({ id: 'user-777' }) });
    expect(mockRedirect).toHaveBeenCalledWith('/profile/user-777');
  });

  it('3. /dashboard/creator/ip-vault redirects to /dashboard/creator/documents', () => {
    IpVaultRedirect();
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard/creator/documents');
  });

  it('4. /dashboard/creator/hire-providers redirects to /marketplace/services with query preserved', async () => {
    await HireProvidersRedirect({
      searchParams: Promise.resolve({ tag: 'branding', sort: 'rating' }),
    });
    expect(mockRedirect).toHaveBeenCalledWith('/marketplace/services?tag=branding&sort=rating');
  });

  it('5. /dashboard/creator/marketplace redirects to /marketplace/projects with query preserved', async () => {
    await CreatorMarketplaceRedirect({
      searchParams: Promise.resolve({ sector: 'Fintech' }),
    });
    expect(mockRedirect).toHaveBeenCalledWith('/marketplace/projects?sector=Fintech');
  });
});

describe('Creator Stabilization 02 — Settings Real Data & Mock Removal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 'usr-42',
          name: 'Dr. Sarah Connor',
          email: 'sarah@skynet-defense.org',
          phoneNumber: '+1-555-0199',
          createdAt: '2026-01-15T00:00:00.000Z',
        },
      },
    });
  });

  it('6. Settings loads real account info from /auth/account and contains no hardcoded Mathen Jefer', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Dr. Sarah Connor')).toBeDefined();
      expect(screen.getByText('sarah@skynet-defense.org')).toBeDefined();
      expect(screen.getByText('January 2026')).toBeDefined();
    });

    expect(screen.queryByText('Mathen Jefer')).toBeNull();
    expect(screen.queryByText('Alex')).toBeNull();
    expect(screen.getByText(/Edit Universal Profile/i)).toBeDefined();
  });

  it('7. Settings link to Universal Profile points to /dashboard/profile/edit', async () => {
    render(<SettingsPage />);

    const link = screen.getByRole('link', { name: /Edit Universal Profile/i });
    expect(link.getAttribute('href')).toBe('/dashboard/profile/edit');
  });
});

describe('Creator Stabilization 02 — Project Studio Truthful State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatorProgressState.outputs.businessPlanVersions = [];
    mockCreatorProgressState.outputs.financialForecastVersions = [];
  });

  it('8. Project Studio displays truthful empty state when no output versions exist and no fake June 2026 data', () => {
    render(<ProjectStudioPage />);

    expect(screen.getByText('No saved versions yet.')).toBeDefined();
    expect(screen.queryByText('June 10, 2026')).toBeNull();
    expect(screen.queryByText('Initial concept draft generated')).toBeNull();
  });

  it('9. Project Studio renders real versions when outputs exist', () => {
    mockCreatorProgressState.outputs.businessPlanVersions = [
      { id: 'bp-1', version: 1, createdAt: '2026-09-01T12:00:00.000Z' },
    ];

    render(<ProjectStudioPage />);

    expect(screen.getByText('Business Plan v1')).toBeDefined();
    expect(screen.queryByText('No saved versions yet.')).toBeNull();
  });
});

describe('Creator Stabilization 02 — Dashboard Reset Progress Button Removal', () => {
  it('10. Production Creator Dashboard does NOT render the developer Reset Progress button', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CreatorDashboard />
      </QueryClientProvider>
    );

    expect(screen.queryByText('Reset Progress')).toBeNull();
  });
});
