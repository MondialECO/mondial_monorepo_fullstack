import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AuthGuard from "@/components/layout/AuthGuard";
import { UserRole } from "@/lib/roles";

const push = vi.fn();
const replace = vi.fn();
let pathname = "/dashboard/creator/messages";
let authState: {
  user: { id: string; name: string; role: UserRole; onboardingPhase: number } | null;
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

describe("AuthGuard routing states", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    pathname = "/dashboard/creator/messages";
    authState = {
      user: {
        id: "creator-1",
        name: "Creator",
        role: UserRole.CREATOR,
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
});
