// Wire contracts for the deal/offer negotiation domain. Mirror the backend
// DTOs (DealStatusResponse / TermSheetRevisionResponse / DealActivityLogResponse
// in CompanyDtos.cs + OfferDtos.cs) as serialized by ASP.NET (camelCase).

export type DealRole = "founder" | "investor";

export type DealTurn = DealRole | "";

export type OfferStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "countered"
  | "accepted"
  | "rejected";

export type TermSheetStatus =
  | "draft"
  | "proposed"
  | "negotiating"
  | "agreed"
  | "signed"
  | "rejected";

export interface TermSheetView {
  totalRaiseAmount: number;
  postMoneyValuation: number;
  equityType: string;
  investorEquityPercent: number;
  proRataRights: boolean;
  status: TermSheetStatus | string;
  signedAt: string | null;
}

export interface DealParticipantStatus {
  investorId: string;
  investorName: string | null;
  committedAmount: number;
  status: string;
}

export interface ChecklistItem {
  item: string;
  completed: boolean;
  owner: string | null;
  dueDate: string | null;
}

export interface TermSheetRevisionView {
  revisionNumber: number;
  proposedByRole: DealRole | string;
  status: OfferStatus | string;
  note: string | null;
  createdAt: string;
  viewedAt: string | null;
  respondedAt: string | null;
  terms: TermSheetView;
}

// Persisted, per-party signature record. Mirrors backend SignatureRecordDto
// (CompanyDtos.cs: SignedAt / SignedBy), serialized camelCase. Null when that
// party has not signed.
export interface SignatureRecord {
  signedAt: string | null;
  signedBy: string | null;
}

export interface DealStatus {
  dealId: string;
  companyId?: string;
  status: string;
  /** Counterparty company name (snapshot). "" for legacy deals. */
  companyName: string;
  progressPercent: number;
  termSheet: TermSheetView;
  closingChecklist: ChecklistItem[];
  investors: DealParticipantStatus[];
  currentTurn: DealTurn;
  revisions: TermSheetRevisionView[];
  // Authoritative signature state from the backend (DealStatusResponse).
  founderSignature: SignatureRecord | null;
  investorSignature: SignatureRecord | null;
}

export interface DealActivityEntry {
  id: string;
  dealId: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorUserId: string | null;
  occurredAt: string;
  notes: string | null;
}

// Request bodies.
export interface OfferTermsInput {
  totalRaiseAmount: number;
  preMoneyValuation: number;
  postMoneyValuation: number;
  equityType: string;
  investorEquityPercent: number;
  proRataRights: boolean;
  liquidationPreference: string;
  boardSeats: number;
  antiDilutionProtection: string;
  note?: string;
}
