export enum UserRole {
  ADMIN = "Admin",
  CREATOR = "Creator",
  INVESTOR = "Investor",
  ENTREPRENEUR = "Entrepreneur",
  SERVICE_PROVIDER = "ServiceProvider",
}

export const DEFAULT_USER_ROLE = UserRole.CREATOR;

export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  [UserRole.ADMIN]: "/dashboard/admin",
  [UserRole.CREATOR]: "/dashboard/creator",
  [UserRole.INVESTOR]: "/dashboard/investor",
  [UserRole.ENTREPRENEUR]: "/dashboard/entrepreneur",
  [UserRole.SERVICE_PROVIDER]: "/dashboard/serviceprovider",
};

export function normalizeUserRole(input: unknown): UserRole {
  const raw = String(input ?? "").trim().toLowerCase().replace(/[\s_-]/g, "");

  const roleMap: Record<string, UserRole> = {
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

