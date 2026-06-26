'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';

export default function CreatorPhaseGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, isLoading } = useCreatorProgress();
  const { journeyState } = state;
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Enforce the Route-to-Phase Access Matrix
    if (pathname.includes('/dashboard/creator/phase-2') && journeyState.phase2.status === 'locked') {
      router.replace('/dashboard/creator');
      return;
    }

    if (pathname.includes('/dashboard/creator/phase-3') && journeyState.phase3.status === 'locked') {
      router.replace('/dashboard/creator');
      return;
    }

    if (pathname.includes('/dashboard/creator/offer-pricing') && journeyState.phase4.status === 'locked') {
      router.replace('/dashboard/creator');
      return;
    }

    if (pathname.includes('/dashboard/creator/crossroads') && journeyState.phase5.status === 'locked') {
      router.replace('/dashboard/creator');
      return;
    }

    if (pathname.includes('/dashboard/creator/investors') && journeyState.phase6.status === 'locked') {
      router.replace('/dashboard/creator');
      return;
    }

    setIsAuthorized(true);
  }, [pathname, journeyState, isLoading, router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center text-muted-foreground bg-background">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-primary" />
        Checking phase credentials…
      </div>
    );
  }

  return <>{children}</>;
}
