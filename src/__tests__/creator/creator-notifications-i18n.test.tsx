import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SharedNotificationsPage from '@/components/notifications/SharedNotificationsPage';
import NotificationBell from '@/components/notifications/NotificationBell';
import { LanguageProvider } from '@/providers/LanguageProvider';
import type { AppNotification } from '@/types/notifications';
import enCreator from '@/locales/en/creator.json';
import frCreator from '@/locales/fr/creator.json';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard/creator/notifications',
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockNotifications: AppNotification[] = [
  {
    id: 'n-1',
    userId: 'u1',
    title: 'Seed Round Term Sheet',
    body: 'Investor submitted a new term sheet for your review.',
    type: 'Investment',
    referenceId: 'inv-123',
    link: '/dashboard/creator/deals/inv-123',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'n-2',
    userId: 'u1',
    title: 'New Collaboration Message',
    body: 'Co-founder sent you a direct message.',
    type: 'Message',
    referenceId: 'msg-456',
    link: '/dashboard/creator/messages',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
  },
  {
    id: 'n-3',
    userId: 'u1',
    title: 'Data Room Access Granted',
    body: 'Security protocols updated successfully.',
    type: 'Security',
    referenceId: 'sec-789',
    link: '/dashboard/creator/dataroom',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
  },
];

const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();
const mockRefetch = vi.fn();

let mockState = {
  notifications: mockNotifications,
  unreadCount: 2,
  isLoading: false,
  isError: false,
  refetch: mockRefetch,
};

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    token: 'test-token',
    user: { role: 'Creator' },
  }),
}));

vi.mock('@/hooks/queries/notifications', () => ({
  useNotifications: () => mockState,
  useMarkNotificationRead: () => ({ mutate: mockMarkRead }),
  useMarkAllNotificationsRead: () => ({ mutate: mockMarkAllRead, isPending: false }),
  useNotificationRealtime: () => undefined,
}));

describe('Creator Notifications i18n (en & fr)', () => {
  it('renders SharedNotificationsPage in English with full text and action labels', () => {
    mockState = {
      notifications: mockNotifications,
      unreadCount: 2,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    };

    render(
      <LanguageProvider defaultLocale="en">
        <SharedNotificationsPage role="Creator" />
      </LanguageProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Notifications' })).toBeInTheDocument();
    expect(
      screen.getByText('Stay updated on your projects, deals, messages, and platform activity.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mark all as read/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Unread/i })).toBeInTheDocument();
    expect(screen.getByText('Seed Round Term Sheet')).toBeInTheDocument();
    expect(screen.getAllByText('New').length).toBeGreaterThan(0);
    expect(screen.getByText('Investment')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getAllByText('View details').length).toBe(3);
  });

  it('renders SharedNotificationsPage in French with full translations', () => {
    mockState = {
      notifications: mockNotifications,
      unreadCount: 2,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    };

    render(
      <LanguageProvider defaultLocale="fr">
        <SharedNotificationsPage role="Creator" />
      </LanguageProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Notifications' })).toBeInTheDocument();
    expect(
      screen.getByText("Restez informé de vos projets, accords, messages et de l'activité de la plateforme.")
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tout marquer comme lu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Toutes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Non lues/i })).toBeInTheDocument();
    expect(screen.getAllByText('Nouveau').length).toBeGreaterThan(0);
    expect(screen.getByText('Investissement')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('Sécurité')).toBeInTheDocument();
    expect(screen.getAllByText('Voir les détails').length).toBe(3);
  });

  it('renders French empty states correctly when no notifications exist', () => {
    mockState = {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    };

    render(
      <LanguageProvider defaultLocale="fr">
        <SharedNotificationsPage role="Creator" />
      </LanguageProvider>
    );

    expect(screen.getByText('Aucune notification pour l\'instant')).toBeInTheDocument();
    expect(
      screen.getByText('Les mises à jour concernant vos projets, accords, messages et activités apparaîtront ici.')
    ).toBeInTheDocument();
  });

  it('renders French error state with retry CTA', () => {
    mockState = {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    };

    render(
      <LanguageProvider defaultLocale="fr">
        <SharedNotificationsPage role="Creator" />
      </LanguageProvider>
    );

    expect(screen.getByText('Impossible de charger les notifications.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Réessayer/i })).toBeInTheDocument();
  });

  it('renders NotificationBell dropdown in French', async () => {
    mockState = {
      notifications: mockNotifications,
      unreadCount: 2,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    };

    const user = userEvent.setup();
    render(
      <LanguageProvider defaultLocale="fr">
        <NotificationBell />
      </LanguageProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(screen.getByText('Restez informé de votre activité.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tout marquer comme lu/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Voir plus/i })).toBeInTheDocument();
  });

  it('verifies 100% dictionary key symmetry between en and fr for notifications namespace', () => {
    const enNotif = (enCreator as Record<string, unknown>).notifications as Record<string, unknown>;
    const frNotif = (frCreator as Record<string, unknown>).notifications as Record<string, unknown>;

    expect(enNotif).toBeDefined();
    expect(frNotif).toBeDefined();

    const getKeys = (obj: Record<string, unknown>, prefix = ''): string[] => {
      let keys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const full = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          keys = keys.concat(getKeys(v as Record<string, unknown>, full));
        } else {
          keys.push(full);
        }
      }
      return keys;
    };

    const enKeys = getKeys(enNotif).sort();
    const frKeys = getKeys(frNotif).sort();

    expect(enKeys).toEqual(frKeys);
    expect(enKeys.length).toBeGreaterThanOrEqual(25);
  });
});
