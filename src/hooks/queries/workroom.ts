'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-workroom';
import { useAuth } from '@/app/_providers/AuthProvider';
import type { CreateClientInputPayload, CreateTaskPayload, CreateTimeEntryPayload, SubmitDeliverablePayload } from '@/types/workroom';

const WORKROOM = ['workroom'] as const; const EARNINGS = ['earnings'] as const;
/**
 * Seller-role engagements only. The endpoint returns every engagement the actor
 * participates in, so a provider who has also bought a service would otherwise see
 * their own purchase listed as work to deliver — with their own name in the client
 * column. Mirrors the buyer-side filter in workroom-client.ts (M3a).
 */
export const useEngagements = () => {
  const { user } = useAuth();
  return useQuery({
    // user.id is in the key so a session change re-scopes the cache instead of
    // briefly showing the previous user's filtered rows.
    queryKey: [...WORKROOM, 'list', user?.id ?? 'anon'],
    queryFn: api.getEngagements,
    select: (rows) => rows.filter((e) => e.providerId === user?.id),
    enabled: !!user?.id,
  });
};
/** Polls for the same reason as the buyer twin — admin dispute resolution, client
 *  approval/revision, and the auto-release sweep all land without a local mutation to
 *  invalidate on. See the comment on useClientEngagement. */
export const useEngagement = (id: string | null) => useQuery({ queryKey: [...WORKROOM, id], queryFn: () => api.getEngagement(id!), enabled: !!id, refetchInterval: 30_000 });
export const useEarnings = (currency = 'EUR') => useQuery({ queryKey: [...EARNINGS, currency], queryFn: () => api.getEarnings(currency) });
export const useFinancialStatement = (from: string, to: string, currency: string, enabled: boolean) => useQuery({ queryKey: [...EARNINGS, 'statement', currency, from, to], queryFn: () => api.getStatement(from, to, currency), enabled });
function useWrite<TArg, TResult>(fn: (arg: TArg) => Promise<TResult>, keys: readonly string[] = WORKROOM) { const qc = useQueryClient(); return useMutation({ mutationFn: fn, onSuccess: () => keys.forEach((key) => qc.invalidateQueries({ queryKey: [key] })) }); }
export const useConfirmContract = () => useWrite(api.confirmContract);
export const useActivateMilestone = () => useWrite(api.activateMilestone);
export const useSubmitDeliverable = () => useWrite(({ id, payload }: { id: string; payload: SubmitDeliverablePayload }) => api.submitDeliverable(id, payload));
export const useStartRevision = () => useWrite(api.startRevision);
export const useUploadWorkroomFile = () => useWrite(({ engagementId, milestoneId, file }: { engagementId: string; milestoneId: string; file: File }) => api.uploadFile(engagementId, milestoneId, file));
export const useCompleteEngagement = () => useWrite(api.completeEngagement);
export const usePauseEngagement = () => useWrite(({ id, reason }: { id: string; reason: string }) => api.pauseEngagement(id, reason));
export const useResumeEngagement = () => useWrite(api.resumeEngagement);
export const useRequestExtension = () => useWrite(({ id, days, reason }: { id: string; days: number; reason: string }) => api.requestExtension(id, { days, reason }));
export const useOpenDispute = () => useWrite(({ id, reason }: { id: string; reason: string }) => api.openDispute(id, reason));
export const useCreateWorkroomTask = () => useWrite(({ id, payload }: { id: string; payload: CreateTaskPayload }) => api.createTask(id, payload));
export const useRequestClientInput = () => useWrite(({ id, payload }: { id: string; payload: CreateClientInputPayload }) => api.requestClientInput(id, payload));
export const useAddTimeEntry = () => useWrite(({ id, payload }: { id: string; payload: CreateTimeEntryPayload }) => api.addTimeEntry(id, payload));
export const useRespondToReview = () => useWrite(({ id, response }: { id: string; response: string }) => api.respondToReview(id, response));
export const useAddPayoutMethod = () => useWrite(api.addPayoutMethod, EARNINGS);
export const useSetDefaultPayoutMethod = () => useWrite(api.setDefaultPayoutMethod, EARNINGS);
export const useRemovePayoutMethod = () => useWrite(api.removePayoutMethod, EARNINGS);
export const useRequestPayout = () => useWrite(api.requestPayout, EARNINGS);
export const useUpdateTaxSettings = () => useWrite(api.updateTaxSettings, EARNINGS);
