export type BriefStatus = "Draft" | "Published" | "Open" | "Closed" | "Expired" | "Cancelled";
export type ProposalStatus = "Draft" | "Submitted" | "Viewed" | "ChangesRequested" | "Revised" | "ClientReviewing" | "Accepted" | "Declined" | "Withdrawn" | "Expired" | "ConvertedToProject";

export interface ClientBrief {
  id: string; clientId: string; title: string; description: string; serviceCategory: string;
  requiredSkills: string[]; industries: string[]; budgetMinimum: number; budgetMaximum: number;
  currency: string; pricingType: string; expectedDuration: string; location: string; remoteAllowed: boolean;
  visibility: string; source: string; publishedAt?: string | null; expiresAt?: string | null;
  status: BriefStatus; viewed: boolean; viewedAt?: string | null; saved: boolean; dismissed: boolean;
  proposalSubmitted: boolean; matchScore: number;
}

export interface CommissionPreview { price: number; rate: number; commission: number; net: number; currency: string }
export interface ProposalMilestone { title: string; description: string; amount: number; deliveryTimeValue: number; deliveryTimeUnit: string; displayOrder: number }
export interface ProposalVersion {
  version: number; title: string; coverMessage: string; proposedPrice: number; currency: string;
  pricingType: string; weeklyHourLimit?: number | null; deliveryTimeValue: number;
  deliveryTimeUnit: string; deliveryDayType: string; deliveryStartRule: string;
  includedRevisionCount: number; unlimitedRevisions: boolean; revisionRequestWindowDays: number;
  deliverables: string[]; milestonePlan: ProposalMilestone[]; attachments: string[];
  expiresAt?: string | null; supersededAt: string;
}
export interface Proposal {
  id: string; clientBriefId?: string | null; serviceId?: string | null; packageId?: string | null;
  providerId: string; clientId: string; proposalSource: string; acceptanceMode: string; title: string;
  coverMessage: string; proposedPrice: number; currency: string; pricingType: string; weeklyHourLimit?: number | null; deliveryTimeValue: number;
  deliveryTimeUnit: string; deliveryDayType: string; deliveryStartRule: string; includedRevisionCount: number;
  unlimitedRevisions: boolean; revisionRequestWindowDays: number; deliverables: string[];
  milestonePlan: ProposalMilestone[]; attachments: string[]; requirementsStatus: string;
  submittedAt?: string | null; expiresAt?: string | null; acceptedAt?: string | null;
  acceptanceTrigger?: string | null; escrowStatus: string; conversionStatus: string; status: ProposalStatus;
  version: number; previousVersionCount: number; previousVersions: ProposalVersion[]; hasPurchaseSnapshot: boolean;
  earningsPreview: CommissionPreview; warnings: string[]; updatedAt: string;
}

export interface LeadQuery {
  category?: string; skill?: string; budgetMinimum?: number; budgetMaximum?: number;
  duration?: string; location?: string; remoteAllowed?: boolean; source?: string;
  postedAfter?: string; deadlineBefore?: string; savedOnly?: boolean; sort?: string;
}

export interface UpsertProposalRequest {
  clientBriefId?: string | null; clientId?: string | null; serviceId?: string | null; packageId?: string | null;
  proposalSource: string; title: string; coverMessage: string; proposedPrice: number; currency: string;
  pricingType: string; weeklyHourLimit?: number | null; deliveryTimeValue: number; deliveryTimeUnit: string; deliveryDayType: string;
  deliveryStartRule: string; includedRevisionCount: number; unlimitedRevisions: boolean;
  confirmUnlimitedRevisions: boolean; revisionRequestWindowDays: number; deliverables: string[];
  milestonePlan: ProposalMilestone[]; attachments: string[]; expiresAt?: string | null;
}
