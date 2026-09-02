import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import EntrepreneurAcquisitionsPage from "@/app/dashboard/entrepreneur/acquisitions/page";
import { menu } from "@/lib/menu";
import { UserRole } from "@/lib/roles";

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    getMyBuyoutSales: vi.fn(),
    getMyAcquisitions: vi.fn(),
    getMyActiveAcquisitions: vi.fn(),
    getBuyoutSaleRecord: vi.fn(),
  },
}));

vi.mock("@/lib/api-marketplace-projects", () => ({
  default: mockApi,
  marketplaceProjectsApi: mockApi,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, className, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

const mockCompletedAcquisitions = [
  {
    id: "sale-rec-1",
    dealId: "deal-buyout-101",
    businessIdeaId: "idea-999",
    projectName: "Quantum SaaS Platform",
    sellerUserId: "creator-42",
    sellerName: "Sarah Connor",
    buyerUserId: "entrepreneur-1",
    buyerName: "John Connor",
    purchasePrice: 125000,
    currency: "EUR",
    soldAt: "2026-08-20T12:00:00Z",
    status: "SOLD",
    auditReference: "BUYOUT-2026-08-101",
    transferredAssets: [
      { name: "Production Source Code", scope: "Full GitHub Repo", verified: true },
      { name: "Domain & Trademark", scope: "DNS Transfer", verified: true },
    ],
  },
];

const mockActiveAcquisitions = [
  {
    id: "deal-active-acq-1",
    ideaId: "idea-acq-1",
    projectName: "HyperScale Carbon Router",
    creatorId: "creator-99",
    creatorName: "Elena Green",
    entrepreneurId: "entrepreneur-1",
    entrepreneurName: "John Connor",
    dealType: "FULL_BUYOUT",
    dealStage: "BUYOUT_LEGAL_REVIEW_PENDING",
    status: "ACTIVE",
    currentRevisionNumber: 2,
    buyoutTerms: {
      purchasePrice: 85000,
      buyoutPrice: 85000,
      currency: "EUR",
    },
    updatedAt: "2026-08-28T05:00:00Z",
    createdAt: "2026-08-28T01:00:00Z",
  },
  {
    id: "deal-active-acq-2",
    ideaId: "idea-acq-2",
    projectName: "BioThermal Battery Spec",
    creatorId: "creator-88",
    creatorName: "Marcus Vance",
    entrepreneurId: "entrepreneur-1",
    entrepreneurName: "John Connor",
    dealType: "FULL_BUYOUT",
    dealStage: "BUYOUT_SIGNATURE_PENDING",
    status: "ACTIVE",
    currentRevisionNumber: 1,
    buyoutTerms: {
      purchasePrice: 110000,
      buyoutPrice: 110000,
      currency: "EUR",
    },
    updatedAt: "2026-08-28T05:30:00Z",
    createdAt: "2026-08-28T02:00:00Z",
  },
];

describe("Entrepreneur Acquisitions & Navigation Audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getMyAcquisitions.mockResolvedValue([]);
    mockApi.getMyActiveAcquisitions.mockResolvedValue([]);
  });

  it("renders Entrepreneur menu with 4 distinct sections and canonical routes", () => {
    const entrepreneurMenu = menu[UserRole.ENTREPRENEUR];
    expect(entrepreneurMenu).toBeDefined();

    const titles = entrepreneurMenu.map((group) => group.title);
    expect(titles).toContain("Main");
    expect(titles).toContain("Operations");
    expect(titles).toContain("Funding & Matching");
    expect(titles).toContain("Communication");

    const mainItems = entrepreneurMenu.find((g) => g.title === "Main")?.items || [];
    const mainHrefs = mainItems.map((i) => i.href);
    expect(mainHrefs).toContain("/dashboard/entrepreneur");
    expect(mainHrefs).toContain("/dashboard/entrepreneur/discover");
    expect(mainHrefs).toContain("/dashboard/entrepreneur/deals");
    expect(mainHrefs).toContain("/dashboard/entrepreneur/acquisitions");

    const fundingItems = entrepreneurMenu.find((g) => g.title === "Funding & Matching")?.items || [];
    const investorDealsItem = fundingItems.find((i) => i.label === "Investor Deals");
    expect(investorDealsItem?.href).toBe("/dashboard/entrepreneur/deals");
  });

  it("renders My Acquisitions page with real completed buyout records and action link", async () => {
    mockApi.getMyAcquisitions.mockResolvedValue(mockCompletedAcquisitions);
    mockApi.getMyActiveAcquisitions.mockResolvedValue([]);

    render(<EntrepreneurAcquisitionsPage />);

    expect(await screen.findByText("My Acquisitions")).toBeInTheDocument();
    expect(await screen.findByText("Completed Acquisitions (1)")).toBeInTheDocument();
    expect(await screen.findByText("No Active Acquisitions")).toBeInTheDocument();
    expect(await screen.findByText("Quantum SaaS Platform")).toBeInTheDocument();
    expect(await screen.findByText("ACQUIRED")).toBeInTheDocument();
    expect(await screen.findByText("€125,000 EUR")).toBeInTheDocument();
    expect(await screen.findByText("Sarah Connor")).toBeInTheDocument();
    expect(await screen.findByText("2 Deliverables")).toBeInTheDocument();

    const openButton = screen.getByRole("link", { name: /Open Acquired Project/i });
    expect(openButton).toHaveAttribute("href", "/dashboard/entrepreneur/acquisitions/deal-buyout-101");
  });

  it("renders Active Acquisitions with stage badges and Open Acquisition CTAs", async () => {
    mockApi.getMyActiveAcquisitions.mockResolvedValue(mockActiveAcquisitions);
    mockApi.getMyAcquisitions.mockResolvedValue([]);

    render(<EntrepreneurAcquisitionsPage />);

    expect(await screen.findByText("Active Acquisitions (2)")).toBeInTheDocument();
    expect(await screen.findByText("No Completed Acquisitions Yet")).toBeInTheDocument();
    expect(await screen.findByText("HyperScale Carbon Router")).toBeInTheDocument();
    expect(await screen.findByText("Legal & Transfer")).toBeInTheDocument();
    expect(await screen.findByText("€85,000 EUR")).toBeInTheDocument();
    expect(await screen.findByText("BioThermal Battery Spec")).toBeInTheDocument();
    expect(await screen.findByText("Agreement Signing")).toBeInTheDocument();
    expect(await screen.findByText("€110,000 EUR")).toBeInTheDocument();

    const openAcqLinks = screen.getAllByRole("link", { name: /Open Acquisition/i });
    expect(openAcqLinks).toHaveLength(2);
    expect(openAcqLinks[0]).toHaveAttribute("href", "/dashboard/entrepreneur/acquisitions/deal-active-acq-1");
    expect(openAcqLinks[1]).toHaveAttribute("href", "/dashboard/entrepreneur/acquisitions/deal-active-acq-2");
  });

  it("renders both Active Acquisitions and Completed Acquisitions side-by-side", async () => {
    mockApi.getMyActiveAcquisitions.mockResolvedValue(mockActiveAcquisitions);
    mockApi.getMyAcquisitions.mockResolvedValue(mockCompletedAcquisitions);

    render(<EntrepreneurAcquisitionsPage />);

    expect(await screen.findByText("Active Acquisitions (2)")).toBeInTheDocument();
    expect(await screen.findByText("Completed Acquisitions (1)")).toBeInTheDocument();
    expect(await screen.findByText("HyperScale Carbon Router")).toBeInTheDocument();
    expect(await screen.findByText("Quantum SaaS Platform")).toBeInTheDocument();

    expect(screen.getAllByRole("link", { name: /Open Acquisition/i })).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Open Acquired Project/i })).toBeDefined();
  });

  it("renders 'In Negotiation' when deal has no accepted price, and formatted amount when accepted terms exist", async () => {
    const deals = [
      {
        id: "deal-discoly",
        ideaId: "idea-discoly",
        projectName: "Discoly",
        creatorId: "creator-uuid-1",
        creatorName: "Sarah Connor",
        entrepreneurId: "entrepreneur-1",
        entrepreneurName: "John Connor",
        dealType: "FULL_BUYOUT",
        dealStage: "BUYOUT_TERMS_ACCEPTED",
        status: "ACTIVE",
        currentRevisionNumber: 1,
        buyoutTerms: {
          purchasePrice: 25000,
          currency: "EUR",
        },
        updatedAt: "2026-08-28T06:00:00Z",
        createdAt: "2026-08-28T05:00:00Z",
      },
      {
        id: "deal-negotiating",
        ideaId: "idea-negotiating",
        projectName: "Solaris Engine",
        creatorId: "creator-uuid-2",
        creatorName: "Dr. Miles Dyson",
        entrepreneurId: "entrepreneur-1",
        entrepreneurName: "John Connor",
        dealType: "FULL_BUYOUT",
        dealStage: "OFFER_NEGOTIATION",
        status: "ACTIVE",
        currentRevisionNumber: 1,
        buyoutTerms: undefined,
        activeTerms: undefined,
        updatedAt: "2026-08-28T06:00:00Z",
        createdAt: "2026-08-28T05:00:00Z",
      },
    ];

    mockApi.getMyActiveAcquisitions.mockResolvedValue(deals);
    mockApi.getMyAcquisitions.mockResolvedValue([]);

    render(<EntrepreneurAcquisitionsPage />);

    expect(await screen.findByText("Discoly")).toBeInTheDocument();
    expect(await screen.findByText("Buyout Terms Accepted")).toBeInTheDocument();
    expect(await screen.findByText("€25,000 EUR")).toBeInTheDocument();
    expect(await screen.findByText("Sarah Connor")).toBeInTheDocument();

    expect(await screen.findByText("Solaris Engine")).toBeInTheDocument();
    expect(await screen.findByText("Terms Negotiation")).toBeInTheDocument();
    expect(await screen.findByText("In Negotiation")).toBeInTheDocument();
    expect(await screen.findByText("Dr. Miles Dyson")).toBeInTheDocument();
  });

  it("renders global empty state when neither active nor completed acquisitions exist", async () => {
    mockApi.getMyActiveAcquisitions.mockResolvedValue([]);
    mockApi.getMyAcquisitions.mockResolvedValue([]);

    render(<EntrepreneurAcquisitionsPage />);

    expect(await screen.findByText("No Acquisitions Yet")).toBeInTheDocument();
    expect(await screen.findByText(/When you make an offer to acquire a venture/i)).toBeInTheDocument();
    const browseLink = screen.getByRole("link", { name: /Browse Available Projects/i });
    expect(browseLink).toHaveAttribute("href", "/dashboard/entrepreneur/discover");
  });
});
