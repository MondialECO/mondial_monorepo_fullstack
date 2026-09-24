import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("@/lib/axios", () => ({ default: api }));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { generateConstructionSnapshot } from "@/lib/api-creator-phase4";
import { generatePricingStrategy } from "@/lib/api-creator-pricing";
import { generateNeedsAnalysis } from "@/lib/api-creator-needs";
import { generateGtmStrategy } from "@/lib/api-creator-gtm";

describe("Creator Formation and Phase 4 idea scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    });
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
    const writeConfig = { params: { ideaId, expectedVersion: 7 } };

    // Writes are intentionally blocked until journey hydration supplies the
    // optimistic-concurrency version for this exact idea workspace.
    await creatorJourneyApi.get(ideaId);

    await creatorJourneyApi.generateFormation(ideaId);
    await creatorJourneyApi.selectFormationType("SAS", ideaId);
    await creatorJourneyApi.declareFormationSkills(["Finance"], undefined, ideaId);
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
    expect(api.post).toHaveBeenCalledWith("/creator/ip-valuation", {}, writeConfig);
    expect(api.patch).toHaveBeenCalledWith("/creator/journey/phase5/path", { path: "sell" }, writeConfig);
    expect(api.post).toHaveBeenCalledWith("/creator/marketplace/publish", { ndaRequired: true, askingPrice: 28000, audience: "public" }, writeConfig);
    expect(api.post).toHaveBeenCalledWith("/creator/company-formation", { selectedType: "SAS", ownership: [] }, writeConfig);
    expect(api.post).toHaveBeenCalledWith("/creator/seed-funding", { totalAsk: 50000, useOfFunds: [], investorTypesTargeted: [] }, writeConfig);
  });

  it("CanonicalPhase4Writes_UseExactIdeaId: verifies canonical Phase 4 requests attach exact ideaId", async () => {
    const canonicalIdeaId = "idea-canonical-456";

    await generateConstructionSnapshot(canonicalIdeaId);
    await generatePricingStrategy(canonicalIdeaId);
    await generateNeedsAnalysis(canonicalIdeaId);
    await generateGtmStrategy(canonicalIdeaId);

    // Verify each call targeted canonical /api/creator/phase4/* endpoint with exact ideaId
    expect(api.post).toHaveBeenCalledWith('/creator/phase4/construction-snapshot/generate', { ideaId: canonicalIdeaId });

    const pricingCall = mockFetch.mock.calls.find(([url]) => String(url).includes('/api/creator/phase4/pricing/generate'));
    expect(pricingCall).toBeDefined();
    expect(JSON.parse(pricingCall![1].body)).toEqual({ ideaId: canonicalIdeaId });

    const needsCall = mockFetch.mock.calls.find(([url]) => String(url).includes('/api/creator/phase4/needs/generate'));
    expect(needsCall).toBeDefined();
    expect(JSON.parse(needsCall![1].body)).toEqual({ ideaId: canonicalIdeaId });

    const gtmCall = mockFetch.mock.calls.find(([url]) => String(url).includes('/api/creator/phase4/gtm/generate'));
    expect(gtmCall).toBeDefined();
    expect(JSON.parse(gtmCall![1].body)).toEqual({ ideaId: canonicalIdeaId });
  });

  it("CanonicalPhase4Writes_UseExpectedVersion_WhenContractRequiresIt", async () => {
    const unhydratedIdea = "idea-unhydrated-789";
    // Attempting a write before version hydration must reject with expected error
    await expect(creatorJourneyApi.updateProject({ name: "Unsaved Project" }, unhydratedIdea)).rejects.toThrow(
      "Idea version is not loaded yet. Refresh and try again."
    );

    // Once hydrated, expectedVersion is strictly required and passed
    api.get.mockResolvedValueOnce({
      data: { data: { journey: { ideaVersion: 42 } } },
      headers: { "x-creator-idea-version": "42" },
    });
    await creatorJourneyApi.get(unhydratedIdea);

    await creatorJourneyApi.updateProject({ name: "Saved Project" }, unhydratedIdea);
    expect(api.patch).toHaveBeenCalledWith(
      "/creator/journey/project",
      { name: "Saved Project" },
      { params: { ideaId: unhydratedIdea, expectedVersion: 42 } }
    );
  });

  it("CanonicalPhase4_DoesNotCallLegacyOfferEndpoints", async () => {
    // Collect all endpoints invoked across all mocks
    const allAxiosUrls: string[] = [
      ...api.get.mock.calls.map(([url]) => String(url)),
      ...api.post.mock.calls.map(([url]) => String(url)),
      ...api.patch.mock.calls.map(([url]) => String(url)),
    ];
    const allFetchUrls: string[] = mockFetch.mock.calls.map(([url]) => String(url));

    const legacyMatches = [...allAxiosUrls, ...allFetchUrls].filter(url => url.includes('/creator/offer'));
    expect(legacyMatches).toEqual([]);
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

  it("propagates version changes across chained single-tab Phase 2 mutations", async () => {
    const ideaId = "idea-phase2-chain";

    // Initial hydration: version = 2
    api.get.mockResolvedValueOnce({
      data: { data: { journey: { ideaVersion: 2 } } },
      headers: { "x-creator-idea-version": "2" },
    });

    // Write 1 (chatMessage): returns version 3
    api.post.mockResolvedValueOnce({
      data: { data: { messages: [], questionIndex: 1, totalQuestions: 6, summaryReady: false } },
      headers: { "x-creator-idea-version": "3" },
    });

    // Write 2 (chatMessage): returns version 4
    api.post.mockResolvedValueOnce({
      data: { data: { messages: [], questionIndex: 2, totalQuestions: 6, summaryReady: false } },
      headers: { "X-Creator-Idea-Version": "4" },
    });

    // Write 3 (finalizeClarifier): returns version 5
    api.post.mockResolvedValueOnce({
      data: { data: { sessionId: "sess-123", summary: {} } },
      headers: { "x-creator-idea-version": "5" },
    });

    // A. Initial hydration
    await creatorJourneyApi.get(ideaId);

    // B. First chatMessage mutation sends expectedVersion=2
    await creatorJourneyApi.chatMessage("First answer", ideaId);
    expect(api.post).toHaveBeenLastCalledWith(
      "/creator/journey/phase2/chat-message",
      { message: "First answer" },
      { params: { ideaId, expectedVersion: 2 } },
    );

    // C. Second chatMessage mutation sends expectedVersion=3
    await creatorJourneyApi.chatMessage("Second answer", ideaId);
    expect(api.post).toHaveBeenLastCalledWith(
      "/creator/journey/phase2/chat-message",
      { message: "Second answer" },
      { params: { ideaId, expectedVersion: 3 } },
    );

    // D. Finalize clarifier mutation sends expectedVersion=4
    await creatorJourneyApi.finalizeClarifier("sess-123", ideaId);
    expect(api.post).toHaveBeenLastCalledWith(
      "/creator/journey/phase2/finalize-clarifier",
      { sessionId: "sess-123" },
      { params: { ideaId, expectedVersion: 4 } },
    );
  });

  it("preserves multi-idea isolation so idea A versions do not overwrite idea B versions", async () => {
    const ideaA = "idea-A";
    const ideaB = "idea-B";

    api.get
      .mockResolvedValueOnce({
        data: { data: { journey: { ideaVersion: 10 } } },
        headers: { "x-creator-idea-version": "10" },
      })
      .mockResolvedValueOnce({
        data: { data: { journey: { ideaVersion: 20 } } },
        headers: { "x-creator-idea-version": "20" },
      });

    api.post.mockResolvedValueOnce({
      data: { data: { messages: [], questionIndex: 1 } },
      headers: { "x-creator-idea-version": "11" },
    });

    await creatorJourneyApi.get(ideaA);
    await creatorJourneyApi.get(ideaB);

    await creatorJourneyApi.chatMessage("Answer on A", ideaA);

    expect(api.post).toHaveBeenLastCalledWith(
      "/creator/journey/phase2/chat-message",
      { message: "Answer on A" },
      { params: { ideaId: ideaA, expectedVersion: 10 } },
    );

    // Write on B must still send ideaB's version (20), not ideaA's updated version (11)
    api.post.mockResolvedValueOnce({
      data: { data: { messages: [], questionIndex: 1 } },
      headers: { "x-creator-idea-version": "21" },
    });

    await creatorJourneyApi.chatMessage("Answer on B", ideaB);

    expect(api.post).toHaveBeenLastCalledWith(
      "/creator/journey/phase2/chat-message",
      { message: "Answer on B" },
      { params: { ideaId: ideaB, expectedVersion: 20 } },
    );
  });
});
