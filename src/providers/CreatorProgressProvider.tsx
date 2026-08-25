'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useCreatorProgressState, type HydrateResult } from '@/hooks/useCreatorProgressState';
import type { CreatorJourneyData, CreatorOutputKey, CreatorProject } from '@/types/creator/creator-journey';

interface CreatorProgressContextType {
  state: CreatorJourneyData;
  setState: React.Dispatch<React.SetStateAction<CreatorJourneyData>>;
  isLoading: boolean;
  error: Error | null;
  updateProject: (fields: Partial<CreatorProject>) => void;
  saveOutputVersion: (outputKey: CreatorOutputKey, payload: Record<string, unknown>) => void;
  completeStep: (phaseNum: number, stepNum: number) => void;
  setEntryPath: (path: 'already_have_idea' | null) => void;
  setCrossroadsPath: (path: 'sell' | 'build' | null) => Promise<boolean>;
  advancePhase: (phaseNum: number) => void;
  resetJourney: () => void;
  /** Resolves with the hydration outcome — navigation-after-refetch MUST check it. */
  refetch: (ideaId?: string | null) => Promise<HydrateResult>;
}

const CreatorProgressContext = createContext<CreatorProgressContextType | undefined>(undefined);

export function CreatorProgressProvider({ children }: { children: ReactNode }) {
  const progressState = useCreatorProgressState();

  return (
    <CreatorProgressContext.Provider value={progressState}>
      {children}
    </CreatorProgressContext.Provider>
  );
}

export function useCreatorProgress() {
  const context = useContext(CreatorProgressContext);
  if (context === undefined) {
    throw new Error('useCreatorProgress must be used within a CreatorProgressProvider');
  }
  return context;
}
export default CreatorProgressProvider;
