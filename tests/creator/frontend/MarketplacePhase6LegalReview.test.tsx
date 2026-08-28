import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LegalReviewScreen } from "@/components/marketplace/LegalReviewScreen";
import { LegalReviewPackage } from "@/lib/api-marketplace-projects";
import * as apiModule from "@/lib/api-marketplace-projects";

const mockPackage: LegalReviewPackage = {
  id: "pkg_123",
  dealId: "deal_123",
  ideaId: "idea_123",
  projectName: "Autonomous Supply Chain OS",
  creatorId: "creator_1",
  creatorName: "Dr. Alice Smith",
  entrepreneurId: "ent_1",
  entrepreneurName: "Bob Founder",
  jurisdiction: "Delaware, USA",
  companyContext: "CASE_A_PRE_INCORPORATION",
  companyName: "Venture Entity (To Be Formed)",
  documents: [
    {
      id: "doc_cofounder_v1",
      documentType: "COFOUNDER_AGREEMENT",
      title: "Co-founder Partnership Agreement",
      requirementType: "REQUIRED",
      contentMarkdown: "# CO-FOUNDER PARTNERSHIP AGREEMENT (V1)\n\n## 1. PARTIES\n- Creator: CTO\n- Entrepreneur: CEO",
      contentHash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
      version: 1,
      status: "DRAFT",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "doc_ip_v1",
      documentType: "IP_CONTRIBUTION_AGREEMENT",
      title: "IP Contribution & Assignment Agreement",
      requirementType: "REQUIRED",
      contentMarkdown: "# IP CONTRIBUTION AGREEMENT (V1)\n\nIrrevocable assignment of project IP.",
      contentHash: "b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a",
      version: 1,
      status: "DRAFT",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "doc_vesting_v1",
      documentType: "VESTING_AGREEMENT",
      title: "Restricted Stock Vesting Agreement",
      requirementType: "REQUIRED",
      contentMarkdown: "# RESTRICTED STOCK VESTING AGREEMENT (V1)\n\n48-month vesting with 12-month cliff.",
      contentHash: "c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b",
      version: 1,
      status: "DRAFT",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "doc_shareholder_v1",
      documentType: "SHAREHOLDER_AGREEMENT",
      title: "Shareholder Agreement",
      requirementType: "CONDITIONAL",
      contentMarkdown: "# SHAREHOLDER AGREEMENT (V1)\n\nROFR, Tag-Along and Drag-Along rights.",
      contentHash: "d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c",
      version: 1,
      status: "DRAFT",
      lastUpdated: new Date().toISOString(),
    },
  ],
  assignedLegalProviderId: "sp_legal_1",
  assignedLegalProviderName: "Attorney Smith, Esq.",
  providerReviewStatus: "REVIEW_COMPLETE",
  providerReviewedAt: new Date().toISOString(),
  providerReviewNotes: "All clauses conform to standard early-stage venture formation guidelines.",
  creatorApprovedVersion: 0,
  entrepreneurApprovedVersion: 0,
  creatorApprovedAt: null,
  entrepreneurApprovedAt: null,
  acceptedOfferRevisionNumber: 1,
  roleAgreementVersion: 1,
  capTableVersion: 1,
  status: "AWAITING_REVIEW",
  version: 1,
  commercialTerms: {
    equityPercentage: 20,
    creatorRole: "CTO & Co-founder",
    cashComponent: 5000,
    vestingEnabled: true,
    vestingMonths: 48,
    cliffMonths: 12,
    acceptedRevisionNumber: 1,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("MarketplacePhase6LegalReview", () => {
  it("renders Screen 04 Legal Review header, venture context, and jurisdiction", () => {
    render(
      <LegalReviewScreen
        dealId="deal_123"
        pkg={mockPackage}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
        onInviteProvider={vi.fn()}
        onSetJurisdiction={vi.fn()}
      />
    );

    expect(screen.getByText("Autonomous Supply Chain OS")).toBeInTheDocument();
    expect(screen.getByText("Delaware, USA")).toBeInTheDocument();
    expect(screen.getByText(/Package V1/i)).toBeInTheDocument();
    expect(screen.getByText("Attorney Smith, Esq.")).toBeInTheDocument();
    expect(screen.getByText("Review Complete")).toBeInTheDocument();
  });

  it("renders categorized legal documents with SHA-256 hashes and badges", () => {
    render(
      <LegalReviewScreen
        dealId="deal_123"
        pkg={mockPackage}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
        onInviteProvider={vi.fn()}
        onSetJurisdiction={vi.fn()}
      />
    );

    expect(screen.getByText("Co-founder Partnership Agreement")).toBeInTheDocument();
    expect(screen.getByText("IP Contribution & Assignment Agreement")).toBeInTheDocument();
    expect(screen.getByText("Restricted Stock Vesting Agreement")).toBeInTheDocument();
    expect(screen.getByText("Shareholder Agreement")).toBeInTheDocument();
    expect(screen.getAllByText(/SHA-256:/i).length).toBe(4);
  });

  it("opens full document view modal on click", () => {
    render(
      <LegalReviewScreen
        dealId="deal_123"
        pkg={mockPackage}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
        onInviteProvider={vi.fn()}
        onSetJurisdiction={vi.fn()}
      />
    );

    const viewButtons = screen.getAllByRole("button", { name: /View Full Document/i });
    fireEvent.click(viewButtons[0]);

    expect(screen.getAllByText(/PARTIES/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /^Close$/i })).toBeInTheDocument();
  });

  it("triggers AI plain language explanation and displays mandatory legal disclaimer", async () => {
    const explainSpy = vi.spyOn(apiModule.marketplaceProjectsApi, "explainLegalDocument").mockResolvedValueOnce({
      documentId: "doc_cofounder_v1",
      documentTitle: "Co-founder Partnership Agreement",
      explanationMarkdown: "This agreement assigns 20% equity vesting over 48 months with a 12-month cliff.",
      keyTakeaways: [
        "You receive 20% equity.",
        "12-month cliff applies.",
      ],
      disclaimer: "AI-generated explanation — not legal advice. A verified human Legal Service Provider review is required.",
    });

    render(
      <LegalReviewScreen
        dealId="deal_123"
        pkg={mockPackage}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
        onInviteProvider={vi.fn()}
        onSetJurisdiction={vi.fn()}
      />
    );

    const explainButtons = screen.getAllByRole("button", { name: /Explain in Simple Language/i });
    fireEvent.click(explainButtons[0]);

    await waitFor(() => {
      expect(explainSpy).toHaveBeenCalledWith("deal_123", "doc_cofounder_v1");
      expect(screen.getByText(/AI-generated explanation — not legal advice/i)).toBeInTheDocument();
      expect(screen.getByText("You receive 20% equity.")).toBeInTheDocument();
    });
  });

  it("blocks Approve button when jurisdiction is missing", () => {
    const pkgNoJurisdiction: LegalReviewPackage = {
      ...mockPackage,
      jurisdiction: "",
    };

    render(
      <LegalReviewScreen
        dealId="deal_123"
        pkg={pkgNoJurisdiction}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
        onInviteProvider={vi.fn()}
        onSetJurisdiction={vi.fn()}
      />
    );

    const approveButton = screen.getByRole("button", { name: /Approve Legal Terms/i });
    expect(approveButton).toBeDisabled();
    expect(screen.getByText(/Jurisdiction Required/i)).toBeInTheDocument();
  });

  it("blocks Approve button when provider review is not complete", () => {
    const pkgPendingReview: LegalReviewPackage = {
      ...mockPackage,
      providerReviewStatus: "IN_REVIEW",
    };

    render(
      <LegalReviewScreen
        dealId="deal_123"
        pkg={pkgPendingReview}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
        onInviteProvider={vi.fn()}
        onSetJurisdiction={vi.fn()}
      />
    );

    const approveButton = screen.getByRole("button", { name: /Approve Legal Terms/i });
    expect(approveButton).toBeDisabled();
  });

  it("enables Approve button when jurisdiction is set and provider review is complete", async () => {
    const onApprove = vi.fn().mockResolvedValue(undefined);

    render(
      <LegalReviewScreen
        dealId="deal_123"
        pkg={mockPackage}
        isCreator={true}
        onApprove={onApprove}
        onRequestChanges={vi.fn()}
        onInviteProvider={vi.fn()}
        onSetJurisdiction={vi.fn()}
      />
    );

    const approveButton = screen.getByRole("button", { name: /Approve Legal Terms/i });
    expect(approveButton).not.toBeDisabled();

    fireEvent.click(approveButton);
    expect(onApprove).toHaveBeenCalled();
  });

  it("opens Request Changes modal and submits feedback", async () => {
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);

    render(
      <LegalReviewScreen
        dealId="deal_123"
        pkg={mockPackage}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={onRequestChanges}
        onInviteProvider={vi.fn()}
        onSetJurisdiction={vi.fn()}
      />
    );

    const requestChangesBtn = screen.getByRole("button", { name: /Request Changes/i });
    fireEvent.click(requestChangesBtn);

    expect(screen.getByText(/Request Legal Package Changes/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Specify requested modifications/i);
    fireEvent.change(textarea, { target: { value: "Please adjust IP warranty clause." } });

    const submitBtn = screen.getByRole("button", { name: /Submit Change Request/i });
    fireEvent.click(submitBtn);

    expect(onRequestChanges).toHaveBeenCalledWith({
      documentId: undefined,
      feedback: "Please adjust IP warranty clause.",
    });
  });

  it("renders Proceed to Sign Agreements button when package is fully approved", () => {
    const pkgFullyApproved: LegalReviewPackage = {
      ...mockPackage,
      status: "APPROVED",
      creatorApprovedVersion: 1,
      entrepreneurApprovedVersion: 1,
      providerReviewStatus: "REVIEW_COMPLETE",
    };

    const onProceed = vi.fn();

    render(
      <LegalReviewScreen
        dealId="deal_123"
        pkg={pkgFullyApproved}
        isCreator={true}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
        onInviteProvider={vi.fn()}
        onSetJurisdiction={vi.fn()}
        onProceedToSigning={onProceed}
      />
    );

    const proceedBtn = screen.getByRole("button", { name: /Proceed to Sign Agreements/i });
    expect(proceedBtn).toBeInTheDocument();

    fireEvent.click(proceedBtn);
    expect(onProceed).toHaveBeenCalled();
  });
});
