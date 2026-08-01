'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-workroom-client';
// GET wrappers are actor-scoped and shape-identical for both parties, so they're
// reused from the SP module rather than duplicated.
import { getEngagement, getEngagements } from '@/lib/api-workroom';
import { useAuth } from '@/app/_providers/AuthProvider';

const CLIENT_WORKROOM = ['client-workroom'] as const;

export const clientWorkroomKeys = {
  all: CLIENT_WORKROOM,
  list: [...CLIENT_WORKROOM, 'list'] as const,
  detail: (id: string) => [...CLIENT_WORKROOM, id] as const,
};

/**
 * Buyer-role engagements only. The endpoint returns both roles (a provider is
 * also a participant), but "My Engagements" means "things I bought" — an SP
 * browsing it should not see their seller-side work under a buyer heading.
 * Filtering here rather than in the wrapper keeps the SP Workroom untouched.
 */
export const useClientEngagements = () => {
  const { user } = useAuth();
  return useQuery({
    // user.id is part of the key so a session change re-scopes the cache instead
    // of briefly showing the previous user's filtered rows.
    queryKey: [...clientWorkroomKeys.list, user?.id ?? 'anon'],
    queryFn: getEngagements,
    select: (rows) => rows.filter((e) => e.clientId === user?.id),
    enabled: !!user?.id,
  });
};

export const useClientEngagement = (id: string | null) =>
  useQuery({
    queryKey: clientWorkroomKeys.detail(id ?? ''),
    queryFn: () => getEngagement(id!),
    enabled: !!id,
  });

/** Every mutation refetches the whole client-workroom tree — state transitions
 *  cascade across engagement, milestones and escrow, so partial invalidation
 *  would leave stale branches on screen. */
function useClientMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_WORKROOM }),
  });
}

export const useClientConfirmContract = () =>
  useClientMutation((id: string) => api.confirmContract(id));

export const useClientFundMilestone = () =>
  useClientMutation((id: string) => api.fundMilestone(id));

export const useClientApproveMilestone = () =>
  useClientMutation((id: string) => api.approveMilestone(id));

export const useClientRequestRevision = () =>
  useClientMutation(({ id, payload }: { id: string; payload: api.RequestRevisionPayload }) =>
    api.requestRevision(id, payload)
  );

export const useClientDecideExtension = () =>
  useClientMutation(({ id, payload }: { id: string; payload: api.ExtensionDecisionPayload }) =>
    api.decideExtension(id, payload)
  );

export const useClientPauseEngagement = () =>
  useClientMutation(({ id, reason }: { id: string; reason: string }) =>
    api.pauseEngagement(id, reason)
  );

export const useClientResumeEngagement = () =>
  useClientMutation((id: string) => api.resumeEngagement(id));

export const useClientOpenDispute = () =>
  useClientMutation(({ id, reason }: { id: string; reason: string }) =>
    api.openDispute(id, reason)
  );

export const useClientCompleteEngagement = () =>
  useClientMutation((id: string) => api.completeEngagement(id));

export const useClientSubmitReview = () =>
  useClientMutation(({ id, payload }: { id: string; payload: api.SubmitReviewPayload }) =>
    api.submitReview(id, payload)
  );

export const useClientUploadFile = () =>
  useClientMutation(
    ({
      engagementId,
      file,
      milestoneId,
    }: {
      engagementId: string;
      file: File;
      milestoneId?: string;
    }) => api.uploadFile(engagementId, file, milestoneId)
  );

/** Backend errors carry a human-readable `message`; surface it verbatim. */
export function workroomErrorMessage(error: unknown): string {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;
  return message || 'Something went wrong. Please try again.';
}
