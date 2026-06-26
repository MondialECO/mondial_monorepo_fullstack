'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import {
  approveProvider,
  getPendingProviders,
  rejectProvider,
} from '@/lib/api-admin-service-provider';
import type { PendingProvider } from '@/types/admin-service-provider';

export const pendingProvidersKey = ['admin', 'serviceProviders', 'pending'] as const;

export function usePendingProviders() {
  return useQuery<PendingProvider[]>({
    queryKey: pendingProvidersKey,
    queryFn: getPendingProviders,
  });
}

// Approve/reject both move the provider out of UnderReview, so the row leaves
// the queue. We drop it optimistically (see mutationCallbacks) and reconcile
// with the server on settle.

export function useApproveProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => approveProvider(userId),
    ...mutationCallbacks(qc, (userId) => userId),
  });
}

export function useRejectProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      rejectProvider(userId, reason),
    ...mutationCallbacks(qc, (vars) => vars.userId),
  });
}

// Shared optimistic-removal wiring, keyed off whichever variable carries the id.
function mutationCallbacks<TVars>(
  qc: QueryClient,
  idOf: (vars: TVars) => string
) {
  return {
    onMutate: async (vars: TVars) => {
      const userId = idOf(vars);
      await qc.cancelQueries({ queryKey: pendingProvidersKey });
      const prev = qc.getQueryData<PendingProvider[]>(pendingProvidersKey);
      qc.setQueryData<PendingProvider[]>(pendingProvidersKey, (list) =>
        list?.filter((p) => p.userId !== userId)
      );
      return { prev };
    },
    onError: (
      _err: unknown,
      _vars: TVars,
      ctx: { prev?: PendingProvider[] } | undefined
    ) => {
      if (ctx?.prev) qc.setQueryData(pendingProvidersKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: pendingProvidersKey }),
  };
}
