import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import NotificationBell from '@/components/notifications/NotificationBell';
import type { AppNotification } from '@/types/notifications';

const notifications: AppNotification[] = [
  {
    id: '1', userId: 'u1', title: 'Payment released',
    body: 'A milestone payment was released to your balance.',
    type: 'System', referenceId: null, isRead: false,
    createdAt: new Date(Date.now() - 23 * 3600_000).toISOString(),
  },
  {
    id: '2', userId: 'u1', title: 'Milestone funded',
    body: 'The client funded a milestone on your engagement.',
    type: 'System', referenceId: null, isRead: false,
    createdAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
  },
];

const state = { notifications, unreadCount: 23, isLoading: false, isError: false };

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

vi.mock('@/hooks/queries/notifications', () => ({
  useNotifications: () => state,
  useMarkNotificationRead: () => ({ mutate: vi.fn() }),
  useNotificationRealtime: () => undefined,
}));

/**
 * Reproduction harness for the reported symptom: a panel whose rows show only a relative
 * timestamp, with no title or body. These render the real component against data shaped
 * exactly like the dev database's actual rows, so a failure here would localise the fault
 * to the component and a pass rules the component out.
 */
describe('notification bell rendering', () => {
  const open = async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    return user;
  };

  it('renders the title, body and time of every row', async () => {
    await open();

    expect(screen.getByText('Payment released')).toBeInTheDocument();
    expect(screen.getByText('A milestone payment was released to your balance.')).toBeInTheDocument();
    expect(screen.getByText('Milestone funded')).toBeInTheDocument();
    expect(screen.getAllByText(/hours ago|day ago/).length).toBeGreaterThan(0);
  });

  /**
   * The exact reported failure mode. If a row ever contains a timestamp and nothing else,
   * this catches it regardless of whether the cause is data or markup.
   */
  it('never renders a row carrying only a timestamp', async () => {
    const { container } = (await open(), { container: document.body });
    const rows = container.querySelectorAll('li');

    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => {
      const text = (row.textContent ?? '').trim();
      const withoutTime = text.replace(/\d+\s+(second|minute|hour|day|month|year)s?\s+ago/gi, '').trim();
      expect(withoutTime).not.toBe('');
    });
  });

  /**
   * THE ACTUAL BUG, and the guard against its return.
   *
   * SpDesktopTopbar and SpMobileHeader used to wrap this component in `[&_button]:size-11`
   * to give the bell a 44px touch target. That compiles to a DESCENDANT selector, and the
   * panel renders inline (no portal), so it also matched every notification row — each of
   * which is a <button> — forcing them to 44x44px. Descendant specificity beats the row's
   * own `w-full`, so rows collapsed to a square: `truncate` and `line-clamp-2` clipped title
   * and body to nothing while the timestamp's `shrink-0` kept its width and spilled into the
   * panel, staying visible. Only the time showed. SP-only, and broken since that wrapper was
   * written.
   *
   * jsdom applies no CSS, so the guard is on the source: no SP header may style this
   * component with a descendant-button selector again. Rows really are descendant buttons —
   * asserted below — which is precisely what makes such a selector unsafe.
   */
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

  it('renders rows as buttons, which is what made that selector unsafe', async () => {
    await open();

    const rows = document.querySelectorAll('li button');
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => expect(row.className).toContain('w-full'));
  });

  /** A row whose title and body really are empty is the shape the symptom would take. */
  it('shows what an empty-title row would look like, for comparison', async () => {
    state.notifications = [{ ...notifications[0], title: '', body: '' }];
    const { container } = (await open(), { container: document.body });

    const row = container.querySelector('li');
    const text = (row?.textContent ?? '').trim();
    expect(text).toMatch(/hours ago/);

    state.notifications = notifications;
  });
});
