import api from '@/lib/axios';
import { BillingItem } from '@/types/billing';
import { billingData } from '@/data/billingData';
import type { DashboardStats, Idea } from '@/types/creator/dashboard';
import type { CreateIdeaModel, SaveIdeaResponse } from '@/types/creator/create-idea-model';

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

/**
 * Create a new business idea or update an existing draft.
 * Maps the flat CreateIdeaModel to the backend's multipart `[FromForm]`
 * `POST /creator/new-idea/{id?}` route (CreateIdeaDto + media/documents files).
 * Errors propagate to the caller — do not swallow them here.
 */
export const saveIdeaDraftApi = async (
  payload: CreateIdeaModel,
): Promise<SaveIdeaResponse> => {
  const { id, media, documents, ...fields } = payload;

  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    form.append(key, String(value));
  }
  (media ?? []).forEach((file) => form.append('media', file));
  (documents ?? []).forEach((file) => form.append('documents', file));

  const url = id ? `/creator/new-idea/${id}` : '/creator/new-idea';
  const res = await api.post<SaveIdeaResponse>(url, form);
  return res.data;
};

export const pauseIdeaApi = async (ideaId: string) => {
  try {
    const res = await api.patch(`/creator/ideas/${ideaId}/pause`);
    return res.data;
  } catch {
    return { success: false };
  }
};

export interface CreateCompanyFromIdeaResponse {
  companyId: string;
  sourceBusinessIdeaId: string;
  alreadyExisted: boolean;
}

export const createCompanyFromIdea = async (
  ideaId: string,
): Promise<CreateCompanyFromIdeaResponse> => {
  const res = await api.post(`/companies/from-idea/${ideaId}`);
  return res.data;
};
