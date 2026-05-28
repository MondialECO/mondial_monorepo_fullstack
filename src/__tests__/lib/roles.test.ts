import { describe, it, expect } from 'vitest';
import { UserRole } from '@/lib/roles';

describe('UserRole Enum', () => {
  it('should have all required roles', () => {
    expect(UserRole.ADMIN).toBe('Admin');
    expect(UserRole.CREATOR).toBe('Creator');
    expect(UserRole.INVESTOR).toBe('Investor');
    expect(UserRole.ENTREPRENEUR).toBe('Entrepreneur');
    expect(UserRole.ADVISOR).toBe('Advisor');
    expect(UserRole.FOUNDER).toBe('Founder');
    expect(UserRole.SERVICE_PROVIDER).toBe('ServiceProvider');
  });

  it('should define 7 distinct roles', () => {
    const roles = Object.values(UserRole);
    expect(roles).toHaveLength(7);
  });

  it('should have correct role values', () => {
    expect(UserRole.ADMIN).toBe('Admin');
    expect(UserRole.CREATOR).toBe('Creator');
    expect(UserRole.INVESTOR).toBe('Investor');
    expect(UserRole.ENTREPRENEUR).toBe('Entrepreneur');
    expect(UserRole.ADVISOR).toBe('Advisor');
    expect(UserRole.FOUNDER).toBe('Founder');
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
      [UserRole.ADVISOR]: '/dashboard/advisor',
      [UserRole.FOUNDER]: '/dashboard/founder',
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
});
