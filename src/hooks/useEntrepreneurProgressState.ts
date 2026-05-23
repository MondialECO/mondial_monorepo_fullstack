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
  serializeProgress,
  deserializeProgress,
  canMoveToNextStep,
  getNextPhase,
  calculateTotalTrustScore,
  isStepComplete,
  getPhaseProgress,
  getPhaseConfig,
} from '@/lib/entrepreneur';
import entrepreneurApi from '@/lib/api-entrepreneur';

const SAVE_DEBOUNCE_MS = 500;

export function useEntrepreneurProgressState() {
  const [progress, setProgress] = useState<EntrepreneurProgress>(() => {
    // Initialize with safe default - never null
    // NOTE: localStorage is UI cache only, NOT authority. Backend verification is required before unlocking routes.
    return { ...INITIAL_PROGRESS, lastUpdated: Date.now() };
  });
  const [isLoading, setIsLoading] = useState(true);
  const [backendFetchFailed, setBackendFetchFailed] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Mark as hydrated after mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Sync phase state from backend (source of truth) when available.
  useEffect(() => {
    if (!isHydrated) return;

    let cancelled = false;

    const syncFromServer = async () => {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const serverProgress = await entrepreneurApi.getCurrentPhase();
        if (cancelled) return;

        // Safety check: ensure currentPhase is valid
        if (!serverProgress || typeof serverProgress.currentPhase !== 'number') {
          console.warn('Invalid server progress response:', serverProgress);
          setBackendFetchFailed(true);
          if (!cancelled) setIsLoading(false);
          return;
        }

        setProgress((prev) => {
          const currentPhase = Math.min(
            9,
            Math.max(1, serverProgress.currentPhase)
          ) as PhaseNumber;
          const phaseConfig = getPhaseConfig(currentPhase);
          const safeStep = phaseConfig.hasSteps
            ? (Math.min(
                prev.currentPhase === currentPhase ? prev.currentStep : 1,
                phaseConfig.stepCount || 1
              ) as StepNumber)
            : (1 as StepNumber);

          const completedPhases = new Set<PhaseNumber>(
            (serverProgress.completedPhases || [])
              .filter((phase) => phase >= 1 && phase <= 9)
              .map((phase) => phase as PhaseNumber)
          );

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
        setBackendFetchFailed(false);
      } catch (error) {
        // FAIL CLOSED: Backend cannot be reached, do not unlock routes from cached progress
        console.error('Failed to fetch entrepreneur progress from backend:', error);
        setBackendFetchFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    syncFromServer();
    return () => {
      cancelled = true;
    };
  }, [isHydrated]);

  // Save to localStorage with debounce
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const serialized = serializeProgress(progress);
        localStorage.setItem(getProgressStorageKey(), serialized);
      } catch (error) {
        console.error('Failed to save progress:', error);
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
        if (!prev) return prev;

        const stepId = `${phase}-${step}`;
        if (prev.completedSteps.has(stepId)) return prev;

        const newSteps = new Set(prev.completedSteps);
        newSteps.add(stepId);
        return { ...prev, completedSteps: newSteps };
      });
    },
    []
  );

  const moveToNextStep = useCallback(
    (phase?: PhaseNumber, currentStep?: StepNumber): boolean => {
      setProgress((prev) => {
        if (!prev) return prev;

        // Use current progress if not provided
        const targetPhase = phase || prev.currentPhase;
        const targetStep = currentStep || prev.currentStep;

        // Check if we can move to next step
        const canMove = canMoveToNextStep(targetPhase, targetStep, prev.completedSteps);
        if (!canMove) {
          return prev;
        }

        const nextStep = (targetStep + 1) as StepNumber;
        const config = getPhaseConfig(targetPhase);
        const stepId = `${targetPhase}-${targetStep}`;

        // Phases without steps complete immediately on continue.
        if (!config.hasSteps) {
          // Phase complete, move to next phase
          const nextPhase = getNextPhase(targetPhase);
          if (nextPhase) {
            const newPhases = new Set(prev.completedPhases);
            newPhases.add(targetPhase);
            return {
              ...prev,
              currentPhase: nextPhase,
              currentStep: 1,
              completedPhases: newPhases,
              trustScore: calculateTotalTrustScore(newPhases),
            };
          }
          return prev;
        }

        // Check if stepped phase is complete.
        if (nextStep > (config.stepCount || 4)) {
          const nextPhase = getNextPhase(targetPhase);
          if (nextPhase) {
            const newSteps = new Set(prev.completedSteps);
            newSteps.add(stepId);
            const newPhases = new Set(prev.completedPhases);
            newPhases.add(targetPhase);
            return {
              ...prev,
              completedSteps: newSteps,
              currentPhase: nextPhase,
              currentStep: 1,
              completedPhases: newPhases,
              trustScore: calculateTotalTrustScore(newPhases),
            };
          }
          return prev;
        }

        // Move to next step - complete current step and update current step in one setState.
        const newSteps = new Set(prev.completedSteps);
        newSteps.add(stepId);
        return {
          ...prev,
          completedSteps: newSteps,
          currentStep: nextStep,
        };
      });
      return true;
    },
    []
  );

  const moveToStep = useCallback(
    (phase: PhaseNumber, step: StepNumber): boolean => {
      setProgress((prev) => {
        if (!prev) return prev;

        // Validate step range
        const config = getPhaseConfig(phase);
        if (config.hasSteps && step > (config.stepCount || 4)) {
          return prev;
        }

        // CRITICAL: Validate phase access
        // Can only move to phases that are completed or current
        const isPhaseCompleted = prev.completedPhases.has(phase);
        const isCurrentPhase = phase === prev.currentPhase;

        if (!isPhaseCompleted && !isCurrentPhase) {
          // Trying to jump to a locked phase - DENIED
          return prev;
        }

        // Within current phase: can only move to currentStep + 1
        if (phase === prev.currentPhase) {
          if (step > prev.currentStep + 1) {
            return prev;
          }
        } else if (isPhaseCompleted) {
          // In completed phase: can access any step
          // (but still enforce step bounds check above)
        }

        return {
          ...prev,
          currentPhase: phase,
          currentStep: step,
        };
      });
      return true;
    },
    []
  );

  const savePhaseData = useCallback(
    (phase: PhaseNumber, data: unknown) => {
      setProgress((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          phaseData: {
            ...prev.phaseData,
            [phase]: data,
          },
        };
      });
    },
    []
  );

  const getPhaseData = useCallback(
    (phase: PhaseNumber) => {
      return progress?.phaseData[phase];
    },
    [progress]
  );

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
  };
}
