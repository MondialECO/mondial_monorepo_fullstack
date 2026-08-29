'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useEntrepreneurProgressState } from '@/hooks/useEntrepreneurProgressState';
import {
  EntrepreneurProgress,
  PhaseNumber,
  StepNumber,
} from '@/types/entrepreneur';
import { CompanyProgressResponse, CompanySummaryDto } from '@/lib/api-entrepreneur';

export interface EntrepreneurProgressContextType {
  progress: EntrepreneurProgress | null;
  isLoading: boolean;
  backendFetchFailed: boolean;
  currentPhase?: PhaseNumber;
  currentStep?: StepNumber;
  trustScore: number;

  // Multi-Company Operating Context
  companies: CompanySummaryDto[];
  activeCompany: CompanySummaryDto | null;
  activeCompanyId: string | null;
  isSwitching: boolean;
  switchCompany: (companyId: string) => Promise<boolean>;
  refreshCompanies: () => Promise<void>;

  isStepComplete: (phase: PhaseNumber, step: StepNumber) => boolean;
  getPhaseProgress: (phase: PhaseNumber) => number;
  canMoveToNextStep: (phase: PhaseNumber, step: StepNumber) => boolean;

  completeStep: (phase: PhaseNumber, step: StepNumber) => void;
  moveToNextStep: (phase?: PhaseNumber, currentStep?: StepNumber) => boolean;
  moveToStep: (phase: PhaseNumber, step: StepNumber) => boolean;
  savePhaseData: (phase: PhaseNumber, data: unknown) => void;
  getPhaseData: <T = unknown>(phase: PhaseNumber) => T | undefined;
  resetProgress: () => void;

  // Backend authority
  applyBackendResponse: (serverProgress: CompanyProgressResponse) => void;
  refreshFromBackend: (explicitCompanyId?: string) => Promise<boolean>;
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
