"use client";

import { useAuth } from "@/app/_providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

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

      // Normalize roles for comparison
      const userRole = user.role.toLowerCase();
      const normalizedRouteRole = routeRole.toLowerCase();

      // Admin can access admin routes and settings
      if (userRole === 'admin' && ['admin', 'settings'].includes(normalizedRouteRole)) {
        return; // Allow admin access
      }

      // Other users must have their role match the route exactly
      if (userRole === normalizedRouteRole) {
        return; // Role matches, allow access
      }

      // Role mismatch - redirect to user's own dashboard
      const userDashboard = `/dashboard/${userRole}`;
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
