import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import IdentityVerification from '@/components/onboarding/IdentityVerification';
import api from '@/lib/axios';

const push = vi.fn();

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('IdentityVerification component - WebSDK hardening', () => {
  let capturedTokenExpirationHandler: (() => Promise<string>) | null = null;
  let registeredEvents: Record<string, (...args: any[]) => void> = {};
  let launchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    capturedTokenExpirationHandler = null;
    registeredEvents = {};
    launchMock = vi.fn();

    // Default mock responses
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          status: 'not_started',
          isCurrent: false,
        },
      },
    });

    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        data: {
          accessToken: 'test-sumsub-sdk-token-900s',
          verificationId: 'v-123',
          status: 'submitted',
        },
      },
    });

    // Mock window.snsWebSdk
    window.snsWebSdk = {
      init: vi.fn((token: string, tokenExpirationHandler: () => Promise<string>) => {
        capturedTokenExpirationHandler = tokenExpirationHandler;
        const builder = {
          withConf: vi.fn().mockReturnThis(),
          withOptions: vi.fn().mockReturnThis(),
          on: vi.fn((event: string, callback: (...args: any[]) => void) => {
            registeredEvents[event] = callback;
            return builder;
          }),
          build: vi.fn(() => ({
            launch: launchMock,
          })),
        };
        return builder;
      }),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as any).snsWebSdk;
  });

  it('1. document selection calls POST /api/identity/session with selected document type', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<IdentityVerification />);

    expect(await screen.findByText('Select France Identity Document')).toBeInTheDocument();

    // Select Passport
    const passportButton = screen.getByText('Passport').closest('button');
    expect(passportButton).toBeInTheDocument();
    await user.click(passportButton!);

    const startButton = screen.getByRole('button', { name: /Start Secure Verification/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/identity/session', {
        documentType: 'passport',
        countryCode: 'FR',
        issuingCountry: 'FR',
        nationality: 'FR',
      });
    });

    // Verify SDK initialized with token
    await waitFor(() => {
      expect(window.snsWebSdk?.init).toHaveBeenCalledWith(
        'test-sumsub-sdk-token-900s',
        expect.any(Function)
      );
      expect(launchMock).toHaveBeenCalledWith('#sumsub-websdk-container');
    });
  });

  it('2. contains NO input[type="file"] elements or direct image upload pickers', async () => {
    const { container } = render(<IdentityVerification />);

    await screen.findByText('Select France Identity Document');
    const fileInputs = container.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBe(0);
  });

  it('3. NEVER calls /api/onboarding/identity/upload at any point', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<IdentityVerification />);

    await screen.findByText('Select France Identity Document');

    const startButton = screen.getByRole('button', { name: /Start Secure Verification/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/identity/session',
        expect.objectContaining({ documentType: 'national_id' })
      );
    });

    const uploadCalls = vi.mocked(api.post).mock.calls.filter(
      ([url]) => url.includes('/onboarding/identity/upload') || url.includes('identity/upload')
    );
    expect(uploadCalls.length).toBe(0);
  });

  it('4. SDK submission event is UX-only: shows submitted state and does NOT directly mark verified', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<IdentityVerification />);

    await screen.findByText('Select France Identity Document');
    const startButton = screen.getByRole('button', { name: /Start Secure Verification/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(registeredEvents['onApplicantSubmitted'] || registeredEvents['idCheck.onApplicantSubmitted']).toBeDefined();
    });

    // Simulate SDK firing onApplicantSubmitted
    const submitCallback =
      registeredEvents['onApplicantSubmitted'] || registeredEvents['idCheck.onApplicantSubmitted'];

    await act(async () => {
      submitCallback();
    });

    // Verify submitted banner is shown
    expect(
      screen.getByText("Verification submitted. We're checking your document.")
    ).toBeInTheDocument();

    // Verify client did NOT directly mark as Verified
    expect(screen.queryByText('Identity Verified')).not.toBeInTheDocument();
  });

  it('5. authoritative final UI state comes strictly from GET /api/identity/status', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<IdentityVerification />);

    await screen.findByText('Select France Identity Document');
    const startButton = screen.getByRole('button', { name: /Start Secure Verification/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(registeredEvents['onApplicantSubmitted']).toBeDefined();
    });

    // Mock the backend status to return verified on next poll (simulating webhook arrival)
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          status: 'verified',
          isCurrent: true,
        },
      },
    });

    // Trigger submitted event and advance polling timer
    act(() => {
      registeredEvents['onApplicantSubmitted']();
    });

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByText('Identity Verified')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue to Hub/i })).toBeInTheDocument();
    });
  });

  it('6. access-token expiration handler requests a refreshed token via POST /api/identity/session', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<IdentityVerification />);

    await screen.findByText('Select France Identity Document');
    const startButton = screen.getByRole('button', { name: /Start Secure Verification/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(capturedTokenExpirationHandler).toBeInstanceOf(Function);
    });

    // Configure refresh response
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          accessToken: 'fresh-refreshed-sdk-token',
        },
      },
    });

    let refreshedToken = '';
    await act(async () => {
      refreshedToken = await capturedTokenExpirationHandler!();
    });

    expect(refreshedToken).toBe('fresh-refreshed-sdk-token');
    expect(api.post).toHaveBeenCalledWith('/identity/session', {
      documentType: 'national_id',
      countryCode: 'FR',
      issuingCountry: 'FR',
      nationality: 'FR',
    });
  });

  it('7. WebSDK error event displays safe error UI', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<IdentityVerification />);

    await screen.findByText('Select France Identity Document');
    const startButton = screen.getByRole('button', { name: /Start Secure Verification/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(registeredEvents['onError'] || registeredEvents['idCheck.onError']).toBeDefined();
    });

    const errorCallback =
      registeredEvents['onError'] || registeredEvents['idCheck.onError'];

    act(() => {
      errorCallback({ message: 'Camera permission denied by browser.' });
    });

    expect(await screen.findByText('Camera permission denied by browser.')).toBeInTheDocument();
  });

  it('8. component unmount safely stops status polling and cleans up timers', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { unmount } = render(<IdentityVerification />);

    await screen.findByText('Select France Identity Document');
    const startButton = screen.getByRole('button', { name: /Start Secure Verification/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(registeredEvents['onApplicantSubmitted']).toBeDefined();
    });

    act(() => {
      registeredEvents['onApplicantSubmitted']();
    });

    const callCountBeforeUnmount = vi.mocked(api.get).mock.calls.length;

    // Unmount the component
    unmount();

    // Advance timers by 30 seconds
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    // Polling must have ceased upon unmount
    const callCountAfterUnmount = vi.mocked(api.get).mock.calls.length;
    expect(callCountAfterUnmount).toBe(callCountBeforeUnmount);
  });
});
