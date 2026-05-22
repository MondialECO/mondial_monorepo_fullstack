"use client";

import { useAuth } from "@/app/_providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  normalizeUserRole,
  ROLE_DASHBOARD_ROUTES,
  UserRole,
} from "@/lib/roles";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    // Check role-based access control
    if (!isLoading && user && pathname.includes('/dashboard')) {
      // Extract role from path: /dashboard/creator -> creator
      const pathParts = pathname.split('/');
      const routeRole = pathParts[2]; // /dashboard/[role]/...

      if (!routeRole) return; // Root dashboard, allow all

      const userRole = normalizeUserRole(user.role);
      const userDashboard = ROLE_DASHBOARD_ROUTES[userRole];
      const normalizedRouteRole = routeRole.toLowerCase();
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
      if (userRole === UserRole.ADMIN && ['admin', 'settings'].includes(normalizedRouteRole)) {
        return;
      }

      const mappedRouteRole = routeRoleMap[normalizedRouteRole];

      if (!mappedRouteRole) return;
      if (mappedRouteRole === userRole) return;

      router.push(userDashboard);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
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
