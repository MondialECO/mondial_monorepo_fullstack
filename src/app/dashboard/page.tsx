'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import {
  getRoleDashboardRoute,
  resolvePostLoginRedirect,
} from '@/lib/roles';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const targetRoute = resolvePostLoginRedirect(user);
    router.replace(targetRoute);
  }, [isLoading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
