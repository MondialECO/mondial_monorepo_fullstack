"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import entrepreneurApi from "@/lib/api-entrepreneur";
import { useEntrepreneurProgress } from "@/providers/EntrepreneurProgressProvider";
import { AxiosError } from "axios";

export function useEntrepreneurDashboard(explicitCompanyId?: string) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const progressContext = useEntrepreneurProgress();
  const activeCompanyId = explicitCompanyId || progressContext.activeCompanyId || undefined;

  // Fetch current phase and progress scoped to activeCompanyId
  const {
    data: phaseProgress,
    isLoading: isPhaseLoading,
    error: phaseError,
  } = useQuery({
    queryKey: ["entrepreneur", "phase-progress", activeCompanyId ?? "active"],
    queryFn: () => entrepreneurApi.getCurrentPhase(activeCompanyId),
    staleTime: 30000, // Cache for 30 seconds
  });

  // Mutation for advancing phases
  const advancePhaseMutation = useMutation({
    mutationFn: async (payload: {
      companyId: string;
      phaseNumber: number;
      data: Record<string, unknown>;
    }) => {
      return entrepreneurApi.advancePhase(
        payload.companyId,
        payload.phaseNumber,
        payload.data
      );
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch company-specific queries
      queryClient.invalidateQueries({ queryKey: ["entrepreneur", "phase-progress", variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ["entrepreneur", "phase-progress", "active"] });
      queryClient.invalidateQueries({ queryKey: ["entrepreneur"] });
      setError(null);
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as AxiosError<{ error?: string }>)?.response?.data?.error ||
        "Failed to advance phase";
      setError(errorMsg);
    },
  });

  const advancePhase = useCallback(
    async (
      companyId: string,
      phaseNumber: number,
      data: Record<string, unknown>
    ) => {
      return advancePhaseMutation.mutateAsync({
        companyId,
        phaseNumber,
        data,
      });
    },
    [advancePhaseMutation]
  );

  return {
    phaseProgress,
    isPhaseLoading,
    phaseError: phaseError ? (phaseError as Error).message : null,
    advancePhase,
    isAdvancing: advancePhaseMutation.isPending,
    advanceError: error,
    clearError: () => setError(null),
  };
}
