'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-workroom';
import type { SubmitDeliverablePayload } from '@/types/workroom';

const WORKROOM = ['workroom'] as const; const EARNINGS = ['earnings'] as const;
export const useEngagements = () => useQuery({ queryKey: [...WORKROOM, 'list'], queryFn: api.getEngagements });
export const useEngagement = (id: string | null) => useQuery({ queryKey: [...WORKROOM, id], queryFn: () => api.getEngagement(id!), enabled: !!id });
export const useEarnings = (currency = 'EUR') => useQuery({ queryKey: [...EARNINGS, currency], queryFn: () => api.getEarnings(currency) });
function write<TArg, TResult>(fn: (arg: TArg) => Promise<TResult>, keys: readonly string[] = WORKROOM) { const qc = useQueryClient(); return useMutation({ mutationFn: fn, onSuccess: () => keys.forEach((key) => qc.invalidateQueries({ queryKey: [key] })) }); }
export const useConfirmContract = () => write(api.confirmContract);
export const useActivateMilestone = () => write(api.activateMilestone);
export const useSubmitDeliverable = () => write(({ id, payload }: { id: string; payload: SubmitDeliverablePayload }) => api.submitDeliverable(id, payload));
export const useStartRevision = () => write(api.startRevision);
export const useUploadWorkroomFile = () => write(({ engagementId, milestoneId, file }: { engagementId: string; milestoneId: string; file: File }) => api.uploadFile(engagementId, milestoneId, file));
export const useCompleteEngagement = () => write(api.completeEngagement);
export const useAddPayoutMethod = () => write(api.addPayoutMethod, EARNINGS);
export const useRequestPayout = () => write(api.requestPayout, EARNINGS);
export const useUpdateTaxSettings = () => write(api.updateTaxSettings, EARNINGS);
