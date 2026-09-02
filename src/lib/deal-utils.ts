import { UserRole } from "@/lib/roles";
import type {
  DealActivityEntry,
  DealRole,
  DealStatus,
  TermSheetRevisionView,
} from "@/types/deals";

// Map the authenticated user or platform role to their deal role (founder or investor).
export function dealRoleForUser(userOrRole?: unknown): DealRole | null {
  if (!userOrRole) return null;

  if (typeof userOrRole === "object" && userOrRole !== null) {
    const u = userOrRole as { role?: unknown; roles?: unknown };
    const list = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : u.role ? [u.role] : [];
    for (const r of list) {
      const normalized = String(r ?? "").trim().toLowerCase().replace(/[\s_-]/g, "");
      if (normalized === "founder" || normalized === "entrepreneur") return "founder";
      if (normalized === "investor") return "investor";
    }
    return null;
  }

  const raw = String(userOrRole).trim().toLowerCase().replace(/[\s_-]/g, "");
  if (raw === "founder" || raw === "entrepreneur") return "founder";
  if (raw === "investor") return "investor";
  return null;
}


export function counterpartyRole(role: DealRole): DealRole {
  return role === "founder" ? "investor" : "founder";
}

export function counterpartyLabel(role: DealRole): string {
  return role === "founder" ? "Investor" : "Founder";
}

// True when it is this user's turn to act on the open offer.
export function isMyTurn(deal: DealStatus, myRole: DealRole | null): boolean {
  return !!myRole && deal.currentTurn === myRole;
}

export function latestRevision(deal: DealStatus): TermSheetRevisionView | undefined {
  if (!deal.revisions?.length) return undefined;
  return [...deal.revisions].sort((a, b) => a.revisionNumber - b.revisionNumber).at(-1);
}

// A response is actionable (counter/accept/reject) only while the open offer is
// awaiting a reply.
export function isOfferOpen(deal: DealStatus): boolean {
  const latest = latestRevision(deal);
  return latest?.status === "sent" || latest?.status === "viewed";
}

export const OFFER_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  countered: "Countered",
  accepted: "Terms accepted",
  agreed: "Terms agreed",
  negotiating: "Negotiating",
  rejected: "Rejected",
  signed: "Signed",
  completed: "Completed",
};

// Maps an offer/term-sheet status to a canonical Badge variant.
export function offerStatusBadge(
  status: string
): "default" | "secondary" | "success" | "warning" | "info" | "destructive" {
  switch (status) {
    case "accepted":
    case "agreed":
      return "success";
    case "rejected":
      return "destructive";
    case "countered":
      return "warning";
    case "viewed":
      return "info";
    case "sent":
      return "default";
    default:
      return "secondary";
  }
}

export function formatInstrument(type?: string): string {
  if (!type) return "—";
  const lower = type.toLowerCase();
  if (lower === "preferred") return "Preferred Equity";
  if (lower === "common") return "Common Equity";
  if (lower === "safe") return "SAFE";
  if (lower === "note" || lower === "convertible_note") return "Convertible Note";
  return type.charAt(0).toUpperCase() + type.slice(1);
}


export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `€${Math.round(n / 1_000)}K`;
  return `€${n.toLocaleString()}`;
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const min = Math.round((Date.now() - then) / 60_000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function shortId(id: string | undefined): string {
  if (!id) return "";
  return id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
}

export interface SignatureState {
  founderSigned: boolean;
  investorSigned: boolean;
  bothSigned: boolean;
}

// Per-slot signature state. Reads both direct DTO signatures (founderSignature / investorSignature)
// and term_sheet_signed activity notes.
export function deriveSignatures(
  deal: DealStatus,
  activity: DealActivityEntry[]
): SignatureState {
  const isSignedStatus = deal.termSheet.status === "signed" || deal.status === "signed" || deal.status === "completed";
  const directFounderSigned = Boolean(deal.founderSignature?.signedAt);
  const directInvestorSigned = Boolean(deal.investorSignature?.signedAt);

  let founderSigned = isSignedStatus || directFounderSigned;
  let investorSigned = isSignedStatus || directInvestorSigned;
  let bothSigned = (founderSigned && investorSigned) || isSignedStatus;

  for (const e of activity ?? []) {
    if (e.eventType !== "term_sheet_signed") continue;
    const note = (e.notes ?? "").toLowerCase();
    if (note.includes("both")) {
      founderSigned = true;
      investorSigned = true;
      bothSigned = true;
    } else if (note.includes("by founder")) {
      founderSigned = true;
    } else if (note.includes("by investor")) {
      investorSigned = true;
    }
  }

  if (founderSigned && investorSigned) {
    bothSigned = true;
  }

  return { founderSigned, investorSigned, bothSigned };
}


// The deal is at the signature stage once terms are agreed (offer accepted).
export function isReadyForSignatures(deal: DealStatus): boolean {
  return deal.termSheet.status === "agreed" || deal.termSheet.status === "signed";
}

export function isClosed(deal: DealStatus): boolean {
  return deal.status === "completed";
}

// Founder-only close. Mirror every backend precondition so a stale term-sheet
// axis can never expose an action the top-level lifecycle will reject.
export function canCloseDeal(deal: DealStatus, myRole: DealRole | null): boolean {
  const bothPersistedSignatures = Boolean(
    deal.founderSignature?.signedAt && deal.investorSignature?.signedAt
  );
  const terminal = ["completed", "rejected", "withdrawn"].includes(deal.status);

  return (
    myRole === "founder" &&
    bothPersistedSignatures &&
    deal.termSheet.status === "signed" &&
    deal.status === "signed" &&
    !terminal
  );
}

// Completion timestamp from the deal_closed activity entry (the deal payload
// doesn't carry ClosedAt).
export function completionTimestamp(activity: DealActivityEntry[]): string | null {
  const closed = (activity ?? []).find((e) => e.eventType === "deal_closed");
  return closed?.occurredAt ?? null;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Human-readable label for an activity-log event type.
export const ACTIVITY_LABEL: Record<string, string> = {
  deal_created: "Deal created",
  deal_status_changed: "Status changed",
  term_sheet_updated: "Term sheet updated",
  term_sheet_signed: "Term sheet signed",
  due_diligence_updated: "Due diligence updated",
  checklist_updated: "Checklist updated",
  deal_document_uploaded: "Document uploaded",
  deal_closed: "Deal closed",
  offer_sent: "Offer sent",
  offer_viewed: "Offer viewed",
  offer_countered: "Counter-offer made",
  offer_accepted: "Offer accepted",
  offer_rejected: "Offer rejected",
};
