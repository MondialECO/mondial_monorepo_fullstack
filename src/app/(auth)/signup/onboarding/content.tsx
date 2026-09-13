'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/app/_providers/AuthProvider';

export default function SignupOnboardingContent() {
  const router = useRouter();
  const { user, isLoading, isBackendVerified } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user && isBackendVerified) {
      router.replace('/onboarding');
    } else {
      router.replace('/login');
    }
  }, [user, isBackendVerified, isLoading, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Redirecting...</div>
    </div>
  );
}
