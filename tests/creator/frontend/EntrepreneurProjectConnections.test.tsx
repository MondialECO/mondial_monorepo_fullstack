import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyProjectConnectionsPage from "@/app/dashboard/entrepreneur/discover/projects/page";
import marketplaceProjectsApi, {
  type EntrepreneurProjectConnection
} from "@/lib/api-marketplace-projects";

const { mockPush, mockApi } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockApi: {
    getMyProjectConnections: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn()
  }),
  usePathname: () => "/dashboard/entrepreneur/discover/projects"
}));

vi.mock("next/link", () => ({
  default: ({ children, href, className, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api-marketplace-projects", () => ({
  default: mockApi,
  marketplaceProjectsApi: mockApi,
}));

const mockConnections: EntrepreneurProjectConnection[] = [
  {
    ideaId: "6a75d05b1165663d6b897a01",
    projectName: "Autonomous Freight AI",
    projectSummary: "Next-gen dispatch and routing platform for intermodal freight.",
    problemStatement: "Freight inefficiencies cost logistics firms billions.",
    sector: "Logistics",
    clarityScore: 88,
    creatorId: "creator_1",
    creatorName: "Dr. Alice Smith",
    creatorAvatarUrl: null,
    interestId: "int_1",
    interestStatus: "accepted",
    selectedDealMode: "EQUITY_PARTNERSHIP",
    ndaRequired: true,
    ndaStatus: "SIGNED",
    dealExecutionId: "deal_1",
    dealType: "EQUITY_PARTNERSHIP",
    dealStage: "LEGAL_REVIEW_PENDING",
    dealStatus: "initiated",
    displayStatus: "Legal Review",
    category: "Active",
    projectOutcome: null,
    lastActivityAt: "2026-08-28T20:00:00Z",
    createdAt: "2026-08-20T10:00:00Z"
  },
  {
    ideaId: "6a75d05b1165663d6b897a02",
    projectName: "MedTech Diagnostic Cloud",
    projectSummary: "AI imaging diagnostics for clinical radiology labs.",
    problemStatement: "Diagnostic backlogs delay urgent treatments.",
    sector: "Healthtech",
    clarityScore: 92,
    creatorId: "creator_2",
    creatorName: "Bob Creator",
    creatorAvatarUrl: null,
    interestId: "int_2",
    interestStatus: "pending",
    selectedDealMode: "FULL_BUYOUT",
    ndaRequired: true,
    ndaStatus: "PENDING",
    dealExecutionId: null,
    dealType: "FULL_BUYOUT",
    dealStage: null,
    dealStatus: null,
    displayStatus: "Interest Pending",
    category: "Pending",
    projectOutcome: null,
    lastActivityAt: "2026-08-27T12:00:00Z",
    createdAt: "2026-08-27T12:00:00Z"
  },
  {
    ideaId: "6a75d05b1165663d6b897a03",
    projectName: "FinTech Settlement Ledger",
    projectSummary: "Instant cross-border stablecoin liquidity settlement.",
    problemStatement: "High banking fees and 3-day delays.",
    sector: "Fintech",
    clarityScore: 95,
    creatorId: "creator_3",
    creatorName: "Claire Founder",
    creatorAvatarUrl: null,
    interestId: "int_3",
    interestStatus: "accepted",
    selectedDealMode: "FULL_BUYOUT",
    ndaRequired: true,
    ndaStatus: "SIGNED",
    dealExecutionId: "deal_3",
    dealType: "FULL_BUYOUT",
    dealStage: "SOLD",
    dealStatus: "sold",
    displayStatus: "SOLD",
    category: "Completed",
    projectOutcome: "SOLD",
    lastActivityAt: "2026-08-29T01:00:00Z",
    createdAt: "2026-08-15T08:00:00Z"
  }
];

describe("Entrepreneur My Project Connections Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header, hero banner, summary metric cards, and navigation tabs", async () => {
    mockApi.getMyProjectConnections.mockResolvedValueOnce(mockConnections);

    render(<MyProjectConnectionsPage />);

    // Wait for data load
    await waitFor(() => {
      expect(screen.getAllByText("My Project Connections").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Explore Discover")).toBeInTheDocument();
    expect(screen.getByText(/Projects you have connected with, expressed interest in, or started a deal with/i)).toBeInTheDocument();

    // Summary cards
    expect(screen.getByText("All Projects")).toBeInTheDocument();
    expect(screen.getByText("Active Deals")).toBeInTheDocument();
    expect(screen.getByText("Pending Actions")).toBeInTheDocument();
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
  });

  it("renders project connection cards with correct names, creators, and statuses", async () => {
    mockApi.getMyProjectConnections.mockResolvedValueOnce(mockConnections);

    render(<MyProjectConnectionsPage />);

    await waitFor(() => {
      expect(screen.getByText("Autonomous Freight AI")).toBeInTheDocument();
      expect(screen.getByText("MedTech Diagnostic Cloud")).toBeInTheDocument();
      expect(screen.getByText("FinTech Settlement Ledger")).toBeInTheDocument();
    });

    expect(screen.getByText("Dr. Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Creator")).toBeInTheDocument();
    expect(screen.getByText("Claire Founder")).toBeInTheDocument();

    expect(screen.getAllByText("Legal Review").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Interest Pending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SOLD").length).toBeGreaterThan(0);
  });

  it("navigates to Discover detail route on card click and button click with canonical ideaId", async () => {
    mockApi.getMyProjectConnections.mockResolvedValueOnce(mockConnections);

    render(<MyProjectConnectionsPage />);

    await waitFor(() => {
      expect(screen.getByText("Autonomous Freight AI")).toBeInTheDocument();
    });

    const freightCard = screen.getByText("Autonomous Freight AI").closest(".cursor-pointer");
    expect(freightCard).not.toBeNull();
    fireEvent.click(freightCard!);

    expect(mockPush).toHaveBeenCalledWith("/dashboard/entrepreneur/discover/6a75d05b1165663d6b897a01");

    const continueButtons = screen.getAllByRole("button", { name: /Continue Deal/i });
    fireEvent.click(continueButtons[0]);

    expect(mockPush).toHaveBeenCalledWith("/dashboard/entrepreneur/discover/6a75d05b1165663d6b897a01");
  });

  it("filters project cards by category (Active, Pending, Completed)", async () => {
    mockApi.getMyProjectConnections.mockResolvedValueOnce(mockConnections);

    render(<MyProjectConnectionsPage />);

    await waitFor(() => {
      expect(screen.getByText("Autonomous Freight AI")).toBeInTheDocument();
    });

    // Click "Active" filter pill
    const activeButtons = screen.getAllByRole("button", { name: /^Active$/i });
    fireEvent.click(activeButtons[0]);

    expect(screen.getByText("Autonomous Freight AI")).toBeInTheDocument();
    expect(screen.queryByText("MedTech Diagnostic Cloud")).not.toBeInTheDocument();
    expect(screen.queryByText("FinTech Settlement Ledger")).not.toBeInTheDocument();

    // Click "Pending" filter pill
    const pendingButtons = screen.getAllByRole("button", { name: /^Pending$/i });
    fireEvent.click(pendingButtons[0]);

    expect(screen.queryByText("Autonomous Freight AI")).not.toBeInTheDocument();
    expect(screen.getByText("MedTech Diagnostic Cloud")).toBeInTheDocument();
    expect(screen.queryByText("FinTech Settlement Ledger")).not.toBeInTheDocument();

    // Click "Completed" filter pill
    const completedButtons = screen.getAllByRole("button", { name: /^Completed$/i });
    fireEvent.click(completedButtons[0]);

    expect(screen.queryByText("Autonomous Freight AI")).not.toBeInTheDocument();
    expect(screen.queryByText("MedTech Diagnostic Cloud")).not.toBeInTheDocument();
    expect(screen.getByText("FinTech Settlement Ledger")).toBeInTheDocument();
  });

  it("filters project cards by search query", async () => {
    mockApi.getMyProjectConnections.mockResolvedValueOnce(mockConnections);

    render(<MyProjectConnectionsPage />);

    await waitFor(() => {
      expect(screen.getByText("Autonomous Freight AI")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search connected projects by name, creator, or topic/i);
    fireEvent.change(searchInput, { target: { value: "Radiology" } });

    expect(screen.queryByText("Autonomous Freight AI")).not.toBeInTheDocument();
    expect(screen.getByText("MedTech Diagnostic Cloud")).toBeInTheDocument();
    expect(screen.queryByText("FinTech Settlement Ledger")).not.toBeInTheDocument();
  });

  it("renders empty state when entrepreneur has no project connections", async () => {
    mockApi.getMyProjectConnections.mockResolvedValueOnce([]);

    render(<MyProjectConnectionsPage />);

    await waitFor(() => {
      expect(screen.getByText("No project connections yet")).toBeInTheDocument();
    });

    expect(screen.getByText(/Discover Creator projects and express interest to start building your project pipeline/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Discover Projects/i })).toHaveAttribute("href", "/dashboard/entrepreneur/discover");
  });
});
