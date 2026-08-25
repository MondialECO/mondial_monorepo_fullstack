import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Phase4Resource } from "@/components/creator/phase4/Phase4Resource";
import { Phase4Gtm } from "@/components/creator/phase4/Phase4Gtm";
import type { GtmSetup, MarketBenchmark, ResourceCalculation } from "@/lib/api-creator-journey";

vi.mock("@/lib/api-creator-journey", () => ({
  creatorJourneyApi: {},
}));

const benchmark: MarketBenchmark = {
  requestedSector: "SaaS",
  resolvedBenchmarkSector: "general",
  matchType: "general",
  displayLabel: "General estimate — no sector-specific data yet",
  region: "General",
  currency: "EUR",
  resourceDefaults: {
    developerCostPerMonth: 4000,
    developerDurationMonths: 3,
    hostingCostPerMonth: 80,
    legalCost: 2000,
    miscPercentage: 10,
    launchDurationWeeksMin: 8,
    launchDurationWeeksMax: 12,
    launchVarianceMinPercentage: -20,
    launchVarianceMaxPercentage: 20,
  },
  gtmDefaults: {
    channelSplit: [
      { channel: "Content / SEO", percent: 40 },
      { channel: "Paid ads", percent: 30 },
      { channel: "Community", percent: 30 },
    ],
    benchmarkGtmWeeks: [
      { week: 1, title: "Foundations", tasks: ["Register domain"], completed: false },
    ],
  },
  source: { label: "Mondial maintained general benchmark", url: null, provenance: "Initial baseline" },
  effectiveDate: "2026-08-05T00:00:00Z",
  version: 1,
  lastUpdatedAt: "2026-08-05T00:00:00Z",
};

const callbacks = { ideaId: "idea-123", onNext: vi.fn(), onBack: vi.fn() };

describe("Phase 4 benchmark defaults", () => {
  it("applies Resource precedence independently by field group", () => {
    const initial = {
      teamRequirements: [{ role: "Saved Engineer", cost: 6500, durationMonths: 2, oneTime: false }],
      saasStack: [],
      totalLaunchBudgetMin: 0,
      totalLaunchBudgetMax: 0,
      monthlyRunningCost: 0,
      timeToLaunchWeeksMin: 6,
      timeToLaunchWeeksMax: 9,
      budgetBreakdown: { teamPct: 70, toolsPct: 10, legalPct: 15, miscPct: 5 },
    } satisfies ResourceCalculation & {
      teamRequirements: Array<{ role: string; cost: number; durationMonths: number; oneTime: boolean }>;
      saasStack: Array<{ name: string; monthlyCost: number }>;
    };

    render(<Phase4Resource initial={initial} benchmark={benchmark} {...callbacks} />);

    expect(screen.getByDisplayValue("Saved Engineer")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hosting & infra")).toBeInTheDocument();
    expect(screen.getAllByText("Saved value").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("General estimate — no sector-specific data yet")).toBeInTheDocument();
    expect(screen.getByText("6–9 weeks")).toBeInTheDocument();
  });

  it("applies saved GTM split and benchmark weeks independently", () => {
    const initial: GtmSetup = {
      webPresence: [],
      targetAudiences: [],
      channelMix: [{ channel: "Partnerships", percent: 100 }],
      benchmarkGtmWeeks: [],
    };

    render(<Phase4Gtm initial={initial} benchmark={benchmark} {...callbacks} />);

    expect(screen.getByDisplayValue("Partnerships")).toBeInTheDocument();
    expect(screen.getByText("Saved value")).toBeInTheDocument();
    expect(screen.getByText("General estimate — no sector-specific data yet")).toBeInTheDocument();
    expect(screen.getByText("Foundations")).toBeInTheDocument();
  });

  it("keeps manual forms usable without hidden numeric fallbacks", () => {
    const { rerender } = render(<Phase4Resource initial={null} benchmark={null} {...callbacks} />);

    expect(screen.getByRole("button", { name: "Add role" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add tool" })).toBeInTheDocument();
    expect(screen.queryByDisplayValue("4000")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("80")).not.toBeInTheDocument();

    rerender(<Phase4Gtm initial={null} benchmark={null} {...callbacks} />);
    expect(screen.getByRole("button", { name: "Add channel" })).toBeInTheDocument();
    expect(screen.getByText("Reference unavailable")).toBeInTheDocument();
  });
});
