import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BadgeCheck, Settings, UserRound } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { AccountMenu } from '@/components/layout/AccountMenu';

const logout = vi.fn();

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({ user: { name: 'Ada Lovelace', role: 'Creator' }, logout }),
}));

const source = readFileSync(
  resolve(process.cwd(), 'src/components/layout/AccountMenu.tsx'),
  'utf8'
);

const items = [
  { href: '/dashboard/creator/profile', icon: UserRound, label: 'Profile' },
  { href: '/dashboard/creator/settings', icon: Settings, label: 'Settings' },
];

const open = async (props: Partial<Parameters<typeof AccountMenu>[0]> = {}) => {
  const user = userEvent.setup();
  render(<AccountMenu roleLabel="Creator" initialsFallback="C" items={items} {...props} />);
  await user.click(screen.getByRole('button', { name: 'Open account menu' }));
  return user;
};

describe('account menu identity', () => {
  it('derives initials from the signed-in name', () => {
    render(<AccountMenu roleLabel="Creator" initialsFallback="C" items={items} />);

    expect(screen.getByRole('button', { name: 'Open account menu' })).toHaveTextContent('AL');
  });

  it('shows the name and the role label passed in', async () => {
    await open({ roleLabel: 'Investor' });

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Investor')).toBeInTheDocument();
    expect(screen.getByRole('menu', { name: 'Investor account' })).toBeInTheDocument();
  });
});

describe('account menu items', () => {
  it('renders every provided item with its href', async () => {
    await open();

    expect(screen.getByRole('menuitem', { name: /Profile/ }))
      .toHaveAttribute('href', '/dashboard/creator/profile');
    expect(screen.getByRole('menuitem', { name: /Settings/ }))
      .toHaveAttribute('href', '/dashboard/creator/settings');
  });

  it('accepts a different role’s items unchanged', async () => {
    await open({
      roleLabel: 'Service Provider',
      items: [{ href: '/dashboard/serviceprovider/profile', icon: BadgeCheck, label: 'Profile & Trust' }],
    });

    expect(screen.getByRole('menuitem', { name: /Profile & Trust/ }))
      .toHaveAttribute('href', '/dashboard/serviceprovider/profile');
  });

  /**
   * Entrepreneur and Admin have no profile route today. The menu must still open onto
   * something actionable rather than an empty panel.
   */
  it('still offers sign-out when a role has no destinations', async () => {
    await open({ roleLabel: 'Entrepreneur', items: [] });

    expect(screen.getByRole('menuitem', { name: /Sign out/ })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Profile/ })).not.toBeInTheDocument();
  });
});

describe('account menu sign-out', () => {
  /** The job the plain Logout button used to do; it must survive the replacement. */
  it('invokes logout', async () => {
    logout.mockClear();
    const user = await open();

    await user.click(screen.getByRole('menuitem', { name: /Sign out/ }));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', async () => {
    const user = await open();
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('account menu token discipline', () => {
  /**
   * The SP original used raw hex, which was safe only because .sp-workspace pins light
   * values. This renders in Creator, Entrepreneur and Investor chrome too, which follows
   * the global theme including dark mode — hex here would paint near-black text on a dark
   * surface.
   */
  /**
   * Comments are stripped before matching. The doc comment above the component cites the
   * exact hex the SP original used, which is the point of it — asserting against raw source
   * would forbid the file from explaining its own migration. Only real code is checked.
   */
  it('carries no hex colour literals', () => {
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    expect(code).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(code).not.toContain('bg-white');
  });

  it('uses semantic tokens for surface, text and border', () => {
    expect(source).toContain('bg-popover');
    expect(source).toContain('text-popover-foreground');
    expect(source).toContain('text-muted-foreground');
    expect(source).toContain('border-border');
    expect(source).toContain('focus-visible:ring-ring');
  });
});
