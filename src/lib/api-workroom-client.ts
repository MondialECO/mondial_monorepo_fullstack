/**
 * Client-side workroom actions. Deliberately parallel to `api-workroom.ts`
 * (the SP/earnings surface) so the two can evolve independently.
 *
 * NOTE: confirmContract, pauseEngagement, resumeEngagement, openDispute,
 * completeEngagement and uploadFile also exist in `api-workroom.ts`. Those
 * endpoints accept either party, so both surfaces legitimately call them —
 * the duplication here is intentional isolation, not an oversight. If one is
 * ever changed, check whether its twin needs the same change.
 */
import api from '@/lib/axios';
import type { ApiEnvelope } from '@/types/service-provider';
import type { Engagement, Milestone, Review, WorkroomDetail } from '@/types/workroom';

const BASE = '/workroom';
const unwrap = <T>(env: ApiEnvelope<T>) => env.data;

// Either party — both must sign before the engagement leaves ContractPending.
export async function confirmContract(engagementId: string): Promise<unknown> {
  const res = await api.post<ApiEnvelope<unknown>>(
    `${BASE}/engagements/${engagementId}/contract/confirm`,
    { explicitlyConfirmed: true }
  );
  return unwrap(res.data);
}

// Client only.
export async function fundMilestone(milestoneId: string): Promise<Milestone> {
  const res = await api.post<ApiEnvelope<Milestone>>(`${BASE}/milestones/${milestoneId}/fund`, {});
  return unwrap(res.data);
}

// Client only — releases escrow and applies the platform commission.
export async function approveMilestone(milestoneId: string): Promise<WorkroomDetail> {
  const res = await api.post<ApiEnvelope<WorkroomDetail>>(
    `${BASE}/milestones/${milestoneId}/approve`,
    {}
  );
  return unwrap(res.data);
}

export interface RequestRevisionPayload {
  description: string;
  requestedChanges: string[];
  scopeClassification:
    | 'WithinScope'
    | 'NeedsClarification'
    | 'PotentialScopeChange'
    | 'ConfirmedScopeChange';
  dueDate?: string | null;
  /** Backend rejects the request unless this is true. */
  consolidatedFeedbackConfirmed: boolean;
}

// Client only.
export async function requestRevision(
  milestoneId: string,
  payload: RequestRevisionPayload
): Promise<WorkroomDetail> {
  const res = await api.post<ApiEnvelope<WorkroomDetail>>(
    `${BASE}/milestones/${milestoneId}/revisions`,
    payload
  );
  return unwrap(res.data);
}

export interface ExtensionDecisionPayload {
  approve: boolean;
  /** Backend Range(1,365) runs even when approve=false — never send 0. */
  days: number;
  reason: string;
}

// Client only — decides an extension the provider requested.
export async function decideExtension(
  milestoneId: string,
  payload: ExtensionDecisionPayload
): Promise<Milestone> {
  const res = await api.post<ApiEnvelope<Milestone>>(
    `${BASE}/milestones/${milestoneId}/extension-decision`,
    payload
  );
  return unwrap(res.data);
}

// Either party.
export async function pauseEngagement(engagementId: string, reason: string): Promise<Engagement> {
  const res = await api.post<ApiEnvelope<Engagement>>(
    `${BASE}/engagements/${engagementId}/pause`,
    { reason }
  );
  return unwrap(res.data);
}

// Either party.
export async function resumeEngagement(engagementId: string): Promise<Engagement> {
  const res = await api.post<ApiEnvelope<Engagement>>(
    `${BASE}/engagements/${engagementId}/resume`,
    {}
  );
  return unwrap(res.data);
}

// Either party — puts escrow OnHold pending admin resolution.
export async function openDispute(milestoneId: string, reason: string): Promise<WorkroomDetail> {
  const res = await api.post<ApiEnvelope<WorkroomDetail>>(
    `${BASE}/milestones/${milestoneId}/disputes`,
    { reason }
  );
  return unwrap(res.data);
}

// Either party — requires every milestone Paid and no open disputes/revisions.
export async function completeEngagement(engagementId: string): Promise<Engagement> {
  const res = await api.post<ApiEnvelope<Engagement>>(
    `${BASE}/engagements/${engagementId}/complete`,
    {}
  );
  return unwrap(res.data);
}

export interface SubmitReviewPayload {
  overallRating: number;
  qualityRating: number;
  communicationRating: number;
  deliveryRating: number;
  professionalismRating: number;
  valueRating: number;
  writtenReview: string;
}

// Client only — engagement must be Completed.
export async function submitReview(
  engagementId: string,
  payload: SubmitReviewPayload
): Promise<Review> {
  const res = await api.post<ApiEnvelope<Review>>(
    `${BASE}/engagements/${engagementId}/reviews`,
    payload
  );
  return unwrap(res.data);
}

// Either party. providerPrivate is deliberately never sent — that flag is SP-only.
export async function uploadFile(
  engagementId: string,
  file: File,
  milestoneId?: string
): Promise<{ id: string }> {
  const body = new FormData();
  body.append('file', file);
  if (milestoneId) body.append('milestoneId', milestoneId);
  const res = await api.post<ApiEnvelope<{ id: string }>>(
    `${BASE}/engagements/${engagementId}/files`,
    body
  );
  return unwrap(res.data);
}
