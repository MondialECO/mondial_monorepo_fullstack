import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Phase4Complete } from "@/components/creator/phase4/Phase4Complete";
import type { ComputedJourneyStatus, ComputedPhaseState } from "@/types/creator/journey-api";

const mockAdvancePhase = vi.fn();
const journeyApi = vi.hoisted(() => ({
  completeOffer: vi.fn(),
  get: vi.fn(),
}));

vi.mock("@/lib/api-creator-journey", () => ({ creatorJourneyApi: journeyApi }));
vi.mock("@/providers/CreatorProgressProvider", () => ({
  useCreatorProgress: () => ({ advancePhase: mockAdvancePhase }),
}));

function createStatus(
  phase4Status: ComputedPhaseState["status"],
  phase5Status?: ComputedPhaseState["status"],
): ComputedJourneyStatus {
  return {
    phase1: { status: "completed", currentStep: 1 },
    phase2: { status: "completed", currentStep: 12 },
    phase3: { status: "completed", currentStep: 6 },
    phase4: { status: phase4Status, currentStep: phase4Status === "completed" ? 4 : 2 },
    phase5: phase5Status ? { status: phase5Status, currentStep: 1 } : (undefined as unknown as ComputedPhaseState),
    phase6: { status: "locked", currentStep: 1 },
  };
}

describe("Phase4Complete Gate & Eligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    journeyApi.completeOffer.mockResolvedValue({ success: true });
  });

  it("1. phase4 = completed, phase5 = available -> Continue enabled", async () => {
    journeyApi.get.mockResolvedValue({
      computedStatus: createStatus("completed", "available"),
    });

    render(<Phase4Complete ideaId="idea-1" onContinue={vi.fn()} />);

    const continueBtn = await screen.findByRole("button", { name: /continue to the crossroads/i });
    expect(continueBtn).toBeEnabled();
  });

  it("2. phase4 = completed, phase5 = in_progress -> Continue enabled", async () => {
    journeyApi.get.mockResolvedValue({
      computedStatus: createStatus("completed", "in_progress"),
    });

    render(<Phase4Complete ideaId="idea-1" onContinue={vi.fn()} />);

    const continueBtn = await screen.findByRole("button", { name: /continue to the crossroads/i });
    expect(continueBtn).toBeEnabled();
  });

  it("3. phase4 = completed, phase5 = completed -> Continue enabled", async () => {
    journeyApi.get.mockResolvedValue({
      computedStatus: createStatus("completed", "completed"),
    });

    render(<Phase4Complete ideaId="idea-1" onContinue={vi.fn()} />);

    const continueBtn = await screen.findByRole("button", { name: /continue to the crossroads/i });
    expect(continueBtn).toBeEnabled();
  });

  it("4. phase4 = completed, phase5 = locked -> Continue disabled", async () => {
    journeyApi.get.mockResolvedValue({
      computedStatus: createStatus("completed", "locked"),
    });

    render(<Phase4Complete ideaId="idea-1" onContinue={vi.fn()} />);

    const continueBtn = await screen.findByRole("button", { name: /continue to the crossroads/i });
    expect(continueBtn).toBeDisabled();
    expect(screen.getByText("Complete all three steps to unlock Phase 5.")).toBeInTheDocument();
  });

  it("5. phase4 != completed, phase5 = available/in_progress -> Continue disabled", async () => {
    journeyApi.get.mockResolvedValue({
      computedStatus: createStatus("in_progress", "available"),
    });

    render(<Phase4Complete ideaId="idea-1" onContinue={vi.fn()} />);

    const continueBtn = await screen.findByRole("button", { name: /continue to the crossroads/i });
    expect(continueBtn).toBeDisabled();
  });

  it("6. phase5 missing / undefined -> Continue disabled", async () => {
    journeyApi.get.mockResolvedValue({
      computedStatus: createStatus("completed", undefined),
    });

    render(<Phase4Complete ideaId="idea-1" onContinue={vi.fn()} />);

    const continueBtn = await screen.findByRole("button", { name: /continue to the crossroads/i });
    expect(continueBtn).toBeDisabled();
  });

  it("7. clicking enabled Continue advances phase and triggers onContinue callback", async () => {
    journeyApi.get.mockResolvedValue({
      computedStatus: createStatus("completed", "in_progress"),
    });
    const onContinueMock = vi.fn();

    render(<Phase4Complete ideaId="idea-1" onContinue={onContinueMock} />);

    const continueBtn = await screen.findByRole("button", { name: /continue to the crossroads/i });
    expect(continueBtn).toBeEnabled();

    fireEvent.click(continueBtn);

    expect(mockAdvancePhase).toHaveBeenCalledWith(4);
    expect(onContinueMock).toHaveBeenCalled();
  });

  it("shows the server 409 with a refresh action and skips the status GET", async () => {
    journeyApi.completeOffer.mockRejectedValue({
      response: {
        status: 409,
        data: { message: "You've switched to a different idea elsewhere — refresh this page and try again." },
      },
    });

    render(<Phase4Complete ideaId="stale-idea" onContinue={vi.fn()} />);

    expect(await screen.findByText("You've switched to a different idea elsewhere — refresh this page and try again."))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh page" })).toBeInTheDocument();
    await waitFor(() => expect(journeyApi.completeOffer).toHaveBeenCalledWith("stale-idea"));
    expect(journeyApi.get).not.toHaveBeenCalled();
  });
});
