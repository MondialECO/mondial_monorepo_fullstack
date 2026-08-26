import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CreatorPhaseGuard from "@/components/layout/CreatorPhaseGuard";
import SmartGatePage from "@/app/dashboard/creator/phase-2/page";
import { getNextCreatorAction } from "@/lib/creator-state-resolver";
import { CreatorJourneyState } from "@/types/creator/creator-journey";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let currentPathname = "/dashboard/creator/phase-2/clarifier";
let mockProgressState = {
  isLoading: false,
  state: {
    journeyState: {
      phase1: { status: "completed", currentStep: 1, completedSteps: [] },
      phase2: { status: "in_progress", currentStep: 6, completedSteps: [], selectedEntryPath: "already_have_idea", clarifierSessionId: "session-1", chatMessages: [] },
      phase3: { status: "locked", currentStep: 1, completedSteps: [] },
      phase4: { status: "locked", currentStep: 1, completedSteps: [] },
      phase5: { status: "locked", currentStep: 1, completedSteps: [], selectedPath: null },
      phase6: { status: "locked", currentStep: 1, completedSteps: [] },
    },
  },
  setEntryPath: vi.fn(),
  updateProject: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => currentPathname,
}));

vi.mock("@/providers/CreatorProgressProvider", () => ({
  useCreatorProgress: () => mockProgressState,
}));

describe("Creator Clarifier Routing & Resolver Semantics", () => {
  it("resolves step 6 in_progress to canonical /dashboard/creator/phase-2/clarifier route", () => {
    const journeyState: CreatorJourneyState = {
      phase1: { status: "completed", currentStep: 1, completedSteps: [] },
      phase2: {
        status: "in_progress",
        currentStep: 6,
        completedSteps: [],
        selectedEntryPath: "already_have_idea",
        clarifierSessionId: "session-1",
        chatMessages: [],
      },
      phase3: { status: "locked", currentStep: 1, completedSteps: [] },
      phase4: { status: "locked", currentStep: 1, completedSteps: [] },
      phase5: { status: "locked", currentStep: 1, completedSteps: [], selectedPath: null },
      phase6: { status: "locked", currentStep: 1, completedSteps: [] },
    };

    const action = getNextCreatorAction(journeyState);
    expect(action.route).toBe("/dashboard/creator/phase-2/clarifier");
    expect(action.targetPhase).toBe(2);
  });

  it("permits direct access to canonical /dashboard/creator/phase-2/clarifier via CreatorPhaseGuard when phase 2 is unlocked", () => {
    mockReplace.mockClear();
    currentPathname = "/dashboard/creator/phase-2/clarifier";

    render(
      <CreatorPhaseGuard>
        <div>Clarifier Content Loaded</div>
      </CreatorPhaseGuard>
    );

    expect(screen.getByText("Clarifier Content Loaded")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects locked phase 2 users to /dashboard/creator instead of throwing 404", () => {
    mockReplace.mockClear();
    currentPathname = "/dashboard/creator/phase-2/clarifier";
    mockProgressState = {
      ...mockProgressState,
      state: {
        ...mockProgressState.state,
        journeyState: {
          ...mockProgressState.state.journeyState,
          phase2: { ...mockProgressState.state.journeyState.phase2, status: "locked" },
        },
      },
    };

    render(
      <CreatorPhaseGuard>
        <div>Clarifier Content Loaded</div>
      </CreatorPhaseGuard>
    );

    expect(screen.queryByText("Clarifier Content Loaded")).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/dashboard/creator");
  });

  it("navigates from Phase 2 Smart Gate to canonical /dashboard/creator/phase-2/clarifier route", () => {
    mockPush.mockClear();

    render(<SmartGatePage />);

    const sharptenButton = screen.getByRole("button", { name: /lets Sharper it/i });
    fireEvent.click(sharptenButton);

    expect(mockPush).toHaveBeenCalledWith("/dashboard/creator/phase-2/clarifier");
  });
});
