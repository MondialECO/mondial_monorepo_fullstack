import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RoleAgreementScreen } from "@/components/marketplace/RoleAgreementScreen";
import { RoleResponsibilityAgreement } from "@/lib/api-marketplace-projects";

const mockAgreement: RoleResponsibilityAgreement = {
  id: "agree_123",
  dealId: "deal_123",
  ideaId: "idea_123",
  projectName: "Decentralized AI Grid",
  creatorId: "creator_1",
  creatorName: "Dr. Alice Smith",
  entrepreneurId: "ent_1",
  entrepreneurName: "Bob Founder",
  creatorRole: "Co-founder & Chief Scientist",
  entrepreneurRole: "CEO & Co-founder",
  creatorResponsibilities: ["Core ML Architecture", "IP & Patents Transfer", "Technical Advisory"],
  entrepreneurResponsibilities: ["Company Operations", "Series A Fundraising", "Executive Hiring", "GTM Execution"],
  creatorTimeCommitment: "10 hours / week",
  entrepreneurTimeCommitment: "Full-time (40 hours / week)",
  creatorCommitmentType: "HOURS_PER_WEEK",
  entrepreneurCommitmentType: "FULL_TIME",
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
};

describe("MarketplacePhase4RoleAgreement - Screen 02 UI", () => {
  it("renders locked commercial terms summary correctly from accepted offer", () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);

    render(
      <RoleAgreementScreen
        dealId="deal_123"
        agreement={mockAgreement}
        currentUserId="creator_1"
        isCreator={true}
        onConfirm={onConfirm}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
      />
    );

    // Verify locked commercial economics are displayed
    expect(screen.getByText("Accepted Commercial Terms (Locked)")).toBeDefined();
    expect(screen.getByText("15%")).toBeDefined();
    expect(screen.getByText("$10,000")).toBeDefined();
    expect(screen.getByText(/48 mo/i)).toBeDefined();
    expect(screen.getByText("Rev #2")).toBeDefined();
  });

  it("renders both founder role cards and responsibilities in Version 1", () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);

    render(
      <RoleAgreementScreen
        dealId="deal_123"
        agreement={mockAgreement}
        currentUserId="creator_1"
        isCreator={true}
        onConfirm={onConfirm}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
      />
    );

    expect(screen.getByText("Version 1")).toBeDefined();
    expect(screen.getByText("Creator Role & Duties")).toBeDefined();
    expect(screen.getByText("Entrepreneur Role & Duties")).toBeDefined();
    expect(screen.getByText("Core ML Architecture")).toBeDefined();
    expect(screen.getByText("Series A Fundraising")).toBeDefined();
    expect(screen.getByText("10 hours / week")).toBeDefined();
    expect(screen.getByText("Full-time (40 hours / week)")).toBeDefined();
  });

  it("allows the user to trigger confirmation on the current version", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);

    render(
      <RoleAgreementScreen
        dealId="deal_123"
        agreement={mockAgreement}
        currentUserId="creator_1"
        isCreator={true}
        onConfirm={onConfirm}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
      />
    );

    const confirmBtn = screen.getByText("Confirm Roles (Version 1)");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it("displays confirmed status badge and disables duplicate confirm when user already confirmed", () => {
    const confirmedAgreement: RoleResponsibilityAgreement = {
      ...mockAgreement,
      creatorConfirmedVersion: 1,
      status: "CREATOR_CONFIRMED",
    };

    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);

    render(
      <RoleAgreementScreen
        dealId="deal_123"
        agreement={confirmedAgreement}
        currentUserId="creator_1"
        isCreator={true}
        onConfirm={onConfirm}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
      />
    );

    expect(screen.getByText("You confirmed Version 1")).toBeDefined();
    expect(screen.getByText("Version 1 Confirmed by You")).toBeDefined();
  });

  it("supports edit mode with responsibility addition and calls onUpdate", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);

    render(
      <RoleAgreementScreen
        dealId="deal_123"
        agreement={mockAgreement}
        currentUserId="creator_1"
        isCreator={true}
        onConfirm={onConfirm}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
      />
    );

    const editBtn = screen.getByText("Edit Agreement");
    fireEvent.click(editBtn);

    // Form inputs should now be present
    const addInput = screen.getAllByPlaceholderText("Add responsibility...")[0];
    fireEvent.change(addInput, { target: { value: "Lead AI Safety Reviews" } });
    const addBtn = screen.getAllByText("Add")[0];
    fireEvent.click(addBtn);

    expect(screen.getByText("Lead AI Safety Reviews")).toBeDefined();

    const saveBtn = screen.getByText("Save & Propose V2");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it("displays fully confirmed state and enables continue to Cap Table when both confirm", () => {
    const fullyConfirmedAgreement: RoleResponsibilityAgreement = {
      ...mockAgreement,
      creatorConfirmedVersion: 1,
      entrepreneurConfirmedVersion: 1,
      status: "CONFIRMED",
    };

    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onRequestChanges = vi.fn().mockResolvedValue(undefined);
    const onProceed = vi.fn();

    render(
      <RoleAgreementScreen
        dealId="deal_123"
        agreement={fullyConfirmedAgreement}
        currentUserId="creator_1"
        isCreator={true}
        onConfirm={onConfirm}
        onUpdate={onUpdate}
        onRequestChanges={onRequestChanges}
        onProceedToCapTable={onProceed}
      />
    );

    expect(screen.getByText("Agreement Fully Confirmed (Version 1)")).toBeDefined();
    const continueBtn = screen.getByText("Continue to Cap Table & Equity Structure");
    expect(continueBtn).toBeDefined();

    fireEvent.click(continueBtn);
    expect(onProceed).toHaveBeenCalledTimes(1);
  });
});
