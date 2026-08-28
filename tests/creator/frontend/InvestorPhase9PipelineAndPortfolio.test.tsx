import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import KanbanBoard from "@/app/dashboard/investor/pipeline/_components/KanbanBoard";
import { menu } from "@/lib/menu";
import { UserRole } from "@/lib/roles";
import type { InvestorPipelineColumns, OpportunityCard } from "@/types/investor/opportunities";

vi.mock("next/link", () => ({
  default: ({ children, href, className, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

const mockCard = (id: string, name: string, status: string): OpportunityCard => ({
  companyId: id,
  companyName: name,
  tagline: "Test Tagline",
  industry: "Fintech",
  country: "Ireland",
  fundingRoundType: "Seed",
  fundingAskAmount: 500000,
  valuation: 5000000,
  matchScore: 92,
  matchStatus: status,
  isInvestorReady: true,
  lastUpdatedAt: "2026-08-20T12:00:00Z",
});

const mockColumns: InvestorPipelineColumns = {
  newMatches: [mockCard("co-1", "Alpha Pay", "new")],
  inReview: [mockCard("co-2", "Beta AI", "reviewing")],
  ndaSigned: [mockCard("co-3", "Gamma Health", "nda")],
  dataRoom: [mockCard("co-4", "Delta Cloud", "dataroom")],
  negotiation: [mockCard("co-5", "Epsilon Robotics", "negotiation")],
  won: [mockCard("co-6", "Zeta CleanEnergy", "completed")],
  lost: [mockCard("co-7", "Eta Logistics", "rejected")],
};

describe("Investor Phase 9 — Pipeline Lifecycle & Terminal States", () => {
  it("renders active pipeline columns by default", () => {
    render(<KanbanBoard columns={mockColumns} />);

    expect(screen.getByText("New Matches")).toBeInTheDocument();
    expect(screen.getByText("In Review")).toBeInTheDocument();
    expect(screen.getByText("NDA Signed")).toBeInTheDocument();
    expect(screen.getByText("Data Room")).toBeInTheDocument();
    expect(screen.getByText("Negotiation")).toBeInTheDocument();

    expect(screen.getByText("Alpha Pay")).toBeInTheDocument();
    expect(screen.getByText("Epsilon Robotics")).toBeInTheDocument();
  });

  it("switches to Won & Lost tab and renders terminal deal cards", () => {
    render(<KanbanBoard columns={mockColumns} />);

    const terminalTab = screen.getByRole("button", { name: /Won & Lost/i });
    fireEvent.click(terminalTab);

    expect(screen.getByText("Won / Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Lost / Passed")).toBeInTheDocument();

    expect(screen.getByText("Zeta CleanEnergy")).toBeInTheDocument();
    expect(screen.getByText("Eta Logistics")).toBeInTheDocument();
  });

  it("switches to All Stages view and displays all 7 lifecycle columns", () => {
    render(<KanbanBoard columns={mockColumns} />);

    const allTab = screen.getByRole("button", { name: /All Stages/i });
    fireEvent.click(allTab);

    expect(screen.getByText("New Matches")).toBeInTheDocument();
    expect(screen.getByText("In Review")).toBeInTheDocument();
    expect(screen.getByText("NDA Signed")).toBeInTheDocument();
    expect(screen.getByText("Data Room")).toBeInTheDocument();
    expect(screen.getByText("Negotiation")).toBeInTheDocument();
    expect(screen.getByText("Won / Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Lost / Passed")).toBeInTheDocument();
  });

  it("verifies Investor menu includes Pipeline, Deals, Thesis, and Discovery", () => {
    const investorMenu = menu[UserRole.INVESTOR];
    expect(investorMenu).toBeDefined();

    const titles = investorMenu.map((g) => g.title);
    expect(titles).toContain("Main");
    expect(titles).toContain("Investment & Deals");
    expect(titles).toContain("Services & Network");
    expect(titles).toContain("Profile & Communication");

    const investmentGroup = investorMenu.find((g) => g.title === "Investment & Deals");
    const hrefs = investmentGroup?.items.map((i) => i.href);
    expect(hrefs).toContain("/dashboard/investor/pipeline");
    expect(hrefs).toContain("/dashboard/investor/deals");
    expect(hrefs).toContain("/dashboard/investor/thesis");
  });
});
