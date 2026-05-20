"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import entrepreneurApi, { CompanyProgressResponse } from "@/lib/api-entrepreneur";

export function useEntrepreneurDashboard() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch current phase and progress
  const {
    data: phaseProgress,
    isLoading: isPhaseLoading,
    error: phaseError,
  } = useQuery({
    queryKey: ["entrepreneur", "phase-progress"],
    queryFn: entrepreneurApi.getCurrentPhase,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Mutation for advancing phases
  const advancePhaseMutation = useMutation({
    mutationFn: async (payload: {
      companyId: string;
      phaseNumber: number;
      data: any;
    }) => {
      return entrepreneurApi.advancePhase(
        payload.companyId,
        payload.phaseNumber,
        payload.data
      );
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["entrepreneur"] });
      setError(null);
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.error || "Failed to advance phase";
      setError(errorMsg);
    },
  });

  const advancePhase = useCallback(
    async (companyId: string, phaseNumber: number, data: any) => {
      return advancePhaseMutation.mutate({
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
