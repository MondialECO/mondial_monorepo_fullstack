/**
 * Creator AI client — C-2 Idea Clarifier, C-3 Business Plan, C-4 Forecast.
 *
 * These controllers wrap responses in the shared `ApiResponse` envelope
 * ({ success, message, data, traceId }), so we unwrap `res.data.data` here
 * (unlike the older creator-dashboard client, which returns `res.data`).
 * Errors propagate to the caller; the hooks/UI handle them.
 */

import api from "@/lib/axios";
import type {
  BusinessPlanSession,
  ClarifierSession,
  ForecastSession,
  StartBusinessPlanRequest,
  StartClarifierRequest,
  StartForecastRequest,
  StartSessionResult,
} from "@/types/creator/ai";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  traceId?: string | null;
}

/** Unwrap the ApiResponse envelope, tolerating a raw payload as a fallback. */
const unwrap = <T>(body: ApiEnvelope<T> | T): T => {
  if (body && typeof body === "object" && "data" in (body as ApiEnvelope<T>)) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
};

export const creatorAiApi = {
  // ---------- C-2 Idea Clarifier ----------
  startClarifier: async (
    payload: StartClarifierRequest,
  ): Promise<StartSessionResult> => {
    const res = await api.post("/ai/idea-clarifier", payload);
    return unwrap<StartSessionResult>(res.data);
  },

  getClarifier: async (sessionId: string): Promise<ClarifierSession> => {
    const res = await api.get(`/ai/idea-clarifier/${sessionId}`);
    return unwrap<ClarifierSession>(res.data);
  },

  listClarifiers: async (businessIdeaId?: string): Promise<ClarifierSession[]> => {
    const res = await api.get("/ai/idea-clarifier", {
      params: businessIdeaId ? { businessIdeaId } : undefined,
    });
    return unwrap<ClarifierSession[]>(res.data) ?? [];
  },

  // ---------- C-3 Business Plan ----------
  startBusinessPlan: async (
    payload: StartBusinessPlanRequest,
  ): Promise<StartSessionResult> => {
    const res = await api.post("/ai/business-plan", payload);
    return unwrap<StartSessionResult>(res.data);
  },

  getBusinessPlan: async (sessionId: string): Promise<BusinessPlanSession> => {
    const res = await api.get(`/ai/business-plan/${sessionId}`);
    return unwrap<BusinessPlanSession>(res.data);
  },

  listBusinessPlans: async (
    clarifierSessionId?: string,
  ): Promise<BusinessPlanSession[]> => {
    const res = await api.get("/ai/business-plan", {
      params: clarifierSessionId ? { clarifierSessionId } : undefined,
    });
    return unwrap<BusinessPlanSession[]>(res.data) ?? [];
  },

  // ---------- C-4 Forecast ----------
  startForecast: async (
    payload: StartForecastRequest,
  ): Promise<StartSessionResult> => {
    const res = await api.post("/ai/forecast", payload);
    return unwrap<StartSessionResult>(res.data);
  },

  getForecast: async (sessionId: string): Promise<ForecastSession> => {
    const res = await api.get(`/ai/forecast/${sessionId}`);
    return unwrap<ForecastSession>(res.data);
  },

  listForecasts: async (
    businessPlanSessionId?: string,
  ): Promise<ForecastSession[]> => {
    const res = await api.get("/ai/forecast", {
      params: businessPlanSessionId ? { businessPlanSessionId } : undefined,
    });
    return unwrap<ForecastSession[]>(res.data) ?? [];
  },
};

export default creatorAiApi;
