import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminUsersPage from '@/app/dashboard/admin/users/page';
import api from '@/lib/axios';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ id: 'user-123' }),
  usePathname: () => '/dashboard/admin/users',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', name: 'Mondial Admin', email: 'admin@mondial.admin', role: 'Admin', roles: ['Admin'] },
    isBackendVerified: true,
    isLoading: false,
  }),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Admin User Directory Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user directory table with multi-role badges and pagination', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        items: [
          {
            userId: 'user-001',
            displayName: 'Alice Entrepreneur',
            email: 'alice@mondial.local',
            phoneNumber: '+123456789',
            country: 'United States',
            roles: ['Entrepreneur', 'ServiceProvider'],
            joinedAt: '2026-01-15T10:00:00Z',
            lastLogin: '2026-02-01T12:00:00Z',
            kycStatus: 'Verified',
            isLocked: false,
            lockoutEnd: null,
            onboardingPhase: 1,
          },
          {
            userId: 'user-002',
            displayName: 'Bob Suspended',
            email: 'bob@mondial.local',
            phoneNumber: null,
            country: 'Germany',
            roles: ['Creator'],
            joinedAt: '2026-01-20T10:00:00Z',
            lastLogin: null,
            kycStatus: 'Pending',
            isLocked: true,
            lockoutEnd: '9999-12-31T23:59:59Z',
            onboardingPhase: 0,
          },
        ],
        page: 1,
        pageSize: 25,
        totalItems: 2,
        totalPages: 1,
      },
    });

    render(<AdminUsersPage />);

    expect(screen.getByText(/User Management/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Entrepreneur')).toBeInTheDocument();
      expect(screen.getByText('alice@mondial.local')).toBeInTheDocument();
      expect(screen.getByText('Bob Suspended')).toBeInTheDocument();
    });

    // Check multi-role badges
    expect(screen.getAllByText('Entrepreneur').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('ServiceProvider').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Creator').length).toBeGreaterThanOrEqual(1);

    // Check account status badges
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Suspended')).toBeInTheDocument();

    // Check "View User" link
    const viewLinks = screen.getAllByRole('link', { name: /View User/i });
    expect(viewLinks).toHaveLength(2);
    expect(viewLinks[0]).toHaveAttribute('href', '/dashboard/admin/users/user-001');
  });

  it('triggers search query when search term is entered', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        items: [],
        page: 1,
        pageSize: 25,
        totalItems: 0,
        totalPages: 1,
      },
    });

    const user = userEvent.setup();
    render(<AdminUsersPage />);

    const searchInput = screen.getByPlaceholderText(/Search by name, email, user ID, slug.../i);
    await user.type(searchInput, 'Alice');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('search=Alice'));
    }, { timeout: 1500 });
  });
});
