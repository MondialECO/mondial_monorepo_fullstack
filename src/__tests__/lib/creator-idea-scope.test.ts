import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("@/lib/axios", () => ({ default: api }));

import { creatorJourneyApi } from "@/lib/api-creator-journey";

describe("Creator Formation and Phase 4 idea scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const response = { data: { data: {} } };
    api.get.mockResolvedValue(response);
    api.post.mockResolvedValue(response);
    api.patch.mockResolvedValue(response);
  });

  it("attaches ideaId as a query parameter on all eight core endpoints", async () => {
    const ideaId = "idea-123";
    const config = { params: { ideaId } };

    await creatorJourneyApi.generateFormation(ideaId);
    await creatorJourneyApi.selectFormationType("SAS", ideaId);
    await creatorJourneyApi.declareFormationSkills(["Finance"], undefined, ideaId);
    await creatorJourneyApi.pricingInsights(ideaId);
    await creatorJourneyApi.setPricing("subscription", [], ideaId);
    await creatorJourneyApi.resourceCalculator([], [], ideaId);
    await creatorJourneyApi.gtmSetup({ webPresence: [], targetAudiences: [], channelMix: [] }, ideaId);
    await creatorJourneyApi.completeOffer(ideaId);

    expect(api.post).toHaveBeenCalledWith("/creator/ai/formation-generator/start", {}, config);
    expect(api.patch).toHaveBeenCalledWith("/creator/formation/select-type", { selectedType: "SAS" }, config);
    expect(api.patch).toHaveBeenCalledWith(
      "/creator/formation/skills",
      { youHave: ["Finance"], cofounder: null },
      config,
    );
    expect(api.get).toHaveBeenCalledWith("/creator/offer/pricing-insights", config);
    expect(api.post).toHaveBeenCalledWith(
      "/creator/offer/pricing",
      { pricingModel: "subscription", tiers: [] },
      config,
    );
    expect(api.post).toHaveBeenCalledWith(
      "/creator/offer/resource-calculator",
      { teamRequirements: [], saasStack: [] },
      config,
    );
    expect(api.post).toHaveBeenCalledWith(
      "/creator/offer/gtm-setup",
      { webPresence: [], targetAudiences: [], channelMix: [] },
      config,
    );
    expect(api.patch).toHaveBeenCalledWith("/creator/offer/complete", {}, config);
  });
});
