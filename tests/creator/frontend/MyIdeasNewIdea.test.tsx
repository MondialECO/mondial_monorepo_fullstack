import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MyIdeasPage from "@/app/dashboard/creator/myideas/page";
import type { IdeaCard } from "@/lib/api-creator-journey";

const { mockJourneyApi, mockPush, mockRefetch } = vi.hoisted(() => ({
  mockJourneyApi: {
    listIdeas: vi.fn(),
    createIdea: vi.fn(),
    setActiveIdea: vi.fn(),
    get: vi.fn(),
  },
  mockPush: vi.fn(),
  mockRefetch: vi.fn(),
}));

vi.mock("@/lib/api-creator-journey", () => ({ creatorJourneyApi: mockJourneyApi }));
vi.mock("next/link", () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
}));

// The active idea has no concept yet (project.exists = false): the page's empty-state branch.
vi.mock("@/providers/CreatorProgressProvider", () => ({
  useCreatorProgress: () => ({
    state: {
      project: { exists: false, name: "", concept: "", branding: {} },
      journeyState: {
        phase1: { status: "completed", currentStep: 1, completedSteps: [] },
        phase2: { status: "in_progress", currentStep: 6, completedSteps: [] },
        phase3: { status: "locked", currentStep: 1, completedSteps: [] },
        phase4: { status: "locked", currentStep: 1, completedSteps: [] },
        phase5: { status: "locked", currentStep: 1, completedSteps: [], selectedPath: null },
        phase6: { status: "locked", currentStep: 1, completedSteps: [] },
      },
      outputs: { financialForecastVersions: [] },
    },
    resetJourney: vi.fn(),
    updateProject: vi.fn(),
    setEntryPath: vi.fn(),
    refetch: mockRefetch,
  }),
}));

const idea = (ideaId: string, isActive: boolean): IdeaCard =>
  ({ ideaId, name: "", concept: "", problem: "", status: "active", isActive, isLeveledUp: false, phaseReached: 2 }) as unknown as IdeaCard;

describe("My Ideas — New idea when the active idea has no concept yet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJourneyApi.listIdeas.mockResolvedValue([idea("idea-active", true), idea("idea-old", false)]);
    mockJourneyApi.createIdea.mockResolvedValue({ ideaId: "idea-new" });
    mockRefetch.mockResolvedValue({ ok: true, activeIdeaId: "idea-new" });
    mockJourneyApi.get.mockResolvedValue({
      journey: { phase2Data: {}, phase5Data: {} },
      computedStatus: {
        phase1: { status: "completed" }, phase2: { status: "in_progress", currentStep: 6 }, phase3: { status: "locked" },
        phase4: { status: "locked" }, phase5: { status: "locked" }, phase6: { status: "locked" },
      },
    });
  });

  it("clicking New idea opens the confirmation, and confirming creates the idea", async () => {
    render(<MyIdeasPage />);

    fireEvent.click(await screen.findByRole("button", { name: /New idea/ }));
    expect(screen.getByText("Start a new idea?")).toBeInTheDocument();
    expect(mockJourneyApi.createIdea).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Yes, start new idea" }));

    await waitFor(() => expect(mockJourneyApi.createIdea).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockRefetch).toHaveBeenCalledWith("idea-new"));
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
  });

  it("Cancel closes the confirmation without creating anything", async () => {
    render(<MyIdeasPage />);

    fireEvent.click(await screen.findByRole("button", { name: /New idea/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Start a new idea?")).toBeNull();
    expect(mockJourneyApi.createIdea).not.toHaveBeenCalled();
  });
});
