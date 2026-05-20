import api from '@/lib/axios';
import { BillingItem } from '@/types/billing';
import { billingData } from '@/data/billingData';
import type { DashboardStats, Idea } from '@/types/creator/dashboard';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const res = await api.get('/creator/dashboard/stats');
    return res.data;
  } catch {
    return { totalIdeas: 0, totalClicksLast14Days: 0, totalFundRaised: 0, totalRequired: 0, totalEquity: 0, activeInvestors: 0, ideas: [] };
  }
};

export const getDashboardMyIdeas = async (): Promise<Idea[]> => {
  try {
    const res = await api.get('/creator/ideas');
    return res.data;
  } catch {
    return [];
  }
};

export const getInvestorIdeas = async () => {
  try {
    const res = await api.get('/ideas');
    return res.data;
  } catch {
    return [];
  }
};

export const getProfile = async () => {
  try {
    const res = await api.get('/creator/profile');
    return res.data;
  } catch {
    return {};
  }
};

export const getBilling = async () => {
  try {
    const res = await api.get('/creator/billing');
    return res.data;
  } catch {
    return {};
  }
};

export const getSettings = async () => {
  try {
    const res = await api.get('/creator/settings');
    return res.data;
  } catch {
    return {};
  }
};

export const getBillingHistory = async (): Promise<BillingItem[]> => {
  try {
    const res = await api.get('/creator/billing-history');
    return res.data;
  } catch {
    return billingData;
  }
};

export const pauseIdeaApi = async (ideaId: string) => {
  try {
    const res = await api.patch(`/creator/ideas/${ideaId}/pause`);
    return res.data;
  } catch {
    return { success: false };
  }
};
