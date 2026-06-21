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

type BackendRoleSource = {
  roles?: unknown;
  Roles?: unknown;
  role?: unknown;
  Role?: unknown;
  userRole?: unknown;
  UserRole?: unknown;
};

export function parseBackendUserRole(input: BackendRoleSource | null | undefined): UserRole | null {
  if (!input) return null;

  const roles = input.roles ?? input.Roles;
  if (Array.isArray(roles) && roles.length > 0) {
    return parseStrictUserRole(roles[0]);
  }

  return parseStrictUserRole(input.role ?? input.Role ?? input.userRole ?? input.UserRole);
}
