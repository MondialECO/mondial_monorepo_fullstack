"use client";

import { useEffect, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
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

// ===== ONE shared AI-session polling policy (audit R12) =====
// Every creator AI session (Clarifier, Business Plan, Forecast, and any future
// one) inherits this single timeout. Do NOT copy these numbers elsewhere —
// import them.
export const POLL_INTERVAL_MS = 2500;
export const POLL_MAX_ATTEMPTS = 60;          // 60 polls
export const POLL_MAX_MS = 3 * 60 * 1000;     // …or 3 minutes wall-clock

/** "polling" while running, "terminal" when the session settled, "timedout" at the cap. */
export type PollPhase = "idle" | "polling" | "terminal" | "timedout";

/** Reuses the useBackgroundJob polling shape: poll until status is terminal. */
const sessionRefetchInterval = (status?: AiSessionStatus | null) =>
  isTerminalStatus(status) ? false : POLL_INTERVAL_MS;

/**
 * Shared timed session poller. Polls until the session is terminal OR the cap
 * (attempts/wall-clock) is hit. A timeout is NOT a failure — the backend job may
 * still finish; `retry()` re-attaches to the SAME sessionId and resumes polling.
 */
export interface TimedSession<T> {
  data: T | undefined;
  phase: PollPhase;
  isError: boolean;
  error: unknown;
  retry: () => void;
}

function useTimedSession<T extends { status: AiSessionStatus }>(
  sessionId: string | null,
  queryKey: QueryKey,
  fetcher: (id: string) => Promise<T>,
): TimedSession<T> {
  const [timedOut, setTimedOut] = useState(false);
  const startRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);

  // Reset the clock whenever the session id changes.
  useEffect(() => {
    startRef.current = sessionId ? Date.now() : null;
    attemptsRef.current = 0;
    setTimedOut(false);
  }, [sessionId]);

  const query = useQuery<T>({
    queryKey,
    queryFn: () => fetcher(sessionId as string),
    enabled: !!sessionId && !timedOut,
    refetchOnWindowFocus: false,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (isTerminalStatus(status)) return false;
      attemptsRef.current += 1;
      const elapsed = startRef.current ? Date.now() - startRef.current : 0;
      if (attemptsRef.current >= POLL_MAX_ATTEMPTS || elapsed >= POLL_MAX_MS) {
        setTimedOut(true);
        return false;
      }
      return POLL_INTERVAL_MS;
    },
  });

  const retry = () => {
    startRef.current = Date.now();
    attemptsRef.current = 0;
    setTimedOut(false);
    void query.refetch();
  };

  const phase: PollPhase = !sessionId
    ? "idle"
    : timedOut
    ? "timedout"
    : isTerminalStatus(query.data?.status)
    ? "terminal"
    : "polling";

  return { data: query.data, phase, isError: query.isError, error: query.error, retry };
}

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

/** Clarifier polling with the shared R12 timeout. */
export const useClarifierSessionTimed = (sessionId: string | null) =>
  useTimedSession<ClarifierSession>(
    sessionId,
    clarifierKeys.detail(sessionId),
    creatorAiApi.getClarifier,
  );

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

/** Business-plan polling with the shared R12 timeout. */
export const useBusinessPlanSessionTimed = (sessionId: string | null) =>
  useTimedSession<BusinessPlanSession>(
    sessionId,
    businessPlanKeys.detail(sessionId),
    creatorAiApi.getBusinessPlan,
  );

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

/** Forecast polling with the shared R12 timeout. */
export const useForecastSessionTimed = (sessionId: string | null) =>
  useTimedSession<ForecastSession>(
    sessionId,
    forecastKeys.detail(sessionId),
    creatorAiApi.getForecast,
  );

export const useStartForecast = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartForecastRequest) =>
      creatorAiApi.startForecast(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["creator-ai", "forecast", "list"] }),
  });
};
