'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-leads';
import type { LeadQuery, UpsertProposalRequest } from '@/types/leads';

const ROOT = ['leads'] as const;
export const useLeadInbox = (query: LeadQuery) => useQuery({ queryKey: ['leads', 'inbox', query], queryFn: () => api.getInbox(query) });
export const useLeadBrief = (id: string | null) => useQuery({ queryKey: ['leads', 'brief', id], queryFn: () => api.getBrief(id as string), enabled: !!id });
export const useProposals = () => useQuery({ queryKey: ['leads', 'proposals'], queryFn: api.getProposals });
export const useProposal = (id: string | null) => useQuery({ queryKey: ['leads', 'proposal', id], queryFn: () => api.getProposal(id as string), enabled: !!id });

function useWrite<TArg, TData>(fn: (arg: TArg) => Promise<TData>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }) });
}
export const useUpdateLeadInteraction = () => useWrite(({ id, ...payload }: { id: string; saved?: boolean; dismissed?: boolean }) => api.updateInteraction(id, payload));
export const useCreateProposal = () => useWrite((payload: UpsertProposalRequest) => api.createProposal(payload));
export const useUpdateProposal = () => useWrite(({ id, payload }: { id: string; payload: UpsertProposalRequest }) => api.updateProposal(id, payload));
export const useSubmitProposal = () => useWrite(api.submitProposal);
export const useWithdrawProposal = () => useWrite(api.withdrawProposal);
export const useDuplicateProposal = () => useWrite(api.duplicateProposal);
export const useReviseProposal = () => useWrite(({ id, payload }: { id: string; payload: UpsertProposalRequest }) => api.reviseProposal(id, payload));
export const useReviewOrderRequest = () => useWrite(({ id, accept }: { id: string; accept: boolean }) => api.reviewOrderRequest(id, accept));
