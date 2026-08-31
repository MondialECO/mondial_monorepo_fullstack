import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AuthGuard from "@/components/layout/AuthGuard";
import { UserRole } from "@/lib/roles";

const push = vi.fn();
const replace = vi.fn();
let pathname = "/dashboard/creator/messages";
let authState: {
  user: { id: string; name: string; role: UserRole; roles?: UserRole[]; onboardingPhase: number } | null;
  isLoading: boolean;
  isBackendVerified: boolean;
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => pathname,
}));

vi.mock("@/app/_providers/AuthProvider", () => ({
  useAuth: () => authState,
}));

describe("AuthGuard routing states and multi-role access", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    pathname = "/dashboard/creator/messages";
    authState = {
      user: {
        id: "creator-1",
        name: "Creator",
        role: UserRole.CREATOR,
        roles: [UserRole.CREATOR],
        onboardingPhase: 1,
      },
      isLoading: false,
      isBackendVerified: true,
    };
  });

  it("AuthLoading_DoesNotTrigger404", async () => {
    authState = { user: null, isLoading: true, isBackendVerified: false };
    render(<AuthGuard><div>protected content</div></AuthGuard>);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(push).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    });
  });

  it("phase-one-complete Creator stays on a valid nested route", async () => {
    render(<AuthGuard><div>protected content</div></AuthGuard>);

    expect(screen.getByText("protected content")).toBeInTheDocument();
    await waitFor(() => {
      expect(push).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    });
  });

  it("wrong-role access redirects to the authenticated role dashboard", async () => {
    pathname = "/dashboard/investor/pipeline";
    render(<AuthGuard><div>protected content</div></AuthGuard>);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard/creator");
    });
  });

  it("an incomplete user is sent to universal onboarding", async () => {
    authState.user!.onboardingPhase = 0;
    render(<AuthGuard><div>protected content</div></AuthGuard>);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("multi-role Entrepreneur + ServiceProvider can access /dashboard/serviceprovider", async () => {
    pathname = "/dashboard/serviceprovider";
    authState.user = {
      id: "sp-ent-1",
      name: "Entrepreneur SP",
      role: UserRole.ENTREPRENEUR, // Primary role is Entrepreneur
      roles: [UserRole.ENTREPRENEUR, UserRole.SERVICE_PROVIDER], // Possesses ServiceProvider
      onboardingPhase: 1,
    };

    render(<AuthGuard><div>sp dashboard content</div></AuthGuard>);

    expect(screen.getByText("sp dashboard content")).toBeInTheDocument();
    await waitFor(() => {
      expect(push).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    });
  });

  it("multi-role Creator + ServiceProvider can access deep /dashboard/serviceprovider/services", async () => {
    pathname = "/dashboard/serviceprovider/services";
    authState.user = {
      id: "sp-creator-1",
      name: "Creator SP",
      role: UserRole.CREATOR,
      roles: [UserRole.CREATOR, UserRole.SERVICE_PROVIDER],
      onboardingPhase: 1,
    };

    render(<AuthGuard><div>sp services content</div></AuthGuard>);

    expect(screen.getByText("sp services content")).toBeInTheDocument();
    await waitFor(() => {
      expect(push).not.toHaveBeenCalled();
    });
  });

  it("multi-role Investor + ServiceProvider can access /dashboard/serviceprovider/workroom", async () => {
    pathname = "/dashboard/serviceprovider/workroom";
    authState.user = {
      id: "sp-inv-1",
      name: "Investor SP",
      role: UserRole.INVESTOR,
      roles: [UserRole.INVESTOR, UserRole.SERVICE_PROVIDER],
      onboardingPhase: 1,
    };

    render(<AuthGuard><div>sp workroom content</div></AuthGuard>);

    expect(screen.getByText("sp workroom content")).toBeInTheDocument();
    await waitFor(() => {
      expect(push).not.toHaveBeenCalled();
    });
  });

  it("Creator-only user is denied and redirected from /dashboard/serviceprovider", async () => {
    pathname = "/dashboard/serviceprovider";
    authState.user = {
      id: "creator-only-1",
      name: "Creator Only",
      role: UserRole.CREATOR,
      roles: [UserRole.CREATOR],
      onboardingPhase: 1,
    };

    render(<AuthGuard><div>sp dashboard content</div></AuthGuard>);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard/creator");
    });
  });

  it("Universal Profile /dashboard/profile is accessible to any possessed role", async () => {
    pathname = "/dashboard/profile";
    authState.user = {
      id: "multi-role-1",
      name: "Multi Role",
      role: UserRole.ENTREPRENEUR,
      roles: [UserRole.ENTREPRENEUR, UserRole.SERVICE_PROVIDER],
      onboardingPhase: 1,
    };

    render(<AuthGuard><div>universal profile</div></AuthGuard>);

    expect(screen.getByText("universal profile")).toBeInTheDocument();
    await waitFor(() => {
      expect(push).not.toHaveBeenCalled();
    });
  });
});
