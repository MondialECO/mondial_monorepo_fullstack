'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import {
  ROLE_DASHBOARD_ROUTES,
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

    router.replace(ROLE_DASHBOARD_ROUTES[user.role]);
  }, [isLoading, user, router]);

  return null;
}
