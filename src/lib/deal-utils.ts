import { UserRole } from "@/lib/roles";
import type {
  DealActivityEntry,
  DealRole,
  DealStatus,
  TermSheetRevisionView,
} from "@/types/deals";

// Map the authenticated user's platform role to their deal role.
export function dealRoleForUser(role: UserRole | undefined): DealRole | null {
  if (role === UserRole.INVESTOR) return "investor";
  if (role === UserRole.ENTREPRENEUR) return "founder";
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
  accepted: "Accepted",
  rejected: "Rejected",
};

// Maps an offer/term-sheet status to a canonical Badge variant.
export function offerStatusBadge(
  status: string
): "default" | "secondary" | "success" | "warning" | "info" | "destructive" {
  switch (status) {
    case "accepted":
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

// Per-slot signature state. The deal payload doesn't expose individual slots,
// so derive them: termSheet.status === "signed" means BOTH signed; otherwise
// read the term_sheet_signed activity notes ("signed by founder|investor|both").
export function deriveSignatures(
  deal: DealStatus,
  activity: DealActivityEntry[]
): SignatureState {
  const bothSigned = deal.termSheet.status === "signed";
  let founderSigned = bothSigned;
  let investorSigned = bothSigned;

  for (const e of activity ?? []) {
    if (e.eventType !== "term_sheet_signed") continue;
    const note = (e.notes ?? "").toLowerCase();
    if (note.includes("both")) {
      founderSigned = true;
      investorSigned = true;
    } else if (note.includes("by founder")) {
      founderSigned = true;
    } else if (note.includes("by investor")) {
      investorSigned = true;
    }
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

// Founder-only close, allowed once both parties have signed and not yet closed.
export function canCloseDeal(deal: DealStatus, myRole: DealRole | null): boolean {
  return (
    myRole === "founder" &&
    deal.termSheet.status === "signed" &&
    deal.status !== "completed"
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
