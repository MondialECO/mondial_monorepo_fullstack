import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FullBuyoutDealWorkspace } from "@/components/marketplace/FullBuyoutDealWorkspace";
import { marketplaceProjectsApi, EquityDeal, BuyoutLegalPackage } from "@/lib/api-marketplace-projects";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({
    dealId: "deal_buyout_test_1",
  }),
}));

const mockBuyoutDeal: EquityDeal = {
  id: "deal_buyout_test_1",
  ideaId: "idea_123",
  creatorId: "user_creator",
  entrepreneurId: "user_buyer",
  creatorName: "Jane Creator",
  entrepreneurName: "Alex Buyer",
  projectName: "AI Cloud Engine",
  dealType: "FULL_BUYOUT",
  dealStage: "BUYOUT_TERMS_ACCEPTED",
  status: "ACTIVE",
  conversationId: "conv_123",
  currentTurn: "creator",
  currentRevisionNumber: 1,
  activeTerms: {
    equityPercentage: 0,
    creatorRole: "Advisor",
    cashComponent: 45000,
    vestingEnabled: false,
    vestingMonths: 0,
    cliffMonths: 0,
    responsibilities: [],
    timeCommitment: "Full-time",
  },
  revisions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  buyoutTerms: {
    purchasePrice: 45000,
    handoverPeriodWeeks: 3,
    transitionSupportWeeks: 6,
    includedAssets: ["Production Code", "IP Transfer"],
  },
};

const mockLegalPackage: BuyoutLegalPackage = {
  id: "legal_pkg_1",
  dealId: "deal_buyout_456",
  ideaId: "idea_789",
  projectName: "AI Cloud Engine",
  creatorId: "creator_1",
  creatorName: "Sarah Connor",
  entrepreneurId: "buyer_1",
  entrepreneurName: "John Connor",
  purchasePrice: 45000,
  currency: "EUR",
  handoverPeriodWeeks: 3,
  transitionSupportWeeks: 6,
  includedAssets: ["Production Code", "IP Transfer"],
  jurisdiction: "European Union (Standard Commercial)",
  status: "AWAITING_REVIEW",
  version: 1,
  assignedLegalProviderId: "provider_1",
  assignedLegalProviderName: "Global Tech Legal LLP",
  providerReviewStatus: "REVIEW_COMPLETE",
  creatorApprovedVersion: 0,
  entrepreneurApprovedVersion: 0,
  acceptedBuyoutRevisionNumber: 1,
  assetManifestVersion: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  assetManifest: {
    dealId: "deal_buyout_456",
    ideaId: "idea_789",
    acceptedRevisionNumber: 1,
    purchasePrice: 45000,
    currency: "EUR",
    handoverPeriodWeeks: 3,
    transitionSupportWeeks: 6,
    version: 1,
    manifestHash: "hash_manifest_123",
    assets: [
      {
        assetType: "IP_RIGHTS",
        displayName: "Full Intellectual Property Assignment",
        availabilityStatus: "AVAILABLE_IN_PLATFORM",
        externalTransferRequired: false,
      },
      {
        assetType: "DOMAIN",
        displayName: "Domain aicloudengine.com",
        availabilityStatus: "EXTERNAL_TRANSFER_REQUIRED",
        externalTransferRequired: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  documents: [
    {
      id: "doc_1",
      documentType: "FULL_BUYOUT_AGREEMENT",
      requirementType: "MANDATORY",
      title: "Commercial Buyout Agreement",
      version: 1,
      contentHash: "hash_doc_1",
      status: "REVIEWED",
      contentMarkdown: "# Full Buyout Agreement\n\nTransfer of assets for EUR 45,000.",
      lastUpdated: new Date().toISOString(),
    },
  ],
};

describe("FullBuyoutDealWorkspace & Legal & Transfer UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(marketplaceProjectsApi, "getDeal").mockResolvedValue(mockBuyoutDeal);
    vi.spyOn(marketplaceProjectsApi, "getBuyoutLegalPackage").mockResolvedValue(mockLegalPackage);
    vi.spyOn(marketplaceProjectsApi, "approveBuyoutLegalPackage").mockResolvedValue({
      ...mockLegalPackage,
      creatorApprovedVersion: 1,
      creatorApprovedAt: new Date().toISOString(),
    });
  });

  it("renders the 6-stage lifecycle stepper and identifies Full Buyout without Co-founder elements", async () => {
    render(
      <FullBuyoutDealWorkspace
        dealId="deal_buyout_test_1"
        isCreator={true}
        currentUserId="user_creator"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("AI Cloud Engine")).toBeInTheDocument();
    });

    // Check 6 stages
    expect(screen.getAllByText("Terms").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Legal & Transfer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Signing").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Payment").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Handover").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);

    // Verify no Co-founder / Cap table stages exist
    expect(screen.queryByText("Cap Table")).not.toBeInTheDocument();
    expect(screen.queryByText("Roles & Resp")).not.toBeInTheDocument();
    expect(screen.queryByText("Partnership Activation")).not.toBeInTheDocument();
  });

  it("loads and displays the Legal & Transfer UI when deal is in BUYOUT_TERMS_ACCEPTED", async () => {
    render(
      <FullBuyoutDealWorkspace
        dealId="deal_buyout_test_1"
        isCreator={true}
        currentUserId="user_creator"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Legal & Asset Transfer Review")).toBeInTheDocument();
    });

    // Verify Asset Transfer Manifest is loaded
    expect(screen.getByText("Asset Transfer Manifest")).toBeInTheDocument();
    expect(screen.getByText("Full Intellectual Property Assignment")).toBeInTheDocument();
    expect(screen.getByText("Domain aicloudengine.com")).toBeInTheDocument();

    // Verify Legal Documents are loaded
    expect(screen.getByText("Commercial Buyout Agreement")).toBeInTheDocument();
    expect(screen.getAllByText("Agreed Purchase Price").length).toBeGreaterThan(0);
    expect(screen.getAllByText("€45,000").length).toBeGreaterThan(0);
  });

  it("allows Creator to perform legal approval action", async () => {
    render(
      <FullBuyoutDealWorkspace
        dealId="deal_buyout_test_1"
        isCreator={true}
        currentUserId="user_creator"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Approve Buyout Legal Terms (V1)")).toBeInTheDocument();
    });

    const approveButton = screen.getByText("Approve Buyout Legal Terms (V1)");
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(marketplaceProjectsApi.approveBuyoutLegalPackage).toHaveBeenCalledWith(
        "deal_buyout_test_1",
        { legalPackageVersion: 1 }
      );
    });
  });

  it("allows Entrepreneur to view matching Legal & Transfer state", async () => {
    render(
      <FullBuyoutDealWorkspace
        dealId="deal_buyout_test_1"
        isCreator={false}
        currentUserId="user_buyer"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("AI Cloud Engine")).toBeInTheDocument();
      expect(screen.getByText("Project Creator / Seller:")).toBeInTheDocument();
      expect(screen.getByText("Jane Creator")).toBeInTheDocument();
      expect(screen.getByText("Asset Transfer Manifest")).toBeInTheDocument();
    });
  });
});
