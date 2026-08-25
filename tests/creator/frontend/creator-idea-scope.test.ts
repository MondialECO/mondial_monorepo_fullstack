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
    const response = {
      data: { data: { journey: { ideaVersion: 7 } } },
      headers: { "x-creator-idea-version": "7" },
    };
    api.get.mockResolvedValue(response);
    api.post.mockResolvedValue(response);
    api.patch.mockResolvedValue(response);
  });

  it("attaches the exact ideaId and expected version on Creator writes", async () => {
    const ideaId = "idea-123";
    const readConfig = { params: { ideaId } };
    const writeConfig = { params: { ideaId, expectedVersion: 7 } };

    // Writes are intentionally blocked until journey hydration supplies the
    // optimistic-concurrency version for this exact idea workspace.
    await creatorJourneyApi.get(ideaId);

    await creatorJourneyApi.generateFormation(ideaId);
    await creatorJourneyApi.selectFormationType("SAS", ideaId);
    await creatorJourneyApi.declareFormationSkills(["Finance"], undefined, ideaId);
    await creatorJourneyApi.pricingInsights(ideaId);
    await creatorJourneyApi.setPricing("subscription", [], ideaId);
    await creatorJourneyApi.resourceCalculator([], [], ideaId);
    await creatorJourneyApi.gtmSetup({ webPresence: [], targetAudiences: [], channelMix: [] }, ideaId);
    await creatorJourneyApi.completeOffer(ideaId);
    await creatorJourneyApi.ipValuation(ideaId);
    await creatorJourneyApi.setCrossroadsPath("sell", ideaId);
    await creatorJourneyApi.publishMarketplace({ ndaRequired: true, askingPrice: 28000, audience: "public" }, ideaId);
    await creatorJourneyApi.companyFormation({ selectedType: "SAS", ownership: [] }, ideaId);
    await creatorJourneyApi.seedFunding({ totalAsk: 50000, useOfFunds: [], investorTypesTargeted: [] }, ideaId);

    expect(api.post).toHaveBeenCalledWith("/creator/ai/formation-generator/start", {}, writeConfig);
    expect(api.patch).toHaveBeenCalledWith("/creator/formation/select-type", { selectedType: "SAS" }, writeConfig);
    expect(api.patch).toHaveBeenCalledWith(
      "/creator/formation/skills",
      { youHave: ["Finance"], cofounder: null },
      writeConfig,
    );
    expect(api.get).toHaveBeenCalledWith("/creator/offer/pricing-insights", readConfig);
    expect(api.post).toHaveBeenCalledWith(
      "/creator/offer/pricing",
      { pricingModel: "subscription", tiers: [] },
      writeConfig,
    );
    expect(api.post).toHaveBeenCalledWith(
      "/creator/offer/resource-calculator",
      { teamRequirements: [], saasStack: [] },
      writeConfig,
    );
    expect(api.post).toHaveBeenCalledWith(
      "/creator/offer/gtm-setup",
      { webPresence: [], targetAudiences: [], channelMix: [] },
      writeConfig,
    );
    expect(api.patch).toHaveBeenCalledWith("/creator/offer/complete", {}, writeConfig);
    expect(api.post).toHaveBeenCalledWith("/creator/ip-valuation", {}, writeConfig);
    expect(api.patch).toHaveBeenCalledWith("/creator/journey/phase5/path", { path: "sell" }, writeConfig);
    expect(api.post).toHaveBeenCalledWith("/creator/marketplace/publish", { ndaRequired: true, askingPrice: 28000, audience: "public" }, writeConfig);
    expect(api.post).toHaveBeenCalledWith("/creator/company-formation", { selectedType: "SAS", ownership: [] }, writeConfig);
    expect(api.post).toHaveBeenCalledWith("/creator/seed-funding", { totalAsk: 50000, useOfFunds: [], investorTypesTargeted: [] }, writeConfig);
  });

  it("advances a workspace version from an Axios case-preserved response header", async () => {
    const ideaId = "idea-header-case";
    api.get.mockResolvedValueOnce({
      data: { data: { journey: { ideaVersion: 1 } } },
      headers: {},
    });
    api.patch.mockResolvedValueOnce({
      data: { data: { journey: { ideaVersion: 1 } } },
      headers: { "X-Creator-Idea-Version": "2" },
    });

    await creatorJourneyApi.get(ideaId);
    await creatorJourneyApi.setCrossroadsPath("build", ideaId);
    await creatorJourneyApi.companyFormation({ selectedType: "SAS", ownership: [] }, ideaId);

    expect(api.patch).toHaveBeenCalledWith(
      "/creator/journey/phase5/path",
      { path: "build" },
      { params: { ideaId, expectedVersion: 1 } },
    );
    expect(api.post).toHaveBeenCalledWith(
      "/creator/company-formation",
      { selectedType: "SAS", ownership: [] },
      { params: { ideaId, expectedVersion: 2 } },
    );
  });
});
