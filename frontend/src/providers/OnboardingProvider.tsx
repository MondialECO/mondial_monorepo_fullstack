"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import api from "@/lib/axios";
import {
  ONBOARDING_STEPS,
  OnboardingStatus,
  OnboardingStep,
  isOnboardingComplete,
  nextIncompleteStep,
} from "@/lib/onboarding-routes";

interface OnboardingContextValue {
  status: OnboardingStatus | null;
  isLoading: boolean;
  /** True once status.phase >= 1. */
  isComplete: boolean;
  /** First step the user still needs to finish, or null when done. */
  nextStep: OnboardingStep | null;
  steps: OnboardingStep[];
  /** Re-fetch status from the backend. Called after every step mutation. */
  refresh: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    // Safe default for components that may render outside the provider tree
    // during SSR / hydration. Real consumers should be inside the provider.
    return {
      status: null,
      isLoading: true,
      isComplete: false,
      nextStep: null,
      steps: ONBOARDING_STEPS,
      refresh: async () => {},
    };
  }
  return ctx;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/onboarding/status");
      const payload = res.data?.data ?? res.data;
      setStatus(payload as OnboardingStatus);
    } catch {
      // Unauthenticated or backend down — leave status null; AuthGuard
      // will catch the auth case and bounce the user to /login.
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value: OnboardingContextValue = {
    status,
    isLoading,
    isComplete: isOnboardingComplete(status),
    nextStep: status ? nextIncompleteStep(status) : null,
    steps: ONBOARDING_STEPS,
    refresh,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
