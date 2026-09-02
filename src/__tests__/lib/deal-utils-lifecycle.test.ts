import { describe, expect, it } from "vitest";
import { canCloseDeal } from "@/lib/deal-utils";
import type { DealStatus } from "@/types/deals";

function deal(overrides: Partial<DealStatus> = {}): DealStatus {
  return {
    dealId: "6a975543c10741ad5b587b57",
    status: "signed",
    companyName: "Lifecycle Test Co",
    progressPercent: 100,
    termSheet: {
      totalRaiseAmount: 100_000,
      postMoneyValuation: 1_000_000,
      equityType: "preferred",
      investorEquityPercent: 10,
      proRataRights: false,
      status: "signed",
      signedAt: "2026-09-01T23:29:38.551Z",
    },
    closingChecklist: [],
    investors: [],
    currentTurn: "",
    revisions: [],
    founderSignature: { signedAt: "2026-09-01T23:29:38.492Z", signedBy: "founder" },
    investorSignature: { signedAt: "2026-09-01T23:29:04.450Z", signedBy: "investor" },
    ...overrides,
  };
}

describe("deal close lifecycle gating", () => {
  it("allows only the founder to close a fully signed deal in signed status", () => {
    expect(canCloseDeal(deal(), "founder")).toBe(true);
    expect(canCloseDeal(deal(), "investor")).toBe(false);
    expect(canCloseDeal(deal(), null)).toBe(false);
  });

  it("blocks the real signed-term-sheet plus stale initiated lifecycle desync", () => {
    expect(canCloseDeal(deal({ status: "initiated" }), "founder")).toBe(false);
  });

  it("requires both persisted signature slots", () => {
    expect(canCloseDeal(deal({ founderSignature: null }), "founder")).toBe(false);
    expect(canCloseDeal(deal({ investorSignature: null }), "founder")).toBe(false);
  });

  it.each(["completed", "rejected", "withdrawn"])(
    "blocks terminal status %s",
    (status) => expect(canCloseDeal(deal({ status }), "founder")).toBe(false)
  );
});
