import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CreatorPhaseGuard from "@/components/layout/CreatorPhaseGuard";

const mockReplace = vi.fn();
let currentPathname = "/dashboard/creator/investors";
let mockState = {
  isLoading: false,
  state: {
    journeyState: {
      phase1: { status: "completed" },
      phase2: { status: "completed" },
      phase3: { status: "completed" },
      phase4: { status: "completed" },
      phase5: { status: "in_progress", selectedPath: "build" },
      phase6: { status: "locked" },
    },
  },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => currentPathname,
}));

vi.mock("@/providers/CreatorProgressProvider", () => ({
  useCreatorProgress: () => mockState,
}));

describe("CreatorPhaseGuard", () => {
  it("allows incomplete Build-path Creators to access /dashboard/creator/investors", () => {
    mockReplace.mockClear();
    currentPathname = "/dashboard/creator/investors";
    mockState = {
      isLoading: false,
      state: {
        journeyState: {
          phase1: { status: "completed" },
          phase2: { status: "completed" },
          phase3: { status: "completed" },
          phase4: { status: "completed" },
          phase5: { status: "in_progress", selectedPath: "build" },
          phase6: { status: "locked" },
        },
      },
    };

    render(
      <CreatorPhaseGuard>
        <div>Readiness Content</div>
      </CreatorPhaseGuard>
    );

    expect(screen.getByText("Readiness Content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("blocks Creators on earlier locked phases from accessing /dashboard/creator/investors", () => {
    mockReplace.mockClear();
    currentPathname = "/dashboard/creator/investors";
    mockState = {
      isLoading: false,
      state: {
        journeyState: {
          phase1: { status: "completed" },
          phase2: { status: "in_progress" },
          phase3: { status: "locked" },
          phase4: { status: "locked" },
          phase5: { status: "locked", selectedPath: null as unknown as string },
          phase6: { status: "locked" },
        },
      },
    };

    render(
      <CreatorPhaseGuard>
        <div>Readiness Content</div>
      </CreatorPhaseGuard>
    );

    expect(screen.queryByText("Readiness Content")).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/dashboard/creator");
  });

  it("blocks Sell-path Creators with locked phase 6 from accessing /dashboard/creator/investors", () => {
    mockReplace.mockClear();
    currentPathname = "/dashboard/creator/investors";
    mockState = {
      isLoading: false,
      state: {
        journeyState: {
          phase1: { status: "completed" },
          phase2: { status: "completed" },
          phase3: { status: "completed" },
          phase4: { status: "completed" },
          phase5: { status: "in_progress", selectedPath: "sell" },
          phase6: { status: "locked" },
        },
      },
    };

    render(
      <CreatorPhaseGuard>
        <div>Readiness Content</div>
      </CreatorPhaseGuard>
    );

    expect(screen.queryByText("Readiness Content")).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/dashboard/creator");
  });
});
