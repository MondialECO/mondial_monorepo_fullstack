'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addPortfolioItem,
  deletePortfolioItem,
  getProfile,
  submitVerification,
  updatePortfolioItem,
  upsertProfile,
} from '@/lib/api-service-provider';
import type { ServiceProviderProfile } from '@/types/service-provider';

const PROFILE_KEY = ['serviceProvider', 'profile'] as const;

export const useServiceProviderProfile = () =>
  useQuery<ServiceProviderProfile>({
    queryKey: PROFILE_KEY,
    queryFn: getProfile,
  });

// Profile + portfolio writes all return the full refreshed profile, so we seed
// the cache directly instead of triggering a refetch.
export const useUpsertProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertProfile,
    onSuccess: (profile) => qc.setQueryData(PROFILE_KEY, profile),
  });
};

export const useAddPortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addPortfolioItem,
    onSuccess: (profile) => qc.setQueryData(PROFILE_KEY, profile),
  });
};

export const useUpdatePortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePortfolioItem,
    onSuccess: (profile) => qc.setQueryData(PROFILE_KEY, profile),
  });
};

export const useDeletePortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePortfolioItem,
    onSuccess: (profile) => qc.setQueryData(PROFILE_KEY, profile),
  });
};

// submit-verification returns the smaller verification projection, so we
// invalidate to pull the full profile with the updated status.
export const useSubmitVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitVerification,
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
};
