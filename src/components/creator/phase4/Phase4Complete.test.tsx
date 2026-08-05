import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Phase4Complete } from "./Phase4Complete";

const journeyApi = vi.hoisted(() => ({
  completeOffer: vi.fn(),
  get: vi.fn(),
}));

vi.mock("@/lib/api-creator-journey", () => ({ creatorJourneyApi: journeyApi }));
vi.mock("@/providers/CreatorProgressProvider", () => ({
  useCreatorProgress: () => ({ advancePhase: vi.fn() }),
}));

describe("Phase4Complete idea conflict", () => {
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
