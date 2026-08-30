'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getInvestorStats,
  getInvestorPortfolio,
  getInvestorPortfolioHolding,
  getInvestorProfile,
  getInvestorSettings,
} from '@/lib/api-investor-dashboard';
import type {
  InvestorStats,
  InvestorPortfolioResponse,
  CompanyPortfolioHolding,
  InvestorProfile,
  InvestorSettings,
} from '@/types/investor/dashboard';

export const useInvestorStats = () => {
  return useQuery<InvestorStats>({
    queryKey: ['investor', 'stats'],
    queryFn: getInvestorStats,
  });
};

export const useInvestorPortfolio = () => {
  return useQuery<InvestorPortfolioResponse>({
    queryKey: ['investor', 'portfolio'],
    queryFn: getInvestorPortfolio,
  });
};

export const useInvestorPortfolioHolding = (holdingId?: string) => {
  return useQuery<CompanyPortfolioHolding | null>({
    queryKey: ['investor', 'portfolio', holdingId],
    queryFn: () => (holdingId ? getInvestorPortfolioHolding(holdingId) : Promise.resolve(null)),
    enabled: Boolean(holdingId),
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
