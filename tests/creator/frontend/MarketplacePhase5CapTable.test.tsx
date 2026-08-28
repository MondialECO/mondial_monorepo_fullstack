import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CapTableDraftScreen } from "@/components/marketplace/CapTableDraftScreen";
import { DealCapTableDraft } from "@/lib/api-marketplace-projects";

const mockDraft: DealCapTableDraft = {
  id: "draft_123",
  dealId: "deal_123",
  ideaId: "idea_123",
  projectName: "Decentralized AI Grid",
  creatorId: "creator_1",
  creatorName: "Dr. Alice Smith",
  entrepreneurId: "ent_1",
  entrepreneurName: "Bob Founder",
  totalShares: 10_000_000,
  entries: [
    {
      id: "e1",
      userId: "creator_1",
      displayName: "Dr. Alice Smith",
      roleTitle: "Co-founder & Chief Scientist",
      stakeholderType: "creator",
      shareClass: "common",
      hasVotingRights: true,
      equityPercent: 15,
      sharesGranted: 1_500_000,
      vestingMonths: 48,
      cliffMonths: 12,
      isCreator: true,
      isFounder: false,
      isEsop: false,
      isInvestorReserve: false,
      isLocked: true,
    },
    {
      id: "e2",
      userId: "ent_1",
      displayName: "Bob Founder",
      roleTitle: "CEO & Co-founder",
      stakeholderType: "founder",
      shareClass: "common",
      hasVotingRights: true,
      equityPercent: 75,
      sharesGranted: 7_500_000,
      vestingMonths: 48,
      cliffMonths: 12,
      isCreator: false,
      isFounder: true,
      isEsop: false,
      isInvestorReserve: false,
      isLocked: false,
    },
    {
      id: "e3",
      displayName: "Employee Option Pool (ESOP)",
      roleTitle: "Unallocated Options",
      stakeholderType: "esop",
      shareClass: "common",
      hasVotingRights: false,
      equityPercent: 5,
      sharesGranted: 500_000,
      vestingMonths: 48,
      cliffMonths: 12,
      isCreator: false,
      isFounder: false,
      isEsop: true,
      isInvestorReserve: false,
      isLocked: false,
    },
    {
      id: "e4",
      displayName: "Future Investor Reserve",
      roleTitle: "Pre-allocated Round Reserve",
      stakeholderType: "investor_reserve",
      shareClass: "preferred",
      hasVotingRights: true,
      equityPercent: 5,
      sharesGranted: 500_000,
      vestingMonths: 0,
      cliffMonths: 0,
      isCreator: false,
      isFounder: false,
      isEsop: false,
      isInvestorReserve: true,
      isLocked: false,
    },
  ],
  esopPoolPercent: 5,
  investorReservePercent: 5,
  esopVestingMonths: 48,
  totalAllocatedPercent: 100,
  isFullyAllocated: true,
  creatorConfirmedVersion: 0,
  entrepreneurConfirmedVersion: 0,
  status: "AWAITING_CONFIRMATION",
  version: 1,
  commercialTerms: {
    equityPercentage: 15,
    creatorRole: "Co-founder & Chief Scientist",
    cashComponent: 10000,
    vestingEnabled: true,
    vestingMonths: 48,
    cliffMonths: 12,
    acceptedRevisionNumber: 2,
  },
  companyContext: {
    hasExistingCompany: true,
    companyId: "comp_123",
    companyName: "Nexus AI Inc.",
    incorporationStatus: "INCORPORATED",
  },
  createdAt: "2026-08-27T00:00:00Z",
  updatedAt: "2026-08-27T00:00:00Z",
};

describe("MarketplacePhase5CapTable - Screen 03 UI", () => {
  it("renders locked commercial terms, company context, and dilution notice correctly", () => {
    const onApprove = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);

    render(
      <CapTableDraftScreen
        dealId="deal_123"
        draft={mockDraft}
        currentUserId="creator_1"
        isCreator={true}
        onApprove={onApprove}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
      />
    );

    // Verify Locked Terms badge
    expect(screen.getByText("Accepted Commercial Terms (Locked)")).toBeDefined();
    expect(screen.getAllByText("15%").length).toBeGreaterThan(0);
    expect(screen.getByText("$10,000")).toBeDefined();

    // Verify Company Context
    expect(screen.getByText(/Existing Company Detected \(Nexus AI Inc\.\)/i)).toBeDefined();

    // Verify Dilution Notice
    expect(screen.getByText("Dilution Notice")).toBeDefined();
    expect(
      screen.getByText(/Future investment or share issuance may dilute your ownership/i)
    ).toBeDefined();

    // Verify "You Own" badge for Creator
    expect(screen.getByText("You Own")).toBeDefined();
    expect(screen.getByText("100% Fully Allocated")).toBeDefined();
  });

  it("renders shareholder allocation schedule with Creator locked", () => {
    const onApprove = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);

    render(
      <CapTableDraftScreen
        dealId="deal_123"
        draft={mockDraft}
        currentUserId="creator_1"
        isCreator={true}
        onApprove={onApprove}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
      />
    );

    expect(screen.getByText("Dr. Alice Smith")).toBeDefined();
    expect(screen.getByText("Bob Founder")).toBeDefined();
    expect(screen.getByText("Employee Option Pool (ESOP)")).toBeDefined();
    expect(screen.getByText("Future Investor Reserve")).toBeDefined();
    expect(screen.getByText("1,500,000")).toBeDefined();
    expect(screen.getByText("7,500,000")).toBeDefined();
  });

  it("calls onApprove when clicking approve ownership structure", async () => {
    const onApprove = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);

    render(
      <CapTableDraftScreen
        dealId="deal_123"
        draft={mockDraft}
        currentUserId="creator_1"
        isCreator={true}
        onApprove={onApprove}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
      />
    );

    const approveBtn = screen.getByText("Approve Ownership Structure (V1)");
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledTimes(1);
    });
  });

  it("disables approve and shows confirmed badge when user already approved current version", () => {
    const approvedDraft: DealCapTableDraft = {
      ...mockDraft,
      creatorConfirmedVersion: 1,
      status: "CREATOR_APPROVED",
    };

    const onApprove = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);

    render(
      <CapTableDraftScreen
        dealId="deal_123"
        draft={approvedDraft}
        currentUserId="creator_1"
        isCreator={true}
        onApprove={onApprove}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
      />
    );

    expect(screen.getByText("Version 1 Approved by You")).toBeDefined();
    expect(screen.getByText("Approved V1")).toBeDefined();
  });

  it("allows editing non-locked allocations and saves updated draft with onUpdate", async () => {
    const onApprove = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);

    render(
      <CapTableDraftScreen
        dealId="deal_123"
        draft={mockDraft}
        currentUserId="ent_1"
        isCreator={false}
        onApprove={onApprove}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
      />
    );

    const editBtn = screen.getByText("Edit Allocation");
    fireEvent.click(editBtn);

    // Click Save & Propose V2
    const saveBtn = screen.getByText("Save & Propose V2");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it("submits change feedback through request changes modal", async () => {
    const onApprove = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);

    render(
      <CapTableDraftScreen
        dealId="deal_123"
        draft={mockDraft}
        currentUserId="creator_1"
        isCreator={true}
        onApprove={onApprove}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
      />
    );

    const reqBtn = screen.getByText("Request Changes");
    fireEvent.click(reqBtn);

    const textarea = screen.getByPlaceholderText(/Increase employee pool/i);
    fireEvent.change(textarea, { target: { value: "Increase ESOP from 5% to 7%." } });

    const submitBtn = screen.getByText("Submit Feedback");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onRequestChanges).toHaveBeenCalledWith({ feedback: "Increase ESOP from 5% to 7%." });
    });
  });

  it("renders fully approved state and shows continue to legal review CTA", () => {
    const fullyApprovedDraft: DealCapTableDraft = {
      ...mockDraft,
      creatorConfirmedVersion: 1,
      entrepreneurConfirmedVersion: 1,
      status: "APPROVED",
    };

    const onApprove = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);
    const onProceed = vi.fn();

    render(
      <CapTableDraftScreen
        dealId="deal_123"
        draft={fullyApprovedDraft}
        currentUserId="creator_1"
        isCreator={true}
        onApprove={onApprove}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
        onProceedToLegalReview={onProceed}
      />
    );

    expect(screen.getByText("Fully Approved")).toBeDefined();
    const continueBtn = screen.getByText("Continue to Legal Review");
    expect(continueBtn).toBeDefined();

    fireEvent.click(continueBtn);
    expect(onProceed).toHaveBeenCalledTimes(1);
  });
});
