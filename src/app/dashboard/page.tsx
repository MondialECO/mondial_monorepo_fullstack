'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import {
  DEFAULT_USER_ROLE,
  normalizeUserRole,
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

    const role = normalizeUserRole(user.role);
    router.replace(ROLE_DASHBOARD_ROUTES[role] ?? ROLE_DASHBOARD_ROUTES[DEFAULT_USER_ROLE]);
  }, [isLoading, user, router]);

  return null;
}
