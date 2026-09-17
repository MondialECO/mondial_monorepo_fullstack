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
  type AiCreditBalance,
  type AiSessionStatus,
  type BusinessModelSession,
  type BusinessPlanSession,
  type ClarifierSession,
  type ForecastSession,
  type MarketStudySession,
  type StartBusinessModelRequest,
  type StartBusinessPlanRequest,
  type StartClarifierRequest,
  type StartForecastRequest,
  type StartMarketStudyRequest,
} from "@/types/creator/ai";

// ===== ONE shared AI-session polling policy (audit R12) =====
// Every creator AI session (Clarifier, Market Study, Business Model, Business Plan, Forecast)
// inherits this single timeout. Do NOT copy these numbers elsewhere — import them.
export const POLL_INTERVAL_MS = 2500;
// Ceiling must outlast the backend worst case: Hangfire pickup (~15s) + the 120s
// OpenRouter HTTP timeout + parse/persist (~1s) ≈ 136s. 96 polls × 2500ms = 240s
// gives a ~100s margin so the poll never abandons a job that still succeeds.
export const POLL_MAX_ATTEMPTS = 96;          // 96 polls × 2500ms ≈ 240s
export const POLL_MAX_MS = 4 * 60 * 1000;     // …or 4 minutes wall-clock

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
  const qc = useQueryClient();
  const [timedOut, setTimedOut] = useState(false);
  const startRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);
  const lastSeenStatusRef = useRef<AiSessionStatus | null>(null);
  /** Guards one-shot credit invalidation per session. */
  const creditInvalidatedRef = useRef<string | null>(null);

  // Reset the clock whenever the session id changes.
  useEffect(() => {
    startRef.current = sessionId ? Date.now() : null;
    attemptsRef.current = 0;
    setTimedOut(false);
    lastSeenStatusRef.current = null;
    creditInvalidatedRef.current = null;
  }, [sessionId]);

  const query = useQuery<T>({
    queryKey,
    queryFn: () => fetcher(sessionId as string),
    enabled: !!sessionId && !timedOut,
    refetchOnWindowFocus: false,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (isTerminalStatus(status)) {
        lastSeenStatusRef.current = status ?? null;
        return false;
      }
      // If we observed a transition from a terminal status back to active (e.g. regenerate triggered)
      if (lastSeenStatusRef.current && isTerminalStatus(lastSeenStatusRef.current) && !isTerminalStatus(status)) {
        startRef.current = Date.now();
        attemptsRef.current = 0;
        setTimedOut(false);
        creditInvalidatedRef.current = null;
      }
      lastSeenStatusRef.current = status ?? null;

      attemptsRef.current += 1;
      const elapsed = startRef.current ? Date.now() - startRef.current : 0;
      if (attemptsRef.current >= POLL_MAX_ATTEMPTS || elapsed >= POLL_MAX_MS) {
        setTimedOut(true);
        return false;
      }
      return POLL_INTERVAL_MS;
    },
  });

  // Track status changes outside refetchInterval (e.g. initial fetch or query invalidation)
  useEffect(() => {
    const currentStatus = query.data?.status;
    if (!currentStatus) return;

    if (lastSeenStatusRef.current && isTerminalStatus(lastSeenStatusRef.current) && !isTerminalStatus(currentStatus)) {
      startRef.current = Date.now();
      attemptsRef.current = 0;
      setTimedOut(false);
      creditInvalidatedRef.current = null;
    }
    lastSeenStatusRef.current = currentStatus;
  }, [query.data?.status]);

  // When the session reaches a terminal state, refresh the credit balance
  // so the badge reflects any refund (Failed) or confirms the debit (Completed).
  useEffect(() => {
    if (
      sessionId &&
      query.data &&
      isTerminalStatus(query.data.status) &&
      creditInvalidatedRef.current !== sessionId
    ) {
      creditInvalidatedRef.current = sessionId;
      void qc.invalidateQueries({ queryKey: creditKeys.balance });
    }
  }, [sessionId, query.data, qc]);

  const retry = () => {
    startRef.current = Date.now();
    attemptsRef.current = 0;
    setTimedOut(false);
    creditInvalidatedRef.current = null;
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

// ===== Credit Balance (single source of truth) =====

export const creditKeys = {
  balance: ["ai-credits"] as const,
};

/** Fetches balance + server-authoritative cost table. Stale-while-revalidate at 60s. */
export const useAiCredits = () =>
  useQuery<AiCreditBalance>({
    queryKey: creditKeys.balance,
    queryFn: () => creatorAiApi.getCredits(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

// ===== Generic helpers =====

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creator-ai", "clarifier", "list"] });
      qc.invalidateQueries({ queryKey: creditKeys.balance });
    },
  });
};

// ---------- Phase 3.1 Market Study ----------

export const marketStudyKeys = {
  list: (clarifierSessionId?: string, businessIdeaId?: string) =>
    ["creator-ai", "market-study", "list", clarifierSessionId ?? null, businessIdeaId ?? null] as const,
  detail: (sessionId: string | null) =>
    ["creator-ai", "market-study", "detail", sessionId] as const,
};

export const useMarketStudySessions = (clarifierSessionId?: string, businessIdeaId?: string) =>
  useQuery<MarketStudySession[]>({
    queryKey: marketStudyKeys.list(clarifierSessionId, businessIdeaId),
    queryFn: () => creatorAiApi.listMarketStudies(clarifierSessionId, businessIdeaId),
    enabled: !!clarifierSessionId || !!businessIdeaId,
    select: byNewest,
  });

export const useMarketStudySession = (sessionId: string | null) =>
  useQuery<MarketStudySession>({
    queryKey: marketStudyKeys.detail(sessionId),
    queryFn: () => creatorAiApi.getMarketStudy(sessionId as string),
    enabled: !!sessionId,
    refetchInterval: (query) =>
      sessionRefetchInterval(query.state.data?.status),
    refetchOnWindowFocus: false,
  });

/** Market Study polling with the shared R12 timeout. */
export const useMarketStudySessionTimed = (sessionId: string | null) =>
  useTimedSession<MarketStudySession>(
    sessionId,
    marketStudyKeys.detail(sessionId),
    creatorAiApi.getMarketStudy,
  );

export const useStartMarketStudy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartMarketStudyRequest) =>
      creatorAiApi.startMarketStudy(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creator-ai", "market-study", "list"] });
      qc.invalidateQueries({ queryKey: creditKeys.balance });
    },
  });
};

export const useRegenerateMarketStudy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      creatorAiApi.regenerateMarketStudy(sessionId),
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: marketStudyKeys.detail(sessionId) });
      qc.invalidateQueries({ queryKey: ["creator-ai", "market-study", "list"] });
      qc.invalidateQueries({ queryKey: creditKeys.balance });
    },
  });
};

// ---------- Phase 3.2 Business Model ----------

export const businessModelKeys = {
  list: (marketStudySessionId?: string, businessIdeaId?: string) =>
    ["creator-ai", "business-model", "list", marketStudySessionId ?? null, businessIdeaId ?? null] as const,
  detail: (sessionId: string | null) =>
    ["creator-ai", "business-model", "detail", sessionId] as const,
};

export const useBusinessModelSessions = (marketStudySessionId?: string, businessIdeaId?: string) =>
  useQuery<BusinessModelSession[]>({
    queryKey: businessModelKeys.list(marketStudySessionId, businessIdeaId),
    queryFn: () => creatorAiApi.listBusinessModels(marketStudySessionId, businessIdeaId),
    enabled: !!marketStudySessionId || !!businessIdeaId,
    select: byNewest,
  });

export const useBusinessModelSession = (sessionId: string | null) =>
  useQuery<BusinessModelSession>({
    queryKey: businessModelKeys.detail(sessionId),
    queryFn: () => creatorAiApi.getBusinessModel(sessionId as string),
    enabled: !!sessionId,
    refetchInterval: (query) =>
      sessionRefetchInterval(query.state.data?.status),
    refetchOnWindowFocus: false,
  });

/** Business Model polling with the shared R12 timeout. */
export const useBusinessModelSessionTimed = (sessionId: string | null) =>
  useTimedSession<BusinessModelSession>(
    sessionId,
    businessModelKeys.detail(sessionId),
    creatorAiApi.getBusinessModel,
  );

export const useStartBusinessModel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartBusinessModelRequest) =>
      creatorAiApi.startBusinessModel(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creator-ai", "business-model", "list"] });
      qc.invalidateQueries({ queryKey: creditKeys.balance });
    },
  });
};

export const useRegenerateBusinessModel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      creatorAiApi.regenerateBusinessModel(sessionId),
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: businessModelKeys.detail(sessionId) });
      qc.invalidateQueries({ queryKey: ["creator-ai", "business-model", "list"] });
      qc.invalidateQueries({ queryKey: creditKeys.balance });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["creator-ai", "business-plan", "list"],
      });
      qc.invalidateQueries({ queryKey: creditKeys.balance });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creator-ai", "forecast", "list"] });
      qc.invalidateQueries({ queryKey: creditKeys.balance });
    },
  });
};
