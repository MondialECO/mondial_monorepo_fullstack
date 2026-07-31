'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-analytics';
import type { AnalyticsFilters, CreateGrowthTaskPayload } from '@/types/analytics';

const ANALYTICS = ['provider-analytics'] as const;
const OVERVIEW = ['provider-dashboard-overview'] as const;
const TASKS = ['provider-growth-tasks'] as const;

export const useProviderAnalytics = (filters: AnalyticsFilters) => useQuery({
  queryKey: [...ANALYTICS, filters],
  queryFn: () => api.getAnalytics(filters),
});

export const useProviderOverview = (currency = 'EUR') => useQuery({
  queryKey: [...OVERVIEW, currency],
  queryFn: () => api.getProviderOverview(currency),
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

// Phase B read endpoints
const LISTINGS = ['service-provider-analytics-listings'] as const;
const SUMMARY = ['service-provider-analytics-summary'] as const;
const TIMESERIES = ['service-provider-analytics-timeseries'] as const;

export const analyticsKeys = {
  listings: () => LISTINGS,
  summary: (id: string, range: api.AnalyticsRange) => [...SUMMARY, id, range] as const,
  timeseries: (id: string, range: api.AnalyticsRange) => [...TIMESERIES, id, range] as const,
};

export const useAnalyticsListings = () =>
  useQuery({
    queryKey: analyticsKeys.listings(),
    queryFn: api.getAnalyticsListings,
    staleTime: 5 * 60_000,
  });

export const useAnalyticsSummary = (
  listingId: string | null,
  range: api.AnalyticsRange
) =>
  useQuery({
    queryKey: analyticsKeys.summary(listingId ?? '', range),
    queryFn: () => api.getAnalyticsSummary(listingId!, range),
    enabled: !!listingId,
    staleTime: 60_000,
  });

export const useAnalyticsTimeseries = (
  listingId: string | null,
  range: api.AnalyticsRange
) =>
  useQuery({
    queryKey: analyticsKeys.timeseries(listingId ?? '', range),
    queryFn: () => api.getAnalyticsTimeseries(listingId!, range),
    enabled: !!listingId,
    staleTime: 60_000,
  });
