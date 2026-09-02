import { describe, it, expect } from 'vitest';
import { UserRole } from '@/lib/roles';

describe('UserRole Enum', () => {
  it('should have all required roles', () => {
    expect(UserRole.SUPERADMIN).toBe('SuperAdmin');
    expect(UserRole.ADMIN).toBe('Admin');
    expect(UserRole.CREATOR).toBe('Creator');
    expect(UserRole.INVESTOR).toBe('Investor');
    expect(UserRole.ENTREPRENEUR).toBe('Entrepreneur');
    expect(UserRole.SERVICE_PROVIDER).toBe('ServiceProvider');
  });

  it('should define 6 distinct roles', () => {
    const roles = Object.values(UserRole);
    expect(roles).toHaveLength(6);
  });

  it('should have correct role values', () => {
    expect(UserRole.SUPERADMIN).toBe('SuperAdmin');
    expect(UserRole.ADMIN).toBe('Admin');
    expect(UserRole.CREATOR).toBe('Creator');
    expect(UserRole.INVESTOR).toBe('Investor');
    expect(UserRole.ENTREPRENEUR).toBe('Entrepreneur');
    expect(UserRole.SERVICE_PROVIDER).toBe('ServiceProvider');
  });

  it('should allow role comparison', () => {
    const userRole: UserRole = UserRole.ADMIN;
    expect(userRole).toBe(UserRole.ADMIN);
    expect(userRole).not.toBe(UserRole.CREATOR);
  });

  it('should be usable in switch statements', () => {
    const role = UserRole.ENTREPRENEUR;
    let dashboard = '';

    switch (role) {
      case UserRole.ADMIN:
        dashboard = 'admin';
        break;
      case UserRole.CREATOR:
        dashboard = 'creator';
        break;
      case UserRole.INVESTOR:
        dashboard = 'investor';
        break;
      case UserRole.ENTREPRENEUR:
        dashboard = 'entrepreneur';
        break;
      case UserRole.SERVICE_PROVIDER:
        dashboard = 'serviceprovider';
        break;
    }

    expect(dashboard).toBe('entrepreneur');
  });

  it('should support role mapping to dashboard routes', () => {
    const roleRoutes: Record<UserRole, string> = {
      [UserRole.ADMIN]: '/dashboard/admin',
      [UserRole.CREATOR]: '/dashboard/creator',
      [UserRole.INVESTOR]: '/dashboard/investor',
      [UserRole.ENTREPRENEUR]: '/dashboard/entrepreneur',
      [UserRole.SERVICE_PROVIDER]: '/dashboard/serviceprovider',
    };

    expect(roleRoutes[UserRole.ADMIN]).toBe('/dashboard/admin');
    expect(roleRoutes[UserRole.ENTREPRENEUR]).toBe('/dashboard/entrepreneur');
  });

  it('should work in conditional checks', () => {
    const userRole = UserRole.CREATOR;

    const isCreator = userRole === UserRole.CREATOR;
    const isAdmin = userRole === UserRole.ADMIN;

    expect(isCreator).toBe(true);
    expect(isAdmin).toBe(false);
  });

  it('should allow role array filtering', () => {
    const userRoles = [UserRole.ADMIN, UserRole.CREATOR];
    const isAdmin = userRoles.includes(UserRole.ADMIN);
    const isInvestor = userRoles.includes(UserRole.INVESTOR);

    expect(isAdmin).toBe(true);
    expect(isInvestor).toBe(false);
  });

  it('should be serializable', () => {
    const role = UserRole.ENTREPRENEUR;
    const serialized = JSON.stringify(role);
    const deserialized = JSON.parse(serialized) as UserRole;

    expect(deserialized).toBe(UserRole.ENTREPRENEUR);
  });

  it('should support role-based access control', () => {
    const grantedRoles = [UserRole.ADMIN, UserRole.CREATOR];
    const userRole = UserRole.ADMIN;

    const hasAccess = grantedRoles.includes(userRole);

    expect(hasAccess).toBe(true);
  });

  describe('getMessageRouteForRole and getNotificationRouteForRole', () => {
    it('resolves message route from pathname dashboard context first', async () => {
      const { getMessageRouteForRole } = await import('@/lib/roles');
      expect(getMessageRouteForRole(UserRole.ENTREPRENEUR, '/dashboard/serviceprovider/workroom'))
        .toBe('/dashboard/serviceprovider/messages');
      expect(getMessageRouteForRole(UserRole.CREATOR, '/dashboard/investor/pipeline'))
        .toBe('/dashboard/investor/messages');
      expect(getMessageRouteForRole(UserRole.INVESTOR, '/dashboard/entrepreneur/phase-3'))
        .toBe('/dashboard/entrepreneur/messages');
      expect(getMessageRouteForRole(UserRole.SERVICE_PROVIDER, '/dashboard/creator/myideas'))
        .toBe('/dashboard/creator/messages');
    });

    it('falls back to role default when pathname has no dashboard context', async () => {
      const { getMessageRouteForRole } = await import('@/lib/roles');
      expect(getMessageRouteForRole(UserRole.ENTREPRENEUR, '/dashboard/profile'))
        .toBe('/dashboard/entrepreneur/messages');
      expect(getMessageRouteForRole(UserRole.SERVICE_PROVIDER, '/dashboard/profile'))
        .toBe('/dashboard/serviceprovider/messages');
    });
  });

  describe('getRoleDashboardRoute and resolvePostLoginRedirect', () => {
    it('returns canonical dashboard for each enum and string role', async () => {
      const { getRoleDashboardRoute, UserRole } = await import('@/lib/roles');
      expect(getRoleDashboardRoute(UserRole.CREATOR)).toBe('/dashboard/creator');
      expect(getRoleDashboardRoute(UserRole.ENTREPRENEUR)).toBe('/dashboard/entrepreneur');
      expect(getRoleDashboardRoute(UserRole.INVESTOR)).toBe('/dashboard/investor');
      expect(getRoleDashboardRoute(UserRole.SERVICE_PROVIDER)).toBe('/dashboard/serviceprovider');
      expect(getRoleDashboardRoute(UserRole.ADMIN)).toBe('/dashboard/admin');
      expect(getRoleDashboardRoute(UserRole.SUPERADMIN)).toBe('/dashboard/admin');

      expect(getRoleDashboardRoute('Creator')).toBe('/dashboard/creator');
      expect(getRoleDashboardRoute('creator')).toBe('/dashboard/creator');
      expect(getRoleDashboardRoute('Entrepreneur')).toBe('/dashboard/entrepreneur');
      expect(getRoleDashboardRoute('Investor')).toBe('/dashboard/investor');
      expect(getRoleDashboardRoute('Service Provider')).toBe('/dashboard/serviceprovider');
      expect(getRoleDashboardRoute('service-provider')).toBe('/dashboard/serviceprovider');
      expect(getRoleDashboardRoute('Admin')).toBe('/dashboard/admin');
      expect(getRoleDashboardRoute('SuperAdmin')).toBe('/dashboard/admin');
    });

    it('resolves post login redirect based on onboarding and roles', async () => {
      const { resolvePostLoginRedirect, UserRole } = await import('@/lib/roles');
      expect(resolvePostLoginRedirect(null)).toBe('/login');
      expect(resolvePostLoginRedirect({ role: UserRole.CREATOR, onboardingPhase: 0 })).toBe('/onboarding');
      expect(resolvePostLoginRedirect({ role: UserRole.CREATOR, onboardingPhase: 1 })).toBe('/dashboard/creator');
      expect(resolvePostLoginRedirect({ role: UserRole.ADMIN, onboardingPhase: 1 })).toBe('/dashboard/admin');
    });

    it('handles callback URLs with validation and fallback', async () => {
      const { resolvePostLoginRedirect, UserRole } = await import('@/lib/roles');
      const user = { role: UserRole.INVESTOR, roles: [UserRole.INVESTOR], onboardingPhase: 1 };
      
      // Valid callback preserved
      expect(resolvePostLoginRedirect(user, '/dashboard/investor/deals')).toBe('/dashboard/investor/deals');
      
      // External URL rejected
      expect(resolvePostLoginRedirect(user, 'https://external-domain.com/phishing')).toBe('/dashboard/investor');
      
      // Unauthorized admin route rejected for non-admin
      expect(resolvePostLoginRedirect(user, '/dashboard/admin/users')).toBe('/dashboard/investor');
    });
  });
});
