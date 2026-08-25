import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Phase4Pricing } from "@/components/creator/phase4/Phase4Pricing";

const api = vi.hoisted(() => ({
  pricingInsights: vi.fn(),
  setPricing: vi.fn(),
}));

vi.mock("@/lib/api-creator-journey", () => ({
  creatorJourneyApi: api,
}));

const forecastInsights = {
  selectedEntryPrice: null,
  forecastContext: { sessionId: "forecast-1", arpu: 30, updatedAt: "2026-08-25T00:00:00Z" },
  recommendation: {
    suggestedEntryPrice: 30,
    source: "forecast_assumption" as const,
    message: "Based on the ARPU used in your current forecast. This is a planning input, not verified market pricing.",
  },
  competitorPricing: {
    available: false as const,
    message: "Competitor pricing data unavailable. Use the recommendation below as a planning estimate, not verified market pricing.",
  },
  marketBenchmark: {
    available: false as const,
    message: "No maintained sector pricing benchmark is available for this idea yet.",
  },
};

describe("Phase4Pricing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.pricingInsights.mockResolvedValue(forecastInsights);
  });

  it("starts with editable empty packages and only applies forecast ARPU on the user's action", async () => {
    render(<Phase4Pricing ideaId="idea-1" onNext={vi.fn()} />);

    expect(screen.getByLabelText("Package 1 price")).toHaveValue(0);
    expect(screen.queryByText("Basic")).not.toBeInTheDocument();
    expect(screen.queryByText("Generic SaaS A")).not.toBeInTheDocument();

    await screen.findByText("Forecast context: €30/month ARPU");
    fireEvent.click(screen.getByRole("button", { name: "Apply to Package 1" }));
    expect(screen.getByLabelText("Package 1 price")).toHaveValue(30);
    expect(screen.getByText("Competitor pricing data unavailable")).toBeInTheDocument();
  });

  it("shows a retryable error instead of silently substituting pricing data", async () => {
    api.pricingInsights.mockRejectedValueOnce(new Error("offline"));
    render(<Phase4Pricing ideaId="idea-1" onNext={vi.fn()} />);

    await screen.findByText("Couldn't load pricing context.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(api.pricingInsights).toHaveBeenCalledTimes(2));
  });
});
