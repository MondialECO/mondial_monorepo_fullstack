'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
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
  const { user } = useAuth();
  const { progress, isLoading, backendFetchFailed } = useEntrepreneurProgress();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Dev mode: set to true to allow all steps without restrictions
  const DEV_MODE_UNLOCK_ALL_STEPS = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    // UNIVERSAL PHASE 1 GATE: Block all phases 2+ if onboarding.phase < 1
    const onboardingPhase = user?.onboardingPhase ?? 0;
    const pathPhaseMatch = pathname.match(/\/dashboard\/entrepreneur\/(phase-(\d+))/);
    const requestedPhase = pathPhaseMatch ? parseInt(pathPhaseMatch[2]) : 1;

    // If phase < 1 and trying to access phase 2+, redirect to phase-1
    if (onboardingPhase < 1 && requestedPhase > 1) {
      setIsAuthorized(false);
      router.replace('/dashboard/entrepreneur/phase-1');
      return;
    }

    // FAIL CLOSED: If backend fetch failed, do not unlock routes from cached progress
    if (!isLoading && backendFetchFailed) {
      setIsAuthorized(false);
      console.warn('Backend entrepreneur progress fetch failed; preventing route access');
      router.replace('/dashboard/entrepreneur/phase-1');
      return;
    }

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

    // Special rule for Phase 2: It's available if authPhase >= 1 (Phase 2 is where company is created)
    // Phase 2 should not be locked by company progress since company doesn't exist yet
    const isPhase2Available = pathPhase === 2 && onboardingPhase >= 1;

    const isPhaseAccessible = isPhaseCompleted || isPhaseActive || isPhase2Available;

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
  }, [isLoading, progress, pathname, router, DEV_MODE_UNLOCK_ALL_STEPS, backendFetchFailed]);

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
