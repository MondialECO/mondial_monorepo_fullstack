import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BuyoutClosingScreen } from "@/components/marketplace/BuyoutClosingScreen";
import marketplaceProjectsApi, { BuyoutClosing } from "@/lib/api-marketplace-projects";

const { mockApi } = vi.hoisted(() => {
  const api = {
    getBuyoutClosing: vi.fn(),
    submitBuyoutPayment: vi.fn(),
    confirmBuyoutPayment: vi.fn(),
    disputeBuyoutPayment: vi.fn(),
  };
  return { mockApi: api };
});

vi.mock("@/lib/api-marketplace-projects", () => {
  return {
    default: mockApi,
    marketplaceProjectsApi: mockApi,
  };
});

describe("FullBuyoutClosing (Creator Path A - Phase 5)", () => {
  const mockPendingClosing: BuyoutClosing = {
    id: "closing_1",
    dealId: "deal_1",
    ideaId: "idea_1",
    projectName: "Mondial Analytics",
    dealType: "FULL_BUYOUT",
    creatorId: "creator_1",
    creatorName: "Creator Alice",
    entrepreneurId: "buyer_1",
    entrepreneurName: "Buyer Bob",
    acceptedRevisionNumber: 2,
    signingPackageId: "pkg_signed_1",
    manifestHash: "manifest_sha256_canonical_closing_hash_123456789",
    purchasePrice: 27500,
    currency: "EUR",
    paymentMethod: "BANK_TRANSFER",
    paymentStatus: "NOT_STARTED",
    paymentReference: null,
    paymentAmount: null,
    paymentCurrency: null,
    paidAt: null,
    buyerConfirmedAt: null,
    creatorConfirmedAt: null,
    providerConfirmedAt: null,
    evidence: [],
    closingStatus: "PENDING",
    canProceedToHandover: false,
    blockers: ["Buyer payment submission is pending."],
    disputeReason: null,
    disputedAt: null,
    disputedByUserId: null,
    version: 1,
    startedAt: "2026-08-27T10:00:00Z",
    updatedAt: "2026-08-27T10:00:00Z",
    paymentCompletedAt: null,
    readyForHandoverAt: null,
  };

  const mockSubmittedClosing: BuyoutClosing = {
    ...mockPendingClosing,
    paymentStatus: "PAYMENT_SUBMITTED",
    paymentReference: "SEPA-TX-987654321",
    paymentAmount: 27500,
    paymentCurrency: "EUR",
    buyerConfirmedAt: "2026-08-27T11:00:00Z",
    closingStatus: "PAYMENT_VERIFICATION",
    blockers: ["Payment verification / Creator confirmation is pending."],
    evidence: [
      {
        id: "ev_1",
        documentReference: "DOC-WIRE-RECEIPT-001",
        documentName: "Bank Wire Confirmation Receipt",
        uploadedByUserId: "buyer_1",
        uploadedByRole: "Entrepreneur",
        uploadedAt: "2026-08-27T11:00:00Z",
        contentHash: null,
        statedAmount: 27500,
        statedCurrency: "EUR",
        notes: "Wire sent via SEPA transfer.",
      },
    ],
    version: 2,
  };

  const mockConfirmedClosing: BuyoutClosing = {
    ...mockSubmittedClosing,
    paymentStatus: "PAYMENT_CONFIRMED",
    creatorConfirmedAt: "2026-08-27T12:00:00Z",
    paymentCompletedAt: "2026-08-27T12:00:00Z",
    readyForHandoverAt: "2026-08-27T12:00:00Z",
    closingStatus: "READY_FOR_HANDOVER",
    canProceedToHandover: true,
    blockers: [],
    version: 3,
  };

  const mockDisputedClosing: BuyoutClosing = {
    ...mockSubmittedClosing,
    paymentStatus: "PAYMENT_DISPUTED",
    closingStatus: "DISPUTED",
    disputeReason: "Transaction reference not found in bank ledger after 3 days.",
    disputedAt: "2026-08-27T13:00:00Z",
    disputedByUserId: "creator_1",
    canProceedToHandover: false,
    blockers: ["Payment is disputed: Transaction reference not found in bank ledger after 3 days."],
    version: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Renders stage header, locked purchase price, manifest hash, and honest payment notice", async () => {
    vi.mocked(marketplaceProjectsApi.getBuyoutClosing).mockResolvedValue(mockPendingClosing);

    render(
      <BuyoutClosingScreen
        dealId="deal_1"
        isCreator={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/FULL BUYOUT — STAGE 5 OF 6/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Closing & Payment Verification/i)).toBeInTheDocument();
    expect(screen.getAllByText(/€27,500 EUR/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Binding price locked from signed agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/Manifest: manifest_sha256/i)).toBeInTheDocument();
    expect(screen.getByText(/Manual Payment Verification & Closing State:/i)).toBeInTheDocument();
  });

  it("2. Buyer view: allows submitting payment reference and evidence", async () => {
    vi.mocked(marketplaceProjectsApi.getBuyoutClosing).mockResolvedValue(mockPendingClosing);
    vi.mocked(marketplaceProjectsApi.submitBuyoutPayment).mockResolvedValue(mockSubmittedClosing);

    const onRefreshMock = vi.fn();

    render(
      <BuyoutClosingScreen
        dealId="deal_1"
        isCreator={false}
        onRefreshDeal={onRefreshMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Buyer Payment Submission/i })).toBeInTheDocument();
    });

    const refInput = screen.getByPlaceholderText(/e.g. SEPA-TX-892301934/i);
    fireEvent.change(refInput, { target: { value: "SEPA-TX-987654321" } });

    const submitBtn = screen.getByRole("button", { name: /Submit Payment Confirmation/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(marketplaceProjectsApi.submitBuyoutPayment).toHaveBeenCalledWith("deal_1", {
        paymentMethod: "BANK_TRANSFER",
        paymentReference: "SEPA-TX-987654321",
        documentReference: undefined,
        documentName: "Payment Transfer Confirmation",
        notes: undefined,
        expectedVersion: 1,
      });
    });

    expect(onRefreshMock).toHaveBeenCalled();
  });

  it("3. Creator view: displays buyer submitted payment details and allows confirming receipt", async () => {
    vi.mocked(marketplaceProjectsApi.getBuyoutClosing).mockResolvedValue(mockSubmittedClosing);
    vi.mocked(marketplaceProjectsApi.confirmBuyoutPayment).mockResolvedValue(mockConfirmedClosing);

    const onRefreshMock = vi.fn();

    render(
      <BuyoutClosingScreen
        dealId="deal_1"
        isCreator={true}
        onRefreshDeal={onRefreshMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Creator Payment Receipt Verification/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/SEPA-TX-987654321/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/VERIFICATION PENDING/i)).toBeInTheDocument();

    const verifyBtn = screen.getByRole("button", { name: /Verify & Confirm Payment Receipt/i });
    fireEvent.click(verifyBtn);

    // Modal opens
    expect(screen.getByRole("heading", { name: /Confirm Payment Receipt/i })).toBeInTheDocument();
    const modalConfirmBtn = screen.getByRole("button", { name: /Confirm Funds Received/i });
    fireEvent.click(modalConfirmBtn);

    await waitFor(() => {
      expect(marketplaceProjectsApi.confirmBuyoutPayment).toHaveBeenCalledWith("deal_1", {
        notes: undefined,
        expectedVersion: 2,
      });
    });

    expect(onRefreshMock).toHaveBeenCalled();
  });

  it("4. Creator view: allows reporting a payment dispute/issue", async () => {
    vi.mocked(marketplaceProjectsApi.getBuyoutClosing).mockResolvedValue(mockSubmittedClosing);
    vi.mocked(marketplaceProjectsApi.disputeBuyoutPayment).mockResolvedValue(mockDisputedClosing);

    const onRefreshMock = vi.fn();

    render(
      <BuyoutClosingScreen
        dealId="deal_1"
        isCreator={true}
        onRefreshDeal={onRefreshMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Report Issue \/ Dispute/i })).toBeInTheDocument();
    });

    const disputeBtn = screen.getByRole("button", { name: /Report Issue \/ Dispute/i });
    fireEvent.click(disputeBtn);

    expect(screen.getByRole("heading", { name: /Report Payment Issue \/ Dispute/i })).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText(/e.g. Bank transfer reference not located after 5 business days.../i);
    fireEvent.change(textarea, { target: { value: "Transaction reference not found in bank ledger after 3 days." } });

    const submitDisputeBtn = screen.getByRole("button", { name: /Submit Payment Issue/i });
    fireEvent.click(submitDisputeBtn);

    await waitFor(() => {
      expect(marketplaceProjectsApi.disputeBuyoutPayment).toHaveBeenCalledWith("deal_1", {
        disputeReason: "Transaction reference not found in bank ledger after 3 days.",
        expectedVersion: 2,
      });
    });
  });

  it("5. Confirmed payment: displays READY FOR HANDOVER status and Phase 5 complete banner", async () => {
    vi.mocked(marketplaceProjectsApi.getBuyoutClosing).mockResolvedValue(mockConfirmedClosing);

    const onProceedMock = vi.fn();

    render(
      <BuyoutClosingScreen
        dealId="deal_1"
        isCreator={true}
        onProceedToHandover={onProceedMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/READY FOR HANDOVER/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Phase 5 Complete/i)).toBeInTheDocument();
    expect(screen.getByText(/BUYOUT_HANDOVER_PENDING/i)).toBeInTheDocument();

    const proceedBtn = screen.getByRole("button", { name: /Proceed to Asset Handover/i });
    fireEvent.click(proceedBtn);
    expect(onProceedMock).toHaveBeenCalled();
  });

  it("6. Disputed payment: displays prominent dispute warning and pauses handover", async () => {
    vi.mocked(marketplaceProjectsApi.getBuyoutClosing).mockResolvedValue(mockDisputedClosing);

    render(
      <BuyoutClosingScreen
        dealId="deal_1"
        isCreator={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Payment Dispute Active — Handover Paused/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Transaction reference not found in bank ledger after 3 days./i).length).toBeGreaterThan(0);
    expect(screen.getByText(/HANDOVER LOCKED/i)).toBeInTheDocument();
  });
});
