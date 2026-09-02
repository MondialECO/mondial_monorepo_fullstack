import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DealCardCompact from "@/components/investor/DealCardCompact";
import ExpandedDealCard from "@/app/dashboard/investor/pipeline/_components/ExpandedDealCard";
import type { OpportunityCard } from "@/types/investor/opportunities";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

vi.mock("@/app/_providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-inv", role: "Investor" },
    token: "mock-token",
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, className, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

const makeCard = (overrides: Partial<OpportunityCard> = {}): OpportunityCard => ({
  companyId: "6a92584724449c0d08da4a17",
  companyName: "Idealy",
  tagline: "Innovative enterprise AI platform",
  industry: "Software",
  country: "Ireland",
  fundingRoundType: "Seed",
  fundingAskAmount: 500000,
  valuation: 5000000,
  matchScore: 95,
  matchStatus: "completed",
  isInvestorReady: true,
  lastUpdatedAt: "2026-09-02T12:00:00Z",
  ...overrides,
});

describe("Investor Pipeline Card Architecture & Lifecycle Routing", () => {
  it("routes Won / Portfolio card to /dashboard/investor/portfolio with secondary to discovery", () => {
    const card = makeCard({
      holdingId: "hold-123",
      investmentAmount: 20000,
      equityPercentage: 5,
      instrumentType: "equity",
      stage: "won",
    });

    render(<DealCardCompact card={card} columnStatus="won" />);

    // Portfolio badge
    expect(screen.getByText("Portfolio")).toBeInTheDocument();

    // Primary CTA routes to portfolio holding
    const primaryLink = screen.getByRole("link", { name: /View Investment/i });
    expect(primaryLink).toBeInTheDocument();
    expect(primaryLink).toHaveAttribute("href", "/dashboard/investor/portfolio?holding=hold-123");

    // Secondary CTA routes to company discovery
    const secondaryLink = screen.getByRole("link", { name: /View Company/i });
    expect(secondaryLink).toBeInTheDocument();
    expect(secondaryLink).toHaveAttribute("href", "/dashboard/investor/discovery/6a92584724449c0d08da4a17");

    // Displays invested amount and confirmed equity
    expect(screen.getByText("Invested")).toBeInTheDocument();
    expect(screen.getByText("€20K")).toBeInTheDocument();
    expect(screen.getByText("(5%)")).toBeInTheDocument();
  });

  it("routes Negotiation card to /dashboard/investor/deals?d={dealId} with secondary to discovery", () => {
    const card = makeCard({
      dealId: "deal-456",
      dealStatus: "negotiation",
      investmentAmount: 50000,
      equityPercentage: 10,
      stage: "negotiation",
    });

    render(<DealCardCompact card={card} columnStatus="negotiation" />);

    const primaryLink = screen.getByRole("link", { name: /Open Deal/i });
    expect(primaryLink).toBeInTheDocument();
    expect(primaryLink).toHaveAttribute("href", "/dashboard/investor/deals?d=deal-456");

    const secondaryLink = screen.getByRole("link", { name: /View Company/i });
    expect(secondaryLink).toBeInTheDocument();
    expect(secondaryLink).toHaveAttribute("href", "/dashboard/investor/discovery/6a92584724449c0d08da4a17");

    expect(screen.getByText("Offer / Ask")).toBeInTheDocument();
    expect(screen.getByText("€50K")).toBeInTheDocument();
  });

  it("routes Data Room card to /dashboard/investor/discovery/{companyId}/dataroom", () => {
    const card = makeCard({
      stage: "dataroom",
    });

    render(<DealCardCompact card={card} columnStatus="dataroom" />);

    const primaryLink = screen.getByRole("link", { name: /Open Data Room/i });
    expect(primaryLink).toBeInTheDocument();
    expect(primaryLink).toHaveAttribute("href", "/dashboard/investor/discovery/6a92584724449c0d08da4a17/dataroom");

    const secondaryLink = screen.getByRole("link", { name: /View Company/i });
    expect(secondaryLink).toBeInTheDocument();
    expect(secondaryLink).toHaveAttribute("href", "/dashboard/investor/discovery/6a92584724449c0d08da4a17");
  });

  it("routes New Matches card to /dashboard/investor/discovery/{companyId}", () => {
    const card = makeCard({
      stage: "new",
    });

    render(<DealCardCompact card={card} columnStatus="new" />);

    const primaryLink = screen.getByRole("link", { name: /View Opportunity/i });
    expect(primaryLink).toBeInTheDocument();
    expect(primaryLink).toHaveAttribute("href", "/dashboard/investor/discovery/6a92584724449c0d08da4a17");

    expect(screen.queryByRole("link", { name: /View Company/i })).not.toBeInTheDocument();
  });

  it("routes Lost card to /dashboard/investor/discovery/{companyId} with View History", () => {
    const card = makeCard({
      stage: "lost",
    });

    render(<DealCardCompact card={card} columnStatus="lost" />);

    const primaryLink = screen.getByRole("link", { name: /View History/i });
    expect(primaryLink).toBeInTheDocument();
    expect(primaryLink).toHaveAttribute("href", "/dashboard/investor/discovery/6a92584724449c0d08da4a17");
  });

  it("routes ExpandedDealCard Open Deal to /dashboard/investor/deals?d={dealId}", () => {
    const card = makeCard({
      dealId: "deal-789",
      stage: "negotiation",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ExpandedDealCard card={card} />
      </QueryClientProvider>
    );

    const openDealLink = screen.getByRole("link", { name: /Open deal/i });
    expect(openDealLink).toBeInTheDocument();
    expect(openDealLink).toHaveAttribute("href", "/dashboard/investor/deals?d=deal-789");
  });
});
