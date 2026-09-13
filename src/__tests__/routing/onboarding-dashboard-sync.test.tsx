import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AuthGuard from "@/components/layout/AuthGuard";
import OnboardingHubPage from "@/app/onboarding/page";
import OnboardingEmailPage from "@/app/onboarding/email/page";
import OnboardingPhonePage from "@/app/onboarding/phone/page";
import { UserRole } from "@/lib/roles";
import * as apiModule from "@/lib/axios";

const push = vi.fn();
const replace = vi.fn();
let currentPathname = "/dashboard/creator";
let authState: any = {};
let onboardingContextMock: any = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => currentPathname,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/_providers/AuthProvider", () => ({
  useAuth: () => authState,
}));

vi.mock("@/providers/OnboardingProvider", () => ({
  useOnboarding: () => onboardingContextMock,
}));

vi.mock("@/lib/axios", () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

describe("Onboarding ↔ Dashboard Single Source of Truth & Loop Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentPathname = "/dashboard/creator";
    authState = {
      user: {
        id: "user-123",
        name: "Creator User",
        role: UserRole.CREATOR,
        roles: [UserRole.CREATOR],
        onboardingPhase: 0,
      },
      isLoading: false,
      isBackendVerified: true,
      refreshAuthMe: vi.fn().mockImplementation(async () => {
        return authState.user;
      }),
      refreshCurrentUser: vi.fn().mockImplementation(async () => {
        return authState.user;
      }),
    };

    onboardingContextMock = {
      status: {
        phase: 0,
        role: "Creator",
        email: "test@mondial.eco",
        phone: "+1234567890",
        items: {
          identity: { key: "identity", verified: false, required: false },
          phone: { key: "phone", verified: false, required: true },
          email: { key: "email", verified: false, required: true },
        },
      },
      isLoading: false,
      isComplete: false,
      items: [],
      nextRequired: null,
      refresh: vi.fn(),
    };
  });

  it("Test A: Cached auth user Phase 0, but backend reports Phase 1 -> AuthGuard refreshes state, user stays on dashboard, NO redirect back", async () => {
    currentPathname = "/dashboard/creator";
    // Client cache has Phase 0
    authState.user = {
      id: "user-123",
      name: "Creator User",
      role: UserRole.CREATOR,
      roles: [UserRole.CREATOR],
      onboardingPhase: 0,
    };

    // Backend /auth/me returns Phase 1
    authState.refreshAuthMe.mockImplementation(async () => {
      authState.user = {
        ...authState.user,
        onboardingPhase: 1,
      };
      return authState.user;
    });

    render(
      <AuthGuard>
        <div data-testid="dashboard-content">Creator Dashboard Loaded</div>
      </AuthGuard>
    );

    // Should refresh auth user with backend
    expect(authState.refreshAuthMe).toHaveBeenCalledTimes(1);

    // User should NOT be redirected to /onboarding
    expect(replace).not.toHaveBeenCalledWith("/onboarding");
    expect(push).not.toHaveBeenCalledWith("/onboarding");

    // Dashboard content renders cleanly
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
    });
  });

  it("Test B: Phase 0 genuinely incomplete -> dashboard access redirects once to onboarding using router.replace", async () => {
    currentPathname = "/dashboard/creator";
    authState.user = {
      id: "user-123",
      name: "Incomplete User",
      role: UserRole.CREATOR,
      roles: [UserRole.CREATOR],
      onboardingPhase: 0,
    };

    // Backend confirms phase is still 0
    authState.refreshAuthMe.mockResolvedValueOnce({
      ...authState.user,
      onboardingPhase: 0,
    });

    render(
      <AuthGuard>
        <div>Should Not Render</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(authState.refreshAuthMe).toHaveBeenCalled();
      expect(replace).toHaveBeenCalledWith("/onboarding");
      expect(replace).toHaveBeenCalledTimes(1);
    });
  });

  it("Test C: Phase 1 direct dashboard -> renders immediately, zero redirects", async () => {
    currentPathname = "/dashboard/creator";
    authState.user = {
      id: "user-123",
      name: "Verified User",
      role: UserRole.CREATOR,
      roles: [UserRole.CREATOR],
      onboardingPhase: 1,
    };

    render(
      <AuthGuard>
        <div data-testid="dashboard-content">Welcome to Dashboard</div>
      </AuthGuard>
    );

    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
  });

  it("Test D: Phase 1 user directly accesses /onboarding -> exactly one redirect to role dashboard", async () => {
    currentPathname = "/onboarding";
    onboardingContextMock.status = {
      phase: 1,
      role: "Creator",
      items: {},
    };
    authState.user = {
      id: "user-123",
      name: "Verified Creator",
      role: UserRole.CREATOR,
      roles: [UserRole.CREATOR],
      onboardingPhase: 1,
    };

    render(<OnboardingHubPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/dashboard/creator");
      expect(replace).toHaveBeenCalledTimes(1);
    });
  });

  it("Test E: Email + Phone completion -> synchronizes auth state and performs exactly one final dashboard navigation", async () => {
    currentPathname = "/onboarding/email";
    authState.user = {
      id: "user-123",
      name: "Creator",
      role: UserRole.CREATOR,
      roles: [UserRole.CREATOR],
      onboardingPhase: 0,
    };

    // Mock send-email-otp and verify-email-otp
    vi.mocked(apiModule.default.post).mockImplementation(async (url: string) => {
      if (url.includes("send-email-otp")) {
        return { data: { success: true, message: "Code sent" } };
      }
      if (url.includes("verify-email-otp")) {
        return { data: { success: true, message: "Email verified" } };
      }
      return { data: { success: true } };
    });

    // Refreshing auth returns promoted user (Phase 1)
    authState.refreshAuthMe.mockResolvedValueOnce({
      ...authState.user,
      onboardingPhase: 1,
    });

    render(<OnboardingEmailPage />);

    const codeInput = screen.getByLabelText(/Verification Code/i);
    fireEvent.change(codeInput, { target: { value: "123456" } });

    const verifyBtn = await screen.findByRole("button", { name: /Verify Code/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(apiModule.default.post).toHaveBeenCalledWith("/onboarding/verify-email-otp", { code: "123456" });
      expect(authState.refreshAuthMe).toHaveBeenCalledTimes(1);
      expect(replace).toHaveBeenCalledWith("/dashboard/creator");
      expect(replace).toHaveBeenCalledTimes(1);
    });
  });
});
