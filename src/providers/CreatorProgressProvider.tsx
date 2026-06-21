'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useCreatorProgressState } from '@/hooks/useCreatorProgressState';
import type { CreatorDocument, CreatorJourneyData, CreatorOutputKey, CreatorProject } from '@/types/creator/creator-journey';

interface CreatorProgressContextType {
  state: CreatorJourneyData;
  setState: React.Dispatch<React.SetStateAction<CreatorJourneyData>>;
  isLoading: boolean;
  updateProject: (fields: Partial<CreatorProject>) => void;
  saveOutputVersion: (outputKey: CreatorOutputKey, payload: Record<string, unknown>) => void;
  upsertDocument: (document: Omit<CreatorDocument, 'createdAt'> & { createdAt?: string }) => void;
  completeStep: (phaseNum: number, stepNum: number) => void;
  setEntryPath: (path: 'already_have_idea' | 'needs_discovery' | null) => void;
  setCrossroadsPath: (path: 'buyout' | 'build' | null) => void;
  advancePhase: (phaseNum: number) => void;
  resetJourney: () => void;
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
