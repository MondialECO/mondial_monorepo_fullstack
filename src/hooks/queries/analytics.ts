'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-analytics';
import type { AnalyticsFilters, CreateGrowthTaskPayload } from '@/types/analytics';

const ANALYTICS = ['provider-analytics'] as const;
const TASKS = ['provider-growth-tasks'] as const;

export const useProviderAnalytics = (filters: AnalyticsFilters) => useQuery({
  queryKey: [...ANALYTICS, filters],
  queryFn: () => api.getAnalytics(filters),
});

export const useGrowthTasks = () => useQuery({ queryKey: TASKS, queryFn: api.getGrowthTasks });

export const useCreateGrowthTask = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGrowthTaskPayload) => api.createGrowthTask(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: TASKS }),
  });
};

export const useUpdateGrowthTaskStatus = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.updateGrowthTaskStatus(id, status),
    onSuccess: () => client.invalidateQueries({ queryKey: TASKS }),
  });
};
