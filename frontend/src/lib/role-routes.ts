import { UserRole } from "@/lib/roles";

// Landing routes per role, used AFTER Phase 1 (universal KYC onboarding)
// is complete. Phase 1 itself lives at /onboarding/* and is role-agnostic.
export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  [UserRole.ADMIN]: "/dashboard/admin",
  [UserRole.CREATOR]: "/dashboard/creator",
  [UserRole.INVESTOR]: "/dashboard/investor",
  [UserRole.ENTREPRENEUR]: "/dashboard/entrepreneur",
  [UserRole.SERVICE_PROVIDER]: "/dashboard/serviceprovider",
};
