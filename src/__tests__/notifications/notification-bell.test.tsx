import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import NotificationBell from '@/components/notifications/NotificationBell';
import type { AppNotification } from '@/types/notifications';
import { UserRole } from '@/lib/roles';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard/creator',
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockNotifications: AppNotification[] = Array.from({ length: 15 }, (_, i) => ({
  id: `notif-${i + 1}`,
  userId: 'u1',
  title: `Notification ${i + 1}`,
  body: `Body content for notification ${i + 1}`,
  type: 'System',
  referenceId: null,
  link: `/dashboard/creator/item-${i + 1}`,
  isRead: i >= 5, // 5 unread items
  createdAt: new Date(Date.now() - (i + 1) * 3600_000).toISOString(),
}));

const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();

const state = {
  notifications: mockNotifications,
  unreadCount: 23, // Distinct unread count > 10
  isLoading: false,
  isError: false,
};

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    token: 'test-token',
    user: { role: UserRole.CREATOR },
  }),
}));

vi.mock('@/hooks/queries/notifications', () => ({
  useNotifications: () => state,
  useMarkNotificationRead: () => ({ mutate: mockMarkRead }),
  useMarkAllNotificationsRead: () => ({ mutate: mockMarkAllRead, isPending: false }),
  useNotificationRealtime: () => undefined,
}));

describe('NotificationBell dropdown rendering & normalization', () => {
  const open = async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    return user;
  };

  it('renders the title, body and time of rows', async () => {
    await open();

    expect(screen.getByText('Notification 1')).toBeInTheDocument();
    expect(screen.getByText('Body content for notification 1')).toBeInTheDocument();
    expect(screen.getAllByText(/hours ago|day ago/).length).toBeGreaterThan(0);
  });

  it('limits dropdown display to EXACTLY the latest 10 notifications when 15 are returned', async () => {
    await open();

    // 1 to 10 should be visible
    expect(screen.getByText('Notification 1')).toBeInTheDocument();
    expect(screen.getByText('Notification 10')).toBeInTheDocument();

    // 11 to 15 should NOT be rendered in the dropdown
    expect(screen.queryByText('Notification 11')).not.toBeInTheDocument();
    expect(screen.queryByText('Notification 15')).not.toBeInTheDocument();

    const rows = document.querySelectorAll('li button');
    expect(rows.length).toBe(10);
  });

  it('displays canonical unread count in badge independent of the 10-item limit', () => {
    render(<NotificationBell />);

    // unreadCount is 23, badge displays 9+ (or unreadCount)
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('renders See More button linking to role notifications route', async () => {
    await open();

    const seeMoreLink = screen.getByRole('link', { name: /See More/i });
    expect(seeMoreLink).toBeInTheDocument();
    expect(seeMoreLink).toHaveAttribute('href', '/dashboard/creator/notifications');
  });

  it('clicking a notification marks it read and navigates to its link', async () => {
    const user = await open();

    const firstNotifBtn = screen.getByRole('button', { name: /Notification 1\b/i });
    await user.click(firstNotifBtn);

    expect(mockMarkRead).toHaveBeenCalledWith('notif-1');
    expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/item-1');
  });

  it('clicking Mark all read triggers markAllAsRead mutation', async () => {
    const user = await open();

    const markAllBtn = screen.getByRole('button', { name: /Mark all read/i });
    await user.click(markAllBtn);

    expect(mockMarkAllRead).toHaveBeenCalled();
  });

  it('renders 5 notifications when 5 are available and keeps See More visible', async () => {
    state.notifications = mockNotifications.slice(0, 5);
    state.unreadCount = 5;

    await open();

    const rows = document.querySelectorAll('li button');
    expect(rows.length).toBe(5);

    const seeMoreLink = screen.getByRole('link', { name: /See More/i });
    expect(seeMoreLink).toBeInTheDocument();

    state.notifications = mockNotifications;
    state.unreadCount = 23;
  });

  it('renders empty state when 0 notifications exist and keeps See More visible', async () => {
    state.notifications = [];
    state.unreadCount = 0;

    await open();

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    expect(screen.getByText('New activity and updates will appear here.')).toBeInTheDocument();

    const seeMoreLink = screen.getByRole('link', { name: /See More/i });
    expect(seeMoreLink).toBeInTheDocument();

    state.notifications = mockNotifications;
    state.unreadCount = 23;
  });

  it('is not styled by a descendant-button selector in either SP header', () => {
    for (const file of [
      'src/components/serviceprovider/SpDesktopTopbar.tsx',
      'src/components/serviceprovider/SpMobileHeader.tsx',
    ]) {
      const header = readFileSync(resolve(process.cwd(), file), 'utf8');
      const mount = header.slice(Math.max(0, header.indexOf('NotificationBell', header.indexOf('return')) - 200));

      expect(mount).not.toMatch(/\[&_button\][^<]*<NotificationBell/);
      expect(header).toContain('<NotificationBell triggerClassName=');
    }
  });
});


