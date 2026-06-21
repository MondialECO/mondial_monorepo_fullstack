"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptNda,
  getDiligenceProgress,
  getInvestorPipeline,
  getInvestorSession,
  getOpportunities,
  getOpportunity,
  getOpportunityDocuments,
  trackDocumentDownload,
} from "@/lib/api-investor-opportunities";
import type {
  NdaAcceptanceResult,
  OpportunityFeedFilters,
} from "@/types/investor/opportunities";

// Centralised query-key roots so cache invalidation can target precisely.
export const investorQueryKeys = {
  all: ["investor", "opportunities"] as const,
  feed: (filters?: OpportunityFeedFilters) =>
    ["investor", "opportunities", "feed", filters ?? {}] as const,
  detail: (companyId: string) =>
    ["investor", "opportunities", "detail", companyId] as const,
  documents: (companyId: string) =>
    ["investor", "opportunities", "documents", companyId] as const,
  session: (companyId: string) =>
    ["investor", "opportunities", "session", companyId] as const,
  diligence: (companyId: string) =>
    ["investor", "opportunities", "diligence", companyId] as const,
  pipeline: () => ["investor", "opportunities", "pipeline"] as const,
};

export function useOpportunities(filters: OpportunityFeedFilters = {}) {
  return useQuery({
    queryKey: investorQueryKeys.feed(filters),
    queryFn: () => getOpportunities(filters),
    staleTime: 30_000,
  });
}

export function useOpportunity(companyId: string | null | undefined) {
  return useQuery({
    queryKey: investorQueryKeys.detail(companyId ?? ""),
    queryFn: () => getOpportunity(companyId as string),
    enabled: !!companyId,
    staleTime: 15_000,
  });
}

export function useOpportunityDocuments(companyId: string | null | undefined) {
  return useQuery({
    queryKey: investorQueryKeys.documents(companyId ?? ""),
    queryFn: () => getOpportunityDocuments(companyId as string),
    enabled: !!companyId,
    staleTime: 15_000,
  });
}

export function useInvestorSession(companyId: string | null | undefined) {
  return useQuery({
    queryKey: investorQueryKeys.session(companyId ?? ""),
    queryFn: () => getInvestorSession(companyId as string),
    enabled: !!companyId,
    staleTime: 10_000,
  });
}

export function useDiligenceProgress(companyId: string | null | undefined) {
  return useQuery({
    queryKey: investorQueryKeys.diligence(companyId ?? ""),
    queryFn: () => getDiligenceProgress(companyId as string),
    enabled: !!companyId,
    staleTime: 15_000,
  });
}

export function useInvestorPipeline() {
  return useQuery({
    queryKey: investorQueryKeys.pipeline(),
    queryFn: getInvestorPipeline,
    staleTime: 15_000,
  });
}

interface UseTrackDownloadVars {
  companyId: string;
  documentId: string;
}

/**
 * Records a document-download engagement event. Best-effort: the download
 * itself already succeeded before this fires, so a tracking error is swallowed
 * by TanStack Query's mutation state rather than surfaced to the user. On
 * success it refreshes the investor's own session-activity and diligence cards.
 */
export function useTrackDocumentDownload() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, UseTrackDownloadVars>({
    mutationFn: ({ companyId, documentId }) =>
      trackDocumentDownload(companyId, documentId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: investorQueryKeys.session(vars.companyId),
      });
      queryClient.invalidateQueries({
        queryKey: investorQueryKeys.diligence(vars.companyId),
      });
    },
  });
}

interface UseNdaAcceptVars {
  companyId: string;
  ndaText: string;
}

export function useNdaAccept() {
  const queryClient = useQueryClient();
  return useMutation<NdaAcceptanceResult, unknown, UseNdaAcceptVars>({
    mutationFn: ({ companyId, ndaText }) => acceptNda(companyId, ndaText),
    onSuccess: (_, vars) => {
      // Invalidate every view that depends on the NDA state for this company,
      // plus the pipeline (kanban column may move).
      queryClient.invalidateQueries({
        queryKey: investorQueryKeys.detail(vars.companyId),
      });
      queryClient.invalidateQueries({
        queryKey: investorQueryKeys.documents(vars.companyId),
      });
      queryClient.invalidateQueries({
        queryKey: investorQueryKeys.session(vars.companyId),
      });
      queryClient.invalidateQueries({
        queryKey: investorQueryKeys.pipeline(),
      });
    },
  });
}
