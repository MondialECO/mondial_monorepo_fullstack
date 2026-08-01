"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInvestorProfile,
  updateInvestorProfile,
} from "@/lib/api-investor-profile";
import type {
  InvestorProfile,
  UpdateInvestorProfileInput,
} from "@/types/investor/profile";

export const investorProfileKey = ["investor", "profile"] as const;

/** Typed read of the caller's own investor profile (Phase 3/4). */
export function useInvestorProfile() {
  return useQuery<InvestorProfile>({
    queryKey: investorProfileKey,
    queryFn: getInvestorProfile,
    staleTime: 30_000,
  });
}

/** Self-service profile write; seeds the cache with the server's response. */
export function useUpdateInvestorProfile() {
  const qc = useQueryClient();
  return useMutation<InvestorProfile, Error, UpdateInvestorProfileInput>({
    mutationFn: (input) => updateInvestorProfile(input),
    onSuccess: (data) => {
      qc.setQueryData(investorProfileKey, data);
    },
  });
}
