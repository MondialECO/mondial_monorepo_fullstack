'use client';

import { useQuery } from '@tanstack/react-query';
import { getInvestorStats, getInvestorPortfolio, getInvestorProfile, getInvestorSettings } from '@/lib/api-investor-dashboard';
import type { InvestorStats, Investment, InvestorProfile, InvestorSettings } from '@/types/investor/dashboard';

export const useInvestorStats = () => {
  return useQuery<InvestorStats>({
    queryKey: ['investor', 'stats'],
    queryFn: getInvestorStats,
  });
};

export const useInvestorPortfolio = () => {
  return useQuery<Investment[]>({
    queryKey: ['investor', 'portfolio'],
    queryFn: getInvestorPortfolio,
  });
};

export const useInvestorProfile = () => {
  return useQuery<InvestorProfile>({
    queryKey: ['investor', 'profile'],
    queryFn: getInvestorProfile,
  });
};

export const useInvestorSettings = () => {
  return useQuery<InvestorSettings>({
    queryKey: ['investor', 'settings'],
    queryFn: getInvestorSettings,
  });
};
