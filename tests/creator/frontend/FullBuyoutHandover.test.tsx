import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BuyoutHandoverScreen } from "@/components/marketplace/BuyoutHandoverScreen";
import { BuyoutSaleRecordScreen } from "@/components/marketplace/BuyoutSaleRecordScreen";
import marketplaceProjectsApi, {
  BuyoutHandover,
  BuyoutSaleRecord,
  EquityDeal
} from "@/lib/api-marketplace-projects";

const { mockApi } = vi.hoisted(() => {
  const api = {
    getBuyoutHandover: vi.fn(),
    startBuyoutHandover: vi.fn(),
    deliverBuyoutAsset: vi.fn(),
    verifyBuyoutAsset: vi.fn(),
    reportBuyoutAssetIssue: vi.fn(),
    confirmBuyoutHandover: vi.fn(),
    completeBuyoutSale: vi.fn(),
    getBuyoutSaleRecord: vi.fn(),
  };
  return { mockApi: api };
});

vi.mock("@/lib/api-marketplace-projects", () => {
  return {
    default: mockApi,
    marketplaceProjectsApi: mockApi,
  };
});

describe("FullBuyoutHandover (Creator Path A - Phase 6)", () => {
  const mockInProgressHandover: BuyoutHandover = {
    id: "handover_1",
    dealId: "deal_1",
    ideaId: "idea_1",
    projectName: "Mondial Analytics",
    dealType: "FULL_BUYOUT",
    creatorId: "creator_1",
    creatorName: "Creator Alice",
    entrepreneurId: "buyer_1",
    entrepreneurName: "Buyer Bob",
    acceptedRevisionNumber: 2,
    assetManifestVersion: 1,
    assetManifestHash: "manifest_hash_test_phase6_12345678",
    signingPackageId: "pkg_signed_1",
    manifestHash: "manifest_hash_test_phase6_12345678",
    closingId: "closing_1",
    purchasePrice: 27500,
    currency: "EUR",
    handoverPeriodWeeks: 2,
    transitionSupportWeeks: 4,
    assets: [
      {
        id: "a1",
        assetId: "asset_brand",
        assetType: "Brand",
        displayName: "Brand & Trademark",
        deliveryType: "AVAILABLE_IN_PLATFORM",
        isRequired: true,
        status: "PENDING",
        evidence: [],
        version: 1,
      },
      {
        id: "a2",
        assetId: "asset_domain",
        assetType: "Domain",
        displayName: "Primary Domain (mondial.eco)",
        deliveryType: "EXTERNAL_TRANSFER_REQUIRED",
        isRequired: true,
        status: "PENDING",
        evidence: [],
        version: 1,
      },
      {
        id: "a3",
        assetId: "asset_code",
        assetType: "Source Code",
        displayName: "Full Stack Codebase",
        deliveryType: "EXTERNAL_TRANSFER_REQUIRED",
        isRequired: true,
        status: "PENDING",
        evidence: [],
        version: 1,
      },
    ],
    status: "IN_PROGRESS",
    canCompleteSale: false,
    blockers: ["All 3 assets must be delivered and verified."],
    sellerConfirmedAt: null,
    buyerConfirmedAt: null,
    version: 1,
    startedAt: "2026-08-27T12:00:00Z",
    updatedAt: "2026-08-27T12:00:00Z",
    completedAt: null,
  };

  const mockCompletedHandover: BuyoutHandover = {
    ...mockInProgressHandover,
    assets: mockInProgressHandover.assets.map((a) => ({
      ...a,
      status: "VERIFIED",
      sellerDeliveredAt: "2026-08-27T13:00:00Z",
      buyerVerifiedAt: "2026-08-27T14:00:00Z",
    })),
    status: "COMPLETED",
    canCompleteSale: true,
    blockers: [],
    sellerConfirmedAt: "2026-08-27T14:30:00Z",
    buyerConfirmedAt: "2026-08-27T14:35:00Z",
    completedAt: "2026-08-27T15:00:00Z",
    version: 5,
  };

  const mockSaleRecord: BuyoutSaleRecord = {
    id: "sale_rec_1",
    dealId: "deal_1",
    ideaId: "idea_1",
    projectName: "Mondial Analytics",
    sellerUserId: "creator_1",
    sellerName: "Creator Alice",
    buyerUserId: "buyer_1",
    buyerName: "Buyer Bob",
    purchasePrice: 27500,
    currency: "EUR",
    acceptedRevisionNumber: 2,
    signingPackageId: "pkg_signed_1",
    manifestHash: "manifest_hash_test_phase6_12345678",
    assetManifestVersion: 1,
    closingId: "closing_1",
    handoverId: "handover_1",
    soldAt: "2026-08-27T15:00:00Z",
    transferredAssets: ["Brand & Trademark", "Primary Domain (mondial.eco)", "Full Stack Codebase"],
    status: "SOLD",
    auditReference: "SALE-BUYOUT-2026-08-27-001",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Renders loading state and then populates header terms & assets", async () => {
    mockApi.getBuyoutHandover.mockResolvedValue(mockInProgressHandover);

    render(<BuyoutHandoverScreen dealId="deal_1" isCreator={true} />);

    expect(screen.getByText(/Loading Asset Handover Workspace/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Phase 6: Asset Handover & Final Completion")).toBeDefined();
      expect(screen.getByText("€27,500 EUR 🔒")).toBeDefined();
      expect(screen.getByText("2 Weeks 🔒")).toBeDefined();
      expect(screen.getByText("Brand & Trademark")).toBeDefined();
      expect(screen.getByText("Primary Domain (mondial.eco)")).toBeDefined();
      expect(screen.getByText("Full Stack Codebase")).toBeDefined();
    });
  });

  it("2. Creator can deliver an asset", async () => {
    mockApi.getBuyoutHandover.mockResolvedValue(mockInProgressHandover);
    const deliveredAssetHandover = {
      ...mockInProgressHandover,
      assets: [
        {
          ...mockInProgressHandover.assets[0],
          status: "DELIVERED",
          deliveryReference: "DOC-EXPORT-V1",
          sellerNotes: "Exported Brand assets package.",
          sellerDeliveredAt: "2026-08-27T13:00:00Z",
        },
        ...mockInProgressHandover.assets.slice(1),
      ],
      version: 2,
    };
    mockApi.deliverBuyoutAsset.mockResolvedValue(deliveredAssetHandover);

    render(<BuyoutHandoverScreen dealId="deal_1" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getAllByText("Deliver Asset")[0]).toBeDefined();
    });

    fireEvent.click(screen.getAllByText("Deliver Asset")[0]);

    await waitFor(() => {
      expect(screen.getByText(/Deliver Asset: Brand & Trademark/i)).toBeDefined();
    });

    const refInput = screen.getByPlaceholderText(/REPO-INVITE-SENT/i);
    fireEvent.change(refInput, { target: { value: "DOC-EXPORT-V1" } });

    const notesInput = screen.getByPlaceholderText(/Instructions for the buyer/i);
    fireEvent.change(notesInput, { target: { value: "Exported Brand assets package." } });

    fireEvent.click(screen.getByText("Mark Delivered"));

    await waitFor(() => {
      expect(mockApi.deliverBuyoutAsset).toHaveBeenCalledWith(
        "deal_1",
        "asset_brand",
        expect.objectContaining({
          deliveryReference: "DOC-EXPORT-V1",
          notes: "Exported Brand assets package.",
        })
      );
    });
  });

  it("3. Buyer can verify delivered asset", async () => {
    const deliveredHandover: BuyoutHandover = {
      ...mockInProgressHandover,
      assets: [
        {
          ...mockInProgressHandover.assets[0],
          status: "DELIVERED",
          deliveryReference: "DOC-EXPORT-V1",
        },
        ...mockInProgressHandover.assets.slice(1),
      ],
    };
    mockApi.getBuyoutHandover.mockResolvedValue(deliveredHandover);

    const verifiedHandover = {
      ...deliveredHandover,
      assets: [
        {
          ...deliveredHandover.assets[0],
          status: "VERIFIED",
          buyerVerifiedAt: "2026-08-27T14:00:00Z",
        },
        ...deliveredHandover.assets.slice(1),
      ],
    };
    mockApi.verifyBuyoutAsset.mockResolvedValue(verifiedHandover);

    render(<BuyoutHandoverScreen dealId="deal_1" isCreator={false} />);

    await waitFor(() => {
      expect(screen.getByText("Verify & Accept")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Verify & Accept"));

    await waitFor(() => {
      expect(screen.getByText(/Verify Asset: Brand & Trademark/i)).toBeDefined();
    });

    fireEvent.click(screen.getByText("Confirm Verification"));

    await waitFor(() => {
      expect(mockApi.verifyBuyoutAsset).toHaveBeenCalledWith(
        "deal_1",
        "asset_brand",
        expect.any(Object)
      );
    });
  });

  it("4. Buyer can report an issue on an asset", async () => {
    const deliveredHandover: BuyoutHandover = {
      ...mockInProgressHandover,
      assets: [
        mockInProgressHandover.assets[0],
        {
          ...mockInProgressHandover.assets[1],
          status: "DELIVERED",
        },
        mockInProgressHandover.assets[2],
      ],
    };
    mockApi.getBuyoutHandover.mockResolvedValue(deliveredHandover);

    const issueHandover = {
      ...deliveredHandover,
      assets: [
        deliveredHandover.assets[0],
        {
          ...deliveredHandover.assets[1],
          status: "ISSUE_REPORTED",
          issueReason: "Domain auth code expired.",
        },
        deliveredHandover.assets[2],
      ],
      status: "CHANGES_REQUESTED",
      canCompleteSale: false,
      blockers: ["Asset issues reported: Domain auth code expired."],
    };
    mockApi.reportBuyoutAssetIssue.mockResolvedValue(issueHandover);

    render(<BuyoutHandoverScreen dealId="deal_1" isCreator={false} />);

    await waitFor(() => {
      expect(screen.getByText("Report Issue")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Report Issue"));

    await waitFor(() => {
      expect(screen.getByText(/Report Issue: Primary Domain/i)).toBeDefined();
    });

    const reasonInput = screen.getByPlaceholderText(/Explain why the deliverable/i);
    fireEvent.change(reasonInput, { target: { value: "Domain auth code expired." } });

    fireEvent.click(screen.getByText("Submit Issue"));

    await waitFor(() => {
      expect(mockApi.reportBuyoutAssetIssue).toHaveBeenCalledWith(
        "deal_1",
        "asset_domain",
        expect.objectContaining({
          issueReason: "Domain auth code expired.",
        })
      );
    });
  });

  it("5. Bilateral sign-off and Complete Sale CTA triggers atomic finalization", async () => {
    const readyHandover: BuyoutHandover = {
      ...mockInProgressHandover,
      assets: mockInProgressHandover.assets.map((a) => ({
        ...a,
        status: "VERIFIED",
      })),
      canCompleteSale: true,
      blockers: [],
      sellerConfirmedAt: "2026-08-27T14:30:00Z",
      buyerConfirmedAt: "2026-08-27T14:35:00Z",
    };
    mockApi.getBuyoutHandover.mockResolvedValue(readyHandover);

    const completedDeal: EquityDeal = {
      id: "deal_1",
      ideaId: "idea_1",
      projectName: "Mondial Analytics",
      creatorId: "creator_1",
      creatorName: "Creator Alice",
      entrepreneurId: "buyer_1",
      entrepreneurName: "Buyer Bob",
      dealType: "FULL_BUYOUT",
      dealStage: "SOLD",
      status: "completed",
      currentTurn: "buyer",
      conversationId: "conv_1",
      currentRevisionNumber: 2,
      activeTerms: {} as any,
      revisions: [],
      buyoutSaleRecord: mockSaleRecord,
      createdAt: "2026-08-27T10:00:00Z",
      updatedAt: "2026-08-27T15:00:00Z",
    };
    mockApi.completeBuyoutSale.mockResolvedValue(completedDeal);

    render(<BuyoutHandoverScreen dealId="deal_1" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText("Finalize Sale & Mark SOLD")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Finalize Sale & Mark SOLD"));

    await waitFor(() => {
      expect(screen.getByText(/Finalize Full Buyout Sale/i)).toBeDefined();
    });

    fireEvent.click(screen.getByText("Confirm & Finalize Sale"));

    await waitFor(() => {
      expect(mockApi.completeBuyoutSale).toHaveBeenCalledWith("deal_1", expect.any(Object));
      expect(screen.getByText(/FULL BUYOUT SALE COMPLETE/i)).toBeDefined();
    });
  });

  it("6. Renders celebratory SOLD state and Canonical Sale Record Screen", async () => {
    mockApi.getBuyoutSaleRecord.mockResolvedValue(mockSaleRecord);

    render(<BuyoutSaleRecordScreen dealId="deal_1" />);

    expect(screen.getByText(/Loading Canonical Sale Record/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Canonical Buyout Sale Record")).toBeDefined();
      expect(screen.getByText("SOLD")).toBeDefined();
      expect(screen.getByText("€27,500 EUR")).toBeDefined();
      expect(screen.getByText("Creator Alice")).toBeDefined();
      expect(screen.getByText("Buyer Bob")).toBeDefined();
      expect(screen.getByText("Brand & Trademark")).toBeDefined();
      expect(screen.getByText("Primary Domain (mondial.eco)")).toBeDefined();
      expect(screen.getByText("Full Stack Codebase")).toBeDefined();
      expect(screen.getByText("SALE-BUYOUT-2026-08-27-001")).toBeDefined();
    });
  });
});
