"use client";

import { useAuth } from "@/app/_providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  ROLE_DASHBOARD_ROUTES,
  UserRole,
} from "@/lib/roles";

function getDashboardRoute(userRole: string): string {
  return ROLE_DASHBOARD_ROUTES[userRole as UserRole];
}

function normalizePathRole(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  if (!match) return null;

  const pathRole = match[1];
  const lowercaseRole = pathRole.toLowerCase().replace(/[\s_-]/g, "");

  const roleMap: Record<string, string> = {
    entrepreneur: "entrepreneur",
    investor: "investor",
    creator: "creator",
    admin: "admin",
    advisor: "advisor",
    founder: "founder",
    serviceprovider: "serviceprovider",
  };

  return roleMap[lowercaseRole] || null;
}

// Real phase-1 pages that exist
const VALID_PHASE_1_PATHS = new Set([
  "/dashboard/entrepreneur/phase-1",
  "/dashboard/creator/phase-1",
  "/dashboard/investor/phase-1",
  "/dashboard/serviceprovider/phase-1",
]);

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isBackendVerified } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isBackendVerified || !user) {
      router.push("/login");
      return;
    }

    if (!pathname.includes('/dashboard')) return;

    // Fix uppercase role routes (e.g., /dashboard/Entrepreneur -> /dashboard/entrepreneur)
    const pathRole = pathname.split('/')[2];
    if (pathRole && pathRole !== pathRole.toLowerCase()) {
      const normalizedRole = normalizePathRole(pathname);
      if (normalizedRole) {
        const rest = pathname.slice(`/dashboard/${pathRole}`.length);
        router.replace(`/dashboard/${normalizedRole}${rest}`);
        return;
      }
    }

    const userRole = user.role;
    const onboardingPhase = user.onboardingPhase ?? 0;

    // UNIVERSAL PHASE 1 GATE: If incomplete, redirect to phase-1 (unless already there)
    if (onboardingPhase === 0) {
      // Already on a valid phase-1 page, allow it
      if (VALID_PHASE_1_PATHS.has(pathname)) {
        return;
      }

      // Redirect to the user's role-specific phase-1
      const dashboardRoute = getDashboardRoute(user.role);
      router.push(`${dashboardRoute}/phase-1`);
      return;
    }

    // Phase 1 complete, enforce role-based access control
    const userDashboard = ROLE_DASHBOARD_ROUTES[userRole];
    const normalizedRouteRole = pathRole?.toLowerCase();
    const routeRoleMap: Record<string, UserRole> = {
      admin: UserRole.ADMIN,
      creator: UserRole.CREATOR,
      investor: UserRole.INVESTOR,
      entrepreneur: UserRole.ENTREPRENEUR,
      advisor: UserRole.ADVISOR,
      founder: UserRole.FOUNDER,
      serviceprovider: UserRole.SERVICE_PROVIDER,
      'service-provider': UserRole.SERVICE_PROVIDER,
      service_provider: UserRole.SERVICE_PROVIDER,
    };

    // Admin can access admin routes and settings
    if (userRole === UserRole.ADMIN && normalizedRouteRole && ['admin', 'settings'].includes(normalizedRouteRole)) {
      return;
    }

    const mappedRouteRole = normalizedRouteRole ? routeRoleMap[normalizedRouteRole] : null;

    if (!mappedRouteRole) return; // Unknown route, let it pass
    if (mappedRouteRole === userRole) return; // Correct role, allow

    // Wrong role, redirect to user's dashboard
    router.push(userDashboard);
  }, [user, isLoading, isBackendVerified, router, pathname]);

  if (isLoading || !isBackendVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
