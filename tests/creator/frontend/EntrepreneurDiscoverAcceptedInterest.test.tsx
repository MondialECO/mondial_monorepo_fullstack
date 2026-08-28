import React from "react";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EntrepreneurDiscoverDetailPage from "@/app/dashboard/entrepreneur/discover/[ideaId]/page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ ideaId: "idea-123" }),
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

describe("Entrepreneur Discover Detail Page - Deal Mode Selection & Accepted Interest UX", () => {
  const dualModeProject = {
    ideaId: "idea-123",
    projectName: "EcoLogistics AI",
    tagline: "Autonomous routing system for sustainable logistics.",
    industry: "Logistics Tech",
    dealModes: ["full_buyout", "equity_partnership"],
    askingPrice: 150000,
    ndaRequired: true,
    status: "available",
  };

  const buyoutOnlyProject = {
    ideaId: "idea-123",
    projectName: "EcoLogistics AI",
    tagline: "Autonomous routing system for sustainable logistics.",
    industry: "Logistics Tech",
    dealModes: ["full_buyout"],
    saleType: "full_buyout",
    askingPrice: 150000,
    ndaRequired: true,
    status: "available",
  };

  const equityOnlyProject = {
    ideaId: "idea-123",
    projectName: "EcoLogistics AI",
    tagline: "Autonomous routing system for sustainable logistics.",
    industry: "Logistics Tech",
    dealModes: ["equity_partnership"],
    saleType: "equity_partnership",
    askingPrice: 150000,
    ndaRequired: true,
    status: "available",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getPrivateProject.mockResolvedValue(null);
  });

  it("1. Single Full Buyout listing automatically selects Full Buyout and enables Express Interest", async () => {
    mockApi.getProjectDetail.mockResolvedValue(buyoutOnlyProject);
    mockApi.getMyInterest.mockResolvedValue({ hasInterest: false, interest: null });
    mockApi.getNdaStatus.mockResolvedValue({ hasNda: false, accessGranted: false, ndaSigned: false });
    mockApi.getMyDeal.mockResolvedValue({ hasDeal: false, deal: null });
    mockApi.expressInterest.mockResolvedValue({
      id: "int-101",
      ideaId: "idea-123",
      status: "pending",
      dealMode: "full_buyout",
      createdAt: new Date().toISOString(),
    });

    render(<EntrepreneurDiscoverDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("EcoLogistics AI")).toBeInTheDocument();
    });

    const card = screen.getByTestId("connect-creator-card");
    expect(within(card).getByText("Available For")).toBeInTheDocument();
    expect(within(card).getByText("Selected Deal Type:")).toBeInTheDocument();
    expect(within(card).getAllByText("Full Buyout").length).toBeGreaterThanOrEqual(1);

    const btn = within(card).getByRole("button", { name: /express interest/i });
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockApi.expressInterest).toHaveBeenCalledWith("idea-123", "", "full_buyout");
    });
  });

  it("2. Single Equity listing automatically selects Co-founder / Equity and enables Express Interest", async () => {
    mockApi.getProjectDetail.mockResolvedValue(equityOnlyProject);
    mockApi.getMyInterest.mockResolvedValue({ hasInterest: false, interest: null });
    mockApi.getNdaStatus.mockResolvedValue({ hasNda: false, accessGranted: false, ndaSigned: false });
    mockApi.getMyDeal.mockResolvedValue({ hasDeal: false, deal: null });
    mockApi.expressInterest.mockResolvedValue({
      id: "int-102",
      ideaId: "idea-123",
      status: "pending",
      dealMode: "equity_partnership",
      createdAt: new Date().toISOString(),
    });

    render(<EntrepreneurDiscoverDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("EcoLogistics AI")).toBeInTheDocument();
    });

    const card = screen.getByTestId("connect-creator-card");
    expect(within(card).getByText("Available For")).toBeInTheDocument();
    expect(within(card).getByText("Selected Deal Type:")).toBeInTheDocument();
    expect(within(card).getAllByText("Co-founder / Equity").length).toBeGreaterThanOrEqual(1);

    const btn = within(card).getByRole("button", { name: /express interest/i });
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockApi.expressInterest).toHaveBeenCalledWith("idea-123", "", "equity_partnership");
    });
  });

  it("3. Dual-mode listing requires explicit selection: disabled before selection, enables after choice", async () => {
    mockApi.getProjectDetail.mockResolvedValue(dualModeProject);
    mockApi.getMyInterest.mockResolvedValue({ hasInterest: false, interest: null });
    mockApi.getNdaStatus.mockResolvedValue({ hasNda: false, accessGranted: false, ndaSigned: false });
    mockApi.getMyDeal.mockResolvedValue({ hasDeal: false, deal: null });
    mockApi.expressInterest.mockResolvedValue({
      id: "int-103",
      ideaId: "idea-123",
      status: "pending",
      dealMode: "full_buyout",
      createdAt: new Date().toISOString(),
    });

    render(<EntrepreneurDiscoverDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("EcoLogistics AI")).toBeInTheDocument();
    });

    const card = screen.getByTestId("connect-creator-card");
    expect(within(card).getByText(/Choose how you'd like to work with this Creator/i)).toBeInTheDocument();

    const btn = within(card).getByRole("button", { name: /express interest/i });
    expect(btn).toBeDisabled();

    // Select Full Buyout
    const buyoutOption = within(card).getByRole("radio", { name: /full buyout/i });
    fireEvent.click(buyoutOption);

    expect(btn).not.toBeDisabled();
    expect(within(card).getByText(/You're expressing interest in a Full Buyout acquisition/i)).toBeInTheDocument();

    // Switch to Co-founder / Equity
    const equityOption = within(card).getByRole("radio", { name: /co-founder \/ equity/i });
    fireEvent.click(equityOption);

    expect(btn).not.toBeDisabled();
    expect(within(card).getByText(/You're expressing interest in a Co-founder \/ Equity partnership/i)).toBeInTheDocument();

    // Switch back to Full Buyout and submit
    fireEvent.click(buyoutOption);
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockApi.expressInterest).toHaveBeenCalledWith("idea-123", "", "full_buyout");
    });
  });

  it("4. Pending Equity inquiry shows Inquiry Type = Co-founder / Equity with Pending badge and sent date", async () => {
    mockApi.getProjectDetail.mockResolvedValue(dualModeProject);
    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: {
        id: "int-1",
        ideaId: "idea-123",
        status: "pending",
        dealMode: "equity_partnership",
        createdAt: "2026-08-28T09:00:00Z",
      },
    });
    mockApi.getNdaStatus.mockResolvedValue({ hasNda: false, accessGranted: false });
    mockApi.getMyDeal.mockResolvedValue({ hasDeal: false, deal: null });

    render(<EntrepreneurDiscoverDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Interest Status: Pending/i)).toBeInTheDocument();
    });

    const card = screen.getByTestId("connect-creator-card");
    expect(within(card).getByText("Inquiry Type:")).toBeInTheDocument();
    expect(within(card).getByText("Co-founder / Equity")).toBeInTheDocument();
    expect(within(card).getByText(/Your inquiry has been sent to the Creator/i)).toBeInTheDocument();
  });

  it("5. Pending Full Buyout inquiry shows Inquiry Type = Full Buyout with Pending badge and sent date", async () => {
    mockApi.getProjectDetail.mockResolvedValue(dualModeProject);
    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: {
        id: "int-2",
        ideaId: "idea-123",
        status: "pending",
        dealMode: "full_buyout",
        createdAt: "2026-08-28T09:00:00Z",
      },
    });
    mockApi.getNdaStatus.mockResolvedValue({ hasNda: false, accessGranted: false });
    mockApi.getMyDeal.mockResolvedValue({ hasDeal: false, deal: null });

    render(<EntrepreneurDiscoverDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Interest Status: Pending/i)).toBeInTheDocument();
    });

    const card = screen.getByTestId("connect-creator-card");
    expect(within(card).getByText("Inquiry Type:")).toBeInTheDocument();
    expect(within(card).getByText("Full Buyout")).toBeInTheDocument();
    expect(within(card).getByText(/Your inquiry has been sent to the Creator/i)).toBeInTheDocument();
  });

  it("6. Accepted Equity inquiry shows specific Equity context, Open Messenger, and Send Equity Offer only (no Buyout offer)", async () => {
    mockApi.getProjectDetail.mockResolvedValue(dualModeProject);
    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: {
        id: "int-1",
        ideaId: "idea-123",
        status: "accepted",
        dealMode: "equity_partnership",
        conversationId: "conv-101",
        createdAt: "2026-08-28T09:00:00Z",
      },
    });
    mockApi.getNdaStatus.mockResolvedValue({ hasNda: true, accessGranted: true, ndaSigned: true });
    mockApi.getMyDeal.mockResolvedValue({ hasDeal: false, deal: null });

    render(<EntrepreneurDiscoverDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Interest Status: Accepted/i)).toBeInTheDocument();
    });

    const card = screen.getByTestId("connect-creator-card");
    expect(within(card).getByText("Accepted Deal Type:")).toBeInTheDocument();
    expect(within(card).getByText("Co-founder / Equity")).toBeInTheDocument();
    expect(within(card).getByText(/The creator accepted your Co-founder \/ Equity inquiry/i)).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /open messenger/i })).toHaveAttribute(
      "href",
      "/dashboard/entrepreneur/messages?conversationId=conv-101"
    );

    // Offers section should only show Equity Offer
    expect(within(card).getByRole("button", { name: /send equity offer/i })).toBeInTheDocument();
    expect(within(card).queryByRole("button", { name: /send buyout offer/i })).not.toBeInTheDocument();
  });

  it("7. Accepted Full Buyout inquiry shows specific Full Buyout context, Open Messenger, and Send Buyout Offer only (no Equity offer)", async () => {
    mockApi.getProjectDetail.mockResolvedValue(dualModeProject);
    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: {
        id: "int-2",
        ideaId: "idea-123",
        status: "accepted",
        dealMode: "full_buyout",
        conversationId: "conv-202",
        createdAt: "2026-08-28T09:00:00Z",
      },
    });
    mockApi.getNdaStatus.mockResolvedValue({ hasNda: true, accessGranted: true, ndaSigned: true });
    mockApi.getMyDeal.mockResolvedValue({ hasDeal: false, deal: null });

    render(<EntrepreneurDiscoverDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Interest Status: Accepted/i)).toBeInTheDocument();
    });

    const card = screen.getByTestId("connect-creator-card");
    expect(within(card).getByText("Accepted Deal Type:")).toBeInTheDocument();
    expect(within(card).getByText("Full Buyout")).toBeInTheDocument();
    expect(within(card).getByText(/The creator accepted your Full Buyout inquiry/i)).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /open messenger/i })).toHaveAttribute(
      "href",
      "/dashboard/entrepreneur/messages?conversationId=conv-202"
    );

    // Offers section should only show Buyout Offer
    expect(within(card).getByRole("button", { name: /send buyout offer/i })).toBeInTheDocument();
    expect(within(card).queryByRole("button", { name: /send equity offer/i })).not.toBeInTheDocument();
  });

  it("8. Accepted Deal with active DealExecution (Full Buyout) derives relationship context directly from DealExecution", async () => {
    mockApi.getProjectDetail.mockResolvedValue({
      ...dualModeProject,
      dealModes: ["equity_partnership"], // Listing edited later by creator, but DealExecution is Full Buyout
    });
    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: {
        id: "int-2",
        ideaId: "idea-123",
        status: "accepted",
        createdAt: "2026-08-28T09:00:00Z",
      },
    });
    mockApi.getNdaStatus.mockResolvedValue({ hasNda: true, accessGranted: true, ndaSigned: true });
    mockApi.getMyDeal.mockResolvedValue({
      hasDeal: true,
      deal: {
        id: "deal-fb-1",
        ideaId: "idea-123",
        dealType: "FULL_BUYOUT",
        dealStage: "BUYOUT_TERMS_ACCEPTED",
        status: "active",
        currentRevisionNumber: 2,
        buyoutTerms: {
          purchasePrice: 160000,
          handoverPeriodWeeks: 3,
        },
      },
    });

    render(<EntrepreneurDiscoverDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Interest Status: Accepted/i)).toBeInTheDocument();
    });

    const card = screen.getByTestId("connect-creator-card");
    expect(within(card).getByText("Accepted Deal Type:")).toBeInTheDocument();
    expect(within(card).getByText("Full Buyout")).toBeInTheDocument();
    expect(within(card).getByText("Full Buyout Offer V2")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /legal & asset transfer review/i })).toBeInTheDocument();
  });

  it("9. Declined inquiry state preserves Inquiry Type and shows Declined badge", async () => {
    mockApi.getProjectDetail.mockResolvedValue(dualModeProject);
    mockApi.getMyInterest.mockResolvedValue({
      hasInterest: true,
      interest: {
        id: "int-3",
        ideaId: "idea-123",
        status: "declined",
        dealMode: "equity_partnership",
        createdAt: "2026-08-28T09:00:00Z",
      },
    });
    mockApi.getNdaStatus.mockResolvedValue({ hasNda: false, accessGranted: false });
    mockApi.getMyDeal.mockResolvedValue({ hasDeal: false, deal: null });

    render(<EntrepreneurDiscoverDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Interest Status: Declined/i)).toBeInTheDocument();
    });

    const card = screen.getByTestId("connect-creator-card");
    expect(within(card).getByText("Inquiry Type:")).toBeInTheDocument();
    expect(within(card).getByText("Co-founder / Equity")).toBeInTheDocument();
    expect(within(card).getByText(/The creator is currently not pursuing discussions for this inquiry/i)).toBeInTheDocument();
  });
});
