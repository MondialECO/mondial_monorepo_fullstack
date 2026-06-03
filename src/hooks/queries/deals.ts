"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  acceptOffer,
  closeDeal,
  counterOffer,
  createInvestorOffer,
  getDeal,
  getDealActivity,
  getDeals,
  markOfferViewed,
  rejectOffer,
  signTermSheet,
} from "@/lib/api-deals";
import type { DealStatus, OfferTermsInput } from "@/types/deals";

export const dealKeys = {
  list: ["deals", "list"] as const,
  detail: (id: string) => ["deals", "detail", id] as const,
  activity: (id: string) => ["deals", "activity", id] as const,
};

export function useDeals() {
  return useQuery<DealStatus[]>({
    queryKey: dealKeys.list,
    queryFn: getDeals,
    staleTime: 15_000,
  });
}

export function useDeal(dealId: string | null) {
  return useQuery<DealStatus>({
    queryKey: dealId ? dealKeys.detail(dealId) : ["deals", "detail", "none"],
    queryFn: () => getDeal(dealId as string),
    enabled: !!dealId,
  });
}

export function useDealActivity(dealId: string | null) {
  return useQuery({
    queryKey: dealId ? dealKeys.activity(dealId) : ["deals", "activity", "none"],
    queryFn: () => getDealActivity(dealId as string),
    enabled: !!dealId,
  });
}

// Write the freshest deal into cache + refresh the list and activity.
export function applyDealUpdate(qc: QueryClient, deal: DealStatus): void {
  qc.setQueryData(dealKeys.detail(deal.dealId), deal);
  qc.invalidateQueries({ queryKey: dealKeys.list });
  qc.invalidateQueries({ queryKey: dealKeys.activity(deal.dealId) });
}

function useDealMutation<TArgs>(fn: (args: TArgs) => Promise<DealStatus>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (deal) => applyDealUpdate(qc, deal),
  });
}

export function useCreateInvestorOffer() {
  return useDealMutation(
    ({ companyId, terms }: { companyId: string; terms: OfferTermsInput }) =>
      createInvestorOffer(companyId, terms)
  );
}

export function useCounterOffer(dealId: string) {
  return useDealMutation((terms: OfferTermsInput) => counterOffer(dealId, terms));
}

export function useRejectOffer(dealId: string) {
  return useDealMutation((note: string | undefined) => rejectOffer(dealId, note));
}

export function useAcceptOffer(dealId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => acceptOffer(dealId),
    onSuccess: (deal) => applyDealUpdate(qc, deal),
  });
}

export function useMarkOfferViewed(dealId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markOfferViewed(dealId),
    onSuccess: (deal) => applyDealUpdate(qc, deal),
  });
}

export function useSignTermSheet(dealId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => signTermSheet(dealId, file),
    onSuccess: (deal) => applyDealUpdate(qc, deal),
  });
}

export function useCloseDeal(dealId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => closeDeal(dealId),
    onSuccess: (deal) => applyDealUpdate(qc, deal),
  });
}
