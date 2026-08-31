import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileView } from '@/components/serviceprovider/profile/ProfileView';
import { ProfileEditorWorkspace } from '@/components/serviceprovider/profile/editor/ProfileEditorWorkspace';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as profileHooks from '@/hooks/queries/universal-profile';
import * as spHooks from '@/hooks/queries/service-provider';

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'u-1', name: 'Alex Creator', email: 'alex@example.com', role: 'Creator' },
  }),
}));

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/hooks/queries/analytics', () => ({
  useProviderOverview: () => ({ data: null, isLoading: false }),
}));

vi.mock('@/hooks/queries/service-catalog', () => ({
  useServiceListings: () => ({ data: [], isLoading: false }),
  useCapacity: () => ({ data: null, isLoading: false }),
}));

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('Universal Profile System — Master UI and Editor', () => {
  it('renders common ProfileView with avatar, cover, name, headline, experience, education, skills, and overview', () => {
    vi.spyOn(profileHooks, 'useProfile').mockReturnValue({
      data: {
        providerId: 'u-1',
        headline: 'Creative Director & Digital Artist',
        bio: 'Over 10 years of creative experience building media projects.',
        skills: ['UI/UX', 'Illustration', '3D Modeling'],
        languages: ['English', 'French'],
        languageProficiencies: [
          { id: '1', language: 'English', proficiency: 'Native' },
          { id: '2', language: 'French', proficiency: 'Fluent' },
        ],
        experiences: [
          {
            id: 'exp-1',
            jobTitle: 'Lead Designer',
            companyName: 'Studio Vertex',
            startDate: '2020-01-01',
            isCurrent: true,
            description: 'Leading creative team',
          },
        ],
        education: [
          {
            id: 'edu-1',
            institution: 'Design Academy',
            degree: 'Bachelor of Fine Arts',
            startYear: 2015,
            endYear: 2019,
          },
        ],
        portfolioItems: [],
        credentials: [],
        verificationStatus: 'NotSubmitted',
        currentPhase: 1,
        industries: ['Media', 'Tech'],
        pricingModels: [],
        serviceCategories: [],
        trustScore: 85,
        trustBreakdown: {} as any,
        hasEnoughTrustData: false,
        skillsTestAttempts: [],
        maximumConcurrentOrders: 5,
        currentActiveOrders: 0,
        newOrderAvailability: true,
        manualApprovalWhenCapacityLow: false,
        financialSettings: {} as any,
        profileVersion: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      isLoading: false,
    } as any);

    vi.spyOn(spHooks, 'useServiceProviderTrust').mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    render(<ProfileView mode="owner" />, { wrapper: createWrapper() });

    expect(screen.getByText('Alex Creator')).toBeInTheDocument();
    expect(screen.getByText('Creative Director & Digital Artist')).toBeInTheDocument();
    expect(screen.getByText('Lead Designer')).toBeInTheDocument();
    expect(screen.getByText('Studio Vertex')).toBeInTheDocument();
    expect(screen.getByText('Bachelor of Fine Arts')).toBeInTheDocument();
    expect(screen.getByText('Design Academy')).toBeInTheDocument();
    expect(screen.getByText('UI/UX')).toBeInTheDocument();
    expect(screen.getByText('Illustration')).toBeInTheDocument();
  });

  it('renders master ProfileEditorWorkspace with 4-step wizard structure', () => {
    vi.spyOn(profileHooks, 'useProfile').mockReturnValue({
      data: {
        headline: 'Creative Director',
        bio: 'Bio text',
      },
      isLoading: false,
    } as any);

    vi.spyOn(profileHooks, 'useProfileEditorDraft').mockReturnValue({
      data: {
        headline: 'Creative Director',
        bio: 'Bio text',
        experiences: [],
        education: [],
        skills: [],
        languages: [],
        credentials: [],
        lastStep: 1,
      },
      isLoading: false,
    } as any);

    vi.spyOn(profileHooks, 'useSaveProfileDraft').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(profileHooks, 'useSubmitProfileEditor').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    render(<ProfileEditorWorkspace />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /Identity & Overview/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Step 1 of 4/i).length).toBeGreaterThan(0);
  });

  it('renders ProfileView for ServiceProvider when profile is a pure UniversalProfileResponseDto without crashing', () => {
    vi.spyOn(profileHooks, 'useProfile').mockReturnValue({
      data: {
        userId: 'sp-1',
        name: 'Jane ServiceProvider',
        headline: 'Full-Stack Specialist',
        bio: 'Building enterprise cloud architectures.',
        skills: ['React', 'Node.js', '.NET'],
        experiences: [
          {
            id: 'exp-1',
            jobTitle: 'Senior Engineer',
            companyName: 'Tech Innovators',
            startDate: '2021-01-01',
            isCurrent: true,
            description: 'Leading platform engineering',
          },
        ],
        education: [
          {
            id: 'edu-1',
            institution: 'Tech University',
            degree: 'BSc Computer Science',
            startYear: 2014,
            endYear: 2018,
          },
        ],
        languageProficiencies: [{ id: '1', language: 'English', proficiency: 'Native' }],
        roles: ['ServiceProvider'],
        // Note: portfolioItems, credentials, trustScore, hasEnoughTrustData, verificationStatus are undefined on universal DTO
      },
      isLoading: false,
    } as any);

    vi.spyOn(spHooks, 'useServiceProviderProfile').mockReturnValue({
      data: {
        portfolioItems: [],
        credentials: [],
        verificationStatus: 'Verified',
        providerTier: 2,
        trustScore: 92,
        hasEnoughTrustData: true,
      } as any,
      isLoading: false,
    } as any);

    vi.spyOn(spHooks, 'useServiceProviderTrust').mockReturnValue({
      data: {
        trustScore: 92,
        hasEnoughData: true,
        tierLevel: 2,
      } as any,
      isLoading: false,
    } as any);

    render(<ProfileView mode="owner" />, { wrapper: createWrapper() });

    expect(screen.getByText('Jane ServiceProvider')).toBeInTheDocument();
    expect(screen.getByText('Full-Stack Specialist')).toBeInTheDocument();
    expect(screen.getByText('Tier 2')).toBeInTheDocument();
    expect(screen.getByText('Mondial Score')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Credentials')).toBeInTheDocument();
    // For ServiceProvider, Trust & Skills tab is visible
    expect(screen.getByText('Trust & Skills')).toBeInTheDocument();
  });

  it('hides Trust & Skills tab for non-ServiceProvider roles (Creator, Entrepreneur, Investor)', () => {
    const nonSpRoles = ['Creator', 'Entrepreneur', 'Investor'];

    for (const role of nonSpRoles) {
      vi.spyOn(profileHooks, 'useProfile').mockReturnValue({
        data: {
          userId: 'user-1',
          name: `Test ${role}`,
          headline: `${role} Professional`,
          roles: [role],
        },
        isLoading: false,
      } as any);

      const trustSpy = vi.spyOn(spHooks, 'useServiceProviderTrust').mockReturnValue({
        data: null,
        isLoading: false,
      } as any);

      const spProfileSpy = vi.spyOn(spHooks, 'useServiceProviderProfile').mockReturnValue({
        data: null,
        isLoading: false,
      } as any);

      const { unmount } = render(<ProfileView mode="owner" />, { wrapper: createWrapper() });

      expect(screen.queryByText('Trust & Skills')).not.toBeInTheDocument();
      // Verifying SP queries are not enabled for non-SP
      expect(trustSpy).toHaveBeenLastCalledWith(false);
      expect(spProfileSpy).toHaveBeenLastCalledWith(false);

      unmount();
    }
  });

  it('shows Trust & Skills tab for multi-role user containing ServiceProvider', () => {
    vi.spyOn(profileHooks, 'useProfile').mockReturnValue({
      data: {
        userId: 'user-multi',
        name: 'Multi Role User',
        headline: 'Creator and Service Provider',
        roles: ['Creator', 'ServiceProvider'],
      },
      isLoading: false,
    } as any);

    vi.spyOn(spHooks, 'useServiceProviderTrust').mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    render(<ProfileView mode="owner" />, { wrapper: createWrapper() });

    expect(screen.getByText('Trust & Skills')).toBeInTheDocument();
  });

  it('redirects / normalizes URL when non-ServiceProvider accesses ?view=trust and falls back to normal profile', () => {
    mockSearchParams = new URLSearchParams('view=trust');
    mockReplace.mockClear();

    vi.spyOn(profileHooks, 'useProfile').mockReturnValue({
      data: {
        userId: 'creator-1',
        name: 'Alex Creator',
        headline: 'Creative Specialist',
        roles: ['Creator'],
      },
      isLoading: false,
    } as any);

    render(<ProfileView mode="owner" />, { wrapper: createWrapper() });

    // Trust & Skills UI should NOT be rendered
    expect(screen.queryByText('Verify your completed profile first')).not.toBeInTheDocument();
    expect(screen.queryByText('Trust & reputation')).not.toBeInTheDocument();
    // Default profile is rendered
    expect(screen.getByText('Alex Creator')).toBeInTheDocument();
    // URL normalized back to /dashboard/profile
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/profile');
    mockSearchParams = new URLSearchParams('');
  });

  it('renders public profile with ServiceProviderExtension data including services, credentials, portfolio, and ratings', () => {
    const publicData = {
      userId: 'sp-public-1',
      name: 'Yanis Rahman',
      slug: 'yanis-rahman',
      headline: 'Principal Cloud Architect',
      roles: ['ServiceProvider'],
      serviceProviderExtension: {
        providerTier: 'Tier2',
        verificationStatus: 'Verified',
        trustScore: 94,
        hasEnoughTrustData: true,
        publishedServices: [
          {
            id: 'srv-1',
            title: 'AWS Cloud Architecture Audit',
            category: 'DevOps & Cloud',
            startingPrice: 2500,
            currency: 'EUR',
            pricingModel: 'Fixed',
            status: 'Published',
          },
        ],
        portfolioItems: [
          {
            id: 'port-1',
            title: 'Global Fintech Cloud Migration',
            description: 'Migrated 50+ microservices to Kubernetes',
          },
        ],
        verifiedCredentials: [
          {
            id: 'cred-1',
            title: 'AWS Certified Solutions Architect - Professional',
            issuingOrganization: 'Amazon Web Services',
            status: 'Verified',
          },
        ],
        ratingSummary: {
          averageRating: 4.9,
          totalReviews: 18,
        },
      },
    };

    render(<ProfileView mode="public" profile={publicData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Yanis Rahman')).toBeInTheDocument();
    expect(screen.getByText('AWS Cloud Architecture Audit')).toBeInTheDocument();
    expect(screen.getByText(/From €2500 · Fixed/i)).toBeInTheDocument();
    expect(screen.getByText('Global Fintech Cloud Migration')).toBeInTheDocument();
    expect(screen.getByText('AWS Certified Solutions Architect - Professional')).toBeInTheDocument();
    expect(screen.getByText('Amazon Web Services')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('(18 reviews)')).toBeInTheDocument();
    expect(screen.getByText('94')).toBeInTheDocument();
  });

  it('renders role extensions for Creator, Entrepreneur, and Investor profiles', () => {
    const multiRoleData = {
      userId: 'poly-1',
      name: 'Elena Rostova',
      slug: 'elena-rostova',
      headline: 'Tech Founder & Angel Investor',
      roles: ['Entrepreneur', 'Investor', 'Creator'],
      creatorExtension: {
        publishedProjectsCount: 12,
        focusCategories: ['AI Tools', 'Web3 Design', 'Developer Media'],
      },
      entrepreneurExtension: {
        foundedCompanies: [
          {
            id: 'c-1',
            name: 'Nova Dynamics',
            industry: 'Artificial Intelligence',
            foundedYear: 2022,
          },
        ],
      },
      investorExtension: {
        investmentThesis: 'Backing pre-seed AI infrastructure and developer productivity tools.',
        targetStages: ['Pre-Seed', 'Seed'],
        targetIndustries: ['AI/ML', 'DevTools'],
        targetGeography: ['Europe', 'North America'],
      },
    };

    render(<ProfileView mode="public" profile={multiRoleData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Creator Projects & Focus')).toBeInTheDocument();
    expect(screen.getByText('12 published projects')).toBeInTheDocument();
    expect(screen.getByText('AI Tools')).toBeInTheDocument();

    expect(screen.getByText('Founded Companies & Ventures')).toBeInTheDocument();
    expect(screen.getByText('Nova Dynamics')).toBeInTheDocument();
    expect(screen.getByText('Artificial Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Founded 2022')).toBeInTheDocument();

    expect(screen.getByText('Investment Profile')).toBeInTheDocument();
    expect(screen.getByText(/Backing pre-seed AI infrastructure/i)).toBeInTheDocument();
    expect(screen.getByText('Pre-Seed')).toBeInTheDocument();
    expect(screen.getByText('AI/ML')).toBeInTheDocument();
    expect(screen.getByText('Europe')).toBeInTheDocument();
  });

  it('renders View Public Profile and Share Profile buttons in owner mode when slug is present', () => {
    vi.spyOn(profileHooks, 'useProfile').mockReturnValue({
      data: {
        userId: 'u-1',
        name: 'Alex Creator',
        slug: 'alex-creator',
        headline: 'Lead Creative',
        roles: ['Creator'],
      },
      isLoading: false,
    } as any);

    render(<ProfileView mode="owner" />, { wrapper: createWrapper() });

    expect(screen.getByText('Share Profile')).toBeInTheDocument();
    const publicLink = screen.getByRole('link', { name: /View Public Profile/i });
    expect(publicLink).toBeInTheDocument();
    expect(publicLink).toHaveAttribute('href', '/profile/alex-creator');
  });
});
