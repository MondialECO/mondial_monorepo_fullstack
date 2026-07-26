'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addPortfolioItem,
  deletePortfolioItem,
  getProfile,
  getSkillsTestQuestions,
  getSkillsTestStatus,
  getTrust,
  submitSkillsTest,
  submitVerification,
  updatePortfolioItem,
  upsertProfile,
} from '@/lib/api-service-provider';
import type {
  ServiceProviderProfile,
  SkillsTestStatus,
  TrustBreakdown,
} from '@/types/service-provider';

const PROFILE_KEY = ['serviceProvider', 'profile'] as const;
const TRUST_KEY = ['serviceProvider', 'trust'] as const;
const SKILLS_TEST_KEY = ['serviceProvider', 'skillsTest', 'status'] as const;

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

// ---- Module 1: Profile & Trust ----

// Trust + skills-test are only meaningful once verified; callers pass `enabled`
// so the panels stay dormant (no request) until the badge is granted.
export const useServiceProviderTrust = (enabled = true) =>
  useQuery<TrustBreakdown>({
    queryKey: TRUST_KEY,
    queryFn: getTrust,
    enabled,
  });

export const useSkillsTestStatus = (enabled = true) =>
  useQuery<SkillsTestStatus>({
    queryKey: SKILLS_TEST_KEY,
    queryFn: getSkillsTestStatus,
    enabled,
  });

// Questions are fetched imperatively when the provider starts a test (a GET with
// a param), so this is exposed as a mutation rather than a standing query.
export const useStartSkillsTest = () =>
  useMutation({ mutationFn: (category: string) => getSkillsTestQuestions(category) });

// A graded submission changes the trust score and the category's cooldown, so we
// refresh trust, the skills-test status, and the profile (trustScore lives there too).
export const useSubmitSkillsTest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitSkillsTest,
    onSuccess: (result) => {
      qc.setQueryData(TRUST_KEY, result.trust);
      qc.invalidateQueries({ queryKey: SKILLS_TEST_KEY });
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
};
