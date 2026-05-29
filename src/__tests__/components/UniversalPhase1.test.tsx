import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import UniversalPhase1 from '@/components/onboarding/UniversalPhase1';
import api from '@/lib/axios';

const authUser = { id: 'user-1', name: 'QA User', role: 'Creator', onboardingPhase: 0 };
const refreshAuthMe = vi.fn();

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

describe('UniversalPhase1 phone verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.hasPointerCapture ??= vi.fn(() => false);
    Element.prototype.setPointerCapture ??= vi.fn();
    Element.prototype.releasePointerCapture ??= vi.fn();
    Element.prototype.scrollIntoView ??= vi.fn();
    vi.mocked(api.get).mockResolvedValue({ data: { data: onboardingStatus } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });
  });

  it('sends a Bangladesh phone number with the selected +880 country code', async () => {
    const user = userEvent.setup();
    render(<UniversalPhase1 />);

    const phoneInput = await screen.findByLabelText('Phone number');
    await user.type(phoneInput, '01712345678');
    await user.click(screen.getAllByRole('button', { name: 'Verify' })[2]);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/onboarding/send-otp', {
        phone: '+8801712345678',
      });
    });
  });

  it('changes the country code dropdown and sends a Europe phone number', async () => {
    const user = userEvent.setup();
    render(<UniversalPhase1 />);

    const countryCode = await screen.findByRole('combobox', {
      name: 'Phone country code',
    });
    await user.click(countryCode);
    await user.click(await screen.findByRole('option', { name: 'Europe - France +33' }));

    await user.type(screen.getByLabelText('Phone number'), '0612345678');
    await user.click(screen.getAllByRole('button', { name: 'Verify' })[2]);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/onboarding/send-otp', {
        phone: '+33612345678',
      });
    });
  });
});
