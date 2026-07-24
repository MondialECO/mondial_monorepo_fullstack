/**
 * Creator dashboard client.
 *
 * Shares ONE error contract with the journey and AI clients (audit R11):
 *   - unwrap the ApiResponse envelope via `unwrap` (tolerates a raw payload, since
 *     the dashboard controller returns bare `Ok(obj)` while newer controllers wrap
 *     in { success, message, data });
 *   - PROPAGATE every failure — no silent {}/[]/mock fallbacks. TanStack Query
 *     catches the throw and exposes `isError` so the UI can show a real error
 *     state instead of an empty list masquerading as "you have nothing".
 */

import api from '@/lib/axios';
import { BillingItem } from '@/types/billing';
import type { DashboardStats, Idea } from '@/types/creator/dashboard';
import type { CreateIdeaModel, SaveIdeaResponse } from '@/types/creator/create-idea-model';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  traceId?: string | null;
}

/** Unwrap the ApiResponse envelope, tolerating a raw payload as a fallback. */
const unwrap = <T>(body: ApiEnvelope<T> | T): T => {
  if (body && typeof body === 'object' && 'data' in (body as ApiEnvelope<T>)) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get('/creator/dashboard/stats');
  return unwrap<DashboardStats>(res.data);
};

export const getDashboardMyIdeas = async (): Promise<Idea[]> => {
  // Canonical marketplace route — /creator/ideas now belongs to the multi-idea
  // list (CreatorIdeasController), which returns a different shape.
  const res = await api.get('/creator/my-ideas');
  return unwrap<Idea[]>(res.data);
};

export const getInvestorIdeas = async (): Promise<Idea[]> => {
  const res = await api.get('/ideas');
  return unwrap<Idea[]>(res.data);
};

export const getProfile = async () => {
  const res = await api.get('/creator/profile');
  return unwrap(res.data);
};

export const getBilling = async () => {
  const res = await api.get('/creator/billing');
  return unwrap(res.data);
};

export const getSettings = async () => {
  const res = await api.get('/creator/settings');
  return unwrap(res.data);
};

export const getBillingHistory = async (): Promise<BillingItem[]> => {
  const res = await api.get('/creator/billing-history');
  return unwrap<BillingItem[]>(res.data);
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
  return unwrap<SaveIdeaResponse>(res.data);
};

export const pauseIdeaApi = async (ideaId: string) => {
  const res = await api.patch(`/creator/ideas/${ideaId}/pause`);
  return unwrap(res.data);
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
  return unwrap<CreateCompanyFromIdeaResponse>(res.data);
};
