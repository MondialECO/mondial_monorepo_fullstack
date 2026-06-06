"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import creatorAiApi from "@/lib/api-creator-ai";
import {
  isTerminalStatus,
  type AiSessionStatus,
  type BusinessPlanSession,
  type ClarifierSession,
  type ForecastSession,
  type StartBusinessPlanRequest,
  type StartClarifierRequest,
  type StartForecastRequest,
} from "@/types/creator/ai";

const POLL_INTERVAL_MS = 2500;

/** Reuses the useBackgroundJob polling shape: poll until status is terminal. */
const sessionRefetchInterval = (status?: AiSessionStatus | null) =>
  isTerminalStatus(status) ? false : POLL_INTERVAL_MS;

const byNewest = <T extends { createdAt: string }>(rows: T[]): T[] =>
  [...rows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

// ---------- C-2 Idea Clarifier ----------

export const clarifierKeys = {
  list: (businessIdeaId?: string) =>
    ["creator-ai", "clarifier", "list", businessIdeaId ?? null] as const,
  detail: (sessionId: string | null) =>
    ["creator-ai", "clarifier", "detail", sessionId] as const,
};

export const useClarifierSessions = (businessIdeaId?: string) =>
  useQuery<ClarifierSession[]>({
    queryKey: clarifierKeys.list(businessIdeaId),
    queryFn: () => creatorAiApi.listClarifiers(businessIdeaId),
    select: byNewest,
  });

export const useClarifierSession = (sessionId: string | null) =>
  useQuery<ClarifierSession>({
    queryKey: clarifierKeys.detail(sessionId),
    queryFn: () => creatorAiApi.getClarifier(sessionId as string),
    enabled: !!sessionId,
    refetchInterval: (query) =>
      sessionRefetchInterval(query.state.data?.status),
    refetchOnWindowFocus: false,
  });

export const useStartClarifier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartClarifierRequest) =>
      creatorAiApi.startClarifier(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["creator-ai", "clarifier", "list"] }),
  });
};

// ---------- C-3 Business Plan ----------

export const businessPlanKeys = {
  list: (clarifierSessionId?: string) =>
    ["creator-ai", "business-plan", "list", clarifierSessionId ?? null] as const,
  detail: (sessionId: string | null) =>
    ["creator-ai", "business-plan", "detail", sessionId] as const,
};

export const useBusinessPlanSessions = (clarifierSessionId?: string) =>
  useQuery<BusinessPlanSession[]>({
    queryKey: businessPlanKeys.list(clarifierSessionId),
    queryFn: () => creatorAiApi.listBusinessPlans(clarifierSessionId),
    enabled: !!clarifierSessionId,
    select: byNewest,
  });

export const useBusinessPlanSession = (sessionId: string | null) =>
  useQuery<BusinessPlanSession>({
    queryKey: businessPlanKeys.detail(sessionId),
    queryFn: () => creatorAiApi.getBusinessPlan(sessionId as string),
    enabled: !!sessionId,
    refetchInterval: (query) =>
      sessionRefetchInterval(query.state.data?.status),
    refetchOnWindowFocus: false,
  });

export const useStartBusinessPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartBusinessPlanRequest) =>
      creatorAiApi.startBusinessPlan(payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["creator-ai", "business-plan", "list"],
      }),
  });
};

// ---------- C-4 Forecast ----------

export const forecastKeys = {
  list: (businessPlanSessionId?: string) =>
    ["creator-ai", "forecast", "list", businessPlanSessionId ?? null] as const,
  detail: (sessionId: string | null) =>
    ["creator-ai", "forecast", "detail", sessionId] as const,
};

export const useForecastSessions = (businessPlanSessionId?: string) =>
  useQuery<ForecastSession[]>({
    queryKey: forecastKeys.list(businessPlanSessionId),
    queryFn: () => creatorAiApi.listForecasts(businessPlanSessionId),
    enabled: !!businessPlanSessionId,
    select: byNewest,
  });

export const useForecastSession = (sessionId: string | null) =>
  useQuery<ForecastSession>({
    queryKey: forecastKeys.detail(sessionId),
    queryFn: () => creatorAiApi.getForecast(sessionId as string),
    enabled: !!sessionId,
    refetchInterval: (query) =>
      sessionRefetchInterval(query.state.data?.status),
    refetchOnWindowFocus: false,
  });

export const useStartForecast = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartForecastRequest) =>
      creatorAiApi.startForecast(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["creator-ai", "forecast", "list"] }),
  });
};
