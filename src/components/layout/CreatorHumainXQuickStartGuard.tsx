'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';
import { UserRole, normalizeUserRole } from '@/lib/roles';
import { creatorProfileApi } from '@/lib/api-creator-profile';
import {
  isQuickStartComplete,
  getFirstIncompleteStep,
} from '@/lib/humainx-quick-start';

export interface CreatorHumainXQuickStartGuardProps {
  children: React.ReactNode;
}

export default function CreatorHumainXQuickStartGuard({
  children,
}: CreatorHumainXQuickStartGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const userRole = user?.role ? normalizeUserRole(user.role) : null;
  const isCreator = userRole === UserRole.CREATOR;

  // Query canonical profile via existing endpoint
  const {
    data: profile,
    isLoading: isProfileLoading,
    isFetched,
  } = useQuery({
    queryKey: ['creator', 'my-profile'],
    queryFn: () => creatorProfileApi.getMyProfile(),
    enabled: Boolean(isAuthenticated && isCreator && user?.onboardingPhase !== 0),
    staleTime: 30_000,
  });

  const isHumainXRoute = pathname.startsWith('/dashboard/creator/humainx');
  const isComplete = profile ? isQuickStartComplete(profile) : false;
  const firstIncompleteStep = profile ? getFirstIncompleteStep(profile) ?? 1 : 1;

  useEffect(() => {
    // 1. Wait until auth and profile hydration settle
    if (isAuthLoading) return;
    if (!isAuthenticated || !user) return;
    if (!isCreator) return;
    if (user.onboardingPhase === 0) return; // Managed by universal onboarding
    if (isProfileLoading || !isFetched) return; // Prevent premature redirection

    // 2. Incomplete creator attempting to access Creator Dashboard or child routes
    if (!isComplete && !isHumainXRoute) {
      router.replace(`/dashboard/creator/humainx?step=${firstIncompleteStep}`);
      return;
    }

    // 3. Completed creator attempting to access HumainX Quick Start gate
    if (isComplete && isHumainXRoute) {
      router.replace('/dashboard/creator');
      return;
    }
  }, [
    isAuthLoading,
    isAuthenticated,
    isCreator,
    user,
    isProfileLoading,
    isFetched,
    isComplete,
    isHumainXRoute,
    firstIncompleteStep,
    router,
  ]);

  // Non-creators or unauthenticated/onboarding users pass through to their respective guards
  if (!isCreator || (user && user.onboardingPhase === 0)) {
    return <>{children}</>;
  }

  // Show clean loader during profile verification for creators
  if (isAuthLoading || isProfileLoading || !isFetched) {
    return (
      <div
        data-testid="humainx-guard-loading"
        className="min-h-[calc(100vh-140px)] flex items-center justify-center text-muted-foreground bg-background"
      >
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-primary" />
        <span>Checking HumainX profile…</span>
      </div>
    );
  }

  // Prevent flash of protected dashboard if incomplete
  if (!isComplete && !isHumainXRoute) {
    return (
      <div
        data-testid="humainx-guard-redirecting"
        className="min-h-[calc(100vh-140px)] flex items-center justify-center text-muted-foreground bg-background"
      >
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-primary" />
        <span>Redirecting to HumainX Quick Start…</span>
      </div>
    );
  }

  // Prevent flash of HumainX route if already complete
  if (isComplete && isHumainXRoute) {
    return (
      <div
        data-testid="humainx-guard-redirecting-dashboard"
        className="min-h-[calc(100vh-140px)] flex items-center justify-center text-muted-foreground bg-background"
      >
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-primary" />
        <span>Redirecting to Creator Dashboard…</span>
      </div>
    );
  }

  return <>{children}</>;
}
