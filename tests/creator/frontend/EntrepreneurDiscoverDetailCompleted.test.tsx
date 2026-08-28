import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EntrepreneurDiscoverDetailPage from "@/app/dashboard/entrepreneur/discover/[ideaId]/page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ ideaId: "6a75d05b1165663d6b897a20" }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockApi = vi.hoisted(() => ({
  getProjectDetail: vi.fn(),
  getMyInterest: vi.fn(),
  getNdaStatus: vi.fn(),
  getMyDeal: vi.fn(),
  getPrivateProject: vi.fn(),
  expressInterest: vi.fn(),
  signNda: vi.fn(),
  createEquityOffer: vi.fn(),
  createBuyoutOffer: vi.fn(),
  counterOffer: vi.fn(),
  counterBuyoutOffer: vi.fn(),
  acceptOffer: vi.fn(),
  rejectOffer: vi.fn(),
  downloadPrivateDocument: vi.fn(),
}));

vi.mock("@/lib/api-marketplace-projects", () => ({
  marketplaceProjectsApi: mockApi,
}));

describe("Entrepreneur Discover Detail Page - Completed Project States & Relationship Access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Scenario A: Renders completed acquisition screen for SOLD Full Buyout project", async () => {
    mockApi.getProjectDetail.mockResolvedValue({
      ideaId: "6a75d05b1165663d6b897a20",
      projectName: "Quantum Shield Security",
      tagline: "Post-quantum encryption infrastructure.",
      sector: "Cybersecurity",
      dealModes: ["full_buyout"],
      status: "closed",
      outcome: "SOLD",
      clarityScore: 94,
      readinessScore: 92,
    });

    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: {
        id: "interest-1",
        ideaId: "6a75d05b1165663d6b897a20",
        creatorId: "creator-1",
        entrepreneurId: "buyer-1",
        status: "accepted",
        dealMode: "full_buyout",
        createdAt: "2026-08-01T10:00:00Z",
      },
    });

    mockApi.getNdaStatus.mockResolvedValue({
      ideaId: "6a75d05b1165663d6b897a20",
      accessGranted: true,
      ndaSigned: true,
    });

    mockApi.getMyDeal.mockResolvedValue({
      hasDeal: true,
      deal: {
        id: "deal-buyout-1",
        ideaId: "6a75d05b1165663d6b897a20",
        dealType: "FULL_BUYOUT",
        dealStage: "SOLD",
        status: "sold",
        buyoutTerms: {
          purchasePrice: 250000,
          handoverPeriodWeeks: 4,
        },
      },
    });

    render(<EntrepreneurDiscoverDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading project details...")).not.toBeInTheDocument();
    });

    // Verify "Project Unavailable" is NOT rendered
    expect(screen.queryByText("Project Unavailable")).not.toBeInTheDocument();

    // Verify Project Acquisition Completed banner
    expect(screen.getAllByText("Project Acquisition Completed").length).toBeGreaterThan(0);
    expect(screen.getByText(/This project has been successfully acquired/i)).toBeInTheDocument();

    // Verify Open Acquired Project CTA
    const openAcquiredLinks = screen.getAllByRole("link", { name: /Open Acquired Project/i });
    expect(openAcquiredLinks.length).toBeGreaterThan(0);
    expect(openAcquiredLinks[0]).toHaveAttribute("href", "/dashboard/entrepreneur/acquisitions/deal-buyout-1");

    // Verify View Acquisition Record CTA
    expect(screen.getAllByText("View Acquisition Record").length).toBeGreaterThan(0);

    // Verify What's next panel
    expect(screen.getByText(/What's next\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Review the completed handover and acquisition record/i)).toBeInTheDocument();

    // Verify back navigation
    expect(screen.getByText("Back to My Project Connections")).toBeInTheDocument();
  });

  it("Scenario B: Renders partnership active screen for completed Equity Partnership", async () => {
    mockApi.getProjectDetail.mockResolvedValue({
      ideaId: "6a75d05b1165663d6b897a20",
      projectName: "Neural Health Diagnostics",
      tagline: "AI-driven clinical intelligence platform.",
      sector: "Healthtech",
      dealModes: ["equity_partnership"],
      status: "closed",
      outcome: "CO_FOUNDED",
      clarityScore: 96,
      readinessScore: 95,
    });

    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: {
        id: "interest-2",
        ideaId: "6a75d05b1165663d6b897a20",
        creatorId: "creator-2",
        entrepreneurId: "partner-1",
        status: "accepted",
        dealMode: "equity_partnership",
        createdAt: "2026-08-01T10:00:00Z",
      },
    });

    mockApi.getNdaStatus.mockResolvedValue({
      ideaId: "6a75d05b1165663d6b897a20",
      accessGranted: true,
      ndaSigned: true,
    });

    mockApi.getMyDeal.mockResolvedValue({
      hasDeal: true,
      deal: {
        id: "deal-equity-1",
        ideaId: "6a75d05b1165663d6b897a20",
        dealType: "EQUITY_PARTNERSHIP",
        dealStage: "PARTNERSHIP_ACTIVE",
        status: "active",
        activeTerms: {
          equityPercentage: 35,
          creatorRole: "CTO / Technical Co-founder",
        },
      },
    });

    render(<EntrepreneurDiscoverDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading project details...")).not.toBeInTheDocument();
    });

    // Verify "Project Unavailable" is NOT rendered
    expect(screen.queryByText("Project Unavailable")).not.toBeInTheDocument();

    // Verify Partnership Formation Completed banner
    expect(screen.getByText("Partnership Formation Completed")).toBeInTheDocument();
    expect(screen.getByText(/Partnership formation is complete/i)).toBeInTheDocument();

    // Verify Open Partnership Workspace CTA
    expect(screen.getAllByText("Open Partnership Workspace").length).toBeGreaterThan(0);

    // Verify View Equity & Cap Table CTA
    expect(screen.getAllByText("View Equity & Cap Table").length).toBeGreaterThan(0);

    // Verify What's next panel
    expect(screen.getByText(/What's next\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Review ownership in Equity & Cap Table/i)).toBeInTheDocument();
  });

  it("Scenario D: Renders declined relationship banner for declined interest", async () => {
    mockApi.getProjectDetail.mockResolvedValue({
      ideaId: "6a75d05b1165663d6b897a20",
      projectName: "Solar Grid Mesh",
      tagline: "Decentralized energy microgrid.",
      sector: "CleanTech",
      dealModes: ["full_buyout"],
      status: "closed",
      clarityScore: 88,
      readinessScore: 85,
    });

    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: {
        id: "interest-3",
        ideaId: "6a75d05b1165663d6b897a20",
        creatorId: "creator-3",
        entrepreneurId: "declined-1",
        status: "declined",
        dealMode: "full_buyout",
        createdAt: "2026-08-01T10:00:00Z",
      },
    });

    mockApi.getNdaStatus.mockResolvedValue({
      ideaId: "6a75d05b1165663d6b897a20",
      accessGranted: false,
      ndaSigned: false,
    });

    mockApi.getMyDeal.mockResolvedValue({
      hasDeal: false,
      deal: null,
    });

    render(<EntrepreneurDiscoverDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading project details...")).not.toBeInTheDocument();
    });

    // Verify "Project Unavailable" is NOT rendered
    expect(screen.queryByText("Project Unavailable")).not.toBeInTheDocument();

    // Verify Interest Closed banner
    expect(screen.getByText("Interest Closed")).toBeInTheDocument();
    expect(screen.getByText("This project is no longer active for your request.")).toBeInTheDocument();

    // Verify Back to My Project Connections CTA
    expect(screen.getAllByText("Back to My Project Connections").length).toBeGreaterThan(0);
  });
});
