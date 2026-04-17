import { BillingItem } from '@/types/billing';
import { billingData } from '@/data/billingData';
import type { DashboardStats, Idea } from '@/types/creator/dashboard';

/**
 * Fetch dashboard statistics for creator.
 * TODO: Replace with actual API call when backend endpoint is ready.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  // Placeholder: Replace with actual API call
  return { totalIdeas: 0, totalClicksLast14Days: 0, totalFundRaised: 0, totalRequired: 0, totalEquity: 0, activeInvestors: 0, ideas: [] };
};

/**
 * Fetch creator's ideas dashboard.
 * TODO: Replace with actual API call when backend endpoint is ready.
 */
export const getDashboardMyIdeas = async (): Promise<Idea[]> => {
  // Placeholder: Replace with actual API call
  return [];
};

/**
 * Fetch investor ideas.
 * TODO: Replace with actual API call when backend endpoint is ready.
 */
export const getInvestorIdeas = async () => {
  // Placeholder: Replace with actual API call
  return [];
};

/**
 * Fetch creator profile.
 * TODO: Replace with actual API call when backend endpoint is ready.
 */
export const getProfile = async () => {
  // Placeholder: Replace with actual API call
  return {};
};

/**
 * Fetch billing information.
 * TODO: Replace with actual API call when backend endpoint is ready.
 */
export const getBilling = async () => {
  // Placeholder: Replace with actual API call
  return {};
};

/**
 * Fetch creator settings.
 * TODO: Replace with actual API call when backend endpoint is ready.
 */
export const getSettings = async () => {
  // Placeholder: Replace with actual API call
  return {};
};

/**
 * Fetch billing history transactions.
 * Returns list of BillingItem objects.
 * TODO: Replace with actual API call when backend endpoint is ready.
 */
export const getBillingHistory = async (): Promise<BillingItem[]> => {
  // Temporary: Using static data from data/billingData
  // In production, this will call: GET /api/creator/billing-history
  return billingData;
};

/**
 * Pause a specific idea.
 * TODO: Implement with actual API call when backend endpoint is ready.
 */
export const pauseIdeaApi = async (ideaId: string) => {
  // Placeholder: Replace with actual API call
  return { success: true };
};
