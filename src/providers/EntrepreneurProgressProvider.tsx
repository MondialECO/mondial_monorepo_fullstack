'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useEntrepreneurProgressState } from '@/hooks/useEntrepreneurProgressState';
import { EntrepreneurProgress, PhaseNumber, StepNumber } from '@/types/entrepreneur';

interface EntrepreneurProgressContextType {
  progress: EntrepreneurProgress | null;
  isLoading: boolean;
  currentPhase?: PhaseNumber;
  currentStep?: StepNumber;
  trustScore: number;

  isStepComplete: (phase: PhaseNumber, step: StepNumber) => boolean;
  getPhaseProgress: (phase: PhaseNumber) => number;
  canMoveToNextStep: (phase: PhaseNumber, step: StepNumber) => boolean;

  completeStep: (phase: PhaseNumber, step: StepNumber) => void;
  moveToNextStep: (phase?: PhaseNumber, currentStep?: StepNumber) => boolean;
  moveToStep: (phase: PhaseNumber, step: StepNumber) => boolean;
  savePhaseData: (phase: PhaseNumber, data: unknown) => void;
  getPhaseData: (phase: PhaseNumber) => unknown;
  resetProgress: () => void;
}

const EntrepreneurProgressContext = createContext<EntrepreneurProgressContextType | undefined>(undefined);

export function EntrepreneurProgressProvider({ children }: { children: ReactNode }) {
  const progressMethods = useEntrepreneurProgressState();

  return (
    <EntrepreneurProgressContext.Provider value={progressMethods}>
      {children}
    </EntrepreneurProgressContext.Provider>
  );
}

export function useEntrepreneurProgress() {
  const context = useContext(EntrepreneurProgressContext);
  if (!context) {
    throw new Error(
      'useEntrepreneurProgress must be used within EntrepreneurProgressProvider'
    );
  }
  return context;
}
