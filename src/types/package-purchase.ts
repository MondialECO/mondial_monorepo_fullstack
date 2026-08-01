import type { Proposal } from './leads';

/**
 * Mirrors backend RequirementAnswerRequest (LeadsDtos.cs).
 * `value` is a string on the wire regardless of the field's declared type —
 * Number/Date/Boolean answers must be stringified before sending.
 */
export interface RequirementAnswerRequest {
  templateFieldId: string;
  fieldType: string;
  value: string;
  attachment?: string | null;
}

/** Mirrors backend PackagePurchaseRequest (LeadsDtos.cs). */
export interface PackagePurchaseRequest {
  packageId: string;
  selectedAddOnNames: string[];
  requirements: RequirementAnswerRequest[];
  explicitlyConfirmed: boolean;
  paymentMethodVerified: boolean;
  escrowAuthorized: boolean;
  /** Inverted in the UI: the "no compliance hold" checkbox sends `false`. */
  complianceHold: boolean;
  finalSummaryShown: boolean;
}

/**
 * Mirrors backend PackagePurchaseResponse (LeadsDtos.cs).
 * `failedConditions` holds free-text English strings produced by
 * LeadsService.PurchasePackageAsync. The set is not a contract — render
 * verbatim, never switch on the contents.
 */
export interface PackagePurchaseResponse {
  proposal: Proposal;
  autoAccepted: boolean;
  uiStatus: 'Accepted' | 'Provider Approval Required' | string;
  failedConditions: string[];
}

/** Mirrors backend AcceptProposalRequest (LeadsDtos.cs). */
export interface AcceptProposalRequest {
  explicitlyConfirmed: boolean;
  escrowAuthorized: boolean;
}

/**
 * Display-only mirror of PlatformCommerceConstants.CommissionRate.
 * Never send a computed price to the backend — it recomputes server-side
 * from packageId + add-on names (canon §10.14).
 */
export const PLATFORM_COMMISSION_RATE = 0.12;

/** Matches backend rounding: MidpointRounding.AwayFromZero, 2dp. */
export function computeCommission(total: number): number {
  return Math.round((total * PLATFORM_COMMISSION_RATE + Number.EPSILON) * 100) / 100;
}
