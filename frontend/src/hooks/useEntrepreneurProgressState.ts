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

const SAVE_DEBOUNCE_MS = 500;

export function useEntrepreneurProgressState() {
  const [progress, setProgress] = useState<EntrepreneurProgress>(() => {
    // Initialize with safe default - never null
    const stored = typeof window !== 'undefined' ? localStorage.getItem(getProgressStorageKey()) : null;
    if (stored) {
      try {
        return deserializeProgress(stored);
      } catch (error) {
        console.error('Failed to load progress:', error);
        return { ...INITIAL_PROGRESS, lastUpdated: Date.now() };
      }
    }
    return { ...INITIAL_PROGRESS, lastUpdated: Date.now() };
  });
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Mark as hydrated after mount
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Save to localStorage with debounce
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const serialized = serializeProgress(progress);
        console.log('[PROGRESS SAVE] Saving to localStorage:', {
          currentPhase: progress.currentPhase,
          currentStep: progress.currentStep,
          completedSteps: Array.from(progress.completedSteps),
        });
        localStorage.setItem(getProgressStorageKey(), serialized);
        console.log('[PROGRESS SAVE] Saved successfully');
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

        console.log('[moveToNextStep] Called with:', { phase, currentStep, targetPhase, targetStep });
        console.log('[moveToNextStep] Current progress:', {
          currentPhase: prev.currentPhase,
          currentStep: prev.currentStep,
          completedSteps: Array.from(prev.completedSteps),
        });

        // Check if we can move to next step
        const canMove = canMoveToNextStep(targetPhase, targetStep, prev.completedSteps);
        console.log('[moveToNextStep] canMoveToNextStep result:', canMove);
        if (!canMove) {
          console.warn('[moveToNextStep] Cannot move to next step');
          return prev;
        }

        const nextStep = (targetStep + 1) as StepNumber;
        const config = getPhaseConfig(targetPhase);
        const stepId = `${targetPhase}-${targetStep}`;

        console.log('[moveToNextStep] Moving to:', { nextStep, stepId });

        // Check if phase is complete
        if (config.hasSteps && nextStep > (config.stepCount || 4)) {
          // Phase complete, move to next phase
          const nextPhase = getNextPhase(targetPhase);
          console.log('[moveToNextStep] Phase complete, moving to next phase:', nextPhase);
          if (nextPhase) {
            const newSteps = new Set(prev.completedSteps);
            newSteps.add(stepId);
            const newPhases = new Set(prev.completedPhases);
            newPhases.add(targetPhase);
            console.log('[moveToNextStep] setState (phase complete):', {
              completedSteps: Array.from(newSteps),
              currentPhase: nextPhase,
              currentStep: 1,
              completedPhases: Array.from(newPhases),
            });
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

        // Move to next step - complete current step and update current step in one setState
        const newSteps = new Set(prev.completedSteps);
        newSteps.add(stepId);
        console.log('[moveToNextStep] setState (step):', {
          completedSteps: Array.from(newSteps),
          currentStep: nextStep,
        });
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
