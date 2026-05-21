"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import api from "@/lib/axios";
import {
  ONBOARDING_ITEMS,
  OnboardingItem,
  OnboardingStatus,
  firstIncompleteRequired,
  isOnboardingComplete,
} from "@/lib/onboarding-routes";

interface OnboardingContextValue {
  status: OnboardingStatus | null;
  isLoading: boolean;
  isComplete: boolean;
  items: OnboardingItem[];
  /** First required item that isn't done yet, or null. */
  nextRequired: OnboardingItem | null;
  refresh: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    return {
      status: null,
      isLoading: true,
      isComplete: false,
      items: ONBOARDING_ITEMS,
      nextRequired: null,
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
    items: ONBOARDING_ITEMS,
    nextRequired: status ? firstIncompleteRequired(status) : null,
    refresh,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
