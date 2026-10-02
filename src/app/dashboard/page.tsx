'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import Image from 'next/image';
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
        <div className="relative w-[95px] h-[46px] p-1 flex items-center justify-center overflow-hidden">
          <Image
            src="/images/mbc-logo.png"
            alt="Mondial Logo"
            width={95}
            height={46}
            className="object-contain w-full h-full"
            priority
          />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm font-medium">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
