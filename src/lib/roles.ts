export enum UserRole {
  ADMIN = "Admin",
  CREATOR = "Creator",
  INVESTOR = "Investor",
  ENTREPRENEUR = "Entrepreneur",
  ADVISOR = "Advisor",
  FOUNDER = "Founder",
  SERVICE_PROVIDER = "ServiceProvider",
}

export const DEFAULT_USER_ROLE = UserRole.CREATOR;

export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  [UserRole.ADMIN]: "/dashboard/admin",
  [UserRole.CREATOR]: "/dashboard/creator",
  [UserRole.INVESTOR]: "/dashboard/investor",
  [UserRole.ENTREPRENEUR]: "/dashboard/entrepreneur",
  [UserRole.ADVISOR]: "/dashboard/advisor",
  [UserRole.FOUNDER]: "/dashboard/founder",
  [UserRole.SERVICE_PROVIDER]: "/dashboard/serviceprovider",
};

export function normalizeUserRole(input: unknown): UserRole {
  const raw = String(input ?? "").trim().toLowerCase().replace(/[\s_-]/g, "");

  const roleMap: Record<string, UserRole> = {
    admin: UserRole.ADMIN,
    creator: UserRole.CREATOR,
    investor: UserRole.INVESTOR,
    entrepreneur: UserRole.ENTREPRENEUR,
    advisor: UserRole.ADVISOR,
    founder: UserRole.FOUNDER,
    serviceprovider: UserRole.SERVICE_PROVIDER,
  };

  return roleMap[raw] ?? DEFAULT_USER_ROLE;
}
