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
