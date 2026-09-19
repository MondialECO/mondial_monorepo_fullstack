import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { CrossroadsPathB } from "@/components/creator/phase5/CrossroadsPathB";
import { creatorJourneyApi } from "@/lib/api-creator-journey";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockRefreshAuthMe = vi.fn();
vi.mock("@/app/_providers/AuthProvider", () => ({
  useAuth: () => ({
    refreshAuthMe: mockRefreshAuthMe,
    user: { id: "user-1", role: "Creator" },
  }),
}));

vi.mock("@/lib/api-creator-journey", () => ({
  creatorJourneyApi: {
    levelUp: vi.fn(),
  },
}));

describe("CrossroadsPathB", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Build Yourself confirmation with project summary and deferred funding", () => {
    const onBack = vi.fn();
    render(
      <CrossroadsPathB
        ideaId="idea-a"
        projectName="CleanWater AI"
        formationContext={{ selectedType: "SAS-U", recommendedType: "SAS" }}
        onBack={onBack}
        onChanged={vi.fn()}
      />
    );

    // Title and Body
    expect(screen.getByText("Ready to build your company?")).toBeInTheDocument();
    expect(screen.getByText(/Your Creator project will become the foundation of your Entrepreneur workspace/i)).toBeInTheDocument();

    // Summary fields
    expect(screen.getAllByText("CleanWater AI").length).toBeGreaterThan(0);
    expect(screen.getByText("SAS-U")).toBeInTheDocument();
    expect(screen.getByText("100% Founder")).toBeInTheDocument();
    expect(screen.getByText(/Stage 11 · Level-Up Continuity Bridge/i)).toBeInTheDocument();

    // Actions
    expect(screen.getByRole("button", { name: /Continue as Entrepreneur/i })).toBeInTheDocument();

    // Verify obsolete inputs are NOT present
    expect(screen.queryByLabelText("Your funding target")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Holder")).not.toBeInTheDocument();
  });

  it("uses recommended formation structure if selectedType is absent", () => {
    render(
      <CrossroadsPathB
        ideaId="idea-b"
        projectName="SolarEdge"
        formationContext={{ recommendedType: "SARL" }}
        onChanged={vi.fn()}
      />
    );

    expect(screen.getAllByText("SolarEdge").length).toBeGreaterThan(0);
    expect(screen.getByText("SARL")).toBeInTheDocument();
    expect(screen.getByText("100% Founder")).toBeInTheDocument();
  });

  it("preserves historical Path B ownership if present in initial state", () => {
    render(
      <CrossroadsPathB
        ideaId="idea-c"
        projectName="Legacy Project"
        initial={{
          companyFormation: {
            selectedType: "SAS",
            ownership: [
              { holder: "Founder", percent: 80, isFounder: true, isEsop: false },
              { holder: "Pool", percent: 20, isFounder: false, isEsop: false },
            ],
          },
        }}
        onChanged={vi.fn()}
      />
    );

    expect(screen.getByText("Founder: 80%, Pool: 20%")).toBeInTheDocument();
  });

  it("renders already leveled-up state when isLeveledUp is true", () => {
    render(
      <CrossroadsPathB
        ideaId="idea-d"
        projectName="Already Entrepreneur"
        isLeveledUp={true}
        onChanged={vi.fn()}
      />
    );

    expect(screen.getByText("Project already moved to Entrepreneur workspace")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open Entrepreneur Workspace/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continue as Entrepreneur/i })).not.toBeInTheDocument();
  });

  it("handles Level Up confirmation flow safely and prevents double submission", async () => {
    let resolveLevelUp: (value: any) => void;
    const levelUpPromise = new Promise<any>((resolve) => {
      resolveLevelUp = resolve;
    });
    vi.mocked(creatorJourneyApi.levelUp).mockReturnValue(levelUpPromise as any);

    render(
      <CrossroadsPathB
        ideaId="idea-flow"
        projectName="Flow Venture"
        formationContext={{ selectedType: "SAS" }}
        onChanged={vi.fn()}
      />
    );

    const cta = screen.getByRole("button", { name: /Continue as Entrepreneur/i });
    fireEvent.click(cta);

    // Should immediately call levelUp and enter loading state
    expect(creatorJourneyApi.levelUp).toHaveBeenCalledWith("idea-flow");
    expect(screen.getByText(/Connecting venture to Entrepreneur workspace…/i)).toBeInTheDocument();
    expect(cta).toBeDisabled();

    // Resolve Level Up
    resolveLevelUp!({
      companyId: "comp-123",
      redirectTo: "/dashboard/entrepreneur",
      roles: ["Creator", "Entrepreneur"],
    });

    await waitFor(() => {
      expect(mockRefreshAuthMe).toHaveBeenCalled();
    });
  });
});
