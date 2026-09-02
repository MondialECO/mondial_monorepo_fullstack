import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import MyIdeasPage from "@/app/dashboard/creator/myideas/page";
import MySalesPage from "@/app/dashboard/creator/sales/page";
import { BuyoutSaleRecord } from "@/lib/api-marketplace-projects";
import { IdeaCard } from "@/lib/api-creator-journey";
import { menu } from "@/lib/menu";
import { UserRole } from "@/lib/roles";

// Mock hoisted APIs
const { mockApi, mockJourneyApi } = vi.hoisted(() => {
  return {
    mockApi: {
      getMyBuyoutSales: vi.fn(),
      getMyActiveBuyoutDeals: vi.fn(),
      getBuyoutSaleRecord: vi.fn(),
    },
    mockJourneyApi: {
      listIdeas: vi.fn(),
      get: vi.fn().mockResolvedValue({
        journey: { phase2Data: {}, phase5Data: {} },
        computedStatus: {
          phase1: { status: "completed" },
          phase2: { status: "completed" },
          phase3: { status: "completed" },
          phase4: { status: "completed" },
          phase5: { status: "completed" },
          phase6: { status: "completed" },
        },
      }),
      setActiveIdea: vi.fn(),
      createIdea: vi.fn(),
    },
  };
});

vi.mock("@/lib/api-marketplace-projects", () => ({
  default: mockApi,
  marketplaceProjectsApi: mockApi,
}));

vi.mock("@/lib/api-creator-journey", () => ({
  creatorJourneyApi: mockJourneyApi,
}));

// Mock Next.js Link & navigation
vi.mock("next/link", () => ({
  default: ({ children, href, className, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ dealId: "deal_123" }),
  useSearchParams: () => ({ get: () => null }),
}));

// Mock Progress Provider
vi.mock("@/providers/CreatorProgressProvider", () => ({
  useCreatorProgress: () => ({
    state: {
      project: {
        exists: true,
        name: "Mondial Platform",
        concept: "Decarbonization tracking",
        branding: {
          logoType: "ai",
          logoUrl: "https://example.com/logo.png",
          primaryColor: "#10b981",
        },
      },
      journeyState: {
        phase1: { status: "completed", currentStep: 1, completedSteps: [] },
        phase2: { status: "completed", currentStep: 12, completedSteps: [] },
        phase3: { status: "completed", currentStep: 5, completedSteps: [] },
        phase4: { status: "completed", currentStep: 4, completedSteps: [] },
        phase5: { status: "completed", currentStep: 3, completedSteps: [], selectedPath: "sell" },
        phase6: { status: "completed", currentStep: 2, completedSteps: [] },
      },
      outputs: { financialForecastVersions: [] },
    },
    resetJourney: vi.fn(),
    updateProject: vi.fn(),
    setEntryPath: vi.fn(),
    refetch: vi.fn().mockResolvedValue({ ok: true, activeIdeaId: "idea_sold_1" }),
  }),
}));

const mockSaleRecords: BuyoutSaleRecord[] = [
  {
    id: "sale_1",
    dealId: "deal_123",
    ideaId: "idea_sold_1",
    projectName: "Mondial Analytics",
    sellerUserId: "creator_1",
    sellerName: "Alice Creator",
    buyerUserId: "buyer_1",
    buyerName: "Bob Buyer",
    purchasePrice: 27500,
    currency: "EUR",
    acceptedRevisionNumber: 1,
    assetManifestVersion: 1,
    soldAt: "2026-08-27T15:00:00Z",
    transferredAssets: ["Brand & Trademark", "Logo & Design Assets", "Full Stack Codebase"],
    manifestHash: "manifest_hash_abc",
    signingPackageId: "sign_1",
    closingId: "close_1",
    handoverId: "handover_1",
    status: "SOLD",
    auditReference: "SALE-REF-001",
  },
];

const mockActiveBuyoutDeals: any[] = [
  {
    id: "deal_active_1",
    ideaId: "idea_active_1",
    projectName: "Decarbon AI Suite",
    dealType: "FULL_BUYOUT",
    dealStage: "BUYOUT_LEGAL_REVIEW_PENDING",
    status: "ACTIVE",
    creatorId: "creator_1",
    creatorName: "Alice Creator",
    entrepreneurId: "buyer_2",
    entrepreneurName: "Elena Entrepreneur",
    currentRevisionNumber: 2,
    buyoutTerms: {
      purchasePrice: 42000,
      buyoutPrice: 42000,
      currency: "EUR",
    },
    updatedAt: "2026-08-28T04:00:00Z",
    createdAt: "2026-08-28T02:00:00Z",
  },
  {
    id: "deal_active_2",
    ideaId: "idea_active_2",
    projectName: "Solar Routing Matrix",
    dealType: "FULL_BUYOUT",
    dealStage: "BUYOUT_SIGNATURE_PENDING",
    status: "ACTIVE",
    creatorId: "creator_1",
    creatorName: "Alice Creator",
    entrepreneurId: "buyer_3",
    entrepreneurName: "David Direct",
    currentRevisionNumber: 1,
    buyoutTerms: {
      purchasePrice: 65000,
      buyoutPrice: 65000,
      currency: "EUR",
    },
    updatedAt: "2026-08-28T04:30:00Z",
    createdAt: "2026-08-28T03:00:00Z",
  },
];

const mockIdeas: IdeaCard[] = [
  {
    ideaId: "idea_sold_1",
    name: "Mondial Analytics",
    concept: "Enterprise sustainability analytics engine",
    problem: "Fragmented carbon reporting",
    status: "active",
    createdAt: "2026-08-01T10:00:00Z",
    lastActiveAt: "2026-08-27T15:00:00Z",
    isActive: true,
    isLeveledUp: false,
    phaseReached: 6,
    projectOutcome: "SOLD",
    activeBuyoutDealId: "deal_123",
    salePrice: 27500,
    soldAt: "2026-08-27T15:00:00Z",
    acquiredByUserId: "buyer_1",
  },
  {
    ideaId: "idea_active_2",
    name: "Eco Logistics",
    concept: "Green fleet routing",
    problem: "High fuel consumption",
    status: "active",
    createdAt: "2026-08-15T10:00:00Z",
    lastActiveAt: "2026-08-26T12:00:00Z",
    isActive: false,
    isLeveledUp: false,
    phaseReached: 3,
    projectOutcome: "",
  },
];

describe("Creator Sales & My Ideas SOLD Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getMyActiveBuyoutDeals.mockResolvedValue([]);
    mockApi.getMyBuyoutSales.mockResolvedValue([]);
  });

  it("1. Creator Menu includes Project Sales under Project Marketplace in correct order", () => {
    const creatorSections = menu[UserRole.CREATOR];
    const marketplaceSection = creatorSections.find((s) => s.title === "Project Marketplace");
    expect(marketplaceSection).toBeDefined();

    const itemLabels = marketplaceSection!.items.map((i) => i.label);
    expect(itemLabels).toEqual([
      "Project Marketplace",
      "Launch to Market",
      "Partnerships",
      "Project Sales",
    ]);

    const salesItem = marketplaceSection!.items.find((i) => i.label === "Project Sales");
    expect(salesItem?.href).toBe("/dashboard/creator/sales");
  });

  it("2. My Ideas renders SOLD badge and primary 'View Sale Record' CTA", async () => {
    mockJourneyApi.listIdeas.mockResolvedValue(mockIdeas);

    render(<MyIdeasPage />);

    await waitFor(() => {
      expect(screen.getByText("My Ideas (2)")).toBeDefined();
    });

    // Check SOLD badge
    expect(screen.getByText("SOLD")).toBeDefined();

    // Check sale details
    expect(screen.getByText(/Transferred via Full Buyout for €27,500 EUR/)).toBeDefined();

    // Check primary CTA for SOLD idea
    const saleRecordCta = screen.getByRole("link", { name: /View Sale Record/i });
    expect(saleRecordCta).toBeDefined();
    expect(saleRecordCta.getAttribute("href")).toBe("/dashboard/creator/sales/deal_123");

    // Active non-sold idea has Continue CTA
    expect(screen.getByRole("button", { name: /Continue/i })).toBeDefined();
  });

  it("3. My Sales page fetches and displays completed buyout sales with metrics", async () => {
    mockApi.getMyBuyoutSales.mockResolvedValue(mockSaleRecords);
    mockApi.getMyActiveBuyoutDeals.mockResolvedValue([]);

    render(<MySalesPage />);

    await waitFor(() => {
      expect(screen.getByText("My Sales & Buyouts")).toBeDefined();
    });

    expect(screen.getByText("Completed Sales (1)")).toBeDefined();
    expect(screen.getByText("No Active Buyouts")).toBeDefined();
    expect(screen.getByText("Mondial Analytics")).toBeDefined();
    expect(screen.getByText("€27,500 EUR")).toBeDefined();
    expect(screen.getByText("Ref: SALE-REF-001")).toBeDefined();
    expect(screen.getByText(/3 Assets Delivered/)).toBeDefined();

    const viewRecordLink = screen.getByRole("link", { name: /View Sale Record/i });
    expect(viewRecordLink.getAttribute("href")).toBe("/dashboard/creator/sales/deal_123");
  });

  it("4. My Sales page displays Active Buyout deals with stage badges and Open Deal CTAs", async () => {
    mockApi.getMyActiveBuyoutDeals.mockResolvedValue(mockActiveBuyoutDeals);
    mockApi.getMyBuyoutSales.mockResolvedValue([]);

    render(<MySalesPage />);

    await waitFor(() => {
      expect(screen.getByText("Active Buyouts (2)")).toBeDefined();
    });

    expect(screen.getByText("No Completed Sales Yet")).toBeDefined();
    expect(screen.getByText("Decarbon AI Suite")).toBeDefined();
    expect(screen.getByText("Legal & Transfer")).toBeDefined();
    expect(screen.getByText("€42,000 EUR")).toBeDefined();
    expect(screen.getByText("Solar Routing Matrix")).toBeDefined();
    expect(screen.getByText("Agreement Signing")).toBeDefined();
    expect(screen.getByText("€65,000 EUR")).toBeDefined();

    const openDealLinks = screen.getAllByRole("link", { name: /Open Deal/i });
    expect(openDealLinks).toHaveLength(2);
    expect(openDealLinks[0].getAttribute("href")).toBe("/dashboard/creator/sales/deal_active_1");
    expect(openDealLinks[1].getAttribute("href")).toBe("/dashboard/creator/sales/deal_active_2");
  });

  it("5. My Sales displays both Active Buyouts and Completed Sales side by side", async () => {
    mockApi.getMyActiveBuyoutDeals.mockResolvedValue(mockActiveBuyoutDeals);
    mockApi.getMyBuyoutSales.mockResolvedValue(mockSaleRecords);

    render(<MySalesPage />);

    await waitFor(() => {
      expect(screen.getByText("Active Buyouts (2)")).toBeDefined();
      expect(screen.getByText("Completed Sales (1)")).toBeDefined();
    });

    expect(screen.getByText("Decarbon AI Suite")).toBeDefined();
    expect(screen.getByText("Solar Routing Matrix")).toBeDefined();
    expect(screen.getByText("Mondial Analytics")).toBeDefined();

    // Verify CTAs
    expect(screen.getAllByRole("link", { name: /Open Deal/i })).toHaveLength(2);
    expect(screen.getByRole("link", { name: /View Sale Record/i })).toBeDefined();
  });

  it("6. My Sales displays global empty state when neither active nor completed sales exist", async () => {
    mockApi.getMyActiveBuyoutDeals.mockResolvedValue([]);
    mockApi.getMyBuyoutSales.mockResolvedValue([]);

    render(<MySalesPage />);

    await waitFor(() => {
      expect(screen.getByText("No Buyout Deals Yet")).toBeDefined();
    });

    expect(screen.getByText(/When an entrepreneur enters a Full Buyout deal/i)).toBeDefined();
    const myIdeasLink = screen.getByRole("link", { name: /View My Ideas/i });
    expect(myIdeasLink.getAttribute("href")).toBe("/dashboard/creator/myideas");
  });
});
