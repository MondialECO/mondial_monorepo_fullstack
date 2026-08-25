import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Phase4Gtm } from "@/components/creator/phase4/Phase4Gtm";

const api = vi.hoisted(() => ({
  spMatches: vi.fn(),
  openWorkroom: vi.fn(),
  gtmSetup: vi.fn(),
}));

vi.mock("@/lib/api-creator-journey", () => ({
  creatorJourneyApi: api,
}));

describe("Phase4Gtm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("surfaces provider lookup failures rather than silently swallowing them", async () => {
    api.spMatches.mockRejectedValueOnce(new Error("provider service unavailable"));
    render(
      <Phase4Gtm
        ideaId="idea-1"
        initial={null}
        benchmark={null}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hire SP Designer" }));

    expect(await screen.findByText("provider service unavailable")).toBeInTheDocument();
    expect(api.spMatches).toHaveBeenCalledWith("branding", "idea-1");
  });
});
