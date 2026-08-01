'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { acceptProposal, getMyProposals, getProposal, purchasePackage } from '@/lib/api-leads';
import type { AcceptProposalRequest, PackagePurchaseRequest } from '@/types/package-purchase';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15; // ~30s before the caller shows a timeout fallback

export const packagePurchaseKeys = {
  conversion: (proposalId: string) => ['proposal-conversion', proposalId] as const,
  myProposals: ['my-proposals'] as const,
};

/** Proposals where the caller is the client — includes ones awaiting their action. */
export function useMyProposals() {
  return useQuery({
    queryKey: packagePurchaseKeys.myProposals,
    queryFn: getMyProposals,
    staleTime: 30_000,
  });
}

export function usePurchasePackage() {
  return useMutation({
    mutationFn: (payload: PackagePurchaseRequest) => purchasePackage(payload),
  });
}

export function useAcceptProposal() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AcceptProposalRequest }) =>
      acceptProposal(id, payload),
  });
}

/**
 * Polls a proposal until WorkroomConversionJob has created its engagement.
 * The purchase response returns before the job runs, so there is no engagement
 * id available at submit time — conversion has to be observed, not awaited.
 */
export function useProposalConversionPoll(proposalId: string | null) {
  const attemptsRef = useRef(0);
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Reset when polling a different proposal.
  useEffect(() => {
    attemptsRef.current = 0;
    setIsTimedOut(false);
  }, [proposalId]);

  const query = useQuery({
    queryKey: packagePurchaseKeys.conversion(proposalId ?? ''),
    queryFn: () => getProposal(proposalId!),
    enabled: !!proposalId && !isTimedOut,
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return POLL_INTERVAL_MS;
      const done = data.conversionStatus === 'Converted' || data.status === 'ConvertedToProject';
      return done ? false : POLL_INTERVAL_MS;
    },
    refetchOnWindowFocus: false,
  });

  const converted =
    query.data?.conversionStatus === 'Converted' || query.data?.status === 'ConvertedToProject';

  useEffect(() => {
    if (!query.data || converted) return;
    attemptsRef.current += 1;
    if (attemptsRef.current >= MAX_POLL_ATTEMPTS) setIsTimedOut(true);
  }, [query.data, query.dataUpdatedAt, converted]);

  return { ...query, converted, isTimedOut };
}
