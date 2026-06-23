// Term-sheet view model derivation. The investor-side Term Sheet screen
// has no dedicated backend endpoint (the existing GET /deals/{dealId} is
// owner-gated). Phase 4 derives all term-sheet content from the three
// already-wired investor reads:
//
//   - useOpportunity  -> OpportunityDetail
//   - useInvestorSession -> InvestorSession
//   - useDiligenceProgress -> DiligenceProgress
//
// Everything here is deterministic: same inputs always produce the same
// output. No randomness, no fabricated dates.

import type {
  DiligenceProgress,
  InvestorSession,
  OpportunityDetail,
} from "@/types/investor/opportunities";

export type DealStage =
  | "match_created"
  | "nda_signed"
  | "data_room_opened"
  | "term_sheet_drafted"
  | "negotiation"
  | "close";

export const DEAL_STAGES: DealStage[] = [
  "match_created",
  "nda_signed",
  "data_room_opened",
  "term_sheet_drafted",
  "negotiation",
  "close",
];

export const STAGE_LABEL: Record<DealStage, string> = {
  match_created: "Match Created",
  nda_signed: "NDA Signed",
  data_room_opened: "Data Room Opened",
  term_sheet_drafted: "Term Sheet Drafted",
  negotiation: "Negotiation",
  close: "Close",
};

const STAGE_DESCRIPTION: Record<DealStage, string> = {
  match_created: "Opportunity matched against your investment thesis.",
  nda_signed: "Confidentiality established. Sensitive materials unlocked.",
  data_room_opened: "Documents reviewed and downloaded.",
  term_sheet_drafted: "Initial term sheet shared for review.",
  negotiation: "Active back-and-forth on terms and conditions.",
  close: "All conditions satisfied; deal ready to sign.",
};

export function describeStage(stage: DealStage): string {
  return STAGE_DESCRIPTION[stage];
}

/**
 * Returns the most-advanced satisfied stage based on what's on the wire.
 * Earlier stages are considered "completed" by the timeline component.
 */
export function deriveDealStage(
  detail: OpportunityDetail,
  session: InvestorSession | undefined,
  diligence: DiligenceProgress | undefined
): DealStage {
  if (diligence && diligence.totalItems > 0) {
    if (diligence.percentComplete >= 100) return "close";
    if (diligence.percentComplete > 0) return "negotiation";
    return "term_sheet_drafted";
  }
  if (session && session.firstAccessAt) return "data_room_opened";
  if (detail.ndaAccepted) return "nda_signed";
  return "match_created";
}

const ROUND_LABEL: Record<string, string> = {
  pre_seed: "Pre-Seed Round",
  seed: "Seed Round",
  series_a: "Series A Round",
  series_b: "Series B Round",
  series_c: "Series C Round",
};

export function roundNameFromType(type: string | null): string {
  if (!type) return "Funding Round";
  return ROUND_LABEL[type] ?? type;
}

// REMOVED (runtime-stabilization): instrumentForRound, investorRightsForRound,
// governanceForRound, and KEY_CONDITIONS fabricated instrument/rights/governance
// and specific legal facts (e.g. "Governing law: France · Jurisdiction: Paris
// Commercial Court") purely from the round type and rendered them as if they were
// real deal terms. The read-only term-sheet preview no longer asserts them. Real
// term-sheet fields belong to the Phase-8 builder bound to DealExecution.TermSheet.

export interface ActivityEntry {
  /** Stable id derived from event + timestamp. */
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  stage: DealStage;
}

/**
 * Synthesises an activity feed from already-on-the-wire timestamps.
 * No fabricated past events — every entry corresponds to a real point in
 * time that the backend has recorded.
 */
export function buildActivityFeed(
  detail: OpportunityDetail,
  session: InvestorSession | undefined,
  diligence: DiligenceProgress | undefined
): ActivityEntry[] {
  const out: ActivityEntry[] = [];

  // Match Created — fall back to lastUpdatedAt since no createdAt is on the wire.
  out.push({
    id: `match:${detail.lastUpdatedAt}`,
    timestamp: detail.lastUpdatedAt,
    event: "Opportunity matched against your investment thesis",
    actor: "System",
    stage: "match_created",
  });

  if (detail.ndaAcceptedAt) {
    out.push({
      id: `nda:${detail.ndaAcceptedAt}`,
      timestamp: detail.ndaAcceptedAt,
      event: "NDA signed and data room access granted",
      actor: "You (Investor)",
      stage: "nda_signed",
    });
  }

  if (session?.firstAccessAt) {
    out.push({
      id: `dr-first:${session.firstAccessAt}`,
      timestamp: session.firstAccessAt,
      event: "Data room first accessed",
      actor: "You (Investor)",
      stage: "data_room_opened",
    });
  }

  if (
    session?.lastAccessAt &&
    session.lastAccessAt !== session.firstAccessAt
  ) {
    out.push({
      id: `dr-last:${session.lastAccessAt}`,
      timestamp: session.lastAccessAt,
      event: `Most recent activity (${session.viewEventsCount} views, ${session.downloadEventsCount} downloads)`,
      actor: "You (Investor)",
      stage: "data_room_opened",
    });
  }

  if (
    diligence &&
    diligence.totalItems > 0 &&
    (diligence.completed > 0 || diligence.inProgress > 0 || diligence.flagged > 0)
  ) {
    out.push({
      id: `dd:${detail.lastUpdatedAt}`,
      timestamp: detail.lastUpdatedAt,
      event: `Diligence in progress (${diligence.completed} of ${diligence.totalItems} items complete)`,
      actor: "Founder team",
      stage:
        diligence.percentComplete >= 100 ? "close" : "negotiation",
    });
  }

  // Newest first.
  return out.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
