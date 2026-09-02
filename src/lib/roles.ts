export enum UserRole {
  SUPERADMIN = "SuperAdmin",
  ADMIN = "Admin",
  CREATOR = "Creator",
  INVESTOR = "Investor",
  ENTREPRENEUR = "Entrepreneur",
  SERVICE_PROVIDER = "ServiceProvider",
}

export const DEFAULT_USER_ROLE = UserRole.CREATOR;

export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  [UserRole.SUPERADMIN]: "/dashboard/admin",
  [UserRole.ADMIN]: "/dashboard/admin",
  [UserRole.CREATOR]: "/dashboard/creator",
  [UserRole.INVESTOR]: "/dashboard/investor",
  [UserRole.ENTREPRENEUR]: "/dashboard/entrepreneur",
  [UserRole.SERVICE_PROVIDER]: "/dashboard/serviceprovider",
};

export function normalizeUserRole(input: unknown): UserRole {
  const raw = String(input ?? "").trim().toLowerCase().replace(/[\s_-]/g, "");

  const roleMap: Record<string, UserRole> = {
    superadmin: UserRole.SUPERADMIN,
    admin: UserRole.ADMIN,
    creator: UserRole.CREATOR,
    investor: UserRole.INVESTOR,
    entrepreneur: UserRole.ENTREPRENEUR,
    serviceprovider: UserRole.SERVICE_PROVIDER,
  };

  return roleMap[raw] ?? DEFAULT_USER_ROLE;
}

export function parseStrictUserRole(input: unknown): UserRole | null {
  if (!input || typeof input !== "string") return null;

  const raw = String(input).trim().toLowerCase().replace(/[\s_-]/g, "");

  const roleMap: Record<string, UserRole> = {
    superadmin: UserRole.SUPERADMIN,
    admin: UserRole.ADMIN,
    creator: UserRole.CREATOR,
    investor: UserRole.INVESTOR,
    entrepreneur: UserRole.ENTREPRENEUR,
    serviceprovider: UserRole.SERVICE_PROVIDER,
  };

  return roleMap[raw] ?? null;
}

export function resolvePrimaryRole(roles: unknown): UserRole | null {
  if (!roles) return null;
  const list = Array.isArray(roles) ? roles : [roles];
  const parsedRoles = list.map((r) => parseStrictUserRole(r)).filter((r): r is UserRole => r !== null);
  if (parsedRoles.length === 0) return null;

  const priority = [
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.ENTREPRENEUR,
    UserRole.INVESTOR,
    UserRole.SERVICE_PROVIDER,
    UserRole.CREATOR,
  ];

  for (const role of priority) {
    if (parsedRoles.includes(role)) return role;
  }

  return parsedRoles[0];
}

export function isAdmin(user?: { role?: unknown; roles?: unknown } | null): boolean {
  if (!user) return false;
  const list = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : user.role ? [user.role] : [];
  return list.some(r => {
    const normalized = String(r).toLowerCase().replace(/[\s_-]/g, "");
    return normalized === "admin" || normalized === "superadmin";
  });
}

export function isSuperAdmin(user?: { role?: unknown; roles?: unknown } | null): boolean {
  if (!user) return false;
  const list = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : user.role ? [user.role] : [];
  return list.some(r => {
    const normalized = String(r).toLowerCase().replace(/[\s_-]/g, "");
    return normalized === "superadmin";
  });
}

export function getRoleDashboardRoute(roleOrUser?: unknown): string {
  if (!roleOrUser) return ROLE_DASHBOARD_ROUTES[DEFAULT_USER_ROLE];

  // If passed a user object with role/roles
  if (typeof roleOrUser === "object" && roleOrUser !== null) {
    const u = roleOrUser as { role?: unknown; roles?: unknown };
    const primary = resolvePrimaryRole(u.roles) ?? parseStrictUserRole(u.role) ?? normalizeUserRole(u.role);
    return ROLE_DASHBOARD_ROUTES[primary] || ROLE_DASHBOARD_ROUTES[DEFAULT_USER_ROLE];
  }

  const normRole = normalizeUserRole(roleOrUser);
  return ROLE_DASHBOARD_ROUTES[normRole] || ROLE_DASHBOARD_ROUTES[DEFAULT_USER_ROLE];
}

export function isValidDashboardRouteForUser(
  user?: { role?: unknown; roles?: unknown } | null,
  path?: string | null
): boolean {
  if (!path || typeof path !== "string") return false;
  const trimmed = path.trim();

  // Prevent open redirect or protocol-relative URLs
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) {
    return false;
  }

  // Auth routes must not be redirect targets
  if (
    trimmed === "/login" ||
    trimmed.startsWith("/login?") ||
    trimmed === "/signup" ||
    trimmed.startsWith("/signup?") ||
    trimmed.startsWith("/(auth)")
  ) {
    return false;
  }

  // Safe common authenticated paths
  if (trimmed === "/onboarding" || trimmed.startsWith("/onboarding/")) return true;
  if (trimmed === "/dashboard/profile" || trimmed.startsWith("/dashboard/profile/")) return true;
  if (trimmed === "/dashboard/privacy" || trimmed.startsWith("/dashboard/privacy/")) return true;

  if (!trimmed.startsWith("/dashboard")) {
    // Other safe internal relative paths
    return trimmed.startsWith("/marketplace") || trimmed.startsWith("/create-project") || trimmed.startsWith("/profile/");
  }

  if (trimmed === "/dashboard") return true;

  if (!user) return false;

  const userRolesList = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : user.role ? [user.role] : [];
  const parsedRoles = userRolesList
    .map((r) => parseStrictUserRole(r) ?? normalizeUserRole(r))
    .filter((r): r is UserRole => Boolean(r));

  const isSuper = isSuperAdmin(user);
  const isAdm = isAdmin(user);

  // Admin routes check
  if (
    trimmed === "/dashboard/admin" ||
    trimmed.startsWith("/dashboard/admin/") ||
    trimmed === "/dashboard/superadmin" ||
    trimmed.startsWith("/dashboard/superadmin/")
  ) {
    if (trimmed.startsWith("/dashboard/admin/security") || trimmed.startsWith("/dashboard/admin/system")) {
      return isSuper;
    }
    return isAdm || isSuper;
  }

  // Role module checks
  if (trimmed === "/dashboard/creator" || trimmed.startsWith("/dashboard/creator/")) {
    return parsedRoles.includes(UserRole.CREATOR) || isAdm;
  }
  if (trimmed === "/dashboard/entrepreneur" || trimmed.startsWith("/dashboard/entrepreneur/")) {
    return parsedRoles.includes(UserRole.ENTREPRENEUR) || isAdm;
  }
  if (trimmed === "/dashboard/investor" || trimmed.startsWith("/dashboard/investor/")) {
    return parsedRoles.includes(UserRole.INVESTOR) || isAdm;
  }
  if (
    trimmed === "/dashboard/serviceprovider" ||
    trimmed.startsWith("/dashboard/serviceprovider/") ||
    trimmed === "/dashboard/service-provider" ||
    trimmed.startsWith("/dashboard/service-provider/")
  ) {
    return parsedRoles.includes(UserRole.SERVICE_PROVIDER) || isAdm;
  }

  // Any other unrecognized /dashboard subpath does not exist -> reject
  return false;
}

export function resolvePostLoginRedirect(
  user?: { role?: unknown; roles?: unknown; onboardingPhase?: number } | null,
  callbackUrl?: string | null
): string {
  if (!user) return "/login";

  // Universal Phase 1 onboarding gate
  if ((user.onboardingPhase ?? 0) < 1) {
    return "/onboarding";
  }

  // If valid authorized callbackUrl provided
  if (callbackUrl && isValidDashboardRouteForUser(user, callbackUrl)) {
    // Normalize deprecated/alias paths to their canonical filesystem routes
    if (callbackUrl === "/dashboard/superadmin" || callbackUrl.startsWith("/dashboard/superadmin/")) {
      return callbackUrl.replace("/dashboard/superadmin", "/dashboard/admin");
    }
    if (callbackUrl.startsWith("/dashboard/service-provider")) {
      return callbackUrl.replace("/dashboard/service-provider", "/dashboard/serviceprovider");
    }
    return callbackUrl;
  }

  return getRoleDashboardRoute(user);
}

export function getNotificationRouteForRole(role?: unknown, pathname?: string): string {
  // If active pathname provides a clear dashboard context, use it
  if (pathname?.startsWith("/dashboard/creator")) return "/dashboard/creator/notifications";
  if (pathname?.startsWith("/dashboard/entrepreneur")) return "/dashboard/entrepreneur/notifications";
  if (pathname?.startsWith("/dashboard/investor")) return "/dashboard/investor/notifications";
  if (pathname?.startsWith("/dashboard/serviceprovider")) return "/dashboard/serviceprovider/notifications";
  if (pathname?.startsWith("/dashboard/admin")) return "/dashboard/admin/notifications";

  const normRole = normalizeUserRole(role);
  const base = ROLE_DASHBOARD_ROUTES[normRole] || "/dashboard/creator";
  return `${base}/notifications`;
}

export function getMessageRouteForRole(role?: unknown, pathname?: string): string {
  // If active pathname provides a clear dashboard context, use it
  if (pathname?.startsWith("/dashboard/creator")) return "/dashboard/creator/messages";
  if (pathname?.startsWith("/dashboard/entrepreneur")) return "/dashboard/entrepreneur/messages";
  if (pathname?.startsWith("/dashboard/investor")) return "/dashboard/investor/messages";
  if (pathname?.startsWith("/dashboard/serviceprovider")) return "/dashboard/serviceprovider/messages";
  if (pathname?.startsWith("/dashboard/admin")) return "/dashboard/admin/messages";

  const normRole = normalizeUserRole(role);
  const base = ROLE_DASHBOARD_ROUTES[normRole] || "/dashboard/creator";
  return `${base}/messages`;
}


