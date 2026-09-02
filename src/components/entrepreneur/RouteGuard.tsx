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
  const {
    progress,
    isLoading,
    backendFetchFailed,
    activeCompanyId,
    switchCompany,
    isSwitching,
  } = useEntrepreneurProgress();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Check URL query param ?companyId=... for deep-link activation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const targetCid = urlParams.get('companyId');
    if (targetCid && targetCid !== activeCompanyId && !isSwitching) {
      switchCompany(targetCid);
    }
  }, [pathname, activeCompanyId, isSwitching, switchCompany]);

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

    // Check if a specific company is requested via URL and we are still activating it
    let urlTargetCompanyId: string | null = null;
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      urlTargetCompanyId = sp.get('companyId');
    }

    if (urlTargetCompanyId && urlTargetCompanyId !== activeCompanyId) {
      setIsAuthorized(null);
      return;
    }

    // FAIL CLOSED: If backend fetch failed, do not unlock routes from cached progress
    if (!isLoading && backendFetchFailed) {
      setIsAuthorized(false);
      console.warn('Backend entrepreneur progress fetch failed; preventing route access');
      router.replace('/dashboard/entrepreneur/phase-1');
      return;
    }

    if (isLoading || isSwitching || !progress) {
      setIsAuthorized(null);
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

    // AUTHORIZATION ONLY FROM BACKEND COMPANY PROGRESS.
    // progress.currentPhase / progress.completedPhases are written ONLY by
    // applyBackendResponse in useEntrepreneurProgressState (initial sync +
    // advancePhase response). They are NOT persisted to localStorage and are
    // NOT mutated by local moveToNextStep.
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

      // For steps in current phase or accessible Phase 2 / completed phase: allow current step and completed steps only
      if (pathPhase === progress.currentPhase || isPhase2Available || isPhaseCompleted) {
        const isStepCompleted = !!progress.completedSteps?.has(`${pathPhase}-${pathStep}`);
        const isCurrent =
          pathStep === progress.currentStep ||
          (pathStep === 1 && !progress.completedSteps?.has(`${pathPhase}-1`));

        if (!isStepCompleted && !isCurrent) {
          // Trying to access a locked step - redirect to current step or step 1
          const fallbackStep =
            pathPhase === progress.currentPhase
              ? progress.currentStep
              : 1;
          setIsAuthorized(false);
          router.replace(
            `/dashboard/entrepreneur/phase-${pathPhase}/step-${fallbackStep}`
          );
          return;
        }
      } else if (pathStep !== 1) {
        // For phases other than current phase, only allow step 1
        setIsAuthorized(false);
        router.replace(`/dashboard/entrepreneur/phase-${pathPhase}/step-1`);
        return;
      }
    }

    // All checks passed
    setIsAuthorized(true);
  }, [isLoading, progress, pathname, router, backendFetchFailed, user?.onboardingPhase]);

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
