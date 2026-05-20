'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { PhaseNumber, StepNumber } from '@/types/entrepreneur';
import { getPhaseConfig } from '@/lib/entrepreneur';

interface RouteGuardProps {
  requiredPhase?: PhaseNumber;
  requiredStep?: StepNumber;
  children: React.ReactNode;
}

export function RouteGuard({
  requiredPhase,
  requiredStep,
  children,
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { progress, isLoading } = useEntrepreneurProgress();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Dev mode: set to true to allow all steps without restrictions
  const DEV_MODE_UNLOCK_ALL_STEPS = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    if (isLoading || !progress) {
      setIsAuthorized(null);
      return;
    }

    // In dev mode, allow all routes
    if (DEV_MODE_UNLOCK_ALL_STEPS) {
      setIsAuthorized(true);
      return;
    }

    // Determine what phase/step we're trying to access
    const pathMatch = pathname.match(
      /\/dashboard\/entrepreneur\/(phase-(\d+))(?:\/step-(\d+))?/
    );

    if (!pathMatch) {
      setIsAuthorized(true);
      return;
    }

    const pathPhase = parseInt(pathMatch[2]) as PhaseNumber;
    const pathStep = pathMatch[3] ? (parseInt(pathMatch[3]) as StepNumber) : undefined;

    // Check if phase is locked
    const isPhaseCompleted = progress.completedPhases.has(pathPhase);
    const isPhaseActive = progress.currentPhase === pathPhase;
    const isPhaseAccessible = isPhaseCompleted || isPhaseActive;

    // If trying to access a locked phase, redirect to current phase
    if (!isPhaseAccessible) {
      setIsAuthorized(false);
      router.replace(
        `/dashboard/entrepreneur/phase-${progress.currentPhase}${
          getPhaseConfig(progress.currentPhase).hasSteps
            ? `/step-${progress.currentStep}`
            : ''
        }`
      );
      return;
    }

    // For phases with steps, check step access
    if (pathStep) {
      const phaseConfig = getPhaseConfig(pathPhase);
      if (!phaseConfig.hasSteps) {
        // Trying to access a step in a phase that doesn't have steps
        setIsAuthorized(false);
        router.replace(`/dashboard/entrepreneur/phase-${pathPhase}`);
        return;
      }

      // Check if step is locked (can access current, previous, or next step if previous is completed)
      if (pathPhase === progress.currentPhase) {
        const isStepCompleted = progress.completedSteps.has(`${pathPhase}-${pathStep}`);
        const isCurrent = pathStep === progress.currentStep;
        const isPrevious = pathStep < progress.currentStep;
        const isNextAfterCompleted = pathStep === progress.currentStep + 1 &&
          progress.completedSteps.has(`${pathPhase}-${progress.currentStep}`);

        if (!isStepCompleted && !isCurrent && !isPrevious && !isNextAfterCompleted) {
          // Trying to access a locked step - redirect to current step
          setIsAuthorized(false);
          router.replace(
            `/dashboard/entrepreneur/phase-${pathPhase}/step-${progress.currentStep}`
          );
          return;
        }
      }
    }

    // All checks passed
    setIsAuthorized(true);
  }, [isLoading, progress, pathname, router, DEV_MODE_UNLOCK_ALL_STEPS]);

  // Don't render children until authorization check is complete
  if (isLoading || isAuthorized === null) {
    return null;
  }

  if (isAuthorized === false) {
    // Redirection in progress, don't render
    return null;
  }

  return <>{children}</>;
}
