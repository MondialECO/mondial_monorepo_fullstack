import api from '@/lib/axios';
import type { InvestorStats, Investment, InvestorProfile, InvestorSettings } from '@/types/investor/dashboard';

export const getInvestorStats = async (): Promise<InvestorStats> => {
  try {
    const res = await api.get('/investor/stats');
    return res.data;
  } catch {
    return {
      totalInvested: 0,
      portfolioValue: 0,
      numberOfInvestments: 0,
      averageROI: 0,
      activeInvestments: 0,
      investments: [],
    };
  }
};

export const getInvestorPortfolio = async (): Promise<Investment[]> => {
  try {
    const res = await api.get('/investor/portfolio');
    return res.data;
  } catch {
    return [];
  }
};

export const getInvestorProfile = async (): Promise<InvestorProfile> => {
  try {
    const res = await api.get('/investor/profile');
    return res.data;
  } catch {
    return {};
  }
};

export const getInvestorSettings = async (): Promise<InvestorSettings> => {
  try {
    const res = await api.get('/investor/settings');
    return res.data;
  } catch {
    return {};
  }
};
