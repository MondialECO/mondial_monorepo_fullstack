import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Signup from "@/app/(auth)/signup/page";
import SignupOnboardingContent from "@/app/(auth)/signup/onboarding/content";
import AuthGuard from "@/components/layout/AuthGuard";
import { UserRole, resolvePostLoginRedirect } from "@/lib/roles";
import * as apiAuth from "@/lib/api-auth";
import { SIGNUP_ROLE_STORAGE_KEY } from "@/lib/signup-role";

const push = vi.fn();
const replace = vi.fn();
let currentPathname = "/signup";
let authState: any = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => currentPathname,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/_providers/AuthProvider", () => ({
  useAuth: () => authState,
}));

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-auth")>("@/lib/api-auth");
  return {
    ...actual,
    registerApi: vi.fn(),
  };
});

describe("Universal Onboarding Entry Clean Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    currentPathname = "/signup";
    authState = {
      user: null,
      isLoading: false,
      isBackendVerified: false,
      establishSession: vi.fn().mockImplementation(async ({ token, user }) => {
        authState.user = user;
        authState.token = token;
        authState.isBackendVerified = true;
        return user;
      }),
      login: vi.fn(),
      logout: vi.fn(),
    };
  });

  it("1. Signup submits credentials, receives canonical session, establishes session, and replaces URL to /onboarding without tokens", async () => {
    localStorage.setItem(SIGNUP_ROLE_STORAGE_KEY, "creator");
    const mockAuthResponse = {
      data: {
        token: "canonical-jwt-access-token",
        user: {
          id: "creator-user-123",
          name: "Test Creator",
          roles: ["Creator"],
          onboarding: { phase: 0 },
        },
      },
    };
    vi.mocked(apiAuth.registerApi).mockResolvedValue(mockAuthResponse as any);

    render(<Signup />);

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole("button", { name: /Sign Up/i });

    fireEvent.change(nameInput, { target: { value: "Test Creator" } });
    fireEvent.change(emailInput, { target: { value: "creator@mondial.eco" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiAuth.registerApi).toHaveBeenCalledWith({
        fullName: "Test Creator",
        email: "creator@mondial.eco",
        password: "Password123!",
        role: "Creator",
      });
    });

    await waitFor(() => {
      expect(authState.establishSession).toHaveBeenCalledWith({
        token: "canonical-jwt-access-token",
        user: mockAuthResponse.data.user,
      });
      // Replaced cleanly with /onboarding, zero token in query string
      expect(replace).toHaveBeenCalledWith("/onboarding");
      expect(push).not.toHaveBeenCalledWith(expect.stringContaining("?token="));
    });
  });

  it("2. Handles all 4 primary roles (Creator, Entrepreneur, Investor, ServiceProvider) with phase 0", async () => {
    const roles: Array<{ roleId: string; backendRole: string; expectedRoleEnum: string }> = [
      { roleId: "creator", backendRole: "Creator", expectedRoleEnum: "Creator" },
      { roleId: "entrepreneur", backendRole: "Entrepreneur", expectedRoleEnum: "Entrepreneur" },
      { roleId: "investor", backendRole: "Investor", expectedRoleEnum: "Investor" },
      { roleId: "service-provider", backendRole: "ServiceProvider", expectedRoleEnum: "ServiceProvider" },
    ];

    for (const r of roles) {
      vi.clearAllMocks();
      localStorage.clear();
      authState.user = null;
      authState.token = null;
      authState.isBackendVerified = false;
      localStorage.setItem(SIGNUP_ROLE_STORAGE_KEY, r.roleId);

      const mockResponse = {
        data: {
          token: `token-${r.roleId}`,
          user: {
            id: `user-${r.roleId}`,
            name: `User ${r.roleId}`,
            roles: [r.expectedRoleEnum],
            onboarding: { phase: 0 },
          },
        },
      };
      vi.mocked(apiAuth.registerApi).mockResolvedValue(mockResponse as any);

      const { unmount } = render(<Signup />);
      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: `User ${r.roleId}` } });
      fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: `${r.roleId}@mondial.eco` } });
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "Password123!" } });
      fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

      await waitFor(() => {
        expect(apiAuth.registerApi).toHaveBeenCalledWith({
          fullName: `User ${r.roleId}`,
          email: `${r.roleId}@mondial.eco`,
          password: "Password123!",
          role: r.backendRole,
        });
        expect(replace).toHaveBeenCalledWith("/onboarding");
      });
      unmount();
    }
  });

  it("3. /onboarding remains protected by AuthGuard: unauthenticated redirected to /login", async () => {
    currentPathname = "/onboarding";
    authState = { user: null, isLoading: false, isBackendVerified: false };

    render(
      <AuthGuard>
        <div>Onboarding Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/login");
      expect(screen.queryByText("Onboarding Content")).not.toBeInTheDocument();
    });
  });

  it("4. /onboarding allows authenticated newly registered user (phase 0) without redirecting to dashboard", async () => {
    currentPathname = "/onboarding";
    authState = {
      user: {
        id: "new-user-1",
        name: "New User",
        role: UserRole.CREATOR,
        roles: [UserRole.CREATOR],
        onboardingPhase: 0,
      },
      isLoading: false,
      isBackendVerified: true,
    };

    render(
      <AuthGuard>
        <div>Onboarding Content</div>
      </AuthGuard>
    );

    expect(screen.getByText("Onboarding Content")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("5. Legacy /signup/onboarding route: if authenticated, redirects cleanly to /onboarding", async () => {
    authState = {
      user: {
        id: "auth-user",
        name: "Auth User",
        role: UserRole.CREATOR,
        onboardingPhase: 0,
      },
      isLoading: false,
      isBackendVerified: true,
    };

    render(<SignupOnboardingContent />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("6. Legacy /signup/onboarding route: if unauthenticated, redirects cleanly to /login", async () => {
    authState = {
      user: null,
      isLoading: false,
      isBackendVerified: false,
    };

    render(<SignupOnboardingContent />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
  });

  it("7. Existing login redirect behavior is unaffected: resolvePostLoginRedirect sends phase 0 to /onboarding", () => {
    const userPhase0 = {
      id: "u1",
      role: UserRole.CREATOR,
      roles: [UserRole.CREATOR],
      onboardingPhase: 0,
    };
    expect(resolvePostLoginRedirect(userPhase0)).toBe("/onboarding");

    const userPhase1 = {
      id: "u2",
      role: UserRole.CREATOR,
      roles: [UserRole.CREATOR],
      onboardingPhase: 1,
    };
    expect(resolvePostLoginRedirect(userPhase1)).toBe("/dashboard/creator");
  });
});
