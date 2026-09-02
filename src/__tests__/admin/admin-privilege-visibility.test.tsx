import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminUsersPage from '@/app/dashboard/admin/users/page';
import api from '@/lib/axios';

// ─── Shared mocks ───
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ id: 'user-superadmin-id' }),
  usePathname: () => '/dashboard/admin/users',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Auth mock holder — overridden per test group
let mockAuth = {
  user: { id: 'admin-1', name: 'Normal Admin', email: 'demo.admin@mondial.local', role: 'Admin', roles: ['Admin'] },
  isBackendVerified: true,
  isLoading: false,
};

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => mockAuth,
}));

// ─── Sample data ───
const normalUser = {
  userId: 'user-001',
  displayName: 'Alice Creator',
  publicSlug: 'alice',
  email: 'alice@mondial.local',
  phoneNumber: null,
  country: 'United States',
  roles: ['Creator', 'Entrepreneur'],
  joinedAt: '2026-01-15T10:00:00Z',
  lastLogin: '2026-02-01T12:00:00Z',
  kycStatus: 'Verified',
  isLocked: false,
  lockoutEnd: null,
  onboardingPhase: 1,
};

const adminUser = {
  userId: 'user-admin-id',
  displayName: 'Platform Admin',
  publicSlug: null,
  email: 'demo.admin@mondial.local',
  phoneNumber: null,
  country: null,
  roles: ['Admin'],
  joinedAt: '2026-01-01T10:00:00Z',
  lastLogin: '2026-03-01T10:00:00Z',
  kycStatus: 'NotStarted',
  isLocked: false,
  lockoutEnd: null,
  onboardingPhase: 0,
};

const superAdminUser = {
  userId: 'user-superadmin-id',
  displayName: 'Platform SuperAdmin',
  publicSlug: null,
  email: 'demo.superadmin@mondial.local',
  phoneNumber: null,
  country: null,
  roles: ['SuperAdmin'],
  joinedAt: '2026-01-01T10:00:00Z',
  lastLogin: '2026-03-01T10:00:00Z',
  kycStatus: 'NotStarted',
  isLocked: false,
  lockoutEnd: null,
  onboardingPhase: 0,
};

const multiRoleSuperAdmin = {
  userId: 'user-multi-sa',
  displayName: 'Multi SuperAdmin',
  publicSlug: null,
  email: 'multi.sa@mondial.local',
  phoneNumber: null,
  country: 'UK',
  roles: ['Creator', 'SuperAdmin'],
  joinedAt: '2026-02-01T10:00:00Z',
  lastLogin: null,
  kycStatus: 'Pending',
  isLocked: false,
  lockoutEnd: null,
  onboardingPhase: 1,
};

const pagedResponse = (items: any[]) => ({
  data: {
    items,
    page: 1,
    pageSize: 25,
    totalItems: items.length,
    totalPages: 1,
  },
});

describe('Admin Privilege Visibility — User Directory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Normal Admin viewing users directory', () => {
    beforeEach(() => {
      mockAuth = {
        user: { id: 'admin-1', name: 'Normal Admin', email: 'demo.admin@mondial.local', role: 'Admin', roles: ['Admin'] },
        isBackendVerified: true,
        isLoading: false,
      };
    });

    it('hides SuperAdmin user from the directory listing', async () => {
      (api.get as any).mockResolvedValueOnce(pagedResponse([normalUser, adminUser, superAdminUser]));

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Creator')).toBeInTheDocument();
        expect(screen.getByText('Platform Admin')).toBeInTheDocument();
      });

      // SuperAdmin user must be hidden
      expect(screen.queryByText('Platform SuperAdmin')).not.toBeInTheDocument();
      expect(screen.queryByText('demo.superadmin@mondial.local')).not.toBeInTheDocument();
    });

    it('hides multi-role SuperAdmin users from the directory listing', async () => {
      (api.get as any).mockResolvedValueOnce(pagedResponse([normalUser, multiRoleSuperAdmin]));

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Creator')).toBeInTheDocument();
      });

      // Multi-role SuperAdmin must be hidden
      expect(screen.queryByText('Multi SuperAdmin')).not.toBeInTheDocument();
      expect(screen.queryByText('multi.sa@mondial.local')).not.toBeInTheDocument();
    });

    it('shows empty state when all results are SuperAdmin users', async () => {
      (api.get as any).mockResolvedValueOnce(pagedResponse([superAdminUser]));

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('No users match the search and filter criteria.')).toBeInTheDocument();
      });
    });

    it('hides SuperAdmin and Admin role filter options', async () => {
      (api.get as any).mockResolvedValueOnce(pagedResponse([]));

      render(<AdminUsersPage />);

      await waitFor(() => {
        // Business roles should be present
        const roleSelect = screen.getAllByRole('combobox').find(
          (el) => el.querySelector('option[value="Creator"]')
        ) || screen.getAllByRole('listbox')[0];

        // Use option elements directly
        const options = screen.getAllByRole('option');
        const optionTexts = options.map(o => o.textContent);

        expect(optionTexts).toContain('Creator');
        expect(optionTexts).toContain('Entrepreneur');
        expect(optionTexts).toContain('Investor');
        expect(optionTexts).toContain('Service Provider');
        expect(optionTexts).not.toContain('Admin');
        expect(optionTexts).not.toContain('SuperAdmin');
      });
    });

    it('visible count reflects filtered results, not backend total', async () => {
      (api.get as any).mockResolvedValueOnce(pagedResponse([normalUser, adminUser, superAdminUser]));

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Creator')).toBeInTheDocument();
      });

      // Should show 2 visible users, not 3 — the count appears in pagination text
      const visibleCountEls = screen.getAllByText('2');
      expect(visibleCountEls.length).toBeGreaterThanOrEqual(1);
      // The "Total Users" badge from backend still shows 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('SuperAdmin viewing users directory', () => {
    beforeEach(() => {
      mockAuth = {
        user: { id: 'sa-1', name: 'SuperAdmin', email: 'demo.superadmin@mondial.local', role: 'SuperAdmin', roles: ['SuperAdmin'] },
        isBackendVerified: true,
        isLoading: false,
      };
    });

    it('shows all users including SuperAdmin users', async () => {
      (api.get as any).mockResolvedValueOnce(pagedResponse([normalUser, adminUser, superAdminUser]));

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Creator')).toBeInTheDocument();
        expect(screen.getByText('Platform Admin')).toBeInTheDocument();
        expect(screen.getByText('Platform SuperAdmin')).toBeInTheDocument();
      });
    });

    it('shows SuperAdmin and Admin role filter options', async () => {
      (api.get as any).mockResolvedValueOnce(pagedResponse([]));

      render(<AdminUsersPage />);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        const optionTexts = options.map(o => o.textContent);

        expect(optionTexts).toContain('Admin');
        expect(optionTexts).toContain('SuperAdmin');
      });
    });

    it('shows multi-role SuperAdmin users in directory', async () => {
      (api.get as any).mockResolvedValueOnce(pagedResponse([normalUser, multiRoleSuperAdmin]));

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Multi SuperAdmin')).toBeInTheDocument();
        expect(screen.getByText('multi.sa@mondial.local')).toBeInTheDocument();
      });
    });
  });
});

describe('Admin Privilege Visibility — User Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Normal Admin viewing SuperAdmin detail', () => {
    beforeEach(() => {
      mockAuth = {
        user: { id: 'admin-1', name: 'Normal Admin', email: 'demo.admin@mondial.local', role: 'Admin', roles: ['Admin'] },
        isBackendVerified: true,
        isLoading: false,
      };
    });

    it('renders Access Denied when Normal Admin views SuperAdmin profile', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          userId: 'user-superadmin-id',
          displayName: 'Platform SuperAdmin',
          userName: 'superadmin',
          email: 'demo.superadmin@mondial.local',
          phoneNumber: null,
          emailConfirmed: true,
          phoneNumberConfirmed: false,
          address: null,
          city: null,
          country: null,
          imagePath: null,
          bio: null,
          title: null,
          roles: ['SuperAdmin'],
          joinedAt: '2026-01-01T10:00:00Z',
          lastLogin: '2026-03-01T10:00:00Z',
          isLocked: false,
          lockoutEnd: null,
          onboardingPhase: 0,
          kycStatus: 'NotStarted',
          kycIdentityVerified: false,
          kycFaceVerified: false,
          kycVerifiedAt: null,
          kycRejectionReason: null,
          roleActivity: {
            creatorIdeasCount: 0,
            entrepreneurCompaniesCount: 0,
            investorMatchesCount: 0,
            investorInvestmentsCount: 0,
            serviceProviderListingsCount: 0,
            serviceProviderWorkroomsCount: 0,
          },
        },
      });

      // Dynamically import to respect mock state
      const AdminUserDetailPage = (await import('@/app/dashboard/admin/users/[id]/page')).default;
      render(<AdminUserDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText(/This user profile is restricted/)).toBeInTheDocument();
      });

      // Full profile should NOT be rendered
      expect(screen.queryByText('Platform SuperAdmin')).not.toBeInTheDocument();
      expect(screen.queryByText('demo.superadmin@mondial.local')).not.toBeInTheDocument();
    });
  });

  describe('SuperAdmin viewing SuperAdmin detail', () => {
    beforeEach(() => {
      mockAuth = {
        user: { id: 'sa-1', name: 'SuperAdmin', email: 'demo.superadmin@mondial.local', role: 'SuperAdmin', roles: ['SuperAdmin'] },
        isBackendVerified: true,
        isLoading: false,
      };
    });

    it('renders full profile when SuperAdmin views SuperAdmin profile', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          userId: 'user-superadmin-id',
          displayName: 'Platform SuperAdmin',
          userName: 'superadmin',
          email: 'demo.superadmin@mondial.local',
          phoneNumber: null,
          emailConfirmed: true,
          phoneNumberConfirmed: false,
          address: null,
          city: null,
          country: null,
          imagePath: null,
          bio: null,
          title: null,
          roles: ['SuperAdmin'],
          joinedAt: '2026-01-01T10:00:00Z',
          lastLogin: '2026-03-01T10:00:00Z',
          isLocked: false,
          lockoutEnd: null,
          onboardingPhase: 0,
          kycStatus: 'NotStarted',
          kycIdentityVerified: false,
          kycFaceVerified: false,
          kycVerifiedAt: null,
          kycRejectionReason: null,
          roleActivity: {
            creatorIdeasCount: 0,
            entrepreneurCompaniesCount: 0,
            investorMatchesCount: 0,
            investorInvestmentsCount: 0,
            serviceProviderListingsCount: 0,
            serviceProviderWorkroomsCount: 0,
          },
        },
      });

      const AdminUserDetailPage = (await import('@/app/dashboard/admin/users/[id]/page')).default;
      render(<AdminUserDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Platform SuperAdmin')).toBeInTheDocument();
        expect(screen.getByText('demo.superadmin@mondial.local')).toBeInTheDocument();
      });

      // Should NOT show Access Denied
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });
  });
});
