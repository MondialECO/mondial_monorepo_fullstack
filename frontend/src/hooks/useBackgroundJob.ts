"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import entrepreneurApi, { JobStatus } from "@/lib/api-entrepreneur";

export function useBackgroundJob(jobId: string | null) {
  const [isPolling, setIsPolling] = useState(!!jobId);

  // Poll job status every 2 seconds if job is queued/processing
  const { data: jobStatus, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => {
      if (!jobId) return null;
      return entrepreneurApi.getJobStatus(jobId);
    },
    enabled: !!jobId && isPolling,
    refetchInterval: (data) => {
      if (!data) return false;
      // Stop polling once job is completed or failed
      if (data.status === "completed" || data.status === "failed") {
        setIsPolling(false);
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    refetchOnWindowFocus: false,
  });

  // Stop polling when job is done
  useEffect(() => {
    if (jobStatus?.status === "completed" || jobStatus?.status === "failed") {
      setIsPolling(false);
    }
  }, [jobStatus?.status]);

  return {
    jobStatus: jobStatus as JobStatus | null,
    isLoading,
    isDone: jobStatus?.status === "completed" || jobStatus?.status === "failed",
    isSuccess: jobStatus?.status === "completed",
    isFailed: jobStatus?.status === "failed",
  };
}

// Hook to enqueue a background job
export function useEnqueueAiReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: string) =>
      entrepreneurApi.enqueueAiReview(companyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["job"] });
    },
  });
}

export function useEnqueueInvestorMatching() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: string) =>
      entrepreneurApi.enqueueInvestorMatching(companyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["job"] });
    },
  });
}

export function useEnqueueDataRoomAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: string) =>
      entrepreneurApi.enqueueDataRoomAnalysis(companyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["job"] });
    },
  });
}

export function useEnqueueFinancialProjections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: string) =>
      entrepreneurApi.enqueueFinancialProjections(companyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["job"] });
    },
  });
}
