'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardStats, getDashboardMyIdeas, getInvestorIdeas, getProfile, getBilling, getSettings, pauseIdeaApi, getBillingHistory } from '@/lib/api-creator-dashboard';
import type { DashboardStats, Idea, CreatorProfile, BillingInfo, CreatorSettings } from '@/types/creator/dashboard';
import type { BillingItem } from '@/types/billing';

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['creator', 'dashboardStats'],
    queryFn: getDashboardStats,
  });
};

export const useMyIdeas = () => {
  return useQuery<Idea[]>({
    queryKey: ['creator', 'myIdeas'],
    queryFn: getDashboardMyIdeas,
  });
};

export const useInvestorIdeas = () => {
  return useQuery<Idea[]>({
    queryKey: ['creator', 'investorIdeas'],
    queryFn: getInvestorIdeas,
  });
};

export const useProfile = () => {
  return useQuery<CreatorProfile>({
    queryKey: ['creator', 'profile'],
    queryFn: getProfile,
  });
};

export const useBilling = () => {
  return useQuery<BillingInfo>({
    queryKey: ['creator', 'billing'],
    queryFn: getBilling,
  });
};

export const useSettings = () => {
  return useQuery<CreatorSettings>({
    queryKey: ['creator', 'settings'],
    queryFn: getSettings,
  });
};

export const useBillingHistory = () => {
  return useQuery<BillingItem[]>({
    queryKey: ['creator', 'billingHistory'],
    queryFn: getBillingHistory,
  });
};

export const usePauseIdea = (ideaId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => pauseIdeaApi(ideaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator', 'myIdeas'] }),
  });
};