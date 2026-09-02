"use client";

import { useAuth } from "@/app/_providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  getRoleDashboardRoute,
  ROLE_DASHBOARD_ROUTES,
  UserRole,
  parseStrictUserRole,
  normalizeUserRole,
} from "@/lib/roles";

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
  "/dashboard/admin/phase-1",
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

    // Universal Phase 1 onboarding flow is reachable by any authenticated user.
    // Phase-0 users complete verification here; the onboarding hub itself owns
    // the "already complete -> /onboarding/complete" redirect (business logic).
    if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
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

    // UNIVERSAL PHASE 1 GATE: incomplete users go to the universal onboarding hub.
    if (onboardingPhase === 0) {
      // Legacy role-specific phase-1 pages still resolve (kept for back-compat;
      // not deleted in this phase).
      if (VALID_PHASE_1_PATHS.has(pathname)) {
        return;
      }

      // Redirect incomplete users to the universal onboarding hub.
      router.push("/onboarding");
      return;
    }

    const userRolesRaw = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    const parsedUserRoles = userRolesRaw
      .map((r) => parseStrictUserRole(r) ?? normalizeUserRole(r))
      .filter((r): r is UserRole => Boolean(r));
    const userDashboard = getRoleDashboardRoute(user);
    const normalizedRouteRole = pathRole?.toLowerCase();
    const routeRoleMap: Record<string, UserRole> = {
      admin: UserRole.ADMIN,
      creator: UserRole.CREATOR,
      investor: UserRole.INVESTOR,
      entrepreneur: UserRole.ENTREPRENEUR,
      serviceprovider: UserRole.SERVICE_PROVIDER,
      'service-provider': UserRole.SERVICE_PROVIDER,
      service_provider: UserRole.SERVICE_PROVIDER,
    };

    // Admin or SuperAdmin can access admin routes and settings
    if ((parsedUserRoles.includes(UserRole.ADMIN) || parsedUserRoles.includes(UserRole.SUPERADMIN)) && normalizedRouteRole && ['admin', 'settings'].includes(normalizedRouteRole)) {
      return;
    }

    const mappedRouteRole = normalizedRouteRole ? routeRoleMap[normalizedRouteRole] : null;

    if (!mappedRouteRole) return; // Unknown or role-neutral route (e.g. /dashboard/profile), let it pass
    if (parsedUserRoles.includes(mappedRouteRole)) return; // User possesses this role, allow!

    // Wrong role, redirect to user's default dashboard
    router.push(userDashboard);
  }, [user, isLoading, isBackendVerified, router, pathname]);

  if (isLoading || !isBackendVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground dark:text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
