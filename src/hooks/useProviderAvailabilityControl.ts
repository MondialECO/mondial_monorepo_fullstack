'use client';

import { useState } from 'react';
import { useCapacity, useUpdateCapacity } from '@/hooks/queries/service-catalog';
import type { ProviderCapacity, UpdateProviderCapacityRequest } from '@/types/service-catalog';

type AvailabilityFeedback = { status: 'success' | 'error'; message: string } | null;

export async function runAvailabilityMutation(
  current: ProviderCapacity,
  mutate: (payload: UpdateProviderCapacityRequest) => Promise<ProviderCapacity>,
) {
  const requested = !current.newOrderAvailability;
  try {
    const result = await mutate({
      maximumConcurrentOrders: current.maximumConcurrentOrders,
      newOrderAvailability: requested,
      manualApprovalWhenCapacityLow: current.manualApprovalWhenCapacityLow,
    });
    return {
      available: result.newOrderAvailability,
      feedback: {
        status: 'success' as const,
        message: result.newOrderAvailability ? 'Availability turned on.' : 'Availability turned off.',
      },
    };
  } catch {
    return {
      available: current.newOrderAvailability,
      feedback: {
        status: 'error' as const,
        message: 'Availability could not be updated. Your previous setting was preserved; try again.',
      },
    };
  }
}

export function useProviderAvailabilityControl(fallbackAvailable = true) {
  const capacity = useCapacity();
  const updateCapacity = useUpdateCapacity();
  const [feedback, setFeedback] = useState<AvailabilityFeedback>(null);
  const available = capacity.data?.newOrderAvailability ?? fallbackAvailable;

  const toggle = async () => {
    if (!capacity.data || updateCapacity.isPending) return;
    setFeedback(null);
    const result = await runAvailabilityMutation(capacity.data, updateCapacity.mutateAsync);
    setFeedback(result.feedback);
  };

  return {
    available,
    canUpdate: !!capacity.data,
    pending: updateCapacity.isPending,
    feedback,
    toggle,
  };
}
