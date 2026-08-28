import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProjectDetailPage from "@/app/dashboard/entrepreneur/discover/[ideaId]/page";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ ideaId: "idea_123" }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    getProjectDetail: vi.fn(),
    getMyInterest: vi.fn(),
    getNdaStatus: vi.fn(),
    getMyDeal: vi.fn(),
    getPrivateProject: vi.fn(),
    signNda: vi.fn(),
    downloadDocument: vi.fn(),
    createBuyoutOffer: vi.fn(),
    createEquityOffer: vi.fn(),
  },
}));

vi.mock("@/lib/api-marketplace-projects", () => ({
  marketplaceProjectsApi: mockApi,
}));

describe("Entrepreneur Discover Detail Page — NDA Gate & Offer Visibility", () => {
  const baseProject = {
    ideaId: "idea_123",
    projectName: "Autonomous Logistics Drone",
    tagline: "Autonomous cargo drone network",
    problem: "Inefficient cargo transport",
    targetUser: "B2B Freight operators",
    solution: "Autonomous drone delivery fleet",
    sector: "Logistics",
    country: "Germany",
    stage: "Seed",
    clarityScore: 92,
    readinessScore: 88,
    dealModes: ["full_buyout"],
    saleType: "full_buyout",
    askingPrice: 500000,
    ndaRequired: true,
    audience: "public",
    status: "live",
  };

  const mockAcceptedInterest = {
    id: "interest_456",
    ideaId: "idea_123",
    entrepreneurId: "user_ent_1",
    status: "accepted",
    dealMode: "full_buyout",
    createdAt: "2026-08-20T10:00:00Z",
    conversationId: "conv_789",
  };

  const mockPendingNda = {
    ideaId: "idea_123",
    projectName: "Autonomous Logistics Drone",
    creatorName: "Sarah Connor",
    entrepreneurName: "John Doe",
    interestId: "interest_456",
    interestStatus: "accepted",
    ndaRequired: true,
    ndaSigned: false,
    ndaVersion: "1.0",
    accessGranted: false,
  };

  const mockSignedNda = {
    ...mockPendingNda,
    ndaSigned: true,
    accessGranted: true,
    ndaSignedAt: "2026-08-28T20:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getPrivateProject.mockResolvedValue(null);
    mockApi.getNdaStatus.mockResolvedValue(null);
    mockApi.getMyDeal.mockResolvedValue({ deal: null });
  });

  it("renders Review & Sign NDA in Connect with Creator card when interest is accepted, NDA is required, and access is not yet granted", async () => {
    mockApi.getProjectDetail.mockResolvedValue(baseProject);
    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: mockAcceptedInterest,
    });
    mockApi.getNdaStatus.mockResolvedValue(mockPendingNda);
    mockApi.getMyDeal.mockResolvedValue({ deal: null });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Autonomous Logistics Drone")).toBeInTheDocument();
    });

    const connectCard = screen.getByTestId("connect-creator-card");
    expect(connectCard).toHaveTextContent("Interest Status: Accepted");
    expect(connectCard).toHaveTextContent("NDA Required");
    expect(connectCard).toHaveTextContent("Pending");
    expect(connectCard).toHaveTextContent(
      "The Creator requires a confidentiality agreement before private project materials and acquisition offers can proceed."
    );

    // Review & Sign NDA CTA is visible
    const signButtons = screen.getAllByRole("button", { name: /review & sign nda/i });
    expect(signButtons.length).toBeGreaterThan(0);

    // Send Buyout Offer is strictly HIDDEN
    expect(screen.queryByRole("button", { name: /send buyout offer/i })).not.toBeInTheDocument();
  });

  it("opens NdaReviewModal when clicking Review & Sign NDA button and completes signature flow", async () => {
    mockApi.getProjectDetail.mockResolvedValue(baseProject);
    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: mockAcceptedInterest,
    });
    mockApi.getNdaStatus.mockResolvedValue(mockPendingNda);
    mockApi.getMyDeal.mockResolvedValue({ deal: null });
    mockApi.signNda.mockResolvedValue({
      ndaStatus: "signed",
      signedAt: "2026-08-28T20:00:00Z",
      accessGranted: true,
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Autonomous Logistics Drone")).toBeInTheDocument();
    });

    // Click Review & Sign NDA in the action card
    const signBtn = screen.getAllByRole("button", { name: /review & sign nda/i })[0];
    fireEvent.click(signBtn);

    // Modal is opened
    expect(screen.getAllByText(/Project Non-Disclosure Agreement/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Mondial Platform Standard Confidentiality Terms/i).length
    ).toBeGreaterThan(0);

    // Cancel closes modal
    const cancelBtn = screen.getAllByRole("button", { name: /cancel/i })[0];
    fireEvent.click(cancelBtn);
    expect(screen.queryByText(/Platform Standard Confidentiality Terms/i)).not.toBeInTheDocument();

    // Reopen modal
    fireEvent.click(screen.getAllByRole("button", { name: /review & sign nda/i })[0]);
    expect(screen.getAllByText(/Project Non-Disclosure Agreement/i).length).toBeGreaterThan(0);

    // Check acknowledgement
    const checkbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(checkbox);

    // Submit signature
    mockApi.getNdaStatus.mockResolvedValue(mockSignedNda);
    mockApi.getPrivateProject.mockResolvedValue({
      ideaId: "idea_123",
      businessPlan: { executiveSummary: "Confidential private business plan" },
      financialForecast: { tam: 5000000, projectedArr: 1200000 },
      pricing: { pricingModel: "Tiered", tiers: [] },
      resourcePlan: {},
      gtmPlan: {},
      documents: [],
    });

    const acceptModalBtn = screen.getAllByRole("button", { name: /accept & sign nda/i })[0];
    fireEvent.click(acceptModalBtn);

    await waitFor(() => {
      expect(mockApi.signNda).toHaveBeenCalledWith(
        "idea_123",
        "I accept the terms of the Non-Disclosure Agreement"
      );
    });

    // After signing reload, Send Buyout Offer is visible and NDA Status is Signed
    await waitFor(() => {
      const connectCard = screen.getByTestId("connect-creator-card");
      expect(connectCard).toHaveTextContent("NDA Status:");
      expect(connectCard).toHaveTextContent("Signed");
      expect(screen.getByRole("button", { name: /send buyout offer/i })).toBeInTheDocument();
    });
  });

  it("opens modal and gracefully falls back to project data if ndaStatus is null on initial fetch", async () => {
    mockApi.getProjectDetail.mockResolvedValue(baseProject);
    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: mockAcceptedInterest,
    });
    mockApi.getNdaStatus.mockResolvedValue(null);
    mockApi.getMyDeal.mockResolvedValue({ deal: null });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Autonomous Logistics Drone")).toBeInTheDocument();
    });

    const signBtn = screen.getAllByRole("button", { name: /review & sign nda/i })[0];
    fireEvent.click(signBtn);

    // Modal should still open and render safely with project fallback
    expect(screen.getAllByText(/Project Non-Disclosure Agreement/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Autonomous Logistics Drone").length).toBeGreaterThanOrEqual(2);
  });

  it("renders Send Buyout Offer immediately without NDA prompt when ndaRequired is false", async () => {
    const noNdaProject = {
      ...baseProject,
      ndaRequired: false,
    };

    mockApi.getProjectDetail.mockResolvedValue(noNdaProject);
    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: mockAcceptedInterest,
    });
    mockApi.getNdaStatus.mockResolvedValue({
      ...mockPendingNda,
      ndaRequired: false,
      accessGranted: true,
    });
    mockApi.getMyDeal.mockResolvedValue({ deal: null });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Autonomous Logistics Drone")).toBeInTheDocument();
    });

    // No NDA Required / Pending UI
    expect(screen.queryByText("NDA Required")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /review & sign nda/i })).not.toBeInTheDocument();

    // Send Buyout Offer is directly accessible
    expect(screen.getByRole("button", { name: /send buyout offer/i })).toBeInTheDocument();
  });

  it("handles accepted Equity inquiry correctly before and after NDA signature", async () => {
    const equityProject = {
      ...baseProject,
      dealModes: ["equity_partnership"],
      saleType: "equity_partnership",
      askingPrice: null,
    };

    const equityInterest = {
      ...mockAcceptedInterest,
      dealMode: "equity_partnership",
    };

    mockApi.getProjectDetail.mockResolvedValue(equityProject);
    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: equityInterest,
    });
    mockApi.getNdaStatus.mockResolvedValue(mockPendingNda);
    mockApi.getMyDeal.mockResolvedValue({ deal: null });

    const { unmount } = render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Autonomous Logistics Drone")).toBeInTheDocument();
    });

    // Review & Sign NDA visible, Send Equity Offer hidden
    const connectCard = screen.getByTestId("connect-creator-card");
    expect(connectCard).toHaveTextContent("Accepted Deal Type:Co-founder / Equity");
    expect(connectCard).toHaveTextContent("NDA Required");
    expect(screen.queryByRole("button", { name: /send equity offer/i })).not.toBeInTheDocument();

    unmount();

    // Now simulate signed NDA
    mockApi.getNdaStatus.mockResolvedValue(mockSignedNda);
    mockApi.getPrivateProject.mockResolvedValue({
      ideaId: "idea_123",
      businessPlan: { executiveSummary: "Confidential plan" },
      financialForecast: {},
      pricing: { tiers: [] },
      resourcePlan: {},
      gtmPlan: {},
      documents: [],
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /send equity offer/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /send buyout offer/i })).not.toBeInTheDocument();
    });
  });

  it("blocks NDA progression when project is SOLD", async () => {
    const soldProject = {
      ...baseProject,
      status: "closed",
    };

    mockApi.getProjectDetail.mockResolvedValue(soldProject);
    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: mockAcceptedInterest,
    });
    mockApi.getNdaStatus.mockResolvedValue(mockPendingNda);
    mockApi.getMyDeal.mockResolvedValue({
      deal: {
        id: "deal_999",
        dealType: "FULL_BUYOUT",
        dealStage: "SOLD",
        status: "completed",
        currentRevisionNumber: 1,
        activeTerms: {},
      },
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Autonomous Logistics Drone")).toBeInTheDocument();
    });

    // No NDA sign CTA and no Send Buyout Offer button
    expect(screen.queryByRole("button", { name: /review & sign nda/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send buyout offer/i })).not.toBeInTheDocument();
  });
});
