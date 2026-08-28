import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BuyoutLegalReviewScreen } from "@/components/marketplace/BuyoutLegalReviewScreen";
import { BuyoutLegalReviewModal } from "@/components/marketplace/BuyoutLegalReviewModal";
import { BuyoutLegalPackage } from "@/lib/api-marketplace-projects";
import * as apiModule from "@/lib/api-marketplace-projects";

const mockBuyoutLegalPackage: BuyoutLegalPackage = {
  id: "pkg_buyout_1",
  dealId: "deal_buyout_1",
  ideaId: "idea_buyout_1",
  jurisdiction: "European Union (Standard Commercial)",
  version: 1,
  status: "AWAITING_REVIEW",
  providerReviewStatus: "REVIEW_COMPLETE",
  assignedLegalProviderId: "sp_legal_1",
  assignedLegalProviderName: "Global Tech Legal LLP",
  providerReviewedAt: new Date().toISOString(),
  providerReviewNotes: "All buyout documents verified against accepted terms.",
  creatorApprovedVersion: 0,
  creatorApprovedAt: null,
  entrepreneurApprovedVersion: 0,
  entrepreneurApprovedAt: null,
  acceptedBuyoutRevisionNumber: 1,
  purchasePrice: 32500,
  currency: "EUR",
  handoverPeriodWeeks: 3,
  transitionSupportWeeks: 4,
  assetManifestVersion: 1,
  blockers: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  assetManifest: {
    dealId: "deal_buyout_1",
    ideaId: "idea_buyout_1",
    acceptedRevisionNumber: 1,
    purchasePrice: 32500,
    currency: "EUR",
    handoverPeriodWeeks: 3,
    transitionSupportWeeks: 4,
    version: 1,
    manifestHash: "manifest_sha256_hash_12345",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assets: [
      {
        assetType: "IP_RIGHTS",
        displayName: "Full Intellectual Property & Concept Ownership",
        description: "Complete assignment of all copyright and patentable concepts.",
        availabilityStatus: "AVAILABLE_IN_PLATFORM",
        externalTransferRequired: false,
      },
      {
        assetType: "DOMAIN",
        displayName: "Domain Name & DNS Records",
        description: "Domain registrar transfer code and DNS zone authority.",
        availabilityStatus: "EXTERNAL_TRANSFER_REQUIRED",
        externalTransferRequired: true,
      },
      {
        assetType: "BUSINESS_DOCS",
        displayName: "Complete Business Plan & Financial Model",
        description: "All pitch decks, financial models, and market analyses.",
        availabilityStatus: "AVAILABLE_IN_PLATFORM",
        externalTransferRequired: false,
      },
    ],
  },
  documents: [
    {
      id: "doc_apa_1",
      documentType: "ASSET_PURCHASE_AGREEMENT",
      title: "Asset Purchase Agreement (APA)",
      requirementType: "REQUIRED",
      contentMarkdown: "# ASSET PURCHASE AGREEMENT\n\nPurchase Price: €32,500\nHandover: 3 weeks\nTransition: 4 weeks",
      contentHash: "hash_apa_1234567890",
      version: 1,
      status: "GENERATED",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "doc_ip_assign_1",
      documentType: "IP_ASSIGNMENT",
      title: "Intellectual Property Assignment Agreement",
      requirementType: "REQUIRED",
      contentMarkdown: "# INTELLECTUAL PROPERTY ASSIGNMENT\n\nAssignor grants all title to Assignee.",
      contentHash: "hash_ip_1234567890",
      version: 1,
      status: "GENERATED",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "doc_domain_1",
      documentType: "DOMAIN_TRANSFER_SCHEDULE",
      title: "Domain Transfer & DNS Control Schedule",
      requirementType: "CONDITIONAL",
      contentMarkdown: "# DOMAIN TRANSFER SCHEDULE\n\nAuth codes and registrar handover protocol.",
      contentHash: "hash_domain_1234567890",
      version: 1,
      status: "GENERATED",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "doc_transition_1",
      documentType: "TRANSITION_SUPPORT_AGREEMENT",
      title: "Transition Support & Consulting Agreement",
      requirementType: "CONDITIONAL",
      contentMarkdown: "# TRANSITION SUPPORT AGREEMENT\n\n4 weeks of advisory support post closing.",
      contentHash: "hash_transition_1234567890",
      version: 1,
      status: "GENERATED",
      lastUpdated: new Date().toISOString(),
    },
  ],
};

describe("FullBuyoutLegalReview", () => {
  it("renders Full Buyout Legal Review screen with locked purchase price and terms", () => {
    render(
      <BuyoutLegalReviewScreen
        dealId="deal_buyout_1"
        pkg={mockBuyoutLegalPackage}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
      />
    );

    expect(screen.getByText(/Legal & Asset Transfer Review/i)).toBeInTheDocument();
    expect(screen.getByText("€32,500")).toBeInTheDocument();
    expect(screen.getByText(/3 Weeks/i)).toBeInTheDocument();
    expect(screen.getByText(/4 Weeks/i)).toBeInTheDocument();
    expect(screen.getByText(/Global Tech Legal LLP/i)).toBeInTheDocument();
  });

  it("renders Asset Transfer Manifest checklist with classified availability statuses", () => {
    render(
      <BuyoutLegalReviewScreen
        dealId="deal_buyout_1"
        pkg={mockBuyoutLegalPackage}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
      />
    );

    expect(screen.getByText(/Asset Transfer Manifest/i)).toBeInTheDocument();
    expect(screen.getByText("Full Intellectual Property & Concept Ownership")).toBeInTheDocument();
    expect(screen.getAllByText("Available in Platform").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Domain Name & DNS Records")).toBeInTheDocument();
    expect(screen.getByText(/External Transfer/i)).toBeInTheDocument();
  });

  it("renders Legal Documents list with SHA-256 fingerprint badges and View button", () => {
    render(
      <BuyoutLegalReviewScreen
        dealId="deal_buyout_1"
        pkg={mockBuyoutLegalPackage}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
      />
    );

    expect(screen.getByText("Asset Purchase Agreement (APA)")).toBeInTheDocument();
    expect(screen.getByText("Intellectual Property Assignment Agreement")).toBeInTheDocument();
    expect(screen.getByText("Domain Transfer & DNS Control Schedule")).toBeInTheDocument();
    expect(screen.getByText("Transition Support & Consulting Agreement")).toBeInTheDocument();

    const viewButtons = screen.getAllByRole("button", { name: /view/i });
    expect(viewButtons.length).toBeGreaterThanOrEqual(4);
  });

  it("opens document modal when View button is clicked", () => {
    render(
      <BuyoutLegalReviewScreen
        dealId="deal_buyout_1"
        pkg={mockBuyoutLegalPackage}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
      />
    );

    const viewButtons = screen.getAllByRole("button", { name: /view/i });
    fireEvent.click(viewButtons[0]);

    expect(screen.getByText(/Purchase Price: €32,500/i)).toBeInTheDocument();
  });

  it("calls AI Explain endpoint and renders plain language popup with legal disclaimer", async () => {
    vi.spyOn(apiModule.marketplaceProjectsApi, "explainBuyoutLegalDocument").mockResolvedValue({
      documentId: "doc_apa_1",
      documentTitle: "Asset Purchase Agreement (APA)",
      explanation: "This agreement commits the seller to transfer all agreed assets to the buyer for €32,500.",
      disclaimer: "AI-generated explanation — not legal advice.",
    });

    render(
      <BuyoutLegalReviewScreen
        dealId="deal_buyout_1"
        pkg={mockBuyoutLegalPackage}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
      />
    );

    const explainButtons = screen.getAllByRole("button", { name: /explain simply/i });
    fireEvent.click(explainButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Plain Language Explanation/i)).toBeInTheDocument();
      expect(screen.getByText(/AI-generated explanation — not legal advice./i)).toBeInTheDocument();
      expect(screen.getByText(/transfer all agreed assets to the buyer for €32,500/i)).toBeInTheDocument();
    });
  });

  it("allows party approval when provider review is complete and no blockers exist", () => {
    const onApproveMock = vi.fn();
    render(
      <BuyoutLegalReviewScreen
        dealId="deal_buyout_1"
        pkg={mockBuyoutLegalPackage}
        isCreator={true}
        onApprove={onApproveMock}
        onRequestChanges={vi.fn()}
      />
    );

    const approveButton = screen.getByRole("button", { name: /approve buyout legal terms/i });
    expect(approveButton).not.toBeDisabled();
    fireEvent.click(approveButton);
    expect(onApproveMock).toHaveBeenCalled();
  });

  it("disables approval button and shows alert when missing asset blocker is present", () => {
    const packageWithBlocker: BuyoutLegalPackage = {
      ...mockBuyoutLegalPackage,
      blockers: ["Accepted asset 'Source Code & Repositories' requires verification or upload before final legal approval."],
    };

    render(
      <BuyoutLegalReviewScreen
        dealId="deal_buyout_1"
        pkg={packageWithBlocker}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
      />
    );

    expect(screen.getByText(/Legal Review Blocker Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/requires verification or upload/i)).toBeInTheDocument();
    const approveButton = screen.getByRole("button", { name: /approve buyout legal terms/i });
    expect(approveButton).toBeDisabled();
  });

  it("Option B: enables approval button when NO legal provider is invited", () => {
    const onApproveMock = vi.fn();
    const packageNoProvider: BuyoutLegalPackage = {
      ...mockBuyoutLegalPackage,
      assignedLegalProviderId: undefined,
      assignedLegalProviderName: undefined,
      providerReviewStatus: "NOT_ASSIGNED",
      blockers: [],
    };

    render(
      <BuyoutLegalReviewScreen
        dealId="deal_buyout_1"
        pkg={packageNoProvider}
        isCreator={true}
        onApprove={onApproveMock}
        onRequestChanges={vi.fn()}
      />
    );

    expect(screen.getByText(/Optional \(Not Invited\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Optional — Not invited/i)).toBeInTheDocument();
    const approveButton = screen.getByRole("button", { name: /approve buyout legal terms/i });
    expect(approveButton).not.toBeDisabled();
    fireEvent.click(approveButton);
    expect(onApproveMock).toHaveBeenCalled();
  });

  it("Option B: allows party approval when legal provider IS invited and review is still pending (shows pending in checklist)", () => {
    const onApproveMock = vi.fn();
    const packagePendingProvider: BuyoutLegalPackage = {
      ...mockBuyoutLegalPackage,
      assignedLegalProviderId: "sp_legal_1",
      assignedLegalProviderName: "Global Tech Legal LLP",
      providerReviewStatus: "ASSIGNED", // Not yet reviewed
      blockers: [],
    };

    render(
      <BuyoutLegalReviewScreen
        dealId="deal_buyout_1"
        pkg={packagePendingProvider}
        isCreator={true}
        onApprove={onApproveMock}
        onRequestChanges={vi.fn()}
      />
    );

    expect(screen.getByText(/Global Tech Legal LLP/i)).toBeInTheDocument();
    expect(screen.getByText(/Required before signing/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Review/i)).toBeInTheDocument();
    const approveButton = screen.getByRole("button", { name: /approve buyout legal terms/i });
    expect(approveButton).not.toBeDisabled();
    fireEvent.click(approveButton);
    expect(onApproveMock).toHaveBeenCalled();
  });
});


