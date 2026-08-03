import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import UniversalPhase1 from '@/components/onboarding/UniversalPhase1';
import api from '@/lib/axios';

const authUser = { id: 'user-1', name: 'QA User', role: 'Creator', onboardingPhase: 0 };
const refreshAuthMe = vi.fn();
const push = vi.fn();

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: authUser,
    refreshAuthMe,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

const onboardingStatus = {
  phase: 0,
  role: 'Creator',
  phone: '',
  email: 'qa@example.com',
  items: {
    identity: { key: 'identity', verified: false, required: true },
    face: { key: 'face', verified: false, required: true },
    phone: { key: 'phone', verified: false, required: true },
    email: { key: 'email', verified: false, required: true },
  },
};

describe('UniversalPhase1 verification actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.hasPointerCapture ??= vi.fn(() => false);
    Element.prototype.setPointerCapture ??= vi.fn();
    Element.prototype.releasePointerCapture ??= vi.fn();
    Element.prototype.scrollIntoView ??= vi.fn();
    vi.mocked(api.get).mockResolvedValue({ data: { data: onboardingStatus } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });
  });

  it('routes identity-document verification to the connected identity flow', async () => {
    const user = userEvent.setup();
    render(<UniversalPhase1 />);

    await user.click(
      await screen.findByRole('button', { name: /Identity Document/i })
    );

    expect(push).toHaveBeenCalledWith('/onboarding/identity');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('routes facial verification to the connected identity flow', async () => {
    const user = userEvent.setup();
    render(<UniversalPhase1 />);

    await user.click(
      await screen.findByRole('button', { name: /Facial verification/i })
    );

    expect(push).toHaveBeenCalledWith('/onboarding/identity');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('honestly reports that phone verification is not connected here', async () => {
    const user = userEvent.setup();
    render(<UniversalPhase1 />);

    await user.click(
      await screen.findByRole('button', { name: /Phone Verification/i })
    );

    expect(api.post).not.toHaveBeenCalled();
    expect(
      screen.getByText('phone verification coming soon')
    ).toBeInTheDocument();
  });

  it('honestly reports that email verification is not connected here', async () => {
    const user = userEvent.setup();
    render(<UniversalPhase1 />);

    await user.click(
      await screen.findByRole('button', { name: /Email Verification/i })
    );

    expect(api.post).not.toHaveBeenCalled();
    expect(
      screen.getByText('email verification coming soon')
    ).toBeInTheDocument();
  });
});

/**
 * `bg-success-bg`, `border-success-border` and a bare `text-success` have no --color-*
 * mapping in @theme inline, so Tailwind generates no utility for any of them and they
 * emit nothing. This component used all three; they are migrated to the wired
 * success-light / success-text pair used across the rest of the app.
 *
 * Asserting on class names rather than computed colour: jsdom does not run Tailwind, so
 * the rendered colour itself is not observable here.
 */
describe('UniversalPhase1 success styling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView ??= vi.fn();
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });
  });

  it('marks a completed verification with the wired success token', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: {
          ...onboardingStatus,
          items: {
            ...onboardingStatus.items,
            email: { key: 'email', verified: true, required: true },
          },
        },
      },
    });

    const { container } = render(<UniversalPhase1 />);
    await screen.findByRole('button', { name: /Email Verification/i });

    expect(container.querySelector('.text-success-text')).not.toBeNull();
    // The dead tokens must not come back.
    expect(container.querySelector('.text-success')).toBeNull();
  });

  it('references no unmapped success token anywhere in the component', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/onboarding/UniversalPhase1.tsx'),
      'utf8'
    );
    const classNames = source.match(/className=(?:"[^"]*"|\{`[^`]*`\}|\{[^}]*\})/g) ?? [];
    const dead = classNames.filter((c) =>
      /(?:bg|text|border)-success(?:-bg|-border)?(?:["'\s/])/.test(c)
    );

    expect(dead).toEqual([]);
  });
});
