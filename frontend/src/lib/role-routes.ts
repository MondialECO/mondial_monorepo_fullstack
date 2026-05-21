import { UserRole } from "@/lib/roles";

// Post-login / post-signup landing routes per role.
// Entrepreneurs start in Phase 1 so the onboarding flow auto-runs.
export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  [UserRole.ADMIN]: "/dashboard/admin",
  [UserRole.CREATOR]: "/dashboard/creator",
  [UserRole.INVESTOR]: "/dashboard/investor",
  [UserRole.ENTREPRENEUR]: "/dashboard/entrepreneur/phase-1",
  [UserRole.SERVICE_PROVIDER]: "/dashboard/serviceprovider",
};
