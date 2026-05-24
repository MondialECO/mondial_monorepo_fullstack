'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  EntrepreneurProgress,
  PhaseNumber,
  StepNumber,
} from '@/types/entrepreneur';
import {
  INITIAL_PROGRESS,
  getProgressStorageKey,
  canMoveToNextStep,
  isStepComplete,
  getPhaseProgress,
  getPhaseConfig,
} from '@/lib/entrepreneur';
import entrepreneurApi, {
  CompanyProgressResponse,
} from '@/lib/api-entrepreneur';

const SAVE_DEBOUNCE_MS = 500;

// Local-only drafts persisted to localStorage. Backend phase authority
// (currentPhase / completedPhases / companyId) is NEVER persisted locally —
// the RouteGuard reads it only from backend response.
interface PersistedDraft {
  currentStep: StepNumber;
  completedSteps: string[];
  phaseData: Record<string, unknown>;
  lastUpdated: number;
}

function serializeDraft(progress: EntrepreneurProgress): string {
  const draft: PersistedDraft = {
    currentStep: progress.currentStep,
    completedSteps: Array.from(progress.completedSteps),
    phaseData: progress.phaseData,
    lastUpdated: Date.now(),
  };
  return JSON.stringify(draft);
}

function loadDraft(): Partial<PersistedDraft> | null {
  try {
    const raw = localStorage.getItem(getProgressStorageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedDraft>;
    return parsed;
  } catch {
    return null;
  }
}

export function useEntrepreneurProgressState() {
  const [progress, setProgress] = useState<EntrepreneurProgress>(() => ({
    ...INITIAL_PROGRESS,
    lastUpdated: Date.now(),
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [backendFetchFailed, setBackendFetchFailed] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Apply backend response as the authoritative source for phase progression.
  const applyBackendResponse = useCallback(
    (serverProgress: CompanyProgressResponse) => {
      setProgress((prev) => {
        const currentPhase = Math.min(
          10,
          Math.max(1, serverProgress.currentPhase)
        ) as PhaseNumber;
        const phaseConfig = getPhaseConfig(currentPhase);

        const completedPhases = new Set<PhaseNumber>(
          (serverProgress.completedPhases || [])
            .filter((phase) => phase >= 1 && phase <= 10)
            .map((phase) => phase as PhaseNumber)
        );

        // Within-phase step state stays local; reset to 1 when phase changes.
        const safeStep = phaseConfig.hasSteps
          ? (Math.min(
              prev.currentPhase === currentPhase ? prev.currentStep : 1,
              phaseConfig.stepCount || 1
            ) as StepNumber)
          : (1 as StepNumber);

        return {
          ...prev,
          currentPhase,
          currentStep: safeStep,
          completedPhases,
          trustScore: Math.max(0, serverProgress.trustScore || 0),
          lastUpdated: Date.now(),
          phaseData: {
            ...prev.phaseData,
            __companyId: serverProgress.companyId,
          },
        };
      });
    },
    []
  );

  const refreshFromBackend = useCallback(async (): Promise<boolean> => {
    try {
      const serverProgress = await entrepreneurApi.getCurrentPhase();
      if (
        !serverProgress ||
        typeof serverProgress.currentPhase !== 'number'
      ) {
        setBackendFetchFailed(true);
        return false;
      }
      applyBackendResponse(serverProgress);
      setBackendFetchFailed(false);
      return true;
    } catch (error) {
      console.error('Failed to fetch entrepreneur progress from backend:', error);
      setBackendFetchFailed(true);
      return false;
    }
  }, [applyBackendResponse]);

  // Initial backend sync + draft hydration.
  useEffect(() => {
    if (!isHydrated) return;
    let cancelled = false;

    (async () => {
      // Hydrate UI-only drafts first (step / phaseData) so the user sees
      // their in-progress form values. This NEVER affects currentPhase or
      // completedPhases — those are backend-only.
      const draft = loadDraft();
      if (draft) {
        setProgress((prev) => ({
          ...prev,
          currentStep:
            typeof draft.currentStep === 'number'
              ? (draft.currentStep as StepNumber)
              : prev.currentStep,
          completedSteps: Array.isArray(draft.completedSteps)
            ? new Set(draft.completedSteps as string[])
            : prev.completedSteps,
          phaseData:
            draft.phaseData && typeof draft.phaseData === 'object'
              ? { ...prev.phaseData, ...draft.phaseData }
              : prev.phaseData,
        }));
      }

      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      await refreshFromBackend();
      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, refreshFromBackend]);

  // Persist drafts only (NOT backend authority fields) with debounce.
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(getProgressStorageKey(), serializeDraft(progress));
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [progress]);

  const completeStep = useCallback(
    (phase: PhaseNumber, step: StepNumber) => {
      setProgress((prev) => {
        const stepId = `${phase}-${step}`;
        if (prev.completedSteps.has(stepId)) return prev;
        const newSteps = new Set(prev.completedSteps);
        newSteps.add(stepId);
        return { ...prev, completedSteps: newSteps };
      });
    },
    []
  );

  // WITHIN-PHASE step advancement only. Cross-phase advancement is the
  // exclusive responsibility of the backend (via advancePhase + applyBackendResponse).
  const moveToNextStep = useCallback(
    (phase?: PhaseNumber, currentStep?: StepNumber): boolean => {
      let advanced = false;
      setProgress((prev) => {
        const targetPhase = phase || prev.currentPhase;
        const targetStep = currentStep || prev.currentStep;

        const canMove = canMoveToNextStep(
          targetPhase,
          targetStep,
          prev.completedSteps
        );
        if (!canMove) return prev;

        const config = getPhaseConfig(targetPhase);
        if (!config.hasSteps) return prev;

        const stepId = `${targetPhase}-${targetStep}`;
        const nextStep = (targetStep + 1) as StepNumber;

        // If we're at the last step, do NOT advance the phase locally.
        // The backend's advancePhase call drives that, then applyBackendResponse
        // updates currentPhase/completedPhases.
        if (nextStep > (config.stepCount || 4)) {
          const newSteps = new Set(prev.completedSteps);
          newSteps.add(stepId);
          advanced = true;
          return { ...prev, completedSteps: newSteps };
        }

        const newSteps = new Set(prev.completedSteps);
        newSteps.add(stepId);
        advanced = true;
        return {
          ...prev,
          completedSteps: newSteps,
          currentStep: nextStep,
        };
      });
      return advanced;
    },
    []
  );

  const moveToStep = useCallback(
    (phase: PhaseNumber, step: StepNumber): boolean => {
      let moved = false;
      setProgress((prev) => {
        const config = getPhaseConfig(phase);
        if (config.hasSteps && step > (config.stepCount || 4)) return prev;

        const isPhaseCompleted = prev.completedPhases.has(phase);
        const isCurrentPhase = phase === prev.currentPhase;
        if (!isPhaseCompleted && !isCurrentPhase) return prev;

        if (phase === prev.currentPhase && step > prev.currentStep + 1) {
          return prev;
        }

        moved = true;
        return { ...prev, currentStep: step };
      });
      return moved;
    },
    []
  );

  const savePhaseData = useCallback(
    (phase: PhaseNumber, data: unknown) => {
      setProgress((prev) => ({
        ...prev,
        phaseData: {
          ...prev.phaseData,
          [phase]: data,
        },
      }));
    },
    []
  );

  function getPhaseData<T = unknown>(phase: PhaseNumber): T | undefined {
    return progress?.phaseData[phase] as T | undefined;
  }

  const resetProgress = useCallback(() => {
    setProgress(INITIAL_PROGRESS);
  }, []);

  return {
    // State
    progress,
    isLoading,
    backendFetchFailed,
    currentPhase: progress?.currentPhase,
    currentStep: progress?.currentStep,
    trustScore: progress?.trustScore ?? 0,

    // Queries
    isStepComplete: (phase: PhaseNumber, step: StepNumber) =>
      progress ? isStepComplete(phase, step, progress.completedSteps) : false,
    getPhaseProgress: (phase: PhaseNumber) =>
      progress ? getPhaseProgress(phase, progress.completedSteps) : 0,
    canMoveToNextStep: (phase: PhaseNumber, step: StepNumber) =>
      progress ? canMoveToNextStep(phase, step, progress.completedSteps) : false,

    // Mutations
    completeStep,
    moveToNextStep,
    moveToStep,
    savePhaseData,
    getPhaseData,
    resetProgress,

    // Backend authority
    applyBackendResponse,
    refreshFromBackend,
  };
}
