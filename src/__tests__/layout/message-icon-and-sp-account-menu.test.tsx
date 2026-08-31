import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import MessageIcon from '@/components/messages/MessageIcon';
import { SpAccountMenu } from '@/components/serviceprovider/SpAccountMenu';
import { UserRole } from '@/lib/roles';

const push = vi.fn();
let pathname = '/dashboard/creator';
let authUser: { id: string; name: string; role: UserRole; roles?: UserRole[] } | null = {
  id: 'user-1',
  name: 'Multi Role User',
  role: UserRole.ENTREPRENEUR, // Primary role Entrepreneur
  roles: [UserRole.ENTREPRENEUR, UserRole.SERVICE_PROVIDER],
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({ user: authUser, logout: vi.fn() }),
}));

vi.mock('@/hooks/queries/chat', () => ({
  useConversations: () => ({ data: [] }),
}));

describe('MessageIcon Multi-Role Context-Aware Routing', () => {
  beforeEach(() => {
    push.mockReset();
    pathname = '/dashboard/creator';
    authUser = {
      id: 'user-1',
      name: 'Multi Role User',
      role: UserRole.ENTREPRENEUR,
      roles: [UserRole.ENTREPRENEUR, UserRole.SERVICE_PROVIDER],
    };
  });

  it('navigates to /dashboard/serviceprovider/messages when clicked on /dashboard/serviceprovider', async () => {
    pathname = '/dashboard/serviceprovider';
    const user = userEvent.setup();
    render(<MessageIcon />);

    await user.click(screen.getByRole('button', { name: 'Messages' }));

    expect(push).toHaveBeenCalledWith('/dashboard/serviceprovider/messages');
  });

  it('navigates to /dashboard/entrepreneur/messages when clicked on /dashboard/entrepreneur', async () => {
    pathname = '/dashboard/entrepreneur';
    const user = userEvent.setup();
    render(<MessageIcon />);

    await user.click(screen.getByRole('button', { name: 'Messages' }));

    expect(push).toHaveBeenCalledWith('/dashboard/entrepreneur/messages');
  });

  it('navigates to /dashboard/investor/messages when clicked on /dashboard/investor', async () => {
    pathname = '/dashboard/investor';
    const user = userEvent.setup();
    render(<MessageIcon />);

    await user.click(screen.getByRole('button', { name: 'Messages' }));

    expect(push).toHaveBeenCalledWith('/dashboard/investor/messages');
  });

  it('navigates to /dashboard/creator/messages when clicked on /dashboard/creator', async () => {
    pathname = '/dashboard/creator';
    const user = userEvent.setup();
    render(<MessageIcon />);

    await user.click(screen.getByRole('button', { name: 'Messages' }));

    expect(push).toHaveBeenCalledWith('/dashboard/creator/messages');
  });

  it('falls back to primary role messages on role-neutral route like /dashboard/profile', async () => {
    pathname = '/dashboard/profile';
    const user = userEvent.setup();
    render(<MessageIcon />);

    await user.click(screen.getByRole('button', { name: 'Messages' }));

    expect(push).toHaveBeenCalledWith('/dashboard/entrepreneur/messages');
  });
});

describe('SpAccountMenu Canonical Universal Profile Link', () => {
  it('renders Profile link pointing to canonical Universal Profile /dashboard/profile', async () => {
    const user = userEvent.setup();
    render(<SpAccountMenu />);

    await user.click(screen.getByRole('button', { name: 'Open account menu' }));

    const profileLink = screen.getByRole('menuitem', { name: /Profile & Trust/i });
    expect(profileLink).toHaveAttribute('href', '/dashboard/profile');
  });
});
